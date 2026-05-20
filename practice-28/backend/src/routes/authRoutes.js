const express = require("express");
const { hashPassword, verifyPassword } = require("../password");
const { signToken } = require("../token");
const { authMiddleware } = require("../middleware/authMiddleware");

function createAuthRouter({ pool, jwtSecret }) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    try {
      const hash = hashPassword(password);
      const r = await pool.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
        [email, hash]
      );
      const user = r.rows[0];
      const token = signToken({ sub: String(user.id), role: user.role }, jwtSecret);
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (e) {
      if (e.code === "23505") {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      res.status(500).json({ error: "Server error" });
    }
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    const r = await pool.query("SELECT id, email, password_hash, role FROM users WHERE email = $1", [email]);
    if (r.rowCount === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = r.rows[0];
    if (!verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ sub: String(user.id), role: user.role }, jwtSecret);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });

  router.get("/me", authMiddleware(jwtSecret), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = { createAuthRouter };
