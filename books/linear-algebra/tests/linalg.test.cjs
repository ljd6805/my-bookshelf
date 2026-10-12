const { test } = require('node:test');
const assert = require('node:assert/strict');
const LA = require('../js/linalg.js');
const S = require('../js/songs.js');
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const nearVec = (a, b, tol = 1e-9) => a.forEach((x, i) => near(x, b[i], tol));

test('dot, norm and cosine on representative and boundary values', () => {
  near(LA.dot([1, 2], [1.5, 3]), 7.5);
  near(LA.cosine([1, 2], [1.5, 3]), 1); // 같은 방향
  near(LA.cosine([1, 2], [-1, 0.5]), 0); // 직각
  near(LA.cosine([3, 2.5], [-3, -2.5]), -1); // 정반대
  assert.equal(LA.cosine([1, 2], [0, 0]), null); // 길이 0은 방향 없음
  near(LA.angleDeg([1, 0], [0, 1]), 90);
  near(LA.cosine([1, 2, -2], [1.5, 3, 2]), 3.5 / (3 * Math.sqrt(15.25))); // 3차원
});

test('projection splits a vector into perpendicular parts that add back up', () => {
  const s = [3, 2.5], d = [1, 2];
  const p = LA.project(s, d);
  near(p.scalar, 8 / Math.sqrt(5));
  near(LA.dot(p.residual, d), 0);
  nearVec(LA.add(p.vector, p.residual), s);
  assert.equal(LA.project(s, [0, 0]), null);
});

test('matrix product order matters and determinant multiplies', () => {
  const R = LA.rotation(90), W = LA.scaling(2, 1);
  nearVec(LA.matMul(W, R).flat(), [0, -2, 1, 0]);
  nearVec(LA.matMul(R, W).flat(), [0, -1, 2, 0]);
  const A = [[2, 1], [1, 1.5]], B = LA.shear(0.7);
  near(LA.det(LA.matMul(A, B)), LA.det(A) * LA.det(B));
  near(LA.det(R), 1);
  near(LA.det(LA.scaling(1, -1)), -1);
  near(LA.det([[1, 0.5], [2, 1]]), 0);
});

test('inverse and solve recover the original song and refuse flat matrices', () => {
  const M = [[2, 1], [1, 1.5]];
  nearVec(LA.solve(M, [5.5, 4.25]), [2, 1.5]);
  nearVec(LA.matMul(LA.inverse(M), M).flat(), [1, 0, 0, 1]);
  assert.equal(LA.inverse([[2, 1], [1, 0.5]]), null);
  assert.equal(LA.solve([[1, 0.5], [2, 1]], [1, 2]), null);
});

test('eigen pairs satisfy M·v = λ·v; rotation has none; shear has one', () => {
  for (const M of [[[2, 1], [1, 2]], [[2, 0], [0, 0.5]], [[3, 1], [0, 2]]]) {
    const pairs = LA.eigen2(M);
    assert.ok(pairs.length >= 1);
    for (const { value, vector } of pairs) nearVec(LA.matVec(M, vector), LA.scale(value, vector), 1e-9);
  }
  assert.deepEqual(LA.eigen2(LA.rotation(45)), []);
  assert.equal(LA.eigen2(LA.shear(1)).length, 1);
  assert.equal(LA.eigen2([[2, 0], [0, 2]]).length, 2);
});

test('PCA of the eight songs: 42° axis explains about 94% of variance', () => {
  const pts = S.songs.map((s) => s.v);
  const C = LA.covariance(pts);
  near(C[0][1], C[1][0]); // 대칭
  near(C[0][0], 4.33984375);
  const pc = LA.pca(pts);
  near((Math.atan2(pc.axis[1], pc.axis[0]) * 180) / Math.PI, 42.08, 0.01);
  near(pc.ratio, 0.9434, 1e-4);
  near(LA.norm(pc.axis), 1);
  near(LA.pca([[1, 1], [1, 1]]).ratio, 1); // 퍼짐이 없으면 비율 1로 처리
});

test('layer with ReLU folds the four songs below the taste line to zero', () => {
  const W = [[0.45, 0.89], [0.89, -0.45]];
  const zeros = S.songs.filter((s) => LA.relu(LA.layer(W, [0, 0], s.v))[0] === 0).map((s) => s.id).sort();
  assert.deepEqual(zeros, ['dawn', 'jazz', 'lullaby', 'rain']);
  nearVec(LA.layer(W, [-2, 0], [3, 2.5]), [1.575, 1.545]);
});

test('song data stay inside the stated −3…3 range', () => {
  for (const s of S.songs) for (const x of [...s.v, S.lyrics[s.id]]) assert.ok(x >= -3 && x <= 3, s.id);
  assert.equal(S.songs.length, 8);
});

test('least squares: exact records give zero residual, a wrong record leaves a residual orthogonal to the columns', () => {
  const M = [[2, 1], [1, 1.5], [1, -1]];
  const exact = LA.leastSquares(M, [5.5, 4.25, 0.5]);
  nearVec(exact.x, [2, 1.5]);
  near(exact.sse, 0);
  nearVec(LA.leastSquares(M, [5.5, 4.25, 1.5]).x, [181 / 77, 163 / 154]); // (2.351, 1.058)
  const r = LA.leastSquares(M, [5.5, 4.25, 1.5]);
  near(LA.det(r.MtM), 19.25);
  nearVec(r.check, [0, 0], 1e-12); // Mᵀr = 0: 잔차는 M의 두 열과 직각
  near(r.sse, 0.2077922077922078, 1e-12);
  // 세 행이 같은 방향이면 MᵀM의 행렬식이 0이라 답을 하나로 정할 수 없습니다.
  assert.equal(LA.leastSquares([[2, 1], [4, 2], [1, 0.5]], [5.5, 4.25, 1.5]).x, null);
  // 식이 둘뿐이면 최소제곱 답은 역행렬로 푼 답과 같습니다.
  nearVec(LA.leastSquares([[2, 1], [1, 1.5]], [5.5, 4.25]).x, LA.solve([[2, 1], [1, 1.5]], [5.5, 4.25]));
});

test('rank of 2×2: plane 2, line 1, origin 0; rotation is orthogonal', () => {
  assert.equal(LA.rank2([[1.5, -0.75], [1.5, 1.3]]), 2);
  assert.equal(LA.rank2([[1, 2], [2, 4]]), 1);
  assert.equal(LA.rank2([[1, 0.5], [2, 1]]), 1);
  assert.equal(LA.rank2([[0, 0], [0, 0]]), 0);
  const c2 = LA.scale(1.5, LA.fromDeg(45));
  assert.equal(LA.rank2([[1.5, c2[0]], [1.5, c2[1]]], 0.05), 1);
  for (const deg of [30, 90, 135, -60]) {
    const R = LA.rotation(deg), RtR = LA.matMul(LA.transpose(R), R);
    near(RtR[0][0], 1); near(RtR[0][1], 0); near(RtR[1][0], 0); near(RtR[1][1], 1);
    near(LA.det(R), 1);
    const inv = LA.inverse(R), Rt = LA.transpose(R);
    [0, 1].forEach((i) => [0, 1].forEach((j) => near(inv[i][j], Rt[i][j])));
  }
  const s = LA.matVec(LA.rotation(30), [1, 2]);
  near(s[0], -0.1340, 1e-4); near(s[1], 2.2321, 1e-4); near(LA.norm(s), Math.sqrt(5));
  const back = LA.matVec(LA.transpose(LA.rotation(30)), s);
  near(back[0], 1); near(back[1], 2);
  near(LA.det(LA.scaling(1, -1)), -1);
});
