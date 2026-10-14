/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall, 확인·전이 문제,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index)와 #links 계획, 출처 표기, 권유 말투, 면책 문장·켈리 문장·재확인 문장,
   시점에 묶인 값(⏱)의 꼬리표, 가상 인물, 10권 「행동재무학」 링크와 13권(준비 중), 없는 책 폴더로 가는 링크. index.html이 생기면 화면 쪽 검사를 따로 더한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.ABook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['diversify','matrix','pair','frontier','beta','mix','rebalance','kelly','crisis','final'];
const LABS=['stock-count','covariance-matrix','two-asset-curve','efficient-frontier','beta-estimate','target-mix','rebalance-rules','kelly-growth','crisis-correlation','plan-conditions'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1].trim();};
const ask=(id,kind)=>{const m=rows[id]&&rows[id].match(new RegExp(kind+': ([\\s\\S]*?\\?) \\('));return m&&m[1].trim();};
const byId=Object.fromEntries(B.chapters.map(c=>[c.id,c]));
/* 권유·단정 말투: 비중을 권하거나 사고팔라고 하거나 가격의 방향을 하나로 정하는 말. 공매도는 용어라 뺀다. 실험 조작 안내(“~해 보세요”)는 권유가 아니다. */
const ADVICE=/(최적 비중|정답 비중|안전한 비중|추천|권합니다|권해 드|유리|사세요|파세요|사라|팔라|매수|(?<!공)매도|사 두세요|오를 것|내릴 것|반드시 오른|반드시 내린|싸다|비싸다|저평가|고평가)/;
const DISCLAIMER='가상의 인물과 가정으로 만든 계산 연습이며, 실제 계좌의 비중을 권하지 않습니다. 실제 결정에는 세금·비용·소득·건강·다른 자산을 함께 보아야 합니다';
const KELLY='이 책은 돈을 빌려 이 비율을 채우는 계산을 하지 않습니다'; // 본문·식 설명은 합니다체. 실험 꼬리표(js/visual.js KELLY, js/math.js assumptions.kelly)는 꼬리표 말씨인 “…하지 않는다”(나래 G4 2차)
const unquote=s=>s.replace(/“[^”]*”/g,'');
const prose=c=>[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.details),JSON.stringify(c.quiz),JSON.stringify(c.transfer)].join(' ');

