#!/bin/sh


SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $SCRIPT_DIR/src/judge
docker build . -t host-nextjudge-judge
