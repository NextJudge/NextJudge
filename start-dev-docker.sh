#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# This scripts instantiates all modules on the host

# # First, start the frontend
cd $SCRIPT_DIR
cd ./src/web
npm install
(VITE_BRIDGE_HOST=localhost VITE_BRIDGE_PORT=3000 npm run dev&)

cd $SCRIPT_DIR
docker compose -f docker-compose-dev.yml up -d

# Start the datalayer
cd $SCRIPT_DIR
cd /src/data-later
# Start the postgres db
docker compose up -d db
# Start the Go application
go build
make postgres
./main &

# Start the bridge
cd $SCRIPT_DIR
cd /src/bridge



# # Start the judge
# # Judge is required to run in a Docker container
# # docker run --network host <image_name>


