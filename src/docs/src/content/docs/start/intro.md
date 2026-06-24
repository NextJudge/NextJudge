---
title: Introduction
description: Learn what NextJudge is, who it is for, and how the platform handles problems, contests, and sandboxed code judging on your own hardware.
---

NextJudge is an open-source competitive programming platform for running coding contests and giving programmers a place to practice. You host the stack, control the problems and contests, and keep the data on your own infrastructure.

The platform combines a focused participant experience with a separate judging pipeline: contestants browse problems, write and run code, submit solutions, and follow contest standings while judge workers compile and evaluate submissions outside the web process.

<figure class="nj-product-shot nj-product-shot--wide">
  <img src="/images/nextjudge-dashboard.jpg" alt="The NextJudge participant dashboard showing submission statistics, a continue-solving prompt, and a contest spotlight." />
  <figcaption>The participant dashboard keeps practice activity and contests in one place.</figcaption>
</figure>

## What you can do

### Practice programming problems

Browse the shared problem set, search by title, compare difficulty, and open a problem directly in the solving workspace.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-problems.jpg" alt="The NextJudge problem catalog with search, sortable columns, and difficulty labels." />
  <figcaption>The problem catalog provides a compact entry point into the practice set.</figcaption>
</figure>

### Solve and submit in the browser

The solving workspace places the problem statement, sample test cases, language selector, and Monaco-powered code editor together. **Run** executes code against custom input; **Submit** sends it through the formal judging pipeline.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-solver.jpg" alt="The NextJudge split-screen solver with a problem statement and test cases on the left and the code editor on the right." />
  <figcaption>Participants can read, test, and submit without leaving the problem workspace.</figcaption>
</figure>

### Host timed contests

Contests group problems into a scheduled event with registration, participant counts, problem status, clarifications, and standings. Organizers manage contests and problems through admin-only routes.

<figure class="nj-product-shot">
  <img src="/images/nextjudge-contest.jpg" alt="A completed NextJudge contest showing its schedule, participant count, status, and problem table." />
  <figcaption>Contest pages combine event context, problems, and competitive progress.</figcaption>
</figure>

## How judging works

Submitting code does not execute it inside the web application.

1. The web app sends the submission to the Go data layer.
2. The data layer stores it as `PENDING` and publishes a RabbitMQ job.
3. A Python judge worker compiles and runs the code inside an nsjail sandbox.
4. The judge reports the verdict and test results to the data layer.
5. The web app polls until the submission reaches a final verdict.

![NextJudge service architecture](../../../assets/architecture.png)

This separation keeps expensive, untrusted code execution away from user-facing requests and lets operators add judge workers when submission volume grows. Read [Core components](/architecture/components/) for the service boundaries and [Judge service](/architecture/judge/) for execution details.

## What you deploy

| Service | Responsibility |
| ------- | -------------- |
| **Web** | Authentication, problem browsing, code editor, contests, and standings |
| **Data layer** | Go REST API, authorization, persistence, and submission enqueueing |
| **Judge** | Compilation and sandboxed execution of submitted source code |
| **RabbitMQ** | Durable work queue between the API and judge workers |
| **PostgreSQL** | Users, problems, test cases, submissions, and contest data |

The web UI runs on `http://localhost:8080` in the standard local setup. The data layer listens on port `5000`; Postgres and RabbitMQ remain supporting infrastructure.

## Why self-host it

NextJudge is useful when control matters more than a managed service:

- Run private classroom, club, hiring, or internal contests.
- Keep participant data and proprietary problems on your infrastructure.
- Customize the interface, authentication, languages, and integrations.
- Scale judging independently by adding workers to the queue.
- Use the REST API and CLI in your own workflows.

The tradeoff is operational responsibility. You maintain the database, message queue, judge images, backups, monitoring, and network isolation. NextJudge provides the software rather than a managed hosting tier.

## Start here

1. [Getting Started](/start/getting-started/) —> launch the stack and verify each service.
2. [Key terms](/start/key-terms/) —> understand problems, test cases, submissions, and verdicts.
3. [Design decisions](/start/principles/) —> learn why the system is split into services.
4. [Development guide](/guides/development/) —> work on individual components.
5. [API reference](/reference/api/) —> integrate with the data layer directly.
