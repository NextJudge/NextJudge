<p align="center"><img src="https://i.ibb.co/cg8YFt5/preview.png" width="560" height="300" /></p>

<h1 align="center" style="font-size:2em;">NextJudge</h1>

<div align="center">

The competitive programming [platform][site-url] and [command-line interface][cli-url]—for everyone.

![Last commit][last-commit-image]
![:)][with-love-image]
![Licese][license-image]

[site-url]: https://nextjudge.net
[judge-url]: https://github.com/NextJudge/NextJudge/tree/main/src/judge
[cli-url]: https://github.com/NextJudge/NextJudge/tree/main/src/cli
[license-image]: https://img.shields.io/github/license/nextjudge/nextjudge?style=flat-square&color=dc4405
[last-commit-image]: https://img.shields.io/github/last-commit/nextjudge/nextjudge?display_timestamp=committer&style=flat-square&logo=github&color=dc4405
[with-love-image]: https://img.shields.io/badge/made_with_love_in_oregon-%E2%9D%A4-dc4405?style=flat-square&color=dc4405

</div>

##

NextJudge is a suite of services and applications for competitive programming contests. Our primary product is the [nextjudge.net][site-url] platform, meant to conduct programming contests and provide a platform for participants to practice and compete.

### Structure

NextJudge is a monorepo, which allows our services to share dependencies and code; for example,the `web` application uses the `judge` service to run and judge code submissions, and the `cli` application uses the `data-layer` service to retrieve problem information.

```
.
├── src
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

To run the services locally while developing, you can use `Docker` with hot reload.

The source code is mounted, and a process is set up to detect changes and restart the service when you save files.

You can run the following script to start the services:

```sh
./dev-deploy.sh
```

To flush the database and remove all volumes (completely refreshing the Docker environments), run the following script:

```sh
./fully-reset.sh
```

## Contributing 🤝

Thank you for your interest in contributing to NextJudge! Please read our [contributing guidelines](/CONTRIBUTING.md) and our [code of conduct](/CODE_OF_CONDUCT.md) for the process for submitting both pull requests and issues to the project.
