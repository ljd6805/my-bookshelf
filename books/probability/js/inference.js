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

  /* 개수 0..n의 값(확률이나 도수)을 0..maxBin-1과 "maxBin 이상" 한 칸으로 묶는다. 합은 보존된다. */
  function capTail(values, maxBin) {
    S.assertCount(maxBin);
    const head = values.slice(0, maxBin);
    while (head.length < maxBin) head.push(0);
    return [...head, S.sum(values.slice(maxBin))];
  }

  /* 도수를 전체 횟수로 나눈 비율. 아직 한 번도 세지 않았으면 모두 0이다. */
  function frequencies(counts, total) {
    S.assertCount(total);
    return counts.map((c) => (total ? c / total : 0));
  }


  /* 값들 가운데 center ± half 안에 든 비율. 값이 없으면 0이다. */
  function shareWithin(values, center, half) {
    if (!values.length) return 0;
    return values.filter((v) => Math.abs(v - center) <= half).length / values.length;
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

  /* 여러 번 검정하기. 검정 k개가 서로 독립이고 각각 정확히 alpha로 잘못 유의할 때, 적어도 하나가 유의할 확률.
     본페로니 보정은 검정 하나의 기준을 alpha / k로 낮춰 이 확률을 alpha 이하로 묶는다. */
  function familywiseError(alpha, k) {
    S.assertProbability(alpha, '유의수준');
    if (!Number.isInteger(k) || k < 1) throw new RangeError('검정 수는 1 이상의 정수여야 합니다.');
    return 1 - (1 - alpha) ** k;
  }
  function bonferroni(alpha, k) { return alpha / k; }

  /* 정확 이항검정은 개수가 정수라 실제로 잘못 유의할 확률(검정의 크기)이 alpha보다 작다. P(X <= c | p0) <= alpha인 가장 큰 값. */
  function exactTestSize(n, p0, alpha) {
    let size = 0;
    for (let c = 0; c <= n; c += 1) { const p = lowerTailTest(c, n, p0); if (p > alpha) break; size = p; }
    return size;
  }

  /* 센서 k대를 같은 n일 동안 동시에 시험하는 일을 reps번 반복한다. 반복마다 p값이 threshold 이하인 센서가
     한 대라도 있었는지 센다. 모든 센서의 진짜 오경보율은 trueRate로 같다고 둔다. */
  function anyRejectionRate(trueRate, n, p0, threshold, k, reps, random) {
    let any = 0, hits = 0;
    for (let i = 0; i < reps; i += 1) {
      let found = 0;
      for (let j = 0; j < k; j += 1) if (lowerTailTest(S.binomialSample(n, trueRate, random), n, p0) <= threshold) found += 1;
      if (found) any += 1;
      hits += found;
    }
    return { rate: reps ? any / reps : 0, meanHits: reps ? hits / reps : 0 };
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

  /* 우도비 기준: 전체 손실(−로그우도)이 바닥보다 1.92(= χ²₁의 95% 분위수 3.84의 절반) 이하로 큰 후보는
     데이터와 크게 어긋나지 않는 약 95% 범위에 든다. */
  const LR95 = 1.92;

  function likelihoodRegion(k, n, q, threshold = LR95) {
    const best = mle(k, n);
    const gap = n ? logLikelihood(k, n, best) - logLikelihood(k, n, q) : 0;
    return { best, gap, inside: gap <= threshold };
  }

  /* 9장 가상 데이터: 한빛 공장 모터 20대의 하루 기록. 부하(가동률)가 진동과 온도를 함께 올리고,
     온도는 진동에 아무 영향도 주지 않는다. 단위: 진동 mm/s(RMS 속도), 온도 °C, 부하 0~1.
     randomized이면 온도를 부하와 상관없이 무작위 단계로 맞춘다(이상적인 개입). */
  const LOAD_LEVELS = [{ id: 'low', label: '부하 낮음', load: 0.4 }, { id: 'mid', label: '부하 보통', load: 0.7 }, { id: 'high', label: '부하 높음', load: 1.0 }];
  const SENSOR_MODEL = { motors: 20, vibBase: 3.0, vibPerLoad: 4, vibNoise: 0.6, tempBase: 45, tempPerLoad: 30, tempNoise: 3, loadMean: 0.7, seed: 112 };

  function sensorDays({ strength, days, randomized = false, seed = SENSOR_MODEL.seed }) {
    S.assertProbability(strength, '교란 강도');
    S.assertCount(days, '일수');
    const M = SENSOR_MODEL, random = S.rng(seed), rows = [];
    for (let motor = 1; motor <= M.motors; motor += 1) {
      for (let day = 1; day <= days; day += 1) {
        const level = Math.floor(random() * 3), set = Math.floor(random() * 3);
        const zv = S.normalSample(random), zt = S.normalSample(random);
        const load = LOAD_LEVELS[level].load, heat = LOAD_LEVELS[randomized ? set : level].load;
        const vib = Math.max(0.1, M.vibBase + M.vibPerLoad * strength * (load - M.loadMean) + M.vibNoise * zv);
        const temp = M.tempBase + M.tempPerLoad * strength * (heat - M.loadMean) + M.tempNoise * zt;
        rows.push({ motor, day, level, load, temp, vib });
      }
    }
    return rows;
  }

  /* 모델에서 기대하는 r(관찰 기록): 공분산 a·b·c²·Var(부하)를 두 표준편차로 나눈다. 부하 단계 안에서는 0이다. */
  function correlationTheory(strength) {
    const M = SENSOR_MODEL, varLoad = 0.06, a = M.vibPerLoad * strength, b = M.tempPerLoad * strength;
    const cov = a * b * varLoad, sv = Math.sqrt(a * a * varLoad + M.vibNoise ** 2), st = Math.sqrt(b * b * varLoad + M.tempNoise ** 2);
    return cov / (sv * st);
  }

  /* 전체 r과 부하 단계별 r. 단계에 기록이 2개 미만이면 그 단계의 r은 NaN이다. */
  function correlationSummary(rows) {
    const r = (list) => S.pearson(list.map((d) => d.temp), list.map((d) => d.vib));
    const groups = LOAD_LEVELS.map((lv, i) => { const list = rows.filter((d) => d.level === i); return { ...lv, n: list.length, r: r(list) }; });
    return { n: rows.length, r: r(rows), groups };
  }

  return { LOAD_LEVELS, SENSOR_MODEL, sensorDays, correlationTheory, correlationSummary,
    POPULATIONS, population, sampleMean, histogram, capTail, frequencies, shareWithin, bayes, wilson, intervalCovers,
    lowerTailTest, rejectionRate, familywiseError, bonferroni, exactTestSize, anyRejectionRate, logLikelihood, crossEntropy, mle, LR95, likelihoodRegion };
});
