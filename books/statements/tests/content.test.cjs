/* content.js와 review.json의 구조 검사: 장 ID·필드·실험 ID, docs/index.html #curriculum의 제목·부·시간, #chapters의 L1과 recall,
   다른 책 링크의 이름과 앵커(data/catalog.json chapter_index), 출처 표기, 권유·판정 말투, 공개된 6권 「기업 가치 평가」로 가는 링크와 없는 책으로 가는 링크.
   index.html이 생기면 routes.test.cjs가 화면 쪽을 맡는다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=JSON.parse(JSON.stringify(ctx.window.SBook)),R=JSON.parse(read('review.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(base,'..','..','data','catalog.json'),'utf8'));
const IDS=['basics','balance','income','cashflow','link','ratios','quality','dart','industry','final'];
const LABS=['accrual-timeline','balance-sheet-tx','income-steps','cfo-bridge','three-statement-link','ratio-table','accrual-alarm','filing-deadline','industry-compare','final-check'];
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
const cell=id=>{const m=rows[id]&&rows[id].match(/<b>L1<\/b> ([\s\S]*?)<br><b>L2<\/b>/);return m&&m[1];};
/* 권유·판정 말투: 주식을 사거나 팔거나 피하라고 하거나 낫다고 하는 말, 회계 부정을 판정하는 말. 실험 조작 안내(“~해 보세요”)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리|사세요|파세요|매수하세요|매도하세요|피하세요|피하라|사 두세요|분식|오를 것|내릴 것)/;
const RECHECK='기준과 공시 규칙은 바뀌므로 한국회계기준원·금융감독원·한국거래소의 공식 자료로 다시 확인하세요';
const DISCLAIMER='가상의 회사로 계산한 사례이며, 특정 주식을 사고팔라는 권유가 아닙니다';

test('ten chapters with stable ids in order, one lab each',()=>{
 assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);
});
test('chapter titles, parts and times match the approved curriculum in docs/index.html #curriculum',()=>{
 const cur=doc.slice(doc.indexOf('id="curriculum"'),doc.indexOf('id="curriculum-map"'));
 for(const c of B.chapters)assert.ok(cur.includes(`<td>${c.title}</td>`),c.id+': '+c.title);
 assert.deepEqual([...new Set(B.chapters.map(c=>c.group))],['세 재무제표 읽기','세 재무제표 맞추기와 비율 점검','공시와 업종','마지막 과제']);
 assert.deepEqual(B.chapters.map(c=>c.time),['14분','14분','14분','16분','20분','18분','16분','14분','14분','25분']);
 assert.equal(B.chapters.reduce((t,c)=>t+parseInt(c.time),0),165);
});
test('every chapter has the etf-book field set with the right shapes',()=>{
 for(const c of B.chapters){
  for(const k of ['id','title','subtitle','desc','time','group','labs','source','recall','paragraphs','formula','formulaNote','flow','details','warning','quiz','transfer','cross'])assert.ok(c[k]!==undefined&&c[k]!=='',c.id+': '+k);
  assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4,c.id);for(const f of c.flow)assert.match(f,/^[^|]+\|[^|]+$/,c.id+' flow '+f);
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}
  assert.ok(Array.isArray(c.details)&&c.details.length>0&&c.details.every(d=>d.length===2&&d[1].startsWith('<')),c.id+' details');
  assert.ok(c.source.length>0&&c.source.every(i=>B.sources[i]),c.id+' sources');assert.ok(c.cross.length>0,c.id+' cross');
  assert.ok(c.paragraphs[3].trim().endsWith('?')||c.id==='final',c.id+': the last paragraph ends with the remaining question');
 }
});
test('each chapter opens from the previous result: desc of the next chapter answers the remaining question',()=>{
 for(let i=1;i<B.chapters.length-1;i++){const c=B.chapters[i];assert.match(c.paragraphs[0],/^[\d·]+장/,c.id+' first sentence names the earlier chapter');}
});
test('chapter recall equals the L1 cell of the design table',()=>{for(const c of B.chapters){const l1=cell(c.id);assert.ok(l1,c.id);assert.equal(c.recall,l1,c.id);}});
test('every source is opened research with HTTPS, a check date and a grade, and every source is cited',()=>{
 const research=read('docs/research.html');
 for(const [title,url,note] of B.sources){assert.match(url,/^https:\/\//);assert.ok(research.includes(`href="${url}"`)||research.includes(`href="${url.replace(/&/g,'&amp;')}"`),'not in research: '+url);assert.match(note,/확인 2026-10-13/,title);assert.match(note,/\((법무법인 안내|국제 기준 공식|공식 문서 사본|회계법인 안내|한국거래소 공식|공식|보도|안내 글|대학 교재|학술 자료|미국 감독기관 원문|법령 사본), 확인 2026-10-13\)/,title);}
 const used=new Set(B.chapters.flatMap(c=>c.source));assert.equal(used.size,B.sources.length,'every source is cited by a chapter');
 assert.equal(new Set(B.sources.map(s=>s[1])).size,B.sources.length,'no duplicate sources');
});
test('cross links use catalog chapter labels, existing anchors and folders, and a reason; later volumes are marked 깊이 보기',()=>{
 const titles=Object.fromEntries(catalog.books.map(b=>[b.url,b.title.split(' · ')[0]]));
 for(const c of B.chapters)for(const [name,url,why] of c.cross){
  const m=url.match(/^\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+)$/);assert.ok(m,url);assert.ok(fs.existsSync(path.join(base,'..',m[1])),'missing book folder: '+m[1]);
  const key=`books/${m[1]}/#${m[2]}`,label=catalog.chapter_index[key];assert.ok(label,'not in chapter_index: '+key);
  assert.equal(name,`${titles['books/'+m[1]+'/']} ${label}`,c.id+' link name');assert.ok(why.length>15,c.id);
  if(['valuation','grid','tax','etf','volatility'].includes(m[1]))assert.match(why,/^깊이 보기 \(뒤 권\)/,c.id+' later volume '+m[1]);
 }
});
test('vol 6 is named by its published title and linked from #ratios and #final; no link to any unpublished folder',()=>{
 const src=read('js/content.js')+read('review.json');assert.doesNotMatch(src,/\.\.\/(?!market|money|bonds|grid|tax|etf|knowledge-graph|probability|valuation)[a-z-]+\//);
 assert.doesNotMatch(src,/6권\(준비 중\)/);assert.match(src,/6권 「기업 가치 평가」/);
 const to6=B.chapters.filter(c=>c.cross.some(x=>x[1].startsWith('../valuation/'))).map(c=>c.id);assert.deepEqual(to6,['ratios','final']);
});
test('terms and symbols are explained at first use; fictional names are called 가상 at first mention',()=>{
 const text=B.chapters.map(c=>[c.subtitle,c.desc,...c.paragraphs,c.formula,c.formulaNote].join(' ')).join(' ');
 for(const [sym,expl] of [['K-IFRS','한국채택국제회계기준'],['CFO','cash flow from operations'],['ROE','자기자본이익률'],['ROA','총자산이익률'],['발생액','순이익에서 영업활동 현금흐름을 뺀 발생액'],['%p','퍼센트포인트'],['DART','전자공시시스템'],['기저율','실제로 문제가 있는 비율'],['매출채권','받을 돈']]){
  const first=text.indexOf(sym),near=text.indexOf(expl);assert.ok(first>=0&&near>=0,sym);assert.ok(Math.abs(near-first)<400||near<first,sym+' explained near its first use');
 }
 const names=B.chapters.map(c=>c.paragraphs.join(' ')).join(' ');for(const n of ['하린','새벽전자']){const i=names.indexOf(n);assert.ok(i>=0,n);assert.match(names.slice(Math.max(0,i-20),i+40),/가상/,n+' is called 가상 at first mention');}
 assert.doesNotMatch(read('js/content.js'),/연결 장부/,'“연결 장부” is confused with consolidated statements');
});
test('no advice or verdict wording; ch7 and ch10 carry the disclaimer; ch8 and ch10 carry the re-check sentence and the check date',()=>{
 assert.doesNotMatch(read('js/content.js'),ADVICE);assert.doesNotMatch(read('review.json'),ADVICE);
 for(const id of ['quality','final']){const c=B.chapters.find(x=>x.id===id);assert.ok((c.paragraphs.join(' ')+c.formulaNote).includes(DISCLAIMER),id);}
 for(const id of ['dart','final']){const c=B.chapters.find(x=>x.id===id);const t=c.paragraphs.join(' ');assert.ok(t.includes(RECHECK),id+' re-check');assert.ok(t.includes('공시 기한·기준은 2026-10-13 확인 기준입니다'),id+' check date');}
});
test('K7: titles, subtitles, descriptions and lab ids name what is covered, without the figurative phrases the plan replaced',()=>{
 const heads=B.chapters.map(c=>[c.title,c.subtitle,c.desc].join(' ')).join(' ');
 for(const w of ['기업의 언어','건강','진단','다리 그림','장부 놀이','이익의 질','~로 전달되는 길','한 바퀴'])assert.ok(!heads.includes(w),'figurative heading: '+w);
 for(const c of B.chapters){assert.doesNotMatch(c.desc,/^하린/,c.id+' desc starts with what the reader does, not the character');}
});
test('review.json: schema 1, book statements, three questions per chapter, 3–4 choices, answers spread, a reason each',()=>{
 assert.equal(R.schema,1);assert.equal(R.book,'statements');assert.deepEqual(Object.keys(R.chapters),IDS);const pos=new Set();
 for(const [id,qs] of Object.entries(R.chapters)){assert.equal(qs.length,3,id);for(const q of qs){assert.ok(q.q.length>10,id);assert.ok(q.choices.length>=3&&q.choices.length<=4,id);assert.equal(new Set(q.choices).size,q.choices.length,id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id);assert.ok(q.why.length>20,id);pos.add(q.answer);}
  assert.ok(new Set(qs.map(q=>q.answer)).size>=2,id+': answers are not all in the same position');}
 assert.deepEqual([...pos].sort(),[0,1,2,3]);
});
