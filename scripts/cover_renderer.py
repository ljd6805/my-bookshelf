"""Render the closed-book jacket shown while a book opens (docs/08-book-template.html#cover).

The jacket is kept in an inert <template> inside the preview, so it never renders on the page
until assets/motion.js clones it onto the swinging cover.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVER_FILE = 'assets/cover-art.svg'
COVER_VIEWBOX = '0 0 320 150'
COVER_META = re.compile(r'^\d+장 · \d+개 실험$')
LIBRARY_NAME = 'Jdeok.Lee의 서재'
UNSAFE = re.compile(r'<script|\son\w+\s*=|<foreignObject|href=|<image|<style|style=', re.I)
MOTION = re.compile(r'@keyframes|<animate|<set\b|animation', re.I)


def esc(value):
    return html.escape(str(value), quote=True)


def cover_errors(svg):
    """Rules every cover-art.svg follows; shared by the generator and validate.py."""
    errors = []
    if not svg.startswith('<svg') or f'viewBox="{COVER_VIEWBOX}"' not in svg.split('>', 1)[0]:
        errors.append(f'must start with <svg viewBox="{COVER_VIEWBOX}"> (a wide 32:15 plate)')
    if 'class="cover-art"' not in svg.split('>', 1)[0] or not re.search(r'aria-label="[^"]{8,}"', svg):
        errors.append('root <svg> needs class="cover-art" and a one-sentence aria-label')
    if UNSAFE.search(svg):
        errors.append('must not contain scripts, handlers, links, images or its own styles')
    if MOTION.search(svg):
        errors.append('must be a still drawing (the cover is on screen for about one second)')
    for name in re.findall(r'class="([^"]+)"', svg):
        if any(not token.startswith('cv-') and token != 'cover-art' for token in name.split()):
            errors.append(f'class "{name}" must use only the shared cv-* drawing classes')
            break
    return errors


def cover_art(item):
    path = (ROOT / item['cover_art']).resolve()
    if path.name != 'cover-art.svg' or ROOT not in path.parents or not path.is_file():
        raise ValueError(f"{item['id']}: cover_art must be books/<topic>/{COVER_FILE}")
    svg = path.read_text().strip()
    errors = cover_errors(svg)
    if errors:
        raise ValueError(f"{item['id']}: cover art {errors[0]} (docs/08-book-template.html#cover)")
    return svg


def jacket(item, number):
    """Head (category, number) → wide plate → title, rule, subtitle → foot (size, library)."""
    if not item.get('cover_art'):
        if item.get('status') == 'published' and item.get('category', 'book') == 'book':
            raise ValueError(f"{item['id']}: a published book needs cover_art and cover_meta "
                             '(docs/08-book-template.html#cover)')
        return ''
    meta = item.get('cover_meta', '')
    if not COVER_META.match(meta):
        raise ValueError(f"{item['id']}: cover_meta must read like '12장 · 18개 실험'")
    title, _, subtitle = item['title'].partition(' · ')
    category = item.get('spine_category', '')
    return (f'<template class="book-jacket"><div class="jacket">'
            f'<div class="jacket-head"><span>{esc(category)}</span>'
            f'<span class="jacket-no">No. {number:02d}</span></div>'
            f'<div class="jacket-main"><div class="jacket-plate">{cover_art(item)}</div>'
            f'<div class="jacket-body"><p class="jacket-title">{esc(title)}</p>'
            '<span class="jacket-rule"></span>'
            + (f'<p class="jacket-sub">{esc(subtitle)}</p>' if subtitle else '') +
            f'</div></div><div class="jacket-foot"><span>{esc(meta)}</span>'
            f'<b>{esc(LIBRARY_NAME)}</b></div></div></template>')
