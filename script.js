let participants = [];
let winners = [];
let isSpinning = false;
let currentRotation = 0;

// Elementos
const newParticipantInput = document.getElementById('newParticipant');
const addBtn = document.getElementById('addBtn');
const toggleListBtn = document.getElementById('toggleList');
const miniList = document.getElementById('miniList');
const fullList = document.getElementById('fullList');
const spinBtn = document.getElementById('spinBtn');
const roulette = document.getElementById('roulette');
const winnerDisplay = document.getElementById('winnerDisplay');
const winnersList = document.getElementById('winnersList');

// Sonidos
const spinSound = document.getElementById('spinSound');
const stopSound = document.getElementById('stopSound');
const winSound = document.getElementById('winSound');

// Agregar participante
addBtn.addEventListener('click', addParticipant);
newParticipantInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addParticipant();
});

function addParticipant() {
  const name = newParticipantInput.value.trim();
  if (!name) return;
  if (participants.includes(name) || winners.includes(name)) {
    alert('Ese participante ya está en la lista.');
    return;
  }
  participants.push(name);
  newParticipantInput.value = '';
  renderLists();
  buildRoulette();
  updateProbabilidad();
}

// Renderizar listas
function renderLists() {
  // Participantes
  const listHTML = participants.length
    ? `<ul>${participants.map((p, i) =>
        `<li>
          ${p}
          <button class="remove-btn" data-index="${i}">×</button>
        </li>`
      ).join('')}</ul>`
    : '<p>No hay participantes</p>';

  miniList.innerHTML = listHTML;
  fullList.innerHTML = listHTML;

  // Ganadores
  winnersList.innerHTML = winners.length
    ? `<h3>Ganadores</h3><ul>${winners.map(w => `<li>${w}</li>`).join('')}</ul>`
    : '<h3>Ganadores</h3><p>Aún no hay ganadores</p>';

  // Botones eliminar
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      participants.splice(index, 1);
      renderLists();
      buildRoulette();
      updateProbabilidad();
    });
  });
}

// Alternar lista mini
toggleListBtn.addEventListener('click', () => {
  miniList.classList.toggle('show');
});

// Construir ruleta (centrado y orientado)
function buildRoulette() {
  // Fondo de segmentos con conic-gradient
  if (participants.length === 0) {
    roulette.style.background = '#181818';
    roulette.innerHTML = `<div class="roulette-center">
      <img src="foto.png" alt="Taurus" />
    </div>`;
    return;
  }

  // Tamaño adaptable
  const baseSize = roulette.offsetWidth || 500;
  // 1. Fondo de segmentos con conic-gradient
  const colors = ['var(--gold-light)', 'var(--black)'];
  const segmentAngle = 360 / participants.length;
  let bg = [];
  for (let i = 0; i < participants.length; i++) {
    const color = colors[i % 2];
    bg.push(`${color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`);
  }
  roulette.style.background = `conic-gradient(${bg.join(', ')})`;

  // El centro de la ruleta (imagen o texto)
  let center = document.querySelector('.roulette-center');
  if (!center) {
    center = document.createElement('div');
    center.className = 'roulette-center';
    const img = document.createElement('img');
    img.src = "foto.png";
    img.alt = "Taurus";
    center.appendChild(img);
    roulette.appendChild(center);
  }

  // Elimina labels anteriores
  document.querySelectorAll('.roulette-label').forEach(e => e.remove());

  // 2. Posicionar nombres en círculo
  const radius = baseSize * (participants.length > 40 ? 0.38 : 0.43);
  for (let i = 0; i < participants.length; i++) {
    const angleDeg = i * segmentAngle + segmentAngle / 2 - 90;
    const angleRad = angleDeg * Math.PI / 180;
    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;

    const label = document.createElement('div');
    label.className = 'roulette-label';
    label.textContent = participants[i];
    label.style.left = `calc(50% + ${x}px)`;
    label.style.top = `calc(50% + ${y}px)`;
    label.style.transform = `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`;

    // Tamaño de fuente adaptativo
    let fontSize = Math.max(8, baseSize / 18 - participants.length * 0.13);
    label.style.fontSize = `${fontSize}px`;

    roulette.appendChild(label);
  }
}

