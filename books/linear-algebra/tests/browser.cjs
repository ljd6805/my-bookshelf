// 수동 브라우저 검사: python3 -m http.server 8765 (저장소 루트) 실행 후
// NODE_PATH=$(npm root -g) node books/linear-algebra/tests/browser.cjs
// 모든 경로를 1280px·320px에서 열어 오류, 가로 넘침, 서가 버튼, 실험 준비를 보고,
// 비교 예제 버튼의 결과 숫자, 키보드 조작, 실험 초기화, 확인 문제를 실제 입력으로 확인합니다.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/books/linear-algebra/';
const ROUTES = ['home', 'vectors', 'similarity', 'projection', 'matrix', 'compose', 'determinant', 'inverse', 'eigen', 'pca', 'layer', 'challenge'];
// 예제 버튼 순서대로 결과 문장에 나와야 하는 계산값(본문과 docs/index.html의 검증값).
const EXPECT = {
  'vector-mix': ['(1.00, 1.50)', '(−1.00, 0.50)', '(0.00, 0.00)'],
  similarity: ['1.00', '', '−1.00'],
  projection: ['여름 축제', '옥상 록 공연', '여름 축제'],
  'matrix-grid': ['(2.00, 1.00)', '(2.23, 0.01)', ''],
  compose: ['달라집니다', '', '같습니다'],
  determinant: ['3.18', '0.00', '−2.25'],
  solve: ['(2.00, 1.50)', '(−4.75, 15.00)', '평행'],
  eigen: ['고윳값은 약 3.00', '고윳값은 약 1.00', '고유벡터가 아닙니다'],
  pca: ['55%', '94%', '6%'],
  layer: ['4곡', '', '직선 변환'],
  challenge: ['아침 달리기', '여름 축제', '']
};

async function open(browser, route, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '#' + route);
  await page.waitForTimeout(200);
  return { page, errors };
}

async function layout(page) {
  return page.evaluate(() => {
    const b = document.querySelector('header .shelf-return').getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - innerWidth, shelf: b.width > 0 && b.right <= innerWidth && b.height >= 36,
      ready: [...document.querySelectorAll('[data-lab]')].every((l) => l.classList.contains('ready')) };
  });
}

async function labs(page) {
  const results = [];
  for (const article of await page.$$('article.lab')) {
    const id = await article.$eval('[data-lab]', (e) => e.dataset.lab);
    const out = await article.$('.lab-inner .readout');
    const initial = await out.innerText();
    const presets = await article.$$('[data-preset]');
    const misses = [];
    for (let k = 0; k < presets.length; k++) {
      await presets[k].click();
      const text = await out.innerText();
      if (!text.includes(EXPECT[id][k] || '')) misses.push(`${k}:${text.slice(0, 80)}`);
    }
    await (await article.$('[data-initialize]')).click();
    const reset = (await out.innerText()) === initial;
    const range = await article.$('.lab-inner input[type=range]');
    let keys = null;
    if (range) {
      await range.focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
      keys = (await out.innerText()) !== initial;
    }
    results.push({ id, misses, reset, keys });
  }
  return results;
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const width of [1280, 320]) for (const route of ROUTES) {
    const { page, errors } = await open(browser, route, width);
    const l = await layout(page);
    const lab = width === 1280 && route !== 'home' ? await labs(page) : [];
    let quiz = true;
    if (width === 1280 && route !== 'home') {
      const answer = await page.evaluate((r) => LABook.chapters.find((c) => c.id === r).quiz[2], route);
      await page.click(`[data-answer="${answer}"]`);
      quiz = (await page.innerText('.quiz-feedback')).startsWith('정답입니다.');
    }
    const ok = !errors.length && l.overflow <= 0 && l.shelf && l.ready && quiz && lab.every((x) => !x.misses.length && x.reset && x.keys !== false);
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${width} ${route}`, JSON.stringify({ ...l, quiz, lab, errors }));
    await page.close();
  }
  await browser.close();
  process.exitCode = bad ? 1 : 0;
})();
