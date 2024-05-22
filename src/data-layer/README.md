# Data Layer

## API Specification

### Users

#### GET /v1/users

Can pass in the query parameter `username` to only get the user with that username.

Response body:

```json
[
    {
        "id": "1",
        "name": "joe",
        "is_admin": true,
        "email": "joebiden@usa.gov",
        "join_date": "2024-02-14T06:26:55.12794Z"
    },
]
```

#### POST /v1/users

Request Body:

```json
{
    "name": "joe",
    "password_hash": "asdfjoisdafjasdk",
    "image": "linktoimage.com/joe.png",
    "email": "joebiden@usa.gov",
    "is_admin": true,
}
```

Response Body:

```json
{
    "id": "1",
    "image": "linktoimage.com/joe.png",
    "name": "joe",
    "is_admin": true,
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

#### GET /v1/users/{user_id}

Response Body:

```json
{
    "id": "1",
    "image": "linktoimage.com/joe.png",
    "name": "joe",
    "is_admin": true,
    "email": "joebiden@usa.gov",
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

#### DELETE /v1/users/{user_id}

There are no post or response bodies for this endpoint.

#### PUT /v1/users/{user_id}

Request Body:

```json
{
    "name": "joe",
    "password_hash": "asdfjoisdafjasdk",
    "image": "linktoimage.com/joe.png",
    "email": "joebiden@usa.gov",
    "is_admin": true,
}
```

Response Body:

```json
{
    "id": "1",
    "name": "joe",
    "email": "joebiden@usa.gov",
    "is_admin": true,
    "join_date": "2024-02-14T06:26:55.12794Z"
}
```

### Problems

#### GET /v1/categories

Response Body:

```json
[
    {
        "id": 1,
        "name": "Sorting"
    },
]
```

#### GET /v1/problems?query={query}

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
        "categories": [
            {
                "id": 1,
                "name": "Sorting"
            },
        ]
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
    "category_ids": [1, 3, 5]
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
    "categories": [
        {
            "id": 1,
            "name": "Sorting"
        },
    ]
}
```

#### GET /v1/problems/{problem_id}

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
    "categories": [
        {
            "id": 1,
            "name": "Sorting"
        },
    ]
}
```

#### DELETE /v1/problems/{problem_id}

There are no post or response bodies for this endpoint.

### Submissions

#### POST /v1/submissions

Request Body:

```json
{
    "user_id": 1,
    "problem_id": 1,
    "language_id": 1,
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
    "language_id": 1,
    "status": "PENDING",
    "submit_time": "2024-03-02T02:39:19.564713178Z",
    "source_code": "int main() { return 0 }"
}
```

#### PATCH /v1/submissions/{submission_id}

Request Body

```json
{
    "status": "WRONG_ANSWER",
    "failed_test_case_id": 1
}
```

#### GET /v1/submissions/{submission_id}

Response Body:

```json
{
    "id": 11,
    "user_id": 1,
    "problem_id": 1,
    "time_elapsed": 0,
    "language_id": 1,
    "status": "WRONG_ANSWER",
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

#### DELETE /v1/languages/{language_id}

There are no post or response bodies for this endpoint.

### Competitions

#### GET /v1/competitions

Response Body:

```json
[
    {
        "id": 1,
        "start_time": "2024-04-19T08:00:00Z",
        "end_time": "2024-04-19T11:00:00Z",
        "description": "this is a big competition",
        "title": "big competition",
        "user_id": 1,
    },
]
```

#### POST /v1/competitions

Request Body:

```json
{
    "title": "jordans new competition",
    "description": "woah dude",
    "start_time": "2024-05-19T20:30:00Z",
    "end_time": "2024-05-20T20:30:00Z",
    "user_id": 1,
    "problem_ids": [1, 2]
}
```

Response Body:

```json
{
    "id": 2,
    "start_time": "2024-05-19T20:30:00Z",
    "end_time": "2024-05-20T20:30:00Z",
    "description": "woah dude",
    "title": "jordans new comp",
    "user_id": 1,
    "participants": null, // will always be null on POST
    "problems": [
        {
            "id": 1,
            "prompt": "Given a string, print the reverse",
            "title": "Invert a String",
            "timeout": 10,
            "user_id": 1,
            "upload_date": "2024-03-03T10:00:00Z",
            "test_cases": [
                {
                    "id": 1,
                    "problem_id": 1,
                    "input": "abc",
                    "expected_output": "cba"
                },
                {
                    "id": 2,
                    "problem_id": 1,
                    "input": "123",
                    "expected_output": "321"
                }
            ]
        },
        {
            "id": 2,
            "prompt": "Given two numbers, print the sum",
            "title": "Add two numbers",
            "timeout": 5,
            "user_id": 2,
            "upload_date": "2024-03-04T10:00:00Z",
            "test_cases": [
                {
                    "id": 3,
                    "problem_id": 2,
                    "input": "2 1",
                    "expected_output": "3"
                },
                {
                    "id": 4,
                    "problem_id": 2,
                    "input": "10 10",
                    "expected_output": "20"
                }
            ]
        }
    ]
}
```

#### GET /v1/competitions/{competition_id}

Response Body:

```json
{
    "id": 1,
    "start_time": "2024-04-19T08:00:00Z",
    "end_time": "2024-04-19T11:00:00Z",
    "description": "this is a big competition",
    "title": "big competition",
    "user_id": 1,
    "participants": [
        {
            "id": 1,
            "name": "JohnEldenRing",
            "is_admin": true,
            "join_date": "2024-01-01T10:00:00Z"
        },
        {
            "id": 2,
            "name": "JohnDarksouls",
            "is_admin": false,
            "join_date": "2024-02-02T10:00:00Z"
        },
        {
            "id": 3,
            "name": "jordan",
            "is_admin": false,
            "join_date": "2024-05-16T20:35:05.556626Z"
        }
    ],
    "problems": [
        {
            "id": 1,
            "prompt": "Given a string, print the reverse",
            "title": "Invert a String",
            "timeout": 10,
            "user_id": 1,
            "upload_date": "2024-03-03T10:00:00Z"
        },
        {
            "id": 2,
            "prompt": "Given two numbers, print the sum",
            "title": "Add two numbers",
            "timeout": 5,
            "user_id": 2,
            "upload_date": "2024-03-04T10:00:00Z"
        }
    ]
}
```

#### DELETE /v1/competitions/{competition_id}

There are no post or response bodies for this endpoint.

#### POST /v1/competitions/{competition_id}/participants

Request Body:

```json
{
    "user_id": 3
}
```

## Running the Data Layer

### Docker

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

### Host

These commands builds the data layer, runs the docker container, initializes the database, and starts the data layer server.

```sh
go build
docker-compose up -d
make postgres
./main
```

### Testing

The `./tests/` directory contains API tests using Tavern. To run the tests, start the service in one terminal and then run `pipenv run pytest tests/ -p no:warnings` in another. Ensure an init script has been ran against the database beforehand.

### Debugging

To manually run an arbitrary query, run `docker exec -i data-layer-db-1 psql -U postgres nextjudge < query.sql` where `query.sql` contains your query.
