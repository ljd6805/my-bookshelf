/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 가상의 온라인 서점 "책다락"의 고객 지원 도우미 "다락 도우미". 모든 단가·점수·유사도는 교육용 가정값이다. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0);

/* 1장: "반품 신청 기한은 ___" 다음에 올 후보와 교육용 로짓 */
const CANDIDATES=[['14일',2.6],['7일',1.5],['30일',1.1],['상황에 따라',0.4],['환불 불가',-0.6]];
function softmax(logits,T){
 if(T<=0){const m=logits.indexOf(Math.max(...logits));return logits.map((_,i)=>i===m?1:0);}
 const m=Math.max(...logits),e=logits.map(z=>Math.exp((z-m)/T)),s=sum(e);return e.map(x=>x/s);
}
/* 온도로 분포를 만든 뒤 top-p: 확률이 큰 순서로 누적 확률이 p 이상이 되는 가장 작은 집합만 남기고 다시 나눈다. */
function sampling(T,topP=1,logits=CANDIDATES.map(c=>c[1])){
 const probs=softmax(logits,T),order=probs.map((p,i)=>[p,i]).sort((a,b)=>b[0]-a[0]),kept=probs.map(()=>false);let c=0;
 for(const [p,i] of order){kept[i]=true;c+=p;if(c>=topP-1e-12)break;}
 const s=sum(probs.filter((_,i)=>kept[i])),final=probs.map((p,i)=>kept[i]?p/s:0);
 const entropy=-sum(final.filter(p=>p>0).map(p=>p*Math.log2(p)));
 return {probs,kept,final,entropy,pTop:final[0],keptCount:kept.filter(Boolean).length};
}

