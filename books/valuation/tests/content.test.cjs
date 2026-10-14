/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index), 출처 표기, 용어 풀이, 권유·판정 말투, 확인일 문장,
   9·10권 링크와 없는 책 폴더로 가는 링크. index.html이 생기면 routes.test.cjs가 화면 쪽을 맡는다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.VBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['price','per','dividend','ev','fcf','wacc','terminal','sensitivity','implied','final'];
const LABS=['price-basics','multiple-compare','dividend-yield','ev-bridge','fcff-forecast','wacc-build','terminal-steps','dcf-sensitivity','implied-assumption','analyst-gap'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1].trim();};
/* 권유 말투: 주식을 사거나 팔라고 하거나 목표주가를 내는 말. 실험 조작 안내(“~해 보세요”)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리|사세요|파세요|매수하세요|매도하세요|사 두세요|목표주가를 제시|목표주가는 \d|오를 것입니다|내릴 것입니다)/;
/* 판정 말투: 결과를 “싸다·비싸다·저평가·고평가”로 말하는 것. 오해를 인용한 따옴표 안(“…”)에서만 쓸 수 있다. */
const VERDICT=/(싸다|비싸다|저평가|고평가|싼 주식|비싼 주식)/;
const RECHECK='금리와 위험 프리미엄은 바뀌므로 확인일을 보고 다시 확인하세요';
const DISCLAIMER='가상의 회사와 가상의 분석가로 계산한 사례이며, 특정 주식을 사고팔라는 권유가 아닙니다';
const unquote=s=>s.replace(/“[^”]*”/g,'');

