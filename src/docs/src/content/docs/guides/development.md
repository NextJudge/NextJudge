---
title: Development Guide
description: Guide for developing and contributing to NextJudge.
---

This guide covers how to set up a development environment for NextJudge and contribute to the project.

## Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for data-layer development)
- Node.js 18+ and npm/bun (for web development)
- Python 3.10+ (for judge development)
- Git

## Development Setup

### Using Docker Compose (Recommended)

The easiest way to develop is using the development Docker Compose setup with hot reload:

```sh
./dev-deploy.sh
```

This starts all services with:
- Source code mounted as volumes
- Hot reload enabled
- Development-friendly configurations

### Individual Service Development

You can also run services individually for faster iteration:

#### Data Layer

```sh
cd src/data-layer
go mod download
go run src/main.go -d -p 5000
```

Make sure PostgreSQL and RabbitMQ are running (via Docker Compose).

#### Web Application

```sh
cd src/web
npm install  # or bun install
npm run dev  # or bun dev
```

The web app will run on `http://localhost:3000`.

#### Judge Service

```sh
cd src/judge
pip install -r requirements.txt
python src/app.py
```

Make sure RabbitMQ and the data layer are running.

## Project Structure

```
NextJudge/
├── src/
│   ├── cli/              # Command-line interface
│   │   ├── bin/          # Executable scripts
│   │   └── dev/           # Development utilities
│   ├── data-layer/        # Go REST API service
│   │   ├── src/           # Go source code
│   │   ├── tests/         # API tests (Tavern)
│   │   └── docker-compose.*.yml
│   ├── judge/             # Python judge service
│   │   ├── src/           # Python source code
│   │   ├── tests/         # Judge tests
│   │   └── languages.toml # Language configurations
│   ├── web/               # Next.js web application
│   │   ├── src/           # React/Next.js source
│   │   │   ├── app/        # Next.js app router pages
│   │   │   ├── components/ # React components
│   │   │   └── lib/        # Utilities
│   │   └── public/         # Static assets
│   └── docs/              # Documentation site
└── compose/               # Docker Compose files
```

## Code Style

### Go (Data Layer)

- Follow standard Go formatting (`gofmt`)
- Use `golangci-lint` for linting
- Follow Go naming conventions
- Use early returns for error handling

### TypeScript/React (Web)

- Use TypeScript strict mode
- Follow React best practices
- Use functional components with hooks
- Prefer `const` over `function` for components
- Use TailwindCSS for styling
- No `any` types - always specify types

### Python (Judge)

- Follow PEP 8 style guide
- Use type hints where possible
- Use descriptive variable names
- Handle errors explicitly

## Database Migrations

The data layer uses GORM's AutoMigrate feature. When modifying models:

1. Update the model struct in `src/data-layer/src/models.go`
2. Run the service - migrations run automatically on startup
3. For production, consider using explicit migration scripts

## Testing

### Data Layer API Tests

API tests use Tavern (Python testing framework):

```sh
cd src/data-layer
pip install -r tests/requirements.txt
pytest tests/ -p no:warnings
```

Make sure the data layer is running before running tests.

### Judge Tests

Judge tests verify compilation and execution:

```sh
cd src/judge
python -m pytest tests/
```

Or use the test script:

```sh
./tests.sh
```

### Web Application

```sh
cd src/web
npm test  # or bun test
```

## Adding New Features

### Adding a New API Endpoint

1. Define the route in the appropriate file (`users.go`, `problems.go`, etc.)
2. Implement the handler function
3. Add authentication middleware if needed
4. Update API documentation
5. Add tests

### Adding a New Language

1. Install compiler/runtime in judge Docker image
2. Add entry to `src/judge/languages.toml`
3. Test compilation and execution
4. Register language in database (via API or migration)

### Adding a New Web Feature

1. Create components in `src/web/src/components/`
2. Add pages/routes in `src/web/src/app/`
3. Update navigation if needed
4. Add TypeScript types
5. Style with TailwindCSS

## Debugging

### Data Layer

Enable debug logging:

```sh
go run src/main.go -d
```

Or set log level in code:

```go
logrus.SetLevel(logrus.DebugLevel)
```

### Judge Service

The judge logs to stdout. Check Docker logs:

```sh
docker logs <judge-container-name>
```

### Web Application

Use browser DevTools and Next.js debugging. Check terminal output for server-side errors.

### Database

Connect to PostgreSQL:

```sh
docker exec -it <postgres-container> psql -U postgres nextjudge
```

## Environment Variables

Each service uses environment variables for configuration. See:

- `src/data-layer/src/config.go` - Data layer config
- `src/judge/src/app.py` - Judge config
- `src/web/.env.example` - Web app config (if exists)

## Git Workflow

1. Create a feature branch from `main`
2. Make changes with descriptive commits
3. Test your changes
4. Submit a pull request
5. Address review feedback

## Common Tasks

### Resetting the Database

```sh
./fully-reset.sh
```

This removes all containers and volumes, giving you a fresh start.

### Building Docker Images

```sh
docker build -f src/data-layer/Dockerfile -t nextjudge/data-layer .
docker build -f src/judge/Dockerfile -t nextjudge/judge .
docker build -f src/web/Dockerfile -t nextjudge/web .
```

### Running Migrations Manually

```sh
cd src/data-layer
go run src/main.go -migrate-only
```

## Getting Help

- Check existing issues on GitHub
- Review the codebase for similar implementations
- Ask questions in discussions
- Read the API documentation

## Contributing

See [CONTRIBUTING.md](https://github.com/nextjudge/nextjudge/blob/main/CONTRIBUTING.md) for detailed contribution guidelines.
