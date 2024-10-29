#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Build the basejudge
cd $SCRIPT_DIR
docker build -f Dockerfile.newbase --target dev -t basejudge:dev .
# Build the judge
docker build -f Dockerfile.monolith --build-arg BASEJUDGE=basejudge:dev -t nextjudge-judge-test-dev .


if [ -z "$1" ];
then
    docker compose -f docker-compose.test.dev.yml run --build pytest
else
    docker compose -f docker-compose.test.dev.yml run --build pytest -k "$1"
fi

