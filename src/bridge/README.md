# NextJudge - Bridge

Welcome to the NextJudge Bridge! This is the "middleman" application that connects all of our services.

## Setup

- Install [Docker & Docker Compose](https://www.docker.com/products/docker-desktop)


**Optional**: Golang (to build the database locally), as well as [Bun](https://bun.sh)

## Running the Bridge

Before running the Bridge, you will need to ensure the data layer is running. Navigate to the `data-layer` directory of NextJudge for instructions on running the data layer.

### Docker

```sh
docker-compose up -d
```

By default, the `docker-compose.yml` file will read environment variables from the `.env` file and pass them to the docker container. See the `./template.env` file for the format.

### Host

To successfully run the bridge on the host, you will need to have a `.env` file in the root of the project. Additionally, you will need to make sure the data layer running.

You can start the bridge running the following commands:

```bash
bun install && bun run dev
```

## Testing

To run the integration tests, you can use the following command:

> Note, you must have both the data layer and the bridge running on your machine to run the tests.

```bash
bun run test
```

This will install the necessary dependencies and start the bridge server.

## TODO:

- [ ] Add a `Makefile` to the bridge
- [ ] Finish the `README.md` with the necessary commands to run the bridge
- [ ] Inquire about duplicates in users
- [ ] Work on API Gateway
- [ ] Explain Usage
