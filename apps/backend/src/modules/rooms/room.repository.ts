import { randomUUID } from "crypto";
import { pool } from "../../database/db";
import { CreateRoomInput, Room, UpdateRoomInput } from "./room.model";

function mapRoomRow(row: any): Room {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    capacity: row.capacity,
    equipment: row.equipment,
    status: row.status
  };
}

export async function findAllRooms(): Promise<Room[]> {
  const result = await pool.query("SELECT * FROM rooms ORDER BY created_at ASC");
  return result.rows.map(mapRoomRow);
}

export async function findRoomById(id: string): Promise<Room | undefined> {
  const result = await pool.query("SELECT * FROM rooms WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return undefined;
  }

  return mapRoomRow(result.rows[0]);
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const id = randomUUID();

  const result = await pool.query(
    `
    INSERT INTO rooms (id, name, location, capacity, equipment, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [id, input.name, input.location, input.capacity, input.equipment, "available"]
  );

  return mapRoomRow(result.rows[0]);
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput
): Promise<Room | undefined> {
  const existingRoom = await findRoomById(id);

  if (!existingRoom) {
    return undefined;
  }

  const updatedRoom = {
    ...existingRoom,
    ...input
  };

  const result = await pool.query(
    `
    UPDATE rooms
    SET name = $1,
        location = $2,
        capacity = $3,
        equipment = $4,
        status = $5
    WHERE id = $6
    RETURNING *
    `,
    [
      updatedRoom.name,
      updatedRoom.location,
      updatedRoom.capacity,
      updatedRoom.equipment,
      updatedRoom.status,
      id
    ]
  );

  return mapRoomRow(result.rows[0]);
}

export async function deleteRoom(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
  return result.rowCount !== null && result.rowCount > 0;
}