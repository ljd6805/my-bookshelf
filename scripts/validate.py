"""Offline integrity checks for the bookshelf; Python standard library only."""
import ast
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
if __package__:
    from .build_catalog import build, safe_book_url
else:
    from build_catalog import build, safe_book_url

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.duplicates, self.links = set(), [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta' and a.get('name') == 'book-routes':
            self.ids.update(a.get('content', '').split(','))
        if a.get('id') in self.ids:
            self.duplicates.append(a['id'])
        if a.get('id'):
            self.ids.add(a['id'])
        for key in ('href', 'src'):
            if a.get(key):
                self.links.append(a[key])


def validate_html(root):
    docs = {p: Document(p.read_text()) for p in root.rglob('*.html')}
    errors = []
    for path, doc in docs.items():
        errors.extend(f'{path.name}: duplicate id {x}' for x in doc.duplicates)
        for link in doc.links:
            u = urlsplit(link)
            if u.scheme or u.netloc:
                continue
            target = (path.parent / unquote(u.path)).resolve() if u.path else path
            if target.is_dir():
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{path.relative_to(root)}: missing {link}')
            elif u.fragment and target.suffix == '.html':
                if unquote(u.fragment) not in docs.get(target, Document('')).ids:
                    errors.append(f'{path.relative_to(root)}: missing anchor {link}')
    return errors, len(docs)


def validate_catalog(catalog):
    errors, seen = [], set()
    for book in catalog.get('books', []):
        bid = book.get('id')
        if not bid or bid in seen:
            errors.append(f'catalog: missing or duplicate book id {bid}')
        seen.add(bid)
        if book.get('status') == 'published':
            try:
                safe_book_url(book.get('url', ''))
            except ValueError:
                errors.append(f'catalog: published book {bid} needs a safe book url')
    for route in catalog.get('learning_paths', []):
        for step in route.get('steps', []):
            if step.get('book_id') not in seen:
                errors.append(f'catalog: unknown book in path {step}')
    return errors


def validate_python(root):
    errors = []
    for path in root.rglob('*.py'):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.end_lineno - node.lineno + 1 > 100:
                    errors.append(f'{path.name}:{node.name} exceeds 100 lines')
    return errors


def main():
    errors, count = validate_html(ROOT)
    for path in ROOT.rglob('*.json'):
        json.loads(path.read_text())
    catalog = json.loads((ROOT / 'data/catalog.json').read_text())
    errors += validate_catalog(catalog)
    home = (ROOT / 'index.html').read_text()
    if build(home, catalog) != home:
        errors.append('Catalog HTML is stale: run python scripts/build_catalog.py')
    errors += validate_python(ROOT)
    pages = json.loads((ROOT / 'data/page-audit.json').read_text())
    sims = json.loads((ROOT / 'data/experiment-audit.json').read_text())
    if len(pages) != 648 or sum(p['ok'] for p in pages) != 644:
        errors.append('2026-10-07 page snapshot counts changed')
    if len(sims) != 3903 or not all(s['anchor_in_source'] for s in sims):
        errors.append('2026-10-07 experiment snapshot counts changed')
    for error in errors:
        print('ERROR:', error)
    print(f'{count} HTML files checked; {len(errors)} errors')
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
