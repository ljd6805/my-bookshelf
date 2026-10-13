/* 자산배분 계산의 대표값·경계값·불변 조건. 기준값은 docs/research.html의 V-0~V-10과 docs/index.html #chapters의 해결 결과·L2·확인·전이 칸이다.
   기대값은 문서의 숫자 문자열로 따로 적고 math.js(AMath)의 결과와 대조한다. 불변 조건(비중 합 1, ρ = 1이면 σ가 비중대로 더해짐, ρ = 0이면
   분산이 σ²/N, 불가능한 상관 표는 음수 고윳값으로 드러남, 켈리 성장률은 f*에서 가장 큼, 현금과 섞어도 샤프 비율 그대로)은 결정적 시드의
   무작위 입력에서도 맞아야 한다. 마지막 테스트들은 content.js와 review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지,
   L2 답이 본문·확인 문제·복습 문제에 새어 나가지 않았는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const f1=x=>M.round(x,1).toFixed(1),f2=x=>M.round(x,2).toFixed(2),f3=x=>M.round(x,3).toFixed(3),f4=x=>M.round(x,4).toFixed(4),pct=(x,d=2)=>M.round(x*100,d).toFixed(d);
const A=M.ASSETS,Y=M.ASSUME.yoon,two=(w,i,j,rho=A.corr[i][j])=>M.twoAsset(w,M.asset(i),M.asset(j),rho);

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
const d=M.ASSUME.diversify;
put('div',{table:d.ns.map(n=>M.equalSigma(d.sigma,d.rho,n)),zero9:M.equalSigma(0.3,0,9),wrong9:0.3/9,L2:[M.equalSigma(0.2,0.5,4),M.equalSigma(0.2,0.5,Infinity)],
 pairStocks:M.twoAsset(0.5,M.asset(0),{mu:0.07,sigma:0.18},0.67),avg:(0.35+0.18)/2,var30:0.09,varPart:0.09*0.3});
put('cov',{matrix:M.covMatrix(),sigma3:M.covMatrix([0.18,0.16,0.06],[[1,0.6,-0.2],[0.6,1,0],[-0.2,0,1]]),w532:[0.5,0.3,0.2],eig:M.checkCorr([[1,0.6,-0.2],[0.6,1,0],[-0.2,0,1]]),
 four:M.checkCorr(M.equalCorr(4,0.5)),impossible:M.checkCorr(M.ASSUME.impossible),ten:M.firstEigen(10,0.5),tenWrong:10*0.5,full:M.checkCorr(A.corr),crisis5:M.checkCorr(M.crisisCorr()),crisis4:M.checkCorr(M.crisisCorr(undefined,4)),L2:M.covariance(0.4,0.25,0.10)});
C.cov.v532=M.portVar([0,0.5,0.3,0.2,0],M.covMatrix());C.cov.s532=Math.sqrt(C.cov.v532);
C.div.parts=d.ns.filter(n=>n!==Infinity).map(n=>[d.sigma**2/n,(1-1/n)*d.rho*d.sigma**2]);C.div.gap=M.round(C.div.table[3]*100,2)-M.round(C.div.table[5]*100,2);
put('pair',{curve:[0,0.2,0.4,0.6,0.8,1].map(w=>two(w,1,3)),rho1:two(0.6,1,3,1),minW:M.minVar2(0.18,0.06,-0.2),L2:[M.twoAsset(0.5,{sigma:0.2},{sigma:0.1},0),M.minVar2(0.2,0.1,0)],neg:10/30,
 parts:{num:0.0036-(-0.2*0.18*0.06),den:0.0324+0.0036-2*(-0.2)*0.18*0.06}});
C.pair.minPt=two(C.pair.minW,1,3);
put('front',{tan:M.tangency(true),minU:M.minVariance(false),minL:M.minVariance(true),sharpes:[0,1,2,3].map(i=>M.sharpe(A.mu[i],A.sigma[i])),grid:M.bestUnderSigma(),cash:null,
 shiftNuri:M.tangencyShift(1,0.01),shiftGlobal:M.tangencyShift(2,0.01),start:{w:[0,0.4,0.2,0.4,0]},alt:{w:[0,0.3,0.3,0.4,0]},L2:[M.sharpe(0.08,0.2,0.03),M.sharpe(0.05,0.1,0.03)],transfer:[M.sharpe(0.09,0.18,0.03),M.sharpe(0.06,0.09,0.03)],tanU:M.tangency(false)});
C.front.cash=M.cashMix(C.front.tan,M.ASSUME.cashTarget);for(const k of ['start','alt']){const w=C.front[k].w;C.front[k].mu=M.portMu(w);C.front[k].sigma=M.portSigma(w);C.front[k].sharpe=M.sharpe(C.front[k].mu,C.front[k].sigma);}
put('beta',{est:M.beta(),drop:M.ASSUME.months.market.map((_,k)=>M.beta(M.ASSUME.months.market.filter((x,i)=>i!==k),M.ASSUME.months.stock.filter((x,i)=>i!==k)).beta),
 capm:M.capm(4.4,1.31,4.9),capmExact:M.capm(4.4,M.beta().beta,4.9),capm1:M.capm(4.4,1,4.9),split:M.riskSplit(),L2:M.beta([1,-2,3,0,-1,2],[1,-1,2,0,-1,2]),transfer:0.5*40/20,transferWrong:40/20});
put('mix',{rows:M.ASSUME.mixes.map(w=>M.mix(...w)),L2:M.targetStock(0.08,0),transfer:M.targetStock(0.12,0),cash60:M.mix(0.6,0,0.4),wrong60:0.36*18,target10:M.targetStock(0.10,0.1),half:M.mix(0.5,0,0.5)});
put('reb',{none:M.rebalance('none'),annual:M.rebalance('annual'),band:M.rebalance('band'),L2:M.rebalance('annual',{start:2000,target:0.5,band:0.05,stock:[0.3],bond:[0]}),y1:{stock:6000*1.3,bond:4000*1.02}});
C.front.mix6040=(()=>{const w=[0,0.6,0,0.4,0],m=M.portMu(w),sg=M.portSigma(w);return {mu:m,sigma:sg,sharpe:M.sharpe(m,sg)};})();
C.reb.y1.total=C.reb.y1.stock+C.reb.y1.bond;C.reb.y1.target=0.6*C.reb.y1.total;C.reb.years=M.FACTS.vanguard.years[1]-M.FACTS.vanguard.years[0]+1;
put('kelly',{table:M.kellyTable(),f:M.kellyF(0.55,1),cont:[0.07,0.05,0.04].map(m=>M.kellyContinuous(m,0.025,0.18)),L2:M.kellyF(0.45,2),zero:M.kellyF(0.5,1),misread:M.misread(0.6,0.55,1),prose:M.misread(0.58,0.55,1),
 gStar:M.growth(0.1,0.55,1),streak:[0.9**5,0.95**5,0.8**5,0.7**5]});
const cs=M.ASSUME.crisis6040,w64=[0.6,0.4];
put('crisis',{four:M.ASSUME.crisisFour.rho.map(r=>M.equalSigma(0.25,r,4)),one:M.equalSigma(0.25,1,4),normal:two(0.6,1,3),crisisRho:M.twoAsset(0.6,{sigma:0.18},{sigma:0.06},0.5),both:M.twoAsset(0.6,{sigma:cs.crisis.s1},{sigma:cs.crisis.s2},cs.crisis.rho),
 normalCorr:M.crisisSigma([0,0.6,0,0.4,0],[[1,0,0,0,0],[0,1,0,-0.2,0],[0,0,1,0,0],[0,-0.2,0,1,0],[0,0,0,0,1]]),L2:M.twoAsset(0.6,{sigma:0.3},{sigma:0.06},0.3),rho1:M.twoAsset(0.6,{sigma:0.3},{sigma:0.08},1),
 volOnly:M.twoAsset(0.6,{sigma:0.3},{sigma:0.08},-0.2),stockBond:M.twoAsset(0.6,{sigma:0.18},{sigma:0.06},0.3),w64});
C.crisis.gaps=[0.25-C.crisis.four[0],0.25-C.crisis.four[1],C.crisis.four[1]-C.crisis.four[0],C.crisis.both.sigma-C.crisis.normal.sigma].map(x=>M.round(x*100,2)/100);
put('final',{irpRiskyA:Y.plans.A.irp[1]+Y.plans.A.irp[2],A:M.evaluatePlan(Y.plans.A),B:M.evaluatePlan(Y.plans.B),C:M.evaluatePlan({w:[0.1,0.25,0.25,0.3,0.1]}),D:M.evaluatePlan({w:[0,0.2,0.2,0.45,0.15]}),need:Y.livingCost*Y.years,limit:Y.lossLimit});
/* 확인·전이 문제와 복습 문제의 계산(새 사례와 오답 보기 포함) */
put('rv',{div:[M.equalSigma(0.4,0.2,4),M.equalSigma(0.4,0.25,Infinity),0.4/4,0.4*0.25,0.16/4+0.75*0.2*0.16],
 pairVar:0.0625*0.04+0.5625*0.0025,mat:[M.covariance(-0.5,0.2,0.3),M.twoAsset(0.5,{sigma:0.2},{sigma:0.1},0.5),(0.2+0.1)/2,0.25*0.04+0.25*0.01+2*0.25*0.5*0.2*0.1,M.firstEigen(5,0.6),M.firstEigen(5,0.6)/5,M.covariance(0.5,0.2,0.3)*2],
 pair:[M.twoAsset(0.25,{mu:0.08,sigma:0.2},{mu:0.04,sigma:0.05},0),0.25*0.2+0.75*0.05,0.75*0.75,0.25*0.25,0.05*0.05,M.minVar2(0.2,0.1,0.25),0.01-0.25*0.2*0.1,0.04+0.01-2*0.25*0.02,0.5*0.08+0.5*0.04+0.01],
 front:[M.sharpe(0.09,0.2,0.02),M.sharpe(0.05,0.1,0.02),M.cashMix({mu:0.065,sigma:0.10,sharpe:0.4},0.04),0.4*0.065],
 beta:[M.beta([2,-2,4,0],[3,-3,6,0]).beta,M.capm(3,0.8,5),M.capm(3,1,5),0.8*5,0.8*8,M.riskSplit(0.6,0.3,0.2),(0.9*0.2)**2,0.3*0.3,2/3],
 mix:[M.mix(0.5,0.4,0.1),0.5*18+0.4*6,M.mix(0.7,0,0.3),0.7*7,0.0324,0.0036,0.25*0.0324+0.16*0.0036+2*0.5*0.4*(-0.2)*0.18*0.06,5-2*10,5-10],
 reb:[M.rebalance('annual',{start:10000,target:0.6,band:0.05,stock:[0.2],bond:[0]}),M.rebalance('band',{start:10000,target:0.6,band:0.05,stock:[0.2],bond:[0]}),6000*0.2,6000*1.2,0.6*11200,0.12*6000],
 kelly:[M.kellyF(0.7,1),M.kellyF(0.5,2),M.growth(0.4,0.6,1),M.growth(0.2,0.6,1)],
 crisis:[M.equalSigma(0.2,0.2,2),M.equalSigma(0.2,0.9,2),M.equalSigma(0.25,0.81,Infinity),0.04/2+0.2*0.04/2,0.04/2+0.9*0.04/2,25*0.81],
 fin:[M.evaluatePlan({w:[0,0.3,0.2,0.35,0.15]}),M.evaluatePlan({w:[0.2,0.3,0.25,0.2,0.05]}),0.3*-0.35,0.3*0.35*30000]});

