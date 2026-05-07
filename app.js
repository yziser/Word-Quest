const words = [
  { english: "socks", hebrew: "גרביים", colors: ["#7dd3fc", "#fef3c7"], kind: "socks" },
  { english: "shirt", hebrew: "חולצה", colors: ["#60a5fa", "#bfdbfe"], kind: "shirt" },
  { english: "coat", hebrew: "מעיל", colors: ["#f97316", "#fed7aa"], kind: "coat" },
  { english: "boots", hebrew: "מגפיים", colors: ["#92400e", "#fbbf24"], kind: "boots" },
  { english: "shoes", hebrew: "נעליים", colors: ["#ef4444", "#fecaca"], kind: "shoes" },
  { english: "snake", hebrew: "נחש", colors: ["#22c55e", "#bbf7d0"], kind: "snake" },
  { english: "take", hebrew: "לקחת", colors: ["#8b5cf6", "#ddd6fe"], kind: "take" },
  { english: "late", hebrew: "מאוחר", colors: ["#0f766e", "#99f6e4"], kind: "late" },
  { english: "size", hebrew: "מידה", colors: ["#ec4899", "#fbcfe8"], kind: "size" },
  { english: "write", hebrew: "לכתוב", colors: ["#3b82f6", "#dbeafe"], kind: "write" },
];

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll("[data-panel]");
const themeButtons = document.querySelectorAll(".theme-chip[data-theme]");
const scorePill = document.querySelector(".score-pill");
const starsEl = document.querySelector("#stars");
const feedback = document.querySelector("#feedback");
const celebration = document.querySelector("#celebration");

const cardArt = document.querySelector("#cardArt");
const cardHebrew = document.querySelector("#cardHebrew");
const cardEnglish = document.querySelector("#cardEnglish");
const prevCard = document.querySelector("#prevCard");
const nextCard = document.querySelector("#nextCard");
const revealCard = document.querySelector("#revealCard");

const buildArt = document.querySelector("#buildArt");
const buildHebrew = document.querySelector("#buildHebrew");
const answerSlots = document.querySelector("#answerSlots");
const letterBank = document.querySelector("#letterBank");
const clearBuild = document.querySelector("#clearBuild");
const checkBuild = document.querySelector("#checkBuild");

const quizArt = document.querySelector("#quizArt");
const quizHebrew = document.querySelector("#quizHebrew");
const quizInput = document.querySelector("#quizInput");
const hintQuiz = document.querySelector("#hintQuiz");
const checkQuiz = document.querySelector("#checkQuiz");

let stars = 0;
let cardIndex = 0;
let cardRevealed = false;
let buildIndex = 0;
let quizIndex = 0;
let selectedLetters = [];
let shuffledLetters = [];
let audioContext = null;
let celebrationTimer = null;

function displayWord(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";
}

function displayLetter(letter, position) {
  return position === 0 ? letter.toUpperCase() : letter.toLowerCase();
}

function normalizeAnswer(text) {
  return text.trim().toLowerCase();
}

function getAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

function playTone(frequency, startTime, duration, type, gainValue) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playSound(kind) {
  const context = getAudioContext();
  const now = context.currentTime;

  if (kind === "success") {
    playTone(523.25, now, 0.14, "sine", 0.12);
    playTone(659.25, now + 0.1, 0.14, "sine", 0.12);
    playTone(783.99, now + 0.2, 0.22, "triangle", 0.14);
    return;
  }

  playTone(130.81, now, 0.2, "square", 0.08);
  playTone(98, now + 0.08, 0.22, "sawtooth", 0.06);
}

function celebrate() {
  const colors = ["#ff7a7a", "#ffd166", "#58c6a4", "#63b3ed", "#a78bfa", "#f472b6"];
  celebration.innerHTML = "";
  clearTimeout(celebrationTimer);

  for (let i = 0; i < 32; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.setProperty("--x", `${12 + Math.random() * 76}%`);
    piece.style.setProperty("--y", `${8 + Math.random() * 24}%`);
    piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    piece.style.setProperty("--color", colors[i % colors.length]);
    celebration.append(piece);
  }

  for (let i = 0; i < 4; i++) {
    const burst = document.createElement("span");
    burst.className = "firework";
    burst.style.setProperty("--x", `${20 + Math.random() * 60}%`);
    burst.style.setProperty("--y", `${18 + Math.random() * 38}%`);
    burst.style.setProperty("--color", colors[(i + 2) % colors.length]);
    celebration.append(burst);
  }

  celebrationTimer = setTimeout(() => {
    celebration.innerHTML = "";
  }, 1000);
}

