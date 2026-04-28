const socket = io('http://localhost:3001');
const content = document.getElementById('app-content');

async function loadPage() {
  const res = await fetch('./content/home.html');
  content.innerHTML = await res.text();
  initNotes();
}

function showToast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const list = document.getElementById('notes-list');
  const load = () => {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = notes.map((n) => `<li>${n.text || n}</li>`).join('');
  };
  const addNote = (text, reminder = null) => {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = { id: Date.now(), text, reminder };
    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    load();
    if (reminder) {
      socket.emit('newReminder', { id: note.id, text, reminderTime: reminder });
    } else {
      socket.emit('newTask', { text, timestamp: Date.now() });
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addNote(text);
    input.value = '';
  });
  
  load();
}

socket.on('taskAdded', (task) => {
  showToast(`Новая задача: ${task.text}`);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('./sw.js');
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
    }

    async function subscribeToPush() {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('REPLACE_WITH_VAPID_PUBLIC_KEY'),
      });
      await fetch('http://localhost:3001/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    }

    async function unsubscribeFromPush() {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch('http://localhost:3001/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }

    enableBtn.addEventListener('click', async () => {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission !== 'granted') return;
      await subscribeToPush();
      enableBtn.style.display = 'none';
      disableBtn.style.display = 'inline-block';
    });
    disableBtn.addEventListener('click', async () => {
      await unsubscribeFromPush();
      disableBtn.style.display = 'none';
      enableBtn.style.display = 'inline-block';
    });
  });
}

loadPage();
