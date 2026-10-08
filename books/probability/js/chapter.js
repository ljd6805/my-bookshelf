/* 한 장의 화면과 라우터. AI Book과 같은 순서로 그린다:
   장 머리 → 질문 → 개념(그림·식) → 예측 → 실험(안내·조작·결과·직접 해 보기) → 설명·전이 → 확인 문제 → 더 읽기 → 이전·다음. */
(function () {
  'use strict';
  const A = window.ProbApp, { esc, B, F, L, main } = A, G = window.ProbGuides;
  const pad = (n) => String(n).padStart(2, '0');

  function predictBlock(ch) {
    const saved = (A.load().predicted || {})[ch.id];
    return `<section class="quiz predict"><div class="eyebrow">PREDICT FIRST · 실험 전에 골라 보기</div><h2>${esc(ch.predict.q)}</h2>
      ${ch.predict.options.map((o, i) => `<button type="button" data-predict="${i}" aria-pressed="${saved === i}">${i + 1}. ${esc(o)}</button>`).join('')}
      <div class="quiz-feedback" role="status" aria-live="polite">${saved === undefined ? '' : '예측을 기록했습니다. 실험한 뒤 아래에서 확인하세요.'}</div>
      <details><summary>예측 확인 (실험 후에 펼치기)</summary><p><strong>답: ${esc(ch.predict.options[ch.predict.answer])}</strong> ${esc(ch.predict.why)}</p></details></section>`;
  }

  function labBlock(ch) {
    const lab = L[ch.lab], g = G[ch.lab];
    return `<article class="lab" id="lab-${ch.lab}"><div class="lab-heading"><span>EXPERIMENT ${ch.num}</span><h3>${esc(lab.title)}</h3></div>
      <p class="lab-desc">${esc(lab.kind)} · ${esc(lab.units)}</p>
      <div class="lab-guide"><p><b>무엇을 확인하나요?</b> ${esc(g.purpose)}</p><p class="guide-reading"><b>결과 읽기</b> ${esc(g.reading)}</p></div>
      <div class="lab-inner" data-lab="${ch.lab}"></div><div class="challenge"><b>직접 해 보기</b>${esc(g.challenge)}</div></article>
      <div class="note"><strong>실험의 가정</strong><br>${esc(lab.assumptions)}</div>`;
  }

  function nav(ch) {
    const prev = B.chapters[ch.index - 1], next = B.chapters[ch.index + 1];
    return `<nav class="chapter-nav" aria-label="이전·다음 챕터">${prev ? `<a href="#${prev.id}">이전 · ${esc(prev.title)}</a>` : '<a href="#home">책 처음으로</a>'}${next ? `<a href="#${next.id}">다음 · ${esc(next.title)}</a>` : '<a href="#final">다음 · 마지막 과제</a>'}</nav>`;
  }

  function recordLine(ch) {
    const s = A.load(), item = (ok, label) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '·'} ${label}</li>`;
    return `<ul class="record" aria-label="이 장의 기록">${item((s.visited || []).includes(ch.id), '읽음')}${item((s.predicted || {})[ch.id] !== undefined, '예측함')}${item((s.tried || []).includes(ch.id), '실험을 조작함')}</ul>`;
  }

  function renderChapter(ch) {
    const n = ch.index + 1;
    const deeper = ch.deeper.map((d) => [d.label, d.href, d.why]);
    return `<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${ch.num} / ${esc(ch.group)}</div><h1 tabindex="-1">${esc(ch.title)}</h1><p class="lead">${esc(ch.subtitle)}</p><span class="tag">1개 실험</span><span class="caption">약 ${esc(ch.time)} · 예측 1개 · 확인 문제 1개</span></div>
      <section><h2>이번 장의 질문</h2><p class="muted">${esc(ch.prev)}</p><p>${esc(ch.problem)}</p></section>
      <section><h2>먼저 개념 잡기</h2>${ch.body.map((p) => `<p>${esc(p)}</p>`).join('')}
      <figure class="concept-diagram"><div class="figure-frame">${F[ch.figure]()}</div><figcaption class="caption">그림 ${n}-1. ${esc(ch.figureCaption)}</figcaption></figure>
      <div class="formula"><code>${esc(ch.formula.expr)}</code><p>${esc(ch.formula.read)}</p></div><p class="example"><b>숫자로 보기</b> ${esc(ch.example)}</p></section>
      ${predictBlock(ch)}${labBlock(ch)}
      <section><h2>실험에서 본 것</h2><p>${esc(ch.explain)}</p></section>
      <section><h2>새 상황에 옮기기</h2><p>${esc(ch.transfer.q)}</p><details><summary>생각을 정리한 뒤 펼치기</summary><p>${esc(ch.transfer.a)}</p></details></section>
      <section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${esc(ch.check.q)}</h2><details><summary>답 보기</summary><p>${esc(ch.check.a)}</p></details></section>
      <section><h2>더 읽어 보기</h2>${A.sourceLinks(deeper)}<p class="caption">개념의 출처는 <a href="#sources">참고 자료</a>에 모아 두었습니다.</p></section>
      <section><h2>아직 풀지 못한 질문</h2><p>${esc(ch.remaining)}</p><p class="muted"><b>다음 장으로 가는 이유</b> ${esc(ch.nextWhy)}</p></section>
      ${recordLine(ch)}${nav(ch)}</div>`;
  }

  /* 실험이 그린 조작부와 그림을 AI Book처럼 두 칸(조작 | 그림)으로 나눈다. 결과 문장은 아래에 둔다. */
  function arrangeColumns(inner) {
    const controls = inner.querySelector(':scope > .controls'), readout = inner.querySelector(':scope > .readout');
    if (!controls) return;
    const view = U_h('div', 'lab-view'), cols = U_h('div', 'lab-columns');
    let node = controls.nextElementSibling;
    while (node && node !== readout) { const next = node.nextElementSibling; view.append(node); node = next; }
    cols.append(controls, view);
    inner.prepend(cols);
  }
  function U_h(tag, cls) { const el = document.createElement(tag); el.className = cls; return el; }

  function wireChapter(ch) {
    main.querySelectorAll('[data-predict]').forEach((b) => b.addEventListener('click', () => {
      A.save((s) => { s.predicted[ch.id] = Number(b.dataset.predict); });
      main.querySelectorAll('[data-predict]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      main.querySelector('.predict .quiz-feedback').textContent = '예측을 기록했습니다. 실험한 뒤 아래에서 확인하세요.';
      main.querySelector('.record').outerHTML = recordLine(ch);
    }));
    const inner = main.querySelector('.lab-inner');
    let cleanup = () => {};
    try { cleanup = L[ch.lab].mount(inner) || cleanup; arrangeColumns(inner); } catch (e) {
      inner.innerHTML = `<p class="error" role="alert">실험을 불러오지 못했습니다: ${esc(e.message)}. 새로고침하거나 다른 브라우저에서 열어 보세요.</p>`;
    }
    const markTried = () => { if (!A.has('tried', ch.id)) { A.addTo('tried', ch.id); main.querySelector('.record').outerHTML = recordLine(ch); } };
    inner.addEventListener('input', markTried);
    inner.addEventListener('click', (e) => { if (e.target.closest('button')) markTried(); });
    return cleanup;
  }

  function route() {
    A.runCleanup();
    const id = decodeURIComponent(location.hash.slice(1)) || 'home', ch = A.byId[id];
    document.body.classList.toggle('reading', Boolean(ch) || id === 'final');
    if (ch) {
      main.innerHTML = renderChapter(ch);
      A.addTo('visited', ch.id);
      A.setCleanup(wireChapter(ch));
      document.title = `${pad(ch.index + 1)}. ${ch.title} · 확률과 통계`;
    } else if (id === 'final') {
      main.innerHTML = A.renderFinal();
      document.title = '마지막 과제 · 확률과 통계';
    } else {
      main.innerHTML = A.renderHome();
      A.setCleanup(window.ProbHomeLab.mount(document.getElementById('home-lab')));
      document.title = '확률과 통계 · 경보가 울렸다, 정말 고장일까';
    }
    A.renderSidebar();
    document.body.classList.remove('menu-open');
    document.getElementById('menu').setAttribute('aria-expanded', 'false');
    if (id === 'chapters' || id === 'sources') { document.getElementById(id).scrollIntoView(); return; }
    window.scrollTo(0, 0);
    const h1 = main.querySelector('h1');
    if (h1 && location.hash) h1.focus({ preventScroll: true });
  }

  function setupChrome() {
    const theme = document.getElementById('theme'), key = B.storageKey.replace(':progress', ':theme');
    const apply = (t) => { document.documentElement.dataset.theme = t; theme.textContent = t === 'dark' ? '밝은 화면' : '어두운 화면'; theme.setAttribute('aria-label', `${theme.textContent}으로 전환`); };
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) { saved = null; }
    apply(saved === 'light' ? 'light' : 'dark');
    theme.addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; apply(t); try { localStorage.setItem(key, t); } catch (e) { /* 무시 */ } });
    const menu = document.getElementById('menu');
    menu.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); menu.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); } });
  }

  setupChrome();
  window.addEventListener('hashchange', route);
  route();
})();
