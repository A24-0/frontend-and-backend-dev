require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, required: true },
  created_at: { type: Number, required: true },
  updated_at: { type: Number, required: true },
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  if (!first_name || !last_name || typeof age !== 'number') {
    return res.status(400).json({ error: 'first_name, last_name, age are required' });
  }
  const ts = Date.now();
  const user = await User.create({ first_name, last_name, age, created_at: ts, updated_at: ts });
  return res.status(201).json(user);
});

app.get('/api/users', async (_req, res) => {
  res.json(await User.find().sort({ created_at: 1 }));
});

app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.patch('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.first_name = req.body.first_name ?? user.first_name;
  user.last_name = req.body.last_name ?? user.last_name;
  user.age = req.body.age ?? user.age;
  user.updated_at = Date.now();
  await user.save();
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ deleted: true, id: user.id });
});

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/frontend_backend_dev';

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => console.log(`Server on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Failed to connect MongoDB:', error.message);
    process.exit(1);
  });
