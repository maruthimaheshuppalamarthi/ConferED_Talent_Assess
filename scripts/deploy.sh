#!/usr/bin/env bash
# Production deploy on the EC2 box. GitHub Actions SSHs in and runs this after main is updated.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/ConferED_Talent_Assess}"
WEB_ROOT="${WEB_ROOT:-/var/www/confered}"
cd "$APP_DIR"

git fetch origin
git checkout main
git pull --ff-only origin main

cd "$APP_DIR/backend"
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt
alembic upgrade head
sudo systemctl restart confered-api

cd "$APP_DIR/frontend"
printf 'VITE_API_URL=https://confered-assess.duckdns.org\n' > .env.production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
npm ci
npm run build
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "${WEB_ROOT:?}/"*
sudo cp -a dist/. "$WEB_ROOT/"

sudo systemctl is-active --quiet confered-api
echo "Deployed $(git -C "$APP_DIR" rev-parse --short HEAD) from main"
