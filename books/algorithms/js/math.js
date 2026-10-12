/* 알고리즘과 자료구조 실험실의 계산 모델. DOM을 만지지 않는다.
   공통 사례: 가상의 '솔내도서관'(본관 하나와 분관 일곱). 청구기호·제목·대출 횟수는 이 책을 위해
   시드가 고정된 의사 난수로 만든 합성 자료다. 모든 실험은 여기 있는 함수를 실제로 실행하고
   비교·이동·확인 횟수를 센다. 단위: '단계'는 원소 두 개를 비교하거나 한 칸을 옮기거나 연결 하나를
   따라가는 일 한 번이다. 시간(초)으로 바꾸는 값은 어림 가정이며 따로 밝힌다. */
(function(root){
'use strict';
/* ---------- 공통: 고정 시드 난수, 로그 ---------- */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const log2=x=>Math.log(x)/Math.LN2;
function shuffled(n,seed){const r=rng(seed),a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* 청구기호: 1000부터 3씩 띄운 정수. 정렬된 서가는 오름차순이다. */
const callNumber=i=>1000+3*i;

/* ---------- 1장: 단계 세기 ---------- */
function linearSearch(arr,target){let c=0;for(let i=0;i<arr.length;i++){c++;if(arr[i]===target)return {index:i,comparisons:c};}return {index:-1,comparisons:c};}
/* 정렬된 배열(또는 길이 n과 값 함수)에서 이진 탐색. 비교 한 번 = 가운데 값과 견주기 한 번. */
function binarySearch(n,target,value=callNumber){let lo=0,hi=n-1,c=0;const steps=[];
 while(lo<=hi){const mid=(lo+hi)>>1,v=value(mid);c++;steps.push({lo,hi,mid,v});if(v===target)return {index:mid,comparisons:c,steps};if(v<target)lo=mid+1;else hi=mid-1;}
 return {index:-1,comparisons:c,steps};}
/* 중복 등록 찾기: 모든 쌍을 비교한다(n(n-1)/2번). */
function duplicatePairs(arr){let c=0,found=null;for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){c++;if(found===null&&arr[i]===arr[j])found=[i,j];}return {comparisons:c,found};}
/* 실험용: 일을 실제로 실행해 단계 수를 센다. 찾는 책은 서가에 없는 번호(최악)다. */
function measure(task,n){
 if(!(n>=1))throw new RangeError('n must be at least 1');
 if(task==='linear'){const arr=shuffled(n,7).map(callNumber);return linearSearch(arr,callNumber(n)+1).comparisons;}
 if(task==='pairs'){const arr=shuffled(n,7).map(callNumber);return duplicatePairs(arr).comparisons;}
 if(task==='halving')return binarySearch(n,callNumber(n)+1).comparisons;
 throw new RangeError('unknown task '+task);
}
/* 규모를 키웠을 때의 예측: 측정한 일의 꼴(n, n², log n)로 늘린다. */
const growth={linear:n=>n,pairs:n=>n*(n-1)/2,halving:n=>Math.floor(log2(n))+1};

/* ---------- 2장: 배열·연결 리스트·스택·큐 ---------- */
/* 배열은 칸을 옮긴 수(moves), 연결 리스트는 따라간 연결 수(follows)를 센다. 위치는 0부터. */
function listCost(kind,op,n){
 if(!(n>=1))throw new RangeError('n must be at least 1');
 const mid=Math.floor(n/2);
 if(kind==='array'){
  const a=Array.from({length:n},(_,i)=>i);let moves=0,reads=0;
  if(op==='front'){for(let i=n;i>0;i--){a[i]=a[i-1];moves++;}a[0]=-1;}
  else if(op==='back'){a[n]=-1;}
  else if(op==='read'){reads=1;}
  else if(op==='remove'){for(let i=mid;i<n-1;i++){a[i]=a[i+1];moves++;}a.length=n-1;}
  else throw new RangeError('unknown op');
  return {moves,follows:0,reads,total:moves+reads+(op==='back'||op==='front'?1:0)};
 }
 if(kind==='linked'){
  let head=null;for(let i=n-1;i>=0;i--)head={v:i,next:head};let follows=0,writes=0;
  const walk=k=>{let p=head;for(let i=0;i<k;i++){p=p.next;follows++;}return p;};
  if(op==='front'){head={v:-1,next:head};writes=1;}
  else if(op==='back'){const last=walk(n-1);last.next={v:-1,next:null};writes=1;}
  else if(op==='read'){walk(mid);writes=0;}
  else if(op==='remove'){const prev=walk(mid-1<0?0:mid-1);if(mid===0)head=head.next;else prev.next=prev.next.next;writes=1;}
  else throw new RangeError('unknown op');
  return {moves:0,follows,reads:op==='read'?1:0,total:follows+writes+(op==='read'?1:0)};
 }
 throw new RangeError('unknown kind');
}
/* 반납 카트(스택)와 예약 대기열(큐): 매 차례 arrive권이 들어오고 serve권을 꺼낸다. */
function serveSim(kind,arrive,serve,ticks=12){
 if(!(arrive>=0&&serve>=0&&ticks>=1))throw new RangeError('bad rates');
 const box=[],done=[];let next=0;
 for(let t=0;t<ticks;t++){
  for(let k=0;k<arrive;k++)box.push({id:next++,at:t});
  for(let k=0;k<serve&&box.length;k++){const b=kind==='stack'?box.pop():box.shift();done.push({...b,out:t,wait:t-b.at});}
 }
 const waits=done.map(d=>d.wait),left=box.map(b=>({...b,wait:ticks-1-b.at}));
 const oldest=left.length?Math.max(...left.map(b=>b.wait)):0;
 return {order:done.map(d=>d.id),done,left,maxWait:Math.max(0,...waits,oldest),avgWait:waits.length?waits.reduce((s,x)=>s+x,0)/waits.length:0,first:done.find(d=>d.id===0)||null};
}

/* ---------- 3장: 정렬과 비교 정렬의 하한 ---------- */
function makeInput(order,n,seed=11){
 const a=Array.from({length:n},(_,i)=>callNumber(i));
 if(order==='sorted')return a;if(order==='reversed')return a.reverse();
 if(order==='random')return shuffled(n,seed).map(callNumber);
 throw new RangeError('unknown order');
}
function insertionSort(input){const a=input.slice();let c=0;
 for(let i=1;i<a.length;i++){const x=a[i];let j=i-1;while(j>=0){c++;if(a[j]>x){a[j+1]=a[j];j--;}else break;}a[j+1]=x;}
 return {sorted:a,comparisons:c};}
function mergeSort(input){let c=0;
 const sort=a=>{if(a.length<2)return a;const m=a.length>>1,l=sort(a.slice(0,m)),r=sort(a.slice(m)),out=[];let i=0,j=0;
  while(i<l.length&&j<r.length){c++;out.push(l[i]<=r[j]?l[i++]:r[j++]);}return out.concat(l.slice(i),r.slice(j));};
 return {sorted:sort(input.slice()),comparisons:c};}
/* 퀵 정렬: 맨 앞 원소를 기준(pivot)으로 삼는 가장 단순한 판. 정렬된 입력에서 최악이 된다. */
function quickSort(input){const a=input.slice();let c=0,depth=0;
 const stack=[[0,a.length-1,1]];
 while(stack.length){const [lo,hi,d]=stack.pop();if(lo>=hi)continue;depth=Math.max(depth,d);
  const p=a[lo];let i=lo;for(let j=lo+1;j<=hi;j++){c++;if(a[j]<p){i++;[a[i],a[j]]=[a[j],a[i]];}}[a[lo],a[i]]=[a[i],a[lo]];
  stack.push([lo,i-1,d+1],[i+1,hi,d+1]);}
 return {sorted:a,comparisons:c,depth};}
const SORTS={insertion:insertionSort,merge:mergeSort,quick:quickSort};
/* 비교만으로 정렬하는 방법이 최악에 꼭 해야 하는 비교 수: ⌈log₂(n!)⌉ */
function sortLowerBound(n){let s=0;for(let k=2;k<=n;k++)s+=log2(k);return Math.max(0,Math.ceil(s-1e-9));}

/* ---------- 4장: 이진 탐색 트리와 균형 ---------- */
function bstBuild(keys){let root=null;
 for(const k of keys){const node={k,l:null,r:null};if(!root){root=node;continue;}let p=root;
  for(;;){if(k<p.k){if(!p.l){p.l=node;break;}p=p.l;}else{if(!p.r){p.r=node;break;}p=p.r;}}}
 return root;}
const h=t=>t?t.h:0;
function avlFix(t){t.h=1+Math.max(h(t.l),h(t.r));return t;}
function rotR(t){const l=t.l;t.l=l.r;l.r=avlFix(t);return avlFix(l);}
function rotL(t){const r=t.r;t.r=r.l;r.l=avlFix(t);return avlFix(r);}
function avlInsert(t,k,stat){
 if(!t)return {k,l:null,r:null,h:1};
 if(k<t.k)t.l=avlInsert(t.l,k,stat);else t.r=avlInsert(t.r,k,stat);
 avlFix(t);const b=h(t.l)-h(t.r);
 if(b>1){stat.rotations++;if(k>=t.l.k){t.l=rotL(t.l);stat.rotations++;}return rotR(t);}
 if(b<-1){stat.rotations++;if(k<t.r.k){t.r=rotR(t.r);stat.rotations++;}return rotL(t);}
 return t;}
function avlBuild(keys){const stat={rotations:0};let root=null;for(const k of keys)root=avlInsert(root,k,stat);return {root,rotations:stat.rotations};}
function treeStats(root){let n=0,sum=0,height=0;const st=root?[[root,1]]:[];
 while(st.length){const [t,d]=st.pop();n++;sum+=d;height=Math.max(height,d);if(t.l)st.push([t.l,d+1]);if(t.r)st.push([t.r,d+1]);}
 return {n,height,avgDepth:n?sum/n:0};}
function treeOrder(order,n,seed=5){
 if(order==='sorted')return Array.from({length:n},(_,i)=>callNumber(i));
 if(order==='random')return shuffled(n,seed).map(callNumber);
 throw new RangeError('unknown order');}
function treeExperiment(order,balance,n){
 const keys=treeOrder(order,n);
 if(balance==='avl'){const r=avlBuild(keys);return {...treeStats(r.root),rotations:r.rotations,root:r.root};}
 const root=bstBuild(keys);return {...treeStats(root),rotations:0,root};}

/* ---------- 5장: 해시 표 (체이닝), 부하율과 두 배 늘리기 ---------- */
/* FNV-1a 32비트: 글자 코드를 섞어 버킷 번호를 고른다. */
function fnv1a(s){let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0;}return x>>>0;}
const keyOf=i=>'SN-'+callNumber(i);
function hashSim(n,initial=8,maxLoad=0.75,resize=true){
 if(!(n>=1&&initial>=1&&maxLoad>0))throw new RangeError('bad hash parameters');
 let m=initial,b=Array.from({length:m},()=>[]),copies=0;const costs=[];
 for(let i=0;i<n;i++){let cost=1;
  if(resize&&(i+1)/m>maxLoad){const old=b;m*=2;b=Array.from({length:m},()=>[]);for(const chain of old)for(const k of chain){b[fnv1a(k)%m].push(k);copies++;cost++;}}
  const k=keyOf(i);b[fnv1a(k)%m].push(k);costs.push(cost);}
 let probes=0;for(let i=0;i<n;i++){const k=keyOf(i),chain=b[fnv1a(k)%m];probes+=chain.indexOf(k)+1;}
 const lens=b.map(c=>c.length);
 return {m,load:n/m,copies,costs,amortized:costs.reduce((s,x)=>s+x,0)/n,avgProbe:probes/n,maxChain:Math.max(...lens),empty:lens.filter(x=>!x).length,lens};
}

/* ---------- 6장: 힙과 상위 k개 ---------- */
/* 대출 횟수: 소수의 인기 책과 많은 비인기 책(합성 자료, 고정 시드). */
function borrowCounts(n,seed=3){const r=rng(seed);return Array.from({length:n},(_,i)=>({id:i,title:'책 '+String(i+1).padStart(4,'0'),count:Math.floor(400*Math.pow(r(),6))+Math.floor(r()*5)}));}
const before=(a,b)=>a.count!==b.count?a.count>b.count:a.id<b.id;/* 대출 많은 쪽이 앞, 같으면 번호가 작은 쪽 */
function topK(items,k,method){
 if(!(k>=1))throw new RangeError('k must be at least 1');k=Math.min(k,items.length);let c=0;const cmp=(a,b)=>{c++;return before(a,b);};
 if(method==='sort'){
  const sort=a=>{if(a.length<2)return a;const m=a.length>>1,l=sort(a.slice(0,m)),r=sort(a.slice(m)),o=[];let i=0,j=0;while(i<l.length&&j<r.length)o.push(cmp(l[i],r[j])?l[i++]:r[j++]);return o.concat(l.slice(i),r.slice(j));};
  return {top:sort(items.slice()).slice(0,k),comparisons:c};}
 if(method==='scan'){const taken=new Set(),top=[];
  for(let t=0;t<k;t++){let best=null;for(const x of items){if(taken.has(x.id))continue;if(best===null||cmp(x,best))best=x;}taken.add(best.id);top.push(best);}
  return {top,comparisons:c};}
 if(method==='heap'){/* 크기 k 최소 힙: 뿌리가 지금까지 상위 k개 중 가장 약한 책 */
  const hp=[];const weaker=(a,b)=>cmp(b,a);
  const up=i=>{while(i>0){const p=(i-1)>>1;if(weaker(hp[i],hp[p])){[hp[i],hp[p]]=[hp[p],hp[i]];i=p;}else break;}};
  const down=i=>{for(;;){const l=2*i+1,r=l+1;let s=i;if(l<hp.length&&weaker(hp[l],hp[s]))s=l;if(r<hp.length&&weaker(hp[r],hp[s]))s=r;if(s===i)break;[hp[i],hp[s]]=[hp[s],hp[i]];i=s;}};
  for(const x of items){if(hp.length<k){hp.push(x);up(hp.length-1);}else if(cmp(x,hp[0])){hp[0]=x;down(0);}}
  const top=hp.slice().sort((a,b)=>before(a,b)?-1:1);return {top,comparisons:c};}
 throw new RangeError('unknown method');
}

/* ---------- 7·8장: 분관 배송 그래프 ---------- */
const BRANCHES=[['본관',70,150],['강변',190,60],['시장',210,200],['학교',330,100],['공원',350,240],['언덕',460,50],['역앞',480,190],['호수',590,120]];
/* 간선: [a, b, 배송 시간(분)]. 이 책을 위해 정한 가상의 도로다. */
const ROADS=[[0,1,4],[0,2,9],[1,2,6],[1,3,10],[2,3,8],[2,4,5],[2,6,11],[3,5,7],[3,6,9],[4,6,9],[5,7,5],[6,7,7]];
function neighbors(v){return ROADS.filter(e=>e[0]===v||e[1]===v).map(e=>({to:e[0]===v?e[1]:e[0],w:e[2]})).sort((a,b)=>a.to-b.to);}
function traverse(start,kind){
 if(!(start>=0&&start<BRANCHES.length))throw new RangeError('bad start');
 const seen=new Set([start]),order=[],level={[start]:0},parent={[start]:null},box=[start];let edges=0;
 while(box.length){const v=kind==='bfs'?box.shift():box.pop();order.push(v);
  const ns=neighbors(v);for(const {to} of (kind==='bfs'?ns:ns.slice().reverse())){edges++;if(!seen.has(to)){seen.add(to);level[to]=level[v]+1;parent[to]=v;box.push(to);}}}
 return {order,level,parent,edges};
}
/* DFS는 쌓아 두는 상자를 스택으로 바꾼 것. 위 traverse가 둘 다 처리한다. 경로는 parent를 거슬러 올라 만든다. */
function pathTo(parent,goal){const p=[];for(let v=goal;v!==null&&v!==undefined;v=parent[v])p.unshift(v);return p;}
const pathMinutes=p=>p.slice(1).reduce((s,v,i)=>s+ROADS.find(e=>(e[0]===p[i]&&e[1]===v)||(e[1]===p[i]&&e[0]===v))[2],0);
function dijkstra(start,goal){
 const n=BRANCHES.length,dist=Array(n).fill(Infinity),parent=Array(n).fill(null),done=Array(n).fill(false),settled=[];let relax=0;dist[start]=0;
 for(;;){let v=-1;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<Infinity&&(v<0||dist[i]<dist[v]))v=i;if(v<0)break;done[v]=true;settled.push(v);if(v===goal)break;
  for(const {to,w} of neighbors(v)){relax++;if(dist[v]+w<dist[to]){dist[to]=dist[v]+w;parent[to]=v;}}}
 return {dist,parent,settled,relax,path:pathTo(parent,goal),minutes:dist[goal]};
}
/* 탐욕법: 지금 자리에서 가장 가까운 '아직 안 간' 이웃으로 간다. 목적지를 보장하지 않는다. */
function greedyRoute(start,goal){const path=[start],seen=new Set([start]);let v=start,minutes=0;
 while(v!==goal){const ns=neighbors(v).filter(x=>!seen.has(x.to)).sort((a,b)=>a.w-b.w||a.to-b.to);if(!ns.length)return {path,minutes,reached:false};
  v=ns[0].to;minutes+=ns[0].w;seen.add(v);path.push(v);}
 return {path,minutes,reached:true};}

