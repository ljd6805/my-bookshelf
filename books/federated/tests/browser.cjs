/* 재현: (저장소 루트에서) python3 -m http.server 8781 을 띄운 뒤
   BOOK_URL=http://127.0.0.1:8793/books/federated/ PW_EXECUTABLE_PATH=<chromium 경로> node books/federated/tests/browser.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const URL=process.env.BOOK_URL||'http://127.0.0.1:8793/books/federated/';
const output=process.env.BOOK_EVIDENCE||path.resolve(__dirname,'../docs/evidence');
const report={url:URL,date:'2026-10-19',views:[],labs:[],errors:[]};
const BAD=/NaN|undefined|Infinity|null/;
async function frame(page,width,id){
 await page.setViewportSize({width,height:900});await page.goto(URL+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const dimensions=await page.evaluate(()=>{const r=document.querySelector('header [data-shelf-return]')?.getBoundingClientRect();return {width:innerWidth,scroll:document.documentElement.scrollWidth,returnVisible:!!(r&&r.width>0&&r.right<=innerWidth&&r.height>=24)};});
 assert.ok(dimensions.scroll<=width,`${id}: overflow ${dimensions.scroll}/${width}`);assert.ok(dimensions.returnVisible,id+': shelf return button not fully visible');
 report.views.push({width,id,...dimensions});
}
async function labCheck(lab,width,id){
 const settle=()=>lab.locator('.readout:not([aria-busy])').waitFor({timeout:60000});await settle();
 const before=await lab.locator('.readout').innerText();assert.ok(before.length>20,id);
 const presetCount=await lab.locator('[data-preset]').count();assert.ok(presetCount>=3,id+' presets');
 for(let n=0;n<presetCount;n++){
  const button=lab.locator('[data-preset]').nth(n);await button.click();await settle();assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.doesNotMatch(await lab.locator('.readout').innerText(),BAD,id+' preset '+n);
 }
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.filter(e=>!e.disabled).map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 const set=async(c,v)=>{await lab.locator('#'+c.id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v==='on';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);await settle();};
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?['on','off']:c.type==='text'?['ㅋㅋㅋ','','abc','가'.repeat(40)]:[c.min,c.max];
 for(const c of controls){
  await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();await settle();
  const initial=await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText();
  for(const val of values(c)){
   await set(c,val);
   assert.doesNotMatch(await lab.locator('.readout').innerText(),BAD,`${id} #${c.id}=${val}`);
  }
  const final=await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText();
  if(final===initial){
   await set(c,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?'on':c.type==='text'?'응응':c.min);
   assert.notEqual(await lab.locator('.chart').innerHTML()+await lab.locator('.readout').innerText(),initial,c.id+' has no visible effect');
  }
 }
 await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();await settle();assert.equal(await lab.locator('.readout').innerText(),before,id+' reset');
 report.labs.push({width,id,controls:controls.length,presets:presetCount,reset:true});
}
async function run(){
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))report.errors.push(m.text());});
 await page.goto(URL);const chapters=await page.evaluate(()=>FLBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer?c.transfer[2]:null,labs:c.labs})));
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
 for(const width of [1280,390,320]){
  await frame(page,width,'home');
  const homeBefore=await page.locator('.home-result').innerText();await page.getByRole('button',{name:'4라운드',exact:true}).click();assert.notEqual(await page.locator('.home-result').innerText(),homeBefore);
  for(const c of chapters){
   await frame(page,width,c.id);
   assert.ok(await page.locator('.concept-diagram svg').count()>=1,c.id+' figure');
   for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);
   await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
   await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
   if(c.transfer!==null){await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);await page.locator(`[data-transfer="${(c.transfer+1)%3}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^다시 생각/);}
  }
 }
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png'),fullPage:false});
 await frame(page,1280,'fedavg');await shot(page.locator('#lab-fedavg'),'fedavg-desktop.png');
 await frame(page,1280,'secagg');await shot(page.locator('.concept-diagram'),'secagg-figure.png');
 await frame(page,1280,'final');await shot(page.locator('#lab-final'),'final-desktop.png');
 await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-final'),'final-theme.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,390,'noniid');await shot(page.locator('#lab-drift'),'drift-mobile.png');
 await frame(page,320,'home');await page.screenshot({path:path.join(output,'home-320.png'),fullPage:false});
 await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await frame(page,320,'dp');await shot(page.locator('#lab-dp'),'dp-mobile.png');
 const slider=page.locator('#lab-dp input[type=range]').first(),keyboardBefore=await page.locator('#lab-dp .readout').innerText();await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.waitForTimeout(400);assert.notEqual(await page.locator('#lab-dp .readout').innerText(),keyboardBefore);
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
 assert.equal(report.errors.length,0,report.errors.join('\n'));report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,errors:report.errors,success:true}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
