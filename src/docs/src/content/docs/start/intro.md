---
title: Introduction
description: What NextJudge is, who runs it and how problems move from the browser through the judge pipeline on your own hardware.
---

NextJudge is an open-source competitive programming platform. You host it yourself: problems, contests, participant data and judging all run on infrastructure you control.

The web application handles browsing, editing and submission. Judge workers compile and evaluate code in separate processes connected by a message queue. Untrusted code never runs inside the web server.

<figure class="nj-product-shot nj-product-shot--wide">
  <img src="/images/nextjudge-dashboard.jpg" alt="Participant dashboard with submission statistics, a continue-solving prompt and a contest spotlight." />
  <figcaption>The dashboard combines practice activity and active contests.</figcaption>
</figure>

## What you can do

### Practice programming problems

Search and sort the shared problem set, then open any problem in the solving workspace.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-problems.jpg" alt="Problem catalog with search, sortable columns and difficulty labels." />
  <figcaption>The catalog is the entry point into the practice set.</figcaption>
</figure>

### Solve and submit in the browser

The workspace shows the statement, sample tests, language selector and Monaco editor on one screen. **Run** executes against custom input. **Submit** sends the solution through formal grading.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-solver.jpg" alt="Split-screen solver with statement and tests on the left, code editor on the right." />
  <figcaption>Read, test and submit from a single view.</figcaption>
</figure>

### Host timed contests

A contest groups problems under a schedule with registration, clarifications and standings. Organizers create and manage contests through admin routes.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-contest.jpg" alt="Completed contest showing schedule, participant count, status and problem table." />
  <figcaption>Contest pages show event details alongside problem progress.</figcaption>
</figure>

## How judging works

Submitting code does not execute it in the web process.

1. The web app sends the submission to the Go data layer.
2. The data layer stores it as `PENDING` and publishes a RabbitMQ job.
3. A Python judge worker compiles and runs the code inside an nsjail sandbox.
4. The judge reports the verdict and test results to the data layer.
5. The web app polls until the submission reaches a final verdict.

![NextJudge service architecture](../../../assets/architecture.png)

Separating execution from user-facing requests keeps compile and run load off the API. You can add judge workers when submission volume grows. See [Core components](/architecture/components/) for service boundaries and [Judge service](/architecture/judge/) for sandbox details.

## What you deploy

| Service | Responsibility |
| ------- | -------------- |
| **Web** | Authentication, problem browsing, code editor, contests, standings |
| **Data layer** | Go REST API, authorization, persistence, submission enqueueing |
| **Judge** | Compilation and sandboxed execution of submitted source code |
| **RabbitMQ** | Durable work queue between the API and judge workers |
| **PostgreSQL** | Users, problems, test cases, submissions, contest data |

In the default local setup the web UI listens on `http://localhost:8080` and the data layer on port `5000`. Postgres and RabbitMQ sit behind both.

## Why self-host

NextJudge fits teams that need control over data, problems and execution environment:

- Private classroom, club, hiring or internal contests
- Participant data and proprietary problems on your infrastructure
- Custom interface, authentication, languages and integrations
- Independent scaling of judge workers
- REST API and CLI for automation

You also take on operations: database, message queue, judge images, backups, monitoring and network isolation. NextJudge is software you run, not a hosted service.

## Start here

1. [Getting Started](/start/getting-started/) — deploy the stack and verify each service
2. [Run a contest](/guides/run-a-contest/) — organizer workflow from problems to standings
3. [Key terms](/start/key-terms/) — problems, test cases, submissions, verdicts
4. [Configuration](/guides/configuration/) — secrets, OAuth, optional Elasticsearch
5. [Design decisions](/start/principles/) — why the system is split into services
6. [Development guide](/guides/development/) — work on individual components
7. [API reference](/reference/api/) — integrate with the data layer directly
