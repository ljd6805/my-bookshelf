/* 9~13장 실험: 결제일과 미수, 왕복 비용, 격자 한 칸, 거래 시간, 사기 신호, 마지막 과제. 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won,esc=U.esc;
/* 2026년 국내 증시 휴장일(주말 제외). 확인일 2026-10-12, docs/research.html.
   추석은 9월 24~26일이고 26일이 토요일이라 대체공휴일이 없다. 개천절(10-03)은 토요일이라 10-05가 대체공휴일, 한글날(10-09)은 금요일.
   5-01 근로자의 날, 6-03 지방선거일, 7-17 제헌절, 12-31 연말 휴장을 포함한다. 공식 휴장일 공지로 다시 확인할 것. */
const HOLIDAYS=['2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-02','2026-05-01','2026-05-05','2026-05-25','2026-06-03','2026-07-17','2026-08-17','2026-09-24','2026-09-25','2026-10-05','2026-10-09','2026-12-25','2026-12-31'];
const DAY='일월화수목금토';
const TRADES=[['2026-09-22','9월 22일(화) · 추석 연휴 이틀 전'],['2026-09-23','9월 23일(수) · 추석 연휴 바로 전'],['2026-10-01','10월 1일(목) · 개천절 대체공휴일 앞'],['2026-10-08','10월 8일(목) · 한글날 바로 전'],['2026-10-12','10월 12일(월) · 평범한 주']];
function calendar(from,to){
 const days=[],d=new Date(from+'T00:00:00Z');
 while(true){const key=d.toISOString().slice(0,10),w=d.getUTCDay();days.push({key,w,off:w===0||w===6||HOLIDAYS.includes(key)});if(key===to||days.length>14)break;d.setUTCDate(d.getUTCDate()+1);}
 const cw=Math.min(60,440/days.length);
 const body=days.map((x,i)=>{const cx=20+i*cw,tag=i===0?'체결':x.key===to?'결제':x.off?(x.w%6===0?'주말':'휴장'):'영업일';return `<rect x="${cx}" y="60" width="${cw-4}" height="70" rx="5" fill="${i===0||x.key===to?'var(--accent)':'var(--panel2)'}" fill-opacity="${x.off?.35:i===0||x.key===to?.9:1}" stroke="var(--line)" ${x.off?'stroke-dasharray="3 3"':''}/><text x="${cx+(cw-4)/2}" y="88" text-anchor="middle" class="${i===0||x.key===to?'on-accent':''}">${+x.key.slice(8)}일</text><text x="${cx+(cw-4)/2}" y="108" text-anchor="middle" class="${i===0||x.key===to?'on-accent':''}">${DAY[x.w]}</text><text x="${cx+(cw-4)/2}" y="150" text-anchor="middle">${tag}</text>`;}).join('');
 return U.svg(`${from} 체결에서 ${to} 결제까지의 달력. 주말과 휴장일은 점선 칸입니다.`,`<text x="20" y="40">체결일부터 결제일까지 (점선 칸은 거래소가 쉬는 날)</text>${body}`,180);
}
MLabs.settle=el=>{
 U.setup(el,U.select('sdate','체결한 날',TRADES,'2026-09-23')+U.range('scost','산 금액 (원)',100000,5000000,5000,1995000)+U.range('scash','계좌에 있던 돈 (원)',0,5000000,10000,1500000)+U.range('ssell','반대매매 때 가정한 매도 가격 (원)',15000,25000,50,19000));
 U.bind(el,()=>{
  const date=el.querySelector('#sdate').value,pay=M.addBusinessDays(date,2,HOLIDAYS),cost=U.value(el,'scost'),cash=U.value(el,'scash'),sell=U.value(el,'ssell'),r=M.shortfall(cost,cash,sell);
  const gap=Math.round((new Date(pay)-new Date(date))/864e5),money=U.bars(['산 금액','계좌의 돈','모자란 돈(미수)'],[cost,cash,r.due],{unit:'원',mark:i=>i===2&&r.due>0});
  const due=r.due?`계좌의 돈이 ${W(cash)}뿐이라 <b>${W(r.due)}</b>이 모자랍니다(미수). 결제일까지 채우지 못하면 증권사가 다음 영업일에 주식을 팔아 메웁니다(반대매매). ${W(sell)}에 판다고 가정하면 <b>${F(r.sellQty,0)}주</b>를 팔아야 합니다.`:`계좌의 돈 ${W(cash)}으로 산 금액 ${W(cost)}을 모두 낼 수 있어 미수가 생기지 않습니다.`;
  U.result(el,calendar(date,pay)+money,`${date}에 체결한 주문은 영업일 이틀 뒤인 <b>${pay}</b>에 결제됩니다. 달력으로는 ${gap}일 뒤입니다.<br>${due}${U.kind('real','결제일은 T+2 영업일 규칙과 2026년 휴장일로 계산했습니다. 반대매매 수량은 교육용 단순화이며 실제 방식은 증권사마다 다릅니다.')}`);
 });
};
const TAXES=[['0.2','주식 · 증권거래세 0.20%'],['0','ETF · 증권거래세 없음']];
const kindOf=tax=>+tax?'stock':'etf';
const priceOk=(p,kind)=>Number.isInteger(p)&&p>=1000&&p<=600000?(M.isValidPrice(p,kind)?'':`${W(p)}은 호가단위에 맞지 않아 실제로는 주문할 수 없습니다. `):null;
MLabs.roundtrip=el=>{
 U.setup(el,U.number('rbuy','산 가격 (원)',1000,600000,1,19950)+U.number('rsell','판 가격 (원)',1000,600000,1,20000)+U.range('rqty','수량 (주)',1,1000,1,10)+U.range('rfee','매수·매도 수수료율 각각 (%)',.0036,.5,.0001,.015)+U.select('rtax','종류와 거래세',TAXES,'0.2'));
 U.bind(el,()=>{
  const buy=U.value(el,'rbuy'),sell=U.value(el,'rsell'),qty=U.value(el,'rqty'),fee=U.value(el,'rfee'),tax=Number(el.querySelector('#rtax').value),kind=kindOf(tax);
  const wb=priceOk(buy,kind),ws=priceOk(sell,kind);
  if(wb===null||ws===null)return U.result(el,'','<strong>가격을 확인해 주세요</strong> · 산 가격과 판 가격은 1,000원에서 600,000원 사이의 정수여야 합니다.');
  const r=M.roundTrip(buy,sell,qty,fee,tax),be=M.breakEven(buy,qty,fee,tax,kind);
  const chart=U.bars(['차익','매수 수수료','매도 수수료','증권거래세','남는 돈'],[r.gross,-r.buyFee,-r.sellFee,-r.tax,r.net],{unit:'원',signed:true,mark:i=>i===4&&r.net>0});
  U.result(el,chart,`${W(buy)}에 ${F(qty,0)}주를 사서 ${W(sell)}에 팔면 차익은 ${W(r.gross)}입니다. 비용은 <b>${W(r.costs)}</b>(매수 수수료 ${W(r.buyFee)} + 매도 수수료 ${W(r.sellFee)} + 거래세 ${W(r.tax)})이고, 남는 돈은 <b>${W(r.net)}</b>입니다.<br>비용까지 넣은 본전 매도가는 <b>${be?W(be):'찾지 못함'}</b>입니다. ${wb}${ws}수수료와 세금은 원 미만을 버렸습니다.${U.kind('real','수수료율은 증권사마다 다르므로 직접 바꿔 보세요. 거래세율은 2026년 기준입니다(조사 노트).')}`);
 });
};
const KINDS=[['stock','주식 (거래세 0.20%)'],['etf','ETF (거래세 없음)']];
const taxOf=k=>k==='stock'?.2:0;
MLabs.gridstep=el=>{
 U.setup(el,U.number('gstart','격자 한 칸의 매수 가격 (원)',1000,600000,1,19970)+U.range('gstep','간격 (원)',5,300,5,30)+U.range('gqty','한 칸 수량 (주)',1,500,1,10)+U.select('gkind','종류',KINDS,'stock'));
 U.bind(el,()=>{
  const start=U.value(el,'gstart'),step=U.value(el,'gstep'),qty=U.value(el,'gqty'),kind=el.querySelector('#gkind').value,tax=taxOf(kind);
  if(!Number.isInteger(start)||start<1000||start>600000)return U.result(el,'','<strong>가격을 확인해 주세요</strong> · 매수 가격은 1,000원에서 600,000원 사이의 정수여야 합니다.');
  const c=M.gridCell(start,step,qty,.015,tax,kind),min=M.minGridStep(start,1,qty,.015,tax,kind),gross=(c.sell-c.buy)*qty;
  const chart=U.bars(['한 칸 차익','왕복 비용','남는 돈'],[gross,-c.costs,c.net],{unit:'원',signed:true,mark:i=>i===2&&c.profitable});
  const tick=c.valid?'두 가격 모두 눈금에 맞습니다.':`${c.validBuy?'':`매수 ${W(c.buy)}`}${!c.validBuy&&!c.validSell?'과 ':''}${c.validSell?'':`매도 ${W(c.sell)}`}이 눈금(${W(M.tickSize(c.validSell?c.buy:c.sell,kind))})에 맞지 않아 주문이 거부됩니다.`;
  const wide=!c.valid?`거부된 칸은 체결되지 않으므로 손익이 생기지 않습니다. 접수됐다고 가정하면 왕복 비용 ${W(c.costs)}에 손익은 ${W(c.net)}입니다.`:c.net>0?`간격이 왕복 비용 ${W(c.costs)}보다 넓어 ${W(c.net)}이 남습니다.`:`간격이 왕복 비용 ${W(c.costs)}보다 좁아 ${W(-c.net)} 손해입니다.`;
  U.result(el,chart,`${W(c.buy)}에 사서 ${W(c.sell)}에 파는 한 칸: ${tick} ${wide}<br>판정: <b>${!c.valid?'거부':c.profitable?'이익':'손해'}</b>. 이 매수 가격에서 눈금에도 맞고 비용도 넘는 가장 좁은 간격은 <b>${min?W(min):'2,000원 안에서 없음'}</b>입니다.${U.kind('real','수수료율 0.015%를 가정했습니다.')}`);
 });
};
/* 거래 시간표. 확인일 2026-10-12, docs/research.html. 시각은 'HH:MM'이며 끝 시각은 포함하지 않는다.
   KRX 애프터마켓(16:00~20:00, 접속매매)은 2026-09-14에 시작했고, 예전 시간외 단일가(16:00~18:00)는 그때 없어졌다.
   NXT는 세 시간대 모두 접속매매이며 애프터마켓은 15:40에 시작한다. */
