const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const webpush = require('web-push');

const PORT = 3001;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'REPLACE_WITH_VAPID_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'REPLACE_WITH_VAPID_PRIVATE_KEY';
if (!VAPID_PUBLIC_KEY.startsWith('REPLACE_') && !VAPID_PRIVATE_KEY.startsWith('REPLACE_')) {
  webpush.setVapidDetails('mailto:student@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);
    if (VAPID_PUBLIC_KEY.startsWith('REPLACE_')) return;
    const payload = JSON.stringify({ title: 'Новая задача', body: task.text });
    subscriptions.forEach((sub) => webpush.sendNotification(sub, payload).catch(() => null));
  });

  socket.on('newReminder', ({ id, text, reminderTime }) => {
    const delay = reminderTime - Date.now();
    if (delay <= 0) return;
    const timeoutId = setTimeout(() => {
      if (!VAPID_PUBLIC_KEY.startsWith('REPLACE_')) {
        const payload = JSON.stringify({ title: 'Напоминание', body: text, reminderId: id });
        subscriptions.forEach((sub) => webpush.sendNotification(sub, payload).catch(() => null));
      }
      reminders.delete(id);
    }, delay);
    reminders.set(id, { timeoutId, text, reminderTime });
  });
});

app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  const index = subscriptions.findIndex((sub) => sub.endpoint === endpoint);
  if (index >= 0) subscriptions.splice(index, 1);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = Number(req.query.reminderId);
  if (!reminders.has(reminderId)) return res.status(404).json({ error: 'Reminder not found' });
  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);
  const newDelay = 5 * 60 * 1000;
  const timeoutId = setTimeout(() => {
    if (!VAPID_PUBLIC_KEY.startsWith('REPLACE_')) {
      const payload = JSON.stringify({ title: 'Напоминание отложено', body: reminder.text, reminderId });
      subscriptions.forEach((sub) => webpush.sendNotification(sub, payload).catch(() => null));
    }
    reminders.delete(reminderId);
  }, newDelay);
  reminders.set(reminderId, { timeoutId, text: reminder.text, reminderTime: Date.now() + newDelay });
  return res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
