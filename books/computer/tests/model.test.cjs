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

test('FP16·BF16 부동소수점: 대표값·경계값·반올림 (2026-10-12 보충)', () => {
  const { FP16, BF16 } = M;
  // 기준값: 1의 간격 2⁻¹⁰, 2048 근처 간격 2, 최댓값 65504, 최소 정규수 2⁻¹⁴
  assert.equal(M.encodeFloat(1, FP16), 0x3C00);
  assert.equal(M.floatNeighbor(0x3C00, FP16).gap, 2 ** -10);
  assert.equal(M.floatNeighbor(M.encodeFloat(2048, FP16), FP16).gap, 2);
  const top = M.floatNeighbor(M.encodeFloat(65504, FP16), FP16);
  assert.equal(top.next, Infinity);
  assert.equal(top.gap, null);
  assert.equal(M.decodeFloat(0x7BFF, FP16).value, 65504);
  assert.equal(M.decodeFloat(0x0400, FP16).value, 2 ** -14);
  assert.equal(M.decodeFloat(0x0001, FP16).kind, 'subnormal');
  // 지수 칸이 모두 1이면 무한대 또는 NaN
  assert.equal(M.decodeFloat(0x7C00, FP16).value, Infinity);
  assert.equal(M.decodeFloat(0x7C01, FP16).kind, 'nan');
  assert.equal(M.decodeFloat(0xFC00, FP16).value, -Infinity);
  // 반올림: 2049는 가운데라 짝수 가수 쪽 2048, 65520은 넘쳐서 무한대 (Python struct 'e'와 대조한 비트)
  assert.equal(M.encodeFloat(2049, FP16), 0x6800);
  assert.equal(M.encodeFloat(65520, FP16), 0x7C00);
  assert.equal(M.encodeFloat(0.1, FP16), 0x2E66);
  assert.equal(M.encodeFloat(0.3, FP16), 0x34CD);
  assert.equal(M.encodeFloat(1.5e-5, FP16), 0x00FC);
  assert.equal(M.encodeFloat(-2, FP16), 0xC000);
  // BF16: 1은 0x3F80, 간격 2⁻⁷, 0.1은 0x3DCD, FP16 최댓값은 65536으로, 70000은 70144로 반올림
  assert.equal(M.encodeFloat(1, BF16), 0x3F80);
  assert.equal(M.floatNeighbor(0x3F80, BF16).gap, 2 ** -7);
  assert.equal(M.encodeFloat(0.1, BF16), 0x3DCD);
  assert.equal(M.decodeFloat(M.encodeFloat(65504, BF16), BF16).value, 65536);
  assert.equal(M.decodeFloat(M.encodeFloat(70000, BF16), BF16).value, 70144);
  // 불변 조건: 유한한 모든 FP16 비트는 되돌려 적으면 같은 비트가 된다
  for (let b = 0; b < 0x7C00; b += 1) assert.equal(M.encodeFloat(M.decodeFloat(b, FP16).value, FP16), b);
  assert.deepEqual(M.floatFields(0x3C00, FP16), ['0', '01111', '0000000000']);
  assert.throws(() => M.decodeFloat(65536, FP16), RangeError);
});

test('확인 문제 보기 돌리기: 정답이 정한 자리로 간다', () => {
  const Q = require('../js/quiz.js');
  assert.deepEqual(Q.order(3, 1, 0), [1, 2, 0]);
  assert.deepEqual(Q.order(3, 1, 1), [0, 1, 2]);
  assert.deepEqual(Q.order(3, 0, 2), [1, 2, 0]);
  for (let a = 0; a < 3; a += 1) for (let t = 0; t < 3; t += 1) {
    const o = Q.order(3, a, t);
    assert.equal(o[t], a);
    assert.deepEqual([...o].sort(), [0, 1, 2]);
  }
  assert.throws(() => Q.order(3, 3, 0), RangeError);
});

test('같은 덧셈기로 빼기: a + (NOT b) + 1과 빌림 신호', () => {
  for (let a = 0; a < 16; a += 1) for (let b = 0; b < 16; b += 1) {
    const r = M.rippleSub(a, b, 4);
    assert.equal(r.value, (a - b + 16) % 16);
    assert.equal(r.carry, a >= b ? 1 : 0);
    assert.equal(r.borrow, a < b);
    assert.equal(r.steps[0].carryIn, 1);
  }
  const s73 = M.rippleSub(7, 3, 4), s37 = M.rippleSub(3, 7, 4);
  assert.deepEqual([s73.inverted, s73.value, s73.carry], [12, 4, 1]);
  assert.deepEqual([s37.value, s37.signed, s37.carry], [12, -4, 0]);
  assert.throws(() => M.rippleSub(3, 16, 4), RangeError);
});
