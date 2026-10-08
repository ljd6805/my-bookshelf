/* 7~8장 실험: 길이 예측과 말 속도, RVQ 코드북과 코덱 비트레이트. 계산은 A07Math에서 한다. */
(()=>{
'use strict';
const U=A07UI,M=A07Math,S=U.select,R=U.range;
const SYL=['타','이','머','를','맞','췄','어','요'],BASE=[12,8,10,9,14,13,9,15];
A07Labs.duration=el=>{
 U.setup(el,R('speed','말 속도 배율',.5,2,.1,1)+S('pause','문장 끝 쉼',[['0','없음'],['20','200 ms (20프레임)']],'0'));
 U.bind(el,()=>{const sp=U.value(el,'speed'),pause=U.value(el,'pause'),r=M.durations(BASE,sp,pause);
  el.querySelector('#speed-value').textContent=U.fmt(sp,1)+'×';
  const labels=SYL.concat(pause?['쉼']:[]),vals=r.frames.concat(pause?[pause]:[]);
  U.result(el,U.bars(labels,vals,'프레임 (1프레임 = 10 ms)',null,0),`“타이머를 맞췄어요” · 속도 ${U.fmt(sp,1)}배<br>음절별 프레임: ${r.frames.join(' + ')}${pause?` + 쉼 ${pause}`:''} = <b>${r.total}프레임</b><br>길이 ${r.total} × 10 ms = <strong>${U.fmt(r.seconds,2)}초</strong> · 24 kHz로 <b>${r.samples.toLocaleString('en-US')}샘플</b>, 16 kHz로 바꾸면 ${r.samples16k.toLocaleString('en-US')}샘플<br>기본 프레임 수와 10 ms 홉은 이 책의 가정값이며, 나누고 반올림하는 길이 조절은 실제로 계산했습니다.`);});
};
const CODECS={'75':'EnCodec 75 Hz','86':'DAC 86 Hz','12':'SNAC 거친 층 12 Hz','12.5':'Mimi 12.5 Hz'};
A07Labs.rvq=el=>{
 U.setup(el,S('codec','코덱 (프레임 속도)',Object.entries(CODECS),'12.5')+R('books','코드북 수',1,8,1,4));
 U.bind(el,()=>{const fr=Number(U.text(el,'codec')),k=U.value(el,'books'),q=M.rvq(M.RVQ_SIGNAL,k),all=M.rvq(M.RVQ_SIGNAL,8),b=M.codecBudget(fr,k);
  const line=all.errors.map((e,i)=>[i+1,Math.log10(e)]);
  const chart=U.plot({lines:[{data:line,color:'var(--accent)'}],points:[[k,Math.log10(q.rms),'var(--orange)',7]],xmin:1,xmax:8,ymin:-6,ymax:0,xlabel:'코드북 수',ylabel:'log₁₀ 잔차 RMS',label:`코드북 수에 따른 잔차 오차. 지금 ${k}개에서 RMS ${q.rms.toExponential(1)}입니다.`});
  U.result(el,chart,`${CODECS[U.text(el,'codec')]} · 코드북 ${k}개<br>비트레이트 ${fr} × ${k} × 10비트 = <strong>${U.fmt(b.kbps,2)} kbps</strong> · 10초당 프레임 ${U.fmt(b.frames,0)}개, 토큰 <strong>${U.fmt(b.tokens,0)}개</strong><br>장난감 RVQ의 잔차 RMS <b>${q.rms.toExponential(2)}</b> · 예: 원래 값 0.91 → 복원 ${U.fmt(q.recon[2],4)}<br>코드북을 하나 더하면 오차는 약 4분의 1로 줄고 토큰은 ${U.fmt(fr*10,0)}개 늘어납니다. 비트레이트와 토큰 수는 코드북 크기 1,024를 가정한 실제 계산, 오차는 2비트 양자화기 장난감 RVQ의 실제 계산입니다.`);});
};
})();
