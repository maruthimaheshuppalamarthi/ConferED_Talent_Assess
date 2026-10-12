#!/usr/bin/env bash
# One-time install of Docker Engine + Compose on the production Ubuntu box.
# Run as ubuntu:  bash scripts/aws/bootstrap-ec2-docker.sh
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  docker --version
  echo "Docker already installed"
else
  curl -fsSL https://get.docker.com | sudo sh
fi

sudo usermod -aG docker ubuntu || true
sudo systemctl enable --now docker

if sudo docker compose version >/dev/null 2>&1; then
  sudo docker compose version
else
  echo "docker compose plugin missing; get.docker.com should have installed it." >&2
  exit 1
fi

echo "Log out of SSH and back in if 'docker' without sudo is still denied."
echo "deploy.sh uses sudo docker, so the current session is enough."
