# Практика 10 — Refresh-токены

Сервер на Node.js с **механизмом обновления токенов** (access + refresh) и **отслеживанием сессий**.

## Что реализовано по ТЗ

- **Refresh-токен** — долгоживущий токен (7 дней), выдаётся вместе с access при входе. Используется для получения новой пары токенов без повторного ввода пароля.
- **Обновление** — `POST /api/auth/refresh`: принимает refresh-токен (в теле запроса или в cookie), проверяет его и выдаёт новый access-токен (и при необходимости обновляет cookie).
- **Отслеживание сессий** — каждая выдача refresh при логине создаёт сессию (sessionId, userId, createdAt). Список активных сессий пользователя: `GET /api/auth/sessions` (требуется access-токен).
- **Выход** — `POST /api/auth/logout` отзывает текущий access и удаляет сессию (refresh перестаёт быть валидным).

## Запуск

```bash
cd practice-10/server
npm install
npm start
```

- Сервер: http://localhost:3000  
- Swagger UI: http://localhost:3000/api-docs  

## Маршруты

| Маршрут | Метод | Описание |
|--------|--------|----------|
| `/api/auth/register` | POST | Регистрация |
| `/api/auth/login` | POST | Вход (access + refresh в ответе и в cookie) |
| `/api/auth/refresh` | POST | Обновление access по refresh-токену |
| `/api/auth/logout` | POST | Выход (отзыв токенов и сессии) |
| `/api/auth/sessions` | GET | Список сессий текущего пользователя |
| `/api/auth/me` | GET | Текущий пользователь |
| `/api/products` | GET, POST | Список / создание товара |
| `/api/products/:id` | GET, PUT, DELETE | Товар по id (защищённые) |

## Схема работы

1. **Вход** — `POST /api/auth/login` с email и паролем. В ответе: `accessToken`, `refreshToken`, `expiresIn`. В cookie устанавливаются `access_token` и `refresh_token` (HttpOnly, SameSite).
2. **Запросы к API** — с access-токеном в заголовке `Authorization: Bearer <token>` или в cookie.
3. **Истечение access** — клиент вызывает `POST /api/auth/refresh`, передаёт `refreshToken` в теле или полагается на cookie. Сервер возвращает новый `accessToken` (и обновляет cookie).
4. **Выход** — `POST /api/auth/logout` с access-токеном. Сервер удаляет сессию и очищает cookie; этот refresh больше не принимается.

## Переменные окружения

- `JWT_SECRET` — секрет для access JWT.
- `REFRESH_SECRET` — секрет для refresh JWT (лучше задать отдельно).
- `NODE_ENV=production` — включает флаг `Secure` у cookie.
