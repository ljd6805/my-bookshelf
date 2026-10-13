/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역을 본다. 실험·장 그림과 서가 삽화·표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   8장 DCF 민감도 표는 세 폭에서 옆으로 넘치지 않는지 따로 잰다.
   실행: NODE_PATH=/opt/node22/lib/node_modules node books/valuation/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'valuation-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 'price-basics':['2,000억 원','EPS = 164.8억 원 ÷ 1,000만 주 = 1,648원','9,008원','주식을 나누지 않았습니다','실제 계산'],
 'multiple-compare':['PER = 20,000 ÷ 1,648원 = 12.14배','2.22배','ROE 18.3%','= PBR ✓ 맞음','19,776원','17,971원'],
 'dividend-yield':['2.00%','24.3%','r = 428원 ÷ 20,000원 + 7.0% = 9.14%','13.9%'],
 'ev-bridge':['387.2억 원','2,387.2억 원','8.59배','주당 16,978원','16,978원~19,776원'],
 'fcff-forecast':['= 84억 원','−225.2억 원','196.8억 원','595.1억 원','77.6억 원'],
 'wacc-build':['9.30%','4.048%','8.335%','주당 22,750원','확인일을 보고 다시 확인하세요','보도·2차 자료'],
 'terminal-steps':['194억 원','3,079.6억 원','2,067.1억 원','77.6%','2,662.2억 원','2,275억 원','주당 22,750원'],
 'dcf-sensitivity':['22,750원','77.6%','18,971원 ↔ 27,968원','막대 순서: 할인율 → 영업이익률','−3,779원','학습용 계산, 투자 권유 아님'],
 'implied-assumption':['매출 성장률은 0.25%','할인율 9.00%','2.59%','7.80%','6.86%','투자 권유 아님'],
 'analyst-gap':['분석가 A 31,833원, B 15,867원','15,966원','운전자본 비율을 바꾸면 18,625원','A − B ✓ 맞음','2025년 말','학습용 계산, 투자 권유 아님','확인 못함']
};
const CHART={'analyst-gap':['31,833','15,867'],'dcf-sensitivity':['▲'],'wacc-build':['확인일 2026-10-08']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'price-basics':[[0,['1,360원','7,760원']],[1,['주가 4,000원','1/5','✓ 같음']],[2,['주가 2,000원','1/10','2,000억 원 그대로']]],
 'multiple-compare':[[0,['14.71배']],[1,['✗ 어긋남']],[2,['선행 PER','11.56배']]],
 'dividend-yield':[[0,['7.10%']],[1,['11.18%']],[2,['8.71%']]],
 'ev-bridge':[[0,['114억 원','8.81배']],[1,['237.2억 원','2,237.2억 원','8.05배','18,478원']],[2,['21,148원']]],
 'fcff-forecast':[[0,['508.9억 원']],[1,['663.1억 원']],[2,['660.8억 원']]],
 'wacc-build':[[0,['26,771원']],[1,['19,641원']],[2,['28,601원']],[3,['18,971원']]],
 'terminal-steps':[[0,['19,914원']],[1,['24,970원']],[2,['33,448원']],[3,['752,382원','99.2%']]],
 'dcf-sensitivity':[[3,['0.5% ↔ 3.5%','20,486원 ↔ 26,427원']]],
 'implied-assumption':[[0,['8.36%']],[1,['할인율은 9.00%']],[3,['7.00%']]],
 'analyst-gap':[[0,['20,248원']],[1,['17,726원']],[2,['27,250원']],[3,['3단계가 남았습니다']]]
};
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
const setAll=async(lab,o)=>{for(const [k,v] of Object.entries(o))await setValue(lab,k,v);};
const readout=lab=>lab.locator('.readout').innerText();
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로) 또는 조작 함수, 결과 문장과 그림·표에 나와야 할 답]. 어떤 비교 예제로도 닿지 않는다. */
const L2={
 'price-basics':[{pprice:15000,pshares:400,pni:48,peq:360},['600억 원','1,200원','9,000원']],
 'multiple-compare':[{mper:10,mroe:15,mroe2:10},['PBR = 15.0% × 10.0배 = 1.50배','PER = 1.50배 ÷ 10.0% = 15.00배']],
 'dividend-yield':[{dprice:50000,ddps:1500,deps:5000,dg:4},['3.00%','30.0%','7.12%']],
 'ev-bridge':[async lab=>{await setAll(lab,{ecap:1000,edebt:0,ecash:0,eebitda:150});assert.match(await readout(lab),/EV\/EBITDA = 1,000 ÷ 150 = 6\.67배/);await setAll(lab,{edebt:500,ecash:50});},['1,450억 원','9.67배']],
 'fcff-forecast':[{fop:100,fdep:30,fcapex:50,fdnwc:10,fr1:8},['= 50억 원','46.3억 원']],
 'wacc-build':[{wbeta:1.3,wE:70,wD:30,wkd:6,wtax:20},['10.77%','8.979%','약 8.98%']],
 'terminal-steps':[async lab=>{await setAll(lab,{tmode:'direct',tnext:100,tr:9,tg:3});assert.match(await readout(lab),/1,666\.7억 원[\s\S]*1,083\.2억 원/);await setValue(lab,'tg',4);},['2,000억 원']],
 'dcf-sensitivity':[{sw:32.2,sm:13},['24,336원']],
 'implied-assumption':[{ibasis:'forward',iper:25,ipay:40,ir:9},['g = 9.0% − 40.0% ÷ 25.0 = 7.40%']],
 'analyst-gap':[{gs4:'wcRatio',gs1:'r'},['할인율을 바꾸면 19,246원']]
};
/* 확인 문제의 답: 기본 화면과 비교 예제에는 나오지 않는다(독자가 입력을 바꿔야 닿는다). */
const QUIZ_ANSWER={'price-basics':['주가 10,000원, EPS 824원'],'ev-bridge':['2,287.2억 원','8.23배'],'dcf-sensitivity':['20,189원','20,190원'],'analyst-gap':['22,135원','+3,510원']};
const noQuiz=(t,id,what)=>{for(const s of QUIZ_ANSWER[id]||[])assert.ok(!t.includes(s),`${id} ${what} shows the quiz answer ${s}`);};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={tnext:{tmode:'direct'}};
const FIGURES={price:['2,000억 원','4,000원','330원'],terminal:['22,750원','77.6%'],sensitivity:['18,971원 ↔ 27,968원'],final:['31,833원','15,867원','15,966원']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/valuation/`;
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
 await svgInside(page.locator(id==='home'?'.hero':'.concept-diagram'),`${id} figure@${width}`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
const allText=lab=>lab.evaluate(l=>l.querySelector('.chart').textContent+' '+l.querySelector('.readout').innerText);
const reset=lab=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
async function timed(lab,id){const ms=Number(await lab.locator('.lab-inner').getAttribute('data-ms'));report.timing[id]=Math.max(report.timing[id]||0,ms);assert.ok(ms<SLOW_MS,`${id}: recompute took ${ms}ms`);}
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){await reset(lab);const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');await timed(lab,id);const t=await allText(lab);assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);for(const s of L2[id][1])assert.ok(!t.includes(s),`${id} preset ${i} shows the L2 answer ${s}`);noQuiz(t,id,'preset '+i);}
 return n;
}
async function l2(lab,width,id){
 await reset(lab);const [act,want]=L2[id];
 if(typeof act==='function')await act(lab);else for(const [k,v] of Object.entries(act)){await setValue(lab,k,v);await timed(lab,id);}
 const t=await allText(lab);has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
/* 표의 모든 행이 세로로 잘리지 않고 보이는지 잰다. 가로로 넘치면 is-wide 안내 문구가 붙어야 한다. */
async function tables(lab,id){
 const r=await lab.locator('.table-wrap').evaluateAll(els=>els.filter(e=>!e.closest('details:not([open])')).map(e=>{const w=e.getBoundingClientRect();const rows=[...e.querySelectorAll('tbody tr')].map(tr=>{const b=tr.getBoundingClientRect();return {head:tr.cells[0].innerText.trim(),ok:b.height>0&&b.top>=w.top-0.5&&b.bottom<=w.bottom+0.5};});return {vclip:e.scrollHeight>e.clientHeight+1,wide:e.scrollWidth>e.clientWidth+1,cue:e.classList.contains('is-wide'),rows,tab:e.getAttribute('tabindex'),role:e.getAttribute('role'),label:e.getAttribute('aria-label')||'',overflow:getComputedStyle(e).overflowX};}));
 for(const x of r){assert.ok(!x.vclip,`${id}: table clipped vertically`);for(const row of x.rows)assert.ok(row.ok,`${id}: row ${row.head} not fully visible`);assert.equal(x.cue,x.wide,`${id}: wide-table cue`);assert.equal(x.tab,'0',`${id}: table tabindex`);assert.equal(x.role,'region',`${id}: table role`);assert.ok(x.label.length>4,`${id}: table label`);assert.ok(!x.wide||/auto|scroll/.test(x.overflow),`${id}: table overflow without scroll`);}
 return r.length;
}
/* 그림(실험 그림·장 그림·표지 실험)의 글자 상자가 각 SVG의 viewBox 안에 있는지 잰다. */
async function svgInside(scope,what){
 const bad=await scope.evaluate(root=>{const out=[];let n=0;root.querySelectorAll('svg[viewBox]').forEach(s=>{const vb=s.viewBox.baseVal;if(!vb||!vb.width)return;s.querySelectorAll('text').forEach(t=>{if(!t.textContent.trim())return;n++;const b=t.getBBox();if(b.x<-0.5||b.y<-0.5||b.x+b.width>vb.width+0.5||b.y+b.height>vb.height+0.5)out.push(`${t.textContent} [${b.x.toFixed(1)},${b.y.toFixed(1)},${(b.x+b.width).toFixed(1)},${(b.y+b.height).toFixed(1)}] in ${vb.width}x${vb.height}`);});});return {out,n};});
 report.svgTexts+=bad.n;assert.deepEqual(bad.out,[],`${what}: SVG text outside its viewBox`);
}
async function controlsCheck(lab,id){
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?[false,true]:[c.min,c.max];
 const ctx=async c=>{for(const [k,v] of Object.entries(CONTEXT[c.id]||{}))await setValue(lab,k,v);};
 for(const c of controls){
  await reset(lab);await ctx(c);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await setValue(lab,c.id,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?false:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>['number','text','date'].includes(x.type))){await reset(lab);await ctx(c);await setValue(lab,c.id,'');assert.match(await readout(lab),/✗ .*확인해 주세요/,`${id}:${c.id} empty`);}
 return controls.length;
}
async function labCheck(lab,width,id){
 await svgInside(lab,`${id}@${width}`);
 const before=await readout(lab);has(before,DEFAULTS[id],id);noQuiz(await allText(lab),id,'default');assert.doesNotMatch(before,BAD,id);
 if(CHART[id])has(await allText(lab)+await lab.innerText(),CHART[id],id+' chart');
 assert.match(before,/실제 계산|미리 정한 가상 시나리오|시각적 비유/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 const presetCount=await presets(lab,id);await svgInside(lab,`${id} after presets@${width}`);await l2(lab,width,id);await svgInside(lab,`${id} L2@${width}`);
 const n=await controlsCheck(lab,id);
 await reset(lab);assert.equal(await readout(lab),before,`${id}: reset`);
 report.labs.push({width,id,controls:n,presets:presetCount,tables:nTables,reset:true});
}
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
}
/* 오류 상태: 실험마다 하나씩, 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다(NaN 대신 글자). */
async function errorStates(page,url){
 const cases=[
  ['price','price-basics',{pshares:0},/✗ 주식 수를 확인해 주세요/],
  ['per','multiple-compare',{mroe2:0},/✗ 바뀐 ROE를 확인해 주세요/],
  ['dividend','dividend-yield',{dprice:0},/✗ 주가를 확인해 주세요/],
  ['ev','ev-bridge',{eebitda:0},/✗ EBITDA를 확인해 주세요 · 0 이하라/],
  ['fcf','fcff-forecast',{fr1:-5},/✗ 할인율을 확인해 주세요/],
  ['wacc','wacc-build',{wE:0,wD:0},/✗ 주식 시장가와 부채를 확인해 주세요/],
  ['terminal','terminal-steps',{tg:9},/✗ 영구성장률을 확인해 주세요 · g ≥ r이라 계산하지 않습니다/],
  ['sensitivity','dcf-sensitivity',{sgt:9},/✗ 영구성장률과 할인율을 확인해 주세요 · g ≥ r/],
  ['implied','implied-assumption',{iprice:0},/✗ 주가를 확인해 주세요/],
  ['final','analyst-gap',{gs2:'wcRatio'},/✗ 바꾸는 순서를 확인해 주세요 · 같은 가정을 두 번/]
 ];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await setAll(lab,act);const t=await readout(lab);assert.match(t,re,`${id} error state ${re}`);assert.doesNotMatch(t,BAD,`${id} error state`);await reset(lab);assert.doesNotMatch(await readout(lab),/✗ .*확인해 주세요/,`${id} reset clears the error`);}
 /* 8장 표: g ≥ r 칸은 값 대신 글자로 남는다. */
 await frame(page,url,390,'sensitivity');const s=page.locator('#lab-dcf-sensitivity');await setAll(s,{saxis:'gT',sr:4});assert.match(await s.locator('.chart').innerText(),/✗ g ≥ r: 계산하지 않음/);assert.doesNotMatch(await allText(s),BAD);await reset(s);
}
const ART_STATE=()=>['needle','tv','marker','b'].map(k=>{const s=getComputedStyle(document.querySelector('.vl-ill-'+k));return s.animationName;});
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:176,92,150;--edge:128,58,108">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  for(const t of r.texts)assert.ok(t.x>=0&&t.y>=0&&t.r<=r.vb[0]&&t.b<=r.vb[1],`${file}: "${t.text}" outside viewBox ${JSON.stringify(t)}`);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none','none'],'shelf art stops under reduced motion');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.vl-ill-a')).opacity),'1','reduced motion keeps the 7% caption visible');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['vl-ill-needle','vl-ill-tv','vl-ill-marker','vl-ill-b'],'shelf art animates');
 await page.goto(url);await page.setContent(`<!doctype html><html data-motion="reduce"><body>${fs.readFileSync(path.join(__dirname,'..','assets/shelf-illustration.svg'),'utf8')}</body></html>`);
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none','none'],'shelf art stops under html[data-motion=reduce]');
 await page.emulateMedia({reducedMotion:'reduce'});
}
const OVERLAP=s=>{const b=[...s.querySelectorAll('text.axis')].filter(t=>t.getAttribute('text-anchor')==='middle').map(t=>t.getBBox());let n=0;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const a=b[i],c=b[j];if(Math.abs(a.y-c.y)<1&&a.x<c.x+c.width&&c.x<a.x+a.width)n++;}return n;};
/* 8장: 세 폭에서 민감도 표가 옆으로 넘치지 않고(320px에서는 행마다 카드), 막대 순서 안내와 영구가치 비중이 보인다. 계단 막대의 축 이름표는 겹치지 않는다. */
async function sensitivityFit(page,url){
 for(const w of [1280,390,320]){
  await frame(page,url,w,'sensitivity');const s=page.locator('#lab-dcf-sensitivity');
  const fit=await s.locator('.chart .table-wrap').evaluateAll(els=>els.map(e=>({sw:e.scrollWidth,cw:e.clientWidth,cards:e.classList.contains('cards'),label:e.getAttribute('aria-label')})));
  assert.ok(fit.length>=2,`sensitivity tables @${w}`);
  for(const f of fit.filter(x=>x.cards))assert.ok(f.sw<=f.cw+1,`sensitivity table "${f.label}" scrolls sideways at ${w}: ${f.sw} > ${f.cw}`);
  assert.ok(fit.some(x=>x.cards),'two-way tables use cards');
  const pt=await s.locator('.chart .table-wrap.compact').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth,wide:e.classList.contains('is-wide'),row:getComputedStyle(e.querySelector('tbody tr')).display}));assert.ok(pt.sw<=pt.cw+1&&!pt.wide&&pt.row==='table-row',`1%p table is not a compact table at ${w}: ${JSON.stringify(pt)}`);
  const t=await s.innerText();has(t,['막대 순서','영구가치 비중','1%p당 변화'],`sensitivity text @${w}`);
  await page.locator('#lab-dcf-sensitivity .chart').screenshot({path:path.join(output,`sensitivity-${w}.png`)});
  for(const [ch,lab] of [['ev','ev-bridge'],['final','analyst-gap']]){await frame(page,url,w,ch);const ov=await page.locator(`#lab-${lab} .chart svg`).first().evaluate(OVERLAP);assert.equal(ov,0,`${lab} axis labels overlap at ${w}`);}
 }
}
async function extras(page,url){
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png')});
 /* 표지 실험: 할인율 막대를 키보드로 옮긴다. */
 const r=page.locator('#home-r');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'11');const hr=await page.locator('.home-result').innerText();assert.match(hr,/할인율 11\.0%/);assert.doesNotMatch(hr,BAD);
 await r.evaluate(e=>{e.value=9;e.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('.home-result').innerText(),/주당 19,990원/);
 await r.evaluate(e=>{e.value=7;e.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('.home-result').innerText(),/주당 29,944원/);
 /* 6장: 시장 숫자의 확인일과 출처 등급, β 범위 막대 키보드 조작. */
 await frame(page,url,390,'wacc');const wb=page.locator('#lab-wacc-build');assert.match(await wb.locator('.rate-banner').innerText(),/확인일 2026-10-08/);
 await page.locator('#wbeta').focus();await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('#wbeta').inputValue(),'1','keyboard moves beta');await reset(wb);
 /* 7장: 직접 넣기 칸은 기준안에서 꺼져 있다. */
 await frame(page,url,390,'terminal');assert.equal(await page.locator('#tnext').isDisabled(),true);await page.selectOption('#tmode','direct');assert.equal(await page.locator('#tnext').isDisabled(),false,'direct FCFF input enabled');
 /* 10장: 기본 순서는 운전자본부터(할인율부터가 아님), 적어 둔 조건은 이 브라우저에만 남는다. */
 await frame(page,url,390,'final');const fc=page.locator('#lab-analyst-gap');assert.equal(await page.locator('#gs1').inputValue(),'wcRatio');assert.notEqual(await page.locator('#gs1').inputValue(),'r');
 assert.match(await fc.innerText(),/2025년 말/);
 await page.fill('#gnote0','할인율이 9%로 오르면');await page.reload();await page.locator('#gnote0').waitFor();assert.equal(await page.inputValue('#gnote0'),'할인율이 9%로 오르면','note kept in this browser');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bookshelf:valuation:v1:final-notes'))[0]),'할인율이 9%로 오르면');await page.evaluate(()=>localStorage.removeItem('bookshelf:valuation:v1:final-notes'));
 /* 예측을 적고 결과 읽기를 펴면 내 예측이 되울린다. */
 await frame(page,url,390,'terminal');await page.fill('#guess-terminal-steps','1,600억 원');await page.locator('#lab-terminal-steps details.guide-reading summary').click();await page.waitForFunction(()=>/내 예측: 1,600억 원/.test(document.querySelector('#lab-terminal-steps .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,1280,'final');await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-analyst-gap').screenshot({path:path.join(output,'final-dark.png')});await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,320,'implied');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>VBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/할인율 8\.3%[\s\S]*595\.1억 원[\s\S]*2,067\.1억 원[\s\S]*2,662\.2억 원[\s\S]*주당 22,750원/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await errorStates(page,url);await sensitivityFit(page,url);await extras(page,url);await artCheck(page,url);
  const missing=report.missing.filter(u=>!/\/favicon\.ico$/.test(u));assert.deepEqual(missing,[],'missing files');
  const consoleErrors=report.console.filter(t=>!/^Failed to load resource/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,timing:report.timing,art:report.art,svgTexts:report.svgTexts,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);process.exit(1);});
