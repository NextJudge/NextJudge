#!/bin/sh


SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/src/judge
docker build -f Dockerfile.base -t basejudge .
docker build -f Dockerfile.monolith -t host-nextjudge-judge .

# docker build . -t host-nextjudge-judge
