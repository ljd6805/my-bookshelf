"""Draw the flat SVG portraits of the virtual book-making team (team.html, docs/10-agent-team.html).

Each persona in data/agent-team.json has a "portrait" object. The drawing is a plain
illustration built from a few parts (hair, top, glasses, face, a prop badge that shows the
person's work); it is a visual metaphor, not a likeness of any real person. Colors that
belong to the team come from the CSS variables --t (face tone) and --e (edge tone).
"""
import html

SKINS = ['#f6d9c2', '#eec5a3', '#ddab85', '#c99066', '#a9724c', '#86573a']
HAIR_BACK = {
    'bob': 'M37 50C36 30 48 23 60 23C72 23 84 30 83 50L84 74C80 77 76 76 74 72L46 72C44 76 40 77 36 74Z',
    'long': 'M37 50C36 29 48 23 60 23C72 23 84 29 83 50L86 96C80 99 74 97 72 92L48 92C46 97 40 99 34 96Z',
    'ponytail': 'M78 40C90 44 92 62 86 78C84 70 80 60 76 54Z',
}
FRINGE = 'M40 47C41 32 51 27 60 27C70 27 79 32 80 47C74 40 66 37 58 38C50 39 44 42 40 47Z'
HAIR_FRONT = {
    'short': 'M40 50C38 33 48 25 61 25C73 25 82 33 80 50C77 41 71 36 64 35C57 39 47 40 40 50Z',
    'side': 'M40 52C37 33 49 24 62 25C75 26 83 35 80 50C78 44 76 40 73 37C62 40 50 38 40 52Z',
    'buzz': 'M41 46C41 32 50 27 60 27C70 27 79 32 79 46C74 37 67 34 60 34C53 34 46 37 41 46Z',
    'bob': FRINGE, 'long': FRINGE,
    'ponytail': 'M40 49C39 32 50 25 61 25C73 25 82 32 80 48C72 38 58 36 40 49Z',
    'bun': 'M40 48C40 32 50 26 60 26C70 26 80 32 80 48C73 39 66 36 60 36C53 36 46 39 40 48Z',
    'curly': 'M40 50C38 33 48 25 61 25C73 25 82 33 80 50C77 41 71 36 64 35C57 39 47 40 40 50Z',
}
HAIR_WORDS = {'short': '짧은 머리', 'side': '옆 가르마 머리', 'buzz': '아주 짧게 깎은 머리', 'bob': '단발머리',
              'long': '긴 머리', 'ponytail': '묶은 머리', 'bun': '올림머리', 'curly': '곱슬머리'}
TOP_WORDS = {'shirt': '셔츠', 'blazer': '재킷', 'turtleneck': '목폴라', 'hoodie': '후드 티', 'cardigan': '카디건'}
PROPS = {
    'flag': ('깃발', '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>'),
    'book': ('펼친 책', '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14"/>'),
    'bubble': ('말풍선', '<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>'),
    'route': ('노선도', '<circle cx="5" cy="18" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="19" cy="15" r="2"/><path d="M6.3 16.3l4.4-7.6M13.6 8.4l4 5"/>'),
    'question': ('물음표', '<path d="M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 1.7V15M12 19h.01"/>'),
    'shelf': ('책꽂이', '<path d="M3 20h18M6 20V7h3v13M10 20V5h3v15M14.5 20l2-12 3 .6-2 11.4"/>'),
    'magnifier': ('돋보기', '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/>'),
    'ruler': ('자', '<path d="M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/>'),
    'quote': ('따옴표 말풍선', '<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M9 8.5v2.5M12 8.5v2.5"/>'),
    'pen': ('펜', '<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>'),
    'layers': ('겹친 블록', '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>'),
    'mic': ('마이크', '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>'),
    'quiz': ('체크 상자', '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>'),
    'palette': ('팔레트', '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 3 0 4-1 3-3 3-5c0-4-4-7-9-7z"/><path d="M8 10h.01M12 7h.01M16 10h.01"/>'),
    'slider': ('슬라이더', '<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2.5" fill="#fffdf8"/><circle cx="15" cy="16" r="2.5" fill="#fffdf8"/>'),
    'motion': ('재생 버튼', '<path d="M9 5v14l11-7zM2 9h3M1 12h4M2 15h3"/>'),
    'access': ('접근성 표시', '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8h14M12 8v6M12 14l-4 6M12 14l4 6"/>'),
    'scale': ('저울', '<path d="M12 4v16M7 20h10M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z"/>'),
    'checkdoc': ('체크한 문서', '<path d="M6 3h9l4 4v14H6zM9 13l2 2 4-4"/>'),
    'chart': ('막대 그래프', '<path d="M5 20v-9M11 20V5M17 20v-8M3 20h18"/>'),
    'pointer': ('마우스 포인터', '<path d="M5 3l13 8-6 1.5L9 19z"/>'),
    'clipboard': ('점검표', '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 11h8M8 15h6"/>'),
}
FIELDS = ('skin', 'hair', 'hair_color', 'top', 'top_color', 'glasses', 'eyes', 'brows', 'mouth', 'prop')


