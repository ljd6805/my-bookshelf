/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 국면과 숫자는 CRules(js/chess.js)로 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션(fig-dash·fig-pkt·fig-seq·fig-grow·fig-up·fig-pulse)이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   11장의 게임 트리 잎 점수는 설명을 위해 정해 둔 예시다. */
(function(root){
'use strict';
const R=root.CRules,U=root.CUI,P=root.CPos;
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||14}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}${o.mono?' font-family="var(--font-mono)"':''}>${s}</text>`;
const box=(x,y,w,h,stroke='var(--line)',fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash',w=2)=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
const head=(x,y,ang,stroke)=>{const a=ang*Math.PI/180,p=(d,s)=>`${(x-9*Math.cos(a+s)).toFixed(1)} ${(y-9*Math.sin(a+s)).toFixed(1)}`;return `<path d="M${p(0,.45)}L${x} ${y}L${p(0,-.45)}" fill="none" stroke="${stroke}" stroke-width="2.4"/>`;};
const arrow=(x1,y1,x2,y2,stroke='var(--orange)',cls='fig-dash')=>line(`M${x1} ${y1}L${x2} ${y2}`,stroke,cls,2.4)+head(x2,y2,Math.atan2(y2-y1,x2-x1)*180/Math.PI,stroke);
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const seq=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="2" fill="${color}"/>`;
const note=(s,y)=>t(320,y,s,{size:12,fill:'var(--muted)'});
/* 기물 그림을 바깥 svg 안의 <g>로 옮겨 그린다(안쪽 svg를 두면 공통 .figure-art svg 규칙이 크기를 바꾼다). */
const piece=(p,x,y,size)=>{const g=U.glyph(p),cls=g.match(/class="([^"]+)"/)[1],inner=g.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');return `<g class="${cls}" transform="translate(${x} ${y}) scale(${(size/45).toFixed(3)})">${inner}</g>`;};
/* 판 일부를 그린다. squares: 그릴 칸(세로줄 f0~f1, 가로줄 r0~r1), s: 국면, at: 왼쪽 위 좌표와 칸 크기. 칸 번호에서 화면 좌표를 돌려주는 함수 xy도 함께 돌려준다. */
function grid(s,{x=20,y=20,size=26,f0=0,f1=7,r0=0,r1=7,labels=true}={}){
 const out=[],xy=i=>[x+(i%8-f0)*size+size/2,y+(r1-Math.floor(i/8))*size+size/2];
 for(let r=r1;r>=r0;r--)for(let f=f0;f<=f1;f++){const i=r*8+f,X=x+(f-f0)*size,Y=y+(r1-r)*size;out.push(`<rect class="${R.isLight(i)?'fig-lt':'fig-dk'}" x="${X}" y="${Y}" width="${size}" height="${size}"/>`);if(s&&s.board[i])out.push(piece(s.board[i],X+1,Y+1,size-2));}
 if(labels){for(let f=f0;f<=f1;f++)out.push(t(x+(f-f0)*size+size/2,y+(r1-r0+1)*size+14,R.FILES[f],{size:11,fill:'var(--muted)',mono:1}));for(let r=r0;r<=r1;r++)out.push(t(x-8,y+(r1-r)*size+size/2+4,r+1,{size:11,fill:'var(--muted)',mono:1}));}
 return {body:out.join(''),xy};
}
const F={};
F.board=()=>{const g=grid(R.parseFEN(R.START),{x:40,y:16,size:26});const [ex,ey]=g.xy(R.sq('e4')),[ax,ay]=g.xy(R.sq('a1')),[hx,hy]=g.xy(R.sq('h1'));
 return {svg:svg('처음 배치의 체스판. 흰 기물은 1·2 가로줄, 검은 기물은 7·8 가로줄에 서고, 흰색 쪽에서 볼 때 오른쪽 아래 h1이 밝은 칸입니다. e4는 e 세로줄과 4 가로줄이 만나는 칸입니다.',g.body+pulse(ex,ey,12,'var(--orange)')+pulse(hx,hy,12,'var(--accent)')+line(`M${ex} 16V${ey-13}`,'var(--orange)')+line(`M40 ${ey}H${ex-13}`,'var(--orange)')
  +t(300,40,'칸 이름 = 세로줄 글자(a~h) + 가로줄 숫자(1~8)',{a:'start',w:700})+t(300,72,`e4: e 세로줄과 4 가로줄이 만나는 칸`,{a:'start',fill:'var(--orange)'})+t(300,104,'h1: 흰색 오른쪽 아래, 밝은 칸',{a:'start',fill:'var(--accent)'})+t(300,136,'a1: 흰색 왼쪽 아래, 어두운 칸',{a:'start'})+t(300,168,'흰 퀸은 d1(밝은 칸), 검은 퀸은 d8(어두운 칸)',{a:'start'})+t(300,200,'퀸은 자기 색 칸에서 시작합니다',{a:'start',fill:'var(--muted)',size:13}),250),caption:'처음 배치와 칸 이름 읽기. 세로줄 글자와 가로줄 숫자를 합쳐 칸 이름을 만듭니다.'};};
