# NextJudge Project Requirements Document (PRD)

## Problem Description

Competitive programming is computer science as a sport. Communities around the world learn and compete through problem-solving and algorithmic challenges for fun, to further their own coding knowledge, and to help them in their interviews and careers. The community is very large, with student groups at nearly every university dedicated to competitive programming, with monthly worldwide competitive programming competitions ongoing that connect tens of thousands of people, and with employers promoting competitive programming due to it fostering technical interview skills.

Despite the wide prevalence of competitive programming, there does not exist an adequate and accessible open-source solution that would allow groups to easily integrate a competitive programming experience into their projects.

As such, we are creating an open source, extensible, and modular competitive programming code execution and judging framework that developers can download and integrate into their own projects to perform all the tasks associated with competitive programming, including challenge management, solution validation, and user tracking.

### Scope

The target audience for our project is developers and groups wishing to have a pre-made solution to run a competitive programming platform  - whether a standalone event or as a system integrated into a larger application. The final product will be a collection of modules that developers can download and run in order to set up a competitive programming environment as a microservice.

Firstly, we are building a secure, performance, and scalable judging application - a daemon service that runs code and determines whether the code performs a certain calculation correctly. This is the “judging” part of competitive programming.

Secondly, we are building a module, dubbed the “bridge”, which is an environment that developers will interact with to track users, upload challenges as an administrator, and act as a public API for the judge, hiding its internal implementation. This will be the service that handles the administrative tasks of competitive programming, such as tracking user progress on challenges, maintaining the challenges themselves, and allowing users to upload solutions and have them forwarded to the judge for a verdict.

Thirdly, we are building a full-stack application that uses the bridge and the judge as a microservice to perform competitive programming tasks. This will be a contest website, which allows frontend users to create accounts, and compete against other users in algorithmic problems. The goal of this is to showcase the extensibility and API of the bridge and act as the “default” baseline that developers can extend for their uses.

Underlying all the modules is the idea of documentation and accessibility. The systems should be usable - you should be able to spin up an environment with one command. The APIs should be intuitive, allowing a developer to easily learn the methods and integrate them into their application. 

### Use Cases
- A student group, such as an ACM chapter that competes in the ACM International Collegiate Programming Contest, wishes to host a learning platform to help their team learn skills and practice. They will self-host the bridge and judge, and access the bridge API in their own applications in order to handle the competitive programming tasks. This allows them to create a completely custom frontend. Or, they may use our full-stack application, and not have to create a frontend from scratch.

- A company wants to integrate competitive programming as part of an interview process, but do not want to use existing closed-source solutions and rely on third parties. They want a library to simply handle the judging and user tracking, but they want to add their own secret sauce into their project. Our project has no “lock-in”, in terms of requiring a certain frontend to talk with the backend.

- Educational competitions - a group wants to run a competitive programming competition, and can simply run our full-stack solutions to get it running. 

- Self-hosting enthusiasts want to showcase their challenges, show them off to friends, and learn along the way. They will use our project to handle these needs.

## Purpose and Vision (Background)

We want to create the “standard” platform for competitive programming self-hosting. Existing codebases and solutions, which claim to solve the same general problem - often marketed with the words “competitive programming competition system” - are fundamentally geared towards a different user base - one that simply wants to run a single competition event in an isolated environment, but don’t have a need for extensibility, a custom frontend user interface, nor an ability to integrate judging as a microservice as a module in a larger project. 

Our vision was born from first-hand experience in the need for this product, and by seeing the fragmentation of the existing ecosystem of projects that aim to solve issues tangential to the one we are solving, but never encompassing all use cases. The fundamental problem we are solving is that there isn’t a simple pre-made solution that people can insert into their project to fulfill the need to run a competitive programming backend - people have to reinvent the wheel every time they wish to integrate competitive programming style judging into their projects. This results in added costs for businesses, increased development time for developers, even a lack of accessibility for organizations without the ability to implement a solution to their needs.

Developers want a solution that handles judging of problems, the ability to upload challenges and problem criteria, keep track of user progress, and, most importantly, have strong extensively in the form of frontend API integration and backend plugins. Existing methods lack usability, have strongly coupled components, lack well-documented APIs, and are virtually non-extensible.

