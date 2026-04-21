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

// ---------------- CONTROLS ----------------

function bpm() {
  return Number(document.getElementById("bpm")?.value || 90);
}

function swing() {
  return Number(document.getElementById("swing")?.value || 0) / 100;
}

function dens(id) {
  return Number(document.getElementById(id)?.value || 100) / 100;
}

// ---------------- AUDIO CORE ----------------

// KICK (punch)
function playKick(t) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.12);

  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(t);
  o.stop(t + 0.12);
}

// SNARE (CLEAN + punch, inte brus)
function playSnare(t) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.type = "triangle";
  o.frequency.setValueAtTime(180, t);

  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(t);
  o.stop(t + 0.10);
}

// HAT (tight noise)
function playHat(t) {
  const buffer = audioCtx.createBuffer(1, 44100, 44100);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const src = audioCtx.createBufferSource();
  const g = audioCtx.createGain();

  src.buffer = buffer;

  g.gain.setValueAtTime(0.08, t);
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

function playBass(n, t) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.frequency.value = noteFreq(n);

  g.gain.setValueAtTime(0.25, t);
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
  const bpm = bpm();
  const sw = swing();

  const stepTime = (60 / bpm) / 4;

  const now = audioCtx.currentTime;

  const off = step % 2 === 1;
  const swingOffset = off ? stepTime * sw : 0;

  const t = now + swingOffset;

  // DENSITY
  if (kick[step] && Math.random() < dens("kickDensity")) playKick(t);
  if (snare[step] && Math.random() < dens("snareDensity")) playSnare(t);
  if (hat[step] && Math.random() < dens("hatDensity")) playHat(t);

  if (bass[step] && Math.random() < dens("bassDensity")) {
    playBass(bass[step], t);
  }

  highlight();

  step = (step + 1) % STEPS;

  timer = setTimeout(loop, stepTime * 1000);
}

function stop() {
  clearTimeout(timer);
}

// ---------------- RANDOM ----------------

function randomize(arr) {
  for (let i = 0; i < STEPS; i++) {
    arr[i] = Math.random() > 0.7 ? 1 : 0;
  }
  createGrid();
}

function randomBass() {
  for (let i = 0; i < STEPS; i++) {
    bass[i] = Math.random() < 0.3
      ? scale[Math.floor(Math.random() * scale.length)]
      : null;
  }
  createBassGrid();
}

// ---------------- GRID ----------------

function createGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;

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
  if (!grid) return;

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

// ---------------- VISUAL ----------------

function highlight() {
  const g = document.getElementById("grid")?.children;
  const b = document.getElementById("bassGrid")?.children;

  if (g) {
    for (let i = 0; i < g.length; i++) {
      g[i].style.opacity = (i === step) ? "1" : "0.4";
    }
  }

  if (b) {
    for (let i = 0; i < b.length; i++) {
      b[i].style.opacity = (i === step) ? "1" : "0.4";
    }
  }
}

// ---------------- INIT ----------------

createGrid();
createBassGrid();