F.moves=()=>{const s=R.parseFEN('8/8/8/8/3N4/8/8/8 w - - 0 1'),g=grid(s,{x:40,y:16,size:26}),ms=R.pseudoMoves(s).filter(m=>m.from===R.sq('d4'));const [cx,cy]=g.xy(R.sq('d4'));
 const s2=R.parseFEN('8/8/8/8/8/8/8/N7 w - - 0 1'),g2=grid(s2,{x:340,y:16,size:26}),m2=R.pseudoMoves(s2).filter(m=>m.from===0);const [ax,ay]=g2.xy(0);
 const marks=(gg,list,ox,oy)=>list.map((m,k)=>{const [x,y]=gg.xy(m.to);return seq(`<circle cx="${x}" cy="${y}" r="7" fill="var(--orange)"/>`,k*.25)+line(`M${ox} ${oy}L${x} ${y}`,'var(--orange)','fig-dash',1.4);}).join('');
 return {svg:svg(`나이트가 d4에서 닿는 칸 ${ms.length}개와 a1 구석에서 닿는 칸 ${m2.length}개. 가운데 나이트가 더 많은 칸에 닿습니다.`,g.body+marks(g,ms,cx,cy)+g2.body+marks(g2,m2,ax,ay)+t(144,250,`d4 나이트: ${ms.length}칸`,{w:700})+t(444,250,`a1 나이트: ${m2.length}칸`,{w:700}),262),caption:`같은 나이트라도 d4에서는 ${ms.length}칸, 구석 a1에서는 ${m2.length}칸에 닿습니다(빈 판에서 규칙대로 센 값).`};};
F.special=()=>{
 const ep=grid(R.parseFEN(P.special.ep[1]),{x:20,y:34,size:24,f0:2,f1:6,r0:3,r1:7,labels:false}),pr=grid(R.parseFEN(P.special.promo[1]),{x:236,y:34,size:24,f0:0,f1:3,r0:4,r1:7,labels:false}),ca=grid(R.parseFEN('4k3/8/8/8/8/8/8/4K2R w K - 0 1'),{x:430,y:34,size:24,f0:3,f1:7,r0:0,r1:1,labels:false});
 const [e5x,e5y]=ep.xy(R.sq('e5')),[d6x,d6y]=ep.xy(R.sq('d6')),[d5x,d5y]=ep.xy(R.sq('d5'));
 const [b7x,b7y]=pr.xy(R.sq('b7')),[b8x,b8y]=pr.xy(R.sq('b8'));
 const [kx,ky]=ca.xy(R.sq('e1')),[gx,gy]=ca.xy(R.sq('g1')),[hx,hy]=ca.xy(R.sq('h1')),[fx,fy]=ca.xy(R.sq('f1'));
 return {svg:svg('특수한 수 세 가지. 앙파상은 두 칸 나온 폰을 바로 다음 수에 지나간 칸에서 잡고, 승진은 마지막 가로줄에 닿은 폰을 다른 기물로 바꾸며, 캐슬링은 킹이 두 칸 옮기고 룩이 킹을 넘어 옆에 섭니다.',
  ep.body+arrow(e5x,e5y,d6x+6,d6y+6)+`<g class="fig-seq"><line x1="${d5x-8}" y1="${d5y-8}" x2="${d5x+8}" y2="${d5y+8}" stroke="#b3361f" stroke-width="3"/><line x1="${d5x+8}" y1="${d5y-8}" x2="${d5x-8}" y2="${d5y+8}" stroke="#b3361f" stroke-width="3"/></g>`+t(80,24,'앙파상 exd6',{w:700})+t(80,180,'d5 폰을 d6에서 잡음',{size:12,fill:'var(--muted)'})
  +pr.body+arrow(b7x,b7y,b8x,b8y+10)+seq(piece('Q',b8x-11,b8y-11,22),.4)+t(284,24,'승진 b8Q',{w:700})+t(284,180,'퀸·룩·비숍·나이트 중 고름',{size:12,fill:'var(--muted)'})
  +ca.body+arrow(kx,ky-14,gx,gy-14)+arrow(hx,hy+16,fx,fy+16,'var(--accent)')+t(490,24,'캐슬링 0-0',{w:700})+t(490,116,'킹 e1→g1, 룩 h1→f1',{size:12,fill:'var(--muted)'})+t(490,140,'조건 다섯 개를 모두 만족할 때',{size:12,fill:'var(--muted)'})
  +note('세 수 모두 FIDE 규칙 3.7과 3.8.2에 조건이 적혀 있습니다.',230),250),caption:'앙파상·승진·캐슬링을 판 조각 세 개에 나란히 그린 그림. 캐슬링 다섯 조건은 실험의 조건 표에서 하나씩 확인합니다.'};};
