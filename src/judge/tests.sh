#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# # Build the basejudge
cd $SCRIPT_DIR
docker build -f Dockerfile.newbase --target prod -t basejudge:prod .
# Build the judge
docker build -f Dockerfile.monolith --build-arg USAGE=prod -t nextjudge-judge-test .


if [ -z "$1" ];
then
    docker compose -f docker-compose.test.yml run --build pytest
else
    docker compose -f docker-compose.test.yml run --build pytest -k "$1"
fi
