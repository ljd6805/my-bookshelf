/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   규칙의 출처는 원본 커리큘럼 rohitg00/ai-engineering-from-scratch Phase 6 레슨(확인일 2026-10-08)이고,
   지연 시간·확률 분포·클래스 재현율 같은 숫자 가정은 각 함수 위에 적었다. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

/* 1장: 표본화와 앨리어싱. 샘플링 주파수 sr로 f Hz 사인을 찍으면 보이는 주파수는 sr의 정수배를 뺀 가장 가까운 값의 절댓값이다. */
function alias(f,sr){
 const nyquist=sr/2,apparent=Math.abs(f-sr*Math.round(f/sr));
 return {nyquist,apparent,aliased:f>nyquist,samplesPerCycle:sr/f};
}
/* 1장: n비트 정수 PCM의 단계 수와 이론적 양자화 SNR(사인파 기준 6.02n + 1.76 dB). */
function quantize(bits){return {levels:2**bits,maxInt:2**(bits-1)-1,snr:6.02*bits+1.76};}

/* 2장: STFT 창 크기와 해상도. Hann 창의 주엽 반폭을 약 2빈으로 보아, 두 음의 간격이 2빈 이상이면 따로 보인다고 판정한다. */
function stft({winMs,hopMs=10,sr=16000,clipS=10,toneGap=40,clickGapMs=15}){
 const frameLen=Math.round(sr*winMs/1000),hop=Math.round(sr*hopMs/1000),total=Math.round(clipS*sr);
 const frames=total<frameLen?0:1+Math.floor((total-frameLen)/hop),binHz=sr/frameLen,bins=Math.floor(frameLen/2)+1;
 return {frameLen,hop,frames,binHz,bins,splitTones:toneGap>=2*binHz,splitClicks:clickGapMs>=winMs};
}
/* 2장: 멜 척도와 삼각 필터뱅크(원본 레슨의 공식). 필터가 덮는 FFT 빈이 하나도 없으면 빈 필터로 센다. */
const hzToMel=f=>2595*Math.log10(1+f/700);
const melToHz=m=>700*(10**(m/2595)-1);
function melBank(nMels,nFft=400,sr=16000,fmin=0,fmax=sr/2){
 const lo=hzToMel(fmin),hi=hzToMel(fmax),edges=[];
 for(let i=0;i<nMels+2;i++)edges.push(melToHz(lo+(hi-lo)*i/(nMels+1)));
 const bins=edges.map(h=>Math.floor(h*nFft/sr));
 const filters=[];for(let m=0;m<nMels;m++){const left=bins[m],center=bins[m+1],right=bins[m+2];let weight=0;
  for(let k=left;k<right;k++)weight+=k<center?(k-left)/Math.max(1,center-left):(right-k)/Math.max(1,right-center);
  filters.push({lowHz:edges[m],centerHz:edges[m+1],highHz:edges[m+2],widthHz:edges[m+2]-edges[m],weight,empty:weight===0});}
 return {edges,bins,filters,empty:filters.filter(f=>f.empty).length,binHz:sr/nFft};
}

/* 3장: 불균형 데이터의 평가. 클래스별 재현율(가정값)로 혼동 행렬을 만들고, 틀린 몫은 나머지 클래스에 고르게 나눈다. */
function classMetrics(counts,recalls){
 const n=counts.length,m=counts.map((c,i)=>counts.map((_,j)=>i===j?c*recalls[i]:c*(1-recalls[i])/(n-1)));
 const total=counts.reduce((s,x)=>s+x,0),correct=m.reduce((s,r,i)=>s+r[i],0);
 const per=counts.map((c,i)=>{const predicted=m.reduce((s,r)=>s+r[i],0),precision=predicted?m[i][i]/predicted:0,recall=recalls[i];
  return {recall,precision,f1:precision+recall?2*precision*recall/(precision+recall):0};});
 return {matrix:m,accuracy:correct/total,macroRecall:per.reduce((s,p)=>s+p.recall,0)/n,macroF1:per.reduce((s,p)=>s+p.f1,0)/n,per};
}

