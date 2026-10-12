/* 재현: BOOK_URL=http://127.0.0.1:8765/books/transformer/ node books/transformer/tests/browser.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const URL=process.env.BOOK_URL||'http://127.0.0.1:8765/books/transformer/';
const output=process.env.BOOK_EVIDENCE||path.resolve(__dirname,'../docs/evidence');
const report={url:URL,date:'2026-10-12',views:[],labs:[],errors:[]};
async function frame(page,width,id){
 await page.setViewportSize({width,height:900});await page.goto(URL+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,returnVisible:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width}));
 assert.ok(dimensions.scroll<=width,`${id}: overflow ${dimensions.scroll}/${width}`);assert.ok(dimensions.returnVisible);
 report.views.push({width,id,...dimensions});
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();assert.ok(before.length>20);
 const presetCount=await lab.locator('[data-preset]').count();
 for(let n=0;n<presetCount;n++){
  const button=lab.locator('[data-preset]').nth(n);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.doesNotMatch(await lab.locator('.readout').innerText(),/NaN|undefined|Infinity/);
 }
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 const set=(c,v)=>lab.locator('#'+c.id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v==='on';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?['on','off']:c.type==='text'?['곰 집','']:[c.min,c.max];
 for(const c of controls){
  await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
  const initial=await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText();
  for(const val of values(c)){
   await set(c,val);
   assert.doesNotMatch(await lab.locator('.readout').innerText(),/NaN|undefined|Infinity/);
  }
  const final=await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText();
  // 마지막 값이 초기값과 같으면 다른 경계값으로 화면 반응을 확인한다.
  if(final===initial){
   await set(c,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?'on':c.type==='text'?'토끼 먹이':c.min);
   assert.notEqual(await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText(),initial,c.id+' has no visible effect');
  }
 }
 await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();assert.equal(await lab.locator('.readout').innerText(),before);
 report.labs.push({width,id,controls:controls.length,presets:presetCount,reset:true});
}
async function run(){
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,args:["--no-sandbox"]});
 try{
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(URL);const chapters=await page.evaluate(()=>TBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer?c.transfer[2]:null,labs:c.labs})));
 for(const width of [1280,390,320]){
  await frame(page,width,'home');
  const homeBefore=await page.locator('.home-result').innerText();await page.getByRole('button',{name:'두 번째 숲',exact:true}).click();assert.notEqual(await page.locator('.home-result').innerText(),homeBefore);
  for(const c of chapters){
   await frame(page,width,c.id);
   for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);
   await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
   await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
   if(c.transfer!==null){await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);await page.locator(`[data-transfer="${(c.transfer+1)%3}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^다시 생각/);assert.match(await page.locator('.chapter-head .caption').innerText(),/확인 문제 2개/);}
  }
 }
 await frame(page,1280,'home');await page.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'home-desktop.png'),fullPage:false});
 await frame(page,1280,'induction');await page.locator('#lab-repeat').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'repeat-desktop.png')});
 await frame(page,1280,'stream');await page.locator('.concept-diagram').screenshot({path:path.join(output,'stream-figure.png')});
 await frame(page,1280,'patch');await page.locator('#lab-patching').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'patching-desktop.png')});
 await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-patching').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'patching-theme.png')});
 await frame(page,320,'multihead');await page.locator('#lab-heads').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'heads-mobile.png')});
 await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await frame(page,320,'training');await page.locator('#lab-timeline').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,'timeline-mobile.png')});
 const slider=page.locator('#lab-timeline input[type=range]').first(),keyboardBefore=await page.locator('#lab-timeline .readout').innerText();await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#lab-timeline .readout').innerText(),keyboardBefore);
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
 assert.equal(report.errors.length,0);report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,errors:report.errors,success:true}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
