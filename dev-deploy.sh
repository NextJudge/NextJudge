#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Build the basejudge
cd $SCRIPT_DIR/src/judge
docker build -f Dockerfile.newbase --target dev -t basejudge:dev .

cd $SCRIPT_DIR/src/web
npm start &

cd $SCRIPT_DIR
# Start all services
docker compose -f docker-compose.dev.yml up --build
