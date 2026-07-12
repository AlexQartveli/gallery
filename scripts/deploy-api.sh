#!/bin/bash
# Деплой API на Beget (ключ config.php только на сервере, не в git)
set -e
REMOTE="${DEPLOY_SSH:-infoprfo_gal@infoprfo.beget.tech}"
REMOTE_DIR="${DEPLOY_API_DIR:-/home/i/infoprfo/geogallery.online/public_html/api}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

rsync -avz \
  --exclude 'config.php' \
  "$SCRIPT_DIR/../server/api/" \
  "$REMOTE:$REMOTE_DIR/"

echo "API deployed. Ensure config.php exists only on server."
