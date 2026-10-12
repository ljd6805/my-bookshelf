/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   단위: 정보량과 길이는 모두 비트(로그 밑 2). 글자는 유니코드 코드 포인트 하나(한글 완성형 한 음절 = 한 글자)이고,
   메시지 사이의 줄바꿈('\n')도 한 글자로 센다. 확률 모델은 실험용 작은 모델이며 실제 언어 모델이 아니다. */
(function(root){
'use strict';
const MSG=root.ITMessages||(typeof require!=='undefined'?require('./messages.js'):null);
const log2=Math.log2,chars=s=>Array.from(String(s));
const info=p=>p>0?-log2(p):Infinity;
const TRAIN=50; // 윤슬의 앞 50개는 학습, 뒤 20개는 시험
function text(name,from=0,to){const list=MSG[name];return MSG.join(list.slice(from,to??list.length));}
const corpus={
 yunseul:()=>text('yunseul'),train:()=>text('yunseul',0,TRAIN),test:()=>text('yunseul',TRAIN),
 doyoon:()=>text('doyoon'),doyoonA:()=>text('doyoon',0,15),doyoonB:()=>text('doyoon',15),
 first:n=>text('yunseul',0,n)
};
let ALPHA=null;
/* 알파벳: 두 묶음에 나오는 글자 전체(코드 포인트 순). 모델은 이 글자들에만 확률을 준다. */
function alphabet(){if(!ALPHA)ALPHA=[...new Set(chars(corpus.yunseul()+'\n'+corpus.doyoon()))].sort();return ALPHA;}
function counts(list){const m=new Map();for(const x of list)m.set(x,(m.get(x)||0)+1);return m;}
function entropy(values){const v=[...(values instanceof Map?values.values():values)].filter(x=>x>0),n=v.reduce((a,b)=>a+b,0);if(!n)return 0;return v.reduce((h,c)=>h-c/n*log2(c/n),0);}
function sorted(map){return [...map.entries()].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));}
function stats(t){const c=chars(t),m=counts(c);return {n:c.length,counts:sorted(m),distinct:m.size,H:entropy(m)};}
/* 경험적 조건부 엔트로피 H(X | 앞 k글자). 글 처음은 줄바꿈이 앞에 있다고 본다. */
function condEntropy(t,k){
 const c=['\n','\n',...chars(t)],groups=new Map();let n=0;
 for(let i=2;i<c.length;i++){const ctx=c.slice(i-k,i).join('');if(!groups.has(ctx))groups.set(ctx,new Map());const g=groups.get(ctx);g.set(c[i],(g.get(c[i])||0)+1);n++;}
 let h=0;for(const g of groups.values()){const m=[...g.values()].reduce((a,b)=>a+b,0);h+=m/n*entropy(g);}
 return {H:h,contexts:groups.size,n};
}
/* 연쇄 법칙: 이웃한 글자 쌍 (앞, 지금)에서 H(앞, 지금) = H(앞) + H(지금 | 앞). */
function chain(t){
 const c=['\n',...chars(t)],pairs=[],first=[];
 for(let i=1;i<c.length;i++){pairs.push(c[i-1]+'\u0000'+c[i]);first.push(c[i-1]);}
 const Hjoint=entropy(counts(pairs)),Hprev=entropy(counts(first)),Hcur=entropy(counts(c.slice(1)));
 return {Hjoint,Hprev,Hcur,Hcond:condEntropy(t,1).H,MI:Hcur-condEntropy(t,1).H};
}
/* 허프만 부호. 가장 가벼운 두 마디를 합치고, 무게가 같으면 먼저 만든 마디를 앞에 둔다(결과가 늘 같게).
   왼쪽 가지는 0, 오른쪽은 1. 글자가 하나뿐이면 부호 '0'을 준다. */
