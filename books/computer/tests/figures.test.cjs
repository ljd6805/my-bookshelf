const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/figures.js'), 'utf8'), context);
const {timing} = context.window.CompFigures.memory;
const valueAt = (points, time) => points.filter(([t]) => t <= time).at(-1)[1];

test('클럭 그림의 Q는 상승 에지에서만 바뀌고 그 순간의 D를 저장한다', () => {
  for (const [time] of timing.stored.slice(1)) assert.ok(timing.edges.includes(time));
  for (const edge of timing.edges) {
    assert.equal(valueAt(timing.stored, edge), valueAt(timing.input, edge), `t${edge}에서 D를 저장`);
    assert.equal(valueAt(timing.clock, edge), 1);
    assert.equal(valueAt(timing.clock, edge - .01), 0);
  }
});

test('상승 에지를 만나지 않는 짧은 D 펄스는 Q에 남지 않는다', () => {
  assert.equal(valueAt(timing.input, 6), 1);
  assert.equal(valueAt(timing.stored, 6), 0);
  assert.equal(valueAt(timing.stored, 7), 0);
  assert.equal(valueAt(timing.stored, 2), 0);
  assert.equal(valueAt(timing.stored, 3), 1);
});
