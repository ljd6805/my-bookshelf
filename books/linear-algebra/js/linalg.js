/* 벡터와 행렬 계산 모듈. 화면을 그리지 않고 숫자만 다룹니다.
   벡터는 [x, y, ...] 배열, 2×2 행렬은 [[a, b], [c, d]] 배열입니다.
   모든 값은 단위가 없는 점수이며 2D 함수는 2×2 행렬만 받습니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 1e-9;

  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const scale = (k, a) => a.map((x) => k * x);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = (a) => Math.sqrt(dot(a, a));

  function cosine(a, b) {
    const n = norm(a) * norm(b);
    return n < EPS ? null : Math.max(-1, Math.min(1, dot(a, b) / n));
  }

  function angleDeg(a, b) {
    const c = cosine(a, b);
    return c === null ? null : (Math.acos(c) * 180) / Math.PI;
  }

  // dir 방향 위로 v를 투영합니다. scalar는 dir 단위 방향으로 잰 그림자 길이입니다.
  function project(v, dir) {
    const n = norm(dir);
    if (n < EPS) return null;
    const u = scale(1 / n, dir);
    const s = dot(v, u);
    return { scalar: s, vector: scale(s, u), residual: sub(v, scale(s, u)) };
  }

  const fromDeg = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const identity = () => [[1, 0], [0, 1]];
  const matVec = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];

  // A·B: B를 먼저 적용하고 A를 나중에 적용한 것과 같습니다.
  function matMul(A, B) {
    return [0, 1].map((i) => [0, 1].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j]));
  }

  const det = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];

  function inverse(M) {
    const d = det(M);
    if (Math.abs(d) < EPS) return null;
    return [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]];
  }

  // M·x = b의 해. 행렬이 공간을 납작하게 만들면 null을 돌려줍니다.
  function solve(M, b) {
    const inv = inverse(M);
    return inv ? matVec(inv, b) : null;
  }

  function rotation(deg) {
    const [c, s] = fromDeg(deg);
    return [[c, -s], [s, c]];
  }
  const scaling = (sx, sy) => [[sx, 0], [0, sy]];
  const shear = (k) => [[1, k], [0, 1]];
  const lerpMatrix = (A, B, t) => A.map((row, i) => row.map((x, j) => x + (B[i][j] - x) * t));

  // 실수 고윳값과 단위 고유벡터. 회전처럼 실수 고윳값이 없으면 빈 배열입니다.
  function eigen2(M) {
    const [[a, b], [c, d]] = M;
    const tr = a + d;
    const disc = tr * tr - 4 * det(M);
    if (disc < -EPS) return [];
    const r = Math.sqrt(Math.max(0, disc));
    const values = r < EPS ? [tr / 2] : [(tr + r) / 2, (tr - r) / 2];
    const pairs = [];
    for (const lambda of values) {
      let v;
      if (Math.abs(b) > EPS) v = [b, lambda - a];
      else if (Math.abs(c) > EPS) v = [lambda - d, c];
      else v = Math.abs(a - lambda) < EPS ? [1, 0] : [0, 1];
      pairs.push({ value: lambda, vector: scale(1 / norm(v), v) });
      if (r < EPS && Math.abs(b) < EPS && Math.abs(c) < EPS) pairs.push({ value: lambda, vector: [0, 1] });
    }
    return pairs;
  }

  function mean(points) {
    const n = points.length;
    return points.reduce((s, p) => add(s, p), points[0].map(() => 0)).map((x) => x / n);
  }

  // 공분산 행렬(n으로 나눔, 모집단 공식). 점이 하나뿐이면 0 행렬입니다.
  function covariance(points) {
    const m = mean(points);
    const C = [[0, 0], [0, 0]];
    for (const p of points) {
      const d = sub(p, m);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) C[i][j] += (d[i] * d[j]) / points.length;
    }
    return C;
  }

  // 주성분: 공분산 행렬의 가장 큰 고윳값 방향. ratio는 그 방향이 설명하는 분산 비율입니다.
  function pca(points) {
    const C = covariance(points);
    const pairs = eigen2(C).sort((p, q) => q.value - p.value);
    const total = C[0][0] + C[1][1];
    const first = pairs[0] || { value: 0, vector: [1, 0] };
    let axis = first.vector;
    if (axis[0] < 0 || (Math.abs(axis[0]) < EPS && axis[1] < 0)) axis = scale(-1, axis);
    return { mean: mean(points), axis, values: pairs.map((p) => p.value), ratio: total < EPS ? 1 : first.value / total };
  }


  // 최소제곱: 식이 미지수(2개)보다 많을 때. M은 n×2 행렬(행 = 식 하나), b는 길이 n의 기록입니다.
  // 정규방정식 MᵀM·x = Mᵀb를 풉니다. 모든 행이 같은 방향이면 MᵀM의 행렬식이 0이라 null을 돌려줍니다.
  function leastSquares(M, b) {
    const MtM = [0, 1].map((i) => [0, 1].map((j) => M.reduce((s, row) => s + row[i] * row[j], 0)));
    const Mtb = [0, 1].map((i) => M.reduce((s, row, k) => s + row[i] * b[k], 0));
    const x = solve(MtM, Mtb);
    if (!x) return { x: null, MtM, Mtb };
    const fitted = M.map((row) => dot(row, x));
    const residual = sub(b, fitted);
    const check = [0, 1].map((i) => M.reduce((s, row, k) => s + row[i] * residual[k], 0));
    return { x, MtM, Mtb, fitted, residual, sse: dot(residual, residual), check };
  }

  // 2×2 행렬의 랭크: 두 열이 만드는 범위(생성)가 평면이면 2, 한 직선이면 1, 원점 하나면 0입니다.
  // tol은 행렬식을 0으로 볼 문턱입니다(실험은 5° 간격이라 0.05를 씁니다).
  function rank2(M, tol = EPS) {
    if (M.every((row) => row.every((x) => Math.abs(x) < EPS))) return 0;
    return Math.abs(det(M)) < tol ? 1 : 2;
  }
  const transpose = (M) => [[M[0][0], M[1][0]], [M[0][1], M[1][1]]];

  const relu = (v) => v.map((x) => Math.max(0, x));
  const layer = (W, b, x) => add(W.map((row) => dot(row, x)), b);

  return { EPS, add, sub, scale, dot, norm, cosine, angleDeg, project, fromDeg, identity, matVec, matMul,
    det, rank2, transpose, inverse, solve, leastSquares, rotation, scaling, shear, lerpMatrix, eigen2, mean, covariance, pca, relu, layer };
});
