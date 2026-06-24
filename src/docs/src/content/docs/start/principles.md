---
title: Design decisions
description: Understand the architectural constraints and trade-offs behind NextJudge, from self-hosting and nsjail sandboxes to Postgres and RabbitMQ.
---

## Self-hosted first

Data in your Postgres. Auth you configure. No required third-party SaaS.

If ops isn't your problem, hosted platforms win on convenience. NextJudge is for when the data and the judge must stay yours.

## Services, not a monolith

Web, API, and judge are separate processes over HTTP + RabbitMQ.

Code execution is slow and hungry. You don't want compile spikes taking down the login page. The queue absorbs contest submission bursts; you scale judges horizontally without redeploying the API.

Cost: more containers at boot. Postgres and RabbitMQ must be healthy before anything else matters.

## Sandboxed execution

nsjail for every compile and run. No network, capped CPU/RAM, restricted filesystem.

That's practical isolation, not a pentest pass. Patch judge images. Don't put the judge on the same trust boundary as your payroll DB without network segmentation.

## Open source (MIT)

No seat limits. Rebrand it. Strip features. Ship it.

## Where to extend

| Area | Location | You change |
| ---- | -------- | ---------- |
| Languages | `src/judge/languages.toml` + Docker image | Compiler, build script, API registration |
| API | `src/data-layer/src/*.go` | Routes, models, migrations |
| UI | `src/web/src/app/` | Pages, components |
| CLI | `src/cli/` | Download, local test, submit |

We'd rather you touch one service than read all four to fix a bug in one.
