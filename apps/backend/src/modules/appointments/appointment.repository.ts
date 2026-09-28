import { randomUUID } from "crypto";
import { pool } from "../../database/db";
import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput
} from "./appointment.model";

function mapAppointmentRow(row: any): Appointment {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    roomId: row.room_id,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
    participants: row.participants
  };
}

export async function findAllAppointments(): Promise<Appointment[]> {
  const result = await pool.query(
    "SELECT * FROM appointments ORDER BY start_time ASC"
  );

  return result.rows.map(mapAppointmentRow);
}

export async function findAppointmentById(
  id: string
): Promise<Appointment | undefined> {
  const result = await pool.query("SELECT * FROM appointments WHERE id = $1", [
    id
  ]);

  if (result.rows.length === 0) {
    return undefined;
  }

  return mapAppointmentRow(result.rows[0]);
}

export async function findAppointmentsByRoomId(
  roomId: string
): Promise<Appointment[]> {
  const result = await pool.query(
    "SELECT * FROM appointments WHERE room_id = $1 ORDER BY start_time ASC",
    [roomId]
  );

  return result.rows.map(mapAppointmentRow);
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const id = randomUUID();

  const result = await pool.query(
    `
    INSERT INTO appointments
      (id, title, description, room_id, start_time, end_time, participants)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      id,
      input.title,
      input.description ?? null,
      input.roomId,
      input.startTime,
      input.endTime,
      input.participants
    ]
  );

  return mapAppointmentRow(result.rows[0]);
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<Appointment | undefined> {
  const existingAppointment = await findAppointmentById(id);

  if (!existingAppointment) {
    return undefined;
  }

  const updatedAppointment = {
    ...existingAppointment,
    ...input
  };

  const result = await pool.query(
    `
    UPDATE appointments
    SET title = $1,
        description = $2,
        room_id = $3,
        start_time = $4,
        end_time = $5,
        participants = $6
    WHERE id = $7
    RETURNING *
    `,
    [
      updatedAppointment.title,
      updatedAppointment.description ?? null,
      updatedAppointment.roomId,
      updatedAppointment.startTime,
      updatedAppointment.endTime,
      updatedAppointment.participants,
      id
    ]
  );

  return mapAppointmentRow(result.rows[0]);
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM appointments WHERE id = $1", [
    id
  ]);

  return result.rowCount !== null && result.rowCount > 0;
}

export async function hasAppointmentConflict(
  roomId: string,
  startTime: string,
  endTime: string,
  ignoredAppointmentId?: string
): Promise<boolean> {
  const values: string[] = [roomId, startTime, endTime];

  let query = `
    SELECT id
    FROM appointments
    WHERE room_id = $1
      AND start_time < $3
      AND end_time > $2
  `;

  if (ignoredAppointmentId) {
    query += " AND id <> $4";
    values.push(ignoredAppointmentId);
  }

  const result = await pool.query(query, values);
  return result.rows.length > 0;
}