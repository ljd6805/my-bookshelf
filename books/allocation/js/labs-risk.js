/* 1~3장 실험: 종목 수와 상관(포트폴리오 비중 실험 · 종목 수 보기), 공분산 행렬과 고윳값, 두 자산 곡선(포트폴리오 비중 실험 · 두 자산 보기).
   계산은 AMath.equalSigma·covMatrix·portSigma·checkCorr·equalCorr·firstEigen·twoAsset·minVar2만 쓴다. 다섯 자산의 σ·ρ는 미리 정한 가정(V-0)이다.
   기본값은 L2와 확인 문제의 입력과 다르다: 1장 σ 30·ρ 0.3·N 10, 2장 누리200·해외·채권, 3장 누리200·채권 ρ −0.2·주식 60%.
   3장 그림의 상관 1 곧은 선에는 숫자를 붙이지 않는다(확인 문제 13.20%). 2장 “불가능한 상관 표” 예제는 예측을 적은 뒤에 열린다(lab-guides.js). */
(()=>{
'use strict';
const U=AUI,M=AMath,A=M.ASSETS,D=M.ASSUME.diversify;
const p2=x=>U.pct(x,2),f4=x=>U.sfmt(x,4),f5=x=>U.sfmt(x,5);
ALabs['stock-count']=el=>{
 U.setup(el,U.number('cs','종목마다 표준편차 σ (%)',0,100,0.1,D.sigma*100,'연율. 모든 종목이 같다고 놓습니다')+U.number('cr','모든 짝의 상관 ρ',-1,1,0.01,D.rho,'−1~1. 종목이 N개이면 −1 ÷ (N − 1)보다 작을 수 없습니다')+U.number('cn','같은 비중으로 담는 종목 수 N',1,1000,1,10,'정수'));
 U.bind(el,()=>{
  const s=U.num(el,'cs'),r=U.num(el,'cr'),n=U.num(el,'cn',true);
  if(s===null)return U.result(el,'',U.problem('표준편차','0%에서 100% 사이로 넣어 주세요.'));if(r===null)return U.result(el,'',U.problem('상관','−1에서 1 사이로 넣어 주세요.'));if(n===null)return U.result(el,'',U.problem('종목 수','1 이상의 정수로 넣어 주세요.'));
  const sg=s/100,ns=[...new Set([1,2,5,10,30,n])].sort((a,b)=>a-b);let vals;
  try{vals=ns.map(k=>M.equalSigma(sg,r,k));}catch(e){return U.result(el,'',U.problem('상관',U.why(e)+` 지금 N = ${n}이면 ρ는 ${U.sfmt(-1/Math.max(1,n-1),3)} 이상이어야 합니다.`));}
  const now=M.equalSigma(sg,r,n),floor=r>=0?M.equalSigma(sg,r,Infinity):null,own=sg*sg/n,pair=(1-1/n)*r*sg*sg;
  const chart=U.columns({labels:ns.map(k=>`N ${k}`),values:vals.map(v=>v*100),mark:i=>ns[i]===n,fmt:v=>U.sfmt(v,2)+'%',tick:v=>U.sfmt(v,0)+'%',title:`종목 수에 따른 표준편차 (σ ${U.sfmt(s,1)}%, ρ ${U.sfmt(r,2)}) · ▲ 지금 N`,h:270,ref:floor!=null?{value:floor*100,text:`바닥 σ√ρ = ${p2(floor)}`}:null,label:ns.map((k,i)=>`N ${k}: ${p2(vals[i])}`).join(', ')+(floor!=null?`, 바닥 ${p2(floor)}`:'')})
   +U.table(['종목 수 N','자기 분산 몫 σ² ÷ N','짝끼리의 몫 (1 − 1 ÷ N)ρσ²','표준편차'],ns.map((k,i)=>[`${k===n?'▲ ':''}${k}`,f4(sg*sg/k),f4((1-1/k)*r*sg*sg),`<b>${p2(vals[i])}</b>`]),'종목 수에 따른 분산의 두 몫','compact');
  const tail=floor!=null?`종목을 끝없이 늘려도 짝끼리의 몫 ρσ² = ${f4(r*sg*sg)}${U.josa(f4(r*sg*sg),'이','가')} 남아 바닥은 σ√ρ = ${U.sfmt(s,1)} × √${U.sfmt(r,2)} = <b>${p2(floor)}</b>이고, 지금 N에서 바닥까지 ${U.ppt(now-floor)} 남았습니다.`:`상관이 음수인 종목은 많이 모을 수 없어(ρ ≥ −1 ÷ (N − 1)) 바닥을 계산하지 않습니다.`;
  U.result(el,chart,`N = ${n}: σₚ = √(${f4(own)} + ${f4(pair)}) = <b>${p2(now)}</b>(한 종목 ${p2(sg)}).<br>${tail} N이 커지면 자기 분산 몫만 0으로 줄어듭니다.${U.kind(['real','assume'],'모든 종목의 σ와 짝마다의 ρ가 같다고 놓은 식입니다.')}`);
 });
};
const NAMES=['누리200','해외주식','채권'],IDX=[1,2,3];
ALabs['covariance-matrix']=el=>{
 const sg=IDX.map(i=>A.sigma[i]*100),co=A.corr;
 U.setup(el,U.banner()+U.group('자산 셋의 표준편차 (%, 연율)',NAMES.map((n,k)=>U.number('ms'+k,`자산 ${k+1} (${n})`,0,100,0.1,sg[k])).join(''))
  +U.group('짝마다의 상관 ρ (−1~1)',U.number('mr01','자산 1–2',-1,1,0.01,co[1][2])+U.number('mr02','자산 1–3',-1,1,0.01,co[1][3])+U.number('mr12','자산 2–3',-1,1,0.01,co[2][3]))
  +U.group('비중 (%, 합 100)',NAMES.map((n,k)=>U.number('mw'+k,`자산 ${k+1}`,0,100,1,[50,30,20][k])).join('')+U.sumNote('mw-sum'))
  +U.group('같은 상관 ρ의 N종목 (2.4절)',U.number('qn','종목 수 N',2,50,1,M.ASSUME.four.n,'정수')+U.number('qr','모든 짝의 상관',-1,1,0.01,M.ASSUME.four.rho)),true);
 U.bind(el,()=>{
  U.sumCheck(el,'mw-sum',['mw0','mw1','mw2'],100);const s=[0,1,2].map(k=>U.num(el,'ms'+k)),r=['mr01','mr02','mr12'].map(k=>U.num(el,k)),w=[0,1,2].map(k=>U.num(el,'mw'+k)),qn=U.num(el,'qn',true),qr=U.num(el,'qr');
  for(let k=0;k<3;k++){if(s[k]===null)return U.result(el,'',U.problem(`자산 ${k+1}의 표준편차`,'0%에서 100% 사이로 넣어 주세요.'));if(r[k]===null)return U.result(el,'',U.problem('상관','−1에서 1 사이로 넣어 주세요.'));if(w[k]===null)return U.result(el,'',U.problem('비중','0%에서 100% 사이로 넣어 주세요.'));}
  if(qn===null)return U.result(el,'',U.problem('종목 수','2에서 50 사이의 정수로 넣어 주세요.'));if(qr===null)return U.result(el,'',U.problem('같은 상관','−1에서 1 사이로 넣어 주세요.'));
  const tot=w[0]+w[1]+w[2];if(Math.abs(tot-100)>1e-9)return U.result(el,'',U.problem('비중',`세 비중의 합이 ${U.sfmt(tot,0)}%입니다. 합이 100%가 되게 넣어 주세요.`));
  const sig=s.map(x=>x/100),corr=[[1,r[0],r[1]],[r[0],1,r[2]],[r[1],r[2],1]],cov=M.covMatrix(sig,corr),ww=w.map(x=>x/100),v=M.portVar(ww,cov),chk=M.checkCorr(corr);
  const eq=M.checkCorr(M.equalCorr(qn,qr)),f1=M.firstEigen(qn,qr);
  const mat=U.table(['','자산 1','자산 2','자산 3'],cov.map((row,i)=>[`<b>자산 ${i+1}</b>`,...row.map((x,j)=>i===j?`<b>${f5(x)}</b>`:f5(x))]),'공분산 행렬 Σ (대각선은 분산 σ², 나머지는 공분산 ρσᵢσⱼ)','compact');
  const vals=chk.values,chart=U.columns({labels:vals.map((_,i)=>`고윳값 ${i+1}`),values:vals,mark:i=>vals[i]<-1e-10,fmt:x=>(x<-1e-10?'✗ ':'')+U.sfmt(x,3),tick:x=>U.sfmt(x,1),title:`상관 표의 고윳값 (작은 것부터) · ${chk.ok?'모두 0 이상 ✓':'음수 있음 ✗'}`,h:230,label:`고윳값 ${vals.map(x=>U.sfmt(x,3)).join(', ')}, ${chk.reason}`});
  const ok=chk.ok?`<span class="verdict ok">✓ 상관 행렬이 될 수 있음</span>(모든 고윳값이 0 이상)`:`<span class="verdict bad">✗ 상관 행렬이 될 수 없음</span>(고윳값에 음수 ${U.sfmt(chk.min,3)}${U.josa(U.sfmt(chk.min,3),'이','가')} 있습니다. 적힌 상관끼리 앞뒤가 맞지 않습니다)`;
  const eqLine=eq.ok?`같은 상관 ${U.sfmt(qr,2)}의 ${qn}종목: 첫 고윳값 = 1 + (${qn} − 1) × ${U.sfmt(qr,2)} = <b>${U.sfmt(f1,2)}</b>(실험이 계산한 값 ${U.sfmt(eq.max,3)}), 전체 ${qn}의 <b>${U.pct(eq.maxShare,1)}</b>를 모든 종목이 함께 움직이는 방향이 차지합니다.`:`같은 상관 ${U.sfmt(qr,2)}의 ${qn}종목은 <span class="verdict bad">✗ 상관 행렬이 될 수 없습니다</span>(가장 작은 고윳값 ${U.sfmt(eq.min,3)}).`;
  U.result(el,mat+chart,`비중 ${w.map(x=>U.sfmt(x,0)).join('·')}%: wᵀΣw = <b>${f5(v)}</b>, σₚ = √${f5(v)} = <b>${p2(Math.sqrt(Math.max(0,v)))}</b>.<br>고윳값 ${vals.map(x=>U.sfmt(x,3)).join(' · ')}: ${ok}. 고윳값은 실험이 야코비 회전으로 계산하고, 독자는 부호와 크기만 읽습니다.<br>${eqLine}${U.kind(['real','assume'])}`);
 });
};
const curve=(a,b,rho)=>Array.from({length:41},(_,k)=>{const p=M.twoAsset(k/40,a,b,rho);return [p.sigma*100,p.mu*100];});
ALabs['two-asset-curve']=el=>{
 const a=M.asset(1),b=M.asset(3);
 U.setup(el,U.banner()+U.group('자산 1 (누리200)',U.number('ta','기대수익 (%)',-50,50,0.1,a.mu*100)+U.number('tsa','표준편차 (%)',0,100,0.1,a.sigma*100))+U.group('자산 2 (채권 묶음)',U.number('tb','기대수익 (%)',-50,50,0.1,b.mu*100)+U.number('tsb','표준편차 (%)',0,100,0.1,b.sigma*100))
  +U.number('tr','두 자산의 상관 ρ',-1,1,0.01,M.ASSETS.corr[1][3],'−1~1')+U.range('tw','자산 1 비중 (%)',0,100,1,60,'나머지는 자산 2'));
 U.bind(el,()=>{
  const ma=U.num(el,'ta'),sa=U.num(el,'tsa'),mb=U.num(el,'tb'),sb=U.num(el,'tsb'),r=U.num(el,'tr'),w=Number(U.value(el,'tw'))/100;
  for(const [v,n,h] of [[ma,'자산 1의 기대수익','−50%에서 50% 사이로'],[sa,'자산 1의 표준편차','0%에서 100% 사이로'],[mb,'자산 2의 기대수익','−50%에서 50% 사이로'],[sb,'자산 2의 표준편차','0%에서 100% 사이로'],[r,'상관','−1에서 1 사이로']])if(v===null)return U.result(el,'',U.problem(n,h+' 넣어 주세요.'));
  const A1={mu:ma/100,sigma:sa/100},B1={mu:mb/100,sigma:sb/100},now=M.twoAsset(w,A1,B1,r);let wm;
  try{wm=M.minVar2(A1.sigma,B1.sigma,r,true);}catch(e){return U.result(el,'',U.problem('표준편차와 상관',U.why(e)));}
  const mv=M.twoAsset(wm,A1,B1,r),refs=[-1,0,1].filter(x=>Math.abs(x-r)>1e-9);
  const chart=U.xy({series:[...refs.map((x,k)=>({name:`상관 ${U.sfmt(x,0)} (비교)`,pts:curve(A1,B1,x),dash:['dot','dash','long'][k],color:'var(--muted)',width:1.6})),{name:`상관 ${U.sfmt(r,2)} (지금)`,pts:curve(A1,B1,r),color:'var(--blue)',width:2.8}],
   points:[{name:'두 자산',x:sa,y:ma,shape:'■',color:'var(--muted)'},{x:sb,y:mb,shape:'■',color:'var(--muted)'},{name:`지금 비중 (자산 1 ${Math.round(w*100)}%)`,x:now.sigma*100,y:now.mu*100,shape:'▲',color:'var(--orange)'},{name:`최소분산 (자산 1 ${p2(wm)})`,x:mv.sigma*100,y:mv.mu*100,shape:'◆',color:'var(--accent)'}],
   xmin:0,ymin:Math.min(0,ma,mb),xlabel:'표준편차 σ (%)',ylabel:'기대수익 μ (%)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,1),title:'두 자산을 섞을 때의 기대수익–표준편차',h:390,label:`지금 비중 μ ${p2(now.mu)}, σ ${p2(now.sigma)}, 최소분산 자산 1 ${p2(wm)}, σ ${p2(mv.sigma)}`});
  const lower=now.sigma<Math.abs(w*A1.sigma+(1-w)*B1.sigma)-1e-12?'상관이 1보다 작아 같은 비중의 곧은 선보다 왼쪽(위험이 작은 쪽)에 있습니다':'상관이 1이라 두 점을 잇는 곧은 선 위에 있습니다';
  U.result(el,chart,`자산 1 ${Math.round(w*100)}%: μₚ = ${U.sfmt(w,2)} × ${U.sfmt(ma,1)} + ${U.sfmt(1-w,2)} × ${U.sfmt(mb,1)} = <b>${p2(now.mu)}</b>, σₚ = <b>${p2(now.sigma)}</b>. ${lower}.<br>최소분산 비중(공매도 없음) w* = <b>${p2(wm)}</b>에서 σ ${p2(mv.sigma)}, μ ${p2(mv.mu)}입니다.${U.kind(['real','assume'],'회색 곡선은 같은 두 자산의 상관만 −1·0·1로 바꾼 비교선입니다.')}`);
 });
};
})();
