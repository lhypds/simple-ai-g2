#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Publishes this app to the Even Realities Hub.
#
# Note: the evenhub CLI has no "publish" command and there is no documented
# upload API — submission is a manual upload through the developer portal
# (https://hub.evenrealities.com/docs/reference/app-submission). This script
# does everything up to that point: it builds + packs the .ehpk, verifies the
# package_id is available and the manifest validates, then opens the portal so
# you can drag the .ehpk in.

APP_JSON="app.json"
DIST_DIR="dist"
PORTAL_URL="https://evenhub.evenrealities.com"

if ! command -v evenhub >/dev/null 2>&1; then
  echo "evenhub not found on PATH. Install it: npm i -g @evenrealities/evenhub-cli"
  exit 1
fi

# 1. Build + pack (reuses package.sh, which names the file <package_id>-<version>.ehpk).
echo "==> Building and packing"
./package.sh

PACKAGE_ID=$(node -p "require('./$APP_JSON').package_id" 2>/dev/null || echo "app")
VERSION=$(node -p "require('./$APP_JSON').version" 2>/dev/null || echo "0.0.0")
OUTPUT="${PACKAGE_ID}-${VERSION}.ehpk"

# 2. Validate manifest and confirm the package_id is still available (-c).
#    This requires being logged in; if not, skip with a hint (non-fatal).
echo "==> Validating manifest and checking package_id availability"
if ! evenhub pack "$APP_JSON" "$DIST_DIR" -o "$OUTPUT" -c; then
  echo "    Availability check skipped/failed (run 'evenhub login' to enable it)."
fi

# 3. Open the developer portal for the manual upload step.
echo
echo "==> Package ready: $OUTPUT"
echo "    Upload it at the developer portal (log in, then upload the .ehpk)."
if command -v open >/dev/null 2>&1; then
  open "$PORTAL_URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$PORTAL_URL"
else
  echo "    Portal: $PORTAL_URL"
fi
