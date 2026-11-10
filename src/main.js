import { UI_TEXT } from './data.js';
import { generatePuzzleSet } from './crossword.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE = 'crossmind-v1';
const ROUND_SIZE = 100;

let language = localStorage.getItem(`${STORAGE}-language`) || 'fa';
let round = null;
let puzzle = null;
let activeCell = null;
let activeWord = null;
let activeDirection = 'across';
let answers = {};
let seconds = 0;
let timerInterval = null;
let timerStarted = false;
let hintsUsed = 0;
let wrongChecks = 0;
let soundEnabled = false;
let toastTimeout = null;
let solved = false;

const text = () => UI_TEXT[language];
const dir = () => (language === 'fa' ? 'rtl' : 'ltr');
const keyOf = (x, y) => `${y},${x}`;
const answerKey = (puzzleId) => `${STORAGE}-answers-${language}-${puzzleId}`;
const roundKey = () => `${STORAGE}-round-${language}`;
const historyKey = () => `${STORAGE}-history-${language}`;
const bestKey = () => `${STORAGE}-best-${language}`;
const randomChoice = (items) => items[Math.floor(Math.random() * items.length)];

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveRound() {
  if (!round) return;
  localStorage.setItem(roundKey(), JSON.stringify(round));
}

function makeRound() {
  const history = safeRead(historyKey(), []);
  const puzzles = generatePuzzleSet(language, ROUND_SIZE, history);
  const fingerprints = puzzles.map((item) => item.fingerprint);
  localStorage.setItem(historyKey(), JSON.stringify([...new Set([...history, ...fingerprints])].slice(-1000)));
  round = { puzzles, used: [], activeFingerprint: null };
  saveRound();
}

function loadRound() {
  const saved = safeRead(roundKey(), null);
  if (saved && Array.isArray(saved.puzzles) && saved.puzzles.length >= ROUND_SIZE) {
    round = saved;
  } else {
    makeRound();
  }
  const active = round.puzzles.find((item) => item.fingerprint === round.activeFingerprint && !round.used.includes(item.fingerprint));
  puzzle = active || pickAvailable(null);
  if (!puzzle) {
    makeRound();
    puzzle = pickAvailable(null);
  }
  round.activeFingerprint = puzzle.fingerprint;
  saveRound();
}

function filteredPuzzles() {
  if (!round) return [];
  const difficulty = $('#difficultySelect').value;
  const topic = $('#topicSelect').value;
  return round.puzzles.filter((item) => {
    if (round.used.includes(item.fingerprint)) return false;
    if (difficulty !== 'all' && item.difficulty !== difficulty) return false;
    if (topic !== 'all' && !item.words.some((word) => {
      const bankId = word.id.split('-').slice(1).join('-');
      return word.topic === topic || bankId === topic;
    })) return false;
    return true;
  });
}

function pickAvailable(excludeFingerprint) {
  let choices = filteredPuzzles().filter((item) => item.fingerprint !== excludeFingerprint);
  if (!choices.length) choices = round.puzzles.filter((item) => !round.used.includes(item.fingerprint) && item.fingerprint !== excludeFingerprint);
  return choices.length ? randomChoice(choices) : null;
}

function setLanguage(nextLanguage) {
  if (nextLanguage === language) return;
  stopTimer();
  language = nextLanguage;
  localStorage.setItem(`${STORAGE}-language`, language);
  loadRound();
  resetPuzzleState();
  applyTranslations();
  renderPuzzle();
}

