/* 검색과 RAG의 계산 모델. DOM을 만지지 않는다.
   말뭉치: 가상의 '한빛시립도서관' 이용 안내 13개 문서(교육용으로 새로 씀).
   단위: 점수는 차원 없는 값, 길이는 어절(공백으로 나눈 낱말) 수. 토큰 수는 어절 × 1.5로 어림한다.
   임베딩은 손으로 정한 7차원 교육용 벡터이며 신경망 임베딩이 아니다. */
(function(root){
'use strict';
const RULES=['이 규정은 한빛시립도서관의 자료 대출과 이용 질서를 정합니다.','대출은 회원증을 가진 회원만 할 수 있습니다.','대출한 자료는 반납 예정일까지 돌려주어야 합니다.','반납이 늦어지면 늦어진 날수만큼 새 대출이 정지됩니다.','다만 그 기간은 한 번에 30일을 넘지 않습니다.','자료를 잃어버리거나 훼손하면 같은 자료로 변상합니다.','같은 자료를 구할 수 없으면 도서관이 정한 금액을 냅니다.','대출 중인 자료의 연장은 예약자가 없을 때 한 번만 가능합니다.','열람실에서는 음식을 먹을 수 없고 대화는 휴게실에서 합니다.','규정을 반복해서 어기면 대출이 정지될 수 있습니다.'];
const DOCS=[
 ['D1','대출 권수와 기간','회원 한 사람이 빌릴 수 있는 대출 권수는 7권까지입니다. 대출 기간은 14일이며 예약이 없으면 한 번 연장해 7일을 더 빌릴 수 있습니다.'],
 ['D2','연체와 대출 정지','빌린 책을 반납 예정일까지 반납하지 않으면 연체입니다. 연체한 날수만큼 대출이 정지되며 정지 기간은 최대 30일입니다. 연체료는 받지 않습니다.'],
 ['D3','반납하는 곳','책은 안내 데스크나 무인 반납함에 반납합니다. 무인 반납함은 24시간 열려 있어 밤에도 반납할 수 있습니다.'],
 ['D4','운영 시간','자료실은 평일 오전 9시부터 오후 8시까지, 주말은 오후 5시까지 운영합니다. 매주 월요일과 법정 공휴일은 휴관합니다.'],
 ['D5','회원 가입','회원 가입은 신분증을 가지고 안내 데스크를 방문하면 됩니다. 시에 살거나 일하는 사람은 누구나 가입할 수 있고 회원증은 바로 발급합니다.'],
 ['D6','전자책 대출','전자책은 도서관 앱에서 한 번에 5권까지 빌릴 수 있습니다. 대출 기간이 끝나면 파일이 자동으로 반납되므로 연체가 생기지 않습니다.'],
 ['D7','A-3 열람실','A-3 열람실은 조용히 공부하는 60석 규모입니다. A-3 열람실 좌석은 키오스크에서 4시간 단위로 예약합니다. 노트북 사용은 B-1 열람실에서만 가능합니다.'],
 ['D8','대출 예약','대출 중인 책은 예약할 수 있습니다. 책이 반납되면 문자로 알려 드리고 3일 안에 찾아가지 않으면 예약이 취소됩니다.'],
 ['D9','상호대차','다른 분관의 책을 가까운 도서관에서 받으려면 상호대차를 신청합니다. 신청한 책은 보통 3일에서 5일 뒤 도착합니다.'],
 ['D10','복사와 출력','2층 멀티미디어실에서 복사와 출력을 할 수 있습니다. 흑백은 한 장에 100원, 컬러는 300원입니다.'],
 ['D11','어린이 자료실','어린이 자료실은 초등학생 이하 어린이와 보호자가 이용합니다. 주말 오전에는 그림책 읽어 주기 프로그램이 열립니다.'],
 ['D12','주차장','도서관 주차장은 방문객이 2시간까지 무료로 이용합니다. 2시간이 지나면 10분마다 500원을 냅니다.'],
 ['D13','이용 규정 전문',RULES.join(' ')]
].map(([id,title,text])=>({id,title,text}));
/* 질문 묶음. rel은 정답 근거 문서. chunked=true일 때 이용 규정은 R1~R5 조각으로 바뀐다. */
const QUESTIONS=[
 {id:'q1',text:'책은 몇 권까지 빌릴 수 있나요?',rel:['D1'],answer:'7권까지'},
 {id:'q2',text:'책을 늦게 돌려주면 어떻게 되나요?',rel:['D2','R2'],answer:'늦은 날수만큼 대출 정지, 최대 30일'},
 {id:'q3',text:'월요일에도 문을 여나요?',rel:['D4'],answer:'월요일은 휴관'},
 {id:'q4',text:'A-3 열람실 좌석은 어떻게 예약하나요?',rel:['D7'],answer:'키오스크에서 4시간 단위'},
 {id:'q5',text:'책을 잃어버리면 어떻게 하나요?',rel:['R3'],answer:'같은 자료로 변상, 없으면 정한 금액'},
 {id:'q6',text:'전자책도 연체가 생기나요?',rel:['D6'],answer:'자동 반납이라 연체가 없음'},
 {id:'q7',text:'밤에 책을 반납할 수 있나요?',rel:['D3'],answer:'무인 반납함은 24시간'},
 {id:'q8',text:'컬러 출력은 한 장에 얼마인가요?',rel:['D10'],answer:'300원'},
 {id:'q9',text:'멀티미디어실은 몇 층에 있나요?',rel:['D10'],answer:'2층'},
 {id:'q10',text:'그림책 읽어 주기는 언제 하나요?',rel:['D11'],answer:'주말 오전'},
 {id:'u1',text:'주차장에 차를 몇 대 세울 수 있나요?',rel:[],answer:null},
 {id:'u2',text:'도서관에서 노트북을 빌릴 수 있나요?',rel:[],answer:null},
 {id:'u3',text:'와이파이 비밀번호가 뭔가요?',rel:[],answer:null}
];
const PARTICLES=['에서는','으로는','에서','으로','까지','부터','에게','은','는','이','가','을','를','에','의','로','도','와','과','만'];
function tokenize(text){
 return String(text).toLowerCase().replace(/[.,?!·“”"()]/g,' ').split(/\s+/).filter(Boolean).map(w=>{
  for(const p of PARTICLES)if(w.endsWith(p)&&w.length>p.length)return w.slice(0,-p.length);
  return w;
 });
}
function sentences(text){return String(text).match(/[^.?!]+[.?!]?/g).map(s=>s.trim()).filter(Boolean);}
/* 문서를 문장 size개씩, overlap개 겹쳐 자른다. 마지막 조각은 짧을 수 있다. */
function chunk(list,size,overlap){
 if(!(size>=1)||!(overlap>=0)||overlap>=size)throw new RangeError('조각 크기는 1 이상, 겹침은 0 이상이고 크기보다 작아야 합니다.');
 const out=[];
 for(let start=0;start<list.length;start+=size-overlap){out.push({from:start+1,to:Math.min(start+size,list.length),text:list.slice(start,start+size).join(' ')});if(start+size>=list.length)break;}
 return out;
}
function corpus(chunked=false){
 if(!chunked)return DOCS;
 const pieces=chunk(RULES,3,1).map((c,i)=>({id:'R'+(i+1),title:`이용 규정 ${c.from}~${c.to}문장`,text:c.text}));
 return DOCS.slice(0,12).concat(pieces);
}
function index(docs){
 const postings={},lengths={};
 for(const d of docs){const toks=tokenize(d.text);lengths[d.id]=toks.length;toks.forEach(t=>{(postings[t]=postings[t]||{})[d.id]=(postings[t][d.id]||0)+1;});}
 const avg=Object.values(lengths).reduce((a,b)=>a+b,0)/docs.length;
 return {postings,lengths,avg,n:docs.length};
}
function idf(n,df){return Math.log(1+(n-df+.5)/(df+.5));}
/* Lucene식 BM25. k1은 같은 낱말 반복의 포화, b는 문서 길이 보정의 세기. */
function bm25(query,docs,{k1=1.2,b=.75}={}){
 if(k1<0||b<0||b>1)throw new RangeError('k1 ≥ 0, 0 ≤ b ≤ 1 범위가 필요합니다.');
 const ix=index(docs),terms=[...new Set(tokenize(query))];
 return docs.map(d=>{
  const parts=terms.map(t=>{const tf=(ix.postings[t]||{})[d.id]||0;if(!tf)return {term:t,tf:0,score:0};
   const df=Object.keys(ix.postings[t]).length,norm=1-b+b*ix.lengths[d.id]/ix.avg;
   return {term:t,tf,score:idf(ix.n,df)*tf*(k1+1)/(tf+k1*norm)};});
  return {id:d.id,doc:d,score:parts.reduce((s,p)=>s+p.score,0),parts,length:ix.lengths[d.id]};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}));
}
function match(query,docs,mode='or'){
 const ix=index(docs),terms=[...new Set(tokenize(query))];
 const lists=terms.map(t=>({term:t,docs:Object.keys(ix.postings[t]||{})}));
 const hits=docs.map(d=>d.id).filter(id=>{const has=lists.map(l=>l.docs.includes(id));return mode==='and'?has.every(Boolean)&&has.length>0:has.some(Boolean);});
 return {terms:lists,hits};
}
/* 7개 의미 축: 빌리기·늦음·장소·시간·디지털·비용·회원. 낱말이 이 접두어로 시작하면 해당 벡터를 더한다. */
const AXES=['빌리기','늦음·반납','장소','시간','디지털','비용','회원'];
const LEXICON=[
 ['대출',[1,0,0,0,0,0,0]],['빌리',[1,0,0,0,0,0,0]],['빌릴',[1,0,0,0,0,0,0]],['빌린',[1,0,0,0,0,0,0]],['빌려',[1,0,0,0,0,0,0]],['권',[.8,0,0,0,0,0,0]],['연장',[.7,.3,0,.2,0,0,0]],['예약',[.6,0,.2,.2,0,0,0]],['상호대차',[.8,0,.3,0,0,0,0]],
 ['연체료',[0,.6,0,0,0,.8,0]],['연체',[0,1,0,0,0,0,0]],['늦',[0,1,0,.2,0,0,0]],['반납',[0,.8,0,0,0,0,0]],['돌려',[0,.8,0,0,0,0,0]],['정지',[0,.7,0,0,0,0,0]],['넘기',[0,.6,0,.2,0,0,0]],
 ['열람실',[0,0,1,0,0,0,0]],['좌석',[0,0,.9,0,0,0,0]],['자료실',[0,0,.8,0,0,0,0]],['주차',[0,0,.8,0,0,.2,0]],['멀티미디어실',[0,0,.7,0,.3,0,0]],['데스크',[0,0,.6,0,0,0,0]],['반납함',[0,.5,.7,0,0,0,0]],['정문',[0,0,.7,0,0,0,0]],
 ['시간',[0,0,0,1,0,0,0]],['평일',[0,0,0,1,0,0,0]],['주말',[0,0,0,1,0,0,0]],['월요일',[0,0,0,1,0,0,0]],['휴관',[0,0,.3,1,0,0,0]],['운영',[0,0,.2,.8,0,0,0]],['밤',[0,0,0,1,0,0,0]],['오전',[0,0,0,.9,0,0,0]],['오후',[0,0,0,.9,0,0,0]],['24시간',[0,0,0,.9,0,0,0]],['열',[0,0,.3,.6,0,0,0]],
 ['전자책',[.5,0,0,0,1,0,0]],['앱',[0,0,0,0,1,0,0]],['파일',[0,0,0,0,.9,0,0]],['노트북',[0,0,.2,0,1,0,0]],['출력',[0,0,0,0,.8,.3,0]],['컬러',[0,0,0,0,.6,.2,0]],['복사',[0,0,0,0,.6,.3,0]],['와이파',[0,0,0,0,1,0,0]],['비밀번호',[0,0,0,0,.8,0,0]],
 ['회원',[.2,0,0,0,0,0,1]],['가입',[0,0,0,0,0,0,1]],['신분증',[0,0,0,0,0,0,.8]],['원',[0,0,0,0,0,1,0]],['얼마',[0,0,0,0,0,1,0]],['무료',[0,0,0,0,0,.8,0]],['변상',[0,.2,0,0,0,1,0]],['금액',[0,0,0,0,0,1,0]],['잃어버',[0,.3,0,0,0,.8,0]],['훼손',[0,.3,0,0,0,.7,0]],['냅',[0,0,0,0,0,.6,0]]
];
const BY_LENGTH=[...LEXICON].sort((a,b)=>b[0].length-a[0].length);
function embed(text){
 const v=AXES.map(()=>0);
 for(const raw of tokenize(text)){const w=raw.replace(/^[\d,]+/,'');if(!w)continue;const hit=BY_LENGTH.find(([k])=>w.startsWith(k));if(hit)hit[1].forEach((x,i)=>v[i]+=x);}
 const len=Math.hypot(...v);return len?v.map(x=>x/len):v;
}
function cosine(a,b){const la=Math.hypot(...a),lb=Math.hypot(...b);return la&&lb?a.reduce((s,x,i)=>s+x*b[i],0)/(la*lb):0;}
function semantic(query,docs){const q=embed(query);return docs.map(d=>({id:d.id,doc:d,score:cosine(q,embed(d.text)),vector:embed(d.text)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}));}
/* 두 점수를 0~1로 맞춘 뒤 alpha : (1-alpha)로 섞는다. BM25는 이번 질문의 최고점으로 나눈다. */
function hybrid(query,docs,alpha=.5){
 if(alpha<0||alpha>1)throw new RangeError('alpha는 0~1입니다.');
 const k=bm25(query,docs),s=semantic(query,docs),top=k[0].score||1,byId={};
 k.forEach(r=>byId[r.id]={id:r.id,doc:r.doc,keyword:r.score/top,meaning:0});
 s.forEach(r=>byId[r.id].meaning=r.score);
 return Object.values(byId).map(r=>({...r,score:alpha*r.keyword+(1-alpha)*r.meaning})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}));
}
function search(method,query,docs,alpha=.5){
 if(method==='keyword')return bm25(query,docs);
 if(method==='meaning')return semantic(query,docs);
 if(method==='hybrid')return hybrid(query,docs,alpha);
 throw new RangeError('알 수 없는 검색 방식: '+method);
}
/* 상위 k개의 정밀도·재현율과 첫 정답 순위의 역수(RR). 정답이 없는 질문은 평균에서 뺀다. */
function evaluate(ranking,rel,k){
 const top=ranking.slice(0,k).map(r=>r.id),found=top.filter(id=>rel.includes(id)).length,first=ranking.findIndex(r=>rel.includes(r.id));
 return {precision:found/k,recall:rel.length?found/rel.length:0,rr:first<0?0:1/(first+1),found,top};
}
function benchmark(method,k,{alpha=.5,chunked=true}={}){
 const docs=corpus(chunked),rows=QUESTIONS.filter(q=>q.rel.length).map(q=>({q,...evaluate(search(method,q.text,docs,alpha),q.rel,k)}));
 const mean=key=>rows.reduce((s,r)=>s+r[key],0)/rows.length;
 return {rows,precision:mean('precision'),recall:mean('recall'),mrr:mean('rr')};
}
/* 재순위: 1차 후보 n개만 다시 본다. 문서 전체 대신 문장마다 질문과 나란히 놓고,
   질문 낱말의 앞 두 글자가 그 문장에 나오는 비율과 문장의 의미 유사도를 반씩 더한 뒤 가장 높은 문장 점수를 쓴다. 교육용 모형이며 학습한 재순위 모델이 아니다. */
