<p align="center"><img src="https://i.ibb.co/cg8YFt5/preview.png" width="560" height="300" /></p>

<h1 align="center" style="font-size:2em;">NextJudge</h1>

<div align="center">

The competitive programming [platform][site-url], [backend framework][site-url], and [command-line interface][site-url]—for everyone.

![Last commit][last-commit-image]
![:)][with-love-image]
![Licese][license-image]

[site-url]: https://nextjudge.org
[license-image]: https://img.shields.io/github/license/nextjudge/nextjudge?style=flat-square&color=dc4405
[last-commit-image]: https://img.shields.io/github/last-commit/nextjudge/nextjudge?display_timestamp=committer&style=flat-square&logo=github&color=dc4405
[with-love-image]: https://img.shields.io/badge/made_with_love_in_oregon-%E2%9D%A4-dc4405?style=flat-square&color=dc4405

</div>

##

NextJudge is a suite of services, tools, and applications for creating programming platforms (framework), facilitating programming contests (cli tool), and showcasing programming prowess (platform). Our primary product is the [nextjudge.org][site-url] platform, built with competitive programming in mind.

The NextJudge toolchain comprises a secure code-execution engine, an API gateway, a web application, a CLI tool, and a data layer, all of which are 100% self-hostable.

## Why? 🤔

As avid programmers, we were tired of competitive programming platforms, interview-prep sites, and educational learning tools providing seemingly everything, except the core experience of what we want to do. Programming, that is.

If you want to prepare for your Jane Street interview, you have to head over to leetcode.com, if you want to practice typescript exercises, you have to head to typehero.dev, and finally, if you want to participate in competitive programming competitions, you have to head to codeforces.com.

We're building NextJudge to be a platform, tool, and experience for everyone. Want to host a mock compeition for ICPC practice? It's no problem with NextJudge. Don't like our UI? You can host your own instance for your own use cases. And finally, want to add new features? We're 100% open source, of course. No matter what your use case is, NextJudge has something for everyone.

## Getting Started 🚀

### Pre-requeisites

- [Bun.js](https://bun.sh/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Go](https://golang.org/)
- [Node.js](https://nodejs.org/en/)
- [Python](https://www.python.org/)

### Repository structure 📁

NextJudge is a monorepo with the following structure:

```
.
├── src
│   ├── bridge - "middleman" that sends requests to data-layer and engine
│   ├── cli - command-line interface for interacting with the platform
│   ├── data-layer - HTTP wrapper over underlying database
│   ├── judge - runs and judges code submissions
│   ├── web - web application for the platform
├── deploy.sh - script to deploy all services using Docker compose
├── build-frontend.sh - script to build the frontend application
├── dev-deploy.sh - script to deploy all services using Docker compose with hot reload
├── fully-reset.sh - script to flush the database and remove all volumes
├── docker-compose.yml - Docker compose file for running all services
├── docker-compose.dev.yml - Docker compose file for running all services with hot reload
├── CONTRIBUTING.md - guidelines for contributing to the project
├── LICENSE - MIT License
└── CODE_OF_CONDUCT.md - guidelines for community behavior
```

> [!TIP]
> You can run the `.sh` scripts in the root directory with `./name-of-script.sh`.

## Quick Start 🏃🏾‍♂️

### Deployment 📦

The top-level `./deploy.sh` will instantiate all modules using Docker compose internally.

```sh
./deploy.sh
```

### Local Development 🛠️

There are two ways to run the services locally:

#### 1. Docker with hot reload 🐳 (recommended)

The first involves running everything in Docker containers. This is the recommended way to run the services locally. You can run the following script to start the services:

```sh
./dev-deploy.sh
```

To flush the database and remove all volumes (completely refreshing the Docker environments), run the following script:

```sh
./fully-reset.sh
```

#### 2. Running everything on host 🖥️

The second way involves running the services on your own machine.

> [!NOTE]
> This doesn't mean certain services won't be running in Docker containers. The database and judge will still be running in Docker containers.

First, run the `./init-dev-host.sh` script for a one-time setup of these Docker containers.

```sh
./init-dev-host.sh
```

Now, whenever you want to start the service:

```sh
./start-dev-host.sh
```

To bring it all down, run:

```sh
./kill-dev-host.sh
```

## Configuration ⚙️

### Installation 🔧

1. Clone the repo

```sh
git clone https://github.com/NextJudge/NextJudge.git
```

2. Get environment variables

```sh
cp .env.example .env
```

> [!IMPORTANT]
> Be sure to fill in the environment variables in the `.env` file.

## Contributing 🤝

Currently, while we are in primary stages of development, we are not accepting contributions.

However, we will be opening up the project for contributions in the near future. Community contributions are what made us decide to open-source the project in the first place. We're excited to make this project a community-driven project.

Until then, please read [CONTRIBUTING.md](/CONTRIBUTING.md) for our code of conduct and the process for submitting both pull requests and issues to the project.

## License 📄

This project is licensed under the MIT License - see the [file](/LICENSE) for more details.

More information coming soon. Stay tuned! :octocat:!
