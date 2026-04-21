let audioCtx;
let timer;
let step = 0;

const STEPS = 32;

// ---------------- PATTERNS ----------------
const kick = Array(STEPS).fill(0);
const snare = Array(STEPS).fill(0);
const hat = Array(STEPS).fill(0);
const bass = Array(STEPS).fill(null);

const scale = ["D","E","F","G","A","Bb","C"];

// ---------------- VELOCITY ----------------
const velocity = {
  kick: Array(STEPS).fill(0.8),
  snare: Array(STEPS).fill(0.8),
  hat: Array(STEPS).fill(0.6),
  bass: Array(STEPS).fill(0.7),
};

// ---------------- MIXER ----------------
const mix = {
  kick: 0.9,
  snare: 0.8,
  hat: 0.5,
  bass: 0.7
};

// ---------------- CONTROLS ----------------

function bpm() {
  return Number(document.getElementById("bpm")?.value || 90);
}

function swing() {
  return Number(document.getElementById("swing")?.value || 0) / 100;
}

function density(id) {
  return Number(document.getElementById(id)?.value || 100) / 100;
}

// ---------------- AUDIO ----------------

// KICK
function playKick(t, v) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.12);

  g.gain.setValueAtTime(v * mix.kick, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(t);
  o.stop(t + 0.12);
}

// SNARE (clean + punch)
function playSnare(t, v) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.type = "triangle";
  o.frequency.setValueAtTime(180, t);

  g.gain.setValueAtTime(v * mix.snare, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(t);
  o.stop(t + 0.1);
}

// HAT
function playHat(t, v) {
  const buffer = audioCtx.createBuffer(1, 44100, 44100);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const src = audioCtx.createBufferSource();
  const g = audioCtx.createGain();

  src.buffer = buffer;

  g.gain.setValueAtTime(v * mix.hat, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

  src.connect(g);
  g.connect(audioCtx.destination);

  src.start(t);
  src.stop(t + 0.03);
}

// BASS
function noteFreq(n) {
  return {
    "D":73,"E":82,"F":87,"G":98,"A":110,"Bb":116,"C":130
  }[n] || 73;
}

function playBass(n, t, v) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.frequency.value = noteFreq(n);

  g.gain.setValueAtTime(v * mix.bass, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(t);
  o.stop(t + 0.2);
}

// ---------------- ENGINE ----------------

function start() {
  if (timer) clearTimeout(timer);

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  step = 0;

  loop();
}

function loop() {
  const bpmVal = bpm();
  const sw = swing();

  const stepTime = (60 / bpmVal) / 4;

  const now = audioCtx.currentTime;

  const off = step % 2 === 1;
  const swingOffset = off ? stepTime * sw : 0;

  const t = now + swingOffset;

  // DENSITY (ALL CHANNELS RESTORED)
  if (kick[step] && Math.random() < density("kickDensity"))
    playKick(t, velocity.kick[step]);

  if (snare[step] && Math.random() < density("snareDensity"))
    playSnare(t, velocity.snare[step]);

  if (hat[step] && Math.random() < density("hatDensity"))
    playHat(t, velocity.hat[step]);

  if (bass[step] && Math.random() < density("bassDensity"))
    playBass(bass[step], t, velocity.bass[step]);

  highlight();

  step = (step + 1) % STEPS;

  timer = setTimeout(loop, stepTime * 1000);
}

function stop() {
  clearTimeout(timer);
}

// ---------------- MIXER ----------------

function setMix(id, val) {
  mix[id] = val / 100;
}

// ---------------- RANDOM ----------------

function randomize(arr, vel) {
  for (let i = 0; i < STEPS; i++) {
    arr[i] = Math.random() > 0.7 ? 1 : 0;
    vel[i] = Math.random() * 0.7 + 0.3;
  }
  createGrid();
}

function randomBass() {
  for (let i = 0; i < STEPS; i++) {
    bass[i] = Math.random() < 0.3
      ? scale[Math.floor(Math.random() * scale.length)]
      : null;

    velocity.bass[i] = Math.random() * 0.7 + 0.3;
  }
  createBassGrid();
}

// ---------------- GRID ----------------

function createGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < STEPS; i++) {
    const c = document.createElement("div");
    c.style.display = "inline-block";
    c.style.margin = "2px";

    const k = document.createElement("button");
    const s = document.createElement("button");
    const h = document.createElement("button");

    k.innerText = kick[i] ? "●" : "○";
    s.innerText = snare[i] ? "●" : "○";
    h.innerText = hat[i] ? "●" : "○";

    k.onclick = () => { kick[i] ^= 1; createGrid(); };
    s.onclick = () => { snare[i] ^= 1; createGrid(); };
    h.onclick = () => { hat[i] ^= 1; createGrid(); };

    c.appendChild(k);
    c.appendChild(s);
    c.appendChild(h);

    grid.appendChild(c);
  }
}

function createBassGrid() {
  const grid = document.getElementById("bassGrid");
  grid.innerHTML = "";

  for (let i = 0; i < STEPS; i++) {
    const b = document.createElement("button");

    b.innerText = bass[i] || ".";

    b.onclick = () => {
      bass[i] = bass[i] ? null : "D";
      createBassGrid();
    };

    grid.appendChild(b);
  }
}

// ---------------- VISUAL PLAYHEAD ----------------

function highlight() {
  const g = document.getElementById("grid")?.children;
  const b = document.getElementById("bassGrid")?.children;

  if (g) {
    for (let i = 0; i < g.length; i++) {
      g[i].style.opacity = (i === step) ? "1" : "0.35";
    }
  }

  if (b) {
    for (let i = 0; i < b.length; i++) {
      b[i].style.opacity = (i === step) ? "1" : "0.35";
    }
  }
}

// INIT
createGrid();
createBassGrid();