function svgFor(word) {
  const [main, soft] = word.colors;
  const common = `viewBox="0 0 180 180" role="img" aria-label="${word.english}"`;
  const bg = `<rect x="8" y="8" width="164" height="164" rx="30" fill="${soft}"/>`;

  const pictures = {
    socks: `${bg}<path d="M58 42h34v74c0 22-14 34-35 31-12-2-19-12-16-24l17-62z" fill="${main}"/><path d="M96 42h34v74c0 22-14 34-35 31-12-2-19-12-16-24l17-62z" fill="#fb7185"/><path d="M58 60h34M96 60h34" stroke="#fff" stroke-width="8"/>`,
    shirt: `${bg}<path d="M62 42l28 14 28-14 30 23-18 26-12-8v54H62V83l-12 8-18-26z" fill="${main}"/><path d="M78 51c5 10 19 10 24 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
    coat: `${bg}<path d="M58 46l32-12 32 12 22 33-22 14v52H58V93L36 79z" fill="${main}"/><path d="M90 41v104M73 89h-9M116 89h-9" stroke="#7c2d12" stroke-width="7" stroke-linecap="round"/>`,
    boots: `${bg}<path d="M47 39h38v76h31c12 0 22 10 22 22v8H65c-10 0-18-8-18-18z" fill="${main}"/><path d="M96 39h38v76h12c12 0 22 10 22 22v8h-54c-10 0-18-8-18-18z" fill="#78350f"/><path d="M47 66h38M96 66h38" stroke="${soft}" stroke-width="8"/>`,
    shoes: `${bg}<path d="M38 105c30-2 42-18 59-18 22 0 43 17 49 34 2 7-3 14-10 14H51c-10 0-17-8-13-30z" fill="${main}"/><path d="M53 109c25 5 52 4 83 0M86 92l18 26M103 92l18 26" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
    snake: `${bg}<path d="M51 118c31 24 90 16 91-14 1-28-44-24-54-39-7-10 6-22 29-16" fill="none" stroke="${main}" stroke-width="22" stroke-linecap="round"/><circle cx="124" cy="48" r="18" fill="${main}"/><circle cx="130" cy="43" r="3" fill="#062e16"/><path d="M138 49l17-6" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>`,
    take: `${bg}<path d="M57 62h76v84H57z" fill="${main}"/><path d="M69 62c3-23 49-23 52 0" fill="none" stroke="#4c1d95" stroke-width="10"/><path d="M79 101h33M96 84v34" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
    late: `${bg}<circle cx="90" cy="91" r="56" fill="${main}"/><circle cx="90" cy="91" r="43" fill="#fff"/><path d="M90 64v31l25 16" stroke="#134e4a" stroke-width="9" stroke-linecap="round"/><path d="M51 38l-15 18M129 38l15 18" stroke="${main}" stroke-width="10" stroke-linecap="round"/>`,
    size: `${bg}<path d="M43 119h94v24H43z" fill="${main}"/><path d="M54 119V91m18 28v-16m18 16V82m18 37v-16m18 16V91" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M54 62h72" stroke="#be185d" stroke-width="12" stroke-linecap="round"/><path d="M54 62l17-17M54 62l17 17M126 62l-17-17M126 62l-17 17" stroke="#be185d" stroke-width="8" stroke-linecap="round"/>`,
    write: `${bg}<path d="M51 137l16-40 56-56 25 25-56 56z" fill="${main}"/><path d="M123 41l10-10c5-5 13-5 18 0s5 13 0 18l-10 10z" fill="#1d4ed8"/><path d="M67 97l25 25M51 137l24-8" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  };

  return `<svg ${common}>${pictures[word.kind]}</svg>`;
}

function setMode(mode) {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== mode));
  if (mode === "cards") renderCard();
  if (mode === "build") renderBuild();
  if (mode === "quiz") renderQuiz();
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === theme);
  });
  localStorage.setItem("wordQuestTheme", theme);
}

function setFeedback(message, tone = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${tone}`.trim();
}

function addStar() {
  stars += 1;
  starsEl.textContent = stars.toString();
  scorePill.classList.remove("reward-pop");
  void scorePill.offsetWidth;
  scorePill.classList.add("reward-pop");

  const flyingStar = document.createElement("span");
  flyingStar.className = "flying-star";
  flyingStar.textContent = "★";
  scorePill.append(flyingStar);
  setTimeout(() => flyingStar.remove(), 780);
}

function renderCard() {
  const word = words[cardIndex];
  cardArt.innerHTML = svgFor(word);
  cardHebrew.textContent = word.hebrew;
  cardEnglish.textContent = cardRevealed ? displayWord(word.english) : "????";
  revealCard.textContent = cardRevealed ? "Hide Word" : "Show Word";
}

function changeCard(step) {
  cardIndex = (cardIndex + step + words.length) % words.length;
  cardRevealed = false;
  renderCard();
  setFeedback("Look at the picture and Hebrew. Can you remember the spelling?");
}

function shuffle(text) {
  const letters = text.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join("") === text ? letters.reverse() : letters;
}

function renderBuild() {
  const word = words[buildIndex];
  selectedLetters = [];
  shuffledLetters = shuffle(word.english);
  buildArt.innerHTML = svgFor(word);
  buildHebrew.textContent = word.hebrew;
  renderBuildLetters();
  setFeedback("Tap letters in order to build the English word.");
}

function renderBuildLetters() {
  const word = words[buildIndex];
  answerSlots.innerHTML = word.english
    .split("")
    .map((_, index) => `<button class="slot" type="button" data-remove="${index}">${selectedLetters[index] ? displayLetter(selectedLetters[index].letter, index) : ""}</button>`)
    .join("");

  letterBank.innerHTML = shuffledLetters
    .map(
      (letter, index) =>
        `<button class="letter" type="button" data-letter="${index}" ${selectedLetters.some((item) => item.index === index) ? "disabled" : ""}>${letter.toLowerCase()}</button>`,
    )
    .join("");
}

function checkBuildAnswer() {
  const word = words[buildIndex].english;
  const answer = normalizeAnswer(selectedLetters.map((item) => item.letter).join(""));
  if (answer === word) {
    playSound("success");
    celebrate();
    addStar();
    buildIndex = (buildIndex + 1) % words.length;
    setFeedback(`Excellent. ${displayWord(word)} is correct!`, "good");
    setTimeout(renderBuild, 850);
  } else {
    playSound("wrong");
    setFeedback("Almost. Try the letters again from the beginning.", "try");
  }
}

function renderQuiz() {
  const word = words[quizIndex];
  quizArt.innerHTML = svgFor(word);
  quizHebrew.textContent = word.hebrew;
  quizInput.value = "";
  quizInput.focus({ preventScroll: true });
  setFeedback("Type the English word. Use the picture and Hebrew to remember it.");
}

function checkQuizAnswer() {
  const word = words[quizIndex].english;
  const answer = normalizeAnswer(quizInput.value);
  if (answer === word) {
    playSound("success");
    celebrate();
    addStar();
    quizIndex = (quizIndex + 1) % words.length;
    setFeedback(`Great spelling. ${displayWord(word)}!`, "good");
    setTimeout(renderQuiz, 850);
  } else {
    playSound("wrong");
    setFeedback("Not yet. Check each letter and try again.", "try");
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

prevCard.addEventListener("click", () => changeCard(-1));
nextCard.addEventListener("click", () => changeCard(1));
revealCard.addEventListener("click", () => {
  cardRevealed = !cardRevealed;
  if (cardRevealed) addStar();
  renderCard();
  setFeedback(cardRevealed ? "Say the letters out loud, then hide it and try again." : "Hidden. Can you spell it?");
});

letterBank.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || selectedLetters.length >= words[buildIndex].english.length) return;
  const index = Number(button.dataset.letter);
  selectedLetters.push({ index, letter: shuffledLetters[index] });
  renderBuildLetters();
});

answerSlots.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const index = Number(button.dataset.remove);
  selectedLetters.splice(index, 1);
  renderBuildLetters();
});

clearBuild.addEventListener("click", () => {
  selectedLetters = [];
  renderBuildLetters();
  setFeedback("Cleared. Try building it again.");
});

checkBuild.addEventListener("click", checkBuildAnswer);

hintQuiz.addEventListener("click", () => {
  const word = words[quizIndex].english;
  quizInput.value = displayWord(word.slice(0, Math.max(1, quizInput.value.length + 1)));
  quizInput.focus({ preventScroll: true });
  setFeedback("Hint added. Finish the rest of the word.");
});

checkQuiz.addEventListener("click", checkQuizAnswer);
quizInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") checkQuizAnswer();
});

setTheme(localStorage.getItem("wordQuestTheme") || "cats");
renderCard();
renderBuild();
renderQuiz();
setMode("build");