function applyTranslations() {
  const t = text();
  document.documentElement.lang = language;
  document.documentElement.dir = dir();
  $('#brandName').textContent = t.brand;
  $('#brandEyebrow').textContent = t.eyebrow;
  $('#heroEyebrow').textContent = t.eyebrow;
  $('#heroTitle').innerHTML = language === 'fa' ? 'هر خانه یک حرف؛<br /><em>هر تقاطع یک کشف.</em>' : 'One cell, one letter.<br /><em>Every crossing, a discovery.</em>';
  $('#heroSubtitle').textContent = language === 'fa' ? 'راهنماها را بخوان، حروف را کنار هم بگذار و جدول را کامل کن.' : 'Read the clues, place the letters and complete the crossword.';
  $('#heroRandom').textContent = language === 'fa' ? 'تولید تصادفی' : 'Randomly generated';
  $('#heroUnique').textContent = language === 'fa' ? '۱۰۰ جدول غیرتکراری' : '100 unique puzzles';
  $('#heroBilingual').textContent = language === 'fa' ? 'فارسی و انگلیسی' : 'Persian & English';
  $('#difficultyLabel').textContent = t.level;
  $('#topicLabel').textContent = t.topic;
  setSelectOptions('#difficultySelect', [
    ['all', language === 'fa' ? 'همه اندازه‌ها' : 'All sizes'],
    ['small', t.small], ['medium', t.medium], ['large', t.large]
  ]);
  setSelectOptions('#topicSelect', [
    ['all', t.allTopics], ['technology', t.technology], ['science', t.science], ['nature', t.nature], ['animals', t.animals], ['culture', t.culture], ['objects', t.objects]
  ]);
  $('#newPuzzleText').textContent = t.newPuzzle;
  $('#timeLabel').textContent = t.time;
  $('#progressLabel').textContent = t.progress;
  $('#scoreLabel').textContent = t.score;
  $('#bestLabel').textContent = t.best;
  $('#boardKicker').textContent = language === 'fa' ? 'جدول کلمات' : 'THE PUZZLE';
  $('#boardTitle').textContent = language === 'fa' ? 'جدول پیش رو' : 'Your crossword';
  $('#clearText').textContent = t.clear;
  $('#legendActive').textContent = language === 'fa' ? 'خانه فعال' : 'Active cell';
  $('#legendFilled').textContent = language === 'fa' ? 'حرف واردشده' : 'Filled cell';
  $('#legendEmpty').textContent = language === 'fa' ? 'خانه خالی' : 'Empty cell';
  $('#keyboardTip').textContent = t.keyboard;
  $('#clueKicker').textContent = language === 'fa' ? 'راهنمای واژه‌ها' : 'WORD CLUES';
  $('#clueTitle').textContent = t.clues;
  $('#acrossTab').textContent = t.across;
  $('#downTab').textContent = t.down;
  $('#activeClueLabel').textContent = language === 'fa' ? 'راهنمای انتخاب‌شده' : 'Selected clue';
  $('#activeClueText').textContent = t.selectClue;
  $('#actionTitle').textContent = language === 'fa' ? 'قدم‌به‌قدم جدول را کامل کن' : 'Complete the grid one step at a time';
  $('#actionSubtitle').textContent = language === 'fa' ? 'برای هر خانه فقط یک حرف وارد کن.' : 'Enter one letter in each cell.';
  $('#hintText').textContent = t.hint;
  $('#checkText').textContent = t.check;
  $('#revealText').textContent = t.reveal;
  $('#footerText').textContent = t.footer;
  $('#completionTitle').textContent = t.completed;
  $('#nextFromBannerText').textContent = language === 'fa' ? 'جدول بعدی' : 'Next puzzle';
  $$('.lang-btn').forEach((button) => button.classList.toggle('active', button.dataset.lang === language));
  $('#soundToggle').title = `${t.sound}: ${soundEnabled ? t.soundOn : t.soundOff}`;
}

function setSelectOptions(selector, options) {
  const element = $(selector);
  const previous = element.value || 'all';
  element.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  element.value = options.some(([value]) => value === previous) ? previous : 'all';
}

function resetPuzzleState() {
  answers = safeRead(answerKey(puzzle?.id), {});
  activeCell = null;
  activeWord = null;
  activeDirection = 'across';
  seconds = 0;
  hintsUsed = 0;
  wrongChecks = 0;
  timerStarted = false;
  solved = false;
  stopTimer();
  $('#completionBanner').hidden = true;
  updateTimerDisplay();
}

