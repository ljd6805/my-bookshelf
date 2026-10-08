"""Glass shelves must stay honest, accessible and safe as the catalog grows."""
import unicodedata
import unittest
from scripts.build_catalog import build
from scripts.shelf_renderer import render_resources, spine, check_shelf_harmony


def resource(index=0):
    return {'id': f'doc-{index}', 'category': 'analysis', 'label': '분석',
            'title': '학습의 연결', 'spine_title': '학습의 연결', 'description': '자료 설명', 'url': 'docs/guide.html'}


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

    def test_edited_six_character_spine_keeps_the_full_title(self):
        item = {**resource(), 'title': '아주 긴 제목을 가진 새로운 학습 책',
                'spine_title': 'AI 원리 실험'}
        result = spine(item, 0, 'long-book')
        self.assertIn('AI원리실험</span>', result)
        self.assertNotIn('…', result)
        self.assertIn(f'class="list-title">{item["title"]}', result)
        self.assertIn(f'class="reader-title">{item["title"]}', result)
        self.assertIn(f'aria-label="{item["title"]}', result)

    def test_missing_oversize_or_truncated_spine_requires_editing(self):
        for title in [None, '', '  ', '인공지능원리실험', 'AI 원리 실험서', '인공지능…', 'AI...']:
            with self.subTest(title=title), self.assertRaisesRegex(ValueError, 'spine_title'):
                spine({**resource(), 'spine_title': title}, 0, 'invalid')
        item = resource()
        del item['spine_title']
        with self.assertRaisesRegex(ValueError, 'spine_title'):
            spine(item, 0, 'missing')

    def test_decomposed_korean_counts_as_complete_syllables(self):
        import unicodedata
        item = {**resource(), 'spine_title': unicodedata.normalize('NFD', '인공지능실험')}
        self.assertIn('인공지능실험</span>', spine(item, 0, 'normalized'))

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

    def test_book_illustration_is_inlined_with_caption(self):
        item = {**resource(), 'illustration': 'books/ai/assets/shelf-illustration.svg',
                'illustration_caption': '시각적 비유'}
        result = spine(item, 0, 'ai')
        self.assertIn('<figure class="reader-illustration"><svg', result)
        self.assertIn('<figcaption>시각적 비유</figcaption>', result)

    def test_illustration_outside_repository_or_not_svg_fails(self):
        for path in ('../outside.svg', 'index.html'):
            with self.assertRaises(ValueError):
                spine({**resource(), 'illustration': path}, 0, 'bad')

    def test_shelf_display_rules_accept_grouped_distinct_neighbours(self):
        check_shelf_harmony([shelf_book('a', '수학', 'violet'), shelf_book('b', '수학', 'sage'),
                             shelf_book('c', '컴퓨터', 'violet')])

    def test_shelf_display_rules_reject_untidy_neighbours(self):
        cases = {'share a color': [shelf_book('a', '수학', 'sage'), shelf_book('b', '컴퓨터', 'sage')],
                 'next to each other': [shelf_book('a', '수학', 'sage'), shelf_book('b', '컴퓨터', 'blue'),
                                        shelf_book('c', '수학', 'amber')],
                 'spine_category': [shelf_book('a', '네트워크보안', 'sage')],
                 'NFC with single spaces': [shelf_book('a', 'AI     시스', 'sage')],
                 'NFC': [shelf_book('a', unicodedata.normalize('NFD', '수학'), 'amber')],
                 'color must be': [shelf_book('a', '수학', None)],
                 'illustration': [{**shelf_book('a', '수학', 'sage'), 'illustration': ''}]}
        for message, books in cases.items():
            with self.subTest(message), self.assertRaisesRegex(ValueError, message):
                check_shelf_harmony(books)


def shelf_book(book_id, category, color):
    return {'id': book_id, 'spine_category': category, 'color': color, 'status': 'published',
            'illustration': 'books/ai/assets/shelf-illustration.svg'}


if __name__ == '__main__':
    unittest.main()
