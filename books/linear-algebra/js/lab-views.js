/* 실험 화면의 마크업과 안내(무엇을 확인하나요?·비교 예제·결과 읽기). 계산은 labs-*.js와 linalg.js가 맡습니다. */
window.LAViews = {
 "vector-mix": {
  "title": "두 노래 섞기",
  "desc": "섞는 비율 t를 바꾸면 보라색 화살표 m = (1 − t)·a + t·b가 a와 b 사이를 움직입니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><label>노래 a <select name=\"a\" id=\"mix-a\"></select></label>\n<label>노래 b <select name=\"b\" id=\"mix-b\"></select></label>\n<div class=\"field\"><label for=\"mix-t\">섞는 비율 t</label><input type=\"range\" id=\"mix-t\" name=\"t\" min=\"0\" max=\"1\" step=\"0.05\" value=\"0.5\" data-digits=\"2\"><output for=\"mix-t\">0.50</output></div>\n<div class=\"buttons\"><button type=\"button\" data-play>a + b 과정 재생</button></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-mix-svg-t\"><title id=\"lab-mix-svg-t\">노래 a, b와 섞은 재생목록 m의 화살표. 정확한 값은 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>a = 골목 재즈 (−1, 0.5), b = 여름 축제 (3, 2.5)일 때 t = 0.5이면 m = (1, 1.5)이고, 가장 가까운 노래는 아침 달리기(거리 1.00)입니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> 입력: 노래 두 곡(특징 점수, 단위 없음), t는 0~1. 출력: m의 좌표와 가장 가까운 노래까지의 직선거리. t = 0이면 m은 a, t = 1이면 b와 같습니다. 재생 버튼은 b를 a의 끝에 이어 붙여 a + b를 만드는 과정을 보여 줍니다.</p>",
  "task": "실험 1에서 a를 자장가, b를 여름 축제로 고르고 t를 0, 0.5, 1로 바꿔 보세요. 가운데에서 m의 길이가 0이 되는 순간을 확인하면, 덧셈이 ‘상쇄’도 할 수 있다는 점이 눈에 들어옵니다.",
  "guide": [
   "노래 두 곡 a, b와 비율 t로 섞은 재생목록 m = (1 − t)·a + t·b가 어디에 놓이는지 봅니다. 보라 화살표가 m입니다.",
   [
    [
     "반씩 섞기",
     {
      "a": "jazz",
      "b": "festival",
      "t": 0.5
     }
    ],
    [
     "a만 남기기",
     {
      "a": "jazz",
      "b": "festival",
      "t": 0
     }
    ],
    [
     "서로 상쇄되는 두 곡",
     {
      "a": "lullaby",
      "b": "festival",
      "t": 0.5
     }
    ]
   ],
   "t를 움직이면 m은 a와 b를 잇는 곧은 선 위만 지나갑니다. 자장가와 여름 축제를 반씩 섞으면 m = (0, 0)이 되어 화살표가 사라집니다. 노래 점수는 설명용 가상 값입니다."
  ]
 },
 "similarity": {
  "title": "나와 B의 닮음 재기",
  "desc": "B의 방향과 길이를 바꾸거나 그림을 눌러 B를 옮겨 보세요. 붉은 화살표는 나의 취향 (1, 2)로 고정입니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><div class=\"field\"><label for=\"sim-angle\">B의 방향</label><input type=\"range\" id=\"sim-angle\" name=\"angle\" min=\"0\" max=\"359\" step=\"1\" value=\"30\" data-digits=\"0\" data-unit=\"°\"><output for=\"sim-angle\">30°</output></div>\n<div class=\"field\"><label for=\"sim-len\">B의 길이</label><input type=\"range\" id=\"sim-len\" name=\"len\" min=\"0\" max=\"4\" step=\"0.1\" value=\"2.5\"><output for=\"sim-len\">2.5</output></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-sim-svg\"><title id=\"lab-sim-svg\">나의 취향 화살표와 조절할 수 있는 B 화살표. 값은 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>B의 방향 30°, 길이 2.5일 때 내적은 4.67, 코사인 유사도는 0.83, 사잇각은 33°입니다.</p></div><h4>여덟 곡을 두 기준으로 줄 세우기</h4><div class=\"ranking table-scroll\"></div><p class=\"caption lab-note\"><b>계산 조건</b> 입력: 방향 0~359°(가로축에서 반시계 방향), 길이 0~4(특징 점수 단위). 출력: 내적, 코사인 유사도(−1~1), 사잇각. B의 길이가 0이면 방향이 없으므로 코사인과 각도는 계산하지 않습니다.</p>",
  "task": "B의 방향을 153°에 두고 길이를 0.5에서 4까지 바꿔 보세요. 길이가 아무리 길어도 내적이 0 근처에 머무는 것을 확인하면, ‘직각’이 ‘관련 없음’을 뜻하는 이유가 손에 잡힙니다.",
  "guide": [
   "B의 방향과 길이를 따로 바꾸며 내적과 코사인 유사도가 각각 무엇에 반응하는지 확인합니다. 붉은 화살표는 나의 취향 (1, 2)입니다.",
   [
    [
     "같은 방향 63°",
     {
      "angle": 63,
      "len": 2.5
     }
    ],
    [
     "직각 153°",
     {
      "angle": 153,
      "len": 2.5
     }
    ],
    [
     "반대 방향 243°",
     {
      "angle": 243,
      "len": 2.5
     }
    ]
   ],
   "방향이 같으면 코사인은 1, 직각이면 0, 반대면 −1에 가깝습니다. 길이만 바꾸면 내적은 비례해 변하지만 코사인은 그대로입니다. 아래 표는 여덟 곡을 실제로 계산한 결과입니다."
  ]
 },
 "projection": {
  "title": "취향 방향 돌리기",
  "desc": "방향 θ를 바꾸면 붉은 점선(취향 방향)이 돌고, 표의 순위가 다시 매겨집니다. ‘그림자 떨어뜨리기’를 누르면 노래들이 선 위로 내려앉습니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><div class=\"field\"><label for=\"proj-theta\">취향 방향 θ</label><input type=\"range\" id=\"proj-theta\" name=\"theta\" min=\"0\" max=\"180\" step=\"1\" value=\"63\" data-digits=\"0\" data-unit=\"°\"><output for=\"proj-theta\">63°</output></div>\n<div class=\"buttons\"><button type=\"button\" data-play>그림자 떨어뜨리기</button></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-proj-svg\"><title id=\"lab-proj-svg\">취향 방향 선과 노래들의 그림자. 순위는 옆의 표에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>θ = 63°이면 1위는 여름 축제(3.59), 꼴찌는 자장가(−3.59)입니다.</p></div><div class=\"ranking table-scroll\"></div><p class=\"caption lab-note\"><b>계산 조건</b> 입력: 방향 θ = 0~180°(0°는 빠르기만, 90°는 에너지만 따지는 취향). 계산: u = (cos θ, sin θ), 점수 = s·u. 출력 점수의 단위는 노래 특징과 같습니다. 그림자 애니메이션은 계산 결과로 점을 옮기는 연출이며, 점이 겹쳐 이름이 겹칠 수 있습니다.</p>",
  "task": "θ를 63°에 두고 ‘그림자 떨어뜨리기’를 누른 뒤, 골목 재즈와 출근 지하철이 같은 자리에 서는 것을 확인하세요. 투영 하나로는 구별할 수 없는 노래가 생긴다는 것이 다음 장의 출발점입니다.",
  "guide": [
   "취향 방향 θ에 길이 1짜리 자를 대고, 노래마다 그 자 위에 드리운 그림자 길이를 점수로 씁니다.",
   [
    [
     "내 취향 63°",
     {
      "theta": 63
     }
    ],
    [
     "에너지 쪽 80°",
     {
      "theta": 80
     }
    ],
    [
     "빠르기만 0°",
     {
      "theta": 0
     }
    ]
   ],
   "63°에서는 여름 축제(3.59)가 옥상 록 공연(3.35)을 근소하게 앞서고, 72°를 넘기면 순위가 뒤집힙니다. 0°에서는 빠르기 점수만 남아 골목 재즈가 −1점이 됩니다."
  ]
 },
 "matrix-grid": {
  "title": "행렬로 평면 옮기기",
  "desc": "네 숫자 a, b, c, d를 바꾸거나 예시를 고르세요. 연한 격자는 원래 평면, 파란 격자는 옮겨진 평면입니다. ‘변환 재생’은 항등행렬에서 M까지 천천히 바뀌는 과정을 보여 줍니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><label>예시 행렬 <select name=\"preset\" id=\"m-preset\">\n<option value=\"identity\" selected>항등(그대로)</option><option value=\"scores\">두 점수표(3장 방향과 직각 방향)</option>\n<option value=\"stretch\">가로 2배, 세로 절반</option><option value=\"rotate\">45° 회전에 가까움</option>\n<option value=\"shear\">오른쪽으로 밀기</option><option value=\"flat\">한 직선으로 납작하게</option></select></label>\n<div class=\"field\"><label for=\"m-a\">a (1행 1열)</label><input type=\"range\" id=\"m-a\" name=\"a\" min=\"-2\" max=\"2\" step=\"0.01\" value=\"1\" data-digits=\"2\"><output for=\"m-a\">1.00</output></div>\n<div class=\"field\"><label for=\"m-b\">b (1행 2열)</label><input type=\"range\" id=\"m-b\" name=\"b\" min=\"-2\" max=\"2\" step=\"0.01\" value=\"0\" data-digits=\"2\"><output for=\"m-b\">0.00</output></div>\n<div class=\"field\"><label for=\"m-c\">c (2행 1열)</label><input type=\"range\" id=\"m-c\" name=\"c\" min=\"-2\" max=\"2\" step=\"0.01\" value=\"0\" data-digits=\"2\"><output for=\"m-c\">0.00</output></div>\n<div class=\"field\"><label for=\"m-d\">d (2행 2열)</label><input type=\"range\" id=\"m-d\" name=\"d\" min=\"-2\" max=\"2\" step=\"0.01\" value=\"1\" data-digits=\"2\"><output for=\"m-d\">1.00</output></div>\n<div class=\"buttons\"><button type=\"button\" data-play>변환 재생</button></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-matrix-svg\"><title id=\"lab-matrix-svg\">원래 격자와 행렬로 옮긴 격자, 그리고 옮겨진 노래 점들. 숫자는 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>항등행렬 [1, 0 ; 0, 1]은 모든 점을 그대로 둡니다. e₁ = (1, 0)은 첫째 열 (1, 0)로, e₂ = (0, 1)은 둘째 열 (0, 1)로 갑니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> M = [a, b ; c, d]. 각 값의 범위는 −2~2. 노래 점은 M·s 위치에 그립니다. 예시를 고른 뒤 슬라이더를 움직이면 예시와 다른 행렬이 됩니다. 이 실험은 원점을 옮기지 못합니다. 평행이동은 행렬 곱만으로는 만들 수 없기 때문입니다(10장의 +b가 그 역할을 합니다).</p>",
  "task": "항등행렬에서 시작해 b만 0에서 1로 올려 보세요. 가로선은 그대로인데 세로선만 오른쪽으로 눕습니다. e₂ 하나만 옮겨도 평면 전체가 따라 움직인다는 것을 볼 수 있습니다.",
  "guide": [
   "네 숫자 a, b, c, d가 격자 전체를 어디로 옮기는지 봅니다. 파란 화살표는 e₁, 청록 화살표는 e₂의 도착지입니다.",
   [
    [
     "가로 2배·세로 절반",
     {
      "preset": "stretch",
      "a": 2,
      "b": 0,
      "c": 0,
      "d": 0.5
     }
    ],
    [
     "두 점수표",
     {
      "preset": "scores",
      "a": 0.45,
      "b": 0.89,
      "c": -0.89,
      "d": 0.45
     }
    ],
    [
     "한 직선으로 납작하게",
     {
      "preset": "flat",
      "a": 1,
      "b": 0.5,
      "c": 2,
      "d": 1
     }
    ]
   ],
   "첫째 열 (a, c)가 e₁, 둘째 열 (b, d)가 e₂의 도착지이고 격자 전체가 두 화살표를 따라옵니다. 납작 예시는 두 열이 같은 방향이라 평면이 한 직선으로 모입니다. ‘변환 재생’으로 중간 과정을 볼 수 있습니다."
  ]
 },
 "compose": {
  "title": "순서 바꿔 보기",
  "desc": "첫째 변환과 둘째 변환을 고르면 왼쪽 그림은 그 순서대로, 오른쪽 그림은 반대 순서로 적용합니다. 회색 점선은 원래 깃발, 청록 점선은 첫 단계 뒤, 파란 면은 최종 결과입니다.",
  "html": "<div class=\"lab-columns wide\"><div class=\"controls\"><label>첫째 변환 <select name=\"first\" id=\"c-first\"><option value=\"rot90\" selected>90° 회전</option><option value=\"wide\">가로 2배</option><option value=\"shear\">오른쪽으로 밀기</option><option value=\"mirror\">가로축 뒤집기</option></select></label>\n<label>둘째 변환 <select name=\"second\" id=\"c-second\"><option value=\"rot90\">90° 회전</option><option value=\"wide\" selected>가로 2배</option><option value=\"shear\">오른쪽으로 밀기</option><option value=\"mirror\">가로축 뒤집기</option></select></label></div><div class=\"stage two-planes\">\n<figure><svg role=\"img\" aria-labelledby=\"lab-c1\"><title id=\"lab-c1\">고른 순서대로 적용한 결과</title></svg><figcaption>고른 순서</figcaption></figure>\n<figure><svg role=\"img\" aria-labelledby=\"lab-c2\"><title id=\"lab-c2\">반대 순서로 적용한 결과</title></svg><figcaption>반대 순서</figcaption></figure>\n</div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>90° 회전 다음 가로 2배 = [0, −2 ; 1, 0], 가로 2배 다음 90° 회전 = [0, −1 ; 2, 0]. 순서를 바꾸면 결과가 달라집니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> 변환: 90° 회전 [0, −1 ; 1, 0], 가로 2배 [2, 0 ; 0, 1], 오른쪽으로 밀기 [1, 1 ; 0, 1], 가로축 뒤집기 [1, 0 ; 0, −1]. 같은 변환을 두 번 고를 수도 있습니다. 결과 판정은 네 칸이 모두 10⁻⁹ 이내로 같은지로 합니다.</p>",
  "task": "첫째를 ‘오른쪽으로 밀기’, 둘째를 ‘가로축 뒤집기’로 골라 보세요. 한쪽 깃발은 오른쪽 아래로, 다른 쪽은 왼쪽 아래로 기울어집니다. 같은 두 동작이 정반대 기울기를 만드는 장면입니다.",
  "guide": [
   "같은 두 변환을 서로 다른 순서로 적용해 깃발이 어디로 가는지 나란히 비교합니다.",
   [
    [
     "회전 다음 가로 2배",
     {
      "first": "rot90",
      "second": "wide"
     }
    ],
    [
     "밀기 다음 뒤집기",
     {
      "first": "shear",
      "second": "mirror"
     }
    ],
    [
     "같은 변환 두 번",
     {
      "first": "rot90",
      "second": "rot90"
     }
    ]
   ],
   "식으로 쓰면 나중에 하는 변환이 왼쪽에 옵니다(B·A). 대부분의 짝은 순서를 바꾸면 결과가 달라지고, 같은 변환을 두 번 고르면 두 그림이 같아지는 것이 정상입니다."
  ]
 },
 "determinant": {
  "title": "둘째 열을 돌려 넓이 재기",
  "desc": "θ를 바꾸면 청록 화살표(둘째 열)가 돌고, 파란 면(옮겨진 단위 정사각형)의 넓이가 바뀝니다. 앞뒤가 뒤집히면 붉은 점선 면으로 표시합니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><div class=\"field\"><label for=\"det-theta\">둘째 열 방향 θ</label><input type=\"range\" id=\"det-theta\" name=\"theta\" min=\"0\" max=\"180\" step=\"5\" value=\"120\" data-digits=\"0\" data-unit=\"°\"><output for=\"det-theta\">120°</output></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-det-svg\"><title id=\"lab-det-svg\">두 열 화살표가 만드는 평행사변형과 옮겨진 노래 점. 수치는 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>θ = 120°이면 det M = 3.07로, 넓이 1이 3.07이 되고 방향은 그대로입니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> M = [1.5, 1.5cos θ ; 1.5, 1.5sin θ]. θ는 0~180°, 5° 간격. |det M| &lt; 0.05이면 ‘납작해짐’으로 표시합니다. 노래 점은 M·s 위치에 그립니다.</p>",
  "task": "θ를 50°, 45°, 40°로 차례로 바꿔 보세요. 면이 얇아지다 선이 되고, 다시 뒤집혀 펼쳐지는 장면에서 행렬식의 부호가 왜 필요한지 보입니다.",
  "guide": [
   "첫째 열은 (1.5, 1.5)로 고정하고 둘째 열의 방향만 돌리며, 단위 정사각형의 넓이가 몇 배가 되는지 봅니다.",
   [
    [
     "직각 135°",
     {
      "theta": 135
     }
    ],
    [
     "같은 방향 45°",
     {
      "theta": 45
     }
    ],
    [
     "뒤집힘 0°",
     {
      "theta": 0
     }
    ]
   ],
   "이 실험에서 det M = 2.25·(sin θ − cos θ)입니다. 두 열이 직각인 135°에서 가장 크고, 같은 방향인 45°에서 0이 되어 평면이 납작해지며, 45°보다 작으면 음수가 되어 앞뒤가 뒤집힙니다."
  ]
 },
 "solve": {
  "title": "기록에서 노래 되찾기",
  "desc": "기록된 점수 b₁, b₂와 규칙의 d를 바꿔 보세요. 붉은 점선은 식 ①, 보라 실선은 식 ②의 직선입니다. 보라 점이 되찾은 노래입니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><div class=\"field\"><label for=\"s-b1\">기록 b₁</label><input type=\"range\" id=\"s-b1\" name=\"b1\" min=\"-6\" max=\"6\" step=\"0.25\" value=\"5.5\" data-digits=\"2\"><output for=\"s-b1\">5.50</output></div>\n<div class=\"field\"><label for=\"s-b2\">기록 b₂</label><input type=\"range\" id=\"s-b2\" name=\"b2\" min=\"-6\" max=\"6\" step=\"0.25\" value=\"4.25\" data-digits=\"2\"><output for=\"s-b2\">4.25</output></div>\n<div class=\"field\"><label for=\"s-d\">규칙의 d</label><input type=\"range\" id=\"s-d\" name=\"d\" min=\"0\" max=\"2\" step=\"0.05\" value=\"1.5\" data-digits=\"2\"><output for=\"s-d\">1.50</output></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-solve-svg\"><title id=\"lab-solve-svg\">두 식의 직선과 교점. 수치는 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>d = 1.5, b = (5.5, 4.25)이면 det M = 2이고 x = (2, 1.5), 아침 달리기입니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> M = [2, 1 ; 1, d]. b₁, b₂는 −6~6(0.25 간격), d는 0~2(0.05 간격). |det M| &lt; 0.02이면 하나의 답을 정할 수 없다고 판단해 해를 표시하지 않습니다. 되찾은 노래가 그림 범위(−4~4) 밖이면 점은 보이지 않고 숫자만 나옵니다.</p>",
  "task": "d를 1.5와 0.6에 각각 두고 b₂를 4.25 ↔ 4.5로 바꿔 보세요. 같은 0.25의 기록 오차가 답을 얼마나 움직이는지 비교하면, ‘풀 수 있다’와 ‘믿을 수 있다’가 다른 말이라는 것이 보입니다.",
  "guide": [
   "기록된 점수 b와 규칙 M = [2, 1 ; 1, d]에서 원래 노래 x를 되찾습니다. 두 직선의 교점이 답입니다.",
   [
    [
     "아침 달리기 기록",
     {
      "b1": 5.5,
      "b2": 4.25,
      "d": 1.5
     }
    ],
    [
     "불안정한 규칙 d = 0.6",
     {
      "b1": 5.5,
      "b2": 4.25,
      "d": 0.6
     }
    ],
    [
     "평행한 두 직선 d = 0.5",
     {
      "b1": 5.5,
      "b2": 4.25,
      "d": 0.5
     }
    ]
   ],
   "d = 1.5이면 x = (2, 1.5), 아침 달리기입니다. d = 0.6이면 det M = 0.2로 답은 있지만 b₂를 한 칸만 움직여도 크게 이동합니다. d = 0.5이면 det M = 0이라 하나의 답을 정할 수 없습니다."
  ]
 },
 "eigen": {
  "title": "시험 화살표 돌리기",
  "desc": "파란 화살표 v(길이 1)의 방향 φ를 바꾸면 청록 화살표 Mv가 따라 움직입니다. 둘이 한 직선 위에 놓이는 φ를 찾으세요. ‘한 바퀴 돌리기’는 φ를 360° 자동으로 돌립니다.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><label>행렬 고르기 <select name=\"preset\" id=\"e-preset\"><option value=\"sym\" selected>대칭으로 섞기 [2, 1 ; 1, 2]</option><option value=\"stretch\">가로 2배, 세로 절반</option><option value=\"shear\">오른쪽으로 밀기</option><option value=\"rotate\">45° 회전</option></select></label>\n<div class=\"field\"><label for=\"e-phi\">v의 방향 φ</label><input type=\"range\" id=\"e-phi\" name=\"phi\" min=\"0\" max=\"359\" step=\"1\" value=\"0\" data-digits=\"0\" data-unit=\"°\"><output for=\"e-phi\">0°</output></div>\n<label><input type=\"checkbox\" name=\"show\" id=\"e-show\"> 계산한 고유벡터 방향 보기(보라 선)</label>\n<div class=\"buttons\"><button type=\"button\" data-play>한 바퀴 돌리기</button></div></div><div class=\"stage\"><svg role=\"img\" aria-labelledby=\"lab-eigen-svg\"><title id=\"lab-eigen-svg\">시험 화살표 v와 변환된 Mv, 단위원과 그 상인 타원. 판정은 옆의 결과 문장에 있습니다.</title></svg></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>φ = 0°이면 Mv = (2, 1)로 v에서 27° 돌아가므로 고유벡터가 아닙니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> v = (cos φ, sin φ). v와 Mv의 각도 차이가 2° 이내이거나 180°에서 2° 이내이면 ‘방향 그대로’로 판정하고, 고윳값은 v·Mv로 추정합니다. 점선 원은 모든 v, 청록 점선은 모든 Mv가 지나는 곳입니다. 보라 선은 특성방정식으로 계산한 실제 고유벡터 방향입니다.</p>",
  "task": "‘오른쪽으로 밀기’를 고르고 ‘한 바퀴 돌리기’를 눌러 보세요. 방향이 맞는 순간이 0°와 180°에서만 잠깐 나타납니다. 고유 방향이 두 개가 아닐 수도 있다는 점을 직접 보게 됩니다.",
  "guide": [
   "길이 1인 화살표 v를 돌리며, 행렬을 적용한 Mv가 v와 같은 직선 위에 놓이는 방향을 찾습니다.",
   [
    [
     "대칭 행렬 φ = 45°",
     {
      "preset": "sym",
      "phi": 45
     }
    ],
    [
     "대칭 행렬 φ = 135°",
     {
      "preset": "sym",
      "phi": 135
     }
    ],
    [
     "45° 회전",
     {
      "preset": "rotate",
      "phi": 0
     }
    ]
   ],
   "대칭 행렬 [2, 1 ; 1, 2]는 45°에서 고윳값 3, 135°에서 고윳값 1인 고유벡터를 가집니다. 45° 회전은 모든 방향을 돌리므로 어느 φ에서도 ‘방향 그대로’가 나오지 않습니다."
  ]
 },
 "pca": {
  "title": "가장 많이 퍼지는 방향 찾기",
  "desc": "방향 θ를 바꾸면 붉은 점선이 평균을 지나며 돌고, 노래들의 그림자(붉은 작은 점)가 그 위에 맺힙니다. 아래 곡선은 θ마다의 분산입니다. 곡선의 꼭대기를 찾아보세요.",
  "html": "<div class=\"lab-columns\"><div class=\"controls\"><div class=\"field\"><label for=\"p-theta\">방향 θ</label><input type=\"range\" id=\"p-theta\" name=\"theta\" min=\"0\" max=\"179\" step=\"1\" value=\"0\" data-digits=\"0\" data-unit=\"°\"><output for=\"p-theta\">0°</output></div>\n<label><input type=\"checkbox\" name=\"show\" id=\"p-show\"> 공분산 행렬의 첫째 고유벡터 보기(보라 선)</label>\n<div class=\"buttons\"><button type=\"button\" data-snap>가장 긴 방향으로 맞추기</button></div></div><div class=\"stage\">\n<svg role=\"img\" aria-labelledby=\"lab-pca-svg\"><title id=\"lab-pca-svg\">노래 점과 평균을 지나는 시험 방향 선, 그 위의 그림자. 수치는 옆의 결과 문장에 있습니다.</title></svg>\n<svg class=\"var-chart\" viewBox=\"0 0 360 122\" role=\"img\" aria-labelledby=\"lab-pca-chart\"><title id=\"lab-pca-chart\">방향 θ에 따른 투영 분산 곡선. 약 42°에서 가장 높고 약 132°에서 가장 낮습니다.</title></svg>\n</div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>θ = 0°에서 분산은 4.34로 전체 7.96의 55%입니다. 가장 큰 값은 θ ≈ 42°에서 94%입니다.</p></div><p class=\"caption lab-note\"><b>계산 조건</b> 입력: θ = 0~179°. 계산: 평균을 뺀 노래 dᵢ의 투영 점수 dᵢ·u의 분산 = uᵀCu (C는 n = 8로 나눈 공분산 행렬). 출력은 특징 점수의 제곱 단위입니다. ‘가장 긴 방향’은 C의 고유벡터로 계산한 각도를 정수로 반올림합니다.</p>",
  "task": "θ를 0°에서 179°까지 천천히 밀며 아래 곡선 위의 점을 따라가 보세요. 꼭대기와 바닥이 정확히 90° 떨어져 있는 것을 확인하면, 8장의 ‘대칭행렬의 고유벡터는 직각’이 데이터에서 어떻게 나타나는지 보입니다.",
  "guide": [
   "평균을 지나는 방향 θ로 노래들을 투영하고, 그 점수가 얼마나 퍼지는지(분산) 잽니다.",
   [
    [
     "빠르기 축 0°",
     {
      "theta": 0
     }
    ],
    [
     "가장 긴 방향 42°",
     {
      "theta": 42
     }
    ],
    [
     "가장 짧은 방향 132°",
     {
      "theta": 132
     }
    ]
   ],
   "0°에서는 전체 분산의 55%, 42°에서는 94%, 132°에서는 6%만 설명합니다. 아래 곡선의 꼭대기와 보라 선(공분산 행렬의 첫째 고유벡터)이 같은 방향을 가리킵니다."
  ]
 },
 "layer": {
  "title": "노래를 은닉 공간으로 보내기",
  "desc": "왼쪽은 원래 노래 공간입니다. 붉은 점선은 h₁ = 0, 보라 선은 h₂ = 0이 되는 경계선입니다. 오른쪽은 한 층을 지난 뒤의 공간(h₁, h₂)입니다. 편향을 옮기고 ReLU를 켜고 끄며 비교하세요.",
  "html": "<div class=\"lab-columns wide\"><div class=\"controls\"><div class=\"field\"><label for=\"l-b1\">편향 b₁ (취향 문턱)</label><input type=\"range\" id=\"l-b1\" name=\"b1\" min=\"-3\" max=\"3\" step=\"0.25\" value=\"0\" data-digits=\"2\"><output for=\"l-b1\">0.00</output></div>\n<div class=\"field\"><label for=\"l-b2\">편향 b₂</label><input type=\"range\" id=\"l-b2\" name=\"b2\" min=\"-3\" max=\"3\" step=\"0.25\" value=\"0\" data-digits=\"2\"><output for=\"l-b2\">0.00</output></div>\n<label><input type=\"checkbox\" name=\"relu\" id=\"l-relu\" checked> ReLU 켜기</label></div><div class=\"stage two-planes\">\n<figure><svg role=\"img\" aria-labelledby=\"lab-l1\"><title id=\"lab-l1\">원래 노래 공간과 두 경계선</title></svg><figcaption>입력 공간 (빠르기, 에너지)</figcaption></figure>\n<figure><svg role=\"img\" aria-labelledby=\"lab-l2\"><title id=\"lab-l2\">한 층을 지난 은닉 공간의 노래 점</title></svg><figcaption>은닉 공간 (h₁, h₂)</figcaption></figure>\n</div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>b = (0, 0), ReLU를 켜면 h₁이 0인 노래는 4곡입니다.</p></div><div class=\"ranking table-scroll\"></div><p class=\"caption lab-note\"><b>계산 조건</b> W = [0.45, 0.89 ; 0.89, −0.45](고정), b₁·b₂는 −3~3. 표는 h₁이 큰 순서입니다. 이 W와 b는 학습한 값이 아니라 설명을 위해 직접 정한 값입니다. 실제 신경망은 데이터로부터 W와 b를 학습합니다.</p>",
  "task": "b₁을 −2로 둔 채 ReLU를 켰다 껐다 해 보세요. 꺼져 있을 때는 오른쪽 그림이 왼쪽을 돌려 놓은 것이고, 켜면 대부분의 노래가 축 위로 접힙니다. 신경망에서 ‘비선형’이 무엇을 뜻하는지 한 장면으로 보입니다.",
  "guide": [
   "h = ReLU(W·x + b)를 계산해 노래를 은닉 공간으로 보냅니다. 편향은 경계선을 옮기고 ReLU는 경계 아래를 0으로 접습니다.",
   [
    [
     "편향 0",
     {
      "b1": 0,
      "b2": 0,
      "relu": true
     }
    ],
    [
     "취향 문턱 높이기",
     {
      "b1": -2,
      "b2": 0,
      "relu": true
     }
    ],
    [
     "ReLU 끄기",
     {
      "b1": 0,
      "b2": 0,
      "relu": false
     }
    ]
   ],
   "편향 0에서는 네 곡의 h₁이 0이 됩니다. b₁ = −2이면 h₁이 남는 곡은 여름 축제(1.58), 옥상 록 공연(1.34), 아침 달리기(0.23)뿐입니다. ReLU를 끄면 접힘 없이 돌리고 미는 직선 변환만 남습니다."
  ]
 },
 "challenge": {
  "title": "세 칸짜리 취향으로 추천하기",
  "desc": "세 값을 바꿔 새 취향을 만들면 표가 3차원 코사인 순으로 다시 정렬됩니다. 같은 노래의 2차원 순위와 3차원 내적도 함께 비교하세요.",
  "html": "<div class=\"lab-columns wide\"><div class=\"controls\"><div class=\"field\"><label for=\"ch-u1\">빠르기 선호</label><input type=\"range\" id=\"ch-u1\" name=\"u1\" min=\"-3\" max=\"3\" step=\"0.5\" value=\"1\"><output for=\"ch-u1\">1.0</output></div>\n<div class=\"field\"><label for=\"ch-u2\">에너지 선호</label><input type=\"range\" id=\"ch-u2\" name=\"u2\" min=\"-3\" max=\"3\" step=\"0.5\" value=\"2\"><output for=\"ch-u2\">2.0</output></div>\n<div class=\"field\"><label for=\"ch-u3\">가사 선호</label><input type=\"range\" id=\"ch-u3\" name=\"u3\" min=\"-3\" max=\"3\" step=\"0.5\" value=\"-2\"><output for=\"ch-u3\">−2.0</output></div></div></div><div class=\"readout\" role=\"status\" aria-live=\"polite\"><p>민의 취향 (1, 2, −2)의 1위는 아침 달리기(3D 코사인 0.94)이고, 2D 기준에서는 옥상 록 공연이 1위입니다.</p></div><div class=\"ranking table-scroll\"></div><p class=\"caption lab-note\"><b>계산 조건</b> 코사인 = u·s ÷ (|u||s|), 세 칸 모두 −3~3, 0.5 간격. ‘2D 코사인 순위’는 셋째 칸을 지운 (빠르기, 에너지)만으로 계산한 순위입니다. 취향의 세 값이 모두 0이면 방향이 없어 계산하지 않습니다.</p>",
  "task": "가사 선호를 −2에서 2까지 0.5씩 올리며 1위가 아침 달리기에서 옥상 록 공연으로 바뀌는 지점을 찾아보세요. 그 경계값 근처의 사용자에게는 추천을 단정하기보다 두 곡을 함께 보여 주는 편이 낫다는 판단도 이 책의 결과입니다.",
  "guide": [
   "세 칸짜리 취향으로 여덟 곡을 3차원 코사인 순으로 줄 세우고, 가사를 무시한 2차원 순위와 비교합니다.",
   [
    [
     "민의 취향 (1, 2, −2)",
     {
      "u1": 1,
      "u2": 2,
      "u3": -2
     }
    ],
    [
     "가사는 상관없음",
     {
      "u1": 1,
      "u2": 2,
      "u3": 0
     }
    ],
    [
     "가사 있는 곡 선호",
     {
      "u1": 1,
      "u2": 2,
      "u3": 2
     }
    ]
   ],
   "민에게는 아침 달리기(0.94)가 1위이고 옥상 록 공연은 0.30으로 4위입니다. 가사 선호를 0으로 두어도 록 공연은 0.86으로 여름 축제(0.89)에 밀립니다. 0을 넣는 것과 그 칸을 빼는 것은 다릅니다."
  ]
 },
 "songs-map": {
  "title": "노래 여덟 곡과 나",
  "desc": "",
  "html": "<svg role=\"img\" aria-labelledby=\"map-title map-desc\"><title id=\"map-title\">노래 여덟 곡의 특징 지도</title><desc id=\"map-desc\">가로축은 빠르기, 세로축은 에너지입니다. 오른쪽 위에는 여름 축제, 옥상 록 공연, 아침 달리기가, 왼쪽 아래에는 자장가, 비 오는 창가, 새벽 산책이 있습니다. 골목 재즈와 출근 지하철은 가운데 가까이 있습니다. 붉은 화살표 ‘나’는 (1, 2)를 가리킵니다.</desc></svg>"
 }
};
