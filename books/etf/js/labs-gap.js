/* 4장 대표 실험: 지수·iNAV·시장가 괴리율 실험. 한 실험 안 세 단계.
   1단계 지수와 시장가로 괴리율 계산 → 2단계 장중 시각·LP 호가·시장가 매수 수량이 만드는 체결가와 괴리율(호가창, 장 마감 단일가) → 3단계 AP의 설정·환매 방향과 차익(비용 전).
   계산은 EMath.navFromIndex·gap·gapCheck·tick·gapScene·bidBook·arbitrage·lpExempt·isAuction. 규칙 숫자는 EMath.RULES에서만 읽는다.
   장중 지수 경로(장 시작부터 10:30까지 1.2% 오른 뒤 그대로), 다른 투자자의 호가, LP가 iNAV ± 40원에 1,000주씩 낸다는 설정, 면제 시간에 LP 호가가 없다는 설정은 미리 정한 가상 시나리오다. */
(()=>{
'use strict';
const U=EUI,M=EMath,F=U.fmt,W=U.won0,R=M.RULES;
const OPEN=540,LAST=929,RISE_END=630,RISE=0.012,QTYS=[0,100,1000,3000];
const UNDER=[['domestic','국내 기초자산 (누리200 등)'],['foreign','해외 기초자산 (누리 해외100 등)']];
const big=n=>{const e=Math.floor(n/1e8),m=Math.round((n-e*1e8)/1e4);return `${e?F(e)+'억 ':''}${m||!e?F(m)+'만 ':''}원`;};
/* 장중 지수 경로(가상 시나리오): 09:00에 목표 수준 ÷ 1.012에서 출발해 10:30에 목표 수준에 닿고 그 뒤로 그대로. */
const path=(level,t)=>t>=RISE_END?level:level*(1/(1+RISE)+(1-1/(1+RISE))*(t-OPEN)/(RISE_END-OPEN));
const scene=(level,t,lp,qty,under)=>M.gapScene({time:U.hhmm(t),index:path(level,t),lp,qty,underlying:under});
const lineTxt=(chk,under)=>`${under==='foreign'?'해외':'국내'} 기초자산 공시 기준 ${U.pct(chk.discloseLine,0)}를 ${chk.disclose?'<b>넘습니다</b>':'넘지 않습니다'} · LP 종가 관리 기준 ${U.pct(chk.lpLine,0)}${chk.lpClose?'도 <b>넘습니다</b>':`${chk.disclose?'는':'도'} 넘지 않습니다`}`;
/* 장중 그림: iNAV 선, 시장가 선, LP 호가 띠, LP 의무 면제 시간, 공시 기준선, 고른 시각의 점. */
function dayChart(level,t,lp,qty,under){
 const pts=[];for(let m=OPEN;m<=LAST;m+=5)pts.push(m);if(!pts.includes(t))pts.push(t);pts.sort((a,b)=>a-b);
 const rows=pts.map(m=>{const s=scene(level,m,lp,qty,under);return {m,inav:s.inav,price:s.price,lp:s.lp};}),line=R.disclose[under];
 const ys=rows.flatMap(r=>[r.inav-45,r.price,r.inav*(1+line)]),lo=Math.min(...ys),hi=Math.max(...ys),pad=(hi-lo)*.06;
 const L=64,Rr=466,T=40,B=262,X=m=>L+(m-OPEN)/(LAST-OPEN)*(Rr-L),Y=v=>B-(v-(lo-pad))/((hi-lo+2*pad)||1)*(B-T);
 let s='';
 for(const [a,b] of R.lpExempt){const x0=X(Math.max(OPEN,M.minutes(a))),x1=X(Math.min(LAST,M.minutes(b)));s+=`<rect x="${x0.toFixed(1)}" y="${T}" width="${Math.max(2,x1-x0).toFixed(1)}" height="${B-T}" fill="var(--orange)" fill-opacity=".14"/>`;}
 s+=`<text x="${L+2}" y="${T-6}" class="axis">◧ 09:00~09:05</text><text x="${Rr}" y="${T-6}" text-anchor="end" class="axis">15:20~ 단일가 ◧</text>`;
 if(lp)rows.forEach((r,i)=>{if(!r.lp||i===rows.length-1)return;const n=rows[i+1],x0=X(r.m),x1=X(n.m);s+=`<rect x="${x0.toFixed(1)}" y="${Y(M.tickUp(r.inav+40)).toFixed(1)}" width="${(x1-x0).toFixed(1)}" height="${(Y(M.tickDown(r.inav-40))-Y(M.tickUp(r.inav+40))).toFixed(1)}" fill="var(--accent)" fill-opacity=".18"/>`;});
 U.niceTicks(lo-pad,hi+pad,4).forEach(v=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${Rr}" stroke="var(--line)" stroke-opacity=".5"/><text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${F(v)}</text>`;});
 [[OPEN,'09:00'],[720,'12:00'],[LAST,'15:30']].forEach(([m,l],i)=>{s+=`<text x="${X(m).toFixed(1)}" y="${B+18}" text-anchor="${['start','middle','end'][i]}" class="axis">${l}</text>`;});
 const d=f=>rows.map((r,i)=>`${i?'L':'M'}${X(r.m).toFixed(1)} ${Y(f(r)).toFixed(1)}`).join('');
 s+=`<path d="${d(r=>r.inav*(1+line))}" fill="none" stroke="var(--muted)" stroke-dasharray="3 4"/>`;
 s+=`<path d="${d(r=>r.inav)}" fill="none" stroke="var(--accent)" stroke-width="2.6"/><path d="${d(r=>r.price)}" fill="none" stroke="var(--orange)" stroke-width="2.2" stroke-dasharray="6 4"/>`;
 const cur=rows.find(r=>r.m===t),cx=X(t),cy=Y(cur.price),left=cx>Rr-150;
 s+=`<path d="M${cx.toFixed(1)} ${T}V${B}" stroke="var(--text)" stroke-opacity=".35"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="var(--orange)"/><text x="${(cx+(left?-8:8)).toFixed(1)}" y="${Math.max(T+14,cy-9).toFixed(1)}" class="mark-t"${left?' text-anchor="end"':''}>▲ ${U.hhmm(t)} ${F(cur.price)}원</text>`;
 s+=`<text x="12" y="15" class="series">━ iNAV(지수 × 100원)  ┅ 시장가  ┈ 공시 기준 ${U.ppct(line,0)}</text><text x="12" y="30" class="axis">${lp?'▒ LP 호가 띠(iNAV ± 40원)':'LP 호가 끔'} · ◧ LP 의무 면제</text>`;
 return U.svg(`장중 iNAV와 시장가: ${U.hhmm(t)}에 iNAV ${W(cur.inav)}, 시장가 ${W(cur.price)}. LP 호가 ${lp?'켬':'끔'}, 시장가 매수 ${F(qty)}주. 09:00~09:05와 15:20~15:30은 LP 의무 면제`,s,290);
}
/* 2단계 호가창 표: 고른 시각의 매도 호가와 이번 주문이 먹은 칸, LP의 가장 높은 매수 호가. */
function ladder(sc,qty,time){
 let left=qty;const rows=sc.asks.map(([p,q,who])=>{const take=Math.min(left,q);left-=take;return [`${take?'▲ ':''}${F(p)}`,F(q),who==='LP'?'LP':'다른 투자자',take?`✓ ${F(take)}주 체결`:'남음'];});
 if(sc.lp){const b=M.bidBook(sc.inav,true)[0];rows.push([`${F(b[0])}`,F(b[1]),'LP · 매수 쪽',`가장 높은 매수 호가`]);}
 return U.table(['호가 (원)','수량 (주)','낸 쪽','이번 주문'],rows,`${time} 매도 호가창 · 가상 시나리오`);
}
function stage2(sc,t,lpOn,qty,under,level){
 const time=U.hhmm(t),f=sc.fill,mode=sc.auction?'장 마감 단일가 시간':'접속매매',duty=sc.exempt?'LP 호가 의무 면제':'LP 호가 의무 있음';
 let s=`<b>2단계</b> ${time} · ${mode} · ${duty}. 이 시각의 지수 ${F(path(level,t),2)}, iNAV ${W(sc.inav)}.`;
 if(lpOn&&sc.exempt)s+=` LP 호가를 켰지만 면제 시간이라 이 실험은 LP 호가가 없다고 놓습니다(시나리오).`;
 else if(sc.lp){const b=M.bidBook(sc.inav,true)[0][0];s+=` LP는 ${W(b)}(매수)과 ${W(M.tickUp(sc.inav+40))}(매도)에 1,000주씩 냅니다.`;}
 else s+=' LP 호가를 끄면 다른 투자자의 매도 호가만 남습니다.';
 if(!qty)s+=` 주문이 없어 가장 낮은 매도 호가 ${W(sc.price)}을 시장가로 봅니다.`;
 else if(sc.auction)s+=` 시장가 매수 ${F(qty)}주가 매도 호가 ${f.levels}칸을 먹고, 단일가 매매라 ${F(f.filled)}주가 모두 예상 체결가 <b>${W(f.last)}</b> 하나로 체결됩니다.`;
 else s+=` 시장가 매수 ${F(qty)}주가 매도 호가 ${f.levels}칸을 먹어 ${f.levels>1?`마지막 체결가는 <b>${W(f.last)}</b>(평균 ${F(f.avg,Number.isInteger(f.avg)?0:2)}원)입니다`:`<b>${W(f.last)}</b>에 모두 체결됩니다`}.`;
 if(f.unfilled)s+=` 매도 호가가 모자라 ${F(f.filled)}주만 체결되고 <b>${F(f.unfilled)}주는 미체결</b>입니다.`;
 return s+` 괴리율은 <b>${U.ppct(sc.gap)}</b>, ${U.side(sc.gap).split('(')[0]}입니다. ${lineTxt(sc.check,under)}.`;
}
function stage3(price,nav,src){
 const a=M.arbitrage(price,nav),name=src==='scene'?'2단계 체결가':'1단계 시장가';
 if(a.action==='none')return `<b>3단계</b> ${name} ${W(price)}이 NAV ${W(nav)}과 같아 AP에게 설정·환매 차익이 없습니다.`;
 const how=a.action==='create'?'바구니를 넣어 ETF를 <b>설정</b>한 뒤 시장에 팔 수 있습니다':'시장에서 ETF를 사서 <b>환매</b>하고 바구니를 받을 수 있습니다';
 return `<b>3단계</b> ${name} ${W(price)} ${a.action==='create'?'&gt;':'&lt;'} NAV ${W(nav)}이라 AP는 ${how}. 비용 전 차익은 1좌 <b>${W(a.perUnit)}</b>, CU 하나(${F(M.CU)}좌)에 <b>${big(a.perCU)}</b>입니다. 이런 ${a.action==='create'?'매도':'매수'}가 들어오면 시장가는 NAV 쪽으로 돌아갈 수 있습니다.`;
}
function apChart(price,nav){
 const a=M.arbitrage(price,nav),t=(x,y,s,c='axis',an='middle')=>`<text x="${x}" y="${y}" text-anchor="${an}" class="${c}">${s}</text>`,box=(x,label)=>`<rect x="${x}" y="22" width="128" height="40" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+64,47,label,'series');
 const on=a.action!=='none',create=a.action==='create';
 let s=box(12,'운용사')+box(176,'AP')+box(340,'거래소 시장');
 s+=`<path d="M${create?172:144} 70H${create?144:172}" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?3:1.5}"/><path d="M${create?308:336} 70H${create?336:308}" stroke="${on?'var(--orange)':'var(--line)'}" stroke-width="${on?3:1.5}"/>`;
 s+=t(158,92,on?(create?'▲ 설정':'▲ 환매'):'—','mark-t')+t(322,92,on?(create?'▲ ETF 매도':'▲ ETF 매수'):'—','mark-t')+t(240,116,on?`1좌 ${F(a.perUnit)}원 · CU당 ${big(a.perCU)} (비용 전)`:'차익 없음','axis');
 return U.svg(`AP: ${on?(create?'설정 후 매도':'매수 후 환매'):'차익 없음'}, 1좌 ${W(a.perUnit)}`,s,126);
}
ELabs['gap-lab']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.RULE_NOTE}</b></p><fieldset class="step"><legend>1단계 · 괴리율 계산</legend>${U.number('gindex','기초지수 수준 (포인트, 1포인트 = 100원)',1,1000,0.01,303.6,'iNAV = 지수 × 100원. 120.00이면 12,000원')+U.number('gprice','화면의 시장가 (원)',1,1000000,1,30400)}</fieldset><fieldset class="step"><legend>2단계 · LP 호가와 장 마감 단일가</legend>${U.range('gtime','장중 시각',OPEN,LAST,1,630,'15:20 이후의 주문은 모았다가 15:30에 가격 하나로 체결됩니다','time')+U.check('glp','LP 호가 켜기',true)+U.select('gqty','시장가 매수 수량',QTYS.map(q=>[q,`${F(q)}주`]),100)+U.select('gunder','기초자산 (공시·LP 기준선)',UNDER,'domestic')}</fieldset><fieldset class="step"><legend>3단계 · AP의 설정·환매</legend>${U.select('gsrc','AP가 보는 시장가',[['scene','2단계 체결가'],['input','1단계 시장가']],'scene')}</fieldset>`);
 U.bind(el,()=>{
  const level=U.num(el,'gindex'),price=U.num(el,'gprice'),t=+U.value(el,'gtime'),lp=U.checked(el,'glp'),qty=+U.value(el,'gqty'),under=U.value(el,'gunder'),src=U.value(el,'gsrc');
  if(level===null)return U.result(el,'',U.problem('기초지수 수준','1에서 1,000 사이의 숫자(포인트)를 넣어야 합니다.'));
  if(price===null||!Number.isInteger(price))return U.result(el,'',U.problem('시장가','1에서 1,000,000 사이의 정수(원)를 넣어야 합니다.'));
  const inav=Math.round(M.navFromIndex(level)),g=M.gap(price,inav),chk=M.gapCheck(g,under),tk=M.tick(price),sc=scene(level,t,lp,qty,under);
  const s1=`<b>1단계</b> 지수 ${F(level,2)} → iNAV <b>${W(inav)}</b>(지수 1포인트 = 100원). 시장가 ${W(price)}이면 괴리율 = (${F(price)} − ${F(inav)}) ÷ ${F(inav)} × 100 = <b>${U.ppct(g)}</b>(${U.ppct(g,4)}), ${U.side(g)}입니다. 호가 한 칸 ${F(tk)}원은 이 iNAV에서 ${U.pct(tk/inav,3)}이고, 30,000원 근처라면 ${U.pct(tk/M.ETFS.nuri.nav,3)}입니다. ${lineTxt(chk,under)}.`;
  const apPrice=src==='scene'?sc.price:price,apNav=src==='scene'?sc.inav:inav;
  U.result(el,dayChart(level,t,lp,qty,under)+ladder(sc,qty,U.hhmm(t))+apChart(apPrice,apNav),`<span class="rate-note">${U.RULE_NOTE}</span><br>${s1}<br>${stage2(sc,t,lp,qty,under,level)}<br>${stage3(apPrice,apNav,src)}${U.kind(['real','official','news','scenario'],'호가단위(30,000원대 5원)는 공식 원문, 공시·LP 기준은 보도 기준입니다. 장중 지수 경로, 다른 투자자의 호가, LP가 iNAV ± 40원에 1,000주씩 낸다는 설정, 면제 시간에 LP 호가가 없다는 설정은 시나리오이며 실제 LP는 면제 시간에도 호가를 낼 수 있습니다. CU 10만 좌는 가정입니다.')}`);
 });
};
})();
