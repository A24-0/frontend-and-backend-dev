/**
 * Тесты API по ТЗ практик 7–8.
 * Запуск: сначала npm start (в другом терминале), затем node test-api.js
 * Или: node test-api.js (скрипт сам запустит сервер на время тестов)
 */

const BASE = 'http://localhost:3000';
let serverProcess = null;

function log(msg, ok) {
  const icon = ok === true ? '\x1b[32m✓' : ok === false ? '\x1b[31m✗' : '';
  console.log(`${icon} ${msg}\x1b[0m`);
}

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}
  return { status: res.status, data, text };
}

function assert(condition, msg) {
  if (!condition) {
    console.error(`  Ошибка: ${msg}`);
    return false;
  }
  return true;
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  let token = null;
  let productId = null;
  let registeredUser = null;

  // --- Практика 7: Регистрация ---
  try {
    const r1 = await request('POST', '/api/auth/register', {
      email: 'test-practice@example.com',
      password: 'secret123',
      first_name: 'Иван',
      last_name: 'Петров',
    });
    const ok =
      r1.status === 201 &&
      assert(r1.data && r1.data.id, 'есть id') &&
      assert(r1.data.email === 'test-practice@example.com', 'email') &&
      assert(r1.data.first_name === 'Иван', 'first_name') &&
      assert(r1.data.last_name === 'Петров', 'last_name') &&
      assert(r1.data.password === undefined, 'пароль не возвращается');
    if (ok) {
      registeredUser = r1.data;
      passed++;
      log('Практика 7: POST /api/auth/register — пользователь создан (id, email, first_name, last_name, без password)', true);
    } else {
      failed++;
      log('Практика 7: POST /api/auth/register', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: POST /api/auth/register — ' + e.message, false);
  }

  // Регистрация без полей — 400
  try {
    const r = await request('POST', '/api/auth/register', { email: 'a@b.com' });
    const ok = r.status === 400;
    if (ok) {
      passed++;
      log('Практика 7: register без password/first_name/last_name → 400', true);
    } else {
      failed++;
      log('Практика 7: register валидация', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: register валидация', false);
  }

  // --- Практика 7: Логин (Практика 8: с JWT) ---
  try {
    const r2 = await request('POST', '/api/auth/login', {
      email: 'test-practice@example.com',
      password: 'secret123',
    });
    const ok = r2.status === 200 && r2.data && typeof r2.data.accessToken === 'string';
    if (ok) {
      token = r2.data.accessToken;
      passed++;
      log('Практика 7–8: POST /api/auth/login — возвращает accessToken (JWT)', true);
    } else {
      failed++;
      log('Практика 7–8: POST /api/auth/login', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7–8: POST /api/auth/login — ' + e.message, false);
  }

  // Логин с неверным паролем — 401
  try {
    const r = await request('POST', '/api/auth/login', {
      email: 'test-practice@example.com',
      password: 'wrong',
    });
    const ok = r.status === 401;
    if (ok) {
      passed++;
      log('Практика 7: login с неверным паролем → 401', true);
    } else {
      failed++;
      log('Практика 7: login 401', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: login 401', false);
  }

  // --- Практика 8: GET /api/auth/me ---
  try {
    const r = await request('GET', '/api/auth/me', null, token);
    const ok =
      r.status === 200 &&
      r.data &&
      r.data.id === registeredUser.id &&
      r.data.email === registeredUser.email &&
      r.data.password === undefined;
    if (ok) {
      passed++;
      log('Практика 8: GET /api/auth/me с токеном — объект пользователя без password', true);
    } else {
      failed++;
      log('Практика 8: GET /api/auth/me', false);
    }
  } catch (e) {
    failed++;
    log('Практика 8: GET /api/auth/me — ' + e.message, false);
  }

  // /api/auth/me без токена — 401
  try {
    const r = await request('GET', '/api/auth/me');
    const ok = r.status === 401;
    if (ok) {
      passed++;
      log('Практика 8: GET /api/auth/me без токена → 401', true);
    } else {
      failed++;
      log('Практика 8: /api/auth/me без токена', false);
    }
  } catch (e) {
    failed++;
    log('Практика 8: /api/auth/me без токена', false);
  }

  // --- Практика 7: Товары — создание ---
  try {
    const r = await request('POST', '/api/products', {
      title: 'Ноутбук',
      category: 'Техника',
      description: '15.6"',
      price: 50000,
    });
    const ok =
      r.status === 201 &&
      r.data &&
      r.data.id &&
      r.data.title === 'Ноутбук' &&
      r.data.category === 'Техника' &&
      r.data.description === '15.6"' &&
      r.data.price === 50000;
    if (ok) {
      productId = r.data.id;
      passed++;
      log('Практика 7: POST /api/products — товар (id, title, category, description, price)', true);
    } else {
      failed++;
      log('Практика 7: POST /api/products', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: POST /api/products — ' + e.message, false);
  }

  // --- Практика 7: GET список товаров ---
  try {
    const r = await request('GET', '/api/products');
    const ok = r.status === 200 && Array.isArray(r.data) && r.data.some((p) => p.id === productId);
    if (ok) {
      passed++;
      log('Практика 7: GET /api/products — список товаров', true);
    } else {
      failed++;
      log('Практика 7: GET /api/products', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: GET /api/products', false);
  }

  // --- Практика 8: GET /api/products/:id защищён ---
  try {
    const rNoAuth = await request('GET', `/api/products/${productId}`);
    const rAuth = await request('GET', `/api/products/${productId}`, null, token);
    const ok = rNoAuth.status === 401 && rAuth.status === 200 && rAuth.data.id === productId;
    if (ok) {
      passed++;
      log('Практика 8: GET /api/products/:id — без токена 401, с токеном 200', true);
    } else {
      failed++;
      log('Практика 8: GET /api/products/:id защита', false);
    }
  } catch (e) {
    failed++;
    log('Практика 8: GET /api/products/:id — ' + e.message, false);
  }

  // --- Практика 8: PUT /api/products/:id защищён ---
  try {
    const rNoAuth = await request('PUT', `/api/products/${productId}`, { title: 'Планшет' });
    const rAuth = await request('PUT', `/api/products/${productId}`, { title: 'Планшет' }, token);
    const ok = rNoAuth.status === 401 && rAuth.status === 200 && rAuth.data.title === 'Планшет';
    if (ok) {
      passed++;
      log('Практика 8: PUT /api/products/:id — без токена 401, с токеном обновление', true);
    } else {
      failed++;
      log('Практика 8: PUT /api/products/:id защита', false);
    }
  } catch (e) {
    failed++;
    log('Практика 8: PUT /api/products/:id — ' + e.message, false);
  }

  // --- Практика 8: DELETE /api/products/:id защищён ---
  try {
    const rNoAuth = await request('DELETE', `/api/products/${productId}`);
    const ok = rNoAuth.status === 401;
    if (ok) {
      passed++;
      log('Практика 8: DELETE /api/products/:id без токена → 401', true);
    } else {
      failed++;
      log('Практика 8: DELETE без токена', false);
    }
  } catch (e) {
    failed++;
    log('Практика 8: DELETE без токена', false);
  }

  // DELETE с токеном — 204
  try {
    const r = await request('DELETE', `/api/products/${productId}`, null, token);
    const ok = r.status === 204;
    if (ok) {
      passed++;
      log('Практика 7: DELETE /api/products/:id с токеном → 204', true);
    } else {
      failed++;
      log('Практика 7: DELETE /api/products/:id', false);
    }
  } catch (e) {
    failed++;
    log('Практика 7: DELETE /api/products/:id — ' + e.message, false);
  }

  // GET по несуществующему id — 404
  try {
    const r = await request('GET', '/api/products/nonexistent', null, token);
    const ok = r.status === 404;
    if (ok) {
      passed++;
      log('GET /api/products/:id для несуществующего → 404', true);
    } else {
      failed++;
      log('GET products/:id 404', false);
    }
  } catch (e) {
    failed++;
    log('GET products/:id 404', false);
  }

  return { passed, failed };
}

function waitForServer(retries = 30) {
  return new Promise((resolve) => {
    const tryFetch = () => {
      fetch(`${BASE}/api/products`)
        .then((r) => {
          if (r.status === 200 || r.status === 404) resolve(true);
          else if (retries > 0) setTimeout(tryFetch, 200);
          else resolve(false);
        })
        .catch(() => {
          if (retries > 0) setTimeout(tryFetch, 200);
          else resolve(false);
        });
    };
    tryFetch();
  });
}

async function main() {
  const startServer = process.argv.includes('--start-server');
  if (startServer) {
    const { spawn } = require('child_process');
    const path = require('path');
    serverProcess = spawn('node', ['app.js'], {
      cwd: path.join(__dirname),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    serverProcess.stdout.on('data', (d) => process.stdout.write(d));
    serverProcess.stderr.on('data', (d) => process.stderr.write(d));
    console.log('Ожидание запуска сервера...');
    const ready = await waitForServer();
    if (!ready) {
      console.error('Сервер не запустился за 6 сек.');
      serverProcess.kill();
      process.exit(1);
    }
    console.log('Сервер запущен.\n');
  } else {
    const ready = await waitForServer();
    if (!ready) {
      console.error('Сервер не доступен на ' + BASE + '. Запустите: npm start');
      process.exit(1);
    }
  }

  console.log('--- Тесты по ТЗ практик 7–8 ---\n');
  const { passed, failed } = await runTests();

  if (serverProcess) {
    serverProcess.kill();
    console.log('\nСервер остановлен.');
  }

  console.log('\n--- Итог ---');
  console.log(`\x1b[32mПройдено: ${passed}\x1b[0m`);
  if (failed > 0) console.log(`\x1b[31mПровалено: ${failed}\x1b[0m`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
