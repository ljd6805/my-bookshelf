"""tori.pkl을 책이 읽는 파일로 바꾼다: js/weights.js, js/checkpoints.js, tests/reference.json.
가중치는 소수 넷째 자리로 반올림하고, 기준값은 반올림한 가중치로 numpy에서 다시 계산한다(브라우저 계산과 같은 값)."""
import json, math, os, pickle
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); BOOK = os.path.dirname(HERE)
d = pickle.load(open(os.path.join(HERE, 'tori.pkl'), 'rb')); p = d['p']
R = lambda a, n=4: np.round(np.asarray(a, dtype=np.float64), n)
W = {'E': R(p['E']), 'P': R(p['P']), 'U': R(p['U']), 'bU': R(p['bU']), 'gf': R(p['gf']), 'bf': R(p['bf']), 'layers': []}
for q in p['layers']:
    W['layers'].append({k: R(q[k]) for k in ['g1', 'b1', 'g2', 'b2', 'Q', 'K', 'Vw', 'O', 'W1', 'c1', 'W2', 'c2']})
import train_tori as tt
def ln(x, g, b):
    m = x.mean(-1, keepdims=True); v = ((x - m) ** 2).mean(-1, keepdims=True); return (x - m) / np.sqrt(v + 1e-5) * g + b
def fwd(toks):
    x = W['E'][toks] + W['P'][:len(toks)]; t = len(toks); attn = []
    for q in W['layers']:
        h = ln(x, q['g1'], q['b1']); Q = np.einsum('td,hde->hte', h, q['Q']); K = np.einsum('td,hde->hte', h, q['K']); V = np.einsum('td,hde->hte', h, q['Vw'])
        s = np.einsum('hte,hse->hts', Q, K) / math.sqrt(8); s = np.where(np.tril(np.ones((t, t), bool)), s, -np.inf)
        a = np.exp(s - s.max(-1, keepdims=True)); a /= a.sum(-1, keepdims=True); attn.append(a)
        x = x + np.einsum('hts,hse,hed->td', a, V, q['O'])
        x = x + np.maximum(ln(x, q['g2'], q['b2']) @ q['W1'] + q['c1'], 0) @ q['W2'] + q['c2']
    return ln(x, W['gf'], W['bf']) @ W['U'] + W['bU'], attn
TI = tt.TI
prompts = ['<s> 곰 먹이', '<s> 토끼 집', '<s> 3 4 5', '<s> 목록 곰 꿀 숲 토끼 포도 곰 꿀', '<s> 고양이 먹이 생선 . 펭귄 집']
ref = []
for s in prompts:
    ids = [TI[w] for w in s.split()]; lg, at = fwd(ids)
    ref.append({'prompt': s, 'last_logits': R(lg[-1], 6).tolist(), 'argmax': tt.VOCAB[int(lg[-1].argmax())], 'attn_l0h2_last': R(at[0][2][-1], 6).tolist(), 'attn_l1h1_last': R(at[1][1][-1], 6).tolist()})
    print(s, '->', tt.VOCAB[int(lg[-1].argmax())])
json.dump({'note': '반올림한 가중치로 numpy에서 계산한 기준값. tools/export_tori.py가 만든다.', 'cases': ref}, open(os.path.join(BOOK, 'tests', 'reference.json'), 'w'), ensure_ascii=False, indent=0)
def tolist(o):
    if isinstance(o, dict): return {k: tolist(v) for k, v in o.items()}
    if isinstance(o, list): return [tolist(v) for v in o]
    return o.tolist()
js = '/* 토리의 학습된 가중치. tools/train_tori.py로 학습하고 tools/export_tori.py로 소수 넷째 자리까지 반올림해 만든 파일이다. 손으로 고치지 않는다.\n   모양: E[V][D] 토큰 임베딩, P[T][D] 위치 임베딩, layers[l]: Q·K·Vw[H][D][dh], O[H][dh][D], W1[D][F], W2[F][D], U[D][V] 출력 행렬. */\n'
js += '(typeof window!=="undefined"?window:globalThis).TWeights=' + json.dumps({'vocab': tt.VOCAB, 'dims': {'V': tt.V, 'T': tt.T, 'D': tt.D, 'H': tt.H, 'dh': tt.DH, 'F': tt.F, 'L': tt.L}, **tolist(W)}, separators=(',', ':')) + ';\n'
open(os.path.join(BOOK, 'js', 'weights.js'), 'w').write(js)
tl = [{'step': m['step'], 'list_first': round(m['list_first'], 3), 'list_second': round(m['list_second'], 3), 'fact_acc': round(m['fact_acc'], 3), 'count_acc': round(m['count_acc'], 3),
       'prev': m['prev'], 'induction': m['induction'], 'map_prev': R(m['maps'][0][2], 2).tolist(), 'map_ind': R(m['maps'][1][1], 2).tolist()} for m in d['timeline']]
js = '/* 학습 중 체크포인트 21개의 지표. tools/train_tori.py가 고정 탐침 문제(목록 200개, 사실 200개, 세기 200개)로 잰 실제 값이다.\n   list_first/second: 목록 첫 번째·반복 구간의 평균 손실(nat), fact_acc·count_acc: 정답 토큰이 1위인 비율, prev·induction: 층×헤드 점수,\n   map_prev·map_ind: 탐침 문장에서 0층 2번 헤드와 1층 1번 헤드의 어텐션 표(소수 둘째 자리). */\n'
js += '(typeof window!=="undefined"?window:globalThis).TCheckpoints=' + json.dumps({'probe': [tt.VOCAB[i] for i in d['probe']], 'steps': tl}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(BOOK, 'js', 'checkpoints.js'), 'w').write(js)
