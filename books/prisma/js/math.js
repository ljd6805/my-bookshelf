(function(root){
'use strict';
const TASKS=[{id:1,title:'메일 분류',status:'TODO',projectId:1},{id:2,title:'보고서 저장',status:'DONE',projectId:1},{id:3,title:'로그 요약',status:'TODO',projectId:2}];
const RUNS=[{id:1,taskId:1,success:false},{id:2,taskId:1,success:true},{id:3,taskId:2,success:true}];
function constraint(kind){
 const checks={normal:[true,true,'저장 가능: 타입과 DB 제약 모두 통과'],type:[false,null,'타입 단계에서 오류: Int 자리에 문자열'],unique:[true,false,'DB 단계에서 오류: 이미 있는 고유 키'],foreign:[true,false,'DB 단계에서 오류: 참조할 부모가 없음']};
 if(!checks[kind])throw new Error('알 수 없는 시나리오');
 const [type,db,message]=checks[kind];return {type,db,message};
}
function relationSchema(parent,unique){
 return {valid:[1,2].includes(Number(parent))&&!unique,columns:['id','title','status','projectId'],relation:'project · runs',reason:unique?'기존 Task.id=1과 중복입니다.':[1,2].includes(Number(parent))?'참조할 Project가 있고 ID가 유일합니다.':'Project가 없으므로 외래 키가 성립하지 않습니다.'};
}
function command(state,action){
 const next={...state};
 if(action==='edit')next.schema++;
 else if(action==='generate')next.client=next.schema;
 else if(action==='migrate')next.db=next.schema;
 else if(action==='pull')next.schema=next.db;
 else throw new Error('알 수 없는 명령');
 return next;
}
function query({project='all',status='all',fields='all',order='asc'}={}){
 return TASKS.filter(t=>(project==='all'||t.projectId===Number(project))&&(status==='all'||t.status===status)).sort((a,b)=>order==='asc'?a.id-b.id:b.id-a.id).map(t=>fields==='title'?{title:t.title}:{...t});
}
function relations(parentFilter='all',childFilter='all'){
 return TASKS.filter(t=>parentFilter==='all'||RUNS.some(r=>r.taskId===t.id&&!r.success)).map(t=>({...t,runs:RUNS.filter(r=>r.taskId===t.id&&(childFilter==='all'||!r.success))}));
}
function migration(plan){
 const data={direct:{ok:false,steps:['필수 열 추가','기존 두 행: 값 없음','변경 보류'],message:'기존 행을 채울 값과 이전 절차가 없어 필수 열을 바로 추가하는 계획은 불완전합니다.'},expand:{ok:true,steps:['선택 열 추가','새 코드 배포·기존 값 채우기','NULL 검사 뒤 필수 제약','구 코드 종료 뒤 옛 열 제거'],message:'확장 → 백필 → 검증 → 축소 순서입니다. 실제 SQL과 두 앱 버전의 호환성은 별도로 검사합니다.'},drop:{ok:false,steps:['옛 열 먼저 삭제','구 버전 앱 조회 실패','이전 값 복구 필요'],message:'구 버전 앱이 쓰는 열을 먼저 지우면 호환성이 깨집니다. 이 모형은 백업을 실행하지 않습니다.'}};
 if(!data[plan])throw new Error('알 수 없는 계획');return data[plan];
}
function transaction({atomic=true,fail=false,dedupe=true,repeat=1}={}){
 if(!Number.isInteger(repeat)||repeat<1||repeat>5)throw new Error('요청 횟수는 1~5');
 let status='TODO',runs=0;const events=[];
 for(let i=0;i<repeat;i++){
  if(dedupe&&runs>0){events.push('같은 요청 키: 기존 결과 반환');continue;}
  const before={status,runs};status='DONE';events.push('Task 상태 DONE 기록');
  if(fail){if(atomic){status=before.status;runs=before.runs;events.push('두 번째 쓰기 실패: 전체 취소');}else events.push('두 번째 쓰기 실패: 첫 변경 남음');}
  else{runs++;events.push('Run 한 행 생성');}
 }
 return {status,runs,events,consistent:(status==='DONE')===(runs>0)};
}
function cost(n,fields=4,offset=0){
 if(!Number.isInteger(n)||n<0||n>100||![1,4].includes(fields)||!Number.isInteger(offset)||offset<0||offset>90)throw new Error('유효하지 않은 입력');
 return {loop:1+n,batch:n===0?1:2,cells:n*fields,offsetVisited:offset+10,selected:10};
}
function authorize(trusted,owner,input,scope=true){
 const id=Number(input),valid=String(input).trim()!==''&&Number.isSafeInteger(id)&&id>0;
 const permitted=valid&&(!scope||Number(trusted)===Number(owner));
 return {valid,permitted,changed:permitted?1:0,reason:!valid?'입력 거절: 양의 정수 ID가 필요합니다.':scope&&Number(trusted)!==Number(owner)?'권한 거절: 신뢰한 프로젝트와 소유 프로젝트가 다릅니다.':!scope?'변경 허용: 범위 검사가 없어 다른 프로젝트도 수정될 수 있습니다.':'변경 허용: 입력과 프로젝트 범위를 확인했습니다.'};
}
function capstone({atomic=true,dedupe=true,scope=true}={}){
 const partial=transaction({atomic,fail:true,dedupe,repeat:1});
 const repeat=transaction({atomic,fail:false,dedupe,repeat:2});
 const access=authorize(2,1,'1',scope);
 return {checks:[partial.consistent,repeat.runs===1,!access.permitted],partial,repeat,access};
}
const api={TASKS,RUNS,constraint,relationSchema,command,query,relations,migration,transaction,cost,authorize,capstone};
if(typeof module!=='undefined')module.exports=api;else root.PMath=api;
})(typeof window==='undefined'?globalThis:window);
