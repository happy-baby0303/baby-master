// ==========================================
// 🎈 TRACK 1: [놀이 처방전] 엄마 아빠 생존 놀이 가이드 DB (25종)
// ==========================================
const playData = [
    // 🏠 0원 집구석 놀이 (좀비모드 / 층간소음 제로 등)
    { 
        id: "p01", title: "무한 물티슈 뽑기 마술", category: "zero", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "다 쓴 물티슈 캡, 자투리 천/손수건", energyDrain: "🔥🔥 (소근육 훈련)", playTime: 15,
        desc: "새 물티슈 뽑아댈 때마다 속 터지셨죠? 이걸로 15분은 거뜬히 혼자 놉니다.",
        steps: [
            "1. 다 쓴 물티슈 통(캡형)을 버리지 말고 준비하세요.",
            "2. 안 쓰는 손수건이나 자투리 천 5~6장을 끝과 끝을 묶어 길게 이어줍니다.",
            "3. 물티슈 통 안에 천을 밀어 넣고 뚜껑을 닫은 뒤 아기에게 줍니다.",
            "4. 뚜껑을 열고 끝없이 나오는 천을 뽑으며 소근육과 성취감을 기릅니다."
        ],
        dadRole: "퇴근 후 다 쓴 물티슈 캡 수거 및 천 단단히 묶어주기"
    },
    { 
        id: "p02", title: "주방 지퍼백 바스락 마술쇼", category: "zero", targetAge: ['newborn', 'tummy', 'flip'], 
        targetItem: "주방 지퍼백(또는 투명 비닐봉지) 1장", energyDrain: "🔥 (시선집중)", playTime: 10,
        desc: "터미타임 할 때 고개 숙이려고 하면 눈앞에서 시선 강탈하기 최고입니다.",
        steps: [
            "1. 주방에서 깨끗한 지퍼백이나 투명 비닐을 가져옵니다.",
            "2. 입으로 바람을 빵빵하게 불어넣고 입구를 꽉 묶어 터지지 않게 합니다.",
            "3. 누워있는 아기 얼굴 위에서 바스락바스락 소리를 내며 시선을 끕니다.",
            "4. 아기 손에 쥐여주어 터질 듯 안 터지는 촉감을 느끼게 해주세요."
        ],
        dadRole: "비닐봉지 안 터지게 빵빵하게 불어서 묶어주기"
    },
    { 
        id: "p03", title: "[좀비모드] 등짝 스티커 떼기", category: "zero", targetAge: ['crawl', 'stand'], 
        targetItem: "포스트잇 또는 안 쓰는 스티커, 엄마의 등짝", energyDrain: "🔥🔥 (소근육/집중력)", playTime: 20,
        desc: "엄마 아파서 도저히 못 일어나는 날, 누워서 시간 떼우는 전설의 눕육아.",
        steps: [
            "1. 엄마는 바닥에 배를 깔고 엎드려 눕습니다. (좀비 모드 ON)",
            "2. 엄마의 등, 엉덩이, 다리에 포스트잇이나 스티커를 잔뜩 붙여놓습니다.",
            "3. 아기가 기어 와서 엄마 몸에 붙은 스티커를 하나하나 떼어내게 유도합니다.",
            "4. 스티커를 뗄 때마다 '앗 따가워!' 한마디만 해주면 20분은 누워서 쉴 수 있습니다."
        ],
        dadRole: "엄마 등에 스티커 잔뜩 붙여주고 출근하기"
    },
    { 
        id: "p04", title: "[층간소음 0%] 마스킹테이프 거미줄", category: "zero", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "마스킹 테이프 (또는 종이테이프)", energyDrain: "🔥🔥 (초집중)", playTime: 15,
        desc: "밤 9시, 텐션은 올랐는데 뛰게 할 수 없을 때 침묵 속에서 집중하게 만드는 놀이.",
        steps: [
            "1. 매트 바닥이나 거실 벽에 마스킹 테이프를 여러 갈래로 겹쳐서(거미줄처럼) 붙입니다.",
            "2. 테이프 끝부분을 살짝 접어두어 아기가 손가락으로 잡을 수 있게 해줍니다.",
            "3. 아기가 테이프를 쭉~ 뜯어내는 쾌감에 빠져 소리 없이 15분을 집중합니다.",
            "4. 테이프 안에 아기가 좋아하는 까까나 작은 장난감을 숨겨두면 효과 2배!"
        ],
        dadRole: "바닥에 예술적으로 테이프 거미줄 쳐주기"
    },
    { 
        id: "p05", title: "페트병 마라카스 콘서트", category: "zero", targetAge: ['tummy', 'flip', 'crawl'], 
        targetItem: "빈 500ml 페트병, 쌀알 또는 콩", energyDrain: "🔥🔥 (청각자극/팔운동)", playTime: 10,
        desc: "장난감 소리에 질렸을 때, 리얼한 곡물 소리로 호기심을 100% 자극합니다.",
        steps: [
            "1. 빈 생수 페트병을 바싹 말려 준비합니다.",
            "2. 안에 쌀알, 콩, 마카로니 등을 1/3 정도 채우고 뚜껑을 절대 안 열리게 꽉 닫습니다.",
            "3. 아기 앞에서 찰찰찰 흔들어 소리를 들려준 후 아기 손에 쥐여줍니다.",
            "4. 아기가 흔들 때마다 나오는 자연의 소리에 푹 빠집니다."
        ],
        dadRole: "페트병 뚜껑 테이프로 봉인해서 절대 안 열리게 막기"
    },
    { 
        id: "p06", title: "양말 산 무너뜨리기", category: "zero", targetAge: ['crawl', 'stand'], 
        targetItem: "돌돌 말아둔 양말 여러 켤레", energyDrain: "🔥🔥🔥 (스트레스 해소)", playTime: 10,
        desc: "빨래 개기 귀찮을 때 핑계 삼아 아기랑 놀아주는 일석이조 놀이.",
        steps: [
            "1. 세탁한 양말들을 동그랗게 말아 거실에 산처럼 높이 쌓아 올립니다.",
            "2. 아기가 기어 와서 양말 산을 팍! 무너뜨리게 둡니다.",
            "3. 무너진 양말을 아기에게 던지며(가벼워서 안전함) 눈싸움처럼 놉니다.",
            "4. 아기가 양말을 바구니에 골인시키는 놀이로 연장할 수 있습니다."
        ],
        dadRole: "퇴근 후 어질러진 양말 다시 예쁘게 개기"
    },
    { 
        id: "p07", title: "[수면유도] 천장 그림자 극장", category: "zero", targetAge: ['newborn', 'tummy', 'flip', 'crawl', 'stand'], 
        targetItem: "스마트폰 플래시", energyDrain: "🔥 (시각추적/진정)", playTime: 15,
        desc: "자기 싫어서 칭얼거리는 아기, 불 다 끄고 눕혀서 스르륵 잠들게 하는 필살기.",
        steps: [
            "1. 방의 불을 모두 끄고 아기를 눕힙니다.",
            "2. 핸드폰 플래시를 켜서 천장을 향해 비춥니다.",
            "3. 빛 앞에 손을 가져가 강아지, 새, 나비 등 그림자를 만들어 천장에 쏴줍니다.",
            "4. 차분한 자장가를 부르며 그림자를 천천히 움직이면 눈꺼풀이 무거워집니다."
        ],
        dadRole: "옆에서 나레이션 및 백색소음(쉬~~) 소리 내주기"
    },
    { 
        id: "p08", title: "[좀비모드] 인간 터널 통과하기", category: "zero", targetAge: ['crawl'], 
        targetItem: "엄마(또는 아빠)의 몸", energyDrain: "🔥🔥🔥 (전신 발달)", playTime: 15,
        desc: "배밀이나 기어가기 시작할 때, 나는 안 움직이고 애만 움직이게 하는 기적.",
        steps: [
            "1. 엄마는 바닥에 엎드려뻗쳐(플랭크) 자세나 요가의 '고양이 자세'를 취합니다.",
            "2. 아기가 엄마 배 밑으로 생긴 '인간 터널'을 통과하도록 반대편에 간식을 둡니다.",
            "3. 터널을 지나갈 때 배로 아기 등을 살짝 쓰다듬어 주면 꺄르르 넘어갑니다.",
            "4. 엎드려 있는 것조차 힘들면 다리만 ㅅ자로 세워서 다리 밑으로 지나가게 하세요."
        ],
        dadRole: "엄마 대신 무한 인간 터널 되어주기 (코어 운동)"
    },

    // 🏋️ 아빠 육체 노동 (체력 100% 방전)
    { 
        id: "p09", title: "인간 롤러코스터 (이불 그네)", category: "dad", targetAge: ['tummy', 'flip', 'crawl', 'stand'], 
        targetItem: "튼튼한 이불, 아빠의 강인한 코어", energyDrain: "🔥🔥🔥🔥🔥 (전신 100% 방전)", playTime: 10,
        desc: "아기 체력과 아빠 체력을 동시에 방전시키는 궁극의 육퇴 유도 놀이.",
        steps: [
            "1. 거실 바닥에 크고 도톰한 이불을 펼칩니다.",
            "2. 아기를 이불 한가운데에 눕히거나 앉힙니다. (목을 가눌 수 있어야 함)",
            "3. 엄마와 아빠가 양쪽에서 이불 모서리를 단단히 쥐고 번쩍 들어 올립니다.",
            "4. '출발~' 소리와 함께 앞뒤/좌우로 흔들어주며 방 안을 돌아다닙니다."
        ],
        dadRole: "메인 동력원 (팔/허리 근육 100% 사용 및 리얼한 기차 효과음 탑재)"
    },
    { 
        id: "p10", title: "빨래 바구니 썰매", category: "dad", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "플라스틱 빨래 바구니, 수건", energyDrain: "🔥🔥🔥🔥 (스피드광)", playTime: 15,
        desc: "층간소음 없이 집구석을 에버랜드로 만들어주는 아빠표 놀이기구.",
        steps: [
            "1. 다이소 플라스틱 빨래 바구니 안에 푹신한 수건이나 이불을 깝니다.",
            "2. 아기를 바구니 안에 안전하게 앉힙니다.",
            "3. 바구니 손잡이를 잡고 거실 바닥을 빙글빙글 돌거나 끌고 다닙니다.",
            "4. (주의) 매트 위보다는 맨바닥에서 끌어야 아빠의 허리가 무사합니다."
        ],
        dadRole: "루돌프 (전력 질주 및 코너링 기술 발휘)"
    },
    { 
        id: "p11", title: "거인 발 밟기 놀이", category: "dad", targetAge: ['stand'], 
        targetItem: "아빠의 발", energyDrain: "🔥🔥🔥 (걸음마/균형감각)", playTime: 15,
        desc: "걸음마를 떼기 시작한 아기들에게 아빠 발등은 최고의 에스컬레이터입니다.",
        steps: [
            "1. 아빠가 맨발로 서서 아기를 마주 봅니다.",
            "2. 아기를 아빠 발등 위에 서게 하고, 아기 양손을 단단히 잡아줍니다.",
            "3. '하나, 둘, 하나, 둘' 구령에 맞춰 아빠가 천천히 방을 걸어 다닙니다.",
            "4. 아기가 걸음마의 리듬감을 익히고 하체 힘을 기를 수 있습니다."
        ],
        dadRole: "아기 셔틀 (넘어지지 않게 손목 컨트롤 잘하기)"
    },
    { 
        id: "p12", title: "욕조 거품 폭탄 파티", category: "dad", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "아기용 바스, 욕조", energyDrain: "🔥🔥🔥🔥 (목욕 연계 방전)", playTime: 30,
        desc: "자기 전 에너지 방전의 화룡점정! 물놀이로 체온 높이고 뻗게 만드는 코스.",
        steps: [
            "1. 빈 욕조에 아기용 바스를 듬뿍 짜 넣고 샤워기로 강하게 물을 뿌려 거품을 산더미처럼 만듭니다.",
            "2. 아기를 입수시키고 거품으로 머리에 산타 모자, 수염 등을 만들어주며 놉니다.",
            "3. 페트병이나 컵을 줘서 물을 퍼고 쏟는 놀이를 무한 반복하게 합니다.",
            "4. 30분 뒤 꺼내서 옷 입히고 분유 먹이면 99% 기절합니다."
        ],
        dadRole: "거품 제조 장인, 목욕 후 아기 물기 닦고 로션 바르기 대기조"
    },

    // 🧸 장난감 뽕뽑기 (국민템 200% 활용법)
    { 
        id: "p13", title: "에듀테이블 3단 변신", category: "toy", targetAge: ['newborn', 'tummy', 'flip', 'crawl', 'stand'], 
        targetItem: "국민템 에듀테이블", energyDrain: "🔥🔥🔥 (성장 연계)", playTime: 30,
        desc: "창고에 박아두지 마세요! 시기별로 완벽하게 뽕 뽑는 변신 공식입니다.",
        steps: [
            "1. 🐣 [생후 4~5개월]: 다리를 완전히 빼버리고 본체만 아기 발밑에 두어 '발차기 피아노'로 쓰세요.",
            "2. 🔄 [생후 6~8개월]: 앉기 시작하면 다리를 꽂되, 각도를 '비스듬히' 세워 앉아서 버튼을 누르게 하세요.",
            "3. 🏃 [생후 10개월~]: 잡고 일어서면 다리를 직각으로 세우고 '걸음마 보조기'로 변신시킵니다!"
        ],
        dadRole: "아기 성장 시기에 맞춰 에듀테이블 다리 조립/해체 셔틀"
    },
    { 
        id: "p14", title: "타이니러브 모빌 그림자 극장", category: "toy", targetAge: ['newborn', 'tummy'], 
        targetItem: "타이니러브 모빌", energyDrain: "🔥 (수면유도)", playTime: 20,
        desc: "낮에만 트는 모빌? 불 끄고 틀어주면 수면 유도 꿀템으로 변신합니다.",
        steps: [
            "1. 밤에 방 불을 끄고 벽 쪽으로 모빌을 옮깁니다.",
            "2. 핸드폰 플래시를 모빌 아래에서 위로(인형을 향해) 비춥니다.",
            "3. 빙글빙글 돌아가는 인형들의 거대한 그림자가 방 벽과 천장에 영사됩니다.",
            "4. 오르골 백색소음을 켜두면 그림자를 멍하니 보다가 스르륵 잠듭니다."
        ],
        dadRole: "완벽한 그림자 각도를 위해 스마트폰 거치대 역할 하기"
    },
    { 
        id: "p15", title: "꼬꼬맘 추격전", category: "toy", targetAge: ['tummy', 'flip', 'crawl'], 
        targetItem: "블루래빗 꼬꼬맘", energyDrain: "🔥🔥🔥🔥 (배밀이/기어가기 유도)", playTime: 15,
        desc: "터미타임 지옥을 구원한 꼬꼬맘, 이제는 아기 체력 방전용 추격 템으로 씁니다.",
        steps: [
            "1. 배밀이나 기어가기를 시작할 무렵, 꼬꼬맘을 '이동 모드'로 켭니다.",
            "2. 매트 밖(맨바닥)에 꼬꼬맘을 풀어두면 노래를 부르며 요리조리 도망 다닙니다.",
            "3. 아기가 꼬꼬맘을 잡으려고 소리를 지르며 필사적으로 기어갑니다.",
            "4. 잡힐 듯 말 듯 아기 앞에서 방향을 틀어주며 에너지를 쏙 빼놓으세요."
        ],
        dadRole: "꼬꼬맘이 소파 밑으로 기어들어 가면 구출해오기"
    },
    { 
        id: "p16", title: "튤립 사운드북 클럽", category: "toy", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "튤립 사운드북", energyDrain: "🔥🔥 (리듬감/소근육)", playTime: 20,
        desc: "단순히 듣기만 하는 튤립? 아기 손에 쥐여주고 클럽을 오픈하세요.",
        steps: [
            "1. 아기가 좋아하는 튤립(노란색/빨간색 등)을 켜고 연속 재생 모드로 맞춥니다.",
            "2. 아기를 점퍼루나 쏘서, 또는 매트 위에 앉히고 방의 조명을 약간 어둡게 합니다.",
            "3. 튤립을 흔들 때마다 불빛이 번쩍거리는 걸 보여주며 춤을 유도합니다.",
            "4. 아기가 직접 튤립을 흔들고 리듬을 타면서 흥을 폭발시킵니다."
        ],
        dadRole: "화려한 춤사위로 아기 흥 돋구기"
    },

       // 🛌 엄마 방전 (누워서 떼우는 기적의 눕육아 타임)
    { 
        id: "p17", title: "[눕육아] 중환자 병원 놀이", category: "lieDown", targetAge: ['crawl', 'stand'], 
        targetItem: "아무 장난감, 엄마의 뻔뻔한 연기력", energyDrain: "0 (엄마는 자면 됨)", playTime: 20,
        desc: "엄마가 너무 아파서 못 일어나는 날, 합법적으로 누워서 아기한테 돌봄 받는 놀이.",
        steps: [
            "1. 거실 매트 중앙에 이불을 덮고 앓아눕습니다. (최대한 불쌍하게 끙끙대세요)",
            "2. 아기에게 '엄마 아야해.. 약 좀 갖다주세요' 라고 나지막이 말합니다.",
            "3. 아기가 온갖 장난감(블록, 딸랑이 등)을 엄마 배 위로 배달하기 시작합니다.",
            "4. 배달 올 때마다 '아이고 고마워요' 한마디만 하고 계속 눈 감고 쉬시면 됩니다."
        ],
        dadRole: "퇴근 후 어질러진 장난감 싹 다 치우기"
    },
    { 
        id: "p18", title: "[눕육아] 인간 도로 매트", category: "lieDown", targetAge: ['crawl', 'stand'], 
        targetItem: "미니 자동차 장난감 여러 개", energyDrain: "0 (오히려 마사지됨)", playTime: 15,
        desc: "엄마 등짝이 타요 버스의 도로가 됩니다. 은근히 척추 마사지가 되는 개이득 놀이.",
        steps: [
            "1. 엄마는 바닥에 배를 깔고 완전히 엎드립니다.",
            "2. 아기에게 자동차 장난감을 쥐여주고 엄마 등 위로 올립니다.",
            "3. '부릉부릉~' 소리만 내주면 아기가 엄마 척추와 어깨를 따라 자동차를 굴립니다.",
            "4. 뭉친 등 근육이 묘하게 시원해지는 걸 느끼며 15분을 버팁니다."
        ],
        dadRole: "자동차 장난감 소독 티슈로 닦아두기"
    },
    { 
        id: "p19", title: "[눕육아] 이불 터널 탈출기", category: "lieDown", targetAge: ['crawl'], 
        targetItem: "얇고 큰 이불", energyDrain: "0 (누워서 다리만 벌림)", playTime: 15,
        desc: "배밀이하는 아기 한정 치트키. 엄마 다리 사이를 기어가게 만듭니다.",
        steps: [
            "1. 엄마는 바닥에 등을 대고 누워 무릎을 세우고 다리를 벌립니다. (ㅅ자 모양)",
            "2. 다리 위에 얇은 이불을 덮어 어두운 터널을 만들어 줍니다.",
            "3. 다리 사이에 아기를 두고, 반대편에 제일 좋아하는 간식이나 장난감을 둡니다.",
            "4. 아기가 이불 터널을 통과할 때 허벅지로 살짝 조여주면 꺄르르 넘어갑니다."
        ],
        dadRole: "아기가 터널 빠져나올 때 반대편에서 과장되게 반겨주기"
    },
    { 
        id: "p20", title: "[눕육아] 신체 부위 까꿍 보물찾기", category: "lieDown", targetAge: ['flip', 'crawl'], 
        targetItem: "엄마의 몸, 이불", energyDrain: "0 (손가락만 움직임)", playTime: 15,
        desc: "이불을 덮어쓰고 숨쉬기 운동만 하면서 아기 관찰력 키워주는 꿀팁.",
        steps: [
            "1. 엄마는 바닥에 대자로 눕고 이불을 머리 끝까지 완전히 덮어씁니다.",
            "2. 발가락 하나, 혹은 손가락 하나만 이불 밖으로 빼서 꼼지락거립니다.",
            "3. 아기가 기어 와서 그 손가락/발가락을 잡으면 '까꿍!' 하고 살짝 이불을 내립니다.",
            "4. 이불 속에서 안 나오는 엄마를 아기가 파헤치게 냅두며 누워계세요."
        ],
        dadRole: "이불 세탁기 돌리기"
    },
    { 
        id: "p21", title: "[눕육아] 엄마 머리카락 미용실", category: "lieDown", targetAge: ['stand'], 
        targetItem: "플라스틱 빗, 헤어롤 (안전한 것)", energyDrain: "0 (두피 마사지)", playTime: 20,
        desc: "딸맘, 아들맘 모두 가능한 두피 마사지 타임. 머리끄덩이 잡혀도 누워있는 게 낫다면 추천.",
        steps: [
            "1. 엄마는 아기 앞에 등을 지고 편안하게 바닥에 엎드립니다.",
            "2. 아기에게 빗이나 헤어롤 장난감을 주고 '엄마 머리 예쁘게 해주세요' 라고 합니다.",
            "3. 아기가 엄마 머리카락을 빗기고 만지작거리며 소근육을 발달시킵니다.",
            "4. 간혹 머리가 뽑힐 수 있으나, 일어나는 것보다 누워있는 게 행복하다면 참을 만합니다."
        ],
        dadRole: "바닥에 빠진 엄마 머리카락 돌돌이로 치우기"
    },
{ 
        id: "p22", title: "[눕육아] 엄마 배 위 터미타임", category: "lieDown", targetAge: ['newborn', 'tummy', 'flip'], 
        targetItem: "엄마의 푹신한 배", energyDrain: "0 (숨만 쉬면 됨)", playTime: 15,
        desc: "바닥 터미타임을 오열하며 거부하는 아기들 전용. 엄마도 눕고 애도 눕는 평화의 시간.",
        steps: [
            "1. 엄마는 거실 매트나 침대 위에 등을 대고 편하게 눕습니다.",
            "2. 아기를 엄마 가슴~배 위에 엎드려 놓습니다. (아기와 눈을 맞춥니다)",
            "3. 엄마의 심장 소리와 숨쉴 때마다 오르락내리락하는 배의 움직임이 완벽한 바운서가 됩니다.",
            "4. 아기가 엄마 턱이나 코를 빨아먹으려 할 수 있으니 주의하며 15분을 버팁니다."
        ],
        dadRole: "엄마 배 위에 아기 안전하게 올려주고 세팅해주기"
    },
    { 
        id: "p23", title: "[눕육아] 인간 ASMR (얼굴 탐색)", category: "lieDown", targetAge: ['newborn', 'tummy', 'flip'], 
        targetItem: "엄마의 얼굴, 성대", energyDrain: "0 (누워서 입만 나불거림)", playTime: 10,
        desc: "손을 뻗기 시작한 아기 한정. 엄마 얼굴을 장난감으로 내어주는 놀이.",
        steps: [
            "1. 아기 옆에 나란히 누워서 눈을 감습니다. (진짜 주무시면 안 됩니다)",
            "2. 아기가 손을 뻗어 엄마의 코, 입술, 볼을 만지도록 유도합니다.",
            "3. 아기 손이 닿을 때마다 '뽁!', '뾱!', '쪼옥!' 등 과장된 효과음을 냅니다.",
            "4. 자판기처럼 누를 때마다 소리가 나면 아기가 신기해서 계속 얼굴을 만집니다."
        ],
        dadRole: "옆에서 같이 누워 화음(효과음) 넣어주기"
    },
    { 
        id: "p24", title: "[눕육아] 발가락 까꿍 모빌", category: "lieDown", targetAge: ['tummy', 'flip'], 
        targetItem: "엄마의 발가락, 화려한 양말(선택)", energyDrain: "🔥 (복근 살짝 사용)", playTime: 10,
        desc: "모빌에 질려할 때, 세상에서 가장 역동적인 엄마의 발가락 모빌을 보여주세요.",
        steps: [
            "1. 엄마는 바닥에 등을 대고 누워 아기 시선 쪽에 발이 가도록 합니다.",
            "2. 다리를 위로 들어 올려 아기 얼굴 위에 발이 오게 세팅합니다.",
            "3. 발가락을 쫙 폈다 오므렸다 하며 아기 코끝을 살짝살짝 스치듯 놀아줍니다.",
            "4. 아기가 발가락을 잡으려 바둥거리며 전신 운동을 하게 됩니다."
        ],
        dadRole: "엄마 발 씻겨주기 (필수)"
    },
    { 
        id: "p25", title: "[눕육아] 등짝 북치기 (인간 드럼)", category: "lieDown", targetAge: ['flip', 'crawl'], 
        targetItem: "엄마의 넓은 등", energyDrain: "0 (미세한 타격감)", playTime: 15,
        desc: "손바닥으로 바닥을 치며 노는 걸 좋아하는 시기, 엄마 등짝을 내어주세요.",
        steps: [
            "1. 엄마는 바닥에 배를 깔고 엎드려 눕습니다. (눕 모드)",
            "2. 엎드려 있는 아기, 또는 앉기 시작한 아기를 엄마 등 옆에 둡니다.",
            "3. 아기가 엄마 등짝을 팡팡 치도록 유도합니다. (생각보다 아프지 않고 시원합니다)",
            "4. 아기가 칠 때마다 엄마가 '윽!', '억!' 소리를 내주면 신나서 더 세게 칩니다."
        ],
        dadRole: "엄마 등 다치지 않게 옆에서 북 치는 강도 조절 감시하기"
    },
    { 
        id: "p26", title: "[눕육아] 이불 파도타기", category: "lieDown", targetAge: ['tummy', 'flip'], 
        targetItem: "가벼운 이불이나 속싸개", energyDrain: "0 (팔만 살짝 움직임)", playTime: 10,
        desc: "시각적 자극이 필요한 4개월 아기에게 누워서 보여주는 최고의 블록버스터.",
        steps: [
            "1. 엄마와 아기가 나란히 하늘을 보고 눕습니다.",
            "2. 엄마가 한 손으로 가벼운 이불 끝을 잡고 허공으로 휙휙 날리며 파도를 만듭니다.",
            "3. 이불이 아기 얼굴 위로 사르륵 떨어졌다가 올라가는 걸 반복합니다.",
            "4. 불어오는 바람과 이불의 움직임에 아기가 눈을 떼지 못합니다."
        ],
        dadRole: "반대편에서 같이 이불 잡고 거대한 파도 만들어주기"
    },

// ==========================================
    // 💩 쾌변 기원 (변비 직빵 장운동 촉진 놀이)
    // ==========================================
    { 
        id: "p27", title: "인간 짐볼 바운스", category: "poop", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "엄마의 무릎, 또는 짐볼", energyDrain: "🔥🔥 (허벅지 사용)", playTime: 10,
        desc: "이유식 시작하고 토끼똥 싸는 아기들에게 직빵! 중력과 반동으로 장을 흔들어줍니다.",
        steps: [
            "1. 엄마가 바닥이나 소파에 앉아 아기를 무릎 위에 마주 보게 앉힙니다.",
            "2. 아기의 겨드랑이를 단단히 잡고 위아래로 통통통 바운스를 줍니다.",
            "3. '응가 뿡뿡! 응가 뿡뿡!' 리듬을 타며 좌우로도 흔들어 장운동을 촉진시킵니다.",
            "4. 아기가 웃으면서 배에 힘을 주게 되어 자연스럽게 쾌변을 유도합니다."
        ],
        dadRole: "짐볼에 앉아서 아기 안고 10분간 바운스 타주기"
    },
    { 
        id: "p28", title: "하늘 자전거 폭풍 페달", category: "poop", targetAge: ['newborn', 'tummy', 'flip'], 
        targetItem: "아기의 튼실한 다리", energyDrain: "🔥 (손목 가벼운 운동)", playTime: 10,
        desc: "신생아 배앓이(영아산통)부터 이유식 변비까지 모두 커버하는 소아과 권장 1순위 놀이.",
        steps: [
            "1. 아기를 푹신한 매트 위에 하늘을 보게 정자세로 눕힙니다.",
            "2. 아기의 양쪽 발목을 부드럽게 잡고 자전거 페달을 밟듯 둥글게 돌려줍니다.",
            "3. 무릎이 아기 배를 살짝살짝 누르도록 (너무 세지 않게) 밀어 올려 가스를 빼줍니다.",
            "4. '따릉따릉~ 비켜나세요~' 동요를 부르며 10분간 페달을 밟습니다."
        ],
        dadRole: "아기 눕혀놓고 다리 잡고 노래 3곡 부르며 자전거 태우기"
    },
    { 
        id: "p29", title: "I-LOVE-YOU 배 마사지", category: "poop", targetAge: ['newborn', 'tummy', 'flip', 'crawl'], 
        targetItem: "베이비 오일 또는 로션", energyDrain: "🔥 (스킨십 100%)", playTime: 5,
        desc: "가스가 차서 배가 빵빵하고 칭얼거릴 때, 굳은 변을 부드럽게 밀어내는 마사지.",
        steps: [
            "1. 손에 오일을 비벼 따뜻하게 만든 뒤 아기 배 위에 올립니다.",
            "2. [I] 아기 기준 오른쪽 배에서 위에서 아래로 일직선으로 쓸어내립니다.",
            "3. [L] 오른쪽 윗배에서 왼쪽으로, 다시 아래로 ㄱ자 모양으로 쓸어내립니다.",
            "4. [U] 오른쪽 아랫배에서 시작해 둥글게 무지개를 그리며 왼쪽 아랫배로 밀어줍니다."
        ],
        dadRole: "목욕 후 아기 배에 로션 바르며 마사지 전담하기"
    },

    // ==========================================
    // 🤒 아기 진정 (미열/감기/접종 후 껌딱지 모드)
    // ==========================================
    { 
        id: "p30", title: "창밖 자동차 카운팅", category: "sick", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "거실 창문, 엄마의 나레이션", energyDrain: "0 (창밖만 보면 됨)", playTime: 15,
        desc: "열이 나서 아무것도 안 하려 하고 엄마한테만 안겨 있을 때 쓰는 시선 분산 놀이.",
        steps: [
            "1. 칭얼거리는 아기를 안고 거실 창문 앞(또는 베란다)으로 갑니다.",
            "2. 창밖을 보며 지나가는 자동차, 지나가는 강아지, 날아가는 새를 중계해 줍니다.",
            "3. '오! 저기 빨간 버스 지나간다 부릉부릉~' 하며 평온하게 시각을 자극합니다.",
            "4. 바깥 구경을 하면서 아기의 텐션이 차분해지고 울음이 잦아듭니다."
        ],
        dadRole: "아기 안고 창문 밖 구경시켜주며 쉴 새 없이 말 걸어주기"
    },
    { 
        id: "p31", title: "물소리 ASMR 멍때리기", category: "sick", targetAge: ['newborn', 'tummy', 'flip', 'crawl', 'stand'], 
        targetItem: "화장실 세면대 또는 샤워기", energyDrain: "🔥 (안고 서 있어야 함)", playTime: 10,
        desc: "예방접종 후 악을 쓰고 울 때 가장 빠르게 진정시키는 마법의 백색소음.",
        steps: [
            "1. 통곡하는 아기를 세워서 가슴팍에 단단히 안고 화장실로 들어갑니다.",
            "2. 세면대나 욕조에 물을 틀어 '쏴아아-' 하는 백색소음을 만들어줍니다.",
            "3. 불을 살짝 어둡게 하고 물이 떨어지는 걸 아기가 볼 수 있게 해줍니다.",
            "4. 귓가에 쉬~ 소리를 내주며 등을 토닥이면 물소리 덕분에 5분 내로 호흡이 안정됩니다."
        ],
        dadRole: "우는 아기 안고 화장실 들어가서 물소리 들려주기"
    },
    { 
        id: "p32", title: "거울 속 내 얼굴 스티커 떼기", category: "sick", targetAge: ['crawl', 'stand'], 
        targetItem: "전신거울(또는 화장대 거울), 스티커", energyDrain: "0 (제자리 앉아 놀기)", playTime: 20,
        desc: "컨디션이 안 좋아서 장난감 던지고 짜증 낼 때, 제자리에 앉혀두고 집중시키는 놀이.",
        steps: [
            "1. 거울 앞에 아기를 엄마 무릎에 기대어 편안하게 앉힙니다.",
            "2. 아기가 거울 속 자기 얼굴을 보며 안정감을 찾게 도와줍니다.",
            "3. 거울 표면에 잘 떼어지는 스티커나 포스트잇을 여러 개 붙여줍니다.",
            "4. 아기가 거울에 비친 자기 모습을 보며 꼬물꼬물 스티커를 떼어내며 집중합니다."
        ],
        dadRole: "거울에 묻은 아기 침 자국과 손자국 닦아내기"
    },
       
    // ==========================================
    // 🌟 [추가본] 놀이 처방전 킬러 콘텐츠 7종 
    // ==========================================
    { 
        id: "p33", title: "[눕육아] 인간 고슴도치 (빨래집게 떼기)", category: "lieDown", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "빨래집게 여러 개, 낡은 티셔츠", energyDrain: "0 (누워서 따가움만 참음)", playTime: 20,
        desc: "엄마 옷에 붙은 빨래집게를 떼어내며 소근육을 폭발시키는 전설의 눕육아.",
        steps: [
            "1. 엄마는 버려도 되는 늘어난 티셔츠를 입고 바닥에 대자로 눕습니다.",
            "2. 엄마의 소매, 바지 밑단, 배 쪽에 빨래집게를 잔뜩 집어 고슴도치가 됩니다.",
            "3. 아기가 다가와서 빨래집게를 하나씩 톡톡 떼어내게 냅둡니다.",
            "4. 살살 꼬집히는 고통만 참으면 20분간 완벽한 휴식을 취할 수 있습니다."
        ],
        dadRole: "아기가 다 뗀 빨래집게 다시 엄마 몸에 리필해주기"
    },
    { 
        id: "p34", title: "찍찍이(돌돌이) 청소 반장", category: "zero", targetAge: ['crawl', 'stand'], 
        targetItem: "테이프 클리너 (돌돌이)", energyDrain: "🔥 (집안이 깨끗해짐)", playTime: 15,
        desc: "청소도 하고 아기 힘도 빼는 1석 2조 놀이! 은근히 엄청난 집중력을 발휘합니다.",
        steps: [
            "1. 테이프 클리너(돌돌이)의 접착력을 손으로 몇 번 만져서 살짝 약하게 만듭니다.",
            "2. 기어 다니거나 걷기 시작한 아기 손에 쥐여줍니다.",
            "3. 아기가 온 집안 매트와 바닥을 밀고 다니며 머리카락을 청소하게 둡니다.",
            "4. 테이프에 먼지가 붙은 걸 보여주며 '우와! 깨끗해졌다!' 폭풍 칭찬을 해줍니다."
        ],
        dadRole: "돌돌이 테이프 다 쓰면 한 장씩 뜯어주기"
    },
    { 
        id: "p35", title: "종이컵 에펠탑 파괴자", category: "zero", targetAge: ['crawl', 'stand'], 
        targetItem: "다이소 종이컵 1~2줄", energyDrain: "🔥🔥 (무한 스트레스 해소)", playTime: 20,
        desc: "단돈 1천 원으로 즐기는 파괴의 미학! 층간소음 없이 박살 내는 쾌감을 줍니다.",
        steps: [
            "1. 다이소에서 천 원 주고 산 종이컵을 거실 바닥에 피라미드 모양으로 높게 쌓습니다.",
            "2. 아기가 기어 와서(또는 서서) 손으로 와르르 무너뜨리게 유도합니다.",
            "3. 부서지는 소리가 크지 않아 층간소음 걱정이 전혀 없습니다.",
            "4. 쌓고 무너뜨리고를 무한 반복하며 아기의 스트레스를 완벽히 날려버립니다."
        ],
        dadRole: "빛의 속도로 종이컵 다시 높게 쌓아 올리기 (무한 반복)"
    },
    { 
        id: "p36", title: "인간 김밥 말이", category: "dad", targetAge: ['flip', 'crawl', 'stand'], 
        targetItem: "큰 이불이나 극세사 담담요", energyDrain: "🔥🔥🔥🔥 (전신 운동)", playTime: 15,
        desc: "촉각과 전정감각을 동시에 자극하는 아빠 전용 놀이. 웃음소리 보장합니다.",
        steps: [
            "1. 바닥에 큰 이불을 쭉 펼치고 그 끝에 아기를 눕힙니다.",
            "2. 아빠가 이불 끝을 잡고 천천히 굴려서 아기를 '김밥'처럼 둥글게 맙니다.",
            "3. '김밥 썰겠습니다~' 하면서 손날로 통통통 가볍게 마사지해 줍니다.",
            "4. 이불 끝을 잡고 확 당겨서 김밥을 스르륵 풀어주면 꺄르르 넘어갑니다."
        ],
        dadRole: "김밥천국 이모님 빙의해서 찰지게 말고 썰기"
    },
    { 
        id: "p37", title: "[만병통치] 내 얼굴 TV 시청", category: "sick", targetAge: ['newborn', 'tummy', 'flip', 'crawl', 'stand'], 
        targetItem: "스마트폰 갤러리", energyDrain: "0 (안고 같이 보기)", playTime: 20,
        desc: "열나고 아파서 뽀로로도 거부할 때, 신기하게 자기 얼굴 나오는 영상은 봅니다.",
        steps: [
            "1. 칭얼거리는 아기를 안고 소파에 편하게 기댑니다.",
            "2. 스마트폰 갤러리를 열고 '아기가 꺄르르 웃던 시절'의 영상을 틉니다.",
            "3. 화면 속 자기 모습을 보여주며 '어? 이게 누구지?' 하고 말을 겁니다.",
            "4. 아이들은 자기 얼굴을 보는 걸 가장 좋아하기 때문에 금세 울음을 뚝 그칩니다."
        ],
        dadRole: "스마트폰 용량 터지도록 평소에 아기 영상 많이 찍어두기"
    },
    { 
        id: "p38", title: "휴지심 터널 자동차", category: "zero", targetAge: ['crawl', 'stand'], 
        targetItem: "다 쓴 휴지심, 미니 자동차", energyDrain: "🔥 (소근육/집중력)", playTime: 15,
        desc: "휴지심 버리지 마세요! 자동차나 작은 공이 통과하는 마법의 터널이 됩니다.",
        steps: [
            "1. 다 쓴 두루마리 휴지심이나 키친타올 심을 준비합니다.",
            "2. 한쪽 끝을 잡고 비스듬히 기울인 뒤, 미니 자동차나 작은 공을 굴려 넣습니다.",
            "3. 쏙 빠져나오는 모습을 보여주면 아기가 스스로 물건을 넣으려고 애를 씁니다.",
            "4. 벽에 테이프로 여러 개를 지그재그로 붙여 길고 거대한 미끄럼틀을 만들 수도 있습니다."
        ],
        dadRole: "휴지심 모아두고, 벽에 테이프로 미끄럼틀 설계해주기"
    },
    { 
        id: "p39", title: "이유식 촉감 지옥 (국수 놀이)", category: "poop", targetAge: ['crawl', 'stand'], 
        targetItem: "삶은 소면, 큰 김장 비닐", energyDrain: "🔥🔥🔥🔥 (치우는 게 일)", playTime: 30,
        desc: "변비 직빵이자 최강의 촉감놀이! 치우는 게 두렵지만 효과는 확실합니다.",
        steps: [
            "1. 거실 바닥에 거대한 김장용 비닐이나 놀이 매트를 깔아둡니다.",
            "2. 소면을 소금 없이 푹 삶아서 찬물에 헹군 뒤 던져줍니다.",
            "3. 손으로 쪼물딱거리고 발로 밟고 입으로 쪽쪽 빨아먹으며 변비를 뚫어냅니다.",
            "4. 아기가 마음껏 어지르도록 30분간 방치한 뒤 바로 욕실로 직행합니다."
        ],
        dadRole: "놀이 끝난 후 비닐 수거 및 바닥 걸레질 3회 실시"
    }

  ];    
