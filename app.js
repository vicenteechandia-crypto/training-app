// ---------- Tab navigation ----------
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    stopBreathing();
    pauseMeditation();
  });
});

// ---------- Breathing exercise ----------
const PATTERNS = {
  box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  478: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  calm: { inhale: 4, hold1: 2, exhale: 6, hold2: 0 },
  deep: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
};

const patternSelect = document.getElementById("pattern");
const circle = document.getElementById("circle");
const circleText = document.getElementById("circleText");
const cycleCountEl = document.getElementById("cycleCount");
const startBreathBtn = document.getElementById("startBreathBtn");
const stopBreathBtn = document.getElementById("stopBreathBtn");

let breathingActive = false;
let breathingTimeout = null;
let cycleCount = 0;

function setCircleState(label, scaleClass, durationSec) {
  circleText.textContent = label;
  circle.classList.remove("inhale", "exhale", "hold");
  circle.style.transitionDuration = `${durationSec}s`;
  // force reflow so the transition restarts cleanly
  void circle.offsetWidth;
  circle.classList.add(scaleClass);
}

function runBreathingStep(pattern, stepIndex) {
  if (!breathingActive) return;

  const steps = [
    { key: "inhale", label: "Breathe In", cls: "inhale" },
    { key: "hold1", label: "Hold", cls: "hold" },
    { key: "exhale", label: "Breathe Out", cls: "exhale" },
    { key: "hold2", label: "Hold", cls: "hold" },
  ];

  // Skip steps with 0 duration
  let idx = stepIndex % steps.length;
  let step = steps[idx];
  while (pattern[step.key] === 0) {
    idx = (idx + 1) % steps.length;
    step = steps[idx];
    if (idx === stepIndex % steps.length) break; // safety: avoid infinite loop
  }

  const duration = pattern[step.key];
  setCircleState(`${step.label}\n${duration}s`, step.cls, duration);

  if (idx === 0 && stepIndex !== 0) {
    cycleCount += 1;
    cycleCountEl.textContent = `Cycles: ${cycleCount}`;
  }

  breathingTimeout = setTimeout(() => {
    runBreathingStep(pattern, idx + 1);
  }, duration * 1000);
}

function startBreathing() {
  breathingActive = true;
  cycleCount = 0;
  cycleCountEl.textContent = `Cycles: ${cycleCount}`;
  startBreathBtn.disabled = true;
  stopBreathBtn.disabled = false;
  patternSelect.disabled = true;

  const pattern = PATTERNS[patternSelect.value];
  runBreathingStep(pattern, 0);
}

function stopBreathing() {
  breathingActive = false;
  if (breathingTimeout) {
    clearTimeout(breathingTimeout);
    breathingTimeout = null;
  }
  startBreathBtn.disabled = false;
  stopBreathBtn.disabled = true;
  patternSelect.disabled = false;
  circle.classList.remove("inhale", "exhale", "hold");
  circle.style.transitionDuration = "0.5s";
  circleText.textContent = "Press Start";
}

startBreathBtn.addEventListener("click", startBreathing);
stopBreathBtn.addEventListener("click", stopBreathing);

// ---------- Meditation timer ----------
const timeDisplay = document.getElementById("timeDisplay");
const durationSelect = document.getElementById("duration");
const ambientSelect = document.getElementById("ambient");
const meditationCircle = document.getElementById("meditationCircle");
const startMeditationBtn = document.getElementById("startMeditationBtn");
const pauseMeditationBtn = document.getElementById("pauseMeditationBtn");
const resetMeditationBtn = document.getElementById("resetMeditationBtn");

let remainingSeconds = parseInt(durationSelect.value, 10);
let meditationInterval = null;
let meditationRunning = false;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimeDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
}

durationSelect.addEventListener("change", () => {
  remainingSeconds = parseInt(durationSelect.value, 10);
  updateTimeDisplay();
});

function startMeditation() {
  if (meditationRunning) return;
  meditationRunning = true;
  startMeditationBtn.disabled = true;
  pauseMeditationBtn.disabled = false;
  resetMeditationBtn.disabled = false;
  durationSelect.disabled = true;
  meditationCircle.classList.add("running");
  startAmbientSound(ambientSelect.value);

  meditationInterval = setInterval(() => {
    remainingSeconds -= 1;
    updateTimeDisplay();
    if (remainingSeconds <= 0) {
      finishMeditation();
    }
  }, 1000);
}

function pauseMeditation() {
  if (!meditationRunning) return;
  meditationRunning = false;
  clearInterval(meditationInterval);
  meditationInterval = null;
  startMeditationBtn.disabled = false;
  pauseMeditationBtn.disabled = true;
  meditationCircle.classList.remove("running");
  stopAmbientSound();
}

function resetMeditation() {
  pauseMeditation();
  remainingSeconds = parseInt(durationSelect.value, 10);
  updateTimeDisplay();
  resetMeditationBtn.disabled = true;
  durationSelect.disabled = false;
}

function finishMeditation() {
  pauseMeditation();
  resetMeditationBtn.disabled = false;
  durationSelect.disabled = false;
  timeDisplay.textContent = "Done";
}

startMeditationBtn.addEventListener("click", startMeditation);
pauseMeditationBtn.addEventListener("click", pauseMeditation);
resetMeditationBtn.addEventListener("click", resetMeditation);

// ---------- Ambient sound (Web Audio API, generated) ----------
let audioCtx = null;
let ambientNodes = [];

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function createNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startAmbientSound(type) {
  if (type === "none") return;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(ctx);
  noiseSource.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  if (type === "rain") {
    filter.type = "highpass";
    filter.frequency.value = 1200;
    gain.gain.value = 0.15;
  } else if (type === "ocean") {
    filter.type = "lowpass";
    filter.frequency.value = 500;
    gain.gain.value = 0.25;

    // Slow LFO to mimic waves rising and falling
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    ambientNodes.push(lfo);
  } else if (type === "white") {
    filter.type = "allpass";
    gain.gain.value = 0.1;
  }

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noiseSource.start();

  ambientNodes.push(noiseSource, filter, gain);
}

function stopAmbientSound() {
  ambientNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      node.disconnect();
    } catch (e) {
      /* node may already be stopped */
    }
  });
  ambientNodes = [];
}

// Init
updateTimeDisplay();
