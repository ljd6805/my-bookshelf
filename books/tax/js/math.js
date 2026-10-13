/* 세금과 계좌 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 11권 「세금과 계좌 · 같은 수익, 다른 세후 수익」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(1권 money의 할인 식이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 금액은 원이다. 세금은 항목마다 원 미만을 버린다(조사 노트 values의 기준값과 같은 규칙).
     세후 수익과 공제액은 버린 세금으로 계산한 값이라 따로 반올림하지 않는다.
     3장 원천징수 실험은 소득세 14%와 지방소득세 1.4%를 따로 버리고, 6장부터 상품별 세금은 15.4%를 한 번에 곱해 버린다
     (같은 금액에서 1원 차이가 날 수 있으며 6장 formulaNote에 밝혔다).
   - 세율·비율은 소수다(0.154 = 15.4%). 화면에서 %로 바꾼다.
   - 시간은 해(year) 단위의 정수다. 가격 상승은 해마다 복리, 분배·배당·이자는 원금 기준으로 해마다 같은 금액을 받고
     다시 굴리지 않는다(조사 노트의 기준 사례: 1,000만 원, 3년, 연 4%·2% → 세전 수익 1,848,640원).
   - 세율과 한도는 모두 RATES 한 곳에 두었다. 값은 2026-10-13에 보도·은행·법무법인 안내로 확인한 것이며
     공식 원문(법령·국세청)으로는 확인하지 못했다(조사 노트 머리말). 세법이 바뀌면 RATES만 고친다.
   - 보도로도 확인하지 못한 규칙은 계산에 쓰지 않거나, 쓴다면 assumptions에 이름을 남긴다:
     ISA 안 주식 매도의 거래세(isaStt), 연금계좌의 공제받지 않은 원금 과세(noncreditedTaxFree), 해외 자산끼리 같은 해 손익 합산(foreignNetting),
     연금저축에서 국내 개별주식 매수(pensionStock). 이 넷은 화면에 "확인 못함"으로 표시한다.
   - 실제 계산(세액·공제·현재가치)과 가정(가격 상승률, 한계세율, 연금 수령 때 세율이 그대로라는 가정)을 구분한다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';
const RATES={
 stt:{kospi:0.0005,kospiRural:0.0015,kosdaq:0.002,konex:0.001,etf:0},       // 증권거래세(2026-01-01 양도분부터, 조사 노트 1-1·1-2)
 withhold:{income:0.14,local:0.014},                                        // 이자·배당 원천징수 14% + 지방소득세 1.4%(2-1)
 highDividend:[[20000000,0.14],[300000000,0.20],[5000000000,0.25],[Infinity,0.30]], // 고배당 기업 배당 분리과세 구간(지방소득세 별도, 2-2)
 bigHolder:{value:5000000000,shareKospi:0.01,shareKosdaq:0.02,cut:300000000,low:0.22,high:0.275}, // 대주주 기준과 세율(지방세 포함, 3-1·3-2)
 foreign:{deduction:2500000,rate:0.22},                                     // 해외 상장 자산 양도세(3-3)
 threshold:20000000,                                                        // 금융소득종합과세 기준 금액(4-1)
 isa:{general:2000000,low:4000000,rate:0.099,years:3},                      // ISA 비과세 한도·초과분 세율·의무 기간(6-2·6-3)
 pension:{limitSaving:6000000,limitTotal:9000000,creditLow:0.165,creditHigh:0.132,salaryLine:55000000,annuity:0.055,early:0.165}, // 연금(7-1~7-3)
 transfer:{share:0.10,cap:3000000}                                          // ISA 만기 자금 연금 이전 추가 공제(6-4, 안내 상자에만)
};
const BASE={principal:10000000,years:3,growth:0.04,payout:0.02};
function need(cond,msg){if(!cond)throw new RangeError(msg);}
function money(x,name){need(typeof x==='number'&&Number.isFinite(x)&&x>=0,name+' must be a finite amount ≥ 0');}
const floor=x=>Math.floor(x+1e-7);
const withholdRate=()=>RATES.withhold.income+RATES.withhold.local;

/* ── 1·6장 세전 흐름 ── 가격은 해마다 복리, 받은 돈은 원금 기준 단리(다시 굴리지 않음). */
function flows(principal,years,growth,payout){
 money(principal,'principal');need(Number.isInteger(years)&&years>=0,'years must be a whole number ≥ 0');need(growth>-1,'growth must be above −100%');need(payout>=0,'payout must be ≥ 0');
 const value=principal*Math.pow(1+growth,years),gain=value-principal,income=principal*payout*years;
 return {principal,years,value,gain,income,pretax:gain+income};
}
/* 원 단위로 맞춘 흐름. 기준 사례의 3년 평가액 11,248,640원처럼 원 미만을 반올림해 표와 같은 숫자를 쓴다. */
function roundFlows(f){const value=Math.round(f.value),income=Math.round(f.income),gain=value-f.principal;return {...f,value,gain,income,pretax:gain+income};}

