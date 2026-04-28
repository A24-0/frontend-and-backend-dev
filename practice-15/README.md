# Практика 15 — HTTPS + App Shell

## Что реализовано по ТЗ
- Архитектура App Shell: каркас `index.html` + динамический контент в `content/`.
- Страница `О нас` (`content/about.html`).
- Service Worker со стратегией:
  - статика: Cache First;
  - `content/*`: Network First + fallback.
- Заметки сохраняются в `localStorage`.

## HTTPS локально (как требует ТЗ)
```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
npx http-server --ssl --cert localhost.pem --key localhost-key.pem -p 3000
```