function saveAnswers() {
  if (puzzle) localStorage.setItem(answerKey(puzzle.id), JSON.stringify(answers));
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = (value % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function updateTimerDisplay() { $('#timerValue').textContent = formatTime(seconds); }
function startTimer() {
  if (timerStarted || solved) return;
  timerStarted = true;
  timerInterval = window.setInterval(() => {
    seconds += 1;
    updateTimerDisplay();
  }, 1000);
}
function stopTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
}

function renderPuzzle() {
  if (!puzzle) return;
  answers = safeRead(answerKey(puzzle.id), {});
  activeCell = null;
  activeWord = puzzle.words.find((word) => word.direction === activeDirection) || puzzle.words[0];
  activeDirection = activeWord.direction;
  seconds = 0;
  hintsUsed = 0;
  wrongChecks = 0;
  timerStarted = false;
  solved = false;
  stopTimer();
  $('#completionBanner').hidden = true;
  $('#boardTitle').textContent = language === 'fa' ? `جدول ${puzzle.difficulty === 'small' ? 'کوچک' : puzzle.difficulty === 'medium' ? 'متوسط' : 'بزرگ'}` : `${puzzle.difficulty[0].toUpperCase()}${puzzle.difficulty.slice(1)} crossword`;
  $('#gridSize').textContent = `${puzzle.width} × ${puzzle.height}`;
  $('#crosswordGrid').style.setProperty('--columns', puzzle.width);
  $('#crosswordGrid').style.gridTemplateColumns = `repeat(${puzzle.width}, var(--cell-size))`;
  $('#crosswordGrid').innerHTML = '';

  puzzle.grid.forEach((row, y) => row.forEach((cell, x) => {
    const wrapper = document.createElement('div');
    wrapper.className = `grid-cell${cell ? ' open' : ''}`;
    if (cell) {
      wrapper.dataset.x = x;
      wrapper.dataset.y = y;
      if (cell.number) {
        const number = document.createElement('span');
        number.className = 'cell-number';
        number.textContent = cell.number;
        wrapper.append(number);
      }
      const input = document.createElement('input');
      input.className = 'cell-input';
      input.type = 'text';
      input.autocomplete = 'off';
      input.autocapitalize = 'characters';
      input.spellcheck = false;
      input.maxLength = 2;
      input.inputMode = 'text';
      input.value = answers[keyOf(x, y)] || '';
      input.dataset.x = x;
      input.dataset.y = y;
      input.setAttribute('aria-label', `${language === 'fa' ? 'خانه' : 'Cell'} ${cell.number || ''}`);
      let wasActiveBeforePointer = false;
      input.addEventListener('pointerdown', () => {
        wasActiveBeforePointer = Boolean(activeCell && activeCell.x === x && activeCell.y === y);
      });
      input.addEventListener('focus', () => selectCell(x, y, false, false));
      input.addEventListener('click', () => {
        selectCell(x, y, wasActiveBeforePointer, false);
        wasActiveBeforePointer = false;
      });
      input.addEventListener('input', (event) => handleInput(event, x, y));
      input.addEventListener('keydown', (event) => handleCellKeydown(event, x, y));
      wrapper.append(input);
    }
    $('#crosswordGrid').append(wrapper);
  }));

  updatePuzzleCounter();
  updateStats();
  renderClues();
  updateCellHighlights();
  $('#bestValue').textContent = localStorage.getItem(bestKey()) || text().empty;
}

function updatePuzzleCounter() {
  const index = round.used.length + 1;
  const total = round?.puzzles.length || ROUND_SIZE;
  $('#batchCounter').textContent = language === 'fa' ? `جدول ${Math.min(index, total)} از ${total.toLocaleString('fa-IR')}` : `Puzzle ${Math.min(index, total)} of ${total}`;
}

function cellAt(x, y) {
  if (!puzzle || y < 0 || x < 0 || y >= puzzle.height || x >= puzzle.width) return null;
  return puzzle.grid[y][x];
}

function selectCell(x, y, toggle = false, focus = true) {
  const cell = cellAt(x, y);
  if (!cell) return;
  const choices = [cell.across, cell.down].filter(Boolean);
  if (!choices.length) return;
  let wordId = activeWord && choices.includes(activeWord.id) ? activeWord.id : null;
  if (toggle && choices.length === 2) {
    const other = choices.find((id) => id !== wordId);
    wordId = other || choices.find((id) => puzzle.words.find((word) => word.id === id)?.direction !== activeDirection);
  }
  if (!wordId) wordId = choices.find((id) => puzzle.words.find((word) => word.id === id)?.direction === activeDirection) || choices[0];
  activeWord = puzzle.words.find((word) => word.id === wordId);
  activeDirection = activeWord.direction;
  activeCell = { x, y };
  renderClues();
  updateCellHighlights();
  updateTabState();
  if (focus) getInput(x, y)?.focus();
}

function getInput(x, y) { return $(`#crosswordGrid input[data-x="${x}"][data-y="${y}"]`); }

function updateCellHighlights() {
  const activeCells = new Set((activeWord?.cells || []).map((cell) => keyOf(cell.x, cell.y)));
  $$('#crosswordGrid .grid-cell.open').forEach((element) => {
    const x = Number(element.dataset.x);
    const y = Number(element.dataset.y);
    const key = keyOf(x, y);
    element.classList.toggle('active-word', activeCells.has(key));
    element.classList.toggle('active-cell', activeCell?.x === x && activeCell?.y === y);
    element.classList.remove('correct', 'wrong');
    if (answers[key]) {
      const solution = cellAt(x, y)?.solution;
      if (solved || (solution && answers[key] === solution)) element.classList.add('correct');
    }
  });
}

function updateTabState() {
  $$('.clue-tab').forEach((button) => button.classList.toggle('active', button.dataset.dir === activeDirection));
}

function isWordCorrect(word) {
  return word.cells.every((cell, index) => answers[keyOf(cell.x, cell.y)] === word.answer[index]);
}

function renderClues() {
  if (!puzzle) return;
  const words = puzzle.words.filter((word) => word.direction === activeDirection).sort((a, b) => a.number - b.number);
  $('#clueList').innerHTML = '';
  words.forEach((word) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clue-item';
    if (activeWord?.id === word.id) button.classList.add('active');
    if (isWordCorrect(word)) button.classList.add('done');
    const number = document.createElement('span');
    number.className = 'clue-number';
    const numberText = document.createElement('span');
    numberText.textContent = word.number;
    number.append(numberText);
    const copy = document.createElement('span');
    copy.className = 'clue-copy';
    copy.textContent = word.clue;
    button.append(number, copy);
    button.addEventListener('click', () => {
      activeWord = word;
      activeDirection = word.direction;
      const target = word.cells.find((cell) => !answers[keyOf(cell.x, cell.y)]) || word.cells[0];
      activeCell = { x: target.x, y: target.y };
      renderClues();
      updateCellHighlights();
      updateTabState();
      getInput(target.x, target.y)?.focus();
    });
    $('#clueList').append(button);
  });
  $('#clueCount').textContent = language === 'fa' ? `${puzzle.words.length} واژه` : `${puzzle.words.length} words`;
  $('#acrossCount').textContent = puzzle.words.filter((word) => word.direction === 'across').length;
  $('#downCount').textContent = puzzle.words.filter((word) => word.direction === 'down').length;
  $('#activeClueText').textContent = activeWord?.clue || text().selectClue;
  updateTabState();
}

