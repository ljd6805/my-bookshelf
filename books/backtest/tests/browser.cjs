/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역, 그림 글자가 viewBox 안에 있는지와 글자끼리 겹치지 않는지 본다.
   기본값과 비교 예제가 L2·확인 문제의 답을 보이지 않는지(누설 막이), 6·8·11장 비교 예제와 모든 실험의 결과 읽기가 예측을 적기 전에는 닫혀 있는지,
   6장 표본 밖 결과는 설정을 고른 뒤에만 열리는지, 7장 키 칸이 읽기 전용 가상 키뿐인지, 마지막 과제의 풀이가 세 금액을 채운 뒤에만 열리는지,
   두 테마의 글자 대비, 서가 삽화는 움직이고 동작 줄이기에서 멈추는지도 본다.
   실행: node books/backtest/tests/browser.cjs (또는 BOOK_URL=http://127.0.0.1:8765/books/backtest/)
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'backtest-evidence');
const report={date:'2026-10-14',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0,contrast:[]};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: BMath 계산과 같고, 본문이 이미 말한 값이거나 L2·확인 문제와 다른 입력의 값이다. */
const DEFAULTS={
 'grid-run':['왕복 818번','연 수익률 25.30%','−106,500원(끝에 75주)','이 계산이 쓰지 않은 것','+466원','기대 수익률이 아니며'],
 'assume-data':['연 수익률 12.25%','+1,242,550원','왕복 1,724번','−13.18%','−79.50%','+2.50%','0.978701'],
 'assume-code':['연 수익률 11.22%','+1,127,550원','17,500원보다 높게 판 날 0번','차이 26,700원'],
 'assume-fills':['연 수익률 11.22%','저가 먼저 매수 2·매도 1','+929원','+883원','순손익 +621원','⏱ 증권거래세 0.20%','확인일을 보고 다시 확인하세요'],
 'sharpe-boot':['연 수익률 5.62%','연 변동성 12.43%','샤프 비율 0.502','최대 낙폭 −10.14%','1년째 1.063','−0.460','다음 3년의 손실 확률이 아닙니다','월 샤프 0.124'],
 'is-oos':['표본 안 1등 18.81%','고르면 3년째(표본 밖) 결과가 열립니다','1.113','표본 밖 3위','11.00%p'],
 'mock-api':['접수 4건','2초 걸립니다','384번','미리 정한 시나리오'],
 'order-recon':['전량 체결','주식 수 차이 0주','✓ 장부와 계좌가 맞습니다'],
 'stop-rules':['요청 6건','걸리지 않았습니다','60,000원','실제 사고를 막는다는 뜻이 아닙니다'],
 'fill-match':['누적 차이 0원','체결률 100.00%','경보가 울리지 않았습니다','체결률 50.00%'],
 'loss-audit':['세 칸을 모두 채우면','설명되지 않은 나머지 −10,000원','판정할 수 없습니다','확인일을 보고 다시 확인하세요']
};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). 숫자는 본문 계산값이다. */
const PRESETS={
 'grid-run':[[0,['연 수익률 1.10%']],[1,['연 수익률 12.25%','왕복 1,724번']]],
 'assume-data':[[0,['연 수익률 6.24%']],[1,['−1.32%']]],
 'assume-code':[[0,['연 수익률 12.25%']]],
 'assume-fills':[[0,['연 수익률 9.09%']]],
 'sharpe-boot':[[0,['−7.91%','+21.37%','22.67%']],[1,['0.204','−22.26%']]],
 'is-oos':[[1,['23.23%','82위']]],
 'fill-match':[[1,['−2,441원','93.75%']]]
};
const setValue=async(lab,id,v)=>{await lab.locator('#'+CSS_ESC(id)).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
const CSS_ESC=s=>s.replace(/([^a-zA-Z0-9_-])/g,'\\$1');
const setAll=async(lab,o)=>{for(const [k,v] of Object.entries(o))await setValue(lab,k,v);};
const readout=lab=>lab.locator('.readout').innerText();
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로), 결과 문장과 그림·표에 나와야 할 답]. 어떤 비교 예제로도 닿지 않는다. */
const L2={
 'grid-run':[{cb:35000,cs:35500,cq:10,cl:'35100, 34900, 35600, 35300',ce:true},['+4,895원']],
 'assume-data':[{dp:40000,dr:2,dc:20100},['−49.75%','+0.50%']],
 'assume-code':[{lq:40,lo:18300,ll:17300,lc:17600,ls:17500},['차이 32,000원']],
 'assume-fills':[{fb:19800,fs:20000,fq:5,fo:19900,fh:20050,fl:19780,fc:19950},['+771원','+736원']],
 'sharpe-boot':[{mr:'+2, −1, +3, 0, +1, −2',mv:'100, 104, 101, 106, 99, 103'},['0.293','1.014','−6.60%']],
 'is-oos':[{rI:'18, 15, 12, 9, 6',rO:'−2, 4, 7, 3, 5'},['표본 밖 5위','20.00%p']],
 'mock-api':[{an:20},['9초째']],
 'order-recon':[{op:18750,oqty:10,ot1:'fill',oq1:4,ot2:'cancelReq',ot3:'cancelAck'},['주식 수 차이 +4주','현금 차이 −75,011원']],
 'stop-rules':[{ks:'direct',kt:'B2, B3, B4, B5, B6, B7, B8, B9, B10',kn:8,kH:false,kR:false,kD:false},['9번째']],
 'fill-match':[{fq:8,fb:'B 19250 19250; S 19250 19500; B 19000 19000; S 19000 19250',fm:'B 19250 19250; B 19000 18950; S 19000 19250'},['75.00%','−400원']],
 'loss-audit':[{va:75,vl:60,vc:35150},['15주','527,250원']]
};
/* 확인 문제의 답: 기본 화면과 비교 예제에는 나오지 않는다(독자가 입력을 바꿔야 닿는다). */
const QUIZ_ANSWER={'grid-run':['10.00%'],'assume-data':['−15.6%','15.60%'],'assume-fills':['696원'],'is-oos':['2.302'],'mock-api':['720번'],'stop-rules':['75,000원'],'fill-match':['+325원'],'loss-audit':['−8,620원']};
/* 예측을 적어야 비교 예제가 열리는 실험. 결과 읽기는 모든 실험에서 예측을 적어야 열린다. */
const GATED=['is-oos','order-recon','loss-audit'];
/* 비워 두어도 뜻이 있는 칸: 체결이 없는 날의 체결 목록. */
const EMPTY_OK={'fill-match:fb':/계산 못함\(백테스트 체결 0건\)/,'fill-match:fm':/모의 서버 체결 0건/};
/* 다른 칸을 먼저 바꿔야 효과가 보이는 칸. */
const CONTEXT={kt:{ks:'direct'},aa:{ar:true},...Object.fromEntries([0,1,2,3,4,5].map(i=>['oq'+i,{['ot'+i]:'fill'}]))};

