/* 모든 책의 공통 학습 기능: 장별 진도와 복습 퀴즈.
   책 <head>에서 <script type="module" src="../../assets/book-study.js?v=..." data-book-study data-review="review.json">로 불러온다.
   책 코드는 건드리지 않고, 책이 그린 화면(#sidebar [data-chapter], main의 .quiz·.chapter-nav)에 덧붙인다.
   진도는 이 브라우저에만 남는다(localStorage, 키는 study-model.mjs). 기준: docs/08-book-template.html#study */
import {
  LEVEL_LABEL, LEVEL_MARK, studyKey, folderFromPath, parseState, markOpened, markRead,
  recordAnswer, recordRecall, resetChapterReview, level, summary, pickRecall,
} from './study-model.mjs?v=20261013-notes1';

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
  box.innerHTML = summaryHtml(summary(state, list.length));
}

function summaryHtml(s) {
  return `<p><b>${s.total}장 중 ${s.read}장 읽음</b> · 복습 ${s.reviewed}장</p>`
    + `<progress max="${s.total}" value="${s.read}" aria-label="읽은 장 ${s.read}/${s.total}"></progress>`
    + `<p class="study-legend" aria-hidden="true">◔ 펼쳐 봄 · ✓ 끝까지 읽음 · ★ 복습 완료</p>`
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
    + `<div class="study-choices" role="group" aria-label="보기">`
    + q.choices.map((c, i) => `<button type="button" data-choice="${i}">${i + 1}. ${esc(c)}</button>`).join('')
    + `</div><p class="study-feedback" role="status" aria-live="polite"></p></li>`;
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
    + `<p class="study-intro">책을 보지 않고 답을 떠올려 보세요. 이 장 문제를 모두 처음 고른 답으로 맞히면 목차에 ★ 복습 완료가 표시됩니다.`
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

function updateReviewStatus(section, chapter) {
  const count = (review[chapter.id] || []).length;
  const e = state.chapters[chapter.id] || {};
  const solved = Object.keys(e.answers || {}).filter(k => Number(k) < count).length;
  section.querySelector('.study-status').textContent = e.reviewed
    ? `★ 복습 완료. 이 장 문제 ${count}개를 모두 맞혔습니다.`
    : `이 장 문제 ${count}개 중 ${solved}개를 맞혔습니다.`;
}

function answer(section, chapter, item, button) {
  const kind = item.dataset.kind, id = item.dataset.chapter, index = Number(item.dataset.q);
  const q = review[id][index], pick = Number(button.dataset.choice), correct = pick === q.answer;
  const tries = Number(item.dataset.tries || 0) + 1;
  item.dataset.tries = String(tries);
  button.dataset.result = correct ? 'right' : 'wrong';
  button.setAttribute('aria-pressed', 'true');
  const feedback = item.querySelector('.study-feedback');
  if (correct) feedback.textContent = tries === 1 ? `✓ 정답입니다. ${q.why}` : `✓ 맞습니다. 다시 고른 답이라 복습 완료에는 세지 않습니다. ${q.why}`;
  else if (tries >= 2) feedback.textContent = `✗ 이번에도 아닙니다. 답은 ${q.answer + 1}번입니다. ${q.why}`;
  else feedback.textContent = `✗ ${pick + 1}번은 아닙니다. 한 번 더 골라 보세요.`;
  // 맞혔거나 답을 보여 준 문항은 잠근다. 복습 완료와 앞 장 기록은 첫 번째 고른 답만 센다.
  if (correct || tries >= 2) item.querySelectorAll('[data-choice]').forEach(b => { b.disabled = true; });
  const now = Date.now();
  if (kind === 'own') recordAnswer(state, id, index, correct && tries === 1, review[id].length, now);
  else if (correct && tries === 1) recordRecall(state, id, true, now);
  save();
  updateReviewStatus(section, chapter);
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
  document.querySelectorAll('.study-review, .study-resume').forEach(el => el.remove());
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
