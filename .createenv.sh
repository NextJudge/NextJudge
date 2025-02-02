#!/bin/bash

cat <<EOF
DB_PASSWORD=$(openssl rand -base64 64 | tr -d '\n/+=')
JUDGE_PASSWORD=$(openssl rand -base64 64 | tr -d '\n/+=')
JWT_SIGNING_SECRET=$(openssl rand -base64 64 | tr -d '\n/+=')
AUTH_PROVIDER_PASSWORD=$(openssl rand -base64 64 | tr -d '\n/+=')
RABBITMQ_USER=$(openssl rand -base64 64 | tr -d '\n/+=')
RABBITMQ_PASSWORD=$(openssl rand -base64 64 | tr -d '\n/+=')
EOF
