#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )


if [[ "$*" == *"nojudge"* ]]
then
    echo "Not starting judge"
else
    # Build the basejudge
    cd $SCRIPT_DIR/src/judge
    docker build -f Dockerfile.newbase --target dev -t basejudge:dev .
fi

if [[ "$*" == *"web"* ]]
then
    cd $SCRIPT_DIR/src/web
    if [[ "$*" == *"webprod"* ]]
    then
        npm start &
    else
        npm run dev &
    fi
fi


PROFILE_STRING=""

if [[ "$*" == *"noelastic"* ]]
then
    echo "Not starting elastic"
else
    PROFILE_STRING="--profile elastic"
fi

if ! [[ "$*" == *"nojudge"* ]]
then
    PROFILE_STRING="$PROFILE_STRING --profile judge"
fi

cd $SCRIPT_DIR
# Start all services
if [[ "$*" == *"noelastic"* ]]
then
    ELASTIC_ENABLED="false" docker compose $PROFILE_STRING --env-file .env.dev -f docker-compose.dev.yml up --build
else
    ELASTIC_ENABLED="false" docker compose $PROFILE_STRING --env-file .env.dev -f docker-compose.dev.yml up --build
fi