const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.AI_CHROMIUM||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 const output=require('node:os').tmpdir();
 const target=process.env.AI_TARGET||'http://127.0.0.1:8000/books/ai';await page.goto(target);await page.evaluate(()=>document.fonts.ready);
 const chapters=await page.evaluate(()=>AIBook.chapters.map(c=>({id:c.id,labs:c.labs})));
 for(const c of chapters){await page.goto(target+'/#'+c.id);await page.locator('[data-lab]').first().waitFor();
 for(const id of c.labs){const lab=page.locator('#lab-'+id),inner=lab.locator('.lab-inner');const read=()=>inner.locator('.readout').innerText();
 const set=async(key,val)=>{await inner.locator('#'+key).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},String(val));};
 const reset=()=>lab.getByRole('button',{name:'실험 초기화',exact:true}).click();
 for(const b of await lab.locator('[data-preset]').all()){await b.click();assert.ok((await read()).length>10);assert.equal(await b.getAttribute('aria-pressed'),'true');}
 await reset();let detail='';
 if(id==='neuron'){await set('w1',0);await set('x1',-2);const a=await inner.locator('.chart polyline').getAttribute('points');await set('x1',2);assert.equal(a,await inner.locator('.chart polyline').getAttribute('points'));detail='zero weight yields flat curve';}
 if(id==='activation'){await set('ax',-2);assert.match(await read(),/0.000/);await set('fn','sigmoid');assert.match(await read(),/0.119/);detail='ReLU and sigmoid known outputs';}
 if(id==='regression'){await set('slope',2);await set('intercept',1);assert.match(await read(),/0.038/);detail='MSE=0.038';}
 if(id==='descent'){await inner.locator('#ten').click();assert.match(await read(),/0.4151/);await lab.locator('[data-preset="1"]').click();for(let i=0;i<10;i++){if(await inner.locator('#ten').isDisabled())break;await inner.locator('#ten').click();}assert.ok(await inner.locator('#ten').isDisabled());assert.doesNotMatch(await read(),/정의되지|Infinity|NaN/);detail='convergence and finite divergence stop';}
 if(id==='overfit'){await set('complexity',.64);assert.ok(+(await read()).match(/검증 MSE ([\d.]+)/)[1]<.1);await set('complexity',1);assert.match(await read(),/0.0000/);assert.match(await read(),/0.1237/);detail='training zero while validation worsens';}
 if(id==='bpe'){const a=await inner.locator('.token').count();await set('merges',8);assert.ok(await inner.locator('.token').count()<a);detail='token count decreases';}
 if(id==='embedding'){await set('angle',45);const pts=await inner.locator('polyline').nth(1).getAttribute('points');const [a,b]=pts.split(' ').map(p=>p.split(',').map(Number));assert.ok(Math.abs(Math.abs(b[0]-a[0])-Math.abs(b[1]-a[1]))<.01);await set('angle',90);await set('length',2);assert.match(await read(),/0.000/);detail='equal axes and perpendicular similarity';}
 if(id==='attention'){await set('q1',0);await set('q2',0);assert.equal(await inner.locator('.bar-row small').allTextContents().then(a=>a.every(v=>v==='25.0%')),true);assert.match(await read(),/3.500/);detail='uniform attention gives output 3.5';}
 if(id==='mask'){await set('position',1);assert.equal(await inner.locator('.selected-cell').count(),5);assert.deepEqual(await inner.locator('.selected-cell').allTextContents(),['1.00','×','×','×','×']);await set('position',5);assert.equal(await inner.locator('.selected-cell').count(),5);detail='selected row and future masking';}
 if(id==='temperature'){await set('temp',.1);assert.match(await read(),/100.0%/);await set('temp',2.5);assert.doesNotMatch(await read(),/100.0%/);detail='temperature spreads fixed ranking';}
 if(id==='sampling'){await set('k',1);await inner.locator('#sample').click();assert.match(await read(),/맑다: 100회/);assert.match(await inner.locator('.viz h4').nth(1).innerText(),/100회/);await set('filter','p');assert.ok(await inner.locator('#k').isDisabled());assert.ok(await inner.locator('#p').isEnabled());assert.match(await read(),/0회 추출/);detail='observed frequency, filtering and reset';}
 if(id==='convolution'){assert.match(await read(),/최대.*4.00/);await inner.locator('#clear').click();assert.match(await read(),/최대.*0.00/);await inner.locator('[data-pixel="24"]').click();assert.ok(await inner.locator('[data-pixel="24"]').evaluate(e=>e===document.activeElement));await set('kernel','blur');assert.match(await read(),/0.111/);detail='zero grid, impulse response and focus preserved';}
 if(id==='reward'){await set('help',0);const a=await inner.locator('.bar-row small').allTextContents();await set('help',1);const b=await inner.locator('.bar-row small').allTextContents();assert.equal(a[0],b[2]);assert.equal(a[2],b[0]);detail='reward preference reverses';}
 if(id==='quantization'){await set('bits',2);const mse=+(await read()).match(/MSE ([\d.]+)/)[1];await set('bits',8);assert.ok(+(await read()).match(/MSE ([\d.]+)/)[1]<mse);detail='higher precision lowers error';}
 if(id==='memory'){const a=+(await inner.locator('tr').nth(2).locator('td').nth(1).innerText());await set('context',16384);const b=+(await inner.locator('tr').nth(2).locator('td').nth(1).innerText());assert.equal(b,2*a);detail='KV doubles with context';}
 if(id==='retrieval'){await set('query','우주선');assert.match(await read(),/답변 보류/);await set('query','문맥 길이 메모리 KV');assert.ok(await inner.locator('.document-result').count()>0);detail='evidence found and absent';}
 if(id==='agent'){await set('failure','always');for(let i=0;i<5;i++)await inner.locator('#next').click();assert.ok(await inner.locator('#next').isDisabled());assert.match(await read(),/안전 중단/);await set('failure','ok');for(let i=0;i<3;i++)await inner.locator('#next').click();assert.match(await read(),/작업 완료/);detail='success and retry limit terminate';}
 if(id==='evaluation'){assert.equal(await inner.locator('.sample').count(),12);await set('threshold',0);assert.match(await read(),/놓친 이상 0건/);await set('threshold',1);assert.match(await read(),/정의할 수 없습니다/);detail='threshold extremes and undefined precision explained';}
 // Exercise every slider endpoint and select option; no invalid numerical result.
 for(const input of await inner.locator('input[type=range]').all()){if(await input.isDisabled())continue;await input.focus();await input.press('Home');await input.press('End');assert.doesNotMatch(await read(),/NaN|Infinity|정의되지 않음/);}
 for(const select of await inner.locator('select').all()){for(const val of await select.locator('option').evaluateAll(a=>a.map(x=>x.value))){await select.selectOption(val);assert.ok((await read()).length>0);}}
 await reset();await lab.screenshot({path:output+'/ai-book-lab-'+id+'-desktop.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' mobile overflow');await lab.screenshot({path:output+'/ai-book-lab-'+id+'-mobile.png'});await page.setViewportSize({width:1440,height:1050});results.push({id,detail,presets:'pass',extremes:'pass',mobile:'pass'});console.log('PASS '+id+' '+detail);
 }}
 await page.getByRole('button',{name:'밝은 화면으로 전환',exact:true}).click();await page.locator('#lab-evaluation').screenshot({path:output+'/ai-book-evaluation-light.png'});assert.deepEqual(errors,[]);fs.writeFileSync(output+'/ai-labs-results.json',JSON.stringify({results,errors},null,2));await browser.close();
})();
