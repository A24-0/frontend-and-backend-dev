import { connectRabbit, setupQueues, TASK_QUEUE } from "./queues.js";
import { runWithRetries } from "./retry.js";

const workerId = process.env.WORKER_ID || "1";

async function handleTask(data) {
  await new Promise((r) => setTimeout(r, 400));
  if (data.payload?.mustFail) {
    throw new Error("forced failure");
  }
  console.log(`[worker ${workerId}] done`, data.type, data.payload);
}

const connection = await connectRabbit();
const channel = await connection.createChannel();
await setupQueues(channel);
channel.prefetch(1);

console.log(`[worker ${workerId}] waiting`);

channel.consume(
  TASK_QUEUE,
  (msg) => {
    if (!msg) return;
    let data;
    try {
      data = JSON.parse(msg.content.toString());
    } catch {
      channel.nack(msg, false, false);
      return;
    }
    void (async () => {
      try {
        await runWithRetries(data, handleTask, { maxAttempts: 3 });
        channel.ack(msg);
      } catch (err) {
        console.error(`[worker ${workerId}] dead-letter`, err.message);
        channel.nack(msg, false, false);
      }
    })();
  },
  { noAck: false }
);
