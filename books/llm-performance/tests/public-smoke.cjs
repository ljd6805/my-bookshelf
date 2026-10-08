const {chromium}=require('playwright');const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BOOK_URL||'https://ljd6805.github.io/my-bookshelf/books/llm-performance/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE_PATH||undefined,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox']});
 try{const page=await browser.newPage({ignoreHTTPSErrors:true,reducedMotion:'reduce',viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));const checks=[];
 for(const [chapter,lab,preset,expected] of [['metrics','metrics',1,'820'],['tiling','occupancy',1,'50%'],['review','decision',1,'네 조건을 모두 만족']]){
  await page.goto(base+'#'+chapter);await page.locator('#lab-'+lab+' [data-preset="'+preset+'"]').click();const readout=await page.locator('#lab-'+lab+' .readout').innerText();assert.ok(readout.includes(expected));checks.push({chapter,readout});
 }
 await page.locator('#ttft').evaluate(e=>{e.value='500';e.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('.readout').innerText(),/만족하지 못한/);checks.push({chapter:'review',strongerGoal:'보류'});
 await page.goto(base+'examples/index.html');assert.equal(await page.locator('a[download]').count(),3);
 assert.equal(errors.length,0);const report={url:base,date:'2026-10-08',checks,errors,success:true};fs.writeFileSync(path.resolve(__dirname,'../docs/evidence/public-numerical-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:checks.length,errors,success:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
