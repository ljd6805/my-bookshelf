/* 실제 브라우저 확인: 저장소 루트에서 `python3 -m http.server 8000` 실행 후
   `node books/computer/tests/browser.cjs`. 결과 화면은 임시 폴더에 저장한다. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

const target = process.env.BOOK_TARGET || 'http://127.0.0.1:8000/books/computer/';
const out = process.env.BOOK_SHOTS || os.tmpdir();

async function checkLabs(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(target);
  const lab = (n) => page.locator('[data-lab]').nth(n);
  // 1장: 스위치 두 개를 켜고 +1, 초기화
  await lab(0).locator('.bit').nth(6).click();
  await lab(0).locator('.bit').nth(7).click();
  assert.match(await lab(0).locator('.readout').innerText(), /= 십진수 3/);
  await lab(0).getByRole('button', { name: '모두 켜기' }).click();
  await lab(0).getByRole('button', { name: '+1 하기' }).click();
  assert.match(await lab(0).locator('.readout').innerText(), /= 십진수 0/);
  // 2장: 200은 −56, 범위 밖 입력은 오류
  await lab(1).getByRole('button', { name: '200' }).click();
  assert.match(await lab(1).locator('.readout').first().innerText(), /−56|-56/);
  await lab(1).locator('[data-k="num"]').fill('300');
  assert.match(await lab(1).locator('.readout').first().innerText(), /0부터 255/);
  assert.match(await lab(1).locator('[data-k="bytes"]').innerText(), /5글자 → 7바이트/);
  // 3장: XOR 1,1 → 0
  await lab(2).locator('select').selectOption('XOR');
  await lab(2).locator('[data-k="a"]').click();
  await lab(2).locator('[data-k="b"]').click();
  assert.match(await lab(2).locator('.readout').innerText(), /출력 0/);
  // 4장: 15 + 1 넘침
  await lab(3).getByRole('button', { name: '15 + 1' }).click();
  assert.match(await lab(3).locator('.readout').innerText(), /15를 넘었습니다/);
  // 5장: 쓰기 허용 없이 클럭 → 유지, 허용 후 클럭 → 저장
  await lab(4).locator('.bit').nth(3).click();
  await lab(4).getByRole('button', { name: '클럭 한 번 ↑' }).click();
  assert.match(await lab(4).locator('.readout').innerText(), /Q = 0000/);
  await lab(4).locator('[data-k="we"]').click();
  await lab(4).getByRole('button', { name: '클럭 한 번 ↑' }).click();
  assert.match(await lab(4).locator('.readout').innerText(), /Q = 0001/);
  // 6장: 다음 단계 3번 → ACC 3, 끝까지 → 출력 7
  for (let i = 0; i < 3; i += 1) await lab(5).getByRole('button', { name: '다음 단계' }).click();
  assert.match(await lab(5).locator('[data-k="regs"]').innerText(), /ACC \(계산 칸\)\s*3/);
  await lab(5).getByRole('button', { name: '멈출 때까지 실행' }).click();
  assert.equal(await lab(5).locator('[data-k="screen"]').innerText(), '7');
  // 7장: 곱셈 12, 남은 횟수 0이면 0
  await lab(6).getByRole('button', { name: '멈출 때까지 실행' }).click();
  assert.equal(await lab(6).locator('[data-k="screen"]').innerText(), '12');
  await lab(6).locator('input[data-addr="15"]').fill('0');
  await lab(6).locator('input[data-addr="15"]').dispatchEvent('change');
  await lab(6).getByRole('button', { name: '멈출 때까지 실행' }).click();
  assert.equal(await lab(6).locator('[data-k="screen"]').innerText(), '0');
  // 8장: 차례로 75%, 건너뛰기 0%
  assert.match(await lab(7).locator('[data-k="out"]').innerText(), /적중 48번 \(75%\)/);
  await lab(7).locator('[data-k="kind"]').selectOption('stride');
  assert.match(await lab(7).locator('[data-k="out"]').innerText(), /적중 0번/);
  // 9장: 44와 C 깃발 기록
  await lab(8).getByRole('button', { name: '멈출 때까지 실행' }).click();
  assert.equal(await lab(8).locator('[data-k="screen"]').innerText(), '44');
  assert.deepEqual(errors, []);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BOOK_CHROMIUM || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await checkLabs(page);
  await page.screenshot({ path: path.join(out, 'computer-desktop.png') });
  for (const width of [390, 320]) {
    const p = await browser.newPage({ viewport: { width, height: 800 } });
    await p.goto(target);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${width}px에서 가로 넘침 ${overflow}px`);
    await p.locator('#cpu').scrollIntoViewIfNeeded();
    await p.screenshot({ path: path.join(out, `computer-${width}.png`), fullPage: false });
  }
  await browser.close();
  console.log('browser checks passed; screenshots in', out);
})().catch((e) => { console.error(e); process.exit(1); });
