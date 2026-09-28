export type RoomStatus = "available" | "occupied";

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  status: RoomStatus;
}

export interface CreateRoomInput {
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
}

export interface UpdateRoomInput {
  name?: string;
  location?: string;
  capacity?: number;
  equipment?: string[];
  status?: RoomStatus;
}