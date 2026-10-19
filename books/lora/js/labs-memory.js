/* 메모리·개수·서빙·통신 실험(1·5·8·11·12장과 마지막 과제). 계산은 LRMath, 여기서는 입력을 읽고 그린다.
   모델 구조는 실제 공개 모델의 config.json 값이고, 활성값 메모리는 독자가 넣는 가정값이다. */
(()=>{
'use strict';
const M=LRMath,U=LRUI,L=LRLabs;
const COLORS={weight:'var(--blue)',grad:'var(--orange)',master:'#9b87d9',adam:'var(--accent)',base:'var(--blue)',consts:'#9b87d9',adapter:'var(--accent)',act:'var(--muted)'};
const NAMES={weight:'가중치 fp16',grad:'기울기 fp16',master:'fp32 원본',adam:'Adam 상태',base:'얼린 기본 가중치',consts:'양자화 상수',adapter:'어댑터 학습 몫',act:'활성값(가정)'};
const METHOD_NAMES={full:'전체 미세조정',lora:'LoRA(fp16 기본)',qlora:'QLoRA(4비트 기본)'};
/* memoryPlan의 부분을 쌓은 막대 한 줄로 바꾼다. Adam의 두 모멘트는 하나로 묶는다. */
function stackRow(name,plan,mark=false){
 const p={...plan.parts};if(p.adamM!=null){p.adam=p.adamM+p.adamV;delete p.adamM;delete p.adamV;}
 return {name,mark,parts:Object.entries(p).map(([k,v])=>[NAMES[k],v,COLORS[k]])};
}
const R_OPTIONS=[1,2,4,8,16,32,64].map(r=>[String(r),'r = '+r]);
L.cost=el=>{
 U.setup(el,U.modelSelect()+U.select('mode','무엇을 하려는가',[['train','전체 미세조정(혼합 정밀도 Adam)'],['infer','추론만(가중치 fp16)']],'train')+U.range('gpu','GPU 메모리(GB)',8,80,8,24)+U.range('act','활성값 메모리 가정(GB)',0,16,1,4));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#model').value],mode=el.querySelector('#mode').value,gpu=U.value(el,'gpu')*M.GB,act=U.value(el,'act')*M.GB,N=M.countParams(m).total;
  const plan=mode==='train'?M.memoryPlan({model:m,method:'full',activationGB:act/M.GB}):{parts:{weight:N*2,act:mode==='train'?act:0},total:N*2};
  const row=stackRow(mode==='train'?'전체 미세조정':'추론만',plan,true),fits=plan.total<=gpu;
  const per=mode==='train'?M.TRAIN_BYTES:2;
  U.result(el,U.stack([row],{limit:gpu,limitLabel:`GPU ${U.gb(gpu,0)}`}),`${m.name} 파라미터 <b>${U.int(N)}개</b> × ${per}바이트 = ${U.gb(N*per)}${mode==='train'?` + 활성값 가정 ${U.gb(act,0)}`:''}, 합계 <b>${U.gb(plan.total,1)}</b>. GPU ${U.gb(gpu,0)}의 ${U.fmt(plan.total/gpu,1)}배로 ${fits?'<b>들어갑니다 ✓</b>':'<b>들어가지 않습니다 ✗</b>'}.<br>${mode==='train'?`파라미터 하나에 가중치 2 + 기울기 2 + fp32 원본 4 + Adam 상태 8 = 16바이트. 가중치 자체(${U.gb(N*2)})는 이 가운데 8분의 1입니다.`:'추론만 할 때는 가중치 2바이트만 셉니다. 실제로는 KV 캐시와 활성값이 더 듭니다.'}`);
 });
};
L.params=el=>{
 U.setup(el,U.modelSelect()+U.select('r','랭크 r',R_OPTIONS,'8')+U.targetChecks('pt-'));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#model').value],r=Number(el.querySelector('#r').value),t=U.readTargets(el,'pt-'),s=M.shapes(m),N=M.countParams(m).total;
  const per=M.MODULES.map(k=>r*(s[k][0]+s[k][1])*m.layers),P=M.loraParams(m,r,t);
  if(!t.length)return U.result(el,U.bars(M.MODULES,per.map(v=>v/1e6),{unit:'M',digits:2}),'<b>층을 고르지 않음</b> LoRA를 붙일 선형층을 하나 이상 고르면 학습 파라미터 수를 셉니다.');
  U.result(el,U.bars(M.MODULES.map(k=>`${k} ${s[k][0]}→${s[k][1]}`),per.map(v=>v/1e6),{unit:'M',digits:2,mark:i=>t.includes(M.MODULES[i])}),`학습 파라미터 <b>${U.int(P)}개</b> = ${m.layers}층 × Σ r·(입력 + 출력), 전체 ${U.int(N)}개의 <b>${U.pct(P/N,3)}</b>. fp16으로 저장한 어댑터 파일은 약 ${U.mb(P*2)}입니다.<br>고른 층: ${t.join('·')} ✓. ${m.kv<m.heads?`이 모델은 키·값 머리가 ${m.kv}개뿐이라 k·v 출력이 ${s.k[1]}차원으로 작습니다.`:''}`);
 });
};
L.qlora=el=>{
 U.setup(el,U.modelSelect('model','llama13')+U.select('method','고를 방법',Object.entries(METHOD_NAMES),'qlora')+U.select('r','랭크 r',R_OPTIONS,'16')+U.targetChecks('ql-',M.MODULES)+U.check('dq','이중 양자화(상수도 8비트로)',true)+U.range('gpu','GPU 메모리(GB)',8,80,8,24)+U.range('act','활성값 메모리 가정(GB)',0,16,1,4));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#model').value],method=el.querySelector('#method').value,r=Number(el.querySelector('#r').value),t=U.readTargets(el,'ql-'),dq=el.querySelector('#dq').checked,gpu=U.value(el,'gpu')*M.GB,act=U.value(el,'act');
  const plans=Object.keys(METHOD_NAMES).map(k=>[k,M.memoryPlan({model:m,method:k,r,targets:t.length?t:['q','v'],doubleQuant:dq,activationGB:act})]);
  const chosen=plans.find(p=>p[0]===method)[1],bits=M.constBits(dq),c=M.countParams(m);
  U.result(el,U.stack(plans.map(([k,p])=>stackRow(METHOD_NAMES[k],p,k===method)),{limit:gpu,limitLabel:`GPU ${U.gb(gpu,0)}`}),`${METHOD_NAMES[method]} ✓ 합계 <b>${U.gb(chosen.total,2)}</b>, GPU ${U.gb(gpu,0)}에 ${chosen.total<=gpu?'<b>들어갑니다 ✓</b>':'<b>들어가지 않습니다 ✗</b>'}. ${t.length?'':'(층을 고르지 않아 q·v로 셌습니다.) '}<br>QLoRA의 기본 가중치: 선형층 ${U.int(c.linear)}개 × 4비트 = ${U.gb(c.linear*0.5)} + 양자화 상수 ${U.fmt(bits,3)}비트/파라미터 = ${U.gb(c.linear*bits/8,3)} + 임베딩·정규화 ${U.int(c.embed+c.norms)}개 × 2바이트 = ${U.gb((c.embed+c.norms)*2)}. 학습 파라미터 ${U.int(chosen.trainable)}개.`);
 });
};
L.serving=el=>{
 U.setup(el,U.modelSelect()+U.select('r','랭크 r',R_OPTIONS,'8')+U.targetChecks('sv-')+U.range('users','어댑터를 가진 사용자 수',10,1000,10,100)+U.range('active','GPU에 함께 올린 어댑터 수',1,64,1,8)+U.select('gbps','어댑터를 옮기는 연결',[['1','1Gbps'],['10','10Gbps'],['100','100Gbps']],'10'));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#model').value],r=Number(el.querySelector('#r').value),t=U.readTargets(el,'sv-'),users=U.value(el,'users'),active=U.value(el,'active'),gbps=Number(el.querySelector('#gbps').value);
  if(!t.length)return U.result(el,'','<b>층을 고르지 않음</b> 어댑터를 붙일 선형층을 하나 이상 고르세요.');
  const s=M.serving({model:m,r,targets:t,users,active,gbps});
  U.result(el,U.bars(['사용자마다 모델 통째로','기본 하나 + 어댑터들','GPU: 기본 + 올린 어댑터'],[s.fullCopies,s.shared,s.gpu].map(b=>b/1e9),{unit:'GB',digits:1,mark:i=>i===1}),`어댑터 하나 <b>${U.mb(s.adapterBytes)}</b>, 기본 모델 ${U.gb(s.baseBytes)}의 ${U.fmt(s.ratio,0)}분의 1입니다. 사용자 ${users}명이면 통째로 저장할 때 ${U.gb(s.fullCopies,0)}, 기본 모델 하나에 어댑터만 따로 두면 <b>${U.gb(s.shared,1)}</b> ✓.<br>GPU에 어댑터 ${active}개를 함께 올려도 어댑터 몫은 ${U.mb(active*s.adapterBytes)}이고, 어댑터 하나를 ${gbps}Gbps로 옮기는 데 ${U.fmt(s.loadSec*1000,1)}ms가 듭니다(연결 속도만 센 값).`);
 });
};
L.federated=el=>{
 U.setup(el,U.select('method','기기가 주고받는 것',[['lora','LoRA 어댑터(q·v)'],['full','모델 전체']],'lora')+U.select('r','랭크 r',R_OPTIONS.slice(0,5),'8')+U.range('clients','라운드마다 참여하는 기기 수',10,1000,10,100)+U.range('rounds','라운드 수',10,500,10,50)+U.range('spread','기기마다 어댑터가 다른 정도',0,1,0.1,0.3));
 U.bind(el,()=>{
  const m=M.MODELS.llama7,method=el.querySelector('#method').value,r=Number(el.querySelector('#r').value),clients=U.value(el,'clients'),rounds=U.value(el,'rounds'),spread=U.value(el,'spread');
  const both=['lora','full'].map(k=>M.fedComm({model:m,method:k,r,targets:['q','v'],clients,rounds})),c=both[method==='lora'?0:1],gap=M.averagingGap({clients:Math.min(clients,20),spread});
  U.result(el,U.table(['주고받는 것','한 기기 업데이트','한 라운드(내려받기+올리기)',`${rounds}라운드 합계`],both.map((x,i)=>[i?'모델 전체':`LoRA r=${r}`,U.bytes(x.perUpdate),U.bytes(x.perRound),U.bytes(x.total)]),i=>i===(method==='lora'?0:1)),`${method==='lora'?'LoRA 어댑터':'모델 전체'} ✓: 기기 하나가 한 번에 <b>${U.bytes(c.perUpdate)}</b>를 올리고 같은 크기를 내려받습니다. ${rounds}라운드 × ${clients}대 × 2방향 = <b>${U.bytes(c.total)}</b>. ${method==='lora'?`모델 전체를 주고받을 때의 ${U.fmt(both[1].total/both[0].total,0)}분의 1입니다.`:`어댑터만 주고받을 때의 ${U.fmt(both[1].total/both[0].total,0)}배입니다.`}<br>평균 내는 방법: 기기 ${Math.min(clients,20)}대의 B와 A를 따로 평균해 곱하면 B·A를 곱한 뒤 평균한 값과 <b>${U.pct(gap.gap,1)}</b> 다릅니다(어댑터가 다른 정도 ${spread}, 작은 장난감 행렬로 계산).`);
 });
};
/* 마지막 과제: 하린의 조건으로 방법·r·층을 고르고 메모리와 학습 파라미터로 근거를 낸다. 판단 규칙은 책이 정한 것이다. */
L.final=el=>{
 U.setup(el,U.modelSelect('fmodel','llama13')+U.select('fmethod','고를 방법',Object.entries(METHOD_NAMES),'full')+U.select('fr','랭크 r',R_OPTIONS,'8')+U.targetChecks('fn-')+U.range('fgpu','GPU 메모리(GB)',8,80,8,24)+U.range('fact','활성값 메모리 가정(GB)',0,16,1,4)+U.select('fgoal','목표',[['style','사내 문서 말투와 답의 형식'],['skill','코드·수학처럼 새 능력']],'style'));
 U.bind(el,()=>{
  const m=M.MODELS[el.querySelector('#fmodel').value],method=el.querySelector('#fmethod').value,r=Number(el.querySelector('#fr').value),t=U.readTargets(el,'fn-'),gpu=U.value(el,'fgpu')*M.GB,act=U.value(el,'fact'),goal=el.querySelector('#fgoal').value;
  if(method!=='full'&&!t.length)return U.result(el,'','<b>층을 고르지 않음</b> LoRA를 붙일 선형층을 하나 이상 고르세요.');
  const plan=M.memoryPlan({model:m,method,r,targets:t,activationGB:act}),fits=plan.total<=gpu,N=plan.params,head=method==='full'?'전체 미세조정':`${METHOD_NAMES[method]} r=${r}, 층 ${t.join('·')}`;
  const warn=goal==='skill'&&method!=='full'?'목표가 새 능력이면 LoRA가 전체 미세조정보다 덜 배운다는 보고(10장)가 있으니, 같은 자료로 r을 키운 비교 실험을 계획에 넣으세요.':goal==='style'&&method==='full'?'말투와 형식만 바꾸는 목표라면 전체 미세조정의 메모리를 쓸 근거가 약합니다.':'목표와 방법이 이 책의 판단 규칙과 어긋나지 않습니다.';
  U.result(el,U.stack([stackRow(head,plan,true)],{limit:gpu,limitLabel:`GPU ${U.gb(gpu,0)}`})+U.table(['항목','값'],[['모델',`${m.name} (${U.int(N)}개)`],['학습 파라미터',`${U.int(plan.trainable)}개 (${U.pct(plan.trainable/N,3)})`],['메모리 합계',U.gb(plan.total,2)],['GPU',U.gb(gpu,0)],['판정',fits?'들어감 ✓':'넘침 ✗']],i=>i===4&&fits),`<b>${head}</b>: 메모리 ${U.gb(plan.total,2)} / GPU ${U.gb(gpu,0)} → ${fits?'<b>들어갑니다 ✓</b>':'<b>넘칩니다 ✗</b>'}. 학습 파라미터 ${U.int(plan.trainable)}개${method==='full'?` (고른 r = ${r}과 층 ${t.join('·')||'없음'}은 전체 미세조정에서 쓰지 않습니다)`:`, 어댑터 파일 ${U.mb(plan.trainable*2)}`}.<br>${warn}`);
 });
};
})();
