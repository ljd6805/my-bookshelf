/* 계산 모델의 대표값·경계값·불변 조건과, 본문·안내 상자에 적은 숫자를 실제 계산과 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const M=require('../js/math2.js');
const L=M.users(1),f3=x=>x.toFixed(3);
const memo={};const run=(k,fn)=>memo[k]??=fn();
const fed=(o,h=1)=>run(JSON.stringify([o,h]),()=>M.train(M.users(h),{C:.1,E:5,B:10,rounds:40,...o}));
/* 실험 파일을 창 없이 읽어 안내 상자의 글을 꺼낸다. */
function guides(){const ctx={window:{},console};ctx.window.FLMath=M;vm.createContext(ctx);vm.runInContext('var FLLabText={},FLGuideData={},FLLabs={},FLUI={};window.FLLabText=FLLabText;window.FLGuideData=FLGuideData;',ctx);
 for(const f of fs.readdirSync(path.join(base,'js')).filter(f=>f.startsWith('labs-')))vm.runInContext(fs.readFileSync(path.join(base,'js',f),'utf8').replace(/const M=FLMath/,'const M=window.FLMath'),ctx);return {text:ctx.FLLabText,guide:ctx.FLGuideData};}
const G=guides();
const has=(id,...nums)=>{const s=G.guide[id][2];for(const n of nums)assert.ok(s.includes(n),`${id}: “${n}” 없음`);};

