---
title: Configuration
description: Environment files, secrets, GitHub OAuth, optional Elasticsearch and Coolify deployment settings.
---

NextJudge splits configuration across the **backend** (Docker Compose) and the **web app** (Next.js). This page covers both.

## Environment file overview

| File | Used by | Purpose |
| ---- | ------- | ------- |
| `.env.example` (repo root) | Reference | Template for backend secrets and security flags |
| `.env` (repo root) | `./deploy.sh` | Prod-like local stack; no seed by default |
| `.env.dev` (repo root) | `./dev-deploy.sh` | Dev stack: hot reload, `SEED_DATA=true` |
| `src/web/.env.local` | `npm run dev` / `npm start` on host | Auth.js, API URL, bridge secret |

Generate backend secrets once:

```bash
./.createenv.sh > .env
```

For development, copy the same output to `.env.dev`:

```bash
cp .env .env.dev
```

Add dev-only keys to `.env.dev` as needed (see below). `.env.dev` is gitignored — create it locally; do not commit secrets.

Copy `WEB_BRIDGE_SECRET` from root env into `src/web/.env.local` whenever the web app runs **outside** Docker.

---

## Backend secrets (data layer + judge)

Required — data layer **fails at startup** without these:

| Variable | Purpose |
| -------- | ------- |
| `JWT_SIGNING_SECRET` | Signs user and judge JWTs |
| `JUDGE_PASSWORD` | Judge login (`POST /v1/login_judge`) |
| `WEB_BRIDGE_SECRET` | Web → API OAuth bridge |
| `DB_PASSWORD` | Postgres |
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | Message queue |

Optional backend keys:

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `ADMIN_EMAILS` | — | Comma-separated; matching emails get admin on register |
| `CORS_ORIGIN` | `http://localhost:8080` | Web origin(s), comma-separated; wildcards are rejected |
| `CORS_ALLOW_PREVIEW` | `false` | Allow `{id}-web.preview.nextjudge.net` origins |
| `TRUSTED_PROXY` | `false` | Trust `X-Forwarded-For` for auth rate limits (set `true` behind Traefik/nginx in production) |
| `PASSWORD_RESET_DEBUG` | `false` | Dev/E2E only: include reset token in `basic_request_password_reset` response — **never enable in production** |
| `ALLOW_INSECURE_PASSWORD_RESET` | `false` | Dev only: allow `basic_reset_password` without a token — **never enable in production** |
| `SEED_DATA` | `false` | `true` in dev compose — sample users/problems/events |
| `ELASTIC_ENABLED` | `false` | Problem search index (optional) |
| `ELASTIC_ENDPOINT` | `http://localhost:9200` | Elasticsearch URL when enabled |

Full lists: `src/data-layer/src/config.go`, judge `src/judge/src/config.py`.

---

## Web app secrets

Copy `src/web/.env.example` → `src/web/.env.local`:

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `AUTH_SECRET` | Yes | Auth.js session encryption |
| `WEB_BRIDGE_SECRET` | Yes | Must match data layer |
| `AUTH_GITHUB_ID` | For GitHub login | OAuth app client ID |
| `AUTH_GITHUB_SECRET` | For GitHub login | OAuth app client secret |
| `NEXT_PUBLIC_API_URL` | Self-hosted prod | Set at **`next build`**. Local `next dev` uses `http://localhost:5000` |
| `NEXTAUTH_URL` | Self-hosted prod | Public HTTPS URL of the web app |
| `RESEND_API_KEY` | Optional | Email (waitlist, etc.) |

Deprecated fallback on web: `AUTH_PROVIDER_PASSWORD` — use `WEB_BRIDGE_SECRET`.

---

## GitHub OAuth setup

### 1. Create a GitHub OAuth App

**Settings → Developer settings → OAuth Apps → New OAuth App**

| Field | Local dev | Production |
| ----- | --------- | ---------- |
| Homepage URL | `http://localhost:8080` | `https://yourdomain.com` |
| Authorization callback URL | `http://localhost:8080/api/auth/callback/github` | `https://yourdomain.com/api/auth/callback/github` |

### 2. Wire environment variables

**Web** (`src/web/.env.local`):

