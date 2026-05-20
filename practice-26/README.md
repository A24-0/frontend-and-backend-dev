# Практика 26 — GraphQL (Apollo Server)

Каталог книг и авторов (связь один-ко-многим).

## Схема

- Типы `Book`, `Author`
- `Query`: `books`, `book(id)`, `authors`
- `Mutation`: `createAuthor`, `createBook`

## Запуск

```bash
npm install
npm start
```

Apollo Sandbox: URL из консоли (по умолчанию `http://localhost:4000`).

### Примеры запросов

```graphql
query {
  authors {
    id
    name
    books {
      title
    }
  }
}
```

```graphql
query {
  book(id: "1") {
    title
    author {
      name
    }
  }
}
```

```graphql
mutation {
  createAuthor(name: "Новый автор") {
    id
    name
  }
}
```
