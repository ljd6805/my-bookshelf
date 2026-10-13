/* 10장 마지막 과제: 금리 인하가 예고된 해. 출발 곡선(두 번 인하 또는 동결 대조)에서 다섯 상품에 200만 원씩 두었다고 놓고,
   1년 뒤 기준금리가 (가) 2.50% (나) 2.25% (다) 3.00%이고 남은 기대 변화가 0인 같은 모형 곡선으로 다시 값을 매긴다.
   tests/math.test.cjs의 yearOne과 같은 정의다(이표는 다시 굴리지 않음, 세금·비용 없음). 200만 원씩은 계산 편의이고 권유가 아니다. */
(()=>{
'use strict';
const U=BUI,M=BMath,F=U.fmt,PP=U.ppct,R=U.rate;
const BR={a:['(가)',0.025,'예고대로 두 번 인하 → 2.50%'],b:['(나)',0.0225,'세 번 인하 → 2.25%'],c:['(다)',0.03,'한 번도 내리지 않음 → 3.00%']};
const START={cut2:['두 번 인하 곡선',-0.005],hold:['동결 곡선 (대조)',0]};
const EACH=2000000,DEP=0.035,SPR=0.011;
/* 한 갈래의 다섯 상품. ds: 새벽전자 스프레드 변화, grow: 누리200 성장률이 할인율과 같은 폭으로 움직임. */
function year(start,br,grow,ds){
 const sc=START[start][1],b1=BR[br][1],out=[{name:'물결은행 예금 (연 3.5%)',buy:'2,000,000원',p1:'2,070,000원',cp:'이자 70,000원',ret:DEP}];
 [['nara3',0],['nara10',0],['saebyeok',SPR]].forEach(([k,s0])=>{const b=U.bond(k),y0=U.curve(0.03,sc,b.years)+s0,y1=U.curve(b1,0,b.years-1)+s0+(k==='saebyeok'?ds:0),h=M.holdingReturn(b,y0,y1,1);
  out.push({name:U.BONDS[k].name,y0,y1,buy:`${F(h.price0,2)}원 (${R(y0)})`,p1:`${F(h.price1,2)}원 (${R(y1)})`,cp:`${F(h.coupons,2)}원`,ret:h.totalReturn,pr:h.priceReturn});});
 const dr=b1-(0.03+sc),g1=grow?0.03+dr:0.03,d2=grow?2*(1+g1):2.06,v1=M.gordonValue(d2,0.08+dr,g1);
 out.push({name:'누리200 (고든 모형)',buy:'40.00 (r 8%, g 3%)',p1:`${F(v1,2)} (r ${F((0.08+dr)*100,2)}%, g ${F(g1*100,2)}%)`,cp:'배당 2',ret:(v1+2)/40-1});
 return out;
}
const total=rows=>rows.reduce((s,r)=>s+r.ret,0)/rows.length;
function groupChart(sets,pick){
 const names=['예금','나라 3년','나라 10년','새벽전자','누리200'],vals=sets.flatMap(s=>s.rows.map(r=>r.ret*100)),lo=Math.min(0,...vals)-1,hi=Math.max(...vals)+2,L=48,Rr=470,T=34,B=210,Y=v=>B-(v-lo)/(hi-lo)*(B-T),w=(Rr-L)/5,bw=w/4.2,fill=['var(--accent)','var(--blue)','var(--orange)'];
 let s=`<text x="${L}" y="16" class="series">1년 수익 (%) · 막대 순서 (가) (나) (다) · ▲ 고른 갈래</text><path d="M${L} ${Y(0).toFixed(1)}H${Rr}" stroke="var(--muted)"/>`;
 U.niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${F(v,0)}%</text>`;});
 names.forEach((n,i)=>{sets.forEach((set,j)=>{const v=set.rows[i].ret*100,x=L+i*w+w*.1+j*bw*1.1,y=Math.min(Y(v),Y(0)),hh=Math.max(1,Math.abs(Y(v)-Y(0)));s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" fill="${fill[j]}"${set.key===pick?' stroke="var(--text)" stroke-width="1.5"':''}/>`;if(set.key===pick)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=0?y-4:y+hh+12).toFixed(1)}" text-anchor="middle" class="axis">▲</text>`;});s+=`<text x="${(L+i*w+w/2).toFixed(1)}" y="${B+16}" text-anchor="middle" class="axis">${n}</text>`;});
 return U.svg(`상품별 1년 수익. ${sets.map(x=>`${BR[x.key][0]} 합 ${PP(total(x.rows))}`).join(', ')}`,s,228);
}
BLabs['final-table']=el=>{
 U.setup(el,U.select('fstart','산 날의 곡선',[['cut2','두 번 인하 곡선 (Δ −0.50%p)'],['hold','동결 곡선 (대조)']],'cut2')+U.select('fbranch','1년 뒤 갈래',Object.entries(BR).map(([k,v])=>[k,`${v[0]} ${v[2]}`]),'a')+U.check('fgrowth','누리200 성장률도 할인율과 같은 폭으로 움직임',false)+U.range('fspr','새벽전자 스프레드 변화 (%p)',-.5,1,.25,0,'출발 1.10%p에서'));
 U.bind(el,()=>{
  const st=U.value(el,'fstart'),br=U.value(el,'fbranch'),grow=U.checked(el,'fgrowth'),ds=+U.value(el,'fspr')/100;
  const rows=year(st,br,grow,ds),base=year(st,'a',false,0),sets=['a','b','c'].map(k=>({key:k,rows:year(st,k,grow,ds)}));
  const tbl=U.table(['상품','산 값','1년 뒤 값','받은 이자','1년 수익','(가)와의 차이','200만 원이 1년 뒤'],rows.map((r,i)=>[r.name,r.buy,r.p1,r.cp,`<b>${PP(r.ret)}</b>`,br==='a'&&!grow&&!ds?'—':U.pp(r.ret-base[i].ret),`${F(EACH*(1+r.ret))}원`]).concat([['<b>합</b>','1,000만 원','','',`<b>${PP(total(rows))}</b>`,br==='a'&&!grow&&!ds?'—':U.pp(total(rows)-total(base)),`<b>${F(EACH*5*(1+total(rows)))}원</b>`]]),`${START[st][0]}에서 산 다섯 상품 · ${BR[br][0]} ${BR[br][2]}`);
  const n10=rows[2],sb=rows[3],sbFlat=year(st,br,grow,0)[3];
  const sbT=ds?` 새벽전자는 스프레드가 ${U.pp(ds)} 바뀌어 1년 수익 <b>${PP(sb.ret)}</b>, (가)보다 <b>${U.pp(sb.ret-base[3].ret)}</b>입니다. 스프레드가 그대로였다면 ${PP(sbFlat.ret)}였습니다.`:` 새벽전자는 <b>${PP(sb.ret)}</b>입니다.`;
  U.result(el,groupChart(sets,br)+tbl,`<span class="kind-tag">200만 원씩 · 계산 편의, 권유 아님</span><br>${START[st][0]}에서 3년 ${R(U.curve(0.03,START[st][1],3))}, 10년 ${R(U.curve(0.03,START[st][1],10))}일 때 삽니다. <b>${BR[br][0]}</b> ${BR[br][2]}: 나라 10년은 남은 9년 금리 ${R(n10.y1)}로 값이 매겨져 가격 <b>${PP(n10.pr)}</b>, 이표 450원을 더한 1년 수익 <b>${PP(n10.ret)}</b>입니다. 나라 3년은 <b>${PP(rows[1].ret)}</b>입니다.${sbT} 예금은 ${PP(DEP,1)}, 누리200은 <b>${PP(rows[4].ret,1)}</b>입니다.<br>다섯 상품의 합(지금 가정): ${sets.map(x=>`${BR[x.key][0]} <b>${PP(total(x.rows))}</b>`).join(' · ')}. (가)의 합은 약 ${F(Math.round(EACH*5*total(sets[0].rows)/1000)*1000)}원입니다. 합의 크기는 누리200에 붙인 가정이 대부분 정하므로, 상품별 차이와 그 원인을 읽는 데 무게를 둡니다.${st==='hold'?'<br>대조: 인하를 반영하지 않은 동결 곡선에서 샀다면, 예고대로 내린 (가)에서도 기대에서 벗어난 몫만큼 나라 10년 가격이 뜁니다.':''}${U.kind(['model','scenario','real'],'출발·1년 뒤 곡선은 6장 모형의 교육용 시나리오이고 금리 예측이 아닙니다. 받은 이표는 다시 굴리지 않았고 세금·거래 비용은 넣지 않았습니다. 누리200의 할인율은 1년 뒤 기준금리가 산 날 곡선이 믿던 경로에서 벗어난 만큼 움직인다고 가정했습니다.')}`);
 });
};
})();
