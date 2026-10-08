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

  return { bitsToNumber, numberToBits, toSigned, toAsciiLabel, utf8Bytes, hex, gate, truthTable, fullAdder, rippleAdd, clockRegister, GATE_NAMES: Object.keys(GATES) };
});
