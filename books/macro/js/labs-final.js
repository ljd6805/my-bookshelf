/* 10장 마지막 과제: 가상 물가 발표와 예상의 차이, 두 가설(A 수입 물가 충격 한 번, B 물가 압력 네 분기)의 8분기 경로, 가설표.
   계산은 MMath.surprise·scenario(stage full)·firstBelow만 쓴다. 통화량 손잡이는 이 전체 모형에서만 연다.
   모형 경제의 3년 국채 금리·자국 통화 환율·주가지수는 계산하지 않고 방향의 가설로만 적는다(가격을 계산하지 않음).
   기본 화면은 가설 A 하나와 정책 금리 변경 0이다. A와 B를 나란히 놓는 것은 독자가 고를 때만 보이고 비교 예제에 넣지 않는다(확인 문제). B와 +0.5%p를 함께 넣는 비교 예제도 없다(L2). */
(()=>{
'use strict';
const U=MUI,M=MMath,A=M.ASSUME,MD=M.MODEL,H=A.hypotheses,R=A.release;
const f3=v=>U.sfmt(M.r3(v),3);
const NOTE_KEY='bookshelf:macro:v1:final-notes';
const ROWS=[['(가) 발표 당일, 장 마감 15:30까지','예: 인상 기대가 커진다면 3년 국채 금리는 오르는 쪽','예: 그날 3년 국채 금리가 오르지 않음','예: 그날 장 마감 값'],['(나) 다음 정책 회의까지 6주','예: 근원물가도 높다면 가설 B 쪽','예: 근원물가와 다음 달 물가가 그대로','예: 근원물가·다음 달 물가와 발표일'],['(다) 8분기','예: A라면 인상 없이도 물가 편차가 줄어듦(이 모형에서)','예: 분기 물가가 모형의 모양과 다르게 움직임','예: 분기별 물가·GDP 발표일']];
const COLS=['가설','틀렸다고 볼 관찰','확인할 지표와 발표일'];
function notes(el){
 const boxes=[...el.querySelectorAll('[data-note]')];
 try{const saved=JSON.parse(localStorage.getItem(NOTE_KEY)||'[]');if(Array.isArray(saved))boxes.forEach((b,i)=>{b.value=typeof saved[i]==='string'?saved[i]:'';});}catch(e){}
 boxes.forEach(b=>b.addEventListener('input',()=>{try{localStorage.setItem(NOTE_KEY,JSON.stringify(boxes.map(x=>x.value)));}catch(e){}}));
}
const noteBox=()=>`<fieldset class="cards hypo-table" data-free><legend>내 가설표 (이 브라우저에만 남고 다른 사람에게 보이지 않음)</legend>${ROWS.map(([range,...ph],r)=>`<div class="hypo-row"><b>${range}</b>${COLS.map((c,k)=>`<label class="control" for="fnote${r*3+k}"><span>${c}</span><textarea id="fnote${r*3+k}" data-note rows="2" placeholder="${ph[k]}"></textarea></label>`).join('')}</div>`).join('')}</fieldset>`;
/* 시장 가격은 계산하지 않는다: 방향의 가설과 그 가설을 버리게 할 관찰만 적는다. */
const DIRECTIONS=U.table(['모형 경제의 시장 가격','방향의 가설(크기는 계산하지 않음)','이 가설을 버리게 할 관찰'],[['3년 국채 금리','인상 기대가 커진다면 오르는 쪽으로 움직일 수 있음','그날 3년 국채 금리가 오르지 않음'],['자국 통화 환율','인상 기대가 커진다면 자국 통화가 강세 쪽으로 움직일 수 있음','그날 자국 통화가 강세 쪽으로 움직이지 않음'],['주가지수 · 할인율 경로','기대 금리가 오르면 미래 이익의 현재가치가 줄어 내리는 쪽으로 움직일 수 있음','그날 3년 국채 금리가 오르지 않았다면 이 경로로는 설명하지 못함'],['주가지수 · 명목 이익 경로','물가가 높아 명목 매출과 이익이 늘면 오르는 쪽으로 움직일 수 있음','다음 실적 발표에서 명목 매출이 늘지 않음']],'(가) 발표 당일의 방향 가설 · 가격을 계산하지 않음','task');
function paths(hyp,hike,money){
 const run=len=>M.scenario({shock:{size:H.A.shock.size,start:1,len},rate:{size:hike,start:A.hike.start,len:A.hike.len},money:{size:money,start:A.hike.start,len:A.hike.len}},{stage:'full',quarters:8});
 return hyp==='AB'?{A:run(H.A.shock.len),B:run(H.B.shock.len)}:{[hyp]:run(H[hyp].shock.len)};
}
MLabs['release-hypotheses']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.DISCLAIMER}</b><br>${U.RATE_FACT} ${U.RATE_NOTE}</p>`+U.modelBanner('이 모형은 시장 가격(모형 경제의 3년 국채 금리·자국 통화 환율·주가지수)을 계산하지 않습니다. 수입 물가 충격 +5%는 이 책의 가정입니다.')
  +U.group('모형 경제의 통계 기관 발표 (전년 동월 대비 %)',U.number('factual','발표된 물가 상승률',-10,30,0.1,R.actual)+U.number('fexp','시장이 예상한 값',-10,30,0.1,R.expected))
  +U.select('fhyp','가설',[['A',`A · ${H.A.name}`],['B',`B · ${H.B.name}`],['AB','A와 B를 나란히']],'A')
  +U.range('fhike','다음 분기부터 정책 금리 변경 (%p, 4분기)',0,0.5,0.25,0,'0이면 금리를 그대로 둠')+U.range('fmoney','통화량 증가율 변경 (%p, 4분기)',MD.ranges.money[0],MD.ranges.money[1],1,0,'이 전체 모형에서만 여는 손잡이')+noteBox(),true);
 notes(el);
 U.bind(el,()=>{
  const act=U.num(el,'factual'),exp=U.num(el,'fexp'),hyp=U.value(el,'fhyp'),hike=Number(U.value(el,'fhike')),money=Number(U.value(el,'fmoney'));
  if(act===null)return U.result(el,'',U.problem('발표된 물가 상승률','−10%에서 30% 사이로 넣어야 합니다.'));if(exp===null)return U.result(el,'',U.problem('예상한 값','−10%에서 30% 사이로 넣어야 합니다.'));
  let ps;try{ps=paths(hyp,hike,money);}catch(e){return U.result(el,'',U.problem('모형 입력',U.why(e)));}
  const sup=M.surprise(act,exp),keys=Object.keys(ps),labels=[...Array(8)].map((_,t)=>`${t+1}`);
  const series=keys.flatMap((k,j)=>[{name:`${k} 물가 (%p)`,values:ps[k].pi,color:j?'var(--orange)':'var(--blue)',shape:j?'■':'●',dash:!!j}]).concat([{name:'GDP (%)',values:ps[keys[0]].y,color:'var(--muted)',shape:'◆'}]);
  const chart=U.lines({series,labels,tick:v=>U.sfmt(v,2),title:`(다) 8분기 · 가설 ${keys.join('·')} · 금리 ${U.ppt(hike)}${money?` · 통화량 ${U.ppt(money,0)}`:''}`,h:280,label:keys.map(k=>`${k} 물가 편차 ${ps[k].pi.map(f3).join(', ')}`).join('; ')+`; GDP 편차 ${ps[keys[0]].y.map(f3).join(', ')}`})
   +U.table(['분기',...keys.map(k=>`${k} 물가(%p)`),'GDP(%)','시장 금리(%p)'],labels.map((l,t)=>[`${l}분기`,...keys.map(k=>f3(ps[k].pi[t])),f3(ps[keys[0]].y[t]),f3(ps[keys[0]].i[t])]),'모형의 8분기 경로 (소수 셋째 자리)','compact')+DIRECTIONS;
  const line=k=>{const p=ps[k].pi,b=M.firstBelow(p);return `가설 ${k}: 4분기째 물가 편차 <b>${U.ppt(p[3])}</b>, 8분기째 <b>${U.ppt(p[7])}</b>${b?`, ${b}분기부터 기준선 아래`:''}`;};
  const g=ps[keys[0]].y,gp=M.peak(g);
  U.result(el,chart,`예상과의 차이 = ${U.sfmt(act,1)}% − ${U.sfmt(exp,1)}% = <b>${U.ppt(sup,1)}</b>. ${sup>0?'예상까지는 이미 가격에 들어 있었을 수 있고, 경로를 가르는 것은 예상에서 벗어난 몫과 그 몫이 한 번에 그칠지 이어질지입니다.':sup<0?'발표가 예상보다 낮은 경우입니다. 같은 표를 반대 방향의 가설로 채웁니다.':'예상과 같아 벗어난 몫이 없습니다.'}<br>(다) 이 모형에서 ${keys.map(line).join('; ')}. GDP는 ${gp.q?`${gp.q}분기째 ${U.per(gp.value)}가 가장 큰 편차입니다`:'움직이지 않습니다(수입 물가 충격은 GDP를 직접 움직이지 않음)'}.<br>(가) 시장 가격은 위 표처럼 “○○라면 △△ 쪽으로 움직일 수 있고, □□로 확인한다”로만 씁니다. (나) 6주 동안 볼 지표: 근원물가, 다음 달 물가, 고용, 환율과 각 발표일.<br>${U.DISCLAIMER}${U.kind(['real','model','scenario'],`${MD.label}.`)}`);
 });
};
})();
