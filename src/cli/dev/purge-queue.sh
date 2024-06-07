

#!/bin/sh
# Dump the contents of the database
# Optionally, pass in a table name to only dump the given table
# Pass a `?` to list table names

docker exec nextjudge-rabbitmq-1 rabbitmqctl purge_queue submission_queue






