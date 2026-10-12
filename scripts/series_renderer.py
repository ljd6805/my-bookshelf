"""Render the shelf's series corner: each series is one rail of volumes read in order.

The catalog owns the series list (catalog.series): an id, a title, a one-line summary and
the ordered volumes. A volume with book_id links to that published book; a volume without
one is shown as writing or planned, so a series can be announced before every volume exists.
Adding a series or a volume is a data change only; nothing here names a particular series.
"""
if __package__:
    from .shelf_renderer import esc, safe_book_url
    from .atlas_renderer import field_of
else:
    from shelf_renderer import esc, safe_book_url
    from atlas_renderer import field_of

STATUS = {'writing': '집필 중', 'planned': '계획'}


def check_series(series, books):
    """Raise ValueError for a series the shelf cannot draw honestly."""
    by_id = {b['id']: b for b in books}
    numbers = [v['number'] for v in series['volumes']]
    if numbers != sorted(set(numbers)) or not numbers:
        raise ValueError(f'series {series["id"]}: volume numbers must be unique and ascending')
    for v in series['volumes']:
        bid = v.get('book_id')
        if bid and bid not in by_id:
            raise ValueError(f'series {series["id"]}: volume {v["number"]} names unknown book {bid}')
        if not bid and v.get('status', 'planned') not in STATUS:
            raise ValueError(f'series {series["id"]}: volume {v["number"]} needs book_id or status writing|planned')


def volume(series, v, books, total):
    """One volume card; published volumes link to the book, others say how far along they are."""
    book = books.get(v.get('book_id')) if v.get('book_id') else None
    live = book is not None and book.get('status') == 'published'
    no = f'{v["number"]:02d}'
    tone = book.get('color', 'aqua') if book else 'aqua'
    meta = book.get('cover_meta', '') if live else STATUS.get(v.get('status', 'planned'), '준비 중')
    inner = (f'<span class="vol-spine" aria-hidden="true"><b>{no}</b></span>'
             f'<span class="vol-text"><span class="vol-no">{no}권</span>'
             f'<span class="vol-title">{esc(v["title"])}</span><span class="vol-meta">{esc(meta)}</span></span>')
    label = f'{esc(series["title"])} {v["number"]}권 / {total}권'
    if live:
        why = f'<span class="vol-why">{esc(v["next_why"])}</span>' if v.get('next_why') else ''
        return (f'<li class="vol is-live tone-{esc(tone)}" data-volume="{v["number"]}">'
                f'<a href="{safe_book_url(book["url"])}" aria-label="{label}: {esc(v["title"])}">{inner}</a>{why}</li>')
    return f'<li class="vol is-later" data-volume="{v["number"]}" aria-label="{label}: {esc(v["title"])}, {esc(meta)}">{inner}</li>'


def render_one(series, catalog):
    books = {b['id']: b for b in catalog['books']}
    check_series(series, catalog['books'])
    vols = series['volumes']
    live = [v for v in vols if v.get('book_id') in books and books[v['book_id']].get('status') == 'published']
    fields = list(dict.fromkeys(field_of(books[v['book_id']]) for v in live))
    first = books[live[0]['book_id']]['url'] if live else None
    cards = ''.join(volume(series, v, books, len(vols)) for v in vols)
    go = (f'<a class="button primary series-go" href="{safe_book_url(first)}" data-series-go>'
          f'<span data-go-label>{live[0]["number"]}권부터 읽기</span> <span aria-hidden="true">→</span></a>') if live else ''
    return (f'<article class="series" id="series-{esc(series["id"])}" data-series="{esc(series["id"])}" '
            f'data-fields="{esc("|".join(fields))}">'
            f'<header class="series-head"><div><p class="stop-kicker">시리즈 · 출간 {len(live)} / {len(vols)}권</p>'
            f'<h4>{esc(series["title"])}</h4><p class="series-summary">{esc(series.get("summary", ""))}</p></div>{go}</header>'
            f'<div class="series-progress" aria-hidden="true"><i style="width:{100 * len(live) / len(vols):.1f}%"></i></div>'
            f'<ol class="series-rail" aria-label="{esc(series["title"])} 권 순서">{cards}</ol></article>')


def render_series(catalog):
    series = catalog.get('series', [])
    if not series:
        return ''
    if len({s['id'] for s in series}) != len(series):
        raise ValueError('Series IDs must be unique')
    return ('<div class="series-corner" data-series-corner><div class="atlas-head">'
            '<p class="curation-eyebrow">시리즈</p><h3 id="series-title">한 권씩 이어 읽는 시리즈</h3>'
            '<p>여러 권으로 이어지는 책은 권 순서대로 놓았습니다. 다음 권 아래에는 그 권으로 넘어가는 이유가 있고, '
            '마지막으로 연 권을 기억해 두었다가 그 권부터 이어 읽게 합니다.</p></div>'
            + ''.join(render_one(s, catalog) for s in series) + '</div>')
