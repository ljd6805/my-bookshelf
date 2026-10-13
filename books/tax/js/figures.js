/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 TMath(js/math.js)로 실제로 계산해 그린다. 세율은 TMath.RATES에서만 읽는다.
   가상 상품(새벽전자·누리200·누리 해외100·먼바다500·나라 3년)과 기준 사례(1,000만 원, 3년, 연 4% + 2%)는 tests/math.test.cjs와 같은 정의다.
   움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. 색 말고도 막대마다 금액 글자와 이름표를 붙인다. */
(function(root){
'use strict';
const M=root.TMath||(typeof require==='function'?require('./math.js'):null);
const fx=n=>{const r=Math.round(Number(n));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US');};
const W=n=>fx(n)+'원';
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,1).toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"/>`;
const box=(x,y,w,h,stroke='var(--line)')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--panel2)" stroke="${stroke}"/>`;
const base=()=>M.roundFlows(M.flows(M.BASE.principal,M.BASE.years,M.BASE.growth,M.BASE.payout));
/* 막대 묶음: items=[[이름, 값, 강조]], 바닥 210, 위쪽 여백은 최댓값 기준. */
function bars(items,{x0=70,gap=140,bw=86,top=50,bottom=210,max}={}){
 const hi=max||Math.max(...items.map(i=>i[1]),1),Y=v=>bottom-v/hi*(bottom-top);let s=`<path d="M${x0-20} ${bottom}H${x0+gap*items.length}" stroke="var(--line)"/>`;
 items.forEach(([n,v,on],i)=>{const x=x0+i*gap;s+=up(x,Y(v),bw,bottom-Y(v),on?'var(--accent)':'var(--blue)',i*.2)+t(x+bw/2,Y(v)-8,(on?'▲ ':'')+W(v),{size:13,w:700})+t(x+bw/2,bottom+20,n,{size:12});});
 if(items.some(i=>i[2]))s+=t(620,247,'▲ 이 장에서 볼 칸',{a:'end',size:11,fill:'var(--muted)'});
 return s;
}
const F={};
F.map=()=>{
 const f=base(),div=200000,w=M.withholding(div),sell=M.stt('kospi',f.value),ev=[['산다','세금 없음','수수료만(4권)'],['받는다',`배당 ${W(div)}`,`−${W(w.tax)} → ${W(w.net)}`],['판다',`거래세 −${W(sell.each)}`,'양도세 0원(소액주주)'],['해가 바뀐다','이자·배당 2,000만 원 이하','더 낼 세금 0원']];
 let s=`<path class="fig-draw" d="M40 70H600" stroke="var(--muted)" stroke-width="2"/>`;
 ev.forEach(([a,b,c],i)=>{const x=40+i*150;s+=`<circle cx="${x+60}" cy="70" r="7" fill="${i===1||i===2?'var(--accent)':'var(--panel2)'}" stroke="var(--accent)" stroke-width="2"/>`+box(x,96,120,104,i===1||i===2?'var(--accent)':'var(--line)')+t(x+60,46,`${i+1}. ${a}`,{size:14,w:700})+t(x+60,128,b,{size:11.5})+t(x+60,160,c,{size:11.5,w:700})+t(x+60,186,i===1||i===2?'증권사가 뗌':'뗄 세금 없음',{size:11,fill:'var(--muted)'});});
 return {svg:svg(`새벽전자 거래의 네 사건: 받을 때 ${W(w.tax)}, 팔 때 ${W(sell.each)}이 빠지고 산 때와 해가 바뀐 때는 세금 없음`,s,230),caption:`새벽전자 1,000만 원어치를 산 날에는 세금이 없고, 배당 ${W(div)}을 받을 때 ${W(w.tax)}이 빠져 ${W(w.net)}이 들어옵니다. ${W(f.value)}에 팔 때는 거래세 ${W(sell.each)}이 빠지고, 차익 ${W(f.gain)}에는 소액주주 양도세가 없습니다. 두 번 모두 증권사가 먼저 뗍니다.`};
};
F.trade=()=>{
 const amt=10000000,k=M.stt('kospi',amt),q=M.stt('kosdaq',amt),n=M.stt('konex',amt),e=M.stt('etf',amt),hi=k.each,Y=v=>210-v/hi*150;
 let s=bars([['코스닥',q.each],['코넥스',n.each],['국내 상장 ETF',e.each]],{x0:210,gap:140,max:hi});
 s+=up(70,Y(k.each),86,Y(k.tax)-Y(k.each),'var(--orange)')+up(70,Y(k.tax),86,210-Y(k.tax),'var(--accent)',.1)+t(113,Y(k.each)-8,W(k.each),{size:13,w:700})+t(113,Y(k.tax)-6,`거래세 ${W(k.tax)}`,{size:11})+t(113,(Y(k.each)+Y(k.tax))/2+4,`농특세 ${W(k.rural)}`,{size:11})+t(113,230,'코스피',{size:12});
 s+=t(320,24,`1,000만 원어치를 한 번 팔 때 · 코스피 1,000만 원을 1년에 24번 팔면 ${W(k.each*24)}`,{size:13,w:700});
 return {svg:svg(`1,000만 원 매도의 거래세: 코스피 ${W(k.each)}, 코스닥 ${W(q.each)}, 코넥스 ${W(n.each)}, ETF ${W(e.each)}`,s,250),caption:`1,000만 원어치를 팔면 코스피는 거래세 ${W(k.tax)}과 농어촌특별세 ${W(k.rural)}을 더한 ${W(k.each)}, 코스닥은 ${W(q.each)}, 코넥스는 ${W(n.each)}, 국내 상장 ETF는 ${W(e.each)}입니다. 세금은 차익이 아니라 매도 금액에 붙으므로, 같은 1,000만 원을 1년에 24번 팔면 손익이 0이어도 ${W(k.each*24)}이 쌓입니다(${M.CHECKED} 보도 기준).`};
};
F.dividend=()=>{
 const a=200000,w=M.withholding(a),Y=v=>210-v/a*160,steps=[['세전 배당',a,0,'var(--blue)'],['소득세 14%',w.income,a-w.income,'var(--orange)'],['지방소득세',w.local,w.net,'var(--orange)'],['입금',w.net,0,'var(--accent)']];
 let s=`<path d="M50 210H600" stroke="var(--line)"/>`;
 steps.forEach(([n,v,lo,c],i)=>{const x=70+i*135;s+=up(x,Y(lo+v),86,Y(lo)-Y(lo+v),c,i*.2)+t(x+43,Y(lo+v)-8,(i===1||i===2?'−':'')+W(v),{size:13,w:700})+t(x+43,232,n,{size:12});});
 return {svg:svg(`배당 ${W(a)}에서 소득세 ${W(w.income)}와 지방소득세 ${W(w.local)}가 빠져 ${W(w.net)}이 들어오는 계단`,s,250),caption:`배당 ${W(a)}에서 소득세 ${W(w.income)}과 지방소득세 ${W(w.local)}이 빠져 ${W(w.net)}이 통장에 들어옵니다. 증권사가 들어오기 전에 떼므로 하린이 따로 신고하지 않으며, 한 해 이자·배당 합계가 2,000만 원 이하면 세금은 여기서 끝납니다.`};
};
F.gains=()=>{
 const f=base(),big=M.domesticGainTax(f.gain,true),small=M.domesticGainTax(f.gain,false),fg=M.foreignGainTax(10000000);
 let s=bars([['새벽전자 · 소액주주',small],['새벽전자 · 대주주',big],['먼바다500 · 차익 1,000만',fg.tax,true]],{x0:90,gap:170,bw:100,max:fg.tax});
 s+=t(320,24,'차익에 붙는 양도세 · 누가 내나',{size:13,w:700});
 return {svg:svg(`양도세: 소액주주 ${W(small)}, 대주주 ${W(big)}, 먼바다500 ${W(fg.tax)}`,s,250),caption:`새벽전자 차익 ${W(f.gain)}에 소액주주는 양도세 ${W(small)}이고, 대주주라면 22%를 적용해 ${W(big)}입니다. 해외 상장 먼바다500의 차익 1,000만 원은 250만 원을 뺀 ${W(fg.base)}에 22%를 매겨 ${W(fg.tax)}이고, 증권사가 떼지 않아 본인이 신고합니다(신고 시기는 확인 못함).`};
};
F.threshold=()=>{
 const total=21000000,r=M.extraTax(total,0.24),line=M.RATES.threshold,X=v=>60+v/25000000*520;
 let s=`<rect class="fig-grow" x="60" y="80" width="${(X(line)-60).toFixed(1)}" height="54" rx="4" fill="var(--blue)"/><rect class="fig-grow" style="animation-delay:.3s" x="${X(line).toFixed(1)}" y="80" width="${(X(total)-X(line)).toFixed(1)}" height="54" rx="4" fill="var(--orange)"/>`;
 s+=`<path d="M${X(line).toFixed(1)} 58V156" stroke="var(--text)" stroke-dasharray="4 3"/>`+t(X(line),50,'기준 2,000만 원',{size:12,w:700})+t((60+X(line))/2,112,'원천징수 15.4%로 끝남',{size:12,fill:'var(--bg)',w:700})+t(X(total)+8,112,`넘는 ${fx(r.over/10000)}만 원`,{size:12,a:'start'});
 s+=t(320,190,`넘는 몫 ${W(r.over)} × (24% − 14%) × 1.1 = ${W(r.extra)} 더 냄 (한계세율 24%는 가정)`,{size:13,w:700})+t(60,30,`한 해 이자·배당 ${fx(total/10000)}만 원`,{size:13,a:'start'});
 return {svg:svg(`이자·배당 2,100만 원 가운데 2,000만 원은 원천징수로 끝나고 넘는 ${W(r.over)}만 합쳐져 ${W(r.extra)}을 더 내는 막대`,s,210),caption:`한 해 이자·배당이 2,100만 원이면 2,000만 원까지는 원천징수 15.4%로 끝나고, 넘는 ${W(r.over)}만 다른 소득과 합쳐집니다. 한계세율을 24%로 가정하면 그 몫에 ${W(r.extra)}(11만 원)을 더 냅니다. 배당가산과 배당세액공제를 뺀 어림입니다.`};
};
F.etf=()=>{
 const f=base(),list=[['누리200','kequity'],['누리 해외100','kother'],['먼바다500','foreign'],['나라 3년','bond']].map(([n,k])=>[n,M.generalTax(k,f).after,k==='kother']),be=M.breakEvenGain(),Y=v=>210-v/f.pretax*160;
 let s=bars(list,{x0:60,gap:142,bw:90,max:f.pretax});
 s+=`<path d="M40 ${Y(f.pretax).toFixed(1)}H620" stroke="var(--orange)" stroke-dasharray="6 4"/>`+t(620,Y(f.pretax)-6,`┅ 세전 ${W(f.pretax)}`,{size:12,a:'end'});
 return {svg:svg(`기준 사례 세후 수익: ${list.map(x=>`${x[0]} ${W(x[1])}`).join(', ')}`,s,250),caption:`같은 세전 수익 ${W(f.pretax)}이 누리200·먼바다500·나라 3년에서는 ${W(list[0][1])}, 누리 해외100에서는 ${W(list[1][1])}으로 남습니다. 누리 해외100은 차익 ${W(f.gain)}에도 15.4%가 붙기 때문입니다. 두 해외 ETF의 차익 세금은 차익이 약 ${fx(Math.round(be/10000))}만 원일 때 같아집니다.`};
};
F.isa=()=>{
 const rows=[3,5].map(n=>{const f=M.roundFlows(M.flows(M.BASE.principal,n,M.BASE.growth,M.BASE.payout)),i=M.isaTax('kother',f),g=M.generalTax('kother',f);return {n,net:i.net,isa:i.tax,gen:g.total};});
 const items=[[`3년 · ISA`,rows[0].isa,true],[`3년 · 일반계좌`,rows[0].gen],[`5년 · ISA`,rows[1].isa,true],[`5년 · 일반계좌`,rows[1].gen]];
 let s=bars(items,{x0:60,gap:142,bw:90,max:rows[1].gen})+t(320,24,'누리 해외100 1,000만 원의 세금 · ISA 일반형(비과세 200만 원)과 일반계좌',{size:13,w:700});
 return {svg:svg(`세금: ${items.map(x=>`${x[0]} ${W(x[1])}`).join(', ')}`,s,250),caption:`누리 해외100 1,000만 원을 3년 들면 순이익 ${W(rows[0].net)}이 비과세 한도 200만 원 안이라 ISA 세금은 ${W(rows[0].isa)}이고, 일반계좌에서는 ${W(rows[0].gen)}입니다. 5년이면 순이익 ${W(rows[1].net)}에서 넘는 몫에만 9.9%가 붙어 ${W(rows[1].isa)}, 일반계좌는 ${W(rows[1].gen)}입니다.`};
};
F.pension=()=>{
 const f=base(),c=M.pensionCredit(M.BASE.principal,'saving','under'),a=M.pensionOutcome(f,'saving','under','annuity'),e=M.pensionOutcome(f,'saving','under','early'),g=M.generalTax('kother',f).after,pv=M.presentValue(1000000,0.03,10);
 let s=bars([['일반계좌',g],['연금저축 · 연금 수령',a.after,true],['연금저축 · 중도 인출',e.after]],{x0:90,gap:170,bw:100,max:a.after});
 s+=t(320,24,`넣을 때 공제 ${W(c.credit)} · 꺼낼 때 5.5% 또는 16.5%`,{size:13,w:700});
 return {svg:svg(`누리 해외100 기준 사례의 세후 수익: 일반계좌 ${W(g)}, 연금 수령 ${W(a.after)}, 중도 인출 ${W(e.after)}`,s,250),caption:`연금저축에 600만 원까지 넣으면 16.5% 구간에서 ${W(c.credit)}을 돌려받습니다. 누리 해외100 기준 사례를 55세 이후 연금으로 받으면 세후 ${W(a.after)}, 3년 뒤 중도 인출하면 ${W(e.after)}으로 일반계좌 ${W(g)}보다 적습니다. 10년 뒤 내는 세금 100만 원은 할인율 3%로 오늘 ${W(pv)}입니다.`};
};
F.order=()=>{
 const t9=M.afterTaxTable({...M.BASE,kind:'kother',band:'under'}),c=t9.cells,items=[['일반계좌',c.general.after],['ISA',c.isa.after],['연금 수령',c.annuity.after,true],['중도 인출',c.early.after]];
 let s=bars(items,{x0:60,gap:142,bw:90,max:c.annuity.after})+t(320,24,'누리 해외100 1,000만 원 · 3년 · 연 4% + 2% · 총급여 5,500만 원 이하',{size:13,w:700});
 return {svg:svg(`계좌별 세후 수익: ${items.map(x=>`${x[0]} ${W(x[1])}`).join(', ')}`,s,250),caption:`같은 누리 해외100 기준 사례가 일반계좌 ${W(c.general.after)}, ISA ${W(c.isa.after)}, 연금저축을 연금으로 받으면 ${W(c.annuity.after)}, 3년 뒤 중도 인출하면 ${W(c.early.after)}입니다. 연금 수령 칸은 55세 이후에 받는 금액이라 3년 뒤 손에 쥐는 금액이 아닙니다.`};
};
F.final=()=>{
 const o=['X','Y','Z'].map(k=>M.planOutcome(k)),e=['X','Y','Z'].map(k=>M.planOutcome(k,{need:10000000})),hi=Math.max(...o.map(x=>x.after)),Y=v=>210-v/hi*150;
 let s=`<path d="M50 210H600" stroke="var(--line)"/>`;
 o.forEach((p,i)=>{const x=80+i*180,q=e[i];s+=up(x,Y(p.after),64,210-Y(p.after),'var(--accent)',i*.2)+t(x+32,Y(p.after)-8,W(p.after),{size:12,w:700});
  s+=`<rect x="${x+72}" y="${Y(q.after).toFixed(1)}" width="64" height="${(210-Y(q.after)).toFixed(1)}" rx="2" fill="none" stroke="var(--orange)" stroke-dasharray="5 3" stroke-width="2"/>`+t(x+104,Y(q.after)-8,W(q.after),{size:12})+t(x+68,232,`배분안 ${p.key}`,{size:13,w:700});});
 s+=t(50,30,'━ 400만 원만 3년 뒤 꺼냄(연금 몫은 55세 이후)   ┅ 1,000만 원 전부 3년 뒤 꺼냄',{size:12,a:'start'});
 return {svg:svg(`세 배분안의 세후 금액: ${o.map(p=>`${p.key} ${W(p.after)}`).join(', ')}; 전부 3년 뒤 꺼내면 ${e.map(p=>`${p.key} ${W(p.after)}`).join(', ')}`,s,250),caption:`16.5% 구간에서 X ${W(o[0].after)}, Y ${W(o[1].after)}, Z ${W(o[2].after)}입니다(연금 몫은 55세 이후 연금으로 받아 5.5%를 낸다고 정산). 1,000만 원 전부를 3년 뒤 꺼내야 하면 연금 몫이 중도 인출이 되어 X ${W(e[0].after)}, Z ${W(e[2].after)}으로 Y ${W(e[1].after)}보다 적어집니다. 공제율이나 3년 뒤 꺼낼 금액이 바뀌면 순위도 바뀝니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.TFigures={render};
})(typeof window!=='undefined'?window:this);
