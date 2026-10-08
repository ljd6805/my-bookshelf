/**
 * Animate only the selected book. Native CSS/WAAPI, no render loop or 3D dependency.
 * Opening runs in four beats: pull the spine out of the shelf, carry it to the reader
 * while it turns to face the viewer, land the closed book, then swing the cover open.
 * Closing plays the same beats backwards, a little faster.
 */
const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';
const EASE_IN = 'cubic-bezier(.55,0,.8,.4)';
const SETTLE = 'cubic-bezier(.3,1.45,.55,1)';
/** Timings below are written at the original pace; 0.8 plays every beat 20% faster. */
const PACE = .8;

export function cancelMotion(dialog) {
  // Only script-driven motion; CSS animations (the book illustration) keep playing.
  dialog.getAnimations({ subtree: true })
    .filter(animation => !(window.CSSAnimation && animation instanceof CSSAnimation))
    .forEach(animation => animation.cancel());
  dialog.querySelectorAll('.book-flight, .book-cover').forEach(node => node.remove());
}

function animate(element, frames, duration, delay = 0, easing = EASE_OUT) {
  return element.animate(frames, { duration: duration * PACE, delay: delay * PACE, easing, fill: 'both' });
}

async function finish(animation) {
  try { await animation.finished; } catch { /* Closing can interrupt an opening animation. */ }
}

/** The phone layout stacks both pages, so the cover hides the whole book there. */
function isStacked(book) {
  return getComputedStyle(book).display !== 'grid';
}