test('synthetic users: counts, pair ranges and fixed seed',()=>{
 assert.equal(L.length,1000);assert.deepEqual([0,1,2].map(s=>L.filter(u=>u.style===s).length),[595,307,98]);
 assert.equal(L.reduce((s,u)=>s+u.train.length,0),32716);assert.equal(L.filter(u=>u.fresh).length,143);
 const n=L.filter(u=>!u.fresh).map(u=>u.train.length),fr=L.filter(u=>u.fresh).map(u=>u.train.length);
 assert.equal(Math.min(...n),12);assert.equal(Math.max(...n),105);assert.ok(Math.min(...fr)>=4&&Math.max(...fr)<=15);
 assert.equal(M.rawBytes(L),577169);assert.equal(M.DIM,225);assert.equal(M.SMALL_DIM,117);
 assert.deepEqual(M.population({N:5,seed:3}).map(u=>u.train.length),M.population({N:5,seed:3}).map(u=>u.train.length));
});
test('probabilities sum to 1 and gradient matches finite differences',()=>{
 const w=M.zeros();for(let i=0;i<w.length;i++)w[i]=Math.sin(i)*.3;
 for(let c=0;c<M.P;c++)assert.ok(Math.abs(M.probs(w,c).reduce((a,b)=>a+b,0)-1)<1e-12);
 const pairs=L[3].train,g=M.gradient(w,pairs),h=1e-6;
 for(const i of [0,40,200,220]){const a=Float64Array.from(w),b=Float64Array.from(w);a[i]+=h;b[i]-=h;assert.ok(Math.abs((M.loss(a,pairs)-M.loss(b,pairs))/(2*h)-g[i])<1e-6,i);}
});
test('FedSGD with one client equals one full-batch gradient step; data parallel matches one machine',()=>{
 const w=M.zeros(),u=L[8],d=M.userUpdate(w,u.train,{E:1,B:Infinity,lr:.3}),g=M.gradient(w,u.train);
 for(let i=0;i<M.DIM;i++)assert.ok(Math.abs(d[i]+.3*g[i])<1e-12);
 assert.ok(M.dataParallelGap(w,L.flatMap(x=>x.train).slice(0,100),16)<1e-15);
});
test('server average divides by the participating clients only (erratum)',()=>{
 const one=[L[0]],r=M.fedRound(M.zeros(),one,{C:1,E:1,B:10,seed:1},0),d=M.sub(M.localTrain(M.zeros(),L[0].train,{E:1,B:10,lr:.3,seed:1*7919+0*131+0}).w,M.zeros());
 for(let i=0;i<M.DIM;i++)assert.ok(Math.abs(r.w[i]-d[i])<1e-12);
});
test('chapter 1~3 numbers: central, FedAvg, FedSGD, rounds to 0.60, bytes',()=>{
 const c=M.central(L,{epochs:40});assert.equal(f3(c.curve[1]),'0.654');assert.equal(f3(c.final.acc),'0.654');
 const r=fed({});assert.equal(f3(r.final.acc),'0.649');assert.deepEqual(r.final.byStyle.map(f3),['0.768','0.523','0.319']);assert.equal(r.bytes,7200000);assert.equal(f3(r.curve[19]),'0.630');
 assert.equal(f3(fed({E:1,B:Infinity}).final.acc),'0.397');assert.equal(M.roundsTo(fed({E:1,B:Infinity}).curve,.6),null);
 assert.equal(M.roundsTo(fed({E:1}).curve,.6),17);assert.equal(M.roundsTo(fed({}).curve,.6),4);assert.equal(M.roundsTo(fed({E:20}).curve,.6),3);assert.equal(M.roundsTo(fed({E:10}).curve,.6),3);
 assert.equal(f3(fed({E:20}).final.acc),'0.641');assert.equal(f3(fed({E:20}).final.byStyle[2]),'0.227');assert.equal(f3(fed({E:1}).final.acc),'0.630');
 assert.equal(M.roundsTo(fed({E:1,C:.02}).curve,.6),21);
 has('where','0.654','0.630','0.649','7.20 MB','577.2 KB');has('fedavg','0.397','17라운드','0.630','4라운드','0.641','0.649','0.227','21라운드');
});
test('chapter 3 quantization: unbiased, bytes and rounds to target',()=>{
 const r=M.rng(1),d=Float64Array.from({length:2000},(_,i)=>Math.sin(i)),avg=new Float64Array(2000);
 for(let k=0;k<200;k++){const q=M.quantize(d,2,r);for(let i=0;i<2000;i++)avg[i]+=q[i]/200;}
 assert.ok(Math.max(...avg.map((x,i)=>Math.abs(x-d[i])))<.15);
 assert.equal(M.updateBytes(225,8),229);assert.equal(M.updateBytes(225,32),900);
 const kb=(E,b)=>{const x=M.train(L,{C:.1,E,B:10,rounds:60,quantBits:b}),k=M.roundsTo(x.curve,.6);return [k,(x.logs.slice(0,k).reduce((s,l)=>s+l.bytes,0)/1e3).toFixed(1)];};
 assert.deepEqual(kb(1,32),[17,'3060.0']);assert.deepEqual(kb(1,2),[17,'1632.4']);assert.deepEqual(kb(5,32),[4,'720.0']);assert.deepEqual(kb(5,8),[4,'451.6']);assert.deepEqual(kb(5,4),[5,'508.3']);assert.deepEqual(kb(5,2),[8,'768.2']);
 has('comm','3.06 MB','1.63 MB','720.0 KB','451.6 KB','508.3 KB','768.2 KB');
});
test('chapter 4: non-IID and drift',()=>{
 assert.deepEqual(fed({E:20},0).final.byStyle.map(f3),['0.658','0.655','0.654']);assert.equal(f3(fed({},0).final.prob),'0.463');assert.equal(f3(fed({E:20},0).final.prob),'0.502');
 assert.equal(f3(fed({E:20,mu:.1}).final.byStyle[2]),'0.265');assert.equal(f3(fed({E:20,mu:1}).final.prob),'0.298');assert.equal(f3(fed({E:20,mu:1}).final.byStyle[2]),'0.056');
 const d=o=>f3(M.driftRun({eta:.1,rounds:40,...o}).dist);
 assert.deepEqual(M.driftOptimum().map(f3),['-1.125','0.063']);
 assert.equal(d({steps:1}),'0.056');assert.equal(d({steps:5}),'0.181');assert.equal(d({steps:20}),'0.589');
 assert.equal(d({steps:20,method:'fedprox',mu:.5}),'0.481');assert.equal(d({steps:20,method:'fedprox',mu:1}),'0.394');assert.equal(d({steps:20,method:'fedprox',mu:2}),'0.278');assert.equal(d({steps:20,method:'scaffold'}),'0.000');
 assert.equal(d({steps:20,method:'fedprox',mu:0}),d({steps:20}));
 has('noniid','0.658','0.502','0.319','0.227','0.265','0.298','0.056');has('drift','0.056','0.181','0.589','0.481','0.394','0.278','0.000');
});
test('chapter 5: participation conditions',()=>{
 const sel=fed({select:{night:true,charging:true,wifi:true,idle:true}}),part=M.participation(sel.logs,L),sh=[0,1,2].map(s=>sel.logs.reduce((a,l)=>a+l.styles[s],0));
 assert.equal(((sh[2]/sh.reduce((a,b)=>a+b))*100).toFixed(1),'3.0');assert.equal(part.filter(x=>!x).length,224);assert.equal(L.filter((u,i)=>u.style===2&&!part[i]).length,62);
 assert.equal(f3(sel.final.byStyle[2]),'0.063');assert.equal(f3(sel.final.acc),'0.630');assert.equal((sel.logs.reduce((a,l)=>a+l.eligible,0)/40).toFixed(1),'565.1');
 const day=fed({select:{night:false,charging:true,wifi:true,idle:true}});assert.equal((day.logs.reduce((a,l)=>a+l.eligible,0)/40).toFixed(1),'23.8');assert.equal(M.participation(day.logs,L).filter(x=>!x).length,380);
 assert.equal(M.participation(fed({}).logs,L).filter(x=>!x).length,11);
 has('select','10.1%','727.2','565.1','3.0%','224명','62명','0.063','23.8','380명');
});
test('chapter 6: deadline modes',()=>{
 const h=(mode,dl)=>fed({hetero:{mode,deadline:dl}}),sum=(r,k)=>r.logs.reduce((a,l)=>a+l[k],0),low=r=>r.logs.reduce((a,l)=>a+l.tiers[2],0);
 assert.equal(sum(h('drop',10),'dropped'),1308);assert.equal(low(h('drop',10)),438);assert.equal(low(fed({})),1100);
 assert.equal(f3(h('drop',10).final.probByStyle[2]),'0.114');assert.equal(f3(h('partial',10).final.probByStyle[2]),'0.133');assert.equal(f3(h('small',10).final.probByStyle[2]),'0.140');assert.equal(f3(fed({}).final.probByStyle[2]),'0.164');
 assert.equal((h('drop',10).bytes/1e6).toFixed(2),'6.02');assert.equal(h('drop',10).bytes,sum(h('drop',10),'used')*1800+1308*900);assert.equal((h('small',10).bytes/1e6).toFixed(2),'6.07');assert.equal(h('partial',10).bytes,7200000);
 assert.equal(sum(h('drop',20),'dropped'),405);assert.equal(f3(h('drop',20).final.probByStyle[2]),'0.133');
 assert.equal(f3(h('drop',20).final.byStyle[2]),f3(h('partial',20).final.byStyle[2]));
 has('hetero','1,308','438','0.114','0.164','0.133','0.140','6.02 MB','7.20 MB','6.07 MB','405');
});

