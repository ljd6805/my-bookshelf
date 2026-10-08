/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 온라인 서점 '마루책방'의 고객 문의함. 데이터는 교육용으로 만든 짧은 문장이다. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0);
const round=(x,d=4)=>Math.round(x*10**d)/10**d;
const softmax=a=>{const m=Math.max(...a),e=a.map(x=>Math.exp(x-m)),s=sum(e);return e.map(x=>x/s);};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
const cosine=(a,b)=>{const n=norm(a)*norm(b);return n?dot(a,b)/n:0;};

/* 문의함 8개(교육용). 모든 장이 이 문장들을 다시 쓴다. */
const INBOX=['환불은 언제 되나요','주문한 책이 아직 배송 중이에요','배송비는 얼마인가요','파본이라 교환하고 싶어요','환불 신청했는데 환불이 안 됐어요','배송지를 바꾸고 싶어요','한강 작가 신간 언제 나오나요','교환 대신 환불해 주세요'];
const JOSA=['에서','으로','까지','부터','은','는','이','가','을','를','에','로','의','도','만','과','와'];

/* 1장: 쪼개는 단위. space=어절, josa=끝 조사 떼기(규칙 기반, 과하게 떼는 실패 포함), char2=어절 안 글자 두 개씩 */
function stripJosa(w){for(const j of JOSA)if(w.length>j.length&&w.endsWith(j))return w.slice(0,-j.length);return w;}
function tokenize(text,mode='space'){
 const words=String(text).trim().split(/\s+/).filter(Boolean);
 if(mode==='josa')return words.map(stripJosa);
 if(mode==='char2')return words.flatMap(w=>w.length<2?[w]:Array.from({length:w.length-1},(_,i)=>w.slice(i,i+2)));
 return words;
}
function vocab(docs,mode){return [...new Set(docs.flatMap(d=>tokenize(d,mode)))];}
function matchDocs(query,docs,mode){
 const q=new Set(tokenize(query,mode));
 return docs.map((d,i)=>{const t=tokenize(d,mode),hits=[...new Set(t.filter(x=>q.has(x)))];return {i,text:d,hits:hits.length,words:hits};}).sort((a,b)=>b.hits-a.hits||a.i-b.i);
}

/* 1장: 글자 단위 BPE. words={낱말:빈도}. 가장 잦은 이웃 쌍을 k번 합친다. 같은 빈도면 먼저 나온 쌍. */
function pairCounts(seqs){const c=new Map();for(const [s,f] of seqs)for(let i=0;i+1<s.length;i++){const k=s[i]+'\u0001'+s[i+1];c.set(k,(c.get(k)||0)+f);}return c;}
function mergeSeq(s,a,b){const out=[];for(let i=0;i<s.length;i++){if(i+1<s.length&&s[i]===a&&s[i+1]===b){out.push(a+b);i++;}else out.push(s[i]);}return out;}
function learnBpe(words,k){
 let seqs=Object.entries(words).map(([w,f])=>[Array.from(w),f]);const merges=[];
 const base=new Set(seqs.flatMap(([s])=>s)).size;
 for(let step=0;step<k;step++){
  const c=pairCounts(seqs);if(!c.size)break;
  let best=null,bf=0;for(const [p,f] of c)if(f>bf){best=p;bf=f;}
  const [a,b]=best.split('\u0001');merges.push([a,b,bf]);seqs=seqs.map(([s,f])=>[mergeSeq(s,a,b),f]);
 }
 const tokens=sum(seqs.map(([s,f])=>s.length*f)),chars=sum(Object.entries(words).map(([w,f])=>Array.from(w).length*f));
 return {merges,vocabSize:base+merges.length,tokens,chars,seqs:seqs.map(([s,f])=>[s,f])};
}
/* 1장 실험의 학습 자료: 문의함에 자주 나오는 낱말과 빈도(교육용). */
const BPE_WORDS={'배송':6,'배송비':5,'배송지':4,'환불':6,'환불금':2,'교환':5,'교환권':2,'신간':3};
function applyBpe(word,merges){let s=Array.from(word);for(const [a,b] of merges)s=mergeSeq(s,a,b);return s;}

