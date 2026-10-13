/* 1~4장 실험: 시가총액·EPS·BPS와 액면분할, PER·PBR·ROE와 비교 회사, 배당수익률과 주가에 담긴 요구수익률, EV와 EV/EBITDA.
   계산은 모두 VMath(js/math.js)로 한다. 새벽전자와 비교 회사 가·나·다·라는 미리 정한 가상 시나리오다. 결과 문장은 판정 없이 "이 숫자에서는 …"으로 쓴다. */
(()=>{
'use strict';
const U=VUI,M=VMath,A=M.ASSUME,E=U.ek,W=U.won,N=U.n1;
const MAN=x=>`${U.fmt(x)}만 주`;
VLabs['price-basics']=el=>{
 U.setup(el,U.number('pprice','주가 (원)',1,10000000,10,A.price,'새벽전자 2026년 4월 주가(가정)')+U.number('pshares','주식 수 (만 주)',1,1000000,1,A.shares/1e4)+U.number('pni','한 해 순이익 (억 원)',-100000,100000,0.1,A.years[2025].ni,'2025 사업연도, 5권 마지막 과제')+U.number('peq','기말 자본 (억 원)',-100000,100000,0.1,A.years[2025].equity,'2025년 말, 5권 마지막 과제')+U.select('psplit','액면분할',[['1','나누지 않음'],['2','1주를 2주로'],['5','1주를 5주로'],['10','1주를 10주로']],'2'));
 U.bind(el,()=>{
  const price=U.num(el,'pprice'),sh=U.num(el,'pshares'),ni=U.num(el,'pni'),eq=U.num(el,'peq'),f=Number(U.value(el,'psplit'));
  for(const [v,name,why] of [[price,'주가','1원에서 1,000만 원 사이로 넣어야 합니다.'],[sh,'주식 수','1만 주에서 100억 주 사이로 넣어야 합니다.'],[ni,'순이익','−10조 원에서 10조 원 사이의 숫자(억 원)를 넣어야 합니다.'],[eq,'기말 자본','−10조 원에서 10조 원 사이의 숫자(억 원)를 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  const o={price,shares:sh*1e4,ni,equity:eq},b=M.basics(o),s=M.split(o,f);
  const rows=[['주가',W(b.price),W(s.price)],['주식 수',MAN(b.shares/1e4),MAN(s.shares/1e4)],['EPS',W(b.eps),W(s.eps)],['BPS',W(b.bps),W(s.bps)],['시가총액',E(b.cap),E(s.cap)]];
  const max=Math.max(Math.abs(b.price),Math.abs(b.eps),Math.abs(b.bps),1);
  const chart=U.hbars({label:`나누기 전 주가 ${W(b.price)}, EPS ${W(b.eps)}, BPS ${W(b.bps)}; 나눈 뒤 ${W(s.price)}, ${W(s.eps)}, ${W(s.bps)}; 시가총액 ${E(b.cap)} 그대로`,max:[max,max],groups:[{title:'나누기 전 (원/주)',rows:[['주가',b.price,W(b.price)],['EPS',b.eps,W(b.eps)],['BPS',b.bps,W(b.bps)]]},{title:f>1?`1주를 ${f}주로 나눈 뒤 (원/주)`:'나누지 않음',rows:[['주가',s.price,W(s.price),f>1],['EPS',s.eps,W(s.eps),f>1],['BPS',s.bps,W(s.bps),f>1]]}]})+U.table(['항목','나누기 전',f>1?`1주를 ${f}주로`:'나누지 않음'],rows,'한 주의 숫자와 회사 전체의 숫자',true);
  const sp=f>1?`1주를 ${f}주로 나누면 주가 <b>${W(s.price)}</b>, EPS <b>${W(s.eps)}</b>, BPS <b>${W(s.bps)}</b>으로 한 주의 숫자만 1/${f}이 되고, 시가총액은 <b>${E(s.cap)}</b> 그대로입니다(✓ 같음).`:'주식을 나누지 않았습니다. 액면분할을 골라 한 주의 숫자와 시가총액이 각각 어떻게 되는지 보세요.';
  U.result(el,chart,`시가총액 = ${U.fmt(price)}원 × ${MAN(sh)} = <b>${E(b.cap)}</b>, EPS = ${N(ni)}억 원 ÷ ${MAN(sh)} = <b>${W(b.eps)}</b>, BPS = ${N(eq)}억 원 ÷ ${MAN(sh)} = <b>${W(b.bps)}</b>.<br>${sp}<br>주가는 시장에서 체결된 값이고, 이 숫자들만으로 회사의 가치가 정해지지는 않습니다.${U.kind(['real','scenario'])}`);
 });
};
/* 점 그림: 가로 ROE, 세로 PBR. 같은 해 이익·같은 시점 자본이면 점은 원점에서 나온 기울기 PER의 직선 위에 있다. */
function scatter(points,label){
 const L=56,R=460,T=20,B=240,mx=Math.max(...points.map(p=>p.x),0.05)*1.2,my=Math.max(...points.map(p=>p.y),0.5)*1.2,X=v=>L+Math.max(0,v)/mx*(R-L),Y=v=>B-Math.max(0,v)/my*(B-T);
 let s=`<path d="M${L} ${B}H${R}M${L} ${B}V${T}" stroke="var(--muted)"/>`;
 U.niceTicks(0,mx,4).forEach(v=>{s+=`<text x="${X(v).toFixed(1)}" y="${B+16}" text-anchor="middle" class="axis">${U.pct(v,0)}</text>`;});
 U.niceTicks(0,my,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${U.sfmt(v,1)}</text>`;});
 points.forEach(p=>{s+=`<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.on?7:5}" fill="${p.on?'var(--accent)':'var(--blue)'}"/><text x="${(X(p.x)+(X(p.x)>R-80?-9:9)).toFixed(1)}" y="${(Y(p.y)+4).toFixed(1)}" text-anchor="${X(p.x)>R-80?'end':'start'}" class="price">${p.on?'▲ ':''}${U.esc(p.name)}</text>`;});
 s+=`<text x="${R}" y="${B+34}" text-anchor="end" class="axis">가로 ROE · 세로 PBR(배)</text>`;
 return U.svg(label,s,282);
}
function peerRows(t,sb,custom){
 return [...t.map(p=>[`비교 회사 ${p.name}`,U.times(p.per),U.pct(p.roe),U.times(p.pbr),U.pct(p.growth,0),U.pct(p.payout,0)]),[`<b>▲ 새벽전자 ${sb.year}</b>`,`<b>${U.times(sb.per)}</b>`,U.pct(sb.roe),U.times(sb.pbr),'5%(기준안)',U.pct(A.dps/sb.eps)],['직접 넣은 회사',U.times(custom.per),U.pct(custom.roe),U.times(custom.pbr),'',''] ];
}
VLabs['multiple-compare']=el=>{
 U.setup(el,U.select('myear','새벽전자의 사업연도',[['2025','2025 사업연도 (기말 자본 900.8억 원)'],['2024','2024 사업연도 (기말 자본 776억 원)']],'2025')+U.select('mbasis','새벽전자 PER의 이익',[['trailing','후행 PER: 지난 한 해 EPS'],['forward','선행 PER: 내년 EPS = 지난해 EPS × 1.05']],'trailing','선행 EPS는 이 책의 단순화')+U.check('msame','ROE를 같은 해 이익·같은 시점 자본으로 계산',true,'끄면 다른 해의 자본으로 나눕니다')+U.group('직접 넣는 회사 (가상)',U.number('mper','PER (배)',0.1,200,0.1,16)+U.number('mroe','ROE (%)',-50,100,0.1,12,'PER과 같은 해 이익, 같은 시점 자본')+U.number('mroe2','PBR이 그대로일 때 바뀐 ROE (%)',0.1,100,0.1,9)),true);
 U.bind(el,()=>{
  const year=Number(U.value(el,'myear')),fwd=U.value(el,'mbasis')==='forward',same=U.checked(el,'msame'),cp=U.num(el,'mper'),cr=U.num(el,'mroe'),cr2=U.num(el,'mroe2');
  if(cp===null)return U.result(el,'',U.problem('PER','0.1에서 200 사이의 배수를 넣어야 합니다.'));
  if(cr===null)return U.result(el,'',U.problem('ROE','−50에서 100 사이의 %를 넣어야 합니다.'));
  if(cr2===null)return U.result(el,'',U.problem('바뀐 ROE','0.1에서 100 사이의 %를 넣어야 합니다.'));
  const y=A.years[year],other=A.years[year===2025?2024:2025],m=M.multiples({ni:y.ni,equity:y.equity}),per=fwd?M.forwardPer(A.price,m.eps,A.base.growth).per:m.per;
  const roe=same?m.roe:y.ni/other.equity,ok=Math.abs(roe*per-m.pbr)<1e-9,sb={year,per,pbr:m.pbr,roe,eps:m.eps};
  const t=M.peerTable(),pv=M.peerValues(year),custom={per:cp,roe:cr/100,pbr:cp*cr/100},per2=custom.pbr/(cr2/100);
  const pts=[...t.map(p=>({name:p.name,x:p.roe,y:p.pbr})),{name:'새벽전자',x:roe,y:m.pbr,on:true},{name:'직접',x:custom.roe,y:custom.pbr}];
  const chart=scatter(pts,`ROE와 PBR: ${t.map(p=>`${p.name} ${U.pct(p.roe)}·${U.times(p.pbr)}`).join(', ')}, 새벽전자 ${U.pct(roe)}·${U.times(m.pbr)}`)+U.table(['회사','PER','ROE','PBR = ROE × PER','매출 성장률','배당성향'],peerRows(t,sb,custom),'비교 회사 가·나·다·라와 새벽전자',true);
  const mix=same?'':`${year} 순이익 ${N(y.ni)}억 원을 ${year===2025?2024:2025}년 말 자본 ${N(other.equity)}억 원으로 나눴습니다. `;
  const chk=ok?`= PBR ✓ 맞음`:`≠ PBR ${U.times(m.pbr)} ✗ 어긋남 · ${mix}${fwd?'선행 PER에는 다음 해 이익이 들어가 ':''}PER과 ROE의 기준이 섞였습니다`;
  U.result(el,chart,`새벽전자 ${year}: ${fwd?'선행 ':''}PER = ${U.fmt(A.price)} ÷ ${W(fwd?m.eps*(1+A.base.growth):m.eps)} = <b>${U.times(per)}</b>, PBR = ${U.fmt(A.price)} ÷ ${W(m.bps)} = <b>${U.times(m.pbr)}</b>, ROE <b>${U.pct(roe)}</b>. ROE × PER = ${U.sfmt(roe,3)} × ${U.times(per)} = ${U.sfmt(roe*per,2)} ${chk}.<br>PER이 가장 낮은 비교 회사 가(8배)는 ROE 9.0%, 매출 성장률 2%로 넷 가운데 둘 다 가장 낮습니다. 비교 회사 중앙값 PER ${U.times(pv.median.per)} × EPS ${W(m.eps)} = <b>${W(pv.values.per)}</b>, 중앙값 PBR ${U.times(pv.median.pbr,3)} × BPS ${W(m.bps)} = <b>${W(pv.values.pbr)}</b>.<br>직접 넣은 회사: PBR = ${U.pct(custom.roe)} × ${U.times(cp,1)} = <b>${U.times(custom.pbr)}</b>. PBR이 그대로이고 ROE가 ${U.pct(cr2/100)}가 되면 PER = ${U.times(custom.pbr)} ÷ ${U.pct(cr2/100)} = <b>${U.times(per2)}</b>.${U.kind(['real','scenario'],fwd?`<span class="kind-tag model-tag">${U.KINDS.simple}</span>`:'')}`);
 });
};
VLabs['dividend-yield']=el=>{
 U.setup(el,U.number('dprice','주가 (원)',1,10000000,10,A.price)+U.number('ddps','주당 배당 (원)',0,1000000,1,A.dps,'2025 사업연도 배당 40억 원 ÷ 1,000만 주')+U.number('deps','EPS (원)',1,1000000,1,M.basics().eps,'1장에서 계산')+U.number('dg','배당 성장률 (%, 해마다 영원히)',-10,20,0.1,A.dividendGrowth*100,'한 단계 모형의 단순화')+U.number('droe','ROE (%)',-50,100,0.1,18.3,'2장, 기말 자본 기준'));
 U.bind(el,()=>{
  const price=U.num(el,'dprice'),dps=U.num(el,'ddps'),eps=U.num(el,'deps'),g=U.num(el,'dg'),roe=U.num(el,'droe');
  for(const [v,name,why] of [[price,'주가','1원 이상이어야 합니다.'],[dps,'주당 배당','0원 이상이어야 합니다.'],[eps,'EPS','1원 이상이어야 합니다. 이익이 0 이하이면 배당성향을 계산하지 않습니다.'],[g,'배당 성장률','−10%에서 20% 사이로 넣어야 합니다.'],[roe,'ROE','−50%에서 100% 사이로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  const d=M.dividend({dps,price,eps,roe:roe/100}),r=M.impliedR(dps,price,g/100),over=g/100>=d.sustainableG;
  const chart=U.hbars({label:`D₁ ÷ P ${U.pct(r.yield1,2)} + g ${U.pct(g/100,2)} = r ${U.pct(r.r,2)}; 배당 ${W(dps)}, 남긴 이익 ${W(eps-dps)}`,max:[Math.max(Math.abs(r.r),Math.abs(r.yield1),Math.abs(g/100),1e-9),Math.max(eps,dps)],groups:[{title:'r = D₁ ÷ P + g',rows:[['D₁ ÷ P',r.yield1,U.pct(r.yield1,2)],['g (배당 성장률)',g/100,U.pct(g/100,2)],['r (요구수익률)',r.r,U.pct(r.r,2),true]]},{title:`EPS ${W(eps)}의 쓰임`,rows:[['배당',dps,`${W(dps)} (${U.pct(d.payout)})`],['남긴 이익',eps-dps,`${W(eps-dps)} (${U.pct(d.retention)})`]]}]});
  const note=over?`<br>▲ 배당 성장률 ${U.pct(g/100)}가 지속 가능 성장률 ${U.pct(d.sustainableG)} 이상입니다. 남긴 이익과 이 ROE만으로는 그 성장을 이어 가기 어렵다는 뜻이라 더 확인할 신호입니다.`:`<br>지속 가능 성장률은 ROE가 그대로이고 이익을 같은 비율로 계속 남긴다는 조건의 값입니다. 경제 성장률보다 높은 성장은 영원히 이어질 수 없어 7장에서 상한을 다룹니다.`;
  U.result(el,chart,`배당수익률 = ${W(dps)} ÷ ${W(price)} = <b>${U.pct(d.yield,2)}</b>, 배당성향 = ${W(dps)} ÷ ${W(eps)} = <b>${U.pct(d.payout)}</b>(유보율 ${U.pct(d.retention)}).<br>배당이 해마다 ${U.pct(g/100)}씩 영원히 자란다고 놓으면 D₁ = ${W(dps)} × ${U.sfmt(1+g/100,3)} = ${W(r.d1)}, r = ${W(r.d1)} ÷ ${W(price)} + ${U.pct(g/100)} = <b>${U.pct(r.r,2)}</b>입니다. 이 주가에 담긴 요구수익률이며, 이 수익률이 보장된다는 뜻은 아닙니다.<br>지속 가능 성장률 = ${U.pct(d.retention)} × ${U.pct(roe/100)} = <b>${U.pct(d.sustainableG)}</b>.${note}${U.kind(['real','scenario','simple'],'배당이 같은 비율로 영원히 자란다는 한 단계 모형은 이 책의 단순화입니다.')}`);
 });
};
VLabs['ev-bridge']=el=>{
 U.setup(el,U.select('eyear','새벽전자의 결산일',[['2025','2025년 말'],['2024','2024년 말']],'2025','바꾸면 차입금·현금·EBITDA 칸을 그해 숫자로 채웁니다')+U.number('ecap','시가총액 (억 원)',0,1000000,1,M.basics().cap,'주가 20,000원 × 1,000만 주')+U.number('edebt','차입금 (억 원)',0,1000000,0.1,A.years[2025].debt,'단기차입금 + 사채')+U.number('ecash','현금 (억 원)',0,1000000,0.1,A.years[2025].cash)+U.number('eebitda','EBITDA (억 원)',-100000,1000000,0.1,A.years[2025].op+A.years[2025].dep,'영업이익 + 감가상각')+U.number('emult','매길 때 쓰는 EV/EBITDA (배)',0,50,0.1,M.peerValues().median.evEbitda,'비교 회사 가·나·다·라의 중앙값 7.5배'));
 U.bind(el,e=>{
  if(e&&e.target&&e.target.id==='eyear'){const y=A.years[U.value(el,'eyear')];el.querySelector('#edebt').value=y.debt;el.querySelector('#ecash').value=y.cash;el.querySelector('#eebitda').value=y.op+y.dep;}
  const cap=U.num(el,'ecap'),debt=U.num(el,'edebt'),cash=U.num(el,'ecash'),eb=U.num(el,'eebitda'),mult=U.num(el,'emult');
  for(const [v,name,why] of [[cap,'시가총액','0 이상의 숫자(억 원)를 넣어야 합니다.'],[debt,'차입금','0 이상의 숫자(억 원)를 넣어야 합니다.'],[cash,'현금','0 이상의 숫자(억 원)를 넣어야 합니다.'],[eb,'EBITDA','숫자(억 원)를 넣어야 합니다.'],[mult,'EV/EBITDA 배수','0에서 50 사이의 배수를 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  if(eb<=0)return U.result(el,'',U.problem('EBITDA','0 이하라 EV/EBITDA를 계산할 수 없습니다. 0보다 큰 값을 넣어 주세요.'));
  const x=M.ev(cap,debt,cash),firm=mult*eb,eq=M.equityValue(firm,x.netDebt),pv=M.peerValues();
  const chart=U.waterfall({title:'EV = 시가총액 + 차입금 − 현금 (억 원)',start:['시가총액',cap],steps:[['차입금',debt],['현금|(빼기)',-cash]],end:['EV',x.ev],fmt:v=>N(v),twoLine:true,label:`시가총액 ${N(cap)} + 차입금 ${N(debt)} − 현금 ${N(cash)} = EV ${N(x.ev)}억 원`});
  U.result(el,chart,`순차입금 = ${N(debt)} − ${N(cash)} = <b>${E(x.netDebt)}</b>, EV = ${N(cap)} + ${N(x.netDebt)} = <b>${E(x.ev)}</b>, EV/EBITDA = ${N(x.ev)} ÷ ${N(eb)} = <b>${U.times(x.ev/eb)}</b>.<br>배수 ${U.times(mult,1)}로 매긴 기업가치 ${U.times(mult,1)} × ${N(eb)} = ${E(firm)}에서 순차입금 ${E(x.netDebt)}을 빼면 주주 몫 ${E(eq.equity)}, 새벽전자 주식 1,000만 주로 나누면 주당 <b>${W(eq.perShare)}</b>입니다.<br>비교 회사 중앙값 세 가지(EV/EBITDA·PBR·PER)로 매긴 2025년 말 새벽전자의 주당 가치: <b>${W(pv.low)}~${W(pv.high)}</b>.${U.kind(['real','scenario'],'EBITDA는 이 책이 영업이익 + 감가상각으로 계산한 값입니다. K-IFRS가 정한 표시 항목이 아니라는 점은 기준서 원문으로 확인하지 못했습니다.')}`);
 });
};
})();
