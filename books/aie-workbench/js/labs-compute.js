/* 4~6장 실험: VRAM 적합, 클라우드 비용, 원격 학습 생존, 권한 비트, 도커 층 캐시. 계산은 A01Math에서 한다. */
(()=>{
'use strict';
const U=A01UI,M=A01Math,S=U.select,R=U.range,F=U.fmt;
A01Labs.vram=el=>{
 U.setup(el,R('params','모델 크기 (B, 10억 개)',0.5,70,0.5,7)+S('bytes','가중치 정밀도',[[4,'fp32 · 4바이트'],[2,'fp16 · 2바이트'],[1,'8비트 · 1바이트']],2)+S('gpumem','GPU 메모리 (GB)',[[8,'8 GB'],[16,'16 GB'],[24,'24 GB'],[48,'48 GB'],[80,'80 GB']],16));
 U.bind(el,()=>{const p=U.value(el,'params'),b=U.value(el,'bytes'),v=U.value(el,'gpumem'),r=M.vramFit(p,b,v);
  U.result(el,U.bars(['가중치','여유 포함'],[r.weights,r.need],'GB',v,1),
  `${F(p,1)}B × ${b}바이트 = 가중치 <b>${F(r.weights,1)} GB</b>, 실행 여유 20%를 더하면 <b>${F(r.need,1)} GB</b><br>판정: <strong>${r.fits?'들어갑니다':'들어가지 않습니다'}</strong> (GPU ${v} GB, 점선). 이 조건에서 올릴 수 있는 최대 크기는 약 <b>${F(r.maxB,1)}B</b>입니다.<br>원본의 어림 규칙(파라미터당 바이트)으로 한 실제 계산입니다. 여유 20%는 이 책의 가정이며, 학습용 기울기·옵티마이저 메모리는 넣지 않았습니다.`);});
};
A01Labs.cloudcost=el=>{
 U.setup(el,R('price','시간당 가격 (달러)',0.2,2,0.1,1)+R('runs','10분짜리 학습 횟수',1,30,1,6)+R('idle','끄지 않고 둔 시간 (시간)',0,72,1,0));
 U.bind(el,()=>{const p=U.value(el,'price'),n=U.value(el,'runs'),i=U.value(el,'idle'),r=M.cloudCost(p,n,i);
  el.querySelector('#price-value').textContent=F(p,1);
  U.result(el,U.bars(['학습 비용','유휴 비용'],[r.runCost,r.idleCost],'달러'),
  `학습 ${n}회 × 10분 = ${F(r.runH,2)}시간, 유휴 ${i}시간 → 청구 <strong>${F(r.cost,2)}달러</strong><br>그중 유휴 시간 비용이 <b>${F(r.idleShare*100,0)}%</b>입니다. 같은 학습을 CPU로 했다면 원본의 예(8시간 → 10분)대로 약 ${r.cpuH}시간이 걸립니다.<br>가격 범위(0.20~2.00달러)와 시간 비는 원본 커리큘럼이 든 값(확인일 2026-10-08)으로 한 실제 계산이며, 견적이 아닙니다.`);});
};
const METHOD_TEXT={fg:'python train.py',bg:'python train.py &',nohup:'nohup python train.py > train.log 2>&1 &',tmux:'tmux new -s train 안에서 python train.py'};
const STEP_NOTE={ok:'계속 돌고 있음',dead:'학습이 끝나 버림',attach:'tmux attach -t train으로 화면에 다시 붙음',log:'붙을 화면은 없고 tail -f train.log로 확인'};
A01Labs.survive=el=>{
 U.setup(el,S('method','학습을 띄운 방법',[['fg','그냥 실행'],['bg','& 배경 실행'],['nohup','nohup … &'],['tmux','tmux 세션 안']],'bg'));
 U.bind(el,()=>{const k=U.text(el,'method'),r=M.survive(k),dead=r.steps.findIndex(s=>s[1]==='dead');
  U.result(el,U.cards(r.steps.map(([a,s])=>[a,STEP_NOTE[s]]),dead<0?3:dead),
  `명령: <b>${METHOD_TEXT[k]}</b><br>접속이 끊겨도 살아남나: <strong>${r.survive?'예':'아니요'}</strong> · 다시 붙을 수 있나: <strong>${r.reattach?'예':'아니요'}</strong><br>${r.survive?(r.reattach?'원본이 권하는 방법입니다. 몇 분 넘는 학습은 tmux로 띄웁니다.':'출력을 로그 파일로 보냈기 때문에 진행은 파일로만 읽습니다.'):'터미널이 닫히면 프로세스도 함께 끝납니다. 몇 시간 학습에는 맞지 않습니다.'}<br>원본 레슨의 비교표를 그대로 따른 시나리오이며 실제 프로세스를 띄우지 않습니다.`);});
};
A01Labs.chmod=el=>{
 U.setup(el,R('own','소유자 숫자',0,7,1,7)+R('grp','그룹 숫자',0,7,1,5)+R('oth','그 밖의 사람 숫자',0,7,1,4)+S('who','./train.sh를 실행하는 사람',[['owner','소유자'],['group','같은 그룹 사용자'],['other','그 밖의 사람']],'other'));
 U.bind(el,()=>{const o=U.value(el,'own'),g=U.value(el,'grp'),t=U.value(el,'oth'),w=U.text(el,'who'),r=M.chmod(o,g,t,w);
  const rowsDef=[['owner','소유자',o],['group','그룹',g],['other','그 밖',t]];
  const grid=`<div class="a01-bits" role="img" aria-label="권한 ${r.text}"><span class="head">대상</span><span class="head">r 4</span><span class="head">w 2</span><span class="head">x 1</span>${rowsDef.map(([k,n,d])=>`<span class="row-name ${k===w?'sel':''}">${n} ${d}${k===w?' ◀':''}</span>`+[4,2,1].map((bit,i)=>`<span class="${d&bit?'on':''}">${d&bit?'rwx'[i]:'-'}</span>`).join('')).join('')}</div>`;
  U.result(el,grid,`chmod <b>${r.mode}</b> → <b>${r.text}</b><br>${{owner:'소유자',group:'그룹 사용자',other:'그 밖의 사람'}[w]}의 권한은 ${r.bits} → ./train.sh 실행 <strong>${r.canExec?'성공':'Permission denied'}</strong><br>${r.canExec?'읽기와 실행 비트가 모두 있어 스크립트를 실행합니다.':r.canRead?'읽을 수는 있지만 실행 비트가 없습니다. chmod +x가 필요합니다.':'읽기 비트가 없어 셸이 스크립트를 읽지 못합니다.'} 비트를 더하는 실제 계산이며 root는 제외했습니다.`);});
};
A01Labs.layers=el=>{
 U.setup(el,S('changed','이번에 바뀐 것',[['code','코드 한 줄'],['reqs','라이브러리 목록'],['torch','PyTorch 버전'],['apt','시스템 도구'],['base','기본 이미지 태그']],'code')+S('order','Dockerfile 순서',[['good','COPY 코드를 맨 뒤에'],['bad','COPY 코드를 pip 앞에']],'good'));
 U.bind(el,()=>{const r=M.dockerBuild(U.text(el,'changed'),U.text(el,'order'));
  const items=r.layers.map(l=>[l.name,l.rebuilt?'다시 빌드':'캐시',l.rebuilt?l.sec+'초':'0초',!l.rebuilt]);
  U.result(el,U.rows(items,'층별 캐시 사용 결과','위에서 아래로 쌓이는 층'),`다시 빌드: <strong>${r.layers.length-r.cached}개 층, ${r.sec}초</strong> (처음부터 전부 빌드하면 ${r.full}초)<br>캐시에서 재사용한 층 <b>${r.cached}개</b>. 처음 바뀐 층부터 그 뒤의 모든 층이 다시 만들어집니다.<br>캐시 규칙은 실제 계산이고, 층별 시간은 교육용 가정값입니다.`);});
};
})();
