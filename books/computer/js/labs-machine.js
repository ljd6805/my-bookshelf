/* 6~9장 실험 화면: 교육용 CPU와 캐시 */
(function () {
  'use strict';
  const C = window.CompCPU, K = window.CompCache, M = window.CompModel, Labs = window.CompLabs;
  const PHASES = { fetch: '가져오기', decode: '해독', execute: '실행' };

  function cpuTemplate(programs, editable) {
    return `
      <div class="controls">
        ${programs.length > 1 ? `<label>프로그램 <select data-k="prog">${programs.map((p) => `<option value="${p}">${C.PROGRAMS[p].title}</option>`).join('')}</select></label>` : ''}
        <button data-k="phase">다음 단계</button><button data-k="instr">명령 하나 끝까지</button>
        <button data-k="run">멈출 때까지 실행</button><button data-k="reset">실험 초기화</button>
      </div>
      ${editable ? '<p class="legend">메모리 칸의 숫자를 바꾸면 처음부터 다시 실행됩니다. 데이터 칸을 바꿔 보는 것부터 시작하세요.</p>' : ''}
      <div class="cpu">
        <div><h4>메모리 16칸</h4><div class="memory" data-k="mem"></div>
          <p class="legend">▶ 다음에 읽을 칸(PC), 파란 칸은 방금 읽은 칸, 주황 칸은 방금 쓴 칸입니다.</p></div>
        <div class="regs"><h4>CPU 안쪽</h4><div class="phases" data-k="phases"></div><div data-k="regs"></div>
          <h4>출력 화면</h4><div class="screen" data-k="screen" aria-live="polite"></div></div>
      </div>
      <div class="readout" data-k="log" aria-live="polite"></div>`;
  }

  function renderMemory(view, programKey, editable) {
    const data = C.PROGRAMS[programKey].data;
    return view.mem.map((byte, i) => {
      const d = C.decode(byte);
      const what = data[i] ? `데이터: ${data[i]}` : d.valid ? d.label : '—';
      const cls = ['cell', i === view.pc && !view.halted ? 'pc' : '', i === view.read ? 'read' : '', i === view.write ? 'write' : ''].join(' ');
      const value = editable ? `<input type="number" min="0" max="255" value="${byte}" data-addr="${i}" aria-label="${i}번 칸 값">` : `<span>${byte}</span>`;
      return `<div class="${cls}"><span class="addr">${i}</span><span>${value} <span class="mono">${M.numberToBits(byte, 8).join('')}</span><br><span class="what">${what}</span></span></div>`;
    }).join('');
  }

  Labs.cpu = function (root, options = {}) {
    const programs = (root.dataset.programs || 'add').split(','), editable = root.dataset.editable === 'true';
    root.innerHTML = cpuTemplate(programs, editable);
    let key = programs[0], memory, state, view, pending = [], phase = null, log = '';
    const $ = (k) => root.querySelector(`[data-k="${k}"]`);
    const load = (mem) => { memory = mem.slice(); state = C.createState(memory); view = { ...state }; pending = []; phase = null; log = '“다음 단계”를 눌러 첫 명령을 가져와 보세요.'; show(); };
    const show = () => {
      $('mem').innerHTML = renderMemory(view, key, editable);
      $('phases').innerHTML = Object.entries(PHASES).map(([p, t]) => `<span class="${p === phase ? 'now' : ''}">${t}</span>`).join('');
      const ir = C.decode(view.ir);
      $('regs').innerHTML = `
        <div class="kv"><span>PC (다음 명령 주소)</span><b>${view.pc}</b></div>
        <div class="kv"><span>IR (지금 명령)</span><b>${view.ir} = ${ir.label}</b></div>
        <div class="kv"><span>ACC (계산 칸)</span><b>${view.acc}</b></div>
        <div class="kv"><span>Z 깃발 (결과가 0?)</span><b>${view.z}</b></div>
        <div class="kv"><span>C 깃발 (자리넘침?)</span><b>${view.c}</b></div>
        <div class="kv"><span>실행한 명령 수</span><b>${state.steps}</b></div>`;
      $('screen').textContent = view.out.length ? view.out.join('  ') : '(비어 있음)';
      const err = state.error;
      $('log').classList.toggle('error', !!err);
      $('log').innerHTML = `<div class="result-line">${err ? '실행 오류' : state.halted && !pending.length ? '실행이 끝났습니다' : phase ? `${PHASES[phase]} 단계` : '준비'}</div><div>${Labs.esc(err || log)}</div>`;
      ['phase', 'instr', 'run'].forEach((k) => { $(k).disabled = state.halted && !pending.length; });
    };
    const advancePhase = () => {
      if (!pending.length) {
        if (state.halted) return;
        const prev = state, result = C.step(state);
        state = result.state;
        const afterFetch = { ...prev, ir: state.ir, pc: (prev.pc + 1) % 16, read: prev.pc, write: undefined };
        pending = result.trace.map((t) => ({ ...t, view: t.phase === 'execute' ? { ...state, read: t.read, write: t.write } : afterFetch }));
        if (result.trace.length < 3) pending[pending.length - 1].view = { ...state };
      }
      const t = pending.shift();
      phase = t.phase; view = t.view; log = t.text;
    };
    root.addEventListener('click', (e) => {
      const k = e.target.dataset.k;
      if (k === 'phase') advancePhase();
      else if (k === 'instr') { do advancePhase(); while (pending.length); }
      else if (k === 'run') {
        while (pending.length) advancePhase();
        while (!state.halted && state.steps < C.MAX_STEPS) state = C.step(state).state;
        if (!state.halted) state = { ...state, error: C.run(memory).error };
        view = { ...state }; phase = null; log = `명령 ${state.steps}개를 실행했습니다.`;
      } else if (k === 'reset') { key = programs[0]; if ($('prog')) $('prog').value = key; return load(C.PROGRAMS[key].memory); }
      else return;
      show();
    });
    root.addEventListener('change', (e) => {
      if (e.target.dataset.k === 'prog') { key = e.target.value; load(C.PROGRAMS[key].memory); }
      if (e.target.dataset.addr !== undefined) {
        const v = Number(e.target.value), mem = memory.slice();
        if (!Number.isInteger(v) || v < 0 || v > 255) { e.target.value = memory[e.target.dataset.addr]; log = '메모리 한 칸에는 0~255만 넣을 수 있습니다.'; return show(); }
        mem[e.target.dataset.addr] = v; load(mem);
      }
    });
    load(C.PROGRAMS[key].memory);
  };

  Labs.cache = function (root) {
    root.innerHTML = `
      <div class="controls">
        <label>읽는 순서 <select data-k="kind">
          <option value="sequential">앞에서부터 차례로</option><option value="loop">작은 구간(8바이트) 반복</option>
          <option value="stride">16바이트씩 건너뛰기</option><option value="random">무작위(고정 순서)</option></select></label>
        <label>캐시 줄 수 <select data-k="lines"><option>2</option><option selected>4</option><option>8</option><option>16</option></select></label>
        <label>한 줄 크기(바이트) <select data-k="block"><option>1</option><option>2</option><option selected>4</option><option>8</option></select></label>
      </div>
      <div class="controls"><button data-k="play">한 번씩 재생</button><button data-k="reset">실험 초기화</button></div>
      <div class="access-grid" data-k="grid" aria-label="64번의 메모리 읽기 결과. H는 적중, M은 실패"></div>
      <div class="readout" data-k="out" aria-live="polite"></div>`;
    const $ = (k) => root.querySelector(`[data-k="${k}"]`);
    let shown = 64, timer = null;
    const show = () => {
      const r = K.simulate(K.pattern($('kind').value), Number($('lines').value), Number($('block').value));
      const part = r.events.slice(0, shown), hits = part.filter((e) => e.hit).length;
      $('grid').innerHTML = r.events.map((e, i) => i < shown
        ? `<span class="access ${e.hit ? 'hit' : 'miss'} ${i === shown - 1 && shown < 64 ? 'now' : ''}" title="주소 ${e.address}, 줄 ${e.line}">${e.hit ? 'H' : 'M'}<br>${e.address}</span>`
        : '<span class="access">·</span>').join('');
      const last = part[part.length - 1];
      const cycles = hits * K.ASSUMED.hitCycles + (part.length - hits) * K.ASSUMED.missCycles;
      $('out').innerHTML = `<div class="result-line">${part.length}번 읽기 중 적중 ${hits}번 (${part.length ? Math.round((hits / part.length) * 100) : 0}%)</div>
        <div>가정한 시간: 캐시 없이 ${part.length * K.ASSUMED.missCycles}사이클 → 캐시로 ${cycles}사이클${part.length ? ` (평균 ${(cycles / part.length).toFixed(1)}사이클)` : ''}</div>
        <div class="bar" aria-hidden="true"><i style="width:${part.length ? (cycles / (part.length * K.ASSUMED.missCycles)) * 100 : 0}%"></i></div>
        ${last ? `<div class="legend">마지막 읽기: 주소 ${last.address}는 블록 ${last.block}, 캐시 ${last.line}번 줄로 갑니다. ${last.hit ? '이미 들어 있어 적중했습니다.' : last.evicted !== null ? `그 줄에 있던 다른 블록을 내보내고 새로 가져왔습니다.` : '빈 줄에 새로 가져왔습니다.'}</div>` : ''}`;
    };
    const stop = () => { clearInterval(timer); timer = null; };
    root.addEventListener('change', () => { stop(); shown = 64; show(); });
    root.addEventListener('click', (e) => {
      const k = e.target.dataset.k;
      if (k === 'play') { stop(); shown = 0; show(); timer = setInterval(() => { shown += 1; show(); if (shown >= 64) stop(); }, Labs.reduceMotion() ? 400 : 120); }
      if (k === 'reset') { stop(); $('kind').value = 'sequential'; $('lines').value = '4'; $('block').value = '4'; shown = 64; show(); }
    });
    show();
  };
})();
