/* 계산 검사: 세는 규칙의 대표값·경계값과, 본문·결과 읽기·그림에 적은 숫자를 js/opic.js로 다시 계산해 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('../js/opic.js'),S=require('../js/samples.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const guides=(()=>{const ctx={window:{OSamples:S},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);return ctx.window.OGuides.guides;})();
const reading=id=>guides[id][2],content=read('js/content.js');
const text=pick=>T.partsText(T.bankParts(S.BANK,pick));

test('time plan: 40 minutes, 12 or 15 questions, listening subtracted',()=>{
 assert.equal(T.TEST_SECONDS,2400);
 assert.deepEqual([1,2,3,4,5,6].map(T.questionsFor),[12,12,15,15,15,15]);
 assert.equal(T.plan(4).speakEach,140);assert.equal(T.plan(2).speakEach,180);assert.equal(T.plan(4,20,true).speakEach,120);assert.equal(T.plan(5,30,true).speakEach,100);
 assert.equal(T.plan(4,0).speakEach,160);
 assert.equal(T.layout(4).reduce((a,g)=>a+g.count,0),15);assert.equal(T.layout(2).reduce((a,g)=>a+g.count,0),12);
 for(const s of ['140초(2분 20초)','180초로','120초로','100초'])assert.ok(reading('plan').includes(s),s);
});

test('counting rules: words, sentences, connectors, time frames',()=>{
 assert.equal(T.words("That's all."),2);assert.equal(T.sentences('Hi. How are you? Fine!').length,3);
 assert.deepEqual(T.connectorsIn('After that, I went home and then I slept.'),['after that','and then'],'longer phrases are counted once');
 assert.equal(T.timeFrames('I need a red bed.').past,0,'need, red, bed are not past verbs');
 assert.equal(T.timeFrames('I fried rice yesterday.').past,1,'fried is excluded, yesterday counts');
 assert.equal(T.timeFrames('Next, I call my parents.').future,0,'sequencing Next is not future');
 assert.equal(T.timeFrames('Next week I will go.').future,2);
 assert.equal(T.shape('').level,0);
});

test('park samples land in the four shape cells',()=>{
 const r=S.PARK.map(p=>T.shape(p.text));
 assert.deepEqual(r.map(x=>x.level),[0,1,2,3]);
 assert.deepEqual(r.map(x=>[x.words,x.sentences,x.connectors,x.frames]),[[7,5,0,0],[21,5,0,1],[49,5,2,1],[96,7,6,3]]);
 assert.ok(reading('shape').includes('1.4낱말')&&reading('shape').includes('4.2낱말'));
});

test('survey presets: counts, validity and story clusters',()=>{
 const sv=ids=>T.survey(S.SURVEY,ids),P=S.SURVEY_PRESETS;
 assert.deepEqual([sv(P.short).count,sv(P.short).valid,sv(P.short).need,sv(P.short).stories],[11,false,1,4]);
 assert.deepEqual([sv(P.tight).count,sv(P.tight).valid,sv(P.tight).stories],[12,true,4]);
 assert.deepEqual([sv(P.scattered).count,sv(P.scattered).valid,sv(P.scattered).stories],[12,true,9]);
 assert.equal(sv([...P.short,'swim']).stories,5);assert.equal(sv([...P.short,'gym']).stories,5);assert.equal(sv([...P.short,'read']).stories,4);
 assert.equal(sv(P.short.filter(x=>x!=='music')).short.includes('hobby'),true,'removing the only hobby breaks the section minimum');
});

test('answer builder: 19, 73 and 54 words',()=>{
 const B=S.BANK_PRESETS;assert.equal(T.words(text(B.start)),19);assert.equal(T.words(text(B.full)),73);assert.equal(T.words(text(B.noexample)),54);
 assert.equal(T.connectorsIn(text(B.start)).length,0);assert.equal(T.connectorsIn(text(B.full)).length,4);
 assert.equal(Math.round(T.secondsFor(73,100)),44);
 assert.equal(T.words(S.BANK.example[1][0]),19);
 for(const s of ['19낱말','73낱말','54낱말','19초','약 44초'])assert.ok(reading('builder').includes(s),s);
 assert.ok(content.includes('73낱말')&&content.includes('54초 답'));
});

test('routine: sequencing words and shape cells',()=>{
 const k=S.ROUTINE.map(r=>r[0]),r=(n,a,s)=>T.shape(T.routineText(S.ROUTINE,k.slice(0,n),a,s));
 assert.deepEqual([r(3,'',false).connectors,r(3,'',false).name],[0,'문장']);
 assert.deepEqual([r(3,'usually',true).connectors,r(3,'usually',true).name],[2,'문장']);
 assert.deepEqual([r(4,'usually',true).connectors,r(4,'usually',true).name],[3,'이어진 문장']);
 const six=r(6,'usually',true);assert.deepEqual([six.words,six.connectors,six.frames,six.name],[42,4,1,'이어진 문장']);
 assert.match(T.routineText(S.ROUTINE,k,'usually',true),/Finally, I call my parents\.$/);
});

test('story: order check and past markers',()=>{
 assert.equal(T.storyInOrder([1,0,3,2,4]),false);assert.equal(T.storyInOrder([0,1,2,3,4]),true);
 assert.equal(T.timeFrames(T.storyText(S.STORY,[0,1,2,3,4],false)).past,1);assert.equal(T.timeFrames(T.storyText(S.STORY,[0,1,2,3,4],true)).past,10);
});

test('compare: frames and shape cells',()=>{
 const c=(tp,ax,fr)=>T.shape(T.compareText(S.COMPARE[tp],ax,fr));
 const a=c('phone',['look','use'],[1]),b=c('phone',['look','use'],[0,1]),f=c('phone',['look','use','problem'],[0,1,2]),t=c('town',['look','use','problem'],[0,1,2]);
 assert.deepEqual([a.sentences,a.words,a.frames,a.name],[2,24,1,'문장']);
 assert.deepEqual([b.sentences,b.frames,b.connectors,b.name],[4,2,3,'이어진 문장']);
 assert.deepEqual([f.sentences,f.words,f.frames,f.name],[9,104,3,'문단에 가까움']);
 assert.equal(t.words,78);
});

test('roleplay: questions, kinds, polite openers and alternatives',()=>{
 const lines=k=>{const [s,ids]=S.ROLEPLAY_PRESETS[k];return ids.map(i=>S.ROLEPLAY[s].lines[i]);};
 assert.equal(T.questionsCheck(lines('ask_plain')).questions,0);
 assert.deepEqual(T.questionsCheck(lines('ask_three')),{questions:3,kinds:['how','what','yes/no'],polite:0});
 assert.equal(T.alternatives(lines('solve_one').join(' ')),0);
 assert.equal(T.alternatives(lines('solve_two').join(' ')),2);assert.equal(T.questionsCheck(lines('solve_two')).polite,1);
 assert.equal(T.questionsCheck(['Is there a shower room I can use?']).polite,0,'"I can" inside a question is not a polite opener');
});

test('reuse: fit, adapt and none counts',()=>{
 const r=k=>{const x=T.reuse(S.STORIES,S.QUESTIONS,S.REUSE_PRESETS[k]);return [x.fit,x.adapt,x.none];};
 assert.deepEqual(r('park_only'),[3,3,2]);assert.deepEqual(r('three'),[5,3,0]);assert.deepEqual(r('all'),[6,2,0]);
});

test('pace: rate, speaking-only rate, words needed, share of 40 minutes',()=>{
 assert.equal(T.wpm(58,80).toFixed(1),'43.5');assert.equal(T.wpm(58,62).toFixed(1),'56.1');assert.equal(Math.round(T.wpm(58,80)*90/60),65);
 assert.equal(T.wpm(97,115).toFixed(1),'50.6');assert.equal(Math.round(T.wpm(97,115)*120/60),101);assert.equal(T.wpm(60,40),90);
 assert.equal(Math.round(T.pauseShare(18,80)*100),23);assert.equal(Math.round((15*90+15*20)/2400*100),69);
 assert.equal(T.wpm(100,120),50);assert.equal(T.wpm(100,80),75);
 for(const s of ['43.5낱말','56.1낱말','65낱말','50.6낱말','101낱말','90낱말','69%'])assert.ok(reading('pace').includes(s),s);
});

test('diagnose: each first-week answer fails a different check, every revision passes',()=>{
 const want={home:'length',trip:'past',phone:'frames',gym:'ask'};
 for(const a of S.ANSWERS){assert.equal(T.diagnose(a.before.text,a.before.seconds,a.target).fix,want[a.id],a.id);assert.equal(T.diagnose(a.after.text,a.after.seconds,a.target).fix,'keep',a.id);}
 const trip=S.ANSWERS.find(a=>a.id==='trip');assert.equal(T.timeFrames(trip.before.text).past,2);assert.equal(T.timeFrames(trip.after.text).past,13);
 assert.equal(T.diagnose(trip.after.text,trip.after.seconds,'past').connectors,8);
 assert.equal(S.ANSWERS.find(a=>a.id==='home').after.seconds,110);
 assert.equal(T.diagnose('Short.',50,'compare').fix,'length','length comes first');
});

test('review quiz numbers are recomputed',()=>{
 const r=JSON.parse(read('review.json'));assert.ok(JSON.stringify(r).includes('60 ÷ 90 × 60 = 40낱말'));assert.equal(T.wpm(60,90),40);
});
