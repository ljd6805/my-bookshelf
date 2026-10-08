/* 교육용 8비트 누산기 CPU 모형.
   메모리 16칸, 칸마다 1바이트. 명령 1바이트 = 위 4비트 명령 번호 + 아래 4비트 주소(또는 값).
   실제 CPU의 파이프라인·인터럽트·캐시는 다루지 않는다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompCPU = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OPS = {
    0: { name: 'NOP', text: '아무것도 하지 않음' },
    1: { name: 'LDA', text: '메모리 [a]의 값을 ACC로 가져옴' },
    2: { name: 'ADD', text: 'ACC에 메모리 [a]의 값을 더함' },
    3: { name: 'SUB', text: 'ACC에서 메모리 [a]의 값을 뺌' },
    4: { name: 'STA', text: 'ACC 값을 메모리 [a]에 저장' },
    5: { name: 'LDI', text: '숫자 a를 ACC에 바로 넣음' },
    6: { name: 'JMP', text: '다음 명령을 [a]에서 읽음' },
    7: { name: 'JZ', text: 'Z 깃발이 1이면 [a]로 이동' },
    8: { name: 'JC', text: 'C 깃발이 1이면 [a]로 이동' },
    14: { name: 'OUT', text: 'ACC 값을 출력 화면에 보냄' },
    15: { name: 'HLT', text: '실행을 멈춤' }
  };
  const CODES = Object.fromEntries(Object.entries(OPS).map(([code, op]) => [op.name, Number(code)]));
  const NO_OPERAND = new Set(['NOP', 'OUT', 'HLT']);
  const MAX_STEPS = 500;

  function encode(name, operand = 0) {
    if (!(name in CODES)) throw new Error(`알 수 없는 명령: ${name}`);
    if (operand < 0 || operand > 15) throw new RangeError('주소는 0~15');
    return (CODES[name] << 4) | operand;
  }

  function decode(byte) {
    const code = byte >> 4, operand = byte & 15, op = OPS[code];
    if (!op) return { name: '???', operand, valid: false, label: `알 수 없는 명령(${code})` };
    const label = NO_OPERAND.has(op.name) ? op.name : `${op.name} ${operand}`;
    return { name: op.name, operand, valid: true, label, text: op.text.replace('a', String(operand)) };
  }

  function createState(memory) {
    if (memory.length !== 16) throw new Error('메모리는 16칸이어야 합니다');
    return { mem: memory.slice(), pc: 0, ir: 0, acc: 0, z: 0, c: 0, halted: false, error: null, out: [], steps: 0 };
  }

  function setAcc(s, raw) {
    s.c = raw > 255 || raw < 0 ? 1 : 0;
    s.acc = ((raw % 256) + 256) % 256;
    s.z = s.acc === 0 ? 1 : 0;
  }

  /* 명령 하나를 가져오기·해독·실행 세 단계로 처리한다. 새 상태와 단계 기록을 돌려준다. */
  function step(prev) {
    const s = { ...prev, mem: prev.mem.slice(), out: prev.out.slice() };
    if (s.halted) return { state: s, trace: [] };
    const trace = [];
    const at = s.pc;
    s.ir = s.mem[at];
    s.pc = (s.pc + 1) % 16;
    trace.push({ phase: 'fetch', read: at, text: `[${at}]의 바이트 ${s.ir}을 명령 레지스터로 가져오고 PC를 ${s.pc}로 올립니다.` });
    const d = decode(s.ir);
    if (!d.valid) {
      s.halted = true;
      s.error = `${at}번 칸의 ${s.ir}은 명령으로 해석할 수 없습니다.`;
      trace.push({ phase: 'decode', text: s.error });
      return { state: s, trace };
    }
    trace.push({ phase: 'decode', text: `위 4비트 ${s.ir >> 4}는 ${d.name}, 아래 4비트 ${d.operand}는 ${NO_OPERAND.has(d.name) ? '쓰지 않습니다' : '주소 또는 값입니다'}.` });
    const e = execute(s, d);
    s.steps += 1;
    trace.push({ phase: 'execute', read: e.read, write: e.write, text: e.text });
    return { state: s, trace };
  }

  function execute(s, d) {
    const a = d.operand, m = s.mem[a];
    switch (d.name) {
      case 'LDA': setAcc(s, m); return { read: a, text: `[${a}]의 ${m}을 ACC에 넣습니다. ACC=${s.acc}` };
      case 'ADD': { const before = s.acc; setAcc(s, s.acc + m); return { read: a, text: `${before} + ${m} = ${before + m}${s.c ? ` → 8비트를 넘어 ${s.acc}만 남고 C=1` : ''}. ACC=${s.acc}` }; }
      case 'SUB': { const before = s.acc; setAcc(s, s.acc - m); return { read: a, text: `${before} − ${m} → ACC=${s.acc}, Z=${s.z}` }; }
      case 'STA': s.mem[a] = s.acc; return { write: a, text: `ACC의 ${s.acc}을 [${a}]에 씁니다.` };
      case 'LDI': setAcc(s, a); return { text: `숫자 ${a}를 ACC에 넣습니다.` };
      case 'JMP': s.pc = a; return { text: `PC를 ${a}로 바꿉니다.` };
      case 'JZ': if (s.z) s.pc = a; return { text: s.z ? `Z=1이므로 ${a}로 이동합니다.` : 'Z=0이므로 다음 명령으로 갑니다.' };
      case 'JC': if (s.c) s.pc = a; return { text: s.c ? `C=1이므로 ${a}로 이동합니다.` : 'C=0이므로 다음 명령으로 갑니다.' };
      case 'OUT': s.out.push(s.acc); return { text: `출력 화면에 ${s.acc}을 보냅니다.` };
      case 'HLT': s.halted = true; return { text: '실행을 멈춥니다.' };
      default: return { text: '아무것도 하지 않습니다.' };
    }
  }

  /* 멈출 때까지 실행한다. 끝나지 않는 프로그램은 MAX_STEPS에서 끊고 오류로 알린다. */
  function run(memory, limit = MAX_STEPS) {
    let state = createState(memory);
    while (!state.halted && state.steps < limit) state = step(state).state;
    if (!state.halted) state = { ...state, error: `${limit}단계 안에 멈추지 않았습니다. 반복이 끝나는 조건을 확인하세요.` };
    return state;
  }

  function program(lines, data) {
    const mem = new Array(16).fill(0);
    lines.forEach(([name, operand], i) => { mem[i] = encode(name, operand); });
    Object.entries(data).forEach(([addr, value]) => { mem[Number(addr)] = value; });
    return mem;
  }

  /* 미리 준비한 프로그램. 데이터 칸 주소는 설명 문장과 함께 화면에 표시된다. */
  const PROGRAMS = {
    add: { title: '3 + 4', memory: program([['LDA', 14], ['ADD', 15], ['OUT'], ['HLT']], { 14: 3, 15: 4 }), data: { 14: '첫 수', 15: '둘째 수' } },
    multiply: {
      title: '3 × 4 (반복 덧셈)',
      memory: program([
        ['LDA', 15], ['JZ', 9], ['SUB', 12], ['STA', 15], ['LDA', 13], ['ADD', 14], ['STA', 13], ['JMP', 0], ['NOP'],
        ['LDA', 13], ['OUT'], ['HLT']
      ], { 12: 1, 13: 0, 14: 3, 15: 4 }),
      data: { 12: '상수 1', 13: '결과', 14: '더할 수', 15: '남은 횟수' }
    },
    countdown: {
      title: '5부터 거꾸로 세기',
      memory: program([['LDA', 15], ['OUT'], ['JZ', 6], ['SUB', 14], ['STA', 15], ['JMP', 0], ['HLT']], { 14: 1, 15: 5 }),
      data: { 14: '상수 1', 15: '시작 값' }
    }
  };
  PROGRAMS.overflow = { title: '100 × 3 (마지막 과제)', memory: PROGRAMS.multiply.memory.slice(), data: PROGRAMS.multiply.data };
  PROGRAMS.overflow.memory[14] = 100;
  PROGRAMS.overflow.memory[15] = 3;

  return { OPS, encode, decode, createState, step, run, PROGRAMS, MAX_STEPS };
});
