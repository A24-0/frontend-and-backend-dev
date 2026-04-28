require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'frontend_backend_dev',
  user: process.env.PGUSER || process.env.USER,
  password: process.env.PGPASSWORD || undefined,
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`);
}

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  if (!first_name || !last_name || typeof age !== 'number') {
    return res.status(400).json({ error: 'first_name, last_name, age are required' });
  }
  const ts = Date.now();
  const q = await pool.query(
    'INSERT INTO users(first_name,last_name,age,created_at,updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [first_name, last_name, age, ts, ts]
  );
  return res.status(201).json(q.rows[0]);
});

app.get('/api/users', async (_req, res) => {
  const q = await pool.query('SELECT * FROM users ORDER BY id');
  res.json(q.rows);
});

app.get('/api/users/:id', async (req, res) => {
  const q = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
  res.json(q.rows[0]);
});

app.patch('/api/users/:id', async (req, res) => {
  const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!existing.rowCount) return res.status(404).json({ error: 'User not found' });
  const user = existing.rows[0];
  const first_name = req.body.first_name ?? user.first_name;
  const last_name = req.body.last_name ?? user.last_name;
  const age = req.body.age ?? user.age;
  const updated = await pool.query(
    'UPDATE users SET first_name=$1,last_name=$2,age=$3,updated_at=$4 WHERE id=$5 RETURNING *',
    [first_name, last_name, age, Date.now(), req.params.id]
  );
  res.json(updated.rows[0]);
});

app.delete('/api/users/:id', async (req, res) => {
  const q = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
  if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
  res.json({ deleted: true, id: q.rows[0].id });
});

const port = Number(process.env.PORT || 3000);

init()
  .then(() => app.listen(port, () => console.log(`Server on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Failed to connect PostgreSQL:', error.message);
    process.exit(1);
  });
