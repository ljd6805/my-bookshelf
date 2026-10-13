/* 4·5장 실험: 세 자산의 효율적 투자선과 샤프 비율(포트폴리오 비중 실험), 월간 수익률로 베타 추정.
   계산은 AMath.portMu·portSigma·tangency·minVariance·frontier·cashMix·sharpe·beta·capm·riskSplit만 쓴다.
   무위험 금리와 누리200 기대수익 손잡이는 AUI.withAssume으로 잠시 바꿔 계산하고 되돌린다(math.js tangencyShift와 같은 방식).
   공매도 금지 손잡이를 끄면 비중이 음수인 해까지 허용한 투자선이 바깥으로 넓어진다. 결과 비중에는 “V-0 가정에서 계산한 값이며 권하는 비중이 아닙니다”를 붙인다.
   5장 CAPM의 국고채 금리 4.4%와 주식 위험 프리미엄 4.9%는 ⏱ 값(6권 확인값 · 서재 안 재인용)이라 꼬리표와 확인일을 함께 적는다. */
(()=>{
'use strict';
const U=AUI,M=AMath,A=M.ASSETS;
const p2=x=>U.pct(x,2),f4=x=>U.sfmt(x,4),W=w=>w.map(x=>U.sfmt(x*100,2)).join('·')+'%';
const CLOUD=[];for(let i=0;i<=10;i++)for(let j=0;i+j<=10;j++)CLOUD.push([0,i/10,j/10,(10-i-j)/10,0]);
function frontierModel(rf,mu1,long){
 return U.withAssume({rf,mu:[null,mu1,null,null,rf]},()=>{const tan=M.tangency(long),mv=M.minVariance(long),fr0=M.frontier(25,long),fr=long?fr0:fr0.filter(p=>p.sigma<=0.241);
  return {tan,mv,fr,cloud:CLOUD.map(w=>[M.portSigma(w)*100,M.portMu(w)*100]),assets:[1,2,3].map(i=>[A.sigma[i]*100,A.mu[i]*100]),mu:A.mu.slice()};});
}
function compare(el,rf,t){
 const v=['xa','xsa','xb','xsb'].map(k=>U.num(el,k));if(v.some(x=>x===null))return {err:U.problem('두 자산 견주기','기대수익은 −50~50%, 표준편차는 0~100% 사이로 넣어 주세요.')};
 const [ma,sa,mb,sb]=v.map(x=>x/100);if(sa<=0||sb<=0)return {err:U.problem('두 자산 견주기의 표준편차','샤프 비율을 계산하려면 표준편차가 0보다 커야 합니다.')};
 const row=(name,m,s)=>{const sh=(m-rf)/s,share=t/s;return [name,`${p2(m)} · ${p2(s)}`,`<b>${f4(sh)}</b>`,share>1+1e-12?'✗ 빌려야 만들 수 있어 계산하지 않음':`${p2(share)} + 현금 ${p2(1-share)} → μ <b>${p2(rf+share*(m-rf))}</b>`];};
 const a=row('자산 가',ma,sa),b=row('자산 나',mb,sb),sha=(ma-rf)/sa,shb=(mb-rf)/sb,hi=Math.abs(sha-shb)<1e-9?'두 자산의 샤프 비율이 같습니다':`샤프 비율은 ${sha>shb?'자산 가':'자산 나'}가 높습니다`;
 return {html:U.table(['자산','기대수익 · 표준편차','샤프 비율',`현금과 섞어 σ ${U.sfmt(t*100,2)}%`],[a,b],'두 자산 견주기 (무위험 금리는 위 손잡이)','fit'),text:`두 자산 견주기: 자산 가 ${f4(sha)}, 자산 나 ${f4(shb)}${U.josa(f4(shb),'으로','로')} ${hi}.`};
}
ALabs['efficient-frontier']=el=>{
 U.setup(el,U.banner(`결과의 비중은 ${U.WEIGHTS}.`)+U.group('비중 (%, 남는 몫은 현금)',['누리200','해외주식 묶음','채권 묶음'].map((n,k)=>U.number('fw'+k,n,0,100,1,[40,20,40][k])).join(''))
  +U.range('frf','무위험 금리 = 현금의 기대수익 (%)',0,5,0.25,M.ASSUME.rf*100,'모형의 값 2.5%')+U.number('fmu','누리200 기대수익 (%)',0,20,0.1,A.mu[1]*100,'4.5절 비교: 1%p만 바꿔 접점이 얼마나 움직이는지 봅니다')
  +U.check('flong','공매도 금지 (비중 0 이상)',true,'끄면 비중이 음수인 해까지 허용한 투자선이 그려집니다')
  +U.group('두 자산 견주기 (샤프 비율과 현금 섞기)',U.number('xa','자산 가 기대수익 (%)',-50,50,0.1,7)+U.number('xsa','자산 가 표준편차 (%)',0,100,0.1,18)+U.number('xb','자산 나 기대수익 (%)',-50,50,0.1,3.5)+U.number('xsb','자산 나 표준편차 (%)',0,100,0.1,6)+U.number('fts','현금과 섞어 맞출 표준편차 (%)',0,50,0.1,M.ASSUME.cashTarget*100,'접점 포트폴리오에도 같은 목표를 씁니다')),true);
 U.bind(el,()=>{
  const w=[0,1,2].map(k=>U.num(el,'fw'+k)),rf=Number(U.value(el,'frf'))/100,mu1=U.num(el,'fmu'),t=U.num(el,'fts'),long=U.checked(el,'flong');
  if(w.some(x=>x===null))return U.result(el,'',U.problem('비중','0%에서 100% 사이로 넣어 주세요.'));if(mu1===null)return U.result(el,'',U.problem('누리200 기대수익','0%에서 20% 사이로 넣어 주세요.'));if(t===null)return U.result(el,'',U.problem('맞출 표준편차','0%에서 50% 사이로 넣어 주세요.'));
  const tot=w[0]+w[1]+w[2];if(tot>100+1e-9)return U.result(el,'',U.problem('비중',`세 비중의 합이 ${U.sfmt(tot,0)}%로 100%를 넘습니다. 남는 몫을 현금이 받으므로 합은 100% 이하여야 합니다.`));
  const cmp=compare(el,rf,t/100);if(cmp.err)return U.result(el,'',cmp.err);
  const md=frontierModel(rf,mu1/100,long),full=[0,w[0]/100,w[1]/100,w[2]/100,1-tot/100],nowS=U.withAssume({rf,mu:[null,mu1/100,null,null,rf]},()=>({mu:M.portMu(full),s:M.portSigma(full)}));
  const tan=md.tan,cm=t/100<=tan.sigma+1e-12?U.withAssume({rf},()=>M.cashMix(tan,t/100)):null,xEnd=Math.max(20,...md.fr.map(p=>p.sigma*100))*1.02,sh=nowS.s>0?(nowS.mu-rf)/nowS.s:null;
  const chart=U.xy({dots:md.cloud,dotsName:'만들 수 있는 점 (비중 10%p 간격)',series:[{name:`효율적 투자선 (${long?'공매도 없음':'공매도 허용'})`,pts:md.fr.map(p=>[p.sigma*100,p.mu*100]),color:'var(--blue)',width:2.8},{name:'자본시장선 (현금 ↔ 접점)',pts:[[0,rf*100],[xEnd,(rf+tan.sharpe*xEnd/100)*100]],dash:'dash',color:'var(--accent)',width:1.8}],
   points:[{x:md.assets[0][0],y:md.assets[0][1],shape:'■',color:'var(--muted)',text:'누리200'},{x:md.assets[1][0],y:md.assets[1][1],shape:'■',color:'var(--muted)',text:'해외',anchor:'end',dx:-8,dy:14},{x:md.assets[2][0],y:md.assets[2][1],shape:'■',color:'var(--muted)',text:'채권',dy:16},
    {name:`접점 포트폴리오 (샤프 ${f4(tan.sharpe)})`,x:tan.sigma*100,y:tan.mu*100,shape:'●',color:'var(--accent)'},{name:'최소분산 포트폴리오',x:md.mv.sigma*100,y:md.mv.mu*100,shape:'◆',color:'var(--blue)'},{name:'지금 비중',x:nowS.s*100,y:nowS.mu*100,shape:'▲',color:'var(--orange)'}].concat(cm?[{name:`접점 + 현금 (σ ${U.sfmt(t,2)}%)`,x:t,y:cm.mu*100,shape:'○',color:'var(--accent)'}]:[]),
   xmin:0,xmax:xEnd,ymin:0,xlabel:'표준편차 σ (%)',ylabel:'기대수익 μ (%)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,0),title:'세 자산의 기대수익–표준편차 평면',h:420,label:`접점 ${W(tan.w)}, 지금 비중 μ ${p2(nowS.mu)} σ ${p2(nowS.s)}`})+cmp.html;
  const cash=tot<100?`, 현금 ${U.sfmt(100-tot,0)}%`:'',shift=Math.abs(mu1/100-A.mu[1])>1e-12?` 누리200 기대수익 ${U.sfmt(A.mu[1]*100,1)}%일 때의 접점(${W(frontierModel(rf,A.mu[1],long).tan.w)})과 견주면, 기대수익 하나를 바꿨는데 비중이 크게 움직입니다.`:'';
  U.result(el,chart,`지금 비중(누리200·해외·채권 ${w.map(x=>U.sfmt(x,0)).join('·')}%${cash}): μ <b>${p2(nowS.mu)}</b>, σ <b>${p2(nowS.s)}</b>, 샤프 비율 <b>${sh==null?'계산하지 않음(σ 0)':f4(sh)}</b>.<br>접점 포트폴리오: 누리200·해외·채권 <b>${W(tan.w)}</b>, μ ${p2(tan.mu)}, σ ${p2(tan.sigma)}, 샤프 비율 <b>${f4(tan.sharpe)}</b>.${shift} ${cm?`σ ${U.sfmt(t,2)}%에 맞추면 접점 ${p2(cm.share)} + 현금 ${p2(cm.cash)}로 μ <b>${p2(cm.mu)}</b>입니다.`:`목표 σ ${U.sfmt(t,2)}%는 접점의 σ보다 커서 돈을 빌려야 하므로 계산하지 않습니다.`} 최소분산 포트폴리오는 σ ${p2(md.mv.sigma)}, μ ${p2(md.mv.mu)}입니다.<br>${long?'공매도 금지: 모든 비중이 0 이상인 점만 남깁니다.':'공매도 허용: 비중이 음수인 해까지 계산해 투자선이 바깥으로 넓어집니다. 이 책의 다른 장은 공매도 없이 계산합니다.'}<br>${cmp.text}<br>결과의 비중은 ${U.WEIGHTS}.${U.kind(['real','assume'])}`);
 });
};
const MONTHS=M.ASSUME.months,joinList=a=>a.map(x=>U.sfmt(x,1).replace('−','-')).join(', ');
ALabs['beta-estimate']=el=>{
 const R=M.MARKET;
 U.setup(el,U.text('bm','시장(누리200) 월간 수익률 (%, 쉼표로 나눔)',joinList(MONTHS.market),'12개월 가상 자료')+U.text('bs','종목(새벽전자) 월간 수익률 (%)',joinList(MONTHS.stock),'같은 달끼리 짝을 짓습니다')
  +U.group('CAPM 입력 (⏱ 시점에 묶인 값)',U.number('brf','국고채 10년 금리 (%)',0,20,0.1,R.rf10y.value*100,`${R.rf10y.label} · ${R.rf10y.checked} 확인 기준`)+U.number('berp','주식 위험 프리미엄 (%)',0,20,0.1,R.erp.value*100,`${R.erp.label} · ${R.erp.checked} 확인 기준. 새 값이 나왔을 수 있습니다`))+`<p class="caption">${U.RECHECK}</p>`);
 U.bind(el,()=>{
  const m=U.list(el,'bm'),s=U.list(el,'bs'),rf=U.num(el,'brf'),erp=U.num(el,'berp');
  if(!m)return U.result(el,'',U.problem('시장 수익률','쉼표로 나눈 숫자를 3개 이상 넣어 주세요.'));if(!s)return U.result(el,'',U.problem('종목 수익률','쉼표로 나눈 숫자를 3개 이상 넣어 주세요.'));
  if(rf===null)return U.result(el,'',U.problem('국고채 금리','0%에서 20% 사이로 넣어 주세요.'));if(erp===null)return U.result(el,'',U.problem('위험 프리미엄','0%에서 20% 사이로 넣어 주세요.'));
  if(m.length!==s.length)return U.result(el,'',U.problem('두 목록의 개수',`시장 ${m.length}개, 종목 ${s.length}개입니다. 같은 달끼리 짝을 지으려면 개수가 같아야 합니다.`));
  let b;try{b=M.beta(m,s);}catch(e){return U.result(el,'',U.problem('수익률 목록',U.why(e)));}
  const b2=M.round(b.beta,2),req=M.capm(rf,b2,erp),loo=m.length>=4?m.map((_,i)=>{try{return M.beta(m.filter((_,j)=>j!==i),s.filter((_,j)=>j!==i)).beta;}catch(e){return null;}}).filter(x=>x!=null):[];
  const lo=Math.min(...m),hi=Math.max(...m),line=[[lo,b.alpha+b.beta*lo],[hi,b.alpha+b.beta*hi]],sp=M.riskSplit();
  const chart=U.xy({series:[{name:`회귀선 (기울기 = 베타 ${f4(b.beta)})`,pts:line,color:'var(--accent)'}],points:m.map((x,i)=>({x,y:s[i],shape:'●',color:'var(--blue)'})).concat([{name:'한 달의 (시장, 종목) 수익률',x:m[0],y:s[0],shape:'●',color:'var(--blue)'}]),
   xlabel:'시장 수익률 (%)',ylabel:'종목 수익률 (%)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,0),title:`${m.length}개월 산점도와 회귀선`,h:360,label:`베타 ${f4(b.beta)}, 상관 ${f4(b.corr)}`});
  const range=loo.length?`<br>달 하나씩 빼고 다시 추정하면 β ${f4(Math.min(...loo))} ~ ${f4(Math.max(...loo))}${U.josa(f4(Math.max(...loo)),'으로','로')}, 같은 종목의 베타도 고른 기간에 따라 흔들립니다.`:'';
  U.result(el,chart,`β = Cov ÷ Var = ${f4(b.cov)} ÷ ${f4(b.varM)} = <b>${f4(b.beta)}</b>(${m.length}개월, 표본 n − 1), 상관 ${f4(b.corr)}.${range}<br>CAPM: ${U.sfmt(rf,1)}% + ${U.sfmt(b2,2)} × ${U.sfmt(erp,1)}% = <b>${U.sfmt(req,2)}%</b>(베타를 ${U.sfmt(b2,2)}${U.josa(U.sfmt(b2,2),'으로','로')} 반올림해 계산). ${U.timed('rf10y')} ${U.timed('erp')}<br>V-0 가정의 새벽전자(상관 0.67, σ 35%, 시장 σ 18%): β ≈ ${U.sfmt(sp.beta,2)}, 체계적 몫 ${U.pct(sp.systematic,1)}(= ρ²), 개별 σ ${U.pct(sp.idio,1)}.${U.kind(['real','assume','relay'],U.RECHECK)}`);
 });
};
})();
