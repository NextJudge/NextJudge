#!/bin/sh

echo "Killing frontend node process"
pkill node

echo "Taking down docker compose"
docker compose -f docker-compose-dev.yml down