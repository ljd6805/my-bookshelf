"""Render the book-making team from data/agent-team.json (docs/10-agent-team.html).

The JSON file is the single source for the virtual personas. This module checks its
shape and renders two outputs: the shelf section between <!-- TEAM:START/END --> in
index.html and the standalone introduction page team.html.
"""
import html

if __package__:
    from .portrait_renderer import render_portrait, portrait_errors
else:
    from portrait_renderer import render_portrait, portrait_errors

TONES = {'sage': ('120,157,111', '81,115,83'), 'aqua': ('25,143,146', '30,115,123'),
         'amber': ('221,154,63', '166,111,38'), 'violet': ('151,113,184', '110,80,142'),
         'rose': ('209,127,119', '161,90,80'), 'blue': ('75,130,203', '52,93,149'),
         'indigo': ('104,108,180', '70,73,134')}
FIELDS = ('name', 'role', 'background', 'personality', 'speech', 'question', 'owns',
          'strengths', 'blind_spot', 'works_with', 'checklist', 'sample', 'stop')
LIST_FIELDS = {'strengths', 'checklist'}
COUNT_WORDS = {3: '세', 4: '네', 5: '다섯', 6: '여섯', 7: '일곱', 8: '여덟', 9: '아홉'}
e = html.escape


def team_limit(team):
    """Teams stay at 3-4 people (docs/10-agent-team.html#lean); review splits five check items."""
    return 5 if team['id'] == 'review' else 4


def check_team(data):
    """Raise ValueError when a persona is missing a field, names repeat or a team has no lead."""
    people = [data['chief']] + [p for t in data['teams'] for p in t['members']]
    for p in people:
        missing = [f for f in FIELDS if not p.get(f)]
        bad = [f for f in LIST_FIELDS if not isinstance(p.get(f), list)]
        if missing or bad:
            raise ValueError(f"agent-team: {p.get('name', '?')} missing {missing or bad}")
        art = portrait_errors(p['name'], p.get('portrait'))
        if art:
            raise ValueError(f'agent-team: {art[0]}')
    names = [p['name'] for p in people]
    if len(names) != len(set(names)):
        raise ValueError('agent-team: persona names must be unique')
    for t in data['teams']:
        if t['tone'] not in TONES:
            raise ValueError(f"agent-team: {t['id']} has unknown tone {t['tone']}")
        if not t['members'][0]['role'].startswith('팀장'):
            raise ValueError(f"agent-team: {t['id']} must list its lead (팀장) first")
        if not 3 <= len(t['members']) <= team_limit(t):
            raise ValueError(f"agent-team: {t['id']} must have 3 to {team_limit(t)} people including the lead")
    return len(people)


def _style(tone):
    face, edge = TONES[tone]
    return f'--t:{face};--e:{edge}'


def _items(values):
    return ''.join(f'<li>{e(v)}</li>' for v in values)


def _details(p):
    rows = [('배경', e(p['background'])), ('말투', e(p['speech'])),
            ('강점', f'<ul>{_items(p["strengths"])}</ul>'), ('조심할 점', e(p['blind_spot'])),
            ('함께 일하는 방식', e(p['works_with'])), ('점검 목록', f'<ul class="checks">{_items(p["checklist"])}</ul>'),
            ('이런 말을 해요', f'<q>{e(p["sample"])}</q>'), ('일을 멈추는 때', e(p['stop']))]
    body = ''.join(f'<dt>{k}</dt><dd>{v}</dd>' for k, v in rows)
    return f'<details class="persona-more"><summary>페르소나 자세히 보기</summary><dl>{body}</dl></details>'


def _card(p, tone, tag='li'):
    cls = 'person lead' if p['role'].startswith(('팀장', '편집장')) else 'person'
    return (f'<{tag} class="{cls}" style="{_style(tone)}" id="p-{e(p["name"])}"><div class="person-head">'
            f'{render_portrait(p["name"], p["portrait"])}<div><h4>{e(p["name"])}</h4>'
            f'<p class="role">{e(p["role"])}</p></div></div><p class="temper">{e(p["personality"])}</p>'
            f'<blockquote>“{e(p["question"])}”</blockquote><p class="does">{e(p["owns"])}</p>{_details(p)}</{tag}>')


