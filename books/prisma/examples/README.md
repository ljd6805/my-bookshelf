# Prisma AX 작업 이력 실습

Prisma ORM **7.10.1**, SQLite, Node.js **24** 계열, TypeScript 5.9.3 기준입니다. Prisma 8 예제와 섞지 않습니다. 실행 위치는 이 `examples` 폴더입니다. 웹 교과서의 브라우저 실험은 별도 JavaScript 교육 모형입니다.

## 시작

저장소를 받은 뒤 이 폴더로 이동합니다. Node.js와 npm이 필요합니다. Windows에서는 `.env.example`을 탐색기로 복사하여 `.env`로 이름을 바꿔도 됩니다.

```sh
git clone https://github.com/ljd6805/my-bookshelf.git
cd my-bookshelf/books/prisma/examples
npm ci
cp .env.example .env
npm run migrate -- --name init
npm run generate
npm run typecheck
npm run demo
npm test
```

이미 포함된 init 마이그레이션을 개발용 SQLite DB에 적용합니다. `migrate dev`가 데이터 초기화를 제안하면 내용을 확인하고 멈추세요. 이 실습은 새 학습용 DB를 전제로 합니다. `.env`에는 `DATABASE_URL="file:./dev.db"`를 둡니다. 두 도구가 같은 DB를 보도록 반드시 이 폴더에서 CLI와 예제를 실행하세요.

예상 출력:

```json
{"title":"메일 분류 예제","status":"DONE","runs":[{"requestKey":"demo-run-1","success":true}]}
```

데모는 같은 요청 키를 두 번 처리합니다. 프로그램을 다시 실행해도 해당 실행 이력은 한 건입니다. 프로젝트/작업을 Studio에서 삭제하거나 수정한 경우 초기 상태의 예측과 달라질 수 있습니다.

## 파일을 읽는 순서

1. `prisma/schema.prisma`: Project 1:N Task 1:N Run, 고유 키, 외래 키, 인덱스.
2. `prisma7.config.ts`: CLI의 스키마·migration·연결 설정.
3. `src/db.ts`: SQLite adapter와 생성된 Client 연결.
4. `src/demo.ts`: 관계 생성·조회와 동일 요청의 순차 재시도.
5. `src/history.ts`: 실행 이력과 작업 상태를 한 트랜잭션으로 기록.
6. `src/scoped-update.ts`: 서버가 검증한 프로젝트 문맥으로 변경 범위 제한.
7. `src/integration.test.ts`: 임시 디렉터리의 별도 DB에 마이그레이션을 적용하여 실제 query와 제약 검증.

`npm test`는 현재 `dev.db`를 지우지 않습니다. `mkdtemp`로 만든 테스트 전용 디렉터리만 종료할 때 제거합니다.

## 스키마를 바꿀 때

```sh
npm run migrate -- --name describe_your_change
npm run generate
npm run typecheck
npm test
```

SQL 파일을 읽어 데이터 삭제나 열 이름 변경이 의도와 맞는지 검토하세요. 기존 데이터가 있는 필수 열 추가는 nullable 추가 → 기존 행 채우기 → 제약 강화처럼 단계로 나눕니다. 운영 배포에는 검토한 migration을 `npx prisma migrate deploy`로 적용하며, `migrate dev`/`reset`을 운영 명령으로 쓰지 않습니다. 이 저장소는 실제 운영 DB에 연결하지 않습니다.

## 검증한 범위와 남은 경계

2026-10-21 Linux / Node 24.19.0에서 설치, migration, generate, 타입 검사, demo와 통합 테스트 10개를 실행했습니다. 고유 키·외래 키·Restrict·rollback·순차 중복 요청·충돌 요청·필터·cursor·프로젝트 범위·입력 검증을 다룹니다.

`recordRun`은 같은 요청을 순차 재전송하는 학습 예제입니다. 동시에 같은 요청이 들어오면 고유 제약이나 잠금 충돌로 한 요청이 실패할 수 있습니다. 실패를 성공 응답으로 바꾸는 재조회·제한된 재시도 정책과 PostgreSQL 동시성 검증은 추가 설계가 필요합니다. 외부 API 호출, 인증 세션, 권한 서비스, 작업 상태 전이 규칙은 구현하지 않습니다. 서로 다른 실행 결과가 역순 도착하면 최종 status가 도착 순서에 따라 달라질 수 있습니다.

`changeStatusForProject`의 `trustedProjectId`는 서버가 인증/인가한 문맥에서 와야 합니다. 사용자가 보낸 projectId를 그대로 넘기면 권한 보호가 되지 않습니다. 이 함수는 상태를 바꾸는 범위를 제한하며 사용자 로그인 자체를 구현하지 않습니다.

## 문제 해결

- `tsx` CLI가 임시 IPC 파이프 권한 오류를 내는 실행 환경에서는 이 예제처럼 `node --import tsx`로 실행합니다.
- DB 열을 못 찾으면 연결 URL·실행 폴더와 migration 적용 상태를, 생성 타입이 오래되었으면 `npm run generate`를 확인합니다.
- SQLite adapter 설치가 native build에서 실패하면 Node 24 환경과 운영체제용 빌드 도구를 확인합니다. Windows/macOS native 설치는 이번 제작에서 실행하지 않았습니다.
- `P2002`는 고유 제약 충돌입니다. 모든 오류를 같은 요청의 성공으로 취급하지 말고 요청 키에 해당하는 기존 값이 같은지 확인합니다.
