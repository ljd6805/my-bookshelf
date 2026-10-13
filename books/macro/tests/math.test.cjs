/* 거시경제 계산의 대표값·경계값·불변 조건. 기준값은 docs/research.html의 V-1~V-10, docs/index.html의 #curriculum-case(공통 사례 성장 계획)와
   #chapters의 해결 결과·L1·L2·확인 칸이다. 기대값은 문서의 숫자 문자열로 따로 적고 math.js(MMath)의 결과와 대조한다.
   불변 조건(입력이 없으면 네 줄 모두 0, 입력을 몇 배로 하면 결과도 같은 배수, 함께 넣은 결과 = 따로 넣은 결과의 합, 지출 없이는 첫 분기 GDP 0,
   S − I = 순수출, 원화 가치 변화와 1달러당 원화 변화의 관계)은 결정적 시드의 무작위 입력에서도 맞아야 한다. 마지막 테스트들은 content.js와
   review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지, L2 답이 본문·확인 문제·복습 문제에 새어 나가지 않았는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const f1=x=>M.round(x,1).toFixed(1),f2=x=>M.round(x,2).toFixed(2),f3=x=>M.round(x,3).toFixed(3),pct=(x,d=1)=>M.round(x*100,d).toFixed(d);
const row3=a=>a.map(f3),sc=(inputs,stage='full',quarters)=>M.scenario(inputs,{stage,quarters});

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
const hike=(size,len=4,start=1)=>({rate:{size,start,len}}),spend=(size,len=4,start=1)=>({spend:{size,start,len}});
put('gdp',M.gdp());put('real',M.realGrowth(0.06,0.04));put('realQ2',M.realGrowth(0.264,0.219));put('ann',M.annualize(0.006));
put('basket',M.priceIndex());put('basket2',M.priceIndex(M.ASSUME.basket.map((b,i)=>({...b,w:[0.2,0.1,0.7][i]}))));put('before',M.indexBefore(120.43,0.029));
put('town',M.labor());put('townAll',M.discourage(M.ASSUME.town,20));put('townJobs',M.labor({...M.ASSUME.town,employed:M.ASSUME.town.employed+10,unemployed:M.ASSUME.town.unemployed-10}));put('phases',M.ASSUME.gapCurve.map((_,t)=>M.phase(M.ASSUME.gapCurve,t)));
put('A',sc(hike(0.25),'policy'));put('Aminus',sc(hike(-0.25),'policy'));put('B',sc(hike(1),'policy'));put('L2policy',sc(hike(-0.5),'policy'));put('money',sc({money:{size:2,start:1,len:4}}));
put('spend',sc(spend(1),'fiscal'));put('mix',sc({...spend(1),...hike(1)},'fiscal'));put('L2fiscal',sc(spend(2,2),'fiscal'));put('mult',M.multiplier());
put('fx',{after:M.fxAfter(1338.5,-0.02),body:M.fxAmounts(1e6,1338.5,M.fxAfter(1338.5,-0.02).rounded),exact:M.fxAmounts(1e6,1338.5,1338.5*0.98),q:M.fxMove(1338.5,1400),
 onkyeol:M.fxAmounts(400000,1338.5,M.fxAfter(1338.5,-0.02).rounded),L2:M.fxAmounts(500000,1300,1365)});
put('ca',M.currentAccount());put('caL2',M.currentAccount({goods:30,services:-8,primary:5,secondary:-2}));put('nonGoods',M.nonGoods(461.1,468.1));put('si',M.savingInvestment());
put('lag',M.lagTable());put('lagL2',M.lagTable([1,2,3,2,1,0,-1,-2],[0,0,0.8,1.6,2.4,1.6,0.8,0],4));
put('crisis',M.crisisNumbers());put('final',M.finalTask());put('L2final',M.hypothesisPaths({size:0.5,start:2,len:4}));
/* 확인·전이 문제와 복습 문제의 계산(새 사례와 오답 보기 포함) */
put('q',{store:1.10/1.08-1,small:M.gdp({c:200,i:80,g:70,x:150,m:140}),r53:M.realGrowth(0.05,0.03),a15:M.annualize(0.015),
 b7:M.priceIndex([{name:'가',w:0.7,p0:1,p1:1.02},{name:'나',w:0.3,p0:1,p1:1.10}]),city:M.labor({employed:1164,unemployed:36,pop15:2000}),city12:M.discourage({employed:1164,unemployed:36,pop15:2000},12),
 p75:M.peaks(sc(hike(0.75),'policy')),cut:M.peaks(sc(spend(-1),'fiscal')),w80:M.won(800000,1320),m1323:M.fxMove(1350,1323),ca2:M.currentAccount({goods:32,services:-5,primary:4,secondary:-2}),
 si2:M.savingInvestment({c:500,i:200,g:150,x:300,m:260}),a2:M.annualize(-0.02),rateChange:M.crisisNumbers().rate2008,rateRel:2/5.25-1,core:M.surprise(2.6,2.8),
 mix:[-0.30+0.10],a01:M.annualize(0.01),level:120.43-100,wrongBefore:[120.43*(1-0.029),120.43*1.029],town10:M.discourage(M.ASSUME.town,10),sum6:-0.648+0.186,
 r53both:1.05*1.03-1,avgWrong:[100+(2+10)/2,100+2+10],coreRel:2.6/2.8-1,siGap:45.6-24.2,siWrong:900-480-190,wonLeft:900/1962,caWrong:[32+5+4+2,32-5],w80wrong:105600000,gdp2:M.gdp({c:500,i:200,g:150,x:300,m:260}),pairs:24-5,discWrong:M.ASSUME.town.unemployed/(M.ASSUME.town.pop15),cityWrong:[36/2000,36/1164]});

