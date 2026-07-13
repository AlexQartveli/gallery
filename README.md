# Geo Gallery — Маркетплейс искусства

## Локально на компьютере

```bash
git clone https://github.com/AlexQartveli/gallery.git
cd gallery
npm run setup
npm run dev
```

Сайт: http://localhost:5173  
Тест фото: http://localhost:5173/test-upload

## Скачать production с хостинга

На Beget лежит собранный сайт, не исходники. Скачать на комп:

```bash
cp .env.example .env
# при необходимости: SSHPASS=пароль_beget
npm run pull:host
```

Файлы попадут в `host-mirror/`. Для разработки используйте исходники из git.

SSH без пароля: добавьте свой публичный ключ в панели Beget → SSH.

## Деплой

```bash
npm run deploy
```

## Обработка фото

В браузере (canvas): сжатие в WebP, деревянная рамка, обрезка фона. Серверный API не используется.

Тест: **http://localhost:5173/test-upload** или **http://geogallery.online/test-upload**
