/* 1~6장 실험: 좌표, 기물이 닿는 칸, 특수한 수, 합법 수, 게임 끝 판정, 기보. 모든 판정은 CRules가 규칙대로 계산한다. */
(()=>{
'use strict';
const U=CUI,R=CRules,P=CPos,L=CLabs;
const opts=o=>Object.entries(o).map(([k,v])=>[k,v[0]]);
const sanList=list=>list.length?list.map((t,i)=>i%2===0?`${i/2+1}. ${t}`:t).join(' '):'아직 둔 수가 없습니다';
const SQUARES=[...Array(64).keys()].reverse().map(i=>{const j=(7-Math.floor(i/8))*8+(7-i%8);return [j,R.name(j)];}).sort((a,b)=>a[1].localeCompare(b[1]));

/* 1장: 칸을 눌러 좌표와 칸 색을 읽고, 정해 둔 칸 여섯 개를 찾는다. */
const TARGETS=['e4','d1','h8','a1','f7','c3'];
L.coords=el=>{
 U.setup(el,U.select('co-flip','판을 보는 쪽',[['w','흰 쪽에서 (1줄이 아래)'],['b','검은 쪽에서 (8줄이 아래)']],'w')+U.select('co-set','기물',[['start','시작 배치'],['empty','빈 판']],'start')+'<p class="hint" id="co-ask"></p>');
 const st={k:0,right:0,last:-1};
 const draw=()=>{const s=R.parseFEN(el.querySelector('#co-set').value==='start'?R.START:'8/8/8/8/8/8/8/8 w - - 0 1'),flip=el.querySelector('#co-flip').value==='b',marks={};if(st.last>=0)marks[st.last]='from';
  el.querySelector('.chart').innerHTML=U.board(s,{marks,flip,label:'좌표 찾기 판'});el.querySelector('#co-ask').innerHTML=st.k<TARGETS.length?`찾을 칸 ${st.k+1}/${TARGETS.length}: <b>${TARGETS[st.k]}</b>`:`여섯 칸을 모두 찾았습니다. 맞힌 칸 ${st.right}개`;return s;};
 const report=(s,i,ok)=>{const p=s.board[i],light=R.isLight(i);el.querySelector('.readout').innerHTML=`<b>${R.name(i)}</b> · ${light?'밝은 칸':'어두운 칸'} · ${p?U.pieceName(p):'빈 칸'}${ok===null?'':ok?' · ✓ 찾을 칸이 맞습니다':` · ✗ 찾을 칸은 ${TARGETS[st.k]}입니다`}<br>세로줄 ${R.name(i)[0]}(왼쪽부터 ${R.FILES.indexOf(R.name(i)[0])+1}번째), 가로줄 ${R.name(i)[1]}. 흰 쪽에서 보면 오른쪽 아래 구석 h1이 밝은 칸이고, 흰 퀸은 밝은 칸 d1, 검은 퀸은 어두운 칸 d8에서 시작합니다.${U.kind('real')}`;};
 el.querySelector('.chart').onclick=e=>{const b=e.target.closest('[data-sq]');if(!b)return;const i=+b.dataset.sq,s=draw();let ok=null;if(st.k<TARGETS.length){ok=R.name(i)===TARGETS[st.k];if(ok){st.right++;st.k++;}}st.last=i;const s2=draw();report(s2,i,ok);el.querySelector(`[data-sq="${i}"]`)?.focus();};
 U.bind(el,()=>{st.last=-1;draw();el.querySelector('.readout').innerHTML=`칸을 눌러 이름을 읽어 보세요. 판 방향을 바꾸면 칸의 자리는 바뀌어도 이름(a1~h8)은 그대로입니다.${U.kind('real')}`;});
};

/* 2장: 빈 판에 기물 하나를 놓고 닿는 칸을 센다. 막는 기물을 넣으면 같은 편은 막고, 상대는 잡을 수 있다. */
const BLOCKERS={51:'P',45:'p',9:'P',30:'p'};
L.reach=el=>{
 U.setup(el,U.select('re-piece','기물',[['n','나이트'],['b','비숍'],['r','룩'],['q','퀸'],['k','킹'],['p','폰']],'n')+U.select('re-sq','놓을 칸',SQUARES.map(([i,n])=>[n,n]),'d4')+U.check('re-block','다른 폰 넣기 (흰 폰 b2·d7, 검은 폰 f6·g4)'));
 const count=(t,i,block)=>{const b=Array(64).fill(null);if(block)for(const [k,v] of Object.entries(BLOCKERS))if(+k!==i)b[+k]=v;b[i]=t.toUpperCase();const s={board:b,turn:'w',castling:{K:false,Q:false,k:false,q:false},ep:-1,half:0,full:1};return {s,ms:R.legalMoves(s,i)};};
 U.bind(el,()=>{const t=el.querySelector('#re-piece').value,i=R.sq(el.querySelector('#re-sq').value),block=el.querySelector('#re-block').checked,{s,ms}=count(t,i,block),marks={[i]:'from'};
  ms.forEach(m=>marks[m.to]=s.board[m.to]?'capture':'to');el.querySelector('.chart').innerHTML=U.board(s,{marks,label:`${R.NAME[t]} ${R.name(i)}에서 닿는 칸`,buttons:false});
  const caps=ms.filter(m=>s.board[m.to]).length,centre=count(t,R.sq('d4'),false).ms.length,corner=count(t,R.sq('a1'),false).ms.length;
  el.querySelector('.readout').innerHTML=`<b>${R.NAME[t]} ${R.name(i)}: 닿는 칸 ${ms.length}개</b>${caps?` (그 가운데 잡을 수 있는 칸 ${caps}개)`:''}. ●은 빈 칸, ✕는 잡을 수 있는 칸입니다.<br>같은 ${R.NAME[t]}${U.josa(R.NAME[t],'이','가')} 빈 판 가운데 d4에서는 ${centre}칸, 구석 a1에서는 ${corner}칸에 닿습니다.${t==='p'?' 폰은 앞으로만 가고, 잡을 때만 대각선 앞으로 갑니다.':''}${t==='r'?' 룩은 빈 판 어느 칸에서나 14칸입니다.':''}${U.kind('real','빈 판에서 킹 없이 셉니다.')}`;});
};

/* 3장: 앙파상·승진·캐슬링을 직접 두고, 캐슬링 다섯 조건을 하나씩 확인한다. */
L.special=el=>{
 U.setup(el,U.select('sp-pos','국면',opts(P.special),'ep')+U.select('sp-promo','승진할 기물',[['q','퀸'],['r','룩'],['b','비숍'],['n','나이트']],'q'));
 let api;const pos=()=>P.special[el.querySelector('#sp-pos').value];
 const castleRows=s=>['K','Q'].map(side=>{const c=R.castlingCheck(s,s.turn,side),y=v=>v?'✓':'✗';return [side==='K'?'킹 쪽 0-0':'퀸 쪽 0-0-0',y(c.rights),y(c.empty),y(c.notInCheck),y(c.passSafe),y(c.landSafe),c.ok?'<b>✓ 할 수 있음</b>':'✗ 할 수 없음'];});
 const report=(s,info={})=>{const ms=R.legalMoves(s),sp=ms.filter(m=>m.flag==='ep'||m.promo||(m.flag||'').startsWith('castle')).map(m=>R.san(s,m));
  el.querySelector('.readout').innerHTML=`${info.san?`<b>방금 둔 수: ${info.san}</b><br>`:''}${pos()[2]}<br>지금 둘 수 있는 특수한 수: <b>${sp.length?sp.join(', '):'없음'}</b>${U.table(['캐슬링','킹·룩 처음 자리','사이 칸 빔','지금 체크 아님','지나는 칸 안전','도착 칸 안전','결과'],castleRows(s),'둘 차례 쪽 캐슬링 조건')}${U.kind('preset','국면은 미리 정했고, 판정은 규칙대로 계산합니다.')}`;};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],promo:()=>el.querySelector('#sp-promo').value,onChange:report,label:'특수한 수를 두어 보는 판'});
 U.bind(el,()=>api.reset(pos()[1]));
};

