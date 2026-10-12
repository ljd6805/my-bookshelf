const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['returns','reset','ruler','coin','tails','acf','vratio','crossing','underwater','records'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.VGuides.guides;
const labSrc=['labs-returns','labs-model','labs-path','labs-final'].map(f=>read(`js/${f}.js`)).join('');
const ADVICE=/(사세요|파세요|사라|팔라|매수하세요|매도하세요|추천|권합니다|오를 것|내릴 것|오를 겁니다|내릴 겁니다)/;
test('guides have a purpose, 2–4 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=4,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const key of Object.keys(values))assert.match(labSrc,new RegExp(`['"]${key}['"]`),`${id}:${key}`);});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice or forecasts',()=>{const app=read('js/app.js');for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);assert.doesNotMatch(labSrc+app+read('js/home-lab.js'),ADVICE);});
test('every lab result says what it was computed on (real / scenario / generator / metaphor)',()=>{for(const f of ['labs-returns','labs-model','labs-path','labs-final']){const src=read(`js/${f}.js`);const n=(src.match(/VLabs\.\w+=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);}assert.match(read('js/visual.js'),/real:'실제 계산',scenario:'미리 정한 가상 경로',gen:'생성기[^']*',metaphor:'시각적 비유'/);});
test('Monte Carlo labs cap the number of paths',()=>{for(const [,n] of labSrc.matchAll(/\['(\d+)','[\d,]+개'\]/g))assert.ok(+n<=4000,n);assert.doesNotMatch(labSrc,/monteCarlo\([^)]*,\s*(\d{5,})/);});
test('every reading ends by answering its L2 question with the report numbers',()=>{
 const want={returns:['+2.5%','0%'],reset:['−14.15%'],ruler:['675.5원','842.4원','+167원','+60원'],coin:['41개'],tails:['0.39%'],acf:['−0.036','8.7%'],vratio:['8.1%','0.911'],crossing:['8.9회','그대로'],underwater:['−29.7%'],records:['88.29']};
 for(const [id,list] of Object.entries(want)){const last=G[id][2].split(/(?<=다\.)\s/).pop();for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);}
});
