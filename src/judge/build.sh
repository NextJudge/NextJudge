#!/bin/sh


# Build the basejudge
docker build -f Dockerfile.newbase --target prod -t basejudge:prod .

docker build --build-arg USAGE=prod -f Dockerfile.monolith . -t nextjudge/judge