/* ── 2장 증권거래세 ── 시장별 세율 × 매도 금액, 1년 매도 횟수만큼. 손익과 상관없이 붙는다. */
function stt(market,amount,times=1){
 money(amount,'amount');need(Number.isInteger(times)&&times>=0,'times must be a whole number ≥ 0');
 const r=RATES.stt;need(['kospi','kosdaq','konex','etf'].includes(market),'unknown market '+market);
 const rate=market==='kospi'?r.kospi+r.kospiRural:r[market],each=floor(amount*rate),tax=market==='kospi'?floor(amount*r.kospi):each;
 /* 합계를 한 번에 버리고 농어촌특별세는 합계 − 거래세로 둔다(11,248,640원 → 22,497원, 조사 노트 V-1). */
 return {tax,rural:each-tax,each,total:each*times,rate};
}

/* ── 3장 이자·배당 원천징수와 고배당 분리과세 ── */
function withholding(amount){money(amount,'amount');const income=floor(amount*RATES.withhold.income),local=floor(amount*RATES.withhold.local);return {income,local,tax:income+local,net:amount-income-local};}
/* 고배당 기업 배당 분리과세: 구간별 누진(소득세만, 지방소득세 별도). */
function highDividendTax(amount){
 money(amount,'amount');let left=amount,lo=0,tax=0;const parts=[];
 for(const [hi,rate] of RATES.highDividend){const take=Math.max(0,Math.min(left,hi-lo));if(take>0){parts.push({from:lo,to:lo+take,rate,tax:take*rate});tax+=take*rate;}left-=take;lo=hi;if(left<=0)break;}
 return {tax:floor(tax),parts};
}

/* ── 4장 양도소득세 ── 국내 소액주주는 0, 대주주는 과세표준 3억 원까지 22%·넘는 몫 27.5%(기본공제는 확인 못해 넣지 않음),
   해외 상장 자산은 (차익 − 같은 해 손실 − 250만 원) × 22%. 같은 해 손익 합산은 확인 못한 가정이다. */
function isBigHolder(holding,share,market='kospi'){const b=RATES.bigHolder;return holding>=b.value||share>=(market==='kosdaq'?b.shareKosdaq:b.shareKospi);}
function domesticGainTax(gain,big){money(gain,'gain');if(!big)return 0;const b=RATES.bigHolder;return floor(Math.min(gain,b.cut)*b.low+Math.max(0,gain-b.cut)*b.high);}
function foreignGainTax(gain,loss=0){money(gain,'gain');money(loss,'loss');const base=Math.max(0,gain-loss-RATES.foreign.deduction);return {base,tax:floor(base*RATES.foreign.rate)};}

/* ── 5장 금융소득종합과세 ── 기준 금액을 넘는 몫에만 (한계세율 − 14%) × 1.1을 더 낸다.
   배당가산(Gross-up)과 배당세액공제, 비교과세를 뺀 어림이다. 정확히 2,000만 원이면 0. */
