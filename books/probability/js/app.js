/* 첫 화면·목차·참고 자료·마지막 과제를 그리고, 예측·실험 기록을 이 브라우저에만 저장한다.
   화면 구성은 AI Book(books/ai/)과 같은 틀을 따른다. */
(function () {
  'use strict';
  const B = window.ProbBook, F = window.ProbFigures, L = window.ProbLabs, U = window.ProbUI;
  const main = document.getElementById('main'), sidebar = document.getElementById('sidebar');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = Object.fromEntries(B.chapters.map((c, i) => [c.id, { ...c, index: i }]));
  let cleanup = () => {};

  /* ---- 진도 기록: 실패해도 화면은 그대로 동작한다 ---- */
  function load() {
    try { return JSON.parse(localStorage.getItem(B.storageKey)) || {}; } catch (e) { return {}; }
  }
  function save(update) {
    const state = { visited: [], tried: [], predicted: {}, ...load() };
    update(state);
    try { localStorage.setItem(B.storageKey, JSON.stringify(state)); } catch (e) { /* 저장 불가: 무시 */ }
    renderSidebar();
  }
  const has = (list, id) => (load()[list] || []).includes(id);
  const addTo = (list, id) => save((s) => { if (!s[list].includes(id)) s[list].push(id); });

  function renderSidebar() {
    const tried = load().tried || [], current = location.hash.slice(1) || 'home';
    const link = (id, num, title) => `<a href="#${id}" data-chapter="${id}"${current === id ? ' class="active" aria-current="page"' : ''}><span>${num}</span>${esc(title)}${tried.includes(id) ? '<i class="done" aria-hidden="true">✓</i><em class="sr-only"> (실험 완료)</em>' : ''}</a>`;
    sidebar.innerHTML = `<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">확률과 통계 처음으로</a>
      ${B.chapters.map((c) => link(c.id, c.num, c.title)).join('')}${link('final', '끝', '마지막 과제')}
      <p class="sidebar-legend">✓ 실험까지 해 본 장</p>`;
  }

  /* ---- 공통 조각 ---- */
  const flow = (items) => `<div class="flow">${items.map((x) => { const [a, b] = x.split('|'); return `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`; }).join('')}</div>`;
  const sourceLinks = (list) => `<ul class="source-list">${list.map(([t, u, d]) => `<li><a href="${esc(u)}"${u.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${esc(t)}</a><br><span class="caption">${esc(d)}</span></li>`).join('')}</ul>`;

  function chapterCards() {
    const cards = B.chapters.map((c) => `<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${c.num} / ${esc(c.group)}</span>${F[c.figure]()}<h3>${esc(c.title)}</h3><p>${esc(c.subtitle)}</p><span class="tag">실험 1개</span><span class="caption">약 ${esc(c.time)}</span></a>`);
    cards.push(`<a class="chapter-card final-card" href="#final"><span class="num">FINAL / 마지막 과제</span>${F.testing()}<h3>${esc(B.final.title.replace('마지막 과제 · ', ''))}</h3><p>배운 도구를 모두 써서 새 센서를 들일지 판단하고, 부족한 증거와 다음 측정을 적습니다.</p><span class="tag">질문 ${B.final.questions.length}개</span><span class="caption">약 25분</span></a>`);
    return `<div class="chapter-grid">${cards.join('')}</div>`;
  }

  function renderHome() {
    return `<section class="hero"><div><div class="eyebrow">An interactive field guide to probability</div><h1 tabindex="-1">흔들리는 숫자에서<br><em>믿을 만한 판단까지.</em></h1>
      <p class="lead">경보가 울렸다고 정말 고장일까요? 동전을 던지고, 표본을 뽑고, 기저율을 바꿔 보며 데이터 몇 개로 내린 결론이 얼마나 흔들리는지 직접 확인하세요.</p>
      <div class="hero-links"><a class="button primary" href="#chance">01장부터 읽기</a><a class="button" href="#bayes">베이즈 실험하기</a></div>
      <div class="stats"><span><b>${B.chapters.length}</b>챕터</span><span><b>${B.chapters.length}</b>인터랙티브 실험</span><span><b>0</b>외부 API 호출</span></div></div>
      <div class="hero-lab" id="home-lab"></div></section>
      <section class="section"><div class="section-heading"><h2>흔들림에서 판단까지</h2><p>몇 번의 관찰이 얼마나 흔들리는지 재고, 그 흔들림을 감안해 증거로 판단합니다. 각 단계가 아래의 챕터와 연결됩니다.</p></div>
      ${flow(['관찰|경보 몇 번, 측정값 몇 개', '흔들림|확률·이항분포·요약값', '평균의 법칙|표본분포·σ/√n', '증거|베이즈·신뢰구간·검정', '학습|우도·손실·AI'])}</section>
      <section class="section"><div class="section-heading"><h2>이 책의 사건</h2><p>모든 장이 같은 공장, 같은 센서 20대에서 출발합니다.</p></div>
      ${B.caseStory.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="note"><strong>한 장을 읽는 순서</strong><br>문제를 읽고 → 결과를 먼저 예측하고 → 실험에서 값을 하나씩 바꿔 보고 → 본 것을 설명한 뒤 → 공장 밖의 새 상황에 옮겨 봅니다. 실험 상자에는 정확한 계산인지, 난수로 흉내 낸 시뮬레이션인지 적어 두었습니다.</div></section>
      <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>개념을 읽고, 그림을 보고, 직접 실험한 뒤 확인 문제로 마무리하세요.</p></div><h2>전체 챕터</h2>${chapterCards()}</section>
      <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음부터 순서대로 읽거나, 지금 궁금한 질문에서 출발해도 좋습니다.</p></div><div class="path-grid">
      <div class="path"><h3>통계가 처음이라면</h3><p>확률과 분포, 요약값과 평균의 흔들림을 차례로 익힙니다.</p><a href="#chance">01</a><a href="#binomial">02</a><a href="#spread">03</a><a href="#clt">04</a></div>
      <div class="path"><h3>결과를 믿어도 될지 판단하려면</h3><p>경보·검사·실험 결과를 기저율, 신뢰구간, p값으로 따져 봅니다.</p><a href="#bayes">05</a><a href="#interval">06</a><a href="#testing">07</a><a href="#final">끝</a></div>
      <div class="path"><h3>AI가 왜 틀리는지 궁금하다면</h3><p>우도와 손실을 익힌 뒤 AI Book에서 학습과 과적합을 이어 봅니다.</p><a href="#chance">01</a><a href="#bayes">05</a><a href="#likelihood">08</a><a href="../ai/#learning">AI 02</a><a href="../ai/#generalization">AI 03</a></div></div></section>
      <section class="section" id="sources"><h2>읽을거리와 실험의 경계</h2><p class="lead">공개 교과서와 원 논문을 바탕으로 개념을 설명했습니다. 본문과 실험은 이 책을 위해 새로 썼습니다.</p>${sourceLinks(B.sources)}
      <div class="note">모든 실험은 브라우저 안에서 실행되고 외부로 아무것도 보내지 않습니다. 본문의 수치 예시는 실험과 같은 계산 모듈로 다시 계산해 맞췄습니다. 위 링크는 2026-10-08 독립 검수에서 모두 열리는 것을 확인했습니다. 열리지 않으면 제목으로 찾아 주세요. 계산식과 검증 방법은 <a href="docs/index.html">책 개발 문서</a>에 있습니다.</div></section>`;
  }

  function renderFinal() {
    const f = B.final, last = B.chapters[B.chapters.length - 1];
    return `<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">FINAL PROJECT / 마지막 과제</div><h1 tabindex="-1">${esc(f.title.replace('마지막 과제 · ', ''))}</h1><p class="lead">${esc(f.intro)}</p><span class="tag">질문 ${f.questions.length}개</span><span class="caption">약 25분 · 1~8장의 도구 사용</span></div>
      <section><h2>받은 자료</h2><div class="note"><ul class="data-list">${f.data.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div></section>
      ${f.questions.map((q, i) => `<section class="quiz final-q"><div class="eyebrow">QUESTION ${String(i + 1).padStart(2, '0')}</div><h2>${esc(q.q)}</h2><label for="final-${i}">내 답</label><textarea id="final-${i}" rows="3"></textarea><details><summary>예시 답과 비교하기</summary><p>${esc(q.a)}</p></details></section>`).join('')}
      <p class="caption">적은 답은 이 화면에만 있고 저장되지 않습니다. 숫자보다 "무엇을 결정하고, 어떤 증거가 부족하며, 다음에 무엇을 측정할지"가 들어갔는지 확인하세요.</p>
      <nav class="chapter-nav" aria-label="이전·다음"><a href="#${last.id}">이전 · ${esc(last.title)}</a><a href="../ai/#learning">다음 · AI Book 02 오차를 줄이는 방향으로</a></nav></div>`;
  }

  window.ProbApp = { esc, byId, load, save, has, addTo, renderSidebar, renderHome, renderFinal, sourceLinks,
    setCleanup: (f) => { cleanup = f; }, runCleanup: () => { cleanup(); cleanup = () => {}; }, main, sidebar, U, L, F, B };
})();
