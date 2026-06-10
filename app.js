let data = null;
let selectedTeil = null;

async function loadData() {
  const res = await fetch('data.json');
  data = await res.json();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderTeil2(item) {
  const area = document.getElementById('cardsArea');
  area.className = 'cards-area two-col';
  area.innerHTML = `
    <div class="aufgabe-card karte-a">
      <div class="card-rolle">${item.karteA.rolle}</div>
      <p class="card-situation">${item.karteA.situation}</p>
      <div class="card-punkte-label">Ihre Aufgaben</div>
      <ul class="card-punkte">
        ${item.karteA.punkte.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
    <div class="aufgabe-card karte-b">
      <div class="card-rolle">${item.karteB.rolle}</div>
      <p class="card-situation">${item.karteB.situation}</p>
      <div class="card-punkte-label">Ihre Aufgaben</div>
      <ul class="card-punkte">
        ${item.karteB.punkte.map(p => `<li>${p}</li>`).join('')}
      </ul>
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
      <div class="card-punkte-label">Impulse</div>
      <ul class="impulse-list">
        ${item.impulse.map(i => `<li>${i}</li>`).join('')}
      </ul>
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
    const item = pickRandom(items);

    const badge = document.getElementById('resultBadge');
    badge.textContent = selectedTeil === 'teil2' ? 'Teil 2' : 'Teil 3';
    badge.className = 'result-badge ' + selectedTeil;

    document.getElementById('resultThema').textContent = item.thema;

    if (selectedTeil === 'teil2') {
      renderTeil2(item);
    } else {
      renderTeil3(item);
    }

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

loadData();
