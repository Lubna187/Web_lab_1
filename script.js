const X_VALUES = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const R_VALUES = [1, 1.5, 2, 2.5, 3];
const STORAGE_KEY = 'lab1_results_22716';

let selectedR = null;
let results = [];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const errorBox = document.getElementById('error');

/* ---------- построение элементов формы ---------- */
const xGroup = document.getElementById('xGroup');
X_VALUES.forEach(v => {
  const label = document.createElement('label');
  label.innerHTML = '<input type="radio" name="x" value="' + v + '">' + v;
  xGroup.appendChild(label);
});

const rGroup = document.getElementById('rGroup');
R_VALUES.forEach(v => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rbtn';
  b.textContent = v;
  b.addEventListener('click', () => {
    selectedR = v;
    document.querySelectorAll('.rbtn').forEach(el => el.classList.remove('active'));
    b.classList.add('active');
    draw();
  });
  rGroup.appendChild(b);
});

/* ---------- проверка попадания ---------- */
function isHit(x, y, r) {
  // прямоугольник (II четверть)
  if (x >= -r && x <= 0 && y >= 0 && y <= r / 2) return true;
  // четверть круга (I четверть)
  if (x >= 0 && y >= 0 && x * x + y * y <= (r / 2) * (r / 2)) return true;
  // треугольник (III четверть)
  if (x <= 0 && y <= 0 && x >= -r / 2 && y >= -r / 2 && x + y >= -r / 2) return true;
  return false;
}

/* ---------- рисование ---------- */
function draw() {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const rUnit = 120;                     // R в пикселях
  const r = selectedR || 2;              // масштаб, если R ещё не выбран
  const k = rUnit / r;                   // пикселей на единицу
  const half = rUnit / 2;

  ctx.clearRect(0, 0, W, H);

  // область
  ctx.fillStyle = '#4f94f7';
  ctx.fillRect(cx - rUnit, cy - half, rUnit, half);       // прямоугольник
  ctx.beginPath();                                         // четверть круга
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - half);
  ctx.arc(cx, cy, half, -Math.PI / 2, 0, false);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();                                         // треугольник
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - half, cy);
  ctx.lineTo(cx, cy + half);
  ctx.closePath();
  ctx.fill();

  // оси
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, cy); ctx.lineTo(W - 10, cy);
  ctx.moveTo(cx, H - 10); ctx.lineTo(cx, 10);
  ctx.stroke();
  ctx.beginPath();                                         // стрелки
  ctx.moveTo(W - 10, cy); ctx.lineTo(W - 16, cy - 4); ctx.lineTo(W - 16, cy + 4);
  ctx.moveTo(cx, 10); ctx.lineTo(cx - 4, 16); ctx.lineTo(cx + 4, 16);
  ctx.fill();

  // деления и подписи
  ctx.font = '12px Arial';
  const rText = selectedR ? String(selectedR) : 'R';
  const halfText = selectedR ? String(selectedR / 2) : 'R/2';
  const ticks = [
    [-rUnit, '-' + rText], [-half, '-' + halfText], [half, halfText], [rUnit, rText]
  ];
  ticks.forEach(([d, t]) => {
    ctx.beginPath();
    ctx.moveTo(cx + d, cy - 3); ctx.lineTo(cx + d, cy + 3);
    ctx.moveTo(cx - 3, cy - d); ctx.lineTo(cx + 3, cy - d);
    ctx.stroke();
    ctx.fillText(t, cx + d - 8, cy + 16);
    ctx.fillText(t, cx + 7, cy - d + 4);
  });
  ctx.fillText('x', W - 14, cy - 8);
  ctx.fillText('y', cx + 8, 14);

  // точки, проверенные ранее с текущим R
  if (selectedR) {
    results.filter(p => p.r === selectedR).forEach(p => {
      ctx.fillStyle = p.hit ? '#1e8449' : '#c0392b';
      ctx.beginPath();
      ctx.arc(cx + p.x * k, cy - p.y * k, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

/* ---------- таблица и LocalStorage ---------- */
function addRow(p) {
  const tr = document.createElement('tr');
  const time = new Date(p.time).toLocaleString('ru-RU');   // часовой пояс клиента, русская локаль
  tr.innerHTML =
    '<td>' + p.x + '</td><td>' + p.y + '</td><td>' + p.r + '</td>' +
    '<td class="' + (p.hit ? 'hit' : 'miss') + '">' + (p.hit ? 'Попадание' : 'Промах') + '</td>' +
    '<td>' + time + '</td>';
  document.getElementById('resultsBody').prepend(tr);
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) results = saved;
  } catch (e) { results = []; }
  results.forEach(addRow);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

/* ---------- валидация и отправка ---------- */
function showError(msg) { errorBox.textContent = msg; }

document.getElementById('submit').addEventListener('click', () => {
  showError('');

  const xRadio = document.querySelector('input[name="x"]:checked');
  if (!xRadio) return showError('Выберите значение X.');

  const yRaw = document.getElementById('y').value.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(yRaw)) return showError('Y должен быть числом.');
  const y = Number(yRaw);
  if (y < -3 || y > 3) return showError('Y должен быть в диапазоне от -3 до 3.');

  if (selectedR === null) return showError('Выберите значение R.');

  const x = Number(xRadio.value);
  const p = { x: x, y: y, r: selectedR, hit: isHit(x, y, selectedR), time: Date.now() };
  results.push(p);
  save();
  addRow(p);
  draw();
});

load();
draw();
