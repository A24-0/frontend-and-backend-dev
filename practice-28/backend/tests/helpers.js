const { newDb } = require("pg-mem");
const { migrate } = require("../src/migrate");
const { createApp } = require("../src/app");

async function createTestApp() {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  await migrate(pool);
  const jwtSecret = "test-secret";
  const app = createApp({ pool, jwtSecret, corsOrigin: "*" });
  return { app, pool, jwtSecret };
}

module.exports = { createTestApp };
