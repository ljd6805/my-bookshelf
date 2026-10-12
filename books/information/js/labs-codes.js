/* 2부 압축 실험: 허프만 트리, 크래프트 부등식, 남의 부호, 산술 부호, LZ78, BPE. 모두 브라우저에서 실제로 계산한다. */
(()=>{
'use strict';
const M=ITMath,U=ITUI,L=ITLabs;
const show=ch=>ch==='\n'?'↵':ch===' '?'␣':ch;
const TOP=M.stats(M.corpus.yunseul()).counts.slice(0,6);
/* 허프만 트리 그림: 잎은 왼쪽부터 차례로, 깊이마다 한 줄. 가지 위에 0·1을 적는다. */
function treeSvg(h){
 const leaves=[],pos=new Map();let depth=0;
 (function walk(n,d){depth=Math.max(depth,d);if(n.sym!==undefined){leaves.push(n);return;}walk(n.left,d+1);walk(n.right,d+1);})(h.root,0);
 const W=480,dy=Math.min(52,200/Math.max(depth,1)),x0=36,step=(W-72)/Math.max(leaves.length-1,1);
 (function place(n,d){if(n.sym!==undefined){pos.set(n,{x:x0+leaves.indexOf(n)*step,y:24+d*dy});return pos.get(n);}const a=place(n.left,d+1),b=place(n.right,d+1);pos.set(n,{x:(a.x+b.x)/2,y:24+d*dy});return pos.get(n);})(h.root,0);
 let s='';
 for(const [n,p] of pos){if(n.sym!==undefined)continue;[[n.left,'0'],[n.right,'1']].forEach(([c,b])=>{const q=pos.get(c);s+=`<path d="M${p.x} ${p.y}L${q.x} ${q.y}" stroke="var(--muted)" stroke-width="1.6"/><text x="${(p.x+q.x)/2+(b==='0'?-9:5)}" y="${(p.y+q.y)/2}" font-size="12" fill="var(--accent)">${b}</text>`;});}
 for(const [n,p] of pos){if(n.sym!==undefined)s+=`<rect x="${p.x-22}" y="${p.y-4}" width="44" height="40" rx="6" fill="var(--panel2)" stroke="var(--blue)"/><text x="${p.x}" y="${p.y+12}" text-anchor="middle" font-size="14" fill="var(--text)">${U.esc(show(n.sym))}</text><text x="${p.x}" y="${p.y+29}" text-anchor="middle" font-size="11" fill="var(--muted)">${h.codes.get(n.sym)}</text>`;else s+=`<circle cx="${p.x}" cy="${p.y}" r="11" fill="var(--panel)" stroke="var(--muted)"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="10" fill="var(--muted)">${n.w}</text>`;}
 return `<svg viewBox="0 0 ${W} ${70+depth*dy}" role="img" aria-label="허프만 트리: ${[...h.codes].map(([k,v])=>`${show(k)} ${v}`).join(', ')}">${s}</svg>`;
}
L.huffman=el=>{
 U.setup(el,TOP.map(([ch,w],i)=>U.range('w'+i,`“${show(ch)}” 횟수`,0,150,1,w)).join(''));
 U.bind(el,()=>{
  const items=TOP.map(([sym],i)=>({sym,w:U.value(el,'w'+i)})),h=M.huffman(items);
  if(!h)return U.result(el,'','<b>글자가 없음</b> 횟수가 모두 0이면 부호를 지을 수 없습니다. 하나 이상을 올려 주세요.');
  const W=items.reduce((a,x)=>a+x.w,0),live=items.filter(x=>x.w>0);
  const table=live.map(x=>`“${U.esc(show(x.sym))}” ${h.codes.get(x.sym)} (${U.pct(x.w/W)})`).join(' · ');
  U.result(el,treeSvg(h),`평균 길이 <b>L = ${U.fmt(h.L,3)}비트</b>/글자, 엔트로피 H = ${U.fmt(h.H,3)}비트, 차이 L − H = ${U.fmt(h.L-h.H,3)}비트(1 미만 ✓). 같은 ${live.length}글자를 고정 길이로 적으면 ${Math.max(1,Math.ceil(Math.log2(live.length)))}비트입니다. 크래프트 합 Σ2^(−l) = ${U.fmt(h.kraft,3)}.<br>부호표: ${table}`);
 });
};
L.kraft=el=>{
 U.setup(el,['A','B','C','D','E'].map((s,i)=>U.range('l'+i,`글자 ${s}의 부호 길이`,1,6,1,[1,2,3,4,4][i])).join(''));
 U.bind(el,()=>{
  const ls=[0,1,2,3,4].map(i=>U.value(el,'l'+i)),k=M.kraft(ls),codes=M.canonical(ls);
  const chart=U.bars(['A','B','C','D','E','합계'],[...ls.map(l=>2**-l),k],{digits:4,max:Math.max(1,k),mark:i=>i===5&&k<=1});
  if(!codes)return U.result(el,chart,`<b>만들 수 없음 ✗</b> 크래프트 합 Σ2^(−l) = ${U.fmt(k,4)} &gt; 1입니다. 짧은 부호가 너무 많아 어떤 부호도 다른 부호의 앞부분이 되지 않게 고를 수 없습니다. 길이 하나를 늘려 보세요.`);
  U.result(el,chart,`<b>만들 수 있음 ✓</b> 크래프트 합 ${U.fmt(k,4)} ≤ 1. 정준 부호: ${codes.map((c,i)=>`${'ABCDE'[i]} = ${c}`).join(', ')}.${k<1?` 합이 1보다 ${U.fmt(1-k,4)} 작아 쓰지 않는 부호 자리가 남습니다. 어떤 길이를 줄여도 됩니다.`:' 합이 정확히 1이라 남는 자리가 없습니다.'}`);
 });
};
const SRC={yunseul:['윤슬 묶음 70개',()=>M.corpus.yunseul()],doyoonA:['도윤 앞 15개',()=>M.corpus.doyoonA()]};
const DST={test:['윤슬 뒤 20개',()=>M.corpus.test()],doyoonB:['도윤 뒤 15개',()=>M.corpus.doyoonB()]};
L.mismatch=el=>{
 U.setup(el,U.select('from','부호를 지은 빈도',Object.entries(SRC).map(([k,v])=>[k,v[0]]),'yunseul')+U.select('to','보낼 메시지',Object.entries(DST).map(([k,v])=>[k,v[0]]),'doyoonB')+U.range('alpha','못 본 글자에 나눠 줄 몫 α',0,1,0.05,0.1));
 U.bind(el,()=>{
  const from=el.querySelector('#from').value,to=el.querySelector('#to').value,a=U.value(el,'alpha'),t=DST[to][1](),m=M.model(0,SRC[from][1](),a),r=M.codeLength(m,t),self=M.stats(t).H,fixed=Math.log2(m.V);
  if(r.zero.length)return U.result(el,'',`<b>부호가 없는 글자 ✗</b> α = 0이면 ${SRC[from][0]}에 없던 글자 ${r.zero.length}종(예: “${r.zero.slice(0,4).map(show).map(U.esc).join('”, “')}”)이 확률 0을 받아 부호가 없습니다. 길이는 끝없이 깁니다. α를 조금이라도 올려 보세요.`);
  const extra=r.per.map(x=>x).sort((p,q)=>q.bits-p.bits).slice(0,3).map(x=>`“${U.esc(show(x.ch))}” ${U.fmt(x.bits,1)}비트`).join(', ');
  U.result(el,U.bars(['고정 길이','자기 빈도','남의 빈도'],[fixed,self,r.perChar],{unit:'비트',digits:3,max:9,mark:i=>i===2&&r.perChar<fixed}),`${DST[to][0]}(${r.n}글자)를 ${SRC[from][0]}로 지은 부호로 적으면 <b>${U.fmt(r.perChar,3)}비트</b>/글자(교차 엔트로피). 자기 빈도로 지었다면 ${U.fmt(self,3)}비트이므로 <b>늘어난 몫 ${U.fmt(r.perChar-self,3)}비트</b>가 KL입니다. ${r.perChar>fixed?'아무것도 모르는 고정 길이보다도 깁니다 ✗.':'고정 길이보다는 짧습니다 ✓.'}<br>가장 비싸게 적힌 글자: ${extra}.`);
 });
};
const MODELS=[['-1','고정 길이(모두 1/180)'],['0','글자 빈도'],['1','앞 글자 보기']];
L.arithmetic=el=>{
 U.setup(el,U.text('amsg','부호로 만들 메시지','응 지금 가는 중','16글자까지. 모델은 윤슬 앞 50개로 셌고 α = 1입니다.')+U.select('amodel','예측 모델',MODELS,'1'));
 U.bind(el,()=>{
  const t=el.querySelector('#amsg').value,c=M.chars(t),m=M.model(Number(el.querySelector('#amodel').value),M.corpus.train(),1);
  if(!c.length)return U.result(el,'','<b>입력 필요</b> 메시지를 한 글자 이상 적어 주세요.');
  if(c.length>16)return U.result(el,'',`<b>너무 깁니다</b> ${c.length}글자입니다. 그림을 읽을 수 있게 16글자 이하로 줄여 주세요.`);
  const e=M.arithEncode(m,t);
  if(e.error)return U.result(el,'',`<b>부호로 만들 수 없음</b> 알파벳(두 묶음에 나온 180글자) 밖의 글자가 있습니다. 모델이 아는 글자만 확률을 받습니다.`);
  const back=M.arithDecode(m,e.bits,c.length),rows=e.steps.map((s,i)=>`<text x="4" y="${22+i*20}" font-size="13" fill="var(--text)">${U.esc(show(s.ch))}</text><rect x="40" y="${10+i*20}" width="420" height="14" rx="3" fill="var(--panel2)"/><rect x="${40+s.lo*420}" y="${10+i*20}" width="${Math.max((s.hi-s.lo)*420,2)}" height="14" rx="3" fill="var(--accent)"/>`).join('');
  const chart=`<svg viewBox="0 0 480 ${20+c.length*20}" role="img" aria-label="글자마다 지금 구간 안에서 고른 부분 구간의 위치와 폭">${rows}</svg>`;
  U.result(el,chart,`부호 <b>${e.k}비트</b>: <code>${e.bits.length>48?e.bits.slice(0,48)+'…':e.bits}</code><br>모델이 메시지 전체에 준 확률로 잰 이상적 길이 Σ −log₂q = ${U.fmt(e.bitsIdeal,2)}비트, 차이 ${U.fmt(e.k-e.bitsIdeal,2)}비트(2 이하). 글자당 ${U.fmt(e.k/c.length,2)}비트. 받는 쪽이 같은 모델로 풀어 읽으면 “${U.esc(back)}” ${back===t?'— 원문과 같음 ✓':'— 다름 ✗'}`);
 });
};
const huffBits=t=>{const s=M.stats(t),h=M.huffman(s.counts.map(([sym,w])=>({sym,w})));return h.L*s.n;};
L.lz=el=>{
 U.setup(el,U.range('lzn','쓸 메시지 수',5,70,5,70)+U.check('lzrep','같은 묶음을 한 번 더 이어 붙이기'));
 U.bind(el,()=>{
  const n=U.value(el,'lzn'),one=M.corpus.first(n),t=el.querySelector('#lzrep').checked?one+'\n'+one:one,r=M.lz78(t),utf=new TextEncoder().encode(t).length*8,hb=huffBits(t);
  el.querySelector('#lzn-value').textContent=`${n}개 · ${r.n}글자`;
  const last=r.phrases.slice(-4).map(p=>`“${U.esc([...p.text].map(show).join(''))}”`).join(' ');
  U.result(el,U.bars(['UTF-8','고정 8비트','허프만','LZ78'],[utf/r.n,8,hb/r.n,r.perChar],{unit:'비트',digits:2,mark:i=>i===3}),`LZ78은 ${r.n}글자를 구절 ${r.phrases.length}개로 나눠 <b>${U.fmt(r.perChar,2)}비트</b>/글자(${r.bits}비트)로 적습니다. 가장 긴 구절은 ${r.longest}글자, 마지막 구절들: ${last}.<br>${r.perChar<hb/r.n?'허프만보다 짧습니다 ✓. 되풀이가 많아 긴 구절을 한 번호로 적었기 때문입니다.':'허프만(자기 빈도, 표는 따로 보낸다고 가정)보다 깁니다. 사전이 아직 짧은 구절뿐이라 번호와 글자 비트가 쌓입니다.'}`);
 });
};
L.bpe=el=>{
 U.setup(el,U.range('merges','병합 횟수',0,80,1,0));
 U.bind(el,()=>{
  const t=M.corpus.yunseul(),r=M.bpe(t,U.value(el,'merges')),base=M.chars(t).length*Math.ceil(Math.log2(M.stats(t).distinct));
  const recent=r.merges.slice(-4).map(x=>`“${U.esc(show(x.a))}”+“${U.esc(show(x.b))}”(${x.count}번)`).join(', ')||'아직 없음';
  U.result(el,U.bars(['글자 고정 길이','BPE 고정 길이','BPE 조각 엔트로피'],[base,r.bitsFixed,r.bitsEntropy],{unit:'비트',digits:0,mark:i=>i===1&&r.bitsFixed<base}),`병합 ${r.merges.length}번: 조각 <b>${r.n}개</b>(글자 618개), 사전 ${r.vocab}개. 조각마다 ⌈log₂${r.vocab}⌉ = ${Math.ceil(Math.log2(r.vocab))}비트씩 주면 <b>${r.bitsFixed}비트</b>, 조각 빈도의 엔트로피로 적으면 ${U.fmt(r.bitsEntropy,0)}비트입니다.<br>최근 병합: ${recent}.`);
 });
};
})();