Our final product will eventually become open-source, to allow the project to grow and to make the project more accessible and viable for groups around the world to use. We believe there is great interest in the problem we are solving, and we are tailoring the architecture of the project to meet the needs of the various end-users. We want our project to be easily accessible and expanded upon so that other organizations are able to use our work and modify it for their own needs. By providing an accessible platform for creating competitions, more people will be able to become involved with competitive programming not just at OSU, but everywhere around the world. We want to be able to foster an open-source community around our project that will provide feedback, request changes, and make forks of the project.

## Stakeholders

Our vision is fundamentally grounded in accessibility. We want as many people to have access to fulfill their project ideas and want to create an easy-to-use solution that can be integrated easily, like any other library or framework they are using in their product. The product is well documented, simple and intuitive for developers, and extensible with a simple API, so that developers who wish to extend our functionality can do so easily, without needing to start their project from scratch. 

The following stakeholders are ranked by the degree of impact that features changes have on their workflows:

### 1st Party: Developers such as the ACM Club at OSU

- Will be updated very frequently on our progress and the implementation, possibly weekly, so that we align our implementation with their needs.

- They are the decision makers; set clear goals on what they need and what is acceptable as “usable”

- Their decisions impact time allocation, research into new topics, and alignment of goals

### 2nd Party: Competition organizers

- This stakeholder encompassed groups and individuals that integrate our product into their solution with the purpose of competition organizing.

- Periodic updates on features that they are interested in - not implementation level, but user level, meaning interface design, customization, and ease of use.

- They are decision-makers in the form of feedback, telling us what documentation and APIs need better defining, and what types of extensibility are necessary.

- As a stakeholder, decisions regarding new features and breaking changes in APIs will go through here, as well as feedback on what new features are necessary to keep them using our product.

### 3rd Party: Open-source contributors

- Daily updates on feature progress and goals, how our product is being used, and how to best contribute.

- This stakeholder can provide decisions that change the technical implementation and expand the project scope to encompass more use cases.

- They make decisions on code additions, and new features, and have a say in the strategic goals of the project.

### 4th Party: Clients of developers

- Indirectly, our stakeholders also include the clients of the developers who use our product. If our framework is not easy to use, and if developers are unable to easily use the best practices, that will inevitably result in poor user experience for clients that use the products that depend on our framework. 

- Need to be updated periodically, but less frequently than developers. 

- They are decision-makers too, letting developers and us know what kind of experience they want, and the engineering team needs to facilitate it.

- Their decisions impact the objectives of the final framework and can lead to additional features.

## Preliminary Context

### Assumptions

#### General

- The users who deploy our project will have the requisite knowledge to do so. This includes the ability to use Git, run commands from a Linux command line, and change configuration files.

- We have one year of work in our group to release a viable product publicly - but the project is not done. Then, the open-source nature of the project will bring in external contributors.

#### Technical Assumptions

- Adequate security measures will be implemented to protect our user’s data and prevent malicious code from compromising our system.

- Services we use will be regularly updated by the vendor to limit security vulnerabilities.

- All dependencies will be free and open-source.
We assume the system will need to be run at scale, meaning that we are investing in an underlying architecture that allows rapid horizontal scaling of modules to increase performance and reduce lag and latency on submissions.

- The system will be compatible with a wide range of programming languages and development environments to accommodate diverse coding challenges.

#### Development Assumptions

- We have one year of work in our group to release a viable product publicly - but the project is not done then, instead the open-source nature of the project will bring in external contributors.

- We assume that sufficient resources, including funding, development team capacity, and infrastructure, will be available to support the project's ongoing development and maintenance.

### Constraints

- We only have the current academic year to work on NextJudge - Project development and implementation must align with the academic calendar of OSU, including breaks, other courses, and differing schedules.

- We must abide by any licenses for open-source services we integrate into NextJudge.
The project's technological choices are constrained by factors such as our expertise, programming languages, and third-party services, which may impact our selection of development tools and frameworks.

- Every service must be free and open source. This does not include server costs, which will be handled by anyone attempting to deploy our solution.