F.check=()=>{const s=R.parseFEN(P.legal.pin[1]),pseudo=R.pseudoMoves(s).length,legal=R.legalMoves(s).length;
 const st=[['규칙상 움직임',`${pseudo}개`,'기물마다 움직이는 방식대로'],['수를 두어 본 국면','킹이 공격받나?','상대 기물 공격 확인'],['합법 수',`${legal}개`,'킹이 안전한 수만']];
 return {svg:svg(`핀 국면의 규칙상 움직임 ${pseudo}개에서 둔 뒤 흰 킹이 공격받는 수를 빼면 합법 수 ${legal}개가 남습니다.`,st.map(([a,b,c],k)=>box(30+k*205,60,170,110,k===2?'var(--accent)':'var(--line)')+t(115+k*205,92,a,{w:700})+t(115+k*205,124,b,{size:18,fill:k===2?'var(--accent)':'var(--orange)',w:700})+t(115+k*205,152,c,{size:12,fill:'var(--muted)'})).join('')
  +arrow(202,115,233,115)+arrow(407,115,438,115)+dot(205,115,26,0,'var(--orange)')+dot(410,115,26,0,'var(--orange)',.8)+t(320,210,`빠진 ${pseudo-legal}개: c3 나이트가 비키면 b4 비숍이 e1 킹을 공격하는 수`,{fill:'var(--orange)'})+note('핀 국면(흰색 차례)을 규칙 엔진으로 센 값입니다.',240),260),caption:`규칙상 움직임 ${pseudo}개에서 킹이 공격받게 되는 수를 걸러 합법 수 ${legal}개를 얻는 과정.`};};
F.ending=()=>{const n=[[320,40,'합법 수가 0개인가?'],[160,120,'킹이 체크받는가?'],[480,120,'다른 무승부 조건'],[80,200,'체크메이트'],[240,200,'스테일메이트(무승부)'],[480,200,'기물 부족·반복·50수']];
 return {svg:svg('게임이 끝나는 조건의 판정 순서. 합법 수가 없을 때 체크를 받고 있으면 체크메이트, 아니면 스테일메이트이고, 합법 수가 있어도 기물 부족·국면 반복·50수 규칙으로 무승부가 될 수 있습니다.',
  n.map(([x,y,s],k)=>box(x-78,y-18,156,36,k===3?'var(--orange)':k===4?'var(--accent)':'var(--line)')+t(x,y+5,s,{size:13,w:k>2?700:400})).join('')
  +arrow(290,58,190,102)+arrow(350,58,450,102)+arrow(140,138,90,182)+arrow(180,138,230,182)+arrow(480,138,480,182)+t(220,82,'예',{size:12,fill:'var(--muted)'})+t(420,82,'아니요',{size:12,fill:'var(--muted)'})+t(100,164,'예',{size:12,fill:'var(--muted)'})+t(222,164,'아니요',{size:12,fill:'var(--muted)'})
  +dot(320,58,-130,124,'var(--orange)')+dot(320,58,-80,124,'var(--accent)',1.2)+note('같은 국면 세 번과 50수는 청구할 수 있고, 다섯 번과 75수는 저절로 무승부입니다(FIDE 9.2·9.3·9.6).',248),262),caption:'합법 수와 체크 여부로 결과를 판정하는 순서. 같은 국면 반복과 50수 규칙은 무승부를 요구할 수 있는 조건과 저절로 무승부가 되는 조건으로 나뉩니다.'};};
