const request = require("supertest");
const { createTestApp } = require("./helpers");

describe("posts API", () => {
  let app;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const user = await request(app)
      .post("/api/auth/register")
      .send({ email: "postuser@test.com", password: "pass123" });
    userToken = user.body.token;
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "admin123" });
    adminToken = admin.body.token;
  });

  test("create and list posts", async () => {
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "T", body: "B" });
    expect(created.status).toBe(201);

    const list = await request(app).get("/api/posts");
    expect(list.status).toBe(200);
    expect(list.body.posts.length).toBeGreaterThan(0);
  });

  test("admin stats", async () => {
    const stats = await request(app)
      .get("/api/posts/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.users).toBeGreaterThan(0);
  });

  test("user cannot access admin stats", async () => {
    const stats = await request(app)
      .get("/api/posts/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);
    expect(stats.status).toBe(403);
  });
});
