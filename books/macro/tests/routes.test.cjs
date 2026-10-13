/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.MBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['gdp','prices','cycle','policy','fiscal','fx','trade','leading','crisis','final'],LABS=['gdp-expenditure','cpi-basket','labor-gap','policy-model','fiscal-mix','fx-won-amount','current-account','lag-correlation','crisis-timeline','release-hypotheses'];
const LAB_FILES=['labs-measure','labs-model','labs-external','labs-signals','labs-final'],VERSION='20261013v1';
const esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{MMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.MFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.MGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`MLabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
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
test('figures never draw an L2 answer or a quiz answer',()=>{
 const G=figures(),all=IDS.map(id=>G.render(id).svg+' '+G.render(id).caption).join(' ');
 for(const s of ['500조','2.86%','3.06%','+0.33%','+0.14%p','+1.01%','+0.22%p','6억 8,250만','+25억','r = 1.00','−11.5%','+0.97%p','+0.10%p','250조','−54.1%'])assert.ok(!all.includes(s),'figure shows '+s);
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);for(const q of [c.quiz,c.transfer]){assert.ok(q[1].length>=3&&q[1].length<=4,c.id);assert.ok(q[2]>=0&&q[2]<q[1].length,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],[VERSION]);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
 assert.match(html,/<title>거시경제 · GDP·물가·고용 지표를 계산하고 발표 뒤 금리·환율·물가의 경로를 가설로 세우기<\/title>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('links point to existing books and routes; no link to vol 9, 10, 12 or 13 folders',()=>{
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);}
 for(const f of ['index.html','js/app.js',...LAB_FILES.map(f=>`js/${f}.js`),'js/lab-guides.js','js/figures.js','js/home-lab.js','js/visual.js']){
  const src=read(f);assert.doesNotMatch(src,/\.\.\/(grid|allocation|psychology)\b/,f);
  for(const [,dir,anchor] of src.matchAll(/href="\.\.\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?"/g)){const idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),f+': '+dir);if(anchor){const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);assert.ok(r&&r[1].split(',').includes(anchor),f+': '+dir+'#'+anchor);}}
 }
});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('ma-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('ma-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('ma-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration, and both carry the book numbers',()=>{
 const M=require('../js/math.js'),s=M.scenario({rate:{size:0.25,start:1,len:4}},{stage:'full',quarters:8});
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 const R=M.ASSUME.release;for(const t of [String(R.actual),`예상 ${R.expected.toFixed(1)}%`,`차이 +${(R.actual-R.expected).toFixed(1)}%p`])assert.ok(cover.includes(t),'cover '+t);
 const d2=v=>(v<0?'−':'+')+Math.abs(v).toFixed(2);
 for(const [k,u] of [['e','%'],['y','%'],['pi','%p']]){const p=M.peak(s[k]);assert.ok(shelf.includes(`${p.q}분기 ${d2(p.value)}${u}`),`shelf ${k} ${p.q} ${d2(p.value)}${u}`);}
 assert.doesNotMatch(cover,/ma-/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|추천|권합니다|유리|피하세요)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('K7: titles name what the reader does; no metaphor props; chapter 4 says 정책 시나리오 모형',()=>{
 const app=read('js/app.js'),titles=LABS.map(id=>app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1]);
 for(const t of [...titles,...B.chapters.map(c=>c.title)]){assert.doesNotMatch(t,/(길|지도|엔진|온도계|저울|울타리)(?![가-힣])/,t);}
 for(const t of titles)assert.match(t,/(계산|견주|나누|찾기|확인|구하|구별)/,t);
 assert.match(B.chapters[3].title,/정책 시나리오 모형|시나리오 모형/);assert.match(titles[3],/정책 시나리오 모형/);
});
test('the final lab writes market prices only as direction hypotheses, and the UI carries the model label and disclaimers',()=>{
 const fin=read('js/labs-final.js'),vis=read('js/visual.js'),all=[...LAB_FILES.map(f=>read(`js/${f}.js`)),read('js/app.js'),read('js/lab-guides.js'),read('js/figures.js'),read('js/home-lab.js')].join('\n');
 assert.match(fin,/방향의 가설/);assert.match(fin,/가격을 계산하지 않음/);assert.match(vis,/MODEL\.label|MD\.label|M\.MODEL\.label/);
 assert.match(vis,/기준금리와 통계는 바뀌므로 확인일을 보고 다시 확인하세요\./);assert.match(vis,/실제 시장 가격의 예측이나 매매 권유가 아닙니다/);
 assert.doesNotMatch(all,/사세요|파세요|오를 것|내릴 것|유리|추천|싸다|비싸다|매수|매도/);
});
