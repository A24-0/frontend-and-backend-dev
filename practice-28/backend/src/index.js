require("dotenv").config();
const { Pool } = require("pg");
const { createApp } = require("./app");
const { migrate } = require("./migrate");

const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const port = Number(process.env.PORT) || 4000;
const databaseUrl = process.env.DATABASE_URL;
const corsOrigin = process.env.CORS_ORIGIN;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function waitForDb() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Database not reachable");
}

async function main() {
  await waitForDb();
  await migrate(pool);
  const app = createApp({ pool, jwtSecret, corsOrigin });
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
