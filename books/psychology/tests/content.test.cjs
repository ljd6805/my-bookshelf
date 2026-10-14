/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall, 확인·전이 문제,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index)와 #links 계획, 출처 표기, 권유 말투와 금지 낱말, 면책 문장·재확인 문장·모형 꼬리표,
   1장의 “저장하지 않음” 문장, 시점에 묶인 값(⏱)의 꼬리표, 가상 인물, 재현에 실패한 효과를 쓰지 않음, 13권(준비 중)과 없는 책 폴더로 가는 링크,
   마지막 과제의 풀이 상자. index.html이 생기면 화면 쪽 검사를 따로 더한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.PBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['frame','prospect','disposition','baserate','confirm','overconfidence','herd','outcome','rules','final'];
const LABS=['two-frame-choice','value-function','disposition-count','base-rate-grid','likelihood-odds','interval-cost','info-cascade','loss-by-trials','rule-replay','journal-audit'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1].trim();};
const ask=(id,kind)=>{const m=rows[id]&&rows[id].match(new RegExp(kind+': ([\\s\\S]*?\\?) \\('));return m&&m[1].trim();};
const byId=Object.fromEntries(B.chapters.map(c=>[c.id,c]));
/* 권유·단정 말투: 규칙·종목·매매 시점을 권하거나 사고팔라고 하거나 가격의 방향을 하나로 정하는 말(AGENTS.md의 금지 낱말 포함).
   이 책은 매매 기록을 읽으므로 “매수”, “매도”, 추천 영상을 가리키는 “추천”은 낱말로 쓴다. 따옴표 속 인용(오해 문장)은 뺀다. */
const ADVICE=/(사세요|파세요|손절하세요|정답 규칙|이기는 습관|오를 것|내릴 것|추천합니다|추천해 드|권합니다|권해 드|사 두세요|팔아 두세요|매수하세요|매도하세요|반드시 오른|반드시 내린|저평가|고평가|최적의 규칙|좋은 규칙입니다)/;
const DISCLAIMER=M.TEXT.disclaimer;
const unquote=s=>s.replace(/“[^”]*”/g,'');
const prose=c=>[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.details),JSON.stringify(c.quiz),JSON.stringify(c.transfer)].join(' ');

