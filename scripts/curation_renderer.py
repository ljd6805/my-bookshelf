"""Render the shelf's curation corner: cross-book reading paths and shared concepts.

The catalog owns the curation (learning_paths, concepts, chapter_index); each book owns
its chapters. Every link here must be a chapter listed in chapter_index so a renamed or
moved chapter fails the build instead of leaving a dead link on the shelf.
"""
if __package__:
    from .series_renderer import render_series
    from .shelf_renderer import esc, safe_book_url
    from .atlas_renderer import atlas_payload, payload_script, render_atlas_list, book_picker, owner_of, short_name, field_of
else:
    from series_renderer import render_series
    from shelf_renderer import esc, safe_book_url
    from atlas_renderer import atlas_payload, payload_script, render_atlas_list, book_picker, owner_of, short_name, field_of


def book_lookup(catalog):
    """Map book id → (short title, url prefix)."""
    return {b['id']: (short_name(b), b['url']) for b in catalog.get('books', [])}


def chapter_link(url, catalog, book_id=None):
    books, index = book_lookup(catalog), catalog.get('chapter_index', {})
    if url not in index:
        raise ValueError(f'Curation link {url} is not in chapter_index')
    owner = next((bid for bid, (_, prefix) in books.items() if url.startswith(prefix)), None)
    if owner is None or (book_id and owner != book_id):
        raise ValueError(f'Curation link {url} does not belong to book {book_id}')
    return (f'<a href="{safe_book_url(url)}"><span class="step-book">{esc(books[owner][0])}</span>'
            f'{esc(index[url])}</a>')


def path_books(path, catalog):
    names, books = [], book_lookup(catalog)
    for step in path['steps']:
        name = books[step['book_id']][0]
        if name not in names:
            names.append(name)
    return names


def tone_of(book_id, catalog):
    return next(b.get('color', 'aqua') for b in catalog['books'] if b['id'] == book_id)


def station(path, n, step, catalog):
    chapter_link(step['url'], catalog, step['book_id'])  # validates the step before drawing it
    book, title = book_lookup(catalog)[step['book_id']][0], catalog['chapter_index'][step['url']]
    return (f'<li class="station tone-{esc(tone_of(step["book_id"], catalog))}">'
            f'<a class="station-link" href="#path-{esc(path["id"])}-{n}" data-stop="{n}">'
            f'<span class="station-dot" aria-hidden="true">{n}</span>'
            f'<span class="station-book">{esc(book)}</span>'
            f'<span class="station-title">{esc(title.split(" · ", 1)[-1])}</span>'
            f'<span class="station-time">{int(step["minutes"])}분</span></a></li>')


def stop(path, n, step, catalog):
    book = book_lookup(catalog)[step['book_id']][0]
    return (f'<section class="route-stop tone-{esc(tone_of(step["book_id"], catalog))}" '
            f'id="path-{esc(path["id"])}-{n}" data-stop="{n}">'
            f'<p class="stop-kicker">{n}번째 정거장 · {esc(book)} · 약 {int(step["minutes"])}분</p>'
            f'<h4>{chapter_link(step["url"], catalog, step["book_id"])}</h4>'
            f'<p class="stop-task">{esc(step["task"])}</p><dl>'
            f'<div><dt>이 장으로 가는 이유</dt><dd>{esc(step["why"])}</dd></div>'
            f'<div><dt>남길 기록</dt><dd>{esc(step["record"])}</dd></div></dl></section>')


def book_field(book_id, catalog):
    return next(field_of(b) for b in catalog['books'] if b['id'] == book_id)


def path_fields(path, catalog):
    """Fields a path passes through, and its home: the field with most stops (later wins ties)."""
    steps = [book_field(s['book_id'], catalog) for s in path['steps']]
    home = path.get('category') or max(reversed(steps), key=steps.count)
    return list(dict.fromkeys(steps)), home


def shelf_fields(catalog):
    """Fields in shelf order, only those that curation actually reaches."""
    used = {s['book_id'] for p in catalog.get('learning_paths', []) for s in p['steps']}
    for concept in catalog.get('concepts', []):
        used.update(owner_of(url, catalog['books']) for url in concept['chapters'])
    return list(dict.fromkeys(field_of(b) for b in catalog['books'] if b['id'] in used))


