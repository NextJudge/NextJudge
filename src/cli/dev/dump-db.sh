#!/bin/sh
# Dump the contents of the database
# Optionally, pass in a table name to only dump the given table
# Pass a `?` to list table names

if [ -z "$1" ];
then
    docker exec nextjudge-db-1 pg_dump -U postgres nextjudge
else
    if [ "$1" = "?" ]
    then 
        docker exec nextjudge-db-1 psql -U postgres nextjudge -c "\dt"
    elif [ "$1" = "problems" ]; then
        docker exec nextjudge-db-1 psql -U postgres nextjudge -c "SELECT id, title, upload_date FROM $1"
    else
        docker exec nextjudge-db-1 psql -U postgres nextjudge -c "SELECT * FROM $1"
    fi
fi