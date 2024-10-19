#!/bin/sh

docker compose -f docker-compose.db.host.yml up
./main
