/* 가격 흔들림 계산의 대표값·경계값·불변 조건. 기준값은 조사 노트(docs/research.html#values)의 V-1~V-9이며,
   파이썬으로 따로 계산한 값과 같아야 한다. 무작위 경로 검사는 분포의 성질(평균·비율)만 넓은 허용 범위로 본다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=eps,`${msg} ${a} ≠ ${b}`);
const median=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;};

test('V-1 simple and log returns: −50% then +50% is −25%',()=>{
 const R=M.simpleReturns([100,50,75]);near(R[0],-.5);near(R[1],.5);
 near(M.compound(R),-.25,1e-12);
 const r=M.logReturns([100,50,75]);near(M.compound(r,'log'),Math.log(.75),1e-12);
 near(M.logToSimple(M.compound(r,'log')),-.25,1e-12,'log sum maps back to the simple total');
 near(M.simpleToLog(.1),Math.log(1.1),1e-15);near(M.logToSimple(M.simpleToLog(-.3)),-.3,1e-15);
 near(M.mean(R),0,1e-15,'arithmetic mean of −50% and +50% is 0 although money shrank');
 assert.deepEqual(M.pathFromReturns(100,[-.5,.5]),[100,50,75]);
 assert.deepEqual(M.pathFromReturns(100,[-1,.5]),[100,0,0],'−100% stays at zero');
 assert.throws(()=>M.simpleReturns([100]),RangeError);assert.throws(()=>M.logReturns([100,0]),RangeError);
});

test('V-2 daily reset: published two-day examples (SEC/FINRA, KCMI)',()=>{
 const sec=M.leveragedPath([-.1,.1],2,{start:1000});near(sec[2],960,1e-9);near(M.compound([-.1,.1]),-.01,1e-12);
 const idx=[.1,-.09];near(M.compound(idx),.001,1e-12);
 near(M.leveragedPath(idx,2,{start:1})[2]-1,-.016,1e-12);near(M.leveragedPath(idx,-2,{start:1})[2]-1,-.056,1e-12);
 near(M.staticLeverage(.001,2),.002,1e-15,'buying 2x once would have doubled +0.1%');
 assert.equal(M.staticLeverage(-.7,2),-1);
});

test('V-3 flat but volatile index: 2x and −2x lose, approximation is close',()=>{
 for(const [a,l2,i2] of [[.02,-.09342152431135797,-.25506939422920794],[.015,-.05392270661005372,-.1532644225075923],[.01,-.02445103588233688,-.07158782540344066]]){
  const R=M.flatVolatileReturns(a,125);assert.equal(R.length,250);near(M.compound(R),0,1e-12,'index back to start');
  const L=M.leveragedPath(R,2,{start:1}),I=M.leveragedPath(R,-2,{start:1}),T=M.leveragedPath(R,3,{start:1});
  near(L[250]-1,l2,1e-12,'2x '+a);near(I[250]-1,i2,1e-12,'-2x '+a);
  near(T[250]-1,i2,1e-11,'3x equals −2x on this two-step path (algebraic identity)');
  const v=M.variance(M.logReturns(M.pathFromReturns(1,R)),0);
  near(M.leveragedApprox(1,2,v,250)-1,l2,5e-4,'continuous approximation');
 }
 near(M.leveragedPath([0,0,0],2,{start:100,feePerYear:.025,periods:250})[3],100*Math.pow(1-.0001,3),1e-9,'fee only');
 assert.deepEqual(M.leveragedPath([-.6,.5],2,{start:100}),[100,0,0],'a −50% day wipes out a 2x product and it stays at zero');
 near(M.leveragedPath([.01,-.02],1,{start:1})[2]-1,M.compound([.01,-.02]),1e-15,'k = 1 reproduces the index');
 near(M.volatilityDrag(.02),.0002,1e-15);
});

test('V-4 standard deviation and annualisation (√250 vs √252)',()=>{
 const x=[2,4,4,4,5,5,7,9];near(M.sd(x,0),2,1e-12);near(M.sd(x),Math.sqrt(32/7),1e-12);near(M.mean(x),5);
 near(M.annualizeVol(.01),.15811388300841897,1e-15);near(M.annualizeVol(.01,252),.15874507866387544,1e-15);
 near(M.annualizeVol(.015),.23717082451262844,1e-15);
 near(M.annualizeMean(.0004),.1,1e-12);near(M.annualizeMean(.01,12,'simple'),Math.pow(1.01,12)-1,1e-12);
 assert.equal(M.sd([3,3,3,3]),0);assert.throws(()=>M.variance([1]),RangeError);assert.throws(()=>M.mean([]),RangeError);
 const mo=M.moments([1,2,3,4,5]);near(mo.skew,0,1e-12);near(mo.kurtosis,-1.3,1e-12,'uniform-like five points');
});

test('V-5 true range and Wilder ATR',()=>{
 const bars=[[11,9,10],[12,10,11.5],[13,11,12],[12.5,9.5,10],[11,10,10.5],[14,12,13]].map(([high,low,close])=>({high,low,close}));
 assert.deepEqual(M.trueRange(bars),[2,2,2,3,1,3.5]);
 const atr=M.atrWilder(bars,3);assert.equal(atr[0],null);assert.equal(atr[1],null);
 near(atr[2],2);near(atr[3],7/3,1e-12);near(atr[4],17/9,1e-12);near(atr[5],2.425925925925926,1e-12);
 assert.ok(M.atrWilder(bars,14).every(v=>v===null),'fewer bars than n');
 assert.deepEqual(M.atrWilder(bars,1),[2,2,2,3,1,3.5],'n = 1 is the true range itself');
 assert.throws(()=>M.trueRange([{high:9,low:10,close:9}]),RangeError);
});

test('V-6 maximum drawdown, recovery and the gain needed to recover',()=>{
 let d=M.maxDrawdown([100,120,90,95,130,80,100]);
 near(d.mdd,80/130-1,1e-12);assert.equal(d.peak,4);assert.equal(d.trough,5);assert.equal(d.recovery,null);assert.equal(d.recoveryLength,null);
 d=M.maxDrawdown([100,110,88,99,110,115]);
 near(d.mdd,-.2,1e-12);assert.equal(d.peak,1);assert.equal(d.trough,2);assert.equal(d.recovery,4);assert.equal(d.recoveryLength,2);assert.equal(d.fallLength,1);assert.equal(d.longestUnderwater,2);
 assert.equal(M.maxDrawdown([1,2,3,4]).mdd,0);assert.equal(M.maxDrawdown([5]).mdd,0);
 near(M.recoveryNeeded(-.2),.25,1e-12);near(M.recoveryNeeded(-.5),1,1e-12);assert.equal(M.recoveryNeeded(0),0);
 assert.throws(()=>M.recoveryNeeded(-1),RangeError);
 const dd=M.drawdownSeries([100,120,90,130]);near(dd[2],-.25,1e-12);assert.equal(dd[3],0);
});

test('V-7 level crossings: touching is not crossing',()=>{
 const p=[100,102,99,100,101,98,100,100,97];
 assert.deepEqual(M.levelCrossings(p,100),{count:3,up:1,down:2});
 assert.equal(M.levelCrossings(p,99.5).count,5);
 assert.equal(M.levelCrossings([100,101,100,101],100).count,0,'touch and return');
 assert.equal(M.levelCrossings([100,100,100],100).count,0);
 const c=M.crossingsOfLevels(p,[99.5,100,101.5,103]);assert.deepEqual(c.each,[5,3,2,0]);assert.equal(c.total,10);
});

test('seeded generator is deterministic and has the requested moments',()=>{
 assert.deepEqual(M.randomWalk({seed:7,n:20}),M.randomWalk({seed:7,n:20}));
 assert.notDeepEqual(M.randomWalk({seed:7,n:20}),M.randomWalk({seed:8,n:20}));
 const g=M.rng(3),u=Array.from({length:20000},g.uniform);assert.ok(u.every(v=>v>=0&&v<1));near(M.mean(u),.5,.01);
 const z=Array.from({length:40000},g.normal);near(M.mean(z),0,.02);near(M.sd(z),1,.02);near(M.moments(z).kurtosis,0,.1);
 const t=Array.from({length:40000},()=>g.studentT(6));near(M.sd(t),1,.03,'unit variance t');
 assert.ok(M.moments(t).kurtosis>1.5,'t(6) has fat tails (theory: excess kurtosis 3)');
 assert.ok(M.tailShare(t,3)>2*M.tailShare(z,3),'more 3σ days under t than normal');
 assert.throws(()=>g.studentT(2),RangeError);
 assert.deepEqual(M.randomWalk({tails:'t',seed:3,n:30}),M.randomWalk({tails:'t',nu:6,seed:3,n:30}),'default t noise is ν = 6 (ν = 4 has infinite excess kurtosis)');
 const flat=M.randomWalk({n:5,vol:0,drift:.01,start:100});near(flat[5],100*Math.exp(.05),1e-9,'zero vol is pure drift');
 assert.throws(()=>M.randomWalk({phi:1}),RangeError);assert.throws(()=>M.randomWalk({kappa:1}),RangeError);
});

test('V-8 autocorrelation and variance ratio recover the settings (Monte Carlo)',()=>{
 assert.equal(M.autocorr([1,-1,1,-1,1,-1,1,-1],1)<-0.8,true);near(M.acfBand(400),.098,1e-12);
 assert.throws(()=>M.autocorr([1,2,3],3),RangeError);
 const ret=p=>M.logReturns(p);
 const ac=o=>M.mean(M.monteCarlo({n:500,...o},60,p=>M.autocorr(ret(p),1)));
 near(ac({}),0,.03,'random walk ac1');near(ac({phi:.3}),.3,.06,'AR(1) phi 0.3');near(ac({phi:-.3}),-.3,.06);
 const z=M.monteCarlo({n:250,seed:11},4000,p=>M.varianceRatio(ret(p),5).z);/* research V-8: sd 1.037, 5.58% */
 near(M.sd(z),1,.06,'z is roughly standard normal under the random walk');
 const rej=z.filter(v=>Math.abs(v)>1.96).length/z.length;assert.ok(rej>.04&&rej<.07,'false rejection near 5%: '+rej);
 const vr=o=>M.mean(M.monteCarlo({n:250,...o},200,p=>M.varianceRatio(ret(p),5).vr));
 assert.ok(vr({phi:.2})>1.2,'trend-like returns: VR > 1');assert.ok(vr({kappa:.2})<.8,'mean reversion: VR < 1');
 near(M.varianceRatio([.01,-.01,.01,-.01,.01,-.01],2).vr<1?1:0,1,0,'alternating path');
 assert.throws(()=>M.varianceRatio([.1,.2],2),RangeError);
});

