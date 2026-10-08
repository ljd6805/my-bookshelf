/* 7~11장 실험: 키 노출, 노트북 커널, 시드 분할, 프로파일링, 손실 곡선, 확인 순서. 계산은 A01Math에서 한다. */
(()=>{
'use strict';
const U=A01UI,M=A01Math,S=U.select,R=U.range,F=U.fmt;
const STORE={literal:'코드에 직접 적음',tracked:'.env (무시 규칙 없음)',envignored:'.env (.gitignore에 있음)',envvar:'셸 환경 변수'};
const SHORT={literal:'코드',tracked:'.env',envignored:'.env(무시)',envvar:'환경 변수'};
const REPO={local:'내 컴퓨터에만',private:'비공개 저장소',public:'공개 저장소'};
A01Labs.leak=el=>{
 U.setup(el,S('store','API 키를 둔 곳',Object.entries(STORE),'tracked')+S('repo','커밋을 올린 곳',Object.entries(REPO),'public'));
 U.bind(el,()=>{const s=U.text(el,'store'),p=U.text(el,'repo'),r=M.keyLeak(s,p),lv=['없음','중간','높음'][r.level];
  const items=[['키를 둔 곳',SHORT[s],r.inHistory?'추적됨':'추적 안 됨',!r.inHistory],['Git 기록',r.inHistory?'들어감':'없음','git log',!r.inHistory],['볼 수 있는 사람',REPO[p],'공개 범위',p!=='public'],['노출 위험',lv,'판정',r.level===0]];
  U.result(el,U.rows(items,`노출 위험 ${lv}`,'키가 퍼지는 길'),`노출 위험: <strong>${lv}</strong><br>${r.action}${r.inHistory&&p==='local'?' 다만 키가 이미 커밋 기록에 있으므로 이 저장소를 나중에 푸시하는 순간 함께 올라갑니다.':''}<br>두 조건(기록에 들어갔는가, 누가 보는가)을 곱한 정책 판정이며, 실제 저장소를 검사하지 않습니다.`);});
};
const CODE={1:'x = 1',2:'x = x + 1',3:'y = x * 10'};
A01Labs.kernel=el=>{
 U.setup(el,S('seq','셀을 실행한 순서',[['top','1 → 2 → 3 (위에서부터)'],['twice','1 → 2 → 2 → 3 (셀 2를 두 번)'],['early','3 → 1 → 2 (새 커널에서 3부터)'],['deleted','1 → 2 → 3 뒤 셀 2 삭제']],'top'));
 U.bind(el,()=>{const r=M.kernel(U.text(el,'seq'));
  const count=c=>r.run.map((x,i)=>x===c?i+1:0).filter(Boolean).pop();
  const cells=[1,2,3].map(c=>{const gone=!r.visible.includes(c);return `<div class="a01-cell ${gone?'gone':''}"><em>[${count(c)||' '}]</em><span>${CODE[c]}${gone?' (삭제됨)':''}</span></div>`;}).join('');
  const val=x=>x.error?'오류':'y = '+x.y;
  const chart=`<div class="a01-cells">${cells}<div class="a01-compare"><div class="${r.same?'':'bad'}"><small>지금 커널</small><b>${val(r.now)}</b></div><div><small>재시작 후 위에서부터</small><b>${val(r.fresh)}</b></div></div></div>`;
  U.result(el,chart,`실행 순서 ${r.run.join(' → ')} · 지금 커널: <strong>${r.now.error?r.now.error:'x = '+r.now.x+', y = '+r.now.y}</strong><br>화면에 남은 셀 ${r.visible.join(', ')}을 커널 재시작 후 위에서부터 실행하면 <b>${val(r.fresh)}</b><br>${r.same?'두 결과가 같으므로 이 노트북은 공유해도 됩니다.':'두 결과가 다릅니다. Restart & Run All로 다시 실행해 화면 순서만으로 재현되게 고쳐야 합니다.'} 세 셀을 실제로 해석해 비교한 계산입니다.`);});
};
A01Labs.split=el=>{
 U.setup(el,R('rows','리뷰 수 (개)',200,5000,100,1000)+S('seed','다시 나눌 때 쓴 시드 (처음은 42)',[[42,'42 (처음과 같음)'],[7,'7'],[2024,'2024']],42));
 U.bind(el,()=>{const n=U.value(el,'rows'),sd=U.value(el,'seed'),r=M.leak(n,42,sd);
  U.result(el,U.bars(['훈련','검증','평가','누수'],[...r.sizes,r.overlap],'개',null,0),
  `${n}개를 시드 ${sd}로 나눔: 훈련 <b>${r.sizes[0]}</b> · 검증 <b>${r.sizes[1]}</b> · 평가 <b>${r.sizes[2]}</b><br>새 평가 세트 중 시드 42로 나눴을 때 훈련에 쓰인 리뷰: <strong>${r.overlap}개 (${F(r.rate*100,1)}%)</strong><br>${r.overlap?'옛 체크포인트를 이 평가 세트로 재면 이미 본 리뷰로 점수를 매기게 되어 정확도가 부풀려집니다.':'같은 시드라 분할이 그대로 재현되어 누수가 없습니다.'} 실제로 섞고 겹침을 센 계산입니다.`);});
};
A01Labs.profile=el=>{
 U.setup(el,R('workers','DataLoader 일꾼 수 (num_workers)',0,8,1,0));
 U.bind(el,()=>{const w=U.value(el,'workers'),r=M.stepTime(60,40,w);
  U.result(el,U.bars(['로딩','계산','GPU 대기','한 단계'],[r.loadEff,40,r.idle,r.step],'ms',null,1),
  `일꾼 ${w}명 · 한 단계 <strong>${F(r.step,1)} ms</strong> · GPU 사용률 <b>${F(r.gpuUse*100,0)}%</b><br>병목: <b>${r.bottleneck}</b>. 1,000단계 한 에폭은 약 ${F(r.step,0)}초입니다.<br>${w===0?'로딩과 계산이 차례로 이어져 GPU가 매 단계 60ms씩 기다립니다.':r.idle>0?'미리 읽기가 계산과 겹치지만 아직 로딩이 더 깁니다.':'로딩이 계산 뒤에 숨었습니다. 일꾼을 더 늘려도 한 단계는 계산 시간 아래로 줄지 않습니다.'}<br>로딩 60ms·계산 40ms(원본의 “로딩 60%” 예)를 가정한 실제 계산이며, 완벽한 겹침을 가정했습니다.`);});
};
A01Labs.curve=el=>{
 U.setup(el,R('lr','학습률 η',0.05,1.2,0.05,0.25));
 U.bind(el,()=>{const lr=U.value(el,'lr'),r=M.lossCurve(lr);el.querySelector('#lr-value').textContent=F(lr,2);
  const pts=r.loss.map((L,t)=>[t,Math.max(-8,Math.min(10,Math.log10(Math.max(L,1e-12))))]);
  U.result(el,U.plot({lines:[{data:pts},{data:[[0,2],[30,2]],color:'var(--orange)',dashed:true}],xmin:0,xmax:30,ymin:-8,ymax:10,xlabel:'학습 단계',ylabel:'log₁₀ 손실',label:`학습률 ${F(lr,2)}의 손실 곡선: ${r.kind}`}),
  `학습률 <b>${F(lr,2)}</b> · 한 단계마다 w에 곱해지는 수 |1 − 2η| = <b>${F(r.factor,2)}</b> → <strong>${r.kind}</strong><br>30단계 뒤 손실 ${r.final<1e-4?'0.0001 미만':r.final>1e6?'백만 초과':F(r.final,4)} · 조건부 중단점(손실 > 100): ${r.stop<0?'걸리지 않음':`<b>${r.stop}단계</b>에서 멈춤`}<br>주황 점선이 손실 100입니다. L = w²에 경사하강을 실제로 반복한 계산이며, 실제 모델의 손실 지형은 이보다 복잡합니다.`);});
};
const SCEN={importfail:'import torch 실패',nocuda:'CUDA가 보이지 않음',acc99:'평가 정확도 99%',slow:'학습이 세 배 느림'};
A01Labs.triage=el=>{
 U.setup(el,S('scenario','팀원의 보고',Object.entries(SCEN),'acc99')+S('strategy','확인 순서 전략',[['bottom','아래층부터 차례로'],['symptom','증상에 맞는 점검부터'],['top','손실 곡선부터 거꾸로']],'bottom'));
 U.bind(el,()=>{const r=M.triage(U.text(el,'scenario'),U.text(el,'strategy'));
  U.result(el,U.bars(r.path.map((c,i)=>`${i+1}. ${c[2]}`),r.path.map(c=>c[1]),'분',null,0),
  `원인을 드러낸 점검: <b>${r.cause}</b> · 점검 <b>${r.checks}개</b>, 걸린 시간 <strong>${r.minutes}분</strong><br>${r.checks===1?'첫 점검에서 원인이 드러났습니다. 고친 뒤 다시 돌려 증상이 사라지는지 확인해야 원인이라고 말할 수 있습니다.':'원인에 닿기 전에 다른 점검을 거쳤습니다. 증상이 가리키는 장을 먼저 고르면 줄일 수 있는지 비교해 보세요.'}<br>보고마다 원인을 하나로 정한 시나리오이며, 점검 시간은 교육용 가정값입니다.`);});
};
})();
