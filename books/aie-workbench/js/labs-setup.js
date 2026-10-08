/* 1~3장 실험: 사전 점검, 가상 환경, CUDA 맞추기, 브랜치 병합, .gitignore. 계산은 A01Math에서 한다. */
(()=>{
'use strict';
const U=A01UI,M=A01Math,S=U.select,R=U.range;
const NAMES={python:'Python 3.11 이상',git:'Git',numpy:'numpy',node:'Node.js',npx:'npx'};
A01Labs.preflight=el=>{
 U.setup(el,S('route','학습 경로 (--route)',[['beginner','입문 beginner'],['ml-foundations','수학·ML 기초'],['agents','에이전트 agents'],['agent-skills','에이전트 스킬']],'beginner')+S('missing','이 컴퓨터에 없는 도구',[['none','없음 (모두 설치됨)'],['python','Python'],['git','Git'],['numpy','numpy'],['node','Node.js와 npx'],['gpu','GPU']],'none'));
 U.bind(el,()=>{const r=M.preflight(U.text(el,'route'),U.text(el,'missing'));
  const items=r.required.map(x=>[NAMES[x.key],x.ok?'통과':'실패','필수',x.ok]);
  items.push([`선택 도구 ${r.optionalCount}개`,r.optionalMissing?`${r.optionalMissing}개 없음`:'건너뜀','선택',true]);
  items.push(['종료 코드',String(r.exit),r.exit?'멈춤':'시작 가능',!r.exit]);
  U.result(el,U.rows(items,`${r.label} 경로의 사전 점검 결과`,`${r.label} 경로 점검`),
  `필수 검사 <strong>${r.passed}/${r.total}</strong> 통과 · 종료 코드 <b>${r.exit}</b><br>${r.exit?'필수 검사가 실패했으므로 고치는 명령을 따른 뒤 다시 점검합니다.':'필수 검사가 모두 통과했으므로 첫 레슨 명령(Next:)으로 넘어갑니다.'}${r.optionalMissing?` 없는 선택 도구 ${r.optionalMissing}개는 종료 코드에 영향을 주지 않습니다.`:''}<br>원본 verify.py의 경로 표를 그대로 판정한 실제 계산이며, 실제 도구를 검사하지는 않습니다.`);});
};
function versionLine(r){
 const x=v=>60+v*60;let b='';
 for(let v=0;v<=6;v++)b+=`<path d="M${x(v)} 150v10" stroke="var(--muted)"/><text x="${x(v)}" y="186" text-anchor="middle">2.${v}</text>`;
 b+=`<path d="M40 155H440" stroke="var(--line)" stroke-width="2"/><rect x="${x(3)-14}" y="62" width="${x(6)-x(3)+28}" height="30" rx="6" fill="color-mix(in srgb,var(--accent) 25%,transparent)" stroke="var(--accent)" stroke-width="2"/><text x="${x(3)-14}" y="50">review-lab 허용 범위</text>`;
 b+=`<path d="M${x(r.installedB)} 100V150" stroke="var(--orange)" stroke-width="3"/><circle cx="${x(r.installedB)}" cy="155" r="9" fill="var(--orange)"/><text x="${Math.max(110,Math.min(x(r.installedB),370))}" y="222" text-anchor="middle" fill="var(--orange)">예전 프로젝트 고정</text>`;
 b+=`<text x="20" y="262">review-lab ${r.okA?'정상':'깨짐'} · 예전 프로젝트 정상</text>`;
 return U.svg(b,`review-lab은 2.3~2.6을 허용하고 예전 프로젝트는 2.${r.installedB}을 고정했습니다. review-lab은 ${r.okA?'정상':'깨짐'}입니다.`);
}
A01Labs.resolver=el=>{
 U.setup(el,R('bpin','예전 프로젝트가 고정한 PyTorch 2.x',0,6,1,1)+S('mode','설치 방식',[['global','전역 설치 (한 Python)'],['separate','프로젝트마다 가상 환경']],'global'));
 U.bind(el,()=>{const b=U.value(el,'bpin'),r=M.resolveEnv({aMin:3,aMax:6,bPin:b,mode:U.text(el,'mode')});
  el.querySelector('#bpin-value').textContent='2.'+b;
  const how=r.mode==='global'?`전역 설치에서는 review-lab을 먼저 깔고 예전 프로젝트를 나중에 깔아 PyTorch가 <b>2.${b}</b>로 덮어써집니다.`:`가상 환경에서는 review-lab에 <b>2.${r.installedA}</b>, 예전 프로젝트에 <b>2.${b}</b>가 따로 설치됩니다.`;
  U.result(el,versionLine(r),`${how}<br>review-lab(허용 2.3~2.6): <strong>${r.okA?'정상':'깨짐'}</strong> · 예전 프로젝트: <strong>정상</strong><br>두 요구를 함께 만족하는 버전: ${r.common.length?'2.'+r.common.join(', 2.'):'없음'}. 버전 범위를 비교하는 실제 계산이며, 간접 의존성은 생략했습니다.`);});
};
const CU=[['none','드라이버 없음 (Mac·GPU 없음)'],['11.8','드라이버 CUDA 11.8'],['12.1','드라이버 CUDA 12.1'],['12.4','드라이버 CUDA 12.4']];
A01Labs.cuda=el=>{
 U.setup(el,S('driver','nvidia-smi가 보여 주는 드라이버 CUDA',CU,'12.1')+S('wheel','설치한 PyTorch 빌드',[['cpu','CPU 빌드'],['11.8','cu118 빌드'],['12.1','cu121 빌드'],['12.4','cu124 빌드']],'12.4'));
 U.bind(el,()=>{const d=U.text(el,'driver'),w=U.text(el,'wheel'),r=M.cudaCheck(d,w);
  const items=[['드라이버 지원 CUDA',d==='none'?'없음':d,'nvidia-smi',d!=='none'],['PyTorch 빌드 CUDA',w==='cpu'?'CPU':w,'torch.version.cuda',w!=='cpu'],['import torch',r.runs?'성공':'실패','실행',r.runs],['cuda.is_available()',r.gpu?'True':'False','GPU 사용',r.gpu]];
  U.result(el,U.rows(items,'드라이버와 빌드 비교 결과','드라이버와 빌드 비교'),`판정: <strong>${r.gpu?'GPU 사용 가능':'GPU 사용 불가'}</strong><br>${r.reason}<br>원본 레슨의 어림 규칙(빌드 CUDA ≤ 드라이버 CUDA)을 그대로 적용한 실제 비교입니다. 세부 호환 범위는 PyTorch 설치 안내에서 확인합니다.`);});
};
function dag(base,m,e,r){
 const X=i=>40+i*62,yM=90,yE=190;let b='',prev=null;
 const node=(x,y,label,c)=>`<circle cx="${x}" cy="${y}" r="16" fill="var(--panel2)" stroke="${c}" stroke-width="3"/><text x="${x}" y="${y+6}" text-anchor="middle" fill="var(--text)">${label}</text>`;
 for(let i=0;i<base;i++){if(prev)b+=`<path d="M${prev[0]+16} ${yM}H${X(i)-16}" stroke="var(--muted)" stroke-width="2"/>`;b+=node(X(i),yM,i+1,'var(--muted)');prev=[X(i),yM];}
 const fork=X(base-1);let mx=fork,ex=fork;
 for(let i=0;i<m;i++){const x=X(base+i);b+=`<path d="M${mx+16} ${yM}H${x-16}" stroke="var(--accent)" stroke-width="2"/>`+node(x,yM,'m'+(i+1),'var(--accent)');mx=x;}
 for(let i=0;i<e;i++){const x=X(base+i);b+=`<path d="M${ex+(i?16:0)} ${i?yE:yM+16}${i?'H':'L'}${x-16} ${yE}" stroke="var(--blue)" stroke-width="2" fill="none"/>`+node(x,yE,'e'+(i+1),'var(--blue)');ex=x;}
 if(r.type==='merge'){const x=Math.max(mx,ex)+70;b+=`<path d="M${mx+16} ${yM}H${x-16}M${ex+14} ${yE-8}L${x-14} ${yM+8}" stroke="var(--orange)" stroke-width="2" fill="none"/>`+node(x,yM,'M','var(--orange)')+`<text x="${x}" y="${yM-28}" text-anchor="middle" fill="var(--orange)">병합</text>`;}
 else b+=`<path d="M${fork} ${yM-22}C${fork+60} 30 ${ex} 120 ${ex} ${yE-22}" stroke="var(--orange)" stroke-width="2" fill="none" stroke-dasharray="6 5"/><text x="${ex}" y="${yE+46}" text-anchor="middle" fill="var(--orange)">main이 여기로</text>`;
 b+=`<text x="10" y="40" fill="var(--accent)">main</text><text x="10" y="262" fill="var(--blue)">experiment</text>`;
 return U.svg(b,`main ${base+m}개, experiment ${base+e}개 커밋. 병합 방식은 ${r.type==='merge'?'병합 커밋':'빨리 감기'}입니다.`);
}
A01Labs.branch=el=>{
 U.setup(el,R('mainc','갈라진 뒤 main의 새 커밋 (개)',0,3,1,0)+R('expc','experiment의 커밋 (개)',1,4,1,3));
 U.bind(el,()=>{const m=U.value(el,'mainc'),e=U.value(el,'expc'),r=M.gitMerge(2,m,e);
  U.result(el,dag(2,m,e,r),`병합 방식: <strong>${r.type==='merge'?'병합 커밋 1개 추가':'빨리 감기 (fast-forward)'}</strong><br>갈라지기 전 2 + main ${m} + experiment ${e}${r.mergeCommit?' + 병합 1':''} = git log --oneline <b>${r.logCount}줄</b><br>${m?'main도 움직였으므로 두 줄기를 잇는 커밋이 필요합니다. 같은 줄을 고쳤다면 충돌도 해결해야 합니다.':'main이 그대로라 이름표만 앞으로 옮깁니다.'} 커밋 그래프를 세는 실제 계산입니다.`);});
};
A01Labs.ignore=el=>{
 U.setup(el,R('rules','적용한 무시 규칙 (개)',0,4,1,0));
 U.bind(el,()=>{const l=U.value(el,'rules'),r=M.ignoreRules(l);
  const items=M.FILES.map(f=>[f.name,f.rule>l?'커밋됨':'무시됨',f.mb>=1?U.fmt(f.mb,0)+' MB':'작음',f.rule>l?f.rule>4:true]);
  U.result(el,U.rows(items,`규칙 ${l}개 적용 결과`,`.gitignore: ${r.rules.length?r.rules.join(' · '):'비어 있음'}`),`커밋되는 크기 약 <strong>${U.fmt(r.mb,r.mb<10?2:0)} MB</strong> · API 키 ${r.secret?'<strong>기록에 들어감</strong>':'기록에 없음'}<br>${r.secret?'.env가 아직 추적되므로 푸시하는 순간 키가 기록에 남습니다.':'코드·설정·잠금 파일만 남고 다시 만들 수 있는 큰 파일과 비밀은 빠졌습니다.'}<br>규칙을 차례로 적용하는 실제 판정이며, 파일 크기는 교육용 가정값입니다.`);});
};
})();
