# Практика 22 — Балансировка нагрузки

## Что реализовано
- Минимум 2 backend-сервера (`backend1`, `backend2`).
- Nginx как балансировщик с `max_fails` и `fail_timeout`.
- Альтернативный пример через HAProxy.
- Проверка:
  - `http://localhost:8080` (Nginx)
  - `http://localhost:8081` (HAProxy)
