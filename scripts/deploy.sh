#!/bin/bash
# Полный деплой Geo Gallery на Beget
set -e
REMOTE="${DEPLOY_SSH:-infoprfo_gal@infoprfo.beget.tech}"
WEB_ROOT="${DEPLOY_WEB_ROOT:-/home/i/infoprfo/geogallery.online/public_html}"
API_DIR="${DEPLOY_API_DIR:-$WEB_ROOT/api}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Build frontend"
cd "$ROOT"
npm run build

echo "==> Deploy dist/ to $REMOTE:$WEB_ROOT"
RSYNC_SSH="ssh -o StrictHostKeyChecking=no"
if [ -n "$SSHPASS" ]; then
  RSYNC_SSH="sshpass -e ssh -o StrictHostKeyChecking=no"
fi

rsync -avz --no-times -e "$RSYNC_SSH" \
  --delete \
  --exclude 'api/' \
  "$ROOT/dist/" \
  "$REMOTE:$WEB_ROOT/" || RSYNC_EXIT=$?

if [ "${RSYNC_EXIT:-0}" = "23" ]; then
  echo "rsync: minor permission warnings (files transferred)"
elif [ "${RSYNC_EXIT:-0}" != "0" ]; then
  exit "${RSYNC_EXIT}"
fi

echo "==> Deploy API"
rsync -avz --no-times -e "$RSYNC_SSH" \
  --exclude 'config.php' \
  "$ROOT/server/api/" \
  "$REMOTE:$API_DIR/"

echo "==> Test API"
sleep 2
node "$ROOT/scripts/test-photo-upload.mjs" "http://geogallery.online/api/process-photo.php"

echo "==> Done: http://geogallery.online/test-upload"
