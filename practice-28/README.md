# Контрольная работа №5 — практики 25–28

Итоговый проект: мини-социальная сеть (вариант 2, без WebSocket и Redis).

## Описание

Регистрация и вход (JWT), роли `user` и `admin`, лента постов, создание и удаление постов, статистика для администратора.

## Стек технологий

- Frontend: React, Vite
- Backend: Node.js, Express
- База данных: PostgreSQL
- Авторизация: JWT, RBAC
- Контейнеризация: Docker, Docker Compose

## Структура репозитория

| Папка | Задание |
|-------|---------|
| `practice-25` | Vite, lazy loading, анализ бандла |
| `practice-26` | GraphQL, Apollo Server |
| `practice-27` | RabbitMQ, producer/worker, DLQ |
| `practice-28` | Итоговый fullstack-проект |

## Запуск проекта (practice-28)

### Требования

- Docker и Docker Compose

### Шаги

1. `cd practice-28`
2. `cp .env.example .env` (при необходимости измените `JWT_SECRET`)
3. `docker compose up --build`
4. Открыть http://localhost:3000

Учётная запись администратора: `admin@example.com` / `admin123`

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `JWT_SECRET` | Секрет для подписи JWT |
| `SEED_ADMIN_EMAIL` | Email администратора при первом запуске |
| `SEED_ADMIN_PASSWORD` | Пароль администратора |

В Docker для backend также задаются `DATABASE_URL`, `PORT`, `CORS_ORIGIN` в `docker-compose.yml`.

## Запуск тестов

```bash
cd practice-28/backend
npm install
npm run test:coverage
```

Покрытие кода — не менее 50% по отчёту Jest.

## Отдельные практики

### practice-25

```bash
cd practice-25 && npm install && npm run build
```

### practice-26

```bash
cd practice-26 && npm install && npm start
```

### practice-27

```bash
cd practice-27 && docker compose up -d
npm install && npm run producer
WORKER_ID=1 npm run worker
WORKER_ID=2 npm run worker
```
