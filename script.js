let audioCtx;
let interval;

const STEPS = 32;

// LEFT → RIGHT playhead
let step = 0;

// ---------------- DATA ----------------
const lanes = {
  kick:  Array(STEPS).fill(0),
  snare: Array(STEPS).fill(0),
  hat:   Array(STEPS).fill(0),
  bass:  Array(STEPS).fill(null)
};

// ---------------- BPM ----------------
function bpm() {
  let v = parseInt(document.getElementById("bpm").value);
  return Math.min(220, Math.max(60, v));
}

function swingValue() {
  return parseInt(document.getElementById("swing").value) / 100;
}

// ---------------- AUDIO ----------------

function kickSound(t){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type="sine";
  osc.frequency.value=80;

  gain.gain.setValueAtTime(0.8,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t+0.25);
}

function snareSound(t){
  const buffer = audioCtx.createBuffer(1,44100,44100);
  const data = buffer.getChannelData(0);

  for(let i=0;i<data.length;i++){
    data[i]=Math.random()*2-1;
  }

  const src = audioCtx.createBufferSource();
  src.buffer=buffer;

  const gain = audioCtx.createGain();
  gain.gain.value=0.4;

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(t);
  src.stop(t+0.2);
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
  gain.gain.value=0.15;

  src.connect(gain);
  gain.connect(audioCtx.destination);

  src.start(t);
  src.stop(t+0.05);
}

function bassSound(note,t){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const map={
    D:73,
    A:110,
    G:98,
    C:130
  };

  osc.type="sine";
  osc.frequency.value=map[note]||80;

  gain.gain.setValueAtTime(0.6,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t+0.4);
}

// ---------------- ENGINE ----------------

function start(){
  if(interval) clearInterval(interval);

  audioCtx=new (window.AudioContext||window.webkitAudioContext)();

  step=0;

  interval=setInterval(()=>{

    const now=audioCtx.currentTime;

    const spb=60/bpm()/4;

    const swing = (step%2===1) ? swingValue()*0.05 : 0;

    const t=now+swing;

    if(lanes.kick[step]) kickSound(t);
    if(lanes.snare[step]) snareSound(t);
    if(lanes.hat[step]) hatSound(t);
    if(lanes.bass[step]) bassSound(lanes.bass[step],t);

    updateUI(step);

    step=(step+1)%STEPS;

  },120);
}

function stop(){
  clearInterval(interval);
}

// ---------------- GRID ----------------

function createGrid(){
  ["kick","snare","hat","bass"].forEach(l=>makeLane(l));
}

function makeLane(lane){
  const row=document.getElementById(lane+"Row");
  row.innerHTML="";

  for(let i=0;i<STEPS;i++){
    const s=document.createElement("div");
    s.className="step";

    if(lanes[lane][i]) s.classList.add("on");

    s.onclick=()=>{
      lanes[lane][i]=lanes[lane][i]?0:(lane==="bass"?"D":1);
      createGrid();
    };

    row.appendChild(s);
  }
}

// ---------------- TOOLS ----------------

function randomLane(l){
  for(let i=0;i<STEPS;i++){
    lanes[l][i]=Math.random()>0.7?1:0;
  }
  createGrid();
}

function clearLane(l){
  for(let i=0;i<STEPS;i++){
    lanes[l][i]=0;
  }
  createGrid();
}

// ---------------- PLAYHEAD UI ----------------

function updateUI(pos){
  document.querySelectorAll(".step").forEach(el=>{
    el.classList.remove("playhead");
  });

  const rows=document.querySelectorAll(".steps");

  rows.forEach(r=>{
    if(r.children[pos]){
      r.children[pos].classList.add("playhead");
    }
  });
}

// init
window.onload=createGrid;
