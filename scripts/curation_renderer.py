"""Render the shelf's curation corner: cross-book reading paths and shared concepts.

The catalog owns the curation (learning_paths, concepts, chapter_index); each book owns
its chapters. Every link here must be a chapter listed in chapter_index so a renamed or
moved chapter fails the build instead of leaving a dead link on the shelf.
"""
if __package__:
    from .shelf_renderer import esc, safe_book_url
    from .atlas_renderer import render_atlas_svg, owner_of
else:
    from shelf_renderer import esc, safe_book_url
    from atlas_renderer import render_atlas_svg, owner_of


def book_lookup(catalog):
    """Map book id → (short title, url prefix)."""
    return {b['id']: (b.get('short_title', b['title']), b['url']) for b in catalog.get('books', [])}


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


def picker(paths, catalog):
    tabs = []
    for i, path in enumerate(paths):
        minutes = sum(int(s['minutes']) for s in path['steps'])
        dots = ''.join(f'<i class="tone-{esc(tone_of(bid, catalog))}"></i>'
                       for bid in dict.fromkeys(s['book_id'] for s in path['steps']))
        tabs.append(f'<a class="route-pick" role="tab" id="tab-{esc(path["id"])}" href="#path-{esc(path["id"])}" '
                    f'aria-controls="path-{esc(path["id"])}" aria-selected="{str(i == 0).lower()}">'
                    f'<span class="pick-meta"><span class="pick-dots" aria-hidden="true">{dots}</span>'
                    f'{len(path["steps"])}개 장 · 약 {minutes}분</span>'
                    f'<span class="pick-title">{esc(path["title"])}</span></a>')
    return ('<div class="route-picker" role="tablist" aria-label="질문으로 읽기 경로 고르기">'
            + ''.join(tabs) + '</div>')


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
    cards = ''.join(render_concept(c, catalog) for c in concepts)
    legend = ''.join(f'<li><i class="tone-{esc(b.get("color", "aqua"))}"></i>{esc(b.get("short_title", b["title"]))}</li>'
                     for b in catalog['books'])
    return ('<div class="concept-atlas" data-atlas><div class="atlas-head">'
            '<p class="curation-eyebrow">지식 지도</p><h3 id="concept-title">책과 책이 만나는 개념</h3>'
            '<p id="atlas-help">같은 개념이 책마다 다른 사례로 나옵니다. 가운데 개념을 고르면 '
            '그 개념이 지나가는 책이 선으로 밝아지고, 옆에 만나는 장이 펼쳐집니다. 책등을 누르면 그 책으로 갑니다.</p></div>'
            f'<div class="atlas-body"><figure class="atlas-figure">{render_atlas_svg(concepts, catalog["books"])}'
            f'<figcaption><ul class="atlas-legend" aria-label="선 색이 뜻하는 책">{legend}</ul>'
            '선이 굵을수록 그 책에서 해당 개념을 다루는 장이 많습니다.</figcaption></figure>'
            f'<div class="atlas-cards" aria-live="polite">{cards}</div></div></div>')


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
            '정거장처럼 이어 갑니다. 정거장마다 그 장으로 가는 이유와 남겨 둘 기록이 있습니다.</p></div>'
            f'{explorer}{render_atlas(concepts, catalog)}')


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
