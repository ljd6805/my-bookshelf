"""Draw the shared-concept atlas: four books as glass spines, concepts as labels between them.

Layout is computed here, deterministically, so the map is plain SVG that works without
JavaScript. Each concept starts at the weighted centre of the books it appears in and is
then nudged until no two labels overlap. Script only adds highlighting and the side panel.
"""
if __package__:
    from .shelf_renderer import esc
else:
    from shelf_renderer import esc

WIDTH, HEIGHT = 960, 600
# Book anchors: left, top, right, bottom. AI Book sits at the bottom as the shared destination.
SLOTS = [(80, 290), (480, 62), (880, 290), (480, 500)]
TONES = {'aqua': '#1e737b', 'blue': '#345d95', 'violet': '#6e508e', 'sage': '#517353',
         'amber': '#a66f26', 'rose': '#a15a50'}


def owner_of(url, books):
    return next(b['id'] for b in books if url.startswith(b['url']))


def book_slots(books):
    order = sorted(books, key=lambda b: b['id'] == 'ai-book-interactive')
    return {b['id']: SLOTS[i % len(SLOTS)] for i, b in enumerate(order)}


def label_width(text):
    return 32 + 17.5 * len(text)


def separate(nodes, fixed, gap=12):
    """Push overlapping label boxes apart along the axis that needs the smaller move."""
    moved = False
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:] + fixed:
            dx = (a['w'] + b['w']) / 2 + gap - abs(a['x'] - b['x'])
            dy = (a['h'] + b['h']) / 2 + gap - abs(a['y'] - b['y'])
            if dx <= 0 or dy <= 0:
                continue
            moved = True
            share = 1 if b.get('fixed') else 0.5
            if dx < dy * 2.2:
                step = dx * share * (1 if a['x'] >= b['x'] else -1)
                a['x'] += step
                b['x'] -= 0 if b.get('fixed') else step
            else:
                step = dy * share * (1 if a['y'] >= b['y'] else -1)
                a['y'] += step
                b['y'] -= 0 if b.get('fixed') else step
    return moved


def layout(concepts, books):
    slots = book_slots(books)
    fixed = [{'x': x, 'y': y + 12, 'w': 130, 'h': 140, 'fixed': True} for x, y in slots.values()]
    nodes = []
    for index, concept in enumerate(concepts):
        owners = [owner_of(url, books) for url in concept['chapters']]
        x = sum(slots[o][0] for o in owners) / len(owners)
        y = sum(slots[o][1] for o in owners) / len(owners)
        nodes.append({'id': concept['id'], 'x': x + (index % 3 - 1) * 9, 'y': y + (index % 2) * 7,
                      'w': label_width(concept['name']), 'h': 40, 'owners': owners, 'ax': x, 'ay': y})
    for _ in range(400):
        if not separate(nodes, fixed):
            break
        for n in nodes:
            n['x'] = min(max(n['x'], n['w'] / 2 + 8), WIDTH - n['w'] / 2 - 8)
            n['y'] = min(max(n['y'], 24), HEIGHT - 24)
    return nodes, slots


def edges(node, slots, books):
    tones = {b['id']: TONES[b.get('color', 'aqua')] for b in books}
    result = []
    for bid in dict.fromkeys(node['owners']):
        bx, by = slots[bid]
        weight = node['owners'].count(bid)
        cx, cy = (node['x'] + bx) / 2, (node['y'] + by) / 2 - 18
        result.append(f'<path class="atlas-edge" data-concept="{esc(node["id"])}" data-book="{esc(bid)}" '
                      f'd="M{node["x"]:.0f} {node["y"]:.0f} Q{cx:.0f} {cy:.0f} {bx} {by}" '
                      f'stroke="{tones[bid]}" stroke-width="{1 + weight * 0.9:.1f}"/>')
    return ''.join(result)


def book_node(book, slot):
    x, y = slot
    tone = book.get('color', 'aqua')
    return (f'<a class="atlas-book tone-{esc(tone)}" href="{esc(book["url"])}" data-book="{esc(book["id"])}">'
            f'<title>{esc(book["title"])}</title>'
            f'<rect class="atlas-spine" x="{x - 30}" y="{y - 52}" width="60" height="104" rx="8" '
            f'fill="{TONES[tone]}"/><rect class="atlas-spine-label" x="{x - 21}" y="{y - 34}" '
            f'width="42" height="68" rx="4"/>'
            f'<text class="atlas-book-name" x="{x}" y="{y + 76}">{esc(book.get("short_title", book["title"]))}</text></a>')


def concept_node(node, concept):
    x, y, w = node['x'], node['y'], node['w']
    return (f'<a class="atlas-node" href="#concept-{esc(node["id"])}" data-concept="{esc(node["id"])}" '
            f'aria-label="{esc(concept["name"])}: {len(concept["chapters"])}개 장에서 만납니다">'
            f'<rect x="{x - w / 2:.0f}" y="{y - 20:.0f}" width="{w:.0f}" height="40" rx="20"/>'
            f'<text x="{x:.0f}" y="{y + 6:.0f}">{esc(concept["name"])}</text></a>')


def render_atlas_svg(concepts, books):
    nodes, slots = layout(concepts, books)
    by_id = {c['id']: c for c in concepts}
    lines = ''.join(edges(n, slots, books) for n in nodes)
    spines = ''.join(book_node(b, slots[b['id']]) for b in books)
    labels = ''.join(concept_node(n, by_id[n['id']]) for n in nodes)
    return (f'<svg class="atlas-map" viewBox="0 0 {WIDTH} {HEIGHT}" role="group" '
            'aria-labelledby="concept-title" aria-describedby="atlas-help">'
            f'<g class="atlas-edges" aria-hidden="true">{lines}</g>{spines}{labels}</svg>')
