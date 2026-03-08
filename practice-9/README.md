# Практика 9 — Cookie и кэширование

Сервер на Node.js с **безопасными cookie** (HttpOnly, Secure, SameSite) для JWT и **кэшем токенов** для отзыва при выходе.

## Что реализовано по ТЗ

- **Безопасные cookie**
  - **HttpOnly** — cookie недоступна из JavaScript (снижение риска XSS).
  - **Secure** — cookie отправляется только по HTTPS (в production при `NODE_ENV=production`).
  - **SameSite=lax** — защита от CSRF, cookie не уходит на запросы с других сайтов.
- **Кэш токена** — выданные JWT сохраняются в памяти по `jti`. При выходе (`POST /api/auth/logout`) токен удаляется из кэша; запросы с отозванным токеном получают 401.

## Запуск

```bash
cd practice-9/server
npm install
npm start
```

- Сервер: http://localhost:3000  
- Swagger UI: http://localhost:3000/api-docs  


## Маршруты

| Маршрут | Метод | Описание |
|--------|--------|----------|
| `/api/auth/register` | POST | Регистрация |
| `/api/auth/login` | POST | Вход (JWT в теле + cookie) |
| `/api/auth/logout` | POST | Выход (очистка cookie и кэша) |
| `/api/auth/me` | GET | Текущий пользователь |
| `/api/products` | GET, POST | Список / создание товара |
| `/api/products/:id` | GET, PUT, DELETE | Товар по id (защищённые) |

## Проверка cookie в браузере

1. Открыть DevTools → Application (Chrome) / Storage (Firefox).
2. Выполнить вход через `POST /api/auth/login`.
3. В разделе Cookies для `http://localhost:3000` должна появиться cookie `access_token` с флагами HttpOnly, SameSite (и Secure при HTTPS).

## Переменные окружения

- `JWT_SECRET` — секрет для подписи JWT (по умолчанию значение для разработки).
- `NODE_ENV=production` — включает флаг `Secure` у cookie (обязателен HTTPS).
