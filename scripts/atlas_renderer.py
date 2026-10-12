"""Prepare the shared-concept atlas: an island map of fields with a book-centred zoom.

The map itself is drawn in the browser (assets/atlas-view.js) from a small JSON payload, because
the zoomed view depends on the book a reader picks. Layout rules live in assets/atlas-model.mjs:
fields become islands, concepts shared by two fields become bridges, and nothing is placed by hand.
This module writes that payload and a plain list of concept cards grouped by field. The list is
what readers without JavaScript see, and the text alternative of the map for everyone else.
"""
import json

if __package__:
    from .shelf_renderer import esc, safe_book_url
else:
    from shelf_renderer import esc, safe_book_url

TONES = ['aqua', 'blue', 'violet', 'sage', 'amber', 'rose']


def owner_of(url, books):
    return next(b['id'] for b in books if url.startswith(b['url']))


def short_name(book):
    return book.get('short_title') or book.get('spine_title') or book['title']


def field_of(book):
    return book.get('spine_category') or '기타'


def fields_in_order(books):
    return list(dict.fromkeys(field_of(b) for b in books))


def concept_fields(concept, books):
    """(fields the concept touches in shelf order, field where most of its chapters are)."""
    order = fields_in_order(books)
    by_id = {b['id']: b for b in books}
    weight = {}
    for url in concept['chapters']:
        field = field_of(by_id[owner_of(url, books)])
        weight[field] = weight.get(field, 0) + 1
    fields = [f for f in order if f in weight]
    home = max(fields, key=lambda f: (weight[f], -order.index(f)))
    return fields, home


def atlas_payload(concepts, catalog):
    books = catalog['books']
    index = catalog.get('chapter_index', {})
    order = fields_in_order(books)
    return {
        'fields': [{'name': f, 'tone': TONES[i % len(TONES)]} for i, f in enumerate(order)],
        'books': [{'id': b['id'], 'title': b['title'], 'short': short_name(b), 'spine': b.get('spine_title') or short_name(b),
                   'field': field_of(b), 'color': b.get('color', 'aqua'), 'url': safe_book_url(b['url'])} for b in books],
        'concepts': [{'id': c['id'], 'name': c['name'], 'aliases': c.get('aliases', []), 'summary': c.get('summary', ''),
                      'chapters': [{'book': owner_of(u, books), 'url': safe_book_url(u), 'title': index[u]} for u in c['chapters']]}
                     for c in concepts],
    }


def payload_script(payload):
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return f'<script type="application/json" data-atlas-data>{text}</script>'


def render_atlas_list(concepts, books, card):
    """Concept cards grouped under the field where each concept is taught most."""
    groups = {}
    for concept in concepts:
        fields, home = concept_fields(concept, books)
        groups.setdefault(home, []).append((concept, fields))
    parts = []
    for field in fields_in_order(books):
        members = groups.get(field, [])
        if not members:
            continue
        cards = ''.join(f'<div class="atlas-item" data-fields="{esc("|".join(fs))}">{card(c)}</div>' for c, fs in members)
        parts.append(f'<section class="atlas-list-group" data-field="{esc(field)}"><h4><b>{esc(field)}</b>에서 주로 다루는 개념 '
                     f'<small>{len(members)}개</small></h4><div class="atlas-cards">{cards}</div></section>')
    return f'<div class="atlas-list" data-atlas-list>{"".join(parts)}</div>'


def book_picker(books):
    groups = ''
    for field in fields_in_order(books):
        options = ''.join(f'<option value="{esc(b["id"])}">{esc(short_name(b))}</option>' for b in books if field_of(b) == field)
        groups += f'<optgroup label="{esc(field)}">{options}</optgroup>'
    return (f'<label class="atlas-pick"><span>가운데 책</span><select data-atlas-pick>'
            f'<option value="">전체 섬 지도</option>{groups}</select></label>')
