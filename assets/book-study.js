/* 모든 책의 공통 학습 기능: 장별 진도, 예측 확인(예측 → 실험 → 덮개 들추기), 복습 퀴즈와 복습 도장.
   책 <head>에서 <script type="module" src="../../assets/book-study.js?v=..." data-book-study data-review="review.json">로 불러온다.
   책 코드는 건드리지 않고, 책이 그린 화면(#sidebar [data-chapter], main의 .quiz·.chapter-nav)에 덧붙인다.
   진도는 이 브라우저에만 남는다(localStorage, 키는 study-model.mjs). 기준: docs/08-book-template.html#study */
import {
  LEVEL_LABEL, LEVEL_MARK, studyKey, folderFromPath, parseState, markOpened, markRead,
  recordAnswer, recordRecall, resetChapterReview, level, summary, pickRecall,
  VERDICTS, recordPrediction, judgePrediction,
} from './study-model.mjs?v=20261028-divider1';

const folder = folderFromPath(location.pathname);
const tag = document.querySelector('script[data-book-study]');
const KEY = folder && studyKey(folder);
let review = {};
let state = load();
let readWatch = null;

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const pad = n => String(n).padStart(2, '0');

function load() {
  try { return parseState(localStorage.getItem(KEY)); } catch { return parseState(null); }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 저장 불가: 이번 방문에만 표시 */ }
}

/** 책이 그린 왼쪽 목차에서 장 목록을 읽는다: [{id, title, num}] */
function chapters() {
  // 제목은 링크의 글자 노드만 읽는다. 번호(span)·책 자체의 표시(em)·이 스크립트의 표시(b)는 빼고 센다.
  return [...document.querySelectorAll('#sidebar [data-chapter]')].map((a, i) => {
    const text = [...a.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim();
    return { id: a.dataset.chapter, title: text || a.textContent.trim(), num: i + 1 };
  });
}

function current() {
  const id = decodeURIComponent(location.hash.slice(1));
  return chapters().find(c => c.id === id) || null;
}

function decorateSidebar(list) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar || !list.length) return;
  list.forEach(c => {
    const link = sidebar.querySelector(`[data-chapter="${CSS.escape(c.id)}"]`);
    const name = level(state.chapters[c.id]);
    let mark = link.querySelector('.study-mark');
    if (!mark) {
      mark = document.createElement('b');
      mark.className = 'study-mark';
      link.append(mark);
    }
    mark.dataset.level = name;
    mark.innerHTML = `<i aria-hidden="true">${LEVEL_MARK[name]}</i><em class="study-sr">${LEVEL_LABEL[name]}</em>`;
  });
  let box = sidebar.querySelector('.study-summary');
  if (!box) {
    box = document.createElement('div');
    box.className = 'study-summary';
    const title = sidebar.querySelector('.sidebar-title');
    if (title) title.after(box); else sidebar.prepend(box);
  }
  box.innerHTML = summaryHtml(summary(state, list.length), list);
}

/** 복습 도장 판: 복습 문항이 있는 장마다 칸 하나. 이 장 문항을 모두 처음 고른 답으로 맞히면 도장이 찍힌다. */
function stampCard(list) {
  const slots = list.filter(c => (review[c.id] || []).length);
  if (!slots.length) return '';
  const got = slots.filter(c => level(state.chapters[c.id]) === 'reviewed');
  return `<p class="study-stamps-title">복습 도장 ${got.length}/${slots.length}</p>`
    + `<ol class="study-stamps" aria-label="복습 도장 판">${slots.map(c => {
      const on = got.includes(c);
      return `<li data-on="${on}" title="${c.num}장 ${esc(c.title)}"><span aria-hidden="true">${pad(c.num)}</span>`
        + `<span class="study-sr">${c.num}장 ${on ? '도장 받음' : '아직 도장 없음'}</span></li>`;
    }).join('')}</ol>`;
}

function summaryHtml(s, list) {
  const card = stampCard(list);
  return `<p><b>${s.total}장 중 ${s.read}장 읽음</b>${card ? '' : ` · 복습 도장 ${s.reviewed}개`}${s.judged ? ` · 판정한 예측 ${s.judged}개` : ''}</p>`
    + `<progress max="${s.total}" value="${s.read}" aria-label="읽은 장 ${s.read}/${s.total}"></progress>`
    + card
    + `<p class="study-legend" aria-hidden="true">◔ 펼쳐 봄 · ✓ 끝까지 읽음 · ★ 복습 도장</p>`
    + `<button type="button" class="study-clear">이 책 진도 지우기</button>`;
}

