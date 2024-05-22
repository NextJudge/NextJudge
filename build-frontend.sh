#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )


cd $SCRIPT_DIR
# Start Postgres first
docker compose up -d db

cd $SCRIPT_DIR/src/web
npm install
npm run build

cd $SCRIPT_DIR
docker compose down db
