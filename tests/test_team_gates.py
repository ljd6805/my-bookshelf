import tempfile
import unittest
from pathlib import Path
from scripts.team_gates import LEGACY, validate_team_gates

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / 'templates/gate-log.html').read_text()
SECTIONS = (''.join(f'<section id="{i}"></section>' for i in ('plan', 'curriculum', 'rehearsal'))
            + '<section id="chapters"><table><tr><th>장</th></tr><tr><td>a</td></tr><tr><td>b</td></tr></table>'
            + '<a href="research.html">조사 노트</a></section>')
STYLE = '<section id="style"><h3 id="style-a"></h3><h3 id="style-b"></h3></section>'
CHECK = ('<table class="guideline-check"><tr><th>지침</th><th>찾은 것</th><th>처리</th></tr>'
         + ''.join(f'<tr data-guideline="K{n}"><td>K{n}</td><td>읽은 곳</td><td>처리</td></tr>' for n in range(1, 8))
         + '</table>')
MEMO = '<table><tr><th>인용</th></tr><tr data-guideline="K3 K5"><td>문장</td><td>진단</td></tr></table>'
TITLES = f'<h4 id="style-k-titles"></h4>{MEMO}'
STYLE_K = f'<section id="style">{CHECK}{TITLES}<h3 id="style-a"></h3>{MEMO}<h3 id="style-b"></h3>{MEMO}</section>'
REVIEW = '<section class="fact-review round" data-date=\'{}\'></section>'


def catalog(bid='new-book', status='published'):
    return {'books': [{'id': bid, 'status': status, 'url': 'books/new/'}],
            'chapter_index': {'books/new/#a': '01', 'books/new/#b': '02'}}


