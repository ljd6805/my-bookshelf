/* 3~5장 실험 화면: 게이트, 가산기, 레지스터 */
(function () {
  'use strict';
  const M = window.CompModel, Labs = window.CompLabs;

  Labs.gates = function (root) {
    const st = { name: 'AND', a: 0, b: 0 };
    root.innerHTML = `
      <div class="controls">
        <label>게이트 <select data-k="gate">${M.GATE_NAMES.map((g) => `<option>${g}</option>`).join('')}</select></label>
        <button data-k="a" aria-pressed="false">입력 A: 0</button>
        <button data-k="b" aria-pressed="false">입력 B: 0</button>
        <button data-k="reset">실험 초기화</button>
      </div>
      <svg class="gate-svg" viewBox="0 0 360 120" role="img" aria-label="현재 게이트의 입력과 출력 전선"><g data-k="svg"></g></svg>
      <div class="readout" aria-live="polite"></div>`;
    const svg = root.querySelector('[data-k="svg"]'), out = root.querySelector('.readout');
    const show = () => {
      const unary = st.name === 'NOT', y = M.gate(st.name, st.a, st.b);
      root.querySelector('[data-k="b"]').disabled = unary;
      ['a', 'b'].forEach((k) => { const b = root.querySelector(`[data-k="${k}"]`); b.setAttribute('aria-pressed', String(!!st[k])); b.textContent = `입력 ${k.toUpperCase()}: ${st[k]}`; });
      const w = (on) => `wire${on ? ' on' : ''}`;
      svg.innerHTML = `
        <path class="${w(st.a)}" d="M20 ${unary ? 60 : 40} H140"/>${unary ? '' : `<path class="${w(st.b)}" d="M20 80 H140"/>`}
        <rect class="g-box" x="140" y="20" width="90" height="80" rx="14"/>
        <text x="185" y="66" text-anchor="middle">${st.name}</text>
        <path class="${w(y)}" d="M230 60 H320"/>
        <text x="10" y="${unary ? 52 : 32}">A=${st.a}</text>${unary ? '' : `<text x="10" y="98">B=${st.b}</text>`}
        <circle class="g-lamp${y ? ' on' : ''}" cx="332" cy="60" r="12"/>
        <text x="290" y="96">출력=${y}</text>`;
      const rows = M.truthTable(st.name).map((r) => {
        const now = r.inputs[0] === st.a && (unary || r.inputs[1] === st.b);
        return `<tr class="${now ? 'current' : ''}"><td>${r.inputs.join('</td><td>')}</td><td>${r.out}</td><td>${now ? '← 지금' : ''}</td></tr>`;
      }).join('');
      out.innerHTML = `<div class="lamp ${y ? 'on' : ''}">출력 ${y} (${y ? '불이 켜짐' : '불이 꺼짐'})</div>
        <table><thead><tr><th>A</th>${unary ? '' : '<th>B</th>'}<th>출력</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
    };
    root.addEventListener('click', (e) => {
      const k = e.target.dataset.k;
      if (k === 'a' || k === 'b') st[k] ^= 1;
      if (k === 'reset') { Object.assign(st, { name: 'AND', a: 0, b: 0 }); root.querySelector('select').value = 'AND'; }
      if (k) show();
    });
    root.querySelector('select').addEventListener('change', (e) => { st.name = e.target.value; show(); });
    show();
  };

  /* 더하기 모드와 빼기 모드는 같은 전가산기 네 개를 쓴다. 빼기에서는 B의 각 비트를 뒤집고 첫 자리올림을 1로 넣는다. */
  function adderSummary(a, b, r, sub) {
    const bitsOut = M.numberToBits(r.value, 4).join('');
    if (!sub) {
      return `<div class="result-line">${a} + ${b} → 합 비트 ${bitsOut} (${r.value}), 마지막 자리올림 ${r.carry}</div>
        <div>${r.overflow ? `4비트에 담을 수 있는 최대값 15를 넘었습니다. 자리올림까지 읽으면 ${r.value} + 16 = ${a + b}입니다.` : `자리올림이 남지 않아 4비트 합 ${r.value}가 그대로 답입니다.`}</div>`;
    }
    const inv = M.numberToBits(r.inverted, 4).join('');
    return `<div class="result-line">${a} − ${b} → ${M.numberToBits(a, 4).join('')} + ${inv} + 1 = 합 비트 ${bitsOut}, 마지막 자리올림 ${r.carry}</div>
      <div>${r.borrow
        ? (r.signed === a - b
          ? `[빌림 생김] 마지막 자리올림이 0이면 A가 B보다 작다는 뜻입니다. 합 비트 ${bitsOut}을 2의 보수로 읽으면 ${String(r.signed).replace("-", "−")}이고, 부호 없이 읽으면 ${r.value}입니다.`
          : `[빌림 생김] 마지막 자리올림이 0이면 A가 B보다 작다는 뜻입니다. 실제 답(${String(a - b).replace("-", "−")})은 4비트 2의 보수가 담는 −8~7을 벗어나, 합 비트 ${bitsOut}은 ${String(a - b).replace("-", "−")} + 16 = ${r.value}만 남깁니다. 2의 보수로 읽은 ${String(r.signed).replace("-", "−")}은 답이 아닙니다.`)
        : `[빌림 없음] 마지막 자리올림 1은 넘침이 아니라 A ≥ B라는 표시입니다. 합 비트 ${bitsOut} = ${r.value}가 답입니다.`}</div>`;
  }

  Labs.adder = function (root) {
    let shown = 4, timer = null, sub = false;
    root.innerHTML = `
      <div class="controls">
        <label>A (0~15) <input type="number" min="0" max="15" value="3" data-k="a"></label>
        <label>B (0~15) <input type="number" min="0" max="15" value="4" data-k="b"></label>
        <button data-k="op" aria-pressed="false">연산: 더하기</button>
      </div>
      <div class="controls" role="group" aria-label="예제"><button data-p="3,4,0">3 + 4</button><button data-p="7,1,0">7 + 1</button><button data-p="15,1,0">15 + 1</button><button data-p="7,3,1">7 − 3</button><button data-p="3,7,1">3 − 7</button></div>
      <div class="controls"><button data-k="play">자리올림 한 칸씩 보기</button><button data-k="reset">실험 초기화</button></div>
      <p class="legend" data-k="legend"></p>
      <div class="adder-chain" role="group" aria-label="전가산기 4개. 1의 자리부터 8의 자리까지"></div>
      <div class="readout" role="status" aria-live="polite"></div>`;
    const inA = root.querySelector('[data-k="a"]'), inB = root.querySelector('[data-k="b"]'), opBtn = root.querySelector('[data-k="op"]');
    const chain = root.querySelector('.adder-chain'), out = root.querySelector('.readout'), legend = root.querySelector('[data-k="legend"]');
    const show = () => {
      opBtn.setAttribute('aria-pressed', String(sub)); opBtn.textContent = `연산: ${sub ? '빼기 (SUB=1)' : '더하기 (SUB=0)'}`;
      legend.textContent = sub
        ? '빼기 모드: B의 각 비트가 XOR를 지나며 뒤집히고(B̄), 1의 자리에 들어오는 자리올림이 1이 됩니다. 덧셈기 자체는 그대로입니다.'
        : '1의 자리가 가장 낮은 자리입니다. 자리올림(C)은 1의 자리에서 8의 자리 쪽으로 한 상자씩 넘어갑니다.';
      const a = Number(inA.value), b = Number(inB.value);
      if (![a, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 15)) {
        out.classList.add('error'); out.textContent = '[입력 오류] 4비트 가산기는 0부터 15까지의 정수만 받습니다.'; chain.innerHTML = ''; return;
      }
      out.classList.remove('error');
      const r = sub ? M.rippleSub(a, b, 4) : M.rippleAdd(a, b, 4);
      chain.innerHTML = r.steps.map((s) => `<div class="fa ${s.position === shown - 1 && shown < 4 ? 'active' : ''} ${s.position >= shown ? 'pending' : ''}">
        <strong>${2 ** s.position}의 자리</strong><span>A=${s.a} ${sub ? 'B̄' : 'B'}=${s.b}</span><span>들어온 C=${s.carryIn}</span><span>합=${s.position < shown ? s.sum : '?'}</span>
        <span class="${s.carryOut && s.position < shown ? 'carry-on' : ''}">나가는 C=${s.position < shown ? s.carryOut : '?'}</span></div>`).join('');
      out.innerHTML = shown >= 4 ? adderSummary(a, b, r, sub)
        : `<div class="result-line">${shown}번째 자리까지 계산했습니다.</div><div>다음 자리는 앞 자리의 자리올림을 기다립니다.</div>`;
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const play = () => {
      stop(); shown = 0; show();
      timer = setInterval(() => { shown += 1; show(); if (shown >= 4) stop(); }, Labs.reduceMotion() ? 1200 : 700);
    };
    [inA, inB].forEach((el) => el.addEventListener('input', () => { stop(); shown = 4; show(); }));
    root.addEventListener('click', (e) => {
      const { p, k } = e.target.dataset;
      if (p) { stop(); const v = p.split(','); [inA.value, inB.value] = v; sub = v[2] === '1'; shown = 4; show(); }
      if (k === 'op') { stop(); sub = !sub; shown = 4; show(); }
      if (k === 'play') play();
      if (k === 'reset') { stop(); inA.value = 3; inB.value = 4; sub = false; shown = 4; show(); }
    });
    show();
    return stop;
  };

  Labs.register = function (root) {
    const st = { d: [0, 0, 0, 0], q: [0, 0, 0, 0], we: 0, clocks: 0, log: '아직 클럭이 한 번도 오지 않았습니다.' };
    root.innerHTML = `
      <p class="legend">입력 D (왼쪽이 가장 높은 자리)</p>
      <div class="bit-row four" data-k="d" role="group" aria-label="입력 D 네 개"></div>
      <div class="controls"><button data-k="we" aria-pressed="false">쓰기 허용: 끔</button><button data-k="clock">클럭 한 번 ↑</button><button data-k="reset">실험 초기화</button></div>
      <div class="readout" aria-live="polite"></div>`;
    const out = root.querySelector('.readout');
    const show = () => {
      root.querySelector('[data-k="d"]').innerHTML = st.d.map((v, i) => `<button class="bit" data-i="${i}" aria-pressed="${!!v}" aria-label="입력 D${3 - i}"><b>${v}</b><small>D${3 - i}</small></button>`).join('');
      const we = root.querySelector('[data-k="we"]');
      we.setAttribute('aria-pressed', String(!!st.we)); we.textContent = `쓰기 허용: ${st.we ? '켬' : '끔'}`;
      const changed = st.d.some((v, i) => v !== st.q[i]);
      out.innerHTML = `<div class="result-line">저장된 값 Q = <span class="mono">${st.q.join('')}</span> (${M.bitsToNumber(st.q)})</div>
        <div>${st.log}</div>
        <div class="legend">클럭 ${st.clocks}번. ${changed ? '입력과 저장값이 다르지만, 클럭이 오기 전까지 Q는 그대로입니다.' : '입력과 저장값이 같습니다.'}</div>`;
    };
    root.addEventListener('click', (e) => {
      const bit = e.target.closest('[data-i]'), k = e.target.closest('[data-k]')?.dataset.k;
      if (bit) st.d[bit.dataset.i] ^= 1;
      else if (k === 'we') st.we ^= 1;
      else if (k === 'clock') {
        const before = st.q.join('');
        st.q = M.clockRegister(st.q, st.d, st.we); st.clocks += 1;
        st.log = st.we ? `클럭 순간에 입력 ${st.d.join('')}을 받아들여 ${before} → ${st.q.join('')}이 되었습니다.` : `쓰기 허용이 꺼져 있어 클럭이 와도 ${before}을 유지했습니다.`;
      } else if (k === 'reset') Object.assign(st, { d: [0, 0, 0, 0], q: [0, 0, 0, 0], we: 0, clocks: 0, log: '아직 클럭이 한 번도 오지 않았습니다.' });
      else return;
      show();
    });
    show();
  };
})();
