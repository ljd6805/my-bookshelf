/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall, 확인·전이 문제,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index)와 #links 계획, 출처 표기, 권유 말투와 금지 낱말, 면책 문장·고정 문장의 자리,
   시점에 묶인 값(⏱)의 꼬리표, 가상 인물, 실제 증권사 이름과 키 칸이 없음, 마지막 과제의 풀이 상자, 복습 문항의 답과 BMath 계산. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.BBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['backtest','data','lookahead','fills','metrics','overfit','api','orders','limits','monitor','final'];
const LABS=['grid-run','assume-data','assume-code','assume-fills','sharpe-boot','is-oos','mock-api','order-recon','stop-rules','fill-match','loss-audit'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1].trim();};
/* 확인·전이 칸에서 끝의 괄호 속 답을 뗀 질문. 답 안에 괄호가 또 있을 수 있어 짝을 맞춰 뗀다. */
const dropAnswer=t=>{t=t.trim();if(!t.endsWith(')'))return t;let d=0;for(let i=t.length-1;i>=0;i--){if(t[i]===')')d++;else if(t[i]==='('&&--d===0)return t.slice(0,i).trim();}return t;};
const ask=(id,kind)=>{const m=rows[id]&&rows[id].match(new RegExp(kind+': ([\\s\\S]*?)(<br>|</td>)'));return m&&dropAnswer(m[1]);};
const byId=Object.fromEntries(B.chapters.map(c=>[c.id,c]));
/* 권유·단정 말투와 AGENTS.md의 금지 낱말. 따옴표 속 인용(오해 문장)은 뺀다. */
const ADVICE=/(사세요|파세요|수익 보장|이기는 전략|검증된 전략|최적 설정|오를 것|내릴 것|추천합니다|권합니다|권해 드|매수하세요|매도하세요|돌려 보세요|맡기세요|반드시 오른|반드시 내린)/;
const BROKERS=/(키움|미래에셋|삼성증권|한국투자|NH투자|KB증권|신한투자|대신증권|토스증권|하나증권|kiwoom|koreainvestment|KIS Developers|OpenAPI\+)/i;
const unquote=s=>s.replace(/“[^”]*”/g,'');
const prose=c=>[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.details),JSON.stringify(c.quiz),JSON.stringify(c.transfer)].join(' ');

