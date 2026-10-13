/* 1~2장 실험: 거래 날짜와 결산일로 매출과 현금을 회계연도별로 나누기, 거래를 넣어 재무상태표의 두 줄과 합계 바꾸기.
   계산은 SMath.accrual·fiscalYear·applyTx·totals·classifyCheck만 쓴다. 새벽전자의 금액과 날짜는 본문의 가상 사례다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1;
const TXS=[['cashSale','현금 판매'],['creditSale','외상 판매'],['collect','외상 대금 회수'],['buyInventory','재고 매입(현금)'],['buyEquipment','설비 구입']];
const AMT=[0,30,30,0,0],DAYS=['2024-11-15','2024-12-20','2025-02-20','2024-12-05','2024-12-28'];
const CLOSES=[['12-31','12월 31일 (새벽전자)'],['12-15','12월 15일'],['06-30','6월 30일']];
/* 1장: 거래 다섯 건의 금액·날짜, 설비 대금 날짜, 결산일 → 회계연도별 매출·현금 유입·유출. */
SLabs['accrual-timeline']=el=>{
 const rows=TXS.map(([,name],i)=>`<fieldset class="cards"><legend>${name}</legend>${U.number('aa'+i,`${name} 금액 (억 원)`,0,1000,1,AMT[i])}${U.date('ad'+i,i===4?'설비가 들어온 날':`${name} 날짜`,DAYS[i],'2024-01-01','2025-12-31')}${i===4?U.date('apay','설비 대금을 낸 날','2025-01-10','2024-01-01','2025-12-31'):''}</fieldset>`).join('');
 U.setup(el,U.select('aclose','결산일 (회계연도를 끊는 날)',CLOSES,'12-31','회계연도는 결산일이 속한 해로 부릅니다')+rows);
 U.bind(el,()=>{
  const amts=TXS.map((_,i)=>U.num(el,'aa'+i)),days=TXS.map((_,i)=>U.day(el,'ad'+i)),pay=U.day(el,'apay'),close=U.value(el,'aclose');
  const ba=amts.findIndex(v=>v===null),bd=days.findIndex(v=>v===null);
  if(ba>=0)return U.result(el,'',U.problem(`${TXS[ba][1]} 금액`,'0에서 1,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  if(bd>=0)return U.result(el,'',U.problem(`${TXS[bd][1]} 날짜`,'2024-01-01에서 2025-12-31 사이의 날짜를 골라야 합니다.'));
  if(pay===null)return U.result(el,'',U.problem('설비 대금을 낸 날','2024-01-01에서 2025-12-31 사이의 날짜를 골라야 합니다.'));
  const txs=TXS.map(([type],i)=>({type,amount:amts[i],date:days[i],...(type==='buyEquipment'?{pay}:{})})),out=M.accrual(txs.filter(t=>t.amount>0),close);
  const years=Object.keys(out).sort(),zero={revenue:0,cashIn:0,cashOut:0,assetsBought:0,payable:0};
  const txRows=txs.map((t,i)=>[TXS[i][1],t.amount?E(t.amount):'0 (넣지 않음)',t.date+(t.pay?` · 대금 ${t.pay}`:''),`${M.fiscalYear(t.date,close)} 회계연도${t.pay&&M.fiscalYear(t.pay,close)!==M.fiscalYear(t.date,close)?` · 대금 ${M.fiscalYear(t.pay,close)}`:''}`]);
  const yRows=years.map(y=>{const r=out[y];return [`${y} 회계연도`,`<b>${E(r.revenue)}</b>`,`<b>${E(r.cashIn)}</b>`,E(r.cashOut),E(r.assetsBought),E(r.payable)];});
  const chart=years.length?U.columns({labels:years.flatMap(y=>[`${y}|매출`,`${y}|현금 유입`]),values:years.flatMap(y=>[out[y].revenue,out[y].cashIn]),mark:i=>i%2===0,colors:years.flatMap(()=>['var(--accent)','var(--blue)']),fmt:v=>N(v),title:'회계연도별 ▲매출과 현금 유입 (억 원)',twoLine:true,h:250,label:years.map(y=>`${y} 회계연도 매출 ${E(out[y].revenue)}, 현금 유입 ${E(out[y].cashIn)}`).join('; ')}):'';
  const say=years.map(y=>{const r={...zero,...out[y]};return `${y} 회계연도에는 매출 <b>${E(r.revenue)}</b>, 현금 유입 <b>${E(r.cashIn)}</b>, 현금 유출 ${E(r.cashOut)}${r.assetsBought?`, 자산으로 산 것 ${E(r.assetsBought)}`:''}${r.payable?`, 그해 말 아직 내지 않은 대금 ${E(r.payable)}`:''}`;}).join('이고, ');
  const credit=txs[1].amount,cfy=M.fiscalYear(txs[1].date,close),kfy=M.fiscalYear(txs[2].date,close);
  const ar=credit&&txs[2].amount&&cfy!==kfy?`<br>외상 판매 ${E(credit)}${U.josa(E(credit),'은','는')} ${cfy} 회계연도 매출이고 대금은 ${kfy} 회계연도에 들어오므로, ${cfy} 회계연도 말 재무상태표에는 받을 돈이 매출채권으로 남습니다.`:credit&&cfy===kfy?`<br>결산일을 ${close}${U.josa(close,'으로','로')} 두면 외상 판매와 대금 회수가 같은 ${cfy} 회계연도에 들어가 그해 말에 남는 매출채권이 없습니다.`:'';
  U.result(el,chart+U.table(['회계연도','매출','현금 유입','현금 유출','자산으로 산 것','미지급 대금'],yRows,`결산일 ${close} 기준 회계연도별 합계 (억 원)`)+U.table(['거래','금액','날짜','들어가는 해'],txRows,'거래 다섯 건과 들어가는 회계연도'),
   `${years.length?say+'입니다.':'금액이 0이 아닌 거래가 없어 기록되는 것이 없습니다.'}${ar}<br>매출은 물건을 넘긴 날, 현금은 돈이 오간 날의 회계연도에 적습니다. 재고 매입과 설비 구입은 비용이 아니라 자산으로 기록됩니다.${U.kind(['real','scenario'],'거래 금액과 날짜는 가상이고, 수익 인식 기준의 세부(여러 해 계약·반품)는 넣지 않았습니다.')}`);
 });
};
/* 2장: 거래를 넣어 재무상태표 바꾸기. 넣은 거래 목록(넣기·빼기)에 지금 고른 거래를 한 번 더 얹어 "거래 전 → 거래 뒤"를 보인다. */
const KEYS=[['cash','현금','유동자산'],['ar','매출채권','유동자산'],['inv','재고자산','유동자산'],['ppe','유형자산','비유동자산'],['ap','매입채무','유동부채'],['std','단기차입금','유동부채'],['bond','사채','비유동부채'],['capital','자본금','자본'],['surplus','자본잉여금','자본'],['re','이익잉여금','자본']];
const KINDS=[['borrow','은행에서 차입'],['repayDebt','단기차입금 상환'],['buyEquipment','현금으로 설비 구입'],['payAP','매입채무를 현금으로 상환'],['creditSale','외상 판매 (원가는 판매가의 70%)']];
const NAME=Object.fromEntries(KEYS.map(([k,n])=>[k,n])),CLS=Object.keys(M.CLASS);
const start=v=>v==='2024'?M.saebyeok().y2024.close:M.OPENING;
/* 자산 | 부채 + 자본 두 기둥. 칸이 넉넉하면 이름과 금액을 안에 적는다. */
function stack(bs,t){
 const max=Math.max(t.assets,1),H=190,T=40,col=(x,parts,title,total)=>{let y=T+H,s=`<text x="${x+60}" y="${T-10}" text-anchor="middle" class="series">${title} ${N(total)}</text>`;
  parts.forEach(([name,v],i)=>{const h=v/max*H;y-=h;s+=`<rect x="${x}" y="${y.toFixed(1)}" width="120" height="${Math.max(h,.5).toFixed(1)}" fill="${['var(--accent)','var(--blue)','var(--orange)','var(--muted)'][i%4]}" fill-opacity=".3" stroke="var(--line)"/>`;if(h>=17)s+=`<text x="${x+60}" y="${(y+h/2+5).toFixed(1)}" text-anchor="middle" class="price">${name} ${N(v)}</text>`;});return s;};
 const s=col(60,[['현금',bs.cash],['매출채권',bs.ar],['재고',bs.inv],['유형자산',bs.ppe]],'자산',t.assets)+col(300,[['매입채무',bs.ap],['단기차입',bs.std],['사채',bs.bond],['자본',t.equity]],'부채 + 자본',t.liabilities+t.equity)+`<text x="240" y="${T+H/2}" text-anchor="middle" class="price">=</text>`;
 return U.svg(`자산 ${N(t.assets)} = 부채 ${N(t.liabilities)} + 자본 ${N(t.equity)} (억 원)`,s,250);
}
function sortBoard(picks){
 const chip=k=>`<span class="fs-chip" draggable="true" data-line="${k}">${NAME[k]}</span>`,zone=(v,title)=>`<div class="fs-zone" data-zone="${v}"><b>${title}</b>${CLS.filter(k=>(picks[k]||'')===v).map(chip).join('')||'<small>여기에 끌어다 놓기</small>'}</div>`;
 return `<div class="fs-board" aria-hidden="true">${zone('','고르기 전')}${zone('current','유동')}${zone('noncurrent','비유동')}</div><p class="caption">줄 이름표를 끌어 칸에 놓거나, 왼쪽의 “줄마다 유동·비유동 고르기” 목록에서 고릅니다(키보드는 목록을 씁니다).</p>`;
}
SLabs['balance-sheet-tx']=el=>{
 let list=[];
 const picks=`<fieldset class="cards"><legend>줄마다 유동·비유동 고르기</legend>${CLS.map(k=>U.select('bc'+k,NAME[k],[['','고르기 전'],['current','유동'],['noncurrent','비유동']],'')).join('')}</fieldset>`;
 U.setup(el,U.select('bstart','출발하는 재무상태표',[['2023','2023년 말 (1,050 = 370 + 680)'],['2024','2024년 말 (1,156 = 380 + 776)']],'2023')+U.select('bkind','거래 종류',KINDS,'borrow')+U.number('bamt','거래 금액 (억 원, 외상 판매는 판매가)',0,2000,1,50)+`<div class="buttons"><button type="button" data-add>이 거래 넣고 다음 거래 고르기</button><button type="button" data-undo>마지막에 넣은 거래 빼기</button></div>`+picks);
 const refresh=()=>el.dispatchEvent(new Event('fs-refresh'));
 U.on(el,'click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-add')){const a=U.num(el,'bamt');if(a===null||a===0)return;list.push({kind:U.value(el,'bkind'),amount:a});el.querySelector('#bamt').value=0;refresh();}
  if(b.hasAttribute('data-undo')&&list.length){list.pop();refresh();}});
 U.on(el,'fs-preset',()=>{list=[];refresh();});
 U.on(el,'dragstart',e=>{const c=e.target.closest('[data-line]');if(c)e.dataTransfer.setData('text/plain',c.dataset.line);});
 U.on(el,'dragover',e=>{if(e.target.closest('[data-zone]'))e.preventDefault();});
 U.on(el,'drop',e=>{const z=e.target.closest('[data-zone]'),k=e.dataTransfer.getData('text/plain');if(!z||!CLS.includes(k))return;e.preventDefault();const s=el.querySelector('#bc'+k);s.value=z.dataset.zone;s.dispatchEvent(new Event('change',{bubbles:true}));});
 U.bind(el,e=>{
  if(e&&e.type==='change'&&e.target.id==='bstart')list=[];
  const a=U.num(el,'bamt'),kind=U.value(el,'bkind'),from=start(U.value(el,'bstart')),picked=Object.fromEntries(CLS.map(k=>[k,U.value(el,'bc'+k)]));
  if(a===null)return U.result(el,'',U.problem('거래 금액','0에서 2,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  let before,after;
  try{before=list.reduce((b,tx)=>M.applyTx(b,tx),from);after=a?M.applyTx(before,{kind,amount:a}):before;}catch(err){return U.result(el,'',U.problem('거래 금액',U.why(err)));}
  const t0=M.totals(before),t1=M.totals(after),grade=M.classifyCheck(picked),n=CLS.filter(k=>picked[k]).length,ok=CLS.filter(k=>picked[k]&&grade[k]).length;
  const mark=k=>{const d=M.r1(after[k]-before[k]);return d>0?`▲ +${N(d)}`:d<0?`▼ ${N(d)}`:'';};
  const rows=KEYS.map(([k,name,grp])=>[name,grp,N(before[k]),`<b>${N(after[k])}</b>`,mark(k),CLS.includes(k)?(picked[k]?(grade[k]?'✓ 맞음':'✗ 다시'):'고르기 전'):'—']);
  rows.push(['자산 합계','',N(t0.assets),`<b>${N(t1.assets)}</b>`,'',''],['부채 합계','',N(t0.liabilities),`<b>${N(t1.liabilities)}</b>`,'',''],['자본 합계','',N(t0.equity),`<b>${N(t1.equity)}</b>`,'','']);
  const changed=KEYS.filter(([k])=>mark(k)).map(([k])=>`${NAME[k]} ${mark(k)}`).join(', ');
  const done=list.length?`넣어 둔 거래 ${list.length}건(${list.map(x=>`${KINDS.find(k=>k[0]===x.kind)[1]} ${N(x.amount)}`).join(', ')}) 뒤 `:'';
  const text=`${done}거래 전 <b>${N(t0.assets)} = ${N(t0.liabilities)} + ${N(t0.equity)}</b>에서 ${a?`“${KINDS.find(k=>k[0]===kind)[1]} ${E(a)}”${U.josa(E(a),'을','를')} 넣으면 ${changed||'바뀌는 줄이 없고'} → 거래 뒤 <b>${N(t1.assets)} = ${N(t1.liabilities)} + ${N(t1.equity)}</b>입니다.`:'금액이 0이라 바뀌는 줄이 없습니다.'} 자산 = 부채 + 자본 ${t1.balanced?'✓ 맞음':'✗ 어긋남'}.<br>유동자산 ${N(t0.currentAssets)} → <b>${N(t1.currentAssets)}</b>, 유동부채 ${N(t0.currentLiabilities)} → <b>${N(t1.currentLiabilities)}</b>입니다. 유동·비유동 분류: ${n?`고른 ${n}줄 가운데 ${ok}줄 ✓ 맞음, ${n-ok}줄 ✗ 다시`:'아직 고른 줄이 없습니다'}(사채는 만기가 1년 넘게 남았다고 놓은 가정).${U.kind(['real','scenario'],'외상 판매는 원가를 판매가의 70%로 놓고 법인세를 넣지 않았습니다.')}`;
  U.result(el,stack(after,t1)+sortBoard(picked)+U.table(['줄','구분','거래 전','거래 뒤','바뀜','분류 채점'],rows,'재무상태표 (억 원)'),text);
 });
};
})();
