let audioCtx;
let interval;
let step = 0;

const STEPS = 32;

// arrays
const kick = Array(STEPS).fill(0);
const snare = Array(STEPS).fill(0);
const hat = Array(STEPS).fill(0);
const bass = Array(STEPS).fill(null);

const scale = ["D","E","F","G","A","Bb","C"];

// ---------- AUDIO ----------

function playTone(freq, time, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + duration);
}

function noise(time, length, volume) {
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

function noteToFreq(note) {
  const map = {
    "D": 73, "E": 82, "F": 87,
    "G": 98, "A": 110, "Bb": 116, "C": 130
  };
  return map[note] || 73;
}

// ---------- START ----------

function start() {
  if (interval) clearInterval(interval);

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  step = 0;

  interval = setInterval(loop, 10);
}

// ---------- LOOP ----------

function loop() {
  const bpm = document.getElementById("bpm").value;
  const swingVal = document.getElementById("swing").value / 100;
  const intervalTime = (60 / bpm) / 4;

  const now = audioCtx.currentTime;

  const isOff = step % 2 === 1;
  const swingOffset = isOff ? intervalTime * swingVal : 0;

  const t = now + swingOffset;

  if (kick[step]) playTone(60, t, 0.15);
  if (snare[step]) noise(t, 0.2, 0.4);
  if (hat[step]) noise(t, 0.05, 0.1);

  if (bass[step]) {
    playTone(noteToFreq(bass[step]), t, 0.2);
  }

  highlightStep();

  step = (step + 1) % STEPS;

  clearInterval(interval);
  interval = setInterval(loop, intervalTime * 1000);
}

function stop() {
  clearInterval(interval);
}

// ---------- GRID ----------

function createGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < STEPS; i++) {
    const col = document.createElement("div");

    const k = document.createElement("button");
    const s = document.createElement("button");
    const h = document.createElement("button");

    k.innerText = kick[i] ? "K1" : "K";
    s.innerText = snare[i] ? "S1" : "S";
    h.innerText = hat[i] ? "H1" : "H";

    k.onclick = () => { kick[i] ^= 1; createGrid(); };
    s.onclick = () => { snare[i] ^= 1; createGrid(); };
    h.onclick = () => { hat[i] ^= 1; createGrid(); };

    col.appendChild(k);
    col.appendChild(s);
    col.appendChild(h);

    grid.appendChild(col);
  }
}

// ---------- BASS ----------

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

function randomBass() {
  const density = document.getElementById("bassDensity").value;

  for (let i = 0; i < STEPS; i++) {
    bass[i] = Math.random() < 1/density
      ? scale[Math.floor(Math.random()*scale.length)]
      : null;
  }

  createBassGrid();
}

// ---------- RANDOM ----------

function randomize(arr) {
  for (let i = 0; i < STEPS; i++) {
    arr[i] = Math.random() > 0.7 ? 1 : 0;
  }
  createGrid();
}

// ---------- VISUAL ----------

function highlightStep() {
  const grid = document.getElementById("grid").children;

  for (let i = 0; i < grid.length; i++) {
    grid[i].style.opacity = (i === step) ? "1" : "0.4";
  }
}

// ---------- INIT ----------

createGrid();
createBassGrid();
