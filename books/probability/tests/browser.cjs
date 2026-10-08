/* 실제 브라우저 확인: 모든 장을 열고, 실험마다 입력·출력·초기화를 조작한다.
   실행: 저장소 루트에서 python3 -m http.server 8765 후
   PROB_TARGET=http://127.0.0.1:8765/books/probability/ node books/probability/tests/browser.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const target = process.env.PROB_TARGET || 'http://127.0.0.1:8765/books/probability/';
const shots = process.env.PROB_SHOTS || require('node:os').tmpdir();

async function readout(page) { return (await page.locator('.lab .readout').allTextContents()).join(' | '); }

async function exercise(page, id) {
  const before = await readout(page);
  const buttons = page.locator('.lab .buttons button');
  const count = await buttons.count();
  await buttons.nth(Math.min(1, count - 2)).click();
  await page.waitForTimeout(1500);
  const after = await readout(page);
  assert.notEqual(after, before, `${id}: readout should change after clicking`);
  const slider = page.locator('.lab input[type=range]').first();
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  await buttons.nth(count - 1).click();
  await page.waitForTimeout(300);
  return { id, before, after, reset: await readout(page) };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PROB_CHROMIUM || undefined });
  const results = [];
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(target);
    const ids = await page.evaluate(() => ProbBook.chapters.map((c) => c.id));
    for (const route of ['home', 'chapters', 'final', 'sources', ...ids]) {
      await page.goto(`${target}#${route}`);
      await page.waitForTimeout(150);
      const h1 = await page.locator('main h1').first().textContent();
      assert.ok(h1 && h1.trim().length > 0, `${route}: heading`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${route} @${viewport.width}: horizontal overflow ${overflow}px`);
      if (ids.includes(route) && viewport.width === 1280) results.push(await exercise(page, route));
      if (viewport.width !== 1280 && ['home', 'bayes', 'clt'].includes(route)) await page.screenshot({ path: path.join(shots, `prob-${route}-${viewport.width}.png`), fullPage: false });
    }
    if (viewport.width === 1280) {
      await page.goto(`${target}#chance`);
      await page.screenshot({ path: path.join(shots, 'prob-chance-1280.png'), fullPage: true });
      const stored = await page.evaluate((key) => localStorage.getItem(key), 'bookshelf:probability-statistics:v1:progress');
      assert.ok(stored && JSON.parse(stored).tried.length === ids.length, 'progress records every lab');
    }
    assert.deepEqual(errors, [], `console errors @${viewport.width}`);
    await page.close();
  }
  await browser.close();
  for (const r of results) console.log(`${r.id}\n  처음: ${r.before}\n  조작: ${r.after}\n  초기화: ${r.reset}`);
  console.log(`browser check passed: ${results.length} labs, 3 viewports`);
})().catch((e) => { console.error(e); process.exit(1); });