/* 2장: TF-IDF. smooth=true는 scikit-learn 기본식 ln((N+1)/(df+1))+1, false는 ln(N/df). */
function idf(df,N,smooth=true){if(df<=0||df>N)return NaN;return smooth?Math.log((N+1)/(df+1))+1:Math.log(N/df);}
function tfidfDoc(docs,index,mode='josa'){
 const toks=docs.map(d=>tokenize(d,mode)),N=docs.length,t=toks[index],out={};
 for(const w of new Set(t)){const tf=t.filter(x=>x===w).length/t.length,df=toks.filter(d=>d.includes(w)).length;out[w]={tf,df,idf:idf(df,N),w:tf*idf(df,N)};}
 return Object.entries(out).map(([word,v])=>({word,...v})).sort((a,b)=>b.w-a.w||a.word.localeCompare(b.word));
}
/* 2장 더 깊이: BM25 한 낱말 점수 */
function bm25(tf,df,N,len,avg,k1=1.5,b=0.75){const i=Math.log(1+(N-df+0.5)/(df+0.5));return i*tf*(k1+1)/(tf+k1*(1-b+b*len/avg));}

/* 3장: skip-gram 문맥 창. 문장마다 가운데 낱말 좌우 window 안의 쌍을 만든다. */
function skipPairs(tokens,window){const p=[];tokens.forEach((c,i)=>{for(let j=Math.max(0,i-window);j<=Math.min(tokens.length-1,i+window);j++)if(j!==i)p.push([c,tokens[j]]);});return p;}
function contextCounts(docs,target,window,mode='josa'){
 const counts={};let total=0;
 for(const d of docs){const pairs=skipPairs(tokenize(d,mode),window);total+=pairs.length;for(const [c,x] of pairs)if(c===target)counts[x]=(counts[x]||0)+1;}
 return {total,counts:Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))};
}
/* 3장: 교육용 3차원 단어 벡터(가정값). 축은 [사람, 이야기, 운율]에 가깝게 정했다. '책'은 자주 나오는 낱말처럼 길이가 길다. */
const VEC={'소설':[0,1,0.2],'소설가':[1,0.9,0.2],'시':[0,0.3,1],'시인':[1,0.3,0.9],'만화':[0,0.8,-0.6],'만화가':[1,0.75,-0.55],'책':[1.2,1.8,1.6],'배송':[-0.3,-0.8,0.1]};
function analogy(a,b,c,measure='cos'){
 const t=VEC[b].map((x,i)=>x-VEC[a][i]+VEC[c][i]);
 const list=Object.keys(VEC).filter(w=>![a,b,c].includes(w)).map(w=>({word:w,score:measure==='cos'?cosine(t,VEC[w]):dot(t,VEC[w])}));
 return {target:t,list:list.sort((x,y)=>y.score-x.score)};
}
/* 3장 더 깊이: fastText식 글자 n-gram 겹침 */
function charNgrams(w,n=2){const s='<'+w+'>',a=Array.from(s),g=new Set();for(let i=0;i+n<=a.length;i++)g.add(a.slice(i,i+n).join(''));return g;}
function jaccard(A,B){const a=new Set(A),b=new Set(B);const inter=[...a].filter(x=>b.has(x)).length,uni=new Set([...a,...b]).size;return uni?inter/uni:0;}

/* 4장: 토픽 비율. 주제-낱말 분포는 고정(교육용 가정값)하고, 문서의 주제 비율 θ만 EM으로 추정한다(LDA 접어 넣기 근사). */
const TOPICS={names:['배송','환불·교환','신간·작가'],words:['배송','늦어요','주소','환불','교환','파본','신간','작가','언제'],
 phi:[[0.42,0.2,0.2,0.03,0.03,0.02,0.02,0.02,0.06],[0.04,0.04,0.02,0.4,0.24,0.18,0.02,0.02,0.04],[0.03,0.02,0.02,0.02,0.02,0.02,0.4,0.33,0.14]]};
