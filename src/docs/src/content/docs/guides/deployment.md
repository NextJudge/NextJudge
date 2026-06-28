---
title: Deployment Guide
description: Production deployment paths, environment variables, networking and operations for NextJudge at scale.
---

Local setup: [Getting started](/start/getting-started/). Environment and OAuth detail: [Configuration](/guides/configuration/).

## Pick your deploy path

| Method | When | Command / file |
| ------ | ---- | -------------- |
| **deploy.sh** | First prod-like test on a VM | `./deploy.sh web` |
| **Prebuilt images** | Production without local build | `docker compose -f compose/docker-compose.prebuilt.yml up -d` |
| **docker buildx bake** | Fresh images after code changes | `docker buildx bake -f docker-bake.hcl` |
| **Coolify** | Coolify-managed host | `compose/docker-compose.coolify.yml` |

Build images on development machines or in CI. Pull prebuilt images on production hosts to avoid compiling Go and judge toolchains during deploy windows.

---

## Environment variables

See [Configuration](/guides/configuration/) for the full matrix. Summary:

### Data layer (required)

`DB_PASSWORD`, `JWT_SIGNING_SECRET`, `JUDGE_PASSWORD`, `WEB_BRIDGE_SECRET`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`

### Data layer (production)

| Variable | Notes |
| -------- | ----- |
| `CORS_ORIGIN` | Web origin(s), comma-separated; no wildcards |
| `CORS_ALLOW_PREVIEW` | `true` for Coolify PR previews |
| `TRUSTED_PROXY` | `true` when the API sits behind Coolify Traefik or another reverse proxy |
| `PASSWORD_RESET_DEBUG` | **`false`** in prod (dev/E2E only) |
| `ALLOW_INSECURE_PASSWORD_RESET` | **`false`** in prod (dev only) |
| `ADMIN_EMAILS` | Admin bootstrap emails |
| `SEED_DATA` | **`false`** in prod |
| `ELASTIC_ENABLED` | `true` only if Elasticsearch is deployed |
| `CORS_ALLOW_PREVIEW` | `true` for Coolify PR previews |

### Web (build-time + runtime)

`NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `WEB_BRIDGE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`

Generate backend secrets: `./.createenv.sh > .env`

---

## Network layout

```
Internet → TLS proxy → web :8080
                         ↓ (internal)
                    data layer :5000
                         ↓
              Postgres, RabbitMQ (never public)
                         ↑
                    judge workers (internal only)
```

Block **5432**, **5672** from the public internet. Expose **443** to users. The API (`5000`) should be reachable from the web app and judges — typically internal or a separate `api.` subdomain, not open to arbitrary clients without rate limiting.

---

## TLS proxy (nginx sketch)

### Web app

```nginx
server {
    listen 443 ssl;
    server_name nextjudge.example.com;
    ssl_certificate     /etc/letsencrypt/live/nextjudge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextjudge.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `NEXTAUTH_URL=https://nextjudge.example.com`.

### API (optional separate subdomain)

```nginx
server {
    listen 443 ssl;
    server_name api.nextjudge.example.com;
    ssl_certificate     /etc/letsencrypt/live/api.nextjudge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nextjudge.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `NEXT_PUBLIC_API_URL=https://api.nextjudge.example.com` at web **build** time. Set `CORS_ORIGIN=https://nextjudge.example.com` on the data layer. Set `TRUSTED_PROXY=true` on the data layer so rate limits use the client IP from `X-Forwarded-For`.

---

## Coolify

Deploy the **backend** with `compose/docker-compose.coolify.yml`:

- Images: `tnyuma/nextjudge-core:latest`, `tnyuma/nextjudge-judge:latest`
- Data layer uses `expose: 5000` — route via Coolify proxy to your API domain
- Does **not** include web or Elasticsearch

Deploy **web** as a separate Coolify application from `src/web`. Required build env: `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `WEB_BRIDGE_SECRET`, GitHub OAuth vars.

Backend Coolify env: same secrets as [Configuration — Coolify](/guides/configuration/#coolify-deployment).

PR previews: CI deploys per-PR stacks at `https://{PR}-web|docs|api.preview.nextjudge.net`. Enable preview deployments on the Coolify web, docs, and backend service. Set `CORS_ALLOW_PREVIEW=true` on the backend. Preview web omits `NEXT_PUBLIC_API_URL` (runtime routing to `{PR}-api`). GitHub OAuth uses the production redirect proxy — see [Configuration — PR previews](/guides/configuration/#pr-previews-coolify).

---

## Elasticsearch (optional)

Off by default. Enables `GET /v1/problems?query=` when `ELASTIC_ENABLED=true`. Requires a reachable cluster at `ELASTIC_ENDPOINT` — startup **fails** if ES is enabled but unreachable.

Not included in Coolify compose. To enable on a custom stack, uncomment the elasticsearch service in compose, set `ELASTIC_ENABLED=true`, and see [Configuration](/guides/configuration/#elasticsearch-optional).

---

## Scale judges

```bash
docker compose -f compose/docker-compose.backend.yml up -d --scale nextjudge-judge=3
```

Throughput scales roughly with `workers × (1 / avg_submission_seconds)`. Monitor queue depth rather than web container CPU.

---

## Database ops

- GORM AutoMigrate on data layer boot. **pg_dump before upgrades.**
- Review `src/data-layer/src/schema_updates.sql` for manual migration notes
- No `SEED_DATA` in prod
- Test restore from backup on a schedule

---

## Health

```bash
curl -sf https://api.yourdomain.com/healthy && echo ok
```

Also available: `GET /health`, `GET /`. Judges have no HTTP health endpoint — monitor queue depth, PENDING age and container restarts.

---

## Security

- Patch judge images regularly
- Rate-limit `/v1/basic_login`, `/v1/basic_register`, and password-reset routes at the proxy
- Set `TRUSTED_PROXY=true` on the data layer when it runs behind a reverse proxy
- Keep `PASSWORD_RESET_DEBUG=false` and `ALLOW_INSECURE_PASSWORD_RESET=false` in production
- Network-separate judge workers from internal admin tools
- Password reset requires a one-time token (see [Authentication — Password reset](/reference/authentication/#password-reset))

---

## Upgrade playbook

1. `pg_dump`
2. Read `src/data-layer/src/schema_updates.sql` and release notes for your version
3. Pull or build images (`docker buildx bake` or prebuilt pull)
4. Restart data layer (migrations) → judges → web
5. Submit a known-AC solution. If that fails, roll back images before investigating new issues.

---

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| API reachable from host, not from browser | `NEXT_PUBLIC_API_URL` points at an internal hostname |
| CORS errors in browser console | `CORS_ORIGIN` missing the web app's public origin |
| Submissions stay `PENDING` | Judge workers down, RabbitMQ auth mismatch, or wrong `JUDGE_PASSWORD` |
| Login succeeds then loops | `NEXTAUTH_URL` does not match the HTTPS URL users visit |
| Judge PATCH returns 401 | `JUDGE_PASSWORD` differs between data layer and judge containers |
| Data layer won't start with ES enabled | Elasticsearch unreachable at `ELASTIC_ENDPOINT` |

Local stack: [Getting started troubleshooting](/start/getting-started/#troubleshooting).
