import { Router, Request, Response } from "express";
import {
  addRoom,
  changeRoom,
  getRoom,
  getRooms,
  removeRoom
} from "./room.service";

export const roomRouter = Router();

roomRouter.get("/", async (_req: Request, res: Response) => {
  const rooms = await getRooms();
  res.json(rooms);
});

roomRouter.get("/:id", async (req: Request, res: Response) => {
  const room = await getRoom(req.params.id);

  if (!room) {
    res.status(404).json({
      error: "Room not found."
    });
    return;
  }

  res.json(room);
});

roomRouter.post("/", async (req: Request, res: Response) => {
  try {
    const room = await addRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid room data."
    });
  }
});

roomRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const room = await changeRoom(req.params.id, req.body);

    if (!room) {
      res.status(404).json({
        error: "Room not found."
      });
      return;
    }

    res.json(room);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid room data."
    });
  }
});

roomRouter.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await removeRoom(req.params.id);

  if (!deleted) {
    res.status(404).json({
      error: "Room not found."
    });
    return;
  }

  res.status(204).send();
});