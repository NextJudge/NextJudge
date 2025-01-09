#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Build the basejudge
cd $SCRIPT_DIR/src/judge
docker build -f Dockerfile.newbase --target prod -t basejudge:prod .

if [[ "$*" == *"web"* ]]
then
    cd $SCRIPT_DIR/src/web
    npm start &
fi

cd $SCRIPT_DIR
# Start all services
docker compose -f docker-compose.backend.yml up --build
