import test from 'node:test';
import assert from 'node:assert/strict';
import {
  studyKey, folderFromPath, parseState, emptyState, markOpened, markRead,
  recordAnswer, recordRecall, resetChapterReview, level, summary, pickRecall,
} from '../assets/study-model.mjs';

const ch = (id, num) => ({ id, title: `${id} 장`, num });

test('저장 키와 책 폴더는 프로젝트 Pages 접두어와 상관없이 같다', () => {
  assert.equal(folderFromPath('/my-bookshelf/books/rag/index.html'), 'rag');
  assert.equal(folderFromPath('/books/aie-math/'), 'aie-math');
  assert.equal(folderFromPath('books/linear-algebra/'), 'linear-algebra');
  assert.equal(folderFromPath('/index.html'), null);
  assert.equal(studyKey('rag'), 'bookshelf:rag:v1:study');
});

test('깨진 기록이나 다른 버전은 빈 상태로 시작한다', () => {
  assert.deepEqual(parseState('{oops'), emptyState());
  assert.deepEqual(parseState(JSON.stringify({ v: 2, chapters: {} })), emptyState());
  assert.deepEqual(parseState(null), emptyState());
});

test('펼침 → 끝까지 읽음 → 복습 완료로 단계가 오르고, 요약은 읽은 장을 센다', () => {
  const s = emptyState();
  markOpened(s, ch('a', 1), 4, 10);
  assert.equal(level(s.chapters.a), 'opened');
  markRead(s, 'a', 20);
  assert.equal(level(s.chapters.a), 'read');
  recordAnswer(s, 'a', 0, true, 2, 30);
  assert.equal(level(s.chapters.a), 'read', '두 문항 중 하나만 맞히면 아직 복습 완료가 아니다');
  recordAnswer(s, 'a', 1, false, 2, 31);
  recordAnswer(s, 'a', 1, true, 2, 32);
  assert.equal(level(s.chapters.a), 'reviewed');
  assert.equal(s.chapters.a.reviewed, 32);
  markOpened(s, ch('b', 2), 4, 40);
  assert.deepEqual(summary(s), { total: 4, opened: 2, read: 1, reviewed: 1, percent: 25, last: { id: 'b', title: 'b 장', num: 2, at: 40 } });
  resetChapterReview(s, 'a');
  assert.equal(level(s.chapters.a), 'read');
});

test('복습만 마친 장도 읽은 장으로 세고, 읽은 장 수는 전체 장 수를 넘지 않는다', () => {
  const s = emptyState();
  recordAnswer(s, 'x', 0, true, 1, 5);
  assert.equal(summary(s, 1).read, 1);
  recordAnswer(s, 'y', 0, true, 1, 6);
  assert.equal(summary(s, 1).read, 1);
  assert.equal(summary(emptyState(), 0).percent, 0);
});

test('앞 장 다시 꺼내기: 첫 장에는 없고, 읽지 않았으면 바로 앞 장을 고른다', () => {
  const order = ['a', 'b', 'c', 'd'];
  const review = { a: [{}, {}], b: [{}, {}], c: [{}, {}], d: [{}, {}] };
  assert.equal(pickRecall(order, 'a', emptyState(), review), null);
  assert.deepEqual(pickRecall(order, 'd', emptyState(), review), { id: 'c', index: 0 });
  assert.equal(pickRecall(order, 'zzz', emptyState(), review), null);
});

test('앞 장 다시 꺼내기: 읽은 장 중 가장 오래 떠올리지 않은 장, 맞힐 때마다 문항이 돈다', () => {
  const order = ['a', 'b', 'c', 'd'];
  const review = { a: [{}, {}], b: [{}, {}], c: [{}, {}], d: [{}] };
  const s = emptyState();
  markOpened(s, ch('a', 1), 4, 1);
  assert.deepEqual(pickRecall(order, 'd', s, review), { id: 'c', index: 0 }, '펼쳐 보기만 한 장은 읽은 장이 아니다');
  markRead(s, 'a', 100);
  markRead(s, 'b', 50);
  markRead(s, 'c', 200);
  assert.deepEqual(pickRecall(order, 'd', s, review), { id: 'b', index: 0 });
  recordRecall(s, 'b', true, 300);
  assert.deepEqual(pickRecall(order, 'd', s, review), { id: 'a', index: 0 });
  recordRecall(s, 'a', true, 400);
  recordRecall(s, 'c', true, 500);
  assert.deepEqual(pickRecall(order, 'd', s, review), { id: 'b', index: 1 }, 'b를 한 번 맞혔으니 두 번째 문항');
  recordRecall(s, 'b', false, 600);
  assert.deepEqual(pickRecall(order, 'd', s, review), { id: 'b', index: 1 }, '틀리면 같은 문항이 다시 나온다');
});

test('앞 장 다시 꺼내기: 복습 문항이 없는 장은 건너뛴다', () => {
  const s = emptyState();
  markRead(s, 'a', 1);
  assert.deepEqual(pickRecall(['a', 'b', 'c'], 'c', s, { a: [{}], c: [{}] }), { id: 'a', index: 0 });
  assert.equal(pickRecall(['a', 'b'], 'b', s, { b: [{}] }), null);
});
