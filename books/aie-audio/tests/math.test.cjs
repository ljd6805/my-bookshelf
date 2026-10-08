/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-9,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} ≠ ${b}`);

test('alias: the lesson example folds 7 kHz at 10 kHz to 3 kHz; tones under Nyquist stay',()=>{
 assert.equal(M.alias(7000,10000).apparent,3000);assert.equal(M.alias(9000,16000).apparent,7000);
 assert.equal(M.alias(440,16000).apparent,440);assert.equal(M.alias(440,16000).aliased,false);
 assert.equal(M.alias(8000,16000).aliased,false);assert.equal(M.alias(16000,16000).apparent,0);
 for(let f=100;f<=12000;f+=700)for(const sr of [8000,10000,16000,24000])assert.ok(M.alias(f,sr).apparent<=sr/2+1e-9);
});
test('quantize: 16-bit PCM has 65,536 levels and about 98 dB',()=>{assert.equal(M.quantize(16).levels,65536);assert.equal(M.quantize(16).maxInt,32767);near(M.quantize(16).snr,98.08,1e-9);});
test('stft: 25 ms / 10 ms on 10 s at 16 kHz gives 998 frames, 201 bins, 40 Hz',()=>{
 const r=M.stft({winMs:25});assert.equal(r.frameLen,400);assert.equal(r.hop,160);assert.equal(r.frames,998);assert.equal(r.bins,201);assert.equal(r.binHz,40);
 assert.equal(M.stft({winMs:100}).splitTones,true);assert.equal(M.stft({winMs:100}).splitClicks,false);assert.equal(M.stft({winMs:10}).splitClicks,true);
 assert.equal(M.stft({winMs:25,clipS:.01}).frames,0);
 let prev=Infinity;for(let w=5;w<=100;w+=5){const b=M.stft({winMs:w}).binHz;assert.ok(b<prev);prev=b;}
});
test('mel: scale round-trips, 1000 Hz ≈ 1000 mel, more filters leave empty ones at n_fft 400',()=>{
 near(M.hzToMel(1000),1000,0.1);for(const f of [0,300,4000,8000])near(M.melToHz(M.hzToMel(f)),f,1e-6);
 const b80=M.melBank(80);assert.equal(b80.filters.length,80);assert.equal(b80.edges.length,82);near(b80.edges[81],8000,1e-6);
 assert.equal(M.melBank(40).empty,0);assert.ok(M.melBank(128).empty>M.melBank(80).empty);assert.equal(M.melBank(128,1024).empty,0);
 const f=b80.filters;assert.ok(f[70].widthHz>f[5].widthHz*5,'high filters are wider');
});
test('classMetrics: majority voter looks accurate but has macro recall 1/3',()=>{
 const r=M.classMetrics([900,100,10],[1,0,0]);near(r.accuracy,900/1010);near(r.macroRecall,1/3);assert.equal(r.per[2].f1,0);
 const p=M.classMetrics([50,50],[1,1]);assert.equal(p.accuracy,1);assert.equal(p.macroF1,1);
 const m=M.classMetrics([900,100,40],[.9,.88,.85]).matrix;m.forEach((row,i)=>near(row.reduce((s,x)=>s+x,0),[900,100,40][i],1e-9,'rows keep class counts'));
});
test('ctc: blank keeps a doubled symbol, repeats merge, both rules matter',()=>{
 const c=s=>s.split(' ');assert.equal(M.ctcCollapse(c('_ 5 5 _ 5 분 분 _')).text,'55분');assert.equal(M.ctcCollapse(c('_ 5 5 5 _ 분 분 _')).text,'5분');
 assert.equal(M.ctcCollapse(c('a a _ _ a b b _ c')).text,'aabc');assert.equal(M.ctcCollapse(c('_ _ _')).text,'');
 assert.equal(M.ctcCollapse(c('5 _ 5'),'repeat').text,'5_5');assert.equal(M.ctcCollapse(c('5 5 _ 분'),'blank').text,'55분');
});
test('wer: S, D, I counts and normalization',()=>{
 const ref='솔아 타이머 오 분 맞춰 줘';
 assert.equal(M.wer(ref,ref).wer,0);const d=M.wer(ref,'타이머 오 분 맞춰 줘');assert.equal(d.D,1);near(d.wer,1/6);
 const i=M.wer(ref,ref+' 시청해 주셔서 감사합니다');assert.equal(i.I,3);near(i.wer,.5);
 const s=M.wer(ref,'솔아 타이머 오십 분 맞춰 줘');assert.equal(s.S,1);assert.equal(s.edits,1);
 assert.ok(M.wer('a b','c d e f g').wer>1,'insertions can push WER past 100%');
 assert.equal(M.normalize('솔아, 타이머 5분 맞춰 줘.'),ref);assert.equal(M.wer(ref,M.normalize('솔아, 타이머 5분 맞춰 줘.')).wer,0);
 for(const h of ['타이머','솔아 오 분','x y z 솔아 타이머']){const r=M.wer(ref,h);assert.equal(r.S+r.D+r.I,r.edits);}
});
test('whisperChunks: 30 s windows, overlap, padding share',()=>{
 assert.equal(M.whisperChunks(30).n,1);assert.equal(M.whisperChunks(31).n,2);assert.equal(M.whisperChunks(600).n,24);assert.equal(M.whisperChunks(600,0).n,20);
 near(M.whisperChunks(2).padShare,28/30);assert.equal(M.whisperChunks(30).melFrames,3000);assert.equal(M.whisperChunks(30).encFrames,1500);
 assert.equal(M.audioTokens(30),1500);assert.equal(M.audioTokens(30,2),750);
 near(M.loraParams(8,1280,288)/1.55e9,0.0038,1e-4);
});
test('verify: EER threshold is the midpoint for equal spreads and FAR falls as the threshold rises',()=>{
 near(M.phi(0),.5,1e-7);near(M.phi(1.96),.975,1e-4);near(M.phi(-1.96)+M.phi(1.96),1,1e-7);
 const d={mg:.75,mi:.3,sd:.08},r=M.verify(.525,d);near(r.tEer,.525);near(r.far,r.frr,1e-6);near(r.eer,r.far,1e-6);
 assert.ok(M.verify(.7,d).far<M.verify(.4,d).far);assert.ok(M.verify(.7,d).frr>M.verify(.4,d).frr);
 assert.ok(M.verify(.5,{mg:.58,mi:.3,sd:.12}).eer>r.eer,'noise raises EER');
 near(M.cosine([1,0],[0,1]),0);near(M.cosine([2,0],[5,0]),1);near(M.mixVoice([1,0],[0,1],0).toA,1);
});
test('durations: speed divides frames and rounds; totals agree',()=>{
 const base=[12,8,10,9,14,13,9,15],r=M.durations(base,1);assert.equal(r.total,90);near(r.seconds,.9);assert.equal(r.samples,21600);
 assert.equal(M.durations(base,1.5).total,60);assert.equal(M.durations(base,1,20).total,110);assert.ok(M.durations(base,100).frames.every(f=>f===1));
});
test('rvq: each codebook shrinks the residual; codec budget matches the lesson',()=>{
 const e=M.rvq(M.RVQ_SIGNAL,8).errors;for(let i=1;i<e.length;i++)assert.ok(e[i]<e[i-1]);
 const q=M.rvq(M.RVQ_SIGNAL,8);M.RVQ_SIGNAL.forEach((x,i)=>near(q.recon[i],x,1e-4));
 assert.equal(M.codecBudget(12.5,8).tokens,1000);assert.equal(M.codecBudget(75,8).kbps,6);assert.equal(M.codecBudget(12.5,8).frames,125);
});
test('turnLatency: lesson budget sums to 400 ms; waiting for tokens and chunked ASR add time',()=>{
 assert.equal(M.turnLatency({ttsAfter:1}).total,400);near(M.turnLatency({ttsAfter:20}).total,780,1e-9);
 assert.ok(M.turnLatency({asr:'chunked',ttsAfter:1}).total>1500);assert.equal(M.turnLatency({ttsAfter:1,hangover:700}).total,1100);
 assert.equal(M.turnLatency({ttsAfter:1}).feel,'자연스러움');
});
test('vadRun: threshold trades clipped onset against fan false triggers; pre-roll removes the clip',()=>{
 const S=M.VAD_SCENE;assert.equal(S.probs.length,60);
 const lo=M.vadRun(S,.3),mid=M.vadRun(S,.5),hi=M.vadRun(S,.7);
 assert.equal(lo.clipMs,0);assert.equal(lo.falseTriggers,1);assert.equal(mid.clipMs,100);assert.equal(mid.falseTriggers,0);assert.ok(hi.clipMs>mid.clipMs);
 assert.equal(M.vadRun(S,.5,250,300).clipMs,0);assert.equal(M.vadRun(S,.95).detected,false);
 assert.ok(mid.rejected>=1,'cough is rejected as too short');
});
test('hangoverRun: shorter hangover cuts mid-sentence pauses; flush saves 375 ms',()=>{
 assert.equal(M.hangoverRun([300,650],250).cuts,2);assert.equal(M.hangoverRun([300,650],400).cuts,1);assert.equal(M.hangoverRun([300,650],700).cuts,0);
 assert.equal(M.hangoverRun([300,650],700,false).latency-M.hangoverRun([300,650],700,true).latency,375);
});
test('watermark: binomial probabilities, false alarm independent of p, monotone in p',()=>{
 assert.equal(M.binom(16,8),12870);near([...Array(17).keys()].reduce((s,j)=>s+M.binom(16,j)*.3**j*.7**(16-j),0),1,1e-12);
 near(M.watermark(0).detect,1);near(M.watermark(.5,14).detect,M.watermark(.5,14).falseAlarm,1e-12);near(M.watermark(0,14).falseAlarm,137/65536,1e-12);
 assert.ok(M.watermark(.45).detect<.01);assert.ok(M.watermark(.02).detect>.99);
 let prev=2;for(let p=0;p<=.5;p+=.05){const d=M.watermark(p).detect;assert.ok(d<=prev);prev=d;}
});
test('sliceWer: weighted mean hides the worst slice',()=>{
 const r=M.sliceWer([{share:95,wer:4},{share:5,wer:30}]);near(r.overall,5.3,1e-9);assert.equal(r.worst,30);
 near(M.sliceWer([{share:100,wer:4},{share:0,wer:30}]).overall,4);
});
