/* 9~12장 실험: 지연 예산, VAD, 침묵 대기, 워터마크, 집단별 WER, 불만 진단. 계산은 A07Math에서 한다. */
(()=>{
'use strict';
const U=A07UI,M=A07Math,S=U.select,R=U.range;
const COLORS=['var(--muted)','var(--blue)','var(--orange)','var(--accent)','var(--blue)','var(--orange)','var(--accent)','var(--muted)'];
function stack(r){
 const max=Math.max(1600,r.total*1.05),x=v=>20+v/max*440;let b='',acc=0;
 r.parts.forEach(([n,v],i)=>{if(v<=0)return;b+=`<rect x="${x(acc)}" y="60" width="${Math.max(1,x(acc+v)-x(acc))}" height="44" fill="${COLORS[i]}" opacity=".8"/>`;acc+=v;});
 [[230,'사람 230'],[500,'500 자연'],[800,'800 목표'],[1500,'1,500 고장']].forEach(([v,l],i)=>{b+=`<path d="M${x(v)} 40V${130+i*28}" stroke="var(--line)" stroke-dasharray="4 4"/><text x="${x(v)+4}" y="${144+i*28}">${l}</text>`;});
 b+=`<text x="20" y="30">말이 끝난 뒤 첫 소리까지 ${Math.round(r.total)} ms</text><path d="M${x(r.total)} 52V112" stroke="var(--text)" stroke-width="2"/>`;
 return U.svg(b,`단계별 지연을 이어 붙인 막대. 합계 ${Math.round(r.total)} ms, 느낌은 ${r.feel}.`);
}
A07Labs.budget=el=>{
 U.setup(el,S('asr','음성 인식 방식',[['stream','스트리밍 (150 ms)'],['chunked','청크 방식 Whisper-Streaming (약 2 s)']],'stream')+R('ttsafter','TTS 시작 전 모을 LLM 토큰 (개)',1,60,1,20));
 U.bind(el,()=>{const r=M.turnLatency({asr:U.text(el,'asr'),ttsAfter:U.value(el,'ttsafter')});
  U.result(el,stack(r),`${r.parts.filter(p=>p[1]>0).map(p=>`${p[0]} ${Math.round(p[1])}`).join(' + ')} = <strong>${Math.round(r.total)} ms</strong><br>느낌: <b>${r.feel}</b>${r.total<=800?' · 원본 종합 과제의 800 ms 목표 안입니다.':' · 원본 종합 과제의 800 ms 목표를 넘습니다.'}<br>토큰을 적게 모을수록 빨라지지만 TTS가 문장 억양을 계획할 단어가 줄어듭니다. 단계별 값은 원본 레슨의 예산표, LLM 속도 초당 50토큰은 가정값이며 합은 실제로 계산했습니다. 침묵 대기는 다음 장에서 정하므로 0으로 두었습니다.`);});
};
function vadView(scene,r,t){
 const w=440/60,x=i=>20+i*w,y=p=>200-p*160;let b='';
 const [sa,sb]=scene.speech[0];b+=`<rect x="${x(sa)}" y="36" width="${(sb-sa+1)*w}" height="168" fill="var(--accent)" opacity=".1"/><text x="${x(sa)}" y="30">실제 말 “솔아…”</text><text x="${x(33)}" y="30">기침</text><text x="${x(43)}" y="30">후드 팬</text>`;
 scene.probs.forEach((p,i)=>{b+=`<rect x="${x(i)+1}" y="${y(p)}" width="${w-2}" height="${200-y(p)}" fill="${r.raw[i]?'var(--blue)':'var(--line)'}"/>`;});
 b+=`<path d="M20 ${y(t)}H460" stroke="var(--orange)" stroke-width="2" stroke-dasharray="6 4"/><text x="460" y="${y(t)-6}" text-anchor="end" fill="var(--orange)">문턱 ${t}</text>`;
 r.kept.forEach(([a,c])=>{b+=`<rect x="${x(a)}" y="216" width="${(c-a+1)*w}" height="14" rx="3" fill="var(--accent)"/>`;});
 b+=`<text x="20" y="252">아래 가로 띠 = 최종 발화 구간 (60프레임 × 20 ms)</text>`;
 return U.svg(b,`프레임 60개의 음성 확률 막대와 문턱 ${t}. 최종 발화 구간 ${r.kept.length}개.`);
}
A07Labs.vad=el=>{
 U.setup(el,R('vthr','VAD 문턱 (음성 확률)',.1,.9,.05,.5)+S('preroll','사전 버퍼',[['0','없음'],['300','300 ms']],'0'));
 U.bind(el,()=>{const t=U.value(el,'vthr'),pre=U.value(el,'preroll'),r=M.vadRun(M.VAD_SCENE,t,250,pre);
  U.result(el,vadView(M.VAD_SCENE,r,t),`문턱 ${U.fmt(t,2)} · 사전 버퍼 ${pre} ms<br>“솔아”의 잘린 앞부분 <strong>${r.detected?r.clipMs+' ms':'말 전체를 놓침'}</strong> · 잡음 오작동 <strong>${r.falseTriggers}번</strong> · 250 ms보다 짧아 버린 구간 <b>${r.rejected}개</b>${r.overrunMs?` · 발화 구간이 말 밖으로 ${r.overrunMs} ms 넘침`:''}<br>${r.falseTriggers?'후드 팬 소리가 250 ms 넘게 문턱을 넘어 발화로 잡혔습니다.':r.clipMs>0&&r.detected?'잡음은 걸렀지만 약하게 시작한 첫소리가 문턱 아래라 잘렸습니다.':r.detected?'잘림도 오작동도 없습니다.':'문턱이 너무 높아 말을 놓쳤습니다.'}<br>프레임 확률은 이 책이 만든 시나리오이고, 문턱·최소 길이·사전 버퍼 판정은 실제로 계산했습니다.`);});
};
const PAUSES=[300,650];
function hangView(h,r){
 const x=v=>20+v/5200*440,segs=[[0,500,'1'],[800,1300,'2'],[1950,3000,'3']];let b='<text x="20" y="30">1 솔아 · 2 음… · 3 타이머 오 분 맞춰 줘</text>';
 segs.forEach(([s,e,l])=>{b+=`<rect x="${x(s)}" y="46" width="${x(e)-x(s)}" height="34" rx="5" fill="var(--blue)" opacity=".75"/><text x="${(x(s)+x(e))/2}" y="70" text-anchor="middle" fill="var(--text)">${l}</text>`;});
 [[500,800],[1300,1950]].forEach(([s,e],i)=>{const cut=PAUSES[i]>=h,y=112+i*30;b+=`<text x="20" y="${y}" fill="${cut?'var(--orange)':'var(--muted)'}">쉼 ${i+1}: ${PAUSES[i]} ms → ${cut?'끼어듦 ✕':'기다림 ✓'}</text>`;if(cut)b+=`<path d="M${x(s+h)} 40V86" stroke="var(--orange)" stroke-width="4"/>`;});
 b+=`<rect x="${x(3000)}" y="180" width="${x(3000+h)-x(3000)}" height="26" fill="var(--orange)" opacity=".7"/><rect x="${x(3000+h)}" y="180" width="${x(3000+h+r.stt)-x(3000+h)}" height="26" fill="var(--accent)" opacity=".8"/><text x="20" y="200">대답까지</text><text x="20" y="250">대기 ${h} + STT ${r.stt} = ${r.latency} ms</text>`;
 return U.svg(b,`쉼 300 ms와 650 ms가 있는 발화에서 침묵 대기 ${h} ms. 끼어든 횟수 ${r.cuts}번, 대답 지연 ${r.latency} ms.`);
}
A07Labs.hangover=el=>{
 U.setup(el,R('hang','침묵 대기 시간 (ms)',100,1500,50,500)+S('flush','STT 마무리',[['yes','흘려보내기 (125 ms)'],['no','미리보기 지연을 기다림 (500 ms)']],'yes'));
 U.bind(el,()=>{const h=U.value(el,'hang'),r=M.hangoverRun(PAUSES,h,U.text(el,'flush')==='yes');
  U.result(el,hangView(h,r),`문장 안의 쉼 300 ms, 650 ms · 침묵 대기 ${h} ms<br>말 중간에 끼어든 횟수 <strong>${r.cuts}번</strong>${r.cuts?` (첫 끼어듦: ${PAUSES[r.firstCut]} ms 쉼)`:''}<br>말이 끝난 뒤 대답이 시작되기까지 ${h} + ${r.stt} = <strong>${r.latency} ms</strong>${r.latency>800?' · 굼뜨게 느껴집니다.':''}<br>쉼 길이는 이 책의 시나리오, 흘려보내기 수치는 원본 레슨의 값이며 판정과 합은 실제로 계산했습니다.`);});
};
A07Labs.watermark=el=>{
 U.setup(el,R('ber','비트 하나가 뒤집힐 확률 p',0,.5,.01,.02)+S('k','검출로 인정하는 최소 일치 비트',[['12','16비트 중 12비트'],['14','16비트 중 14비트'],['16','16비트 모두']],'14'));
 U.bind(el,()=>{const p=U.value(el,'ber'),k=U.value(el,'k'),r=M.watermark(p,k),wm=[],cl=[];
  for(let j=0;j<=16;j++){wm.push([j,M.binom(16,j)*(1-p)**j*p**(16-j)]);cl.push([j,M.binom(16,j)/65536]);}
  const ymax=Math.max(.3,...wm.map(v=>v[1]))*1.05;
  const chart=U.plot({lines:[{data:wm,color:'var(--accent)'},{data:cl,color:'var(--blue)'},{data:[[k-.5,0],[k-.5,ymax]],color:'var(--orange)',dashed:true}],xmin:0,xmax:16,ymin:0,ymax,xlabel:'맞은 비트 수',ylabel:'확률',label:`워터마크가 있는 소리(산호색)와 없는 소리(파랑)의 맞은 비트 수 분포, 기준 ${k}비트(점선)`});
  U.result(el,chart,`비트 복원율 ${U.fmt(r.bra,2)} · 기대 일치 <b>${U.fmt(r.expectedBits,1)}비트</b> · 기준 ${k}비트 이상<br>워터마크 검출 확률 <strong>${U.fmt(r.detect*100,2)}%</strong> · 워터마크 없는 소리의 오탐 확률 <strong>${U.fmt(r.falseAlarm*100,3)}%</strong><br>${r.detect<.5?'공격으로 비트가 많이 뒤집혀 워터마크를 거의 찾지 못합니다. 위조 탐지기가 대신 막아야 합니다.':'워터마크가 살아남아 대부분 검출됩니다.'}<br>비트가 독립적으로 뒤집힌다는 가정 아래 이항 분포를 실제로 계산했습니다.`);});
};
A07Labs.slices=el=>{
 U.setup(el,R('elder','어르신 목소리의 단어 비율 (%)',0,50,5,10)+R('ewer','어르신 집단의 WER (%)',5,50,1,30));
 U.bind(el,()=>{const e=U.value(el,'elder'),ew=U.value(el,'ewer'),r=M.sliceWer([{share:100-e,wer:4},{share:e,wer:ew}]);
  U.result(el,U.bars(['일반 사용자','어르신','전체 평균'],[4,ew,r.overall],'WER %',20,1),`전체 WER = ${100-e}% × 4% + ${e}% × ${ew}% = <strong>${U.fmt(r.overall,1)}%</strong><br>최악 집단 WER <b>${ew}%</b>, 평균과의 차이 <b>${U.fmt(r.gap,1)}%포인트</b>. 세로 점선은 원본이 “대체로 쓸 수 없음”으로 본 20%입니다.<br>${e===0?'어르신 발화가 평가 세트에 없으면 평균은 이 집단에 대해 아무것도 말해 주지 않습니다.':ew>20&&r.overall<8?'평균은 괜찮아 보이지만 어르신에게 솔이는 쓸 수 없는 수준입니다.':'평균과 최악 집단을 함께 보고합니다.'}<br>집단별 WER은 원본의 경고를 바탕으로 한 가정값이며 가중 평균은 실제로 계산했습니다.`);});
};
const CASES={
 clip:['“솔아”의 첫 소리가 잘린다',{preroll:[1,'사전 버퍼 300 ms 또는 시작 문턱 0.3','잘린 발화 비율, VAD 켜짐 시각과 발화 시작의 차이','잘린 발화가 조용할 때만인지 팬이 돌 때도인지 나눈 기록']}],
 halluc:['조용할 때 자막 같은 문장을 적는다',{vadgate:[1,'VAD로 말소리만 넣고 condition_on_previous_text 끄기','삽입 오류 I의 수, 말소리 없는 입력의 비율','환각이 난 입력이 VAD를 거쳤는지 남긴 로그']}],
 slow:['대답이 굼뜨다',{flush:[1,'흘려보내기 사용, 침묵 대기 500~800 ms 안에서 조정','첫 소리 지연의 P50·P95, 말 중간 끼어듦 비율','어느 단계가 느린지 보여 주는 단계별 시각 기록']}],
 elder:['할머니 말을 자주 못 알아듣는다',{slice:[1,'연령대별 WER을 재고 해당 집단 음성으로 LoRA 미세조정','집단별 WER과 표본 수, 대체·삭제 비율','어르신 발화의 충분한 표본과 동의를 받은 녹음']}]};
const FIXES=[['preroll','사전 버퍼를 붙인다'],['vadgate','VAD로 걸러서 인식한다'],['flush','흘려보내기와 침묵 대기를 조정한다'],['slice','집단별로 재고 미세조정한다'],['bigger','더 큰 음성 인식 모델로 바꾼다']];
A07Labs.triage=el=>{
 U.setup(el,S('complaint','출시 후 들어온 불만',Object.entries(CASES).map(([k,v])=>[k,v[0]]),'clip')+S('fix','먼저 해 볼 방안',FIXES,'bigger'));
 U.bind(el,()=>{const c=CASES[U.text(el,'complaint')],fix=U.text(el,'fix'),right=Object.keys(c[1])[0],info=c[1][right],ok=fix===right,name=FIXES.find(f=>f[0]===fix)[1];
  const items=[['고른 방안',name,ok?'원인을 겨냥':'원인과 어긋남',ok],['원인을 겨누는 방안',info[1],'시나리오',true],['고친 뒤 확인할 지표',info[2],'다시 재기',true],['아직 부족한 증거',info[3],'되물을 것',false]];
  U.result(el,U.rows(items,'불만 진단 결과',c[0]),`판정: <strong>${ok?'원인을 겨누는 방안입니다':'이 불만의 원인을 겨누지 않습니다'}</strong><br>${ok?'고친 뒤에는 같은 조건에서 지표를 다시 재어 불만이 줄었는지 확인합니다.':fix==='bigger'?'더 큰 모델은 비용과 지연을 늘리면서도 VAD·버퍼·평가 방식의 문제는 그대로 둡니다.':'다른 불만에 맞는 처방입니다. 증상이 어느 장의 부품에서 나오는지 먼저 짚어 보세요.'}<br>불만과 원인의 연결은 이 책이 정한 시나리오이며, 실제 진단에는 로그와 지표가 필요합니다.`);});
};
})();
