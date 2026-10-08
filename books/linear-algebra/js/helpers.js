/* 화면 조각 도우미: 흐름 상자, 참고 자료 목록, 목차 카드 그림, 사이드바. */
(() => {
  'use strict';
  const B = LABook, V = LAViews, main = document.querySelector('main');
  const pad = (n) => String(n).padStart(2, '0');
  const LAST = B.chapters.length - 1;

  function flow(items) {
    return `<div class="flow">${items.map((x) => { const [a, b] = x.split('|'); return `<div><b>${a}</b><span>${b}</span></div>`; }).join('')}</div>`;
  }
  function sourceLinks(ids) {
    return `<ul class="source-list">${ids.map((i) => `<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;
  }

  // 목차 카드의 작은 그림. 장마다 핵심 장면 하나를 단순한 선으로 보여 줍니다(장식, 스크린 리더에서는 숨김).
  function thumbnail(i) {
    const ar = (x1, y1, x2, y2, c = 'var(--accent)') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3.5" fill="${c}"/>`;
    const dot = (x, y, c = 'var(--orange)') => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`;
    const grid = (t = '') => Array.from({ length: 7 }, (_, k) => `<path d="M${90 + k * 20} 5V95M90 ${5 + k * 15}H210" stroke="var(--line)" stroke-width=".7" transform="${t}"/>`).join('');
    const scenes = [
      () => ar(150, 80, 110, 50, 'var(--blue)') + ar(150, 80, 220, 35) + ar(150, 80, 165, 42, 'var(--violet)'),
      () => ar(150, 85, 175, 25, 'var(--coral)') + ar(150, 85, 190, 20) + ar(150, 85, 95, 60, 'var(--blue)'),
      () => `<path d="M60 90L240 20" stroke="var(--coral)" stroke-dasharray="6 5" stroke-width="2"/>` + [[100, 30], [175, 85], [140, 50]].map(([x, y]) => {
        const t = ((x - 60) * 180 + (y - 90) * -70) / (180 * 180 + 70 * 70), fx = 60 + 180 * t, fy = 90 - 70 * t;
        return `<path d="M${x} ${y}L${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="var(--muted)" stroke-dasharray="3 3"/>` + dot(x, y) + dot(fx, fy, 'var(--violet)');
      }).join(''),
      () => grid('skewX(-20) translate(30 0)') + ar(150, 50, 185, 50, 'var(--blue)') + ar(150, 50, 132, 20),
      () => `<path d="M60 70l20-40 20 15z" fill="none" stroke="var(--line)" stroke-width="2"/><path d="M130 50h20" stroke="var(--muted)"/><path d="M170 70l40-20-15-20z" fill="color-mix(in srgb,var(--blue) 30%,transparent)" stroke="var(--blue)" stroke-width="2"/>`,
      () => `<rect x="110" y="30" width="40" height="40" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/><path d="M150 80l50-20 30-40-50 20z" fill="color-mix(in srgb,var(--accent) 25%,transparent)" stroke="var(--accent)" stroke-width="2"/>`,
      () => `<path d="M70 85L230 25" stroke="var(--coral)" stroke-dasharray="6 5" stroke-width="2"/><path d="M70 30L230 75" stroke="var(--violet)" stroke-width="2"/>` + dot(152, 53, 'var(--violet)'),
      () => `<circle cx="150" cy="50" r="34" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/><ellipse cx="150" cy="50" rx="68" ry="28" transform="rotate(-25 150 50)" fill="none" stroke="var(--accent)" stroke-dasharray="5 4"/><path d="M80 82L220 18" stroke="var(--violet)" stroke-width="2"/>`,
      () => [[95, 75], [120, 62], [140, 58], [160, 44], [185, 35], [205, 22], [130, 45], [170, 60]].map(([x, y]) => dot(x, y)).join('') + `<path d="M75 85L225 15" stroke="var(--violet)" stroke-width="2"/>`,
      () => `<path d="M60 80H140L240 20" stroke="var(--accent)" stroke-width="3" fill="none"/><path d="M60 80H240" stroke="var(--line)"/>`,
      () => `<path d="M150 80V20M150 80L95 95M150 80L215 95" stroke="var(--line)" stroke-width="1.4"/>` + ar(150, 80, 190, 40, 'var(--coral)') + ar(150, 80, 120, 35) + dot(205, 30)
    ];
    return `<svg viewBox="0 0 300 100" aria-hidden="true">${(scenes[i] || scenes[0])()}</svg>`;
  }

  function side() {
    const read = UI.readState();
    document.querySelector('#sidebar').innerHTML = '<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">벡터와 행렬 처음으로</a>' +
      B.chapters.map((c, i) => `<a href="#${c.id}" data-chapter="${c.id}" class="${read[c.id] ? 'visited' : ''}"><span>${pad(i + 1)}</span>${c.title}${read[c.id] ? '<em class="read-mark">읽음</em>' : ''}</a>`).join('');
  }

  window.LAApp = { flow, sourceLinks, thumbnail, side, pad, LAST, main };
})();