def _team_block(i, t):
    people = ''.join(_card(p, t['tone']) for p in t['members'])
    return (f'<section class="team-block" id="{t["id"]}" style="{_style(t["tone"])}" aria-labelledby="{t["id"]}-title">'
            f'<div class="team-intro"><p class="team-no">0{i + 1} · {e(t["step"])}</p><h3 id="{t["id"]}-title">{e(t["name"])}</h3>'
            f'<p>{e(t["summary"])}</p><p class="count">모두 {len(t["members"])}명</p></div><ul class="people">{people}</ul></section>')


def _lineup(data):
    people = [('amber', data['chief'])] + [(t['tone'], p) for t in data['teams'] for p in t['members']]
    faces = ''.join(f'<a href="#p-{e(p["name"])}" style="{_style(tone)}" title="{e(p["name"])} · {e(p["role"])}">'
                    f'{render_portrait(p["name"], p["portrait"], "portrait mini", True)}<span>{e(p["name"])}</span></a>'
                    for tone, p in people)
    return f'<div class="lineup" role="group" aria-label="인물 {len(people)}명 바로 가기">{faces}</div>'


def _flow(teams):
    steps = ''.join(f'<li style="{_style(t["tone"])};--i:{i}"><a href="#{t["id"]}"><span class="dot" aria-hidden="true"></span>'
                    f'<b>{e(t["name"])}</b><small>{e(t["step"])}</small></a></li>' for i, t in enumerate(teams))
    shelf = (f'<li class="shelf-stop" style="--i:{len(teams)}"><a href="index.html#books"><span class="dot" aria-hidden="true"></span>'
             '<b>서가</b><small>독자에게 펼쳐짐</small></a></li>')
    return (f'<ol class="team-flow" aria-label="책이 만들어지는 순서">{steps}{shelf}</ol>'
            '<p class="flow-note">점이 차례로 빛나는 것은 책 한 권이 팀을 지나가는 순서입니다. '
            '검수팀이 찾은 오류는 그 내용을 맡은 팀으로 되돌아가 고친 뒤 다시 확인합니다.</p>')


