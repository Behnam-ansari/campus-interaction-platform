import request from "supertest";
import { app } from "../app";
import { setupGraphql } from "../graphql/graphql.server";
import { prepareTestDatabase } from "./test-utils";

beforeAll(async () => {
  await setupGraphql(app);
});

beforeEach(async () => {
  await prepareTestDatabase();
});

describe("GraphQL integration", () => {
  it("creates a room with GraphQL mutation and reads it with rooms query", async () => {
    const createRoomMutation = `
      mutation {
        createRoom(
          input: {
            name: "GraphQL Test Room"
            location: "Hochschule Mainz"
            capacity: 40
            equipment: ["Beamer", "Whiteboard"]
          }
        ) {
          id
          name
          location
          capacity
          equipment
          status
        }
      }
    `;

    const createRoomResponse = await request(app)
      .post("/graphql")
      .send({
        query: createRoomMutation
      });

    expect(createRoomResponse.status).toBe(200);
    expect(createRoomResponse.body.errors).toBeUndefined();
    expect(createRoomResponse.body.data.createRoom.name).toBe(
      "GraphQL Test Room"
    );
    expect(createRoomResponse.body.data.createRoom.status).toBe("available");

    const roomsQuery = `
      query {
        rooms {
          id
          name
          location
          capacity
          equipment
          status
        }
      }
    `;

    const roomsResponse = await request(app)
      .post("/graphql")
      .send({
        query: roomsQuery
      });

    expect(roomsResponse.status).toBe(200);
    expect(roomsResponse.body.errors).toBeUndefined();
    expect(roomsResponse.body.data.rooms.length).toBe(1);
    expect(roomsResponse.body.data.rooms[0].name).toBe("GraphQL Test Room");
  });

  it("creates an appointment and returns rooms with appointments", async () => {
    const createRoomResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createRoom(
              input: {
                name: "Room With Appointment"
                location: "Hochschule Mainz"
                capacity: 30
                equipment: ["Beamer"]
              }
            ) {
              id
            }
          }
        `
      });

    const roomId = createRoomResponse.body.data.createRoom.id;

    const createAppointmentResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation CreateAppointment($input: CreateAppointmentInput!) {
            createAppointment(input: $input) {
              id
              title
              roomId
              startTime
              endTime
            }
          }
        `,
        variables: {
          input: {
            title: "GraphQL Appointment",
            description: "Created in GraphQL integration test",
            roomId,
            startTime: "2026-06-25T10:00:00.000Z",
            endTime: "2026-06-25T11:00:00.000Z",
            participants: ["test@example.com"]
          }
        }
      });

    expect(createAppointmentResponse.status).toBe(200);
    expect(createAppointmentResponse.body.errors).toBeUndefined();
    expect(createAppointmentResponse.body.data.createAppointment.title).toBe(
      "GraphQL Appointment"
    );

    const roomsWithAppointmentsResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            rooms {
              id
              name
              appointments {
                id
                title
                startTime
                endTime
              }
            }
          }
        `
      });

    expect(roomsWithAppointmentsResponse.status).toBe(200);
    expect(roomsWithAppointmentsResponse.body.errors).toBeUndefined();

    const room = roomsWithAppointmentsResponse.body.data.rooms[0];

    expect(room.name).toBe("Room With Appointment");
    expect(room.appointments.length).toBe(1);
    expect(room.appointments[0].title).toBe("GraphQL Appointment");
  });

  it("returns only free rooms in a requested time range", async () => {
    const roomAResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createRoom(
              input: {
                name: "Booked Room"
                location: "Hochschule Mainz"
                capacity: 20
                equipment: ["Beamer"]
              }
            ) {
              id
            }
          }
        `
      });

    const roomBResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createRoom(
              input: {
                name: "Free Room"
                location: "Hochschule Mainz"
                capacity: 25
                equipment: ["Whiteboard"]
              }
            ) {
              id
            }
          }
        `
      });

    const bookedRoomId = roomAResponse.body.data.createRoom.id;

    const createAppointmentResponse = await request(app)
     .post("/appointments")
     .send({
        title: "Existing Appointment",
        description: "Blocks the room",
        roomId: bookedRoomId,
        startTime: "2026-06-26T10:00:00.000Z",
        endTime: "2026-06-26T11:00:00.000Z",
        participants: ["test@example.com"]
     });

expect(createAppointmentResponse.status).toBe(201);

    const freeRoomsResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            freeRoomsInTimeRange(
              startTime: "2026-06-26T10:30:00.000Z"
              endTime: "2026-06-26T11:30:00.000Z"
            ) {
              id
              name
            }
          }
        `
      });

    expect(freeRoomsResponse.status).toBe(200);
    expect(freeRoomsResponse.body.errors).toBeUndefined();

    const freeRoomNames = freeRoomsResponse.body.data.freeRoomsInTimeRange.map(
      (room: { name: string }) => room.name
    );

    expect(freeRoomNames).toContain("Free Room");
    expect(freeRoomNames).not.toContain("Booked Room");

    expect(roomBResponse.body.data.createRoom.id).toBeDefined();
  });
});