test('eleven chapters with stable ids in order, one lab each with a K7 id',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,11);
 for(const l of LABS)assert.match(l,/^[a-z]+(-[a-z]+)+$/);
});
test('chapter titles, parts and times match the approved curriculum table in docs/index.html #curriculum (189 minutes)',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum-map"'));
 const table=Object.fromEntries([...cur.matchAll(/<tr><td>\d\d (\w+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>(\d+분)<\/td>/g)].map(m=>[m[1],{title:m[2],part:m[3],time:m[4]}]));
 assert.deepEqual(Object.keys(table),IDS,'curriculum rows');
 const parts=['과거 기록으로 시험한 수익률을 다시 계산하기','수익률을 구간으로 말하고 고른 설정을 표본 밖에서 다시 재기','모의 서버에서 봇의 주문을 대사하고 멈춤 조건 시험하기','마지막 과제'];
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],parts);
 for(const c of B.chapters){const t=table[c.id];assert.equal(c.title,t.title,c.id+' title');assert.equal(c.time,t.time,c.id+' time');
  const n=parts.indexOf(c.group);if(c.group==='마지막 과제')assert.match(t.part,/마지막 과제/);else assert.ok(t.part===`${n+1}부`||t.part===`${n+1}부 · ${c.group}`,c.id+' part '+t.part);}
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','16분','16분','18분','18분','18분','14분','18분','16분','16분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),189);assert.match(byId.final.title,/^마지막 과제 · /);
 for(const c of B.chapters.slice(0,10))assert.ok(c.title.replace(/\s/g,'').length<=34,c.id+' title within 34 characters');
});
test('every chapter has the field set of the series in order, with the right shapes',()=>{
 const KEYS=['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'];
 for(const c of B.chapters){
  assert.deepEqual(Object.keys(c),KEYS,c.id+' field order');for(const k of KEYS)assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.ok(q[1].length>=3&&q[1].length<=4,c.id);assert.equal(new Set(q[1]).size,q[1].length,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.length>0&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  for(const [,html] of c.details){assert.equal((html.match(/<table>/g)||[]).length,(html.match(/<\/table>/g)||[]).length,c.id+' table tags');if(html.includes('<table>'))assert.match(html,/<th scope="col">/,c.id+' table headers');}
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');assert.ok(c.cross.length>0,c.id+' cross');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
  if(c.id!=='final')c.paragraphs.forEach((p,i)=>assert.ok(p.includes(`${IDS.indexOf(c.id)+1}.${i+1} `),c.id+' paragraph '+(i+1)+' carries its section number'));
 }
});
test('each chapter after the first opens from an earlier result (7장 after the 7.0 note on part 3)',()=>{
 for(let i=1;i<B.chapters.length;i++){const c=B.chapters[i],p0=c.paragraphs[0],p=c.id==='api'?p0.slice(p0.indexOf('7.1 ')+4):c.id==='final'?p0.replace(M.TEXT.disclaimer+'. ',''):p0;assert.match(p,/^[\d.·~]+(장|절)/,c.id+' first sentence names the earlier chapter');}
});
test('recall equals the L1 cell; quiz and transfer questions equal the 확인 and 전이 questions of the design table',()=>{
 for(const c of B.chapters){const l1=cell(c.id);assert.ok(l1,c.id);assert.equal(c.recall,l1,c.id);assert.equal(c.quiz[0],ask(c.id,'확인'),c.id+' quiz');assert.equal(c.transfer[0],ask(c.id,'전이'),c.id+' transfer');}
});
test('every source is opened research with HTTPS, a grade and the check date, and every source is cited',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){
  assert.match(url,/^https:\/\//);assert.ok(research.includes(`href="${url}"`)||research.includes(`href="${url.replace(/&/g,'&amp;')}"`),'not in research: '+url);
  assert.match(note,/\((학술[^,()]*|2차 자료|공식 문서|보도|교재 목차)[^()]*확인 2026-10-14\)\.?$/,title);
 }
 assert.equal(new Set(B.chapters.flatMap(c=>c.source)).size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, and follow plan #links',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'missing book: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);assert.doesNotMatch(why,/깊이 보기 \(뒤 권\)/,c.id+': this is the last volume');
 }
 const plan={backtest:['../grid/#box'],data:['../market/#events'],lookahead:['../aie-ml/#pipeline'],fills:['../market/#queue','../market/#cost','../grid/#cell'],
  metrics:['../volatility/#drawdown','../allocation/#frontier','../probability/#interval','../grid/#compare'],overfit:['../aie-ml/#tradeoff','../probability/#testing','../probability/#clt'],
  api:['../aie-workbench/#keys'],orders:['../aie-autonomy/#durable','../computer/#programs'],limits:['../market/#limits','../aie-autonomy/#budget','../grid/#exit'],
  monitor:['../aie-rl/#simreal','../aie-workbench/#data'],final:['../psychology/#final','../tax/#trade']};
 for(const c of B.chapters)assert.deepEqual(c.cross.map(x=>x[1]),plan[c.id],c.id+' links follow plan #links');
 const links=doc.slice(doc.indexOf('id="links"'),doc.indexOf('id="links-open"'));
 for(const [id,urls] of Object.entries(plan))for(const u of urls){const [,folder,anchor]=u.match(/^\.\.\/([a-z-]+)\/#([a-z-]+)$/);assert.ok(links.includes(`#${id} →`),'plan #links lists #'+id);assert.ok(links.includes('#'+anchor),'plan #links names #'+anchor+' ('+folder+')');}
});
test('no link to an unpublished folder or to this book',()=>{
 const src=read('js/content.js')+read('review.json');
 for(const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g))assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'link to a folder without a book: '+m[1]);
 assert.doesNotMatch(src,/\.\.\/backtest\//);assert.doesNotMatch(src,/14권/);
});
test('no advice wording, banned words or broker names; the disclaimer and fixed sentences sit where G0/G1 asked',()=>{
 for(const f of ['js/content.js','review.json']){assert.doesNotMatch(unquote(read(f)),ADVICE,f);assert.doesNotMatch(read(f),BROKERS,f+' names a real broker');assert.doesNotMatch(read(f),/(앱 키|비밀 키|app ?key|secret)\s*(칸|입력)/i,f+' asks for a key');}
 const f=byId.final,T=M.TEXT;assert.ok(f.paragraphs[0].includes(T.disclaimer),'final p0 disclaimer');assert.ok(f.formulaNote.includes(T.disclaimer),'final formula note disclaimer');
 assert.ok(f.details.some(([h,html])=>/^풀이/.test(h)&&html.includes(T.disclaimer)),'final solution box disclaimer');
 assert.ok(prose(f).includes(T.window60),'final: window60');assert.ok(prose(f).includes(T.noVerdict),'final: noVerdict');
 assert.ok(byId.api.paragraphs[0].includes(T.noAuto),'api p0: noAuto');assert.ok(prose(byId.api).includes(T.brokerDocs),'api: brokerDocs');
 for(const id of ['backtest','metrics','overfit','monitor'])assert.ok(prose(byId[id]).includes(T.madeYear3),id+': the made-up year 3 is named');
 assert.ok(byId.fills.formulaNote.includes(M.MARKET.recheck),'fills re-check sentence');
 assert.match(prose(byId.backtest),/기대 수익률/);assert.match(prose(byId.metrics),/변동성/);
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
test('fictional people and companies are called 가상 at first mention; 하린 runs through the book',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs].join(' ')).join(' ');
 for(const n of ['하린','새벽전자']){const i=text.indexOf(n);assert.ok(i>=0,n);assert.match(text.slice(Math.max(0,i-60),i+60),/가상/,n+' is called 가상 at first mention');}
 assert.ok(B.chapters.filter(c=>c.paragraphs.join(' ').includes('하린')).length>=8,'하린 runs through the chapters');
 assert.match(prose(byId.backtest),/가상 기록|가상 회사/);
});
test('terms are explained near their first use in the body',()=>{
 const text=B.chapters.map(c=>[...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['수정주가','거꾸로 맞춰'],['미래 정보','장 마감 가격을 보고'],['요청 ID','같은'],['부분 체결','일곱 상태']]){
  const first=text.indexOf(sym),near=text.indexOf(expl,Math.max(0,first-300));assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<400,sym+' explained near its first use ('+first+' vs '+near+')');
 }
});
test('the final solution numbers sit only in the folded 풀이 box; the 과제지 and first screen do not give them away',()=>{
 const f=byId.final,open=[f.subtitle,f.desc,...f.paragraphs,f.formula,f.formulaNote,...f.flow,f.warning,...f.details.filter(d=>!/^풀이/.test(d[0])).map(d=>d.join(' '))].join(' ');
 const a=M.audit(),won=n=>Math.abs(n).toLocaleString('en-US');
 for(const n of [a.fillDiff,a.dupPnl,a.dupCost,a.expected,a.optimistic])assert.ok(!open.includes(won(n)),'solution leaked outside the 풀이 box: '+won(n));
 const box=f.details.find(d=>/^풀이\(과제를 마친 뒤 펼치기\)$/.test(d[0]));assert.ok(box,'풀이 box');for(const n of [a.bt,a.fillDiff,a.dupPnl,a.total])assert.ok(box[1].includes(won(n)),'풀이 box has '+won(n));
 assert.ok(!box[1].includes('527,250'),'the 풀이 box leaves the L2 answer to the question');
});
test('K7: titles and descriptions name what is covered; descriptions end with the reader’s action; no props or picture words',()=>{
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^(어느 날|그날 밤|밤사이|아침)/,c.id+' desc does not open with a scene');
  assert.match(c.desc,/((계산|기록|확인|구별|비교|시험)합니다|(견줍|셉|나눕|고칩|고릅|읽습|찾습|봅|정합|맞춥)니다)\.$/,c.id+' desc ends with the reader’s action');
  assert.doesNotMatch(c.title+c.subtitle,/거울|저울|함정|덫|울타리|지갑|단추|일생|전달되는 길|미리 본/,c.id);}
});
test('review.json: schema 1, book backtest, three questions per chapter, 3–4 choices, answers spread, numbers not only in the right choice, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'backtest');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);
   if(/\d/.test(q.choices[q.answer]))assert.ok(q.choices.some((c,i)=>i!==q.answer&&/\d/.test(c)),id+': numbers appear only in the right choice: '+q.q.slice(0,40));}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2,id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
 const counts=[0,1,2,3].map(p=>Object.values(R.chapters).flat().filter(q=>q.answer===p).length);assert.ok(Math.max(...counts)<=13,'no position holds most answers: '+counts);
});
test('review answers are the values BMath computes',()=>{
 const ans=(id,i)=>{const q=R.chapters[id][i];return q.choices[q.answer];},all=id=>R.chapters[id].map(q=>q.choices[q.answer]+' '+q.why).join(' '),won=n=>Math.abs(n).toLocaleString('en-US');
 assert.match(all('backtest'),new RegExp((M.annualize(4e6,4.66e6,750)*100).toFixed(2)+'%'));
 const s=M.survivorSimple(15,0.06,5,-0.6);assert.match(all('data'),new RegExp(`${(s.all*100).toFixed(1).replace('-','−')}%`));
 assert.match(all('lookahead'),new RegExp(won(M.stopLines(50,18100,17200,17500,17500).diff)+'원'));
 const rt=M.roundTrip(19000,19250,8);assert.match(all('fills'),new RegExp(won(rt.net)+'원'));
 const mo=M.monthly([1,3,-2,2].map(x=>x/100),[100,110,99,105]);assert.match(all('metrics'),new RegExp(`${(mo.mdd*100).toFixed(2).replace('-','−')}%`));
 assert.match(all('overfit'),new RegExp(`${M.rankCheck([20,16,13,10],[2,6,-1,4]).oosRank}위`));assert.match(ans('overfit',1),new RegExp(M.emax(402,1000).sharpe.toFixed(3).replace('.','\\.')));
 const of=M.orderFlow(19250,12,[{type:'ack',id:1},{type:'fill',qty:5,id:2},{type:'cancelReq',id:3},{type:'cancelAck',id:4}]);assert.equal(ans('orders',0),`주식 ${of.diff.shares}주, 현금 ${won(of.diff.cash)}원`);
 assert.match(all('limits'),new RegExp(won(M.lossLimit(8e6,1.2))+'원'));
 const r=M.residual(-70000,-50000,-6000);assert.match(all('final'),new RegExp(won(r)+'원'));
});
