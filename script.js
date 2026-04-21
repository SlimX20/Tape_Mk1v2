let audioCtx;
let interval;
let step = 0;

const STEPS = 32;

// DATA
const kick = Array(STEPS).fill(0);
const snare = Array(STEPS).fill(0);
const hat = Array(STEPS).fill(0);
const bass = Array(STEPS).fill(null);

const scale = ["D","E","F","G","A","Bb","C"];

// ---------- AUDIO (FIXAD) ----------

// KICK (riktig punch istället för svag sinus)
function playKick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);

  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.15);
}

// SNARE (noise + body)
function playSnare(time) {
  playNoise(time, 0.2, 0.3);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = 200;

  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.1);
}

// HIHAT (kort noise)
function playHat(time) {
  playNoise(time, 0.03, 0.1);
}

// NOISE ENGINE
function playNoise(time, length, volume) {
  const buffer = audioCtx.createBuffer(1, 44100, 44100);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  src.buffer = buffer;
  gain.gain.value = volume;

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(time);
  src.stop(time + length);
}

// BASS
function noteToFreq(note) {
  const map = {
    "D": 73, "E": 82, "F": 87,
    "G": 98, "A": 110, "Bb": 116, "C": 130
  };
  return map[note] || 73;
}

function playBass(note, time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = noteToFreq(note);

  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.25);
}

// ---------- START ----------

function start() {
  if (interval) clearInterval(interval);

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  step = 0;

  loop();
}

// ---------- LOOP (STABIL) ----------

function loop() {
  const bpm = document.getElementById("bpm").value;
  const swing = document.getElementById("swing").value / 100;

  const stepTime = (60 / bpm) / 4;

  const now = audioCtx.currentTime;

  const isOff = step % 2 === 1;
  const swingOffset = isOff ? stepTime * swing : 0;

  const t = now + swingOffset;

  if (kick[step]) playKick(t);
  if (snare[step]) playSnare(t);
  if (hat[step]) playHat(t);
  if (bass[step]) playBass(bass[step], t);

  highlightStep();

  step = (step + 1) % STEPS;

  interval = setTimeout(loop, stepTime * 1000);
}

function stop() {
  clearTimeout(interval);
}

// ---------- GRID ----------

function createGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < STEPS; i++) {
    const col = document.createElement("div");

    col.style.display = "inline-block";
    col.style.margin = "2px";

    const k = document.createElement("button");
    const s = document.createElement("button");
    const h = document.createElement("button");

    k.innerText = kick[i] ? "●" : "○";
    s.innerText = snare[i] ? "●" : "○";
    h.innerText = hat[i] ? "●" : "○";

    k.onclick = () => { kick[i] ^= 1; createGrid(); };
    s.onclick = () => { snare[i] ^= 1; createGrid(); };
    h.onclick = () => { hat[i] ^= 1; createGrid(); };

    col.appendChild(k);
    col.appendChild(s);
    col.appendChild(h);

    grid.appendChild(col);
  }
}

// ---------- BASS GRID ----------

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

// ---------- CLEAR KNAPPAR ----------

function clearTrack(arr) {
  for (let i = 0; i < STEPS; i++) arr[i] = arr[i] === null ? null : 0;
  createGrid();
  createBassGrid();
}

// ---------- HIGHLIGHT ----------

function highlightStep() {
  const grid = document.getElementById("grid").children;

  for (let i = 0; i < grid.length; i++) {
    grid[i].style.background = (i === step) ? "#222" : "transparent";
  }

  const bassGrid = document.getElementById("bassGrid").children;

  for (let i = 0; i < bassGrid.length; i++) {
    bassGrid[i].style.background = (i === step) ? "#222" : "transparent";
  }
}

// ---------- INIT ----------

createGrid();
createBassGrid();
