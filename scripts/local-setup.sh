#!/bin/bash
# Первичная настройка Geo Gallery на локальном компьютере
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "==> Node $(node -v 2>/dev/null || echo 'not found')"
echo "==> npm $(npm -v 2>/dev/null || echo 'not found')"

if ! command -v node >/dev/null 2>&1; then
  echo "Установите Node.js 20+: https://nodejs.org"
  exit 1
fi

echo "==> npm install"
npm install

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example (заполните SSHPASS при необходимости)"
fi

echo ""
echo "Готово. Дальше:"
echo "  npm run dev          — локальная разработка http://localhost:5173"
echo "  npm run pull:host    — скачать production с Beget в host-mirror/"
echo "  npm run deploy       — собрать и залить на geogallery.online"
