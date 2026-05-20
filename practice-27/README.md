# Практика 27 — RabbitMQ

## Требования

- Docker: `docker compose up -d`
- Node 20+

## Запуск

Терминал 1 — API:

```bash
npm install
npm run producer
```

`POST http://127.0.0.1:3030/tasks` с телом, например:

```json
{ "type": "email", "payload": { "to": "a@b.c" } }
```

Чтобы сообщение ушло в DLQ после трёх неудачных попыток:

```json
{ "type": "x", "payload": { "mustFail": true } }
```

Терминалы 2 и 3 — воркеры:

```bash
WORKER_ID=1 npm run worker
```

```bash
WORKER_ID=2 npm run worker
```

Управление RabbitMQ: http://127.0.0.1:15672 (guest / guest). Очередь `tasks_dlq` — DLQ.
