import { createServer, Server } from "http";
import request from "supertest";
import WebSocket from "ws";
import { app } from "../app";
import {
  closeRealtimeServer,
  setupRealtimeServer
} from "../realtime/realtime.server";
import { prepareTestDatabase } from "./test-utils";

let httpServer: Server;
let serverUrl: string;
let websocketUrl: string;

function waitForServerToListen(server: Server): Promise<void> {
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
  await prepareTestDatabase();

  httpServer = createServer(app);
  setupRealtimeServer(httpServer);

  await waitForServerToListen(httpServer);
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

describe("WebSocket integration", () => {
  it("sends a ROOM_CREATED event when a room is created", async () => {
    const socket = new WebSocket(websocketUrl);

    await new Promise<void>((resolve) => {
      socket.on("open", () => {
        resolve();
      });
    });

    const roomCreatedEventPromise = waitForWebSocketEvent(
      socket,
      "ROOM_CREATED"
    );

    const createRoomResponse = await request(serverUrl)
      .post("/rooms")
      .send({
        name: "WebSocket Test Room",
        location: "Hochschule Mainz",
        capacity: 25,
        equipment: ["Beamer"]
      });

    expect(createRoomResponse.status).toBe(201);

    const event = await roomCreatedEventPromise;

    expect(event.type).toBe("ROOM_CREATED");
    expect(event.payload.name).toBe("WebSocket Test Room");

    socket.close();
  });

  it("sends an APPOINTMENT_CREATED event when an appointment is created", async () => {
    const roomResponse = await request(serverUrl)
      .post("/rooms")
      .send({
        name: "WebSocket Appointment Room",
        location: "Hochschule Mainz",
        capacity: 20,
        equipment: ["Whiteboard"]
      });

    const roomId = roomResponse.body.id;

    const socket = new WebSocket(websocketUrl);

    await new Promise<void>((resolve) => {
      socket.on("open", () => {
        resolve();
      });
    });

    const appointmentCreatedEventPromise = waitForWebSocketEvent(
      socket,
      "APPOINTMENT_CREATED"
    );

    const appointmentResponse = await request(serverUrl)
      .post("/appointments")
      .send({
        title: "WebSocket Test Appointment",
        description: "Created during WebSocket integration test",
        roomId,
        startTime: "2026-06-27T10:00:00.000Z",
        endTime: "2026-06-27T11:00:00.000Z",
        participants: ["test@example.com"]
      });

    expect(appointmentResponse.status).toBe(201);

    const event = await appointmentCreatedEventPromise;

    expect(event.type).toBe("APPOINTMENT_CREATED");
    expect(event.payload.title).toBe("WebSocket Test Appointment");

    socket.close();
  });
});