/** 책 첫 화면(표지)에서 지난번 읽던 장으로 돌아가는 안내. */
function resumeBanner(list) {
  const main = document.querySelector('main');
  const last = state.last && list.find(c => c.id === state.last.id);
  if (!main || !last || main.querySelector('.study-resume')) return;
  const s = summary(state, list.length);
  const box = document.createElement('aside');
  box.className = 'study-resume';
  box.setAttribute('aria-label', '이어 읽기');
  box.innerHTML = `<p><b>이어 읽기</b> 지난번에 마지막으로 펼친 장은 ${last.num}장 「${esc(last.title)}」입니다. `
    + `${s.total}장 중 ${s.read}장을 끝까지 읽었고, ${s.reviewed}장의 복습을 마쳤습니다.</p>`
    + `<a class="button primary" href="#${encodeURIComponent(last.id)}">${last.num}장으로 돌아가기</a>`;
  main.prepend(box);
}

function questionHtml(q, meta) {
  return `<li class="study-q" data-chapter="${esc(meta.id)}" data-q="${meta.index}" data-kind="${meta.kind}">`
    + `<p class="study-q-label">${esc(meta.label)}</p><p class="study-q-text">${esc(q.q)}</p>`
    + `<details class="study-cover"><summary>보기 펼치기 <small>답을 먼저 떠올린 뒤 여세요</small></summary>`
    + `<div class="study-choices" role="group" aria-label="보기">`
    + q.choices.map((c, i) => `<button type="button" data-choice="${i}">${i + 1}. ${esc(c)}</button>`).join('')
    + `</div></details><p class="study-feedback" role="status" aria-live="polite"></p></li>`;
}

function recallNote(recall) {
  if (!recall) return '';
  const c = state.chapters[recall.id];
  return c && (c.read || c.reviewed)
    ? ' 마지막 문제는 끝까지 읽은 앞 장 중 가장 오래 떠올리지 않은 장에서 나옵니다.'
    : ' 아직 끝까지 읽은 앞 장이 없어서 마지막 문제는 바로 앞 장에서 나옵니다.';
}

function reviewHtml(chapter, list) {
  const own = review[chapter.id] || [];
  const items = own.map((q, index) => questionHtml(q, { id: chapter.id, index, kind: 'own', label: `이 장 · ${index + 1}` }));
  const recall = pickRecall(list.map(c => c.id), chapter.id, state, review);
  if (recall) {
    const from = list.find(c => c.id === recall.id);
    items.push(questionHtml(review[recall.id][recall.index],
      { ...recall, kind: 'recall', label: `앞 장 다시 꺼내기 · ${pad(from.num)}장 ${from.title}` }));
  }
  return `<section class="study-review" aria-labelledby="study-review-title"><div class="eyebrow">REVIEW · 복습 퀴즈</div>`
    + `<h2 id="study-review-title">덮기 전에 다시 꺼내 보기</h2>`
    + `<p class="study-intro">책을 보지 않고 답을 먼저 떠올린 다음, 보기를 펼쳐 그중에서 고르세요. 이 장 문제를 모두 처음 고른 답으로 맞히면 복습 도장을 받고 목차에 ★이 표시됩니다.`
    + `${recallNote(recall)}</p>`
    + `<ol class="study-questions">${items.join('')}</ol><p class="study-status"></p>`
    + `<button type="button" class="study-again">이 장 복습 처음부터 다시 하기</button></section>`;
}

function placeReview(section) {
  const main = document.querySelector('main');
  const quizzes = [...main.querySelectorAll('.quiz:not(.predict)')];
  const anchor = quizzes[quizzes.length - 1];
  const nav = main.querySelector('.chapter-nav');
  if (anchor) anchor.after(section);
  else if (nav) nav.before(section);
  else (main.querySelector('.chapter-body') || main).append(section);
}

function updateReviewStatus(section, chapter, fresh = false) {
  const count = (review[chapter.id] || []).length;
  const e = state.chapters[chapter.id] || {};
  const solved = Object.keys(e.answers || {}).filter(k => Number(k) < count).length;
  section.querySelector('.study-status').textContent = e.reviewed
    ? `★ 복습 도장을 받았습니다. 이 장 문제 ${count}개를 모두 맞혔습니다.`
    : `이 장 문제 ${count}개 중 ${solved}개를 맞혔습니다.`;
  showStamp(section, chapter, e.reviewed, fresh);
}

