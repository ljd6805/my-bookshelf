"""Render accessible glass spines and real document previews from the catalog."""
import html
import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {'analysis': ('분석과 사례', '다른 책에서 발견한 좋은 질문들'),
          'guide': ('집필과 운영', '다음 사람에게도 이어지는 서재의 기준'),
          'template': ('기획서', '한 권의 책은 하나의 질문에서 시작합니다')}
SPINE_TITLE_MAX_CHARS = 6
TONES = ('aqua', 'blue', 'violet', 'sage', 'amber', 'rose')


def esc(value):
    return html.escape(str(value), quote=True)


def safe_url(value, external=False):
    u = urlsplit(unquote(value))
    if u.scheme == 'https' and u.netloc:
        return esc(value)
    if (external or not value or u.scheme or u.netloc or u.path.startswith('/')
            or '..' in u.path.split('/') or '\\' in u.path):
        raise ValueError(f'Unsupported catalog URL: {value}')
    return esc(value)


def safe_book_url(value):
    url = safe_url(value)
    parsed = urlsplit(unquote(value))
    if not parsed.scheme and not parsed.path.startswith('books/'):
        raise ValueError('Local books must live under books/')
    return url


class Outline(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchor, self.heading, self.titles = '', None, []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'section':
            self.anchor = attrs.get('id', '')
        if tag == 'h2':
            self.heading = []

    def handle_data(self, text):
        if self.heading is not None:
            self.heading.append(text)

    def handle_endtag(self, tag):
        if tag == 'h2' and self.heading is not None:
            self.titles.append((''.join(self.heading).strip(), self.anchor))
            self.heading = None


def outline(item):
    if 'chapters' in item:
        return item['chapters'][:5]
    url = item.get('url', '')
    if urlsplit(url).scheme:
        return item.get('chapters', [])[:5]
    path = ROOT / urlsplit(url).path
    if not path.is_file():
        return []
    parser = Outline()
    parser.feed(path.read_text())
    return [{'title': title, 'url': url + ('#' + anchor if anchor else '')}
            for title, anchor in parser.titles[:5]]


def illustration(item):
    """Inline a book's animated SVG so the page's reduced-motion setting can pause it."""
    path_text = item.get('illustration')
    if not path_text:
        return ''
    path = (ROOT / path_text).resolve()
    if path.suffix != '.svg' or ROOT not in path.parents or not path.is_file():
        raise ValueError(f"{item['id']}: illustration must be an SVG file inside the repository")
    svg = path.read_text().strip()
    if not svg.startswith('<svg') or re.search(r'<script|\son\w+\s*=|<foreignObject|href=', svg, re.I):
        raise ValueError(f"{item['id']}: illustration SVG must not contain scripts, handlers or links")
    caption = item.get('illustration_caption', '')
    return (f'<figure class="reader-illustration">{svg}'
            + (f'<figcaption>{esc(caption)}</figcaption>' if caption else '') + '</figure>')


def preview(item, key):
    chapters = outline(item)
    links = ''.join(f'<li><a href="{safe_url(c["url"])}">{esc(c["title"])}</a></li>'
                    for c in chapters)
    state = item.get('status', 'published')
    action = (f'<a class="button primary reader-action" href="{safe_url(item["url"])}">'
              f'{"문서 읽기" if item.get("category") else "책 읽기"} <span aria-hidden="true">↗</span></a>' if state == 'published'
              else '<p class="reader-state">아직 집필을 준비하고 있습니다.</p>')
    label = item.get('label', '학습 책')
    if state != 'published':
        label += ' · ' + {'planned': '기획 중', 'writing': '집필 중'}[state]
    contents = f'<ol class="chapter-list">{links}</ol>' if links else (
        '<p>이 책의 소개를 읽고, 아래 링크에서 내용을 이어서 살펴보세요.</p>'
        if state == 'published' else '<p>첫 장의 질문과 목차가 정해지면 이곳에 담습니다.</p>')
    # Like a printed spread: contents on the left (verso), title page on the right (recto).
    return (f'<template id="preview-{esc(key)}"><div class="reader-contents">'
            f'<h3>이 책에서 만날 내용</h3>{contents}</div><div class="reader-copy">'
            f'<p class="reader-category">{esc(label)}</p>{illustration(item)}'
            f'<h2 class="reader-title">{esc(item["title"])}</h2>'
            f'<p class="reader-description">{esc(item["description"])}</p>'
            f'{action}</div></template>')


def spine_title(item):
    raw = item.get('spine_title')
    if not isinstance(raw, str):
        raise ValueError(f"{item['id']}: spine_title is required; write a short content-based title")
    title = ''.join(unicodedata.normalize('NFC', raw).split())
    if not 1 <= len(title) <= SPINE_TITLE_MAX_CHARS or '…' in title or '...' in title:
        raise ValueError(f"{item['id']}: spine_title must be 1–{SPINE_TITLE_MAX_CHARS} characters "
                         "without spaces or ellipses; rewrite the title to match the content")
    return title


def spine(item, index, key):
    title = spine_title(item)
    label = item.get('spine_category', item.get('label', '학습'))
    tone = item.get('color', TONES[index % len(TONES)])
    if tone not in TONES:
        raise ValueError(f'Unknown glass color: {tone}')
    search = ' '.join([item['title'], title, label, item['description'],
                       *item.get('keywords', [])])
    state = item.get('status', 'published')
    tag = 'a' if state == 'published' else 'button'
    attrs = f'href="{safe_url(item["url"])}"' if tag == 'a' else 'type="button"'
    category = item.get('category', 'book')
    return (f'<{tag} {attrs} class="glass-book tone-{tone}" data-resource="{esc(key)}" '
            f'data-category="{esc(category)}" data-search="{esc(search)}" '
            f'data-preview="preview-{esc(key)}" aria-label="{esc(item["title"])} · {esc(label)}" '
            f'title="{esc(item["title"])}">'
            '<span class="glass-top" aria-hidden="true"></span>'
            f'<span class="spine-label"><span class="spine-title">{esc(title)}</span>'
            f'<span class="list-title">{esc(item["title"])}</span>'
            f'<span class="spine-category">{esc(label)}</span></span>'
            '<span class="glass-foot" aria-hidden="true"></span>'
            f'</{tag}>' + preview(item, key))


def shelf(items, category, offset=0):
    name, description = GROUPS.get(category, ('학습 책', ''))
    if category == 'book':
        name, description = '학습 책', ''
    books = ''.join(spine(item, offset + i, item['id']) for i, item in enumerate(items))
    return (f'<section class="shelf-row" data-shelf="{category}" '
            f'aria-label="{esc(name)} 자료">'
            f'<div class="book-track" tabindex="0" role="group" aria-label="{esc(name)} 서가">'
            f'{books}</div><div class="shelf-plank" aria-hidden="true"></div>'
            f'<div class="shelf-caption"><h3>{esc(name)}</h3><span>{esc(description)}</span></div>'
            '</section>')


def render_resources(resources):
    if not resources:
        return ('<div class="empty-shelf"><div><h3>새로운 지식을 기다리는 서가입니다.</h3>'
                '<p>아직 등록된 지식자료가 없습니다. 학습자료를 모아 이곳에 채워갑니다.</p>'
                '</div></div>')
    seen = set()
    for item in resources:
        if not item['id'] or item['id'] in seen or item['category'] not in GROUPS:
            raise ValueError('Resource ID must be unique and category must be known')
        safe_url(item['url'])
        seen.add(item['id'])
    result = []
    for category in GROUPS:
        group = [r for r in resources if r['category'] == category]
        for start in range(0, len(group), 12):
            result.append(shelf(group[start:start + 12], category, start))
    return '\n'.join(result)
