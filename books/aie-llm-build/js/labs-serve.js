/* 10~12장 실험: 양자화, 추측 디코딩, 모델 설정 읽기, 되돌리기 범위.
   계산은 모두 A11Math가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=A11UI,M=A11Math,F=U.fmt,R=U.range,S=U.select;
let W=null;

function rowChart(err){
 const max=Math.max(1,...err),H=200,bw=440/err.length;let b=`<path d="M30 ${30+H}H470" stroke="var(--line)"/>`;
 [0,0.5,1].forEach(v=>{if(v<=max){const y=30+H-v/max*H;b+=`<text x="26" y="${y+4}" text-anchor="end">${F(v,1)}</text><path d="M30 ${y}H470" stroke="var(--line)" stroke-width=".5"/>`;}});
 err.forEach((e,i)=>{const h=Math.max(1,e/max*H),x=30+i*bw;b+=`<rect x="${x+2}" y="${30+H-h}" width="${bw-4}" height="${h}" rx="2" fill="${i===3?'var(--orange)':'var(--accent)'}"/>`;if(i%3===0||i===3)b+=`<text x="${x+bw/2}" y="${H+48}" text-anchor="middle">${i}</text>`;});
 b+=`<text x="30" y="22">행마다 상대 오차 ‖W − Ŵ‖ ÷ ‖W‖ (주황 = 3번 이상치 행)</text><text x="470" y="274" text-anchor="end">행 번호</text>`;
 return U.svg(b,`행 16개의 양자화 상대 오차. 이상치 행 ${F(err[3],3)}, 가장 큰 오차 ${F(Math.max(...err),3)}`);
}
A11Labs.quant=el=>{
 U.setup(el,S('q-bits','비트 수',[[2,'2비트'],[3,'3비트'],[4,'4비트'],[8,'8비트']],4)+S('q-gran','배율 단위',[['tensor','텐서 전체에 하나'],['channel','출력 채널(행)마다 하나']],'tensor'));
 U.bind(el,()=>{
  const bits=U.value(el,'q-bits'),ch=U.text(el,'q-gran')==='channel',w=W||(W=M.demoWeights()),q=M.quantize(w,bits,ch);
  const normal=q.rowErr.filter((_,i)=>i!==3),avg=normal.reduce((a,b)=>a+b,0)/normal.length,sc=q.scales.slice().sort((a,b)=>a-b);
  U.result(el,rowChart(q.rowErr),`${bits}비트 대칭 양자화: 정수 ${q.levels}단계, 배율 = 최댓값 ÷ ${Math.pow(2,bits-1)-1}<br>`+
   (ch?`배율 16개 (${F(sc[0],5)} ~ ${F(sc[15],5)})`:`배율 1개 = ${F(q.scales[0],5)} (이상치 행이 정함)`)+
   `<br>신호 대 잡음비 <b>${F(q.snr,1)}dB</b>, 코사인 유사도 ${F(q.cos,4)}<br>보통 행 평균 상대 오차 <b>${F(avg*100,1)}%</b>, 이상치 행 ${F(q.rowErr[3]*100,1)}%<br>같은 비트로 70B 모델의 가중치만 담으면 ${F(M.weightGB(70,bits),1)}GB입니다. 16×64 교육용 가중치를 실제로 양자화한 결과입니다.`);
 });
};

A11Labs.specdec=el=>{
 U.setup(el,R('sd-alpha','초안 토큰 수락률 α',0.3,0.95,0.05,0.6)+R('sd-n','초안 길이 N (토큰)',1,10,1,5)+S('sd-c','초안 한 번의 비용 c (검증 = 1)',[[0.02,'0.02'],[0.05,'0.05'],[0.1,'0.1']],0.05));
 U.bind(el,()=>{
  const a=U.value(el,'sd-alpha'),N=U.value(el,'sd-n'),c=U.value(el,'sd-c'),s=M.specDecode(a,N,c),best=M.specBestN(a,c,10);
  const xs=Array.from({length:10},(_,i)=>i+1),E=xs.map(n=>[n,M.specDecode(a,n,c).E]),sp=xs.map(n=>[n,M.specDecode(a,n,c).speedup]);
  const ymax=Math.ceil(Math.max(...E.map(x=>x[1]),...sp.map(x=>x[1]))+0.5);
  const chart=U.plot({lines:[{data:E,color:'var(--blue)',dashed:true},{data:sp}],points:[[N,s.speedup,'var(--orange)',7],[best.N,best.speedup,'var(--accent)',4]],xmin:1,xmax:10,ymin:0,ymax,xlabel:'초안 길이 N',ylabel:'검증당 토큰(점선)·속도 향상(실선)',label:`α = ${F(a,2)}, c = ${c}에서 초안 길이에 따른 기대 토큰 수와 속도 향상. N = ${N}일 때 ${F(s.speedup,2)}배`});
  U.result(el,chart,`검증 한 번의 기대 토큰 (1 − α<sup>N+1</sup>) ÷ (1 − α) = <b>${F(s.E,2)}개</b> (최대 ${N + 1}개)<br>비용 N·c + 1 = ${F(s.cost,2)} → 속도 향상 <b>${F(s.speedup,2)}배</b><br>이 α와 c에서 가장 좋은 초안 길이는 N = ${best.N} (${F(best.speedup,2)}배)입니다.<br>받아들일 확률 min(1, q/p)와 잔차 분포 덕분에 결과 분포는 큰 모델만 쓴 것과 같습니다. 위치마다 독립인 α를 가정한 식의 계산입니다.`);
 });
};

const CFG=[['gpt2','GPT-2 Small'],['llama3','Llama 3 8B'],['mixtral','Mixtral 8x7B'],['deepseek','DeepSeek-V3'],['jamba','Jamba (하이브리드)']];
const CTX=[[1024,'1,024'],[4096,'4,096'],[32768,'32,768'],[131072,'131,072 (128K)'],[262144,'262,144 (256K)']];
const bn=n=>n>=1e9?F(n/1e9,2)+'B':F(n/1e6,1)+'M';
A11Labs.config=el=>{
 U.setup(el,S('cf-model','모델',CFG,'llama3')+S('cf-ctx','문맥 길이 (토큰)',CTX,131072));
 U.bind(el,()=>{
  const key=U.text(el,'cf-model'),ctx=U.value(el,'cf-ctx'),m=M.MODELS[key],p=M.modelParams(m),kvTok=M.kvPerToken(m),kv=kvTok*ctx/1e9,wgt=p.total*2/1e9;
  const chart=U.bars(['BF16 가중치','KV 캐시 (시퀀스 하나)'],[wgt,kv],'GB (점선 = 80GB)',80,2);
  const attn=m.mla?`MLA: 층 ${m.L} × (잠재 ${m.mla.kv} + RoPE 키 ${m.mla.rope}) × 2바이트`:m.attn?`어텐션 ${m.attn}층만: 2 × ${m.attn} × KV헤드 ${m.kv} × ${m.hd} × 2바이트`:`2 × 층 ${m.L} × KV헤드 ${m.kv} × 헤드차원 ${m.hd} × 2바이트`;
  U.result(el,chart,`${m.name}: 전체 <b>${bn(p.total)}</b>, 토큰마다 쓰는 파라미터 <b>${bn(p.active)}</b>${p.computed?' (config로 계산)':' (공개값, 원본 커리큘럼 기준)'}<br>KV 캐시 토큰당 ${attn} = ${kvTok.toLocaleString('en-US')}바이트<br>${ctx.toLocaleString('en-US')}토큰이면 <b>${F(kv,2)}GB</b>, 가중치 ${F(wgt,1)}GB`+
   (ctx>m.ctx?`<br>이 길이는 모델의 학습 문맥 ${m.ctx.toLocaleString('en-US')}보다 깁니다. 계산만 해 본 값입니다.`:'')+
   (p.total!==p.active?`<br>토큰마다 ${F(p.active/p.total*100,1)}%만 계산하지만 전문가 전체를 메모리에 올려야 합니다.`:'')+'<br>공개 config의 숫자로 식을 계산한 값이며, 작은 항목은 생략해 공개 숫자와 조금 다를 수 있습니다.');
 });
};

const COST={tok:'시간',eval:'시간',quant:'시간',serve:'시간',sft:'일',rm:'—',dpo:'일',cai:'일',pre:'주',scale:'주',data:'—'};
A11Labs.rollback=el=>{
 U.setup(el,S('rb-stage','실패한(바꿀) 단계',M.STAGES.map(s=>[s[0],s[1]]),'sft'));
 U.bind(el,()=>{
  const id=U.text(el,'rb-stage'),r=M.rollback(id),on=new Set(r.stages.map(s=>s[0]));
  const grid=`<div class="stage-grid">${M.STAGES.map((s,i)=>`<div class="stage ${on.has(s[0])?'current':''}"><span>${String(i+1).padStart(2,'0')} · ${on.has(s[0])?'다시 실행':'재사용'}</span><b>${s[1]}</b><p>가정 ${s[2].toLocaleString('en-US')}시간</p></div>`).join('')}</div>`;
  const chart=U.bars(['다시 실행','파이프라인 전체'],[r.hours,r.total],'시간 (이 책의 가정값)',null,0)+grid;
  const heavy=id==='pre'||id==='scale';
  U.result(el,chart,`${M.STAGES.find(s=>s[0]===id)[1]} 단계와 그 아래 <b>${r.stages.length}개</b> 단계가 무효: ${r.stages.map(s=>s[1]).join(', ')}<br>다시 할 시간 <b>${r.hours.toLocaleString('en-US')}시간</b> / 전체 ${r.total.toLocaleString('en-US')}시간 (${F(r.hours/r.total*100,1)}%)<br>원본의 비용 분류로 이 단계는 ${COST[id]==='—'?'따로 분류되지 않았습니다':`${COST[id]} 단위입니다`}.`+
   (heavy?'<br>원본은 이런 비싼 단계가 무효가 되면 다시 돌리기보다 마지막 좋은 체크포인트에서 아래 단계를 고치라고 권합니다.':'')+'<br>의존 관계는 원본 13강의 그래프, 시간은 비교를 위한 가정값입니다.');
 });
};
})();
