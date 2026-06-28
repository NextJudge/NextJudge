---
title: Development Guide
description: Local development setup for the web app, data layer and judge worker with Docker, tests and CI.
---

After [`./dev-deploy.sh web`](/start/getting-started/), use this page to work on individual services.

## Prerequisites

| Tool | Version | For |
| ---- | ------- | --- |
| Docker | 20.10+ | Compose stacks |
| Go | 1.24+ | Data layer |
| Node / Bun | 18+ | Web |
| Python | 3.10+ | Judge + Tavern tests |
| Git | any | PRs |

## Layout

```
NextJudge/
├── compose/              # docker-compose.*.yml
├── scripts/              # run-e2e-tests.sh, run-data-layer-tests.sh, start-e2e-stack.sh, …
├── src/
│   ├── data-layer/src/ # Go handlers (users.go, problems.go, …)
│   ├── judge/          # languages.toml, nsjail, app.py
│   ├── web/src/app/    # Next.js routes
│   ├── cli/            # nextjudge command
│   └── docs/           # this site
├── deploy.sh           # prod-ish local stack
├── dev-deploy.sh       # hot reload + SEED_DATA
└── fully-reset.sh      # wipe local data and volumes
```

## Files you'll edit

| Task | Start here |
| ---- | ---------- |
| API bug / new endpoint | `src/data-layer/src/*.go`, then `tests/test_data_layer.tavern.yaml` |
| Wrong verdict / TLE | `src/judge/src/`, `languages.toml` |
| UI / editor | `src/web/src/app/`, `src/web/src/components/` |
| Server state / polling | `src/web/src/hooks/queries/`, `src/web/src/providers/query-provider.tsx` |
| Editor UI state | `src/web/src/lib/stores/editor-store.ts` |
| Problem form validation | `src/web/src/lib/schemas/problem-form.ts` |
| Types shared with API | `src/web/src/lib/types.ts`, `src/web/src/lib/api.ts` |
| Schema change | `src/data-layer/src/models.go`, maybe `schema_updates.sql` |

## Tests

**Web (Playwright — isolated local docker stack, not production):**

```bash
# Smoke tests only (no judge build) — matches most CI web PRs
E2E_WITH_JUDGE=0 ./scripts/run-e2e-tests.sh

# Full suite including code run/submit (needs judge image)
E2E_WITH_JUDGE=1 ./scripts/run-e2e-tests.sh

# Pull a prebuilt judge image instead of building locally (~3 min saved)
E2E_WITH_JUDGE=1 E2E_JUDGE_USE_PULL=1 ./scripts/run-e2e-tests.sh

# Local iteration — start once, rerun only what you changed
./scripts/start-e2e-stack.sh
./scripts/run-e2e-playwright.sh --grep-invert @judge
E2E_WITH_JUDGE=1 ./scripts/start-e2e-stack.sh
./scripts/run-e2e-playwright.sh --grep @judge
./scripts/stop-e2e-stack.sh

# Or from src/web when the stack is already up:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm run test:e2e:smoke
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm run test:e2e:judge
```

Constants and stack config live in `src/web/e2e/` (`constants.ts`, `test-stack.config.sh`, `docker-compose.yml`). The `@judge` tag marks specs that need the judge worker (`platform.spec.ts`).

The E2E stack sets `PASSWORD_RESET_DEBUG=true` on the data layer so tests can complete password reset without email delivery. Do not copy that flag to production.

**Data layer:**

```bash
./scripts/run-data-layer-tests.sh
# or manually:
cd src/data-layer
pip install -r tests/requirements.txt
pytest tests/ -p no:warnings
```

Tavern API tests hit an isolated docker stack on port 5050 (`tests/constants.py`, `tests/test_data_layer.tavern.yaml`). Configure the host with `TAVERN_HOST` or the default in `constants.py`.

**Judge:**

```bash
cd src/judge && python -m pytest tests/
# or ./tests.sh
```

## CI (what runs on your PR)

Path-filtered jobs in `.github/workflows/ci.yml`:

| Change in | Runs |
| --------- | ---- |
| `src/web/**` | lint, Playwright smoke (no judge), Playwright judge E2E (pull prebuilt image), Docker build |
| `src/data-layer/**`, `compose/docker-compose.coolify.yml`, `scripts/coolify-*.sh` | Go unit tests, Tavern API tests, Docker image build |
| `src/judge/**` | Judge tests (cached image build), judge image build for Playwright `@judge` specs |
| `src/docs/**` | Docs build |

When CI passes on a PR, `preview-deploy` may run (concurrency group `coolify-preview-deploy`):

1. Build-push `nextjudge-core` and `nextjudge-judge` images tagged `ci-{head.sha}` when web, data-layer, or judge paths changed
2. Deploy preview **backend** over SSH (`{PR}-api.preview.nextjudge.net`) before web
3. Deploy preview **web** and **docs** via Coolify when those paths changed
4. Wait for preview URLs and update the PR status comment (web, docs, API rows)

PR close triggers `preview-cleanup.yml` (Coolify previews, SSH backend cleanup, and Docker Hub `ci-{head.sha}` tag deletion).

## Common tasks

### New API endpoint

1. Handler in the right `*.go` file
2. Route registration in the same file's `add*Routes`
3. `AuthRequired`, `AdminRequired`, or `AtLeastJudgeRequired`
4. Tavern stage in `tests/`
5. [API reference](/reference/api/) update

### New language

See [Judge service: Add a language](/architecture/judge/#add-a-language). Rebuild `basejudge:dev` or the production target after Dockerfile changes.

### Database migration

Edit `models.go`. AutoMigrate runs on the next data layer start. For destructive changes, add SQL to `schema_updates.sql` and test with `./fully-reset.sh` locally before production.

## Debugging

| Service | Try |
| ------- | --- |
| Data layer | `go run src/main.go -d -p 5000` |
| Judge | `docker logs $(docker ps -qf name=judge)` |
| Web | DevTools + terminal running `npm run dev` |
| Postgres | `docker exec -it $(docker ps -qf name=postgres) psql -U postgres nextjudge` |
| RabbitMQ | http://localhost:15672 (creds from `.env` or `.env.dev`) |

Env sources: `config.go`, judge `app.py`, web `.env.example`.

## Style

Go: `gofmt`, early returns. TypeScript: strict, no `any`. Python: PEP 8, type hints on new code.

## Contributing

Branch from `main`, test locally, open a PR. See the repository `CONTRIBUTING.md` on GitHub for community guidelines.

Build all images: `docker buildx bake -f docker-bake.hcl`
