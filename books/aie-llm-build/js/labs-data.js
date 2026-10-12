/* 1~2장 실험: BPE 병합, MinHash 중복 탐지, 패딩과 패킹.
   계산은 모두 A11Math가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=A11UI,M=A11Math,F=U.fmt,R=U.range,S=U.select,D=M.DATA;
const trained={};
const table=k=>trained[k]||(trained[k]=M.bpeTrain(D.corpus[k],60));
const CORPUS=[['ko','한국어 소개문 (398바이트)'],['en','영어 소개문 (271바이트)']];
const PROBES=[['ko','한국어 문장'],['en','영어 문장'],['code','파이썬 코드 한 줄'],['emoji','이모지 섞인 문장']];
const chips=pieces=>`<div class="a11-chips" aria-label="토큰 조각 ${pieces.length}개">${pieces.map(p=>`<span>${U.esc(p)}</span>`).join('')}</div>`;

A11Labs.bpe=el=>{
 U.setup(el,S('bpe-corpus','병합표를 배울 말뭉치',CORPUS,'ko')+R('bpe-merges','병합 횟수 (회)',0,60,1,20)+S('bpe-probe','잘라 볼 시험 문장',PROBES,'ko'));
 U.bind(el,()=>{
  const ck=U.text(el,'bpe-corpus'),m=U.value(el,'bpe-merges'),pk=U.text(el,'bpe-probe'),t=table(ck),used=Math.min(m,t.merges.length),merges=t.merges.slice(0,used);
  const probe=D.probes[pk],ids=M.bpeEncode(probe,merges),pieces=ids.map(id=>M.showBytes(M.tokenBytes(id,t.merges))),bytes=M.utf8(probe).length;
  const ko=M.bpeEncode(probe,table('ko').merges).length,en=M.bpeEncode(probe,table('en').merges).length;
  const line=t.tokens.map((n,i)=>[i,n]),last=used?t.merges[used-1]:null;
  const chart=U.plot({lines:[{data:line}],points:[[used,t.tokens[used],'var(--orange)',6]],xmin:0,xmax:60,ymin:0,ymax:420,xlabel:'병합 횟수',ylabel:'말뭉치 토큰 수',label:`${ck==='ko'?'한국어':'영어'} 말뭉치에서 병합 횟수에 따른 토큰 수. ${used}회에서 ${t.tokens[used]}개`})+chips(pieces);
  U.result(el,chart,`말뭉치 ${t.bytes}바이트 → 병합 <b>${used}회</b> 뒤 <b>${t.tokens[used]}토큰</b>${m>used?` (요청한 ${m}회 중 두 번 이상 나온 쌍이 ${t.merges.length}개뿐이라 ${used}회에서 멈춤)`:''}<br>`+
   (last?`마지막 병합: ‹${U.esc(M.showBytes(t.merges[used-1].bytes))}› (그때 ${last.count}번 나온 쌍)<br>`:'아직 병합이 없어 바이트 하나가 토큰 하나입니다.<br>')+
   `시험 문장 ${bytes}바이트 → 지금 병합표로 <b>${ids.length}토큰</b>. 같은 문장을 한국어 표 전체로 자르면 ${ko}토큰, 영어 표 전체로 자르면 ${en}토큰입니다.<br>‹EC›처럼 꺾쇠로 적은 조각은 글자 하나를 다 채우지 못한 바이트이고, ·는 앞 공백입니다. 브라우저 안에서 실제로 BPE를 학습한 결과입니다.`);
 });
};

A11Labs.minhash=el=>{
 U.setup(el,S('mh-pair','비교할 두 글',[['ab','공지문과 광고 붙은 사본'],['ac','공지문과 요리 이야기']],'ab')+R('mh-k','서명 길이 k (해시 함수 수)',16,256,16,64)+S('mh-rows','LSH 띠 하나의 행 수 r',[[2,'r = 2'],[4,'r = 4'],[8,'r = 8']],4));
 U.bind(el,()=>{
  const pair=U.text(el,'mh-pair'),k=U.value(el,'mh-k'),r=U.value(el,'mh-rows'),b=k/r,A=M.shingles(D.docs.a),B=M.shingles(D.docs[pair[1]]);
  const J=M.jaccard(A,B),est=M.minhashEstimate(A,B,k),pc=M.lshProb(J,b,r),curve=Array.from({length:51},(_,i)=>[i/50,M.lshProb(i/50,b,r)]);
  const chart=U.plot({lines:[{data:curve},{data:[[0.8,0],[0.8,1]],color:'var(--muted)',dashed:true}],points:[[J,pc,'var(--orange)',7],[est,M.lshProb(est,b,r),'var(--blue)',5]],xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'Jaccard 유사도 s',ylabel:'후보가 될 확률',label:`띠 ${b}개, 행 ${r}개일 때 유사도에 따른 LSH 후보 확률. 참 유사도 ${F(J,3)}에서 ${F(pc,3)}`});
  const verdict=J>=0.8?'정확한 Jaccard가 0.8 이상이므로 둘 중 하나를 지웁니다.':'정확한 Jaccard가 0.8 미만이므로 둘 다 남깁니다.';
  U.result(el,chart,`조각(낱말 3-gram) ${A.size}개 대 ${B.size}개, 정확한 Jaccard <b>${F(J,3)}</b><br>MinHash 추정(k = ${k}) <b>${F(est,3)}</b>, 오차 ${F(Math.abs(est-J),3)}<br>LSH: 띠 ${b}개 × 행 ${r}개 → 후보가 될 확률 1 − (1 − ${F(J,3)}<sup>${r}</sup>)<sup>${b}</sup> = <b>${F(pc,3)}</b><br>후보가 되면 ${verdict} 주황 점은 참값, 파란 점은 추정값, 회색 점선은 문턱 0.8입니다. 실제 해시 계산 결과입니다.`);
 });
};

A11Labs.packing=el=>{
 U.setup(el,S('pk-L','학습 길이 L (토큰)',[[512,'512'],[1024,'1,024'],[2048,'2,048'],[4096,'4,096']],1024));
 U.bind(el,()=>{
  const L=U.value(el,'pk-L'),p=M.packing(D.lengths,L);
  const chart=U.bars([`패딩: 시퀀스 ${p.padSeq}개`,`패킹: 시퀀스 ${p.packSeq}개`],[p.padSeq*L,p.packSeq*L],'토큰 자리 (점선 = 실제 토큰 수)',p.real,0);
  U.result(el,chart,`문서 12개 = 실제 토큰 <b>${p.real.toLocaleString('en-US')}개</b> (문서마다 EOS 1개 포함)<br>패딩: 문서마다 ⌈(길이 + 1) ÷ ${L}⌉개 시퀀스 → ${p.padSeq}개 × ${L} = ${(p.padSeq*L).toLocaleString('en-US')}자리, 활용률 <b>${F(p.padUtil*100,1)}%</b><br>패킹: 전체를 이어 ⌈${p.real} ÷ ${L}⌉ = ${p.packSeq}개 시퀀스, 활용률 <b>${F(p.packUtil*100,1)}%</b><br>빈 자리는 ${p.padWaste.toLocaleString('en-US')}개에서 ${p.packWaste.toLocaleString('en-US')}개로 줄어듭니다. 문서 길이는 미리 정한 교육용 값입니다.`);
 });
};
})();
