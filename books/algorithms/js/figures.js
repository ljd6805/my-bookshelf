/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자가 있는 그림은 ALMath로 실제 계산한다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.ALFigures=(()=>{
'use strict';
const M=ALMath,U=ALUI;
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const muted={size:13,fill:'var(--muted)'};
const F={};
F.steps=()=>{
 const tasks=[['훑기','linear'],['모든 쌍','pairs'],['반씩','halving']],L=v=>Math.log10(Math.max(v,1))/Math.log10(2e6)*380;
 let b=t(20,24,'실제로 센 단계 · 로그 눈금 (한 칸에 10배)',{a:'start',...muted});
 tasks.forEach(([nm,k],i)=>{const y=46+i*76,a=M.measure(k,1000),c=M.measure(k,2000);
  b+=t(20,y+24,nm,{a:'start',w:700})+grow(110,y,L(a),22,'var(--blue)',i*.3)+t(118+L(a),y+17,`1,000권 ${U.int(a)}`,{a:'start',size:13})+grow(110,y+28,L(c),22,'var(--accent)',.2+i*.3)+t(118+L(c),y+45,`2,000권 ${U.int(c)} (${U.fmt(c/a,1)}배)`,{a:'start',size:13});});
 return {svg:svg('책 1,000권과 2,000권에서 훑기, 모든 쌍 비교, 반씩 줄이기의 단계를 로그 눈금 막대로 견준 그림. 훑기는 두 배, 모든 쌍은 네 배, 반씩 줄이기는 한 단계 늘어난다',b,270),caption:'실제로 센 값입니다. 책이 두 배가 되면 훑기는 2배, 모든 쌍 비교는 약 4배가 되지만, 반씩 줄이기는 10번에서 11번으로 한 번 늘 뿐입니다.'};
};
F.lists=()=>{
 let b=t(20,26,'배열 · 맨 앞에 끼우기',{a:'start',w:700})+t(360,26,'연결 리스트 · 맨 앞에 끼우기',{a:'start',w:700});
 for(let i=0;i<5;i++){const x=24+i*56;b+=box(x,48,48,40,'var(--line)')+t(x+24,74,String(i+1));if(i<4)b+=dot(x+24,98,56,0,'var(--orange)',i*.25,5);}
 b+=box(24,120,48,40,'var(--accent)','var(--chart)')+t(48,146,'새',{fill:'var(--accent)',w:700})+t(160,186,'뒤 칸 n개를 한 칸씩 옮긴다',{a:'middle',...muted});
 for(let i=0;i<4;i++){const x=380+i*64;b+=box(x,48,44,40,'var(--line)')+t(x+22,74,String(i+1));if(i<3)b+=`<path d="M${x+44} 68H${x+64}" stroke="var(--muted)" stroke-width="2" marker-end="url(#al-arr)"/>`;}
 b+=blink(box(380,120,44,40,'var(--accent)','var(--chart)')+t(402,146,'새',{fill:'var(--accent)',w:700})+line('M402 120V90','var(--accent)'),.4)+t(500,186,'연결 하나만 고쳐 단다',{...muted});
 b+=t(160,232,'k번째 읽기: 바로 (주소 계산 한 번)',{size:14})+t(500,232,'k번째 읽기: 연결을 k번 따라감',{size:14});
 b='<defs><marker id="al-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>'+b;
 return {svg:svg('배열은 맨 앞에 끼우려고 뒤 칸을 모두 한 칸씩 옮기고, 연결 리스트는 새 칸의 연결 하나만 고쳐 단다. 대신 k번째를 읽을 때는 배열이 바로, 연결 리스트는 k번 따라간다',b,250),caption:'같은 “맨 앞에 끼우기”가 배열에서는 칸 옮기기 n번, 연결 리스트에서는 연결 하나입니다. 읽기는 반대로 배열이 쌉니다. 어느 구조가 낫다는 답은 자주 하는 일이 정합니다.'};
};
F.sorting=()=>{
 const levels=[[[5,2,8,1,9,3,7,4]],[[5,2,8,1],[9,3,7,4]],[[5,2],[8,1],[9,3],[7,4]],[[2,5],[1,8],[3,9],[4,7]],[[1,2,5,8],[3,4,7,9]],[[1,2,3,4,5,7,8,9]]];
 let b='';
 levels.forEach((groups,k)=>{const y=18+k*42,n=groups.length,w=8*30+(n-1)*20,x0=(640-w)/2;let x=x0;
  const g=groups.map(gr=>{const s=gr.map((v,i)=>box(x+i*30,y,26,30,k<3?'var(--line)':'var(--accent)')+t(x+i*30+13,y+21,String(v),{size:14})).join('');x+=gr.length*30+20;return s;}).join('');
  b+=blink(g,k*.5)+t(20,y+21,k<3?(k?'나누기':'처음'):'합치기',{a:'start',...muted});});
 b+=t(320,282,`이 8권을 실제로 센 병합 정렬 비교 ${M.mergeSort([5,2,8,1,9,3,7,4]).comparisons}번 · 하한 ⌈log₂ 8!⌉ = ${M.sortLowerBound(8)}`,{size:14});
 return {svg:svg('책 8권을 반씩 나눈 뒤 정렬된 묶음을 둘씩 합치는 병합 정렬. 층마다 비교가 n번 이하이고 층은 log n개다',b,294),caption:'나누기는 비교 없이 반씩 쪼개고, 합치기 층마다 많아야 n번 견줍니다. 층이 log₂ n개라 전체가 n log n 안쪽입니다. 비교만 쓰는 어떤 방법도 최악의 입력에서는 하한(8권이면 16번)보다 적게 견줄 수 없습니다. 그림 아래 17번은 이 8권에서 병합 정렬이 실제로 견준 횟수이고, 16번은 어떤 방법도 최악의 입력에서 넘을 수 없는 바닥입니다.'};
};
F.search=()=>{
 const r=M.binarySearch(10000,M.callNumber(3700)),W=560,X=i=>40+i/9999*W;
 let b=t(40,24,`1만 권 서가에서 청구기호 ${M.callNumber(3700)} 찾기 · 비교 ${r.comparisons}번`,{a:'start',...muted});
 r.steps.slice(0,7).forEach((s,k)=>{const y=40+k*32;b+=blink(`<rect x="${X(s.lo)}" y="${y}" width="${Math.max(X(s.hi)-X(s.lo),3)}" height="20" rx="3" fill="var(--blue)" opacity=".75"/><rect x="${X(s.mid)-1.5}" y="${y-3}" width="3" height="26" fill="var(--orange)"/>`+t(620,y+15,`${U.int(s.hi-s.lo+1)}권`,{a:'end',size:13}),k*.4);});
 b+=t(40,272,`…남은 ${r.comparisons-7}번은 범위가 수십 권 이하라 막대가 보이지 않습니다. 100만 권이면 많아야 20번.`,{a:'start',size:13});
 return {svg:svg('정렬된 1만 권 서가에서 가운데(주황 선)와 견줄 때마다 남은 범위(파랑)가 반으로 줄어드는 그림',b,284),caption:`실제로 센 값입니다. 가운데 책과 한 번 견줄 때마다 남은 범위가 반이 되어, 1만 권이 ${r.comparisons}번 만에 한 권으로 줄어듭니다.`};
};
F.hash=()=>{
 const keys=Array.from({length:10},(_,i)=>M.keyOf(i)),m=8,chains=Array.from({length:m},()=>[]);keys.forEach(k=>chains[M.fnv1a(k)%m].push(k));
 let b=t(20,24,'청구기호 10개 → 칸 8개 (부하율 1.25) · FNV-1a % 8',{a:'start',...muted});
 chains.forEach((c,i)=>{const x=24+i*76;b+=box(x,44,64,30,'var(--line)')+t(x+32,65,`칸 ${i}`,{size:13});
  c.forEach((k,j)=>{b+=blink(box(x,86+j*36,64,28,'var(--accent)','var(--chart)')+t(x+32,105+j*36,k.slice(3),{size:13}),.3*keys.indexOf(k));});});
 const long=Math.max(...chains.map(c=>c.length));
 b+=t(320,262,`가장 긴 줄 ${long}권 · 칸을 16개로 두 배 늘리면 부하율 0.63`,{size:14});
 return {svg:svg('청구기호 열 개가 해시 값에 따라 칸 여덟 개에 나뉘어 들어가고, 같은 칸에 온 책은 줄로 이어지는 그림',b,280),caption:'실제 해시 값입니다. 해시는 청구기호를 칸 번호로 바꿔 그 칸의 짧은 줄만 봅니다. 칸보다 책이 많아지면 줄이 길어지므로, 부하율이 기준을 넘으면 칸을 두 배로 늘려 다시 나눕니다.'};
};
F.heap=()=>{
 const items=M.borrowCounts(2000),top=M.topK(items,7,'heap').top,heap=[...top].sort((a,b)=>a.count-b.count||b.id-a.id);
 const pos=[[320,50],[180,126],[460,126],[110,206],[250,206],[390,206],[530,206]];let b='';
 pos.forEach(([x,y],i)=>{if(i){const p=pos[(i-1)>>1];b+=`<path d="M${p[0]} ${p[1]+18}L${x} ${y-18}" stroke="var(--line)" stroke-width="2"/>`;}});
 pos.forEach(([x,y],i)=>{b+=blink(`<circle cx="${x}" cy="${y}" r="24" fill="${i?'var(--panel2)':'var(--chart)'}" stroke="${i?'var(--accent)':'var(--orange)'}" stroke-width="${i?2:3}"/>`+t(x,y+5,String(heap[i].count),{size:14,w:700})+t(x+30,y-16,`[${i}]`,{a:'start',size:13,fill:'var(--muted)'}),i*.25);});
 b+=t(320,262,'뿌리 = 상위 7권 중 대출이 가장 적은 책 · 새 책은 뿌리와 한 번 견주고, 더 많으면 뿌리를 바꿔 아래로 내린다',{size:13});
 return {svg:svg('대출 횟수 상위 7권을 담은 최소 힙. 뿌리에 가장 적게 빌린 책이 있고 부모는 자식보다 작거나 같다',b,280),caption:`가상의 대출 기록 2,000권에서 실제로 고른 상위 7권입니다. 부모가 자식보다 작거나 같다는 약속만 지키므로 뿌리(${heap[0].count}회)가 지금 문턱이고, i번 칸의 자식은 2i+1, 2i+2번 칸입니다.`};
};
function mapBase(highlight=[],labels={}){
 const B=M.BRANCHES,S=x=>x*.95+20,T=y=>y*.9+24,on=(a,c)=>highlight.some((v,i)=>i&&((highlight[i-1]===a&&v===c)||(highlight[i-1]===c&&v===a)));let s='';
 for(const [a,c,w] of M.ROADS){const hit=on(a,c);s+=`<path d="M${S(B[a][1])} ${T(B[a][2])}L${S(B[c][1])} ${T(B[c][2])}" stroke="${hit?'var(--accent)':'var(--line)'}" stroke-width="${hit?5:2}"/>`+t((S(B[a][1])+S(B[c][1]))/2+6,(T(B[a][2])+T(B[c][2]))/2-5,w,{size:13,fill:'var(--muted)'});}
 return {s,S,T};
}
F.graph=()=>{
 const r=M.traverse(0,'bfs'),{s,S,T}=mapBase();let b=s;
 r.order.forEach((v,k)=>{const [nm,x,y]=M.BRANCHES[v],lv=r.level[v];b+=blink(`<circle cx="${S(x)}" cy="${T(y)}" r="20" fill="var(--panel2)" stroke="${['var(--orange)','var(--accent)','var(--blue)','var(--muted)'][lv]}" stroke-width="3"/>`+t(S(x),T(y)+5,nm,{size:13,w:700})+t(S(x),T(y)+36,`${k+1}번째 · ${lv}단계`,{size:13,fill:'var(--muted)'}),k*.35);});
 return {svg:svg('본관에서 너비 우선 탐색으로 분관을 돈 순서. 본관에서 도로 한 개 거리인 강변과 시장이 먼저, 두 개 거리인 학교·공원·역앞이 그다음에 방문된다',b,300),caption:`실제 BFS 결과입니다. 큐는 먼저 넣은 분관부터 꺼내므로 본관에서 도로 1개 거리(강변·시장), 2개 거리(학교·공원·역앞), 3개 거리(언덕·호수) 순으로 퍼져 나갑니다. 상자를 스택으로 바꾸면 같은 코드가 DFS가 됩니다.`};
};
F.shortest=()=>{
 const d=M.dijkstra(0,7),{s,S,T}=mapBase(d.path);let b=s;
 d.settled.forEach((v,k)=>{const [nm,x,y]=M.BRANCHES[v];b+=blink(`<circle cx="${S(x)}" cy="${T(y)}" r="20" fill="${d.path.includes(v)?'var(--accent)':'var(--panel2)'}" stroke="var(--accent)" stroke-width="2"/>`+t(S(x),T(y)+5,nm,{size:13,w:700,fill:d.path.includes(v)?'var(--bg)':'var(--text)'})+t(S(x),T(y)+36,`${d.dist[v]}분 확정`,{size:13,fill:'var(--muted)'}),k*.35);});
 return {svg:svg(`본관에서 호수 분관까지 다익스트라가 가까운 분관부터 확정해 찾은 ${d.minutes}분 경로 ${d.path.map(v=>M.BRANCHES[v][0]).join(', ')}`,b,300),caption:`실제 계산입니다. 다익스트라는 출발점에서 가장 가까운 분관부터 하나씩 확정합니다. 본관→호수의 가장 빠른 길은 ${d.path.map(v=>M.BRANCHES[v][0]).join('→')} ${d.minutes}분이고, 도로 수가 가장 적은 BFS 길은 ${M.pathMinutes(M.pathTo(M.traverse(0,'bfs').parent,7))}분입니다.`};
};
F.edit=()=>{
 const a='가는 기차',c='간 기차',r=M.editDistance(a,c),A=[...a],C=[...c];
 let b=t(20,24,`“${a}” → “${c}” · 편집 거리 ${r.distance}`,{a:'start',...muted});
 C.forEach((ch,j)=>{b+=t(150+(j+1)*56,56,ch===' '?'␣':ch,{w:700})});A.forEach((ch,i)=>{b+=t(100,92+(i+1)*32,ch===' '?'␣':ch,{w:700})});
 r.table.forEach((row,i)=>row.forEach((v,j)=>{const x=126+j*56,y=70+i*32,end=i===A.length&&j===C.length;b+=blink(`<rect x="${x}" y="${y}" width="50" height="28" rx="4" fill="${end?'var(--accent)':'var(--panel2)'}" stroke="var(--line)"/>`+t(x+25,y+19,String(v),{size:14,fill:end?'var(--bg)':'var(--text)'}),(i+j)*.18);}));
 b+=t(470,120,'고친 내용',{a:'start',w:700})+r.ops.map((o,k)=>t(470,146+k*24,o,{a:'start',size:13})).join('');
 return {svg:svg('가는 기차와 간 기차의 편집 거리 표. 칸마다 앞부분끼리의 거리이고 오른쪽 아래 칸이 2이다',b,270),caption:`실제로 채운 표입니다. 칸 하나는 왼쪽·위·왼쪽 위 칸에 1을 더하거나 그대로 가져온 값 중 가장 작은 것이고, 오른쪽 아래 칸 ${r.distance}가 답입니다. 표는 ${r.cells}칸이고, 글자 수의 곱만큼 늘어납니다.`};
};
F.index=()=>{
 const titles=M.makeTitles(40),post=M.buildIndex(titles),wa=M.WORDS.indexOf('기차'),wb=M.WORDS.indexOf('여름'),A=post[wa],Bl=post[wb],hit=M.indexSearch(post,[wa,wb]).hits;
 let b=t(20,24,'제목 40개의 역색인 중 두 줄 · 두 목록을 앞에서부터 맞물리기',{a:'start',...muted});
 [['기차',A,60],['여름',Bl,130]].forEach(([w,L,y])=>{b+=t(20,y+20,w,{a:'start',w:700});L.forEach((id,k)=>{const on=hit.includes(id);b+=blink(box(80+k*54,y,46,30,on?'var(--accent)':'var(--line)',on?'var(--chart)':'var(--panel2)')+t(103+k*54,y+20,String(id),{size:13,fill:on?'var(--accent)':'var(--text)'}),k*.15);});});
 b+=t(20,214,`교집합 = {${hit.join(', ')}} · 훑기는 제목 ${titles.length}개를 모두 보지만, 색인은 목록 ${A.length}+${Bl.length}칸만 지난다`,{a:'start',size:14});
 return {svg:svg('낱말 기차와 여름의 책 번호 목록을 나란히 놓고 앞에서부터 맞물려 두 낱말이 모두 든 책을 찾는 그림',b,240),caption:'실제 합성 자료로 만든 색인입니다. 낱말마다 책 번호가 정렬돼 있어서 두 목록을 지퍼처럼 맞물리면 3장 병합과 같은 방식으로 교집합이 나옵니다. 걸리는 시간은 서가 크기가 아니라 목록 길이를 따라갑니다.'};
};
F.final=()=>{
 const ids=Object.keys(M.LEDGER),rows=ids.map(id=>M.ledgerRow(id)),L=v=>Math.max(Math.log10(Math.max(v,1))/Math.log10(1e8)*290,2);
 let b=t(20,20,'100만 권에서 한 번 할 때의 단계 · 로그 눈금',{a:'start',...muted});
 rows.forEach((r,i)=>{const y=34+i*24;b+=t(20,y+14,`${String(i+1).padStart(2,'0')} ${r.label.split(' · ')[0]}`,{a:'start',size:13})+grow(270,y,L(r.large),16,r.ratio>50?'var(--orange)':r.ratio<1.05?'var(--accent)':'var(--blue)',i*.15)+t(278+L(r.large),y+13,U.big(r.large),{a:'start',size:13});});
 return {svg:svg('1장부터 10장까지 규모 장부의 100만 권 값을 로그 눈금 막대로 모은 그림. 해시와 이진 탐색은 짧고 훑기와 편집 거리 비교는 길다',b,282),caption:'규모 장부 열 줄입니다. 주황은 1만→100만에 50배 넘게 커지는 일, 청록은 천천히 커지는 일(이진 탐색), 파랑은 거의 그대로인 일(해시)입니다. 마지막 과제는 하루에 자주 하는 일부터 주황 막대를 없애는 것입니다.'};
};
function render(id){return F[id]?F[id]():null;}
return {render};
})();
