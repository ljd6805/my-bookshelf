/* 계산 모델 검사: 대표값·경계값·불변 조건. 본문·실험 안내(js/lab-guides.js)에 적은 숫자도 같은 모델로 다시 계산해 맞춘다. */
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/english.js');
test('syllable counts compare hangul letters with dictionary syllables',()=>{
 assert.deepEqual(['street','desk','milk','coffee','hotel','McDonald\'s'].map(w=>M.syllables(w).extra),[3,2,1,0,0,1]);
 assert.equal(M.syllables('street').ko_count,4);assert.equal(M.syllables('banana').stress,1);assert.equal(M.syllables('nope'),null);
 for(const w of M.WORDS){const r=M.syllables(w.en);assert.ok(r.extra>=0&&r.stress<r.en_count,w.en);}
});
test('stress plan marks content words and scores picks',()=>{
 const p=M.stressPlan('I want to go to the station.');assert.deepEqual(p.content,[false,true,false,true,false,false,true]);assert.equal(p.beats,3);
 const s=M.stressScore('I want to go to the station.',[1,3,0]);assert.deepEqual([s.hit,s.miss,s.extra],[2,1,1]);
 assert.ok(M.isContent('have'));assert.ok(!M.isContent('did'));
});
test('sentence frames pick be or a verb and flag the be+verb mistake',()=>{
 assert.equal(M.frame('Sam','verb','work','in Seoul').text,'Sam works in Seoul.');
 assert.equal(M.frame('They','verb','drink','coffee').text,'They drink coffee.');
 assert.equal(M.frame('I','be',null,'tired').text,'I am tired.');
 const bad=M.frame('Sam','verb','work','in Seoul',true);assert.equal(bad.ok,false);assert.equal(bad.issues.length,2);
});
test('questions move be or add do/does/did and return the base verb',()=>{
 const q=M.question('Sam','work','present',true);assert.equal(q.yesno,'Does Sam work in Seoul?');assert.equal(q.wh,'Where does Sam work?');
 assert.equal(M.question('You','go','past',true).wh,'Where did you go?');
 assert.equal(M.question('You','be_from','past',true).yesno,'Are you from Singapore?');
 assert.equal(M.question('You','be_from','present',true).wh,'Where are you from?');
 assert.equal(M.question('She','be_hungry','past').yesno,'Was she hungry?');
});
test('time markers choose the tense and every combination self-checks',()=>{
 assert.equal(M.timed('I','watch','last weekend').text,'I watched a movie last weekend.');
 assert.equal(M.timed('Sam','go','usually').text,'Sam usually goes to the gym.');
 assert.equal(M.timed('I','visit','tomorrow').text,'I am going to visit my parents tomorrow.');
 assert.ok(M.timed('I','eat','yesterday').irregular);
 let n=0;for(const s of Object.keys(M.SUBJECTS))for(const v of Object.keys(M.OBJ))for(const m of Object.keys(M.MARKERS)){const t=M.timed(s,v,m);assert.ok(M.checkTense(t.text,m).ok,t.text);n++;}
 assert.equal(n,8*8*7);
 assert.equal(M.tenseOf('I am going to the gym right now.'),'progressive');
});
test('follow-up choices change hooks, gaps and turns',()=>{
 const r=c=>{const x=M.talk(c);return [x.hooks,x.gaps,x.turns];};
 assert.deepEqual(r(['short','short','short']),[0,3,6]);assert.deepEqual(r(['info','info','info']),[3,0,9]);
 assert.deepEqual(r(['ask','ask','ask']),[6,0,9]);assert.deepEqual(r(['short','info','ask']),[3,1,8]);
});
test('politeness score thresholds pick the frame',()=>{
 assert.deepEqual([[0,0,1],[1,1,1],[2,0,2],[2,2,2]].map(([d,p,r])=>M.politeness(d,p,r,'file').level),[0,1,2,3]);
 assert.equal(M.politeness(2,0,2,'meeting').text,'Would you mind moving the meeting to Friday?');
 assert.equal(M.politeness(0,0,0,'way').text,'Can you tell me the way to the station, please?');
});
test('repairs and word error rate',()=>{
 assert.equal(M.repair('word',1).phrase,"Sorry, you're flying to Jeju when?");assert.equal(M.repair('all',3).phrase,'Sorry, could you say that again?');
 assert.equal(M.wer('Did you eat yet?','did you yet').rate,0.25);
 assert.equal(M.wer('What do you want to do?','what do you wanna do').errors,2);
 assert.equal(M.wer('Let me think about it.','let me think about it').rate,0);
 assert.equal(M.wer('a b','').errors,2);assert.equal(M.wpmOf('one two three',0),0);assert.equal(M.wpmOf('one two three',3),60);
});
test('fluency removes fillers before counting words per minute',()=>{
 const a=M.fluency(M.INTRO.before,30),b=M.fluency(M.INTRO.after,25);
 assert.deepEqual([a.words,a.fillers,a.total,a.wpm,a.fillerPerMin],[16,6,22,32,12]);
 assert.deepEqual([b.words,b.fillers,b.wpm],[32,0,77]);
 assert.equal(M.fluency('I like so much, you know, well',10).fillers,1);assert.equal(M.fluency('',0).wpm,0);
});
test('lunch transcript and the three review moments',()=>{
 assert.deepEqual(M.lunchStats(),{turns:15,jiwooTurns:7,jiwooWords:20,jiwooQuestions:0,gaps:2});
 assert.deepEqual([0,1,2].map(i=>M.review('A',i).score),[0,1,2]);
 assert.deepEqual([0,1,2].map(i=>M.review('B',i).ok),[false,true,false]);
 assert.deepEqual([0,1,2].map(i=>M.review('C',i).ok),[false,true,true]);
});
