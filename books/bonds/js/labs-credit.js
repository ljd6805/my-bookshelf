/* 7~9장 실험: 신용 스프레드, 고든 모형, 채권을 갖는 길. 계산은 BMath.spreadPrice·impliedDefault·gordonValue·gordonChange·holdingReturn. */
(()=>{
'use strict';
const U=BUI,M=BMath,F=U.fmt,P=U.pct,PP=U.ppct,R=U.rate;
const N3=U.bond('nara3'),SB=U.bond('saebyeok'),S2=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:3});
/* 7장: 회사채 = 국채 + 스프레드. 기준(국고 3.961%, 스프레드 1.10%p)과 견준 변화, 기대 손실 어림, N개 묶음. */
const REF={gov:0.03961,spr:0.011};
function spreadChart(g,s,p,N){
 const hi=Math.max(0.07,g+s+0.005),X=v=>150+v/hi*300;
 const bar=(y,name,parts)=>{let x=150,out=`<text x="140" y="${y+15}" text-anchor="end" class="axis">${name}</text>`;parts.forEach(([v,c,t])=>{out+=`<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0,X(v)-150).toFixed(1)}" height="22" fill="${c}"/>`;if(t)out+=`<text x="${(x+4).toFixed(1)}" y="${y+15}" class="axis">${t}</text>`;x+=X(v)-150;});return out;};
 let s1=`<text x="10" y="16" class="series">금리의 구성 (%)</text>`+bar(30,'나라 3년',[[g,'var(--blue)',`국고 ${F(g*100,3)}`]])+bar(62,'새벽전자 3년',[[g,'var(--blue)',`국고 ${F(g*100,3)}`],[s,'var(--accent)','']])+`<text x="${Math.min(470,X(g+s)+4).toFixed(1)}" y="${62+15}" class="mark-t"${X(g+s)>380?' text-anchor="end"':''}>+${F(s*100,2)}%p</text>`;
 const pts=[];const top=Math.max(200,N);for(let n=1;n<=top;n+=Math.max(1,Math.round(top/80)))pts.push([n,(1-Math.pow(1-p,n))*100]);
 return U.svg('나라 3년과 새벽전자 3년의 금리 구성',s1,100)+U.xy({series:[{pts,name:'하나라도 부도날 확률 (%)'}],dots:[{x:N,y:(1-Math.pow(1-p,N))*100,label:`${F(N)}개 → ${F((1-Math.pow(1-p,N))*100,0)}%`,left:N>top*.6}],xlim:[1,top],ylim:[0,100],xfmt:v=>F(v),yfmt:v=>`${F(v,0)}%`,xlab:'묶은 회사채 수 N',h:230,label:`부도가 서로 독립일 때 N개 가운데 하나라도 부도날 확률. N = ${N}에서 ${F((1-Math.pow(1-p,N))*100,0)}%`});
}
BLabs.spread=el=>{
 U.setup(el,U.number('sgov','국고 3년 금리 (%)',0,10,0.001,3.961,'2026-10-07 장 마감 3.961%')+U.number('sspr','새벽전자 신용 스프레드 (%p)',0,5,0.001,1.1,'“A 가정” 1.10%p · 실제 AA− 차이 0.683%p')+U.range('srec','부도 때 회수율 R (%)',0,80,5,40,'가정')+U.number('sn','묶어 든 회사채 수 N',1,1000,1,100,'부도가 서로 독립이라고 봄')+'<div class="buttons" aria-label="충격 버튼"><button type="button" data-shock="sgov">국채 금리 +0.5%p</button><button type="button" data-shock="sspr">스프레드 +0.5%p</button></div>');
 el.querySelectorAll('[data-shock]').forEach(b=>b.onclick=()=>{const x=el.querySelector('#'+b.dataset.shock),v=Number(x.value);if(Number.isFinite(v)){x.value=String(Number((v+0.5).toFixed(3)));x.dispatchEvent(new Event('input',{bubbles:true}));}});
 U.bind(el,()=>{
  const gp=U.num(el,'sgov'),sp=U.num(el,'sspr'),rec=+U.value(el,'srec')/100,N=U.num(el,'sn');
  if(gp===null)return U.result(el,'',U.problem('국고 3년 금리','0에서 10 사이의 숫자(%)를 넣어야 합니다.'));
  if(sp===null)return U.result(el,'',U.problem('스프레드','0에서 5 사이의 숫자(%p)를 넣어야 합니다.'));
  if(N===null||!Number.isInteger(N))return U.result(el,'',U.problem('회사채 수','1에서 1,000 사이의 정수를 넣어야 합니다.'));
  const g=gp/100,s=sp/100,Ps=M.spreadPrice(SB,g,s),Pn=M.priceFromYield(N3,g),p=M.impliedDefault(s,rec),one=1-Math.pow(1-p,N);
  const refS=M.spreadPrice(SB,REF.gov,REF.spr),refN=M.priceFromYield(N3,REF.gov),realG=Math.abs(g-REF.gov)<1e-9;
  const tbl=U.table(['채권','금리','값','기준과 견준 변화'],[['나라 3년',R(g),`<b>${F(Pn,2)}원</b>`,PP(Pn/refN-1)],['새벽전자 3년',`${R(g)} + ${S2(s*100)}%p = ${R(g+s)}`,`<b>${F(Ps,2)}원</b>`,PP(Ps/refS-1)]],'기준: 국고 3.961%, 스프레드 1.10%p (나라 3년 9,975.90원, 새벽전자 9,983.22원)');
  U.result(el,spreadChart(g,s,p,N)+tbl,`새벽전자 3년 회사채 금리 = 국고 ${R(g)} + 스프레드 ${S2(s*100)}%p = <b>${R(g+s)}</b> → 값 <b>${F(Ps,2)}원</b>, ${U.status(Ps)}. 같은 국고 금리의 나라 3년은 <b>${F(Pn,2)}원</b>입니다.<br>기준(국고 3.961%, 스프레드 1.10%p)과 견주면 새벽전자 <b>${PP(Ps/refS-1)}</b>, 나라 3년 <b>${PP(Pn/refN-1)}</b>. 국채 금리가 움직이면 둘 다, 스프레드만 움직이면 새벽전자만 값이 바뀝니다.<br>스프레드가 모두 기대 손실이라고 보면 한 해 부도 확률 p ≈ ${S2(s*100)}%p ÷ (1 − ${F(rec*100,0)}%) = <b>${P(p)}</b>, 기대 손실 p × (1 − R) = ${P(p*(1-rec))}. 이런 회사채 ${F(N)}개를 들고 부도가 서로 독립이라면 한 해에 하나라도 부도날 확률은 약 <b>${P(one,0)}</b>입니다. 실제 스프레드에는 유동성과 위험 회피의 몫이 들어 있어 이 p를 부도 확률의 추정으로 읽으면 안 됩니다.${U.kind(realG?['real','realfic','scenario']:['real','scenario'],'새벽전자의 “A 가정”, 스프레드 1.10%p, 회수율 40%는 가정입니다. AA− 회사채와 국고채의 차이 0.683%p는 2026-10-07 보도 수치입니다.')}`);
 });
};
/* 8장: 고든 성장 모형. g ≥ r이면 값을 내지 않고 오류를 보인다. */
BLabs.gordon=el=>{
 U.setup(el,U.number('gd1','1년 뒤 배당 D₁ (포인트)',0.01,100000,0.01,2,'누리200의 가정 값 2')+U.range('gr','할인율 r (%)',4,12,.25,8)+U.range('gg','배당 성장률 g (%)',-2,12,.25,3,'r보다 작아야 합니다')+U.check('gmove','할인율이 움직일 때 성장률도 함께 움직임',false)+U.range('gk','함께 움직이는 비율 k',0,1,.25,.5,'k = 0.5면 할인율 −1%p에 성장률 −0.5%p'));
 U.bind(el,()=>{
  const d1=U.num(el,'gd1'),r=+U.value(el,'gr')/100,g=+U.value(el,'gg')/100,mv=U.checked(el,'gmove'),k=+U.value(el,'gk');
  el.querySelector('#gk').disabled=!mv;
  if(d1===null)return U.result(el,'',U.problem('배당 D₁','0보다 큰 숫자를 넣어야 합니다.'));
  if(!(g<r))return U.result(el,'',U.problem('성장률 g',`g(${F(g*100,2)}%)가 할인율 r(${F(r*100,2)}%)보다 작아야 합니다. g ≥ r이면 분모 r − g가 0 이하가 되어 값이 무한대나 음수가 되고, 모형이 뜻을 잃습니다.`));
  const V=M.gordonValue(d1,r,g),S=M.gordonDuration(r,g),dg=mv?k*0.01:0,cut=g-dg<r-0.01?M.gordonChange(d1,r,g,-0.01,-dg):null,up=M.gordonChange(d1,r,g,0.01,dg),dm10=M.modifiedDuration(U.bond('nara10'),0.04376);
  const pts=[];for(let x=Math.max(4,g*100+0.6);x<=12.0001;x+=0.1)pts.push([x,M.gordonValue(d1,x/100,g)]);
  const chart=U.xy({series:[{pts,name:`값 = ${F(d1,2)} ÷ (r − ${F(g*100,2)}%)`}],dots:[{x:r*100,y:V,label:`r ${F(r*100,2)}% → ${F(V,2)}`,left:r>0.09}],xlim:[4,12],xfmt:v=>`${F(v,0)}%`,xlab:'할인율 r',ylim:[0,Math.min(Math.max(...pts.map(p=>p[1])),V*3)*1.08],h:250,label:`고든 값과 할인율. r ${F(r*100,2)}%에서 ${F(V,2)}`})
   +U.columns({labels:['누리200 1/(r−g)','나라 10년 D_mod','나라 3년 D_mod'],values:[S,dm10,M.modifiedDuration(U.bond('nara3'),0.03961)],fmt:v=>F(v,v>=100?0:2),tick:v=>F(v,0),mark:i=>i===0,title:'할인율 1%p에 대략 몇 % 움직이나',h:210,label:`할인율 민감도: 누리200 ${F(S,1)}, 나라 10년 ${F(dm10,2)}`});
  const cutT=cut?`할인율을 1%p 내리면${mv?` (성장률도 ${F(dg*100,2)}%p 함께)`:''} <b>${F(cut.price1,2)}</b>, <b>${PP(cut.change,1)}</b>`:`할인율을 1%p 내리면${mv?' 성장률을 함께 내려도':''} g ≥ r이 되어 값을 낼 수 없습니다(✗)`;
  U.result(el,chart,`누리200의 값 = ${F(d1,2)} ÷ (${F(r*100,2)}% − ${F(g*100,2)}%) = <b>${F(V,2)}</b>.<br>할인율 민감도 1 ÷ (r − g) = <b>${F(S,1)}</b>${U.josa(F(S,1),'으로','로')}, 나라 10년의 수정 듀레이션 ${F(dm10,2)}의 ${F(S/dm10,1)}배입니다.<br>${cutT}. 1%p 올리면 ${F(up.price1,2)}, ${PP(up.change,1)}입니다.${S>40?' r − g가 작아 값이 할인율과 성장률 가정에 매우 민감합니다.':''}${U.kind(['real','scenario'],'누리200(가상)의 배당 2포인트, 할인율 8%, 성장률 3%는 가정이고, 영원히 일정한 성장은 현실과 맞지 않을 수 있습니다.')}`);
 });
};
/* 9장: 만기까지 들기와 중간에 팔기. 사는 곳의 차이는 숫자 없이 글로만 적는다. */
const TABS=[['otc','장외 (증권사 창구)','증권사가 가진 채권을 그 증권사가 정한 값에 삽니다. 국채 거래는 장외가 많습니다. 일부 회사는 만기 전 매도를 받지 않거나 받더라도 불리한 값일 수 있으니 투자 기간과 잔존만기를 맞추라는 안내가 있습니다(금융감독원 제공 글).'],['krx','장내 (한국거래소)','다른 투자자의 호가에 맞춰 삽니다. 2016년 기사에 따르면 실시간 호가가 보이고 당일 결제되지만, 거래가 적은 종목은 원하는 때 체결되지 않을 수 있습니다. 지금의 거래 단위·호가 단위는 이 책에서 확인하지 못했습니다.'],['retail','개인투자용 국채','정부가 개인에게만 파는 국채입니다. 최소 10만 원부터 사고, 시장에서 팔 수 없습니다. 발행 13개월째부터 정부에 중도환매할 수 있지만 그때는 가산금리·복리·분리과세 혜택이 빠집니다(확인 2026-10-12).']];
BLabs.routes=el=>{
 U.setup(el,U.select('rhold','갖는 방법',[['maturity','만기까지 들기'],['sell1','1년 뒤 팔기 (남은 만기 2년)'],['sell2','2년 뒤 팔기 (남은 만기 1년)']],'maturity')+U.range('rdy','팔 때의 금리 변화 (%p)',-2,2,.25,0,'산 날 금리 3.961%에서')+`<div class="tabs" role="tablist" aria-label="어디서 사나요">${TABS.map(([id,name],i)=>`<button type="button" role="tab" id="tab-${id}" aria-selected="${i===0}" aria-controls="tabp-routes" data-tab="${i}">${name}</button>`).join('')}</div><div class="tab-panel" id="tabp-routes" role="tabpanel" aria-labelledby="tab-otc"></div>`);
 const tabs=[...el.querySelectorAll('[data-tab]')],panel=el.querySelector('#tabp-routes'),show=i=>{tabs.forEach((t,j)=>{t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;});panel.setAttribute('aria-labelledby','tab-'+TABS[i][0]);panel.innerHTML=`<p><b>${TABS[i][1]}</b> · ${TABS[i][2]}</p><p class="caption">구조의 차이만 글로 적었습니다. 가격·수수료·가산 금액은 넣지 않았습니다.</p>`;};
 tabs.forEach((t,i)=>{t.onclick=()=>show(i);t.onkeydown=e=>{if(/^Arrow(Right|Left)$/.test(e.key)){const n=(i+(e.key==='ArrowRight'?1:2))%3;show(n);tabs[n].focus();e.preventDefault();}};});show(0);
 U.bind(el,()=>{
  const how=U.value(el,'rhold'),dy=+U.value(el,'rdy')/100,y0=0.03961,buy=M.priceFromYield(N3,y0),total=M.cashFlows(N3).reduce((s,x)=>s+x.cf,0);
  const h=k=>M.holdingReturn(N3,y0,y0+dy,k),h0=k=>M.holdingReturn(N3,y0,y0,k),hit=k=>h(k).price1/h0(k).price1-1;
  const pts=k=>Array.from({length:17},(_,i)=>{const d=-0.02+i*0.0025;return [d*100,M.holdingReturn(N3,y0,y0+d,k).price1];});
  const chart=U.xy({series:[{pts:pts(1),name:'1년 뒤 판 값'},{pts:pts(2),name:'2년 뒤 판 값'}],dots:[{x:dy*100,y:h(1).price1,label:`${F(h(1).price1,2)}원`,left:dy>0},{x:dy*100,y:h(2).price1,shape:'square',color:'var(--text)',label:`${F(h(2).price1,2)}원`,left:dy>0,dy:16}],hlines:[[buy,`산 값 ${F(buy,2)}원`],[10000,'액면 10,000원']],xlim:[-2,2],xfmt:v=>`${U.splus(v,0)}%p`,xlab:'팔 때의 금리 변화',h:260,label:`팔 때의 금리 변화와 판 값. 1년 뒤 ${F(h(1).price1,2)}원, 2년 뒤 ${F(h(2).price1,2)}원`});
  const row=k=>[k===1?'1년 뒤 팔기':'2년 뒤 팔기',`${F(h(k).price1,2)}원`,`${F(h(k).coupons,2)}원`,`<b>${PP(h(k).totalReturn)}</b>`];
  const tbl=U.table(['방법','판 값 / 받는 돈','받은 이표','수익 (산 값 대비)'],[['만기까지 들기',`${F(total,2)}원 (3년 동안)`,'1,162.50원 포함',`${PP(total/buy-1)} (3년 합)`],row(1),row(2)],`나라 3년을 ${F(buy,2)}원에 사서 · 금리 변화 ${U.pp(dy)}`);
  const cmp=dy?`<br>같은 ${U.pp(dy)}라도 판 값은 금리가 그대로일 때보다 남은 만기 2년(1년 뒤)에 팔면 <b>${PP(hit(1))}</b>, 남은 만기 1년(2년 뒤)에 팔면 <b>${PP(hit(2))}</b> 달라집니다. 남은 만기가 짧을수록 덜 흔들립니다.`:'';
  const main=how==='maturity'?`<b>만기까지 들기</b>: 나라 3년을 <b>${F(buy,2)}원</b>에 사서 3년 동안 <b>${F(total,2)}원</b>을 날짜대로 받습니다. 그사이 금리가 어떻게 움직여도 이 숫자는 바뀌지 않습니다(발행자가 약속대로 갚는다면). 비교로, 1년 뒤 금리가 ${dy?U.pp(dy)+' 움직였을':'그대로일'} 때 팔았다면 ${F(h(1).price1,2)}원에 이표 ${F(h(1).coupons,2)}원을 더해 1년 수익 ${PP(h(1).totalReturn)}였습니다.`
   :(k=>`<b>${k}년 뒤 팔기</b>: 남은 만기 ${3-k}년의 나라 3년을 그날 금리 ${R(y0+dy)}로 팔아 <b>${F(h(k).price1,2)}원</b>, 그동안 받은 이표 ${F(h(k).coupons,2)}원을 더하면 산 값 대비 <b>${PP(h(k).totalReturn)}</b>입니다(가격만 ${PP(h(k).priceReturn)}).`)(how==='sell1'?1:2);
  U.result(el,chart+tbl,`${main}${cmp}${U.kind(['real','realfic','scenario'],'산 날 금리는 2026-10-07 국고 3년 3.961%를 가상 채권에 넣은 값이고, 팔 때의 금리는 비교를 위한 가정입니다. 받은 이표는 다시 굴리지 않았고 세금·거래 비용은 넣지 않았습니다.')}`);
 });
};
})();
