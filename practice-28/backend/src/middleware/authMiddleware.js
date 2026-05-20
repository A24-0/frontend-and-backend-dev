const { verifyToken } = require("../token");

function authMiddleware(jwtSecret) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const payload = verifyToken(token, jwtSecret);
      req.user = { id: Number(payload.sub), role: payload.role };
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
