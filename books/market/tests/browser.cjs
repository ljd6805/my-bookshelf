/* 재현: 저장소 루트에서 python3 -m http.server 8765 실행 후
   BOOK_URL=http://127.0.0.1:8765/books/market/ PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/market/tests/browser.cjs
   모든 장을 1280·390·320px에서 열고, 그림·실험의 비교 예제·입력 경계값·초기화·확인 문제를 조작한다. 결과는 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const URL=process.env.BOOK_URL||'http://127.0.0.1:8765/books/market/';
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'market-evidence');
const report={url:URL,date:'2026-10-12',views:[],labs:[],errors:[],console:[]};
const BAD=/NaN|undefined|Infinity/;
async function frame(page,width,id){
 await page.setViewportSize({width,height:900});await page.goto(URL+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,returnVisible:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figure:!!document.querySelector('.figure-art svg')}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.returnVisible,`${id}: shelf return hidden`);
 if(id!=='home')assert.ok(d.figure,`${id}: no .figure-art`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
async function presets(lab){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');assert.doesNotMatch(await lab.locator('.readout').innerText(),BAD);}
 return n;
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();assert.ok(before.length>20,id);
 const presetCount=await presets(lab);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 const set=(c,v)=>lab.locator('#'+c.id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v==='on';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?['on','off']:[c.min,c.max];
 for(const c of controls){
  await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
  const initial=await state(lab);
  for(const v of values(c)){await set(c,v);assert.doesNotMatch(await lab.locator('.readout').innerText(),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await set(c,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?'on':c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 if(controls.some(c=>c.type==='number')){const c=controls.find(x=>x.type==='number');await set(c,'');assert.match(await lab.locator('.readout').innerText(),/확인해 주세요/,`${id}: empty number`);}
 await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();assert.equal(await lab.locator('.readout').innerText(),before,`${id}: reset`);
 report.labs.push({width,id,controls:controls.length,presets:presetCount,reset:true});
}
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 if(c.transfer===null)return;
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-transfer="${(c.transfer+1)%3}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^다시 생각/);
}
async function extras(page){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,1280,'book');await shot(page.locator('#lab-sweep'),'sweep-desktop.png');
 await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-sweep'),'sweep-theme.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,320,'final');await shot(page.locator('#lab-diagnose'),'diagnose-mobile.png');
 await frame(page,390,'hours');await shot(page.locator('#lab-hours'),'hours-mobile.png');
 const slider=page.locator('#hclock'),kb=await page.locator('#lab-hours .readout').innerText();await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#lab-hours .readout').innerText(),kb,'keyboard slider');
 await frame(page,320,'queue');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});
  await page.goto(URL);const chapters=await page.evaluate(()=>MBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer?c.transfer[2]:null,labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,width,'home');
   const hb=await page.locator('.home-result').innerText();await page.getByRole('button',{name:'2,500주',exact:true}).click();assert.notEqual(await page.locator('.home-result').innerText(),hb);
   for(const c of chapters){await frame(page,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await extras(page);
  const consoleErrors=report.console.filter(t=>!/favicon|404/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,errors:report.errors,console:report.console,success:true,output}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
