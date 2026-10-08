/* 한 장의 화면: 문제 → 그림 → 본문 → 예측 → 실험 → 설명 → 전이 → 이해 확인 → 다음 장. 그리고 라우터. */
(function () {
  'use strict';
  const A = window.ProbApp, { esc, B, F, L, U, main } = A;

  function predictBlock(ch) {
    const saved = (A.load().predicted || {})[ch.id];
    return `<section class="box predict" aria-labelledby="pr-${ch.id}"><h2 id="pr-${ch.id}"><span class="step">예측</span> 실험 전에 골라 보세요</h2>
      <fieldset><legend>${esc(ch.predict.q)}</legend>${ch.predict.options.map((o, i) => `<label><input type="radio" name="predict-${ch.id}" value="${i}" ${saved === i ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</fieldset>
      <p class="predict-status" aria-live="polite">${saved === undefined ? '' : '예측을 기록했습니다. 실험한 뒤 아래에서 확인하세요.'}</p>
      <details><summary>예측 확인 (실험 후에 펼치기)</summary><p><strong>답: ${esc(ch.predict.options[ch.predict.answer])}</strong> ${esc(ch.predict.why)}</p></details></section>`;
  }

  function labBlock(ch) {
    const lab = L[ch.lab];
    return `<section class="box lab" id="lab-${ch.lab}" aria-labelledby="lab-title-${ch.lab}"><h2 id="lab-title-${ch.lab}"><span class="step">조작 · 관찰</span> 오늘 꼭 해 볼 실험: ${esc(lab.title)}</h2>
      <dl class="lab-meta"><div><dt>종류</dt><dd>${esc(lab.kind)}</dd></div><div><dt>입력 범위</dt><dd>${esc(lab.units)}</dd></div><div><dt>가정</dt><dd>${esc(lab.assumptions)}</dd></div></dl>
      <div class="lab-body"></div></section>`;
  }

  function linksBlock(ch) {
    if (!ch.deeper.length) return '';
    return `<section class="box deeper" aria-labelledby="dp-${ch.id}"><h2 id="dp-${ch.id}">더 깊이 보기 · 다른 책으로</h2><ul>${ch.deeper.map((d) => `<li><a href="${esc(d.href)}">${esc(d.label)}</a><p>${esc(d.why)}</p></li>`).join('')}</ul></section>`;
  }

  function pager(ch) {
    const prev = B.chapters[ch.index - 1], next = B.chapters[ch.index + 1];
    const nextLink = next ? `<a class="next" href="#${next.id}"><small>다음 장 · 왜 가야 할까</small>${next.num} ${esc(next.title)}<span>${esc(ch.nextWhy)}</span></a>`
      : `<a class="next" href="#final"><small>마지막 과제 · 왜 가야 할까</small>${esc(B.final.title)}<span>${esc(ch.nextWhy)}</span></a>`;
    return `<nav class="pager" aria-label="장 이동">${prev ? `<a href="#${prev.id}"><small>이전 장</small>${prev.num} ${esc(prev.title)}</a>` : '<a href="#home"><small>처음으로</small>책 소개</a>'}${nextLink}</nav>`;
  }

  function recordLine(ch) {
    const s = A.load(), item = (ok, label) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '·'} ${label}</li>`;
    return `<ul class="record" aria-label="이 장의 기록">${item((s.visited || []).includes(ch.id), '읽음')}${item((s.predicted || {})[ch.id] !== undefined, '예측함')}${item((s.tried || []).includes(ch.id), '실험을 조작함')}</ul>`;
  }

  function renderChapter(ch) {
    return `<article class="chapter"><header class="chapter-head"><p class="eyebrow">${esc(ch.group)} · ${ch.num}장 · ${esc(ch.time)}</p><h1 tabindex="-1">${esc(ch.title)}</h1><p class="lead">${esc(ch.subtitle)}</p>
      <p class="prev"><strong>앞에서 얻은 것</strong> ${esc(ch.prev)}</p></header>
      <section class="box problem" aria-labelledby="pb-${ch.id}"><h2 id="pb-${ch.id}"><span class="step">문제</span> 한빛 공장에서</h2><p>${esc(ch.problem)}</p></section>
      <figure class="figure">${F[ch.figure]()}<figcaption>${esc(ch.figureCaption)}</figcaption></figure>
      <section aria-labelledby="bd-${ch.id}"><h2 id="bd-${ch.id}" class="sr-only">본문</h2>${ch.body.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="formula"><p class="expr">${esc(ch.formula.expr)}</p><p>${esc(ch.formula.read)}</p></div><p class="example"><strong>숫자로 보기</strong> ${esc(ch.example)}</p></section>
      ${predictBlock(ch)}${labBlock(ch)}
      <section class="box explain" aria-labelledby="ex-${ch.id}"><h2 id="ex-${ch.id}"><span class="step">설명</span> 실험에서 본 것</h2><p>${esc(ch.explain)}</p></section>
      <section class="box transfer" aria-labelledby="tr-${ch.id}"><h2 id="tr-${ch.id}"><span class="step">전이</span> 공장 밖의 새 상황</h2><p>${esc(ch.transfer.q)}</p><details><summary>생각을 정리한 뒤 펼치기</summary><p>${esc(ch.transfer.a)}</p></details></section>
      <section class="box check" aria-labelledby="ck-${ch.id}"><h2 id="ck-${ch.id}">이해 확인</h2><p>${esc(ch.check.q)}</p><details><summary>답 보기</summary><p>${esc(ch.check.a)}</p></details></section>
      ${linksBlock(ch)}<section class="remaining"><h2>아직 풀지 못한 질문</h2><p>${esc(ch.remaining)}</p></section>${recordLine(ch)}${pager(ch)}</article>`;
  }

  function wireChapter(ch) {
    main.querySelectorAll(`input[name="predict-${ch.id}"]`).forEach((r) => r.addEventListener('change', () => {
      A.save((s) => { s.predicted[ch.id] = Number(r.value); });
      main.querySelector('.predict-status').textContent = '예측을 기록했습니다. 실험한 뒤 아래에서 확인하세요.';
      main.querySelector('.record').outerHTML = recordLine(ch);
    }));
    const body = main.querySelector('.lab-body');
    let cleanup = () => {};
    try { cleanup = L[ch.lab].mount(body) || cleanup; } catch (e) {
      body.innerHTML = `<p class="error" role="alert">실험을 불러오지 못했습니다: ${esc(e.message)}. 새로고침하거나 다른 브라우저에서 열어 보세요.</p>`;
    }
    const markTried = () => { if (!A.has('tried', ch.id)) { A.addTo('tried', ch.id); main.querySelector('.record').outerHTML = recordLine(ch); } };
    body.addEventListener('input', markTried);
    body.addEventListener('click', (e) => { if (e.target.closest('button')) markTried(); });
    return cleanup;
  }

  const ROUTES = { home: A.renderHome, chapters: A.renderChapters, sources: A.renderSources, final: A.renderFinal };

  function route() {
    A.runCleanup();
    const id = decodeURIComponent(location.hash.slice(1)) || 'home', ch = A.byId[id];
    if (ch) {
      main.innerHTML = renderChapter(ch);
      A.addTo('visited', ch.id);
      A.setCleanup(wireChapter(ch));
      document.title = `${ch.num} ${ch.title} · 확률과 통계`;
    } else {
      main.innerHTML = (ROUTES[id] || A.renderHome)();
      document.title = '확률과 통계 · 경보가 울렸다, 정말 고장일까';
    }
    A.renderSidebar();
    document.body.classList.remove('menu-open');
    document.getElementById('menu').setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
    const h1 = main.querySelector('h1');
    if (h1 && location.hash) h1.focus({ preventScroll: true });
  }

  function setupChrome() {
    const theme = document.getElementById('theme'), key = `${B.storageKey.replace(':progress', ':theme')}`;
    const apply = (t) => { document.documentElement.dataset.theme = t; theme.textContent = t === 'dark' ? '밝은 화면' : '어두운 화면'; theme.setAttribute('aria-pressed', String(t === 'dark')); };
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) { saved = null; }
    apply(saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    theme.addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; apply(t); try { localStorage.setItem(key, t); } catch (e) { /* 무시 */ } });
    const menu = document.getElementById('menu');
    menu.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); menu.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); } });
  }

  setupChrome();
  window.addEventListener('hashchange', route);
  route();
})();
