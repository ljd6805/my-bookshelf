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
      if (viewport.width !== 1280 && ['home', 'bayes', 'clt', 'correlation'].includes(route)) await page.screenshot({ path: path.join(shots, `prob-${route}-${viewport.width}.png`), fullPage: false });
    }
    if (viewport.width === 1280) {
      // 4장 보충: 예제 버튼(n = 30, 띠 켜고 500개) → 띠 안 비율과 이론값 95%, 초기화하면 띠가 꺼진다
      await page.goto(`${target}#clt`);
      await page.getByRole('button', { name: '예제: n = 30, 띠 켜고 500개' }).click();
      await page.waitForTimeout(1500);
      const band = await readout(page);
      assert.match(band, /띠\(.*\) 안의 평균 \d+개 = 9[45]\.\d% \(정규분포 이론값 95\.0%\)/, band);
      await page.getByRole('button', { name: '초기화' }).click();
      assert.ok(!(await page.locator('#clt-band').isChecked()), 'reset clears band');
      // 9장: 기본 r 0.79 → 나눠 보기 예제는 단계별 r이 0 근처 → 무작위 예제는 전체 r 0 근처 → 직접 조작 → 초기화
      await page.goto(`${target}#correlation`);
      const status = page.locator('.lab .readout[role=status]');
      assert.match(await status.innerText(), /관찰 기록 200개 · 전체 r = 0\.79/);
      await page.getByRole('button', { name: '예제: 부하 단계로 나눠 보기' }).click();
      const groups = [...(await status.innerText()).matchAll(/\)\s(-?\d\.\d\d)/g)].map((m) => Number(m[1]));
      assert.equal(groups.length, 3, await status.innerText());
      for (const g of groups) assert.ok(Math.abs(g) < 0.1, `within-load r ${g}`);
      assert.equal(await page.locator('.lab .chart rect.cr-pt.lv1').count() > 0, true, 'square marks for mid load');
      await page.getByRole('button', { name: '예제: 온도를 무작위로 정하기' }).click();
      assert.match(await status.innerText(), /무작위 실험 200개 · 전체 r = -?0\.0\d/);
      await page.getByRole('button', { name: '예제: 부하 영향 없음(강도 0%)' }).click();
      assert.match(await status.innerText(), /전체 r = -?0\.0\d \(모델의 기대값 0\.00\)/);
      await page.locator('#cr-days').focus();
      await page.keyboard.press('ArrowRight');
      assert.match(await status.innerText(), /관찰 기록 300개/);
      await page.locator('#cr-split').check();
      assert.match(await status.innerText(), /부하 단계별 r/);
      await page.getByRole('button', { name: '초기화' }).click();
      assert.ok(!(await page.locator('#cr-split').isChecked()) && !(await page.locator('#cr-rand').isChecked()), 'reset clears toggles');
      assert.match(await status.innerText(), /^관찰 기록 200개 · 전체 r = 0\.79 \(모델의 기대값 0\.79\)$/);
      assert.match(await page.locator('.note.confuse').innerText(), /혼동하지 마세요/);
      // 전이 보기 문항: 오답 → 정답 피드백
      for (const id of ids) {
        await page.goto(`${target}#${id}`);
        const ans = await page.evaluate((r) => ProbBook.chapters.find((c) => c.id === r).transfer.quiz[2], id);
        await page.click(`[data-transfer="${(ans + 1) % 3}"]`);
        assert.match(await page.locator('.transfer-feedback').innerText(), /^다시 생각해 보세요/);
        await page.click(`[data-transfer="${ans}"]`);
        assert.match(await page.locator('.transfer-feedback').innerText(), /^정답입니다/);
      }
      await page.goto(`${target}#final`);
      assert.equal(await page.locator('.final-q').count(), 6);
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