function updateStats() {
  if (!puzzle) return;
  let totalCells = 0;
  let filled = 0;
  puzzle.grid.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return;
    totalCells += 1;
    if (answers[keyOf(x, y)]) filled += 1;
  }));
  const percent = totalCells ? Math.round((filled / totalCells) * 100) : 0;
  $('#progressValue').textContent = `${percent.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}%`;
  $('#scoreValue').textContent = Math.max(0, 100 - (hintsUsed * 5) - (wrongChecks * 3)).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US');
}

function handleInput(event, x, y) {
  if (solved) return;
  const input = event.target;
  const chars = Array.from(input.value.trim());
  let value = chars.length ? chars[chars.length - 1] : '';
  if (language === 'en') value = value.toUpperCase();
  input.value = value;
  if (value) startTimer();
  if (value) answers[keyOf(x, y)] = value;
  else delete answers[keyOf(x, y)];
  saveAnswers();
  updateStats();
  renderClues();
  updateCellHighlights();
  if (value) playSound(640);
  if (activeWord) {
    const index = activeWord.cells.findIndex((cell) => cell.x === x && cell.y === y);
    const next = index >= 0 ? activeWord.cells[index + 1] : null;
    if (next) {
      activeCell = { x: next.x, y: next.y };
      getInput(next.x, next.y)?.focus();
    }
  }
  if (Object.keys(answers).length >= puzzle.totalCells && allCellsCorrect()) finishPuzzle();
}

