/* 직접 사상(direct-mapped) 캐시 모형.
   주소 단위는 1바이트, 한 줄(블록)에 blockSize 바이트를 함께 가져온다.
   걸리는 시간은 교육용 가정값이며 실측치가 아니다: 캐시 적중 1사이클, 메인 메모리 100사이클. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompCache = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ASSUMED = { hitCycles: 1, missCycles: 100 };

  /* 재현 가능한 의사 난수(선형 합동 생성기). 같은 seed면 같은 순서가 나온다. */
  function seeded(seed) {
    let x = seed >>> 0;
    return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 2 ** 32; };
  }

  /* 접근 패턴: 64바이트 배열을 읽는 네 가지 방식 */
  function pattern(kind, count = 64) {
    if (kind === 'sequential') return Array.from({ length: count }, (_, i) => i);
    if (kind === 'stride') return Array.from({ length: count }, (_, i) => (i * 16 + Math.floor(i / 4)) % 64);
    if (kind === 'loop') return Array.from({ length: count }, (_, i) => i % 8);
    if (kind === 'random') { const r = seeded(42); return Array.from({ length: count }, () => Math.floor(r() * 64)); }
    throw new Error(`알 수 없는 패턴: ${kind}`);
  }

  function simulate(addresses, lines, blockSize, cost = ASSUMED) {
    if (lines < 1 || blockSize < 1) throw new RangeError('줄 수와 블록 크기는 1 이상');
    const tags = new Array(lines).fill(null);
    const events = addresses.map((address) => {
      const block = Math.floor(address / blockSize);
      const line = block % lines;
      const tag = Math.floor(block / lines);
      const hit = tags[line] === tag;
      const evicted = !hit && tags[line] !== null ? tags[line] : null;
      tags[line] = tag;
      return { address, block, line, tag, hit, evicted };
    });
    const hits = events.filter((e) => e.hit).length;
    const misses = events.length - hits;
    const cycles = hits * cost.hitCycles + misses * cost.missCycles;
    const noCache = events.length * cost.missCycles;
    return { events, hits, misses, hitRate: events.length ? hits / events.length : 0, cycles, noCache, average: events.length ? cycles / events.length : 0 };
  }

  return { ASSUMED, pattern, simulate };
});
