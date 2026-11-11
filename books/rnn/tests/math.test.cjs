/* 계산 모델 검증: 순전파, 시간 방향 역전파(수치 미분과 대조), 기울기 소실·폭발, 학습, 분류의 대표값·경계값·불변 조건.
   안내 상자(lab-guides.js)의 결과 읽기와 본문에 적은 숫자가 실제 계산과 같은지도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const M=require(path.resolve(__dirname,'../js/math.js'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../js/lab-guides.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../js/content.js'),'utf8'),ctx);
const G=ctx.window.RNGuides.guides,B=ctx.window.RNBook,reading=id=>G[id][2],int=n=>n.toLocaleString('en-US'),f=(x,d=2)=>x.toFixed(d);
const chapter=id=>JSON.stringify(B.chapters.find(c=>c.id===id));
const has=(id,...xs)=>{for(const x of xs)assert.ok(reading(id).includes(x),`${id}: "${x}" not in guide`);};
const says=(id,...xs)=>{for(const x of xs)assert.ok(chapter(id).includes(x),`${id}: "${x}" not in chapter`);};
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sci=x=>{const e=Math.floor(Math.log10(Math.abs(x)));return `${f(x/10**e,1)}×10${String(e).split('').map(c=>SUP[c]).join('')}`;};
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} vs ${b}`);

test('temperature series is deterministic and stays in a plausible range',()=>{
 const a=M.series(240),b=M.series(240);assert.deepEqual(a,b);assert.equal(a.length,240);
 assert.ok(Math.min(...a)>8&&Math.max(...a)<32);
 const clean=M.series(48,{noise:0});close(clean[0],clean[0]);assert.ok(Math.abs(clean[24]-clean[0])<1.5);
});
test('order matters: shuffling the window raises the error, the mean ignores order',()=>{
 const r=M.whyOrder({k:6,noise:0.6}).rmse;
 assert.ok(r.ordered<r.last&&r.last<r.mean&&r.mean<r.mixed);
 has('why',f(r.ordered),f(r.mixed),f(r.mean),f(r.last),f(r.mixed/r.ordered,1)+'배');
 says('why',f(r.ordered)+'°C',f(r.mixed)+'°C',f(r.mean)+'°C',f(r.last)+'°C');
 const k12=M.whyOrder({k:12,noise:0.6}).rmse;has('why',f(k12.ordered),f(k12.mixed));
 const clean=M.whyOrder({k:6,noise:0}).rmse;assert.ok(clean.ordered<0.005);
});
test('scalar cell: memory length follows the recurrent weight; tanh bounds the state',()=>{
 const run=(wh,act='tanh')=>M.scalarRun({wh,wx:1,xs:M.CELL_INPUTS.pulse,act});
 const below=hs=>hs.findIndex(h=>Math.abs(h)<Math.abs(hs[0])*0.1)+1;
 close(run(0.5)[0],Math.tanh(1));assert.equal(below(run(0.5)),5);assert.equal(below(run(0.8)),11);
 has('cell','0.76','5번째','11번째',f(run(0.8)[10]/run(0.8)[0]*100,1)+'%',f(run(0.8)[11]/run(0.8)[0]*100,1)+'%',f(run(1.2)[11]),f(run(1.2,'none')[11]));
 says('cell','0.76','0.36','0.18','0.09','7.43','0.66');
 for(const h of run(1.5))assert.ok(Math.abs(h)<1);
 close(run(1.2,'none')[11],1.2**11);
 const zero=M.scalarRun({wh:0,wx:1,xs:M.CELL_INPUTS.temp,act:'tanh'});zero.forEach((h,i)=>close(h,Math.tanh(M.CELL_INPUTS.temp[i])));
});
test('parameter counts: the RNN does not depend on length, the dense layer does',()=>{
 const p=M.paramCount({T:24,H:10});assert.equal(p.rnn,131);assert.equal(p.dense,261);assert.equal(p.torchRnn,130);
 assert.equal(M.paramCount({T:200,H:10}).rnn,131);assert.equal(M.paramCount({T:200,H:10}).dense,2021);
 assert.equal(M.paramCount({T:24,H:64}).rnn,4289);assert.equal(M.paramCount({T:24,H:64}).dense,1665);
 has('unroll','131','261','2,021','4,289','1,665');says('unroll','131','261','2,021','4,289','130');
});
test('input/output forms: each task has one right form and the counts add up',()=>{
 for(const t of M.TASKS){const ok=M.shape(t.id,t.form,6,4);assert.ok(ok.ok,t.id);for(const form of Object.keys(M.FORMS))if(form!==t.form)assert.ok(!M.shape(t.id,form,6,4).ok,t.id+form);}
 const tr=M.shape('translate','encdec',6,4);assert.equal(tr.steps,10);assert.equal(tr.ins,6);assert.equal(tr.outs,4);
 const each=M.shape('each','m2m',6,4);assert.equal(each.ins,6);assert.equal(each.outs,6);assert.equal(each.lossTerms,6);
 assert.equal(M.shape('review','m2o',6,4).lossTerms,1);has('shapes','10단계');
});
test('scalar BPTT equals the numeric gradient and the per-step parts add up',()=>{
 for(const wh of [0.1,0.5,0.9,1.5])for(const T of [2,3,6]){const r=M.scalarBptt({wh,T,target:0.5});close(r.gwh,r.numWh,1e-8);close(r.rows.reduce((s,x)=>s+x.partWh,0),r.gwh,1e-12);close(r.rows[0].partWh,0);}
 const r=M.scalarBptt({wh:0.9,T:3,target:0.5});
 has('bptt',f(r.loss,5),f(r.rows[1].partWh,5),f(r.rows[2].partWh,5),f(r.gwh,5),f(M.scalarBptt({wh:0.9,T:6,target:0.5}).gwh,5).replace('-','−'));
 says('bptt','0.01366','0.00421','0.01787');
 const s=M.scalarBptt({wh:0.3,T:6,target:0.5}),ratio=s.rows[5].delta/s.rows[0].delta;
 has('bptt',f(s.rows[5].delta,4).replace('-','−'),f(s.rows[0].delta,4).replace('-','−'));assert.ok(ratio>600&&ratio<760,String(ratio));says('bptt','−0.3194','−0.0005');
 const big=M.scalarBptt({wh:1.5,T:6,target:0.5});has('bptt',f(Math.abs(big.rows[5].delta),4),f(Math.abs(big.rows[0].delta),4));
});
test('gradient norms: exactly rho^k when linear, smaller with tanh, clipping only rescales',()=>{
 const lin=M.gradNorms({rho:0.9,T:30,act:'none',clip:0});lin.norms.forEach((n,k)=>close(n,0.9**k,1e-9));
 const th=M.gradNorms({rho:0.9,T:30,act:'tanh',clip:0});assert.ok(th.last<lin.last);
 has('vanish','0.047',sci(th.last));says('vanish','0.047',sci(th.last));
 const ex=M.gradNorms({rho:1.5,T:30,act:'none',clip:1});close(ex.last,1.5**29,1e-3);assert.ok(ex.scale<1);close(ex.clipped,1,1e-9);
 has('vanish',sci(ex.last),sci(ex.gradNorm),sci(ex.scale));says('vanish',sci(ex.last),sci(ex.gradNorm),sci(ex.scale));
 const small=M.gradNorms({rho:0.5,T:30,act:'tanh',clip:1});assert.ok(small.last<1e-6&&small.scale<=1,'clipping never enlarges a vanished gradient');
});
test('full BPTT for RNN, LSTM and GRU matches numeric gradients',()=>{
 for(const type of ['rnn','lstm','gru']){
  const m=M.initModel(type,1,4,1,3),xs=[[0.3],[-0.5],[0.8],[0.1],[-0.2]],ys=[[0.2],null,[0.4],[0.3],[-0.3]];
  const {grads}=M.bptt(m,xs,ys),P=M.paramsOf(m),Gr=M.gradsOf(grads);let worst=0;
  const loss=()=>M.bptt(m,xs,ys).loss;
  for(let a=0;a<P.length;a++)for(let i=0;i<P[a].length;i+=3){const old=P[a][i],e=1e-5;P[a][i]=old+e;const up=loss();P[a][i]=old-e;const dn=loss();P[a][i]=old;worst=Math.max(worst,Math.abs((up-dn)/(2*e)-Gr[a][i]));}
  assert.ok(worst<1e-7,type+' '+worst);
 }
});
test('gradient reach: gates must be open for LSTM and GRU to beat the simple RNN',()=>{
 const g=(type,T,gateBias)=>M.gradFlow({type,T,gateBias});
 const r0=g('rnn',30,0),l0=g('lstm',30,0),u0=g('gru',30,0),l1=g('lstm',30,1),u1=g('gru',30,1),l3=g('lstm',30,3),u3=g('gru',30,3);
 assert.ok(l0.last<r0.last*10&&l3.last>r0.last*1e5&&u3.last>r0.last*1e5);close(g('rnn',30,3).last,r0.last);
 has('gru',sci(r0.last),sci(l0.last),sci(u0.last),f(l0.gate),sci(l1.last),sci(u1.last),f(l1.gate),f(l3.last),f(l3.gate),sci(g('rnn',60,0).last),f(g('lstm',60,3).last),f(g('gru',60,3).last,3));
 says('gru',sci(r0.last),sci(l0.last),sci(l1.last),f(l1.gate),f(l3.gate),sci(g('rnn',60,0).last),f(g('lstm',60,3).last),f(g('gru',60,3).last,3));assert.equal(f(u3.last),'0.25');
 const span=(type,T,gateBias)=>{const v=[1,2,3,4,5,6,7,8].map(seed=>M.gradFlow({type,T,gateBias,seed}).last);return [Math.min(...v),Math.max(...v)];};
 const R60=span('rnn',60,3),L60=span('lstm',60,3),U60=span('gru',60,3),R30=span('rnn',30,0),L30=span('lstm',30,0);
 assert.ok(Math.min(L60[0],U60[0])>R60[1]*1e5&&L30[0]<R30[1]&&R30[0]<L30[1]);
 says('gru',sci(R60[0])+'~'+sci(R60[1]),f(U60[0],3)+'~'+f(U60[1]),f(L60[0],4)+'~'+f(L60[1],1),sci(R30[0])+'~'+sci(R30[1]),sci(L30[0])+'~'+sci(L30[1]));
});
test('truncated BPTT: window sets updates, stored states and reach; numbers in the guide match',()=>{
 const run=(window,carry)=>M.trainSeries({window,carry,epochs:30});
 const w24=run(24,true),w4=run(4,true),w4r=run(4,false),full=run(240,true);
 assert.equal(w24.updates,10);assert.equal(w24.reach,24);assert.equal(w24.stored,24);assert.equal(full.updates,1);
 assert.ok(w24.final.val<w24.persist&&w24.final.val<full.final.val&&w4.final.val<w4r.final.val);
 has('truncate',f(w4.final.val),f(w4r.final.val),f(w24.final.val),f(full.final.val),f(w24.persist));
 says('truncate',f(w4.final.val)+'°C',f(w4r.final.val)+'°C',f(w24.final.val)+'°C',f(full.final.val)+'°C',f(w24.persist)+'°C');
});
test('LSTM gate arithmetic in the guide and chapter',()=>{
 close(0.5*1+0.5*0.8,0.9);has('lstm','0.900',f(Math.tanh(0.9),3),sci(0.5**12),f(0.95**12));says('lstm','0.716',sci(0.5**12),f(0.95**12));
});
test('sentiment model: tokens, padding and held-out sentences behave as the guide says',()=>{
 assert.equal(M.VOCAB.length,29);assert.equal(M.REVIEWS.length,32);assert.equal(M.HELD_OUT.length,8);
 const toks='맛 이 좋 지 않 다'.split(' ');assert.deepEqual(Array.from(M.encode(toks)),[12,13,14,6,7,5]);
 const base=M.classify(toks,{padTo:0,side:'post',useLastReal:true});has('embed','[12, 13, 14, 6, 7, 5]',f(base.steps[2].p),f(base.steps[4].p));assert.ok(base.p<0.5);
 says('embed','[12, 13, 14, 6, 7, 5]',f(base.steps[4].p));
 const padded=M.classify(toks,{padTo:8,side:'post',useLastReal:false});assert.ok(padded.p>0.5);
 const all=[...M.REVIEWS,...M.HELD_OUT],n=o=>M.sentimentAccuracy(all,o).rows.filter(x=>x.ok).length;
 assert.equal(n({padTo:0,side:'post',useLastReal:true}),40);assert.equal(M.sentimentAccuracy(M.HELD_OUT,{padTo:0,side:'post',useLastReal:true}).rows.filter(x=>x.ok).length,8);
 has('embed',n({padTo:8,side:'post',useLastReal:false})+'개만',n({padTo:12,side:'post',useLastReal:false})+'개)',n({padTo:12,side:'pre',useLastReal:true})+'개가');
 says('embed',n({padTo:8,side:'post',useLastReal:false})+'개만',n({padTo:12,side:'pre',useLastReal:true})+'개)');
 assert.equal(n({padTo:8,side:'post',useLastReal:true}),40);
 assert.ok(M.classify('토마토 가 무르 지 않 다'.split(' '),{padTo:0,side:'post',useLastReal:true}).p>0.5);
 assert.equal(M.classify('수박 이 달 다'.split(' '),{padTo:0,side:'post',useLastReal:true}).unknown,1);
});
test('validation curves: overfitting at H=16, dropout and a small model hold it back',()=>{
 const r=M.validateRun({H:16,dropout:0}),at=e=>r.curve[e-1],best=M.bestUpTo(r.curve,200);
 assert.ok(at(200).train<at(40).train&&at(200).val>at(40).val&&at(200).val>r.persist);
 has('validate',f(at(40).train),f(at(40).val),best.epoch+'번째',f(best.val),f(at(200).train),f(at(200).val),f(r.persist));
 says('validate',f(at(40).train)+'°C',f(at(40).val)+'°C',best.epoch+'번째',f(best.val)+'°C',f(at(200).train)+'°C',f(at(200).val)+'°C',f(r.persist)+'°C');
 const d=M.validateRun({H:16,dropout:0.3}),db=M.bestUpTo(d.curve,200);has('validate',f(d.curve[199].val),db.epoch+'번째',f(db.val));says('validate',f(d.curve[199].val)+'°C');
 const s=M.validateRun({H:4,dropout:0});has('validate',f(s.curve[199].val));says('validate',f(s.curve[199].val)+'°C');
});
test('complexity table follows Vaswani et al. Table 1 orders',()=>{
 const c=M.complexity({T:50,H:64,layers:1,bi:false});assert.equal(c.rnn.ops,50*64*64);assert.equal(c.attn.ops,50*50*64);assert.equal(c.rnn.serial,50);assert.equal(c.attn.serial,1);assert.equal(c.rnn.path,49);assert.equal(c.attn.path,1);
 const eq=M.complexity({T:64,H:64,layers:1,bi:false});assert.equal(eq.rnn.ops,eq.attn.ops);
 const long=M.complexity({T:200,H:64,layers:1,bi:false});
 has('limits',int(c.rnn.ops),int(c.attn.ops),int(long.attn.ops),int(long.rnn.ops));says('limits',int(c.rnn.ops),int(c.attn.ops));
 assert.ok(Math.abs(long.attn.ops/long.rnn.ops-3.125)<1e-9);assert.equal(M.complexity({T:50,H:64,layers:2,bi:true}).rnn.serial,50);
});
test('final diagnosis: one right cause per record, each from a different chapter',()=>{
 assert.equal(M.CASES.length,5);assert.equal(new Set(M.CASES.map(c=>c.chapter)).size,5);
 const right=Object.fromEntries(M.CASES.map(c=>[c.id,String(c.answer)]));assert.equal(M.diagnose(right).ok,5);
 const wrong=Object.fromEntries(M.CASES.map(c=>[c.id,String((c.answer+1)%c.options.length)]));assert.equal(M.diagnose(wrong).ok,0);
 assert.equal(M.diagnose({}).ok,0);
 const pick=k=>{const [[id,v]]=Object.entries(G.final[1][k][1]);return M.CASES.find(c=>'c-'+c.id===id).answer===+v;};assert.deepEqual([pick(0),pick(1),pick(2)],[false,true,false]);
});
test('choice order puts the right answer at the asked position and keeps every choice',()=>{
 for(let n=3;n<=4;n++)for(let a=0;a<n;a++)for(let t=0;t<n;t++){const o=M.choiceOrder(n,a,t);assert.equal(o[t],a);assert.equal(new Set(o).size,n);}
});
