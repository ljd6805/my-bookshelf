/* 9장 대표 실험: 세후 수익 계산기. 한 상품을 일반계좌·ISA·연금저축(연금 수령·중도 인출)에 놓은 네 칸을 TMath.afterTaxTable로 계산한다.
   해외 상장 ETF는 ISA·연금에서 살 수 없고(보도 기준), 국내 개별주식을 연금저축에서 살 수 있는지는 확인 못해 계산하지 않는다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,W=U.won0;
const COLS=[['general','일반계좌'],['isa','ISA'],['annuity','연금저축 · 연금 수령'],['early','연금저축 · 중도 인출']];
const BLOCK={foreign:'이 계좌에서는 살 수 없습니다(보도 기준)',unknown:'연금저축에서 개별 주식을 살 수 있는지 확인 못함 · 계산하지 않음'};
function calcChart(cells,pretax,mode){
 const vals=COLS.map(([k])=>cells[k].blocked?0:cells[k].after),hi=Math.max(pretax,...vals)*1.18||1,lo=Math.min(0,...vals),L=60,Rr=468,T=36,Bt=200,Y=v=>Bt-(v-lo)/(hi-lo)*(Bt-T),w=(Rr-L)/4;
 let s=`<text x="12" y="18" class="series">세후 수익 (원) · ┅ 세전 수익 · ▲ 고른 인출 방식</text><path d="M${L} ${Y(0).toFixed(1)}H${Rr}" stroke="var(--muted)"/><path d="M${L} ${Y(pretax).toFixed(1)}H${Rr}" stroke="var(--orange)" stroke-dasharray="5 4"/><text x="${Rr}" y="${(Y(pretax)-5).toFixed(1)}" text-anchor="end" class="mark-t">세전 ${F(pretax)}원</text>`;
 COLS.forEach(([k,name],i)=>{const x=L+i*w+w*.18,bw=w*.64,c=cells[k],short=name.replace('연금저축 · ','');
  if(c.blocked)s+=`<rect x="${x.toFixed(1)}" y="${(Bt-60).toFixed(1)}" width="${bw.toFixed(1)}" height="60" fill="none" stroke="var(--muted)" stroke-dasharray="4 3"/><text x="${(x+bw/2).toFixed(1)}" y="${Bt-26}" text-anchor="middle" class="axis">${c.blocked==='foreign'?'살 수 없음':'확인 못함'}</text>`;
  else{const v=c.after,y=Math.min(Y(v),Y(0)),hh=Math.max(1,Math.abs(Y(v)-Y(0))),on=k===mode;s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${on?'var(--accent)':'var(--blue)'}"/><text x="${(x+bw/2).toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" class="axis">${on?'▲':''}${F(v)}</text>`;}
  s+=`<text x="${(L+i*w+w/2).toFixed(1)}" y="${Bt+18}" text-anchor="middle" class="axis">${short}</text>`;});
 return U.svg(`계좌별 세후 수익: ${COLS.map(([k,n])=>`${n} ${cells[k].blocked?'계산 안 함':W(cells[k].after)}`).join(', ')}`,s,226);
}
function taxChart(d){const items=[['거래세',d.stt],['분배·배당·이자',d.income],['차익',d.gain]];return U.columns({labels:items.map(x=>x[0]),values:items.map(x=>x[1]),fmt:v=>`${F(v)}원`,tick:v=>F(v),title:'일반계좌에서 빠지는 세금의 종류',h:200,label:items.map(x=>`${x[0]} ${W(x[1])}`).join(', ')});}
function row(k,name,c,mode){
 if(c.blocked)return [name,'—','—',`<b>계산 안 함</b>`,BLOCK[c.blocked]];
 const d=c.detail,credit=d.credit?W(d.credit):'—',memo={general:'',isa:`순이익 ${W(d.net)} − 비과세 ${W(d.limit)}`,annuity:'5.5%, 55세 이후',early:'16.5%, 3년 뒤'}[k];
 return [(k===mode?'▲ ':'')+name,W(c.tax),credit,`<b>${W(c.after)}</b>`,memo+(c.sttUnknown!=null?` · 거래세가 빠진다고 놓으면 ${W(c.sttUnknown)}(확인 못함)`:'')];
}
TLabs['after-tax']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.RATE_NOTE}</b><br>${U.LAW_NOTE}</p>`+U.select('cprod','상품',Object.keys(U.PRODUCTS).map(k=>[k,`${U.pname(k)} (${U.PRODUCTS[k][1]})`]),'kother')+U.number('cprin','원금 (원)',0,100000000,100000,10000000)+U.number('cyears','보유 기간 (년)',1,30,1,3)+U.range('cgrowth','연 가격 상승률 (%, 가정)',-10,15,.5,4)+U.range('cpayout','연 분배·배당·이자율 (%, 가정)',0,8,.5,2)+U.select('cband','총급여 구간',[['under','5,500만 원 이하 (공제 16.5%)'],['over','5,500만 원 초과 (공제 13.2%)']],'under')+U.select('cisa','ISA 유형',[['general','일반형 (200만 원)'],['low','서민형 (400만 원)']],'general')+U.select('cmode','연금저축을 꺼내는 방법',[['annuity','55세 이후 연금으로'],['early','3년 뒤 중도 인출']],'annuity'));
 U.bind(el,()=>{
  const kind=U.value(el,'cprod'),p=U.num(el,'cprin'),n=U.num(el,'cyears'),g=+U.value(el,'cgrowth')/100,d=+U.value(el,'cpayout')/100,band=U.value(el,'cband'),isaType=U.value(el,'cisa'),mode=U.value(el,'cmode');
  if(p===null)return U.result(el,'',U.problem('원금','0에서 1억 원 사이의 원 단위 숫자를 넣어야 합니다.'));
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('보유 기간','1에서 30 사이의 정수(년)를 넣어야 합니다.'));
  const o={principal:p,years:n,growth:g,payout:d,band,isaType},t=M.afterTaxTable({...o,kind}),c=t.cells,f=t.flows;
  const gap=k=>{const x=M.afterTaxTable({...o,kind:k}).cells;return x.isa.after-x.general.after;};
  const tbl=U.table(['계좌','세금','받은 공제','세후 수익','계산 메모'],COLS.map(([k,name])=>row(k,name,c[k],mode)),`${U.pname(kind)} · ${F(p)}원 · ${n}년 · 연 ${F(g*100,1)}% + ${F(d*100,1)}%`);
  const list=COLS.map(([k,name])=>`${name} ${c[k].blocked?'계산 안 함':`<b>${W(c[k].after)}</b>`}`).join(', ');
  const nc=p>M.RATES.pension.limitSaving&&!c.annuity.blocked?` 연금 칸은 공제받지 않은 원금 ${W(p-M.RATES.pension.limitSaving)}이 세금 없이 나온다고 놓은 값입니다(확인 못함).`:'';
  const blocked=c.isa.blocked||c.annuity.blocked?`<br>✗ ${c.isa.blocked?'ISA·연금 칸: ':'연금 칸: '}${BLOCK[c.annuity.blocked]}.`:'';
  U.result(el,calcChart(c,f.pretax,mode)+taxChart(c.general.detail)+tbl,`<span class="rate-note">${U.RATE_NOTE}</span><br><b>${U.pname(kind)}</b> ${W(p)}, ${n}년: 세전 수익 <b>${W(f.pretax)}</b>(가격 차익 ${W(f.gain)} + 분배·배당·이자 ${W(f.income)}).<br>세후 수익: ${list}.${blocked}${nc}<br>같은 원금·기간·비율에서 일반계좌와 ISA의 세후 수익 차이는 누리200 <b>${W(gap('kequity'))}</b>, 누리 해외100 <b>${W(gap('kother'))}</b>입니다. 일반계좌에서 세금이 큰 상품일수록 ISA에서 줄어드는 세금이 큽니다.${U.kind(['real','news','scenario'],'가격 상승률과 분배율은 가정이고 수수료는 0입니다. 내 다른 소득, 세법 개정, 연 1,500만 원 기준은 계산기가 모릅니다.')}`);
 });
};
})();