/* ---------- 9장: 편집 거리 (동적 계획법) ---------- */
const TITLES=['별을 세는 고양이','바다로 간 기차','비밀의 정원 지도','겨울 등대의 편지','여름 숲 요리책','작은 섬의 시간','밤하늘 노래','우주 정거장 일기','고양이 탐정의 여름','기차역 도서관','마법 지도 만들기','등대지기의 겨울','숲속 우체국','시간을 파는 상점','별빛 정원','바람의 노래','도시의 고양이','섬마을 요리사','편지를 쓰는 밤','지도 없는 여행'];
function editDistance(a,b){
 a=[...a];b=[...b];const D=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));let cells=0;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){cells++;D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(a[i-1]===b[j-1]?0:1));}
 /* 되짚기: 표의 오른쪽 아래에서 왼쪽 위로 가며 고친 내용을 모은다. */
 const ops=[];let i=a.length,j=b.length;
 while(i>0||j>0){if(i>0&&j>0&&D[i][j]===D[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){if(a[i-1]!==b[j-1])ops.unshift(`‘${a[i-1]}’→‘${b[j-1]}’ 바꾸기`);i--;j--;}
  else if(i>0&&D[i][j]===D[i-1][j]+1){ops.unshift(`‘${a[i-1]}’ 지우기`);i--;}else{ops.unshift(`‘${b[j-1]}’ 넣기`);j--;}}
 return {distance:D[a.length][b.length],table:D,cells,ops};
}
function closestTitles(query,titles=TITLES){let cells=0;
 const rows=titles.map((t,i)=>{const r=editDistance(query,t);cells+=r.cells;return {i,title:t,distance:r.distance};}).sort((x,y)=>x.distance-y.distance||x.i-y.i);
 return {rows,cells};}

