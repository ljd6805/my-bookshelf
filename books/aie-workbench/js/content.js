/* 책의 모든 글. 화면 코드는 없다. 원본: rohitg00/ai-engineering-from-scratch (MIT, 확인일 2026-10-08)의 Phase 0을 한국어로 재구성했다. 원문과 코드를 옮기지 않았다. */
window.A01Book={
meta:{
 short:'AI 개발 작업대',title:'AI 개발 작업대 · 환경 점검에서 디버깅까지',eyebrow:'AI ENGINEERING FROM SCRATCH / 01',
 hero:['AI 프로젝트의 작업대를','점검하고, 고치고, 다시 만듭니다.'],
 lead:'영화 리뷰 감성 분류 프로젝트 review-lab 하나를 노트북에서 시작해 빌린 GPU 상자와 팀원의 컴퓨터에서 같은 결과로 다시 돌립니다. 장마다 작업대에 도구를 하나씩 올리고, 그 도구가 막아 주는 실패를 직접 계산해 봅니다.',
 feature:['debug','프로파일러로 병목 찾기'],stat:['12','원본 레슨 재구성'],
 flowTitle:'프로젝트 하나를 세 대의 컴퓨터에서 재현합니다',flowLead:'review-lab은 내 노트북, 빌린 GPU 상자, 팀원의 상자를 차례로 거칩니다.',
 flow:['기초 공사|점검·가상 환경·Git으로 바탕을 다진다','계산 자원|GPU를 고르고 원격 리눅스 상자와 도커로 옮긴다','작업 습관|키·노트북·데이터 분할에서 새는 곳을 막는다','진단|측정으로 병목과 조용한 버그를 찾는다','마지막 과제|팀원의 고장 보고에 확인 순서를 세운다'],
 paths:[
  {title:'처음 AI 프로젝트를 시작한다면',desc:'점검, 가상 환경, Git, GPU 선택까지 순서대로 읽으며 첫 작업대를 갖춥니다.',chapters:['stack','envs','git','gpu']},
  {title:'원격 GPU에서 학습을 돌려야 한다면',desc:'빌린 리눅스 상자에서 학습을 살려 두고, 도커로 환경을 옮기고, 비용을 계산합니다.',chapters:['gpu','remote','docker','debug']},
  {title:'결과가 재현되지 않아 곤란하다면',desc:'노트북의 숨은 상태, 데이터 분할의 시드, 확인 순서를 따라 원인을 좁힙니다.',chapters:['notebook','data','debug','final']}
 ],
 sourcesLead:'원본 커리큘럼 AI Engineering from Scratch의 Phase 0(설정과 도구) 레슨 12개를 읽고, 개념과 순서만 참고해 한국어로 새로 썼습니다. 레슨마다 원본 폴더 링크를 출처로 두었습니다. 제품 이름·가격·버전은 원본 커리큘럼 기준이며 확인일은 2026-10-08입니다.',
 note:'<strong>실험의 경계</strong><br>이 책의 실험은 실제 도구를 실행하지 않습니다. 원본 레슨의 규칙(경로별 필수 검사, CUDA 버전 비교, 권한 비트, 층 캐시, 70·10·20 분할 등)은 브라우저 안에서 실제로 계산하고, 빌드 시간·점검 시간·파일 크기 같은 숫자는 교육용 가정값으로 둡니다. 실험마다 어느 쪽인지 결과 문장에 밝혔습니다. 측정한 성능 수치가 아니므로 내 장비의 결과는 직접 재어 확인해야 합니다.',
 glossary:[['가상 환경 (virtual environment)','프로젝트마다 따로 두는 Python 해석기와 패키지 폴더. 운영체제와 드라이버는 공유합니다.'],['잠금 파일 (lockfile)','간접 의존성까지 정확한 버전을 적은 파일. Git에 올려 같은 설치를 재현합니다.'],['커밋 (commit)','프로젝트 전체의 한 시점을 남긴 스냅숏.'],['브랜치 (branch)','커밋 하나를 가리키는 움직이는 이름표.'],['VRAM','GPU에 붙은 메모리. 시스템 RAM과 따로 있고 올릴 수 있는 모델 크기를 제한합니다.'],['tmux','터미널 세션을 서버에 남겨 두고 떼었다가 다시 붙을 수 있게 하는 프로그램.'],['이미지와 컨테이너 (image, container)','이미지는 읽기 전용 설계도, 컨테이너는 그 설계도를 실행한 것.'],['커널 (kernel)','노트북 셀을 실행하고 변수를 기억하는 배경의 Python 프로세스.'],['시드 (seed)','무작위 순서를 정하는 출발값. 같으면 같은 분할이 다시 나옵니다.'],['프로파일링 (profiling)','어느 구간이 시간과 메모리를 쓰는지 재는 일.']],
 series:{name:'AI 엔지니어링 처음부터',no:1,total:20,prev:null,next:null}
},
sources:[
 ['AI Engineering from Scratch (원본 커리큘럼, MIT)','https://github.com/rohitg00/ai-engineering-from-scratch','이 시리즈가 단계와 레슨 순서를 참고한 공개 저장소. 문장과 코드는 옮기지 않고 새로 썼다.'],
 ['원본 Phase 0 · Setup & Tooling','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling','이 책 전체가 재구성한 단계. 레슨 12개와 경로별 사전 점검 안내.'],
 ['원본 레슨 01 · Dev Environment','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/01-dev-environment','네 층 작업 환경, uv·fnm·rustup 설치, 경로별 사전 점검 스크립트 verify.py.'],
 ['원본 레슨 02 · Git & Collaboration','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/02-git-and-collaboration','작업 폴더·스테이징·로컬·원격, 실험 브랜치, 포크, .gitignore 연습.'],
 ['원본 레슨 03 · GPU Setup & Cloud','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/03-gpu-setup-and-cloud','로컬 GPU·Colab·클라우드 GPU 비교, CPU와 GPU 행렬곱 비교, fp16 메모리 어림셈.'],
 ['원본 레슨 04 · APIs & Keys','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/04-apis-and-keys','환경 변수와 .env, SDK와 HTTP 직접 호출, API 오류 진단 프롬프트.'],
 ['원본 레슨 05 · Jupyter Notebooks','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/05-jupyter-notebooks','커널과 셀, 매직 명령, Colab, 노트북과 스크립트의 역할, 세 가지 함정.'],
 ['원본 레슨 06 · Python Environments','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/06-python-environments','uv·venv·conda, pyproject.toml, 잠금 파일, 다섯 가지 흔한 실수와 CUDA 불일치.'],
 ['원본 레슨 07 · Docker for AI','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/07-docker-for-ai','GPU 도커 이미지, 기본 이미지 선택, 볼륨, NVIDIA Container Toolkit, Compose.'],
 ['원본 레슨 08 · Editor Setup','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/08-editor-setup','VS Code 확장과 설정, 통합 터미널, Remote SSH, 다른 편집기 비교.'],
 ['원본 레슨 09 · Data Management','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/09-data-management','datasets 라이브러리, 캐시와 스트리밍, 형식 비교, 시드 분할, Git LFS와 DVC.'],
 ['원본 레슨 10 · Terminal & Shell','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/10-terminal-and-shell','파이프와 리디렉션, 배경 실행, tmux, htop·nvidia-smi, SSH와 rsync.'],
 ['원본 레슨 11 · Linux for AI','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/11-linux-for-ai','파일 시스템, 권한, apt, sudo, systemd, 디스크, WSL2, macOS와의 차이.'],
 ['원본 레슨 12 · Debugging and Profiling','https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/00-setup-and-tooling/12-debugging-and-profiling','세 수준의 디버깅, 타이머·cProfile·tracemalloc, 네 가지 AI 버그, TensorBoard.'],
 ['uv 공식 문서','https://docs.astral.sh/uv/','원본이 권하는 Python 패키지·가상 환경 관리자.'],
 ['Python venv 문서','https://docs.python.org/3/library/venv.html','Python에 내장된 가상 환경 모듈.'],
 ['PyTorch 설치 안내','https://pytorch.org/get-started/locally/','운영체제와 CUDA 버전에 맞는 PyTorch 빌드를 고르는 공식 안내.'],
 ['Pro Git · 브랜치와 병합','https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging','빨리 감기 병합과 병합 커밋의 차이.'],
 ['Google Colab FAQ','https://research.google.com/colaboratory/faq.html','원본이 인용한 Colab의 제한과 기능 안내.'],
 ['JupyterLab 문서','https://jupyterlab.readthedocs.io/','원본이 인용한 JupyterLab 전체 기능 안내.'],
 ['Anthropic API 문서','https://docs.anthropic.com/','원본 레슨 04가 첫 호출에 쓴 API의 공식 문서.'],
 ['Docker 빌드 캐시','https://docs.docker.com/build/cache/','층이 바뀌면 그 뒤 층이 다시 빌드되는 규칙.'],
 ['NVIDIA Container Toolkit 설치 안내','https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html','컨테이너에 호스트 GPU를 연결하는 도구.'],
 ['VS Code Remote SSH','https://code.visualstudio.com/docs/remote/ssh','원격 상자의 폴더를 로컬처럼 여는 확장.'],
 ['Hugging Face Datasets 문서','https://huggingface.co/docs/datasets/index','불러오기, 캐시, 스트리밍, 분할을 다루는 라이브러리.'],
 ['DVC 문서','https://dvc.org/doc','데이터와 모델 파일을 Git 밖 저장소에 두고 버전을 기록하는 도구.'],
 ['tmux 위키','https://github.com/tmux/tmux/wiki','세션·창·패널과 떼었다 붙이기.'],
 ['chmod 매뉴얼','https://man7.org/linux/man-pages/man1/chmod.1.html','권한 비트와 8진수 표기의 정의.'],
 ['Python 프로파일러 문서','https://docs.python.org/3/library/profile.html','cProfile로 함수별 누적 시간을 재는 법.'],
 ['PyTorch TensorBoard 문서','https://pytorch.org/docs/stable/tensorboard.html','SummaryWriter로 손실과 히스토그램을 기록하는 법.'],
 ['WSL 설치 안내','https://learn.microsoft.com/windows/wsl/install','Windows에서 실제 리눅스 커널 환경을 쓰는 방법.']
],
info:{
 preflight:['경로별 사전 점검','학습 경로와 빠진 도구 하나를 고르면, 원본 verify.py의 경로 표대로 필수 검사 결과와 종료 코드를 계산합니다.','agent-skills 경로에서 Node.js가 없으면 결과가 어떻게 달라질지 먼저 예측해 보세요.'],
 resolver:['전역 설치와 가상 환경','예전 프로젝트가 고정한 PyTorch 버전과 설치 방식을 바꾸며 두 프로젝트가 모두 돌아가는지 봅니다.','예전 프로젝트가 2.4를 고정했다면 전역 설치로도 둘 다 돌아갈까요? 이유도 말해 보세요.'],
 cuda:['드라이버와 CUDA 빌드 맞추기','GPU 드라이버가 지원하는 CUDA와 설치한 PyTorch 빌드의 CUDA를 골라 GPU를 쓸 수 있는지 판정합니다.','드라이버가 12.1인 상자에서 GPU를 쓰려면 어떤 빌드를 골라야 할까요?'],
 branch:['실험 브랜치 병합','브랜치를 만든 뒤 main과 experiment에 생긴 커밋 수를 바꾸며 병합 방식과 기록 길이를 봅니다.','main에 커밋이 하나라도 생기면 병합 결과의 커밋 수는 몇 개 늘어날까요?'],
 ignore:['.gitignore 규칙 쌓기','무시 규칙을 하나씩 더하며 커밋되는 파일과 저장소 크기, 키 노출 여부를 봅니다.','규칙 세 개까지만 적용했다면 무엇이 아직 위험할까요?'],
 vram:['모델이 VRAM에 들어갈까','모델 크기와 정밀도, GPU 메모리를 바꾸며 가중치 메모리와 적합 여부를 계산합니다.','24GB GPU에서 fp16으로 실행 여유 20%를 두면 몇 B 모델까지 올라갈까요?'],
 cloudcost:['클라우드 GPU 비용과 유휴 시간','시간당 가격, 학습 횟수, 끄지 않고 둔 시간을 바꾸며 청구액이 어디서 나오는지 봅니다.','10분짜리 학습 6번을 하고 하룻밤(12시간) 켜 두면 비용의 몇 %가 유휴 시간일까요?'],
 survive:['접속이 끊겨도 학습이 살아남을까','학습을 띄우는 방법을 바꾸며 SSH가 끊긴 뒤 학습과 확인 방법이 어떻게 되는지 봅니다.','nohup으로 띄운 학습의 진행 화면을 다시 보려면 어떻게 해야 할까요?'],
 chmod:['권한 숫자 읽기','소유자·그룹·그 밖의 사람에게 줄 권한 숫자를 바꾸며 rwx 문자열과 실행 가능 여부를 계산합니다.','chmod 744 train.sh 뒤에 그룹 사용자가 ./train.sh를 실행하면 어떻게 될까요?'],
 layers:['도커 층 캐시','바뀐 줄과 Dockerfile 순서를 바꾸며 다시 만들 층과 빌드 시간을 계산합니다.','COPY를 앞에 둔 Dockerfile에서 코드 한 줄을 고치면 몇 초가 걸릴까요?'],
 leak:['API 키 노출 판정','키를 둔 곳과 저장소 공개 범위를 바꾸며 키가 Git 기록에 남는지, 무엇을 해야 하는지 판정합니다.','키를 .env에 두었지만 .gitignore에 넣는 것을 잊고 공개 저장소에 푸시했다면?'],
 kernel:['셀 실행 순서와 숨은 상태','세 셀을 실행한 순서를 바꾸며 지금 커널의 결과와 커널 재시작 후 위에서부터 실행한 결과를 비교합니다.','셀 2를 지우기 전에 실행해 두었다면 화면만 보고 y를 맞힐 수 있을까요?'],
 split:['시드로 나누고 누수 재기','데이터 수와 새로 나눌 때의 시드를 바꾸며 70·10·20 분할 크기와 옛 훈련 세트가 새 평가 세트에 섞인 비율을 계산합니다.','시드를 42에서 7로 바꾸면 새 평가 리뷰 중 옛 훈련 리뷰가 몇 %일지 예측해 보세요.'],
 profile:['데이터 로더 일꾼 수와 병목','DataLoader 일꾼 수를 바꾸며 한 단계 시간, GPU가 노는 시간, 병목 구간을 계산합니다.','일꾼을 2명에서 8명으로 늘리면 한 단계 시간은 더 줄어들까요?'],
 curve:['학습률과 손실 곡선','학습률을 바꾸며 손실 곡선이 줄어드는지, 출렁이는지, 터지는지와 조건부 중단점이 걸리는 단계를 봅니다.','학습률 1.0에서는 손실이 어떻게 움직일지 먼저 예측해 보세요.'],
 triage:['확인 순서 정하기','고장 보고와 확인 순서 전략을 바꾸며 원인을 드러내는 점검까지 걸리는 시간을 계산합니다.','“정확도 99%” 보고에 아래층부터 점검하면 몇 분이 걸릴까요? 증상 우선과 비교해 보세요.']
},
chapters:[
{id:'stack',title:'작업대는 아래층부터 쌓는다',subtitle:'시스템 바탕, 패키지 관리자, 언어 실행기, AI 라이브러리를 아래에서 위로 점검합니다.',desc:'첫 레슨을 시작하려면 무엇이 꼭 있어야 할까요?',group:'기초 공사',time:'12분',labs:['preflight'],source:[2,1,14],thumb:['시스템','실행기','점검'],
 paragraphs:[
 '이 책은 영화 리뷰의 긍정·부정을 가려내는 작은 프로젝트 review-lab을 따라갑니다. 처음 노트북에서 시작해, 빌린 GPU 상자를 거쳐, 팀원의 컴퓨터에서 같은 결과로 다시 돌리는 것이 목표입니다. 첫날 할 일은 코드를 쓰는 것이 아니라 코드를 받아 줄 작업대를 확인하는 것입니다. 원본 커리큘럼은 작업 환경을 네 층으로 나눕니다. 맨 아래에는 운영체제·셸·Git·GPU 드라이버 같은 시스템 바탕이, 그 위에 uv·pnpm·cargo 같은 패키지 관리자가, 다시 그 위에 Python·Node.js·Rust 같은 언어 실행기가, 맨 위에 PyTorch 같은 AI 라이브러리가 놓입니다. 위층은 아래층을 전제로 움직이므로 설치도 아래에서 위로 합니다.',
 '모든 도구를 한꺼번에 깔려고 하면 첫 레슨에 닿기도 전에 경고 수십 개를 만납니다. 그래서 원본은 학습 경로마다 사전 점검(preflight) 스크립트를 두고, 지금 시작하는 데 꼭 필요한 검사만 필수로, 나중 레슨에서 쓸 도구는 선택으로 나눕니다. 필수 검사가 하나라도 실패하면 종료 코드가 1이 되고, 선택 도구가 없는 것은 실패로 치지 않습니다. GPU가 없는 것도 첫 레슨을 막지 않습니다. 이 장의 실험에서는 경로와 빠진 도구를 바꾸며 점검 결과가 어떻게 달라지는지 확인합니다. 그런데 점검을 통과한 Python 하나에 프로젝트 여러 개의 패키지를 모두 넣어도 괜찮을까요?'],
 formula:'준비 완료 ⇔ 고른 경로의 필수 검사가 모두 통과 (종료 코드 0)',formulaNote:'원본 verify.py의 경로 표를 옮긴 판정 규칙입니다. 선택 검사는 결과에 영향을 주지 않고, 필요할 때 <code>--show-later</code>로 따로 봅니다. 실험은 스크립트를 실행하지 않고 경로 표만 재현하며, “Python 3.11 이상” 같은 버전 하한은 통과·실패 하나로 줄였습니다.',
 flow:['시스템 바탕|OS·셸·Git·GPU 드라이버','패키지 관리자|uv·pnpm·cargo','언어 실행기|Python·Node.js·Rust','AI 라이브러리|PyTorch·transformers'],
 details:[
 ['네 층을 설치하는 순서','<ul><li><b>시스템 바탕</b>: macOS는 Xcode 명령줄 도구와 Homebrew, Ubuntu는 <code>apt</code>로 build-essential·git·curl·unzip을 깝니다. Windows는 WSL2로 Ubuntu를 씁니다.</li><li><b>Python</b>: uv로 Python 3.12를 받고 <code>uv venv</code>로 환경을 만든 뒤 numpy를 깔아 내적 한 번으로 확인합니다.</li><li><b>Node.js</b>: fnm으로 Node 22와 pnpm을 깝니다. fnm 설치기는 unzip이 없으면 멈추고, Apple silicon에서 터미널이 Rosetta로 돌면 arm64로 강제해야 합니다.</li><li><b>Rust·Julia</b>: 성능이 중요한 레슨에 rustup을, 수학 레슨에 선택으로 Julia를 씁니다.</li><li><b>GPU</b>: NVIDIA는 <code>nvidia-smi</code> 뒤 CUDA용 PyTorch를, Apple silicon은 CUDA 없는 기본 빌드를 깔고 MPS로 GPU를 씁니다. Mac에서 CUDA가 없다는 결과는 정상입니다.</li></ul>'],
 ['경로별 필수와 선택','<p>원본의 사전 점검은 경로마다 필수 목록이 다릅니다. 입문·LLM 엔지니어링·에이전트·MCP 경로는 Python과 Git만 필수이고, 수학·ML 기초 경로는 numpy를 더하며, 에이전트 스킬 경로는 Node.js와 npx까지 필수입니다. 나머지는 선택이어서 없어도 “나중 검사를 건너뜀”이라고만 알립니다. 통과하면 처음 실행할 레슨 명령(<code>Next:</code>)을 알려 주고, 실패한 필수 검사에는 찾은 경로나 import 오류와 고치는 명령을 함께 보여 줍니다. 원본은 이 명령, 실행 위치(저장소 루트), 종료 코드, 다음 명령을 기록해 두라고 권합니다.</p>'],
 ['과정에서 쓰는 언어','<p>원본 커리큘럼 기준(확인일 2026-10-08)으로 Python은 1~12단계의 ML·딥러닝·LLM에 uv와 함께, TypeScript는 13~17단계의 도구·에이전트·인프라에 pnpm과 함께, Rust는 성능이 중요한 일부 단계에 cargo와 함께, Julia는 1단계 수학에 쓰입니다. 원본은 나중 단계의 도구를 첫날 모두 갖추지 말고 레슨이 요구할 때 깔라고 말합니다.</p>']],
 warning:'GPU가 없거나 Mac에서 CUDA가 보이지 않는 것은 고장이 아닙니다. Apple silicon에는 CUDA가 없고 MPS가 그 역할을 하며, 시작 레슨 대부분은 CPU로 충분합니다. 필수와 선택을 구분하지 않고 모든 경고를 고치려 하면 첫 레슨이 늦어질 뿐입니다.',
 quiz:['입문(beginner) 경로로 점검했더니 Python과 Git은 통과했고 Node.js와 GPU가 없다고 나왔습니다. 결과는?',['종료 코드 1이므로 Node.js부터 설치해야 시작할 수 있다','종료 코드 0이므로 첫 레슨을 시작하고 Node.js는 필요할 때 설치한다','GPU가 없으므로 이 과정을 따라갈 수 없다'],1,'입문 경로의 필수 검사는 Python과 Git뿐입니다. Node.js와 GPU는 선택이라 종료 코드에 영향을 주지 않습니다.'],
 cross:[['컴퓨터 원리 07 · 반복하고 갈라지기','../computer/#programs','사전 점검은 검사 결과에 따라 갈라지는 작은 프로그램입니다. 조건 분기가 기계 수준에서 어떻게 실행되는지 보고 오면 종료 코드 0과 1이 다음 행동을 어떻게 바꾸는지 더 분명해집니다. 돌아오면 2장으로 넘어갑니다.']]},

{id:'envs',title:'프로젝트마다 따로 사는 파이썬',subtitle:'가상 환경으로 패키지 충돌을 막고, CUDA 빌드는 드라이버에 맞춥니다.',desc:'두 프로젝트가 서로 다른 PyTorch를 원하면 어떻게 할까요?',group:'기초 공사',time:'15분',labs:['resolver','cuda'],source:[7,14,15,16],thumb:['전역','가상환경','CUDA'],
 paragraphs:[
 '앞 장의 점검으로 시스템 Python과 Git이 준비되었습니다. 이제 review-lab에 PyTorch를 설치할 차례인데, 같은 노트북에는 지난달 만든 다른 프로젝트도 있습니다. review-lab은 PyTorch 2.3 이상을 원하고, 예전 프로젝트는 특정 CUDA 빌드에 묶인 2.1을 고정해 두었다고 해 봅시다. 시스템 전체에 설치하는 전역 설치에서는 한 패키지가 한 버전만 있을 수 있으므로, 나중에 설치한 쪽이 앞의 것을 덮어씁니다. 하나를 고치면 다른 하나가 깨지는 이 상황을 흔히 의존성 지옥이라고 부릅니다.',
 '해법은 프로젝트마다 자기 Python 해석기와 패키지 폴더를 담은 가상 환경을 두는 것입니다. uv, 내장 venv, conda 중 무엇을 쓰든 원리는 같고, 원본은 속도 때문에 uv를 권합니다. pyproject.toml에는 허용하는 버전 범위를, 잠금 파일에는 간접 의존성까지 정확한 버전을 적어 Git에 올립니다. GPU를 쓰려면 하나를 더 맞춰야 합니다. 원본의 규칙대로 PyTorch가 빌드된 CUDA 버전은 드라이버가 지원하는 CUDA 버전보다 높으면 안 됩니다. 그렇다면 환경을 나눈 뒤에 생기는 수많은 변경은 어떻게 기록하고 되돌릴까요?'],
 formula:'전역 설치: 두 요구 범위의 교집합이 비면 한쪽이 깨진다 · 가상 환경: 프로젝트마다 범위 안의 버전 하나',formulaNote:'버전은 PyTorch 2.x의 둘째 자리로 단순화했습니다. 실제 설치기는 간접 의존성과 플랫폼까지 함께 풉니다. CUDA 규칙 “빌드 CUDA ≤ 드라이버 CUDA”는 원본 레슨의 어림 규칙이며, 실제 호환 범위는 PyTorch 설치 안내에서 확인해야 합니다.',
 flow:['전역 설치|한 패키지에 한 버전, 덮어쓰기','가상 환경|.venv마다 해석기와 패키지','잠금 파일|정확한 버전을 Git에','CUDA 확인|nvidia-smi와 torch.version.cuda'],
 details:[
 ['세 가지 도구와 쓰는 때','<ul><li><b>uv</b>: <code>uv venv</code>로 환경을, <code>uv add</code>로 pyproject.toml과 uv.lock을 함께 갱신합니다. 원본은 pip보다 훨씬 빠르다고 소개합니다.</li><li><b>venv</b>: Python에 내장되어 어디서나 됩니다. <code>python3 -m venv .venv</code> 뒤 활성화하고 pip을 씁니다.</li><li><b>conda</b>: CUDA 툴킷·cuDNN·C 라이브러리처럼 Python 밖의 의존성을 다룰 때, 시스템 패키지를 설치할 수 없는 공용 클러스터에서 씁니다. 한 환경 안에서는 conda로 모두 깔고, pip만 있는 패키지는 마지막에 깝니다.</li><li><b>단계별 환경</b>: 원본은 과정 전체를 환경 하나로 버티지 말고, 가벼운 초반 단계용 환경과 PyTorch 단계, API SDK 단계의 환경을 나누라고 권합니다.</li></ul>'],
 ['pyproject.toml과 잠금 파일','<p>pyproject.toml은 setup.py·setup.cfg·requirements.txt를 한 파일로 대신합니다. 기본 의존성 아래에 <code>[project.optional-dependencies]</code>로 torch 묶음과 llm 묶음을 두면 <code>uv pip install -e ".[torch]"</code>처럼 필요한 것만 고를 수 있습니다. 잠금 파일은 의존성의 의존성까지 정확한 버전을 적으므로 다른 컴퓨터에서 같은 설치를 다시 만듭니다. 잠금 파일은 Git에 올리고, 200MB에서 2GB에 이르는 .venv 폴더는 올리지 않습니다.</p>'],
 ['원본이 꼽은 다섯 가지 실수','<ul><li>활성화하지 않고 전역에 설치하기: <code>which python</code>이 .venv 안을 가리키는지 확인합니다.</li><li>conda 환경에 pip을 섞기: conda의 의존성 추적이 깨집니다.</li><li>활성화를 잊고 실행하기: 프롬프트 앞에 (.venv)가 보이는지 확인합니다.</li><li>.venv를 Git에 올리기: 컴퓨터 사이에 옮길 수 없는 큰 폴더입니다.</li><li>CUDA 불일치: <code>nvidia-smi</code>의 드라이버 CUDA와 <code>torch.version.cuda</code>를 비교합니다.</li></ul>']],
 warning:'가상 환경은 가상 머신이 아닙니다. 운영체제와 GPU 드라이버는 그대로 공유하고, Python 해석기와 패키지 폴더만 프로젝트별로 나눕니다. 그래서 드라이버와 CUDA 빌드가 맞지 않는 문제는 가상 환경을 새로 만들어도 사라지지 않습니다.',
 quiz:['nvidia-smi는 CUDA 12.1을, torch.version.cuda는 12.4를 보여 줍니다. 가장 적절한 판단은?',['가상 환경을 새로 만들면 해결된다','빌드 CUDA가 드라이버보다 높으므로 cu121 이하 빌드를 깔거나 드라이버를 올린다','CUDA 버전은 속도에만 영향을 주므로 무시해도 된다'],1,'빌드 CUDA가 드라이버가 지원하는 CUDA보다 높으면 GPU를 쓰지 못합니다. 가상 환경은 드라이버를 바꾸지 않습니다.'],
 cross:[['LLM 시스템 04 · 질문이 GPU에 도착하기까지','../llm-gpu/#journey','드라이버와 CUDA 빌드가 맞아야 하는 이유는 프로그램이 GPU에 일을 넘기는 경로에 있습니다. RAM에서 VRAM으로 가는 길을 보고 오면 “CUDA available: False”가 무엇을 막는지 보입니다.']]},

{id:'git',title:'실험을 되돌릴 수 있게 남기기',subtitle:'커밋은 스냅숏, 브랜치는 이름표이며, 무엇을 기록하지 않을지도 정합니다.',desc:'어제 잘 돌던 상태로 어떻게 돌아갈까요?',group:'기초 공사',time:'14분',labs:['branch','ignore'],source:[3,17,1],thumb:['add','commit','merge'],
 paragraphs:[
 '앞 장에서 review-lab은 자기 가상 환경과 잠금 파일을 갖게 되었습니다. 이제 학습률을 바꾸거나 새 전처리를 붙이는 실험을 하다 보면, 어제 잘 돌던 상태로 돌아가야 하는 순간이 반드시 옵니다. Git은 작업 폴더에서 고친 파일을 스테이징 영역에 올리고(git add), 로컬 저장소에 스냅숏으로 남기고(git commit), 원격 저장소에 올리는(git push) 길을 따릅니다. 커밋은 그 시점 프로젝트 전체의 사진입니다. 브랜치는 복사본이 아니라 커밋 하나를 가리키는 이름표이고, 새 커밋을 만들면 앞으로 움직입니다.',
 '실험이 성공하면 실험 브랜치를 main에 병합합니다. 그 사이 main이 움직이지 않았다면 이름표만 앞으로 옮기는 빨리 감기(fast-forward)가 되고, main에도 새 커밋이 있었다면 두 줄기를 잇는 병합 커밋이 하나 생깁니다. 무엇을 기록하지 않을지도 중요합니다. 체크포인트(.pt, .safetensors), 가상 환경 폴더, 원본 데이터는 크고 다시 만들 수 있으므로 .gitignore로 빼고, 비밀 키가 든 .env는 반드시 뺍니다. 원본은 이 과정에 clone, add·commit, push, checkout -b, log --oneline이면 충분하다고 말합니다. 그런데 이렇게 정리한 코드를 학습시킬 GPU는 어디서 구해야 할까요?'],
 formula:'병합 = main이 그대로면 빨리 감기(새 커밋 0개) · main이 움직였으면 병합 커밋 1개',formulaNote:'갈라지기 전 커밋 수를 base, 갈라진 뒤 main과 experiment의 커밋 수를 m, e라 하면 병합 뒤 기록의 커밋 수는 base + m + e (+1, m > 0일 때)입니다. 충돌 여부는 고친 줄이 겹치는지에 달려 있어 이 계산에 넣지 않았습니다.',
 flow:['작업 폴더|파일을 고친다','스테이징|git add로 고른다','로컬 저장소|git commit으로 남긴다','원격|git push로 올린다'],
 details:[
 ['다섯 명령과 쓰는 때','<div class="table-wrap"><table><tr><th>명령</th><th>쓰는 때</th></tr><tr><td><code>git clone</code></td><td>저장소를 처음 받을 때</td></tr><tr><td><code>git add</code> + <code>git commit</code></td><td>작업을 남길 때</td></tr><tr><td><code>git push</code></td><td>원격에 백업할 때</td></tr><tr><td><code>git checkout -b</code></td><td>main을 건드리지 않고 시도할 때</td></tr><tr><td><code>git log --oneline</code></td><td>지금까지의 기록을 볼 때</td></tr></table></div><p>원격에서 받아 오는 방향은 fetch와 pull입니다. 처음 한 번 <code>git config --global</code>로 이름과 이메일을 설정합니다.</p>'],
 ['강좌 저장소를 내 것처럼 쓰기','<p>강좌 저장소에는 관리자만 푸시할 수 있으므로, 원본은 GitHub에서 먼저 포크(fork)해 내 사본을 만들고 그 사본을 clone하라고 안내합니다. 그러면 origin이 내 사본을 가리키고, my-progress 같은 브랜치에 레슨 코드를 커밋해 푸시할 수 있습니다. 연습 과제로는 체크포인트 확장자(.pt, .pth, .safetensors)를 무시하는 .gitignore 만들기와 log --oneline으로 레슨이 추가된 순서 읽기가 있습니다.</p>'],
 ['말과 실제 뜻','<ul><li>커밋은 “저장”보다 넓습니다. 프로젝트 전체의 한 시점입니다.</li><li>브랜치는 “사본”이 아니라 움직이는 이름표입니다.</li><li>병합은 한 브랜치의 변경을 다른 브랜치에 적용하는 일입니다.</li><li>원격은 “클라우드”가 아니라 다른 곳에 있는 같은 저장소의 사본입니다.</li></ul>']],
 warning:'브랜치는 프로젝트 폴더를 통째로 복사한 것이 아닙니다. 커밋을 가리키는 가벼운 이름표라서 만들고 지우는 비용이 거의 없습니다. 반대로 .gitignore에 나중에 추가한 파일은 이미 커밋된 기록에서 사라지지 않습니다. 한 번 올라간 키는 기록에 남습니다.',
 quiz:['experiment 브랜치에 커밋 3개를 만드는 동안 main에는 커밋이 없었습니다. main에서 git merge experiment를 하면?',['병합 커밋 하나가 새로 생긴다','main 이름표가 experiment의 마지막 커밋으로 빨리 감기된다','충돌이 반드시 생긴다'],1,'main이 움직이지 않았으므로 갈라진 줄기가 없습니다. 이름표만 앞으로 옮기면 됩니다.']},

{id:'gpu',title:'GPU를 쓸지 빌릴지 정하기',subtitle:'모델이 VRAM에 들어가는지 먼저 계산하고, 빌린 GPU는 켜 둔 시간만큼 청구됩니다.',desc:'내 모델은 이 GPU에 들어가고, 빌리면 얼마가 들까요?',group:'계산 자원',time:'15분',labs:['vram','cloudcost'],source:[4,16,18],thumb:['VRAM','fp16','비용'],
 paragraphs:[
 '앞 장까지 review-lab의 코드와 기록은 정리되었지만, 이 노트북에는 쓸 만한 GPU가 없습니다. 원본 커리큘럼은 초반 단계 대부분이 CPU로 충분하고, CNN·트랜스포머·LLM을 학습하는 단계부터 GPU 가속이 필요하다고 안내합니다. 그 예로 CPU에서 8시간 걸리는 학습이 GPU에서는 10분 정도에 끝난다고 듭니다(원본 커리큘럼 기준, 확인일 2026-10-08). 선택지는 셋입니다. 이미 가진 NVIDIA GPU, 설치 없이 바로 쓰는 Google Colab의 무료 GPU, 그리고 SSH로 접속해 시간 단위로 빌리는 클라우드 GPU입니다.',
 '어느 쪽이든 먼저 볼 것은 모델이 GPU 메모리인 VRAM에 들어가는지입니다. 원본의 어림셈은 fp16(16비트 부동소수점)에서 파라미터 하나당 2바이트이므로, 7B 모델은 가중치만으로 약 14GB가 필요합니다. 학습에는 기울기와 옵티마이저 상태가 더 붙으므로 이 수는 하한입니다. 클라우드 GPU 가격은 원본 기준 시간당 0.20~2.00달러 범위인데, 학습이 끝난 뒤 끄지 않고 둔 시간도 똑같이 청구됩니다. 이 장에서는 메모리 적합 여부와 비용을 직접 계산합니다. 그런데 빌린 상자에 SSH로 들어가면 화면도 파일 탐색기도 없는데, 거기서 학습을 어떻게 지켜볼까요?'],
 formula:'가중치 메모리(GB) ≈ 파라미터 수(10억 개) × 파라미터당 바이트 · 비용 = 시간당 가격 × (학습 시간 + 유휴 시간)',formulaNote:'1GB를 10⁹바이트로 셉니다. 실험의 “실행 여유 20%”는 이 책의 가정값이며 활성값과 실행 엔진의 몫을 대신합니다. 학습에 필요한 기울기·옵티마이저 메모리는 넣지 않았습니다. 가격 범위와 8시간→10분 예는 원본 레슨이 든 값이며 실제 견적이 아닙니다.',
 flow:['GPU 확인|nvidia-smi와 cuda.is_available','메모리 어림|파라미터 × 바이트','선택|로컬·Colab·클라우드','비용|학습 + 유휴 시간'],
 details:[
 ['GPU가 보이는지 확인하는 순서','<ul><li>터미널에서 <code>nvidia-smi</code>로 드라이버와 GPU가 보이는지 봅니다.</li><li>Python에서 <code>torch.cuda.is_available()</code>, <code>torch.version.cuda</code>, 장치 이름과 전체 메모리를 출력합니다.</li><li>코드는 <code>device = "cuda" if 가능 else "cpu"</code>처럼 써서 GPU가 없어도 돌게 합니다.</li><li>Colab에서는 런타임 유형을 GPU로 바꾸고 <code>!nvidia-smi</code>로 확인합니다.</li></ul>'],
 ['CPU와 GPU를 공정하게 재기','<p>원본은 5000×5000 행렬 두 개를 곱하는 시간을 CPU와 GPU에서 재어 속도 비를 구합니다. GPU 호출은 일을 맡기고 바로 돌아오므로, 시계를 멈추기 전에 <code>torch.cuda.synchronize()</code>로 계산이 끝나기를 기다려야 합니다. 그렇지 않으면 GPU 시간이 실제보다 훨씬 짧게 나옵니다. 텐서 코어(Tensor Core)는 행렬곱 전용 회로이고, fp16은 fp32의 절반 메모리를 씁니다.</p>'],
 ['세 선택지 비교','<div class="table-wrap"><table><tr><th>선택지</th><th>비용</th><th>준비</th><th>잘 맞는 일</th></tr><tr><td>로컬 NVIDIA GPU</td><td>이미 있음</td><td>CUDA·cuDNN 설치</td><td>자주 쓰는 일, 큰 데이터</td></tr><tr><td>Google Colab 무료</td><td>0</td><td>없음</td><td>빠른 실험</td></tr><tr><td>클라우드 GPU</td><td>시간당 0.20~2.00달러</td><td>SSH 접속 후 설치</td><td>본격 학습, 큰 모델</td></tr></table></div><p class="caption">원본 커리큘럼 기준(확인일 2026-10-08). 가격과 무료 등급의 조건은 자주 바뀌므로 쓰기 전에 각 서비스에서 다시 확인합니다.</p>']],
 warning:'GPU에서 행렬곱 시간을 잴 때 동기화 없이 시계를 멈추면, 계산이 끝나기 전에 측정이 끝나 터무니없이 빠른 결과가 나옵니다. 또 “파라미터당 2바이트”는 가중치만 센 하한입니다. 학습에는 그 몇 배가 필요할 수 있습니다.',
 quiz:['16GB GPU에 fp16 가중치만 올린다고 할 때, 여유 없이 들어가는 모델의 최대 크기를 어림셈하면?',['약 4B','약 8B','약 16B'],1,'16GB ÷ 파라미터당 2바이트 = 약 80억 개입니다. 실제로는 실행 여유가 필요하므로 이보다 작아야 안전합니다.'],
 cross:[['LLM 시스템 03 · 가중치가 차지하는 메모리','../llm-gpu/#weights','정밀도를 16비트에서 8·4비트로 줄이면 메모리가 어떻게 바뀌는지 자세히 계산합니다. 이 장의 어림셈이 어디까지 맞는지 확인하고 돌아오세요.'],['LLM 시스템 05 · GPU 안의 저장소와 계산기','../llm-gpu/#hierarchy','VRAM 안쪽에서 데이터가 캐시와 레지스터를 거쳐 계산기에 닿는 길을 봅니다. GPU가 빠른 이유와 기다리는 이유를 함께 이해할 수 있습니다.']]},

{id:'remote',title:'빌린 리눅스 상자에서 일하기',subtitle:'터미널만 있는 원격 상자에서 학습을 살려 두고 권한 문제를 읽습니다.',desc:'노트북을 닫아도 원격 학습이 계속될까요?',group:'계산 자원',time:'16분',labs:['survive','chmod'],source:[11,12,26,27,30],thumb:['SSH','tmux','chmod'],
 paragraphs:[
 '앞 장에서 클라우드 GPU를 빌리기로 했고, 이제 SSH로 접속한 원격 상자 앞에 섰습니다. 대부분의 GPU 서버는 Ubuntu 같은 리눅스이고, 쓸 수 있는 것은 터미널뿐입니다. 파일은 루트(/) 아래 나무 하나에 모이며, 내 작업은 홈 디렉터리(~)에서 하고, 설정은 /etc, 로그는 /var/log, 잠시 쓰는 파일은 /tmp에 있습니다. 셸(bash, zsh)은 명령을 해석하는 프로그램이고, 파이프(|)로 한 명령의 출력을 다음 명령의 입력으로 이으면 학습 로그에서 손실 값만 걸러 낼 수 있습니다. 리디렉션(>, >>, 2>, 2>&1)은 표준 출력과 오류 출력을 파일로 보냅니다.',
 '원격 작업에서 가장 아픈 실수는 노트북을 닫았더니 몇 시간짜리 학습이 같이 끝나는 일입니다. 명령 끝에 &를 붙이면 배경에서 돌지만 터미널이 닫히면 함께 끝나고, nohup은 접속이 끊겨도 살아남지만 다시 붙어 볼 수 없어 로그 파일로만 확인합니다. tmux는 세션을 서버에 남겨 두므로 떼었다가 다시 붙을 수 있습니다. 또 하나 자주 만나는 벽은 “Permission denied”인데, 대개 파일의 권한 비트 문제입니다. 이 장에서는 두 가지를 직접 판정해 봅니다. 그런데 이 상자에서 공들여 맞춘 환경을 팀원의 상자에 똑같이 옮기려면 무엇이 필요할까요?'],
 formula:'chmod 754 = 소유자 rwx(4+2+1) · 그룹 r-x(4+1) · 그 밖 r--(4)',formulaNote:'권한 숫자 한 자리는 읽기(4)·쓰기(2)·실행(1) 세 비트의 합입니다. 셸 스크립트를 <code>./train.sh</code>로 실행하려면 읽기와 실행이 모두 필요하다고 보았습니다(바이너리 파일은 실행 비트만으로 됩니다). root는 권한 비트를 대부분 건너뛰므로 실험에서 제외했습니다.',
 flow:['SSH 접속|원격 셸을 연다','tmux 세션|학습·GPU 감시·로그를 나눠 띄운다','떼기·붙기|접속이 끊겨도 학습은 계속','권한 확인|ls -l로 rwx를 읽는다'],
 details:[
 ['원격 상자에서 쓰는 명령 묶음','<div class="table-wrap"><table><tr><th>일</th><th>명령</th></tr><tr><td>이동</td><td><code>pwd</code> <code>ls -la</code> <code>cd</code> <code>find . -name "*.ckpt" -size +1G</code></td></tr><tr><td>파일</td><td><code>cp -r</code> <code>mv</code> <code>mkdir -p</code> <code>rm -rf</code>(되돌릴 수 없음)</td></tr><tr><td>읽기·찾기</td><td><code>head</code> <code>tail -f</code> <code>less</code> <code>grep -r</code></td></tr><tr><td>패키지</td><td><code>sudo apt update</code> 뒤 <code>apt install -y</code> build-essential·tmux·htop·python3-venv</td></tr><tr><td>프로세스</td><td><code>htop</code> <code>ps aux | grep python</code> <code>kill</code>, 서비스는 <code>systemctl start·status·enable</code></td></tr><tr><td>디스크</td><td><code>df -h</code> <code>du -sh ~/.cache</code> <code>pip cache purge</code></td></tr><tr><td>전송</td><td><code>scp</code>, 큰 폴더는 바뀐 부분만 보내고 이어받는 <code>rsync -avz</code></td></tr></table></div>'],
 ['파이프·배경 실행·tmux','<ul><li><code>grep "loss:" train.log | awk \'{print $NF}\' &gt; losses.txt</code>처럼 걸러 낸 값을 파일로 남깁니다. <code>2&gt;&amp;1</code>은 오류 출력을 표준 출력과 같은 곳으로 보냅니다.</li><li><code>command &amp;</code>는 터미널이 닫히면 끝나고, <code>nohup … &amp;</code>는 살아남지만 다시 붙을 수 없으며, tmux는 둘 다 됩니다. 원본은 몇 분 넘는 일은 tmux로 하라고 권합니다.</li><li>tmux에서는 <code>tmux new -s train</code>, <kbd>Ctrl+B</kbd> 뒤 <kbd>"</kbd>·<kbd>%</kbd>로 나누고, <kbd>d</kbd>로 떼고, <code>tmux attach -t train</code>으로 다시 붙습니다. 한 칸에 학습, 한 칸에 <code>watch -n1 nvidia-smi</code>, 한 칸에 <code>tail -f</code> 로그를 둡니다.</li><li><code>ssh -L 8888:localhost:8888</code>로 원격 주피터를 내 브라우저에서 엽니다.</li></ul>'],
 ['macOS·Windows에서 넘어올 때','<p>원본은 다음 차이를 경고합니다. 패키지 이름이 brew와 apt에서 다를 수 있고, macOS 기본 셸은 zsh(~/.zshrc)지만 리눅스 서버는 대개 bash(~/.bashrc)입니다. 리눅스 파일 시스템은 대소문자를 구분해 Model.py와 model.py가 다른 파일이고, macOS의 sed -i는 빈 인자가 더 필요합니다. Windows 줄 끝(\\r\\n)은 bash 스크립트를 깨뜨리므로 dos2unix로 고칩니다. Windows에서는 WSL2가 실제 리눅스 커널을 주며, Windows 쪽 NVIDIA 드라이버만 깔면 WSL2 안에서 CUDA를 씁니다.</p>']],
 warning:'sudo는 권한 문제의 만능 열쇠가 아닙니다. 실행 권한이 없는 스크립트는 chmod +x로 고치면 되고, 모든 것을 root로 실행하면 홈 폴더에 root 소유 파일이 생겨 다음 단계에서 또 “Permission denied”를 만납니다. 필요한 한 명령에만 sudo를 씁니다.',
 quiz:['SSH로 접속해 nohup python train.py > train.log 2>&1 & 로 학습을 시작하고 노트북을 닫았습니다. 다음 날 다시 접속하면?',['학습은 이미 끝나 버렸다','학습은 살아 있고 진행은 train.log로 확인한다','tmux attach로 원래 화면에 다시 붙는다'],1,'nohup은 접속 끊김을 견디지만 붙어 볼 세션이 없습니다. 출력은 리디렉션한 로그 파일에 쌓입니다.'],
 cross:[['컴퓨터 원리 01 · 스위치로 수 세기','../computer/#bits','권한 숫자 7·5·4는 rwx 세 비트를 이진수로 읽은 값입니다. 비트 세 개로 0~7을 세는 실험을 하고 오면 chmod 숫자를 외우지 않고 계산할 수 있습니다.']]},

{id:'docker',title:'같은 상자를 어디서나 다시 만들기',subtitle:'도커 이미지는 층으로 쌓이고, 바뀐 층부터 다시 빌드됩니다.',desc:'내 상자에서 맞춘 환경을 팀원에게 그대로 줄 수 있을까요?',group:'계산 자원',time:'15분',labs:['layers'],source:[8,21,22],thumb:['FROM','RUN','COPY'],
 paragraphs:[
 '앞 장에서 원격 상자에 접속해 apt로 도구를 깔고 가상 환경을 맞추었습니다. 그런데 원본 레슨의 예처럼 내 노트북은 Python 3.12·CUDA 12.4·PyTorch 2.3이고 팀원의 상자는 Python 3.10·CUDA 11.8·PyTorch 2.1이라면, 같은 코드가 한쪽에서만 돕니다. 가상 환경은 Python 패키지만 나누므로 시스템 라이브러리와 CUDA 툴킷의 차이는 막지 못합니다. 도커는 코드·언어 실행기·라이브러리·시스템 도구를 이미지 하나로 묶고, 그 이미지를 실행한 것이 컨테이너입니다. 컨테이너는 호스트의 운영체제 커널을 함께 쓰므로 가상 머신보다 훨씬 빨리 뜹니다.',
 '이미지는 Dockerfile의 명령 한 줄마다 층이 하나씩 쌓여 만들어지고, 바뀌지 않은 층은 캐시에서 재사용됩니다. 어떤 층이 바뀌면 그 층과 그 뒤의 모든 층을 다시 만들어야 하므로, 자주 바뀌는 코드 복사는 맨 뒤에, 오래 걸리는 PyTorch 설치는 앞쪽에 두는 순서가 빌드 시간을 좌우합니다. 원본은 AI 프로젝트에 도커가 특히 필요한 이유로 깨지기 쉬운 GPU 드라이버, fp16에서 14GB에 이르는 7B 가중치, 추론 서버와 벡터 데이터베이스를 함께 띄우는 다중 서비스 구성을 꼽습니다. GPU는 NVIDIA Container Toolkit이 호스트 드라이버를 컨테이너에 연결하고, 큰 가중치는 볼륨으로 호스트 폴더를 붙여 다시 받지 않습니다. 그렇다면 이렇게 어디로든 퍼지는 상자에 API 키를 함께 넣어도 될까요?'],
 formula:'다시 빌드할 층 = 처음 바뀐 층부터 마지막 층까지 · 빌드 시간 = 그 층들의 시간 합',formulaNote:'도커 빌드 캐시의 기본 규칙입니다. 실험의 층별 시간(초)은 교육용 가정값이며, 실제 시간은 네트워크와 기본 이미지 크기에 따라 크게 다릅니다. 기본 이미지를 이미 받아 두었는지, 여러 단계 빌드(multi-stage)를 쓰는지는 계산에 넣지 않았습니다.',
 flow:['Dockerfile|명령 한 줄이 층 하나','이미지|읽기 전용 설계도','컨테이너|이미지를 실행한 것','볼륨|코드·모델·데이터는 호스트에'],
 details:[
 ['기본 이미지 고르기','<div class="table-wrap"><table><tr><th>기본 이미지</th><th>들어 있는 것</th><th>크기(원본 기준)</th></tr><tr><td>CUDA devel</td><td>CUDA 툴킷과 컴파일러(nvcc). flash-attn처럼 컴파일이 필요한 패키지용</td><td>약 4GB</td></tr><tr><td>CUDA runtime</td><td>실행에 필요한 CUDA만</td><td>약 1.5GB</td></tr><tr><td>PyTorch 이미지</td><td>CUDA 위에 PyTorch까지</td><td>약 6GB</td></tr><tr><td>python slim</td><td>CUDA 없음, CPU 전용</td><td>약 150MB</td></tr></table></div><p>원본의 Dockerfile은 devel 이미지에서 시작해 시스템 도구, Python 3.12, CUDA용 PyTorch, 나머지 라이브러리를 차례로 깔고 /workspace와 /models를 볼륨으로 둡니다.</p>'],
 ['GPU·볼륨·Compose','<ul><li>NVIDIA GPU가 있는 리눅스에서는 NVIDIA Container Toolkit을 깔고 <code>docker run --gpus all … nvidia-smi</code>로 확인합니다. GPU가 없으면 이 옵션만 빼면 CPU로 돕니다.</li><li><code>-v $(pwd):/workspace</code>, <code>-v ~/models:/models</code>로 코드와 모델을 붙이면 컨테이너를 몇 번 다시 만들어도 14GB를 다시 받지 않습니다.</li><li>Apple silicon에서는 원본이 고정한 PyTorch cu124 휠이 x86_64용만 있어 <code>--platform=linux/amd64</code>로 에뮬레이션해야 빌드되며, 이때 GPU는 없습니다.</li><li>Compose 파일 하나로 개발 컨테이너와 벡터 데이터베이스(Qdrant)를 함께 띄우면 서비스 이름(qdrant:6333)으로 서로 찾습니다. <code>docker compose down -v</code>는 볼륨까지 지웁니다.</li></ul>'],
 ['컨테이너의 세 용도와 자주 쓰는 명령','<p>개발 컨테이너는 편집기·주피터·디버거까지 담고, 학습 컨테이너는 학습 스크립트와 의존성만 담아 GPU 클러스터에서 돌고, 추론 컨테이너는 작고 빨리 뜨게 만들어 서비스 뒤에 둡니다. 자주 쓰는 명령은 <code>docker ps</code>, <code>docker images</code>, 디스크를 비우는 <code>docker system prune -a</code>, 실행 중인 컨테이너 안에서 <code>docker exec … nvidia-smi</code>, 파일을 꺼내는 <code>docker cp</code>, 로그를 따라가는 <code>docker logs -f</code>입니다.</p>']],
 warning:'컨테이너는 GPU 드라이버까지 담지 않습니다. CUDA 툴킷은 이미지 안에 있지만 드라이버는 호스트 것을 NVIDIA Container Toolkit으로 빌려 씁니다. 그래서 호스트 드라이버가 이미지의 CUDA 빌드보다 낮으면 컨테이너 안에서도 GPU를 쓸 수 없습니다.',
 quiz:['Dockerfile에서 COPY . /workspace를 pip install 줄보다 앞에 두었습니다. 코드 한 줄을 고치고 다시 빌드하면?',['코드 층만 다시 만든다','코드 층과 그 뒤의 pip install 층까지 모두 다시 만든다','기본 이미지부터 전부 다시 받는다'],1,'바뀐 층 뒤의 층은 모두 캐시를 잃습니다. 그래서 자주 바뀌는 COPY는 마지막에 둡니다.'],
 cross:[['LLM 시스템 01 · 다운로드한 모델의 실체','../llm-gpu/#files','볼륨으로 붙이는 /models 폴더 안에 실제로 무엇이 들어 있는지 봅니다. 설정·토크나이저·가중치 파일이 따로 있다는 것을 알면 어떤 파일을 이미지 밖에 둘지 판단하기 쉽습니다.']]},

{id:'keys',title:'API 키를 코드 밖에 두기',subtitle:'키는 환경 변수와 무시된 .env에 두고, 기록에 남았다면 폐기합니다.',desc:'이 키가 Git 기록에 들어가면 무슨 일이 생길까요?',group:'작업 습관',time:'13분',labs:['leak'],source:[5,20,1],thumb:['.env','요청','401'],
 paragraphs:[
 '앞 장의 도커 이미지는 누구에게 주어도 같은 환경을 다시 만듭니다. 바로 그 점 때문에 이미지나 코드 안에 비밀을 넣으면 함께 퍼집니다. review-lab이 리뷰 요약에 LLM API를 쓰기로 했다고 해 봅시다. 모든 API 호출은 주소(endpoint), 인증용 API 키, 요청 본문, 응답 본문 네 가지로 이루어지고, SDK는 이 HTTP 요청을 대신 만들어 줄 뿐입니다. 원본은 SDK 호출과 함께 SDK 없이 같은 요청을 직접 보내는 코드도 보여 주는데, 오류를 진단할 때 실제로 무엇이 오가는지 알 수 있기 때문입니다.',
 '키는 코드에 적지 않고 환경 변수나 .env 파일에 두며, .env는 반드시 .gitignore에 넣습니다. 한 번 커밋된 키는 나중에 파일을 지워도 Git 기록에 남으므로, 공개 저장소에 올라갔다면 키를 폐기하고 새로 발급하는 것이 가장 확실한 처리입니다. 오류 코드는 원인을 알려 줍니다. 401은 키가 틀렸거나 없음, 403은 권한 없음, 429는 요청 한도 초과, 400은 요청 형식 오류, 5xx는 서버 쪽 문제입니다. 원본은 모델 이름도 LLM_MODEL 같은 환경 변수로 빼서 코드를 고치지 않고 바꾸게 합니다. 그렇다면 키가 안전해진 뒤, 노트북에서 실험하는 습관에는 어떤 숨은 함정이 있을까요?'],
 formula:'노출 위험 = 키가 Git 기록에 들어갔는가 × 그 기록을 누가 볼 수 있는가',formulaNote:'실험은 두 조건을 곱한 정책 판정입니다. 공개 범위가 “내 컴퓨터만”이어도 기록에 남은 키는 나중에 푸시하는 순간 퍼질 수 있으므로 결과 문장에서 경고합니다. 비밀 검사 도구, 로그·스크린숏을 통한 유출은 판정에 넣지 않았습니다.',
 flow:['키 보관|환경 변수·무시된 .env','요청|주소·키·본문','응답|JSON 본문 또는 오류 코드','진단|코드로 원인을 좁힌다'],
 details:[
 ['요청 하나의 구조','<p>원본의 첫 호출은 메시지 API에 POST 요청을 보냅니다. 머리글(header)에는 키(<code>x-api-key</code>), API 버전, 내용 형식을 넣고, 본문에는 모델 이름, 최대 토큰 수, 메시지 목록을 JSON으로 넣습니다. 응답 JSON의 내용 배열에서 첫 텍스트를 꺼내면 답이 됩니다. Python과 TypeScript SDK는 이 과정을 감싸고, 키는 환경 변수에서 자동으로 읽습니다. 입력 토큰과 출력 토큰은 따로 세어 청구되고, 스트리밍은 답을 다 기다리지 않고 조각으로 받는 방식입니다. 모델 이름과 무료 크레딧 같은 정보는 원본 커리큘럼 기준(확인일 2026-10-08)이며 자주 바뀝니다.</p>'],
 ['오류 코드로 원인 좁히기','<div class="table-wrap"><table><tr><th>코드·증상</th><th>흔한 원인</th><th>먼저 할 일</th></tr><tr><td>401</td><td>키가 틀렸거나 없음</td><td>환경 변수가 설정됐는지 앞 몇 글자만 출력해 확인</td></tr><tr><td>403</td><td>이 주소나 모델에 권한 없음</td><td>키의 권한과 모델 이름 확인</td></tr><tr><td>429</td><td>요청 한도 초과</td><td>기다렸다 재시도, 요청 빈도 줄이기</td></tr><tr><td>400</td><td>요청 형식 오류</td><td>필수 필드와 모델 이름 철자를 문서와 비교</td></tr><tr><td>500·502·503</td><td>서버 쪽 문제</td><td>잠시 뒤 재시도</td></tr><tr><td>시간 초과·연결 거부</td><td>긴 응답, 잘못된 주소, 네트워크</td><td>max_tokens 줄이기·스트리밍, 주소 확인</td></tr></table></div>'],
 ['키를 어디에 둘까','<ul><li>셸에서 <code>export</code>로 두면 그 셸에서 띄운 프로그램만 읽습니다.</li><li>.env 파일은 편하지만 .gitignore에 넣기 전에 커밋하면 소용이 없습니다. 저장소를 만들 때 .gitignore부터 씁니다.</li><li>노트북 셀이나 코드에 키를 붙여 넣으면 출력과 함께 저장될 수 있습니다.</li><li>원본은 지금 모든 API를 가입할 필요는 없고 레슨이 요구할 때 준비하라고 말합니다.</li></ul>']],
 warning:'키를 지우는 커밋을 새로 만들어도 이전 커밋에는 키가 그대로 있습니다. .gitignore는 앞으로 추적하지 않을 파일을 정할 뿐, 이미 기록된 것을 지우지 않습니다. 노출이 의심되면 기록 정리보다 키 폐기가 먼저입니다.',
 quiz:['API 호출이 429를 돌려줍니다. 먼저 할 일은?',['키를 폐기하고 새로 발급한다','잠시 기다렸다 다시 시도하거나 요청 빈도를 줄인다','요청 본문의 모델 이름 철자를 고친다'],1,'429는 요청 한도를 넘었다는 뜻입니다. 키나 형식의 문제가 아니므로 속도를 늦추는 것이 맞습니다.'],
 cross:[['AI Book 12 · 도구를 쓰고 결과를 확인하기','../ai/#agents','에이전트는 이 API 호출을 반복문 안에서 여러 번 부릅니다. 호출 한 번의 구조와 오류 코드를 알고 가면, 에이전트가 도구 결과를 확인하고 다음 행동을 고르는 흐름이 더 구체적으로 보입니다.']]},

{id:'notebook',title:'노트북의 숨은 상태와 편집기',subtitle:'커널은 누른 순서대로 실행하고, 지운 셀의 변수도 기억합니다.',desc:'내 화면에서 돌던 노트북이 왜 팀원에게서는 깨질까요?',group:'작업 습관',time:'15분',labs:['kernel'],source:[6,9,18,19,23],thumb:['셀','커널','재시작'],
 paragraphs:[
 '앞 장에서 키를 코드 밖으로 뺐으니, 이제 review-lab의 리뷰 데이터를 들여다보며 모델을 시험할 차례입니다. 주피터 노트북은 코드 셀과 설명 셀을 섞어 두고, 셀마다 실행해 표와 그래프를 바로 아래에 보여 줍니다. 셀을 실행하면 코드는 배경에서 도는 커널이라는 Python 프로세스로 가고, 모든 셀이 같은 커널을 쓰므로 변수가 셀 사이에 남습니다. 커널은 화면의 순서가 아니라 내가 누른 순서대로 실행합니다. 이 점이 노트북을 빠르게 만들지만 동시에 가장 큰 함정입니다.',
 '셀을 순서 없이 실행하거나, 변수를 만든 셀을 지운 뒤에도 그 변수가 메모리에 남아 있으면, 내 화면에서는 돌던 노트북이 팀원이 위에서부터 실행할 때 깨집니다. 원본의 처방은 공유하기 전에 커널을 다시 시작하고 모두 실행(Restart & Run All)하는 것, 그리고 “탐색은 노트북에서, 배포는 스크립트로”라는 규칙입니다. 편집기 설정도 같은 종류의 실수를 미리 막습니다. 자동 저장은 저장하지 않은 옛 코드로 학습을 돌리는 일을, 기본 타입 검사는 잘못된 인자를 실행 전에 잡고, Remote SSH는 원격 GPU 상자의 파일을 내 화면에서 고치게 해 줍니다. 그렇다면 코드와 실행 순서가 깨끗해진 뒤에도 남는, 데이터 쪽의 재현 실패는 어떻게 막을까요?'],
 formula:'공유해도 되는 노트북 ⇔ 지금 커널의 결과 = 커널을 다시 시작하고 위에서부터 실행한 결과',formulaNote:'실험은 셀 세 개(x = 1, x = x + 1, y = x * 10)를 실제로 해석해 두 결과를 비교합니다. 실제 노트북에는 출력·파일 쓰기·난수처럼 이 비교로 드러나지 않는 상태도 있으므로, 같다는 것은 필요조건일 뿐입니다.',
 flow:['셀 실행|누른 순서대로 커널에 전달','커널 상태|변수가 셀 사이에 남는다','재시작 후 실행|화면 순서대로 처음부터','비교|같아야 공유한다'],
 details:[
 ['노트북 사용법 요약','<ul><li>JupyterLab, Jupyter Notebook, VS Code의 Jupyter 확장은 모두 같은 .ipynb(셀·출력·메타데이터를 담은 JSON)를 읽고 씁니다.</li><li><kbd>Shift+Enter</kbd>로 실행하고 다음 셀로 갑니다. <kbd>Esc</kbd>는 명령 모드, <kbd>Enter</kbd>는 편집 모드이며, 명령 모드에서 A·B로 셀 추가, DD로 삭제, M·Y로 종류를 바꿉니다.</li><li>매직 명령: <code>%timeit</code>은 여러 번 돌려 평균을, <code>%%time</code>은 한 번의 시간을 잽니다. <code>%matplotlib inline</code>, 셸 명령 <code>!pip</code>, 환경 변수 <code>%env</code>도 씁니다.</li><li>Colab은 GPU와 주요 라이브러리를 미리 갖추지만 세션이 끝나면 파일이 사라지고, 무료 등급은 오래 쉬면 세션이 끊깁니다. 원본은 90분이라고 적었지만, Colab FAQ는 유휴 시간 제한이 수시로 바뀌어 공개하지 않는다고 밝힙니다(확인일 2026-10-08). 드라이브를 연결해 저장합니다.</li></ul>'],
 ['세 가지 함정과 노트북·스크립트 나누기','<p>원본이 꼽는 함정은 순서 없는 실행, 지운 셀이 남긴 숨은 상태, 큰 데이터를 계속 올려 생기는 메모리 누수입니다. 처방은 각각 Restart & Run All, 정기적인 커널 재시작, <code>del</code>과 <code>gc.collect()</code> 또는 재시작입니다. 데이터 탐색·모델 시제품·시각화·설명은 노트북에, 학습 파이프라인·재사용 함수·정해진 시각에 도는 코드·배포 코드는 .py 스크립트에 둡니다. 노트북에서 된 코드를 스크립트로 옮기고, 다시 노트북에서 import해 실험을 이어 가는 흐름이 흔합니다.</p>'],
 ['편집기를 다섯 층으로 갖추기','<p>원본은 VS Code를 기본으로 두고 그 위에 확장(Python, Pylance, Jupyter, GitLens, Remote SSH, Debugpy, Black, Ruff), AI 작업용 설정, 통합 터미널, 원격 개발을 쌓습니다. 핵심 설정은 기본 타입 검사, 저장할 때 서식 정리, 88·120자 눈금, 노트북 출력 스크롤, 지연 자동 저장입니다. 편집기는 언어 서버 프로토콜(LSP)로 자동 완성과 오류 표시를 받아 옵니다. 터미널을 나눠 한쪽에서 학습을, 다른 쪽에서 <code>nvidia-smi -l 1</code>을 띄우고, <code>~/.ssh/config</code>에 상자 별명과 ed25519 키를 적어 Remote SSH로 바로 접속합니다. Cursor·Windsurf는 같은 설정을 쓰는 VS Code 계열이고, 이미 Vim에 익숙하다면 pyright·LSP·노트북 플러그인을 갖춰 그대로 써도 됩니다.</p>']],
 warning:'노트북 화면에 보이는 셀 순서는 실행 순서가 아닙니다. 셀 왼쪽의 실행 번호가 실제 순서이고, 지운 셀이 만든 변수도 커널이 살아 있는 한 남아 있습니다. 화면이 깔끔하다는 것은 재현된다는 증거가 아닙니다.',
 quiz:['셀 1 x = 1, 셀 2 x = x + 1, 셀 3 y = x * 10이 있습니다. 1, 2, 2, 3 순서로 실행했다면 y는?',['20','30','10'],1,'셀 2를 두 번 실행해 x가 3이 되었으므로 y = 30입니다. 다시 시작해 위에서부터 실행하면 20이 되어 결과가 달라집니다.']},

{id:'data',title:'데이터를 나누고 기록하기',subtitle:'시드를 고정해 같은 분할을 다시 만들고, 시드가 바뀌면 누수가 생깁니다.',desc:'정확도가 갑자기 오른 이유가 데이터에 있다면?',group:'작업 습관',time:'15분',labs:['split'],source:[10,24,25],thumb:['캐시','분할','시드'],
 paragraphs:[
 '앞 장에서 노트북을 위에서부터 다시 실행해도 같은 결과가 나오게 만들었습니다. 그런데 review-lab의 정확도가 실행할 때마다 조금씩 다르고, 어느 날은 갑자기 크게 오릅니다. 원인은 코드가 아니라 데이터에 있을 수 있습니다. 원본은 Hugging Face datasets 라이브러리로 데이터를 받고, 한 번 받은 것은 ~/.cache/huggingface 아래 캐시에서 다시 읽으며, 디스크에 다 담기 어려운 데이터는 스트리밍으로 한 줄씩 흘려 처리하는 흐름을 보여 줍니다. 저장 형식도 고릅니다. CSV와 JSON은 사람이 읽기 쉬운 교환용이고, Parquet은 작고 빠른 열 단위 저장 형식이며, Arrow는 메모리 안에서 쓰는 형식입니다.',
 '학습 전에 데이터를 훈련·검증·평가 세트로 나누는데, 원본 예시는 먼저 20%를 평가용으로 떼고 남은 것의 12.5%를 검증용으로 떼어 70·10·20으로 나눕니다. 이때 섞는 순서를 정하는 시드를 고정해야 같은 분할이 다시 나옵니다. 시드를 바꿔 다시 나누면 예전에 학습에 쓴 리뷰가 새 평가 세트에 섞여 들어가고, 옛 체크포인트를 새 평가 세트로 재면 점수가 부풀려집니다. 큰 파일은 Git 대신 .gitignore, Git LFS, DVC 중 하나로 다룹니다. 그렇다면 환경과 데이터까지 고정했는데도 학습이 이상할 때는 어디부터 들여다봐야 할까요?'],
 formula:'누수 비율 = |새 평가 세트 ∩ 옛 훈련 세트| ÷ |새 평가 세트|',formulaNote:'실험은 리뷰 번호 0…N−1을 시드 난수(mulberry32)로 섞어 실제로 나누고 겹치는 번호를 셉니다. datasets의 train_test_split과 같은 난수 생성기를 쓰지 않으므로 같은 시드라도 원본 코드와 같은 분할은 아닙니다. 시간 순서 누수(미래 데이터로 과거를 예측)는 다루지 않습니다.',
 flow:['받기|Hub에서 내려받아 캐시','변환|CSV·JSON·Parquet·Arrow','분할|시드로 70·10·20','기록|큰 파일은 LFS·DVC'],
 details:[
 ['받기·캐시·스트리밍','<p><code>load_dataset</code>은 처음에 내려받고 다음부터 캐시에서 읽습니다. <code>streaming=True</code>로 열면 전체를 받지 않고 한 줄씩 처리하므로 데이터 크기와 상관없이 메모리가 일정합니다. 모델 파일은 <code>hf_hub_download</code>로 파일 하나를, <code>snapshot_download</code>로 저장소 전체를 받으며 ~/.cache/huggingface/hub에 쌓입니다. 원본 기준으로 IMDB 리뷰는 약 84MB이고, 이 책의 review-lab은 이 데이터를 떠올리게 하는 교육용 사례입니다.</p>'],
 ['네 가지 형식','<div class="table-wrap"><table><tr><th>형식</th><th>크기</th><th>읽기</th><th>잘 맞는 곳</th></tr><tr><td>CSV</td><td>큼</td><td>느림</td><td>사람이 읽기, 스프레드시트</td></tr><tr><td>JSON</td><td>큼</td><td>느림</td><td>API, 중첩 데이터</td></tr><tr><td>Parquet</td><td>작음</td><td>빠름</td><td>저장, 열 단위 분석</td></tr><tr><td>Arrow</td><td>작음</td><td>가장 빠름</td><td>메모리 안 처리(datasets 내부)</td></tr></table></div><p>원본은 저장은 Parquet, 메모리 안 작업은 Arrow, 교환은 CSV·JSON으로 정리합니다.</p>'],
 ['큰 파일을 다루는 세 방법','<div class="table-wrap"><table><tr><th>방법</th><th>복잡도</th><th>잘 맞는 곳</th></tr><tr><td>.gitignore</td><td>낮음</td><td>다시 받을 수 있는 개인 프로젝트 데이터</td></tr><tr><td>Git LFS</td><td>중간</td><td>팀이 Git으로 가중치를 나눌 때. 저장소에는 포인터만 남깁니다.</td></tr><tr><td>DVC</td><td>높음</td><td>작은 .dvc 파일로 S3·GCS의 데이터를 가리켜 실험을 정확히 재현할 때</td></tr></table></div><p>원본은 10GB 아래는 로컬 캐시로 충분하고, 그보다 크거나 여러 기계가 함께 쓰면 클라우드 저장소를 쓰라고 안내합니다.</p>']],
 warning:'시드를 고정했다고 데이터가 고정되는 것은 아닙니다. 시드는 같은 데이터를 같은 방식으로 섞을 때만 같은 결과를 보장합니다. 원본 데이터가 바뀌거나 행 순서가 달라지면 같은 시드라도 다른 분할이 나오므로, 데이터 버전도 함께 기록해야 합니다.',
 quiz:['test_size=0.2로 나눈 뒤 남은 훈련 세트에서 다시 test_size=0.125로 검증 세트를 떼면 전체 대비 비율은?',['80·10·10','70·10·20','70·15·15'],1,'평가 20%를 먼저 떼고, 남은 80%의 12.5%인 10%를 검증으로 뗍니다. 훈련은 70%가 남습니다.'],
 cross:[['AI Book 03 · 외우는 것과 배우는 것','../ai/#generalization','평가 세트를 따로 두는 이유는 외운 것과 배운 것을 구분하기 위해서입니다. 과적합 실험을 보고 오면 누수가 왜 “너무 좋은 점수”로 나타나는지 이해할 수 있습니다.'],['확률과 통계 06 · 불량률을 범위로 말하기','../probability/#interval','평가 세트 200개에서 잰 정확도도 표본에서 센 비율입니다. 범위로 말하는 법을 익히면 1~2%포인트의 차이를 개선으로 단정하지 않게 됩니다.']]},

{id:'debug',title:'조용히 틀리는 학습 잡기',subtitle:'멈추지 않는 버그는 측정으로 찾습니다. 구간별 시간, 텐서, 손실 곡선 순서로 봅니다.',desc:'GPU는 비싼데 왜 학습이 느리고, 손실은 왜 튈까요?',group:'진단',time:'18분',labs:['profile','curve'],source:[13,28,29],thumb:['타이머','텐서','곡선'],
 paragraphs:[
 '앞 장에서 데이터 분할과 버전까지 고정했으니, 이제 남은 이상은 학습 코드 안에서 찾아야 합니다. 웹 서비스의 버그는 대개 오류 메시지와 함께 멈추지만, AI 학습의 버그는 멈추지 않고 몇 시간 동안 GPU 비용을 쓰다가 그럴듯한 손실 곡선과 쓸모없는 모델을 남깁니다. 원본은 디버깅을 세 수준으로 나눕니다. 가장 아래는 중단점·로그·프로파일링·메모리를 다루는 일반 Python 수준, 그 위는 텐서의 모양·자료형·장치·NaN을 보는 수준, 맨 위는 손실 곡선과 기울기를 보는 학습 동역학 수준입니다. 많은 사람이 맨 위의 TensorBoard부터 들여다보지만, 원본은 버그 대부분이 아래 두 수준에 있다고 말합니다.',
 '속도 문제는 측정부터 합니다. 데이터 불러오기·순전파·역전파 구간에 타이머를 달면, 데이터 로딩이 시간의 60%를 차지하는 경우가 흔하고 그때 답은 더 빠른 GPU가 아니라 DataLoader의 num_workers를 늘리는 것이라고 원본은 설명합니다. 손실이 NaN이 되거나 출렁이면 학습률, 0으로 나누기, log(0), 기울기 폭발을 의심하고, 손실이 100을 넘거나 NaN일 때만 멈추는 조건부 중단점을 걸어 그 순간의 텐서를 봅니다. 평가 정확도가 99%로 너무 좋으면 축하보다 누수 검사가 먼저입니다. 이 장에서는 병목과 손실 곡선을 직접 만들어 진단합니다. 이제 실제 고장 보고가 오면, 지금까지의 도구를 어떤 순서로 꺼내야 가장 빨리 원인에 닿을까요?'],
 formula:'한 단계 시간 ≈ 일꾼 0명: 로딩 + 계산 · 일꾼 n명: max(로딩 ÷ n, 계산)',formulaNote:'일꾼이 다음 배치를 미리 읽어 계산과 완전히 겹치고, 일꾼 수에 비례해 빨라진다고 가정한 모형입니다. 실제로는 디스크·CPU 코어·전처리 비용 때문에 어느 지점에서 더 빨라지지 않습니다. 손실 곡선 실험은 L = w²에 경사하강 w ← w − η·2w를 실제로 반복하며, |1 − 2η| < 1일 때만 줄어듭니다.',
 flow:['일반 Python|중단점·로그·타이머·메모리','텐서|모양·자료형·장치·NaN','학습 동역학|손실·기울기 곡선','고친 뒤 다시 재기|증상이 사라졌는가'],
 details:[
 ['세 수준의 도구','<ul><li><b>출력으로 보기</b>: 모양·자료형·장치·최솟값·최댓값·평균·NaN 여부를 한 줄에 찍는 함수를 의심 가는 연산 뒤에 둡니다.</li><li><b>조건부 중단점</b>: <code>if loss.item() &gt; 100 or isnan(loss): breakpoint()</code>. 멈추면 <code>p 변수</code>로 보고 <code>c</code>로 계속, <code>q</code>로 끝냅니다. VS Code에서는 launch.json에 justMyCode를 끄면 라이브러리 안까지 들어갑니다.</li><li><b>로그</b>: logging으로 시간·심각도를 붙여 파일과 화면에 함께 남깁니다. 새벽 3시에 멈춘 학습은 로그 파일로만 읽을 수 있습니다.</li><li><b>시간</b>: <code>perf_counter</code> 타이머로 구간을 재고, <code>python -m cProfile -s cumtime</code>으로 함수별 누적 시간을, line_profiler로 줄별 시간을 봅니다.</li><li><b>메모리</b>: CPU는 tracemalloc·memory_profiler로, GPU는 할당량과 예약량을 출력해 봅니다.</li></ul>'],
 ['원본이 꼽는 네 가지 AI 버그','<ul><li><b>모양 불일치</b>: 가장 흔합니다. 모든 층에 forward hook을 걸어 표본 배치 하나로 입력·출력 모양을 한 번 지도처럼 찍습니다.</li><li><b>NaN 손실</b>: 큰 학습률, 0으로 나누기, 0이나 음수의 로그, 기울기 폭발이 원인입니다. NaN이 나오면 어떤 파라미터의 기울기에 NaN·Inf가 있는지 찾습니다.</li><li><b>데이터 누수</b>: 훈련과 평가의 ID 집합이 겹치는지 셉니다. 시간 데이터는 시간순으로 정렬한 뒤 나눕니다.</li><li><b>잘못된 장치</b>: 장치가 다르면 대개 오류가 나지만, 텐서 하나가 CPU에 남아 조용히 느려지기도 합니다. 모델의 장치와 입력 텐서들의 장치를 비교합니다.</li></ul>'],
 ['메모리 부족과 TensorBoard 읽기','<p>GPU 메모리가 부족하면 원본은 배치 크기 줄이기, 캐시 비우기, 큰 중간값 지우기, 혼합 정밀도, 기울기 체크포인팅 순서로 시도하라고 합니다. TensorBoard에서 손실이 줄지 않으면 학습률이 너무 작거나 구조 문제, 크게 출렁이면 학습률이 너무 큼, NaN이면 수치 불안정, 훈련 손실은 줄고 검증 손실이 오르면 과적합, 가중치 분포가 0으로 모이면 기울기 소실, 기울기 분포가 터지면 기울기 자르기가 필요하다는 신호입니다. 원본의 순서는 학습 전 모양 확인, 처음 10단계 값 확인, 학습 중 기록, 고장 지점의 중단점, 성능은 구간별 시간 측정입니다.</p>']],
 warning:'GPU 사용률이 낮다고 GPU가 느린 것은 아닙니다. 대부분은 GPU가 다음 배치를 기다리며 놀고 있다는 뜻이고, 이때 더 비싼 GPU를 빌리면 노는 시간만 늘어납니다. 먼저 구간별 시간을 재어 기다림이 어디서 생기는지 확인하세요.',
 quiz:['데이터 로딩 60ms, 순전파와 역전파 합 40ms인 학습에서 num_workers를 0에서 2로 바꾸면 이 책의 모형에서 한 단계 시간은?',['100ms','40ms','30ms'],1,'일꾼 2명이면 로딩이 30ms로 줄고 계산과 겹치므로 더 긴 쪽인 계산 40ms가 한 단계 시간이 됩니다. 이제 병목은 계산입니다.'],
 cross:[['AI Book 02 · 오차를 줄이는 방향으로','../ai/#learning','학습률이 너무 크면 손실이 왜 튀어 오르는지 경사하강을 직접 조작하며 봅니다. 이 장의 손실 곡선 실험과 같은 원리를 다른 그림으로 확인할 수 있습니다.'],['LLM 시스템 09 · 들어가는데 왜 느릴까?','../llm-gpu/#bottleneck','계산기보다 데이터를 옮기는 쪽이 느려 생기는 병목을 GPU 안에서 다시 봅니다. DataLoader의 기다림과 같은 구조라는 것을 확인하고 돌아오세요.']]},

{id:'final',title:'마지막 과제 · 팀원의 상자에서 결과가 다르다',subtitle:'같은 커밋, 다른 결과. 증상에서 확인 순서를 세우고 부족한 증거를 묻습니다.',desc:'고장 보고 한 줄로 어디부터 확인해야 할까요?',group:'진단',time:'18분',labs:['triage'],source:[1,2,7,10,13],thumb:['보고','순서','증거'],
 paragraphs:[
 '앞 장까지 review-lab은 점검된 작업대, 프로젝트별 환경, Git 기록, 빌린 GPU, tmux 세션, 도커 이미지, 코드 밖의 키, 깨끗한 노트북, 고정된 분할, 측정 도구를 갖추었습니다. 이제 팀원이 같은 커밋을 받아 자기 상자에서 돌렸더니 결과가 다르다는 보고를 보냅니다. 보고는 넷 중 하나입니다. import torch가 실패한다, CUDA가 보이지 않는다, 평가 정확도가 99%로 나온다, 학습이 세 배 느리다. 각 보고의 원인은 이 책의 서로 다른 장에 있고, 확인하는 데 드는 시간도 다릅니다.',
 '이 장의 실험은 확인 순서 전략을 바꾸면 원인을 드러내는 점검까지 걸리는 시간이 어떻게 달라지는지 계산합니다. 아래층부터 차례로 점검하는 방법, 증상에 맞는 점검부터 하는 방법, 원본이 경계한 대로 손실 곡선부터 들여다보는 방법을 비교합니다. 점검마다 걸리는 분 단위 시간은 교육용 가정값입니다. 실험을 마친 뒤 확인 문제에 답하기 전에 세 가지를 적어 보세요. 무엇을 바꿀 것인가, 왜 그렇게 판단했는가, 판단하기에 아직 어떤 증거가 부족한가. 팀원의 보고 한 줄만으로 원인을 확정할 수 없을 때, 무엇을 더 물어봐야 할까요?'],
 formula:'원인까지 걸린 시간 = 원인을 드러내는 점검이 나올 때까지 거친 점검 시간의 합',formulaNote:'보고마다 원인을 하나로 정해 둔 시나리오입니다. 실제 고장은 원인이 여럿이거나 증상이 겹치므로, 첫 점검에서 찾은 원인은 고친 뒤 다시 재어 증상이 사라지는지로 확인해야 합니다. 점검 시간(3~20분)은 교육용 가정값입니다.',
 flow:['보고 읽기|증상 한 줄','가설|어느 장의 층인가','점검 순서|증상 우선·아래층부터','확인|고친 뒤 다시 잰다'],
 details:[
 ['네 보고와 필요한 증거','<div class="table-wrap"><table><tr><th>보고</th><th>먼저 볼 장</th><th>받아야 할 증거</th></tr><tr><td>import torch 실패</td><td>2장 가상 환경</td><td><code>which python</code>, 활성화 여부, 잠금 파일로 설치했는지</td></tr><tr><td>CUDA가 보이지 않음</td><td>2장 CUDA, 6장 도커</td><td><code>nvidia-smi</code>의 드라이버 CUDA, <code>torch.version.cuda</code>, 컨테이너라면 <code>--gpus</code> 옵션</td></tr><tr><td>정확도 99%</td><td>9장 분할</td><td>분할 시드와 데이터 버전, 훈련·평가 ID 겹침 수</td></tr><tr><td>세 배 느림</td><td>10장 프로파일링</td><td>구간별 시간, GPU 사용률, 모델과 입력 텐서의 장치, num_workers</td></tr></table></div>'],
 ['팀원에게 되물을 것','<ul><li>정확히 어떤 커밋인가: <code>git log --oneline -1</code>의 해시, 도커라면 이미지 태그.</li><li>어떤 경로의 사전 점검을 돌렸고 종료 코드가 무엇이었나.</li><li>내 상자와 다른 점은 무엇인가: 운영체제, 드라이버, GPU 유무, Mac 여부.</li><li>노트북이라면 Restart & Run All로 다시 실행했는가.</li><li>바꾼 것을 되돌렸을 때 증상이 사라지는가. 이것이 원인이라고 말할 수 있는 마지막 증거입니다.</li></ul>']],
 warning:'증상과 원인은 일대일이 아닙니다. 학습이 느린 이유는 데이터 로딩일 수도, 텐서가 CPU에 남은 장치 문제일 수도, 아예 CPU용 PyTorch가 깔린 환경 문제일 수도 있습니다. 첫 점검에서 그럴듯한 원인을 찾았더라도 고친 뒤 다시 재어 증상이 사라졌는지 확인해야 원인이라고 말할 수 있습니다.',
 quiz:['팀원이 “학습이 세 배 느리고 GPU 사용률이 20%”라고 보고했습니다. 가장 먼저 요청할 증거는?',['TensorBoard 손실 곡선 화면','데이터 로딩·순전파·역전파 구간별 시간과 모델·입력 텐서의 장치','새로 발급한 API 키'],1,'느림과 낮은 GPU 사용률은 GPU가 기다린다는 신호입니다. 구간별 시간과 장치 정보가 있어야 로딩 병목인지 장치 문제인지 가를 수 있습니다.'],
 cross:[['LLM 시스템 12 · 내 장비의 실행 예산 만들기','../llm-gpu/#design','팀원의 상자가 애초에 이 모델을 돌릴 예산이 되는지 따지는 일은 저 장에서 체계적으로 합니다. 환경 문제와 장비 한계를 구분하는 데 도움이 됩니다.']]}
]
};
