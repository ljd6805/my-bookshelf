"""Verify the shelf curation: reading paths and concepts only link to known chapters."""
import json
import unittest
from pathlib import Path
from scripts.curation_renderer import render_curation, concept_terms

ROOT = Path(__file__).resolve().parents[1]
BOOKS = [{'id': 'a', 'title': '책 A', 'short_title': 'A', 'url': 'books/a/'},
         {'id': 'b', 'title': '책 B', 'short_title': 'B', 'url': 'books/b/'}]
INDEX = {'books/a/#one': '01 · 하나', 'books/b/#two': '02 · 둘'}


def path(*steps):
    return {'id': 'p', 'title': '경로', 'question': '왜?', 'audience': '독자', 'prerequisites': '없음',
            'start': '출발', 'challenge': '과제', 'checks': ['점검'],
            'steps': [{'book_id': b, 'url': u, 'task': '할 일', 'minutes': 10, 'why': '이유',
                       'record': '기록'} for b, u in steps]}


class CurationTests(unittest.TestCase):
    def catalog(self, paths=(), concepts=()):
        return {'books': BOOKS, 'chapter_index': INDEX, 'learning_paths': list(paths),
                'concepts': list(concepts)}

    def test_path_lists_books_in_reading_order_and_sums_minutes(self):
        html = render_curation(self.catalog([path(('b', 'books/b/#two'), ('a', 'books/a/#one'))]))
        self.assertIn('B → A', html)
        self.assertIn('약 20분 · 2단계', html)
        self.assertIn('href="books/b/#two"', html)

    def test_unknown_or_mismatched_chapter_fails_the_build(self):
        for steps in [[('a', 'books/a/#missing')], [('b', 'books/a/#one')]]:
            with self.subTest(steps=steps), self.assertRaises(ValueError):
                render_curation(self.catalog([path(*steps)]))

    def test_concepts_feed_shelf_search_for_each_book(self):
        concept = {'id': 'c', 'name': '내적', 'aliases': ['dot product'], 'summary': '요약',
                   'chapters': ['books/a/#one', 'books/b/#two']}
        terms = concept_terms(self.catalog(concepts=[concept]))
        self.assertEqual(terms['a'], ['내적', 'dot product'])
        self.assertIn('2개 장', render_curation(self.catalog(concepts=[concept])))

    def test_real_catalog_concepts_span_more_than_one_book(self):
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        prefixes = [b['url'] for b in catalog['books']]
        for concept in catalog['concepts']:
            owners = {p for url in concept['chapters'] for p in prefixes if url.startswith(p)}
            self.assertGreater(len(owners), 1, concept['id'])


if __name__ == '__main__':
    unittest.main()
