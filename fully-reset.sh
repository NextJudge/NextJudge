#!/bin/bash

# Remove all volumes/persistent data

docker compose -f compose/docker-compose.dev.yml down --volumes --remove-orphans

docker compose -f compose/docker-compose.backend.yml down --volumes --remove-orphans
