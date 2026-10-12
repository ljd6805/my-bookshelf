/* 5~7장 실험: 블록 파라미터, 정규화, BERT 마스킹, 인과 마스크, 인코더-디코더 마스크, ViT 패치. 계산은 A08Math에서 한다. */
(()=>{
'use strict';
const U=A08UI,M=A08Math,S=U.select,R=U.range,F=U.fmt,T=M.TOKENS;
const int=n=>Math.round(n).toLocaleString('en-US');
const pct=v=>String(Math.round(v*100));
const TGT=['I','finished','the','book','today'];

A08Labs.params=el=>{
 U.setup(el,R('dm','d_model',512,8192,256,2048)+R('layers','층 수 L',2,96,2,16));
 U.bind(el,()=>{const r=M.blockParams(U.value(el,'dm'),U.value(el,'layers'));
  U.result(el,U.bars(['어텐션 (전체 층)','FFN (전체 층)','임베딩 (공유)'],[r.attn/1e6,r.ffn/1e6,r.emb/1e6],'백만 개',null,0),
  `블록 하나 = 어텐션 4d² + FFN 8d² = <b>${int(r.perLayer)}</b>개 · ${r.L}층이면 <b>${F((r.attn+r.ffn)/1e9,2)}B</b><br>임베딩 32,000 × ${r.d} = <b>${F(r.emb/1e6,1)}M</b>을 더해 전체 <strong>${F(r.total/1e9,3)}B</strong> · FFN 비중 ${F(r.ffn/r.total*100,0)}%<br>원본 레슨의 어림(블록 12d²)으로 한 실제 계산입니다. 실제 모델은 FFN 폭·어휘·위치 임베딩이 달라 수치가 다릅니다.`);});
};

const BASEV=[2,-1,0.5,3];
A08Labs.norm=el=>{
 U.setup(el,R('shift','모든 값에 더하는 상수 c',-5,5,0.5,0));
 U.bind(el,()=>{const c=U.value(el,'shift'),x=BASEV.map(v=>v+c),ln=M.layerNorm(x),rms=M.rmsNorm(x),ln0=M.layerNorm(BASEV),rms0=M.rmsNorm(BASEV);
  const dLn=Math.max(...ln.map((v,i)=>Math.abs(v-ln0[i]))),dRms=Math.max(...rms.map((v,i)=>Math.abs(v-rms0[i])));
  const mean=x.reduce((a,b)=>a+b,0)/4,rmsv=Math.sqrt(x.reduce((a,b)=>a+b*b,0)/4);
  U.result(el,U.matrix(['입력 x + c','LayerNorm','RMSNorm'],['x₁','x₂','x₃','x₄'],[x,ln,rms],`c = ${c}일 때 입력과 두 정규화 결과`,v=>F(v,2)),
  `c = <b>${F(c,1)}</b> · 입력 평균 <b>${F(mean,2)}</b>, 제곱평균제곱근(RMS) <b>${F(rmsv,2)}</b><br>c = 0일 때와 비교한 최대 변화: LayerNorm <strong>${F(dLn,4)}</strong> · RMSNorm <strong>${F(dRms,4)}</strong><br>LayerNorm은 평균을 빼므로 모든 값에 같은 수를 더해도 출력이 같습니다. RMSNorm은 평균을 빼지 않아 출력이 바뀝니다. 학습 가능한 배율·이동 파라미터는 뺀 실제 계산입니다.`);});
};

A08Labs.mlm=el=>{
 U.setup(el,R('ntok','토큰 수',20,10000,20,1000));
 U.bind(el,()=>{const r=M.mlm(U.value(el,'ntok'));
  const tok=T.map((t,i)=>{const m=r.marks[i];return `<span class="token${m?' a08-'+m:''}">${m==='mask'?'[MASK]':m==='rand'?'(무작위)':t}${m==='keep'?' ✓':''}</span>`;}).join('');
  U.result(el,`<div class="kit-panel"><b>예문의 처음 7토큰</b><div class="tokens">${tok}</div></div>`+U.bars(['고른 토큰','[MASK]','무작위 토큰','그대로'],[r.sel,r.mask,r.rand,r.keep],'개',null,0),
  `토큰 <b>${int(r.n)}</b>개 → 고름 <strong>${int(r.sel)}</strong> (기대 ${int(r.expect.sel)}) · [MASK] <b>${int(r.mask)}</b> (기대 ${int(r.expect.mask)}) · 무작위 <b>${int(r.rand)}</b> (기대 ${F(r.expect.rand,0)}) · 그대로 <b>${int(r.keep)}</b> (기대 ${F(r.expect.keep,0)})<br>시드를 고정해 실제로 뽑은 결과입니다. 토큰이 적으면 기대값에서 크게 벗어나고, 많을수록 15%·80%·10%·10%에 가까워집니다. 예문 7토큰은 기대값으로 1개쯤만 고르므로 아무것도 고르지 않는 일도 흔합니다.`);});
};

A08Labs.causal=el=>{
 U.setup(el,S('stage','가중치를 만드는 단계',[[1,'1 접두 평균'],[2,'2 학습된 고정 점수'],[3,'3 내용 점수 QKᵀ/√d']],3)+S('cmask','미래 칸 −∞ 마스크',[['on','켬'],['off','끔']],'on'));
 U.bind(el,()=>{const st=U.value(el,'stage'),on=U.text(el,'cmask')==='on',W=M.causalMatrix(st,on);
  const leak=W.reduce((s,row,i)=>s+row.reduce((a,v,j)=>a+(j>i?v:0),0),0),first=W[0];
  U.result(el,U.matrix(T,T,W,`단계 ${st}, 마스크 ${on?'켬':'끔'}의 7×7 가중치표(%)`,v=>pct(v),0),
  `단계 <b>${st}</b> · 마스크 <b>${on?'켬':'끔'}</b> · 행마다 합 = 1 (예: ‘나는’ 행 합 ${F(first.reduce((a,b)=>a+b,0),3)})<br>미래 칸(대각선 위)에 간 가중치 합: <strong>${F(leak,3)}</strong> (7행 합계) · ‘나는’이 자기 자신에게 주는 가중치 <b>${pct(first[0])}%</b><br>${on?'마스크가 미래를 정확히 0으로 만들어 하삼각 행렬이 됩니다. 1단계는 접두 평균 그대로입니다.':st===1?'마스크가 없으면 접두 평균이 아니라 문장 전체 평균이 되어 모든 칸이 같아집니다.':'마스크가 없으면 각 토큰이 정답이 될 미래 토큰을 볼 수 있어 다음 토큰 학습이 속임수가 됩니다.'} 칸의 숫자는 %이며, 시드를 고정한 무작위 벡터로 한 실제 계산입니다.`);});
};

A08Labs.masks=el=>{
 U.setup(el,S('atype','어텐션 종류',[['encoder','인코더 셀프 (원문 ↔ 원문)'],['decoder','디코더 셀프 (출력 ↔ 출력)'],['cross','교차 (출력 → 원문)']],'cross')+R('dstep','디코더가 지금까지 만든 출력 토큰 수',1,5,1,3));
 U.bind(el,()=>{const ty=U.text(el,'atype'),st=U.value(el,'dstep'),G=M.maskGrid(ty,st);
  const rows=ty==='encoder'?T:TGT,cols=ty==='decoder'?TGT:T,open=G.flat().reduce((a,b)=>a+b,0),cur=ty==='encoder'?null:st-1;
  const note={encoder:'인코더는 원문을 한 번에 양방향으로 읽으므로 모든 칸이 열려 있고, 디코더 단계와 무관합니다.',decoder:`디코더 셀프 어텐션은 인과 마스크가 있어 ${st}번째 출력 토큰 ‘${TGT[st-1]}’은 자기와 앞의 ${st-1}개만 봅니다.`,cross:`교차 어텐션에는 원문 쪽 마스크가 없어 ${st}번째 출력 토큰도 원문 7개를 모두 봅니다.`}[ty];
  U.result(el,U.matrix(rows,cols,G,`${ty} 어텐션의 열린 칸`,v=>v?'●':'·',cur),
  `${{encoder:'인코더 셀프',decoder:'디코더 셀프',cross:'교차'}[ty]} 어텐션 · 표 크기 <b>${rows.length} × ${cols.length}</b> · 지금 열린 칸 <strong>${open}</strong>개<br>${note}<br>아직 만들지 않은 출력 행은 비어 있습니다. 마스크 규칙을 그대로 세는 실제 계산입니다.`);});
};

A08Labs.patch=el=>{
 U.setup(el,S('imgsize','이미지 한 변 (픽셀)',[[224,'224'],[384,'384'],[512,'512']],224)+S('psize','패치 한 변 P',[[8,'8'],[14,'14'],[16,'16'],[32,'32']],16));
 U.bind(el,()=>{const sz=U.value(el,'imgsize'),P=U.value(el,'psize'),r=M.patches(sz,P),base=M.patches(sz,16),w=M.whisperFrames(30);
  U.result(el,U.bars(['이 이미지 (ViT)','30초 음성 (Whisper)','예문 7토큰'],[r.tokens,w.tokens,T.length],'토큰',null,0),
  `${sz}×${sz} ÷ ${P} → 격자 <b>${r.grid}×${r.grid}</b> = 패치 <b>${int(r.N)}</b>개 + [CLS] = <strong>${int(r.tokens)}</strong>토큰${r.crop?` (가장자리 ${r.crop}픽셀은 잘림)`:''}<br>패치 하나 = ${P}·${P}·3 = <b>${int(r.dim)}</b>개 값 · 점수표 <b>${int(r.entries)}</b>칸 (16×16 패치의 ${F(r.entries/base.entries,2)}배) · 패치 임베딩 행렬(768차원) <b>${F(r.embedParams/1e6,2)}M</b><br>Whisper는 30초를 3,000프레임으로 만든 뒤 1,500토큰으로 줄입니다. 원본 레슨의 설정으로 센 실제 계산입니다.`);});
};
})();
