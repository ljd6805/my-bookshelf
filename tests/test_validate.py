import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate import validate_html, validate_catalog, validate_shelf_return


class IntegrityChecks(unittest.TestCase):
    def test_nested_links_and_anchors(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'docs').mkdir()
            (root / 'index.html').write_text('<a href="docs/a.html#ok">a</a>')
            (root / 'docs/a.html').write_text('<h1 id="ok">ok</h1><a href="../index.html">back</a>')
            self.assertEqual(validate_html(root)[0], [])
            (root / 'index.html').write_text('<a href="docs/a.html#missing">bad</a><img src="absent.jpg">')
            self.assertEqual(len(validate_html(root)[0]), 2)

    def test_dynamic_routes_still_reject_unknown_fragments(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'index.html').write_text(
                '<meta name="book-routes" content="home,neuron">'
                '<a href="#neuron">valid</a><a href="#absent">invalid</a>')
            errors, _ = validate_html(root)
            self.assertEqual(len(errors), 1)
            self.assertIn('#absent', errors[0])

    def test_internal_book_urls_reject_unsafe_paths(self):
        for url in ['books/ai/', 'books/ai/index.html#neuron']:
            self.assertEqual(validate_catalog({'books': [
                {'id': 'ai', 'status': 'published', 'url': url}]}), [])
        for url in ['books/../docs/a.html', 'books/%2e%2e/docs/a.html',
                    'books/ai%5csecret', '/books/ai/', 'docs/a.html',
                    'javascript:alert(1)', '//example.com/book/']:
            with self.subTest(url=url):
                self.assertTrue(validate_catalog({'books': [
                    {'id': 'ai', 'status': 'published', 'url': url}]}))

    def test_every_book_has_shelf_return_button(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'index.html').write_text('<section id="books"></section>')
            (root / 'books/demo').mkdir(parents=True)
            page = root / 'books/demo/index.html'
            good = '<header><a data-shelf-return href="../../index.html#books">서가로</a></header>'
            page.write_text(good)
            self.assertEqual(validate_shelf_return(root), [])
            for bad in ['<header></header><a data-shelf-return href="../../index.html#books">x</a>',
                        '<header><a href="../../index.html#books">x</a></header>',
                        '<header><a data-shelf-return href="../index.html#books">x</a></header>',
                        '<header><a data-shelf-return href="../../index.html">x</a></header>']:
                with self.subTest(bad=bad):
                    page.write_text(bad)
                    self.assertEqual(len(validate_shelf_return(root)), 1)

    def test_duplicate_ids(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'index.html').write_text('<h1 id="x">a</h1><p id="x">b</p>')
            self.assertIn('duplicate id x', validate_html(root)[0][0])

    def test_catalog_references(self):
        valid = {'books':[{'id':'demo','status':'published','url':'https://example.com/demo/'}], 'learning_paths':[{'steps':[{'book_id':'demo'}]}]}
        self.assertEqual(validate_catalog(valid), [])
        valid['books'].append({'id':'demo','status':'published','url':'http://example.com'})
        valid['learning_paths'][0]['steps'].append({'book_id':'unknown'})
        self.assertEqual(len(validate_catalog(valid)), 3)


if __name__ == '__main__':
    unittest.main()