/** 장 복습 도장. 방금 받았으면(fresh) 찍히는 움직임을 한 번 보여 준다. 동작 줄이기에서는 움직이지 않는다(CSS). */
function showStamp(section, chapter, reviewed, fresh) {
  let stamp = section.querySelector('.study-stamp');
  if (!reviewed) { stamp?.remove(); return; }
  if (!stamp) {
    stamp = document.createElement('p');
    stamp.className = 'study-stamp';
    stamp.setAttribute('role', 'img');
    stamp.setAttribute('aria-label', `${chapter.num}장 복습 도장`);
    stamp.innerHTML = `<span aria-hidden="true"><b>${pad(chapter.num)}</b>복습 완료</span>`;
    section.querySelector('.study-status').before(stamp);
  }
  if (fresh) stamp.classList.add('is-fresh');
}

function answer(section, chapter, item, button) {
  const kind = item.dataset.kind, id = item.dataset.chapter, index = Number(item.dataset.q);
  const q = review[id][index], pick = Number(button.dataset.choice), correct = pick === q.answer;
  const tries = Number(item.dataset.tries || 0) + 1;
  item.dataset.tries = String(tries);
  button.dataset.result = correct ? 'right' : 'wrong';
  button.setAttribute('aria-pressed', 'true');
  const feedback = item.querySelector('.study-feedback');
  if (correct) feedback.textContent = tries === 1 ? `✓ 정답입니다. ${q.why}` : `✓ 맞습니다. 다시 고른 답이라 복습 도장에는 세지 않습니다. ${q.why}`;
  else if (tries >= 2) feedback.textContent = `✗ 이번에도 아닙니다. 답은 ${q.answer + 1}번입니다. ${q.why}`;
  else feedback.textContent = `✗ ${pick + 1}번은 아닙니다. 한 번 더 골라 보세요.`;
  // 맞혔거나 답을 보여 준 문항은 잠근다. 복습 도장과 앞 장 기록은 첫 번째 고른 답만 센다.
  if (correct || tries >= 2) item.querySelectorAll('[data-choice]').forEach(b => { b.disabled = true; });
  const now = Date.now();
  const before = Boolean((state.chapters[chapter.id] || {}).reviewed);
  if (kind === 'own') recordAnswer(state, id, index, correct && tries === 1, review[id].length, now);
  else if (correct && tries === 1) recordRecall(state, id, true, now);
  save();
  updateReviewStatus(section, chapter, !before && Boolean(state.chapters[chapter.id].reviewed));
  decorateSidebar(chapters());
}

function mountReview(chapter, list) {
  const main = document.querySelector('main');
  if (!review[chapter.id] || main.querySelector('.study-review')) return;
  const holder = document.createElement('div');
  holder.innerHTML = reviewHtml(chapter, list);
  const section = holder.firstElementChild;
  placeReview(section);
  updateReviewStatus(section, chapter);
  section.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('study-again')) {
      resetChapterReview(state, chapter.id);
      save();
      section.remove();
      mountReview(chapter, list);
      decorateSidebar(chapters());
      return;
    }
    if (button.dataset.choice !== undefined) answer(section, chapter, button.closest('.study-q'), button);
  });
}

/* 예측 확인: 책의 "먼저 예측하기" 상자(.predict)마다 예측을 적는 칸과, 실험 뒤에 예측과 결과를 견주는 판정 칸을 붙인다.
   책이 이미 예측 칸(input)이나 결과 읽기 덮개(details.guide-reading)를 그렸으면 그것을 그대로 쓰고, 판정 칸은 그 덮개 안에 둔다.
   덮개가 없는 책은 실험 결과 자체가 답이므로 따로 숨기지 않고, 실험 끝에 판정 칸을 펼친 채로 둔다.
   저장은 장 안에서 몇 번째 예측 상자인지(n)로 한다. 책이 예측 상자의 순서를 바꾸면 예전 판정이 다른 상자에 붙을 수 있다. */
