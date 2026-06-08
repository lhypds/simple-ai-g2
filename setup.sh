#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing npm dependencies"
npm install

# Vite 8 bundles with Rolldown. Its packages (@rolldown/pluginutils and the
# platform-native binding) get silently skipped when a package-lock.json built
# on another OS is reused here — a known npm bug with optional/platform deps.
# That leaves Vite unable to start (ERR_MODULE_NOT_FOUND for @rolldown/*).
# Detect the incomplete install and recover with a clean reinstall.
if [ ! -f node_modules/@rolldown/pluginutils/dist/index.mjs ]; then
  echo "==> Rolldown install looks incomplete — clean reinstalling"
  rm -rf node_modules package-lock.json
  npm install
fi

echo "==> Checking .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created .env from .env.example — open it and set VITE_OPENAI_API_KEY"
else
  echo "    .env already exists, leaving it untouched"
fi

echo "==> Making helper scripts executable"
chmod +x start.sh setup.sh serve.sh 2>/dev/null || true

echo "==> Checking evenhub CLI (used by start.sh for the QR code)"
if command -v evenhub >/dev/null 2>&1; then
  echo "    evenhub found: $(command -v evenhub)"
else
  echo "    evenhub not found on PATH."
  echo "    Install it per the Even Realities docs: https://hub.evenrealities.com/docs/getting-started/overview"
fi

echo
echo "Setup complete. Next:"
echo "  1. Put your OpenAI key in .env (VITE_OPENAI_API_KEY)"
echo "  2. ./start.sh   # dev server on 0.0.0.0:5173 (+ QR for the glasses)"
