
param (
    [string]$nojudge = "Whether or not to spin up the judge"
)

if ($nojudge) {
    docker-compose -f docker-compose.dev.yml up --build nextjudge-bridge rabbitmq nextjudge-data-layer db
} else {
    cd $PSScriptRoot/src/judge
    docker build -f Dockerfile.newbase --target dev -t basejudge:dev .

    cd $PSScriptRoot
    docker-compose -f docker-compose.dev.yml up --build nextjudge-bridge rabbitmq nextjudge-data-layer db nextjudge-judge
}


