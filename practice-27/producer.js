import express from "express";
import { connectRabbit, setupQueues, TASK_QUEUE } from "./queues.js";

const port = Number(process.env.PORT) || 3030;

const connection = await connectRabbit();
const channel = await connection.createChannel();
await setupQueues(channel);

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/tasks", (req, res) => {
  const { type, payload } = req.body ?? {};
  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }
  const body = Buffer.from(JSON.stringify({ type, payload: payload ?? {} }));
  channel.sendToQueue(TASK_QUEUE, body, { persistent: true });
  res.status(202).json({ accepted: true });
});

app.listen(port, () => {
  console.log(`Producer API http://127.0.0.1:${port}`);
});
