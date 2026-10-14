/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   색 토큰(테마마다 --accent 한 번), 권유 표현 금지와 고정 문장, 그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.ABook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['diversify','matrix','pair','frontier','beta','mix','rebalance','kelly','crisis','final'],LABS=['stock-count','covariance-matrix','two-asset-curve','efficient-frontier','beta-estimate','target-mix','rebalance-rules','kelly-growth','crisis-correlation','plan-conditions'];
const LAB_FILES=['labs-risk','labs-frontier','labs-account','labs-stress','labs-final'],VERSION='20261014-a10';
const UI_FILES=['index.html','js/app.js','js/visual.js','js/figures.js','js/home-lab.js','js/lab-guides.js',...LAB_FILES.map(f=>`js/${f}.js`)];
const ADVICE=/(최적 비중|정답 비중|안전한 비중|추천|권합니다|권해 드|유리|사세요|파세요|사라|팔라|매수|(?<!공)매도|사 두세요|오를 것|내릴 것|반드시 오른|반드시 내린|싸다|비싸다|저평가|고평가)/;
const esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{AMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.AFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{},AMath:require('../js/math.js')};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.AGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`ALabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
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
 for(const s of ['15.81%','14.14%','0.0100','11.18%','8.94%','0.714','44.26%','56.52%','0.175','18.86%','−20.40%','−6,120만','10.00%','13.20%','10.80%','25.00%','59.42%','16.46%','−31.05%'])assert.ok(!all.includes(s),'figure shows '+s);
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);for(const q of [c.quiz,c.transfer]){assert.ok(q[1].length>=3&&q[1].length<=4,c.id);assert.ok(q[2]>=0&&q[2]<q[1].length,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],[VERSION]);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
 assert.match(html,/<title>자산배분 · 상관으로 포트폴리오 위험을 계산하고 조건에 맞는 비중 찾기<\/title>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('links point to existing books and routes; no link to grid or an unpublished folder; the last chapter leads to vol 10 #frame',()=>{
 assert.match(read('js/app.js'),/<a href="\.\.\/psychology\/#frame">다음 권 · 행동재무학 01 · /,'last chapter next link');
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);}
 for(const f of UI_FILES){
  const src=read(f);assert.doesNotMatch(src,/\.\.\/(grid|behavior)\b/,f);
  for(const [,dir,anchor] of src.matchAll(/href="\.\.\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?"/g)){const idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),f+': '+dir);if(anchor){const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);assert.ok(r&&r[1].split(',').includes(anchor),f+': '+dir+'#'+anchor);}}
 }
});
test('CSS defines the amber tokens once: --accent exactly once in :root and once in [data-theme=light]',()=>{
 const css=read('css/style.css').replace(/\/\*[\s\S]*?\*\//g,''),blocks=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/--accent:/.test(m[2])).map(m=>m[1].trim());
 assert.deepEqual(blocks,[':root','[data-theme=light]']);assert.equal((css.match(/--accent:/g)||[]).length,2);
 for(const k of ['--bg','--panel','--text','--muted','--line','--orange','--blue'])assert.equal((css.match(new RegExp(k+':','g'))||[]).length,2,k);
});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 for(const [,x] of cover.matchAll(/\sx="([\d.]+)"/g))assert.ok(+x>=14&&+x<=306,'cover x '+x);
 for(const [,y] of cover.matchAll(/\sy="([\d.]+)"/g))assert.ok(+y>=14&&+y<=136,'cover y '+y);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('al-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('al-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('al-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration, and both carry the book numbers',()=>{
 const M=require('../js/math.js'),A=M.ASSETS,cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg');
 const words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').replace(/<title[\s\S]*?<\/title>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 assert.deepEqual([...words(cover)].filter(w=>words(shelf).has(w)),[],'no shared captions');
 assert.match(cover,/표준편차 18%, 기대수익 7%/);assert.match(cover,/\(6%, 3\.5%\)/);for(const t of ['ρ +1','ρ −0.2','ρ −1'])assert.ok(cover.includes(t),t);
 const mix=M.twoAsset(0.6,M.asset(1),M.asset(3),A.corr[1][3]).sigma;
 for(const t of [`σ ${A.sigma[1]*100}%`,`σ ${A.sigma[3]*100}%`,`σ ${(mix*100).toFixed(2)}%`,'상관 −0.2'])assert.ok(shelf.includes(t),'shelf '+t);
 assert.doesNotMatch(cover,/al-/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,ADVICE,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('K7: lab titles name what the reader does; no metaphor props',()=>{
 const app=read('js/app.js'),titles=LABS.map(id=>app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1]);
 for(const t of [...titles,...B.chapters.map(c=>c.title)])assert.doesNotMatch(t,/(길|지도|엔진|온도계|저울|울타리|지갑)(?![가-힣])/,t);
 for(const t of titles)assert.match(t,/(계산|견주|찾기|확인|판정|구하|추정)/,t);
 assert.match(titles[7],/계산 연습/);
});
test('the UI never advises a weight or a trade, and carries the fixed sentences',()=>{
 const all=UI_FILES.map(read).join('\n'),vis=read('js/visual.js'),stress=read('js/labs-stress.js'),fin=read('js/labs-final.js');
 const lines=all.split('\n').filter(l=>ADVICE.test(l.replace(/풀이 예시 안 B는 [^.]*정답이 아닙니다/g,'')));assert.deepEqual(lines.map(l=>l.match(ADVICE)[0]),[]);
 const M=require('../js/math.js');
 assert.match(vis,/M\.ASSETS\.label|A\.label/);assert.match(vis,/M\.ASSETS\.weightsNote|A\.weightsNote/);assert.match(vis,/M\.MARKET\.recheck/);
 assert.ok(M.ASSETS.label.includes('예측 아님')&&M.MARKET.recheck.includes('확인일을 보고 다시 확인하세요'));
 assert.match(vis,/가상의 인물과 가정으로 만든 계산 연습이며, 실제 계좌의 비중을 권하지 않습니다/);
 assert.match(vis,/돈을 빌려 이 비율을 채우는 계산을 하지 않는다/);assert.match(stress,/U\.KELLY/);
 assert.match(stress,/하위 10%/);assert.match(stress,/절반 아래/);
 assert.match(fin,/timed\('pensionLimit'\)/);assert.match(fin,/적격 TDF, 보도 기준/);assert.match(M.MARKET.pensionLimit.label,/보도 기준 · 법령 원문 확인 못함/);
});
