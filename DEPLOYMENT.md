# Деплой MVP

Портал использует SQLite как БД (см. `architecture.md` — для продуктива это
меняется на управляемую СУБД Холдинга). SQLite — это файл на диске, поэтому
для живого стенда нужен хостинг с **постоянным диском** (не classic serverless
с эфемерной файловой системой, как обычный Vercel-деплой). Ниже — самый быстрый
путь на Railway; Render работает почти так же.

## Вариант A — Railway (рекомендуется, ~5 минут)

1. Зайдите на railway.app и войдите (можно через GitHub).
2. **New Project → Deploy from GitHub repo** → выберите `RoomiestThunder/eppb-portal`.
   Railway сам определит Next.js через Nixpacks и подхватит `railway.json` из
   репозитория (там уже прописан `startCommand`).
3. Откройте вкладку **Variables** сервиса и добавьте:
   - `DATABASE_URL` = `file:/data/prod.db`
4. Откройте вкладку **Settings → Volumes → Add Volume**:
   - Mount path: `/data`
   - (размер по умолчанию достаточен для демо)
5. Первый деплой: после того как сервис соберётся и упадёт в рестарт-луп
   (это ожидаемо — таблиц ещё нет), откройте **Settings → одноразовая команда**
   (или `railway run` локально, если поставите Railway CLI) и выполните один раз:
   ```
   npx prisma migrate deploy
   npx prisma db seed
   ```
6. Перезапустите сервис (Redeploy). Готово — Railway выдаст публичный URL вида
   `https://eppb-portal-production.up.railway.app`.

После первого раза `startCommand` (`npx prisma migrate deploy && npm run start`)
сам применяет только новые миграции при каждом деплое и **не переseed-ит** базу —
данные, введённые во время оценки жюри, не будут случайно сброшены.

## Вариант B — Render

1. New → Web Service → подключить репозиторий `eppb-portal`.
2. Build Command: `npm install && npm run build`
   Start Command: `npx prisma migrate deploy && npm run start`
3. Добавить Persistent Disk, mount path `/data`, и переменную окружения
   `DATABASE_URL=file:/data/prod.db`.
4. После первого деплоя выполнить `npx prisma db seed` один раз через Render Shell.

## Локальная проверка перед деплоем

```
npm install
npm run build
npm run start
```

Приложение должно подняться на `http://localhost:3000` в production-режиме —
именно это и происходит на хостинге.