function topicMix(counts,alpha,iters=200){
 const K=TOPICS.phi.length;let th=Array(K).fill(1/K);const n=sum(counts);
 for(let it=0;it<iters;it++){
  const acc=Array(K).fill(0);
  counts.forEach((c,w)=>{if(!c)return;const p=TOPICS.phi.map((row,k)=>row[w]*th[k]),s=sum(p);p.forEach((x,k)=>acc[k]+=c*x/s);});
  th=acc.map(a=>(a+alpha)/(n+K*alpha));
 }
 return th;
}

/* 5장: 나이브 베이즈와 부정 범위. 학습 리뷰 12개(교육용). */
const REVIEWS=[['배송 빠르고 좋아요',1],['내용이 좋아요 추천해요',1],['생각보다 나쁘지 않아요',1],['포장이 나쁘지 않아요',1],['번역이 매끄러워 좋아요',1],['좋아요 정말 좋아요',1],
 ['포장이 안 좋아요',0],['내용이 별로 좋지 않아요',0],['배송이 느려서 나빠요',0],['번역이 별로예요',0],['파본이라 나빠요',0],['표지가 좋지 않아요',0]];
/* 한국어 부정: '안·못'은 뒤 낱말을, '않아요·않았어요'는 앞 낱말을 뒤집는다(이 책의 단순 규칙). */
function negScope(tokens){
 const t=tokens.slice();
 for(let i=0;i<t.length;i++){
  if((t[i]==='안'||t[i]==='못')&&i+1<t.length&&!t[i+1].startsWith('NOT_'))t[i+1]='NOT_'+t[i+1];
  if(/^않/.test(t[i])&&i>0&&!t[i-1].startsWith('NOT_'))t[i-1]='NOT_'+t[i-1];
 }
 return t;
}
function nbTrain(scope){
 const c=[{},{}],tot=[0,0],docs=[0,0];
 for(const [s,y] of REVIEWS){const t=scope?negScope(s.split(' ')):s.split(' ');docs[y]++;for(const w of t){c[y][w]=(c[y][w]||0)+1;tot[y]++;}}
 const V=new Set([...Object.keys(c[0]),...Object.keys(c[1])]).size;return {c,tot,docs,V};
}
function nbClassify(text,scope,alpha=1){
 const m=nbTrain(scope),t=scope?negScope(text.split(' ')):text.split(' ');
 const prior=Math.log(m.docs[1]/m.docs[0]);
 const parts=t.map(w=>{const p1=((m.c[1][w]||0)+alpha)/(m.tot[1]+alpha*m.V),p0=((m.c[0][w]||0)+alpha)/(m.tot[0]+alpha*m.V);return {w,llr:Math.log(p1/p0),seen:!!(m.c[1][w]||m.c[0][w])};});
 const score=prior+sum(parts.map(p=>p.llr));
 return {tokens:t,parts,score,label:score>=0?1:0,pPos:1/(1+Math.exp(-score))};
}
/* 5장 더 깊이: 불균형 데이터에서 정확도와 macro-F1 */
function f1Scores(tp,fp,fn){const p=tp+fp?tp/(tp+fp):0,r=tp+fn?tp/(tp+fn):0;return p+r?2*p*r/(p+r):0;}
function majorityBaseline(pos,neg){const acc=Math.max(pos,neg)/(pos+neg),fMaj=f1Scores(Math.max(pos,neg),Math.min(pos,neg),0);return {acc,macroF1:(fMaj+0)/2};}

/* 6장: 은닉 마르코프 모형과 비터비. 확률은 교육용 가정값. book은 명사(책)와 동사(예약하다) 둘 다 된다. */
const HMM={tags:['PRON','AUX','VERB','DET','NOUN'],
 start:[0.45,0.3,0.1,0.1,0.05],
 trans:[[0.02,0.25,0.45,0.08,0.2],[0.6,0.02,0.3,0.05,0.03],[0.15,0.02,0.03,0.6,0.2],[0.01,0.01,0.03,0.01,0.94],[0.1,0.25,0.25,0.2,0.2]],
 emit:{I:[0.6,0,0,0,0],you:[0.4,0,0,0,0],can:[0,0.9,0.02,0,0.01],book:[0,0,0.05,0,0.3],read:[0,0,0.3,0,0],the:[0,0,0,0.7,0],a:[0,0,0,0.3,0],table:[0,0,0,0,0.25]}};
