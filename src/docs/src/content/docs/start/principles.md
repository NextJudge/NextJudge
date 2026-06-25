---
title: Design decisions
description: Architectural choices behind NextJudge: self-hosting, service boundaries, nsjail sandboxes, Postgres and RabbitMQ.
---

## Self-hosted first

Participant data, problems and submissions live in Postgres on infrastructure you operate. Authentication providers and secrets are yours to configure. No third-party SaaS is required to run contests.

Managed platforms reduce operational work. NextJudge targets teams that need data residency, custom problems or control over the judge environment.

## Services, not a monolith

The web app, API and judge run as separate processes connected by HTTP and RabbitMQ.

Code execution is slow and resource-heavy. Isolating it prevents compile spikes from affecting login or browsing. The queue absorbs submission bursts during contests; you scale judge workers horizontally without redeploying the API.

The tradeoff is more moving parts at boot. Postgres and RabbitMQ must be healthy before other services can function.

## Sandboxed execution

Every compile and run goes through nsjail: no network, capped CPU and memory, restricted filesystem.

That level of isolation suits untrusted contest code in a dedicated judge environment. Keep judge images patched and place judge workers on a network segment separate from sensitive internal systems.

## Open source (MIT)

Use, modify and redistribute NextJudge under the MIT license. There are no seat limits or feature tiers tied to licensing.

## Where to extend

| Area | Location | You change |
| ---- | -------- | ---------- |
| Languages | `src/judge/languages.toml` + Docker image | Compiler, build script, API registration |
| API | `src/data-layer/src/*.go` | Routes, models, migrations |
| UI | `src/web/src/app/` | Pages, components |
| CLI | `src/cli/` | Download, local test, submit |

Each service has a clear boundary so you can change one component without reading the entire codebase.