const noQuiz=(t,id,what)=>{for(const s of QUIZ_ANSWER[id]||[])assert.ok(!t.includes(s),`${id} ${what} shows the quiz answer ${s}`);};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/backtest/`;
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
 const controls=await lab.locator('.lab-inner input:not([data-note]),.lab-inner select:not([data-note])').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,ro:e.readOnly,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
 for(const c of controls)assert.ok(await lab.locator(`label[for="${c.id}"]`).count(),`${id}:${c.id} has no label`);
 const values=c=>c.tag==='SELECT'?c.options:c.type==='checkbox'?[false,true]:c.type==='text'?['1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12','x']:[c.min,c.max];
 const ctx=async c=>{for(const [k,v] of Object.entries(CONTEXT[c.id]||{}))await setValue(lab,k,v);};
 for(const c of controls){
  await reset(lab);await ctx(c);
  for(const v of values(c)){await setValue(lab,c.id,v);await timed(lab,id);assert.doesNotMatch(await state(lab),BAD,`${id}:${c.id}=${v}`);}
 }
 for(const c of controls.filter(x=>['number','text'].includes(x.type))){await reset(lab);await ctx(c);await setValue(lab,c.id,'');const t=await readout(lab);
  if(/^x[abc]$/.test(c.id)){assert.match(t,/세 칸을 모두 채우면/,`${id}:${c.id} empty keeps the solution closed`);continue;}
  if(EMPTY_OK[id+':'+c.id]){assert.match(t,EMPTY_OK[id+':'+c.id],`${id}:${c.id} empty is a valid state`);continue;}
  assert.match(t,/✗ .*확인해 주세요/,`${id}:${c.id} empty`);const fx=await lab.locator('#'+c.id).evaluate(e=>({inv:e.getAttribute('aria-invalid'),msg:e.parentElement.querySelector('.field-error')?.innerText||'',desc:e.getAttribute('aria-describedby')||''}));assert.equal(fx.inv,'true',`${id}:${c.id} aria-invalid`);assert.match(fx.msg,/^✗ /,`${id}:${c.id} visible hint`);assert.ok(fx.desc.includes(c.id+'-err'),`${id}:${c.id} describedby`);}
 await reset(lab);assert.equal(await lab.locator('[aria-invalid=true],.field-error').count(),0,`${id}: reset clears field errors`);
 return controls.length;
}
async function labCheck(page,lab,width,id){
 await svgInside(lab,`${id}@${width}`);
 const before=await readout(lab);has(before,DEFAULTS[id],id);noQuiz(await allText(lab),id,'default');assert.doesNotMatch(before,BAD,id);
 for(const s of L2[id][1])assert.ok(!(await allText(lab)).includes(s),`${id} default shows the L2 answer ${s}`);
 assert.match(before,/실제 계산|미리 정한 시나리오/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 const reading=lab.locator('details.guide-reading');assert.equal(await reading.evaluate(d=>d.open),false,`${id}: reading starts closed`);
 if(GATED.includes(id)){assert.ok(await lab.locator('[data-preset]').first().isDisabled(),`${id} presets stay closed before a guess`);}
 await page.fill('#guess-'+id,'먼저 손으로 계산한 값');
 if(GATED.includes(id))assert.ok(!(await lab.locator('[data-preset]').first().isDisabled()),`${id} presets open after a guess`);
 const presetCount=await presets(lab,id);await svgInside(lab,`${id} after presets@${width}`);await l2(lab,width,id);await svgInside(lab,`${id} L2@${width}`);
 const n=await controlsCheck(lab,id);
 await reset(lab);assert.equal(await readout(lab),before,`${id}: reset`);await page.fill('#guess-'+id,'');
 report.labs.push({width,id,controls:n,presets:presetCount,tables:nTables,reset:true});
}
async function quiz(page,c){
 await page.locator(`[data-answer="${c.answer}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^정답입니다/);
 await page.locator(`[data-answer="${(c.answer+1)%c.n}"]`).click();assert.match(await page.locator('.quiz-feedback').innerText(),/^다시 생각/);
 await page.locator(`[data-transfer="${c.transfer}"]`).click();assert.match(await page.locator('.transfer-feedback').innerText(),/^정답입니다/);
}
/* 오류 상태: 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다(NaN 대신 글자). */
async function errorStates(page,url){
 const cases=[['backtest','grid-run',{cq:0}],['lookahead','assume-code',{ll:17800,lc:17700}],['fills','assume-fills',{fl:19900,fc:19800}],['metrics','sharpe-boot',{mr:'x, y'}],
  ['limits','stop-rules',{ks:'direct',kt:'Q9'}],['monitor','fill-match',{fb:'Z 1 2'}],['orders','order-recon',{oqty:0}]];
 for(const [ch,id,act] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await setAll(lab,act);const t=await readout(lab);assert.match(t,/✗ /,`${id} error state ${JSON.stringify(act)}: ${t}`);assert.doesNotMatch(t,BAD,`${id} error state`);await reset(lab);assert.doesNotMatch(await readout(lab),/✗ .*확인해 주세요/,`${id} reset clears the error`);report.errorStates=(report.errorStates||0)+1;}
}
const ART_STATE=()=>['move','s3','a1'].map(k=>getComputedStyle(document.querySelector('.bt-ill-'+k)).animationName);
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:72,170,170;--edge:40,120,120">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!document.querySelector('.cv-text')&&getComputedStyle(document.querySelector('.cv-text')).fontSize!=='',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
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
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.bt-ill-match')).opacity),'1','reduced motion shows the reconciled end state');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['bt-ill-move','bt-ill-s3','bt-ill-a1'],'shelf art animates');
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
/* 저장소: localStorage에는 서재 공통 키(진도·테마)만, 실험 입력과 예측은 어디에도 남지 않는다. */
async function storageCheck(page,url){
 await frame(page,url,390,'orders');await page.fill('#guess-order-recon','4주');
 const st=await page.evaluate(()=>({local:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),session:Object.keys(sessionStorage)}));
 for(const [k,v] of Object.entries(st.local)){assert.ok(k==='bookshelf:backtest:v1:study'||/^bookshelf:shelf:v1:/.test(k),'unexpected localStorage key '+k);assert.doesNotMatch(v,/4주|order-recon/,'guess stored in '+k);}
 assert.ok(Object.keys(st.local).includes('bookshelf:backtest:v1:study'),'study progress key exists');assert.deepEqual(st.session,[],'sessionStorage is empty');report.storage=st;
}
async function extras(page,url){
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});await contrast(page);
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png')});
 /* 표지 실험: 단계 막대를 키보드로 옮긴다. */
 const r=page.locator('#home-s');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'5');const hr=await page.locator('.home-result').innerText();assert.match(hr,/연 수익률 3\.05%/);assert.doesNotMatch(hr,BAD);
 await page.keyboard.press('Home');assert.match(await page.locator('.home-result').innerText(),/1장의 첫 백테스트 → 연 수익률 12\.25%/);
 await storageCheck(page,url);
 /* 결과 읽기는 예측을 적기 전에는 열리지 않고, 적으면 내 예측을 먼저 보인다. */
 await frame(page,url,390,'fills');const lab=page.locator('#lab-assume-fills'),rd=lab.locator('details.guide-reading');
 await rd.locator('summary').click();assert.equal(await rd.evaluate(d=>d.open),false,'reading stays closed without a guess');assert.ok(await lab.locator('.lock-note').count(),'lock note appears');
 await page.fill('#guess-assume-fills','1번 700원');await rd.locator('summary').click();await page.waitForFunction(()=>/내 예측: 1번 700원/.test(document.querySelector('#lab-assume-fills .guess-echo')?.innerText||''),null,{timeout:3000});
 /* 6장: 표본 밖 결과는 설정을 고른 뒤에만. */
 await frame(page,url,390,'overfit');const io=page.locator('#lab-is-oos');let t=await allText(io);assert.ok(!t.includes('6.83')&&!t.includes('82위'),'out-of-sample hidden before a pick');
 await setAll(io,{on:'402'});t=await allText(io);assert.ok(!t.includes('82위'),'still hidden with 402 settings and no pick');await setAll(io,{op:'0'});has(await allText(io),['82위','6.83%'],'is-oos after a pick');
 /* 7장: 키 칸은 읽기 전용 가상 키뿐, 비밀번호 칸 없음. */
 await frame(page,url,390,'api');const api=page.locator('#lab-mock-api');has(await api.innerText(),['가상 키(읽기 전용)','실제 증권사에 연결하지 않'],'mock-api banner');assert.equal(await page.locator('input[type=password]').count(),0,'no password input');
 /* 11장: 세 금액을 채워야 풀이가 열리고, 합이 맞으면 ✓. */
 await frame(page,url,390,'final');const f=page.locator('#lab-loss-audit');const ft0=await allText(f);for(const s of ['7,178','17,326','311,726'])assert.ok(!ft0.includes(s),'final hides '+s);
 await setAll(f,{xa:'-64557',xb:'-7178'});assert.match(await readout(f),/세 칸을 모두 채우면/);await setAll(f,{xc:'-17326'});has(await allText(f),['−89,061'],'final sum');assert.match(await readout(f),/✓/);await reset(f);
 const sol=page.locator('details.solution');assert.ok(await sol.count()>=1,'final has a folded solution');assert.equal(await sol.first().evaluate(d=>d.open),false,'solution starts folded');
 await sol.first().locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await sol.first().evaluate(d=>d.open),true,'solution opens with the keyboard');
 await frame(page,url,1280,'limits');await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-stop-rules').screenshot({path:path.join(output,'limits-dark.png')});await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,1280,'fills');await page.locator('#lab-assume-fills').screenshot({path:path.join(output,'fills-desktop.png')});
 await frame(page,url,320,'orders');await page.screenshot({path:path.join(output,'orders-mobile.png'),fullPage:false});
 await frame(page,url,320,'metrics');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>BBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],n:c.quiz[1].length,transfer:c.transfer[2],labs:c.labs})));
  const widths=(process.env.WIDTHS||'1280,390,320').split(',').map(Number);
  for(const width of widths){
   await frame(page,url,width,'home');assert.match(await page.locator('.home-result').innerText(),/연 수익률 12\.25%/);
   for(const c of chapters){await frame(page,url,width,c.id);for(const id of c.labs)await labCheck(page,page.locator('#lab-'+id),width,id);await quiz(page,c);}
  }
  await errorStates(page,url);await extras(page,url);await artCheck(page,url);
  const missing=report.missing.filter(u=>!/\/favicon\.ico$/.test(u));assert.deepEqual(missing,[],'missing files');
  const consoleErrors=report.console.filter(t=>!/^Failed to load resource/.test(t));
  assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(consoleErrors.length,0,consoleErrors.join('\n'));
  report.success=true;fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({views:report.views.length,labs:report.labs.length,l2:report.l2.length,errorStates:report.errorStates,timing:report.timing,art:report.art,svgTexts:report.svgTexts,success:true,output}));
 }finally{await browser.close();server.stop();}
}
run().catch(e=>{console.error(e);process.exit(1);});
