#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Serves the sc-bridge backend (serve.mjs): runs the `sc` (simple-ai-chat) CLI
# behind HTTP/SSE so the glasses app can reach it. One sc process per session —
# see serve.mjs for the env vars it accepts.
#
# Usage:
#   ./serve.sh                 # http://localhost:8787
#   PORT=9000 ./serve.sh       # custom port

if ! command -v node >/dev/null 2>&1; then
  echo "node not found on PATH. Install Node.js first." >&2
  exit 1
fi

# The sc CLI ships as a dependency; install if it's missing.
if [ ! -x "node_modules/.bin/sc" ]; then
  echo "==> sc CLI not found — installing dependencies"
  npm install
fi

PORT="${PORT:-8787}"

# Where each session's sc stores its ~/.simple (cookie + .scratch localStorage):
# under Node's os.tmpdir() as sc-home-<random>/. Resolve it the same way the
# server does so the printed path matches (respects $TMPDIR).
SC_TMP="$(node -e 'process.stdout.write(require("os").tmpdir())')"
echo "==> Session storage: $SC_TMP/sc-home-*/.simple   (per session, removed on reap/shutdown)"

echo "==> sc-bridge on http://localhost:$PORT"
exec node serve.mjs
