#!/bin/sh

# Remove all volumes/persistent data in the 
docker compose down --volumes

docker compose -f docker-compose.dev.yml down --volumes

