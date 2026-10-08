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
})();
