"""Gate records G0~G7 for books made by the agent team (docs/10-agent-team.html#gate-check).

Each book keeps its production record in books/<topic>/docs/index.html. One build or
revision is one <table class="gate-round" data-kind="new|revision" data-date="YYYY-MM-DD">
inside <section id="log">, with one <tr data-gate="Gn"> row per gate passed. The latest
round decides. Each row names the leads who signed it off in data-approved; the leads
come from data/agent-team.json. Format: templates/gate-log.html.
"""
import json
import re
from datetime import date
from html.parser import HTMLParser

try:
    from .fact_review import ReviewDocument
except ImportError:
    from fact_review import ReviewDocument

DOC_FILE = 'docs/index.html'
REVIEW_FILE = 'docs/fact-review.html'
GATES = tuple(f'G{n}' for n in range(8))
REQUIRED = {'new': GATES, 'revision': ('G2', 'G3', 'G4', 'G6', 'G7')}
# A gate counts only when the artifact it hands over is in the production document.
SECTIONS = {'G1': 'plan', 'G2': 'curriculum', 'G3': 'chapters', 'G4': 'rehearsal'}
# Who signs off each gate: the lead of every team handing the artifact over (G0 and G7 are
# the editor-in-chief's calls). Names are resolved from data/agent-team.json.
APPROVERS = {'G0': ('chief',), 'G1': ('plan',), 'G2': ('curriculum',),
             'G3': ('research', 'pedagogy'), 'G4': ('writing', 'visual', 'pedagogy'), 'G5': ('plan',),
             'G6': ('review',), 'G7': ('chief',)}
TEAM_FILE = 'data/agent-team.json'
RULE_DATE = '2026-10-12'
# Korean writing guideline K1~K6 (docs/11-korean-writing.html): G4 rounds dated on or after
# this day need the guideline-check table and a guideline on every style memo row.
GUIDELINES = tuple(f'K{n}' for n in range(1, 7))
GUIDELINE_DATE = '2026-10-13'

# Books whose first gate round was recorded before lead sign-offs were required
# (2026-10-12). That round needs no data-approved; any later round of theirs does.
APPROVAL_EXEMPT = {'transformer-inside'}

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
    """Sections, gate rounds (inside section#log), style memos, design rows and links."""

    def __init__(self, text):
        super().__init__()
        self.ids, self.rounds, self.style, self.hrefs = set(), [], set(), set()
        self.design_rows, self._sections, self._row, self._design = 0, [], None, False
        # Inside section#style: guideline-check rows (code -> cells) and memo rows (memo, codes).
        self.guideline_rows, self.memo_rows, self._memo, self._check, self._srow = {}, [], None, False, None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
            if a['id'].startswith('style-') and 'style' in self._sections:
                self.style.add(a['id'])
                self._memo = a['id']
        if 'style' in self._sections:
            self._style_tag(tag, a)
        if tag == 'section':
            self._sections.append(a.get('id'))
        elif tag == 'a' and a.get('href'):
            self.hrefs.add(a['href'].split('#')[0])
        elif tag == 'table' and 'gate-round' in (a.get('class') or '').split() and 'log' in self._sections:
            self.rounds.append({'attrs': a, 'gates': {}, 'approved': {}, 'dups': set()})
        elif tag == 'tr':
            self._design = 'chapters' in self._sections
            self._row_start(a)
        elif tag == 'td':
            if self._design:
                self.design_rows, self._design = self.design_rows + 1, False
            if self._row is not None:
                self._row.append('')

    def _row_start(self, a):
        gate = a.get('data-gate')
        if not (self.rounds and gate and 'log' in self._sections):
            return
        record = self.rounds[-1]
        if gate in record['gates']:
            record['dups'].add(gate)
        self._row = record['gates'][gate] = []
        record['approved'][gate] = set((a.get('data-approved') or '').split())

    def _style_tag(self, tag, a):
        """Rows of the guideline-check table and of the per-chapter memo tables."""
        if tag == 'table':
            self._check = 'guideline-check' in (a.get('class') or '').split()
        elif tag == 'tr':
            self._srow = {'codes': (a.get('data-guideline') or '').split(), 'cells': []}
        elif tag == 'td' and self._srow is not None:
            self._srow['cells'].append('')

    def _style_row_end(self):
        row, self._srow = self._srow, None
        if not (row and row['cells']):
            return
        if self._check:
            for code in row['codes']:
                self.guideline_rows[code] = row['cells']
        elif self._memo:
            self.memo_rows.append((self._memo, row['codes']))

    def handle_endtag(self, tag):
        if tag == 'tr' and self._srow is not None:
            self._style_row_end()
        if tag in ('tr', 'table'):
            self._row = None
            self._check = self._check and tag != 'table'
        elif tag == 'section' and self._sections:
            if self._sections.pop() == 'style':
                self._memo = None

    def handle_data(self, data):
        if self._row:
            self._row[-1] += data.strip()
        if self._srow and self._srow['cells']:
            self._srow['cells'][-1] += data.strip()


