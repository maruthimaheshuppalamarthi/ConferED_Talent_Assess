#!/usr/bin/env bash
# Install CloudWatch agent on the EC2 box and ship nginx access/error logs.
# Run on the instance: bash scripts/aws/bootstrap-cloudwatch.sh
set -euo pipefail

ARCH="$(dpkg --print-architecture)"
DEB="amazon-cloudwatch-agent.deb"
URL="https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/${ARCH}/latest/amazon-cloudwatch-agent.deb"

if ! command -v /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl >/dev/null 2>&1; then
  curl -fsSL -o "/tmp/${DEB}" "${URL}"
  sudo dpkg -i -E "/tmp/${DEB}"
  rm -f "/tmp/${DEB}"
fi

sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo cp /home/ubuntu/ConferED_Talent_Assess/scripts/aws/cloudwatch-agent.json \
  /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s

echo "CloudWatch agent is shipping /var/log/nginx to /confered/nginx"
echo "API container logs go to /confered/api after: sudo docker compose -f docker/docker-compose.prod.yml up -d"
