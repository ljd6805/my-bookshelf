# 나만의 서재

학습 콘텐츠를 이야기와 실험으로 연결하기 위한 서재 허브입니다.

[문서 허브](index.html)에서 시작하세요.

- [원 사이트 분석 리포트](reports/2026-10-07-euiyun-analysis.html)
- [32개 책의 개별 관찰](reports/book-by-book.html)
- [전체 페이지 목록](reports/page-inventory.html)
- [집필·시각화 기준](docs/01-library-charter.html)
- [Codex·Claude 협업 규칙](docs/02-collaboration.html)
- [검증과 남은 일](docs/03-verification.html)

GitHub 파일 화면에서는 HTML이 코드로 보일 수 있습니다. 로컬에서 index.html을 열거나 정적 서버로 확인하세요.

```sh
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000/ 을 엽니다. 별도 패키지 설치는 필요하지 않습니다.

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
```

공통 지침은 AGENTS.md, Claude 진입점은 CLAUDE.md입니다. 이 파일들은 계정이나 저장소 접근 권한을 부여하지 않습니다.

현재 첫 학습 책은 미등록 상태입니다. 각 책을 독립 저장소·GitHub Pages로 만들고 data/catalog.json으로 연결할 수 있습니다. Pages는 아직 배포하지 않았으며 배포 완료를 가정한 주소는 기록하지 않았습니다.

분석 기준일: 2026-10-07. 원본: https://books.euiyun.com/ 및 연결된 책들. 참조 사이트의 원문 전체와 구현 코드는 포함하지 않습니다. screenshots는 출처가 명시된 분석 증거이며 원 저작물의 권리는 해당 저작자에게 있습니다. evidence/attribution.html을 참고하세요.