test('ten chapters with stable ids in order, one lab each',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
});
test('chapter titles, parts and times match the approved curriculum in docs/index.html #curriculum',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum-map"'));
 for(const c of B.chapters)assert.ok(cur.includes(`<td>${c.title.replace(/</g,'&lt;')}</td>`),c.id+': '+c.title);
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],['배수로 비교 회사와 견주기','현금흐름을 할인해 주당 가치 계산하기','가정이 바뀔 때 결론이 움직이는 폭 재기','마지막 과제']);
 for(const c of B.chapters)assert.ok(cur.includes(`<td>${c.group}</td>`),c.id+' group');
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','16분','14분','14분','18분','16분','16분','20분','16분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),169);
 assert.equal(B.chapters[9].title,'마지막 과제 · 같은 회사의 주당 가치가 두 배 차이 나는 이유를 가정·숫자·평가 시점으로 나눠 설명하기');
});
test('every chapter has the statements-book field set with the right shapes',()=>{
 for(const c of B.chapters){
  for(const k of ['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'])assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.deepEqual(Object.keys(c),['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'],c.id+' field order');
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.equal(new Set(q[1]).size,3,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.length>0&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  for(const [,html] of c.details){assert.equal((html.match(/<table>/g)||[]).length,(html.match(/<\/table>/g)||[]).length,c.id+' table tags');if(html.includes('<table>'))assert.match(html,/<th scope="col">/,c.id+' table headers');}
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');assert.ok(c.cross.length>0,c.id+' cross');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
 }
});
test('each chapter opens from the previous result and ends on the question the next chapter takes up',()=>{
 for(let i=1;i<B.chapters.length-1;i++){const c=B.chapters[i];assert.match(c.paragraphs[0],/^[\d·]+장/,c.id+' first sentence names the earlier chapter');}
 const pairs=[['price','EPS 1,648원, BPS 9,008원과 견주는 숫자','per'],['per','수익률','dividend'],['dividend','빚과 현금','ev'],['ev','앞으로 낼 현금','fcf'],['fcf','8.3%','wacc'],['wacc','2030년 뒤','terminal'],['terminal','가정 하나만 바꿔','sensitivity'],['sensitivity','주가 20,000원에는 어떤 가정','implied'],['implied','두 배 다르게','final']];
 const desc=Object.fromEntries(B.chapters.map(c=>[c.id,c]));
 for(const [id,cue] of pairs)assert.ok(desc[id].paragraphs[3].slice(-120).includes(cue),id+' remaining question mentions '+cue);
});
test('chapter recall equals the L1 cell of the design table',()=>{for(const c of B.chapters){const l1=cell(c.id);assert.ok(l1,c.id);assert.equal(c.recall,l1,c.id);}});
test('every source is opened research with HTTPS, a check date and a grade, and every source is cited',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){
  assert.match(url,/^https:\/\//);assert.ok(research.includes(`href="${url}"`)||research.includes(`href="${url.replace(/&/g,'&amp;')}"`),'not in research: '+url);
  assert.match(note,/\((대학 교재|감독기관 투자자 안내|학술 원문|2차 자료|전문 기관 원문|대학 강좌|보도)[^()]*확인 2026-10-13\)\.?$/,title);
  if(/보도|교수 추정치/.test(note))assert.match(note,/^⏱/,title+' time-sensitive sources carry ⏱');
 }
 const used=new Set(B.chapters.flatMap(c=>c.source));assert.equal(used.size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, and a reason; later volumes are marked 깊이 보기',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'missing book: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
  if(['etf','volatility','tax','grid','allocation','psychology'].includes(m[1]))assert.match(why,/^깊이 보기 \(뒤 권\)/,c.id+' later volume '+m[1]);
  else assert.doesNotMatch(why,/깊이 보기/,c.id+' '+m[1]+' is not a later volume');
 }
 const targets=B.chapters.flatMap(c=>c.cross.map(x=>x[1]));
 for(const t of ['../market/#map','../etf/#weight','../statements/#ratios','../bonds/#equity','../market/#events','../tax/#dividend','../statements/#balance','../statements/#cashflow','../money/#npv','../bonds/#credit','../volatility/#measure','../probability/#interval','../statements/#final','../psychology/#confirm'])assert.ok(targets.includes(t),'planned link '+t);
 assert.ok(!targets.some(t=>t.startsWith('../grid/')),'vol 12 is not linked (plan #links)');
});
test('vol 9 「자산배분」 is linked (#beta, published 2026-10-13); vol 10 「행동재무학」 is linked (#final → #confirm, published 2026-10-14); no link to an unpublished folder',()=>{
 const src=read('js/content.js')+read('review.json');
 for(const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g))assert.ok(fs.existsSync(path.join(base,'..',m[1],'index.html')),'link to a folder without a book: '+m[1]);
 assert.doesNotMatch(src,/macro|valuation\//);assert.doesNotMatch(src,/(9|10)권\(준비 중\)/);assert.match(src,/9권 「자산배분」/);assert.match(src,/10권 「행동재무학」/);
 assert.ok(B.chapters.find(c=>c.id==='wacc').cross.some(x=>x[1]==='../allocation/#beta'),'#wacc links vol 9 #beta');
 assert.ok(B.chapters.find(c=>c.id==='final').cross.some(x=>x[1]==='../psychology/#confirm'),'#final links vol 10 #confirm');
});
test('terms and symbols are explained at first use; fictional names are called 가상 at first mention',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['PER','주가수익비율'],['DCF','현금흐름 할인'],['EPS','주당순이익'],['BPS','주당순자산'],['PBR','주가순자산비율'],['ROE','자기자본이익률'],['%p','퍼센트포인트'],['EV','기업가치'],['EBITDA','이자·세금·감가상각'],['K-IFRS','한국채택국제회계기준'],['FCFF','기업 잉여현금흐름'],['WACC','가중평균자본비용'],['CAPM','자본자산가격결정모형'],['β','베타'],['IRR','내부수익률'],[' r ','할인율'],[' g ','성장률']]){
  const first=text.indexOf(sym),near=text.indexOf(expl,Math.max(0,first-200));assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<200,sym+' explained near its first use ('+first+' vs '+near+')');
 }
 const names=B.chapters.map(c=>c.paragraphs.join(' ')).join(' ');
 for(const n of ['하린','새벽전자','분석가']){const i=names.indexOf(n);assert.ok(i>=0,n);assert.match(names.slice(Math.max(0,i-20),i+40),/가상/,n+' is called 가상 at first mention');}
 const per=B.chapters[1].paragraphs.join(' ');assert.match(per.slice(0,per.indexOf('가·나·다·라')+20),/가상/,'비교 회사 is called 가상');
});
test('no advice wording; verdicts only inside quoted misconceptions; ch8–10 carry the disclaimer; ch6 and ch10 carry the re-check sentence and dates',()=>{
 assert.doesNotMatch(read('js/content.js'),ADVICE);assert.doesNotMatch(read('review.json'),ADVICE);
 for(const c of B.chapters)for(const t of [c.title,c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote,...c.flow,c.warning,JSON.stringify(c.details),JSON.stringify(c.quiz),JSON.stringify(c.transfer)])assert.doesNotMatch(unquote(t),VERDICT,c.id+': '+t.slice(0,60));
 assert.doesNotMatch(unquote(JSON.stringify(R)),VERDICT);
 for(const id of ['sensitivity','implied','final']){const c=B.chapters.find(x=>x.id===id);assert.ok(c.paragraphs.join(' ').includes(DISCLAIMER)&&c.formulaNote.includes(DISCLAIMER),id);}
 for(const id of ['wacc','final']){const c=B.chapters.find(x=>x.id===id);assert.ok(c.paragraphs.join(' ').includes(RECHECK),id+' re-check');}
 const w=B.chapters.find(x=>x.id==='wacc');assert.ok(w.formulaNote.includes('확인일 2026-10-08')&&w.formulaNote.includes(RECHECK),'ch6 check-date tag');assert.match(w.paragraphs[1],/4월의 국고채 금리를 넣어야/);
 const f=B.chapters.find(x=>x.id==='final');assert.match(f.paragraphs.join(' '),/2026-10-13 확인 기준/);assert.match(f.paragraphs[0],/확인하지 못했/,'target-price horizon stays hedged');
 assert.doesNotMatch(f.paragraphs.join(' '),/어느 (값|쪽)이 맞|정답은 \d/,'ch10 explains the gap and does not pick a side');
});
test('L2 stays out of the prose: ch10 prose does not compute the discount-rate-first step; ch8 tables have no working-capital axis',()=>{
 const f=B.chapters.find(x=>x.id==='final');assert.doesNotMatch(JSON.stringify(f),/할인율부터 바꾸면 \d|할인율만 8\.0%로/);
 const s=B.chapters.find(x=>x.id==='sensitivity');assert.equal(s.details.filter(d=>/운전자본/.test(d[0])).length,0);
});
test('K7: titles, subtitles, descriptions and lab ids name what is covered, without the figurative phrases the plan replaced',()=>{
 const heads=B.chapters.map(c=>[c.title,c.subtitle,c.desc].join(' ')).join(' ');
 for(const w of ['뼈대','함정','민감도 판','어디서 오나','값 매기기','가정이 결론을 바꾼다','가격과 가치'+' ','목표주가'])assert.ok(!heads.includes(w),'figurative or replaced heading: '+w);
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^하린/,c.id+' desc starts with what the reader does, not the character');assert.match(c.desc,/(계산|구하|적|확인|견주|읽|찾|따집)[^.]*니다\.$/,c.id+' desc ends with the reader’s action');}
 for(const l of LABS)assert.match(l,/^[a-z]+(-[a-z]+)+$/);
});
test('review.json: schema 1, book valuation, three questions per chapter, 3–4 choices, answers spread, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'valuation');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2,id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
});
