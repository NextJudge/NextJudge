---
title: Deployment Guide
description: Choose a production deployment path for NextJudge, configure Postgres and RabbitMQ, and operate the platform reliably at scale.
---

Local setup: [Getting started](/start/getting-started/). This is for servers.

## Pick your deploy path

| Method | When | Command |
| ------ | ---- | ------- |
| **deploy.sh** | First local prod-like test on a VM | `./deploy.sh web` |
| **Prebuilt images** | Prod, CI, anywhere you don't want to compile on the box | `docker compose -f compose/docker-compose.prebuilt.yml up -d` |
| **docker buildx bake** | You changed code and need fresh images | `docker buildx bake -f docker-bake.hcl` |
| **Coolify** | Coolify host | `compose/docker-compose.coolify.yml` |

Rule: dev machines build, prod machines pull. Building Go + judge toolchains on a 2-vCPU VPS during a deploy window is a bad time.

## Environment variables

Set via `.env`, secrets manager, or compose `environment`. Must-haves:

### Data layer

| Variable | Notes |
| -------- | ----- |
| `DB_HOST`, `DB_PASSWORD`, … | Postgres |
| `RABBITMQ_HOST`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | Queue |
| `JWT_SIGNING_SECRET` | Long random string. Rotate = everyone re-logs-in |
| `JUDGE_PASSWORD` | Shared with judge workers |
| `AUTH_PROVIDER_PASSWORD` | Web → API OAuth bridge |
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
| `AUTH_PROVIDER_PASSWORD` | Must match the data layer — used for GitHub OAuth bridge |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials |

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

Firewall **5432**, **5672**, **5000** from the world. Only 443 (or 80 → redirect) public.

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

Throughput ≈ `workers × (1 / avg_submission_seconds)`. Queue depth is your gauge, not CPU on the web container.

## Database ops

- AutoMigrate on data layer boot. **pg_dump before upgrades.**
- No `SEED_DATA` in prod
- Test restore from backup occasionally (untested backups are wishes)

## Health

```bash
curl -sf https://api.yourdomain.com/healthy && echo ok
```

Judges have no HTTP health endpoint. Monitor: queue depth, PENDING age, container restarts.

## Security

- Patch judge images (untrusted code runs inside, not "on" the host, but still)
- Rate-limit `/v1/basic_login` at the proxy
- nsjail ≠ invincible. Network-separate the judge from internal admin tools

## Upgrade playbook

1. `pg_dump`
2. Read changelog / `schema_updates.sql`
3. Pull/build images
4. Restart data layer (migrations) → judges → web
5. Submit a known-AC solution. If that fails, roll back images before investigating novel bugs.

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| API reachable from host, not from browser | `NEXT_PUBLIC_API_URL` points at an internal hostname |
| CORS errors in browser console | `CORS_ORIGIN` missing the web app's public origin |
| Submissions stay `PENDING` | Judge workers down, RabbitMQ auth mismatch, or wrong `JUDGE_PASSWORD` |
| Login succeeds then loops | `NEXTAUTH_URL` does not match the HTTPS URL users visit |
| Judge PATCH returns 401 | `JUDGE_PASSWORD` differs between data layer and judge containers |

Local stack issues: [Getting started troubleshooting](/start/getting-started/#troubleshooting).
