/* 4~6장 실험: 이진 탐색, 트리의 균형, 해시 표, 상위 k개. 계산은 ALMath에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=ALUI,M=ALMath,big=U.big,int=U.int,esc=U.esc;
ALLabs.bsearch=el=>{
 U.setup(el,U.select('bs-n','서가의 책 수',[[1000,'1천 권'],[10000,'1만 권'],[100000,'10만 권'],[1000000,'100만 권']],10000)+U.range('bs-pos','찾는 책의 자리 (서가 앞에서 %)',0,100,1,37));
 U.bind(el,()=>{
  const n=U.value(el,'bs-n'),pos=Math.min(n-1,Math.floor(U.value(el,'bs-pos')/100*n)),target=M.callNumber(pos),r=M.binarySearch(n,target);
  const W=380,X=i=>60+i/(n-1||1)*W;let b='';
  r.steps.slice(0,14).forEach((s,k)=>{const y=14+k*18;b+=`<text x="8" y="${y+11}">${k+1}</text><rect x="${X(s.lo)}" y="${y}" width="${Math.max(X(s.hi)-X(s.lo),2)}" height="11" rx="2" fill="var(--panel2)" stroke="var(--line)"/><rect x="${X(s.mid)-1.5}" y="${y-2}" width="3" height="15" fill="${s.v===target?'var(--accent)':'var(--orange)'}"/>`;});
  if(r.steps.length>14)b+=`<text x="60" y="${14+14*18+11}">… ${r.steps.length-14}단계 더 (범위가 너무 좁아 그리지 않음)</text>`;
  b+=`<path d="M${X(pos)} 6V${Math.min(r.steps.length,15)*18+16}" stroke="var(--accent)" stroke-dasharray="3 3"/>`;
  const chart=U.svg(b,`이진 탐색이 범위를 반씩 줄여 ${r.comparisons}번 만에 청구기호 ${target}을 찾는 과정`);
  U.result(el,chart,`청구기호 <b>${target}</b> (앞에서 ${int(pos+1)}번째) · 이진 탐색 <strong>${r.comparisons}</strong>번 비교 · 앞에서부터 훑으면 <strong>${int(pos+1)}</strong>번<br>막대 한 줄이 한 번의 비교입니다. 회색 막대는 아직 남은 범위, 주황 선은 견준 가운데 책, 초록 선은 찾은 책입니다. ${int(n)}권이면 최악에도 ⌊log₂ n⌋+1 = <b>${Math.floor(M.log2(n))+1}</b>번이면 끝납니다.<br>정렬된 서가를 실제로 탐색하며 센 값입니다.`);
 },{'bs-pos':v=>v+'%'});
};
function drawTree(root,n){
 const nodes=[];let idx=0;const walk=(t,d)=>{if(!t)return;walk(t.l,d+1);nodes.push({t,d,x:idx++});walk(t.r,d+1);};walk(root,0);
 const depth=Math.max(...nodes.map(p=>p.d))+1,X=x=>20+x/(Math.max(n-1,1))*440,Y=d=>20+d*(240/Math.max(depth-1,1)),pos=new Map(nodes.map(p=>[p.t,p]));let b='';
 for(const p of nodes)for(const c of [p.t.l,p.t.r])if(c){const q=pos.get(c);b+=`<path d="M${X(p.x)} ${Y(p.d)}L${X(q.x)} ${Y(q.d)}" stroke="var(--line)"/>`;}
 for(const p of nodes)b+=`<circle cx="${X(p.x)}" cy="${Y(p.d)}" r="${n>31?3.5:6}" fill="${p.d===depth-1?'var(--orange)':'var(--accent)'}"/>`;
 return b;
}
ALLabs.tree=el=>{
 U.setup(el,U.select('tr-order','책을 넣는 순서',[['random','뒤섞인 순서'],['sorted','청구기호 순서대로']],'random')+U.select('tr-bal','트리 종류',[['plain','그냥 이진 탐색 트리'],['avl','균형을 맞추는 트리 (AVL)']],'plain')+U.range('tr-k','책 수 (2ᵏ−1권)',3,8,1,5));
 U.bind(el,()=>{
  const order=el.querySelector('#tr-order').value,bal=el.querySelector('#tr-bal').value,n=2**U.value(el,'tr-k')-1,r=M.treeExperiment(order,bal,n),best=Math.ceil(M.log2(n+1));
  const chart=r.height<=12&&n<=63?U.svg(drawTree(r.root,n),`책 ${n}권으로 만든 트리. 높이 ${r.height}`):U.bars(['트리 높이','평균 깊이','가장 낮은 높이 ⌈log₂(n+1)⌉'],[r.height,r.avgDepth,best],'층',{digits:1,colors:['var(--orange)','var(--accent)','var(--muted)']});
  U.result(el,chart,`책 <b>${n}권</b> · 높이 <strong>${r.height}</strong>층 (가장 낮게 지으면 ${best}층) · 평균 깊이 <b>${U.fmt(r.avgDepth,2)}</b> · 회전 ${int(r.rotations)}번<br>한 권을 찾는 비교 횟수는 그 책의 깊이와 같습니다. 높이가 n에 가까우면 트리는 줄 선 목록과 다르지 않습니다.${r.height>3*best?' <b>지금 트리는 한쪽으로만 자란 긴 줄입니다.</b>':''}<br>${n<=63&&r.height<=12?'점 하나가 책 한 권, 주황 점이 가장 깊은 책입니다. ':''}실제로 트리를 지으며 센 값입니다.`);
 },{'tr-k':k=>`${2**k-1}권`});
};
ALLabs.hash=el=>{
 U.setup(el,U.range('ha-n','넣는 책 수',10,2000,10,500)+U.range('ha-load','늘리는 기준 부하율 α',.5,3,.25,.75)+U.select('ha-resize','칸이 붐비면',[['double','칸 수를 두 배로 늘리고 다시 나누기'],['none','늘리지 않기 (칸 8개 그대로)']],'double'));
 U.bind(el,()=>{
  const n=U.value(el,'ha-n'),ml=U.value(el,'ha-load'),rs=el.querySelector('#ha-resize').value==='double',r=M.hashSim(n,8,ml,rs);
  const step=Math.max(1,Math.ceil(n/240)),cost=[],avg=[];let sum=0;r.costs.forEach((c,i)=>{sum+=c;if(i%step===0||i===n-1){cost.push([i+1,c]);avg.push([i+1,sum/(i+1)]);}});
  const chart=U.lines([{name:'그 책을 넣는 데 든 단계',points:cost,color:'var(--orange)'},{name:'지금까지 평균 (분할 상환)',points:avg,color:'var(--accent)'}],'넣은 책 수','단계',`책 ${n}권을 넣는 동안 한 권마다 든 단계와 평균`);
  U.result(el,chart,`칸 <b>${int(r.m)}</b>개 · 부하율 α = <b>${U.fmt(r.load,2)}</b> · 가장 긴 사슬 <b>${r.maxChain}</b> · 빈 칸 ${int(r.empty)}개<br>찾기 평균 <strong>${U.fmt(r.avgProbe,2)}</strong>번 확인 (이론값 1+α/2 = ${U.fmt(1+r.load/2,2)}) · 다시 나누며 옮긴 책 ${int(r.copies)}권 · 넣기 평균 <strong>${U.fmt(r.amortized,2)}</strong>단계<br>${rs?'튀어 오른 주황 선이 칸을 두 배로 늘린 순간입니다. 드물게 비싸도 평균은 작은 상수로 남습니다.':'<b>칸을 늘리지 않으면 사슬이 n/8로 길어져 해시가 줄 선 목록이 됩니다.</b>'} 키 ‘SN-청구기호’를 FNV-1a로 실제로 나누고 찾은 결과입니다.`);
 },{'ha-load':v=>v.toFixed(2)});
};
const METHODS={sort:'전체를 정렬한 뒤 앞에서 k권',heap:'크기 k 힙으로 한 번 훑기',scan:'가장 큰 것을 k번 찾기'};
ALLabs.heap=el=>{
 U.setup(el,U.range('hp-n','책 수 n',100,5000,100,2000)+U.range('hp-k','보여 줄 인기 책 k',1,50,1,10));
 U.bind(el,()=>{
  const n=U.value(el,'hp-n'),k=U.value(el,'hp-k'),items=M.borrowCounts(n),res=Object.fromEntries(Object.keys(METHODS).map(m=>[m,M.topK(items,k,m)]));
  const same=res.sort.top.every((x,i)=>x.id===res.heap.top[i].id&&x.id===res.scan.top[i].id);
  const names=Object.keys(METHODS),chart=U.bars(names.map(m=>METHODS[m]),names.map(m=>res[m].comparisons),'비교',{colors:['var(--blue)','var(--accent)','var(--orange)']});
  const list=res.heap.top.slice(0,5).map((x,i)=>`${i+1}. ${esc(x.title)} (${x.count}회)`).join(' · ');
  U.result(el,chart,`책 <b>${int(n)}권</b> 중 인기 <b>${k}권</b> · 세 방법의 답이 ${same?'모두 같습니다':'<b>서로 다릅니다</b>'}<br>${names.map(m=>`${METHODS[m]} <b>${int(res[m].comparisons)}</b>`).join(' · ')}<br>상위 ${Math.min(5,k)}권: ${list}<br>힙은 상위 k권 중 대출 횟수가 가장 적은 책을 뿌리에 두어, 새 책이 그보다 적게 빌렸으면 비교 한 번으로 넘깁니다. 대출 횟수는 고정 시드로 만든 합성 자료이고, 비교 횟수는 실제로 실행해 센 값입니다.`);
 });
};
})();
