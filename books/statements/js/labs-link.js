/* 5장 대표 실험: 매출·매출채권·재고자산·설비투자를 바꾸면 손익계산서·간접법 현금흐름표·기말 재무상태표가 함께 바뀌는 세 재무제표 연동 실험.
   계산은 SMath.linkedYear 하나다. 대조 네 줄(checks)은 어떤 입력에서도 맞아야 하며(tests/math.test.cjs), 화면은 ✓/✗ 글자와 "맞음·어긋남"으로 적는다.
   기말 현금이 50억 원보다 적으면 50억 원 단위로 연말에 단기차입하는 규칙과 감가상각 = 기초 유형자산 × 10%는 이 책의 단순화다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1;
const BASES={'2023':()=>({open:M.OPENING,input:{...M.YEARS[2024],dividend:M.ASSUME.dividend},year:2024}),'2024':()=>({open:M.saebyeok().y2024.close,input:{...M.YEARS[2025],dividend:M.ASSUME.dividend},year:2025})};
const IDS={lsales:'sales',lar:'ar',linv:'inv',lcapex:'capex',lap:'ap',ldiv:'dividend'};
const NAMES={lsales:'매출액',lar:'기말 매출채권',linv:'기말 재고자산',lcapex:'설비투자',lap:'기말 매입채무',ldiv:'배당'};
const STAGES=[['2024 기본','대조 네 줄이 모두 맞을까요?'],['설비투자 120','순이익과 자산 합계는 바뀔까요?'],['기말 매출채권 430','순이익이 그대로인데 현금은 어떻게 될까요?'],['매출 1,800','매출이 20% 늘면 순이익과 현금은 얼마나 늘까요?'],['2025 사업연도','매출채권과 재고가 함께 늘면 현금은 어디까지 줄까요?']];
const defaults=b=>Object.fromEntries(Object.entries(IDS).map(([id,k])=>[id,BASES[b]().input[k]]));
const diff=(a,b)=>{const d=M.r1(a-b);return d>0?`▲ +${N(d)}`:d<0?`▼ ${N(d)}`:'';};
/* 세 재무제표: [줄, 지금 값, 기본 값, 굵게]. 기본 값은 고른 기초 연도의 본문 숫자다. */
function statements(lk,bs,open){
 const is=lk.is,b=bs.is,cf=lk.cf,c=lk.close,t=lk.totals,bc=bs.close,bt=bs.totals,st=s=>s.steps.map(x=>x.value);
 const I=[['매출',is.sales,b.sales],['− 매출원가',is.cogs,b.cogs],['= 매출총이익',is.gross,b.gross],['− 판매비와관리비',is.sga,b.sga],['= 영업이익',is.op,b.op,1],['− 이자비용',is.interestExpense,b.interestExpense],['+ 이자수익',is.interestIncome,b.interestIncome],['− 법인세',is.tax,b.tax],['= 당기순이익',is.ni,b.ni,1]];
 const [a0,a1,a2,a3,a4]=st(cf),[b0,b1,b2,b3,b4]=st(bs.cf);
 const C=[['당기순이익',a0,b0],['+ 감가상각',a1,b1],['− 매출채권 증가',a2,b2],['− 재고 증가',a3,b3],['+ 매입채무 증가',a4,b4],['= 영업활동',cf.cfo,bs.cf.cfo,1],['투자활동 (설비투자)',cf.cfi,bs.cf.cfi],['배당 지급',cf.dividend,bs.cf.dividend],['단기차입',cf.borrow,bs.cf.borrow],['= 재무활동',cf.cff,bs.cf.cff],['현금 증감',cf.net,bs.cf.net,1],['기초 현금',open.cash,open.cash],['= 기말 현금',c.cash,bc.cash,1]];
 const B=[['현금',c.cash,bc.cash],['매출채권',c.ar,bc.ar],['재고자산',c.inv,bc.inv],['유형자산',c.ppe,bc.ppe],['자산 합계',t.assets,bt.assets,1],['매입채무',c.ap,bc.ap],['단기차입금',c.std,bc.std],['사채',c.bond,bc.bond],['부채 합계',t.liabilities,bt.liabilities,1],['자본금 + 자본잉여금',c.capital+c.surplus,bc.capital+bc.surplus],['이익잉여금',c.re,bc.re],['자본 합계',t.equity,bt.equity,1]];
 const tbl=(rows,cap)=>U.table(['줄','억 원','본문 기본과 비교'],rows.map(([n,v,w,bold])=>[n,bold?`<b>${N(v)}</b>`:N(v),diff(v,w)]),cap);
 return `<div class="fs-three">${tbl(I,'손익계산서')}${tbl(C,'현금흐름표 (간접법)')}${tbl(B,'기말 재무상태표')}</div>`;
}
/* 세 표를 잇는 세 화살표: 순이익 → 이익잉여금, 현금 증감 → 현금, 설비투자·감가상각 → 유형자산. 숫자는 지금 계산 값이다. */
function links(lk,open){
 const t=(x,y,s,c='axis',a='middle')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`,box=(x,y,w,h,title)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+w/2,y+18,title,'series');
 const ar=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--accent)" stroke-width="2.2" marker-end="url(#fs-ar)"/>`;
 let s=`<defs><marker id="fs-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>`;
 s+=box(8,10,140,180,'손익계산서')+box(170,10,140,180,'현금흐름표')+box(332,10,140,180,'재무상태표');
 s+=t(78,58,`순이익 ${N(lk.is.ni)}`,'price')+t(240,58,`순이익 ${N(lk.is.ni)}`,'price')+t(240,108,`현금 증감 ${M.r1(lk.cf.net)>0?'+':''}${N(lk.cf.net)}`,'price')+t(240,158,`설비투자 ${N(-lk.cf.cfi)}`,'price');
 s+=t(402,58,`이익잉여금 ${N(lk.close.re)}`,'price')+t(402,108,`현금 ${N(lk.close.cash)}`,'price')+t(402,158,`유형자산 ${N(lk.close.ppe)}`,'price');
 s+=t(402,76,`(${N(open.re)} + ${N(lk.is.ni)} − 배당 ${N(-lk.cf.dividend)})`)+t(402,126,`(기초 ${N(open.cash)})`)+t(402,176,`(− 감가상각 ${N(lk.dep)})`);
 s+=ar(140,54,184,54)+ar(296,104,346,104)+ar(296,154,346,154)+`<path d="M140 62C230 86 300 76 346 62" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#fs-ar)"/>`;
 return U.svg(`세 재무제표의 연결: 순이익 ${N(lk.is.ni)}${U.josa(N(lk.is.ni),'이','가')} 이익잉여금 ${N(lk.close.re)}${U.josa(N(lk.close.re),'으로','로')}, 현금 증감 ${N(lk.cf.net)}${U.josa(N(lk.cf.net),'이','가')} 기말 현금 ${N(lk.close.cash)}${U.josa(N(lk.close.cash),'으로','로')}, 설비투자가 유형자산 ${N(lk.close.ppe)}${U.josa(N(lk.close.ppe),'으로','로')} 이어짐`,s,200);
}
const strip=stage=>`<ol class="stage-list" aria-label="다섯 단계">${STAGES.map(([n,q],i)=>`<li${i===stage?' class="current" aria-current="step"':''}><b>${i+1}. ${n}</b>${i===stage?' · ▶ 지금 단계':''}<span>예측: ${q}</span></li>`).join('')}</ol>`;
SLabs['three-statement-link']=el=>{
 let stage=null;
 const num=(id,label,max,v)=>U.number(id,label,0,max,1,v);
 U.setup(el,`<div class="fs-inputs">${U.select('lbase','기초 재무상태표와 사업연도',[['2023','2024 사업연도 (기초 2023년 말)'],['2024','2025 사업연도 (기초 2024년 말)']],'2023','바꾸면 아래 칸이 그해 본문 값으로 바뀝니다')}${num('lsales','매출액 (억 원)',100000,1500)}${num('lar','기말 매출채권 (억 원)',10000,230)}${num('linv','기말 재고자산 (억 원)',10000,170)}${num('lcapex','설비투자 (억 원)',10000,80)}</div><details class="fs-more"><summary>더 바꾸기: 기말 매입채무와 배당</summary><div class="fs-inputs">${num('lap','기말 매입채무 (억 원)',10000,130)}${num('ldiv','배당 (억 원)',1000,40)}</div></details><p class="caption">위의 “비교 예제” 다섯 단추가 다섯 단계입니다. 단추를 누르기 전에 아래 단계 목록의 질문마다 바뀔 줄을 짐작해 두세요.</p>`,true);
 U.on(el,'fs-preset',e=>{const k=STAGES.findIndex(s=>String(e.detail).includes(s[0]));stage=k>=0?k:null;el.dispatchEvent(new Event('fs-refresh'));});
 U.on(el,'input',e=>{if(e.isTrusted&&stage!==null){stage=null;el.dispatchEvent(new Event('fs-refresh'));}});
 U.bind(el,e=>{
  if(e&&e.type==='change'&&e.target.id==='lbase'){U.fill(el,defaults(U.value(el,'lbase')));stage=null;}
  const v=Object.fromEntries(Object.keys(IDS).map(id=>[id,U.num(el,id)])),bad=Object.keys(v).find(k=>v[k]===null);
  if(bad)return U.result(el,strip(stage),U.problem(NAMES[bad],`0에서 ${U.fmt(el.querySelector('#'+bad).max)} 사이의 숫자(억 원)를 넣어야 합니다.`));
  const B=BASES[U.value(el,'lbase')](),input=Object.fromEntries(Object.entries(IDS).map(([id,k])=>[k,v[id]]));
  let lk;try{lk=M.linkedYear(B.open,input);}catch(err){return U.result(el,strip(stage),U.problem('입력',U.why(err)));}
  const bs=M.linkedYear(B.open,B.input),cf=lk.cf,t=lk.totals,all=lk.checks.every(c=>c.ok);
  const borrow=cf.borrow?`차입 전 기말 현금이 <b>${E(cf.cashBeforeBorrow)}</b>으로 최소 현금 ${E(M.ASSUME.minCash)}보다 적어, ${E(M.ASSUME.borrowStep)} 단위로 <b>${E(cf.borrow)}</b>을 연말에 단기차입합니다 → 기말 현금 <b>${E(lk.close.cash)}</b>, 단기차입금 <b>${E(lk.close.std)}</b>.`:`차입 전 기말 현금 ${E(cf.cashBeforeBorrow)}이 최소 현금 ${E(M.ASSUME.minCash)} 이상이라 차입하지 않습니다.`;
  const warn=lk.depInsideCosts?'':`<br>주의: 매출원가와 판매비와관리비의 합(${E(M.r1(lk.is.cogs+lk.is.sga))})이 감가상각비 ${E(lk.dep)}보다 작아, “감가상각이 비용 안에 들어 있다”는 이 책의 가정이 깨진 입력입니다. 대조 네 줄은 그래도 맞습니다.`;
  const text=`${B.year} 사업연도: 순이익 <b>${E(lk.is.ni)}</b>, 영업활동 현금흐름 <b>${E(cf.cfo)}</b>, 기말 현금 <b>${E(lk.close.cash)}</b>, 자산 <b>${N(t.assets)} = 부채 ${N(t.liabilities)} + 자본 ${N(t.equity)}</b>.${U.checkList(lk.checks)}<span class="${all?'is-ok':'is-bad'}">대조 네 줄 ${all?'모두 ✓ 맞음':'가운데 ✗ 어긋난 줄이 있음'}</span>. ${borrow}${warn}${U.kind(['real','scenario','simple'],'감가상각 = 기초 유형자산 × 10%, 연말 차입(그해 이자 그대로), 법인세 20%는 이 책의 단순화와 가정입니다.')}`;
  U.result(el,strip(stage)+statements(lk,bs,B.open)+links(lk,B.open),text);
 });
};
})();
