import type { Request, Response } from "express";
import { roomRouter } from "./modules/rooms/room.routes";
import { appointmentRouter } from "./modules/appointments/appointment.routes";
import { checkDatabaseConnection } from "./database/db";

const express = require("express");
const cors = require("cors");

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "campus-interaction-platform-backend"
  });
});
app.get("/db-health", async (_req: Request, res: Response) => {
  try {
    await checkDatabaseConnection();

    return res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      database: "not connected"
    });
  }
});

app.use("/rooms", roomRouter);
app.use("/appointments", appointmentRouter);