# Judge

This module is responsible for the actual code execution and judging of submissions.

When a judge is spun up, it will start listening to a RabbitMQ queue for submissions from the `bridge`. 

To add another judge to your pool, all you need to do is instantiate another instance of the judge and point it at the RabbitMQ server.

To isolate the compilation and execution of submissions, we use `nsjail` - https://github.com/google/nsjail
- Processes have limited resources (memory, CPU time, cores)
- They cannot make network requests
- During execution, they cannot read/write to files, and most syscalls are blocked

The judge process listens to a RabbitMQ queue. Upon receiving a submission to run, it pops it off the queue. 

First, the user submission is compiled, and if the compilation succeeds, the process is executed. All testcases are passed in via `stdin`. An `nsjail` wraps both of these steps for security. 

The `stdout` of the process is captured, and is compared against the expected values.

## Prebuilt image
```sh
docker pull ghcr.io/nextjudge/judge:latest
```

## Adding support for new toolchains in the judge

If you wish to create a judge that can support additional compilers, you can create a new Dockerfile.

You can start the Dockerfile by inheriting from any image of your choice. In this example, we will use `ubuntu:24.04`. Inside of it, install all the toolchains/compilers/runtimes necessary to support the new language.

```Dockerfile
FROM ubuntu:24.04 as BUILD

# Initially, the commands in the Dockerfile run as root.
# Run any commands that need to be run as root, such as `apt-get`
RUN apt-get install -y ruby

# Now that we done installing tools as root, we can `su` to the NEXTJUDGE_USER to install the rest of the toolchains which can be installed as a non-root user.
# Run the following 4 commands that create the dummy user, which simply ensures that the files have the correct UID/GID
RUN groupadd -g 99999 NEXTJUDGE_USER_GROUP
RUN useradd NEXTJUDGE_USER -u 99999 -g 99999 -s /bin/bash
USER NEXTJUDGE_USER
WORKDIR /home/NEXTJUDGE_USER

# Install the toolchains using any method
## Install Rust (Blazingly fast!)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Now, we are finished installing toolchains

# Start a new build state
FROM basejudge

# Copy the entire filesystem from above into /chroot.
## Inside the isolated context, this directory will be `chrooted` and act as the root file system.
COPY --from=BUILD / /chroot
# This line is necessary to allow mounting of a couple /dev files.
RUN chown -R 99999:99999 /chroot/dev

# Finally, you need to let the judge know how to build code for all the languages it supports. You can do this via a `heredoc` inside the Dockerfile.

RUN <<EOF /app/languages.toml
[[language]]
name = "rust"
version = "1.78.0"
extension = "rs"
script="""
#!/bin/sh
HOME=/home/NEXTJUDGE_USER /home/NEXTJUDGE_USER/.cargo/bin/rustc {IN_FILE} -o /executable/main
"""
EOF
```

## basejudge
To build the basejudge, use the following command:

```sh
docker build -f Dockerfile.base -t basejudge .
```


# Notes
It is recommended that you dedicate sufficient resources to each judge to ensure consistent performance. While a judge is handling submission, it is blocked.


