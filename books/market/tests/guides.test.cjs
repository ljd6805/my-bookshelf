const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['claims','venue','sweep','queue','auction','tick','vi','rights','settle','roundtrip','gridstep','hours','scam','diagnose'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.MGuides.guides;
const labSrc=['labs-orders','labs-rules','labs-after'].map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
test('every lab has a title row in app.js, a guide and a renderer',()=>{for(const id of LABS){assert.match(app,new RegExp(`\\b${id}:\\[`),id);assert.ok(G[id],id);assert.match(labSrc,new RegExp(`MLabs\\.${id}=`),id);}assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());});
test('guides have a purpose, 2–3 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=4,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const key of Object.keys(values))assert.match(labSrc,new RegExp(`['"]${key}['"]`),`${id}:${key}`);});
test('content.js uses exactly these lab ids',{skip:fs.existsSync(path.join(base,'js/content.js'))?false:'js/content.js 없음'},()=>{const c={window:{}};vm.runInNewContext(read('js/content.js'),c);assert.deepEqual([...c.window.MBook.chapters.flatMap(x=>x.labs)].sort(),[...LABS].sort());});
