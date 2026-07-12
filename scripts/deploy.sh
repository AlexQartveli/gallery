#!/bin/bash
# Деплой Geo Gallery на Beget (только фронтенд)
set -e
REMOTE="${DEPLOY_SSH:-infoprfo_gal@infoprfo.beget.tech}"
WEB_ROOT="${DEPLOY_WEB_ROOT:-/home/i/infoprfo/geogallery.online/public_html}"
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
  "$ROOT/dist/" \
  "$REMOTE:$WEB_ROOT/" || RSYNC_EXIT=$?

if [ "${RSYNC_EXIT:-0}" = "23" ]; then
  echo "rsync: minor permission warnings (files transferred)"
elif [ "${RSYNC_EXIT:-0}" != "0" ]; then
  exit "${RSYNC_EXIT}"
fi

echo "==> Remove old API folder from server"
if [ -n "$SSHPASS" ]; then
  sshpass -e ssh -o StrictHostKeyChecking=no "$REMOTE" "rm -rf $WEB_ROOT/api" 2>/dev/null || true
else
  ssh -o StrictHostKeyChecking=no "$REMOTE" "rm -rf $WEB_ROOT/api" 2>/dev/null || true
fi

echo "==> Done: http://geogallery.online"
