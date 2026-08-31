const carseatData = [
    // --------------------------------------------------------
    // 🚀 [수익 창출] 쿠팡 파트너스 가성비 & 베스트셀러 라인업
    // --------------------------------------------------------
    {
        id: "cs01", brand: "조이", name: "아이스핀 360",
        age: ["newborn", "toddler"], install: ["isofix_leg"], carSize: ["compact", "sedan", "suv"], 
        compactOk: true, // 👈 [추가됨] 소형차 장착 쌉가능!
        rotation: "yes", safety: ["isize", "adac"], price: "mid",
        bodySpec: "📏 40~105cm / ⚖️ 최대 19kg",
        specs: { adacScore: "1.8 (좋음)", reboundStopper: "컴팩트 베이스" }, // 👈 [수정됨] 최우수 -> 좋음
        desc: "회전형 중에 많이 팔리는 제품입니다. 하단 베이스가 슬림해서 아반떼, K3 같은 준중형 차량 뒷좌석에 장착해도 앞좌석 공간이 꽤 확보됩니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/eGfNlAgYqi", searchKeyword: "조이 아이스핀 360"
    },
    {
        id: "cs02", brand: "순성", name: "아크 올인원 아이사이즈",
        age: ["newborn", "toddler", "junior"], install: ["isofix_leg"], carSize: ["sedan", "suv", "carnival"],
        rotation: "yes", safety: ["isize", "kc"], price: "low", // 👈 [수정됨] all -> kc
        bodySpec: "📏 40~145cm / ⚖️ 12세까지 종결",
        specs: { adacScore: "미참여 · KC 인증", reboundStopper: "성장 맞춤형 이너시트" },
        desc: "예산이 빠듯하면 좋은 선택이에요. 다만 단계별 제품만큼 각 시기에 꼭 맞지는 않습니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/eGf7TZOCC4", searchKeyword: "순성 아크 올인원"
    },
    {
        id: "cs03", brand: "폴레드", name: "올에이지 360",
        age: ["newborn", "toddler", "junior"], install: ["isofix_tether", "belt"], 
        carSize: ["compact", "sedan", "suv", "carnival"],
        compactOk: true, // 👈 [추가됨] 소형차 장착 가능!
        rotation: "yes", safety: ["kc"], price: "low", // 👈 [수정됨] all -> kc
        bodySpec: "📏 신생아~160cm / ⚖️ 체중: ~36kg",
        specs: { adacScore: "미참여 · KC 인증", reboundStopper: "락킹벨트 (모든 차량 장착)" },
        desc: "ISOFIX가 없는 구형 차량(안전벨트 결합)에도 장착 가능! 탑테더 방식이라 카니발이나 팰리세이드 3열에도 설치하기 좋습니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/eGf9ELqdaK", searchKeyword: "폴레드 올에이지 360" 
    },
    {
        id: "cs04", brand: "브라이텍스", name: "베르사픽스",
        age: ["toddler", "junior"], install: ["isofix_tether"], carSize: ["suv", "sedan", "carnival"],
        rotation: "no", safety: ["kc"], price: "high", // 👈 [수정됨] all -> kc
        bodySpec: "📏 15개월~12세 / ⚖️ 9~36kg",
        specs: { adacScore: "미참여 · 유럽 인증", reboundStopper: "V-Tether (대형차 특화)" },
        desc: "바닥 지지대(레그)가 없는 탑테더 방식이라, 바닥에 수납함이 있는 카니발이나 대형 SUV 뒷좌석에 맞습니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/eGgKssx7dY", searchKeyword: "브라이텍스 베르사픽스"
    },
    {
        id: "cs05", brand: "맥시코시", name: "코어 프로 주니어 리클라이닝",
        age: ["junior"], install: ["isofix_leg"], carSize: ["sedan", "suv", "carnival"],
        rotation: "no", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 100~150cm",
        specs: { adacScore: "2.1 (좋음)", reboundStopper: "Click Assist 라이트 시스템" },
        desc: "어두운 지하주차장에서도 아이가 스스로 안전벨트를 맬 수 있게 버클 쪽에 라이트가 켜지는 센스 만점 주니어 카시트입니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/eGgISmBuSG", searchKeyword: "맥시코시 코어 프로"
    },
    {
        id: "cs06", brand: "에어보스", name: "신생아 다기능 인펀트 카시트",
        age: ["newborn"], install: ["belt"], carSize: ["compact", "sedan", "suv", "carnival"],
        rotation: "no", safety: ["kc"], price: "low",
        bodySpec: "📏 신생아 전용 / ⚖️ 최대 13kg",
        specs: { adacScore: "미참여 · KC 인증", reboundStopper: "3점식 안전벨트 장착" },
        desc: "퇴원할 때 아기를 안고 타면 안 됩니다. 미리 준비 못 하셨다면 우선 이 제품으로 데려오시고, 오래 쓸 카시트는 따로 고르세요.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/gbI2WnHhcG", searchKeyword: "에어보스 바구니 카시트"
    },
    {
        id: "cs07", brand: "다이치", name: "브이가드 토들러/주니어",
        age: ["toddler", "junior"], install: ["isofix_tether"], carSize: ["sedan", "suv", "carnival"],
        rotation: "no", safety: ["kc"], price: "mid",
        bodySpec: "📏 9개월~12세 / ⚖️ 9~36kg",
        specs: { adacScore: "미참여 · KC 인증", reboundStopper: "확장형 V자 프레임" },
        desc: "국내에서 오래 팔린 주니어 카시트입니다. 아이가 클수록 어깨 골격에 맞춰 프레임이 V자로 넓어집니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/gbJfStdujQ", searchKeyword: "다이치 브이가드"
    },
    {
        id: "cs08", brand: "다이치", name: "이지캐리2 (휴대용)",
        age: ["toddler", "junior"], install: ["belt", "isofix_leg"], carSize: ["compact", "sedan", "suv", "carnival"],
        rotation: "no", safety: ["kc"], price: "low",
        bodySpec: "📏 12개월~5세 / ⚖️ 9~18kg",
        specs: { adacScore: 	"미참여", reboundStopper: "백팩 폴딩 시스템" },
        desc: "제주도 여행 가시나요? 세컨카나 택시를 자주 타시나요? 접어서 백팩에 넣고 다닐 수 있는 몇 안 되는 카시트입니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/gbI7uY934C", searchKeyword: "다이치 이지캐리2"
    },
    {
        id: "cs09", brand: "다이치", name: "블리바 360",
        age: ["newborn", "toddler"], install: ["isofix_leg"], carSize: ["sedan", "suv"],
        rotation: "yes", safety: ["isize"], price: "mid",
        bodySpec: "📏 신생아~105cm / ⚖️ 18kg",
        specs: { adacScore: "미참여", reboundStopper: "친환경 밤부 모달 소재" },
        desc: "다이치의 안전성에 감성적인 디자인을 더했습니다. 태열이나 땀이 많은 아기를 위한 통기성 밤부 소재가 돋보입니다.",
        purchasePlatform: "coupang", linkUrl: "https://link.coupang.com/a/gbJmzhQHqC", // 👈 완벽한 딥링크!
        searchKeyword: "다이치 블리바 360"
    },

    // --------------------------------------------------------
    // 👑 [명분과 신뢰] 프리미엄 하이엔드 라인업 (공식몰 연동)
    // --------------------------------------------------------
    {
        id: "cs10", brand: "브라이텍스", name: "듀얼픽스 아이사이즈",
        age: ["newborn", "toddler"], install: ["isofix_leg"], carSize: ["suv", "sedan"],
        rotation: "yes", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 40~105cm",
        specs: { adacScore: "2.1 (좋음)", reboundStopper: "리바운드 스토퍼 (2차 전복 방지)" },
        desc: "안전 설계로 오래 신뢰받아 온 독일 브랜드입니다. 값이 나가는 만큼 오래 쓰는 쪽에 가깝고, 정품 확인과 A/S를 생각하면 공식몰이 안전합니다.",
        purchasePlatform: "official", linkUrl: "https://brand.naver.com/safian", searchKeyword: "브라이텍스 듀얼픽스 공식몰"
    },
    {
        id: "cs11", brand: "싸이벡스", name: "솔루션 T 아이픽스 (주니어)",
        age: ["junior"], install: ["isofix_leg"], carSize: ["sedan", "suv", "carnival"],
        rotation: "no", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 100~150cm / ⚖️ 15~50kg",
        specs: { adacScore: "1.9 (좋음)", reboundStopper: "특허 헤드레스트 각도 조절" },
        desc: "주니어 카시트에서 자주 비교되는 제품입니다. 차에서 아이가 잠들어도 목이 앞으로 고꾸라지지 않는 특허받은 헤드레스트 기술이 예술입니다.",
        purchasePlatform: "official", linkUrl: "https://cybex-online.com/ko-kr", searchKeyword: "싸이벡스 솔루션 T 아이픽스"
    },
    {
        id: "cs12", brand: "싸이벡스", name: "클라우드 T 아이사이즈",
        age: ["newborn"], install: ["isofix_leg", "belt"], carSize: ["sedan", "suv", "carnival"],
        rotation: "yes", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 45~87cm",
        specs: { adacScore: "1.7 (좋음)", reboundStopper: "인체공학적 플랫 포지션" }, // 👈 [수정됨] 최우수 -> 좋음
        desc: "부가부, 스토케 같은 디럭스 유모차에 그대로 얹히는 바구니 카시트입니다. 차 밖에서는 요람처럼 180도 눕혀집니다.",
        purchasePlatform: "official", linkUrl: "https://cybex-online.com/ko-kr/car-seats/cloud-t-isize", searchKeyword: "싸이벡스 클라우드 T"
    },
    {
        id: "cs13", brand: "뉴나", name: "프라임 (PRYM)",
        age: ["newborn", "toddler"], install: ["isofix_leg"], carSize: ["suv", "sedan"],
        rotation: "yes", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 40~105cm",
        specs: { adacScore: "2.1 (좋음)", reboundStopper: "자동 전개 측면 충돌 보호막" },
        desc: "네덜란드 프리미엄 브랜드. 아이를 태우는 순간 측면 보호막(SIP)이 자동으로 튀어나오는 고급스러운 기믹을 자랑합니다.",
        purchasePlatform: "official", linkUrl: "https://nunababy.com/kr", searchKeyword: "뉴나 프라임"
    },
    {
        id: "cs14", brand: "스토케", name: "이지고 모듈러 X1 by 비세이프",
        age: ["newborn"], install: ["isofix_leg", "belt"], carSize: ["suv", "sedan", "carnival"],
        rotation: "no", safety: ["isize", "adac"], price: "high",
        bodySpec: "📏 40~75cm",
        specs: { adacScore: "1.7 (좋음)", reboundStopper: "스토케 유모차 어댑터 프리 결합" }, // 👈 [수정됨] 최우수 -> 좋음
        desc: "스토케 유모차를 쓰신다면 고민할 필요가 없습니다. 귀찮은 어댑터 조립 없이 스토케 프레임에 바로 꽂히는 프리미엄 카시트입니다.",
        purchasePlatform: "official", linkUrl: "https://www.stokke.com/KOR/ko-kr/", searchKeyword: "스토케 이지고 모듈러"
    }
];