/* 지식 그래프 실험에 쓰는 순수 계산과 공통 사례(퀴리 가족) 데이터. DOM을 만지지 않는다.
   사실은 노벨상 공식 기록과 널리 알려진 전기 사실만 쓰며, 지명은 오늘날 기준이다. */
(function(root){
'use strict';
const entities={
 marie:{label:'마리 퀴리',type:'Scientist',x:185,y:165,side:'r'},pierre:{label:'피에르 퀴리',type:'Scientist',x:185,y:40},
 irene:{label:'이렌',type:'Scientist',x:330,y:40},frederic:{label:'프레데리크',type:'Scientist',x:445,y:40},
 becquerel:{label:'베크렐',type:'Scientist',x:45,y:40},polonium:{label:'폴로늄',type:'Element',x:120,y:215},
 radium:{label:'라듐',type:'Element',x:250,y:225},warsaw:{label:'바르샤바',type:'City',x:30,y:215},
 poland:{label:'폴란드',type:'Country',x:95,y:262},paris:{label:'파리',type:'City',x:300,y:110},
 france:{label:'프랑스',type:'Country',x:440,y:200},europe:{label:'유럽',type:'Region',x:370,y:262},
 nobel1903:{label:'1903 물리학상',type:'NobelPrize',x:70,y:115},nobel1911:{label:'1911 화학상',type:'NobelPrize',x:310,y:185},
 nobel1935:{label:'1935 화학상',type:'NobelPrize',x:445,y:115}
};
const predicates={bornIn:'태어난 곳',locatedIn:'속한 곳',spouse:'배우자',discovered:'발견',awarded:'수상',childOf:'자녀',parentOf:'부모',namedAfter:'이름 유래',workedIn:'일한 곳'};
// 책 전체에서 쓰는 사실 21개. 순서는 문장을 하나씩 추가하는 실험의 순서이기도 하다.
const triples=[
 ['marie','bornIn','warsaw'],['irene','awarded','nobel1935'],['becquerel','awarded','nobel1903'],['paris','locatedIn','france'],
 ['marie','discovered','polonium'],['irene','childOf','marie'],['pierre','bornIn','paris'],['marie','spouse','pierre'],
 ['pierre','awarded','nobel1903'],['warsaw','locatedIn','poland'],['polonium','namedAfter','poland'],['pierre','discovered','polonium'],
 ['marie','discovered','radium'],['pierre','discovered','radium'],['marie','awarded','nobel1903'],['marie','awarded','nobel1911'],
 ['marie','workedIn','paris'],['irene','childOf','pierre'],['irene','bornIn','paris'],['irene','spouse','frederic'],['frederic','awarded','nobel1935']
];
const extra=[['poland','locatedIn','europe'],['france','locatedIn','europe']];
const classes={Thing:null,Agent:'Thing',Person:'Agent',Scientist:'Person',Place:'Thing',City:'Place',Country:'Place',Region:'Place',Substance:'Thing',Element:'Substance',Award:'Thing',NobelPrize:'Award'};
const schema={bornIn:['Person','Place'],locatedIn:['Place','Place'],spouse:['Person','Person'],discovered:['Person','Substance'],awarded:['Person','Award'],childOf:['Person','Person'],parentOf:['Person','Person'],namedAfter:['Substance','Place'],workedIn:['Person','Place']};
const key=t=>t.join(' ');

function stats(list){
 const nodes=new Set(),degree={},parent={};
 const find=a=>parent[a]===a?a:(parent[a]=find(parent[a]));
 for(const [s,,o] of list){for(const n of [s,o]){if(!nodes.has(n)){nodes.add(n);parent[n]=n;degree[n]=0;}}degree[s]++;degree[o]++;parent[find(s)]=find(o);}
 const components=new Set([...nodes].map(find)).size;
 const top=[...nodes].sort((a,b)=>degree[b]-degree[a]||a.localeCompare(b))[0]||null;
 return {nodes:nodes.size,edges:list.length,components,degree,top};
}
// 방향을 무시하고 hops 단계까지 퍼져 나간다. 돌려주는 dist는 출발점에서 몇 걸음인지다.
function reach(list,start,hops){
 const dist={[start]:0},used=[];let frontier=[start];
 for(let h=1;h<=hops&&frontier.length;h++){
  const next=[];
  for(const t of list){const [s,,o]=t;for(const [a,b] of [[s,o],[o,s]])if(frontier.includes(a)&&dist[b]===undefined){dist[b]=h;next.push(b);}}
  for(const t of list)if(dist[t[0]]!==undefined&&dist[t[2]]!==undefined&&dist[t[0]]<=hops&&dist[t[2]]<=hops&&!used.includes(t))used.push(t);
  frontier=next;
 }
 return {dist,used,count:Object.keys(dist).length-1};
}
function path(list,from,to){
 const prev={[from]:null},queue=[from];
 while(queue.length){const a=queue.shift();if(a===to)break;for(const t of list){const [s,,o]=t;for(const [x,y] of [[s,o],[o,s]])if(x===a&&!(y in prev)){prev[y]=t;queue.push(y);}}}
 if(!(to in prev))return null;const steps=[];let cur=to;
 while(prev[cur]){const t=prev[cur];steps.unshift(t);cur=t[0]===cur?t[2]:t[0];}
 return steps;
}
// 이름 비교: 소문자로 바꾸고 공백·점·하이픈을 지운 뒤 두 글자 조각(bigram)의 자카드 유사도.
const norm=s=>s.toLowerCase().normalize('NFC').replace(/[\s.\-·]/g,'');
function bigrams(s){const t=norm(s),out=new Set();for(let i=0;i<t.length-1;i++)out.add(t.slice(i,i+2));if(t.length===1)out.add(t);return out;}
function jaccard(a,b){const A=bigrams(a),B=bigrams(b);let inter=0;for(const x of A)if(B.has(x))inter++;const union=A.size+B.size-inter;return union?inter/union:0;}
// 단일 연결 묶기. useId가 참이면 이름 대신 미리 정한 식별자로 묶는다.
function resolve(names,threshold,useId=false){
 const parent=names.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
  const same=useId?names[i].id===names[j].id:jaccard(names[i].name,names[j].name)>=threshold;
  if(same)parent[find(i)]=find(j);
 }
 const groups={};names.forEach((n,i)=>(groups[find(i)]=groups[find(i)]||[]).push(n));
 const clusters=Object.values(groups);
 const wrong=clusters.filter(c=>new Set(c.map(n=>n.id)).size>1).length;
 const ids=new Set(names.map(n=>n.id)),missed=[...ids].filter(id=>clusters.filter(c=>c.some(n=>n.id===id)).length>1).length;
 return {clusters,wrong,missed,ideal:ids.size};
}
function ancestors(cls){const out=[];for(let c=cls;c;c=classes[c])out.push(c);return out;}
function typesOf(id){return entities[id]?ancestors(entities[id].type):[];}
// 정의역(domain)·치역(range) 검사. 'validate'는 위반을 알리고, 'rdfs'는 RDFS처럼 타입을 새로 추론한다.
function check(s,p,o,mode='validate'){
 const [domain,range]=schema[p],st=typesOf(s),ot=typesOf(o);
 const okS=st.includes(domain),okO=ot.includes(range);
 if(mode==='rdfs')return {ok:true,okS,okO,domain,range,inferred:[!okS?`${s} a ${domain}`:null,!okO?`${o} a ${range}`:null].filter(Boolean)};
 return {ok:okS&&okO,okS,okO,domain,range,inferred:[]};
}
const ruleBook={
 spouse:{name:'배우자는 대칭',apply:list=>list.filter(t=>t[1]==='spouse').map(([a,,b])=>[b,'spouse',a])},
 parent:{name:'자녀의 반대는 부모',apply:list=>list.filter(t=>t[1]==='childOf').map(([a,,b])=>[b,'parentOf',a])},
 located:{name:'위치는 이어진다',apply:list=>{const out=[];for(const [a,p,b] of list)if(p==='locatedIn'||p==='bornIn')for(const [c,q,d] of list)if(q==='locatedIn'&&c===b)out.push([a,p,d]);return out;}}
};
// 전방 연쇄: 라운드마다 규칙을 모두 적용하고, 새 사실이 없으면 고정점에 도달한 것이다.
function infer(list,ruleIds,rounds){
 const seen=new Set(list.map(key)),all=list.slice(),log=[];let fixed=false;
 for(let r=1;r<=rounds;r++){
  const added=[];
  for(const id of ruleIds)for(const t of ruleBook[id].apply(all))if(!seen.has(key(t))){seen.add(key(t));added.push({t,rule:id});}
  if(!added.length){fixed=true;break;}
  all.push(...added.map(a=>a.t));log.push(added);
 }
 if(!fixed&&ruleIds.length){const probe=ruleIds.flatMap(id=>ruleBook[id].apply(all)).filter(t=>!seen.has(key(t)));fixed=!probe.length;}
 if(!ruleIds.length)fixed=true;
 return {all,log,added:all.length-list.length,fixed};
}
const isVar=x=>typeof x==='string'&&x.startsWith('?');
// 패턴 매칭: 트리플 패턴을 차례로 맞추며 변수 바인딩을 이어 붙인다(SPARQL의 기본 그래프 패턴과 같은 원리).
function match(list,patterns){
 let rows=[{}];
 for(const pat of patterns){
  const next=[];
  for(const row of rows)for(const t of list){
   const b={...row};let ok=true;
   for(let i=0;i<3&&ok;i++){const term=pat[i];if(isVar(term)){if(b[term]===undefined)b[term]=t[i];else ok=b[term]===t[i];}else ok=term===t[i];}
   if(ok)next.push(b);
  }
  rows=next;
 }
 const seen=new Set();return rows.filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true;});
}
function prf(cands,threshold){
 const kept=cands.filter(c=>c.score>=threshold),tp=kept.filter(c=>c.gold).length,gold=cands.filter(c=>c.gold).length;
 const precision=kept.length?tp/kept.length:null,recall=gold?tp/gold:0;
 const f1=precision&&recall?2*precision*recall/(precision+recall):0;
 return {kept:kept.length,tp,fp:kept.length-tp,fn:gold-tp,precision,recall,f1};
}
// TransE: 머리 h에 관계 r을 더한 점이 꼬리 t와 가까울수록 그럴듯한 사실이다. 점수는 거리(작을수록 좋음).
const dist2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function transe(h,r,candidates){return Object.entries(candidates).map(([id,t])=>({id,d:dist2([h[0]+r[0],h[1]+r[1]],t)})).sort((a,b)=>a.d-b.d);}
// pairs: [[머리 좌표, 정답 꼬리 id]]. 학습 쌍의 평균 거리와 정답이 1위인 쌍 수를 함께 잰다.
function transeScore(pairs,r,candidates){
 const errs=pairs.map(([h,id])=>dist2([h[0]+r[0],h[1]+r[1]],candidates[id]));
 return {meanError:errs.reduce((a,b)=>a+b,0)/pairs.length,hits:pairs.filter(([h,id])=>transe(h,r,candidates)[0].id===id).length};
}
// 8장 실험의 2차원 좌표. 설명용으로 직접 정한 값이며 학습된 임베딩이 아니다.
const embedding={
 cities:{warsaw:['바르샤바',[1,.6]],paris:['파리',[-.6,.4]],berlin:['베를린',[.4,1]],rome:['로마',[.2,-.6]],madrid:['마드리드',[-1.2,-.4]]},
 countries:{poland:['폴란드',[2.55,1.75]],france:['프랑스',[.95,1.65]],germany:['독일',[1.85,2.3]],italy:['이탈리아',[1.75,.55]],spain:['스페인',[.35,.75]]},
 answer:{warsaw:'poland',paris:'france',berlin:'germany',rome:'italy',madrid:'spain'},train:['warsaw','paris','berlin','rome']
};
function meanOffset(pairs){const n=pairs.length;return [pairs.reduce((s,[h,t])=>s+t[0]-h[0],0)/n,pairs.reduce((s,[h,t])=>s+t[1]-h[1],0)/n];}
// 키워드 검색: 질문 낱말이 문장에 몇 개 들어 있는지 세고, 같은 점수는 원래 순서를 지킨다.
function keywordRank(chunks,words){return chunks.map((c,i)=>({...c,i,score:words.filter(w=>c.text.includes(w)).length})).sort((a,b)=>b.score-a.score||a.i-b.i);}
function chainComplete(list){return match(list,[['?x','discovered','polonium'],['?y','childOf','?x'],['?y','awarded','?z']]);}
const api={entities,predicates,triples,extra,classes,schema,key,stats,reach,path,norm,jaccard,resolve,ancestors,typesOf,check,ruleBook,infer,match,prf,transe,transeScore,embedding,meanOffset,keywordRank,chainComplete};
if(typeof module!=='undefined')module.exports=api;else root.KGGraph=api;
})(typeof window!=='undefined'?window:globalThis);