/* 4장: 규칙상 움직임과 합법 수의 차이. 기물을 고르면 킹이 공격받게 되는 칸을 ⊘로 표시한다. */
L.legal=el=>{
 U.setup(el,U.select('lg-pos','국면',opts(P.legal),'pin'));
 let api;const pos=()=>P.legal[el.querySelector('#lg-pos').value];
 const bad=s=>{const out={};if(!api||api.selected<0)return out;const ok=new Set(R.legalMoves(s,api.selected).map(m=>m.to));for(const m of R.pseudoMoves(s,api.selected))if(!ok.has(m.to))out[m.to]='bad';return out;};
 const report=s=>{const pseudo=R.pseudoMoves(s),legal=R.legalMoves(s),sel=api&&api.selected>=0?api.selected:-1;
  const selLine=sel>=0?`<br>고른 기물 ${U.pieceName(s.board[sel])} ${R.name(sel)}: 규칙상 움직임 ${R.pseudoMoves(s,sel).length}개 가운데 합법 수 ${R.legalMoves(s,sel).length}개.`:'<br>기물을 누르면 그 기물의 움직임을 나눠 보여 줍니다.';
  el.querySelector('.readout').innerHTML=`${pos()[2]} ${R.inCheck(s)?'<b>지금 체크입니다.</b>':''}<br><b>규칙상 움직임 ${pseudo.length}개 → 합법 수 ${legal.length}개</b> (킹이 공격받게 되는 수 ${pseudo.length-legal.length}개를 뺌)${selLine}<br>합법 수: ${legal.map(m=>R.san(s,m)).join(', ')||'없음'}${U.kind('preset','국면은 미리 정했고, 수는 규칙대로 셉니다.')}`;};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],onChange:s=>report(s),extraMarks:bad,label:'합법 수를 고르는 판'});
 U.bind(el,()=>api.reset(pos()[1]));
};

