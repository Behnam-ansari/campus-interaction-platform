import { APPOINTMENT_EXCHANGE, getRabbitMqChannel } from "./rabbitmq";
import type { ConsumeMessage } from "amqplib";

export async function startNotificationConsumer(): Promise<void> {
  const channel = getRabbitMqChannel();

  const queue = await channel.assertQueue("notification-service.appointments", {
    durable: true
  });

  await channel.bindQueue(queue.queue, APPOINTMENT_EXCHANGE, "appointment.*");

  await channel.consume(queue.queue, (message: ConsumeMessage | null) => {
    if (!message) {
      return;
    }

    const content = message.content.toString();

    try {
      const event = JSON.parse(content);

      console.log("Notification event received:", {
        type: event.type,
        createdAt: event.createdAt
      });

      console.log(
        `Notification Service: In-app notification would be created for event ${event.type}.`
      );

      channel.ack(message);
    } catch (error) {
      console.error("Failed to process notification event:", error);
      channel.nack(message, false, false);
    }
  });

  console.log("Notification consumer started.");
}