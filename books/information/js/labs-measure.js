/* 1부 정보량 실험: 놀라움, 엔트로피, 앞 글자가 주는 정보. 계산은 ITMath, 여기서는 입력을 읽고 그린다. 모두 실제 계산이다. */
(()=>{
'use strict';
const M=ITMath,U=ITUI,L=ITLabs;
const show=ch=>ch==='\n'?'↵':ch===' '?'␣':ch;
const utf8Bits=t=>new TextEncoder().encode(t).length*8;
/* 윤슬 묶음 전체의 글자 빈도. 1장은 보정 없이 센 비율 p = 횟수 ÷ 618을 쓴다. */
function yunFreq(){const s=M.stats(M.corpus.yunseul());return {n:s.n,map:new Map(s.counts)};}
L.surprise=el=>{
 U.setup(el,U.text('msg','윤슬이 보낼 메시지','응 지금 가는 중','윤슬 묶음에 나온 글자만 잴 수 있습니다. 최대 24글자.'));
 const F=yunFreq();
 U.bind(el,()=>{
  const t=el.querySelector('#msg').value,c=M.chars(t);
  if(!c.length)return U.result(el,'','<b>입력 필요</b> 메시지를 한 글자 이상 적어 주세요.');
  if(c.length>24)return U.result(el,'',`<b>너무 깁니다</b> ${c.length}글자입니다. 24글자 이하로 줄여 주세요.`);
  const miss=[...new Set(c.filter(x=>!F.map.has(x)))];
  if(miss.length)return U.result(el,'',`<b>잴 수 없음</b> “${miss.map(show).map(U.esc).join('”, “')}”${U.josa(miss.at(-1),'은','는')} 윤슬 묶음에 한 번도 나오지 않아 확률이 0입니다. 확률 0인 글자의 놀라움은 끝이 없습니다(5장에서 이 문제를 다시 다룹니다).`);
  const bits=c.map(x=>M.info(F.map.get(x)/F.n)),sum=bits.reduce((a,b)=>a+b,0),u=utf8Bits(t),hi=bits.indexOf(Math.max(...bits)),lo=bits.indexOf(Math.min(...bits));
  U.result(el,U.bars(c.map(show),bits,{unit:'비트',digits:2,mark:i=>i===hi}),`<b>${U.fmt(sum,1)}비트</b> = 글자 ${c.length}개의 놀라움(−log₂p)을 더한 값, 한 글자에 평균 ${U.fmt(sum/c.length,2)}비트입니다. 같은 메시지를 UTF-8로 적으면 ${u}비트(${U.fmt(u/c.length,1)}비트/글자)입니다.<br>가장 비싼 글자: “${U.esc(show(c[hi]))}” ${U.fmt(bits[hi],2)}비트(618글자 중 ${F.map.get(c[hi])}번) ✓ · 가장 싼 글자: “${U.esc(show(c[lo]))}” ${U.fmt(bits[lo],2)}비트(${F.map.get(c[lo])}번).`);
 });
};
const REPLIES=['응','ㅋㅋ','알겠어','나중에'];
L.entropy=el=>{
 U.setup(el,REPLIES.map((r,i)=>U.range('r'+i,`“${r}” 답장 횟수`,0,60,1,[20,15,10,5][i])).join(''));
 U.bind(el,()=>{
  const v=REPLIES.map((_,i)=>U.value(el,'r'+i)),n=v.reduce((a,b)=>a+b,0);
  if(!n)return U.result(el,'','<b>답장이 없음</b> 네 횟수가 모두 0이면 분포를 만들 수 없습니다. 하나 이상을 1 이상으로 올려 주세요.');
  const p=v.map(x=>x/n),H=M.entropy(v),kinds=v.filter(x=>x>0).length,top=p.indexOf(Math.max(...p));
  U.result(el,U.bars(REPLIES,p,{digits:2,max:1,mark:i=>i===top}),`엔트로피 <b>H = ${U.fmt(H,3)}비트</b>/답장. 나올 수 있는 종류 ${kinds}개의 최댓값 log₂${kinds} = ${U.fmt(Math.log2(Math.max(kinds,1)),3)}비트, 네 종류에 2비트씩 주는 고정 길이 부호는 2비트입니다.<br>고정 길이보다 ${U.fmt(2-H,3)}비트 줄일 여지가 있습니다. 가장 흔한 답장 “${REPLIES[top]}”의 몫 ${U.pct(p[top])} ✓.`);
 });
};
L.chain=el=>{
 U.setup(el,U.select('k','앞에서 볼 글자 수',[['0','0개 · H(지금)'],['1','1개 · H(지금 | 앞 1글자)'],['2','2개 · H(지금 | 앞 2글자)']],'1')+U.range('n','쓸 메시지 수',10,70,5,70));
 U.bind(el,()=>{
  const k=Number(el.querySelector('#k').value),n=U.value(el,'n'),t=M.corpus.first(n),hs=[0,1,2].map(j=>M.condEntropy(t,j)),c=M.chain(t);
  el.querySelector('#n-value').textContent=`${n}개 · ${M.chars(t).length}글자`;
  U.result(el,U.bars(['앞 0글자','앞 1글자','앞 2글자'],hs.map(h=>h.H),{unit:'비트',digits:3,max:7,mark:j=>j===k}),`선택한 값 <b>${U.fmt(hs[k].H,3)}비트</b>/글자 ✓. 이 값은 문맥 ${hs[k].contexts}가지로 ${hs[k].n}글자를 나눠 센 것이라, 문맥 하나에 평균 ${U.fmt(hs[k].n/hs[k].contexts,1)}글자뿐입니다.<br>연쇄 법칙: H(앞, 지금) ${U.fmt(c.Hjoint,3)} = H(앞) ${U.fmt(c.Hprev,3)} + H(지금 | 앞) ${U.fmt(c.Hcond,3)}비트. 앞 글자가 덜어 준 몫(상호 정보량) ${U.fmt(c.MI,3)}비트.`);
 });
};
})();
