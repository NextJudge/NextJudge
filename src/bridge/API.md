# Bridge API


The bridge exposes the following HTTP endpoints

```
POST /login
GET /users
    Return list of all users in the database
POST /users
    Create a user



GET /languages
    Return list of all the languages supported by the bridge instance, with the associated file extensions.


POST /submission
    The endpoint to submit user code to be judged
GET /submission
    Endpoint to fetch information regarding a submission

GET /testcases
    Judge facing API to get information on testcases for a given problem


POST /judging_complete
    Judge facing API to inform that bridge that it has finished judging a submission

```