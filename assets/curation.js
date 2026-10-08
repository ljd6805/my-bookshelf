/* 서가 큐레이션의 동작. HTML은 build_catalog.py가 미리 만들어 두므로 이 파일이 없어도
   모든 노선·정거장·개념 카드가 펼쳐진 채로 읽힙니다. 여기서는 한 번에 하나만 보이게 하고
   개념 지도에서 선을 밝히는 일만 합니다. */

function selectStop(route, n) {
  route.querySelectorAll('.station-link').forEach(link => {
    if (link.dataset.stop === String(n)) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  route.querySelectorAll('.route-stop').forEach(stop => {
    stop.classList.toggle('is-active', stop.dataset.stop === String(n));
  });
}

function selectRoute(explorer, id, focus = false) {
  const tabs = [...explorer.querySelectorAll('[role=tab]')];
  tabs.forEach(tab => {
    const on = tab.getAttribute('aria-controls') === id;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  });
  explorer.querySelectorAll('.route').forEach(route => route.classList.toggle('is-active', route.id === id));
}

export function setupRoutes(explorer) {
  if (!explorer) return;
  const tabs = [...explorer.querySelectorAll('[role=tab]')];
  explorer.classList.add('is-enhanced');
  explorer.querySelectorAll('.route').forEach(route => {
    selectStop(route, 1);
    route.querySelectorAll('.station-link').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      selectStop(route, link.dataset.stop);
      if (matchMedia('(max-width: 720px)').matches) {
        route.querySelector('.route-stop.is-active')?.scrollIntoView({ block: 'nearest' });
      }
    }));
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      selectRoute(explorer, tab.getAttribute('aria-controls'));
    });
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tabs[(index + step + tabs.length) % tabs.length];
      selectRoute(explorer, next.getAttribute('aria-controls'), true);
    });
  });
  const fromHash = tabs.find(tab => `#${tab.getAttribute('aria-controls')}` === location.hash);
  selectRoute(explorer, (fromHash || tabs[0]).getAttribute('aria-controls'));
}

function light(map, { concept, book }) {
  const edges = [...map.querySelectorAll('.atlas-edge')];
  const lit = edges.filter(e => (concept && e.dataset.concept === concept) || (book && e.dataset.book === book));
  const concepts = new Set(lit.map(e => e.dataset.concept));
  const books = new Set(lit.map(e => e.dataset.book));
  edges.forEach(e => e.classList.toggle('is-lit', lit.includes(e)));
  map.querySelectorAll('.atlas-node').forEach(n => n.classList.toggle('is-lit', concepts.has(n.dataset.concept)));
  map.querySelectorAll('.atlas-book').forEach(b => b.classList.toggle('is-lit', books.has(b.dataset.book)));
  map.dataset.active = concept || book;
}

export function setupAtlas(atlas) {
  const map = atlas?.querySelector('.atlas-map');
  if (!map) return;
  const nodes = [...map.querySelectorAll('.atlas-node')];
  const cards = [...atlas.querySelectorAll('.concept-card')];
  let current = nodes[0]?.dataset.concept;
  function activate(id) {
    current = id;
    nodes.forEach(n => n.classList.toggle('is-active', n.dataset.concept === id));
    cards.forEach(c => c.classList.toggle('is-active', c.dataset.concept === id));
    light(map, { concept: id });
  }
  atlas.classList.add('is-enhanced');
  nodes.forEach(node => {
    node.addEventListener('click', event => { event.preventDefault(); activate(node.dataset.concept); });
    node.addEventListener('focus', () => activate(node.dataset.concept));
    node.addEventListener('pointerenter', () => light(map, { concept: node.dataset.concept }));
    node.addEventListener('pointerleave', () => light(map, { concept: current }));
  });
  map.querySelectorAll('.atlas-book').forEach(book => {
    book.addEventListener('pointerenter', () => light(map, { book: book.dataset.book }));
    book.addEventListener('pointerleave', () => light(map, { concept: current }));
  });
  activate(current);
}
