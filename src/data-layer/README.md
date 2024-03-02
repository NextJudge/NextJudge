# Data Layer

## API Specification

### Users

#### GET /v1/users

Response body:

```json
[
    {
        "id": "1",
        "username": "joe",
        "password_hash": "abc123",
        "is_admin": true,
        "join_date": "2024-02-14T06:26:55.12794Z"
    },
]
```

#### POST /v1/users

Request Body:

```json
{
    "username": "joe",
    "password_hash": "abc123",
    "is_admin": true,
}
```

Response Body:

```json
{
    "id": "1",
    "username": "joe",
    "password_hash": "abc123",
    "is_admin": true,
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

#### GET /v1/users/{user_id}

Response Body:

```json
{
    "id": "1",
    "username": "joe",
    "password_hash": "abc123",
    "is_admin": true,
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

#### DELETE /v1/users/{user_id}

There are no post or response bodies for this endpoint.

#### PUT /v1/users/{user_id}

Request Body:

```json
{
    "id": "1",
    "username": "joe",
    "password_hash": "abc123",
    "is_admin": true,
}
```

Response Body:

```json
{
    "id": "1",
    "username": "joe",
    "password_hash": "abc123",
    "is_admin": true,
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

### Problems

#### GET /v1/problems

Response Body:

```json
[
    {
        "id": 1,
        "prompt": "this is a problem",
        "title": "otso's problem",
        "timeout": 10,
        "user_id": 1,
        "upload_date": "2024-02-14T06:26:55.12794Z",
        "test_cases": [
            {
                "id": 1,
                "input": "abc",
                "expected_output": "cba"
            },
        ],
    },
]
```

#### POST /v1/problems

Request Body:

```json
{
    "prompt": "this is a problem",
    "title": "otso's problem",
    "timeout": 10,
    "user_id": 1,
    "test_cases": [
        {
            "input": "abc",
            "expected_output": "cba"
        },
    ],
}
```

Response Body:

```json
{
    "id": 1,
    "prompt": "this is a problem",
    "title": "otso's problem",
    "timeout": 10,
    "user_id": 1,
    "upload_date": "2024-02-14T06:26:55.12794Z",
    "test_cases": [
        {
            "id": 1,
            "input": "abc",
            "expected_output": "cba"
        },
    ],
}
```

#### GET /v1/problems/:problem_id

Response Body:

```json
{
    "id": 1,
    "prompt": "this is a problem",
    "title": "otso's problem",
    "timeout": 10,
    "user_id": 1,
    "upload_date": "2024-02-14T06:26:55.12794Z",
    "test_cases": [
        {
            "id": 1,
            "input": "abc",
            "expected_output": "cba"
        },
    ],
}
```

### Submissions

#### POST /v1/submissions

Request Body:

```json
{
    "user_id": 1,
    "problem_id": 1,
    "language": "C++",
    "source_code": "int main() { return 0 }"
}
```

Response Body:

```json
{
    "id": 10,
    "user_id": 1,
    "problem_id": 1,
    "time_elapsed": 0,
    "language": "C++",
    "status": "pending",
    "submit_time": "2024-03-02T02:39:19.564713178Z",
    "source_code": "int main() { return 0 }"
}
```

#### PATCH /v1/submissions/:submission_id

Request Body

```json
{
    "status": "failed",
    "failed_test_case_id": 1
}
```

#### GET /v1/submissions/:submission_id

Response Body:

```json
{
    "id": 11,
    "user_id": 1,
    "problem_id": 1,
    "time_elapsed": 0,
    "language": "C++",
    "status": "failed",
    "failed_test_case_id": 2,
    "submit_time": "2024-03-02T02:45:09.603556Z",
    "source_code": "int main 5"
}
```

### Languages

#### POST /v1/languages

Request Body:

```json
{
    "name": "Python",
    "extension": ".py",
    "version": "3.12"
}
```

#### GET /v1/languages

Response Body:

```json
[
    {
        "name": "Python",
        "extension": ".py",
        "version": "3.12"
    },
]
```

## Running the Data Layer

## Docker

There is a `docker-compose-local.yml` file which will instantiate the Go-based CRUD application as well the underlying Postgres database in a Docker network. This is great for development and quickly getting everything necessary running locally.

```sh
docker-compose -f docker-compose-local.yml up -d
```

If you change the schema, you need to completely delete the containers by running:

```sh
docker-compose rm
# Also, delete the volumes
docker volume ls
docker volume rm <POSTGRES_VOLUME_ID>
```

## Host

These commands builds the data layer, runs the docker container, initializes the database, and starts the data layer server.

```sh
go build
docker-compose up -d
make postgres
./main
```
