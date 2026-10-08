// 수동 브라우저 검사: python3 -m http.server 8765 (저장소 루트) 실행 후
// NODE_PATH=$(npm root -g) node books/linear-algebra/tests/browser.cjs
// 모든 장을 1280px·320px에서 열어 실험 준비, 오류, 가로 넘침, 슬라이더 반응, 초기화를 확인합니다.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/books/linear-algebra/';
const PAGES = ['index', 'vectors', 'similarity', 'projection', 'matrix', 'compose', 'determinant', 'inverse', 'eigen', 'pca', 'layer', 'challenge'];

async function checkPage(browser, name, width, reduce) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + name + '.html');
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const lab = document.querySelector('[data-lab]');
    return { ready: !lab || lab.classList.contains('ready'), overflow: document.documentElement.scrollWidth - innerWidth,
      shapes: lab ? lab.querySelectorAll('svg *').length : 0 };
  });
  let changed = null, reset = null;
  const range = await page.$('[data-lab] input[type=range]');
  if (range) {
    const out = page.locator('[data-lab] .readout');
    const before = await out.innerText();
    await range.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    changed = (await out.innerText()) !== before;
    await page.click('[data-lab] [data-reset]');
    reset = (await out.innerText()) === before;
  }
  await page.close();
  return { name, width, reduce, ...r, changed, reset, errors };
}

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  for (const name of PAGES) for (const width of [1280, 320]) rows.push(await checkPage(browser, name, width, false));
  rows.push(await checkPage(browser, 'matrix', 1280, true));
  await browser.close();
  let bad = 0;
  for (const r of rows) {
    const ok = r.ready && r.overflow <= 0 && !r.errors.length && r.changed !== false && r.reset !== false;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${r.name.padEnd(12)} ${String(r.width).padStart(4)}px${r.reduce ? ' reduce' : ''} ready=${r.ready} overflow=${r.overflow} shapes=${r.shapes} changed=${r.changed} reset=${r.reset} ${r.errors.join(' | ')}`);
  }
  console.log(`${rows.length - bad}/${rows.length} passed`);
  process.exit(bad ? 1 : 0);
})();