function handleCellKeydown(event, x, y) {
  const moves = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
  };
  if (moves[event.key]) {
    event.preventDefault();
    const [dx, dy] = moves[event.key];
    const next = { x: x + dx, y: y + dy };
    if (cellAt(next.x, next.y)) selectCell(next.x, next.y, false, true);
  } else if (event.key === 'Backspace' && !event.target.value) {
    event.preventDefault();
    const index = activeWord?.cells.findIndex((cell) => cell.x === x && cell.y === y) ?? -1;
    const previous = activeWord?.cells[index - 1];
    if (previous) getInput(previous.x, previous.y)?.focus();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    checkAnswers();
  }
}

function allCellsCorrect() {
  return puzzle.grid.every((row, y) => row.every((cell, x) => !cell || answers[keyOf(x, y)] === cell.solution));
}

function checkAnswers() {
  if (solved) return;
  startTimer();
  let wrong = 0;
  let missing = 0;
  $$('#crosswordGrid .grid-cell.open').forEach((element) => {
    const x = Number(element.dataset.x);
    const y = Number(element.dataset.y);
    const value = answers[keyOf(x, y)];
    const solution = cellAt(x, y).solution;
    element.classList.remove('wrong', 'correct');
    if (!value) missing += 1;
    else if (value !== solution) { element.classList.add('wrong'); wrong += 1; }
    else element.classList.add('correct');
  });
  if (!wrong && !missing) {
    finishPuzzle();
  } else {
    wrongChecks += 1;
    updateStats();
    showToast(language === 'fa' ? `${wrong} خانه نادرست · ${missing} خانه خالی` : `${wrong} incorrect · ${missing} empty cells`);
    playSound(230);
  }
}

function finishPuzzle() {
  if (solved) return;
  solved = true;
  stopTimer();
  updateStats();
  updateCellHighlights();
  const best = Number(localStorage.getItem(bestKey()) || 0);
  if (!best || seconds < best) localStorage.setItem(bestKey(), formatTime(seconds));
  $('#bestValue').textContent = localStorage.getItem(bestKey());
  $('#completionMessage').textContent = language === 'fa' ? `زمان: ${formatTime(seconds)} · امتیاز: ${Math.max(0, 100 - hintsUsed * 5 - wrongChecks * 3)}` : `Time: ${formatTime(seconds)} · Score: ${Math.max(0, 100 - hintsUsed * 5 - wrongChecks * 3)}`;
  $('#completionBanner').hidden = false;
  showToast(text().completed);
  playSound(880);
}

function revealAnswers() {
  if (solved) return;
  const message = language === 'fa' ? 'همه پاسخ‌ها نمایش داده شوند؟' : 'Reveal every answer?';
  if (!window.confirm(message)) return;
  puzzle.grid.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return;
    answers[keyOf(x, y)] = cell.solution;
    const input = getInput(x, y);
    if (input) input.value = cell.solution;
  }));
  saveAnswers();
  solved = true;
  stopTimer();
  updateStats();
  renderClues();
  updateCellHighlights();
  showToast(text().revealed);
}

function giveHint() {
  if (solved) return;
  const targetWord = activeWord || puzzle.words[0];
  let target = targetWord.cells.find((cell) => !answers[keyOf(cell.x, cell.y)]);
  if (!target) target = puzzle.grid.flatMap((row, y) => row.map((cell, x) => cell ? { x, y } : null)).filter(Boolean).find((cell) => !answers[keyOf(cell.x, cell.y)]);
  if (!target) { showToast(text().noHint); return; }
  const cell = cellAt(target.x, target.y);
  answers[keyOf(target.x, target.y)] = cell.solution;
  const input = getInput(target.x, target.y);
  if (input) input.value = cell.solution;
  hintsUsed += 1;
  startTimer();
  activeCell = target;
  saveAnswers();
  updateStats();
  renderClues();
  updateCellHighlights();
  input?.focus();
  showToast(text().hintUsed);
  if (allCellsCorrect()) finishPuzzle();
}

