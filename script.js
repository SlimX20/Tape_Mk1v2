let audioCtx;
let interval;

const STEPS = 32;
let step = 0;

// ---------------- STATE ----------------
const lanes = {
  kick:  Array(STEPS).fill(0),
  snare: Array(STEPS).fill(0),
  hat:   Array(STEPS).fill(0),
  bass:  Array(STEPS).fill(null)
};

// 🎚️ MIXER (0–1)
const volume = {
  kick: 0.8,
  snare:0.8,
  hat:  0.8,
  bass: 0.8
};

// 🎛️ DENSITY (0–1)
const density = {
  kick: 1,
  snare:1,
  hat:  1,
  bass: 1
};

// ---------------- BPM / SWING ----------------
function bpm(){
  return Math.min(220, Math.max(60, parseInt(document.getElementById("bpm").value)));
}

function swingValue(){
  return parseInt(document.getElementById("swing").value) / 100;
}

// ---------------- AUDIO ----------------

function kickSound(t){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type="sine";
  osc.frequency.setValueAtTime(90,t);

  gain.gain.setValueAtTime(volume.kick,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t+0.25);
}

function snareSound(t){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type="triangle";
  osc.frequency.setValueAtTime(200,t);
  osc.frequency.exponentialRampToValueAtTime(140,t+0.08);

  gain.gain.setValueAtTime(volume.snare,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t+0.2);
}

function hatSound(t){
  const buffer = audioCtx.createBuffer(1,44100,44100);
  const data = buffer.getChannelData(0);

  for(let i=0;i<data.length;i++){
    data[i]=Math.random()*0.4;
  }

  const src = audioCtx.createBufferSource();
  src.buffer=buffer;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume.hat,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.05);

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(t);
  src.stop(t+0.05);
}

function bassSound(note,t){
  if(!note) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const map = { D:73, A:110, G:98, C:130 };

  osc.type="sine";
  osc.frequency.value=map[note]||80;

  gain.gain.setValueAtTime(volume.bass,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.35);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t+0.4);
}

// ---------------- ENGINE ----------------

function shouldPlay(lane){
  return Math.random() < density[lane];
}

function start(){
  if(interval) clearInterval(interval);

  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  step = 0;

  interval = setInterval(()=>{

    const now = audioCtx.currentTime;
    const swing = (step%2===1) ? swingValue()*0.05 : 0;
    const t = now + swing;

    if(lanes.kick[step] && shouldPlay("kick")) kickSound(t);
    if(lanes.snare[step] && shouldPlay("snare")) snareSound(t);
    if(lanes.hat[step] && shouldPlay("hat")) hatSound(t);
    if(lanes.bass[step] && shouldPlay("bass")) bassSound(lanes.bass[step],t);

    updateUI(step);
    step = (step+1)%STEPS;

  },120);
}

function stop(){
  clearInterval(interval);
}

// ---------------- GRID ----------------

function createGrid(){
  ["kick","snare","hat","bass"].forEach(makeLane);
}

function makeLane(lane){
  const row=document.getElementById(lane+"Row");
  row.innerHTML="";

  for(let i=0;i<STEPS;i++){
    const cell=document.createElement("div");
    cell.className="step";

    if(lanes[lane][i]) cell.classList.add("on");

    cell.onclick=()=>{
      lanes[lane][i]=lanes[lane][i]?0:(lane==="bass"?"D":1);
      createGrid();
    };

    row.appendChild(cell);
  }
}

// ---------------- TOOLS ----------------

function randomLane(lane){
  for(let i=0;i<STEPS;i++){
    lanes[lane][i]=Math.random()>0.7?(lane==="bass"?"D":1):0;
  }
  createGrid();
}

function clearLane(lane){
  for(let i=0;i<STEPS;i++){
    lanes[lane][i]=0;
  }
  createGrid();
}

// ---------------- EUCLIDEAN BASS ----------------

function euclid(steps, fills){
  let pattern = Array(steps).fill(0);
  let bucket = 0;

  for(let i=0;i<steps;i++){
    bucket += fills;
    if(bucket >= steps){
      bucket -= steps;
      pattern[i] = 1;
    }
  }
  return pattern;
}

function generateBass(){
  const fills = Math.floor(Math.random()*8)+4; // 4–12 hits
  const pattern = euclid(STEPS,fills);
  const notes = ["D","A","G","C"];

  for(let i=0;i<STEPS;i++){
    lanes.bass[i] = pattern[i] ? notes[Math.floor(Math.random()*notes.length)] : null;
  }

  createGrid();
}

// ---------------- MIXER UI ----------------

function setVolume(lane,val){
  volume[lane] = val/100;
}

function setDensity(lane,val){
  density[lane] = val/100;
}

// ---------------- PLAYHEAD ----------------

function updateUI(pos){
  document.querySelectorAll(".step").forEach(el=>{
    el.classList.remove("playhead");
  });

  document.querySelectorAll(".steps").forEach(row=>{
    if(row.children[pos]){
      row.children[pos].classList.add("playhead");
    }
  });
}

// INIT
window.onload=createGrid;
