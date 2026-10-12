/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A01Math로 계산한다. */
window.A01Figures=(()=>{
'use strict';
const M=A01Math;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,turn,grow,pulse};
const F={};
const C=['var(--muted)','var(--blue)','var(--accent)','var(--orange)'];

F.stack=()=>{
 const layers=[['1 시스템 바탕','OS · 셸 · Git · GPU 드라이버'],['2 패키지 관리자','uv · pnpm · cargo'],['3 언어 실행기','Python · Node.js · Rust'],['4 AI 라이브러리','PyTorch · transformers']];
 let b='';layers.forEach(([a,s],i)=>{const y=226-i*56;b+=blink(box(30,y,330,46,C[i])+t(48,y+21,a,{a:'start',w:700})+t(48,y+39,s,{a:'start',size:13,fill:'var(--muted)'}),i*.7);});
 b+=line('M14 268V40','var(--accent)')+dot(14,262,0,-210,'var(--accent)',0,6)+t(24,40,'설치 순서 ↑',{a:'start',size:13,fill:'var(--accent)'});
 const r=M.preflight('beginner','gpu');
 b+=box(400,52,220,206,'var(--line)','var(--chart)',12)+t(510,80,'입문 경로 사전 점검',{size:14,fill:'var(--muted)'});
 r.required.forEach((x,i)=>{b+=t(420,116+i*32,`필수 ${x.key==='python'?'Python':'Git'}`,{a:'start'})+t(600,116+i*32,x.ok?'통과':'실패',{a:'end',w:700,fill:'var(--accent)'});});
 b+=t(420,180,'선택 GPU',{a:'start'})+t(600,180,'없음',{a:'end',fill:'var(--orange)'})+`<path d="M420 198H600" stroke="var(--line)"/>`+`<circle cx="440" cy="229" r="7" fill="var(--accent)"/>`+pulse(440,229,14,'var(--accent)')+t(530,236,`종료 코드 ${r.exit}`,{size:22,w:700,fill:'var(--accent)'});
 return {svg:svg(`네 층을 아래에서 위로 쌓고, 입문 경로 점검은 GPU가 없어도 필수 ${r.passed}/${r.total} 통과로 종료 코드 ${r.exit}를 내는 그림`,b),caption:`작업 환경은 아래층부터 쌓고, 사전 점검은 필수 검사만으로 시작 여부를 정합니다. 오른쪽 점검 결과는 원본 경로 표를 실제로 계산한 것이고, 올라가는 점은 설치 순서를 보여 주는 시각적 비유입니다.`};
};
F.envs=()=>{
 let b=t(160,34,'전역 설치 · Python 하나',{w:700})+t(480,34,'가상 환경 · 프로젝트마다',{w:700});
 b+=box(40,60,240,180,'var(--orange)','var(--chart)',12)+t(160,90,'site-packages',{size:14,fill:'var(--muted)'});
 b+=turn(box(80,110,160,56,'var(--accent)')+t(160,144,'torch 2.6 설치',{w:700}),0)+turn(box(80,110,160,56,'var(--orange)')+t(160,144,'torch 2.1이 덮어씀',{w:700,fill:'var(--orange)'}),1)+turn(box(80,110,160,56,'var(--orange)')+t(160,144,'review-lab 깨짐',{w:700,fill:'var(--orange)'}),2)+turn(box(80,110,160,56,'var(--accent)')+t(160,144,'2.6 다시 설치',{w:700}),3);
 b+=t(160,200,'나중에 깐 쪽이 이긴다',{size:14,fill:'var(--muted)'});
 [['review-lab/.venv','torch 2.6','var(--accent)'],['old-project/.venv','torch 2.1','var(--blue)']].forEach(([n,v,c],i)=>{const y=60+i*96;b+=box(360,y,240,80,c,'var(--chart)',10)+t(380,y+30,n,{a:'start',size:14,fill:'var(--muted)'})+blink(t(380,y+60,v+' · 정상',{a:'start',w:700,fill:c}),i*.8);});
 b+=line('M320 150H350','var(--muted)')+t(320,276,'운영체제와 GPU 드라이버는 양쪽 모두 공유합니다',{size:14,fill:'var(--muted)'});
 return {svg:svg('전역 설치에서는 torch 버전이 서로 덮어쓰고, 가상 환경에서는 두 프로젝트가 각자의 버전을 갖는 그림',b),caption:'왼쪽은 한 Python에 두 프로젝트가 번갈아 설치하며 서로를 깨뜨리는 장면이고, 오른쪽은 .venv 폴더마다 자기 버전을 두는 장면입니다. 버전 번호는 교육용 예이며 그림은 시나리오입니다.'};
};
F.git=()=>{
 const r=M.gitMerge(2,1,2),X=i=>70+i*100,yM=110,yE=210;let b='';
 const node=(x,y,s,c,d)=>blink(`<circle cx="${x}" cy="${y}" r="20" fill="var(--panel2)" stroke="${c}" stroke-width="3"/>`+t(x,y+5,s,{size:14,w:700}),d);
 b+=`<path d="M${X(0)} ${yM}H${X(4)}M${X(1)} ${yM}C${X(1)+40} ${yE} ${X(2)-40} ${yE} ${X(2)} ${yE}H${X(3)}C${X(3)+50} ${yE} ${X(4)-40} ${yM+30} ${X(4)} ${yM}" fill="none" stroke="var(--line)" stroke-width="3"/>`;
 b+=node(X(0),yM,'1','var(--muted)',0)+node(X(1),yM,'2','var(--muted)',.4)+node(X(2),yM,'m1','var(--accent)',.8)+node(X(2),yE,'e1','var(--blue)',1.2)+node(X(3),yE,'e2','var(--blue)',1.6)+node(X(4),yM,'M','var(--orange)',2.2)+pulse(X(4),yM,26,'var(--orange)');
 b+=t(X(0),60,'main',{fill:'var(--accent)',w:700})+t(X(2),268,'experiment',{fill:'var(--blue)',w:700})+t(X(4),62,'병합 커밋',{fill:'var(--orange)'});
 b+=box(510,40,120,96,'var(--line)','var(--chart)',8)+t(570,70,'log --oneline',{size:13,fill:'var(--muted)'})+t(570,112,`${r.logCount}줄`,{size:26,w:700,fill:'var(--accent)'});
 return {svg:svg(`main에서 갈라진 experiment 브랜치가 커밋 두 개 뒤 병합 커밋으로 합쳐지고 기록은 ${r.logCount}줄이 되는 그림`,b),caption:`main에도 새 커밋(m1)이 생겼으므로 두 줄기를 잇는 병합 커밋 M이 필요합니다. 기록 ${r.logCount}줄은 실제로 센 값이고, 커밋이 차례로 나타나는 움직임은 시간 순서를 보여 줍니다.`};
};
F.gpu=()=>{
 const cap=16,sx=360/28,rows=[3,7,13].map(p=>[p,M.vramFit(p,2,cap,0)]);let b=t(30,36,'fp16 가중치 = 파라미터 × 2바이트 · GPU 16 GB',{a:'start',size:15,fill:'var(--muted)'});
 rows.forEach(([p,r],i)=>{const y=70+i*64;b+=t(30,y+26,`${p}B`,{a:'start',size:17,w:700})+box(90,y,360,36,'var(--line)','var(--panel2)',4)+grow(90,y,r.weights*sx,36,r.fits?'var(--accent)':'var(--orange)',i*.4)+t(462,y+24,`${r.weights} GB · ${r.fits?'들어감':'넘침'}`,{a:'start',w:700,fill:r.fits?'var(--accent)':'var(--orange)'});});
 b+=`<path class="fig-dash" d="M${90+cap*sx} 56V262" stroke="var(--orange)" stroke-width="2"/>`+t(90+cap*sx,282,'16 GB',{fill:'var(--orange)',size:14});
 b+=t(30,282,'가중치만 센 하한',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('3B 6GB, 7B 14GB, 13B 26GB의 fp16 가중치를 16GB 선과 비교하는 막대 그림',b),caption:'파라미터당 2바이트로 계산한 가중치 막대가 16GB 선을 넘는지 봅니다. 숫자는 원본의 어림 규칙으로 실제 계산했고, 실행 여유와 학습용 메모리는 넣지 않은 하한입니다.'};
};
F.remote=()=>{
 let b=box(20,90,150,110,'var(--blue)','var(--chart)',10)+t(95,122,'내 노트북',{w:700})+turn(t(95,160,'SSH 연결됨',{fill:'var(--accent)'}),0)+turn(t(95,160,'뚜껑 닫힘',{fill:'var(--orange)'}),1)+turn(t(95,160,'접속 끊김',{fill:'var(--orange)'}),2)+turn(t(95,160,'attach',{fill:'var(--accent)'}),3);
 b+=line('M170 145H250','var(--blue)')+t(210,132,'ssh',{size:13,fill:'var(--muted)'});
 b+=box(250,30,370,240,'var(--accent)','var(--chart)',12)+t(268,56,'GPU 상자 · tmux 세션 “train”',{a:'start',w:700});
 const panes=[['python train.py','Epoch 12/100'],['watch nvidia-smi','GPU 78%'],['tail -f train.log','loss: 0.41']];
 panes.forEach(([a,s],i)=>{const x=268+(i%2)*176,y=74+Math.floor(i/2)*96,w=i===2?336:160;b+=box(x,y,w,82,'var(--line)')+t(x+12,y+28,a,{a:'start',size:14})+blink(t(x+12,y+58,s,{a:'start',size:14,fill:'var(--accent)'}),i*.5);});
 b+=dot(286,240,300,0,'var(--accent)',0,5)+t(268,290,'노트북이 닫혀도 세션 안의 학습은 계속 돕니다',{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('노트북이 닫혀 SSH가 끊겨도 원격 GPU 상자의 tmux 세션에서 학습, GPU 감시, 로그 패널이 계속 도는 그림',b,300),caption:'tmux 세션은 서버에 남으므로 노트북의 상태가 바뀌어도 패널 셋이 계속 돕니다. 화면의 숫자는 예시이고 그림은 시나리오입니다.'};
};
F.docker=()=>{
 const r=M.dockerBuild('code','good');let b=t(30,34,'코드 한 줄을 고치고 다시 빌드',{a:'start',w:700});
 r.layers.slice().reverse().forEach((l,i)=>{const y=52+i*46,c=l.rebuilt?'var(--orange)':'var(--accent)';b+=(l.rebuilt?blink(box(30,y,330,38,c),0):box(30,y,330,38,c))+t(46,y+25,l.name,{a:'start',size:14})+t(344,y+25,l.rebuilt?'다시 빌드':'캐시',{a:'end',w:700,fill:c});});
 b+=t(195,290,'↑ 위층일수록 나중에 쌓임',{size:13,fill:'var(--muted)'});
 b+=box(400,60,220,180,'var(--line)','var(--chart)',12)+t(510,94,'다시 빌드한 시간',{size:14,fill:'var(--muted)'})+t(510,148,`${r.sec}초`,{size:34,w:700,fill:'var(--accent)'})+t(510,190,`전부 빌드하면 ${r.full}초`,{size:14})+t(510,218,`캐시 재사용 ${r.cached}개 층`,{size:14,fill:'var(--muted)'})+pulse(372,71,8,'var(--orange)');
 return {svg:svg(`코드 층만 다시 빌드해 ${r.sec}초가 걸리고 나머지 ${r.cached}개 층은 캐시를 쓰는 도커 층 그림`,b),caption:`COPY 코드를 맨 뒤에 둔 Dockerfile에서는 코드 층만 다시 만듭니다. 캐시 규칙은 실제 계산이고, 층별 시간(초)은 교육용 가정값입니다.`};
};
F.keys=()=>{
 let b=box(20,40,150,60,'var(--blue)')+t(95,76,'.env 파일',{w:700})+box(20,190,150,60,'var(--blue)')+t(95,226,'train.py',{w:700});
 b+=box(250,130,150,70,'var(--accent)','var(--chart)')+t(325,160,'.gitignore',{w:700})+t(325,184,'.env 막음',{size:13,fill:'var(--accent)'});
 b+=box(470,190,150,60,'var(--muted)')+t(545,226,'Git 기록',{w:700})+box(470,40,150,60,'var(--orange)')+t(545,68,'API 서버',{w:700})+t(545,88,'x-api-key',{size:13,fill:'var(--muted)'});
 b+=line('M170 70H470','var(--orange)')+dot(176,70,290,0,'var(--orange)',0,6)+t(320,60,'실행할 때만 머리글로 보냄',{size:13,fill:'var(--muted)'});
 b+=line('M170 90L250 150','var(--accent)')+dot(176,92,64,48,'var(--accent)',.6,6)+pulse(250,150,9,'var(--accent)');
 b+=line('M170 220H470','var(--blue)')+dot(176,220,290,0,'var(--blue)',1.2,6)+t(320,250,'코드만 기록에 들어감',{size:13,fill:'var(--muted)'});
 b+=t(320,290,'응답 401은 키 없음·틀림, 429는 한도 초과',{size:14,fill:'var(--muted)'});
 return {svg:svg('.env의 키는 API 서버로만 가고 .gitignore에 막혀 Git 기록에는 코드만 들어가는 그림',b),caption:'키는 실행 순간 요청 머리글로만 서버에 가고, 무시 규칙 덕분에 기록에는 코드만 남습니다. 움직이는 점은 데이터의 길을 보여 주는 시각적 비유입니다.'};
};
F.notebook=()=>{
 const r=M.kernel('twice');let b=t(30,34,'실행 순서 1 → 2 → 2 → 3',{a:'start',w:700});
 [['[1]','x = 1'],['[3]','x = x + 1'],['[4]','y = x * 10']].forEach(([n,c],i)=>{const y=56+i*70;b+=box(30,y,250,54,'var(--line)')+t(46,y+33,n,{a:'start',fill:'var(--blue)',size:15})+t(100,y+33,c,{a:'start',size:15});});
 [0,1,1,2].forEach((c,i)=>{b+=dot(284,83+c*70,96,170-83-c*70+20,'var(--orange)',i*.6,6);});
 b+=box(380,150,240,110,'var(--accent)','var(--chart)',12)+t(500,180,'커널 (Python 프로세스)',{size:14,fill:'var(--muted)'})+t(500,214,`x = ${r.now.x}, y = ${r.now.y}`,{size:20,w:700,fill:'var(--accent)'})+t(500,244,`재시작 후 위에서부터: y = ${r.fresh.y}`,{size:14,fill:'var(--orange)'});
 b+=box(380,56,240,70,'var(--orange)','var(--chart)',10)+t(500,86,'셀 2를 두 번 눌렀음',{size:14})+t(500,110,'화면의 번호만 그 흔적',{size:14,fill:'var(--muted)'})+pulse(266,153,9,'var(--orange)');
 return {svg:svg(`셀 2를 두 번 실행해 커널의 y가 ${r.now.y}이 되었지만 재시작 후 위에서부터 실행하면 ${r.fresh.y}이 되는 그림`,b),caption:`셀이 누른 순서대로 커널에 들어가 x가 ${r.now.x}이 되었습니다. 두 y 값은 세 셀을 실제로 해석해 계산한 것이고, 날아가는 점은 실행 순서를 보여 주는 비유입니다.`};
};
F.data=()=>{
 const n=20,a=M.split(n,42),bb=M.split(n,7),role=s=>i=>s.test.includes(i)?'test':s.val.includes(i)?'val':'train';
 const ra=role(a),rb=role(bb),col={train:'var(--accent)',val:'var(--blue)',test:'var(--orange)'},train=new Set(a.train);
 let b=t(30,36,'리뷰 20개를 70·10·20으로 나눔',{a:'start',w:700});
 [['시드 42',ra,70],['시드 7',rb,170]].forEach(([s,f,y])=>{b+=t(30,y+24,s,{a:'start',w:700});for(let i=0;i<n;i++){const x=110+i*25,k=f(i);b+=blink(`<rect x="${x}" y="${y}" width="21" height="36" rx="3" fill="${col[k]}" opacity="${k==='train'?.55:1}"/>`,i*.08);if(y===170&&k==='test'&&train.has(i))b+=pulse(x+10.5,y+18,13,'var(--text)');}});
 const leak=bb.test.filter(i=>train.has(i)).length;
 b+=t(110,250,`시드 7의 평가 ${bb.test.length}개 중 ${leak}개는 시드 42에서 훈련에 쓰였습니다(원 표시)`,{a:'start',size:14})+t(110,280,'초록 훈련 · 파랑 검증 · 주황 평가',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg(`리뷰 20개를 시드 42와 시드 7로 나눈 두 줄. 시드 7의 평가 ${bb.test.length}개 중 ${leak}개가 옛 훈련 리뷰`,b),caption:`두 줄은 같은 리뷰 20개를 다른 시드로 실제로 섞어 나눈 결과입니다. 원이 붙은 칸은 새 평가 세트에 섞여 든 옛 훈련 리뷰이며, 칸이 차례로 켜지는 움직임은 장식입니다.`};
};
F.debug=()=>{
 const z=M.stepTime(60,40,0),y=M.stepTime(60,40,2),sx=2.6;let b='';
 [['3 학습 동역학','손실·기울기 곡선'],['2 텐서','모양·자료형·장치·NaN'],['1 일반 Python','중단점·로그·타이머']].forEach(([a,s],i)=>{const w=150+i*40,x=145-w/2+20;b+=blink(box(x,40+i*70,w,58,C[3-i])+t(x+w/2,64+i*70,a,{w:700,size:14})+t(x+w/2,86+i*70,s,{size:13,fill:'var(--muted)'}),(2-i)*.6);});
 b+=t(150,280,'버그 대부분은 아래 두 층에',{size:14,fill:'var(--muted)'});
 [['일꾼 0명',z,80],['일꾼 2명',y,180]].forEach(([n,r,yy],i)=>{b+=t(330,yy-10,`${n} · 한 단계 ${r.step}ms`,{a:'start',w:700});
  if(r.idle>0&&r.step===r.loadEff+40)b+=grow(330,yy,r.loadEff*sx,30,'var(--blue)',i*.5)+grow(330+r.loadEff*sx,yy,40*sx,30,'var(--accent)',i*.5+.3);
  else b+=grow(330,yy,40*sx,30,'var(--accent)',i*.5)+grow(330,yy+34,r.loadEff*sx,14,'var(--blue)',i*.5+.3);});
 b+=pulse(330+60*sx,95,12,'var(--orange)')+t(330,262,'파랑 로딩 · 초록 계산(순전파+역전파)',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg(`디버깅 세 수준과, 일꾼 0명이면 ${z.step}ms, 2명이면 ${y.step}ms가 되는 한 단계 시간 막대`,b),caption:`왼쪽은 원본이 나눈 디버깅의 세 수준이고, 오른쪽은 로딩 60ms·계산 40ms를 가정해 실제로 계산한 한 단계 시간입니다. 일꾼이 생기면 로딩이 계산과 겹쳐 아래로 내려갑니다.`};
};
F.final=()=>{
 const reports=[['import torch 실패','importfail'],['CUDA 안 보임','nocuda'],['정확도 99%','acc99'],['세 배 느림','slow']];let b=t(110,30,'팀원의 보고',{w:700})+t(500,30,'증상 우선 첫 점검',{w:700});
 reports.forEach(([s,k],i)=>{const y=48+i*60,r=M.triage(k,'symptom');b+=box(20,y,180,44,'var(--orange)')+t(110,y+28,s,{size:14})+line(`M200 ${y+22}H400`,'var(--muted)')+dot(206,y+22,186,0,'var(--orange)',i*.6,5)+blink(box(400,y,220,44,'var(--accent)','var(--chart)')+t(510,y+28,`${r.cause} · ${r.minutes}분`,{size:14,w:700}),i*.6+.8);});
 b+=t(320,290,'고친 뒤 다시 재어 증상이 사라져야 원인입니다',{size:14,fill:'var(--muted)'});
 return {svg:svg('네 가지 고장 보고가 각각 가상 환경, CUDA, 분할, 구간 시간 점검으로 이어지는 그림',b),caption:'보고마다 증상이 가리키는 점검과 그 점검에 드는 시간입니다. 대응은 이 책의 시나리오이며 분 단위 시간은 교육용 가정값입니다.'};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
