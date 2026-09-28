export interface Appointment {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  endTime: string;
  participants: string[];
}

export interface CreateAppointmentInput {
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  endTime: string;
  participants: string[];
}

export interface UpdateAppointmentInput {
  title?: string;
  description?: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  participants?: string[];
}