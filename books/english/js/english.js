/* 영어 회화 기초의 계산 모델. DOM을 쓰지 않으므로 Node 테스트(tests/english.test.cjs)로 검증한다.
   규칙은 기초 회화에 필요한 범위로 줄인 것이다: 현재·과거·be going to·현재진행, 낱말 목록에 있는 동사만 다룬다.
   음절 수와 강세 위치는 사전 표기를 옮긴 미리 정한 값이고, 한국어 음절 수는 한글 글자 수를 실제로 센다. */
(function(root){
'use strict';
/* 1장: 외래어 표기(국립국어원 외래어 표기법 기준 표기)와 영어 사전의 음절 수·강세 음절(0부터).
   맥도날드는 회사의 상호 표기이고 규범 표기는 맥도널드라 note에 적는다(음절 수는 같다). */
const WORDS=[
 {en:'street',ko:'스트리트',parts:['street'],stress:0},
 {en:'desk',ko:'데스크',parts:['desk'],stress:0},
 {en:'milk',ko:'밀크',parts:['milk'],stress:0},
 {en:'friend',ko:'프렌드',parts:['friend'],stress:0},
 {en:'juice',ko:'주스',parts:['juice'],stress:0},
 {en:'coffee',ko:'커피',parts:['cof','fee'],stress:0},
 {en:'Christmas',ko:'크리스마스',parts:['Christ','mas'],stress:0},
 {en:'schedule',ko:'스케줄',parts:['sched','ule'],stress:0},
 {en:'hotel',ko:'호텔',parts:['ho','tel'],stress:1},
 {en:'banana',ko:'바나나',parts:['ba','na','na'],stress:1},
 {en:'computer',ko:'컴퓨터',parts:['com','pu','ter'],stress:1},
 {en:"McDonald's",ko:'맥도날드',parts:['Mc','Don',"ald's"],stress:1,note:'맥도날드는 회사가 쓰는 상호 표기입니다. 외래어 표기법대로 적으면 맥도널드이고, 음절 수는 같은 4입니다.'}
];
const hangulSyllables=s=>[...String(s)].filter(c=>c>='가'&&c<='힣').length;
function syllables(en){
 const w=WORDS.find(x=>x.en===en);if(!w)return null;
 const ko=hangulSyllables(w.ko),eng=w.parts.length;
 return {...w,ko_count:ko,en_count:eng,extra:ko-eng,ratio:+(ko/eng).toFixed(2)};
}
/* 2장: 기능어 목록. 이 목록에 없는 낱말(명사·본동사·형용사·부사·의문사·not이 붙은 조동사)을 내용어로 본다.
   have는 본동사로 쓰일 때가 많아 목록에서 뺐고, do·does·did는 질문의 조동사로 쓰일 때가 많아 목록에 두었다. */
const FUNCTION=new Set(('a an the to of at in on for from with by about and but or so if than that '+
 'i you he she it we they me him her us them my your his its our their '+
 'am is are was were be been do does did can could will would should shall may must '+
 "i'm you're he's she's it's we're they're i'd i'll").split(' '));
const words=s=>String(s).replace(/[.,!?]/g,' ').split(/\s+/).filter(Boolean);
const isContent=w=>!FUNCTION.has(w.toLowerCase());
function stressPlan(sentence){
 const ws=words(sentence),marks=ws.map(isContent);
 return {words:ws,content:marks,beats:marks.filter(Boolean).length,weak:marks.filter(x=>!x).length};
}
/* 독자가 고른 강세 낱말(번호 집합)을 규칙과 견준다. */
function stressScore(sentence,picked){
 const p=stressPlan(sentence),set=new Set(picked);let hit=0,miss=0,extra=0;
 p.content.forEach((c,i)=>{if(c&&set.has(i))hit++;else if(c)miss++;else if(set.has(i))extra++;});
 return {...p,hit,miss,extra};
}
/* 3장: 주어와 동사. person: 1 = I, 2 = you·we·they, 3 = he·she·Sam. */
const SUBJECTS={I:{be:'am',p:1,obj:'me'},You:{be:'are',p:2},We:{be:'are',p:2},They:{be:'are',p:2},He:{be:'is',p:3},She:{be:'is',p:3},Sam:{be:'is',p:3},'Jiwoo':{be:'is',p:3}};
const VERBS={
 work:{s:'works',past:'worked',ing:'working'},live:{s:'lives',past:'lived',ing:'living'},like:{s:'likes',past:'liked',ing:'liking'},
 drink:{s:'drinks',past:'drank',ing:'drinking'},go:{s:'goes',past:'went',ing:'going'},have:{s:'has',past:'had',ing:'having'},
 eat:{s:'eats',past:'ate',ing:'eating'},meet:{s:'meets',past:'met',ing:'meeting'},watch:{s:'watches',past:'watched',ing:'watching'},
 play:{s:'plays',past:'played',ing:'playing'},visit:{s:'visits',past:'visited',ing:'visiting'},study:{s:'studies',past:'studied',ing:'studying'},
 'get up':{s:'gets up',past:'got up',ing:'getting up'}
};
const BE_PAST={am:'was',is:'was',are:'were'};
const present=(subj,verb)=>SUBJECTS[subj].p===3?VERBS[verb].s:verb;
/* kind: 'be'(be + 보어) 또는 'verb'(일반동사 + 나머지). addBe는 "I am work" 같은 흔한 실수를 일부러 만든다. */
function frame(subj,kind,word,rest,addBe=false){
 const S=SUBJECTS[subj],issues=[];let text;
 if(kind==='be'){text=`${subj} ${S.be} ${rest}`;}
 else{
  const v=present(subj,word);
  text=addBe?`${subj} ${S.be} ${word} ${rest}`:`${subj} ${v} ${rest}`;
  if(addBe)issues.push('be동사와 일반동사를 함께 썼습니다. 일반동사가 있으면 be동사를 빼야 합니다.');
  if(addBe&&S.p===3)issues.push(`3인칭 단수 주어 뒤의 일반동사는 ${VERBS[word].s} 꼴로 바뀝니다.`);
 }
 return {text:text.trim()+'.',ok:!issues.length,issues,verb:kind==='be'?S.be:(addBe?word:present(subj,word))};
}
/* 4장: 질문 만들기. rest는 평서문의 나머지, slot은 의문사가 대신할 부분이다. */
const CLAUSES={
 work:{rest:'in Seoul',slot:'in Seoul',wh:'Where'},like:{rest:'spicy food',slot:'spicy food',wh:'What'},
 'get up':{rest:'at seven',slot:'at seven',wh:'What time'},go:{rest:'to Busan',slot:'to Busan',wh:'Where'},
 be_from:{be:true,rest:'from Singapore',slot:'from Singapore',wh:'Where',tail:'from',presentOnly:true},be_hungry:{be:true,rest:'hungry',slot:null}
};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const subjLow=s=>s==='I'?'I':(['Sam','Jiwoo'].includes(s)?s:s.toLowerCase());
function question(subj,key,tense='present',useWh=false){
 const c=CLAUSES[key],S=SUBJECTS[subj],sl=subjLow(subj);if(c.presentOnly)tense='present';
 const verb=key.startsWith('be_')?null:key;let statement,yesno,wh=null,aux;
 if(c.be){
  aux=tense==='past'?BE_PAST[S.be]:S.be;statement=`${subj} ${aux} ${c.rest}.`;yesno=`${cap(aux)} ${sl} ${c.rest}?`;
  if(useWh&&c.slot)wh=`${c.wh} ${aux} ${sl} ${c.tail?c.rest.replace(c.slot,'').trim()+c.tail:''}?`.replace(/ +\?/,'?');
 }else{
  aux=tense==='past'?'did':(S.p===3?'does':'do');
  statement=`${subj} ${tense==='past'?VERBS[verb].past:present(subj,verb)} ${c.rest}.`;
  yesno=`${cap(aux)} ${sl} ${verb} ${c.rest}?`;
  if(useWh&&c.slot)wh=`${c.wh} ${aux} ${sl} ${verb}${c.rest.replace(c.slot,'').trim()?' '+c.rest.replace(c.slot,'').trim():''}?`;
 }
 return {statement,yesno,wh,aux,base:verb};
}
/* 5장: 시간 표지와 시제. */
const MARKERS={
 'every day':{tense:'present',where:'now-habit'},usually:{tense:'present',where:'now-habit',front:true},
 yesterday:{tense:'past',where:'past'},'last weekend':{tense:'past',where:'past'},
 'right now':{tense:'progressive',where:'now'},tomorrow:{tense:'going',where:'future'},'next week':{tense:'going',where:'future'}
};
const OBJ={go:'to the gym',eat:'kimchi stew',have:'lunch with Sam',meet:'my team',watch:'a movie',play:'tennis',visit:'my parents',work:'from home'};
function timed(subj,verb,marker){
 const M=MARKERS[marker],S=SUBJECTS[subj],o=subj==='Sam'?OBJ[verb].replace('with Sam','with Jiwoo'):OBJ[verb];let v;
 if(M.tense==='present')v=present(subj,verb);
 else if(M.tense==='past')v=VERBS[verb].past;
 else if(M.tense==='progressive')v=`${S.be} ${VERBS[verb].ing}`;
 else v=`${S.be} going to ${verb}`;
 const text=M.front?`${subj} ${marker} ${v} ${o}.`:`${subj} ${v} ${o} ${marker}.`;
 return {text,tense:M.tense,where:M.where,irregular:M.tense==='past'&&!VERBS[verb].past.endsWith('ed')};
}
/* 6장: 대화 이어 가기 시나리오. 지우의 대답 방식 세 가지가 남기는 "이어 갈 거리"(새 정보 + 되묻기)를 센다. */
const TOPICS=[
 {q:'Did you have a good weekend?',short:'Yes.',info:'Yes, I went hiking on Bukhansan.',ask:'How about you?',sam:'Nice! Was it crowded?',back:'I just stayed home and watched a movie.'},
 {q:'Is this place your favorite?',short:'Yes.',info:'Yes, I come here every Friday.',ask:'Do you like spicy food?',sam:'What do you usually order?',back:'I love it. In Singapore I eat chili crab a lot.'},
 {q:'How long have you worked here?',short:'Three years.',info:'Three years. I\'m in the marketing team.',ask:'What about you?',sam:'Oh, marketing! What are you working on now?',back:'About five years, in the Singapore office.'}
];
const HOOKS={short:0,info:1,ask:2};
function talk(choices){
 const lines=[];let turns=0,gaps=0,asked=0;
 TOPICS.forEach((t,i)=>{
  const c=choices[i]||'short';lines.push(['Sam',t.q]);
  if(c==='short'){lines.push(['지우',t.short]);lines.push(['gap','(말이 끊김: Sam이 새 화제를 찾음)']);gaps++;turns+=2;}
  else if(c==='info'){lines.push(['지우',t.info]);lines.push(['Sam',t.sam]);turns+=3;}
  else{lines.push(['지우',`${t.info} ${t.ask}`]);lines.push(['Sam',t.back]);asked++;turns+=3;}
 });
 return {lines,turns,gaps,asked,hooks:choices.reduce((a,c)=>a+HOOKS[c||'short'],0)};
}
/* 7장: 공손함 단계. Brown·Levinson(1987)의 거리(D)·힘(P)·부담(R)을 더한다는 생각만 빌리고, 0~2 점수와 문턱은 이 책이 정한 단순화다. */
const TASKS={
 way:{base:'tell me the way to the station',ing:'telling me the way to the station'},
 file:{base:'send me the file',ing:'sending me the file'},
 meeting:{base:'move the meeting to Friday',ing:'moving the meeting to Friday'}
};
const LEVELS=['Can you','Could you','Would you mind','I was wondering if you could'];
function politeness(d,p,r,task){
 const sum=d+p+r,level=sum<=1?0:sum<=3?1:sum<=5?2:3,T=TASKS[task];
 const text=level===2?`Would you mind ${T.ing}?`:level===3?`I was wondering if you could ${T.base}.`:`${LEVELS[level]} ${T.base}, please?`;
 return {sum,level,frame:LEVELS[level],text};
}
/* 8장: Sam의 말 다섯 줄과, 무엇을 놓쳤는지에 따라 고르는 되묻기 표현. 한 낱말 되묻기와 뜻 확인은 줄마다 미리 정했다. */
const SAM_LINES=[
 {text:'Have you been to Gyeongbokgung lately?',word:'Sorry, have I been where?',meaning:'Do you mean the palace near Gwanghwamun?'},
 {text:"I'm flying to Jeju on Thursday.",word:"Sorry, you're flying to Jeju when?",meaning:'Do you mean this Thursday, the day after tomorrow?'},
 {text:"Let's grab a coffee after the meeting.",word:"Sorry, let's grab what?",meaning:'Do you mean right after the two o’clock meeting?'},
 {text:'The restaurant is just around the corner from the station.',word:'Sorry, the restaurant is where?',meaning:'Do you mean it is very close to the station?'},
 {text:'Could you send me the slides by tomorrow morning?',word:'Sorry, send you what?',meaning:'Do you mean before nine tomorrow?'}
];
const REPAIRS={
 all:['Sorry, could you say that again?','전부 놓쳤을 때: 문장 전체를 다시 말해 달라고 합니다.'],
 speed:['Could you speak a little more slowly, please?','속도가 문제일 때: 천천히 말해 달라고 합니다.'],
 word:[null,'한 낱말만 놓쳤을 때: 들은 부분을 되풀이하고 놓친 자리에 의문사를 넣습니다.'],
 meaning:[null,'뜻이 확실하지 않을 때: 이해한 내용을 말해 맞는지 확인합니다.']
};
function repair(kind,line=0){const L=SAM_LINES[line];return {phrase:REPAIRS[kind][0]||L[kind],why:REPAIRS[kind][1]};}
/* 이 기기의 목소리가 실제로 읽은 시간(초)으로 분당 낱말 수를 낸다. */
const wpmOf=(text,seconds)=>seconds>0?Math.round(norm(text).length/(seconds/60)):0;
/* 9장: 받아쓰기 낱말 오류율. WER = (대체 + 삭제 + 삽입) / 정답 낱말 수. 대소문자와 문장부호는 무시한다. */
const norm=s=>String(s).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean);
function wer(reference,hypothesis){
 const r=norm(reference),h=norm(hypothesis),d=Array.from({length:r.length+1},(_,i)=>[i,...Array(h.length).fill(0)]);
 for(let j=1;j<=h.length;j++)d[0][j]=j;
 for(let i=1;i<=r.length;i++)for(let j=1;j<=h.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(r[i-1]===h[j-1]?0:1));
 const errors=d[r.length][h.length];
 return {errors,n:r.length,rate:r.length?errors/r.length:0,correct:Math.max(0,r.length-errors)};
}
const LINKED=[
 {text:'What do you want to do?',heard:'whaddaya wanna do',note:'want to가 wanna처럼, what do you가 한 덩어리로 들립니다.'},
 {text:'Did you eat yet?',heard:'didja eat yet',note:'did 끝의 d와 you가 이어져 [dʒ] 소리가 됩니다.'},
 {text:"I'm going to check it out.",heard:'I’m gonna checkidout',note:'going to가 gonna로, check it out이 자음과 모음이 이어져 한 낱말처럼 들립니다.'},
 {text:'Can I have a cup of coffee?',heard:'canai hava cuppa coffee',note:'cup of의 of가 약해져 [ə]만 남습니다.'},
 {text:'Let me think about it.',heard:'lemme think abouddit',note:'let me가 lemme로, about it의 t가 약하게 들립니다.'}
];
/* 10장: 말하기 속도와 군말. 군말 목록(um·uh·er·you know)은 이 책이 정한 것이다. like·so·well은 뜻으로 쓰일 때가 많아 세지 않는다. 속도는 군말을 뺀 낱말 수를 분으로 나눈다. */
const FILLERS=['um','uh','er','you know'];
function fluency(transcript,seconds){
 let t=` ${String(transcript).toLowerCase().replace(/[.,!?]/g,' ').replace(/\s+/g,' ')} `,fill=0;
 for(const f of FILLERS){const re=new RegExp(` ${f} `,'g');let m;while((m=t.match(re))){fill+=m.length;t=t.replace(re,' ');}}
 const ws=norm(t),total=ws.length+fill,min=seconds/60;
 return {words:ws.length,fillers:fill,total,wpm:min>0?Math.round(ws.length/min):0,fillerPerMin:min>0?+(fill/min).toFixed(1):0};
}
const INTRO={
 before:"Um, hello. I'm Jiwoo. Um, I am work in, uh, marketing team. Um, I like, uh, coffee. And, uh, so, that's all.",
 after:"Hi, I'm Jiwoo. I work in the marketing team here in Seoul. I've been here for three years. On weekends I usually go hiking. What do you like to do on weekends?"
};
/* 마지막 과제: 지우의 첫 점심 대화 기록(지어낸 것)과 복기할 세 순간. */
function tenseOf(sentence){
 const w=norm(sentence),j=w.join(' ');
 const g=j.match(/\b(?:am|is|are|i'm|you're|he's|she's|we're|they're) going to (\w+)/);
 if(g&&Object.keys(VERBS).some(v=>v.split(' ')[0]===g[1]))return 'going';
 for(const [base,v] of Object.entries(VERBS)){
  const b=base.split(' ')[0],ing=v.ing.split(' ')[0],past=v.past.split(' ')[0],s3=v.s.split(' ')[0];
  if(w.includes(ing)&&/\b(am|is|are)\b/.test(j))return 'progressive';
  if(w.includes(past))return 'past';
  if(w.includes(b)||w.includes(s3))return 'present';
 }
 return null;
}
function checkTense(sentence,marker){const t=tenseOf(sentence),need=MARKERS[marker].tense;return {tense:t,need,ok:t===need};}
const LUNCH=[
 ['Sam','Hi Jiwoo, nice to meet you finally!'],['지우','Nice to meet you too.'],
 ['Sam','So, did you have a good weekend?'],['지우','Yes.','A'],['gap','(4초 멈춤)'],
 ['Sam','Okay! Is this restaurant close to the office?'],['지우','Yes, five minutes.'],
 ['Sam','Great. What did you do yesterday?'],['지우',"Yesterday I go to my parents' house.",'B'],
 ['Sam','Oh, nice. Where do they live?'],['지우','In Suwon.'],
 ['Sam',"By the way, have you been to Gyeongbokgung lately? I'm thinking of going on Saturday."],['지우','Yes.','C'],
 ['Sam','Oh, which part did you like best?'],['지우','Um…'],['gap','(6초 멈춤)'],['Sam','Never mind! Shall we order?']
];
const MOMENTS={
 A:{tool:'followup',cands:['Yes.','Yes, I went hiking on Bukhansan.','Yes, I went hiking on Bukhansan. How about you?'],kinds:['short','info','ask']},
 B:{tool:'time',marker:'yesterday',cands:["Yesterday I go to my parents' house.","Yesterday I went to my parents' house.","Yesterday I am going to my parents' house."]},
 C:{tool:'repair',cands:['Yes.','Sorry, could you say that again?','Do you mean the palace near Gwanghwamun?'],
  notes:['알아듣지 못했는데 “Yes”라고 답해, 이어진 질문(어느 곳이 가장 좋았는지)에 답할 수 없게 됩니다.','문장 전체를 다시 듣게 됩니다. Sam이 같은 말을 천천히 되풀이할 기회가 생깁니다.','들은 낱말(Gyeongbokgung)로 이해한 내용을 확인합니다. Sam이 맞다고 하면 lately(최근에)를 놓쳤어도 대화를 이어 갈 수 있습니다.']}
};
const TENSE_KO={present:'현재',past:'과거',progressive:'현재진행',going:'be going to'};
function review(moment,index){
 const M=MOMENTS[moment],text=M.cands[index];
 if(M.tool==='followup'){const h=HOOKS[M.kinds[index]];return {text,tool:M.tool,score:h,ok:h>0,detail:`이어 갈 거리 ${h}개`};}
 if(M.tool==='time'){const c=checkTense(text,M.marker);return {text,tool:M.tool,score:c.ok?1:0,ok:c.ok,detail:`${M.marker} → 필요한 시제: ${TENSE_KO[c.need]}, 쓴 시제: ${TENSE_KO[c.tense]||'판정 못 함'}`};}
 return {text,tool:M.tool,score:index?1:0,ok:index>0,detail:M.notes[index]};
}
function lunchStats(lines=LUNCH){
 const me=lines.filter(l=>l[0]==='지우'),ws=me.reduce((a,l)=>a+norm(l[1]).length,0);
 return {turns:lines.filter(l=>l[0]!=='gap').length,jiwooTurns:me.length,jiwooWords:ws,jiwooQuestions:me.filter(l=>l[1].includes('?')).length,gaps:lines.filter(l=>l[0]==='gap').length};
}
root.EModel={tenseOf,checkTense,LUNCH,MOMENTS,review,lunchStats,WORDS,hangulSyllables,syllables,FUNCTION,words,isContent,stressPlan,stressScore,SUBJECTS,VERBS,present,frame,CLAUSES,question,MARKERS,OBJ,timed,TOPICS,HOOKS,talk,TASKS,LEVELS,politeness,SAM_LINES,REPAIRS,repair,wpmOf,norm,wer,LINKED,FILLERS,fluency,INTRO};
if(typeof module!=='undefined')module.exports=root.EModel;
})(typeof window!=='undefined'?window:globalThis);
