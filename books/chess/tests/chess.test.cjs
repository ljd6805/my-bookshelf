/* 규칙 엔진 검사. perft 값은 Chess Programming Wiki의 Perft Results(확인 2026-10-19)와 대조하고,
   본문·실험 안내(js/lab-guides.js)에 적은 숫자는 같은 엔진으로 다시 계산해 맞춘다. */
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/chess.js'),P=require('../js/positions.js');
const F=fen=>R.parseFEN(fen),sans=s=>R.legalMoves(s).map(m=>R.san(s,m)).sort();
const KIWI='r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',POS3='8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1';
test('perft matches published counts',()=>{
 assert.deepEqual([1,2,3].map(d=>R.perft(F(R.START),d)),[20,400,8902]);
 assert.deepEqual([1,2,3].map(d=>R.perft(F(KIWI),d)),[48,2039,97862]);
 assert.deepEqual([1,2,3,4].map(d=>R.perft(F(POS3),d)),[14,191,2812,43238]);
});
test('FEN round-trips and position keys ignore move counters',()=>{
 for(const f of [R.START,KIWI,POS3,P.special.ep[1]])assert.equal(R.toFEN(F(f)),f);
 assert.equal(R.positionKey(F('8/8/4k3/8/8/2R5/8/4K3 w - - 0 1')),R.positionKey(F('8/8/4k3/8/8/2R5/8/4K3 w - - 37 60')));
});
test('reach counts on an empty board (chapter 2)',()=>{
 const reach=(p,sq)=>{const s=F('8/8/8/8/8/8/8/8 w - - 0 1');s.board[R.sq(sq)]=p;return R.pseudoMoves(s).filter(m=>m.from===R.sq(sq)).length;};
 assert.deepEqual([reach('N','d4'),reach('N','a1'),reach('B','d4'),reach('B','a1'),reach('R','d4'),reach('Q','d4'),reach('Q','a1'),reach('K','d4'),reach('K','a1')],[8,2,13,7,14,27,21,8,3]);
});
test('special moves: en passant, promotion, castling conditions (chapter 3)',()=>{
 assert.ok(sans(F(P.special.ep[1])).includes('exd6'));
 assert.deepEqual(sans(F(P.special.promo[1])).filter(t=>t.startsWith('b8')),['b8B','b8N','b8Q','b8R']);
 const c=F(P.special.castle[1]);assert.ok(R.castlingCheck(c,'w','K').ok&&R.castlingCheck(c,'w','Q').ok);
 const b=F(P.special.blocked[1]),k=R.castlingCheck(b,'w','K');assert.equal(k.ok,false);assert.equal(k.passSafe,false);assert.ok(k.rights&&k.empty&&k.notInCheck&&k.landSafe);assert.ok(R.castlingCheck(b,'w','Q').ok);
});
test('pins and checks filter pseudo moves (chapter 4)',()=>{
 const n=f=>{const s=F(f);return [R.pseudoMoves(s).length,R.legalMoves(s).length];};
 assert.deepEqual(n(P.legal.pin[1]),[13,5]);assert.deepEqual(n(P.legal.check[1]),[12,3]);assert.deepEqual(n(P.legal.double[1]),[11,2]);
 assert.deepEqual(sans(F(P.legal.check[1])),['Ke2','Nc1','Nxa1']);
 assert.deepEqual(sans(F(P.legal.double[1])),['Ke2','Kf2']);
});
test('game endings (chapter 5)',()=>{
 assert.equal(R.status(F(P.ending.mate[1])).result,'checkmate');
 assert.equal(R.status(F(P.ending.stalemate[1])).result,'stalemate');
 assert.equal(R.status(F(P.ending.dead[1])).result,'dead');
 const fifty=R.status(F(P.ending.fifty[1]));assert.equal(fifty.result,'ongoing');assert.ok(fifty.claimFifty);
 const run=R.playLine(P.ending.repeat[3]),keys=run.states.map(R.positionKey),last=R.status(run.states.at(-1),keys);assert.equal(last.repeats,3);assert.ok(last.claimRepetition);
 assert.equal(R.status(F('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1')).result,'stalemate');
});
test('notation (chapter 6)',()=>{
 const t=F(P.notation.twin[1]);assert.ok(sans(t).includes('Nbd2')&&sans(t).includes('Nfd2'));
 assert.ok(sans(F(P.notation.promo[1])).includes('axb8Q+'));
 assert.equal(R.playLine(P.notation.open[3]).moves.map(m=>m.san).join(' '),'e4 e5 Nf3 Nc6 Bb5');
 assert.equal(R.parseSan(F(R.START),'O-O'),null);
 /* 잡지 않는 수에 x를 붙이면 받지 않는다. 잡는 수에서 x를 빼는 것은 부록 C.13이 허용하는 생략이라 받는다. */
 assert.equal(R.parseSan(F(R.START),'Nxf3'),null);assert.equal(R.parseSan(F(P.special.ep[1]),'exd6').flag,'ep');assert.equal(R.parseSan(F(P.special.ep[1]),'ed6').flag,'ep');
});
test('quiescence searches every check evasion instead of standing pat',()=>{
 /* 나이트 포크: 체크를 받은 검은 킹이 피하면 흰 나이트가 a8의 퀸을 잡는다. 가만히 있는 값 +6이 아니라 −3이어야 한다. */
 assert.equal(R.quiesce(F('q3k3/2N5/8/8/8/8/8/4K3 b - - 0 1'),-Infinity,Infinity,0,{nodes:0}),-3);
});
test('exchange on d5 (chapter 7)',()=>{
 const g=k=>R.exchange(F(P.exchange[k][1]),R.sq('d5')).gain;
 assert.deepEqual([g('even'),g('bad'),g('good'),g('two')],[0,-4,2,-2]);
});
test('opening principles after eight plies (chapter 8)',()=>{
 const at=k=>{const s=R.playLine(P.opening[k][1]).states[8];return [R.principles(s,'w'),R.principles(s,'b')];};
 const [pw,pb]=at('principled');assert.equal(pw.developed,2);assert.ok(pw.castled);assert.equal(pb.developed,3);
 const [qw,qb]=at('queen');assert.equal(qw.developed,1);assert.equal(qw.hits,3);assert.equal(qb.developed,2);assert.equal(qb.hits,5);
 const [ew,eb]=at('edge');assert.equal(ew.developed,0);assert.equal(ew.hits,0);assert.equal(eb.developed,2);
});
test('tactic puzzles: the answer wins material against the best reply (chapter 9)',()=>{
 const gain={fork:5,pin:6,skewer:9,discover:6};
 for(const [k,[,fen,ans]] of Object.entries(P.tactics)){const s=F(fen),base=R.evaluate(s),n=R.makeMove(s,R.parseSan(s,ans));assert.equal(-R.search(n,1).score-base,gain[k],k);}
});
test('mate puzzles (chapter 10)',()=>{
 for(const k of ['back','queen','rook']){const [,fen,,ans]=P.mates[k],n=R.makeMove(F(fen),R.parseSan(F(fen),ans));assert.equal(R.status(n).result,'checkmate',k);}
 const [,fen]=P.mates.ladder,line=R.playLine('Ra7 Kg8 Rb8#',fen);assert.equal(R.status(line.states.at(-1)).result,'checkmate');
});
test('minimax and alpha-beta agree; alpha-beta visits fewer nodes (chapter 11)',()=>{
 const s=F(P.search.fork[1]),mm=R.minimax(s,3),ab=R.alphabeta(s,3,-Infinity,Infinity,0,{nodes:0},false),so=R.alphabeta(s,3,-Infinity,Infinity,0,{nodes:0},true);
 assert.equal(mm.nodes,8674);assert.equal(ab.nodes,750);assert.equal(so.nodes,635);assert.equal(mm.score,ab.score);assert.equal(R.san(s,ab.best),'Nc7+');assert.equal(ab.score,4);
 const st=F(R.START);assert.equal(R.minimax(st,3).nodes,9323);assert.equal(R.alphabeta(st,3,-Infinity,Infinity,0,{nodes:0},false).nodes,586);
 const l=F(P.search.ladder[1]),d3=R.alphabeta(l,3,-Infinity,Infinity,0,{nodes:0},false);assert.equal(d3.score,R.MATE-3);
 assert.ok(R.alphabeta(l,2,-Infinity,Infinity,0,{nodes:0},false).score<900);
});
test('Hajun game: moments and material (final task)',()=>{
 const run=R.playLine(P.game.moves);assert.equal(run.moves.length,20);const m=R.material(run.states.at(-1));assert.deepEqual([m.w,m.b],[21,28]);
 const evals=P.game.moments.map(([ply,c])=>{const s=run.states[ply],base=R.evaluate(s);return c.map(t=>-R.search(R.makeMove(s,R.parseSan(s,t)),2).score-base+0);});
 assert.deepEqual(evals,[[0,0,0],[-5,0,0],[-2,0,-1]]);
});
