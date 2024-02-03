# NextJudge - Bridge

Welcome to the NextJudge Bridge! This is the "middleman" application that connects all of our services.

## Setup

1. Install [Docker & Docker Compose](https://www.docker.com/products/docker-desktop)
2. Install [Bun](https://bun.sh)

**Optional**: Golang (to build the database locally)

## Running the Bridge

To successfully run the bridge, you will need to have a `.env` file in the root of the project. This file should contain the following:

```env
# .env
PORT=3000
JWT_SECRET=your_secret_here
```

Once you have your `.env` file, you'll need to make sure the data layer is running. You can do this by navigating to the `src/data-layer` directory and running the following commands:

```bash
go build
docker-compose up -d
make postgres
./main
```

These commands builds the data layer, runs the docker container, initializes the database, and starts the data layer server.

Once the data layer is running, you can start the bridge by opening a new terminal in `src/bridge` the following command:

```bash
bun install && bun run dev
```

## Testing

To run the integration tests, you can use the following command:

> Note, you must have both the data layer and the bridge running on your machine to run the tests.

```bash
bun test
```

This will install the necessary dependencies and start the bridge server.

## TODO:

- [ ] Add a `Makefile` to the bridge
- [ ] Finish the `README.md` with the necessary commands to run the bridge
- [ ] Inquire about duplicates in users
- [ ] Work on API Gateway
- [ ] Explain Usage
