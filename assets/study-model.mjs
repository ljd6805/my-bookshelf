/* 장별 진도와 복습 퀴즈의 계산 모델. 화면을 모르는 순수 함수만 둔다.
   책(assets/book-study.js)과 서가(assets/study-shelf.js)가 같은 저장 형식을 이 파일로 읽고 쓴다.
   저장 키: bookshelf:<책 폴더>:v1:study  (예: books/ai/ → bookshelf:ai:v1:study)
   시각은 Date.now() 밀리초, 장 번호는 1부터 센다. 기준: docs/08-book-template.html#study */

export const LEVELS = ['none', 'opened', 'read', 'reviewed'];
export const LEVEL_LABEL = { none: '아직 펼치지 않음', opened: '펼쳐 봄', read: '끝까지 읽음', reviewed: '복습 완료' };
export const LEVEL_MARK = { none: '○', opened: '◔', read: '✓', reviewed: '★' };

export function studyKey(folder) {
  return `bookshelf:${folder}:v1:study`;
}

/** books/<폴더>/ 아래의 경로에서 책 폴더 이름을 꺼낸다. 프로젝트 Pages의 /repo/ 접두어도 허용한다. */
export function folderFromPath(path) {
  const match = /(?:^|\/)books\/([a-z0-9-]+)(?:\/|$)/.exec(path || '');
  return match ? match[1] : null;
}

export function emptyState() {
  return { v: 1, total: 0, last: null, chapters: {} };
}

/** 저장된 글을 읽는다. 깨졌거나 다른 버전이면 빈 상태로 시작한다. */
export function parseState(text) {
  try {
    const data = JSON.parse(text);
    if (!data || data.v !== 1 || typeof data.chapters !== 'object' || data.chapters === null) return emptyState();
    return { ...emptyState(), ...data };
  } catch {
    return emptyState();
  }
}

function entry(state, id) {
  state.chapters[id] = state.chapters[id] || { answers: {} };
  state.chapters[id].answers = state.chapters[id].answers || {};
  return state.chapters[id];
}

/** 장을 열었다. 제목과 번호를 함께 남겨 서가가 책 내용 없이도 "이어 읽기"를 그릴 수 있게 한다. */
export function markOpened(state, chapter, total, now) {
  const e = entry(state, chapter.id);
  e.title = chapter.title;
  e.num = chapter.num;
  e.opened = e.opened || now;
  state.total = total;
  state.last = { id: chapter.id, title: chapter.title, num: chapter.num, at: now };
  return state;
}

export function markRead(state, id, now) {
  const e = entry(state, id);
  e.opened = e.opened || now;
  e.read = e.read || now;
  return state;
}

/** 이 장 복습 문항 하나의 답. 이 장의 문항을 모두 맞히면 복습 완료 시각을 남긴다. */
export function recordAnswer(state, id, index, correct, count, now) {
  const e = entry(state, id);
  if (correct) e.answers[index] = true;
  const solved = Object.keys(e.answers).filter(k => Number(k) < count).length;
  if (count > 0 && solved >= count && !e.reviewed) e.reviewed = now;
  return state;
}

/** 앞 장 다시 꺼내기 문항의 답. 맞히면 그 장을 다시 떠올린 시각을 갱신하고, 다음에는 다른 문항이 나온다. */
export function recordRecall(state, id, correct, now) {
  const e = entry(state, id);
  if (correct) {
    e.recalled = now;
    e.recalls = (e.recalls || 0) + 1;
  }
  return state;
}

/** 예측 확인: 실험 전에 예측을 적고(예측), 실험을 해 본 뒤(실험) 덮개를 들춰 맞았는지 고른다(확인). */
export const VERDICTS = { hit: '맞았다', partly: '일부 맞았다', miss: '빗나갔다' };

/** 실험 전 예측 칸의 글. n은 장 안에서 몇 번째 예측 칸인지(0부터). 판정이 없는 빈 글은 지운다. */
export function recordPrediction(state, id, n, text, now) {
  const e = entry(state, id);
  e.predictions = e.predictions || {};
  const clean = String(text || '').trim().slice(0, 200);
  const old = e.predictions[n] || {};
  if (!clean && !old.verdict) delete e.predictions[n];
  else e.predictions[n] = { ...old, text: clean, at: now };
  return state;
}

/** 실험을 해 본 뒤 덮개를 들추고 예측이 맞았는지 스스로 고른 결과. 알 수 없는 값은 무시한다. */
export function judgePrediction(state, id, n, verdict, now) {
  if (!Object.hasOwn(VERDICTS, verdict)) return state;
  const e = entry(state, id);
  e.predictions = e.predictions || {};
  e.predictions[n] = { text: '', ...e.predictions[n], verdict, judged: now };
  return state;
}

export function resetChapterReview(state, id) {
  const e = entry(state, id);
  e.answers = {};
  delete e.reviewed;
  return state;
}

export function level(chapter) {
  if (!chapter) return 'none';
  if (chapter.reviewed) return 'reviewed';
  if (chapter.read) return 'read';
  if (chapter.opened) return 'opened';
  return 'none';
}

/** 책 한 권의 요약. total은 책이 알려 준 장 수(없으면 저장된 값). 읽음은 끝까지 읽었거나 복습을 마친 장이다. */
export function summary(state, total = state.total) {
  const chapters = Object.values(state.chapters || {});
  const count = name => chapters.filter(c => LEVELS.indexOf(level(c)) >= LEVELS.indexOf(name)).length;
  const read = Math.min(count('read'), total || Infinity);
  return {
    total: total || 0,
    opened: count('opened'),
    read,
    reviewed: count('reviewed'),
    judged: chapters.reduce((sum, c) => sum + Object.values(c.predictions || {}).filter(p => p.verdict).length, 0),
    percent: total ? Math.round((read / total) * 100) : 0,
    last: state.last || null,
  };
}

/** 앞 장 다시 꺼내기: 현재 장보다 앞에 있고 복습 문항이 있는 장 중에서
    끝까지 읽었거나 복습한 장을 먼저(펼쳐 보기만 한 장은 세지 않는다), 그중 가장 오래 떠올리지 않은 장을 고른다. 같으면 앞 장이 먼저다.
    문항은 그 장을 맞힌 횟수만큼 돌아가며 고른다. 고를 장이 없으면 null. */
export function pickRecall(order, currentId, state, review) {
  const at = order.indexOf(currentId);
  if (at <= 0) return null;
  const touched = c => (c ? Math.max(c.recalled || 0, c.reviewed || 0, c.read || 0, c.opened || 0) : 0);
  const candidates = order.slice(0, at)
    .filter(id => (review[id] || []).length > 0)
    .map((id, position) => ({ id, position, c: state.chapters[id] }));
  if (!candidates.length) return null;
  const seen = candidates.filter(x => x.c && (x.c.read || x.c.reviewed));
  const pool = seen.length ? seen : candidates.slice(-1);
  pool.sort((a, b) => touched(a.c) - touched(b.c) || a.position - b.position);
  const pick = pool[0];
  const questions = review[pick.id];
  return { id: pick.id, index: ((pick.c && pick.c.recalls) || 0) % questions.length };
}
