"""토리(Tori) 학습 스크립트. 책의 공통 사례인 2층 트랜스포머를 장난감 말뭉치로 학습시키고
가중치(js/weights.js), 학습 중 체크포인트 지표(js/checkpoints.js), 검산용 기준값(tests/reference.json)을 만든다.
필요: python3, numpy, jax, optax (CI에는 필요 없다. 결과 파일만 저장소에 둔다).
실행: python3 books/transformer/tools/train_tori.py
"""
import json, math, os, sys
import numpy as np
import jax, jax.numpy as jnp, optax

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = ['<s>', '.', '목록', '먹이', '집',
         '고양이', '강아지', '토끼', '곰', '펭귄', '여우',
         '생선', '뼈다귀', '당근', '꿀', '새우', '포도',
         '골목', '마당', '풀밭', '동굴', '빙하', '숲',
         '1', '2', '3', '4', '5', '6', '7', '8', '9']
TI = {t: i for i, t in enumerate(VOCAB)}
ANIMALS = list(range(5, 11)); FOODS = list(range(11, 17)); HOMES = list(range(17, 23)); DIGITS = list(range(23, 32))
CONTENT = ANIMALS + FOODS + HOMES
V, T, D, H, DH, F, L = len(VOCAB), 24, 32, 4, 8, 128, 2
SEED = 7

def fact_seq(rng):
    s = [0]
    while len(s) < T:
        a = int(rng.integers(6)); rel = int(rng.integers(2))
        s += [ANIMALS[a], 3 + rel, (FOODS if rel == 0 else HOMES)[a], 1]
    return s[:T]

def count_seq(rng):
    s = [0]
    while len(s) < T:
        k = int(rng.integers(1, 7))
        s += [DIGITS[j] for j in range(k - 1, 9)] + [1]
    return s[:T]

def list_seq(rng):
    n = int(rng.integers(5, 11))
    items = list(rng.choice(CONTENT, size=n, replace=False))
    s = [0, 2]
    while len(s) < T:
        s += items
    return [int(x) for x in s[:T]]

def batch(rng, n):
    out = []
    for _ in range(n):
        r = rng.random()
        out.append(fact_seq(rng) if r < .4 else count_seq(rng) if r < .6 else list_seq(rng))
    return np.array(out, dtype=np.int32)

def init(key):
    ks = jax.random.split(key, 20); n = lambda k, s, sc: jax.random.normal(k, s) * sc
    p = {'E': n(ks[0], (V, D), .3), 'P': n(ks[1], (T, D), .1), 'U': n(ks[2], (D, V), 1 / math.sqrt(D)), 'bU': jnp.zeros(V),
         'gf': jnp.ones(D), 'bf': jnp.zeros(D), 'layers': []}
    for l in range(L):
        k = jax.random.split(ks[3 + l], 8)
        p['layers'].append({'g1': jnp.ones(D), 'b1': jnp.zeros(D), 'g2': jnp.ones(D), 'b2': jnp.zeros(D),
            'Q': n(k[0], (H, D, DH), 1 / math.sqrt(D)), 'K': n(k[1], (H, D, DH), 1 / math.sqrt(D)),
            'Vw': n(k[2], (H, D, DH), 1 / math.sqrt(D)), 'O': n(k[3], (H, DH, D), 1 / math.sqrt(D * 2)),
            'W1': n(k[4], (D, F), 1 / math.sqrt(D)), 'c1': jnp.zeros(F), 'W2': n(k[5], (F, D), 1 / math.sqrt(F * 2)), 'c2': jnp.zeros(D)})
    return p

def ln(x, g, b):
    m = x.mean(-1, keepdims=True); v = ((x - m) ** 2).mean(-1, keepdims=True)
    return (x - m) / jnp.sqrt(v + 1e-5) * g + b

MASK = jnp.tril(jnp.ones((T, T), bool))

def forward(p, toks, keep=None):
    """keep: 선택. {('head',l,h):0/1, ('mlp',l):0/1} 절제용 곱셈 계수."""
    x = p['E'][toks] + p['P'][: toks.shape[-1]]
    t = toks.shape[-1]; mask = MASK[:t, :t]
    for l, q in enumerate(p['layers']):
        h = ln(x, q['g1'], q['b1'])
        Q = jnp.einsum('...td,hde->...hte', h, q['Q']); K = jnp.einsum('...td,hde->...hte', h, q['K']); Vv = jnp.einsum('...td,hde->...hte', h, q['Vw'])
        s = jnp.einsum('...hte,...hse->...hts', Q, K) / math.sqrt(DH)
        s = jnp.where(mask, s, -1e9); a = jax.nn.softmax(s, -1)
        z = jnp.einsum('...hts,...hse->...hte', a, Vv)
        out = jnp.einsum('...hte,hed->...htd', z, q['O'])
        if keep is not None: out = out * jnp.array([keep.get(('head', l, i), 1.) for i in range(H)])[:, None, None]
        x = x + out.sum(-3)
        m = jax.nn.relu(ln(x, q['g2'], q['b2']) @ q['W1'] + q['c1']) @ q['W2'] + q['c2']
        if keep is not None: m = m * keep.get(('mlp', l), 1.)
        x = x + m
    return ln(x, p['gf'], p['bf']) @ p['U'] + p['bU']