def valid_date(text):
    """A real calendar day written YYYY-MM-DD (fromisoformat alone also takes 2026-W41-1)."""
    try:
        return bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', text)) and bool(date.fromisoformat(text))
    except ValueError:
        return False


def round_date(record):
    text = record['attrs'].get('data-date', '')
    return text if valid_date(text) else ''


def latest(rounds):
    """The round with the latest date; on a tie, the one written later in the document."""
    return max(enumerate(rounds), key=lambda p: (round_date(p[1]), p[0]))


def team_leads(root):
    """Team id -> lead name, plus 'chief' for the editor-in-chief."""
    data = json.loads((root / TEAM_FILE).read_text())
    leads = {'chief': data['chief']['name']}
    for team in data['teams']:
        lead = next(m for m in team['members'] if m['role'].startswith('팀장'))
        leads[team['id']] = lead['name']
    return leads


def approval_errors(record, leads):
    """Every recorded gate needs the sign-off of each lead who hands it over."""
    errors = []
    for gate, signed in record['approved'].items():
        missing = [leads[t] for t in APPROVERS.get(gate, ()) if leads[t] not in signed]
        if missing:
            errors.append(f'{gate} needs data-approved sign-off from {", ".join(missing)}')
    return errors


def guideline_errors(doc):
    """G4 under the Korean writing guideline: K1~K6 checked, every memo row names its guideline."""
    errors = []
    missing = [k for k in GUIDELINES if len(doc.guideline_rows.get(k, [])) < 3
               or not all(doc.guideline_rows[k][1:3])]
    if missing:
        errors.append('G4 needs <table class="guideline-check"> inside <section id="style"> with a filled '
                      f'row per guideline (docs/11-korean-writing.html#record): missing {", ".join(missing)}')
    untagged = sorted({memo for memo, codes in doc.memo_rows
                       if not codes or any(c not in GUIDELINES for c in codes)})
    if untagged:
        errors.append('G4 style memo rows need data-guideline with K1~K6: ' + ', '.join(untagged))
    tagged = {memo for memo, _ in doc.memo_rows}
    empty = sorted(doc.style - tagged)
    if empty:
        errors.append('G4 style memos need at least one critique row with data-guideline: ' + ', '.join(empty))
    return errors


def research_errors(doc, docs_dir):
    """G3 hands over research notes: a linked HTML page next to the production document."""
    for href in doc.hrefs:
        if href.endswith('.html') and '/' not in href and href not in ('index.html', 'fact-review.html'):
            page = docs_dir / href
            if page.is_file() and 'sources' in ProductionDocument(page.read_text()).ids:
                return []
    return ['G3 needs research notes: link a docs/*.html page that has id="sources"']


def artifact_errors(book, gates, kind, day=''):
    """The artifacts each recorded gate hands over must be in the production document."""
    doc, errors = book['doc'], []
    for gate, section in SECTIONS.items():
        if gate in gates and section not in doc.ids:
            errors.append(f'{gate} needs <section id="{section}"> in the production document')
    if 'G3' in gates:
        errors += research_errors(doc, book['docs_dir'])
        if kind == 'new' and doc.design_rows < len(book['anchors']):
            errors.append(f'G3 needs a learning-design row per chapter: {doc.design_rows} of {len(book["anchors"])}')
    if 'G4' in gates:
        need = {f'style-{a}' for a in book['anchors']} if kind == 'new' else set()
        missing = sorted(need - doc.style)
        if missing or not doc.style:
            errors.append('G4 needs a style critique memo per chapter inside <section id="style">: '
                          f'missing {", ".join(missing) or "any memo"}')
        if day >= GUIDELINE_DATE:
            errors += guideline_errors(doc)
    return errors


