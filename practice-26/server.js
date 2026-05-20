import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const authors = [
  { id: "1", name: "Лев Толстой" },
  { id: "2", name: "Фёдор Достоевский" },
];

const books = [
  { id: "1", title: "Война и мир", authorId: "1" },
  { id: "2", title: "Анна Каренина", authorId: "1" },
  { id: "3", title: "Преступление и наказание", authorId: "2" },
];

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    authorId: ID!
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(title: String!, authorId: ID!): Book!
  }
`;

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find((b) => b.id === id) ?? null,
    authors: () => authors,
  },
  Mutation: {
    createAuthor: (_, { name }) => {
      const id = String(authors.length + 1);
      const author = { id, name };
      authors.push(author);
      return author;
    },
    createBook: (_, { title, authorId }) => {
      if (!authors.some((a) => a.id === authorId)) {
        throw new Error("Author not found");
      }
      const id = String(books.length + 1);
      const book = { id, title, authorId };
      books.push(book);
      return book;
    },
  },
  Book: {
    author: (parent) => authors.find((a) => a.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter((b) => b.authorId === parent.id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const port = Number(process.env.PORT) || 4000;

const { url } = await startStandaloneServer(server, { listen: { port } });
console.log(`GraphQL: ${url}`);
