const express = require('express');
const { createClient } = require('redis');

const app = express();
app.use(express.json());
const redis = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
const port = Number(process.env.PORT || 3000);
const users = [];
const products = [];

function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    const key = keyBuilder(req);
    const hit = await redis.get(key);
    if (hit) return res.json({ source: 'cache', data: JSON.parse(hit) });
    req.cacheKey = key;
    req.cacheTTL = ttl;
    return next();
  };
}

async function saveCache(key, data, ttl) {
  await redis.set(key, JSON.stringify(data), { EX: ttl });
}

app.get('/api/users', cacheMiddleware(() => 'users:all', 60), async (req, res) => {
  await saveCache(req.cacheKey, users, req.cacheTTL);
  res.json({ source: 'server', data: users });
});

app.get('/api/users/:id', cacheMiddleware((req) => `users:${req.params.id}`, 60), async (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  await saveCache(req.cacheKey, user, req.cacheTTL);
  res.json({ source: 'server', data: user });
});

app.get('/api/products', cacheMiddleware(() => 'products:all', 600), async (req, res) => {
  await saveCache(req.cacheKey, products, req.cacheTTL);
  res.json({ source: 'server', data: products });
});

app.get('/api/products/:id', cacheMiddleware((req) => `products:${req.params.id}`, 600), async (req, res) => {
  const item = products.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  await saveCache(req.cacheKey, item, req.cacheTTL);
  res.json({ source: 'server', data: item });
});

app.post('/api/users', async (req, res) => {
  const user = { id: String(Date.now()), ...req.body };
  users.push(user);
  await redis.del(['users:all']);
  res.status(201).json(user);
});

app.patch('/api/users/:id', async (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  Object.assign(user, req.body);
  await redis.del(['users:all', `users:${req.params.id}`]);
  return res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'not found' });
  const [deleted] = users.splice(index, 1);
  await redis.del(['users:all', `users:${req.params.id}`]);
  return res.json({ deleted: true, id: deleted.id });
});

app.post('/api/products', async (req, res) => {
  const product = { id: String(Date.now()), ...req.body };
  products.push(product);
  await redis.del(['products:all']);
  res.status(201).json(product);
});

app.patch('/api/products/:id', async (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'not found' });
  Object.assign(product, req.body);
  await redis.del(['products:all', `products:${req.params.id}`]);
  return res.json(product);
});

app.delete('/api/products/:id', async (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'not found' });
  const [deleted] = products.splice(index, 1);
  await redis.del(['products:all', `products:${req.params.id}`]);
  return res.json({ deleted: true, id: deleted.id });
});

redis
  .connect()
  .then(() => {
    app.listen(port, () => console.log(`Server on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Failed to connect Redis:', error.message);
    process.exit(1);
  });
