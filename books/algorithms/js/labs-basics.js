/* 1~3장 실험: 단계 세기, 배열과 연결 리스트, 스택과 큐, 정렬. 계산은 ALMath에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=ALUI,M=ALMath,big=U.big,int=U.int;
const TASKS={linear:'번호로 한 권 찾기 (앞에서부터 훑기)',pairs:'중복 등록 찾기 (모든 쌍 비교)',halving:'정렬된 서가 반씩 줄이기 (이진 탐색)'};
ALLabs.count=el=>{
 U.setup(el,U.select('ct-task','할 일',Object.entries(TASKS),'linear')+U.range('ct-n','책 수 n',100,2000,100,1000));
 U.bind(el,()=>{
  const task=el.querySelector('#ct-task').value,n=U.value(el,'ct-n'),xs=Array.from({length:10},(_,k)=>Math.round(n*(k+1)/10));
  const pts=xs.map(x=>[x,M.measure(task,x)]),here=pts.at(-1)[1],g=M.growth[task];
  const chart=U.lines([{name:'실제로 센 단계',points:pts,color:'var(--accent)'},{name:'n (책 수와 같은 선)',points:xs.map(x=>[x,x]),color:'var(--blue)',dash:true}],'책 수 n','단계',`${TASKS[task]}: 책 ${n}권에서 ${here}단계`,{ymax:Math.max(here,n)});
  U.result(el,chart,`책 <b>${int(n)}권</b>에서 실제로 센 단계 <strong>${int(here)}</strong> · 책 수를 두 배(${int(n*2)}권)로 하면 <b>${big(g(n*2))}</b>단계가 됩니다(${U.fmt(g(n*2)/g(n),2)}배).<br>규모 장부: 1만 권 <b>${big(g(1e4))}</b> → 100만 권 <b>${big(g(1e6))}</b>단계 (${big(g(1e6)/g(1e4))}배).<br>찾는 번호는 서가에 없는 번호라 최악의 경우를 셉니다. 실제로 실행해 센 값이고, 1만·100만 권은 같은 꼴로 늘린 예측입니다.`);
 });
};
const OPS={front:'맨 앞에 한 권 끼우기',back:'맨 뒤에 한 권 붙이기',read:'가운데 책 읽기',remove:'가운데 책 빼기'};
ALLabs.ops=el=>{
 U.setup(el,U.select('op-op','하는 일',Object.entries(OPS),'front')+U.range('op-n','대출 목록 길이 n',10,1000,10,100));
 U.bind(el,()=>{
  const op=el.querySelector('#op-op').value,n=U.value(el,'op-n'),a=M.listCost('array',op,n),l=M.listCost('linked',op,n);
  const chart=U.bars(['배열 · 옮긴 칸','배열 · 합계','연결 리스트 · 따라간 연결','연결 리스트 · 합계'],[a.moves,a.total,l.follows,l.total],'단계',{colors:['var(--accent)','var(--accent)','var(--blue)','var(--blue)']});
  const win=a.total<l.total?'배열':a.total>l.total?'연결 리스트':'둘 다 같음';
  U.result(el,chart,`${OPS[op]} · 길이 <b>${int(n)}</b><br>배열: 칸 옮기기 <b>${int(a.moves)}</b>번, 합계 <strong>${int(a.total)}</strong>단계 · 연결 리스트: 연결 따라가기 <b>${int(l.follows)}</b>번, 합계 <strong>${int(l.total)}</strong>단계 → 더 싼 쪽: <b>${win}</b><br>배열은 칸이 붙어 있어 k번째를 바로 읽지만 끼우고 빼면 뒤 칸을 모두 옮깁니다. 연결 리스트(꼬리 표시가 없는 한 줄 연결)는 끼우기는 싸지만 그 자리까지 걸어가야 합니다. 실제 자료구조를 만들어 센 값입니다.`);
 });
};
ALLabs.cart=el=>{
 U.setup(el,U.select('ca-kind','담는 상자',[['queue','예약 대기열 (큐 · 먼저 온 순서)'],['stack','반납 카트 (스택 · 맨 위부터)']],'queue')+U.range('ca-in','차례마다 들어오는 책',1,3,1,2)+U.range('ca-out','차례마다 처리하는 책',1,3,1,1));
 U.bind(el,()=>{
  const kind=el.querySelector('#ca-kind').value,a=U.value(el,'ca-in'),s=U.value(el,'ca-out'),r=M.serveSim(kind,a,s,12);
  const cells=r.done.slice(0,24).map(d=>`<span class="cell ${d.wait>3?'late':''}" title="${d.id+1}번 책">${d.id+1}<small>${d.wait}</small></span>`).join('');
  const left=r.left.slice(0,24).map(b=>`<span class="cell waiting">${b.id+1}</span>`).join('');
  const chart=`<div class="queue-view"><p class="caption">처리한 순서 (작은 숫자 = 기다린 차례 수)</p><div class="cells">${cells||'<em>없음</em>'}</div><p class="caption">12차례 뒤에도 상자에 남은 책</p><div class="cells">${left||'<em>없음</em>'}</div></div>`;
  const first=r.first?`1번 책은 ${r.first.wait}차례 기다렸습니다.`:'<b>1번 책은 12차례가 지나도 처리되지 않았습니다.</b>';
  U.result(el,chart,`${kind==='queue'?'큐':'스택'} · 들어옴 ${a} / 처리 ${s} · 처리한 책 <b>${r.done.length}권</b>, 남은 책 <b>${r.left.length}권</b><br>처리한 책의 평균 대기 <strong>${U.fmt(r.avgWait,1)}</strong>차례 · 가장 오래 기다린 책 <strong>${r.maxWait}</strong>차례 · ${first}<br>넣기와 꺼내기는 둘 다 한 단계입니다. 달라지는 것은 누가 먼저 나오느냐입니다. 실제로 12차례를 흉내 낸 결과입니다.`);
 });
};
const SORT_NAMES={insertion:'삽입 정렬',merge:'병합 정렬',quick:'퀵 정렬 (맨 앞 기준)'};
ALLabs.sort=el=>{
 U.setup(el,U.select('so-order','처음 서가 상태',[['random','뒤섞임'],['sorted','이미 정렬됨'],['reversed','거꾸로 꽂힘']],'random')+U.range('so-n','책 수 n',8,512,8,128));
 U.bind(el,()=>{
  const order=el.querySelector('#so-order').value,n=U.value(el,'so-n'),input=M.makeInput(order,n),res=Object.fromEntries(Object.entries(M.SORTS).map(([k,f])=>[k,f(input)])),lb=M.sortLowerBound(n);
  const ok=Object.values(res).every(r=>r.sorted.every((v,i)=>!i||r.sorted[i-1]<=v));
  const names=Object.keys(SORT_NAMES),vals=names.map(k=>res[k].comparisons);
  const chart=U.bars([...names.map(k=>SORT_NAMES[k]),'하한 ⌈log₂ n!⌉'],[...vals,lb],'비교',{colors:['var(--blue)','var(--accent)','var(--orange)','var(--muted)']});
  const best=names.reduce((x,k)=>res[k].comparisons<res[x].comparisons?k:x,names[0]);
  U.result(el,chart,`책 <b>${n}권</b> · ${el.querySelector('#so-order').selectedOptions[0].text} · 세 방법 모두 ${ok?'바르게 정렬함':'<b>정렬 실패</b>'}<br>${names.map(k=>`${SORT_NAMES[k]} <b>${int(res[k].comparisons)}</b>`).join(' · ')} · 가장 적은 쪽: <strong>${SORT_NAMES[best]}</strong><br>비교만으로 정렬하는 방법은 최악의 입력에서 적어도 <b>${int(lb)}</b>번(⌈log₂ ${n}!⌉) 비교해야 합니다. 하한보다 적게 나온 칸은 그 입력이 운 좋게 쉬웠다는 뜻입니다. 실제로 정렬하며 센 비교 횟수입니다.`);
 });
};
})();