function clearAnswers() {
  if (!puzzle) return;
  answers = {};
  hintsUsed = 0;
  wrongChecks = 0;
  $$('#crosswordGrid input').forEach((input) => { input.value = ''; });
  saveAnswers();
  updateStats();
  renderClues();
  updateCellHighlights();
  $('#completionBanner').hidden = true;
  solved = false;
  seconds = 0;
  timerStarted = false;
  stopTimer();
  updateTimerDisplay();
}

function nextPuzzle() {
  if (!round || !puzzle) return;
  if (!round.used.includes(puzzle.fingerprint)) round.used.push(puzzle.fingerprint);
  const next = pickAvailable(puzzle.fingerprint);
  if (next) {
    puzzle = next;
  } else if (round.used.length >= round.puzzles.length) {
    makeRound();
    puzzle = pickAvailable(null);
    showToast(language === 'fa' ? 'دور تازه‌ای با ۱۰۰ جدول جدید ساخته شد.' : 'A new round of 100 fresh puzzles is ready.');
  } else {
    const remaining = round.puzzles.filter((item) => !round.used.includes(item.fingerprint));
    if (remaining.length) {
      puzzle = randomChoice(remaining);
      showToast(language === 'fa' ? 'برای این فیلتر جدول دیگری نیست؛ یک جدول از اندازه‌های دیگر انتخاب شد.' : 'No more puzzles match this filter. A puzzle of another size was selected.');
    } else {
      makeRound();
      puzzle = pickAvailable(null);
    }
  }
  round.activeFingerprint = puzzle.fingerprint;
  saveRound();
  resetPuzzleState();
  renderPuzzle();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 2300);
}

function playSound(frequency = 540) {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .12);
    oscillator.onended = () => context.close();
  } catch {
    // Audio is optional; the game remains fully playable if Web Audio is unavailable.
  }
}

function onFilterChange() {
  if (!round) return;
  const choices = filteredPuzzles();
  if (!choices.length) {
    showToast(language === 'fa' ? 'در این دور جدولی با این فیلتر باقی نمانده است.' : 'No unused puzzle matches these filters in this round.');
    return;
  }
  if (!choices.some((item) => item.fingerprint === puzzle.fingerprint)) {
    puzzle = randomChoice(choices);
    round.activeFingerprint = puzzle.fingerprint;
    saveRound();
    resetPuzzleState();
    renderPuzzle();
  }
}

function bindEvents() {
  $$('.lang-btn').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  $$('.clue-tab').forEach((button) => button.addEventListener('click', () => {
    const direction = button.dataset.dir;
    activeDirection = direction;
    activeWord = puzzle.words.find((word) => word.direction === direction) || activeWord;
    if (activeWord) activeCell = activeWord.cells.find((cell) => !answers[keyOf(cell.x, cell.y)]) || activeWord.cells[0];
    renderClues();
    updateCellHighlights();
    getInput(activeCell?.x, activeCell?.y)?.focus();
  }));
  $('#newPuzzleBtn').addEventListener('click', nextPuzzle);
  $('#nextFromBanner').addEventListener('click', nextPuzzle);
  $('#hintBtn').addEventListener('click', giveHint);
  $('#checkBtn').addEventListener('click', checkAnswers);
  $('#revealBtn').addEventListener('click', revealAnswers);
  $('#clearBtn').addEventListener('click', clearAnswers);
  $('#difficultySelect').addEventListener('change', onFilterChange);
  $('#topicSelect').addEventListener('change', onFilterChange);
  $('#soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('#soundToggle').classList.toggle('sound-active', soundEnabled);
    $('#soundToggle').title = `${text().sound}: ${soundEnabled ? text().soundOn : text().soundOff}`;
    if (soundEnabled) playSound(700);
  });
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    if (event.key.toLowerCase() === 'h') giveHint();
    if (event.key === 'Enter') checkAnswers();
  });
}

function init() {
  applyTranslations();
  loadRound();
  resetPuzzleState();
  bindEvents();
  renderPuzzle();
}

init();
