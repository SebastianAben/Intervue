#!/usr/bin/env bash
set -euo pipefail

branch="${DEPLOY_TARGET_BRANCH:-${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || true)}}"
workspace="${GITHUB_WORKSPACE:-$(pwd)}"
compose_file="deploy/home-server/docker-compose.server.yml"
env_example_file="deploy/home-server/.env.server.example"
image_repository="${BACKEND_IMAGE_REPOSITORY:-ghcr.io/sebastianaben/intervue-api}"

case "$branch" in
  dev)
    deploy_dir="/home/froztbitez/web-server/intervue/dev"
    compose_project="intervue-dev"
    backend_image="${image_repository}:dev"
    backend_port="4201"
    health_url="http://127.0.0.1:4201/api/health"
    ;;
  main)
    deploy_dir="/home/froztbitez/web-server/intervue/main"
    compose_project="intervue-main"
    backend_image="${image_repository}:main"
    backend_port="4200"
    health_url="http://127.0.0.1:4200/api/health"
    ;;
  *)
    echo "Unsupported deployment branch: $branch" >&2
    exit 1
    ;;
esac

mkdir -p "$deploy_dir/deploy/home-server"
cp "$workspace/$compose_file" "$deploy_dir/$compose_file"

if [[ -f "$workspace/$env_example_file" ]]; then
  cp "$workspace/$env_example_file" "$deploy_dir/$env_example_file"
fi

cd "$deploy_dir"

if [[ ! -f .env.server ]]; then
  if [[ -f "$env_example_file" ]]; then
    cp "$env_example_file" .env.server
    sed -i "s/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=${compose_project}/" .env.server
    sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${backend_image}|" .env.server
    sed -i "s/^BACKEND_HOST_PORT=.*/BACKEND_HOST_PORT=${backend_port}/" .env.server
  fi

  cat >&2 <<EOF
Missing $deploy_dir/.env.server.
Create it from deploy/home-server/.env.server.example and set environment-specific secrets.
Expected project: $compose_project
Expected backend image: $backend_image
Expected health URL: $health_url
EOF
  exit 1
fi

configured_project="$(grep -E '^COMPOSE_PROJECT_NAME=' .env.server | tail -1 | cut -d '=' -f 2- || true)"
if [[ "$configured_project" != "$compose_project" ]]; then
  cat >&2 <<EOF
Unexpected COMPOSE_PROJECT_NAME in $deploy_dir/.env.server.
Expected: $compose_project
Actual:   ${configured_project:-<empty>}
EOF
  exit 1
fi

configured_image="$(grep -E '^BACKEND_IMAGE=' .env.server | tail -1 | cut -d '=' -f 2- || true)"
if [[ "$configured_image" != "$backend_image" ]]; then
  cat >&2 <<EOF
Unexpected BACKEND_IMAGE in $deploy_dir/.env.server.
Expected: $backend_image
Actual:   ${configured_image:-<empty>}
EOF
  exit 1
fi

compose=(docker compose --env-file .env.server -p "$compose_project" -f "$compose_file")

log_step() {
  echo
  echo "==> $*"
}

show_compose_diagnostics() {
  echo
  echo "==> Compose status"
  "${compose[@]}" ps || true

  echo
  echo "==> Postgres logs"
  "${compose[@]}" logs --tail=100 postgres || true

  echo
  echo "==> Backend logs"
  "${compose[@]}" logs --tail=100 backend || true
}

verify_postgres_auth() {
  set +e
  "${compose[@]}" exec -T postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null'
  local auth_status=$?
  set -e

  if [[ "$auth_status" -ne 0 ]]; then
    cat >&2 <<EOF
PostgreSQL authentication failed before running migrations.

This usually means the existing Docker volume was initialized with a different
POSTGRES_PASSWORD than the one in $deploy_dir/.env.server. PostgreSQL only uses
POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB during first initialization;
changing them later does not update an existing database volume.

Fix one of these before redeploying:
- Keep existing data: set POSTGRES_PASSWORD and DATABASE_URL in .env.server back
  to the password used when the volume was first created.
- Start with a fresh database: run
  ${compose[*]} down
  docker volume rm ${compose_project}_postgres_data
  then deploy again.
EOF
    show_compose_diagnostics
    exit "$auth_status"
  fi
}

run_migration() {
  set +e
  "${compose[@]}" run --rm migrate
  local migrate_status=$?
  set -e

  if [[ "$migrate_status" -ne 0 ]]; then
    echo "Migration failed with exit code $migrate_status" >&2
    show_compose_diagnostics
    exit "$migrate_status"
  fi
}

log_step "Pull backend and migrate image"
"${compose[@]}" pull backend migrate

log_step "Start PostgreSQL"
"${compose[@]}" up -d postgres

log_step "Verify PostgreSQL credentials"
verify_postgres_auth

log_step "Run database migration"
run_migration

log_step "Start backend"
"${compose[@]}" up -d backend

log_step "Check backend health"
for attempt in {1..30}; do
  if curl --fail --silent --show-error "$health_url" >/dev/null; then
    echo "Deployment health check passed: $health_url"
    exit 0
  fi

  echo "Waiting for backend health check ($attempt/30): $health_url"
  sleep 2
done

echo "Deployment health check failed: $health_url" >&2
show_compose_diagnostics
exit 1
