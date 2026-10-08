/* 확률과 통계 책의 계산 모델. 화면 코드와 분리되어 있으며 Node 테스트에서도 그대로 불러온다.
   모든 확률은 0~1 사이의 실수, 개수는 0 이상의 정수로 다룬다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProbStats = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function assertProbability(p, name) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError(`${name || 'p'}는 0과 1 사이여야 합니다`);
  }

  function assertCount(n, name) {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`${name || 'n'}은 0 이상의 정수여야 합니다`);
  }

  /* 같은 씨앗이면 같은 난수열을 내는 mulberry32. 실험을 다시 재현할 수 있게 한다. */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sum(xs) { return xs.reduce((a, b) => a + b, 0); }

  function mean(xs) {
    if (!xs.length) throw new RangeError('값이 하나 이상 필요합니다');
    return sum(xs) / xs.length;
  }

  /* 표본분산: n-1로 나눈다. 값이 하나뿐이면 퍼짐을 알 수 없으므로 0을 돌려준다. */
  function variance(xs) {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
  }

  function sd(xs) { return Math.sqrt(variance(xs)); }

  function median(xs) {
    if (!xs.length) throw new RangeError('값이 하나 이상 필요합니다');
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  /* 동전(또는 경보)을 n번 시도한다. 1은 앞면(경보), 0은 뒷면(조용함). */
  function flips(n, p, random) {
    assertCount(n); assertProbability(p);
    return Array.from({ length: n }, () => (random() < p ? 1 : 0));
  }

  function runningProportion(outcomes) {
    let hits = 0;
    return outcomes.map((x, i) => { hits += x; return hits / (i + 1); });
  }

  function logFactorial(n) {
    let s = 0;
    for (let i = 2; i <= n; i += 1) s += Math.log(i);
    return s;
  }

  /* 이항분포 P(X = k): 성공 확률 p인 독립 시도 n번 중 정확히 k번 성공할 확률. */
  function binomialPmf(n, k, p) {
    assertCount(n); assertProbability(p);
    if (!Number.isInteger(k) || k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    const logC = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
    return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }

  function binomialDistribution(n, p) {
    return Array.from({ length: n + 1 }, (_, k) => binomialPmf(n, k, p));
  }

  /* P(X >= k) */
  function binomialUpper(n, k, p) {
    return sum(binomialDistribution(n, p).slice(Math.max(0, k)));
  }

  /* P(X <= k) */
  function binomialLower(n, k, p) {
    if (k < 0) return 0;
    return sum(binomialDistribution(n, p).slice(0, Math.min(n, k) + 1));
  }

  function binomialSample(n, p, random) { return sum(flips(n, p, random)); }

  /* Abramowitz–Stegun 7.1.26 근사. 절대 오차는 1.5e-7 이하이다. */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y;
  }

  function normalPdf(x, mu, sigma) {
    if (!(sigma > 0)) throw new RangeError('표준편차는 0보다 커야 합니다');
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
  }

  function normalCdf(x, mu, sigma) {
    if (!(sigma > 0)) throw new RangeError('표준편차는 0보다 커야 합니다');
    return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
  }

  return {
    rng, sum, mean, variance, sd, median, flips, runningProportion,
    binomialPmf, binomialDistribution, binomialUpper, binomialLower, binomialSample,
    erf, normalPdf, normalCdf, assertProbability, assertCount
  };
});
