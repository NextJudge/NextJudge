---
title: Getting Started
description: Complete setup guide for NextJudge with examples and troubleshooting
---

This guide walks you through deploying NextJudge and understanding the initial setup. Whether you're evaluating the platform for your organization or setting up a development environment, these steps will get you running quickly.

## Before You Begin

**System Requirements**
Your system needs at least 4GB of RAM and 2 CPU cores for development. For production, 8GB RAM and 4 cores are recommended. You'll need Docker and Docker Compose installed with version 20.10 or later. Ensure ports 3000, 5000, 5672, and 5432 are available on your system.

**Understanding the Architecture**
NextJudge runs as a collection of Docker containers. The web frontend serves on port 3000, the API backend on port 5000, RabbitMQ messaging on port 5672, and PostgreSQL on port 5432. All services communicate through Docker networks, making deployment straightforward.

## Quick Deployment

The fastest way to start NextJudge is using the deployment script. This approach is ideal for evaluation, testing, or small-scale production use.

**Running the Deploy Script**

```bash
cd /Users/tn/dev/sidequests/github/NextJudge
./deploy.sh
```

This script performs several operations. It pulls required Docker images for PostgreSQL, RabbitMQ, and the custom NextJudge services. It creates Docker networks for inter-service communication. It starts the PostgreSQL database and runs schema migrations. It launches RabbitMQ for message passing between services. Finally, it starts the data layer API, judge workers, and web application.

**What Happens During Startup**

When you run the deploy script, you'll see Docker pulling images and starting containers. The PostgreSQL container initializes first, creating the database schema. The data layer service connects to the database and runs migrations automatically. RabbitMQ starts and creates the necessary queues. Judge workers connect to RabbitMQ and wait for submissions. The web application compiles and starts, connecting to the data layer API.

**Verifying the Deployment**

After the script completes, check that all services are running:

```bash
docker ps
```

You should see five containers running. nextjudge-postgres-1 handles database storage. nextjudge-rabbitmq-1 manages message queues. nextjudge-data-layer-1 provides the API. nextjudge-judge-1 executes code submissions. nextjudge-web-1 serves the web interface.

**Accessing the Application**

Open your browser and navigate to http://localhost:3000. The first page load may take 30-60 seconds as Next.js compiles the application. Once loaded, you can register an account or sign in if you already have credentials.

**Initial Login**

For development deployments, you can create an admin user through the web interface. Click on the authentication button and complete the registration process. The first user registered typically receives admin privileges automatically.

## Development Environment Setup

Developing NextJudge requires access to source code and faster iteration cycles. The development setup mounts source directories as volumes, enabling hot reloading when you make changes.

**Starting Development Mode**

```bash
cd /Users/tn/dev/sidequests/github/NextJudge
./dev-deploy.sh
```

This command starts all services with development configurations. Each service reloads automatically when you modify its source code. The web application uses Next.js development mode with fast refresh. The data layer rebuilds and restarts on Go code changes. Judge workers reload Python code automatically.

**Development Script Options**

The dev-deploy.sh script accepts optional parameters to customize your development environment. Add web to start only the web application for frontend development. Use nojudge to skip judge workers when testing non-submission features. Add noelastic to disable Elasticsearch when you don't need search functionality.

**Example Development Scenarios**

For frontend-only development, use:

```bash
./dev-deploy.sh web
```

This starts just the web application, connecting to existing backend services. It's faster for UI development and testing.

For backend API development:

```bash
./dev-deploy.sh nojudge
```

This starts all services except judge workers, saving resources when testing API endpoints or database operations.

## Service-Specific Setup

Sometimes you need to run individual services for focused development or debugging.

**Running the Data Layer Independently**

First, ensure PostgreSQL and RabbitMQ are running through Docker Compose. Then start the data layer:

```bash
cd /Users/tn/dev/sidequests/github/NextJudge/src/data-layer
go mod download
go run src/main.go -d -p 5000
```

The -d flag enables debug logging, showing all database queries and API requests. The service connects to PostgreSQL on localhost:5432 and RabbitMQ on localhost:5672 by default.

**Running the Web Application Standalone**

```bash
cd /Users/tn/dev/sidequests/github/NextJudge/src/web
npm install
npm run dev
```

The development server starts on http://localhost:3000 with hot reloading enabled. Create a .env.local file from .env.example to configure API endpoints and authentication providers.

**Running Judge Workers Separately**

