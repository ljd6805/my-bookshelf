/* 1~5장 실험: 트리플 쌓기, 걸음, 개체 해소, 온톨로지 검사, 추론. 계산은 graph.js가 맡는다. */
(()=>{
const U=KGUI,G=KGGraph,L=KGLabs;
const entityOptions=Object.keys(G.entities).map(id=>[id,G.entities[id].label]);
L.triples=el=>{
 U.setup(el,U.range('facts','더한 문장 수',0,G.triples.length,1,5));
 U.bind(el,()=>{
  const n=U.value(el,'facts'),list=G.triples.slice(0,n),s=G.stats(list),last=list[n-1],prev=G.stats(G.triples.slice(0,Math.max(0,n-1)));
  el.querySelector('.chart').innerHTML=list.length?U.graph(list,{edges:last?[last]:[],names:true,title:`문장 ${n}개로 만든 그래프`}):U.svg('<text x="240" y="140" text-anchor="middle">아직 문장이 없습니다. 슬라이더를 오른쪽으로 옮겨 보세요.</text>','빈 그래프');
  const change=!last?'':s.components<prev.components?' 이번 문장이 떨어져 있던 두 덩어리를 이었습니다.':s.nodes===prev.nodes?' 이번 문장은 새 점 없이 간선만 더했습니다.':'';
  el.querySelector('.readout').innerHTML=`점 <b>${s.nodes}</b>개 · 사실(간선) <b>${s.edges}</b>개 · 떨어진 덩어리 <b>${s.components}</b>개<br>${last?`마지막 문장: <b>${U.fact(last)}</b>.${change}`:'문장을 더하면 점과 간선이 생깁니다.'}${s.top?`<br>가장 많이 연결된 점: ${U.label(s.top)} (${s.degree[s.top]}개)`:''}`;
 });
};
L.walk=el=>{
 U.setup(el,U.select('start','출발점',entityOptions,'polonium')+U.range('hops','걸음 수(홉)',0,4,1,1)+U.select('target','찾을 점',entityOptions,'nobel1935'));
 U.bind(el,()=>{
  const start=U.pick(el,'start'),hops=U.value(el,'hops'),target=U.pick(el,'target'),r=G.reach(G.triples,start,hops),route=G.path(G.triples,start,target);
  const reached=route&&r.dist[target]!==undefined,on=new Set(Object.keys(r.dist));
  el.querySelector('.chart').innerHTML=U.graph(G.triples,{on,edges:reached?route:r.used,names:reached,title:`${U.label(start)}에서 ${hops}걸음 안에 닿는 점`});
  const steps=route?route.map(U.fact).join('<br>'):'';
  el.querySelector('.readout').innerHTML=`${U.label(start)}에서 ${hops}걸음 안에 닿는 점 <b>${r.count}</b>개 (전체 ${Object.keys(G.entities).length-1}개 중) · 함께 따라온 사실 <b>${r.used.length}</b>개<br>${start===target?'출발점과 찾을 점이 같습니다.':route?`${U.label(target)}까지 가장 짧은 길은 <b>${route.length}걸음</b>입니다. ${reached?'지금 걸음 수로 닿습니다.':`지금 걸음 수로는 ${route.length-hops}걸음이 모자랍니다.`}<br>${reached?steps:''}`:'두 점 사이에 길이 없습니다.'}`;
 });
};
const names=[{name:'마리 퀴리',id:'marie'},{name:'Marie Curie',id:'marie'},{name:'M. Curie',id:'marie'},{name:'마리 스크워도프스카 퀴리',id:'marie'},{name:'피에르 퀴리',id:'pierre'},{name:'Pierre Curie',id:'pierre'},{name:'P. Curie',id:'pierre'},{name:'이렌 졸리오퀴리',id:'irene'},{name:'Irène Joliot-Curie',id:'irene'}];
L.resolve=el=>{
 U.setup(el,U.range('threshold','같다고 볼 문턱 J',.1,.9,.05,.5)+U.select('method','묶는 기준',[['name','이름의 글자 조각'],['id','식별자(ID) 표']],'name'));
 U.bind(el,()=>{
  const t=U.value(el,'threshold'),useId=U.pick(el,'method')==='id',r=G.resolve(names,t,useId);
  el.querySelector('#threshold').disabled=useId;
  el.querySelector('.chart').innerHTML=`<div class="clusters">${r.clusters.map((c,i)=>{const mixed=new Set(c.map(n=>n.id)).size>1;return `<div class="cluster${mixed?' bad':''}"><b>${mixed?'⚠ 섞임':'묶음'} ${i+1}</b>${c.map(n=>`<span class="chip" data-id="${n.id}">${U.esc(n.name)}<small>${n.id}</small></span>`).join('')}</div>`;}).join('')}</div>`;
  const pairs=[['마리 퀴리','피에르 퀴리'],['Marie Curie','Pierre Curie'],['Marie Curie','M. Curie'],['마리 퀴리','Marie Curie']];
  el.querySelector('.readout').innerHTML=`묶음 <b>${r.clusters.length}</b>개 (실제 인물 ${r.ideal}명) · 다른 사람이 섞인 묶음 <b>${r.wrong}</b>개 · 여러 묶음으로 갈라진 인물 <b>${r.missed}</b>명<br>${useId?'식별자 표로 묶으면 글자 체계와 상관없이 정확히 세 사람이 됩니다.':'글자 조각 겹침 J: '+pairs.map(([a,b])=>`${a}–${b} ${U.fmt(G.jaccard(a,b))}`).join(' · ')}`;
 });
};
const typeName={Thing:'사물',Agent:'행위자',Person:'사람',Scientist:'과학자',Place:'장소',City:'도시',Country:'나라',Region:'지역',Substance:'물질',Element:'원소',Award:'상',NobelPrize:'노벨상'};
L.schema=el=>{
 U.setup(el,U.select('subject','주어',entityOptions,'marie')+U.select('predicate','관계',Object.keys(G.schema).filter(p=>p!=='parentOf').map(p=>[p,G.predicates[p]]),'awarded')+U.select('object','목적어',entityOptions,'nobel1911')+U.select('mode','규칙을 쓰는 방식',[['validate','검사(SHACL처럼 위반 보고)'],['rdfs','RDFS(타입을 추론)']],'validate'));
 U.bind(el,()=>{
  const s=U.pick(el,'subject'),p=U.pick(el,'predicate'),o=U.pick(el,'object'),mode=U.pick(el,'mode'),r=G.check(s,p,o,mode);
  const chain=id=>G.typesOf(id).map(c=>typeName[c]).join(' ⊑ ');
  const mark=(ok,need,id)=>`<div class="type-row ${ok?'ok':'bad'}"><b>${ok?'✓':'✗'} ${U.label(id)}</b><span>${chain(id)}</span><small>필요한 종류: ${typeName[need]}</small></div>`;
  el.querySelector('.chart').innerHTML=`<div class="triple-card"><div class="triple-line">${U.label(s)} <span>—${G.predicates[p]}→</span> ${U.label(o)}</div>${mark(r.okS,r.domain,s)}${mark(r.okO,r.range,o)}</div>`;
  const ok=r.okS&&r.okO;
  const wrong=[!r.okS?`주어 ${U.jo(U.label(s),'은','는')} ${typeName[r.domain]}의 하위 종류가 아닙니다.`:'',!r.okO?`목적어 ${U.jo(U.label(o),'은','는')} ${typeName[r.range]}의 하위 종류가 아닙니다.`:''].join(' ');
  const concl=r.inferred.map(x=>{const [id,,c]=x.split(' ');return `${U.jo(U.label(id),'은','는')} ‘${U.jo(typeName[c],'’이라고','’라고')}`;}).join(', ');
  el.querySelector('.readout').innerHTML=`관계 “${G.predicates[p]}”의 규칙: 주어는 <b>${typeName[r.domain]}</b>, 목적어는 <b>${typeName[r.range]}</b>.<br>${ok?'<b>통과</b>: 주어와 목적어 모두 규칙에 맞습니다.':mode==='validate'?`<b>위반</b>: ${wrong}`:`<b>결론</b>: RDFS는 거부하지 않고 ${concl} 결론을 냅니다.`}`;
 });
};
const ruleSets={none:[],spouse:['spouse'],parent:['parent'],located:['located'],all:['spouse','parent','located']};
L.infer=el=>{
 U.setup(el,U.select('rules','켤 규칙',[['none','규칙 없음'],['spouse','배우자는 대칭'],['parent','자녀의 반대는 부모'],['located','위치는 이어진다'],['all','세 규칙 모두']],'located')+U.range('rounds','적용 라운드',0,4,1,1));
 U.bind(el,()=>{
  const base=G.triples.concat(G.extra),ids=ruleSets[U.pick(el,'rules')],rounds=U.value(el,'rounds'),r=G.infer(base,ids,rounds),fresh=r.log.flat().map(a=>a.t);
  const show=ids.includes('located')?['marie','warsaw','poland','europe','pierre','paris','france','irene']:null;
  el.querySelector('.chart').innerHTML=`${U.graph(r.all,{fresh,names:true,title:'추론 결과 그래프',on:show?new Set(show):null})}<ol class="round-log">${r.log.map((added,i)=>`<li><b>${i+1}라운드 · ${added.length}개</b> ${added.map(a=>U.fact(a.t)).join(', ')}</li>`).join('')||'<li>아직 새 사실이 없습니다.</li>'}</ol>`;
  el.querySelector('.readout').innerHTML=`적힌 사실 ${base.length}개 → 추론 후 <b>${r.all.length}</b>개 (새 사실 <b>${r.added}</b>개, 점선)<br>${ids.length?(r.fixed?`<b>고정점</b>: 다음 라운드를 돌려도 새 사실이 나오지 않습니다.`:'아직 고정점이 아닙니다. 라운드를 하나 더 늘려 보세요.'):'규칙이 없으면 그래프는 그대로입니다.'}`;
 });
};
})();
