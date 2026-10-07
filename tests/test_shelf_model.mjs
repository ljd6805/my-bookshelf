import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuery, matchesItem, usesReducedMotion, shouldPreview } from '../assets/shelf-model.mjs';

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
