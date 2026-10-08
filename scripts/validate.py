"""Offline integrity checks for the bookshelf; Python standard library only."""
import ast
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
if __package__:
    from .build_catalog import build, safe_book_url
    from .curation_rules import validate_knowledge_links
    from .cover_renderer import cover_errors, COVER_FILE, COVER_META
    from .fact_review import validate_fact_reviews
else:
    from build_catalog import build, safe_book_url
    from curation_rules import validate_knowledge_links
    from cover_renderer import cover_errors, COVER_FILE, COVER_META
    from fact_review import validate_fact_reviews

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


class ShelfReturn(HTMLParser):
    """Collects shelf-return links and whether each sits inside <header>."""
    def __init__(self, text):
        super().__init__()
        self.depth, self.links = 0, []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.depth += tag == 'header'
        if tag == 'a' and 'data-shelf-return' in a and 'shelf-return' in (a.get('class') or '').split():
            self.links.append((a.get('href', ''), self.depth > 0))

    def handle_endtag(self, tag):
        self.depth -= tag == 'header' and self.depth > 0


def validate_shelf_return(root):
    """Every books/<topic>/index.html needs a header button back to the shelf."""
    errors, home = [], (root / 'index.html').resolve()
    for page in sorted(root.glob('books/*/index.html')):
        ok = False
        for href, in_header in ShelfReturn(page.read_text()).links:
            u = urlsplit(href)
            target = (page.parent / unquote(u.path)).resolve()
            ok |= in_header and not u.scheme and target == home and u.fragment == 'books'
        if not ok:
            errors.append(f'{page.relative_to(root)}: needs <a class="shelf-return" '
                          'data-shelf-return href="../../index.html#books"> inside <header>')
    return errors


def validate_typography(root):
    """Shelf and every book load the shared type system (assets/type.css) instead of their own fonts."""
    errors = []
    if 'href="assets/type.css' not in (root / 'index.html').read_text():
        errors.append('index.html: needs <link rel="stylesheet" href="assets/type.css?v=...">')
    for page in sorted(root.glob('books/*/index.html')):
        text, name = page.read_text(), page.relative_to(root)
        if not re.search(r'<html[^>]*\bdata-typeset="book"', text):
            errors.append(f'{name}: <html> needs data-typeset="book"')
        if 'href="../../assets/type.css' not in text:
            errors.append(f'{name}: needs <link rel="stylesheet" href="../../assets/type.css?v=...">')
    family = re.compile(r'(?<![\w-])font(-family)?\s*:\s*([^;}]+)')
    for css in sorted(root.glob('books/*/assets/*.css')):
        text, name = css.read_text(), css.relative_to(root)
        if '@font-face' in text:
            errors.append(f'{name}: fonts come from assets/type.css; remove @font-face')
        for _, value in family.findall(re.sub(r'@font-face\s*{[^}]*}', '', text)):
            if 'var(--font-' not in value and value.strip() != 'inherit':
                errors.append(f'{name}: use var(--font-sans|serif|mono) instead of "{value.strip()}"')
    return errors


def validate_cross_links(root):
    """Links from one book's scripts to another book (../topic/#chapter) must hit a known route."""
    routes, errors = {}, []
    for page in root.glob('books/*/index.html'):
        routes[page.parent.name] = Document(page.read_text()).ids
    pattern = re.compile(r'\.\./([a-z-]+)/(?:index\.html)?#([\w-]+)')
    for script in sorted(root.glob('books/*/js/*.js')):
        for book, anchor in pattern.findall(script.read_text()):
            if anchor not in routes.get(book, set()):
                errors.append(f'{script.relative_to(root)}: missing cross-book link ../{book}/#{anchor}')
    return errors


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


ANIMATION = re.compile(r'@keyframes|<animate|<animateTransform|<animateMotion')
REDUCED = re.compile(r'prefers-reduced-motion|data-motion=reduce')


def validate_illustrations(root, catalog):
    """Every published book opens on the shelf with a moving illustration that also respects
    reduced motion (AGENTS.md 책 구성 표준, docs/08-book-template.html#visual)."""
    errors = []
    for book in catalog.get('books', []):
        if book.get('status') != 'published':
            continue
        bid, rel = book.get('id'), book.get('illustration')
        path = root / rel if rel else None
        if not path or not path.is_file():
            errors.append(f'catalog: published book {bid} needs illustration (assets/shelf-illustration.svg)')
            continue
        svg = path.read_text()
        if not ANIMATION.search(svg) or not re.search(r'animation(-name)?\s*:', svg + ('animation:' if '<animate' in svg else '')):
            errors.append(f'{rel}: shelf illustration must animate (@keyframes + animation, or SMIL)')
        if not REDUCED.search(svg):
            errors.append(f'{rel}: shelf illustration needs a reduced-motion rule '
                          '(prefers-reduced-motion and html[data-motion=reduce])')
    return errors


def validate_covers(root, catalog):
    """Every published book has a still, wide cover plate drawn with the shared cv-* classes
    (AGENTS.md 표지 규칙, docs/08-book-template.html#cover)."""
    errors = []
    for book in catalog.get('books', []):
        if book.get('status') != 'published':
            continue
        bid, rel = book.get('id'), book.get('cover_art', '')
        folder = book.get('url', '').split('#')[0].rstrip('/')
        if rel != f'{folder}/{COVER_FILE}' or not (root / rel).is_file():
            errors.append(f'catalog: published book {bid} needs cover_art at {folder}/{COVER_FILE}')
        else:
            errors += [f'{rel}: {e}' for e in cover_errors((root / rel).read_text().strip())]
        if not COVER_META.match(book.get('cover_meta', '')):
            errors.append(f"catalog: {bid} cover_meta must read like '12장 · 18개 실험'")
        if ' · ' not in book.get('title', ''):
            errors.append(f"catalog: {bid} title needs ' · ' between the cover title and subtitle")
    return errors


def validate_asset_versions(root):
    """Every asset URL shares index.html's release version, including transitive JS imports."""
    match = re.search(r'assets/home\.js\?v=([\w-]+)', (root / 'index.html').read_text())
    if not match:
        return ['index.html: home.js has no ?v= release version']
    version, errors = match.group(1), []
    for path in sorted((root / 'assets').glob('*.js')):
        for spec in re.findall(r"from '(\./[^']+)'", path.read_text()):
            if not spec.endswith(f'?v={version}'):
                errors.append(f'{path.name}: import {spec} must end with ?v={version}')
    if f'v={version}' not in (root / 'tests/responsive.html').read_text():
        errors.append(f'tests/responsive.html: preview must use v={version}')
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
    errors += validate_shelf_return(ROOT)
    errors += validate_typography(ROOT)
    errors += validate_cross_links(ROOT)
    errors += validate_illustrations(ROOT, catalog)
    errors += validate_covers(ROOT, catalog)
    errors += validate_knowledge_links(ROOT, catalog)
    errors += validate_fact_reviews(ROOT, catalog)
    home = (ROOT / 'index.html').read_text()
    if build(home, catalog) != home:
        errors.append('Catalog HTML is stale: run python scripts/build_catalog.py')
    errors += validate_python(ROOT)
    errors += validate_asset_versions(ROOT)
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
