/* 1~3장 실험: 온도와 top-p, 퓨샷 토큰, 자기 일관성 다수결, 제약 디코딩 마스크. 계산은 A12Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A12UI,M=A12Math,F=U.fmt,R=U.range,S=U.select;

A12Labs.sampling=el=>{
 U.setup(el,R('sp-temp','온도 T',0,2,0.1,0.7)+S('sp-topp','top-p (누적 확률 상한)',[['1','1 (자르지 않음)'],['0.9','0.9'],['0.5','0.5']],'1'));
 U.bind(el,()=>{const T=U.value(el,'sp-temp'),p=Number(U.text(el,'sp-topp')),r=M.sampling(T,p),names=M.CANDIDATES.map(c=>c[0]);
  const cut=names.filter((_,i)=>!r.kept[i]);
  U.result(el,U.bars(names,r.final.map(x=>x*100),'%',null,1),
  `온도 <b>${F(T,1)}</b>, top-p <b>${p}</b>에서 남은 후보 <b>${r.keptCount}개</b>${cut.length?` (잘린 후보: ${cut.join(', ')})`:''}<br>`+
  `정답 "14일"이 뽑힐 확률 <strong>${F(r.final[0]*100,1)}%</strong> · 틀린 답 "환불 불가" ${F(r.final[4]*100,1)}% · 분포의 엔트로피 ${F(r.entropy,2)}비트<br>`+
  (T===0?'온도 0은 가장 큰 로짓 하나만 남기는 탐욕 선택입니다. 같은 입력에는 매번 같은 답이 나옵니다.':T>=1.5?'원본 레슨은 온도 1.5 이상을 서비스에 쓰지 말라고 합니다. 꼬리의 틀린 후보가 눈에 띄게 뽑힙니다.':'온도를 올릴수록 분포가 평평해지고, top-p를 낮출수록 꼬리가 잘립니다. 원본 레슨은 둘 중 하나만 조절하라고 권합니다.')+
  '<br>교육용 로짓에 소프트맥스와 top-p를 실제로 계산한 결과입니다. 로짓 자체는 실제 모델에서 잰 값이 아닙니다.');});
};

A12Labs.fewshot=el=>{
 U.setup(el,R('fs-k','예시 수 k',0,10,1,3)+R('fs-per','예시 하나의 길이 (토큰)',40,200,10,80));
 U.bind(el,()=>{const k=U.value(el,'fs-k'),per=U.value(el,'fs-per'),r=M.fewshot(k,per);
  U.result(el,U.bars(['기본 지시 + 문의','예시 k개'],[350,k*per],'토큰',null,0),
  `문의 한 건의 입력 = 350 + ${k} × ${per} = <strong>${F(r.perQuery,0)}토큰</strong> (예시 없을 때의 <b>${F(r.ratio,2)}배</b>)<br>`+
  `하루 1만 건이면 <b>${F(r.daily/1e6,2)}백만</b> 토큰, 30일이면 <b>${F(r.monthly/1e6,1)}백만</b> 토큰입니다.<br>`+
  (k===0?'제로샷입니다. 형식이 까다로운 분류라면 예시가 지시보다 정확히 전달할 수 있습니다.':k>5?'원본 레슨은 대부분의 일에서 예시 3~5개면 충분하고, 그 이상은 이득이 줄면서 창과 비용만 쓴다고 말합니다.':'예시 3~5개는 원본 레슨이 권하는 범위입니다. 비슷한 예시를 고르고 모든 분류를 한 번씩 보여 주세요.')+
  '<br>토큰 수를 실제로 곱하고 더한 계산이며, 기본 입력 350토큰은 가정값입니다. 정확도 변화는 이 계산에 들어 있지 않습니다.');});
};

A12Labs.vote=el=>{
 U.setup(el,R('vt-p','풀이 하나가 맞을 확률 p',0.4,0.95,0.05,0.7)+S('vt-n','풀이 수 N',[1,3,5,7,9,15].map(n=>[n,String(n)]),5));
 U.bind(el,()=>{const p=U.value(el,'vt-p'),n=Number(U.text(el,'vt-n')),q=M.majority(p,n),ns=[1,3,5,7,9,11,13,15];
  const data=ns.map(k=>[k,M.majority(p,k)]);
  U.result(el,U.plot({lines:[{data},{data:[[1,p],[15,p]],color:'var(--orange)',dashed:true}],points:[[n,q,'var(--orange)',7]],xmin:1,xmax:15,ymin:0,ymax:1,xlabel:'풀이 수 N',ylabel:'다수결이 맞을 확률',label:`p = ${p}일 때 풀이 수에 따른 다수결 정답률. 현재 N = ${n}에서 ${F(q,3)}`}),
  `p = <b>${F(p,2)}</b>, N = <b>${n}</b>: 다수결이 맞을 확률 <strong>${F(q,3)}</strong> (풀이 하나일 때 ${F(p,2)})<br>`+
  `비용과 지연은 풀이 수에 비례해 약 <b>${n}배</b>가 됩니다.<br>`+
  (p<0.5?'p가 0.5보다 작으면 풀이를 늘릴수록 다수결이 오답 쪽으로 기웁니다. 자기 일관성은 실수가 흩어질 때만 돕습니다.':p>=0.9?'이미 정답률이 높아 풀이를 늘려 얻는 이득이 작습니다. 원본 레슨이 말하는 "포화된" 경우입니다.':'원본 레슨은 N = 5에서 이득 대부분을 얻고 10을 넘으면 줄어든다고 정리합니다. 그래프의 기울기가 줄어드는 곳을 보세요.')+
  '<br>풀이들이 독립이고 오답이 한쪽으로 모인다는 이진 모형으로 실제 계산한 값입니다. 동률은 절반 확률로 맞힌다고 봅니다.');});
};

A12Labs.jsonmask=el=>{
 U.setup(el,R('jm-step','생성 단계 (토큰 수)',0,13,1,0));
 U.bind(el,()=>{const s=U.value(el,'jm-step'),r=M.jsonMask(s),esc=U.esc;
  const type={string:'문자열',integer:'정수',boolean:'참·거짓'}[r.type]||'';
  const chips=M.VOCAB.map(v=>{const on=r.allowed.includes(v);return `<span class="${on?'on':'off'}">${on?'✓ ':''}${esc(v)}</span>`;}).join('');
  U.result(el,`<div class="kit-panel"><code>${esc(r.prefix.join(' '))} ▌</code><div class="a12-vocab" role="list" aria-label="어휘 12개 중 허용된 토큰은 체크 표시, 막힌 토큰은 취소선">${chips}</div></div>`,
  `${s}단계 · 상태 <b>${r.state}</b>${type?` (값의 자료형: ${type})`:''}<br>`+
  (r.allowed.length?`허용 <strong>${r.allowed.length}개</strong> (${r.allowed.map(esc).join(', ')}) · 막힘 <b>${r.blocked}개</b> · 다음 목표 토큰 ${esc(r.next)}`:'JSON이 닫혔습니다. 더 만들 토큰이 없고 어휘 전체가 막힙니다.')+'<br>'+
  (s===3?'order_id 자리는 문자열이면 무엇이든 허용합니다. "네, 확인했습니다"도 통과하므로, 값이 맞는지는 스키마가 아닌 별도 검증이 확인해야 합니다.':s===7?'정수 자리라서 어휘 중 "2" 하나만 남습니다. 문자열이나 참·거짓은 확률이 0이 됩니다.':'막힌 토큰의 확률은 0이 되고, 남은 토큰끼리 확률을 다시 나눕니다.')+
  '<br>작은 스키마와 어휘 12개로 허용 집합을 실제 계산한 시나리오입니다. 모델의 확률은 계산하지 않습니다.');});
};
})();
