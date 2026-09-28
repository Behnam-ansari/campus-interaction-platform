import { getRoom } from "../rooms/room.service";
import {
  createAppointment,
  deleteAppointment,
  findAllAppointments,
  findAppointmentById,
  findAppointmentsByRoomId,
  hasAppointmentConflict,
  updateAppointment
} from "./appointment.repository";
import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput
} from "./appointment.model";
import { broadcastRealtimeEvent } from "../../realtime/realtime.server";
import { publishAppointmentEvent } from "../../messaging/appointment.publisher";

export async function getAppointments(): Promise<Appointment[]> {
  return findAllAppointments();
}

export async function getAppointment(
  id: string
): Promise<Appointment | undefined> {
  return findAppointmentById(id);
}

export async function getAppointmentsByRoom(
  roomId: string
): Promise<Appointment[]> {
  return findAppointmentsByRoomId(roomId);
}

export async function addAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  validateCreateAppointmentInput(input);
  await ensureRoomExists(input.roomId);
  await ensureNoTimeConflict(input.roomId, input.startTime, input.endTime);

  const appointment = await createAppointment(input);

  broadcastRealtimeEvent("APPOINTMENT_CREATED", appointment);

  publishAppointmentEvent("APPOINTMENT_CREATED", appointment);

  return appointment;
}

export async function changeAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<Appointment | undefined> {
  const existingAppointment = await findAppointmentById(id);

  if (!existingAppointment) {
    return undefined;
  }

  const updatedCandidate: Appointment = {
    ...existingAppointment,
    ...input
  };

  validateAppointmentData(updatedCandidate);
  await ensureRoomExists(updatedCandidate.roomId);
  await ensureNoTimeConflict(
    updatedCandidate.roomId,
    updatedCandidate.startTime,
    updatedCandidate.endTime,
    id
  );

  const appointment = await updateAppointment(id, input);

  if (appointment) {
    broadcastRealtimeEvent("APPOINTMENT_UPDATED", appointment);
    publishAppointmentEvent("APPOINTMENT_UPDATED", appointment);
  }

  return appointment;
}

export async function removeAppointment(id: string): Promise<boolean> {
  const deleted = await deleteAppointment(id);

  if (deleted) {
  broadcastRealtimeEvent("APPOINTMENT_DELETED", {
    id
  });

  publishAppointmentEvent("APPOINTMENT_DELETED", {
    id
  });
}

  return deleted;
}

function validateCreateAppointmentInput(input: CreateAppointmentInput): void {
  validateAppointmentData({
    id: "temporary-id",
    ...input
  });
}

function validateAppointmentData(appointment: Appointment): void {
  if (!appointment.title || appointment.title.trim().length === 0) {
    throw new Error("Appointment title is required.");
  }

  if (!appointment.roomId || appointment.roomId.trim().length === 0) {
    throw new Error("Room ID is required.");
  }

  if (!Array.isArray(appointment.participants)) {
    throw new Error("Participants must be an array.");
  }

  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Start time must be a valid date.");
  }

  if (Number.isNaN(end.getTime())) {
    throw new Error("End time must be a valid date.");
  }

  if (end <= start) {
    throw new Error("End time must be after start time.");
  }
}

async function ensureRoomExists(roomId: string): Promise<void> {
  const room = await getRoom(roomId);

  if (!room) {
    throw new Error("Room does not exist.");
  }
}

async function ensureNoTimeConflict(
  roomId: string,
  startTime: string,
  endTime: string,
  ignoredAppointmentId?: string
): Promise<void> {
  const hasConflict = await hasAppointmentConflict(
    roomId,
    startTime,
    endTime,
    ignoredAppointmentId
  );

  if (hasConflict) {
    throw new Error("The selected room is already booked in this time range.");
  }
}

export async function isRoomFreeInTimeRange(
  roomId: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const hasConflict = await hasAppointmentConflict(roomId, startTime, endTime);
  return !hasConflict;
}