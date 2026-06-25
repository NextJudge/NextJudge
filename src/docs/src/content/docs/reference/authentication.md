---
title: Authentication
description: Obtain JWT access tokens for the NextJudge API using email, password, or OAuth, and authenticate requests to the data layer.
---

The data layer uses HS256 JWTs. Every authenticated request sends the token in the `Authorization` header as the **raw token string**. No `Bearer` prefix. (That's how the web app does it too.)

```bash
curl http://localhost:5000/v1/users/YOUR_USER_ID \
  -H "Authorization: eyJhbGciOiJIUzI1NiIs..."
```

If you add `Bearer`, the server will try to parse that whole string as a JWT and you'll get `Malformed JWT token`.

## Three ways in

| Path | Who uses it | Endpoint |
| ---- | ----------- | -------- |
| Email/password | Scripts, curl, integrations | `POST /v1/basic_register`, `POST /v1/basic_login` |
| OAuth (GitHub, etc.) | Web app via NextAuth | `POST /v1/create_or_login_user` |
| Judge worker | Python judge service | `POST /v1/login_judge` |

Most integrators want **basic_login**. The web app uses **create_or_login_user** after OAuth succeeds.

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

Success looks like:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "ada",
  "email": "ada@example.com",
  "image": ""
}
```

Save `token` and `id`. You'll need both for submissions (`user_id` in the body, token in the header).

Login is the same shape:

```bash
curl -X POST http://localhost:5000/v1/basic_login \
  -H "Content-Type: application/json" \
  -d '{"email": "ada@example.com", "password": "example-password"}'
```

Wrong password → `401` with `{"error":"Invalid credentials","code":"INVALID_CREDENTIALS"}`. No hints about whether the email exists. Good.

## Admin accounts

Set `ADMIN_EMAILS` in your env (comma-separated). Any account registered with a matching email gets `is_admin: true` and a JWT with admin role.

```bash
# .env.dev example
ADMIN_EMAILS=admin@example.com
```

No separate "bootstrap admin" step. Register with that email and you're admin. In `./dev-deploy.sh`, seed data may also preload users; check the UI or query `/v1/users` if auth is disabled in tests.

## JWT contents

Tokens are signed with `JWT_SIGNING_SECRET`. Claims:

| Claim | Type | Meaning |
| ----- | ---- | ------- |
| `id` | UUID | User ID (nil UUID for judge tokens) |
| `role` | int | `0` = user, `1` = judge, `2` = admin |

The middleware checks that the user still exists. Delete your account and old tokens stop working immediately.

## OAuth flow (web app)

After GitHub (or credentials) login, NextAuth calls:

```bash
curl -X POST http://localhost:5000/v1/create_or_login_user \
  -H "Authorization: YOUR_AUTH_PROVIDER_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github-12345",
    "name": "ada",
    "email": "ada@example.com",
    "image": "https://avatars.githubusercontent.com/..."
  }'
```

The `Authorization` value here is **`AUTH_PROVIDER_PASSWORD`**, not a JWT. Only your web server should hold this secret. It proves the request came from your auth layer, not a random client.

Response matches basic login: `token`, `id`, `name`, `email`.

## Judge authentication

Workers authenticate once at startup (or per request internally):

```bash
curl -X POST http://localhost:5000/v1/login_judge \
  -H "Authorization: YOUR_JUDGE_PASSWORD"
```

Returns `{"token":"..."}`. That token has `role: 1` and can PATCH submissions and fetch test cases.

`JUDGE_PASSWORD` must match on both the data layer and judge containers. Mismatch = submissions sit in `PENDING` forever while RabbitMQ happily delivers messages to a worker that can't write results back.

## Dev shortcut: auth disabled

When `AUTH_DISABLED=true`, most routes skip JWT validation. Tests use this. There's also:

```bash
curl -X POST http://localhost:5000/v1/auth_test/user_creds
```

Returns a throwaway user + token. Only available when auth is disabled. Do not enable that in production.

## Password reset

```bash
POST /v1/basic_request_password_reset   # body: {"email":"..."}
POST /v1/basic_reset_password           # body: {"email":"...","new_password":"..."}
```

Both return `{"status":"ok"}` even if the email isn't found (anti-enumeration). Reset is direct email + new password for now, no magic link token.

## Common mistakes

**`Bearer eyJ...`** → 401 Malformed JWT. Drop the prefix.

**Token works but POST /v1/problems returns 403** → you need admin role. Check `is_admin` on your user or use an `ADMIN_EMAILS` address.

**401 User account no longer exists** → you deleted the account or an admin did. Register again (new UUID, fresh slate).

Next: [API reference](/reference/api/) for endpoints that consume these tokens.