test('V-9 crossings and drawdowns change with mean reversion (Monte Carlo, compare research V-9)',()=>{
 const stat=o=>{
  const c=M.monteCarlo({n:250,vol:.01,...o},300,p=>M.levelCrossings(p,p[0]).count);
  const d=M.monteCarlo({n:250,vol:.01,...o},300,p=>M.maxDrawdown(p).mdd);
  return {c:M.mean(c),d:median(d)};
 };
 const rw=stat({}),k05=stat({kappa:.05}),k2=stat({kappa:.2});
 near(rw.c,9.25,2,'random walk crossings');near(k05.c,26.3,4);near(k2.c,51.1,5);
 near(rw.d,-.158,.03,'random walk median MDD');near(k05.d,-.117,.02);near(k2.d,-.080,.015);
 assert.ok(rw.c<k05.c&&k05.c<k2.c,'stronger pull, more crossings');assert.ok(rw.d<k05.d&&k05.d<k2.d,'stronger pull, shallower drawdowns');
 const long=M.mean(M.monteCarlo({n:1000,vol:.01},300,p=>M.levelCrossings(p,p[0]).count));
 near(long/rw.c,2,.5,'crossings grow like √n for a random walk');
});

test('summary of one price record and the expected 2x loss on a random flat year',()=>{
 const p=M.randomWalk({n:250,vol:.015,seed:21}),s=M.summarize(p);
 assert.equal(s.n,250);near(s.annualVol,s.sd*Math.sqrt(250),1e-15);assert.ok(s.mdd.mdd<=0);assert.equal(s.vr.q,5);
 const R=M.simpleReturns(p),L=M.leveragedPath(R,2,{start:1}),idx=p[250]/p[0];
 const v=M.variance(M.logReturns(p),0);
 near(L[250],M.leveragedApprox(idx,2,v,250),.02,'Avellaneda–Zhang approximation on a random path');
});

