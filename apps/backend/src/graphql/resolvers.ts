import {
  addRoom,
  changeRoom,
  getRoom,
  getRooms,
  removeRoom
} from "../modules/rooms/room.service";

import {
  addAppointment,
  changeAppointment,
  getAppointment,
  getAppointments,
  getAppointmentsByRoom,
  isRoomFreeInTimeRange,
  removeAppointment
} from "../modules/appointments/appointment.service";

import { Appointment } from "../modules/appointments/appointment.model";
import { Room } from "../modules/rooms/room.model";



export const resolvers = {
  Query: {
    rooms: async (): Promise<Room[]> => {
      return getRooms();
    },

    room: async (_parent: unknown, args: { id: string }): Promise<Room | undefined> => {
      return getRoom(args.id);
    },

    appointments: async (): Promise<Appointment[]> => {
      return getAppointments();
    },

    appointment: async (
      _parent: unknown,
      args: { id: string }
    ): Promise<Appointment | undefined> => {
      return getAppointment(args.id);
    },

    appointmentsByRoom: async (
      _parent: unknown,
      args: { roomId: string }
    ): Promise<Appointment[]> => {
      return getAppointmentsByRoom(args.roomId);
    },

    freeRoomsInTimeRange: async (
      _parent: unknown,
      args: { startTime: string; endTime: string }
    ): Promise<Room[]> => {
      const rooms = await getRooms();
      const freeRooms: Room[] = [];

      for (const room of rooms) {
        const isFree = await isRoomFreeInTimeRange(
          room.id,
          args.startTime,
          args.endTime
        );

        if (isFree) {
          freeRooms.push(room);
        }
      }

      return freeRooms;
    }
  },

  Mutation: {
    createRoom: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          location: string;
          capacity: number;
          equipment: string[];
        };
      }
    ): Promise<Room> => {
      return addRoom(args.input);
    },

    updateRoom: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          location?: string;
          capacity?: number;
          equipment?: string[];
          status?: "available" | "occupied";
        };
      }
    ): Promise<Room | undefined> => {
      return changeRoom(args.id, args.input);
    },

    deleteRoom: async (
      _parent: unknown,
      args: { id: string }
    ): Promise<boolean> => {
      return removeRoom(args.id);
    },

    createAppointment: async (
      _parent: unknown,
      args: {
        input: {
          title: string;
          description?: string;
          roomId: string;
          startTime: string;
          endTime: string;
          participants: string[];
        };
      }
    ): Promise<Appointment> => {
      return addAppointment(args.input);
    },

    updateAppointment: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          title?: string;
          description?: string;
          roomId?: string;
          startTime?: string;
          endTime?: string;
          participants?: string[];
        };
      }
    ): Promise<Appointment | undefined> => {
      return changeAppointment(args.id, args.input);
    },

    deleteAppointment: async (
      _parent: unknown,
      args: { id: string }
    ): Promise<boolean> => {
      return removeAppointment(args.id);
    }
  },

  Room: {
    appointments: async (room: Room): Promise<Appointment[]> => {
      return getAppointmentsByRoom(room.id);
    },

    nextAppointment: async (room: Room): Promise<Appointment | undefined> => {
      const appointments = await getAppointmentsByRoom(room.id);
      const now = new Date();

      return appointments
        .filter((appointment) => new Date(appointment.startTime) >= now)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )[0];
    }
  },

  Appointment: {
    room: async (appointment: Appointment): Promise<Room | undefined> => {
      return getRoom(appointment.roomId);
    }
  }
};