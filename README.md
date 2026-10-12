# Jdeok.Lee의 서재

질문에서 시작해 읽고, 실험하고, 이해를 쌓는 학습 서재입니다.

**[서재 열기 →](https://ljd6805.github.io/my-bookshelf/)** · [저장소](https://github.com/ljd6805/my-bookshelf)

GitHub Pages는 `main` 브랜치의 루트에서 자동 배포합니다. 별도 패키지 설치 없이 정적 HTML·CSS·JavaScript로 작동합니다.

- [서재 메인페이지](index.html): 맑은 색유리 서가, 명조체 제목 라벨, 책 펼침, 검색·분류, 학습 책 목록
- [분석 리포트](reports/2026-10-07-euiyun-analysis.html) · [32개 책의 개별 관찰](reports/book-by-book.html)
- [전체 페이지 목록](reports/page-inventory.html)
- [집필·시각화 기준](docs/01-library-charter.html) · [Codex·Claude 협업 규칙](docs/02-collaboration.html)
- [서재 구성과 책 추가 방법](docs/04-site-plan.html) · [검증 기록](docs/03-verification.html)

- [유리 서가 디자인 기준](docs/05-glass-library-design.html) · [구현·검증·문제 해결 기록](docs/06-glass-library-implementation.html)
- [책 구성 표준 · AI Book 기준](docs/08-book-template.html): 모든 책이 따르는 화면 배치와 장 구조

## 책과 자료 추가

`data/catalog.json`이 자료와 책 목록의 원본입니다. 항목을 수정한 뒤 아래 명령을 실행하고 변경된 카탈로그와 `index.html`을 함께 커밋합니다.

```sh
python3 scripts/build_catalog.py
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
node --test tests/test_shelf_model.mjs
```

`books`의 상태는 `planned`, `writing`, `published`입니다. 책은 `books/주제/`에서 관리하고 공개된 책은 `books/ai/`처럼 저장소 루트 기준 상대 경로를 등록합니다. 모든 책에서 이 서재로 돌아오는 링크를 제공합니다. 첫 학습 책은 [AI Book · 직접 실험하는 AI 교과서](https://ljd6805.github.io/my-bookshelf/books/ai/)입니다. 구축·운영 문서는 지식자료 카탈로그에 등록하지 않습니다.

책등에는 선택 항목 `spine_title`(권장 4~6글자), `spine_category`, `color`를 사용할 수 있습니다. 색은 aqua, blue, violet, sage, amber, rose, plum입니다. JavaScript 없이도 모든 자료 링크가 정적 HTML에 들어 있습니다. 카탈로그가 메인페이지와 다르면 검증 명령이 실패합니다.

## 협업

Codex와 Claude의 공통 지침은 `AGENTS.md`, Claude 진입점은 `CLAUDE.md`입니다. 시작할 때 `data/work-state.json`과 운영 문서를 읽고, 완료·검증·남은 일을 기록합니다. 이 파일들은 계정이나 저장소 접근 권한을 부여하지 않습니다.

로컬 미리보기:

```sh
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000/ 을 엽니다.

분석 기준일: 2026-10-07. 원본: https://books.euiyun.com/ 및 연결된 책들. 참조 사이트의 원문 전체와 구현 코드는 포함하지 않습니다. 조사 화면의 출처와 권리는 [자료 출처](evidence/attribution.html)를 참고하세요.

## 도서 통합 운영

서가와 책은 이 저장소에서 함께 개발·배포합니다. [통합 계획·검증](docs/07-book-integration.html), [AI 책 개발 안내](books/ai/README.md)를 참고하세요. 책별 문서·자산·테스트는 해당 책 폴더에 둡니다. 이전 AI 저장소는 보존하지만 이후 수정은 `books/ai/`에서 진행합니다.

```sh
npm test --prefix books/ai
```
