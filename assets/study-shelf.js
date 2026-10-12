/* 서가 쪽 진도 표시. 책이 남긴 기록(bookshelf:<책 폴더>:v1:study)을 읽어
   펼친 책 면에 "몇 장 읽음 · 이어 읽기"를, 서가 아래에 "이어서 공부하기" 목록을 그린다.
   기록은 이 브라우저에만 있으므로 서버나 생성기는 관여하지 않는다. 기준: docs/08-book-template.html#study */
import { studyKey, folderFromPath, parseState, summary } from './study-model.mjs?v=20261012-study1';

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const pad = n => String(n).padStart(2, '0');

function readBook(link) {
  const href = link.getAttribute('href') || '';
  const folder = folderFromPath(href);
  if (!folder) return null;
  let text = null;
  try { text = localStorage.getItem(studyKey(folder)); } catch { text = null; }
  const state = parseState(text);
  const s = summary(state);
  if (!s.last) return null;
  const title = link.getAttribute('aria-label') || link.dataset.search || folder;
  return { href, folder, s, title: title.split(' · ')[0], tone: [...link.classList].find(c => c.startsWith('tone-')) };
}

function resumeLink(book) {
  const last = book.s.last;
  return `${book.href}#${encodeURIComponent(last.id)}`;
}

function progressHtml(book) {
  const { s } = book;
  return `<p><b>${s.total}장 중 ${s.read}장 읽음</b> · 복습 ${s.reviewed}장</p>`
    + `<progress max="${s.total}" value="${s.read}" aria-label="읽은 장 ${s.read}/${s.total}"></progress>`
    + `<a href="${esc(resumeLink(book))}">이어 읽기 · ${pad(s.last.num)}장 ${esc(s.last.title)}</a>`;
}

/** 펼친 책 면(template)의 읽기 버튼 위에 진도 한 줄을 넣는다. */
function fillTemplates(books) {
  document.querySelectorAll('[data-preview]').forEach(link => {
    const template = document.getElementById(link.dataset.preview);
    const copy = template && template.content.querySelector('.reader-copy');
    if (!copy) return;
    copy.querySelector('.reader-study')?.remove();
    const book = books.get(link);
    if (!book) return;
    const box = document.createElement('div');
    box.className = 'reader-study';
    box.innerHTML = progressHtml(book);
    const action = copy.querySelector('.reader-action');
    if (action) action.before(box); else copy.append(box);
  });
}

function shelfSection() {
  let section = document.getElementById('study');
  if (section) return section;
  section = document.createElement('section');
  section.className = 'study-shelf wrap';
  section.id = 'study';
  section.setAttribute('aria-labelledby', 'study-title');
  document.getElementById('materials')?.after(section);
  return section;
}

/** 서가 아래 "이어서 공부하기": 최근에 펼친 책부터. 기록이 없으면 구역을 숨긴다. */
function fillShelf(books) {
  const section = shelfSection();
  const list = [...books.values()].sort((a, b) => (b.s.last.at || 0) - (a.s.last.at || 0));
  section.hidden = list.length === 0;
  section.innerHTML = list.length ? `<h2 id="study-title">이어서 공부하기</h2>`
    + `<p class="study-shelf-note">이 브라우저에서 펼친 책입니다. 장을 끝까지 읽으면 ✓, 장 끝 복습 퀴즈를 모두 맞히면 ★로 셉니다.</p>`
    + `<ol class="study-shelf-list">${list.map(book => `<li class="${book.tone || ''}">`
      + `<h3>${esc(book.title)}</h3>${progressHtml(book)}</li>`).join('')}</ol>` : '';
}

export function setupStudy() {
  const render = () => {
    const books = new Map();
    document.querySelectorAll('[data-preview][href^="books/"]').forEach(link => {
      const book = readBook(link);
      if (book) books.set(link, book);
    });
    fillTemplates(books);
    fillShelf(books);
  };
  render();
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', event => { if (event.key?.endsWith(':v1:study')) render(); });
}
