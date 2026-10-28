import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuery, matchesItem, usesReducedMotion, shouldPreview, packDividedShelves } from '../assets/shelf-model.mjs';

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
// Toy geometry: a spine plus its gap takes 10, a divider 4, and 6 more (gap + lead) when it follows a run.
const toy = { book: 9, gap: 1, divider: 4, lead: 5 };
const runs = shelves => shelves.map(shelf => shelf.map(run => `${run.category}:${run.books.join(',')}`));
const widthOf = shelf => shelf.reduce((sum, run, i) => sum + (i ? 6 : 0) + 4 + run.books.length * 10, 0);

test('each field run on a board opens with a divider, and a group that fits a fresh board moves down', () => {
  const books = ['ai', 'ai', 'ai', 'cs', 'math', 'math', 'kb'];
  assert.deepEqual(runs(packDividedShelves(books, 50, toy)), [['ai:0,1,2'], ['cs:3', 'math:4,5'], ['kb:6']]);
  assert.deepEqual(runs(packDividedShelves(books, Infinity, toy)), [['ai:0,1,2', 'cs:3', 'math:4,5', 'kb:6']]);
});
test('a group longer than a board fills it and continues below behind a divider with the same name', () => {
  const books = ['ai', 'ai', ...Array(20).fill('series'), 'math'];
  const shelves = packDividedShelves(books, 84, toy);
  assert.deepEqual(runs(shelves), [['ai:0,1', 'series:2,3,4,5,6'], ['series:7,8,9,10,11,12,13,14'],
    ['series:15,16,17,18,19,20,21'], ['math:22']]);
  assert.deepEqual(shelves.flat().flatMap(run => run.books), books.map((_, i) => i));
  assert.ok(shelves.every(shelf => widthOf(shelf) <= 84));
});
test('every book keeps its order and gets a board even when one spine barely fits', () => {
  assert.deepEqual(runs(packDividedShelves(['a', 'b', 'b', 'c'], 5, toy)), [['a:0'], ['b:1'], ['b:2'], ['c:3']]);
  assert.deepEqual(packDividedShelves([], 60, toy), []);
});
