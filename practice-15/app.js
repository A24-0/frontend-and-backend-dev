const contentEl = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

function setActive(btn) {
  [homeBtn, aboutBtn].forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

function bindNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const list = document.getElementById('notes-list');
  const load = () => {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = notes.map((n) => `<li>${n}</li>`).join('');
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    input.value = '';
    load();
  });
  load();
}

async function loadPage(page) {
  const response = await fetch(`./content/${page}.html`);
  contentEl.innerHTML = await response.text();
  if (page === 'home') bindNotes();
}

homeBtn.addEventListener('click', () => { setActive(homeBtn); loadPage('home'); });
aboutBtn.addEventListener('click', () => { setActive(aboutBtn); loadPage('about'); });
loadPage('home');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.error(err));
}
