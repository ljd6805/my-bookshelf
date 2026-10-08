/* 1~3장 실험: 앨리어싱, STFT 해상도, 멜 필터뱅크, 불균형 평가. 계산은 A07Math에서 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A07UI,M=A07Math,S=U.select,R=U.range;
A07Labs.alias=el=>{
 U.setup(el,R('tone','원래 음의 주파수 f (Hz)',100,12000,100,3000)+S('sr','샘플링 주파수 sr',[['8000','8 kHz (전화)'],['10000','10 kHz'],['16000','16 kHz (음성 인식)'],['24000','24 kHz (음성 합성)']],'16000'));
 U.bind(el,()=>{const f=U.value(el,'tone'),sr=U.value(el,'sr'),r=M.alias(f,sr),k=Math.round(f/sr),shift=f-k*sr;
  const dur=f>=1000?2:5,true_=[],ali=[],pts=[];
  for(let i=0;i<=400;i++){const t=dur*i/400/1000;true_.push([t*1000,Math.sin(2*Math.PI*f*t)]);ali.push([t*1000,Math.sin(2*Math.PI*shift*t)]);}
  for(let n=0;n/sr*1000<=dur;n++){const t=n/sr;pts.push([t*1000,Math.sin(2*Math.PI*f*t),'var(--orange)',4]);}
  const chart=U.plot({lines:[{data:true_,color:'var(--muted)',dashed:true},{data:ali,color:'var(--accent)'}],points:pts,xmin:0,xmax:dur,ymin:-1.1,ymax:1.1,xlabel:'시간 (ms)',ylabel:'크기',label:`${f} Hz 음을 ${sr} Hz로 찍은 점과, 그 점들을 지나는 ${U.fmt(r.apparent,0)} Hz 실선 곡선. 점선은 원래 음입니다.`});
  U.result(el,chart,`나이퀴스트 = ${sr} ÷ 2 = <b>${U.fmt(r.nyquist,0)} Hz</b> · 한 주기에 찍히는 점 <b>${U.fmt(r.samplesPerCycle,1)}개</b><br>${r.aliased?`원래 음 ${f} Hz가 나이퀴스트를 넘으므로 |${f} − ${sr} × ${k}| = <strong>${U.fmt(r.apparent,0)} Hz</strong>로 접혀 보입니다. 찍힌 점만으로는 원래 음과 구별할 수 없습니다.`:`원래 음 ${f} Hz가 나이퀴스트 아래이므로 점들은 <strong>${U.fmt(r.apparent,0)} Hz</strong> 그대로를 나타냅니다.`}<br>필터 없이 찍었다고 가정한 사인파 하나를 실제로 계산했습니다.`);});
};
function tfView(r,win){
 const fx=v=>40+(v-900)/240*400,tx=v=>40+v/120*400,blob=(cx,hw,y,c)=>`<rect x="${Math.max(40,cx-hw)}" y="${y}" width="${Math.min(440,cx+hw)-Math.max(40,cx-hw)}" height="36" rx="8" fill="${c}" opacity=".55"/>`;
 let b='<text x="40" y="24">주파수 방향 · 1,000 Hz와 1,040 Hz 두 음</text>';
 b+=`<path d="M40 92H440" stroke="var(--line)"/>`+[900,1000,1100].map(v=>`<path d="M${fx(v)} 92v6" stroke="var(--muted)"/><text x="${fx(v)}" y="114" text-anchor="middle">${v}</text>`).join('');
 const hwF=r.binHz/240*400;b+=blob(fx(1000),hwF,50,'var(--accent)')+blob(fx(1040),hwF,50,'var(--blue)');
 b+=`<text x="440" y="24" text-anchor="end" fill="${r.splitTones?'var(--accent)':'var(--orange)'}">${r.splitTones?'따로 보임':'한 덩어리'}</text>`;
 b+='<text x="40" y="160">시간 방향 · 40 ms와 55 ms의 두 딸깍 소리</text>';
 b+=`<path d="M40 228H440" stroke="var(--line)"/>`+[0,40,80,120].map(v=>`<path d="M${tx(v)} 228v6" stroke="var(--muted)"/><text x="${tx(v)}" y="250" text-anchor="middle">${v} ms</text>`).join('');
 const hwT=win/2/120*400;b+=blob(tx(40),hwT,186,'var(--accent)')+blob(tx(55),hwT,186,'var(--blue)');
 b+=`<text x="440" y="160" text-anchor="end" fill="${r.splitClicks?'var(--accent)':'var(--orange)'}">${r.splitClicks?'따로 보임':'한 덩어리'}</text>`;
 return U.svg(b,`창 ${win} ms: 빈 간격 ${U.fmt(r.binHz,1)} Hz로 두 음은 ${r.splitTones?'따로':'한 덩어리로'}, 두 딸깍 소리는 ${r.splitClicks?'따로':'한 덩어리로'} 보입니다.`);
}
A07Labs.stft=el=>{
 U.setup(el,R('win','STFT 창 길이 (ms)',5,100,5,25));
 U.bind(el,()=>{const w=U.value(el,'win'),r=M.stft({winMs:w});
  U.result(el,tfView(r,w),`창 ${w} ms = <b>${r.frameLen}샘플</b> · 주파수 빈 <b>${r.bins}개</b>, 간격 16,000 ÷ ${r.frameLen} = <strong>${U.fmt(r.binHz,1)} Hz</strong><br>홉 10 ms(${r.hop}샘플)로 10초를 자르면 프레임 <b>${r.frames}개</b>입니다.<br>40 Hz 떨어진 두 음: ${r.splitTones?'2빈 이상 떨어져 <strong>따로 보입니다</strong>':'2빈보다 가까워 <strong>한 덩어리</strong>입니다'}. 15 ms 떨어진 두 딸깍 소리: ${r.splitClicks?'창보다 멀어 <strong>따로 보입니다</strong>':'한 창 안에 들어가 <strong>한 덩어리</strong>입니다'}.<br>프레임 수와 빈 간격은 실제 계산이고, “따로 보임” 판정은 Hann 창 주엽을 2빈으로 본 단순 규칙입니다.`);});
};
function melView(b,n){
 const x=v=>30+v/8000*430;let body='';
 b.filters.forEach((f,i)=>{const c=f.empty?'var(--orange)':(i%2?'var(--blue)':'var(--accent)');body+=`<path d="M${x(f.lowHz)} 230L${x(f.centerHz)} 50L${x(f.highHz)} 230" fill="none" stroke="${c}" stroke-width="${f.empty?2.5:1.4}"${f.empty?' stroke-dasharray="4 3"':''}/>`;});
 body+=`<path d="M30 230H460" stroke="var(--line)"/>`+[0,2000,4000,6000,8000].map(v=>`<path d="M${x(v)} 230v6" stroke="var(--muted)"/><text x="${x(v)}" y="252" text-anchor="middle">${v/1000} kHz</text>`).join('');
 body+=`<text x="30" y="30">멜 필터 ${n}개 · 점선 필터는 FFT 빈이 하나도 없는 빈 필터</text>`;
 return U.svg(body,`멜 필터 ${n}개를 0~8 kHz에 그린 그림. 낮은 쪽은 촘촘하고 높은 쪽은 넓으며, 빈 필터가 ${b.empty}개입니다.`);
}
A07Labs.melbank=el=>{
 U.setup(el,R('nmels','멜 필터 개수 (n_mels)',10,128,2,80)+S('nfft','FFT 크기 (n_fft)',[['400','400 (25 ms 창)'],['1024','1024']],'400'));
 U.bind(el,()=>{const n=U.value(el,'nmels'),nfft=U.value(el,'nfft'),b=M.melBank(n,nfft),lo=b.filters[Math.min(2,n-1)],hi=b.filters.reduce((best,f)=>Math.abs(f.centerHz-4000)<Math.abs(best.centerHz-4000)?f:best);
  U.result(el,melView(b,n),`FFT 빈 간격 16,000 ÷ ${nfft} = <b>${U.fmt(b.binHz,1)} Hz</b><br>셋째 필터(중심 ${U.fmt(lo.centerHz,0)} Hz)의 폭 <b>${U.fmt(lo.widthHz,0)} Hz</b> · 4 kHz 근처 필터(중심 ${U.fmt(hi.centerHz,0)} Hz)의 폭 <b>${U.fmt(hi.widthHz,0)} Hz</b><br>빈 필터 <strong>${b.empty}개</strong>. ${b.empty?'낮은 쪽 필터 폭이 FFT 빈 간격보다 좁아져 어떤 빈도 담지 못한 필터가 생겼습니다. 이 필터들의 출력은 늘 0입니다.':'모든 필터가 FFT 빈을 하나 이상 담습니다.'}<br>원본 레슨의 멜 공식과 필터뱅크 구성을 그대로 계산한 결과입니다.`);});
};
const MODELS={majority:['늘 “배경”이라고 답함',[1,0,0]],knn:['MFCC k-NN 기준선',[.97,.7,.4]],balanced:['균형 샘플링 + SpecAugment',[.9,.88,.85]]};
A07Labs.imbalance=el=>{
 U.setup(el,R('alarms','화재 경보 클립 수 (배경 900 · 주전자 100)',5,300,5,10)+S('model','분류기',Object.entries(MODELS).map(([k,v])=>[k,v[0]]),'majority'));
 U.bind(el,()=>{const a=U.value(el,'alarms'),m=MODELS[U.text(el,'model')],r=M.classMetrics([900,100,a],m[1]);
  const chart=U.bars(['정확도','배경 재현율','주전자 재현율','경보 재현율','macro F1'],[r.accuracy*100,r.per[0].recall*100,r.per[1].recall*100,r.per[2].recall*100,r.macroF1*100],'%',null,1);
  U.result(el,chart,`${m[0]} · 전체 ${900+100+a}개 중 경보 ${a}개<br>정확도 <strong>${U.fmt(r.accuracy*100,1)}%</strong> · macro 재현율 <b>${U.fmt(r.macroRecall*100,1)}%</b> · macro F1 <b>${U.fmt(r.macroF1*100,1)}%</b><br>${r.accuracy-r.macroF1>.3?'정확도와 macro F1의 차이가 큽니다. 높은 정확도는 배경 소리가 많아서 생긴 숫자입니다.':'정확도와 macro F1이 크게 다르지 않습니다. 세 클래스를 고르게 맞히고 있습니다.'}<br>클래스별 재현율은 교육용 가정값이고, 혼동 행렬과 지표는 실제로 계산했습니다.`);});
};
})();
