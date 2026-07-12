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

## Gemini API (только на сервере)

**Ключ API не хранится в GitHub.** Настраивается только на хостинге:

1. Загрузите `server/api/*.php` на сервер в `public_html/api/` (скрипт `scripts/deploy-api.sh`)
2. Создайте на сервере файл `public_html/api/config.php` вручную (SSH / панель Beget):

```php
<?php
return ['gemini_api_key' => 'ваш_ключ'];
```

3. Не коммитьте и не пушьте `config.php`
