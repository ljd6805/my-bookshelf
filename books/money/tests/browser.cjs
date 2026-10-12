/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자, 비교 예제, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고 가로 넘침과 콘솔 오류를 본다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/money/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'money-evidence');
const report={date:'2026-10-12',views:[],labs:[],errors:[],console:[]};
const BAD=/NaN|undefined|Infinity/;
/* 기본값에서 결과 문장에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={scale:['10,300,000원','같은 무게','연 3.00%'],compound:['13,000,000원','13,439,164원','439,164원'],double:['12.00년','11.90년','6.1678%'],discount:['10,066,558원'],schedule:['182,532원','30,000원','571,136원','555,000원','1,080,000원'],npv:['11.56만 원','13.07%'],real:['2.538%','0.527%'],cagr:['0.00%','−13.40%','7,500,000원'],fees:['57,434,912원','42,484,626원','55,736,617원','26.0%','3.0%','4.94%'],decide:['7,146,096원','6,924,934원','7,535,620원','4,360,891원','연 6.11%','4,000,000원','182,532원']};
const PRESETS={npv:[1,['10.00%와 20.00%']],cagr:[1,['6.00%','5.35%','12,978,900원']],schedule:[3,['262,321원','221,137원']],decide:[1,['7,074,635원','연 5.75%']]};
/* 그림 캡션에 꼭 나와야 하는 숫자(4장 할인 그림은 오늘 = 10,066,558원, 3년 뒤 = 1,100만 원 방향). */
const FIGURES={discount:['10,066,558원']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/money/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
async function frame(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,returnVisible:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figure:!!document.querySelector('.figure-art svg')}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.returnVisible,`${id}: shelf return hidden`);
 if(id!=='home')assert.ok(d.figure,`${id}: no .figure-art`);
 if(FIGURES[id])has(await page.locator('.concept-diagram figcaption').innerText(),FIGURES[id],`${id} figure caption`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
const has=(text,list,msg)=>list.forEach(s=>assert.ok(text.includes(s),`${msg}: missing ${s} in ${text}`));
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');const t=await lab.locator('.readout').innerText();assert.doesNotMatch(t,BAD);if(PRESETS[id]&&PRESETS[id][0]===i)has(t,PRESETS[id][1],`${id} preset ${i}`);}
 return n;
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();has(before,DEFAULTS[id],id);
 const presetCount=await presets(lab,id);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const set=(c,v)=>lab.locator('#'+c.id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);
 const values=c=>c.tag==='SELECT'?c.options:[c.min,c.max];
 for(const c of controls){
  await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
  const initial=await state(lab);
  for(const v of values(c)){await set(c,v);assert.doesNotMatch(await lab.locator('.readout').innerText(),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await set(c,c.tag==='SELECT'?c.options[0]:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>x.type==='number'||x.type==='text')){await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();await set(c,'');assert.match(await lab.locator('.readout').innerText(),/확인해 주세요/,`${id}:${c.id} empty`);}
 await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();assert.equal(await lab.locator('.readout').innerText(),before,`${id}: reset`);
 report.labs.push({width,id,controls:controls.length,presets:presetCount,reset:true});
}
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
}
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,1280,'loan');await shot(page.locator('#lab-schedule'),'schedule-desktop.png');
 await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-schedule'),'schedule-theme.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,320,'loan');await shot(page.locator('#lab-schedule'),'schedule-mobile.png');
 await frame(page,url,320,'final');await shot(page.locator('#lab-decide'),'decide-mobile.png');
 await frame(page,url,390,'today');const slider=page.locator('#srate'),kb=await page.locator('#lab-scale .readout').innerText();await slider.focus();await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#lab-scale .readout').innerText(),kb,'keyboard slider');assert.match(await page.locator('#lab-scale .readout').innerText(),/오늘 받는 쪽이/);
 await page.fill('#guess-scale','오늘 쪽 10만 원');await page.locator('#lab-scale summary').click();await page.waitForFunction(()=>/내 예측: 오늘 쪽 10만 원/.test(document.querySelector('#lab-scale .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,320,'npv');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});
  await page.goto(url);const chapters=await page.evaluate(()=>MBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   const hb=await page.locator('.home-result').innerText();assert.match(hb,/같은 무게/);await page.getByRole('button',{name:'연 4%',exact:true}).click();assert.match(await page.locator('.home-result').innerText(),/100,000원 무겁습니다/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await extras(page,url);
  const consoleErrors=report.console.filter(t=>!/favicon|404|review\.json/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,errors:report.errors,console:report.console,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