test('chapter 7: FedSGD update gives back the exact pair counts; FedAvg still shows the used rows',()=>{
 const base=fed({}),u=L[15],a=M.countsOf(u.train);assert.equal(u.train.length,87);
 const sgd=M.userUpdate(M.zeros(),u.train,{E:1,B:Infinity,lr:.3}),r=M.recoverCounts(M.zeros(),sgd,u.train.length,.3);
 assert.ok(r.exact);assert.deepEqual(r.table,a);assert.equal(a.filter(row=>row.some(x=>x)).length,14);
 const avg=M.userUpdate(base.w,u.train,{E:5,B:10,lr:.3});let top=0;
 for(let c=0;c<M.P;c++){const row=a[c],nz=[...Array(M.K).keys()].some(k=>Math.abs(avg[c*M.K+k])>1e-12);assert.equal(nz,row.some(x=>x),'row '+c);if(row.some(x=>x)){const d=[...Array(M.K).keys()].map(k=>avg[c*M.K+k]);if(row[d.indexOf(Math.max(...d))]===Math.max(...row))top++;}}
 assert.equal(top,12);
 const g=M.gradient(M.zeros(),[L[14].train[0]]),x=M.recoverInput(g,0);assert.equal(x.findIndex(v=>Math.abs(v-1)<1e-9),L[14].train[0][0]);
 has('leak','14개','87개','12줄');
});
test('chapter 8: masks cancel exactly; dropouts are recovered above the threshold only',()=>{
 const ups=[[-49,-807,811,27],[3,5,-7,11],[100,-200,300,-400],[1,2,3,4],[-5,6,-7,8]],truth=[0,1,2,3].map(k=>ups.reduce((s,u)=>s+u[k],0));
 const r=M.secureAggregate(ups,{dropped:[],t:3,double:true});assert.deepEqual(r.sum,truth);assert.notDeepEqual(r.raw,truth);
 const d=M.secureAggregate(ups,{dropped:[1,3],t:3,double:true});assert.deepEqual(d.sum,[0,1,2,3].map(k=>[0,2,4].reduce((s,i)=>s+ups[i][k],0)));
 assert.equal(M.secureAggregate(ups,{dropped:[0,1,3],t:3,double:true}).enough,false);
 has('secagg','[−49, −807, 811, 27]','[29,879, 12,549, 4,310, −27,491]','[147, −952, 718, 379]');
});
test('chapter 9: RDP epsilon falls with noise and population; clipping leaves epsilon unchanged',()=>{
 const e=(q,z,T=40)=>M.epsilon({q,z,T,delta:1e-5}).eps.toFixed(2);
 assert.equal(e(.1,1),'6.18');assert.equal(e(.1,2),'2.01');assert.equal(e(.1,4),'0.85');assert.equal(e(.1,.5),'28.68');assert.equal(e(.01,1.1,1000),'2.09');
 assert.equal(e(100/1e5,1),'0.90');assert.equal(e(100/763430,1),'0.68');assert.ok(+e(.1,1)>+e(.1,2)&&+e(.1,2)>+e(.1,4));
 const d=M.dpTrain(L,{E:1,B:10,rounds:40,q:.1,S:1,z:1}),z0=M.dpTrain(L,{E:1,B:10,rounds:40,q:.1,S:1,z:0});
 assert.equal(f3(d.final.acc),'0.630');assert.equal(f3(z0.final.acc),'0.628');
 has('dp','6.18','0.630','0.628','2.01','0.617','0.85','0.607','80.6%','0.547','0.90','0.68');
});
test('chapter 10: personalization mixes back to the shared model at lambda 1',()=>{
 const w=fed({}).w,one=M.personalize(w,L,{epochs:2,lambda:1}),p=M.personalize(w,L,{epochs:2,lambda:0});
 assert.equal(f3(one.mine),f3(one.global));assert.equal(f3(p.mine),'0.682');assert.equal(p.better,228);assert.equal(p.worse,7);
 has('personal','0.649','0.682','0.412','228명','7명','0.715','0.570','0.585','0.607');
});
test('chapter 11: group report and Wilson interval',()=>{
 const pr=M.predict(fed({}).w),rep=M.groupReport(L,u=>M.correct(pr,u.testCount),'tier',20);
 assert.equal(rep.rows.reduce((s,r)=>s+r.devices,0),1000);for(const r of rep.rows)assert.ok(r.ci[0]<=r.acc&&r.acc<=r.ci[1]);
 const [lo,hi]=M.wilson(50,100);assert.ok(Math.abs(lo-.4038)<1e-3&&Math.abs(hi-.5962)<1e-3);
 assert.ok(M.groupReport(L,u=>M.correct(pr,u.testCount),'fresh',150).rows.some(r=>r.hidden&&r.devices===143));
 has('groups','0.687','0.659','0.584','0.523','0.430','0.063');
});
test('chapter 12: LoRA adapter size r(d+k) per matrix and bytes per round',()=>{
 assert.equal(M.loraParams({L:24,d:2048,r:8,mats:2}),2*24*8*(2048+2048));assert.equal(M.loraParams({L:24,d:2048,r:8,mats:2}),1572864);
 const c=M.loraComm({full:1e9,L:24,d:2048,r:8,bits:16,devices:300,rounds:1});assert.equal(c.fullRound,1.2e12);assert.equal(c.loraRound,300*2*2*1572864);
 assert.equal(M.loraParams({L:32,d:4096,r:8,mats:2}),4194304);
 has('lora','1,572,864','0.157%','4.00 GB','6.29 MB','1.89 GB','636','12,582,912','4,194,304','5.60 MB');
});
test('chapter 13: final report starting setting',()=>{
 const d=M.dpTrain(L,{q:.1,E:1,B:10,S:1,z:1,rounds:40}),p=M.personalize(d.w,L,{epochs:2,lambda:.5});
 assert.equal(f3(d.final.acc),'0.630');assert.equal(f3(p.mine),'0.653');assert.equal(40*.1*1800,7200);
 has('final','0.630','0.653','6.18','7.2 KB','2.01','0.617','1.02','3.6 KB','0.598');
});
test('chapter 6: a small-model device never sees the rows it does not receive',()=>{
 const w0=M.zeros(),w1=M.zeros(),r=M.rng(5);for(let i=0;i<M.P*M.K;i++)if(!M.SMALL_ROWS[Math.floor(i/M.K)])w1[i]=r()*4-2;
 const o={C:.1,E:5,B:10,hetero:{mode:'small',deadline:1}},a=M.fedRound(w0,L,o,0),b=M.fedRound(w1,L,o,0);
 assert.equal(a.log.small,a.log.used);
 for(let i=0;i<M.DIM;i++){const kept=i>=M.P*M.K||M.SMALL_ROWS[Math.floor(i/M.K)];if(kept)assert.ok(Math.abs(a.w[i]-b.w[i])<1e-12,'cell '+i);else assert.equal(b.w[i],w1[i]);}
});
