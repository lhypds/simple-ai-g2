#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Restarts the sc-bridge backend managed by PM2 (ecosystem.config.cjs).
# Use this after a deploy to pick up new code / config.
#
# Usage:
#   ./restart.sh               # restart the sc-bridge process

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found on PATH. Install it with: npm install -g pm2" >&2
  exit 1
fi

pm2 restart ecosystem.config.cjs && echo "==> sc-bridge restarted."
