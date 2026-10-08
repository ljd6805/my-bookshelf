/* 장 이동과 화면 구성. AI Book과 같은 머리말·목차·장 화면 틀을 쓴다. */
(() => {
  'use strict';
  const B = window.CompBook, Labs = window.CompLabs, main = document.querySelector('main');
  const KEY = 'bookshelf:how-computers-work:v1:progress';
  const pad = (i) => String(i + 1).padStart(2, '0');
  let cleanups = [];

  const THUMBS = [
    '<rect x="20" y="30" width="24" height="40" rx="3"/><rect x="52" y="30" width="24" height="40" rx="3"/><rect class="on" x="84" y="30" width="24" height="40" rx="3"/><rect class="on" x="116" y="30" width="24" height="40" rx="3"/><text x="160" y="58">= 3</text>',
    '<rect class="on" x="20" y="38" width="60" height="26" rx="4"/><path d="M80 51 L120 22 M80 51 L120 51 M80 51 L120 80"/><text x="128" y="27">65</text><text x="128" y="56">A</text><text x="128" y="85">▒</text>',
    '<path d="M10 35 H60 M10 65 H60 M120 50 H170"/><rect x="60" y="20" width="60" height="60" rx="12"/><text x="72" y="56">AND</text><circle class="on" cx="182" cy="50" r="10"/>',
    '<rect x="14" y="25" width="40" height="50" rx="4"/><rect x="62" y="25" width="40" height="50" rx="4"/><rect class="on" x="110" y="25" width="40" height="50" rx="4"/><rect x="158" y="25" width="40" height="50" rx="4"/><path class="hot" d="M110 85 H102 M62 85 H54"/>',
    '<path d="M10 70 H40 V30 H70 V70 H100 V30 H130 V70 H160 V30 H190"/><path class="hot" d="M40 90 H200"/>',
    '<rect x="8" y="28" width="50" height="34" rx="4"/><text x="22" y="50">PC</text><rect class="on" x="80" y="28" width="50" height="34" rx="4"/><text x="96" y="50">IR</text><rect x="152" y="28" width="50" height="34" rx="4"/><text x="161" y="50">ACC</text><path d="M58 45 H80 M130 45 H152"/><path class="hot" d="M177 62 V82 H33 V62"/>',
    '<rect x="60" y="10" width="80" height="22" rx="4"/><path d="M100 32 V46 M60 66 L100 46 L140 66 L100 86 Z"/><path class="hot" d="M60 66 H30 V21 H60"/>',
    '<path d="M100 10 L130 34 H70 Z"/><path d="M70 38 H130 L160 62 H40 Z"/><path d="M40 66 H160 L190 90 H10 Z"/>',
    '<text x="30" y="60" class="big">300 → 44</text>'
  ];
  const thumb = (i) => `<svg class="thumb" viewBox="0 0 210 100" aria-hidden="true">${THUMBS[i]}</svg>`;

  function sourceLinks(ids) {
    return `<ul class="source-list">${ids.map((i) => `<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;
  }
  function flow(items) {
    return `<div class="flow">${items.map((x) => { const [a, b] = x.split('|'); return `<div><b>${a}</b><span>${b}</span></div>`; }).join('')}</div>`;
  }
  function crossLinks(items = []) {
    return items.length ? `<h3>다른 책으로 이어 읽기</h3><ul class="source-list cross-list">${items.map(([label, url, why]) => `<li><a href="${url}">${label}</a><br><span class="caption">이동 이유: ${why}</span></li>`).join('')}</ul>` : '';
  }
  const figure = (key, label) => window.CompFigureView.render(key, label);
  const progress = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const saveProgress = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장할 수 없는 환경에서는 표시만 유지 */ } };

  function side() {
    const read = progress();
    document.querySelector('#sidebar').innerHTML = '<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">컴퓨터 책 처음으로</a>'
      + B.chapters.map((c, i) => `<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}${read[c.id] ? ' ✓' : ''}</a>`).join('');
  }

  function home() {
    document.body.classList.remove('reading');
    document.title = '컴퓨터는 어떻게 동작하는가 · 스위치에서 CPU까지';
    main.innerHTML = `<section class="hero"><div><div class="eyebrow">How computers work · from switches to CPU</div><h1>3 + 4를 누르면,<br><em>화면에 7이 뜨기까지.</em></h1><p class="lead">스위치에서 게이트, 메모리, CPU까지. 비트가 움직이고 명령이 실행되는 과정을 직접 조작하며 배웁니다.</p><div class="hero-links"><a class="button primary" href="#bits">01장부터 읽기</a><a class="button" href="#cpu">CPU 실험하기</a></div><div class="stats"><span><b>${B.chapters.length}</b>챕터</span><span><b>${B.chapters.length}</b>인터랙티브 실험</span><span><b>0</b>외부 API 호출</span></div></div><div class="hero-lab"><div class="lab-top"><span>LIVE · 8개 스위치</span><span>실제 계산</span></div><div class="lab-pad" id="home-bits"></div><p class="caption">스위치를 누르거나 “자동으로 세기”를 켜 보세요. 1장의 실험과 같습니다.</p></div></section>
      <section class="section"><div class="section-heading"><h2>컴퓨터의 흐름을 한눈에</h2><p>비트로 수와 글자를 나타내고, 게이트로 계산하고, 기억한 값을 명령으로 움직입니다. 각 단계가 아래의 챕터와 연결됩니다.</p></div>${flow(['표현|비트·바이트·인코딩', '회로|게이트·덧셈기', '기억|레지스터·메모리', '실행|CPU·반복', '속도|캐시'])}</section>
      <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>개념을 읽고, 예측하고, 직접 실험한 뒤 확인 문제로 마무리하세요.</p></div><h2>전체 챕터</h2><div class="chapter-grid">${B.chapters.map((c, i) => `<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${thumb(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
      <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음부터 순서대로 읽거나, 지금 궁금한 질문에서 출발해도 좋습니다.</p></div><div class="path-grid"><div class="path"><h3>컴퓨터 구조가 처음이라면</h3><p>비트와 약속에서 시작해 판단 회로와 덧셈기를 만듭니다.</p><a href="#bits">01</a><a href="#encoding">02</a><a href="#gates">03</a><a href="#adder">04</a></div><div class="path"><h3>CPU가 궁금하다면</h3><p>기억 장치에서 출발해 명령 실행과 반복까지 따라갑니다.</p><a href="#memory">05</a><a href="#cpu">06</a><a href="#programs">07</a></div><div class="path"><h3>성능과 고장이 궁금하다면</h3><p>읽는 순서가 바꾸는 속도와 넘침으로 생긴 오류를 조사합니다.</p><a href="#cache">08</a><a href="#final">09</a></div></div></section>
      <section class="section" id="sources"><h2>읽을거리와 실험의 경계</h2><p class="lead">공개 강좌와 표준 문서를 바탕으로 설명을 새로 썼습니다. 실험에는 실제 계산인지 교육용 모형인지와 생략한 부분을 함께 적었습니다.</p>${sourceLinks(B.sources.map((_, i) => i))}<div class="note">모든 실험은 브라우저 안에서 실행됩니다. 로그인이나 서버 통신이 없습니다. CPU와 캐시는 원리만 남긴 교육용 모형이며 실제 기기의 성능을 측정하지 않습니다. 참고 자료 주소는 2026-10-08에 정리했습니다.</div></section>`;
    cleanups.push(Labs.bits(document.querySelector('#home-bits')));
  }

  function renderLab(id, index) {
    const [title, desc, task] = B.labs[id];
    return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;
  }

  function chapterNav(index) {
    const prev = index ? `<a href="#${B.chapters[index - 1].id}">이전 · ${B.chapters[index - 1].title}</a>` : '<a href="#home">전체 교과서</a>';
    const c = B.chapters[index], next = B.chapters[index + 1];
    const nextLink = next ? `<a href="#${next.id}">다음 · ${next.title}<span class="why">${c.next}</span></a>` : '<a href="#chapters">목차로 돌아가기</a>';
    return `<nav class="chapter-nav" aria-label="이전·다음 챕터">${prev}${nextLink}</nav>`;
  }

  function chapter(c, index) {
    document.body.classList.add('reading');
    document.title = `${pad(index)}. ${c.title} · 컴퓨터는 어떻게 동작하는가`;
    const read = !!progress()[c.id];
    main.innerHTML = `<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead">${c.subtitle}</p><div class="chapter-meta"><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div></div>
      <section><h2>먼저 개념 잡기</h2>${c.paragraphs.map((p) => `<p>${p}</p>`).join('')}${c.aside || ''}${c.figure ? figure(c.figure, `그림 ${index + 1}-1.`) : ''}<figure class="concept-diagram">${flow(c.flow)}<figcaption class="caption">그림 ${index + 1}-${c.figure ? 2 : 1}. ${c.title}의 핵심 관계를 순서대로 정리했습니다.</figcaption></figure><div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>
      <div class="predict"><strong>먼저 예측하기</strong><br>${c.predict}</div>
      ${c.labs.map(renderLab).join('')}
      <div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div>
      ${c.deeper ? `<details><summary>더 깊이 보기</summary><p>${c.deeper}</p></details>` : ''}
      ${c.extra || ''}
      <section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a, i) => `<button data-answer="${i}">${i + 1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section>
      ${c.remaining ? `<div class="remaining"><strong>해결한 것과 남은 질문</strong><br>${c.remaining}</div>` : ''}
      <section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${crossLinks(c.cross)}<button class="read-toggle" aria-pressed="${read}">${read ? '✓ 읽은 장으로 표시됨' : '이 장을 읽었어요'}</button></section>
      ${chapterNav(index)}</div>`;
    c.labs.forEach((id) => {
      const el = main.querySelector(`[data-lab="${id}"]`);
      try { cleanups.push(Labs[id](el)); window.CompGuides.mount(id, el); } catch (err) { el.textContent = `실험을 여는 중 오류가 났습니다: ${err.message}`; }
    });
    main.querySelectorAll('[data-answer]').forEach((b) => { b.onclick = () => {
      const correct = +b.dataset.answer === c.quiz[2];
      main.querySelector('.quiz-feedback').textContent = `${correct ? '정답입니다.' : '다시 생각해 보세요.'} ${c.quiz[3]}`;
    }; });
    main.querySelector('.read-toggle').onclick = (e) => {
      const p = progress(); p[c.id] = !p[c.id]; saveProgress(p);
      e.target.setAttribute('aria-pressed', String(p[c.id])); e.target.textContent = p[c.id] ? '✓ 읽은 장으로 표시됨' : '이 장을 읽었어요';
      side(); markActive(c.id);
    };
  }

  function markActive(hash) {
    document.querySelectorAll('[data-chapter]').forEach((a) => {
      const active = a.dataset.chapter === hash;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function route() {
    window.CompFigureView.close();
    cleanups.forEach((f) => typeof f === 'function' && f()); cleanups = [];
    const hash = location.hash.slice(1) || 'home', index = B.chapters.findIndex((c) => c.id === hash);
    document.body.classList.remove('menu-open'); document.querySelector('#menu').setAttribute('aria-expanded', 'false');
    if (index >= 0) chapter(B.chapters[index], index); else home();
    markActive(hash);
    main.focus({ preventScroll: true });
    if (hash === 'chapters' || hash === 'sources') document.getElementById(hash).scrollIntoView(); else window.scrollTo(0, 0);
  }

  document.querySelector('.skip').onclick = (e) => { e.preventDefault(); main.focus(); main.scrollIntoView(); };
  side();
  window.CompFigureView.bind(main);
  window.addEventListener('hashchange', route);
  document.querySelector('#theme').onclick = () => {
    const root = document.documentElement, dark = root.dataset.theme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    const b = document.querySelector('#theme'); b.textContent = dark ? '어두운 화면' : '밝은 화면';
  };
  document.querySelector('#menu').onclick = () => { const open = document.body.classList.toggle('menu-open'); document.querySelector('#menu').setAttribute('aria-expanded', String(open)); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.body.classList.remove('menu-open'); document.querySelector('#menu').setAttribute('aria-expanded', 'false'); } });
  route();
})();