function viterbi(words,bookVerb){
 const T=HMM.tags.length,em=w=>w==='book'?HMM.emit.book.map((p,k)=>k===2?bookVerb:p):HMM.emit[w];
 const lg=x=>x>0?Math.log(x):-Infinity;
 let v=HMM.tags.map((_,k)=>lg(HMM.start[k])+lg(em(words[0])[k]));const back=[];
 for(let i=1;i<words.length;i++){
  const e=em(words[i]),nv=[],bp=[];
  for(let k=0;k<T;k++){let best=-Infinity,arg=0;for(let j=0;j<T;j++){const s=v[j]+lg(HMM.trans[j][k]);if(s>best){best=s;arg=j;}}nv.push(best+lg(e[k]));bp.push(arg);}
  v=nv;back.push(bp);
 }
 let k=v.indexOf(Math.max(...v));const logp=v[k],path=[k];
 for(let i=back.length-1;i>=0;i--){k=back[i][k];path.unshift(k);}
 return {tags:path.map(i=>HMM.tags[i]),logp};
}
function mostFrequentTag(w){const e=HMM.emit[w];return HMM.tags[e.indexOf(Math.max(...e))];}

/* 7장: 바이그램 언어 모형과 더하기-k 평활. 문의함을 학습 자료로 쓴다. */
function bigramModel(docs,mode='josa'){
 const big={},uni={},V=new Set(['</s>']);
 for(const d of docs){const t=['<s>',...tokenize(d,mode),'</s>'];t.forEach(w=>{if(w!=='<s>')V.add(w);});for(let i=0;i+1<t.length;i++){const k=t[i]+' '+t[i+1];big[k]=(big[k]||0)+1;uni[t[i]]=(uni[t[i]]||0)+1;}}
 return {big,uni,V:V.size};
}
function perplexity(model,sentence,k,mode='josa'){
 const t=['<s>',...tokenize(sentence,mode),'</s>'],steps=[];
 for(let i=0;i+1<t.length;i++){const c=model.big[t[i]+' '+t[i+1]]||0,cv=model.uni[t[i]]||0,den=cv+k*model.V;steps.push({from:t[i],to:t[i+1],count:c,p:den?(c+k)/den:0});}
 const zero=steps.some(s=>s.p===0),H=zero?Infinity:-sum(steps.map(s=>Math.log(s.p)))/steps.length;
 return {steps,finite:!zero,pp:zero?Infinity:Math.exp(H),bits:zero?Infinity:H/Math.LN2};
}
/* 7장 더 깊이: 기울기가 T단계를 거슬러 가며 곱해지는 크기 */
const gradientFlow=(w,T)=>Math.pow(Math.abs(w),T);

/* 8장: 어텐션 정렬. 원문 5어절의 키와 영어 출력 단어의 질의(교육용 4차원 벡터). */
const ALIGN={src:['파본','책','교환은','언제','되나요'],keys:[[0.3,1,0,0],[1,0.2,0,0],[0.2,0,1,0.1],[0,0,0.1,1],[0,0,0.5,0.5]],
 tgt:{When:[0,0,0.2,1],exchange:[0.1,0,1,0.2],damaged:[0.4,1,0,0],book:[1,0.3,0,0]}};
