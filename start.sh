#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

evenhub qr --url "http://$(ipconfig getifaddr en0):5173"

# Start the dev server, exposed on the local network (--host) so the simulator
# and real devices can reach it.
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort --clearScreen false
