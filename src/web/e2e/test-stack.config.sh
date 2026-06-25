# Ephemeral local stack for Playwright E2E. Not used in production.
# Sourced by scripts/run-e2e-tests.sh — keep values in sync with docker-compose.yml below.

E2E_WEB_HOST="127.0.0.1"
E2E_WEB_PORT="8080"
E2E_DATA_LAYER_PORT="5051"
E2E_JUDGE_IMAGE="nextjudge-judge:e2e"

E2E_AUTH_SECRET="e2e-nextauth-secret-not-for-production-use"
E2E_DB_PASSWORD="e2e-postgres-password"
E2E_WEB_BRIDGE_SECRET="e2e-auth-provider-password"
E2E_JUDGE_PASSWORD="e2e-judge-password"
E2E_JWT_SIGNING_SECRET="e2e-jwt-signing-secret-minimum-32-chars"
E2E_RABBITMQ_USER="e2e-rabbit"
E2E_RABBITMQ_PASSWORD="e2e-rabbit-password"

export E2E_WEB_HOST E2E_WEB_PORT E2E_DATA_LAYER_PORT E2E_JUDGE_IMAGE
export E2E_AUTH_SECRET E2E_DB_PASSWORD E2E_JUDGE_PASSWORD E2E_JWT_SIGNING_SECRET
export E2E_WEB_BRIDGE_SECRET
export E2E_RABBITMQ_USER E2E_RABBITMQ_PASSWORD
