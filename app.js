let data = null;
let selectedTeil = null;
let generateCount = parseInt(localStorage.getItem('generateCount') || '0', 10);
let countTeil2 = parseInt(localStorage.getItem('countTeil2') || '0', 10);
let countTeil3 = parseInt(localStorage.getItem('countTeil3') || '0', 10);

function calcStreak() {
  const days = JSON.parse(localStorage.getItem('practiceDays') || '[]');
  if (!days.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...new Set(days)].sort().reverse();
  let streak = 0;
  let expected = today;
  for (const d of sorted) {
    if (d === expected) {
      streak++;
      const dt = new Date(expected);
      dt.setDate(dt.getDate() - 1);
      expected = dt.toISOString().slice(0, 10);
    } else break;
  }
  return streak;
}

function recordToday() {
  const today = new Date().toISOString().slice(0, 10);
  const days = JSON.parse(localStorage.getItem('practiceDays') || '[]');
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem('practiceDays', JSON.stringify(days));
  }
}

function updateStatsDisplay() {
  document.getElementById('statTotal').textContent = generateCount;
  document.getElementById('statTeil2').textContent = countTeil2;
  document.getElementById('statTeil3').textContent = countTeil3;
  document.getElementById('statStreak').textContent = calcStreak();
  const last = localStorage.getItem('lastPracticed');
  document.getElementById('statLast').textContent = last
    ? 'Zuletzt geübt: ' + new Date(last).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
}

async function loadData() {
  const res = await fetch('data.json');
  data = await res.json();
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
    </div>
    <div class="aufgabe-card karte-b">
      <div class="t2-number">2</div>
      <p class="t2-text">${b.text}</p>
      <span class="serial-number">#${b.id}</span>
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
    </div>
  `;
}

function generate() {
  if (!data || !selectedTeil) return;

  const result = document.getElementById('result');
  const loading = document.getElementById('loading');

  result.classList.add('hidden');
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
    recordToday();

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
  });
});

document.getElementById('generateBtn').addEventListener('click', generate);

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