F.notation=()=>{const parts=[['N','기물: 나이트','(폰은 글자를 쓰지 않음)'],['b','출발 세로줄','두 나이트가 같은 칸에 갈 때만'],['d2','도착 칸','칸 이름 그대로']];
 return {svg:svg('기보 Nbd2를 기물 글자 N, 출발 세로줄 b, 도착 칸 d2로 나눈 그림.',t(320,60,'N b d2',{size:40,w:700,mono:1})+parts.map(([a,b,c],k)=>{const x=110+k*210;return seq(box(x-90,120,180,82,'var(--accent)')+t(x,150,`${a} = ${b}`,{w:700})+t(x,178,c,{size:12,fill:'var(--muted)'}),k*.6)+arrow([280,312,352][k],72,x,116,'var(--accent)');}).join('')
  +note('잡기는 x, 체크는 +, 체크메이트는 #, 승진은 b8Q처럼 바뀐 기물 글자를 붙입니다.',236),250),caption:'기보 한 수를 기물·출발 세로줄·도착 칸으로 나눠 읽기.'};};
F.value=()=>{const v=[['폰','P',1],['나이트','N',3],['비숍','B',3],['룩','R',5],['퀸','Q',9]];
 const bars=v.map(([n,p,x],k)=>{const X=50+k*62,H=x*16;return up(X,190-H,38,H,k===4?'var(--orange)':'var(--accent)',k*.15)+piece(p,X+3,196,32)+t(X+19,184-H,x,{w:700,mono:1})+t(X+19,246,n,{size:12})}).join('');
 return {svg:svg('입문서가 쓰는 기물 가치 폰 1, 나이트 3, 비숍 3, 룩 5, 퀸 9와, 폰 하나를 얻으려 룩을 내준 교환이 4점 손해라는 계산.',bars+box(380,40,240,170,'var(--line)')+t(500,70,'지켜진 폰을 룩으로 잡으면',{w:700})+t(500,104,'Rxd5 : 폰 +1',{mono:1})+t(500,132,'exd5 : 룩 −5',{mono:1})+line('M410 146H590','var(--line)','')+t(500,174,'합계 −4점',{size:18,fill:'var(--orange)',w:700})+t(500,198,'킹은 잡히지 않으므로 점수 없음',{size:12,fill:'var(--muted)'}),262),caption:'기물 가치 1·3·3·5·9와 교환 득실 계산. 가치는 규칙이 아니라 입문서가 쓰는 관례입니다.'};};
F.opening=()=>{const rows=Object.entries(P.opening).map(([k,[name,line]])=>{const run=R.playLine(line),s=run.states[8],w=R.principles(s,'w');return [name,w];});
 const top=4;
 return {svg:svg('세 오프닝 기보를 8반수 둔 뒤 흰색의 나온 나이트·비숍 수와 가운데 네 칸 공격 수, 캐슬링 여부.',rows.map(([n,p],k)=>{const y=40+k*64;return t(20,y+12,n,{a:'start',size:13,w:700})+t(20,y+34,`전개 ${p.developed} · 가운데 공격 ${p.hits} · 캐슬링 ${p.castled?'함':'안 함'}`,{a:'start',size:12,fill:'var(--muted)'})+`<rect x="330" y="${y}" width="${top*60}" height="14" rx="3" fill="var(--panel2)"/>`+`<rect class="fig-grow" style="animation-delay:${k*.2}s" x="330" y="${y}" width="${Math.max(p.developed*60,2)}" height="14" rx="3" fill="var(--accent)"/>`+`<rect x="330" y="${y+20}" width="${top*60}" height="14" rx="3" fill="var(--panel2)"/>`+`<rect class="fig-grow" style="animation-delay:${k*.2+.1}s" x="330" y="${y+20}" width="${Math.max(Math.min(p.hits,top)*60,2)}" height="14" rx="3" fill="var(--blue)"/>`;}).join('')
  +t(330,230,'초록: 나온 나이트·비숍(4개 중)  파랑: 가운데 공격 수',{a:'start',size:12,fill:'var(--muted)'}),250),caption:'세 오프닝을 같은 반수까지 두고 흰색의 원칙 숫자를 견준 그림. 숫자는 규칙 엔진으로 세었습니다.'};};
