/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 숫자 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역을 본다. 서가 삽화와 표지 삽화의 글자가 viewBox 안에 있는지도 잰다.
   실행: PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/etf/tests/browser.cjs
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'etf-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. CHART는 그림·표 쪽 글자. */
const DEFAULTS={
 'index-level':['4,000억 원','4,200억 원','105.00','실제 계산'],
 weighting:['+3.75%','+2.14%','+1.67%'],
 'creation-unit':['1,030만 좌','3,090억 원','30,000원','90억 원'],
 'gap-lab':['30,360원','30,400원','+0.13%','프리미엄','LP 호가 의무 있음','30,320원','1좌 40원','400만 원','보도·안내 기준'],
 'tracking-cost':['0.18%','0.22%','15,934,116원','16,078,424원','144,308원'],
 rebalance:['200억 원으로','220억 원','120억 원','240억 원','20억 원어치를 삽니다','가격은 어떻게 흔들리는가'],
 underlying:['12,120원','30,360원','−2.76%','추정값'],
 'etf-tax-type':['국내주식형','비과세','증권거래세는 0원'],
 'compare-table':['9,560,470원','9,647,055원','86,585원','1,000원','6,000원','계산 편의, 권유 아님'],
 'final-gap':['+3.00%','323주','9,980,700원','19,300원','9,690,000원','−290,700원','−2.91%','290,700원','계산 편의, 권유 아님']
};
const CHART={'gap-lab':['LP'],'final-gap':['9,980,700']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'index-level':[[0,['100.00']],[1,['약 4,476억 원','117.50']],[2,['117.50']],[3,['102.50']]],
 weighting:[[0,['36.07%','33.33%']],[1,['+1.75%','+2.00%','+2.33%']],[3,['유동시가총액 가중 +3.75%']]],
 'creation-unit':[[0,['980만 좌','2,940억 원']],[1,['1,050만 좌','3,150억 원']],[2,['변화 없음']]],
 'gap-lab':[[0,['30,410원','30,405원','+0.16%']],[1,['31,275원','30,985.50원','+3.01%','915원','9,150만 원']],[2,['2,100주','900주','+5.01%']],[3,['30,515원','+0.51%','LP 호가 의무 면제']],[4,['31,275원','+3.01%']]],
 'tracking-cost':[[0,['0.79%p']],[1,['1,109,162원']],[2,['0.09%','0.14%']]],
 rebalance:[[0,['20억 원어치를 팝니다']],[1,['20억 원어치를 더 팝니다']],[2,['4억 원어치를 팝니다','96억 원','46억 원','92억 원']]],
 underlying:[[0,['12,240원']],[1,['12,118원']],[2,['거래상대방 위험 있음']],[3,['발행사 신용위험 있음']]],
 'etf-tax-type':[[0,['그 밖의 국내 상장','15.4%']],[1,['해외 상장','22%']],[2,['15.4%']]],
 'compare-table':[[0,['18,000원','108,000원']],[1,['2,835원','10,000원','60,000원']],[2,['129,877원']]],
 'final-gap':[[0,['9,786,900원','−193,800원']],[1,['+2.00%','326주']],[2,['408주','4,993,920원','4,896,000원','−97,920원']]]
};
/* 예측 질문(L2) 사례: [먼저 누를 비교 예제 번호 또는 null, 바꿀 입력(순서대로), 결과 문장과 그림·표에 나와야 할 답]. */
const L2={
 'index-level':[null,{im0:0,im1:6,im2:-20},['96.50']],
 weighting:[null,{wr0:-8,wr1:4,wr2:2},['−2.50%','−1.00%','−0.67%']],
 'creation-unit':[null,{cassets:1500,cunits:500,ccu:4},['540만 좌','1,620억 원','30,000원']],
 'gap-lab':[null,{gunder:'foreign',gindex:120,gprice:12270},['+2.25%','2%를 넘습니다','5%도 넘지 않습니다']],
 'tracking-cost':[null,{tprin:2000,tyears:20},['50,779,213원','51,703,147원','923,933원']],
 rebalance:[null,{rnav:100,rmult:'-1',rret:5},['105억 원','95억 원','10억 원어치를 되삽니다']],
 underlying:[null,{uasset:'foreign',ufx:-0.5,ufut:0.8},['12,036원']],
 'etf-tax-type':[null,{xunder:'bond',xlist:'domestic'},['그 밖의 국내 상장','15.4%']],
 'compare-table':[null,{pamt:450,ptrips:30,pper:'month'},['22,500원','135,000원']],
 'final-gap':[null,{fetf:'overseas',famt:5000000,fprice:12300,fnav:12000},['+2.50%','406주','4,993,800원','4,872,000원','−121,800원']]
};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={ifix:{iswap:true}};
const FIGURES={index:['105.00'],nav:['30,360원','+3.01%'],choose:['86,585원'],final:['323주','−290,700원']};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/etf/`;
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
 const t=await allText(lab);has(t,want,`${id} L2`);report.l2.push({width,id,ok:true});
}
/* 표의 모든 행이 세로로 잘리지 않고 보이는지 잰다(1280·390·320px 모두). 가로로 넘치면 is-wide 안내 문구가 붙어야 한다. */
async function rowsVisible(lab,id){
 const r=await lab.locator('.table-wrap').evaluateAll(els=>els.map(e=>{const w=e.getBoundingClientRect();const rows=[...e.querySelectorAll('tbody tr')].map(tr=>{const b=tr.getBoundingClientRect();return {head:tr.cells[0].innerText.trim(),ok:b.height>0&&b.top>=w.top-0.5&&b.bottom<=w.bottom+0.5};});return {vclip:e.scrollHeight>e.clientHeight+1,wide:e.scrollWidth>e.clientWidth+1,cue:e.classList.contains('is-wide'),rows};}));
 for(const x of r){assert.ok(!x.vclip,`${id}: table clipped vertically`);for(const row of x.rows)assert.ok(row.ok,`${id}: row ${row.head} not fully visible`);assert.equal(x.cue,x.wide,`${id}: wide-table cue`);}
 return r;
}
async function tables(lab,id){
 const rv=await rowsVisible(lab,id);
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
 assert.match(before,/실제 계산|보도·안내 기준|가상 시나리오|확인 못함|시각적 비유/,`${id}: result is labelled`);
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
  ['index','index-level',async l=>{await setValue(l,'is0',0);},/✗ 새벽전자 상장주식수를 확인해 주세요/],
  ['weight','weighting',async l=>{for(const k of ['wf0','wf1','wf2'])await setValue(l,k,0);},/✗ .*확인해 주세요/],
  ['creation','creation-unit',async l=>{await setValue(l,'cunits',1);await setValue(l,'ccu',-5);},/✗ .*확인해 주세요/],
  ['nav','gap-lab',async l=>{await setValue(l,'gprice',30400.5);},/✗ .*확인해 주세요/],
  ['cost','tracking-cost',async l=>{await setValue(l,'tyears',2.5);},/✗ .*확인해 주세요/],
  ['leverage','rebalance',async l=>{await setValue(l,'rnav',0);},/✗ .*확인해 주세요/],
  ['assets','underlying',async l=>{await setValue(l,'ufx',50);},/✗ .*확인해 주세요/],
  ['tax','etf-tax-type',async l=>{await setValue(l,'xshare',120);},/✗ .*확인해 주세요/],
  ['choose','compare-table',async l=>{await setValue(l,'ptrips',2.5);},/✗ .*확인해 주세요/],
  ['final','final-gap',async l=>{await setValue(l,'famt',10000);},/✗ .*확인해 주세요/]
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
 const still=await page.evaluate(()=>{const d=getComputedStyle(document.querySelector('.ef-ill-drift')),q=getComputedStyle(document.querySelector('.ef-ill-quote'));return [d.animationName,q.animationName,q.opacity];});assert.deepEqual(still,['none','none','1'],'shelf art stops under reduced motion on the final state');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 const moving=await page.evaluate(()=>[getComputedStyle(document.querySelector('.ef-ill-drift')).animationName,getComputedStyle(document.querySelector('.ef-ill-quote')).animationName]);assert.deepEqual(moving,['ef-ill-drift','ef-ill-quote'],'shelf art animates');
 await page.waitForTimeout(5600);await page.screenshot({path:path.join(output,'shelf-illustration-final.png')});
}
async function extras(page,url){
 const shot=(loc,name)=>loc.screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(output,name)});
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:false});
 for(const [id,lab] of [['index','index-level'],['nav','gap-lab'],['leverage','rebalance'],['choose','compare-table'],['final','final-gap']]){await frame(page,url,1280,id);await shot(page.locator('#lab-'+lab),`${lab}-desktop.png`);await frame(page,url,320,id);await shot(page.locator('#lab-'+lab),`${lab}-mobile.png`);}
 await frame(page,url,1280,'nav');await page.getByRole('button',{name:/화면으로 전환/}).click();await shot(page.locator('#lab-gap-lab'),'gap-lab-dark.png');await shot(page.locator('.concept-diagram'),'nav-figure-dark.png');await page.getByRole('button',{name:/화면으로 전환/}).click();
 /* 키보드: 시각 슬라이더를 End로 15:29(단일가)까지 옮긴다. */
 await frame(page,url,390,'nav');const gap=page.locator('#lab-gap-lab');assert.match(await gap.locator('.rate-banner').innerText(),/2026-10-13 보도·안내 기준[\s\S]*한국거래소 공시와 투자설명서/);
 await setValue(gap,'gqty',1000);const slider=page.locator('#gtime');await slider.focus();await page.keyboard.press('End');assert.equal(await slider.inputValue(),'929');assert.match(await gap.locator('.readout').innerText(),/15:29[\s\S]*LP 호가 의무 면제[\s\S]*31,275원[\s\S]*\+3\.01%/,'keyboard slider');
 await page.keyboard.press('Home');assert.match(await gap.locator('.readout').innerText(),/09:00[\s\S]*LP 호가 의무 면제/,'keyboard slider home (opening exemption)');
 await frame(page,url,390,'final');assert.match(await page.locator('#lab-final-gap .rate-banner').innerText(),/계산 편의, 권유 아님[\s\S]*2026-10-13 보도·안내 기준/);
 await frame(page,url,390,'choose');assert.match(await page.locator('#lab-compare-table .rate-banner').innerText(),/계산 편의, 권유 아님/);await page.fill('#guess-compare-table','22,500원 / 135,000원');await page.locator('#lab-compare-table summary').click();await page.waitForFunction(()=>/내 예측: 22,500원/.test(document.querySelector('#lab-compare-table .guess-echo').innerText),null,{timeout:3000});
 await frame(page,url,320,'cost');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>EBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');
   assert.match(await page.locator('.home-result').innerText(),/10:30 · LP 호가 의무 있음[\s\S]*30,400원[\s\S]*\+0\.13%[\s\S]*프리미엄/);await page.getByRole('button',{name:/^15:25/}).click();await setValue(page.locator('.hero'),'home-qty',1000);assert.match(await page.locator('.home-result').innerText(),/LP 호가 의무 면제[\s\S]*31,275원[\s\S]*\+3\.01%/);
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
