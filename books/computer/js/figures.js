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
  // 휴대폰 폭에서도 글자가 읽히도록 좁은 viewBox(가로 380~400)로 그린다. 제목과 긴 설명은 SVG 밖의 HTML에 둔다.
  const svg = (key, label, width, height, content) => `<svg class="technical-diagram" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="diagram-${key}">
    <title id="diagram-${key}">${label}</title>${content.includes('arrow-diagram') ? `<defs><marker id="arrow-diagram" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" class="arrow-head"/></marker></defs>` : ''}${content}</svg>`;
  const note = (value) => `<p class="diagram-note">${value}</p>`;
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
    const and = svg('gates-and', 'AND는 한 줄로 이은 두 스위치가 모두 닫혀야 출력에 닿습니다.', 380, 200,
      line('M20 50 H70 M152 50 H196 M278 50 H330', 'signal')
      + box(70, 22, 82, 56, 'A = 1', '', 'active') + box(196, 22, 82, 56, 'B = 1', '', 'active')
      + `<circle cx="342" cy="50" r="11" class="signal-dot"/>`
      + text(20, 150, '1 AND 1 = 1', 'diagram-math') + text(20, 182, '하나라도 열리면 길이 끊깁니다.', 'diagram-small'));
    const or = svg('gates-or', 'OR는 나란히 이은 두 스위치 중 하나만 닫혀도 출력에 닿습니다.', 380, 250,
      line('M20 100 H58 V56 H100 M182 56 H234 V100 H330', 'signal')
      + line('M58 100 V144 H100 M182 144 H234 V100', 'muted-line')
      + box(100, 28, 82, 56, 'A = 1', '', 'active') + box(100, 116, 82, 56, 'B = 0')
      + `<circle cx="342" cy="100" r="11" class="signal-dot"/>`
      + text(20, 206, '1 OR 0 = 1', 'diagram-math') + text(20, 236, '위쪽 길 하나로 출력에 닿습니다.', 'diagram-small'));
    return `<div class="diagram-pair"><div><h4>AND · 한 줄로 잇기</h4>${and}</div><div><h4>OR · 나란히 잇기</h4>${or}</div></div>`;
  }

  function adder() {
    const wires = line('M30 46 H60 M42 46 V162 H60 M30 70 H60 M50 70 V186 H60')
      + line('M130 58 H160 V46 H190 M160 58 V162 H190')
      + line('M52 286 H170 V70 H190 M170 186 H190')
      + line('M130 174 H145 V212 H290 M260 174 H275 V236 H290')
      + line('M260 58 H392', 'signal', true) + line('M350 224 H392', 'carry', true);
    const nodes = box(60, 34, 70, 48, 'XOR') + box(60, 150, 70, 48, 'AND')
      + box(190, 34, 70, 48, 'XOR', '', 'active') + box(190, 150, 70, 48, 'AND')
      + box(290, 200, 60, 48, 'OR', '', 'carry-node');
    const junctions = [[42, 46], [50, 70], [160, 58], [170, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" class="junction"/>`).join('');
    return svg('adder', 'A와 B의 XOR를 들어온 자리올림과 다시 XOR하여 합을 만듭니다. A AND B와, 들어온 자리올림 AND (A XOR B)를 OR하여 나가는 자리올림을 만듭니다.', 400, 300,
      wires + nodes + junctions + text(8, 51, 'A') + text(8, 75, 'B') + text(4, 291, 'C in')
      + text(396, 44, '합 S', 'diagram-label', 'end') + text(396, 264, 'C out', 'diagram-label', 'end'))
      + note('점이 찍힌 교차점만 이어져 있고, 화살표는 출력이 나가는 방향입니다.');
  }

  // 시각 자료의 시간축 데이터. Q는 t=3에서 1, t=5에서 0이 된다.
  const timing = {
    clock: [[0,0],[1,1],[2,0],[3,1],[4,0],[5,1],[6,0],[7,1],[8,0]],
    input: [[0,0],[1.5,1],[4.5,0],[5.5,1],[6.5,0]],
    stored: [[0,0],[3,1],[5,0]],
    edges: [1,3,5,7]
  };
  function wave(points, y) {
    const x = (t) => 80 + t * 36;
    let d = `M${x(0)} ${y - points[0][1] * 26}`;
    points.slice(1).forEach(([t, v]) => { d += ` H${x(t)} V${y - v * 26}`; });
    return d + ` H${x(8.5)}`;
  }
  function memory() {
    const edges = timing.edges.map((t) => line(`M${80 + t * 36} 20 V226`, 'edge-line')
      + text(80 + t * 36, 252, `t${t}`, 'diagram-small', 'middle')).join('');
    return svg('memory', '입력 D는 t1.5에서 1, t4.5에서 0이 됩니다. 저장값 Q는 상승 에지 t3에서 1, t5에서 0으로 바뀝니다. t5.5부터 t6.5까지의 짧은 입력은 저장되지 않습니다.', 400, 266,
      edges + text(8, 75, '클럭') + text(8, 145, '입력 D') + text(8, 215, '저장 Q')
      + line(wave(timing.clock, 80)) + line(wave(timing.input, 150), 'carry') + line(wave(timing.stored, 220), 'signal'))
      + note('점선은 클럭이 0에서 1로 올라가는 순간(상승 에지)입니다. 쓰기 허용은 켜져 있고, 처음 Q는 0입니다.');
  }

  function cpu() {
    return `<div class="cpu-map"><div class="diagram-memory"><h4>메모리</h4><div><code>00</code><b>LDA 14</b><span>3을 가져오기</span></div><div><code>01</code><b>ADD 15</b><span>4를 더하기</span></div><div><code>02</code><b>OUT</b><span>7을 출력</span></div><div><code>03</code><b>HLT</b><span>멈추기</span></div><p><code>14: 3</code><code>15: 4</code></p></div>
      <div class="diagram-bus"><span>← 주소</span><b>버스</b><span>명령·데이터 ⇄</span></div>
      <div class="diagram-cpu"><h4>CPU</h4><dl><div><dt>PC</dt><dd>다음 명령의 주소</dd></div><div><dt>IR</dt><dd>지금 실행할 명령</dd></div><div><dt>ACC</dt><dd>계산 중인 값</dd></div><div><dt>ALU</dt><dd>덧셈·연산 회로</dd></div><div><dt>Z · C</dt><dd>0 여부 · 자리넘침</dd></div></dl></div>
      <div class="diagram-cycle"><b>가져오기</b><span>→</span><b>해독</b><span>→</span><b>실행</b><span>↺</span></div></div>`;
  }

  function programs() {
    return svg('programs', '남은 횟수를 가져와 0이면 결과를 출력하고 멈춥니다. 0이 아니면 횟수에서 1을 빼고 결과에 3을 더한 뒤 JMP 0으로 처음에 돌아갑니다.', 400, 396,
      box(80, 10, 240, 56, '남은 횟수 가져오기', 'LDA')
      + line('M200 66 V96', '', true)
      + `<path d="M200 98 L270 140 L200 182 L130 140 Z" class="decision-node"/>`
      + text(200, 146, '0인가?', 'node-title', 'middle')
      + line('M270 140 H360 V318', 'signal', true) + text(318, 128, '예 · JZ', 'diagram-small', 'middle')
      + line('M200 182 V234', '', true) + text(212, 214, '아니오', 'diagram-small')
      + box(80, 236, 240, 56, '횟수 −1, 결과 +3')
      + line('M80 264 H30 V38 H78', 'carry', true) + text(38, 156, 'JMP 0', 'diagram-small')
      + box(220, 320, 170, 56, '결과 출력 · 멈춤', 'OUT → HLT'))
      + note('점프는 다음에 읽을 명령의 주소(PC)를 바꿉니다. 주황 화살표가 반복을 만드는 JMP 0입니다.');
  }

  function cache() {
    const tiers = [['레지스터','CPU가 지금 계산하는 값'],['캐시','곧 다시 쓸 데이터의 복사본'],['메인 메모리 · RAM','실행 중인 프로그램과 데이터'],['저장 장치 · SSD','전원이 꺼져도 보관할 데이터']];
    return `<div class="hierarchy-map"><div class="hierarchy-label"><span>작은 용량 · 빠른 접근</span><span>↓</span><span>큰 용량 · 느린 접근</span></div><ol>${tiers.map(([title,desc],i)=>`<li style="--tier:${i}"><b>${title}</b><span>${desc}</span></li>`).join('')}</ol></div>`;
  }

  const figure = (title, html, caption) => ({ title, html, caption });
  return {
    bits: figure('자리값이 모여 하나의 수가 됩니다', bits(), '8개 비트 가운데 2의 자리와 1의 자리만 켜져 있습니다. 켜진 자리값을 더하면 00000011₂ = 3₁₀입니다.'),
    encoding: figure('비트는 그대로, 읽는 약속만 달라집니다', encoding(), '01000001은 정수로 읽으면 65, ASCII 글자로 읽으면 A입니다. 회색 밝기는 0~255를 검정에서 흰색까지에 대응한 예입니다.'),
    gates: figure('잇는 방식으로 만드는 두 가지 판단', gates(), '닫힌 스위치를 1로 나타냈습니다. AND는 길 위의 스위치가 모두 닫혀야 하고, OR는 두 길 가운데 하나만 닫혀도 출력에 닿습니다.'),
    adder: figure('게이트 다섯 개로 만드는 전가산기', adder(), '합 S = A XOR B XOR C in, 나가는 자리올림 C out = (A AND B) OR (C in AND (A XOR B))입니다. S는 이 자리에 남고, C out은 다음 자리로 넘어갑니다.'),
    memory: { ...figure('입력이 바뀌어도 기억은 유지됩니다', memory(), 'Q는 t3에서 1, t5에서 0이 됩니다. t5.5~t6.5의 짧은 입력 변화는 상승 에지를 만나지 않아 Q에 남지 않습니다.'), timing },
    cpu: figure('명령을 읽고 실행하는 작은 컴퓨터', cpu(), '메모리에는 명령과 데이터가 함께 들어 있습니다. CPU는 가져오기, 해독, 실행을 되풀이하다가 HLT에서 멈춥니다. 구조를 설명하는 고정된 그림입니다.'),
    programs: figure('반복은 다음 명령의 주소를 되돌리는 일입니다', programs(), '남은 횟수가 0이면 결과를 출력하고 멈춥니다. 0이 아니면 결과에 3을 더한 뒤 처음으로 돌아갑니다. 화살표는 명령이 실행되는 순서입니다.'),
    cache: figure('빠른 기억은 가까이, 큰 기억은 아래에', cache(), '위로 갈수록 작고 빠르며, 아래로 갈수록 크고 느립니다. 일반적인 경향을 보여 주는 그림이며 실제 용량이나 지연 시간의 비율은 아닙니다.')
  };
})();
