const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

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

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// Не менее 10 товаров: название, категория, описание, цена, количество на складе (опц. рейтинг, фото)
let products = [
  { id: nanoid(6), name: 'Наушники беспроводные', category: 'Аудио', description: 'С шумоподавлением, до 30 ч работы', price: 5000, quantityInStock: 25, rating: 4.5 },
  { id: nanoid(6), name: 'Смартфон', category: 'Телефоны', description: 'Смартфон с OLED-экраном 6.1"', price: 30000, quantityInStock: 15, rating: 4.8 },
  { id: nanoid(6), name: 'Ноутбук', category: 'Компьютеры', description: 'Ноутбук 15.6", 16 ГБ RAM', price: 80000, quantityInStock: 8, rating: 4.6 },
  { id: nanoid(6), name: 'Клавиатура механическая', category: 'Периферия', description: 'RGB подсветка, переключатели MX', price: 12000, quantityInStock: 30, rating: 4.7 },
  { id: nanoid(6), name: 'Монитор 27"', category: 'Мониторы', description: 'IPS 144 Гц, 1 мс', price: 25000, quantityInStock: 12, rating: 4.5 },
  { id: nanoid(6), name: 'Мышь беспроводная', category: 'Периферия', description: 'Игровая, 16000 DPI', price: 4500, quantityInStock: 40, rating: 4.4 },
  { id: nanoid(6), name: 'Планшет', category: 'Планшеты', description: 'Экран 10.5", 64 ГБ', price: 22000, quantityInStock: 18, rating: 4.3 },
  { id: nanoid(6), name: 'Умные часы', category: 'Носимые устройства', description: 'Пулы, GPS, мониторинг сна', price: 15000, quantityInStock: 22, rating: 4.6 },
  { id: nanoid(6), name: 'Внешний SSD 1 ТБ', category: 'Накопители', description: 'USB 3.2, до 1050 МБ/с', price: 9000, quantityInStock: 35, rating: 4.8 },
  { id: nanoid(6), name: 'Веб-камера Full HD', category: 'Периферия', description: '1080p 60 fps, автофокус', price: 5500, quantityInStock: 28, rating: 4.2 },
];

// POST /api/products
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

// GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

// PATCH /api/products/:id
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

// DELETE /api/products/:id
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
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Товаров: ${products.length}`);
});
