/* 실제 브라우저 검사: 1280·390·320px에서 표지와 모든 장을 열고, 실험마다 예제·경계값·초기화, 확인 문제, 가로 넘침, 서가로 버튼을 확인한다.
   재현: 루트에서 python3 -m http.server 8765 후 BOOK_URL=http://127.0.0.1:8765/books/aie-llm-apps/ node books/aie-llm-apps/tests/browser.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const URL=process.env.BOOK_URL||'http://127.0.0.1:8765/books/aie-llm-apps/';
const output=process.env.BOOK_EVIDENCE||path.resolve(__dirname,'../docs/evidence');
const report={url:URL,date:'2026-10-08',views:[],labs:[],errors:[]};
const bad=/NaN|undefined|Infinity|\[object/;
async function frame(page,width,id){
 await page.setViewportSize({width,height:900});await page.goto(URL+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,returnVisible:!!document.querySelector('header [data-shelf-return]')?.getBoundingClientRect().width,figures:document.querySelectorAll('.figure-art svg').length}));
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.returnVisible,'shelf return hidden');
 if(id!=='home')assert.equal(d.figures,1,id+' figure');
 report.views.push({width,id,...d});
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();assert.ok(before.length>15,id+' readout');assert.doesNotMatch(before,bad);
 const presets=await lab.locator('[data-preset]').count();
 for(let n=0;n<presets;n++){const b=lab.locator('[data-preset]').nth(n);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');assert.doesNotMatch(await lab.locator('.readout').innerText(),bad,id);}
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.filter(e=>e.id).map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls){
  if(c.type==='checkbox'||c.type==='text')continue;
  for(const v of c.tag==='SELECT'?c.options:[c.min,c.max]){await lab.locator('#'+c.id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);assert.doesNotMatch(await lab.locator('.readout').innerText(),bad,id+' '+c.id+'='+v);}
 }
 await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();assert.equal(await lab.locator('.readout').innerText(),before,id+' reset');
 report.labs.push({width,id,controls:controls.length,presets,reset:true});
}
async function run(){
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(URL);const prefix=await page.evaluate(()=>Object.keys(window).find(k=>/Book$/.test(k)&&window[k].chapters).replace(/Book$/,''));
  const chapters=await page.evaluate(p=>window[p+'Book'].chapters.map(c=>({id:c.id,answer:c.quiz[2],labs:c.labs})),prefix);
  for(const width of [1280,390,320]){
   await frame(page,width,'home');
   const home=page.locator('.hero-lab');const hb=await home.locator('[role=status]').innerText();const btns=home.locator('button');
   if(await btns.count()){await btns.last().click();await btns.first().click();}
   assert.doesNotMatch(await home.locator('[role=status]').innerText(),bad);assert.ok(hb.length>3);
   for(const c of chapters){
    await frame(page,width,c.id);
    for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);
    await page.locator('[data-answer]').nth(c.answer).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
    await page.locator('[data-answer]').nth((c.answer+1)%3).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
   }
  }
  const shot=(n)=>path.join(output,n);const hide={style:'header,.skip{visibility:hidden!important}'};
  await frame(page,1280,'home');await page.screenshot({...hide,path:shot('home-desktop.png')});
  await frame(page,1280,chapters[0].id);await page.locator('.concept-diagram').screenshot({...hide,path:shot('figure-desktop.png')});
  await page.locator('.lab').first().screenshot({...hide,path:shot('lab-desktop.png')});
  await page.getByRole('button',{name:'밝은 화면으로 전환'}).click();await page.locator('.lab').first().screenshot({...hide,path:shot('lab-light.png')});
  await frame(page,320,chapters[chapters.length-1].id);await page.locator('.lab').first().screenshot({...hide,path:shot('lab-mobile.png')});
  await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
  await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
  assert.deepEqual(report.errors,[]);report.success=true;
  fs.writeFileSync(shot('browser-results.json'),JSON.stringify({...report,views:report.views.length,labs:report.labs.length},null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,errors:report.errors,success:true}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