def render_team_page(data, version):
    count = check_team(data)
    n = COUNT_WORDS[len(data['teams'])]
    chief = _card(data['chief'], 'amber', 'div').replace('class="person lead"', 'class="person lead chief"', 1)
    blocks = ''.join(_team_block(i, t) for i, t in enumerate(data['teams']))
    head = ('<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta name="description" content="이 서재의 책을 함께 만드는 {n} 가상 팀과 {count}명의 인물을 소개합니다.">'
            '<title>책을 만드는 팀 · Jdeok.Lee의 서재</title>'
            f'<link rel="stylesheet" href="assets/type.css?v={version}"><link rel="stylesheet" href="assets/home.css?v={version}">'
            f'<link rel="stylesheet" href="assets/team.css?v={version}"></head>\n')
    return head + f'''<body class="team-page"><a class="skip-link" href="#main">본문으로 이동</a><div class="room-light" aria-hidden="true"></div>
<!-- 이 파일은 python3 scripts/build_catalog.py가 data/agent-team.json에서 만듭니다. 직접 고치지 마세요. -->
<header class="site-header wrap"><a class="brand" href="./index.html" aria-label="Jdeok.Lee의 서재 홈">Jdeok.Lee의 서재<span>MY BOOKSHELF</span></a><nav aria-label="주요 메뉴"><a href="index.html#books">← 서가로</a><a href="#flow">만드는 순서</a><a href="#teams">팀 소개</a></nav></header>
<main id="main" class="wrap">
<section class="team-hero" aria-labelledby="team-title"><p class="eyebrow">THE MAKERS</p><h1 id="team-title">이 서재의 책은<br>{n} 팀이 함께 만듭니다.</h1><p>책 한 권에는 지켜야 할 약속이 많습니다. 독자가 끝에 무엇을 할 수 있어야 하는지, 장과 장이 어떻게 이어지는지, 숫자가 정말 맞는지. 그래서 이 일을 {n} 팀과 {count}명의 인물에게 나누어 맡겼습니다.</p><p>이들은 실제 사람이 아니라 책을 쓰는 AI 에이전트가 번갈아 맡는 <strong>가상의 역할</strong>입니다. 인물마다 지어낸 이력과 성격, 말투, 강점과 약점이 있고, 늘 던지는 질문에 답하지 못하면 다음 팀으로 넘기지 않습니다. 단 하나, 검수팀만은 책을 쓰지 않은 다른 에이전트가 맡습니다. 카드의 <strong>페르소나 자세히 보기</strong>를 열면 그 인물이 일할 때 쓰는 점검 목록과 자주 하는 말까지 볼 수 있습니다. 얼굴 그림은 성격과 하는 일을 떠올리게 하려고 그린 가상의 일러스트이며, 오른쪽 아래 표시는 그 인물이 맡은 일을 나타냅니다.</p>{_lineup(data)}</section>
<section class="team-flow-wrap" id="flow" aria-labelledby="flow-title"><h2 id="flow-title">책 한 권이 지나가는 길</h2>{_flow(data['teams'])}</section>
<section class="chief-wrap" aria-labelledby="chief-title"><h2 id="chief-title">{n} 팀을 이끄는 사람</h2>{chief}</section>
<section id="teams" aria-labelledby="teams-title"><h2 id="teams-title" class="sr-only">팀 소개</h2>{blocks}</section>
<section class="team-rules" aria-labelledby="rules-title"><h2 id="rules-title">팀 사이의 약속</h2><ul><li>팀 사이에는 관문이 있습니다. 넘겨야 할 결과물이 파일로 남아 있어야 다음 팀이 일을 시작합니다.</li><li>팀은 팀장을 포함해 서너 명으로 작게 둡니다. 산출물마다 주인은 한 사람이고, 관문에서는 팀장끼리 인계 메모 하나로 넘깁니다.</li><li>모든 일에 모든 팀이 다 나서지는 않습니다. 오탈자를 고칠 때는 그 글을 맡은 팀과 규칙 감사관만 움직입니다.</li><li>인물은 판단을 돕는 관점입니다. 책의 주제처럼 서재 주인이 정할 일은 여전히 주인에게 묻습니다.</li></ul><p><a class="text-link" href="docs/10-agent-team.html">팀별 책임과 인계 관문 전체 보기 ↗</a></p></section>
</main>
<footer class="site-footer wrap"><div class="footer-brand">Jdeok.Lee의 서재<p>읽고, 실험하고, 이해를 쌓는 곳.</p></div><nav aria-label="서재 운영 정보"><a href="index.html#books">서가로 돌아가기</a><a href="docs/10-agent-team.html">책 제작 에이전트 팀 규칙</a><a href="docs/08-book-template.html">책 구성 표준</a></nav></footer>
</body></html>
'''


def render_team_section(data):
    count = check_team(data)
    n = COUNT_WORDS[len(data['teams'])]
    items = ''.join(f'<li style="{_style(t["tone"])}"><a href="team.html#{t["id"]}">{render_portrait(t["members"][0]["name"], t["members"][0]["portrait"], "portrait mini", True)}'
                    f'<span class="team-name">{e(t["name"])}</span><span class="team-lead">팀장 {e(t["members"][0]["name"])} · 모두 {len(t["members"])}명</span>'
                    f'<span class="team-q">{e(t["step"])}</span></a></li>' for t in data['teams'])
    return ('<section class="team-section wrap" id="team" aria-labelledby="team-section-title"><div><h2 id="team-section-title">이 책들은<br>누가 만들까요?</h2>'
            f'<p>책 한 권은 {n} 팀을 차례로 지나며 만들어집니다.<br>주제를 고르고 잇는 팀, 큰 줄기와 목차를 세우는 팀, 사실을 찾는 팀, 배우는 방법을 설계하는 팀, 글을 쓰는 팀, 그림과 실험을 만드는 팀, 그리고 따로 확인하는 팀입니다.</p>'
            f'<a class="text-link" href="team.html">팀과 인물 {count}명 만나 보기 ↗</a></div>'
            f'<ol class="team-list" aria-label="책을 만드는 {n} 팀">{items}</ol></section>')
