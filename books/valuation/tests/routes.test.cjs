/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.VBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['price','per','dividend','ev','fcf','wacc','terminal','sensitivity','implied','final'],LABS=['price-basics','multiple-compare','dividend-yield','ev-bridge','fcff-forecast','wacc-build','terminal-steps','dcf-sensitivity','implied-assumption','analyst-gap'];
const LAB_FILES=['labs-multiples','labs-dcf','labs-sensitivity','labs-final'],VERSION='20261014-a9';
const esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{VMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.VFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.VGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`VLabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
  assert.match(app,new RegExp(`(^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','[^']+','[^']+'\\]`,'m'),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*'${esc(id)}':`),id);
 }
 assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());
});
test('every function in the book scripts stays under 100 lines',()=>{
 for(const f of ['app','visual','figures','home-lab','lab-guides',...LAB_FILES]){
  const lines=read(`js/${f}.js`).split('\n');let depth=0,start=null;
  lines.forEach((line,i)=>{const opens=(line.match(/\{/g)||[]).length,closes=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth<=2)start=[i,depth];depth+=opens-closes;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`${f}.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
 }
});
test('every chapter has a figure without broken numbers',()=>{const G=figures();for(const id of IDS){const f=G.render(id);assert.ok(f&&f.svg.startsWith('<svg')&&f.caption.length>20,id);assert.doesNotMatch(f.svg+f.caption,/NaN|undefined|Infinity/,id);}});
test('figures carry the numbers the prose uses, and never an L2 answer',()=>{
 const G=figures(),want={price:['2,000억 원','1,648원','9,008원','4,000원','330원'],per:['12.14배','2.22배','18.3%','19,776원','17,971원'],dividend:['2.0%','24.3%','9.14%','13.9%'],ev:['2,114억 원','2,387.2억 원','8.59배','16,978원','19,776원'],fcf:['84억 원','−225.2억 원','196.8억 원','595.1억 원'],wacc:['9.3%','4.05%','81.6%','8.335%','2026-10-08'],terminal:['194억 원','3,079.6억 원','2,067.1억 원','77.6%','2,662.2억 원','22,750원'],sensitivity:['18,971원','27,968원','20,095원','25,404원'],implied:['0.25%','9.0%'],final:['15,867원','+2,758원','+4,381원','+3,533원','+5,294원','31,833원','15,966원']};
 for(const [id,list] of Object.entries(want))for(const s of list)assert.ok(G.render(id).caption.includes(s),`${id}: ${s} in ${G.render(id).caption}`);
 const all=IDS.map(id=>G.render(id).svg+G.render(id).caption).join(' ');
 for(const l2 of ['24,336','19,246','3,379','10.77%','8.98%','1,666.7','1,083.2','46.3억','6.67배','9.67배','7.12%','7.4%'])assert.ok(!all.includes(l2),'figure shows an L2 answer '+l2);
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);assert.equal(c.flow.length,4,c.id);for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(q[2]>=0&&q[2]<3,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],[VERSION]);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
 assert.match(html,/<title>기업 가치 평가 · 배수 비교와 현금흐름 할인으로 주당 가치의 범위 계산하기<\/title>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('links point to existing books and routes; no link to books/allocation or any folder without a book',()=>{
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);}
 for(const f of ['index.html','js/app.js',...LAB_FILES.map(f=>`js/${f}.js`),'js/lab-guides.js','js/figures.js','js/home-lab.js','js/visual.js']){
  const src=read(f);assert.doesNotMatch(src,/allocation|psychology/,f);
  for(const [,dir,anchor] of src.matchAll(/href="\.\.\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?"/g)){const idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),f+': '+dir);if(anchor){const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);assert.ok(r&&r[1].split(',').includes(anchor),f+': '+dir+'#'+anchor);}}
 }
});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('vl-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('vl-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('vl-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration, and both carry the book numbers',()=>{
 const M=require('../js/math.js'),d=M.dcf(),lo=M.dcf({r:0.07}),hi=M.dcf({r:0.09});
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 const n1=x=>M.r1(x).toLocaleString('en-US',{minimumFractionDigits:1}),w=x=>Math.round(x).toLocaleString('en-US');
 for(const s of [n1(d.firm),n1(d.netDebt),n1(d.equity),n1(d.tv)])assert.ok(cover.includes(s),'cover '+s);
 for(const s of [`${w(lo.perShare)}원`,`${w(hi.perShare)}원`,`${w(d.perShare)}원`,'할인율 7%','할인율 9%'])assert.ok(shelf.includes(s),'shelf '+s);
 assert.doesNotMatch(cover,/vl-/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|추천|권합니다|유리|피하세요)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('K7: lab titles say what the reader computes; chapter 8 lab is the DCF 민감도 표; chapter 10 never starts with the discount rate by default',()=>{
 const app=read('js/app.js'),titles=LABS.map(id=>app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1]);
 for(const t of titles){assert.match(t,/(계산|견주|나누|만들|풀|확인|해 보기)/,t);assert.doesNotMatch(t,/(판|함정|뼈대|어디서 오나)(?![가-힣])/,t);}
 assert.match(titles[7],/^DCF 민감도 표/);
 const M=require('../js/math.js');assert.notEqual(M.ASSUME.gapOrder[0],'r');assert.match(read('js/labs-final.js'),/A\.gapOrder\[i-1\]/);
});
