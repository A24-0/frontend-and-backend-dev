# Практика 11 — RBAC и blacklist

Сервер с **ролевой моделью** (admin, user, moderator) и **блокировкой токенов** при утечке.

## Что реализовано по ТЗ

- **RBAC (роли)**  
  - Роли: `user`, `moderator`, `admin`.  
  - У каждого пользователя поле `role` (при регистрации по умолчанию `user`).  
  - Роль передаётся в JWT и проверяется на защищённых маршрутах.

- **Ограничения по ролям**  
  - **GET /api/users** — только `admin` (список пользователей без паролей).  
  - **PATCH /api/users/:id/role** — только `admin` (смена роли пользователя).  
  - **POST /api/admin/blacklist** — только `admin` (добавление токена в blacklist).  
  - **DELETE /api/products/:id** — только `admin` и `moderator` (удаление товара).

- **Blacklist (блокировка при утечке)**  
  - При выходе (`POST /api/auth/logout`) `jti` текущего access-токена добавляется в blacklist — токен больше не принимается.  
  - Админ может вручную заблокировать токен: **POST /api/admin/blacklist** с телом `{ "jti": "..." }` или `{ "token": "eyJ..." }`.  
  - При проверке авторизации токен из blacklist отклоняется с 401.

## Запуск

```bash
cd practice-11/server
npm install
npm start
```

- Сервер: http://localhost:3000  
- Swagger UI: http://localhost:3000/api-docs  

## Тестовый администратор

При первом запуске создаётся пользователь:

- **Email:** admin@example.com  
- **Пароль:** admin123  
- **Роль:** admin  

Им можно войти и выдать себе или другим роли через **PATCH /api/users/:id/role** (только admin).

## Маршруты

| Маршрут | Метод | Роль | Описание |
|--------|--------|------|----------|
| `/api/auth/register` | POST | — | Регистрация (роль по умолчанию `user`) |
| `/api/auth/login` | POST | — | Вход |
| `/api/auth/refresh` | POST | — | Обновление access по refresh |
| `/api/auth/logout` | POST | любой | Выход (токен в blacklist) |
| `/api/auth/sessions` | GET | любой | Сессии текущего пользователя |
| `/api/auth/me` | GET | любой | Текущий пользователь |
| `/api/users` | GET | **admin** | Список пользователей |
| `/api/users/:id/role` | PATCH | **admin** | Изменить роль |
| `/api/admin/blacklist` | POST | **admin** | Заблокировать токен (jti или token в теле) |
| `/api/products` | GET, POST | GET — без auth, POST — любой | Товары |
| `/api/products/:id` | GET, PUT | любой авторизованный | Товар по id |
| `/api/products/:id` | DELETE | **admin**, **moderator** | Удалить товар |

## Пример: блокировка токена при утечке

1. Админ получает список пользователей: **GET /api/users** (с access-токеном).  
2. Если стал известен скомпрометированный токен, админ вызывает:

   **POST /api/admin/blacklist**  
   Body: `{ "token": "eyJhbGciOiJIUzI1NiIs..." }`  
   или `{ "jti": "abc123xyz" }`  

3. После этого этот access-токен при любом запроре будет получать 401 (Token blacklisted).
