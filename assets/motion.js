/** Animate only the selected book. Native CSS/WAAPI, no render loop or 3D dependency. */
export function cancelMotion(dialog) {
  dialog.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  dialog.querySelectorAll('.book-flight').forEach(flight => flight.remove());
}

function animate(element, frames, duration, delay = 0) {
  return element.animate(frames, {
    duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both'
  });
}

async function finish(animation) {
  try { await animation.finished; } catch { /* Closing can interrupt an opening animation. */ }
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

function travelFrames(rect, target) {
  const x = target.x + target.width / 2 - (rect.x + rect.width / 2);
  const y = target.y + target.height / 2 - (rect.y + rect.height / 2);
  return [
    { transform: 'translate(0,0) rotateY(0deg) scale(1)', opacity: 1, offset: 0 },
    { transform: 'translate(0,-25px) rotateY(-15deg) scale(1.08)', opacity: 1, offset: .28 },
    { transform: `translate(${x}px,${y}px) rotateY(-72deg) scale(1.55)`, opacity: 0, offset: 1 }
  ];
}

export async function openMotion(dialog, source, reduced) {
  const book = dialog.querySelector('.open-book');
  if (reduced || !book.animate) return;
  const { flight, rect } = flightFor(source, dialog);
  const travel = animate(flight, travelFrames(rect, book.getBoundingClientRect()), 480);
  const appear = animate(book, [
    { opacity: 0, transform: 'translateY(18px) scale(.65)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ], 540, 210);
  const left = animate(book.querySelector('.leaf-left'), [
    { transform: 'rotateY(82deg)' }, { transform: 'rotateY(5deg)' }
  ], 620, 230);
  const right = animate(book.querySelector('.leaf-right'), [
    { transform: 'rotateY(-82deg)' }, { transform: 'rotateY(-5deg)' }
  ], 620, 230);
  await Promise.all([finish(travel), finish(appear), finish(left), finish(right)]);
  flight.remove();
}

export async function closeMotion(dialog, source, reduced) {
  const book = dialog.querySelector('.open-book');
  if (reduced || !book.animate) return;
  const { flight, rect } = flightFor(source, dialog);
  const frames = travelFrames(rect, book.getBoundingClientRect()).reverse().map((frame, i) => ({
    ...frame, offset: [0, .72, 1][i]
  }));
  const travel = animate(flight, frames, 430, 100);
  const disappear = animate(book, [
    { opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.72)' }
  ], 260);
  animate(book.querySelector('.leaf-left'), [
    { transform: 'rotateY(5deg)' }, { transform: 'rotateY(82deg)' }
  ], 260);
  animate(book.querySelector('.leaf-right'), [
    { transform: 'rotateY(-5deg)' }, { transform: 'rotateY(-82deg)' }
  ], 260);
  await Promise.all([finish(travel), finish(disappear)]);
  flight.remove();
}
