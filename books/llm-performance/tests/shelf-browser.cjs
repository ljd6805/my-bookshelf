const {chromium}=require('playwright');const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SHELF_URL||'http://127.0.0.1:8765/';
const out=path.resolve(__dirname,'../docs/evidence');
const report={date:'2026-10-08',url:base,widths:[],errors:[]};
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,args:['--no-sandbox'],proxy:process.env.BOOK_PROXY==='1'?{server:process.env.HTTPS_PROXY}:undefined});
 try{const page=await browser.newPage({reducedMotion:'no-preference',ignoreHTTPSErrors:true});page.on('pageerror',e=>report.errors.push(String(e)));
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:900});await page.goto(base);await page.locator('[data-resource="llm-performance"]').waitFor();
  const sizes=await page.locator('.glass-book').evaluateAll(els=>els.map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,bottom:e.getBoundingClientRect().bottom})));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('[aria-controls="path-measure-llm-performance"]').click();
  assert.equal(await page.locator('#path-measure-llm-performance .station-link').count(),5);
  await page.locator('#path-measure-llm-performance .station-link').last().click();
  assert.match(await page.locator('#path-measure-llm-performance .route-stop.is-active').innerText(),/개선안을 끝까지/);
  const connected=await page.locator('.concept-card a[href="books/llm-performance/#paging"]').count();assert.ok(connected>0);
  if(width>720){await page.locator('.atlas-node[data-concept="memory-hierarchy"]').click();assert.ok(await page.locator('.atlas-book[data-book="llm-performance"]').evaluate(e=>e.classList.contains('is-lit')));}
  if(width===1280)await page.locator('.atlas-map').screenshot({path:path.join(out,'knowledge-map-desktop.png')});
  await page.locator('[data-resource="llm-performance"]').click();
  await page.locator('.book-cover .cover-art').waitFor();
  await page.evaluate(()=>document.querySelector('dialog').getAnimations({subtree:true}).filter(a=>!(a instanceof CSSAnimation)).forEach(a=>{a.pause();a.currentTime=1150;}));
  const coverFits=await page.locator('.book-cover .jacket').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,art:!!e.querySelector('.cover-art'),title:e.querySelector('.jacket-title').textContent}));
  assert.ok(coverFits.scroll<=coverFits.height+2);assert.match(coverFits.title,/LLM 추론/);
  await page.screenshot({animations:'allow',path:path.join(out,'closed-cover-'+width+'.png')});
  await page.evaluate(()=>document.querySelector('dialog').getAnimations({subtree:true}).filter(a=>!(a instanceof CSSAnimation)).forEach(a=>a.play()));
  await page.waitForSelector('dialog[data-state="open"]');
  assert.ok(await page.locator('dialog .lp-ill').isVisible());
  const cursor=page.locator('dialog .lp-ill-scan');const first=await cursor.evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(300);const second=await cursor.evaluate(e=>getComputedStyle(e).transform);assert.notEqual(first,second);
  const animations=await page.locator('dialog .lp-ill').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);assert.ok(animations>=3);
  await page.screenshot({path:path.join(out,'shelf-open-'+width+'.png')});
  if(width===1280){await page.locator('dialog .lp-ill').screenshot({path:path.join(out,'illustration-frame-a.png')});await page.waitForTimeout(600);await page.locator('dialog .lp-ill').screenshot({path:path.join(out,'illustration-frame-b.png')});}
  await page.evaluate(()=>document.documentElement.dataset.motion='reduce');assert.equal(await page.locator('dialog .lp-ill').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  await page.evaluate(()=>document.documentElement.dataset.motion='full');await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('dialog .lp-ill').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  await page.locator('dialog .reader-action').click();await page.waitForURL('**/books/llm-performance/');await page.locator('.hero').waitFor();
  const fill=await page.locator('.home-graphic svg text').first().evaluate(e=>getComputedStyle(e).fill);assert.notEqual(fill,'rgb(0, 0, 0)');
  if(width===1280)await page.screenshot({path:path.join(out,'home-desktop.png')});
  await page.goto(base+'books/llm-performance/#coalescing');
  const structure=await page.locator('.chapter-body').evaluate(e=>[...e.children].map(x=>x.matches('.chapter-head')?'head':x.matches('article.lab')?'lab':x.matches('.note')?'note':x.matches('.quiz')?'quiz':x.matches('nav')?'nav':x.querySelector('h2')?.textContent));
  assert.deepEqual(structure,['head','먼저 개념 잡기','lab','note','quiz','더 읽어 보기','nav']);
  await page.locator('.concept-diagram').screenshot({style:'header,.skip{visibility:hidden!important}',path:path.join(out,'concept-'+width+'.png')});
  await page.locator('header [data-shelf-return]').click();await page.waitForURL('**/index.html#books');
  await page.emulateMedia({reducedMotion:'no-preference'});
  report.widths.push({width,spines:sizes.length,animationCount:animations,reduceStops:true,routeAndConcept:true,shelfRoundTrip:true,standardBlocks:true,coverFits:true});
 }
 assert.equal(report.errors.length,0);report.success=true;fs.writeFileSync(path.join(out,process.env.BOOK_PROXY==='1'?'public-results.json':'shelf-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
