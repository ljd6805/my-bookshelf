/* 8장 대표 실험 · DCF 민감도 표. 계산은 VMath.value·sensitivity·tornado·perPoint·dcf·peerValues·rangeSentence만 쓴다.
   (a) 두 가정(가로축 하나 × 할인율)을 함께 바꾼 5 × 5 표(10원 반올림, g ≥ r 칸은 글자), (b) 가정 다섯 개를 하나씩 바꾼 폭 막대(순서는 고른 범위에 달림),
   (c) 1%p당 변화, (d) 영구가치 비중, (e) 배수 범위와 DCF 범위를 한 축에 놓은 "이 가정 범위에서 약 ○원~○원".
   운전자본 비율은 표의 축으로 두지 않는다(8장 L2를 미리 보이지 않도록). 좁은 화면에서는 표의 행마다 카드로 묶어 할인율 칸을 잃지 않는다. */
(()=>{
'use strict';
const U=VUI,M=VMath,B=M.ASSUME.base,W=U.won;
const AX={growth:['매출 성장률',0.02],margin:['영업이익률',0.01],gT:['영구성장률',0.005]};
const NAME={r:'할인율',margin:'영업이익률',wcRatio:'운전자본 비율',growth:'매출 성장률',gT:'영구성장률'};
const P=x=>U.pct(x,1);
function controls(){
 return U.select('saxis','표의 가로축',[['growth','매출 성장률 (2%p 간격)'],['margin','영업이익률 (1%p 간격)'],['gT','영구성장률 (0.5%p 간격)']],'growth','세로축은 할인율')+U.select('srstep','세로축 할인율 간격',[['0.005','0.5%p'],['0.01','1%p']],'0.005')
 +U.group('기준안: 표 가운데 칸과 막대의 출발점',U.number('sg','매출 성장률 (%)',-20,40,0.1,B.growth*100)+U.number('sm','영업이익률 (%)',-40,70,0.1,B.margin*100)+U.number('sw','운전자본 ÷ 매출 (%)',0,100,0.1,B.wcRatio*100)+U.number('sgt','영구성장률 (%)',-5,20,0.1,B.gT*100)+U.number('sr','할인율 (%)',2.5,45,0.1,B.r*100))
 +U.group('가정별 변화 폭 막대에서 바꿀 범위',U.number('srr','할인율 ± (%p)',0.1,2,0.1,1)+U.number('smr','영업이익률 ± (%p)',0.1,5,0.1,1)+U.number('sgr','매출 성장률 ± (%p)',0.1,5,0.1,2)+U.number('sgtr','영구성장률 ± (%p)',0.1,2,0.1,0.5)+U.number('swlo','운전자본 비율 낮은 쪽 (%)',0,100,0.1,18,'2024년 수준')+U.number('swhi','운전자본 비율 높은 쪽 (%)',0,100,0.1,32.2,'2025년 수준'));
}
const FIELDS=[['sg','매출 성장률','−20%에서 40% 사이로 넣어야 합니다.'],['sm','영업이익률','−40%에서 70% 사이로 넣어야 합니다.'],['sw','운전자본 비율','0%에서 100% 사이로 넣어야 합니다.'],['sgt','영구성장률','−5%에서 20% 사이로 넣어야 합니다.'],['sr','할인율','2.5%에서 45% 사이로 넣어야 합니다.'],['srr','할인율 범위','0.1%p에서 2%p 사이로 넣어야 합니다.'],['smr','영업이익률 범위','0.1%p에서 5%p 사이로 넣어야 합니다.'],['sgr','매출 성장률 범위','0.1%p에서 5%p 사이로 넣어야 합니다.'],['sgtr','영구성장률 범위','0.1%p에서 2%p 사이로 넣어야 합니다.'],['swlo','운전자본 비율 낮은 쪽','0%에서 100% 사이로 넣어야 합니다.'],['swhi','운전자본 비율 높은 쪽','0%에서 100% 사이로 넣어야 합니다.']];
function read(el){
 const v={};for(const [id,name,why] of FIELDS){const x=U.num(el,id);if(x===null)return {error:U.problem(name,why)};v[id]=x/100;}
 if(v.swlo>=v.swhi)return {error:U.problem('운전자본 비율 범위','낮은 쪽이 높은 쪽보다 작아야 합니다.')};
 return {...v,axis:U.value(el,'saxis'),rstep:Number(U.value(el,'srstep')),base:{growth:v.sg,margin:v.sm,wcRatio:v.sw,gT:v.sgt,r:v.sr}};
}
function grid(o){
 const [name,step]=AX[o.axis],cols=[-2,-1,0,1,2].map(k=>o.base[o.axis]+k*step),rows=[-2,-1,0,1,2].map(k=>o.base.r+k*o.rstep),t=M.sensitivity('r',rows,o.axis,cols,o.base);
 const body=rows.map((r,i)=>[`할인율 ${P(r)}`,...t[i].map((c,j)=>c.error?'✗ g ≥ r: 계산하지 않음':i===2&&j===2?`<b>▲ ${U.won10(c.value)}</b>`:U.won10(c.value))]);
 return {cols,rows,t,html:U.table([`할인율 \\ ${name}`,...cols.map(c=>`${name} ${P(c)}`)],body,`${name} × 할인율 (주당 가치, 원, 10원 반올림)`,'cards')};
}
function ranges(o){const b=o.base;return {r:[b.r+o.srr,b.r-o.srr],margin:[b.margin-o.smr,b.margin+o.smr],wcRatio:[o.swhi,o.swlo],growth:[b.growth-o.sgr,b.growth+o.sgr],gT:[b.gT-o.sgtr,b.gT+o.sgtr]};}
/* 가정별 변화 폭 막대: 기준안 세로선을 사이에 두고 낮은 값에서 높은 값까지. 위에서부터 폭이 큰 순서. */
function tornadoSvg(rows,mid){
 const L=150,R=470,G=56,T=30,h=T+rows.length*34+34,lo=Math.min(...rows.map(r=>r.low),mid),hi=Math.max(...rows.map(r=>r.high),mid),X=v=>L+G+(v-lo)/((hi-lo)||1)*(R-L-2*G);
 let s=`<text x="10" y="18" class="series">가정별 변화 폭 (원, 위에서부터 큰 순서)</text><path d="M${X(mid).toFixed(1)} ${T-4}V${h-26}" stroke="var(--muted)" stroke-dasharray="4 3"/><text x="${X(mid).toFixed(1)}" y="${h-10}" text-anchor="middle" class="axis">기준안 ${U.won(mid)}</text>`;
 rows.forEach((r,i)=>{const y=T+i*34;
  s+=`<text x="${L-8}" y="${y+12}" text-anchor="end" class="axis">${i+1}. ${NAME[r.key]}</text><text x="${L-8}" y="${y+27}" text-anchor="end" class="axis">${P(r.from)}↔${P(r.to)}</text>`;
  s+=`<rect x="${X(r.low).toFixed(1)}" y="${y+6}" width="${Math.max(2,X(r.high)-X(r.low)).toFixed(1)}" height="18" rx="2" fill="${i===0?'var(--accent)':'var(--blue)'}"/>`;
  s+=`<text x="${(X(r.low)-4).toFixed(1)}" y="${y+20}" text-anchor="end" class="price">${U.won(r.low)}</text><text x="${(X(r.high)+4).toFixed(1)}" y="${y+20}" text-anchor="start" class="price">${U.won(r.high)}</text>`;});
 return U.svg(`가정별 변화 폭: ${rows.map(r=>`${NAME[r.key]} ${U.won(r.low)}~${U.won(r.high)}`).join(', ')}`,s,h);
}
/* 한 축 그림: 배수 범위, DCF 범위, 주가 20,000원 선, 기준안 점. */
function rangeSvg(pv,lo,hi,mid,rs){
 const L=20,R=460,a=Math.min(pv.low,lo,M.ASSUME.price),b=Math.max(pv.high,hi,M.ASSUME.price),pad=(b-a)*.08,X=v=>L+(v-a+pad)/(b-a+2*pad)*(R-L),px=X(M.ASSUME.price).toFixed(1);
 let s=`<text x="10" y="18" class="series">배수 범위와 DCF 범위를 한 축에 (원)</text><path d="M${L} 120H${R}" stroke="var(--muted)"/>`;
 s+=`<rect x="${X(pv.low).toFixed(1)}" y="40" width="${(X(pv.high)-X(pv.low)).toFixed(1)}" height="22" rx="2" fill="var(--blue)"/><text x="${L}" y="36" class="axis">배수 세 가지 ${W(pv.low)}~${W(pv.high)}</text>`;
 s+=`<rect x="${X(lo).toFixed(1)}" y="84" width="${(X(hi)-X(lo)).toFixed(1)}" height="22" rx="2" fill="var(--accent)"/><text x="${L}" y="80" class="axis">DCF 하나씩 바꾼 범위 ${W(lo)}~${W(hi)}</text>`;
 s+=`<circle cx="${X(mid).toFixed(1)}" cy="95" r="5" fill="var(--text)"/><path d="M${px} 30V128" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 3"/><text x="${px}" y="146" text-anchor="middle" class="mark-t">주가 20,000원</text>`;
 s+=`<text x="${(L+R)/2}" y="170" text-anchor="middle" class="series">이 가정 범위에서 약 ${U.fmt(rs.low)}원~${U.fmt(rs.high)}원</text>`;
 return U.svg(`배수 범위 ${W(pv.low)}~${W(pv.high)}, DCF 범위 ${W(lo)}~${W(hi)}, 주가 20,000원. 이 가정 범위에서 약 ${U.fmt(rs.low)}원~${U.fmt(rs.high)}원`,s,182);
}
function perPoints(base){
 return ['r','margin','wcRatio','growth','gT'].map(k=>{const f=d=>{try{const v=M.value({...base,[k]:base[k]+d})-M.value(base);return U.swon(v);}catch(e){return /g ≥ r/.test(e.message)?'✗ g ≥ r':'✗ 범위 밖';}};return {k,up:f(0.01),down:f(-0.01)};});
}
function text(o,mid,tor,pp,share,rs,pv){
 const b=o.base,wcUp=o.swhi-b.wcRatio,wcDown=b.wcRatio-o.swlo;
 const one=tor.map(r=>`${NAME[r.key]} ${P(r.from)} ↔ ${P(r.to)}: ${W(r.valueAtFrom)} ↔ ${W(r.valueAtTo)}`).join(', ');
 const asym=Math.abs(wcUp-wcDown)>1e-9?`운전자본 범위는 기준 ${P(b.wcRatio)}에서 위로 ${U.sfmt(wcUp*100,1)}%p, 아래로 ${U.sfmt(wcDown*100,1)}%p라 대칭이 아닙니다.`:'운전자본 범위는 기준에서 위아래로 같은 폭입니다.';
 return `지금 가정(성장률 ${P(b.growth)}, 영업이익률 ${P(b.margin)}, 운전자본 비율 ${P(b.wcRatio)}, 영구성장률 ${P(b.gT)}, 할인율 ${P(b.r)})의 주당 가치 <b>${W(mid)}</b>, 영구가치 비중 <b>${P(share)}</b>.<br>한 번에 하나만 바꾸면 ${one}.<br>막대 순서: <b>${tor.map(r=>NAME[r.key]).join(' → ')}</b>. 이 순서는 고른 범위에 따라 달라집니다. ${asym}<br>1%p당 변화: ${pp.map(p=>`${NAME[p.k]} +1%p ${p.up}·−1%p ${p.down}`).join(', ')}.<br>배수 세 가지 ${W(pv.low)}~${W(pv.high)}과 DCF 범위를 한 축에 놓으면 <b>이 가정 범위에서 약 ${U.fmt(rs.low)}원~${U.fmt(rs.high)}원</b>입니다. 이 범위는 주가가 어디로 갈지에 대한 예측이 아니고, 가정을 바꿔 본 폭이라 신뢰구간도 아닙니다. ${U.ADVICE_NOTE}${U.kind(['real','scenario','simple'],'표의 칸은 10원 단위로 반올림했습니다.')}`;
}
VLabs['dcf-sensitivity']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.ADVICE_NOTE}</b></p>`+controls(),true);
 U.bind(el,()=>{
  const o=read(el);if(o.error)return U.result(el,'',o.error);
  try{
   const mid=M.value(o.base),g=grid(o),tor=M.tornado(ranges(o),o.base),pp=perPoints(o.base),d=M.dcf(o.base),pv=M.peerValues();
   const lo=Math.min(...tor.map(r=>r.low)),hi=Math.max(...tor.map(r=>r.high)),rs=M.rangeSentence(Math.min(lo,pv.low),Math.max(hi,pv.high));
   const ppt=U.table(['가정','+1%p','−1%p'],pp.map(p=>[NAME[p.k],p.up,p.down]),'1%p당 주당 가치 변화 (원)','compact');
   U.result(el,g.html+tornadoSvg(tor,mid)+ppt+rangeSvg(pv,lo,hi,mid,rs),text(o,mid,tor,pp,d.tvShare,rs,pv));
  }catch(e){U.result(el,'',U.problem(/g ≥ r/.test(e.message)?'영구성장률과 할인율':'기준안',U.why(e)));}
 });
};
})();