def round_errors(book, record, leads, exempt=False):
    """Problems in one gate round. A book still being written needs its gates in order."""
    a, gates = record['attrs'], record['gates']
    kind = a.get('data-kind')
    if kind not in REQUIRED:
        return ['gate-round data-kind must be new or revision']
    errors = [] if valid_date(a.get('data-date', '')) else ['gate-round data-date must be a real YYYY-MM-DD']
    errors += [f'unknown gate {g}' for g in gates if g not in GATES]
    errors += [f'gate {g} is recorded twice in one round' for g in sorted(record['dups'])]
    required = REQUIRED[kind]
    if book['status'] != 'published':
        required = required[:len([g for g in required if g in gates])]
    for gate in required:
        cells = gates.get(gate)
        if cells is None:
            errors.append(f'{kind} round is missing gate {gate}')
        elif len(cells) < 3 or not all(cells[1:3]):
            errors.append(f'{gate} row needs the handed-over artifact and a one-line record')
    errors += artifact_errors(book, gates, kind, round_date(record))
    return errors if exempt else errors + approval_errors(record, leads)


def latest_review_date(path):
    if not path.is_file():
        return ''
    return max((r['attrs'].get('data-date', '') for r in ReviewDocument(path.read_text()).rounds), default='')


def book_gate_errors(root, entry, anchors, leads):
    folder = entry.get('url', '').split('#')[0].rstrip('/')
    path = root / folder / DOC_FILE
    doc = ProductionDocument(path.read_text()) if path.is_file() else None
    revised = latest_review_date(root / folder / REVIEW_FILE)
    legacy = entry['id'] in LEGACY
    if not (doc and doc.rounds):
        if not legacy:
            return [f'{folder}/{DOC_FILE}: needs <section id="log"> with a gate-round table (templates/gate-log.html)']
        if revised > RULE_DATE:
            return [f'{folder}/{DOC_FILE}: fact review of {revised} marks a substantial revision; '
                    f'record a gate-round data-kind="revision"']
        return []
    book = {'doc': doc, 'docs_dir': path.parent, 'anchors': anchors, 'status': entry.get('status')}
    exempt = lambda i: i == 0 and entry['id'] in APPROVAL_EXEMPT
    i, last = latest(doc.rounds)
    errors = round_errors(book, last, leads, exempt(i))
    errors += [f'gate round {k + 1} data-date must be a real YYYY-MM-DD' for k, r in enumerate(doc.rounds)
               if k != i and not round_date(r)]
    if not legacy and last['attrs'].get('data-kind') != 'new':
        news = [(j, r) for j, r in enumerate(doc.rounds) if r['attrs'].get('data-kind') == 'new']
        if not news:
            errors.append('a book made under the team rule needs a data-kind="new" round')
        else:
            j, first = latest([r for _, r in news])
            j = news[j][0]
            errors += [f'new round: {e}' for e in round_errors(book, first, leads, exempt(j))]
    if revised > RULE_DATE and round_date(last) < revised:
        errors.append(f'fact review of {revised} is newer than the latest gate round')
    return [f'{folder}/{DOC_FILE}: {e}' for e in errors]


def validate_team_gates(root, catalog):
    """Books made or substantially revised under the team rule need every gate on record."""
    index = catalog.get('chapter_index', {})
    leads, errors = team_leads(root), []
    for entry in catalog.get('books', []):
        if entry.get('status') not in ('writing', 'published'):
            continue
        folder = entry.get('url', '').split('#')[0]
        anchors = [href.split('#', 1)[1] for href in index if href.startswith(folder + '#')]
        errors += book_gate_errors(root, entry, anchors, leads)
    return errors
