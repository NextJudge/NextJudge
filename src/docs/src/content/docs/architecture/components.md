---
title: Core Components
description: The components of the NextJudge framework.
---

The NextJudge framework is composed of a number of components. These components allow us to encapsulate functionality and make the framework more modular.

NextJudge follows a distributed architecture composed of a number of components/microservices that communicate with each other via gRPC, websockets, and HTTP.

The following diagram shows the current planned architecture of NextJudge:

![Architecture](/src/assets/architecture.png)

## Components

### Web Client

The Full Stack Web Application is responsible for providing a user interface for the NextJudge framework. It is responsible for handling requests from the outside world and routing them to the appropriate microservice. It is also responsible for handling responses from the microservices and routing them to the outside world.

### Bridge

The Bridge is responsible for connecting the NextJudge framework to developer applications, such as the NextJudge web client. It is responsible for handling requests from the outside world and routing them to the appropriate microservice. It is also responsible for handling responses from the microservices and routing them to the outside world.

### Data Layer

The Data Layer is responsible for storing data. It is responsible for storing contests, problems, submissions, users, and other data. We use a relational database (PostgreSQL) for storing data. The various microservices communicate with the database via HTTP. A REST API is used for communicating with the database.

### Engine

The Engine is responsible for compiling and running submissions. When a submission is received from the Bridge, the Engine will compile the submission and run it against the test cases. The Engine will then return the results to the Judge.

### Judge

The Judge is responsible for judging submissions. When a submission is received from the Bridge, the Judge will send the submission to the Engine. The Judge will then receive the results from the Engine and return the results to the Bridge.    