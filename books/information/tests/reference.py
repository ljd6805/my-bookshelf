"""책 코드(js/math.js)와 따로 Python으로 계산한 기준값. 수아(계산 검산가)의 기준 결과이며
tests/reference.json에 쓰고, tests/math.test.cjs가 브라우저 계산과 대조한다.
실행: python3 books/information/tests/reference.py"""
import heapq, json, math, re
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
src = (HERE.parent / 'js/messages.js').read_text()
def grab(name):
    block = re.search(name + r"=\[(.*?)\];", src, re.S).group(1)
    return re.findall(r"'([^']*)'", block)
Y, D = grab('const yunseul'), grab('const doyoon')
J = '\n'.join
allY, train, test = J(Y), J(Y[:50]), J(Y[50:])
dA, dB = J(D[:15]), J(D[15:])
abc = sorted(set(allY + '\n' + J(D)))
V = len(abc)

def H(counter):
    n = sum(counter.values())
    return -sum(c / n * math.log2(c / n) for c in counter.values() if c)

def cond(text, k):
    c = ['\n'] * 2 + list(text); groups = {}
    for i in range(2, len(c)):
        groups.setdefault(''.join(c[i - k:i]), Counter())[c[i]] += 1
    n = len(c) - 2
    return sum(sum(g.values()) / n * H(g) for g in groups.values())

def huffman_len(weights):
    """Average code length of an optimal prefix code (sum of merged weights / total)."""
    h = list(weights); heapq.heapify(h); cost = 0
    while len(h) > 1:
        a, b = heapq.heappop(h), heapq.heappop(h); cost += a + b; heapq.heappush(h, a + b)
    return cost / sum(weights)

def ngram_bits(order, tr, te, alpha):
    pad = ['\n'] * order
    c = pad + list(tr); tab, tot = Counter(), Counter()
    for i in range(order, len(c)):
        ctx = ''.join(c[i - order:i]); tab[ctx, c[i]] += 1; tot[ctx] += 1
    bits, ctx = 0.0, '\n\n'
    for x in te:
        if order < 0:
            p = 1 / V
        else:
            k = ctx[-order:] if order else ''
            p = (tab[k, x] + alpha) / (tot[k] + alpha * V)
        bits -= math.log2(p); ctx = (ctx + x)[-2:]
    return bits / len(te)

def lz78_bits(text):
    d, w, out = {'': 0}, '', []
    for x in text:
        if w + x in d: w += x; continue
        out.append(x); d[w + x] = len(d); w = ''
    if w: out.append('')
    cb = math.ceil(math.log2(V))
    return sum(math.ceil(math.log2(i + 1)) + (cb if ch else 0) for i, ch in enumerate(out)), len(out)

cnt = Counter(allY)
h2 = lambda p: 0 if p in (0, 1) else -p * math.log2(p) - (1 - p) * math.log2(1 - p)
lzb, lzn = lz78_bits(allY)
ref = {
    'V': V, 'n': len(allY), 'distinct': len(cnt), 'messages': len(Y),
    'H0': H(cnt), 'H1': cond(allY, 1), 'H2': cond(allY, 2),
    'utf8_bits_per_char': len(allY.encode('utf-8')) * 8 / len(allY),
    'huffman_L': huffman_len(list(cnt.values())),
    'top6': [[s, c] for s, c in cnt.most_common(6)],
    'huffman_top6_L': huffman_len([c for _, c in cnt.most_common(6)]),
    'lz78_bits': lzb, 'lz78_phrases': lzn,
    'test_bits': {f'{o}:{a}': ngram_bits(o, train, test, a) for o in (-1, 0, 1, 2) for a in (0.01, 0.1, 1)},
    'doyoon_bits': {f'{s}:{o}:{a}': ngram_bits(o, {'yunseul': allY, 'doyoonA': dA}[s], dB, a)
                    for s in ('yunseul', 'doyoonA') for o in (-1, 0, 1) for a in (0.05, 0.2, 1)},
    'capacity': {str(p): 1 - h2(p) for p in (0.01, 0.05, 0.1, 0.11, 0.5)},
}
(HERE / 'reference.json').write_text(json.dumps(ref, ensure_ascii=False, indent=1))
print(json.dumps({k: v for k, v in ref.items() if k not in ('test_bits', 'doyoon_bits')}, ensure_ascii=False))
print(json.dumps(ref['test_bits']), json.dumps(ref['doyoon_bits']))

