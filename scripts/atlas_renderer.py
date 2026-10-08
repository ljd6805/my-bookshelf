"""Draw the shared-concept atlas: four books as glass spines, concepts as labels between them.

Layout is computed here, deterministically, so the map is plain SVG that works without
JavaScript. Each concept starts at the weighted centre of the books it appears in and is
then nudged until no two labels overlap. Script only adds highlighting and the side panel.
"""
import math

if __package__:
    from .shelf_renderer import esc
else:
    from shelf_renderer import esc

WIDTH, HEIGHT = 960, 700
# Books stand evenly on an ellipse, AI Book at the bottom as the shared destination, so a new
# book in the catalog gets its own place on the map without hand-placed coordinates.
CENTER, RADIUS = (480, 340), (400, 268)
TONES = {'aqua': '#1e737b', 'blue': '#345d95', 'violet': '#6e508e', 'sage': '#517353',
         'amber': '#a66f26', 'rose': '#a15a50'}


def owner_of(url, books):
    return next(b['id'] for b in books if url.startswith(b['url']))


def short_name(book):
    return book.get('short_title') or book.get('spine_title') or book['title']


def book_slots(books):
    order = sorted(books, key=lambda b: b['id'] != 'ai-book-interactive')
    slots = {}
    for i, book in enumerate(order):
        angle = math.pi / 2 + 2 * math.pi * i / len(order)
        slots[book['id']] = (round(CENTER[0] + RADIUS[0] * math.cos(angle)),
                             round(CENTER[1] + RADIUS[1] * math.sin(angle)))
    return slots


def label_width(text):
    return 32 + 17.5 * len(text)


def overlaps(a, b, gap=12):
    return (abs(a['x'] - b['x']) < (a['w'] + b['w']) / 2 + gap
            and abs(a['y'] - b['y']) < (a['h'] + b['h']) / 2 + gap)


def inside(n):
    return n['w'] / 2 + 8 <= n['x'] <= WIDTH - n['w'] / 2 - 8 and 24 <= n['y'] <= HEIGHT - 24


def place(node, taken):
    """Walk a widening spiral from the concept's anchor to the first free spot."""
    ax, ay = node['x'], node['y']
    for step in range(4000):
        radius, angle = 3 * math.sqrt(step), step * 2.39996  # golden-angle spiral
        node['x'], node['y'] = ax + radius * math.cos(angle) * 1.8, ay + radius * math.sin(angle)
        if inside(node) and not any(overlaps(node, other) for other in taken):
            return node
    raise ValueError(f"No room on the concept map for {node['id']}; enlarge the map")


def layout(concepts, books):
    slots = book_slots(books)
    taken = [{'x': x, 'y': y + 12, 'w': 130, 'h': 140} for x, y in slots.values()]
    nodes = []
    for concept in concepts:
        owners = [owner_of(url, books) for url in concept['chapters']]
        x = sum(slots[o][0] for o in owners) / len(owners)
        y = sum(slots[o][1] for o in owners) / len(owners)
        nodes.append({'id': concept['id'], 'x': x, 'y': y, 'w': label_width(concept['name']),
                      'h': 40, 'owners': owners})
    # Concepts tied to many chapters claim their spot first; the rest settle around them.
    for node in sorted(nodes, key=lambda n: (-len(n['owners']), n['id'])):
        taken.append(place(node, taken))
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
            f'<text class="atlas-book-name" x="{x}" y="{y + 76}">{esc(short_name(book))}</text></a>')


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
