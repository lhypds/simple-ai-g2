#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Stops the sc-bridge backend started by ./start.sh (PM2 + ecosystem.config.cjs).
#
# Usage:
#   ./stop.sh                  # stop the sc-bridge process
#   ./stop.sh --delete         # stop AND remove it from the PM2 process list

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found on PATH — nothing to stop." >&2
  exit 0
fi

if [ "${1:-}" = "--delete" ]; then
  pm2 delete ecosystem.config.cjs && echo "==> sc-bridge stopped and removed from PM2."
else
  pm2 stop ecosystem.config.cjs && echo "==> sc-bridge stopped (still in PM2 list; ./start.sh to resume)."
fi
