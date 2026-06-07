#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing npm dependencies"
npm install

echo "==> Checking .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created .env from .env.example — open it and set VITE_OPENAI_API_KEY"
else
  echo "    .env already exists, leaving it untouched"
fi

echo "==> Making helper scripts executable"
chmod +x start.sh qr.sh setup.sh 2>/dev/null || true

echo "==> Checking evenhub CLI (used by qr.sh)"
if command -v evenhub >/dev/null 2>&1; then
  echo "    evenhub found: $(command -v evenhub)"
else
  echo "    evenhub not found on PATH."
  echo "    Install it per the Even Realities docs: https://hub.evenrealities.com/docs/getting-started/overview"
fi

echo
echo "Setup complete. Next:"
echo "  1. Put your OpenAI key in .env (VITE_OPENAI_API_KEY)"
echo "  2. ./start.sh   # dev server on 0.0.0.0:5173"
echo "  3. ./qr.sh      # QR code to open the app on your glasses"
