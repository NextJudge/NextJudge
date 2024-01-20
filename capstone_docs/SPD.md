# NextJudge - Software Development Process (SDP)

The following document outlines the following in reference to the software development process of NextJudge.

1. Principles
2. Process
3. Roles
4. Tooling
5. Definition of Done (DoD)
6. Release Cycle
7. Environments


## Principles
- All changes, whether bugs or major refactoring, need to be developed in separate git branches and, following a pull request including justification, will be reviewed and merged.
- The main branch will be protected so that only reviewed PR’s can be pushed to it. Each pull request is reviewed by at least one member of our team.
- Having strong documentation is a core guiding principle. Each change requires that associated documentation must be up to date.
- A GitHub projects kanban board will be used to continuously delegate and refine the project task list.
- We will assign equal work to each team member at our planning meetings.
- No feature or task will be prioritized without concrete feature roadmapping prior.
- We organize the priority of tasks in-terms of dependencies to releasing the minimal-viable-product. Extraneous features are to be noted for addition to later releases.
- We are responsive to communication on our Discord, and respond within 24 hours. This includes communicating explanations for why we’re unable to be responsive for a certain time period.

## Process
The developers of this project are going to be working asynchronously. The main process we will use is the “Kanban” process, which allows us to isolate individual tasks, track progress, keep an eye on dependencies, and keep the long-term vision of the project in focus. 

While using Kanban, we will utilize the flexibility of Agile and group work in terms of sprints. We will agree to have a certain sprint of work done by a certain deadline, allowing time for internal review, changes, and external feedback.
- Planning Sessions (roughly every 2 weeks):
    - Brainstorm all tickets that must be worked on as well as their dependencies.
    - Assign tickets to team members based on how much time they’ll have available for the next 2 weeks.
    - Happens every 2 weeks, or an informal one may happen earlier if all tickets are completed.
    - Large-scope tickets for the entire project will be created at the earlier team meetings, with the intention of dividing them up into smaller tickets when we begin work on them.
- The Kanban Board:
    - The Kanban planning board will have to-do, in progress, blocked, in review, and completed sections for tickets to flow into as they are worked on.
    - The board will include a backlog of epics before they are divided up into smaller tickets and pulled into the to-do sections.
- Meetings with Bailey and TA’s
    - We will have regular meetings with the TAs as well as Mike Bailey to keep us on track in our work. These meetings will help us ensure that all the work we are doing is relevant and that our project is making progress each week.
    - During these meetings, we will show off visual indicators of our progress, in the form of a demo of the current functionality of the progress. This will ensure we are meeting our target timeline and keep us accountable for implementing features.
- Documentation
    - Our developers are going to be working on multiple subcomponents, which will function independently, but speak to each other using socket API. Documentation of every public interface, the philosophy, reasoning behind architecture decisions and choices of dependencies must be well documentation to other that developers be onboarded to a module and start to contribute quickly.
    - We will use Markdown documentation - all documentation will be public.

## Roles
For this product, we have detailed roles and responsibilities for the developers involved. Everybody is responsible for being scrum master on a weekly rotating basis. They ensure weekly requirements are being met, and organize and ensure Kanban board is up to date, as well as formally delegate tasks. 

Additionally, all developers are responsible for public documentation - no single developer can oversee accurate and exhaustive documentation of all aspects of the project, so all developers are responsible for making public documentation in public-facing technical decisions and APIs. 

All developers are encouraged to collaborate with each other - it’s a tight knit team, and these roles serve as a high level guide.

- Project Lead: Otso
    - As the president of ACM and the one who identified the market need and brainstormed the solution, most of the project comes from his initial vision.
    - Will work with the ACM club to identify features that are must haves or can haves.
    - Takes lead in the design of the high level architecture of the subcomponents and how they interact
    - Identify competitors in the market to determine what features we should add/cut.
- Project Manager: Tom
    - Responsible for communication with our client.
    - Ensure that our team is properly building a project that meets our partner’s expectations.
    - Ensure documentation is up to date and relevant.
    - Secure and set up access to each external product or service that Nextudge needs.
- Front End Developer: Tom
    - Focus on client facing aspects of systems - UX and usability champion
    - Will work on the customer facing site and ensure that it is responsive to the user.
    - Ensure that the front end properly interfaces with the back end portions of the site.
    - Work with ACM members for feedback to ensure that the UX meets their needs.
- Back end developers: Jordan, Otso
    - Will work on implementing the back end portions of the project, including the executor, the bridge, and the database.
    - Ensure that the backend is reliable, secure, and responsive.
    - Keep documentation up to date for how each part interfaces together.
- Scrum Master: Everyone
    - Runs planning meetings to ensure that everyone is on task.
    - Assigns tickets to team members as they arise.
    - Works with the team members to resolve any blockers that someone may have in our stand up meetings.

## Tooling
|  Concept    | Tool |
| ----------- | ----------- |
| Version Control      | GitHub       |
| Project Management   | GitHub Issues and Projects        |
| Documentation | Starlight, README, comments in code |
| Test Framework | Jest, golang testing package |
| Linting and Formatting | Prettier, ESLint, Husky, golangci-lint  |
| CI/CD | GitHub Actions |
| IDE | Visual Studio Code |
| Graphic Design | Figma, draw.io (integrated into VSCode) |
| Virtualization Environment | Docker and Kubernetes |
| Cloud environment |  OSU self-hosted infrastructure. |


## Definition of Done (DoD)
- Pull request has been merged to the main branch.
- All CI/CD tests must pass, and regressions are not detected.
- Technical documentation has been released publicly on the feature/API. This means updated docs, comments, and README’s.
- Release notes are created to provide a description of the changes, new features, bug fixes, and any breaking changes introduced for our stakeholders.
- The changes have been deployed to the staging environment for use by ACM club members.
- Feature has been displayed to our project partner with no further feedback.

## Release Cycle
- We will use SEMVER (semantic versioning) to track changes through the project
    - While development of the first major release is underway, the major version will be 0. This means that since the API is not in a working state, according to the SEMVER spec, the minor and patch versions have no semantic meaning, and will change arbitrarily. 
- Our first public release of the project (1.0.0) will contain a minimal viable release.
    - Minor releases must be accompanied by a GitHub releases announcement outlining the changes, new features, and new API’s.
- After our first full 1.0.0 release, following the standard semantic versioning, the version number MAJOR.MINOR.PATCH correspond to:
    - MAJOR - will be incremented whenever there are major, breaking API changes.
    - MINOR - will be incremented whenever new features are added.
    - PATCH - will be incremented when there are bug fixes.
- All merges must pass a test-suite as well as manual review
    - Documentation is a blocking issue - if there is no documentation on a feature, we cannot release it.
- We deploy to production on every release - this speeds up getting out bug fixes and features, so developers don’t need to wait on an arbitrary release cycle.

## Environments
Due to the nature of our final product, which is not meant to be a hosted application, there is not a need for a staging environment. Rather, our equivalent of the production environment, would be deploying to the OSU hosted instance of NextJudge that the ACM club will be using. We will also have a separate development environment on the OSU server that we will deploy to for developing updates.


|  Environment    | Infrastructure | Deployment | What is it for? | Monitoring | 
| ----------- | ----------- |  ----------- | ----------- | ----------- |
| Development      | Internally exposed instance on OSU server, Kubernetes, Docker  |  Manually deploying | Developing and testing microservices | Golang log package, Morgan, printing to console
| Production | Publicly exposed instance on OSU server, Kubernetes, Docker | Merge to main | The OSU ACM club’s deployment of the solution | Golang log package, Morgan |


