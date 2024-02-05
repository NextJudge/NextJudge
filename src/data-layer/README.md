# Data Layer



## Running the Data Layer

## Docker
There is a `docker-compose-local.yml` file which will instantiate the Go-based CRUD application as well the underlying Postgres database in a Docker network. This is great for development and quickly getting everything necessary running locally.

```sh
docker-compose -f docker-compose-local.yml up -d
```

If you change the schema, you need to completely delete the containers by running:
```sh
docker-compose rm
```

## Host
These commands builds the data layer, runs the docker container, initializes the database, and starts the data layer server.
```sh
go build
docker-compose up -d
make postgres
./main
```