const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['who-pays','ladder','cashflow','price','sensitivity','curve-board','spread','gordon','routes','final-table'],FILES=['labs-rate','labs-price','labs-curve','labs-credit','labs-final'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.BGuides.guides;
const labSrc=FILES.map(f=>read(`js/${f}.js`)).join('');
const ADVICE=/(사세요|파세요|사라|팔라|매수하세요|매도하세요|추천|권합니다|오를 것|내릴 것|오를 겁니다|내릴 겁니다|사 두세요|사야 합니다)/;
test('guides have a purpose, 2–5 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=5,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const key of Object.keys(values))assert.match(labSrc,new RegExp(`['"]${key}['"]`),`${id}:${key}`);});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice or forecasts',()=>{const app=read('js/app.js');for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);assert.doesNotMatch(labSrc+app+read('js/home-lab.js')+read('js/figures.js'),ADVICE);});
test('every lab result says what it was computed on',()=>{
 for(const f of FILES){const src=read(`js/${f}.js`);const n=(src.match(/BLabs(\.\w+|\['[\w-]+'\])=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);}
 assert.match(read('js/visual.js'),/real:'실제 계산',realfic:'실제 금리를 가상 채권에 넣은 값',scenario:'미리 정한 가상 시나리오',model:'교육용 모형, 예측이 아님',metaphor:'시각적 비유'/);
});
test('the representative curve board and the final task carry their labels',()=>{
 const curve=read('js/labs-curve.js'),fin=read('js/labs-final.js');
 assert.match(curve,/교육용 모형, 예측이 아님/);assert.match(curve,/모형과 맞춘 것 아님/);for(const w of ['정상','평평','역전'])assert.match(curve,new RegExp(w));
 assert.match(fin,/200만 원씩 · 계산 편의, 권유 아님/);
 assert.match(read('js/labs-price.js'),/realfic/);assert.match(read('js/visual.js'),/할증 채권[^']*'[^']*할인 채권|할인 채권/);
});
test('every reading ends by answering its L2 question with the report numbers',()=>{
 const want={'who-pays':['23.58%','4.325%'],ladder:['3.346%','3.513%','0.17%p','3.950%'],cashflow:['1,500원'],price:['10,837.64원'],sensitivity:['−20.88%','−23.99%','−20.55%'],'curve-board':['4.4375%','4.4500%','0.0125%p'],spread:['9,477.20원','5.00%'],gordon:['66.67','100.00','+50.0%','33.3'],routes:['−1.88%','−0.96%'],'final-table':['+2.98%','−1.86%p','+3.91%']};
 for(const [id,list] of Object.entries(want)){const last=G[id][2].split(/(?<=다\.)\s/).pop();for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);}
});
