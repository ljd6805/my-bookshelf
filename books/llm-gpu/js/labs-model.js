(()=>{
'use strict';
const U=GUI,M=GMath,R=U.range,S=U.select,V=U.value,F=U.fmt;
const bits=(v=4)=>S('bits','가중치 정밀도 (bit)',[[4,'4bit'],[8,'8bit'],[16,'16bit']],v);
const modelOptions=Object.entries(M.models).map(([k,m])=>[k,m.name]);
GLabs.bundle=el=>{
 const items=[['가중치 파일','학습된 텐서 값. 보통 가장 큰 저장량을 차지합니다.'],['구조 설정','층과 차원, 모델 계열을 정합니다.'],['토크나이저','문자열을 ID로, ID를 문자열로 바꿉니다.'],['실행 엔진','파일을 읽고 계산을 하드웨어에 배치합니다.']];
 U.setup(el,S('part','어떤 구성요소를 살펴볼까요?',items.map((x,i)=>[i,x[0]]),0));
 U.bind(el,()=>{const i=V(el,'part');U.result(el,U.cards(items,i),`<strong>${items[i][0]}</strong> · ${items[i][1]}<br>선택한 항목의 역할을 보여 주는 고정 시나리오입니다. 실제 파일 검사나 모델 실행은 하지 않습니다.`);});
};
GLabs.params=el=>{
 U.setup(el,R('width','입력·출력 폭 D',2,32,2,4)+R('layers','독립 선형층 수 L',1,12,1,1));
 U.bind(el,()=>{const d=V(el,'width'),l=V(el,'layers'),w=d*d*l,b=d*l;
 U.result(el,U.bars(['가중치','편향','전체'],[w,b,w+b],'개'),`층 하나: ${d}×${d}+${d} = <b>${d*d+d}개</b>.<br>${l}개 층의 합: <strong>${F(M.linearParams(d,d,l),0)}개</strong>. 입력·출력 폭을 같이 바꿉니다.`);});
};
GLabs.weights=el=>{
 U.setup(el,R('params','파라미터 수 (B)',1,70,1,8)+bits());
 U.bind(el,()=>{const p=V(el,'params'),b=V(el,'bits'),n=M.weightBytes(p,b);
 U.result(el,U.bars([16,8,4].map(x=>`${x}bit${x===b?' ◀':''}`),[16,8,4].map(x=>M.weightBytes(p,x)/M.GiB)),`${p}B × ${b}/8 = <strong>${F(n/1e9)} GB = ${F(n/M.GiB)} GiB</strong>.<br>위 막대는 같은 모델을 세 정밀도로 저장했을 때의 비교입니다. 선택 값은 ${b}bit입니다. 가중치 외의 추가 메모리는 포함하지 않습니다.`);});
};
GLabs.quant=el=>{
 const samples=[-.93,-.71,-.36,-.12,.14,.43,.68,.91];
 U.setup(el,S('qbits','숫자 표현 bit',[[2,'2bit'],[4,'4bit'],[8,'8bit']],4));
 U.bind(el,()=>{const q=M.quantize(samples,V(el,'qbits'));
 const points=(a)=>a.map((x,i)=>`${40+i*56},${140-x*100}`).join(' ');
 const chart=U.svg(`<path d="M25 140H460" stroke="var(--line)"/><polyline points="${points(samples)}" fill="none" stroke="var(--blue)" stroke-width="3"/><polyline points="${points(q.rounded)}" fill="none" stroke="var(--orange)" stroke-width="3" stroke-dasharray="6 4"/>${q.rounded.map((x,i)=>`<circle cx="${40+i*56}" cy="${140-x*100}" r="5" fill="var(--orange)"/>`).join('')}<text x="12" y="22">+1</text><text x="12" y="246">−1</text><text x="40" y="272">실선: 원본 · 점선과 점: 양자화</text>`,'여덟 숫자의 원본과 양자화 결과. 아래에 오차와 숫자를 표시합니다.');
 U.result(el,chart,`표현 눈금 <b>${q.levels}개</b> · 평균제곱오차 <strong>${q.mse.toExponential(3)}</strong><br>원본: ${samples.join(', ')}<br>복원: ${q.rounded.map(x=>F(x,3)).join(', ')}<br>[-1,1] 균등 양자화이며 실제 모델 품질 점수가 아닙니다.`);});
};
})();
