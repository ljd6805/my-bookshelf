/* 6·7장 실험: 원/달러 환율과 원화 금액, 경상수지 네 수지와 저축 − 투자.
   계산은 MMath.fxAmounts·fxMove·scenario(stage fx)·currentAccount·savingInvestment만 쓴다. 새벽전자·온결식품·가상의 나라는 미리 정한 가상 시나리오다.
   6장 기본 환율은 본문의 1,338.5원 → 1,311.7원이고, 확인 문제의 1,400원은 비교 예제에 넣지 않는다.
   7장 저축 − 투자 칸은 1장 모형 경제(확인 문제의 숫자)가 아닌 다른 가상 경제로 시작한다. 8월 경상수지(보도, 이례적 값)는 확인 칸을 켤 때만 상자로 보인다. */
(()=>{
'use strict';
const U=MUI,M=MMath,A=M.ASSUME,FX=M.MARKET.usdkrw,MD=M.MODEL;
const rate=v=>U.sfmt(v,Number.isInteger(v)?0:Math.min(2,(String(v).split('.')[1]||'').length));
MLabs['fx-won-amount']=el=>{
 U.setup(el,`<p class="rate-banner"><span class="kind-tag model-tag">원/달러 ${U.sfmt(FX.value,1)}원 · ${FX.label} · ${FX.date} · 확인 ${FX.checked}</span><br>원/달러 숫자가 오르면 원화 약세, 내리면 원화 강세입니다. 환율을 쓸 때는 어느 시각의 값인지 함께 적습니다.</p>`
  +U.group('대금 (달러, 가상의 회사)',U.number('xusd','새벽전자가 받는 수출 대금',0,1e10,1000,A.saebyeok.usd)+U.number('musd','온결식품이 내는 수입 대금',0,1e10,1000,A.onkyeol.usd))
  +U.group('원/달러 환율 (1달러당 원)',U.number('xbefore','이전 환율',1,100000,0.01,FX.value)+U.number('xafter','이후 환율',1,100000,0.01,1311.7,'1,338.5 × 0.98 = 1,311.73원을 1,311.7원으로 반올림'))
  +U.range('xrate','모형: 정책 금리 변경 (%p)',MD.ranges.rate[0],MD.ranges.rate[1],0.25,0,'미리 정한 시나리오 모형의 환율 줄. 기본값 0'));
 U.bind(el,()=>{
  const xu=U.num(el,'xusd'),mu=U.num(el,'musd'),b=U.num(el,'xbefore'),a=U.num(el,'xafter'),dr=Number(U.value(el,'xrate'));
  for(const [v,name,w] of [[xu,'수출 대금','0 이상의 달러 금액을 넣어야 합니다.'],[mu,'수입 대금','0 이상의 달러 금액을 넣어야 합니다.'],[b,'이전 환율','1원 이상으로 넣어야 합니다.'],[a,'이후 환율','1원 이상으로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,w));
  const ex=M.fxAmounts(xu,b,a),im=M.fxAmounts(mu,b,a),mv=M.fxMove(b,a),s=M.scenario({rate:{size:dr,start:1,len:4}},{stage:'fx',quarters:8});
  const dir=a>b?'원화 약세(원/달러 상승)':a<b?'원화 강세(원/달러 하락)':'변화 없음';
  const diff=(x,what)=>x.diff===0?'그대로':`${what} ${U.won(Math.abs(x.diff))} ${x.diff>0?'증가':'감소'}`;
  const chart=U.columns({labels:['새벽전자|이전','새벽전자|이후','온결식품|이전','온결식품|이후'],values:[ex.before,ex.after,im.before,im.after].map(v=>v/1e8),mark:k=>k%2===1,fmt:v=>U.sfmt(v,2),tick:v=>U.sfmt(v,1),title:'원화 금액 (억 원) · ▲ 이후 환율',twoLine:true,h:260,label:`새벽전자 ${U.won(ex.before)} → ${U.won(ex.after)}, 온결식품 ${U.won(im.before)} → ${U.won(im.after)}`})
   +U.table(['회사(가상)','달러 금액',`${rate(b)}원일 때`,`${rate(a)}원일 때`,'차이'],[['새벽전자(수출 대금을 받음)',`${U.fmt(xu)}달러`,U.won(ex.before),U.won(ex.after),diff(ex,'매출')],['온결식품(수입 대금을 냄)',`${U.fmt(mu)}달러`,U.won(im.before),U.won(im.after),diff(im,'비용')]],'같은 환율 변화, 두 회사의 원화 금액',true)
   +U.lines({series:[{name:'환율 편차 (%, + = 원화 약세)',values:s.e,color:'var(--muted)',shape:'◆'}],labels:s.e.map((_,t)=>`${t+1}`),tick:v=>U.sfmt(v,2),title:`모형: 정책 금리 ${U.ppt(dr)} · 4분기의 환율 줄`,h:210,legend:false,label:`모형의 환율 편차 ${s.e.map(v=>U.sfmt(M.r3(v),3)).join(', ')}`});
  const model=dr?`모형에서 정책 금리 ${U.ppt(dr)}를 4분기 두면 그 기간 환율 편차는 <b>${U.per(s.e[0])}</b>(${s.e[0]<0?'원화 강세':'원화 약세'} 쪽)입니다. 방향은 교재와 한국은행 글로 확인했고, 금리 1%p당 2%라는 크기는 가정입니다.`:'모형의 정책 금리 손잡이는 0이라 환율 줄이 기준선에 있습니다.';
  U.result(el,chart,`${rate(b)}원 → ${rate(a)}원: ${dir}. 1달러당 원화 <b>${U.spct(mv.perDollar)}</b>, 원화 1원의 달러 가치 <b>${U.spct(mv.wonValue)}</b>(같은 움직임도 어느 쪽을 기준으로 재느냐에 따라 비율이 다릅니다).<br>새벽전자 ${U.fmt(xu)}달러: ${U.won(ex.before)} → <b>${U.won(ex.after)}</b>(${diff(ex,'매출')}${ex.before?`, ${U.spct(ex.change)}`:''}). 온결식품 ${U.fmt(mu)}달러: ${U.won(im.before)} → <b>${U.won(im.after)}</b>(${diff(im,'비용')}${im.before?`, ${U.spct(im.change)}`:''}). 같은 변화가 받는 쪽과 내는 쪽에 반대로 걸립니다.<br>${model}${U.kind(['real','scenario','news','model'],`원화 금액은 만 원 단위로 반올림했습니다. 모형 줄은 ${MD.label}.`)}`);
 });
};
const TR=A.trade;
MLabs['current-account']=el=>{
 U.setup(el,U.group('가상의 나라 한 달 (억 달러)',U.number('tgoods','상품수지 (물건 수출 − 수입)',-100000,100000,0.1,TR.goods)+U.number('tserv','서비스수지 (운송·여행 등)',-100000,100000,0.1,TR.services)+U.number('tprim','본원소득수지 (배당·이자·임금)',-100000,100000,0.1,TR.primary)+U.number('tsec','이전소득수지 (대가 없는 송금)',-100000,100000,0.1,TR.secondary))
  +U.group('저축 − 투자 = 순수출 (다른 가상 경제, 조 원)',U.number('sc','소비 C',0,100000,1,520)+U.number('si','투자 I',-10000,100000,1,210)+U.number('sg','정부 지출 G',0,100000,1,160)+U.number('sx','수출 X',0,100000,1,380)+U.number('sm','수입 M',0,100000,1,350))
  +U.check('treal','8월 실제 경상수지와 2분기 저축률도 견주기',false,'이례적 값이라 계산에 넣지 않고 상자로만 보입니다'),true);
 U.bind(el,()=>{
  const g=U.num(el,'tgoods'),sv=U.num(el,'tserv'),p=U.num(el,'tprim'),se=U.num(el,'tsec'),e=['sc','si','sg','sx','sm'].map(k=>U.num(el,k));
  for(const [v,name] of [[g,'상품수지'],[sv,'서비스수지'],[p,'본원소득수지'],[se,'이전소득수지']])if(v===null)return U.result(el,'',U.problem(name,'숫자(억 달러)를 넣어야 합니다.'));
  const en=['소비','투자','정부 지출','수출','수입'];for(let k=0;k<5;k++)if(e[k]===null)return U.result(el,'',U.problem(en[k],'숫자(조 원)를 넣어야 합니다.'));
  const ca=M.currentAccount({goods:g,services:sv,primary:p,secondary:se}),n=x=>U.sfmt(x,Number.isInteger(x)?0:1),sn=x=>U.splus(x,Number.isInteger(x)?0:1);
  let si;try{si=M.savingInvestment({c:e[0],i:e[1],g:e[2],x:e[3],m:e[4]});}catch(err){return U.result(el,'',U.problem('지출',U.why(err)));}
  const ok=Math.abs(si.gap-si.net)<1e-9,B=M.MARKET.bop,Gd=M.MARKET.gdp;
  const chart=U.columns({labels:['상품','서비스','본원소득','이전소득','경상수지'],values:[g,sv,p,se,ca.ca],mark:k=>k===4,fmt:v=>sn(v),title:'네 수지와 경상수지 (억 달러) · ▲ 경상수지',h:260,label:`상품 ${sn(g)}, 서비스 ${sn(sv)}, 본원소득 ${sn(p)}, 이전소득 ${sn(se)}, 경상수지 ${sn(ca.ca)}억 달러`})
   +U.table(['항목','계산','값(조 원)'],[['GDP Y','C + I + G + (X − M)',n(si.saving+e[0]+e[2])],['국민저축 S','Y − C − G',n(si.saving)],['저축 − 투자','S − I',`<b>${n(si.gap)}</b>`],['순수출','X − M',`<b>${n(si.net)}</b> ${ok?'✓ 같음':'✗ 어긋남'}`]],'저축 − 투자와 순수출',true);
  const box=U.checked(el,'treal')?U.unusual('보도 기준',`2026년 8월 경상수지 ${U.sfmt(B.current.value,1)}억 달러 흑자, 상품수지 ${U.sfmt(B.goods.value,1)}억 달러(${B.released} 발표 잠정치, 독립 보도 세 곳). 보도 값으로 계산하면 상품수지를 뺀 세 수지의 합은 ${U.sfmt(B.current.value,1)} − ${U.sfmt(B.goods.value,1)} = ${U.sfmt(M.nonGoods(B.current.value,B.goods.value),1)}억 달러입니다.`)+U.unusual('공식 원문(재게시)',`2분기 총저축률 ${U.sfmt(Gd.savingRate.value,1)}%, 국내총투자율 ${U.sfmt(Gd.investmentRate.value,1)}%(투자율은 이례적 값이 아님). 저축률이 투자율보다 높은 것은 경상수지 흑자와 같은 방향입니다. 두 비율의 분모가 같은지는 확인하지 못했습니다.`):'';
  U.result(el,chart,`경상수지 = ${n(g)} + (${n(sv)}) + ${n(p)} + (${n(se)}) = <b>${sn(ca.ca)}억 달러</b>(${ca.ca>0?'흑자':ca.ca<0?'적자':'0'}). 상품수지를 뺀 세 수지의 합은 ${sn(ca.nonGoods)}억 달러라 상품수지 ${sn(g)}억 달러와 경상수지가 다릅니다.<br>다른 가상 경제: 저축 S = Y − C − G = ${n(si.saving)}조 원, 투자 ${n(si.investment)}조 원, S − I = <b>${n(si.gap)}조 원</b>, 순수출 X − M = <b>${n(si.net)}조 원</b> ${ok?'✓ 같음':'✗ 어긋남'}. 정의에서 나오는 항등식이라 숫자를 바꿔도 같습니다. 이 책은 흑자와 적자를 좋다·나쁘다로 판정하지 않습니다.${box}${U.kind(['real','scenario','textbook'],'S − I = X − M은 GDP 항등식에서 나오는 정의이고, 해외 소득을 넣어 경상수지로 바꾼 형태는 근사입니다.')}`);
 });
};
})();
