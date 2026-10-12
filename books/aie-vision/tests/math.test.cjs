/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,`${a} ≉ ${b}`);
const sum=a=>a.reduce((s,x)=>s+x,0);

test('1장 합성곱 출력 크기·수용 영역·매개변수',()=>{
 assert.equal(M.convOut(224,3,1,1),224);assert.equal(M.convOut(224,3,1,2),112);assert.equal(M.convOut(224,3,0,1),222);
 assert.equal(M.convOut(3,3,0,1),1);
 assert.deepEqual(M.receptive([{k:3,s:1},{k:3,s:1}]),[3,5]);assert.deepEqual(M.receptive([{k:3,s:2},{k:3,s:2}]),[3,7]);
 assert.equal(M.convParams(3,64,3),64*27+64);
 const out=M.conv2d([[1,2,3],[4,5,6],[7,8,9]],[[0,0,0],[0,1,0],[0,0,0]]);assert.equal(out[0][0],5);
});
test('1장 전처리: 올바른 순서는 차이 0, 실수는 차이가 생긴다',()=>{
 const ok=M.preprocess([200,100,50],'ok');assert.equal(ok.gap,0);near(ok.ok[0],(200/255-0.485)/0.229);
 assert.ok(M.preprocess([200,100,50],'raw').gap>100);assert.ok(M.preprocess([200,100,50],'nostd').gap>0.5);
 assert.ok(M.preprocess([200,100,50],'bgr').gap>1);assert.equal(M.preprocess([128,128,128],'bgr').gap,0);
});
test('2장 잔차: 지름길은 기울기 1, 평범한 망은 a^L',()=>{
 const r=M.residual(30,0.8);near(r.plain,0.8**30);assert.equal(r.identity,1);assert.equal(r.paths,2**30);
 assert.ok(M.residual(50,0.8).plain<r.plain);
});
test('2장 ViT 패치 수와 쌍',()=>{
 assert.deepEqual(M.vit(224,16,true),{grid:14,patches:196,seq:197,pairs:197*197,dropped:0});
 assert.equal(M.vit(448,16,false).patches,4*196);assert.equal(M.vit(224,8,false).patches,784);
 assert.ok(M.vit(230,16,false).dropped>0);
});
test('3장 소프트맥스·라벨 스무딩·교차 엔트로피',()=>{
 const p=M.softmax([2,1,0]);near(sum(p),1);assert.ok(p[0]>p[1]&&p[1]>p[2]);
 assert.ok(M.softmax([2,1,0],0.5)[0]>p[0]);near(M.softmax([1000,0])[0],1);
 const t=M.smoothTarget(4,0.2,0);near(sum(t),1);near(t[0],0.8);
 near(M.crossEntropy([1,0,0],[1,0,0]),0);assert.ok(M.crossEntropy([1-1e-12,4e-13,3e-13,3e-13],t)>1);
});
test('4장 IoU와 NMS',()=>{
 near(M.iou([0,0,10,10],[0,0,10,10]),1);assert.equal(M.iou([0,0,10,10],[20,20,30,30]),0);near(M.iou([0,0,10,10],[5,0,15,10]),50/150);
 near(M.iou([0,0,4,4],[2,2,6,6]),M.iou([2,2,6,6],[0,0,4,4]));
 const c=[{box:[0,0,10,10],score:.9},{box:[1,1,11,11],score:.8},{box:[50,50,60,60],score:.7},{box:[0,0,10,10],score:.1}];
 const r=M.nms(c,0.45,0.3);assert.deepEqual(r.kept,[0,2]);assert.equal(r.removed[0].by,0);assert.deepEqual(r.below,[3]);
 assert.equal(M.nms(c,0.99,0).kept.length,3);
});
test('4장 검출 AP: 손으로 센 작은 예, 경계값',()=>{
 /* 정답 둘, 예측 셋(정답 1과 같은 상자, 그 중복, 아무 정답과도 안 겹치는 상자): TP·FP·FP → 재현율 1/2에서 정밀도 1, AP = 0.5 */
 const g=[[0,0,10,10],[20,20,30,30]],d=[{box:[0,0,10,10],score:.9},{box:[0,0,10,10],score:.8},{box:[50,50,60,60],score:.7}];
 const r=M.detAP(d,g,0.5);assert.deepEqual(r.rows.map(x=>x.tp),[true,false,false]);assert.deepEqual([r.tp,r.fp,r.fn],[1,2,1]);
 near(r.ap,0.5);near(r.rows[2].precision,1/3);assert.deepEqual(r.env.map(v=>+v.toFixed(6)),[1,0.5,0.333333]);
 /* 점수 순서: 입력 순서와 상관없이 점수가 높은 예측이 먼저 정답을 차지한다 */
 assert.equal(M.detAP([d[2],d[1],d[0]],g,0.5).rows[0].score,.9);
 /* IoU가 문턱과 정확히 같으면 TP(≥). [0,0,10,5]와 [0,0,10,10]의 IoU는 50/100 */
 assert.equal(M.detAP([{box:[0,0,10,5],score:1}],[[0,0,10,10]],0.5).tp,1);assert.equal(M.detAP([{box:[0,0,10,5],score:1}],[[0,0,10,10]],0.51).tp,0);
 /* 예측이 없으면 정밀도는 정의되지 않음(NaN), 재현율·AP 0. 정답이 없으면 AP는 정의되지 않음 */
 const e=M.detAP([],g,0.5);assert.ok(Number.isNaN(e.precision));assert.equal(e.recall,0);assert.equal(e.ap,0);assert.equal(e.fn,2);
 assert.ok(Number.isNaN(M.detAP(d,[],0.5).ap));
});
test('4장 AP 실험 장면: Python 분수 계산과 대조한 대표값과 불변 조건',()=>{
 /* labs-scene.js와 같은 예시 상자. 기대값은 분수로 IoU·매칭·모든 점 보간을 따로 계산한 값이다. */
 const C=[[40,110,190,230,.92],[52,118,200,236,.81],[30,100,175,225,.55],[172,114,318,234,.88],[185,120,330,240,.40],[335,30,420,238,.76],[322,42,410,250,.35]].map(([a,b,c,e,s])=>({box:[a,b,c,e],score:s}));
 const G=[[44,112,194,232],[196,122,338,242],[333,34,418,242]];
 near(M.iou(C[3].box,G[1]),0.6539050535987749);near(M.iou(C[4].box,G[1]),0.8488297187030277);near(M.iou(C[3].box,C[4].box),0.7673853628909809);
 const ev=(match,minScore,nmsThr)=>M.detEval(C,G,{match,minScore,nmsThr});
 const cases=[[0.5,0.3,null,3,4,0,11/12],[0.5,0.3,0.45,3,0,0,1],[0.75,0.3,null,3,4,0,2/3],[0.75,0.3,0.45,2,1,1,5/9],[0.75,0.5,null,2,3,1,2/3],[0.5,0.8,null,2,1,1,11/12],[0.75,0.8,null,1,2,2,2/3],[0.5,0.95,null,0,0,3,11/12]];
 for(const [m,s,n,tp,fp,fn,ap] of cases){const r=ev(m,s,n);assert.deepEqual([r.tp,r.fp,r.fn],[tp,fp,fn],`${m}/${s}/${n}`);near(r.ap,ap,1e-12);}
 near(ev(0.5,0.3,null).precision,3/7);near(ev(0.5,0.5,null).precision,3/5);near(ev(0.5,0.5,null).ap,11/12);
 /* NMS가 점수 높은 b1(3번)을 남기고 정답 B와 더 잘 맞는 b2(4번)를 지운 경우를 짚어 낸다 */
 assert.deepEqual(ev(0.75,0.3,0.45).lost,[4]);assert.deepEqual(ev(0.5,0.3,0.45).lost,[]);
 /* 불변 조건: TP+FN = 정답 수, TP+FP = 문턱 위 예측 수, 0 ≤ AP ≤ 1, AP는 점수 문턱(운영점)과 상관없다 */
 for(const m of [0.5,0.75])for(const n of [null,0.45]){let last=Infinity;
  for(let k=2;k<=19;k++){const r=ev(m,Math.round(k*5)/100,n);assert.equal(r.tp+r.fn,3);assert.equal(r.tp+r.fp,r.op.length);assert.ok(r.ap>=0&&r.ap<=1);if(last!==Infinity)near(r.ap,last,1e-12);last=r.ap;}}
});
test('5장 분할 지표: 작은 물체에서 정확도와 IoU가 갈린다',()=>{
 const m=M.segMetrics(1000,10,0,0);near(m.acc,0.99);assert.equal(m.iou,0);assert.equal(m.dice,0);
 const g=M.segMetrics(100,20,10,5);near(g.iou,10/25);near(g.dice,M.diceFromIou(g.iou));assert.equal(g.tn+g.fn+10+5,100);
 near(M.diceFromIou(1),1);near(M.diceFromIou(0),0);
});
test('6장 칼만 필터와 어텐션 비용',()=>{
 const k=M.kalman([0,1,2,null,4,5],0.5,4);assert.equal(k.length,6);assert.equal(k[3].k,0);
 k.forEach(s=>assert.ok(Number.isFinite(s.x)&&s.var>0));
 const lo=M.kalman([0,1,2,3],0.5,1),hi=M.kalman([0,1,2,3],0.5,200);assert.ok(lo[1].k>hi[1].k);
 const a=M.attnCost(1,196);near(a.joint,196*196);const b=M.attnCost(8,196);assert.ok(b.joint>b.divided);
});
test('7장 대조 학습과 MAE',()=>{
 near(M.cosine([1,0],[2,0]),1);near(M.cosine([1,0],[0,1]),0);
 const S=[[1,0.2],[0.1,0.9]],lo=M.infoNCE(S,0.07),hi=M.infoNCE(S,1);assert.ok(lo.loss<hi.loss);near(sum(lo.rows[0]),1);
 near(M.infoNCE([[0,0],[0,0]],1).loss,Math.log(2));
 const m=M.maeTokens(196,0.75);assert.equal(m.visible,49);assert.equal(m.visible+m.masked,196);near(m.share,49*49/196**2);
 assert.equal(M.maeTokens(196,0).visible,196);
});
test('8장 편집 거리·CER·CTC 접기',()=>{
 assert.equal(M.editOps('서울-A0427','서울-A0427').distance,0);assert.equal(M.editOps('서울-A0427','서울-AO427').distance,1);
 assert.equal(M.editOps('abc','').distance,3);assert.equal(M.editOps('','ab').distance,2);
 near(M.cer('서울-A0427','A0427'),3/8);
 assert.equal(M.ctcCollapse(['a','a','ε','a','b']),'aab');assert.equal(M.ctcCollapse(['ε','ε']),'');
});
test('9장 깊이 지표·부피 합성·스플랫 크기',()=>{
 assert.deepEqual(M.depthMetrics([1,2],[1,2]),{absRel:0,delta:1});near(M.depthMetrics([2,4],[1,2]).absRel,1);
 const c=M.composite([0.3,0.5,0.8],[[1,0,0],[0,1,0],[0,0,1]]);near(sum(c.w)+c.rest,1);
 assert.deepEqual(M.composite([1,0.5]).w,[1,0]);assert.equal(M.splatFloats(3),59);assert.equal(M.splatFloats(0),14);
});
test('10장 확산 일정과 CFG',()=>{
 near(M.alphaBar(0),1);assert.ok(M.alphaBar(500)<M.alphaBar(100));near(M.alphaBar(500),0.0786,1e-3);assert.ok(M.alphaBar(1000)<1e-3);
 assert.deepEqual(M.cfg([0.4,0.1],[0.55,0.3],0),[0.4,0.1]);near(M.cfg([0.4,0.1],[0.55,0.3],1)[0],0.55);
});
test('11장 정류 흐름: 곧은 길은 1단계로 정확, 휜 길은 단계가 늘수록 오차가 준다',()=>{
 near(M.flowEuler(1,0).err,0,1e-12);assert.deepEqual(M.flowPath(0,1),[0.1,0.5]);
 assert.ok(M.flowEuler(30,1).err<M.flowEuler(1,1).err);assert.ok(M.flowEuler(1,0.5).err>0.5);
});
test('12장 지연 예산',()=>{
 near(M.latency(640,'fp32').total,34.5);near(M.latency(1280,'fp32').total,97.5);near(M.latency(640,'int8').total,20.1);
 near(M.latency(640,'fp32').budget,1000/30);assert.ok(M.latency(320,'int8').total<M.latency(640,'int8').total);
});
test('night score scenario: threshold trades night precision for recall; retraining shifts the reflections',()=>{
 near(M.normCdf(0),0.5,1e-7);near(M.normCdf(1.96),0.975,1e-4);near(M.normCdf(-1)+M.normCdf(1),1,1e-7);
 const a=M.nightScore(0.5),b=M.nightScore(0.7),c=M.nightScore(0.5,'retrain');
 near(a.day.precision,0.972,0.001);near(a.night.precision,0.459,0.001);near(a.night.recall,0.952,0.001);near(a.night.fp,150*(1-M.normCdf((0.5-0.58)/0.12)),1e-9);
 assert.ok(b.night.precision>a.night.precision&&b.night.recall<a.night.recall,'raising the threshold trades recall for precision');near(b.night.recall,0.5,1e-6);
 near(c.night.precision,0.761,0.001);assert.ok(c.night.recall>a.night.recall);near(c.day.precision,a.day.precision,1e-12);
 for(const t of [0.3,0.6,0.9]){const r=M.nightScore(t);near(r.night.tp+r.night.fn,100,1e-9);assert.ok(r.night.precision<=1&&r.night.precision>=0);}
 const curve=M.nightCurves('base','night');assert.equal(curve.length,101);assert.ok(curve[70][1]>curve[70][2]&&curve[50][2]>curve[50][1]);
});
