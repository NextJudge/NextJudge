---
title: Deployment Guide
description: Production deployment paths, environment variables, networking and operations for NextJudge at scale.
---

Local setup: [Getting started](/start/getting-started/). This page covers server deployment.

## Pick your deploy path

| Method | When | Command |
| ------ | ---- | ------- |
| **deploy.sh** | First prod-like test on a VM | `./deploy.sh web` |
| **Prebuilt images** | Production, CI, hosts without build toolchains | `docker compose -f compose/docker-compose.prebuilt.yml up -d` |
| **docker buildx bake** | Fresh images after code changes | `docker buildx bake -f docker-bake.hcl` |
| **Coolify** | Coolify host | `compose/docker-compose.coolify.yml` |

Build images on development machines or in CI. Pull prebuilt images on production hosts to avoid compiling Go and judge toolchains during deploy windows.

## Environment variables

Set via `.env`, a secrets manager or compose `environment`. Required variables:

### Data layer

| Variable | Notes |
| -------- | ----- |
| `DB_HOST`, `DB_PASSWORD`, … | Postgres |
| `RABBITMQ_HOST`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | Queue |
| `JWT_SIGNING_SECRET` | Long random string. **Required** — data layer won't start without it. Rotation invalidates existing sessions |
| `JUDGE_PASSWORD` | **Required.** Shared with judge workers |
| `WEB_BRIDGE_SECRET` | **Required.** Shared with web app — protects GitHub OAuth bridge (`POST /v1/create_or_login_user`). `AUTH_PROVIDER_PASSWORD` still works but is deprecated |
| `CORS_ORIGIN` | Your web origin(s), comma-separated |
| `ADMIN_EMAILS` | Comma-separated admin bootstrap emails |
| `SEED_DATA` | **`false`** in prod |
| `ELASTIC_ENABLED` | `true` only if ES is deployed |

### Judge

Same RabbitMQ + `NEXTJUDGE_HOST`/`PORT` + matching `JUDGE_PASSWORD`.

### Web

| Variable | Notes |
| -------- | ----- |
| `NEXT_PUBLIC_API_URL` | Public API URL the browser and server use (e.g. `https://api.yourdomain.com`). Set at **build** time (`next build`). If unset on a deployed build, defaults to `https://api.nextjudge.net`. Local `next dev` ignores remote values and uses `http://localhost:5000`. |
| `AUTH_SECRET` | Session encryption (Auth.js) |
| `NEXTAUTH_URL` | Public HTTPS URL of the web app (also used to derive app links when self-hosting) |
| `WEB_BRIDGE_SECRET` | Same value as data layer — GitHub OAuth bridge |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials |

Copy `src/web/.env.example` → `.env.local` for local dev. Root `.env.example` lists data-layer secrets; run `./.createenv.sh` to generate values.

Full lists: `config.go`, judge `app.py`, web `.env.example`.

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

Block **5432**, **5672** and **5000** from the public internet. Expose only 443 (or 80 with redirect to HTTPS).

## TLS proxy (nginx sketch)

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

Set `NEXTAUTH_URL=https://nextjudge.example.com`. A mismatch with the URL in the browser causes login redirect loops.

## Scale judges

```bash
docker compose -f compose/docker-compose.backend.yml up -d --scale nextjudge-judge=3
```

Throughput scales roughly with `workers × (1 / avg_submission_seconds)`. Monitor queue depth rather than web container CPU.

## Database ops

- AutoMigrate on data layer boot. **pg_dump before upgrades.**
- No `SEED_DATA` in prod
- Test restore from backup on a schedule

## Health

```bash
curl -sf https://api.yourdomain.com/healthy && echo ok
```

Judges have no HTTP health endpoint. Monitor queue depth, PENDING age and container restarts.

## Security

- Patch judge images regularly
- Rate-limit `/v1/basic_login` at the proxy
- Network-separate judge workers from internal admin tools

## Upgrade playbook

1. `pg_dump`
2. Read changelog / `schema_updates.sql`
3. Pull/build images
4. Restart data layer (migrations) → judges → web
5. Submit a known-AC solution. If that fails, roll back images before investigating new issues.

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| API reachable from host, not from browser | `NEXT_PUBLIC_API_URL` points at an internal hostname |
| CORS errors in browser console | `CORS_ORIGIN` missing the web app's public origin |
| Submissions stay `PENDING` | Judge workers down, RabbitMQ auth mismatch, or wrong `JUDGE_PASSWORD` |
| Login succeeds then loops | `NEXTAUTH_URL` does not match the HTTPS URL users visit |
| Judge PATCH returns 401 | `JUDGE_PASSWORD` differs between data layer and judge containers |

Local stack issues: [Getting started troubleshooting](/start/getting-started/#troubleshooting).
