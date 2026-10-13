/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 BMath(js/math.js)로 실제로 계산해 그린다.
   가상의 채권(나라 3년·나라 10년·새벽전자·할인채)과 6장 놀이판의 고정 가정은 tests/math.test.cjs와 같은 정의다. 움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. */
(function(root){
'use strict';
const M=root.BMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number((Number(n)+Math.sign(n)*1e-9).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const pc=(x,d=2)=>{const s=fx(x*100,d);return (Number((x*100+Math.sign(x)*1e-9).toFixed(d))>0?'+':'')+s+'%';};
const rt=(x,d=3)=>fx(x*100,d)+'%';
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${Math.max(h,1)}" rx="2" fill="${color}"/>`;
const N3={face:10000,couponRate:0.03875,years:3,freq:2},N10={face:10000,couponRate:0.045,years:10,freq:2},SB={face:10000,couponRate:0.05,years:3,freq:2};
const CURVE={spread0:0.002,horizon:1,tpMax:0.015,tpHalf:5},cy=(b,c,T,o={})=>M.yieldCurveModel(Object.assign({base:b,change:c},CURVE,o),[T])[0].yield;
const F={};
F.rate=()=>{
 const total=M.compoundValue(1,0.0479,10)-1,items=[['예금 (가상)',0.035],['기사의 평균',total/10],['연 복리 금리',0.0479]],Y=v=>210-v*100*26;
 let s=`<path d="M70 210H600" stroke="var(--line)"/>`;
 items.forEach(([n,v],i)=>{const x=110+i*170;s+=up(x,Y(v),90,210-Y(v),i===2?'var(--accent)':'var(--blue)',i*.25)+t(x+45,Y(v)-8,rt(v,2),{size:15,w:700})+t(x+45,232,n,{size:12});});
 s+=t(320,24,`10년 총수익 ${fx(total*100,2)}% ÷ 10 = ${fx(total*10,2)}% · 1.0479¹⁰ − 1 = ${fx(total*100,2)}%`,{size:13,w:700});
 return {svg:svg(`예금 3.5%, 기사의 평균 ${rt(total/10,2)}, 해마다 복리로 붙는 금리 4.79%를 견준 막대`,s,250),caption:`개인투자용 국채 10년물의 총수익 ${fx(total*100,2)}%를 10으로 나누면 ${rt(total/10,2)}, 반올림해 기사의 “평균 연 6.0%”가 됩니다. 해마다 복리로 붙는 금리는 4.79%이고, 예금 3.5%와 나란히 놓을 숫자는 이쪽입니다.`};
};
F.transmit=()=>{
 const rows=[['기준금리',0.03,'10-12'],['CD 91일',0.0324,'10-07'],['COFIX',0.0318,'8월'],['예금 평균',0.0314,'8월'],['국고 3년',0.03961,'10-07'],['국고 10년',0.04376,'10-07'],['신용대출',0.0633,'8월']],X=v=>170+(v-0.02)/0.05*420;
 let s=[2,3,4,5,6,7].map(v=>`<path d="M${X(v/100)} 22V226" stroke="var(--line)" stroke-opacity=".5"/>`+t(X(v/100),244,v+'%',{size:11,fill:'var(--muted)'})).join('');
 rows.forEach(([n,v,d],i)=>{const y=34+i*28;s+=t(160,y+5,`${n} (${d})`,{a:'end',size:12})+`<rect class="fig-grow" style="animation-delay:${i*.1}s" x="${X(0.02)}" y="${y-8}" width="${(X(v)-X(0.02)).toFixed(1)}" height="16" rx="2" fill="${i===0?'var(--accent)':i>=4&&i<=5?'var(--orange)':'var(--blue)'}"/>`+t(X(v)+6,y+5,rt(v,v>=0.06||i===2||i===3?2:3),{a:'start',size:12,w:700});});
 return {svg:svg('기준금리 3.00%와 짧은 금리, 국고채 금리, 대출 금리를 한 사다리에 놓은 그림',s,252),caption:'짧은 금리(CD 3.240%, COFIX 3.18%, 예금 3.14%)는 기준금리 3.00% 근처에 모여 있고, 국고 3년 3.961%와 10년 4.376%는 거의 1%p 위에 있습니다. 날짜가 다른 숫자라 차이는 대략으로만 읽습니다.'};
};
F.bond=()=>{
 const cf=M.cashFlows(N3),X=k=>90+k*80,Y=v=>200-Math.min(v,700)/700*150;
 let s=`<path d="M70 200H600" stroke="var(--line)"/>`;
 cf.forEach((x,i)=>{const last=i===cf.length-1;s+=up(X(x.k)-18,Y(x.cf),36,200-Y(x.cf),last?'var(--accent)':'var(--blue)',i*.15)+t(X(x.k),last?36:Y(x.cf)-8,last?`${fx(x.cf,2)}원 ≈`:`${fx(x.cf,2)}`,{size:12,w:700})+t(X(x.k),220,`${fx(x.t,1)}년`,{size:12,fill:'var(--muted)'});});
 s+=t(320,246,`모두 더하면 ${fx(cf.reduce((a,x)=>a+x.cf,0),2)}원 · 마지막 막대는 위를 잘라 그림`,{size:12,fill:'var(--muted)'});
 return {svg:svg('나라 3년의 현금흐름: 반년마다 193.75원 다섯 번과 3년째 10,193.75원',s,256),caption:`가상의 나라 3년(액면 10,000원, 연 3.875%, 반년마다 이자)은 반년마다 ${fx(cf[0].cf,2)}원을 다섯 번 주고, 3년째에 ${fx(cf[5].cf,2)}원을 줍니다. 모두 더하면 ${fx(cf.reduce((a,x)=>a+x.cf,0),2)}원입니다.`};
};
F.price=()=>{
 const pts=[];for(let i=0;i<=70;i++){const y=0.01+i/1000*.8*1.25;pts.push([y,M.priceFromYield(N3,y)]);}
 const X=y=>80+(y-0.01)/0.07*500,Y=p=>210-(p-9200)/1400*180;
 let s=`<path d="M80 30V210H590" stroke="var(--line)" fill="none"/><path d="M80 ${Y(10000)}H590" stroke="var(--muted)" stroke-dasharray="4 4"/>`+t(76,Y(10000)+4,'10,000원',{a:'end',size:11,fill:'var(--muted)'});
 s+=`<path class="fig-draw" d="${pts.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="var(--accent)" stroke-width="2.6"/>`;
 [[0.03,'할증'],[0.03875,'액면'],[0.03961,''],[0.05,'할인']].forEach(([y,n],i)=>{const p=M.priceFromYield(N3,y);s+=`<circle cx="${X(y).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="5" fill="var(--orange)"/>`;if(n)s+=t(X(y)+(i===1?-6:8),Y(p)+(i===1?-14:i===0?-10:18),`${rt(y,i===1?3:1)} ${fx(p,2)}원 · ${n}`,{a:i===1?'end':'start',size:12,w:700});});
 s+=t(320,240,'시장 금리 y (가로) · 나라 3년 가격 (세로)',{size:12,fill:'var(--muted)'});
 return {svg:svg('나라 3년의 가격과 시장 금리. 금리가 오르면 가격이 내린다',s,250),caption:`시장 금리 3.0%면 나라 3년은 ${fx(M.priceFromYield(N3,0.03),2)}원(할증), 표면금리와 같은 3.875%면 10,000원(액면), 3.961%면 ${fx(M.priceFromYield(N3,0.03961),2)}원, 5.0%면 ${fx(M.priceFromYield(N3,0.05),2)}원(할인)입니다.`};
};
F.duration=()=>{
 const y=0.04376,cf=M.cashFlows(N10),q=1+y/2,pv=cf.map(x=>x.cf/Math.pow(q,x.k)),D=M.macaulayDuration(N10,y),X=v=>70+v/10*520,mx=Math.max(...pv);
 let s=`<path d="M60 190H600" stroke="var(--text)" stroke-width="3"/>`;
 cf.forEach((x,i)=>{const hh=Math.max(2,pv[i]/mx*140);s+=up(X(x.t)-6,190-hh,12,hh,i===cf.length-1?'var(--accent)':'var(--blue)',i*.03);});
 s+=`<path d="M${X(D)} 192l14 22h-28z" fill="var(--orange)"/>`+t(X(D),232,`무게중심 D = ${fx(D,2)}년`,{size:13,w:700,fill:'var(--orange)'})+t(X(10),40,`${fx(pv.at(-1),0)}원`,{a:'end',size:12})+t(70,24,`나라 10년 (4.376%) · 칸마다 오늘의 값`,{a:'start',size:13,w:700});
 return {svg:svg(`나라 10년 현금흐름의 오늘 값을 막대로 세운 시소. 받침점 ${fx(D,2)}년`,s,250),caption:`나라 10년의 현금흐름을 4.376%로 할인한 오늘의 값을 시간축에 막대로 세우면 받침점은 ${fx(D,2)}년에 옵니다. 이 무게중심이 매콜리 듀레이션이고, 수정 듀레이션 ${fx(M.modifiedDuration(N10,y),2)}이면 금리 +1%p에 가격이 약 8% 내립니다(정확한 값 ${pc(M.priceChange(N10,y,0.01).exact)}).`};
};
F.curve=()=>{
 const T=Array.from({length:40},(_,i)=>(i+1)/4),X=v=>80+v/10*500,Y=v=>210-(v-0.03)/0.016*170,line=(c,k)=>T.map((m,i)=>`${i?'L':'M'}${X(m).toFixed(1)} ${Y(cy(0.03,c,m)).toFixed(1)}`).join('');
 let s=`<path d="M80 30V210H590" stroke="var(--line)" fill="none"/>`;
 [[0,'var(--text)','동결',''],[-0.005,'var(--accent)','두 번 인하',''],[0.0025,'var(--orange)','한 번 인상','6 4']].forEach(([c,col,n,d])=>{s+=`<path class="fig-draw" d="${line(c)}" fill="none" stroke="${col}" stroke-width="2.4"${d?` stroke-dasharray="${d}"`:''}/>`+t(586,Y(cy(0.03,c,10))+(c<0?14:c>0?-6:4),`${n} ${rt(cy(0.03,c,10))}`,{a:'end',size:12,fill:col,w:700});});
 [[1,0.03742],[2,0.03898],[3,0.03961],[5,0.04134],[10,0.04376]].forEach(([m,v])=>{s+=`<rect x="${X(m)-4}" y="${Y(v)-4}" width="8" height="8" fill="var(--muted)"/>`;});
 s+=[0.25,1,3,5,10].map(m=>t(X(m),228,m<1?'3개월':m+'년',{size:11,fill:'var(--muted)'})).join('')+t(90,24,'■ 2026-10-07 실제 금리 · 모형과 맞춘 것 아님',{a:'start',size:12,fill:'var(--muted)'});
 return {svg:svg('교육용 모형의 동결·두 번 인하·한 번 인상 곡선과 실제 국고채 금리 점',s,240),caption:`놀이판의 동결 곡선은 3년 ${rt(cy(0.03,0,3))}, 10년 ${rt(cy(0.03,0,10))}입니다. 시장이 두 번 인하를 기대하면 ${rt(cy(0.03,-0.005,3))}·${rt(cy(0.03,-0.005,10))}, 한 번 인상이면 ${rt(cy(0.03,0.0025,3))}·${rt(cy(0.03,0.0025,10))}로 곡선 전체가 움직입니다. 네모 점은 실제 금리이고 모형을 맞추지 않았습니다.`};
};
F.credit=()=>{
 const g=0.03961,X=v=>140+v/0.07*420,row=(y,n,parts,price)=>{let x=X(0),o=t(130,y+16,n,{a:'end',size:13});parts.forEach(([v,c],i)=>{o+=`<rect class="fig-grow" style="animation-delay:${i*.3}s" x="${x.toFixed(1)}" y="${y}" width="${(X(v)-X(0)).toFixed(1)}" height="24" fill="${c}"/>`;x+=X(v)-X(0);});return o+t(x+8,y+16,price,{a:'start',size:12,w:700});};
 let s=row(40,'나라 3년',[[g,'var(--blue)']],`${rt(g)} → ${fx(M.priceFromYield(N3,g),2)}원`)+row(90,'새벽전자 (s 1.10)',[[g,'var(--blue)'],[0.011,'var(--accent)']],`${rt(g+0.011)} → ${fx(M.spreadPrice(SB,g,0.011),2)}원`)+row(140,'새벽전자 (s 1.60)',[[g,'var(--blue)'],[0.016,'var(--orange)']],`${rt(g+0.016)} → ${fx(M.spreadPrice(SB,g,0.016),2)}원`);
 s+=t(320,210,`▇ 국고 3년 3.961% + ▇ 신용 스프레드 · p ≈ 1.10%p ÷ (1 − 40%) = ${fx(M.impliedDefault(0.011,0.4)*100,2)}%`,{size:12,fill:'var(--muted)'});
 return {svg:svg('국고 금리에 스프레드를 얹은 새벽전자 회사채 금리와 값',s,230),caption:`국고 3년 3.961%에 스프레드 1.10%p를 얹은 5.061%로 할인하면 새벽전자 회사채는 ${fx(M.spreadPrice(SB,g,0.011),2)}원, 스프레드가 1.60%p로 벌어지면 ${fx(M.spreadPrice(SB,g,0.016),2)}원(${pc(M.spreadPrice(SB,g,0.016)/M.spreadPrice(SB,g,0.011)-1)})입니다.`};
};
F.equity=()=>{
 const X=r=>80+(r-0.04)/0.08*500,Y=v=>210-v/120*180,curve=g=>{let d='';for(let r=Math.max(0.04,g+0.017);r<=0.12001;r+=0.001)d+=`${d?'L':'M'}${X(r).toFixed(1)} ${Y(M.gordonValue(2,r,g)).toFixed(1)}`;return d;};
 let s=`<path d="M80 30V210H590" stroke="var(--line)" fill="none"/><path class="fig-draw" d="${curve(0.03)}" fill="none" stroke="var(--accent)" stroke-width="2.6"/><path class="fig-draw" d="${curve(0.025)}" fill="none" stroke="var(--orange)" stroke-width="2" stroke-dasharray="6 4"/>`;
 [[0.08,0.03,'r 8% · 40'],[0.07,0.03,'r 7% · 50'],[0.07,0.025,'g도 2.5% · 44.44']].forEach(([r,g,n],i)=>{const v=M.gordonValue(2,r,g);s+=`<circle cx="${X(r).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="5" fill="var(--orange)"/>`+t(X(r)+8,Y(v)+(i===2?16:-8),n,{a:'start',size:12,w:700});});
 s+=[4,6,8,10,12].map(r=>t(X(r/100),228,r+'%',{size:11,fill:'var(--muted)'})).join('')+t(90,24,'━ g 3%  ┅ g 2.5% · 값 = 2 ÷ (r − g)',{a:'start',size:12,fill:'var(--muted)'});
 return {svg:svg('고든 모형의 값과 할인율. 할인율이 내리면 값이 크게 오른다',s,240),caption:`배당 2, 성장률 3%에서 할인율 8%면 값은 ${fx(M.gordonValue(2,0.08,0.03),0)}, 7%면 ${fx(M.gordonValue(2,0.07,0.03),0)}으로 ${pc(M.gordonChange(2,0.08,0.03,-0.01).change,0)} 오릅니다. 성장률도 2.5%로 내리면 ${fx(M.gordonValue(2,0.07,0.025),2)}(${pc(M.gordonChange(2,0.08,0.03,-0.01,-0.005).change,1)})에 그칩니다. 할인율 민감도 1 ÷ (r − g)는 ${fx(M.gordonDuration(0.08,0.03),0)}입니다.`};
};
F.holding=()=>{
 const h=dy=>M.holdingReturn(N3,0.03961,0.03961+dy,1),items=[['+1%p',h(0.01)],['그대로',h(0)],['−1%p',h(-0.01)]],Y=v=>200-(v-9600)/700*160;
 let s=`<path d="M70 200H600" stroke="var(--line)"/><path d="M70 ${Y(M.priceFromYield(N3,0.03961)).toFixed(1)}H600" stroke="var(--muted)" stroke-dasharray="4 4"/>`+t(596,Y(M.priceFromYield(N3,0.03961))-6,'산 값 9,975.90원',{a:'end',size:11,fill:'var(--muted)'});
 items.forEach(([n,r],i)=>{const x=120+i*150;s+=up(x,Y(r.price1),80,200-Y(r.price1),i===1?'var(--blue)':'var(--accent)',i*.2)+t(x+40,Y(r.price1)-8,`${fx(r.price1,2)}원`,{size:13,w:700})+t(x+40,218,`1년 뒤 금리 ${n}`,{size:12})+t(x+40,236,`1년 수익 ${pc(r.totalReturn)}`,{size:12,fill:'var(--muted)'});});
 return {svg:svg('1년 뒤 나라 3년을 판 값. 금리 +1%p, 그대로, −1%p',s,246),caption:`나라 3년을 9,975.90원에 사서 만기까지 들면 11,162.50원을 날짜대로 받습니다. 1년 뒤에 팔면 금리가 그대로일 때 ${fx(h(0).price1,2)}원(1년 수익 ${pc(h(0).totalReturn)}), +1%p면 ${fx(h(0.01).price1,2)}원(${pc(h(0.01).totalReturn)}), −1%p면 ${fx(h(-0.01).price1,2)}원(${pc(h(-0.01).totalReturn)})입니다.`};
};
F.final=()=>{
 const y1=(b,base,s0=0)=>M.holdingReturn(b,cy(0.03,-0.005,b.years)+s0,cy(base,0,b.years-1)+s0,1).totalReturn,names=['나라 3년','나라 10년','새벽전자'],bonds=[[N3,0],[N10,0],[SB,0.011]],bases=[0.025,0.0225,0.03],fill=['var(--accent)','var(--blue)','var(--orange)'],Y=v=>150-v*100*14;
 let s=`<path d="M70 150H600" stroke="var(--muted)"/>`;
 bonds.forEach(([b,s0],i)=>{bases.forEach((bs,j)=>{const v=y1(b,bs,s0),x=110+i*170+j*42;s+=`<rect class="fig-grow" style="animation-delay:${(i*3+j)*.08}s" x="${x}" y="${Math.min(Y(v),150).toFixed(1)}" width="34" height="${Math.abs(150-Y(v)).toFixed(1)}" fill="${fill[j]}"/>`+t(x+17,v>=0?Y(v)-6:Y(v)+14,pc(v,1),{size:11,w:700});});s+=t(110+i*170+59,232,names[i],{size:13});});
 s+=t(320,24,'1년 수익 · ▇ (가) 2.50%  ▇ (나) 2.25%  ▇ (다) 3.00%',{size:12,fill:'var(--muted)'});
 return {svg:svg('두 번 인하 곡선에서 산 세 채권의 1년 수익, 세 갈래',s,250),caption:`두 번 인하 곡선에서 산 나라 10년은 (가) 예고대로 내린 해에 가격 ${pc(M.holdingReturn(N10,cy(0.03,-0.005,10),cy(0.025,0,9),1).priceReturn)}, 1년 수익 ${pc(y1(N10,0.025))}입니다. (나)·(다)와의 차이는 ${pc(y1(N10,0.0225)-y1(N10,0.025))}p와 ${pc(y1(N10,0.03)-y1(N10,0.025))}p로, 기대에서 벗어난 몫입니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.BFigures={render};
})(typeof window!=='undefined'?window:this);
