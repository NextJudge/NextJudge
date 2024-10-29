#!/bin/sh


# Build the basejudge
docker build -f Dockerfile.newbase --target prod -t basejudge:prod .

docker build --build-arg BASEJUDGE=basejudge:prod -f Dockerfile.monolith . -t nextjudge/judge

