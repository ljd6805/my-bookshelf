const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/stats.js');
const I = require('../js/inference.js');
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);

test('seeded random numbers repeat and stay in [0, 1)', () => {
  const a = S.rng(7), b = S.rng(7);
  for (let i = 0; i < 1000; i += 1) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('mean, sample variance and median on known values', () => {
  near(S.mean([2, 4, 4, 4, 5, 5, 7, 9]), 5);
  near(S.variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7);
  assert.equal(S.variance([3]), 0);
  assert.equal(S.median([5, 1, 3]), 3);
  assert.equal(S.median([4, 1, 3, 2]), 2.5);
  assert.throws(() => S.mean([]));
});

test('one outlier moves the mean but barely moves the median', () => {
  const base = [4.8, 5.0, 5.1, 4.9, 5.2, 5.0, 4.9, 5.1, 5.0];
  const withOutlier = [...base.slice(0, 8), 30];
  assert.ok(S.mean(withOutlier) - S.mean(base) > 2.5);
  assert.ok(Math.abs(S.median(withOutlier) - S.median(base)) <= 0.1);
});

test('running proportion approaches p as flips grow (law of large numbers)', () => {
  const r = S.rng(42);
  const prop = S.runningProportion(S.flips(20000, 0.3, r));
  assert.ok(Math.abs(prop[prop.length - 1] - 0.3) < 0.015);
  assert.deepEqual(S.runningProportion([1, 0, 1, 1]), [1, 0.5, 2 / 3, 0.75]);
  assert.throws(() => S.flips(5, 1.5, r));
});

test('binomial pmf sums to one and matches hand-computed values', () => {
  near(S.binomialPmf(4, 2, 0.5), 6 / 16);
  near(S.binomialPmf(10, 0, 0.1), 0.9 ** 10);
  near(S.sum(S.binomialDistribution(50, 0.07)), 1, 1e-12);
  assert.equal(S.binomialPmf(5, 6, 0.5), 0);
  assert.equal(S.binomialPmf(5, 0, 0), 1);
  assert.equal(S.binomialPmf(5, 5, 1), 1);
  near(S.binomialUpper(20, 0, 0.2), 1, 1e-12);
  near(S.binomialLower(20, 3, 0.1) + S.binomialUpper(20, 4, 0.1), 1, 1e-12);
});

test('simulated binomial counts agree with the exact mean n*p', () => {
  const r = S.rng(3);
  const draws = Array.from({ length: 4000 }, () => S.binomialSample(20, 0.1, r));
  assert.ok(Math.abs(S.mean(draws) - 2) < 0.08);
});

test('normal pdf and cdf: symmetry and the 95% rule', () => {
  near(S.normalCdf(0, 0, 1), 0.5, 1e-7);
  near(S.normalCdf(1.96, 0, 1) - S.normalCdf(-1.96, 0, 1), 0.95, 1e-3);
  near(S.normalPdf(1, 0, 1), S.normalPdf(-1, 0, 1));
  assert.throws(() => S.normalPdf(0, 0, 0));
});

test('central limit theorem: spread of sample means shrinks like sd/sqrt(n)', () => {
  const r = S.rng(11);
  for (const name of ['uniform', 'skewed', 'dice']) {
    const pop = I.population(name);
    const means = Array.from({ length: 3000 }, () => I.sampleMean(name, 25, r));
    assert.ok(Math.abs(S.mean(means) - pop.mean) < 0.06 * pop.sd + 0.02, name);
    assert.ok(Math.abs(S.sd(means) / (pop.sd / 5) - 1) < 0.08, name);
  }
  assert.throws(() => I.sampleMean('dice', 0, r));
});

test('histogram keeps every value and clamps the edges', () => {
  const h = I.histogram([-1, 0, 0.5, 1, 9.99, 10, 25], 0, 10, 10);
  assert.equal(S.sum(h), 7);
  assert.equal(h[0], 3);
  assert.equal(h[1], 1);
  assert.equal(h[9], 3);
});

test('Bayes: rare faults make most alarms false even with a good detector', () => {
  const b = I.bayes({ prevalence: 0.01, sensitivity: 0.9, falseAlarmRate: 0.05, population: 1000 });
  near(b.tp, 9); near(b.fp, 49.5); near(b.tp + b.fn + b.fp + b.tn, 1000);
  near(b.posterior, 9 / 58.5);
  assert.equal(I.bayes({ prevalence: 0.2, sensitivity: 1, falseAlarmRate: 0, population: 100 }).posterior, 1);
  assert.equal(I.bayes({ prevalence: 0, sensitivity: 0.9, falseAlarmRate: 0, population: 100 }).posterior, 0);
  assert.throws(() => I.bayes({ prevalence: 2, sensitivity: 0.9, falseAlarmRate: 0.1 }));
});

test('Wilson interval stays in [0,1] and covers the truth about 95% of the time', () => {
  const edge = I.wilson(0, 10);
  assert.equal(edge.low, 0); assert.ok(edge.high > 0 && edge.high < 0.35);
  const full = I.wilson(10, 10);
  assert.equal(full.high, 1);
  assert.ok(I.wilson(50, 400).high - I.wilson(50, 400).low < I.wilson(5, 40).high - I.wilson(5, 40).low);
  const r = S.rng(5);
  let covered = 0;
  for (let i = 0; i < 4000; i += 1) if (I.intervalCovers(I.wilson(S.binomialSample(100, 0.12, r), 100), 0.12)) covered += 1;
  assert.ok(Math.abs(covered / 4000 - 0.95) < 0.02, String(covered / 4000));
  assert.throws(() => I.wilson(11, 10));
});

test('lower-tail test: p-values, false positive rate and power', () => {
  near(I.lowerTailTest(0, 10, 0.1), 0.9 ** 10);
  near(I.lowerTailTest(10, 10, 0.1), 1, 1e-12);
  const r = S.rng(9);
  const nullCase = I.rejectionRate(0.1, 200, 0.1, 0.05, 1500, r);
  assert.ok(nullCase.rate <= 0.06, String(nullCase.rate));
  const small = I.rejectionRate(0.05, 30, 0.1, 0.05, 800, r).rate;
  const large = I.rejectionRate(0.05, 400, 0.1, 0.05, 800, r).rate;
  assert.ok(large > 0.95 && small < 0.4, `${small} ${large}`);
});

test('likelihood peaks at k/n and cross-entropy is its scaled negative', () => {
  const k = 3, n = 10;
  near(I.mle(k, n), 0.3);
  for (const q of [0.1, 0.2, 0.25, 0.35, 0.5, 0.9]) assert.ok(I.logLikelihood(k, n, q) < I.logLikelihood(k, n, 0.3));
  near(I.crossEntropy(k, n, 0.3), -(0.3 * Math.log(0.3) + 0.7 * Math.log(0.7)));
  assert.equal(I.logLikelihood(0, 5, 0), 0);
  assert.equal(I.crossEntropy(2, 5, 0), Infinity);
  assert.equal(I.mle(0, 0), 0.5);
});

test('likelihood region: zero gap at k/n, 1.92 boundary, more data narrows it', () => {
  const at = I.likelihoodRegion(3, 60, 0.05);
  near(at.gap, 0); assert.equal(at.inside, true);
  near(I.likelihoodRegion(3, 60, 0.1).gap, 60 * (I.crossEntropy(3, 60, 0.1) - I.crossEntropy(3, 60, 0.05)));
  assert.equal(I.likelihoodRegion(3, 60, 0.1).inside, true);
  assert.equal(I.likelihoodRegion(30, 600, 0.1).inside, false);
  assert.equal(I.likelihoodRegion(5, 10, 0.5, 0).inside, true);
  assert.equal(I.likelihoodRegion(48, 60, 0.8).gap, 0);
  near(I.likelihoodRegion(0, 20, 0).gap, 0);
  assert.ok(I.likelihoodRegion(0, 20, 0.2).gap > I.LR95);
  assert.equal(I.likelihoodRegion(0, 0, 0.3).gap, 0);
});

test('capTail keeps the total and lumps the upper tail', () => {
  const pmf = S.binomialDistribution(20, 0.1);
  const capped = I.capTail(pmf, 10);
  assert.equal(capped.length, 11);
  near(capped.reduce((a, b) => a + b, 0), 1, 1e-12);
  near(capped[10], S.binomialUpper(20, 10, 0.1), 1e-12);
  assert.deepEqual(I.capTail([1, 2], 4), [1, 2, 0, 0, 0]);
});

test('frequencies divide by the total and stay zero before any count', () => {
  assert.deepEqual(I.frequencies([1, 3, 0], 4), [0.25, 0.75, 0]);
  assert.deepEqual(I.frequencies([0, 0], 0), [0, 0]);
  assert.throws(() => I.frequencies([1], -1), RangeError);
});

test('z score and the 68·95·99.7 rule (2026-10-12 보충)', () => {
  near(S.zScore(505, 500, 10, 16), 2);
  near(S.zScore(2.5, 2, 2, 25), 1.25);
  near(S.normalCoverage(1), 0.6827, 1e-4);
  near(S.normalCoverage(2), 0.9545, 1e-4);
  near(S.normalCoverage(3), 0.9973, 1e-4);
  near(S.normalCoverage(1.96), 0.95, 1e-4);
  near(S.normalCoverage(2.58), 0.99, 1e-3);
  near(S.twoSidedTail(2.5), 0.0124, 1e-4);
  near(S.twoSidedTail(0), 1, 1e-7);
  near(S.normalCoverage(-1), S.normalCoverage(1)); // 부호와 무관
  assert.throws(() => S.zScore(1, 0, 0, 4), RangeError);
  assert.throws(() => S.zScore(1, 0, 1, 0), RangeError);
});

test('share of sample means inside μ ± 1.96·σ/√n is near 95% for n = 30', () => {
  near(I.shareWithin([1, 2, 3, 4], 2.5, 1), 0.5);
  assert.equal(I.shareWithin([], 0, 1), 0);
  for (const name of ['skewed', 'uniform', 'dice']) {
    const pop = I.population(name), random = S.rng(4), means = [];
    for (let i = 0; i < 2000; i += 1) means.push(I.sampleMean(name, 30, random));
    const share = I.shareWithin(means, pop.mean, 1.96 * pop.sd / Math.sqrt(30));
    assert.ok(share > 0.93 && share < 0.97, `${name}: ${share}`);
  }
  // 균등 모집단에서 n = 1이면 모든 값이 띠 안이다(값 하나는 정규분포가 아니다).
  const r = S.rng(4), ones = Array.from({ length: 200 }, () => I.sampleMean('uniform', 1, r));
  assert.equal(I.shareWithin(ones, 5, 1.96 * I.population('uniform').sd), 1);
});

test('expected cost per motor-day for the final decision (가정값)', () => {
  const cost = (sensitivity, falseAlarmRate) => S.expectedCost({ prevalence: 0.02, sensitivity, falseAlarmRate, falseAlarmCost: 5, missCost: 500 }).total;
  near(cost(0.9, 0.1), 1.49, 1e-9);
  near(cost(0.95, 0.04), 0.696, 1e-9);
  near(cost(0.76, 0.04), 2.596, 1e-9);
  near(I.wilson(19, 20).low, 0.764, 1e-3);
  // 비용이 같아지는 감지율은 약 87%
  const breakEven = 1 - (1.49 - 0.98 * 0.04 * 5) / (0.02 * 500);
  near(breakEven, 0.8706, 1e-4);
  near(cost(breakEven, 0.04), cost(0.9, 0.1), 1e-9);
  assert.equal(S.expectedCost({ prevalence: 0, sensitivity: 0, falseAlarmRate: 0, falseAlarmCost: 5, missCost: 500 }).total, 0);
  assert.throws(() => cost(1.2, 0.1), RangeError);
});