def loss_fn(p, toks):
    lg = forward(p, toks[:, :-1]); y = toks[:, 1:]
    return -jnp.take_along_axis(jax.nn.log_softmax(lg), y[..., None], -1).mean()

# 고정 탐침 집합: 체크포인트마다 같은 문제로 잰다.
PR = np.random.default_rng(1234)
PROBE_LIST = np.array([list_seq(PR) for _ in range(200)], dtype=np.int32)
PROBE_FACT = np.array([fact_seq(PR) for _ in range(200)], dtype=np.int32)
PROBE_COUNT = np.array([count_seq(PR) for _ in range(200)], dtype=np.int32)

def metrics(p):
    def nll(toks):
        lg = forward(p, jnp.array(toks[:, :-1])); y = toks[:, 1:]
        return -np.take_along_axis(np.array(jax.nn.log_softmax(lg)), y[..., None], -1)[..., 0], np.array(lg.argmax(-1)) == y
    n, ok = nll(PROBE_LIST)
    first = []; second = []
    for b, s in enumerate(PROBE_LIST):
        nitems = list(s[2:]).index(s[2], 1) if s[2] in s[3:] else 22
        for t in range(T - 1):
            pos = t + 1  # 예측 대상 위치
            if 3 <= pos < 2 + nitems: first.append(n[b, t])
            elif pos >= 2 + nitems: second.append(n[b, t])
    fn, fok = nll(PROBE_FACT)
    fact = [fok[b, t] for b, s in enumerate(PROBE_FACT) for t in range(T - 1) if s[t] in (3, 4)]
    cn, cok = nll(PROBE_COUNT)
    cnt = [cok[b, t] for b, s in enumerate(PROBE_COUNT) for t in range(T - 1) if s[t] in DIGITS and s[t] != DIGITS[-1] and s[t + 1] != 1]
    return {'list_first': float(np.mean(first)), 'list_second': float(np.mean(second)), 'fact_acc': float(np.mean(fact)), 'count_acc': float(np.mean(cnt))}

def attn_maps(p, toks):
    x = p['E'][toks] + p['P'][: len(toks)]; t = len(toks); res = []
    for q in p['layers']:
        h = ln(x, q['g1'], q['b1'])
        Q = jnp.einsum('td,hde->hte', h, q['Q']); K = jnp.einsum('td,hde->hte', h, q['K']); Vv = jnp.einsum('td,hde->hte', h, q['Vw'])
        s = jnp.where(MASK[:t, :t], jnp.einsum('hte,hse->hts', Q, K) / math.sqrt(DH), -1e9); a = jax.nn.softmax(s, -1); res.append(np.array(a))
        x = x + jnp.einsum('hts,hse,hed->td', a, Vv, q['O'])
        x = x + jax.nn.relu(ln(x, q['g2'], q['b2']) @ q['W1'] + q['c1']) @ q['W2'] + q['c2']
    return res

def head_scores(p):
    prev = np.zeros((L, H)); ind = np.zeros((L, H)); cnt = 0
    for s in PROBE_LIST[:100]:
        maps = attn_maps(p, jnp.array(s)); items = s[2:]
        n = list(items).index(items[0], 1) if items[0] in items[1:] else None
        if n is None: continue
        cnt += 1
        for l in range(L):
            a = maps[l]
            prev[l] += np.mean([a[:, t, t - 1] for t in range(2, T)], 0)
            ind[l] += np.mean([a[:, t, t - n + 1] for t in range(2 + n, T)], 0)
    return (prev / cnt).round(3).tolist(), (ind / cnt).round(3).tolist()

def main():
    rng = np.random.default_rng(SEED); p = init(jax.random.PRNGKey(SEED))
    steps = int(os.environ.get('STEPS', 6000))
    sched = optax.warmup_cosine_decay_schedule(0., 3e-3, 200, steps, 3e-4)
    opt = optax.chain(optax.clip_by_global_norm(1.), optax.adamw(sched, weight_decay=0.01)); st = opt.init(p)
    @jax.jit
    def step(p, st, toks):
        l, g = jax.value_and_grad(loss_fn)(p, toks); u, st = opt.update(g, st, p); return optax.apply_updates(p, u), st, l
    marks = sorted(set([0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, steps]))
    timeline = []; probe = PROBE_LIST[3]
    for i in range(steps + 1):
        if i in marks:
            m = metrics(p); pr, ind = head_scores(p); maps = attn_maps(p, jnp.array(probe))
            m.update({'step': i, 'prev': pr, 'induction': ind, 'maps': [np.round(a, 3).tolist() for a in maps]})
            timeline.append(m); print(i, {k: (round(v, 3) if isinstance(v, float) else '') for k, v in m.items() if not isinstance(v, list)}, 'prev', pr, 'ind', ind, flush=True)
        if i < steps:
            p, st, l = step(p, st, jnp.array(batch(rng, 128)))
    return p, timeline, probe

if __name__ == '__main__':
    p, timeline, probe = main()
    import pickle
    pickle.dump({'p': jax.tree_util.tree_map(np.array, p), 'timeline': timeline, 'probe': probe.tolist()}, open(os.path.join(os.path.dirname(__file__), 'tori.pkl'), 'wb'))