test('Saebyeok one-year record: vol. 12 six-month scenario + 130 generated days',()=>{
 const y=M.saebyeokYear(),c=y.map(b=>b.close);
 assert.equal(y.length,250);assert.deepEqual([y[0].day,y[249].day],[1,250]);
 assert.equal(y.filter(b=>b.source==='grid').length,120);assert.ok(y.slice(120).every(b=>b.source==='generated'));
 y.forEach(b=>assert.ok(b.low<=Math.min(b.open,b.close)&&b.high>=Math.max(b.open,b.close),'bar '+b.day));
 /* checkpoints that vol. 12 tests also hold (books/grid/tests/math.test.cjs, 13장) */
 assert.deepEqual(c.slice(0,8),[20600,21300,20800,20100,19390,18690,19210,19910],'8-day box cycle');
 assert.equal(c[79],19910,'day 80 close');
 assert.deepEqual([y[80].open,y[80].close,y[80].high,y[80].low],[18400,18490,18770,18400],'day 81: −8% gap open');
 assert.equal(c[99],16640,'day 100 close');
 const m6=y.slice(100,120);assert.equal(Math.min(...m6.map(b=>b.low)),16370);assert.equal(Math.max(...m6.map(b=>b.high)),17030);
 assert.equal(Math.min(...c.slice(0,120)),16620);assert.equal(c.indexOf(16620),101,'first 16,620 close is day 102');
 assert.equal(c[119],16620,'day 120 close = vol. 12 final price');
 assert.equal(Math.min(...y.slice(0,80).map(b=>b.low)),18600);assert.equal(Math.max(...y.slice(0,80).map(b=>b.high)),21400);
 /* the generated part continues from day 120 and is deterministic */
 assert.deepEqual(M.saebyeokYear(),y);assert.notDeepEqual(M.saebyeokYear({seed:9}).slice(120),y.slice(120));
 assert.deepEqual(M.saebyeokYear({seed:9}).slice(0,120),y.slice(0,120),'seed changes only the generated days');
 assert.equal(c[249],19090,'day 250 close (seed 20 fixed at G3, vol 1.5%, kappa 0)');
 assert.deepEqual([Math.min(...c.slice(120)),Math.max(...c.slice(120))],[15810,19810],'generated closes stay between 15,810 and 19,810');
 y.forEach(b=>[b.open,b.close,b.high,b.low].forEach(p=>assert.equal(M.tickRound(p),p,'on tick '+b.day)));
 assert.deepEqual(M.HARIN_LINES,Array.from({length:21},(_,i)=>18000+200*i));
 assert.throws(()=>M.generatedDays(0),RangeError);
});