test('assumptions, market numbers and dates live in one table each, with grades and the unusual flag',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.equal(M.ASSUME.model,M.MODEL);
 assert.deepEqual([M.MARKET.policyRate.value,M.MARKET.policyRate.prev,M.MARKET.policyRate.decided,M.MARKET.policyRate.next],[3.00,2.75,'2026-08-27','2026-10-22']);
 assert.equal(M.MARKET.policyRate.afterStory,null,'the post-10-22 box is filled only after the decision');assert.equal(M.MARKET.policyRate.meetings2026.length,8);
 for(const k of ['nominalYoY','deflator','exportDeflator','savingRate'])assert.equal(M.MARKET.gdp[k].unusual,true,k);assert.equal(M.MARKET.bop.current.unusual,true);assert.equal(M.MARKET.bop.goods.unusual,true);
 assert.match(M.MARKET.gdp.deflator.grade,/보도/);assert.match(M.MARKET.gdp.nominalYoY.grade,/공식 원문\(재게시\)/);assert.match(M.MARKET.usdkrw.label,/주간 종가 15:30 · 보도/);
 const src=read('js/math.js');for(const n of ['120.43','461.1','468.1','1338.5','26.4','21.9','45.6','1962.0','2915.1'])assert.equal(src.split(n).length-1,1,n+' appears only once (in MARKET)');
 for(const v of Object.values(M.assumptions))assert.match(v,/가정|단순화/);assert.match(M.MODEL.label,/미리 정한 시나리오 모형 · 예측 아님 · 계수는 가정/);
});
test('V-1 GDP 900, 비중 53.3 · 21.1 · 18.9 · 6.7, 실질 1.92%, 2분기 3.69%, 연율 2.42%; L2 500 · −10 · 2.86%',()=>{
 const g=C.gdp;assert.deepEqual([g.gdp,g.net,pct(g.shares.c),pct(g.shares.i),pct(g.shares.g),pct(g.shares.net)],[900,60,'53.3','21.1','18.9','6.7']);
 assert.deepEqual([pct(C.real,2),f3(1.264),f3(1.219),pct(C.realQ2,2),pct(C.ann,2),pct(C.q.store,2)],['1.92','1.264','1.219','3.69','2.42','1.85']);
 const l2=M.gdp({c:300,i:120,g:90,x:250,m:260});assert.deepEqual([l2.gdp,l2.net,pct(M.realGrowth(0.08,0.05),2)],[500,-10,'2.86']);
 assert.ok(M.realGrowth(0.08,0.05)<0.03,'exact real growth is below the shortcut 8 − 5');assert.throws(()=>M.gdp({c:0,i:0,g:0,x:0,m:1}),RangeError);
});
test('V-2 장바구니 106.3, 가중치 바꾸면 105.3, 1년 전 지수 117.04; L2 104.0',()=>{
 assert.deepEqual([f1(C.basket.index),f1(C.basket2.index),f2(C.before)],['106.3','105.3','117.04']);
 assert.equal(f1(M.priceIndex([{name:'가',w:0.4,p0:1,p1:1.1},{name:'나',w:0.6,p0:1,p1:1}]).index),'104.0');
 assert.ok(Math.abs(C.basket.parts.reduce((s,p)=>s+p.contribution,0)-C.basket.inflation)<1e-12,'contributions add up to the inflation rate');
 assert.throws(()=>M.priceIndex([{name:'가',w:0.5,p0:1,p1:1}]),/add up to 1/);assert.equal(pct(M.realRate(0.03,0.02),2),'0.98');
});
test('V-3 실업률 3.33%, 참가율 60%, 고용률 58%; 20명 포기 → 실업률 0%, 고용률 58% 그대로; 10명 취업 → 실업률 약 1.7%, 고용률 59.0%; L2 5.00% → 3.06%; 국면 넷',()=>{
 const t=C.town;assert.deepEqual([pct(t.unemployment,2),pct(t.participation,0),pct(t.employment,0)],['3.33','60','58']);
 assert.deepEqual([C.townAll.unemployment,pct(C.townAll.employment,1)],[0,'58.0']);
 assert.deepEqual([pct(C.townJobs.unemployment,1),pct(C.townJobs.employment,1)],['1.7','59.0']);
 const v={employed:950,unemployed:50,pop15:1200};assert.deepEqual([pct(M.labor(v).unemployment,2),pct(M.discourage(v,20).unemployment,2)],['5.00','3.06']);
 assert.equal(pct(10/590,2),'1.69');assert.deepEqual(C.phases.map(p=>p.phase),['확장','확장','확장','확장','확장','정점','수축','수축','수축','수축','저점','확장']);
 assert.equal(M.phase([0.8,0.3,0.1],1).phase,'수축');assert.throws(()=>M.discourage(M.ASSUME.town,21),RangeError);
});
test('V-4 +0.25%p 4분기: 환율 1분기 −0.5%, GDP 5분기 −0.17%(−0.166), 물가 7분기 −0.07%p; −0.25%p는 부호만; L2 −0.5%p → +0.33% · +0.14%p',()=>{
 const p=M.peaks(C.A);assert.deepEqual([p.e.q,f1(p.e.value),p.y.q,f3(p.y.value),p.pi.q,f2(p.pi.value)],[1,'-0.5',5,'-0.166',7,'-0.07']);
 assert.deepEqual(row3(C.A.y.slice(0,6)),['0.000','-0.020','-0.095','-0.139','-0.166','-0.162']);
 const m=M.peaks(C.Aminus);assert.deepEqual([m.y.q,f3(m.y.value),m.pi.q],[5,'0.166',7]);
 const l=M.peaks(C.L2policy);assert.deepEqual([l.y.q,f3(l.y.value),l.pi.q,f3(l.pi.value)],[5,'0.332',7,'0.140']);
 const b=M.peaks(C.B);assert.deepEqual([f3(b.y.value),f3(b.pi.value)],['-0.664','-0.280']);
 assert.deepEqual(row3(C.money.y),row3(C.L2policy.y),'money +2%p works like a −0.5%p rate path (full model only)');
 assert.deepEqual(M.firstQuarters(),{fx:2,rate:3});assert.equal(C.A.y[0],0,'GDP does not move in the first quarter');
 const fxOnly=M.MODEL.coef.ey*C.A.e[0];assert.equal(f3(C.A.y[1]),f3(fxOnly),'quarter 2 is the exchange-rate channel only');
});
test('V-5 지출 +1% 4분기: GDP 4분기 +0.64%, 물가 5분기 +0.20%p; 함께 넣으면 2분기 +0.42%, 6분기 −0.46%(−0.648 + 0.186); 승수 0.8; L2 1.01% · 0.22%p',()=>{
 const s=M.peaks(C.spend);assert.deepEqual([s.y.q,f2(s.y.value),s.pi.q,f2(s.pi.value)],[4,'0.64',5,'0.20']);
 assert.deepEqual(row3(C.mix.y.slice(0,8)),['0.320','0.424','0.211','0.084','-0.313','-0.463','-0.278','-0.167']);
 const alone=sc(hike(1),'fiscal');assert.deepEqual([f3(alone.y[5]),f3(C.spend.y[5])],['-0.648','0.186']);assert.equal(f1(C.mult),'0.8');
 const l=M.peaks(C.L2fiscal);assert.deepEqual([l.y.q,f3(l.y.value),l.pi.q,f3(l.pi.value)],[2,'1.008',4,'0.224']);
 assert.equal(f2(C.spend.i[0]),'0.10','spending moves the market rate by assumption');
});
test('V-6 1,338.5원 → 1,311.7원: 13억 3,850만 → 13억 1,170만(−2,680만), 반올림 전 −2,677만; +4.59% · −4.39%; L2 6억 5,000만 → 6억 8,250만(5.0%)',()=>{
 const F=C.fx;assert.deepEqual([f2(F.after.exact),f1(F.after.rounded)],['1311.73','1311.7']);
 assert.deepEqual([M.wonText(F.body.before),M.wonText(F.body.after),M.wonText(F.body.diff),M.wonText(F.exact.diff)],['13억 3,850만 원','13억 1,170만 원','−2,680만 원','−2,677만 원']);
 assert.deepEqual([pct(F.q.perDollar,2),pct(F.q.wonValue,2)],['4.59','-4.39']);
 assert.deepEqual([M.wonText(F.L2.before),M.wonText(F.L2.after),pct(F.L2.change,1)],['6억 5,000만 원','6억 8,250만 원','5.0']);
 assert.deepEqual([M.wonText(F.onkyeol.before),M.wonText(F.onkyeol.after),M.wonText(F.onkyeol.diff)],['5억 3,540만 원','5억 2,468만 원','−1,072만 원']);
 assert.throws(()=>M.won(-1,1300),RangeError);assert.throws(()=>M.fxMove(0,1300),RangeError);
});
test('V-7 경상수지 36(상품 40, 나머지 −4), 보도 값 461.1 − 468.1 = −7.0, S − I = 250 − 190 = 60; L2 +25',()=>{
 assert.deepEqual([C.ca.ca,C.ca.nonGoods,f1(C.nonGoods),C.caL2.ca],[36,-4,'-7.0',25]);assert.deepEqual([C.si.saving,C.si.investment,C.si.gap,C.si.net],[250,190,60,60]);
});
test('V-8 시차 상관: 0 → −0.72, 3개월 → 0.98(쌍 9개); L2 2개월 r = 1.00',()=>{
 const r=C.lag.rows;assert.deepEqual(r.map(x=>f3(x.r)),['-0.724','-0.185','0.635','0.979','0.653']);assert.deepEqual([C.lag.best.k,C.lag.best.n],[3,9]);
 assert.deepEqual([C.lagL2.best.k,f2(C.lagL2.best.r)],[2,'1.00']);assert.throws(()=>M.lagCorr([1,1,1,1],[1,2,3,4],0),/no variation/);
});
test('V-9 1997 원화 가치 −54.1%(1달러당 +118%), 2008 −3.25%p, 4분기 −4.5% 연율 약 −17%(−16.8%), 2020 −0.50%p; L2 −11.5%',()=>{
 const c=C.crisis;assert.deepEqual([pct(c.fx1997.wonValue),pct(c.fx1997.perDollar,0),f2(c.rate2008),pct(c.annual2008),f2(c.rate2020),f1(c.growth1998Gap)],['-54.1','118','-3.25','-16.8','-0.50','0.2']);
 assert.equal(pct(M.annualize(-0.03),1),'-11.5');
});
test('V-10 차이 +0.4%p, A·B 첫 분기 +0.40%p, A 4분기 +0.14%p, A+인상 7분기부터 기준선 아래, B 4분기 1.01 → 0.99, 8분기 +0.17; L2 0.97 · 0.10',()=>{
 const F=C.final,P=F.paths;assert.equal(F.surprise,0.4);assert.equal(F.sameFirstQuarter,true);assert.equal(F.belowA,7);
 assert.deepEqual(row3(P.A.pi),['0.400','0.280','0.196','0.137','0.096','0.067','0.047','0.033']);
 assert.deepEqual(row3(P.B.pi),['0.400','0.680','0.876','1.013','0.709','0.496','0.348','0.243']);
 assert.deepEqual(row3(P.Bhike.pi),['0.400','0.680','0.866','0.993','0.671','0.439','0.282','0.173']);
 assert.deepEqual(row3(P.Ahike.y),['0.000','0.000','-0.020','-0.095','-0.139','-0.166','-0.162','-0.097']);
 const L=C.L2final.Bhike.pi;assert.deepEqual([f3(L[3]),f3(L[7])],['0.973','0.103']);
});
test('invariants: zero inputs give zero paths; scaling and superposition hold on random inputs; no GDP move in quarter 1 without spending',()=>{
 const z=sc({});for(const k of ['i','e','y','pi'])assert.ok(z[k].every(x=>x===0),k);
 const r=rng(20261013),near=(a,b)=>a.every((x,t)=>Math.abs(x-b[t])<1e-9);
 for(let n=0;n<200;n++){
  const pick=(lo,hi)=>Math.round((lo+r()*(hi-lo))*100)/100,start=1+Math.floor(r()*6),len=1+Math.floor(r()*4);
  const a={rate:{size:pick(-0.5,0.5),start,len}},b={spend:{size:pick(-0.5,0.5),start:1+Math.floor(r()*6),len},shock:{size:pick(-2.5,2.5),start,len:1+Math.floor(r()*3)}};
  const A=sc(a),B=sc(b),AB=sc({...a,...b}),A4=sc({rate:{...a.rate,size:4*a.rate.size}}),S=M.addPaths(A,B);
  for(const k of ['i','e','y','pi']){assert.ok(near(AB[k],S[k]),'superposition '+k+' case '+n);assert.ok(near(A4[k],A[k].map(x=>4*x)),'scaling '+k+' case '+n);}
  assert.equal(A.y[0],0,'rate alone never moves quarter-1 GDP');
  const S2=M.savingInvestment({c:100+r()*500,i:r()*200,g:r()*200,x:r()*400,m:r()*300});assert.ok(Math.abs(S2.gap-S2.net)<1e-9,'S − I = X − M');
  const b0=1000+r()*1000,b1=1000+r()*1000,f=M.fxMove(b0,b1);assert.ok(Math.abs((1+f.perDollar)*(1+f.wonValue)-1)<1e-12);
 }
});
test('range, stage and length errors: knobs open by chapter, sizes stay in the linear range, quarters 1–12',()=>{
 assert.throws(()=>sc({money:{size:1}},'policy'),/not open/);assert.throws(()=>sc({spend:{size:1}},'policy'),/not open/);assert.throws(()=>sc({shock:{size:1}},'fiscal'),/not open/);
 assert.throws(()=>sc(hike(2.5),'policy'),/between/);assert.throws(()=>sc({rate:{size:0.25,start:13}},'policy'),RangeError);assert.throws(()=>sc({rate:{size:0.25,len:9}},'policy'),RangeError);
 assert.throws(()=>sc({tax:{size:1}}),/unknown input/);assert.throws(()=>sc({},'full',13),RangeError);assert.throws(()=>sc({},'nope'),/unknown stage/);
 assert.equal(sc(hike(2),'policy').i[0],2);assert.equal(sc({},'full',8).y.length,8);assert.deepEqual(M.peak([0,0]),{q:null,value:0});
});
test('the plan and chapter table numbers are the ones computed here',()=>{
 const d=read('docs/index.html'),plan=d.slice(d.indexOf('id="curriculum-case"'),d.indexOf('id="curriculum-case"')+12000);
 for(const s of ['GDP 900','1.92%','3.69%','106.3','3.33%','−0.17%','−0.07%p','+0.64%','+0.20%p','−0.648 + 0.186 = −0.462','13억 3,850만 원','1,311.7원','−2,680만 원'])assert.ok(plan.includes(s),'curriculum-case: '+s);
 const rows=Object.fromEntries([...d.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]])),all=Object.values(rows).join(' ');
 for(const s of ['2.42%','1.85%','117.0','58.0%','5.00% → 약 3.06%','+0.33%','+0.14%p','+1.01%','+0.22%p','+0.10%p','+4.59%','−4.39%','6억 5,000만 원 → 6억 8,250만 원','+25억 달러','250 − 투자 190 = 60','r = 1.00','0.98','−11.5%','−54.1%','+0.97%p','+0.10%p','0.99%p','+0.40%p'])
  assert.ok(all.includes(s),'chapters: '+s);
});

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·출처 값·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);if(a>=1e5){const man=Math.round(a/1e4);computed.add((man%1e4).toLocaleString('en-US'));computed.add(Math.floor(man/1e4).toLocaleString('en-US'));}for(const x of [a,a*100,a/1e4,a/1e8])for(const d of [0,1,2,3,4]){const y=M.round(x,d);computed.add(y.toFixed(d));computed.add(y.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));}computed.add(String(a));};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};
 walk(C);walk(M.ASSUME);walk(M.MARKET);return new Set([...computed,...GIVEN]);
};
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.MBook,REV=JSON.parse(read('review.json'));
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(REV.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});
test('L2 answers from docs/index.html #chapters are not stated or computed in the prose, details, quizzes or the review',()=>{
 const all=JSON.stringify(B.chapters)+JSON.stringify(REV.chapters),esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const s of ['500조','−10조','2.86','104.0','3.06','5.00% →','0.33','0.332','1.008','+1.01%','0.224','0.22%p','6억 5,000만','6억 8,250만','25억','2개월','r = 1.00','11.5','11.47','0.97%','0.973','0.103','0.10%p는'])
  assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)+'(?![\\d])'),'L2 answer leaked: '+s);
 const pol=JSON.stringify(B.chapters.find(c=>c.id==='policy'));assert.doesNotMatch(pol,/[−-]0\.5%p|0\.5%p (내|인하)/,'ch4 does not run the −0.5%p case');
 const fx=JSON.stringify(B.chapters.find(c=>c.id==='fx'));assert.doesNotMatch(fx,/1,365|50만 달러/,'ch6 does not use the L2 case');
 const fin=JSON.stringify(B.chapters.find(c=>c.id==='final'));assert.doesNotMatch(fin,/0\.5%p (올|인상)/,'ch10 does not run the +0.5%p case');
});

/* 결정적 의사 난수(mulberry32). 같은 시드면 같은 입력이 나와 실패를 다시 볼 수 있다. */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
