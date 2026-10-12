import json
import tempfile
import unittest
from pathlib import Path
from scripts.study_rules import PENDING, review_errors, validate_study

ROOT = Path(__file__).resolve().parents[1]
TAG = '<script type="module" src="../../assets/book-study.js?v=t1" data-book-study{}></script>'
Q = {'q': '질문', 'choices': ['가', '나', '다'], 'answer': 1, 'why': '설명'}


def page(routes, review=''):
    return (f'<html><head><meta name="book-routes" content="{routes}">'
            + TAG.format(f' data-review="{review}"' if review else '') + '</head><body></body></html>')


class StudyRules(unittest.TestCase):
    def make(self, root, folder, html, data=None):
        (root / 'books' / folder).mkdir(parents=True)
        (root / 'books' / folder / 'index.html').write_text(html)
        if data is not None:
            (root / 'books' / folder / 'review.json').write_text(json.dumps(data))

    def test_every_book_loads_the_shared_script(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            self.make(root, 'plain', '<html><head></head></html>')
            self.assertIn('data-book-study', validate_study(root, {'books': []})[0])

    def test_published_book_needs_quizzes_unless_pending(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            self.make(root, 'new', page('home,a,b'))
            catalog = {'books': [{'status': 'published', 'url': 'books/new/'}]}
            self.assertEqual(len(validate_study(root, catalog)), 1)
            self.make(root, 'draft', page('home,a'))
            catalog['books'].append({'status': 'writing', 'url': 'books/draft/'})
            self.assertEqual(len(validate_study(root, catalog)), 1)

    def test_complete_quiz_file_passes_and_gaps_fail(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            good = {'schema': 1, 'book': 'new', 'chapters': {'a': [Q, Q], 'b': [Q, Q]}}
            self.make(root, 'new', page('home,chapters,sources,a,b', 'review.json'), good)
            self.assertEqual(validate_study(root, {'books': []}), [])
        routes = ['a', 'b']
        self.assertTrue(review_errors('new', {'schema': 1, 'book': 'new', 'chapters': {'a': [Q, Q]}}, routes))
        self.assertTrue(review_errors('new', {'schema': 1, 'book': 'new', 'chapters': {'a': [Q], 'b': [Q, Q]}}, routes))
        self.assertTrue(review_errors('new', {'schema': 1, 'book': 'other', 'chapters': {}}, routes))

    def test_question_shape(self):
        bad = [dict(Q, answer=3), dict(Q, answer=True), dict(Q, choices=['가', '가', '다']),
               dict(Q, choices=['가', '나']), dict(Q, why=''), dict(Q, q=' ')]
        for q in bad:
            data = {'schema': 1, 'book': 'x', 'chapters': {'a': [Q, q]}}
            self.assertTrue(review_errors('x', data, ['a']), q)

    def test_pending_book_with_quizzes_must_leave_the_list(self):
        folder = sorted(PENDING)[0]
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            self.make(root, folder, page('a', 'review.json'), {})
            self.assertIn('PENDING', validate_study(root, {'books': []})[0])

    def test_repository_books_pass(self):
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        self.assertEqual(validate_study(ROOT, catalog), [])


if __name__ == '__main__':
    unittest.main()
