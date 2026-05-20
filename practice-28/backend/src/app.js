const express = require("express");
const cors = require("cors");
const { createAuthRouter } = require("./routes/authRoutes");
const { createPostRouter } = require("./routes/postRoutes");

function createApp({ pool, jwtSecret, corsOrigin }) {
  const app = express();
  app.use(
    cors({
      origin: corsOrigin || true,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", createAuthRouter({ pool, jwtSecret }));
  app.use("/api/posts", createPostRouter({ pool, jwtSecret }));

  return app;
}

module.exports = { createApp };
