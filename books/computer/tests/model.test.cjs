const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/model.js');
const C = require('../js/cpu.js');
const K = require('../js/cache.js');

test('비트와 십진수는 서로 되돌아온다', () => {
  for (const v of [0, 1, 127, 128, 255]) assert.equal(M.bitsToNumber(M.numberToBits(v, 8)), v);
  assert.deepEqual(M.numberToBits(5, 4), [0, 1, 0, 1]);
  assert.throws(() => M.numberToBits(256, 8), RangeError);
  assert.throws(() => M.numberToBits(-1, 8), RangeError);
});

test('같은 바이트를 부호 있는 수와 글자로 읽는다', () => {
  assert.equal(M.toSigned(127), 127);
  assert.equal(M.toSigned(128), -128);
  assert.equal(M.toSigned(255), -1);
  assert.equal(M.toAsciiLabel(65), 'A');
  assert.equal(M.toAsciiLabel(10), null);
  assert.deepEqual(M.utf8Bytes('A'), [65]);
  assert.deepEqual(M.utf8Bytes('가'), [0xEA, 0xB0, 0x80]);
  assert.equal(M.hex(10), '0A');
});

test('게이트 진리표와 NAND의 성질', () => {
  assert.deepEqual(M.truthTable('AND').map((r) => r.out), [0, 0, 0, 1]);
  assert.deepEqual(M.truthTable('XOR').map((r) => r.out), [0, 1, 1, 0]);
  assert.deepEqual(M.truthTable('NOT').map((r) => r.out), [1, 0]);
  for (const a of [0, 1]) for (const b of [0, 1]) {
    const nand = (x, y) => M.gate('NAND', x, y);
    assert.equal(nand(nand(a, b), nand(a, b)), M.gate('AND', a, b));
  }
  assert.throws(() => M.gate('XNOR', 0, 1));
});

test('리플 캐리 가산기는 모든 4비트 쌍에서 정수 덧셈과 같다', () => {
  for (let a = 0; a < 16; a += 1) for (let b = 0; b < 16; b += 1) {
    const r = M.rippleAdd(a, b, 4);
    assert.equal(r.value + r.carry * 16, a + b);
    assert.equal(r.overflow, a + b > 15);
  }
  assert.deepEqual(M.rippleAdd(15, 1, 4).steps.map((s) => s.carryOut), [1, 1, 1, 1]);
});

test('레지스터는 쓰기 허용일 때만 바뀐다', () => {
  assert.deepEqual(M.clockRegister([0, 0], [1, 1], false), [0, 0]);
  assert.deepEqual(M.clockRegister([0, 0], [1, 1], true), [1, 1]);
});

test('명령은 위 4비트와 아래 4비트로 나뉜다', () => {
  assert.equal(C.encode('LDA', 14), 0x1E);
  assert.equal(C.decode(0x2F).label, 'ADD 15');
  assert.equal(C.decode(0xE0).label, 'OUT');
  assert.equal(C.decode(0x90).valid, false);
  assert.throws(() => C.encode('LDA', 16), RangeError);
});

test('준비한 프로그램의 실행 결과', () => {
  assert.deepEqual(C.run(C.PROGRAMS.add.memory).out, [7]);
  const mul = C.run(C.PROGRAMS.multiply.memory);
  assert.deepEqual(mul.out, [12]);
  assert.equal(mul.error, null);
  assert.deepEqual(C.run(C.PROGRAMS.countdown.memory).out, [5, 4, 3, 2, 1, 0]);
  assert.deepEqual(C.run(C.PROGRAMS.overflow.memory).out, [44], '300은 8비트에서 300-256=44');
});

test('한 단계 실행은 가져오기·해독·실행 기록을 남기고 원래 상태를 바꾸지 않는다', () => {
  const s0 = C.createState(C.PROGRAMS.add.memory);
  const { state, trace } = C.step(s0);
  assert.deepEqual(trace.map((t) => t.phase), ['fetch', 'decode', 'execute']);
  assert.equal(state.acc, 3);
  assert.equal(state.pc, 1);
  assert.equal(s0.acc, 0);
});

test('덧셈 자리넘침은 C 깃발을 세운다', () => {
  const mem = new Array(16).fill(0);
  mem[0] = C.encode('LDA', 14); mem[1] = C.encode('ADD', 15); mem[2] = C.encode('HLT');
  mem[14] = 200; mem[15] = 100;
  const s = C.run(mem);
  assert.equal(s.acc, 44);
  assert.equal(s.c, 1);
});

test('끝나지 않는 프로그램과 해석할 수 없는 명령은 오류로 알린다', () => {
  const loop = new Array(16).fill(0); loop[0] = C.encode('JMP', 0);
  assert.match(C.run(loop).error, /500단계/);
  const bad = new Array(16).fill(0); bad[0] = 0x90;
  const s = C.run(bad);
  assert.equal(s.halted, true);
  assert.match(s.error, /해석할 수 없습니다/);
});

test('캐시: 순차 접근, 반복, 충돌의 대표값', () => {
  const seq = K.simulate(K.pattern('sequential'), 4, 4);
  assert.equal(seq.misses, 16);
  assert.equal(seq.hitRate, 0.75);
  assert.equal(seq.cycles, 48 * 1 + 16 * 100);
  assert.equal(K.simulate(K.pattern('loop'), 4, 4).misses, 2);
  assert.equal(K.simulate(K.pattern('stride'), 4, 4).hits, 0, '같은 줄을 번갈아 쓰면 모두 실패');
  assert.ok(K.simulate(K.pattern('stride'), 16, 4).hits > 0, '줄이 충분하면 적중이 생긴다');
  assert.deepEqual(K.pattern('random'), K.pattern('random'));
  for (const kind of ['sequential', 'stride', 'loop', 'random']) {
    const r = K.simulate(K.pattern(kind), 8, 4);
    assert.equal(r.hits + r.misses, 64);
    assert.ok(r.cycles <= r.noCache);
  }
  assert.throws(() => K.simulate([1], 0, 4), RangeError);
});
