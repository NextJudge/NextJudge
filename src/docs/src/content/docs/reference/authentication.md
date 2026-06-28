---
title: Authentication
description: JWT access tokens for the NextJudge API via email, password or OAuth and how to send them on data layer requests.
---

The data layer uses HS256 JWTs. Authenticated requests send the token in the `Authorization` header as the **raw token string**. No `Bearer` prefix. The web app follows the same convention.

```bash
curl http://localhost:5000/v1/users/YOUR_USER_ID \
  -H "Authorization: eyJhbGciOiJIUzI1NiIs..."
```

If you add `Bearer`, the server parses that entire string as a JWT and returns `Malformed JWT token`.

## Required secrets

The data layer **fails at startup** if these are missing (no auto-generated fallbacks):

| Variable | Purpose |
| -------- | ------- |
| `JWT_SIGNING_SECRET` | Signs user and judge JWTs |
| `JUDGE_PASSWORD` | Judge worker login (`POST /v1/login_judge`) |
| `WEB_BRIDGE_SECRET` | Web → API OAuth bridge (`POST /v1/create_or_login_user`) |

Generate a local `.env` from the repo root:

```bash
./.createenv.sh > .env
```

Set the same `WEB_BRIDGE_SECRET` on the web app (`src/web/.env.local`). The web still accepts deprecated `AUTH_PROVIDER_PASSWORD` as a fallback; prefer `WEB_BRIDGE_SECRET`.

Auth is always enforced in production and in tests. There is no `AUTH_DISABLED` shortcut.

## Three ways in

| Path | Who uses it | Endpoint |
| ---- | ----------- | -------- |
| Email/password | Scripts, curl, integrations | `POST /v1/basic_register`, `POST /v1/basic_login` |
| OAuth (GitHub, etc.) | Web app via NextAuth | `POST /v1/create_or_login_user` |
| Judge worker | Python judge service | `POST /v1/login_judge` |

Most integrators use **basic_login**. The web app uses **create_or_login_user** after OAuth succeeds.

## Register and log in (API)

```bash
curl -X POST http://localhost:5000/v1/basic_register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ada",
    "email": "ada@example.com",
    "password": "example-password"
  }'
```

Success response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "ada",
  "email": "ada@example.com",
  "image": ""
}
```

Save `token` and `id`. Submissions require `user_id` in the body and the token in the header.

Login uses the same request shape:

```bash
curl -X POST http://localhost:5000/v1/basic_login \
  -H "Content-Type: application/json" \
  -d '{"email": "ada@example.com", "password": "example-password"}'
```

Wrong password returns `401` with `{"error":"Invalid credentials","code":"INVALID_CREDENTIALS"}`. The response does not indicate whether the email exists.

## Admin accounts

Set `ADMIN_EMAILS` in your env (comma-separated). Any account registered with a matching email gets `is_admin: true` and a JWT with admin role.

```bash
# .env.dev example
ADMIN_EMAILS=admin@example.com
```

There is no separate bootstrap step. Register with that email to receive admin access. In `./dev-deploy.sh`, seed data may preload users; check the UI or query `/v1/users` as an authenticated admin.

## JWT contents

Tokens are signed with `JWT_SIGNING_SECRET`. Claims:

| Claim | Type | Meaning |
| ----- | ---- | ------- |
| `id` | UUID | User ID (nil UUID for judge tokens) |
| `role` | int | `0` = user, `1` = judge, `2` = admin |

The middleware checks that the user still exists. Deleting an account invalidates existing tokens immediately.

## OAuth flow (web app)

After GitHub (or credentials) login, NextAuth calls:

```bash
curl -X POST http://localhost:5000/v1/create_or_login_user \
  -H "Authorization: YOUR_WEB_BRIDGE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github-12345",
    "name": "ada",
    "email": "ada@example.com",
    "image": "https://avatars.githubusercontent.com/..."
  }'
```

The `Authorization` value here is **`WEB_BRIDGE_SECRET`**, not a JWT. Only your web server should hold this secret. It proves the request came from your auth layer.

Response matches basic login: `token`, `id`, `name`, `email`.

## Judge authentication

Workers authenticate at startup (or per request internally):

```bash
curl -X POST http://localhost:5000/v1/login_judge \
  -H "Authorization: YOUR_JUDGE_PASSWORD"
```

Returns `{"token":"..."}`. That token has `role: 1` and can PATCH submissions and fetch test cases.

`JUDGE_PASSWORD` must match on both the data layer and judge containers. A mismatch leaves submissions in `PENDING` while RabbitMQ delivers messages to workers that cannot write results back.

## Password reset

Production flow uses one-time tokens stored in the database (1 hour TTL):

```bash
# Step 1 — request a token (always returns {"status":"ok"}; no email is sent yet)
curl -X POST http://localhost:5000/v1/basic_request_password_reset \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}'

# Step 2 — reset with email + token + new password
curl -X POST http://localhost:5000/v1/basic_reset_password \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","token":"...","new_password":"new-secret"}'
```

The web app wraps these as `POST /api/auth/request-password-reset` and `POST /api/auth/reset-password`.

Both API steps return `{"status":"ok"}` even if the email is not found (anti-enumeration). Invalid or expired tokens return `401`.

### Dev-only flags

| Variable | When to use |
| -------- | ----------- |
| `PASSWORD_RESET_DEBUG=true` | Local dev or E2E: step 1 also returns `token` in the JSON response so you can test without email |
| `ALLOW_INSECURE_PASSWORD_RESET=true` | Local scripts only: step 2 accepts `email` + `new_password` with no `token` |

Leave both **`false`** in production. Coolify prod should set them explicitly to `false` alongside `TRUSTED_PROXY=true`.

`RESEND_API_KEY` in `src/web/.env.example` is for other email features (waitlist), not wired to password reset today.

## Common mistakes

**`Bearer eyJ...`** → 401 Malformed JWT. Omit the prefix.

**Token works but POST /v1/problems returns 403** → admin role required. Check `is_admin` on your user or register with an `ADMIN_EMAILS` address.

**401 User account no longer exists** → account was deleted. Register again (new UUID).

Next: [API reference](/reference/api/) for endpoints that consume these tokens.
