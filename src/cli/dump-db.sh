#!/bin/sh python3
# Dump the contents of the database

docker exec nextjudge-db-1 pg_dump -U postgres nextjudge