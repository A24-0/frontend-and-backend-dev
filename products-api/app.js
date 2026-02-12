const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
  { id: 1, name: 'Наушники', price: 5000 },
  { id: 2, name: 'Смартфон', price: 30000 },
  { id: 3, name: 'Ноутбук', price: 80000 }
];

app.get('/', (req, res) => {
  res.send('API для управления товарами. Доступные эндпоинты: /products');
});

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  
  res.json(product);
});

app.post('/products', (req, res) => {
  const { name, price } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ message: 'Название и стоимость обязательны' });
  }
  
  const newProduct = {
    id: Date.now(),
    name: name,
    price: parseFloat(price)
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  
  const { name, price } = req.body;
  
  if (name !== undefined) {
    product.name = name;
  }
  if (price !== undefined) {
    product.price = parseFloat(price);
  }
  
  res.json(product);
});

app.delete('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Товар не найден' });
  }
  
  const deletedProduct = products.splice(index, 1);
  res.json({ message: 'Товар удалён', product: deletedProduct[0] });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Текущее количество товаров: ${products.length}`);
});
