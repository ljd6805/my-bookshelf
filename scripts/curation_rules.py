"""Rules that keep the knowledge map and curation in step with the shelf.

Every published book must be woven into the library, not only placed on the shelf:
  1. its chapters are listed in chapter_index, and each listed anchor is a real route;
  2. it appears in at least MIN_CONCEPTS shared concepts (each concept spans two books or more);
  3. at least one learning path stops in it;
  4. it links out to another book and another book links back to it (../topic/#chapter).
Concept names stay short (MAX_CONCEPT_NAME characters without spaces) so each one fits its row
on the knowledge map, where books are columns and concepts are lines.
validate.py runs these checks, so adding a book without updating the map fails CI.
See docs/08-book-template.html#knowledge-links for the checklist that satisfies them.
"""
import re
from html.parser import HTMLParser
from pathlib import Path

MIN_CONCEPTS = 2
MAX_CONCEPT_NAME = 10
GUIDE = 'see docs/08-book-template.html#knowledge-links'
CROSS_LINK = re.compile(r'\.\./([a-z0-9-]+)/(?:index\.html)?#([\w-]+)')


class Routes(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.routes = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta' and a.get('name') == 'book-routes':
            self.routes.update(a.get('content', '').split(','))


def book_dir(book):
    return book['url'].strip('/').split('/')[-1]


def cross_links(root):
    """(from_dir, to_dir) pairs found in every book's scripts and pages."""
    pairs = set()
    for path in list(root.glob('books/*/js/*.js')) + list(root.glob('books/*/index.html')):
        source = path.relative_to(root).parts[1]
        for target, _ in CROSS_LINK.findall(path.read_text()):
            if target != source:
                pairs.add((source, target))
    return pairs


def owner(url, books):
    return next((b for b in books if url.startswith(b['url'])), None)


def check_index(root, catalog, books):
    errors = []
    for url in catalog.get('chapter_index', {}):
        book = owner(url, books)
        page = root / url.split('#')[0] / 'index.html'
        if book is None or not page.is_file():
            errors.append(f'chapter_index: {url} does not belong to a published book')
        elif url.split('#')[-1] not in Routes(page.read_text()).routes:
            errors.append(f'chapter_index: {url} is not in that book\'s book-routes')
    return errors


def check_concepts(catalog, books):
    errors = []
    for concept in catalog.get('concepts', []):
        owners = {owner(url, books)['id'] for url in concept['chapters'] if owner(url, books)}
        if len(owners) < 2:
            errors.append(f'concept {concept["id"]}: must connect chapters from two books or more')
        if len(concept.get('name', '').replace(' ', '')) > MAX_CONCEPT_NAME:
            errors.append(f'concept {concept["id"]}: name must be {MAX_CONCEPT_NAME} characters or fewer '
                          'without spaces so it fits its row on the knowledge map')
        if len(set(concept['chapters'])) != len(concept['chapters']):
            errors.append(f'concept {concept["id"]}: lists the same chapter twice')
    for path in catalog.get('learning_paths', []):
        urls = [step['url'] for step in path['steps']]
        if len(set(urls)) != len(urls):
            errors.append(f'learning path {path["id"]}: stops at the same chapter twice')
    return errors


def check_book(book, catalog, links):
    bid, folder, errors = book['id'], book_dir(book), []
    if not any(url.startswith(book['url']) for url in catalog.get('chapter_index', {})):
        errors.append(f'{bid}: add its chapters to chapter_index ({GUIDE})')
    concepts = [c for c in catalog.get('concepts', [])
                if any(url.startswith(book['url']) for url in c['chapters'])]
    if len(concepts) < MIN_CONCEPTS:
        errors.append(f'{bid}: appears in {len(concepts)} shared concepts, needs {MIN_CONCEPTS} ({GUIDE})')
    if not any(s['book_id'] == bid for p in catalog.get('learning_paths', []) for s in p['steps']):
        errors.append(f'{bid}: no learning path stops in this book ({GUIDE})')
    if not any(src == folder for src, _ in links):
        errors.append(f'{bid}: needs a link to another book in its chapters ({GUIDE})')
    if not any(dst == folder for _, dst in links):
        errors.append(f'{bid}: no other book links to it yet ({GUIDE})')
    return errors


def validate_knowledge_links(root, catalog):
    root = Path(root)
    books = [b for b in catalog.get('books', []) if b.get('status') == 'published'
             and b.get('url', '').startswith('books/')]
    links = cross_links(root)
    errors = check_index(root, catalog, books) + check_concepts(catalog, books)
    for book in books:
        errors += check_book(book, catalog, links)
    return errors
