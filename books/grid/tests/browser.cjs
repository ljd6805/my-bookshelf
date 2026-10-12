/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고 가로 넘침과 콘솔 오류를 본다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/grid/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'grid-evidence');
const report={date:'2026-10-12',views:[],labs:[],l2:[],errors:[],console:[]};
const BAD=/NaN|undefined|Infinity/;
/* 기본값에서 결과 문장에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 ladder:['매수 2번','매도 1번','매도 대기 1칸','19,800원 칸','주문 없음 10칸'],
 cellpl:['14원','15원','200원','229원','771원','19,850원','50원'],
 spacing:['200원','0.92%~1.11%','+15,399원','1,990,289원'],
 range:['200원','1,990,289원','1,009,711원','0.000%'],
 box:['50번','+38,614원','1,436원','9,950원'],
 rally:['52번','+105,927원','2,096,216원','139개','+489,753원','11거래일째'],
 slide:['12칸 60주','19,100원','19,102.8원','−204,766원','+21,973원','−182,793원','1,127,359원','8칸','10칸 50주','18,900원','−145,136원'],
 gap:['19,500원','2칸','+1,274원','+1,986원','+774원','+486원'],
 ledger:['866,096원','941,400원','1,807,496원','+21,973원','−204,766원','1,805,473원','−9.18%'],
 capital:['7주','1,990,289원','1,009,711원','393,729원','19.8%'],
 compare:['+105,927원','5.32%','+489,753원','24.61%','+252,415원','+230,866원'],
 exit:['12거래일째','17,940원','16거래일째','−76,449원','106,344원','19거래일째','16,960원','−108,765원','8,765원','1,790,259원'],
 final6m:['138번','+107,080원','17칸 85주','−232,086원','−125,006원','452,583원','1,542,312원','280개','−262,706원']
};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자]. */
const PRESETS={
 ladder:[[1,['매수 3번','주문 없음 7칸']]],
 cellpl:[[2,['159원','80원']],[3,['10원']]],
 spacing:[[1,['180~250원','0.92%~1.20%','+15,419원','1,983,488원','20,900→21,150원 250원','21,550→21,800원 250원']]],
 range:[[1,['3,990,579원','990,579원']],[2,['400원','1,980,288원','+35,378원']]],
 box:[[1,['99번','+27,009원']],[2,['132번','+101,686원','+77,967원']]],
 rally:[[1,['43번','+93,940원','11거래일째']]],
 slide:[[1,['10칸 50주','18,900원','−145,136원']],[2,['−195,136원']]],
 gap:[[1,['13,930원','696,600원','10칸']]],
 ledger:[[1,['3.92%','12.76%']],[2,['5.60%','18.55%']]],
 capital:[[1,['2,786,408원','213,592원','551,224원','−205,601원']],[2,['493,514원']]],
 compare:[[1,['−182,793원','−426,987원','−251,757원','−223,030원','6,293원','−9.08%','−20.65%']],[2,['−177,435원','935원']]],
 exit:[[1,['−106,377원']]],
 final6m:[[1,['1,790,259원','1,462,294원','1,862,247원','−128,042원']],[2,['88거래일째','−53,402원']],[3,['−142,174원','94거래일째','−105,116원']]]
};
/* 예측 질문(L2) 사례: 입력을 바꾸면 보고서의 답이 나와야 한다. */
const L2={
 ladder:[{lapath:'19900, 19100',lanext:19700},['매수 4번','매도 2번','매도 대기 2칸','19,600원 · 19,800원']],
 cellpl:[{cbuy:21800,cstep:50,cqty:5},['정확히 0원','가장 좁은 간격은 100원']],
 spacing:[{smode:'geo',scells:40},['20,900→21,050원 150원','21,650→21,800원 150원']],
 range:[{rlo:19000,rhi:21000,rcells:20},['28.125%','아래 90개','위 90개']],
 box:[{bstep:'400'},['25번','+44,280원']],
 rally:[{rstart:'empty'},['+59,390원']],
 slide:[{spath:'straight',sto:18900},['5칸 25주','19,400원','−12,570원']],
 gap:[{gclose:19900,gopen:19300,gback:19900},['3칸','+3,550원','+1,550원']],
 ledger:[{lgpath:'box',lgden:'limit'},['2.60%','8.35%']],
 capital:[{kqty:6,kfall:17000},['352,735원']],
 compare:[{mpath:'box',mparts:4,mevery:20,mreb:20},['+77,967원','−9,207원','−8,928원','−4,557원']],
 exit:[{xlimit:50000},['−53,263원','3,263원']],
 final6m:[{flo:16000,fhi:24000},['72번','−7,601원','0개']]
};
const FIGURES={box:['38,614원'],final:['−125,006원']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/grid/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
const has=(text,list,msg)=>list.forEach(s=>assert.ok(text.includes(s),`${msg}: missing ${s} in ${text}`));
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
const reset=lab=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
const setValue=(lab,id,v)=>lab.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},String(v));
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');const t=await lab.locator('.readout').innerText();assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);}
 return n;
}
async function l2(lab,width,id){
 await reset(lab);const [values,want]=L2[id];
 for(const [k,v] of Object.entries(values))await setValue(lab,k,v);
 const t=await lab.locator('.readout').innerText();has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();has(before,DEFAULTS[id],id);assert.doesNotMatch(before,BAD,id);
 const presetCount=await presets(lab,id);await l2(lab,width,id);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:[c.min,c.max];
 for(const c of controls){
  await reset(lab);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await setValue(lab,c.id,c.tag==='SELECT'?c.options[0]:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>x.type==='number'||x.type==='text')){await reset(lab);await setValue(lab,c.id,'');assert.match(await lab.locator('.readout').innerText(),/✗ .*확인해 주세요/,`${id}:${c.id} empty`);}
 await reset(lab);assert.equal(await lab.locator('.readout').innerText(),before,`${id}: reset`);
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
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['rule','ladder'],['spacing','spacing'],['box','box'],['compare','compare'],['final','final6m']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'gap');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-gap'),'gap-theme.png');await shot(page.locator('.concept-diagram'),'gap-figure-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,390,'rule');const slider=page.locator('#lanext'),kb=await page.locator('#lab-ladder .readout').innerText();await slider.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');assert.notEqual(await page.locator('#lab-ladder .readout').innerText(),kb,'keyboard slider');assert.match(await page.locator('#lab-ladder .readout').innerText(),/19,500 → 19,700원/);
 await page.fill('#guess-ladder','매수 4번, 매도 2번');await page.locator('#lab-ladder summary').click();await page.waitForFunction(()=>/내 예측: 매수 4번, 매도 2번/.test(document.querySelector('#lab-ladder .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,320,'gap');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});
  await page.goto(url);const chapters=await page.evaluate(()=>GBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/2칸이 사지고 그중 1칸이 팔립니다[\s\S]*\+774원/);await page.getByRole('button',{name:'18,000원',exact:true}).click();assert.match(await page.locator('.home-result').innerText(),/10칸이 사지고/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await extras(page,url);
  const consoleErrors=report.console.filter(t=>!/favicon|404|review\.json/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,errors:report.errors,console:report.console,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
