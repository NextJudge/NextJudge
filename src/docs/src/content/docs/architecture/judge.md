---
title: Judge Service
description: How the judge service compiles and executes code submissions.
---

The judge service is responsible for securely compiling and executing code submissions in isolated environments. It processes submissions from a RabbitMQ queue and returns results to the data layer.

## Architecture

The judge service is a Python application that:

1. Connects to RabbitMQ to receive submission messages
2. Retrieves submission data and test cases from the data layer API
3. Compiles code in an isolated environment using nsjail
4. Executes the compiled code against test cases
5. Compares output with expected results
6. Reports results back to the data layer

## Security: nsjail

All code compilation and execution happens inside nsjail, a process isolation tool that provides:

### Resource Limits

- **CPU Time:** Configurable per problem (default 10 seconds for execution, 30 seconds for compilation)
- **Memory:** Configurable per problem (default 6MB virtual memory for execution, 16MB for compilation)
- **CPU Cores:** Limited to 1 core for execution, 2 cores for Go compilation
- **File Descriptors:** Limited to 512 for compilation, 3 for execution

### Isolation Features

- **Chroot Environment:** Code runs in a minimal chroot filesystem
- **User Namespace:** Runs as unprivileged user (UID 99999)
- **Network Restrictions:** No network access during execution
- **File System Restrictions:** Read-only access to most filesystem, writable only in specific directories
- **System Call Filtering:** Restricted syscalls via seccomp

## Submission Processing Flow

### 1. Receive Submission

The judge listens to the `submission_queue` RabbitMQ queue. When a message arrives:

```python
{
  "type": "submission",
  "id": "submission-uuid"
}
```

### 2. Fetch Submission Data

The judge retrieves submission details from the data layer API:

- Source code
- Language ID
- Problem ID

### 3. Fetch Test Cases

The judge retrieves all test cases for the problem from the data layer API.

### 4. Compile Code

Code is compiled in an isolated environment:

1. Create a unique environment directory
2. Write source code to build directory
3. Execute language-specific build script inside nsjail
4. Capture compilation output (stdout/stderr)

If compilation fails, the submission is marked as `COMPILE_TIME_ERROR` and processing stops.

### 5. Execute Test Cases

For each test case:

1. Execute the compiled program with test input via stdin
2. Capture stdout and stderr
3. Compare output with expected output (line-by-line, trimmed)
4. Check for resource limit violations

Execution stops at the first failing test case.

### 6. Report Results

Results are sent back to the data layer via HTTP PATCH request:

```json
{
  "status": "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" |
            "MEMORY_LIMIT_EXCEEDED" | "RUNTIME_ERROR",
  "stdout": "program output",
  "stderr": "error output",
  "time_elapsed": 0.123,
  "failed_test_case_id": "uuid",
  "test_case_results": [
    {
      "test_case_id": "uuid",
      "stdout": "output",
      "stderr": "",
      "passed": true
    }
  ]
}
```

## Submission Statuses

- **PENDING:** Submission is queued, waiting for judge
- **ACCEPTED:** All test cases passed
- **WRONG_ANSWER:** Output doesn't match expected output
- **TIME_LIMIT_EXCEEDED:** Program exceeded time limit
- **MEMORY_LIMIT_EXCEEDED:** Program exceeded memory limit
- **RUNTIME_ERROR:** Program crashed or threw an exception
- **COMPILE_TIME_ERROR:** Code failed to compile

## Custom Input Execution

The judge also handles custom input submissions (for testing code with arbitrary input):

1. Receives code and stdin input
2. Compiles code
3. Executes with provided stdin
4. Returns stdout, stderr, and runtime

This is used by the web interface's "Run Code" feature.

## Environment Setup

Each submission gets a unique execution environment:

```
/program_files/{uuid}/
  ├── build/          # Compilation directory
  │   ├── input.{ext} # Source code
  │   └── build.sh    # Build script
  └── executable/      # Execution directory
      └── main        # Executable script/binary
```

The environment is cleaned up after processing completes.

## Horizontal Scaling

Multiple judge instances can run simultaneously, all consuming from the same RabbitMQ queue. This allows horizontal scaling:

- Add more judge instances to handle increased load
- Each judge processes one submission at a time (prefetch_count=1)
- RabbitMQ distributes submissions across available judges

## Configuration

Judge configuration is controlled via environment variables:

- `RABBITMQ_HOST` - RabbitMQ server hostname
- `RABBITMQ_PORT` - RabbitMQ server port
- `RABBITMQ_USER` - RabbitMQ username
- `RABBITMQ_PASSWORD` - RabbitMQ password
- `NEXTJUDGE_HOST` - Data layer API hostname
- `NEXTJUDGE_PORT` - Data layer API port
- `JUDGE_PASSWORD` - Password for judge authentication

## Language Mapping

The judge maintains a mapping between data layer language IDs and local language configurations. On startup, it:

1. Fetches languages from data layer API
2. Matches by name with local language configurations
3. Creates bidirectional mapping for lookups

## Error Handling

The judge includes robust error handling:

- **Connection Failures:** Retries connecting to RabbitMQ and data layer
- **Compilation Errors:** Captures and reports compilation output
- **Execution Errors:** Detects timeouts, memory issues, and crashes
- **Message Processing:** Uses requeue on failure, rejects redelivered messages

## Monitoring

The judge logs important events:

- Submission received
- Compilation start/finish
- Test case execution
- Result submission
- Errors and failures

Logs can be used to monitor judge performance and debug issues.
