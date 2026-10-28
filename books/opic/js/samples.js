/* 이 책이 지어낸 자료: 민서(지어낸 인물)의 녹음 대본, 공원 질문 표본 넷, 설문 항목 목록, 문장 은행, 준비한 이야기와 질문.
   실제 오픽 기출이나 설문 원문을 옮긴 것이 아니다. 숫자를 바꾸면 js/lab-guides.js의 결과 읽기, review.json, docs/index.html #chapters,
   tests/opic.test.cjs를 같은 커밋에서 다시 계산한다. */
(function(root){
'use strict';
/* 2장: 같은 질문 "Tell me about a park you like to go to."에 대한 표본 넷. */
const PARK=[
 {id:'p1',name:'표본 1 · 낱말을 늘어놓은 답',text:'Park. Han River park. Bike. Chicken. Good.'},
 {id:'p2',name:'표본 2 · 짧은 문장을 늘어놓은 답',text:'I like Han River Park. It is big. I ride a bike there. I eat chicken with friends. It is fun.'},
 {id:'p3',name:'표본 3 · 연결어로 이은 답',text:'I like Han River Park because it is close to my house. I usually go there on Sunday evenings. I ride a bike along the river and then I sit on the grass. Sometimes I eat fried chicken with my friends there. It is the best place to relax.'},
 {id:'p4',name:'표본 4 · 시간틀을 바꾸며 이은 답',text:'My favorite park is Han River Park because it is only ten minutes from my house. I usually go there on Sunday evenings to ride my bike. Last month, though, something funny happened. I was riding along the river when a man asked me to take a photo of his family, so I stopped and took about twenty pictures. After that, his kids gave me a can of cold coffee. These days I always bring my phone with a full battery, just in case. Next weekend I am going to go there again with my sister.'}
];
/* 3장: 설문 4~7부를 본뜬 항목. story는 같은 이야기로 답할 수 있는 묶음이다. */
const SURVEY=[
 {id:'movie',section:'leisure',name:'영화 보기',story:'관람'},{id:'show',section:'leisure',name:'공연 보기',story:'관람'},{id:'concert',section:'leisure',name:'콘서트 보기',story:'관람'},
 {id:'park',section:'leisure',name:'공원 가기',story:'공원'},{id:'cafe',section:'leisure',name:'카페 가기',story:'카페'},{id:'beach',section:'leisure',name:'해변 가기',story:'여행'},
 {id:'camp',section:'leisure',name:'캠핑하기',story:'캠핑'},{id:'shop',section:'leisure',name:'쇼핑하기',story:'쇼핑'},
 {id:'music',section:'hobby',name:'음악 감상',story:'관람'},{id:'cook',section:'hobby',name:'요리하기',story:'집'},{id:'read',section:'hobby',name:'책 읽기',story:'카페'},{id:'photo',section:'hobby',name:'사진 찍기',story:'사진'},
 {id:'walk',section:'sport',name:'걷기',story:'공원'},{id:'jog',section:'sport',name:'조깅',story:'공원'},{id:'bike',section:'sport',name:'자전거',story:'공원'},{id:'swim',section:'sport',name:'수영',story:'운동 시설'},{id:'gym',section:'sport',name:'헬스',story:'운동 시설'},
 {id:'domestic',section:'travel',name:'국내 여행',story:'여행'},{id:'abroad',section:'travel',name:'해외 여행',story:'여행'},{id:'staycation',section:'travel',name:'집에서 보내는 휴가',story:'집'},{id:'trip',section:'travel',name:'출장',story:'여행'}
];
const SECTION_NAMES={leisure:'여가 활동',hobby:'취미',sport:'운동',travel:'휴가·여행'};
const SURVEY_PRESETS={
 tight:['movie','show','concert','park','cafe','music','read','walk','jog','bike','domestic','abroad'],
 scattered:['movie','park','camp','shop','cafe','cook','photo','music','swim','jog','abroad','staycation'],
 short:['movie','park','music','walk','domestic','cafe','concert','show','jog','bike','abroad']
};
/* 4장: 민서의 집 묘사 문장 은행. 칸마다 고를 수 있는 문장(빈 문자열은 그 덩어리를 빼는 선택). */
const BANK={
 open:[['','(도입 없이 시작)'],['I live in a small apartment in Mapo, near Hapjeong Station.','작은 아파트, 위치'],['My home is an apartment.','아파트라는 사실만']],
 detail:[['','(세부 없음)'],['When you open the door, you see a narrow hallway, and the kitchen is on the left.','들어서면 보이는 순서'],['My favorite place is my room because it gets a lot of sunlight in the morning.','좋아하는 곳과 이유'],['There is a wooden desk by the window, so I usually read there on weekends.','창가 책상과 하는 일'],['It has two rooms. There is a kitchen. There is a bathroom.','방·부엌·욕실 나열']],
 example:[['','(예 없음)'],['For example, last Saturday I spent three hours at that desk with a novel and a cup of coffee.','지난 토요일 이야기'],['I like it.','좋다는 말']],
 close:[['','(마무리 없음)'],['Overall, it is small, but it really feels like my place.','작지만 내 공간'],["That's all.",'끝났다는 말']]
};
/* 4장 비교 예제의 고른 번호: [도입, 세부1, 세부2, 예, 마무리]. */
const BANK_PRESETS={start:[2,4,0,0,2],full:[1,1,3,1,1],noexample:[1,1,3,0,1]};
/* 5장: 민서의 주말 아침 일과. */
const ROUTINE=[
 ['wake','wake up around nine'],['coffee','make a cup of coffee'],['walk','take a walk along the river'],['brunch','have brunch with my roommate'],['clean','clean my room'],['call','call my parents']
];
/* 6장: 제주 여행 이야기의 다섯 조각. [역할, 현재형, 과거형]. */
const STORY=[
 ['배경','Last spring I go to Jeju with two friends because we finish a big project.','Last spring I went to Jeju with two friends because we had just finished a big project.'],
 ['사건','We rent a small car and drive along the coast road.','We rented a small car and drove along the coast road.'],
 ['문제','At the beach the wind is so strong that we cannot swim.','At the beach the wind was so strong that we couldn\'t swim.'],
 ['해결','Instead, we sit in a cafe and watch the waves for two hours.','Instead, we sat in a cafe and watched the waves for two hours.'],
 ['느낌','Actually, that is the best part of the trip.','Actually, that was the best part of the trip.']
];
/* 7장: 비교 문장 틀. 축마다 [과거, 현재, 미래]. */
const COMPARE={
 phone:{name:'휴대폰',axes:{
  look:['When I was in high school, I used a folder phone.','These days I use a smartphone with a big screen.','In the future, I will probably use a foldable one again.'],
  use:['Back then I only made calls and sent text messages.','Now I pay for coffee, check the bus time, and watch videos on it.','More services will move to apps, so I will use it even more.'],
  problem:['My old phone never kept me awake at night.','However, I spend too much time on it, so I sometimes don\'t sleep well.','I am going to set a time limit for myself next year.']}},
 town:{name:'동네',axes:{
  look:['Ten years ago my neighborhood had many small houses.','Now there are tall apartment buildings everywhere.','A new subway station will open next year.'],
  use:['People used to shop at the traditional market.','These days most people order groceries online.','I think the market is going to become a food street.'],
  problem:['It was quiet, but there were not many places to go.','However, the streets are crowded and rent is high.','I hope the city will build more parks.']}}
};
const AXIS_NAMES={look:'생김새',use:'하는 일',problem:'불편한 점'};
/* 8장: 롤플레이 대사 후보. */
const ROLEPLAY={
 ask:{name:'헬스장에 전화해 회원권 묻기',lines:['Hi, I\'m calling about a membership.','How much is a three-month membership?','What time do you open in the morning?','Is there a shower room I can use?','Could you tell me if you have yoga classes?','Where can I park my car?','I want to know the price.','Thank you, that\'s really helpful.']},
 solve:{name:'예약한 수업에 갈 수 없을 때 대안 내기',lines:['Hi, I booked a personal training session for tomorrow at seven.','I\'m sorry, but I have to work late tomorrow.','Instead, could I come on Thursday at the same time?','How about moving it to next week?','Or else, would it be possible to get a refund?','I want to cancel.','Thank you for understanding.']}
};
const ROLEPLAY_PRESETS={ask_plain:['ask',[0,6,7]],ask_three:['ask',[0,1,2,3,7]],solve_one:['solve',[0,1,6]],solve_two:['solve',[0,1,2,3,6]]};
/* 9장: 민서가 준비한 이야기와 시험에서 나올 수 있는 질문. use는 place(장소 묘사)·routine(습관)·past(경험)·compare(비교). */
const STORIES=[
 {id:'park',name:'한강 공원 이야기',topics:['park'],uses:['place','routine','past']},
 {id:'home',name:'마포 집 이야기',topics:['home'],uses:['place','routine','compare']},
 {id:'jeju',name:'제주 여행 이야기',topics:['travel'],uses:['place','past']},
 {id:'concert',name:'첫 콘서트 이야기',topics:['concert'],uses:['past']},
 {id:'phone',name:'휴대폰 변화 이야기',topics:['technology'],uses:['compare']}
];
const QUESTIONS=[
 {id:'q1',text:'Describe the park you often go to.',topic:'park',use:'place',kind:'설문'},
 {id:'q2',text:'What do you usually do when you go to the park?',topic:'park',use:'routine',kind:'설문'},
 {id:'q3',text:'Tell me about a memorable day at the park.',topic:'park',use:'past',kind:'설문'},
 {id:'q4',text:'Describe your home.',topic:'home',use:'place',kind:'설문'},
 {id:'q5',text:'How is your home different from the home you lived in as a child?',topic:'home',use:'compare',kind:'설문'},
 {id:'q6',text:'Describe a bank you often visit.',topic:'bank',use:'place',kind:'돌발'},
 {id:'q7',text:'How has the technology you use changed over the years?',topic:'technology',use:'compare',kind:'돌발'},
 {id:'q8',text:'Tell me about a holiday you remember well.',topic:'holiday',use:'past',kind:'돌발'}
];
const REUSE_PRESETS={park_only:['park'],three:['park','home','jeju'],all:['park','home','jeju','concert','phone']};
/* 10·11장: 민서가 첫 주에 녹음한 답 넷과 책을 마친 뒤 다시 녹음한 답 넷. seconds는 녹음 길이(초), target은 질문 유형. */
const ANSWERS=[
 {id:'home',q:'Describe your home.',target:'describe',before:{seconds:45,text:'I live in apartment. It is in Mapo. My apartment is small. It has two rooms. There is kitchen. I like my room. My room has bed and desk. It is comfortable. That\'s all.'},
  after:{seconds:110,text:'I live in a small apartment in Mapo, near Hapjeong Station. When you open the door, you see a narrow hallway, and the kitchen is on the left. My favorite place is my room because it gets a lot of sunlight in the morning. There is a wooden desk by the window, so I usually read there on weekends. For example, last Saturday I spent three hours there with a novel and a cup of coffee. The only problem is the noise from the street, but I am used to it now. Overall, it is small, but it really feels like my place.'}},
 {id:'trip',q:'Tell me about a memorable trip.',target:'past',before:{seconds:80,text:'Last year I go to Jeju with my friends because we finish a big project. We rent a car and then we drive along the coast. We eat black pork, so I am very full. After that we go to the beach. The weather is good. It was a really fun trip and I want to go again.'},
  after:{seconds:115,text:'Last spring I went to Jeju with two friends because we had just finished a big project at work. We rented a small car and then drove along the coast road. On the second day we ate black pork for lunch, so we were really full all afternoon. After that we went to Hyeopjae Beach, but the wind was so strong that we couldn\'t swim. Instead, we sat in a cafe and watched the waves for two hours. Actually, that was the best part of the trip. Next year I am going to go again in summer.'}},
 {id:'phone',q:'How has the way people use phones changed?',target:'compare',before:{seconds:90,text:'These days people use smartphones for everything. They watch videos, pay money and talk with friends. Smartphones are very fast and the camera is good. Also many apps are free. But people use phones too much, so they don\'t sleep well. I think smartphones are very useful but we need to be careful.'},
  after:{seconds:115,text:'When I was in high school, I used a folder phone, and I only made calls and sent text messages. These days I use my smartphone for almost everything. For example, I pay for coffee, check the bus time, and watch videos on the subway. Compared to my old phone, it is much faster and the camera is a lot better. However, I think I spend too much time on it, so I sometimes don\'t sleep well. In the future, I will probably use it even more, because more services are moving to apps.'}},
 {id:'gym',q:'Call a gym and ask three or four questions about joining.',target:'roleplay',before:{seconds:70,text:'Hello, I want to join your gym because I moved near here. I am an office worker, so I can go after work. First, I want to know the price. Also I want to know the open time. And then I want to know about the shower room. Please tell me. Thank you.'},
  after:{seconds:95,text:'Hi, I\'m calling because I\'d like to join your gym. I just moved to this area, so I have a few questions. First, how much is a three-month membership? Also, what time do you open in the morning? I usually work out before work, so that\'s important to me. And is there a shower room I can use? Thank you. That\'s really helpful.'}}
];
const api={PARK,SURVEY,SECTION_NAMES,SURVEY_PRESETS,BANK,BANK_PRESETS,ROUTINE,STORY,COMPARE,AXIS_NAMES,ROLEPLAY,ROLEPLAY_PRESETS,STORIES,QUESTIONS,REUSE_PRESETS,ANSWERS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OSamples=api;
})(typeof window!=='undefined'?window:globalThis);
