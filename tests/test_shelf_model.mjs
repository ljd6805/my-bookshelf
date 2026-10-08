import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuery, matchesItem, usesReducedMotion, shouldPreview, shelfCapacity, packShelves } from '../assets/shelf-model.mjs';

test('search normalizes Korean, Latin case and full-width characters', () => {
  assert.equal(normalizeQuery(' ＡＩ  '), 'ai');
  assert.ok(matchesItem({ search: 'AI 시각화 학습', category: 'analysis' }, 'ａｉ 시각화'));
});
test('search combines every word with a selected category', () => {
  const item = { search: 'AI 시각화 학습', category: 'analysis' };
  assert.ok(matchesItem(item, '시각화 AI', 'analysis'));
  assert.ok(!matchesItem(item, 'AI 센서', 'analysis'));
  assert.ok(!matchesItem(item, 'AI', 'guide'));
  assert.ok(matchesItem(item, '   ', 'all'));
});
test('system reduced motion overrides a saved animation preference', () => {
  assert.equal(usesReducedMotion('full', true), true);
  assert.equal(usesReducedMotion('reduce', false), true);
  assert.equal(usesReducedMotion(null, false), false);
});
test('modified and middle clicks preserve native link navigation', () => {
  assert.ok(shouldPreview({ button: 0 }));
  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
    assert.ok(!shouldPreview({ button: 0, [modifier]: true }));
  }
  assert.ok(!shouldPreview({ button: 1 }));
});
test('shelf capacity counts whole spines and never drops below one', () => {
  assert.equal(shelfCapacity(1114, 72, 1), 15);
  assert.equal(shelfCapacity(72, 72, 1), 1);
  assert.equal(shelfCapacity(145, 72, 1), 2);
  assert.equal(shelfCapacity(144, 72, 1), 1);
  assert.equal(shelfCapacity(30, 72, 1), 1);
  assert.equal(shelfCapacity(500, 0, 1), 1);
});
test('a category group that fits one shelf moves down instead of breaking', () => {
  const books = ['ai', 'ai', 'ai', 'cs', 'math', 'math', 'kb'];
  assert.deepEqual(packShelves(books, 4), [[0, 1, 2, 3], [4, 5, 6]]);
  assert.deepEqual(packShelves(books, 5), [[0, 1, 2, 3], [4, 5, 6]]);
  assert.deepEqual(packShelves(books, 15), [[0, 1, 2, 3, 4, 5, 6]]);
  assert.deepEqual(packShelves(books, Infinity), [[0, 1, 2, 3, 4, 5, 6]]);
});
test('a group longer than a shelf fills the current shelf and continues below', () => {
  const books = ['ai', 'ai', ...Array(20).fill('series'), 'math'];
  const shelves = packShelves(books, 8);
  assert.deepEqual(shelves.map(s => s.length), [8, 8, 7]);
  assert.deepEqual(shelves.flat(), books.map((_, i) => i));
  assert.ok(shelves.every(s => s.length <= 8));
});
test('every book keeps its order and one spine per slot, even at capacity one', () => {
  const books = ['a', 'b', 'b', 'c'];
  assert.deepEqual(packShelves(books, 1), [[0], [1], [2], [3]]);
  assert.deepEqual(packShelves([], 6), []);
});
