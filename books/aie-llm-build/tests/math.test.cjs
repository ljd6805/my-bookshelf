/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 원본 레슨과 인용 논문의 식으로 손계산해 맞춘 값이다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-3)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);

test('BPE: 병합할수록 토큰이 줄고, 인코딩은 바이트를 그대로 복원한다',()=>{
 const r=M.bpeTrain(M.DATA.corpus.ko,60);
 assert.equal(r.bytes,398);assert.equal(r.tokens[10],276);assert.equal(r.tokens[30],187);
 assert.equal(r.merges.length,49);assert.equal(r.tokens[r.tokens.length-1],149);
 for(let i=1;i<r.tokens.length;i++)assert.ok(r.tokens[i]<r.tokens[i-1]);
 const ids=M.bpeEncode(M.DATA.corpus.ko,r.merges),back=ids.flatMap(id=>M.tokenBytes(id,r.merges));
 assert.deepEqual(back,M.utf8(M.DATA.corpus.ko));
 assert.equal(M.bpeTrain(M.DATA.corpus.ko,0).merges.length,0);
});
test('BPE: 영어 병합표는 한국어 문장을 줄이지 못한다(다국어 세금)',()=>{
 const ko=M.bpeTrain(M.DATA.corpus.ko,60).merges,en=M.bpeTrain(M.DATA.corpus.en,60).merges,p=M.DATA.probes.ko;
 assert.equal(M.utf8(p).length,53);assert.equal(M.bpeEncode(p,ko).length,20);assert.equal(M.bpeEncode(p,en).length,53);
 assert.equal(M.showBytes([0xEC]),'‹EC›');assert.equal(M.showBytes(M.utf8(' 책')),'·책');
});
test('중복 제거: Jaccard, MinHash 추정, LSH 확률',()=>{
 const a=M.shingles(M.DATA.docs.a),b=M.shingles(M.DATA.docs.b),c=M.shingles(M.DATA.docs.c);
 near(M.jaccard(a,b),0.881);assert.equal(M.jaccard(a,c),0);assert.equal(M.jaccard(a,a),1);
 near(M.minhashEstimate(a,b,128),0.867,0.01);assert.equal(M.minhashEstimate(a,a,64),1);
 near(M.lshProb(0.8,16,8),0.947);near(M.lshProb(0.5,16,8),0.061);assert.equal(M.lshProb(1,16,8),1);assert.equal(M.lshProb(0,16,8),0);
});
test('패킹은 패딩보다 자리를 덜 낭비하고, 실제 토큰 수는 같다',()=>{
 const p=M.packing(M.DATA.lengths,1024);
 assert.equal(p.real,9457);assert.equal(p.padSeq,18);assert.equal(p.packSeq,10);near(p.padUtil,0.513);near(p.packUtil,0.924);
 for(const L of [512,2048,4096]){const q=M.packing(M.DATA.lengths,L);assert.ok(q.packUtil>=q.padUtil);assert.ok(q.packUtil<=1);}
});
test('바이그램 학습: ln V에서 시작해 빈도 바닥으로 내려간다',()=>{
 const d=M.bigramData(M.DATA.corpus.ko),r=M.bigramTrain(d,400,20);
 assert.equal(d.V,57);near(r.hist[0],Math.log(57));near(M.bigramFloor(d),0.9136);
 near(r.hist[400],0.925,0.005);assert.ok(r.hist[400]>=M.bigramFloor(d));
 const small=M.bigramTrain(d,50,5);for(let i=1;i<small.hist.length;i++)assert.ok(small.hist[i]<=small.hist[i-1]+1e-12);
});
test('Chinchilla: 같은 계산량에서 작은 모델·많은 데이터가 손실이 낮다',()=>{
 near(M.chinchillaLoss(70e9,1.4e12),1.9366);near(M.chinchillaLoss(280e9,300e9),1.9933);
 near(M.trainFlops(70e9,1.4e12),5.88e23,1e21);
 const o=M.chinchillaOptimal(5.88e23);near(o.N/1e9,32.4,1);near(o.D/1e12,3.03,0.1);
 assert.ok(M.chinchillaLoss(70e9,1.4e12)<M.chinchillaLoss(280e9,300e9));assert.ok(M.chinchillaLoss(1e30,1e30)>M.CH.E);
});
test('ZeRO 메모리: 논문의 7.5B·64 GPU 예와 일치한다',()=>{
 near(M.trainMemory(7.5,0,64).total,120);near(M.trainMemory(7.5,1,64).total,31.41,0.01);
 near(M.trainMemory(7.5,2,64).total,16.64,0.01);near(M.trainMemory(7.5,3,64).total,1.875,0.01);
 near(M.trainMemory(70,3,8).total,140);assert.equal(M.trainMemory(7,2,1).total,M.trainMemory(7,0,1).total);
});
test('활성값 체크포인팅: 저장량과 재계산 비용',()=>{
 const c={h:4096,a:32,L:32,s:8192,b:1};
 near(M.checkpointPlan(c,'none').bytes/1e9,380.1,0.1);near(M.checkpointPlan(c,'selective').bytes/1e9,36.5,0.1);
 near(M.checkpointPlan(c,'selective').overhead,0.0833,0.001);near(M.checkpointPlan(c,'full',1).bytes/1e9,14.03,0.01);
 assert.ok(M.checkpointPlan(c,'full',8).bytes>M.checkpointPlan(c,'full',1).bytes);
 near(M.checkpointPlan({...c,s:2048},'selective').overhead,0.0256,0.001);
});
test('GPipe 거품: 공식과 일정표가 같은 값을 낸다',()=>{
 for(const [P,M2] of [[4,1],[4,4],[4,16],[8,16],[1,8]]){const g=M.gpipeSchedule(P,M2);near(g.bubble,g.formula,1e-12);}
 near(M.gpipeSchedule(4,1).bubble,0.75);near(M.gpipeSchedule(4,16).bubble,0.1579);near(M.gpipeSchedule(4,16).relative,0.1875);
 assert.equal(M.gpipeSchedule(1,8).bubble,0);assert.equal(M.gpipeSchedule(4,16).peak1f1b,4);
});
test('SFT 손실 가리기: 응답 토큰만 평균한다',()=>{
 near(M.sftLoss(20,'all').loss,2.471);near(M.sftLoss(20,'seqlen').loss,0.329);near(M.sftLoss(20,'resp').loss,1.15);
 assert.equal(M.sftLoss(0,'all').loss,M.sftLoss(0,'resp').loss);
 assert.equal(M.sftLoss(5,'resp').loss,M.sftLoss(50,'resp').loss);
});
test('DPO와 Bradley-Terry',()=>{
 near(M.dpo(0,0.1).loss,Math.log(2));near(M.dpo(2,0.1).loss,0.598);near(M.dpo(2,0.5).loss,0.313);
 near(M.bradleyTerry(1).prob,0.731);near(M.dpo(3,0.2).prob+M.dpo(3,0.2).weight,1,1e-12);
 assert.ok(M.dpo(-2,0.1).loss>M.dpo(2,0.1).loss);
});
test('GRPO: 집단 이점의 평균은 0, 모두 같으면 신호가 없다',()=>{
 const g=M.groupAdvantages([1,0,1,1]);near(g.adv.reduce((a,b)=>a+b,0),0,1e-12);
 assert.deepEqual(M.groupAdvantages([1,1,1]).adv,[0,0,0]);
 near(M.grpoZeroSignal(16,0.1),0.185);near(M.grpoZeroSignal(8,0.1),0.4305);near(M.grpoZeroSignal(16,0.95),0.440);
 near(M.grpoEmpirical(8,0.1,2000),M.grpoZeroSignal(8,0.1),0.05);
});
test('ELO: 기대 승률과 점수 보존',()=>{
 near(M.eloExpected(1000,1000),0.5);near(M.eloExpected(1400,1000),0.909);
 const r=M.eloRun([1200,1000,800],16,300,1);near(r.R.reduce((a,b)=>a+b,0),3000,1e-6);assert.ok(r.R[0]>r.R[2]);
});
test('양자화: 비트가 많을수록, 채널별일수록 오차가 작다',()=>{
 const W=M.demoWeights();
 near(M.quantize(W,8,false).snr,34.5,0.2);near(M.quantize(W,8,true).snr,45.6,0.2);near(M.quantize(W,4,false).snr,11.3,0.2);near(M.quantize(W,4,true).snr,21.4,0.2);
 for(const b of [2,3,4,8])assert.ok(M.quantize(W,b,true).snr>=M.quantize(W,b,false).snr);
 assert.equal(M.quantize(W,4,false).levels,16);near(M.weightGB(70,16),140);near(M.weightGB(70,4),35);
});
test('추측 디코딩과 Hogwild 식',()=>{
 near(M.specDecode(0.6,5,0.05).E,2.38,0.01);near(M.specDecode(0.6,5,0.05).speedup,1.91,0.01);near(M.specDecode(0.9,5,0.05).E,4.69,0.01);
 near(M.specDecode(0.85,1,0).E,1.85);assert.equal(M.specDecode(1,4,0).E,5);assert.equal(M.specDecode(0,4,0).E,1);
 near(M.hogwild(10000,0.7,4,200).time,5550);near(M.hogwild(1000,0.3,4,200).speedup,0.63,0.01);
});
test('모델 설정에서 파라미터와 KV 캐시 계산',()=>{
 assert.equal(M.modelParams(M.MODELS.gpt2).total,124439808);assert.equal(M.modelParams(M.MODELS.llama3).total,8030261248);
 near(M.modelParams(M.MODELS.mixtral).total/1e9,46.70,0.01);near(M.modelParams(M.MODELS.mixtral).active/1e9,12.88,0.01);
 near(M.modelParams(M.MODELS.deepseek).total/1e9,671.03,0.05);near(M.modelParams(M.MODELS.deepseek).active/1e9,37.55,0.05);
 assert.equal(M.kvPerToken(M.MODELS.deepseek),70272);near(M.kvPerToken(M.MODELS.llama3)*131072/1e9,17.18,0.01);
 near(M.kvPerToken(M.MODELS.jamba)*262144/1e9,4.29,0.01);
});
test('NSA 키 수와 차등 어텐션 장난감',()=>{
 const n=M.nsaKeys(65536,64,16,64,512);assert.equal(n.keys,2560);near(n.ratio,25.6);
 const d=M.diffAttention(1024,6,0.8);near(d.stdSignal,0.283);near(d.stdNoise,0.717);assert.ok(Math.abs(d.diffNoise)<d.stdNoise);
 const z=M.diffAttention(1024,6,0);near(z.diffSignal,z.stdSignal,1e-12);
});
test('되돌리기 범위와 표지 예산',()=>{
 const s=M.rollback('sft');assert.equal(s.hours,246);assert.deepEqual(M.rollback('eval').stages.map(x=>x[0]),['eval']);
 assert.deepEqual(M.rollback('quant').stages.map(x=>x[0]),['quant','serve']);assert.equal(M.rollback('tok').stages.length,11);
 near(M.budget(8).trainGB,128);near(M.budget(70).flops,5.88e23,1e21);near(M.budget(70).int4GB,35);
});
test('80GB에 들어가는 최소 GPU 수',()=>{
 assert.equal(M.minGpus(70,3),14);assert.equal(M.minGpus(8,3),2);assert.equal(M.minGpus(8,0),Infinity);assert.equal(M.minGpus(0.124,0),1);
 for(const n of [1,2,4,8])assert.ok(M.trainMemory(8,3,n).total<=M.trainMemory(8,2,n).total);
});
