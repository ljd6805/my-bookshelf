/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역, 그림 글자가 viewBox 안에 있는지와 글자끼리 겹치지 않는지 본다.
   1·9·10장 비교 예제는 예측을 적기 전에는 닫혀 있는지, 1장 선택은 localStorage·sessionStorage 어디에도 남지 않고 새로고침하면 사라지는지,
   2장 확률 가중 문턱(274.07만 원)은 켤 때만 나오는지, 3장 범위는 1~13주·14~26주뿐인지, 9장 경로 선택 칸, 10장 결과 칸과 풀이 상자가 접혀 있는지,
   두 테마의 글자 대비, 서가 삽화는 움직이고 동작 줄이기에서 멈추는지도 본다.
   실행: node books/psychology/tests/browser.cjs (또는 BOOK_URL=http://127.0.0.1:8765/books/psychology/)
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'psychology-evidence');
const report={date:'2026-10-14',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0,contrast:[]};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 'two-frame-choice':['새로고침하면 선택이 사라진다','152명','155명','그대로 견줄 수 없습니다','펼치기'],
 'value-function':['105.90','−129.47','−11.79','251.31만 원','✗ 거절'],
 'disposition-count':['0.600','0.000','+0.600'],
 'base-rate-grid':['맞은 추천 12 + 틀린 추천 98 = 110','10.9%'],
 'likelihood-odds':['47.4%','81.8%','34.4%p'],
 'interval-cost':['66.7%','5.3%','284.7%','3만 5,284원','0.69%p','3,355.3만 원','⏱ 증권거래세 0.20%','확인일을 보고 다시 확인하세요'],
 'info-cascade':['5번째 사람부터 폭포','맞는 폭포','36.8%','가정을 단순하게 둔 모형'],
 'loss-by-trials':['+0.10','24.9%','15.9%'],
 'rule-replay':['8주 온결식품 −10.35%','14주 새벽전자 −11.64%','2,001만 4,650원','+44만 4,934원','+67만 9,735원','−23만 4,801원','12번','5건','어떤 규칙도 권하지 않습니다'],
 'journal-audit':['반대 증거 5건','적용할 규칙 9건','점검표 결과 펼치기','확인일을 보고 다시 확인하세요']
};
const CHART={'journal-audit':['가상의 인물과 기록으로 만든 계산 연습이며, 어떤 규칙도 권하지 않습니다']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'two-frame-choice':[[0,['2,200만 원','A·B 기대 손익 +200만 원 · 같음']],[1,['C·D 기대 손익 −200만 원 · 같음']],[2,['A +250만 원, B +300만 원 · 다름']]],
 'value-function':[[0,['+24.18','100.00만 원','✓ 받아들임']],[1,['−7.86','318.51만 원']],[2,['274.07만 원','37.24만 원','0.4206']]],
 'disposition-count':[[0,['1.000','0.200']],[1,['0.667','PLR 계산할 수 없음']],[2,['0.333','차이 PGR − PLR = 0.000']]],
 'base-rate-grid':[[0,['40.0%']],[1,['15.5%']],[2,['55.0%']]],
 'likelihood-odds':[[0,['확신 81.8%']],[1,['18.4%','52.9%']],[2,['37.5%','75.0%']]],
 'interval-cost':[[0,['0.17%p','3,523.8만 원']],[1,['2.76%p','2,751.1만 원']],[2,['0.09%p','ETF는 거래세 없음']]],
 'info-cascade':[[0,['14.3%','60.0%']],[1,['3번째 사람부터 폭포','틀린 폭포']],[2,['3번째 사람부터 폭포','틀린 폭포']]],
 'loss-by-trials':[[0,['13.5%']],[1,['4.9%']],[2,['12.8%']]],
 'rule-replay':[[0,['−63만 6,018원','+36만 1,832원','R1을 지킨 쪽이 손해입니다']],[1,['−82만 9,846원','16주 온결식품 −15.52%']],[2,['+93만 8,870원']]],
 'journal-audit':[[0,['−82만 9,846원','걸리지 않아']],[1,['+93만 8,870원','−33만 6,663원']],[2,['반대 증거 5건']]]
};
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
const setAll=async(lab,o)=>{for(const [k,v] of Object.entries(o))await setValue(lab,k,v);};
const readout=lab=>lab.locator('.readout').innerText();
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로), 결과 문장과 그림·표에 나와야 할 답]. 어떤 비교 예제로도 닿지 않는다. */
const L2={
 'two-frame-choice':[{fp:'1/4',famt:800,fsure:200,fshow:true},['C·D 기대 손익 −600만 원 · 같음']],
 'value-function':[{pa:1,pb:1},['225.00만 원']],
 'disposition-count':[{drange:'direct',dRG:2,dPG:6,dRL:1,dPL:9},['0.250','0.100','+0.150']],
 'base-rate-grid':[{bb:5,bh:80,bf:20},['17.4%']],
 'likelihood-odds':[{cp:40,cl0:3,ce1:false,ce2:false,cl3:0.25,ce4:false},['33.3%','66.7%']],
 'interval-cost':[{in:20,ik:11},['55.0%','18.0개']],
 'info-cascade':[{hp:0.7},['56.7%']],
 'loss-by-trials':[{on:10},['26.2%','23.4%']],
 'rule-replay':[{gq:300,gr:18000,gs:16500},['45만 원']],
 'journal-audit':[{ashow:true},['0.714','0.111']]
};
/* 확인 문제(와 전이 문항)의 답: 기본 화면과 비교 예제에는 나오지 않는다(독자가 입력을 바꿔야 닿는다). */
const QUIZ_ANSWER={'two-frame-choice':['1,600만 원(확률 1/3) 또는 1,000만 원'],'value-function':['+10.92','195.50만','214.21만'],'disposition-count':['1.51배','0.750'],'base-rate-grid':['19.7%','60.0%'],'likelihood-odds':['31.0%'],
 'interval-cost':['23만 원','1.15%p','0.15%p'],'info-cascade':['6.0%'],'loss-by-trials':['= 0.00','24.3%'],'rule-replay':['39.4%','61만 2,510원','28만 5,555원'],'journal-audit':['4.8주','19주','0.714','44만 4,934원']};