const HOURS={
 KRX:[['장 시작 동시호가','08:30','09:00'],['장전 시간외 종가','08:30','08:40'],['정규장','09:00','15:30'],['종가 단일가','15:20','15:30'],['장후 시간외 종가','15:40','16:00'],['애프터마켓','16:00','20:00']],
 NXT:[['프리마켓','08:00','08:50'],['메인마켓','09:00:30','15:20'],['애프터마켓','15:40','20:00']]
};
const mins=t=>{const [h,m,s=0]=t.split(':').map(Number);return h*60+m+s/60;};
const hhmm=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
function hoursChart(now){
 const x=v=>178+(v-420)/(1230-420)*262,rows=[...HOURS.KRX.map(r=>['KRX',...r]),...HOURS.NXT.map(r=>['NXT',...r])],rh=22;
 const body=rows.map(([venue,name,a,b],i)=>{const y=24+i*rh,open=now>=mins(a)&&now<mins(b);return `<text x="8" y="${y+15}">${venue} ${esc(name)}</text><rect x="${x(mins(a))}" y="${y+3}" width="${x(mins(b))-x(mins(a))}" height="${rh-6}" rx="3" fill="${venue==='KRX'?'var(--blue)':'var(--orange)'}" fill-opacity="${open?1:.3}"/>${open?`<text x="${x(mins(b))+4}" y="${y+15}">열림</text>`:''}`;}).join('');
 const axis=[420,540,660,780,900,1020,1140].map(v=>`<text x="${x(v)}" y="${42+rows.length*rh}" text-anchor="middle">${hhmm(v).slice(0,2)}</text>`).join('');
 return U.svg(`거래 시간표. 지금 ${hhmm(now)}.`,`${body}${axis}<text x="8" y="${42+rows.length*rh}">시각(시)</text><path d="M${x(now)} 20V${26+rows.length*rh}" stroke="var(--accent)" stroke-width="2"/><text x="${Math.min(440,x(now))}" y="16" text-anchor="middle" class="price">${hhmm(now)}</text>`);
}
MLabs.hours=el=>{
 U.setup(el,U.range('hclock','시각 (10분 단위)',420,1230,10,600));
 U.bind(el,()=>{
  const now=U.value(el,'hclock');el.querySelector('#hclock-value').textContent=hhmm(now);
  const open=v=>HOURS[v].filter(([,a,b])=>now>=mins(a)&&now<mins(b)).map(r=>r[0]),k=open('KRX'),n=open('NXT');
  const say=(v,list)=>list.length?`${v}는 <b>${list.join(', ')}</b>${list.length>1?' 시간이 겹쳐':U.josa(list[0],'이','가')} 열려 있습니다.`:`${v}는 닫혀 있습니다.`;
  U.result(el,hoursChart(now),`${hhmm(now)} · ${say('KRX',k)} ${say('NXT',n)}<br>${!k.length&&!n.length?'그림의 거래 시간은 모두 닫혀 있습니다. 이때 낸 주문은 다음 거래 시간까지 기다립니다. 종가로만 체결하는 시간외 종가·종가매매의 주문 접수 구간은 그림에서 뺐습니다.':'시간대마다 가격을 정하는 방식(접속매매·단일가·종가)과 거래할 수 있는 종목이 다릅니다.'}${k.includes('애프터마켓')?'<br>KRX 애프터마켓은 2026년 9월 14일에 시작했습니다. 그날의 가격제한폭 안에서 접속매매로 체결하고 VI도 적용되지만, ETF·ETN과 투자경고·위험 종목 등은 거래할 수 없고 지정가와 최유리·최우선 지정가 주문만 받습니다.':''}${U.kind('real','2026-10-12에 확인한 거래 시간표를 그대로 그렸습니다(조사 노트).')}`);
 });
};
/* 12장 시나리오 메시지와 점검 항목. flag가 참이면 위험 신호다. 이 책이 지어낸 메시지다. */
const SCAM=[
 ['s1','“다음 주 300% 급등 확정”',true,'수익을 보장하거나 확정하는 말은 위험 신호입니다. 정상적인 투자 권유에서는 수익을 약속할 수 없습니다.'],
 ['s2','VIP 리딩방 가입비 99만 원',true,'돈을 받고 1:1로 종목을 찍어 주는 곳이 투자자문업 등록을 했는지 확인해야 합니다. 미등록 영업은 불법입니다.'],
 ['s3','“세력이 이미 물량을 모았다는 내부 정보”',true,'미공개 정보를 쓰거나 퍼뜨리는 것은 불법이고, 대개는 지어낸 말입니다.'],
 ['s4','개인 메신저로 보낸 다른 앱 설치 링크',true,'공식 앱 장터가 아닌 설치 파일은 가짜 거래 앱이나 악성 앱일 수 있습니다.'],
 ['s5','“오늘 밤까지만 자리 남음”',true,'생각할 시간을 빼앗아 서두르게 하는 것은 흔한 압박 수법입니다.'],
 ['s6','종목 이름과 시장(코스닥)이 적혀 있음',false,'종목 이름이 적혀 있다는 것만으로는 위험 신호도 안전 신호도 아닙니다.'],
 ['s7','“투자 판단과 책임은 본인에게”라는 문구',false,'정상적인 자료에도 들어가는 문구입니다. 다만 이 문구가 있다고 안전하다는 뜻도 아닙니다.'],
 ['s8','“금융위원회 등록 업체”라는 주장',false,'주장 자체는 위험 신호가 아니지만, 금융감독원 파인(fine.fss.or.kr)의 제도권 금융회사 조회로 직접 확인해야 합니다.']
];
MLabs.scam=el=>{
 const msg='<blockquote class="scam-msg"><b>[새벽전자 긴급]</b> 다음 주 300% 급등 확정! 세력이 이미 물량을 모았다는 내부 정보입니다. VIP 리딩방(가입비 99만 원)은 오늘 밤까지만 자리 남음. 금융위원회 등록 업체이며 투자 판단과 책임은 본인에게 있습니다. 아래 링크로 전용 앱을 설치하세요. 종목: 새벽전자(코스닥)</blockquote>';
 U.setup(el,`<p class="caption">수상한 부분을 모두 골라 보세요.</p>${SCAM.map(([id,label])=>U.check(id,label)).join('')}`);
 U.bind(el,()=>{
  const on=SCAM.map(s=>el.querySelector('#'+s[0]).checked),found=SCAM.filter((s,i)=>s[2]&&on[i]).length,wrong=SCAM.filter((s,i)=>!s[2]&&on[i]).length,flags=SCAM.filter(s=>s[2]).length;
  const score=SCAM.filter((s,i)=>s[2]===on[i]).length,w=score/SCAM.length*400;
  const chart=msg+U.svg(`점수 ${score}점 / ${SCAM.length}점`,`<text x="20" y="30">맞게 판단한 항목 ${score} / ${SCAM.length}</text><rect x="20" y="44" width="400" height="22" rx="4" fill="var(--panel2)"/><rect x="20" y="44" width="${Math.max(w,1)}" height="22" rx="4" fill="var(--accent)"/>`,90);
  const notes=SCAM.filter((s,i)=>on[i]||s[2]).map((s,i)=>`<li>${s[2]?(on[SCAM.indexOf(s)]?'✓ 찾음':'○ 놓침'):'× 위험 신호 아님'} · ${esc(s[1])}: ${s[3]}</li>`).join('');
  const head=on.some(Boolean)?`위험 신호 ${flags}개 가운데 <b>${found}개</b>를 찾았고, 위험 신호가 아닌 것 <b>${wrong}개</b>를 골랐습니다.`:'아직 아무것도 고르지 않았습니다. 메시지를 읽고 수상한 부분을 체크해 보세요.';
  U.result(el,chart,`${head}<ul class="scam-notes">${on.some(Boolean)?notes:''}</ul>${U.kind('scenario','이 책이 지어낸 메시지이며 실제 업체나 사건과 관계없습니다.')}`);
 });
};
function sheetChart(rows,kind){
 const lo=Math.min(...rows.map(r=>r.buy)),hi=Math.max(...rows.map(r=>r.sell)),x=p=>90+(p-lo)/Math.max(hi-lo,1)*360,rh=Math.min(30,230/rows.length);
 const body=rows.map((r,i)=>{const y=24+i*rh,st=!r.valid?'거부':r.profitable?'이익':'손해',mk=!r.valid?'×':r.profitable?'✓':'−';return `<text x="8" y="${y+rh/2+4}">${i+1}칸 ${mk} ${st}</text><path d="M${x(r.buy)} ${y+rh/2}H${x(r.sell)}" stroke="${!r.valid?'var(--orange)':r.profitable?'var(--accent)':'var(--blue)'}" stroke-width="${Math.max(4,rh-12)}" ${!r.valid?'stroke-dasharray="4 3"':''}/>`;}).join('');
 return U.svg(`격자 주문표 그림. ${rows.length}칸 가운데 이익 ${rows.filter(r=>r.profitable).length}칸.`,`<text x="90" y="14">${F(lo,0)}원</text><text x="450" y="14" text-anchor="end">${F(hi,0)}원</text>${body}`,Math.max(120,40+rows.length*rh));
}
MLabs.diagnose=el=>{
 U.setup(el,U.number('dstart','첫 칸 매수 가격 (원)',1000,600000,1,19970)+U.range('dstep','간격 (원)',5,200,5,30)+U.range('dcount','칸 수',1,12,1,6)+U.range('dqty','한 칸 수량 (주)',1,500,1,10)+U.range('dfee','수수료율 (%)',.0036,.5,.0001,.015)+U.select('dkind','종류',KINDS,'stock'));
 U.bind(el,()=>{
  const start=U.value(el,'dstart'),step=U.value(el,'dstep'),count=U.value(el,'dcount'),qty=U.value(el,'dqty'),fee=U.value(el,'dfee'),kind=el.querySelector('#dkind').value,tax=taxOf(kind);
  if(!Number.isInteger(start)||start<1000||start>600000)return U.result(el,'','<strong>가격을 확인해 주세요</strong> · 첫 칸 매수 가격은 1,000원에서 600,000원 사이의 정수여야 합니다.');
  const rows=M.gridSheet(start,step,count,qty,fee,tax,kind),bad=rows.filter(r=>!r.valid).length,win=rows.filter(r=>r.profitable).length,lose=count-bad-win;
  const sum=rows.filter(r=>r.valid).reduce((s,r)=>s+r.net,0),min=M.minGridStep(start,count,qty,fee,tax,kind);
  const tbl=U.table(['칸','매수','매도','상태','한 번 왕복 손익'],rows.map((r,i)=>[i+1,W(r.buy),W(r.sell),!r.valid?`× 거부: ${[!r.validBuy&&'매수',!r.validSell&&'매도'].filter(Boolean).join('·')} 가격이 눈금에 안 맞음`:r.profitable?'✓ 이익':'− 손해: 비용보다 좁음',r.valid?W(r.net):'—']));
  const fix=min?`이 시작가와 칸 수로 모든 칸이 이익이 되는 가장 좁은 간격은 <b>${W(min)}</b>입니다.`:'이 시작가로는 2,000원 안에서 모든 칸이 눈금에 맞고 이익이 되는 간격이 없습니다. 시작가를 경계의 큰 눈금(예: 20,000원)에 맞추는 것부터 생각해 보세요.';
  U.result(el,sheetChart(rows,kind)+tbl,`${count}칸 가운데 <b>이익 ${win}칸</b>, 손해 ${lose}칸, 거부 ${bad}칸입니다. 체결될 수 있는 칸이 한 번씩 왕복하면 합계 <b>${W(sum)}</b>입니다.<br>${fix}${U.kind('real','호가단위·수수료·거래세 규칙으로 계산했습니다. 모든 칸이 실제로 체결된다는 보장은 없습니다.')}`);
 });
};
})();
