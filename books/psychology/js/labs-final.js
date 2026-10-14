/* 마지막 과제 실험(일지 점검 실험과 과제지): 26주 일지 전체의 점검표를 계산하고, 규칙 하나의 값을 고쳐 다시 계산하며, 일지 양식의 칸을 시험한다.
   계산은 PMath.audit·ruleReplay·pathRule·formCheck만 쓴다.
   (가)~(마)의 숫자(PGR·PLR은 L2, 보유 기간은 확인 문제의 답)는 “(가)~(마) 점검표 결과 펼치기”를 켤 때만, (바)의 규칙 대입 손익은 “(바) 고친 규칙의 결과 펼치기”를 켤 때만 보인다.
   기본 화면에는 (사) 양식 시험만 나온다. 비교 예제는 예측을 적은 뒤에 열린다(lab-guides.js). 독자 자신의 매매 기록은 이 화면에 올리지 않는다. */
(()=>{
'use strict';
const U=PUI,M=PMath,J=M.JOURNAL,RB=M.ASSUME.rebound;
const W=x=>U.won(x),SW=x=>(x>0?'+':'')+U.won(x),f3=x=>U.sfmt(x,3);
const FORM=[['reason','결정 당시의 이유'],['range','4주 뒤 예상 범위'],['counter','반대 증거'],['rule','적용할 규칙']];
function inputs(){
 return U.check('ashow','(가)~(마) 점검표 결과 펼치기',false,'과제지의 칸을 직접 계산한 뒤에 켜 보세요')
  +U.group('(바) 규칙 하나 고치기',U.number('ar1','R1: 평균 단가보다 몇 % 낮으면 팔기',1,50,0.5,J.rules.R1.limit*100)+U.number('ar2','R2: 한 종목 비중 한도 (%)',5,100,1,J.rules.R2.limit*100)+U.check('arshow','(바) 고친 규칙의 결과 펼치기',false,'지켰다면의 끝 금액과 손해일 수 있는 경로가 나옵니다'))
  +U.group('(사) 일지 양식의 칸',FORM.map(([k,n],i)=>U.check('af'+i,n,true)).join(''));
}
function auditPart(a){
 const d=a.disposition,h=a.holding,iv=a.intervals,to=a.turnover;
 const rows=[['(가) 매도한 날의 네 칸',`RG ${d.RG} · PG ${d.PG} · RL ${d.RL} · PL ${d.PL}`,`PGR <b>${f3(d.pgr)}</b> · PLR <b>${f3(d.plr)}</b>`],
  ['(나) 판 보유의 기간',`이익 매도 ${h.gains.length}건 · 손실 매도 ${h.losses.length}건`,`평균 ${U.sfmt(h.avgGain,1)}주 · ${U.sfmt(h.avgLoss,0)}주`],
  ['(다) 90% 범위와 비용',`적중 ${iv.hits}/${iv.n} · P(X ≤ ${iv.hits}) ${U.pct(iv.pAtMost,1)}`,`회전율 연 ${U.sfmt(to.annual*100,1)}% · 비용 ${W(to.cost)}`],
  ['(라) 남의 행동을 이유로 쓴 매수',`매수 ${a.buys}건 중`,`${a.others}건 (거래 ${J.trades.filter(t=>t.others).map(t=>t.n).join(', ')})`],
  ['(마) 규칙 위반','R1 처음 걸린 보유 · R2 넘은 주 · R3',`${a.r1First}건 · ${a.r2Weeks}번 · ${a.r3.missing}/${a.r3.buys}건`]];
 const tbl=U.table(['칸','센 것','결과'],rows,'일지 점검표 (가)~(마)','fit');
 const text=`(가) PGR = ${d.RG} ÷ ${d.RG+d.PG} = <b>${f3(d.pgr)}</b>, PLR = ${d.RL} ÷ ${d.RL+d.PL} = <b>${f3(d.plr)}</b>. (나) 이익 매도의 평균 보유 ${U.sfmt(h.avgGain,1)}주, 손실 매도 ${U.sfmt(h.avgLoss,0)}주.`
  +` (다) 적중 ${iv.hits}/${iv.n}, P(X ≤ ${iv.hits}) ${U.pct(iv.pAtMost,1)}, 회전율 연 ${U.sfmt(to.annual*100,1)}%, 비용 ${W(to.cost)}. (라) ${a.others}건. (마) R1 ${a.r1First}건, R2 ${a.r2Weeks}번, R3 ${a.r3.missing}/${a.r3.buys}건.`
  +`<br>손익: 실현 이익 ${SW(a.gains)}, 실현 손실 ${SW(a.losses)}, 평가 손익 ${SW(a.unreal)}, 합 ${SW(a.gains+a.losses+a.unreal)} = 끝 금액 − 시작 금액 ${SW(a.change)}.`;
 return {tbl,text};
}
function rulePart(l1,l2){
 const R=M.ruleReplay({r1:l1,r2:l2}),p=M.pathRule(RB,l1),split=Object.entries(R.split).filter(([,v])=>v.diff!==0);
 const tbl=U.table(['종목','일지대로','고친 규칙대로','차이'],Object.entries(R.split).map(([n,v])=>[n,SW(v.actual),SW(v.rule),v.diff?`<b>${SW(v.diff)}</b>`:'0원']),`R1 −${U.sfmt(l1*100,1)}%를 지켰을 때의 종목별 손익`,'fit');
 const path=p.trigger==null?`같은 R1을 ${RB.label}에 대면 걸리지 않아 들고 있는 것과 같습니다(${SW(p.hold)}).`:`같은 R1을 ${RB.label}에 대면 규칙대로 ${SW(p.rule)}, 들고 있으면 ${SW(p.hold)}${U.josa(SW(p.hold),'으로','로')} ${p.rule<p.hold?'규칙을 지킨 쪽이 손해입니다':'규칙을 지킨 쪽이 손실이 작습니다'}.`;
 const text=`(바) R1 −${U.sfmt(l1*100,1)}%를 지켰다면 끝 금액 <b>${W(R.rule)}</b>, 일지대로 ${W(R.actual)}, 차이 <b>${SW(R.diff)}</b>${split.length?`(${split.map(([n,v])=>`${n} ${SW(v.diff)}`).join(', ')})`:''}. “지켰다면”은 R1이 처음 걸린 주의 종가에 그 보유를 모두 팔고 그 종목의 이후 일지 매매(다시 사기와 물타기)는 하지 않는다고 놓은 계산입니다. R2 ${U.sfmt(l2*100,0)}%를 넘은 주는 ${R.r2.length}번입니다.<br>${path} 한 경로의 결과로 규칙을 판정할 수 없습니다.`;
 return {tbl,text};
}
PLabs['journal-audit']=el=>{
 U.setup(el,`<p class="assume-banner"><b>${U.DISCLAIMER}</b><br>${U.LABEL}. 독자 자신의 매매 기록은 이 화면에 올리지 않고 종이나 독자의 파일에 같은 양식으로 적습니다.</p>`+inputs(),true);
 U.bind(el,()=>{
  const l1=U.num(el,'ar1'),l2=U.num(el,'ar2');
  if(l1===null)return U.result(el,'',U.problem('R1 한도','1%에서 50% 사이로 넣어 주세요.'));if(l2===null)return U.result(el,'',U.problem('R2 한도','5%에서 100% 사이로 넣어 주세요.'));
  const picked=FORM.filter((_,i)=>U.checked(el,'af'+i));
  if(!picked.length)return U.result(el,'',U.problem('일지 양식의 칸','칸을 하나 이상 골라 주세요.'));
  const miss=M.formCheck(picked.map(([k])=>k)),buys=J.trades.filter(t=>t.side==='B').length;
  let chart=U.table(['양식의 칸',`선우의 매수 ${buys}건에서 빠진 수`],picked.map(([k,n])=>[n,`${miss[k]}건${miss[k]?'':' ✓'}`]),'(사) 일지 양식 시험','fit');
  let text=`(사) 고른 칸 ${picked.length}개: ${picked.map(([k,n])=>`${n} ${miss[k]}건`).join(', ')}이 선우의 매수 ${buys}건에서 빠졌습니다.`;
  if(U.checked(el,'ashow')){const a=auditPart(M.audit({r1:l1/100,r2:l2/100}));chart=a.tbl+chart;text=a.text+'<br>'+text;}
  else text+='<br>(가)~(마)는 과제지에서 직접 계산한 뒤 “(가)~(마) 점검표 결과 펼치기”를 켜 보세요.';
  if(U.checked(el,'arshow')){const r=rulePart(l1/100,l2/100);chart+=r.tbl;text+='<br>'+r.text;}
  else text+=' (바)의 손익은 “(바) 고친 규칙의 결과 펼치기”를 켜면 나옵니다.';
  U.result(el,chart,`${text}<br>${U.timed('tradeTax')} ${U.timed('fee')} ${U.RECHECK}${U.kind(['real','scenario','news'])}`);
 });
};
})();