test('Saebyeok record teaching hooks: gap day in the tails, range VR below 1 from one cycle',()=>{
 const c=M.saebyeokYear().map(b=>b.close),r=M.logReturns(c),m=M.mean(r),s=M.sd(r);
 near(r[79],Math.log(18490/19910),1e-15,'day 81 close-to-close');assert.ok((r[79]-m)/s<-3,'gap day is beyond 3σ of the year');
 const g=M.logReturns(c.slice(0,120));
 assert.ok(M.varianceRatio(g,8).vr<.3,'q = one 8-day box cycle: VR far below 1');
 assert.ok(M.varianceRatio(g,2).vr>1.3,'q = 2 inside a cycle: VR above 1');
});

test('vol. 12 scenario copy matches books/grid/js/math.js (read-only, skipped if absent)',t=>{
 const path=require('node:path'),fs=require('node:fs'),file=path.join(__dirname,'../../grid/js/math.js');
 if(!fs.existsSync(file)){t.skip('books/grid not present');return;}
 const G=require(file),W=o=>G.wave(o);
 const F=[...W({start:20000,days:80,perDay:8,amp:7,period:64}),...W({start:20000,days:20,perDay:8,amp:2,period:16,drift:-.5,gaps:{0:-8}}),...W({start:16700,days:20,perDay:8,amp:2,period:16})];
 assert.deepEqual(M.gridSixMonths(),F,'all 960 points');
 assert.deepEqual(M.saebyeokYear().slice(0,120).map(b=>b.close),F.map(d=>d[d.length-1]),'first 120 daily closes');
});

/* ── 본문(js/content.js)·복습(review.json)의 숫자 대조 ──
   모든 숫자는 위 함수로 다시 계산한다. 생성기 수치는 본문에 적은 시드·시행 수 그대로다. */
const f=(x,d=2)=>(x*100).toFixed(d);/* 소수 → % 문자열 */
const SY=()=>M.saebyeokYear(),SC=()=>SY().map(b=>b.close),SR=()=>M.logReturns(SC());
const NURI=()=>M.randomWalk({n:250,vol:.012,seed:524});/* 마지막 과제의 누리200 1년 */
const FLAT=a=>M.flatVolatileReturns(a,125);
const mc=(o,t,fn)=>M.monteCarlo({n:250,vol:.01,seed:1,...o},t,fn);

test('content ch1 returns',()=>{
 assert.deepEqual([Math.log(.5).toFixed(3),Math.log(1.5).toFixed(3),Math.log(.75).toFixed(3)],['-0.693','0.405','-0.288']);
 near(Math.expm1(Math.log(.5)+Math.log(1.5)),-.25,1e-12);
 const c=SC();assert.deepEqual([c[0],c[1],c[119]],[20600,21300,16620]);
 assert.equal(f(c[1]/c[0]-1,3),'3.398');assert.equal(f(Math.log(c[1]/c[0]),3),'3.342');
 assert.equal(Math.log(1.3).toFixed(3),'0.262');assert.equal(Math.log(.7).toFixed(3),'-0.357');
 const s=M.compound(M.logReturns(c.slice(0,120)),'log');assert.equal(M.logReturns(c.slice(0,120)).length,119);
 assert.equal(s.toFixed(4),'-0.2147');assert.equal(f(Math.expm1(s)),'-19.32');near(Math.expm1(s),c[119]/c[0]-1,1e-12);
 near(M.compound(M.simpleReturns([100,120,90])),-.1,1e-12);near(M.mean(M.simpleReturns([100,120,90])),-.025,1e-12);
 assert.equal(Math.log(1.4).toFixed(3),'0.336');assert.equal((Math.log(1.4)+Math.log(.7)).toFixed(3),'-0.020');near(1.4*.7,.98,1e-12);
});