F.tactics=()=>{const [,fen,ans]=P.tactics.fork,s=R.parseFEN(fen),n=R.makeMove(s,R.parseSan(s,ans)),g=grid(n,{x:40,y:16,size:26});const [nx,ny]=g.xy(R.sq('c7')),[kx,ky]=g.xy(R.sq('e8')),[rx,ry]=g.xy(R.sq('a8'));
 return {svg:svg('나이트 포크. 흰 나이트가 c7로 가 e8의 검은 킹을 체크하면서 a8의 룩도 공격합니다. 킹이 피한 뒤 나이트가 룩을 잡습니다.',g.body+arrow(nx,ny,kx-6,ky+6)+arrow(nx,ny,rx+6,ry+6)+pulse(kx,ky,13,'#b3361f')+pulse(rx,ry,13,'var(--orange)')
  +t(300,50,'포크: 한 기물이 두 목표를 동시에 공격',{a:'start',w:700})+t(300,84,`${ans}: 킹을 체크하고 a8 룩을 공격`,{a:'start'})+t(300,116,'킹이 먼저 피해야 하므로',{a:'start'})+t(300,140,'다음 수에 룩(5점)을 잡습니다',{a:'start',fill:'var(--orange)',w:700})+t(300,184,'핀·꼬치·발견 공격도 "두 목표"를',{a:'start',size:13,fill:'var(--muted)'})+t(300,204,'한 줄이나 한 수로 겨눕니다',{a:'start',size:13,fill:'var(--muted)'}),250),caption:'9장 포크 퍼즐의 정답 Nc7+ 뒤 국면. 두 목표 가운데 하나가 킹이라 상대는 둘을 모두 지킬 수 없습니다.'};};
F.mates=()=>{const [,fen,,ans]=P.mates.back,s=R.parseFEN(fen),n=R.makeMove(s,R.parseSan(s,ans)),g=grid(n,{x:40,y:16,size:26});const st=R.status(n),[kx,ky]=g.xy(R.sq('g8'));
 const esc=[R.sq('f7'),R.sq('g7'),R.sq('h7'),R.sq('f8'),R.sq('h8')].map((i,k)=>{const [x,y]=g.xy(i);return seq(`<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#b3361f" stroke-width="2.4"/>`,k*.2);}).join('');
 return {svg:svg('마지막 줄 체크메이트 Ra8#. 검은 킹 g8은 룩에게 체크받고, f7·g7·h7은 자기 폰이 막고 f8·h8은 룩이 공격해 갈 칸이 없습니다.',g.body+esc+pulse(kx,ky,13,'var(--orange)')+line(`M${g.xy(R.sq('a8'))[0]} ${ky}H${kx-14}`,'var(--orange)','fig-dash',3)
  +t(300,50,`${ans}: 체크 + 합법 수 ${R.legalMoves(n).length}개`,{a:'start',w:700})+t(300,84,`판정: ${st.result==='checkmate'?'체크메이트':st.result}`,{a:'start',fill:'var(--orange)',w:700})+t(300,124,'킹 주변 다섯 칸이 모두 막힘',{a:'start'})+t(300,150,'f7·g7·h7: 자기 폰',{a:'start',size:13,fill:'var(--muted)'})+t(300,172,'f8·h8: 룩이 8번 가로줄 전체를 공격',{a:'start',size:13,fill:'var(--muted)'}),250),caption:'마지막 줄 체크메이트. 체크와 "갈 칸 없음, 막을 기물 없음, 잡을 기물 없음"이 함께 성립합니다.'};};
