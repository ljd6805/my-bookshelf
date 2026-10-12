/* 3부와 마지막 과제 실험: 퍼플렉서티, 해밍(7,4), 잡음 채널, 확률표 양자화, 모델 고르기. 모두 실제 계산이며 9장 잡음은 씨앗을 정한 의사 난수다. */
(()=>{
'use strict';
const M=ITMath,U=ITUI,L=ITLabs;
const ALPHAS=[['0.01','0.01'],['0.05','0.05'],['0.1','0.1'],['0.3','0.3'],['1','1'],['3','3']];
L.perplexity=el=>{
 U.setup(el,U.select('order','모델',[['0','글자 빈도(앞 0글자)'],['1','앞 1글자 보기'],['2','앞 2글자 보기']],'2')+U.select('palpha','못 본 경우에 나눠 줄 몫 α',ALPHAS,'0.01'));
 U.bind(el,()=>{
  const k=Number(el.querySelector('#order').value),a=Number(el.querySelector('#palpha').value),tr=M.corpus.train(),te=M.corpus.test();
  const runs=[0,1,2].map(o=>{const m=M.model(o,tr,a);return {train:M.codeLength(m,tr).perChar,test:M.codeLength(m,te).perChar};}),r=runs[k],best=runs.map(x=>x.test).indexOf(Math.min(...runs.map(x=>x.test)));
  const labels=['빈도 · 학습','빈도 · 시험','앞1 · 학습','앞1 · 시험','앞2 · 학습','앞2 · 시험'],vals=runs.flatMap(x=>[x.train,x.test]);
  U.result(el,U.bars(labels,vals,{unit:'비트',digits:2,max:8,mark:i=>i===2*k+1}),`선택한 모델: 학습 자료(앞 50개) <b>${U.fmt(r.train,2)}</b>비트/글자 → 퍼플렉서티 ${U.fmt(2**r.train,1)}, 시험 자료(뒤 20개) <b>${U.fmt(r.test,2)}</b>비트/글자 → 퍼플렉서티 ${U.fmt(2**r.test,1)}. 학습과 시험의 차이 ${U.fmt(r.test-r.train,2)}비트가 외운 몫입니다.<br>이 α에서 시험 자료가 가장 짧은 모델: ${['글자 빈도','앞 1글자','앞 2글자'][best]} ✓. 시험 자료에서 앞 글자가 덜어 준 비트(빈도 − 앞1): ${U.fmt(runs[0].test-runs[1].test,2)}비트.`);
 });
};
const POS=['p1','p2','d1','p4','d2','d3','d4'];
L.hamming=el=>{
 U.setup(el,[0,1,2,3].map(i=>U.check('d'+i,`데이터 비트 d${i+1} = 1`,[1,0,1,1][i])).join('')+U.select('flip','채널이 뒤집을 자리',[['0','뒤집지 않음'],...[1,2,3,4,5,6,7].map(i=>[String(i),`자리 ${i} (${POS[i-1]})`]),['12','자리 1과 2, 두 개'],['35','자리 3과 5, 두 개']],'0'));
 U.bind(el,()=>{
  const d=[0,1,2,3].map(i=>el.querySelector('#d'+i).checked?1:0),c=M.hammingEncode(d),f=el.querySelector('#flip').value,flips=f.length===2?[Number(f[0]),Number(f[1])]:f==='0'?[]:[Number(f)];
  const y=c.map((v,i)=>flips.includes(i+1)?v^1:v),r=M.hammingDecode(y),ok=r.data.join('')===d.join('');
  const cell=(v,i,row,mark)=>`<rect x="${60+i*64}" y="${row}" width="56" height="40" rx="6" fill="${mark?'var(--orange)':'var(--panel2)'}" stroke="${i===0||i===1||i===3?'var(--blue)':'var(--line)'}" stroke-width="2"/><text x="${88+i*64}" y="${row+26}" text-anchor="middle" font-size="18" fill="${mark?'var(--bg)':'var(--text)'}">${v}</text>`;
  const svg=`<svg viewBox="0 0 520 220" role="img" aria-label="보낸 7비트 ${c.join('')}, 받은 7비트 ${y.join('')}, 고친 7비트 ${r.fixed.join('')}">${POS.map((p,i)=>`<text x="${88+i*64}" y="16" text-anchor="middle" font-size="12" fill="var(--muted)">${i+1} ${p}</text>`).join('')}${c.map((v,i)=>cell(v,i,24,false)).join('')}${y.map((v,i)=>cell(v,i,90,flips.includes(i+1))).join('')}${r.fixed.map((v,i)=>cell(v,i,156,r.syndrome===i+1)).join('')}<text x="4" y="50" font-size="13" fill="var(--muted)">보냄</text><text x="4" y="116" font-size="13" fill="var(--muted)">받음</text><text x="4" y="182" font-size="13" fill="var(--muted)">고침</text></svg>`;
  U.result(el,svg,`보낸 부호 ${c.join('')} → 받은 부호 ${y.join('')}. 증후(syndrome) = <b>${r.syndrome}</b>${r.syndrome?` → 자리 ${r.syndrome}을 뒤집어 고칩니다.`:' → 오류 없음으로 판단합니다.'}<br>꺼낸 데이터 ${r.data.join('')} ${ok?'= 보낸 데이터 ✓':`≠ 보낸 데이터 ${d.join('')} ✗ (두 자리가 뒤집히면 증후가 엉뚱한 자리를 가리켜 오히려 하나를 더 망칩니다)`}`);
 });
};
let HUFF=null;
function huff(){if(!HUFF){const s=M.stats(M.corpus.yunseul());HUFF=M.huffman(s.counts.map(([sym,w])=>({sym,w})));}return HUFF;}
L.noisy=el=>{
 U.setup(el,U.range('p','비트가 뒤집힐 확률 p',0,0.2,0.01,0.05)+U.select('scheme','보호 방식',[['none','부호 없음'],['rep3','3번 반복'],['hamming','해밍(7,4)']],'hamming')+U.range('seed','잡음 씨앗',1,9,1,7));
 U.bind(el,()=>{
  const p=U.value(el,'p'),sc=el.querySelector('#scheme').value,h=huff(),msg=M.corpus.first(10),bits=M.encodeWith(h.codes,msg),r=M.channel(bits,p,sc,U.value(el,'seed')),first=M.decodeWith(h.codes,r.out).text.split('\n').slice(0,3).join(' / ');
  const th=sc==='rep3'?M.theory.rep3(p):sc==='none'?p:null,C=M.capacity(p);
  U.result(el,U.bars(['전송률','용량 C','남은 오류율'],[r.rate,C,r.ber],{digits:3,max:1,mark:i=>i===0&&r.rate<=C}),`윤슬 메시지 10개를 허프만으로 줄인 ${bits.length}비트를 ${r.sent}비트로 보냈습니다(전송률 ${U.fmt(r.rate,3)}, 용량 1 − H₂(${p}) = ${U.fmt(C,3)}). 고친 뒤 남은 오류 <b>${r.errors}비트(${U.pct(r.ber,2)})</b>${th!==null?`, 이론값 ${U.pct(th,2)}`:`, 이론값: 한 블록이 2비트 이상 뒤집힐 확률 ${U.pct(M.theory.hammingBlock(p),2)}`}.<br>받은 비트를 허프만으로 풀어 읽으면: “${U.esc(first)}” ${r.errors?'— 비트 하나가 틀리면 그 뒤 부호의 경계가 밀려 글자가 줄줄이 바뀝니다 ✗':'— 원문 그대로 ✓'}`);
 });
};
L.quantize=el=>{
 U.setup(el,U.select('qorder','확률표',[['0','글자 빈도 표(1줄 × 180칸)'],['1','앞 글자 표(줄마다 180칸)']],'1')+U.range('qb','표 한 칸의 비트 수 b',2,12,1,8));
 U.bind(el,()=>{
  const o=Number(el.querySelector('#qorder').value),b=U.value(el,'qb'),m=M.model(o,M.corpus.train(),0.1),te=M.corpus.test(),base=M.codeLength(m,te).perChar,bs=[2,3,4,5,6,8,10,12],vals=bs.map(x=>M.codeLength(M.quantized(m,x),te).perChar),cur=M.codeLength(M.quantized(m,b),te).perChar,size=M.tableBits(m,b);
  U.result(el,U.bars(bs.map(x=>`${x}비트`),vals,{unit:'비트',digits:3,max:Math.max(...vals,base)*1.02,mark:i=>bs[i]===b}),`표 한 칸을 ${b}비트로 적으면 시험 자료(윤슬 뒤 20개)를 <b>${U.fmt(cur,3)}</b>비트/글자로 적습니다. 원래 표(배정밀도)는 ${U.fmt(base,3)}비트라 <b>${U.fmt(cur-base,3)}비트</b> 늘었습니다.<br>표 크기: ${m.rows}줄 × ${m.V}칸 × ${b}비트 = ${size.toLocaleString('en-US')}비트. 막대는 b마다 같은 계산을 한 결과입니다(✓ 표시가 지금 값).`);
 });
};
const FSRC={yunseul:['윤슬 70개',()=>M.corpus.yunseul()],doyoonA:['도윤 앞 15개',()=>M.corpus.doyoonA()],both:['둘 다',()=>M.corpus.yunseul()+'\n'+M.corpus.doyoonA()]};
L.final=el=>{
 U.setup(el,U.select('fsrc','모델을 셀 자료',Object.entries(FSRC).map(([k,v])=>[k,v[0]]),'yunseul')+U.select('falpha','못 본 경우에 나눠 줄 몫 α',ALPHAS.slice(0,5),'0.05')+U.check('fcost','모델 표도 함께 보낸다')+U.range('fb','표 한 칸의 비트 수 b',2,12,1,8));
 U.bind(el,()=>{
  const src=el.querySelector('#fsrc').value,a=Number(el.querySelector('#falpha').value),cost=el.querySelector('#fcost').checked,b=U.value(el,'fb'),t=M.corpus.doyoonB(),n=M.chars(t).length;
  const ms=[-1,0,1].map(o=>M.model(o,FSRC[src][1](),a)),len=ms.map(m=>M.codeLength(m,t).bits),size=ms.map(m=>M.tableBits(m,b)),tab=size.map(x=>cost?x:0),tot=len.map((x,i)=>x+tab[i]),win=tot.indexOf(Math.min(...tot)),names=['A 고정 길이','B 글자 빈도','C 앞 글자'];
  const e=M.arithEncode(ms[win],t),check=e.error?'산술 부호로 확인할 수 없음':`산술 부호로 실제로 압축하면 ${e.k}비트(이상적 ${U.fmt(e.bitsIdeal,1)}비트)이고 풀어 읽으면 원문과 ${M.arithDecode(ms[win],e.bits,n)===t?'같습니다 ✓':'다릅니다 ✗'}`;
  U.result(el,U.bars(names,tot.map(x=>x/n),{unit:'비트',digits:2,mark:i=>i===win}),`도윤 뒤 15개(${n}글자)를 ${FSRC[src][0]}로 센 모델로 적은 길이: ${names.map((x,i)=>`${x} ${U.fmt(len[i]/n,2)}`).join(', ')}비트/글자.${cost?` 표까지 보내므로 표 크기 ${size.map(x=>x.toLocaleString('en-US')).join(' / ')}비트(칸당 ${b}비트)를 더했습니다.`:` 표를 함께 보낸다면 칸당 ${b}비트로 ${size.map(x=>x.toLocaleString('en-US')).join(' / ')}비트가 더 듭니다(지금은 빼고 비교).`}<br>가장 짧은 모델: <b>${names[win]}</b> ✓ (${U.fmt(tot[win]/n,2)}비트/글자). ${check}.<br>어림 확인: 표까지 보낼 때 C가 A를 이기려면 메시지가 약 ${len[0]>len[2]?Math.ceil((size[2]-size[0])/((len[0]-len[2])/n)).toLocaleString('en-US')+'글자':'(C가 A보다 길어 이길 수 없음)'} 이상이어야 합니다(표 크기 차 ÷ 글자당 아낀 비트). 지금 메시지는 ${n}글자입니다.`);
 });
};
})();
