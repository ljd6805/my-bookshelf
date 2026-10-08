/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-6,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} ≈ ${b}`);

test('기본 도구: 같은 시드는 같은 수열, Φ와 혼합 분포의 경계',()=>{
 const a=M.rng(3),b=M.rng(3);for(let i=0;i<5;i++)assert.equal(a(),b());
 near(M.Phi(0),0.5,1e-7);near(M.Phi(1.96),0.975,1e-3);near(M.Phi(-8),0,1e-6);
 near(M.mixProb(-50,50),1,1e-9,'전체 확률');near(M.mixProb(1.5,2.5),0.5*(2*M.Phi(1)-1),1e-6,'밤 장면 ±1σ');
 const xs=M.mixSamples(4000,1);near(M.mean(xs),0,0.15,'평균');near(M.std(xs),Math.sqrt(4+0.25),0.1,'표준편차');
});
test('1장 커널 밀도: 폭이 알맞으면 참값 근처, 넓으면 과소 추정, 좁으면 봉우리가 늘어난다',()=>{
 const ok=M.density(0.3),wide=M.density(1.5),thin=M.density(0.05);
 assert.ok(ok.errKde<0.02);assert.equal(ok.peaks,2);assert.ok(wide.kde<ok.kde&&wide.kde<ok.truth);assert.ok(thin.peaks>2);
 assert.ok(ok.hist>=0&&ok.hist<=1);
});
test('2장 병목: 버린 분산이 오차이고 k=8이면 0',()=>{
 near(M.bottleneck(8).error,0,1e-12);near(M.bottleneck(1).retained,5/9.77,1e-9);
 for(let k=1;k<8;k++)assert.ok(M.bottleneck(k+1).error<M.bottleneck(k).error);
});
test('2장 β-VAE 닫힌 해: 문턱 λ > β/2, 재구성 β/2, KL ½ln(2λ/β), β가 크면 완전 붕괴',()=>{
 const r=M.betaVae(1,[5,0.4]);assert.equal(r.active,1);near(r.dims[0].recon,0.5);near(r.dims[0].kl,0.5*Math.log(10));near(r.dims[1].recon,0.4);
 assert.equal(M.betaVae(0.1).active,7);assert.equal(M.betaVae(1).active,4);assert.equal(M.betaVae(5).active,1);
 const all=M.betaVae(12);assert.equal(all.active,0);near(all.kl,0);near(all.recon,M.LAMBDA.reduce((s,x)=>s+x,0),1e-9);
 /* 경계에서 연속: β = 2λ이면 재구성 λ, KL 0 */
 const edge=M.betaVae(2*0.6+1e-9,[0.6]);near(edge.recon,0.6,1e-6);near(edge.kl,0,1e-6);
 /* 닫힌 해가 실제로 최소인지: 활성 손실 < 붕괴 손실 */
 for(const b of [0.1,0.5,1,2]){const l=5;assert.ok(b/2+b*0.5*Math.log(2*l/b)<l);}
});
test('3장 GAN 축소 모형: 느린 생성자는 반반에 수렴, 빠른 생성자는 모드 붕괴',()=>{
 const calm=M.ganSim(2,2),wild=M.ganSim(16,2);
 near(calm.final,0.5,0.01);assert.equal(calm.collapse,false);assert.equal(wild.collapse,true);assert.ok(wild.swing>0.5);
 for(const [,g] of wild.trace)assert.ok(g>=0&&g<=1);
 const g=M.ganGrad(0.02);assert.ok(g.nonSaturating>40*g.saturating);
});
test('4장 L1·L2와 절단 ψ',()=>{
 const r=M.l1l2(0.7);near(r.l2,0.3,1e-12);assert.equal(r.l1,0);assert.equal(r.plausibleL2,false);assert.equal(r.plausibleL1,true);
 assert.equal(M.l1l2(1).l1,0);near(M.l1l2(1).l2,0,1e-12);assert.equal(M.l1l2(0.5).plausibleL1,false);
 const base=M.truncation(1);for(const p of [0,0.5,0.7,1.2])near(M.truncation(p).diversity,p*base.diversity,1e-9,'ψ배');
 assert.equal(M.truncation(0).inside,1);assert.ok(M.truncation(0.5).inside>base.inside);
});
test('5장 노이즈 스케줄: ᾱ는 단조 감소, 코사인이 중간 신호를 더 남긴다',()=>{
 for(const k of ['linear','cosine']){const ab=M.alphaBars(k);assert.equal(ab.length,1000);for(let i=1;i<1000;i++)assert.ok(ab[i]<=ab[i-1]);assert.ok(ab[999]<1e-3);}
 const l=M.schedule('linear',300),c=M.schedule('cosine',300);near(l.signal,0.63,0.01);near(c.signal,0.887,0.01);assert.ok(c.cross>l.cross);
 near(l.signal**2+l.noise**2,1,1e-12,'신호² + 잡음² = 1');
 near(M.alphaBars('linear')[0],1-1e-4,1e-12);
});
test('5장 정확한 잡음 예측과 DDIM: 1단계는 평균(흐림), 단계가 늘면 두 장면으로 갈라진다',()=>{
 near(M.epsStar(0,0.5),0,1e-12,'대칭점에서 0');
 const one=M.steps(1),many=M.steps(20);assert.equal(one.blur,1);assert.ok(many.scene>0.95);near(many.day,0.5,0.1);
 /* 단일 가우스면 x0 예측은 정확: t에서 x0=μ인 점의 예측 잡음은 0 */
 const a=0.3;near(M.epsStar(Math.sqrt(a)*2,a,M.NIGHT),0,1e-12);
 for(let k=1;k<10;k++)assert.ok(M.steps(k+1).scene>=M.steps(k).scene-0.02);
});
test('6장 가이던스: w=0은 조건부 분포, w가 클수록 평균이 밀리고 다양성이 준다',()=>{
 const w0=M.cfg(0),w3=M.cfg(3),w9=M.cfg(9);near(w0.mean,2,0.15);assert.equal(w0.day,0);
 assert.ok(w3.mean>w0.mean&&w9.mean>w3.mean);assert.ok(w9.std<w0.std);assert.ok(w9.over>0.8);
 near(M.latentSize(512,8,4).ratio,48,1e-9);
});
test('7장 LoRA와 SDEdit',()=>{
 const r=M.lora(640,16);assert.equal(r.full,409600);assert.equal(r.ada,20480);near(r.ratio,20,1e-12);
 near(M.lora(4096,64).ratio,32,1e-12);near(M.lora(100,50).ratio,1,1e-12,'r = d/2이면 같다');
 near(M.sdedit(0.05).keep,1,1e-6);assert.ok(M.sdedit(0.95).keep>0.5&&M.sdedit(0.95).keep<0.52);
 for(let s=0.1;s<0.95;s+=0.05)assert.ok(M.sdedit(s+0.05).keep<=M.sdedit(s).keep+1e-12);
});
test('8장 비디오·오디오·3D 수량',()=>{
 const v=M.video(10,1080,2);assert.equal(v.frames,240);assert.equal(v.raw,240*1920*1080*3);assert.equal(v.latentFrames,60);assert.equal(v.perFrame,68*120);assert.equal(v.tokens,489600);
 assert.ok(v.full>v.fact);near(M.video(10,1080,4).tokens/v.tokens,0.25,0.01);
 assert.equal(M.codec(8).tps,600);assert.equal(M.codec(8).bps,6000);near(M.splatMB(1e6),236,1e-9);
});
test('9장 플로 매칭: 곧은 길은 한 단계로 정확, 휜 길은 단계가 늘수록 기준에 가까워진다',()=>{
 assert.equal(M.flow(1,'rectified').err,0);
 const e1=M.flow(1).err,e4=M.flow(4).err,e20=M.flow(20).err;assert.ok(e1>e4&&e4>e20);assert.ok(M.flow(1).blur>0.9);
 const s=M.flow(4).straight;assert.ok(s>0.5&&s<1);
 /* t=0 근처의 속도는 단일 성분 안에서 x − μ 방향 성분을 갖는다 */
 near(M.flowVel(0,0.5),0,1e-12,'대칭점');
});
test('10장 VAR 잔차 척도: 척도를 더할수록 오차가 줄고 모두 쓰면 정확',()=>{
 for(let k=1;k<5;k++)assert.ok(M.varScales(k+1).mse<=M.varScales(k).mse);
 near(M.varScales(5).mse,0,1e-12);assert.equal(M.varScales(5).tokens2d,341);assert.equal(M.varScales(3).passes,3);
 near(M.mean(M.varScales(1).approx),M.mean(M.ROW),1e-12,'1×1은 전체 평균');
});
test('11장 FID: 같은 분포면 0, 이동과 다양성 손실에 따라 커지고, 표본이 적으면 치우친다',()=>{
 const I=[[1,0],[0,1]];near(M.fid2([0,0],I,[0,0],I),0,1e-12);near(M.fid2([0,0],I,[1,0],I),1,1e-12);
 near(M.fid2([0,0],I,[0,0],[[0.25,0],[0,0.25]]),0.5,1e-12,'σ=0.5');
 /* 대각이 아닌 공분산도 대칭: FID(a,b) = FID(b,a) */
 const S=[[1,0.5],[0.5,2]];near(M.fid2([0,0],S,[0.3,0],I),M.fid2([0.3,0],I,[0,0],S),1e-9);
 const small=M.fidLab(0,1,50),big=M.fidLab(0,1,10000);assert.ok(small.est>big.est);assert.ok(big.est<0.01);assert.ok(small.max-small.min>big.max-big.min);
 near(M.fidLab(1,0.6,50).exact,1+2*0.16,1e-12);near(M.cosine([1,0],[0,1]),0,1e-12);near(M.cosine([2,2],[1,1]),1,1e-12);
});
test('표지와 마지막 과제',()=>{
 assert.equal(M.forward(1).twoPeaks,true);assert.equal(M.forward(1000).twoPeaks,false);
 for(const s of Object.keys(M.TRIAGE)){const goods=Object.values(M.TRIAGE[s]).filter(v=>v[0]==='good');assert.equal(goods.length,1,s);}
 assert.equal(M.triage('fid','psi').verdict,'wrong');assert.equal(M.triage('samey','cfg').verdict,'good');assert.equal(M.triage('slow','steps').best,'distill');
});