/* 4장: CTC 축약. mode는 both(반복 합치기 후 공백 제거), repeat(반복만 합치기), blank(공백만 제거). */
function ctcCollapse(frames,mode='both',blank='_'){
 const out=[],steps=[];let prev=null;
 for(const f of frames){
  let keep;
  if(mode==='blank')keep=f!==blank;
  else if(mode==='repeat')keep=f!==prev;
  else keep=f!==prev&&f!==blank;
  steps.push(keep);if(keep)out.push(f);prev=f;
 }
 return {tokens:out,text:out.join(''),steps};
}
/* 4장·12장: 단어 단위 편집 거리와 대체(S)·삭제(D)·삽입(I) 개수. */
function wer(ref,hyp){
 const r=ref.trim().split(/\s+/).filter(Boolean),h=hyp.trim().split(/\s+/).filter(Boolean);
 const d=Array.from({length:r.length+1},(_,i)=>Array.from({length:h.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=r.length;i++)for(let j=1;j<=h.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(r[i-1]===h[j-1]?0:1));
 let i=r.length,j=h.length,S=0,D=0,I=0;const ops=[];
 while(i>0||j>0){
  if(i>0&&j>0&&d[i][j]===d[i-1][j-1]+(r[i-1]===h[j-1]?0:1)){const same=r[i-1]===h[j-1];if(!same)S++;ops.unshift([same?'=':'S',r[i-1],h[j-1]]);i--;j--;}
  else if(i>0&&d[i][j]===d[i-1][j]+1){D++;ops.unshift(['D',r[i-1],'']);i--;}
  else{I++;ops.unshift(['I','',h[j-1]]);j--;}
 }
 return {S,D,I,N:r.length,edits:d[r.length][h.length],wer:r.length?(S+D+I)/r.length:0,ops};
}
/* 4장: 채점 전 정규화. 소문자, 문장부호 제거, 이 책의 작은 숫자 사전으로 숫자를 한글로 바꾼다. */
const NUM={'5':'오','10':'십','30':'삼십','55':'오십오'};
function normalize(s){return s.toLowerCase().replace(/[.,!?~]/g,' ').replace(/(\d+)/g,(m)=>NUM[m]?NUM[m]+' ':m+' ').replace(/\s+/g,' ').trim();}

/* 5장: Whisper의 30초 창 나누기. 이웃한 창이 overlap초 겹친다고 단순화했다. 30초 창 하나는 log-mel 3000프레임, 인코더 출력 1500개다. */
function whisperChunks(clipS,overlap=5,win=30){
 const step=win-overlap,n=clipS<=win?1:Math.ceil((clipS-win)/step)+1,covered=(n-1)*step+win,padS=covered-clipS;
 const windows=[];for(let k=0;k<n;k++){const start=k*step;windows.push([start,Math.min(start+win,clipS)]);}
 return {n,padS,padShare:padS/covered,lastPad:win-(clipS-(n-1)*step),melFrames:n*3000,encFrames:n*1500,windows};
}
/* 5장: 오디오 언어모델의 프로젝터. 인코더 출력 50개/초를 pool개씩 묶어 LLM 토큰으로 넘긴다. */
function audioTokens(seconds,pool=1,rate=50){return Math.ceil(seconds*rate/pool);}
/* 5장: LoRA로 학습할 파라미터 수. 행렬마다 r×(입력+출력)개가 더해진다. */
function loraParams(r,d,matrices){return r*(d+d)*matrices;}

/* 6장: 정규분포 누적확률(Abramowitz–Stegun 7.1.26 근사, 오차 1.5e-7 이하). */
function phi(z){const t=1/(1+0.3275911*Math.abs(z)/Math.SQRT2),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-z*z/2);return z>=0?(1+y)/2:(1-y)/2;}
/* 6장: 같은 사람·다른 사람 점수가 정규분포를 따른다고 가정할 때 문턱 t의 오수락률·오거부율과 EER. */
function verify(t,{mg,mi,sd}){
 const far=1-phi((t-mi)/sd),frr=phi((t-mg)/sd),tEer=(mg+mi)/2;
 return {far,frr,tEer,eer:phi((mi-mg)/(2*sd))};
}
const normalPdf=(x,m,s)=>Math.exp(-((x-m)**2)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
/* 7장: 목소리 바꾸기. 화자 임베딩을 A에서 B로 alpha만큼 섞었을 때 각 화자와의 코사인 유사도. */
function cosine(a,b){const dot=a.reduce((s,x,i)=>s+x*b[i],0),na=Math.hypot(...a),nb=Math.hypot(...b);return na&&nb?dot/(na*nb):0;}
function mixVoice(a,b,alpha){const v=a.map((x,i)=>(1-alpha)*x+alpha*b[i]);return {v,toA:cosine(v,a),toB:cosine(v,b)};}

/* 7장: 길이 예측. 음절마다 기본 프레임 수를 speed로 나눠 반올림한다. 프레임 간격 hopMs와 출력 24 kHz는 이 책의 가정이다. */
function durations(base,speed,pause=0,hopMs=10,sr=24000){
 const frames=base.map(d=>Math.max(1,Math.round(d/speed)));const total=frames.reduce((s,x)=>s+x,0)+pause;
 const seconds=total*hopMs/1000;return {frames,total,seconds,samples:Math.round(seconds*sr),samples16k:Math.round(seconds*16000)};
}

/* 8장: 잔차 벡터 양자화(RVQ) 장난감. 코드북마다 2비트(4단계) 균등 양자화기로 앞 단계의 잔차를 다시 양자화한다. */
const RVQ_SIGNAL=[0.62,-0.18,0.91,-0.77,0.35,0.08,-0.54,0.27];
function rvq(signal,stages,levels=4){
 let residual=signal.slice(),range=1;const recon=signal.map(()=>0),errors=[];
 for(let k=0;k<stages;k++){
  const step=2*range/levels;
  residual=residual.map((r,i)=>{const idx=clamp(Math.floor((r+range)/step),0,levels-1),q=-range+(idx+.5)*step;recon[i]+=q;return r-q;});
  range=step/2;errors.push(Math.sqrt(residual.reduce((s,r)=>s+r*r,0)/residual.length));
 }
 return {recon,errors,rms:errors.length?errors[errors.length-1]:Math.sqrt(signal.reduce((s,r)=>s+r*r,0)/signal.length)};
}
/* 8장: 코덱 토큰의 양. 코드북 크기 1024(10비트)를 가정한다. */
function codecBudget(frameRate,codebooks,seconds=10,bitsPerCode=10){return {kbps:frameRate*codebooks*bitsPerCode/1000,tokens:frameRate*codebooks*seconds,frames:frameRate*seconds};}

/* 9장: 음성 비서 한 턴의 지연 예산. 단계별 기본값은 원본 레슨의 예산표이고 LLM 생성 속도는 가정값이다. */
const STAGES={mic:20,vad:10,asrStream:150,asrChunked:2000,llmFirst:100,tts:100,render:20};
function turnLatency({asr='stream',ttsAfter=20,tokPerSec=50,hangover=0}){
 const asrMs=asr==='stream'?STAGES.asrStream:STAGES.asrChunked,wait=Math.max(0,ttsAfter-1)/tokPerSec*1000;
 const parts=[['마이크 버퍼',STAGES.mic],['VAD',STAGES.vad],['침묵 대기',hangover],['음성 인식',asrMs],['LLM 첫 토큰',STAGES.llmFirst],['토큰 모으기',wait],['TTS 첫 조각',STAGES.tts],['스피커 출력',STAGES.render]];
 const total=parts.reduce((s,p)=>s+p[1],0);
 return {parts,total,feel:total<=500?'자연스러움':total<=1500?'로봇 같음':'고장 난 듯함'};
}

/* 10장: 부엌 장면의 프레임별 음성 확률(20 ms 프레임 60개). 7~27번이 실제 말(약하게 시작하는 "솔아"), 33~35번은 기침, 41~56번은 후드 팬 소리다. 시나리오 데이터이며 실제 VAD 출력이 아니다. */
const VAD_SCENE={frameMs:20,
 probs:[.12,.18,.42,.15,.1,.14,.2,.32,.36,.4,.43,.47,.58,.66,.9,.92,.88,.86,.9,.4,.22,.85,.91,.94,.92,.9,.87,.83,.15,.12,.1,.12,.1,.71,.76,.74,.12,.1,.11,.13,.1,.46,.52,.49,.55,.48,.51,.47,.53,.5,.46,.54,.49,.52,.47,.5,.48,.12,.1,.11],
 speech:[[7,27]],noise:[[2,2],[33,35],[41,56]]};
function vadRun(scene,threshold,minMs=250,prerollMs=0,gapMs=60){
 const {probs,frameMs}=scene,raw=probs.map(p=>p>threshold),segs=[];let s=-1;
 raw.concat(false).forEach((on,i)=>{if(on&&s<0)s=i;if(!on&&s>=0){segs.push([s,i-1]);s=-1;}});
 /* 쉼이 gapMs 이하이면 한 구간으로 잇는다(문장 안의 짧은 쉼). */
 for(let i=segs.length-1;i>0;i--)if((segs[i][0]-segs[i-1][1]-1)*frameMs<=gapMs){segs[i-1][1]=segs[i][1];segs.splice(i,1);}
 const minF=Math.ceil(minMs/frameMs),kept=segs.filter(([a,b])=>b-a+1>=minF),rejected=segs.length-kept.length;
 const [sa,sb]=scene.speech[0],inSpeech=([a,b])=>b>=sa&&a<=sb,hit=kept.filter(inSpeech);
 const onset=hit.length?Math.min(...hit.map(x=>x[0])):null,pre=Math.round(prerollMs/frameMs);
 const clipFrames=onset===null?sb-sa+1:Math.max(0,onset-pre-sa);
 const overrun=kept.reduce((n,[a,b])=>n+(inSpeech([a,b])?Math.max(0,sa-a)+Math.max(0,b-sb):0),0);
 return {raw,segs,kept,rejected,falseTriggers:kept.filter(x=>!inSpeech(x)).length,clipMs:clipFrames*frameMs,overrunMs:overrun*frameMs,detected:hit.length>0,onset};
}
/* 10장: 침묵 대기 시간과 말 끊김. 문장 안의 쉼이 대기 시간 이상이면 비서가 끼어든다. STT 미리보기 지연은 원본 레슨의 500 ms, 흘려보내기는 125 ms. */
function hangoverRun(pausesMs,hangoverMs,flush=true){
 const cuts=pausesMs.filter(p=>p>=hangoverMs).length,stt=flush?125:500;
 return {cuts,stt,latency:hangoverMs+stt,firstCut:pausesMs.findIndex(p=>p>=hangoverMs)};
}

/* 11장: 워터마크 검출. 16비트 중 k비트 이상 맞으면 검출로 본다. 비트마다 독립적으로 p 확률로 뒤집힌다고 가정한다. */
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
function atLeast(n,k,q){let s=0;for(let j=k;j<=n;j++)s+=binom(n,j)*q**j*(1-q)**(n-j);return s;}
function watermark(p,k=14,n=16){return {bra:1-p,detect:atLeast(n,k,1-p),falseAlarm:atLeast(n,k,.5),expectedBits:n*(1-p)};}

/* 12장: 집단별 WER의 가중 평균. 평균 하나가 특정 집단의 높은 오류를 가린다. */
function sliceWer(slices){const words=slices.reduce((s,x)=>s+x.share,0);const overall=slices.reduce((s,x)=>s+x.share*x.wer,0)/words;return {overall,worst:Math.max(...slices.map(x=>x.wer)),gap:Math.max(...slices.map(x=>x.wer))-overall};}

const A07Math={clamp,alias,quantize,stft,hzToMel,melToHz,melBank,classMetrics,ctcCollapse,wer,normalize,whisperChunks,audioTokens,loraParams,phi,verify,normalPdf,cosine,mixVoice,durations,RVQ_SIGNAL,rvq,codecBudget,STAGES,turnLatency,VAD_SCENE,vadRun,hangoverRun,binom,atLeast,watermark,sliceWer};
if(typeof module!=='undefined')module.exports=A07Math;else root.A07Math=A07Math;
})(typeof window!=='undefined'?window:globalThis);
