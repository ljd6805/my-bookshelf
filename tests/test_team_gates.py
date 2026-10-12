import tempfile
import unittest
from pathlib import Path
from scripts.team_gates import LEGACY, validate_team_gates

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / 'templates/gate-log.html').read_text()
SECTIONS = ''.join(f'<section id="{i}"></section>' for i in ('plan', 'curriculum', 'chapters', 'rehearsal'))
STYLE = '<section id="style"><h3 id="style-a"></h3><h3 id="style-b"></h3></section>'
REVIEW = '<section class="fact-review" data-date="{}"></section>'


def catalog(bid='new-book', status='published'):
    return {'books': [{'id': bid, 'status': status, 'url': 'books/new/'}],
            'chapter_index': {'books/new/#a': '01', 'books/new/#b': '02'}}


class TeamGates(unittest.TestCase):
    def run_check(self, doc=None, review=None, **book):
        with tempfile.TemporaryDirectory() as name:
            docs = Path(name) / 'books/new/docs'
            docs.mkdir(parents=True)
            if doc is not None:
                (docs / 'index.html').write_text(doc)
            if review:
                (docs / 'fact-review.html').write_text(REVIEW.format(review))
            return validate_team_gates(Path(name), catalog(**book))

    def test_complete_record_passes(self):
        self.assertEqual(self.run_check(SECTIONS + STYLE + TEMPLATE), [])

    def test_reference_book_passes(self):
        import json
        real = json.loads((ROOT / 'data/catalog.json').read_text())
        self.assertEqual(validate_team_gates(ROOT, real), [])

    def test_new_book_without_record_fails(self):
        self.assertEqual(len(self.run_check()), 1)
        self.assertEqual(len(self.run_check('<main></main>')), 1)

    def test_missing_gate_or_artifact_fails(self):
        doc = SECTIONS + STYLE + TEMPLATE
        self.assertTrue(self.run_check(doc.replace('data-gate="G6"', 'data-gate="X"')))
        self.assertTrue(self.run_check(doc.replace('<td>fact-review.html</td>', '<td></td>')))
        self.assertTrue(self.run_check(doc.replace('id="curriculum"', 'id="other"')))

    def test_style_memo_needed_for_every_chapter(self):
        errors = self.run_check(SECTIONS + STYLE.replace('<h3 id="style-b"></h3>', '') + TEMPLATE)
        self.assertTrue(any('style critique memo' in e and '1 of 2' in e for e in errors))

    def test_writing_book_needs_gates_in_order(self):
        rows = TEMPLATE.split('<tr data-gate="G3">')[0] + '</table></section>'
        self.assertEqual(self.run_check(SECTIONS + rows, status='writing'), [])
        gap = rows.replace('data-gate="G1"', 'data-gate="G4"')
        self.assertTrue(self.run_check(SECTIONS + gap, status='writing'))
        self.assertTrue(self.run_check(SECTIONS + rows))

    def test_legacy_book_is_grandfathered_until_revised(self):
        bid = sorted(LEGACY)[0]
        self.assertEqual(self.run_check(bid=bid), [])
        self.assertEqual(self.run_check(bid=bid, review='2026-10-12'), [])
        self.assertEqual(len(self.run_check(bid=bid, review='2026-11-01')), 1)
        revision = (STYLE + TEMPLATE.replace('data-kind="new" data-date="2026-10-12"',
                                             'data-kind="revision" data-date="2026-11-02"'))
        self.assertEqual(self.run_check(revision, bid=bid, review='2026-11-01'), [])

    def test_revision_round_must_follow_the_review(self):
        doc = STYLE + TEMPLATE.replace('data-kind="new"', 'data-kind="revision"')
        self.assertTrue(self.run_check(doc, bid=sorted(LEGACY)[0], review='2026-11-01'))


if __name__ == '__main__':
    unittest.main()
