import { APPOINTMENT_EXCHANGE, getRabbitMqChannel } from "./rabbitmq";
import { Appointment } from "../modules/appointments/appointment.model";

export type AppointmentEventType =
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_UPDATED"
  | "APPOINTMENT_DELETED";

export interface AppointmentEvent {
  type: AppointmentEventType;
  payload: unknown;
  createdAt: string;
}

function toRoutingKey(type: AppointmentEventType): string {
  switch (type) {
    case "APPOINTMENT_CREATED":
      return "appointment.created";
    case "APPOINTMENT_UPDATED":
      return "appointment.updated";
    case "APPOINTMENT_DELETED":
      return "appointment.deleted";
  }
}

export function publishAppointmentEvent(
  type: AppointmentEventType,
  payload: Appointment | { id: string }
): void {
  try {
    const channel = getRabbitMqChannel();

    const event: AppointmentEvent = {
      type,
      payload,
      createdAt: new Date().toISOString()
    };

    const routingKey = toRoutingKey(type);

    channel.publish(
      APPOINTMENT_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json"
      }
    );

    console.log(`Published RabbitMQ event: ${type}`);
  } catch (error) {
    console.warn(
      `RabbitMQ event ${type} was not published because RabbitMQ is not initialized.`
    );
  }
}