function extraTax(total,marginal){
 money(total,'total');need(marginal>=0&&marginal<=0.45,'marginal rate must be between 0 and 45%');
 const over=Math.max(0,total-RATES.threshold);return {over,extra:floor(over*Math.max(0,marginal-RATES.withhold.income)*1.1),comprehensive:total>RATES.threshold};
}

/* ── 6장 상품별 일반계좌 세금 ── kind: stock(새벽전자, 소액주주·코스피), kequity(국내주식형 ETF), kother(그 밖의 국내 상장 ETF),
   foreign(해외 상장 ETF, 분배금은 15.4%로 단순화), bond(채권: 이자 과세, 가격 몫은 개인에게 비과세). */
const KINDS=['stock','kequity','kother','foreign','bond'];
function generalTax(kind,f){
 need(KINDS.includes(kind),'unknown product kind '+kind);const r=withholdRate(),g=Math.max(0,f.gain);
 const out={stt:0,income:floor(f.income*r),gain:0};
 if(kind==='stock')out.stt=floor(f.value*(RATES.stt.kospi+RATES.stt.kospiRural));
 if(kind==='kother')out.gain=floor(g*r);
 if(kind==='foreign')out.gain=foreignGainTax(g).tax;
 out.total=out.stt+out.income+out.gain;out.after=f.pretax-out.total;return out;
}
/* 두 ETF의 차익 세금이 같아지는 차익: 0.22 × 250만 ÷ (0.22 − 0.154). */
const breakEvenGain=()=>RATES.foreign.rate*RATES.foreign.deduction/(RATES.foreign.rate-withholdRate());

/* ── 7장 ISA ── ISA 안의 과세 대상 순이익에서 비과세 한도를 빼고 9.9%. 국내 주식·국내주식형 ETF의 차익은 원래 비과세라 넣지 않는다.
   해외 상장 ETF는 ISA에서 살 수 없다(보도 기준). 새벽전자를 팔 때 거래세는 확인 못해 withStt로 두 값을 함께 낸다. */
function isaTaxable(kind,f){need(kind!=='foreign','foreign-listed ETFs cannot be held in ISA');return kind==='kother'?f.gain+f.income:f.income;}
function isaTax(kind,f,type='general',withStt=false){
 const limit=type==='low'?RATES.isa.low:RATES.isa.general,net=isaTaxable(kind,f),tax=floor(Math.max(0,net-limit)*RATES.isa.rate);
 const sttTax=kind==='stock'&&withStt?floor(f.value*(RATES.stt.kospi+RATES.stt.kospiRural)):0;
 return {net,limit,tax,stt:sttTax,after:f.pretax-tax-sttTax};
}

/* ── 8장 연금저축·IRP ── 공제 = min(납입, 한도) × 공제율. 꺼낼 때는 공제받은 원금과 모든 수익에 세금,
   공제받지 않은 원금은 세금 없이 나온다고 놓는다(확인 못함). 손실로 계좌 잔고가 공제받은 원금보다 작으면 남은 잔고까지만 세금을 매긴다.
   account: saving(연금저축 600만), irp(900만), both(합산 900만). */
function creditRate(band){return band==='over'?RATES.pension.creditHigh:RATES.pension.creditLow;}
function pensionCredit(amount,account='saving',band='under'){money(amount,'amount');const p=RATES.pension,limit=account==='saving'?p.limitSaving:p.limitTotal,base=Math.min(amount,limit);return {base,limit,rate:creditRate(band),credit:floor(base*creditRate(band))};}
function pensionOutcome(f,account='saving',band='under',mode='annuity'){
 const c=pensionCredit(f.principal,account,band),rate=mode==='early'?RATES.pension.early:RATES.pension.annuity,balance=Math.max(0,f.principal+f.pretax);
 const taxed=Math.min(c.base+Math.max(0,f.pretax),balance),tax=floor(taxed*rate);
 return {...c,mode,rateOut:rate,balance,capped:taxed<c.base,taxed,tax,principalTax:floor(Math.min(c.base,balance)*rate),after:f.pretax-tax+c.credit};
}
/* 늦게 내는 세금의 오늘 가치. 할인율 r, n년 뒤. 원 미만은 버린다. */
function presentValue(amount,r,n){money(amount,'amount');need(r>-1,'rate must be above −100%');need(n>=0,'years must be ≥ 0');return floor(amount/Math.pow(1+r,n));}

