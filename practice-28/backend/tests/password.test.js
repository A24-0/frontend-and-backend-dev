const { hashPassword, verifyPassword } = require("../src/password");

describe("password", () => {
  test("hash and verify", () => {
    const hash = hashPassword("secret");
    expect(verifyPassword("secret", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});