### Dependencies

#### Deployment Dependencies

- We are dependent on the stability and reliability of any open-source services and libraries we use for NextJudge.

- We are dependent on the stability and reliability of the OSU server.

#### Software Dependencies

- The various software libraries and frameworks which are dependent for core functionality, needed to actually develop and deploy NextJudge.

- Third Party API’s for enhanced developer and user experience in things such as authentication and data retrieval providers.

#### Data Dependencies

- We don’t have data dependencies - we only create the framework for competitive programming, but we do not create the challenges that will inhabit the platforms that use our framework. 

## Market Assessment and Competition Analysis

Existing alternatives do not aim to solve the problem we are tackling. There are both open-source and proprietary solutions to the problem at hand.

There is no comprehensive open-source solution to the problem we are solving. Most “judging” or “contest” projects you might find on GitHub are meant as a solution that runs a single competitive programming event, with a coupled frontend-to-backend. These projects do not allow integration of a coding judging service into a larger product. However, a couple exist in the general corner of the market. 

The main aspect that makes our solution competitive is the open source nature of the project that allows for other users and clubs to extend features for their own needs. None of these solutions allow for users to create their own project that modifies part of the code, or for users to deploy a personal instance of the solution.

### CodeForces, Atcoder

- These are online competitive programming platforms, so they are not self-hostable. They are suitable for competitive programming problems and contests, yet lack the level of customization needed for hosting competitions for educational institutions. More geared towards public contests and is not open source. 

- A group cannot choose to integrate CodeForces elegantly into their project, as its goal is to be a hosted platform, akin to a social media site for competitive programming, and not a microservice. 

### HackerRank, Leetcode

- Closed-source hosting platform, solely for competitions. Beginners-friendly interface, support for dozens, if not hundreds, of programming languages. Cannot be self-hosted, incredibly cumbersome to create challenges, and like all other existing solutions, it cannot be used as a microservice/subsystem integrated into a larger product. It only stands on its own.


### Custom in-house solution

- Uses a combination of tools and platforms making it easy to tailor for specific needs. Lacks extensibility, documentation, and community support. Can be resource-intensive to develop and maintain.

### Open-source solutions

- May lack features, usability, and documentation, making it difficult to sustain for academic and club use cases. A similar platform, CTF'd, exists, but is for Capture The Flag cybersecurity competitions. Judge0, another alternative, does not offer a full-stack solution although it does offer code execution and multiple hosting options.

## Target Demographics (User Personas)

- Sebastian is a 21 year old computer science student at OSU, and is involved in th ACM club. His primary goal is to organize and host OSU specific coding competitions for the club. He understands computers, and the open-source world, and wants to find an open-source project that fulfills his needs. People like Sebastian represent a significant number of users since there’s over 680 student chapters worldwide, each with their own contest customization needs and teams.

- Janayla is a software engineer at a large tech company with a passion for open source and competitive programming contests. Janayla seeks a platform allowing her to participate in contests and contribute to the project, allowing her to engage in a community of both like-minded enthusiasts and engineers. She also wishes to add a feature to NextJudge which is currently not available on the project.

- Arman is interested in doing competitive programming contests and challenges. His goal is to find a platform that hosts competitions, offers a judging system, and provides a variety of challenges to improve his coding skills.

## Requirements

### User Stories and Features (Functional Requirements)

| User Story | Feature          | Priority    | GitHub Issue | Dependencies |
|------------|------------------|-------------|--------------|--------------|
| As an ACM club member, I would like to be able to browse problems submitted by other users and write solutions to them to improve my competitive programming skills.          | Problem browsing | Must Have   | TBD          | N/A          |
| As an open source developer, I would like to be able to fork open judge and add any features that I may need for my specific use cases, so I don’t have to create my own solution from the ground up.          | Extensibility    | Should Have | TBD          | N/A          |
| As the ACM president at OSU, I would like to be able to create competitions using problems submitted by members of our local ACM chapter so that we can practice for ICPC.          | Competitions    | Should Have | TBD          | Problem browsing, problem judging         |
| As a student, I would like to be able to submit problems for my peers to solve, so I can challenge them and help them become better programmers.          | Problem Judging    | Must Have | TBD          | Problem browsing         |
| As an ACM user, I would like to be able to login to track my submissions so I can see how much work I’ve done.         | Problem Tracking    | Should Have | TBD          | Problem browsing, Problem submission         |

