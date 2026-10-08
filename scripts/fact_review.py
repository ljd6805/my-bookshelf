"""Fact and source review records for published books (AGENTS.md 팩트·출처 검수).

Each book keeps books/<topic>/docs/fact-review.html. Every review round is one
<section class="fact-review"> whose data-* attributes carry the record; the latest
round decides whether the book may stay published. Format: templates/fact-review.html.
"""
import re
from html.parser import HTMLParser

REVIEW_FILE = 'docs/fact-review.html'
CHECKS = ('facts', 'numbers', 'experiments', 'terms', 'sources')
CHECK_STATUS = {'ok', 'fixed', 'open', 'n/a'}
RESULTS = {'passed', 'fixed', 'open'}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

# Books published before the rule (2026-10-08). The existing-book review removes each id
# when it adds that book's record; a listed book that already has a record is an error.
PENDING = {'ai-book-interactive', 'llm-systems', 'llm-performance', 'how-computers-work',
           'linear-algebra-world', 'probability-statistics', 'search-rag'}


class ReviewDocument(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.rounds = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'fact-review' in (a.get('class') or '').split():
            self.rounds.append({'attrs': a, 'checks': {}})
        elif self.rounds and a.get('data-check'):
            self.rounds[-1]['checks'][a['data-check']] = a.get('data-status', '')


def round_errors(record):
    """Problems that keep one review round from clearing a book."""
    a, errors = record['attrs'], []
    reviewer, author = a.get('data-reviewer', '').strip(), a.get('data-author', '').strip()
    if not reviewer or not author:
        errors.append('needs data-reviewer and data-author')
    elif reviewer == author:
        errors.append('reviewer must be a different agent from the author')
    if not DATE.match(a.get('data-date', '')):
        errors.append('data-date must be YYYY-MM-DD')
    if not a.get('data-scope', '').strip():
        errors.append('needs data-scope (chapters, experiments and sources covered)')
    if a.get('data-result') not in RESULTS:
        errors.append('data-result must be passed, fixed or open')
    elif a['data-result'] == 'open':
        errors.append('latest review is still open: fix the findings and record a new round')
    for check in CHECKS:
        status = record['checks'].get(check)
        if status not in CHECK_STATUS:
            errors.append(f'missing data-check="{check}" row with data-status ok|fixed|open|n/a')
        elif status == 'open':
            errors.append(f'{check} findings are still open')
    return errors


def review_errors(text):
    rounds = ReviewDocument(text).rounds
    if not rounds:
        return ['no <section class="fact-review"> round recorded']
    latest = max(rounds, key=lambda r: r['attrs'].get('data-date', ''))
    return round_errors(latest)


def validate_fact_reviews(root, catalog):
    """A published book needs a passed fact review by an agent other than its author."""
    errors = []
    for book in catalog.get('books', []):
        if book.get('status') != 'published':
            continue
        bid = book.get('id')
        folder = book.get('url', '').split('#')[0].rstrip('/')
        path = root / folder / REVIEW_FILE
        if not path.is_file():
            if bid not in PENDING:
                errors.append(f'catalog: published book {bid} needs a fact review at {folder}/{REVIEW_FILE}')
            continue
        problems = review_errors(path.read_text())
        errors += [f'{folder}/{REVIEW_FILE}: {p}' for p in problems]
        if bid in PENDING and not problems:
            errors.append(f'scripts/fact_review.py: remove {bid} from PENDING now that its review is recorded')
    return errors
