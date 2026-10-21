const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../docs/evidence');fs.mkdirSync(out,{recursive:true});
const http=require('node:http');
const root=path.resolve(__dirname,'../../..');
const server=http.createServer((req,res)=>{
 const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));
 const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 if(!target.startsWith(root)||!fs.existsSync(target)){res.writeHead(404);return res.end('Not found');}
 const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
 res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
});
const ids=['why','schema','setup','crud','relations','migrations','transactions','performance','testing','final'];
let browser;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=process.env.BOOK_BASE_URL||`http://127.0.0.1:${server.address().port}/books/prisma/`;
 browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});const results=[],errors=[];
 for(const width of (process.env.PW_WIDTHS?process.env.PW_WIDTHS.split(',').map(Number):[1280,390,320])){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);await page.waitForSelector('.hero');await page.screenshot({path:path.join(out,`home-${width}.png`),fullPage:false});
  const homeCount=await page.locator('.home-count strong').innerText();await page.selectOption('#home-status','DONE');assert.notEqual(await page.locator('.home-count strong').innerText(),homeCount);
  for(const id of ids){
   await page.goto(base+'#'+id);await page.waitForSelector('.readout');
   const start=await page.locator('.readout').innerText();
   const presets=page.locator('[data-preset]');
   for(let i=0;i<await presets.count();i++){await presets.nth(i).click();assert.ok((await page.locator('.readout').innerText()).length>20);}
   await page.locator('[data-reset]').click();assert.equal(await page.locator('.readout').innerText(),start);
   const controls=page.locator('.lab-inner input,.lab-inner select');
   if(await controls.count()){const el=controls.first(),tag=await el.evaluate(e=>e.tagName),type=await el.getAttribute('type');if(tag==='SELECT'){const value=await el.locator('option').last().getAttribute('value');await el.selectOption(value);}else if(type==='checkbox')await el.setChecked(!(await el.isChecked()));else if(type==='range')await el.evaluate(e=>{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));});else await el.fill('abc');}
   await page.locator('[data-reset]').click();
   if(id==='transactions'){await page.locator('#tx-fail').check();const safe=await page.locator('.readout').innerText();await page.locator('#tx-atomic').uncheck();assert.notEqual(await page.locator('.readout').innerText(),safe);await page.locator('[data-reset]').click();}
   if(id==='setup'){await page.locator('[data-command="edit"]').click();assert.notEqual(await page.locator('.readout').innerText(),start);await page.locator('[data-reset]').click();}
   if(id==='testing'){await page.locator('#test-id').fill('abc');assert.match(await page.locator('.readout').innerText(),/0건/);await page.locator('[data-reset]').click();}
   await page.locator('[data-transfer]').first().click();assert.ok((await page.locator('.transfer-feedback').innerText()).length>10);
   await page.locator('[data-answer]').first().click();assert.ok((await page.locator('.quiz-feedback').innerText()).length>10);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow){console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.tagName,e.className,e.getBoundingClientRect().width]).slice(0,20)));await page.screenshot({path:path.join(out,'overflow.png'),fullPage:false});}assert.equal(overflow,false,`${width}/${id} overflow`);
   const back=page.locator('header [data-shelf-return]');assert.ok(await back.isVisible());
   results.push({width,id,presets:await presets.count(),reset:true,directInput:true,quiz:true,overflow:false});
  }
  await page.goto(base+'#transactions');await page.locator('.lab-inner').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`lab-${width}.png`),fullPage:false});
  if(width===1280){await page.locator('#theme').click();await page.screenshot({path:path.join(out,'lab-dark.png'),fullPage:false});}
  if(width===320){await page.locator('#menu').click();assert.ok(await page.locator('#sidebar').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('#sidebar').isVisible(),false);}
  await page.locator('header [data-shelf-return]').click();assert.match(new URL(page.url()).pathname,/^\/(?:index\.html)?$/);
  await page.close();
 }
 await browser.close();server.close();assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({base,viewports:[1280,390,320],results,errors},null,2));console.log(`Passed ${results.length} chapter/viewport cases; ${errors.length} page errors`);
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.close();process.exitCode=1;});
