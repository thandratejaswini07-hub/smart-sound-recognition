const MODEL_URL = new URL("./model/", window.location.href).href;

const LOG_THRESHOLD = 0.75;

let recognizer = null;
let labels = [];
let listening = false;
let lastLogged = null;

const toggleBtn = document.getElementById("toggleBtn");
const statusEl = document.getElementById("status");
const barsEl = document.getElementById("bars");
const logEl = document.getElementById("log");
const orbEl = document.getElementById("orb");
const iconEl = document.getElementById("icon");
const nameEl = document.getElementById("name");
const confEl = document.getElementById("conf");

function describe(label) {
  const n = label.toLowerCase();
  if (n.includes("clap"))    return { kind: "clap",    icon: "", color: "var(--clap)" };
  if (n.includes("whistl"))  return { kind: "whistle", icon: "", color: "var(--whistle)" };
  if (n.includes("noise") || n.includes("background"))
                             return { kind: "noise",   icon: "", color: "var(--noise)" };
  return { kind: "other", icon: "", color: "var(--other)" };
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function loadModel() {
  setStatus("Loading model...");
  recognizer = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    MODEL_URL + "model.json",
    MODEL_URL + "metadata.json"
  );
  await recognizer.ensureModelLoaded();
  labels = recognizer.wordLabels();
  buildBars();
}

function buildBars() {
  barsEl.innerHTML = "";
  labels.forEach((label) => {
    const d = describe(label);
    const row = document.createElement("div");
    row.className = "bar";
    row.style.setProperty("--c", d.color);
    row.innerHTML = `
      <div class="bar-head"><span>${d.icon} ${label}</span><span class="pct">0%</span></div>
      <div class="track"><div class="fill"></div></div>`;
    barsEl.appendChild(row);
  });
}

function addLog(label, score) {
  const d = describe(label);
  const empty = logEl.querySelector(".empty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.style.setProperty("--c", d.color);
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  li.innerHTML = `
    <span class="dot"></span>
    <span class="what">${d.icon} ${label} <span class="when">${Math.round(score * 100)}%</span></span>
    <span class="when">${time}</span>`;
  logEl.prepend(li);
  while (logEl.children.length > 6) logEl.lastChild.remove();
}

function updateUI(scores) {
  let best = 0;
  scores.forEach((s, i) => { if (s > scores[best]) best = i; });

  
  scores.forEach((s, i) => {
    const row = barsEl.children[i];
    const pct = Math.round(s * 100);
    row.querySelector(".fill").style.width = pct + "%";
    row.querySelector(".pct").textContent = pct + "%";
    row.classList.toggle("top", i === best);
  });

  
  const label = labels[best];
  const d = describe(label);
  const isQuietClass = d.kind === "noise";
  orbEl.dataset.kind = d.kind;
  orbEl.classList.remove("idle");
  orbEl.classList.add("active");
  orbEl.style.setProperty("--level", isQuietClass ? 0.15 : scores[best]);
  iconEl.textContent = d.icon;
  nameEl.textContent = label;
  confEl.textContent = Math.round(scores[best] * 100) + "% sure";


  if (scores[best] >= LOG_THRESHOLD && label !== lastLogged) {
    addLog(label, scores[best]);
    lastLogged = label;
  }
}

function resetOrb() {
  orbEl.classList.remove("active");
  orbEl.classList.add("idle");
  orbEl.dataset.kind = "noise";
  orbEl.style.setProperty("--level", 0);
  iconEl.textContent = "🎙️";
  nameEl.textContent = "Paused";
  confEl.textContent = "Press start to listen";
}

async function start() {
  toggleBtn.disabled = true;
  try {
    if (!recognizer) await loadModel();
    await recognizer.listen(
      (result) => updateUI(Array.from(result.scores)),
      {
        includeSpectrogram: false,
        probabilityThreshold: 0,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5,
      }
    );
    listening = true;
    toggleBtn.textContent = "Stop listening";
    toggleBtn.classList.add("live");
    setStatus("Listening. Make a sound!");
  } catch (err) {
    console.error(err);
    setStatus(
      "Could not start: " + err.message +
      ". Check that the model files are in the model folder and that the microphone is allowed.",
      true
    );
  } finally {
    toggleBtn.disabled = false;
  }
}

function stop() {
  if (recognizer && recognizer.isListening()) recognizer.stopListening();
  listening = false;
  lastLogged = null;
  toggleBtn.textContent = "Start listening";
  toggleBtn.classList.remove("live");
  setStatus("Stopped.");
  resetOrb();
}

toggleBtn.addEventListener("click", () => (listening ? stop() : start()));