/* ── 9장 세후 수익 계산기 ── 한 상품을 일반·ISA·연금(연금 수령·중도 인출)에 놓은 네 칸. 살 수 없는 칸이나 확인 못한 칸은 null과 이유. */
function afterTaxTable(o){
 const f=roundFlows(flows(o.principal,o.years,o.growth,o.payout)),gen=generalTax(o.kind,f),cells={general:{after:gen.after,tax:gen.total,detail:gen}};
 cells.isa=o.kind==='foreign'?{blocked:'foreign'}:(()=>{const t=isaTax(o.kind,f,o.isaType||'general',false);return {after:t.after,tax:t.tax,detail:t,sttUnknown:o.kind==='stock'?isaTax(o.kind,f,o.isaType||'general',true).after:null};})();
 for(const mode of ['annuity','early'])cells[mode]=o.kind==='foreign'?{blocked:'foreign'}:o.kind==='stock'?{blocked:'unknown'}:(()=>{const t=pensionOutcome(f,'saving',o.band||'under',mode);return {after:t.after,tax:t.tax,detail:t};})();
 return {flows:f,cells};
}

/* ── 10장 마지막 과제 ── 배분안 X(연금저축 600만 + ISA 400만), Y(ISA 1,000만), Z(일반 400만 + 연금저축 600만).
   상품은 누리 해외100(kother), 분배 연 2%, 3년. 3년 뒤 꺼낼 금액이 연금 아닌 몫보다 크면 연금 몫 전체를 중도 인출한다고 놓는다(나눠 꺼내기는 다루지 않음). */
const PLANS={X:{pension:6000000,isa:4000000,general:0},Y:{pension:0,isa:10000000,general:0},Z:{pension:6000000,isa:0,general:4000000}};
function planOutcome(key,o={}){
 const plan=PLANS[key];need(!!plan,'unknown plan '+key);const growth=o.growth??BASE.growth,payout=o.payout??BASE.payout,years=o.years??BASE.years,band=o.band||'under',need3=o.need??4000000;
 const part=p=>roundFlows(flows(p,years,growth,payout)),rest=plan.isa+plan.general,early=plan.pension>0&&need3>rest,out={key,early,parts:{}};
 if(plan.isa){const f=part(plan.isa),t=isaTax('kother',f);out.parts.isa={pretax:f.pretax,tax:t.tax,after:t.after};}
 if(plan.general){const f=part(plan.general),t=generalTax('kother',f);out.parts.general={pretax:f.pretax,tax:t.total,after:t.after};}
 if(plan.pension){const f=part(plan.pension),t=pensionOutcome(f,'saving',band,early?'early':'annuity');out.parts.pension={pretax:f.pretax,tax:t.tax,credit:t.credit,after:t.after};}
 out.after=Object.values(out.parts).reduce((s,p)=>s+p.after,0);out.pretax=Object.values(out.parts).reduce((s,p)=>s+p.pretax,0);return out;
}

const assumptions={isaStt:'ISA 안에서 주식을 팔 때 거래세(확인 못함)',noncreditedTaxFree:'공제받지 않은 연금 원금은 세금 없이 나온다(확인 못함)',foreignNetting:'같은 해 해외 자산끼리 손익을 합친다(확인 못함)',pensionStock:'연금저축에서 국내 개별주식을 살 수 있는지(확인 못함)'};
const api={CHECKED,RATES,BASE,KINDS,PLANS,assumptions,floor,withholdRate,flows,roundFlows,stt,withholding,highDividendTax,isBigHolder,domesticGainTax,foreignGainTax,extraTax,
 generalTax,breakEvenGain,isaTaxable,isaTax,creditRate,pensionCredit,pensionOutcome,presentValue,afterTaxTable,planOutcome};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.TMath=api;
})(typeof window!=='undefined'?window:globalThis);
