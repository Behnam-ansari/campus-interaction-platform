import { createServer, Server } from "http";
import request from "supertest";
import WebSocket from "ws";
import { app } from "../app";
import { setupGraphql } from "../graphql/graphql.server";
import {
  closeRealtimeServer,
  setupRealtimeServer
} from "../realtime/realtime.server";
import { prepareTestDatabase } from "./test-utils";

let httpServer: Server;
let serverUrl: string;
let websocketUrl: string;

function startHttpServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address && typeof address !== "string") {
        serverUrl = `http://127.0.0.1:${address.port}`;
        websocketUrl = `ws://127.0.0.1:${address.port}/ws`;
      }

      resolve();
    });
  });
}

function waitForWebSocketOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    socket.on("open", () => {
      resolve();
    });
  });
}

function waitForWebSocketEvent(
  socket: WebSocket,
  expectedType: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Did not receive WebSocket event ${expectedType}`));
    }, 3000);

    socket.on("message", (data) => {
      const event = JSON.parse(data.toString());

      if (event.type === expectedType) {
        clearTimeout(timeout);
        resolve(event);
      }
    });
  });
}

beforeAll(async () => {
  await setupGraphql(app);

  httpServer = createServer(app);
  setupRealtimeServer(httpServer);

  await startHttpServer(httpServer);
});

afterAll(async () => {
  await closeRealtimeServer();

  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      resolve();
    });
  });
});

beforeEach(async () => {
  await prepareTestDatabase();
});

describe("End-to-end integration flow", () => {
  it("creates a room, creates an appointment, receives WebSocket event and reads the appointment via GraphQL", async () => {
    const socket = new WebSocket(websocketUrl);
    await waitForWebSocketOpen(socket);

    const appointmentCreatedEventPromise = waitForWebSocketEvent(
      socket,
      "APPOINTMENT_CREATED"
    );

    const createRoomResponse = await request(serverUrl)
      .post("/rooms")
      .send({
        name: "E2E Test Room",
        location: "Hochschule Mainz",
        capacity: 30,
        equipment: ["Beamer", "Whiteboard"]
      });

    expect(createRoomResponse.status).toBe(201);

    const roomId = createRoomResponse.body.id;

    const createAppointmentResponse = await request(serverUrl)
      .post("/appointments")
      .send({
        title: "E2E Test Appointment",
        description: "Created during end-to-end integration test",
        roomId,
        startTime: "2026-06-30T10:00:00.000Z",
        endTime: "2026-06-30T11:00:00.000Z",
        participants: ["e2e@example.com"]
      });

    expect(createAppointmentResponse.status).toBe(201);

    const event = await appointmentCreatedEventPromise;

    expect(event.type).toBe("APPOINTMENT_CREATED");
    expect(event.payload.title).toBe("E2E Test Appointment");
    expect(event.payload.roomId).toBe(roomId);

    const graphQlResponse = await request(serverUrl)
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

    expect(graphQlResponse.status).toBe(200);
    expect(graphQlResponse.body.errors).toBeUndefined();

    const rooms = graphQlResponse.body.data.rooms;
    const room = rooms.find((item: { id: string }) => item.id === roomId);

    expect(room).toBeDefined();
    expect(room.name).toBe("E2E Test Room");
    expect(room.appointments.length).toBe(1);
    expect(room.appointments[0].title).toBe("E2E Test Appointment");

    const freeRoomsResponse = await request(serverUrl)
      .post("/graphql")
      .send({
        query: `
          query {
            freeRoomsInTimeRange(
              startTime: "2026-06-30T10:30:00.000Z"
              endTime: "2026-06-30T11:30:00.000Z"
            ) {
              id
              name
            }
          }
        `
      });

    expect(freeRoomsResponse.status).toBe(200);
    expect(freeRoomsResponse.body.errors).toBeUndefined();

    const freeRoomIds = freeRoomsResponse.body.data.freeRoomsInTimeRange.map(
      (room: { id: string }) => room.id
    );

    expect(freeRoomIds).not.toContain(roomId);

    socket.close();
  });
});