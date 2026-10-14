/* 3부 실험: 정보 폭포 실험(7장), 횟수별 손실 확률 실험(8장).
   계산은 PMath.cascadeRun·cascadeOdds·noCascade·thirdPerson·publicSignals·outcomeDist만 쓴다.
   7장은 S15 기본 모형(무관심하면 동전으로 고름)이며 “가정을 단순하게 둔 모형”이라는 꼬리표를 붙인다. 동전은 무작위로 던지지 않고 독자가 정한 쪽으로 둔다(같은 입력이면 같은 줄).
   기본값은 L2와 확인 문제의 입력과 다르다: 7장 p 0.6, 8장 승률 55%·20번. */
(()=>{
'use strict';
const U=PUI,M=PMath,p1=x=>U.pct(x,1);
/* ── 7장 ── 신호 줄 그림. */
function lineSvg(sig,run,pub){
 const n=sig.length,w=Math.min(56,Math.floor(440/n)),s0=20;let s=`<text x="10" y="16" class="series">위: 자기 신호 · 아래: 남이 보는 행동${pub?' (신호 공개)':''}</text>`;
 sig.forEach((g,i)=>{const x=s0+i*w,a=run.acts[i],on=pub?false:a.cascade;
  s+=`<rect x="${x}" y="28" width="${w-4}" height="26" rx="4" fill="var(--panel2)" stroke="var(--line)"/><text x="${x+(w-4)/2}" y="46" text-anchor="middle" class="axis">${g?'G':'B'}</text>`;
  s+=`<rect x="${x}" y="62" width="${w-4}" height="26" rx="4" fill="${a.buy?'var(--blue)':'var(--chart)'}" stroke="${on?'var(--orange)':'var(--line)'}" stroke-width="${on?2.5:1}"/><text x="${x+(w-4)/2}" y="80" text-anchor="middle" class="${a.buy?'on-accent':'axis'}">${a.buy?'●':'○'}</text>`;
  if(n<=12||i%5===0)s+=`<text x="${x+(w-4)/2}" y="104" text-anchor="middle" class="axis">${i+1}</text>`;});
 s+=`<text x="10" y="128" class="axis">● 삼 · ○ 안 삼 · 굵은 테두리는 폭포 안</text>`;
 return U.svg(`정보 폭포 줄: ${run.start==null?'폭포 없음':`${run.start+1}번째부터 폭포`}`,s,140,480);
}
function parseSignals(t){const v=t.toUpperCase().replace(/[\s,]/g,'');if(!v||!/^[GB]+$/.test(v))return null;return [...v].map(c=>c==='G');}
PLabs['info-cascade']=el=>{
 const C=M.ASSUME.cascade;
 U.setup(el,U.number('hp','신호 정확도 p',0.5,0.99,0.01,C.ps[0],'신호가 실제 상태와 맞을 확률')+U.text('hs','사람마다의 신호 (G 좋음, B 나쁨, 20명까지)','BGGBBGGGBG')
  +U.select('hstate','실제 상태',[['good','좋은 종목'],['bad','나쁜 종목']],'good')+U.select('hcoin','반반일 때 동전이 나오면',[['buy','산다'],['skip','사지 않는다']],'buy')+U.check('hpub','행동 대신 신호를 공개하기 (비교)',false));
 U.bind(el,()=>{
  const p=U.num(el,'hp');if(p===null)return U.result(el,'',U.problem('신호 정확도','0.5에서 0.99 사이로 넣어 주세요.'));
  const box=el.querySelector('#hs'),sig=parseSignals(box.value);
  if(!sig||sig.length>20){U.flag(box,sig?'20명까지 넣어 주세요':'G와 B만 넣어 주세요');return U.result(el,'',U.problem('신호',sig?'신호는 20명까지 넣어 주세요.':'G(좋음)와 B(나쁨)만 넣어 주세요. 예: GBBG'));}
  U.flag(box,'');
  const good=U.value(el,'hstate')==='good',coin=U.value(el,'hcoin')==='buy',pub=U.checked(el,'hpub'),odds=M.cascadeOdds(p);
  let run=M.cascadeRun(sig,()=>coin);
  if(pub){let d=0;run={start:null,acts:sig.map(g=>{d+=g?1:-1;return {buy:d>0||(d===0&&coin),cascade:false};})};}
  const tail=pub?`신호를 공개하면 사람마다 앞사람들의 신호를 모두 더해 고르므로 폭포가 생기지 않습니다. ${sig.length}명의 다수결이 맞을 확률은 <b>${p1(M.publicSignals(p,sig.length))}</b>입니다.`
   :run.start==null?'이 줄에서는 폭포가 생기지 않았습니다.':`<b>${run.start+1}번째 사람부터 폭포</b>: 자기 신호와 상관없이 모두 ${run.dir?'삽니다':'사지 않습니다'}. 실제 상태가 ${good?'좋은':'나쁜'} 종목이므로 ${run.dir===good?'<b>맞는 폭포</b>':'<b>틀린 폭포</b>'}입니다.`;
  const nc=M.noCascade(p,10),th=M.thirdPerson(p);
  U.result(el,lineSvg(sig,run,pub),`${tail}<br>모형의 확률(p ${U.sfmt(p,2)}): 맞는 폭포 ${p1(odds.right)}, 틀린 폭포 <b>${p1(odds.wrong)}</b>, 열 사람 뒤에도 폭포가 없을 확률 ${U.pct(nc,nc<0.001?3:2)}.<br>첫째·둘째가 모두 산 뒤 나쁜 신호를 받은 셋째가 좋은 종목이라고 볼 확률은 ${p1(th)}입니다.<br>${M.TEXT.cascadeNote}.${U.kind(['real','scenario'],'신호 줄과 실제 상태는 독자가 정한 예입니다.')}`);
 });
};
/* ── 8장 ── */
PLabs['loss-by-trials']=el=>{
 const O=M.ASSUME.outcome;
 U.setup(el,U.number('op','승률 (%)',1,99,0.1,O.p*100)+U.number('ow','이길 때 얻는 금액 (+)',0.01,100,0.01,1)+U.number('ol','질 때 잃는 금액 (−)',0.01,100,0.01,1)+U.number('on','횟수 n',1,2000,1,O.ns[0],'정수'));
 U.bind(el,()=>{
  const p=U.num(el,'op'),w=U.num(el,'ow'),l=U.num(el,'ol'),n=U.num(el,'on',true);
  if(p===null)return U.result(el,'',U.problem('승률','1%에서 99% 사이로 넣어 주세요.'));if(w===null||l===null)return U.result(el,'',U.problem(w===null?'이길 때 금액':'질 때 금액','0.01에서 100 사이로 넣어 주세요.'));if(n===null)return U.result(el,'',U.problem('횟수','1에서 2,000 사이의 정수로 넣어 주세요.'));
  const d=M.outcomeDist(p/100,n,w,l),pts=d.pmf.map((q,k)=>[k*w-(n-k)*l,q*100]).filter((_,k)=>n<=400||d.pmf[k]>1e-7);
  const chart=U.xy({series:[{name:`합계의 분포 (${n}번)`,pts,color:'var(--blue)',marks:n<=30?pts.map((_,i)=>i):[],shape:'●'}],refs:[{x:0,text:'합계 0',anchor:'start'}],xlabel:'합계',ylabel:'확률 (%)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,1),h:300,label:`합계가 음수일 확률 ${p1(d.neg)}`})
   +U.columns({labels:['음수','정확히 0','양수'],values:[d.neg*100,d.zero*100,d.pos*100],fmt:v=>U.sfmt(v,1)+'%',tick:v=>U.sfmt(v,0)+'%',title:'합계의 세 칸 (%)',h:220,label:`음수 ${p1(d.neg)}, 0 ${p1(d.zero)}, 양수 ${p1(d.pos)}`,colors:['var(--orange)','var(--muted)','var(--blue)']});
  U.result(el,chart,`한 번 기대값 = ${U.sfmt(p/100,2)} × ${U.sfmt(w,2)} − ${U.sfmt(1-p/100,2)} × ${U.sfmt(l,2)} = <b>${U.splus(d.each,2)}</b>. ${n}번 합계의 기대값은 ${U.splus(d.mean,2)}입니다.<br>합계가 음수일 확률 <b>${p1(d.neg)}</b>, 정확히 0일 확률 ${p1(d.zero)}, 양수일 확률 ${p1(d.pos)}(세 칸을 더하면 100%).<br>결과 하나만 보고는 이 규칙의 기대값이 양수인지 아닌지 가리기 어렵습니다.${U.kind(['real','scenario'],'승률과 손익은 가정한 규칙이며 이항분포로 계산합니다.')}`);
 });
};
})();
