/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 표지와 모든 장을 1280·390·320px에서 연다.
   장마다 그림과 실험의 기본 결과, 가로 넘침, 서가 단추, 콘솔 오류를 보고, 1280px에서 비교 예제·초기화·판 조작(칸 누르기, 기보 입력, 퍼즐 풀기)·확인 문제를 조작한다.
   실행: node books/chess/tests/browser.cjs (Playwright는 PLAYWRIGHT_PATH, Chromium은 PW_EXECUTABLE_PATH로 바꿀 수 있다) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const IDS=['board','moves','special','check','ending','notation','value','opening','tactics','mates','engine','final'];
const BAD=/NaN|undefined|Infinity/;
/* 기본 상태의 결과 읽기에 꼭 나와야 하는 문구(tests/chess.test.cjs가 같은 값을 엔진으로 다시 계산한다). */
const DEFAULTS={moves:['닿는 칸 8개'],special:['exd6'],check:['규칙상 움직임 13개 → 합법 수 5개'],ending:['체크메이트'],notation:['1. e4 e5 2. Nf3 Nc6 3. Bb5'],value:['0점'],opening:['원칙대로 둔 판'],engine:['389','64','Kf1'],final:['Qh5','Nf3','Bc4']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/chess/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
/* 걸린 시간(ms)은 기기마다 달라 비교에서 뺀다. */
const readout=async lab=>(await lab.locator('.readout').innerText()).replace(/\d+ms/g,'?ms');
async function view(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,back:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figure:!!document.querySelector('.figure-art svg'),board:!!document.querySelector('.cboard')}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.back,`${id}@${width}: shelf button hidden`);assert.ok(d.board,`${id}: no board`);
 if(id!=='home'){assert.ok(d.figure,`${id}: no figure`);const t=await readout(page.locator('.lab').first());assert.doesNotMatch(t,BAD,id);(DEFAULTS[id]||[]).forEach(s=>assert.ok(t.includes(s),`${id}@${width}: missing ${s} in ${t}`));}
}
async function interact(page,url){
 /* 비교 예제를 모두 누르고 초기화하면 처음 결과로 돌아온다. */
 for(const id of IDS){await page.goto(url+'#'+id);const lab=page.locator('.lab').first();await lab.locator('.readout').waitFor();if(id==='engine')await page.waitForTimeout(300);
  const first=await readout(lab),n=await lab.locator('[data-preset]').count();
  for(let i=0;i<n;i++){await lab.locator('[data-preset]').nth(i).click();assert.doesNotMatch(await readout(lab),BAD,`${id} preset ${i}`);}
  await lab.locator('[data-initialize]').click();assert.equal(await readout(lab),first,`${id}: reset`);
  const ok=await page.locator('.quiz [data-answer]').count();assert.ok(ok>=3,id);await page.locator('.quiz [data-answer]').first().click();assert.match(await page.locator('.quiz-feedback').innerText(),/정답|다시 생각/);}
 /* 판을 눌러 두기: 2장 표지 실험 없이 6장 기보 입력과 판 누르기. */
 await page.goto(url+'#notation');let lab=page.locator('.lab').first();await lab.locator('#no-pos').selectOption('twin');
 await lab.locator('[data-sq="1"]').click();await lab.locator('[data-sq="11"]').click();assert.match(await readout(lab),/Nbd2/);
 await lab.locator('#no-pos').selectOption('open');await lab.locator('#no-san').fill('Bc4');await lab.locator('[data-san-form] button').click();assert.doesNotMatch(await readout(lab),BAD);
 /* 9장 포크 퍼즐: Nc7+를 두면 맞았다고 판정한다. */
 await page.goto(url+'#tactics');lab=page.locator('.lab').first();await lab.locator('[data-sq="35"]').click();await lab.locator('[data-sq="50"]').click();
 await page.waitForTimeout(200);assert.match(await readout(lab),/맞았습니다/);
 /* 10장 마지막 줄: Ra8#. */
 await page.goto(url+'#mates');lab=page.locator('.lab').first();await lab.locator('[data-sq="0"]').click();await lab.locator('[data-sq="56"]').click();assert.match(await readout(lab),/체크메이트/);
 /* 표지 실험: 칸을 누르면 기물이 옮겨 가고 닿는 칸 수가 바뀐다. */
 await page.goto(url+'#home');const home=page.locator('#home-lab');await home.locator('[data-sq="0"]').click();assert.match(await home.locator('.home-result').innerText(),/2칸/);
}
(async()=>{
 const server=await serve(),browser=await chromium.launch({executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium'}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  for(const width of [1280,390,320])for(const id of ['home',...IDS])await view(page,server.url,width,id);
  await page.setViewportSize({width:1280,height:900});await interact(page,server.url);
  assert.deepEqual(errors,[]);console.log('browser check passed: 13 views × 3 widths, presets, reset, moves, puzzles');
 }finally{await browser.close();server.stop();}
})().catch(e=>{console.error(e);process.exit(1);});
