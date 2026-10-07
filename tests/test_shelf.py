"""Glass shelves must stay honest, accessible and safe as the catalog grows."""
import unittest
from scripts.build_catalog import build
from scripts.shelf_renderer import render_resources, spine


def resource(index=0):
    return {'id': f'doc-{index}', 'category': 'analysis', 'label': '분석',
            'title': '학습의 연결', 'description': '자료 설명', 'url': 'docs/guide.html'}


class GlassShelfTests(unittest.TestCase):
    def test_many_books_create_additional_shelves(self):
        result = render_resources([resource(i) for i in range(25)])
        self.assertEqual(result.count('class="shelf-row"'), 3)
        self.assertEqual(result.count('data-resource='), 25)
        self.assertEqual(result.count('<template '), 25)

    def test_no_javascript_still_has_direct_document_links(self):
        result = spine(resource(), 0, 'doc-0')
        self.assertIn('<a href="docs/guide.html"', result)
        self.assertIn('aria-label="학습의 연결 · 분석"', result)
        self.assertIn('학습의연결</span>', result)

    def test_disallow_unregistered_material_color(self):
        item = {**resource(), 'color': 'red; background: url(evil)'}
        with self.assertRaises(ValueError):
            spine(item, 0, 'doc-0')

    def test_cross_list_id_collision_fails(self):
        with self.assertRaises(ValueError):
            build('', {'resources': [resource()], 'books': [{'id': 'doc-0'}]})

    def test_planned_book_has_no_read_action(self):
        item = {**resource(), 'status': 'planned'}
        del item['url']
        result = spine(item, 0, 'planned')
        self.assertIn('기획 중', result)
        self.assertNotIn('reader-action', result)
        self.assertIn('<button type="button"', result)


if __name__ == '__main__':
    unittest.main()
