const request = require("supertest");
const { createTestApp } = require("./helpers");

describe("auth API", () => {
  let app;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  test("register and login", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: "u1@test.com", password: "pass123" });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeDefined();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "u1@test.com", password: "pass123" });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("user");
  });

  test("admin login", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "admin123" });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("admin");
  });
});
