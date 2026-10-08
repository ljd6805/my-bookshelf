/* 9~12장 실험: 흥정, 섀플리 값, 마음 모형, 재시도 폭풍, 마지막 과제 진단. 계산은 A17Math에서 한다. */
(()=>{
'use strict';
const U=A17UI,M=A17Math,R=U.range,S=U.select,F=U.fmt;
const sub=t=>`<h4 class="a17-sub">${t}</h4>`;
const pct=(x,d=1)=>F(x*100,d)+'%';

let bargainCurve=null;
A17Labs.bargain=el=>{
 U.setup(el,R('rounds','흥정 라운드 수 R',1,8,1,4));
 if(!bargainCurve){bargainCurve={og:[],naive:[]};for(let i=1;i<=8;i++){const x=M.bargain(i);bargainCurve.og.push([i,x.og]);bargainCurve.naive.push([i,x.naive]);}}
 U.bind(el,()=>{const n=U.value(el,'rounds'),r=M.bargain(n);
  U.result(el,U.plot({lines:[{data:bargainCurve.naive,color:'var(--orange)',dashed:true},{data:bargainCurve.og}],points:[[n,r.og,'var(--accent)',7],[n,r.naive,'var(--orange)',6]],xmin:1,xmax:8,ymin:0,ymax:1,xlabel:'라운드 수 R',ylabel:'성사 비율(손해 거래 제외)',label:`라운드 수에 따른 성사 비율. R ${n}에서 제안 생성기 ${pct(r.og)}, 순진한 구매자 ${pct(r.naive)}`}),
  `R = <b>${n}</b>, 거래 1,000번 중 서로 값이 겹치는 거래 ${r.zopa}건(시드 7)<br>제안 생성기(값은 코드가 계산, 말만 모델) 성사 <strong>${pct(r.og)}</strong> · 성사한 거래에서 구매자 몫 평균 ${pct(r.ogSurplus)}<br>순진한 구매자(값까지 모델이 즉석으로) 성사 <b>${pct(r.naive)}</b> · 자기 최대가를 넘겨 부른 적이 있는 거래 <b>${pct(r.naiveOver)}</b><br>최대가·최저가의 범위와 양보 규칙은 가정값이고, 거래는 실제로 시뮬레이션했습니다.`);});
};

A17Labs.shapley=el=>{
 U.setup(el,R('full','셋이 함께 만든 보고서의 가치',0.6,1,0.05,0.8));
 U.bind(el,()=>{const f=U.value(el,'full'),v=M.coalitionValue(f),p=M.shapley(v);
  el.querySelector('#full-value').textContent=F(f,2);
  U.result(el,sub('섀플리 값(가치를 나눈 몫)')+U.bars(['조사원 R','작성자 W','검증자 V'],[p.R,p.W,p.V],'가치',null,3)+sub('연합 가치표(가정값)')+U.cards([['혼자','R 0.3 · W 0.1 · V 0'],['둘이','RW 0.6 · RV 0.4 · VW 0.2'],['셋이',`RVW ${F(f,2)}`]],2),
  `셋의 가치 <b>${F(f,2)}</b><br>R <strong>${F(p.R,3)}</strong> · W <b>${F(p.W,3)}</b> · V <b>${F(p.V,3)}</b> · 합 ${F(p.R+p.W+p.V,3)} (가치 전체를 남김없이 나눔)<br>검증자는 혼자서는 0이지만, 셋이 모이는 여섯 가지 순서마다 자신이 더한 몫을 평균 내면 ${F(p.V,3)}을 받습니다.<br>가치표는 가정값이고, 여섯 순서의 한계 기여 평균은 정확히 계산했습니다.`);});
};

A17Labs.tom=el=>{
 U.setup(el,S('order','마음 모형의 차수',[[0,'0차 (상대를 생각하지 않음)'],[1,'1차 (상대가 어디로 가는지 짐작)']],1)+R('agents','에이전트 수 n',2,6,1,3)+R('noise','믿음 오류 확률 h',0,1,0.1,0));
 U.bind(el,()=>{const o=U.value(el,'order'),n=U.value(el,'agents'),h=U.value(el,'noise'),r=M.tom(o,n,h),z=M.tom(0,n),f=M.tom(1,n,h);
  el.querySelector('#noise-value').textContent=F(h,1);
  U.result(el,sub('같은 상자를 고른 비율(%)')+U.bars(['0차',`1차 (h = ${F(h,1)})`],[z.duplication*100,f.duplication*100],'%',null,1)+sub('모두 줍기까지 걸린 차례')+U.bars(['0차',`1차 (h = ${F(h,1)})`],[z.turns,f.turns],'차례',null,2),
  `${o?'1차':'0차'} 마음 모형, 에이전트·상자 ${n}개, h = ${F(h,1)}, 200번 반복(시드 11)<br>같은 상자를 고른 비율 <strong>${pct(r.duplication)}</strong> · 모두 줍기까지 평균 <b>${F(r.turns,2)}차례</b> · 끝낸 비율 ${pct(r.completion,0)}<br>${o?(f.duplication<z.duplication?`0차(${pct(z.duplication)})보다 겹침이 줄었습니다.`:`믿음이 틀려 0차(${pct(z.duplication)})보다 나아지지 않았습니다.`):'상대를 생각하지 않으니 같은 상자로 몰리는 일이 잦습니다.'}<br>상자 줍기 규칙은 이 책이 정한 단순화이고, 결과는 실제로 시뮬레이션했습니다.`);});
};

A17Labs.storm=el=>{
 U.setup(el,R('fail','재고 서비스의 기본 실패율 f',0,0.3,0.01,0.1)+S('retry','실패하면 다시 시도하는 횟수',[[0,'0번'],[2,'2번'],[5,'5번']],5)+S('breaker','회로 차단기',[['off','없음'],['on','있음 (실패율 10% 넘으면 재시도 멈춤)']],'off'));
 U.bind(el,()=>{const f=U.value(el,'fail'),k=U.value(el,'retry'),b=U.text(el,'breaker')==='on',r=M.storm(f,k,b),pts=r.load.map((y,i)=>[i+1,y]);
  el.querySelector('#fail-value').textContent=F(f,2);
  U.result(el,U.plot({lines:[{data:[[1,1.2],[20,1.2]],color:'var(--orange)',dashed:true},{data:pts}],points:[[20,r.final,'var(--orange)',6]],xmin:1,xmax:20,ymin:0,ymax:Math.max(2,Math.ceil(r.peak)),xlabel:'시간 단계',ylabel:'재고 서비스가 받는 부하(평소 1)',label:`시간에 따른 부하. 마지막 부하 ${F(r.final,2)}, 용량 1.2`}),
  `f = <b>${F(f,2)}</b>, 재시도 ${k}번, 차단기 ${b?'있음':'없음'}<br>${b&&r.opened?'차단기가 열려 요청 하나를 한 번만 시도하고 기본 응답을 돌려주므로':`요청 하나가 평균 1 + f + … + f^${k}번 시도되어`}, 마지막 부하 <strong>${F(r.final,2)}</strong> (용량 1.2, 주황 점선) · 가장 높은 부하 <b>${F(r.peak,2)}</b><br>마지막 실패율 <b>${pct(r.finalFail)}</b>${b?` · 차단기가 열린 단계 ${r.opened}개`:''}<br>${r.final>1.2?'용량을 넘은 몫이 다시 실패가 되고, 그 실패가 또 재시도를 부릅니다.':'용량 안에 머물러 실패가 실패를 부르지 않습니다.'} 용량과 문턱은 가정값이고, 20단계는 실제로 계산했습니다.`);});
};

const INC=[['poison','기억 오염: 보고서에 42%'],['storm','재시도 폭풍: 재고 서비스 과부하'],['mono','단일 문화: 같은 모델 셋의 합의']],FIX=[['more','에이전트나 자원을 더 붙임'],['verify','독립된 확인을 붙임'],['longer','더 오래, 더 많이 시도']];
const FIXTEXT={poison:{more:'조사원을 더 붙여도 모두 같은 풀을 읽습니다.',verify:'읽기 전용 검증자가 원문과 대조합니다.',longer:'단계를 늘려도 오염된 기록이 그대로 남습니다.'},storm:{more:'요청량이 1.5배인 피크에서는 같은 재시도가 더 큰 폭풍을 만듭니다.',verify:'회로 차단기가 실패율을 보고 재시도를 멈춥니다.',longer:'재시도를 8번으로 늘리면 실패가 더 많은 시도를 부릅니다.'},mono:{more:'같은 모델을 7명으로 늘려도 같은 실수를 따라갑니다(ρ 0.8).',verify:'다른 모델 계열로 바꿔 서로 독립에 가깝게 만듭니다(ρ 0.1).',longer:'같은 셋이 더 토론해도 서로를 따라갈 뿐이라 이 모형에서는 그대로입니다.'}};
A17Labs.diagnose=el=>{
 U.setup(el,S('incident','사고',INC,'poison')+S('fix','처방',FIX,'more'));
 U.bind(el,()=>{const i=U.text(el,'incident'),x=U.text(el,'fix'),r=M.diagnose(i,x),all=FIX.map(([f])=>M.diagnose(i,f).after),d=i==='mono'?3:i==='poison'?1:2;
  U.result(el,sub(`${r.metric}: 처방 전과 처방별 결과`)+U.bars(['처방 전'].concat(FIX.map(f=>f[1])),[r.before].concat(all),r.unit||'확률',null,d),
  `${INC.find(a=>a[0]===i)[1]} · 처방: ${FIX.find(a=>a[0]===x)[1]}<br>${r.metric} <b>${F(r.before,d)}${r.unit==='%'?'%':''}</b>에서 <strong>${F(r.after,d)}${r.unit==='%'?'%':''}</strong>로 · ${r.good?'<b>해결</b>':'<b>해결되지 않음</b>'}<br>${FIXTEXT[i][x]}<br>앞 장의 함수(${i==='poison'?'공유 기억 오염':i==='storm'?'재시도 폭풍':'다수결'})를 그대로 다시 불러 계산했습니다. 사고 설정은 미리 정한 시나리오입니다.`);});
};
})();
