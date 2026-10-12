/* 7~9장 실험: 그래프 탐색, 최단 경로, 편집 거리. 계산은 ALMath에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=ALUI,M=ALMath,int=U.int,esc=U.esc,B=M.BRANCHES,name=i=>B[i][0];
const branchOptions=B.map((b,i)=>[i,b[0]+(i?' 분관':'')]);
/* 분관 지도: 선 굵게 = path에 든 도로, 숫자 = 방문 순서 또는 도로 시간 */
function map(opt={}){
 const {visited=[],path=[],weights=false,frontier=[]}=opt,onPath=(a,b)=>path.some((v,i)=>i&&((path[i-1]===a&&v===b)||(path[i-1]===b&&v===a)));
 const S=x=>x*0.74+8,T=y=>y*0.92+12;let s='';
 for(const [a,b,w] of M.ROADS){const on=onPath(a,b),x1=S(B[a][1]),y1=T(B[a][2]),x2=S(B[b][1]),y2=T(B[b][2]);
  s+=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?5:2}"/>`;
  if(weights)s+=`<text x="${(x1+x2)/2+4}" y="${(y1+y2)/2-4}" style="font-size:12px">${w}분</text>`;}
 B.forEach(([nm,x,y],i)=>{const k=visited.indexOf(i),f=frontier.includes(i);
  s+=`<circle cx="${S(x)}" cy="${T(y)}" r="15" fill="${k>=0?'var(--accent)':'var(--panel2)'}" stroke="${f?'var(--orange)':'var(--line)'}" stroke-width="${f?3:1.5}"/><text x="${S(x)}" y="${T(y)+5}" text-anchor="middle" style="fill:${k>=0?'var(--bg)':'var(--text)'};font-weight:700">${k>=0?k+1:''}</text><text x="${S(x)}" y="${T(y)+34}" text-anchor="middle">${nm}</text>`;});
 return s;
}
ALLabs.graph=el=>{
 U.setup(el,U.select('gr-start','출발 분관',branchOptions,0)+U.select('gr-kind','차례를 정하는 상자',[['bfs','큐 · 너비 우선 탐색 (BFS)'],['dfs','스택 · 깊이 우선 탐색 (DFS)']],'bfs')+U.range('gr-step','방문한 분관 수',1,8,1,1));
 U.bind(el,()=>{
  const s=U.value(el,'gr-start'),kind=el.querySelector('#gr-kind').value,k=U.value(el,'gr-step'),r=M.traverse(s,kind),vis=r.order.slice(0,k);
  const frontier=r.waiting[k-1]||[];
  const chart=U.svg(map({visited:vis,frontier}),`${name(s)}에서 ${kind.toUpperCase()}로 ${k}곳을 방문한 지도. 방문 순서 ${vis.map(name).join(', ')}`);
  const lv=kind==='bfs'?`<br>BFS가 붙인 단계(출발점에서 건너간 도로 수): ${r.order.map(v=>`${name(v)} ${r.level[v]}`).join(' · ')}`:`<br>DFS는 한 길을 끝까지 들어갔다가 막히면 돌아옵니다. 스택에서 꺼낼 때 방문 표시를 하므로, 이미 들른 분관이 다시 나오면 건너뜁니다.`;
  U.result(el,chart,`${kind.toUpperCase()} · 출발 <b>${name(s)}</b> · 방문 순서 <strong>${vis.map(name).join(' → ')}</strong>${k<8?` (다음 차례를 기다리는 곳, 꺼낼 순서대로: ${frontier.map(name).join(', ')||'없음'})`:''}${lv}<br>모든 분관을 도는 데 도로를 ${r.edges}번 확인했습니다(도로 12개 × 양쪽). 주황 테두리는 상자에 들어가 차례를 기다리는 분관입니다. 실제로 탐색한 결과입니다.`);
 });
};
ALLabs.route=el=>{
 U.setup(el,U.select('ro-start','출발',branchOptions,0)+U.select('ro-goal','도착',branchOptions,7)+U.select('ro-method','길 고르는 방법',[['dijkstra','다익스트라 (출발점에서 가까운 곳부터 확정)'],['greedy','눈앞의 가장 가까운 이웃으로 걷기'],['bfs','도로 수가 가장 적은 길 (BFS)']],'dijkstra'));
 U.bind(el,()=>{
  const s=U.value(el,'ro-start'),g=U.value(el,'ro-goal'),m=el.querySelector('#ro-method').value,d=M.dijkstra(s,g);
  let path,minutes,note,reached=true;
  if(m==='dijkstra'){path=d.path;minutes=d.minutes;note=`확정한 분관 <b>${d.settled.length}</b>곳, 도로 시간 비교 <b>${d.relax}</b>번. 확정 순서: ${d.settled.map(v=>`${name(v)} ${d.dist[v]}분`).join(' · ')}`;}
  else if(m==='greedy'){const r=M.greedyRoute(s,g);path=r.path;minutes=r.minutes;reached=r.reached;note=reached?'지금 자리만 보고 가장 짧은 도로를 고르면, 앞에서 아낀 몇 분이 뒤에서 더 큰 손해가 됩니다.':'<b>막다른 곳에 갇혀 도착하지 못했습니다.</b> 이미 지나온 분관으로는 돌아가지 않기 때문입니다.';}
  else{const r=M.traverse(s,'bfs');path=M.pathTo(r.parent,g);minutes=M.pathMinutes(path);note='BFS는 도로 수를 줄일 뿐 도로마다 다른 시간은 보지 않습니다.';}
  const best=d.minutes,gap=reached?minutes-best:null;
  const chart=U.svg(map({path,weights:true,visited:path}),`${name(s)}에서 ${name(g)}까지 ${path.map(name).join(', ')} 경로, ${minutes}분`);
  U.result(el,chart,`${path.map(name).join(' → ')} · <strong>${reached?minutes+'분':'도착 못 함'}</strong> · 도로 ${Math.max(path.length-1,0)}개<br>가장 빠른 길은 <b>${best}분</b>입니다${reached?(gap?` — 이 방법은 <b>${gap}분 늦습니다</b>.`:' — 이 방법이 찾은 길이 가장 빠릅니다.'):'.'}<br>${note}<br>도로와 시간은 이 책이 정한 가상의 지도이고, 경로는 실제로 계산했습니다.`);
 });
};
function table(r,a,b){
 a=[...a];b=[...b];if(a.length>12||b.length>12)return '<p class="caption">글자가 12자를 넘으면 표를 그리지 않습니다. 거리와 고친 내용은 아래 결과에 있습니다.</p>';
 const D=r.table;let h=`<table class="dp"><tr><th></th><th>·</th>${b.map(c=>`<th>${esc(c===' '?'␣':c)}</th>`).join('')}</tr>`;
 D.forEach((row,i)=>{h+=`<tr><th>${i?esc(a[i-1]===' '?'␣':a[i-1]):'·'}</th>${row.map((v,j)=>`<td class="${i===a.length&&j===b.length?'end':''}">${v}</td>`).join('')}</tr>`;});
 return `<div class="dp-wrap" tabindex="0" role="group" aria-label="편집 거리 표">${h}</table></div>`;
}
ALLabs.edit=el=>{
 U.setup(el,U.text('ed-q','이용자가 입력한 제목','별을 새는 고양이'));
 U.bind(el,()=>{
  const q=el.querySelector('#ed-q').value.trim(),c=M.closestTitles(q),top=c.rows[0],r=M.editDistance(q,top.title);
  const chart=`<div class="edit-view"><p class="caption">가장 가까운 제목 “${esc(top.title)}”과의 표. 칸마다 앞부분끼리의 편집 거리이고, 오른쪽 아래 칸이 답입니다. ␣는 띄어쓰기입니다.</p>${table(r,q,top.title)}</div>`;
  U.result(el,chart,`${q?`“${esc(q)}”`:'빈 입력'} → 가장 가까운 제목 <b>${esc(top.title)}</b> · 편집 거리 <strong>${top.distance}</strong>${r.ops.length?` (${r.ops.slice(0,4).map(esc).join(', ')}${r.ops.length>4?' …':''})`:' (똑같음)'}<br>다음 후보: ${c.rows.slice(1,3).map(x=>`${esc(x.title)} ${x.distance}`).join(' · ')}<br>목록 ${M.TITLES.length}권과 모두 비교하며 표 칸 <b>${int(c.cells)}</b>개를 채웠습니다. 실제로 계산한 결과입니다.`);
 });
};
})();
