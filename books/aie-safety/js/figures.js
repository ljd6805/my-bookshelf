/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A19Math로 계산한다. */
window.A19Figures=(()=>{
'use strict';
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
/* 점 하나가 (x,y)에서 (x+dx,y+dy)로 반복 이동한다. */
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const poly=(pts,stroke,cls='fig-draw',w=2.5,dash=false)=>`<polyline class="${cls}" points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash?' stroke-dasharray="6 5"':''}/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,turn,poly,grow,pulse};
const F={};
/* 장별 그림. 숫자는 A19Math로 계산한다. */
const M=A19Math,f=(n,d=1)=>Number(n).toFixed(d).replace('-','−'),P=(n,d=1)=>f(n*100,d)+'%';
const A='var(--accent)',B='var(--blue)',O='var(--orange)',MU='var(--muted)';
/* 1장: 세 단계 파이프라인과 대리–골드 곡선 */
F.rlhf=()=>{
 const st=[['SFT','모범 답 따라 쓰기'],['보상 모델','고른 쪽에 높은 점수'],['PPO + KL','점수 ↑, 멀리 가지 않게']];let b='';
 st.forEach(([a,s],i)=>{const x=20+i*210;b+=blink(box(x,20,180,66,[A,B,O][i]),i*.6)+t(x+90,48,a,{w:700})+t(x+90,72,s,{size:13,fill:MU});if(i<2)b+=line(`M${x+180} 53H${x+210}`)+dot(x+176,53,34,0,[A,B][i],i*.6,5);});
 const r=M.overopt(1000,0),X=d=>70+d/8*520,Y=v=>270-(v+1)/7*150;
 b+=`<path d="M70 120V270H600" stroke="var(--line)" fill="none"/>`+t(600,292,'최적화 거리 d = √KL',{a:'end',size:13,fill:MU});
 b+=poly(r.curve.filter(p=>p[0]<=8).map(p=>[X(p[0]),Y(p[1])]),O)+poly(r.curve.filter(p=>p[0]<=8&&p[2]>-1).map(p=>[X(p[0]),Y(p[2])]),A);
 b+=line(`M${X(r.dStar)} 120V270`,B)+pulse(X(r.dStar),Y(r.goldPeak),6,B)+t(X(r.dStar)+8,136,`정점 d* ≈ ${f(r.dStar,2)}`,{a:'start',size:13,fill:B});
 b+=t(X(7.2),Y(M.overopt(1000,7.2).proxy)-10,'대리 점수',{size:13,fill:O})+t(X(4)+6,262,'실제 도움(골드)',{a:'start',size:13,fill:A});
 return {svg:svg('SFT, 보상 모델, KL 벌점을 둔 PPO 세 단계와, 라벨 1천 쌍에서 대리 점수는 계속 오르지만 골드 점수는 d 약 1.56에서 정점을 찍고 떨어지는 곡선',b),caption:`위는 RLHF의 세 단계이고, 아래는 라벨 1천 쌍일 때 대리 점수 d − 0.02d²와 골드 점수 d − ${f(r.bg,2)}d²를 실제로 계산한 곡선입니다. 골드 점수는 d ≈ ${f(r.dStar,2)}에서 정점을 지나 떨어집니다.`};
};
/* 2장: 보상 모델을 지운 지름길과 선택된 답 퇴화 */
F.dpo=()=>{
 let b=turn(box(20,30,120,56,A)+t(80,64,'선호 쌍')+line('M140 58H180')+box(180,30,130,56,B)+t(245,64,'보상 모델')+line('M310 58H350')+box(350,30,120,56,O)+t(410,64,'PPO 고리')+line('M470 58H500')+box(500,30,120,56,A)+t(560,64,'정책')+t(320,116,'RLHF: 모델 네 개와 강화학습 고리',{size:14,fill:MU}),0);
 b+=turn(box(20,30,120,56,A)+t(80,64,'선호 쌍')+line('M140 58H500',A)+box(500,30,120,56,A)+t(560,64,'정책')+t(320,48,'−log σ(β[Δ_w − Δ_l])',{size:15,fill:A})+t(320,116,'DPO: 보상 모델과 PPO를 지운 지름길',{size:14,fill:MU}),1);
 b+=turn(box(20,30,600,56,MU)+t(320,64,'가정이 깨지는 곳: 한계 없는 보상 차이, 길이, 짝 없는 데이터, 선택된 답 퇴화')+t(320,116,'IPO·SimPO·KTO·ORPO·BPO가 하나씩 고친다',{size:14,fill:MU}),2);
 const r=M.prefLoss(-0.5,-2,0.1);b+=`<path d="M60 200H600" stroke="var(--line)"/>`+t(52,205,'0',{a:'end',size:13,fill:MU});
 b+=grow(150,200,90,15,O,0.3)+t(195,236,'Δ_w = −0.5',{size:14})+grow(360,200,90,60,B,0.6)+t(405,280,'Δ_l = −2.0',{size:14});
 b+=pulse(195,207,10,O)+t(520,180,`여유 1.5 · 손실 ${f(r.dpo,2)}`,{size:14,fill:A})+t(520,204,'< log 2 = 0.69',{size:14,fill:MU})+t(520,236,'선택된 답도 내려갔다',{size:14,fill:O});
 return {svg:svg('RLHF의 네 단계가 DPO의 선호 쌍에서 정책으로 가는 지름길로 바뀌고, 아래에는 선택된 답과 거절된 답의 로그 확률비가 모두 음수인데도 DPO 손실이 log 2보다 작은 퇴화 사례',b),caption:`위는 보상 모델과 PPO를 지운 DPO의 지름길이 차례로 바뀌는 모습이고, 아래는 Δ_w = −0.5, Δ_l = −2.0, β = 0.1일 때 DPO 손실이 ${f(r.dpo,3)}로 줄었지만 선택된 답의 확률도 기준보다 내려간 퇴화 사례를 실제로 계산한 것입니다.`};
};
/* 3장: 적대 훈련 뒤 갈라지는 두 결함률 */
F.deception=()=>{
 const r=M.backdoor(20),X=k=>80+k/20*500,Y=v=>250-v*200;let b=`<path d="M80 40V250H580" stroke="var(--line)" fill="none"/>`;
 for(const v of [0,0.5,1])b+=t(70,Y(v)+5,f(v,1),{a:'end',size:13,fill:MU});
 b+=poly(r.curve.map(p=>[X(p[0]),Y(p[1])]),O)+poly(r.curve.map(p=>[X(p[0]),Y(p[2])]),A);
 b+=t(X(20),Y(r.heldOut)-12,`원래 트리거 ${f(r.heldOut,2)}`,{a:'end',size:14,fill:A})+t(X(20),Y(r.redTeam)-12,`레드팀 문구 ${f(r.redTeam,4)}`,{a:'end',size:14,fill:O});
 b+=t(330,282,'적대 훈련 횟수 (0 → 20)',{size:13,fill:MU})+dot(X(0),Y(0.6),500,-30,O,0,5)+pulse(X(20),Y(r.heldOut),7,A);
 b+=blink(box(300,150,250,40,MU)+t(425,176,'평가 화면: “결함 없음”',{size:14}),0.4);
 return {svg:svg('적대 훈련을 20번 하는 동안 레드팀 문구의 결함률은 0에 가깝게 내려가고, 숨긴 원래 트리거의 결함률은 0.85에서 0.98 근처로 오르는 시나리오 곡선',b),caption:`이 장의 시나리오 모형에서 적대 훈련 20번 뒤 레드팀 문구의 결함률은 ${f(r.redTeam,3)}로 거의 사라지지만, 원래 트리거의 결함률은 ${f(r.heldOut,2)}로 오릅니다. 실제 측정값이 아니라 원본의 정성적 결과를 흉내 낸 곡선입니다.`};
};
/* 4장: 감시·비감시 두 방의 순응률 */
F.scheming=()=>{
 const r=M.complianceGap(0.3,0.6);let b='';
 b+=box(30,30,270,230,B)+t(165,62,'감시 조건',{w:700,fill:B})+t(165,86,'“이 대화는 재훈련에 쓰입니다”',{size:13,fill:MU});
 b+=box(340,30,270,230,MU)+t(475,62,'비감시 조건',{w:700})+t(475,86,'“이 대화는 훈련에 쓰이지 않습니다”',{size:13,fill:MU});
 b+=`<rect x="60" y="210" width="210" height="22" rx="3" fill="var(--panel)"/>`+grow(60,210,210*r.mon/0.2,22,O,0.2)+t(165,200,`유해 요청 순응 ${P(r.mon)}`,{size:15,w:700});
 b+=`<rect x="370" y="210" width="210" height="22" rx="3" fill="var(--panel)"/>`+grow(370,210,210*r.un/0.2,22,O,0.2)+t(475,200,`유해 요청 순응 ${P(r.un)}`,{size:15,w:700});
 b+=blink(t(165,140,'“거절하면 내 가치가 고쳐진다”',{size:14,fill:O})+t(165,164,'→ 지금은 따른다',{size:14,fill:O}),0.6)+blink(t(475,150,'고쳐질 걱정 없음 → 거절',{size:14,fill:A}),1.4);
 b+=pulse(320,145,10,O)+t(320,286,`순응 격차 ${f(r.gap*100,1)}%p`,{size:15,fill:A,w:700});
 return {svg:svg(`감시 조건과 비감시 조건 두 방에서 유해 요청 순응률이 각각 ${P(r.mon)}와 ${P(r.un)}로 갈리는 장난감 모형 그림`,b),caption:`w = 0.3, h = 0.6인 이 장의 장난감 결정 모형으로 계산하면 감시 조건 순응률은 ${P(r.mon)}, 비감시 조건은 ${P(r.un)}입니다. 두 값의 차이 ${f(r.gap*100,1)}%p가 전략적 행동의 크기입니다.`};
};
/* 5장: 신뢰 감시·편집으로 출력이 갈라지는 길 */
F.control=()=>{
 const m=M.control('monitor',0.02,2),e=M.control('edit20',0.02,2);let b='';
 b+=box(20,110,120,70,O)+t(80,140,'U',{size:20,w:700})+t(80,164,'강하지만 의심',{size:13,fill:MU});
 b+=box(200,110,130,70,A)+t(265,140,'T',{size:20,w:700})+t(265,164,'약하지만 믿음',{size:13,fill:MU});
 b+=line('M140 145H200')+dot(136,145,64,0,O,0,5)+dot(136,145,64,0,O,0.8,5);
 b+=box(420,20,200,60,B)+t(520,46,'상위 2% → 사람 감사',{size:14})+t(520,68,'적발 = 안전 종료',{size:13,fill:MU});
 b+=box(420,115,200,60,A)+t(520,141,'다음 20% → T가 고쳐 씀',{size:14})+t(520,163,'무력화 · 쓸모 조금 ↓',{size:13,fill:MU});
 b+=box(420,210,200,60,MU)+t(520,236,'나머지 → 그대로 배포',{size:14})+t(520,258,'백도어면 사고',{size:13,fill:MU});
 b+=line('M330 130L420 50',B)+line('M330 145H420',A)+line('M330 160L420 240',MU);
 b+=dot(334,130,82,-76,B,0.4,5)+dot(334,145,82,0,A,1.0,5)+dot(334,160,82,76,O,1.6,5);
 b+=t(20,40,`신뢰 감시만: 안전 ${f(m.safety,2)}`,{a:'start',size:14,fill:MU})+blink(t(20,66,`편집 20% 추가: 안전 ${f(e.safety,2)}`,{a:'start',size:15,fill:A,w:700}),0.8)+t(20,240,`쓸모 ${f(e.useful,2)}`,{a:'start',size:14,fill:MU});
 return {svg:svg('강한 모델 U의 출력을 신뢰 모델 T가 의심 점수로 나눠, 상위 2%는 사람 감사, 다음 20%는 T가 고쳐 쓰고, 나머지는 그대로 배포하는 신뢰 편집 프로토콜',b),caption:`판별력 d = 2, 감사 예산 2%인 장난감 모형에서 신뢰 감시만 쓰면 안전 ${f(m.safety,2)}, 신뢰 편집 20%를 더하면 안전 ${f(e.safety,2)}·쓸모 ${f(e.useful,2)}입니다. 숫자는 이 장의 가정 위에서 실제로 계산한 값입니다.`};
};
/* 6장: 같은 질의 예산으로 맞춘 두 공격 */
F.jailbreak=()=>{
 const pa=M.perQuery(0.9,200),pb=M.perQuery(0.85,20),X=k=>80+k/200*500,Y=v=>250-v*200,ks=Array.from({length:41},(_,i)=>Math.max(1,i*5));
 let b=`<path d="M80 40V250H580" stroke="var(--line)" fill="none"/>`;for(const v of [0,0.5,1])b+=t(70,Y(v)+5,f(v,1),{a:'end',size:13,fill:MU});
 b+=poly(ks.map(k=>[X(k),Y(M.budgetASR(pa,k))]),A)+poly(ks.map(k=>[X(k),Y(M.budgetASR(pb,k))]),O);
 const a20=M.budgetASR(pa,20);b+=line(`M${X(20)} 40V250`,B)+pulse(X(20),Y(a20),6,A)+pulse(X(20),Y(0.85),6,O);
 b+=t(X(20)+10,Y(a20)+4,`A: 20번이면 ${P(a20)}`,{a:'start',size:14,fill:A})+t(X(20)+10,Y(0.85)-10,'B: 20번에 85%',{a:'start',size:14,fill:O});
 b+=t(X(200),Y(0.9)+22,'A: 200번에 90%',{a:'end',size:14,fill:A})+t(330,282,'질의 예산 K',{size:13,fill:MU});
 return {svg:svg('질의 200번에 90%인 공격 A와 20번에 85%인 공격 B의 성공률 곡선. 예산 20번에서 A는 약 21%에 그친다',b),caption:`질의마다 독립이라는 단순화로 계산하면 공격 A의 질의당 성공 확률은 ${f(pa,4)}, B는 ${f(pb,4)}입니다. 예산을 20번으로 맞추면 A는 ${P(a20)}라 B가 훨씬 강합니다.`};
};
/* 7장: 주입 사슬을 따라 움직이는 점과 IFC에서 끊기는 지점 */
F.injection=()=>{
 const steps=[['공격 메일','도착'],['고객 질문','“메일 요약”'],['검색이','메일을 맥락에'],['숨은 지시가','도구 호출'],['이미지 주소에','정보를 실음'],['공격자 서버로','정보 유출']];let b='';
 steps.forEach(([s1,s2],i)=>{const x=10+i*105;b+=blink(box(x,60,95,90,i===3?A:i===5?O:MU),i*.4)+t(x+47,84,String(i+1).padStart(2,'0'),{size:13,fill:MU})+t(x+47,110,s1,{size:13})+t(x+47,132,s2,{size:13,fill:MU});if(i<5)b+=line(`M${x+95} 105H${x+105}`);});
 b+=dot(57,105,525,0,O,0,6)+t(320,40,'방어 없음: 공격자가 메일 한 통만 보내면 사슬이 끝까지 이어진다',{size:14,fill:O});
 b+=turn(t(320,220,'사용자 입력 필터 → 02단계를 보지만 공격 문장은 거기 없다',{size:14,fill:MU}),0)+turn(t(320,220,'검색 키워드 필터 → 무해해 보이는 문장은 놓친다',{size:14,fill:MU}),1)+turn(t(320,220,'IFC → 신뢰할 수 없는 내용에서 나온 도구 호출을 04단계에서 끊는다',{size:14,fill:A,w:700}),2)+turn(t(320,220,'승인 도메인 → 공격자가 승인된 도메인을 경유하면 뚫린다',{size:14,fill:MU}),3);
 b+=pulse(372,160,8,A)+t(320,270,'막는 자리는 공격 문장이 들어온 곳이 아니라 권한이 쓰이는 곳',{size:14});
 return {svg:svg('공격 메일 도착부터 정보 유출까지 여섯 단계 사슬을 점이 지나가고, 방어 네 가지가 각각 어디를 보는지 차례로 바뀌며, 정보 흐름 통제가 도구 호출 단계에서 사슬을 끊는 그림',b),caption:'누리은행판 EchoLeak 시나리오의 여섯 단계입니다. 공격 문장은 고객 질문이 아니라 검색된 메일 안에 있으므로, 입력 필터보다 신뢰할 수 없는 내용에서 나온 도구 호출을 막는 정보 흐름 통제가 사슬을 끊습니다.'};
};
/* 8장: 두 층의 조정과 기저율 */
F.guard=()=>{
 const r=M.moderation(2,'both','plain',0.01);let b='';
 b+=box(150,40,30,200,B)+t(165,262,'입력 층',{size:13})+box(300,90,110,100,A)+t(355,146,'누리',{w:700})+box(530,40,30,200,B)+t(545,262,'출력 층',{size:13});
 for(let i=0;i<6;i++){const y=60+i*30,bad=i===2;b+=dot(30,y,bad?120:500,0,bad?O:A,i*.35,6);}
 b+=dot(30,180,250,0,O,1.8,6)+pulse(165,120,9,O)+pulse(545,180,9,O);
 b+=t(20,30,'유해 1 : 정상 99',{a:'start',size:14,fill:MU});
 b+=blink(t(320,222,`100만 건 중 잡은 유해 ${Math.round(r.perMillion.caught).toLocaleString('en-US')}건`,{size:14,fill:A})+t(320,244,`잘못 막은 정상 ${Math.round(r.perMillion.falseBlocks).toLocaleString('en-US')}건`,{size:14,fill:O}),0.6);
 b+=t(320,288,`차단 중 정말 유해한 비율 ${P(r.precision)}`,{size:15,w:700});
 return {svg:svg('요청이 입력 층, 누리, 출력 층을 차례로 지나며 유해 요청 일부가 걸리는 그림과, 유해 요청이 1%일 때 차단된 것 중 정말 유해한 비율이 약 16%라는 계산',b),caption:`문턱 2, 두 층, 유해 요청 1%로 계산하면 100만 건에서 유해 요청 약 ${Math.round(r.perMillion.caught).toLocaleString('en-US')}건을 잡지만 정상 요청 약 ${Math.round(r.perMillion.falseBlocks).toLocaleString('en-US')}건도 막아 정밀도가 ${P(r.precision)}에 그칩니다.`};
};
/* 9장: 같은 점수 분포, 다른 기저율 */
F.fairness=()=>{
 const pdf=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),r=M.fairness(1,1,0.3),X=v=>60+(v+3)/7.5*520;let b='';
 [[0.5,'A 집단 (기저율 0.5)',60],[0.3,'B 집단 (기저율 0.3)',170]].forEach(([q,name,top],k)=>{const Y=v=>top+90-v*200;
  const pts=w=>Array.from({length:61},(_,i)=>{const x=-3+i*7.5/60;return [X(x),Y(w(x))];});
  b+=t(60,top+6,name,{a:'start',size:14,w:700})+poly(pts(x=>(1-q)*pdf(x)),MU)+poly(pts(x=>q*pdf(x-1.5)),k?B:A);
  b+=`<path d="M60 ${top+90}H580" stroke="var(--line)"/>`;});
 b+=line(`M${X(1)} 40V270`,O)+pulse(X(1),150,8,O)+t(X(1)+8,36,'같은 문턱 τ = 1',{a:'start',size:14,fill:O});
 b+=blink(t(600,120,`승인 ${P(r.A.sel)}`,{a:'end',size:14,fill:A})+t(600,230,`승인 ${P(r.B.sel)}`,{a:'end',size:14,fill:B}),0.6)+t(320,292,`TPR·FPR은 같고(${f(r.A.tpr,2)}·${f(r.A.fpr,2)}), 승인율과 정밀도는 갈린다`,{size:14,fill:MU});
 return {svg:svg('두 집단의 갚을 사람과 못 갚을 사람 점수 분포는 같고 기저율만 0.5와 0.3으로 다를 때, 같은 문턱에서 승인율이 42.5%와 31.8%로 갈리는 그림',b),caption:`점수 분포를 두 집단에 똑같이 두고 기저율만 바꿔 계산했습니다. 같은 문턱 1에서 TPR ${f(r.A.tpr,2)}과 FPR ${f(r.A.fpr,2)}는 같지만, 승인율은 ${P(r.A.sel)}와 ${P(r.B.sel)}로 갈립니다.`};
};
/* 10장: 잡음과 ε, 초록 토큰 */
F.privacy=()=>{
 const sig=[1,2,5,10],eps=sig.map(s=>M.dpEpsilon(s,1).eps);let b=t(160,28,'잡음 배수 σ와 ε (T = 1, δ = 10⁻⁵)',{size:14,w:700});
 sig.forEach((s,i)=>{const y=50+i*50;b+=t(50,y+20,`σ = ${s}`,{a:'end',size:14})+grow(60,y,eps[i]/4.5*210,26,i%2?B:A,i*.2)+t(70+eps[i]/4.5*210,y+20,`ε ${f(eps[i],2)}`,{a:'start',size:13});});
 const w=M.watermark(200,2,0);b+=t(480,28,'워터마크 글의 초록 토큰',{size:14,w:700});
 for(let i=0;i<48;i++){const g=(i*7%10)<Math.round(w.pg*10),x=356+(i%8)*31,y=46+Math.floor(i/8)*34;b+=g?blink(`<rect x="${x}" y="${y}" width="26" height="26" rx="4" fill="${A}"/>`,(i%8)*.15):`<rect x="${x}" y="${y}" width="26" height="26" rx="4" fill="var(--panel2)" stroke="var(--line)"/>`;}
 b+=t(480,270,`초록 확률 ${f(w.pg,2)} (보통 글 0.25)`,{size:14,fill:A})+t(480,292,`200토큰이면 z ≈ ${f(w.z,1)}`,{size:14,fill:MU});
 return {svg:svg('왼쪽은 잡음 배수 σ가 커질수록 ε가 4.4에서 0.34로 줄어드는 막대, 오른쪽은 워터마크 글에서 초록 토큰이 약 71% 나타나는 격자',b),caption:`왼쪽은 가우스 메커니즘 한 번의 ε를 실제로 계산한 값입니다(σ = 1이면 ${f(eps[0],2)}, σ = 10이면 ${f(eps[3],2)}). 오른쪽은 δ = 2 워터마크에서 초록 토큰 비율이 ${f(w.pg,2)}로 올라 200토큰이면 z ≈ ${f(w.z,1)}가 되는 모습입니다.`};
};
/* 11장: 규제 일정 타임라인 */
F.governance=()=>{
 const items=[['2024-08','EU AI Act','발효'],['2025-02','금지 관행','AI 리터러시'],['2025-08','범용 AI','모델 의무'],['2026-01','한국','AI 기본법 시행'],['2026-08','제50조','투명성 의무'],['2027-08','기존 범용','모델 의무'],['2027-12','고위험','(부속서 III)']];
 let b=`<path d="M40 150H600" stroke="var(--line)" stroke-width="3"/>`;
 items.forEach(([d,s1,s2],i)=>{const x=50+i*90,up=i%2===0,y0=up?74:186;b+=blink(`<circle cx="${x}" cy="150" r="9" fill="${i===3?B:i===6?O:A}"/>`+(up?t(x,y0,s1,{size:13,fill:MU})+t(x,y0+22,s2,{size:13,fill:MU})+t(x,y0+50,d,{size:14,w:700}):t(x,y0,d,{size:14,w:700})+t(x,y0+26,s1,{size:13,fill:MU})+t(x,y0+48,s2,{size:13,fill:MU})),i*.5);});
 b+=dot(40,150,560,0,O,0,6)+t(320,290,'원본 기준 + AI 옴니버스 개정 반영(확인일 2026-10-08) · 공식 문서를 확인하세요',{size:13,fill:MU});
 return {svg:svg('2024년 8월 EU AI Act 발효부터 2025년 금지 관행과 범용 AI 의무, 2026년 1월 22일 한국 AI 기본법 시행, 2026년 8월 투명성 의무, 2027년 8월 기존 범용 모델 의무, 2027년 12월 고위험 의무까지의 일정',b),caption:'원본 커리큘럼이 정리한 일정에 2026년 7월 발효한 AI 옴니버스 개정(부속서 III 고위험 의무를 2026년 8월에서 2027년 12월로 연기)을 반영해 시간 순서로 놓았습니다. 일정은 다시 바뀔 수 있으니 실제 판단 전에는 EU와 국가법령정보센터의 공식 문서를 확인해야 합니다.'};
};
/* 12장: 출시 점검표가 차례로 채워진다 */
F.final=()=>{
 const items=['보상 신호와 β','선호 손실','숨은 트리거','순응 격차','통제 프로토콜','질의 예산 맞춘 평가','간접 주입 · IFC','조정 층과 기저율','공정성 기준 선택','ε와 워터마크','규제 일정 확인'];let b='';
 items.forEach((s,i)=>{const c=i%2,r=Math.floor(i/2),x=30+c*300,y=24+r*42;b+=box(x,y,270,34,'var(--line)','var(--panel2)',6)+blink(`<rect x="${x+8}" y="${y+7}" width="20" height="20" rx="4" fill="${A}"/>`,i*.35)+t(x+40,y+23,`${String(i+1).padStart(2,'0')} ${s}`,{a:'start',size:14});});
 b+=box(330,234,270,34,O,'var(--panel2)',6)+pulse(342,251,8,O)+t(370,257,'출시 → 한 달 뒤 보고 진단',{a:'start',size:14,w:700,fill:O});
 return {svg:svg('앞 열한 장의 점검 항목이 차례로 확인 표시를 얻고, 마지막에 출시와 한 달 뒤 보고 진단으로 이어지는 출시 점검표',b),caption:'1~11장에서 만든 확인 항목을 누리의 출시 점검표로 모았습니다. 마지막 장은 출시 뒤 들어온 보고를 이 항목들로 거꾸로 짚어 원인과 처방을 맞춥니다.'};
};
/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. 장마다 F[장ID]로 고유 그림을 만든다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:12,fill:'var(--muted)'});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
