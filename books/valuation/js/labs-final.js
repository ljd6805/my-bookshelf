/* 9장 주가에 담긴 가정 역산과 10장 마지막 과제(분석가 A·B 차이 나누기).
   계산은 VMath.implied(이분법)·impliedG·value·dcf·gapSteps·finalTask만 쓴다. 비교 회사 가·나·다·라와 분석가 A·B는 미리 정한 가상 시나리오다.
   10장의 기본 순서는 본문 순서(운전자본 → 영업이익률 → 성장률 → 할인율)이고, 비교 예제에도 "할인율 먼저"는 넣지 않는다(10장 L2). 독자가 직접 고르면 계산한다. */
(()=>{
'use strict';
const U=VUI,M=VMath,A=M.ASSUME,B=A.base,W=U.won,E=U.ek;
const KEY=[['growth','매출 성장률'],['r','할인율'],['margin','영업이익률'],['wcRatio','운전자본 비율'],['gT','영구성장률']],NAME=Object.fromEntries(KEY);
const VIEW={growth:[-0.05,0.15],r:[0.05,0.14],margin:[0.05,0.2],wcRatio:[0.1,0.6],gT:[-0.02,0.06]};
/* 고른 가정 하나만 바꾸며 DCF 주당 가치를 그린 곡선과 주가 선. 곡선과 선이 만나는 곳이 주가에 담긴 값이다. */
function curve(key,price,hit){
 const [a,b]=VIEW[key],pts=[];for(let i=0;i<=40;i++){const x=a+(b-a)*i/40;try{const v=M.value({[key]:x});if(v>0&&v<price*3)pts.push([x,v]);}catch(e){}}
 const L=70,R=460,T=24,Bt=210,ys=pts.map(p=>p[1]).concat(price),lo=Math.min(...ys)*0.9,hi=Math.max(...ys)*1.05,X=x=>L+(x-a)/(b-a)*(R-L),Y=v=>Bt-(v-lo)/((hi-lo)||1)*(Bt-T);
 let s=`<text x="10" y="16" class="series">${NAME[key]}만 바꾼 DCF 주당 가치 (원)</text><path d="M${L} ${Bt}H${R}" stroke="var(--muted)"/>`;
 U.niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${U.fmt(v)}</text>`;});
 U.niceTicks(a,b,4).forEach(x=>{s+=`<text x="${X(x).toFixed(1)}" y="${Bt+16}" text-anchor="middle" class="axis">${U.pct(x,0)}</text>`;});
 if(pts.length>1)s+=`<path d="M${pts.map(p=>`${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="var(--blue)" stroke-width="2.5"/>`;
 s+=`<path d="M${L} ${Y(price).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="5 3" stroke-width="2"/><text x="${R}" y="${(Y(price)-6).toFixed(1)}" text-anchor="end" class="mark-t">주가 ${U.fmt(price)}원</text>`;
 if(hit!==null&&hit>=a&&hit<=b)s+=`<circle cx="${X(hit).toFixed(1)}" cy="${Y(price).toFixed(1)}" r="6" fill="var(--accent)"/><text x="${X(hit).toFixed(1)}" y="${(Y(price)+22).toFixed(1)}" text-anchor="middle" class="price">▲ ${U.pct(hit,2)}</text>`;
 return U.svg(`${NAME[key]}만 바꿀 때 DCF 주당 가치 곡선과 주가 ${U.fmt(price)}원 선${hit!==null?`, 만나는 곳 ${U.pct(hit,2)}`:', 그린 범위 안에서 만나지 않음'}`,s,232);
}
function solve(price){return KEY.map(([k,n])=>{try{return {k,n,v:M.implied(k,price)};}catch(e){return {k,n,v:null};}});}
VLabs['implied-assumption']=el=>{
 U.setup(el,U.number('iprice','받아들일 주가 (원)',1000,200000,10,A.price,'새벽전자 2026년 4월 주가(가정)')+U.select('ikey','거꾸로 풀 가정 (나머지는 기준안)',KEY,'growth')+U.group('비교 회사 PER에 담긴 성장률 풀기 (가상의 회사)',U.select('ibasis','PER의 이익',[['trailing','후행 PER: 지난 한 해 이익'],['forward','선행 PER: 내년 이익']],'trailing')+U.number('iper','PER (배)',0.1,200,0.1,15)+U.number('ipay','배당성향 (%)',0,100,0.1,30)+U.number('ir','요구수익률 r (%)',0.1,50,0.1,A.peerR*100,'가정')+U.number('iroe','ROE (%)',-50,100,0.1,15,'지속 가능 성장률 b × ROE에 씀')),true);
 U.bind(el,()=>{
  const price=U.num(el,'iprice'),key=U.value(el,'ikey'),fwd=U.value(el,'ibasis')==='forward',per=U.num(el,'iper'),pay=U.num(el,'ipay'),r=U.num(el,'ir'),roe=U.num(el,'iroe');
  for(const [v,name,why] of [[price,'주가','1,000원에서 200,000원 사이로 넣어야 합니다.'],[per,'PER','0.1에서 200 사이의 배수를 넣어야 합니다.'],[pay,'배당성향','0%에서 100% 사이로 넣어야 합니다.'],[r,'요구수익률','0.1%에서 50% 사이로 넣어야 합니다.'],[roe,'ROE','−50%에서 100% 사이로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  const all=solve(price),me=all.find(x=>x.k===key),peers=M.peerTable().filter(p=>['가','라'].includes(p.name)).map(p=>({...p,g:M.impliedG(p.per,p.payout,A.peerR)}));
  let cg,cgText;try{cg=M.impliedG(per,pay/100,r/100,fwd?'forward':'trailing');cgText=`${fwd?`g = ${U.pct(r/100)} − ${U.pct(pay/100)} ÷ ${U.sfmt(per,1)}`:`g = (${U.pct(r/100)} × ${U.sfmt(per,1)} − ${U.pct(pay/100)}) ÷ (${U.sfmt(per,1)} + ${U.pct(pay/100)})`} = <b>${U.pct(cg,2)}</b>`;}catch(e){cg=null;cgText=`✗ ${U.why(e)}`;}
  const t1=U.table(['가정','기준안',`주가 ${U.fmt(price)}원에 맞는 값`],all.map(x=>[`${x.k===key?'▲ ':''}${x.n}`,U.pct(B[x.k]),x.v===null?'✗ 범위 안에 해 없음':`<b>${U.pct(x.v,2)}</b>`]),'가정 하나만 바꿔 주가와 같아지는 값',true);
  const t2=U.table(['회사','PER','배당성향',`담긴 성장률`,'b × ROE'],[...peers.map(p=>[`비교 회사 ${p.name}`,`후행 ${U.times(p.per,1)}`,U.pct(p.payout,0),`${U.pct(p.g,2)} (r ${U.pct(A.peerR,0)})`,U.pct(p.retentionG)]),['직접 넣은 회사',`${fwd?'선행':'후행'} ${U.times(per,1)}`,U.pct(pay/100),cg===null?'✗':`${U.pct(cg,2)} (r ${U.pct(r/100)})`,U.pct((1-pay/100)*roe/100)]],'PER에 담긴 성장률과 지속 가능 성장률',true);
  const head=me.v===null?`주가 ${W(price)}에 맞는 ${NAME[key]}${U.josa(NAME[key],'은','는')} 정해 둔 범위 안에 없습니다(✗ 해 없음). 나머지 가정을 기준안으로 두면 이 가정 하나로는 주가를 설명할 수 없다는 뜻입니다.`:`주가 ${W(price)}을 받아들이고 나머지를 기준안으로 두면, DCF 주당 가치가 주가와 같아지는 ${NAME[key]}${U.josa(NAME[key],'은','는')} <b>${U.pct(me.v,2)}</b>(기준안 ${U.pct(B[key])})입니다.`;
  const others=all.filter(x=>x.k!==key).map(x=>`${x.n} ${x.v===null?'해 없음':U.pct(x.v,2)}`).join(', ');
  U.result(el,curve(key,price,me.v)+t1+t2,`${head}<br>다른 가정 하나만 바꾼다면: ${others}. 판정이 아니라 “이 주가가 맞으려면 필요한 가정”입니다.<br>${peers.map(p=>`비교 회사 ${p.name}(후행 PER ${U.times(p.per,1)}, 배당성향 ${U.pct(p.payout,0)}, r ${U.pct(A.peerR,0)})에 담긴 성장률 <b>${U.pct(p.g,2)}</b>, 지속 가능 성장률 ${U.pct(p.retentionG)}`).join('; ')}.<br>직접 넣은 회사(${fwd?'선행':'후행'} PER ${U.times(per,1)}): ${cgText}, b × ROE = ${U.pct((1-pay/100)*roe/100)}.<br>${U.ADVICE_NOTE}${U.kind(['real','scenario','academic','simple'],'정당화 PER 식은 고든 모형에서 나왔고, 이분법 범위와 선행 EPS 정의는 이 책의 단순화입니다.')}`);
 });
};
/* 마지막 과제: 가정·몫·확인 시점 표. 확인 날짜는 VMath.RULES(5권 조사 노트, 2026-10-13 확인)에서 읽는다. */
const R=M.RULES,STEP={wcRatio:['운전자본 비율','32.2% → 20%',`2026년 1분기 보고서(${R.q1}까지)·반기보고서(${R.half}까지)의 매출채권·재고`],margin:['영업이익률','11% → 13%',`같은 1분기(${R.q1})·반기(${R.half}) 보고서의 영업이익`],growth:['매출 성장률','3% → 8%',`2026 사업연도 사업보고서(${R.annual2026}까지)의 매출`],r:['할인율','9.0% → 8.0%','국고채 금리는 매일(2026-10-08 4.395%, 보도 기준), 위험 프리미엄은 추정 갱신 때']};
const NOTE_KEY='bookshelf:valuation:v1:final-notes';
function notes(el){
 const boxes=[0,1,2,3].map(i=>el.querySelector('#gnote'+i));
 try{const saved=JSON.parse(localStorage.getItem(NOTE_KEY)||'[]');if(Array.isArray(saved))boxes.forEach((b,i)=>{b.value=typeof saved[i]==='string'?saved[i]:'';});}catch(e){}
 boxes.forEach(b=>b.addEventListener('input',()=>{try{localStorage.setItem(NOTE_KEY,JSON.stringify(boxes.map(x=>x.value)));}catch(e){}}));
}
function analystTable(f){
 const d=M.dcf(),row=(n,a,b,c)=>[n,a,b,c],ps=x=>U.pct(x.a.growth,0);
 return U.table(['가정과 숫자','분석가 A','분석가 B','이 책 기준안'],[row('매출 성장률(2026~2030)',ps(f.A),ps(f.B),ps(d)),row('영업이익률',U.pct(f.A.a.margin,0),U.pct(f.B.a.margin,0),U.pct(d.a.margin,0)),row('운전자본 ÷ 매출',U.pct(f.A.a.wcRatio),U.pct(f.B.a.wcRatio),U.pct(d.a.wcRatio)),row('할인율',U.pct(f.A.a.r),U.pct(f.B.a.r),U.pct(d.a.r)),row('영구성장률',U.pct(f.A.a.gT,0),U.pct(f.B.a.gT,0),U.pct(d.a.gT,0)),row('5년 현재가치 합',E(f.A.pvSum),E(f.B.pvSum),E(d.pvSum)),row('영구가치의 현재가치',`${E(f.A.tvPv)} (${U.pct(f.A.tvShare)})`,`${E(f.B.tvPv)} (${U.pct(f.B.tvShare)})`,`${E(d.tvPv)} (${U.pct(d.tvShare)})`),row('주당 가치',`<b>${W(f.A.perShare)}</b>`,`<b>${W(f.B.perShare)}</b>`,W(d.perShare))],'두 분석가의 가정과 숫자 (평가 시점 2025-12-31)',true);
}
VLabs['analyst-gap']=el=>{
 const opts=Object.entries(STEP).map(([k,[n,c]])=>[k,`${n} ${c}`]);
 U.setup(el,`<p class="rate-banner"><b>${U.ADVICE_NOTE}</b><br>두 값은 같은 정의(2025년 말 기준 주당 가치, 평가 시점 2025-12-31, 명시 예측 2026~2030년, 순차입금 387.2억 원, 실적은 2025 사업연도까지)로 계산합니다. 보고서 기한은 2026-10-13 확인 기준이고, ${U.RATE_NOTE}</p>`+U.group('B에서 A로 가정을 바꾸는 순서',[1,2,3,4].map(i=>U.select('gs'+i,`${i}단계`,opts,A.gapOrder[i-1])).join(''))+U.range('gn','바꾼 가정 수 (막대)',0,4,1,4,'0이면 B 그대로, 4면 A에 닿음')+`<fieldset class="cards" data-free><legend>내 범위와 결론이 바뀌는 조건 적어 두기 (이 브라우저에만 남고 다른 사람에게 보이지 않음)</legend>${['내 범위: 이 가정 범위에서 약 ○원~○원','조건 1','조건 2','조건 3'].map((t,i)=>`<label class="control" for="gnote${i}"><span>${i?t:'내 범위'}</span><textarea id="gnote${i}" rows="2" placeholder="${i?'예: 1분기 보고서에서 매출채권이 ○○○억 원 아래로 줄면':t}"></textarea></label>`).join('')}</fieldset>`,true);
 notes(el);
 U.bind(el,()=>{
  const order=[1,2,3,4].map(i=>U.value(el,'gs'+i)),n=Number(U.value(el,'gn'));let g;
  try{g=M.gapSteps(order);}catch(e){return U.result(el,'',U.problem('바꾸는 순서',U.why(e)));}
  const f=M.finalTask(),shown=g.steps.slice(0,n),now=n?shown[n-1].value:g.start,sum=g.steps.reduce((t,s)=>t+s.delta,0),ok=Math.abs(sum-(g.end-g.start))<1e-6;
  const rows=g.steps.map((s,i)=>[`${i<n?'▲ ':''}${i+1}. ${STEP[s.key][0]}`,STEP[s.key][2],STEP[s.key][1],i<n?W(s.value):'아직 바꾸지 않음',i<n?`<b>${U.swon(s.delta)}</b>`:'']).concat([['합계',`A − B = ${W(g.end-g.start)} ${ok?'✓ 맞음':'✗ 어긋남'}`,'','',`<b>${U.swon(sum)}</b>`]]);
  const chart=U.waterfall({title:'B에서 A로 하나씩 (원)',start:['B',g.start],steps:shown.map(s=>[STEP[s.key][0].replace(' ','|'),s.delta]),end:[n===4?'A':`${n}단계 뒤`,now],fmt:v=>U.fmt(Math.round(v)),twoLine:true,h:280,vw:560,label:`B ${W(g.start)}에서 ${shown.map(s=>`${STEP[s.key][0]} ${U.swon(s.delta)}`).join(', ')} → ${W(now)}`});
  const path=shown.length?shown.map(s=>`${STEP[s.key][0]}을 바꾸면 ${W(s.value)}(${U.swon(s.delta)})`).join(' → '):'아직 바꾼 가정이 없습니다(B 그대로)';
  U.result(el,`<p class="caption narrow-note">좁은 화면에서는 계단 그림을 옆으로 밀어야 오른쪽 끝의 A ${W(f.A.perShare)}까지 보입니다. 같은 숫자는 아래 표와 결과 문장에도 있습니다.</p>`+chart+analystTable(f)+U.table(['바꾼 가정(고른 순서)','확인할 자료와 날짜','B → A','바꾼 뒤 주당 가치','몫'],rows,'가정·몫·확인 시점','task'),`분석가 A <b>${W(f.A.perShare)}</b>, B <b>${W(f.B.perShare)}</b>(A가 B의 ${U.sfmt(f.ratio,2)}배, 차이 <b>${W(f.diff)}</b>). 두 값은 같은 식으로 맞게 계산되었고, 차이는 넣은 가정에서 나옵니다.<br>B에서 출발해 ${path}. ${n===4?`네 몫의 합 <b>${U.swon(sum)}</b> = A − B ${ok?'✓ 맞음':'✗ 어긋남'}.`:`${4-n}단계가 남았습니다.`} 몫의 크기는 바꾸는 순서에 따라 달라집니다.<br>확인 시점: 운전자본·영업이익률은 1분기 보고서 <b>${R.q1}</b>·반기보고서 <b>${R.half}</b>까지, 매출 성장률은 2026 사업보고서 <b>${R.annual2026}</b>까지, 할인율의 국고채 금리는 날마다 바뀝니다(2026-10-08 4.395%, 보도 기준). 목표주가에는 보통 기간이 붙는다고 알려져 있지만 공식 자료로 확인하지 못해, 이 과제는 2025년 말 기준 현재가치를 견줍니다. 학습용 계산, 투자 권유 아님.${U.kind(['real','scenario','simple','official','guide','news','unknown'],'반기·분기 45일 기한은 회계법인 안내로만 확인했고, 목표주가의 기간 관행은 확인하지 못했습니다.')}`);
 });
};
})();