```bash
cd /Users/tn/dev/sidequests/github/NextJudge/src/judge
pip install -r requirements.txt
python src/app.py
```

Judge workers connect to RabbitMQ and wait for submissions. You can run multiple judge instances to increase processing capacity.

## Troubleshooting Common Issues

**Port Conflicts**

If services fail to start with port already in use errors, identify the conflicting process:

```bash
sudo lsof -i :3000  # For web interface
sudo lsof -i :5000  # For API
sudo lsof -i :5432  # For PostgreSQL
sudo lsof -i :5672  # For RabbitMQ
```

Stop the conflicting service or change NextJudge's port configuration in the Docker Compose files.

**Database Connection Failures**

When the data layer cannot connect to PostgreSQL, check that the database container is running:

```bash
docker logs nextjudge-postgres-1
```

Look for errors about database initialization or port binding. Ensure no other PostgreSQL instance is running on port 5432.

**Judge Worker Connection Issues**

If judge workers cannot connect to RabbitMQ, verify RabbitMQ is healthy:

```bash
docker logs nextjudge-rabbitmq-1
```

Check for authentication errors or port conflicts. Judge workers need valid credentials to connect to the message queue.

**Web Application Build Errors**

When the web application fails to compile, check for dependency issues:

```bash
cd /Users/tn/dev/sidequests/github/NextJudge/src/web
rm -rf node_modules package-lock.json
npm install
npm run build
```

This clears the dependency cache and reinstalls packages.

**Insufficient Resources**

If containers exit with memory errors, increase Docker's memory allocation. On Docker Desktop, go to Settings > Resources and increase Memory to at least 4GB. For Docker Engine, adjust system-level memory limits.

## Environment Reset

When you need to completely reset your NextJudge environment, use the reset script. This is useful after breaking changes, schema modifications, or when starting fresh.

**Running the Reset Script**

```bash
cd /Users/tn/dev/sidequests/github/NextJudge
./fully-reset.sh
```

This script performs a complete cleanup. It stops and removes all Docker containers. It deletes all Docker volumes, including databases and persistent storage. It removes Docker networks created for NextJudge. Finally, it cleans up any temporary files and build artifacts.

**What Gets Reset**

The reset removes all user accounts, problems, submissions, and contest data. It clears all judge caches and compilation artifacts. Database migrations will run again on next startup. Any custom configurations in Docker Compose files remain unchanged.

**When to Reset**

Reset your environment when database schema changes require fresh migrations. Use it after modifying Docker configurations that need complete recreation. Reset when switching between major versions of NextJudge. It's also helpful when troubleshooting persistent issues that don't resolve with container restarts.

**Post-Reset Steps**

After resetting, you'll need to run the deployment script again to start services. All data will be fresh, so you'll need to create new user accounts and problems. If you had custom configurations, reapply them before starting services.

## First Steps After Deployment

Once NextJudge is running, familiarize yourself with the platform through these initial actions.

**Creating Your First Problem**

Log in to the web interface and navigate to the problem creation page. Write a clear problem description with input and output specifications. Create test cases that cover edge cases and typical scenarios. Set appropriate time limits based on problem complexity. Choose relevant categories to help users find the problem.

**Testing the Judge System**

Submit solutions to your problem in different languages. Verify that correct solutions receive "Accepted" status. Test incorrect solutions to verify proper error reporting. Check that time limit exceeded and memory limit exceeded cases are handled correctly. Confirm that runtime errors and compilation errors show appropriate messages.

**Setting Up a Contest**

Create a contest with multiple problems of varying difficulty. Set a start and end time for the contest period. Invite participants by sharing the contest URL. Monitor the leaderboard during the contest to track participation. Review submissions and statistics after the contest ends.

**Exploring the API**

Use tools like curl or Postman to explore the data layer API. Authenticate and obtain JWT tokens for authorized endpoints. Create users, problems, and submissions programmatically. Integrate NextJudge into your existing tools and workflows.

## Next Steps

With NextJudge running, you can now explore more advanced features and customization options.

**Learning the Architecture**
Understand how the web client, data layer, and judge workers interact. Learn about the message queue system for submission processing. Study the database schema and API design patterns.

**Development and Customization**
Set up your local development environment with hot reloading. Modify the web interface to match your branding. Add new features to the API or judge system. Contribute improvements back to the open-source project.

**Production Deployment**
Configure environment variables for production settings. Set up SSL certificates and domain names. Implement monitoring and logging for operational visibility. Plan your scaling strategy based on expected usage patterns.