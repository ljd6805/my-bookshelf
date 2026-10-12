/* 7~10장 실험: 음성 응답 지연, 이미지 토큰 비용, MaskGIT 일정, 행동 토큰화. 계산은 A13Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A13UI,M=A13Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

/* 원본 레슨 20의 단계별 범위에서 가운데 값을 고른 시나리오(ms). 70B 프리필은 원본이 값을 주지 않아 가정했다. */
const PARTS={
 '7':[['마이크 → 오디오 토큰',60],['프리필(7B)',150],['첫 글 토큰',40],['Talker 첫 처리',20],['첫 음성 토큰',40],['잔차 VQ 복호',30],['파형 복호',65]],
 '70':[['마이크 → 오디오 토큰',60],['프리필(70B, 가정)',450],['첫 글 토큰',40],['Talker 첫 처리',20],['첫 음성 토큰',40],['잔차 VQ 복호',30],['파형 복호',65]]
};
A13Labs.omni=el=>{
 U.setup(el,S('omsize','Thinker 크기',[['7','7B'],['70','70B']],'7')+R('omrate','Talker 생성 속도 (음성 토큰/초)',20,200,5,80));
 U.bind(el,()=>{const parts=PARTS[U.text(el,'omsize')],rate=V(el,'omrate'),total=M.ttfab(parts),r=M.talkerRate(rate,50);
  U.result(el,U.bars(parts.map(p=>p[0]),parts.map(p=>p[1]),'밀리초',null,0),
  `첫 소리까지 = ${parts.map(p=>p[1]).join(' + ')} = <strong>${F(total,0)}ms</strong>${total<=500?' (원본 레슨이 말하는 대화 느낌의 기준 500ms 안)':' (500ms를 넘어 대답이 늦게 느껴짐)'}<br>Talker ${rate}개/초 ÷ 필요 50개/초 = <b>${F(r.factor,2)}배</b> ${r.ok?'→ 말하는 속도보다 빨리 만들어 끊기지 않습니다.':`→ 1초 분량을 말하는 데 ${F(1/r.factor,2)}초가 걸려 소리가 끊깁니다.`}<br>단계별 시간은 원본 레슨이 적은 범위의 가운데 값을 고른 시나리오이고, 합계와 비율은 실제 계산입니다.`);});
};

const SAMPLE=[0.12,0.47,0.83,0.31,0.66,0.05,0.92,0.58];
A13Labs.vqtokens=el=>{
 U.setup(el,R('vqres','정사각형 한 변 R (px)',256,1024,128,512)+S('vqf','토크나이저 축소 배율 f',[[8,'8 (Emu3 방식)'],[16,'16 (Chameleon 방식)']],16)+S('vqk','코드북 크기 K',[[16,'16'],[256,'256'],[8192,'8,192'],[32768,'32,768']],8192));
 U.bind(el,()=>{const R0=V(el,'vqres'),f=V(el,'vqf'),K=V(el,'vqk'),r=M.imageTokens(R0,f,K,30),other=M.imageTokens(R0,f===8?16:8,K,30),q=M.quantize(SAMPLE,K);
  U.result(el,U.bars([`축소 ${f} (현재)`,`축소 ${f===8?16:8} (비교)`],[r.seconds,other.seconds],'초 (초당 30토큰으로 한 토큰씩 생성)',null,1),
  `(${R0} ÷ ${f})² = ${r.side}² = <strong>${F(r.tokens,0)}토큰</strong>, 토큰당 log₂${F(K,0)} = ${F(Math.log2(K),0)}비트 → 그림 한 장 ${F(r.bits/8/1024,1)}KB의 번호 정보<br>초당 30토큰으로 하나씩 뽑으면 약 <b>${F(r.seconds,1)}초</b> (비교: 축소 ${f===8?16:8}이면 ${F(other.seconds,1)}초)<br>장난감 양자화: 밝기 8개를 K = ${F(K,0)}칸 균등 코드북에 맞추면 평균 제곱 오차 ${q.mse.toExponential(2)}${Number.isFinite(q.psnr)?`, PSNR ${F(q.psnr,1)}dB`:''}<br>토큰 수·시간은 실제 계산이며 디코딩 속도 30토큰/초는 원본 레슨의 예시값입니다. 양자화는 1차원 장난감 모형입니다.`);});
};

A13Labs.maskgit=el=>{
 U.setup(el,S('mgn','이미지 토큰 수 N',[[256,'256 (16×16)'],[1024,'1,024 (32×32)'],[4096,'4,096 (64×64)']],1024)+R('mgt','단계 수 T',2,32,1,8));
 U.bind(el,()=>{const N=V(el,'mgn'),T=V(el,'mgt'),s=M.maskSchedule(N,T),mx=Math.max(...s.commit),at=s.commit.indexOf(mx)+1;
  const chart=U.plot({lines:[{data:s.masked.map((m,t)=>[t,m]),color:'var(--accent)'}],points:s.masked.map((m,t)=>[t,m,'var(--orange)',4]),xmin:0,xmax:T,ymin:0,ymax:N,xlabel:'단계 t',ylabel:'아직 가린 토큰',label:`N ${N}, T ${T}에서 가린 토큰이 코사인 일정으로 줄어드는 그래프`});
  U.result(el,chart,
  `가린 토큰 ⌊${F(N,0)} · cos(πt / ${2*T})⌋: ${T<=12?s.masked.map(m=>F(m,0)).join(' → '):`${F(s.masked[0],0)} → … → 0`}<br>단계별 확정: ${T<=12?s.commit.map(c=>F(c,0)).join(', '):`첫 단계 ${F(s.commit[0],0)}, 가장 많은 단계 ${at}번째 ${F(mx,0)}, 마지막 ${F(s.commit[T-1],0)}`}<br>순전파 횟수: 가림 예측 <strong>${T}번</strong> · 한 토큰씩 자기회귀 ${F(N,0)}번 · 확산(원본 레슨 예시) 약 20번<br>일정과 횟수는 실제 계산이고, 단계당 계산량과 화질은 계산하지 않습니다.`);});
};

A13Labs.vla=el=>{
 U.setup(el,S('vlbins','관절 값을 나누는 칸 수',[[16,'16'],[64,'64'],[256,'256 (RT-2·OpenVLA)'],[1024,'1,024']],256)+R('vlhz','제어 주기 (Hz)',1,50,1,10));
 U.bind(el,()=>{const bins=V(el,'vlbins'),hz=V(el,'vlhz'),a=M.actionBin(0.337,bins),r=M.actionRate(7,hz,35);
  U.result(el,U.bars(['필요한 디코딩','가능한 디코딩 (가정)'],[r.need,35],'토큰/초',null,0),
  `칸 너비 2 / ${bins} = ${F(2/bins,4)}, 최대 오차 <b>${F(a.maxErr,4)}</b> · 예: 관절 값 0.337 → ${a.index}번 칸 → ${F(a.value,4)} (오차 ${F(a.err,4)})<br>7자유도 × ${hz}Hz = 초당 <strong>${r.need}토큰</strong> 필요, 가능한 35토큰/초 ${r.ok?'안에 듭니다.':'를 넘습니다.'} 이 속도로 낼 수 있는 최대 주기는 ${F(r.maxHz,1)}Hz<br>칸 수를 바꿔도 필요한 토큰 수는 그대로입니다. 35토큰/초는 원본 레슨의 “A100에서 4~5Hz”에서 거꾸로 잡은 가정이고, 나머지는 실제 계산입니다.`);});
};
})();
