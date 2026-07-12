# Geo Gallery — Маркетплейс искусства

## Возможности

- **7 категорий**: картины, скульптуры, фотография, графика, digital, керамика, текстиль
- **Профили авторов** с портфолио
- **Тарифы размещения** (от 299 ₽/мес) с оплатой
- **AI-анализ фото** через Gemini API при загрузке
- **3D-галереи** — отдельный зал для каждой категории
- **Покупка**: Geo Gallery выкупает у автора и доставляет

## Запуск

```bash
npm install
npm run dev
```

## Gemini API

1. Скопируйте `public/api/config.example.php` → `public/api/config.php`
2. Вставьте ключ Gemini API
3. На Beget: файл `public_html/api/config.php`

## Деплой

```bash
npm run build
# Загрузить dist/ и api/ на хостинг
```
