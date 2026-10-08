(()=>{
const U=AIUI,M=AIMath,L=AILabs;
L.bpe=el=>{
 const words=['low','lower','lowest','low','new','newer','newest'];
 U.setup(el,U.range('merges','병합 횟수',0,12,1,0)+'<p class="caption">학습 말뭉치: low lower lowest low new newer newest. 동일 빈도는 고정된 문자 정렬 순서로 결정합니다.</p>',false);
 U.bind(el,()=>{const r=M.bpe(words,U.value(el,'merges'));el.querySelector('.viz').innerHTML=r.pieces.map((w,i)=>`<div><small>${words[i]}</small><div class="tokens">${w.map(t=>`<span class="token">${U.esc(t)}</span>`).join('')}</div></div>`).join('');const last=r.history.at(-1);el.querySelector('.readout').innerHTML=`전체 조각 수 <b>${M.sum(r.pieces.map(w=>w.length))}</b><br>${last?`마지막 병합: ${U.esc(last.a)} + ${U.esc(last.b)} → ${U.esc(last.a+last.b)} (인접 쌍 ${last.count}회)`:'아직 병합하지 않았습니다. 문자 하나가 조각 하나입니다.'}`;});
};
L.embedding=el=>{
 U.setup(el,U.range('angle','벡터 B의 방향 (°)',-180,180,1,45)+U.range('length','벡터 B의 길이',.2,2,.1,1));
 U.bind(el,()=>{const a=U.value(el,'angle')*Math.PI/180,len=U.value(el,'length'),b=[Math.cos(a)*len,Math.sin(a)*len];el.querySelector('.chart').innerHTML=U.plot({lines:[{data:[[0,0],[1,0]],color:'var(--orange)'},{data:[[0,0],b]}],points:[[1,0,'var(--orange)'],[...b,'var(--accent)']],xmin:-2.2,xmax:2.2,ymin:-2.2,ymax:2.2,xlabel:'벡터의 첫 성분',ylabel:'둘째 성분',equal:true});el.querySelector('.readout').innerHTML=`A = [1, 0], B = [${b.map(x=>U.fmt(x)).join(', ')}]<br>코사인 유사도 = <b>${U.fmt(M.cosine([1,0],b),3)}</b> · 내적 = <b>${U.fmt(b[0],3)}</b>`;});
};
L.attention=el=>{
 const keys=[[1,0],[0,1],[1,1],[-1,0]],labels=['K₁','K₂','K₃','K₄'],values=[2,5,8,-1];
 U.setup(el,U.range('q1','Query 첫 성분',-3,3,.1,1)+U.range('q2','Query 둘째 성분',-3,3,.1,0)+'<p class="caption">K₁=[1,0], K₂=[0,1], K₃=[1,1], K₄=[−1,0]<br>Value = [2, 5, 8, −1]</p>',false);
 U.bind(el,()=>{const q=[U.value(el,'q1'),U.value(el,'q2')],scores=keys.map(k=>M.dot(q,k)/Math.sqrt(2)),weights=M.softmax(scores);el.querySelector('.viz').innerHTML='<p>어텐션 가중치</p>'+U.bars(labels,weights)+'<div class=table-wrap><table><tr><th>Key</th><th>가중치 × Value</th><th>출력 기여</th></tr>'+labels.map((l,i)=>`<tr><td>${l}</td><td>${U.fmt(weights[i],3)} × ${values[i]}</td><td>${U.fmt(weights[i]*values[i],3)}</td></tr>`).join('')+'</table></div>';el.querySelector('.readout').innerHTML=`스케일 점수 = [${scores.map(x=>U.fmt(x)).join(', ')}]<br>가중합 출력 = <b>${U.fmt(M.dot(weights,values),3)}</b> · 가중치의 합 = <b>${U.fmt(M.sum(weights),2)}</b>`;});
};
L.mask=el=>{
 U.setup(el,'<label class="control" for="causal">접근 방식<select id="causal"><option value="yes">인과 마스크 켜기</option><option value="no">모든 위치 참고</option></select></label>'+U.range('position','확인할 Query 위치',1,5,1,3),false);
 U.bind(el,()=>{const causal=el.querySelector('#causal').value==='yes',row=U.value(el,'position')-1,all=[];for(let i=0;i<5;i++){const weights=M.softmax(Array.from({length:5},(_,j)=>causal&&j>i?-1e9:-Math.abs(i-j)*.6));all.push(...weights.map((w,j)=>causal&&j>i?null:w));}el.querySelector('.viz').innerHTML='<p class="caption">행: Query 1~5 · 열: Key 1~5 · ×: 차단 · 테두리: 선택한 행</p>'+U.heat(all,5,1,row);el.querySelector('.readout').innerHTML=`Query ${row+1}이 참고할 수 있는 위치: <b>${Array.from({length:causal?row+1:5},(_,i)=>i+1).join(', ')}</b><br>거리 기반의 가상 점수로 계산한 선택 행의 가중치: [${all.slice(row*5,row*5+5).map(x=>x===null?'0':U.fmt(x)).join(', ')}]`;});
};
const labels=['맑다','흐리다','좋다','춥다','덥다'],logits=[3,2,1.3,.5,-.2];
L.temperature=el=>{
 U.setup(el,U.range('temp','Temperature T',.1,2.5,.1,1)+'<p class="caption">“오늘 날씨는” 뒤의 가상 후보입니다. 로짓 [3, 2, 1.3, 0.5, −0.2]를 고정합니다.</p>',false);
 U.bind(el,()=>{const p=M.softmax(logits,U.value(el,'temp')),entropy=-M.sum(p.map(x=>x*Math.log2(x)));el.querySelector('.viz').innerHTML=U.bars(labels,p);el.querySelector('.readout').innerHTML=`가장 높은 후보 확률 <b>${U.fmt(p[0]*100,1)}%</b><br>분포의 엔트로피 <b>${U.fmt(entropy,3)} bit</b> · 클수록 선택의 불확실성이 큽니다.`;});
};
L.sampling=el=>{
 let counts=Array(5).fill(0),draws=0,seed=42,prob=[];
 U.setup(el,'<label class="control">후보 선택 방식<select id="filter"><option value="k">Top-k</option><option value="p">Top-p</option></select></label>'+U.range('k','Top-k 후보 수',1,5,1,3)+U.range('p','Top-p 누적 확률',.1,1,.05,.8)+'<div class="buttons"><button id="sample">100회 추출</button><button id="clear">초기화</button></div>',false);
 const render=()=>{el.querySelector('.viz').innerHTML='<h4>이론 확률</h4>'+U.bars(labels,prob)+'<h4>실제 추출 비율 · '+draws+'회</h4>'+U.bars(labels,counts.map(n=>draws?n/draws:0));el.querySelector('.readout').innerHTML=`남은 후보 <b>${prob.filter(v=>v>0).length}개</b> · ${draws}회 추출<br>${labels.map((l,i)=>`${l}: ${counts[i]}회`).join(' · ')}<br><span class="caption">위 막대는 이론 확률, 아래 막대는 실제 추출 비율입니다. 설정을 바꾸면 추출 기록이 초기화됩니다. 고정 시드 의사난수로 추출하여 결과를 재현할 수 있습니다.</span>`;};
 U.bind(el,()=>{const mode=el.querySelector('#filter').value;el.querySelector('#k').disabled=mode!=='k';el.querySelector('#p').disabled=mode!=='p';prob=M.filterDistribution(M.softmax(logits),mode==='k'?U.value(el,'k'):5,mode==='p'?U.value(el,'p'):1);counts.fill(0);draws=0;seed=42;render();});
 el.querySelector('#sample').onclick=()=>{for(let i=0;i<100;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;let u=seed/4294967296,index=4;for(let j=0;j<5;j++){u-=prob[j];if(u<0){index=j;break;}}counts[index]++;draws++;}render();};el.querySelector('#clear').onclick=()=>{counts.fill(0);draws=0;seed=42;render();};
};
})();
