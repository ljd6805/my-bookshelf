/* 계산 함수의 대표값·경계값·불변 조건. 화면을 복제하지 않고 수식이 지켜야 할 성질을 확인한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-3)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('tokenize: three units, josa stripping and its over-stripping failure',()=>{
 assert.deepEqual(M.tokenize('환불은 언제 되나요','josa'),['환불','언제','되나요']);
 assert.deepEqual(M.tokenize('작가 신간','josa'),['작','신간']);
 assert.deepEqual(M.tokenize('환불','char2'),['환불']);
 assert.deepEqual(M.tokenize('  ','space'),[]);
 assert.equal(M.vocab(M.INBOX,'space').length,28);assert.equal(M.vocab(M.INBOX,'josa').length,26);assert.equal(M.vocab(M.INBOX,'char2').length,47);
 assert.ok(M.vocab(M.INBOX,'josa').length<=M.vocab(M.INBOX,'space').length);
 const hits=M.matchDocs('환불 언제 돼요',M.INBOX,'josa');assert.equal(hits[0].i,0);assert.deepEqual(hits[0].words,['환불','언제']);
 assert.equal(M.matchDocs('배송비 얼마예요',M.INBOX,'space').filter(x=>x.hits).length,0);
});
test('BPE: merges shrink tokens monotonically and reuse pieces on unseen words',()=>{
 const r0=M.learnBpe(M.BPE_WORDS,0),r8=M.learnBpe(M.BPE_WORDS,8);
 assert.equal(r0.tokens,79);assert.equal(r0.tokens,r0.chars);assert.equal(r8.tokens,33);assert.equal(r8.vocabSize,19);
 assert.deepEqual(r8.merges[0],['배','송',15]);
 let prev=Infinity;for(let k=0;k<=8;k++){const r=M.learnBpe(M.BPE_WORDS,k);assert.ok(r.tokens<=prev);prev=r.tokens;assert.equal(r.vocabSize,11+r.merges.length);}
 assert.deepEqual(M.applyBpe('배송료',r8.merges),['배송','료']);assert.deepEqual(M.applyBpe('환불금',r8.merges),['환불금']);
 assert.equal(M.learnBpe({'가':3},5).merges.length,0);
});
test('IDF, TF-IDF and BM25',()=>{
 near(M.idf(8,8,false),0);near(M.idf(8,8,true),1);near(M.idf(2,8,true),Math.log(3)+1);
 assert.ok(Number.isNaN(M.idf(0,8)));assert.ok(M.idf(1,8)>M.idf(2,8));
 const d=M.tfidfDoc(M.INBOX,4);assert.equal(d[0].word,'환불');near(d[0].tf,0.4);near(d[0].w,0.839);
 near(M.sum(d.map(x=>x.tf*5)),5,1e-9);
 near(M.bm25(1,1,8,4,4),M.bm25(1,1,8,4,4));assert.ok(M.bm25(4,1,8,4,4)>M.bm25(2,1,8,4,4));
 assert.ok(M.bm25(100,1,8,4,4)<Math.log(1+7.5/1.5)*2.5+1e-9,'tf saturates below idf*(k1+1)');
});
test('skip-gram windows and analogies',()=>{
 assert.equal(M.skipPairs(['a','b','c'],1).length,4);assert.equal(M.skipPairs(['a'],3).length,0);
 assert.equal(M.contextCounts(M.INBOX,'환불',1).total,44);assert.equal(M.contextCounts(M.INBOX,'환불',3).total,86);
 assert.ok(M.contextCounts(M.INBOX,'환불',4).total>=M.contextCounts(M.INBOX,'환불',3).total);
 assert.equal(M.analogy('소설','소설가','시','cos').list[0].word,'시인');assert.equal(M.analogy('소설','소설가','시','dot').list[0].word,'책');
 assert.ok(M.analogy('소설','소설가','시').list.every(x=>!['소설','소설가','시'].includes(x.word)));
 near(M.cosine([1,0],[2,0]),1);near(M.cosine([0,0],[1,1]),0);
 near(M.jaccard(['a','b'],['b','c']),1/3);near(M.jaccard([],[]),0);assert.ok(M.charNgrams('배송').has('<배'));
});
test('topic mixture: proportions sum to one and follow evidence',()=>{
 for(const a of [0.1,1,5]){const th=M.topicMix([2,1,0,3,0,0,0,0,0],a);near(M.sum(th),1,1e-9);assert.ok(th.every(x=>x>0));}
 const base=M.topicMix([2,1,0,0,0,0,0,0,0],1),more=M.topicMix([2,1,0,3,0,0,0,0,0],1);assert.ok(more[1]>base[1]);
 const flat=M.topicMix([0,0,0,0,0,0,0,0,0],1);flat.forEach(x=>near(x,1/3));
 assert.ok(Math.max(...M.topicMix([2,1,0,0,0,0,0,0,0],5))<Math.max(...M.topicMix([2,1,0,0,0,0,0,0,0],0.1)));
});
test('naive Bayes with negation scope',()=>{
 assert.deepEqual(M.negScope(['안','좋아요']),['안','NOT_좋아요']);assert.deepEqual(M.negScope(['좋지','않아요']),['NOT_좋지','않아요']);assert.deepEqual(M.negScope([]),[]);
 assert.equal(M.nbClassify('내용이 안 좋아요',false,1).label,1);assert.equal(M.nbClassify('내용이 안 좋아요',true,1).label,0);
 near(M.nbClassify('내용이 안 좋아요',true,1).score,-1.46,0.01);
 const r=M.nbClassify('배송 좋아요',true,1);near(r.pPos,1/(1+Math.exp(-r.score)),1e-12);assert.ok(r.pPos>0&&r.pPos<1);
 near(M.f1Scores(1,0,0),1);assert.equal(M.f1Scores(0,0,0),0);
 const b=M.majorityBaseline(95,5);near(b.acc,0.95);assert.ok(b.macroF1<0.5);
});
test('Viterbi: transitions keep the verb until emission gets tiny',()=>{
 const s='can I book the book'.split(' '),t='you can book a table'.split(' ');
 assert.deepEqual(M.viterbi(s,0.1).tags,['AUX','PRON','VERB','DET','NOUN']);
 assert.equal(M.viterbi(s,0.03).tags[2],'NOUN');assert.equal(M.viterbi(t,0.03).tags[2],'VERB');assert.equal(M.viterbi(t,0.005).tags[2],'NOUN');
 assert.equal(M.mostFrequentTag('book'),'NOUN');assert.ok(Number.isFinite(M.viterbi(s,0.2).logp));
 assert.ok(M.viterbi(s,0.2).logp>=M.viterbi(s,0.1).logp,'larger emission never lowers the best path');
 M.HMM.trans.forEach(row=>near(M.sum(row),1,1e-9));near(M.sum(M.HMM.start),1,1e-9);
});
test('bigram perplexity and smoothing',()=>{
 const m=M.bigramModel(M.INBOX);assert.equal(m.V,27);
 near(M.perplexity(m,'환불은 언제 되나요',0).pp,2.213);
 const z=M.perplexity(m,'배송비 환불 되나요',0);assert.equal(z.finite,false);assert.equal(z.pp,Infinity);
 near(M.perplexity(m,'배송비 환불 되나요',0.05).pp,16.9,0.05);
 const a=M.perplexity(m,'환불은 언제 되나요',1);assert.ok(a.pp>2.213);a.steps.forEach(s=>assert.ok(s.p>0&&s.p<=1));
 near(M.gradientFlow(0.5,10),Math.pow(0.5,10));assert.equal(M.gradientFlow(1,50),1);assert.ok(M.gradientFlow(1.2,20)>1);
});
test('attention weights and BLEU',()=>{
 const r0=M.attend('When',0);r0.weights.forEach(w=>near(w,0.2));
 for(const w of ['When','exchange','damaged','book']){const r=M.attend(w,3);near(M.sum(r.weights),1,1e-9);}
 assert.equal(M.ALIGN.src[M.attend('When',3).best],'언제');assert.equal(M.ALIGN.src[M.attend('damaged',8).best],'파본');
 assert.ok(M.attend('When',8).weights[3]>M.attend('When',3).weights[3]);
 const ref='when can i exchange the damaged book';
 near(M.bleu(ref,ref).score,100);near(M.bleu('when can i exchange the book',ref).score,67.3,0.1);
 near(M.bleu('the damaged book can i exchange when',ref,1).score,100);near(M.bleu('the damaged book can i exchange when',ref,4).score,48.1,0.1);
 assert.ok(M.bleu('when can i exchange the book',ref).bp<1);
 near(M.rouge('a b c','a b d').r1,2/3);near(M.rouge('a b','a b').rl,1);
 assert.deepEqual(M.qaScore('7 일','7 일'),{em:1,f1:1});assert.equal(M.qaScore('x','y').f1,0);
});
test('chunking keeps or splits the answer span',()=>{
 const f=M.chunkDoc(150,'fixed'),s=M.chunkDoc(150,'sentence');
 assert.deepEqual(f.answer,[265,385]);assert.equal(f.total,555);assert.equal(f.whole,false);assert.equal(f.touched,2);assert.equal(s.whole,true);
 assert.equal(M.chunkDoc(300,'fixed').whole,false);assert.equal(M.chunkDoc(300,'sentence').whole,true);assert.equal(M.chunkDoc(400,'fixed').whole,true);
 for(const n of [50,120,400])for(const st of ['fixed','sentence']){const r=M.chunkDoc(n,st);assert.equal(r.chunks[0][0],0);assert.equal(r.chunks[r.chunks.length-1][1],555);for(let i=1;i<r.chunks.length;i++)assert.equal(r.chunks[i][0],r.chunks[i-1][1]);}
});
test('entity linking with prior weight and NIL',()=>{
 assert.equal(M.linkEntity('한강 신간 소설 언제 나오나요',0.3).pick,'작가 한강');assert.equal(M.linkEntity('한강 신간 소설 언제 나오나요',0.6).pick,'강 한강');
 assert.match(M.linkEntity('한강 주차 되나요',0).pick,/^NIL/);assert.equal(M.linkEntity('한강 주차 되나요',1).pick,'강 한강');
 const r=M.linkEntity('한강 다리 사진집 있나요',0.5);r.list.forEach(e=>near(e.score,0.5*e.prior+0.5*e.sim,1e-12));near(M.sum(M.KB.map(e=>e.prior)),1,1e-9);
});
test('dialogue state tracking and joint goal accuracy',()=>{
 const full=M.dstStates('full'),last=M.dstStates('lastonly'),app=M.dstStates('append');
 assert.ok(full.ok.every(Boolean));assert.deepEqual(last.ok,[true,false,false,false,false]);assert.deepEqual(app.ok,[true,true,false,false,false]);
 assert.equal(full.gold[2]['배송지'],'대구');assert.equal(full.gold[4]['날짜'],undefined);
 near(M.jga(app.ok,3),2/3);near(M.jga(last.ok,5),0.2);near(M.jga(full.ok,1),1);
});
test('JSON validity under independent token errors',()=>{
 const r=M.jsonValidity(0.98);near(r.prompt,0.616);near(r.retry,0.943);assert.equal(r.constrained,1);
 const one=M.jsonValidity(1);assert.equal(one.prompt,1);assert.equal(one.retry,1);near(one.expectedCalls,1);
 const zero=M.jsonValidity(0);assert.equal(zero.prompt,0);assert.equal(zero.retry,0);assert.equal(zero.expectedCalls,3);
 for(const p of [0.9,0.95,0.99])assert.ok(M.jsonValidity(p).retry>=M.jsonValidity(p).prompt);
});
test('needle grid: middle depth is worst and multi-hop degrades first',()=>{
 const g=M.needleGrid(128,'single');assert.equal(g.acc.indexOf(g.min),2);near(g.acc[0],g.acc[4]);
 M.LENGTHS.forEach(L=>{assert.ok(M.needleGrid(L,'multi').min<=M.needleGrid(L,'single').min);M.needleGrid(L,'multi').acc.forEach(a=>assert.ok(a>=0&&a<=1));});
 assert.equal(M.effectiveLength('single'),64);assert.equal(M.effectiveLength('multi'),4);assert.equal(M.effectiveLength('single',0),128);
 for(let i=1;i<M.LENGTHS.length;i++)assert.ok(M.needleGrid(M.LENGTHS[i],'multi').min<=M.needleGrid(M.LENGTHS[i-1],'multi').min);
 assert.equal(M.fertilityCost(100,2.5),250);near(M.softmax([1,1,1]).reduce((a,b)=>a+b),1);
});
