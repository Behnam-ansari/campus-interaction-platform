export type RoomStatus = "available" | "occupied";

export interface RoomDto {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  status: RoomStatus;
}

export interface AppointmentDto {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  endTime: string;
  participants: string[];
}