def pick(path, first, catalog):
    minutes = sum(int(s['minutes']) for s in path['steps'])
    dots = ''.join(f'<i class="tone-{esc(tone_of(bid, catalog))}"></i>'
                   for bid in dict.fromkeys(s['book_id'] for s in path['steps']))
    fields = path_fields(path, catalog)[0]
    return (f'<a class="route-pick" role="tab" id="tab-{esc(path["id"])}" href="#path-{esc(path["id"])}" '
            f'aria-controls="path-{esc(path["id"])}" aria-selected="{str(first).lower()}" '
            f'data-fields="{esc("|".join(fields))}">'
            f'<span class="pick-meta"><span class="pick-dots" aria-hidden="true">{dots}</span>'
            f'{len(path["steps"])}개 장 · 약 {minutes}분</span>'
            f'<span class="pick-title">{esc(path["title"])}</span></a>')


def picker(paths, catalog):
    """Question cards grouped under the field each path mostly stays in."""
    groups, first = [], None
    for field in shelf_fields(catalog):
        members = [p for p in paths if path_fields(p, catalog)[1] == field]
        if members:
            first = first or members[0]
            tabs = ''.join(pick(p, p is first, catalog) for p in members)
            groups.append(f'<div class="route-group" role="presentation" data-field="{esc(field)}">'
                          f'<p class="route-group-name" role="presentation">{esc(field)} <small>{len(members)}개 노선</small></p>'
                          f'<div class="route-group-picks" role="presentation">{tabs}</div></div>')
    return ('<div class="route-picker" role="tablist" aria-label="질문으로 읽기 경로 고르기">'
            + ''.join(groups) + '</div>')


def field_bar(catalog):
    buttons = ''.join(f'<button type="button" data-field="{esc(f)}" aria-pressed="false">{esc(f)}</button>'
                      for f in shelf_fields(catalog))
    return ('<div class="field-bar" role="group" aria-label="분야로 노선과 개념 거르기">'
            '<span class="field-bar-label">분야</span>'
            '<button type="button" data-field="" aria-pressed="true">모든 분야</button>' + buttons + '</div>')


def render_path(path, catalog):
    steps = path['steps']
    if not steps:
        raise ValueError(f'Learning path {path["id"]} needs at least one step')
    minutes = sum(int(s['minutes']) for s in steps)
    books = ' → '.join(esc(name) for name in path_books(path, catalog))
    checks = ''.join(f'<li>{esc(c)}</li>' for c in path.get('checks', []))
    stations = ''.join(station(path, n, s, catalog) for n, s in enumerate(steps, 1))
    stops = ''.join(stop(path, n, s, catalog) for n, s in enumerate(steps, 1))
    return (f'<article class="route" id="path-{esc(path["id"])}" role="tabpanel" '
            f'aria-labelledby="tab-{esc(path["id"])}">'
            f'<header class="route-head"><p class="route-books">{books} · 약 {minutes}분 · {len(steps)}단계</p>'
            f'<h3>{esc(path["title"])}</h3><p class="route-question">{esc(path["question"])}</p>'
            '<dl class="route-meta">'
            f'<div><dt>출발 상황</dt><dd>{esc(path["start"])}</dd></div>'
            f'<div><dt>이런 분께</dt><dd>{esc(path["audience"])}</dd></div>'
            f'<div><dt>미리 알면 좋은 것</dt><dd>{esc(path["prerequisites"])}</dd></div></dl></header>'
            f'<ol class="route-line" style="--stops:{len(steps)}" aria-label="정거장 {len(steps)}곳">{stations}</ol>'
            f'<div class="route-stops">{stops}</div>'
            '<footer class="route-foot"><div class="route-goal"><p class="stop-kicker">종착역 · 도전 과제</p>'
            f'<p>{esc(path["challenge"])}</p></div>'
            f'<div class="route-checks"><p class="stop-kicker">스스로 점검하기</p><ul>{checks}</ul></div>'
            f'<a class="button primary route-go" href="{safe_book_url(steps[0]["url"])}">'
            '첫 정거장부터 읽기 <span aria-hidden="true">→</span></a></footer></article>')


