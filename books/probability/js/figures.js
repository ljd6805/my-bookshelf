/* 장마다 핵심 개념을 보여 주는 설명용 그림. 실제 계산이 아니라 개념 도식이며,
   움직임은 CSS 애니메이션으로만 주고 동작 줄이기 설정에서는 멈춘다. */
(function () {
  'use strict';
  const wrap = (title, body) => `<svg viewBox="0 0 480 200" role="img" aria-label="${title}" class="figure-svg"><title>${title}</title>${body}</svg>`;
  const bars = (heights, x0, base, w, cls) => heights.map((h, i) =>
    `<rect class="${cls}" style="--i:${i}" x="${x0 + i * w}" y="${base - h}" width="${w - 3}" height="${h}"/>`).join('');

  const figures = {
    chance() {
      const pts = [0.9, 0.2, 0.75, 0.35, 0.62, 0.42, 0.58, 0.46, 0.55, 0.48, 0.53, 0.49, 0.51, 0.5, 0.505, 0.5];
      const d = pts.map((v, i) => `${i ? 'L' : 'M'}${150 + i * 20},${170 - v * 140}`).join('');
      return wrap('동전 던지기 횟수가 늘수록 앞면 비율이 0.5로 모이는 그림',
        `<g transform="translate(70 100)"><g class="spin-coin"><ellipse class="coin-face" rx="38" ry="38"/><text class="fig-big" text-anchor="middle" y="9">앞</text></g></g>
        <rect class="fig-band" x="150" y="${170 - 0.55 * 140}" width="310" height="14"/>
        <line class="fig-target" x1="150" x2="460" y1="100" y2="100"/><text class="fig-note" x="462" y="95" text-anchor="end">p = 0.5</text>
        <path class="fig-line draw" d="${d}"/><text class="fig-note" x="150" y="194">적게 던짐 → 크게 출렁임</text><text class="fig-note" x="460" y="194" text-anchor="end">많이 던짐 → 띠 안</text>`);
    },
    binomial() {
      let sensors = '';
      for (let i = 0; i < 20; i += 1) sensors += `<circle class="${i === 4 || i === 13 ? 'sensor lit' : 'sensor'}" cx="${24 + (i % 5) * 28}" cy="${40 + Math.floor(i / 5) * 30}" r="9"/>`;
      return wrap('센서 20대 중 몇 대가 울리는지 세어 이항분포 막대로 모으는 그림',
        `${sensors}<text class="fig-note" x="80" y="182" text-anchor="middle">센서 20대 · 각각 10%</text>
        <path class="fig-arrow" d="M170 100 h50 m-10 -8 l10 8 l-10 8"/><text class="fig-note" x="195" y="88" text-anchor="middle">하루마다 세기</text>
        ${bars([30, 66, 78, 52, 25, 9, 3, 1], 240, 170, 28, 'fig-bar grow')}
        <text class="fig-note" x="240" y="190">0</text><text class="fig-note" x="296" y="190">2</text><text class="fig-note" x="380" y="190">5</text>
        <text class="fig-note" x="352" y="40">평균 n·p = 2</text>`);
    },
    spread() {
      const xs = [190, 200, 205, 195, 210, 200, 195, 205];
      return wrap('점 하나가 멀리 이동하면 평균은 따라가고 중앙값은 그대로인 그림',
        `<line class="fig-axis" x1="30" x2="460" y1="120" y2="120"/>
        ${xs.map((x, i) => `<circle class="fig-dot" cx="${x}" cy="${108 - (i % 3) * 10}" r="7"/>`).join('')}
        <circle class="fig-dot hot slide-out" cx="200" cy="80" r="8"/>
        <path class="fig-mean slide-mean" d="M200 132 l-9 16 h18 z"/><text class="fig-note slide-mean" x="200" y="168" text-anchor="middle">평균</text>
        <path class="fig-median" d="M200 50 l8 8 l-8 8 l-8 -8 z"/><text class="fig-note" x="200" y="42" text-anchor="middle">중앙값</text>
        <text class="fig-note" x="440" y="70" text-anchor="end">측정 실수</text>`);
    },
    clt() {
      return wrap('치우친 모집단에서 뽑은 평균들이 종 모양으로 모이는 그림',
        `${bars([90, 66, 48, 34, 24, 17, 12, 8, 5, 3], 20, 160, 16, 'fig-bar')}
        <text class="fig-note" x="100" y="184" text-anchor="middle">모집단: 한쪽으로 치우침</text>
        <path class="fig-arrow" d="M200 100 h60 m-10 -8 l10 8 l-10 8"/><text class="fig-note" x="230" y="86" text-anchor="middle">n개씩 평균</text>
        ${bars([4, 12, 30, 58, 84, 92, 76, 48, 24, 10, 4], 280, 160, 16, 'fig-bar alt grow')}
        <text class="fig-note" x="368" y="184" text-anchor="middle">평균들: 좁은 종 모양</text>`);
    },
    bayes() {
      const box = (x, y, w, label, n, cls) => `<g class="pop-in ${cls || ''}" style="--i:${Math.round(x / 120)}"><rect class="fig-box" x="${x}" y="${y}" width="${w}" height="34" rx="6"/><text class="fig-note strong" x="${x + w / 2}" y="${y + 15}" text-anchor="middle">${label}</text><text class="fig-note" x="${x + w / 2}" y="${y + 29}" text-anchor="middle">${n}</text></g>`;
      return wrap('모터 1,000대를 고장과 정상으로 나누고 다시 경보 여부로 나누는 나무 그림',
        `${box(10, 83, 80, '모터', '1,000대')}
        <path class="fig-link" d="M90 100 L130 50 M90 100 L130 150"/>
        ${box(130, 33, 90, '고장 1%', '10대')}${box(130, 133, 90, '정상 99%', '990대')}
        <path class="fig-link" d="M220 50 L260 22 M220 50 L260 72 M220 150 L260 122 M220 150 L260 172"/>
        ${box(260, 5, 100, '울림 90%', '9대', 'good')}${box(260, 57, 100, '놓침', '1대')}
        ${box(260, 105, 100, '울림 5%', '약 50대', 'warn')}${box(260, 155, 100, '조용', '940대')}
        <text class="fig-note strong" x="420" y="90" text-anchor="middle">경보 59건 중</text><text class="fig-big" x="420" y="120" text-anchor="middle">9건</text><text class="fig-note" x="420" y="140" text-anchor="middle">≈ 15%</text>`);
    },
    interval() {
      const rows = [[150, 300], [180, 330], [120, 260], [200, 360], [160, 290], [270, 420], [140, 280], [170, 310], [130, 270], [190, 340]];
      return wrap('표본마다 다른 신뢰구간 열 개 중 아홉 개는 진짜 값을 지나고 하나는 빗나가는 그림',
        `<line class="fig-target" x1="240" x2="240" y1="8" y2="186"/><text class="fig-note" x="246" y="18">진짜 비율</text>
        ${rows.map(([a, b], i) => `<g class="drop-in" style="--i:${i}"><line class="${a > 240 || b < 240 ? 'fig-ci miss' : 'fig-ci'}" x1="${a}" x2="${b}" y1="${26 + i * 16}" y2="${26 + i * 16}"/>${a > 240 ? `<text class="fig-note strong" x="${b + 8}" y="${30 + i * 16}">✕ 빗나감</text>` : ''}</g>`).join('')}`);
    },
    testing() {
      const hs = [6, 22, 48, 72, 82, 74, 56, 36, 20, 10, 4];
      return wrap('오경보율 10%를 가정한 분포에서 관찰값 이하의 왼쪽 꼬리를 p값으로 읽는 그림',
        `${hs.map((h, i) => `<rect class="${i <= 3 ? 'fig-bar hot' : 'fig-bar'}" x="${60 + i * 34}" y="${160 - h}" width="30" height="${h}"/>`).join('')}
        <line class="fig-target" x1="${60 + 4 * 34 - 2}" x2="${60 + 4 * 34 - 2}" y1="20" y2="164"/><text class="fig-note strong" x="${60 + 4 * 34 + 2}" y="30">관찰값</text>
        <text class="fig-note" x="40" y="60">p값 = 빗금 넓이</text><path class="fig-arrow" d="M70 66 q20 30 40 50"/>
        <text class="fig-note" x="240" y="188" text-anchor="middle">"변화 없음"이 맞을 때의 오경보 일수</text>`);
    },
    likelihood() {
      let up = '', down = '';
      for (let i = 0; i <= 60; i += 1) {
        const q = 0.005 + i * 0.008, ll = 3 * Math.log(q) + 57 * Math.log(1 - q), v = Math.exp(ll - (3 * Math.log(0.05) + 57 * Math.log(0.95)));
        up += `${i ? 'L' : 'M'}${40 + i * 6.5},${86 - v * 66}`;
        down += `${i ? 'L' : 'M'}${40 + i * 6.5},${Math.min(190, 114 + (1 - v) * 66)}`;
      }
      return wrap('우도 곡선의 산꼭대기와 손실 곡선의 골짜기가 같은 q에 있는 그림',
        `<path class="fig-line" d="${up}"/><text class="fig-note" x="440" y="40" text-anchor="end">우도: 클수록 잘 설명</text>
        <line class="fig-axis" x1="40" x2="440" y1="100" y2="100"/>
        <path class="fig-line alt" d="${down}"/><text class="fig-note" x="440" y="180" text-anchor="end">손실: 작을수록 잘 맞음</text>
        <line class="fig-target" x1="${40 + ((0.05 - 0.005) / 0.008) * 6.5}" x2="${40 + ((0.05 - 0.005) / 0.008) * 6.5}" y1="14" y2="186"/>
        <circle class="fig-dot hot roll" cx="${40 + ((0.05 - 0.005) / 0.008) * 6.5}" cy="180" r="7"/>
        <text class="fig-note strong" x="${46 + ((0.05 - 0.005) / 0.008) * 6.5}" y="112">q = k/n = 0.05</text>`);
    }
  };

  window.ProbFigures = figures;
})();
