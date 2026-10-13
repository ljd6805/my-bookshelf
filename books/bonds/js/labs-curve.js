/* 6장 대표 실험: 수익률 곡선 놀이판. BMath.yieldCurveModel(기대 이론 + 기간 프리미엄의 교육용 모형, 예측이 아님)으로
   3개월~10년 곡선을 그리고, 장단기 금리차(10년 − 3개월)를 정상·평평·역전으로 글로 적고, 동결 곡선 대비 채권 값의 변화와
   비교 기준 곡선에서 바뀐 폭을 보여 준다. 2026-10-07 실제 국고채 금리는 점으로만 찍고 모형을 맞추지 않는다. */
(()=>{
'use strict';
const U=BUI,M=BMath,F=U.fmt,PP=U.ppct,R=U.rate;
const MAT=[0.25,0.5,1,2,3,5,7,10],LINE=Array.from({length:40},(_,i)=>(i+1)/4),SHOW=[0.25,1,3,5,10];
const HOLD={base:3,chg:0,inf:2,tp:1.5,name:'동결 곡선'};
const FLAT=0.002;/* 이 책의 구분: |10년 − 3개월| < 0.20%p면 평평 */
const params=s=>Object.assign({},U.CURVE,{base:s.base/100,change:s.chg/100,inflationExp:s.inf/100,tpMax:s.tp/100});
const model=(s,T)=>M.yieldCurveModel(params(s),T);
const yAt=(s,T)=>model(s,[T])[0].yield;
const label=m=>m===0.25?'3개월':m===0.5?'6개월':`${m}년`;
function shape(sp){return sp>=FLAT?['정상','↗ 만기가 길수록 높음']:sp<=-FLAT?['역전','↘ 긴 금리가 짧은 금리보다 낮음']:['평평','→ 짧은 금리와 긴 금리가 거의 같음'];}
function curveChart(s,base,showBase){
 const cur=model(s,LINE),hold=model(HOLD,LINE),series=[{pts:[[0.25,yAt(s,0.25)*100],...cur.map(c=>[c.T,c.yield*100])],name:'지금 곡선',width:3},{pts:hold.map(c=>[c.T,c.yield*100]),name:'동결 곡선',dash:'6 4',color:'var(--muted)',width:1.8}];
 if(showBase)series.push({pts:model(base,LINE).map(c=>[c.T,c.yield*100]),name:`비교 기준`,color:'var(--orange)',dash:'2 3',width:2});
 const dots=U.POINTS.map(([T,y],i)=>({x:T,y:y*100,shape:'square',color:'var(--text)',label:i===4?'실제 10-07':'',left:true,dy:-10}));
 const s3=yAt(s,0.25),s10=yAt(s,10);dots.push({x:0.25,y:s3*100,label:`3개월 ${R(s3)}`,dy:16},{x:10,y:s10*100,label:`10년 ${R(s10)}`,left:true,dy:20});
 return U.xy({series,dots,xlim:[0,10],xticks:[0.25,1,2,3,5,7,10],xfmt:v=>v<1?'3개월':`${v}년`,yfmt:v=>`${F(v,1)}%`,xlab:'만기',legend2:'■ 2026-10-07 실제 국고채 금리(1·2·3·5·10년) · 모형과 맞춘 것 아님',h:300,label:`수익률 곡선. 3개월 ${R(s3)}, 10년 ${R(s10)}. 네모 점은 모형과 맞추지 않은 실제 금리`});
}
/* 만기마다 기대 평균(아래)과 기간 프리미엄(위)을 쌓은 막대. */
function stackChart(st){
 const rows=model(st,SHOW),all=rows.map(r=>r.yield).concat(rows.map(r=>r.expected)),hi=Math.max(...all,0.01)*1.15,lo=Math.min(0,...rows.map(r=>r.expected)),L=58,Rr=466,T=30,B=196,Y=v=>B-(v-lo)/(hi-lo)*(B-T),w=(Rr-L)/rows.length;
 let s=`<text x="${L}" y="16" class="series">▇ 기대하는 단기 금리의 평균 + ▨ 기간 프리미엄</text><path d="M${L} ${Y(0).toFixed(1)}H${Rr}" stroke="var(--muted)"/>`;
 U.niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${F(v*100,1)}%</text>`;});
 rows.forEach((r,i)=>{const x=L+i*w+w*.2,bw=w*.6;s+=`<rect x="${x.toFixed(1)}" y="${Math.min(Y(r.expected),Y(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(Y(0)-Y(r.expected)).toFixed(1)}" fill="var(--blue)"/><rect x="${x.toFixed(1)}" y="${Y(r.yield).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,Y(r.expected)-Y(r.yield)).toFixed(1)}" fill="var(--accent)" opacity=".75"/><text x="${(x+bw/2).toFixed(1)}" y="${(Y(r.yield)-5).toFixed(1)}" text-anchor="middle" class="axis">${F(r.yield*100,2)}</text><text x="${(x+bw/2).toFixed(1)}" y="${B+16}" text-anchor="middle" class="axis">${label(r.T)}</text>`;});
 return U.svg('만기마다 기대 평균과 기간 프리미엄을 쌓은 막대',s,214);
}
function bondMoves(s){
 return [['nara3',3],['nara10',10],['zero10',10]].map(([k,T])=>{const b=U.bond(k),y0=yAt(HOLD,T),y1=yAt(s,T),p0=M.priceFromYield(b,y0),p1=M.priceFromYield(b,y1);return {name:U.BONDS[k].name,y0,y1,p0,p1,ch:p1/p0-1};});
}
const same=(a,b)=>['base','chg','inf','tp'].every(k=>Math.abs(a[k]-b[k])<1e-9);
BLabs['curve-board']=el=>{
 U.setup(el,U.range('kbase','기준금리 b (%)',1,5,.25,3,'2026-10-12 확인 값 3.00%에서 출발')+U.range('kchg','앞으로 1년의 기대 경로 Δ (%p)',-2,1,.25,0,'인하 기대는 음수. 0.25%p씩 두 번 인하면 −0.50')+U.range('kinf','기대 물가 (%)',0,5,.25,2,'목표 2%보다 1%p 높으면 Δ에 +0.5%p를 더함 (가정)')+U.range('ktp','기간 프리미엄의 최댓값 (%p)',0,3,.25,1.5,'만기 5년에 절반, 길수록 이 값에 다가감 (가정)')+'<div class="buttons"><button type="button" data-pin>지금 곡선을 비교 기준으로</button></div>');
 let base={...HOLD};
 el.querySelector('[data-pin]').onclick=()=>{base={...read(),name:'고정한 곡선'};el.dispatchEvent(new Event('bo-refresh'));};
 el.addEventListener('bo-preset',e=>{base={...read(),name:e.detail};el.dispatchEvent(new Event('bo-refresh'));});
 const read=()=>({base:+U.value(el,'kbase'),chg:+U.value(el,'kchg'),inf:+U.value(el,'kinf'),tp:+U.value(el,'ktp')});
 U.bind(el,()=>{
  const s=read(),cur=model(s,MAT),y=T=>cur.find(c=>c.T===T).yield,sp=y(10)-y(0.25),[kind,arrow]=shape(sp),eff=cur[0].policyChange,showBase=!same(base,s)&&!same(base,HOLD);
  const mv=bondMoves(s),b3=yAt(base,3),b10=yAt(base,10);
  const t1=U.table(['만기','기대 평균','기간 프리미엄','모형 금리','동결 곡선과 차이'],cur.map(c=>[label(c.T),R(c.expected),U.pp(c.termPremium,3),`<b>${R(c.yield)}</b>`,U.pp(c.yield-yAt(HOLD,c.T),3)]),'만기별 모형 금리 · 교육용 모형, 예측이 아님');
  const t2=U.table(['채권','동결 곡선 금리','지금 곡선 금리','동결 곡선 값','지금 값','변화'],mv.map(m=>[m.name,R(m.y0),R(m.y1),`${F(m.p0,2)}원`,`${F(m.p1,2)}원`,`<b>${PP(m.ch)}</b>`]),'곡선 위 채권 값 · 동결 곡선과 견줌');
  const cmp=same(base,s)?`비교 기준(${base.name})과 같은 곡선입니다.`:`비교 기준(${base.name})에서 바뀐 폭: 3년 ${R(b3)} → <b>${R(y(3))}</b>(${U.pp(y(3)-b3,3)}), 10년 ${R(b10,4)} → <b>${R(y(10),4)}</b>(${U.pp(y(10)-b10,4)}).`;
  const real=U.POINTS.map(([T,v])=>`${T}년 ${R(v)}`).join(' · ');
  U.result(el,curveChart(s,base,showBase)+stackChart(s)+t1+t2,`<span class="kind-tag model-tag">교육용 모형, 예측이 아님</span><br>실제로 쓰는 기대 변화 = Δ ${U.pp(s.chg/100)} + 0.5 × (기대 물가 ${F(s.inf,2)}% − 2%) = <b>${U.pp(eff)}</b>. 모형 곡선: 3개월 <b>${R(y(0.25))}</b>, 1년 <b>${R(y(1))}</b>, 3년 <b>${R(y(3))}</b>, 10년 <b>${R(y(10))}</b>.<br>장단기 금리차(10년 − 3개월) <b>${U.pp(sp)}</b> → <b>${kind} 곡선</b> (${arrow}). ±0.20%p 안을 평평으로 적는 문턱은 이 책이 정한 약속입니다.<br>동결 곡선에서 이 곡선으로 바뀌면: ${mv.map(m=>`${m.name} ${PP(m.ch)}`).join(', ')}.<br>${cmp}<br>2026-10-07 실제 국고채 금리 ${real} (10년 − 3년 0.415%p)는 점으로만 찍었습니다. 모형과 맞춘 것이 아니므로, 비슷해 보여도 시장의 기대를 읽어 내는 증거로 쓰지 않습니다.${U.kind(['model','real'],'초단기 차이 0.20%p, 변화가 1년에 걸쳐 고르게 일어남, 기간 프리미엄이 절반에 이르는 만기 5년, 기대 물가 계수 0.5는 모두 교육용 가정입니다. 곡선 위 채권 값은 그 만기의 모형 금리로 실제 계산했습니다.')}`);
 });
};
})();
