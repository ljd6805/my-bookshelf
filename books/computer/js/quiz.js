/* 확인 문제의 보기 순서. 데이터의 정답 번호는 그대로 두고, 화면에서만 보기를 돌려 정답 자리를 target으로 옮긴다.
   order(3, 1, 0) → [1, 2, 0]: 화면 첫째 자리에 원래 1번 보기가 온다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompQuiz = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function order(n, answer, target) {
    if (!(n > 0) || answer < 0 || answer >= n) throw new RangeError('보기 수와 정답 번호를 확인하세요');
    const t = ((target % n) + n) % n;
    return Array.from({ length: n }, (_, k) => (answer - t + k + n) % n);
  }
  return { order };
});
