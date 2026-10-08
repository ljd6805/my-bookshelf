/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-3)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('agent loop stops on finish or on the turn budget',()=>{
 const n=M.agentLoop('normal',10);assert.equal(n.stop,'finish');assert.equal(n.turns.length,4);assert.equal(n.toolCalls,3);
 const e=M.agentLoop('error',4);assert.equal(e.stop,'max_turns');assert.equal(e.errors,1);assert.equal(M.agentLoop('error',5).stop,'finish');
 const s=M.agentLoop('stuck',12);assert.equal(s.stop,'max_turns');assert.equal(s.turns.length,12);assert.equal(s.answer,null);
 assert.equal(M.agentLoop('normal',0).turns.length,1);
});
test('ReAct re-sends history, ReWOO plans once',()=>{
 const r=M.tokenCost(8);assert.equal(r.react,10800);assert.equal(r.rewoo,2640);near(r.ratio,4.0909);
 assert.equal(M.tokenCost(20).rewoo,4800);assert.equal(M.tokenCost(0).react,600);
 for(let n=1;n<20;n++)assert.ok(M.tokenCost(n+1).ratio>M.tokenCost(n).ratio,'gap widens with steps');
});
test('UCT exploration constant moves the choice from A to C',()=>{
 assert.equal(M.uct(M.HYPOTHESES,0).choice,0);assert.equal(M.uct(M.HYPOTHESES,0.2).choice,0);
 assert.equal(M.uct(M.HYPOTHESES,0.3).choice,2);const one=M.uct(M.HYPOTHESES,1);assert.equal(one.choice,2);near(one.scores[2].score,2.0245,1e-3);
 assert.equal(M.uct([{name:'x',q:.9,n:5},{name:'y',q:0,n:0}],0).choice,1,'unvisited child first');
});
test('reflexion success grows with signal quality and never exceeds one',()=>{
 near(M.reflexion('none',3).final,1-0.7**3);assert.ok(M.reflexion('scalar',3).final>M.reflexion('self',3).final);
 const r=M.reflexion('scalar',8);assert.ok(r.rows.every(x=>x.p<=0.9));assert.ok(r.final<1);near(M.reflexion('self',1).final,0.3);
});
test('debate topology cost from the lesson',()=>{assert.equal(M.debateOps(5,3,'mesh'),60);assert.equal(M.debateOps(5,3,'star'),12);assert.equal(M.debateOps(3,2,'mesh'),12);});
test('memory window loses old facts, paging recalls them with calls',()=>{
 const w=M.memoryRecall(4,'window');assert.equal(w.answered,2);assert.equal(w.calls,0);
 const p=M.memoryRecall(4,'paging');assert.equal(p.answered,6);assert.equal(p.calls,4);
 const c=M.memoryRecall(4,'core');assert.ok(c.rows.find(r=>r.fact===6).how==='core');assert.equal(c.room,2);
 assert.equal(M.memoryRecall(12,'window').answered,6);assert.equal(M.memoryRecall(1,'core').room,0);
});
test('fusion weights trade relevance for recency',()=>{
 const a=M.fusion(0.2);assert.equal(a.top,'r1');near(a.rows[0].score,0.72);
 const b=M.fusion(0.5);assert.equal(b.top,'r3');near(b.rows[0].score,0.7265,1e-3);
 for(const w of [0,.3,.8]){const f=M.fusion(w);near(f.wRel+f.wImp+f.wRec,1);}
});
test('workflow pattern calls and critical path',()=>{
 const r=Object.fromEntries(M.patternCost(3).map(x=>[x.id,x]));assert.equal(r.chain.calls,4);assert.equal(r.parallel.calls,4);assert.equal(r.parallel.seconds,4);assert.equal(r.chain.seconds,8);assert.equal(r.orchestrator.calls,5);
 assert.equal(M.patternCost(0)[0].calls,2);
});
test('voice latency bands',()=>{
 const f=M.voiceLatency(150,'fast');assert.equal(f.total,400);assert.equal(f.band,'premium');
 assert.equal(M.voiceLatency(350,'fast').band,'premium');assert.equal(M.voiceLatency(400,'slow').total,990);assert.equal(M.voiceLatency(400,'slow').band,'common');
 assert.equal(M.voiceLatency(1000,'slow').band,'broken');
});
test('harness rules and leakage filter',()=>{
 assert.equal(M.harness('f2p','all').resolved,6);assert.equal(M.harness('both','all').resolved,4);
 assert.equal(M.harness('both','clean').resolved,2);assert.equal(M.harness('both','clean').total,5);assert.equal(M.harness('f2p','clean').resolved,3);
});
test('PVE rules block more calls as layers turn on',()=>{
 const u=[0,1,2,3,4].map(l=>M.pve(l).unsafe);assert.deepEqual(u,[4,3,2,1,0]);
 assert.equal(M.pve(4).rows[0].verdict,'allow');assert.equal(M.pve(3).rows[3].verdict,'confirm');assert.equal(M.pve(9).level,4);
});
test('glob scope contract',()=>{
 assert.ok(M.globMatch('app/signup/a/b.py','app/signup/**'));assert.ok(!M.globMatch('app/email/x.py','app/signup/**'));assert.ok(M.globMatch('tests/test_signup_x.py','tests/test_signup*.py'));
 assert.equal(M.scopeCheck(M.DIFFS.clean,false).passed,true);const d=M.scopeCheck(M.DIFFS.docs,false);assert.equal(d.warns,1);assert.ok(d.passed);assert.equal(M.scopeCheck(M.DIFFS.docs,true).passed,false);
 assert.equal(M.scopeCheck(M.DIFFS.creep,false).blocks,1);
});
test('gate passes fewer claimed completions as checks turn on',()=>{
 assert.deepEqual([0,1,2,3,4,5,6].map(l=>M.gate(l,false).passed),[20,17,15,14,12,11,11]);assert.equal(M.gate(6,true).passed,9);assert.equal(M.gate(6,false).warned,2);
});
test('rubric thresholds include zero-dimension hard fail',()=>{
 assert.equal(M.rubric([2,2,2,1,1]).verdict,'pass');assert.equal(M.rubric([2,1,1,1,1]).verdict,'soft_fail');assert.equal(M.rubric([2,2,2,2,0]).verdict,'hard_fail');assert.equal(M.rubric([1,1,1,1,0]).total,4);assert.equal(M.rubric([1,1,1,1,1]).verdict,'soft_fail');
});
test('risk ranking and validation',()=>{
 const r=M.riskRank('none',4);assert.equal(r.rows[0].id,'safety');assert.equal(r.rows[0].score,19);assert.equal(r.next.id,'safety');
 assert.equal(M.riskRank('safety',4).next.id,'usability');assert.equal(M.riskRank('none',1).rows[0].id,'usability');
 assert.throws(()=>M.riskScore({impact:6,uncertainty:1,irreversibility:1}));
});
test('smallest slice that covers the required proof',()=>{
 near(M.SLICES.map(M.sliceScore)[0],3.333);assert.equal(M.chooseSlice(['usability']).choice.name,'합성 데이터 대시보드');
 assert.equal(M.chooseSlice(['feasibility','usability']).choice.name,'실제 사건 10건 읽기 전용 재생');assert.equal(M.chooseSlice(['feasibility','usability','safety']).choice.name,'2주 그림자 모드 파일럿');
 assert.equal(M.chooseSlice(['viability']).choice,null);
});
test('pilot decision thresholds are inclusive and writes always fail',()=>{
 assert.equal(M.pilotDecision(0.9,120,0).verdict,'pass');assert.equal(M.pilotDecision(0.95,60,1).verdict,'fail');assert.equal(M.pilotDecision(0.74,60,0).verdict,'fail');
 assert.equal(M.pilotDecision(0.75,60,0).verdict,'ambiguous');assert.equal(M.pilotDecision(0.95,121,0).verdict,'ambiguous');
});
test('stage choice and ratchet priority',()=>{
 assert.equal(M.chooseStage({realUsers:false,realData:false,consequence:5,reversible:false,ready:false}),'prototype');
 assert.equal(M.chooseStage({realUsers:true,realData:true,consequence:4,reversible:true,ready:true}),'pilot');
 assert.equal(M.chooseStage({realUsers:true,realData:true,consequence:2,reversible:true,ready:true}),'production');
 assert.equal(M.ratchetPriority(4,3),12);assert.throws(()=>M.ratchetPriority(0,1));
});
test('compounding per-step success',()=>{near(M.compound(0.99,100),0.366,1e-3);near(M.compound(0.95,40),0.1285,1e-3);assert.equal(M.compound(1,400),1);assert.equal(M.compound(1.2,2),1);});