/* ---------- 10장: 역색인과 근사 최근접 이웃 ---------- */
const WORDS=['고양이','바다','기차','정원','비밀','여름','숲','도시','편지','시간','마법','지도','섬','등대','밤','노래','겨울','우주','요리','탐정','바람','별','강','산','학교','시장','친구','할머니','로봇','공룡','소년','소녀','여우','곰','새','꽃','비','눈','달','해'];
/* 낱말 k번째가 뽑힐 확률 ∝ 1/(k+1) (지프 법칙을 흉내 낸 합성 분포). 제목마다 낱말 셋. */
function makeTitles(n,seed=17){const r=rng(seed),wts=WORDS.map((_,k)=>1/(k+1)),tot=wts.reduce((s,x)=>s+x,0);
 const pick=()=>{let u=r()*tot;for(let k=0;k<wts.length;k++){u-=wts[k];if(u<=0)return k;}return wts.length-1;};
 const out=new Array(n);for(let i=0;i<n;i++){const s=new Set();while(s.size<3)s.add(pick());out[i]=[...s];}return out;}
function buildIndex(titles){const post=WORDS.map(()=>[]);titles.forEach((t,id)=>{for(const w of t)post[w].push(id);});return post;}
function scanSearch(titles,words){let checks=0;const hits=[];
 for(let id=0;id<titles.length;id++){let ok=true;for(const w of words){checks++;if(!titles[id].includes(w)){ok=false;break;}}if(ok)hits.push(id);}
 return {hits,checks};}
