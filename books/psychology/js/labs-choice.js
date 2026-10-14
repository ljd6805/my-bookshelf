/* 1부 실험: 같은 선택지 두 틀 실험(1장), 가치 함수 실험(2장), 처분 효과 측정 실험(3장).
   계산은 PMath.frames·sameOrDiff·prospect·threshold·weightTable·certainty·disposition·pgrPlr만 쓴다.
   1장: 독자의 선택은 이 화면의 선택 칸에만 있고 어디에도 저장하지 않는다(브라우저 저장소를 쓰지 않음). 결과는 같음/다름만 보인다.
   기대값과 끝 금액은 “기대값과 끝 금액 펼치기”를 켤 때만 보인다(기본값의 B·D 끝 금액은 확인 문제의 답이다).
   2장: 확률 가중은 켜기 단추 안에서만 보이고, 가중을 켠 문턱(274.07만 원)도 켤 때만 나온다.
   3장: 일지 범위는 1~13주와 14~26주 둘뿐이다(26주 전체는 마지막 과제에서만). 3장 L2의 네 칸은 “직접 입력”으로만 넣는다. */
(()=>{
'use strict';
const U=PUI,M=PMath,J=M.JOURNAL,F=M.FACTS;
const man=x=>`${U.sfmt(x,0)}만 원`,sman=x=>`${U.splus(x,0)}만 원`,f2=x=>U.sfmt(x,2),f3=x=>x==null?'계산할 수 없음':U.sfmt(x,3);
const PS=[['1/4',1/4],['1/3',1/3],['1/2',1/2],['2/3',2/3],['3/4',3/4]],pName=p=>(PS.find(x=>Math.abs(x[1]-p)<1e-9)||[String(p)])[0];
/* ── 1장 ── */
function frameInputs(){
 const m=J.memo.frame;
 return U.group('선택지 (만 원)',U.number('fs','시작 금액 (만 원)',100,10000,10,m.start)+U.number('fsure','확실한 쪽의 금액 (만 원)',0,5000,10,m.sure)+U.select('fp','모험하는 쪽의 확률',PS.map(([k])=>[k,k]),'1/3')+U.number('famt','모험하는 쪽의 금액 (만 원)',10,5000,10,m.amount,'손실 틀은 이 금액을 먼저 받았다고 친 뒤 묻습니다'))
  +U.group('내 선택 (이 화면에서만 셉니다)',U.select('fg','이익 틀에서 고른 쪽',[['','아직 고르지 않음'],['sure','A · 확실한 쪽'],['risky','B · 모험하는 쪽']],'')+U.select('fl','손실 틀에서 고른 쪽',[['','아직 고르지 않음'],['sure','C · 확실한 쪽'],['risky','D · 모험하는 쪽']],''))
  +U.check('fshow','기대값과 끝 금액 펼치기',false,'두 틀에 모두 답한 뒤에 켜 보세요');
}
function endsText(ends){return ends.map(([p,x])=>`${man(x)}${ends.length>1?`(확률 ${pName(p)})`:''}`).join(' 또는 ');}
function frameShown(f,p){
 const g=f.gain,l=f.loss,abSame=Math.abs(g.A.ev-g.B.ev)<1e-9,cdSame=Math.abs(l.C.ev-l.D.ev)<1e-9;
 const tbl=U.table(['선택지','기대 손익','끝 금액','끝 금액 기대값'],[['A 확실',sman(g.A.ev),endsText(g.A.ends),man(g.start+g.A.ev)],['B 모험',sman(g.B.ev),endsText(g.B.ends),man(g.start+g.B.ev)],['C 확실',sman(l.C.ev),endsText(l.C.ends),man(l.start+l.C.ev)],['D 모험',sman(l.D.ev),endsText(l.D.ends),man(l.start+l.D.ev)]],'네 선택지의 기대 손익과 끝 금액','fit');
 const line=(a,b,x,y,same)=>same?`${a}·${b} 기대 손익 ${sman(x)} · 같음`:`${a} ${sman(x)}, ${b} ${sman(y)} · 다름`;
 const text=`${line('A','B',g.A.ev,g.B.ev,abSame)}. ${line('C','D',l.C.ev,l.D.ev,cdSame)}. 끝 금액 기대값은 A ${man(g.start+g.A.ev)}, B ${man(g.start+g.B.ev)}, C ${man(l.start+l.C.ev)}, D ${man(l.start+l.D.ev)}입니다.`;
 return {tbl,text};
}
PLabs['two-frame-choice']=el=>{
 U.setup(el,frameInputs(),true);
 U.bind(el,()=>{
  const s=U.num(el,'fs'),sure=U.num(el,'fsure'),amt=U.num(el,'famt'),p=PS.find(x=>x[0]===U.value(el,'fp'))[1];
  if(s===null)return U.result(el,'',U.problem('시작 금액','100만 원에서 10,000만 원 사이로 넣어 주세요.'));if(sure===null)return U.result(el,'',U.problem('확실한 쪽의 금액','0에서 5,000만 원 사이로 넣어 주세요.'));if(amt===null)return U.result(el,'',U.problem('모험하는 쪽의 금액','10만 원에서 5,000만 원 사이로 넣어 주세요.'));
  const f=M.frames(s,sure,p,amt),pn=pName(p),qn=pName(1-p);
  const ask=U.table(['틀','출발','확실한 쪽','모험하는 쪽'],[['이익 틀',man(s),`A · 확실히 ${sman(sure)}`,`B · ${pn} 확률로 ${sman(amt)}, ${qn} 확률로 0원`],['손실 틀',`${man(s+amt)} (${man(amt)}을 먼저 받음)`,`C · 확실히 ${sman(sure-amt)}`,`D · ${pn} 확률로 0원, ${qn} 확률로 ${sman(-amt)}`]],'두 틀의 문항','fit');
  const gp=U.value(el,'fg'),lp=U.value(el,'fl');
  const pick=gp&&lp?`두 틀에서 고른 쪽: <b>${M.sameOrDiff(gp,lp)}</b>. 점수나 판정은 붙이지 않습니다.`:'두 틀에서 하나씩 고르면 고른 쪽이 같은지 다른지만 나옵니다.';
  const note=`${M.TEXT.frameNote}. 선택은 이 화면 안에서만 세고 브라우저에 저장하지 않습니다.<br>원 연구(Tversky·Kahneman ${F.framing.year})는 이익 틀(${F.framing.people[0]}명)과 손실 틀(${F.framing.people[1]}명)을 서로 다른 사람에게 물었고, 확실한 쪽을 고른 비율이 ${U.sfmt(F.framing.sure[0]*100,0)}%와 ${U.sfmt(F.framing.sure[1]*100,0)}%였습니다. 한 사람이 두 틀에 모두 답하는 이 실험과는 묻는 방식이 달라 비율을 그대로 견줄 수 없습니다.`;
  if(!U.checked(el,'fshow'))return U.result(el,ask,`${pick}<br>${note}<br>두 선택지의 기대값과 끝 금액은 “기대값과 끝 금액 펼치기”를 켜면 나옵니다.${U.kind(['real','paper'],'문항의 금액은 미리 정한 시나리오(선우의 연습 문항)입니다.')}`);
  const sh=frameShown(f,p);
  U.result(el,ask+sh.tbl,`${pick}<br>${sh.text}<br>${note}${U.kind(['real','paper'])}`);
 });
};
/* ── 2장 ── */
function valueChart(G,L,o){
 const lo=-Math.max(L,G)*1.5,hi=Math.max(L,G)*1.5,pts=[];for(let k=0;k<=60;k++){const x=lo+(hi-lo)*k/60;pts.push([x,M.value(x,o)]);}
 const vg=M.value(G,o),vl=M.value(-L,o);
 return U.xy({series:[{name:`가치 함수 (α ${f2(o.alpha)}, β ${f2(o.beta)}, λ ${f2(o.lambda)})`,pts,color:'var(--blue)'}],points:[{name:`v(${U.sfmt(G,0)}) = ${f2(vg)}`,x:G,y:vg,shape:'●',color:'var(--accent)'},{name:`v(−${U.sfmt(L,0)}) = ${f2(vl)}`,x:-L,y:vl,shape:'■',color:'var(--orange)'}],
  refs:[{x:0}],xlabel:'이익·손실 x (만 원)',ylabel:'가치 v(x)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,0),h:320,label:`v(${G}) ${f2(vg)}, v(−${L}) ${f2(vl)}`});
}
function weightPart(o){
 const rows=M.weightTable(undefined,o).map(r=>[`${U.sfmt(r.p*100,0)}%`,U.sfmt(r.gain,4),U.sfmt(r.loss,4)]),ce=M.ASSUME.ceExample;
 const tbl=U.table(['확률 p','이익 쪽 무게 w⁺(p)','손실 쪽 무게 w⁻(p)'],rows,'확률 가중 표 (γ 0.61, δ 0.69)','fit');
 const c1=M.certainty(ce.ps[0],ce.amount,o);
 return {tbl,text:`확률 가중을 켰습니다. 1% 확률로 ${U.sfmt(ce.amount,0)}만 원을 받는 내기의 확실성 등가는 <b>${f2(c1)}만 원</b>으로 기대값 ${U.sfmt(ce.ps[0]*ce.amount,0)}만 원보다 큽니다(작은 확률을 크게 느낌).`};
}
PLabs['value-function']=el=>{
 const m=J.memo.prospect,P0=M.ASSUME.prospect;
 U.setup(el,U.group('반반 내기 (단위 만 원, 이길 확률 50%)',U.number('pg','이익 G (만 원)',1,1000,1,m.gain)+U.number('pls','손실 L (만 원)',1,1000,1,m.loss))
  +U.group('모수 (한 연구의 중앙값이 기본값)',U.number('pl','손실 회피 계수 λ',0.1,5,0.01,P0.lambda)+U.number('pa','이익 쪽 굽음 α',0.1,1.5,0.01,P0.alpha)+U.number('pb','손실 쪽 굽음 β',0.1,1.5,0.01,P0.beta))
  +U.check('pw','확률 가중 켜기',false,'켜면 곡선과 표가 나오고 이익에 γ 0.61, 손실에 δ 0.69의 무게를 씁니다'));
 U.bind(el,()=>{
  const G=U.num(el,'pg'),L=U.num(el,'pls'),lam=U.num(el,'pl'),a=U.num(el,'pa'),b=U.num(el,'pb');
  if(G===null)return U.result(el,'',U.problem('이익 G','1만 원에서 1,000만 원 사이로 넣어 주세요.'));if(L===null)return U.result(el,'',U.problem('손실 L','1만 원에서 1,000만 원 사이로 넣어 주세요.'));
  if(lam===null)return U.result(el,'',U.problem('손실 회피 계수 λ','0.1에서 5 사이로 넣어 주세요.'));if(a===null||b===null)return U.result(el,'',U.problem(a===null?'α':'β','0.1에서 1.5 사이로 넣어 주세요.'));
  const wt=U.checked(el,'pw'),o={lambda:lam,alpha:a,beta:b,weighting:wt},r=M.prospect(G,L,o),th=M.threshold(L,o);
  let chart=valueChart(G,L,o),text=`v(${U.sfmt(G,0)}) = ${U.sfmt(G,0)}^${f2(a)} = ${f2(r.vg)}, v(−${U.sfmt(L,0)}) = −${f2(lam)} × ${U.sfmt(L,0)}^${f2(b)} = ${f2(r.vl)}.<br>`;
  text+=wt?`전망 가치 = ${U.sfmt(r.wg,4)} × ${f2(r.vg)} + ${U.sfmt(r.wl,4)} × (${f2(r.vl)}) = <b>${U.splus(r.value,2)}</b> `:`전망 가치 = 0.5 × ${f2(r.vg)} + 0.5 × (${f2(r.vl)}) = <b>${U.splus(r.value,2)}</b> `;
  text+=`${U.verdict(r.accept,'받아들임','거절')} · 기대값은 ${sman(r.ev)}입니다.<br>이 손실 L에서 받아들이는 최소 이익 = <b>${f2(th)}만 원</b>${wt?' (확률 가중 켬)':' (확률 가중 끔)'}.`;
  if(wt){const w=weightPart(o);chart+=w.tbl;text+=`<br>${w.text}`;}
  U.result(el,chart,`${text}${U.kind(['real','paper'],`모수는 ${M.TEXT.paramNote}. 단위가 바뀌면 값도 바뀝니다.`)}`);
 });
};
/* ── 3장 ── */
function tallyTable(d){
 const rows=d.days.map(x=>[`${x.week}주`,x.name,x.RG,x.PG,x.RL,x.PL]);rows.push(['합계',`매도한 날 ${d.days.length}번`,`<b>${d.RG}</b>`,`<b>${d.PG}</b>`,`<b>${d.RL}</b>`,`<b>${d.PL}</b>`]);
 return U.table(['주','판 종목','RG','PG','RL','PL'],rows,'매도한 날의 네 칸','compact');
}
PLabs['disposition-count']=el=>{
 U.setup(el,U.select('drange','일지 범위',[['1-13','선우의 일지 1~13주'],['14-26','선우의 일지 14~26주'],['direct','직접 입력(네 칸)']],'1-13','26주 전체는 마지막 과제에서 셉니다')
  +U.group('직접 입력 (일지 범위에서 “직접 입력”을 고를 때)',U.number('dRG','실현 이익 RG',0,999,1,4)+U.number('dPG','평가 이익 PG',0,999,1,1)+U.number('dRL','실현 손실 RL',0,999,1,2)+U.number('dPL','평가 손실 PL',0,999,1,2)));
 U.bind(el,()=>{
  const range=U.value(el,'drange');let d,chart,head;
  if(range==='direct'){const v={};for(const [k,n] of [['dRG','실현 이익'],['dPG','평가 이익'],['dRL','실현 손실'],['dPL','평가 손실']]){v[k.slice(1)]=U.num(el,k,true);if(v[k.slice(1)]===null)return U.result(el,'',U.problem(n+' 칸','0 이상의 정수로 넣어 주세요.'));}
   d=M.pgrPlr(v);head='직접 넣은 네 칸';chart=U.table(['RG','PG','RL','PL'],[[d.RG,d.PG,d.RL,d.PL]],'직접 넣은 네 칸','compact');}
  else{const [a,b]=range.split('-').map(Number);d=M.disposition(a,b);head=`선우의 일지 ${a}~${b}주`;chart=tallyTable(d);}
  if(d.pgr==null&&d.plr==null)return U.result(el,chart,U.problem('네 칸','네 칸이 모두 0이면 두 비율을 계산할 수 없습니다.'));
  const vals=[d.pgr,d.plr].map(x=>x==null?0:x);
  chart+=U.columns({labels:['PGR','PLR'],values:vals,fmt:(v,i)=>[d.pgr,d.plr][i]==null?'없음':f3(v),tick:v=>U.sfmt(v,1),title:`${head} · PGR과 PLR`,h:240,label:`PGR ${f3(d.pgr)}, PLR ${f3(d.plr)}`,colors:['var(--blue)','var(--orange)']});
  const gap=d.gap==null?'차이는 계산할 수 없습니다':`차이 PGR − PLR = <b>${U.splus(d.gap,3)}</b>`;
  const plr=d.plr==null?`PLR <b>계산할 수 없음</b>(매도한 날에 손실 종목이 없음)`:`PLR = RL ÷ (RL + PL) = ${d.RL} ÷ ${d.RL+d.PL} = <b>${f3(d.plr)}</b>`;
  const pgr=d.pgr==null?`PGR <b>계산할 수 없음</b>(매도한 날에 이익 종목이 없음)`:`PGR = RG ÷ (RG + PG) = ${d.RG} ÷ ${d.RG+d.PG} = <b>${f3(d.pgr)}</b>`;
  U.result(el,chart,`${head}: ${pgr}, ${plr}. ${gap}.<br>${range==='direct'?'':`매도한 날이 ${d.days.length}번뿐이라 이 차이는 처분 효과의 흔적일 뿐 확정하지 못합니다. `}칸은 그 주 종가와 평균 단가(살 때 수수료 포함)를 견주어 셉니다.${U.kind(range==='direct'?['real']:['real','scenario'])}`);
 });
};
})();
