import {
  createRoom,
  deleteRoom,
  findAllRooms,
  findRoomById,
  updateRoom
} from "./room.repository";
import { CreateRoomInput, Room, UpdateRoomInput } from "./room.model";
import { broadcastRealtimeEvent } from "../../realtime/realtime.server";

export async function getRooms(): Promise<Room[]> {
  return findAllRooms();
}

export async function getRoom(id: string): Promise<Room | undefined> {
  return findRoomById(id);
}

export async function addRoom(input: CreateRoomInput): Promise<Room> {
  validateCreateRoomInput(input);

  const room = await createRoom(input);

  broadcastRealtimeEvent("ROOM_CREATED", room);

  return room;
}

export async function changeRoom(
  id: string,
  input: UpdateRoomInput
): Promise<Room | undefined> {
  validateUpdateRoomInput(input);

  const room = await updateRoom(id, input);

  if (room) {
    broadcastRealtimeEvent("ROOM_UPDATED", room);
  }

  return room;
}

export async function removeRoom(id: string): Promise<boolean> {
  const deleted = await deleteRoom(id);

  if (deleted) {
    broadcastRealtimeEvent("ROOM_DELETED", {
      id
    });
  }

  return deleted;
}

function validateCreateRoomInput(input: CreateRoomInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Room name is required.");
  }

  if (!input.location || input.location.trim().length === 0) {
    throw new Error("Room location is required.");
  }

  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    throw new Error("Room capacity must be a positive integer.");
  }

  if (!Array.isArray(input.equipment)) {
    throw new Error("Room equipment must be an array.");
  }
}

function validateUpdateRoomInput(input: UpdateRoomInput): void {
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error("Room name must not be empty.");
  }

  if (input.location !== undefined && input.location.trim().length === 0) {
    throw new Error("Room location must not be empty.");
  }

  if (
    input.capacity !== undefined &&
    (!Number.isInteger(input.capacity) || input.capacity <= 0)
  ) {
    throw new Error("Room capacity must be a positive integer.");
  }

  if (input.equipment !== undefined && !Array.isArray(input.equipment)) {
    throw new Error("Room equipment must be an array.");
  }

  if (
    input.status !== undefined &&
    input.status !== "available" &&
    input.status !== "occupied"
  ) {
    throw new Error("Room status must be either available or occupied.");
  }
}