F.engine=()=>{
 /* 깊이 2 트리: 흰 수 A·B·C, 각 수 뒤 검은 대답 두 개. 잎은 흰색 기준 점수(예시). */
 const leaves=[[3,5],[1,8],[-4,2]],mins=leaves.map(l=>Math.min(...l)),best=Math.max(...mins);
 const root=[320,40],mid=[140,320,500].map(x=>[x,120]),leafXY=[[90,200],[190,200],[270,200],[370,200],[450,200],[550,200]];
 let body=box(root[0]-46,root[1]-18,92,36,'var(--accent)')+t(root[0],root[1]+5,`흰색 최대 ${best}`,{size:13,w:700});
 mid.forEach(([x,y],k)=>{body+=arrow(root[0],root[1]+18,x,y-20,'var(--muted)')+box(x-50,y-18,100,36,k===0?'var(--accent)':'var(--line)')+t(x,y+5,`수 ${'ABC'[k]}: 검은 최소 ${k?'≤ '+U.sign(leaves[k][0]).replace('+',''):mins[k]}`,{size:12});
  leaves[k].forEach((v,j)=>{const [lx,ly]=leafXY[k*2+j],isCut=k>0&&j===1;
   body+=`<g${isCut?' opacity=".35"':''}>`+line(`M${x} ${y+18}L${lx} ${ly-16}`,'var(--muted)',isCut?'':'fig-dash')+`<circle cx="${lx}" cy="${ly}" r="16" fill="var(--panel2)" stroke="var(--line)" stroke-width="2"/>`+t(lx,ly+5,v,{mono:1,w:700})+'</g>';
   if(isCut)body+=t(lx,ly+34,'가지치기',{size:11,fill:'var(--orange)',w:700});});});
 body+=note(`B의 첫 대답 1점이 이미 A의 3점보다 낮아 B의 둘째 대답은 보지 않아도 됩니다. C도 첫 대답 −4에서 멈춥니다.`,250);
 return {svg:svg(`깊이 2 게임 트리. 흰색은 검은색의 최소값 가운데 가장 큰 수 A(${best}점)를 고르고, 알파베타는 B와 C의 둘째 대답을 보지 않습니다.`,body+dot(320,58,-180,62,'var(--accent)'),262),caption:'미니맥스로 끝 국면의 점수를 거꾸로 모으고, 알파베타로 볼 필요가 없는 가지를 자르는 그림. 끝 국면의 점수는 설명용 예시입니다.'};};
F.final=()=>{const G=P.game,run=R.playLine(G.moves),vals=run.states.map(s=>{const m=R.material(s);return m.w-m.b;}),X=i=>40+i*28,Y=v=>130-v*12;
 const pts=vals.map((v,i)=>`${i?'L':'M'}${X(i)} ${Y(v)}`).join('');
 let body=line(`M40 ${Y(0)}H${X(vals.length-1)}`,'var(--line)','')+`<path class="fig-draw" pathLength="1200" d="${pts}" fill="none" stroke="var(--accent)" stroke-width="3"/>`+t(30,Y(0)+4,'0',{a:'end',size:11,fill:'var(--muted)',mono:1});
 G.moments.forEach(([ply,,label],k)=>{const x=X(ply);body+=`<line x1="${x}" y1="20" x2="${x}" y2="226" stroke="var(--orange)" stroke-dasharray="4 4"/>`+pulse(x,Y(vals[ply]),8,'var(--orange)')+t(x,16+(k%2)*0,label.split(':')[0],{size:12,fill:'var(--orange)',w:700});});
 body+=t(X(vals.length-1),Y(vals[vals.length-1])+22,`${vals[vals.length-1]}점`,{size:12,mono:1,fill:'var(--accent)',w:700})+t(320,248,'가로: 반수 0~20 · 세로: 흰색 기물 점수 − 검은색 기물 점수',{size:12,fill:'var(--muted)'});
 return {svg:svg(`하준의 첫 대국에서 반수마다 흰색과 검은색의 기물 점수 차. 2수·6수·10수의 세 순간 뒤 점수가 떨어져 마지막에 ${vals[vals.length-1]}점이 됩니다.`,body,262),caption:'하준의 대국을 반수마다 기물 점수 차로 그린 선. 주황 세로선이 복기할 세 순간입니다(대국은 이 책이 지어낸 기록).'};};
function render(id){return F[id]?F[id]():null;}
root.CFigures={render};
})(this);
