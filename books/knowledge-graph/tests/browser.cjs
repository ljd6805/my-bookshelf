/* 모든 장을 열어 실험의 예제·직접 조작·초기화와 세 화면 폭의 가로 넘침을 확인한다.
   실행: 저장소 루트에서 python3 -m http.server 8000 후 node books/knowledge-graph/tests/browser.cjs */
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.KG_CHROMIUM||undefined});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const out=process.env.KG_OUT||require('node:os').tmpdir(),target=process.env.KG_TARGET||'http://127.0.0.1:8000/books/knowledge-graph';
 await page.goto(target+'/#home');await page.evaluate(()=>document.fonts.ready);
 const read=async lab=>lab.locator('.readout').innerText();
 // 표지 대표 실험: 2걸음은 끊기고 3걸음에서 답이 완성된다.
 await page.locator('#home-graph [data-hops="2"]').click();assert.match(await page.locator('#home-graph .network-result').innerText(),/이어지지 않았습니다/);
 await page.locator('#home-graph [data-hops="3"]').click();assert.match(await page.locator('#home-graph .network-result').innerText(),/1935 화학상/);
 const chapters=await page.evaluate(()=>KGBook.chapters.map(c=>({id:c.id,labs:c.labs})));
 const set=async(inner,key,val)=>inner.locator('#'+key).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},String(val));
 for(const c of chapters){
  await page.goto(target+'/#'+c.id);await page.locator('[data-lab]').first().waitFor();
  assert.equal(await page.locator('.chapter-body > section, .chapter-body > article, .chapter-body > div.note, .chapter-body > nav').count()>=6,true);
  assert.equal(await page.locator('.kg-fig').count(),1,c.id+' figure');
  for(const id of c.labs){
   const lab=page.locator('#lab-'+id),inner=lab.locator('.lab-inner'),r=()=>read(inner);let detail='';
   for(const b of await lab.locator('[data-preset]').all()){await b.click();assert.ok((await r()).length>10);assert.equal(await b.getAttribute('aria-pressed'),'true');}
   await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
   if(id==='triples'){await set(inner,'facts',4);assert.match(await r(),/덩어리 4개/);await set(inner,'facts',6);assert.match(await r(),/덩어리 3개/);assert.match(await r(),/이었습니다/);await set(inner,'facts',0);assert.match(await r(),/점 0개/);detail='islands merge';}
   if(id==='walk'){await set(inner,'hops',2);assert.match(await r(),/1걸음이 모자랍니다/);await set(inner,'hops',3);assert.match(await r(),/3걸음<\/b>|3걸음/);assert.match(await r(),/지금 걸음 수로 닿습니다/);detail='shortest path 3';}
   if(id==='resolve'){await set(inner,'threshold',.7);assert.match(await r(),/섞인 묶음 0개/);assert.match(await r(),/묶음 9개/);await set(inner,'method','id');assert.match(await r(),/묶음 3개/);assert.ok(await inner.locator('#threshold').isDisabled());detail='no threshold perfect, ids exact';}
   if(id==='schema'){await set(inner,'object','paris');assert.match(await r(),/위반/);await set(inner,'mode','rdfs');assert.match(await r(),/파리는 ‘상’이라고/);detail='validate vs rdfs';}
   if(id==='infer'){await set(inner,'rules','all');await set(inner,'rounds',4);assert.match(await r(),/새 사실 <b>12<\/b>|새 사실 12/);assert.match(await r(),/고정점/);await set(inner,'rules','none');assert.match(await r(),/그대로/);detail='fixed point after 12';}
   if(id==='query'){await set(inner,'p2','none');assert.match(await r(),/답 2개/);await set(inner,'p2','spouse');assert.match(await r(),/답 1개/);await set(inner,'reason','yes');assert.match(await r(),/답 2개/);detail='join and reasoning';}
   if(id==='extract'){await set(inner,'cut',.5);assert.match(await r(),/88.9%/);await set(inner,'cut',1);assert.match(await r(),/정의할 수 없습니다/);detail='P/R and undefined precision';}
   if(id==='transe'){await set(inner,'rx',1.5);await set(inner,'ry',1.2);await set(inner,'head','madrid');assert.match(await r(),/스페인<\/b>|스페인/);assert.match(await r(),/1위/);assert.match(await r(),/4\/4/);detail='mean offset generalises';}
   if(id==='graphrag'){await set(inner,'k',12);assert.equal(await inner.locator('.compare .pass').count(),1);await set(inner,'k',11);await set(inner,'ghops',3);await set(inner,'limit','asked');assert.match(await r(),/문맥 11개/);assert.equal(await inner.locator('.compare .pass').count(),1);detail='k=12 vs 3 hops/11 facts';}
   for(const input of await inner.locator('input[type=range]').all()){if(await input.isDisabled())continue;await input.focus();await input.press('Home');await input.press('End');assert.doesNotMatch(await r(),/NaN|undefined|Infinity/);}
   for(const s of await inner.locator('select').all()){for(const v of await s.locator('option').evaluateAll(a=>a.map(x=>x.value)))await s.selectOption(v);assert.doesNotMatch(await r(),/NaN|undefined/);}
   await lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
   results.push({id,detail});console.log('PASS',id,detail);
  }
  await page.locator('[data-answer]').nth(0).click();assert.ok((await page.locator('.quiz-feedback').innerText()).length>5);
 }
 for(const w of [1280,390,320]){await page.setViewportSize({width:w,height:860});for(const h of ['home',...chapters.map(c=>c.id)]){await page.goto(target+'/#'+h);await page.waitForTimeout(80);const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=0,`${h} overflows by ${over}px at ${w}`);assert.ok(await page.locator('header .shelf-return').isVisible(),'shelf return '+w);}
  await page.goto(target+'/#graphrag');await page.screenshot({path:`${out}/kg-graphrag-${w}.png`,fullPage:false});await page.goto(target+'/#home');await page.screenshot({path:`${out}/kg-home-${w}.png`});console.log('PASS width',w);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(target+'/#reasoning');const anim=await page.locator('.kg-fig-edge').first().evaluate(e=>getComputedStyle(e).animationName);assert.equal(anim,'none');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/kg-browser-results.json',JSON.stringify({results,errors},null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1);});
