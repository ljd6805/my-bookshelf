/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역을 본다. 실험·장 그림과 서가 삽화·표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   실행: NODE_PATH=/opt/node22/lib/node_modules node books/statements/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'statements-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 'accrual-timeline':['2024 회계연도에는 매출 30억 원, 현금 유입 0억 원','2025 회계연도에는 매출 0억 원, 현금 유입 30억 원','매출채권','실제 계산'],
 'balance-sheet-tx':['1,050 = 370 + 680','1,100 = 420 + 680','자산 = 부채 + 자본 ✓ 맞음','450 → 500','170 → 220'],
 'income-steps':['매출총이익 450억 원','영업이익 180억 원','12.0%','세전이익 170억 원','당기순이익 136억 원'],
 'cfo-bridge':['136 → 196 → 166 → 146 → 156','영업활동 현금흐름 156억 원','+36억 원','136억 원','✓ 맞음'],
 'three-statement-link':['순이익 136억 원','영업활동 현금흐름 156억 원','기말 현금 136억 원','1,156 = 부채 380 + 자본 776','자산 = 부채 + 자본 ✓ 맞음','모두 ✓ 맞음','차입하지 않습니다'],
 'ratio-table':['영업이익률 12.0%','9.07%','ROE 18.7%','부채비율 49.0%','297.8%','15.0배','56.0일','59.1일','9.07% × 총자산회전율 1.36회 × 자기자본승수 1.52배'],
 'accrual-alarm':['1.15','−1.8%','위험 신호 없음','매출채권·재고 증가는 50억 원','24 + 오경보 97 = 121건','19.8%','특정 주식을 사고팔라는 권유가 아닙니다'],
 'filing-deadline':['2025-03-31(월)','사업보고서','안내에 조치 사유로 적히지 않음','한국거래소 안내 원문'],
 'industry-compare':['6.56회','59.1일','56.0일','53.6%','16회','22.8일','9.1일','30.0%','재고 없음','73.0일','10.0%'],
 'final-check':['+21.2%','−53.8%','−83.2억 원','56.0일','87.2일','250억 원','20억 원','10.8배','2026-05-15','2026-08-14','2027-03-31','네 줄 모두 ✓ 맞음','학습용 계산, 투자 권유 아님']
};
const CHART={'three-statement-link':['손익계산서','현금흐름표 (간접법)','기말 재무상태표','이익잉여금 626'],'final-check':['(가) 2026년 4월','2026-05-15(금)','2027-03-31(수)'],'filing-deadline':['시각적 비유','안내에 조치 사유로 적히지 않음'],'cfo-bridge':['누적 76','누적 36','재무활동 (배당 −40)','현금 증감 (기초 100 → 기말 136)']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'accrual-timeline':[[0,['2025 회계연도에는 매출 30억 원, 현금 유입 30억 원']],[1,['2025 회계연도에는 매출 30억 원, 현금 유입 30억 원']],[2,['2024 회계연도에는 매출 50억 원, 현금 유입 20억 원, 현금 유출 15억 원, 자산으로 산 것 65억 원, 그해 말 아직 내지 않은 대금 50억 원','현금 유입 30억 원, 현금 유출 50억 원']]],
 'balance-sheet-tx':[[0,['1,100 = 420 + 680']],[1,['1,050 = 370 + 680','450 → 420']],[2,['1,030 = 350 + 680']],[3,['1,059 = 370 + 689']]],
 'income-steps':[[0,['225억 원','13.6%','+25.0%','172억 원']],[1,['198억 원','12.0%','+10.0%','150.4억 원']],[2,['160억 원','128억 원']]],
 'cfo-bridge':[[0,['164.8 → 226.8 → 26.8 → −103.2 → −83.2','−73.2억 원','62.8억 원','✓ 맞음']],[1,['96억 원','✗ 어긋남']],[2,['아직 재무상태표의 현금과 대조하지 않았습니다']]],
 'three-statement-link':[[0,['순이익 136억 원','기말 현금 136억 원']],[1,['순이익 136억 원','기말 현금 96억 원','1,156 = 부채 380','660']],[2,['영업활동 현금흐름 −44억 원','−64억 원','150억 원','기말 현금 86억 원','200억 원','1,306 = 부채 530 + 자본 776','모두 ✓ 맞음']],[3,['순이익 164.8억 원','184.8억 원','1,184.8 = 부채 380 + 자본 804.8']],[4,['−83.2억 원','−137.2억 원','200억 원','62.8억 원','1,500.8 = 부채 600 + 자본 900.8']]],
 'ratio-table':[[0,['ROE 17.5%']],[1,['1.76배','21.7%']],[2,['9.16%','19.7%','66.6%','198.2%','18.0배','87.2일','86.9일','5.45회','5.36회']]],
 'accrual-alarm':[[0,['−0.50','18.7%','차이 248억 원 가운데 매출채권·재고 증가가 330억 원(133%)','위험 신호 있음']],[1,['16 + 오경보 98 = 114건','14.0%']],[2,['40 + 오경보 95 = 135건','29.6%']],[3,['8 + 오경보 99 = 107건','7.5%']]],
 'filing-deadline':[[0,['2026-08-14(금)']],[1,['2026-11-14(토)','휴일 처리 확인 못함']],[2,['2027-03-31(수)']],[3,['관리종목 지정']]],
 'industry-compare':[[0,['73.0일','재고 없음']],[1,['18.3일']],[2,['8회','45.6일']]],
 'final-check':[[0,['FY2024']],[1,['25억 원','8.6배']],[2,['−33.2억 원','18억 원','12.0배']]]
};
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로) 또는 조작 함수, 결과 문장과 그림·표에 나와야 할 답]. */
const L2={
 'accrual-timeline':[{aa0:10,aa1:25,aa2:20,ad2:'2024-03-10'},['2024 회계연도에는 매출 35억 원, 현금 유입 30억 원']],
 'balance-sheet-tx':[async lab=>{await setValue(lab,'bstart','2024');await setValue(lab,'bkind','buyEquipment');await setValue(lab,'bamt',30);await lab.locator('[data-add]').click();await setValue(lab,'bkind','payAP');await setValue(lab,'bamt',20);},['1,136 = 360 + 776','자산 = 부채 + 자본 ✓ 맞음']],
 'income-steps':[{icogs:72},['영업이익 150억 원','10.0%','−16.7%']],
 'cfo-bridge':[{cdar:80},['영업활동 현금흐름 106억 원']],
 'three-statement-link':[{lcapex:200},['16억 원','기말 현금 66억 원','단기차입금 100억 원','740','1,206 = 부채 430 + 자본 776','순이익 136억 원']],
 'ratio-table':[{so:30,si:12,sl:300,se:200,sca:120,scl:150},['이자보상배율 2.5배','부채비율 150.0%','유동비율 80.0%']],
 'accrual-alarm':[{qni:50,qcfo:-10,qavg:400},['15.0%','위험 신호 있음']],
 'filing-deadline':[{dend:'2026-03-31',dkind:'quarter'},['2026-05-15(금)']],
 'industry-compare':[{ncogs:1800,ninv:150},['12회','30.4일']],
 'final-check':[{far:330},['16.8억 원','차이 148억 원','100억 원 차입']]
};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={isgafix:{isgamode:'fixed'}};
const FIGURES={basics:['30억 원'],balance:['1,050억 원'],link:['626','1,156 = 380 + 776'],final:['+21.2%','−53.8%']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/statements/`;
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
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){await reset(lab);const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');await timed(lab,id);const t=await allText(lab);assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);}
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
async function labCheck(lab,width,id){
 await svgInside(lab,`${id}@${width}`);
 const before=await lab.locator('.readout').innerText();has(before,DEFAULTS[id],id);assert.doesNotMatch(before,BAD,id);
 if(CHART[id])has(await allText(lab),CHART[id],id+' chart');
 assert.match(before,/실제 계산|가상 시나리오|시각적 비유/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 const presetCount=await presets(lab,id);await svgInside(lab,`${id} after presets@${width}`);await l2(lab,width,id);await svgInside(lab,`${id} L2@${width}`);
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?[false,true]:[c.min,c.max];
 const ctx=async c=>{for(const [k,v] of Object.entries(CONTEXT[c.id]||{}))await setValue(lab,k,v);};
 for(const c of controls){
  await reset(lab);await ctx(c);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await setValue(lab,c.id,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?false:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>['number','text','date'].includes(x.type))){await reset(lab);await ctx(c);await setValue(lab,c.id,'');assert.match(await lab.locator('.readout').innerText(),/✗ .*확인해 주세요/,`${id}:${c.id} empty`);}
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
 const cases=[
  ['basics','accrual-timeline',async l=>{await setValue(l,'aa1',-5);},/✗ 외상 판매 금액을 확인해 주세요/],
  ['balance','balance-sheet-tx',async l=>{await setValue(l,'bkind','repayDebt');await setValue(l,'bamt',100);},/✗ 거래 금액을 확인해 주세요 · 단기차입금보다 많이/],
  ['income','income-steps',async l=>{await setValue(l,'icogs',150);},/✗ 매출원가율을 확인해 주세요/],
  ['cashflow','cfo-bridge',async l=>{await setValue(l,'cdar',-500);},/✗ 증가액을 확인해 주세요/],
  ['link','three-statement-link',async l=>{await setValue(l,'lar',-1);},/✗ 기말 매출채권을 확인해 주세요/],
  ['ratios','ratio-table',async l=>{await setValue(l,'se',0);},/✗ 다른 회사 숫자를 확인해 주세요/],
  ['quality','accrual-alarm',async l=>{await setValue(l,'qavg',0);},/✗ 평균 총자산을 확인해 주세요/],
  ['dart','filing-deadline',async l=>{await setValue(l,'dend','2026-02-30');},/✗ 기간 끝 날짜를 확인해 주세요/],
  ['industry','industry-compare',async l=>{await setValue(l,'ncogs',0);},/✗ 매출원가를 확인해 주세요/],
  ['final','final-check',async l=>{await setValue(l,'frate',50);},/✗ 2026년 단기차입금 금리를 확인해 주세요/]
 ];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await act(lab);assert.match(await lab.locator('.readout').innerText(),re,`${id} error state ${re}`);await reset(lab);assert.doesNotMatch(await lab.locator('.readout').innerText(),/✗ .*확인해 주세요/,`${id} reset clears the error`);}
}
/* 삽화의 글자 상자가 viewBox 안에 있는지 잰다. */
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:150,190,150;--edge:70,120,70">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  for(const t of r.texts)assert.ok(t.x>=0&&t.y>=0&&t.r<=r.vb[0]&&t.b<=r.vb[1],`${file}: "${t.text}" outside viewBox ${JSON.stringify(t)}`);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 const still=await page.evaluate(()=>{const g=getComputedStyle(document.querySelector('.fs-ill-grow')),c=getComputedStyle(document.querySelector('.fs-ill-shrink')),n=getComputedStyle(document.querySelector('.fs-ill-note'));return [g.animationName,c.animationName,n.opacity];});assert.deepEqual(still,['none','none','1'],'shelf art stops under reduced motion on the final state');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 const moving=await page.evaluate(()=>[getComputedStyle(document.querySelector('.fs-ill-grow')).animationName,getComputedStyle(document.querySelector('.fs-ill-shrink')).animationName,getComputedStyle(document.querySelector('.fs-ill-move')).animationName]);assert.deepEqual(moving,['fs-ill-grow','fs-ill-shrink','fs-ill-move'],'shelf art animates');
 await page.goto(url);await page.setContent(`<!doctype html><html data-motion="reduce"><body>${fs.readFileSync(path.join(__dirname,'..','assets/shelf-illustration.svg'),'utf8')}</body></html>`);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.fs-ill-grow')).animationName),'none','shelf art stops under html[data-motion=reduce]');
}
const OVERLAP=s=>{const b=[...s.querySelectorAll('text.axis')].filter(t=>t.getAttribute('text-anchor')==='middle').map(t=>t.getBBox());let n=0;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const a=b[i],c=b[j];if(Math.abs(a.y-c.y)<1&&a.x<c.x+c.width&&c.x<a.x+a.width)n++;}return n;};
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['balance','balance-sheet-tx'],['cashflow','cfo-bridge'],['link','three-statement-link'],['quality','accrual-alarm'],['final','final-check']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'link');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-three-statement-link'),'link-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 /* 2장: 끌어 놓기의 키보드 대안(목록)과 실제 끌어 놓기, 넣기·빼기 단추. */
 await frame(page,url,1280,'balance');const bs=page.locator('#lab-balance-sheet-tx');
 await page.locator('#bccash').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#bccash').inputValue(),'current','keyboard select');assert.match(await bs.locator('.readout').innerText(),/고른 1줄 가운데 1줄 ✓ 맞음/);
 await page.dragAndDrop('#lab-balance-sheet-tx [data-line="ppe"]','#lab-balance-sheet-tx [data-zone="current"]');assert.equal(await page.locator('#bcppe').inputValue(),'current','drag sets the select');assert.match(await bs.locator('.readout').innerText(),/고른 2줄 가운데 1줄 ✓ 맞음, 1줄 ✗ 다시/);
 await bs.locator('[data-add]').click();assert.match(await bs.locator('.readout').innerText(),/넣어 둔 거래 1건[\s\S]*1,100 = 420 \+ 680/);await bs.locator('[data-undo]').click();assert.match(await bs.locator('.readout').innerText(),/금액이 0이라/);
 /* 5장: 단계 단추가 단계 표시를 옮긴다. */
 await frame(page,url,390,'link');const lk=page.locator('#lab-three-statement-link');await lk.locator('[data-preset]').nth(2).click();assert.match(await lk.locator('.stage-list [aria-current="step"]').innerText(),/3\. 기말 매출채권 430/);
 await page.locator('#lsales').fill('1600');assert.equal(await lk.locator('.stage-list [aria-current="step"]').count(),0,'typing clears the stage mark');
 await page.selectOption('#lbase','2024');assert.equal(await page.locator('#lar').inputValue(),'430','base change fills that year');assert.match(await lk.locator('.readout').innerText(),/−83\.2억 원/);
 /* 4장: 체크 상자를 Space로 끈다. */
 await frame(page,url,390,'cashflow');await page.locator('#con1').focus();await page.keyboard.press('Space');assert.match(await page.locator('#lab-cfo-bridge .readout').innerText(),/✗ 어긋남/);
 /* 표지 실험: 범위 막대를 키보드로 옮긴다. */
 await frame(page,url,390,'home');const r=page.locator('#home-ar');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'500');assert.match(await page.locator('.home-result').innerText(),/단기차입[\s\S]*모두 ✓ 맞음/);
 await r.evaluate(e=>{e.value=430;e.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('.home-result').innerText(),/영업활동 현금흐름 −44억 원[\s\S]*기말 현금 86억 원[\s\S]*150억 원 단기차입/);
 await frame(page,url,390,'final');assert.match(await page.locator('#lab-final-check .rate-banner').innerText(),/학습용 계산, 투자 권유 아님[\s\S]*공식 자료로 다시 확인하세요/);
 await frame(page,url,390,'dart');assert.match(await page.locator('#lab-filing-deadline .rate-banner').innerText(),/2026-10-13 확인 기준/);
 /* 1장 L2 경로: 외상 판매와 회수가 같은 회계연도면 매출채권 증가를 식으로 적고, 두 금액이 같을 때만 남는 매출채권이 없다고 쓴다. */
 await frame(page,url,390,'basics');const at=page.locator('#lab-accrual-timeline');
 assert.doesNotMatch(await at.locator('.readout').innerText(),/남는 매출채권이 없습니다/,'different years keep the receivable');
 for(const [k,v] of Object.entries({aa0:10,aa1:25,aa2:20,ad2:'2024-03-10'}))await setValue(at,k,v);
 let tx=await at.locator('.readout').innerText();assert.match(tx,/2024 회계연도 매출채권 증가 = 외상 판매 25 − 회수 20 = 5억 원이라 그해 말에 받을 돈 5억 원이 매출채권으로 남습니다/);assert.doesNotMatch(tx,/남는 매출채권이 없습니다/);
 await setValue(at,'aa2',25);tx=await at.locator('.readout').innerText();assert.match(tx,/외상 판매 25 − 회수 25 = 0억 원이라 그해 말에 남는 매출채권이 없습니다/);await reset(at);
 /* 10장 확인 시점 표와 4장 그림: 세 폭에서 표가 옆으로 넘치지 않고, 가로축 이름표가 서로 겹치지 않는다. */
 for(const w of [1280,390,320]){
  await frame(page,url,w,'final');const fit=await page.locator('#lab-final-check .chart .table-wrap.fit').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth,head:[...e.querySelectorAll('th')].map(x=>x.innerText)}));
  assert.ok(fit.sw<=fit.cw+1,`final horizon table overflows at ${w}: ${fit.sw} > ${fit.cw}`);assert.equal(fit.head[1],'확인할 것');
  await frame(page,url,w,'cashflow');const ov=await page.locator('#lab-cfo-bridge .chart svg').evaluate(OVERLAP);
  assert.equal(ov,0,`cfo-bridge axis labels overlap at ${w}`);
  await frame(page,url,w,'final');const ov2=await page.locator('#lab-final-check .chart svg').first().evaluate(OVERLAP);assert.equal(ov2,0,`final-check axis labels overlap at ${w}`);
  await frame(page,url,w,'cashflow');const t4=await page.locator('#lab-cfo-bridge .chart .table-wrap').evaluate(e=>e.scrollWidth<=e.clientWidth+1);assert.ok(t4,`cfo-bridge table overflows at ${w}`);
 }
 /* 10장: 신호 표는 적어 둔 조건 아래에 접혀 있고, 적어 둔 조건은 이 브라우저에만 남는다. */
 await frame(page,url,390,'final');const fc=page.locator('#lab-final-check');
 assert.equal(await fc.locator('fieldset ~ details.fs-signals').count(),1,'signal table sits below the notes');assert.equal(await fc.locator('details.fs-signals').getAttribute('open'),null,'signal table starts folded');
 await fc.locator('details.fs-signals summary').click();assert.match(await fc.locator('[data-signals]').innerText(),/위험 신호 있음[\s\S]*위험 신호 없음/);
 assert.match(await fc.locator('legend').innerText(),/이 브라우저에만 남고/);
 await page.fill('#fnote1','1분기 매출채권이 줄면');await page.reload();await page.locator('#fnote1').waitFor();assert.equal(await page.inputValue('#fnote1'),'1분기 매출채권이 줄면','note kept in this browser');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bookshelf:statements:v1:final-notes'))[0]),'1분기 매출채권이 줄면');await page.evaluate(()=>localStorage.removeItem('bookshelf:statements:v1:final-notes'));
 await frame(page,url,390,'income');await page.fill('#guess-income-steps','150억 원, 10.0%');await page.locator('#lab-income-steps summary').click();await page.waitForFunction(()=>/내 예측: 150억 원/.test(document.querySelector('#lab-income-steps .guess-echo').innerText),null,{timeout:3000});
 assert.equal(await page.locator('#isgafix').isDisabled(),true);await page.selectOption('#isgamode','fixed');assert.equal(await page.locator('#isgafix').isDisabled(),false,'fixed SG&A input enabled');
 await frame(page,url,320,'ratios');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>SBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/순이익 136억 원 그대로[\s\S]*영업활동 현금흐름 156억 원[\s\S]*기말 현금 136억 원[\s\S]*1,156 = 부채 380 \+ 자본 776[\s\S]*모두 ✓ 맞음/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await errorStates(page,url);await extras(page,url);await artCheck(page,url);
  const missing=report.missing.filter(u=>!/\/favicon\.ico$/.test(u));assert.deepEqual(missing,[],'missing files');
  const consoleErrors=report.console.filter(t=>!/^Failed to load resource/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,timing:report.timing,art:report.art,errors:report.errors,console:report.console,missing:report.missing,svgTexts:report.svgTexts,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({...report,success:false,failure:String(e)},null,2));process.exitCode=1;});