function rerankScore(query,doc){
 const stem=w=>w.replace(/^[\d,]+/,'').slice(0,2),q=[...new Set(tokenize(query).map(stem))].filter(Boolean),qv=embed(query);
 return Math.max(...sentences(doc.text).map(s=>{const t=new Set(tokenize(s).map(stem));return .5*q.filter(x=>t.has(x)).length/q.length+.5*cosine(qv,embed(s));}));
}
function rerank(query,docs,n,alpha=.5){
 const first=hybrid(query,docs,alpha),pool=first.slice(0,n);
 return {first,second:pool.map(r=>({...r,score:rerankScore(query,r.doc)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}))};
}
function rerankBenchmark(n,k=1){
 const docs=corpus(true),rows=QUESTIONS.filter(q=>q.rel.length).map(q=>{const r=rerank(q.text,docs,n);return {q,before:evaluate(r.first,q.rel,k),after:evaluate(r.second,q.rel,k),inPool:r.second.some(x=>q.rel.includes(x.id))};});
 const mean=(f)=>rows.reduce((s,r)=>s+f(r),0)/rows.length;
 return {rows,before:mean(r=>r.before.rr),after:mean(r=>r.after.rr),hitBefore:mean(r=>r.before.found>0?1:0),hitAfter:mean(r=>r.after.found>0?1:0),ceiling:mean(r=>r.inPool?1:0)};
}
const TOKENS_PER_WORD=1.5;
/* LLM 시스템 책의 가상 8B 모델: 2 × 32층 × KV head 8 × 128차원 × 2 byte = 토큰당 128 KiB. */
const KV_PER_TOKEN=2*32*8*128*2;
function tokens(text){return Math.round(String(text).split(/\s+/).filter(Boolean).length*TOKENS_PER_WORD);}
/* 질문·지시문을 넣고 남은 예산에 순위대로 근거를 넣는다. 넘치는 근거는 통째로 뺀다. */
function packContext(query,budget,{alpha=.5,instruction=40}={}){
 const docs=corpus(true),ranked=hybrid(query,docs,alpha);let used=instruction+tokens(query);const chosen=[],skipped=[];
 for(const r of ranked.slice(0,6)){const t=tokens(r.doc.text);if(used+t<=budget){chosen.push({...r,tokens:t});used+=t;}else skipped.push({...r,tokens:t});}
 return {chosen,skipped,used,kvBytes:used*KV_PER_TOKEN};
}
function bestSentence(query,doc){
 const q=embed(query),qt=tokenize(query);
 return sentences(doc.text).map(s=>{const t=tokenize(s);return {s,score:qt.filter(w=>t.some(x=>x.startsWith(w))).length+cosine(q,embed(s))};}).sort((a,b)=>b.score-a.score)[0].s;
}
/* 마지막 과제: 최고 혼합 점수가 문턱 이상이면 1위 근거로 답하고, 아니면 답을 보류한다. */
function decide(threshold,{alpha=.5,reranked=false,n=5}={}){
 const docs=corpus(true);
 const rows=QUESTIONS.map(q=>{const top=reranked?rerank(q.text,docs,n,alpha).second[0]:hybrid(q.text,docs,alpha)[0],answer=top.score>=threshold,right=q.rel.includes(top.id);
  const outcome=answer?(right?'correct':'wrong'):(q.rel.length?'missed':'abstain');
  return {q,top,answer,outcome,sentence:bestSentence(q.text,top.doc)};});
 const count=o=>rows.filter(r=>r.outcome===o).length;
 return {rows,correct:count('correct'),wrong:count('wrong'),missed:count('missed'),abstain:count('abstain')};
}
const api={RULES,DOCS,QUESTIONS,AXES,TOKENS_PER_WORD,KV_PER_TOKEN,tokenize,sentences,chunk,corpus,index,idf,bm25,match,embed,cosine,semantic,hybrid,search,evaluate,benchmark,rerankScore,rerank,rerankBenchmark,tokens,packContext,bestSentence,decide};
if(typeof module!=='undefined')module.exports=api;else root.RMath=api;
})(typeof window==='undefined'?globalThis:window);
