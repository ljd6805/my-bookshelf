/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역을 본다. 서가 삽화와 표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/bonds/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'bonds-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[]};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. CHART는 그림·표 쪽 글자. */
const DEFAULTS={
 'who-pays':['5.97%','6.0%','4.793%','59.66%','0.583%','0.6%','4.79%','실제 계산'],
 ladder:['3.240%','3.763%','4.200%','3.961%','4.376%','2026-10-22','미리 정한 가상 시나리오','교육용 모형, 예측이 아님'],
 cashflow:['193.75원','10,193.75원','11,162.50원','1,162.50원','실제 계산'],
 price:['9,975.90원','할인 채권','▼','3.961%','실제 금리를 가상 채권에 넣은 값'],
 sensitivity:['−2.76%','−7.63%','−9.30%','−2.81%','−8.00%','−7.62%','D 2.86년','D 8.17년','D_mod 9.79','+8.39%','시각적 비유'],
 'curve-board':['교육용 모형, 예측이 아님','3.450%','3.763%','4.200%','정상 곡선','↗','+0.93%p','모형과 맞춘 것이 아니므로','4.376%'],
 spread:['5.061%','9,983.22원','9,975.90원','1.83%','약 84%','실제 금리를 가상 채권에 넣은 값'],
 gordon:['40.00','20.0','8.00','50.00','+25.0%','33.33','−16.7%'],
 routes:['9,975.90원','11,162.50원','9,983.62원','387.50원','+3.96%'],
 'final-table':['계산 편의, 권유 아님','3.346%','3.725%','3.664%','−0.06%','+4.17%','+3.76%','+4.85%','+3.5%','+8.0%','+4.86%','+6.50%','+1.88%','486,000원','교육용 모형, 예측이 아님']
};
const CHART={ladder:['6.330%','4.660%','3.180%'],'curve-board':['모형과 맞춘 것 아님','실제 10-07'],'final-table':['10,149.85원','10,642.11원','10,154.05원','41.20','2,000,000원'],sensitivity:['8.08원']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'who-pays':[[0,['4.72%','4.329%']],[1,['8.14%','4.950%']],[2,['4.03%','3.881%']]],
 ladder:[[0,['3.971%','4.221%','3.465%','1개월 뒤']],[1,['3.554%','3.513%','−0.04%p']],[2,['3.138%','3.721%','올랐습니다']]],
 cashflow:[[0,['225.00원','14,500.00원']],[1,['250.00원','11,500.00원']],[2,['10,000.00원','할인채']]],
 price:[[0,['10,249.25원','할증 채권','▲']],[1,['10,000.00원','액면가 채권']],[2,['9,690.17원','할인 채권']],[3,['77.71원','10,054.68원','9,976.97원']]],
 sensitivity:[[1,['+8.39%','+2.85%','+10.31%']],[2,['−14.57%','−15.99%','−14.47%']]],
 'curve-board':[[0,['3.346%','3.725%','+1.18%','+3.90%']],[1,['3.138%','3.488%']],[2,['3.971%','4.438%']],[3,['3.700%','4.179%','4.675%','−1.16%','−3.72%','−4.54%']],[4,['3.024%','1.942%','−1.08%p','역전 곡선','↘']]],
 spread:[[0,['10,098.63원','1.14%']],[1,['9,846.94원','−1.37%']],[2,['9,846.94원','9,837.15원','−1.39%']]],
 gordon:[[0,['50.00']],[1,['44.44']],[2,['400.00','200.0']]],
 routes:[[0,['9,983.62원','+3.96%']],[1,['9,795.63원','+2.08%','−1.88%','−0.96%']],[2,['10,176.23원','+5.89%']]],
 'final-table':[[0,['+6.50%','+1.87%p']],[1,['−3.63%p','+1.88%']],[2,['+3.84%','+8.23%']]]
};
/* 예측 질문(L2) 사례: [먼저 누를 비교 예제 번호 또는 null, 바꿀 입력, 결과 문장에 나와야 할 답]. */
const L2={
 'who-pays':[null,{wtotal:23.58,wyears:5},['4.325%','4.72%']],
 ladder:[null,{lexp:-.5,ldb:-.25,lafter:0},['3.346%','3.513%','+0.17%p','3.725%','3.950%','올랐습니다']],
 cashflow:[null,{ccoupon:5,cyears:3,cfreq:'1'},['500.00원','1,500.00원']],
 price:[null,{pbond:'nara10',pyield:3.5},['10,837.64원','할증 채권']],
 sensitivity:[null,{sdy:3},['−20.88%','−23.99%','−20.55%']],
 'curve-board':[2,{kbase:3.25,kchg:0},['4.4375%','4.4500%','+0.0125%p','4.013%','한 번 인상']],
 spread:[null,{sspr:3},['9,477.20원','5.00%']],
 gordon:[null,{gg:5},['66.67','100.00','+50.0%','33.3']],
 routes:[null,{rhold:'sell1',rdy:1},['−1.88%','−0.96%']],
 'final-table':[null,{fbranch:'c',fspr:.5},['+2.98%','−1.86%p','+3.91%']]
};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={pprice:{pmode:'p2y'},gk:{gmove:true}};
const FIGURES={rate:['59.66%'],price:['9,975.90원'],curve:['3.763%'],final:['+4.17%']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/bonds/`;
 for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 return {url,stop:()=>proc.kill()};
}
const has=(text,list,msg)=>list.forEach(s=>assert.ok(text.includes(s),`${msg}: missing ${s} in ${text}`));
async function frame(page,url,width,id){
 await page.setViewportSize({width,height:900});await page.goto(url+'#'+id);
 await page.locator(id==='home'?'.hero':'.chapter-head').waitFor();
 const d=await page.evaluate(()=>{const r=document.querySelector('header [data-shelf-return]')?.getBoundingClientRect();return {scroll:document.documentElement.scrollWidth,returnVisible:!!r&&r.width>0&&r.right<=innerWidth&&r.left>=0,figure:!!document.querySelector('.figure-art svg')};});
 assert.ok(d.scroll<=width,`${id}@${width}: overflow ${d.scroll}`);assert.ok(d.returnVisible,`${id}: shelf return hidden`);
 if(id!=='home')assert.ok(d.figure,`${id}: no .figure-art`);
 if(FIGURES[id])has(await page.locator('.concept-diagram figcaption').innerText(),FIGURES[id],`${id} figure caption`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
const allText=lab=>lab.evaluate(l=>l.querySelector('.chart').textContent+' '+l.querySelector('.readout').innerText);
const reset=lab=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
async function timed(lab,id){const ms=Number(await lab.locator('.lab-inner').getAttribute('data-ms'));report.timing[id]=Math.max(report.timing[id]||0,ms);assert.ok(ms<SLOW_MS,`${id}: recompute took ${ms}ms`);}
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){await reset(lab);const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');await timed(lab,id);const t=await allText(lab);assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);}
 return n;
}
async function l2(lab,width,id){
 await reset(lab);const [pre,values,want]=L2[id];
 if(pre!==null)await lab.locator('[data-preset]').nth(pre).click();
 for(const [k,v] of Object.entries(values)){await setValue(lab,k,v);await timed(lab,id);}
 const t=await lab.locator('.readout').innerText();has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
async function tables(lab,id){
 const t=await lab.locator('.table-wrap').evaluateAll(els=>els.map(e=>({tab:e.getAttribute('tabindex'),role:e.getAttribute('role'),label:e.getAttribute('aria-label')||'',over:e.scrollWidth>e.clientWidth+1,overflow:getComputedStyle(e).overflowX})));
 for(const x of t){assert.equal(x.tab,'0',`${id}: table tabindex`);assert.equal(x.role,'region',`${id}: table role`);assert.ok(x.label.length>4,`${id}: table label`);assert.ok(!x.over||/auto|scroll/.test(x.overflow),`${id}: table overflow without scroll`);}
 return t.length;
}
async function labCheck(lab,width,id){
 const before=await lab.locator('.readout').innerText();has(before,DEFAULTS[id],id);assert.doesNotMatch(before,BAD,id);
 if(CHART[id])has(await allText(lab),CHART[id],id+' chart');
 assert.match(before,/실제 계산|교육용 모형|가상 시나리오|시각적 비유/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 const presetCount=await presets(lab,id);await l2(lab,width,id);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?[false,true]:[c.min,c.max];
 const ctx=async c=>{for(const [k,v] of Object.entries(CONTEXT[c.id]||{}))await setValue(lab,k,v);};
 for(const c of controls){
  await reset(lab);await ctx(c);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await setValue(lab,c.id,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?false:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>x.type==='number'||x.type==='text')){await reset(lab);await ctx(c);await setValue(lab,c.id,'');assert.match(await lab.locator('.readout').innerText(),/✗ .*확인해 주세요/,`${id}:${c.id} empty`);}
 await reset(lab);assert.equal(await lab.locator('.readout').innerText(),before,`${id}: reset`);
 report.labs.push({width,id,controls:controls.length,presets:presetCount,tables:nTables,reset:true});
}
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
}
/* 오류 상태: 실험마다 하나씩, 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다. */
async function errorStates(page,url){
 const cases=[['price','price',async l=>{await setValue(l,'pmode','p2y');await setValue(l,'pprice',0);},/✗ 가격을 확인해 주세요.*0보다 큰/],['price','price',async l=>{await setValue(l,'pmode','p2y');await setValue(l,'pprice',100);},/✗ 가격을 확인해 주세요.*찾지 못함/],['price','price',async l=>{await setValue(l,'pmode','p2y');await setValue(l,'pprice',1e9);},/찾지 못함/],['price','price',async l=>{await setValue(l,'pmode','y2p');await setValue(l,'pbond','zero3');await setValue(l,'pyield',0);},/10,000\.00원[\s\S]*할인되지 않아 액면과 같습니다/],['equity','gordon',async l=>{await setValue(l,'gr',11.75);await setValue(l,'gg',11.5);},/800\.00/],['equity','gordon',async l=>{await setValue(l,'gr',8);await setValue(l,'gg',8);},/✗ 성장률 g를 확인해 주세요.*g ≥ r/],['equity','gordon',async l=>{await setValue(l,'gg',7.5);},/400\.00[\s\S]*값을 낼 수 없습니다/],['duration','sensitivity',async l=>{for(const k of ['sn3','sn10','sz10'])await setValue(l,k,false);},/✗ 채권 선택/],['rate','who-pays',async l=>{await setValue(l,'wtotal',-100);},/✗ 총수익/],['bond','cashflow',async l=>{await setValue(l,'cyears',2.5);},/✗ 만기/],['price','price',async l=>{await setValue(l,'pmode','p2y');await setValue(l,'pprice',9800);},/4\.596%/]];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await act(lab);assert.match(await lab.locator('.readout').innerText(),re,`${id} error state ${re}`);}
}
/* 삽화의 글자 상자가 viewBox 안에 있는지 잰다. */
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:120,160,220;--edge:40,90,170">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  for(const t of r.texts)assert.ok(t.x>=0&&t.y>=0&&t.r<=r.vb[0]&&t.b<=r.vb[1],`${file}: "${t.text}" outside viewBox ${JSON.stringify(t)}`);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 const still=await page.evaluate(()=>{const g=getComputedStyle(document.querySelector('.bo-ill-long'));return [g.animationName,g.transform];});assert.equal(still[0],'none','shelf art stops under reduced motion');assert.notEqual(still[1],'none','reduced motion shows the tilted state');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 const moving=await page.evaluate(()=>[getComputedStyle(document.querySelector('.bo-ill-long')).animationName,getComputedStyle(document.querySelector('.bo-ill-short')).animationName]);assert.deepEqual(moving,['bo-ill-tilt-l','bo-ill-tilt-s'],'shelf art animates');
 await page.waitForTimeout(3200);await page.screenshot({path:path.join(output,'shelf-illustration-tilted.png')});
}
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['transmit','ladder'],['price','price'],['duration','sensitivity'],['curve','curve-board'],['credit','spread'],['final','final-table']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'curve');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-curve-board'),'curve-board-dark.png');await shot(page.locator('.concept-diagram'),'curve-figure-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 /* 키보드: 슬라이더 방향키, 비교 기준 고정, 창구 탭 방향키, 충격 버튼 */
 await frame(page,url,390,'curve');const slider=page.locator('#kchg');await slider.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');assert.match(await page.locator('#lab-curve-board .readout').innerText(),/3\.346%[\s\S]*3\.725%/,'keyboard slider');
 await page.getByRole('button',{name:'지금 곡선을 비교 기준으로'}).click();assert.match(await page.locator('#lab-curve-board .readout').innerText(),/비교 기준\(고정한 곡선\)과 같은 곡선/);
 await page.fill('#guess-curve-board','약 +0.01%p');await page.locator('#lab-curve-board summary').click();await page.waitForFunction(()=>/내 예측: 약 \+0\.01%p/.test(document.querySelector('#lab-curve-board .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,390,'holding');await page.locator('#tab-otc').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-krx').getAttribute('aria-selected'),'true');assert.match(await page.locator('#tabp-routes').innerText(),/한국거래소/);
 await frame(page,url,390,'credit');await page.getByRole('button',{name:'스프레드 +0.5%p'}).click();assert.match(await page.locator('#lab-spread .readout').innerText(),/9,846\.94원/);await page.getByRole('button',{name:'국채 금리 +0.5%p'}).click();assert.match(await page.locator('#lab-spread .readout').innerText(),/4\.461%/);
 await frame(page,url,320,'credit');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});
  await page.goto(url);const chapters=await page.evaluate(()=>BBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/9,700\.71원[\s\S]*−2\.76%[\s\S]*9,329\.17원[\s\S]*−7\.63%/);await page.getByRole('button',{name:'+2%p',exact:true}).click();assert.match(await page.locator('.home-result').innerText(),/−14\.57%/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await errorStates(page,url);await extras(page,url);await artCheck(page,url);
  const consoleErrors=report.console.filter(t=>!/favicon|404|review\.json/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,timing:report.timing,art:report.art,errors:report.errors,console:report.console,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
