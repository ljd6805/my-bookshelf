/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역을 본다. 서가 삽화와 표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/tax/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'tax-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. CHART는 그림·표 쪽 글자. */
const DEFAULTS={
 'tax-map':['30,800원','2번','53,297원','22,497원','증권사가 뗌','실제 계산','보도·안내 기준'],
 stt:['5,000원','15,000원','20,000원','0.20%','손익이 0이든'],
 withhold:['200,000원','28,000원과','2,800원을','169,200원'],
 gains:['소액주주','양도세는 0원','50억 원'],
 threshold:['1,000,000원','110,000원','24%','가정'],
 'etf-tax':['284,690원','1,563,950원','192,290원','8,333,333원'],
 isa:['1,848,640원','세금 0원','284,690원'],
 pension:['990,000원','431,675원','2,406,965원','431,675원(2단계에서 계산한 세금)','321,206원','확인 못함'],
 'after-tax':['1,848,640원','1,563,950원','2,406,965원','1,543,615원','92,400원','284,690원','보도·안내 기준(공식 원문 미확인)'],
 'final-order':['2,447,635원','1,848,640원','2,333,759원','739,456원','1,708,179원','3년 뒤 손에 쥐는 금액 아님','X입니다']
};
const CHART={'after-tax':['세전 1,848,640원','순이익 1,848,640원 − 비과세 2,000,000원'],'final-order':['받은 공제','세 배분안의 세후 금액'],stt:['코넥스']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'tax-map':[[0,['92,400원','1번']],[1,['284,690원','192,290원','2번']],[2,['92,400원','본인이 신고']]],
 stt:[[0,['20,000원']],[1,['10,000원']],[2,['480,000원']],[3,['0원']]],
 withhold:[[0,['70,000원','7,000원','423,000원']],[1,['169,200원']],[2,['2,800,000원','16,920,000원']]],
 gains:[[0,['7,500,000원','1,650,000원','본인이 신고합니다(신고 시기는 확인 못함)']],[1,['양도세 0원']],[2,['대주주','274,700원']]],
 threshold:[[0,['더 낼 세금은 0원']],[1,['정확히 2,000만 원도']],[2,['5,000,000원','55,000원']]],
 'etf-tax':[[0,['92,400원','1,756,240원']],[1,['1,756,240원']],[2,['1,540,000원','1,650,000원','110,000원']]],
 isa:[[0,['3,166,529원','115,486원','487,645원','372,159원']],[1,['4,000,000원','487,645원']],[2,['22,497원','1,826,143원','확인 못함']],[3,['187,264원','1,028,736원']]],
 pension:[[0,['1,485,000원','2,562,269원','586,507원(2단계에서 계산한 세금)']],[1,['1,295,025원','1,543,615원','차이 0원','963,620원']],[2,['792,000원','2,208,965원']]],
 'after-tax':[[0,['1,756,240원']],[1,['살 수 없습니다(보도 기준)']],[2,['2,208,965원','1,345,615원']],[3,['5,754,867원','6,327,002원']]],
 'final-order':[[0,['2,249,635원','2,135,759원']],[1,['1,665,625원','1,551,749원','중도 인출']],[2,['3,751,616원','3,078,606원','3,554,674원']]]
};
/* 예측 질문(L2) 사례: [먼저 누를 비교 예제 번호 또는 null, 바꿀 입력, 결과 문장에 나와야 할 답]. */
const L2={
 'tax-map':[null,{mprod:'kother',mincome:20000,mgain:100000},['3,080원','15,400원','2번','18,480원']],
 stt:[null,{smarket:'konex',samt:5000000,stimes:24},['120,000원']],
 withhold:[null,{wkind:'dividend',wamt:30000000,whigh:true},['4,800,000원']],
 gains:[null,{gasset:'fetf',ggain:6000000,gloss:1500000},['2,000,000원','440,000원','본인이 신고']],
 threshold:[null,{ttotal:23000000,trate:35},['3,000,000원','693,000원']],
 'etf-tax':[null,{eprod:'kother',egain:8000000,eincome:0},['1,232,000원','1,210,000원','22,000원']],
 isa:[null,{iprin:15000000},['2,772,960원','76,523원','427,035원','350,512원']],
 pension:[null,{pacct:'saving',pamt:6000000,pband:'over',pwithdraw:'early'},['792,000원','990,000원','−198,000원']],
 'after-tax':[null,{cprod:'kequity',cyears:5},['3,012,529원','3,166,529원','154,000원']],
 'final-order':[null,{fgrowth:0},['1,240,200원','600,000원','1,203,240원']]
};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={gloss:{gasset:'fetf'}};
const FIGURES={map:['169,200원'],trade:['480,000원'],order:['2,406,965원'],final:['2,447,635원']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/tax/`;
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
 await reset(lab);const [pre,values,want]=L2[id];
 if(pre!==null)await lab.locator('[data-preset]').nth(pre).click();
 for(const [k,v] of Object.entries(values)){await setValue(lab,k,v);await timed(lab,id);}
 const t=await lab.locator('.readout').innerText();has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
/* 표의 모든 행이 세로로 잘리지 않고 보이는지 잰다(1280·390·320px 모두). 가로로 넘치면 is-wide 안내 문구가 붙어야 한다. */
async function rowsVisible(lab,id){
 const r=await lab.locator('.table-wrap').evaluateAll(els=>els.map(e=>{const w=e.getBoundingClientRect();const rows=[...e.querySelectorAll('tbody tr')].map(tr=>{const b=tr.getBoundingClientRect();return {head:tr.cells[0].innerText.trim(),ok:b.height>0&&b.top>=w.top-0.5&&b.bottom<=w.bottom+0.5};});return {vclip:e.scrollHeight>e.clientHeight+1,wide:e.scrollWidth>e.clientWidth+1,cue:e.classList.contains('is-wide'),rows};}));
 for(const x of r){assert.ok(!x.vclip,`${id}: table clipped vertically`);for(const row of x.rows)assert.ok(row.ok,`${id}: row ${row.head} not fully visible`);assert.equal(x.cue,x.wide,`${id}: wide-table cue`);}
 return r;
}
async function tables(lab,id){
 const rv=await rowsVisible(lab,id);
 if(id==='final-order'){const heads=rv.flatMap(x=>x.rows.map(r=>r.head));for(const k of ['X','Y','Z'])assert.ok(heads.some(h=>h.replace(/^▲\s*/,'').startsWith(k)),`final-order: row ${k} visible`);}
 const t=await lab.locator('.table-wrap').evaluateAll(els=>els.map(e=>({tab:e.getAttribute('tabindex'),role:e.getAttribute('role'),label:e.getAttribute('aria-label')||'',over:e.scrollWidth>e.clientWidth+1,overflow:getComputedStyle(e).overflowX})));
 for(const x of t){assert.equal(x.tab,'0',`${id}: table tabindex`);assert.equal(x.role,'region',`${id}: table role`);assert.ok(x.label.length>4,`${id}: table label`);assert.ok(!x.over||/auto|scroll/.test(x.overflow),`${id}: table overflow without scroll`);}
 return t.length;
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
 assert.match(before,/실제 계산|보도 기준|가상 시나리오|확인 못함|시각적 비유/,`${id}: result is labelled`);
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
 const cases=[
  ['map','tax-map',async l=>{await setValue(l,'mincome',-1);},/✗ 받은 돈을 확인해 주세요/],
  ['trade','stt',async l=>{await setValue(l,'stimes',2.5);},/✗ 매도 횟수를 확인해 주세요/],
  ['dividend','withhold',async l=>{await setValue(l,'wkind','interest');await setValue(l,'whigh',true);},/✗ 고배당 기업 분리과세는/],
  ['gains','gains',async l=>{await setValue(l,'ggain',-5);},/✗ .*확인해 주세요/],
  ['threshold','threshold',async l=>{await setValue(l,'ttotal',20000001);},/1원만 다른 소득과 합쳐/],
  ['etf','etf-tax',async l=>{await setValue(l,'egain','');},/✗ .*확인해 주세요/],
  ['isa','isa',async l=>{await setValue(l,'iprod','foreign');},/✗ .*살 수 없습니다/],
  ['pension','pension',async l=>{await setValue(l,'pamt','');},/✗ .*확인해 주세요/],
  ['order','after-tax',async l=>{await setValue(l,'cyears',2.5);},/✗ 보유 기간을 확인해 주세요/],
  ['order','after-tax',async l=>{await setValue(l,'cprod','foreign');},/✗ ISA·연금 칸: 이 계좌에서는 살 수 없습니다/],
  ['order','after-tax',async l=>{await setValue(l,'cprod','stock');},/확인 못함/],
  ['final','final-order',async l=>{await setValue(l,'fneed',20000000);},/✗ 꺼낼 금액을 확인해 주세요/]
 ];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await act(lab);assert.match(await lab.locator('.readout').innerText(),re,`${id} error state ${re}`);}
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
 const still=await page.evaluate(()=>{const a=getComputedStyle(document.querySelector('.tx-ill-add')),f=getComputedStyle(document.querySelector('.tx-ill-fly'));return [a.animationName,a.opacity,f.animationName,f.opacity];});assert.deepEqual(still,['none','1','none','0'],'shelf art stops under reduced motion on the final state');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 const moving=await page.evaluate(()=>[getComputedStyle(document.querySelector('.tx-ill-fly')).animationName,getComputedStyle(document.querySelector('.tx-ill-add')).animationName]);assert.deepEqual(moving,['tx-ill-drop','tx-ill-land'],'shelf art animates');
 await page.waitForTimeout(5600);await page.screenshot({path:path.join(output,'shelf-illustration-final.png')});
}
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['map','tax-map'],['threshold','threshold'],['pension','pension'],['order','after-tax'],['final','final-order']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'order');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-after-tax'),'after-tax-dark.png');await shot(page.locator('.concept-diagram'),'order-figure-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 /* 키보드: 사건 단추, 슬라이더 방향키, 결과 읽기 펼치기 */
 await frame(page,url,390,'map');await page.locator('#lab-tax-map [data-event="sell"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#lab-tax-map .readout').innerText(),/“판다”에서[\s\S]*22,497원/,'keyboard event button');
 await frame(page,url,390,'final');assert.match(await page.locator('#lab-final-order .rate-banner').innerText(),/하린의 조건에서 계산한 배분안이며, 독자에게 권하는 배분이 아닙니다[\s\S]*2026-10-13 보도·안내 기준/);assert.match(await page.locator('#lab-final-order').innerText(),/세 배분안/);const slider=page.locator('#fgrowth');await slider.focus();for(let i=0;i<4;i++)await page.keyboard.press('ArrowLeft');assert.match(await page.locator('#lab-final-order .readout').innerText(),/1,240,200원[\s\S]*600,000원[\s\S]*1,203,240원/,'keyboard slider');
 await frame(page,url,390,'order');assert.match(await page.locator('#lab-after-tax .rate-banner').innerText(),/2026-10-13 보도·안내 기준\(공식 원문 미확인\)[\s\S]*세무 전문가/);await page.fill('#guess-after-tax','46,200원 / 142,345원');await page.locator('#lab-after-tax summary').click();await page.waitForFunction(()=>/내 예측: 46,200원/.test(document.querySelector('#lab-after-tax .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,320,'isa');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>TBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/1,563,950원[\s\S]*1,848,640원[\s\S]*2,406,965원/);await page.getByRole('button',{name:'1,500만 원',exact:true}).click();assert.match(await page.locator('.home-result').innerText(),/2,345,925원[\s\S]*2,696,437원/);
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
