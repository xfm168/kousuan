// ===== 口算闯关营 - 学前班题库生成器 =====
// 说明：学前班范围数值小，用规则生成保证不重复、覆盖全面，比手打几百道题更可靠。

function numText(n) {
  return String(n);
}

function makeQ(a, op, b, answer) {
  const expr = `${a} ${op} ${b} = ?`;
  const opWord = op === '+' ? '加' : '减';
  const speechText = `${numText(a)}${opWord}${numText(b)}等于多少`;
  return {
    id: `${a}${op}${b}`,
    expression: expr,
    a, b, op, answer,
    speechText,
    type: 'arith'
  };
}

// 生成不进位加法池: a+b<=max 且 (a%10+b%10)<10（10以内时不受此约束）
function genAddPool(max, opts = {}) {
  const { noCarry = false, minSum = 0 } = opts;
  const pool = [];
  for (let a = 0; a <= max; a++) {
    for (let b = 0; b <= max; b++) {
      const sum = a + b;
      if (sum > max) continue;
      if (sum < minSum) continue;
      if (noCarry && (a % 10 + b % 10) >= 10) continue;
      if (a === 0 && b === 0) continue;
      pool.push(makeQ(a, '+', b, sum));
    }
  }
  return pool;
}

// 生成不退位/退位减法池
function genSubPool(max, opts = {}) {
  const { noBorrow = null, minA = 0 } = opts; // noBorrow: true=不退位, false=必须退位, null=不限制
  const pool = [];
  for (let a = minA; a <= max; a++) {
    for (let b = 0; b <= a; b++) {
      const diff = a - b;
      if (noBorrow === true && (a % 10) < (b % 10)) continue;
      if (noBorrow === false && (a % 10) >= (b % 10)) continue;
      if (a === 0 && b === 0) continue;
      pool.push(makeQ(a, '-', b, diff));
    }
  }
  return pool;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(pool, n) {
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}

// ===== 12关定义 =====
// 每关返回一个"题库池"，答题时从池中随机不重复抽取20题
const LEVEL_POOLS = {
  1: () => genAddPool(10),                                    // 10以内加法
  2: () => genSubPool(10),                                    // 10以内减法
  3: () => shuffle([...genAddPool(10), ...genSubPool(10)]),   // 10以内加减综合
  4: () => genAddPool(20, { noCarry: true, minSum: 11 }),     // 20以内加法(不进位, 且和>10体现"20以内"特征)
  5: () => genSubPool(20, { noBorrow: true, minA: 11 }),      // 20以内减法(不退位)
  6: () => shuffle([
              ...genAddPool(20, { minSum: 11 }).filter(q => (q.a % 10 + q.b % 10) >= 10),
              ...genSubPool(20, { noBorrow: false, minA: 11 })
            ]),                                                // 20以内进位加/退位减
  7: () => shuffle([
              ...genAddPool(20, { minSum: 11 }),
              ...genSubPool(20, { minA: 11 })
            ]),                                                // 20以内加减综合挑战
  8: () => genAddPool(30, { minSum: 21 }),                    // 30以内加法
  9: () => genSubPool(30, { minA: 21 }),                      // 30以内减法
  10: () => genAddPool(50, { minSum: 31 }),                   // 50以内加法
  11: () => genSubPool(50, { minA: 31 }),                     // 50以内减法
  12: () => shuffle([
              ...genAddPool(50, { minSum: 31 }),
              ...genSubPool(50, { minA: 31 })
            ]),                                                // 50以内加减综合终极挑战
};

const LEVEL_NAMES = {
  1: '10以内加法', 2: '10以内减法', 3: '10以内加减综合',
  4: '20以内加法', 5: '20以内减法', 6: '20以内进退位',
  7: '20以内综合挑战', 8: '30以内加法', 9: '30以内减法',
  10: '50以内加法', 11: '50以内减法', 12: '50以内终极挑战'
};

// 获取某一关的20道题（首轮用）
function getLevelQuestions(levelNum) {
  const pool = LEVEL_POOLS[levelNum]();
  return pick(pool, 20);
}

window.KOUSUAN_DATA = { getLevelQuestions, LEVEL_NAMES, TOTAL_LEVELS: 12 };
