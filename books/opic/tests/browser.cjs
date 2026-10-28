/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 표지와 모든 장을 1280·390·320px에서 연다.
   장마다 그림과 실험의 기본 결과, 가로 넘침, 서가 단추, 콘솔 오류를 보고, 1280px에서 비교 예제·초기화·직접 입력(답 칸, 초시계, 대본 세기)·확인 문제를 조작한다.
   실행: node books/opic/tests/browser.cjs (Playwright는 PLAYWRIGHT_PATH, Chromium은 PW_EXECUTABLE_PATH로 바꿀 수 있다) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const IDS=['test','levels','survey','describe','routine','past','compare','roleplay','combo','timing','final'];
const BAD=/NaN|undefined|Infinity/;
/* 기본 상태의 결과 읽기에 꼭 나와야 하는 문구(tests/opic.test.cjs가 같은 값을 계산 모듈로 다시 계산한다). */
const DEFAULTS={test:['140'],levels:['문장'],survey:['11'],describe:['19'],past:['과거'],combo:['덮지 못함 2개'],timing:['43.5','65낱말'],final:['45초']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/opic/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
const readout=async lab=>lab.locator('.readout').innerText();
async function view(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,back:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figure:!!document.querySelector('.figure-art svg')}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.back,`${id}@${width}: shelf button hidden`);
 if(id==='home'){assert.doesNotMatch(await page.locator('.home-result').innerText(),BAD);return;}
 assert.ok(d.figure,`${id}: no figure`);const t=await readout(page.locator('.lab').first());assert.doesNotMatch(t,BAD,id);(DEFAULTS[id]||[]).forEach(s=>assert.ok(t.includes(s),`${id}@${width}: missing ${s} in ${t}`));
}
async function interact(page,url){
 /* 비교 예제를 모두 누르고 초기화하면 처음 결과로 돌아온다. */
 for(const id of IDS){await page.goto(url+'#'+id);const lab=page.locator('.lab').first();await lab.locator('.readout').waitFor();
  const first=await readout(lab),n=await lab.locator('[data-preset]').count();assert.ok(n>=3,`${id}: presets`);
  for(let i=0;i<n;i++){await lab.locator('[data-preset]').nth(i).click();assert.doesNotMatch(await readout(lab),BAD,`${id} preset ${i}`);}
  await lab.locator('[data-initialize]').click();assert.equal(await readout(lab),first,`${id}: reset`);
  await page.locator('.quiz [data-answer]').first().click();assert.match(await page.locator('.quiz-feedback').innerText(),/정답|다시 생각/);}
 /* 2장: 직접 쓴 답을 넣으면 글 모양 어림이 다시 계산된다. */
 await page.goto(url+'#levels');let lab=page.locator('.lab').first();
 await lab.locator('#sh-text').fill('I went to the park last week because it was sunny. Then I rode my bike. After that, I ate lunch. I will go again next weekend, so I am happy. These days I go there every Sunday. It is my favorite place because it is quiet.');
 assert.match(await readout(lab),/문단에 가까움/);
 /* 10장: 초시계로 잰 시간이 길이 칸에 들어가고, 대본 낱말 세기가 낱말 칸을 채운다. */
 await page.goto(url+'#timing');lab=page.locator('.lab').first();
 await lab.locator('[data-timer=start]').click();await page.waitForTimeout(1300);await lab.locator('[data-timer=stop]').click();
 assert.ok(['1','2'].includes(await lab.locator('#pc-sec').inputValue())||+await lab.locator('#pc-sec').inputValue()>=20,'timer value');
 await lab.locator('#pc-text').fill('I usually go to the park on Sunday because it is close to my house.');await lab.locator('[data-count]').click();
 assert.equal(await lab.locator('#pc-words').inputValue(),'15');
 /* 8장: 상황을 바꾸면 대사 이름이 바뀌고 셈이 다시 된다. */
 await page.goto(url+'#roleplay');lab=page.locator('.lab').first();await lab.locator('#rp-sit').selectOption('solve');assert.match(await readout(lab),/대안/);
}
(async()=>{
 const srv=await serve(),browser=await chromium.launch(process.env.PW_EXECUTABLE_PATH?{executablePath:process.env.PW_EXECUTABLE_PATH}:{});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  for(const w of [1280,390,320])for(const id of ['home',...IDS])await view(page,srv.url,w,id);
  await page.setViewportSize({width:1280,height:900});await interact(page,srv.url);
  assert.deepEqual(errors,[]);console.log('browser checks passed: 3 widths × 12 pages, presets, reset, typed answer, stopwatch, script count');
 }finally{await browser.close();srv.stop();}
})().catch(e=>{console.error(e);process.exit(1);});
