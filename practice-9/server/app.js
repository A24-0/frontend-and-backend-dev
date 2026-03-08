const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'access_secret';
const ACCESS_EXPIRES_IN = '15m';
const COOKIE_NAME = 'access_token';

// Безопасные настройки cookie (Практика 9)
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,        // недоступна из JavaScript (защита от XSS)
  secure: isProduction,  // только HTTPS в production
  sameSite: 'lax',       // защита от CSRF (lax — запросы с того же сайта + переходы по ссылкам)
  maxAge: 15 * 60 * 1000, // 15 минут (как у JWT)
  path: '/',
};

// Кэш токенов: jti -> true (валидные токены; при logout удаляем из кэша)
const tokenCache = new Map();

// Очистка просроченных записей из кэша (по необходимости)
function cleanTokenCache() {
  // При проверке токена jwt.verify сам отклонит просроченные; кэш можно чистить по exp
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of tokenCache.entries()) {
    if (exp && exp < now) tokenCache.delete(jti);
  }
}
setInterval(cleanTokenCache, 60 * 1000);

let users = [];
let products = [];

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true })); // credentials для отправки cookie
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
      title: 'API Auth + Cookie + Cache (Практика 9)',
      version: '1.0.0',
      description: 'Безопасные cookie (HttpOnly, Secure, SameSite), кэш токена',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        cookieAuth: { type: 'apiKey', in: 'cookie', name: COOKIE_NAME },
      },
    },
  },
  apis: ['./app.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function findUserById(id) {
  return users.find((u) => u.id === id);
}

function findUserOr404(email, res) {
  const user = findUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  return user;
}

// Токен из cookie или из заголовка Authorization (Практика 9)
function getToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function authMiddleware(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header or cookie' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Проверка кэша: токен не отозван (logout)
    if (payload.jti && !tokenCache.has(payload.jti)) {
      return res.status(401).json({ error: 'Token revoked or expired' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// --- Register ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || last_name === undefined) {
    return res.status(400).json({
      error: 'email, password, first_name and last_name are required',
    });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (findUserByEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  const newUser = {
    id: nanoid(10),
    email: normalizedEmail,
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    password: await hashPassword(password),
  };
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// --- Login: выдаём JWT и записываем в безопасную cookie (Практика 9) ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = findUserOr404(normalizedEmail, res);
  if (!user) return;
  const isAuthenticated = await verifyPassword(password, user.password);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const jti = nanoid(10);
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN, jwtid: jti }
  );
  const decoded = jwt.decode(accessToken);
  if (decoded && decoded.exp) tokenCache.set(jti, decoded.exp);

  res.cookie(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  res.status(200).json({ accessToken });
});

// --- Logout: очищаем cookie и удаляем токен из кэша (Практика 9) ---
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  if (req.user.jti) tokenCache.delete(req.user.jti);
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ ok: true });
});

// --- Me ---
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// --- Products ---
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ error: 'title and price are required' });
  }
  const newProduct = {
    id: nanoid(10),
    title: String(title).trim(),
    category: category != null ? String(category).trim() : '',
    description: description != null ? String(description).trim() : '',
    price: Number(price),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  const { title, category, description, price } = req.body;
  if (
    title === undefined &&
    category === undefined &&
    description === undefined &&
    price === undefined
  ) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  if (title !== undefined) product.title = String(title).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Number(price);
  res.json(product);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const exists = products.some((p) => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter((p) => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
  console.log('Cookie: HttpOnly, SameSite=lax, Secure в production. Кэш токенов включён.');
});
