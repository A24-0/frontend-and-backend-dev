const { authMiddleware, requireRole } = require("../src/middleware/authMiddleware");
const { signToken } = require("../src/token");

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("middleware", () => {
  test("authMiddleware rejects missing token", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware("secret")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("authMiddleware accepts valid token", () => {
    const token = signToken({ sub: "5", role: "admin" }, "secret");
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    authMiddleware("secret")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 5, role: "admin" });
  });

  test("requireRole blocks wrong role", () => {
    const req = { user: { id: 1, role: "user" } };
    const res = mockRes();
    const next = jest.fn();
    requireRole("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
