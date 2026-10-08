/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,`${a} ≉ ${b}`);
const sum=a=>a.reduce((s,x)=>s+x,0);

test('기본 벡터 연산',()=>{
 assert.equal(M.sum([1,2,3]),6);assert.equal(M.dot([1,2],[3,4]),11);near(M.norm([3,4]),5);
 near(M.cos([1,0],[0,1]),0);near(M.cos([1,2],[2,4]),1);near(M.cos([1,0],[-1,0]),-1);
 near(M.logSumExp([0,0]),Math.log(2));near(M.logSumExp([1000,1000]),1000+Math.log(2));
 near(M.sigmoid(0),0.5);assert.ok(M.sigmoid(50)>0.999999);
});
test('1장 패치 토큰: ViT-B/16 224는 196+1, 한 변 두 배면 토큰 약 네 배',()=>{
 const r=M.patchTokens(224,224,16,1);assert.equal(r.patches,196);assert.equal(r.seq,197);assert.equal(r.pairs,197*197);assert.equal(r.dropped,0);
 assert.equal(M.patchTokens(448,448,16,1).patches,784);assert.equal(M.patchTokens(336,336,14,0).patches,576);
 const odd=M.patchTokens(230,230,16,0);assert.equal(odd.gh,14);assert.equal(odd.dropped,230*230-224*224);
 assert.equal(M.patchTokens(16,16,16,0).patches,1);
});
test('1장 ViT 파라미터: ViT-B/16 85,798,656, 해상도는 위치 표만 바꾼다',()=>{
 const a=M.vitParams(768,12,16,197),b=M.vitParams(768,12,16,785);assert.equal(a.total,85798656);
 assert.equal(a.blocks,b.blocks);assert.equal(a.patchEmbed,b.patchEmbed);assert.equal(b.total-a.total,(785-197)*768);
});
test('2장 InfoNCE·SigLIP: 완벽한 짝은 τ가 작을수록 손실이 0에 가깝다',()=>{
 const S=[[1,0],[0,1]],a=M.infoNCE(S,0.07),b=M.infoNCE(S,1);assert.ok(a.loss<1e-5);assert.ok(b.loss>a.loss);
 near(a.i2t,a.t2i);a.diag.forEach(p=>assert.ok(p>0.99999));
 const u=M.infoNCE([[0.5,0.5],[0.5,0.5]],0.1);near(u.loss,Math.log(2));
 const s1=M.sigmoidLoss(S,0.1,-10),s2=M.sigmoidLoss(S,0.1,-2);assert.ok(s1.loss>0);assert.ok(s1.diag.every(p=>p>0&&p<1));assert.notEqual(s1.loss,s2.loss);
 const T=M.simMatrix([[1,0],[0,1]],[[1,0],[1,1]]);near(T[0][0],1);near(T[0][1],Math.SQRT1_2);
});
test('3장 Q-Former 압축과 tanh 게이트',()=>{
 const q=M.qformer(256,32,8);assert.equal(q.mlp,2048);assert.equal(q.qf,256);assert.equal(q.ratio,8);assert.equal(q.saved,1792);assert.equal(q.crossPairs,32*256*8);
 assert.equal(M.qformer(256,256,1).saved,0);
 const h=M.gateTrain(0.3,30);assert.equal(h.length,31);assert.equal(h[0].gate,0);near(h[0].loss,0.36);near(h[1].alpha,0.36);
 near(h[30].gate,0.6,1e-3);assert.ok(h[30].loss<h[0].loss);
});
test('4장 문맥 예산: 넘치면 fits가 거짓',()=>{
 const r=M.contextBudget(8192,576,3,200);assert.equal(r.visual,1728);assert.equal(r.left,8192-1728-200);assert.ok(r.fits);
 const o=M.contextBudget(8192,2880,3,200);assert.equal(o.visual,8640);assert.ok(o.left<0);assert.equal(o.fits,false);
 assert.equal(M.contextBudget(4096,0,5,0).left,4096);
});
test('5장 해상도: AnyRes, 정사각형 채움, 원래 비율 28 단위',()=>{
 const a=M.anyres(600,1800);assert.equal(a.tokens,(a.tiles+1)*576);assert.ok(a.tiles>=1&&a.tiles<=4);
 assert.equal(M.anyres(672,672).tiles,4);assert.equal(M.anyres(336,336).tiles,1);
 const s=M.squarePad(600,1800);assert.equal(s.tokens,576);near(s.pad,2/3);near(M.squarePad(500,500).pad,0);
 const n=M.nativeTokens(1120,672);assert.equal(n.tokens,960);assert.equal(n.w%28,0);assert.equal(n.h%28,0);
 const c=M.nativeTokens(4096,4096,28,1280*784);assert.ok(c.w*c.h<=1280*784);assert.ok(c.tokens<=1280);
 const tiny=M.nativeTokens(20,20);assert.ok(tiny.w*tiny.h>=3136);
});
test('6장 영상 예산과 짧은 사건 포착',()=>{
 assert.equal(M.pooled(27,1),729);assert.equal(M.pooled(27,2),196);assert.equal(M.pooled(27,3),81);assert.equal(M.pooled(27,6),25);
 const v=M.videoBudget(60,4,81,32768);assert.equal(v.frames,240);assert.equal(v.tokens,19440);assert.ok(v.fits);near(v.fpsMax,32768/(60*81));
 assert.equal(M.videoBudget(90,4,729,32768).fits,false);
 const e=M.eventCatch(0.4,1);near(e.p,0.4);near(e.gap,1);assert.equal(M.eventCatch(0.3,4).p,1);near(M.eventCatch(0.3,2).p,0.6);
});
test('7장 이미지 토큰과 양자화: f를 반으로 하면 토큰 네 배, K는 토큰 수와 무관',()=>{
 const a=M.imageTokens(512,8,32768,30);assert.equal(a.tokens,4096);near(a.seconds,4096/30);assert.equal(a.bits,4096*15);
 assert.equal(M.imageTokens(512,16,8192,30).tokens,1024);assert.equal(M.imageTokens(512,16,256,30).tokens,1024);
 const q=M.quantize([0,1,0.5],3);assert.deepEqual(q.ids,[0,2,1]);near(q.mse,0);assert.equal(q.psnr,Infinity);
 const v=[0.12,0.47,0.83];assert.ok(M.quantize(v,16).mse>=M.quantize(v,256).mse);
});
test('8장 MaskGIT 일정과 하이브리드 마스크',()=>{
 const s=M.maskSchedule(1024,8);assert.equal(s.masked[0],1024);assert.equal(s.masked[8],0);assert.equal(sum(s.commit),1024);assert.equal(s.passes,8);
 for(let t=1;t<=8;t++)assert.ok(s.masked[t]<=s.masked[t-1]);assert.ok(s.commit[0]<s.commit[7]);
 const m=M.hybridMask(['t','i','i','t'],[0,1,1,0]);assert.deepEqual(m[1],[1,1,1,0]);assert.deepEqual(m[0],[1,0,0,0]);assert.deepEqual(m[3],[1,1,1,1]);
});
test('9장 첫 소리까지와 Talker 속도',()=>{
 assert.equal(M.ttfab([['a',60],['b',150],['c',40]]),250);
 const ok=M.talkerRate(80);assert.ok(ok.ok);near(ok.factor,1.6);assert.equal(ok.lagPerSec,0);
 const slow=M.talkerRate(40);assert.equal(slow.ok,false);near(slow.lagPerSec,0.25);assert.ok(M.talkerRate(50).ok);
});
test('10장 행동 칸 나누기와 제어 주기',()=>{
 const a=M.actionBin(0.337,256);assert.ok(a.err<=a.maxErr+1e-12);near(a.maxErr,1/256);
 assert.equal(M.actionBin(-1,256).index,0);assert.equal(M.actionBin(1,256).index,255);
 const r=M.actionRate(7,10,35);assert.equal(r.need,70);assert.equal(r.ok,false);near(r.maxHz,5);assert.ok(M.actionRate(7,5,35).ok);
 assert.equal(M.actionRate(7,10,35,8).need,70/8);
});
test('11장 MaxSim, 평균 점수, 저장량',()=>{
 const Q=[[1,0],[0,1]],P=[[1,0],[0,1],[1,1]];const r=M.maxSim(Q,P);near(r.score,2);assert.deepEqual(r.picks,[0,1]);
 assert.deepEqual(M.mean([[1,2],[3,4]]),[2,3]);near(M.pooledScore(Q,P),1);
 assert.ok(M.maxSim(Q,P).score<=Q.length+1e-12);
 assert.equal(M.storage(50,729,128,4),18662400);assert.equal(M.storage(50,1,768,4),153600);
});
test('12장 에이전트 성공률: 재시도는 단계 성공을 올리고, 감지율 0이면 같다',()=>{
 const a=M.agentSuccess(0.95,20,0.8);near(a.plain,0.95**20);near(a.step,0.95+0.05*0.8*0.95);assert.ok(a.retry>a.plain);
 const z=M.agentSuccess(0.95,20,0);near(z.retry,z.plain);assert.equal(M.agentSuccess(1,40,0).plain,1);
 assert.ok(M.agentSuccess(0.95,10).plain>a.plain);
});