def render_concept(concept, catalog):
    books = catalog['books']
    links = ''.join(f'<li class="tone-{esc(tone_of(owner_of(url, books), catalog))}">'
                    f'{chapter_link(url, catalog)}</li>' for url in concept['chapters'])
    aliases = ', '.join(concept.get('aliases', []))
    return (f'<article class="concept-card" id="concept-{esc(concept["id"])}" data-concept="{esc(concept["id"])}">'
            f'<h4>{esc(concept["name"])}</h4><p class="concept-alias" lang="en">{esc(aliases)}</p>'
            f'<p class="concept-summary">{esc(concept["summary"])}</p>'
            f'<p class="stop-kicker">{len(concept["chapters"])}개 장에서 만납니다</p><ul>{links}</ul></article>')


def render_atlas(concepts, catalog):
    if not concepts:
        return ''
    cards = render_atlas_list(concepts, catalog['books'], lambda c: render_concept(c, catalog))
    return ('<div class="concept-atlas" data-atlas><div class="atlas-head">'
            '<p class="curation-eyebrow">지식 지도</p><h3 id="concept-title">분야는 섬, 함께 쓰는 개념은 다리</h3>'
            '<p id="atlas-help">분야마다 섬 하나를 그리고 그 분야의 책을 섬 위에 세웠습니다. 두 분야가 함께 쓰는 개념은 '
            '섬 사이 다리가 되고, 다리가 굵을수록 함께 쓰는 개념이 많습니다. 섬이나 다리를 누르면 옆에 개념이 나오고, '
            '책등을 누르거나 가운데 책을 고르면 그 책 하나를 가운데 두고 이어지는 개념과 책만 보여 줍니다.</p></div>'
            '<div class="atlas-tools" data-atlas-tools hidden><div class="atlas-view" role="group" aria-label="지식 지도 보기 방식">'
            '<button type="button" data-view="map" aria-pressed="true">지도</button>'
            '<button type="button" data-view="list" aria-pressed="false">목록</button></div>'
            f'{book_picker(catalog["books"])}</div>'
            '<div class="atlas-stage" data-atlas-stage hidden><div class="atlas-canvas" data-atlas-canvas></div>'
            '<aside class="atlas-panel" data-atlas-panel aria-live="polite" aria-label="고른 섬·다리·개념 설명"></aside></div>'
            f'{cards}{payload_script(atlas_payload(concepts, catalog))}</div>')


def render_curation(catalog):
    paths, concepts = catalog.get('learning_paths', []), catalog.get('concepts', [])
    if not paths and not concepts:
        return ''
    ids = [p['id'] for p in paths] + [c['id'] for c in concepts]
    if len(ids) != len(set(ids)):
        raise ValueError('Learning path and concept IDs must be unique')
    routes = ''.join(render_path(p, catalog) for p in paths)
    explorer = (f'<div class="route-explorer" data-route-explorer>{picker(paths, catalog)}'
                f'<div class="route-panels">{routes}</div></div>') if paths else ''
    return ('<div class="curation-intro"><p class="curation-eyebrow">서재의 큐레이션</p>'
            '<h2 id="curation-title">질문 하나로 여러 책을 건너는 읽기 노선</h2>'
            '<p>책 한 권을 처음부터 끝까지 읽지 않아도 됩니다. 궁금한 질문을 고르면 여러 책의 장을 '
            '정거장처럼 이어 갑니다. 정거장마다 그 장으로 가는 이유와 남겨 둘 기록이 있습니다. '
            '분야를 고르면 그 분야를 지나는 노선과 개념만 남습니다.</p></div>'
            f'{field_bar(catalog)}{explorer}{render_series(catalog)}{render_atlas(concepts, catalog)}')


def concept_terms(catalog):
    """Concept names and aliases per book, so the shelf search finds books by concept."""
    books, terms = book_lookup(catalog), {}
    for concept in catalog.get('concepts', []):
        for url in concept['chapters']:
            owner = next((bid for bid, (_, prefix) in books.items() if url.startswith(prefix)), None)
            bucket = terms.setdefault(owner, [])
            for word in [concept['name'], *concept.get('aliases', [])]:
                if word not in bucket:
                    bucket.append(word)
    return terms
