#!/bin/bash

# Remove all volumes/persistent data

docker compose -f docker-compose.dev.yml down --volumes --remove-orphans

docker compose -f docker-compose.backend.yml down --volumes --remove-orphans
