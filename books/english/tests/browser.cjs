/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 표지와 모든 장을 1280·390·320px에서 연다.
   장마다 그림과 실험의 기본 결과, 가로 넘침, 서가 단추, 콘솔 오류를 보고, 1280px에서 비교 예제·초기화·입력(강세 낱말 누르기, 받아쓰기, 복기 후보)·확인 문제를 조작한다.
   이 브라우저에는 목소리가 없을 수 있어, 듣기 단추는 꺼진 상태와 안내 문구를 확인한다.
   실행: node books/english/tests/browser.cjs (Playwright는 PLAYWRIGHT_PATH, Chromium은 PW_EXECUTABLE_PATH로 바꿀 수 있다) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const IDS=['syllable','stress','frame','questions','time','followup','requests','repair','linking','fluency','final'];
const BAD=/NaN|undefined|Infinity|null/;
/* 기본 상태의 결과 읽기에 꼭 나와야 하는 문구(tests/english.test.cjs가 같은 값을 모델로 다시 계산한다). */
const DEFAULTS={syllable:['2음절'],frame:['I work in marketing.'],time:['every day'],followup:['3번'],linking:['%'],fluency:['77'],final:['A']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/english/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
const readout=async lab=>(await lab.locator('.readout').innerText());
async function view(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,back:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figure:!!document.querySelector('.figure-art svg')}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.back,`${id}@${width}: shelf button hidden`);
 if(id!=='home'){assert.ok(d.figure,`${id}: no figure`);const t=await readout(page.locator('.lab').first());assert.doesNotMatch(t,BAD,id);(DEFAULTS[id]||[]).forEach(s=>assert.ok(t.includes(s),`${id}@${width}: missing ${s} in ${t}`));}
}
async function interact(page,url){
 for(const id of IDS){await page.goto(url+'#'+id);const lab=page.locator('.lab').first();await lab.locator('.readout').waitFor();
  const first=await readout(lab),n=await lab.locator('[data-preset]').count();assert.ok(n>=2,`${id}: presets`);
  for(let i=0;i<n;i++){await lab.locator('[data-preset]').nth(i).click();assert.doesNotMatch(await readout(lab),BAD,`${id} preset ${i}`);}
  await lab.locator('[data-initialize]').click();assert.equal(await readout(lab),first,`${id}: reset`);
  const speak=lab.locator('.ew-speak button, button.ew-speak');if(await speak.count())assert.ok(await speak.first().isVisible(),`${id}: speak button`);
  const ok=await page.locator('.quiz [data-answer]').count();assert.ok(ok>=3,id);await page.locator('.quiz [data-answer]').first().click();assert.match(await page.locator('.quiz-feedback').innerText(),/정답|다시 생각/);}
 /* 2장: 낱말을 눌러 고르면 맞힌 내용어 수가 바뀐다. */
 await page.goto(url+'#stress');let lab=page.locator('.lab').first();const before=await readout(lab);await lab.locator('[data-w="1"]').click();assert.notEqual(await readout(lab),before);
 /* 9장: 원래 문장을 그대로 적으면 오류율 0%. */
 await page.goto(url+'#linking');lab=page.locator('.lab').first();await lab.locator('#li-typed').fill('What do you want to do?');await lab.locator('#li-typed').dispatchEvent('input');assert.match(await readout(lab),/0%/);
 /* 마지막 과제: 순간 B에서 2번 후보(went)는 맞는 시제로 판정한다. */
 await page.goto(url+'#final');lab=page.locator('.lab').first();await lab.locator('#rv-moment').selectOption('B');await lab.locator('#rv-cand').selectOption('1');assert.match(await readout(lab),/went/);assert.match(await readout(lab),/✓|맞/);
 /* 본문 건너뛰기 링크는 지금 장을 그대로 두고 본문으로 초점만 옮긴다. */
 await page.goto(url+'#repair');await page.locator('.chapter-head').waitFor();await page.locator('.skip').focus();await page.keyboard.press('Enter');
 assert.equal(new URL(page.url()).hash,'#repair');assert.ok(await page.locator('.chapter-head').count(),'skip link left the chapter');assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 /* 영어 목소리가 없는 브라우저에서는 2초 뒤 듣기 단추가 꺼지고 이유가 보인다. */
 await page.waitForTimeout(2200);const sp=page.locator('button.ew-speak').first();if(!(await page.evaluate(()=>ESpeak.hasVoice())))assert.ok(await sp.isDisabled(),'speak button should be disabled without a voice');
 /* 표지 실험: 낱말을 누르면 음절 수가 바뀐다. */
 await page.goto(url+'#home');const home=page.locator('#home-lab');await home.locator('[data-word="banana"]').click();assert.match(await home.locator('.home-result').innerText(),/3음절/);
}
(async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium'}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  for(const width of [1280,390,320])for(const id of ['home',...IDS])await view(page,server.url,width,id);
  await page.setViewportSize({width:1280,height:900});await interact(page,server.url);
  assert.deepEqual(errors,[]);console.log('browser check passed: 12 views × 3 widths, presets, reset, inputs, quizzes');
 }finally{await browser.close();server.stop();}
})().catch(e=>{console.error(e);process.exit(1);});
