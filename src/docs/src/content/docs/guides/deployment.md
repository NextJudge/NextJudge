---
title: Deployment Guide
description: Guide for deploying NextJudge to production.
---

This guide covers deploying NextJudge to production environments.

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM recommended
- Sufficient disk space for database and logs
- Domain name and SSL certificate (for production)

## Quick Deployment

The simplest deployment uses the provided Docker Compose files:

```sh
./deploy.sh
```

This uses `compose/docker-compose.backend.yml` to start all services.

## Production Deployment

### Environment Variables

Set the following environment variables before deployment:

**Data Layer:**
- `DATABASE_URL` - PostgreSQL connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `ELASTIC_ENABLED` - Enable Elasticsearch (true/false)
- `SEED_DATA` - Seed development data (false for production)

**Judge Service:**
- `RABBITMQ_HOST` - RabbitMQ hostname
- `RABBITMQ_PORT` - RabbitMQ port (default: 5672)
- `RABBITMQ_USER` - RabbitMQ username
- `RABBITMQ_PASSWORD` - RabbitMQ password
- `NEXTJUDGE_HOST` - Data layer API hostname
- `NEXTJUDGE_PORT` - Data layer API port (default: 5000)
- `JUDGE_PASSWORD` - Password for judge authentication

**Web Application:**
- `NEXT_PUBLIC_API_URL` - Data layer API URL
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Public URL of the web application
- Database connection variables (if using database session store)

### Using Prebuilt Images

For production, use prebuilt Docker images:

```sh
docker-compose -f compose/docker-compose.prebuilt.yml up -d
```

This uses images from the GitHub Container Registry.

### Building Custom Images

To build your own images:

```sh
docker buildx bake -f docker-bake.hcl
```

This builds all services using the multi-stage build configuration.

## Service Configuration

### PostgreSQL

Configure PostgreSQL for production:

- Set appropriate `shared_buffers` and `max_connections`
- Enable connection pooling (consider PgBouncer)
- Set up regular backups
- Configure replication if needed

### RabbitMQ

Configure RabbitMQ:

- Set up durable queues
- Configure message persistence
- Set appropriate memory limits
- Enable monitoring

### Scaling Judge Services

To handle more submissions, scale the judge service:

```sh
docker-compose up -d --scale judge=3
```

This starts 3 judge instances, all consuming from the same queue.

### Reverse Proxy

Set up a reverse proxy (nginx, Traefik, etc.) in front of the web application:

```nginx
server {
    listen 80;
    server_name nextjudge.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS

Use Let's Encrypt or your preferred certificate authority:

```nginx
server {
    listen 443 ssl;
    server_name nextjudge.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        # ... proxy settings
    }
}
```

## Database Setup

### Initial Migration

The data layer runs migrations automatically on startup. For production:

1. Review migration scripts
2. Backup existing database (if upgrading)
3. Start data layer service
4. Verify migrations completed successfully

### Seeding Data

Do not use `SEED_DATA=true` in production. Instead:

1. Create admin user via API
2. Import problems via API or CLI
3. Configure languages via API

## Monitoring

### Health Checks

All services expose health check endpoints:

- Data Layer: `GET /healthy`
- Web Application: Built into Next.js
- Judge: Check RabbitMQ connection

Set up monitoring to check these endpoints regularly.

### Logging

Configure centralized logging:

- Use Docker logging drivers
- Forward logs to a logging service (ELK, Loki, etc.)
- Set appropriate log levels for production

### Metrics

Consider adding metrics collection:

- Application metrics (Prometheus)
- Infrastructure metrics (cAdvisor, Node Exporter)
- Custom business metrics

## Backup Strategy

### Database Backups

Set up regular PostgreSQL backups:

```sh
# Daily backup script
pg_dump -U postgres nextjudge > backup-$(date +%Y%m%d).sql
```

Or use PostgreSQL's continuous archiving for point-in-time recovery.

### Volume Backups

Back up Docker volumes containing persistent data:

- PostgreSQL data volume
- Any persistent judge cache directories

## Security Considerations

### Network Security

- Use Docker networks to isolate services
- Expose only necessary ports
- Use firewall rules to restrict access
- Consider using a VPN for admin access

### Authentication

- Use strong JWT secrets
- Enable HTTPS for all connections
- Implement rate limiting
- Use secure password hashing

### Code Execution Security

The judge service uses nsjail for isolation, but also:

- Regularly update judge Docker images
- Monitor for security vulnerabilities
- Review and test isolation settings
- Limit resource usage appropriately

## Performance Tuning

### Database

- Add appropriate indexes
- Analyze query performance
- Use connection pooling
- Consider read replicas for scaling

### Judge Service

- Scale horizontally by adding more instances
- Monitor queue depth
- Tune resource limits per problem
- Cache compilation results where possible

### Web Application

- Enable Next.js production optimizations
- Use CDN for static assets
- Implement caching strategies
- Monitor bundle size

## Troubleshooting

### Services Not Starting

1. Check Docker logs: `docker-compose logs <service>`
2. Verify environment variables
3. Check port availability
4. Verify Docker resources (memory, disk)

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check connection string format
3. Verify network connectivity
4. Check firewall rules

### Judge Not Processing Submissions

1. Verify RabbitMQ connection
2. Check judge authentication
3. Verify queue exists
4. Check judge logs for errors

### High Memory Usage

1. Monitor service resource usage
2. Scale judge services horizontally
3. Tune database connection pool
4. Review and optimize queries

## Upgrading

When upgrading NextJudge:

1. Backup database and volumes
2. Review changelog and migration notes
3. Pull new Docker images
4. Run migrations (automatic on startup)
5. Verify all services start correctly
6. Test critical functionality

## Coolify Deployment

NextJudge includes a Coolify-specific compose file:

```sh
docker-compose -f compose/docker-compose.coolify.yml up -d
```

This is optimized for Coolify hosting platform deployments.

## Cloud Deployment

### AWS

- Use RDS for PostgreSQL
- Use ElastiCache for Redis (if needed)
- Use ECS or EKS for container orchestration
- Use ALB for load balancing

### Google Cloud

- Use Cloud SQL for PostgreSQL
- Use Cloud Run for serverless deployment
- Use Cloud Load Balancing

### Azure

- Use Azure Database for PostgreSQL
- Use Azure Container Instances or AKS
- Use Azure Application Gateway

## Support

For deployment issues:

- Check GitHub issues
- Review service logs
- Consult the development guide
- Open a new issue with details