function flightFor(source, dialog) {
  const rect = source.getBoundingClientRect();
  const flight = source.cloneNode(true);
  flight.removeAttribute('id');
  flight.removeAttribute('href');
  flight.removeAttribute('data-resource');
  flight.classList.remove('is-selected');
  flight.classList.add('book-flight');
  flight.setAttribute('aria-hidden', 'true');
  flight.tabIndex = -1;
  Object.assign(flight.style, {
    left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`,
    height: `${rect.height}px`, opacity: '1'
  });
  dialog.append(flight);
  return { flight, rect };
}

function coverFor(book) {
  const cover = document.createElement('div');
  cover.className = 'book-cover';
  cover.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  title.className = 'book-cover-title';
  title.textContent = book.querySelector('.reader-title')?.textContent || '';
  const category = document.createElement('span');
  category.className = 'book-cover-category';
  category.textContent = book.querySelector('.reader-category')?.textContent || '';
  cover.append(category, title);
  if (isStacked(book)) cover.classList.add('is-stacked');
  book.append(cover);
  return cover;
}

/** Where the flying spine lands: the cover half of the open book (or the whole book on phones). */
function landingRect(book) {
  const rect = book.getBoundingClientRect();
  if (isStacked(book)) return rect;
  return { x: rect.x + rect.width / 2, y: rect.y, width: rect.width / 2, height: rect.height };
}

/** Pull out of the shelf, lift in an arc, then turn edge-on as the closed book takes over. */
function flightFrames(rect, target) {
  const x = target.x + target.width / 2 - (rect.x + rect.width / 2);
  const y = target.y + target.height / 2 - (rect.y + rect.height / 2);
  const pull = Math.min(rect.height * .42, 96);
  const scale = Math.max(1.2, Math.min(target.height / rect.height, 2.4));
  const shadow = (blur, alpha) => `drop-shadow(0 ${blur}px ${blur}px rgba(32,63,54,${alpha}))`;
  return [
    { transform: 'translate(0,0) rotateZ(0) rotateY(0) scale(1)', filter: shadow(4, .2), opacity: 1, offset: 0 },
    { transform: `translate(0,${-pull}px) rotateZ(-4deg) rotateY(-8deg) scale(1.06)`, filter: shadow(10, .3), opacity: 1, offset: .32 },
    { transform: `translate(${x * .45}px,${y * .45 - 70}px) rotateZ(5deg) rotateY(-38deg) scale(${(1 + scale) / 2})`, filter: shadow(26, .32), opacity: 1, offset: .62 },
    { transform: `translate(${x}px,${y}px) rotateZ(0) rotateY(-88deg) scale(${scale})`, filter: shadow(30, .25), opacity: 0, offset: 1 }
  ];
}

/** Neighbouring spines lean away for a moment, as if the book was really drawn out between them. */
function nudgeNeighbours(source, direction) {
  [[source.previousElementSibling, -1], [source.nextElementSibling, 1]].forEach(([book, side]) => {
    if (!book?.classList.contains('glass-book') || !book.animate) return;
    book.animate([
      { transform: 'perspective(1100px) translateY(0) rotateY(-5deg)' },
      { transform: `perspective(1100px) translateX(${side * 4}px) rotateZ(${side * 2.5 * direction}deg) rotateY(-5deg)` },
      { transform: 'perspective(1100px) translateY(0) rotateY(-5deg)' }
    ], { duration: 620 * PACE, easing: SETTLE });
  });
}

function bookFrames(stacked) {
  const start = stacked ? 'translateY(60px) scale(.82)' : 'translateY(50px) rotateX(16deg) rotateY(-24deg) scale(.72)';
  return [
    { opacity: 0, transform: start, offset: 0 },
    { opacity: 1, offset: .35 },
    { opacity: 1, transform: 'translateY(0) rotateX(0) rotateY(0) scale(1)', offset: 1 }
  ];
}

function coverFrames(stacked) {
  const shut = stacked ? 'perspective(1100px) rotateY(0deg)' : 'perspective(1600px) rotateY(-5deg)';
  const open = stacked ? 'perspective(1100px) rotateY(-95deg)' : 'perspective(1600px) rotateY(-90deg)';
  return [{ transform: shut, opacity: 1 }, { transform: open, opacity: stacked ? 0 : 1 }];
}

export async function openMotion(dialog, source, reduced) {
  const book = dialog.querySelector('.open-book');
  if (reduced || !book.animate) return;
  const stacked = isStacked(book);
  const { flight, rect } = flightFor(source, dialog);
  const cover = coverFor(book);
  nudgeNeighbours(source, 1);
  const motions = [
    animate(flight, flightFrames(rect, landingRect(book)), 820, 0, 'cubic-bezier(.45,.05,.3,1)'),
    animate(book, bookFrames(stacked), 560, 560),
    animate(cover, coverFrames(stacked), 440, 1080, EASE_IN)
  ];
  if (!stacked) {
    motions.push(animate(book.querySelector('.leaf-left'), [
      { transform: 'perspective(1600px) rotateY(90deg)' }, { transform: 'perspective(1600px) rotateY(5deg)' }
    ], 620, 1520, SETTLE));
    motions.push(animate(book.querySelector('.leaf-right'), [
      { transform: 'rotateY(-5deg)' }, { transform: 'rotateY(-9deg)', offset: .4 }, { transform: 'rotateY(-5deg)' }
    ], 620, 1520, SETTLE));
  }
  await Promise.all(motions.map(finish));
  flight.remove();
  cover.remove();
}

export async function closeMotion(dialog, source, reduced) {
  const book = dialog.querySelector('.open-book');
  if (reduced || !book.animate) return;
  const stacked = isStacked(book);
  const cover = coverFor(book);
  const motions = [animate(cover, coverFrames(stacked).reverse(), 300, stacked ? 0 : 240, EASE_OUT)];
  if (!stacked) {
    motions.push(animate(book.querySelector('.leaf-left'), [
      { transform: 'perspective(1600px) rotateY(5deg)' }, { transform: 'perspective(1600px) rotateY(90deg)' }
    ], 260, 0, EASE_IN));
  }
  motions.push(animate(book, bookFrames(stacked).reverse().map((frame, i) => ({
    ...frame, offset: [0, .65, 1][i]
  })), 340, stacked ? 220 : 500, EASE_IN));
  const { flight, rect } = flightFor(source, dialog);
  const frames = flightFrames(rect, landingRect(book)).reverse().map(frame => ({
    ...frame, offset: 1 - frame.offset
  }));
  motions.push(animate(flight, frames, 640, stacked ? 380 : 640, 'cubic-bezier(.45,.05,.3,1)'));
  setTimeout(() => nudgeNeighbours(source, -1), (stacked ? 900 : 1160) * PACE);
  await Promise.all(motions.map(finish));
  flight.remove();
  cover.remove();
}
