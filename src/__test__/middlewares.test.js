jest.mock("connect-mongo", () => ({
  create: jest.fn().mockReturnValue({
    close: jest.fn(), // Mock close method if it’s available
  }),
}));
jest.mock("mongoose", () => {
  const originalMongoose = jest.requireActual("mongoose");

  return {
    ...originalMongoose,
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn(),
    model: jest.fn().mockImplementation((name, schema) => {
      return originalMongoose.model(name, schema);
    }),
    Schema: class extends originalMongoose.Schema {}, // Extend the actual Schema to keep `pre` and other methods
  };
});

const express = require("express");
const request = require("supertest");
const { default: mongoose } = require("mongoose");

const app = require("../app");
app.use(express.json()); // Make sure to use JSON middleware

describe("Middleware Integration Tests", () => {
  let server;

  beforeEach(() => {
    server = app.listen(3001);
  });

  afterEach(() => {
    server.close();
  });

  test("should apply JSON middleware", async () => {
    app.post("/test-json", (req, res) => {
      res.send(req.body);
    });

    await request(app)
      .post("/test-json")
      .send({ message: "This is a test" })
      .expect(200, { message: "This is a test" });
  });

  test("should protect routes with rate limiting", async () => {
    const routeToTest = "/test-rate-limit";
    app.get(routeToTest, (req, res) =>
      res.status(200).json({ message: "Rate test" }),
    );

    const agent = request(app);
    for (let i = 0; i < 101; i++) {
      await agent.get(routeToTest);
    }

    await agent.get(routeToTest).expect(429); // Too many requests
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await new Promise((resolve) => setImmediate(resolve)); // This ensures that all pending async operations complete
  });
});
