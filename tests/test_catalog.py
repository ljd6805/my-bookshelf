"""Verify catalog publishing states, safe links, and repeatable generation."""
import unittest
import json
from pathlib import Path
from scripts.build_catalog import build, render_books, render_resources, safe_url


class CatalogRenderingTests(unittest.TestCase):
    def test_published_catalog_contains_only_learning_content(self):
        root = Path(__file__).resolve().parents[1]
        catalog = json.loads((root / 'data/catalog.json').read_text())
        self.assertEqual(catalog['resources'], [])
        self.assertEqual(catalog['books'][0]['id'], 'ai-book-interactive')
        home = (root / 'index.html').read_text()
        self.assertEqual(home.count('data-resource='), 1)
        self.assertIn('전체 1개 자료', home)
        self.assertIn('https://ljd6805.github.io/ai-book-interactive/', home)

    def test_empty_books_have_no_fake_book_link(self):
        result = render_books([])
        self.assertIn('아직 등록된 학습 책이 없습니다', result)
        self.assertNotIn('책 읽기', result)

    def test_only_published_book_gets_a_link(self):
        books = [{'id': 'one', 'title': '첫 책', 'description': '설명',
                  'status': 'published', 'url': 'https://example.com/book/'},
                 {'id': 'two', 'title': '다음 책', 'description': '기획', 'status': 'planned'}]
        result = render_books(books)
        self.assertEqual(result.count('책 읽기'), 1)
        self.assertIn('https://example.com/book/', result)
        self.assertIn('기획 중', result)

    def test_reject_unsafe_or_project_root_breaking_links(self):
        for url in ['javascript:alert(1)', '//example.com', '/report.html', '../report.html', '']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                safe_url(url)
        with self.assertRaises(ValueError):
            safe_url('book/index.html', external=True)

    def test_escape_content_and_reject_duplicate_resources(self):
        item = {'id': 'one', 'category': 'guide', 'label': '문서', 'title': '<script>',
                'description': 'A & B', 'url': 'docs/guide.html'}
        result = render_resources([item])
        self.assertNotIn('<script>', result)
        self.assertIn('&lt;script&gt;', result)
        self.assertIn('A &amp; B', result)
        with self.assertRaises(ValueError):
            render_resources([item, item])

    def test_rebuild_is_idempotent(self):
        source = '\n'.join(f'<!-- {x}:START --><!-- {x}:END -->'
                           for x in ['RESOURCES', 'BOOKS', 'COUNT'])
        first = build(source, {'resources': [], 'books': []})
        self.assertEqual(build(first, {'resources': [], 'books': []}), first)


if __name__ == '__main__':
    unittest.main()
