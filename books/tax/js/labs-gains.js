/* 4~6장 실험: 양도소득세와 대주주 기준, 금융소득종합과세, ETF와 채권의 과세.
   계산은 TMath.isBigHolder·domesticGainTax·foreignGainTax·extraTax·generalTax·breakEvenGain. 세율은 TMath.RATES에서 읽는다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,W=U.won0,R=M.RATES;
const note=()=>`<span class="rate-note">${U.RATE_NOTE}</span><br>`;
/* 4장: 국내 상장주식(소액주주·대주주)과 해외 상장 자산의 양도세. */
const ASSETS=[['domestic','국내 상장주식 (새벽전자, 코스피)'],['fstock','해외 상장 주식'],['fetf','해외 상장 ETF (먼바다500)'],['kequity','국내주식형 ETF (누리200)']];
function gainsText(a,gain,loss,hold,share){
 if(a==='kequity')return {tax:0,base:0,line:'국내주식형 ETF의 매매차익은 비과세라 양도세가 없습니다(6장).',who:'—'};
 if(a==='domestic'){const big=M.isBigHolder(hold,share/100),b=R.bigHolder,base=Math.max(0,gain-loss),tax=M.domesticGainTax(base,big);
  return {tax,base,big,who:big?'다음 해 5월 본인 신고':'—',line:big?`보유액 ${W(hold)} 또는 지분율 ${F(share,2)}%가 기준(종목당 ${F(b.value/1e8)}억 원, 코스피 ${F(b.shareKospi*100)}%) 이상이라 <b>대주주</b>입니다. 과세표준 3억 원까지 22%, 넘는 몫 27.5%(지방세 포함)로 양도세 <b>${W(tax)}</b>입니다. 대주주의 기본공제와 1년 미만 보유 세율은 확인 못함이라 넣지 않았습니다.`:`보유액 ${W(hold)}, 지분율 ${F(share,2)}%로 기준(종목당 ${F(b.value/1e8)}억 원, 코스피 ${F(b.shareKospi*100)}%)에 못 미쳐 <b>소액주주</b>입니다. 차익이 얼마든 양도세는 <b>0원</b>이고, 팔 때 거래세만 냅니다(2장).`};}
 const t=M.foreignGainTax(gain,loss);
 return {tax:t.tax,base:t.base,who:'다음 해 5월 본인 신고',line:`(차익 ${W(gain)}${loss?` − 같은 해 손실 ${W(loss)}`:''} − 공제 ${W(R.foreign.deduction)}) = 과세표준 ${W(t.base)}, × 22% = 양도세 <b>${W(t.tax)}</b>입니다. 증권사가 떼지 않으므로 다음 해 5월에 본인이 신고해 냅니다.${loss?' 같은 해 다른 해외 자산의 손실을 뺀 것은 보도에서 확인 못한 가정입니다.':''}`};
}
TLabs.gains=el=>{
 U.setup(el,U.select('gasset','자산',ASSETS,'domestic')+U.number('ggain','차익 (원)',0,100000000000,10000,1248640)+U.number('gloss','같은 해 다른 자산의 손실 (원)',0,100000000000,10000,0)+U.number('ghold','종목당 보유액 (원, 국내 상장주식)',0,1000000000000,1000000,11248640,'대주주 판정용')+U.number('gshare','지분율 (%, 국내 상장주식)',0,100,0.001,0.001));
 U.bind(el,()=>{
  const a=U.value(el,'gasset'),gain=U.num(el,'ggain'),loss=U.num(el,'gloss'),hold=U.num(el,'ghold'),share=U.num(el,'gshare');
  if(gain===null)return U.result(el,'',U.problem('차익','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(loss===null)return U.result(el,'',U.problem('손실','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(hold===null)return U.result(el,'',U.problem('보유액','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(share===null)return U.result(el,'',U.problem('지분율','0에서 100 사이의 숫자(%)를 넣어야 합니다.'));
  const t=gainsText(a,gain,loss,hold,share),name=ASSETS.find(x=>x[0]===a)[1];
  const chart=U.columns({labels:['차익','손실','과세표준','양도세'],values:[gain,-loss,t.base,t.tax],mark:i=>i===3,fmt:v=>F(v),tick:v=>F(v/10000)+'만',title:`${name.split(' (')[0]} · 원`,h:240,label:`차익 ${W(gain)}, 손실 ${W(loss)}, 과세표준 ${W(t.base)}, 양도세 ${W(t.tax)}`});
  U.result(el,chart+U.table(['항목','값'],[['자산',name],['차익',W(gain)],['같은 해 손실',W(loss)],['보유액 · 지분율',`${W(hold)} · ${F(share,3)}%`],['양도세',`<b>${W(t.tax)}</b>`],['내는 방법',t.who]],'양도세 계산'),`${note()}<b>${name}</b>: ${t.line}${U.kind(['real','news'],a==='domestic'?'대주주 기준은 2025-09-15 “50억 원 유지” 보도 기준입니다.':'')}`);
 });
};
/* 5장: 한 해 이자·배당 합계와 한계세율(가정). 넘는 몫에만 (한계세율 − 14%) × 1.1. 소득 카드를 합계에 넣어 보며 들어가는 것과 빠지는 것을 가린다. */
const CARDS=[['tcdep','예금 이자',true],['tcdiv','배당·분배금',true],['tcetf','누리 해외100 차익(배당소득)',true],['tcisa','ISA 비과세 한도 안 소득',false],['tcstock','국내 주식 매매차익',false],['tcfor','해외 상장 자산 양도소득',false]];
function thresholdChart(total,over){
 const max=Math.max(total,R.threshold)*1.15,X=v=>40+v/max*420,line=X(R.threshold);
 let s=`<text x="12" y="18" class="series">한 해 이자·배당 합계 · ┅ 2,000만 원 기준</text><rect x="40" y="44" width="${(X(Math.min(total,R.threshold))-40).toFixed(1)}" height="34" fill="var(--blue)"/>`;
 if(over>0)s+=`<rect x="${line.toFixed(1)}" y="44" width="${(X(total)-line).toFixed(1)}" height="34" fill="var(--accent)"/><text x="${Math.min(458,X(total)).toFixed(1)}" y="98" text-anchor="end" class="mark-t">▲ 넘는 몫 ${F(over)}원</text>`;
 s+=`<path d="M${line.toFixed(1)} 34V88" stroke="var(--orange)" stroke-dasharray="5 4" stroke-width="2"/><text x="${line.toFixed(1)}" y="118" text-anchor="middle" class="axis">2,000만 원</text><text x="40" y="118" class="axis">0</text>`;
 return U.svg(`합계 ${W(total)}, 넘는 몫 ${W(over)}`,s,130);
}
TLabs.threshold=el=>{
 U.setup(el,U.number('ttotal','한 해 이자·배당 합계 (원)',0,100000000000,100000,21000000)+U.range('trate','넘는 몫의 한계세율 (가정, %)',6,45,1,24,'종합소득세 구간을 쓰지 않고 하나만 가정합니다')+`<fieldset class="cards"><legend>소득 카드를 합계에 넣어 보기</legend>${CARDS.map(([id,name])=>U.check(id,name,false)).join('')}</fieldset>`);
 U.bind(el,()=>{
  const total=U.num(el,'ttotal'),rate=+U.value(el,'trate')/100;
  if(total===null)return U.result(el,'',U.problem('합계','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  const t=M.extraTax(total,rate),on=CARDS.filter(([id])=>U.checked(el,id));
  const cards=on.length?'<br>넣어 본 카드: '+on.map(([,name,inside])=>inside?`${name} → ✓ 합계에 들어감`:`${name} → ✗ 합계에 들어가지 않음`).join(' · ')+'.':'';
  const head=t.comprehensive?`<b>${W(total)}</b>은 기준 2,000만 원을 넘어, 넘는 몫 <b>${W(t.over)}</b>만 다른 소득과 합쳐집니다. 2,000만 원까지는 원천징수 14%로 끝납니다.`:`<b>${W(total)}</b>은 기준 2,000만 원을 넘지 않아 종합과세가 아니고, 원천징수 말고 더 낼 세금은 <b>0원</b>입니다.${total===R.threshold?' 정확히 2,000만 원도 종합과세가 아닙니다.':''}`;
  const calc=t.comprehensive?`<br>한계세율을 ${F(rate*100)}%로 가정하면 더 낼 세금은 어림으로 ${W(t.over)} × (${F(rate*100)}% − 14%) × 1.1 = <b>${W(t.extra)}</b>입니다.`:'';
  U.result(el,thresholdChart(total,t.over),`${note()}${head}${calc}${cards}${U.kind(['real','news','scenario'],'한계세율은 가정입니다. 배당가산(Gross-up)과 배당세액공제, 비교과세는 뺀 어림식입니다.')}`);
 });
};
/* 6장: 상품별 세금. 누리200·누리 해외100·먼바다500·나라 3년을 같은 차익·분배금으로 견준다. */
const EPRODS=['kequity','kother','foreign','bond'];
TLabs['etf-tax']=el=>{
 U.setup(el,U.select('eprod','상품',EPRODS.map(k=>[k,`${U.pname(k)} (${U.PRODUCTS[k][1]})`]),'kother')+U.number('egain','차익 또는 가격 몫 (원)',0,100000000000,10000,1248640)+U.number('eincome','분배금·이자 (원)',0,100000000000,10000,600000));
 U.bind(el,()=>{
  const k=U.value(el,'eprod'),gain=U.num(el,'egain'),income=U.num(el,'eincome');
  if(gain===null)return U.result(el,'',U.problem('차익','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(income===null)return U.result(el,'',U.problem('분배금·이자','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  const f={principal:0,value:0,gain,income,pretax:gain+income},rows=EPRODS.map(p=>({p,t:M.generalTax(p,f)})),me=rows.find(r=>r.p===k).t,a=M.generalTax('kother',{...f,income:0,pretax:gain}).total,b=M.generalTax('foreign',{...f,income:0,pretax:gain}).total,be=M.breakEvenGain();
  const inSum={kequity:'분배금만',kother:'분배금 + 차익',foreign:'분배금만(차익은 양도소득)',bond:'이자만'};
  const tbl=U.table(['상품','분배·이자 세금','차익 세금','세후 수익','5장 합계에 넣는 것'],rows.map(({p,t})=>[(p===k?'▲ ':'')+U.pname(p),W(t.income),p==='bond'?'0원 (가격 몫 비과세)':W(t.gain),`<b>${W(t.after)}</b>`,inSum[p]]),`세전 ${W(f.pretax)} (차익 ${W(gain)} + 분배금·이자 ${W(income)})`);
  const pts=[];for(let g=0;g<=16000000;g+=500000)pts.push([g/10000,[M.generalTax('kother',{...f,gain:g,income:0}).gain,M.generalTax('foreign',{...f,gain:g,income:0}).gain]]);
  const chart=U.xy({series:[{pts:pts.map(p=>[p[0],p[1][0]/10000]),name:'국내 상장 (15.4%)'},{pts:pts.map(p=>[p[0],p[1][1]/10000]),name:'해외 상장 (250만 원 공제 뒤 22%)'}],dots:[{x:gain/10000,y:a/10000,label:`${F(a)}원`,left:gain>11000000},{x:gain/10000,y:b/10000,shape:'square',color:'var(--text)',label:`${F(b)}원`,left:gain>11000000,dy:16}],vlines:[[be/10000,'같아지는 차익']],xlim:[0,1600],xfmt:v=>F(v)+'만',yfmt:v=>F(v)+'만',xlab:'차익 (원)',h:260,label:`차익 ${W(gain)}의 세금: 국내 상장 ${W(a)}, 해외 상장 ${W(b)}`});
  const cmp=a===b?'두 세금이 같습니다':a>b?`해외 상장 쪽이 <b>${W(a-b)}</b> 적습니다`:`국내 상장 쪽이 <b>${W(b-a)}</b> 적습니다`;
  U.result(el,chart+tbl,`${note()}<b>${U.pname(k)}</b>: 세금 ${W(me.total)}, 세후 수익 <b>${W(me.after)}</b>입니다.<br>같은 차익 ${W(gain)}에서 누리 해외100(국내 상장)은 <b>${W(a)}</b>, 먼바다500(해외 상장)은 <b>${W(b)}</b>으로 ${cmp}. 두 세금이 같아지는 차익은 약 ${W(Math.round(be))}입니다. 누리 해외100의 차익은 5장의 2,000만 원 합계에 들어가고, 먼바다500의 차익은 들어가지 않습니다.${U.kind(['real','news'],'먼바다500의 분배금은 15.4%로 단순화했고 환율 변화는 0으로 두었습니다. 해외 상장 ETF는 ISA·연금계좌에서 살 수 없습니다(보도 기준).')}`);
 });
};
})();
