import tempfile
import unittest
from pathlib import Path
from scripts.fact_review import review_errors, validate_fact_reviews, PENDING

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / 'templates/fact-review.html').read_text()


class FactReviewRecords(unittest.TestCase):
    def test_template_is_a_valid_record(self):
        self.assertEqual(review_errors(TEMPLATE), [])

    def test_author_cannot_review_their_own_book(self):
        text = TEMPLATE.replace('Claude · 책 집필 스레드', 'Claude · 기존 도서 팩트 검수 스레드')
        self.assertIn('reviewer must be a different agent from the author', review_errors(text))

    def test_open_findings_block_the_latest_round(self):
        self.assertTrue(review_errors(TEMPLATE.replace('data-result="fixed"', 'data-result="open"')))
        self.assertTrue(review_errors(TEMPLATE.replace('data-check="sources" data-status="fixed"',
                                                       'data-check="sources" data-status="open"')))
        self.assertTrue(review_errors(TEMPLATE.replace('data-check="terms"', 'data-check="x"')))

    def test_published_book_needs_a_record_unless_pending(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            catalog = {'books': [{'id': 'new-book', 'status': 'published', 'url': 'books/new/'},
                                 {'id': 'draft', 'status': 'writing', 'url': 'books/draft/'}]}
            self.assertEqual(len(validate_fact_reviews(root, catalog)), 1)
            (root / 'books/new/docs').mkdir(parents=True)
            (root / 'books/new/docs/fact-review.html').write_text(TEMPLATE)
            self.assertEqual(validate_fact_reviews(root, catalog), [])

    def test_pending_book_with_a_record_must_leave_the_list(self):
        bid = sorted(PENDING)[0] if PENDING else None
        if not bid:
            self.skipTest('no pending books left')
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            catalog = {'books': [{'id': bid, 'status': 'published', 'url': 'books/x/'}]}
            self.assertEqual(validate_fact_reviews(root, catalog), [])
            (root / 'books/x/docs').mkdir(parents=True)
            (root / 'books/x/docs/fact-review.html').write_text(TEMPLATE)
            self.assertEqual(len(validate_fact_reviews(root, catalog)), 1)


if __name__ == '__main__':
    unittest.main()