def portrait_errors(name, p):
    """Return problems with one persona's portrait spec (empty when valid)."""
    if not isinstance(p, dict):
        return [f'{name}: portrait missing']
    errors = [f'{name}: portrait.{f} missing' for f in FIELDS if f not in p]
    if errors:
        return errors
    checks = [('skin', p['skin'] in range(len(SKINS))), ('hair', p['hair'] in HAIR_FRONT), ('top', p['top'] in TOP_WORDS),
              ('glasses', p['glasses'] in ('', 'round', 'square')), ('eyes', p['eyes'] in ('dot', 'smile', 'wide')),
              ('brows', p['brows'] in ('flat', 'arched', 'raised')), ('mouth', p['mouth'] in ('smile', 'grin', 'flat', 'smirk')),
              ('prop', p['prop'] in PROPS)]
    return [f'{name}: portrait.{f} is not allowed' for f, ok in checks if not ok]


def describe(name, p):
    parts = [HAIR_WORDS[p['hair']]]
    if p['glasses']:
        parts.append('안경')
    return f"{name}의 가상 인물 그림: {', '.join(parts)}에 {TOP_WORDS[p['top']]}을 입고 {PROPS[p['prop']][0]} 표시와 함께 있는 모습"


def _top(kind, color):
    body = f'<path d="M16 120C18 96 34 84 60 84C86 84 102 96 104 120Z" fill="{color}"/>'
    extra = {
        'shirt': '<path d="M50 84L60 96 54 101 46 87ZM70 84L60 96 66 101 74 87Z" fill="#fdfbf6"/>',
        'blazer': '<path d="M52 84L60 106 68 84Z" fill="#f5f1e8"/><path d="M50 84L60 106 52 110 43 89ZM70 84L60 106 68 110 77 89Z" fill="#000" opacity=".2"/>',
        'turtleneck': '',
        'hoodie': '<path d="M40 93C42 80 50 78 60 80C70 78 78 80 80 93C72 87 48 87 40 93Z" fill="#000" opacity=".18"/><path d="M55 88v10M65 88v10" stroke="#fdfbf6" stroke-width="1.6" stroke-linecap="round"/>',
        'cardigan': '<path d="M53 84h14v36H53z" fill="#f5f1e8"/><circle cx="51" cy="100" r="1.4" fill="#fdfbf6"/><circle cx="51" cy="110" r="1.4" fill="#fdfbf6"/>',
    }[kind]
    return body + extra