/* 2장: 퓨샷 예시 수와 입력 토큰. base는 시스템 지시+문의 한 건의 토큰 수. */
function fewshot(k,perExample,base=350,queries=10000){
 const perQuery=base+k*perExample;return {perQuery,daily:perQuery*queries,monthly:perQuery*queries*30,ratio:perQuery/base};
}
function comb(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
/* 자기 일관성(다수결): 경로마다 독립적으로 확률 p로 맞고, 틀린 답은 모두 한편이라고 보는 보수적 이진 모형. 동률은 절반 확률로 맞힌다. */
function majority(p,n){let s=0;for(let k=0;k<=n;k++){const w=comb(n,k)*p**k*(1-p)**(n-k);if(2*k>n)s+=w;else if(2*k===n)s+=w/2;}return s;}

/* 3장: 주문 정보 JSON 스키마와 작은 어휘. 스키마가 다음 토큰으로 허용하는 것만 남기는 제약 디코딩을 흉내 낸다. */
const SCHEMA=[['"order_id"','string'],['"qty"','integer'],['"refund"','boolean']];
const VOCAB=['{','}',':',',','"order_id"','"qty"','"refund"','"A-1042"','"네, 확인했습니다"','2','true','false'];
const TARGET=['{','"order_id"',':','"A-1042"',',','"qty"',':','2',',','"refund"',':','true','}'];
const TYPE_OF=t=>t==='true'||t==='false'?'boolean':/^-?\d+$/.test(t)?'integer':/^".*"$/.test(t)&&!SCHEMA.some(s=>s[0]===t)?'string':null;
function allowedNext(prefix){
 if(!prefix.length)return {state:'시작',allowed:['{']};
 let used=[],key=null,state='키',done=false;
 for(let i=1;i<prefix.length;i++){const t=prefix[i];
  if(state==='키'){key=t;used.push(t);state='콜론';}
  else if(state==='콜론')state='값';
  else if(state==='값')state='쉼표';
  else if(state==='쉼표'){if(t==='}'){done=true;state='끝';}else state='키';}
 }
 const left=SCHEMA.filter(s=>!used.includes(s[0]));
 if(done)return {state:'끝',allowed:[]};
 if(state==='키')return {state:'키',allowed:left.map(s=>s[0])};
 if(state==='콜론')return {state:'콜론',allowed:[':']};
 if(state==='값'){const type=SCHEMA.find(s=>s[0]===key)[1];return {state:'값',type,allowed:VOCAB.filter(t=>TYPE_OF(t)===type)};}
 return {state:'쉼표',allowed:left.length?[',']:['}']};
}
function jsonMask(step){const s=Math.max(0,Math.min(step,TARGET.length)),prefix=TARGET.slice(0,s),r=allowedNext(prefix);return {...r,prefix,next:TARGET[s]||null,blocked:VOCAB.length-r.allowed.length};}

/* 4장: 컨텍스트 창 예산. 도구 150토큰, 대화 한 턴 200토큰, 검색 청크 400토큰으로 가정한다. */
function contextBudget({window=128000,tools=50,turns=20,chunks=10,strategy='none'}){
 const prune=strategy==='prune'||strategy==='both',summ=strategy==='summary'||strategy==='both';
 const toolTok=Math.round(tools*(prune?0.25:1))*150,keep=summ?Math.min(turns,3):turns,histTok=keep*200+(summ&&turns>3?100:0);
 const parts=[['시스템 지시',500],['도구 정의',toolTok],['대화 기록',histTok],['검색 근거',chunks*400],['현재 질문',200],['답변 예약',4000]];
 const used=sum(parts.map(p=>p[1]));return {parts,used,window,free:window-used,share:used/window,over:used>window};
}

/* 5장: 벡터 저장 용량과 전수 비교 계산량. GB는 10⁹바이트. */
function vectorStore(dims,precision,millions){
 const bytesPer=precision==='binary'?dims/8:dims*4,n=millions*1e6;return {bytesPer,totalGB:bytesPer*n/1e9,macs:n*dims,ratio:dims*4/bytesPer};
}
/* 역순위 융합(RRF): 순위 목록마다 1/(k+순위)를 더한다. */
const rrf=(ranks,k=60)=>sum(ranks.map(r=>1/(k+r)));

/* 6장: Llama 2 7B 모양(층 32, d 4096, MLP 11008, 어휘 32000)에 LoRA를 붙일 때의 학습 파라미터와 메모리 하한 */
const LLAMA={layers:32,d:4096,ff:11008,vocab:32000};
function baseParams(m=LLAMA){return m.layers*(4*m.d*m.d+3*m.d*m.ff+2*m.d)+2*m.vocab*m.d+m.d;}
const loraMatrix=(dout,din,r)=>({full:dout*din,lora:r*(dout+din),share:r*(dout+din)/(dout*din)});
const TARGETS={q:[[4096,4096]],qv:[[4096,4096],[4096,4096]],qkvo:[[4096,4096],[4096,4096],[4096,4096],[4096,4096]],all:[[4096,4096],[4096,4096],[4096,4096],[4096,4096],[11008,4096],[11008,4096],[4096,11008]]};
function lora(target,r,method,m=LLAMA){
 const P=baseParams(m),T=m.layers*sum(TARGETS[target].map(([o,i])=>r*(o+i)));
 /* 바이트 계산: 원본 레슨의 회계처럼 fp16 가중치 2 + 기울기 2 + Adam 상태 4 = 학습하는 파라미터당 8바이트. 활성값은 넣지 않는다. */
 const mem=method==='full'?P*8:method==='lora'?P*2+T*8:P*0.5+T*8,trainable=method==='full'?P:T;
 return {base:P,trainable,share:trainable/P,memGB:mem/1e9,frozenGB:(method==='full'?0:P*(method==='lora'?2:0.5))/1e9};
}

/* 7장: 도구 호출 지연. 모델 한 차례 m ms, 도구 하나 t ms. 순차는 도구마다 왕복, 병렬은 한 번에 모두 요청한다. */
function toolLatency(n,t,mode,m=800){
 const seq=(n+1)*m+n*t,par=2*m+t;return {seq,par,total:mode==='parallel'?par:seq,trips:mode==='parallel'?2:n+1,saved:1-par/seq};
}
/* MCP 요청 판정(원본 커리큘럼이 설명한 2026-07-28 개정 규칙). 네트워크 없이 규칙만 평가한다. */
const MCP_VERSION='2026-07-28';
function mcpRequest(variant){
 const meta={'io.modelcontextprotocol/protocolVersion':MCP_VERSION,'io.modelcontextprotocol/clientCapabilities':{}};
 const body={jsonrpc:'2.0',id:7,method:variant==='call'?'tools/call':'tools/list',params:variant==='call'?{name:'lookup_order',arguments:{order_id:'A-1042'}}:{}};
 if(variant!=='nometa')body.params._meta=variant==='noversion'?{'io.modelcontextprotocol/clientCapabilities':{}}:variant==='oldversion'?{...meta,'io.modelcontextprotocol/protocolVersion':'2025-11-25'}:meta;
 const headers={'MCP-Protocol-Version':variant==='header'?'2025-11-25':(variant==='oldversion'?'2025-11-25':MCP_VERSION),'Mcp-Method':body.method};if(variant==='call')headers['Mcp-Name']='lookup_order';
 return {body,headers};
}
function mcpCheck(variant,transport){
 const {body,headers}=mcpRequest(variant),meta=body.params._meta,err=(code,name,data)=>({ok:false,code,name,data,http:transport==='http'?(code===-32020||code===-32022?400:200):null});
 if(transport==='http'&&meta&&typeof meta['io.modelcontextprotocol/protocolVersion']==='string'&&(headers['MCP-Protocol-Version']!==meta['io.modelcontextprotocol/protocolVersion']||headers['Mcp-Method']!==body.method))return {...err(-32020,'HeaderMismatch'),body,headers};
 if(!meta||typeof meta['io.modelcontextprotocol/protocolVersion']!=='string'||typeof meta['io.modelcontextprotocol/clientCapabilities']!=='object')return {...err(-32602,'Invalid Params'),body,headers};
 const v=meta['io.modelcontextprotocol/protocolVersion'];
 if(v!==MCP_VERSION)return {...err(-32022,'UnsupportedProtocolVersionError',{supported:[MCP_VERSION],requested:v}),body,headers};
 const result=body.method==='tools/list'?{resultType:'complete',tools:['get_shipping','lookup_order'],ttlMs:60000,cacheScope:'public'}:{resultType:'complete',content:'A-1042 · 2권 · 결제 30,000원'};
 return {ok:true,code:0,name:'result',result,http:transport==='http'?200:null,body,headers};
}
const integrations=(hosts,servers)=>({custom:hosts*servers,protocol:hosts+servers});

/* 8장: 통과율의 Wilson 95% 구간과 판정자·사람의 일치도(Cohen의 카파) */
function wilson(k,n,z=1.96){
 if(!n)return {lo:0,hi:0,p:0,width:0};const p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,s=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d,lo=Math.max(0,c-s),hi=Math.min(1,c+s);
 return {lo,hi,p,width:hi-lo};
}
function kappa(n,humanPass,sens,spec){
 const P=n*humanPass,F=n-P,a=P*sens,b=P-a,d=F*spec,c=F-d,po=(a+d)/n,pj=(a+c)/n,pe=humanPass*pj+(1-humanPass)*(1-pj);
 return {a,b,c,d,po,pe,kappa:pe>=1?0:(po-pe)/(1-pe),judgePass:pj};
}

/* 10장: 의미 캐시. 새 질문과 캐시에 있는 질문의 교육용 유사도와, 두 질문이 정말 같은 답을 원하는지(same) */
const SEM_PAIRS=[
 ['주문한 책 언제 도착해요?','배송 언제 와요?',0.96,true],['반품은 며칠 안에 해야 하나요?','반품 기한이 며칠이에요?',0.97,true],['주문을 취소하려면?','주문 취소하고 싶어요',0.98,true],
 ['영수증 재발행 방법','영수증 다시 받기',0.95,true],['환불은 얼마나 걸려요?','반품은 얼마나 걸려요?',0.95,false],['전자책도 환불되나요?','종이책도 환불되나요?',0.95,false],
 ['기업 회원 환불 정책','일반 회원 환불 정책',0.94,false],['비밀번호 바꾸는 법','비밀번호를 잊었어요',0.93,true],['주소를 바꾸고 싶어요','배송지 변경하고 싶어요',0.92,true],
 ['제주도 배송 되나요?','해외 배송 되나요?',0.91,false],['쿠폰 사용 오류','쿠폰이 적용이 안 돼요',0.90,true],['포인트 적립 방법','포인트 소멸 시기',0.86,false]];
function semCache(threshold,pairs=SEM_PAIRS){
 const hit=pairs.map(p=>p[2]>=threshold-1e-9),good=pairs.filter((p,i)=>hit[i]&&p[3]).length,wrong=pairs.filter((p,i)=>hit[i]&&!p[3]).length,missed=pairs.filter((p,i)=>!hit[i]&&p[3]).length;
 return {hit,hits:good+wrong,good,wrong,missed,total:pairs.length,hitRate:(good+wrong)/pairs.length};
}
/* 프롬프트 캐시: 쓰기 1번 뒤 읽기 r번일 때 접두부의 평균 비용 배수(캐시 없는 입력 = 1). 원본 커리큘럼 기준 단가 배수.
   1시간 쓰기 배수 2.0은 Anthropic 공식 문서(확인일 2026-10-08)로 바로잡은 값(원본 레슨은 1.5로 적음). */
const PROVIDERS={a5:{name:'명시적 표시 · 5분',write:1.25,read:0.10,min:1024},a1h:{name:'명시적 표시 · 1시간',write:2.0,read:0.10,min:1024},auto:{name:'자동 접두부',write:1.0,read:0.5,min:1024}};
function promptCache(reads,provider,layout='stable',prefix=15000,tail=200){
 const P=PROVIDERS[provider];let mult;
 if(prefix<P.min)mult=1;else if(layout==='timestamp')mult=P.write;else mult=(P.write+P.read*reads)/(1+reads);
 return {mult,saving:1-mult,effective:prefix*mult+tail,plain:prefix+tail,cached:prefix>=P.min&&layout!=='timestamp'};
}

/* 9장: 주입 탐지 분류기의 교육용 점수(높을수록 공격 같음). 공격 20개, 정상 문의 40개 */
const ATTACK_SCORES=[0.97,0.95,0.94,0.92,0.91,0.89,0.88,0.86,0.84,0.81,0.78,0.74,0.70,0.66,0.61,0.55,0.48,0.41,0.33,0.22];
const NORMAL_SCORES=[0.02,0.03,0.04,0.05,0.05,0.06,0.07,0.08,0.08,0.09,0.10,0.11,0.12,0.13,0.14,0.15,0.16,0.18,0.19,0.21,0.22,0.24,0.26,0.28,0.30,0.32,0.35,0.38,0.41,0.44,0.47,0.51,0.55,0.59,0.63,0.68,0.72,0.77,0.83,0.90];
function guard(threshold,attackShare,daily=10000){
 const tpr=ATTACK_SCORES.filter(s=>s>=threshold-1e-9).length/ATTACK_SCORES.length,fpr=NORMAL_SCORES.filter(s=>s>=threshold-1e-9).length/NORMAL_SCORES.length;
 const att=daily*attackShare,tp=att*tpr,fp=(daily-att)*fpr;return {tpr,fpr,tp,fp,fn:att-tp,precision:tp+fp>0?tp/(tp+fp):0};
}
const layeredMiss=misses=>misses.reduce((p,m)=>p*m,1);

/* 11장: 환불 요청을 처리하는 상태 그래프를 한 단계씩 실행한다. */
const GRAPH_PLAN=[['agent','모델이 lookup_order 호출을 정함'],['tools','lookup_order 실행 · 주문 확인'],['agent','모델이 issue_refund 호출을 정함'],['refund','issue_refund 실행 · 환불 처리'],['agent','고객에게 결과 답변'],['END','종료']];
function graphRun(reducer,interrupt){
 const snaps=[{node:'START',note:'고객: "A-1042 환불해 주세요"',messages:1,refunded:false,paused:false,approved:false}];let msgs=1,refunded=false;
 for(const [node,note] of GRAPH_PLAN){
  if(node==='refund'&&interrupt==='before'){snaps.push({node:'review',note:'환불 실행 직전에 멈춤 · 사람의 승인을 기다림',messages:msgs,refunded,paused:true,approved:false});}
  if(node!=='END')msgs=reducer==='add'?msgs+1:1;if(node==='refund')refunded=true;
  snaps.push({node,note,messages:msgs,refunded,paused:false,approved:interrupt==='before'&&refunded});
  if(node==='refund'&&interrupt==='after')snaps.push({node:'review',note:'이미 환불한 뒤에 멈춤 · 승인은 뒤늦음',messages:msgs,refunded,paused:true,approved:false});
 }
 return snaps.map((s,i)=>({...s,checkpoint:i}));
}

/* 12장·표지: 다락 도우미의 한 달 LLM 비용. 단가는 원본 레슨의 계산 예시(백만 토큰당 달러). 캐시 적중 요청은 LLM 비용 0으로 본다. */
const PRICE={strong:[2.5,10],mini:[0.15,0.6]};
function monthlyCost({dau=10000,qpd=5,hit=0.35,mini=0,inTok=1500,outTok=400}={}){
 const req=dau*qpd*30,calls=req*(1-hit),per=([i,o])=>(inTok*i+outTok*o)/1e6;
 const strong=calls*(1-mini)*per(PRICE.strong),cheap=calls*mini*per(PRICE.mini),total=strong+cheap;
 return {requests:req,calls,strong,cheap,total,perRequest:total/req,input:calls*((1-mini)*inTok*PRICE.strong[0]+mini*inTok*PRICE.mini[0])/1e6};
}

const A12Math={sum,CANDIDATES,softmax,sampling,fewshot,comb,majority,SCHEMA,VOCAB,TARGET,allowedNext,jsonMask,contextBudget,vectorStore,rrf,LLAMA,baseParams,loraMatrix,TARGETS,lora,toolLatency,MCP_VERSION,mcpRequest,mcpCheck,integrations,wilson,kappa,SEM_PAIRS,semCache,PROVIDERS,promptCache,ATTACK_SCORES,NORMAL_SCORES,guard,layeredMiss,GRAPH_PLAN,graphRun,PRICE,monthlyCost};
if(typeof module!=='undefined')module.exports=A12Math;else root.A12Math=A12Math;
})(typeof window!=='undefined'?window:globalThis);
