/* 8·9장 실험: 켈리 비율과 성장률(계산 연습), 같은 비중을 평상시와 위기 상관으로 다시 계산하기.
   계산은 AMath.kellyF·growth·medianMultiple·wealthQuantile·everBelow·misread·kellyContinuous·equalSigma·twoAsset만 쓴다.
   8장은 100번 뒤 “중앙값” 바로 옆에 나쁜 쪽 숫자(하위 10% 재산, 한 번이라도 절반 아래로 떨어진 경로의 비율)를 함께 둔다.
   연속형 1.39배에는 빌려서 채우는 계산을 하지 않는다는 문장을 붙이고, 켈리 비율을 계좌 비중으로 쓰라는 말은 쓰지 않는다.
   9장의 위기 상관과 σ는 가정이며 “위기에는 상관이 1이 된다”를 사실로 쓰지 않는다. */
(()=>{
'use strict';
const U=AUI,M=AMath,K=M.ASSUME.kelly,C=M.ASSUME.continuous,F4=M.ASSUME.crisisFour,CR=M.ASSUME.crisis6040;
const f3=x=>U.sfmt(x,3),f4=x=>U.sfmt(x,4),p1=x=>U.pct(x,1),p2=x=>U.pct(x,2);
function kellyRow(name,f,p,b){
 if(!(f>0))return [name,'0','0','1.000배','1.000배','0.0%','1.000'];
 if(f>=1)return [name,f3(f),'f ≥ 1이라 계산하지 않음','','','',''];
 return [name,f3(f),f4(M.growth(f,p,b)),`<b>${f3(M.medianMultiple(f,p,b,K.n))}배</b>`,`<b>${f3(M.wealthQuantile(f,p,b,K.n,0.1))}배</b>`,`<b>${p1(M.everBelow(f,p,b,K.n,0.5))}</b>`,f3(Math.pow(1-f,K.streak))];
}
ALabs['kelly-growth']=el=>{
 U.setup(el,`<p class="assume-banner"><b>계산 연습</b> · 승률과 배당을 안다고 놓은 동전 내기입니다. 계좌 비중을 정하는 도구로 쓰지 않습니다.</p>`
  +U.group('내기 (이기면 건 돈의 b배를 받고, 지면 건 돈을 잃음)',U.number('kp','이길 확률 p',0.01,0.99,0.01,K.p)+U.number('kb','배당 b',0.1,10,0.1,K.b))
  +U.number('kf','내가 거는 비율 f (재산 대비)',0,0.95,0.01,0.1,'0 이상 0.95 이하')+U.number('kbel','내가 믿은 승률',0.01,0.99,0.01,K.p,'실제 승률(p)과 다르면 승률을 잘못 안 경우를 계산합니다'),true);
 U.bind(el,()=>{
  const p=U.num(el,'kp'),b=U.num(el,'kb'),f=U.num(el,'kf'),bel=U.num(el,'kbel');
  if(p===null)return U.result(el,'',U.problem('이길 확률','0.01에서 0.99 사이로 넣어 주세요.'));if(b===null)return U.result(el,'',U.problem('배당','0.1에서 10 사이로 넣어 주세요.'));
  if(f===null)return U.result(el,'',U.problem('거는 비율','0에서 0.95 사이로 넣어 주세요.'));if(bel===null)return U.result(el,'',U.problem('믿은 승률','0.01에서 0.99 사이로 넣어 주세요.'));
  const fs=M.kellyF(p,b),q=1-p,edge=fs>1e-12;
  const fmax=Math.min(0.95,Math.max(edge?Math.min(0.95,3.3*fs):0.3,f*1.25,0.3)),pts=Array.from({length:61},(_,k)=>{const x=fmax*k/60;return [x,M.growth(x,p,b)];});
  const marks=edge?[[fs,'f*'],[2*fs,'2배'],[3*fs,'3배']].filter(([x])=>x<fmax):[];
  const chart=U.xy({series:[{name:'기대 로그 성장률 g(f) (한 번에)',pts,color:'var(--blue)'}],points:marks.map(([x,t],k)=>({x,y:M.growth(x,p,b),shape:['●','◆','■'][k],color:k?'var(--orange)':'var(--accent)',text:`${t} ${f4(M.growth(x,p,b))}`,dy:k?16:-8,anchor:x>fmax*0.7?'end':'start',dx:x>fmax*0.7?-8:8})).concat(f>0?[{name:`내가 거는 비율 f = ${f3(f)}`,x:f,y:M.growth(f,p,b),shape:'▲',color:'var(--orange)'}]:[]),
   refs:[{y:0,text:'성장률 0'}],xmin:0,xmax:fmax,xtick:v=>U.sfmt(v,2),ytick:v=>U.sfmt(v,3),xlabel:'거는 비율 f',ylabel:'g(f)',title:'거는 비율에 따른 장기 성장률',h:340,label:`켈리 비율 ${f3(Math.max(0,fs))}, 내가 거는 비율 ${f3(f)}의 성장률 ${f4(M.growth(f,p,b))}`});
  const head=['비율','f','성장률 g','100번 뒤 중앙값','하위 10% 재산','한 번이라도 절반 아래','다섯 번 연속 손실 뒤'];
  const rows=edge?[...K.multiples.map(m=>kellyRow(m===1?'f* (켈리 비율)':`f*의 ${U.sfmt(m,1)}배`,m*fs,p,b)),kellyRow('▲ 내가 거는 비율',f,p,b)]:[kellyRow('▲ 내가 거는 비율',f,p,b)];
  const tbl=U.table(head,rows,`${K.n}번 뒤 재산 (처음 = 1, 중앙값 바로 옆에 나쁜 쪽 숫자)`,'cards');
  const mr=M.misread(bel,p,b),mis=Math.abs(bel-p)<1e-12?'믿은 승률과 실제 승률이 같아 잘못 안 몫이 없습니다.':mr.raw<=0?`승률을 ${U.sfmt(bel,2)}${U.josa(U.sfmt(bel,2),'으로','로')} 믿으면 식이 ${f3(mr.raw)}${U.josa(f3(mr.raw),'을','를')} 내므로 걸지 않습니다(f = 0). 실제 승률 ${U.sfmt(p,2)}의 켈리 비율은 ${f3(Math.max(0,mr.actualKelly))}이고, 걸지 않았으니 실제 성장률은 ${f4(mr.g)}입니다.`:`승률을 ${U.sfmt(bel,2)}${U.josa(U.sfmt(bel,2),'으로','로')} 믿으면 f = ${f3(mr.f)}로 걸고, 실제 승률 ${U.sfmt(p,2)}의 켈리 비율 ${f3(Math.max(0,mr.actualKelly))}${mr.times?`의 <b>${U.sfmt(mr.times,2)}배</b>`:''}를 건 셈이며 실제 성장률은 ${f4(mr.g)}입니다.`;
  const kc=M.kellyContinuous(C.mu,C.r,C.sigma),nowBad=f>0&&f<1?`내가 거는 비율 f = ${f3(f)}: 성장률 ${f4(M.growth(f,p,b))}, 100번 뒤 중앙값 ${f3(M.medianMultiple(f,p,b,K.n))}배 바로 옆에 하위 10% ${f3(M.wealthQuantile(f,p,b,K.n,0.1))}배, 한 번이라도 절반 아래로 떨어진 경로 ${p1(M.everBelow(f,p,b,K.n,0.5))}.`:'거는 비율이 0이면 재산이 그대로입니다.';
  U.result(el,chart+tbl,`켈리 비율 f* = p − q ÷ b = ${U.sfmt(p,2)} − ${U.sfmt(q,2)} ÷ ${U.sfmt(b,1)} = <b>${f3(fs)}</b>${edge?`, 그때 성장률 ${f4(M.growth(fs,p,b))}`:'. 0 이하라 어떤 비율로 걸어도 기대 로그 성장률이 0보다 작아지므로 걸지 않는 비율(0)에서 성장률이 가장 큽니다'}.<br>${nowBad}<br>${mis}<br>연속형 식 (μ − r) ÷ σ²에 V-0 가정의 누리200(μ ${p1(C.mu)}, r ${p1(C.r)}, σ ${p1(C.sigma)})을 넣으면 <b>${U.sfmt(kc,2)}배</b>로, 가진 돈보다 많이 담아야 하는 비율입니다. ${U.KELLY} 신용 거래와 미수는 4권 9장이 다룹니다.${U.kind(['real','assume'],'“중앙값”은 이 책에서 e^(100g)로 계산한 배수입니다.')}`);
 });
};
ALabs['crisis-correlation']=el=>{
 U.setup(el,U.banner('위기 상관과 위기 σ는 이 책의 가정입니다.')+U.group(`같은 비중 ${F4.n}종목`,U.number('qs','종목마다 표준편차 (%)',0,100,0.1,F4.sigma*100)+U.number('qr1','평상시 상관',-0.33,1,0.01,F4.rho[0])+U.number('qr2','위기 상관',-0.33,1,0.01,F4.rho[1]))
  +U.group('주식·채권 섞은 계좌',U.number('cw','주식 비중 (%)',0,100,1,60,'나머지는 채권'))
  +U.group('평상시',U.number('ns1','주식 표준편차 (%)',0,100,0.1,CR.normal.s1*100)+U.number('ns2','채권 표준편차 (%)',0,100,0.1,CR.normal.s2*100)+U.number('nrho','주식·채권 상관',-1,1,0.01,CR.normal.rho))
  +U.group('위기',U.number('cs1','주식 표준편차 (%)',0,100,0.1,CR.crisis.s1*100)+U.number('cs2','채권 표준편차 (%)',0,100,0.1,CR.crisis.s2*100)+U.number('crho','주식·채권 상관',-1,1,0.01,CR.crisis.rho)),true);
 U.bind(el,()=>{
  const v=['qs','qr1','qr2','cw','ns1','ns2','nrho','cs1','cs2','crho'].map(k=>U.num(el,k)),names=['종목 표준편차','평상시 상관','위기 상관','주식 비중','평상시 주식 표준편차','평상시 채권 표준편차','평상시 상관','위기 주식 표준편차','위기 채권 표준편차','위기 상관'];
  const ranges=['0%에서 100%','−0.33에서 1','−0.33에서 1','0%에서 100%','0%에서 100%','0%에서 100%','−1에서 1','0%에서 100%','0%에서 100%','−1에서 1'];
  const bad=v.findIndex(x=>x===null);if(bad>=0)return U.result(el,'',U.problem(names[bad],ranges[bad]+' 사이로 넣어 주세요.'));
  const [qs,r1,r2,cw,ns1,ns2,nr,cs1,cs2,cr]=v,w=cw/100,two=(s1,s2,r)=>M.twoAsset(w,{sigma:s1/100},{sigma:s2/100},r).sigma;
  let a,b;try{a=M.equalSigma(qs/100,r1,F4.n);b=M.equalSigma(qs/100,r2,F4.n);}catch(e){return U.result(el,'',U.problem('상관',U.why(e)));}
  const n0=two(ns1,ns2,nr),sOnly=two(cs1,cs2,nr),c1=two(cs1,cs2,cr);
  const chart=U.columns({labels:[`${F4.n}종목|평상시`,`${F4.n}종목|위기`,'섞은 계좌|평상시','섞은 계좌|위기 σ만','섞은 계좌|위기'],values:[a,b,n0,sOnly,c1].map(x=>x*100),mark:i=>i===1||i===4,fmt:x=>U.sfmt(x,2)+'%',tick:x=>U.sfmt(x,0)+'%',twoLine:true,title:'같은 비중의 표준편차 (%) · ▲ 위기',h:280,label:`${F4.n}종목 ${p2(a)} → ${p2(b)}, 섞은 계좌 ${p2(n0)} → ${p2(c1)}`});
  U.result(el,chart,`${F4.n}종목(σ ${U.sfmt(qs,1)}%): 상관 ${U.sfmt(r1,2)} → ${U.sfmt(r2,2)}에서 σ <b>${p2(a)}</b> → <b>${p2(b)}</b>(${U.ppt(b-a)} 커짐).<br>주식 ${cw}% · 채권 ${100-cw}%: 평상시 <b>${p2(n0)}</b>, 위기 σ만 넣고 상관은 평상시 그대로 ${p2(sOnly)}, 위기 σ와 위기 상관 <b>${p2(c1)}</b>. 커진 폭 ${U.ppt(c1-n0)} 가운데 σ가 커진 몫이 ${U.ppt(sOnly-n0)}, 상관이 오른 몫이 ${U.ppt(c1-sOnly)}입니다.<br>비중은 그대로 두고 공분산 행렬의 상관만 바꿔 wᵀΣw를 다시 계산한 값입니다. 위기 때 변동성이 커지면 보정하지 않은 상관 추정이 위로 치우칠 수 있다는 연구가 있습니다(Forbes·Rigobon 1999, 학술 초록).${U.kind(['real','assume','paper'],'이 실험의 위기 상관과 위기 σ는 이 책의 가정이며, “위기에는 상관이 1이 된다”는 사실이 아닙니다.')}`);
 });
};
})();
