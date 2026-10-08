/* 장 화면. AI Book의 장 구성(머리말 → 먼저 개념 잡기 → 실험 → 혼동하지 마세요 → 확인 문제 → 더 읽어 보기 → 이전·다음)을 따르고,
   이 서재의 흐름(문제 → 예측 → 조작 → 관찰 → 설명 → 전이)이 끊기지 않도록 예측·결과 읽기·새 상황·남은 질문을 그 사이에 둡니다. */
(() => {
  'use strict';
  const B = LABook, V = LAViews, H = LAApp, main = H.main, pad = H.pad;

  function head(c, i) {
    return `<div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(i + 1)} / ${c.group}</div><h1>${c.title}</h1><p class="lead">${c.subtitle}</p>` +
      `<span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 예측 1개 · 확인 문제 1개</span></div>`;
  }

  function concept(c, i) {
    const formula = c.formula ? `<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>` : '';
    return `<section id="concept"><h2>먼저 개념 잡기</h2><h3>${c.concept.heading}</h3>${c.concept.html}` +
      `<figure class="concept-diagram"><div class="diagram">${c.figure.svg}</div><figcaption class="caption">그림 ${i + 1}-1. ${c.figure.caption}</figcaption></figure>` +
      `<figure class="concept-diagram">${H.flow(c.map)}<figcaption class="caption">그림 ${i + 1}-2. 이 장이 이어받는 것, 새로 쓰는 도구, 다음 장으로 넘기는 질문입니다.</figcaption></figure>` +
      (c.why ? `<p>${c.why}</p>` : '') + formula + '</section>';
  }

  function predict(c) {
    const p = c.predict;
    return `<div class="predict">${p.lead}<p><b>먼저 예측해 보세요.</b> ${p.question}</p><div class="buttons">` +
      p.options.map((o, k) => `<button type="button" data-choice="${k}" aria-pressed="false">${o}</button>`).join('') +
      '</div><p class="predict-note" aria-live="polite"></p></div>';
  }

  function lab(c, id, k, chapterIndex) {
    const v = V[id];
    return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(chapterIndex + 1)}${c.labs.length > 1 ? '-' + (k + 1) : ''}</span><h3>${v.title}</h3></div>` +
      `<p class="lab-desc">${v.desc} <span class="kind">실제 계산</span></p>${k === 0 ? predict(c) : ''}` +
      `<div class="lab-inner" data-lab="${id}">${v.html}</div><div class="challenge"><b>직접 해 보기</b>${v.task}</div></article>`;
  }

  function results(c) {
    const checks = c.checks.join('');
    const extra = c.extra.map((e, k) => `<section><h2>${e.heading}</h2>${e.html}${k === 0 ? checks : ''}</section>`).join('');
    const example = c.example ? `<div class="worked"><b>숫자로 따라가기</b> ${c.example}</div>` : '';
    return `<section id="results"><h2>실험 결과 읽기</h2><h3>${c.observe.heading}</h3>${c.observe.html}${example}${c.explainAfter}${c.extra.length ? '' : checks}</section>${extra}` +
      `<section id="transfer"><h2>${c.transfer.heading}</h2>${c.transfer.html}${c.cross.join('')}</section>`;
  }

  function closing(c, i) {
    const prev = i ? `<a href="#${B.chapters[i - 1].id}">이전 · ${B.chapters[i - 1].title}</a>` : '<a href="#home">책의 처음으로</a>';
    const next = i < H.LAST ? `<a href="#${B.chapters[i + 1].id}">다음 · ${B.chapters[i + 1].title}<small>${c.next}</small></a>` : `<a href="#chapters">목차로 돌아가기<small>${c.next}</small></a>`;
    const question = c.question ? `<section id="next-question"><h2>남은 질문</h2>${c.question}</section>` : '';
    return `<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div>${c.deeper.join('')}` +
      `<section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>` +
      c.quiz[1].map((a, k) => `<button type="button" data-answer="${k}">${k + 1}. ${a}</button>`).join('') +
      `<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${H.sourceLinks(c.sources)}</section>` +
      `${question}<nav class="chapter-nav" aria-label="이전·다음 챕터">${prev}${next}</nav>`;
  }

  function chapter(c, i) {
    document.body.classList.add('reading');
    document.title = `${pad(i + 1)}. ${c.title} · 벡터와 행렬로 보는 세상`;
    main.innerHTML = `<div class="chapter-body">${head(c, i)}${concept(c, i)}${c.labs.map((id, k) => lab(c, id, k, i)).join('')}${results(c)}${closing(c, i)}</div>`;
    main.querySelectorAll('.predict').forEach(UI.predict);
    c.labs.forEach((id) => {
      const el = main.querySelector(`[data-lab="${id}"]`);
      if (UI.mount(el)) LAGuides.mount(id, el, V[id].guide);
    });
    main.querySelectorAll('[data-answer]').forEach((b) => b.addEventListener('click', () => {
      const correct = Number(b.dataset.answer) === c.quiz[2];
      main.querySelectorAll('[data-answer]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      main.querySelector('.quiz-feedback').textContent = `${correct ? '정답입니다.' : '다시 생각해 보세요.'} ${c.quiz[3]}`;
    }));
  }

  window.LAPages.chapter = chapter;
})();
