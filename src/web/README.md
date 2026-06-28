<p align="center"><img src="https://i.ibb.co/cg8YFt5/preview.png" width="560" height="300" /></p>

<h1 align="center">NextJudge - Web Platform</h1>

<div align="center">

The frontend web application for the [NextJudge][site-url] platform.

![Last commit][last-commit-image]
![:)][with-love-image]
![Licese][license-image]

[site-url]: https://nextjudge.net
[license-image]: https://img.shields.io/github/license/nextjudge/nextjudge?style=flat-square&color=dc4405
[last-commit-image]: https://img.shields.io/github/last-commit/nextjudge/nextjudge?display_timestamp=committer&style=flat-square&logo=github&color=dc4405
[with-love-image]: https://img.shields.io/badge/made_with_love_in_oregon-%E2%9D%A4-dc4405?style=flat-square&color=dc4405

</div>

## Build and run

```sh
npm run build
npm start
```

## Development

1. Copy `.env.example` to `.env.local` and fill in the necessary environment variables.

```bash
cp .env.example .env.local
```

Required for OAuth: `AUTH_SECRET`, `WEB_BRIDGE_SECRET` (must match the data layer), and GitHub app credentials. `WEB_BRIDGE_SECRET` replaces deprecated `AUTH_PROVIDER_PASSWORD`.

```bash
# generate data-layer + web bridge secrets at repo root
./.createenv.sh > .env
# copy WEB_BRIDGE_SECRET from .env into src/web/.env.local
```

2. Install dependencies.

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

3. Start the local development server.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

## E2E tests (Playwright)

Runs against an isolated Docker stack — not production.

```bash
# from repo root (CI-style: start stack, test, tear down)
./scripts/run-e2e-tests.sh

# iterate locally
./scripts/start-e2e-stack.sh
./scripts/run-e2e-playwright.sh e2e/auth.spec.ts
./scripts/stop-e2e-stack.sh
```

Specs and stack config: `e2e/`. See the [development guide](https://github.com/NextJudge/NextJudge/blob/main/src/docs/src/content/docs/guides/development.md#tests) for details.

## Coolify PR previews

Preview web hostnames (`{PR}-web.preview.nextjudge.net`) route API traffic to `{PR}-api.preview.nextjudge.net` at runtime — do not set `NEXT_PUBLIC_API_URL` on preview web builds.

GitHub OAuth callbacks stay on production (`https://nextjudge.net/api/auth/callback/github`). Set `AUTH_REDIRECT_PROXY_URL=https://nextjudge.net/api/auth` and `AUTH_TRUST_HOST=true` on production and preview web. Preview web must share `AUTH_SECRET` with production and use preview-specific `WEB_BRIDGE_SECRET` (matching the preview backend).

# GitHub OAuth2

Homepage URL

```
http://localhost:8080
```

Authorization callback URL

```
http://localhost:8080/api/auth/callback/github
```

### Things to note

-   Admin emails are configured in the `../data-layer/docker-compose.dev.yml`. `ADMIN_EMAILS`. It's a comma separated list of emails.
