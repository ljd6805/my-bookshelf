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
 assert.equal(c[249],14750,'day 250 close (seed 8, vol 1.5%, kappa 0; provisional until G3)');
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
