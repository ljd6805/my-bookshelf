/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수와 IIFE 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   색 토큰(테마마다 --accent 한 번), 권유 표현·증권사 이름·키 칸이 없음과 고정 문장, 저장소를 쓰지 않음, 기본값과 비교 예제가 L2·확인 답을 보이지 않음(누설 막이),
   그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html'),M=require('../js/math.js');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.BBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['backtest','data','lookahead','fills','metrics','overfit','api','orders','limits','monitor','final'];
const LABS=['grid-run','assume-data','assume-code','assume-fills','sharpe-boot','is-oos','mock-api','order-recon','stop-rules','fill-match','loss-audit'];
const SAME='백테스트 가정 하나씩 바꾸기 실험';
const NAMES=['격자 규칙 백테스트 실행 실험',SAME,SAME,SAME,'샤프·최대 낙폭·부트스트랩 구간 실험','표본 안 1등의 표본 밖 성적 실험','모의 주문 요청·응답 실험','주문 상태와 잔고 대사 실험','봇 멈춤 조건 시험 실험','모의 서버·백테스트 체결 차이 기록 실험','격자 봇 손실 원인 조사 실험'];
const LAB_FILES=['labs-backtest','labs-stats','labs-orders','labs-ops','labs-final'],VERSION='20261025-flow1';
const UI_FILES=['index.html','js/app.js','js/visual.js','js/figures.js','js/home-lab.js','js/lab-guides.js',...LAB_FILES.map(f=>`js/${f}.js`)];
const ADVICE=/(사세요|파세요|수익 보장|이기는 전략|검증된 전략|최적 설정|오를 것|내릴 것|추천합니다|권합니다|권해 드|매수하세요|매도하세요|맡기세요)/;
const BROKERS=/(키움|미래에셋|삼성증권|한국투자|NH투자|KB증권|신한투자|대신증권|토스증권|하나증권|kiwoom|koreainvestment|KIS Developers)/i;
const esc=s=>s.replace(/[-]/g,'\\-');
const guides=()=>{const ctx={window:{BMath:M},BMath:M};vm.runInNewContext(read('js/lab-guides.js'),ctx);return ctx.window.BGuides.guides;};
/* 각 장의 예측 질문(L2) 답과 확인 문제 답. 장 그림, 비교 예제, 서가 삽화에 나오면 안 된다. 마지막 과제는 풀이 칸의 원인별 금액도 막는다. */
const ANSWERS={backtest:['4,895','10.00%'],data:['49.75','0.50%','15.6%'],lookahead:['32,000'],fills:['771','736','696'],metrics:['0.293','1.014','6.60'],overfit:['20%p','2.302','6.83','82위'],
 api:['9초째','720번'],orders:['75,011'],limits:['아홉 번째','75,000'],monitor:['−400','75%','+325','−2,116'],final:['527,250','8,620','7,178','17,326','311,726']};

