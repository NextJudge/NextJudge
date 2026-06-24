---
title: Development Guide
description: Day-to-day hacking on NextJudge.
---

You've run [`./dev-deploy.sh web`](/start/getting-started/). This page is for the second hour onward.

## Prerequisites

| Tool | Version | For |
| ---- | ------- | --- |
| Docker | 20.10+ | Compose stacks |
| Go | 1.21+ | Data layer |
| Node / Bun | 18+ | Web |
| Python | 3.10+ | Judge + Tavern tests |
| Git | any | PRs |

## Layout

```
NextJudge/
├── compose/              # docker-compose.*.yml
├── src/
│   ├── data-layer/src/ # Go handlers (users.go, problems.go, …)
│   ├── judge/          # languages.toml, nsjail, app.py
│   ├── web/src/app/    # Next.js routes
│   ├── cli/            # nextjudge command
│   └── docs/           # you're here
├── deploy.sh           # prod-ish local stack
├── dev-deploy.sh       # hot reload + SEED_DATA
└── fully-reset.sh      # scorched earth
```

## Files you'll actually edit

| Task | Start here |
| ---- | ---------- |
| API bug / new endpoint | `src/data-layer/src/*.go`, then `tests/test_data_layer.tavern.yaml` |
| Wrong verdict / TLE | `src/judge/src/`, `languages.toml` |
| UI / editor | `src/web/src/app/`, `src/web/src/components/` |
| Types shared with API | `src/web/src/lib/types.ts` |
| Schema change | `src/data-layer/src/models.go`, maybe `schema_updates.sql` |

## Tests

**Data layer** (must be running on `:5000`):

```bash
cd src/data-layer
pip install -r tests/requirements.txt
pytest tests/ -p no:warnings
```

Tavern tests hit real HTTP. They assume auth is relaxed or configured like CI. Failures print the stage name; search that in `test_data_layer.tavern.yaml`.

**Judge:**

```bash
cd src/judge && python -m pytest tests/
# or ./tests.sh
```

**Web:**

```bash
cd src/web && npm run lint && npm test
```

## CI (what runs on your PR)

Path-filtered jobs in `.github/workflows/ci.yml`:

| Change in | Runs |
| --------- | ---- |
| `src/web/**` | lint, Docker build |
| `src/data-layer/**` | Go tests, API Tavern tests |
| `src/judge/**` | Judge tests, image build |
| `src/docs/**` | Docs build |

Touch one service, you usually only wait on that job. Nice when judge Python and web TypeScript aren't coupled.

## Common tasks

### New API endpoint

1. Handler in the right `*.go` file
2. Route registration in the same file's `add*Routes`
3. `AuthRequired`, `AdminRequired`, or `AtLeastJudgeRequired`
4. Tavern stage in `tests/`
5. [API reference](/reference/api/) update

### New language

See [Judge service: Add a language](/architecture/judge/#add-a-language). Rebuild `basejudge:dev` or prod target after Dockerfile changes.

### Database migration

Edit `models.go`. AutoMigrate on next data layer start. Destructive change? Add SQL to `schema_updates.sql`, test with `./fully-reset.sh` locally before prod.

## Debugging cheatsheet

| Service | Try |
| ------- | --- |
| Data layer | `go run src/main.go -d -p 5000` |
| Judge | `docker logs $(docker ps -qf name=judge)` |
| Web | DevTools + terminal running `npm run dev` |
| Postgres | `docker exec -it $(docker ps -qf name=postgres) psql -U postgres nextjudge` |
| RabbitMQ | http://localhost:15672 (creds from `.env.dev`) |

Env sources: `config.go`, judge `app.py`, web `.env.example`.

## Style

Go: `gofmt`, early returns. TS: strict, no `any`. Python: PEP 8, type hints on new code.

## Ship it

Branch from `main`, test locally, PR. [CONTRIBUTING.md](https://github.com/nextjudge/nextjudge/blob/main/CONTRIBUTING.md) for the social stuff.

Build all images: `docker buildx bake -f docker-bake.hcl`
