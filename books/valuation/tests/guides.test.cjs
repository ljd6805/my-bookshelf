/* 실험 안내와 결과 문장 검사: 비교 예제·결과 읽기, 권유·판정 말투 금지, 꼬리표와 시장 숫자의 확인일·등급, 색 외의 상태 글자, 마지막 문장의 L2 답,
   그리고 어떤 비교 예제도 L2 사례가 아니며 L2 답을 화면에 내지 않는지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),M=require('../js/math.js');
const LABS=['price-basics','multiple-compare','dividend-yield','ev-bridge','fcff-forecast','wacc-build','terminal-steps','dcf-sensitivity','implied-assumption','analyst-gap'],FILES=['labs-multiples','labs-dcf','labs-sensitivity','labs-final'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.VGuides.guides;
const labSrc=FILES.map(f=>read(`js/${f}.js`)).join('');
/* 권유 말투와 판정 말투(content.test.cjs와 같은 목록). 실험 조작 안내(“~해 보세요”)는 권유가 아니다. 오해를 인용한 따옴표 안은 판정이 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리|사세요|파세요|매수하세요|매도하세요|사 두세요|목표주가를 제시|목표주가는 \d|오를 것입니다|내릴 것입니다)/;
const VERDICT=/(싸다|비싸다|저평가|고평가|싼 주식|비싼 주식)/,unquote=s=>s.replace(/“[^”]*”/g,'');
test('guides have a purpose, 2–5 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=5,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
/* 번호가 붙은 입력(gs1~4)은 'gs'+i처럼 만든다. */
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const k of Object.keys(values)){const stem=k.replace(/\d+$/,'');assert.match(labSrc,stem===k?new RegExp(`['"]${k}['"]`):new RegExp(`['"]${stem}['"]\\+\\(?i`),`${id}:${k}`);}});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice or verdicts',()=>{
 for(const id of LABS){assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);assert.doesNotMatch(unquote(G[id][0]+G[id][2]),VERDICT,id);}
 for(const [name,src] of [['labs',labSrc],['app',read('js/app.js')],['home-lab',read('js/home-lab.js')],['figures',read('js/figures.js')],['visual',read('js/visual.js')],['index',read('index.html')]]){assert.doesNotMatch(src,ADVICE,name);assert.doesNotMatch(unquote(src),VERDICT,name);}
});
test('every lab result says what it was computed on, and market numbers carry the check date and grade',()=>{
 for(const f of FILES){const src=read(`js/${f}.js`);const n=(src.match(/VLabs\['[\w-]+'\]=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);}
 const v=read('js/visual.js');for(const k of ["real:'실제 계산'","scenario:'미리 정한 가상 시나리오'","simple:'이 책의 단순화'","news:'보도·2차 자료'","estimate:'교수 추정치'","unknown:'확인 못함'","metaphor:'시각적 비유'"])assert.ok(v.includes(k),k);
 assert.match(v,/확인일 \$\{m\.date\}/);assert.match(v,/금리와 위험 프리미엄은 바뀌므로 확인일을 보고 다시 확인하세요/);
 const d=read('js/labs-dcf.js');assert.match(d,/확인일 2026-10-08/);assert.match(d,/rateTag\('rf'\)/);assert.match(d,/rateTag\('erp'\)/);assert.match(d,/RATE_NOTE/);
 assert.equal(M.MARKET.rf.date,'2026-10-08');assert.match(read('js/labs-final.js'),/RATE_NOTE/);
});
test('status is spelled out in words, not colour alone',()=>{const all=labSrc+read('js/visual.js');for(const s of ['✓ 맞음','✗ 어긋남','▲','✗ g ≥ r','확인해 주세요'])assert.ok(all.includes(s),s);assert.match(read('js/visual.js'),/g ≥ r이라 계산하지 않습니다/);});
test('chapters 8–10 say they are not advice, and the final task says 학습용 계산, 투자 권유 아님',()=>{const v=read('js/visual.js');assert.match(v,/가상의 회사와 가상의 분석가로 계산한 사례이며, 특정 주식을 사고팔라는 권유가 아닙니다/);for(const f of ['labs-sensitivity','labs-final'])assert.match(read(`js/${f}.js`),/ADVICE_NOTE/,f);assert.match(read('js/labs-final.js'),/학습용 계산, 투자 권유 아님/);assert.match(read('js/labs-final.js'),/2025-12-31/);});
const LAST={'price-basics':['600억 원','1,200원','9,000원'],'multiple-compare':['1.5배','15배'],'dividend-yield':['3.0%','30%','7.12%'],'ev-bridge':['6.67배','9.67배'],'fcff-forecast':['50억 원','46.3억 원'],'wacc-build':['10.77%','8.98%'],'terminal-steps':['1,666.7억 원','1,083.2억 원','2,000억 원','20%'],'dcf-sensitivity':['24,336원'],'implied-assumption':['7.4%'],'analyst-gap':['19,246원']};
test('every reading ends by answering its L2 question with the computed numbers, and only the last sentence does',()=>{
 for(const [id,list] of Object.entries(LAST)){const parts=G[id][2].split(/(?<=다\.|\)\.)\s/),last=parts.pop(),rest=parts.join(' ');for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);assert.ok(!rest.includes(list[0]),`${id}: L2 answer ${list[0]} appears before the last sentence`);}
});
test('L2 answers in the guides equal the answers in the design table',()=>{
 const doc=read('docs/index.html'),IDS=['price','per','dividend','ev','fcf','wacc','terminal','sensitivity','implied','final'];
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],ans=cell.slice(cell.lastIndexOf('? (')+3);const first=LAST[LABS[i]][0];assert.ok(ans.includes(first.replace('15배','PER 15배'))||ans.includes(first),`${ch}: ${first} in ${ans}`);});
});
test('L2 cases are not presets: the reader reaches them by changing inputs',()=>{
 const bad={'price-basics':v=>v.pprice===15000||v.pshares===400||v.pni===48,'multiple-compare':v=>v.mper===10||v.mroe===15,'dividend-yield':v=>v.dprice===50000||v.ddps===1500||v.dg===4,'ev-bridge':v=>v.ecap===1000||v.eebitda===150||v.edebt===500||v.ecash===50,'fcff-forecast':v=>v.fop===100||v.fr1===8,'wacc-build':v=>Number(v.wbeta)===1.3||v.wE===70||v.wD===30||v.wkd===6,'terminal-steps':v=>v.tmode==='direct'||v.tr===9||v.tnext===100,'dcf-sensitivity':v=>v.sw===32.2||v.sm===13,'implied-assumption':v=>v.iper===25||v.ipay===40,'analyst-gap':v=>v.gs1==='r'};
 for(const [id,f] of Object.entries(bad))for(const [name,v] of G[id][1])assert.ok(!f(v),`${id}: preset ${name} is the L2 case`);
});
test('no chapter 10 preset order ever passes through the L2 value, and every order still adds up to A − B',()=>{
 const A=M.ASSUME.gapOrder;
 for(const [name,v] of G['analyst-gap'][1]){const order=[1,2,3,4].map(i=>v['gs'+i]??A[i-1]),g=M.gapSteps(order);assert.notEqual(order[0],'r',name);for(const s of g.steps)assert.notEqual(Math.round(s.value),19246,name);assert.ok(Math.abs(g.total-(g.end-g.start))<1e-6,name);}
});
test('no preset of the wacc lab equals the chapter 6 L2 cost of equity, and β 1.3 is never preset',()=>{
 for(const [name,v] of G['wacc-build'][1]){const w=M.wacc({beta:v.wbeta!==undefined?Number(v.wbeta):undefined,rf:v.wrf!==undefined?v.wrf/100:undefined,debt:v.wD});assert.notEqual(Math.round(w.ke*1e4),1077,name);}
 assert.doesNotMatch(read('js/lab-guides.js'),/wbeta:'1\.3'/);
});
