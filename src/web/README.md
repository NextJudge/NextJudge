<p align="center"><img src="https://i.ibb.co/cg8YFt5/preview.png" width="560" height="300" /></p>

<h1 align="center">NextJudge - Web Platform</h1>

<div align="center">

The frontend web application for the [NextJudge][site-url] platform.

![Last commit][last-commit-image]
![:)][with-love-image]
![Licese][license-image]

[site-url]: https://nextjudge.org
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

# GitHub OAuth2

Homepage URL

```
http://localhost:8080
```

Authorization callback URL

```
http://localhost:8080/api/auth/callback/github
```

### TODO

-   [ ] Support team infrastructure and registration
-   [ ] Refactor notification system
-   [ ] Extract a lot of state to `useReducer` and zustand stores
-   [ ] Re-do landing page and marketing materials
-   [ ] Allow contest organizers to prematurely end contests

## Things to note

-   Admin emails are configured in the `../data-layer/docker-compose.dev.yml`. `ADMIN_EMAILS`. It's a comma separated list of emails.