test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('eleven chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,11);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const G=guides(),labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`BLabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
  assert.match(app,new RegExp(`(^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','[^']+','[^']+'\\]`,'m'),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*'${esc(id)}':`),id);
 }
 assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());
});
test('lab titles start with the lab names fixed at G2 (nine names, 2–4장 share one), and the body calls each lab by that name',()=>{
 const app=read('js/app.js'),content=read('js/content.js');assert.equal(new Set(NAMES).size,9);assert.match(app,new RegExp(`const SAME='${SAME}'`));
 LABS.forEach((id,i)=>{const t=app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1];assert.ok(t.startsWith(NAMES[i]+': '),t);
  assert.ok(new RegExp(`'${esc(id)}':(SAME|'${NAMES[i]}')`).test(app),id+' alias');assert.ok(content.includes(NAMES[i]),NAMES[i]);});
});
test('every function and IIFE in the book scripts stays under 100 lines',()=>{
 for(const f of ['app','visual','figures','home-lab','lab-guides',...LAB_FILES]){
  const lines=read(`js/${f}.js`).split('\n');let depth=0,start=null;
  lines.forEach((line,i)=>{const opens=(line.match(/\{/g)||[]).length,closes=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{|\(\(\)=>\{)/.test(line)&&depth<=2)start=[i,depth];depth+=opens-closes;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`${f}.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
  const iife=[];lines.forEach((l,i)=>{if(/^(window\.\w+=)?\(\(\)=>\{|^\(function\s*\(/.test(l))iife.push(i);});
  for(const s of iife){let d=0,end=null;for(let i=s;i<lines.length;i++){d+=(lines[i].match(/\{/g)||[]).length-(lines[i].match(/\}/g)||[]).length;if(d<=0&&i>s){end=i;break;}}assert.ok(end!==null&&end-s+1<=100,`${f}.js:${s+1} IIFE ${end===null?'?':end-s+1} lines`);}
 }
});
test('every chapter has a figure without broken numbers',()=>{const F=require('../js/figures.js');for(const id of IDS){const f=F.render(id);assert.ok(f&&f.svg.startsWith('<svg')&&f.caption.length>20,id);assert.doesNotMatch(f.svg+f.caption,/NaN|undefined|Infinity/,id);}});
test('figures never draw their chapter’s L2 answer, quiz answer, the ch6 out-of-sample result or the final cause amounts',()=>{
 const F=require('../js/figures.js');for(const id of IDS){const f=F.render(id),all=f.svg+' '+f.caption;for(const s of ANSWERS[id])assert.ok(!all.includes(s),id+' figure shows '+s);}
});
test('guide presets never land on an L2 or quiz answer of their chapter (leak guard)',()=>{
 const G=guides();
 for(const [id,[,presets]] of Object.entries(G))for(const [,o] of presets){
  if(id==='grid-run')assert.ok(!(+o.cb===35000&&+o.cs===35500),'grid-run preset is the L2 cell');
  if(id==='assume-fills')assert.ok(!(+o.fb===19800&&+o.fs===20000),'assume-fills preset is the L2 bar');
  if(id==='is-oos')assert.notEqual(String(o.en),'1000','is-oos preset shows E[max] for 1,000 (확인 답)');
  if(id==='order-recon')assert.ok(!(+o.op===18750),'order-recon preset is the L2 order');
  if(id==='stop-rules')assert.ok(!/B10/.test(o.kt||''),'stop-rules preset is the L2 log');
 }
 for(const [id,list] of Object.entries(ANSWERS)){const lab=B.chapters.find(c=>c.id===id).labs[0];const [purpose,presets]=G[lab];assert.ok(!list.some(s=>(purpose+JSON.stringify(presets)).includes(s)),lab+' preset text shows an answer');}
});
test('lab defaults in the source are not the L2 or quiz inputs',()=>{
 const bt=read('js/labs-backtest.js'),or=read('js/labs-orders.js'),st=read('js/labs-stats.js'),ops=read('js/labs-ops.js');
 assert.doesNotMatch(bt,/'35,100, 34,900, 35,600, 35,300'/,'grid-run default is the L2 record');assert.doesNotMatch(bt,/U\.number\('fb','[^']*',1,1000000,1,19800\)/,'fills default is the L2 bar');assert.doesNotMatch(bt,/U\.number\('cb','[^']*',1,1000000,1,35000\)/,'grid-run default is the L2 cell');
 assert.doesNotMatch(st,/'2, −1, 3, 0, 1, −2'|'\+2, −1, \+3, 0, \+1, −2'/,'metrics default is the L2 returns');assert.doesNotMatch(st,/'18, 15, 12, 9, 6'/,'overfit default is the L2 ranks');
 assert.doesNotMatch(or,/U\.number\('op','[^']*',[^)]*,18750\)/,'orders default is the L2 order');assert.doesNotMatch(ops,/'B2, B3, B4, B5, B6, B7, B8, B9, B10'/,'limits default is the L2 log');
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);for(const q of [c.quiz,c.transfer]){assert.ok(q[1].length>=3&&q[1].length<=4,c.id);assert.ok(q[2]>=0&&q[2]<q[1].length,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],[VERSION]);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
 assert.match(html,/<title>백테스트와 자동 매매 · [^<]+<\/title>/);
});
test('script load order: data → math → content → visual → figures → labs → home → guides → app → flow-live',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['data','math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app','flow-live']);});
test('links point to existing books and routes; no link to this book',()=>{
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);}
 for(const f of UI_FILES){
  const src=read(f);assert.doesNotMatch(src,/\.\.\/backtest\b/,f);
  for(const [,dir,anchor] of src.matchAll(/href="\.\.\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?"/g)){const idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),f+': '+dir);if(anchor){const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);assert.ok(r&&r[1].split(',').includes(anchor),f+': '+dir+'#'+anchor);}}
 }
 assert.match(read('js/app.js'),/13권이자 마지막 권/);
});
test('CSS defines the aqua tokens once per theme and uses only font tokens',()=>{
 const css=read('css/style.css').replace(/\/\*[\s\S]*?\*\//g,''),blocks=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/--accent:/.test(m[2])).map(m=>m[1].trim());
 assert.deepEqual(blocks,[':root','[data-theme=light]']);assert.equal((css.match(/--accent:/g)||[]).length,2);
 for(const k of ['--bg','--panel','--text','--muted','--line','--orange','--blue','--chart'])assert.equal((css.match(new RegExp(k+':','g'))||[]).length,2,k);
 for(const [,v] of css.matchAll(/font-family:([^;}]+)/g))assert.match(v.trim(),/^(var\(--font-(sans|serif|mono)\)|inherit)$/,v);
 assert.match(css,/--accent:#6fd6d0/);assert.match(css,/--accent:#0e6b68/);
 const psy=fs.readFileSync(path.join(base,'..','psychology','css','style.css'),'utf8').match(/\[data-theme=light\]\{([^}]*)\}/)[1];assert.ok(!css.includes(psy),'tokens are not copied from another book');
});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 for(const [,x] of cover.matchAll(/\sx="([\d.]+)"/g))assert.ok(+x>=14&&+x<=306,'cover x '+x);
 for(const [,y] of cover.matchAll(/\sy="([\d.]+)"/g))assert.ok(+y>=14&&+y<=136,'cover y '+y);
 assert.match(shelf,/viewBox="0 0 340 180"/);assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('bt-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('bt-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('bt-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration; the cover bars are the computed waterfall; neither shows an answer',()=>{
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg');
 const words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').replace(/<title[\s\S]*?<\/title>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 assert.deepEqual([...words(cover)].filter(w=>words(shelf).has(w)),[],'no shared captions');
 for(const s of M.waterfall().filter(x=>x.key!=='A0'))assert.ok(words(cover).has((s.ann*100).toFixed(2)),'cover bar '+s.key);
 for(const list of Object.values(ANSWERS))for(const s of list)assert.ok(!cover.includes(s)&&!shelf.includes(s),'art shows an answer: '+s);
 assert.doesNotMatch(cover,/bt-/);
 /* 손으로 고른 ANSWERS만으로는 '4주'·'5위'·'15주' 같은 짧은 답이 빠지므로, docs #chapters의 L2 괄호 속 답에서 숫자(단위 포함)를 뽑아 두 삽화의 글자와 견준다. */
 const NUM=/[−+-]?\d[\d,]*(?:\.\d+)?(?:%p|%|원|주|위|번|초째|초)?/g,doc=read('docs/index.html');
 const l2=[...doc.matchAll(/<b>L2<\/b> (.*?)<\/td>/g)].map(m=>m[1].slice(m[1].lastIndexOf('? (')+2)).join(' ');
 const answerNums=new Set([...l2.matchAll(NUM)].map(m=>m[0].replace(/^[+-]/,'').replace('−','')).filter(t=>/\D$|\./.test(t)));
 assert.ok(answerNums.has('4주')&&answerNums.has('5위')&&answerNums.has('527,250원'),'L2 answers parsed from docs');
 for(const [name,svg] of [['cover',cover],['shelf',shelf]])for(const w of words(svg))for(const [t] of w.matchAll(NUM)){const k=t.replace(/^[+−-]/,'');assert.ok(!answerNums.has(k),`${name} art shows an L2 answer number: ${k}`);}
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
 for(const t of [...titles,...B.chapters.map(c=>c.title)])assert.doesNotMatch(t,/(거울|저울|함정|덫|울타리|지갑|단추|일생|미리 본)/,t);
 for(const t of titles)assert.match(t.split(': ')[1],/(계산|견주|찾기|확인|구하|기록|정하|대사)/,t);
});
test('the UI never advises a trade or names a broker, asks for no real key, and carries the fixed sentences',()=>{
 const all=UI_FILES.map(read).join('\n');
 const lines=all.split('\n').filter(l=>ADVICE.test(l));assert.deepEqual(lines.map(l=>l.match(ADVICE)[0]),[]);assert.doesNotMatch(all,BROKERS);
 assert.doesNotMatch(all,/type="password"|<input[^>]*(app.?key|secret|token)/i,'no key input');
 const vis=read('js/visual.js'),bt=read('js/labs-backtest.js'),or=read('js/labs-orders.js'),fin=read('js/labs-final.js'),app=read('js/app.js');
 assert.match(vis,/M\.TEXT\.disclaimer/);assert.match(bt,/M\.TEXT\.notExpected/);assert.match(bt,/timed\('tradeTax'\)/);assert.match(bt,/timed\('fee'\)/);assert.match(bt,/U\.RECHECK/);
 assert.match(or,/M\.TEXT\.mockOnly/);assert.match(or,/M\.TEXT\.brokerDocs/);assert.match(or,/가상 키\(읽기 전용\)/);
 assert.match(fin,/M\.TEXT\.window60/);assert.match(fin,/M\.TEXT\.noVerdict/);assert.match(fin,/U\.DISCLAIMER/);assert.match(fin,/timed\('tradeTax'\)/);assert.match(fin,/U\.RECHECK/);
 assert.match(app,/M\.TEXT\.noAuto/);assert.match(app,/M\.TEXT\.mockOnly/);
});
test('no lab writes to storage',()=>{for(const f of UI_FILES)assert.doesNotMatch(read(f),/localStorage|sessionStorage|indexedDB|document\.cookie/,f);});
