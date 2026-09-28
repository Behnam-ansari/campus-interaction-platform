import request from "supertest";
import { app } from "../app";
import { prepareTestDatabase } from "./test-utils";

beforeAll(async () => {
  await prepareTestDatabase();
});


describe("Health endpoints", () => {
  it("returns backend health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "campus-interaction-platform-backend"
    });
  });

  it("returns database health status", async () => {
    const response = await request(app).get("/db-health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "connected"
    });
  });
});