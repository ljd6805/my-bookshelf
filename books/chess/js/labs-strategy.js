/* 7~10장 실험: 교환 계산, 오프닝 원칙 세기, 전술 퍼즐, 기본 체크메이트. 점수는 관례적인 기물 가치 1·3·3·5·9를 쓴다. */
(()=>{
'use strict';
const U=CUI,R=CRules,P=CPos,L=CLabs;
/* 기보 뒤 조사: +·#는 빼고, 끝 글자가 기물 글자면 읽는 소리(큐·알·비·엔·케이)로 받침을 본다. */
const sj=(t,a,b)=>{const x=t.replace(/[+#]/g,''),say={Q:'큐',R:'알',B:'비',N:'엔',K:'케이'}[x.at(-1)];return U.josa(say||x,a,b);};
const opts=o=>Object.entries(o).map(([k,v])=>[k,v[0]]);
const pts=n=>`${U.sign(n)}점`;

/* 7장: d5를 두고 서로 잡아 들어갈 때 흰색의 득실. 멈출 줄 아는 경우와 끝까지 잡는 경우를 견준다. */
L.exchange=el=>{
 U.setup(el,U.select('ex-pos','국면',opts(P.exchange),'even')+U.check('ex-all','손해가 나도 끝까지 잡는다고 보기'));
 U.bind(el,()=>{const [label,fen]=P.exchange[el.querySelector('#ex-pos').value],s=R.parseFEN(fen),t=R.sq('d5'),x=R.exchange(s,t),all=el.querySelector('#ex-all').checked;
  const marks={[t]:'capture'};R.attackers(s,t,'w').forEach(i=>marks[i]='hit');R.attackers(s,t,'b').forEach(i=>marks[i]='hit');
  el.querySelector('.chart').innerHTML=U.board(s,{marks,label:`${label}. d5를 두고 흰색 ${R.attackers(s,t,'w').length}개, 검은색 ${R.attackers(s,t,'b').length}개 기물이 겨눕니다`,buttons:false});
  const steps=all?x.steps:x.played;let bal=0;const rows=steps.map((st,k)=>{bal+=k%2===0?st.gain:-st.gain;return [k+1,k%2===0?'흰색':'검은색',st.san,`${R.NAME[st.by]}${U.josa(R.NAME[st.by],'으로','로')} ${st.gain}점 기물을 잡음`,pts(bal)];});
  const m=R.material(s);
  el.querySelector('.readout').innerHTML=`<b>${label}</b> · 기물 점수 흰색 ${m.w} : 검은색 ${m.b} (킹은 세지 않음)${U.table(['차례','누가','수','무엇을','흰색 누계'],rows,all?'끝까지 잡을 때':'손해가 나면 멈출 때')}<b>흰색이 먼저 잡으면 ${pts(all?bal:x.gain)}</b>${all?'':` · ${x.gain>0?'✓ 잡는 편이 이득입니다':x.gain===0?'▲ 같은 값끼리 바꾸는 교환입니다':'✗ 잡지 않는 편이 낫습니다'}`}<br>○은 d5를 겨누는 기물, ✕는 다툼이 벌어지는 칸입니다. 양쪽 모두 가장 싼 기물부터 잡는다고 봅니다.${U.kind('real','가치 1·3·3·5·9는 규칙이 아니라 관례적인 어림입니다.')}`;});
};

/* 8장: 오프닝 기보를 한 수씩 넘기며 중앙·전개·킹 안전을 센다. */
L.opening=el=>{
 U.setup(el,U.select('op-line','오프닝',opts(P.opening),'principled')+U.range('op-ply','둔 반수',0,8,1,8,'흰색 한 수와 검은색 한 수가 각각 반수 하나입니다.'));
 U.bind(el,()=>{const [label,line]=P.opening[el.querySelector('#op-line').value],run=R.playLine(line),k=Math.min(+el.querySelector('#op-ply').value,run.states.length-1),s=run.states[k];
  const w=R.principles(s,'w'),b=R.principles(s,'b'),mv=run.moves[k-1],marks={};if(mv){marks[mv.from]='last';marks[mv.to]='last';}
  el.querySelector('.chart').innerHTML=U.board(s,{marks,label:`${label}, ${k}반수 뒤`,buttons:false});
  const y=v=>v?'✓':'✗',sans=run.moves.slice(0,k).map((m,i)=>i%2===0?`${i/2+1}. ${m.san}`:m.san).join(' ')||'시작 국면';
  el.querySelector('.readout').innerHTML=`<b>${label}</b> · ${sans}${U.table(['','중앙 네 칸 차지','중앙 네 칸 공격 수','나온 나이트·비숍 (4개 중)','캐슬링'],[['흰색',w.occupied,w.hits,w.developed,y(w.castled)],['검은색',b.occupied,b.hits,b.developed,y(b.castled)]],'오프닝 원칙 세기')}${U.bars(['흰색 전개','검은색 전개'],[w.developed,b.developed],{unit:'개'})}중앙 네 칸은 d4·e4·d5·e5입니다. 공격 수는 그 네 칸을 겨누는 기물 수를 칸마다 더한 값입니다.${U.kind('real','원칙은 수를 고르는 길잡이이고, 이 숫자가 높다고 이긴다는 뜻은 아닙니다.')}`;});
};

/* 9장: 전술 퍼즐. 흰색 한 수를 두면, 검은색의 가장 좋은 대답 뒤 잡는 수를 끝까지 이어 본 점수로 맞았는지 판정한다.
   판정에 쓰는 점수는 처음 국면에서 두 반수를 읽은 값과 같은 깊이다(흰 수 → 검은 대답 → 잡기 끝까지). */
const solveScore=s=>-R.search(s,1).score;
L.tactics=el=>{
 U.setup(el,U.select('ta-pos','퍼즐',opts(P.tactics),'fork')+'<div class="buttons"><button type="button" id="ta-hint">힌트 보기</button></div>');
 let api,msg='',hint=false;const pos=()=>P.tactics[el.querySelector('#ta-pos').value];
 const render=()=>{const [name,,,theme]=pos();el.querySelector('.readout').innerHTML=`<b>${name}</b>${hint?` · 힌트: ${theme}`:''}<br>${msg}${U.kind('preset','국면은 미리 정했고, 점수는 검은색의 대답과 이어지는 잡기를 끝까지 계산한 값입니다.')}`;};
 const onChange=(s,info={})=>{if(!api)return;
  if(info.move&&s.turn==='b'&&!api.done){const [,fen,sol]=pos(),start=R.parseFEN(fen),base=R.evaluate(start),need=R.search(start,2).score,got=solveScore(s),reply=R.search(s,1).best;api.done=true;
   msg=`${got>=need?'<b>✓ 맞았습니다.</b>':'<b>✗ 더 많이 얻는 수가 있습니다.</b>'} ${info.san}${sj(info.san,'을','를')} 두면 검은색이 가장 좋게 대답해도 흰색의 기물 점수 차가 ${pts(got-base)} 바뀝니다. 이 퍼즐에서 얻을 수 있는 최대는 ${pts(need-base)}입니다.${got>=need?'':` 정답 예: ${sol}`}${reply?` 검은색은 ${R.san(s,reply)}${sj(R.san(s,reply),'으로','로')} 대답합니다.`:''}`;
   if(reply)setTimeout(()=>api.apply(reply),0);}
  else if(info.reset)msg='흰색 차례입니다. 기물 하나를 움직여 상대 기물을 얻는 수를 찾아보세요.';
  render();};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],onChange,canMove:s=>s.turn==='w'&&!api.done,label:'전술 퍼즐 판'});
 el.querySelector('#ta-hint').onclick=()=>{hint=true;render();};
 U.bind(el,()=>{hint=false;api.done=false;api.reset(pos()[1]);});
};

/* 10장: 체크메이트 퍼즐. 2수 외통은 첫 수 뒤 검은색이 가장 좋은 수로 대답한다. */
L.mates=el=>{
 U.setup(el,U.select('ma-pos','퍼즐',opts(P.mates),'back'));
 let api,left=1,msg='';const pos=()=>P.mates[el.querySelector('#ma-pos').value];
 const onChange=(s,info={})=>{if(!api)return;const [name,,n,sol]=pos(),st=R.status(s);
  if(info.reset)msg=`흰색 차례입니다. ${n}수 안에 체크메이트를 만드세요.`;
  else if(st.result==='checkmate'){msg='<b>✓ 체크메이트입니다.</b> 검은 킹이 체크를 받았고, 킹이 갈 칸도, 막거나 잡을 기물도 없습니다(합법 수 0개).';api.over=true;}
  else if(st.result==='stalemate'){msg='<b>✗ 스테일메이트가 되었습니다.</b> 검은색이 체크가 아닌데 둘 수가 없어 무승부입니다. 실험 초기화를 눌러 다시 해 보세요.';api.over=true;}
  else if(info.move&&s.turn==='b'){left--;if(left<=0){msg=`<b>✗ ${n}수 안에 외통이 되지 않았습니다.</b> 실험 초기화를 눌러 다시 해 보세요. 정답 예: ${sol}`;api.over=true;}else{const r=R.search(s,2).best;msg=`${info.san} 뒤 검은색은 ${R.san(s,r)}${sj(R.san(s,r),'으로','로')} 버팁니다. 이제 한 수 안에 외통을 만드세요.`;setTimeout(()=>api.apply(r),0);}}
  el.querySelector('.readout').innerHTML=`<b>${name}</b><br>${msg}${U.kind('preset','국면은 미리 정했고, 외통 판정은 규칙대로 계산합니다.')}`;};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],onChange,canMove:s=>s.turn==='w'&&!api.over,label:'체크메이트 퍼즐 판'});
 U.bind(el,()=>{left=pos()[2];api.over=false;api.reset(pos()[1]);});
};
})();
