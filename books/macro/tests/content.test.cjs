/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall, 확인·전이 문제,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index), 출처 표기, 용어 풀이, 권유·단정 말투, 확인일·기준금리 문장, 이례적 값의 자리,
   9·10권(준비 중)과 없는 책 폴더로 가는 링크. index.html이 생기면 화면 쪽 검사를 따로 더한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.MBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['gdp','prices','cycle','policy','fiscal','fx','trade','leading','crisis','final'];
const LABS=['gdp-expenditure','cpi-basket','labor-gap','policy-model','fiscal-mix','fx-won-amount','current-account','lag-correlation','crisis-timeline','release-hypotheses'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1].trim();};
const ask=(id,kind)=>{const m=rows[id]&&rows[id].match(new RegExp(kind+': ([\\s\\S]*?\\?) \\('));return m&&m[1].trim();};
const byId=Object.fromEntries(B.chapters.map(c=>[c.id,c]));
/* 권유·단정 말투: 사고팔라고 하거나 시장 가격의 방향을 하나로 정하는 말. 실험 조작 안내(“~해 보세요”)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리|사세요|파세요|사라|팔라|매수|매도|사 두세요|오를 것|내릴 것|반드시 오른|반드시 내린|싸다|비싸다|저평가|고평가)/;
const RECHECK='기준금리와 통계는 바뀌므로 확인일을 보고 다시 확인하세요';
const DISCLAIMER='가상의 경제와 가상의 발표로 만든 사례이며, 실제 시장 가격의 예측이나 매매 권유가 아닙니다';
const FIXED='+0.25%p는 모형에 넣는 입력 크기이며 10월 22일 결정의 예상이 아닙니다';
const BASE='2026-10-13 확인 기준 연 3.00%(2026-08-27 결정)';
const unquote=s=>s.replace(/“[^”]*”/g,'');
const prose=c=>[c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.quiz),JSON.stringify(c.transfer)].join(' ');

test('ten chapters with stable ids in order, one lab each',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
});
test('chapter titles, parts and times match the approved curriculum in docs/index.html #curriculum (161 minutes)',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum-case"'));
 for(const c of B.chapters)assert.ok(cur.includes(`<td>${c.title}</td>`),c.id+': '+c.title);
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],['경제의 상태를 숫자로 재기','정책이 수요를 바꾸는 과정','나라 밖과의 거래','지표로 가설 세우기','마지막 과제']);
 for(const c of B.chapters)assert.ok(cur.includes(c.group),c.id+' group');
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','14분','14분','18분','14분','16분','14분','16분','16분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),161);assert.match(byId.final.title,/^마지막 과제 · /);
});
test('every chapter has the field set of the series in order, with the right shapes',()=>{
 const KEYS=['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'];
 for(const c of B.chapters){
  assert.deepEqual(Object.keys(c),KEYS,c.id+' field order');for(const k of KEYS.filter(k=>k!=='cross'))assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.equal(new Set(q[1]).size,3,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.length>0&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  for(const [,html] of c.details){assert.equal((html.match(/<table>/g)||[]).length,(html.match(/<\/table>/g)||[]).length,c.id+' table tags');if(html.includes('<table>'))assert.match(html,/<th scope="col">/,c.id+' table headers');}
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');
  assert.ok(c.cross.length>0||c.id==='trade',c.id+' cross (plan #links gives ch7 no outgoing link)');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
 }
});
test('each chapter opens from the previous result and ends on the question the next chapter takes up',()=>{
 for(let i=1;i<B.chapters.length;i++){const c=B.chapters[i];assert.match(c.paragraphs[0],/^[\d·]+장/,c.id+' first sentence names the earlier chapter');}
 const pairs=[['gdp','장바구니','prices'],['prices','일자리','cycle'],['cycle','중앙은행','policy'],['policy','정부가 직접 수요','fiscal'],['fiscal','환율','fx'],['fx','나라 밖과의 거래','trade'],['trade','먼저 움직','leading'],['leading','큰 충격','crisis'],['crisis','예상과 다르게','final']];
 for(const [id,cue] of pairs)assert.ok(byId[id].paragraphs[3].slice(-120).includes(cue),id+' remaining question mentions '+cue);
});
test('recall equals the L1 cell; quiz and transfer questions equal the 확인 and 전이 questions of the design table',()=>{
 for(const c of B.chapters){const l1=cell(c.id);assert.ok(l1,c.id);assert.equal(c.recall,l1,c.id);assert.equal(c.quiz[0],ask(c.id,'확인'),c.id+' quiz');assert.equal(c.transfer[0],ask(c.id,'전이'),c.id+' transfer');}
});
test('every source is opened research with HTTPS, a grade and the check date, and every source is cited',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){
  assert.match(url,/^https:\/\//);assert.ok(research.includes(`href="${url}"`)||research.includes(`href="${url.replace(/&/g,'&amp;')}"`),'not in research: '+url);
  assert.match(note,/\((대학 교재|대학 강좌|공식 원문|학술|2차 자료|보도|중앙은행|은행 연구소 글)[^()]*확인 2026-10-13\)\.?$/,title);
  if(/보도/.test(note.slice(note.lastIndexOf('(')))&&/2026-/.test(title))assert.match(note,/^⏱/,title+' time-sensitive 2026 reports carry ⏱');
 }
 assert.equal(new Set(B.chapters.flatMap(c=>c.source)).size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, and a reason; later volumes are marked 깊이 보기',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'missing book: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
  if(m[1]==='bonds')assert.match(why,/^깊이 보기 \(다음 권\)/,c.id+' vol 3 is the next volume');
  else if(['market','statements','valuation','etf','volatility','tax','allocation'].includes(m[1]))assert.match(why,/^깊이 보기 \(뒤 권\)/,c.id+' later volume '+m[1]);
  else assert.doesNotMatch(why,/깊이 보기/,c.id+' '+m[1]+' is not a later volume');
 }
 const plan={gdp:['../money/#compound','../statements/#income'],prices:['../money/#inflation'],cycle:['../aie-rl/#mdp'],policy:['../money/#discount','../bonds/#transmit','../bonds/#curve'],
  fiscal:['../bonds/#bond','../tax/#map'],fx:['../etf/#assets'],trade:[],leading:['../probability/#correlation','../volatility/#revert'],crisis:['../market/#limits','../volatility/#drawdown'],final:['../bonds/#final','../valuation/#wacc','../allocation/#crisis']};
 for(const c of B.chapters)assert.deepEqual(c.cross.map(x=>x[1]),plan[c.id],c.id+' links follow plan #links');
});
test('vol 9 「자산배분」 is linked from #final (published 2026-10-13); vol 10 is named as text “10권(준비 중)” only; no link to an unpublished folder',()=>{
 const src=read('js/content.js')+read('review.json');
 for(const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g))assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'link to a folder without a book: '+m[1]);
 assert.doesNotMatch(src,/psychology|macro\//);assert.doesNotMatch(src,/9권\(준비 중\)/);assert.match(src,/9권 「자산배분」/);assert.match(src,/10권\(준비 중\)/);
 assert.doesNotMatch(src,/(?<![\d.])10권(?!\(준비 중\))/);
});
test('terms and symbols are explained at first use; fictional people and companies are called 가상 at first mention',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['GDP','국내총생산'],['CPI','소비자물가지수'],['%p','퍼센트포인트'],['디플레이터','가격'],['근원물가','뺀'],['GDP 갭','잠재 GDP'],['금융통화위원회','기준금리'],['3년 국채 금리','3년 뒤 갚기로'],['승수','0.8'],['경상수지','본원소득'],['순환변동치','추세'],['통화스와프','달러']]){
  const first=text.indexOf(sym),near=text.indexOf(expl,Math.max(0,first-200));assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<300,sym+' explained near its first use ('+first+' vs '+near+')');
 }
 const names=B.chapters.map(c=>c.paragraphs.join(' ')).join(' ');
 for(const n of ['하린','새벽전자','온결식품']){const i=names.indexOf(n);assert.ok(i>=0,n);assert.match(names.slice(Math.max(0,i-30),i+40),/가상/,n+' is called 가상 at first mention');}
});
test('no advice or single-direction wording; ch10 carries the disclaimer; ch4 and ch10 the re-check sentence; ch4 the base rate, next decision and fixed sentence',()=>{
 assert.doesNotMatch(unquote(read('js/content.js')),ADVICE);assert.doesNotMatch(unquote(read('review.json')),ADVICE);
 const f=byId.final,p=byId.policy;assert.ok(f.paragraphs.join(' ').includes(DISCLAIMER)&&f.formulaNote.includes(DISCLAIMER),'ch10 disclaimer');
 for(const c of [p,f])assert.ok(JSON.stringify(c).includes(RECHECK),c.id+' re-check');
 assert.ok(JSON.stringify(p).includes(BASE),'ch4 base-rate sentence');assert.match(JSON.stringify(p),/다음 결정은? 2026-10-22/,'ch4 next decision');assert.ok(p.formulaNote.includes(FIXED),'ch4 fixed sentence on the model');
 assert.doesNotMatch(JSON.stringify(f),/어느 (가설|쪽)이 맞|정답은/,'ch10 does not pick a side');assert.match(f.paragraphs.join(' '),/시장 금리\(3년 국채 금리\)/,'G2: (가) names the market rate');
 assert.match(f.paragraphs.join(' '),/명목 이익 경로/,'G2: the nominal-profit path is explained');
 for(const id of ['policy','fiscal','fx','final'])assert.ok(byId[id].formulaNote.includes(M.MODEL.label),id+' model label on the formula note');
});
test('ch4: meeting cycle table (연 8회, 2026 dates), folded MV = PY box that is not tested, lag stated as built in',()=>{
 const p=byId.policy,d=JSON.stringify(p.details);assert.match(d,/연 8회/);for(const day of M.MARKET.policyRate.meetings2026)assert.ok(d.includes(day.replace('-','월 ').replace(/^0/,'').replace(/ 0/,' ')+'일')||d.includes(day),'meeting '+day);
 const mv=p.details.find(x=>/MV = PY/.test(x[0]));assert.ok(mv&&/확인 문제로 묻지 않음/.test(mv[0]),'folded MV = PY box');
 assert.doesNotMatch(JSON.stringify([p.quiz,p.transfer,R.chapters.policy]),/MV|통화량/,'MV = PY is not tested');
 assert.match(p.paragraphs.join(' '),/가정한 시차/);assert.doesNotMatch(JSON.stringify(p),/통화량으로 같은 금리/,'G2: the money-knob step is gone from ch4');
});
test('unusual figures sit only in check boxes labelled with grade and check date, never in quiz or review answers; no rankings',()=>{
 const UNUSUAL=['26.4%','21.9%','56.6%','45.6%','461.1억'];
 for(const c of B.chapters){
  const outside=[c.title,c.subtitle,c.desc,c.recall,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.quiz),JSON.stringify(c.transfer)].join(' ');
  for(const u of UNUSUAL)if(!['gdp','trade'].includes(c.id)||outside.includes(u))assert.ok(!outside.includes(u),c.id+' unusual value outside a box: '+u);
  for(const [head,html] of c.details)if(UNUSUAL.some(u=>html.includes(u)))assert.match(head,/이례적 값 · .*(공식 원문|보도).* · 확인일 2026-10-13/,c.id+' box head: '+head);
 }
 assert.ok(!UNUSUAL.some(u=>JSON.stringify(R).includes(u)),'review does not use unusual values');
 assert.doesNotMatch(read('js/content.js')+read('review.json'),/역대|497\.3|사상 최대|최고치/,'no records or rankings');
});
test('K7: titles, descriptions and lab ids name what is covered; descriptions end with the reader’s action',()=>{
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^하린/,c.id+' desc starts with what the reader does');assert.match(c.desc,/(계산|구하|적|확인|견주|읽|찾|따집|나눕|구별)[^.]*니다\.$/,c.id+' desc ends with the reader’s action');assert.doesNotMatch(c.title,/전달되는 길|울타리|지갑|저울/,c.id);}
 for(const l of LABS)assert.match(l,/^[a-z]+(-[a-z]+)+$/);
});
test('review.json: schema 1, book macro, three questions per chapter, 3–4 choices, answers spread, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'macro');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2||id==='policy'||id==='fiscal',id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
});
test('review answers are the values MMath computes',()=>{
 const ans=(id,i)=>{const q=R.chapters[id][i];return q.choices[q.answer];},pct=(x,d)=>(x*100).toFixed(d);
 assert.equal(ans('gdp',0),`${M.gdp({c:200,i:80,g:70,x:150,m:140}).gdp}조 원`);assert.equal(ans('gdp',1),`약 ${pct(M.realGrowth(0.05,0.03),2)}%`);assert.equal(ans('gdp',2),`약 ${pct(M.annualize(0.015),2)}%`);
 assert.equal(ans('prices',0),M.priceIndex([{name:'가',w:0.7,p0:1,p1:1.02},{name:'나',w:0.3,p0:1,p1:1.10}]).index.toFixed(1));
 assert.equal(ans('cycle',0),`${pct(M.labor({employed:1164,unemployed:36,pop15:2000}).unemployment,1)}%`);assert.match(ans('cycle',1),new RegExp('약 '+pct(M.discourage({employed:1164,unemployed:36,pop15:2000},12).unemployment,2).replace('.','\\.')+'%'));
 assert.equal(M.phase([0.8,0.3,0.1],1).phase,ans('cycle',2));
 const p=M.peaks(M.scenario({rate:{size:0.75,start:1,len:4}},{stage:'policy'}));assert.equal(ans('policy',0),`${p.y.q}분기째 약 −${Math.abs(p.y.value).toFixed(2)}%`);
 const s=M.peaks(M.scenario({spend:{size:-1,start:1,len:4}},{stage:'fiscal'}));assert.match(ans('fiscal',0),new RegExp(`^${s.y.q}분기째 약 −${Math.abs(s.y.value).toFixed(2)}%`));
 assert.equal(ans('fx',0),M.wonText(M.won(800000,1320)));assert.equal(ans('fx',1),`약 ${pct(M.fxMove(1350,1323).wonValue,2)}% 늘었다`);
 assert.equal(ans('trade',0),`+${M.currentAccount({goods:32,services:-5,primary:4,secondary:-2}).ca}억 달러`);
 assert.equal(ans('trade',1),`${M.savingInvestment({c:500,i:200,g:150,x:300,m:260}).gap}조 원`);
 assert.equal(ans('leading',0),`${24-5}개`);assert.equal(ans('crisis',0),`약 ${pct(M.annualize(-0.02),2).replace('-','−')}%`);
 assert.equal(ans('crisis',1),`${M.crisisNumbers().rate2008.toFixed(2).replace('-','−')}%p`);assert.equal(ans('final',0),`${M.surprise(2.6,2.8).toFixed(1).replace('-','−')}%p`);
 assert.equal(ans('final',2),`약 +${M.finalTask().paths.Bhike.pi[7].toFixed(2)}%p`);
});
