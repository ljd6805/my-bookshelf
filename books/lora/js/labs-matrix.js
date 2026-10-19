/* 작은 행렬 실험(2·3·4·6·7·9·10장). 계산은 LRMath의 실제 계산이고, 행렬과 문제는 고정 씨앗으로 지은 장난감이다. */
(()=>{
'use strict';
const M=LRMath,U=LRUI,L=LRLabs;
let deltaCache=null,decCache=null;
const delta=()=>deltaCache||(deltaCache=M.targetDelta());
const dec=()=>decCache||(decCache=M.svd(delta()));
const randomCache={};
function matrixOf(kind){
 if(kind==='delta')return {A:delta(),d:dec()};
 if(!randomCache.m){const A=M.randn(16,16,M.rng(9),0.5);randomCache.m={A,d:M.svd(A)};}
 return randomCache.m;
}
L.rank=el=>{
 U.setup(el,U.select('kind','행렬',[['delta','목표 변화량 ΔW(16×16)'],['random','무작위 행렬(16×16)']],'delta')+U.range('k','남길 성분 수 k',0,16,1,3));
 U.bind(el,()=>{
  const kind=el.querySelector('#kind').value,k=U.value(el,'k'),{A,d}=matrixOf(kind),lr=M.lowRank(A,k,d);
  const pics=`<div class="lr-grids"><figure>${U.grid(A,{label:'원래 행렬의 칸 그림'})}<figcaption class="caption">원래 행렬</figcaption></figure><figure>${U.grid(k?lr.Ak:A.map(r=>r.map(()=>0)),{label:`성분 ${k}개로 만든 근사의 칸 그림`})}<figcaption class="caption">성분 ${k}개 근사</figcaption></figure></div>`;
  U.result(el,pics+U.bars(d.s.map((_,i)=>`σ${i+1}`),d.s,{digits:2,mark:i=>i<k}),`특잇값이 큰 성분 ${k}개만 남기면 상대 오차 <b>${U.pct(lr.rel,1)}</b>, 제곱합(에너지)의 <b>${U.pct(lr.energy,1)}</b>를 담습니다.<br>저장할 수: k·(16 + 16) = <b>${lr.store}개</b>(원래 256개). ${kind==='delta'?`σ₁~σ₃이 ${d.s.slice(0,3).map(x=>U.fmt(x,2)).join('·')}로 크고 넷째부터는 ${U.fmt(d.s[3],2)} 아래라, 세 성분 뒤로는 오차가 천천히 줄어듭니다.`:'무작위 행렬은 특잇값이 고르게 퍼져 있어 성분을 하나 더할 때마다 조금씩만 좋아집니다.'}`);
 });
};
const curveCache={};
L.intrinsic=el=>{
 U.setup(el,U.select('kind','문제',[['focused','입력이 몇 방향에 몰린 문제'],['spread','입력이 고르게 퍼진 문제']],'focused')+U.range('d','학습할 부분공간 차원 d',0,40,1,4));
 U.bind(el,()=>{
  const kind=el.querySelector('#kind').value,d=U.value(el,'d'),c=curveCache[kind]||(curveCache[kind]=M.intrinsicCurve(kind)),prob=M.subspaceProblem(kind),p=M.subspaceFit(prob,d,6).perf;
  const chart=U.lines([{name:'부분공간에서 낸 성능',pts:c.pts,color:'var(--blue)'},{name:`d = ${d}`,pts:[[d,p]],color:'var(--accent)',dots:6}],{xLabel:'학습한 차원 d (전체 40)',yLabel:'성능 = 1 − 손실/처음 손실',yMax:1,hline:0.9,hlineLabel:'90%'});
  U.result(el,chart,`파라미터 40개 가운데 무작위로 고른 <b>${d}차원</b>에서만 움직여 낸 성능 <b>${U.pct(p,1)}</b>. 90%에 처음 닿는 차원(d90)은 <b>${c.d90??'40 안에서 없음'}</b>입니다(점검한 d: ${c.pts.map(x=>x[0]).join(', ')}).<br>${kind==='focused'?'입력 분산이 몇 방향에 몰려 있어, 무작위 방향 몇 개로도 그 방향들을 거의 덮습니다.':'입력이 모든 방향에 고르게 퍼져 있으면 파라미터를 거의 다 써야 90%에 닿습니다.'} 고정 씨앗으로 지은 선형 회귀 장난감이며 언어 모델 측정이 아닙니다.`);
 });
};
const trainCache={};
function runs(key,f){return trainCache[key]||(trainCache[key]=f());}
L.formula=el=>{
 U.setup(el,U.select('r','랭크 r',[1,2,4,8,16].map(r=>[String(r),'r = '+r]),'4')+U.range('steps','경사하강 걸음 수',0,600,50,300)+U.select('initB','B의 시작값',[['zero','0으로 시작(LoRA)'],['random','무작위로 시작']],'zero'));
 U.bind(el,()=>{
  const r=Number(el.querySelector('#r').value),steps=U.value(el,'steps'),initB=el.querySelector('#initB').value,D=delta();
  const full=runs(`f-${r}-${initB}`,()=>M.trainLora({target:D,r,steps:600,initB})),best=M.lowRank(D,r,dec()).rel,cur=steps?M.trainLora({target:D,r,steps,initB}):{err:full.curve[0][1],start:full.start,gamma:full.gamma};
  const chart=U.lines([{name:`r = ${r}, 처음 600걸음`,pts:full.curve,color:'var(--muted)',dash:true},{name:`r = ${r}, ${steps}걸음까지`,pts:full.curve.filter(p=>p[0]<=steps),color:'var(--accent)'}],{xLabel:'걸음',yLabel:'상대 오차 ‖γBA − ΔW‖/‖ΔW‖',yMax:Math.max(1.05,full.curve[0][1]),hline:best,hlineLabel:`SVD 최선 ${U.pct(best,1)}`});
  U.result(el,chart,`시작할 때 ‖γBA‖ = <b>${U.fmt(full.start,3)}</b>${initB==='zero'?' (B가 0이라 처음 모델은 원래 모델과 같습니다 ✓)':' (B가 무작위라 학습 전부터 원래 모델이 바뀌어 있습니다 ✗)'}. ${steps}걸음 뒤 상대 오차 <b>${U.pct(cur.err,1)}</b>, 같은 랭크에서 SVD로 자른 최선값 ${U.pct(best,1)}.<br>학습한 수 B ${16*r}개 + A ${r*16}개 = ${32*r}개(ΔW 전체 256개), γ = α/r = ${U.fmt(full.gamma,2)}.`);
 });
};
L.scaling=el=>{
 U.setup(el,U.select('mode','배율 γ',[['r','α/r (LoRA)'],['sqrt','α/√r (rsLoRA)']],'r')+U.range('alpha','α',2,16,2,8)+U.range('ssteps','걸음 수(같은 학습률 0.02)',50,400,50,100));
 U.bind(el,()=>{
  const mode=el.querySelector('#mode').value,alpha=U.value(el,'alpha'),steps=U.value(el,'ssteps'),D=delta(),ranks=[1,2,4,8,16];
  const res=['r','sqrt'].map(md=>ranks.map(r=>[r,M.trainLora({target:D,r,steps,alpha,mode:md}).err]));
  const sel=res[mode==='r'?0:1],first=ranks.map(r=>M.firstStep({target:D,r,alpha,mode})),bestR=sel.reduce((a,b)=>b[1]<a[1]?b:a);
  const chart=U.lines([{name:'α/r',pts:res[0],color:mode==='r'?'var(--accent)':'var(--muted)',dots:4},{name:'α/√r',pts:res[1],color:mode==='sqrt'?'var(--accent)':'var(--muted)',dots:4,dash:true}],{xLabel:'랭크 r (1·2·4·8·16)',yLabel:`${steps}걸음 뒤 상대 오차`,logX:true,yMax:1});
  U.result(el,chart,`${mode==='r'?'α/r':'α/√r'} ✓: ${sel.map(([r,e])=>`r=${r} ${U.pct(e,1)}`).join(' · ')}. 가장 낮은 오차는 <b>r = ${bestR[0]}</b>입니다.<br>첫 걸음에 γBA가 움직인 크기: ${ranks.map((r,i)=>`r=${r} ${U.fmt(first[i],3)}`).join(' · ')}. B가 0에서 출발하면 이 크기는 γ²·r에 비례하므로 α/r에서는 r이 커질수록 줄고, α/√r에서는 거의 같습니다.`);
 });
};
L.merge=el=>{
 U.setup(el,U.select('prec','합친 W를 저장하는 정밀도',[['fp32','fp32 (이 실험의 계산 정밀도에 가까움)'],['fp16','fp16']],'fp16')+U.range('reps','어댑터를 합쳤다 빼기 반복',1,50,1,1)+U.select('mr','랭크 r (4096×4096 층 기준 곱셈 수)',[1,4,8,16,64].map(r=>[String(r),'r = '+r]),'8'));
 U.bind(el,()=>{
  const prec=el.querySelector('#prec').value,reps=U.value(el,'reps'),r=Number(el.querySelector('#mr').value),d=M.mergeDemo({precision:prec,reps}),extra=M.extraMults(4096,4096,r),base=4096*4096;
  const chart=U.table(['항목','값'],[['합치기 전후 출력 차이(최대)',d.outDiff.toExponential(2)],[`합쳤다 빼기 ${reps}번 뒤 W의 어긋남(최대)`,d.drift.toExponential(2)],['W 원소 크기(최대)',U.fmt(d.wScale,3)],['합치지 않을 때 더 드는 곱셈',`${U.int(extra)}회`],['합쳤을 때 더 드는 곱셈','0회']],i=>i===4)+U.bars(['W·x 곱셈','합치지 않은 B·A 몫'],[base,extra].map(v=>v/1e6),{unit:'M',digits:3,mark:i=>i===0});
  U.result(el,chart,`8×8 W에 r=2 어댑터를 더한 W′ = W + γBA로 계산한 출력은 따로 더한 출력과 최대 <b>${d.outDiff.toExponential(1)}</b> 다릅니다${prec==='fp16'?' (W′를 fp16으로 저장해 생긴 반올림)':' (계산 오차 수준)'}. 두 어댑터를 번갈아 ${reps}번 합쳤다 빼면 W가 최대 <b>${d.drift.toExponential(1)}</b> 어긋납니다.<br>4096×4096 층에서 합치지 않은 LoRA r=${r}은 토큰마다 곱셈 ${U.int(extra)}회(W·x의 ${U.pct(extra/base,2)})를 더하고, 합치면 0회입니다.`);
 });
};
L.variants=el=>{
 U.setup(el,U.modelSelect()+U.select('vr','LoRA·DoRA 랭크 r (q·v)',[2,4,8,16,64].map(r=>[String(r),'r = '+r]),'8')+U.select('bn','어댑터 병목 차원 m',[16,64,256].map(m=>[String(m),'m = '+m]),'64')+U.range('pl','프리픽스·프롬프트 길이(토큰)',1,100,1,10));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#model').value],r=Number(el.querySelector('#vr').value),bn=Number(el.querySelector('#bn').value),pl=U.value(el,'pl'),N=M.countParams(m).total;
  const v=M.variants(m,{r,targets:['q','v'],bottleneck:bn,prefix:pl}),top=v.reduce((a,b)=>b.params>a.params?b:a);
  U.result(el,U.bars(v.map(x=>x.name),v.map(x=>x.params/1e6),{unit:'M',digits:3,mark:i=>v[i].id==='lora'})+U.table(['방법','학습 파라미터','전체 대비','추론 때 더 드는 것'],v.map(x=>[x.name,U.int(x.params),U.pct(x.params/N,3),x.extra?`${x.note}, 토큰마다 곱셈 ${U.int(x.extra)}회`:x.note])),`${m.name}에서 학습 파라미터가 LoRA(r = ${r})는 <b>${U.int(v[0].params)}개</b>를 학습합니다. 가장 많은 방법은 <b>${top.name}</b>(${U.int(top.params)}개), 가장 적은 방법은 프롬프트 튜닝(${U.int(v[4].params)}개)입니다.<br>DoRA는 LoRA보다 크기 벡터 ${U.int(v[1].params-v[0].params)}개를 더 학습합니다. 어댑터는 층마다 두 번 더 지나가 토큰마다 곱셈 ${U.int(v[2].extra)}회가 늘고, 프리픽스는 층마다 키·값 ${pl}개를 어텐션이 더 봅니다. 성능은 여기서 비교하지 않고 개수만 셉니다. 성능은 각 논문이 서로 다른 모델과 작업에서 보고했습니다.`);
 });
};
L.forgetting=el=>{
 U.setup(el,U.select('frank','변화에 허락한 랭크',[['1','r = 1'],['2','r = 2'],['3','r = 3'],['4','r = 4'],['full','제한 없음(전체)']],'2')+U.range('overlap','두 작업 입력이 겹치는 방향 수',0,6,1,3));
 U.bind(el,()=>{
  const rk=el.querySelector('#frank').value,ov=U.value(el,'overlap'),ranks=[1,2,3,4,'full'],pts=ranks.map(k=>M.forgetRun({rank:k==='full'?'full':Number(k),overlap:ov})),i=ranks.map(String).indexOf(rk),cur=pts[i];
  const chart=U.lines([{name:'랭크 1·2·3·4·전체',pts:pts.map(p=>[p.learned*100,p.forgot]),color:'var(--blue)',dots:4},{name:`선택: ${rk==='full'?'전체':'r = '+rk}`,pts:[[cur.learned*100,cur.forgot]],color:'var(--accent)',dots:7}],{xLabel:'작업 B에서 배운 양(%)',yLabel:'작업 A에서 잊은 양',yMax:Math.max(0.5,...pts.map(p=>p.forgot))*1.05,xMax:100});
  U.result(el,chart,`${rk==='full'?'제한 없는 변화':'랭크 '+rk+' 변화'} ✓: 작업 B에 필요한 변화의 <b>${U.pct(cur.learned,1)}</b>를 배우고, 작업 A의 출력은 <b>${U.fmt(cur.forgot,3)}</b>만큼 바뀝니다. 같은 조건에서 제한 없는 변화는 ${U.pct(pts[4].learned,0)}를 배우고, 작업 A의 출력은 ${U.fmt(pts[4].forgot,3)}만큼 바뀝니다.<br>${ov===0?'두 작업의 입력이 한 방향도 겹치지 않으면 무엇을 배워도 작업 A는 그대로입니다.':`두 작업이 ${ov}방향을 함께 쓰므로, 배운 변화가 그 방향에 닿는 만큼 작업 A의 출력도 바뀝니다.`} 랭크를 줄이면 덜 배우고 덜 바뀝니다. 12차원 선형 장난감의 닫힌 식 계산이며 논문의 숫자를 재현하지 않습니다.`);
 });
};
})();
