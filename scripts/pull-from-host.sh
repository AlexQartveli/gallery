#!/bin/bash
# Скачать production-сборку с Beget на локальный компьютер
set -e

REMOTE="${DEPLOY_SSH:-infoprfo_gal@infoprfo.beget.tech}"
WEB_ROOT="${DEPLOY_WEB_ROOT:-/home/i/infoprfo/geogallery.online/public_html}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="${PULL_TARGET:-$ROOT/host-mirror}"

RSYNC_SSH="ssh -o StrictHostKeyChecking=no"
if [ -n "$SSHPASS" ]; then
  RSYNC_SSH="sshpass -e ssh -o StrictHostKeyChecking=no"
fi

mkdir -p "$TARGET"

echo "==> Pull $REMOTE:$WEB_ROOT -> $TARGET"
rsync -avz --no-times -e "$RSYNC_SSH" \
  "$REMOTE:$WEB_ROOT/" \
  "$TARGET/" || RSYNC_EXIT=$?

if [ "${RSYNC_EXIT:-0}" = "23" ]; then
  echo "rsync: minor permission warnings (files transferred)"
elif [ "${RSYNC_EXIT:-0}" != "0" ]; then
  exit "${RSYNC_EXIT}"
fi

echo "==> Done. Production mirror: $TARGET"
echo "    Preview: npx serve host-mirror  (or any static server)"
