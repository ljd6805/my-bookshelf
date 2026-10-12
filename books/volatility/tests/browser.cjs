/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms)을 본다. 서가 삽화와 표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/volatility/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'volatility-evidence');
const report={date:'2026-10-12',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[]};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 returns:['−50.00%','+50.00%','0.00%','−25.00%','−0.693','+0.405','−0.288'],
 reset:['−1.478%','0.99956','94.61','−5.39%','−15.33%'],
 ruler:['15.5%','36.4%','35.3%','370원','1,510원','675.9원','735.5원','+60원','301.5원','1.58%'],
 coin:['142.37','+42.4%','−9.5%','15.8%','70개(35.0%)'],
 tails:['1.01%','2.5일','2.1','−3.33%','0.25%','0.6일','−2.77%','0.27%','−7.40%','−3.30σ','−0.63'],
 acf:['+0.435','±0.180','−0.79','+0.81'],
 vratio:['0.141','1.453','1.041'],
 crossing:['8.9회','24.7회','51.6회'],
 underwater:['−25.8%','74일째','21,300원','181일째','15,810원','+34.7%','176거래일','+25.0%'],
 records:['100.02','95.97','−4.03%','+0.04%','1.29%','20.4%','0.0414','0.9598','0.9597','−24.0%','−43.0%','35.3%','301.5원','1.58%','+0.362','±0.124','1.02','0.15','0.344','−3.50','322회','−25.8%','0개 (0.0%)','85개 (8.5%)','731개 (73.1%)']
};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자]. */
const PRESETS={
 returns:[[1,['+20.00%','−25.00%','−10.00%']],[2,['3.398%','3.342%','−0.2147','−19.32%']]],
 reset:[[0,['−2.45%']],[1,['−9.34%']],[2,['−15.33%','3배와 인버스 2배의 끝 값이 같습니다']]],
 ruler:[[1,['36.4%']],[2,['35.3%']]],
 coin:[[1,['31.6%','70개']],[2,['711개']]],
 tails:[[1,['0.25%','−2.77%']],[2,['1.60%','14.7']]],
 acf:[[1,['+0.283','99.7%']],[2,['−0.109','40.0%']],[3,['+0.362','±0.124','0.95']]],
 vratio:[[0,['1.453']],[1,['1.041']],[2,['5.6%']],[3,['0.685']]],
 crossing:[[0,['24.7회']],[1,['51.6회']],[2,['20.3회']],[3,['322회','256회','10회','56회','19회']]],
 underwater:[[0,['−1.478%','−8.15%','−17.76%']],[1,['−16.3%','−11.8%','−7.9%']],[3,['+100.0%']]],
 records:[[1,['+0.435','0.141']],[2,['+0.103','0.955']]]
};
/* 예측 질문(L2) 사례: 입력을 바꾸면 보고서의 답이 나와야 한다. */
const L2={
 returns:[{rsrc:'manual',rprices:'100, 80, 100'},['산술 평균은 +2.50%','기간 전체 0.00%']],
 reset:[{da:2.5},['−14.15%']],
 ruler:[{matr:5},['675.5원','842.4원','+167원']],
 coin:[{cband:'far20'},['41개(20.5%)']],
 tails:[{tnu:30},['0.39%']],
 acf:[{akappa:.05},['−0.036','8.7%']],
 vratio:[{vq:5,vkappa:.05,vpaths:'1000'},['8.1%','0.911']],
 crossing:[{xvol:2},['8.9회']],
 underwater:[{udays:'1000'},['−29.7%']],
 records:[{fk:'-2'},['88.29']]
};
const FIGURES={drag:['−5.39%'],final:['95.97']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/volatility/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
const has=(text,list,msg)=>list.forEach(s=>assert.ok(text.includes(s),`${msg}: missing ${s} in ${text}`));
async function frame(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>{const r=document.querySelector('header [data-shelf-return]')?.getBoundingClientRect();return {scroll:document.documentElement.scrollWidth,returnVisible:!!r&&r.width>0&&r.right<=innerWidth,figure:!!document.querySelector('.figure-art svg')};});
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.returnVisible,`${id}: shelf return hidden`);
 if(id!=='home')assert.ok(d.figure,`${id}: no .figure-art`);
 if(FIGURES[id])has(await page.locator('.concept-diagram figcaption').innerText(),FIGURES[id],`${id} figure caption`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
const reset=lab=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
/* 다시 계산에 걸린 시간: 실험 상자(.lab-inner)의 data-ms. 실험마다 가장 오래 걸린 값을 남긴다. */
async function timed(lab,id){const ms=Number(await lab.locator('.lab-inner').getAttribute('data-ms'));report.timing[id]=Math.max(report.timing[id]||0,ms);assert.ok(ms<SLOW_MS,`${id}: recompute took ${ms}ms`);}
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},String(v));};
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');await timed(lab,id);const t=await lab.locator('.readout').innerText();assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);}
 return n;
}
async function l2(lab,width,id){
 await reset(lab);const [values,want]=L2[id];
 for(const [k,v] of Object.entries(values)){await setValue(lab,k,v);await timed(lab,id);}
 const t=await lab.locator('.readout').innerText();has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();has(before,DEFAULTS[id],id);assert.doesNotMatch(before,BAD,id);
 assert.match(before,/실제 계산/,`${id}: result is labelled`);
 const presetCount=await presets(lab,id);await l2(lab,width,id);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:[c.min,c.max];
 for(const c of controls){
  await reset(lab);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
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
/* 삽화의 글자 상자가 viewBox 안에 있는지 잰다. 서가에서는 320px 화면에서도 같은 viewBox 비율로 줄어들 뿐이므로 viewBox 안이면 잘리지 않는다. */
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  /* 표지 삽화는 서가가 공통 reader.css(cv-* 클래스, 8.5px 고정폭 글꼴)로 그리므로 같은 스타일을 입혀 잰다. */
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  for(const t of r.texts)assert.ok(t.x>=0&&t.y>=0&&t.r<=r.vb[0]&&t.b<=r.vb[1],`${file}: "${t.text}" outside viewBox ${JSON.stringify(t)}`);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 const still=await page.evaluate(()=>getComputedStyle(document.querySelector('.vo-ill-two')).animationName);assert.equal(still,'none','shelf art stops under reduced motion');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 const moving=await page.evaluate(()=>getComputedStyle(document.querySelector('.vo-ill-two')).animationName);assert.equal(moving,'vo-ill-draw','shelf art animates');
}
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['drag','reset'],['walk','coin'],['revert','acf'],['trend','vratio'],['final','records']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'cross');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-crossing'),'crossing-theme.png');await shot(page.locator('.concept-diagram'),'cross-figure-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,390,'drag');const slider=page.locator('#da'),kb=await page.locator('#lab-reset .readout').innerText();await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#lab-reset .readout').innerText(),kb,'keyboard slider');assert.match(await page.locator('#lab-reset .readout').innerText(),/하루 \+1\.7%/);
 await page.fill('#guess-reset','약 −14%');await page.locator('#lab-reset summary').click();await page.waitForFunction(()=>/내 예측: 약 −14%/.test(document.querySelector('#lab-reset .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,320,'tails');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});
  await page.goto(url);const chapters=await page.evaluate(()=>VBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/100\.00으로 제자리[\s\S]*94\.61[\s\S]*−5\.39%/);await page.getByRole('button',{name:'2%',exact:true}).click();assert.match(await page.locator('.home-result').innerText(),/−9\.34%/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await extras(page,url);await artCheck(page,url);
  const consoleErrors=report.console.filter(t=>!/favicon|404|review\.json/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,timing:report.timing,art:report.art,errors:report.errors,console:report.console,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