function huffman(items){
 const live=items.filter(x=>x.w>0);if(!live.length)return null;
 let id=0;const q=live.map(x=>({w:x.w,sym:x.sym,id:id++}));
 const nodes=[...q];
 while(q.length>1){q.sort((a,b)=>a.w-b.w||a.id-b.id);const a=q.shift(),b=q.shift(),n={w:a.w+b.w,left:a,right:b,id:id++};q.push(n);nodes.push(n);}
 const rootNode=q[0],codes=new Map();
 (function walk(n,code){if(n.sym!==undefined){codes.set(n.sym,code||'0');return;}walk(n.left,code+'0');walk(n.right,code+'1');})(rootNode,'');
 const W=live.reduce((s,x)=>s+x.w,0),L=live.reduce((s,x)=>s+x.w/W*codes.get(x.sym).length,0);
 return {root:rootNode,codes,L,H:entropy(live.map(x=>x.w)),kraft:kraft(live.map(x=>codes.get(x.sym).length)),merges:nodes.length-live.length};
}
const kraft=lengths=>lengths.reduce((s,l)=>s+2**-l,0);
/* 크래프트 합이 1 이하이면 그 길이로 접두어 부호(정준 부호)를 만들고, 넘으면 null. */
function canonical(lengths){
 if(!lengths.length||lengths.some(l=>!(l>=1))||kraft(lengths)>1+1e-12)return null;
 const order=lengths.map((l,i)=>[l,i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),out=[];let code=0,prev=order[0][0];
 for(const [l,i] of order){code<<=l-prev;prev=l;out[i]=code.toString(2).padStart(l,'0');code++;}
 return out;
}
function encodeWith(codes,t){return chars(t).map(ch=>codes.get(ch)).join('');}
function decodeWith(codes,bits){const inv=new Map([...codes].map(([k,v])=>[v,k]));let out='',cur='';for(const b of bits){cur+=b;if(inv.has(cur)){out+=inv.get(cur);cur='';}}return {text:out,rest:cur};}
/* n-그램 모델: q(x | 앞 k글자) = (c(문맥,x) + α) / (c(문맥) + αV). k = -1은 균등 모델(모든 글자 1/V). */
function model(order,train,alpha=1,abc=alphabet()){
 const V=abc.length,known=new Set(abc),c=[...'\n\n'.slice(0,Math.max(order,0)),...chars(train)],table=new Map(),tot=new Map();
 if(order>=0)for(let i=order;i<c.length;i++){const ctx=c.slice(i-order,i).join(''),key=ctx+'\u0000'+c[i];table.set(key,(table.get(key)||0)+1);tot.set(ctx,(tot.get(ctx)||0)+1);}
 const key=ctx=>order>0?ctx.slice(-order):'';
 const prob=(ctx,x)=>{if(!known.has(x))return 0;if(order<0)return 1/V;const k=key(ctx),n=tot.get(k)||0,f=table.get(k+'\u0000'+x)||0,den=n+alpha*V;return den>0?(f+alpha)/den:1/V;};
 return {order,alpha,V,abc,prob,rows:order<=0?1:tot.size,entries:table.size,maxTotal:Math.max(0,...tot.values()),count:(ctx,x)=>table.get((order>0?ctx.slice(-order):'')+'\u0000'+x)||0,total:ctx=>tot.get(order>0?ctx.slice(-order):'')||0};
}
/* 모델로 글을 부호화할 때의 이상적 길이 Σ −log₂ q. 알파벳 밖 글자나 확률 0인 글자는 따로 알린다. */
function codeLength(m,t){
 const c=chars(t);let ctx='\n\n',bits=0;const per=[],unknown=[],zero=[];
 for(const x of c){const p=m.prob(ctx,x);if(!m.abc.includes(x))unknown.push(x);else if(p===0)zero.push(x);const b=info(p);per.push({ch:x,p,bits:b});bits+=b;ctx=(ctx+x).slice(-2);}
 return {bits,n:c.length,perChar:c.length?bits/c.length:0,per,unknown:[...new Set(unknown)],zero:[...new Set(zero)]};
}
/* 산술 부호(정수 빈도, BigInt로 정확히 계산). 빈도는 100·c + round(100·α)라서 모델의 확률 (c+α)/(n+αV)와 같고(α는 0.01 단위),
   균등 모델은 모두 1.
   구간 [L/D, (L+W)/D) 안에 들어가는 가장 짧은 2진 구간 [m/2^k, (m+1)/2^k)를 부호로 낸다. 글자 수는 따로 안다고 가정한다. */
function freqTable(m,ctx){const a=Math.round(m.alpha*100),f=m.abc.map(x=>BigInt(m.order<0?1:m.count(ctx,x)*100+a));let cum=0n;const cums=f.map(v=>{const c=cum;cum+=v;return c;});return {f,cums,T:cum};}
function arithEncode(m,t){
 const c=chars(t);if(c.some(x=>!m.abc.includes(x)))return {error:'알파벳 밖 글자'};
 let L=0n,W=1n,D=1n,ctx='\n\n',bitsIdeal=0;const steps=[];
 for(const x of c){const {f,cums,T}=freqTable(m,ctx),i=m.abc.indexOf(x);if(f[i]===0n)return {error:'확률 0인 글자',ch:x};steps.push({ch:x,lo:Number(cums[i])/Number(T),hi:Number(cums[i]+f[i])/Number(T),p:Number(f[i])/Number(T)});bitsIdeal-=log2(Number(f[i])/Number(T));L=L*T+W*cums[i];W=W*f[i];D=D*T;ctx=(ctx+x).slice(-2);}
 for(let k=1;k<4096;k++){const s=1n<<BigInt(k),mm=(L*s+D-1n)/D;if((mm+1n)*D<=(L+W)*s)return {bits:mm.toString(2).padStart(k,'0'),k,steps,bitsIdeal,n:c.length};}
 return {error:'너무 긴 글'};
}
function arithDecode(m,bits,n){
 const k=BigInt(bits.length),mm=BigInt('0b'+(bits||'0'));let L=0n,W=1n,D=1n,ctx='\n\n',out='';
 for(let j=0;j<n;j++){const {f,cums,T}=freqTable(m,ctx),target=((mm*D-(L<<k))*T)/(W<<k);let i=cums.findIndex((c,idx)=>c<=target&&target<c+f[idx]);if(i<0)i=0;const x=m.abc[i];out+=x;L=L*T+W*cums[i];W=W*f[i];D=D*T;ctx=(ctx+x).slice(-2);}
 return out;
}
/* LZ78 사전 압축: 이미 본 구절에 한 글자를 붙여 새 구절을 만든다. i번째 구절(1부터)은 번호 ⌈log₂ i⌉비트 + 글자 ⌈log₂ V⌉비트. */
function lz78(t,V=alphabet().length){
 const c=chars(t),dict=new Map([['',0]]),phrases=[];let w='';
 for(const x of c){if(dict.has(w+x)){w+=x;continue;}phrases.push({index:dict.get(w),ch:x,text:w+x});dict.set(w+x,dict.size);w='';}
 if(w)phrases.push({index:dict.get(w),ch:'',text:w});
 const cb=Math.ceil(log2(V));let bits=0;phrases.forEach((p,i)=>{bits+=Math.ceil(log2(i+1))+(p.ch?cb:0);});
 return {phrases,bits,n:c.length,perChar:c.length?bits/c.length:0,longest:phrases.reduce((a,p)=>Math.max(a,chars(p.text).length),0)};
}
/* BPE: 가장 자주 이웃한 두 조각을 하나로 합치기를 되풀이한다. 줄바꿈을 넘어 합치지 않으며, 같은 횟수면 먼저 나온 쌍을 고른다. */
function bpe(t,merges){
 let toks=chars(t);const base=new Set(toks).size,done=[];
 for(let r=0;r<merges;r++){
  const cnt=new Map(),first=new Map();
  for(let i=0;i+1<toks.length;i++){if(toks[i]==='\n'||toks[i+1]==='\n')continue;const k=toks[i]+'\u0000'+toks[i+1];cnt.set(k,(cnt.get(k)||0)+1);if(!first.has(k))first.set(k,i);}
  let best=null;for(const [k,v] of cnt)if(!best||v>best[1]||(v===best[1]&&first.get(k)<first.get(best[0])))best=[k,v];
  if(!best||best[1]<2)break;const [a,b]=best[0].split('\u0000'),next=[];
  for(let i=0;i<toks.length;i++){if(i+1<toks.length&&toks[i]===a&&toks[i+1]===b){next.push(a+b);i++;}else next.push(toks[i]);}
  toks=next;done.push({a,b,count:best[1]});
 }
 const vocab=base+done.length,H=entropy(counts(toks));
 return {tokens:toks,merges:done,vocab,n:toks.length,bitsFixed:toks.length*Math.ceil(log2(vocab)),bitsEntropy:toks.length*H,H};
}
/* 해밍(7,4): 자리 1·2·4는 검사 비트, 3·5·6·7은 데이터. 오류 증후(syndrome)는 틀린 자리 번호와 같다. */
function hammingEncode(d){const [d1,d2,d3,d4]=d.map(Number);return [d1^d2^d4,d1^d3^d4,d1,d2^d3^d4,d2,d3,d4];}
function hammingDecode(c){
 const b=c.map(Number);let s=0;b.forEach((v,i)=>{if(v)s^=i+1;});const fixed=[...b];if(s)fixed[s-1]^=1;
 return {syndrome:s,fixed,data:[fixed[2],fixed[4],fixed[5],fixed[6]]};
}
const h2=p=>p<=0||p>=1?0:-p*log2(p)-(1-p)*log2(1-p);
const capacity=p=>1-h2(p);
/* 정해진 씨앗의 의사 난수(mulberry32). 같은 씨앗이면 늘 같은 잡음이 나온다. */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
/* 이진 대칭 채널 모의 실험: 비트열을 방식(none·rep3·hamming)으로 보호하고 확률 p로 뒤집은 뒤 고친다. */
function channel(bits,p,scheme,seed=7){
 const r=rng(seed),flip=v=>r()<p?v^1:v,data=bits.split('').map(Number);let sent=0,out=[];
 if(scheme==='rep3'){for(const v of data){const y=[flip(v),flip(v),flip(v)];sent+=3;out.push(y[0]+y[1]+y[2]>=2?1:0);}}
 else if(scheme==='hamming'){const pad=[...data];while(pad.length%4)pad.push(0);for(let i=0;i<pad.length;i+=4){const y=hammingEncode(pad.slice(i,i+4)).map(flip);sent+=7;out.push(...hammingDecode(y).data);}out=out.slice(0,data.length);}
 else{out=data.map(flip);sent=data.length;}
 const errors=out.reduce((e,v,i)=>e+(v!==data[i]),0);
 return {out:out.join(''),sent,rate:data.length/sent,errors,ber:data.length?errors/data.length:0};
}
/* 이론값: 부호 없음 p, 3번 반복 3p²(1−p)+p³, 해밍(7,4)는 한 블록에 2개 이상 뒤집힐 확률. */
const theory={none:p=>p,rep3:p=>3*p*p*(1-p)+p**3,hammingBlock:p=>1-(1-p)**7-7*p*(1-p)**6};
/* 확률표 양자화: 각 확률의 −log₂q를 b비트 눈금(0 ~ 표의 최댓값)에 반올림하고 행마다 합을 1로 다시 맞춘다. */
function quantized(m,b){
 if(m.order<0)return {...m,bitsPerEntry:b,step:0};
 const ctxOf=ctx=>m.order>0?ctx.slice(-m.order):'',levels=2**b-1,top=info(m.alpha/(m.maxTotal+m.alpha*m.V)),step=top/levels,cache=new Map();
 const qrow=ctx=>{const key=ctxOf(ctx);if(cache.has(key))return cache.get(key);const r=m.abc.map(x=>2**-(Math.round(Math.min(info(m.prob(ctx,x)),top)/step)*step)),s=r.reduce((a,v)=>a+v,0),out=r.map(v=>v/s);cache.set(key,out);return out;};
 return {...m,prob:(ctx,x)=>{const i=m.abc.indexOf(x);return i<0?0:qrow(ctx)[i];},bitsPerEntry:b,step};
}
function tableBits(m,b){return m.order<0?0:m.rows*m.V*b;}
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};
const api={log2,chars,info,corpus,alphabet,counts,entropy,stats,condEntropy,chain,huffman,kraft,canonical,encodeWith,decodeWith,model,codeLength,arithEncode,arithDecode,lz78,bpe,hammingEncode,hammingDecode,h2,capacity,rng,channel,theory,quantized,tableBits,choiceOrder,TRAIN};
root.ITMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
