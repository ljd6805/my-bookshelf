const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['index-level','weighting','creation-unit','gap-lab','tracking-cost','rebalance','underlying','etf-tax-type','compare-table','final-gap'],FILES=['labs-index','labs-gap','labs-cost','labs-assets','labs-compare'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.EGuides.guides;
const labSrc=FILES.map(f=>read(`js/${f}.js`)).join('');
/* 권유·예측 말투: 상품을 고르라고 하거나 낫다고 하거나 값의 방향을 점치는 말. "~해 보세요"(실험 조작 안내)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리합니다|유리한|유리해|사세요|파세요|매수하세요|매도하세요|고르세요|사 두세요|오를 것|내릴 것)/;
test('guides have a purpose, 2–5 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=5,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const k of Object.keys(values)){const stem=k.replace(/\d+$/,'');assert.match(labSrc,stem===k?new RegExp(`['"]${k}['"]`):new RegExp(`['"]${stem}['"]\\+i`),`${id}:${k}`);}});
/* 번호가 붙은 입력(im0~2 등)은 'im'+i로 만든다. */
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice',()=>{
 for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);
 for(const [name,src] of [['labs',labSrc],['app',read('js/app.js')],['home-lab',read('js/home-lab.js')],['figures',read('js/figures.js')],['visual',read('js/visual.js')]])assert.doesNotMatch(src,ADVICE,name);
});
test('every lab result says what it was computed on, and rule results carry the check date and grade',()=>{
 for(const f of FILES){const src=read(`js/${f}.js`);const n=(src.match(/ELabs(\.\w+|\['[\w-]+'\])=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);}
 for(const f of ['labs-gap','labs-cost','labs-assets','labs-compare'])assert.match(read(`js/${f}.js`),/RULE_NOTE|'news'|'official'/,f);
 assert.match(read('js/visual.js'),/real:'실제 계산',official:'한국거래소 규정포털 원문 · 확인 2026-10-13',news:'규칙은 2026-10-13 보도·안내 기준\(공식 원문 미확인\)',scenario:'미리 정한 가상 시나리오',unknown:'확인 못함 · 이 책의 단순화',metaphor:'시각적 비유'/);
});
test('status is spelled out in words, not colour alone',()=>{const v=read('js/visual.js'),gap=read('js/labs-gap.js'),home=read('js/home-lab.js');assert.match(v,/프리미엄/);assert.match(v,/디스카운트/);for(const s of [gap,home]){assert.match(s,/LP 호가 의무 있음/);assert.match(s,/LP 호가 의무 면제/);}});
test('the comparison and the final task say they are not advice',()=>{const src=read('js/labs-compare.js');assert.match(src,/ADVICE_NOTE/);assert.match(read('js/visual.js'),/계산 편의, 권유 아님/);assert.match(src,/계산 편의, 권유 아님/);});
test('every reading ends by answering its L2 question with the computed numbers',()=>{
 const want={'index-level':['96.50'],weighting:['−2.50%','−1.00%','−0.67%'],'creation-unit':['540만 좌','1,620억 원','30,000원'],'gap-lab':['+2.25%','2%'],'tracking-cost':['50,779,213원','51,703,147원','923,933원'],rebalance:['105억 원','95억 원','10억 원'],underlying:['12,036원'],'etf-tax-type':['3개'],'compare-table':['22,500원','135,000원'],'final-gap':['+2.50%','406주','4,993,800원','4,872,000원','−121,800원']};
 for(const [id,list] of Object.entries(want)){const last=G[id][2].split(/(?<=다\.)\s/).pop();for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);}
});
test('L2 answers in the guides equal the answers in the design table',()=>{
 const doc=read('docs/index.html'),IDS=['index','weight','creation','nav','cost','leverage','assets','tax','choose','final'];
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 const first={'index-level':'96.50',weighting:'−2.50%','creation-unit':'540만 좌','gap-lab':'+2.25%','tracking-cost':'923,933원',rebalance:'10억 원',underlying:'12,036원','etf-tax-type':'3개','compare-table':'22,500원','final-gap':'−121,800원'};
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],ans=cell.slice(cell.lastIndexOf('? (')+3);assert.ok(ans.includes(first[LABS[i]]),`${ch}: ${ans}`);assert.ok(G[LABS[i]][2].includes(first[LABS[i]]),LABS[i]);});
});
