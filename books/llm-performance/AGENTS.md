# LLM 추론 최적화
- 루트 AGENTS.md와 docs/08-book-template.html을 따른다. 변경 전 docs/plan.html을 읽는다.
- 시스템 이해편의 후속권이다. 회의록 요약 서비스 한 사례를 측정 → 커널 → 메모리 → 서비스로 잇는다.
- 브라우저 계산, 가상 측정 기록, 실제 GPU 실행을 명확히 구분한다. 모든 수치에 단위를 붙인다.
- PBook/PMath/PUI/PLabs/PHome/PGuides/PFigures 접두어를 사용한다. 공통 글꼴 외에 다른 책의 런타임을 가져오지 않는다.
- 실행 예제는 CPU/GPU 경로를 구분하며 실행하지 않은 장비의 성능을 단정하지 않는다.
- 함수는 100줄 이하. npm test, Python 예제 테스트, tests/browser.cjs 및 루트 검사기를 실행한다.
