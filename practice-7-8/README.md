# Практика 7–8 — Базовые методы аутентификации

Серверное приложение на Node.js: регистрация/вход (bcrypt), выдача JWT при входе, защищённый маршрут `/api/auth/me`, защита маршрутов товаров по id (GET/PUT/DELETE).

## Запуск

```bash
cd practice-7-8/server
npm install
npm start
```

- Сервер: http://localhost:3000  
- Swagger UI: http://localhost:3000/api-docs  

## Тесты по ТЗ

Проверка всех требований практик 7 и 8 (маршруты, поля сущностей, JWT, защита):

```bash
cd practice-7-8/server
npm test
```

Или при уже запущенном сервере: `node test-api.js`  

## Маршруты

| Маршрут | Метод | Описание |
|--------|--------|----------|
| `/api/auth/register` | POST | Регистрация пользователя |
| `/api/auth/login` | POST | Вход в систему (логин — email), возвращает **accessToken** (JWT) |
| `/api/auth/me` | GET | Текущий пользователь (защищён: заголовок `Authorization: Bearer <token>`) |
| `/api/products` | POST | Создать товар |
| `/api/products` | GET | Список товаров |
| `/api/products/:id` | GET | Товар по id **(защищён)** |
| `/api/products/:id` | PUT | Обновить товар **(защищён)** |
| `/api/products/:id` | DELETE | Удалить товар **(защищён)** |

## Сущности

**Пользователь:** `id`, `email`, `first_name`, `last_name`, `password` (хранится в виде хеша bcrypt). Логин — поле `email`.

**Товар:** `id`, `title`, `category`, `description`, `price`.

## Примеры запросов

### Регистрация
```json
POST /api/auth/register
{ "email": "ivan@example.com", "password": "qwerty123", "first_name": "Иван", "last_name": "Петров" }
```

### Вход (возвращает JWT)
```json
POST /api/auth/login
{ "email": "ivan@example.com", "password": "qwerty123" }
→ { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
```

### Текущий пользователь (защищённый маршрут)
```
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Защищённые маршруты товаров
Для GET/PUT/DELETE `/api/products/:id` нужен заголовок: `Authorization: Bearer <accessToken>`.

### Создать товар
```json
POST /api/products
{ "title": "Ноутбук", "category": "Техника", "description": "15.6\"", "price": 50000 }
```
