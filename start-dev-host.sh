# #!/bin/sh

# # Instantiates all systems on the host

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# # This scripts instantiates all modules on the host

# First, start the frontend
echo "Starting the frontend"
cd $SCRIPT_DIR/src/web
npm install
(VITE_BRIDGE_HOST=localhost VITE_BRIDGE_PORT=3000 npm run dev&)


# Start the datalayer
cd $SCRIPT_DIR/src/data-layer
echo "Starting the postgres"
docker-compose -f docker-compose.db.host.yml up -d

## Start the Go data-layer
go build
DB_HOST=localhost DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=example ./main &


# Start redis
echo "Starting redis server"
redis-server --daemonize yes

# Start the bridge
cd $SCRIPT_DIR/src/bridge
bun install
PORT=3000 REDIS_HOST=localhost REDIS_PORT=6379 DATABASE_HOST=localhost DATABASE_PORT=5000 JWT_SECRET=this_is_purely_for_testing_CHANGE_THIS_IN_PROD bun run dev &

sleep 1
# # Start the judge
# Judge is required to run in a Docker container
cd $SCRIPT_DIR/src/judge
echo "Starting judge"
docker run --privileged --net=host -e REDIS_HOST='127.0.0.1' -e REDIS_PORT='6379' -e BRIDGE_HOST='127.0.0.1' -e BRIDGE_PORT='3000' --name judge-quick -it -d host-nextjudge-judge 


cd $SCRIPT_DIR
