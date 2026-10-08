/* 표본에서 모집단을 추론하는 계산: 중심극한정리, 베이즈, 신뢰구간, 검정, 우도.
   stats.js의 기초 함수를 사용한다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./stats.js'));
  else root.ProbInference = factory(root.ProbStats);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  /* 표본을 뽑을 모집단 세 가지. mean과 sd는 이론값이다. */
  const POPULATIONS = {
    uniform: { label: '균등: 0~10 사이 아무 값', mean: 5, sd: 10 / Math.sqrt(12), min: 0, max: 10,
      draw: (r) => r() * 10 },
    skewed: { label: '치우침: 고장까지 걸리는 날(평균 2일)', mean: 2, sd: 2, min: 0, max: 10,
      draw: (r) => Math.min(-2 * Math.log(1 - r()), 40) },
    dice: { label: '주사위: 1~6 눈', mean: 3.5, sd: Math.sqrt(35 / 12), min: 1, max: 6,
      draw: (r) => 1 + Math.floor(r() * 6) }
  };

  function population(name) {
    const pop = POPULATIONS[name];
    if (!pop) throw new RangeError(`알 수 없는 모집단: ${name}`);
    return pop;
  }

  function sampleMean(name, n, random) {
    S.assertCount(n);
    if (n < 1) throw new RangeError('표본 크기는 1 이상이어야 합니다');
    const pop = population(name);
    let total = 0;
    for (let i = 0; i < n; i += 1) total += pop.draw(random);
    return total / n;
  }

  /* 구간 [min, max]를 bins개로 나눈 도수. 범위를 벗어난 값은 양 끝 칸에 넣는다. */
  function histogram(values, min, max, bins) {
    const counts = new Array(bins).fill(0);
    const width = (max - min) / bins;
    for (const v of values) {
      const i = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / width)));
      counts[i] += 1;
    }
    return counts;
  }

  /* 경보가 울렸을 때 실제 고장일 확률. population명의 자연 빈도로도 돌려준다. */
  function bayes({ prevalence, sensitivity, falseAlarmRate, population: total = 1000 }) {
    S.assertProbability(prevalence, '고장률');
    S.assertProbability(sensitivity, '민감도');
    S.assertProbability(falseAlarmRate, '오경보율');
    const faulty = total * prevalence;
    const healthy = total - faulty;
    const tp = faulty * sensitivity;
    const fn = faulty - tp;
    const fp = healthy * falseAlarmRate;
    const tn = healthy - fp;
    const alarms = tp + fp;
    return { tp, fn, fp, tn, alarms, posterior: alarms ? tp / alarms : 0,
      quietMissRate: tn + fn ? fn / (tn + fn) : 0 };
  }

  /* Wilson 점수 구간. 표본이 작거나 비율이 0·1에 가까워도 0~1 밖으로 나가지 않는다. */
  function wilson(k, n, z = 1.96) {
    S.assertCount(n);
    if (n === 0) return { low: 0, high: 1, center: 0.5 };
    if (!Number.isInteger(k) || k < 0 || k > n) throw new RangeError('k는 0과 n 사이의 정수여야 합니다');
    const phat = k / n;
    const z2 = z * z;
    const denom = 1 + z2 / n;
    const center = (phat + z2 / (2 * n)) / denom;
    const half = (z / denom) * Math.sqrt(phat * (1 - phat) / n + z2 / (4 * n * n));
    return { low: Math.max(0, center - half), high: Math.min(1, center + half), center };
  }

  function intervalCovers(interval, p) { return interval.low <= p && p <= interval.high; }

  /* 기존 오경보율 p0보다 낮아졌는지 보는 한쪽 이항검정. p값 = P(X <= k | p0). */
  function lowerTailTest(k, n, p0) {
    S.assertProbability(p0, '기준 비율');
    return S.binomialLower(n, k, p0);
  }

  /* 같은 실험을 여러 번 반복했을 때 p값이 alpha 이하로 나온 비율 = 검정력(또는 1종 오류율). */
  function rejectionRate(trueRate, n, p0, alpha, reps, random) {
    let rejected = 0;
    const pvalues = [];
    for (let i = 0; i < reps; i += 1) {
      const p = lowerTailTest(S.binomialSample(n, trueRate, random), n, p0);
      pvalues.push(p);
      if (p <= alpha) rejected += 1;
    }
    return { rate: reps ? rejected / reps : 0, pvalues };
  }

  /* 성공 k번, 실패 n-k번을 본 뒤 후보 확률 q의 로그우도와 평균 교차 엔트로피 손실. */
  function logLikelihood(k, n, q) {
    S.assertProbability(q, '후보 확률');
    if (n === 0) return 0;
    const term = (count, prob) => (count === 0 ? 0 : count * Math.log(prob));
    return term(k, q) + term(n - k, 1 - q);
  }

  function crossEntropy(k, n, q) { return n ? -logLikelihood(k, n, q) / n : 0; }

  function mle(k, n) { return n ? k / n : 0.5; }

  return { POPULATIONS, population, sampleMean, histogram, bayes, wilson, intervalCovers,
    lowerTailTest, rejectionRate, logLikelihood, crossEntropy, mle };
});
