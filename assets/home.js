import { matchesItem, usesReducedMotion } from './shelf-model.mjs?v=20261008-spread-a11y1';
import { createReader, connectSpines } from './reader.js?v=20261008-spread-a11y1';

const storageKey = 'bookshelf:hub:v1:motion';
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion = null;
try { savedMotion = localStorage.getItem(storageKey); } catch { /* Private browsing still works. */ }
const reduced = () => usesReducedMotion(savedMotion, systemMotion.matches);

function setupPreferences(reader) {
  const button = document.getElementById('motion-toggle');
  function reflect() {
    document.documentElement.dataset.motion = reduced() ? 'reduce' : 'full';
    button.setAttribute('aria-pressed', String(reduced()));
    button.textContent = systemMotion.matches ? '동작 줄임 · 시스템 설정' : '동작 줄이기';
    button.disabled = systemMotion.matches;
    reader.resetInterruptedMotion();
  }
  button.addEventListener('click', () => {
    savedMotion = reduced() ? 'full' : 'reduce';
    try { localStorage.setItem(storageKey, savedMotion); } catch { /* Nonpersistent fallback. */ }
    reflect();
  });
  systemMotion.addEventListener('change', reflect);
  reflect();
}

function setupSearch() {
  const search = document.getElementById('resource-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const list = document.getElementById('resource-list');
  const cards = [...list.querySelectorAll('[data-resource]')];
  const shelves = [...list.querySelectorAll('[data-shelf]')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('no-results');
  let category = 'all';
  if (cards.length === 0) return;

  function updateResults() {
    cards.forEach(card => { card.hidden = !matchesItem(card.dataset, search.value, category); });
    shelves.forEach(shelf => {
      shelf.hidden = ![...shelf.querySelectorAll('[data-resource]')].some(card => !card.hidden);
    });
    const visible = cards.filter(card => !card.hidden).length;
    count.textContent = visible === cards.length
      ? `전체 ${cards.length}개 자료` : `${cards.length}개 자료 중 ${visible}개`;
    empty.hidden = visible !== 0;
  }

  function selectCategory(value) {
    category = value;
    filters.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === category));
    });
    updateResults();
  }

  search.addEventListener('input', updateResults);
  filters.forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.filter)));
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    selectCategory('all');
    search.focus();
  });
  const viewButton = document.getElementById('view-toggle');
  viewButton.addEventListener('click', () => {
    const isList = list.classList.toggle('is-list');
    viewButton.setAttribute('aria-pressed', String(isList));
    viewButton.textContent = isList ? '서가로 보기' : '목록으로 보기';
    document.getElementById('shelf-hint').textContent = isList
      ? '제목을 골라 내용을 살펴보세요.' : '책등을 골라 한 권을 펼쳐보세요.';
  });
  document.getElementById('resource-tools').hidden = false;
  document.querySelector('.view-controls').hidden = false;
  updateResults();
}

const dialog = document.getElementById('book-dialog');
const reader = createReader(dialog, reduced);
setupPreferences(reader);
setupSearch();
if (typeof dialog.showModal === 'function') connectSpines(reader);