```
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_SECRET=...
WEB_BRIDGE_SECRET=...    # same as data layer
NEXTAUTH_URL=http://localhost:8080
```

**Data layer** (`.env` or `.env.dev`):

```
WEB_BRIDGE_SECRET=...    # same value
```

### 3. Flow

After GitHub login, Auth.js calls `POST /v1/create_or_login_user` with `Authorization: WEB_BRIDGE_SECRET`. Details: [Authentication](/reference/authentication/#oauth-flow-web-app).

### Common failures

| Symptom | Fix |
| ------- | --- |
| GitHub works but no platform session | `WEB_BRIDGE_SECRET` mismatch |
| Redirect loop after login | `NEXTAUTH_URL` ≠ URL in the browser |
| CORS errors | Add web origin to `CORS_ORIGIN` on data layer |

### PR previews (Coolify)

Preview URLs: `https://{PR_NUMBER}-web.preview.nextjudge.net`. Register matching callback URLs per preview or use a wildcard app. Set `CORS_ALLOW_PREVIEW=true` on the backend.

---

## Elasticsearch (optional)

Elasticsearch is **off by default**. Core features (problems, contests, judging) work without it.

When `ELASTIC_ENABLED=true`:

- Data layer connects to `ELASTIC_ENDPOINT` at startup — **failure to connect exits the process**.
- Indices `nextjudge-problems` and `nextjudge-competitions` are created if missing.
- `GET /v1/problems?query=` uses search when enabled.

### Enable locally

1. Uncomment the `elasticsearch` service in `compose/docker-compose.dev.yml` (or backend compose).
2. Uncomment `depends_on: elasticsearch` on the data layer.
3. Set `ELASTIC_ENABLED=true` in `.env.dev`.
4. Start the stack.

`./dev-deploy.sh` currently forces `ELASTIC_ENABLED=false` on the command line even when the elastic profile is enabled — override in compose or run compose manually if you need ES in dev.

Standalone definition: `src/data-layer/docker-compose.elasticsearch.yml` (ES 8.12, port 9200).

---

## Coolify deployment

Use `compose/docker-compose.coolify.yml` for the **backend stack** on a Coolify host.

### Backend env (Coolify application)

```
DB_PASSWORD
WEB_BRIDGE_SECRET
JUDGE_PASSWORD
JWT_SIGNING_SECRET
RABBITMQ_USER
RABBITMQ_PASSWORD
CORS_ORIGIN=https://yourdomain.com
CORS_ALLOW_PREVIEW=true
TRUSTED_PROXY=true
PASSWORD_RESET_DEBUG=false
ALLOW_INSECURE_PASSWORD_RESET=false
ADMIN_EMAILS=admin@example.com
```

Set these on the Coolify **service** (Docker Compose stack), not the web application. The backend service UUID is `COOLIFY_BACKEND_SERVICE_UUID` in GitHub Actions.

Images: `tnyuma/nextjudge-core:latest`, `tnyuma/nextjudge-judge:latest`. Build fresh with `docker buildx bake -f docker-bake.hcl`.

The Coolify compose file **does not** include the web app or Elasticsearch. Deploy `src/web` as a separate Coolify application.

### Web app on Coolify

Set at **build time**:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
AUTH_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
WEB_BRIDGE_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
```

Route the API subdomain to the data-layer service (`expose: 5000` internally).

More production detail: [Deployment guide](/guides/deployment/).

---

## Quick matrix

| Secret | Data layer | Judge | Web |
| ------ | :--------: | :---: | :-: |
| `JWT_SIGNING_SECRET` | ✓ | | |
| `JUDGE_PASSWORD` | ✓ | ✓ | |
| `WEB_BRIDGE_SECRET` | ✓ | | ✓ |
| `DB_PASSWORD` | ✓ | | |
| `RABBITMQ_*` | ✓ | ✓ | |
| `TRUSTED_PROXY` | ✓ | | |
| `PASSWORD_RESET_DEBUG` | ✓ | | |
| `ALLOW_INSECURE_PASSWORD_RESET` | ✓ | | |
| `AUTH_SECRET` | | | ✓ |
| `AUTH_GITHUB_*` | | | ✓ |
| `NEXTAUTH_URL` | | | ✓ |
| `NEXT_PUBLIC_API_URL` | | | ✓ (build) |