const VERDICT_NOTE = {
  hit: '예측이 맞았습니다. 왜 맞았는지 이 장의 식이나 그림을 들어 한 문장으로 설명해 보세요.',
  partly: '일부만 맞았습니다. 예측과 결과가 갈린 부분을 짚고, 그 부분에 걸린 입력 하나만 바꿔 다시 실험해 보세요.',
  miss: '예측이 빗나갔습니다. 본문에서 이 결과를 설명하는 문장을 찾아, 처음 생각과 어디가 달랐는지 짚어 보세요.',
};

function guessInput(box, chapter, n) {
  let input = box.querySelector('input[type=text], input:not([type]), textarea');
  if (!input) {
    const id = `study-guess-${chapter.id}-${n}`;
    const label = document.createElement('label');
    label.className = 'study-guess';
    label.htmlFor = id;
    label.innerHTML = `<span>내 예측 적어 두기</span><input id="${esc(id)}" type="text" maxlength="200" autocomplete="off" placeholder="실험하기 전에 짐작한 결과를 한 줄로">`;
    box.append(label);
    input = label.querySelector('input');
  }
  const saved = ((state.chapters[chapter.id] || {}).predictions || {})[n];
  if (saved && saved.text && !input.value) input.value = saved.text;
  if (!input.dataset.studyBound) {
    input.dataset.studyBound = '1';
    input.addEventListener('change', () => { recordPrediction(state, chapter.id, n, input.value, Date.now()); save(); });
  }
  return input;
}

/** 판정 칸을 둘 곳: 예측 상자가 든 실험의 결과 읽기 덮개, 없으면 그 실험의 끝, 실험 밖이면 뒤따르는 첫 실험의 끝. */
function proveHost(box) {
  const lab = box.closest('.lab') || (() => {
    for (let el = box.nextElementSibling; el; el = el.nextElementSibling) if (el.matches('.lab')) return el;
    return null;
  })();
  const reading = lab && lab.querySelector('details.guide-reading');
  if (reading) return { place: el => reading.append(el), reading, echo: !reading.querySelector('.guess-echo') };
  if (lab) return { place: el => lab.append(el), reading: null, echo: true };
  return { place: el => box.after(el), reading: null, echo: true };
}

function proveHtml(chapter, n, host) {
  const name = `study-verdict-${chapter.id}-${n}`;
  return (host.reading ? '' : '<p class="study-prove-title">내 예측과 실험 결과 견주기 <small>실험을 해 본 뒤 고르세요</small></p>')
    + (host.echo ? '<p class="study-echo"></p>' : '')
    + `<fieldset class="study-verdicts"><legend>실험 결과와 견주어 보니 내 예측은 어땠나요?</legend>`
    + Object.entries(VERDICTS).map(([key, text]) => `<label><input type="radio" name="${esc(name)}" value="${key}"> ${text}</label>`).join('')
    + `</fieldset><p class="study-verdict-note" role="status" aria-live="polite"></p>`;
}

/** 예측 되비추기. 결과를 보기 시작한 때(덮개를 처음 열거나 처음 판정한 때)의 글을 기준으로,
    그 뒤에 고친 글은 "실험 전에 적은 예측"이라고 부르지 않는다. */
function echoer(prove, input, frozen) {
  const line = prove.querySelector('.study-echo');
  const show = () => {
    if (!line) return;
    const text = input.value.trim();
    if (!text) line.textContent = '적어 둔 예측이 없습니다. 실험 전에 떠올린 생각과 결과를 견주어 골라 보세요.';
    else if (frozen.text === null || frozen.text === text) line.textContent = `실험 전에 적은 예측: “${text}”`;
    else line.textContent = `결과를 본 뒤 고친 예측: “${text}” (처음 적은 것: “${frozen.text || '없음'}”)`;
  };
  const freeze = () => { if (frozen.text === null) frozen.text = input.value.trim(); show(); };
  return { show, freeze };
}

