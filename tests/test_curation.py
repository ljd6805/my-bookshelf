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




class AtlasLayoutTests(unittest.TestCase):
    def test_every_real_concept_is_one_row_with_a_stop_at_each_of_its_books(self):
        from scripts.atlas_renderer import columns, grouped_rows, owner_of
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        books, concepts = catalog['books'], catalog['concepts']
        cols = columns(concepts, books)
        rows = [r for _, group in grouped_rows(concepts, cols, books) for r in group]
        self.assertEqual(sorted(r['concept']['id'] for r in rows), sorted(c['id'] for c in concepts))
        for row in rows:
            owners = {owner_of(url, books) for url in row['concept']['chapters']}
            self.assertEqual(set(row['counts']), owners, row['concept']['id'])
            self.assertEqual(sum(row['counts'].values()), len(row['concept']['chapters']))
            self.assertLess(row['first'], row['last'], row['concept']['id'])

    def test_columns_keep_shelf_order_and_groups_follow_the_fields(self):
        from scripts.atlas_renderer import columns, grouped_rows, fields_in_order
        books = [dict(BOOKS[0], spine_category='수학'), dict(BOOKS[1], spine_category='컴퓨터'),
                 {'id': 'c', 'title': '책 C', 'url': 'books/c/', 'spine_category': '수학'}]
        concepts = [{'id': 'x', 'name': 'X', 'chapters': ['books/b/#1', 'books/b/#2', 'books/a/#1']},
                    {'id': 'y', 'name': 'Y', 'chapters': ['books/a/#1', 'books/c/#1']}]
        cols = columns(concepts, books)
        self.assertEqual([b['id'] for b in cols], ['a', 'b', 'c'])
        self.assertEqual(fields_in_order(cols), ['수학', '컴퓨터'])
        groups = grouped_rows(concepts, cols, books)
        self.assertEqual([(f, [r['concept']['id'] for r in rows]) for f, rows in groups],
                         [('수학', ['y']), ('컴퓨터', ['x'])])

    def test_thirty_books_and_sixty_concepts_render_without_layout_limits(self):
        books = [{'id': f'b{i}', 'title': f'책 {i}', 'url': f'books/b{i}/', 'spine_category': f'분야{i // 6}'}
                 for i in range(30)]
        index = {f'books/b{i}/#c': f'01 · 장 {i}' for i in range(30)}
        concepts = [{'id': f'k{n}', 'name': f'개념 {n}', 'summary': '요약',
                     'chapters': [f'books/b{n % 30}/#c', f'books/b{(n * 7 + 3) % 30}/#c']}
                    for n in range(60) if n % 30 != (n * 7 + 3) % 30]
        html = render_curation({'books': books, 'chapter_index': index, 'learning_paths': [],
                                'concepts': concepts})
        self.assertEqual(html.count('class="atlas-row"'), len(concepts))
        self.assertEqual(html.count('scope="col" class="atlas-book'), 30)
        self.assertIn('--books:30', html)


if __name__ == '__main__':
    unittest.main()
