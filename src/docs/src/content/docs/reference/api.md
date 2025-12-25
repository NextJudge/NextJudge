---
title: API Reference
description: Complete API reference for the NextJudge Data Layer.
---

The NextJudge Data Layer exposes a REST API for managing users, problems, submissions, contests, and languages. All endpoints are prefixed with `/v1/`.

## Authentication

Most endpoints require authentication via a JWT token passed in the `Authorization` header. The token is obtained through the authentication handler (typically OAuth2) which calls `/v1/create_login` to create the user and return a JWT.

For admin-only endpoints, the user must have `is_admin: true` in their user record.

## Base URL

The data layer API runs on port 5000 by default. In development, this is typically `http://localhost:5000`.

## Users

### GET /v1/users

Retrieve a list of users. Can pass `username` query parameter to filter by username.

**Authentication:** Required

**Query Parameters:**
- `username` (optional): Filter by username

**Response:**
```json
[
  {
    "id": "72ca26bb-15e9-4acd-a56c-f1b44fb9519d",
    "name": "joe",
    "is_admin": true,
    "email": "joe@example.com",
    "join_date": "2024-02-14T06:26:55.12794Z"
  }
]
```

### GET /v1/users/{user_id}

Retrieve a specific user by ID.

**Authentication:** Required

**Response:**
```json
{
  "id": "72ca26bb-15e9-4acd-a56c-f1b44fb9519d",
  "name": "joe",
  "is_admin": true,
  "email": "joe@example.com",
  "join_date": "2024-02-14T06:26:55.12794Z"
}
```

### POST /v1/users

Create a new user.

**Authentication:** Admin only

**Request Body:**
```json
{
  "name": "joe",
  "password_hash": "hashed_password",
  "image": "https://example.com/avatar.png",
  "email": "joe@example.com",
  "is_admin": false
}
```

## Problems

### GET /v1/problems

Retrieve a list of problems. Public problems are visible to all authenticated users; admins can see all problems.

**Authentication:** Required

**Query Parameters:**
- `query` (optional): Search query for Elasticsearch (if enabled)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Reverse String",
    "identifier": "reverse-string",
    "prompt": "Given a string, return its reverse...",
    "difficulty": "EASY",
    "public": true,
    "upload_date": "2024-02-14T06:26:55.12794Z",
    "test_cases": [
      {
        "id": "uuid",
        "input": "hello",
        "expected_output": "olleh",
        "hidden": false
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "Strings"
      }
    ]
  }
]
```

### GET /v1/problems/{problem_id}

Retrieve a specific problem by ID.

**Authentication:** Required

**Query Parameters:**
- `type=private` (optional): Include private test cases (admin only)

**Response:**
```json
{
  "id": 1,
  "title": "Reverse String",
  "identifier": "reverse-string",
  "prompt": "Given a string, return its reverse...",
  "difficulty": "EASY",
  "public": true,
  "test_cases": [...],
  "categories": [...]
}
```

### POST /v1/problems

Create a new problem.

**Authentication:** Admin only

**Request Body:**
```json
{
  "title": "Reverse String",
  "identifier": "reverse-string",
  "prompt": "Given a string, return its reverse...",
  "source": "NextJudge",
  "difficulty": "EASY",
  "timeout": 5.0,
  "accept_timeout": 5.0,
  "execution_timeout": 5.0,
  "memory_limit": 256,
  "user_id": "uuid",
  "test_cases": [
    {
      "input": "hello",
      "expected_output": "olleh",
      "hidden": false
    }
  ],
  "category_ids": ["uuid1", "uuid2"],
  "public": true
}
```

### GET /v1/problem_description/{problem_id}/tests

Retrieve all test cases for a problem. Used by the judge service.

**Authentication:** Judge service or admin

**Response:**
```json
{
  "test_cases": [
    {
      "id": "uuid",
      "input": "hello",
      "expected_output": "olleh",
      "hidden": true
    }
  ]
}
```

## Submissions

### POST /v1/submissions

Create a new submission. This will enqueue the submission to RabbitMQ for processing by the judge service.

**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "uuid",
  "problem_id": 1,
  "language_id": "uuid",
  "source_code": "def solve():\n    return 'hello'"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "problem_id": 1,
  "language_id": "uuid",
  "status": "PENDING",
  "submit_time": "2024-03-02T02:39:19.564713178Z",
  "source_code": "def solve():\n    return 'hello'"
}
```

