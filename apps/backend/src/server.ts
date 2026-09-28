const dotenv = require("dotenv");
import { createServer } from "http";
import { app } from "./app";
import { checkDatabaseConnection } from "./database/db";
import { initializeDatabaseSchema } from "./database/schema";
import { setupGraphql } from "./graphql/graphql.server";
import { setupRealtimeServer } from "./realtime/realtime.server";
import { connectRabbitMq } from "./messaging/rabbitmq";
import { startNotificationConsumer } from "./messaging/notification.consumer";

dotenv.config();

const port = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await checkDatabaseConnection();
    console.log("Database connection established.");

    await initializeDatabaseSchema();
    console.log("Database schema initialized.");

    await connectRabbitMq();
    await startNotificationConsumer();

    await setupGraphql(app);
    console.log("GraphQL endpoint initialized at /graphql.");

    const httpServer = createServer(app);

    setupRealtimeServer(httpServer);
    console.log("WebSocket endpoint initialized at /ws.");

    httpServer.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

startServer();