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
extraction:{nodes:[],edges:[],extra:[[.95,'1911 수상 ✓'],[.88,'라듐 발견 ✓'],[.62,'베크렐 배우자 ✗'],[.48,'이렌 결혼 ✓'],[.29,'자녀 관계 ✗']].map(([s,t],i)=>`<rect class="kg-fig-bar${t.includes('✗')?' bad':''}" x="${40+i*86}" y="${150-s*120}" width="56" height="${s*120}" style="animation-delay:${i*.3}s"/><text x="${68+i*86}" y="${143-s*120}" text-anchor="middle">${s.toFixed(2)}</text><text x="${68+i*86}" y="168" text-anchor="middle" class="kg-fig-small">${t}</text>`).join('')+'<line class="kg-fig-cut" x1="20" x2="470" y1="78" y2="78"/><text x="470" y="92" text-anchor="end" class="kg-fig-small">문턱 0.60</text>',caption:'추출기가 낸 후보를 점수 막대로 세웠습니다. 문턱 0.60보다 높은 후보만 그래프에 넣으므로 틀린 “베크렐 배우자”는 들어오고, 맞는 “이렌 결혼”은 빠집니다.'},
embedding:{nodes:[[60,130,'바르샤바'],[200,60,'폴란드','id'],[220,140,'파리'],[360,70,'프랑스','id'],[330,160,'마드리드'],[460,95,'스페인?','var']],edges:[[0,1,'r',0],[2,3,'r',.8],[4,5,'h + r',1.8,'fresh']],caption:'바르샤바→폴란드와 파리→프랑스가 거의 같은 화살표 r입니다. 같은 r을 마드리드에 더해 닿는 자리 근처의 나라를 답으로 짐작합니다.'},
graphrag:{nodes:[[50,90,'질문','var'],[150,90,'폴로늄','id'],[240,40,'마리 퀴리'],[330,90,'이렌'],[430,40,'1935 화학상','id'],[430,145,'언어 모델','class']],edges:[[0,1,'개체 찾기',0],[1,2,'발견',.7],[2,3,'자녀',1.4],[3,4,'수상',2.1],[4,5,'근거 사슬',2.9,'fresh']],caption:'질문에서 폴로늄을 찾고, 그래프를 세 걸음 걸어 발견→자녀→수상 사슬을 모은 뒤, 그 사슬을 근거로 언어 모델에 건넵니다.'}
};
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
return {render,figs};
})();