function mountPrediction(box, chapter, n) {
  box.dataset.studyPredict = String(n);
  const input = guessInput(box, chapter, n);
  const host = proveHost(box);
  const prove = document.createElement('div');
  prove.className = host.reading ? 'study-prove' : 'study-prove study-prove-box';
  prove.innerHTML = proveHtml(chapter, n, host);
  host.place(prove);
  const saved = ((state.chapters[chapter.id] || {}).predictions || {})[n] || {};
  const echo = echoer(prove, input, { text: saved.verdict ? (saved.first ?? saved.text ?? '') : null });
  echo.show();
  input.addEventListener('input', echo.show);
  if (host.reading) host.reading.addEventListener('toggle', () => { if (host.reading.open) echo.freeze(); });
  const note = prove.querySelector('.study-verdict-note');
  if (saved.verdict) { prove.querySelector(`input[value=${saved.verdict}]`).checked = true; note.textContent = VERDICT_NOTE[saved.verdict]; }
  prove.addEventListener('change', event => {
    const verdict = event.target.value;
    if (!VERDICT_NOTE[verdict]) return;
    echo.freeze();
    if (input.value.trim()) recordPrediction(state, chapter.id, n, input.value, Date.now());
    judgePrediction(state, chapter.id, n, verdict, Date.now());
    save();
    note.textContent = VERDICT_NOTE[verdict];
    decorateSidebar(chapters());
  });
}

function mountPredictions(chapter) {
  const main = document.querySelector('main');
  [...main.querySelectorAll('.predict:not(.quiz)')].forEach((box, n) => {
    if (box.dataset.studyPredict === undefined) mountPrediction(box, chapter, n);
  });
}

/** 장 끝의 이전·다음 이동 줄이 화면에 들어오고, 장을 연 지 READ_AFTER 밀리초가 지났으면 끝까지 읽은 장으로 표시한다.
    장을 옮기자마자 이전 스크롤 위치 때문에 이동 줄이 잠깐 보이는 경우를 읽음으로 세지 않기 위한 조건이다. */
const READ_AFTER = 8000;
function watchRead(chapter) {
  if (readWatch) readWatch.stop();
  const nav = document.querySelector('main .chapter-nav');
  if (!nav || !('IntersectionObserver' in window)) return;
  const openedAt = Date.now();
  let visible = false;
  const check = () => {
    if (!visible || Date.now() - openedAt < READ_AFTER || !nav.isConnected) return;
    markRead(state, chapter.id, Date.now());
    save();
    decorateSidebar(chapters());
    readWatch.stop();
  };
  const observer = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); check(); });
  const timer = setTimeout(check, READ_AFTER + 50);
  observer.observe(nav);
  readWatch = { stop() { observer.disconnect(); clearTimeout(timer); } };
}

let lastRoute = null;
function refresh() {
  const list = chapters();
  if (!list.length) return;
  const chapter = current();
  if (chapter) {
    if (lastRoute !== chapter.id) {
      markOpened(state, chapter, list.length, Date.now());
      save();
      lastRoute = chapter.id;
      watchRead(chapter);
    }
    mountReview(chapter, list);
    mountPredictions(chapter);
  } else {
    lastRoute = null;
    if (['', 'home'].includes(location.hash.slice(1))) resumeBanner(list);
  }
  decorateSidebar(list);
}

function clearAll(event) {
  if (!event.target.closest('.study-clear')) return;
  if (!confirm('이 책의 읽은 장과 복습 기록을 모두 지울까요? 이 브라우저에만 저장된 기록입니다.')) return;
  try { localStorage.removeItem(KEY); } catch { /* 저장 불가 */ }
  state = load();
  lastRoute = null;
  // 책이 그린 예측 칸은 남기되 글은 비운다. 공통 스크립트가 붙인 칸과 판정은 지우고 다시 붙인다.
  document.querySelectorAll('[data-study-predict] input, [data-study-predict] textarea').forEach(el => { el.value = ''; });
  document.querySelectorAll('.study-review, .study-resume, .study-prove, .study-guess').forEach(el => el.remove());
  document.querySelectorAll('[data-study-predict]').forEach(el => { delete el.dataset.studyPredict; });
  refresh();
}

function addStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./book-study.css' + new URL(import.meta.url).search, import.meta.url).href;
  document.head.append(link);
}

async function loadReview() {
  const file = tag && tag.dataset.review;
  if (!file) return;
  try {
    const response = await fetch(new URL(file, document.baseURI));
    if (response.ok) review = (await response.json()).chapters || {};
  } catch { review = {}; }
}

async function start() {
  if (!folder) return;
  addStyles();
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; refresh(); });
  };
  const watcher = new MutationObserver(schedule);
  ['main', '#sidebar'].forEach(sel => { const el = document.querySelector(sel); if (el) watcher.observe(el, { childList: true }); });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('storage', event => { if (event.key === KEY) { state = load(); schedule(); } });
  document.addEventListener('click', clearAll);
  refresh();
  await loadReview();
  refresh();
}

start();
