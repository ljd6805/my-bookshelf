/* 실험 안내와 결과 문장 검사: 비교 예제·결과 읽기, 권유 말투 금지, 꼬리표와 규칙의 확인일·등급, 색 외의 상태 글자, 마지막 문장의 L2 답. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const LABS=['accrual-timeline','balance-sheet-tx','income-steps','cfo-bridge','three-statement-link','ratio-table','accrual-alarm','filing-deadline','industry-compare','final-check'],FILES=['labs-basic','labs-income','labs-link','labs-ratios','labs-dart','labs-final'];
const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.SGuides.guides;
const labSrc=FILES.map(f=>read(`js/${f}.js`)).join('');
/* 권유·판정 말투: 주식을 고르라고 하거나 낫다고 하거나 판정하는 말. "~해 보세요"(실험 조작 안내)는 권유가 아니다. */
const ADVICE=/(추천|권합니다|권해 드|유리합니다|유리한|유리해|사세요|파세요|매수하세요|매도하세요|피하세요|사 두세요|오를 것|내릴 것|분식회계)/;
test('guides have a purpose, 2–5 presets and a reading with numbers',()=>{for(const id of LABS){const [purpose,presets,reading]=G[id];assert.ok(purpose.length>10,id);assert.ok(presets.length>=2&&presets.length<=5,id);assert.match(reading,/\d/,id);for(const [name,values] of presets){assert.ok(name,id);assert.ok(Object.keys(values).length>0,id);}}});
/* 번호가 붙은 입력(aa0~4, con1~4 등)은 'aa'+i처럼 만든다. */
test('preset input ids exist in the lab code',()=>{for(const id of LABS)for(const [,values] of G[id][1])for(const k of Object.keys(values)){const stem=k.replace(/\d+$/,'');assert.match(labSrc,stem===k?new RegExp(`['"]${k}['"]`):new RegExp(`['"]${stem}['"]\\+\\(?i`),`${id}:${k}`);}});
test('readings render collapsed in <details> under an echo of the reader guess',()=>{const src=read('js/lab-guides.js');assert.match(src,/<details class="guide-reading"><summary>[\s\S]*<p class="guess-echo" hidden><\/p>/);assert.match(src,/getElementById\('guess-'\+id\)/);});
test('readings and lab text speak in assumptions, never advice',()=>{
 for(const id of LABS)assert.doesNotMatch(G[id][0]+G[id][2],ADVICE,id);
 for(const [name,src] of [['labs',labSrc],['app',read('js/app.js')],['home-lab',read('js/home-lab.js')],['figures',read('js/figures.js')],['visual',read('js/visual.js')]])assert.doesNotMatch(src,ADVICE,name);
});
test('every lab result says what it was computed on, and rule results carry the check date and grade',()=>{
 for(const f of FILES){const src=read(`js/${f}.js`);const n=(src.match(/SLabs\['[\w-]+'\]=/g)||[]).length;assert.ok((src.match(/U\.kind\(/g)||[]).length>=n,f);}
 const v=read('js/visual.js');assert.match(v,/real:'실제 계산',scenario:'미리 정한 가상 시나리오',simple:'이 책의 단순화',official:`한국거래소 안내 원문 · 확인 \$\{M\.CHECKED\}`,guide:`회계법인 안내 기준\(공식 원문·현행 여부 미확인\) · 확인 \$\{M\.CHECKED\}`,unknown:'확인 못함',metaphor:'시각적 비유'/);
 assert.match(read('js/labs-dart.js'),/RULE_NOTE/);assert.match(read('js/labs-dart.js'),/휴일 처리 확인 못함/);assert.match(read('js/labs-dart.js'),/시각적 비유/);
 assert.match(v,/기준과 공시 규칙은 바뀌므로 한국회계기준원·금융감독원·한국거래소의 공식 자료로 다시 확인하세요/);
});
test('status is spelled out in words, not colour alone',()=>{const v=read('js/visual.js');assert.match(v,/✓ 맞음/);assert.match(v,/✗ 어긋남/);assert.match(read('js/labs-ratios.js'),/위험 신호 있음/);assert.match(read('js/labs-ratios.js'),/위험 신호 없음/);assert.match(read('js/labs-final.js'),/위험 신호 있음/);assert.match(read('js/labs-final.js'),/위험 신호 없음/);assert.match(read('js/labs-link.js'),/checkList/);});
test('chapters 7 and 10 say they are not advice, and the final task says 학습용 계산, 투자 권유 아님',()=>{assert.match(read('js/visual.js'),/특정 주식을 사고팔라는 권유가 아닙니다/);assert.match(read('js/labs-ratios.js'),/ADVICE_NOTE/);assert.match(read('js/labs-final.js'),/ADVICE_NOTE/);assert.match(read('js/labs-final.js'),/학습용 계산, 투자 권유 아님/);});
test('every reading ends by answering its L2 question with the computed numbers',()=>{
 const want={'accrual-timeline':['35억 원','30억 원'],'balance-sheet-tx':['1,136억 원','360억 원','776억 원'],'income-steps':['150억 원','10.0%','−16.7%'],'cfo-bridge':['106억 원'],'three-statement-link':['16억 원','66억 원','100억 원','740억 원','1,206억 원','430억 원','776억 원'],'ratio-table':['2.5배','150.0%','80.0%'],'accrual-alarm':['15.0%'],'filing-deadline':['2026-05-15'],'industry-compare':['12회','30.4일'],'final-check':['16.8억 원','148억 원']};
 for(const [id,list] of Object.entries(want)){const last=G[id][2].split(/(?<=다\.|\)\.)\s/).pop();for(const s of list)assert.ok(last.includes(s),`${id}: ${s} in last sentence: ${last}`);}
});
test('L2 answers in the guides equal the answers in the design table',()=>{
 const doc=read('docs/index.html'),IDS=['basics','balance','income','cashflow','link','ratios','quality','dart','industry','final'];
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 const first={'accrual-timeline':'35억 원','balance-sheet-tx':'1,136억 원','income-steps':'150억 원','cfo-bridge':'106억 원','three-statement-link':'66억 원','ratio-table':'2.5배','accrual-alarm':'15.0%','filing-deadline':'2026-05-15','industry-compare':'12회','final-check':'148억 원'};
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],ans=cell.slice(cell.lastIndexOf('? (')+3);assert.ok(ans.includes(first[LABS[i]]),`${ch}: ${ans}`);assert.ok(G[LABS[i]][2].includes(first[LABS[i]]),LABS[i]);});
});
test('L2 cases are not presets: the reader reaches them by changing inputs',()=>{
 const bad={'three-statement-link':v=>v.lcapex===200,'income-steps':v=>v.icogs===72,'filing-deadline':v=>v.dend==='2026-03-31','final-check':v=>v.far===330,'industry-compare':v=>v.ncogs===1800,'cfo-bridge':v=>v.cdar===80};
 for(const [id,f] of Object.entries(bad))for(const [name,v] of G[id][1])assert.ok(!f(v),`${id}: preset ${name} is the L2 case`);
});
test('the three-statement link presets are the five stages, and stage 3 is the forced-borrowing station',()=>{
 const M=require('../js/math.js'),p=G['three-statement-link'][1];assert.equal(p.length,5);
 const v=p[2][1],l=M.linkedYear(M.OPENING,{sales:v.lsales,ar:v.lar,inv:v.linv,ap:v.lap,capex:v.lcapex,dividend:v.ldiv});
 assert.deepEqual([l.cf.cfo,l.cf.cashBeforeBorrow,l.cf.borrow,l.close.cash],[-44,-64,150,86]);assert.ok(l.checks.every(c=>c.ok));
});
