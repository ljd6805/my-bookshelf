"""Draw the shared-concept atlas as a line chart: books as columns, concepts as lines.

Each concept is one horizontal line that stops at every book where it appears, so the map
never draws crossing edges and grows by one column per book and one row per concept.
Columns follow the shelf order, so books of one field (spine_category) stand together under
a field header. Rows are grouped by the field where a concept is taught most, which makes
the bridges between fields visible as lines that leave their own group.
Everything here is plain HTML that works without JavaScript; the script only lights a
column and opens one concept at a time. The field bar above the curation filters rows.
"""
if __package__:
    from .shelf_renderer import esc
else:
    from shelf_renderer import esc


def owner_of(url, books):
    return next(b['id'] for b in books if url.startswith(b['url']))


def short_name(book):
    return book.get('short_title') or book.get('spine_title') or book['title']


def field_of(book):
    return book.get('spine_category') or '기타'


def columns(concepts, books):
    """Books that carry at least one concept, in shelf order."""
    used = {owner_of(url, books) for c in concepts for url in c['chapters']}
    return [b for b in books if b['id'] in used]


def fields_in_order(cols):
    return list(dict.fromkeys(field_of(b) for b in cols))


def concept_row(concept, cols, books):
    """Chapter counts per column and the field this concept is mostly taught in."""
    counts = {}
    for url in concept['chapters']:
        bid = owner_of(url, books)
        counts[bid] = counts.get(bid, 0) + 1
    index = [i for i, b in enumerate(cols) if b['id'] in counts]
    order = fields_in_order(cols)
    weight = {}
    for b in cols:
        weight[field_of(b)] = weight.get(field_of(b), 0) + counts.get(b['id'], 0)
    home = max(order, key=lambda f: (weight[f], -order.index(f)))
    fields = [f for f in order if any(field_of(b) == f and b['id'] in counts for b in cols)]
    return {'concept': concept, 'counts': counts, 'first': index[0], 'last': index[-1],
            'home': home, 'fields': fields}


def grouped_rows(concepts, cols, books):
    """[(field, rows)] with groups in column order and wide concepts first in each group."""
    rows = [concept_row(c, cols, books) for c in concepts]
    groups = []
    for field in fields_in_order(cols):
        members = [r for r in rows if r['home'] == field]
        members.sort(key=lambda r: (-len(r['counts']), r['first'], r['concept']['id']))
        if members:
            groups.append((field, members))
    return groups


def book_head(book, starts):
    edge = ' field-start' if starts else ''
    return (f'<th scope="col" class="atlas-book tone-{esc(book.get("color", "aqua"))}{edge}" '
            f'data-book="{esc(book["id"])}"><a href="{esc(book["url"])}" title="{esc(book["title"])}">'
            f'<span class="atlas-spine" aria-hidden="true">{esc(book.get("spine_title") or short_name(book))}</span>'
            f'<span class="sr-only">{esc(book["title"])}</span></a></th>')


def head(cols):
    spans, starts = [], set()
    for field in fields_in_order(cols):
        members = [b for b in cols if field_of(b) == field]
        starts.add(members[0]['id'])
        spans.append(f'<th scope="colgroup" colspan="{len(members)}" class="atlas-field field-start">'
                     f'<span>{esc(field)}</span></th>')
    books = ''.join(book_head(b, b['id'] in starts) for b in cols)
    return (f'<thead><tr class="atlas-fields"><td class="atlas-corner" rowspan="2">'
            f'<span>개념</span><span aria-hidden="true">책 →</span></td>{"".join(spans)}</tr>'
            f'<tr class="atlas-books">{books}</tr></thead>'), starts


def cell(row, i, book, starts):
    count = row['counts'].get(book['id'], 0)
    kind = [k for k, on in [('on-line', row['first'] <= i <= row['last']), ('from', i == row['first']),
                            ('to', i == row['last']), ('field-start', book['id'] in starts)] if on]
    if not count:
        return f'<td class="atlas-cell {" ".join(kind)}" data-book="{esc(book["id"])}"></td>'
    size = min(count, 3)
    return (f'<td class="atlas-cell {" ".join(kind)}" data-book="{esc(book["id"])}">'
            f'<span class="atlas-stop tone-{esc(book.get("color", "aqua"))} n{size}" title="{esc(short_name(book))} · {count}개 장">'
            f'<span aria-hidden="true">{count if count > 1 else ""}</span>'
            f'<span class="sr-only">{esc(short_name(book))} {count}개 장</span></span></td>')


def body(groups, cols, starts, card):
    width = len(cols) + 1
    parts = []
    for field, rows in groups:
        parts.append(f'<tbody class="atlas-group" data-field="{esc(field)}"><tr class="atlas-group-head">'
                     f'<th scope="rowgroup" colspan="{width}"><span class="atlas-group-label"><b>{esc(field)}</b>에서 '
                     f'주로 다루는 개념 <small>{len(rows)}개</small></span></th></tr>')
        for row in rows:
            c = row['concept']
            cells = ''.join(cell(row, i, b, starts) for i, b in enumerate(cols))
            parts.append(f'<tr class="atlas-row" data-concept="{esc(c["id"])}" data-fields="{esc(" ".join(row["fields"]))}">'
                         f'<th scope="row"><a class="atlas-node" href="#concept-{esc(c["id"])}" data-concept="{esc(c["id"])}" '
                         f'aria-expanded="false">{esc(c["name"])}<small>{len(row["counts"])}권</small></a></th>{cells}</tr>'
                         f'<tr class="atlas-detail" data-concept="{esc(c["id"])}"><td colspan="{width}">{card(c)}</td></tr>')
        parts.append('</tbody>')
    return ''.join(parts)


def render_atlas_table(concepts, books, card):
    """card(concept) -> HTML of the concept's chapter card, shown under its row."""
    cols = columns(concepts, books)
    groups = grouped_rows(concepts, cols, books)
    thead, starts = head(cols)
    return (f'<div class="atlas-scroll" tabindex="0" role="region" aria-labelledby="concept-title">'
            f'<table class="atlas-map" style="--books:{len(cols)}" aria-describedby="atlas-help">'
            f'{thead}{body(groups, cols, starts, card)}</table></div>')
