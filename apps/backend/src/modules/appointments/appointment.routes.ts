import { Router, Request, Response } from "express";
import {
  addAppointment,
  changeAppointment,
  getAppointment,
  getAppointments,
  getAppointmentsByRoom,
  removeAppointment
} from "./appointment.service";

export const appointmentRouter = Router();

appointmentRouter.get("/", async (req: Request, res: Response) => {
  const roomId = req.query.roomId;

  if (typeof roomId === "string") {
    const appointments = await getAppointmentsByRoom(roomId);
    res.json(appointments);
    return;
  }

  const appointments = await getAppointments();
  res.json(appointments);
});

appointmentRouter.get("/:id", async (req: Request, res: Response) => {
  const appointment = await getAppointment(req.params.id);

  if (!appointment) {
    res.status(404).json({
      error: "Appointment not found."
    });
    return;
  }

  res.json(appointment);
});

appointmentRouter.post("/", async (req: Request, res: Response) => {
  try {
    const appointment = await addAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Invalid appointment data."
    });
  }
});

appointmentRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const appointment = await changeAppointment(req.params.id, req.body);

    if (!appointment) {
      res.status(404).json({
        error: "Appointment not found."
      });
      return;
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Invalid appointment data."
    });
  }
});

appointmentRouter.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await removeAppointment(req.params.id);

  if (!deleted) {
    res.status(404).json({
      error: "Appointment not found."
    });
    return;
  }

  res.status(204).send();
});