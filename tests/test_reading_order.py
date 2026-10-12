import json
import unittest
from pathlib import Path

from scripts.reading_order import field_orders, order_books, votes_for

ROOT = Path(__file__).resolve().parents[1]


def book(book_id, field):
    return {'id': book_id, 'title': book_id, 'url': f'books/{book_id}/', 'spine_category': field}


def path(path_id, *book_ids):
    return {'id': path_id, 'title': path_id, 'steps': [{'book_id': b, 'url': f'books/{b}/#c', 'why': f'{b}로 간다'} for b in book_ids]}


class ReadingOrderTests(unittest.TestCase):
    def test_real_catalog_orders_follow_series_and_paths(self):
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        orders = field_orders(catalog)
        books = catalog['books']
        for field, steps in orders.items():
            members = [b['id'] for b in books if (b.get('spine_category') or '기타') == field]
            self.assertEqual(sorted(s['book'] for s in steps), sorted(members), field)
            for step in steps:
                self.assertTrue(step['reason'].strip(), step['book'])
                self.assertIn(step['via']['kind'], {'series', 'path', 'shelf'})
        series = [v['book_id'] for v in catalog['series'][0]['volumes'] if v.get('book_id')]
        aie = [s['book'] for s in orders['AI공학'] if s['book'] in series]
        self.assertEqual(aie, series)
        self.assertEqual([s['book'] for s in orders['인공지능']][:3], ['ai-book-interactive', 'llm-systems', 'llm-performance'])
        self.assertEqual(orders['지식관리'][0]['book'], 'search-rag')

    def test_reason_links_point_at_rendered_anchors(self):
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        html = (ROOT / 'index.html').read_text()
        for steps in field_orders(catalog).values():
            for step in steps:
                self.assertIn(f'id="{step["via"]["href"][1:]}"', html, step['via'])

    def test_books_without_votes_keep_shelf_order_and_say_so(self):
        catalog = {'books': [book('a', '수학'), book('b', '수학')], 'learning_paths': [], 'series': []}
        steps = field_orders(catalog)['수학']
        self.assertEqual([s['book'] for s in steps], ['a', 'b'])
        self.assertEqual({s['via']['kind'] for s in steps}, {'shelf'})

    def test_a_free_book_does_not_split_a_voted_chain(self):
        catalog = {'learning_paths': [path('p', 'c', 'b')], 'series': []}
        self.assertEqual(order_books(['a', 'b', 'c'], votes_for(['a', 'b', 'c'], catalog)), ['a', 'c', 'b'])

    def test_majority_wins_when_paths_disagree_and_series_outweighs_paths(self):
        catalog = {'learning_paths': [path('p1', 'b', 'a'), path('p2', 'b', 'a'), path('p3', 'a', 'b')], 'series': []}
        self.assertEqual(order_books(['a', 'b'], votes_for(['a', 'b'], catalog)), ['b', 'a'])
        catalog['series'] = [{'id': 's', 'title': 'S', 'volumes': [{'number': 1, 'book_id': 'a'}, {'number': 2, 'book_id': 'b'}]}]
        self.assertEqual(order_books(['a', 'b'], votes_for(['a', 'b'], catalog)), ['a', 'b'])

    def test_path_reason_names_the_path_and_the_previous_book(self):
        catalog = {'books': [book('a', '수학'), book('b', '수학')], 'learning_paths': [path('p', 'a', 'b')], 'series': []}
        steps = field_orders(catalog)['수학']
        self.assertEqual(steps[1]['via'], {'kind': 'path', 'title': 'p', 'href': '#path-p'})
        self.assertIn('a 다음에', steps[1]['reason'])
        self.assertIn('b로 간다.', steps[1]['reason'])


if __name__ == '__main__':
    unittest.main()
