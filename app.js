// ===== 口算闯关营 - 主逻辑 =====

const TOTAL_QUESTIONS = 20;
const TIME_LIMIT_SEC = 600; // 10分钟

let state = null; // 当前关卡运行时状态
let timerHandle = null;

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem('kousuan_progress') || '{}');
  } catch (e) { return {}; }
}
function saveProgress(p) {
  localStorage.setItem('kousuan_progress', JSON.stringify(p));
}
function getUnlockedLevel() {
  const p = loadProgress();
  return p.maxUnlocked || 1;
}
function unlockNext(levelNum) {
  const p = loadProgress();
  p.maxUnlocked = Math.max(p.maxUnlocked || 1, levelNum + 1);
  saveProgress(p);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function goHome() {
  window.speechQueue.stopAll();
  showScreen('screen-home');
}

function goToMap() {
  window.speechQueue.stopAll();
  renderMap();
  showScreen('screen-map');
}

function renderMap() {
  const unlocked = getUnlockedLevel();
  const p = loadProgress();
  const done = p.completedLevels || [];
  const list = document.getElementById('map-list');
  list.innerHTML = '';
  for (let i = 1; i <= window.KOUSUAN_DATA.TOTAL_LEVELS; i++) {
    const isDone = done.includes(i);
    const isLocked = i > unlocked;
    const isCurrent = i === unlocked && !isDone;
    const div = document.createElement('div');
    div.className = 'level-node ' + (isLocked ? 'locked' : isCurrent ? 'current' : '');
    div.innerHTML = `
      <div class="level-badge ${isDone ? 'done' : isLocked ? 'locked' : 'current'}">
        ${isDone ? '⭐' : isLocked ? '🔒' : i}
      </div>
      <div>
        <div class="level-info-name">第${i}关 · ${window.KOUSUAN_DATA.LEVEL_NAMES[i]}</div>
        <div class="level-info-sub">${isDone ? '已通关，可重玩' : isLocked ? '完成前一关解锁' : '当前可挑战'}</div>
      </div>`;
    if (!isLocked) div.onclick = () => startLevel(i);
    list.appendChild(div);
  }
}

// ===== 开始一关 =====
function startLevel(levelNum) {
  window.speechQueue.stopAll();
  const questions = window.KOUSUAN_DATA.getLevelQuestions(levelNum);
  state = {
    levelNum,
    questions,
    phase: 'first',        // 'first' | 'retry'
    index: 0,
    correctCount: 0,       // 首轮正确
    wrongCount: 0,         // 首轮错误
    wrongQueue: [],
    retryIndex: 0,
    retryFailed: false,
    comboStreak: 0,
    announcedMaxThreshold: 0,   // 当前连续streak内已播报过的最高等级（答错会清零，用于判断"新达成"）
    overallBestThreshold: 0,    // 本关整场曾经达到过的最高连击等级（不会因为后面答错而清零，用于结算展示）
    maxComboReached: 0,
    currentInput: '',
    startTime: Date.now(),
    questionStartTime: Date.now(),
    questionTimes: [],
    remainingSec: TIME_LIMIT_SEC,
  };
  document.getElementById('level-title').textContent =
    `学前班·第${levelNum}关`;
  showScreen('screen-answer');
  startTimer();
  renderQuestion();
}

function startTimer() {
  clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    if (!state) return;
    state.remainingSec--;
    updateTimerUI();
    if (state.remainingSec <= 0) {
      clearInterval(timerHandle);
      onTimeout();
    }
  }, 1000);
  updateTimerUI();
}
function updateTimerUI() {
  const m = Math.floor(state.remainingSec / 60).toString().padStart(2, '0');
  const s = (state.remainingSec % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `${m}:${s}`;
}

function currentQuestion() {
  if (state.phase === 'first') return state.questions[state.index];
  return state.wrongQueue[state.retryIndex];
}

function renderQuestion() {
  const q = currentQuestion();
  state.currentInput = '';
  state.questionStartTime = Date.now();
  document.getElementById('answer-display').textContent = '';
  const card = document.getElementById('question-card');
  card.className = 'question-card';
  card.textContent = q.expression;

  const totalLabel = state.phase === 'first'
    ? `第${state.index + 1}/${TOTAL_QUESTIONS}题`
    : `错题重答 ${state.retryIndex + 1}/${state.wrongQueue.length}`;
  document.getElementById('qindex').textContent = totalLabel;
  document.getElementById('correct-count').textContent = '🟢' + state.correctCount;
  document.getElementById('wrong-count').textContent = '🔴' + state.wrongCount;

  // 题目朗读：最高优先级，立即打断之前的（题目已切换）
  window.speechQueue.speakImmediate(q.speechText, { rate: 1, pitch: 1 });
}

function manualSpeak() {
  const q = currentQuestion();
  if (!q) return;
  window.speechQueue.speakImmediate(q.speechText, { rate: 1, pitch: 1 });
}

function keypadInput(d) {
  if (state.currentInput.length >= 4) return;
  state.currentInput += d;
  document.getElementById('answer-display').textContent = state.currentInput;
}
function keypadClear() {
  state.currentInput = '';
  document.getElementById('answer-display').textContent = '';
}
function keypadDelete() {
  state.currentInput = state.currentInput.slice(0, -1);
  document.getElementById('answer-display').textContent = state.currentInput;
}

function keypadConfirm() {
  if (state.currentInput === '') {
    const disp = document.getElementById('answer-display');
    disp.textContent = '请输入答案';
    disp.style.color = '#dc2626';
    setTimeout(() => { disp.style.color = ''; disp.textContent = state.currentInput; }, 900);
    return;
  }
  const q = currentQuestion();
  const userAnswer = parseInt(state.currentInput, 10);
  const isCorrect = userAnswer === q.answer;
  const elapsed = (Date.now() - state.questionStartTime) / 1000;
  state.questionTimes.push(elapsed);

  const card = document.getElementById('question-card');
  card.classList.add(isCorrect ? 'correct' : 'wrong');

  if (state.phase === 'first') {
    if (isCorrect) {
      state.correctCount++;
      state.comboStreak++;
      state.maxComboReached = Math.max(state.maxComboReached, state.comboStreak);
    } else {
      state.wrongCount++;
      state.wrongQueue.push(q);
      state.comboStreak = 0;
      state.announcedMaxThreshold = 0;
    }
  } else {
    // 错题重答阶段：结果计入"最终"统计，不影响首轮已展示的正确/错误数
    if (!isCorrect) state.retryFailed = true;
  }

  document.getElementById('correct-count').textContent = '🟢' + state.correctCount;
  document.getElementById('wrong-count').textContent = '🔴' + state.wrongCount;

  // 检查是否触发连击称号（仅首轮统计）
  let titleTriggered = null;
  if (state.phase === 'first' && isCorrect) {
    titleTriggered = window.KOUSUAN_TITLES.checkComboTitle(state.comboStreak, state.announcedMaxThreshold);
  }

  if (titleTriggered) {
    state.announcedMaxThreshold = titleTriggered.threshold;
    state.overallBestThreshold = Math.max(state.overallBestThreshold, titleTriggered.threshold);
    showComboBadge(titleTriggered);
    const encourage = window.KOUSUAN_TITLES.randomEncourage();
    // 播报完成后（onEnd回调）才进入下一题，保证顺序不重叠
    window.speechQueue.enqueue(`${encourage}！${titleTriggered.name}！`, {
      rate: titleTriggered.rate,
      pitch: titleTriggered.pitch,
      onEnd: () => { setTimeout(advance, 300); }
    });
  } else {
    setTimeout(advance, 700); // 普通答对/答错反馈停留
  }
}

function showComboBadge(title) {
  const layer = document.getElementById('combo-badge-layer');
  layer.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'combo-badge ' + title.cls;
  el.innerHTML = `<span style="font-size:22px">${title.icon}</span><span>${title.name}</span>`;
  layer.appendChild(el);
  setTimeout(() => { el.remove(); }, 1500);
}

function advance() {
  if (!state) return; // 可能已退出
  if (state.phase === 'first') {
    state.index++;
    if (state.index < TOTAL_QUESTIONS) {
      renderQuestion();
    } else {
      // 首轮结束
      if (state.wrongCount === 0) {
        finishLevel(true);
      } else {
        state.phase = 'retry';
        state.retryIndex = 0;
        renderQuestion();
      }
    }
  } else {
    state.retryIndex++;
    if (state.retryIndex < state.wrongQueue.length) {
      renderQuestion();
    } else {
      finishLevel(!state.retryFailed);
    }
  }
}

function onTimeout() {
  window.speechQueue.stopAll();
  showScreen('screen-failed');
  document.querySelector('#screen-failed .settle-title').textContent = '时间到啦，再挑战一次吧！';
}

function confirmExit() {
  if (confirm('当前进度未保存，确定退出吗？')) {
    clearInterval(timerHandle);
    window.speechQueue.stopAll();
    goToMap();
  }
}

function finishLevel(success) {
  clearInterval(timerHandle);
  window.speechQueue.stopAll();
  const totalTimeSec = Math.round((Date.now() - state.startTime) / 1000);

  if (!success) {
    showScreen('screen-failed');
    document.querySelector('#screen-failed .settle-title').textContent = '挑战失败，再来一次吧！';
    return;
  }

  // 记录进度
  const p = loadProgress();
  p.completedLevels = p.completedLevels || [];
  if (!p.completedLevels.includes(state.levelNum)) p.completedLevels.push(state.levelNum);
  unlockNext(state.levelNum);

  // 结算展示
  document.getElementById('settle-title').textContent = '闯关成功！';
  document.getElementById('settle-emoji').textContent = '🎉';
  document.getElementById('stat-correct').textContent = `${state.correctCount}/${TOTAL_QUESTIONS}`;
  const m = Math.floor(totalTimeSec / 60).toString().padStart(2, '0');
  const s = (totalTimeSec % 60).toString().padStart(2, '0');
  document.getElementById('stat-time').textContent = `${m}:${s}`;

  const avgSeconds = state.questionTimes.reduce((a, b) => a + b, 0) / state.questionTimes.length;
  const titles = window.KOUSUAN_TITLES.computeSettlementTitles({
    firstRoundCorrect: state.correctCount,
    firstRoundWrong: state.wrongCount,
    avgSeconds,
    maxComboReached: state.maxComboReached
  });

  // 加上本关曾达成的最高连击称号（用整场最高值，不受中途答错清零影响）
  const comboAchieved = window.KOUSUAN_TITLES.COMBO_TITLES.find(t => t.threshold === state.overallBestThreshold);
  const allTitles = [];
  if (comboAchieved) allTitles.push({ name: comboAchieved.name, icon: comboAchieved.icon, cls: comboAchieved.cls, desc: `${comboAchieved.name}！` });
  allTitles.push(...titles);

  const titlesEl = document.getElementById('settle-titles');
  titlesEl.innerHTML = '';
  allTitles.forEach(t => {
    const pill = document.createElement('div');
    pill.className = 'pill ' + t.cls;
    pill.innerHTML = `<span>${t.icon}</span><span>${t.name}</span>`;
    titlesEl.appendChild(pill);
  });

  const isLast = state.levelNum >= window.KOUSUAN_DATA.TOTAL_LEVELS;
  document.getElementById('btn-next-level').style.display = isLast ? 'none' : 'block';

  showScreen('screen-settlement');

  // 逐条播报获得称号
  allTitles.forEach(t => {
    window.speechQueue.enqueue(t.desc || `获得${t.name}`, { rate: 1.1, pitch: 1.1 });
  });
}

function challengeNext() {
  const next = state.levelNum + 1;
  if (next > window.KOUSUAN_DATA.TOTAL_LEVELS) { goToMap(); return; }
  startLevel(next);
}
function retryLevel() {
  startLevel(state.levelNum);
}

// 初始
goHome();
