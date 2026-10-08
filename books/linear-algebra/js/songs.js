/* 이 책의 공통 사례: 가상의 노래 여덟 곡.
   두 특징은 모두 -3(아주 낮음)에서 3(아주 높음) 사이의 점수이며 0이 보통입니다.
   x = 빠르기, y = 에너지. 실제 음원 데이터가 아니라 설명을 위해 정한 값입니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SONGS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const songs = [
    { id: 'dawn', name: '새벽 산책', v: [-1.5, -1] },
    { id: 'rain', name: '비 오는 창가', v: [-2.5, -2] },
    { id: 'festival', name: '여름 축제', v: [3, 2.5] },
    { id: 'run', name: '아침 달리기', v: [2, 1.5] },
    { id: 'jazz', name: '골목 재즈', v: [-1, 0.5] },
    { id: 'subway', name: '출근 지하철', v: [1, -0.5] },
    { id: 'rock', name: '옥상 록 공연', v: [1.5, 3] },
    { id: 'lullaby', name: '자장가', v: [-3, -2.5] }
  ];
  // 독자 '나'의 취향: 빠른 노래를 조금, 힘 있는 노래를 더 좋아합니다.
  const me = [1, 2];
  const features = ['빠르기', '에너지'];
  // 마지막 과제에서 새로 생기는 셋째 특징: 가사 비중(-3 연주 위주 ~ 3 가사 위주).
  const lyrics = { dawn: 1, rain: 2.5, festival: -1, run: -2, jazz: -2.5, subway: 0.5, rock: 2, lullaby: 1.5 };
  return { songs, me, features, lyrics };
});
