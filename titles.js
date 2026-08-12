// ===== 闯关评级与称号系统 =====

const ENCOURAGE_WORDS = [
  '太厉害了', '游刃有余', '无人能挡', '横扫千军', '神机妙算', '百战百胜'
];

function randomEncourage() {
  return ENCOURAGE_WORDS[Math.floor(Math.random() * ENCOURAGE_WORDS.length)];
}

// 实时连击类称号：阈值从高到低排列，方便"只取当次新达成的最高等级"
const COMBO_TITLES = [
  { threshold: 18, name: 'MVP连胜王', icon: '👑', cls: 'badge-lv5', rate: 1.3, pitch: 1.4 },
  { threshold: 15, name: '收割战神', icon: '🏆', cls: 'badge-lv4', rate: 1.25, pitch: 1.3 },
  { threshold: 10, name: '常胜将军', icon: '💎', cls: 'badge-lv3', rate: 1.15, pitch: 1.2 },
  { threshold: 5,  name: '五连绝世', icon: '⚡', cls: 'badge-lv2', rate: 1.1,  pitch: 1.1 },
  { threshold: 3,  name: '三连决胜', icon: '🔥', cls: 'badge-lv1', rate: 1.0,  pitch: 1.0 },
];

// 给定当前连击数与"本关已播报过的最高阈值"，返回新触发的称号（若无新触发返回null）
function checkComboTitle(streak, announcedMaxThreshold) {
  for (const t of COMBO_TITLES) {
    if (streak >= t.threshold && t.threshold > announcedMaxThreshold) {
      return t;
    }
  }
  return null;
}

// 结算类称号判定
function computeSettlementTitles({ firstRoundCorrect, firstRoundWrong, avgSeconds, maxComboReached }) {
  const total = firstRoundCorrect + firstRoundWrong;
  const accuracy = total > 0 ? firstRoundCorrect / total : 0;
  const titles = [];

  const isPerfect = firstRoundWrong === 0;
  const isUltimate = maxComboReached >= 10 && isPerfect && avgSeconds < 15;

  if (isUltimate) {
    titles.push({ name: '绝世无双王者', icon: '👑', cls: 'badge-lv5', desc: '速度、准确率、连答全部拉满，获得终极绝世无双王者' });
  } else {
    if (isPerfect) titles.push({ name: '最强王者', icon: '⭐', cls: 'badge-lv4', desc: '整关零失误完美通关，获得最强王者' });
    else if (accuracy >= 0.85) titles.push({ name: '暴击王者', icon: '💥', cls: 'badge-lv3', desc: '计算稳定性拉满，获得暴击王者' });

    if (avgSeconds < 30) titles.push({ name: '闪电王者', icon: '⚡', cls: 'badge-lv3', desc: '看题秒出答案，获得闪电王者' });
    else if (avgSeconds < 40) titles.push({ name: '疾行王者', icon: '💨', cls: 'badge-lv2', desc: '答题速度远超标准，获得疾行王者' });
  }
  return titles;
}

window.KOUSUAN_TITLES = { randomEncourage, COMBO_TITLES, checkComboTitle, computeSettlementTitles };
