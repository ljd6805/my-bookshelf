window.PBook = {
  "sources": [
    [
      "Prisma ORM 7 개요",
      "https://www.prisma.io/docs/orm/v7",
      "Client는 타입을 제공하는 데이터 접근 API, Migrate는 스키마 변경 이력, Studio는 데이터 편집 도구다. ORM은 데이터베이스 자체가 아니며 서버의 업무 권한 검사를 대신하지 않는다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "관계와 외래 키",
      "https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations",
      "relation field와 DB 열인 relation scalar field를 구분한다. Project 1:N Task, Task 1:N Run으로 예제를 작성한다. 목록 필드는 DB에 배열 열을 생성한다는 뜻이 아니다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "SQLite 시작하기",
      "https://www.prisma.io/docs/v7/prisma-orm/quickstart/sqlite",
      "prisma-client generator, output, SQLite adapter, ESM, dotenv를 사용한다. migrate dev 뒤 generate를 명시적으로 실행한다. 7.10 이후 prisma7.config.ts 이름을 사용하고 기존 prisma.config.ts도 v7 CLI가 지원한다고 안내한다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "시스템 요구 사항",
      "https://www.prisma.io/docs/orm/v7/reference/system-requirements",
      "v7 문서의 Node.js 요구는 ^20.19.0, ^22.12.0, ^24.0.0. 교재 실습은 Node 24 계열을 선택한다. 실제 설치 버전은 실습 lockfile 및 검증 기록이 기준이다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "CRUD",
      "https://www.prisma.io/docs/orm/v7/prisma-client/queries/crud",
      "create, findUnique, findMany, update, updateMany, delete, upsert를 구분한다. select는 필요한 필드, include는 관계 데이터를 요청한다. SQLite에서 skipDuplicates 옵션을 지원한다고 쓰지 않는다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "관계 조회",
      "https://www.prisma.io/docs/orm/v7/prisma-client/queries/relation-queries",
      "nested select와 include, some/none/every 필터, nested write를 다룬다. include 한 번을 항상 SQL 한 번과 같다고 설명하지 않는다. relationLoadStrategy는 DB 및 preview 조건이 있으므로 SQLite 공통 예제에 넣지 않는다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "개발과 운영 마이그레이션",
      "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production",
      "migrate dev는 개발 전용이고 migrate deploy는 준비된 마이그레이션의 적용에 사용한다. 운영 데이터에서 reset을 실습하지 않는다. 버전 문서에 generator 자동 실행 설명이 섞여 있어 교재는 generate를 별도 실행한다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "db push와 변경 이력",
      "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/prototyping-your-schema",
      "db push는 스키마 상태를 맞추지만 migration 파일과 이력을 생성하지 않는다. 열 이름 변경과 기존 데이터 보존은 SQL 검토 및 단계적 변경이 필요하다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "트랜잭션과 멱등성",
      "https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions",
      "nested write, 배열 transaction, callback transaction을 구별한다. 오류 시 DB 쓰기는 원자적으로 취소할 수 있으나 이미 전송한 외부 API 호출은 되돌리지 못한다. 짧은 transaction, 고유 requestKey와 재시도 처리, DB별 격리수준을 설명한다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "페이지네이션",
      "https://www.prisma.io/docs/orm/v7/prisma-client/queries/pagination",
      "offset의 skip/take와 고유 id 기반 cursor/skip:1/take/orderBy를 비교한다. 브라우저 실험은 고정 데이터에서 방문 행 수를 계산하는 교육 모형이며 실제 DB 시간 측정이 아니다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "실제 DB 통합 검사",
      "https://www.prisma.io/docs/orm/v7/prisma-client/testing/integration-testing",
      "mock 단위검사는 DB 제약과 마이그레이션을 검증하지 못한다. 격리된 DB에서 실제 query, unique/FK, rollback을 확인한다. 본문 운영 확장 PostgreSQL은 SQLite 결과와 구분한다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "Raw SQL과 파라미터",
      "https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries",
      "tagged template 값 파라미터를 사용하고 사용자 입력을 SQL 문자열에 이어 붙이지 않는다. table/column 식별자는 값 파라미터와 다르다. DB 쿼리의 타입 안정성이 입력 검증·권한·주입 안전 전부를 뜻하지 않는다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "버전별 상태",
      "https://www.prisma.io/docs/orm/release-status",
      "2026-10-21 직접 연 release-status 문서는 Prisma ORM 8을 release candidate로 표시한다. 검색 요약의 current-release 표현과 구분한다. 이 교재는 v7 기준이며 v8 패키지/API를 혼합하지 않는다. 공식 문서, 2026-10-21 확인."
    ],
    [
      "Models · 필드와 제약",
      "https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/models",
      "모델, 기본값, 고유 키, 인덱스 정의. 공식 문서, 2026-10-21 확인."
    ],
    [
      "Connection management",
      "https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-management",
      "연결 수명과 장기 실행 애플리케이션의 연결 관리. 공식 문서, 2026-10-21 확인."
    ],
    [
      "Prisma Client API reference",
      "https://www.prisma.io/docs/orm/v7/reference/prisma-client-reference",
      "조회·변경·로그 옵션의 세부 동작. 공식 문서, 2026-10-21 확인."
    ],
    [
      "Customizing migrations",
      "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations",
      "미적용 마이그레이션 SQL 검토와 데이터 보존. 공식 문서, 2026-10-21 확인."
    ]
  ],
  "chapters": [
    {
      "id": "why",
      "title": "Prisma가 맡는 일과 DB가 맡는 일",
      "subtitle": "객체로 쓰는 조회 코드와 데이터베이스가 지키는 제약을 구분합니다.",
      "desc": "타입 검사를 통과한 저장 요청이 왜 실패할까요?",
      "recall": "프로그램의 배열에 작업을 넣고 프로세스를 끝내면, 다음 실행에서 그 배열을 그대로 읽을 수 있을까요?",
      "paragraphs": [
        "메일을 분류하는 자동화 작업이 끝났습니다. 화면에 “완료”를 띄우는 데서 그치면 다음 날 어떤 입력으로 실행했는지 알 수 없습니다. 이 책은 프로젝트(Project), 해야 할 작업(Task), 실제 실행 기록(Run)을 저장하는 작은 시스템을 만듭니다. 먼저 배열에 담던 객체를 테이블의 행으로 저장하고, 프로그램을 다시 실행해도 같은 기록을 찾는 문제부터 시작합니다. 테이블은 같은 필드를 가진 행의 모음이며, 각 행은 키로 구분합니다. 작업 이름은 바뀔 수 있으므로 이름만으로 같은 작업인지 판단하지 않습니다.",
        "Prisma ORM은 애플리케이션 코드에서 DB에 접근할 때 사용하는 도구입니다. 개발자는 스키마에 모델을 선언하고, 생성된 Prisma Client로 조회·변경 요청을 작성합니다. Prisma Migrate는 DB 구조의 변경을 파일로 관리하며, Studio는 저장한 데이터를 살펴보거나 편집하는 화면입니다. 이 도구들을 사용해도 어떤 데이터가 업무상 유효한지, 누가 수정할 수 있는지, 실패할 때 무엇을 되돌릴지는 개발자가 설계해야 합니다. 이 장에서는 한 요청을 타입 검사·업무 검사·DB 제약으로 나누어 읽습니다."
      ],
      "formula": "타입이 맞는 요청 ≠ 저장 가능한 요청 ≠ 허용된 요청",
      "formulaNote": "세 판단은 서로 다른 질문에 답합니다. “문자열인가”, “기존 키와 겹치지 않는가”, “이 사용자가 바꿔도 되는가”를 한 종류의 검사로 합치지 않습니다.",
      "flow": [
        "애플리케이션|입력과 권한을 검사",
        "Prisma Client|모델에 맞는 요청을 구성",
        "데이터베이스|데이터를 저장하고 제약을 확인"
      ],
      "warning": "Prisma를 설치했다고 DB 서버가 자동으로 생기는 것은 아닙니다. 이 책은 파일 기반 SQLite를 별도로 사용합니다. Prisma ORM과 관리형 서비스 Prisma Postgres도 같은 제품 범위로 묶어 이해하지 않습니다.",
      "quiz": [
        "이미 저장된 Project.key와 같은 문자열을 다시 만들려 합니다. TypeScript 타입은 맞습니다. 어디에서 중복을 최종적으로 막아야 할까요?",
        [
          "DB의 고유 제약",
          "문자열 타입 선언만으로 충분하다",
          "화면에서 버튼을 한 번 비활성화한다"
        ],
        0,
        "동시에 들어오는 요청도 있으므로 저장소가 고유 제약으로 중복을 거절해야 합니다. 타입 검사는 문자열 값들의 중복 여부까지 확인하지 않습니다."
      ],
      "transfer": [
        "주문 관리 프로그램에서 금액이 숫자이면 누구나 주문을 수정할 수 있게 했습니다. 무엇이 빠졌을까요?",
        [
          "DB를 다른 언어로 다시 작성하는 일",
          "요청자의 주문 수정 권한을 확인하는 일",
          "숫자를 문자열로 바꾸는 일"
        ],
        1,
        "입력의 자료형과 업무 권한은 다릅니다. 9장에서 서버가 신뢰한 사용자 문맥과 조회 조건을 연결합니다."
      ],
      "details": [
        {
          "title": "1.1 SQL과 ORM은 무엇을 다르게 표현할까요?",
          "body": "<p>SQL은 관계형 DB에 원하는 행과 연산을 기술하는 언어입니다. ORM(Object–Relational Mapping)은 프로그램의 모델과 관계형 데이터를 연결합니다. Prisma에서는 테이블마다 직접 SQL 문자열을 만드는 대신 모델 API에 조건 객체를 전달할 수 있습니다. 다음 두 코드는 “완료된 작업의 제목을 ID 오름차순으로 읽는다”는 같은 의도를 표현한 예입니다. SQL은 의미를 비교하기 위한 개념 예이며 Prisma가 실제로 생성한 SQL을 그대로 적은 것은 아닙니다.</p><pre><code>SELECT title FROM Task WHERE status = &#x27;DONE&#x27; ORDER BY id ASC;\n\nconst tasks = await db.task.findMany({\n  where: { status: &quot;DONE&quot; },\n  select: { title: true },\n  orderBy: { id: &quot;asc&quot; },\n});</code></pre><p>ORM을 쓰면 모델의 필드 이름을 편집기에서 찾고 반환값의 모양을 추론하기 편해집니다. 반면 실행 계획, 인덱스, 잠금, DB별 기능까지 사라지는 것은 아닙니다. 조회가 느리면 API 호출을 읽는 것과 함께 실제 DB가 한 일을 확인해야 합니다. SQL을 몰라도 된다는 약속으로 ORM을 선택하면 뒤에서 원인을 찾기 어려워집니다.</p>"
        },
        {
          "title": "1.2 세 도구의 입력과 결과를 나눠 봅니다",
          "body": "<table><thead><tr><th>도구</th><th>입력</th><th>주로 얻는 결과</th></tr></thead><tbody><tr><td>Client</td><td>모델별 조회·변경 조건</td><td>DB에서 읽은 객체 또는 변경 결과</td></tr><tr><td>Migrate</td><td>스키마 변경과 migration 이력</td><td>검토하고 적용할 DB 변경</td></tr><tr><td>Studio</td><td>접속할 DB</td><td>데이터를 보는 편집 화면</td></tr></tbody></table><p>작업 T가 저장되어 있는지 살펴보는 일과, Task 테이블에 새 열을 추가하는 일은 다릅니다. 앞의 일은 데이터 조회이고 뒤의 일은 구조 변경입니다. Studio에서 값이 보인다고 스키마 이력까지 올바르게 배포되었다고 결론 내리지는 않습니다.</p>"
        },
        {
          "title": "1.3 브라우저 실험과 실제 DB 실습의 차이",
          "body": "<p>이 책의 화면 실험은 합성 데이터와 JavaScript로 만든 교육 모형입니다. 중복 키나 잘못된 참조를 골라 어느 책임에서 막는지 확인하지만, 웹페이지 안에서 Prisma CLI나 SQLite 드라이버를 실행하는 것은 아닙니다. 네트워크·잠금·드라이버 오류도 모형에 포함하지 않습니다.</p><p>실제 Prisma 코드는 3장의 로컬 실습에서 실행합니다. 먼저 화면으로 결과를 예상하고, 그다음 로컬 코드에서 같은 원리를 확인하세요. 두 결과를 비교할 때 “모형의 답”, “실제 DB의 관찰”, “아직 시험하지 않은 환경”을 따로 적으면 익힌 내용을 운영에 과장하여 적용하지 않게 됩니다.</p>"
        },
        {
          "title": "1.4 이 책을 마치면 남길 결과",
          "body": "<p>마지막 과제의 완료 조건은 정상 저장 한 번이 아닙니다. 같은 실행 요청을 다시 제출해도 기록이 늘지 않고, 중간 실패가 나면 두 쓰기가 함께 취소되며, 다른 프로젝트의 작업은 바뀌지 않아야 합니다. 이 조건을 스키마·코드·테스트에 각각 어디서 맡길지 설명하는 것이 목표입니다. 다음 장에서는 세 모델을 나누고 서로 연결할 키부터 정합니다.</p>"
        }
      ],
      "source": [
        0,
        12
      ],
      "cross": [],
      "group": "기반",
      "time": "15분",
      "labs": [
        "why"
      ]
    },
    {
      "id": "schema",
      "title": "Project·Task·Run의 관계 설계",
      "subtitle": "한 행의 의미와 키의 범위를 정한 뒤 관계를 선언합니다.",
      "desc": "작업을 세 번 실행하면 작업 이름도 세 번 복사해야 할까요?",
      "recall": "1장에서 작업 이름 대신 안정적인 키가 필요하다고 했습니다. 프로젝트와 작업을 각각 무엇으로 구분하면 좋을까요?",
      "paragraphs": [
        "이력 저장소에서 Project 한 행은 업무 묶음 하나, Task 한 행은 수행할 작업 하나, Run 한 행은 실행 결과 하나를 뜻합니다. 같은 작업을 세 번 실행해도 Task는 하나이고 Run은 세 개입니다. 실행마다 프로젝트 이름과 작업 제목까지 복사하면 제목을 바꿀 때 여러 행이 서로 달라질 수 있습니다. 이 예제는 제목을 Task에 두고 Run에는 taskId를 남깁니다. 다만 당시 제목을 정확히 보존해야 하는 감사 요구가 있다면 별도의 스냅숏 필드가 필요합니다. 정규화와 과거 상태 보존은 요구에 따라 함께 설계합니다.",
        "Prisma의 model은 관계형 DB에서 보통 테이블에 대응합니다. Int·String·Boolean·DateTime은 값의 종류를 나타내고, @id는 행 식별자, @unique는 중복할 수 없는 값의 범위를 표현합니다. Project.tasks 같은 관계 필드는 Client에서 관계를 다루기 위한 선언입니다. DB의 실제 연결 값은 Task.projectId입니다. “관계가 있다”는 말만 쓰지 말고 어느 행이 어느 키를 참조하는지까지 적어야 잘못된 부모 연결을 찾을 수 있습니다."
      ],
      "formula": "Project 1 : N Task / Task 1 : N Run",
      "formulaNote": "1:N은 한 부모 행에 자식 행이 여러 개 연결될 수 있다는 뜻입니다. 이 예제에서 각 Task는 정확히 한 Project에, 각 Run은 정확히 한 Task에 속합니다. 부모에게 자식이 반드시 하나 이상 있어야 한다는 뜻은 아닙니다.",
      "flow": [
        "Project (id)|프로젝트 한 행",
        "Task (id·projectId)|projectId → Project.id",
        "Run (taskId)|taskId → Task.id"
      ],
      "warning": "@default(\"TODO\")는 값을 생략했을 때 사용할 기본값입니다. status가 String이면 임의의 다른 문자열까지 자동으로 금지되지는 않습니다. 이 책은 상태 목록 검사를 애플리케이션에서 다루며, 운영에서는 상태 제약과 전이 규칙도 별도로 결정해야 합니다.",
      "quiz": [
        "Project의 tasks Task[] 선언은 무엇을 뜻할까요?",
        [
          "Project 테이블에 모든 Task를 JSON 배열로 저장한다",
          "Task와의 관계를 Client에서 탐색할 수 있게 선언한다",
          "Task가 최소 한 개 있어야 Project를 저장할 수 있다"
        ],
        1,
        "목록 관계 필드는 DB의 배열 열이 아닙니다. 연결 값은 이 예제의 Task.projectId에 들어갑니다."
      ],
      "transfer": [
        "한 문서는 여러 수정 이력을 가지며 각 수정 이력은 한 문서에 속합니다. 외래 키를 어디에 두는 것이 자연스러울까요?",
        [
          "문서마다 모든 수정 ID를 하나의 문자열로 저장",
          "문서 제목만 양쪽에 복사",
          "각 수정 이력에 문서 ID를 저장"
        ],
        2,
        "Task와 Run의 관계를 문서와 수정 이력에 옮긴 것입니다. 수정 이력의 documentId가 문서의 안정적인 ID를 참조하게 합니다."
      ],
      "details": [
        {
          "title": "2.1 예제의 스키마를 읽습니다",
          "body": "<pre><code>generator client {\n  provider = &quot;prisma-client&quot;\n  output   = &quot;../generated/prisma&quot;\n}\ndatasource db {\n  provider = &quot;sqlite&quot;\n}\nmodel Project {\n  id    Int    @id @default(autoincrement())\n  key   String @unique\n  name  String\n  tasks Task[]\n}\nmodel Task {\n  id        Int     @id @default(autoincrement())\n  title     String\n  status    String  @default(&quot;TODO&quot;)\n  projectId Int\n  project   Project @relation(fields: [projectId], references: [id], onDelete: Restrict)\n  runs      Run[]\n  @@index([projectId, status, id])\n}\nmodel Run {\n  id         Int      @id @default(autoincrement())\n  requestKey String   @unique\n  success    Boolean\n  createdAt  DateTime @default(now())\n  taskId     Int\n  task       Task     @relation(fields: [taskId], references: [id], onDelete: Restrict)\n  @@index([taskId, id])\n}</code></pre><p>Project.key는 사람이 다루는 프로젝트 코드이고 id는 내부 연결용 식별자입니다. 둘 다 유일하지만 목적이 다릅니다. Run.requestKey는 같은 실행 결과 요청을 식별하는 문자열입니다. 이 예제는 모든 Run에서 유일하도록 정했습니다. 요청 키를 프로젝트마다 따로 발급한다면 전역 유일성 대신 프로젝트 범위를 포함한 키 설계를 검토해야 합니다. 단지 중복 오류를 없애려고 고유 제약을 제거하면 재시도 문제를 다시 만들게 됩니다.</p>"
        },
        {
          "title": "2.2 relation과 외래 키를 한 줄씩 대조합니다",
          "body": "<pre><code>projectId Int\nproject   Project @relation(fields: [projectId], references: [id], onDelete: Restrict)</code></pre><p>fields는 이 모델에 있는 연결 열, references는 상대 모델에서 참조할 열입니다. Task.projectId가 7이라면 Project.id가 7인 행을 찾습니다. 이 스키마를 DB에 적용하고 외래 키 제약을 사용하는 실습에서 부모가 없으면 저장할 수 없습니다. onDelete: Restrict는 연결된 자식이 남아 있는 부모 삭제를 막도록 정한 정책입니다. 실제로 프로젝트를 지워야 한다면 이력 보존 요구와 삭제 순서를 먼저 정합니다. Cascade로 바꾸는 것은 오류 메시지를 숨기는 수정이 아니라 삭제 정책을 바꾸는 일입니다.</p>"
        },
        {
          "title": "2.3 필수·선택·기본값은 서로 다른 약속입니다",
          "body": "<p>String은 문자열 값을 요구합니다. String?는 null을 허용하는 선택 필드입니다. 빈 문자열 \"\"은 null과 다른 값입니다. 예를 들어 담당자가 아직 배정되지 않았다면 owner String? 같은 설계를 검토할 수 있지만, 이 예제의 실제 스키마에는 owner가 없습니다. 새 필드를 선언하는 것과 기존 데이터에 값을 채우는 일은 6장에서 연결합니다.</p><p>자동 증가 id는 사람이 기억하기 좋은 순번처럼 보일 수 있습니다. 그러나 삭제·실패·동시 실행 등을 고려하면 업무 번호의 연속성을 가정해서는 안 됩니다. “다음 실행은 이전 ID에 1을 더하면 된다”는 규칙을 만들지 말고, 생성 결과에서 반환된 ID를 사용하세요.</p>"
        },
        {
          "title": "2.4 제약과 인덱스를 구분합니다",
          "body": "<p>고유 제약은 무엇을 저장해도 되는지 제한합니다. 일반 인덱스는 특정 조회를 효율적으로 수행할 수 있도록 돕는 구조이며 중복 값을 금지하지 않습니다. Task의 @@index([projectId, status, id])는 프로젝트와 상태를 조건으로 ID 순서의 작업을 읽는 예제를 염두에 둔 설계입니다. 인덱스를 선언했다고 모든 조회가 빨라지는 것은 아니며 쓰기와 저장 공간에도 비용이 듭니다. 8장에서는 조건과 실제 실행 계획을 보고 이 선택을 평가합니다.</p><p>관계는 1:N 외에도 1:1과 N:M이 있습니다. Task마다 별도 설정 행 하나만 허용하려면 연결 키의 유일성까지 필요하고, 여러 태그를 여러 작업에 붙이려면 연결 관계를 별도로 표현해야 합니다. 이 책은 1:N 사례를 끝까지 사용해 저장과 실패 처리에 집중합니다. 스키마가 준비되었으니 이제 이를 Client와 DB에 각각 반영해 보겠습니다.</p>"
        }
      ],
      "source": [
        1,
        13
      ],
      "cross": [],
      "group": "기반",
      "time": "15분",
      "labs": [
        "schema"
      ]
    },
    {
      "id": "setup",
      "title": "스키마에서 첫 Prisma Client 만들기",
      "subtitle": "설정 파일, 생성한 Client, 실제 DB를 각각 확인합니다.",
      "desc": "generate만 실행하면 DB에 새 열이 생길까요?",
      "recall": "2장의 schema.prisma는 모델 선언 파일입니다. 그 파일 자체가 SQLite 데이터 파일일까요?",
      "paragraphs": [
        "스키마를 작성한 뒤에는 두 종류의 결과가 필요합니다. 하나는 TypeScript 코드가 가져다 쓰는 Prisma Client이고, 다른 하나는 DB 안의 테이블과 제약입니다. generate는 전자를 만들고, migration 적용은 후자를 바꿉니다. 스키마와 Client만 새 버전인데 DB는 이전 버전이면 타입 검사를 통과한 코드도 실행 중 실패할 수 있습니다. 화면 실험에서 세 상태를 따로 바꿔 보면 명령을 외우기보다 어떤 대상이 달라졌는지 이해하기 쉽습니다.",
        "이 책의 로컬 예제는 Node.js 24 계열, Prisma ORM 7.10.1, TypeScript, SQLite와 better-sqlite3 adapter를 사용합니다. ESM 방식으로 모듈을 불러오며 비밀이 아닌 학습용 DB 주소를 .env에 둡니다. 패키지 버전은 예제의 package.json과 lockfile을 기준으로 고정합니다. 2026-10-21 공식 release-status 문서가 Prisma 8을 RC로 표시했으므로 v8의 패키지나 설정 예제를 이 코드에 섞지 않습니다. 버전 확인은 앞으로 이 책을 다시 실행할 때도 첫 단계입니다."
      ],
      "formula": "schema.prisma → generate → Client / migration 파일 → 적용 → DB",
      "formulaNote": "generate가 바꾸는 것은 코드 생성물이며 DB의 기존 행을 이전하지 않습니다. DB 변경 후에도 Client가 오래되었으면 다시 생성해야 합니다.",
      "flow": [
        "스키마 선언|모델의 원하는 구조",
        "마이그레이션 적용|DB 테이블·제약",
        "Client 생성|TypeScript API",
        "첫 조회|연결과 결과 확인"
      ],
      "warning": "실습은 별도의 학습용 SQLite 파일에서 합니다. 기존 업무 DB에 연결해 migrate reset이나 데이터 손실 허용 옵션으로 오류를 해결하지 마세요. 환경변수에 다른 DB 주소가 들어 있다면 실행 대상부터 확인해야 합니다.",
      "quiz": [
        "schema.prisma에 새 필드를 추가하고 generate만 실행했습니다. 무엇이 바뀌었을까요?",
        [
          "DB의 기존 행까지 모두 채워졌다",
          "생성 Client가 새 스키마를 반영한다",
          "운영 migration이 자동으로 배포된다"
        ],
        1,
        "generate는 코드 생성 단계입니다. DB에 변경을 적용하고 필요한 데이터를 채우는 단계는 별도입니다."
      ],
      "transfer": [
        "이미 존재하는 DB 구조를 먼저 읽어 Prisma 스키마를 만들려 합니다. 방향에 맞는 명령은 무엇일까요?",
        [
          "prisma db pull",
          "prisma generate",
          "prisma migrate reset"
        ],
        0,
        "db pull은 DB를 introspection하여 스키마에 반영하는 방향입니다. 기존 스키마와의 차이를 검토한 뒤 Client를 생성합니다."
      ],
      "details": [
        {
          "title": "3.1 실습 폴더에서 시작합니다",
          "body": "<p>이 저장소의 <a href=\"docs/local-lab.html\">로컬 실습 안내</a>는 실제 실행 순서와 확인 조건을 담고 있습니다. 터미널 위치는 books/prisma/examples로 맞춥니다. Node 버전을 확인하고 제공된 lockfile로 의존성을 설치합니다. .env.example을 .env로 복사하되, 기존 .env가 있다면 덮어쓰기 전에 학습용 DB 주소인지 확인하세요. 아래 명령은 이 폴더에서 실행합니다.</p><pre><code>node --version\nnpm ci\n# .env.example을 .env로 복사하고 DATABASE_URL 확인\nnpm run migrate -- --name init\nnpm run generate\nnpm run typecheck\nnpm run demo\nnpm test</code></pre><p>이미 제공된 migration을 그대로 설치하는 경우와 스키마를 바꾸어 새 migration을 만드는 경우는 구분합니다. README의 현재 절차가 우선입니다. 정상 예제의 의도는 같은 requestKey를 두 번 기록해도 Run이 한 개만 남는 모습을 확인하는 것입니다. 출력 숫자 ID는 파일의 이전 상태에 따라 달라질 수 있으므로 ID가 1인지보다 상태와 기록 개수를 비교합니다.</p>"
        },
        {
          "title": "3.2 세 설정 파일의 역할을 나눕니다",
          "body": "<p>package.json의 type: \"module\"은 이 예제가 ESM을 사용함을 나타냅니다. schema.prisma의 generator는 생성 방식과 출력 위치를, datasource는 DB 종류를 정합니다. CLI가 사용할 DB 주소는 prisma7.config.ts에서 읽고, 실행 코드의 adapter도 같은 DATABASE_URL을 사용합니다. CLI와 애플리케이션이 서로 다른 파일을 바라보면 테이블을 만들었는데 없다는 오류가 날 수 있습니다.</p><pre><code>import &quot;dotenv/config&quot;;\nimport { defineConfig, env } from &quot;prisma/config&quot;;\n\nexport default defineConfig({\n  schema: &quot;prisma/schema.prisma&quot;,\n  migrations: { path: &quot;prisma/migrations&quot; },\n  datasource: { url: env(&quot;DATABASE_URL&quot;) },\n});</code></pre><p>v7.10 이후의 공식 시작 문서는 prisma7.config.ts 이름을 안내합니다. 기존 v7 프로젝트의 prisma.config.ts도 v7 CLI가 지원하지만, 이 책에서는 혼동을 줄이기 위해 예제 파일명을 그대로 사용합니다. .env는 비밀을 감추는 암호화 장치가 아닙니다. 운영 접속 문자열은 저장소에 올리지 않고 환경에 맞는 비밀 관리 수단으로 전달해야 합니다.</p>"
        },
        {
          "title": "3.3 Client를 열고 비동기 결과를 읽습니다",
          "body": "<pre><code>import &quot;dotenv/config&quot;;\nimport { PrismaBetterSqlite3 } from &quot;@prisma/adapter-better-sqlite3&quot;;\nimport { PrismaClient } from &quot;../generated/prisma/client.ts&quot;;\n\nconst url = process.env.DATABASE_URL;\nif (!url) throw new Error(&quot;DATABASE_URL이 필요합니다.&quot;);\nconst db = new PrismaClient({\n  adapter: new PrismaBetterSqlite3({ url }),\n});\ntry {\n  const tasks = await db.task.findMany();\n  console.log(tasks);\n} finally {\n  await db.$disconnect();\n}</code></pre><p>await는 조회가 끝날 때까지 이 비동기 흐름의 다음 처리를 기다립니다. 반환값은 모델 메서드에 따라 다릅니다. findMany는 빈 배열을 포함한 배열이고, findUnique는 없으면 null일 수 있습니다. const는 그 변수에 다른 값을 다시 대입하지 않겠다는 뜻이며 DB 행이 불변이라는 뜻은 아닙니다. 위 코드는 연결 수명을 보여 주는 짧은 스크립트입니다. 장기 실행 서버에서는 매 요청마다 Client를 새로 만들고 연결을 닫는 구조를 그대로 옮기지 않습니다.</p>"
        },
        {
          "title": "3.4 실패 위치를 좁히는 순서",
          "body": "<p>import 오류라면 생성 파일과 경로를, 설정 로드 오류라면 파일명과 환경변수를 먼저 봅니다. 테이블이 없다는 오류라면 CLI와 실행 코드의 DB 주소를 대조합니다. 고유 키 중복은 연결 실패가 아니라 실제 쓰기에서 제약에 걸린 것입니다. 오류를 모두 “Prisma 설치 문제”로 묶으면 원인과 해결을 연결하기 어렵습니다.</p><p>직접 기록할 항목은 명령, 작업 폴더, Node·Prisma 버전, 실패 단계, 재현할 입력입니다. 비밀 접속 문자열은 기록에 복사하지 않습니다. 첫 조회까지 확인하면 이제 Client의 반환값을 의도적으로 바꾸어 볼 수 있습니다. 다음 장에서는 어떤 행을, 어떤 열만, 어떤 순서로 받을지 분리해서 작성합니다.</p>"
        }
      ],
      "source": [
        2,
        3,
        12,
        14
      ],
      "cross": [],
      "group": "기반",
      "time": "18분",
      "labs": [
        "setup"
      ]
    },
    {
      "id": "crud",
      "title": "필요한 작업만 읽고 쓰기",
      "subtitle": "where·select·orderBy를 구분하고 변경 범위를 명시합니다.",
      "desc": "완료된 작업의 제목만 필요할 때 무엇을 요청해야 할까요?",
      "recall": "3장에서 빈 배열과 null이 다른 조회 결과라고 했습니다. 여러 작업을 찾는 메서드는 어떤 모양을 반환할까요?",
      "paragraphs": [
        "DB에 연결했으니 작업 목록을 화면에 표시해 봅시다. 프로젝트 A의 완료된 작업 제목만 필요한데 모든 프로젝트의 모든 필드를 읽으면 결과를 다시 걸러야 합니다. 조회할 행은 where, 반환할 열은 select, 순서는 orderBy로 표현합니다. 각각을 따로 생각하면 “필터를 걸었는데 왜 비밀 필드가 보이지?”와 “제목만 골랐는데 왜 다른 프로젝트 작업이 있지?”가 서로 다른 문제임을 알 수 있습니다.",
        "CRUD는 생성(Create), 읽기(Read), 수정(Update), 삭제(Delete)를 묶은 말입니다. 생성은 DB에 새 행을 추가하고, 수정은 이미 있는 행의 값을 바꾸며, 삭제는 해당 행을 제거합니다. 같은 입력 객체를 받는 것처럼 보여도 없는 행을 만났을 때와 여러 행이 조건을 만족할 때의 의미가 다릅니다. 이 장은 먼저 읽기로 결과 집합을 예측하고, 그 조건을 쓰기에 옮길 때 어떤 위험이 생기는지 살펴봅니다."
      ],
      "formula": "조회 결과 = 대상 행(where) → 순서(orderBy) → 반환 필드(select)",
      "formulaNote": "관계를 설명하기 위한 순서입니다. DB가 내부에서 반드시 이 물리적 순서대로 실행한다는 뜻은 아닙니다. 조회 계획과 반환 결과를 구분합니다.",
      "flow": [
        "where|반환할 행을 제한",
        "orderBy|순서를 명시",
        "select|필요한 열만 반환",
        "결과 객체|선택한 필드로 구성"
      ],
      "warning": "select로 projectId를 숨겼다고 다른 프로젝트에 대한 접근을 막은 것은 아닙니다. 허용된 프로젝트 범위는 where와 서버의 권한 검사에서 별도로 제한해야 합니다. 또한 where가 없는 updateMany·deleteMany는 넓은 변경으로 이어질 수 있습니다.",
      "quiz": [
        "상태가 TODO·DONE·TODO인 작업 세 개에서 where: {status:\"DONE\"}, select: {title:true}를 적용하면 무엇이 반환될까요?",
        [
          "제목 필드만 가진 객체 한 개가 든 배열",
          "DONE 문자열 한 개",
          "작업 세 개에서 status만 제거한 배열"
        ],
        0,
        "where는 DONE 행 하나를 고르고 select는 그 행의 title만 남깁니다. findMany의 반환 모양은 여전히 배열입니다."
      ],
      "transfer": [
        "재고가 0인 상품의 이름과 SKU만, SKU 오름차순으로 보여 주려 합니다. 어떤 구분이 맞을까요?",
        [
          "where에 반환 열, select에 정렬을 쓴다",
          "select만 쓰면 재고가 0인 행도 자동으로 고른다",
          "where는 재고 조건, select는 이름·SKU, orderBy는 SKU 순서다"
        ],
        2,
        "작업 예제의 행·열·순서 구분을 상품으로 옮긴 것입니다. 결과를 그려 본 뒤 조건 객체로 바꾸면 혼동이 줄어듭니다."
      ],
      "details": [
        {
          "title": "4.1 저장한 결과에서 생성된 ID를 받습니다",
          "body": "<pre><code>const project = await db.project.create({\n  data: { key: &quot;AX-DEMO-2&quot;, name: &quot;실습 프로젝트&quot; },\n});\nconst task = await db.task.create({\n  data: {\n    title: &quot;문서 분류&quot;,\n    projectId: project.id,\n  },\n});\nconsole.log(task.id, task.status);</code></pre><p>두 번째 쓰기는 첫 번째 결과의 ID를 사용합니다. 이 코드는 생성 결과를 읽는 예이며, 두 쓰기를 하나로 보장하는 코드는 아닙니다. 두 번째가 실패하면 첫 Project가 남을 수 있습니다. 7장에서는 이 관계를 nested write나 transaction으로 묶습니다. 또 같은 고유 key로 이 코드를 다시 실행하면 중복 오류가 납니다. 학습 코드의 재실행 정책을 정하지 않고 고유 제약을 지우지는 마세요.</p>"
        },
        {
          "title": "4.2 하나를 찾는 기준과 여러 개를 찾는 기준",
          "body": "<p>findUnique는 id나 key처럼 유일한 기준으로 한 행을 찾는 의도를 드러냅니다. 결과가 없을 수 있으므로 null 처리가 필요합니다. findFirst는 일반 조건을 만족하는 첫 행을 찾고, 어떤 행이 첫 행인지 중요하면 orderBy를 함께 명시합니다. findMany는 0개부터 여러 개까지 반환합니다. 결과가 반드시 있어야 하는 코드라면 없는 상황을 오류로 처리할지, 대체 화면을 보여 줄지 결정합니다.</p><pre><code>const project = await db.project.findUnique({\n  where: { key: &quot;AX-LEARN&quot; },\n});\nif (!project) throw new Error(&quot;프로젝트를 찾을 수 없습니다.&quot;);\n\nconst tasks = await db.task.findMany({\n  where: { projectId: project.id, status: &quot;DONE&quot; },\n  select: { id: true, title: true },\n  orderBy: { id: &quot;asc&quot; },\n  take: 20,\n});</code></pre><p>select를 바꾸면 결과 타입도 그 선택에 맞게 달라집니다. 위 결과에서 status를 읽으려면 status도 선택해야 합니다. 타입 오류를 any로 덮기 전에 실제 반환할 데이터가 무엇인지 먼저 고치는 편이 낫습니다.</p>"
        },
        {
          "title": "4.3 수정·삭제 전에 대상 조건부터 읽습니다",
          "body": "<pre><code>const result = await db.task.updateMany({\n  where: { id: taskId, projectId: trustedProjectId },\n  data: { status: &quot;DONE&quot; },\n});\nif (result.count !== 1) {\n  throw new Error(&quot;허용된 프로젝트에서 작업을 찾지 못했습니다.&quot;);\n}</code></pre><p>이 코드는 대상 작업과 허용 범위를 한 변경 조건에 넣은 개념 예입니다. trustedProjectId는 사용자가 요청 본문에 적은 값을 그대로 믿은 것이 아니라 서버가 권한을 확인한 결과여야 합니다. updateMany는 바뀐 행 수를 돌려주므로 결과가 0인 경우를 놓치지 않아야 합니다. 실제 입력 검사까지 포함한 예제는 9장에 있습니다.</p><p>delete와 deleteMany의 이름만 보고 위험도를 판단하지 마세요. 한 행이라도 그 행을 참조하는 자식이나 보존해야 할 이력이 있을 수 있습니다. 이 예제는 부모 삭제를 Restrict로 막습니다. 삭제 요청의 의미가 “목록에서 숨김”이라면 물리 삭제 대신 별도 상태나 보관 정책을 검토할 수 있습니다. 정책을 정하기 전에는 soft delete라는 이름의 필드를 습관적으로 추가하지 않습니다.</p>"
        },
        {
          "title": "4.4 upsert와 집계는 어떤 질문에 답할까요?",
          "body": "<p>upsert는 유일한 기준의 행이 있으면 update, 없으면 create를 수행합니다. 예제 demo는 학습 프로젝트를 다시 만들지 않도록 Project.key로 upsert합니다. 하지만 모든 재시도가 자동으로 안전해지는 것은 아닙니다. update에 증가 연산이나 다른 부작용을 넣으면 같은 요청이 반복될 때 결과가 달라질 수 있습니다. 재시도 의미는 7장에서 요청 키와 함께 설계합니다.</p><p>목록의 전체 길이만 필요하면 count를 생각하고, 합계·평균·그룹별 수량이 필요하면 aggregate나 groupBy의 조건과 빈 집합 결과를 확인합니다. 이 책의 첫 목록 화면은 작은 데이터이므로 우선 findMany의 결과를 눈으로 대조합니다. 다음 장에서는 이 행들에 연결된 Run을 읽어 “실패가 있는 작업”을 찾겠습니다.</p>"
        }
      ],
      "source": [
        4,
        15
      ],
      "cross": [],
      "group": "조회",
      "time": "15분",
      "labs": [
        "crud"
      ]
    },
    {
      "id": "relations",
      "title": "관계가 있는 데이터를 함께 조회하기",
      "subtitle": "부모를 고르는 조건과 반환할 자식의 조건을 구분합니다.",
      "desc": "실패한 Run만 포함하면 실패가 없는 Task도 사라질까요?",
      "recall": "2장에서 Run.taskId가 Task.id를 참조했습니다. 4장의 where를 어느 모델에 쓰는지에 따라 고르는 행도 달라집니다.",
      "paragraphs": [
        "작업 목록에서 실패한 실행 기록만 펼쳐 보고 싶습니다. 실패 Run을 include 안에서 필터링하면 각 Task에 붙는 Run 목록이 줄어듭니다. 그러나 실패 Run이 없는 Task까지 자동으로 제외되는 것은 아닙니다. “실패가 있었던 작업만” 찾으려면 Task의 where에 runs.some 조건을 둬야 합니다. 화면에서는 둘 다 실패만 보이는 것처럼 느껴질 수 있지만, 반환된 Task의 개수는 다릅니다.",
        "관계 조회를 작성할 때는 먼저 최상위 결과가 Project 배열인지 Task 배열인지 결정하세요. 그다음 부모의 포함 조건과 자식의 반환 모양을 각각 적습니다. 이 장의 예제는 Task A에 성공·실패 Run이 있고, Task B에는 성공 Run만 있고, Task C에는 Run이 없다고 가정합니다. 실패한 Run만 붙여 읽으면 A·B·C가 모두 남고, 실패 Run이 하나라도 있는 Task만 고르면 A가 남습니다. SQL JOIN 문법을 외우기 전에 결과 표를 그리는 연습입니다."
      ],
      "formula": "부모의 where = 어떤 Task인가 / 자식의 where = 어떤 Run을 붙일까",
      "formulaNote": "some은 조건에 맞는 자식이 하나 이상 있다는 뜻입니다. include 안의 where는 반환할 관계 목록에 적용됩니다. 두 조건을 함께 써야 원하는 부모와 원하는 자식만 받을 수 있는 경우가 있습니다.",
      "flow": [
        "Task 조건|실패 Run 존재 여부",
        "Run 조건|반환할 실행만 선택",
        "중첩 결과|Task와 runs 배열",
        "빈 관계|Task가 남을 수 있음"
      ],
      "warning": "include 한 번을 썼다는 사실만으로 DB에 SQL이 한 번만 전송된다고 판단하지 않습니다. 관계 로딩 방식은 DB·버전·설정에 따라 달라질 수 있습니다. 이 책의 SQLite 예제에 다른 DB의 preview 옵션을 그대로 넣지 않습니다.",
      "quiz": [
        "모든 Task를 읽되 runs: {where:{success:false}}만 include했습니다. 실패 Run이 없는 Task는 어떻게 될까요?",
        [
          "항상 결과에서 제외된다",
          "그 Task는 남고 runs가 빈 배열일 수 있다",
          "DB가 실패 Run을 자동으로 만든다"
        ],
        1,
        "부모 Task를 제한하는 조건이 없으므로 Task는 남습니다. 자식의 where는 붙일 Run을 고릅니다."
      ],
      "transfer": [
        "미결제 주문이 있는 고객만 고르고, 그 고객의 미결제 주문만 보여 주려 합니다. 어떤 조건이 필요할까요?",
        [
          "고객의 주문 some 조건과 포함할 주문의 조건을 모두 사용",
          "주문 include만 사용하면 고객도 자동으로 걸러진다",
          "고객 이름 select만 사용"
        ],
        0,
        "부모 포함과 자식 반환의 두 판단이 필요합니다. Task·Run 예제를 고객·주문으로 옮겨 보면 구조가 같습니다."
      ],
      "details": [
        {
          "title": "5.1 결과 모양을 먼저 그립니다",
          "body": "<pre><code>// 결과 개념 예: 자식 필터만 적용\n[\n  { title: &quot;A&quot;, runs: [{ success: false }] },\n  { title: &quot;B&quot;, runs: [] },\n  { title: &quot;C&quot;, runs: [] }\n]</code></pre><p>빈 runs는 “조회한 조건을 만족하는 Run이 없다”는 뜻입니다. 실제로 실행 기록이 전혀 없는지, 성공 기록만 있어서 필터로 빠졌는지는 이 결과만으로 알 수 없습니다. 화면 문구도 “실행하지 않음”이라고 단정하지 말고 조회 조건에 맞게 표시해야 합니다. 데이터 조회의 의미가 그대로 사용자 설명의 정확성과 연결됩니다.</p>"
        },
        {
          "title": "5.2 부모 조건과 중첩 select를 함께 씁니다",
          "body": "<pre><code>const failedTasks = await db.task.findMany({\n  where: {\n    projectId: trustedProjectId,\n    runs: { some: { success: false } },\n  },\n  select: {\n    id: true,\n    title: true,\n    runs: {\n      where: { success: false },\n      select: { id: true, requestKey: true, success: true },\n      orderBy: { id: &quot;desc&quot; },\n    },\n  },\n  orderBy: { id: &quot;asc&quot; },\n});</code></pre><p>위 코드는 외부에서 정의한 trustedProjectId로 허용 범위를 제한한 개념 예입니다. 최상위 select 안에 관계의 select를 중첩하면 결과 모양을 좁힐 수 있습니다. 같은 수준에서 select와 include를 함께 쓰기보다 필요한 스칼라 필드와 관계를 select 안에 명시하는 형태로 읽어 보세요. “모든 필드와 관계”가 편해 보여도 화면이 필요로 하는 데이터부터 정하는 것이 좋습니다.</p>"
        },
        {
          "title": "5.3 some·none·every의 빈 집합을 확인합니다",
          "body": "<p>some은 하나 이상, none은 하나도 없음, every는 관계된 모든 행이 조건을 만족한다는 뜻입니다. Run이 없는 Task에서 every: {success:true}는 조건을 어기는 Run이 없으므로 참이 될 수 있습니다. “한 번 이상 실행했고 모두 성공했다”를 표현하려면 실행 존재 조건과 모든 성공 조건을 함께 생각해야 합니다.</p><pre><code>where: {\n  runs: {\n    some: {},\n    every: { success: true },\n  },\n}</code></pre><p>Task C처럼 자식이 0개인 사례를 테스트에 포함하면 업무 문장과 논리 조건의 차이가 드러납니다. “실패가 없다”와 “성공했다”는 같은 말이 아닙니다. 9장의 테스트에서도 정상값뿐 아니라 이런 경계 조건을 남깁니다.</p>"
        },
        {
          "title": "5.4 새 관계를 만들 때와 기존 관계를 연결할 때",
          "body": "<p>새 Project와 그 Task를 함께 만들 때는 nested create로 관계를 표현할 수 있습니다. 이미 있는 Project에 Task를 붙일 때는 부모를 새로 만들려는 것인지, 고유 키로 찾아 connect하려는 것인지 구분합니다. 같은 프로젝트 이름을 반복해서 create하면 이름이 같은 서로 다른 Project가 생길 수도 있습니다. 이름이 같다는 것과 같은 행이라는 것을 혼동하지 마세요.</p><pre><code>const projectWithTask = await db.project.create({\n  data: {\n    key: &quot;AX-NESTED&quot;,\n    name: &quot;관계 생성 실습&quot;,\n    tasks: { create: { title: &quot;로그 요약&quot; } },\n  },\n  include: { tasks: true },\n});</code></pre><p>이 nested write의 원자성은 7장에서 다룹니다. 여기서는 한 객체 안에 관계 생성 의도가 표현된다는 점을 먼저 읽습니다. 이제 조회와 저장이 가능하지만, 다음 요구는 기존 Task에 담당자 필드를 추가하는 것입니다. 저장한 행이 있는 상태에서 구조를 바꾸는 방법을 다음 장에서 익힙니다.</p>"
        }
      ],
      "source": [
        1,
        5
      ],
      "cross": [],
      "group": "조회",
      "time": "15분",
      "labs": [
        "relations"
      ]
    },
    {
      "id": "migrations",
      "title": "기존 데이터를 지키며 스키마 변경하기",
      "subtitle": "새 DB 구조와 기존 데이터의 이전 순서를 함께 설계합니다.",
      "desc": "기존 작업에 값이 없는 필수 열을 바로 추가해도 될까요?",
      "recall": "3장에서 스키마·Client·DB가 서로 다른 상태라고 했습니다. 이제 실행 중인 앱의 버전도 함께 생각해 봅니다.",
      "paragraphs": [
        "작업이 수천 개 쌓인 뒤 담당자 owner를 필수로 저장하라는 요구가 생겼습니다. 새 스키마에 owner String 한 줄을 쓰는 일은 쉽지만 기존 행에는 값이 없습니다. 그 값을 누가 어떤 기준으로 채울지 결정하지 않으면 마이그레이션 도구만으로 요구사항이 완성되지 않습니다. 스키마 마이그레이션은 구조를 바꾸는 일이고, 데이터 마이그레이션은 기존 값을 새 구조에 맞춰 옮기거나 채우는 일입니다.",
        "개발에서는 변경 SQL을 만들고 검토하며, 운영에서는 검토한 변경 이력을 적용합니다. 이 과정에서 구버전 앱과 신버전 앱이 동시에 실행될 수 있습니다. 따라서 “새 코드에서는 잘 된다”만 확인하면 부족합니다. 이 장의 실험은 선택 필드 추가, 기존 값 채우기, 새 코드 전환, 제약 강화라는 순서를 비교합니다. 실제 DB 잠금 시간이나 온라인 DDL을 재현하지 않는 배포 순서 교육 모형입니다."
      ],
      "formula": "변경 완료 = 새 구조 + 기존 값 이전 + 앱 호환성 + 적용 이력",
      "formulaNote": "네 항목을 따로 확인합니다. migration 파일이 존재한다는 사실만으로 백필과 배포 호환성까지 검증된 것은 아닙니다.",
      "flow": [
        "확장|구버전과 공존할 구조",
        "백필|기존 행의 값을 채움",
        "전환|새 코드가 새 값을 사용",
        "축소|불필요한 구조를 제거"
      ],
      "warning": "migrate deploy는 데이터 보존을 자동으로 보장하는 버튼이 아닙니다. 위험한 SQL도 적용 대상이 될 수 있으므로 변경 파일·백업·복구 계획을 검토해야 합니다. 이미 다른 환경에 적용한 migration 파일을 뒤늦게 고쳐 이력을 맞추려 하지 않습니다.",
      "quiz": [
        "기존 Task 100개에 owner 값이 없습니다. 담당자를 임의로 정할 수 없는 상황에서 적절한 첫 변경은 무엇일까요?",
        [
          "모든 owner에 아무 문자열을 넣고 끝낸다",
          "기존 Task를 전부 삭제한다",
          "선택 필드로 추가하고 값을 채울 규칙과 절차를 준비한다"
        ],
        2,
        "기존 값의 의미를 보존하려면 먼저 호환 가능한 구조를 추가하고 백필 기준을 정해야 합니다. 최종 필수 조건은 데이터가 준비된 뒤 강화합니다."
      ],
      "transfer": [
        "사용자 fullName을 givenName과 familyName으로 나누려 합니다. SQL 열 두 개를 추가하면 끝일까요?",
        [
          "아니다. 이름 분리 규칙·예외·앱 전환과 검증도 필요하다",
          "그렇다. DB가 모든 문화권 이름을 정확히 나눈다",
          "기존 fullName을 먼저 삭제하면 자동 복구된다"
        ],
        0,
        "구조를 바꾸는 것과 기존 데이터의 의미를 옮기는 것은 다른 작업입니다. 6장의 백필과 호환성 판단을 새로운 사례에 적용합니다."
      ],
      "details": [
        {
          "title": "6.1 이름이 비슷한 명령의 방향을 구분합니다",
          "body": "<table><thead><tr><th>명령</th><th>이 책에서의 용도</th><th>혼동할 점</th></tr></thead><tbody><tr><td>generate</td><td>스키마로 Client 생성</td><td>DB에 열을 추가하지 않음</td></tr><tr><td>migrate dev</td><td>개발 DB에서 변경 작성·적용</td><td>운영 DB용 명령이 아님</td></tr><tr><td>migrate deploy</td><td>준비된 migration 적용</td><td>임의의 데이터 백필을 발명하지 않음</td></tr><tr><td>db push</td><td>빠른 스키마 프로토타입</td><td>migration 이력을 만들지 않음</td></tr><tr><td>db pull</td><td>기존 DB를 스키마로 읽기</td><td>새 앱 API는 이후 생성해야 함</td></tr></tbody></table><p>db push로 만든 실험 상태를 곧바로 팀의 배포 이력이라고 부르지 마세요. 반대로 기존 DB를 처음 도입할 때는 이미 존재하는 구조를 migration의 기준점으로 정하는 baselining 검토가 필요할 수 있습니다. 기존 DB가 비어 있다고 가정하고 초기 생성 SQL을 무조건 실행하는 것은 별도 문제를 만들 수 있습니다.</p>"
        },
        {
          "title": "6.2 적용 전에 SQL을 읽습니다",
          "body": "<pre><code>npx prisma migrate dev --name add_owner --create-only\n# 새로 생성된 migration.sql을 읽고 필요한 데이터 이전을 검토\nnpx prisma migrate dev\nnpx prisma generate</code></pre><p>위 명령은 새 개발용 변경을 만드는 절차 예이며, 현재 예제 스키마를 수정하기 전에는 add_owner라는 변경을 만들 이유가 없습니다. 모델의 필드 이름을 바꾸었을 때 도구가 그것을 이름 변경으로 알아차리는지, 이전 열을 없애고 새 열을 만드는지 SQL을 확인해야 합니다. DROP COLUMN과 새 열 생성이 함께 보인다면 이전 값을 어떻게 보존하는지 질문하세요.</p><p>검토 대상은 지워지는 행·열, 새로운 NOT NULL·UNIQUE 제약, 기본값, 인덱스 생성과 외래 키 정책입니다. 애플리케이션의 필드 이름만 바꾸고 DB 열 이름은 유지하려는 요구라면 매핑 설정을 검토할 수 있습니다. 무엇이 바뀌어야 하는지를 먼저 정해야 적절한 변경 SQL을 선택할 수 있습니다.</p>"
        },
        {
          "title": "6.3 담당자 필드를 단계적으로 넣는 예",
          "body": "<p>첫 배포에서는 owner를 선택 필드로 추가합니다. 구버전 앱은 이 필드를 몰라도 기존 필드로 동작하고, 새 코드는 owner가 없을 때의 표시를 처리합니다. 다음에는 신뢰할 수 있는 원천에서 기존 Task의 담당자를 채우고, 채울 수 없는 행을 별도 목록으로 확인합니다. 새 작업을 만드는 경로도 owner를 쓰게 바꿔야 백필 중 누락이 다시 쌓이지 않습니다.</p><p>모든 쓰기 경로와 기존 행이 준비되었는지 확인한 뒤 필수 제약을 강화합니다. 오래된 이름을 대체하는 변경이라면 구버전 앱이 완전히 사라졌는지 확인한 후 옛 열을 제거합니다. 순서만 따르면 모든 DB에서 무중단이라는 뜻은 아닙니다. 실제 테이블 크기, DB의 DDL 동작, 잠금, 배포 방식과 허용 중단 시간을 별도로 시험해야 합니다.</p>"
        },
        {
          "title": "6.4 실패했을 때 되돌릴 것을 분명히 합니다",
          "body": "<p>코드를 이전 버전으로 돌리는 것과 데이터를 이전 상태로 복구하는 것은 같은 작업이 아닙니다. 새 버전이 옛 코드가 읽지 못하는 값을 이미 저장했다면 코드 롤백만으로 해결되지 않을 수 있습니다. 배포 전에 “어느 상태까지 되돌릴 수 있는가”와 “어떤 복구를 실제로 시험했는가”를 기록합니다.</p><p>작은 실습에서는 별도의 SQLite 복사본에 변경을 적용해 행 수와 주요 값을 비교할 수 있습니다. 운영에서는 해당 DB에 맞는 백업과 복구 절차가 필요합니다. 이 책은 운영 백업을 수행하지 않습니다. 구조 변경의 책임을 이해했으니, 다음 장에서는 구조가 같더라도 여러 쓰기 중 일부만 성공하는 경우를 다룹니다.</p>"
        }
      ],
      "source": [
        6,
        7,
        16
      ],
      "cross": [],
      "group": "변경과 검증",
      "time": "15분",
      "labs": [
        "migrations"
      ]
    },
    {
      "id": "transactions",
      "title": "실패와 재시도에도 일관성 유지하기",
      "subtitle": "함께 반영할 쓰기와 반복해서 들어오는 요청을 별도로 설계합니다.",
      "desc": "작업 상태를 바꾼 뒤 실행 기록 저장에 실패하면 무엇이 남을까요?",
      "recall": "2장의 고유 requestKey와 4장의 두 단계 쓰기를 떠올리세요. 중간 실패와 같은 요청의 재시도는 같은 문제일까요?",
      "paragraphs": [
        "작업을 완료 처리하고 Run을 저장하는 두 쓰기 사이에서 오류가 났습니다. 두 쓰기를 따로 실행했다면 완료 상태만 남거나 실행 기록만 남을 수 있습니다. 트랜잭션(transaction)은 정한 DB 연산들을 한 단위로 묶어, 커밋되거나 실패 시 롤백되도록 합니다. 이 책의 실험은 Task 상태를 먼저 바꾸고 Run 저장에서 실패하는 순서를 보여 줍니다. 로컬 history.ts는 Run 생성 후 Task 상태를 바꾸는 순서지만, 어느 쪽이든 두 DB 쓰기를 함께 반영해야 한다는 원리는 같습니다.",
        "트랜잭션이 성공했는데 네트워크가 끊겨 호출자가 응답을 못 받을 수도 있습니다. 호출자는 같은 요청을 다시 보냅니다. 새 트랜잭션이 매번 새 Run을 만들면 이력은 중복됩니다. 이때 필요한 것은 같은 요청을 다시 처리해도 정해진 결과가 달라지지 않게 하는 멱등성(idempotency) 설계입니다. 원자성은 한 번의 처리 안에서 부분 반영을 막고, 멱등성은 반복 요청의 의미를 정합니다. 서로 연결되지만 하나를 구현했다고 다른 하나까지 자동으로 갖춰지지는 않습니다."
      ],
      "formula": "원자성: 모두 반영 또는 모두 취소 / 멱등성: 같은 요청의 재처리 결과를 일관되게",
      "formulaNote": "이 책의 요청 키 실습은 같은 입력의 순차 재시도를 다룹니다. 동시에 시작한 요청, 외부 API와 DB 사이의 원자성, 모든 장애에서의 정확히 한 번 실행을 보장하지 않습니다.",
      "flow": [
        "요청 키 확인|이미 처리한 요청인가",
        "DB 쓰기 묶기|Run·Task 변경",
        "커밋 또는 롤백|부분 반영 방지",
        "응답 재사용|순차 중복 요청 처리"
      ],
      "warning": "이미 보낸 이메일이나 외부 결제 요청은 DB 롤백으로 취소되지 않습니다. 오래 걸리는 외부 호출을 transaction 안에 넣는다고 모든 시스템이 한 묶음이 되지 않습니다. 외부 부작용은 별도의 멱등 키·상태 조정·복구 설계가 필요합니다.",
      "quiz": [
        "transaction 안에서 Run과 Task 저장은 모두 성공했습니다. 같은 요청을 다시 보낼 때 새 Run을 만든다면 무엇이 아직 부족할까요?",
        [
          "필드 이름을 더 짧게 쓰는 일",
          "DB 연결을 요청마다 닫는 일",
          "요청을 식별하고 재처리 정책을 정하는 일"
        ],
        2,
        "트랜잭션은 한 처리의 원자성을 다룹니다. 새 처리로 들어온 중복 요청을 구분하려면 요청 키와 일관된 재응답 정책이 필요합니다."
      ],
      "transfer": [
        "DB transaction 중 외부 결제 API를 호출한 뒤 DB 쓰기가 실패했습니다. 올바른 판단은 무엇일까요?",
        [
          "DB 롤백만으로 결제도 반드시 취소된다",
          "외부 결제 상태를 확인하고 별도의 복구 정책을 적용해야 한다",
          "TypeScript 타입 검사로 결제 상태가 복구된다"
        ],
        1,
        "DB와 외부 결제 서비스는 같은 로컬 트랜잭션이 아닙니다. 외부 서비스의 멱등성·조회·취소 정책을 포함한 별도 설계가 필요합니다."
      ],
      "details": [
        {
          "title": "7.1 쓰기 사이의 의존성에 맞춰 API를 고릅니다",
          "body": "<table><thead><tr><th>상황</th><th>고려할 형태</th><th>AX 이력 예</th></tr></thead><tbody><tr><td>관계된 행을 함께 생성</td><td>nested write</td><td>Project와 첫 Task 생성</td></tr><tr><td>미리 정한 독립 쓰기들을 묶음</td><td>$transaction([...])</td><td>알려진 ID의 여러 Task 수정</td></tr><tr><td>앞 결과를 읽고 분기·다음 쓰기</td><td>$transaction(async tx =&gt; ...)</td><td>요청 키 확인 후 Run·Task 변경</td></tr></tbody></table><p>배열에 넣은 연산의 첫 결과에서 생성된 ID를 두 번째 배열 요소가 즉시 받아 사용하는 식으로 작성하지 않습니다. 결과 의존성이 있으면 nested write나 callback 안에서 await하는 형태를 선택합니다. callback 안에서는 같은 transaction의 tx 객체로 쿼리해야 합니다. 바깥의 db 객체로 쓰면 의도한 transaction 범위와 달라질 수 있습니다.</p>"
        },
        {
          "title": "7.2 의도적인 실패로 롤백을 관찰합니다",
          "body": "<pre><code>await db.$transaction(async tx =&gt; {\n  await tx.task.update({\n    where: { id: taskId },\n    data: { status: &quot;DONE&quot; },\n  });\n  throw new Error(&quot;학습용 중간 실패&quot;);\n});</code></pre><p>이 코드는 롤백을 보기 위한 학습 예이며 정상 업무 코드가 아닙니다. 예외를 받은 뒤 같은 Task를 다시 조회하여 원래 상태가 남았는지 확인합니다. 예외가 발생했다는 사실만 기록하면 데이터가 실제로 어떻게 되었는지 놓칩니다. 앞에서 쓴 데이터를 조회해 불변 조건을 확인하는 것이 테스트의 핵심입니다.</p><p>격리성은 동시에 실행되는 transaction이 서로의 중간 작업을 어떻게 보게 할지와 관련됩니다. 지원하는 격리 수준과 기본값은 DB마다 다릅니다. 이 예제의 SQLite 시험 결과를 PostgreSQL의 경쟁 조건 시험으로 대체할 수 없습니다. 충돌이나 잠금 오류에 재시도할 때도 무한 반복하지 말고 대상 오류·횟수·대기·최종 실패 응답을 정해야 합니다.</p>"
        },
        {
          "title": "7.3 요청 키를 저장하고 입력이 같은지 확인합니다",
          "body": "<pre><code>return db.$transaction(async tx =&gt; {\n  const previous = await tx.run.findUnique({\n    where: { requestKey },\n  });\n  if (previous) {\n    if (previous.taskId !== taskId || previous.success !== success) {\n      throw new Error(&quot;같은 키에 서로 다른 결과를 보낼 수 없습니다.&quot;);\n    }\n    return previous;\n  }\n  const run = await tx.run.create({\n    data: { taskId, requestKey, success },\n  });\n  await tx.task.update({\n    where: { id: taskId },\n    data: { status: success ? &quot;DONE&quot; : &quot;FAILED&quot; },\n  });\n  return run;\n});</code></pre><p>위 부분은 examples/src/history.ts의 핵심 로직을 설명한 것입니다. 함수의 입력 검사는 실제 파일에서 확인하세요. 같은 requestKey에 다른 작업 ID나 다른 성공 여부가 들어오면 기존 결과를 조용히 돌려주지 않고 거절합니다. 그렇지 않으면 호출자의 키 재사용 버그를 정상 재시도로 숨길 수 있습니다.</p><p>이 구현은 순차 재시도를 보여 줍니다. 두 요청이 동시에 “기존 기록 없음”을 읽는 경쟁에서는 고유 제약이 중복 저장을 막아도 한 호출이 오류로 끝날 수 있습니다. 그 오류를 어떤 응답으로 바꿀지, 충돌 후 기존 결과를 다시 읽을지, 키의 유효 기간과 입력 비교 범위를 어떻게 정할지는 운영 요구에 맞춰 더 설계해야 합니다. 동시성 해결을 이미 구현했다고 주장하지 않습니다.</p>"
        },
        {
          "title": "7.4 DB 밖으로 나가는 일을 분리합니다",
          "body": "<p>transaction을 열어 둔 채 긴 AI 응답을 기다리면 DB 자원을 오래 점유할 수 있습니다. 이력 저장의 목적이 “AI 작업을 수행한 결과를 기록”하는 것이라면 모델 호출과 짧은 DB 기록의 경계를 먼저 정합니다. 외부 호출이 끝났지만 DB 기록 전에 프로세스가 종료되는 경우도 별도로 다뤄야 합니다.</p><p>일반적인 확장 방식으로는 DB에 발송할 이벤트를 함께 기록한 뒤 별도 작업자가 전달하는 outbox 패턴이 있습니다. 이것도 수신 측 중복 처리와 재전송 정책이 필요합니다. 이 책은 outbox를 구현하지 않으며 현재 범위와 후속 설계 질문을 구분합니다. 다음 장에서는 정합성을 지킨 조회가 데이터 증가에 따라 어떤 비용을 갖는지 살펴봅니다.</p>"
        }
      ],
      "source": [
        8,
        15
      ],
      "cross": [
        [
          "AI 인프라와 운영 · 게이트웨이",
          "../aie-production/#gateway",
          "DB 요청 키로 다룬 재시도 문제를 서비스 호출의 제한·차단 정책과 연결합니다. 저장의 원자성과 외부 호출의 제어가 다른 책임인지 비교하고 돌아오세요."
        ]
      ],
      "group": "변경과 검증",
      "time": "18분",
      "labs": [
        "transactions"
      ]
    },
    {
      "id": "performance",
      "title": "조회 비용을 관찰하고 줄이기",
      "subtitle": "호출 횟수·반환량·실행 계획을 구분해서 비교합니다.",
      "desc": "관계 조회 API 한 번이면 DB 요청도 한 번일까요?",
      "recall": "5장에서 include의 결과 모양과 SQL 호출 수가 같지 않다고 했습니다. 어떤 수치를 관찰해야 차이를 알 수 있을까요?",
      "paragraphs": [
        "작업 목록이 10개일 때는 빨랐는데 100개가 되자 느려졌습니다. 먼저 Task 목록을 한 번 읽고 각 Task마다 Run을 별도로 읽는 코드를 작성했다면, 명시한 계획의 호출 수는 1+N입니다. N이 10이면 11회, 100이면 101회가 됩니다. 이것을 N+1 문제의 간단한 사례로 볼 수 있습니다. 화면 실험은 이런 고정된 조회 계획의 호출 수를 계산하며 실제 Prisma 최적화나 네트워크 지연을 측정하지 않습니다.",
        "호출 수를 줄이는 것만으로 성능을 판단할 수는 없습니다. 한 번에 거대한 결과를 읽으면 전송량과 메모리가 늘고, 인덱스를 쓰지 못하는 조건은 DB가 더 많은 행을 살펴보게 할 수 있습니다. 그래서 같은 입력 데이터와 같은 반환 요구를 고정한 뒤 호출 수, 결과 행·열 수, 실행 시간과 실행 계획을 함께 봅니다. 이 장에서는 호출 계획을 먼저 세고, 페이지네이션과 인덱스를 고르는 근거를 이어서 읽습니다."
      ],
      "formula": "반복 조회 계획 = 1 + N회 / 두 묶음 조회 계획 = N>0일 때 2회",
      "formulaNote": "Task 목록 1회 뒤 각 Task의 Run을 별도 조회하는 교육 계획과, 부모 목록·자식 묶음을 각각 조회하는 계획입니다. N=0이면 후자의 자식 조회를 생략해 1회입니다. 실제 ORM의 모든 관계 조회가 이 수와 같지는 않습니다.",
      "flow": [
        "반환 요구 고정|같은 행·필드 비교",
        "호출 계획 세기|반복 또는 묶음",
        "데이터량 제한|select·페이지 크기",
        "실제 DB 측정|SQL·실행 계획·시간"
      ],
      "warning": "“조회 두 번이 한 번보다 항상 느리다”거나 “인덱스가 있으면 항상 빠르다”고 단정하지 않습니다. 이 책은 제품 성능 순위를 제공하지 않으며 브라우저 모형의 계산값을 밀리초 성능으로 환산하지 않습니다.",
      "quiz": [
        "Task 20개를 한 번 조회하고 각 Task의 Run을 한 번씩 따로 조회하는 고정 계획은 몇 회일까요?",
        [
          "20회",
          "2회",
          "21회"
        ],
        2,
        "부모 목록 1회와 자식 조회 20회를 더해 21회입니다. 이 결과는 명시한 계획의 계산이며 실제 Prisma가 이 계획을 그대로 수행한다는 주장과 다릅니다."
      ],
      "transfer": [
        "게시글 50개에 댓글을 모두 붙이는 화면이 느립니다. 호출 수만 51회에서 2회로 줄였습니다. 무엇을 추가로 확인해야 할까요?",
        [
          "호출 수가 줄었으니 검증은 끝이다",
          "반환한 댓글 수·전송량·실행 계획과 실제 시간을 함께 본다",
          "댓글 내용을 전부 로그에 남기면 충분하다"
        ],
        1,
        "묶음 조회가 많은 데이터를 가져올 수 있으므로 동일한 결과 요구 아래 여러 비용을 함께 비교해야 합니다. 로그에 민감한 내용을 무조건 남기지 않습니다."
      ],
      "details": [
        {
          "title": "8.1 두 계획의 차이를 코드에서 찾습니다",
          "body": "<pre><code>// 교육용 반복 조회: N개의 Task마다 별도 조회\nconst tasks = await db.task.findMany({\n  where: { projectId: trustedProjectId },\n});\nfor (const task of tasks) {\n  const runs = await db.run.findMany({ where: { taskId: task.id } });\n  // 필요한 표시 처리\n}</code></pre><p>실제 코드에서는 불필요한 반복 조회를 없애거나, 필요한 관계만 함께 읽거나, 알려진 ID들을 묶어 조회하는 대안을 검토합니다. 어떤 대안이 어떤 SQL을 내는지 확인하기 전에는 include가 해결했다고 끝내지 않습니다. 묶음의 크기가 매우 크면 다른 비용이 생길 수 있고, 서로 다른 DB·adapter에서 같은 방식의 성능을 기대해서도 안 됩니다.</p>"
        },
        {
          "title": "8.2 전체 목록 대신 안정적인 페이지를 읽습니다",
          "body": "<pre><code>const first = await db.task.findMany({\n  where: { projectId: trustedProjectId },\n  orderBy: { id: &quot;asc&quot; },\n  take: 10,\n});\nconst last = first.at(-1);\nconst next = last ? await db.task.findMany({\n  where: { projectId: trustedProjectId },\n  orderBy: { id: &quot;asc&quot; },\n  cursor: { id: last.id },\n  skip: 1,\n  take: 10,\n}) : [];</code></pre><p>skip: 1은 기준 cursor 행을 다음 페이지에서 다시 포함하지 않으려는 선택입니다. 이 예는 고유 id 오름차순이라는 단순한 정렬을 사용합니다. createdAt처럼 같은 값이 여러 행에 생기는 필드를 기준으로 페이지를 나누면 안정적인 순서와 동률 처리까지 설계해야 합니다. 페이지 사이에 추가·삭제가 일어나도 모든 화면이 하나의 고정 스냅숏처럼 보장되는 것은 아닙니다.</p><p>offset 방식의 skip·take는 번호가 있는 페이지로 바로 이동하기 쉽지만 깊은 offset의 비용을 확인해야 합니다. cursor 방식이 적합한지 여부는 탐색 UI, 정렬 기준, 데이터 변화와 DB 실행 계획에 달려 있습니다. “최신 방식”이라는 이유만으로 바꾸지 말고 사용자의 이동 요구와 측정값을 연결하세요.</p>"
        },
        {
          "title": "8.3 복합 인덱스는 자주 쓰는 조건에서 출발합니다",
          "body": "<p>Task의 예제 인덱스는 [projectId, status, id] 순서입니다. 프로젝트와 상태를 제한하고 ID 순서로 읽는 요청을 염두에 둡니다. 다른 조건이나 정렬로 읽으면 같은 효과를 기대할 수 없습니다. 인덱스는 자료를 유지하는 비용도 있으므로 가능한 조합마다 무작정 추가하지 않습니다.</p><p>먼저 대표 쿼리와 데이터 분포를 고정하고 DB가 선택한 계획을 확인합니다. 적은 데이터에서 차이가 없었다면 인덱스가 무의미하다고 단정하기보다 현재 규모에서는 차이를 관찰하지 못했다고 기록합니다. 반대로 몇 개의 합성 행으로 얻은 결과를 운영 대용량에서의 속도 보장으로 넓히지 않습니다.</p>"
        },
        {
          "title": "8.4 쿼리 로그와 연결 수명을 확인합니다",
          "body": "<pre><code>const db = new PrismaClient({\n  adapter,\n  log: [&quot;query&quot;, &quot;warn&quot;, &quot;error&quot;],\n});</code></pre><p>위 코드는 구성 위치를 보여 주는 예입니다. adapter는 3장의 방식으로 준비합니다. 학습용 데이터에서 쿼리 로그를 켜 API 호출과 실행된 요청을 대조할 수 있습니다. 운영 로그에는 입력·식별자·민감한 데이터가 포함될 수 있으므로 수집 범위와 마스킹을 정해야 합니다. 측정에는 워밍업, 반복 횟수, 데이터 크기와 실행 환경을 함께 남깁니다.</p><p>장기 실행 서버에서 요청마다 새 Client를 만들면 DB 연결 자원을 불필요하게 늘릴 수 있습니다. 보통 애플리케이션의 수명에 맞춰 재사용하며, serverless에서는 동시에 살아 있는 인스턴스 수까지 고려합니다. 이 책의 SQLite는 네트워크 DB 연결 풀의 부하 실험이 아닙니다. 필요한 데이터와 측정 범위를 정했으니 이제 결과가 올바르고 권한을 지키는지 검증하겠습니다.</p>"
        }
      ],
      "source": [
        9,
        14,
        15
      ],
      "cross": [
        [
          "알고리즘과 자료구조 · 색인",
          "../algorithms/#index",
          "자료구조에 따라 찾아볼 범위가 달라지는 원리를 더 배웁니다. 역색인·ANN을 관계형 DB 인덱스와 동일한 구조로 보지 말고, 검색 비용을 설명하는 관점을 비교하세요."
        ]
      ],
      "group": "변경과 검증",
      "time": "15분",
      "labs": [
        "performance"
      ]
    },
    {
      "id": "testing",
      "title": "테스트와 권한 검사로 데이터 경계 지키기",
      "subtitle": "타입·입력·권한·DB 제약을 서로 다른 검사로 확인합니다.",
      "desc": "존재하는 작업 ID만 알면 누구나 상태를 바꿔도 될까요?",
      "recall": "1장의 세 판단과 7장의 실패 처리를 떠올리세요. 타입이 맞고 transaction이 성공해도 업무상 잘못된 변경이 있을까요?",
      "paragraphs": [
        "프로젝트 A 사용자가 프로젝트 B의 작업 ID를 보내왔습니다. ID는 숫자이고 DB에도 존재합니다. 타입 검사와 외래 키 제약을 통과하더라도 수정 권한은 별개입니다. 서버는 인증한 사용자에게 허용된 프로젝트 문맥을 구하고, 변경 쿼리의 조건에 그 범위를 넣어야 합니다. 요청 본문에 들어 있는 projectId를 그대로 믿으면 사용자가 다른 ID를 적어 권한을 우회할 수 있습니다.",
        "테스트도 질문에 맞는 층에서 작성합니다. 입력 검증의 분기를 확인하는 단위 테스트와, 실제 DB에서 고유 제약·외래 키·롤백·migration을 확인하는 통합 테스트는 서로를 완전히 대체하지 못합니다. mock이 원하는 값을 돌려주도록 만들면 DB가 실제로 거절할 조건도 통과한 것처럼 보일 수 있습니다. 이 장은 정상 요청뿐 아니라 없는 행·중복 키·다른 프로젝트·실패 주입을 검증 항목으로 정합니다."
      ],
      "formula": "변경 조건 = 작업 ID + 서버가 확인한 프로젝트 범위 / 기대 변경 수 = 1",
      "formulaNote": "trustedProjectId는 인증·인가 계층이 확인한 값이라는 전제입니다. 이 예제는 그 계층 자체를 구현하지 않습니다. count가 0이면 권한 범위 안에서 대상을 변경하지 못한 것입니다.",
      "flow": [
        "입력 검사|ID·허용 상태 확인",
        "권한 문맥|서버가 프로젝트 결정",
        "조건부 변경|id와 projectId 함께",
        "결과 검사|바뀐 행 수 확인"
      ],
      "warning": "TypeScript 타입 단언이나 any는 외부 JSON을 검증하지 않습니다. select로 민감한 필드를 숨기는 일, 권한 범위를 제한하는 일, SQL 주입을 막는 일도 서로 다릅니다. “타입 안전”이라는 한 표현으로 묶지 않습니다.",
      "quiz": [
        "요청 본문에 taskId: 7, projectId: 2가 들어 있습니다. 어떤 값을 권한 범위로 사용해야 할까요?",
        [
          "요청의 projectId를 그대로 믿는다",
          "가장 작은 프로젝트 ID를 쓴다",
          "서버가 인증·인가 결과로 확인한 프로젝트 범위를 쓴다"
        ],
        2,
        "클라이언트가 주장한 프로젝트와 서버가 허용한 프로젝트는 다릅니다. 권한의 근거는 신뢰한 서버 문맥이어야 합니다."
      ],
      "transfer": [
        "부서별 문서 수정 함수를 mock DB로만 테스트했습니다. 실제 DB 통합 검사에서 추가로 확인할 것은 무엇일까요?",
        [
          "외래 키·고유 제약·트랜잭션 롤백과 실제 변경 범위",
          "함수 이름이 짧은지 여부만",
          "mock이 늘 성공하도록 설정했는지 여부"
        ],
        0,
        "DB가 관여하는 제약과 쓰기 결과는 실제 격리 DB에서 확인해야 합니다. 단위 테스트의 통과를 DB 동작의 증거로 대체하지 않습니다."
      ],
      "details": [
        {
          "title": "9.1 런타임 입력을 허용 목록으로 좁힙니다",
          "body": "<p>외부 입력은 unknown처럼 아직 확인하지 않은 값으로 다루고, ID가 유효한 정수인지와 상태가 허용 목록에 있는지를 검사합니다. 빈 문자열을 숫자로 바꾸었더니 0이 되는 식의 암묵적 변환도 주의합니다. API에서 어떤 형식의 ID를 받을지 정한 뒤 변환·검증 순서를 명시하세요.</p><pre><code>const allowed = [&quot;TODO&quot;, &quot;DONE&quot;, &quot;FAILED&quot;];\nif (!Number.isSafeInteger(taskId) || taskId &lt; 1) {\n  throw new Error(&quot;유효한 작업 ID가 필요합니다.&quot;);\n}\nif (typeof status !== &quot;string&quot; || !allowed.includes(status)) {\n  throw new Error(&quot;허용되지 않은 상태입니다.&quot;);\n}</code></pre><p>이 검사는 문자열 목록에 포함되는지 확인합니다. TODO에서 DONE으로만 갈 수 있는지 같은 상태 전이 규칙까지 검증하는 것은 아닙니다. 업무에서 중간 상태나 재실행 조건이 필요하면 이전 상태를 조건에 넣고 경쟁 요청도 시험해야 합니다. 검사가 무엇을 다루지 않는지 명시하면 이후 확장할 지점이 보입니다.</p>"
        },
        {
          "title": "9.2 권한 범위와 변경 대상을 한 쿼리에 둡니다",
          "body": "<pre><code>const changed = await db.task.updateMany({\n  where: { id: taskId, projectId: trustedProjectId },\n  data: { status },\n});\nif (changed.count !== 1) {\n  throw new Error(&quot;작업이 없거나 변경 범위 밖입니다.&quot;);\n}</code></pre><p>실행 가능한 예제는 examples/src/scoped-update.ts의 changeStatusForProject입니다. 해당 함수는 검증된 프로젝트 문맥을 받는 저장 계층 함수이며 로그인·세션·역할 관리를 구현한 전체 API가 아닙니다. 호출하는 계층이 사용자 입력을 trustedProjectId라는 이름으로 바꿔 전달하기만 하면 안전해지는 것이 아닙니다.</p><p>대상을 먼저 읽어 권한을 확인하고 나중에 별도 조건 없이 수정하면, 두 시점 사이의 변경을 어떻게 처리할지도 고려해야 합니다. 이 예제는 최종 수정 조건에도 범위를 포함합니다. 더 복잡한 업무에서는 버전 필드나 이전 상태 조건, transaction 등으로 동시 변경의 의미를 정해야 합니다.</p>"
        },
        {
          "title": "9.3 값 파라미터와 SQL 문자열을 구분합니다",
          "body": "<pre><code>const status = &quot;DONE&quot;;\nconst rows = await db.$queryRaw`\n  SELECT id, title FROM Task WHERE status = ${status}\n`;</code></pre><p>이 예제의 ${status}는 tagged template의 값 파라미터입니다. 사용자 입력을 SQL 문자열에 직접 이어 붙여 실행하는 방식과 다릅니다. 테이블이나 열 이름 같은 SQL 식별자를 값 파라미터 자리에 넣는다고 동적으로 선택할 수 있는 것은 아닙니다. 식별자를 바꿔야 한다면 신뢰한 허용 목록으로 선택하고 구체적인 API 제약을 확인해야 합니다.</p><p>Raw SQL의 반환 타입을 원하는 형태로 선언했다고 DB의 실제 반환값을 모두 검증한 것은 아닙니다. 처음에는 필요한 부분을 Client API로 작성하고, 표현할 수 없는 쿼리나 측정으로 확인한 최적화 요구가 있을 때 TypedSQL이나 raw query를 검토합니다. Unsafe라는 이름이 없는 메서드도 문자열을 부적절하게 구성하면 안전하다고 단정할 수 없습니다.</p>"
        },
        {
          "title": "9.4 실패 조건을 먼저 적고 테스트를 실행합니다",
          "body": "<table><thead><tr><th>조건</th><th>예상 결과</th><th>확인할 데이터</th></tr></thead><tbody><tr><td>같은 Project.key를 두 번 생성</td><td>두 번째 쓰기 거절</td><td>프로젝트 수가 늘지 않음</td></tr><tr><td>없는 projectId로 Task 생성</td><td>저장 거절</td><td>고아 작업 없음</td></tr><tr><td>transaction 중 실패 주입</td><td>쓰기 취소</td><td>원래 Task 상태 유지</td></tr><tr><td>다른 프로젝트 범위로 수정</td><td>변경 0건·거절</td><td>타 프로젝트 상태 유지</td></tr><tr><td>같은 요청 키·다른 입력</td><td>충돌 거절</td><td>기존 결과 유지</td></tr></tbody></table><p>제공된 npm test는 별도 임시 SQLite DB에 migration을 적용하여 통합 검사를 수행하도록 구성됩니다. 운영 DB를 비우는 테스트가 아닙니다. 실제 실행 결과와 환경은 <a href=\"docs/local-lab.html\">로컬 실습 검증 기록</a>에서 확인하세요. 테스트가 통과했다고 PostgreSQL의 잠금·네트워크 장애·동시 요청까지 검증한 것은 아닙니다. 마지막 장에서는 이 조건들을 하나의 요구사항으로 묶어 자신의 설계를 설명합니다.</p>"
        }
      ],
      "source": [
        10,
        11,
        15
      ],
      "cross": [],
      "group": "변경과 검증",
      "time": "15분",
      "labs": [
        "testing"
      ]
    },
    {
      "id": "final",
      "title": "AX 작업 이력 저장소 완성하기",
      "subtitle": "스키마·조회·변경·실패 검증을 한 설계로 연결합니다.",
      "desc": "정상 저장 한 번이 성공하면 이 시스템을 완성했다고 할 수 있을까요?",
      "recall": "Project·Task·Run을 나눈 이유, generate와 migrate의 차이, 원자성과 멱등성, 권한 범위가 각각 어떤 문제를 해결했는지 한 문장씩 떠올리세요.",
      "paragraphs": [
        "처음에는 배열의 작업 목록을 다음 날 다시 읽는 것이 목표였습니다. 이제는 프로젝트별 작업과 실행 기록을 연결하고, 필요한 결과만 조회하며, 구조가 바뀌어도 기존 값을 보존하는 순서를 설명할 수 있습니다. 마지막 과제는 앞 장의 메서드 이름을 나열하는 문제가 아닙니다. 중복 요청·중간 실패·다른 프로젝트의 요청을 동시에 고려해 각 조건을 어느 층에서 지킬지 설계하는 문제입니다.",
        "가상의 프로젝트 A에 Task T가 있습니다. 실행 결과 요청 R을 받았고 DB 저장은 성공했지만 응답이 유실되어 R이 다시 들어왔습니다. 별도 시험에서는 첫 DB 쓰기 뒤 오류를 주입합니다. 또 프로젝트 B의 사용자 문맥이 T를 완료 상태로 바꾸려 합니다. 각각에서 남아야 할 데이터와 반환할 응답을 먼저 적은 뒤 코드를 확인하세요. 브라우저 실험의 통과는 정의한 교육 시나리오의 결과이며 운영 출시 승인이 아닙니다."
      ],
      "formula": "완성 기록 = 요구사항 + 보장하는 조건 + 실패 테스트 + 남은 검증",
      "formulaNote": "설계와 증거를 연결합니다. “중복을 막았다” 대신 어떤 키·어떤 입력·순차 또는 동시 조건에서 확인했는지 적습니다.",
      "flow": [
        "요구사항|저장·재시도·권한",
        "설계 선택|제약·쿼리·transaction",
        "실패 주입|남은 데이터 확인",
        "인계 기록|근거와 미검증 범위"
      ],
      "warning": "이 교재의 예제를 실제 사내 시스템에 그대로 배포하는 것을 최종 과제로 삼지 않습니다. 인증 계층·운영 DB·감사·백업·동시성·관측 요구가 아직 별도로 남아 있습니다. 이 한계를 구체적으로 적는 것도 설계 능력입니다.",
      "quiz": [
        "같은 요청의 순차 재시도는 통과했지만 동시 요청을 실행하지 않았습니다. 올바른 완료 기록은 무엇일까요?",
        [
          "모든 장애에서 정확히 한 번 실행을 보장했다",
          "순차 재시도에서 중복 기록이 없음을 확인했고 동시성 검증은 남았다",
          "동시성 검증이 없으므로 확인한 결과도 모두 지운다"
        ],
        1,
        "실제로 검증한 범위와 남은 범위를 나누어 적습니다. 확인한 사실은 보존하되 더 넓은 보장으로 확대하지 않습니다."
      ],
      "transfer": [
        "회의실 예약 시스템으로 이 설계를 옮깁니다. 같은 요청 키의 중복을 막으면 같은 시간대의 서로 다른 예약도 모두 막힐까요?",
        [
          "그렇다. requestKey 하나면 모든 업무 충돌을 막는다",
          "아니다. 요청 중복과 시간대 충돌은 별도 제약·동시성 문제다",
          "예약 제목을 고유하게 만들면 모든 충돌이 사라진다"
        ],
        1,
        "멱등 키는 같은 요청을 구분합니다. 다른 요청 사이의 자원 충돌은 업무 규칙과 DB 동시성 설계가 추가로 필요합니다."
      ],
      "details": [
        {
          "title": "10.1 요구사항을 검증 가능한 문장으로 씁니다",
          "body": "<ol><li>Project.key는 중복되지 않고 각 Task는 존재하는 Project에 속합니다.</li><li>같은 requestKey와 같은 입력을 순서대로 다시 보내면 같은 Run을 반환하고 개수가 늘지 않습니다.</li><li>같은 requestKey에 다른 taskId 또는 success를 보내면 충돌을 거절합니다.</li><li>Run 생성과 Task 상태 변경 사이에 오류가 나면 두 DB 쓰기가 함께 취소됩니다.</li><li>서버가 확인한 프로젝트 범위 밖의 Task는 수정되지 않습니다.</li><li>담당자 필드를 추가한다면 기존 행과 구버전 앱이 함께 있는 동안의 변경 순서를 설명합니다.</li></ol><p>이 목록은 책의 교육용 완료 기준입니다. 실행 요청 접수와 실제 외부 작업 수행을 하나의 정확히 한 번 동작으로 보장한다는 요구는 포함하지 않습니다. 프로젝트 A가 동시에 같은 키를 보냈을 때의 응답 정책도 후속 검증 항목으로 남깁니다.</p>"
        },
        {
          "title": "10.2 예제 파일을 역할에 따라 읽습니다",
          "body": "<table><thead><tr><th>파일</th><th>읽을 질문</th></tr></thead><tbody><tr><td>examples/prisma/schema.prisma</td><td>어떤 중복과 잘못된 관계를 DB가 막는가?</td></tr><tr><td>examples/prisma7.config.ts</td><td>CLI가 어느 DB에 변경을 적용하는가?</td></tr><tr><td>examples/src/db.ts</td><td>실행 코드가 같은 DB를 사용하는가?</td></tr><tr><td>examples/src/history.ts</td><td>요청 키·입력 비교·transaction 범위가 어디인가?</td></tr><tr><td>examples/src/scoped-update.ts</td><td>신뢰한 프로젝트 문맥이 최종 변경 조건에 있는가?</td></tr><tr><td>examples/src/integration.test.ts</td><td>실패 뒤 실제 데이터를 어떻게 확인하는가?</td></tr></tbody></table><p>각 파일에서 답을 찾은 줄을 자신의 말로 설명하세요. 코드에 같은 이름이 있다는 것보다 요구사항과 구현 조건이 일치하는지가 중요합니다. 인증 계층을 구현하지 않은 함수가 trustedProjectId를 인자로 받는다는 사실도 기록합니다.</p>"
        },
        {
          "title": "10.3 세 가지 실패를 직접 비교합니다",
          "body": "<p>첫째, 정상 실행과 같은 키 재시도를 비교하여 Run 개수와 반환 ID를 적습니다. 둘째, transaction 안의 첫 쓰기 뒤 실패를 주입한 경우와 개별 쓰기를 비교하여 어떤 상태가 남는지 적습니다. 셋째, 대상 Task와 다른 trustedProjectId를 주어 변경 건수와 최종 상태를 확인합니다. 화면 모형과 실제 로컬 코드의 쓰기 순서는 7장에 적힌 차이를 고려하세요.</p><p>실패하면 먼저 기대 조건이 잘못됐는지, 코드가 조건을 지키지 못했는지, 실습 환경이 다른지 구분합니다. 오류를 없애려고 검사를 제거하면 학습 과제의 목적도 사라집니다. 재현 입력과 실제 DB 상태를 남기고 관련 장으로 돌아가 설명을 수정합니다. 새 운영 기능을 계속 더하는 대신 현재 조건을 분명히 검증하는 데 집중합니다.</p>"
        },
        {
          "title": "10.4 한 장의 설계 기록을 완성합니다",
          "body": "<p>기록에는 데이터 모델의 각 행 의미와 키 범위, 대표 조회와 반환 모양, 함께 커밋할 쓰기, 순차 재시도의 처리, 신뢰한 권한 문맥의 출처, migration 적용 순서, 통과한 테스트와 남은 테스트를 적습니다. 성능은 측정한 조건과 함께 쓰고, 측정하지 않았다면 “아직 측정하지 않았다”고 적습니다.</p><p>다음 단계로 PostgreSQL을 사용한다면 접속·타입·migration SQL·제약·격리 수준·동시 요청·연결 수와 실제 실행 계획을 다시 확인합니다. provider 문자열만 바꾸어 같은 결과가 자동으로 보장된다고 가정하지 않습니다. 이제 Prisma를 아는 기준은 메서드 수가 아니라, 저장할 의미와 지킬 조건을 코드·DB·검증에 나누어 설명할 수 있는가입니다.</p>"
        }
      ],
      "source": [
        0,
        8,
        10
      ],
      "cross": [
        [
          "AI 인프라와 운영 · 장애 대응",
          "../aie-production/#incident",
          "DB 내부의 실패 테스트를 서비스 전체의 관측·장애 실험과 연결합니다. 무엇을 감지하고 어떻게 복구할지 설계를 확장한 뒤 현재 저장소의 미검증 항목을 다시 점검하세요."
        ]
      ],
      "group": "마지막 과제",
      "time": "18분",
      "labs": [
        "final"
      ]
    }
  ]
};
