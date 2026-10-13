/* 1~3장 실험: 누가 누구에게 내는 금리, 기준금리 사다리, 채권의 현금흐름. 계산은 모두 BMath(js/math.js)를 부른다. */
(()=>{
'use strict';
const U=BUI,M=BMath,F=U.fmt,P=U.pct,R=U.rate;
/* 1장: 세 거래의 방향(시각적 비유)과 기사 숫자 읽기, 피셔 관계. */
const TX={
 deposit:['예금','하린','물결은행','1,000만 원을 맡김','이자 연 3.5%',0.035,'물결은행은 가상의 은행, 3.5%는 1권 조사에 맞춘 가상 금리'],
 credit:['신용대출','물결은행','하린','돈을 빌려줌','이자 연 6.33%',0.0633,'6.33%는 2026년 8월 예금은행 일반신용대출 평균(실제 통계)'],
 treasury:['개인투자용 국채 10년','하린','나라','국채를 사며 돈을 빌려줌','이자 연 4.79%',0.0479,'2026년 10월분 10년물: 표면 4.510% + 가산 0.28%p, 세전']
};
function arrows(k){
 const [name,lender,borrower,now,interest]=TX[k];
 const box=(x,t)=>`<rect x="${x}" y="40" width="130" height="56" rx="8" fill="var(--panel2)" stroke="var(--accent)"/><text x="${x+65}" y="74" text-anchor="middle" class="series">${U.esc(t)}</text>`;
 return U.svg(`${name}: ${lender}${U.josa(lender,'이','가')} ${borrower}에게 돈을 빌려주고, ${borrower}${U.josa(borrower,'이','가')} ${lender}에게 이자를 냅니다`,`<defs><marker id="bo-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--text)"/></marker></defs><text x="20" y="20" class="series">${U.esc(name)} · 누가 누구에게 내나</text>${box(30,lender+' (빌려준 쪽)')}${box(320,borrower+' (빌린 쪽)')}<path d="M164 56H314" stroke="var(--text)" stroke-width="2" marker-end="url(#bo-ah)"/><text x="240" y="48" text-anchor="middle" class="axis">→ 지금: ${U.esc(now)}</text><path d="M316 84H166" stroke="var(--accent)" stroke-width="2.6" stroke-dasharray="6 4" marker-end="url(#bo-ah)"/><text x="240" y="108" text-anchor="middle" class="mark-t">← 해마다: ${U.esc(interest)}</text>`,124);
}
BLabs['who-pays']=el=>{
 U.setup(el,U.select('wtx','거래 고르기',[['deposit','예금 (하린 → 은행에 맡김)'],['credit','신용대출 (은행 → 하린에게 빌려줌)'],['treasury','국채 (하린 → 나라에 빌려줌)']],'treasury')+U.number('wtotal','기사에 실린 만기 총수익 (%)','',10000,0.01,59.7,'원금과 이자를 합쳐 늘어난 비율, 세전')+U.number('wyears','만기 (년)',1,30,1,10)+U.number('wnom','다시 보기 · 명목 금리 (%)','',100,0.1,3.5)+U.number('winf','다시 보기 · 물가 상승률 (%)','',100,0.1,2.9,'2026년 9월 소비자물가 1년 상승률 2.9%'));
 U.bind(el,()=>{
  const k=U.value(el,'wtx'),total=U.num(el,'wtotal'),n=U.num(el,'wyears'),nom=U.num(el,'wnom'),inf=U.num(el,'winf');
  if(total===null||total<=-100)return U.result(el,arrows(k),U.problem('총수익','−100%보다 큰 숫자여야 합니다(원금보다 많이 잃을 수는 없습니다).'));
  if(n===null||!Number.isInteger(n))return U.result(el,arrows(k),U.problem('만기','1에서 30 사이의 정수(년)를 넣어야 합니다.'));
  if(nom===null||inf===null||inf<=-100)return U.result(el,arrows(k),U.problem('명목 금리와 물가','숫자를 넣고, 물가 상승률은 −100%보다 커야 합니다.'));
  const t=total/100,avg=t/n,cagr=Math.pow(1+t,1/n)-1,tx=TX[k],tr=M.compoundValue(1,0.0479,10)-1,real=M.realRate(nom/100,inf/100),approx=M.realRateApprox(nom/100,inf/100);
  const chart=arrows(k)+U.columns({labels:['예금 (가상)',`${tx[0].slice(0,4)}`,'기사의 평균','연 복리'],values:[3.5,tx[5]*100,avg*100,cagr*100],fmt:v=>`${F(v,2)}%`,tick:v=>`${F(v,0)}%`,mark:i=>i===3,title:'연 몇 %로 읽을까 (▲ 해마다 복리로 붙는 금리)',label:`예금 3.5%, 기사의 평균 ${P(avg)}, 연 복리 ${R(cagr)}`,h:230});
  U.result(el,chart,`<b>${tx[0]}</b>: ${tx[1]}${U.josa(tx[1],'이','가')} 빌려준 쪽이라 ${tx[2]}${U.josa(tx[2],'이','가')} ${tx[1]}에게 <b>${tx[4]}</b>를 냅니다. ${tx[6]}.<br>기사 숫자 읽기: ${F(n)}년 총수익 <b>${F(total,2)}%</b>를 ${F(n)}${U.josa(F(n),'으로','로')} 나눈 단순 평균은 <b>${P(avg)}</b>(반올림하면 ${P(avg,1)})입니다. 해마다 복리로 붙는 금리로 바꾸면 (1 + ${F(t,4)})^(1/${F(n)}) − 1 = <b>${R(cagr)}</b>입니다. 예금 3.5%와 나란히 놓을 숫자는 이쪽입니다.<br>확인: 10년물 연 4.79%를 해마다 복리로 붙이면 1.0479¹⁰ − 1 = <b>${P(tr)}</b>로 보도의 59.7%와 맞습니다.<br>다시 보기(피셔 관계): 명목 ${F(nom,2)}%, 물가 ${F(inf,2)}%면 실질 = (1 + 명목) ÷ (1 + 물가) − 1 = <b>${R(real)}</b>, 어림식 명목 − 물가는 ${P(approx,1)}입니다.${U.kind(['real','metaphor'],'화살표 그림은 시각적 비유입니다. 개인투자용 국채 조건은 2026년 10월분 세전 값(확인 2026-10-12)입니다.')}`);
 });
};
/* 2장: 기준금리 사다리. 짧은 칸은 정해 둔 전달 속도(가상 시나리오), 긴 칸은 6장 놀이판 모형으로 계산한다. */
const TIMES=[['before','발표 전'],['day','발표 당일'],['m1','1개월 뒤'],['m3','3개월 뒤'],['m12','12개월 뒤']];
const SHORT=[['call','콜 (하루)',[0,1,1,1,1]],['cd','CD 91일',[0,.6,.9,1,1]],['cofix','COFIX',[0,0,.4,.8,1]],['deposit','예금',[0,.1,.5,.9,1]],['mortgage','주택담보대출',[0,0,.3,.7,1]],['credit','신용대출',[0,0,.3,.7,1]]];
function ladderSvg(rows){
 const lo=0.02,hi=0.07,X=v=>150+(v-lo)/(hi-lo)*310,h=34+rows.length*26;
 let s=`<text x="10" y="18" class="series">○ 출발  ● 고른 시점 · 금리 (%)</text>`;
 [2,3,4,5,6,7].forEach(v=>{s+=`<path d="M${X(v/100).toFixed(1)} 26V${h-6}" stroke="var(--line)" stroke-opacity=".5"/><text x="${X(v/100).toFixed(1)}" y="${h}" text-anchor="middle" class="axis">${v}%</text>`;});
 rows.forEach((r,i)=>{const y=40+i*26,a=X(r.start),b=X(r.now);
  s+=`<text x="140" y="${y+4}" text-anchor="end" class="axis">${U.esc(r.name)}</text><path d="M${Math.min(a,b).toFixed(1)} ${y}H${Math.max(a,b).toFixed(1)}" stroke="var(--orange)" stroke-width="3"/><circle cx="${a.toFixed(1)}" cy="${y}" r="5" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/><circle cx="${b.toFixed(1)}" cy="${y}" r="5" fill="${r.long?'var(--accent)':'var(--blue)'}"/>`;});
 return U.svg('기준금리 사다리. 칸마다 출발 값과 고른 시점의 값',s,h+8);
}
BLabs.ladder=el=>{
 U.setup(el,U.range('ldb','기준금리 변화 (%p)',-.5,.5,.25,0,'2026-08-27에는 +0.25%p')+U.range('lexp','발표 전 시장이 미리 반영한 변화 (%p)',-1,1,.25,0,'앞으로 1년의 기대 변화 합')+U.range('lafter','발표 뒤 남은 기대 변화 (%p)',-1,1,.25,0,'0이면 더 바뀔 것이 없다고 봄')+U.select('ltime','고른 시점',TIMES,'day'));
 U.bind(el,()=>{
  const db=+U.value(el,'ldb')/100,ex=+U.value(el,'lexp')/100,af=+U.value(el,'lafter')/100,ti=TIMES.findIndex(t=>t[0]===U.value(el,'ltime')),on=ti>0;
  const rows=[{name:'기준금리',start:0.03,now:0.03+(on?db:0),real:U.REAL.base}];
  SHORT.forEach(([key,name,pass])=>{const real=key==='call'?null:U.REAL[key],start=real?real[0]:0.03;rows.push({name,start,now:start+db*pass[ti],real});});
  const lng=[[3,'국고 3년','gov3'],[10,'국고 10년','gov10']].map(([T,name,key])=>{const b=U.curve(0.03,ex,T),a=on?U.curve(0.03+db,af,T):b;rows.push({name:name+' (모형)',start:b,now:a,real:U.REAL[key],long:true});return {T,name,b,a};});
  const tbl=U.table(['칸','확인한 실제 값','출발','고른 시점','변화'],rows.map(r=>[r.name,r.real?`${R(r.real[0])} <small>${r.real[2]}</small>`:'확인 안 함 · 기준금리로 둠',R(r.start),`<b>${R(r.now)}</b>`,U.pp(r.now-r.start)]),`기준금리 사다리 · ${TIMES[ti][1]}`);
  const [g3,g10]=lng,dir=(db<0&&g3.a-g3.b>0.00005)?' 기준금리는 내렸는데 3년 금리는 <b>올랐습니다</b>(▲). 시장이 미리 넣어 둔 변화보다 덜 움직였거나 남은 기대가 바뀌었기 때문입니다.':(db>0&&g3.a-g3.b<-0.00005)?' 기준금리는 올랐는데 3년 금리는 <b>내렸습니다</b>(▼).':'';
  U.result(el,ladderSvg(rows)+tbl,`고른 시점: <b>${TIMES[ti][1]}</b>. 기준금리 3.00% → <b>${R(0.03+(on?db:0),2)}</b>(${U.pp(on?db:0)}).<br>짧은 칸은 이 책이 정해 둔 가상의 속도로 따라옵니다: CD 91일 ${R(rows[2].start)} → <b>${R(rows[2].now)}</b>, 예금 ${R(rows[4].start)} → <b>${R(rows[4].now)}</b>, 신용대출 ${R(rows[6].start)} → ${R(rows[6].now)}.<br>6장 모형의 긴 금리는 발표 날 다시 매겨집니다: 국고 3년 발표 전 <b>${R(g3.b)}</b> → 발표 뒤 <b>${R(g3.a)}</b>(${U.pp(g3.a-g3.b)}), 국고 10년 ${R(g10.b)} → <b>${R(g10.a)}</b>(${U.pp(g10.a-g10.b)}).${dir} 실제 값 국고 3년 3.961%·10년 4.376%(2026-10-07)는 모형과 맞춘 것이 아닙니다.${U.kind(['scenario','model'],'짧은 칸의 전달 속도는 이 책이 정한 가상 값이고, 긴 칸은 6장 놀이판(초단기 차이 0.20%p, 기간 프리미엄 최대 1.5%p)으로 계산했습니다. 기준금리 3.00%는 2026-10-12 확인, 다음 결정은 2026-10-22입니다.')}`);
 });
};
/* 3장: 현금흐름표와 막대. 마지막 막대(액면 포함)는 위를 잘라 그린다. */
function flowSvg(cf,face){
 const n=cf.length,T=cf.at(-1).t,L=58,Rr=466,top=40,B=200,cmax=Math.max(1,...cf.slice(0,-1).map(x=>x.cf)),cap=Math.max(cmax*2.6,600),X=t=>L+t/T*(Rr-L-14),w=Math.max(2,Math.min(26,(Rr-L)/n*.6)),Y=v=>B-Math.min(v,cap)/cap*(B-top);
 let s=`<path d="M${L} ${B}H${Rr}" stroke="var(--line)"/><text x="${L}" y="16" class="series">받는 돈 (원) · 마지막 막대는 위를 잘라 그림 (≈)</text>`;
 U.niceTicks(0,cap,3).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${F(v)}</text>`;});
 cf.forEach((x,i)=>{const last=i===n-1,xx=X(x.t)-w/2;s+=`<rect x="${xx.toFixed(1)}" y="${Y(x.cf).toFixed(1)}" width="${w.toFixed(1)}" height="${(B-Y(x.cf)).toFixed(1)}" rx="1.5" fill="${last?'var(--accent)':'var(--blue)'}"/>`;
  if(last&&x.cf>cap)s+=`<path d="M${(xx-3).toFixed(1)} ${top+18}l${(w/2+3).toFixed(1)} -6l${(w/2+3).toFixed(1)} 6" stroke="var(--panel)" stroke-width="4" fill="none"/>`;});
 const lastX=X(T);s+=`<text x="${Math.min(lastX,Rr)}" y="${top-8}" text-anchor="end" class="mark-t">≈ ${F(cf.at(-1).cf,2)}원 (액면 ${F(face)} 포함)</text>`;
 [0,T/2,T].forEach(t=>{s+=`<text x="${X(t).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${F(t,t%1?1:0)}년</text>`;});
 return U.svg(`현금흐름 막대 ${n}개. 마지막 회 ${F(cf.at(-1).cf,2)}원`,s,230);
}
BLabs.cashflow=el=>{
 U.setup(el,U.select('ctype','채권 종류',[['coupon','이표채 (이자를 나눠 줌)'],['zero','할인채 (이자 없음)']],'coupon')+U.range('ccoupon','표면금리 c (%)',0,8,.125,3.875,'국고채는 0.125%의 배수')+U.number('cyears','만기 (년)',1,30,1,3)+U.select('cfreq','이자 주기',[['1','1년에 한 번'],['2','반년마다 (국고채)'],['4','석 달마다']],'2'));
 U.bind(el,()=>{
  const zero=U.value(el,'ctype')==='zero',c=zero?0:+U.value(el,'ccoupon')/100,yrs=U.num(el,'cyears'),f=+U.value(el,'cfreq');
  el.querySelector('#ccoupon').disabled=zero;
  if(yrs===null||!Number.isInteger(yrs))return U.result(el,'',U.problem('만기','1에서 30 사이의 정수(년)를 넣어야 합니다.'));
  const b={face:10000,couponRate:c,years:yrs,freq:f},cf=M.cashFlows(b),sum=cf.reduce((s,x)=>s+x.cf,0),cp=10000*c/f;
  const alt=[1,2,4].map(q=>M.cashFlows({face:10000,couponRate:c,years:yrs,freq:q}).reduce((s,x)=>s+x.cf,0)-10000);
  const rows=cf.filter(x=>x.cf>0).map(x=>[`${x.k}회`,`${F(x.t,2)}년`,`<b>${F(x.cf,2)}원</b>`]);
  const chart=flowSvg(cf,10000)+U.table(['회차','받는 때','받는 돈'],rows,`현금흐름표 · 액면 10,000원, 받는 칸 ${rows.length}개`);
  const text=zero?`할인채는 중간에 아무것도 주지 않고 <b>${F(yrs)}년 뒤 10,000원</b> 한 번만 줍니다. 받을 돈의 합은 <b>${F(sum,2)}원</b>이고, 그래서 처음에 10,000원보다 싸게 팔립니다.`
   :`이표 = 10,000 × ${F(c*100,3)}% ÷ ${f} = <b>${F(cp,2)}원</b>을 ${F(cf.length)}번 받고, 마지막 회에는 원금을 더해 <b>${F(cf.at(-1).cf,2)}원</b>을 받습니다. 모두 더하면 <b>${F(sum,2)}원</b>, 그 가운데 이자는 ${F(sum-10000,2)}원입니다.`;
  U.result(el,chart,`${text}<br>${zero?'할인채는 이자가 없어 이자 주기를 바꿔도 표가 달라지지 않습니다.':`같은 표면금리 ${F(c*100,3)}%로 이자 주기만 바꾸면 이자의 합은 1년에 한 번 ${F(alt[0],2)}원 · 반년마다 ${F(alt[1],2)}원 · 석 달마다 ${F(alt[2],2)}원으로 같고, 받는 때만 달라집니다.`}${c>0&&Math.abs(c/0.00125-Math.round(c/0.00125))>1e-6?' 이 표면금리는 0.125%의 배수가 아니라 국고채 관행과 다릅니다.':''}${U.kind('real','나라 3년·나라 10년·새벽전자 3년 회사채와 할인채는 가상의 채권이고, 세금은 빼지 않았습니다.')}`);
 });
};
})();