function attend(word,beta){const q=ALIGN.tgt[word],scores=ALIGN.keys.map(k=>beta*dot(q,k)),w=softmax(scores);const ctx=ALIGN.keys[0].map((_,d)=>sum(ALIGN.keys.map((k,i)=>w[i]*k[d])));return {scores,weights:w,context:ctx,best:w.indexOf(Math.max(...w))};}
/* 8장: BLEU. 0인 정밀도는 분자·분모에 1을 더하는 평활(교육용). */
function ngrams(t,n){const m={};for(let i=0;i+n<=t.length;i++){const k=t.slice(i,i+n).join(' ');m[k]=(m[k]||0)+1;}return m;}
function bleu(cand,ref,maxN=4){
 const c=cand.split(' '),r=ref.split(' '),prec=[];
 for(let n=1;n<=maxN;n++){const cn=ngrams(c,n),rn=ngrams(r,n),total=Math.max(sum(Object.values(cn)),0);let match=0;for(const [g,x] of Object.entries(cn))match+=Math.min(x,rn[g]||0);prec.push({n,match,total,p:total?(match?match/total:1/(total+1)):0});}
 const bp=c.length>=r.length?1:Math.exp(1-r.length/c.length);
 const geo=prec.every(p=>p.p>0)?Math.exp(sum(prec.map(p=>Math.log(p.p)))/maxN):0;
 return {prec,bp,score:100*bp*geo,clen:c.length,rlen:r.length};
}
/* 9장 더 깊이: ROUGE-1·ROUGE-L 재현율, 질의응답 EM·F1 */
function lcs(a,b){const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]+1:Math.max(d[i-1][j],d[i][j-1]);return d[a.length][b.length];}
function rouge(sys,ref){const s=sys.split(' '),r=ref.split(' '),rn=ngrams(r,1),sn=ngrams(s,1);let m=0;for(const [g,x] of Object.entries(rn))m+=Math.min(x,sn[g]||0);return {r1:m/r.length,rl:lcs(s,r)/r.length};}
function qaScore(pred,gold){const p=pred.trim().split(/\s+/),g=gold.trim().split(/\s+/),gc={};g.forEach(x=>gc[x]=(gc[x]||0)+1);let common=0;p.forEach(x=>{if(gc[x]>0){common++;gc[x]--;}});const prec=common/p.length,rec=common/g.length;return {em:pred.trim()===gold.trim()?1:0,f1:common?2*prec*rec/(prec+rec):0};}

/* 9장: 청킹. 약관 문장 12개의 토큰 수(교육용)와, 답이 걸친 문장 6·7(0부터). */
const TERMS={lens:[40,55,30,60,45,35,50,70,40,30,55,45],answer:[6,7]};
function chunkDoc(size,strategy){
 const L=TERMS.lens,starts=[];let pos=0;const sStart=L.map(l=>{const s=pos;pos+=l;return s;}),total=pos;
 const chunks=[];
 if(strategy==='fixed'){for(let s=0;s<total;s+=size)chunks.push([s,Math.min(total,s+size)]);}
 else{let cs=0,cur=0;L.forEach((l,i)=>{if(cur>0&&cur+l>size){chunks.push([cs,sStart[i]]);cs=sStart[i];cur=0;}cur+=l;});chunks.push([cs,total]);}
 const a0=sStart[TERMS.answer[0]],a1=sStart[TERMS.answer[1]]+L[TERMS.answer[1]];
 const holder=chunks.findIndex(([s,e])=>s<=a0&&e>=a1),touched=chunks.filter(([s,e])=>e>a0&&s<a1).length;
 const top3=sum(chunks.map(([s,e])=>e-s).sort((x,y)=>y-x).slice(0,3));
 return {chunks,total,answer:[a0,a1],holder,whole:holder>=0,touched,top3,starts:sStart};
}

/* 10장: 개체 연결. 언급 '한강'의 후보와 사전 확률(교육용 가정값), 설명 낱말. */
const KB=[{id:'작가 한강',prior:0.35,desc:['소설','작가','신간','번역본','책']},{id:'강 한강',prior:0.55,desc:['서울','강변','산책길','다리','사진집']},{id:'식당 한강',prior:0.10,desc:['메뉴','예약','식당','점심']}];
function linkEntity(context,lambda,nil=0.15){
 const ctx=context.split(' ').filter(w=>w!=='한강');
 const list=KB.map(e=>{const sim=jaccard(ctx,e.desc);return {id:e.id,prior:e.prior,sim,score:lambda*e.prior+(1-lambda)*sim};}).sort((a,b)=>b.score-a.score);
 return {list,pick:list[0].score<nil?'NIL(목록에 없음)':list[0].id};
}

