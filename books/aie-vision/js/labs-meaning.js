/* 7~9장 실험: 대조 학습 유사도 표, CER, 깊이 축척, 알파 합성. 임베딩·인식 결과·깊이·색은 미리 정한 예시다. */
(()=>{
'use strict';
const U=A05UI,M=A05Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

/* 3차원 장난감 임베딩: [빨강 성분, 파랑 성분, 거치대 성분]. 두 자전거는 서로 닮은 어려운 음성 예다. */
const IMG=[[0.9,0.3,0.1],[0.7,0.7,0.1],[0.1,0.2,0.95],[0.2,0.9,0.4]],TXT=[[0.95,0.25,0.15],[0.6,0.75,0.2],[0.15,0.1,1],[0.1,0.95,0.3]];
const NAMES=['빨간 자전거','파란 자전거','빈 거치대','사람'];
A05Labs.contrast=el=>{
 U.setup(el,R('ctau','온도 τ',0.03,1,0.01,0.07));
 U.bind(el,()=>{const tau=V(el,'ctau'),Sm=M.simMatrix(IMG,TXT),r=M.infoNCE(Sm,tau);
  const chart=`<div class="kit-panel"><p style="margin:0 0 8px">행 = 사진, 열 = 설명 (${NAMES.join(' · ')}) · 코사인 유사도</p>${U.grid(Sm,'4×4 코사인 유사도 표. 대각선이 짝이 맞는 쌍',2)}<p style="margin:10px 0 0">대각선 정답 확률(사진→글): ${r.diag.map((p,i)=>`${NAMES[i]} ${F(p,2)}`).join(' · ')}</p></div>`;
  U.result(el,chart,
  `τ = ${F(tau,2)}일 때 행마다 softmax(s/τ)를 계산했습니다. 빨간 자전거 사진이 맞는 설명을 고를 확률 <b>${F(r.diag[0],3)}</b>, 파란 자전거 ${F(r.diag[1],3)}.<br>InfoNCE 손실: 사진→글 ${F(r.imageToText,3)}, 글→사진 ${F(r.textToImage,3)}, 평균 <strong>${F(r.loss,3)}</strong><br>유사도 표 자체는 τ와 무관하므로 순위는 그대로이고, τ가 작을수록 확률이 대각선에 몰려 손실이 작아집니다. 두 자전거처럼 닮은 음성이 손실의 대부분을 만듭니다. 임베딩은 예시, 계산은 실제입니다.`);});
};

const REF='서울-A0427';
const HYPS=[['서울-A0427','완벽하게 읽음'],['서울-AO427','숫자 0을 영문 O로'],['서울-A427','0 하나를 빠뜨림'],['세울-A0427','서를 세로 오인'],['서울-A04277','7을 한 번 더 읽음'],['A0427','앞부분 영역을 놓침']];
A05Labs.cer=el=>{
 U.setup(el,S('ocrh','인식 결과',HYPS.map(([h,d],i)=>[i,`${h} (${d})`]),1));
 U.bind(el,()=>{const [hyp,desc]=HYPS[V(el,'ocrh')],r=M.editOps(REF,hyp),n=Array.from(REF).length,cer=r.distance/n;
  const name={'=':'같음','S':'바꿈','D':'빠짐','I':'넣음'},color={'=':'var(--line)','S':'var(--orange)','D':'var(--blue)','I':'var(--blue)'};
  const cells=r.ops.map(o=>`<span style="display:inline-flex;flex-direction:column;align-items:center;min-width:2.1em;margin:2px;padding:4px 2px;border:2px solid ${color[o.op]};border-radius:4px"><b>${U.esc(o.a||'·')}</b><b>${U.esc(o.b||'·')}</b><small>${name[o.op]}</small></span>`).join('');
  const count=k=>r.ops.filter(o=>o.op===k).length;
  U.result(el,`<div class="kit-panel"><p style="margin:0 0 8px">윗줄 정답 · 아랫줄 인식 결과</p><div>${cells}</div></div>`,
  `정답 “${REF}”(${n}글자), 인식 “${hyp}” — ${desc}<br>편집 연산: 바꿈 ${count('S')}, 빠짐 ${count('D')}, 넣음 ${count('I')} → 편집 거리 <b>${r.distance}</b><br>CER = ${r.distance} / ${n} = <strong>${F(cer,3)}</strong> (${F(cer*100,1)}%). 원본 레슨의 운영 목표 2% 미만과 비교해 보세요.<br>인식 결과는 미리 정한 예시이고, 편집 거리는 동적 계획법으로 실제 계산했습니다.`);});
};

const OBJ=['사람','자전거','거치대','기둥','건물'],GT=[2.1,3.4,4.0,6.5,12.0],REL=[0.52,0.80,1.05,1.58,3.10];
A05Labs.depthscale=el=>{
 U.setup(el,R('dscale','상대 깊이에 곱할 축척 s (m)',1,8,0.1,2));
 U.bind(el,()=>{const s=V(el,'dscale'),pred=REL.map(v=>v*s),m=M.depthMetrics(pred,GT),ymax=Math.ceil(Math.max(13,...pred)+1);
  const chart=U.plot({lines:[{data:GT.map((g,i)=>[i+1,g]),color:'var(--muted)',dashed:true},{data:pred.map((p,i)=>[i+1,p]),color:'var(--accent)'}],
   points:pred.map((p,i)=>[i+1,p,'var(--accent)',5]).concat(GT.map((g,i)=>[i+1,g,'var(--orange)',4])),xmin:0.5,xmax:5.5,ymin:0,ymax,xlabel:'물체 번호(1 사람 … 5 건물)',ylabel:'깊이 (m)',label:`축척 ${s}에서 예측 깊이와 실제 깊이 비교, AbsRel ${F(m.absRel,3)}`});
  U.result(el,chart,
  `예측 = ${F(s,1)} × 상대 깊이: ${pred.map((p,i)=>`${OBJ[i]} ${F(p,1)}`).join(', ')} m<br>실제: ${GT.map((g,i)=>`${OBJ[i]} ${g}`).join(', ')} m<br>AbsRel = <strong>${F(m.absRel,3)}</strong> · δ&lt;1.25 = <strong>${F(m.delta,2)}</strong> (${Math.round(m.delta*5)}/5점)<br>축척을 어떻게 잡아도 가까운 순서(사람 &lt; 자전거 &lt; … &lt; 건물)는 그대로입니다. 순서만으로는 미터를 알 수 없고, 축척은 카메라 정보나 크기를 아는 물체로 정해야 합니다. 깊이 값은 예시, 지표 계산은 실제입니다.`);});
};

const COLORS=[[220,60,60],[130,130,130],[60,90,220]];
A05Labs.composite=el=>{
 U.setup(el,R('ca1','첫 표본(빨간 반사광)의 불투명도 α₁',0,1,0.05,0.3));
 U.bind(el,()=>{const a1=V(el,'ca1'),al=[a1,0.5,0.8],r=M.composite(al,COLORS),rgb=r.color.map(v=>Math.round(v));
  const sw=`<span style="display:inline-block;width:1.6em;height:1.2em;vertical-align:middle;border:1px solid var(--line);background:rgb(${rgb.join(',')})"></span>`;
  U.result(el,U.bars(['빨강 가중치 w₁','회색 가중치 w₂','파랑 가중치 w₃','뚫고 나간 빛 T₄'],[...r.w,r.rest],'가중치 (합 = 1)',null,3),
  `α = (${al.map(v=>F(v,2)).join(', ')}). T₁ = 1, T₂ = 1 − α₁ = ${F(1-a1,2)}, T₃ = T₂ × 0.5 = ${F((1-a1)*0.5,2)}.<br>가중치 w = T·α = (${r.w.map(v=>F(v,3)).join(', ')}), 남은 빛 ${F(r.rest,3)}<br>픽셀 색 = Σ wᵢcᵢ = ${sw} <strong>rgb(${rgb.join(', ')})</strong> (배경은 검정으로 가정)<br>NeRF의 부피 렌더링과 가우시안 스플래팅이 공유하는 식의 실제 계산이며, 색과 불투명도는 예시입니다.`);});
};
})();