### GET /v1/submissions/{submission_id}

Retrieve a specific submission by ID.

**Authentication:** Required (must be submission owner or admin)

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "problem_id": 1,
  "language_id": "uuid",
  "status": "ACCEPTED",
  "time_elapsed": 0.123,
  "submit_time": "2024-03-02T02:39:19.564713178Z",
  "source_code": "def solve():\n    return 'hello'",
  "test_case_results": [
    {
      "id": "uuid",
      "test_case_id": "uuid",
      "stdout": "hello",
      "stderr": "",
      "passed": true
    }
  ]
}
```

### PATCH /v1/submissions/{submission_id}

Update a submission status. Typically called by the judge service after processing.

**Authentication:** Judge service or admin

**Request Body:**
```json
{
  "status": "ACCEPTED",
  "stdout": "output",
  "stderr": "errors",
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

### GET /v1/user_submissions/{user_id}

Retrieve all submissions for a specific user.

**Authentication:** Required (must be the user or admin)

**Response:**
```json
[
  {
    "id": "uuid",
    "problem_id": 1,
    "status": "ACCEPTED",
    "submit_time": "2024-03-02T02:39:19.564713178Z"
  }
]
```

## Custom Input Submissions

### POST /v1/input_submissions

Execute code with custom input (for testing/debugging). Does not run against test cases.

**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "uuid",
  "source_code": "print(input())",
  "language_id": "uuid",
  "stdin": "test input"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "finished": false
}
```

### GET /v1/input_submissions/{submission_id}

Get the result of a custom input submission.

**Authentication:** Required

**Response:**
```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "stdout": "test input",
  "stderr": "",
  "runtime": 0.045,
  "finished": true
}
```

## Languages

### GET /v1/languages

Retrieve all supported programming languages.

**Authentication:** Not required

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "python",
    "extension": "py",
    "version": "3.12"
  },
  {
    "id": "uuid",
    "name": "c++",
    "extension": "cpp",
    "version": "13.2.0"
  }
]
```

### POST /v1/languages

Create a new language configuration.

**Authentication:** Admin only

**Request Body:**
```json
{
  "name": "python",
  "extension": "py",
  "version": "3.12"
}
```

## Events (Contests)

### GET /v1/events

Retrieve all events (contests).

**Authentication:** Admin only

**Response:**
```json
[
  {
    "id": 1,
    "title": "Spring Contest 2024",
    "description": "Annual spring programming contest",
    "start_time": "2024-04-19T08:00:00Z",
    "end_time": "2024-04-19T11:00:00Z",
    "teams": false
  }
]
```

### GET /v1/public/events

Retrieve public events visible to authenticated users.

**Authentication:** Required

### GET /v1/events/{event_id}

Retrieve a specific event with its problems and participants.

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "title": "Spring Contest 2024",
  "description": "Annual spring programming contest",
  "start_time": "2024-04-19T08:00:00Z",
  "end_time": "2024-04-19T11:00:00Z",
  "teams": false,
  "problems": [
    {
      "id": 1,
      "problem_id": 1,
      "hidden": false,
      "problem": {
        "id": 1,
        "title": "Reverse String",
        "difficulty": "EASY"
      }
    }
  ]
}
```

### POST /v1/events

Create a new event.

**Authentication:** Admin only

**Request Body:**
```json
{
  "title": "Spring Contest 2024",
  "description": "Annual spring programming contest",
  "start_time": "2024-04-19T08:00:00Z",
  "end_time": "2024-04-19T11:00:00Z",
  "teams": false,
  "user_id": "uuid"
}
```

### POST /v1/public/events/{event_id}/register

Register for a public event.

**Authentication:** Required

## Categories

### GET /v1/categories

Retrieve all problem categories.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sorting"
  },
  {
    "id": "uuid",
    "name": "Dynamic Programming"
  }
]
```

## Health Check

### GET /healthy

Check if the data layer service is running.

**Authentication:** Not required

**Response:** HTTP 200 OK

## Status Codes

The API uses standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Responses

Error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```
