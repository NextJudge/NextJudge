---
title: Getting Started
description: Get NextJudge up and running on your system.
---

## Quick Start

NextJudge is a monorepo containing multiple services that work together to provide a complete competitive programming platform. The easiest way to get started is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3000 (web), 5000 (data-layer), 5672 (RabbitMQ), and 5432 (PostgreSQL) available

### Deployment

The top-level `./deploy.sh` script will instantiate all modules using Docker Compose internally.

```sh
./deploy.sh
```

This will start:
- PostgreSQL database
- RabbitMQ message queue
- Data Layer API (Go service)
- Judge service (Python service)
- Web application (Next.js)

### Local Development

To run the services locally while developing, you can use Docker with hot reload. The source code is mounted, and a process is set up to detect changes and restart the service when you save files.

```sh
./dev-deploy.sh [web] [nojudge] [noelastic]
```

Optional flags:
- `web`: Only start the web application
- `nojudge`: Skip starting the judge service
- `noelastic`: Skip starting Elasticsearch

### Resetting the Environment

To flush the database and remove all volumes (completely refreshing the Docker environments), run:

```sh
./fully-reset.sh
```

## Project Structure

NextJudge is organized as a monorepo with the following structure:

```
.
├── src
│   ├── cli - command-line interface for interacting with the platform
│   ├── data-layer - HTTP wrapper over underlying database
│   ├── judge - runs and judges code submissions
│   ├── web - web application for the platform
│   └── docs - this documentation site
├── compose
│   ├── docker-compose.backend.yml - Docker compose file for running all backend services
│   ├── docker-compose.dev.yml - Docker compose file for running all services with hot reload
│   ├── docker-compose.coolify.yml - Docker compose file for running all services on Coolify
│   └── docker-compose.prebuilt.yml - Docker compose file using prebuilt images
└── deploy.sh - script to deploy all services using Docker compose
```

## Next Steps

- Learn about the [architecture](/architecture/components) of NextJudge
- Understand the [key terms](/start/key-terms) used throughout the platform
- Explore the [API reference](/reference/api) for integrating with NextJudge
