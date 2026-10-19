/* 체스 규칙 계산. DOM을 만지지 않으며 tests/chess.test.cjs가 수 생성(perft)·판정·기보를 검사한다.
   규칙의 근거는 FIDE Laws of Chess(2023-01-01 시행판) 3·5·9조와 부록 C이다(docs/research.html).
   칸 번호 i = 줄(0이 1줄) × 8 + 세로줄(0이 a). 기물은 흰색 대문자 PNBRQK, 검은색 소문자 pnbrqk, 빈 칸은 null. */
(function(root){
'use strict';
const FILES='abcdefgh',START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
/* 관례적인 기물 가치(폰 1점 기준). Shannon(1950)도 9·5·3·3·1을 쓴다. 규칙이 아니라 수를 고를 때 쓰는 어림이다. */
const VALUE={p:1,n:3,b:3,r:5,q:9,k:0};
const NAME={p:'폰',n:'나이트',b:'비숍',r:'룩',q:'퀸',k:'킹'};
const name=i=>FILES[i%8]+(Math.floor(i/8)+1);
const sq=s=>FILES.indexOf(s[0])+8*(Number(s[1])-1);
const colorOf=p=>p?(p===p.toUpperCase()?'w':'b'):null;
const other=c=>c==='w'?'b':'w';
const typeOf=p=>p?p.toLowerCase():null;
/* 칸 색: a1은 어두운 칸이고 h1은 밝은 칸이다(FIDE 2.1, 오른쪽 가까운 구석이 밝은 칸). */
const isLight=i=>(i%8+Math.floor(i/8))%2===1;
const KNIGHT=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const KING=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const ROOK_DIRS=[[1,0],[-1,0],[0,1],[0,-1]],BISHOP_DIRS=[[1,1],[1,-1],[-1,1],[-1,-1]];
const step=(i,df,dr)=>{const f=i%8+df,r=Math.floor(i/8)+dr;return f<0||f>7||r<0||r>7?-1:r*8+f;};

function parseFEN(fen=START){
 const [placement,turn='w',castle='-',ep='-',half='0',full='1']=fen.trim().split(/\s+/),board=Array(64).fill(null),rows=placement.split('/');
 if(rows.length!==8)throw new Error('FEN 줄 수가 8이 아닙니다');
 rows.forEach((row,k)=>{let f=0;for(const ch of row){if(/\d/.test(ch))f+=Number(ch);else{if(!/[pnbrqk]/i.test(ch)||f>7)throw new Error('FEN 기물 표기 오류');board[(7-k)*8+f]=ch;f++;}}if(f!==8)throw new Error('FEN 한 줄이 8칸이 아닙니다');});
 return {board,turn,castling:{K:castle.includes('K'),Q:castle.includes('Q'),k:castle.includes('k'),q:castle.includes('q')},ep:ep==='-'?-1:sq(ep),half:Number(half),full:Number(full)};
}
function placementOf(board){
 const rows=[];for(let r=7;r>=0;r--){let s='',e=0;for(let f=0;f<8;f++){const p=board[r*8+f];if(p){if(e)s+=e;e=0;s+=p;}else e++;}if(e)s+=e;rows.push(s);}return rows.join('/');
}
function castleText(c){return (c.K?'K':'')+(c.Q?'Q':'')+(c.k?'k':'')+(c.q?'q':'')||'-';}
function toFEN(s){return `${placementOf(s.board)} ${s.turn} ${castleText(s.castling)} ${s.ep<0?'-':name(s.ep)} ${s.half} ${s.full}`;}
/* 같은 국면인지 셀 때 쓰는 열쇠: 기물 배치·둘 차례·캐슬링 권리·앙파상 가능 칸(FIDE 9.2.3). 앙파상 칸은 실제로 잡을 수 있을 때만 넣는다. */
function positionKey(s){const ep=s.ep>=0&&legalMoves(s).some(m=>m.flag==='ep')?name(s.ep):'-';return `${placementOf(s.board)} ${s.turn} ${castleText(s.castling)} ${ep}`;}

/* color 쪽 기물이 칸 i를 공격하는가. 폰은 대각선 앞만 공격한다. */
function attackers(s,i,color){
 const out=[],b=s.board,own=p=>p&&colorOf(p)===color;
 const pr=color==='w'?-1:1;
 for(const df of [-1,1]){const j=step(i,df,pr);if(j>=0&&own(b[j])&&typeOf(b[j])==='p')out.push(j);}
 for(const [df,dr] of KNIGHT){const j=step(i,df,dr);if(j>=0&&own(b[j])&&typeOf(b[j])==='n')out.push(j);}
 for(const [df,dr] of KING){const j=step(i,df,dr);if(j>=0&&own(b[j])&&typeOf(b[j])==='k')out.push(j);}
 for(const [dirs,kinds] of [[ROOK_DIRS,'rq'],[BISHOP_DIRS,'bq']])for(const [df,dr] of dirs){let j=step(i,df,dr);while(j>=0){if(b[j]){if(own(b[j])&&kinds.includes(typeOf(b[j])))out.push(j);break;}j=step(j,df,dr);}}
 return out;
}
const attacked=(s,i,color)=>attackers(s,i,color).length>0;
const kingSquare=(s,color)=>s.board.indexOf(color==='w'?'K':'k');
function inCheck(s,color=s.turn){const k=kingSquare(s,color);return k>=0&&attacked(s,k,other(color));}

function pawnMoves(s,i,out){
 const b=s.board,c=colorOf(b[i]),dr=c==='w'?1:-1,startRank=c==='w'?1:6,lastRank=c==='w'?7:0,r=Math.floor(i/8);
 const add=(to,extra={})=>{if(Math.floor(to/8)===lastRank)for(const promo of 'qrbn')out.push({from:i,to,promo,...extra});else out.push({from:i,to,...extra});};
 const one=step(i,0,dr);
 if(one>=0&&!b[one]){add(one);const two=step(i,0,2*dr);if(r===startRank&&!b[two])out.push({from:i,to:two,flag:'double'});}
 for(const df of [-1,1]){const t=step(i,df,dr);if(t<0)continue;if(b[t]&&colorOf(b[t])!==c)add(t);else if(t===s.ep)out.push({from:i,to:t,flag:'ep'});}
}
/* 캐슬링 다섯 조건(FIDE 3.8.2): 킹·룩이 움직인 적 없음(권리), 사이 칸이 빔, 킹이 체크가 아님, 지나는 칸과 도착 칸이 공격받지 않음. */
function castlingCheck(s,color,side){
 const home=color==='w'?4:60,rook=side==='K'?home+3:home-4,key=color==='w'?side:side.toLowerCase(),enemy=other(color);
 const between=side==='K'?[home+1,home+2]:[home-1,home-2,home-3],path=side==='K'?[home+1,home+2]:[home-1,home-2];
 const rights=s.castling[key]&&s.board[home]===(color==='w'?'K':'k')&&s.board[rook]===(color==='w'?'R':'r');
 const checks={rights,empty:between.every(j=>!s.board[j]),notInCheck:!attacked(s,home,enemy),passSafe:!attacked(s,path[0],enemy),landSafe:!attacked(s,path[1],enemy)};
 return {...checks,ok:Object.values(checks).every(Boolean),king:home,to:path[1],rookFrom:rook,rookTo:path[0]};
}
function pieceMoves(s,i,out){
 const b=s.board,p=b[i],c=colorOf(p),t=typeOf(p);
 if(t==='p')return pawnMoves(s,i,out);
 const target=j=>!b[j]||colorOf(b[j])!==c;
 if(t==='n'||t==='k'){for(const [df,dr] of t==='n'?KNIGHT:KING){const j=step(i,df,dr);if(j>=0&&target(j))out.push({from:i,to:j});}}
 else{const dirs=t==='r'?ROOK_DIRS:t==='b'?BISHOP_DIRS:ROOK_DIRS.concat(BISHOP_DIRS);for(const [df,dr] of dirs){let j=step(i,df,dr);while(j>=0){if(b[j]){if(colorOf(b[j])!==c)out.push({from:i,to:j});break;}out.push({from:i,to:j});j=step(j,df,dr);}}}
 if(t==='k')for(const side of ['K','Q']){const k=castlingCheck(s,c,side);if(k.ok&&k.king===i)out.push({from:i,to:k.to,flag:'castle'+side});}
}
/* 규칙이 허락하는 움직임 전부. 킹을 공격받게 두는 수도 아직 들어 있다(의사 합법 수). */
function pseudoMoves(s,from=null){const out=[];for(let i=0;i<64;i++){if(from!==null&&i!==from)continue;if(s.board[i]&&colorOf(s.board[i])===s.turn)pieceMoves(s,i,out);}return out;}

function makeMove(s,m){
 const b=s.board.slice(),p=b[m.from],c=colorOf(p),t=typeOf(p),captured=m.flag==='ep'?b[m.to+(c==='w'?-8:8)]:b[m.to],castling={...s.castling};
 b[m.to]=m.promo?(c==='w'?m.promo.toUpperCase():m.promo):p;b[m.from]=null;
 if(m.flag==='ep')b[m.to+(c==='w'?-8:8)]=null;
 if(m.flag&&m.flag.startsWith('castle')){const k=castlingCheck(s,c,m.flag.slice(6));b[k.rookTo]=b[k.rookFrom];b[k.rookFrom]=null;}
 if(t==='k'){if(c==='w')castling.K=castling.Q=false;else castling.k=castling.q=false;}
 for(const [corner,key] of [[0,'Q'],[7,'K'],[56,'q'],[63,'k']])if(m.from===corner||m.to===corner)castling[key]=false;
 return {board:b,turn:other(c),castling,ep:m.flag==='double'?(m.from+m.to)/2:-1,half:t==='p'||captured?0:s.half+1,full:s.full+(c==='b'?1:0)};
}
/* 합법 수: 둔 뒤에 자기 킹이 공격받지 않는 수(FIDE 3.9·3.10). */
function legalMoves(s,from=null){return pseudoMoves(s,from).filter(m=>!inCheck(makeMove(s,m),s.turn));}
/* 남은 기물로는 어떤 수순으로도 외통을 만들 수 없는 경우 가운데 흔한 넷: 킹만, 킹+비숍 하나, 킹+나이트 하나, 같은 색 칸 비숍끼리. */
function insufficient(s){
 const rest=[];s.board.forEach((p,i)=>{if(p&&typeOf(p)!=='k')rest.push([typeOf(p),i]);});
 if(rest.length===0)return true;
 if(rest.length===1&&'bn'.includes(rest[0][0]))return true;
 return rest.every(([t])=>t==='b')&&new Set(rest.map(([,i])=>isLight(i))).size===1;
}
/* 국면 판정. history는 지금까지 나온 국면 열쇠 목록(지금 국면 포함)이다. */
function status(s,history=[]){
 const moves=legalMoves(s),check=inCheck(s),key=positionKey(s),repeats=history.filter(k=>k===key).length||1;
 let result='ongoing',reason='';
 if(!moves.length){result=check?'checkmate':'stalemate';reason=check?'둘 차례인 쪽이 체크를 받았고 합법 수가 없습니다':'둘 차례인 쪽이 체크가 아닌데 합법 수가 없습니다';}
 else if(insufficient(s)){result='dead';reason='남은 기물로는 어떤 수순으로도 체크메이트를 만들 수 없습니다';}
 else if(repeats>=5){result='fivefold';reason='같은 국면이 다섯 번 나와 게임이 저절로 무승부가 됩니다';}
 else if(s.half>=150){result='seventyfive';reason='양쪽이 75수씩 폰을 움직이지 않고 잡지도 않아 게임이 저절로 무승부가 됩니다';}
 return {result,reason,check,moves:moves.length,repeats,claimRepetition:repeats>=3,claimFifty:s.half>=100};
}

/* 대수 기보(FIDE 부록 C). 같은 칸으로 갈 수 있는 같은 종류 기물이 둘 이상이면 출발 세로줄, 그래도 같으면 출발 줄을 붙인다. 캐슬링은 FIDE 표기 0-0·0-0-0을 쓴다. */
function san(s,m){
 let text;const p=s.board[m.from],t=typeOf(p),capture=!!s.board[m.to]||m.flag==='ep';
 if(m.flag==='castleK')text='0-0';else if(m.flag==='castleQ')text='0-0-0';
 else if(t==='p')text=(capture?FILES[m.from%8]+'x':'')+name(m.to)+(m.promo?m.promo.toUpperCase():'');
 else{
  const rivals=legalMoves(s).filter(o=>o.to===m.to&&o.from!==m.from&&s.board[o.from]===p);let dis='';
  if(rivals.length){const sameFile=rivals.some(o=>o.from%8===m.from%8),sameRank=rivals.some(o=>Math.floor(o.from/8)===Math.floor(m.from/8));dis=!sameFile?FILES[m.from%8]:!sameRank?String(Math.floor(m.from/8)+1):name(m.from);}
  text=t.toUpperCase()+dis+(capture?'x':'')+name(m.to);
 }
 const next=makeMove(s,m);if(inCheck(next))text+=legalMoves(next).length?'+':'#';
 return text;
}
/* 기보 한 수를 합법 수로 바꾼다. O-O·0-0, =Q와 Q, 붙임표·체크 기호 유무를 모두 받는다. 못 찾으면 null. */
function parseSan(s,text){
 const clean=t=>t.replace(/[+#!?]/g,'').replace(/O/g,'0').replace(/=/,'').trim();
 const want=clean(text);if(!want)return null;
 return legalMoves(s).find(m=>clean(san(s,m))===want||clean(san(s,m)).replace('x','')===want.replace('x',''))||null;
}
/* 기보 문자열(예: "1. e4 e5 2. Nf3")을 차례로 두어 국면 목록과 수 목록을 만든다. 틀린 수에서 멈추고 그 위치를 알린다. */
function playLine(text,fen=START){
 let s=parseFEN(fen);const states=[s],moves=[];
 for(const token of text.replace(/\d+\.(\.\.)?/g,' ').split(/\s+/).filter(Boolean)){const m=parseSan(s,token);if(!m)return {states,moves,error:token};moves.push({...m,san:san(s,m)});s=makeMove(s,m);states.push(s);}
 return {states,moves,error:null};
}
/* 수 생성 검사(perft): 깊이 d까지 둘 수 있는 수순의 수. 시작 국면 20·400·8,902·197,281(Chess Programming Wiki). */
function perft(s,d){if(d===0)return 1;const ms=legalMoves(s);if(d===1)return ms.length;let n=0;for(const m of ms)n+=perft(makeMove(s,m),d-1);return n;}

function material(s){const sum={w:0,b:0};s.board.forEach(p=>{if(p)sum[colorOf(p)]+=VALUE[typeOf(p)];});return sum;}
/* 평가 함수: 둘 차례 쪽에서 본 기물 점수 차. 외통은 ±1000에서 깊이만큼 덜어 더 빠른 외통을 고르게 한다. */
const MATE=1000;
function evaluate(s){const m=material(s);return s.turn==='w'?m.w-m.b:m.b-m.w;}
const order=(s,ms)=>ms.map(m=>({m,g:s.board[m.to]?VALUE[typeOf(s.board[m.to])]*10-VALUE[typeOf(s.board[m.from])]:m.promo?8:0})).sort((a,b)=>b.g-a.g).map(x=>x.m);
/* 미니맥스(네가맥스 꼴): 내 점수 = −(상대가 고른 최선의 점수). 모든 가지를 끝까지 센다. */
function minimax(s,d,ply=0,counter={nodes:0}){
 counter.nodes++;const ms=legalMoves(s);
 if(!ms.length)return {score:inCheck(s)?-(MATE-ply):0,best:null,nodes:counter.nodes};
 if(d===0)return {score:evaluate(s),best:null,nodes:counter.nodes};
 let best=null,score=-Infinity;for(const m of ms){const v=-minimax(makeMove(s,m),d-1,ply+1,counter).score;if(v>score){score=v;best=m;}}
 return {score,best,nodes:counter.nodes};
}
/* 알파베타: 미니맥스와 같은 값을 내되, 이미 찾은 수보다 나빠질 것이 확실한 가지는 더 보지 않는다(Knuth·Moore 1975). sorted면 잡는 수를 먼저 본다. */
function alphabeta(s,d,alpha=-Infinity,beta=Infinity,ply=0,counter={nodes:0},sorted=false){
 counter.nodes++;let ms=legalMoves(s);
 if(!ms.length)return {score:inCheck(s)?-(MATE-ply):0,best:null,nodes:counter.nodes};
 if(d===0)return {score:evaluate(s),best:null,nodes:counter.nodes};
 if(sorted)ms=order(s,ms);
 let best=null,score=-Infinity;
 for(const m of ms){const v=-alphabeta(makeMove(s,m),d-1,-beta,-alpha,ply+1,counter,sorted).score;if(v>score){score=v;best=m;}if(v>alpha)alpha=v;if(alpha>=beta)break;}
 return {score,best,nodes:counter.nodes};
}
/* 잡는 수만 끝까지 이어 보는 정지 탐색. 깊이 끝에서 "막 잡고 끝난" 국면을 그대로 평가하는 수평선 문제를 줄인다. 가만히 있는 값(stand pat)보다 나빠지는 잡기는 하지 않는다고 본다. */
function quiesce(s,alpha,beta,ply,counter){
 counter.nodes++;const ms=legalMoves(s);
 if(!ms.length)return inCheck(s)?-(MATE-ply):0;
 const stand=evaluate(s);if(stand>=beta)return stand;if(stand>alpha)alpha=stand;
 for(const m of order(s,ms.filter(m=>s.board[m.to]||m.flag==='ep'||m.promo))){const v=-quiesce(makeMove(s,m),-beta,-alpha,ply+1,counter);if(v>=beta)return v;if(v>alpha)alpha=v;}
 return alpha;
}
/* 복기용 탐색: 알파베타 + 잡는 수 먼저 + 끝에서 정지 탐색. 돌려주는 점수는 둘 차례 쪽에서 본 기물 점수 차다. */
function search(s,d,alpha=-Infinity,beta=Infinity,ply=0,counter={nodes:0}){
 counter.nodes++;const ms=legalMoves(s);
 if(!ms.length)return {score:inCheck(s)?-(MATE-ply):0,best:null,nodes:counter.nodes};
 if(d===0)return {score:quiesce(s,alpha,beta,ply,counter),best:null,nodes:counter.nodes};
 let best=null,score=-Infinity;
 for(const m of order(s,ms)){const v=-search(makeMove(s,m),d-1,-beta,-alpha,ply+1,counter).score;if(v>score){score=v;best=m;}if(v>alpha)alpha=v;if(alpha>=beta)break;}
 return {score,best,nodes:counter.nodes};
}
/* 한 칸을 두고 서로 잡아 들어갈 때(교환), 양쪽이 가장 싼 기물부터 잡고 손해가 나면 언제든 멈춘다고 보는 계산. 핀·체크는 합법 수로 걸러진다.
   돌려주는 gain은 처음 잡는 쪽이 얻는 점수, steps는 실제로 이어지는 잡기 순서. */
function exchange(s,target){
 const seq=[];let cur=s;
 for(;;){const caps=legalMoves(cur).filter(m=>m.to===target&&cur.board[target]);if(!caps.length)break;caps.sort((a,b)=>VALUE[typeOf(cur.board[a.from])]-VALUE[typeOf(cur.board[b.from])]||(typeOf(cur.board[a.from])==='k')-(typeOf(cur.board[b.from])==='k'));
  const m=caps[0];seq.push({san:san(cur,m),gain:VALUE[typeOf(cur.board[target])],by:typeOf(cur.board[m.from])});cur=makeMove(cur,m);if(seq.length>32)break;}
 /* 뒤에서부터: k번째 잡기의 몫 = 잡은 기물 값 − 이어지는 교환의 몫. 손해(0 이하)면 그 잡기를 하지 않는다. 첫 잡기는 시작할지 묻는 수라 그대로 센다. */
 const net=Array(seq.length+1).fill(0);for(let k=seq.length-1;k>=1;k--)net[k]=Math.max(0,seq[k].gain-net[k+1]);
 const gain=seq.length?seq[0].gain-net[1]:0;let stop=seq.length;for(let k=1;k<seq.length;k++)if(seq[k].gain-net[k+1]<=0){stop=k;break;}
 return {steps:seq,gain,worth:gain>0,played:seq.slice(0,stop)};
}
/* 오프닝 원칙을 세는 도구: 가운데 네 칸(d4·e4·d5·e5)을 차지하거나 공격하는 수, 처음 자리를 떠난 나이트·비숍 수, 캐슬링 여부. */
const CENTER=['d4','e4','d5','e5'].map(sq);
function principles(s,color){
 const occupied=CENTER.filter(i=>s.board[i]&&colorOf(s.board[i])===color).length,hits=CENTER.reduce((n,i)=>n+attackers(s,i,color).length,0);
 const homes=color==='w'?{b1:'N',g1:'N',c1:'B',f1:'B'}:{b8:'n',g8:'n',c8:'b',f8:'b'};
 const developed=Object.entries(homes).filter(([q,p])=>s.board[sq(q)]!==p).length;
 const k=kingSquare(s,color),castled=color==='w'?[6,2].includes(k)&&!s.castling.K&&!s.castling.Q:[62,58].includes(k)&&!s.castling.k&&!s.castling.q;
 return {occupied,hits,developed,castled};
}
/* 보기 순서: 정답 원래 번호 answer를 target 자리에 오게 돌린다(서재 공통). */
function choiceOrder(n,answer,target){const o=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return o.slice(k).concat(o.slice(0,k));}
const api={START,VALUE,NAME,FILES,name,sq,colorOf,typeOf,other,isLight,parseFEN,toFEN,positionKey,attackers,attacked,inCheck,kingSquare,castlingCheck,pseudoMoves,legalMoves,makeMove,insufficient,status,san,parseSan,playLine,perft,material,evaluate,MATE,minimax,alphabeta,quiesce,search,exchange,principles,choiceOrder};
if(typeof module!=='undefined')module.exports=api;else root.CRules=api;
})(this);
