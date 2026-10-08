/* 7~10장 실험: SWE-bench식 판정, PVE 검사기, 범위 계약, 검증 게이트, 리뷰어 루브릭. 계산은 A15Math에서 한다. */
(()=>{
'use strict';
const U=A15UI,M=A15Math,S=U.select,R=U.range;

A15Labs.harness=el=>{
 U.setup(el,S('har-rule','판정 규칙',[['f2p','고칠 테스트만 (FAIL_TO_PASS)'],['both','둘 다 (FAIL_TO_PASS + PASS_TO_PASS)']],'f2p')+S('har-filter','과제 범위',[['all','과제 8건 모두'],['clean','이슈에 해법이 드러난 과제 제외']],'all'));
 U.bind(el,()=>{
  const rule=U.text(el,'har-rule'),f=U.text(el,'har-filter'),r=M.harness(rule,f);
  const items=r.rows.map(p=>[`${p.id}${p.leaked?' (누출)':''}`,p.resolved?'해결':'미해결',`고침 ${p.fixed?'예':'아니오'} · 깨뜨림 ${p.broken}`,p.resolved]);
  U.result(el,U.rows(items,`해결 ${r.resolved}건, 과제 ${r.total}건`,'패치별 판정'),
  `해결률 <strong>${r.resolved}/${r.total} = ${U.fmt(r.rate*100,1)}%</strong><br>${rule==='f2p'?'원래 통과하던 테스트를 깨뜨린 패치도 해결로 셉니다. SWE-bench는 이렇게 세지 않습니다.':'다른 기능을 깨뜨린 패치는 해결로 세지 않습니다.'} ${f==='clean'?'이슈 본문에 해법이 드러난 과제를 빼면 실력 이상으로 부풀려진 점수가 걷힙니다.':''}<br>판정 규칙은 실제 계산이고, 패치 여덟 건과 결과는 교육용 가정 데이터입니다.`);
 });
};

const VT={allow:'실행',block:'차단',confirm:'사람 확인'};
A15Labs.pve=el=>{
 U.setup(el,R('pve-level','켠 검사 규칙 수',0,4,1,0));
 U.bind(el,()=>{
  const r=M.pve(U.value(el,'pve-level'));
  const items=r.rows.map(c=>[`${c.tool}(${c.args})`,VT[c.verdict],c.rule?`규칙 ${c.rule} · ${c.reason}`:c.reason,c.id==='c1'?c.verdict==='allow':c.verdict!=='allow']);
  const on=r.level?M.PVE_RULES.slice(0,r.level).join(', '):'없음';
  U.result(el,U.rows(items,`도구 호출 다섯 건의 판정, 위험한 호출 ${r.unsafe}건 실행`,'도구 호출 판정'),
  `켠 규칙: ${on}<br>위험한 호출 가운데 그대로 실행되는 것: <strong>${r.unsafe}/4건</strong> · 차단 ${r.blocked} · 사람 확인 ${r.confirm}<br>${r.unsafe?'아직 검색된 지시나 유출 시도가 실행됩니다.':'정상 호출 c1만 바로 실행되고 나머지는 막히거나 사람을 기다립니다.'} 규칙 판정은 실제 계산이고 호출 다섯 건은 시나리오입니다. 문자열 검사는 쉽게 우회되므로 출처 꼬리표와 사람 확인이 함께 있어야 합니다.`);
 });
};

const ST={in:'허용',off:'범위 밖',forbidden:'금지'};
A15Labs.scope=el=>{
 U.setup(el,S('scope-diff','검사할 diff',[['clean','계약을 지킨 diff'],['docs','문서 하나가 섞인 diff'],['creep','범위가 번진 diff']],'clean')+S('scope-mode','검사 모드',[['normal','보통 (범위 밖 = 경고)'],['strict','엄격 (범위 밖 = 차단)']],'normal'));
 U.bind(el,()=>{
  const d=U.text(el,'scope-diff'),strict=U.text(el,'scope-mode')==='strict',r=M.scopeCheck(M.DIFFS[d],strict);
  const items=r.rows.map(x=>[x.file,ST[x.status],x.severity==='ok'?'통과':x.severity==='warn'?'경고':'차단',x.severity==='ok']);
  U.result(el,U.rows(items,`diff 파일 ${r.rows.length}개 판정, 차단 ${r.blocks}개`,'파일별 범위 판정'),
  `범위 검사: <strong>${r.passed?'통과':'차단'}</strong> · 차단 ${r.blocks} · 경고 ${r.warns}<br>허용: ${M.CONTRACT.allowed.join(', ')} · 금지: ${M.CONTRACT.forbidden.join(', ')}<br>${r.warns?'경고는 통과를 막지 않지만 리뷰에서 보이게 남습니다.':''}${r.blocks?' 금지 경로나 엄격 모드의 범위 밖 쓰기는 게이트로 넘기지 않습니다.':''} 글롭 대조는 실제 계산이고, 계약과 diff는 원본 레슨의 가입 검증 예를 본뜬 시나리오입니다.`);
 });
};

const KIND={clean:'정말 끝난 작업',notRun:'합격 명령을 안 돌림',failed:'합격 명령이 실패',nullExit:'종료 코드가 비어 있음',forbidden:'금지 경로를 건드림',rule:'차단 규칙 위반',offScope:'범위 밖 파일 수정'};
A15Labs.gate=el=>{
 U.setup(el,R('gate-level','켠 게이트 검사 수',0,6,1,0)+S('gate-mode','범위 밖 쓰기 처리',[['normal','경고 (보통)'],['strict','차단 (엄격)']],'normal'));
 U.bind(el,()=>{
  const L=U.value(el,'gate-level'),strict=U.text(el,'gate-mode')==='strict',g=M.gate(L,strict);
  const counts={};M.CLOSEOUTS.forEach(k=>counts[k]=(counts[k]||0)+1);
  const items=Object.keys(KIND).map(k=>{const c=g.caught[k]||0,n=counts[k];return [`${KIND[k]} ${n}건`,k==='clean'?'통과':c?'걸러짐':'통과',k==='clean'?'정상':c?`${c}건 차단`:(k==='offScope'&&g.warned?'경고만':'못 잡음'),k==='clean'||c>0];});
  const fake=g.passed-g.truePass,on=M.GATE_CHECKS.slice(0,L).map(c=>c[1]);
  U.result(el,U.rows(items,`완료 보고 20건 가운데 통과 ${g.passed}건`,'완료 보고 유형별 결과'),
  `게이트 통과 <strong>${g.passed}/20</strong> · 그중 말뿐인 완료 <b>${fake}건</b>${g.warned?` · 경고 ${g.warned}건`:''}<br>켠 검사: ${on.length?on.join(', '):'없음 (에이전트의 말을 그대로 믿음)'}<br>${fake?'아직 끝나지 않은 일이 완료로 통과합니다.':'정말 끝난 9건만 통과합니다.'} 게이트 규칙은 원본 레슨 38을 따른 실제 계산이고, 완료 보고 20건의 구성은 교육용 가정 데이터입니다.`);
 });
};

const VERD={pass:'pass (통과)',soft_fail:'soft fail (고쳐서 다시)',hard_fail:'hard fail (다시 설계)'};
const DEF=[2,2,1,2,1];
A15Labs.rubric=el=>{
 U.setup(el,M.RUBRIC.map((n,i)=>R('rub-'+i,n,0,2,1,DEF[i])).join(''));
 U.bind(el,()=>{
  const r=M.rubric(M.RUBRIC.map((_,i)=>U.value(el,'rub-'+i)));
  U.result(el,U.bars(M.RUBRIC,r.scores,'점 (0~2)',null,0),
  `합계 <strong>${r.total}/10</strong> · 판정 <b>${VERD[r.verdict]}</b><br>${r.zero>=0?`“${M.RUBRIC[r.zero]}”이 0점이라 합계와 관계없이 hard fail입니다.`:r.total<5?'합계가 5 미만이라 hard fail입니다.':r.total<7?'합계가 7 미만이라 soft fail입니다.':'합계 7 이상이고 0점 차원이 없어 통과입니다.'}<br>문턱(7 미만 soft fail, 5 미만이나 0점 차원이면 hard fail)은 원본 레슨 39를 그대로 옮긴 실제 계산이고, 점수는 직접 매기는 입력입니다.`);
 });
};
})();
