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
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const COOKIE_ACCESS = 'access_token';
const COOKIE_REFRESH = 'refresh_token';

const ROLES = ['user', 'moderator', 'admin'];
const DEFAULT_ROLE = 'user';

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
  path: '/',
};
const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const tokenCache = new Map();
const sessions = new Map();
// Blacklist: jti отозванных/утекших токенов — блокировка при утечке (Практика 11)
const tokenBlacklist = new Set();

function cleanTokenCache() {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of tokenCache.entries()) {
    if (exp && exp < now) tokenCache.delete(jti);
  }
}
function cleanSessions() {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > maxAge) sessions.delete(id);
  }
}
setInterval(cleanTokenCache, 60 * 1000);
setInterval(cleanSessions, 60 * 1000);

let users = [];
let products = [];

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

function getAccessToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE_ACCESS];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function authMiddleware(req, res, next) {
  const token = getAccessToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header or cookie' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.jti && tokenBlacklist.has(payload.jti)) {
      return res.status(401).json({ error: 'Token blacklisted (revoked or leaked)' });
    }
    if (payload.jti && !tokenCache.has(payload.jti)) {
      return res.status(401).json({ error: 'Token revoked or expired' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
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
      title: 'API RBAC + Blacklist (Практика 11)',
      version: '1.0.0',
      description: 'Роли admin, user, moderator; блокировка токенов при утечке',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  },
  apis: ['./app.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Register (роль по умолчанию user) ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;
  if (!email || !password || !first_name || last_name === undefined) {
    return res.status(400).json({
      error: 'email, password, first_name and last_name are required',
    });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (findUserByEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  const roleValue = role && ROLES.includes(role) ? role : DEFAULT_ROLE;
  const newUser = {
    id: nanoid(10),
    email: normalizedEmail,
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    password: await hashPassword(password),
    role: roleValue,
  };
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// --- Login (в payload JWT добавляем role) ---
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

  const refreshJti = nanoid(10);
  const refreshToken = jwt.sign(
    { sub: user.id, sessionId: refreshJti },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN, jwtid: refreshJti }
  );
  sessions.set(refreshJti, { userId: user.id, createdAt: Date.now() });

  const accessJti = nanoid(10);
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, sessionId: refreshJti },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN, jwtid: accessJti }
  );
  const decodedAccess = jwt.decode(accessToken);
  if (decodedAccess && decodedAccess.exp) tokenCache.set(accessJti, decodedAccess.exp);

  res.cookie(COOKIE_ACCESS, accessToken, COOKIE_OPTIONS_ACCESS);
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS_REFRESH);
  res.status(200).json({
    accessToken,
    refreshToken,
    expiresIn: 15 * 60,
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const refreshToken =
    req.body?.refreshToken || (req.cookies && req.cookies[COOKIE_REFRESH]);
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken required (body or cookie)' });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const session = sessions.get(payload.jti || payload.sessionId);
    if (!session || session.userId !== payload.sub) {
      return res.status(401).json({ error: 'Invalid or revoked refresh token' });
    }
    const user = findUserById(payload.sub);
    if (!user) {
      sessions.delete(payload.jti || payload.sessionId);
      return res.status(401).json({ error: 'User not found' });
    }
    const refreshJti = payload.jti || payload.sessionId;
    const accessJti = nanoid(10);
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, sessionId: refreshJti },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN, jwtid: accessJti }
    );
    const decodedAccess = jwt.decode(accessToken);
    if (decodedAccess && decodedAccess.exp) tokenCache.set(accessJti, decodedAccess.exp);
    res.cookie(COOKIE_ACCESS, accessToken, COOKIE_OPTIONS_ACCESS);
    res.status(200).json({ accessToken, expiresIn: 15 * 60 });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// --- Logout: добавляем jti в blacklist (Практика 11) ---
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  if (req.user.jti) {
    tokenCache.delete(req.user.jti);
    tokenBlacklist.add(req.user.jti);
  }
  if (req.user.sessionId) sessions.delete(req.user.sessionId);
  res.clearCookie(COOKIE_ACCESS, { path: '/', httpOnly: true, sameSite: 'lax' });
  res.clearCookie(COOKIE_REFRESH, { path: '/', httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ ok: true });
});

app.get('/api/auth/sessions', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const list = [];
  for (const [id, s] of sessions.entries()) {
    if (s.userId === userId) {
      list.push({ sessionId: id, createdAt: new Date(s.createdAt).toISOString() });
    }
  }
  res.json({ sessions: list });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// --- RBAC: список пользователей — только admin ---
app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  const list = users.map((u) => {
    const { password: _, ...rest } = u;
    return rest;
  });
  res.json({ users: list });
});

// --- RBAC: изменить роль пользователя — только admin ---
app.patch('/api/users/:id/role', authMiddleware, requireRole('admin'), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { role } = req.body;
  if (!role || !ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be one of: ' + ROLES.join(', ') });
  }
  user.role = role;
  const { password: _, ...rest } = user;
  res.json(rest);
});

// --- Blacklist: заблокировать токен при утечке — только admin ---
app.post('/api/admin/blacklist', authMiddleware, requireRole('admin'), (req, res) => {
  const { jti, token } = req.body;
  let id = jti;
  if (!id && token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) id = decoded.jti;
    } catch (_) {}
  }
  if (!id) {
    return res.status(400).json({ error: 'Provide jti or token to blacklist' });
  }
  tokenBlacklist.add(id);
  tokenCache.delete(id);
  res.status(200).json({ ok: true, blacklisted: id });
});

// --- Products ---
app.post('/api/products', authMiddleware, (req, res) => {
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

// --- RBAC: удаление товара — только admin и moderator ---
app.delete('/api/products/:id', authMiddleware, requireRole('admin', 'moderator'), (req, res) => {
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

// Первый пользователь — admin для тестов (если база пустая)
async function ensureAdmin() {
  if (users.length > 0) return;
  const admin = {
    id: nanoid(10),
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    password: await hashPassword('admin123'),
    role: 'admin',
  };
  users.push(admin);
  console.log('Создан тестовый admin: admin@example.com / admin123');
}

ensureAdmin().then(() => {
  app.listen(port, () => {
    console.log(`Сервер: http://localhost:${port}`);
    console.log(`Swagger UI: http://localhost:${port}/api-docs`);
    console.log('RBAC: user, moderator, admin. Blacklist: POST /api/admin/blacklist');
  });
});
