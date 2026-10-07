"""Render the catalog into static HTML, without runtime fetch or dependencies."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {'analysis', 'guide', 'template'}


def esc(value):
    return html.escape(str(value), quote=True)


def safe_url(value, external=False):
    u = urlsplit(value)
    if u.scheme == 'https' and u.netloc:
        return esc(value)
    if (external or not value or u.scheme or u.netloc or value.startswith('/')
            or '..' in u.path.split('/') or '\\' in value):
        raise ValueError(f'Unsupported catalog URL: {value}')
    return esc(value)


def render_resources(resources):
    output, seen = [], set()
    for item in resources:
        if not item['id'] or item['id'] in seen or item['category'] not in CATEGORIES:
            raise ValueError('Resource ID must be unique and category must be known')
        seen.add(item['id'])
        search = ' '.join([item['title'], item['description'], *item.get('keywords', [])])
        output.append(
            f'<a class="resource-card" data-resource="{esc(item["id"])}" '
            f'data-category="{esc(item["category"])}" data-search="{esc(search)}" '
            f'href="{safe_url(item["url"])}">'
            f'<span class="resource-label">{esc(item["label"])}</span>'
            f'<h3>{esc(item["title"])} <span aria-hidden="true">↗</span></h3>'
            f'<p>{esc(item["description"])}</p></a>'
        )
    return '\n'.join(output)


def render_books(books):
    if not books:
        return ('<div class="empty-shelf"><div class="shelf-icon" aria-hidden="true">+</div>'
                '<div><h3>첫 번째 책을 준비하는 자리입니다.</h3>'
                '<p>아직 등록된 학습 책이 없습니다. 주제와 독자, 첫 장의 질문을 정하면 '
                '이곳에서 책을 펼칠 수 있습니다.</p></div>'
                '<a class="button secondary" href="templates/book-brief.html">'
                '새 책 기획서 열기 <span aria-hidden="true">→</span></a></div>')
    labels = {'published': '읽을 수 있는 책', 'writing': '집필 중', 'planned': '기획 중'}
    output, seen = [], set()
    for book in books:
        if not book['id'] or book['id'] in seen or book['status'] not in labels:
            raise ValueError('Book ID must be unique and status must be known')
        seen.add(book['id'])
        action = (f'<a class="text-link" href="{safe_url(book["url"], external=True)}">'
                  '책 읽기 ↗</a>' if book['status'] == 'published'
                  else '<span class="book-state">준비되면 이곳에서 열 수 있습니다.</span>')
        output.append(f'<article class="book-card" id="book-{esc(book["id"])}">'
                      f'<span class="resource-label">{labels[book["status"]]}</span>'
                      f'<h3>{esc(book["title"])}</h3><p>{esc(book["description"])}</p>'
                      f'{action}</article>')
    return '<div class="book-grid">' + '\n'.join(output) + '</div>'


def replace_section(source, name, content):
    pattern = rf'(<!-- {name}:START -->).*?(<!-- {name}:END -->)'
    result, count = re.subn(pattern, lambda m: m[1] + '\n' + content + '\n' + m[2],
                           source, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected exactly one {name} section')
    return result


def build(source, catalog):
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