test('ten chapters with stable ids in order, one lab each with a K7 id',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
 for(const l of LABS)assert.match(l,/^[a-z]+(-[a-z]+)+$/);
});
test('chapter titles, parts and times match the approved curriculum table in docs/index.html #curriculum (171 minutes)',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="chapters"'));
 const table=Object.fromEntries([...cur.matchAll(/<tr><td>\d\d (\w+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>(\d+분)<\/td>/g)].map(m=>[m[1],{title:m[2],part:m[3],time:m[4]}]));
 assert.deepEqual(Object.keys(table),IDS,'curriculum rows');
 const parts=['이익과 손실 앞에서 선택이 바뀌는 크기 계산하기','믿음을 증거와 기저율로 다시 계산하기','남을 따를 때와 결과만 볼 때 틀릴 확률 계산하고 규칙 대입하기','마지막 과제'];
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],parts);
 for(const c of B.chapters){const t=table[c.id];assert.equal(c.title,t.title,c.id+' title');assert.equal(c.time,t.time,c.id+' time');
  const n=parts.indexOf(c.group);if(c.group==='마지막 과제')assert.equal(t.part,'마지막 과제');else assert.ok(t.part===`${n+1}부`||t.part===`${n+1}부 · ${c.group}`,c.id+' part '+t.part);}
 for(const [i,g] of parts.slice(0,3).entries())assert.ok(cur.includes(`${i+1}부 · ${g}`),'part name '+g);
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','18분','16분','16분','16분','18분','14분','16분','18분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),171);assert.match(byId.final.title,/^마지막 과제 · /);
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
  c.paragraphs.forEach((p,i)=>assert.ok(p.includes(`${IDS.indexOf(c.id)+1}.${i+1} `),c.id+' paragraph '+(i+1)+' carries its section number'));
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
  assert.match(note,/\((학술[^,()]*|2차 자료)[^()]*확인 2026-10-14\)\.?$/,title);
 }
 assert.equal(new Set(B.chapters.flatMap(c=>c.source)).size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, follow plan #links, and only vols 11 and 12 are marked 깊이 보기 (뒤 권)',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'missing book: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
  if(['tax','grid'].includes(m[1]))assert.match(why,/^깊이 보기 \(뒤 권\)/,c.id+' '+m[1]+' is a later volume');else assert.doesNotMatch(why,/깊이 보기/,c.id+' '+m[1]+' is an earlier volume or another field');
 }
 const plan={frame:['../probability/#chance'],prospect:['../allocation/#kelly'],disposition:['../grid/#exit','../grid/#ledger'],baserate:['../probability/#bayes','../statements/#quality'],confirm:['../valuation/#final'],
  overconfidence:['../probability/#binomial','../probability/#interval','../market/#cost','../tax/#trade'],herd:['../probability/#bayes'],outcome:['../volatility/#drawdown'],rules:['../grid/#exit','../allocation/#rebalance'],final:['../probability/#chance']};
 for(const c of B.chapters)assert.deepEqual(c.cross.map(x=>x[1]),plan[c.id],c.id+' links follow plan #links');
 const links=doc.slice(doc.indexOf('id="links"'),doc.indexOf('id="links-open"'));
 for(const [id,urls] of Object.entries(plan))for(const u of urls){const [, folder,anchor]=u.match(/^\.\.\/([a-z-]+)\/#([a-z-]+)$/);assert.ok(links.includes(`#${id} →`),'plan #links lists #'+id);assert.ok(links.includes('#'+anchor),'plan #links names #'+anchor+' ('+folder+')');}
});
test('vol 13 is named as text “13권(준비 중)” only; no link to an unpublished folder or to this book',()=>{
 const src=read('js/content.js')+read('review.json');
 for(const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g))assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'link to a folder without a book: '+m[1]);
 assert.doesNotMatch(src,/\.\.\/psychology\//);assert.match(src,/13권\(준비 중\)/);assert.doesNotMatch(src,/(?<![\d.])13권(?!\(준비 중\))/);
});
test('no advice wording or banned words; the disclaimer, re-check sentence, model and parameter notes sit where G0/G1 asked',()=>{
 assert.doesNotMatch(unquote(read('js/content.js')),ADVICE);assert.doesNotMatch(unquote(read('review.json')),ADVICE);
 for(const w of ['정답 규칙','이기는 습관','손절하세요','틀린 쏠림','편향 거울','마음의 지도'])assert.ok(!read('js/content.js').includes(w)&&!read('review.json').includes(w),'banned: '+w);
 const f=byId.final;assert.ok(f.paragraphs[0].includes(DISCLAIMER),'ch10 p0 disclaimer');assert.ok(f.formulaNote.includes(DISCLAIMER),'ch10 formula note disclaimer');
 assert.ok(f.details.some(([h,html])=>/^풀이/.test(h)&&html.includes(DISCLAIMER)),'ch10 solution box disclaimer');assert.ok(byId.rules.formulaNote.includes(DISCLAIMER),'ch9 formula note disclaimer');
 for(const id of ['overconfidence','final'])assert.ok(byId[id].formulaNote.includes(M.MARKET.recheck),id+' re-check sentence');
 assert.ok(byId.herd.formulaNote.includes(M.TEXT.cascadeNote),'ch7 model note');assert.match(byId.herd.formulaNote,/시각적 비유/);
 assert.match(byId.prospect.formulaNote,/한 연구의 중앙값\(Tversky·Kahneman 1992\)이며 사람마다·연구마다 다릅니다/);
 assert.ok(prose(byId.rules).includes(M.TEXT.ifThen.replace('것이 아님','것이 아닙니다')),'ch9 if-then scope');
 assert.ok(byId.frame.paragraphs.join(' ').includes('새로고침하면 선택이 사라집니다'),'ch1 says choices are not kept');assert.match(byId.frame.formulaNote,/저장하지 않으며/);
 assert.ok(byId.rules.paragraphs[0].includes('권하는 규칙이 아닙니다'),'ch9 says the rules are examples');
});
test('replication: no ego depletion, money priming or power pose; the 1981 replication is stated as unchecked',()=>{
 const all=read('js/content.js')+read('review.json');assert.doesNotMatch(all,/자아 고갈|의지력이 닳|돈 점화|파워 포즈|ego depletion|money priming|power pose/i);
 assert.match(byId.frame.paragraphs[3],/재현되었는지는 이 책이 확인하지 못했습니다/);assert.match(byId.prospect.paragraphs[3],/94%의 항목이 재현되었고 효과는 원래보다 약했습니다/);
 assert.match(byId.prospect.paragraphs[3],/1\.955/);assert.match(prose(byId.overconfidence),/관련이 없었고/);
});
test('⏱ values appear only with their labels and the check date, never as quiz, transfer or review answers',()=>{
 const TAX=/0\.20%/,FEE=/0\.015%/;
 for(const c of B.chapters){
  const parts=[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,...c.details.map(d=>d.join(' '))].map(unquote);
  for(const p of parts){
   if(TAX.test(p))assert.ok(p.includes(M.MARKET.tradeTax.label)&&p.includes('2026-10-14')&&p.includes('⏱'),c.id+' tax rate without its label: '+p.slice(0,80));
   if(FEE.test(p))assert.ok(p.includes('가정')&&p.includes('2026-10-14'),c.id+' fee without its label: '+p.slice(0,80));
  }
  for(const q of [c.quiz,c.transfer])assert.doesNotMatch(q[1][q[2]],/0\.20%|0\.015%/,c.id+' ⏱ value as an answer');
 }
 for(const [id,qs] of Object.entries(R.chapters))for(const q of qs)assert.doesNotMatch(q.q+q.choices.join()+q.why,/0\.20%|0\.015%|0\.2%/,id+' review uses a ⏱ value');
});
test('fictional people and companies are called 가상 at first mention; 선우 runs through the book and 하린 appears only in a recall',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs].join(' ')).join(' ');
 for(const n of ['선우','새벽전자','온결식품','가람200','누리 해외100']){const i=text.indexOf(n);assert.ok(i>=0,n);assert.match(text.slice(Math.max(0,i-60),i+40),/가상/,n+' is called 가상 at first mention');}
 assert.ok(B.chapters.filter(c=>c.paragraphs.join(' ').includes('선우')).length>=9,'선우 runs through the chapters');
 for(const c of B.chapters)assert.doesNotMatch(JSON.stringify(Object.assign({},c,{recall:''})),/하린/,c.id+': 하린 only in recall');
 assert.doesNotMatch(JSON.stringify(R.chapters),/하린/);
});
test('terms and symbols are explained near their first use in the body (subtitle and desc are summaries shown above the body)',()=>{
 const text=B.chapters.map(c=>[...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['기대값','확률과 금액을 곱해 더한'],['손실 회피 계수','몇 배 크게 느끼는지'],['확실성 등가','확실히 받으면 같다고 느끼는'],['PGR','이익 난 종목 가운데 판 것의 비율'],['기저율','얼마나 흔한지'],['우도비','참일 때 그 증거가 나올 확률'],['회전율','평균 평가액으로 나눈'],['%p','퍼센트포인트'],['정보 폭포','앞사람'],['결과 편향','결과가 나쁠 때 더 나쁘게']]){
  const first=text.indexOf(sym),near=text.indexOf(expl,Math.max(0,first-300));assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<400,sym+' explained near its first use ('+first+' vs '+near+')');
 }
});
test('the ch10 solution numbers sit only in the folded 풀이 box; the 과제지 and first screen do not give them away',()=>{
 const f=byId.final,open=[f.subtitle,f.desc,...f.paragraphs,f.formula,f.formulaNote,...f.flow,f.warning,...f.details.filter(d=>!/^풀이/.test(d[0])).map(d=>d.join(' '))].join(' ');
 for(const s of ['44만 4,934','444,934','2,001만 4,650','63만 6,018','36만 1,832','82만 9,846','93만 8,870','0.714','0.111','4.8주','19주'])assert.ok(!open.includes(s),'solution leaked outside the 풀이 box: '+s);
 const box=f.details.find(d=>/^풀이\(과제를 마친 뒤 펼치기\)$/.test(d[0]));assert.ok(box,'풀이 box');assert.ok(box[1].includes('44만 4,934'));
 for(const s of ['0.714','0.111','4.8주'])assert.ok(!box[1].includes(s),'the 풀이 box leaves the L2 and 확인 answers to the questions: '+s);
});
test('K7: titles and descriptions name what is covered; descriptions end with the reader’s action; no props or picture words',()=>{
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^(선우|하린)/,c.id+' desc starts with what the reader does');
  assert.match(c.desc,/((계산|기록|확인|구별|비교|시험|설계)합니다|(견줍|셉|나눕|고칩|고릅|읽습|찾습)니다)\.$/,c.id+' desc ends with the reader’s action');
  assert.doesNotMatch(c.title+c.subtitle,/거울|저울|마음의 지도|함정|덫|울타리|지갑|전달되는 길/,c.id);}
});
test('review.json: schema 1, book psychology, three questions per chapter, 3–4 choices, answers spread, numbers not only in the right choice, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'psychology');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);
   if(/\d/.test(q.choices[q.answer]))assert.ok(q.choices.some((c,i)=>i!==q.answer&&/\d/.test(c)),id+': numbers appear only in the right choice: '+q.q.slice(0,40));}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2,id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
 const counts=[0,1,2,3].map(p=>Object.values(R.chapters).flat().filter(q=>q.answer===p).length);assert.ok(Math.max(...counts)<=12,'no position holds most answers: '+counts);
 assert.ok(R.chapters.rules.some(q=>/규칙을 지킨 쪽이 손해/.test(q.why)),'ch9 has an item where following the rule loses');
});
test('review answers are the values PMath computes',()=>{
 const ans=(id,i)=>{const q=R.chapters[id][i];return q.choices[q.answer];},p1=x=>M.pct(x,1).toFixed(1),won=n=>n.toLocaleString('en-US');
 assert.equal(M.ev([[0.5,200],[0.5,0]]),100);assert.equal(ans('frame',0),'둘 다 +100만 원');assert.equal(ans('frame',1),`${700-100}만 원`);
 assert.equal(ans('prospect',0),`약 ${M.prospect(100,100).value.toFixed(2).replace('-','−')}`);assert.equal(ans('prospect',1),`${M.threshold(100,{lambda:1,alpha:1,beta:1})}만 원`);assert.match(ans('prospect',2),new RegExp(M.weight(0.01,0.61).toFixed(4)));
 const d=M.pgrPlr({RG:4,PG:4,RL:1,PL:4});assert.equal(ans('disposition',1),`PGR ${d.pgr.toFixed(3)}, PLR ${d.plr.toFixed(3)}`);
 assert.equal(ans('baserate',0),`약 ${p1(M.bayes(0.1,0.5,0.1).posterior)}%`);assert.equal(ans('baserate',1),`${M.bayes(0.01,0.8,0.1).grid.flagged}개`);assert.ok(M.bayes(0.01,0.6,0.1).posterior<M.bayes(0.02,0.6,0.1).posterior,'lower base rate, lower posterior');
 assert.equal(ans('confirm',0),`${p1(M.oddsUpdate(0.25,[3]).p)}%`);assert.equal(M.oddsUpdate(0.3,[4,0.25]).p.toFixed(12),(0.3).toFixed(12));
 assert.equal(ans('overconfidence',1),`${M.pct(M.costDrag(2),2).toFixed(2)}%p`);assert.equal(ans('herd',2),`약 ${p1(M.cascadeOdds(0.7).right)}%`);
 assert.ok(M.cascadeRun([true,true,true],()=>false).acts[2].buy,'herd 1: the third buys');assert.ok(M.thirdPerson(0.6)>0.5,'herd 1: buys even with a bad signal');
 assert.equal(ans('outcome',0),`+${M.round(M.outcomeDist(0.6,1).each,1)}`);assert.equal(ans('outcome',1),`약 ${p1(M.outcomeDist(0.55,4).neg)}%`);
 const P=M.pathRule();assert.equal(ans('rules',0),`${won(P.hold-P.rule)}원 손해`);assert.ok(P.rule<P.hold,'rules 1: following R1 loses on the rebound path');
 assert.match(ans('rules',1),new RegExp(`${(M.pct(18100/20000-1,1)).toFixed(1).replace('-','−')}%`));
 assert.equal(ans('final',0),`${M.r3Count().noted}건`);assert.equal(M.audit().others,1);
});
