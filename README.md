# Geo Gallery — Маркетплейс искусства

## Запуск локально

```bash
npm install
npm run dev
```

## Деплой сайта

```bash
npm run build
# загрузить dist/ на хостинг
```

## API обработки фото

PHP-скрипт `server/api/process-photo.php` сжимает изображения с сохранением пропорций (без обрезки) и добавляет деревянную рамку с паспарту.

```bash
scripts/deploy-api.sh
```

Файлы загружаются в `public_html/api/` на хостинге.
