let data = null;
let redemittel = [];
let selectedTeil = null;
let generateCount = parseInt(localStorage.getItem('generateCount') || '8', 10);
let countTeil2 = parseInt(localStorage.getItem('countTeil2') || '0', 10);
let countTeil3 = parseInt(localStorage.getItem('countTeil3') || '0', 10);

const VOTE_URL = 'https://script.google.com/macros/s/AKfycbzDGkjwO5b1qdRo45B3W3RocivBKXIlJt6Yz4MJHWhZgm0F6LhZ4Gh-tluFxXwvGy6z/exec';
const VOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function voteKey(teil, id) { return `vote-${teil}-${id}`; }

function hasVotedRecently(teil, id) {
  const ts = parseInt(localStorage.getItem(voteKey(teil, id)) || '0', 10);
  return Date.now() - ts < VOTE_COOLDOWN_MS;
}

function renderVoteRow(teil, id) {
  if (hasVotedRecently(teil, id)) {
    return `<div class="vote-row"><span class="vote-thanks">Danke für dein Feedback!</span></div>`;
  }
  return `
    <div class="vote-row" data-teil="${teil}" data-id="${id}">
      <span class="vote-label">War diese Aufgabe gut?</span>
      <button class="vote-btn vote-up" data-vote="up" aria-label="Daumen hoch">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z"/></svg>
      </button>
      <button class="vote-btn vote-down" data-vote="down" aria-label="Daumen runter">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4H6.55c-.7 0-1.36.37-1.72.97L2.17 11.12z"/></svg>
      </button>
    </div>
  `;
}

function submitVote(teil, id, vote, row) {
  if (hasVotedRecently(teil, id)) return;
  localStorage.setItem(voteKey(teil, id), Date.now());
  row.innerHTML = '<span class="vote-thanks">Danke für dein Feedback!</span>';

  fetch(VOTE_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ teil, aufgabeId: id, vote })
  }).catch(() => {});
}


function updateStatsDisplay() {
  document.getElementById('statTotal').textContent = generateCount;
  if (data) {
    document.getElementById('statTeil2Count').textContent = data.teil2.length;
    document.getElementById('statTeil3Count').textContent = data.teil3.length;
  }
}

async function loadData() {
  const res = await fetch('data.json');
  data = await res.json();
}

async function loadRedemittel() {
  const res = await fetch('redemittel.json');
  redemittel = await res.json();
  showRandomRedemittel();
}

function showRandomRedemittel() {
  if (!redemittel.length) return;
  const item = redemittel[Math.floor(Math.random() * redemittel.length)];
  document.getElementById('redemittelText').textContent = item.text;
  document.getElementById('redemittelTag').textContent = item.kategorie;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwo(arr) {
  const copy = [...arr];
  const first = copy.splice(Math.floor(Math.random() * copy.length), 1)[0];
  const second = copy[Math.floor(Math.random() * copy.length)];
  return [first, second];
}

function renderTeil2(items) {
  const [a, b] = pickTwo(items);
  const area = document.getElementById('cardsArea');
  area.className = 'cards-area two-col';
  area.innerHTML = `
    <div class="aufgabe-card karte-a">
      <div class="t2-number">1</div>
      <p class="t2-text">${a.text}</p>
      <span class="serial-number">#${a.id}</span>
      ${renderVoteRow('teil2', a.id)}
    </div>
    <div class="aufgabe-card karte-b">
      <div class="t2-number">2</div>
      <p class="t2-text">${b.text}</p>
      <span class="serial-number">#${b.id}</span>
      ${renderVoteRow('teil2', b.id)}
    </div>
  `;
}

function renderTeil3(item) {
  const area = document.getElementById('cardsArea');
  area.className = 'cards-area';
  area.innerHTML = `
    <div class="aufgabe-card teil3-card">
      <div class="card-rolle">Situation</div>
      <p class="card-situation">${item.situation}</p>
      <div class="aufgabe-label">Aufgabe</div>
      <p class="aufgabe-text">${item.aufgabe}</p>
      <div class="card-punkte-label">Diese Stichpunkte helfen Ihnen:</div>
      <ul class="stichpunkte-list">
        ${item.stichpunkte.map(s => `
          <li>
            <span class="stich-thema">${s.thema}:</span>
            <span class="stich-fragen">${s.fragen}</span>
          </li>
        `).join('')}
        <li class="stich-offen">…?</li>
      </ul>
      <span class="serial-number">#${item.id}</span>
      ${renderVoteRow('teil3', item.id)}
    </div>
  `;
}

function generate() {
  if (!data || !selectedTeil) return;

  const result = document.getElementById('result');
  const loading = document.getElementById('loading');

  result.classList.add('hidden');
  document.getElementById('redemittel').classList.add('hidden');
  loading.classList.remove('hidden');
  loading.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    const items = data[selectedTeil];

    const badge = document.getElementById('resultBadge');
    badge.textContent = selectedTeil === 'teil2' ? 'Teil 2' : 'Teil 3';
    badge.className = 'result-badge ' + selectedTeil;

    if (selectedTeil === 'teil2') {
      document.getElementById('resultThema').textContent = '';
      renderTeil2(items);
    } else {
      const item = pickRandom(items);
      document.getElementById('resultThema').textContent = '';
      renderTeil3(item);
    }

    generateCount++;
    localStorage.setItem('generateCount', generateCount);
    if (selectedTeil === 'teil2') { countTeil2++; localStorage.setItem('countTeil2', countTeil2); }
    else { countTeil3++; localStorage.setItem('countTeil3', countTeil3); }
    localStorage.setItem('lastPracticed', new Date().toISOString());

    loading.classList.add('hidden');
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1000);
}

document.querySelectorAll('.teil-card').forEach(card => {
  card.addEventListener('click', () => {
    if (card.dataset.teil === selectedTeil) return;
    document.querySelectorAll('.teil-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedTeil = card.dataset.teil;
    document.getElementById('generateBtn').disabled = false;
    document.getElementById('result').classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('redemittel').classList.remove('hidden');
  });
});


document.getElementById('generateBtn').addEventListener('click', generate);

document.getElementById('cardsArea').addEventListener('click', (e) => {
  const btn = e.target.closest('.vote-btn');
  if (!btn) return;
  const row = btn.closest('.vote-row');
  if (!row || !row.dataset.teil) return;
  submitVote(row.dataset.teil, parseInt(row.dataset.id, 10), btn.dataset.vote, row);
});

// Info panel
const infoBtn = document.getElementById('infoBtn');
const infoPanel = document.getElementById('infoPanel');

function closePanel() {
  infoPanel.classList.remove('open');
  setTimeout(() => infoPanel.classList.add('hidden'), 300);
}
function openPanel() {
  infoPanel.classList.remove('hidden');
  requestAnimationFrame(() => infoPanel.classList.add('open'));
  updateStatsDisplay();
}

infoBtn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(); });
document.getElementById('infoPanelClose').addEventListener('click', closePanel);
infoPanel.addEventListener('click', (e) => { if (e.target === infoPanel) closePanel(); });

// Feedback
document.getElementById('feedbackSubmit').addEventListener('click', () => {
  const text = document.getElementById('feedbackText').value.trim();
  if (!text) return;
  const url = 'https://github.com/roieshalom/B2-mundliche/issues/new?title='
    + encodeURIComponent('Aufgaben-Vorschlag')
    + '&body=' + encodeURIComponent(text)
    + '&labels=vorschlag';
  window.open(url, '_blank');
  document.getElementById('feedbackText').value = '';
  infoPanel.classList.add('hidden');
});

loadData();
loadRedemittel();
