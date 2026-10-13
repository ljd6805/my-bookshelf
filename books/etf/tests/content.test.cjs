/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #chapters의 L1과 recall,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index), 출처 표기, 권유 말투. index.html이 생기면 routes.test.cjs가 화면 쪽을 맡는다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.EBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['index','weight','creation','nav','cost','leverage','assets','tax','choose','final'];
const LABS=['index-level','weighting','creation-unit','gap-lab','tracking-cost','rebalance','underlying','etf-tax-type','compare-table','final-gap'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=(id,k)=>{const m=rows[id]&&rows[id].match(k==='L1'?/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/:/<b>L2<\/b> ([\s\S]*?)<\/td>/);return m&&m[1];};
/* 권유 말투: 상품을 사거나 팔거나 고르라고 하거나 낫다고 하는 말. 실험 조작 안내(“~해 보세요”)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리합니다|유리한|유리해|사세요|파세요|매수하세요|매도하세요|고르세요|사 두세요|오를 것|내릴 것)/;

test('ten chapters with stable ids in order, one lab each',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
});
test('chapter titles and parts match the approved curriculum in docs/index.html #curriculum',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum-map"'));
 for(const c of B.chapters){assert.ok(cur.includes(c.title),c.id+': '+c.title);}
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],['지수 계산','ETF의 구조와 가격','ETF 비교','마지막 과제']);
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','14분','14분','20분','14분','14분','16분','10분','18분','25분']);
});
test('every chapter has the tax-book field set with the right shapes',()=>{
 for(const c of B.chapters){
  for(const k of ['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'])assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');assert.ok(c.cross.length>0,c.id+' cross');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
 }
});
test('chapter recall equals the L1 cell of the design table (6장 keeps the “8권을 먼저 읽었다면” aside in details)',()=>{
 for(const c of B.chapters){const l1=cell(c.id,'L1');assert.ok(l1,c.id);
  if(c.id==='leverage'){const [main,aside]=l1.split('<br>');assert.equal(c.recall,main);assert.ok(c.details.some(d=>d[0]==='8권을 먼저 읽었다면'&&d[1].includes(aside.replace(/^<i>8권을 먼저 읽었다면<\/i>: /,''))));}
  else assert.equal(c.recall,l1,c.id);}
});
test('every source is opened research with HTTPS, a check date and a grade',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){assert.match(url,/^https:\/\//);assert.ok(research.includes(url.replace(/&/g,'&amp;'))||research.includes(url)||research.includes(encodeURI(url)),'not in research: '+url);assert.match(note,/확인 2026-10-13/,title);assert.match(note,/(공식|보도|안내|백과사전|글|연구기관|위험 고지|공지|블로그|투자 정보)/,title);}
 const used=new Set(B.chapters.flatMap(c=>c.source));assert.equal(used.size,B.sources.length,'every source is cited by a chapter');
});
test('cross links use catalog chapter labels, existing anchors and a reason; later volumes are marked 깊이 보기',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];
  assert.ok(label,'not in chapter_index: '+key);assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
 }
 const why=(id,url)=>B.chapters.find(c=>c.id===id).cross.find(x=>x[1]===url)[2];
 assert.match(why('leverage','../volatility/#drag'),/^깊이 보기 \(뒤 권\)/);assert.match(why('tax','../tax/#etf'),/^깊이 보기 \(뒤 권\)/);
});
test('symbols are explained at first use',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['NAV','순자산가치'],['iNAV','장중 추정 순자산가치'],['괴리율','괴리율은 ETF 시장가가 NAV에서'],['TER','합성총보수'],['AP','지정참가회사'],['LP','유동성공급자'],['%p','퍼센트포인트'],['σ','표준편차'],['CU','설정단위']]){
  const first=text.indexOf(sym),near=text.indexOf(expl);assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<400||near<first,sym+' explained near its first use');
 }
 const names=B.chapters.map(c=>c.paragraphs.join(' ')).join(' ');for(const n of ['하린','새벽전자','가람200','누리 국채3년','먼바다500','누리 해외100','누리200 2배','C사']){const i=names.indexOf(n);assert.ok(i>=0,n);assert.match(names.slice(Math.max(0,i-30),i+200),/가상/,n+' is called 가상 at first mention');}
});
test('no advice wording in content or review; ch9 and ch10 carry the disclaimer',()=>{
 assert.doesNotMatch(read('js/content.js'),ADVICE);assert.doesNotMatch(read('review.json'),ADVICE);
 for(const id of ['choose','final']){const c=B.chapters.find(x=>x.id===id);assert.match(c.paragraphs[0]+c.formulaNote,/가상의 ETF로 계산한 사례이며, (고르거나 )?사고팔 시점을 권하는 것이 아닙니다/,id);}
 const nav=B.chapters.find(c=>c.id==='nav');assert.match(JSON.stringify(nav.details),/괴리율 기준과 LP 의무는 2026-10-13 보도·안내 기준입니다\. 규칙은 바뀌므로 거래 전 한국거래소 공시와 투자설명서로 확인하세요/);
});
test('review.json: schema 1, book etf, three questions per chapter, 3–4 choices, answers spread, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'etf');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);}}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
});
