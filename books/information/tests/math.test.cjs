/* 계산 모델 검증: tests/reference.py(책 코드와 따로 쓴 파이썬 계산)의 값과 대조하고, 대표값·경계값·불변 조건을 확인한다.
   안내 상자(lab-guides.js)의 결과 읽기 숫자도 여기서 실제 계산과 맞춘다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
globalThis.window=globalThis;require(path.join(base,'js/messages.js'));const M=require(path.join(base,'js/math.js'));
const R=JSON.parse(fs.readFileSync(path.join(__dirname,'reference.json'),'utf8'));
const near=(a,b,tol=1e-9,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);
const f=(x,d)=>Number(x).toFixed(d);
const Y=M.corpus.yunseul(),S=M.stats(Y),huff=t=>{const s=M.stats(t);return M.huffman(s.counts.map(([sym,w])=>({sym,w})));};

test('corpus statistics match the independent Python reference',()=>{
 assert.equal(M.alphabet().length,R.V);assert.equal(S.n,R.n);assert.equal(S.distinct,R.distinct);assert.equal(Y.split('\n').length,R.messages);
 near(S.H,R.H0);near(M.condEntropy(Y,1).H,R.H1);near(M.condEntropy(Y,2).H,R.H2);
 near(new TextEncoder().encode(Y).length*8/S.n,R.utf8_bits_per_char);
 assert.deepEqual(S.counts.slice(0,6),R.top6);
});
test('chain rule: H(prev,cur) = H(prev) + H(cur|prev), and mutual information is non-negative',()=>{
 for(const n of [10,35,70]){const c=M.chain(M.corpus.first(n));near(c.Hjoint,c.Hprev+c.Hcond,1e-9,'n='+n);assert.ok(c.MI>=-1e-12);near(c.MI,c.Hcur-c.Hcond,1e-9);}
 const c=M.chain(Y);near(c.Hjoint,7.893,5e-4);near(c.Hprev,5.678,5e-4);
});
test('entropy: representative and boundary values',()=>{near(M.entropy([33,33,33,0]),Math.log2(3),1e-12);
 near(M.entropy([25,25,25,25]),2);near(M.entropy([30,30,0,0]),1);near(M.entropy([40,0,0,0]),0);near(M.entropy([20,15,10,5]),1.846,5e-4);near(M.entropy([70,10,10,10]),1.357,5e-4);
 near(M.entropy([2,4,6,8]),M.entropy([1,2,3,4]),1e-12,'scale invariance');
});
test('Huffman: matches reference, H <= L < H+1, Kraft sum is 1, codes are prefix-free',()=>{
 const h=huff(Y);near(h.L,R.huffman_L);assert.ok(h.L>=h.H-1e-12&&h.L<h.H+1);near(h.kraft,1,1e-12);
 const codes=[...h.codes.values()];for(const a of codes)for(const b of codes)if(a!==b)assert.ok(!b.startsWith(a),a+' prefixes '+b);
 const top=M.huffman(R.top6.map(([sym,w])=>({sym,w})));near(top.L,R.huffman_top6_L);assert.equal(top.codes.get(' '),'0');assert.equal(top.codes.get('\n'),'10');
 const dy=M.huffman([64,32,16,8,4,4].map((w,i)=>({sym:String(i),w})));near(dy.L,dy.H,1e-12,'dyadic');
 const sk=M.huffman([150,1,1,1,1,1].map((w,i)=>({sym:String(i),w})));near(sk.L,1.077,5e-4);near(sk.H,0.280,5e-4);
 const msg=M.corpus.first(10),bits=M.encodeWith(h.codes,msg);assert.equal(M.decodeWith(h.codes,bits).text,msg);
 assert.equal(M.encodeWith(h.codes,'응 지금 가는 중').length,48);
});
test('Kraft and canonical codes',()=>{
 near(M.kraft([1,2,3,4,4]),1);near(M.kraft([1,2,2,3,3]),1.25);near(M.kraft([2,2,3,3,3]),0.875);
 assert.equal(M.canonical([1,2,2,3,3]),null);assert.deepEqual(M.canonical([1,2,3,4,4]),['0','10','110','1110','1111']);
 const c=M.canonical([2,2,3,3,3]);for(const a of c)for(const b of c)if(a!==b)assert.ok(!b.startsWith(a));
});
test('alpha tasks have interior answers (chapters 5 and 8)',()=>{const L=a=>M.codeLength(M.model(0,M.corpus.doyoonA(),a),M.corpus.doyoonB()).perChar;const as=[...Array(20)].map((_,i)=>+(0.05*(i+1)).toFixed(2)),v=as.map(L),best=as[v.indexOf(Math.min(...v))];assert.equal(best,0.3);
 const winner=a=>{const t=[0,1,2].map(o=>M.codeLength(M.model(o,M.corpus.train(),a),M.corpus.test()).perChar);return t.indexOf(Math.min(...t));};assert.equal(winner(0.01),1);assert.equal(winner(0.3),1);assert.equal(winner(1),0);
 const e=M.arithEncode(M.model(1,M.corpus.train(),1),'ㅋㅋㅋ 알겠어');assert.equal(e.k,37);assert.equal(M.arithEncode(M.model(-1,M.corpus.train(),1),'ㅋㅋㅋ 알겠어').k,54);});
test('n-gram code lengths on the test set and on Doyoon match the reference',()=>{
 for(const [k,v] of Object.entries(R.test_bits)){const [o,a]=k.split(':').map(Number);near(M.codeLength(M.model(o,M.corpus.train(),a),M.corpus.test()).perChar,v,1e-9,k);}
 const src={yunseul:M.corpus.yunseul(),doyoonA:M.corpus.doyoonA(),both:M.corpus.yunseul()+'\n'+M.corpus.doyoonA()};
 for(const [k,v] of Object.entries(R.doyoon_bits)){const [s,o,a]=k.split(':');near(M.codeLength(M.model(Number(o),src[s],Number(a)),M.corpus.doyoonB()).perChar,v,1e-9,k);}
});
test('probabilities of every model row sum to 1 (also after quantization)',()=>{
 for(const o of [-1,0,1,2])for(const ctx of ['\n\n','응 ','지금']){const m=M.model(o,M.corpus.train(),0.1),q=M.quantized(m,3);near(m.abc.reduce((s,x)=>s+m.prob(ctx,x),0),1,1e-9,o+ctx);near(q.abc.reduce((s,x)=>s+q.prob(ctx,x),0),1,1e-9,'q'+o+ctx);}
});
test('cross-entropy is never below the entropy of the message (Gibbs), KL >= 0',()=>{
 const t=M.corpus.doyoonB(),H=M.stats(t).H;
 for(const a of [0.05,0.1,1]){const m=M.model(0,Y,a);assert.ok(M.codeLength(m,t).perChar>=H);}
 const own=M.stats(t),m={...M.model(0,t,0)};near(M.codeLength(m,t).perChar,own.H,1e-9,'own distribution gives the entropy');
 assert.equal(M.codeLength(M.model(0,Y,0),t).perChar,Infinity);assert.equal(M.codeLength(M.model(0,Y,0),t).zero.length,26);
});
test('arithmetic coding round-trips and stays within 2 bits of the ideal length',()=>{
 for(const t of ['응 지금 가는 중','ㅋㅋㅋㅋㅋ','네 확인했습니다','응']){for(const o of [-1,0,1,2]){const m=M.model(o,M.corpus.train(),1),e=M.arithEncode(m,t);assert.ok(!e.error,t);assert.equal(M.arithDecode(m,e.bits,e.n),t);assert.ok(e.k>=e.bitsIdeal-1e-9&&e.k<=e.bitsIdeal+2,`${t} ${o} ${e.k} ${e.bitsIdeal}`);}}
 const m=M.model(1,M.corpus.train(),1);assert.equal(M.arithEncode(m,'응 지금 가는 중').k,52);assert.equal(M.arithEncode(M.model(-1,M.corpus.train(),1),'응 지금 가는 중').k,68);assert.equal(M.arithEncode(m,'ㅋㅋㅋㅋㅋ').k,24);
 assert.ok(M.arithEncode(m,'abc').error,'letters outside the alphabet are refused');assert.ok(M.arithEncode(M.model(0,Y,0),M.corpus.doyoonB()).error,'zero probability is refused');
 const tr=M.corpus.yunseul()+'\n'+M.corpus.doyoonA(),fm=M.model(1,tr,0.01),e=M.arithEncode(fm,M.corpus.doyoonB());assert.equal(e.k,682);assert.equal(M.arithDecode(fm,e.bits,e.n),M.corpus.doyoonB());
});
test('LZ78 and BPE',()=>{
 const r=M.lz78(Y);assert.equal(r.bits,R.lz78_bits);assert.equal(r.phrases.length,R.lz78_phrases);assert.equal(r.phrases.map(p=>p.text).join(''),Y);
 const d=M.lz78(Y+'\n'+Y);near(d.perChar,6.81,5e-3);assert.equal(d.longest,5);near(M.lz78(M.corpus.first(5)).perChar,8.69,5e-3);
 let prev=Infinity;for(const k of [0,10,20,40,60,80]){const b=M.bpe(Y,k);assert.ok(b.n<prev);prev=b.n;assert.equal(b.tokens.join(''),Y);assert.equal(b.vocab,143+b.merges.length);}
 assert.equal(M.bpe(Y,80).n,369);{const m=M.bpe(Y,10).merges;assert.equal(m[8].a+m[8].b,'알겠');assert.equal(m[9].a+m[9].b,'알겠어');}assert.equal(M.bpe(Y,1).merges[0].a+M.bpe(Y,1).merges[0].b,'ㅋㅋ');assert.equal(M.bpe(Y,1).merges[0].count,12);
});
test('Hamming(7,4) corrects every single flip of every data word, and fails on two flips',()=>{
 for(let v=0;v<16;v++){const d=[3,2,1,0].map(i=>(v>>i)&1),c=M.hammingEncode(d);assert.equal(M.hammingDecode(c).syndrome,0);
  for(let i=0;i<7;i++){const y=c.slice();y[i]^=1;const r=M.hammingDecode(y);assert.equal(r.syndrome,i+1);assert.deepEqual(r.data,d);}}
 const c=M.hammingEncode([1,0,1,1]);assert.equal(c.join(''),'0110011');const y=c.slice();y[2]^=1;y[4]^=1;const r=M.hammingDecode(y);assert.equal(r.syndrome,6);assert.equal(r.data.join(''),'0101');
});
test('channel capacity and seeded noise',()=>{
 for(const [p,v] of Object.entries(R.capacity))near(M.capacity(Number(p)),v,1e-12,p);near(M.capacity(0),1);
 const bits=M.encodeWith(huff(Y).codes,M.corpus.first(10));assert.equal(bits.length,534);
 const none=M.channel(bits,0.05,'none',7),rep=M.channel(bits,0.05,'rep3',7),ham=M.channel(bits,0.05,'hamming',7);
 assert.equal(none.errors,25);assert.equal(rep.errors,4);assert.equal(ham.errors,13);assert.equal(ham.sent,938);assert.equal(M.channel(bits,0.1,'hamming',7).errors,35);
 assert.deepEqual(M.channel(bits,0.05,'hamming',7).out,ham.out,'same seed, same noise');
 for(const s of ['none','rep3','hamming'])assert.equal(M.channel(bits,0,s,7).errors,0);
 near(M.theory.rep3(0.05),0.00725,1e-9);
});
test('quantization: table size and code lengths',()=>{
 const m=M.model(1,M.corpus.train(),0.1),te=M.corpus.test();assert.equal(m.rows,127);assert.equal(M.tableBits(m,4),91440);assert.equal(M.tableBits(M.model(-1,Y,1),8),0);
 const L=b=>M.codeLength(M.quantized(m,b),te).perChar;near(L(8),5.460,5e-4);near(L(4),5.464,5e-4);near(L(3),5.580,5e-4);near(L(2),5.917,5e-4);
 assert.ok(L(2)>L(4),'coarse tables are longer');near(M.codeLength(M.quantized(M.model(0,M.corpus.train(),0.1),4),te).perChar,6.190,5e-4);
});
test('final task: model cost flips the winner for a short message',()=>{
 const t=M.corpus.doyoonB(),n=M.chars(t).length,tr=M.corpus.yunseul()+'\n'+M.corpus.doyoonA();assert.equal(n,185);
 const ms=[-1,0,1].map(o=>M.model(o,tr,0.01)),len=ms.map(m=>M.codeLength(m,t).bits),cost=ms.map(m=>M.tableBits(m,8));
 assert.equal(len.indexOf(Math.min(...len)),2);assert.equal(Math.ceil((cost[2]-cost[0])/((len[0]-len[2])/n)),64650,'break-even length in the final readout');const tot=len.map((x,i)=>x+cost[i]);assert.equal(tot.indexOf(Math.min(...tot)),0);near(len[2]/n,3.68,5e-3);
});
test('guide readings quote the computed numbers',()=>{
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(base,'js/lab-guides.js'),'utf8'),ctx);const G=ctx.window.ITGuides.guides;
 const has=(id,s)=>assert.ok(G[id][2].includes(s),`${id} should mention ${s}`);
 const F=new Map(S.counts),sur=t=>M.chars(t).reduce((a,x)=>a+M.info(F.get(x)/S.n),0);
 has('surprise',f(sur('응 지금 가는 중'),2));has('surprise',f(sur('떡볶이 먹자')/6,2));has('entropy',f(M.entropy([20,15,10,5]),3));
 has('chain',f(S.H,3));has('chain',f(M.condEntropy(Y,1).H,3));has('chain',f(M.condEntropy(M.corpus.first(10),2).H,3));
 has('huffman',f(R.huffman_top6_L,3));has('mismatch',f(M.codeLength(M.model(0,Y,0.1),M.corpus.doyoonB()).perChar,3));
 has('arithmetic',f(M.arithEncode(M.model(1,M.corpus.train(),1),'응 지금 가는 중').bitsIdeal,2));has('lz',f(M.lz78(Y).perChar,2));
 const pp=M.model(2,M.corpus.train(),0.01);has('perplexity',f(2**M.codeLength(pp,M.corpus.test()).perChar,1));
 has('noisy',f(M.capacity(0.05),3));has('quantize',f(M.codeLength(M.model(1,M.corpus.train(),0.1),M.corpus.test()).perChar,3));
});
test('arithmetic, BPE, Hamming, noisy channel and quantization match the independent Python reference',()=>{
 for(const [k,v] of Object.entries(R.arith)){const [o,msg]=k.split(':');assert.equal(M.arithEncode(M.model(Number(o),M.corpus.train(),1),msg).k,v,k);}
 near(M.arithEncode(M.model(1,M.corpus.train(),1),'응 지금 가는 중').bitsIdeal,R.arith_ideal_bigram,1e-9);
 assert.equal(M.arithEncode(M.model(1,M.corpus.yunseul()+'\n'+M.corpus.doyoonA(),0.01),M.corpus.doyoonB()).k,R.arith_final_k);
 for(const [k,v] of Object.entries(R.bpe_tokens))assert.equal(M.bpe(Y,Number(k)).n,v,'bpe '+k);
 let fixed=0;for(let v=0;v<16;v++){const d=[3,2,1,0].map(i=>(v>>i)&1),c=M.hammingEncode(d);for(let i=0;i<7;i++){const y=c.slice();y[i]^=1;if(M.hammingDecode(y).data.join('')===d.join(''))fixed++;}}
 assert.equal(fixed,R.hamming_single_fixed);
 const bits=M.encodeWith(huff(Y).codes,M.corpus.first(10));assert.equal(bits.length,R.noise_bits);
 for(const [k,v] of Object.entries(R.noise_errors)){const [p,s]=k.split(':');assert.equal(M.channel(bits,Number(p),s,7).errors,v,k);}
 for(const [k,v] of Object.entries(R.quant)){const [o,b]=k.split(':').map(Number);near(M.codeLength(M.quantized(M.model(o,M.corpus.train(),0.1),b),M.corpus.test()).perChar,v,1e-9,k);}
 assert.equal(M.tableBits(M.model(1,M.corpus.train(),0.1),4),R.quant_table_bits_bigram_b4);near(M.huffman(R.top6.map(([sym,w])=>({sym,w}))).H,R.huffman_top6_H,1e-12);
});
test('choice order puts the answer at the requested position',()=>{for(const ans of [0,1,2])for(const tgt of [0,1,2]){const o=M.choiceOrder(3,ans,tgt);assert.equal(o[tgt],ans);assert.deepEqual([...o].sort(),[0,1,2]);}});
