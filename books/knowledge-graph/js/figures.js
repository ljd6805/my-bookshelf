/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 개념 그림. 간선이 차례로 그려지며 과정을 보여 주고,
   동작 줄이기 설정에서는 완성된 정지 그림으로 보인다. 같은 내용을 캡션 글로도 적는다. */
window.KGFigures=(()=>{
const U=KGUI;
// 점: [x, y, 이름, 종류(entity|var|id|class|name)], 간선: [시작, 끝, 이름, 지연(초), 종류(on|fresh|bad)]
const figs={
triples:{nodes:[[80,90,'마리 퀴리'],[240,40,'바르샤바'],[240,140,'폴로늄'],[400,90,'폴란드']],edges:[[0,1,'태어난 곳',0],[0,2,'발견',.8],[1,3,'속한 곳',1.6],[2,3,'이름 유래',2.4]],caption:'문장 네 개가 차례로 트리플이 됩니다. 마리 퀴리와 폴란드라는 같은 점을 함께 쓰기 때문에 네 사실이 하나의 그래프로 이어집니다.'},
walk:{nodes:[[50,90,'폴로늄','id'],[170,40,'마리 퀴리'],[170,140,'피에르 퀴리'],[300,90,'이렌'],[430,90,'1935 화학상','id']],edges:[[0,1,'1걸음',0],[0,2,'1걸음',0],[1,3,'2걸음',1],[2,3,'2걸음',1],[3,4,'3걸음',2]],caption:'폴로늄에서 출발한 탐색이 한 걸음씩 퍼져 나갑니다. 1걸음에 마리와 피에르, 2걸음에 이렌, 3걸음에 1935 화학상에 닿습니다.'},
identity:{nodes:[[60,30,'마리 퀴리','name'],[60,90,'Marie Curie','name'],[60,150,'M. Curie','name'],[190,90,'marie','id'],[300,90,'pierre','id'],[420,60,'Pierre Curie','name'],[420,140,'P. Curie','name']],edges:[[0,3,'',0],[1,3,'',.4],[2,3,'',.8],[5,4,'',1.2],[6,4,'',1.6],[2,6,'J 0.67 ✗',2.4,'bad']],caption:'여러 이름이 식별자 marie와 pierre로 모입니다. 글자만 비교하면 “M. Curie”와 “P. Curie”가 가장 닮아 보여 다른 두 사람이 잘못 묶일 수 있습니다(빨간 선).'},
ontology:{nodes:[[240,20,'사물','class'],[120,65,'사람','class'],[120,115,'과학자','class'],[360,65,'상','class'],[360,115,'노벨상','class'],[30,160,'마리 퀴리'],[450,160,'1911 화학상']],edges:[[1,0,'하위',0],[2,1,'하위',.4],[3,0,'하위',.8],[4,3,'하위',1.2],[5,2,'종류',1.8],[6,4,'종류',2.2],[5,6,'수상: 사람 → 상',3,'fresh']],caption:'클래스는 위아래 관계(하위 클래스)로 이어집니다. 마리는 과학자이므로 사람이기도 하고, 1911 화학상은 노벨상이므로 상이기도 해서 “수상” 관계의 규칙(사람 → 상)을 만족합니다.'},
reasoning:{nodes:[[50,50,'마리 퀴리'],[180,50,'바르샤바'],[310,50,'폴란드'],[440,50,'유럽']],edges:[[0,1,'태어난 곳',0],[1,2,'속한 곳',0],[2,3,'속한 곳',0],[0,2,'1라운드',1.2,'fresh'],[0,3,'2라운드',2.4,'fresh']],curve:true,caption:'적힌 사실은 위쪽 실선 세 개뿐입니다. 위치 규칙이 1라운드에 “마리는 폴란드에서 태어났다”를, 그 결과를 재료로 2라운드에 “마리는 유럽에서 태어났다”를 만듭니다.'},
query:{nodes:[[90,90,'?x','var'],[280,40,'폴로늄'],[280,140,'?y','var']],edges:[[0,1,'발견',0],[0,2,'배우자',.8]],extra:'<g class="kg-fig-fade" style="animation-delay:1.8s"><rect x="340" y="62" width="130" height="56" rx="8" class="kg-fig-box"/><text x="405" y="85" text-anchor="middle">?x = 마리 퀴리</text><text x="405" y="105" text-anchor="middle">?y = 피에르 퀴리</text></g>',caption:'빈칸 ?x와 ?y가 있는 패턴 두 줄을 그래프에 겹칩니다. 두 줄의 ?x가 같은 값이어야 하므로 답은 ?x = 마리 퀴리, ?y = 피에르 퀴리 한 쌍입니다.'},
extraction:{nodes:[],edges:[],extra:'<line class="kg-fig-cut" x1="20" x2="470" y1="78" y2="78"/>'+[[.95,'1911 수상 ✓'],[.88,'라듐 발견 ✓'],[.62,'베크렐 배우자 ✗'],[.48,'이렌 결혼 ✓'],[.29,'자녀 관계 ✗']].map(([s,t],i)=>`<rect class="kg-fig-bar${t.includes('✗')?' bad':''}" x="${40+i*86}" y="${150-s*120}" width="56" height="${s*120}" style="animation-delay:${i*.3}s"/><text x="${68+i*86}" y="${143-s*120}" text-anchor="middle">${s.toFixed(2)}</text><text x="${68+i*86}" y="168" text-anchor="middle" class="kg-fig-small">${t}</text>`).join('')+'<text x="470" y="92" text-anchor="end" class="kg-fig-small">문턱 0.60</text>',caption:'추출기가 낸 후보를 점수 막대로 세웠습니다. 문턱 0.60보다 높은 후보만 그래프에 넣으므로 틀린 “베크렐 배우자”는 들어오고, 맞는 “이렌 결혼”은 빠집니다.'},
embedding:{nodes:[[60,130,'바르샤바'],[200,60,'폴란드','id'],[220,140,'파리'],[360,70,'프랑스','id'],[330,160,'마드리드'],[460,95,'스페인?','var']],edges:[[0,1,'r',0],[2,3,'r',.8],[4,5,'h + r',1.8,'fresh']],caption:'바르샤바→폴란드와 파리→프랑스가 거의 같은 화살표 r입니다. 같은 r을 마드리드에 더해 닿는 자리 근처의 나라를 답으로 짐작합니다.'},
graphrag:{nodes:[[50,90,'질문','var'],[150,90,'폴로늄','id'],[240,40,'마리 퀴리'],[330,90,'이렌'],[430,40,'1935 화학상','id'],[430,145,'언어 모델','class']],edges:[[0,1,'개체 찾기',0],[1,2,'발견',.7],[2,3,'자녀',1.4],[3,4,'수상',2.1],[4,5,'근거 사슬',2.9,'fresh']],caption:'질문에서 폴로늄을 찾고, 그래프를 세 걸음 걸어 발견→자녀→수상 사슬을 모은 뒤, 그 사슬을 근거로 언어 모델에 건넵니다.'}
};
// 책 전체에서 따라가는 양 하나: 9장 질문의 근거 사슬(폴로늄 ←발견— 마리 퀴리 ←자녀— 이렌 —수상→ 1935 화학상).
// 모든 장의 같은 자리에 같은 표시(주황 고리와 굵은 선)로 그리고, 장마다 사슬에 무엇이 일어나는지 한 문장으로 적는다.
// state는 세 간선(발견·자녀·수상)이 이어졌는지(1) 끊겼는지(0)이며, 끊긴 간선은 점선과 글(off)로도 표시한다.
const CHAIN={
triples:{state:'111',note:'사슬의 세 사실이 트리플 세 개로 적힙니다. (마리 퀴리, 발견, 폴로늄), (이렌, 자녀, 마리 퀴리), (이렌, 수상, 1935 화학상)입니다.'},
walk:{state:'111',note:'폴로늄에서 마리 퀴리까지 1걸음, 이렌까지 2걸음, 1935 화학상까지 3걸음입니다. 사슬의 길이가 곧 최단거리입니다.'},
identity:{state:'101',off:'이름이 달라 끊김',note:'세 사실이 서로 다른 문서에서 왔다고 해 봅시다. 한 문서는 “마리 퀴리”, 다른 문서는 “M. Curie”라고 쓰면 마리가 두 점으로 갈라져 사슬이 끊깁니다(점선). 두 이름을 식별자 marie 하나로 묶어야 다시 이어집니다.'},
ontology:{state:'111',note:'사슬의 점마다 종류가 붙습니다(원소 · 과학자 · 과학자 · 노벨상). 세 사실 모두 관계 규칙(발견: 사람 → 물질, 자녀: 사람 → 사람, 수상: 사람 → 상)을 통과합니다.'},
reasoning:{state:'111',parent:true,note:'부모 규칙이 “마리 퀴리 —부모→ 이렌”을 더해(아래 점선), 사슬을 마리에서 이렌 쪽으로도 읽을 수 있게 됩니다. 이렌이 딸이라는 성별 정보는 그래프에 없습니다.'},
query:{state:'111',note:'사슬은 패턴 세 줄 (?x 발견 폴로늄) (?y 자녀 ?x) (?y 수상 ?z)에 맞는 답입니다. ?x 자리에 피에르 퀴리도 들어가 답은 두 줄이지만, ?z는 같은 1935 화학상입니다.'},
extraction:{state:'110',off:'후보에 없음',note:'실험의 후보 13개에는 사슬의 세 사실이 하나도 없습니다. 특히 추출기는 “이렌과 프레데리크는 1935년 화학상을 함께 받았다”에서 프레데리크의 수상(0.66)만 후보로 내고 이렌의 수상은 내지 않았습니다. 앞의 두 사실을 다른 자료에서 가져온다고 해도, 이 추출 결과로는 사슬의 마지막 사실이 빠집니다(점선).'},
embedding:{state:'110',off:'짐작 · 근거 아님',note:'TransE는 빠진 “이렌 —수상→ ?” 자리에 거리가 가까운 후보를 짐작할 수 있지만, 그 짐작은 근거가 아닙니다. 8장 실험은 도시와 나라만 다루므로 이 그림은 개념 설명입니다.'},
graphrag:{state:'111',note:'폴로늄에서 세 걸음을 걸어 사슬의 세 사실을 모두 모으고, 그 사실들을 근거로 답 “1935 화학상”을 씁니다.'}
};
function chain(id){
 const c=CHAIN[id];if(!c)return '';
 const X=[48,176,304,432],N=['폴로늄','마리 퀴리','이렌','1935 화학상'],E=[[1,0,'발견'],[2,1,'자녀'],[2,3,'수상']];
 let out='<defs><marker id="kg-chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L9 5L0 9z" fill="context-stroke"/></marker></defs>';
 E.forEach(([a,b,name],i)=>{
  const on=c.state[i]==='1',dir=a<b?1:-1,mid=(X[a]+X[b])/2;
  out+=`<line class="kg-chain-edge${on?'':' off'}" x1="${X[a]+dir*14}" y1="40" x2="${X[b]-dir*14}" y2="40" marker-end="url(#kg-chain-arrow)"/><text class="kg-chain-label" x="${mid}" y="30" text-anchor="middle">${name}</text>`;
  if(!on)out+=`<text class="kg-chain-off" x="${mid}" y="58" text-anchor="middle">✗ ${U.esc(c.off)}</text>`;
 });
 if(c.parent)out+=`<path class="kg-chain-edge fresh" d="M${X[1]+8} 52Q${(X[1]+X[2])/2} 84 ${X[2]-8} 52" marker-end="url(#kg-chain-arrow)"/><text class="kg-chain-off" x="${(X[1]+X[2])/2}" y="86" text-anchor="middle">부모 (추론)</text>`;
 N.forEach((name,i)=>{out+=`<g class="kg-chain-node"><circle cx="${X[i]}" cy="40" r="10"/><text x="${X[i]}" y="${c.parent&&(i===1||i===2)?20:74}" text-anchor="middle">${name}</text></g>`;});
 const label=`따라가는 근거 사슬: 마리 퀴리 —발견→ 폴로늄, 이렌 —자녀→ 마리 퀴리, 이렌 —수상→ 1935 화학상. ${c.note}`;
 return `<figure class="kg-chain"><svg viewBox="0 0 480 ${c.parent?96:84}" role="img" aria-label="${U.esc(label)}">${out}</svg><figcaption class="caption"><b>따라가는 근거 사슬</b> ${c.note}</figcaption></figure>`;
}
function render(id,index){
 const f=figs[id];if(!f)return '';const n=f.nodes;let out='';
 f.edges.forEach(([a,b,name,delay,kind],i)=>{
  const [x1,y1]=n[a],[x2,y2]=n[b],bend=f.curve&&kind==='fresh'?(i===4?110:60):0,mx=(x1+x2)/2,my=(y1+y2)/2;
  // 곡선은 조절점을 2×bend만큼 내려, 곡선의 한가운데가 bend만큼 내려오게 한다(이름은 그 자리에 붙인다).
  const d=bend?`M${x1} ${y1}Q${mx} ${my+2*bend} ${x2} ${y2}`:`M${x1} ${y1}L${x2} ${y2}`;
  out+=`<path class="kg-fig-edge ${kind||''}" d="${d}" pathLength="1" style="animation-delay:${delay}s"/>`;
  if(name)out+=`<text class="kg-fig-label kg-fig-fade" style="animation-delay:${delay+.3}s" x="${mx}" y="${bend?my+bend+16:my-6}" text-anchor="middle">${U.esc(name)}</text>`;
 });
 for(const [x,y,name,kind] of n)out+=`<g class="kg-fig-node ${kind||'entity'}"><circle cx="${x}" cy="${y}" r="${kind==='var'?11:8}"/><text x="${x}" y="${y<100?y-15:y+24}" text-anchor="middle">${U.esc(name)}</text></g>`;
 out+=f.extra||'';
 return `<svg class="kg-fig" viewBox="-12 -16 504 ${f.curve?200:214}" role="img" aria-label="${U.esc(f.caption)}">${out}</svg><figcaption class="caption">그림 ${index+1}-1. ${f.caption}</figcaption>`;
}
return {render,figs,chain,CHAIN};
})();
