import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate import (validate_html, validate_catalog, validate_shelf_return, validate_asset_versions,
                      validate_cross_links, validate_typography, validate_illustrations, validate_covers)
from cover_renderer import cover_errors


class IntegrityChecks(unittest.TestCase):
    def test_transitive_imports_share_the_release_version(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'assets').mkdir()
            (root / 'tests').mkdir()
            (root / 'index.html').write_text('<script src="assets/home.js?v=r2"></script>')
            (root / 'tests/responsive.html').write_text('<iframe src="../index.html?v=r2">')
            (root / 'assets/home.js').write_text("import { a } from './reader.js?v=r2';")
            self.assertEqual(validate_asset_versions(root), [])
            (root / 'assets/reader.js').write_text("import { b } from './motion.js';")
            self.assertEqual(len(validate_asset_versions(root)), 1)

    def test_published_books_need_a_moving_illustration(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            catalog = {'books': [{'id': 'b', 'status': 'published', 'illustration': 'b.svg'}]}
            self.assertEqual(len(validate_illustrations(root, catalog)), 1)
            (root / 'b.svg').write_text('<svg><circle/><style>@media(prefers-reduced-motion:reduce){animate{display:none}}</style></svg>')
            self.assertEqual(len(validate_illustrations(root, catalog)), 1)
            (root / 'b.svg').write_text('<svg><style>.x{animation:k 2s infinite}@keyframes k{to{opacity:0}}</style></svg>')
            self.assertEqual(len(validate_illustrations(root, catalog)), 1)
            (root / 'b.svg').write_text('<svg><style>.x{animation:k 2s infinite}@keyframes k{to{opacity:0}}'
                                        '@media(prefers-reduced-motion:reduce){.x{animation:none}}</style></svg>')
            self.assertEqual(validate_illustrations(root, catalog), [])

    def test_cover_art_is_a_still_wide_plate_with_shared_classes(self):
        good = ('<svg class="cover-art" viewBox="0 0 320 150" role="img" aria-label="입력이 층을 건너 확률이 되는 모습">'
                '<circle class="cv-node" cx="1" cy="1" r="1"/></svg>')
        self.assertEqual(cover_errors(good), [])
        for bad in [good.replace('0 0 320 150', '0 0 100 100'), good.replace('cv-node', 'ai-node'),
                    good.replace('</svg>', '<style>@keyframes x{}</style></svg>'),
                    good.replace(' aria-label="입력이 층을 건너 확률이 되는 모습"', ''),
                    good.replace('r="1"', 'r="1" style = "fill:red"'), good.replace('<circle', '<use href = "x.svg#a"/><circle')]:
            with self.subTest(bad=bad):
                self.assertTrue(cover_errors(bad))

    def test_published_books_need_cover_art_and_meta(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            book = {'id': 'b', 'status': 'published', 'url': 'books/b/', 'title': '책 · 부제',
                    'cover_art': 'books/b/assets/cover-art.svg', 'cover_meta': '3장 · 2개 실험'}
            self.assertEqual(len(validate_covers(root, {'books': [book]})), 1)
            (root / 'books/b/assets').mkdir(parents=True)
            (root / 'books/b/assets/cover-art.svg').write_text(
                '<svg class="cover-art" viewBox="0 0 320 150" aria-label="스위치 두 개가 등을 켜는 회로"></svg>')
            self.assertEqual(validate_covers(root, {'books': [book]}), [])
            self.assertEqual(len(validate_covers(root, {'books': [{**book, 'cover_meta': '3장'}]})), 1)

    def test_cross_book_links_need_a_known_route(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            for book in ('a', 'b'):
                (root / 'books' / book / 'js').mkdir(parents=True)
                (root / 'books' / book / 'index.html').write_text(
                    '<meta name="book-routes" content="home,one">')
            (root / 'books/a/js/content.js').write_text("x = '<a href=\"../b/#one\">'")
            self.assertEqual(validate_cross_links(root), [])
            (root / 'books/a/js/content.js').write_text("x = '../b/index.html#gone'")
            self.assertEqual(len(validate_cross_links(root)), 1)

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
            good = '<header><a class="brand shelf-return" data-shelf-return href="../../index.html#books">서가로</a></header>'
            page.write_text(good)
            self.assertEqual(validate_shelf_return(root), [])
            ok = 'class="shelf-return" data-shelf-return'
            for bad in [f'<header></header><a {ok} href="../../index.html#books">x</a>',
                        '<header><a data-shelf-return href="../../index.html#books">x</a></header>',
                        '<header><a class="shelf-return" href="../../index.html#books">x</a></header>',
                        f'<header><a {ok} href="../index.html#books">x</a></header>',
                        f'<header><a {ok} href="../../index.html">x</a></header>']:
                with self.subTest(bad=bad):
                    page.write_text(bad)
                    self.assertEqual(len(validate_shelf_return(root)), 1)

    def test_shelf_and_books_share_the_type_system(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / 'index.html').write_text('<link rel="stylesheet" href="assets/type.css?v=1">')
            (root / 'books/demo/assets').mkdir(parents=True)
            page, css = root / 'books/demo/index.html', root / 'books/demo/assets/style.css'
            page.write_text('<html lang="ko" data-typeset="book"><link rel="stylesheet" href="../../assets/type.css?v=1">')
            css.write_text('body{font-family:var(--font-sans)}')
            self.assertEqual(validate_typography(root), [])
            css.write_text("@font-face{font-family:X;src:url(x.woff)}")
            self.assertEqual(len(validate_typography(root)), 1)
            for bad in ['h1{font-family:Arial}', '.x{font:12px sans-serif}']:
                with self.subTest(bad=bad):
                    css.write_text(bad)
                    self.assertEqual(len(validate_typography(root)), 1)
            css.write_text('a{font:inherit}.b{font:600 .8rem/1.6 var(--font-mono)}')
            self.assertEqual(validate_typography(root), [])
            css.write_text('')
            page.write_text('<html lang="ko"><link rel="stylesheet" href="assets/style.css">')
            self.assertEqual(len(validate_typography(root)), 2)

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
