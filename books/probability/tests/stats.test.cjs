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
