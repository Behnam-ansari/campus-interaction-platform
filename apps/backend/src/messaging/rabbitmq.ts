import amqp from "amqplib";

let connection: any;
let channel: any;

export const APPOINTMENT_EXCHANGE = "appointment.events";

export async function connectRabbitMq(): Promise<void> {
  if (!process.env.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not defined. Please check apps/backend/.env");
  }

  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertExchange(APPOINTMENT_EXCHANGE, "topic", {
    durable: true
  });

  console.log("RabbitMQ connection established.");
}

export function getRabbitMqChannel(): any {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized.");
  }

  return channel;
}