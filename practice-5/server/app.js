const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) console.log('Body:', req.body);
  });
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина (товары)',
      version: '1.0.0',
      description: 'CRUD для товаров',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
  },
  apis: ['./app.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

let products = [
  { id: nanoid(6), name: 'Наушники беспроводные', category: 'Аудио', description: 'С шумоподавлением', price: 5000, quantityInStock: 25, rating: 4.5 },
  { id: nanoid(6), name: 'Смартфон', category: 'Телефоны', description: 'OLED 6.1"', price: 30000, quantityInStock: 15, rating: 4.8 },
  { id: nanoid(6), name: 'Ноутбук', category: 'Компьютеры', description: '15.6", 16 ГБ', price: 80000, quantityInStock: 8, rating: 4.6 },
  { id: nanoid(6), name: 'Клавиатура', category: 'Периферия', description: 'RGB, MX', price: 12000, quantityInStock: 30, rating: 4.7 },
  { id: nanoid(6), name: 'Монитор 27"', category: 'Мониторы', description: 'IPS 144 Гц', price: 25000, quantityInStock: 12, rating: 4.5 },
  { id: nanoid(6), name: 'Мышь', category: 'Периферия', description: '16000 DPI', price: 4500, quantityInStock: 40, rating: 4.4 },
  { id: nanoid(6), name: 'Планшет', category: 'Планшеты', description: '10.5", 64 ГБ', price: 22000, quantityInStock: 18, rating: 4.3 },
  { id: nanoid(6), name: 'Умные часы', category: 'Носимые', description: 'Пулы, GPS', price: 15000, quantityInStock: 22, rating: 4.6 },
  { id: nanoid(6), name: 'SSD 1 ТБ', category: 'Накопители', description: 'USB 3.2', price: 9000, quantityInStock: 35, rating: 4.8 },
  { id: nanoid(6), name: 'Веб-камера', category: 'Периферия', description: '1080p 60 fps', price: 5500, quantityInStock: 28, rating: 4.2 },
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required: [name, price]
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID (nanoid)
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория
 *         description:
 *           type: string
 *           description: Описание
 *         price:
 *           type: number
 *           description: Цена
 *         quantityInStock:
 *           type: integer
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           nullable: true
 *           description: Рейтинг (0–5)
 *       example:
 *         id: "abc123"
 *         name: "Наушники"
 *         category: "Аудио"
 *         price: 5000
 *         quantityInStock: 25
 *         rating: 4.5
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               quantityInStock: { type: integer }
 *               rating: { type: number, nullable: true }
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: Ошибка в теле запроса
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, quantityInStock, rating } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const newProduct = {
    id: nanoid(6),
    name: String(name).trim(),
    category: category != null ? String(category).trim() : '',
    description: description != null ? String(description).trim() : '',
    price: Number(price),
    quantityInStock: quantityInStock != null ? Math.max(0, Number(quantityInStock)) : 0,
    rating: rating != null ? Number(rating) : null,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Массив товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               quantityInStock: { type: integer }
 *               rating: { type: number, nullable: true }
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  if (req.body?.name === undefined && req.body?.category === undefined && req.body?.description === undefined &&
      req.body?.price === undefined && req.body?.quantityInStock === undefined && req.body?.rating === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  const { name, category, description, price, quantityInStock, rating } = req.body;
  if (name !== undefined) product.name = String(name).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Number(price);
  if (quantityInStock !== undefined) product.quantityInStock = Math.max(0, Number(quantityInStock));
  if (rating !== undefined) product.rating = rating == null ? null : Number(rating);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Товар удалён
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер на http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
  console.log(`Товаров: ${products.length}`);
});
