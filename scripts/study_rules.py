"""Chapter progress and review quizzes for every book (AGENTS.md 학습 기능, docs/08-book-template.html#study).

Every book loads the shared assets/book-study.js in <head>. A book that has review quizzes
passes its question file through data-review; the file lists two or more questions for every
chapter route. Books published before the rule are in PENDING until their quizzes are written
and fact-reviewed; remove a book's folder from PENDING in the same commit that adds its file.
"""
import json
import re

TAG = re.compile(r'<script type="module" src="\.\./\.\./assets/book-study\.js\?v=[\w-]+" data-book-study'
                 r'(?: data-review="([\w./-]+\.json)")?></script>')
NOT_CHAPTERS = {'home', 'chapters', 'sources'}
MIN_QUESTIONS = 2

# Published before review quizzes existed (2026-10-12). Each entry is a books/<folder> name.
PENDING = {
    'ai', 'llm-gpu', 'llm-performance', 'transformer',
    'aie-workbench', 'aie-math', 'aie-ml', 'aie-deep', 'aie-vision', 'aie-nlp', 'aie-audio',
    'aie-transformer', 'aie-generative', 'aie-rl', 'aie-llm-build', 'aie-llm-apps',
    'aie-multimodal', 'aie-tools', 'aie-agents', 'aie-autonomy', 'aie-multiagent',
    'aie-production', 'aie-safety', 'aie-capstone',
}


def chapter_routes(index_html):
    match = re.search(r'<meta name="book-routes" content="([^"]*)"', index_html)
    return [r for r in (match[1].split(',') if match else []) if r and r not in NOT_CHAPTERS]


def question_errors(where, q):
    errors = []
    if not isinstance(q, dict):
        return [f'{where}: each question must be an object']
    if not isinstance(q.get('q'), str) or not q['q'].strip():
        errors.append(f'{where}: needs a question text "q"')
    choices = q.get('choices')
    if (not isinstance(choices, list) or not 3 <= len(choices) <= 4
            or not all(isinstance(c, str) and c.strip() for c in choices) or len(set(choices)) != len(choices)):
        errors.append(f'{where}: "choices" must be 3–4 different non-empty strings')
    elif not isinstance(q.get('answer'), int) or isinstance(q.get('answer'), bool) \
            or not 0 <= q['answer'] < len(choices):
        errors.append(f'{where}: "answer" must be the 0-based index of a choice')
    if not isinstance(q.get('why'), str) or not q['why'].strip():
        errors.append(f'{where}: needs an explanation "why"')
    return errors


def review_errors(folder, data, routes):
    """Problems in one book's review.json against its chapter routes."""
    name = f'books/{folder}/review.json'
    if not isinstance(data, dict) or data.get('schema') != 1 or data.get('book') != folder:
        return [f'{name}: needs "schema": 1 and "book": "{folder}"']
    chapters = data.get('chapters')
    if not isinstance(chapters, dict):
        return [f'{name}: needs a "chapters" object']
    errors = []
    for missing in [r for r in routes if r not in chapters]:
        errors.append(f'{name}: chapter "{missing}" has no review questions')
    for extra in [c for c in chapters if c not in routes]:
        errors.append(f'{name}: "{extra}" is not a chapter route of the book')
    for chapter, questions in chapters.items():
        if not isinstance(questions, list) or len(questions) < MIN_QUESTIONS:
            errors.append(f'{name}: chapter "{chapter}" needs at least {MIN_QUESTIONS} questions')
            continue
        for i, q in enumerate(questions):
            errors += question_errors(f'{name} {chapter}[{i}]', q)
    return errors


def validate_study(root, catalog):
    errors = []
    published = {b['url'].strip('/').split('/')[1] for b in catalog.get('books', [])
                 if b.get('status') == 'published' and b.get('url', '').startswith('books/')}
    for page in sorted(root.glob('books/*/index.html')):
        folder, text = page.parent.name, page.read_text()
        head = text.split('</head>', 1)[0]
        match = TAG.search(head)
        if not match:
            errors.append(f'books/{folder}/index.html: <head> needs <script type="module" '
                          'src="../../assets/book-study.js?v=..." data-book-study>')
            continue
        review = match[1]
        if folder in PENDING:
            if review:
                errors.append(f'books/{folder}: has review quizzes; remove it from study_rules.PENDING')
            continue
        if not review:
            if folder in published:
                errors.append(f'books/{folder}/index.html: published book needs data-review="review.json" '
                              '(docs/08-book-template.html#study)')
            continue
        path = page.parent / review
        if not path.is_file():
            errors.append(f'books/{folder}/{review}: data-review file is missing')
            continue
        errors += review_errors(folder, json.loads(path.read_text()), chapter_routes(text))
    return errors
