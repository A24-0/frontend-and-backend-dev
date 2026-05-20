const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

function createPostRouter({ pool, jwtSecret }) {
  const router = express.Router();
  const auth = authMiddleware(jwtSecret);

  router.get("/", async (_req, res) => {
    const r = await pool.query(
      `SELECT p.id, p.user_id, p.title, p.body, p.created_at, u.email AS author_email
       FROM posts p JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );
    res.json({ posts: r.rows });
  });

  router.get("/admin/stats", auth, requireRole("admin"), async (_req, res) => {
    const users = await pool.query("SELECT COUNT(*)::int AS c FROM users");
    const posts = await pool.query("SELECT COUNT(*)::int AS c FROM posts");
    res.json({ users: users.rows[0].c, posts: posts.rows[0].c });
  });

  router.post("/", auth, async (req, res) => {
    const { title, body } = req.body || {};
    if (!title || !body) {
      res.status(400).json({ error: "title and body required" });
      return;
    }
    const r = await pool.query(
      "INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING id, title, body, created_at",
      [req.user.id, title, body]
    );
    res.status(201).json({ post: r.rows[0] });
  });

  router.delete("/:id", auth, async (req, res) => {
    const id = Number(req.params.id);
    const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [id]);
    if (post.rowCount === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const ownerId = post.rows[0].user_id;
    if (req.user.role !== "admin" && ownerId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    res.status(204).end();
  });

  return router;
}

module.exports = { createPostRouter };
