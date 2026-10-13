/* 1~3장 실험: 세 종목 시가총액으로 지수 계산, 가중 방식별 지수 수익률, 설정·환매에 따른 좌수·순자산·NAV.
   계산은 EMath.totalCap·indexLevel·rebase·weights·indexReturn·drift·createRedeem만 쓴다. 세 종목의 주가·주식 수·유동비율과 C사 1,500억 원은 본문의 가상 사례다. */
(()=>{
'use strict';
const U=EUI,M=EMath,F=U.fmt,W=U.won0;
const NAMES=['새벽전자','A사','B사'],PRICES=[20000,50000,10000],SHARES=[1000,200,1000],C_CAP=1500e8;
const eok=n=>`${F(Math.round(n/1e8))}억 원`;
/* 1장: 세 종목 지수. 주가 변화(%)·상장주식수(만 주), B사 → C사 교체, 기준 시가총액 고치기. */
function indexScene(moves,shares,swap,fix){
 const stocks=PRICES.map((p,i)=>({price:p*(1+moves[i]),shares:shares[i]*1e4})),base=M.totalCap(PRICES.map((p,i)=>({price:p,shares:shares[i]*1e4})));
 const before=M.totalCap(stocks),caps=stocks.map(s=>M.marketCap(s));
 if(!swap)return {base,caps,total:before,level:M.indexLevel(before,base),names:NAMES};
 const after=before-caps[2]+C_CAP,fixed=M.rebase(base,before,after);
 return {base,caps:[caps[0],caps[1],C_CAP],total:after,before,fixed,level:M.indexLevel(after,fix?fixed:base),unfixed:M.indexLevel(after,base),kept:M.indexLevel(after,fixed),names:['새벽전자','A사','C사'],swap:true,fix};
}
ELabs['index-level']=el=>{
 U.setup(el,NAMES.map((n,i)=>U.range('im'+i,`${n} 주가 변화 (%)`,-30,30,1,i===0?10:0)).join('')+NAMES.map((n,i)=>U.number('is'+i,`${n} 상장주식수 (만 주)`,1,100000,1,SHARES[i])).join('')+U.check('iswap','B사를 빼고 C사(가상, 시가총액 1,500억 원)를 넣기',false)+U.check('ifix','종목을 바꿀 때 기준 시가총액 고치기',true,'교체를 켰을 때만 씁니다'));
 U.bind(el,()=>{
  const moves=[0,1,2].map(i=>+U.value(el,'im'+i)/100),shares=[0,1,2].map(i=>U.num(el,'is'+i)),swap=U.checked(el,'iswap'),fix=U.checked(el,'ifix');
  const bad=shares.findIndex(v=>v===null);
  if(bad>=0)return U.result(el,'',U.problem(`${NAMES[bad]} 상장주식수`,'1에서 100,000 사이의 숫자(만 주)를 넣어야 합니다.'));
  const s=indexScene(moves,shares,swap,fix);
  const chart=U.columns({labels:[...s.names,'합','기준'],values:[...s.caps,s.total,swap&&fix?s.fixed:s.base].map(v=>v/1e8),mark:i=>i===3,colors:[0,1,2].map(()=> 'var(--blue)').concat(['var(--accent)','var(--orange)']),fmt:v=>F(v),tick:v=>F(v),title:`시가총액 (억 원) · 지수 ${F(s.level,2)}`,h:250,label:`시가총액 ${s.names.map((n,i)=>`${n} ${eok(s.caps[i])}`).join(', ')}, 합 ${eok(s.total)}, 지수 ${F(s.level,2)}`});
  const rows=s.names.map((n,i)=>[n,i===2&&swap?'—':W(PRICES[i]*(1+moves[i])),i===2&&swap?'—':U.man(shares[i]*1e4,'주'),`<b>${eok(s.caps[i])}</b>`]);
  let text=`세 종목의 기준일 시가총액 합 <b>${eok(s.base)}</b>을 지수 100으로 둡니다. 오늘 합은 <b>${eok(swap?s.before:s.total)}</b>이라 지수는 ${eok(swap?s.before:s.total).replace(' 원','')} ÷ ${eok(s.base).replace(' 원','')} × 100 = <b>${F(M.indexLevel(swap?s.before:s.total,s.base),2)}</b>입니다.`;
  if(swap)text+=`<br>이날 B사(${eok(indexScene(moves,shares,false,fix).caps[2])})를 빼고 C사(${eok(C_CAP)})를 넣으면 합이 ${eok(s.total)}이 됩니다. ${fix?`기준 시가총액을 ${eok(s.base)} × ${F(s.total/1e8)} ÷ ${F(s.before/1e8)} = 약 <b>${eok(s.fixed)}</b>으로 고치면 지수는 <b>${F(s.level,2)}</b>${U.josa(F(s.level,2),'으로','로')} 이어집니다. 기준을 고치지 않았다면 <b>${F(s.unfixed,2)}</b>${U.josa(F(s.unfixed,2),'으로','로')} 뛰었을 것입니다.`:`✗ 기준 시가총액을 ${eok(s.base)} 그대로 두어 지수가 <b>${F(s.level,2)}</b>${U.josa(F(s.level,2),'으로','로')} 뜁니다. 주가는 하나도 움직이지 않았는데 지수가 바뀐 것입니다. 기준을 고치면 ${F(s.kept,2)}${U.josa(F(s.kept,2),'으로','로')} 이어집니다.`}`;
  text+=`<br>지수를 많이 움직이는 것은 주가가 높은 종목이 아니라 시가총액이 큰 종목입니다.${U.kind(['real','scenario'],'세 종목과 C사는 가상이고, 실제 지수의 배당 조정·유동비율·정수 처리는 넣지 않았습니다.')}`;
  U.result(el,chart+U.table(['종목','오늘 주가','상장주식수','시가총액'],rows,`세 종목 지수 · 기준 ${eok(s.base)} = 100`),text);
 });
};
/* 2장: 가중 방식 셋(시가총액·유동시가총액·동일)의 비중과 지수 수익률, 하루 뒤 비중. */
const METHODS=[['cap','시가총액 가중'],['float','유동시가총액 가중'],['equal','동일 가중']];
ELabs.weighting=el=>{
 U.setup(el,NAMES.map((n,i)=>U.range('wr'+i,`${n} 하루 수익률 (%)`,-10,10,1,[10,-5,0][i])).join('')+NAMES.map((n,i)=>U.number('wf'+i,`${n} 유동비율 (%, 가정)`,0,100,1,[50,80,100][i])).join('')+U.check('wdrift','하루가 지난 뒤의 비중 보기',false));
 U.bind(el,()=>{
  const r=[0,1,2].map(i=>+U.value(el,'wr'+i)/100),fl=[0,1,2].map(i=>U.num(el,'wf'+i)),drift=U.checked(el,'wdrift'),bad=fl.findIndex(v=>v===null);
  if(bad>=0)return U.result(el,'',U.problem(`${NAMES[bad]} 유동비율`,'0에서 100 사이의 숫자(%)를 넣어야 합니다.'));
  if(fl.every(v=>v===0))return U.result(el,'',U.problem('유동비율','세 종목이 모두 0%면 유동시가총액 합이 0이라 비중을 나눌 수 없습니다.'));
  const S=PRICES.map((p,i)=>({price:p,shares:SHARES[i]*1e4,float:fl[i]/100})),w=METHODS.map(([m])=>M.weights(S,m)),ret=w.map(x=>M.indexReturn(x,r)),next=w.map(x=>M.drift(x,r));
  const chart=U.columns({labels:['시가총액','유동시총','동일'],values:ret.map(x=>x*100),fmt:v=>U.splus(v,2)+'%',tick:v=>U.sfmt(v,1)+'%',title:'같은 하루, 세 지수의 수익률 (%)',h:240,mark:()=>false,label:METHODS.map(([,n],i)=>`${n} ${U.ppct(ret[i])}`).join(', ')});
  const rows=METHODS.map(([,n],k)=>[n,...w[k].map(x=>U.pct(x)),w[k].map((x,i)=>`${F(x,4)} × ${U.splus(r[i]*100,0)}%`).join(' + '),`<b>${U.ppct(ret[k])}</b>`]);
  const drows=METHODS.map(([,n],k)=>[n,...next[k].map(x=>U.pct(x)),k===2?'다시 33.33%씩으로 맞춤(리밸런싱)':'가격을 따라 비중도 움직여 다시 맞출 일 없음']);
  const t2=drift?U.table(['방식',...NAMES,'다음에 할 일'],drows,'하루가 지난 뒤의 비중'):'';
  U.result(el,chart+U.table(['방식',...NAMES,'비중 × 수익률','지수 수익률'],rows,`종목 수익률 ${r.map(x=>U.splus(x*100,0)+'%').join(' · ')}`)+t2,`같은 수익률 목록 (${r.map(x=>U.splus(x*100,0)+'%').join(', ')})에 다른 비중 목록을 곱해 더하면 시가총액 가중 <b>${U.ppct(ret[0])}</b>, 유동시가총액 가중 <b>${U.ppct(ret[1])}</b>, 동일 가중 <b>${U.ppct(ret[2])}</b>입니다(같은 자리끼리 곱해 더하는 계산, 곧 내적).${drift?`<br>하루가 지나면 동일 가중 비중은 ${next[2].map(x=>U.pct(x)).join('·')}로 벌어져, 정해진 때 33.33%씩으로 다시 맞춥니다. 시가총액 가중은 비중이 ${next[0].map(x=>U.pct(x)).join('·')}로 가격을 따라 움직였을 뿐이라 다시 맞출 일이 없습니다.`:''}${U.kind(['real','scenario'],'유동비율은 계산을 위한 가정이고, 실제 코스피200의 유동비율 산정 세부는 넣지 않았습니다.')}`);
 });
};
/* 3장: 설정(+)·환매(−) CU 수, 처음 순자산·좌수, CU 크기(가정), 거래소에서 10주 사기. */
function flowChart(cus,cu,trade){
 const t=(x,y,s,c='axis',a='middle')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`,box=(x,y,w,label)=>`<rect x="${x}" y="${y}" width="${w}" height="44" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+w/2,y+27,label,'series');
 let s=box(12,40,120,'운용사')+box(176,40,120,'AP(증권사)')+box(176,150,120,'투자자 갑')+box(346,150,120,'투자자 을(하린)');
 s+=t(12,22,'발행시장: 설정·환매',"series",'start')+t(176,132,'유통시장: 거래소 매매','series','start');
 const on=cus!==0;s+=`<path d="M136 ${on?56:62}H172" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?3:1.5}" marker-end="url(#ef-ar)"/><path d="M172 70H136" stroke="${on?'var(--orange)':'var(--line)'}" stroke-width="${on?3:1.5}" marker-end="url(#ef-ar)"/>`;
 s+=t(154,106,on?(cus>0?`▲ 설정 ${F(cus)} CU`:`▲ 환매 ${F(-cus)} CU`):'설정·환매 없음','mark-t');
 s+=`<path d="M300 166H342" stroke="${trade?'var(--accent)':'var(--line)'}" stroke-width="${trade?3:1.5}" marker-end="url(#ef-ar)"/>`+t(320,214,trade?'▲ 10주 매매':'매매 없음','mark-t');
 return U.svg(`설정·환매는 운용사와 AP 사이에서 ${on?(cus>0?`${F(cus)} CU 설정`:`${F(-cus)} CU 환매`):'일어나지 않음'}, 거래소 매매는 투자자 사이에서 ${trade?'10주':'없음'}`,`<defs><marker id="ef-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`+s,228);
}
ELabs['creation-unit']=el=>{
 U.setup(el,U.range('ccu','설정(+)·환매(−) CU 수',-5,5,1,3)+U.number('cassets','처음 순자산 (억 원)',1,1000000,1,3000)+U.number('cunits','처음 좌수 (만 좌)',1,100000,1,1000)+U.number('csize','CU 크기 (좌, 이 책의 가정)',1,1000000,1,M.CU)+U.check('ctrade','하린이 거래소에서 다른 투자자에게 10주 사기',false));
 U.bind(el,()=>{
  const cus=+U.value(el,'ccu'),a=U.num(el,'cassets'),u=U.num(el,'cunits'),size=U.num(el,'csize'),trade=U.checked(el,'ctrade');
  if(a===null)return U.result(el,'',U.problem('처음 순자산','1에서 1,000,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  if(u===null)return U.result(el,'',U.problem('처음 좌수','1에서 100,000 사이의 숫자(만 좌)를 넣어야 합니다.'));
  if(size===null||!Number.isInteger(size))return U.result(el,'',U.problem('CU 크기','1에서 1,000,000 사이의 정수(좌)를 넣어야 합니다.'));
  const assets=a*1e8,units=u*1e4;
  if(units+cus*size<=0)return U.result(el,'',U.problem('환매할 CU 수',`환매하려는 ${F(-cus*size)}좌가 남은 좌수 ${F(units)}좌보다 많거나 같습니다.`));
  const r=M.createRedeem(assets,units,cus,size),basket=Math.abs(cus)*size*r.nav;
  const tbl=U.table(['','좌수','순자산','1좌당 NAV'],[['처음',U.man(units),U.eok(assets),W(M.nav(assets,units))],[cus?(cus>0?`▲ ${F(cus)} CU 설정 뒤`:`▲ ${F(-cus)} CU 환매 뒤`):'설정·환매 없음',`<b>${U.man(r.units)}</b>`,`<b>${U.eok(r.assets)}</b>`,`<b>${W(r.nav)}</b>`]],'설정·환매 전후');
  const head=cus?`AP가 CU ${F(Math.abs(cus))}개(${F(Math.abs(cus)*size)}좌)를 ${cus>0?'설정하면':'환매하면'} ${cus>0?`${W(r.nav)} × ${F(Math.abs(cus)*size)}좌 = ${U.eok(basket)}어치 바구니가 들어와`:`${U.eok(basket)}어치 바구니가 나가`} 좌수는 <b>${U.man(r.units)}</b>, 순자산은 <b>${U.eok(r.assets)}</b>이 됩니다. 1좌당 NAV는 <b>${W(r.nav)}</b> 그대로입니다.`:'설정·환매가 없어 좌수와 순자산이 그대로입니다.';
  const tr=trade?'<br>하린이 거래소에서 10주를 사도 상대는 운용사가 아니라 그 좌수를 판 다른 투자자라, 좌수·순자산·NAV는 <b>변화 없음</b>입니다. 좌수의 주인만 바뀝니다.':'';
  U.result(el,flowChart(cus,size,trade)+tbl,`${head}${tr}<br>바구니를 NAV로 값을 매겨 주고받으므로 좌수가 얼마나 늘든 1좌의 몫은 담은 주식의 가격만 따라 움직입니다.${U.kind(['real','unknown'],`CU 크기 ${F(M.CU)}좌는 이 책의 가정이고(실제 크기는 상품마다 다름), 바구니의 현금 몫과 설정·환매 비용은 넣지 않았습니다.`)}`);
 });
};
})();
