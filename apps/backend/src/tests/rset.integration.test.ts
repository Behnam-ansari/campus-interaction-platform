import request from "supertest";
import { app } from "../app";
import { prepareTestDatabase } from "./test-utils";

beforeEach(async () => {
  await prepareTestDatabase();
});

describe("REST integration: rooms and appointments", () => {
  it("creates and reads a room", async () => {
    const createRoomResponse = await request(app)
      .post("/rooms")
      .send({
        name: "Test Room",
        location: "Hochschule Mainz",
        capacity: 30,
        equipment: ["Beamer", "Whiteboard"]
      });

    expect(createRoomResponse.status).toBe(201);
    expect(createRoomResponse.body.name).toBe("Test Room");
    expect(createRoomResponse.body.status).toBe("available");

    const roomsResponse = await request(app).get("/rooms");

    expect(roomsResponse.status).toBe(200);
    expect(roomsResponse.body.length).toBe(1);
    expect(roomsResponse.body[0].name).toBe("Test Room");
  });

  it("returns 400 for invalid room data", async () => {
    const response = await request(app)
      .post("/rooms")
      .send({
        name: "",
        location: "Hochschule Mainz",
        capacity: 0,
        equipment: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("creates an appointment for an existing room", async () => {
    const roomResponse = await request(app)
      .post("/rooms")
      .send({
        name: "Appointment Room",
        location: "Hochschule Mainz",
        capacity: 20,
        equipment: ["Beamer"]
      });

    const roomId = roomResponse.body.id;

    const appointmentResponse = await request(app)
      .post("/appointments")
      .send({
        title: "REST Test Appointment",
        description: "Created during integration test",
        roomId,
        startTime: "2026-06-20T10:00:00.000Z",
        endTime: "2026-06-20T11:00:00.000Z",
        participants: ["test@example.com"]
      });

    expect(appointmentResponse.status).toBe(201);
    expect(appointmentResponse.body.title).toBe("REST Test Appointment");
    expect(appointmentResponse.body.roomId).toBe(roomId);

    const appointmentsResponse = await request(app).get("/appointments");

    expect(appointmentsResponse.status).toBe(200);
    expect(appointmentsResponse.body.length).toBe(1);
  });

  it("prevents overlapping appointments in the same room", async () => {
    const roomResponse = await request(app)
      .post("/rooms")
      .send({
        name: "Conflict Room",
        location: "Hochschule Mainz",
        capacity: 25,
        equipment: ["Whiteboard"]
      });

    const roomId = roomResponse.body.id;

    await request(app)
      .post("/appointments")
      .send({
        title: "First Appointment",
        description: "Existing appointment",
        roomId,
        startTime: "2026-06-21T10:00:00.000Z",
        endTime: "2026-06-21T11:00:00.000Z",
        participants: ["first@example.com"]
      });

    const conflictResponse = await request(app)
      .post("/appointments")
      .send({
        title: "Conflicting Appointment",
        description: "This appointment overlaps",
        roomId,
        startTime: "2026-06-21T10:30:00.000Z",
        endTime: "2026-06-21T11:30:00.000Z",
        participants: ["second@example.com"]
      });

    expect(conflictResponse.status).toBe(400);
    expect(conflictResponse.body.error).toBe(
      "The selected room is already booked in this time range."
    );
  });

  it("updates and deletes an appointment", async () => {
    const roomResponse = await request(app)
      .post("/rooms")
      .send({
        name: "Update Delete Room",
        location: "Hochschule Mainz",
        capacity: 15,
        equipment: ["TV"]
      });

    const roomId = roomResponse.body.id;

    const appointmentResponse = await request(app)
      .post("/appointments")
      .send({
        title: "Original Appointment",
        description: "Before update",
        roomId,
        startTime: "2026-06-22T10:00:00.000Z",
        endTime: "2026-06-22T11:00:00.000Z",
        participants: ["test@example.com"]
      });

    const appointmentId = appointmentResponse.body.id;

    const updateResponse = await request(app)
      .put(`/appointments/${appointmentId}`)
      .send({
        title: "Updated Appointment"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Updated Appointment");

    const deleteResponse = await request(app).delete(
      `/appointments/${appointmentId}`
    );

    expect(deleteResponse.status).toBe(204);

    const getDeletedResponse = await request(app).get(
      `/appointments/${appointmentId}`
    );

    expect(getDeletedResponse.status).toBe(404);
  });
});