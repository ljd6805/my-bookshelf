/* 4~5장 실험: 채권 가격과 만기수익률, 듀레이션과 볼록성. 가격은 BMath.priceFromYield, 거꾸로는 BMath.ytm(뉴턴법 → 이분법)이다. */
(()=>{
'use strict';
const U=BUI,M=BMath,F=U.fmt,P=U.pct,PP=U.ppct,R=U.rate;
const REALY=[0.03961,0.04376];
const isReal=y=>REALY.some(r=>Math.abs(r-y)<1e-9);
/* 4장: 금리 → 가격(경과이자 포함), 가격 → 만기수익률. */
function priceChart(b,name,y,P0,dirty){
 const pts=[];for(let i=0;i<=80;i++){const v=i/1000;pts.push([v*100,M.priceFromYield(b,v)]);}
 const dots=[{x:y*100,y:P0,label:`${F(y*100,3)}% → ${F(P0,2)}원`,left:y>0.05}];
 if(dirty)dots.push({x:y*100,y:dirty,shape:'square',label:`더러운 가격 ${F(dirty,2)}원`,left:y>0.05,dy:-14});
 return U.xy({series:[{pts,name:`${name}의 가격 (원)`}],dots,hlines:[[10000,'액면 10,000원']],xlim:[0,8],xfmt:v=>`${F(v,0)}%`,xlab:'시장 금리 y',h:260,label:`${name} 가격과 시장 금리. ${F(y*100,3)}%에서 ${F(P0,2)}원`});
}
function pvTable(b,y,name){
 const q=1+y/b.freq,rows=M.cashFlows(b).filter(x=>x.cf>0).map(x=>[`${x.k}회 (${F(x.t,1)}년)`,`${F(x.cf,2)}원`,F(1/Math.pow(q,x.k),6),`<b>${F(x.cf/Math.pow(q,x.k),2)}원</b>`]);
 return U.table(['받는 칸','받는 돈','할인 계수','오늘의 값'],rows,`${name} · 칸마다 할인한 값`);
}
BLabs.price=el=>{
 U.setup(el,U.select('pbond','채권',[['nara3','나라 3년 (연 3.875%, 3년)'],['nara10','나라 10년 (연 4.5%, 10년)'],['saebyeok','새벽전자 3년 (연 5.0%, 3년)'],['zero3','3년 할인채 (이자 없음)']],'nara3')+U.select('pmode','계산 방향',[['y2p','금리 → 가격'],['p2y','가격 → 만기수익률']],'y2p')+U.number('pyield','시장 금리 y (%)',0,8,0.001,3.961,'2026-10-07 국고 3년 3.961%, 10년 4.376%')+U.number('pprice','시장 가격 (원, 가격 → 만기수익률일 때)','','',0.01,9975.90,'이자 지급일의 값으로 봅니다')+U.range('pday','직전 이자 지급일부터 지난 날',0,181,1,0,'이번 이자 기간 182일'));
 U.bind(el,()=>{
  const key=U.value(el,'pbond'),b=U.bond(key),name=U.BONDS[key].name,mode=U.value(el,'pmode'),day=+U.value(el,'pday');
  el.querySelector('#pprice').closest('label').classList.toggle('dim',mode!=='p2y');el.querySelector('#pyield').closest('label').classList.toggle('dim',mode==='p2y');
  if(mode==='p2y'){
   const s=el.querySelector('#pprice').value.trim().replace(/,/g,''),price=Number(s);
   if(s===''||!Number.isFinite(price)||price<=0)return U.result(el,'',U.problem('가격','0보다 큰 숫자를 넣어야 합니다. 가격이 0 이하면 만기수익률을 정할 수 없습니다.'));
   let r;try{r=M.ytm(b,price);}catch(e){return U.result(el,'',U.problem('가격',`연 −50%~+100% 안에서 이 가격을 만드는 금리가 없습니다(찾지 못함). ${name}의 받을 돈은 모두 ${F(M.cashFlows(b).reduce((a,x)=>a+x.cf,0),2)}원입니다.`));}
   return U.result(el,priceChart(b,name,r.ytm,price),`${name}${U.josa(name,"이","가")} <b>${F(price,2)}원</b>에 거래된다면, 칸마다 할인한 합을 이 값으로 만드는 금리, 곧 만기수익률은 <b>${R(r.ytm)}</b>입니다. ${r.method==='newton'?'뉴턴법':'뉴턴법과 이분법'}으로 <b>${F(r.iterations)}번</b> 고쳐 찾았습니다. ${U.status(price)}.<br>이 값은 오늘 이 가격에 사서 만기까지 들고, 받은 이표를 같은 금리로 다시 굴린다고 할 때의 연 수익률(채권 한 장의 IRR)입니다. 지난 날 칸은 이 방향에서 쓰지 않습니다.${U.kind('real','나라 3년·나라 10년·새벽전자·할인채는 가상의 채권입니다.')}`);
  }
  const yp=U.num(el,'pyield');if(yp===null)return U.result(el,'',U.problem('시장 금리','0에서 8 사이의 숫자(%)를 넣어야 합니다.'));
  const y=yp/100,P0=M.priceFromYield(b,y),ai=day?M.accruedInterest(b,day,182):0,dirty=day?M.dirtyPrice(b,y,day,182):0,clean=day?M.cleanPrice(b,y,day,182):P0;
  const cmp=b.couponRate>0?` 시장 금리 ${R(y)}${y>b.couponRate+1e-12?' &gt; ':y<b.couponRate-1e-12?' &lt; ':' = '}표면금리 ${R(b.couponRate)}.`:(y>1e-12?' 이자가 없어 시장 금리가 0보다 크면 언제나 액면보다 쌉니다.':' 이자가 없지만 시장 금리가 0이라 할인되지 않아 액면과 같습니다.');
  const accr=day?`<br><b>${F(day)}일째</b>에 사면: 경과이자 = 이표 ${F(10000*b.couponRate/2,2)}원 × ${F(day)}/182 = <b>${F(ai,2)}원</b>. 실제로 주고받는 더러운 가격은 <b>${F(dirty,2)}원</b>, 경과이자를 뺀 깨끗한 가격은 <b>${F(clean,2)}원</b>입니다.`:'';
  U.result(el,priceChart(b,name,y,P0,dirty)+pvTable(b,y,name),`시장 금리 <b>${R(y)}</b>로 ${name}의 받을 돈을 반년 금리 ${R(y/2,4)}씩 할인해 더하면 <b>${F(P0,2)}원</b>입니다. <b>${U.status(P0)}</b>.${cmp}${accr}${U.kind(isReal(y)?['real','realfic']:'real',isReal(y)?'2026-10-07 국고채 금리를 가상 채권에 넣었습니다. 날짜 셈은 “지난 날 ÷ 이번 기간 날” 가정입니다.':'가상의 채권에 고른 금리를 넣었습니다.')}`);
 });
};
/* 5장: 금리 변화에 따른 가격 변화율(정확한 값·듀레이션 어림·볼록성까지), 무게중심 시소(시각적 비유). */
const SB=[['sn3','nara3',0.03961,'var(--blue)'],['sn10','nara10',0.04376,'var(--accent)'],['sz10','zero10',0.04376,'var(--orange)']];
function seesaw(list){
 const rowH=58,h=24+list.length*rowH,L=40,Rr=460,X=t=>L+t/10*(Rr-L);
 let s=`<text x="10" y="16" class="series">무게중심 시소 · 막대 = 칸마다 오늘의 값, ▲ = 듀레이션 D</text>`;
 list.forEach((o,i)=>{const base=24+(i+1)*rowH-14,cf=M.cashFlows(o.b),q=1+o.y/2,pv=cf.map(x=>x.cf/Math.pow(q,x.k)),mx=Math.max(...pv),D=M.macaulayDuration(o.b,o.y);
  s+=`<path d="M${L} ${base}H${Rr}" stroke="var(--text)" stroke-width="2"/>`;
  cf.forEach((x,k)=>{const hh=Math.max(1,pv[k]/mx*34);s+=`<rect x="${(X(x.t)-3).toFixed(1)}" y="${(base-hh).toFixed(1)}" width="6" height="${hh.toFixed(1)}" fill="${o.color}" opacity="${pv[k]>0?1:0}"/>`;});
  s+=`<path d="M${X(D).toFixed(1)} ${base}l9 13h-18z" fill="var(--text)"/><text x="${L}" y="${base-38}" class="axis">${U.esc(o.name)} · D ${F(D,2)}년</text>`;});
 [0,5,10].forEach(t=>{s+=`<text x="${X(t)}" y="${h-2}" text-anchor="middle" class="axis">${t}년</text>`;});
 return U.svg('채권마다 현금흐름의 오늘 값과 무게중심(듀레이션)을 시소로 그린 그림',s,h+6);
}
BLabs.sensitivity=el=>{
 U.setup(el,U.check('sn3','나라 3년 (3.961%)',true)+U.check('sn10','나라 10년 (4.376%)',true)+U.check('sz10','10년 할인채 (4.376%)',true)+U.range('sdy','금리 변화 Δy (%p)',-3,3,.25,1,'모든 만기 금리가 같은 폭으로 움직인다고 봄')+U.check('sdur','듀레이션 어림 (접선) 보기',true)+U.check('sconv','볼록성까지 더한 어림 보기',true));
 U.bind(el,()=>{
  const dy=+U.value(el,'sdy')/100,dur=U.checked(el,'sdur'),conv=U.checked(el,'sconv');
  const list=SB.filter(([id])=>U.checked(el,id)).map(([,key,y,color])=>({key,name:U.BONDS[key].name,b:U.bond(key),y,color}));
  if(!list.length)return U.result(el,'',U.problem('채권 선택','하나 이상 골라야 비교할 수 있습니다.'));
  const series=[],dots=[];
  list.forEach(o=>{const D=M.modifiedDuration(o.b,o.y),C=M.convexity(o.b,o.y),xs=[];for(let i=-12;i<=12;i++)xs.push(i/4);
   series.push({pts:xs.map(x=>[x,M.priceChange(o.b,o.y,x/100).exact*100]),color:o.color,dash:''});
   if(dur)series.push({pts:[[-3,D*3],[3,-D*3]],color:o.color,dash:'6 4',width:1.6});
   if(conv)series.push({pts:xs.map(x=>[x,(-D*x/100+.5*C*(x/100)**2)*100]),color:o.color,dash:'2 3',width:1.6});
   o.c=M.priceChange(o.b,o.y,dy);o.D=M.macaulayDuration(o.b,o.y);o.Dm=D;o.C=C;
   dots.push({x:dy*100,y:o.c.exact*100,color:o.color,label:`${o.name} ${PP(o.c.exact)}`,left:dy>0,dy:o.key==='nara3'?-8:o.key==='nara10'?14:-8});});
  const chart=U.xy({series,dots,xlim:[-3,3],xfmt:v=>`${U.splus(v,0)}%p`,yfmt:v=>`${U.sfmt(v,0)}%`,xlab:'금리 변화 Δy',vlines:[[dy*100,`Δy ${U.pp(dy)}`]],legend2:`━ 정확한 값${dur?'  ┅ 듀레이션 어림':''}${conv?'  ┈ 볼록성까지':''} · 파랑 나라 3년, 강조 나라 10년, 주황 10년 할인채`,h:300,label:`금리 변화에 따른 가격 변화율. ${list.map(o=>`${o.name} ${PP(o.c.exact)}`).join(', ')}`})+seesaw(list);
  const tbl=U.table(['채권','금리','가격','D (년)','D_mod','C','DV01','정확한 값','듀레이션 어림','볼록성까지'],list.map(o=>[o.name,R(o.y),`${F(o.c.price0,2)}원`,F(o.D,2),F(o.Dm,2),F(o.C,o.C>50?1:2),`${F(M.dv01(o.b,o.y),2)}원`,`<b>${PP(o.c.exact)}</b>`,PP(o.c.durationOnly),PP(o.c.withConvexity)]),`Δy ${U.pp(dy)}일 때`);
  const lines=list.map(o=>`${o.name}: 가격 ${F(o.c.price0,2)}원 → <b>${F(o.c.price1,2)}원</b>, 정확한 값 <b>${PP(o.c.exact)}</b>${dur?`, 듀레이션만 쓴 어림 ${PP(o.c.durationOnly)}`:''}${conv?`, 볼록성까지 ${PP(o.c.withConvexity)}`:''} (D ${F(o.D,2)}년, D_mod ${F(o.Dm,2)})`).join('<br>');
  const asym=list.find(o=>o.key==='nara10')&&dy!==0?(()=>{const o=list.find(x=>x.key==='nara10'),up=M.priceChange(o.b,o.y,Math.abs(dy)).exact,dn=M.priceChange(o.b,o.y,-Math.abs(dy)).exact;return `<br>볼록성: 나라 10년은 금리가 ${F(Math.abs(dy)*100,2)}%p 내리면 ${PP(dn)}, 오르면 ${PP(up)}로, 내릴 때 더 많이 움직입니다.`;})():'';
  U.result(el,chart+tbl,`금리가 <b>${U.pp(dy)}</b> 움직이면<br>${lines}${asym}${U.kind(['real','realfic','metaphor'],'2026-10-07 국고채 금리를 가상 채권에 넣은 값이고, 시소 그림은 시각적 비유입니다.')}`);
 });
};
})();
