/* 5~8장 실험: 노이즈 스케줄, 디노이징 단계 수, 가이던스, LoRA, SDEdit, 비디오 토큰. 계산은 A09Math에서 한다. */
(()=>{
'use strict';
const U=A09UI,M=A09Math,R=U.range,S=U.select,F=U.fmt;
const pct=x=>F(x*100,0)+'%';
const MARKS=[[-2,'낮'],[2,'밤']];
A09Labs.schedule=el=>{
 U.setup(el,S('sched','노이즈 스케줄',[['linear','선형 β (DDPM)'],['cosine','코사인 (Improved DDPM)']],'linear')+R('tstep','단계 t (1~1000)',1,1000,1,300));
 U.bind(el,()=>{const k=U.text(el,'sched'),t=U.value(el,'tstep'),r=M.schedule(k,t),o=M.schedule(k==='linear'?'cosine':'linear',t);
  const curve=kind=>{const ab=M.alphaBars(kind),d=[];for(let i=0;i<1000;i+=10)d.push([i+1,Math.sqrt(ab[i])]);d.push([1000,Math.sqrt(ab[999])]);return d;};
  const chart=U.plot({lines:[{data:curve(k==='linear'?'cosine':'linear'),color:'var(--muted)',dashed:true},{data:curve(k)}],points:[[t,r.signal,'var(--orange)',6]],xmin:0,xmax:1000,ymin:0,ymax:1,xlabel:'단계 t',ylabel:'신호 계수 √ᾱ',label:`${k==='linear'?'선형':'코사인'} 스케줄의 신호 계수 곡선과 t=${t}의 점`});
  U.result(el,chart,`${k==='linear'?'선형':'코사인'} 스케줄, t = <b>${t}</b><br>신호 계수 √ᾱ = <strong>${F(r.signal,3)}</strong>, 잡음 계수 √(1−ᾱ) = <b>${F(r.noise,3)}</b>, SNR = ᾱ/(1−ᾱ) = <b>${r.snr>1000?F(r.snr,0):F(r.snr,3)}</b> (log₁₀ ${F(r.logSnr,2)})<br>같은 t에서 ${k==='linear'?'코사인':'선형'} 스케줄의 신호는 ${F(o.signal,3)}입니다. 신호와 잡음이 같아지는(ᾱ = 0.5) 단계: 이 스케줄 <b>${r.cross}</b>, 다른 스케줄 ${o.cross}.<br>스케줄 식으로 한 실제 계산입니다. 선형은 중간에서 신호를 빨리 지우고, 코사인은 더 늦게까지 남깁니다.`);});
};
A09Labs.steps=el=>{
 U.setup(el,R('nsteps','DDIM 단계 수',1,50,1,10));
 U.bind(el,()=>{const n=U.value(el,'nsteps'),r=M.steps(n);
  U.result(el,U.hist(r.bins,{marks:MARKS,label:`${n}단계로 뽑은 샘플 200개의 분포. 장면에 닿은 비율 ${pct(r.scene)}`}),`<b>${n}</b>단계로 순수 노이즈에서 거꾸로 걸은 샘플 200개<br>장면(낮 −2 또는 밤 +2 근처 ±1)에 닿은 비율 <strong>${pct(r.scene)}</strong>, 흐릿한 중간(|x| < 1) <b>${pct(r.blur)}</b>, 낮 장면 비율 ${pct(r.day)}, 표준편차 ${F(r.std,2)} (데이터는 약 2.06)<br>${n<=2?'한두 걸음이면 최적 예측도 두 장면의 평균 쪽에 떨어집니다. VAE가 흐린 이유와 같습니다.':r.scene<0.9?'단계가 늘수록 샘플이 두 무리로 갈라지고 있습니다.':'샘플이 두 장면으로 또렷하게 갈라졌습니다. 이 뒤로는 단계를 늘려도 거의 같습니다.'}<br>신경망 대신 정확한 잡음 예측기(두 가우스 혼합의 점수)로 돌린 실제 계산입니다. 선형 스케줄, 시드 고정.`);});
};
A09Labs.cfg=el=>{
 U.setup(el,R('gscale','가이던스 스케일 w',0,10,0.5,0));
 U.bind(el,()=>{const w=U.value(el,'gscale'),r=M.cfg(w);
  U.result(el,U.hist(r.bins,{marks:[[2,'밤 평균'],[3,'과포화 기준']],label:`가이던스 ${w}로 뽑은 “밤 장면” 샘플 200개의 분포`}),`“밤 장면” 조건, w = <b>${F(w,1)}</b>, 20단계<br>샘플 평균 <b>${F(r.mean,2)}</b> (데이터 밤 장면 2.00), 표준편차 <strong>${F(r.std,2)}</strong> (데이터 0.50), 과포화(x > 3) <b>${pct(r.over)}</b>, 낮 장면이 섞인 비율 ${pct(r.day)}<br>${w===0?'조건부 예측만 쓰면 밤 장면 분포를 그대로 따릅니다.':r.over>0.3?'무조건부 예측에서 멀어지는 쪽으로 과하게 밀려 데이터에 없는 극단으로 나가고, 비슷한 그림만 나옵니다.':'조건 쪽으로 더 또렷해지는 대신 다양성이 줄어듭니다.'}<br>ε_cfg = (1+w)ε_밤 − w·ε_전체를 정확한 예측기로 계산한 실제 샘플링입니다.`);});
};
A09Labs.lora=el=>{
 U.setup(el,S('ldim','가중치 크기 d (d×d)',[[320,'320'],[640,'640 (원본 예)'],[1280,'1280'],[4096,'4096']],640)+R('rank','LoRA 랭크 r',1,128,1,16));
 U.bind(el,()=>{const d=U.value(el,'ldim'),r=U.value(el,'rank'),o=M.lora(d,r);
  U.result(el,U.bars(['전체 미세 조정 d²','LoRA 2·d·r'],[o.full,o.ada],'개',null,0),`d = <b>${d}</b>, r = <b>${r}</b><br>전체 미세 조정 <b>${o.full.toLocaleString('ko-KR')}</b>개 vs LoRA <b>${o.ada.toLocaleString('ko-KR')}</b>개 → <strong>${F(o.ratio,1)}배</strong> 적음 (전체의 ${F(o.share*100,2)}%)<br>층 하나의 LoRA를 fp16으로 저장하면 약 <b>${F(o.kb,1)} KB</b>. 기반 가중치 W는 얼려 두고 B·A만 학습하므로 같은 기반 모델에 여러 LoRA를 바꿔 끼울 수 있습니다.<br>${2*r>=d?'r이 d/2 이상이면 LoRA가 오히려 더 많아집니다.':'매개변수 수를 세는 실제 계산입니다. 모델 전체 크기는 층 수와 어느 층에 붙이느냐에 따라 달라집니다.'}`);});
};
A09Labs.sdedit=el=>{
 U.setup(el,R('strength','SDEdit 강도 s = t/T',0.05,0.95,0.05,0.3));
 U.bind(el,()=>{const s=U.value(el,'strength'),r=M.sdedit(s),d=[];for(let v=0.02;v<=0.98;v+=0.02)d.push([v,M.sdedit(v).keep]);
  const chart=U.plot({lines:[{data:d},{data:d.map(p=>[p[0],M.sdedit(p[0]).signal]),color:'var(--blue)',dashed:true}],points:[[s,r.keep,'var(--orange)',6]],xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'강도 s',ylabel:'낮 장면 유지 확률(실선)·신호 계수(점선)',label:`강도 ${F(s,2)}에서 낮 장면 유지 확률 ${pct(r.keep)}`});
  U.result(el,chart,`강도 <b>${F(s,2)}</b> → t = ${r.t}단계까지 노이즈, 남은 신호 계수 √ᾱ = <b>${F(r.signal,3)}</b><br>되돌렸을 때 원래 낮 장면으로 돌아올 확률 <strong>${pct(r.keep)}</strong>, 밤 장면으로 바뀔 확률 <b>${pct(r.change)}</b><br>${s<=0.35?'원본이 거의 그대로 남습니다. 작은 화풍 변화에 알맞습니다.':s<0.75?'큰 구조는 남지만 장면이 바뀔 수 있는 구간입니다. 값을 조금씩 바꿔 가며 확인합니다.':'원본 정보가 거의 사라져 새로 그리는 것과 비슷합니다(최대 50%까지).'}<br>1차원 결정적 역방향 흐름이 순서를 보존한다는 성질로 한 실제 계산입니다(선형 스케줄).`);});
};
A09Labs.video=el=>{
 U.setup(el,R('vsec','영상 길이 (초)',1,20,1,10)+S('vres','세로 해상도',[[480,'480p'],[720,'720p'],[1080,'1080p']],1080)+S('vpatch','잠재 조각 크기 p (픽셀로는 8p)',[[1,'1×1 (8픽셀)'],[2,'2×2 (16픽셀)'],[4,'4×4 (32픽셀)']],2));
 U.bind(el,()=>{const sec=U.value(el,'vsec'),h=U.value(el,'vres'),p=U.value(el,'vpatch'),r=M.video(sec,h,p);
  U.result(el,U.bars(['공간+시간 나눈 어텐션','전체 3D 어텐션'],[r.fact/1e8,r.full/1e8],'억 쌍',null,1),`${sec}초 ${h}p 24fps = <b>${r.frames}</b>프레임, 원시 값 <b>${F(r.rawGB,2)} GB</b><br>시간 4배·공간 8배 압축 뒤 잠재 프레임 ${r.latentFrames}개 × 프레임당 조각 ${r.perFrame.toLocaleString('ko-KR')}개 = 토큰 <strong>${r.tokens.toLocaleString('ko-KR')}</strong>개<br>전체 3D 어텐션 쌍 ${F(r.full/1e8,1)}억 vs 공간+시간으로 나눈 어텐션 ${F(r.fact/1e8,1)}억 → <b>${F(r.saving,0)}배</b> 절약<br>압축 비율은 교육용 가정이고, 토큰 수와 비용 비교는 그 가정 위의 실제 계산입니다.`);});
};
})();
