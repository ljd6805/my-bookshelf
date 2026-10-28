/* 오픽 대비의 계산 모델. 화면 코드가 없고 Node에서도 require로 불러 tests/opic.test.cjs가 검사한다.
   글 모양 어림(문장 수·연결어·시간틀)은 이 책이 연습용으로 정한 규칙이며 오픽 채점이나 등급 예측이 아니다.
   시험 구성 숫자(40분, 12·15문항, 다시 듣기 한 번)는 docs/research.html의 출처와 확인일을 따른다. */
(function(root){
'use strict';
const TEST_SECONDS=40*60;
/* 자기 평가 단계별 문항 수. 국내 안내(S3)는 12~15문항만 밝히고, 1~2단계 12문항·3~6단계 15문항은 보조 출처(S4·S5)가 같게 적는다(research.html). */
const questionsFor=level=>level<=2?12:15;
/* 시험 시간 나누기: 40분 안에 질문 듣기도 들어간다고 보고, 듣는 시간을 뺀 나머지를 문항 수로 나눈다(보수적 가정). */
function plan(level,listen=20,replay=false){
 const n=questionsFor(level),heard=listen*(replay?2:1),speak=(TEST_SECONDS-n*heard)/n;
 return {questions:n,listenEach:heard,listenTotal:n*heard,speakEach:speak,speakTotal:n*speak,perQuestion:TEST_SECONDS/n};
}
/* 15문항 판의 흔한 묶음(응시 후기 정리 기준, 시험마다 다를 수 있음). 12문항 판은 마지막 세 문항이 없다. */
const LAYOUT=[['자기소개',1,1],['설문 주제 콤보',2,4],['설문·돌발 콤보',5,7],['설문·돌발 콤보',8,10],['롤플레이',11,13],['비교·사회 이슈',14,15]];
function layout(level){const n=questionsFor(level);return LAYOUT.filter(([,a])=>a<=n).map(([name,a,b])=>({name,from:a,to:Math.min(b,n),count:Math.min(b,n)-a+1}));}

/* 낱말과 문장. 낱말은 영문자·아포스트로피 덩어리, 문장은 . ! ? 로 끝나는 덩어리(끝 부호가 없으면 남은 글도 한 문장). */
const wordList=text=>String(text).match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)||[];
const words=text=>wordList(text).length;
const sentences=text=>String(text).split(/[.!?]+/).map(s=>s.trim()).filter(s=>wordList(s).length>0);
/* 문장을 잇는 말. 여러 낱말 표현을 먼저 찾고, 찾은 곳은 지워 한 번만 센다. */
const CONNECTORS=['as a result','after that','on the other hand','in the end','for example','for instance','because of','these days','in the past','the next day','when i was','not only','so that','first of all','to be honest','compared to','used to','because','so','but','and then','then','also','however','when','while','after','before','since','although','though','first','finally','actually','anyway','instead','besides'];
function connectorsIn(text){
 let t=' '+String(text).toLowerCase().replace(/[^a-z' ]+/g,' ').replace(/\s+/g,' ')+' ';const found=[];
 for(const c of CONNECTORS){const re=new RegExp(` ${c} `,'g');let m;while((m=re.exec(t))){found.push(c);t=t.slice(0,m.index)+' '.repeat(m[0].length)+t.slice(m.index+m[0].length);re.lastIndex=m.index+1;}}
 return found;
}
/* 시간틀 표시. 과거: 불규칙 과거형 목록, -ed 규칙형(예외 낱말 제외), used to, ago·last·yesterday. 미래: will, going to, plan(ning) to, hope to, next week·year 같은 때 표현(순서 표현 Next,는 세지 않음).
   현재: am/is/are/do/does/don't/doesn't, 빈도 부사, every, these days, now. 어림이므로 놓치거나 잘못 셀 수 있다. */
const IRREGULAR='was were had did went came saw got made took gave found thought told felt left kept met bought brought caught taught ran began sat stood spent paid said ate drank wrote rode drove flew knew grew threw lost won became chose broke forgot heard sold sent built understood wore woke'.split(' ');
const ED_EXCEPT=new Set('need speed seed feed bed red bred shed weed indeed hundred interested tired excited bored scared used married crowded relaxed surprised worried fried'.split(' '));
const PRESENT='am is are do does don\'t doesn\'t usually always often sometimes never rarely every these now normally'.split(' ');
function timeFrames(text){
 const ws=wordList(String(text).toLowerCase()),s=' '+ws.join(' ')+' ',out={past:0,present:0,future:0};
 for(const w of ws){
  if(IRREGULAR.includes(w)||(/^[a-z]{3,}ed$/.test(w)&&!ED_EXCEPT.has(w)))out.past++;
  if(PRESENT.includes(w))out.present++;
  if(w==='will'||w==="i'll")out.future++;
 }
 out.past+=(s.match(/ (used to|ago|last|yesterday) /g)||[]).length;
 out.future+=(s.match(/ (going to|planning to|plan to|hope to|next (?:week|month|year|weekend|summer|time)) /g)||[]).length;
 return out;
}
const framesUsed=f=>['past','present','future'].filter(k=>f[k]>0);
/* 글 모양 어림: 낱말·구 → 문장 → 이어진 문장 → 문단에 가까움. ACTFL의 텍스트 유형 이름을 빌렸지만 채점 기준이 아니라 연습용 표시다. */
function shape(text){
 const w=words(text),ss=sentences(text),c=connectorsIn(text).length,f=framesUsed(timeFrames(text)).length;
 const avg=ss.length?w/ss.length:0;let level=0;
 if(ss.length>=2&&avg>=3)level=1;
 if(level===1&&ss.length>=4&&c>=2)level=2;
 if(level===2&&ss.length>=6&&c>=4&&f>=2)level=3;
 return {words:w,sentences:ss.length,avgWords:avg,connectors:c,frames:f,level,name:SHAPES[level]};
}
const SHAPES=['낱말·구','문장','이어진 문장','문단에 가까움'];

/* 말하기 속도. 낱말 수와 초로 1분에 말한 낱말 수(wpm)를 내고, 거꾸로 속도로 걸릴 시간을 낸다. */
const wpm=(w,seconds)=>seconds>0?w*60/seconds:0;
const secondsFor=(w,rate)=>rate>0?w*60/rate:0;
/* 멈춤 비율: 말한 시간 가운데 2초 이상 쉰 시간의 몫. */
const pauseShare=(pauses,seconds)=>seconds>0?Math.min(1,pauses/seconds):0;

/* 답의 짜임: 네 덩어리(도입·세부·예·마무리)가 모두 있는지 보고, 덩어리별 낱말 수와 시간을 낸다. */
const BLOCKS=['open','detail','example','close'];
const BLOCK_NAMES={open:'도입',detail:'세부',example:'예·이야기',close:'마무리'};
function structure(parts,rate){
 const rows=BLOCKS.map(k=>{const text=(parts[k]||[]).join(' ');const w=words(text);return {key:k,name:BLOCK_NAMES[k],words:w,seconds:secondsFor(w,rate),present:w>0};});
 const total=rows.reduce((a,r)=>a+r.words,0);
 return {rows,words:total,seconds:secondsFor(total,rate),complete:rows.every(r=>r.present),missing:rows.filter(r=>!r.present).map(r=>r.name)};
}

/* 배경 설문: 고른 항목을 이야기 묶음으로 모아 준비할 이야기 수를 센다. 설문 4~7부의 최소 선택 수와 합계 12개 조건을 함께 본다. */
const SURVEY_MIN={leisure:2,hobby:1,sport:1,travel:1},SURVEY_TOTAL=12;
function survey(items,picked){
 const chosen=items.filter(i=>picked.includes(i.id)),bySection={leisure:0,hobby:0,sport:0,travel:0};
 chosen.forEach(i=>bySection[i.section]++);
 const clusters=[...new Set(chosen.map(i=>i.story))];
 const short=Object.entries(SURVEY_MIN).filter(([k,n])=>bySection[k]<n).map(([k])=>k);
 return {count:chosen.length,bySection,clusters,stories:clusters.length,valid:chosen.length>=SURVEY_TOTAL&&!short.length,short,need:Math.max(0,SURVEY_TOTAL-chosen.length)};
}

/* 준비한 이야기를 질문에 맞춰 쓰기: 질문마다 필요한 쓰임(장소·습관·경험·비교·문제)을 덮는 이야기가 있는지 센다. */
function reuse(stories,questions,prepared){
 const have=stories.filter(s=>prepared.includes(s.id));
 const rows=questions.map(q=>{const fit=have.filter(s=>s.topics.includes(q.topic)&&s.uses.includes(q.use));const near=fit.length?[]:have.filter(s=>s.uses.includes(q.use));return {q,fit,near,status:fit.length?'fit':near.length?'adapt':'none'};});
 const count=k=>rows.filter(r=>r.status===k).length;
 return {rows,fit:count('fit'),adapt:count('adapt'),none:count('none')};
}

/* 롤플레이 질문: 의문문 수, 의문사 종류, 공손한 시작, 대안 제시 수를 센다. */
const WH=['what','when','where','who','which','why','how'];
const POLITE=/^(could|would|may)\b|\b(could i|could you|would you|can you|would it be possible|is it possible)\b/i;
function questionsCheck(lines){
 const qs=lines.filter(l=>/\?\s*$/.test(l.trim())),kinds=new Set();let polite=0;
 for(const q of qs){const first=wordList(q.toLowerCase());const wh=first.find(w=>WH.includes(w));kinds.add(wh||'yes/no');if(POLITE.test(q.trim()))polite++;}
 return {questions:qs.length,kinds:[...kinds],polite};
}
/* 대안: 대안을 내는 표현이 든 문장 수(한 문장에 표현이 둘 있어도 하나로 센다). */
const ALT=/\b(instead|another option|or else|alternatively|how about|what if|could i|maybe i can|would it be possible)\b/i;
const alternatives=text=>sentenceLines(text).filter(l=>ALT.test(l)).length;

/* 마지막 과제의 진단: 위 계산을 한 답에 모두 적용하고, 이 책의 규칙으로 고칠 곳 하나를 고른다. 규칙 순서가 우선순위다. */
function diagnose(text,seconds,target){
 const s=shape(text),f=timeFrames(text),rate=wpm(s.words,seconds),frames=framesUsed(f);
 let fix='keep';
 if(seconds<60)fix='length';
 else if(s.connectors<3)fix='link';
 else if(target==='past'&&f.past<3)fix='past';
 else if(target==='compare'&&frames.length<2)fix='frames';
 else if(target==='roleplay'&&questionsCheck(sentenceLines(text)).questions<3)fix='ask';
 return {...s,rate,seconds,frames,fix};
}
const sentenceLines=text=>String(text).match(/[^.!?]+[.!?]+/g)||[String(text)];

/* 실험 화면이 문장 틀로 답을 엮는 함수. 자료는 js/samples.js(OSamples)에서 받는다. */
/* 4장: 문장 은행에서 고른 번호 [도입, 세부1, 세부2, 예, 마무리]로 네 덩어리를 만든다. */
function bankParts(bank,pick){const g=(k,i)=>bank[k][i]?.[0]||'';return {open:[g('open',pick[0])].filter(Boolean),detail:[g('detail',pick[1]),g('detail',pick[2])].filter(Boolean),example:[g('example',pick[3])].filter(Boolean),close:[g('close',pick[4])].filter(Boolean)};}
const partsText=parts=>BLOCKS.flatMap(k=>parts[k]||[]).join(' ');
/* 5장: 고른 일과를 빈도 표현과 순서 표현으로 잇는다. 3인칭이 아니라 I로 말하므로 동사는 원형 그대로다. */
const SEQ=['First,','Then','After that,','Next,','Finally,'];
function routineText(routine,keys,adverb,seq){
 const steps=routine.filter(([k])=>keys.includes(k)),lead=adverb?`On Saturday mornings, I ${adverb} `:'On Saturday mornings, I ';
 if(!steps.length)return '';
 return steps.map(([,v],i)=>{if(i===0)return lead+v+'.';const w=seq?(i===steps.length-1?SEQ[4]:SEQ[(i-1)%3+1]):'';return `${w?w+' ':''}I ${v}.`;}).join(' ');
}
/* 6장: 다섯 조각을 고른 순서로 놓고 현재형 또는 과거형 문장을 고른다. order는 조각 번호 배열. */
function storyText(story,order,past){return order.map(i=>story[i][past?2:1]).join(' ');}
const storyInOrder=order=>order.every((v,i)=>v===i);
/* 7장: 고른 축마다 고른 시간틀 문장을 잇는다. frames는 0 과거·1 현재·2 미래. */
function compareText(topic,axes,frames){return axes.flatMap(a=>frames.map(f=>topic.axes[a][f])).join(' ');}

const api={TEST_SECONDS,questionsFor,plan,layout,wordList,words,sentences,CONNECTORS,connectorsIn,timeFrames,framesUsed,shape,SHAPES,wpm,secondsFor,pauseShare,BLOCKS,BLOCK_NAMES,structure,SURVEY_MIN,SURVEY_TOTAL,survey,reuse,questionsCheck,alternatives,diagnose,sentenceLines,bankParts,partsText,SEQ,routineText,storyText,storyInOrder,compareText};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OText=api;
})(typeof window!=='undefined'?window:globalThis);
