/* 마지막 과제 실험(포트폴리오 비중 실험 · 조건 판정 보기): 윤 씨(가상)의 비중이 두 조건과 IRP 위험자산 한도를 만족하는지 계산한다.
   계산은 AMath.evaluatePlan·checkCorr·crisisCorr만 쓴다. 조건 1은 위기 시나리오 한 해 손실 4,500만 원 이내, 조건 2는 채권·현금 9,000만 원 이상이다.
   (가)의 숫자(안 A 16.46%, 59.42% 등)는 과제지가 아니라 풀이에만 둔다: 기본 화면은 안 A를 넣어 두되 계산 결과는 “계산 결과와 풀이 펼치기”를 켤 때만 보인다.
   비교 예제(풀이 예시 안 B 등)는 예측을 적은 뒤에 열린다(lab-guides.js). L2의 안 C와 전이의 안 D는 비교 예제에 넣지 않는다.
   IRP 70% 한도와 적격 TDF 예외는 ⏱ 값이라 “보도 기준 · 법령 원문 확인 못함”과 확인일을 함께 적고, 상품 이름은 쓰지 않는다. */
(()=>{
'use strict';
const U=AUI,M=AMath,Y=M.ASSUME.yoon,A=M.ASSETS,P=Y.plans;
const NOTE_KEY='bookshelf:allocation:v1:final-notes',p2=x=>U.pct(x,2),IRP=['누리200 지수 펀드','해외주식 펀드','채권','현금'];
function notes(el){
 const boxes=[...el.querySelectorAll('[data-note]')];
 try{const saved=JSON.parse(localStorage.getItem(NOTE_KEY)||'{}');boxes.forEach(b=>{if(typeof saved[b.id]==='string')b.value=saved[b.id];});}catch(e){}
 const save=()=>{try{localStorage.setItem(NOTE_KEY,JSON.stringify(Object.fromEntries(boxes.map(x=>[x.id,x.value]))));}catch(e){}};
 boxes.forEach(b=>{b.addEventListener('input',save);b.addEventListener('change',save);});
}
const noteBox=()=>`<fieldset class="cards" data-free><legend>(마) 리밸런싱 규칙과 다음 점검일 (이 브라우저에만 남음)</legend><label class="control" for="prule"><span>되돌리는 규칙</span><select id="prule" data-note><option value="">고르기</option><option value="annual">연 1회</option><option value="band">±5%p 허용 폭</option></select></label><label class="control" for="pdate"><span>다음 점검일</span><input id="pdate" type="date" data-note></label><label class="control" for="pmemo"><span>메모</span><textarea id="pmemo" data-note rows="2" placeholder="예: 점검일에 한도와 금리의 확인일도 다시 봄"></textarea></label></fieldset>`;
function inputs(){
 return U.group('비중 (%, 합 100 · 금융자산 3억 원)',A.names.map((n,i)=>U.number('pw'+i,n,0,100,1,P.A.w[i]*100)).join('')+U.sumNote('pw-sum'))
  +U.group('IRP 1억 원 안 (만 원, 합 10,000 · 개별 주식은 담지 않음)',IRP.map((n,i)=>U.number('pi'+i,n,0,10000,100,P.A.irp[i+1])).join('')+U.sumNote('pi-sum'))
  +U.check('pshow','계산 결과와 풀이 펼치기',false,'과제 (가)~(라)를 직접 계산한 뒤에 켜 보세요')+noteBox();
}
function solution(r,w,irp){
 const loss=-r.loss,ok1=r.cond1,ok2=r.cond2,isB=w.every((x,i)=>Math.abs(x-P.B.w[i])<1e-9)&&irp.every((x,i)=>x===P.B.irp[i]);
 const bars=U.hbars({groups:[{title:'자산별 위험 기여 (표준편차에서 차지하는 몫, %)',rows:A.names.map((n,i)=>[n,r.contrib[i]*100,`${U.sfmt(r.contrib[i]*100,2)}% (비중 ${U.sfmt(w[i]*100,0)}%)`,i===0])},
  {title:'위기 시나리오 한 해 손익 (만 원)',rows:A.names.map((n,i)=>[n,w[i]*Y.total*Y.scenario[i],`${U.splus(w[i]*Y.total*Y.scenario[i],0)}만`,false])}],left:110,right:300,label:`위험 기여 ${r.contrib.map(x=>U.sfmt(x*100,2)).join(', ')}%, 시나리오 손실 ${U.won(r.loss)}`});
 const tbl=U.table(['판정','계산','결과'],[['조건 1 · 위기 시나리오 한 해 손실 4,500만 원 이내',`${r.lossPct.toFixed(2).replace('-','−')}% × 3억 원`,`${U.won(r.loss)} ${U.verdict(ok1)}`],['조건 2 · 채권·현금 9,000만 원 이상','채권 + 현금',`${U.won(r.safe)} ${U.verdict(ok2)}`],[`(라) IRP 위험자산 비중 (⏱ 한도 70% · ${M.MARKET.pensionLimit.label} · ${M.MARKET.pensionLimit.checked} 확인 기준)`,'주식형 펀드 ÷ 1억 원',`${p2(r.irpRisky)} ${U.verdict(r.limitOk,'70% 이하','70% 넘음')}`]],'두 조건과 IRP 한도 판정','fit');
 const text=`(가)·(나) 기대수익 ${p2(r.mu)}, 표준편차 <b>${p2(r.sigma)}</b>, 위기 상관 표준편차 <b>${p2(r.crisisSigma)}</b>, 위기 시나리오 <b>${r.lossPct.toFixed(2).replace('-','−')}%(${U.won(r.loss)})</b>으로 조건 1 ${U.verdict(ok1)}, 채권·현금 <b>${U.won(r.safe)}</b>으로 조건 2 ${U.verdict(ok2)}. 새벽전자는 비중 ${U.sfmt(w[0]*100,0)}%로 위험 기여 <b>${p2(r.contrib[0])}</b>를 차지합니다.`
  +`<br>(라) IRP 위험자산 비중 = 주식형 펀드 ${U.won(irp[1]+irp[2])} ÷ 1억 원 = <b>${p2(r.irpRisky)}</b> ${U.verdict(r.limitOk,'한도 이하','한도를 넘음')} ${U.timed('pensionLimit')} 이 한도에는 예외가 있습니다(적격 TDF, 보도 기준). ${U.RECHECK}`
  +(ok1&&ok2?`<br>${isB?'풀이 예시 안 B는 ':'이 안은 '}두 조건을 만족하는 예 하나이며 정답이 아닙니다. 비중은 ${U.WEIGHTS}.`:`<br>두 조건을 모두 만족하지는 못합니다. ${!ok1?`손실이 한도보다 ${U.won(loss-Y.lossLimit)} 큽니다. `:''}${!ok2?`채권·현금이 ${U.won(Y.livingCost*Y.years-r.safe)} 모자랍니다.`:''}`);
 return {chart:tbl+bars,text};
}
ALabs['plan-conditions']=el=>{
 U.setup(el,`<p class="assume-banner"><b>${U.DISCLAIMER}</b><br>${U.LABEL}. ${U.RECHECK}</p>`+inputs(),true);
 notes(el);
 U.bind(el,()=>{
  U.sumCheck(el,'pw-sum',A.names.map((_,i)=>'pw'+i),100);U.sumCheck(el,'pi-sum',IRP.map((_,i)=>'pi'+i),10000,{unit:'만 원'});const w=A.names.map((_,i)=>U.num(el,'pw'+i)),ir=IRP.map((_,i)=>U.num(el,'pi'+i));
  for(let i=0;i<5;i++)if(w[i]===null)return U.result(el,'',U.problem(`${A.names[i]} 비중`,'0%에서 100% 사이로 넣어 주세요.'));
  for(let i=0;i<4;i++)if(ir[i]===null)return U.result(el,'',U.problem(`IRP 안 ${IRP[i]}`,'0에서 10,000만 원 사이로 넣어 주세요.'));
  const tot=w.reduce((a,b)=>a+b,0);if(Math.abs(tot-100)>1e-9)return U.result(el,'',U.problem('비중',`다섯 비중의 합이 ${U.sfmt(tot,0)}%입니다. 합이 100%가 되게 넣어 주세요.`));
  const ww=w.map(x=>x/100),irp=[0,...ir];let r;try{r=M.evaluatePlan({w:ww,irp});}catch(e){return U.result(el,'',U.problem(/IRP|single|general/.test(e.message)?'IRP 안 금액':'비중',U.why(e)));}
  const eig=M.checkCorr(M.crisisCorr(undefined,4)),eigText=`(다) 위험자산 넷(새벽전자·누리200·해외·채권)의 위기 상관 행렬(주식끼리 0.9, 주식·채권 +0.3)의 고윳값은 ${eig.values.map(x=>U.sfmt(x,3)).join(' · ')}${U.josa(eig.values.map(x=>U.sfmt(x,3)).join(' · '),'으로','로')} ${eig.ok?'<span class="verdict ok">✓ 모두 0 이상이라 상관 행렬로 가능합니다</span>':'<span class="verdict bad">✗ 음수가 있습니다</span>'}.`;
  const amounts=ww.map(x=>x*Y.total),gen=amounts.map((a,i)=>a-irp[i]);
  const plain=U.table(['자산','금액','일반 계좌','IRP'],A.names.map((n,i)=>[n,U.won(amounts[i]),U.won(gen[i]),i===0?'담지 않음':U.won(irp[i])]),'입력한 비중의 금액 (만 원 단위)','fit');
  if(!U.checked(el,'pshow'))return U.result(el,plain,`비중 합 100% ✓, IRP 안 합 1억 원 ✓. 윤 씨의 두 조건(위기 시나리오 한 해 손실 4,500만 원 이내, 채권·현금 9,000만 원 이상)과 IRP 위험자산 비중을 먼저 손으로 계산해 보세요. “계산 결과와 풀이 펼치기”를 켜면 숫자와 판정이 나옵니다.<br>${eigText}${U.kind(['real','assume'])}`);
  const s=solution(r,ww,irp);
  U.result(el,s.chart+plain,`${s.text}<br>${eigText}<br>${U.DISCLAIMER}${U.kind(['real','assume','news'],M.assumptions.irp+'.')}`);
 });
};
})();