/* 목록이 짧은 낱말부터 정렬된 목록 둘을 지퍼처럼 맞물려 교집합을 만든다. */
function indexSearch(post,words){let steps=0;const lists=words.map(w=>post[w]).sort((a,b)=>a.length-b.length);let cur=lists[0]||[];steps+=words.length;
 for(const L of lists.slice(1)){const out=[];let i=0,j=0;while(i<cur.length&&j<L.length){steps++;if(cur[i]===L[j]){out.push(cur[i]);i++;j++;}else if(cur[i]<L[j])i++;else j++;}cur=out;}
 if(lists.length===1)steps+=cur.length;return {hits:cur,steps};}
/* 2차원 '주제 지도' 위의 책 점(교육용 모형: 실제 임베딩은 수백 차원). 무리 다섯 개. */
function makePoints(n,seed=23){const r=rng(seed),centers=[[.2,.25],[.75,.2],[.5,.55],[.2,.8],[.8,.78]];
 return Array.from({length:n},()=>{const c=centers[Math.floor(r()*5)],g=()=>(r()+r()+r()-1.5)*.18;return [Math.min(1,Math.max(0,c[0]+g())),Math.min(1,Math.max(0,c[1]+g()))];});}
const dist2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
function exactNN(points,q){let best=-1,bd=Infinity;for(let i=0;i<points.length;i++){const d=dist2(points[i],q);if(d<bd){bd=d;best=i;}}return {best,distances:points.length,d:Math.sqrt(bd)};}
/* 격자 버킷: 질문 칸과 가까운 칸 몇 개만 본다(반경 radius칸). 빈 칸만 보면 '못 찾음'. */
function gridNN(points,q,cells,radius=0){
 if(!(cells>=1))throw new RangeError('cells must be at least 1');
 const cell=p=>[Math.min(cells-1,Math.floor(p[0]*cells)),Math.min(cells-1,Math.floor(p[1]*cells))],[qx,qy]=cell(q);let best=-1,bd=Infinity,distances=0,visited=0;
 for(let i=0;i<points.length;i++){const [x,y]=cell(points[i]);if(Math.abs(x-qx)<=radius&&Math.abs(y-qy)<=radius){distances++;const d=dist2(points[i],q);if(d<bd){bd=d;best=i;}}}
 for(let x=qx-radius;x<=qx+radius;x++)for(let y=qy-radius;y<=qy+radius;y++)if(x>=0&&y>=0&&x<cells&&y<cells)visited++;
 return {best,distances,visited,d:best<0?null:Math.sqrt(bd)};
}
/* 질문 여러 개로 근사 검색의 재현율(정확한 1위를 맞힌 비율)과 평균 거리 계산 수를 잰다. */
function annBenchmark(points,cells,radius,queries=60,seed=29){const r=rng(seed);let hit=0,dsum=0;
 for(let t=0;t<queries;t++){const q=[r(),r()],e=exactNN(points,q),g=gridNN(points,q,cells,radius);dsum+=g.distances;if(g.best===e.best)hit++;}
 return {recall:hit/queries,avgDistances:dsum/queries};}

