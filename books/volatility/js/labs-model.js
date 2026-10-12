/* 4~6장 실험: 동전으로 만든 가격, 두꺼운 꼬리, 자기상관. 생성기는 VMath.randomWalk(시드를 받는 결정적 난수)이고,
   몬테카를로는 VMath.monteCarlo로 첫 시드에서 7919씩 더한 시드를 쓴다. 같은 입력의 결과는 VUI.memo에 남겨 다시 계산하지 않는다.
   경로 수는 1,000개 이하로 묶어 입력마다 바로 다시 계산해도 화면이 멈추지 않게 한다(t 잡음은 자유도만큼 난수를 더 뽑으므로 400개까지). */
(()=>{
'use strict';
const U=VUI,M=VMath,F=U.fmt,P=U.pct,PP=U.ppct,D=U.DATA;
const BASE={n:250,vol:.01,seed:1};
/* 4장: 한 경로(시드)와 시드 1부터 만든 경로 묶음의 끝값 분포. */
function coinPaths(vol,drift,N){return U.memo(`coin|${vol}|${drift}|${N}`,()=>M.monteCarlo({n:250,vol,drift,seed:1},N,q=>q));}
VLabs.coin=el=>{
 U.setup(el,U.number('cseed','그려 볼 경로의 시드',1,99999,1,39,'같은 시드면 같은 경로가 나옵니다')+U.range('cdrift','하루 추세 μ (%)',-.2,.2,.01,0,'0이면 추세가 없는 동전')+U.range('cvol','하루 변동성 σ (%)',.2,3,.1,1)+U.select('cpaths','묶음의 경로 수 (시드 1부터)',[['50','50개'],['200','200개'],['400','400개'],['1000','1,000개']],'200')+U.select('cband','멀리 간 경로를 세는 기준',[['sigma','1년 로그 수익률이 ±σ√250 밖'],['far20','끝값이 시작가에서 20% 넘게 벗어남']],'sigma'));
 U.bind(el,()=>{
  const seed=U.num(el,'cseed'),drift=Number(U.value(el,'cdrift'))/100,vol=Number(U.value(el,'cvol'))/100,N=Number(U.value(el,'cpaths')),band=U.value(el,'cband');
  if(seed===null||!Number.isInteger(seed))return U.result(el,'',U.problem('시드','1에서 99,999 사이의 정수를 넣어야 합니다.'));
  const one=M.randomWalk({n:250,vol,drift,seed}),ret=one[250]/one[0]-1,mdd=M.maxDrawdown(one).mdd,paths=coinPaths(vol,drift,N);
  const ends=paths.map(q=>Math.log(q[250]/q[0])),sig=vol*Math.sqrt(250),far=band==='sigma'?v=>Math.abs(v)>sig:v=>Math.abs(Math.expm1(v))>.2,cnt=ends.filter(far).length;
  const shown=paths.slice(0,40).map(q=>({values:q,color:'var(--muted)',dash:'',width:1,opacity:.35}));
  const lines=band==='sigma'?[[-sig,`−${F(sig*100,1)}%`],[sig,`+${F(sig*100,1)}%`]]:[[Math.log(.8),'−20%'],[Math.log(1.2),'+20%']];
  const chart=U.lines({series:[...shown,{values:one,name:`시드 ${seed} 경로`,color:'var(--accent)',dash:'',width:2.6,mark:'━'}],xunit:'일',hlines:[[100,'시작가 100']],label:`시드 ${seed} 경로는 1년 뒤 ${F(one[250],2)}. 회색 선은 시드 1부터 만든 경로 가운데 앞 40개입니다.`})
   +U.histogram({values:ends,bins:24,lines,outside:far,fmt:v=>`${U.sfmt(v*100,0)}%`,title:`1년 로그 수익률 · 경로 ${F(N)}개`,label:`경로 ${N}개의 1년 로그 수익률 분포. 기준 밖 ${cnt}개`});
  const rule=band==='sigma'?`1년 로그 수익률이 ±σ√250 = ±${F(sig*100,1)}% 밖으로 나간 경로는 <b>${F(cnt)}개(${P(cnt/N,1)})</b>로, 정규분포에서 기대하는 약 31.7%와 견줄 수 있습니다.`:`끝값이 시작가에서 <b>20% 넘게</b> 벗어난 경로는 <b>${F(cnt)}개(${P(cnt/N,1)})</b>입니다.`;
  U.result(el,chart,`시드 ${seed} 경로: 100에서 1년 뒤 <b>${F(one[250],2)}</b>, 곧 <b>${PP(ret,1)}</b>이고 고점에서 가장 깊이 빠진 낙폭은 <b>${P(mdd,1)}</b>입니다. 이 생성기의 하루 추세는 μ = ${PP(drift)}${Math.abs(drift)<1e-12?'로, 추세 없이 던진 동전입니다':'입니다'}.<br>시드 1부터 경로 ${F(N)}개: 1년 로그 수익률의 표준편차는 이론으로 σ × √250 = <b>${F(sig*100,1)}%</b>, 실제로 센 값은 ${P(M.sd(ends),1)}입니다. ${rule}${U.kind(['real','gen'],'정규 잡음, 250거래일. 실제 시세가 아닙니다.')}`);
 });
};
/* 5장: 잡음 종류에 따른 3σ 밖의 날, 초과 첨도, 가장 나빴던 하루. 새벽전자 1년 기록과 함께 놓는다. */
function tailStats(tails,nu,N){
 return U.memo(`tails|${tails}|${nu}|${N}`,()=>{const s=M.monteCarlo({...BASE,...(tails==='t'?{tails:'t',nu}:{})},N,q=>{const r=M.logReturns(q);return {tail:M.tailShare(r,3),kurt:M.moments(r).kurtosis,sd:M.sd(r),worst:Math.min(...r)};});
  return {tail:M.mean(s.map(x=>x.tail)),kurt:M.mean(s.map(x=>x.kurt)),sd:M.mean(s.map(x=>x.sd)),worst:U.median(s.map(x=>x.worst)),worsts:s.map(x=>x.worst)};});
}
VLabs.tails=el=>{
 U.setup(el,U.select('tnoise','생성기의 잡음',[['t','t분포 (분산을 1로 맞춤)'],['normal','정규분포']],'t')+U.range('tnu','t분포의 자유도 ν',3,30,1,6,'작을수록 꼬리가 두껍고, 클수록 정규에 가깝습니다')+U.select('tpaths','경로 수 (시드 1부터, 하루 1%, 250일)',[['100','100개'],['200','200개'],['400','400개']],'400'));
 U.bind(el,()=>{
  const isT=U.value(el,'tnoise')==='t',nu=Number(U.value(el,'tnu')),N=Number(U.value(el,'tpaths'));
  const g=tailStats(isT?'t':'normal',nu,N),norm=tailStats('normal',0,N),name=isT?`t(${nu})`:'정규';
  const r=D.returns(),m=M.mean(r),s=M.sd(r),out=r.map((v,i)=>[i+2,v]).filter(([,v])=>Math.abs(v-m)>3*s),sy=out.length/r.length;
  const theory=isT?(nu>4?F(6/(nu-4),Number.isInteger(6/(nu-4))?0:2):'무한대(ν ≤ 4)'):'0';
  const chart=U.columns({labels:['정규 이론','정규 생성기',...(isT?[`${name} 생성기`]:[]),'새벽전자'],values:[.0027,norm.tail,...(isT?[g.tail]:[]),sy].map(v=>v*100),fmt:v=>`${F(v,2)}%`,tick:v=>`${F(v,1)}%`,mark:i=>i===2&&isT,title:'3σ 밖의 날 비율',label:`3σ 밖의 날 비율: 정규 이론 0.27%, 정규 생성기 ${P(norm.tail)}, ${isT?`${name} ${P(g.tail)}, `:''}새벽전자 ${P(sy)}`})
   +U.histogram({values:g.worsts,bins:20,lines:[[-.03,'−3% (3σ)']],outside:v=>v<-.03,fmt:v=>`${U.sfmt(v*100,1)}%`,title:`${name} 생성기 · 경로마다 가장 나빴던 하루`,label:`${name} 생성기에서 경로마다 가장 나빴던 하루의 분포. 중앙값 ${P(g.worst)}`});
  const ratio=isT?` 정규의 <b>${F(g.tail/norm.tail,1)}배</b>입니다.`:'';
  U.result(el,chart,`${name} 잡음, 경로 ${F(N)}개: 3σ 밖의 날 평균 <b>${P(g.tail)}</b>, 1년에 <b>${F(g.tail*250,1)}일</b>.${ratio} 초과 첨도 평균 <b>${U.sfmt(g.kurt,1)}</b>(이론값 ${theory}), 하루 σ 평균 ${P(g.sd)}, 가장 나빴던 하루의 중앙값 <b>${P(g.worst)}</b>.<br>같은 경로 수의 정규 잡음: 3σ 밖 <b>${P(norm.tail)}</b>(1년 ${F(norm.tail*250,1)}일), 가장 나빴던 하루 중앙값 <b>${P(norm.worst)}</b>. 정규분포 이론값은 0.27%(1년 0.7일)입니다.<br>새벽전자 1년(하루 수익률 ${r.length}개): 평균 ${P(m)}, σ ${P(s)}, 3σ 밖의 날 <b>${out.length}일</b>(${out.map(([d,v])=>`${d}일째 ${P(v)}, ${U.sfmt((v-m)/s,2)}σ`).join(' · ')}), 초과 첨도 <b>${U.sfmt(M.moments(r).kurtosis,2)}</b>.${U.kind(['real','scenario','gen'],'생성기 경로와 새벽전자 기록(12권 13장 시나리오 120일 + 생성기 시드 20의 130일) 모두 가상입니다. 실제 지수의 꼬리는 연구 보고를 옮긴 것입니다.')}`);
 },{lazy:['tnu']});
};
/* 6장: 자기상관 막대(시차 1~10)와 ±1.96/√n 띠. 기록 하나 또는 생성기 경로 300개의 평균. */
function acfGen(phi,kappa){return U.memo(`acf|${phi}|${kappa}`,()=>{const s=M.monteCarlo({...BASE,phi,kappa},300,q=>({a:M.acf(M.logReturns(q),10),p:M.autocorr(q,1)}));return {mean:Array.from({length:10},(_,k)=>M.mean(s.map(x=>x.a[k]))),r1:s.map(x=>x.a[0]),price:M.mean(s.map(x=>x.p))};});}
VLabs.acf=el=>{
 U.setup(el,U.select('asrc','기록',[['sy120','새벽전자 앞 120일'],['sy','새벽전자 1년'],['gen','생성기 경로 300개']],'sy120')+U.range('aphi','φ: 어제 수익률을 이어받는 정도',-.6,.6,.05,0,'움직이면 생성기 경로로 바뀝니다')+U.range('akappa','κ: 시작가 쪽으로 당기는 비율',0,.5,.01,0,'움직이면 생성기 경로로 바뀝니다'));
 U.bind(el,e=>{
  const src=el.querySelector('#asrc');if(e&&/^(aphi|akappa)$/.test(e.target.id))src.value='gen';
  const phi=Number(U.value(el,'aphi')),kappa=Number(U.value(el,'akappa')),lag=Array.from({length:10},(_,i)=>`${i+1}`);
  if(src.value!=='gen'){
   const c=src.value==='sy'?D.closes():D.closes().slice(0,120),r=M.logReturns(c),a=M.acf(r,10),b=M.acfBand(r.length),out=a.map((v,i)=>Math.abs(v)>b?i+1:0).filter(Boolean);
   const chart=U.columns({labels:lag,values:a,band:[b,`±${F(b,3)}`],mark:i=>Math.abs(a[i])>b,fmt:v=>U.sfmt(v,2),title:'시차 k의 자기상관 ρ_k (▲ 띠 밖)',label:`새벽전자 자기상관. ρ₁ ${U.splus(a[0],3)}, 띠 ±${F(b,3)}`});
   return U.result(el,chart,`${src.value==='sy'?'새벽전자 1년':'새벽전자 앞 120일'}, 하루 수익률 ${r.length}개: ρ₁ = <b>${U.splus(a[0],3)}</b>, 띠 ±1.96/√${r.length} = <b>±${F(b,3)}</b> ${Math.abs(a[0])>b?'밖(▲)':'안'}입니다. ρ₄ = <b>${U.splus(a[3],2)}</b>, ρ₈ = <b>${U.splus(a[7],2)}</b>. 띠 밖 시차: ${out.length?out.join(', '):'없음'}.<br>가격끼리 잰 시차 1 자기상관은 ${F(M.autocorr(c,1),2)}로, 예측력이 아니라 “오늘 가격은 어제 가격 근처”라는 사실을 말할 뿐입니다.${src.value==='sy'?U.kind(['real','scenario','gen'],'앞 120일은 12권 13장의 가상 시나리오(80일은 8거래일 주기의 박스권), 뒤 130일은 생성기(시드 20)입니다.'):U.kind(['real','scenario'],'12권 13장의 가상 시나리오입니다(앞 80일은 8거래일 주기의 박스권).')}`);
  }
  const g=acfGen(phi,kappa),b=M.acfBand(250),out=g.r1.filter(v=>Math.abs(v)>b).length/300;
  const chart=U.columns({labels:lag,values:g.mean,band:[b,`±${F(b,3)}`],mark:i=>Math.abs(g.mean[i])>b,fmt:v=>U.sfmt(v,2),title:'경로 300개의 평균 ρ_k (▲ 띠 밖)',label:`생성기 φ ${phi}, κ ${kappa}의 평균 자기상관. ρ₁ ${U.splus(g.mean[0],3)}`})
   +U.histogram({values:g.r1,bins:20,lines:[[-b,`−${F(b,3)}`],[b,`+${F(b,3)}`]],outside:v=>Math.abs(v)>b,fmt:v=>U.sfmt(v,2),title:'경로마다 잰 ρ₁',label:`경로 300개의 ρ₁ 분포. 띠 밖 ${P(out,1)}`});
  U.result(el,chart,`생성기 φ = ${F(phi,2)}, κ = ${F(kappa,2)}, 경로 300개(시드 1부터, 하루 1%, 250일): ρ₁ 평균 <b>${U.splus(g.mean[0],3)}</b>, 띠(±${F(b,3)}) 밖으로 나간 경로 <b>${P(out,1)}</b>. ${out<.15?'대부분의 경로에서 ρ₁만으로는 무작위 보행과 구별되지 않습니다.':out>.9?'거의 모든 경로에서 띠 밖입니다.':'띠 밖과 안이 섞여 있어 경로 하나로는 판정이 갈립니다.'}<br>가격끼리 잰 시차 1 자기상관의 평균은 ${F(g.price,2)}입니다.${U.kind(['real','gen'],'φ는 수익률의 AR(1) 계수, κ는 로그 가격을 시작가로 당기는 비율. 실제 시세가 아닙니다.')}`);
 });
};
})();
