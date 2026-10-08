/* 실제 브라우저에서 도표·작은 화면·목차·읽기 상태를 검증한다. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = process.env.BOOK_TARGET || 'http://127.0.0.1:8000/books/computer/';
const out = process.env.BOOK_SHOTS || require('node:os').tmpdir();
const chapters = ['home','bits','encoding','gates','adder','memory','cpu','programs','cache','final'];

async function checkLayout(page, width, theme, id) {
  await page.setViewportSize({width,height:900});
  await page.goto(target + '#' + id);
  await page.locator(id === 'home' ? '.hero' : '.chapter-head').waitFor();
  await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
  await page.evaluate(() => document.fonts.ready);
  const facts = await page.evaluate(() => {
    const button = document.querySelector('header .shelf-return').getBoundingClientRect();
    const nav = document.querySelector('header nav').getBoundingClientRect();
    const brand = document.querySelector('.brand').getBoundingClientRect();
    const figures = [...document.querySelectorAll('.figure-viewport')].map((el) => {
      const svg = el.querySelector('svg');
      return {contained:el.getBoundingClientRect().right <= innerWidth,
        minText:svg ? Math.min(...[...svg.querySelectorAll('text')].map(t=>parseFloat(getComputedStyle(t).fontSize)*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width)) : 16};
    });
    return {overflow:document.documentElement.scrollWidth-innerWidth, returnVisible:button.width>0 && button.left>=0 && button.right<=innerWidth,
      headerOverlap:brand.right>nav.left, figures};
  });
  assert.ok(facts.overflow<=0,`${id} ${width} ${theme}: overflow ${facts.overflow}`);
  assert.ok(facts.returnVisible,`${id} ${width}: shelf return`);
  assert.ok(!facts.headerOverlap,`${id} ${width}: header overlap`);
  for (const f of facts.figures) { assert.ok(f.contained,`${id} ${width}: figure overflow`); assert.ok(f.minText>=12.5,`${id} ${width}: figure text ${f.minText.toFixed(1)}px`); }
  return {width,theme,id,...facts};
}

async function checkReader(page) {
  await page.setViewportSize({width:390,height:844});
  await page.goto(target+'#memory');
  const expand=page.getByRole('button',{name:'입력이 바뀌어도 기억은 유지됩니다 확대 보기'});
  await expand.click();
  await page.getByRole('dialog').waitFor();
  assert.ok(await page.getByRole('dialog').isVisible());
  const duplicateIds=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
    return ids.filter((id,i)=>ids.indexOf(id)!==i);
  });
  assert.deepEqual(duplicateIds,[]);
  await page.keyboard.press('Escape');
  assert.ok(await expand.evaluate(el=>el===document.activeElement));
  await page.getByRole('button',{name:'목차',exact:true}).click();
  await page.locator('#sidebar a[href="#cpu"]').click();
  await page.locator('.chapter-head h1').filter({hasText:'명령을 하나씩 실행하기'}).waitFor();
  assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
  await page.locator('.read-toggle').click();
  await page.reload();
  assert.equal(await page.locator('.read-toggle').getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'밝은 화면',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  await page.locator('.skip').focus();
  await page.keyboard.press('Enter');
  assert.ok(page.url().endsWith('#cpu'));
  assert.ok(await page.locator('main').evaluate(el=>el===document.activeElement));
  await page.locator('header .shelf-return').click();
  assert.ok(page.url().endsWith('/index.html#books'));
}

async function screenshots(page) {
  await page.setViewportSize({width:1440,height:1000});
  for (const id of ['home','bits','adder','memory','cpu','cache']) {
    await page.goto(target+'#'+id); await page.evaluate(()=>{document.documentElement.dataset.theme='dark';return document.fonts.ready});
    const item=page.locator(id==='home'?'.hero':'.figure-plate').first();
    await item.screenshot({path:path.join(out,`computer-${id}-dark.png`)});
    if(id==='cpu'){
      await page.locator('#theme').click();
      await item.screenshot({path:path.join(out,'computer-cpu-light.png')});
    }
  }
  await page.setViewportSize({width:320,height:800});
  await page.goto(target+'#cpu');
  await page.locator('.memory').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,'computer-cpu-320.png')});
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.BOOK_CHROMIUM||undefined,args:JSON.parse(process.env.BOOK_BROWSER_ARGS||'[]')});
  try{
    const page=await browser.newPage(); const errors=[]; const failures=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400) failures.push(`${r.status()} ${r.url()}`)});
    const results=[];
    for(const width of [320,375,390,412,768,1024,1440]) for(const theme of ['dark','light']) for(const id of chapters) results.push(await checkLayout(page,width,theme,id));
    await checkReader(page); await screenshots(page);
    assert.deepEqual(errors,[]); assert.deepEqual(failures,[]);
    fs.writeFileSync(path.join(out,'computer-reader-checks.json'),JSON.stringify({results,errors,failures,interactionChecks:'passed'},null,2));
    console.log(`${results.length} layout checks and reader interactions passed`);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