test('content ch2 drag',()=>{
 const sec=M.leveragedPath([-.1,.1],2,{start:1000});assert.deepEqual(sec.map(v=>Math.round(v)),[1000,800,960]);assert.deepEqual(M.pathFromReturns(1000,[-.1,.1]).map(v=>Math.round(v)),[1000,900,990]);
 assert.equal(f(1/1.015-1,3),'-1.478');assert.equal(f(2*(1/1.015-1)*-1,3),'2.956');
 const pair=(1+.03)*(1-.03/1.015);assert.equal(pair.toFixed(5),'0.99956');assert.equal(f(1-pair,3),'0.044');assert.equal(Math.pow(pair,125).toFixed(3),'0.946');
 near(pair,1-2*.015**2/1.015,1e-15,'(1 + 2a)(1 − 2a/(1 + a)) = 1 − 2a²/(1 + a)');
 for(const k of [2,-2,3])near((1+k*.015)*(1+k*(1/1.015-1)),1-(k*k-k)*.015**2/1.015,1e-15,'pair identity k='+k);
 const L=a=>M.leveragedPath(FLAT(a),2,{start:1})[250]-1;
 assert.equal(f(L(.015)),'-5.39');assert.equal(f(M.leveragedPath(FLAT(.015),-2,{start:1})[250]-1),'-15.33');near(Math.pow(pair,125),1+L(.015),1e-12);
 assert.equal(f(L(.01)),'-2.45');assert.equal(f(L(.02)),'-9.34');assert.equal((L(.02)/L(.01)).toFixed(1),'3.8');
 const idx=[.1,-.09];assert.equal(f(M.compound(idx),1),'0.1');assert.equal(f(M.staticLeverage(M.compound(idx),2),1),'0.2');
 assert.equal(f(M.leveragedPath(idx,2,{start:1})[2]-1,1),'-1.6');assert.equal(f(M.leveragedPath(idx,-2,{start:1})[2]-1,1),'-5.6');
 near(1.2*.82,.984,1e-12);near(1.1*.91,1.001,1e-12);
 const v=M.variance(M.logReturns(M.pathFromReturns(1,FLAT(.015))),0),ap=M.leveragedApprox(1,2,v,250)-1;assert.equal(f(ap),'-5.39');assert.ok(Math.abs(ap-L(.015))<1e-4,'within 0.01%p');
 assert.deepEqual(M.leveragedPath([-.51],2,{start:100}),[100,0],'a fall of more than 50% wipes out a 2x product');
});

test('content ch3 measure',()=>{
 const lr=M.logReturns(M.pathFromReturns(1,FLAT(.015)));assert.equal(f(lr[0],3),'1.489');assert.equal(f(M.sd(lr)),'1.49');
 assert.equal((250*M.variance(lr)).toFixed(3),'0.056');assert.equal((250*M.variance(lr,0)).toFixed(3),'0.055');assert.equal(f(Math.expm1(-.055),1),'-5.4');
 assert.equal(f(M.annualizeVol(.015),1),'23.7');assert.equal(f(M.annualizeVol(.015,252),1),'23.8');assert.equal(f(Math.sqrt(252/250)-1,1),'0.4');
 assert.equal(f(M.annualizeVol(.01),1),'15.8');assert.equal(f(M.annualizeVol(.015,252)-M.annualizeVol(.015),1),'0.1');
 const y=SY(),tr=M.trueRange(y),atr=M.atrWilder(y,14);
 assert.deepEqual([y[80].high,y[80].low,y[79].close,y[80].high-y[80].low,tr[80]],[18770,18400,19910,370,1510]);
 assert.deepEqual([atr[79].toFixed(1),atr[80].toFixed(1),atr[249].toFixed(1),f(atr[249]/y[249].close)],['675.9','735.5','301.5','1.58']);
 const r=SR(),w=(day,n)=>f(M.annualizeVol(M.sd(r.slice(day-1-n,day-1))),1);
 assert.deepEqual([w(120,20),w(120,60)],['15.5','36.4']);assert.equal(r.length,249);assert.equal(f(M.annualizeVol(M.sd(r)),1),'35.3');
 near(2*(1-0.8413447460685429),.317,.001,'one year in three moves more than one annual σ under the normal');
 near(Math.sqrt(4*36),12,0);
});

test('content ch4 walk',()=>{
 const p=M.randomWalk({n:250,vol:.01,seed:39});assert.equal(f(p[250]/p[0]-1,0),'42');assert.equal(f(M.maxDrawdown(p).mdd,1),'-9.5');
 const ends=mc({},200,q=>Math.log(q[250]/q[0])),band=.01*Math.sqrt(250);
 assert.equal(ends.filter(v=>Math.abs(v)>band).length,70);assert.equal(2*(1-0.8413447460685429)>.31,true);
 assert.equal(Math.sqrt(2*250/Math.PI).toFixed(1),'12.6');near(2*Math.sqrt(100),20,0);
});

test('content ch5 tails',()=>{
 assert.equal((.0027*250).toFixed(1),'0.7');
 const lr=q=>M.logReturns(q),tN=mc({},400,q=>M.tailShare(lr(q),3)),tT=mc({tails:'t'},400,q=>M.tailShare(lr(q),3));
 assert.equal(f(M.mean(tN)),'0.25');assert.equal((M.mean(tN)*250).toFixed(1),'0.6');assert.equal(f(M.mean(tT)),'1.01');assert.equal((M.mean(tT)*250).toFixed(1),'2.5');
 assert.ok(M.mean(tT)/M.mean(tN)>3.5&&M.mean(tT)/M.mean(tN)<4.5,'about four times');
 assert.equal(M.mean(mc({tails:'t'},400,q=>M.moments(lr(q)).kurtosis)).toFixed(1),'2.1');
 assert.equal(f(M.mean(mc({},400,q=>M.sd(lr(q))))),'0.99');assert.equal(f(M.mean(mc({tails:'t'},400,q=>M.sd(lr(q))))),'0.99');
 assert.equal(f(median(mc({},400,q=>Math.min(...lr(q))))),'-2.77');assert.equal(f(median(mc({tails:'t'},400,q=>Math.min(...lr(q))))),'-3.33');
 const r=SR(),m=M.mean(r),s=M.sd(r);
 assert.deepEqual([f(m),f(s),f(r[79]),((r[79]-m)/s).toFixed(2)],['-0.03','2.23','-7.40','-3.30']);
 assert.deepEqual(r.map((v,i)=>[i+2,v]).filter(([,v])=>Math.abs(v-m)>3*s).map(([d])=>d),[81],'day 81 is the only day beyond 3σ');
 assert.equal(M.moments(r).kurtosis.toFixed(2),'-0.63');assert.equal(M.moments(M.logReturns(SC().slice(0,80))).kurtosis.toFixed(2),'-1.94');
});