### Non-Functional Requirements

#### Performance

- Code submissions should be executed and completed with menial delay to create a responsive experience for end-users.

- The performance should be reproducible given the same hardware to ensure fairness in judging.

- The latency between submitting a solution and getting feedback should be as low as possible to ensure users can have quick iteration on their solutions. 

#### Scalability

- NextJudge should be able to handle an ever growing number of users and code submissions, ensuring that as the user base expands, the system is tolerant and can scale as such.

- Submissions should be queued and any delays in judging should be hidden from the user or well-communicated.

#### Security

- The system should prevent unauthorized access to user specific data.

- Code must run in a sandbox environment to ensure people don’t run arbitrary code and gain control over hosted machines.

#### Usability

- The entire project should be very highly documented, from code to public API. This ensures that contributors can be onboarded quickly, and if developers want to find how something works to add on it, it is easy to do so.

- A self-hosted version of the judge should be very easy to run - a one line command, ideally, with sane defaults.

- The public API should use best practices, use intuitive naming conventions on fields, so that learning the API should only require reading examples, and not the implementation. 

#### Open Source

- The project will be open source. This means we actively listen to the community for feedback on features and allow contributors to join the project - it must be accessible to new contributors.

#### Compatibility

- The hosting environment should run on most Linux based platforms. The installation should be distribution agnostic, and thus compatible with all Linux platforms.

### Data Requirements

There will be data stored about users in the system. At a high level, this includes user credentials, code submission data, and competition data. The following diagram shows the specific fields that different data types contain in the SQL database, as well as the relation between them.

