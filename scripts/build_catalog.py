"""Render the catalog into static HTML, without runtime fetch or dependencies."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {'analysis', 'guide', 'template'}


if __package__:
    from .shelf_renderer import esc, safe_url, render_resources, shelf
else:
    from shelf_renderer import esc, safe_url, render_resources, shelf


def render_books(books):
    if not books:
        return ('<div class="empty-shelf"><div class="shelf-icon" aria-hidden="true">+</div>'
                '<div><h3>첫 번째 책을 준비하는 자리입니다.</h3>'
                '<p>아직 등록된 학습 책이 없습니다. 주제와 독자, 첫 장의 질문을 정하면 '
                '이곳에서 책을 펼칠 수 있습니다.</p></div>'
                '<a class="button secondary" href="templates/book-brief.html">'
                '새 책 기획서 열기 <span aria-hidden="true">→</span></a></div>')
    labels = {'published': '읽을 수 있는 책', 'writing': '집필 중', 'planned': '기획 중'}
    seen = set()
    for book in books:
        if not book['id'] or book['id'] in seen or book['status'] not in labels:
            raise ValueError('Book ID must be unique and status must be known')
        seen.add(book['id'])
        if book['status'] == 'published':
            safe_url(book['url'], external=True)
    return ''.join(shelf(books[i:i + 12], 'book', i) for i in range(0, len(books), 12))


def replace_section(source, name, content):
    pattern = rf'(<!-- {name}:START -->).*?(<!-- {name}:END -->)'
    result, count = re.subn(pattern, lambda m: m[1] + '\n' + content + '\n' + m[2],
                           source, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected exactly one {name} section')
    return result


def build(source, catalog):
    ids = [item['id'] for item in catalog.get('resources', []) + catalog.get('books', [])]
    if len(ids) != len(set(ids)):
        raise ValueError('IDs must be unique across resources and books')
    source = replace_section(source, 'RESOURCES', render_resources(catalog.get('resources', [])))
    source = replace_section(source, 'BOOKS', render_books(catalog.get('books', [])))
    return replace_section(source, 'COUNT', f'전체 {len(catalog.get("resources", []))}개 자료')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'index.html'
    source = path.read_text()
    result = build(source, json.loads((ROOT / 'data/catalog.json').read_text()))
    if args.check:
        if source != result:
            raise SystemExit('Catalog HTML is stale. Run python scripts/build_catalog.py')
        print('Catalog HTML is current')
    else:
        path.write_text(result)
        print('Catalog rendered into index.html')


if __name__ == '__main__':
    main()