test('content ch6 revert',()=>{
 assert.equal(M.acfBand(250).toFixed(3),'0.124');assert.equal(M.acfBand(119).toFixed(3),'0.180');
 const ac=o=>mc(o,300,q=>M.autocorr(M.logReturns(q),1)),out=a=>a.filter(v=>Math.abs(v)>M.acfBand(250)).length/a.length;
 const ph=ac({phi:.3}),kp=ac({kappa:.2});
 assert.equal(M.mean(ph).toFixed(3),'0.283');assert.equal(f(out(ph),1),'99.7');assert.equal(M.mean(kp).toFixed(3),'-0.109');assert.equal(f(out(kp),0),'40');
 const g=M.logReturns(SC().slice(0,120)),a=M.acf(g,8);
 assert.deepEqual([g.length,a[0].toFixed(3),a[3].toFixed(2),a[7].toFixed(2)],[119,'0.435','-0.79','0.81']);
 assert.equal(M.mean(mc({},100,q=>M.autocorr(q,1))).toFixed(2),'0.97');assert.equal(M.autocorr(SC(),1).toFixed(2),'0.95');
});

test('content ch7 trend',()=>{
 const g=M.logReturns(SC().slice(0,120));
 assert.deepEqual([2,5,8].map(q=>M.varianceRatio(g,q).vr.toFixed(3)),['1.453','1.041','0.141']);
 const z=M.monteCarlo({n:250,seed:11},4000,p=>M.varianceRatio(M.logReturns(p),5).z);assert.equal(f(z.filter(v=>Math.abs(v)>1.96).length/4000,1),'5.6');
 assert.equal(M.mean(M.monteCarlo({n:250,vol:.01,seed:11,kappa:.2},300,p=>M.varianceRatio(M.logReturns(p),5).vr)).toFixed(3),'0.685','κ = 0.2, seed 11, 300 paths: VR(5) 0.685 as in the prose and the lab preset (research V-9 seed 1: 0.675)');
 /* VR(2) ≈ 1 + ρ₁ (exact for the population; the overlapping estimator is close) */
 assert.ok(Math.abs(M.varianceRatio(g,2).vr-(1+M.autocorr(g,1)))<.03);
});

test('content ch8 cross',()=>{
 const p=[100,102,99,100,101,98,100,100,97];assert.equal(p.filter(v=>v===100).length,4);assert.deepEqual(M.levelCrossings(p,100),{count:3,up:1,down:2});
 const cr=o=>M.mean(M.monteCarlo({n:250,vol:.01,...o},300,q=>M.levelCrossings(q,q[0]).count));
 assert.equal(Math.round(cr({})),9);assert.equal(Math.round(cr({kappa:.05})),25);assert.equal(Math.round(cr({kappa:.2})),52);
 assert.ok(cr({kappa:.2})/cr({})>5,'more than five times');assert.equal(Math.round(cr({n:1000})),20);
 const c=SC(),L=x=>M.crossingsOfLevels(x,M.HARIN_LINES).total;
 assert.deepEqual([L(c),L(c.slice(0,80)),L(c.slice(79,120)),L(c.slice(119)),M.levelCrossings(c,20000).count,M.levelCrossings(c.slice(0,80),20000).count],[322,256,10,56,19,19]);
 assert.equal(M.levelCrossings([100,101,100,101,100],100).count,0);
});

test('content ch9 drawdown',()=>{
 near(M.recoveryNeeded(-.2),.25,1e-12);near(M.recoveryNeeded(-.5),1,1e-12);assert.equal(f(M.recoveryNeeded(-.3),1),'42.9');assert.equal(f(M.recoveryNeeded(-.4),1),'66.7');
 near(.7*1.3,.91,1e-12);assert.equal(f(1000/750-1,1),'33.3');assert.equal(f(1000/600-1,1),'66.7');near(750/600-1,.25,1e-12);
 const c=SC(),d=M.maxDrawdown(c);
 assert.deepEqual([f(d.mdd,1),d.peak+1,c[d.peak],d.trough+1,c[d.trough],d.recovery,f(M.recoveryNeeded(d.mdd),1),d.longestUnderwater],['-25.8',74,21300,181,15810,null,'34.7',176]);
 const L=M.leveragedPath(FLAT(.015),2,{start:100}),I=M.leveragedPath(FLAT(.015),-2,{start:100});
 assert.equal(f(M.maxDrawdown(M.pathFromReturns(100,FLAT(.015))).mdd,3),'-1.478');assert.equal(f(M.maxDrawdown(L).mdd),'-8.15');assert.equal(f(M.maxDrawdown(I).mdd),'-17.76');
 assert.ok(Math.max(...L.slice(2))<L[1],'2x never regains its first-day peak');
 const md=o=>median(M.monteCarlo({n:250,vol:.01,...o},300,q=>M.maxDrawdown(q).mdd));
 assert.equal(f(md({}),0),'-16');assert.equal(f(md({kappa:.05}),0),'-12');assert.equal(f(md({kappa:.2}),0),'-8');
});

