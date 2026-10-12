"""Recommend a reading order for the books of each field (each island of the knowledge map).

Nothing here is typed by hand. The order comes from the catalog itself:
- series: volumes in number order, with the previous volume's next_why as the reason;
- learning_paths: when a path visits book A before book B of the same field, that is one vote
  for reading A first, and the step's own "why" becomes the reason;
- shelf order: books with no vote between them keep the shelf order and say so.
Votes become an order by repeatedly taking a book that nothing remaining should precede
(shelf order breaks ties); a cycle of votes falls back to the book with the best vote balance.
"""
SERIES_WEIGHT = 10


def field_of(book):
    return book.get('spine_category') or '기타'


def path_sequences(catalog):
    """Each path's books in first-visit order, with the first step that visits each book."""
    sequences = []
    for path in catalog.get('learning_paths', []):
        first = {}
        for step in path.get('steps', []):
            first.setdefault(step['book_id'], step)
        sequences.append((path, list(first), first))
    return sequences


def votes_for(members, catalog):
    """votes[(a, b)] = how strongly the catalog says to read a before b."""
    inside, votes = set(members), {}
    for _, order, _ in path_sequences(catalog):
        own = [b for b in order if b in inside]
        for i, a in enumerate(own):
            for b in own[i + 1:]:
                votes[(a, b)] = votes.get((a, b), 0) + 1
    for series in catalog.get('series', []):
        own = [v['book_id'] for v in series.get('volumes', []) if v.get('book_id') in inside]
        for i, a in enumerate(own):
            for b in own[i + 1:]:
                votes[(a, b)] = votes.get((a, b), 0) + SERIES_WEIGHT
    return votes


def order_books(members, votes):
    """members in shelf order → reading order."""
    remaining, order = list(members), []
    ahead = lambda a, b: votes.get((a, b), 0) > votes.get((b, a), 0)
    while remaining:
        free = [x for x in remaining if not any(ahead(y, x) for y in remaining if y != x)]
        if free:
            pick = free[0]
        else:
            balance = {x: sum(votes.get((x, y), 0) - votes.get((y, x), 0) for y in remaining) for x in remaining}
            pick = max(remaining, key=lambda x: (balance[x], -remaining.index(x)))
        order.append(pick)
        remaining.remove(pick)
    return order


def series_reason(prev, book, catalog):
    for series in catalog.get('series', []):
        volumes = series.get('volumes', [])
        for v, w in zip(volumes, volumes[1:]):
            if v.get('book_id') == prev and w.get('book_id') == book:
                return {'reason': v.get('next_why') or f'{series["title"]} {w["number"]}권으로 이어집니다.',
                        'via': {'kind': 'series', 'title': series['title'], 'href': f'#series-{series["id"]}'}}
        if book and volumes and volumes[0].get('book_id') == book and prev is None:
            return {'reason': f'{series["title"]} 1권이자 시리즈의 출발점입니다. {series.get("summary", "")}'.strip(),
                    'via': {'kind': 'series', 'title': series['title'], 'href': f'#series-{series["id"]}'}}
    return None


def short(book_id, catalog):
    book = next(b for b in catalog['books'] if b['id'] == book_id)
    return book.get('short_title') or book.get('spine_title') or book['title']


def sentence(text):
    text = text.strip()
    return text if text[-1:] in ('.', '?', '!') else text + '.'


def path_reason(prev, book, members, catalog):
    """The path that goes from prev to book (or starts this field at book), and that step's why."""
    inside, starts, visiting, fallback, chosen = set(members), 0, 0, None, None
    for path, order, first in path_sequences(catalog):
        own = [b for b in order if b in inside]
        if book not in own:
            continue
        visiting += 1
        at = own.index(book)
        via = {'kind': 'path', 'title': path.get('title') or path.get('question'), 'href': f'#path-{path["id"]}'}
        why = sentence(first[book]['why'])
        if prev is None and at == 0:
            starts += 1
            chosen = chosen or (via, why)
        elif prev is not None and at > 0 and own[at - 1] == prev and chosen is None:
            chosen = (via, why)
        elif prev is not None and prev in own[:at] and fallback is None:
            fallback = (via, why)
    if prev is None and chosen:
        via, why = chosen
        if len(members) == 1:
            lead = f'이 분야의 책은 이 한 권입니다. 읽기 노선 {visiting}개가 이 책을 지납니다.'
        elif starts == visiting:
            lead = f'이 분야를 지나는 읽기 노선 {visiting}개가 모두 이 책에서 시작합니다.'
        else:
            lead = f'이 분야를 지나는 읽기 노선 {visiting}개 가운데 {starts}개가 이 책에서 시작합니다.'
        return {'reason': f'{lead} 「{via["title"]}」의 첫 걸음: {why}', 'via': via}
    pick = chosen or fallback
    if pick:
        via, why = pick
        return {'reason': f'「{via["title"]}」 노선이 {short(prev, catalog)} 다음에 이 책으로 건너갑니다. {why}', 'via': via}
    return None


def reason_for(prev, book, members, catalog):
    found = series_reason(prev, book, catalog) or path_reason(prev, book, members, catalog)
    if found:
        return found
    text = ('이 분야에서 서가에 먼저 꽂힌 책입니다. 이 책부터 이어지는 노선은 아직 없습니다.' if prev is None
            else '앞 책과 이어 주는 노선이나 시리즈가 아직 없어 서가 순서대로 둡니다. 따로 읽어도 괜찮습니다.')
    return {'reason': text, 'via': {'kind': 'shelf', 'title': '서가 순서', 'href': '#books'}}


def field_orders(catalog):
    """{field: [{book, reason, via}]} for every field on the shelf, in shelf order of fields."""
    books = catalog.get('books', [])
    fields = list(dict.fromkeys(field_of(b) for b in books))
    result = {}
    for field in fields:
        members = [b['id'] for b in books if field_of(b) == field]
        order = order_books(members, votes_for(members, catalog))
        result[field] = [{'book': book, **reason_for(order[i - 1] if i else None, book, members, catalog)}
                         for i, book in enumerate(order)]
    return result
