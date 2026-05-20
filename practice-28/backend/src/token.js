const jwt = require("jsonwebtoken");

function signToken(payload, secret, options = {}) {
  return jwt.sign(payload, secret, { expiresIn: options.expiresIn || "7d" });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
