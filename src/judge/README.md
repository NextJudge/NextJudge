# Judge

This module is responsible for the actual code execution and judging of submissions.

When a judge is spun up, it will start listening to a redis queue for submissions from the `bridge`. 

To add another judge to your pool, all you need to do is instantiate another instance of the judge and point it at the redis queue.

To isolate the compilation and execution of submissions, we use `nsjail` - https://github.com/google/nsjail
- Processes have limited resources (memory, CPU time, cores)
- They cannot make network requests
- During execution, they cannot read/write to files, and most syscalls are blocked

The judge process listens to a redis queue. Upon receiving a submission to run, it pops it off the queue. 

First, the user submission is compiled, and if the compilation succeeds, the process is executed. All testcases are passed in via `stdin`. An `nsjail` wraps both of these steps for security. 

The `stdout` of the process is captured, and is compared against the expected values.

# Make a judge support a new compiler

If you wish to create a judge that can support additional compilers, you can create a new Dockerfile.

Use the `basejudge` image as the base image. 

The judge will `chroot` the contents of the `/chroot` directory during compilation and runtime.

First, build the base image locally

```sh
docker build -f Dockerfile.base -t basejudge .
```

Then, specify it as the base image, and install any packages necessary to support the compiler you want to add. The base image is `Ubuntu` based.
```Dockerfile
FROM base-judge

# Install Rust (Blazingly fast!)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Need to ensure it is in the path

# Finally, add the language tag to this instance, so the system knows that this container can compile and judge Rust programs!
```

Finally, you need to let the judge know how to build code for all the languages it supports. You can do this via a `heredoc` inside the Dockerfile.

```Dockerfile

RUN <<EOF /app/languages.toml

EOF
```

# Notes
It is recommended that you dedicate sufficient resources to each judge to ensure consistent performance. While a judge is handling submission, it is blocked.


