#!/bin/sh
# Dump the contents of the database
# Optionally, pass in a table name to only dump the given table
# Pass a `?` to list table names

DB_DOCKER_CONTAINER=nextjudge-db-dev-1

if [ -z "$1" ];
then
    docker exec $DB_DOCKER_CONTAINER pg_dump -U postgres nextjudge
else
    if [ "$1" = "?" ]
    then 
        docker exec $DB_DOCKER_CONTAINER psql -U postgres nextjudge -c "\dt"
    elif [ "$1" = "problem_descriptions" ]; then
        docker exec $DB_DOCKER_CONTAINER psql -U postgres nextjudge -c "SELECT id, title, upload_date FROM $1"
    else
        docker exec $DB_DOCKER_CONTAINER psql -U postgres nextjudge -c "SELECT * FROM $1"
    fi
fi