test('assumptions, the four time-sensitive values and research facts live in one table each, with labels',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.equal(M.ASSUME.assets,A);assert.match(A.label,/미리 정한 가정 · 예측 아님/);assert.match(A.weightsNote,/권하는 비중이 아닙니다/);
 assert.deepEqual([A.mu,A.sigma],[[0.09,0.07,0.065,0.035,0.025],[0.35,0.18,0.16,0.06,0]]);
 const t=Object.entries(M.MARKET).filter(([,v])=>v&&v.timeSensitive);assert.deepEqual(t.map(([k])=>k),['pensionLimit','tdfException','rf10y','erp'],'exactly four ⏱ values');
 assert.equal(M.MARKET.pensionLimit.label,'보도 기준 · 법령 원문 확인 못함');assert.equal(M.MARKET.tdfException.label,'보도 기준 · 법령 원문 확인 못함');
 for(const k of ['rf10y','erp'])assert.equal(M.MARKET[k].label,'6권 확인값 · 서재 안 재인용');
 assert.deepEqual([M.MARKET.rf10y.value,M.MARKET.erp.value,M.MARKET.pensionLimit.value],[0.044,0.049,0.70]);assert.equal(M.MARKET.recheck,'한도와 금리는 바뀌므로 확인일을 보고 다시 확인하세요');
 const src=read('js/math.js');for(const n of ['0.04395','0.0487','2026-06-23','2026-03-31'])assert.equal(src.split(n).length-1,1,n+' appears only once (in MARKET)');
 for(const v of Object.values(M.assumptions))assert.match(v,/가정|가상|연습|반올림/);assert.match(M.assumptions.kelly,/이 책은 돈을 빌려 이 비율을 채우는 계산을 하지 않는다/);
 assert.deepEqual([M.FACTS.brinson.explained,M.FACTS.ibbotson.time,M.FACTS.ibbotson.between,M.FACTS.vanguard.monthlyTrades,M.FACTS.vanguard.annualTrades],[0.936,0.9,0.4,1008,83]);
});
test('V-0 the assumed correlation matrix is valid (eigenvalues 0.260 … 2.150); the crisis matrices too (0.1 · 0.1 · 0.861 · 1 · 2.939)',()=>{
 assert.deepEqual(C.cov.full.values.map(f3),['0.260','0.589','1.000','1.001','2.150']);assert.equal(C.cov.full.ok,true);
 assert.deepEqual(C.cov.crisis5.values.map(f3),['0.100','0.100','0.861','1.000','2.939']);assert.deepEqual(C.cov.crisis4.values.map(f3),['0.100','0.100','0.861','2.939']);
 assert.deepEqual(C.final.A.crisisEig.map(f3),['0.100','0.100','0.861','2.939']);
});
test('V-1 equal weights σ 30%, ρ 0.3: 30.00 · 24.19 · 19.90 · 18.25 · 17.06 · 16.43 (floor); ρ 0 nine stocks 10.00; L2 15.81 and floor 14.14',()=>{
 assert.deepEqual(C.div.table.map(x=>pct(x)),['30.00','24.19','19.90','18.25','17.06','16.43']);assert.equal(pct(C.div.zero9),'10.00');
 assert.deepEqual(C.div.L2.map(x=>pct(x)),['15.81','14.14']);assert.equal(pct(M.equalSigma(0.3,1,50)),'30.00','ρ = 1 never falls');
 assert.deepEqual([pct(C.div.pairStocks.sigma),pct(C.div.pairStocks.mu),pct(C.div.avg)],['24.46','8.00','26.50']);
 assert.throws(()=>M.equalSigma(0.3,-0.5,4),/impossible/);assert.throws(()=>M.equalSigma(0.3,0.3,0),RangeError);assert.throws(()=>M.equalSigma(0.3,1.2,4),RangeError);
});
test('V-2 Σ of 누리200·해외·채권, eigenvalues 0.368 · 1.000 · 1.632; four stocks ρ 0.5 → 2.5 (62.5%); the impossible table → −0.8 · 1.9 · 1.9; L2 0.0100',()=>{
 const S=C.cov.sigma3;assert.deepEqual(S.flat().map(f4),['0.0324','0.0173','-0.0022','0.0173','0.0256','0.0000','-0.0022','0.0000','0.0036']);
 assert.deepEqual(C.cov.eig.values.map(f3),['0.368','1.000','1.632']);assert.equal(pct(C.cov.eig.maxShare,1),'54.4');
 assert.deepEqual(C.cov.four.values.map(f3),['0.500','0.500','0.500','2.500']);assert.equal(pct(C.cov.four.maxShare,1),'62.5');assert.equal(M.firstEigen(4,0.5),2.5);
 assert.equal(C.cov.impossible.ok,false);assert.deepEqual(C.cov.impossible.values.map(f1),['-0.8','1.9','1.9']);assert.match(C.cov.impossible.reason,/음수/);
 assert.equal(f4(C.cov.L2),'0.0100');assert.equal(C.cov.ten,5.5);assert.deepEqual([f4(C.cov.v532),pct(Math.sqrt(C.cov.v532))],['0.0153','12.37']);
 assert.throws(()=>M.checkCorr([[1,1.2],[1.2,1]]),RangeError);assert.throws(()=>M.checkCorr([[2,0],[0,1]]),/diagonal/);assert.throws(()=>M.portVar([1,0],M.covMatrix()),/size/);
});
test('V-3 누리200·채권 ρ −0.2: σ 6.00 · 5.39 · 7.38 · 10.58 · 14.21 · 18.00, w* 14.29% (σ 5.27, μ 4.00); ρ 1 → 13.20; L2 11.18, 20%, 8.94; ρ −1 → 33.3%',()=>{
 assert.deepEqual(C.pair.curve.map(p=>pct(p.sigma)),['6.00','5.39','7.38','10.58','14.21','18.00']);assert.deepEqual(C.pair.curve.map(p=>pct(p.mu,1)),['3.5','4.2','4.9','5.6','6.3','7.0']);
 assert.deepEqual([pct(C.pair.minW),pct(C.pair.minPt.sigma),pct(C.pair.minPt.mu)],['14.29','5.27','4.00']);assert.equal(pct(C.pair.rho1.sigma),'13.20');
 assert.deepEqual([pct(C.pair.L2[0].sigma),pct(C.pair.L2[1]),pct(M.twoAsset(C.pair.L2[1],{sigma:0.2},{sigma:0.1},0).sigma)],['11.18','20.00','8.94']);
 assert.equal(pct(M.minVar2(0.2,0.1,-1),1),'33.3');assert.equal(M.twoAsset(1/3,{sigma:0.2},{sigma:0.1},-1).sigma<1e-12,true);
 assert.deepEqual([f5(C.pair.parts.num),f4(C.pair.parts.den)],['0.00576','0.0403']);assert.throws(()=>M.minVar2(0.1,0.1,1),/as one/);assert.throws(()=>M.twoAsset(0.5,M.asset(1),M.asset(3),1.5),RangeError);
});
function f5(x){return M.round(x,5).toFixed(5);}
test('V-4 tangency 22.52 · 13.30 · 64.18 (μ 4.687, σ 6.316, Sharpe 0.3463); min-variance; σ ≤ 8% grid point 28.3 · 22.7 · 49.0; cash 79.16 / 20.84; shifts',()=>{
 const t=C.front.tan;assert.deepEqual([...t.w.map(x=>pct(x)),pct(t.mu,3),pct(t.sigma,3),f4(t.sharpe)],['22.52','13.30','64.18','4.687','6.316','0.3463']);
 const u=C.front.minU;assert.deepEqual([...u.w.map(x=>pct(x)),pct(u.mu,3),pct(u.sigma,3)],['13.19','1.92','84.89','4.019','5.264']);
 assert.deepEqual(C.front.sharpes.map(f3),['0.186','0.250','0.250','0.167']);
 const g=C.front.grid;assert.deepEqual([...g.w.map(x=>pct(x,1)),pct(g.mu),pct(g.sigma)],['28.3','22.7','49.0','5.17','8.00']);assert.ok(g.sigma<=0.08);
 assert.deepEqual([pct(C.front.cash.share),pct(C.front.cash.cash),pct(C.front.cash.mu)],['79.16','20.84','4.23']);
 assert.deepEqual(C.front.shiftNuri.w.map(x=>pct(x)),['29.35','6.41','64.23']);assert.deepEqual(C.front.shiftGlobal.w.map(x=>pct(x)),['15.98','24.39','59.62']);assert.equal(A.mu[1],0.07,'μ restored after the shift');
 assert.deepEqual([pct(C.front.start.mu),pct(C.front.start.sigma),f4(C.front.start.sharpe)],['5.50','9.41','0.3188']);assert.deepEqual([pct(C.front.alt.mu),pct(C.front.alt.sigma)],['5.45','9.16']);
 assert.deepEqual(C.front.L2.map(f2),['0.25','0.20']);assert.deepEqual(C.front.transfer.map(f3),['0.333','0.333']);
 assert.ok(C.front.tanU.sharpe>=t.sharpe-1e-12,'the constraint cannot raise the best Sharpe ratio');
});
test('V-5 β 1.3118 (corr 0.9435), drop-one range 1.2419 – 1.4836; CAPM 4.4 + 1.31 × 4.9 = 10.82 (10.83 unrounded), β 1 → 9.30; V-0 split β 1.30, 44.9%, 26.0%; L2 0.714',()=>{
 assert.deepEqual([f4(C.beta.est.beta),f4(C.beta.est.corr)],['1.3118','0.9435']);
 assert.deepEqual([f4(Math.min(...C.beta.drop)),f4(Math.max(...C.beta.drop))],['1.2419','1.4836']);
 assert.deepEqual([f2(C.beta.capm),f2(C.beta.capmExact),f2(C.beta.capm1)],['10.82','10.83','9.30']);
 assert.deepEqual([f2(C.beta.split.beta),pct(C.beta.split.systematic,1),f4(C.beta.split.systematic),pct(C.beta.split.idio,1)],['1.30','44.9','0.4489','26.0']);
 assert.equal(f3(C.beta.L2.beta),'0.714');assert.equal(C.beta.transfer,1);assert.throws(()=>M.beta([1,1,1],[1,2,3]),/no variation/);assert.throws(()=>M.beta([1,2],[1,2]),RangeError);
});
test('V-6 mixes 80·10·10 … 20·70·10 (μ, σ, μ − 2σ); 60/40 cash 10.80; L2 44.26 / 5.05; transfer 67.98 / 5.88; σ 10% with 10% cash → 56.70 · 33.30',()=>{
 assert.deepEqual(C.mix.rows.map(r=>[pct(r.mu),pct(r.sigma),pct(r.bad)]),[['6.20','14.29','-22.38'],['5.50','10.59','-15.68'],['4.80','7.22','-9.65'],['4.10','4.95','-5.81']]);
 assert.equal(pct(C.mix.cash60.sigma),'10.80');assert.deepEqual([pct(C.mix.L2.w[0]),pct(C.mix.L2.mu)],['44.26','5.05']);assert.deepEqual([pct(C.mix.transfer.w[0]),pct(C.mix.transfer.mu)],['67.98','5.88']);
 const t=C.mix.target10;assert.deepEqual([pct(t.w[0]),pct(t.w[1]),pct(t.mu),pct(t.sigma)],['56.70','33.30','5.38','10.00']);assert.equal(pct(C.mix.half.sigma),'9.00');
 assert.throws(()=>M.targetStock(0.03),/minimum/);assert.throws(()=>M.targetStock(0.2),/stock-only/);assert.throws(()=>M.mix(0.5,0.4,0.2),/add up to 1/);
});
test('V-7 none 1억 2,221만; annual trades +672.0 −883.9 +473.5 +196.1 → 1억 2,511만; band +672.0 −883.9 0 +697.0 → 1억 2,544만; L2 150만 · 56.52%',()=>{
 assert.equal(f1(C.reb.none.end),'12221.1');assert.deepEqual(C.reb.annual.rows.map(r=>f1(r.trade)),['672.0','-883.9','473.5','196.1']);assert.equal(f1(C.reb.annual.end),'12510.9');
 assert.deepEqual(C.reb.band.rows.map(r=>f1(r.trade)),['672.0','-883.9','0.0','697.0']);assert.equal(f1(C.reb.band.end),'12544.1');
 assert.deepEqual([M.wonText(C.reb.none.end),M.wonText(C.reb.annual.end),M.wonText(C.reb.band.end)],['1억 2,221만 원','1억 2,511만 원','1억 2,544만 원']);
 assert.deepEqual(C.reb.none.rows.map(r=>pct(r.weight)),['65.66','57.49','61.64','63.19']);assert.deepEqual(C.reb.annual.rows.map(r=>pct(r.weight)),['65.66','51.49','64.06','61.57']);
 assert.deepEqual([C.reb.L2.rows[0].trade,pct(C.reb.L2.rows[0].weight)],[150,'56.52']);assert.throws(()=>M.rebalance('monthly'),/rule/);
});
test('V-8 Kelly p 0.55, b 1: f* 0.10; g, median, bottom 10%, ever below half, five losses; continuous 1.3889 · 0.7716 · 0.4630; L2 0.175; misread 2×',()=>{
 const T=C.kelly.table;assert.equal(f2(C.kelly.f),'0.10');
 assert.deepEqual(T.map(r=>r.g.toFixed(6)),['0.003753','0.005008','-0.000138','-0.016203']);assert.deepEqual(T.map(r=>f3(r.median)),['1.455','1.650','0.986','0.198']);
 assert.deepEqual(T.map(r=>f3(r.low10)),['0.798','0.495','0.087','0.005']);assert.deepEqual(T.map(r=>r.belowHalf.toFixed(5)),['0.04355','0.30148','0.70030','0.88514']);
 assert.deepEqual(T.map(r=>f4(r.streak)),['0.7738','0.5905','0.3277','0.1681']);assert.deepEqual(C.kelly.cont.map(f4),['1.3889','0.7716','0.4630']);
 assert.equal(f3(C.kelly.L2),'0.175');assert.equal(C.kelly.zero,0);assert.equal(f1(C.kelly.misread.times),'2.0');assert.equal(C.kelly.misread.g.toFixed(6),'-0.000138');
 assert.deepEqual([f2(C.kelly.prose.f),f1(C.kelly.prose.times),f5(C.kelly.prose.g)],['0.16','1.6','0.00317']);
 assert.throws(()=>M.kellyF(1,1),RangeError);assert.throws(()=>M.growth(1,0.55,1),RangeError);assert.throws(()=>M.kellyContinuous(0.07,0.025,0),RangeError);
});
test('V-9 four stocks 17.23 → 23.05 (ρ 1 → 25.00); 60/40 10.58 → 19.79 (σ and ρ), 17.64 (σ only); L2 18.86',()=>{
 assert.deepEqual(C.crisis.four.map(x=>pct(x)),['17.23','23.05']);assert.equal(pct(C.crisis.one),'25.00');
 assert.deepEqual([pct(C.crisis.normal.sigma),pct(C.crisis.both.sigma),pct(C.crisis.volOnly.sigma)],['10.58','19.79','17.64']);
 assert.equal(pct(C.crisis.normalCorr),'10.58');assert.equal(pct(C.crisis.L2.sigma),'18.86');assert.equal(pct(C.crisis.rho1.sigma),'21.20');
});
test('V-10 plans A and B: μ, σ, crisis σ, scenario loss, safe amount, both conditions, risk contributions, IRP; C and D for L2 and transfer',()=>{
 const a=C.final.A,b=C.final.B;
 assert.deepEqual([pct(a.mu),pct(a.sigma),pct(a.crisisSigma),f2(a.lossPct),a.loss,a.safe,a.cond1,a.cond2],['6.70','16.46','18.72','-31.05',-9315,6000,false,false]);
 assert.deepEqual(a.contrib.slice(0,4).map(x=>pct(x)),['59.42','28.36','12.56','-0.34']);assert.equal(a.irpRisky,0.7);assert.equal(a.limitOk,true);
 assert.deepEqual([pct(b.mu),pct(b.sigma),pct(b.crisisSigma),f2(b.lossPct),b.loss,b.safe,b.cond1,b.cond2],['4.93','7.38','9.30','-14.33',-4298,16500,true,true]);
 assert.deepEqual(b.contrib.slice(0,4).map(x=>pct(x)),['16.71','41.06','35.60','6.63']);assert.equal(b.irpRisky,0.6);assert.deepEqual(b.general,[1500,3000,3000,8000,4500]);
 const c=C.final.C,d=C.final.D;assert.deepEqual([pct(c.mu),pct(c.sigma),pct(c.crisisSigma),f2(c.lossPct),c.loss,c.safe,c.cond1,c.cond2],['5.58','10.06','12.27','-20.40',-6120,12000,false,true]);
 assert.deepEqual([pct(d.mu),pct(d.sigma),pct(d.crisisSigma),f2(d.lossPct),d.loss,d.safe,d.cond1,d.cond2],['4.65','6.36','7.89','-11.73',-3518,18000,true,true]);
 assert.equal(-d.loss>3000,true,'transfer: D fails a 3,000만 limit');assert.ok(Math.abs(a.contrib.reduce((s,x)=>s+x,0)-1)<1e-12,'risk contributions add up to 1');
 assert.throws(()=>M.evaluatePlan({w:[0.3,0.3,0.2,0.1,0.1],irp:[1000,3000,3000,2000,1000]}),/single stock/);
 assert.throws(()=>M.evaluatePlan({w:[0.3,0.3,0.2,0.1,0.2]}),/add up to 1/);assert.throws(()=>M.evaluatePlan({w:[-0.1,0.4,0.2,0.3,0.2]}),/short/);
 assert.throws(()=>M.evaluatePlan({w:[0.3,0.3,0.2,0.1,0.1],irp:[0,4000,3000,2000,2000]}),/IRP holdings/);
});
test('the plan, research and chapter table numbers are the ones computed here',()=>{
 const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]])),all=Object.values(rows).join(' ');
 for(const s of ['15.81%','14.14%','0.0100','11.18%','8.94%','0.714','44.26%','5.05%','150만 원','56.52%','0.175','18.86%','−20.40%','−6,120만 원','10.00%','13.20%','0.3463','10.80%','5.66%p','25.00%','59.42%','−11.73%','−3,518만 원','5.5'])assert.ok(all.includes(s),'chapters: '+s);
 const res=read('docs/research.html');for(const s of ['24.19','19.90','16.43','14.29','22.52','64.18','0.3463','1.3118','10.82','672.0','883.9','1.455','30.1','17.23','23.05','19.79','59.42','16.46','−31.05','−14.33'])assert.ok(res.includes(s),'research: '+s);
});
test('invariants on random inputs: weights add to 1, ρ = 1 adds σ by weight, ρ = 0 gives σ²/N, Kelly growth peaks at f*, cash keeps the Sharpe ratio, impossible tables show',()=>{
 const r=rng(20261013);
 for(let n=0;n<300;n++){
  const s1=0.05+r()*0.4,s2=0.01+r()*0.2,w=r();assert.ok(Math.abs(M.twoAsset(w,{sigma:s1},{sigma:s2},1).sigma-(w*s1+(1-w)*s2))<1e-12,'ρ = 1 case '+n);
  const N=1+Math.floor(r()*40);assert.ok(Math.abs(M.equalSigma(s1,0,N)**2-s1*s1/N)<1e-12,'ρ = 0 case '+n);
  const rho=-0.9+r()*1.8,m=M.twoAsset(M.minVar2(s1,s2,rho),{sigma:s1},{sigma:s2},rho).sigma;for(const x of [0,0.25,0.5,0.75,1])assert.ok(m<=M.twoAsset(x,{sigma:s1},{sigma:s2},rho).sigma+1e-12,'min-variance case '+n);
  const p=0.51+r()*0.4,b=0.5+r()*2.5,f=M.kellyF(p,b);if(f>0.001&&f<0.99){const g=M.growth(f,p,b);for(const k of [0.5,0.9,1.1,1.5])if(f*k<1)assert.ok(g>=M.growth(f*k,p,b)-1e-15,'Kelly peak case '+n);}
  const raw=[r(),r(),r(),r(),r()],tot=raw.reduce((a,x)=>a+x,0),wt=raw.map(x=>x/tot);wt[4]=1-wt.slice(0,4).reduce((a,x)=>a+x,0);M.checkWeights(wt);
  const v=M.portVar(wt,M.covMatrix());assert.ok(v>=0,'wᵀΣw ≥ 0 for a valid matrix');assert.ok(Math.abs(M.riskContrib(wt).reduce((a,x)=>a+x,0)-1)<1e-9,'contributions add to 1');
  assert.ok(M.crisisSigma(wt)>=M.portSigma(wt)-1e-12||wt[0]+wt[1]+wt[2]<0.05,'higher correlations raise σ for long-only weights case '+n);
  const k=r(),cm=M.cashMix(C.front.tan,k*C.front.tan.sigma);assert.ok(Math.abs(M.sharpe(cm.mu,cm.sigma||1e-9)-C.front.tan.sharpe)<1e-6||k<1e-6,'cash keeps the Sharpe ratio');
 }
 for(const t of [[[1,0.9,0.9],[0.9,1,-0.9],[0.9,-0.9,1]],[[1,-0.8,-0.8],[-0.8,1,-0.8],[-0.8,-0.8,1]]])assert.equal(M.checkCorr(t).ok,false);
 assert.throws(()=>M.checkWeights([0.5,0.4]),/add up to 1/);assert.throws(()=>M.checkWeights([0.5,NaN,0.5]),/finite/);
});

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·출처 값·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);if(a>=1e4){const man=Math.round(a);computed.add((man%1e4).toLocaleString('en-US'));computed.add(Math.floor(man/1e4).toLocaleString('en-US'));}for(const x of [a,a*100])for(const dd of [0,1,2,3,4,5]){const y=M.round(x,dd);computed.add(y.toFixed(dd));computed.add(y.toLocaleString('en-US',{minimumFractionDigits:dd,maximumFractionDigits:dd}));}computed.add(String(a));};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};
 walk(C);walk(M.ASSUME);walk(M.MARKET);walk(M.FACTS);return new Set([...computed,...GIVEN]);
};
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.ABook,REV=JSON.parse(read('review.json'));
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(REV.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});
test('L2 answers from docs/index.html #chapters are not stated or computed in the prose, details, quizzes or the review',()=>{
 const all=JSON.stringify(B.chapters)+JSON.stringify(REV.chapters),esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const s of ['15.81','14.14','0.0100','11.18','8.94','0.714','0.7143','44.26','5.05%','150만','56.52','0.175','17.5%','18.86','20.40','20.4%','6,120만','Y 50%','μ 4.0%'])
  assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)+'(?![\\d])'),'L2 answer leaked: '+s);
});
test('확인 answers are not given away in the prose before the quiz',()=>{
 const before=id=>{const c=B.chapters.find(x=>x.id===id);return JSON.stringify([c.desc,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning]);};
 assert.doesNotMatch(before('diversify'),/10\.00%/);assert.doesNotMatch(before('pair'),/13\.20%/);assert.doesNotMatch(before('mix'),/10\.80%/);
 assert.doesNotMatch(before('crisis'),/25\.00%에 다가/);assert.doesNotMatch(before('rebalance'),/5\.66%p/);
});

/* 결정적 의사 난수(mulberry32). 같은 시드면 같은 입력이 나와 실패를 다시 볼 수 있다. */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