class TeamGates(unittest.TestCase):
    def run_check(self, doc=None, review=None, **book):
        with tempfile.TemporaryDirectory() as name:
            docs = Path(name) / 'books/new/docs'
            docs.mkdir(parents=True)
            (Path(name) / 'data').mkdir()
            (Path(name) / 'data/agent-team.json').write_text((ROOT / 'data/agent-team.json').read_text())
            (docs / 'research.html').write_text('<section id="sources"></section>')
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
        self.assertTrue(any('missing style-b' in e for e in errors))

    def test_writing_book_needs_gates_in_order(self):
        rows = TEMPLATE.split('<tr data-gate="G3"')[0] + '</table></section>'
        self.assertEqual(self.run_check(SECTIONS + rows, status='writing'), [])
        gap = rows.replace('data-gate="G1"', 'data-gate="G4"')
        self.assertTrue(self.run_check(SECTIONS + gap, status='writing'))
        self.assertTrue(self.run_check(SECTIONS + rows))

    def test_each_gate_needs_its_leads_sign_off(self):
        doc = SECTIONS + STYLE + TEMPLATE
        errors = self.run_check(doc.replace('data-approved="은재 지안"', 'data-approved="은재"'))
        self.assertEqual(len(errors), 1)
        self.assertIn('G3 needs data-approved sign-off from 지안', errors[0])
        self.assertTrue(self.run_check(doc.replace(' data-approved="정민"', '')))
        self.assertTrue(self.run_check(doc.replace('data-approved="한결">', 'data-approved="서윤">')))

    def test_artifacts_must_match_chapters_and_notes(self):
        doc = SECTIONS + STYLE + TEMPLATE
        errors = self.run_check(doc.replace('id="style-b"', 'id="style-old"'))
        self.assertTrue(any('missing style-b' in e for e in errors))
        self.assertTrue(self.run_check(doc.replace('<tr><td>b</td></tr>', '')))
        self.assertTrue(self.run_check(doc.replace('research.html', 'missing.html')))
        outside = SECTIONS + STYLE + '<h3 id="style-c"></h3>' + TEMPLATE
        self.assertTrue(self.run_check(outside.replace('id="style-b"', 'id="x"')))

    def test_round_must_sit_in_log_and_gates_once(self):
        doc = SECTIONS + STYLE + TEMPLATE
        self.assertTrue(self.run_check(doc.replace('<section id="log">', '<section id="notlog">')))
        dup = doc.replace('<tr data-gate="G7"', '<tr data-gate="G6" data-approved="정민"><td>G6</td><td></td><td></td></tr><tr data-gate="G7"')
        self.assertTrue(any('twice' in e for e in self.run_check(dup)))
        for bad in ('2026-99-99', '2026-W41-1'):
            self.assertTrue(self.run_check(doc.replace('data-date="2026-10-12"', f'data-date="{bad}"')))
        week = SECTIONS + STYLE + TEMPLATE.replace('data-kind="new" data-date="2026-10-12"',
                                                   'data-kind="revision" data-date="2026-W41-1"')
        self.assertTrue(any('newer than' in e for e in self.run_check(week, bid=sorted(LEGACY)[0], review='2026-11-01')))

    def test_new_book_cannot_hide_behind_a_revision_round(self):
        doc = SECTIONS + STYLE + TEMPLATE.replace('data-kind="new"', 'data-kind="revision"')
        self.assertTrue(any('new" round' in e for e in self.run_check(doc)))
        later = TEMPLATE.split('<section id="log">')[1].replace(
            'data-kind="new"', 'data-kind="revision"').replace('</section>', '')
        broken = (SECTIONS + STYLE + TEMPLATE.replace(' data-approved="정민"', '')
                  .replace('</table>\n</section>', '</table>' + later.split('</table>')[0] + '</table></section>'))
        self.assertTrue(any(e.startswith('books/new/docs/index.html: new round') for e in self.run_check(broken)))

    def test_same_day_rounds_use_the_later_one(self):
        rev = TEMPLATE.split('<section id="log">')[1].split('</table>')[0].replace(
            'data-kind="new"', 'data-kind="revision"').replace(' data-approved="정민"', '') + '</table>'
        doc = SECTIONS + STYLE + TEMPLATE.replace('</table>\n</section>', '</table>' + rev + '</section>')
        self.assertTrue(any('G6 needs data-approved' in e for e in self.run_check(doc)))

    def test_legacy_book_is_grandfathered_until_revised(self):
        bid = sorted(LEGACY)[0]
        self.assertEqual(self.run_check(bid=bid), [])
        self.assertEqual(self.run_check(bid=bid, review='2026-10-12'), [])
        self.assertEqual(len(self.run_check(bid=bid, review='2026-11-01')), 1)
        revision = (SECTIONS + STYLE_K + TEMPLATE.replace('data-kind="new" data-date="2026-10-12"',
                                             'data-kind="revision" data-date="2026-11-02"'))
        self.assertEqual(self.run_check(revision, bid=bid, review='2026-11-01'), [])

    def test_revision_round_must_follow_the_review(self):
        doc = STYLE + TEMPLATE.replace('data-kind="new"', 'data-kind="revision"')
        self.assertTrue(self.run_check(doc, bid=sorted(LEGACY)[0], review='2026-11-01'))


    def test_korean_writing_guideline_from_its_rule_date(self):
        new = TEMPLATE.replace('data-date="2026-10-12"', 'data-date="2026-10-13"')
        self.assertEqual(self.run_check(SECTIONS + STYLE_K + new), [])
        self.assertEqual(self.run_check(SECTIONS + STYLE + TEMPLATE), [])
        errors = self.run_check(SECTIONS + STYLE + new)
        self.assertTrue(any('guideline-check' in e and 'K1' in e for e in errors))
        self.assertTrue(any('at least one critique row' in e for e in errors))
        no_k4 = STYLE_K.replace('<tr data-guideline="K4"><td>K4</td><td>읽은 곳</td>', '<tr data-guideline="K4"><td>K4</td><td></td>')
        self.assertTrue(any('missing K4' in e for e in self.run_check(SECTIONS + no_k4 + new)))
        untagged = STYLE_K.replace('<h3 id="style-a"></h3><table><tr><th>인용</th></tr><tr data-guideline="K3 K5">',
                                   '<h3 id="style-a"></h3><table><tr><th>인용</th></tr><tr data-guideline="K9">', 1)
        self.assertTrue(any('need data-guideline' in e and 'style-a' in e
                            for e in self.run_check(SECTIONS + untagged + new)))
        outside = STYLE_K.replace('<table class="guideline-check">', '</section><section id="x"><table class="guideline-check">', 1)
        self.assertTrue(self.run_check(SECTIONS + outside + new))

    def test_revision_does_not_judge_old_memos_retroactively(self):
        bid = sorted(LEGACY)[0]
        rev = TEMPLATE.replace('data-kind="new" data-date="2026-10-12"', 'data-kind="revision" data-date="2026-11-02"')
        old = '<h3 id="style-a"></h3><table><tr><td>옛 메모</td><td>진단</td></tr></table>'
        one = f'<section id="style">{CHECK}{TITLES}{old}<h3 id="style-b"></h3>{MEMO}</section>'
        self.assertEqual(self.run_check(SECTIONS + one + rev, bid=bid, review='2026-11-01'), [])
        none = f'<section id="style">{CHECK}{old}</section>'
        self.assertTrue(any('any memo' in e for e in self.run_check(SECTIONS + none + rev, bid=bid, review='2026-11-01')))
        mixed = one.replace(MEMO, MEMO.replace('</table>', '<tr><td>태그 없음</td><td>x</td></tr></table>'))
        self.assertTrue(any('style-b' in e for e in self.run_check(SECTIONS + mixed + rev, bid=bid, review='2026-11-01')))

    def test_style_pass_needs_a_tagged_memo_per_chapter(self):
        bid = sorted(LEGACY)[0]
        log = TEMPLATE.split('<section id="log">')[1].split('</table>')[0]
        rows = [r for r in log.split('<tr ') if r.startswith(('data-gate="G4"', 'data-gate="G6"', 'data-gate="G7"'))]
        style = ('<section id="log"><table class="gate-round" data-kind="style" data-date="2026-10-13">'
                 + ''.join('<tr ' + r for r in rows).replace('data-approved="나래 리안 지안"', 'data-approved="나래"')
                 + '</table></section>')
        memos = f'<section id="style">{CHECK}{TITLES}<h3 id="style-k-a"></h3>{MEMO}<h3 id="style-k-b"></h3>{MEMO}</section>'
        self.assertEqual(self.run_check(memos + style, bid=bid, review='2026-10-13'), [])
        one = memos.split('<h3 id="style-k-b">')[0] + '</section>'
        self.assertTrue(any('style-k-b' in e for e in self.run_check(one + style, bid=bid, review='2026-10-13')))
        self.assertTrue(any('나래' in e for e in self.run_check(
            memos + style.replace('data-approved="나래"', 'data-approved="리안"'), bid=bid, review='2026-10-13')))
        no_check = memos.replace(CHECK, '')
        no_titles = memos.replace(TITLES, '')
        self.assertTrue(any('style-k-titles' in e for e in self.run_check(no_titles + style, bid=bid, review='2026-10-13')))
        no_k7 = memos.replace('<tr data-guideline="K7"><td>K7</td><td>읽은 곳</td>', '<tr data-guideline="K7"><td>K7</td><td></td>')
        self.assertTrue(any('missing K7' in e for e in self.run_check(no_k7 + style, bid=bid, review='2026-10-13')))
        self.assertTrue(any('guideline-check' in e for e in self.run_check(no_check + style, bid=bid, review='2026-10-13')))
        untagged = memos.replace('<h3 id="style-k-a"></h3><table><tr><th>인용</th></tr><tr data-guideline="K3 K5">',
                                 '<h3 id="style-k-a"></h3><table><tr><th>인용</th></tr><tr>', 1)
        self.assertTrue(any('need data-guideline' in e and 'style-k-a' in e
                            for e in self.run_check(untagged + style, bid=bid, review='2026-10-13')))
        no_g6 = style.replace('data-gate="G6"', 'data-gate="G5"')
        self.assertTrue(any('missing gate G6' in e for e in self.run_check(memos + no_g6, bid=bid, review='2026-10-13')))


if __name__ == '__main__':
    unittest.main()