/* ---------- 규모 장부와 11장 설계 ---------- */
/* 장마다 1만 권 → 100만 권일 때 한 번의 일에 드는 단계 수. 식과 가정은 각 장 본문에 있다. */
const LEDGER={
 steps:['번호로 한 권 찾기 · 앞에서부터 훑기',n=>n],
 lists:['대출 목록 맨 앞에 한 권 끼우기 · 배열',n=>n],
 sorting:['청구기호 순으로 정렬 · 병합 정렬',n=>n*log2(n)],
 search:['정렬된 서가에서 이진 탐색',n=>Math.floor(log2(n))+1],
 hash:['청구기호로 해시 찾기 · 부하율 0.75',()=>1+0.75/2],
 heap:['가장 많이 빌린 10권 · 크기 10 힙',n=>n*log2(10)],
 graph:['함께 빌린 책 그래프 한 바퀴 · BFS (책마다 이웃 5권)',n=>n+2.5*n],
 shortest:['같은 그래프의 최단 경로 · 힙 다익스트라',n=>3.5*n*log2(n)],
 edit:['오타 제목을 모든 제목과 비교 · 10글자×10글자',n=>100*n],
 index:['낱말 하나로 찾기 · 역색인 (1000권에 1권꼴)',n=>n/1000]
};
function ledgerRow(id,small=1e4,large=1e6){const [label,f]=LEDGER[id];return {label,small:f(small),large:f(large),ratio:f(large)/f(small)};}
/* 11장: 질문 종류별 하루 횟수(가정)와 자료구조 선택지. cost(n)은 질문 한 번의 단계 수. */
const DESIGN=[
 {id:'call',label:'청구기호로 한 권 찾기',daily:5000,options:{scan:['처음부터 훑기',n=>n],binary:['정렬 + 이진 탐색',n=>Math.floor(log2(n))+1],hash:['해시 표',()=>1.375]},fix:'hash'},
 {id:'word',label:'제목 낱말로 찾기',daily:2000,options:{scan:['모든 제목 훑기',n=>3*n],index:['역색인',n=>n/1000+3]},fix:'index'},
 {id:'typo',label:'오타 난 제목 찾기',daily:200,options:{all:['모든 제목과 편집 거리',n=>100*n],filter:['역색인으로 후보를 줄인 뒤 편집 거리',n=>100*(n/200)+n/1000]},fix:'filter'},
 {id:'top',label:'인기 10권 보여 주기',daily:50,options:{sort:['매번 전체 정렬',n=>n*log2(n)],heap:['크기 10 힙',n=>n*log2(10)]},fix:'heap'},
 {id:'route',label:'분관 배송 경로',daily:100,options:{bfs:['환승이 가장 적은 길 (BFS)',()=>8+12],dijkstra:['가장 빠른 길 (다익스트라)',()=>8*8+12]},fix:'dijkstra'}
];
const STEPS_PER_SECOND=1e8;/* 어림 가정: 노트북 한 코어가 1초에 단순 비교를 약 1억 번 한다고 본다. */
function designCost(choice,n){
 const rows=DESIGN.map(q=>{const key=choice[q.id]in q.options?choice[q.id]:Object.keys(q.options)[0],[name,f]=q.options[key],per=f(n);return {id:q.id,label:q.label,key,name,per,daily:per*q.daily,best:key===q.fix};});
 const total=rows.reduce((s,r)=>s+r.daily,0);return {rows,total,seconds:total/STEPS_PER_SECOND};}

/* 확인 문제 화면 순서(학습 내용의 계산이 아님): 원래 번호 answer인 보기가 화면 target번째(0부터)에 오도록 n개 보기를 돌린 원래 번호 목록. */
function choiceOrder(n,answer,target){const s=((answer-target)%n+n)%n;return Array.from({length:n},(_,k)=>(k+s)%n);}

const api={rng,log2,shuffled,callNumber,linearSearch,binarySearch,duplicatePairs,measure,growth,listCost,serveSim,makeInput,insertionSort,mergeSort,quickSort,SORTS,sortLowerBound,bstBuild,avlBuild,treeStats,treeExperiment,fnv1a,keyOf,hashSim,borrowCounts,topK,BRANCHES,ROADS,neighbors,traverse,pathTo,pathMinutes,dijkstra,greedyRoute,TITLES,editDistance,closestTitles,WORDS,makeTitles,buildIndex,scanSearch,indexSearch,makePoints,exactNN,gridNN,annBenchmark,LEDGER,ledgerRow,DESIGN,STEPS_PER_SECOND,designCost,choiceOrder};
if(typeof module!=='undefined')module.exports=api;else root.ALMath=api;
})(typeof window==='undefined'?globalThis:window);
