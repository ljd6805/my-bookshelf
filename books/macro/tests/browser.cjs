/* 실제 브라우저 검사. 저장소 루트를 python3 http.server로 빈 포트에 띄우고(BOOK_URL을 주면 그 주소를 쓴다) 모든 장을 1280·390·320px에서 연다.
   장마다 그림, 실험의 기본 결과 숫자(본문과 같은 값), 비교 예제, 예측 질문(L2) 사례, 입력 경계값, 빈 칸 오류, 초기화, 확인 문제를 조작하고
   가로 넘침과 콘솔 오류, 다시 계산에 걸린 시간(실험의 data-ms), 표의 스크롤 영역, 그림 글자가 viewBox 안에 있는지 본다.
   4장 비교 예제는 예측을 적기 전에는 닫혀 있는지, 10장 가설표는 이 브라우저에만 남는지, 서가 삽화는 움직이고 동작 줄이기에서 멈추는지도 본다.
   실행: NODE_PATH=/opt/node22/lib/node_modules node books/macro/tests/browser.cjs (또는 BOOK_URL=http://127.0.0.1:8765/books/macro/)
   결과와 스크린숏은 BOOK_EVIDENCE 폴더(기본: 임시 폴더)에 남긴다. 저장소 안에는 남기지 않는다. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const output=process.env.BOOK_EVIDENCE||path.join(os.tmpdir(),'macro-evidence');
const report={date:'2026-10-13',views:[],labs:[],l2:[],timing:{},art:[],errors:[],console:[],missing:[],svgTexts:0};
const BAD=/NaN|undefined|Infinity/;
const SLOW_MS=300;
/* 기본값에서 결과 문장(readout)에 꼭 나와야 하는 숫자: 본문(js/content.js)과 같은 값이다. */
const DEFAULTS={
 'gdp-expenditure':['900조 원','순수출 60조 원','53.3%','1.92%','4.06%','실제 계산'],
 'cpi-basket':['106.3','6.3%','▲ 전기 요금','122.84','공식 원문(재게시)'],
 'labor-gap':['3.33%','60.00%','58.00%','확장'],
 'policy-model':['기준선(편차 0)','10월 22일 결정의 예상이 아닙니다','미리 정한 시나리오 모형'],
 'fiscal-mix':['4분기째 +0.64%','5분기째 +0.20%p','0.8배'],
 'fx-won-amount':['13억 3,850만 원','13억 1,170만 원','2,680만 원 감소','5억 2,468만 원','−2.00%','+2.04%','보도 기준'],
 'current-account':['+36억 달러','−4억 달러','30조 원 ✓ 같음'],
 'lag-correlation':['r = −0.72','▲ 3달','101.7','보도 기준'],
 'crisis-timeline':['−16.8%','−3.05%','+3.14%','2008 세계 금융위기'],
 'release-hypotheses':['+0.4%p','+0.14%p','실제 시장 가격의 예측이나 매매 권유가 아닙니다']
};
const CHART={'policy-model':['미리 정한 시나리오 모형 · 예측 아님 · 계수는 가정 · 12분기만 계산 · 금리 하한과 중앙은행의 재반응은 넣지 않음','기준금리와 통계는 바뀌므로 확인일을 보고 다시 확인하세요','연 8회'],'release-hypotheses':['기준금리와 통계는 바뀌므로 확인일을 보고 다시 확인하세요','가격을 계산하지 않음']};
/* 비교 예제 [번호, 꼭 나와야 하는 숫자](결과 문장과 그림·표 글자를 합쳐서 찾는다). */
const PRESETS={
 'gdp-expenditure':[[0,['860조 원','순수출 20조 원']],[1,['0.00%']],[2,['−3.94%']]],
 'cpi-basket':[[0,['105.3']],[1,['103.8']],[2,['108.5']]],
 'labor-gap':[[0,['3.33% → 1.69%']],[1,['3.23%','60.00%']],[2,['정점']]],
 'policy-model':[[0,['5분기째 −0.17%','7분기째 −0.07%p','환율 → GDP → 물가']],[1,['5분기째 +0.17%','1분기째 +0.50%']]],
 'fiscal-mix':[[0,['✓ 맞음','−0.463','5분기부터']],[1,['8분기째 +0.71%']],[2,['4분기째 −0.64%']]],
 'fx-won-amount':[[0,['13억 1,173만 원']],[1,['13억 6,530만 원','5억 4,612만 원']],[2,['−0.50%']]],
 'current-account':[[0,['+30억 달러']],[1,['+43억 달러']],[2,['−9억 달러','적자']]],
 'lag-correlation':[[0,['r = 0.64']],[1,['r = 0.98']],[2,['r = 0.65']]],
 'crisis-timeline':[[0,['1997 외환위기','+118.0%']],[1,['2020 코로나19 충격']],[2,['−3.9%']]],
 'release-hypotheses':[[0,['+1.01%p']],[1,['7분기부터 기준선 아래','6분기째 −0.17%']],[2,['+0.99%p','+0.17%p']],[3,['−0.04%p']]]
};
const setValue=async(lab,id,v)=>{await lab.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v===true||v==='true';else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},typeof v==='boolean'?v:String(v));};
const setAll=async(lab,o)=>{for(const [k,v] of Object.entries(o))await setValue(lab,k,v);};
const readout=lab=>lab.locator('.readout').innerText();
/* 예측 질문(L2) 사례: [바꿀 입력(순서대로), 결과 문장과 그림·표에 나와야 할 답]. 어떤 비교 예제로도 닿지 않는다. */
const L2={
 'gdp-expenditure':[{gc:300,gi:120,gg:90,gx:250,gm:260,gnom:8,gdef:5},['500조 원','순수출 −10조 원','2.86%']],
 'cpi-basket':[{cw0:40,cw1:60,cw2:0,ca0:100,cb0:110,ca1:100,cb1:100},['104.0','4.0%']],
 'labor-gap':[{lemp:950,lun:50,ldis:20},['5.00% → 3.06%']],
 'policy-model':[{prate:-0.5},['5분기째 +0.33%','7분기째 +0.14%p']],
 'fiscal-mix':[{fspend:2,flen:2},['2분기째 +1.01%','4분기째 +0.22%p']],
 'fx-won-amount':[{musd:500000,xbefore:1300,xafter:1365},['6억 5,000만 원','6억 8,250만 원','+5.00%']],
 'current-account':[{tgoods:30,tserv:-8,tprim:5,tsec:-2},['+25억 달러']],
 'lag-correlation':[{llead:'1, 2, 3, 2, 1, 0, −1, −2',lcoin:'0, 0, 0.8, 1.6, 2.4, 1.6, 0.8, 0'},['시차는 ▲ 2달','r = 1.00']],
 'crisis-timeline':[{cq:-3},['−11.5%']],
 'release-hypotheses':[{fhyp:'B',fhike:0.5},['+0.97%p','+0.10%p']]
};
/* 확인 문제의 답: 기본 화면과 비교 예제에는 나오지 않는다(독자가 입력을 바꿔야 닿는다). */
const QUIZ_ANSWER={'gdp-expenditure':['2.42%'],'cpi-basket':['117.0'],'labor-gap':['→ 0.00%'],'fx-won-amount':['+4.59%','−4.39%'],'current-account':['250조 원'],'crisis-timeline':['−54.1','+54.1'],'release-hypotheses':['가설 A·B']};
const noQuiz=(t,id,what)=>{for(const s of QUIZ_ANSWER[id]||[])assert.ok(!t.includes(s),`${id} ${what} shows the quiz answer ${s}`);};
/* 다른 입력에 따라 쓰이는 칸은 그 상태를 먼저 만든 뒤 검사한다. */
const CONTEXT={frlen:{frate:1}};
const freePort=()=>new Promise(res=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function serve(){
 if(process.env.BOOK_URL)return {url:process.env.BOOK_URL,stop:()=>{}};
 const port=await freePort(),proc=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/books/macro/`;
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
/* 그림(실험 그림·장 그림·표지 실험)의 글자 상자가 각 SVG의 viewBox 안에 있는지 잰다. */
async function svgInside(scope,what){
 const bad=await scope.evaluate(root=>{const out=[];let n=0;root.querySelectorAll('svg[viewBox]').forEach(s=>{const vb=s.viewBox.baseVal;if(!vb||!vb.width)return;s.querySelectorAll('text').forEach(t=>{if(!t.textContent.trim())return;n++;const b=t.getBBox();if(b.x<-0.5||b.y<-0.5||b.x+b.width>vb.width+0.5||b.y+b.height>vb.height+0.5)out.push(`${t.textContent} [${b.x.toFixed(1)},${b.y.toFixed(1)},${(b.x+b.width).toFixed(1)},${(b.y+b.height).toFixed(1)}] in ${vb.width}x${vb.height}`);});});return {out,n};});
 report.svgTexts+=bad.n;assert.deepEqual(bad.out,[],`${what}: SVG text outside its viewBox`);
}
async function controlsCheck(lab,id){
 const controls=await lab.locator('.lab-inner input,.lab-inner select').evaluateAll(els=>els.map(e=>({id:e.id,tag:e.tagName,type:e.type,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]})));
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
 assert.match(before,/실제 계산|미리 정한 가상 시나리오|미리 정한 시나리오 모형|시각적 비유/,`${id}: result is labelled`);
 const nTables=await tables(lab,id);
 if(id==='policy-model'){assert.ok(await lab.locator('[data-preset]').first().isDisabled(),'chapter 4 presets stay closed before a guess');await page.fill('#guess-policy-model','GDP는 5분기째 위로');assert.ok(!(await lab.locator('[data-preset]').first().isDisabled()),'chapter 4 presets open after a guess');}
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
/* 오류 상태: 계산이 뜻을 잃는 입력을 넣고 ✗ 문장이 나오는지 본다(NaN 대신 글자). 4·5장은 범위 막대만 있어 범위 밖 값을 넣을 수 없다. */
async function errorStates(page,url){
 const cases=[['gdp','gdp-expenditure',{gm:2000},/✗ 지출을 확인해 주세요 · 지출의 합이 0 이하/],['prices','cpi-basket',{cw0:30},/✗ 가중치를 확인해 주세요 · 가중치의 합이 100%가 아니라[\s\S]*110%/],['cycle','labor-gap',{lpop:500},/✗ 인구와 취업자·실업자를 확인해 주세요/],['cycle','labor-gap',{ldis:21},/✗ 구직을 포기한 사람을 확인해 주세요/],['fx','fx-won-amount',{xbefore:0},/✗ 이전 환율을 확인해 주세요/],['trade','current-account',{sm:5000},/✗ 지출을 확인해 주세요/],['leading','lag-correlation',{lcoin:'1, 2, 3'},/✗ 두 목록의 개수를 확인해 주세요/],['leading','lag-correlation',{llead:'1, 2, 3, 4',lcoin:'4, 3, 2, 1',llag:2},/✗ 늦출 달 수를 확인해 주세요/],['leading','lag-correlation',{lcoin:'1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1'},/✗ 두 목록을 확인해 주세요 · 한쪽 목록의 숫자가 모두 같아/],['crisis','crisis-timeline',{cafter:0},/✗ 이후 환율을 확인해 주세요/],['final','release-hypotheses',{factual:''},/✗ 발표된 물가 상승률을 확인해 주세요/]];
 for(const [ch,id,act,re] of cases){await frame(page,url,390,ch);const lab=page.locator('#lab-'+id);await reset(lab);await setAll(lab,act);const t=await readout(lab);assert.match(t,re,`${id} error state ${re}`);assert.doesNotMatch(t,BAD,`${id} error state`);await reset(lab);assert.doesNotMatch(await readout(lab),/✗ .*확인해 주세요/,`${id} reset clears the error`);}
}
const ART_STATE=()=>['scan','p2','p3'].map(k=>getComputedStyle(document.querySelector('.ma-ill-'+k)).animationName);
async function artCheck(page,url){
 for(const [file,width] of [['assets/shelf-illustration.svg',320],['assets/cover-art.svg',320],['assets/shelf-illustration.svg',1280]]){
  await page.setViewportSize({width,height:700});
  if(file.includes('cover')){await page.goto(url);await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="../../assets/type.css"><link rel="stylesheet" href="../../assets/reader.css"><div class="jacket-plate" style="width:${Math.min(320,width-32)}px;--glass:209,127,119;--edge:161,90,80">${fs.readFileSync(path.join(__dirname,'..',file),'utf8')}</div>`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cv-text')).fontSize==='8.5px',null,{timeout:5000});await page.evaluate(()=>document.fonts.ready);}
  else await page.goto(url+file);
  const r=await page.evaluate(()=>{const s=document.querySelector('svg'),vb=s.viewBox.baseVal;return {vb:[vb.width,vb.height],texts:[...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,r:b.x+b.width,b:b.y+b.height};})};});
  for(const t of r.texts)assert.ok(t.x>=0&&t.y>=0&&t.r<=r.vb[0]&&t.b<=r.vb[1],`${file}: "${t.text}" outside viewBox ${JSON.stringify(t)}`);
  report.art.push({file,width,texts:r.texts.length,maxRight:Math.max(...r.texts.map(t=>t.r)),viewBox:r.vb});
  await page.screenshot({path:path.join(output,`${path.basename(file,'.svg')}-${width}.png`)});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none'],'shelf art stops under reduced motion');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ma-ill-p3')).opacity),'1','reduced motion keeps every marker visible');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'assets/shelf-illustration.svg');
 assert.deepEqual(await page.evaluate(ART_STATE),['ma-ill-scan','ma-ill-p2','ma-ill-p3'],'shelf art animates');
 await page.goto(url);await page.setContent(`<!doctype html><html data-motion="reduce"><body>${fs.readFileSync(path.join(__dirname,'..','assets/shelf-illustration.svg'),'utf8')}</body></html>`);
 assert.deepEqual(await page.evaluate(ART_STATE),['none','none','none'],'shelf art stops under html[data-motion=reduce]');
 await page.emulateMedia({reducedMotion:'reduce'});
}
async function extras(page,url){
 await frame(page,url,1280,'home');await page.screenshot({path:path.join(output,'home-desktop.png')});
 await frame(page,url,320,'home');await page.screenshot({path:path.join(output,'home-mobile.png')});
 /* 표지 실험: 디플레이터 막대를 키보드로 옮긴다. */
 const r=page.locator('#home-d');await r.focus();await page.keyboard.press('End');assert.equal(await r.inputValue(),'10');const hr=await page.locator('.home-result').innerText();assert.match(hr,/디플레이터 10\.0%[\s\S]*−3\.64%/);assert.doesNotMatch(hr,BAD);
 await page.keyboard.press('Home');assert.match(await page.locator('.home-result').innerText(),/6\.00%/);
 /* 4장: 범위 막대를 키보드로 옮긴다. */
 await frame(page,url,390,'policy');await page.locator('#prate').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#prate').inputValue(),'0.25','keyboard moves the policy rate');assert.match(await page.locator('#lab-policy-model .readout').innerText(),/5분기째 −0\.17%/);
 /* 10장: 가설표는 이 브라우저에만 남는다. */
 await frame(page,url,390,'final');await page.fill('#fnote0','인상 기대가 커진다면 3년 국채 금리는 오르는 쪽');await page.reload();await page.locator('#fnote0').waitFor();assert.equal(await page.inputValue('#fnote0'),'인상 기대가 커진다면 3년 국채 금리는 오르는 쪽','note kept in this browser');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bookshelf:macro:v1:final-notes'))[0]),'인상 기대가 커진다면 3년 국채 금리는 오르는 쪽');await page.evaluate(()=>localStorage.removeItem('bookshelf:macro:v1:final-notes'));
 /* 예측을 적고 결과 읽기를 펴면 내 예측이 되울린다. */
 await frame(page,url,390,'trade');await page.fill('#guess-current-account','+25억 달러');await page.locator('#lab-current-account details.guide-reading summary').click();await page.waitForFunction(()=>/내 예측: \+25억 달러/.test(document.querySelector('#lab-current-account .guess-echo').innerText),null,{timeout:3000});
 /* 1·7장 이례적 값 상자는 확인 칸을 켤 때만 나온다. */
 await frame(page,url,390,'gdp');const g=page.locator('#lab-gdp-expenditure');assert.equal(await g.locator('.unusual-box').count(),0);await setValue(g,'greal',true);assert.match(await g.locator('.unusual-box').innerText(),/^이례적 값 · [\s\S]*3\.69%/);
 await frame(page,url,390,'trade');const tr=page.locator('#lab-current-account');assert.equal(await tr.locator('.unusual-box').count(),0);await setValue(tr,'treal',true);assert.match(await tr.locator('.unusual-box').first().innerText(),/^이례적 값 · 보도 기준[\s\S]*−7\.0억 달러/);
 await frame(page,url,1280,'final');await page.getByRole('button',{name:/화면으로 전환/}).click();await page.locator('#lab-release-hypotheses').screenshot({path:path.join(output,'final-dark.png')});await page.getByRole('button',{name:/화면으로 전환/}).click();
 await frame(page,url,320,'leading');await page.getByRole('button',{name:'목차',exact:true}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
 await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=await serve(),url=server.url;report.url=url;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text()+' @ '+page.url().replace(/^https?:\/\/[^/]+/,''));});page.on('response',r=>{if(r.status()>=400)report.missing.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);const chapters=await page.evaluate(()=>MBook.chapters.map(c=>({id:c.id,answer:c.quiz[2],transfer:c.transfer[2],labs:c.labs})));
  for(const width of [1280,390,320]){
   await frame(page,url,width,'home');assert.match(await page.locator('.home-result').innerText(),/디플레이터 4\.0%[\s\S]*1\.92%/);
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
