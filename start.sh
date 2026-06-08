#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Run directly (non-interactive shell), this script can miss the system sbin
# dirs where ipconfig/route live — make sure they're reachable.
export PATH="$PATH:/usr/sbin:/sbin"

PORT=5173

# Best-effort LAN IP so the QR/dev server is reachable from the glasses and
# other devices on the network. Try the common interfaces, then fall back to
# whichever one backs the default route.
lan_ip() {
  local ip iface
  for iface in en0 en1 en2; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    [ -n "$ip" ] && { echo "$ip"; return; }
  done
  iface="$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')"
  [ -n "$iface" ] && ipconfig getifaddr "$iface" 2>/dev/null || true
}

IP="$(lan_ip)"
if [ -z "$IP" ]; then
  echo "!! Could not detect a LAN IP — other devices may not reach the dev server." >&2
  IP="localhost"
fi
URL="http://$IP:$PORT"

# QR code to open the app on the glasses — optional, never block the dev server.
if command -v evenhub >/dev/null 2>&1; then
  evenhub qr --url "$URL" || echo "!! evenhub qr failed — continuing without a QR code." >&2
else
  echo "==> evenhub not found on PATH; skipping QR code."
  echo "    App URL: $URL"
  echo "    Install per https://hub.evenrealities.com/docs/getting-started/overview"
fi

# Start the dev server, exposed on the local network (--host) so the simulator
# and real devices can reach it.
npm run dev -- --host 0.0.0.0 --port "$PORT" --strictPort --clearScreen false
