let audioCtx;
let interval;

const STEPS = 32;

// direction: RIGHT → LEFT
let step = STEPS - 1;

// 🎚️ DATA
const lanes = {
  kick:  Array(STEPS).fill(0),
  snare: Array(STEPS).fill(0),
  hat:   Array(STEPS).fill(0),
  bass:  Array(STEPS).fill(null)
};

// ---------------- AUDIO ----------------

function playKick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(90, time);

  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.25);
}

function playSnare(time) {
  const buffer = audioCtx.createBuffer(1, 44100, 44100);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.4;

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(time);
  src.stop(time + 0.2);
}

function playHat(time) {
  const buffer = audioCtx.createBuffer(1, 44100, 44100);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 0.5;
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.15;

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(time);
  src.stop(time + 0.05);
}

function playBass(note, time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const freqMap = {
    D: 73,
    A: 110,
    G: 98,
    C: 130
  };

  osc.type = "sine";
  osc.frequency.value = freqMap[note] || 80;

  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + 0.4);
}

// ---------------- BPM ----------------

function bpm() {
  return parseInt(document.getElementById("bpm").value);
}

function swingValue() {
  return parseInt(document.getElementById("swing").value) / 100;
}

// ---------------- ENGINE ----------------

function start() {
  if (interval) clearInterval(interval);

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  step = STEPS - 1;

  interval = setInterval(() => {
    const now = audioCtx.currentTime;

    const stepTime = (60 / bpm()) / 4;

    const isOff = step % 2 === 1;
    const swing = isOff ? swingValue() * 0.05 : 0;

    const t = now + swing;

    // PLAY
    if (lanes.kick[step]) playKick(t);
    if (lanes.snare[step]) playSnare(t);
    if (lanes.hat[step]) playHat(t);
    if (lanes.bass[step]) playBass(lanes.bass[step], t);

    updateUI(step);

    step = (step - 1 + STEPS) % STEPS;

  }, 120);
}

function stop() {
  clearInterval(interval);
}

// ---------------- UI ----------------

function createGrid() {
  createLane("kickRow", "kick");
  createLane("snareRow", "snare");
  createLane("hatRow", "hat");
  createLane("bassRow", "bass");
}

function createLane(id, lane) {
  const row = document.getElementById(id);
  row.innerHTML = "";

  for (let i = 0; i < STEPS; i++) {
    const cell = document.createElement("div");
    cell.className = "step";

    if (lanes[lane][i]) cell.classList.add("on");

    cell.onclick = () => {
      lanes[lane][i] = lanes[lane][i] ? 0 : (lane === "bass" ? "D" : 1);
      createGrid();
    };

    row.appendChild(cell);
  }
}

function updateUI(playhead) {
  document.querySelectorAll(".step").forEach(el => {
    el.classList.remove("playhead");
  });

  const rows = ["kickRow", "snareRow", "hatRow", "bassRow"];

  rows.forEach(id => {
    const row = document.getElementById(id);
    if (!row) return;

    const cells = row.children;
    if (cells[playhead]) {
      cells[playhead].classList.add("playhead");
    }
  });
}

// init
window.onload = createGrid;