![The NextJudge Database Schema](https://github.com/NextJudge/NextJudge/blob/prd/images/Schema.png?raw=true)

### Integration Requirements

#### Compilers

- We will use existing compiler and language runtimes, such as GCC, node, python, and any other open-source and publicly available one in order to compile and run user submissions

#### User Authentication

- OpenJudge should integrate with robust user authentication services to allow users to log in securely.

#### Data Storage

- We will use an existing database solution, SQL, in order to persistently and reliably track user data. This allows us to safely query information, add information associated with a user, and save data across user sessions.


#### Testing Frameworks

- Integration with testing frameworks may be necessary to verify code submissions. This can involve test case execution and result comparison.

- This includes passing code submissions to testing frameworks and receiving test results.

### User Interaction and Design

![The NextJudge Front Page](https://github.com/NextJudge/NextJudge/blob/prd/images/Frontpage.png?raw=true)

![The NextJudge Submission Page](https://github.com/NextJudge/NextJudge/blob/prd/images/Submission.png?raw=true)

## Milestones and Timeline

### 1st Milestone: Simple Judge Setup

#### Features

- Ability to submit code, have it execute, and receive the judging result

- Docker-based code execution environment

#### Timeline

- 1 month

#### Dependencies

- None

### 2nd Milestone: Test Case Management and Scoring

#### Features

- The bridge daemon listens as Websocket API, servicing users requests to submit code and forward it to the judge. This will work for at least a single programming language.

- Detailed feedback to users

- Feedback to user - submission was incorrect or correct

#### Timeline

- 1 month

#### Dependencies

- Milestone 1

### 3rd Milestone: Frontend Development and User Interface

#### Features

- Create a frontend full-stack application that uses the bridge and the judge to serve challenges to users. Allows account creation, querying of account details, submission of solution files, and feedback on submissions.

- User profiles and settings

#### Timeline

- 3-4 months

#### Dependencies

- Milestone 2

### 4th Milestone: Admin Panels and Challenge Creation

#### Features

- Support for multiple programming languages

- Custom test case creation and uploading

#### Timeline

- 1 month

#### Dependencies

- Milestone 2

### 5th Milestone: Self–hosting Environment Documentation

#### Features

- Final push for public release, combing through code and documentation to ensure correctness and good coding style

- Comprehensive documentation for self-hosted instance

- User guides for setting up the code execution environment

- Interoperability guide for customers who want to replace certain services with their own solution

#### Timeline

- 1 month

#### Dependencies

- All prior milestones

## Goals and Success Metrics

| Goal | Metric | Baseline | Target | Tracking Method |
|------|--------|----------|--------|-----------------|
| Create a sizeable user base within the OSU ACM club | Number of registered accounts | 0 users | 20 users | Checking registered users in our database |
| Flexibility in code choice | Number of languages supported by the back end | 1 language (C++) | Support for at least 4 languages C++, Python, Go, TypeScript | Merged feature branches that add code support |
| Speed and reliability | Time between problem submission and user feedback | 3 minutes | 30 seconds | Logging Services |
| Ease-of-use for self hosting | How easy do you believe it is to self-host and extend our project, scale of 1-10 | 1/10 | 8/10 | Interview and eliciting feedback through forms |
| Ensure code quality and security | Number of security vulnerabilities | 0 vulnerabilities |0 vulnerabilities within the code execution environment | Security audits and testing, GitHub CodeQL |


## Open Questions

### User Interface

- How soon should we start working on this? Context: for testing the various other services and their interactions, I think having even a simple frontend client could help. Especially if we want to test system load (ie. two users submitting code at the same time)

- Should we allow users to add their “own” custom test cases?

- Should we follow the Codeforces route - file upload / select a language and boom?

### Backend Server

- For our backend server, will using an approach involving Kubernetes to scale docker containers work?

- With the backend being the core of the product, we may need a load balancer with the amount of load we’d be receiving at peak points (competitions)

### Database

- Should we use a logger/monitor with a GUI?

- Is our only SQL usage going to be Submission CRUD? What else?

### Message Broker 

- Our backend may need to be both a consumer and producer…how do we avoid loss or corruption? 

- Will we be able to scale as the number of submissions grow?

### User Management Service

- There are services that do this now. Should we use them?

- Is it worth dealing with passwords, usernames, etc.? “Another password to remember”

### Problem Management

- Will we store the test cases in each problem? Will the user be able to use custom test cases?

### Code Evaluation Service

- What if two users want to execute code at the same time? 

- Starting a container on each execution takes a long time, do we really want that latency?

- If we create a pool of containers, how do we mitigate container escapes and ensure isolation?

### Security

- How can we maintain good security within docker containers or whatever virtualization framework we pick?

- Is it too risky to have a pool of containers where the code gets executed? 

- Is disabling network access too much? 

### Low Latency

- Creating a container every time a user submits their code could take forever, how do we avoid this?

- Certain languages need specific runtimes (looking at you…Java) how should we handle this? Pre-built containers? But then, how do we ensure utmost security?

## Out of Scope

### Advanced Grading

- NextJudge will not include the implementation of advanced systems for grading and scoring code submissions, such as interactive problems. It will rely on traditional test case evaluations.

### Advanced Security Features

- NextJudge will not implement extensive security audits or comprehensive vulnerability checks. Of course, basic security practices will be followed, but in-depth security measures will be in the hands of users.

### Complex Reporting and Analytics

- NextJudge will not offer advanced reporting and analytics features, including in-depth competition statistics, detailed code performance analysis, or comprehensive reporting dashboards.

### Customizable Frontend Themes

- While the project includes a user-facing frontend, extensive customization of front-end themes or layouts will be out of scope. Users may need to handle extensive frontend customization independently.

### Integration with Specific IDEs

- NextJudge will not provide integration with specific integrated development environments (IDEs). Users will need to adapt their IDEs to work with the system if desired.

### Mobile Application Development

- NextJudge will not be developed for mobile applications. Users can access the platform through web browsers on mobile devices.

### Complex Compiler Support

- NextJudge will not include a wide range of compiler support beyond essential programming languages. More broad/advanced language support may require open-source contributions.

### Miscellaneous

- We will not host the system for clients, it will be up to them to deploy their own implementation of NextJudge.

- We will not develop any features requested by external clients, since as an open-source solution the goal is to have them make any changes they need.

- We will not invest time into marketing NextJudge
