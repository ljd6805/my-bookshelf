/* 정확한 관계를 보여 주는 개념도. CSS 변수로 밝은/어두운 화면을 함께 지원한다. */
window.CompFigures = (() => {
  'use strict';
  const text = (x, y, value, cls = '', anchor = 'start') =>
    `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${value}</text>`;
  const line = (d, cls = '', arrow = false) =>
    `<path d="${d}" class="diagram-line ${cls}"${arrow ? ' marker-end="url(#arrow-diagram)"' : ''}/>`;
  const box = (x, y, w, h, title, sub = '', cls = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="diagram-node ${cls}"/>`
    + text(x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 5), title, 'node-title', 'middle')
    + (sub ? text(x + w / 2, y + h / 2 + 22, sub, 'diagram-small', 'middle') : '');
  const svg = (key, label, height, content) => `<svg class="technical-diagram" viewBox="0 0 760 ${height}" role="img" aria-labelledby="diagram-${key}">
    <title id="diagram-${key}">${label}</title><defs><marker id="arrow-diagram" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" class="arrow-head"/></marker></defs>${content}</svg>`;
  const cell = (label, value, note = '') => `<div class="diagram-cell"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;

  function bits() {
    const values = [128, 64, 32, 16, 8, 4, 2, 1];
    return `<div class="bit-explanation"><div class="diagram-bit-grid">${values.map((v) => `<div class="diagram-bit ${v <= 2 ? 'is-on' : ''}"><span>${v}</span><b>${v <= 2 ? 1 : 0}</b><small>${v <= 2 ? '켜짐' : '꺼짐'}</small></div>`).join('')}</div>
      <div class="diagram-equation"><span>켜진 자리만 더하기</span><strong>2 + 1 = 3</strong></div></div>`;
  }

  function encoding() {
    return `<div class="encoding-map"><div class="encoding-byte"><span>같은 8개 비트</span><strong>01000001</strong><small>비트는 그대로, 읽는 규칙은 네 가지</small></div><div class="encoding-results">${cell('부호 없는 정수','65')}${cell('부호 있는 정수','+65','2의 보수')}${cell('ASCII 글자','A')}${cell('회색 밝기','25%','65 ÷ 255 ≈ 0.255')}</div></div>`;
  }

  function gates() {
    return svg('gates', 'AND는 직렬 경로의 두 스위치가 모두 닫혀야 1, OR는 병렬 경로 중 하나가 닫혀도 1입니다.', 310,
      text(34, 36, 'AND · 두 조건을 모두 만족', 'diagram-heading')
      + text(410, 36, 'OR · 한 조건만 만족해도', 'diagram-heading')
      + line('M34 132 H84 M166 132 H210 M292 132 H340', 'signal')
      + box(84, 104, 82, 56, 'A = 1', '', 'active') + box(210, 104, 82, 56, 'B = 1', '', 'active')
      + `<circle cx="352" cy="132" r="11" class="signal-dot"/>`
      + text(34, 207, '1 AND 1 = 1', 'diagram-math') + text(34, 244, '어느 하나라도 열리면 경로가 끊깁니다.', 'diagram-small')
      + line('M410 132 H448 V88 H490 M572 88 H624 V132 H696', 'signal')
      + line('M448 132 V172 H490 M572 172 H624 V132', 'muted-line')
      + box(490, 60, 82, 56, 'A = 1', '', 'active') + box(490, 144, 82, 56, 'B = 0')
      + `<circle cx="708" cy="132" r="11" class="signal-dot"/>`
      + text(410, 244, '1 OR 0 = 1', 'diagram-math') + text(410, 279, '위쪽 경로 하나로 출력에 도달합니다.', 'diagram-small'));
  }

  function adder() {
    const wires = line('M56 74 H155 M56 126 H112 V98 H155')
      + line('M88 74 V202 H155 M112 126 V226 H155')
      + line('M245 86 H292 V104 H350 M292 104 V204 H350')
      + line('M56 292 H318 V130 H350 M318 224 H350')
      + line('M245 214 H274 V266 H498 V204 H548')
      + line('M440 216 H548 M440 116 H695', 'signal', true)
      + line('M638 214 H695', 'carry', true);
    const nodes = box(155, 60, 90, 52, 'XOR') + box(155, 188, 90, 52, 'AND')
      + box(350, 90, 90, 52, 'XOR', '', 'active') + box(350, 190, 90, 52, 'AND')
      + box(548, 188, 90, 52, 'OR', '', 'carry-node');
    const junctions = [[88,74],[112,126],[292,104],[318,224]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.5" class="junction"/>`).join('');
    return svg('adder', 'A와 B의 XOR를 Cin과 다시 XOR하여 합을 만듭니다. A AND B와 Cin AND (A XOR B)를 OR하여 Cout을 만듭니다.', 356,
      text(30, 32, '전가산기 한 개 · 합과 자리올림은 서로 다른 출력', 'diagram-heading')
      + wires + nodes + junctions + text(30,80,'A') + text(30,132,'B') + text(16,298,'C in')
      + text(694,98,'합 S','diagram-label','end') + text(696,250,'C out','diagram-label','end')
      + text(30,334,'● 연결점이 있는 교차만 연결됩니다. 화살표는 출력 방향입니다.','diagram-small'));
  }

  // 시각 자료의 시간축 데이터. Q는 t=3에서 1, t=5에서 0이 된다.
  const timing = {
    clock: [[0,0],[1,1],[2,0],[3,1],[4,0],[5,1],[6,0],[7,1],[8,0]],
    input: [[0,0],[1.5,1],[4.5,0],[5.5,1],[6.5,0]],
    stored: [[0,0],[3,1],[5,0]],
    edges: [1,3,5,7]
  };
  function wave(points, y) {
    const x = (t) => 126 + t * 68;
    let d = `M${x(0)} ${y - points[0][1] * 30}`;
    points.slice(1).forEach(([t,v]) => { d += ` H${x(t)} V${y - v * 30}`; });
    return d + ` H${x(8.5)}`;
  }
  function memory() {
    const edges = timing.edges.map((t) => line(`M${126+t*68} 54 V255`, 'edge-line')
      + text(126+t*68, 282, `t${t}`, 'diagram-small', 'middle')).join('');
    return svg('memory', '입력 D는 t1.5에서 1, t4.5에서 0. 저장값 Q는 상승 에지 t3에서 1, t5에서 0으로 바뀝니다. t5.5부터 t6.5까지의 짧은 입력은 저장되지 않습니다.', 330,
      text(28,30,'클럭 상승 에지에서만 입력을 저장','diagram-heading') + edges
      + text(28,93,'클럭') + text(28,164,'입력 D') + text(28,235,'저장 Q')
      + line(wave(timing.clock,106)) + line(wave(timing.input,177),'carry') + line(wave(timing.stored,248),'signal')
      + text(126,314,'점선 = 클럭 상승 에지 · 쓰기 허용이 켜진 경우 · 초기 Q = 0','diagram-small'));
  }

  function cpu() {
    return `<div class="cpu-map"><div class="diagram-memory"><h4>메모리</h4><div><code>00</code><b>LDA 14</b><span>3을 가져오기</span></div><div><code>01</code><b>ADD 15</b><span>4를 더하기</span></div><div><code>02</code><b>OUT</b><span>7을 출력</span></div><div><code>03</code><b>HLT</b><span>멈추기</span></div><p><code>14: 3</code><code>15: 4</code></p></div>
      <div class="diagram-bus"><span>주소 ←</span><b>버스</b><span>← 명령·데이터 →</span></div>
      <div class="diagram-cpu"><h4>CPU</h4><dl><div><dt>PC</dt><dd>다음 명령의 주소</dd></div><div><dt>IR</dt><dd>지금 실행할 명령</dd></div><div><dt>ACC</dt><dd>계산 중인 값</dd></div><div><dt>ALU</dt><dd>덧셈·연산 회로</dd></div><div><dt>Z · C</dt><dd>0 여부 · 자리넘침</dd></div></dl></div>
      <div class="diagram-cycle"><b>가져오기</b><span>→</span><b>해독</b><span>→</span><b>실행</b><span>↺</span></div></div>`;
  }

  function programs() {
    return svg('programs', '남은 횟수를 가져오고 0이면 출력 후 멈춥니다. 아니면 횟수에서 1을 빼고 결과에 3을 더한 뒤 JMP 0으로 돌아갑니다.', 366,
      box(190,25,250,60,'남은 횟수 가져오기','LDA')
      + line('M315 85 V119','',true)
      + `<path d="M315 120 L400 168 L315 216 L230 168 Z" class="decision-node"/>`
      + text(315,174,'0인가?','node-title','middle')
      + line('M400 168 H516','signal',true) + text(456,153,'예 · JZ','diagram-small','middle')
      + box(518,138,206,60,'결과 출력 · 멈춤','OUT → HLT','','')
      + line('M315 216 V263','',true) + text(334,242,'아니오','diagram-small')
      + box(190,265,250,60,'횟수 −1, 결과 +3')
      + line('M190 295 H108 V55 H188','carry',true) + text(70,183,'JMP 0','diagram-small','middle')
      + text(190,354,'점프는 다음에 읽을 명령의 주소(PC)를 바꿉니다.','diagram-small'));
  }

  function cache() {
    const tiers = [['레지스터','CPU가 지금 계산하는 값'],['캐시','곧 다시 쓸 데이터의 복사본'],['메인 메모리 · RAM','실행 중인 프로그램과 데이터'],['저장 장치 · SSD','전원이 꺼져도 보관할 데이터']];
    return `<div class="hierarchy-map"><div class="hierarchy-label"><span>작은 용량 · 빠른 접근</span><span>↓</span><span>큰 용량 · 느린 접근</span></div><ol>${tiers.map(([title,desc],i)=>`<li style="--tier:${i}"><b>${title}</b><span>${desc}</span></li>`).join('')}</ol></div>`;
  }

  const figure = (title, html, caption, scroll = false) => ({title, html, caption, scroll});
  return {
    home: figure('3 + 4가 7이 되는 여정', `<div class="journey-map">${cell('01 · 표현','0011 + 0100','3과 4를 비트로 저장')}${cell('02 · 회로','0111','게이트를 연결해 더하기')}${cell('03 · 실행','7','CPU가 명령을 실행해 출력')}</div>`, '비트의 표현, 회로의 계산, CPU의 실행을 차례로 배웁니다. 각 층은 앞에서 만든 개념을 사용합니다.'),
    bits: figure('자리값이 모여 하나의 수가 됩니다', bits(), '8개 비트 중 2와 1의 자리만 켜져 있습니다. 00000011₂ = 3₁₀입니다.'),
    encoding: figure('비트가 아니라 해석의 약속이 달라집니다', encoding(), '01000001은 정수로는 65, ASCII로는 A입니다. 회색 밝기는 0~255를 검정~흰색에 대응한 예입니다.'),
    gates: figure('연결 방식으로 만드는 두 가지 판단', gates(), '닫힌 스위치를 1로 나타낸 개념도입니다. AND는 모든 경로 조건을, OR는 적어도 하나의 경로를 요구합니다.', true),
    adder: figure('게이트 다섯 개로 만드는 전가산기', adder(), 'S = A XOR B XOR Cin. Cout = (A AND B) OR (Cin AND (A XOR B)). 두 출력은 합의 낮은 자리와 다음 자리로 넘길 값을 맡습니다.', true),
    memory: {...figure('입력은 바뀌어도 기억은 유지됩니다', memory(), 'Q는 t3에서 1, t5에서 0이 됩니다. t5.5~t6.5의 짧은 입력 변화는 상승 에지를 만나지 않아 Q에 저장되지 않습니다.', true), timing},
    cpu: figure('명령을 읽고 실행하는 작은 컴퓨터', cpu(), '메모리에는 명령과 데이터가 함께 있습니다. CPU는 가져오기 → 해독 → 실행을 반복하고 HLT에서 멈춥니다. 이 그림은 고정된 구조 설명입니다.'),
    programs: figure('반복은 다음 명령의 주소를 되돌리는 일입니다', programs(), '0이면 출력을 마치고 멈추고, 0이 아니면 결과에 3을 더한 뒤 처음으로 돌아갑니다. 화살표는 명령 실행 순서입니다.', true),
    cache: figure('빠른 기억은 가까이, 큰 기억은 아래에', cache(), '일반적인 메모리 계층의 상대적인 경향입니다. 막대 길이는 실제 용량이나 지연 시간의 비율을 뜻하지 않습니다.')
  };
})();
