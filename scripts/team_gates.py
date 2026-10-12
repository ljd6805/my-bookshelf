"""Gate records G0~G7 for books made by the agent team (docs/10-agent-team.html#gate-check).

Each book keeps its production record in books/<topic>/docs/index.html. One build or
revision is one <table class="gate-round" data-kind="new|revision" data-date="YYYY-MM-DD">
inside <section id="log">, with one <tr data-gate="Gn"> row per gate passed. The latest
round decides. Format: templates/gate-log.html.
"""
import re
from html.parser import HTMLParser

DOC_FILE = 'docs/index.html'
REVIEW_FILE = 'docs/fact-review.html'
GATES = tuple(f'G{n}' for n in range(8))
REQUIRED = {'new': GATES, 'revision': ('G2', 'G3', 'G4', 'G6', 'G7')}
# A gate counts only when the artifact it hands over is in the production document.
GATE_SECTIONS = {'new': {'G1': 'plan', 'G2': 'curriculum', 'G3': 'chapters', 'G4': 'rehearsal'},
                 'revision': {}}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
RULE_DATE = '2026-10-12'

# Books published before the gate rule. They need no production record. A legacy book is
# checked once it records a gate round, or when a fact review newer than RULE_DATE shows a
# substantial revision. The list only shrinks: never add a new book to it.
LEGACY = {
    'ai-book-interactive', 'llm-systems', 'llm-performance', 'how-computers-work',
    'linear-algebra-world', 'probability-statistics', 'search-rag', 'knowledge-graph-ontology',
    *(f'aie-{n:02d}-{name}' for n, name in enumerate((
        'workbench', 'math', 'ml', 'deep', 'vision', 'nlp', 'audio', 'transformer', 'generative',
        'rl', 'llm-build', 'llm-apps', 'multimodal', 'tools', 'agents', 'autonomy', 'multiagent',
        'production', 'safety', 'capstone'), start=1)),
}


class ProductionDocument(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.rounds, self.style = set(), [], set()
        self._row = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
            if a['id'].startswith('style-'):
                self.style.add(a['id'])
        if tag == 'table' and 'gate-round' in (a.get('class') or '').split():
            self.rounds.append({'attrs': a, 'gates': {}})
        elif tag == 'tr' and self.rounds and a.get('data-gate'):
            self._row = self.rounds[-1]['gates'].setdefault(a['data-gate'], [])
        elif tag == 'td' and self._row is not None:
            self._row.append('')

    def handle_endtag(self, tag):
        if tag in ('tr', 'table'):
            self._row = None

    def handle_data(self, data):
        if self._row:
            self._row[-1] += data.strip()


def round_errors(doc, record, status, chapters):
    """Problems in one gate round. A book still being written needs its gates in order."""
    a, errors = record['attrs'], []
    kind = a.get('data-kind')
    if kind not in REQUIRED:
        return ['gate-round data-kind must be new or revision']
    if not DATE.match(a.get('data-date', '')):
        errors.append('gate-round data-date must be YYYY-MM-DD')
    gates = record['gates']
    errors += [f'unknown gate {g}' for g in gates if g not in GATES]
    required = REQUIRED[kind]
    if status != 'published':
        required = required[:len([g for g in required if g in gates])]
    for gate in required:
        cells = gates.get(gate)
        if cells is None:
            errors.append(f'{kind} round is missing gate {gate}')
        elif len(cells) < 3 or not all(cells[1:3]):
            errors.append(f'{gate} row needs the handed-over artifact and a one-line record')
        elif GATE_SECTIONS[kind].get(gate) not in doc.ids | {None}:
            errors.append(f'{gate} needs <section id="{GATE_SECTIONS[kind][gate]}"> in the production document')
    if 'G4' in gates:
        need = chapters if kind == 'new' else 1
        if 'style' not in doc.ids or len(doc.style) < need:
            errors.append(f'G4 needs a style critique memo per chapter (id="style-…"): '
                          f'{len(doc.style)} of {need}')
    return errors


def latest_review_date(root, folder):
    path = root / folder / REVIEW_FILE
    dates = re.findall(r'class="fact-review"[^>]*data-date="([\d-]+)"|data-date="([\d-]+)"[^>]*class="fact-review"',
                       path.read_text()) if path.is_file() else []
    return max((x or y for x, y in dates), default='')


def book_gate_errors(root, book, chapters):
    folder = book.get('url', '').split('#')[0].rstrip('/')
    path = root / folder / DOC_FILE
    doc = ProductionDocument(path.read_text()) if path.is_file() else None
    rounds = doc.rounds if doc else []
    revised = latest_review_date(root, folder)
    if book['id'] in LEGACY and not rounds:
        if revised > RULE_DATE:
            return [f'{folder}/{DOC_FILE}: fact review of {revised} marks a substantial revision; '
                    f'record a gate-round data-kind="revision"']
        return []
    if not rounds:
        return [f'{folder}/{DOC_FILE}: needs <section id="log"> with a gate-round table (templates/gate-log.html)']
    latest = max(rounds, key=lambda r: r['attrs'].get('data-date', ''))
    errors = round_errors(doc, latest, book.get('status'), chapters)
    if revised > RULE_DATE and latest['attrs'].get('data-date', '') < revised:
        errors.append(f'fact review of {revised} is newer than the latest gate round')
    return [f'{folder}/{DOC_FILE}: {e}' for e in errors]


def validate_team_gates(root, catalog):
    """Books made or substantially revised under the team rule need every gate on record."""
    index = catalog.get('chapter_index', {})
    errors = []
    for book in catalog.get('books', []):
        if book.get('status') not in ('writing', 'published'):
            continue
        folder = book.get('url', '').split('#')[0]
        chapters = sum(1 for href in index if href.startswith(folder + '#'))
        errors += book_gate_errors(root, book, chapters)
    return errors
