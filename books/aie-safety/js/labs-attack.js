/* 6~8장 실험: 질의 예산 비교, 다회 예시 탈옥, 간접 주입 상태 기계, 조정 층. 계산은 A19Math에서 한다. */
(()=>{
'use strict';
const U=A19UI,M=A19Math,R=U.range,S=U.select,F=U.fmt;
const PA=M.perQuery(0.9,200),PB=M.perQuery(0.85,20);
A19Labs.budget=el=>{
 U.setup(el,R('bg-k','질의 예산 K',1,400,1,20));
 U.bind(el,()=>{const K=U.value(el,'bg-k'),a=M.budgetASR(PA,K),b=M.budgetASR(PB,K);
  const xs=Array.from({length:81},(_,i)=>Math.max(1,i*5));
  U.result(el,U.plot({lines:[{data:xs.map(k=>[k,M.budgetASR(PA,k)])},{data:xs.map(k=>[k,M.budgetASR(PB,k)]),color:'var(--orange)',dashed:true}],points:[[K,a,'var(--accent)'],[K,b,'var(--orange)']],xmin:0,xmax:400,ymin:0,ymax:1,xlabel:'질의 예산 K',ylabel:'공격 성공률 (실선 A · 점선 B)',label:`질의 ${K}번에서 공격 A ${F(a*100,1)}%, 공격 B ${F(b*100,1)}%`}),
  `질의 예산 K = <b>${K}</b><br>공격 A(보고: 200번에 90%) 질의당 성공 확률 ${F(PA,4)} → <strong>${F(a*100,1)}%</strong><br>공격 B(보고: 20번에 85%) 질의당 성공 확률 ${F(PB,4)} → <strong>${F(b*100,1)}%</strong><br>같은 예산에서 ${a>b+1e-9?'A가':b>a+1e-9?'B가':'두 공격이'} ${Math.abs(a-b)<1e-9?'같습니다':'더 강합니다'}. 보고된 숫자만 나란히 놓으면 A가 강해 보이지만 질의당 효율은 B가 약 ${F(PB/PA,1)}배입니다. 질의마다 독립이라는 단순화 아래 1 − (1 − p)^K를 실제로 계산했습니다.`);});
};
const SHOTS=[1,2,4,8,16,32,64,128,256,512];
A19Labs.manyshot=el=>{
 U.setup(el,S('ms-n','맥락에 넣은 가짜 대화 예시 수',SHOTS.map(n=>[n,`${n}개`]),32)+S('ms-def','맥락 분류기 방어',[['off','끔'],['on','켬']],'off'));
 U.bind(el,()=>{const n=U.value(el,'ms-n'),on=U.text(el,'ms-def')==='on',r=M.msj(n,on),raw=M.msj(n,false);
  const curve=SHOTS.map(k=>[Math.log2(k),M.msj(k,false)]),dc=SHOTS.map(k=>[Math.log2(k),M.msj(k,true)]);
  U.result(el,U.plot({lines:[{data:curve,color:'var(--orange)'},{data:dc,dashed:true}],points:[[Math.log2(n),r,on?'var(--accent)':'var(--orange)']],xmin:0,xmax:9,ymin:0,ymax:1,xlabel:'log₂(예시 수)  0 = 1개, 5 = 32개, 8 = 256개',ylabel:'공격 성공률 (실선 방어 없음 · 점선 방어)',label:`예시 ${n}개, 방어 ${on?'켬':'끔'}에서 성공률 ${F(r*100,1)}%`}),
  `예시 <b>${n}개</b> · 방어 <b>${on?'켬':'끔'}</b><br>공격 성공률 <strong>${F(r*100,1)}%</strong>${on?` (방어가 없으면 ${F(raw*100,1)}%)`:''}<br>예시 수가 두 배가 될 때마다 성공률은 2^0.8 ≈ 1.74배가 됩니다(100%에 닿기 전까지). 32개에서 256개로 늘리면 약 ${F(M.msj(256)/M.msj(32),1)}배입니다.<br>ASR = min(1, c·n^0.8)에서 지수 0.8과 c는 원본의 정성적 설명에 맞춘 가정값이고, 방어 효과는 원본이 보고한 61% → 2%의 비율을 그대로 곱했습니다.`);});
};
const ST={pass:'통과',blocked:'차단',skipped:'도달하지 않음'};
A19Labs.inject=el=>{
 U.setup(el,S('ij-payload','숨은 지시의 모습',[['plain','노골적인 명령문'],['benign','무해해 보이는 안내문']],'benign')+S('ij-user','사용자 입력 필터',[['off','끔'],['on','켬']],'off')+S('ij-ret','검색 내용 필터',[['off','끔'],['keyword','키워드 필터']],'off')+S('ij-ifc','정보 흐름 통제(IFC)',[['off','끔'],['on','켬']],'off')+S('ij-render','외부 이미지 렌더링',[['allow','모두 허용'],['approved','승인된 도메인만'],['off','끔']],'allow'));
 U.bind(el,()=>{const o={payload:U.text(el,'ij-payload'),userFilter:U.text(el,'ij-user'),retrievalFilter:U.text(el,'ij-ret'),ifc:U.text(el,'ij-ifc'),render:U.text(el,'ij-render')},r=M.injectionTrace(o);
  const list=`<ol class="a19-steps">${r.steps.map((s,i)=>`<li class="${s.status}"><span>${String(i+1).padStart(2,'0')} · ${ST[s.status]}</span><b>${s.name}</b><p>${s.note}</p></li>`).join('')}</ol>`;
  U.result(el,list,`${r.leaked?'<strong>유출됨</strong> · 공격 사슬이 끝까지 이어져 계좌 정보가 공격자 서버에 기록됩니다.':`<strong>차단됨</strong> · ${r.blockedAt+1}단계 “${r.steps[r.blockedAt].name}”에서 사슬이 끊겼습니다.`}<br>켠 방어: ${[o.userFilter==='on'&&'사용자 입력 필터',o.retrievalFilter==='keyword'&&'검색 내용 키워드 필터',o.ifc==='on'&&'IFC',o.render!=='allow'&&('이미지 '+(o.render==='off'?'끔':'승인 도메인만'))].filter(Boolean).join(', ')||'없음'}<br>미리 정한 여섯 단계 시나리오를 규칙으로 판정한 결과이며 실제 모델이나 메일 서버를 쓰지 않습니다. 실제 공격 문구는 싣지 않았습니다.`);});
};
A19Labs.layers=el=>{
 U.setup(el,R('ly-tau','차단 문턱 τ',0,3,0.1,2)+S('ly-layers','분류기 층',[['in','입력 층만'],['out','출력 층만'],['both','입력 + 출력']],'both')+S('ly-attack','공격 종류',Object.entries(M.ATTACKS).map(([k,a])=>[k,a.name]),'plain')+S('ly-base','유해 요청 비율',[[0.001,'0.1%'],[0.01,'1%'],[0.1,'10%']],0.01));
 U.bind(el,()=>{const tau=U.value(el,'ly-tau'),L=U.text(el,'ly-layers'),at=U.text(el,'ly-attack'),base=U.value(el,'ly-base'),r=M.moderation(tau,L,at,base);el.querySelector('#ly-tau-value').textContent=F(tau,1);
  U.result(el,U.bars(['유해 요청을 놓친 비율','정상 요청을 잘못 막은 비율','차단 중 정말 유해한 비율'],[r.miss,r.fpr,r.precision],'비율',null,3),
  `τ = <b>${F(tau,1)}</b> · ${L==='in'?'입력 층만':L==='out'?'출력 층만':'입력 + 출력'} · ${M.ATTACKS[at].name} · 유해 요청 ${F(base*100,1)}%<br>놓친 비율 <strong>${F(r.miss*100,1)}%</strong> · 잘못 막은 비율 <b>${F(r.fpr*100,2)}%</b> · 정밀도 <b>${F(r.precision*100,1)}%</b><br>요청 100만 건이면 유해 요청 ${F(r.perMillion.caught,0)}건을 잡고 ${F(r.perMillion.missed,0)}건을 놓치며, 정상 요청 ${F(r.perMillion.falseBlocks,0)}건을 잘못 막습니다.<br>${at==='encoded'&&L==='in'?'가린 요청은 입력 분류기가 알아보지 못해 대부분 통과합니다. 출력 층이 답에서 유해성을 다시 봐야 합니다.':r.precision<0.5?'유해 요청이 드물어 차단된 것 대부분이 정상 요청입니다. 기저율이 정밀도를 좌우합니다.':'차단의 대부분이 실제 유해 요청입니다.'} 점수 분포 N(d,1)·N(0,1)과 두 층의 독립을 가정해 실제로 계산했습니다.`);});
};
})();
