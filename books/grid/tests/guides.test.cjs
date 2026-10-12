const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['ladder','cellpl','spacing','range','box','rally','slide','gap','ledger','capital','compare','exit','final6m'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.GGuides.guides;
const labSrc=['labs-lay','labs-walk','labs-read','labs-final'].map(f=>read(`js/${f}.js`)).join('');
test('guides have a purpose, 2–4 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=4,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const key of Object.keys(values))assert.match(labSrc,new RegExp(`['"]${key}['"]`),`${id}:${key}`);});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice',()=>{const app=read('js/app.js');for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],/(사세요|파세요|사라|팔라|매수하세요|매도하세요|추천)/,id);assert.doesNotMatch(labSrc+app,/(사세요|파세요|매수하세요|매도하세요|추천합니다)/);});
test('every reading answers its L2 question with the report numbers',()=>{
 const want={ladder:['매수 4번','매도 2번','19,800원 칸과 19,600원 칸'],cellpl:['정확히 0원','100원'],spacing:['20,900→21,050원','21,650→21,800원','150원'],range:['28.125%'],box:['25번','44,280원'],rally:['59,390원'],slide:['5칸','19,400원','−12,570원'],gap:['세 칸','3,550원','1,550원'],ledger:['2.60%','8.35%'],capital:['352,735원'],compare:['+77,967원','−9,207원','−8,928원','−4,557원'],exit:['−53,263원','3,263원'],final6m:['0개','72번','−7,601원']};
 for(const [id,list] of Object.entries(want))for(const s of list)assert.ok(G[id][2].includes(s),`${id}: ${s}`);
});