def _face(p):
    eyes = {'dot': '<circle cx="52.5" cy="53" r="2.3"/><circle cx="67.5" cy="53" r="2.3"/>',
            'wide': '<circle cx="52.5" cy="53" r="2.7"/><circle cx="67.5" cy="53" r="2.7"/><circle cx="53.4" cy="52.1" r=".8" fill="#fff"/><circle cx="68.4" cy="52.1" r=".8" fill="#fff"/>',
            'smile': '<path d="M49.5 54q3-3.5 6 0M64.5 54q3-3.5 6 0" fill="none" stroke="#2b2420" stroke-width="1.8" stroke-linecap="round"/>'}[p['eyes']]
    brows = {'flat': 'M48.5 46.5h7.5M64 46.5h7.5', 'arched': 'M48.5 47q3.8-3 7.5-.5M64 46.5q3.8-2.5 7.5.5',
             'raised': 'M48.5 46q3.8-1.5 7.5-.8M64 44.6q3.8.2 7.5 1.8'}[p['brows']]
    mouth = {'smile': '<path d="M54 63q6 5 12 0" fill="none" stroke="#2b2420" stroke-width="1.8" stroke-linecap="round"/>',
             'grin': '<path d="M53.5 62.5q6.5 7.5 13 0z" fill="#8c3b32"/>',
             'flat': '<path d="M55.5 64h9" stroke="#2b2420" stroke-width="1.8" stroke-linecap="round"/>',
             'smirk': '<path d="M54.5 64q6 2.5 11-2" fill="none" stroke="#2b2420" stroke-width="1.8" stroke-linecap="round"/>'}[p['mouth']]
    blush = '<circle cx="48.5" cy="60" r="3" fill="#e8806f" opacity=".22"/><circle cx="71.5" cy="60" r="3" fill="#e8806f" opacity=".22"/>'
    return (f'<g fill="#2b2420">{eyes}</g><path d="{brows}" stroke="{p["hair_color"]}" stroke-width="1.9" '
            f'stroke-linecap="round" fill="none"/>{blush}{mouth}')


def _hair(p, front):
    color, kind = p['hair_color'], p['hair']
    if not front:
        return f'<path d="{HAIR_BACK[kind]}" fill="{color}"/>' if kind in HAIR_BACK else ''
    shape = f'<path d="{HAIR_FRONT[kind]}" fill="{color}"/>'
    if kind == 'bun':
        shape += f'<circle cx="60" cy="22" r="9" fill="{color}"/>'
    if kind == 'curly':
        shape += ''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="{color}"/>' for x, y in
                         ((43, 42), (48, 33), (55, 28), (63, 27.5), (71, 31), (77, 39)))
    return shape


def _glasses(kind):
    if not kind:
        return ''
    lens = ('<circle cx="52.5" cy="53" r="5.6"/><circle cx="67.5" cy="53" r="5.6"/>' if kind == 'round' else
            '<rect x="46.5" y="48.5" width="12" height="9" rx="2"/><rect x="61.5" y="48.5" width="12" height="9" rx="2"/>')
    return (f'<g fill="#fff" fill-opacity=".18" stroke="#2b2b2b" stroke-width="1.6">{lens}</g>'
            '<path d="M58 52.5q2-1.6 4 0" stroke="#2b2b2b" stroke-width="1.6" fill="none"/>')


def render_portrait(name, p, cls='portrait', decorative=False):
    """Return one inline SVG portrait (viewBox 120×120) for a persona."""
    skin = SKINS[p['skin']]
    a11y = 'aria-hidden="true" focusable="false"' if decorative else f'role="img" aria-label="{html.escape(describe(name, p))}"'
    prop = PROPS[p['prop']][1]
    return (f'<svg class="{cls}" viewBox="0 0 120 120" {a11y}>'
            '<rect class="pt-bg" width="120" height="120" rx="26"/>'
            '<circle class="pt-glow" cx="60" cy="50" r="40"/>'
            f'{_hair(p, False)}{_top(p["top"], p["top_color"])}'
            f'<path d="M53 66h14v20q-7 5-14 0z" fill="{skin}"/><path d="M53 70q7 6 14 0v-4H53z" fill="#000" opacity=".12"/>'
            + (f'<path d="M50 76h20v10c0 4-20 4-20 0z" fill="{p["top_color"]}"/>' if p['top'] == 'turtleneck' else '')
            + f'<ellipse cx="41.5" cy="53" rx="3.6" ry="5" fill="{skin}"/><ellipse cx="78.5" cy="53" rx="3.6" ry="5" fill="{skin}"/>'
            f'<ellipse cx="60" cy="50" rx="19" ry="22.5" fill="{skin}"/>{_face(p)}{_hair(p, True)}{_glasses(p["glasses"])}'
            '<g class="pt-prop"><circle cx="97" cy="97" r="15"/>'
            f'<g transform="translate(85 85)" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{prop}</g></g></svg>')
