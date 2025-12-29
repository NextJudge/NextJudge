---
title: Introduction
description: Complete guide to NextJudge competitive programming platform
---

NextJudge is an open-source competitive programming platform designed to host coding contests, judge submissions, and provide a practice environment for programmers. Built as a distributed system, it handles code compilation, secure execution, and automated testing across multiple programming languages.

## What is NextJudge?

NextJudge is a complete competitive programming ecosystem that you can self-host. Unlike proprietary platforms like LeetCode or Codeforces, NextJudge gives you full control over your data, customizations, and contest hosting capabilities. The platform consists of several interconnected services that work together to provide a seamless experience for both contest organizers and participants.

### Real-World Use Cases

**University ACM Chapters**
Host practice contests for ICPC preparation. Configure problems specific to your curriculum, run internal qualifying rounds, and track student progress over time.

**Technical Interview Preparation**
Companies can create custom problem sets that mirror real interview questions. Build a private platform for evaluating candidates or providing employee training.

**Programming Bootcamps**
Run cohort-based competitions with timed contests. Use the modular architecture to integrate with existing learning management systems.

**Online Communities**
Build public coding challenge platforms with your own branding and community features. Scale from dozens to thousands of concurrent users.

**High School CS Education**
Teachers can create beginner-friendly problems and monitor student submissions in real-time. Use the sandboxed execution to ensure safe code evaluation.

## Core Capabilities

### Multi-Language Support
NextJudge supports over 15 programming languages including C, C++, Python, Java, JavaScript, TypeScript, Go, Rust, Ruby, Lua, Kotlin, and Haskell. Each language runs in an isolated environment with configurable resource limits.

### Secure Code Execution
All submissions execute inside nsjail sandboxes with strict resource limits. Network access is blocked, file system access is restricted, and CPU/memory limits prevent abuse. This ensures fair evaluation and system security.

### Scalable Architecture
The distributed design allows horizontal scaling. Add more judge instances to handle submission spikes during live contests. The message queue ensures reliable processing even under heavy load.

### Contest Management
Create timed contests with multiple problems. Set start and end times, invite participants, and track leaderboard rankings in real-time. Support for both public and private contests with fine-grained access control.

### Real-Time Updates
The web interface provides live submission status updates. Participants see immediate feedback on compilation errors, runtime failures, or accepted solutions without page refreshes.

## System Requirements

Before deploying NextJudge, ensure your system meets these requirements:

**Minimum (Development)**
- 4GB RAM available
- 2 CPU cores
- 20GB free disk space
- Docker and Docker Compose installed
- Ports 3000, 5000, 5672, 5432 available

**Recommended (Production)**
- 8GB+ RAM
- 4+ CPU cores
- 100GB+ free disk space (for logs and database growth)
- SSD storage for database
- Dedicated network for inter-service communication

**Network Requirements**
- Internal network access between containers
- External access to port 3000 (web interface)
- Optional: External access to port 5000 (API)

## Platform Comparison

When evaluating competitive programming platforms, consider these factors:

**Self-Hosting and Data Ownership**
NextJudge runs entirely on your infrastructure. You control all data, user information, and contest content. No vendor lock-in or third-party data sharing.

**Customization and Branding**
The open-source nature allows complete customization. Modify the UI, add features, or integrate with existing systems. White-label the platform for your organization.

**Cost Structure**
No per-user fees or subscription costs. Expenses are limited to your infrastructure. Scale based on actual usage rather than artificial tier limits.

**Community and Support**
Active development with regular updates. Community-driven feature requests and bug fixes. Transparent roadmap and contribution process.

**Performance and Reliability**
Distributed architecture prevents single points of failure. Judge workers can be scaled independently. Database optimizations support high concurrent user loads.

## Architecture Overview

NextJudge uses a microservices architecture with clear separation of concerns. The web interface handles user interaction, the data layer manages persistence and business logic, and judge workers handle code execution. RabbitMQ provides reliable message passing between services.

**Data Flow Example**
When a user submits code, the web interface sends it to the data layer API. The data layer stores the submission and enqueues it for processing. An available judge worker picks up the submission, compiles the code in an isolated environment, runs it against test cases, and reports results back to the data layer. The web interface polls for status updates and displays results to the user.

This architecture ensures that heavy code execution doesn't block the user interface, and multiple submissions can be processed concurrently across multiple judge instances.

## Getting Started Journey

New to NextJudge? Follow this learning path:

1. **Quick Start** - Deploy using Docker Compose and explore the platform
2. **Key Concepts** - Learn the terminology and core concepts
3. **Development Setup** - Set up your local development environment
4. **Architecture Deep Dive** - Understand how the components interact
5. **API Reference** - Integrate NextJudge into your workflows

Each step builds on the previous one, taking you from basic deployment to advanced customization and integration.

## Community and Contributions

NextJudge is actively developed by students and open-source contributors. We welcome bug reports, feature requests, documentation improvements, and code contributions. The modular architecture makes it easy to contribute to specific components without understanding the entire system.

Whether you're fixing a bug in the judge isolation logic, adding a new language to the executor, improving the web interface, or writing documentation, your contributions help make NextJudge better for everyone.