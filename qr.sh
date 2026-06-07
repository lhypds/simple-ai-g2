#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

evenhub qr --url "http://$(ipconfig getifaddr en0):5173"
