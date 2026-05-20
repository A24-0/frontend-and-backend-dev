const { signToken, verifyToken } = require("../src/token");

describe("token", () => {
  test("sign and verify", () => {
    const token = signToken({ sub: "1", role: "user" }, "s");
    const payload = verifyToken(token, "s");
    expect(payload.sub).toBe("1");
    expect(payload.role).toBe("user");
  });
});
