/* 4~6장 실험: 현재가치, 상환표, 순현재가치와 내부수익률. 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won,P=U.pct;
MLabs.discount=el=>{
 U.setup(el,U.number('pfv','미래에 받을 돈 (만 원)',1,100000,1,1100,'1~100,000만 원')+U.range('pyears','몇 년 뒤 (년)',1,30,1,3)+U.range('prate','할인율 (연 %)',0,15,.1,3));
 U.bind(el,()=>{
  const fv=U.num(el,'pfv'),n=U.value(el,'pyears'),r=U.value(el,'prate');
  if(fv===null)return U.result(el,'',U.problem('금액','미래에 받을 돈은 1만 원에서 100,000만 원 사이의 숫자로 넣어야 합니다.'));
  const amount=fv*1e4,today=M.pv(amount,r,n),steps=Array.from({length:n+1},(_,t)=>[t,M.pv(amount,r,n-t)/1e4]);
  const chart=U.lines([{name:'그 해 시점의 값',points:steps,color:'var(--accent)'}],{label:`${n}년 뒤 ${F(fv,0)}만 원을 할인율 ${r}%로 오늘까지 데려온 값. 오늘 ${W(today)}.`,xName:'오늘부터 지난 해',yName:'만 원',yFmt:v=>F(v,0),marks:[[0,today/1e4,`오늘 ${W(today)}`],[n,fv,'']]});
  const chain=n<=4?`<br>한 해씩 거꾸로: ${steps.slice().reverse().map(([t,v],i)=>i?`÷ ${F(1+r/100,3)} → ${F(v,1)}만`:`${n}년 뒤 ${F(v,0)}만`).join(' ')}.`:'';
  const near=M.pv(1e6,r,1),far=M.pv(1e6,r,30);
  U.result(el,chart,`${n}년 뒤 ${W(amount)}의 현재가치는 할인율 ${P(r,1)}에서 <b>${W(today)}</b>입니다. 이 가정에서는 이 상품에 오늘 그보다 많이 내면, 같은 금리로 맡기는 것보다 불리합니다.${chain}<br>같은 할인율에서 1년 뒤 100만 원은 ${W(near)}, 30년 뒤 100만 원은 ${W(far)}입니다.${U.kind('real','할인율은 가정이며, 할인율을 말하지 않은 현재가치는 비교할 수 없습니다.')}`);
 });
};
const METHODS=[['level','원리금균등 (달마다 같은 금액)'],['principal','원금균등 (원금을 똑같이)'],['bullet','만기일시 (이자만 내다 마지막에 원금)']];
const methodName=k=>METHODS.find(m=>m[0]===k)[1].split(' (')[0];
function scheduleChart(s,prepay){
 const rows=s.rows,n=rows.length,top=Math.max(...rows.slice(0,n-1).map(r=>r.pay),rows[0].pay,1),bw=400/n,H=190,body=rows.map((r,i)=>{const x=60+i*bw,cut=i===n-1&&r.principal>top,hp=Math.min(r.principal,top)/top*H,hi=r.interest/top*H,dim=prepay&&i>=prepay?' fill-opacity=".3"':'';return `<rect x="${x.toFixed(1)}" y="${(220-hp-hi).toFixed(1)}" width="${Math.max(bw-1,.6).toFixed(1)}" height="${hi.toFixed(1)}" fill="var(--orange)"${dim}/><rect x="${x.toFixed(1)}" y="${(220-hp).toFixed(1)}" width="${Math.max(bw-1,.6).toFixed(1)}" height="${hp.toFixed(1)}" fill="var(--blue)"${dim}/>${cut?`<text x="${x}" y="24" text-anchor="end" class="axis">마지막 달 원금 ↑ 잘림</text>`:''}`;}).join('');
 const key=`<rect x="60" y="246" width="12" height="12" fill="var(--orange)"/><text x="78" y="257" class="axis">이자</text><rect x="130" y="246" width="12" height="12" fill="var(--blue)"/><text x="148" y="257" class="axis">원금</text>${prepay?`<text x="230" y="257" class="axis">흐린 막대: 미리 갚아 내지 않는 달</text>`:''}`;
 return U.svg(`${n}개월 상환표. 첫 달 ${W(rows[0].pay)}(이자 ${W(rows[0].interest)}), 이자 합계 ${W(s.totalInterest)}.`,`<path d="M60 220H462" stroke="var(--line)"/><text x="54" y="224" text-anchor="end" class="axis">0</text><text x="54" y="34" text-anchor="end" class="axis">${F(top/1e4,1)}만</text><text x="462" y="238" text-anchor="end" class="axis">${n}개월</text>${body}${key}`,270);
}
function prepayText(s,k,fee){
 if(!k)return fee>0?`<br>중도상환수수료율 ${P(fee,1)}를 넣었지만, 미리 갚는 달을 0(안 갚음)으로 두어 수수료를 계산하지 않았습니다.`:'';
 if(k>=s.rows.length)return '<br>미리 갚는 달이 만기와 같거나 뒤라서 아낄 이자가 없습니다.';
 const left=s.rows[k-1].left,saved=s.rows.slice(k).reduce((a,r)=>a+r.interest,0),cost=Math.round(left*fee/100),net=saved-cost;
 return `<br>${k}개월째 끝에 남은 원금 ${W(left)}을 모두 갚으면 그 뒤 이자 <b>${W(saved)}</b>를 내지 않습니다. 중도상환수수료 ${P(fee,1)}는 ${W(cost)}이라, 이 가정에서는 수수료를 빼고 ${net>=0?`${W(net)}을 아낍니다`:`오히려 ${W(-net)} 더 냅니다`}(아낀 이자는 할인하지 않고 더한 값).`;
}
MLabs.schedule=el=>{
 U.setup(el,U.range('lprin','빌린 돈 (만 원)',100,5000,50,600)+U.range('lrate','연 금리 (%)',0,20,.1,6)+U.range('lmonths','기간 (개월)',6,120,6,36)+U.select('lmethod','상환 방식',METHODS,'level')+U.range('lpre','미리 다 갚는 달 (0 = 안 갚음)',0,120,1,0)+U.range('lfee','중도상환수수료율 (%)',0,3,.1,0));
 U.bind(el,()=>{
  const p=U.value(el,'lprin')*1e4,r=U.value(el,'lrate'),n=U.value(el,'lmonths'),method=el.querySelector('#lmethod').value,k=U.value(el,'lpre'),fee=U.value(el,'lfee');
  const s=M.schedule(p,r,n,method),all=METHODS.map(([key])=>[key,M.schedule(p,r,n,key)]);
  const chart=scheduleChart(s,k<n?k:0)+U.table(['방식','첫 달 낼 돈','이자 합계'],all.map(([key,x])=>[`${methodName(key)}${key===method?' ✓':''}`,W(x.first.pay),W(x.totalInterest)]),`${F(p/1e4,0)}만 원 · 연 ${r}% · ${n}개월`);
  const head=method==='level'?`달마다 <b>${W(s.first.pay)}</b>을 냅니다.`:method==='principal'?`원금을 달마다 ${W(s.first.principal)}씩 갚아 첫 달 <b>${W(s.first.pay)}</b>에서 마지막 달 ${W(s.last.pay)}까지 줄어듭니다.`:`달마다 이자 <b>${W(s.first.interest)}</b>만 내다가 마지막 달에 원금과 함께 ${W(s.last.pay)}을 냅니다.`;
  const first=`첫 달 이자는 남은 원금 ${W(p)} × ${P(r,1)} ÷ 12 = ${W(s.first.interest)}이고 원금 몫은 ${W(s.first.principal)}입니다.`;
  U.result(el,chart,`${methodName(method)}: ${head} ${first} ${n}개월 동안 낸 이자는 모두 <b>${W(s.totalInterest)}</b>이고, 마지막 달에 남은 원금 ${W(s.last.left)}이 됩니다.<br>같은 조건에서 이자 합계는 ${all.map(([key,x])=>`${methodName(key)} ${W(x.totalInterest)}`).join(', ')}입니다.${prepayText(s,k,fee)}${U.kind('real','이자는 달마다 남은 원금 × 연 금리 ÷ 12를 원 단위로 반올림했고, 마지막 달에 끝수를 맞췄습니다. 실제 대출의 일수 계산과 다를 수 있습니다.')}`);
 });
};
/* 현금흐름 글 읽기: "−100, 60, 60" → [-100,60,60]. 수학 기호 −도 받는다. 2~31개, 각 값은 ±1,000,000 안. */
function parseFlows(s){const parts=s.replace(/−/g,'-').split(/[,\s]+/).filter(Boolean),v=parts.map(Number);return v.length>=2&&v.length<=31&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=1e6)?v:null;}
MLabs.npv=el=>{
 U.setup(el,U.text('nflows','현금흐름 (만 원, 오늘부터 해마다, 쉼표로)','-100, 60, 60','내면 −, 받으면 +. 예: -100, 230, -132')+U.range('nrate','할인율 (연 %)',0,40,.5,5));
 U.bind(el,()=>{
  const flows=parseFlows(el.querySelector('#nflows').value),r=U.value(el,'nrate');
  if(!flows)return U.result(el,'',U.problem('현금흐름','숫자 2~31개를 쉼표로 나눠 넣어야 합니다. 예: -100, 60, 60'));
  const value=M.npv(r,flows),roots=M.irr(flows),grid=Array.from({length:81},(_,i)=>i*.5);
  const chart=U.lines([{name:'NPV',points:grid.map(x=>[x,M.npv(x,flows)]),color:'var(--accent)'}],{label:`현금흐름 ${flows.join(', ')}의 할인율별 순현재가치. 할인율 ${r}%에서 ${F(value,2)}만 원.`,xName:'할인율 (%)',yName:'NPV (만 원)',yFmt:v=>U.sfmt(v,0),zero:true,marks:[[r,value,`${r}% → ${U.sfmt(value,2)}만`],...roots.filter(x=>x>=0&&x<=40).map(x=>[x,0,''])]});
  const parts=flows.map((c,t)=>`${U.sfmt(c/Math.pow(1+r/100,t),1)}`).join(' + ').replace(/\+ −/g,'− ');
  const irrText=roots.length===0?'NPV를 0으로 만드는 할인율이 −99%~1,000% 안에 없습니다. 이 흐름에는 IRR이 없습니다.':roots.length===1?`NPV가 0이 되는 할인율, 곧 IRR은 <b>${P(roots[0])}</b>입니다.`:`NPV가 0이 되는 할인율이 <b>${roots.map(x=>P(x)).join('와 ')}</b> ${roots.length}개입니다. 이런 흐름에서 “IRR이 몇 %”라는 한 문장은 뜻이 없습니다.`;
  const sign=value>0?'0보다 커서, 이 가정에서는 같은 할인율로 다른 곳에 두는 것보다 이 계약의 숫자가 큽니다.':value<0?'0보다 작아서, 이 가정에서는 같은 할인율로 다른 곳에 두는 쪽의 숫자가 큽니다.':'0이라 두 선택의 숫자가 같습니다.';
  U.result(el,chart,`할인율 ${P(r,1)}에서 해마다의 현재가치를 더하면 ${parts} = <b>${U.sfmt(value,2)}만 원</b>입니다. NPV가 ${sign}<br>${irrText} 그림은 할인율 0~40% 구간만 그립니다.${U.kind('real','현금흐름은 직접 넣은 숫자이며, IRR은 −99%~1,000%에서 부호가 바뀌는 곳을 좁혀 찾았습니다.')}`);
 });
};
})();