/* 5장: 국면 판정. 같은 국면이 몇 번 나왔는지와 50수 기록도 함께 센다. */
const RESULT={checkmate:'체크메이트: 체크를 건 쪽이 이깁니다',stalemate:'스테일메이트: 무승부',dead:'기물 부족(죽은 국면): 무승부',fivefold:'같은 국면 다섯 번: 저절로 무승부',seventyfive:'75수 규칙: 저절로 무승부',ongoing:'게임이 이어집니다'};
L.ending=el=>{
 U.setup(el,U.select('en-pos','국면',opts(P.ending),'mate'));
 let api;const pos=()=>P.ending[el.querySelector('#en-pos').value];
 const report=s=>{if(!api)return;const st=R.status(s,api.history);
  el.querySelector('.readout').innerHTML=`${pos()[2]}<br><b>${RESULT[st.result]}</b>${st.reason?` · ${st.reason}`:''}<br>둘 차례 ${s.turn==='w'?'흰색':'검은색'} · 체크 ${st.check?'✓':'✗'} · 합법 수 ${st.moves}개 · 이 국면이 나온 횟수 ${st.repeats}번${st.claimRepetition?' (세 번 이상: 무승부를 요구할 수 있음)':''} · 폰을 움직이거나 잡지 않은 반수 ${s.half}${st.claimFifty?' (100 이상: 50수 규칙으로 무승부를 요구할 수 있음)':''}<br>둔 수: ${sanList(api.sans)}${U.kind('preset','국면은 미리 정했고, 판정은 규칙대로 계산합니다.')}`;};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],onChange:s=>report(s),label:'게임 끝을 판정하는 판'});
 U.bind(el,()=>{api.reset(pos()[1]);if(pos()[3])pos()[3].split(' ').forEach(t=>api.playSan(t));});
};

/* 6장: 둔 수가 대수 기보로 어떻게 적히는지 본다. 판을 누르거나 기보를 입력해 둔다. */
function explain(t){
 if(!t)return '';
 if(t.startsWith('0-0-0'))return '0-0-0은 퀸 쪽(a 룩) 캐슬링입니다.';if(t.startsWith('0-0'))return '0-0은 킹 쪽(h 룩) 캐슬링입니다.';
 const parts=[];const piece=/^[KQRBN]/.test(t)?t[0]:'';parts.push(piece?`${piece}는 ${R.NAME[piece.toLowerCase()]}`:'기물 글자가 없으면 폰');
 const body=t.replace(/[+#]$/,''),m=body.match(/^([KQRBN])([a-h1-8]{1,2})?x?([a-h][1-8])/);if(m&&m[2])parts.push(`${m[2]}는 같은 칸으로 갈 수 있는 같은 기물 가운데 출발 칸을 가려 주는 표시`);
 if(t.includes('x'))parts.push('x는 잡기');const promo=body.match(/[a-h][18]([QRBN])$/);if(promo)parts.push(`끝의 ${promo[1]}는 승진한 기물`);
 if(t.endsWith('#'))parts.push('#는 체크메이트');else if(t.endsWith('+'))parts.push('+는 체크');
 return parts.join(', ')+'.';
}
L.notation=el=>{
 U.setup(el,U.select('no-pos','국면',opts(P.notation),'open')+U.sanInput('no-san'));
 let api;const pos=()=>P.notation[el.querySelector('#no-pos').value];
 const report=(s,info={})=>{if(!api)return;const last=api.sans.at(-1);
  el.querySelector('.readout').innerHTML=`${info.error?`<b>✗ ${U.esc(info.error)}${U.josa(info.error,'은','는')} 지금 국면의 합법 수가 아닙니다.</b><br>`:''}${pos()[2]}<br>기보: <b>${sanList(api.sans)}</b><br>${last?`마지막 수 ${last}: ${explain(last)}`:'판에서 기물을 누르거나 아래 칸에 기보를 써서 두어 보세요.'}<br>FEN: <code>${R.toFEN(s)}</code>${U.kind('real','FIDE 부록 C 표기(캐슬링 0-0, 승진 b8Q)를 씁니다.')}`;};
 api=U.play(el.querySelector('.chart'),{fen:pos()[1],onChange:report,label:'기보를 적는 판'});
 U.wireSan(el,'no-san',api,v=>report(api.state,{error:v}));
 U.bind(el,()=>{api.reset(pos()[1]);if(pos()[3])pos()[3].split(' ').forEach(t=>api.playSan(t));});
};
})();
