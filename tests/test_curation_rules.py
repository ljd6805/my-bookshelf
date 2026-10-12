"""A new published book must join the concept map, a reading path, and the web of cross links."""
import tempfile
import unittest
from pathlib import Path
from scripts.curation_rules import validate_knowledge_links


def make_book(root, folder, link_to=None):
    (root / 'books' / folder / 'js').mkdir(parents=True)
    (root / 'books' / folder / 'index.html').write_text(
        '<meta name="book-routes" content="home,one,two">')
    (root / 'books' / folder / 'js/content.js').write_text(
        f"x = '../{link_to}/#one'" if link_to else '')


def catalog():
    books = [{'id': f, 'url': f'books/{f}/', 'status': 'published'} for f in ('a', 'b')]
    return {'books': books,
            'chapter_index': {'books/a/#one': '01', 'books/b/#one': '01', 'books/b/#two': '02'},
            'concepts': [{'id': f'c{i}', 'chapters': ['books/a/#one', 'books/b/#one']} for i in (1, 2)],
            'learning_paths': [{'id': 'p', 'steps': [{'book_id': 'a', 'url': 'books/a/#one'},
                                                     {'book_id': 'b', 'url': 'books/b/#one'}]}]}


class KnowledgeLinkRules(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        make_book(self.root, 'a', link_to='b')
        make_book(self.root, 'b', link_to='a')

    def tearDown(self):
        self.tmp.cleanup()

    def test_a_fully_connected_shelf_passes(self):
        self.assertEqual(validate_knowledge_links(self.root, catalog()), [])

    def test_new_book_without_map_path_or_links_fails_each_rule(self):
        data = catalog()
        make_book(self.root, 'c')
        data['books'].append({'id': 'c', 'url': 'books/c/', 'status': 'published'})
        errors = '\n'.join(validate_knowledge_links(self.root, data))
        for rule in ('chapter_index', 'shared concepts', 'learning path', 'link to another book',
                     'no other book links to it'):
            self.assertIn(rule, errors)

    def test_planned_books_are_not_required_yet(self):
        data = catalog()
        data['books'].append({'id': 'c', 'url': 'books/c/', 'status': 'planned'})
        self.assertEqual(validate_knowledge_links(self.root, data), [])

    def test_index_anchor_and_duplicates_are_caught(self):
        data = catalog()
        data['chapter_index']['books/a/#gone'] = '09'
        data['concepts'][0]['chapters'].append('books/a/#one')
        data['learning_paths'][0]['steps'].append({'book_id': 'a', 'url': 'books/a/#one'})
        self.assertEqual(len(validate_knowledge_links(self.root, data)), 3)

    def test_long_concept_name_that_would_not_fit_its_map_row_fails(self):
        data = catalog()
        data['concepts'][0]['name'] = '평가 숫자의 불확실성'
        self.assertEqual(validate_knowledge_links(self.root, data), [])
        data['concepts'][0]['name'] = '아주 긴 이름을 가진 공통 개념 하나'
        self.assertTrue(any('fits its row' in e for e in validate_knowledge_links(self.root, data)))


if __name__ == '__main__':
    unittest.main()
