/* 8~12장 실험: MoE 라우터, 타일 softmax, KV 캐시 변형, Chinchilla, 추측 디코딩, 설계표 다시 짜기. 계산은 A08Math에서 한다. */
(()=>{
'use strict';
const U=A08UI,M=A08Math,S=U.select,R=U.range,F=U.fmt;
const int=n=>Math.round(n).toLocaleString('en-US');
const big=n=>n>=1e12?F(n/1e12,2)+'T':n>=1e9?F(n/1e9,2)+'B':F(n/1e6,1)+'M';

A08Labs.router=el=>{
 U.setup(el,R('topk','토큰마다 고르는 전문가 수 k',1,4,1,2)+R('rounds','편향 조정 횟수',0,40,1,0));
 U.bind(el,()=>{const k=U.value(el,'topk'),n=U.value(el,'rounds'),r=M.moeRoute(k,n);
  U.result(el,U.bars(r.counts.map((_,e)=>'전문가 '+(e+1)),r.counts,'토큰 (점선 = 목표 '+F(r.target,0)+')',r.target,0),
  `토큰 ${r.T}개 × k = ${k} → 목표 전문가당 <b>${F(r.target,0)}</b>개 · 조정 ${n}회 뒤 가장 바쁜 전문가 <strong>${F(r.imbalance,2)}배</strong> (조정 전 ${F(r.imbalanceBefore,2)}배)<br>활성 비율 k/E = <b>${k}/${r.E} = ${F(r.active*100,1)}%</b> · 고른 전문가 중 가장 큰 게이트 평균 <b>${F(r.topGate,2)}</b> (편향은 선택에만 더하고 게이트는 원래 점수로 계산)<br>${r.imbalance<1.3?'편향이 쏠림을 거의 없앴습니다.':'아직 일부 전문가에 토큰이 몰립니다. 조정 횟수를 늘려 보세요.'} 라우터 점수의 치우침은 이 책의 가정이고, 선택과 편향 갱신은 실제 계산입니다.`);});
};

A08Labs.tiled=el=>{
 U.setup(el,S('tile','타일 크기 (한 번에 읽는 열쇠 수)',[1,2,4,8,16].map(v=>[v,String(v)]),4)+S('ctx','점수표 메모리를 볼 문맥 길이 N',[[2048,'2,048'],[8192,'8,192'],[32768,'32,768'],[131072,'131,072']],8192));
 U.bind(el,()=>{const t=U.value(el,'tile'),r=M.tiledAttention(t),mem=M.scoreMemory(U.value(el,'ctx'));
  const sums=r.steps.map(s=>[s.to+1,s.sum]),maxes=r.steps.map(s=>[s.to+1,s.max]),hi=Math.max(...sums.map(p=>p[1]),...maxes.map(p=>p[1]))*1.1,lo=Math.min(0,...maxes.map(p=>p[1]));
  const chart=U.plot({lines:[{data:[[0,0]].concat(sums),color:'var(--accent)'},{data:maxes,color:'var(--orange)',dashed:true}],points:sums.map(p=>[p[0],p[1],'var(--accent)',4]),xmin:0,xmax:16,ymin:lo,ymax:hi,xlabel:'지금까지 읽은 열쇠 수',ylabel:'이어 가는 합 ℓ · 최댓값 m',label:`타일 ${t}개씩 읽으며 이어 가는 합과 최댓값`});
  U.result(el,chart,`열쇠 ${r.N}개를 ${t}개씩 <b>${r.steps.length}</b>번에 나눠 읽음 · 마지막 최댓값 m = <b>${F(r.steps[r.steps.length-1].max,3)}</b>, 합 ℓ = <b>${F(r.steps[r.steps.length-1].sum,3)}</b><br>타일 결과와 한 번에 계산한 결과의 최대 차이 <strong>${r.err.toExponential(1)}</strong> (부동소수점 오차 수준) · 한 번에 붙잡는 점수 ${t}개 (전체 ${r.N}개)<br>N = ${int(mem.N)}에서 점수표 전체는 헤드 하나 fp16 <b>${F(mem.fullMB,1)} MB</b>, 128×128 타일은 <b>${F(mem.tileKB,1)} KB</b>입니다. softmax는 실제 계산이고, 메모리는 크기를 센 값입니다.`);});
};

const KVK=Object.keys(M.KV_VARIANTS);
A08Labs.kvvar=el=>{
 U.setup(el,R('ctxexp','문맥 길이 N = 2의 거듭제곱 (1K~128K)',10,17,1,15)+S('kvsel','자세히 볼 변형',KVK.map(k=>[k,M.KV_VARIANTS[k].label]),'gqa'));
 U.bind(el,()=>{const N=2**U.value(el,'ctxexp'),v=U.text(el,'kvsel'),all=KVK.map(k=>M.kvCache(k,N)),r=all[KVK.indexOf(v)],mha=all[0];
  el.querySelector('#ctxexp-value').textContent=int(N);
  U.result(el,U.bars(all.map(x=>x.label),all.map(x=>x.gb),'GB (점선 = 80GB GPU 하나)',80,1),
  `N = <b>${int(N)}</b> · ${r.label}: 토큰 하나·층 하나 <b>${int(r.perTokLayer)}</b>바이트 × 80층 × 유효 토큰 ${int(r.effTokens)} = <strong>${F(r.gb,2)} GB</strong><br>MHA 대비 <b>${F(mha.gb/r.gb,1)}분의 1</b> · ${r.gb<=80?'80GB GPU 하나에 들어갑니다(가중치는 별도).':'KV 캐시만으로 80GB를 넘습니다.'}<br>원본 레슨의 70B급 설정(80층, 질문 헤드 64, d_head 128, fp16, 동시 요청 1)으로 한 실제 계산입니다. 슬라이딩 창은 5:1 혼합을 가정했고 품질 차이는 계산하지 않습니다.`);});
};

A08Labs.chinchilla=el=>{
 U.setup(el,R('logc','계산량 log₁₀ C (FLOPs)',19,25,0.5,23)+S('ratio','토큰/파라미터 비율 D/N',[['opt','식으로 찾은 최적'],['1.7','1.7 (GPT-3식)'],['20','20 (흔한 어림)'],['200','200'],['1875','1,875 (Llama 3 8B식)']],'20'));
 U.bind(el,()=>{const lc=U.value(el,'logc'),C=10**lc,rs=U.text(el,'ratio'),o=M.chOptimal(C),c=rs==='opt'?o:M.chAtRatio(C,Number(rs));
  const xs=[];for(let e=6.5;e<=12.5;e+=0.1)xs.push([e,M.chLoss(10**e,C/(6*10**e))]);const ys=xs.map(p=>p[1]).filter(Number.isFinite),lo=Math.floor(Math.min(...ys)*10)/10,hi=Math.min(lo+2,Math.max(...ys));
  const chart=U.plot({lines:[{data:xs,color:'var(--accent)'}],points:[[Math.log10(o.N),o.L,'var(--accent)',7],[Math.log10(c.N),c.L,'var(--orange)',6]],xmin:6.5,xmax:12.5,ymin:lo,ymax:hi,xlabel:'log₁₀ N (파라미터)',ylabel:'손실 L',label:`C = 10^${lc}에서 N에 따른 Chinchilla 손실`});
  el.querySelector('#logc-value').textContent='10^'+lc;
  U.result(el,chart,`C = 10^${lc} · 고른 비율 D/N = <b>${F(c.ratio,1)}</b> → N = <b>${big(c.N)}</b>, D = <b>${big(c.D)}</b> 토큰, 손실 <strong>${F(c.L,4)}</strong><br>같은 C의 최적: N = <b>${big(o.N)}</b>, D = <b>${big(o.D)}</b>, 비율 <b>${F(o.ratio,0)}</b>, 손실 <b>${F(o.L,4)}</b> · 손실 차이 <b>+${F(Math.max(0,c.L-o.L),4)}</b>, 모델 크기는 최적의 <b>${F(c.N/o.N,2)}배</b>(추론 비용도 대략 이 비율)<br>원본 레슨이 인용한 상수로 한 실제 계산입니다. 초록 점이 최적, 주황 점이 고른 비율입니다. 손실은 어림이며 측정값이 아닙니다.`);});
};

A08Labs.spec=el=>{
 U.setup(el,R('alpha','수락률 α',0.3,0.95,0.05,0.75)+S('ndraft','초안 토큰 수 n',[1,2,3,4,5,6,7,8].map(v=>[v,String(v)]),5));
 U.bind(el,()=>{const a=U.value(el,'alpha'),n=U.value(el,'ndraft'),r=M.spec(a,n),b=M.specBest(a);el.querySelector('#alpha-value').textContent=F(a,2);
  const line=[];for(let k=1;k<=12;k++)line.push([k,M.spec(a,k).speedup]);const hi=Math.max(2,Math.ceil(Math.max(...line.map(p=>p[1]))*2)/2);
  const chart=U.plot({lines:[{data:[[1,1],[12,1]],color:'var(--muted)',dashed:true},{data:line,color:'var(--accent)'}],points:[[n,r.speedup,'var(--orange)',7],[b.n,b.speedup,'var(--accent)',5]],xmin:1,xmax:12,ymin:0,ymax:hi,xlabel:'초안 토큰 수 n',ylabel:'속도 향상 (배)',label:`α = ${a}에서 초안 수에 따른 속도 향상`});
  U.result(el,chart,`α = ${F(a,2)}, n = ${n} → 검증 한 번에 기대 토큰 (1 − α^${n+1}) / (1 − α) = <b>${F(r.tokens,2)}</b>개 · 한 단계 비용 1 + ${n}×0.1 = <b>${F(r.cost,1)}</b><br>속도 향상 <strong>${F(r.speedup,2)}배</strong> · 토큰 100개에 큰 모델 호출 <b>${F(r.callsPer100,0)}</b>번 (그냥 생성은 100번) · 이 α에서 가장 좋은 n = <b>${b.n}</b> (${F(b.speedup,2)}배)<br>${r.speedup<1?'초안 비용이 이득보다 커서 오히려 느려집니다.':''}초안 비용 비율 0.1(원본 예 3ms/30ms)과 토큰마다 독립인 수락을 가정한 실제 계산입니다.`);});
};

const EVIDENCE={none:'바꾸지 않으면 기준선과 같습니다. 다른 칸을 골라 비교하세요.',gqa:'K·V 헤드를 줄인 뒤의 검증 손실과 긴 문맥 품질은 계산하지 않았습니다. MHA 체크포인트를 GQA로 바꿔 다시 학습한 뒤 같은 데이터로 비교해야 합니다.',swa:'창 밖의 먼 정보를 찾는 능력은 계산하지 않았습니다. 전역 층 비율을 바꿔 가며 긴 문서 검색 시험을 해야 합니다.',spec:'수락률 0.7은 가정입니다. 실제 대화·코드 데이터에서 α를 재고, 초안 모델 메모리와 KV 되돌리기 비용을 측정해야 합니다.',moe:'MoE가 손실을 얼마나 낮추는지는 Chinchilla 식으로 계산할 수 없습니다. 같은 활성 계산의 밀집 모델과 학습 곡선을 비교해야 합니다. 모든 전문가를 올릴 메모리도 늘어납니다.',tokens:'손실 감소는 식의 어림이고 학습 계산이 10배 듭니다. 그만큼의 좋은 데이터가 있는지, 실제 검증 손실이 따라 내려가는지 확인해야 합니다.'};
A08Labs.redesign=el=>{
 U.setup(el,S('req','새 요구',Object.keys(M.REQS).map(k=>[k,M.REQS[k].label]),'long')+S('change','바꿀 칸',Object.keys(M.CHANGES).map(k=>[k,M.CHANGES[k]]),'none'));
 U.bind(el,()=>{const q=U.text(el,'req'),c=U.text(el,'change'),r=M.redesign(q,c),b=M.redesign(q,'none');
  const rows=[['메모리 (가중치 + KV)',`${F(b.memGB,1)} GB`,`${F(r.memGB,1)} GB`],['디코드 속도',`1.00배`,`${F(r.speed,2)}배`],['학습 손실 (Chinchilla 어림)',F(b.loss,4),r.loss===null?'계산 불가':F(r.loss,4)],['토큰당 활성 파라미터',big(b.active),big(r.active)],['전체 파라미터',big(b.total),big(r.total)]];
  const table=`<div class="kit-panel table-wrap"><table><thead><tr><th>항목</th><th>기준 도란</th><th>바꾼 뒤</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('')}</tbody></table></div>`;
  const verdict=r.pass===null?'판정 불가':r.pass?'요구 통과':'요구 미달';
  U.result(el,table,`요구: <b>${r.reqLabel}</b> · 바꾼 칸: <b>${r.label}</b> → <strong>${verdict}</strong><br>${q==='long'?`24GB 기준 메모리 ${F(r.memGB,1)} GB (KV ${F(r.kvGB,1)} GB)`:q==='fast'?`속도 ${F(r.speed,2)}배 (목표 1.5배)`:`손실 ${r.loss===null?'계산 불가':F(r.loss,4)} (기준 ${F(r.baseLoss,4)}), 활성 파라미터 ${big(r.active)}`}<br><b>부족한 증거</b> ${EVIDENCE[c]}<br>앞 장의 식을 다시 쓴 실제 계산이며, 디코드 속도를 메모리 읽기량으로 어림한 것과 도란의 크기는 이 책의 가정입니다.`);});
};
})();
