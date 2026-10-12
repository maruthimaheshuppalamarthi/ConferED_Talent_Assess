#!/usr/bin/env bash
# Production deploy on the EC2 box. GitHub Actions SSHs in and runs this.
# Resets to origin/main so leftover server edits cannot block the pull.
#
# API: if ECR_REPOSITORY + IMAGE_TAG + ECR_PASSWORD are set, pull the SHA-tagged
# image from ECR and run docker/docker-compose.prod.yml. Otherwise keep the
# existing venv + systemd confered-api path.
# Frontend: prefer ~/confered-web-dist from the Actions runner; otherwise npm build.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/ConferED_Talent_Assess}"
WEB_ROOT="${WEB_ROOT:-/var/www/confered}"
WEB_STAGING="${WEB_STAGING:-${HOME}/confered-web-dist}"
COMPOSE_FILE="${APP_DIR}/docker/docker-compose.prod.yml"
cd "$APP_DIR"

git fetch origin
git checkout -f main
git reset --hard origin/main
git clean -fd

deploy_api_docker() {
  local registry="${ECR_REPOSITORY%%/*}"
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. On the instance run: bash scripts/aws/bootstrap-ec2-docker.sh" >&2
    exit 1
  fi
  printf '%s' "${ECR_PASSWORD}" | sudo docker login --username AWS --password-stdin "${registry}"
  sudo env IMAGE_TAG="${IMAGE_TAG}" ECR_REPOSITORY="${ECR_REPOSITORY}" \
    docker compose -f "${COMPOSE_FILE}" pull
  sudo env IMAGE_TAG="${IMAGE_TAG}" ECR_REPOSITORY="${ECR_REPOSITORY}" \
    docker compose -f "${COMPOSE_FILE}" run --rm --no-deps api alembic upgrade head
  sudo systemctl stop confered-api 2>/dev/null || true
  if ! sudo env IMAGE_TAG="${IMAGE_TAG}" ECR_REPOSITORY="${ECR_REPOSITORY}" \
    docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans; then
    sudo systemctl start confered-api 2>/dev/null || true
    echo "Docker API failed to start; left systemd confered-api as fallback." >&2
    exit 1
  fi
  sudo systemctl disable confered-api 2>/dev/null || true
  echo "API container ${ECR_REPOSITORY}:${IMAGE_TAG}"
}

deploy_api_venv() {
  cd "$APP_DIR/backend"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -q -r requirements.txt
  alembic upgrade head
  sudo systemctl restart confered-api
  sudo systemctl is-active --quiet confered-api
  echo "API systemd confered-api (venv)"
}

deploy_frontend() {
  sudo mkdir -p "$WEB_ROOT"
  local staged=""
  if [[ -f "${WEB_STAGING}/index.html" ]]; then
    staged="${WEB_STAGING}"
  elif [[ -f "${WEB_STAGING}/frontend/dist/index.html" ]]; then
    staged="${WEB_STAGING}/frontend/dist"
  elif [[ -f "${WEB_STAGING}/dist/index.html" ]]; then
    staged="${WEB_STAGING}/dist"
  fi
  if [[ -n "${staged}" ]]; then
    sudo rm -rf "${WEB_ROOT:?}/"*
    sudo cp -a "${staged}/." "$WEB_ROOT/"
    echo "Frontend from ${staged}"
    return
  fi
  cd "$APP_DIR/frontend"
  printf 'VITE_API_URL=https://confered-assess.duckdns.org\n' > .env.production
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
  npm ci
  npm run build
  sudo rm -rf "${WEB_ROOT:?}/"*
  sudo cp -a dist/. "$WEB_ROOT/"
  echo "Frontend built on the instance"
}

if [[ -n "${ECR_REPOSITORY:-}" && -n "${IMAGE_TAG:-}" && -n "${ECR_PASSWORD:-}" ]]; then
  deploy_api_docker
else
  deploy_api_venv
fi

deploy_frontend

echo "Deployed $(git -C "$APP_DIR" rev-parse --short HEAD) from main"
