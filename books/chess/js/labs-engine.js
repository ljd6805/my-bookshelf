/* 11장과 마지막 과제 실험: 미니맥스와 알파베타의 노드 수, 하준의 대국 복기. */
(()=>{
'use strict';
const U=CUI,R=CRules,P=CPos,L=CLabs;
const opts=o=>Object.entries(o).map(([k,v])=>[k,v[0]]);
const score=v=>Math.abs(v)>900?(v>0?`외통 (${R.MATE-v}반수)`:`외통당함 (${R.MATE+v}반수)`):`${U.sign(v)}점`;
/* 미니맥스는 시작 국면 깊이 4에서 20만 노드를 넘어 화면이 멈추므로, 노드가 너무 많을 국면·깊이에서는 알파베타만 센다. */
const MINIMAX_LIMIT={start:3,fork:3,ladder:4};

/* 11장: 같은 국면·깊이에서 미니맥스와 알파베타가 방문한 노드 수와 고른 수를 견준다. */
L.search=el=>{
 U.setup(el,U.select('se-pos','국면',opts(P.search),'fork')+U.range('se-depth','탐색 깊이 (반수)',1,4,1,2,'흰 수 하나, 검은 수 하나가 각각 1입니다.')+U.check('se-order','알파베타에서 잡는 수를 먼저 보기'));
 U.bind(el,()=>{const key=el.querySelector('#se-pos').value,[label,fen]=P.search[key],s=R.parseFEN(fen),d=+el.querySelector('#se-depth').value,sorted=el.querySelector('#se-order').checked;
  const t0=performance.now(),ab=R.alphabeta(s,d,-Infinity,Infinity,0,{nodes:0},sorted),t1=performance.now(),mmOk=d<=MINIMAX_LIMIT[key],mm=mmOk?R.minimax(s,d):null,t2=performance.now();
  const marks={};if(ab.best){marks[ab.best.from]='from';marks[ab.best.to]='to';}
  el.querySelector('.chart').innerHTML=U.board(s,{marks,label:`${label}. 알파베타가 고른 수 ${ab.best?R.san(s,ab.best):'없음'}`,buttons:false});
  const rows=[['미니맥스',mm?mm.nodes.toLocaleString('en-US'):'세지 않음',mm?R.san(s,mm.best):'—',mm?score(mm.score):'—',mm?`${Math.round(t2-t1)}ms`:'—'],[`알파베타${sorted?' + 잡는 수 먼저':''}`,ab.nodes.toLocaleString('en-US'),ab.best?R.san(s,ab.best):'—',score(ab.score),`${Math.round(t1-t0)}ms`]];
  const ratio=mm?` 알파베타는 미니맥스가 본 노드의 ${(ab.nodes/mm.nodes*100).toFixed(1)}%만 보고 같은 점수에 닿았습니다.`:` 이 깊이에서 미니맥스는 노드가 너무 많아 세지 않았습니다(시작 국면 깊이 4의 끝 국면만 197,281개).`;
  el.querySelector('.readout').innerHTML=`<b>${label}, 깊이 ${d}</b>${U.table(['방법','방문한 노드','고른 수','점수(흰색 기준)','걸린 시간'],rows,'같은 평가 함수(기물 점수)로 읽은 결과')}${mm?U.bars(['미니맥스','알파베타'],[mm.nodes,ab.nodes],{unit:'개'}):''}${ratio} 점수는 깊이 끝 국면의 기물 점수 차이고, 외통은 따로 셉니다.${U.kind('real','걸린 시간은 이 브라우저와 기기에 따라 달라집니다.')}`;});
};

/* 마지막 과제: 하준의 첫 대국에서 고른 세 순간. 실제로 둔 수와 다른 두 후보를 같은 깊이로 읽고 원칙 숫자를 함께 본다. */
L.review=el=>{
 const G=P.game,run=R.playLine(G.moves);
 U.setup(el,U.select('rv-moment','복기할 순간',G.moments.map((m,i)=>[i,m[2]]),0)+U.select('rv-cand','둘 수',[0,1,2].map(i=>[i,`후보 ${i+1}`]),0)+'<p class="hint" id="rv-game"></p>');
 const fill=()=>{const m=G.moments[+el.querySelector('#rv-moment').value],sel=el.querySelector('#rv-cand'),keep=sel.value;sel.innerHTML=m[1].map((t,i)=>`<option value="${i}">${t}${i===0?' (실제로 둔 수)':''}</option>`).join('');sel.value=keep;};
 el.querySelector('#rv-moment').addEventListener('input',fill);el.querySelector('#rv-moment').addEventListener('change',fill);fill();
 el.querySelector('#rv-game').textContent='기록: '+run.moves.map((m,i)=>i%2===0?`${i/2+1}. ${m.san}`:m.san).join(' ')+' (하준 기권)';
 U.bind(el,()=>{fill();const m=G.moments[+el.querySelector('#rv-moment').value],s=run.states[m[0]],pick=+el.querySelector('#rv-cand').value,base=R.evaluate(s);
  const evals=m[1].map(t=>{const mv=R.parseSan(s,t),n=R.makeMove(s,mv),x=R.search(n,2),pr=R.principles(n,'w');return {t,mv,n,v:-x.score,reply:x.best?R.san(n,x.best):'—',pr};});
  const e=evals[pick],marks={[e.mv.from]:'from',[e.mv.to]:'to'};
  el.querySelector('.chart').innerHTML=U.board(s,{marks,label:`${m[2]}. 후보 ${e.t}`,buttons:false});
  const bestV=Math.max(...evals.map(x=>x.v));
  const rows=evals.map((x,i)=>[`${x.t}${i===0?' (실제)':''}${i===pick?' ◀':''}`,`${U.sign(x.v-base)}점${x.v===bestV?' ✓':''}`,x.reply,x.pr.developed,x.pr.hits]);
  el.querySelector('.readout').innerHTML=`<b>${m[2]}</b> · 지금 기물 점수 차(흰색 기준) ${U.sign(base)}점${U.table(['후보','점수 변화(두 반수와 이어지는 잡기까지 읽음)','검은색의 가장 좋은 대답','나온 나이트·비숍','중앙 공격 수'],rows,'세 후보 비교')}고른 후보 <b>${e.t}</b>: 기물 점수 ${U.sign(e.v-base)}점, 전개 ${e.pr.developed}개, 중앙 공격 ${e.pr.hits}.<br>${m[3]}${U.kind('story','대국은 이 책이 지어냈고, 점수와 원칙 숫자는 규칙대로 계산합니다.')}`;});
};
})();