/* 11장: 대화 상태 추적. 다섯 턴의 갱신(시나리오)과 세 가지 갱신 방식. */
const DIALOG=[
 {say:'주문한 소설책 배송지를 부산으로 바꿔 주세요',ops:[['요청','set','배송지 변경'],['책','set','소설책'],['배송지','set','부산']]},
 {say:'받는 날은 금요일로 해 주세요',ops:[['날짜','set','금요일']]},
 {say:'아니다, 부산 말고 대구로요',ops:[['배송지','fix','대구']]},
 {say:'책은 그대로예요',ops:[]},
 {say:'날짜는 상관없어요',ops:[['날짜','clear','']]}];
function dstStates(policy){
 let st={};const gold=[],got=[];let g={};
 for(const turn of DIALOG){
  g={...g};for(const [k,op,v] of turn.ops){if(op==='clear')delete g[k];else g[k]=v;}gold.push(g);
  const base=policy==='lastonly'?{}:{...st};
  for(const [k,op,v] of turn.ops){if(op==='clear'){if(policy!=='append')delete base[k];}else if(op==='fix'&&policy==='append')base[k]=(base[k]?base[k]+', ':'')+v;else base[k]=v;}
  st=base;got.push(st);
 }
 const same=(a,b)=>JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(b).sort());
 return {gold,got,ok:got.map((s,i)=>same(s,gold[i]))};
}
const jga=(ok,t)=>ok.slice(0,t).filter(Boolean).length/t;

/* 11장: 구조화 출력. 토큰마다 형식에 맞는 토큰을 고를 확률 p가 독립이라고 가정한 교육용 모형. */
function jsonValidity(p,L=24,retries=3){const one=Math.pow(p,L);return {prompt:one,retry:1-Math.pow(1-one,retries),constrained:1,expectedCalls:one>0?Math.min(retries,(1-Math.pow(1-one,retries))/one):retries};}

/* 12장: 긴 문맥 바늘 찾기. 원본이 말한 경향(중간 깊이 손실, 다중 추론이 먼저 무너짐)을 흉내 낸 교육용 식이며 측정값이 아니다. */
const LENGTHS=[4,8,16,32,64,128];
function needleAcc(lenK,depth,task){
 const m=Math.min(1,Math.max(0,Math.log2(lenK/4)/5)),mid=Math.sin(Math.PI*depth);
 return task==='multi'?Math.max(0,0.95-0.45*m-0.15*m*mid):Math.max(0,0.99-0.1*m*mid);
}
function needleGrid(lenK,task){const depths=[0,0.25,0.5,0.75,1],acc=depths.map(d=>needleAcc(lenK,d,task));return {depths,acc,min:Math.min(...acc)};}
function effectiveLength(task,th=0.9){let best=0;for(const L of LENGTHS)if(needleGrid(L,task).min>=th)best=L;return best;}
/* 12장 더 깊이: 다국어 토큰 비용 */
const fertilityCost=(words,tokPerWord)=>words*tokPerWord;

const A06Math={sum,round,softmax,dot,norm,cosine,INBOX,JOSA,stripJosa,tokenize,vocab,matchDocs,learnBpe,applyBpe,BPE_WORDS,idf,tfidfDoc,bm25,skipPairs,contextCounts,VEC,analogy,charNgrams,jaccard,TOPICS,topicMix,REVIEWS,negScope,nbTrain,nbClassify,f1Scores,majorityBaseline,HMM,viterbi,mostFrequentTag,bigramModel,perplexity,gradientFlow,ALIGN,attend,ngrams,bleu,lcs,rouge,qaScore,TERMS,chunkDoc,KB,linkEntity,DIALOG,dstStates,jga,jsonValidity,LENGTHS,needleAcc,needleGrid,effectiveLength,fertilityCost};
if(typeof module!=='undefined')module.exports=A06Math;else root.A06Math=A06Math;
})(typeof window!=='undefined'?window:globalThis);