test('content ch10 final: two records',()=>{
 const p=NURI(),R=M.simpleReturns(p),L=M.leveragedPath(R,2,{start:100}),lr=M.logReturns(p),v=M.variance(lr,0);
 assert.deepEqual([p[0],p[250].toFixed(2),Math.min(...p).toFixed(1),Math.max(...p).toFixed(1)],[100,'100.02','81.2','106.8']);
 assert.deepEqual([L[250].toFixed(2),f(L[250]/100-1),f(M.staticLeverage(p[250]/100-1,2))],['95.97','-4.03','0.04']);
 assert.deepEqual([f(M.sd(lr)),f(M.annualizeVol(M.sd(lr)),1),(v*250).toFixed(4)],['1.29','20.4','0.0414']);
 assert.equal(M.leveragedApprox(p[250]/100,2,v,250).toFixed(4),'0.9598');assert.equal((1.0002**2*Math.exp(-.0414)).toFixed(4),'0.9598');assert.equal((L[250]/100).toFixed(4),'0.9597');
 assert.deepEqual([f(M.maxDrawdown(p).mdd,1),f(M.maxDrawdown(L).mdd,1)],['-24.0','-43.0']);
 const y=SY(),c=SC(),S=M.summarize(c),atr=M.atrWilder(y,14),v8=M.varianceRatio(M.logReturns(c),8);
 assert.deepEqual([S.n,f(S.annualVol,1),atr[249].toFixed(1),c[249],f(atr[249]/c[249]),S.ac1.toFixed(3),S.band.toFixed(3)],[249,'35.3','301.5',19090,'1.58','0.362','0.124']);
 assert.deepEqual([S.vr.vr.toFixed(2),S.vr.z.toFixed(2),v8.vr.toFixed(3),v8.z.toFixed(2)],['1.02','0.15','0.344','-3.50']);
 assert.equal(M.crossingsOfLevels(c,M.HARIN_LINES).total,322);assert.equal(f(S.mdd.mdd,1),'-25.8');assert.equal(S.mdd.recovery,null);
 assert.equal(M.autocorr(M.logReturns(c.slice(0,120)),1).toFixed(3),'0.435');
 const gr=M.logReturns(c.slice(119));assert.equal(gr.length,130);
 assert.deepEqual([M.autocorr(gr,1).toFixed(3),M.varianceRatio(gr,5).vr.toFixed(2),M.varianceRatio(gr,8).vr.toFixed(3)],['0.103','1.02','0.955']);
 assert.ok(Math.abs(M.autocorr(gr,1))<M.acfBand(130)&&Math.abs(M.varianceRatio(gr,5).z)<1.96&&Math.abs(M.varianceRatio(gr,8).z)<1.96,'generated part is indistinguishable from a random walk');
 const sd=M.sd(M.logReturns(c));assert.equal(f(sd),'2.23');
 const sim=M.monteCarlo({n:250,vol:sd,start:20000,seed:1},1000,q=>{const l=M.logReturns(q);return {z8:M.varianceRatio(l,8).z,ac:M.autocorr(l,1),cr:M.crossingsOfLevels(q,M.HARIN_LINES).total,md:M.maxDrawdown(q).mdd};});
 assert.deepEqual([sim.filter(s=>s.z8<=v8.z).length,sim.filter(s=>s.ac>=S.ac1).length,sim.filter(s=>s.cr>=322).length,sim.filter(s=>s.md<S.mdd.mdd).length],[0,0,85,731]);
});

