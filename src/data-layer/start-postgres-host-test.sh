#!/bin/sh

## Start the postgres database
sudo -u postgres initdb -D /var/lib/postgres/data
sudo -u postgres POSTGRES_DB=nextjudge POSTGRES_USER=postgres POSTGRES_PASSWORD=example pg_ctl start -D /var/lib/postgres/data
sudo psql -U postgres nextjudge < nextjudge.sql
