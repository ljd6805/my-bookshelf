(()=>{
const U=AIUI,M=AIMath,L=AILabs;
L.convolution=el=>{
 let image=Array.from({length:7},()=>Array.from({length:7},(_,c)=>c>=3?1:0));
 const kernels={edge:[[-1,0,1],[-2,0,2],[-1,0,1]],blur:[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]]};
 U.setup(el,'<label class="control">커널<select id="kernel"><option value="edge">수직 경계 (Sobel)</option><option value="blur">평균 필터</option></select></label><div class="pixel-board" aria-label="입력 픽셀을 클릭해 바꾸세요"></div><div class="buttons"><button id="clear">모두 지우기</button><button id="restore">예제 복원</button></div>',false);
 function render(){const k=kernels[el.querySelector('#kernel').value],out=M.convolve(image,k);el.querySelector('.pixel-board').innerHTML=image.flat().map((v,i)=>`<button data-pixel="${i}" aria-label="${Math.floor(i/7)+1}행 ${i%7+1}열 픽셀" aria-pressed="${!!v}" class="${Math.floor(i/7)>=2&&Math.floor(i/7)<=4&&i%7>=2&&i%7<=4?'patch-pixel':''}" style="background:${v?'#cadde8':'#263449'}"></button>`).join('');el.querySelector('.viz').innerHTML='<p class="caption">5×5 출력 · 청록: 양수, 주황: 음수</p>'+U.heat(out,5,el.querySelector('#kernel').value==='edge'?4:1)+'<p class="caption">적용한 3×3 커널 · 입력의 테두리 9칸이 중앙 출력 계산 영역</p>'+U.heat(k.flat(),3,2);el.querySelector('.readout').innerHTML=`출력 최소 <b>${U.fmt(Math.min(...out))}</b> · 최대 <b>${U.fmt(Math.max(...out))}</b><br>입력 픽셀을 클릭하면 즉시 다시 계산합니다. 색의 최대 밝기는 Sobel 출력 ±4, 평균 필터 출력 1에 해당합니다.<br>중앙 출력 = 중앙 3×3 입력과 커널의 원소별 곱의 합 = <b>${U.fmt(out[12],3)}</b>`;}
 el.querySelector('.pixel-board').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.pixel;image[Math.floor(i/7)][i%7]^=1;render();el.querySelector(`[data-pixel="${i}"]`).focus();};el.querySelector('#clear').onclick=()=>{image=image.map(r=>r.map(()=>0));render();};el.querySelector('#restore').onclick=()=>{image=image.map(r=>r.map((_,c)=>c>=3?1:0));render();};U.bind(el,render);
};
L.reward=el=>{
 U.setup(el,U.range('help','유용성을 평가하는 비중',0,1,.05,.5)+U.range('beta','원래 정책을 유지하는 강도 β',.1,3,.1,1)+'<p class="caption">두 평가축의 점수를 가정합니다.<br>A: 유용성 3, 간결성 0<br>B: 유용성 2, 간결성 2<br>C: 유용성 0, 간결성 3<br>초기 정책은 각각 1/3입니다.</p>',false);
 U.bind(el,()=>{const a=U.value(el,'help'),r=[a*3,a*2+(1-a)*2,(1-a)*3],p=M.softmax(r,U.value(el,'beta'));el.querySelector('.viz').innerHTML=U.bars(['응답 A','응답 B','응답 C'],p);el.querySelector('.readout').innerHTML=`보상 = [${r.map(x=>U.fmt(x)).join(', ')}]<br>기대 보상 = <b>${U.fmt(M.dot(p,r),3)}</b><br>보상의 정의를 바꾸면 선호하는 응답도 바뀝니다.`;});
};
L.quantization=el=>{
 const original=Array.from({length:41},(_,i)=>Math.sin(i*.21)*.91);
 U.setup(el,'<label class="control">양자화 비트<select id="bits"><option value="2">2 bit</option><option value="4" selected>4 bit</option><option value="8">8 bit</option></select></label><p class="caption">범위 [−1,1]을 같은 간격으로 나누는 단순한 양자화입니다. 실제 가중치 분포나 그룹별 스케일은 반영하지 않습니다.</p>');
 U.bind(el,()=>{const bits=U.value(el,'bits'),q=M.quantize(original,bits),mse=M.sum(q.map((v,i)=>(v-original[i])**2))/q.length;el.querySelector('.chart').innerHTML=U.plot({lines:[{data:original.map((v,i)=>[i,v]),color:'var(--blue)'},{data:q.map((v,i)=>[i,v])}],xmin:0,xmax:40,ymin:-1.1,ymax:1.1,xlabel:'값의 순서',ylabel:'가중치 예제'});el.querySelector('.readout').innerHTML=`표현 단계 <b>${2**bits}개</b> · MSE <b>${U.fmt(mse,6)}</b><br>파랑: 원래 값 · 청록: 양자화 값. 최대 절대 오차 ${U.fmt(Math.max(...q.map((v,i)=>Math.abs(v-original[i]))),4)}. 8 bit에서는 두 곡선이 거의 겹칩니다.<br>FP16 대비 가중치 원시 저장량은 ${U.fmt(bits/16*100,0)}%입니다.`;});
};
L.memory=el=>{
 U.setup(el,U.range('params','모델 크기 (B parameters)',1,70,1,8)+'<label class="control">가중치 정밀도<select id="precision"><option value="4">4 bit</option><option value="8">8 bit</option><option value="16">16 bit</option></select></label>'+U.range('context','문맥 길이 (tokens)',1024,32768,1024,8192),false);
 U.bind(el,()=>{const params=U.value(el,'params'),bits=U.value(el,'precision'),n=U.value(el,'context'),weight=params*1e9*bits/8/2**30,kv=2*32*8*128*n*2/2**30,total=weight+kv;el.querySelector('.viz').innerHTML='<div class=memory-stack><span style="flex:'+weight+'">가중치</span><span style="flex:'+kv+'">KV</span></div><div class="table-wrap"><table><tr><th>항목</th><th>이론 용량 (GiB)</th></tr><tr><td>가중치</td><td>'+U.fmt(weight)+'</td></tr><tr><td>KV 캐시</td><td>'+U.fmt(kv)+'</td></tr><tr><td>단순 합계</td><td>'+U.fmt(total)+'</td></tr></table></div><p class="caption">KV 구조는 모델 크기와 독립적으로 고정: 32층, KV head 8개, head 차원 128, FP16, 배치 1. B = 10억 개. 1 GiB = 2³⁰ byte. 막대는 두 항목의 구성비입니다.</p>';el.querySelector('.readout').innerHTML=`가중치 + KV <b>${U.fmt(total)} GiB</b><br>추가 버퍼와 운영체제 메모리를 제외한 부분 합계입니다. 실제 장비 적합 여부는 실측해야 합니다.`;});
};
const docs=[
 ['신경망 학습','학습은 손실의 기울기를 계산하고 가중치를 갱신하는 과정입니다. 학습률이 너무 크면 발산할 수 있습니다.'],
 ['양자화와 메모리','양자화는 가중치의 비트 수를 줄입니다. 추론 메모리에는 가중치 외에도 KV 캐시가 포함됩니다.'],
 ['문맥 길이와 KV 캐시','문맥 길이가 늘어나면 KV 캐시의 메모리 사용량이 증가합니다. KV head 수와 배치 크기도 영향을 줍니다.'],
 ['RAG의 근거','RAG는 질문과 관련된 문서를 검색하여 답변의 근거로 제공합니다. 검색 결과의 출처와 시점을 확인해야 합니다.'],
 ['에이전트의 실패 처리','에이전트는 도구 결과를 관찰합니다. 실패하면 제한된 재시도를 수행하고 종료 조건을 확인합니다.']
];
function terms(s){return (s.toLowerCase().match(/[a-z]+|[가-힣]+/g)||[]).map(t=>t.replace(/(에서는|에는|으로|에서|이|가|은|는|을|를|의|와|과)$/,''));}
L.retrieval=el=>{
 U.setup(el,'<label class="control" for="query">검색 질문<input id="query" type="text" maxlength="160" value="문맥 길이 메모리 KV"></label>'+U.range('topn','가져올 문서 수',1,5,1,2)+'<p class="caption">시험해 보세요: “학습 가중치”, “도구 실패”, “검색 근거”. 단어 출현 여부만 사용하는 검색이므로 동의어에는 약합니다.</p>',false);
 U.bind(el,()=>{const q=new Set(terms(el.querySelector('#query').value)),results=docs.map(([title,body],i)=>{const d=new Set(terms(title+' '+body)),common=[...q].filter(t=>d.has(t)).length;return {title,body,i,score:q.size&&d.size?common/Math.sqrt(q.size*d.size):0};}).filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,U.value(el,'topn'));el.querySelector('.viz').innerHTML=results.length?results.map(d=>`<div class="document-result"><small>문서 ${d.i+1} · 유사도 ${U.fmt(d.score,3)}</small><h3>${d.title}</h3><p>${d.body}</p></div>`).join(''):'<div class="note">관련 문서를 찾지 못했습니다. “KV 메모리”처럼 문서에 있는 핵심어로 다시 검색해 보세요.</div>';el.querySelector('.readout').innerHTML=results.length?`근거 문장 발췌: <b>${results[0].title}</b><br>${results[0].body}<br><span class="caption">LLM이 생성한 답변이 아닙니다. 최고 점수 문서를 그대로 발췌했습니다.</span>`:'<b>근거 부족: 답변 보류</b><br>검색 결과가 없으면 근거를 만들어 내지 않습니다.';});
};
L.agent=el=>{
 let step=0,failed=false;
 U.setup(el,'<label class="control">검색 도구 상태<select id="failure"><option value="ok">정상</option><option value="fail">첫 호출만 실패</option><option value="always">계속 실패</option></select></label><div class="buttons"><button id="next">다음 단계</button><button id="restart">처음부터</button></div><p class="caption">요청: “메모리 문서를 찾아 가중치와 KV의 차이를 설명해 줘.” 최대 재시도 1회인 고정 실행 모형입니다.</p>',false);
 const route=()=>el.querySelector('#failure').value==='always'?['요청 확인: 메모리 구성 문서가 필요합니다.','행동: 검색 도구를 호출합니다.','관찰: 연결 시간 초과입니다.','재시도: 마지막으로 한 번 더 호출합니다.','관찰: 다시 시간 초과입니다.','중단: 재시도 1회를 소진했습니다. 근거가 없어 답변을 보류합니다.']:failed?['요청 확인: 필요한 정보는 메모리 구성입니다.','행동: 문서 검색 도구를 호출합니다.','관찰: 연결 시간 초과가 발생했습니다.','재시도: 검색 도구를 한 번 더 호출합니다.','관찰: 문서 2와 문서 3을 받았습니다.','완료: 가중치는 모델의 학습된 수치, KV 캐시는 처리 중인 문맥의 Key·Value입니다. 문맥이 길어지면 KV 캐시가 커집니다. [문서 2·3]']:['요청 확인: 필요한 정보는 메모리 구성입니다.','행동: 문서 검색 도구를 호출합니다.','관찰: 문서 2와 문서 3을 받았습니다.','완료: 가중치는 모델의 학습된 수치, KV 캐시는 처리 중인 문맥의 Key·Value입니다. 문맥이 길어지면 KV 캐시가 커집니다. [문서 2·3]'];
 function render(){const steps=route();el.querySelector('.viz').innerHTML=steps.slice(0,step+1).map((s,i)=>`<div class="step ${i===step?'current':''}"><span class="pill">${String(i+1).padStart(2,'0')}</span> ${s}</div>`).join('');el.querySelector('#next').disabled=step>=steps.length-1;el.querySelector('.readout').innerHTML=step>=steps.length-1?(el.querySelector('#failure').value==='always'?'<b>안전 중단 · 답변 보류</b>':'<b>작업 완료</b>')+' · 종료 조건 충족. 추가 도구 호출 없이 멈춥니다.':`현재 단계 <b>${step+1}/${steps.length}</b> · 다음 단계를 눌러 상태 전이를 확인하세요.`;}
 el.querySelector('#next').onclick=()=>{step++;render();};el.querySelector('#restart').onclick=()=>{step=0;render();};U.bind(el,()=>{failed=el.querySelector('#failure').value==='fail';step=0;render();});
};
L.evaluation=el=>{
 const data=[[.95,1],[.87,1],[.83,0],[.76,1],[.7,1],[.65,0],[.57,1],[.48,0],[.42,1],[.35,0],[.28,0],[.18,0]];
 U.setup(el,U.range('threshold','이상 판단 임계값',0,1,.05,.5)+'<p class="caption">고정된 12개 샘플에서 점수 ≥ 임계값이면 이상으로 판단합니다. 샘플의 실제 이상 여부는 고정되어 있습니다.</p>',false);
 U.bind(el,()=>{const t=U.value(el,'threshold');let tp=0,fp=0,fn=0,tn=0;data.forEach(([p,y])=>{if(p>=t){if(y)tp++;else fp++;}else{if(y)fn++;else tn++;}});const m=M.metrics(tp,fp,fn,tn);el.querySelector('.viz').innerHTML=`<div class="table-wrap"><table><tr><th></th><th>실제 이상</th><th>실제 정상</th></tr><tr><th>예측 이상</th><td>TP ${tp}</td><td>FP ${fp}</td></tr><tr><th>예측 정상</th><td>FN ${fn}</td><td>TN ${tn}</td></tr></table></div><br>`+U.bars(['정밀도','재현율','정확도','F1'],[m.precision,m.recall,m.accuracy,m.f1])+'<div class=sample-grid>'+data.map(([p,y],i)=>`<div class="sample ${p>=t!==!!y?'wrong':''}"><b>#${i+1} · ${p.toFixed(2)}</b><br>실제 ${y?'이상':'정상'}<br>예측 ${p>=t?'이상':'정상'} · ${p>=t?(y?'TP':'FP'):(y?'FN':'TN')}</div>`).join('')+'</div>';el.querySelector('.readout').innerHTML=`놓친 이상 <b>${fn}건</b> · 잘못 울린 경보 <b>${fp}건</b><br>임계값을 낮추면 이 고정 데이터에서 재현율은 감소하지 않습니다. 정밀도는 단조롭게 바뀐다고 보장할 수 없습니다. 주황 테두리는 틀린 판단입니다.${tp+fp===0?'<br>예측 이상이 0건이므로 정밀도는 정의할 수 없습니다. 막대에는 계산 규칙상 0을 표시합니다.':''}`;});
};
})();