test('lab prediction answers (L2) proposed for the guides',()=>{
 /* 1 returns: 100 → 80 → 100 */
 const r1=M.simpleReturns([100,80,100]);near(r1[0],-.2,1e-12);near(r1[1],.25,1e-12);near(M.mean(r1),.025,1e-12);near(M.compound(r1),0,1e-12);near(M.compound(M.logReturns([100,80,100]),'log'),0,1e-12);
 /* 2 drag: a = 2.5% */
 assert.equal(f(M.leveragedPath(FLAT(.025),2,{start:1})[250]-1),'-14.15');
 /* 3 measure: ATR(5) on day 81 */
 const y=SY(),a5=M.atrWilder(y,5),a14=M.atrWilder(y,14);assert.deepEqual([a5[79].toFixed(1),a5[80].toFixed(1),(a5[80]-a5[79]).toFixed(0),(a14[80]-a14[79]).toFixed(0)],['675.5','842.4','167','60']);
 /* 4 walk: of 200 paths, ending more than 20% away from the start */
 assert.equal(mc({},200,q=>Math.abs(q[250]/q[0]-1)>.2?1:0).reduce((s,x)=>s+x,0),41);
 /* 5 tails: ν = 30 */
 assert.equal(f(M.mean(mc({tails:'t',nu:30},400,q=>M.tailShare(M.logReturns(q),3)))),'0.39');
 /* 6 revert: κ = 0.05 */
 const k5=mc({kappa:.05},300,q=>M.autocorr(M.logReturns(q),1));assert.equal(M.mean(k5).toFixed(3),'-0.036');assert.equal(f(k5.filter(v=>Math.abs(v)>M.acfBand(250)).length/300,1),'8.7');
 /* 7 trend: power of VR(5) against κ = 0.05 */
 const p7=M.monteCarlo({n:250,seed:11,kappa:.05},1000,p=>M.varianceRatio(M.logReturns(p),5));
 assert.equal(f(p7.filter(v=>Math.abs(v.z)>1.96).length/1000,1),'8.1');assert.equal(M.mean(p7.map(v=>v.vr)).toFixed(2),'0.91');
 /* 8 cross: doubling vol leaves the start-line crossing count unchanged (scale invariance with zero drift) */
 const c1=M.monteCarlo({n:250,vol:.01},300,q=>M.levelCrossings(q,q[0]).count),c2=M.monteCarlo({n:250,vol:.02},300,q=>M.levelCrossings(q,q[0]).count);
 assert.deepEqual(c2,c1);assert.equal(M.mean(c2).toFixed(1),'8.9');
 /* 9 drawdown: 1,000 days */
 assert.equal(f(median(M.monteCarlo({n:1000,vol:.01},300,q=>M.maxDrawdown(q).mdd)),1),'-29.7');
 /* 10 final: inverse 2x on the 누리200 year */
 assert.equal(M.leveragedPath(M.simpleReturns(NURI()),-2,{start:100})[250].toFixed(2),'88.29');
});

test('review.json numbers',()=>{
 assert.equal(f(Math.log(21300/20600),3),'3.342');assert.equal(f(M.annualizeVol(.015,252),1),'23.8');
 assert.equal(f(M.mean(M.monteCarlo({n:250,vol:.01,seed:1,tails:'t'},400,q=>M.tailShare(M.logReturns(q),3))),0),'1');
 assert.equal(f(M.leveragedPath([.015,1/1.015-1],2,{start:1})[2]-1,3),'-0.044');
});

test('content.js and review.json have the template fields',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/content.js'),'utf8'),ctx);
 const B=JSON.parse(JSON.stringify(ctx.window.VBook)),ids=['returns','drag','measure','walk','tails','revert','trend','cross','drawdown','final'];
 assert.deepEqual(B.chapters.map(c=>c.id),ids);
 B.sources.forEach(s=>{assert.equal(s.length,3);assert.match(s[1],/^https:\/\//);assert.ok(s[2].length>20);});
 const advice=/(사세요|파세요|매수하세요|매도하세요|추천|권합니다|오를 것|내릴 것|오를 겁니다|내릴 겁니다)/;
 B.chapters.forEach((c,i)=>{
  for(const k of ['title','subtitle','desc','time','group','recall','formula','formulaNote','warning'])assert.ok(typeof c[k]==='string'&&c[k].length,c.id+' '+k);
  assert.equal(c.labs.length,1);assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4);c.flow.forEach(x=>assert.match(x,/^[^|]+\|[^|]+$/,c.id+' flow'));
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3);assert.ok(q[2]>=0&&q[2]<3);assert.ok(q[3].length>20);}
  assert.ok(Array.isArray(c.source)&&c.source.every(n=>n>=0&&n<B.sources.length),c.id+' source index');
  assert.ok(Array.isArray(c.cross)&&c.details.length>=1);c.cross.forEach(x=>{assert.equal(x.length,3);assert.match(x[1],/^\.\.\/[a-z-]+\/#[a-z-]+$/);});
  assert.doesNotMatch(JSON.stringify(c),advice,c.id+' no advice or prediction');
  assert.doesNotMatch(JSON.stringify(c),/<(?!\/?(p|b)>)/,c.id+' only <p> and <b> tags');
  if(i<ids.length-1)assert.ok(c.paragraphs[3].trim().endsWith('?'),c.id+' ends with the remaining question');
 });
 assert.equal(B.chapters[0].paragraphs[0].includes('가상의 지수'),true,'누리200 is introduced as fictional');
 const R=JSON.parse(fs.readFileSync(path.join(__dirname,'../review.json'),'utf8'));assert.equal(R.schema,1);assert.equal(R.book,'volatility');assert.deepEqual(Object.keys(R.chapters),ids);
 const pos=[0,0,0];
 Object.values(R.chapters).forEach(list=>{assert.ok(list.length>=2&&list.length<=3);list.forEach(q=>{assert.equal(q.choices.length,3);assert.ok(q.answer>=0&&q.answer<3);pos[q.answer]++;assert.ok(q.why.length>20);assert.doesNotMatch(q.q+q.why,advice);});});
 assert.ok(Math.min(...pos)>=8,'answers spread over the three positions: '+pos);
});