// Mostrar probabilidad
function updateProbabilidad() {
  const probDiv = document.getElementById('probabilidad');
  if (participants.length === 0) {
    probDiv.textContent = '';
    return;
  }
  const prob = (100 / participants.length).toFixed(2);
  probDiv.textContent = `Probabilidad de ganar: ${prob}% por participante`;
}

// Girar ruleta con aceleración y desaceleración
spinBtn.addEventListener('click', spinRoulette);

function spinRoulette() {
  if (participants.length < 2) {
    alert('¡Necesitas al menos 2 participantes para girar!');
    return;
  }
  if (isSpinning) return;

  isSpinning = true;
  spinBtn.disabled = true;
  winnerDisplay.textContent = '¡Girando...!';

  document.querySelectorAll('.roulette-label.winner').forEach(el => el.classList.remove('winner'));

  spinSound.currentTime = 0;
  spinSound.play();

  const segmentAngle = 360 / participants.length;
  const winnerIndex = Math.floor(Math.random() * participants.length);

  // Flecha arriba: 0°
  const winnerAngle = 0 - (winnerIndex * segmentAngle + segmentAngle / 2);

  const extraSpins = 6 + Math.floor(Math.random() * 3);
  const finalRotation = extraSpins * 360 + winnerAngle;

  let start = null;
  let duration = Math.max(2200, 5000 - participants.length * 20);
  let initialRotation = currentRotation % 360;
  let change = finalRotation - initialRotation;
  if (change < 0) change += 360 * (extraSpins + 1);

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateSpin(ts) {
    if (!start) start = ts;
    let elapsed = ts - start;
    let progress = Math.min(elapsed / duration, 1);
    let eased = easeOutCubic(progress);
    let angle = initialRotation + change * eased;
    roulette.style.transform = `rotate(${angle}deg)`;

    // Mantener el centro estático
    const center = document.querySelector('.roulette-center');
    if (center) {
      center.style.transform = `translate(-50%, -50%) rotate(${-angle}deg)`;
    }

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      currentRotation = angle;

      const labels = document.querySelectorAll('.roulette-label');
      labels.forEach(l => l.classList.remove('winner'));
      labels[winnerIndex].classList.add('winner');

      stopSound.currentTime = 0;
      stopSound.play();
      setTimeout(() => {
        winSound.currentTime = 0;
        winSound.play();
      }, 300);

      const winner = participants[winnerIndex];
      winnerDisplay.innerHTML = `<span class="winner-anim">🎉 ¡GANADOR: ${winner}! 🎉</span>`;
      createConfetti();

      // Mueve al ganador a la lista de ganadores y lo elimina de participantes
      winners.push(winner);
      participants.splice(winnerIndex, 1);
      renderLists();
      buildRoulette();
      updateProbabilidad();

      isSpinning = false;
      spinBtn.disabled = false;
      document.querySelector('.arrow').classList.remove('spinning');
    }
  }

  document.querySelector('.arrow').classList.add('spinning');
  requestAnimationFrame(animateSpin);
}

// Confeti (simple)
function createConfetti() {
  const confetti = document.getElementById('confetti');
  confetti.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = Math.random() * 100 + 'vw';
    div.style.top = Math.random() * 100 + 'vh';
    div.style.width = '10px';
    div.style.height = '10px';
    div.style.background = `hsl(${Math.random()*60+40},90%,60%)`; // tonos dorados
    div.style.opacity = 0.8;
    div.style.borderRadius = '50%';
    div.style.pointerEvents = 'none';
    div.style.zIndex = 1001;
    div.style.animation = `confetti-fall 1.5s linear ${Math.random()}s 1`;
    confetti.appendChild(div);
  }
  setTimeout(() => { confetti.innerHTML = ''; }, 1800);
}

// Confeti animación CSS
const style = document.createElement('style');
style.innerHTML = `
@keyframes confetti-fall {
  0% { transform: translateY(-100px) scale(1);}
  100% { transform: translateY(100vh) scale(0.7);}
}`;
document.head.appendChild(style);

// Inicial
renderLists();
buildRoulette();
updateProbabilidad();

// Responsive: reconstruir ruleta al redimensionar
window.addEventListener('resize', () => {
  buildRoulette();
});