/* 4~6장 실험: CTC 축약, WER, Whisper 30초 창, 화자 확인 문턱. 계산은 A07Math에서 한다. */
(()=>{
'use strict';
const U=A07UI,M=A07Math,S=U.select,R=U.range;
const PATHS={a:'_ 5 5 5 _ 분 분 _',b:'_ 5 5 _ 5 분 분 _',c:'5 5 5 5 5 분 _ _',d:'_ 5 _ 5 _ 분 _ _'};
const MODES={both:'반복 합치기 → 공백 지우기 (CTC)',repeat:'반복 합치기만',blank:'공백 지우기만'};
A07Labs.ctc=el=>{
 U.setup(el,S('path','프레임별 최댓값 경로 (8프레임, _ = 공백)',Object.entries(PATHS).map(([k,v])=>[k,v]),'a')+S('mode','축약 규칙',Object.entries(MODES),'both'));
 U.bind(el,()=>{const frames=PATHS[U.text(el,'path')].split(' '),mode=U.text(el,'mode'),r=M.ctcCollapse(frames,mode),merged=M.ctcCollapse(frames,'repeat'),prev=i=>i?frames[i-1]:null;
  const items=frames.map((f,i)=>[f==='_'?'␣':f,r.steps[i]?'남김':(f==='_'&&mode!=='repeat'?'공백 삭제':f===prev(i)?'반복 합침':'삭제'),r.steps[i]?'keep':'drop']);
  U.result(el,U.cells(items,`프레임 ${frames.length}개의 축약 과정`,`${MODES[mode]}`),`프레임: ${frames.join(' ')}<br>${mode==='both'?`반복을 합치면 <b>${merged.tokens.join(' ')}</b>, 공백을 지우면 `:''}결과 <strong>${r.text.replace(/_/g,'␣')||'(빈 문자열)'}</strong><br>${mode==='both'?(r.text==='55분'?'두 5 사이에 공백이 있어 둘 다 살아남았습니다.':'연달아 나온 5가 하나로 합쳐졌습니다.'):mode==='repeat'?'공백이 남아 있어 글자가 아닌 기호가 출력에 섞였습니다.':'반복을 합치지 않아 같은 글자가 프레임 수만큼 늘어났습니다.'} 탐욕 디코딩의 축약 규칙을 실제로 적용한 결과입니다.`);});
};
const REF='솔아 타이머 오 분 맞춰 줘';
const HYPS={exact:['그대로 맞힘',REF],clip:['첫 단어 잘림','타이머 오 분 맞춰 줘'],sub:['숫자를 잘못 들음','솔아 타이머 오십 분 맞춰 줘'],ins:['침묵에서 지어낸 문장','솔아 타이머 오 분 맞춰 줘 시청해 주셔서 감사합니다'],format:['표기만 다름','솔아, 타이머 5분 맞춰 줘.']};
A07Labs.wer=el=>{
 U.setup(el,S('hyp','음성 인식 결과',Object.entries(HYPS).map(([k,v])=>[k,`${v[0]} · ${v[1]}`]),'exact')+S('norm','채점 전 정규화',[['on','함 (문장부호 제거, 숫자 풀기)'],['off','안 함 (띄어쓰기로만 나눔)']],'on'));
 U.bind(el,()=>{const raw=HYPS[U.text(el,'hyp')][1],norm=U.text(el,'norm')==='on',hyp=norm?M.normalize(raw):raw,r=M.wer(REF,hyp);
  const name={'=':'',S:'sub',D:'del',I:'ins'},lab={'=':'일치',S:'대체',D:'삭제',I:'삽입'};
  const items=r.ops.map(([op,a,b])=>[a||'·',`${b||'·'} (${lab[op]})`,name[op]]);
  U.result(el,U.cells(items,'정답 단어(위)와 인식 단어(아래)의 정렬',`정답: ${REF}`),`인식: ${hyp}<br>대체 S = <b>${r.S}</b> · 삭제 D = <b>${r.D}</b> · 삽입 I = <b>${r.I}</b> · 정답 단어 N = <b>${r.N}</b><br>WER = (${r.S} + ${r.D} + ${r.I}) ÷ ${r.N} = <strong>${U.fmt(r.wer*100,1)}%</strong>${!norm&&U.text(el,'hyp')==='format'?' · 같은 말인데 표기 때문에 오류로 세어졌습니다.':''}<br>단어 단위 편집 거리를 실제로 계산했습니다. 숫자 정규화는 이 책의 작은 사전만 씁니다.`);});
};
function timeline(clip,r){
 const total=Math.max(clip,30,...r.windows.map(w=>w[0]+30)),x=v=>30+v/total*420;let b=`<text x="30" y="26">녹음 ${clip}초 · 30초 창 ${r.n}개</text><rect x="${x(0)}" y="44" width="${x(clip)-x(0)}" height="22" rx="4" fill="var(--blue)" opacity=".7"/><text x="30" y="86">말소리</text>`;
 r.windows.forEach(([s,e],i)=>{const y=100+(i%4)*30,end=s+30;b+=`<rect x="${x(s)}" y="${y}" width="${x(Math.min(e,total))-x(s)}" height="20" rx="4" fill="var(--accent)" opacity=".75"/>`;if(end>clip)b+=`<rect x="${x(clip)}" y="${y}" width="${x(Math.min(end,total))-x(clip)}" height="20" rx="4" fill="var(--muted)" opacity=".55"/>`;});
 b+=`<text x="30" y="250">진한 막대 = 창이 덮은 소리 · 회색 = 덧댄 침묵</text><text x="450" y="270" text-anchor="end">0 ~ ${total}초</text>`;
 return U.svg(b,`${clip}초 녹음을 30초 창 ${r.n}개로 나누고 마지막 창에 침묵 ${U.fmt(r.lastPad,0)}초를 덧댄 그림`);
}
A07Labs.chunks=el=>{
 U.setup(el,R('clip','녹음 길이 (초)',1,600,1,45)+S('overlap','이웃한 창의 겹침',[['0','없음'],['5','5초']],'5'));
 U.bind(el,()=>{const c=U.value(el,'clip'),o=U.value(el,'overlap'),r=M.whisperChunks(c,o);
  U.result(el,timeline(c,r),`창 <strong>${r.n}개</strong> · 로그 멜 ${r.melFrames.toLocaleString('en-US')}프레임 · 인코더 출력 ${r.encFrames.toLocaleString('en-US')}개<br>마지막 창의 덧댄 침묵 <b>${U.fmt(r.lastPad,0)}초</b>, 창 전체에서 침묵 비율 <b>${U.fmt(r.padShare*100,1)}%</b>${r.padShare>.5?' · 대부분이 침묵이라 환각 위험이 큽니다. VAD로 말소리만 넣으세요.':''}<br>같은 소리를 오디오 언어모델에 넘기면 인코더 출력 초당 50개 기준 ${M.audioTokens(c,1).toLocaleString('en-US')}개, 2개씩 묶으면 ${M.audioTokens(c,2).toLocaleString('en-US')}개 토큰입니다.<br>창 나누기는 겹침을 단순화한 실제 계산이며, 실제 도구의 겹침 처리 방식과는 다를 수 있습니다.`);});
};
const CONDS={quiet:['조용한 부엌, 5초 발화',{mg:.75,mi:.3,sd:.08}],noisy:['후드 팬 소음',{mg:.58,mi:.3,sd:.12}],short:['2초 미만 짧은 발화',{mg:.62,mi:.32,sd:.15}]};
A07Labs.eer=el=>{
 U.setup(el,R('thr','판정 문턱 (코사인)',0,1,.01,.5)+S('cond','검증 녹음 조건',Object.entries(CONDS).map(([k,v])=>[k,v[0]]),'quiet'));
 U.bind(el,()=>{const t=U.value(el,'thr'),[name,d]=CONDS[U.text(el,'cond')],r=M.verify(t,d),g=[],i=[];
  for(let k=0;k<=100;k++){const x=k/100;g.push([x,M.normalPdf(x,d.mg,d.sd)]);i.push([x,M.normalPdf(x,d.mi,d.sd)]);}
  const ymax=Math.max(...g.map(p=>p[1]),...i.map(p=>p[1]))*1.1;
  const chart=U.plot({lines:[{data:g,color:'var(--accent)'},{data:i,color:'var(--blue)'},{data:[[t,0],[t,ymax]],color:'var(--orange)',dashed:true}],xmin:0,xmax:1,ymin:0,ymax,xlabel:'코사인 점수',ylabel:'밀도',label:`본인 점수(산호색 실선)와 다른 사람 점수(파란 실선) 분포, 문턱 ${t}(점선)`});
  U.result(el,chart,`${name} · 문턱 ${t}<br>오수락 FAR = <strong>${U.fmt(r.far*100,2)}%</strong> (다른 사람이 통과) · 오거부 FRR = <strong>${U.fmt(r.frr*100,2)}%</strong> (엄마가 거부됨)<br>이 조건의 EER은 문턱 ${U.fmt(r.tEer,3)}에서 <b>${U.fmt(r.eer*100,2)}%</b>입니다.<br>점수 분포는 교육용 가정값이고, 정규분포의 누적확률은 실제로 계산했습니다.`);});
};
})();
