/* 5~8장 실험: 단일가 매매, 호가단위, 가격제한폭과 VI, 기준가 조정. 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won,esc=U.esc;
/* 5장 단일가 매매의 주문 묶음(정해 둔 예시). [가격,수량] 목록이며 기준가는 새벽전자 전일 종가 19,950원. */
const AUCTIONS={
 open:{name:'장 시작 · 양쪽이 고르게',buys:[[20100,100],[20050,200],[20000,300],[19990,400],[19950,500],[19900,300]],sells:[[19900,200],[19950,300],[19990,400],[20000,400],[20050,300],[20100,200]]},
 close:{name:'장 마감 · 매도가 몰림',buys:[[20050,100],[20000,200],[19990,300],[19950,300],[19900,400]],sells:[[19900,600],[19950,500],[19990,300],[20000,300],[20050,200]]}
};
function auctionChart(r){
 const t=r.table,top=Math.max(...t.flatMap(x=>[x.demand,x.supply]),1),x=i=>60+i*(370/Math.max(t.length-1,1)),y=v=>240-v/top*200;
 const path=k=>t.map((row,i)=>`${i?'L':'M'}${x(i)} ${y(row[k])}`).join('');
 const bi=t.findIndex(row=>row.price===r.best?.price);
 const ticks=t.map((row,i)=>`<text x="${x(i)}" y="262" text-anchor="middle">${F(row.price,0)}</text>`).join('');
 const mark=bi>=0?`<path d="M${x(bi)} 30V240" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/><text x="${x(bi)}" y="24" text-anchor="middle" class="price">체결가 ${F(r.best.price,0)}</text>`:'';
 const body=`<path d="M60 240H440" stroke="var(--line)"/>${ticks}<path d="${path('demand')}" fill="none" stroke="var(--blue)" stroke-width="3"/><path d="${path('supply')}" fill="none" stroke="var(--orange)" stroke-width="3" stroke-dasharray="8 4"/>${mark}<text x="64" y="${y(t[0].demand)-8}">살 사람(실선)</text><text x="440" y="${y(t.at(-1).supply)-8}" text-anchor="end">팔 사람(점선)</text>`;
 return U.svg(`단일가 수요·공급 그림. 가격이 오를수록 살 수량은 줄고 팔 수량은 늡니다.${r.best?` 체결가 ${r.best.price}원.`:''}`,body);
}
MLabs.auction=el=>{
 U.setup(el,U.select('ascene','주문 묶음',Object.entries(AUCTIONS).map(([k,v])=>[k,v.name]),'open')+U.range('amkt','더해 넣는 시장가 매수 수량 (주)',0,1500,50,0));
 U.bind(el,()=>{
  const s=AUCTIONS[el.querySelector('#ascene').value],q=U.value(el,'amkt'),buys=q?[...s.buys,[Infinity,q]]:s.buys,r=M.auction(buys,s.sells,19950);
  const rows=r.table.map(t=>[W(t.price),F(t.demand,0),F(t.supply,0),`${F(Math.min(t.demand,t.supply),0)}${r.best&&t.price===r.best.price?' ✓':''}`]);
  const chart=auctionChart(r)+U.table(['가격','이 가격에 살 수량(누적)','이 가격에 팔 수량(누적)','체결 가능'],rows);
  if(!r.best)return U.result(el,chart,`살 사람과 팔 사람의 가격이 겹치지 않아 체결되지 않습니다.${U.kind('real')}`);
  const b=r.best,left=b.demand>b.supply?`매수 ${F(b.demand-b.supply,0)}주`:b.supply>b.demand?`매도 ${F(b.supply-b.demand,0)}주`:'';
  U.result(el,chart,`모든 주문을 모아 한 가격을 고르면 <b>${W(b.price)}</b>에서 <b>${F(b.volume,0)}주</b>가 한꺼번에 체결됩니다. 이 가격에서 살 사람 ${F(b.demand,0)}주, 팔 사람 ${F(b.supply,0)}주이고, ${left?`체결되지 못하고 남는 주문은 ${left}입니다`:'남는 주문 없이 모두 맞습니다'}.<br>${q?`시장가 매수 ${F(q,0)}주를 더하면 가격마다 살 수량이 그만큼 늘어 체결가가 오를 수 있습니다. 기준가(전날 종가 19,950원)와 비교해 보세요.`:'시장가 매수를 더하면 가격마다 살 수량이 늘어 체결가가 오를 수 있습니다. 기준가는 전날 종가 19,950원입니다.'}${U.kind('real','체결 수량이 가장 많은 가격을 고르는 원칙을 교육용으로 단순화해 계산했고, 주문 묶음은 정해 둔 예시입니다.')}`);
 });
};
/* 호가단위 대비 비율 그래프: 가격을 로그 눈금으로 1,000~600,000원까지 그린다. */
function tickChart(price,kind){
 const lo=Math.log10(1000),hi=Math.log10(600000),x=p=>62+(Math.log10(p)-lo)/(hi-lo)*390,y=v=>240-v/.3*210;
 let d='';for(let i=0;i<=600;i++){const p=10**(lo+(hi-lo)*i/600);d+=`${i?'L':'M'}${x(p).toFixed(1)} ${y(M.tickSize(p,kind)/p*100).toFixed(1)}`;}
 const cur=price>=1000&&price<=600000?`<circle cx="${x(price)}" cy="${y(M.tickSize(price,kind)/price*100)}" r="6" fill="var(--accent)"/><path d="M${x(price)} 30V240" stroke="var(--accent)" stroke-dasharray="3 3"/>`:'';
 const grid=[[1000,'1천'],[2000,'2천'],[5000,'5천'],[20000,'2만'],[50000,'5만'],[200000,'20만'],[500000,'50만']].map(([p,l])=>`<text x="${x(p)}" y="262" text-anchor="middle">${l}</text>`).join('')+[0,.1,.2,.3].map(v=>`<text x="54" y="${y(v)+4}" text-anchor="end">${v.toFixed(1)}%</text><path d="M62 ${y(v)}H460" stroke="var(--line)" stroke-dasharray="2 4"/>`).join('');
 return U.svg(`가격에 따른 한 칸(호가단위)의 비율 그래프. 가격대 경계마다 비율이 뛰어오릅니다.`,grid+`<path d="${d}" fill="none" stroke="var(--blue)" stroke-width="2"/>${cur}<text x="460" y="22" text-anchor="end">한 칸 ÷ 가격 (%)</text>`);
}
MLabs.tick=el=>{
 U.setup(el,U.number('tprice','주문 가격 (원)',1000,600000,1,20030,'1,000~600,000원 사이의 정수')+U.select('tkind','종류',[['stock','주식'],['etf','ETF']],'stock'));
 U.bind(el,()=>{
  const price=U.value(el,'tprice'),kind=el.querySelector('#tkind').value,name=kind==='etf'?'ETF':'주식';
  if(!Number.isInteger(price)||price<1000||price>600000)return U.result(el,tickChart(0,kind),'<strong>가격을 확인해 주세요</strong> · 1,000원에서 600,000원 사이의 정수를 넣어야 계산합니다.');
  const t=M.tickSize(price,kind),ok=M.isValidPrice(price,kind),down=M.roundToTick(price,kind,'down'),up=M.roundToTick(price,kind,'up'),lad=M.ladder(ok?price:down,3,kind);
  const steps=U.chips([...lad.down,lad.price,...lad.up].map(p=>F(p,0)),i=>i===3?'now':'');
  const fix=ok?'눈금에 맞으므로 주문을 낼 수 있습니다.':`눈금에 맞지 않아 거부됩니다. 가까운 아래 가격은 <b>${W(down)}</b>, 위 가격은 <b>${W(up)}</b>입니다.`;
  U.result(el,tickChart(price,kind)+`<p class="caption">${W(lad.price)} 위아래 세 칸</p>`+steps,`${name} ${W(price)}의 가격대에서 한 칸(호가단위)은 <b>${W(t)}</b>입니다. ${fix}<br>한 칸은 가격의 <b>${F(t/price*100,3)}%</b>입니다. 사다리를 보면 경계 아래위로 칸 크기가 달라집니다.${U.kind('real','2023년 1월부터 쓰는 호가가격단위 표로 계산했습니다(조사 노트).')}`);
 });
};
/* 7장 가격 경로(정해 둔 예시). 새벽전자 기준가 19,950원에서 차례로 체결되려는 가격. */
const PATHS={
 steady:['꾸준히 오름',[19950,20100,20300,20500,20700,20950,21100,21300,21500,21700,21950,22000]],
 jump:['한 번에 뛰어오름',[19950,19980,20000,20050,20700,20900,21000,21200,21300,21400,21500,21600]],
 crash:['급히 떨어짐',[19950,19900,19850,19800,19500,19000,18600,18200,17900,17700,17500,17950]]
};
function viChart(path,hit,base){
 const lo=17000,hi=23000,x=i=>50+i*(370/(path.length-1)),y=p=>250-(p-lo)/(hi-lo)*220,line=(p,t,c)=>`<path d="M50 ${y(p)}H420" stroke="${c}" stroke-dasharray="5 4"/><text x="426" y="${y(p)+4}">${t}</text>`;
 const end=hit?hit.index:path.length-1,solid=path.slice(0,end+1).map((p,i)=>`${i?'L':'M'}${x(i)} ${y(p)}`).join(''),rest=hit?path.slice(end).map((p,i)=>`${i?'L':'M'}${x(end+i)} ${y(p)}`).join(''):'';
 const body=line(base,'기준',`var(--muted)`)+line(base*1.1,'+10%','var(--orange)')+line(base*.9,'−10%','var(--orange)')+`<path d="${solid}" fill="none" stroke="var(--blue)" stroke-width="3"/>${rest?`<path d="${rest}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 5"/>`:''}${hit?`<circle cx="${x(end)}" cy="${y(hit.price)}" r="8" fill="none" stroke="var(--accent)" stroke-width="3"/><text x="${x(end)}" y="${y(hit.price)-14}" text-anchor="middle" class="price">${hit.type} VI</text>`:''}<text x="50" y="22">↑ 상한가 ${F(M.priceLimits(base).upper,0)}원은 그림 위쪽 밖</text><text x="50" y="274">↓ 하한가 ${F(M.priceLimits(base).lower,0)}원은 그림 아래쪽 밖</text>`;
 return U.svg(`새벽전자 가격 경로 그림.${hit?` 기준가 다음 ${hit.index}번째 가격 ${hit.price}원에서 ${hit.type} VI 발동.`:' VI가 걸리지 않았습니다.'}`,body);
}
/* 상·하한가 계산 과정: 폭 = 기준가 × 30%를 기준가 눈금 아래에서 버림, 기준가 ± 폭을 그 가격대 눈금 아래에서 버림. */
function limitText(base){
 if(!Number.isInteger(base)||base<1000||base>600000)return '<strong>기준가를 확인해 주세요</strong> · 1,000원에서 600,000원 사이의 정수를 넣으면 상·하한가를 계산합니다.';
 const t=M.tickSize(base),raw=base*.3,width=Math.floor(raw/t)*t,lim=M.priceLimits(base),cut=base+width!==lim.upper;
 return `기준가 ${W(base)} × 30% = ${W(raw,1)}을 기준가의 눈금 ${W(t)} 아래에서 버리면 폭은 <b>${W(width)}</b>입니다. 상한가는 ${cut?`${W(base+width)}이 그 가격대 눈금 ${W(M.tickSize(base+width))}에 맞지 않아 버린 <b>${W(lim.upper)}</b>`:`기준가에 폭을 더한 <b>${W(lim.upper)}</b>`}, 하한가는 <b>${W(lim.lower)}</b>입니다.`;
}
MLabs.vi=el=>{
 U.setup(el,U.select('vpath','가격 경로',Object.entries(PATHS).map(([k,v])=>[k,v[0]]),'jump')+U.range('vdyn','동적 VI 문턱 (직전 체결가 대비 %)',2,6,.5,3)+U.number('vbase','상·하한가를 계산할 기준가 (원)',1000,600000,1,19950,'가격 경로 그림은 새벽전자 19,950원 기준 그대로입니다.'));
 U.bind(el,()=>{
  const base=19950,[name,path]=PATHS[el.querySelector('#vpath').value],dyn=U.value(el,'vdyn'),hit=M.viCheck(path,base,dyn);
  const head=limitText(U.value(el,'vbase'));
  const what=hit?`‘${name}’ 경로는 기준가 다음 ${hit.index}번째 가격 <b>${W(hit.price)}</b>에서 <b>${hit.type} VI</b>가 걸립니다(${hit.type==='정적'?'기준가':'직전 체결가'} 대비 ${F(hit.move,2)}%). 이때부터 약 2분 동안 접속매매가 멈추고 단일가 매매로 가격을 다시 정하므로, 점선으로 그린 뒤쪽 경로는 그대로 일어나지 않을 수 있습니다.`:`‘${name}’ 경로는 동적 문턱 ${F(dyn,1)}%와 정적 문턱 10%에 한 번도 닿지 않아 VI가 걸리지 않습니다. 마지막 가격 ${W(path.at(-1))}은 기준가 대비 ${F((path.at(-1)/base-1)*100,2)}%입니다.`;
  U.result(el,viChart(path,hit,base),`${head}<br>${what}<br>실제 동적 VI 문턱은 종목과 시간대마다 다릅니다.${U.kind('real','가격제한폭과 VI 판정은 규칙대로 계산했고, 가격 경로는 정해 둔 예시입니다.')}`);
 });
};
const EVENTS=[['paid','유상증자 (돈을 받고 새 주식 발행)'],['bonus','무상증자 (공짜로 새 주식 나눔)'],['split','액면분할 (한 주를 여러 주로)'],['dividend','현금배당 (배당락)']];
function eventBase(ev,close,ratio,issue,par){
 if(ev==='paid')return {...M.rightsBase(close,ratio,issue),how:`(${W(close)} + ${W(issue)} × ${F(ratio,2)}) ÷ (1 + ${F(ratio,2)})`};
 if(ev==='bonus')return {...M.rightsBase(close,ratio,0),how:`${W(close)} ÷ (1 + ${F(ratio,2)})`};
 if(ev==='split')return {...M.splitBase(close,5000,par),how:`${W(close)} × ${W(par)} ÷ 5,000원`};
 return {raw:close,base:close,how:'조정하지 않음'};
}
MLabs.rights=el=>{
 U.setup(el,U.select('rev','사건',EVENTS,'paid')+U.range('rclose','전날 종가 (원)',5000,100000,50,20000)+U.range('rratio','새 주식 비율 (기존 1주당)',.05,1,.05,.25)+U.range('rissue','유상증자 발행가 (원)',1000,50000,500,15000)+U.select('rpar','액면분할 뒤 액면가 (분할 전 5,000원)',[[2500,'2,500원 (2주로)'],[1000,'1,000원 (5주로)'],[500,'500원 (10주로)'],[100,'100원 (50주로)']],1000)+U.range('rdiv','주당 현금배당 (원)',0,2000,50,500));
 U.bind(el,()=>{
  const ev=el.querySelector('#rev').value,close=U.value(el,'rclose'),ratio=U.value(el,'rratio'),issue=U.value(el,'rissue'),par=U.value(el,'rpar'),div=U.value(el,'rdiv');
  const r=eventBase(ev,close,ratio,issue,par),lim=M.priceLimits(r.base),name=EVENTS.find(e=>e[0]===ev)[1].split(' ')[0];
  const chart=U.bars(['전날 종가','새 기준가','새 상한가','새 하한가'],[close,r.base,lim.upper,lim.lower],{unit:'원',mark:i=>i===1});
  const used={paid:'비율·발행가',bonus:'비율',split:'액면가',dividend:'배당금'}[ev];
  const extra=ev==='dividend'?`<br>현금배당은 거래소가 기준가를 따로 조정하지 않습니다. 배당락일에는 주당 배당금 ${W(div)}을 받을 권리가 빠지지만, 가격이 얼마나 내려갈지는 그날 거래가 정합니다.`:`<br>계산식: ${esc(r.how)} = ${W(r.raw,1)} → 가장 가까운 호가단위로 반올림한 <b>${W(r.base)}</b>(반올림은 이 책의 가정).`;
  U.result(el,chart,`${name}: 새 기준가는 <b>${W(r.base)}</b>입니다. 그날의 가격제한폭도 이 값에서 다시 계산해 상한가 ${W(lim.upper)}, 하한가 ${W(lim.lower)}이 됩니다.${extra}<br>지금 넣은 값: 비율 ${F(ratio,2)} · 발행가 ${W(issue)} · 새 액면 ${W(par)} · 배당 ${W(div)}. 이 사건에는 ${used}만 쓰고 나머지는 계산에 쓰지 않습니다.${U.kind('real','교육용으로 단순화한 기준가 조정식입니다. 실제 공시의 반올림 방식은 조사 노트를 보세요.')}`);
 });
};
})();
