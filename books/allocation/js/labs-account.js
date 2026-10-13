/* 6·7장 실험: 목표 표준편차에 맞는 주식·채권·현금 비중, 비중이 벗어난 계좌를 되돌리는 두 규칙의 매매 금액.
   계산은 AMath.mix·targetStock·rebalance만 쓴다. 주식은 누리200, 채권은 채권 묶음, 현금은 σ 0(V-0 가정)이다.
   6장 기본값은 60/30/10과 목표 σ 10%·현금 10%이고, L2(목표 8%·현금 0)와 확인 문제(누리200 60%·현금 40%)는 비교 예제에 넣지 않는다.
   7장의 4년 경로는 가상이고 매매 비용·세금은 넣지 않는다. 판 금액·산 금액으로 쓰며 끝 금액의 순서는 이 경로에서만 성립한다고 적는다. */
(()=>{
'use strict';
const U=AUI,M=AMath,MIX=M.ASSUME.mixes,RB=M.ASSUME.rebalance;
const p2=x=>U.pct(x,2),man=x=>`${U.sfmt(Math.abs(x),1)}만 원`;
ALabs['target-mix']=el=>{
 U.setup(el,U.banner()+U.group('지금 비중 (%, 합 100)',U.number('ms','주식 (누리200)',0,100,1,60)+U.number('mb','채권 묶음',0,100,1,30)+U.number('mc','현금',0,100,1,10))
  +U.group('목표 표준편차에서 비중 찾기',U.number('mt','목표 표준편차 (%)',0,30,0.1,10,'연율')+U.number('mtc','현금 비중 (%)',0,99,1,10,'주식과 채권이 나머지를 나눕니다')),true);
 U.bind(el,()=>{
  const ws=U.num(el,'ms'),wb=U.num(el,'mb'),wc=U.num(el,'mc'),t=U.num(el,'mt'),tc=U.num(el,'mtc');
  if([ws,wb,wc].some(x=>x===null))return U.result(el,'',U.problem('비중','0%에서 100% 사이로 넣어 주세요.'));
  if(t===null)return U.result(el,'',U.problem('목표 표준편차','0%에서 30% 사이로 넣어 주세요.'));if(tc===null)return U.result(el,'',U.problem('현금 비중','0%에서 99% 사이로 넣어 주세요.'));
  const tot=ws+wb+wc;if(Math.abs(tot-100)>1e-9)return U.result(el,'',U.problem('비중',`주식·채권·현금의 합이 ${U.sfmt(tot,0)}%입니다. 합이 100%가 되게 넣어 주세요.`));
  const now=M.mix(ws/100,wb/100,wc/100);let tg=null,terr='';try{tg=M.targetStock(t/100,tc/100);}catch(e){terr=U.why(e);}
  const rows=MIX.map(w=>M.mix(...w)),labels=MIX.map(w=>w.map(x=>Math.round(x*100)).join('/')),same=MIX.findIndex(w=>w.every((x,i)=>Math.abs(x*100-[ws,wb,wc][i])<1e-9));
  const vals=same>=0?rows:[...rows,now],labs=same>=0?labels:[...labels,`지금|${[ws,wb,wc].map(x=>U.sfmt(x,0)).join('/')}`];
  const chart=U.columns({labels:labs.map(l=>l.includes('|')?l:`${l}|주식/채권/현금`),values:vals.map(r=>r.sigma*100),mark:i=>same>=0?i===same:i===vals.length-1,fmt:v=>U.sfmt(v,2)+'%',tick:v=>U.sfmt(v,0)+'%',twoLine:true,title:'배분별 표준편차 (%) · ▲ 지금 비중',h:270,label:labs.map((l,i)=>`${l}: σ ${p2(vals[i].sigma)}`).join(', ')})
   +U.table(['주식/채권/현금','기대수익','표준편차','나쁜 해 어림 μ − 2σ'],rows.map((r,i)=>[`${i===same?'▲ ':''}${labels[i]}`,p2(r.mu),`<b>${p2(r.sigma)}</b>`,p2(r.bad)]),'배분표 (누리200·채권 묶음·현금, V-0 가정)','compact');
  const tline=tg?`목표 σ ${U.sfmt(t,1)}%, 현금 ${U.sfmt(tc,0)}%: 주식 <b>${p2(tg.w[0])}</b> · 채권 <b>${p2(tg.w[1])}</b>, 기대수익 <b>${p2(tg.mu)}</b>(이차방정식에서 주식이 많은 쪽 근).`:`<span class="verdict bad">✗ 목표 σ ${U.sfmt(t,1)}%, 현금 ${U.sfmt(tc,0)}%</span> · ${terr}`;
  U.result(el,chart,`지금 비중 ${[ws,wb,wc].map(x=>U.sfmt(x,0)).join('/')}: μ <b>${p2(now.mu)}</b>, σ <b>${p2(now.sigma)}</b>, 나쁜 해 어림 μ − 2σ = ${p2(now.bad)}(정규분포를 가정한 어림이며 실제 꼬리는 더 두꺼울 수 있습니다).<br>${tline}<br>현금은 σ 0이라 표준편차를 비중에 비례해 줄이고, 채권은 주식과 상관 −0.2로 섞여 비례보다 더 줄입니다.${U.kind(['real','assume'])}`);
 });
};
const joinList=a=>a.map(x=>U.sfmt(x*100,1).replace('−','-')).join(', ');
const RULES=[['none','되돌리지 않음'],['annual','연 1회'],['band','허용 폭']];
ALabs['rebalance-rules']=el=>{
 U.setup(el,U.group('계좌와 규칙',U.number('rs','시작 금액 (만 원)',1,1e7,1,RB.start,'1억 원 = 10,000만 원')+U.number('rt','목표 주식 비중 (%)',1,99,1,RB.target*100)+U.number('rw','허용 폭 (±%p)',0,50,0.5,RB.band*100,'이 폭을 넘을 때만 되돌립니다'))
  +U.group('가상 경로 (해마다 수익률 %, 쉼표로 나눔)',U.text('rps','주식',joinList(RB.stock))+U.text('rpb','채권',joinList(RB.bond))),true);
 U.bind(el,()=>{
  const st=U.num(el,'rs'),tg=U.num(el,'rt'),bd=U.num(el,'rw'),ps=U.list(el,'rps',1),pb=U.list(el,'rpb',1);
  if(st===null)return U.result(el,'',U.problem('시작 금액','1만 원 이상으로 넣어 주세요.'));if(tg===null)return U.result(el,'',U.problem('목표 비중','1%에서 99% 사이로 넣어 주세요.'));if(bd===null)return U.result(el,'',U.problem('허용 폭','0에서 50%p 사이로 넣어 주세요.'));
  if(!ps)return U.result(el,'',U.problem('주식 경로','쉼표로 나눈 숫자를 넣어 주세요.'));if(!pb)return U.result(el,'',U.problem('채권 경로','쉼표로 나눈 숫자를 넣어 주세요.'));
  if(ps.length!==pb.length)return U.result(el,'',U.problem('경로의 길이',`주식 ${ps.length}년치, 채권 ${pb.length}년치입니다. 해마다 짝을 지으려면 개수가 같아야 합니다.`));
  if([...ps,...pb].some(x=>x<=-100))return U.result(el,'',U.problem('경로','한 해 수익률은 −100%보다 커야 합니다.'));
  const o={start:st,target:tg/100,band:bd/100,stock:ps.map(x=>x/100),bond:pb.map(x=>x/100)},res=RULES.map(([r])=>M.rebalance(r,o)),years=ps.map((_,i)=>`${i+1}년`);
  const say=t=>Math.abs(t)<1e-9?'되돌리지 않고 그대로 둡니다(쉼).':t>0?`주식 ${man(t)}을 팔아 채권을 삽니다.`:`주식 ${man(t)}어치를 사고 채권을 팝니다.`;
  const trade=t=>Math.abs(t)<1e-9?'쉼':t>0?`주식 ${man(t)} 팔아 채권 사기`:`주식 ${man(t)}어치 사고 채권 팔기`;
  const chart=U.xy({series:res.map((r,k)=>({name:`${RULES[k][1]} · 되돌리기 전 주식 비중`,pts:[[0,tg],...r.rows.map(x=>[x.year,x.weight*100])],marks:r.rows.map((_,i)=>i+1),shape:['○','●','◆'][k],dash:['dot','solid','dash'][k],color:['var(--muted)','var(--blue)','var(--accent)'][k]})),
   refs:[{y:tg+bd,text:`목표 + ${U.sfmt(bd,1)}%p`},{y:tg-bd,text:`목표 − ${U.sfmt(bd,1)}%p`}],xmin:0,xmax:ps.length,xcount:Math.min(ps.length,6),xtick:v=>Number.isInteger(v)?`${v}년`:'',ytick:v=>U.sfmt(v,0)+'%',ylabel:'연말 주식 비중 (되돌리기 전, %)',title:'해마다 연말 주식 비중',h:330+0,label:res.map((r,k)=>`${RULES[k][1]}: ${r.rows.map(x=>p2(x.weight)).join(', ')}`).join('; ')})
   +U.table(['해','연말 비중 (되돌리기 전)','연 1회','허용 폭'],res[1].rows.map((x,i)=>[years[i],`${p2(x.weight)} (${x.drift>=0?'+':'−'}${U.ppt(Math.abs(x.drift))})`,trade(x.trade),`${p2(res[2].rows[i].weight)} → ${trade(res[2].rows[i].trade)}`]),'규칙별 매매 금액 (만 원, 비용·세금 제외)','fit')
   +U.table(['규칙','끝 금액'],res.map((r,k)=>[RULES[k][1],`<b>${U.won(r.end)}</b>`]),`${ps.length}년 뒤 끝 금액 (이 경로에서만 성립)`,'compact');
  const y1=res[1].rows[0];
  U.result(el,chart,`1년째 연말 주식 비중 ${p2(y1.weight)}(목표에서 ${y1.drift>=0?'+':'−'}${U.ppt(Math.abs(y1.drift))}): 연 1회 규칙에서는 ${say(y1.trade)} 허용 폭 ±${U.sfmt(bd,1)}%p 규칙에서는 ${say(res[2].rows[0].trade)}<br>${ps.length}년 뒤 끝 금액: 되돌리지 않음 ${U.won(res[0].end)}, 연 1회 ${U.won(res[1].end)}, 허용 폭 ${U.won(res[2].end)}. 이 순서는 이 경로의 결과이며, 리밸런싱은 수익을 키우는 규칙이 아니라 위험을 목표 비중에 묶는 규칙입니다.${U.kind(['real','assume'],'매매 비용과 세금은 넣지 않았습니다.')}`);
 });
};
})();
