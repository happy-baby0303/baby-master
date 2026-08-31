// ==========================================
// 🍼 배냇함 젖병 통합 데이터베이스 V2.1 (bottle/data.js)
// (총 40종: 열탕/UV 소독 팩트체크 및 쿠팡 파트너스 딥링크 내장)
// ==========================================

const bottleData = [
    // ---------------- [기존 메이저 20종] ----------------
    { 
        id: "b01", brand: "더블하트", name: "모유실감 3세대 PPSU", 
        age: ["newborn", "infant", "toddler"], rejection: "super", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(권장) / UV(공식금지, 현실은 변색 감수하고 씀)",
        desc: "국민 젖병의 대명사. 한국 아기 구강 구조에 가장 잘 맞아 '젖꼭지 거부'가 거의 없습니다. 공식적으론 열탕 소독만 권장합니다.",
        searchKeyword: "더블하트 3세대 젖병 트윈팩",
        coupangLink: "https://link.coupang.com/a/gB3IhV0bsW"
    },
    { 
        id: "b02", brand: "헤겐", name: "사각 젖병 PPSU", 
        age: ["newborn", "infant"], rejection: "normal", wash: "easy",
        material: "ppsu", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O) / UV(변색주의)",
        desc: "입구가 넓어 손이 쑥쑥 들어가 세척(설거지)이 예술적으로 편합니다. 나중에 뚜껑만 바꿔 이유식 용기로 쓸 수 있어 활용도가 높아요.",
        searchKeyword: "헤겐 신생아 젖병 스타터 세트",
        coupangLink: "https://link.coupang.com/a/gB5YIbpDvE"
    },
    { 
        id: "b03", brand: "닥터브라운", name: "옵션스플러스 내열유리", 
        age: ["newborn"], rejection: "normal", wash: "uv",
        material: "glass", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O) / UV(무제한 가능)",
        desc: "배앓이계의 1타 강사. 부품(통기시스템)이 많아 일명 '설거지 지옥'으로 불리지만, 배앓이를 줄이는 데는 확실히 강합니다.",
        searchKeyword: "닥터브라운 유리 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB34zzE06K"
    },
    { 
        id: "b04", brand: "코모토모", name: "실리콘 젖병", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "silicone", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / 전자레인지(O) / UV(오래 돌리면 끈적해짐)",
        desc: "엄마 가슴과 가장 비슷한 촉감. 혼합수유를 하거나 젖병 거부가 심한 아기들의 구세주입니다. 단, UV 소독은 피하는 게 좋습니다.",
        searchKeyword: "코모토모 실리콘 젖병 2팩",
        coupangLink: "https://link.coupang.com/a/gB4byGHwf6"
    },
    { 
        id: "b05", brand: "모윰", name: "리얼핏 PPSU 젖병", 
        age: ["newborn", "infant", "toddler"], rejection: "super", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(가능하나 변색 올 수 있음)",
        desc: "인스타 감성의 예쁜 디자인과 더블하트 모유실감 젖꼭지와 호환돼 인기입니다.",
        searchKeyword: "모윰 리얼핏 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4c9LyIai"
    },
    { 
        id: "b06", brand: "스펙트라", name: "PA 젖병", 
        age: ["infant", "toddler"], rejection: "normal", wash: "uv",
        material: "pa", price: "low", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(특화-변색 거의 없음)",
        desc: "유리처럼 투명하면서도 가볍고 기스에 강한 PA소재. UV 소독기를 맘 편히 돌릴 수 있어 요즘 대세인 가성비 젖병입니다.",
        searchKeyword: "스펙트라 pa 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4fvRSfim"
    },
    { 
        id: "b07", brand: "그로미미", name: "PPSU 와이드넥 젖병", 
        age: ["toddler"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(변색주의)",
        desc: "6개월 이후 아기가 스스로 쥐고 먹기 편하며, 나중에 그로미미 빨대를 꽂아 '빨대컵'으로 호환해서 쓰기 가장 좋은 브랜드입니다.",
        searchKeyword: "그로미미 젖병 트윈팩",
        coupangLink: "https://link.coupang.com/a/gB4kuzQ8hE"
    },
    { 
        id: "b08", brand: "스와비넥스", name: "제로제로 실리콘 젖병", 
        age: ["newborn"], rejection: "super", wash: "normal",
        material: "silicone", price: "high", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "내부에 진공 실리콘 백이 들어있어 공기 유입이 아예 불가능해 공기가 거의 안 들어가 배앓이 걱정을 줄여줍니다.",
        searchKeyword: "스와비넥스 제로제로 스타터",
        coupangLink: "https://link.coupang.com/a/gB4o0VMNR6"
    },
    { 
        id: "b09", brand: "마더케이", name: "베이직 PPSU 젖병", 
        age: ["newborn", "infant"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "low", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(O)",
        desc: "저렴한 가격에 탄탄한 품질을 자랑하는 가성비 젖병. 국민 젖꼭지들과 다 호환되어 막 쓰기 좋습니다.",
        searchKeyword: "마더케이 ppsu 젖병 더블팩",
        coupangLink: "https://link.coupang.com/a/gB4qL8IWaW"
    },
    { 
        id: "b10", brand: "베베그로우", name: "PPSU 젖병", 
        age: ["infant", "toddler"], rejection: "super", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "strong", compatible: "yes", 
        sterilization: "열탕(O) / UV(O)",
        desc: "유한킴벌리(구 더블하트 수입사)에서 작정하고 만든 젖병. 양쪽 에어밸브로 배앓이를 확실하게 잡아주어 반응이 좋습니다.",
        searchKeyword: "베베그로우 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4sFm81g4"
    },
    { 
        id: "b11", brand: "유미", name: "유미(Umee) 배앓이방지 PPSU", 
        age: ["newborn", "infant"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O) / UV(변색주의)",
        desc: "세계 특허 '에어벤트' 링을 장착해 배앓이 방지에 특화되었습니다. 부품 조립 시 딱 소리가 나게 끼워야 안 샙니다.",
        searchKeyword: "유미 배앓이 젖병 스타터",
        coupangLink: ""
    },
    { 
        id: "b12", brand: "란시노", name: "내열유리 젖병", 
        age: ["newborn"], rejection: "super", wash: "uv",
        material: "glass", price: "high", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / 식세기(O) / UV(무제한 가능)",
        desc: "유럽의 더블하트. 모유실감과 똑같은 느낌의 젖꼭지라 직구 대란이 일기도 했습니다. 유리가 튼튼하고 안전합니다.",
        searchKeyword: "란시노 유리 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4znK36GW"
    },
    { 
        id: "b13", brand: "아벤트", name: "내추럴 유리 젖병", 
        age: ["newborn", "infant"], rejection: "normal", wash: "uv",
        material: "glass", price: "mid", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / UV(무제한 가능)",
        desc: "전 세계적으로 가장 많이 팔리는 글로벌 스탠다드. 꽃잎 모양의 젖꼭지가 함몰을 방지합니다.",
        searchKeyword: "아벤트 내추럴 유리젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4EFMKPJc"
    },
    { 
        id: "b14", brand: "닥터브라운", name: "옵션스플러스 PP 젖병", 
        age: ["infant", "toddler"], rejection: "normal", wash: "normal",
        material: "pp", price: "low", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O) / UV(소재 특성상 비권장)",
        desc: "닥터브라운의 배앓이 방지 기술을 가벼운 PP 소재에 담았습니다. PP소재라 교체 주기를 2~3개월로 짧게 잡아야 합니다.",
        searchKeyword: "닥터브라운 pp 젖병 더블팩",
        coupangLink: "https://link.coupang.com/a/gB4F867ZYq"
    },
    { 
        id: "b15", brand: "엠마요", name: "프리미엄 실리콘 젖병", 
        age: ["infant", "toddler"], rejection: "super", wash: "easy",
        material: "silicone", price: "high", antiColic: "normal", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "실리콘 소재로 깨질 위험이 전혀 없어 아기가 던져도 안전합니다.",
        searchKeyword: "엠마요 실리콘 젖병 세트",
        coupangLink: ""
    },
    { 
        id: "b16", brand: "누크", name: "네이처센스 유리 젖병", 
        age: ["newborn"], rejection: "super", wash: "uv",
        material: "glass", price: "mid", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O) / UV(O)",
        desc: "젖꼭지 구멍이 하나가 아니라 여러 개의 유출공이 있어, 모유가 나오는 방식과 가장 흡사하게 설계되었습니다.",
        searchKeyword: "누크 네이처센스 유리 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4LP4K2Wi"
    },
    { 
        id: "b17", brand: "마마치", name: "100% 실리콘 젖병", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "silicone", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / UV(장기사용시 끈적임 주의)",
        desc: "몸통 전체가 말랑말랑한 100% 실리콘. 젖병 거부 아기들이 잘 무는 편이지만 무겁고 먼지가 잘 붙는 단점이 있습니다.",
        searchKeyword: "마마치 실리콘 젖병 세트",
        coupangLink: ""
    },
    { 
        id: "b18", brand: "피프", name: "베이비 내열유리 젖병", 
        age: ["newborn"], rejection: "normal", wash: "uv",
        material: "glass", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(O)",
        desc: "가볍고 내구성이 뛰어난 일본산 내열유리. 더블하트 젖꼭지와 호환돼 값이 아깝지 않습니다.",
        searchKeyword: "피프 베이비 유리 젖병",
        coupangLink: ""
    },
    { 
        id: "b19", brand: "트위스트쉐이크", name: "안티콜릭 젖병", 
        age: ["infant", "toddler"], rejection: "normal", wash: "easy",
        material: "pp", price: "mid", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "독특하게 내부에 분유 믹서망이 포함되어 있어 덩어리지지 않게 잘 섞이고, 입구가 넓어 씻기 편합니다.",
        searchKeyword: "트위스트쉐이크 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB4QNEofue"
    },
    { 
        id: "b20", brand: "더블하트", name: "내열유리 젖병", 
        age: ["newborn"], rejection: "super", wash: "uv",
        material: "glass", price: "high", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(무제한 가능)",
        desc: "유리라 무겁지만, 모유실감 젖꼭지의 '거부 방지 효과'와 유리 소재의 '안전성/UV호환'을 모두 챙긴 꿀조합입니다.",
        searchKeyword: "더블하트 유리 젖병 세트",
        coupangLink: ""
    },

    // ---------------- [신규 벌크업 20종: 세트/에디션/서브브랜드] ----------------
    { 
        id: "b21", brand: "더블하트", name: "디즈니 에디션 PPSU", 
        age: ["infant", "toddler"], rejection: "super", wash: "normal",
        material: "ppsu", price: "high", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(권장) / UV(변색주의)",
        desc: "성능은 기존 모유실감과 같고, 귀여운 곰돌이 푸 등 캐릭터가 새겨져 있어 엄마들의 소장 욕구를 자극합니다.",
        searchKeyword: "더블하트 디즈니 젖병",
        coupangLink: "https://link.coupang.com/a/gB4WclfS1Y"
    },
    { 
        id: "b22", brand: "헤겐", name: "트리플 세트 (150+240ml)", 
        age: ["newborn", "infant"], rejection: "normal", wash: "easy",
        material: "ppsu", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O)",
        desc: "신생아부터 영아기까지 쭉 쓸 수 있는 용량별 혼합 세트. 출산 준비물이나 지인 선물용으로 가장 많이 팔리는 베스트 구성입니다.",
        searchKeyword: "헤겐 젖병 150 240 세트",
        coupangLink: "https://link.coupang.com/a/gB4ZRsUkOy"
    },
    { 
        id: "b23", brand: "토미티피", name: "클로저투네이쳐 배앓이 젖병", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "pp", price: "low", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "영국에서 오래 팔린 젖병. 엄마 가슴을 닮은 넓은 젖꼭지로 유두 혼동을 줄여주며, '온도 센서' 튜브가 있어 초보 엄빠에게 매우 유용합니다.",
        searchKeyword: "토미티피 배앓이 젖병",
        coupangLink: ""
    },
    { 
        id: "b24", brand: "모윰", name: "마카롱 에디션 PPSU", 
        age: ["infant", "toddler"], rejection: "super", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(변색주의)",
        desc: "기존 모윰 젖병에 파스텔톤 마카롱 컬러를 입힌 감성 젖병. 뚜껑 색깔로 쌍둥이나 첫째/둘째 젖병 구분하기 좋습니다.",
        searchKeyword: "모윰 마카롱 젖병",
        coupangLink: ""
    },
    { 
        id: "b25", brand: "닥터브라운", name: "내로우넥 (좁은입구) 유리젖병", 
        age: ["newborn"], rejection: "normal", wash: "uv",
        material: "glass", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O) / UV(O)",
        desc: "와이드넥보다 입구가 좁아 분유 넣고 씻기는 헬(Hell)이지만, 입이 작은 신생아나 미숙아(이른둥이)가 무는 데는 오히려 편합니다.",
        searchKeyword: "닥터브라운 내로우넥 유리젖병",
        coupangLink: "https://link.coupang.com/a/gB42fMNi5k"
    },
    { 
        id: "b26", brand: "유피스 (Upis)", name: "소프트크린 PPSU", 
        age: ["infant", "toddler"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "low", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O)",
        desc: "오랜 전통의 한국 브랜드. 무난한 성능에 가성비가 매우 뛰어나, 모유실감 젖꼭지를 꽂아 쓰는 스페어 젖병으로 많이 씁니다.",
        searchKeyword: "유피스 ppsu 젖병",
        coupangLink: ""
    },
    { 
        id: "b27", brand: "MAM (맘)", name: "이지스타트 안티콜릭", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "pp", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "전자레인지 3분 소독 특화",
        desc: "유럽 직구 대란템. 바닥이 통째로 열려서 세척이 편하고, 젖병 안에 물만 넣고 전자레인지에 3분 돌리면 자체 소독이 되는 마법의 젖병입니다.",
        searchKeyword: "맘 이지스타트 젖병",
        coupangLink: ""
    },
    { 
        id: "b28", brand: "스펙트라", name: "올뉴 내열유리 젖병", 
        age: ["newborn"], rejection: "normal", wash: "uv",
        material: "glass", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(무제한 가능)",
        desc: "국산 유축기로 잘 알려진 스펙트라가 만든 튼튼한 유리 젖병. 눈금이 지워지지 않고 깔끔하며 더블하트와 호환됩니다.",
        searchKeyword: "스펙트라 유리 젖병",
        coupangLink: ""
    },
    { 
        id: "b29", brand: "아벤트", name: "안티콜릭 에어프리", 
        age: ["newborn"], rejection: "normal", wash: "easy",
        material: "pa", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "젖병 안에 숟가락 모양의 '에어프리 밸브'가 있어, 젖병을 수평으로 눕혀 먹여도 젖꼭지에 우유가 가득 차게 만들어 공기 흡입을 막습니다.",
        searchKeyword: "아벤트 에어프리 젖병",
        coupangLink: ""
    },
    { 
        id: "b30", brand: "마더케이", name: "디아 (DIA) PPSU", 
        age: ["toddler"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O) / UV(O)",
        desc: "마더케이의 프리미엄 라인. 베이직 라인보다 디자인이 고급스럽고 그립감이 좋아 외출 시 들고 다니기 폼나는 젖병입니다.",
        searchKeyword: "마더케이 디아 젖병",
        coupangLink: ""
    },
    { 
        id: "b31", brand: "미니노어", name: "안심 유리 젖병", 
        age: ["newborn", "infant"], rejection: "normal", wash: "uv",
        material: "glass", price: "high", antiColic: "normal", compatible: "no", 
        sterilization: "열탕(O) / UV(O)",
        desc: "덴마크 북유럽 감성의 예쁜 디자인. 유리가 꽤 두꺼워 쉽게 깨지지 않고 분유 보온성이 매우 뛰어납니다.",
        searchKeyword: "미니노어 유리 젖병",
        coupangLink: ""
    },
    { 
        id: "b32", brand: "치코", name: "퍼펙트5 (Perfect5)", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "pp", price: "mid", antiColic: "super", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "바닥에 달린 '이퀼리브리엄 멤브레인' 밸브가 아기의 빠는 힘에 맞춰 공기 흐름을 미세 조절하는 스마트한 배앓이 방지 젖병입니다.",
        searchKeyword: "치코 퍼펙트5 젖병",
        coupangLink: ""
    },
    { 
        id: "b33", brand: "에브리데이베이비", name: "온도감지 유리 젖병", 
        age: ["infant"], rejection: "normal", wash: "uv",
        material: "glass", price: "high", antiColic: "normal", compatible: "no", 
        sterilization: "열탕(O) / UV(O)",
        desc: "뜨거운 분유물을 넣으면 젖병 겉면 색깔이 하얗게 변해, 손목에 떨어뜨려 보지 않아도 적정 온도를 눈으로 바로 확인할 수 있습니다.",
        searchKeyword: "에브리데이베이비 유리젖병",
        coupangLink: "https://link.coupang.com/a/gB5diAePJI"
    },
    { 
        id: "b34", brand: "쁘띠아띠", name: "소프트 실리콘 젖병", 
        age: ["newborn", "infant"], rejection: "super", wash: "easy",
        material: "silicone", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "국산 프리미엄 실리콘 젖병. 결합부가 플라스틱이 아닌 이중 실리콘 구조로 되어 있어 실리콘 젖병 특유의 '우유 새는 현상'을 잡았습니다.",
        searchKeyword: "쁘띠아띠 실리콘 젖병",
        coupangLink: "https://link.coupang.com/a/gB5fuQ2oNM"
    },
    { 
        id: "b35", brand: "베베리쉬", name: "PPSU 와이드 젖병", 
        age: ["infant", "toddler"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "low", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O)",
        desc: "아가방에서 런칭한 가성비 젖병. 가격이 매우 착하지만 더블하트 호환과 넓은 입구 등 갖출 건 다 갖춘 알짜배기입니다.",
        searchKeyword: "베베리쉬 젖병",
        coupangLink: ""
    },
    { 
        id: "b36", brand: "그로미미", name: "다크시티 에디션 PPSU", 
        age: ["toddler"], rejection: "normal", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O)",
        desc: "육아템에서는 보기 드문 시크한 블랙/차콜 컬러를 적용해, 장비빨을 중시하는 트렌디한 아빠들의 열광적인 지지를 받습니다.",
        searchKeyword: "그로미미 다크시티",
        coupangLink: ""
    },
    { 
        id: "b37", brand: "누비 (Nuby)", name: "컴포트 실리콘 젖병", 
        age: ["infant", "toddler"], rejection: "super", wash: "easy",
        material: "silicone", price: "mid", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O)",
        desc: "실리콘 몸통을 가볍게 눌러주어 수유 속도를 엄마가 직접 조절할 수 있어, 사출(우유가 뿜어져 나오는 현상)이 심할 때 유용합니다.",
        searchKeyword: "누비 실리콘 젖병",
        coupangLink: ""
    },
    { 
        id: "b38", brand: "비박스", name: "PPSU 와이드 젖병", 
        age: ["toddler"], rejection: "normal", wash: "easy",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(O)",
        desc: "국민 빨대컵으로 유명한 비박스에서 만든 젖병. 나중에 비박스 호환 빨대를 꽂아 빨대컵으로 자연스럽게 넘어가기 좋습니다.",
        searchKeyword: "비박스 ppsu 젖병",
        coupangLink: ""
    },
    { 
        id: "b39", brand: "더블하트", name: "160ml 신생아 스타터 세트", 
        age: ["newborn"], rejection: "super", wash: "normal",
        material: "ppsu", price: "mid", antiColic: "normal", compatible: "yes", 
        sterilization: "열탕(권장) / UV(공식금지)",
        desc: "신생아 시기에 딱 맞는 작은 160ml 사이즈와 SS사이즈 젖꼭지가 포함된 조리원 퇴소 필수 출산 준비물 세트입니다.",
        searchKeyword: "더블하트 160 젖병 세트",
        coupangLink: "https://link.coupang.com/a/gB5kMCp7oO"
    },
    { 
        id: "b40", brand: "헤겐", name: "330ml 대용량 젖병", 
        age: ["toddler"], rejection: "normal", wash: "easy",
        material: "ppsu", price: "high", antiColic: "strong", compatible: "no", 
        sterilization: "열탕(O) / 식세기(O)",
        desc: "먹성이 좋아 240ml로는 부족한 대식가 아기들을 위한 특대형. 나중에 떡뻥 보관통이나 대용량 물통으로 쓰기 딱 좋습니다.",
        searchKeyword: "헤겐 330 젖병",
        coupangLink: "https://link.coupang.com/a/gB5mYuObhk"
    }
];