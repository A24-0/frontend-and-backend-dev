import amqp from "amqplib";

export const TASK_QUEUE = "tasks_queue";
export const DLX_NAME = "tasks_dlx";
export const DLQ_NAME = "tasks_dlq";
export const DLX_ROUTE = "dead";

export async function setupQueues(channel) {
  await channel.assertExchange(DLX_NAME, "direct", { durable: true });
  await channel.assertQueue(DLQ_NAME, { durable: true });
  await channel.bindQueue(DLQ_NAME, DLX_NAME, DLX_ROUTE);
  await channel.assertQueue(TASK_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_NAME,
      "x-dead-letter-routing-key": DLX_ROUTE,
    },
  });
}

export async function connectRabbit() {
  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@127.0.0.1:5672";
  return amqp.connect(url);
}