// ==========================================
// 🛒 TRACK 2: [육아는 템빨] SOS 상황별 장난감 큐레이션 DB (35종)
// ==========================================
const toyData = [
    // 🍚 [sos-meal] 엄마 밥 먹을 시간 벌어주는 템
    { id: 1, name: "회전 팝튜브 흡착 스피너", imgIcon: "🧩", freeTime: "20분", milestone: "flip", theme: "sos-meal", tags: "#식당평화 #유리창착붙", battery: "필요 없음", batteryLink: "", fomo: "하이체어 트레이나 식당 유리창에 이거 안 붙이면 식사 시간 내내 전쟁입니다. 무조건 사세요.", coupangLink: "" },
    { id: 2, name: "타이니러브 모빌", imgIcon: "🌙", freeTime: "40분", milestone: "newborn", theme: "sos-meal", tags: "#신생아필수 #모빌계의샤넬", battery: "C형 3개", batteryLink: "https://link.coupang.com/a/eHwicCcyHY", fomo: "뒤집기 시작하면 늦습니다. 조리원 퇴소 직후 엄마가 밥 한술 뜨게 해주는 유일한 구원자.", coupangLink: "" },
    { id: 3, name: "코니스 에듀테이블", imgIcon: "🎪", freeTime: "40분", milestone: "all", theme: "sos-meal", tags: "#국밥템 #뽕뽑는장난감", battery: "AA 4개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "누워있을 때부터 짚고 일어설 때까지. 엄마 밥 먹을 때 옆에 비스듬히 놔주면 혼자 피아노 치느라 조용합니다.", coupangLink: "" },
    { id: 4, name: "야마토야 하이체어 흡착 장난감", imgIcon: "🎡", freeTime: "15분", milestone: "flip", theme: "sos-meal", tags: "#이유식전쟁 #식탁착붙", battery: "필요 없음", batteryLink: "", fomo: "이유식 거부 오기 전에 식탁에 붙여두세요. 엄마가 밥 먹일 틈을 만들어줍니다.", coupangLink: "" },
    { id: 5, name: "브라이트스타트 고리친구들", imgIcon: "🔗", freeTime: "15분", milestone: "tummy", theme: "sos-meal", tags: "#가성비최강 #만능고리", battery: "필요 없음", batteryLink: "", fomo: "구강기 시작할 때 무조건 물고 빠는 필수템. 유모차나 하이체어에 매달아두면 바닥에 안 떨어져서 엄마가 편합니다.", coupangLink: "" },
    { id: 6, name: "튤립 사운드북 세트", imgIcon: "🌷", freeTime: "20분", milestone: "all", theme: "sos-meal", tags: "#국민튤립 #연속재생", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "무한 반복 재생 켜놓고 하이체어 트레이에 던져주세요. 노래 3바퀴 돌 때까지 엄마 식사 가능합니다.", coupangLink: "" },
    { id: 7, name: "피셔프라이스 스마트 러닝홈", imgIcon: "🏠", freeTime: "50분", milestone: "stand", theme: "sos-meal", tags: "#국민문짝 #까꿍놀이", battery: "C형 3개", batteryLink: "https://link.coupang.com/a/eHwicCcyHY", fomo: "기어 다니고 잡고 서는 시기의 거실 인테리어 파괴자. 하지만 이거 없으면 엄마 밥 먹을 시간도 파괴됩니다.", coupangLink: "" },
    { id: 8, name: "블루래빗 첫 토이북 사운드바", imgIcon: "🎵", freeTime: "20분", milestone: "flip", theme: "sos-meal", tags: "#동요메들리", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "버튼 한 번 누르면 메들리로 나옵니다. 밥 먹을 때 매트 위에 틀어두면 리듬 타며 혼자 놉니다.", coupangLink: "" },

    // ⚡ [sos-sleep] 오늘 밤 기절 보장 (체력 방전)
    { id: 9, name: "오리지널 졸리점퍼", imgIcon: "🦘", freeTime: "30분", milestone: "stand", theme: "sos-sleep", tags: "#강제꿀잠 #하체방전", battery: "필요 없음", batteryLink: "", fomo: "몸무게 13kg 넘어가면 못 탑니다. 허벅지 힘 생기는 딱 '지금' 사야 오늘 밤 기절시킬 수 있습니다.", coupangLink: "" },
    { id: 10, name: "피셔프라이스 점퍼루", imgIcon: "🐸", freeTime: "30분", milestone: "stand", theme: "sos-sleep", tags: "#점프본능 #안전방전", battery: "AA 3개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "졸리점퍼 설치가 부담스럽다면 무조건 점퍼루! 스프링 탄력으로 하체 파워를 완벽히 털어버립니다.", coupangLink: "" },
    { id: 11, name: "브이텍 깜짝볼", imgIcon: "⚽", freeTime: "20분", milestone: "crawl", theme: "sos-sleep", tags: "#기어가기유도 #스스로굴러감", battery: "AA 3개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "배밀이 시작할 때 이 공 굴려주면 잡으려고 온 집안을 기어 다니다가 꿀잠 잡니다.", coupangLink: "" },
    { id: 12, name: "브이텍 기어다니는 곰돌이", imgIcon: "🐻", freeTime: "25분", milestone: "crawl", theme: "sos-sleep", tags: "#추적본능 #배밀이치트키", battery: "AA 3개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "혼자 기어 도망가는 곰돌이! 잡으려고 돌진하는 아기를 보면 육퇴 시간이 당겨짐을 직감합니다.", coupangLink: "" },
    { id: 13, name: "브이텍 걸음마 보조기", imgIcon: "🚶‍♂️", freeTime: "30분", milestone: "stand", theme: "sos-sleep", tags: "#걸음마연습 #무한직진", battery: "AA 2개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "첫걸음마 뗄 때 필수. 집안을 끝없이 밀고 다니느라 에너지가 바닥나 밤에 안 깹니다.", coupangLink: "" },
    { id: 14, name: "인포캔버스 자석 보드판", imgIcon: "🧲", freeTime: "40분", milestone: "stand", theme: "sos-sleep", tags: "#서서놀기 #대근육발달", battery: "필요 없음", batteryLink: "", fomo: "앉아서 노는 장난감은 체력이 안 빠집니다. 벽에 붙여두면 일어서서 노느라 하체 방전 1순위!", coupangLink: "" },
    { id: 15, name: "핑크퐁 노래하는 수면 램프", imgIcon: "🌙", freeTime: "20분", milestone: "all", theme: "sos-sleep", tags: "#수면의식 #천장영화관", battery: "AAA 3개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "불 끄고 천장에 빔 쏴주세요. 누워서 영상 보다가 스르륵 눈을 감는 기적의 템.", coupangLink: "" },
    { id: 16, name: "이븐플로 엑서쏘서", imgIcon: "🛸", freeTime: "30분", milestone: "stand", theme: "sos-sleep", tags: "#가둬두기최고 #건전지먹는하마", battery: "AAA 9개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "안전하게 가둬두고 전신 운동 시키는 기구. 건전지가 많이 들지만 엄마의 평화를 위해 필수입니다.", coupangLink: "" },
    { id: 17, name: "젤리캣 버니 애착인형", imgIcon: "🐰", freeTime: "수면", milestone: "all", theme: "sos-sleep", tags: "#수면독립 #국민애착인형", battery: "필요 없음", batteryLink: "", fomo: "분리수면 준비하시나요? 엄마 냄새 묻혀서 안겨주면 통잠의 기적이 시작됩니다.", coupangLink: "" },

    // 🚘 [sos-out] 카시트/식당 징징이 보장템
    { id: 18, name: "오볼(O-ball) 오리지널", imgIcon: "🧶", freeTime: "15분", milestone: "flip", theme: "sos-out", tags: "#소근육발달 #유모차평화", battery: "필요 없음", batteryLink: "", fomo: "구멍이 숭숭 뚫려 손 힘없는 아기도 잘 잡습니다. 카시트에서 떨어뜨리지 않고 잘 갖고 놉니다.", coupangLink: "" },
    { id: 19, name: "멍멍 강아지 사운드북", imgIcon: "🐶", freeTime: "20분", milestone: "flip", theme: "sos-out", tags: "#촉감사운드 #차량용지존", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "털도 만지고 소리도 나고! 이동하는 차 안에서 아기 지루함 달래는 최고의 콤팩트 북.", coupangLink: "" },
    { id: 20, name: "핑크퐁 상어가족 스마트폰", imgIcon: "📱", freeTime: "20분", milestone: "crawl", theme: "sos-out", tags: "#스마트폰도둑 #안전대체재", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "엄마 폰 침 바르기 시작할 때 뺏어서 이거 쥐여주셔야 폰 고장을 막고 식당에서 조용해집니다.", coupangLink: "" },
    { id: 21, name: "미니 점착 메모지(무지)", imgIcon: "📝", freeTime: "30분", milestone: "crawl", theme: "sos-out", tags: "#식당비밀병기 #무소음", battery: "필요 없음", batteryLink: "", fomo: "소리 안 나는 사기템. 식당 테이블에 붙였다 뗐다 하느라 소리 없이 집중합니다.", coupangLink: "" },
    { id: 22, name: "뽀로로 운전놀이 핸들", imgIcon: "🏎️", freeTime: "25분", milestone: "stand", theme: "sos-out", tags: "#카시트착붙 #베스트드라이버", battery: "AA 2개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "카시트 거부 아기 전용. 아빠 운전할 때 뒤에서 같이 핸들 돌리느라 악쓰고 울지 않습니다.", coupangLink: "" },
    { id: 23, name: "어스본 사운드북 (동물농장)", imgIcon: "🐷", freeTime: "20분", milestone: "crawl", theme: "sos-out", tags: "#청각발달 #외출템", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "버튼 누르는 재미에 빠진 아기, 카시트나 식당에 앉혀두고 이것만 줘도 고막의 평화가 찾아옵니다.", coupangLink: "" },
    { id: 24, name: "비지베어 조작북 세트", imgIcon: "📖", freeTime: "20분", milestone: "stand", theme: "sos-out", tags: "#영국국민책 #소근육운동", battery: "필요 없음", batteryLink: "", fomo: "밀고 당기고 돌리면서 조용히 집중합니다. 외출할 때 기저귀 가방에 1권만 챙기면 든든해요.", coupangLink: "" },
    { id: 25, name: "베이비아인슈타인 라디오", imgIcon: "📻", freeTime: "15분", milestone: "all", theme: "sos-out", tags: "#백색소음대체 #카시트수면", battery: "AA 2개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "한 손에 쏙 들어오는 클래식 멜로디. 유모차에서 징징거릴 때 틀어주면 바로 진정됩니다.", coupangLink: "" },
    { id: 26, name: "모윰 포니 손목 치발기", imgIcon: "🦄", freeTime: "20분", milestone: "tummy", theme: "sos-out", tags: "#손목고정 #절대안떨어짐", battery: "필요 없음", batteryLink: "", fomo: "외출 시 바닥에 자꾸 던지는 치발기는 가라! 손목에 채워두면 30분은 혼자 쫩쫩 빱니다.", coupangLink: "" },

    // 🚿 [sos-shower] 안전 화장실 보장템 (엄마 씻기 & 아기 목욕)
    { id: 27, name: "유키두 매직 오리 분수", imgIcon: "🦆", freeTime: "30분", milestone: "crawl", theme: "sos-shower", tags: "#목욕지옥탈출 #물놀이종결자", battery: "AA 4개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "오리들이 빙글빙글 돌며 물 뿜습니다. 물 거부 아기도 이거 하나면 바로 욕조로 뛰어듭니다.", coupangLink: "" },
    { id: 28, name: "먼치킨 폭포수 장난감", imgIcon: "🌊", freeTime: "20분", milestone: "flip", theme: "sos-shower", tags: "#가성비목욕템 #톱니바퀴", battery: "필요 없음", batteryLink: "", fomo: "벽에 붙여두고 물 부으면 물레방아가 돌아갑니다. 욕조 안에서 일어날 생각을 안 합니다.", coupangLink: "" },
    { id: 29, name: "토이게이트 버블크랩", imgIcon: "🦀", freeTime: "20분", milestone: "flip", theme: "sos-shower", tags: "#거품폭탄 #목욕동요", battery: "AA 2개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "버튼 누르면 거품이 폭포처럼 쏟아지며 노래가 나옵니다. 목욕 싫어하는 아기용 마약템.", coupangLink: "" },
    { id: 30, name: "핑크퐁 워터매직매트", imgIcon: "🎨", freeTime: "35분", milestone: "crawl", theme: "sos-shower", tags: "#물낙서 #청소지옥끝", battery: "필요 없음", batteryLink: "", fomo: "펜에 물만 채워주면 매트 위에 그림이 그려집니다. 바닥 낙서 방어하며 화장실 앞에서 놀게 하세요.", coupangLink: "" },
    { id: 31, name: "유키두 수도꼭지", imgIcon: "🚰", freeTime: "30분", milestone: "flip", theme: "sos-shower", tags: "#무한물줄기 #샤워생명줄", battery: "AA 3개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "물 계속 틀어달라고 우는 아기 전용. 수도세 아끼고 엄마 샤워할 시간 버는 치트키입니다.", coupangLink: "" },
    { id: 32, name: "부기보드 물놀이 스티커", imgIcon: "🐠", freeTime: "25분", milestone: "stand", theme: "sos-shower", tags: "#욕실벽착붙 #물로지워지는", battery: "필요 없음", batteryLink: "", fomo: "욕실 벽 가득 낙서해도 물로 슥 지우면 끝! 돌 지나 낙서 본능 터졌을 때 가둬두기 좋습니다.", coupangLink: "" },
    { id: 33, name: "리틀타익스 액티비티 가든", imgIcon: "🎪", freeTime: "40분", milestone: "stand", theme: "sos-shower", tags: "#아기아지트 #완벽가두기", battery: "AAA 2개", batteryLink: "https://link.coupang.com/a/eHwdWJhAhU", fomo: "엄마 화장실 갈 때 여기 넣어두면 안전한 요새가 됩니다. 부피가 커도 포기할 수 없어요.", coupangLink: "" },
    { id: 34, name: "개구리 연못", imgIcon: "🐸", freeTime: "30분", milestone: "crawl", theme: "sos-shower", tags: "#공톡톡 #시선고정", battery: "C형 4개", batteryLink: "https://link.coupang.com/a/eHwicCcyHY", fomo: "화장실 문 열어두고 문 앞에 이거 켜주세요. 공 튀어 오르는 거 보느라 화장실 안으로 안 들어옵니다.", coupangLink: "" },
    { id: 35, name: "피셔프라이스 피아노 체육관", imgIcon: "🎹", freeTime: "30분", milestone: "tummy", theme: "sos-shower", tags: "#발차기달인 #거울보기", battery: "AA 3개", batteryLink: "https://link.coupang.com/a/eHwctLSEI8", fomo: "신생아~뒤집기 전 필수템. 화장실 문 앞에 눕혀두고 씻으세요. 발차기하느라 엄마 안 찾습니다.", coupangLink: "" },
    // ==========================================
    // 🌟 [추가본] 객단가 폭발! 부피 큰 거물급 필수템 5종
    // ==========================================
    { 
        id: 36, name: "야야 바닐라 실내 미끄럼틀", imgIcon: "🛝", freeTime: "40분", milestone: "stand", theme: "sos-sleep", 
        tags: "#실내놀이터 #하체방전", battery: "필요 없음", batteryLink: "", 
        fomo: "걷기 시작하면 집이 좁습니다. 이거 하나 거실에 두면 땀 뻘뻘 흘리며 오르락내리락하다가 밤에 기절합니다.", coupangLink: "" 
    },
    { 
        id: 37, name: "제이맥 자석블럭 풀세트", imgIcon: "🧲", freeTime: "50분", milestone: "stand", theme: "sos-meal", 
        tags: "#아빠로망 #시간순삭", battery: "필요 없음", batteryLink: "", 
        fomo: "객단가가 높지만 돈값 제대로 하는 템! 아빠들이 더 좋아해서 성 만들고 자동차 만들다 보면 엄마 자유시간 1시간 보장입니다.", coupangLink: "" 
    },
    { 
        id: 38, name: "파파스토이 팝튜브 세트", imgIcon: "🐛", freeTime: "25분", milestone: "crawl", theme: "sos-out", 
        tags: "#식당조용 #소근육발달", battery: "필요 없음", batteryLink: "", 
        fomo: "늘릴 때마다 나는 타다닥! 소리에 아기들 환장합니다. 식당에서 쥐여주면 이어 붙이고 구부리느라 정신을 못 차립니다.", coupangLink: "" 
    },
    { 
        id: 39, name: "먼치킨 목욕 크레용/색연필", imgIcon: "🖍️", freeTime: "30분", milestone: "stand", theme: "sos-shower", 
        tags: "#욕실벽화 #물로지워짐", battery: "필요 없음", batteryLink: "", 
        fomo: "욕조 벽면에 마음껏 낙서하게 두세요. 물 뿌리면 스르륵 지워져서 청소도 편하고, 목욕 거부하는 아기 입수시키는 마법의 템입니다.", coupangLink: "" 
    },
    { 
        id: 40, name: "포포베베 아기 비데", imgIcon: "🛁", freeTime: "엄마 손목 구원", milestone: "newborn", theme: "sos-shower", 
        tags: "#응가테러방어 #손목보호", battery: "필요 없음", batteryLink: "", 
        fomo: "하루에 똥 3번 싸는 신생아 시기, 한 손으로 안고 씻기다 손목 나갑니다. 세면대에 눕혀두고 양손으로 씻기면 천국이 열립니다.", coupangLink: "" 
    }
];