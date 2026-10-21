# Prisma 교과서
루트 AGENTS.md와 docs/08-book-template.html을 따릅니다.
- 본문 기준: Prisma ORM 7.10.1, TypeScript, SQLite. 다른 주 버전 문법을 혼합하지 않습니다.
- 공통 사례: Project → Task → Run. 실제 업무 데이터가 아닌 학습용 합성 데이터입니다.
- js/math.js는 브라우저 교육 모형이며 실제 Prisma SQL 엔진이 아닙니다. 실제 실행은 examples/에 분리합니다.
- js/content.js와 review.json은 원고, js/labs-*는 UI, js/math.js는 순수 모형입니다.
- 변경 뒤 npm test, node tests/browser.cjs를 실행합니다. 독립 검수 뒤 공개합니다.
- 함수는 100줄 이내, UI는 320px·키보드·밝은/어두운 테마를 확인합니다.