# ---- 은재 G3 지적 반영: 산술 부호·BPE·해밍·잡음 채널·양자화도 책 코드와 따로 계산한다 ----
from fractions import Fraction

def counts_model(order, tr):
    c = ['\n'] * max(order, 0) + list(tr); tab, tot = Counter(), Counter()
    if order >= 0:
        for i in range(order, len(c)):
            ctx = ''.join(c[i - order:i]); tab[ctx, c[i]] += 1; tot[ctx] += 1
    return tab, tot

def arith_bits(order, tr, msg, alpha):
    """정확한 분수로 구간을 좁히고, 그 안에 드는 가장 짧은 2진 구간의 길이 k를 찾는다."""
    tab, tot = counts_model(order, tr); a = round(alpha * 100)
    lo, width, ctx, ideal = Fraction(0), Fraction(1), '\n\n', 0.0
    for x in msg:
        k = ctx[-order:] if order > 0 else ''
        f = [1 if order < 0 else tab[k, y] * 100 + a for y in abc]; T = sum(f); i = abc.index(x)
        lo += width * Fraction(sum(f[:i]), T); width *= Fraction(f[i], T); ideal -= math.log2(f[i] / T)
        ctx = (ctx + x)[-2:]
    k = 1
    while True:
        m = math.ceil(lo * 2 ** k)
        if Fraction(m + 1, 2 ** k) <= lo + width:
            return k, ideal
        k += 1

def bpe_tokens(text, merges):
    toks = list(text)
    for _ in range(merges):
        pairs, first = Counter(), {}
        for i in range(len(toks) - 1):
            if '\n' in (toks[i], toks[i + 1]): continue
            pairs[toks[i], toks[i + 1]] += 1; first.setdefault((toks[i], toks[i + 1]), i)
        if not pairs: break
        best = min(pairs, key=lambda q: (-pairs[q], first[q]))
        if pairs[best] < 2: break
        out, i = [], 0
        while i < len(toks):
            if i + 1 < len(toks) and (toks[i], toks[i + 1]) == best: out.append(toks[i] + toks[i + 1]); i += 2
            else: out.append(toks[i]); i += 1
        toks = out
    return len(toks)

# 해밍(7,4)를 검사 행렬 H(열 j = j의 2진수)로 따로 계산한다.
Hm = [[(j >> r) & 1 for j in range(1, 8)] for r in range(3)]
def ham_enc(d):
    c = [0, 0, d[0], 0, d[1], d[2], d[3]]
    for r in range(3):
        c[(1 << r) - 1] = sum(Hm[r][j] * c[j] for j in range(7)) % 2
    return c
def ham_dec(y):
    s = sum((sum(Hm[r][j] * y[j] for j in range(7)) % 2) << r for r in range(3)); y = y[:]
    if s: y[s - 1] ^= 1
    return [y[2], y[4], y[5], y[6]]
ham_ok = sum(ham_dec([b ^ (j == i) for j, b in enumerate(ham_enc([(v >> t) & 1 for t in (3, 2, 1, 0)]))]) == [(v >> t) & 1 for t in (3, 2, 1, 0)]
             for v in range(16) for i in range(7))
two = ham_enc([1, 0, 1, 1]); two[2] ^= 1; two[4] ^= 1

def mulberry32(seed):
    a = seed & 0xffffffff
    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xffffffff; t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xffffffff
        t = (t ^ (t + (((t ^ (t >> 7)) * (t | 61)) & 0xffffffff))) & 0xffffffff
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296
    return nxt