/* 예측을 적어야 비교 예제가 열리는 실험. */
const GATED=['two-frame-choice','rule-replay','journal-audit'];
/* 다른 칸을 먼저 바꿔야 효과가 보이는 칸. */
const CONTEXT={fg:{fl:'sure'},fl:{fg:'sure'},dRG:{drange:'direct'},dPG:{drange:'direct'},dRL:{drange:'direct'},dPL:{drange:'direct'},ar1:{arshow:true},ar2:{arshow:true}};

const noQuiz=(t,id,what)=>{for(const s of QUIZ_ANSWER[id]||[])assert.ok(!t.includes(s),`${id} ${what} shows the quiz answer ${s}`);};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/psychology/`;
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
 assert.match(before,/실제 계산|미리 정한 시나리오/,`${id}: result is labelled`);
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
/* 오류 상태: 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다(NaN 대신 글자). */
async function errorStates(page,url){
 const cases=[['frame','two-frame-choice',{fs:50},/✗ 시작 금액을 확인해 주세요/],['prospect','value-function',{pl:0},/✗ 손실 회피 계수 λ를 확인해 주세요/],
  ['disposition','disposition-count',{drange:'direct',dRG:0,dPG:0,dRL:0,dPL:0},/✗ 네 칸을 확인해 주세요 · 네 칸이 모두 0이면/],['baserate','base-rate-grid',{bh:0,bf:0},/✗ 적중률과 오경보율을 확인해 주세요/],
  ['confirm','likelihood-odds',{cl2:0},/✗ 증권사 목표가 상향의 우도비를 확인해 주세요/],['overconfidence','interval-cost',{ik:12},/✗ 맞은 수를 확인해 주세요 · 맞은 수 k\(12\)가 범위 수 n\(9\)보다 많습니다/],
  ['herd','info-cascade',{hs:'GGXB'},/✗ 신호를 확인해 주세요 · G\(좋음\)와 B\(나쁨\)만/],['herd','info-cascade',{hs:'G'.repeat(21)},/✗ 신호를 확인해 주세요 · 신호는 20명까지/],['outcome','loss-by-trials',{on:0},/✗ 횟수를 확인해 주세요/],
  ['rules','rule-replay',{rl1:60},/✗ R1 한도를 확인해 주세요/],['final','journal-audit',{af0:false,af1:false,af2:false,af3:false},/✗ 일지 양식의 칸을 확인해 주세요/]];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await setAll(lab,act);const t=await readout(lab);assert.match(t,re,`${id} error state ${re}: ${t}`);assert.doesNotMatch(t,BAD,`${id} error state`);await reset(lab);assert.doesNotMatch(await readout(lab),/✗ .*확인해 주세요/,`${id} reset clears the error`);}
}
const ART_STATE=()=>['g4','l19','sold4'].map(k=>getComputedStyle(document.querySelector('.bf-ill-'+k)).animationName);
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:75,130,203;--edge:52,93,149">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
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
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.bf-ill-l19')).transform),'none','reduced motion shows the full holding bar');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.bf-ill-sold4')).opacity),'0.35','reduced motion shows the sold rows dimmed');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['bf-ill-grow4','bf-ill-grow19','bf-ill-fade4'],'shelf art animates');
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
/* 1장: 선택은 저장소 어디에도 남지 않는다. localStorage에는 서재 공통 키(진도·테마)만, sessionStorage에는 아무것도 남지 않는다. */
async function storageCheck(page,url){
 await frame(page,url,390,'frame');const lab=page.locator('#lab-two-frame-choice');
 assert.match(await lab.innerText(),/새로고침하면 선택이 사라진다/);
 await page.selectOption('#fg','sure');await page.selectOption('#fl','risky');let t=await readout(lab);assert.match(t,/두 틀에서 고른 쪽: 다름/);assert.doesNotMatch(t.replace("점수나 판정은 붙이지 않습니다",""),/점수|정답|합리|비합리|맞았|틀렸/);
 await page.selectOption('#fl','sure');assert.match(await readout(lab),/두 틀에서 고른 쪽: 같음/);
 const st=await page.evaluate(()=>({local:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),session:Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)]))}));
 for(const [k,v] of Object.entries(st.local)){assert.ok(k==='bookshelf:psychology:v1:study'||/^bookshelf:shelf:v1:/.test(k),'unexpected localStorage key '+k);assert.doesNotMatch(v,/sure|risky|같음|다름|two-frame/,'choice stored in '+k);}
 assert.ok(Object.keys(st.local).includes('bookshelf:psychology:v1:study'),'study progress key exists');
 assert.deepEqual(Object.values(st.session).filter(v=>/sure|risky|같음|다름/.test(v)),[],'sessionStorage holds no choice');report.storage=st;
 await page.reload();await page.locator('#fg').waitFor();assert.equal(await page.inputValue('#fg'),'');assert.equal(await page.inputValue('#fl'),'');assert.match(await readout(lab),/두 틀에서 하나씩 고르면/);
}
async function extras(page,url){
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});await contrast(page);
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png')});
 /* 표지 실험: λ 막대를 키보드로 옮긴다. */
 const r=page.locator('#home-l');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'3');const hr=await page.locator('.home-result').innerText();assert.match(hr,/λ 3\.00: 전망 가치 −33\.36 ✗ 거절/);assert.doesNotMatch(hr,BAD);
 await page.keyboard.press('Home');assert.match(await page.locator('.home-result').innerText(),/λ 1\.00: 전망 가치 \+24\.18 ✓ 받아들임/);
 await storageCheck(page,url);
 /* 2장: 확률 가중 문턱은 켤 때만. */
 await frame(page,url,390,'prospect');const vf=page.locator('#lab-value-function');assert.ok(!(await allText(vf)).includes('274.07'),'weighted threshold hidden until the toggle');
 await page.locator('#pw').focus();await page.keyboard.press('Space');has(await allText(vf),['274.07만 원','0.4206','37.24만 원'],'weighting on');
 /* 3장: 일지 범위는 1~13주·14~26주와 직접 입력뿐. */
 await frame(page,url,390,'disposition');assert.deepEqual(await page.locator('#drange option').evaluateAll(o=>o.map(x=>x.value)),['1-13','14-26','direct']);
 /* 9장: 경로 선택 칸. */
 await frame(page,url,390,'rules');assert.deepEqual(await page.locator('#rpath option').evaluateAll(o=>o.map(x=>[x.value,x.textContent])),[['journal','선우의 일지'],['rebound','반등 경로(가정)']]);
 await page.selectOption('#rpath','rebound');assert.match(await readout(page.locator('#lab-rule-replay')),/R1을 지킨 쪽이 손해입니다/);
 /* 10장: 결과 칸과 풀이 상자는 접혀 있다. */
 await frame(page,url,390,'final');const f=page.locator('#lab-journal-audit');const ft0=await allText(f);for(const s of ['0.714','4.8주','44만 4,934','82만 9,846'])assert.ok(!ft0.includes(s),'final hides '+s);
 await f.locator('#ashow').focus();await page.keyboard.press('Space');has(await allText(f),['0.714','0.111','4.8주','19주','5/9건','−43만 284원'],'final ashow');await reset(f);
 const sol=page.locator('details.solution');assert.ok(await sol.count()>=1,'final has a folded solution');assert.equal(await sol.first().evaluate(d=>d.open),false,'solution starts folded');
 await sol.first().locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await sol.first().evaluate(d=>d.open),true,'solution opens with the keyboard');
 /* 예측을 적고 결과 읽기를 펴면 내 예측이 되울린다. */
 await frame(page,url,390,'baserate');await page.fill('#guess-base-rate-grid','17%');await page.locator('#lab-base-rate-grid details.guide-reading summary').click();await page.waitForFunction(()=>/내 예측: 17%/.test(document.querySelector('#lab-base-rate-grid .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,1280,'rules');await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-rule-replay').screenshot({path:path.join(output,'rules-dark.png')});await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,1280,'frame');await page.locator('#lab-two-frame-choice').screenshot({path:path.join(output,'frame-desktop.png')});
 await frame(page,url,320,'disposition');await page.screenshot({path:path.join(output,'disposition-mobile.png'),fullPage:false});
 await frame(page,url,320,'herd');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>PBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');assert.match(await page.locator('.home-result').innerText(),/λ 2\.25: 전망 가치 −11\.79 ✗ 거절/);
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
