/* 1~5장 실험 화면. 계산은 CompModel에 맡기고 여기서는 입력·표시만 다룬다. */
(function () {
  'use strict';
  const M = window.CompModel;
  const Labs = (window.CompLabs = window.CompLabs || {});
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Labs.reduceMotion = reduceMotion;
  Labs.esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  Labs.bits = function (root) {
    let bits = new Array(8).fill(0), timer = null;
    root.innerHTML = `
      <div class="bit-row" role="group" aria-label="8개의 스위치. 왼쪽이 128 자리, 오른쪽이 1 자리"></div>
      <div class="controls">
        <button data-act="plus">+1 하기</button>
        <button data-act="count" aria-pressed="false">자동으로 세기</button>
        <button data-act="max">모두 켜기</button>
        <button data-act="reset">실험 초기화</button>
      </div>
      <div class="readout" aria-live="polite"></div>`;
    const row = root.querySelector('.bit-row'), out = root.querySelector('.readout');
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    row.innerHTML = weights.map((w, i) => `<button class="bit" data-i="${i}" aria-pressed="false" aria-label="${w} 자리 스위치"><b>0</b><small>${w}</small></button>`).join('');
    const show = () => {
      const value = M.bitsToNumber(bits);
      row.querySelectorAll('.bit').forEach((b, i) => { b.setAttribute('aria-pressed', String(!!bits[i])); b.querySelector('b').textContent = bits[i]; });
      const parts = weights.filter((_, i) => bits[i]);
      out.innerHTML = `<div class="result-line">이진수 <span class="mono">${bits.join('')}</span> = 십진수 ${value}</div>
        <div>${parts.length ? `켜진 자리의 값을 더하면 ${parts.join(' + ')} = ${value}입니다.` : '모든 스위치가 꺼져 있어 0입니다.'}</div>
        <div class="legend">16진수로는 ${M.hex(value)}입니다. 8개 스위치로 만들 수 있는 가장 큰 수는 255이고, 가능한 상태는 0을 포함해 256가지입니다.</div>`;
    };
    const set = (v) => { bits = M.numberToBits(v, 8); show(); };
    const stop = () => { clearInterval(timer); timer = null; root.querySelector('[data-act="count"]').setAttribute('aria-pressed', 'false'); };
    row.addEventListener('click', (e) => { const b = e.target.closest('.bit'); if (!b) return; bits[b.dataset.i] ^= 1; show(); });
    root.querySelector('.controls').addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'plus') set((M.bitsToNumber(bits) + 1) % 256);
      if (act === 'max') { stop(); set(255); }
      if (act === 'reset') { stop(); set(0); }
      if (act === 'count') {
        if (timer) return stop();
        e.target.setAttribute('aria-pressed', 'true');
        timer = setInterval(() => set((M.bitsToNumber(bits) + 1) % 256), reduceMotion() ? 900 : 350);
      }
    });
    show();
    return stop;
  };

  Labs.encoding = function (root) {
    root.innerHTML = `
      <div class="controls">
        <label>바이트 값 <input type="range" min="0" max="255" value="65" data-k="range" aria-label="바이트 값 슬라이더"></label>
        <label>숫자 입력 <input type="number" min="0" max="255" value="65" data-k="num"></label>
      </div>
      <div class="controls"><button data-v="65">A</button><button data-v="200">200</button><button data-v="255">255</button><button data-v="10">10 (줄바꿈)</button></div>
      <div class="readout grid-2" aria-live="polite"></div>
      <h4>글자를 바이트로 바꾸기 (UTF-8)</h4>
      <div class="controls"><label>글자 <input type="text" value="3+4=가" data-k="text" maxlength="24"></label><button data-act="reset">실험 초기화</button></div>
      <div class="readout" data-k="bytes" aria-live="polite"></div>`;
    const range = root.querySelector('[data-k="range"]'), num = root.querySelector('[data-k="num"]'), text = root.querySelector('[data-k="text"]');
    const out = root.querySelector('.readout.grid-2'), bytesOut = root.querySelector('[data-k="bytes"]');
    const showByte = (v) => {
      if (!Number.isInteger(v) || v < 0 || v > 255) {
        out.classList.add('error');
        out.innerHTML = '<div>0부터 255 사이의 정수를 넣어 주세요. 한 바이트는 그 밖의 값을 담지 못합니다.</div>';
        return;
      }
      out.classList.remove('error');
      range.value = v; num.value = v;
      const ch = M.toAsciiLabel(v), signed = M.toSigned(v);
      out.innerHTML = `
        <div class="kv"><span>비트</span><b class="mono">${M.numberToBits(v, 8).join('')}</b></div>
        <div class="kv"><span>부호 없는 정수</span><b>${v}</b></div>
        <div class="kv"><span>부호 있는 정수(2의 보수)</span><b>${signed}</b></div>
        <div class="kv"><span>ASCII 글자</span><b>${ch === null ? '화면에 그릴 글자 없음' : `“${ch}”`}</b></div>
        <div class="kv"><span>회색 밝기</span><b><span class="swatch" style="background:rgb(${v},${v},${v})"></span> ${Math.round(v / 2.55)}%</b></div>
        <div class="result-line">${signed < 0 ? `맨 앞 비트가 1이므로 부호 있는 정수로 읽으면 ${v} − 256 = ${signed}입니다.` : '맨 앞 비트가 0이어서 두 정수 해석이 같습니다.'}</div>`;
    };
    const showText = () => {
      const bytes = M.utf8Bytes(text.value);
      const perChar = Array.from(text.value).map((c) => `<span class="chip">${c === ' ' ? '공백' : Labs.esc(c)} → ${M.utf8Bytes(c).map(M.hex).join(' ')}</span>`).join('');
      bytesOut.innerHTML = `<div class="chips">${perChar || '<span class="legend">글자를 입력해 보세요.</span>'}</div>
        <div class="result-line">${Array.from(text.value).length}글자 → ${bytes.length}바이트</div>
        <div class="legend">숫자와 영문은 1바이트, 한글 완성형 한 글자는 3바이트입니다.</div>`;
    };
    range.addEventListener('input', () => showByte(Number(range.value)));
    num.addEventListener('input', () => showByte(Number(num.value)));
    text.addEventListener('input', showText);
    root.addEventListener('click', (e) => {
      if (e.target.dataset.v) showByte(Number(e.target.dataset.v));
      if (e.target.dataset.act === 'reset') { text.value = '3+4=가'; showByte(65); showText(); }
    });
    showByte(65); showText();
  };

  /* 2장 보충: FP16 스위치 16개와 같은 값의 BF16 반올림. 계산은 CompModel의 부동소수점 함수가 한다. */
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow2 = (k) => `2${String(k).split('').map((c) => SUP[c]).join('')}`;
  const num = (v) => {
    if (Number.isNaN(v)) return 'NaN';
    if (!Number.isFinite(v)) return v > 0 ? '+∞' : '−∞';
    const a = Math.abs(v);
    return (a !== 0 && (a < 1e-3 || a >= 1e7) ? v.toExponential(4) : String(v)).replace('-', '−');
  };
  const KIND = { zero: '0', subnormal: '비정규수(지수 칸 0)', normal: '정규수', inf: '무한대(지수 칸 모두 1, 가수 0)', nan: 'NaN(지수 칸 모두 1, 가수 0 아님)' };
  /* 두 형식의 실제 간격을 비교해 문장을 고른다. 0 근처에서는 지수 칸이 넓은 BF16의 간격이 더 좁다. */
  function spacing(fp, bf) {
    if (!fp || !bf || fp.gap === null || bf.gap === null) return '';
    if (bf.gap > fp.gap) return '다만 가수가 7비트라 이웃한 수 사이의 간격이 FP16보다 넓습니다.';
    if (bf.gap < fp.gap) return '이 근처에서는 BF16의 지수 범위가 훨씬 넓어 이웃한 수 사이의 간격이 FP16보다 오히려 좁습니다.';
    return '이웃한 수 사이의 간격도 같습니다.';
  }

  function floatSummary(bits, fmt) {
    const d = M.decodeFloat(bits, fmt), n = M.floatNeighbor(bits, fmt), f = M.floatFields(bits, fmt);
    const gap = !n ? '없음' : n.gap === null ? '더 큰 유한한 수 없음' : `${pow2(Math.log2(n.gap))} ≈ ${num(n.gap)}`;
    return { d, n, gap, fields: f.join(' | ') };
  }

  Labs.float = function (root) {
    const labels = ['부호', ...[16, 8, 4, 2, 1].map((w) => `지수 ${w}`), ...Array.from({ length: 10 }, (_, i) => `가수 ${pow2(-(i + 1))}`)];
    const short = ['±', '16', '8', '4', '2', '1', ...Array.from({ length: 10 }, (_, i) => pow2(-(i + 1)))];
    const group = (from, to, name) => `<div class="float-field"><span class="caption">${name}</span><div class="float-row">${labels.slice(from, to).map((l, k) => `<button class="bit" data-i="${from + k}" aria-pressed="false" aria-label="${l} 스위치"><b>0</b><small>${short[from + k]}</small></button>`).join('')}</div></div>`;
    root.innerHTML = `
      <div class="float-bits" role="group" aria-label="FP16의 16개 스위치. 부호 1개, 지수 5개, 가수 10개">${group(0, 1, '부호 1비트')}${group(1, 6, '지수 5비트 (기준값 15)')}${group(6, 16, '가수 10비트')}</div>
      <div class="controls"><label>십진수 입력 <input type="text" inputmode="decimal" value="1" data-k="num" aria-describedby="float-hint"></label><span class="legend" id="float-hint">입력한 수에 가장 가까운 FP16 값으로 스위치를 맞춥니다.</span></div>
      <div class="controls" role="group" aria-label="비교 예제"><button data-v="1">1</button><button data-v="0.1">0.1</button><button data-v="2048">2048</button><button data-v="65504">65504 (최댓값)</button><button data-act="reset">실험 초기화</button></div>
      <div class="readout grid-2" role="status" aria-live="polite"></div>
      <p class="legend">비교: 이 브라우저가 64비트 형식(binary64)으로 직접 계산한 0.1 + 0.2 = <span class="mono">${num(0.1 + 0.2)}</span></p>`;
    const row = root.querySelector('.float-bits'), out = root.querySelector('.readout'), input = root.querySelector('[data-k="num"]');
    let bits = M.numberToBits(M.encodeFloat(1, M.FP16), 16);
    const show = (note) => {
      const value = M.bitsToNumber(bits), h = floatSummary(value, M.FP16), d = h.d;
      row.querySelectorAll('.bit').forEach((b, i) => { b.setAttribute('aria-pressed', String(!!bits[i])); b.querySelector('b').textContent = bits[i]; });
      const bf = floatSummary(M.encodeFloat(d.value, M.BF16), M.BF16);
      const formula = d.kind === 'normal' ? `(−1)${SUP[d.sign]} × 2${pow2(d.exponent - 15).slice(1)} × (1 + ${d.fraction}/1024)`
        : d.kind === 'subnormal' ? `(−1)${SUP[d.sign]} × 2⁻¹⁴ × (${d.fraction}/1024)` : '식 대신 정해 둔 특별한 값';
      const same = Object.is(bf.d.value, d.value) || (Number.isNaN(bf.d.value) && Number.isNaN(d.value));
      out.classList.remove('error');
      out.innerHTML = `
        <div class="kv"><span>FP16 비트 (부호 | 지수 | 가수)</span><b class="mono">${h.fields}</b></div>
        <div class="kv"><span>BF16 비트 (부호 | 지수 | 가수)</span><b class="mono">${bf.fields}</b></div>
        <div class="kv"><span>FP16 값 · ${KIND[d.kind]}</span><b>${num(d.value)}</b></div>
        <div class="kv"><span>BF16로 옮긴 값</span><b>${num(bf.d.value)}</b></div>
        <div class="kv"><span>FP16 다음 수 · 간격</span><b>${h.n ? `${num(h.n.next)} · ${h.gap}` : '없음'}</b></div>
        <div class="kv"><span>BF16 다음 수 · 간격</span><b>${bf.n ? `${num(bf.n.next)} · ${bf.gap}` : '없음'}</b></div>
        <div class="result-line">${note ? `${note} ` : ''}FP16 계산: ${formula}. ${same ? `BF16도 이 값을 그대로 적습니다. ${spacing(h.n, bf.n)}` : `BF16에는 가수 칸이 7비트뿐이라 ${num(d.value)}이(가) ${num(bf.d.value)}(으)로 반올림됩니다.`}</div>`;
    };
    const setValue = (x) => {
      const fp = M.encodeFloat(x, M.FP16);
      bits = M.numberToBits(fp, 16);
      const v = M.decodeFloat(fp, M.FP16).value;
      show(Number.isFinite(x) && !Number.isFinite(v) ? `${num(x)}은 FP16 최댓값 65504를 넘어 무한대가 됩니다.` : v !== x && Number.isFinite(x) ? `${num(x)}은 FP16에 정확히 적을 수 없어 가장 가까운 ${num(v)}로 반올림했습니다.` : '');
    };
    row.addEventListener('click', (e) => { const b = e.target.closest('.bit'); if (!b) return; bits[b.dataset.i] ^= 1; show(); });
    input.addEventListener('input', () => {
      const x = Number(input.value.trim().replace('−', '-'));
      if (input.value.trim() === '' || Number.isNaN(x)) { out.classList.add('error'); out.innerHTML = '<div>숫자를 넣어 주세요. 예: 0.1, 2049, −3.5</div>'; return; }
      setValue(x);
    });
    root.addEventListener('click', (e) => {
      if (e.target.dataset.v) { input.value = e.target.dataset.v; setValue(Number(e.target.dataset.v)); }
      if (e.target.dataset.act === 'reset') { input.value = '1'; setValue(1); }
    });
    show();
  };
})();