test('ten chapters with stable ids in order, one lab each with a K7 id',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
 for(const l of LABS)assert.match(l,/^[a-z]+(-[a-z]+)+$/);
});
test('chapter titles, parts and times match the approved curriculum in docs/index.html #curriculum (171 minutes)',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum"')+40000);
 for(const c of B.chapters)assert.ok(cur.includes(`<td>${c.title}</td>`)||cur.includes(`<td>${c.title} (부제: `),c.id+': '+c.title);
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],['상관과 비중으로 위험 계산하기','효율적 투자선과 시장 위험 계산하기','계좌 비중을 정하고 유지하기','승률과 상관을 잘못 잡았을 때 다시 계산하기','마지막 과제']);
 for(const c of B.chapters.slice(0,9))assert.ok(cur.includes('부 · '+c.group),c.id+' group');
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','16분','16분','18분','18분','16분','16분','16분','16분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),171);assert.match(byId.final.title,/^마지막 과제 · /);assert.match(byId.beta.subtitle,/^시장 몫과 개별 몫 나누기/);
});
test('every chapter has the field set of the series in order, with the right shapes',()=>{
 const KEYS=['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'];
 for(const c of B.chapters){
  assert.deepEqual(Object.keys(c),KEYS,c.id+' field order');for(const k of KEYS)assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.equal(new Set(q[1]).size,3,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.length>0&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  for(const [,html] of c.details){assert.equal((html.match(/<table>/g)||[]).length,(html.match(/<\/table>/g)||[]).length,c.id+' table tags');if(html.includes('<table>'))assert.match(html,/<th scope="col">/,c.id+' table headers');}
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');assert.ok(c.cross.length>0,c.id+' cross');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
 }
});
test('each chapter after the first opens from an earlier result',()=>{
 for(let i=1;i<B.chapters.length;i++){const c=B.chapters[i];assert.match(c.paragraphs[0],/^[\d.·~]+(장|절)/,c.id+' first sentence names the earlier chapter');}
});
test('recall equals the L1 cell; quiz and transfer questions equal the 확인 and 전이 questions of the design table',()=>{
 for(const c of B.chapters){const l1=cell(c.id);assert.ok(l1,c.id);assert.equal(c.recall,l1,c.id);assert.equal(c.quiz[0],ask(c.id,'확인'),c.id+' quiz');assert.equal(c.transfer[0],ask(c.id,'전이'),c.id+' transfer');}
});
test('every source is opened research with HTTPS, a grade and the check date, and every source is cited',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){
  assert.match(url,/^https:\/\//);assert.ok(research.includes(`href="${url}"`)||research.includes(`href="${url.replace(/&/g,'&amp;')}"`),'not in research: '+url);
  assert.match(note,/\((대학 교재|학술[^,()]*|2차 자료|운용사 연구|전문가 단체 글|보도)[^()]*확인 2026-10-13\)\.?$/,title);
  if(/2026-/.test(title))assert.match(note,/^⏱/,title+' 2026 reports carry ⏱');
 }
 assert.equal(new Set(B.chapters.flatMap(c=>c.source)).size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, follow plan #links, and only vols 10 and 11 are marked 깊이 보기 (뒤 권)',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'missing book: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
  if(['tax','psychology'].includes(m[1]))assert.match(why,/^깊이 보기 \(뒤 권\)/,c.id+' vols 10 and 11 are later volumes');else assert.doesNotMatch(why,/깊이 보기/,c.id+' '+m[1]+' is an earlier volume or another field');
 }
 const plan={diversify:['../volatility/#measure','../probability/#correlation'],matrix:['../linear-algebra/#eigen','../linear-algebra/#pca'],pair:['../money/#cagr'],frontier:['../aie-math/#optimize'],
  beta:['../linear-algebra/#projection','../valuation/#wacc'],mix:['../bonds/#duration','../etf/#choose'],rebalance:['../tax/#trade','../money/#fees'],kelly:['../volatility/#drawdown','../volatility/#drag','../market/#settle'],
  crisis:['../volatility/#tails','../macro/#crisis'],final:['../tax/#pension','../tax/#order','../psychology/#rules','../volatility/#drawdown']};
 for(const c of B.chapters)assert.deepEqual(c.cross.map(x=>x[1]),plan[c.id],c.id+' links follow plan #links');
 assert.doesNotMatch(read('js/content.js')+read('review.json'),/\.\.\/grid\//,'no link to vol 12 (plan #links)');
});
test('vol 10 「행동재무학」 is linked from #final (published 2026-10-14); vol 13 is named as text “13권(준비 중)” only; no link to an unpublished folder',()=>{
 const src=read('js/content.js')+read('review.json');
 for(const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g))assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'link to a folder without a book: '+m[1]);
 assert.doesNotMatch(src,/allocation\//);assert.doesNotMatch(src,/10권\(준비 중\)/);assert.match(src,/10권 「행동재무학」/);assert.match(src,/13권\(준비 중\)/);
 assert.doesNotMatch(src,/(?<![\d.])13권(?!\(준비 중\))/);
});
test('no advice wording anywhere; the disclaimer, the Kelly sentence, the weights note and the assumption label sit where G0/G1 asked',()=>{
 assert.doesNotMatch(unquote(read('js/content.js')),ADVICE);assert.doesNotMatch(unquote(read('review.json')),ADVICE);
 const f=byId.final;assert.ok(f.paragraphs[0].includes(DISCLAIMER),'ch10 p0 disclaimer');assert.ok(f.formulaNote.includes(DISCLAIMER),'ch10 formula note disclaimer');
 assert.ok(f.details.some(([h,html])=>/^풀이/.test(h)&&html.includes(DISCLAIMER)),'ch10 solution box disclaimer');
 const k=byId.kelly;assert.ok(k.paragraphs.join(' ').includes(KELLY)&&k.formulaNote.includes(KELLY),'ch8 Kelly sentence');assert.match(k.title,/\(계산 연습\)$/);
 assert.ok(prose(byId.frontier).includes(M.ASSETS.weightsNote),'ch4 weights note');
 for(const id of ['matrix','pair','frontier','beta','mix','crisis','final'])assert.ok(byId[id].formulaNote.includes(M.ASSETS.label),id+' assumption label on the formula note');
 for(const id of ['beta','final'])assert.ok(JSON.stringify(byId[id]).includes(M.MARKET.recheck),id+' re-check sentence');
});
test('⏱ values appear only with their labels and dates, never as quiz, transfer or review answers',()=>{
 const LIMIT=/70% 한도|한도 70%/,RATE=/국고채 금리 4\.4%|국고채 10년 금리<\/th><td>4\.4%|위험 프리미엄 4\.9%/;
 for(const c of B.chapters){
  const parts=[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,...c.details.map(d=>d.join(' '))];
  for(const p of parts){
   if(LIMIT.test(p))assert.ok(p.includes(M.MARKET.pensionLimit.label)&&p.includes('2026-10-13'),c.id+' 70% limit without its label: '+p.slice(0,80));
   if(RATE.test(p))assert.ok(p.includes(M.MARKET.rf10y.label)&&/2026-10-08/.test(p),c.id+' rate values without their label: '+p.slice(0,80));
   if(/적격 TDF/.test(p))assert.ok(p.includes(M.MARKET.tdfException.label),c.id+' TDF exception without its label');
  }
  for(const q of [c.quiz,c.transfer])assert.doesNotMatch(q[1][q[2]],/4\.4%|4\.9%|70%|TDF/,c.id+' ⏱ value as an answer');
 }
 for(const [id,qs] of Object.entries(R.chapters))for(const q of qs){assert.doesNotMatch(q.choices[q.answer],/4\.4%|4\.9%|70% 한도|한도 70%|TDF/,id+' review answer uses a ⏱ value');assert.doesNotMatch(q.q+q.why,/4\.4%|4\.9%|70% 한도|한도 70%|TDF/,id);}
 assert.doesNotMatch(prose(byId.beta).replace(/[^.]*6권 확인값 · 서재 안 재인용[^.]*\./g,''),/위험 프리미엄 4\.9%(?!.*확인)/);
 assert.match(JSON.stringify(byId.beta.details),/⏱/,'ch5 box carries ⏱');assert.ok(B.sources.filter(s=>/^⏱/.test(s[2])).length===2,'two ⏱ sources');
});
test('fictional people and companies are called 가상 at first mention; 하린 covers ch1–9 and 윤 씨 appears only in ch10',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs].join(' ')).join(' ');
 for(const n of ['하린','새벽전자','누리200','윤 씨']){const i=text.indexOf(n);assert.ok(i>=0,n);assert.match(text.slice(Math.max(0,i-40),i+40),/가상/,n+' is called 가상 at first mention');}
 for(const c of B.chapters.slice(0,9)){assert.doesNotMatch(JSON.stringify(c),/윤 씨/,c.id+' has no 윤 씨');}
 assert.ok(B.chapters.slice(0,9).filter(c=>c.paragraphs.join(' ').includes('하린')).length>=7,'하린 runs through ch1–9');
 assert.doesNotMatch(JSON.stringify(R.chapters).replace(/"final":[\s\S]*$/,''),/윤 씨/,'review: 윤 씨 only in final');
});
test('terms and symbols are explained near their first use',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['%p','퍼센트포인트'],['공분산','ρ'],['고윳값','고윳값의 부호'],['샤프 비율','위험 한 단위당 초과수익'],['베타','함께 움직이는 정도'],['CAPM','요구수익률'],['켈리','장기 성장률이 가장 높은'],['IRP','개인형 퇴직연금']]){
  const first=text.indexOf(sym),near=text.indexOf(expl,Math.max(0,first-200));assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<300,sym+' explained near its first use ('+first+' vs '+near+')');
 }
});
test('the ch10 solution numbers sit only in the folded 풀이 box; the 과제지 does not give them away',()=>{
 const f=byId.final,open=[f.desc,...f.paragraphs,f.formula,f.formulaNote,...f.flow,f.warning,...f.details.filter(d=>!/^풀이/.test(d[0])).map(d=>d.join(' '))].join(' ');
 for(const s of ['16.46%','18.72%','−31.05%','−9,315만','−14.33%','−4,298만','28.36','41.06'])assert.ok(!open.replace(/\(−14\.325% → −14\.33%\)/,'').includes(s),'solution leaked outside the 풀이 box: '+s);
 assert.ok(f.details.some(d=>/^풀이\(과제를 마친 뒤 펼치기\)$/.test(d[0])&&d[1].includes('59.42')),'풀이 box');
});
test('K7: titles and descriptions name what is covered; descriptions end with the reader’s action',()=>{
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^(하린|윤 씨)/,c.id+' desc starts with what the reader does');assert.match(c.desc,/(계산|구하|적|확인|견주|읽|찾|따집|나눕|구별|맞춥|봅)[^.]*니다\.$/,c.id+' desc ends with the reader’s action');
  assert.doesNotMatch(c.title,/달걀|바구니|전달되는 길|울타리|지갑|저울|상관이 1이 된다/,c.id);}
});
test('review.json: schema 1, book allocation, three questions per chapter, 3–4 choices, answers spread, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'allocation');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2,id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
 const counts=[0,1,2,3].map(p=>Object.values(R.chapters).flat().filter(q=>q.answer===p).length);assert.ok(Math.max(...counts)<=12,'no position holds most answers: '+counts);
});
test('review answers are the values AMath computes',()=>{
 const ans=(id,i)=>{const q=R.chapters[id][i];return q.choices[q.answer];},p2=x=>M.pct(x,2).toFixed(2);
 assert.equal(ans('diversify',0),`약 ${p2(M.equalSigma(0.4,0.2,4))}%`);assert.equal(ans('diversify',1),`${p2(M.equalSigma(0.4,0.25,Infinity))}%`);
 assert.equal(ans('matrix',0),M.covariance(-0.5,0.2,0.3).toFixed(4).replace('-','−'));assert.equal(ans('matrix',1),`약 ${p2(M.twoAsset(0.5,{sigma:0.2},{sigma:0.1},0.5).sigma)}%`);
 const e=M.checkCorr(M.equalCorr(5,0.6));assert.equal(ans('matrix',2),`${M.round(e.max,1).toFixed(1)}, ${M.round(e.maxShare*100,0)}%`);assert.equal(M.firstEigen(5,0.6).toFixed(1),'3.4');
 const pr=M.twoAsset(0.25,{mu:0.08,sigma:0.2},{mu:0.04,sigma:0.05},0);assert.equal(ans('pair',0),`기대수익 ${p2(pr.mu)}%, 표준편차 ${p2(pr.sigma)}%`);assert.equal(ans('pair',1),`${p2(M.minVar2(0.2,0.1,0.25))}%`);
 assert.match(ans('pair',2),/^낮출 수 없다/);assert.ok(Math.abs(M.twoAsset(0.3,{sigma:0.2},{sigma:0.1},1).sigma-0.13)<1e-12);
 assert.equal(ans('frontier',0),`가, ${M.sharpe(0.09,0.2,0.02).toFixed(2)}`);const cm=M.cashMix({mu:0.065,sigma:0.10,sharpe:0.4},0.04);assert.equal(ans('frontier',1),`접점 ${M.pct(cm.share,0)}%, 기대수익 ${p2(cm.mu)}%`);
 assert.ok(M.tangency(false).sharpe>=M.tangency(true).sharpe-1e-12,'frontier 3: the constraint cannot do better');
 assert.equal(ans('beta',0),M.beta([2,-2,4,0],[3,-3,6,0]).beta.toFixed(2));assert.equal(ans('beta',1),`${M.capm(3,0.8,5).toFixed(2)}%`);assert.equal(ans('beta',2),`${M.pct(M.riskSplit(0.6,0.3,0.2).systematic,0)}%`);
 assert.equal(ans('mix',0),`약 ${p2(M.mix(0.5,0.4,0.1).sigma)}%`);const m2=M.mix(0.7,0,0.3);assert.equal(ans('mix',1),`기대수익 ${p2(m2.mu)}%, 표준편차 ${p2(m2.sigma)}%`);assert.ok(ans('mix',2).startsWith(`${String(5-2*10).replace('-','−')}%.`));
 const o={start:10000,target:0.6,band:0.05,stock:[0.2],bond:[0]},ra=M.rebalance('annual',o).rows[0],rb=M.rebalance('band',o).rows[0];
 assert.equal(ans('rebalance',0),`${ra.trade}만 원`);assert.equal(rb.trade,0);assert.match(ans('rebalance',1),new RegExp(`^되돌리지 않는다\\. ${p2(rb.drift)}%p`));assert.match(R.chapters.rebalance[1].q,new RegExp(p2(rb.weight)));
 assert.equal(ans('kelly',0),M.kellyF(0.7,1).toFixed(2));assert.equal(ans('kelly',1),M.kellyF(0.5,2).toFixed(2));assert.match(R.chapters.kelly[2].why,new RegExp(M.growth(0.4,0.6,1).toFixed(4).replace('-','−')));
 assert.equal(ans('crisis',0),`약 ${p2(M.equalSigma(0.2,0.2,2))}% → 약 ${p2(M.equalSigma(0.2,0.9,2))}%`);assert.equal(ans('crisis',1),`${p2(M.equalSigma(0.25,0.81,Infinity))}%`);
 const E=M.evaluatePlan({w:[0,0.3,0.2,0.35,0.15]}),F=M.evaluatePlan({w:[0.2,0.3,0.25,0.2,0.05]});
 assert.equal(ans('final',0),`${E.lossPct.toFixed(2).replace('-','−')}%, ${M.wonText(E.loss).replace(' 원','')} 원으로 조건 1 ${E.cond1?'✓':'✗'}`);
 assert.equal(E.cond2,true);assert.equal(F.cond2,false);assert.match(R.chapters.final[1].why,new RegExp(M.wonText(F.safe).replace(' 원','')));assert.ok(R.chapters.final[1].why.includes(F.lossPct.toFixed(2).replace('-','−')+'%('+M.wonText(F.loss).replace(' 원','')));
 assert.throws(()=>M.evaluatePlan({w:[0.3,0.3,0.2,0.1,0.1],irp:[1000,3000,3000,2000,1000]}),/single stock/,'final 3: the IRP holds no single stock');
});
