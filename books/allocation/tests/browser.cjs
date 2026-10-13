/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역, 그림 글자가 viewBox 안에 있는지와 글자끼리 겹치지 않는지 본다.
   2장과 10장 비교 예제는 예측을 적기 전에는 닫혀 있는지, 10장 계산 결과는 “계산 결과와 풀이 펼치기”를 켤 때만 나오는지, 풀이 상자는 접혀 있는지,
   10장 메모는 이 브라우저에만 남는지, 두 테마의 글자 대비, 서가 삽화는 움직이고 동작 줄이기에서 멈추는지도 본다.
   실행: node books/allocation/tests/browser.cjs (또는 BOOK_URL=http://127.0.0.1:8765/books/allocation/)
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'allocation-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0,contrast:[]};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 'stock-count':['18.25%','16.43%','실제 계산'],
 'covariance-matrix':['0.01530','12.37%','0.368 · 1.000 · 1.632','2.500'],
 'two-asset-curve':['5.60%','10.58%','14.29%','5.27%'],
 'efficient-frontier':['22.52·13.30·64.18%','0.3463','79.16%','권하는 비중이 아닙니다'],
 'beta-estimate':['1.3118','10.82%','⏱ 국고채 10년 금리 4.4% · 6권 확인값 · 서재 안 재인용','확인일을 보고 다시 확인하세요'],
 'target-mix':['10.59%','−15.68%','56.70%'],
 'rebalance-rules':['65.66%','672.0만 원','1억 2,511만 원','1억 2,544만 원','1억 2,221만 원'],
 'kelly-growth':['0.100','1.650배','하위 10% 0.495배','30.1%','돈을 빌려 이 비율을 채우는 계산을 하지 않는다'],
 'crisis-correlation':['17.23%','23.05%','10.58%','19.79%','Forbes·Rigobon'],
 'plan-conditions':['비중 합 100% ✓','0.100 · 0.100 · 0.861 · 2.939','계산 결과와 풀이 펼치기']
};
const CHART={'efficient-frontier':['미리 정한 가정 · 예측 아님 · 실제 시장 자료에서 추정하지 않음'],'plan-conditions':['가상의 인물과 가정으로 만든 계산 연습이며, 실제 계좌의 비중을 권하지 않습니다','한도와 금리는 바뀌므로 확인일을 보고 다시 확인하세요']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'stock-count':[[0,['26.83%']],[1,['16.62%']],[2,['9.49%']]],
 'covariance-matrix':[[0,['−0.470','✗ 상관 행렬이 될 수 없음']],[1,['0.151 · 1.000 · 1.849','12.01%']],[2,['1.60']]],
 'two-asset-curve':[[0,['20.59%','3.90%']],[1,['5.39%']],[2,['12.18%']]],
 'efficient-frontier':[[0,['29.35·6.41·64.23%','0.3870']],[1,['공매도 허용']],[2,['0.4287']]],
 'beta-estimate':[[0,['1.5000']],[1,['0.6618']],[2,['9.92%']]],
 'target-mix':[[0,['7.22%']],[1,['31.16%']],[2,['56.29%','13.71%']]],
 'rebalance-rules':[[0,['쉼']],[1,['45.94%']],[2,['9,840만 원']]],
 'kelly-growth':[[0,['0.325']],[1,['0.300','0.33배']],[2,['0.510배','80.8%']]],
 'crisis-correlation':[[0,['20.92%']],[1,['18.28%']],[2,['7.38%','14.99%']]],
 'plan-conditions':[[0,['−14.33%','−4,298만','풀이 예시 안 B는','정답이 아닙니다']],[1,['80.00%','✗ 한도를 넘음','보도 기준 · 법령 원문 확인 못함']],[2,['−15.45%','135만 원']]]
};
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
const setAll=async(lab,o)=>{for(const [k,v] of Object.entries(o))await setValue(lab,k,v);};
const readout=lab=>lab.locator('.readout').innerText();
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로), 결과 문장과 그림·표에 나와야 할 답]. 어떤 비교 예제로도 닿지 않는다. */
const L2={
 'stock-count':[{cs:20,cr:0.5,cn:4},['15.81%','14.14%']],
 'covariance-matrix':[{ms0:25,ms1:10,mr01:0.4},['0.01000']],
 'two-asset-curve':[{tsa:20,tsb:10,tr:0,tw:50},['11.18%','20.00%','8.94%']],
 'efficient-frontier':[{frf:3,xa:8,xsa:20,xb:5,xsb:10,fts:5},['자산 나 0.2000','50.00% + 현금 50.00% → μ 4.00%']],
 'beta-estimate':[{bm:'1, -2, 3, 0, -1, 2',bs:'1, -1, 2, 0, -1, 2'},['0.7143']],
 'target-mix':[{mt:8,mtc:0},['44.26%','5.05%']],
 'rebalance-rules':[{rs:2000,rt:50,rps:'30',rpb:'0'},['150.0만 원','56.52%']],
 'kelly-growth':[{kp:0.45,kb:2},['0.175']],
 'crisis-correlation':[{cs1:30,cs2:6,crho:0.3},['18.86%']],
 'plan-conditions':[{pw0:10,pw1:25,pw2:25,pw3:30,pw4:10,pshow:true},['−20.40%','−6,120만','채권·현금 1억 2,000만 원으로']]
};
/* 확인 문제의 답: 기본 화면과 비교 예제에는 나오지 않는다(독자가 입력을 바꿔야 닿는다). 10장 안 A의 계산 결과는 풀이를 펼칠 때만 나온다. */
const QUIZ_ANSWER={'stock-count':['10.00%'],'covariance-matrix':['5.50'],'two-asset-curve':['13.20%'],'target-mix':['10.80%'],'kelly-growth':['= 0.000'],'crisis-correlation':['25.00%'],'plan-conditions':['59.42%','16.46%']};
/* 예측을 적어야 비교 예제가 열리는 실험. */
const GATED=['covariance-matrix','plan-conditions'];
const CONTEXT={};
const noQuiz=(t,id,what)=>{for(const s of QUIZ_ANSWER[id]||[])assert.ok(!t.includes(s),`${id} ${what} shows the quiz answer ${s}`);};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/allocation/`;
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
 await svgInside(page.locator(id==='home'?'.hero':'.concept-diagram'),`${id} figure@${width}`);
 report.views.push({width,id,...d});
}
const state=lab=>lab.evaluate(l=>l.querySelector('.chart').innerHTML+l.querySelector('.readout').innerText);
const allText=lab=>lab.evaluate(l=>l.querySelector('.chart').textContent+' '+l.querySelector('.readout').innerText);
const reset=lab=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
async function timed(lab,id){const ms=Number(await lab.locator('.lab-inner').getAttribute('data-ms'));report.timing[id]=Math.max(report.timing[id]||0,ms);assert.ok(ms<SLOW_MS,`${id}: recompute took ${ms}ms`);}
async function presets(lab,id){
 const n=await lab.locator('[data-preset]').count();
 for(let i=0;i<n;i++){await reset(lab);const b=lab.locator('[data-preset]').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true',`${id} preset ${i} pressed`);await timed(lab,id);const t=await allText(lab);assert.doesNotMatch(t,BAD,`${id} preset ${i}`);for(const [k,list] of PRESETS[id]||[])if(k===i)has(t,list,`${id} preset ${i}`);for(const s of L2[id][1])assert.ok(!t.includes(s),`${id} preset ${i} shows the L2 answer ${s}`);noQuiz(t,id,'preset '+i);}
 return n;
}
async function l2(lab,width,id){await reset(lab);for(const [k,v] of Object.entries(L2[id][0])){await setValue(lab,k,v);await timed(lab,id);}has(await allText(lab),L2[id][1],`${id} L2`);report.l2.push({width,id,ok:true});}
/* 표의 모든 행이 세로로 잘리지 않고 보이는지 잰다. 가로로 넘치면 is-wide 안내 문구가 붙어야 한다. */
async function tables(lab,id){
 const r=await lab.locator('.table-wrap').evaluateAll(els=>els.filter(e=>!e.closest('details:not([open])')).map(e=>{const w=e.getBoundingClientRect();const rows=[...e.querySelectorAll('tbody tr')].map(tr=>{const b=tr.getBoundingClientRect();return {head:tr.cells[0].innerText.trim(),ok:b.height>0&&b.top>=w.top-0.5&&b.bottom<=w.bottom+0.5};});return {vclip:e.scrollHeight>e.clientHeight+1,wide:e.scrollWidth>e.clientWidth+1,cue:e.classList.contains('is-wide'),rows,tab:e.getAttribute('tabindex'),role:e.getAttribute('role'),label:e.getAttribute('aria-label')||'',overflow:getComputedStyle(e).overflowX};}));
 for(const x of r){assert.ok(!x.vclip,`${id}: table clipped vertically`);for(const row of x.rows)assert.ok(row.ok,`${id}: row ${row.head} not fully visible`);assert.equal(x.cue,x.wide,`${id}: wide-table cue`);assert.equal(x.tab,'0',`${id}: table tabindex`);assert.equal(x.role,'region',`${id}: table role`);assert.ok(x.label.length>4,`${id}: table label`);assert.ok(!x.wide||/auto|scroll/.test(x.overflow),`${id}: table overflow without scroll`);}
 return r.length;
}
/* 그림(실험 그림·장 그림·표지 실험)의 글자 상자가 각 SVG의 viewBox 안에 있는지, 글자끼리 1단위 넘게 겹치지 않는지 잰다. */
async function svgInside(scope,what){
 const bad=await scope.evaluate(root=>{const out=[],overlap=[];let n=0;root.querySelectorAll('svg[viewBox]').forEach(s=>{const vb=s.viewBox.baseVal;if(!vb||!vb.width)return;const boxes=[];s.querySelectorAll('text').forEach(t=>{if(!t.textContent.trim())return;n++;const b=t.getBBox();boxes.push([t.textContent,b]);if(b.x<-0.5||b.y<-0.5||b.x+b.width>vb.width+0.5||b.y+b.height>vb.height+0.5)out.push(`${t.textContent} [${b.x.toFixed(1)},${b.y.toFixed(1)},${(b.x+b.width).toFixed(1)},${(b.y+b.height).toFixed(1)}] in ${vb.width}x${vb.height}`);});
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [ta,a]=boxes[i],[tb,b]=boxes[j],w=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),h=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);if(w>1&&h>1)overlap.push(`"${ta}" × "${tb}" (${w.toFixed(1)}×${h.toFixed(1)})`);}});return {out,overlap,n};});
 report.svgTexts+=bad.n;assert.deepEqual(bad.out,[],`${what}: SVG text outside its viewBox`);assert.deepEqual(bad.overlap,[],`${what}: SVG texts overlap`);
}
async function controlsCheck(lab,id){
 const controls=await lab.locator('.lab-inner input:not([data-note]),.lab-inner select:not([data-note])').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?[false,true]:c.type==='text'?['1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12','x']:[c.min,c.max];
 const ctx=async c=>{for(const [k,v] of Object.entries(CONTEXT[c.id]||{}))await setValue(lab,k,v);};
 for(const c of controls){
  await reset(lab);await ctx(c);const initial=await state(lab);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
  if(await state(lab)===initial){await setValue(lab,c.id,c.tag==='SELECT'?c.options[0]:c.type==='checkbox'?false:c.min);assert.notEqual(await state(lab),initial,`${id}:${c.id} has no visible effect`);}
 }
 for(const c of controls.filter(x=>['number','text'].includes(x.type))){await reset(lab);await ctx(c);await setValue(lab,c.id,'');assert.match(await readout(lab),/✗ .*확인해 주세요/,`${id}:${c.id} empty`);const fx=await lab.locator('#'+c.id).evaluate(e=>({inv:e.getAttribute('aria-invalid'),msg:e.parentElement.querySelector('.field-error')?.innerText||'',desc:e.getAttribute('aria-describedby')||''}));assert.equal(fx.inv,'true',`${id}:${c.id} aria-invalid`);assert.match(fx.msg,/^✗ /,`${id}:${c.id} visible hint`);assert.ok(fx.desc.includes(c.id+'-err'),`${id}:${c.id} describedby`);}
 await reset(lab);assert.equal(await lab.locator('[aria-invalid=true],.field-error').count(),0,`${id}: reset clears field errors`);
 return controls.length;
}
async function labCheck(page,lab,width,id){
 await svgInside(lab,`${id}@${width}`);
 const before=await readout(lab);has(before,DEFAULTS[id],id);noQuiz(await allText(lab),id,'default');assert.doesNotMatch(before,BAD,id);
 for(const s of L2[id][1])assert.ok(!(await allText(lab)).includes(s),`${id} default shows the L2 answer ${s}`);
 if(CHART[id])has(await lab.innerText(),CHART[id],id+' chart');
 assert.match(before,/실제 계산|미리 정한 가정/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 if(GATED.includes(id)){assert.ok(await lab.locator('[data-preset]').first().isDisabled(),`${id} presets stay closed before a guess`);await page.fill('#guess-'+id,'먼저 손으로 계산한 값');assert.ok(!(await lab.locator('[data-preset]').first().isDisabled()),`${id} presets open after a guess`);}
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
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%3}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
}
/* 오류 상태: 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다(NaN 대신 글자). */
async function errorStates(page,url){
 const cases=[['diversify','stock-count',{cr:-0.5},/✗ 상관을 확인해 주세요 · [\s\S]*−0\.111 이상/],['matrix','covariance-matrix',{mw0:90},/✗ 비중을 확인해 주세요 · 세 비중의 합이 140%/],['pair','two-asset-curve',{tsa:''},/✗ 자산 1의 표준편차를 확인해 주세요/],
  ['frontier','efficient-frontier',{fw0:90},/✗ 비중을 확인해 주세요 · 세 비중의 합이 150%로 100%를 넘습니다/],['frontier','efficient-frontier',{xsa:0},/✗ 두 자산 견주기의 표준편차를 확인해 주세요/],['beta','beta-estimate',{bs:'1, 2, 3'},/✗ 두 목록의 개수를 확인해 주세요/],
  ['beta','beta-estimate',{bm:'1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1'},/✗ 수익률 목록을 확인해 주세요/],['mix','target-mix',{mt:30},/✗ 목표 σ 30\.0%, 현금 10% · 이 목표는 주식만 담은 표준편차보다 높습니다/],['mix','target-mix',{ms:90},/✗ 비중을 확인해 주세요 · 주식·채권·현금의 합이 130%/],
  ['rebalance','rebalance-rules',{rpb:'1, 2'},/✗ 경로의 길이를 확인해 주세요/],['kelly','kelly-growth',{kb:0},/✗ 배당을 확인해 주세요/],['crisis','crisis-correlation',{qr2:-0.5},/✗ 위기 상관을 확인해 주세요/],
  ['final','plan-conditions',{pw0:50},/✗ 비중을 확인해 주세요 · 다섯 비중의 합이 120%/],['final','plan-conditions',{pi0:9000},/✗ IRP 안 금액을 확인해 주세요/]];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await setAll(lab,act);const t=await readout(lab);assert.match(t,re,`${id} error state ${re}: ${t}`);assert.doesNotMatch(t,BAD,`${id} error state`);await reset(lab);assert.doesNotMatch(await readout(lab),/✗ .*확인해 주세요/,`${id} reset clears the error`);}
}
const ART_STATE=()=>['st','mx','band-mx'].map(k=>getComputedStyle(document.querySelector('.al-ill-'+k)).animationName);
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:221,154,63;--edge:166,111,38">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  const pad=file.includes('cover')?14:0;
  for(const t of r.texts)assert.ok(t.x>=pad-0.5&&t.y>=pad-1.5&&t.r<=r.vb[0]-pad+0.5&&t.b<=r.vb[1]-pad+1.5,`${file}: "${t.text}" outside the ${pad}px margin ${JSON.stringify(t)}`);
  await svgInside(page.locator(':root'),file);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none'],'shelf art stops under reduced motion');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.al-ill-bd')).opacity),'1','reduced motion keeps every line visible');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['al-ill-draw1','al-ill-draw3','al-ill-band'],'shelf art animates');
 await page.goto(url);await page.setContent(`<!doctype html><html data-motion="reduce"><body>${fs.readFileSync(path.join(__dirname,'..','assets/shelf-illustration.svg'),'utf8')}</body></html>`);
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none'],'shelf art stops under html[data-motion=reduce]');
 await page.emulateMedia({reducedMotion:'reduce'});
}
/* 두 테마에서 글자색과 배경색의 대비(WCAG 상대 휘도)를 잰다. 본문 글자와 강조색은 4.5:1 이상. */
async function contrast(page){
 for(const theme of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
  const r=await page.evaluate(()=>{const cs=getComputedStyle(document.documentElement),v=k=>cs.getPropertyValue(k).trim();const lum=h=>{let n=h.replace('#','');if(n.length===3)n=[...n].map(x=>x+x).join('');const c=[0,2,4].map(i=>parseInt(n.slice(i,i+2),16)/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05);};const out={};for(const fg of ['--text','--muted','--accent','--orange','--blue'])for(const bg of ['--bg','--panel','--panel2','--chart'])out[fg+' on '+bg]=ratio(v(fg),v(bg));return out;});
  for(const [k,x] of Object.entries(r)){report.contrast.push({theme,pair:k,ratio:+x.toFixed(2)});assert.ok(x>=4.5,`${theme}: ${k} contrast ${x.toFixed(2)}`);}
 }
 await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
}
async function extras(page,url){
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});await contrast(page);
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png')});
 /* 표지 실험: 누리200 비중 막대를 키보드로 옮긴다. */
 const r=page.locator('#home-w');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'100');const hr=await page.locator('.home-result').innerText();assert.match(hr,/누리200 100% · 채권 0%: 기대수익 7\.00%, 표준편차 18\.00%/);assert.doesNotMatch(hr,BAD);
 await page.keyboard.press('Home');assert.match(await page.locator('.home-result').innerText(),/기대수익 3\.50%, 표준편차 6\.00%/);
 /* 4장: 무위험 금리 막대를 키보드로 옮기고, 공매도 금지를 끄면 투자선 설명이 바뀐다. */
 await frame(page,url,390,'frontier');await page.locator('#frf').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#frf').inputValue(),'2.75','keyboard moves the risk-free rate');assert.doesNotMatch(await page.locator('#lab-efficient-frontier .readout').innerText(),/샤프 비율 <b>0\.3463/);
 await page.locator('#flong').focus();await page.keyboard.press('Space');assert.match(await page.locator('#lab-efficient-frontier .readout').innerText(),/공매도 허용/);
 /* 8장: 나쁜 쪽 숫자는 중앙값 바로 옆에, 돈을 빌리지 않는다는 문장과 함께 나온다. */
 await frame(page,url,390,'kelly');const k=await page.locator('#lab-kelly-growth').innerText();assert.match(k,/중앙값 1\.650배 바로 옆에 하위 10% 0\.495배/);assert.match(k,/하위 10%[\s\S]*절반 아래/);assert.match(k,/돈을 빌려 이 비율을 채우는 계산을 하지 않는다/);
 /* 10장: 계산 결과는 펼치기를 켤 때만, 풀이 상자는 접힌 채, 메모는 이 브라우저에만. */
 await frame(page,url,390,'final');const f=page.locator('#lab-plan-conditions');
 assert.ok(!(await allText(f)).includes('16.46%'),'final hides plan A numbers until pshow');
 await f.locator('#pshow').focus();await page.keyboard.press('Space');const ft=await allText(f);has(ft,['16.46%','59.42%','✗ 만족하지 못함','⏱ 위험자산 한도 70% · 보도 기준 · 법령 원문 확인 못함','이 한도에는 예외가 있습니다(적격 TDF, 보도 기준).'],'final pshow');await reset(f);
 const sol=page.locator('details.solution');assert.ok(await sol.count()>=1,'final has a folded solution');assert.equal(await sol.first().evaluate(d=>d.open),false,'solution starts folded');
 await sol.first().locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await sol.first().evaluate(d=>d.open),true,'solution opens with the keyboard');
 await page.fill('#pmemo','점검일에 한도의 확인일도 다시 봄');await page.selectOption('#prule','band');await page.reload();await page.locator('#pmemo').waitFor();assert.equal(await page.inputValue('#pmemo'),'점검일에 한도의 확인일도 다시 봄','memo kept in this browser');assert.equal(await page.inputValue('#prule'),'band');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bookshelf:allocation:v1:final-notes')).pmemo),'점검일에 한도의 확인일도 다시 봄');await page.evaluate(()=>localStorage.removeItem('bookshelf:allocation:v1:final-notes'));
 /* 예측을 적고 결과 읽기를 펴면 내 예측이 되울린다. */
 await frame(page,url,390,'beta');await page.fill('#guess-beta-estimate','0.700');await page.locator('#lab-beta-estimate details.guide-reading summary').click();await page.waitForFunction(()=>/내 예측: 0\.700/.test(document.querySelector('#lab-beta-estimate .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,1280,'final');await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-plan-conditions').screenshot({path:path.join(output,'final-dark.png')});await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,320,'crisis');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>ABook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');assert.match(await page.locator('.home-result').innerText(),/누리200 60% · 채권 40%: 기대수익 5\.60%, 표준편차 10\.58%/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page,page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await errorStates(page,url);await extras(page,url);await artCheck(page,url);
  const missing=report.missing.filter(u=>!/\/favicon\.ico$/.test(u));assert.deepEqual(missing,[],'missing files');
  const consoleErrors=report.console.filter(t=>!/^Failed to load resource/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,timing:report.timing,art:report.art,svgTexts:report.svgTexts,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);process.exit(1);});