def huff_codes(items):
    """무게가 같으면 먼저 만든 마디가 앞(왼쪽 0)이 되게 한 허프만 부호."""
    q = [(w, i, s) for i, (s, w) in enumerate(items)]; nid = len(q); kids = {}
    while len(q) > 1:
        q.sort(key=lambda z: (z[0], z[1])); a, b = q.pop(0), q.pop(0); kids[nid] = (a, b); q.append((a[0] + b[0], nid, None)); nid += 1
    codes = {}
    def walk(n, code):
        if n[2] is not None: codes[n[2]] = code or '0'; return
        walk(kids[n[1]][0], code + '0'); walk(kids[n[1]][1], code + '1')
    walk(q[0], ''); return codes

def channel_errors(bits, p, scheme, seed):
    r = mulberry32(seed); flip = lambda v: v ^ 1 if r() < p else v; data = [int(b) for b in bits]
    if scheme == 'rep3':
        out = [1 if flip(v) + flip(v) + flip(v) >= 2 else 0 for v in data]
    elif scheme == 'hamming':
        pad = data + [0] * (-len(data) % 4); out = []
        for i in range(0, len(pad), 4): out += ham_dec([flip(v) for v in ham_enc(pad[i:i + 4])])
        out = out[:len(data)]
    else:
        out = [flip(v) for v in data]
    return sum(a != b for a, b in zip(out, data))

order_items = sorted(cnt.items(), key=lambda z: (-z[1], z[0]))
codes = huff_codes(order_items)
noise_bits = ''.join(codes[ch] for ch in J(Y[:10]))

def quant_bits(order, b, alpha=0.1):
    tab, tot = counts_model(order, train); top = -math.log2(alpha / (max(tot.values()) + alpha * V)); step = top / (2 ** b - 1)
    bits, ctx = 0.0, '\n\n'
    for x in test:
        k = ctx[-order:] if order else ''
        info = [min(-math.log2((tab[k, y] + alpha) / (tot[k] + alpha * V)), top) for y in abc]
        q = [2 ** -(round(v / step) * step) for v in info]
        bits -= math.log2(q[abc.index(x)] / sum(q)); ctx = (ctx + x)[-2:]
    return bits / len(test), len(tot) * V * b

both = allY + '\n' + dA
ref.update({
    'arith': {f'{o}:{m}': arith_bits(o, train, m, 1)[0] for o in (-1, 0, 1) for m in ('응 지금 가는 중', 'ㅋㅋㅋㅋㅋ')},
    'arith_ideal_bigram': arith_bits(1, train, '응 지금 가는 중', 1)[1],
    'arith_final_k': arith_bits(1, both, dB, 0.01)[0],
    'bpe_tokens': {str(k): bpe_tokens(allY, k) for k in (0, 10, 40, 80)},
    'hamming_single_fixed': ham_ok, 'hamming_35_data': ''.join(map(str, ham_dec(two))),
    'noise_bits': len(noise_bits),
    'noise_errors': {f'{p}:{s}': channel_errors(noise_bits, p, s, 7) for p in (0.05, 0.1) for s in ('none', 'rep3', 'hamming')},
    'quant': {f'{o}:{b}': quant_bits(o, b)[0] for o in (0, 1) for b in (2, 3, 4, 8)},
    'quant_table_bits_bigram_b4': quant_bits(1, 4)[1],
    'huffman_top6_H': H(Counter(dict(cnt.most_common(6)))),
})
(HERE / 'reference.json').write_text(json.dumps(ref, ensure_ascii=False, indent=1))
print(json.dumps({k: ref[k] for k in ('arith', 'arith_final_k', 'bpe_tokens', 'hamming_single_fixed', 'hamming_35_data', 'noise_bits', 'noise_errors', 'quant', 'quant_table_bits_bigram_b4')}, ensure_ascii=False))
