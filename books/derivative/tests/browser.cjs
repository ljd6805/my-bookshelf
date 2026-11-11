/* 실제 브라우저 확인(수동 실행): 루트에서 `python3 -m http.server 8791`을 띄운 뒤 `node books/derivative/tests/browser.cjs`.
   모든 장을 1280·390·320px에서 열어 콘솔 오류, 가로 넘침, 실험 결과 문장, 비교 예제, 예제 펼치기, 3D 조작, 서가 복귀 단추를 확인한다. */
const {chromium}=require('playwright');
const URL=process.env.BOOK_URL||'http://localhost:8791/books/derivative/index.html';
const IDS=['home','average','limit','tangent','function','power','product','chain','transcendental','shape','optimize','linear','final'];
(async()=>{
 const browser=await chromium.launch(),errors=[];let checks=0;
 const ok=(cond,msg)=>{checks++;if(!cond)errors.push(msg);};
 for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('console',m=>{if(m.type()==='error')errors.push(`${width} console: ${m.text()}`);});page.on('pageerror',e=>errors.push(`${width} pageerror: ${e.message}`));
  for(const id of IDS){
   await page.goto(`${URL}#${id}`);await page.waitForTimeout(250);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${width} ${id}: horizontal overflow`);
   const back=await page.$('header .shelf-return');const box=await back.boundingBox();ok(box&&box.width>=24&&box.height>=24&&box.x>=0&&box.x+box.width<=width,`${width} ${id}: shelf return not usable`);
   if(id==='home')continue;
   for(const lab of await page.$$('.lab')){
    const name=await lab.getAttribute('id'),read=()=>lab.$eval('.readout',e=>e.textContent);
    const before=await read();ok(before.length>40&&!/NaN|undefined/.test(before),`${width} ${name}: empty readout`);
    const presets=await lab.$$('[data-preset]');ok(presets.length>=3,`${width} ${name}: presets`);
    await presets[presets.length-1].click();const after=await read();ok(!/NaN|undefined/.test(after),`${width} ${name}: preset readout`);
    await (await lab.$('[data-initialize]')).click();ok(await read()===before,`${width} ${name}: initialize restores the first state`);
    const spin=await lab.$('.dv3d svg');
    if(spin){const svg=()=>lab.$eval('.dv3d svg',e=>e.innerHTML.length+':'+e.innerHTML.slice(0,400));const a=await svg();await spin.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');ok(await svg()!==a,`${width} ${name}: 3D view does not turn with arrow keys`);}
   }
   const ex=await page.$('.dv-example');const shown=()=>ex.$$eval('li:not([hidden])',l=>l.length);const n0=await shown();await (await ex.$('[data-step]')).click();ok(await shown()===n0+1,`${width} ${id}: example step`);
   await (await ex.$('[data-all]')).click();ok(await ex.$$eval('li[hidden]',l=>l.length)===0,`${width} ${id}: example show all`);
   await (await page.$('.quiz [data-answer]')).click();ok((await page.$eval('.quiz-feedback',e=>e.textContent)).length>5,`${width} ${id}: quiz feedback`);
   ok(await page.$('.figure-art svg')!==null,`${width} ${id}: figure`);ok(await page.$('.easy-first')!==null,`${width} ${id}: easy box`);
  }
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto(`${URL}#average`);await page.waitForTimeout(300);
 await page.click('#theme');ok(await page.evaluate(()=>document.documentElement.dataset.theme)==='dark','theme toggle');
 await page.fill('#iv-a','2');await page.dispatchEvent('#iv-a','input');await page.fill('#iv-b','2');await page.dispatchEvent('#iv-b','input');
 ok((await page.$eval('#lab-interval .readout',e=>e.textContent)).includes('구간의 길이가 0'),'interval: a = b error state');
 await browser.close();
 console.log(`${checks} checks, ${errors.length} problems`);errors.forEach(e=>console.log(' - '+e));process.exit(errors.length?1:0);
})();
