#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Start the eventhub simulator pointing at the dev server (run ./start.sh first).
evenhub-simulator http://localhost:5173/
