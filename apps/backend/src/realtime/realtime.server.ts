import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

export type RealtimeEvent = {
  type: string;
  payload: unknown;
  createdAt: string;
};

let websocketServer: WebSocketServer | undefined;

export function setupRealtimeServer(httpServer: HttpServer): void {
  websocketServer = new WebSocketServer({
    server: httpServer,
    path: "/ws"
  });

  websocketServer.on("connection", (socket) => {
    console.log("WebSocket client connected.");

    socket.send(
      JSON.stringify({
        type: "CONNECTED",
        payload: {
          message: "Connected to Campus Interaction Platform realtime server."
        },
        createdAt: new Date().toISOString()
      })
    );

    socket.on("close", () => {
      console.log("WebSocket client disconnected.");
    });
  });
}

export function broadcastRealtimeEvent(type: string, payload: unknown): void {
  if (!websocketServer) {
    return;
  }

  const event: RealtimeEvent = {
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  const message = JSON.stringify(event);

  websocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }); 
}

export async function closeRealtimeServer(): Promise<void> {
  if (!websocketServer) {
    return;
  }

  await new Promise<void>((resolve) => {
    websocketServer?.close(() => {
      resolve();
    });
  });

  websocketServer = undefined;
}