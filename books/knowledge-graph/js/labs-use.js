/* 6~9장 실험: 패턴 질의, 트리플 추출, TransE, GraphRAG. 계산은 graph.js가 맡는다. */
(()=>{
const U=KGUI,G=KGGraph,L=KGLabs;
const predOptions=Object.keys(G.predicates).map(p=>[p,G.predicates[p]]);
const reasoned=()=>G.infer(G.triples.concat(G.extra),['spouse','parent','located'],10).all;
L.query=el=>{
 const objects=[['?y','?y (빈칸)'],...Object.keys(G.entities).map(id=>[id,G.entities[id].label])];
 U.setup(el,U.select('p1','패턴 1 관계 (?x 관계 목적어)',predOptions,'discovered')+U.select('o1','패턴 1 목적어',objects,'polonium')+U.select('p2','패턴 2 관계 (?x 관계 ?z)',[['none','패턴 2 없음'],...predOptions],'spouse')+U.select('reason','그래프',[['no','적힌 사실만'],['yes','추론 포함(5장 세 규칙)']],'no'));
 U.bind(el,()=>{
  const p1=U.pick(el,'p1'),o1=U.pick(el,'o1'),p2=U.pick(el,'p2'),list=U.pick(el,'reason')==='yes'?reasoned():G.triples;
  const patterns=[['?x',p1,o1]];if(p2!=='none')patterns.push(['?x',p2,'?z']);
  const rows=G.match(list,patterns),vars=[...new Set(patterns.flat().filter(v=>v.startsWith('?')))];
  const term=v=>v.startsWith('?')?v:':'+v;
  el.querySelector('.chart').innerHTML=`<pre class="sparql">SELECT ${vars.join(' ')} WHERE {\n${patterns.map(p=>'  '+p.map(term).join(' ')).join(' .\n')}\n}</pre><table class="bindings"><thead><tr>${vars.map(v=>`<th>${v}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${vars.map(v=>`<td>${U.label(r[v])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${vars.length}">맞는 값이 없습니다</td></tr>`}</tbody></table>`;
  el.querySelector('.readout').innerHTML=`그래프 사실 ${list.length}개에서 패턴 ${patterns.length}줄에 맞는 답 <b>${rows.length}</b>개${rows.length?': '+rows.map(r=>vars.map(v=>U.label(r[v])).join('·')).join(', '):''}<br>${rows.length?'같은 변수(?x)는 모든 줄에서 같은 값이어야 하므로 줄을 더할수록 답은 줄거나 그대로입니다.':'답이 없다고 거짓은 아닙니다. 방향을 바꾸거나 추론을 포함해 보세요.'}`;
 });
};
const candidates=[
 ['퀴리 부부는 1898년에 라듐을 발견했다.',['marie','discovered','radium'],.92,true],['퀴리 부부는 1898년에 라듐을 발견했다.',['pierre','discovered','radium'],.88,true],
 ['마리 퀴리는 1911년 노벨 화학상을 받았다.',['marie','awarded','nobel1911'],.95,true],['베크렐은 퀴리 부부와 1903년 물리학상을 나눠 받았다.',['becquerel','awarded','nobel1903'],.81,true],
 ['베크렐은 퀴리 부부와 1903년 물리학상을 나눠 받았다.',['becquerel','spouse','marie'],.62,false],['이렌은 파리에서 태어났다.',['irene','bornIn','paris'],.74,true],
 ['이렌은 프레데리크 졸리오와 결혼했다.',['irene','spouse','frederic'],.48,true],['폴로늄은 마리의 조국 폴란드에서 이름을 땄다.',['polonium','namedAfter','poland'],.58,true],
 ['폴로늄은 마리의 조국 폴란드에서 이름을 땄다.',['polonium','discovered','marie'],.45,false],['피에르 퀴리는 파리에서 태어나 그곳에서 연구했다.',['pierre','bornIn','paris'],.70,true],
 ['마리는 1911년에 화학상을 받았고, 피에르는 1906년에 세상을 떠났다.',['pierre','awarded','nobel1911'],.41,false],['이렌과 프레데리크는 1935년 화학상을 함께 받았다.',['frederic','awarded','nobel1935'],.66,true],
 ['이렌과 프레데리크는 1935년 화학상을 함께 받았다.',['irene','childOf','frederic'],.29,false]
].map(([text,triple,score,gold])=>({text,triple,score,gold}));
L.extract=el=>{
 U.setup(el,U.range('cut','확신도 문턱',0,1,.01,.6));
 U.bind(el,()=>{
  const t=U.value(el,'cut'),r=G.prf(candidates,t),rows=[...candidates].sort((a,b)=>b.score-a.score);
  el.querySelector('.chart').innerHTML=`<ul class="candidates">${rows.map(c=>{const kept=c.score>=t,state=kept?(c.gold?'tp':'fp'):(c.gold?'fn':'tn'),word={tp:'넣음 · 맞음',fp:'넣음 · 틀림',fn:'뺌 · 놓침',tn:'뺌 · 틀린 후보'}[state];return `<li class="${state}"><span class="score">${c.score.toFixed(2)}</span><span><b>${U.fact(c.triple)}</b><small>${U.esc(c.text)}</small></span><em>${word}</em></li>`;}).join('')}</ul>`;
  el.querySelector('.readout').innerHTML=`문턱 ${t.toFixed(2)} 이상 <b>${r.kept}</b>개를 넣음 · 맞음(TP) ${r.tp} · 틀림(FP) ${r.fp} · 놓침(FN) ${r.fn}<br>정밀도 <b>${U.pct(r.precision)}</b> · 재현율 <b>${U.pct(r.recall)}</b> · F1 <b>${U.fmt(r.f1,3)}</b>${r.precision===null?' · 넣은 후보가 없어 정밀도를 정의할 수 없습니다.':''}`;
 });
};
const cities={warsaw:['바르샤바',[1,.6]],paris:['파리',[-.6,.4]],berlin:['베를린',[.4,1]],rome:['로마',[.2,-.6]],madrid:['마드리드',[-1.2,-.4]]};
const countries={poland:['폴란드',[2.55,1.75]],france:['프랑스',[.95,1.65]],germany:['독일',[1.85,2.3]],italy:['이탈리아',[1.75,.55]],spain:['스페인',[.35,.75]]};
const answer={warsaw:'poland',paris:'france',berlin:'germany',rome:'italy',madrid:'spain'},train=['warsaw','paris','berlin','rome'];
L.transe=el=>{
 U.setup(el,U.range('rx','관계 화살표 r의 가로',-1,3,.05,0)+U.range('ry','관계 화살표 r의 세로',-1,3,.05,0)+U.select('head','머리 도시 h',Object.keys(cities).map(k=>[k,cities[k][0]+(train.includes(k)?' (학습 쌍)':' (처음 보는 쌍)')]),'warsaw'));
 U.bind(el,()=>{
  const r=[U.value(el,'rx'),U.value(el,'ry')],h=U.pick(el,'head'),cand=Object.fromEntries(Object.entries(countries).map(([k,v])=>[k,v[1]]));
  const rank=G.transe(cities[h][1],r,cand),pos=rank.findIndex(x=>x.id===answer[h])+1,end=[cities[h][1][0]+r[0],cities[h][1][1]+r[1]];
  const errs=train.map(c=>Math.hypot(cities[c][1][0]+r[0]-countries[answer[c]][1][0],cities[c][1][1]+r[1]-countries[answer[c]][1][1]));
  const hits=train.filter(c=>G.transe(cities[c][1],r,cand)[0].id===answer[c]).length,best=G.meanOffset(train.map(c=>[cities[c][1],countries[answer[c]][1]]));
  const points=[...Object.values(cities).map(([n,p])=>({at:p,text:n,color:'var(--blue)',r:4})),...Object.values(countries).map(([n,p])=>({at:p,text:n,color:'var(--accent)',r:4})),{at:end,color:'var(--orange)',r:6}];
  el.querySelector('.chart').innerHTML=U.plot({points,arrows:[{from:cities[h][1],to:end,color:'var(--orange)',width:2.5}],xmin:-1.5,xmax:3,ymin:-1,ymax:2.5,xlabel:'좌표 1',ylabel:'좌표 2'});
  el.querySelector('.readout').innerHTML=`r = (${U.fmt(r[0])}, ${U.fmt(r[1])}) · 학습 쌍 네 개의 평균 거리 <b>${U.fmt(errs.reduce((a,b)=>a+b)/4)}</b> · 1위로 맞힌 쌍 <b>${hits}/4</b><br>${cities[h][0]} + r에 가장 가까운 나라: <b>${countries[rank[0].id][0]}</b> (거리 ${U.fmt(rank[0].d)}). 정답 ${countries[answer[h]][0]}의 순위는 <b>${pos}위</b>입니다.<br>거리 제곱합을 가장 작게 만드는 r̂ = (${U.fmt(best[0])}, ${U.fmt(best[1])})`;
 });
};
const doc=[['marie','bornIn','warsaw','마리 퀴리는 바르샤바에서 태어났다.'],['warsaw','locatedIn','poland','바르샤바는 폴란드에 있다.'],['marie','spouse','pierre','마리 퀴리는 피에르 퀴리와 결혼했다.'],['marie','workedIn','paris','마리 퀴리는 파리에서 연구했다.'],['marie','discovered','polonium','마리 퀴리는 폴로늄을 발견했다.'],['polonium','namedAfter','poland','폴로늄이라는 이름은 폴란드에서 따왔다.'],['marie','discovered','radium','마리 퀴리는 라듐을 발견했다.'],['marie','awarded','nobel1903','마리 퀴리는 1903년 노벨 물리학상을 받았다.'],['marie','awarded','nobel1911','마리 퀴리는 1911년 노벨 화학상을 받았다.'],['pierre','bornIn','paris','피에르 퀴리는 파리에서 태어났다.'],['paris','locatedIn','france','파리는 프랑스에 있다.'],['pierre','discovered','polonium','피에르 퀴리도 폴로늄 발견에 참여했다.'],['pierre','discovered','radium','피에르 퀴리는 라듐을 함께 발견했다.'],['pierre','awarded','nobel1903','피에르 퀴리는 1903년 노벨 물리학상을 받았다.'],['becquerel','awarded','nobel1903','앙리 베크렐은 1903년 노벨 물리학상을 받았다.'],['irene','childOf','marie','이렌은 마리 퀴리의 딸이다.'],['irene','childOf','pierre','이렌은 피에르 퀴리의 딸이다.'],['irene','bornIn','paris','이렌은 파리에서 태어났다.'],['irene','spouse','frederic','이렌은 프레데리크 졸리오와 결혼했다.'],['irene','awarded','nobel1935','이렌 졸리오퀴리는 1935년 노벨 화학상을 받았다.'],['frederic','awarded','nobel1935','프레데리크 졸리오는 1935년 노벨 화학상을 받았다.']].map(([s,p,o,text])=>({t:[s,p,o],text}));
const words=['폴로늄','발견','딸','상'],asked=['discovered','childOf','awarded'];
function retrieve(k,hops,limit){
 const text=G.keywordRank(doc,words).slice(0,k).map(c=>c.t);
 const graph=G.reach(limit?G.triples.filter(t=>asked.includes(t[1])):G.triples,'polonium',hops).used;
 return {text,graph,textChain:G.chainComplete(text),graphChain:G.chainComplete(graph)};
}
L.graphrag=el=>{
 U.setup(el,U.range('k','문장 검색 개수 k',1,21,1,3)+U.range('ghops','그래프 걸음 수',0,4,1,2)+U.select('limit','그래프에서 따라갈 관계',[['all','모든 관계'],['asked','질문의 관계만(발견·자녀·수상)']],'all'));
 U.bind(el,()=>{
  const r=retrieve(U.value(el,'k'),U.value(el,'ghops'),U.pick(el,'limit')==='asked');
  const verdict=rows=>rows.length?`<b class="pass">✓ 사슬 완성</b> ${U.label(rows[0]['?x'])} → ${U.label(rows[0]['?y'])} → <b>${U.label(rows[0]['?z'])}</b>`:'<b class="fail">✗ 사슬 끊김</b>';
  const list=items=>`<ol class="context">${items.map(t=>`<li>${U.fact(t)}</li>`).join('')||'<li>문맥이 비어 있습니다.</li>'}</ol>`;
  el.querySelector('.chart').innerHTML=`<div class="compare"><section><h4>문장 검색 · ${r.text.length}개</h4>${verdict(r.textChain)}${list(r.text)}</section><section><h4>그래프 걷기 · ${r.graph.length}개</h4>${verdict(r.graphChain)}${list(r.graph)}</section></div>`;
  const answer=x=>x.length?U.label(x[0]['?z']):'답할 근거 부족';
  el.querySelector('.readout').innerHTML=`질문: 폴로늄을 발견한 사람의 딸은 어떤 상을 받았나?<br>문장 검색(질문 낱말 ${words.join('·')} 겹침 순): 문맥 ${r.text.length}개 → <b>${answer(r.textChain)}</b><br>그래프 걷기(폴로늄에서 출발): 문맥 ${r.graph.length}개 → <b>${answer(r.graphChain)}</b>`;
 });
};
KGLabs._data={candidates,cities,countries,doc,retrieve};
})();
