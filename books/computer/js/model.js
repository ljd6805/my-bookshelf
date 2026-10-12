/* 계산 모형: 화면과 분리된 순수 함수만 둔다. 모든 값은 정수 비트 또는 바이트(0~255)이다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompModel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* 1장·2장: 비트와 해석 */
  function bitsToNumber(bits) {
    return bits.reduce((sum, bit) => sum * 2 + (bit ? 1 : 0), 0);
  }

  function numberToBits(value, width) {
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** width) {
      throw new RangeError(`${width}비트로 나타낼 수 없는 값: ${value}`);
    }
    return Array.from({ length: width }, (_, i) => (value >> (width - 1 - i)) & 1);
  }

  function toSigned(byte) {
    return byte >= 128 ? byte - 256 : byte;
  }

  function toAsciiLabel(byte) {
    if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
    return null;
  }

  function utf8Bytes(text) {
    return Array.from(new TextEncoder().encode(text));
  }

  function hex(byte) {
    return byte.toString(16).toUpperCase().padStart(2, '0');
  }

  /* 3장: 논리 게이트 */
  const GATES = {
    AND: (a, b) => a & b,
    OR: (a, b) => a | b,
    XOR: (a, b) => a ^ b,
    NAND: (a, b) => 1 - (a & b),
    NOR: (a, b) => 1 - (a | b),
    NOT: (a) => 1 - a
  };

  function gate(name, a, b) {
    if (!GATES[name]) throw new Error(`알 수 없는 게이트: ${name}`);
    return GATES[name](a, b);
  }

  function truthTable(name) {
    const rows = name === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    return rows.map((inputs) => ({ inputs, out: gate(name, inputs[0], inputs[1]) }));
  }

  /* 4장: 가산기. 게이트 함수만으로 전가산기를 조립한다. */
  function fullAdder(a, b, carryIn) {
    const partial = gate('XOR', a, b);
    const sum = gate('XOR', partial, carryIn);
    const carry = gate('OR', gate('AND', a, b), gate('AND', partial, carryIn));
    return { sum, carry };
  }

  /* 오른쪽(가장 낮은 자리)부터 자리올림을 넘기며 더한다. steps[i]는 i번째 자리 계산 기록이다. */
  function rippleAdd(a, b, width) {
    const aBits = numberToBits(a, width).reverse();
    const bBits = numberToBits(b, width).reverse();
    const steps = [];
    let carry = 0;
    for (let i = 0; i < width; i += 1) {
      const result = fullAdder(aBits[i], bBits[i], carry);
      steps.push({ position: i, a: aBits[i], b: bBits[i], carryIn: carry, sum: result.sum, carryOut: result.carry });
      carry = result.carry;
    }
    const sumBits = steps.map((s) => s.sum).reverse();
    return { steps, value: bitsToNumber(sumBits), carry, overflow: carry === 1 };
  }

  /* 5장: 클럭 가장자리에서만 값을 받아들이는 레지스터 */
  function clockRegister(stored, inputs, writeEnable) {
    return writeEnable ? inputs.slice() : stored.slice();
  }


  /* 2장 보충: 부동소수점. fmt = { exp: 지수 비트 수, frac: 가수 비트 수 }. bits는 0 ~ 2^(1+exp+frac)−1 정수이다. */
  const FP16 = { name: 'FP16', exp: 5, frac: 10 };
  const BF16 = { name: 'BF16', exp: 8, frac: 7 };
  const bias = (fmt) => 2 ** (fmt.exp - 1) - 1;

  function decodeFloat(bits, fmt) {
    const width = 1 + fmt.exp + fmt.frac, top = 2 ** (width - 1), fracMax = 2 ** fmt.frac, expMax = 2 ** fmt.exp - 1;
    if (!Number.isInteger(bits) || bits < 0 || bits >= 2 * top) throw new RangeError(`${width}비트로 나타낼 수 없는 값: ${bits}`);
    const sign = bits >= top ? 1 : 0, rest = bits - sign * top;
    const e = Math.floor(rest / fracMax), f = rest % fracMax, s = sign ? -1 : 1;
    let kind, value;
    if (e === expMax) { kind = f ? 'nan' : 'inf'; value = f ? NaN : s * Infinity; }
    else if (e === 0) { kind = f ? 'subnormal' : 'zero'; value = s * f * 2 ** (1 - bias(fmt) - fmt.frac); }
    else { kind = 'normal'; value = s * (1 + f / fracMax) * 2 ** (e - bias(fmt)); }
    return { sign, exponent: e, fraction: f, kind, value };
  }

  /* 가장 가까운 값으로 반올림하고, 정확히 가운데이면 가수가 짝수인 쪽을 고른다(IEEE 754 기본 반올림). */
  function roundHalfEven(v) {
    const r = Math.floor(v), d = v - r;
    return d > 0.5 || (d === 0.5 && r % 2 === 1) ? r + 1 : r;
  }

  function encodeFloat(x, fmt) {
    const width = 1 + fmt.exp + fmt.frac, top = 2 ** (width - 1), fracMax = 2 ** fmt.frac, expMax = 2 ** fmt.exp - 1;
    if (Number.isNaN(x)) return expMax * fracMax + fracMax / 2;
    const sign = x < 0 || Object.is(x, -0) ? top : 0, a = Math.abs(x);
    if (a === Infinity) return sign + expMax * fracMax;
    if (a === 0) return sign;
    let e = Math.floor(Math.log2(a));
    if (2 ** e > a) e -= 1;
    if (2 ** (e + 1) <= a) e += 1;
    let rest;
    if (e < 1 - bias(fmt)) rest = roundHalfEven(a / 2 ** (1 - bias(fmt) - fmt.frac)); // 비정규수: 지수 칸 0
    else rest = (e + bias(fmt)) * fracMax + roundHalfEven((a / 2 ** e - 1) * fracMax); // 반올림 올림은 지수 칸으로 넘어간다
    if (rest >= expMax * fracMax) rest = expMax * fracMax; // 범위를 넘으면 무한대
    return sign + rest;
  }

  /* 같은 부호에서 0에서 먼 쪽으로 바로 다음에 적을 수 있는 수와 그 간격. 무한대·NaN이면 null.
     최댓값처럼 다음 비트가 무한대이면 더 큰 유한한 수가 없으므로 next = ±∞, gap = null. */
  function floatNeighbor(bits, fmt) {
    const here = decodeFloat(bits, fmt);
    if (here.kind === 'inf' || here.kind === 'nan') return null;
    const next = decodeFloat(bits + 1, fmt);
    if (next.kind === 'inf') return { next: next.value, gap: null };
    const e = Math.max(here.exponent, 1);
    return { next: next.value, gap: 2 ** (e - bias(fmt) - fmt.frac) };
  }

  /* 비트 문자열을 부호 | 지수 | 가수 칸으로 나눠 보여 준다. */
  function floatFields(bits, fmt) {
    const s = numberToBits(bits, 1 + fmt.exp + fmt.frac).join('');
    return [s.slice(0, 1), s.slice(1, 1 + fmt.exp), s.slice(1 + fmt.exp)];
  }

  return { FP16, BF16, decodeFloat, encodeFloat, floatNeighbor, floatFields, roundHalfEven, bitsToNumber, numberToBits, toSigned, toAsciiLabel, utf8Bytes, hex, gate, truthTable, fullAdder, rippleAdd, clockRegister, GATE_NAMES: Object.keys(GATES) };
});
