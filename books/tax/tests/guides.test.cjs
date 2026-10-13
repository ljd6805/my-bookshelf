const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const IDS=['map','trade','dividend','gains','threshold','etf','isa','pension','order','final'];
const LABS=['tax-map','stt','withhold','gains','threshold','etf-tax','isa','pension','after-tax','final-order'],FILES=['labs-events','labs-gains','labs-accounts','labs-calc','labs-final'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.TGuides.guides;
const labSrc=FILES.map(f=>read(`js/${f}.js`)).join('');
/* 권유·예측 말투: 상품이나 계좌를 고르라고 하거나 낫다고 하는 말. "~해 보세요"(실험 조작 안내)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리합니다|유리한|유리해|가입하세요|넣으세요|드세요|사세요|파세요|옮기세요|사 두세요|오를 것|내릴 것)/;
/* docs/index.html #chapters 표의 L1·L2 칸. 표가 원본이고 content.js recall과 app.js info[lab][2]가 같은 문장을 쓴다. */
const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">(.*?)<\/tr>?(?=\n)/g)].map(m=>[m[1],m[2]]));
const cell=(id,k)=>{const m=rows[id]&&rows[id].match(k==='L1'?/<b>L1<\/b> (.*?)<br><b>L2<\/b>/:/<b>L2<\/b> (.*?)<\/td>/);return m&&m[1];};
const key=id=>/-/.test(id)?`'${id}'`:id,esc=s=>s.replace(/[-]/g,'\\-');
const L2=id=>read('js/app.js').match(new RegExp(`(?:^|[{,\\s])${esc(key(id))}:\\['[^']+','[^']+','([^']+)'`,'m'))?.[1];
test('guides have a purpose, 2–5 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=5,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const k of Object.keys(values))assert.match(labSrc,new RegExp(`['"]${k}['"]`),`${id}:${k}`);});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice',()=>{
 const app=read('js/app.js'),content=read('js/content.js');for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);
 for(const [name,src] of [['labs',labSrc],['app',app],['home-lab',read('js/home-lab.js')],['figures',read('js/figures.js')],['content',content],['review',read('review.json')]])assert.doesNotMatch(src,ADVICE,name);
});
test('every lab result says what it was computed on and carries the check date',()=>{
 for(const f of FILES){const src=read(`js/${f}.js`);const n=(src.match(/TLabs(\.\w+|\['[\w-]+'\])=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);assert.match(src,/RATE_NOTE|kind\(\[[^\]]*'news'/,f);}
 assert.match(read('js/visual.js'),/real:'실제 계산',news:'세율·한도는 2026-10-13 보도 기준',scenario:'미리 정한 가상 시나리오',unknown:'확인 못함 · 가정으로만 계산',metaphor:'시각적 비유'/);
});
test('the representative calculator and the final task carry their labels',()=>{
 const calc=read('js/labs-calc.js'),fin=read('js/labs-final.js');
 assert.match(calc,/RATE_NOTE/);assert.match(calc,/LAW_NOTE/);assert.match(calc,/살 수 없습니다\(보도 기준\)/);assert.match(calc,/확인 못함/);
 assert.match(fin,/하린의 조건에서 계산한 배분안이며, 독자에게 권하는 배분이 아닙니다/);assert.match(fin,/3년 뒤 손에 쥐는 금액 아님/);
});
test('chapter recall equals the L1 cell of the design table',()=>{
 const c={window:{}};vm.runInNewContext(read('js/content.js'),c);
 for(const ch of c.window.TBook.chapters){const l1=cell(ch.id,'L1');assert.ok(l1,`${ch.id}: no L1 cell`);assert.equal(ch.recall,l1,ch.id);}
});
test('app.js info[lab][2] equals the L2 cell of the design table',()=>{IDS.forEach((id,i)=>{const l2=cell(id,'L2');assert.ok(l2,`${id}: no L2 cell`);assert.equal(L2(LABS[i]),l2,LABS[i]);});});
test('every reading ends by answering its L2 question with the computed numbers',()=>{
 const want={'tax-map':['3,080원','15,400원','18,480원'],stt:['120,000원'],withhold:['4,800,000원'],gains:['44만 원','5월'],threshold:['693,000원'],'etf-tax':['1,232,000원','1,210,000원'],isa:['2,772,960원','76,523원','350,512원'],pension:['792,000원','990,000원','−198,000원'],'after-tax':['46,200원','142,345원'],'final-order':['1,240,200원','600,000원','1,203,240원']};
 for(const [id,list] of Object.entries(want)){const last=G[id][2].split(/(?<=다\.)\s/).pop();for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);}
});
