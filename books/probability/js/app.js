/* 주소(#장ID)에 따라 장을 그리고, 예측·실험 기록을 이 브라우저에만 저장한다. */
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
    const state = load(), current = location.hash.slice(1) || 'home';
    const mark = (id) => ((state.tried || []).includes(id) ? '<span class="mark done" title="실험 완료">●</span>'
      : (state.visited || []).includes(id) ? '<span class="mark seen" title="읽음">○</span>' : '<span class="mark"></span>');
    sidebar.innerHTML = `<button type="button" class="side-close" onclick="document.getElementById('menu').click()">닫기 ✕</button><nav aria-label="장 목록"><a href="#home" ${current === 'home' ? 'aria-current="page"' : ''}>책 소개</a>
      <ol>${B.chapters.map((c) => `<li><a href="#${c.id}" ${current === c.id ? 'aria-current="page"' : ''}>${mark(c.id)}<span class="num">${c.num}</span> ${esc(c.title)}<span class="sr-only">${(state.tried || []).includes(c.id) ? ' (실험 완료)' : (state.visited || []).includes(c.id) ? ' (읽음)' : ''}</span></a></li>`).join('')}</ol>
      <a href="#final" ${current === 'final' ? 'aria-current="page"' : ''}>마지막 과제</a><a href="#sources" ${current === 'sources' ? 'aria-current="page"' : ''}>참고 자료</a>
      <p class="side-legend">○ 읽음 · ● 실험까지 해 봄</p></nav>`;
  }

  /* ---- 화면들 ---- */
  function chapterCards() {
    return `<ol class="chapter-cards">${B.chapters.map((c) => `<li><a href="#${c.id}"><span class="num">${c.num}</span><strong>${esc(c.title)}</strong><span>${esc(c.subtitle)}</span><small>${esc(c.group)} · ${esc(c.time)}</small></a></li>`).join('')}
      <li class="final-card"><a href="#final"><span class="num">끝</span><strong>${esc(B.final.title)}</strong><span>배운 도구로 새 센서 도입을 판단합니다.</span><small>마지막 과제 · 25분</small></a></li></ol>`;
  }

  function renderHome() {
    const flow = ['문제', '예측', '조작', '관찰', '설명', '전이'];
    return `<section class="hero"><p class="eyebrow">나만의 서재 · 두 번째 책</p><h1 tabindex="-1">확률과 통계<br><span>경보가 울렸다, 정말 고장일까</span></h1>
      <p class="lead">이 책을 끝내면 데이터 몇 개로 내린 결론이 얼마나 흔들릴 수 있는지 계산하고, 경보·검사·실험 결과를 믿어도 되는지 근거를 들어 판단할 수 있습니다.</p>
      <p><a class="btn primary" href="#chance">1장부터 읽기</a> <a class="btn ghost" href="#chapters">전체 목차</a></p></section>
      <section class="case" aria-labelledby="case-title"><h2 id="case-title">이 책의 사건</h2>${B.caseStory.map((p) => `<p>${esc(p)}</p>`).join('')}
      <figure class="figure">${F.binomial()}<figcaption>모든 장이 같은 공장, 같은 센서 20대에서 출발합니다.</figcaption></figure></section>
      <section aria-labelledby="flow-title"><h2 id="flow-title">한 장을 읽는 순서</h2><ol class="flow">${flow.map((f, i) => `<li style="--i:${i}"><span>${i + 1}</span>${f}</li>`).join('')}</ol>
      <p>장마다 먼저 결과를 예측하고, 실험에서 한 번에 하나씩 값을 바꿔 본 뒤, 본 것을 문장으로 설명합니다. 마지막에는 공장 밖의 새 상황에 같은 생각을 옮겨 봅니다. 실험 상자에는 실제 계산인지, 난수로 흉내 낸 시뮬레이션인지 표시해 두었습니다.</p></section>
      <section aria-labelledby="toc-title"><h2 id="toc-title">여덟 개의 장과 마지막 과제</h2>${chapterCards()}</section>
      <section class="bridge" aria-labelledby="bridge-title"><h2 id="bridge-title">AI Book과 함께 읽기</h2>
      <p>AI가 왜 틀리는지 이해하려면 이 책의 도구가 필요합니다. 아래 순서로 두 책을 오가면 "확신과 오류"라는 하나의 질문을 따라갈 수 있습니다.</p>
      <ol class="path"><li><a href="#chance">01 우연은 얼마나 흔들릴까</a> 확률과 표본의 흔들림을 익힙니다.</li><li><a href="#bayes">05 경보가 울리면 정말 고장일까</a> 맞힌 것처럼 보이는 결과를 의심하는 법을 배웁니다.</li>
      <li><a href="#likelihood">08 데이터에 가장 잘 맞는 확률 찾기</a> 우도와 손실이 같은 것임을 봅니다.</li><li><a href="../ai/#learning">AI Book 02 · 오차를 줄이는 방향으로</a> 손실의 바닥을 찾아가는 학습을 봅니다.</li>
      <li><a href="../ai/#generalization">AI Book 03 · 외우는 것과 배우는 것</a> 표본의 흔들림이 과적합으로 나타나는 모습을 봅니다.</li></ol></section>`;
  }

  function renderChapters() {
    return `<h1 tabindex="-1">전체 목차</h1><p class="lead">한 장은 15~22분 분량입니다. 1~4장은 흔들림을 재는 도구, 5~7장은 증거로 판단하는 도구, 8장은 AI로 건너가는 다리입니다.</p>${chapterCards()}`;
  }

  function renderSources() {
    return `<h1 tabindex="-1">참고 자료</h1><p class="lead">개념과 계산 방법을 확인한 자료입니다. 본문과 실험은 이 책을 위해 새로 썼습니다. 2026-10-08 집필 환경에서는 네트워크 제한으로 링크를 직접 열어 보지 못했으므로, 열리지 않는 링크가 있으면 제목으로 찾아 주세요.</p>
      <ul class="sources">${B.sources.map(([t, u, d]) => `<li><a href="${esc(u)}" target="_blank" rel="noreferrer">${esc(t)}</a><span>${esc(d)}</span></li>`).join('')}</ul>
      <p>실험이 쓰는 계산식과 검증 방법은 <a href="docs/index.html">책 개발 문서</a>에 있습니다.</p>`;
  }

  function renderFinal() {
    const f = B.final;
    return `<p class="eyebrow">마지막 과제</p><h1 tabindex="-1">${esc(f.title)}</h1><p class="lead">${esc(f.intro)}</p>
      <section class="box case"><h2>받은 자료</h2><ul>${f.data.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></section>
      <ol class="final-q">${f.questions.map((q, i) => `<li><p>${esc(q.q)}</p><label for="final-${i}">내 답</label><textarea id="final-${i}" rows="3"></textarea><details><summary>예시 답과 비교하기</summary><p>${esc(q.a)}</p></details></li>`).join('')}</ol>
      <p class="reading">적은 답은 이 화면에만 있고 저장되지 않습니다. 숫자보다 "무엇을 결정하고, 어떤 증거가 부족하며, 다음에 무엇을 측정할지"가 들어갔는지 확인하세요.</p>
      <nav class="pager"><a href="#likelihood">← 08 데이터에 가장 잘 맞는 확률 찾기</a><a href="../ai/#learning">AI Book 02로 이어 읽기 → 손실의 바닥을 찾아가는 학습</a></nav>`;
  }

  window.ProbApp = { esc, byId, load, save, has, addTo, renderSidebar, renderHome, renderChapters, renderSources, renderFinal, setCleanup: (f) => { cleanup = f; }, runCleanup: () => { cleanup(); cleanup = () => {}; }, main, sidebar, U, L, F, B };
})();
