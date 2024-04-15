#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo "Taking down judge"
docker container rm -f judge-quick 


cd $SCRIPT_DIR/src/data-layer
docker-compose -f docker-compose.db.host.yml down

echo "Killing node and postgres and redis process"
pkill node
pkill postgres
pkill bun
# TODO - rename the Go binary something less generic
pkill main
