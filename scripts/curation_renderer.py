"""Render the shelf's curation corner: cross-book reading paths and shared concepts.

The catalog owns the curation (learning_paths, concepts, chapter_index); each book owns
its chapters. Every link here must be a chapter listed in chapter_index so a renamed or
moved chapter fails the build instead of leaving a dead link on the shelf.
"""
if __package__:
    from .shelf_renderer import esc, safe_book_url
else:
    from shelf_renderer import esc, safe_book_url


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


def render_step(step, catalog):
    return (f'<li>{chapter_link(step["url"], catalog, step["book_id"])}'
            f'<p class="step-task">{esc(step["task"])} <span>약 {int(step["minutes"])}분</span></p>'
            f'<p class="step-why"><b>이 장으로 가는 이유</b> {esc(step["why"])}</p>'
            f'<p class="step-record"><b>남길 기록</b> {esc(step["record"])}</p></li>')


def render_path(path, catalog):
    steps = path['steps']
    if not steps:
        raise ValueError(f'Learning path {path["id"]} needs at least one step')
    minutes = sum(int(s['minutes']) for s in steps)
    books = ' → '.join(esc(name) for name in path_books(path, catalog))
    checks = ''.join(f'<li>{esc(c)}</li>' for c in path.get('checks', []))
    return (f'<article class="path-card" id="path-{esc(path["id"])}">'
            f'<p class="path-books">{books}</p><h3>{esc(path["title"])}</h3>'
            f'<p class="path-question">{esc(path["question"])}</p>'
            '<dl class="path-meta">'
            f'<div><dt>이런 분께</dt><dd>{esc(path["audience"])}</dd></div>'
            f'<div><dt>미리 알면 좋은 것</dt><dd>{esc(path["prerequisites"])}</dd></div>'
            f'<div><dt>걸리는 시간</dt><dd>약 {minutes}분 · {len(steps)}단계</dd></div></dl>'
            f'<p class="path-start"><b>출발 상황</b> {esc(path["start"])}</p>'
            f'<details class="path-detail"><summary>단계별로 보기</summary>'
            f'<ol class="path-steps">{"".join(render_step(s, catalog) for s in steps)}</ol>'
            f'<div class="path-challenge"><b>도전 과제</b><p>{esc(path["challenge"])}</p></div>'
            f'<div class="path-checks"><b>스스로 점검하기</b><ul>{checks}</ul></div></details>'
            f'<a class="button secondary path-go" href="{safe_book_url(steps[0]["url"])}">'
            '첫 단계부터 읽기 <span aria-hidden="true">→</span></a></article>')


def render_concept(concept, catalog):
    links = ''.join(f'<li>{chapter_link(url, catalog)}</li>' for url in concept['chapters'])
    aliases = ', '.join(concept.get('aliases', []))
    return (f'<li class="concept" id="concept-{esc(concept["id"])}"><details><summary>'
            f'<b>{esc(concept["name"])}</b><span class="concept-alias" lang="en">{esc(aliases)}</span>'
            f'<span class="concept-count">{len(concept["chapters"])}개 장</span></summary>'
            f'<p>{esc(concept["summary"])}</p><ul>{links}</ul></details></li>')


def render_curation(catalog):
    paths, concepts = catalog.get('learning_paths', []), catalog.get('concepts', [])
    if not paths and not concepts:
        return ''
    ids = [p['id'] for p in paths] + [c['id'] for c in concepts]
    if len(ids) != len(set(ids)):
        raise ValueError('Learning path and concept IDs must be unique')
    cards = ''.join(render_path(p, catalog) for p in paths)
    items = ''.join(render_concept(c, catalog) for c in concepts)
    return ('<div class="curation-intro"><p class="curation-eyebrow">서재의 큐레이션</p>'
            '<h2 id="curation-title">질문 하나로 여러 책을 잇는 읽기 흐름</h2>'
            '<p>책 한 권을 처음부터 끝까지 읽지 않아도 됩니다. 궁금한 질문 하나를 골라 '
            '여러 책의 장을 순서대로 이어 읽어 보세요. 단계마다 그 장으로 가는 이유와 '
            '남겨 둘 기록을 적어 두었습니다.</p></div>'
            f'<div class="path-grid">{cards}</div>'
            '<div class="concept-map" aria-labelledby="concept-title">'
            '<h3 id="concept-title">책을 가로지르는 개념</h3>'
            '<p>같은 개념이 책마다 다른 사례로 나옵니다. 개념을 펼치면 그 개념이 등장하는 '
            '장으로 바로 갈 수 있습니다.</p>'
            f'<ul class="concept-list">{items}</ul></div>')


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
