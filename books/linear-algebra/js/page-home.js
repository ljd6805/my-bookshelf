/* 표지 화면: 히어로 실험, 흐름, 공통 사례, 전체 챕터, 학습 경로, 참고 자료. AI Book의 표지와 같은 순서입니다. */
(() => {
  'use strict';
  const B = LABook, V = LAViews, H = LAApp, main = H.main, pad = H.pad;
  const FEEL = { dawn: '느리고 조용한 걷기', rain: '아주 느리고 잔잔함', festival: '가장 빠르고 신남', run: '빠르고 경쾌함',
    jazz: '느리지만 소리가 꽉 참', subway: '빠르지만 담담함', rock: '힘이 가장 셈', lullaby: '가장 느리고 조용함' };
  const num = (x) => String(x).replace('-', '−');

  function hero() {
    return `<section class="hero"><div><div class="eyebrow">An interactive field guide to vectors &amp; matrices</div>` +
      `<h1>노래 여덟 곡으로<br><em>공간을 움직이는 법.</em></h1><p class="lead">“이 노래가 좋았다면 저 노래도 좋아할까?” 이 질문 하나에 답하는 작은 추천기를 처음부터 만듭니다. 화살표를 끌고, 평면을 기울이고, 가장 긴 방향을 찾으며 선형대수를 손으로 익히세요.</p>` +
      `<div class="hero-links"><a class="button primary" href="#vectors">01장부터 읽기</a><a class="button" href="#matrix">행렬 실험하기</a></div>` +
      `<div class="stats"><span><b>${B.chapters.length}</b>챕터</span><span><b>${B.chapters.reduce((n, c) => n + c.labs.length, 0)}</b>인터랙티브 실험</span><span><b>0</b>외부 API 호출</span></div></div>` +
      `<div class="hero-lab"><div class="lab-top"><span>취향 방향을 돌리면 추천도 바뀝니다</span><span>8곡 · 2특징</span></div>` +
      `<div class="hero-map" data-lab="songs-map"><div class="stage">${V['songs-map'].html}</div><div class="hero-controls">` +
      `<label class="control" for="hero-theta"><span class="row"><span>나의 취향 방향 θ</span><output for="hero-theta">63°</output></span>` +
      `<input type="range" id="hero-theta" name="theta" min="0" max="359" step="1" value="63" data-digits="0" data-unit="°"></label>` +
      `<div class="readout" role="status" aria-live="polite"></div></div></div>` +
      `<p class="caption">가로는 빠르기, 세로는 에너지입니다. 점 하나가 노래 한 곡이고, 붉은 화살표가 나의 취향입니다. 강조된 점이 코사인 유사도(2장)로 고른 1위 노래입니다.</p></div></section>`;
  }

  function caseSection() {
    const rows = SONGS.songs.map((s) => `<tr><td>${s.name}</td><td class="num">${num(s.v[0])}</td><td class="num">${num(s.v[1])}</td><td>${FEEL[s.id]}</td></tr>`).join('');
    return `<section class="section" id="case"><div class="section-heading"><h2>모든 장이 쓰는 노래 여덟 곡</h2><p>노래마다 빠르기와 에너지를 −3(아주 낮음)~3(아주 높음)으로 붙였습니다. 실제 음원을 분석한 값이 아니라 설명을 위해 정한 가상의 값입니다. 나의 취향은 (1, 2)입니다.</p></div>` +
      `<div class="table-wrap"><table><caption class="caption">노래별 특징 점수 (빠르기, 에너지)</caption><thead><tr><th scope="col">노래</th><th scope="col">빠르기</th><th scope="col">에너지</th><th scope="col">한 줄 느낌</th></tr></thead><tbody>${rows}</tbody></table></div>` +
      `<div class="legend" aria-label="그림 색 범례"><span class="a">파랑: 첫째 벡터·첫째 열</span><span class="b">청록: 둘째 벡터·둘째 열</span><span class="me">붉은색: 나의 취향·기준 방향</span><span class="res">보라: 계산 결과</span><span class="song">주황 점: 노래</span></div>` +
      `<p class="caption">색만으로 구분하지 않도록 그림 속 화살표에는 이름표를 붙이고, 모든 실험의 결과는 그림 아래에 문장과 숫자로도 나옵니다.</p></section>`;
  }

  function chapterGrid() {
    const read = UI.readState();
    return `<section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>각 장의 마지막에는 아직 풀지 못한 질문이 남고, 그 질문이 다음 장의 출발점입니다. 개념을 읽고, 예측하고, 직접 실험한 뒤 확인 문제로 마무리하세요.</p></div><h2>전체 챕터</h2>` +
      `<div class="chapter-grid">${B.chapters.map((c, i) => `<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i + 1)} / ${c.group}</span>${H.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span>${read[c.id] ? '<span class="tag read">읽음</span>' : ''}<span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>`;
  }

  function paths() {
    const link = (ids) => ids.map((id) => `<a href="#${id}">${pad(B.chapters.findIndex((c) => c.id === id) + 1)}</a>`).join('');
    return `<section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음부터 순서대로 읽기를 권하지만, 지금 궁금한 질문에서 출발해도 좋습니다.</p></div><div class="path-grid">` +
      `<div class="path"><h3>선형대수가 처음이라면</h3><p>노래를 벡터로 적고, 닮음을 재고, 행렬이 평면을 옮기는 모습까지 차례로 봅니다.</p>${link(['vectors', 'similarity', 'projection', 'matrix'])}</div>` +
      `<div class="path"><h3>AI의 계산이 궁금하다면</h3><p>내적과 행렬 곱, 주성분과 신경망 한 층으로 이어지는 흐름을 따라갑니다.</p>${link(['similarity', 'matrix', 'pca', 'layer'])}</div>` +
      `<div class="path"><h3>변환과 그래픽이 궁금하다면</h3><p>변환을 잇고, 넓이를 재고, 되돌리고, 변하지 않는 방향을 찾습니다.</p>${link(['compose', 'determinant', 'inverse', 'eigen'])}</div></div>` +
      `<div class="path-grid promise"><div class="path"><h3>누구를 위한 책인가</h3><p>좌표평면과 곱셈은 알지만, 벡터·행렬이 왜 AI와 그래픽에서 계속 나오는지 감이 오지 않는 사람.</p></div>` +
      `<div class="path"><h3>끝나면 할 수 있는 일</h3><p>데이터를 벡터로 적고, 닮음을 내적과 코사인으로 계산하고, 행렬 하나가 공간을 어떻게 바꾸는지 그림으로 예측해 설명합니다.</p></div>` +
      `<div class="path"><h3>배웠는지 확인하는 방법</h3><p>마지막 장에서 셋째 특징이 생긴 노래 데이터를 받고, 무엇을 바꿀지와 그 이유, 아직 부족한 증거를 스스로 판단합니다.</p><a href="#challenge">11</a></div></div></section>`;
  }

  function sources() {
    return `<section class="section" id="sources"><h2>읽을거리와 실험의 경계</h2><p class="lead">강의와 공식 문서를 바탕으로 개념을 설명했습니다. 실험마다 계산식과 입력 범위, 가정을 ‘계산 조건’으로 함께 적었습니다.</p>${H.sourceLinks(B.sources.map((_, i) => i))}` +
      `<p class="caption">링크 확인일: 2026-10-08</p><div class="note">모든 실험은 브라우저 안에서 실제로 계산합니다. 미리 정한 결과를 재생하지 않으며 API 키나 로그인이 필요하지 않습니다. 노래와 점수는 설명용 가상 데이터이고, 10장의 W와 b는 학습한 값이 아니라 직접 정한 값입니다. 동작 줄이기 설정을 켜면 애니메이션은 마지막 장면만 보여 줍니다.</div>` +
      `<div class="cross"><p><strong>다른 책으로 이어 읽기</strong> → AI Book <a href="../ai/#embeddings">5장 의미를 놓는 좌표 공간</a></p><p>이동 이유: 이 책의 2장에서 계산한 코사인 유사도가 단어와 문장의 ‘의미 거리’로 쓰이는 모습을 볼 수 있습니다. 10장을 마친 뒤에는 AI Book의 <a href="../ai/#neuron">1장 신경망의 작은 부품</a>에서 뉴런 하나의 가중치를 바꿔 보면 행렬의 한 행이 무슨 일을 하는지 다시 확인할 수 있습니다. 이 책은 다른 책과 코드를 공유하지 않고 링크만 겁니다.</p></div></section>`;
  }

  function home() {
    document.body.classList.remove('reading');
    document.title = '벡터와 행렬로 보는 세상 · 직접 움직이는 선형대수';
    main.innerHTML = hero() + `<section class="section"><div class="section-heading"><h2>선형대수의 흐름을 한눈에</h2><p>노래를 숫자로 적고, 닮음을 재고, 공간을 옮기고, 변하지 않는 방향을 찾습니다. 각 단계가 아래의 챕터와 연결됩니다.</p></div>` +
      H.flow(['벡터|노래를 숫자 묶음으로', '내적|닮음을 숫자 하나로', '행렬|평면 전체를 옮기는 규칙', '고유벡터|변하지 않는 방향', '신경망|행렬 곱과 꺾기']) + '</section>' +
      caseSection() + chapterGrid() + paths() + sources();
    UI.mount(main.querySelector('[data-lab="songs-map"]'));
  }

  window.LAPages = { home };
})();
