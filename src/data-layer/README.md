# Data Layer

## API Specification

### Users

#### /v1/users

##### Get

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

##### Post

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

#### /v1/users/{user_id}

##### Get

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

##### Delete

There are no post or response bodies for this endpoint.

##### Put

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

#### /v1/problems

##### Get

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

##### Post

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

#### /v1/problems/:problem_id

##### Get

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

#### /v1/submissions

##### Post

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

#### /v1/submissions/:submission_id

##### Patch

Request Body

```json
{
    "status": "failed",
    "failed_test_case_id": 1
}
```

##### Get

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

#### /v1/languages

##### Post

Request Body:

```json
{
    "name": "Python",
    "extension": ".py",
    "version": "3.12"
}
```

##### Get

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