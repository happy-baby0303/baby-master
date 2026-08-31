/* ============================================================
   배냇함 — 라이브러리 여덟 편 더 (libraryplus.js)

   라이브러리에 글이 열한 개 있었다. 좋은 글들이다.
   그런데 부모가 새벽에 검색하는 것 중에 안 다뤄진 게 많았다.

   특히 이 여덟 개는 "없는 게 이상한" 것들이다.

     🛏️ 안전한 잠자리      — 영아돌연사를 줄이는 유일한 방법
     🌡️ 체온 재는 법        — 열 대처법은 있는데 재는 법이 없었다
     💊 약 먹이기           — 우유에 타도 되나. 토했으면 다시 먹이나
     👃 코막힘·콧물         — 신생아가 숨을 못 쉬면 젖도 못 먹는다
     💩 며칠째 안 쌌어요     — 이유식 시작하면 거의 다 겪는다
     🦷 이앓이              — "이 나느라 열난다"는 말이 위험하다
     😖 배앓이(영아산통)     — 부모가 무너지는 지점
     💉 접종하고 열이 나요   — 접종 D-day 카드의 짝

   ⚠️ 진단하지 않는다.
      "이럴 땐 병원" 을 각 글마다 끝에 못 박았다.
      집에서 할 수 있는 것과 병원에 가야 하는 것만 가른다.

   ⚠️ index.html 은 한 줄도 안 고친다.
      기존 글과 똑같은 마크업으로 라이브러리 끝에 붙인다.
      infopick.js 가 알아서 찾아서 추천에도 올린다.

   index.html 에서 infopick.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var MARK = "data-libplus";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* ---------- 기존 글과 똑같은 옷을 입힌다 ---------- */

    function build(a) {
        var head = '<div class="' + (a.tint || "box-tint-blue") + '" ' +
            'style="padding:14px; border-radius:12px; margin-bottom:16px;">' +
            '<strong style="color:var(--primary); font-size:14px; margin-bottom:4px; display:block;">' +
                a.leadTitle + '</strong>' + a.lead + '</div>';

        var body = a.parts.map(function (p) {
            return '<strong style="color:var(--text-m); font-size:14px; margin-bottom:6px; display:block;">' +
                   p.h + '</strong>' + p.t + '<br><br>';
        }).join("");

        var call = '<div class="box-tint-red" style="padding:14px; border-radius:12px; margin-top:4px;">' +
            '<strong style="color:#D32F2F; font-size:14px; margin-bottom:4px; display:block;">🚨 이럴 땐 병원으로</strong>' +
            a.hospital + '</div>';

        var el = document.createElement("details");
        el.className = "lib-item";
        el.setAttribute(MARK, "1");
        el.style.borderBottom = "1px solid var(--border)";
        el.innerHTML =
            '<summary style="display:flex; justify-content:space-between; align-items:center; ' +
                'padding:18px 0; cursor:pointer;">' +
                '<div style="font-size:14.5px; font-weight:800; color:var(--text-m);">' + a.title + '</div>' +
                '<div class="lib-plus" style="font-size:22px; font-weight:300; color:var(--primary); ' +
                    'line-height:0.5; transition:0.2s;">+</div>' +
            '</summary>' +
            '<div style="padding:0 0 20px 0; font-size:13.5px; line-height:1.6; color:var(--text-s);">' +
                head + body + call +
            '</div>';
        return el;
    }

    /* ---------- 여덟 편 ---------- */

    var ARTICLES = [

    { title: "🛏️ 아기를 눕히는 자세, 이것 하나만은",
      tint: "box-tint-purple",
      leadTitle: "✅ 낮잠도 밤잠도, 언제나 등을 대고 똑바로",
      lead: "돌 전 아기를 엎드리거나 옆으로 재우지 않는 것 — 지금까지 밝혀진 것 중 영아돌연사를 줄이는 가장 확실한 방법입니다. 하루 한 번의 낮잠도 예외가 아니에요.",
      parts: [
        { h: "🛌 잠자리는 단단하고 평평하게",
          t: "푹신한 요, 소파, 부모 침대 위 쿠션, 아기띠에 태운 채로는 재우지 마세요. 얼굴이 파묻히면 아기는 스스로 고개를 못 듭니다." },
        { h: "🧸 잠자리에 아무것도 두지 마세요",
          t: "베개, 인형, 두꺼운 이불, 침대 가드(범퍼), 수면 쿠션 전부요. 예쁜 아기 침대 사진에 있는 것들이 실제로는 위험합니다. 이불 대신 <strong>입는 담요(수면조끼)</strong>를 쓰면 얼굴을 덮지 않아요." },
        { h: "🏠 같은 방, 다른 잠자리",
          t: "적어도 6개월까지는 부모와 같은 방에서 재우되, <strong>잠자리는 따로</strong> 두는 것이 권장됩니다. 한 이불에서 같이 자는 것은 눌림과 질식의 위험이 있어요. 특히 부모가 몹시 피곤하거나 술을 마신 날은 절대 안 됩니다." },
        { h: "🌡️ 덥게 입히지 마세요",
          t: "어른보다 한 겹 더 정도면 충분합니다. 뒷목이 축축하면 더운 거예요. 모자를 씌운 채 재우지 않습니다." },
        { h: "🚭 담배 연기는 옷에서도 옵니다",
          t: "집 안에서 안 피워도, 밖에서 피우고 들어온 옷과 손에 남은 연기가 위험을 높입니다. 안기 전에 갈아입고 손을 씻어주세요." },
        { h: "🔄 스스로 뒤집기 시작했다면",
          t: "눕힐 때는 <strong>언제나 등을 대고</strong> 눕히되, 아기가 스스로 뒤집어 엎드렸다면 굳이 되돌리지 않아도 됩니다. 다만 잠자리에 아무것도 없어야 한다는 원칙은 그대로예요." }
      ],
      hospital: "자다가 얼굴색이 변했거나, 숨을 멈춘 것 같은 순간이 있었다면 괜찮아 보여도 <strong>반드시 진료</strong>를 받으세요. 그리고 그 일이 몇 시에 얼마나 있었는지 적어 가세요."
    },

    { title: "🌡️ 체온, 어디서 어떻게 재나",
      tint: "box-tint-blue",
      leadTitle: "✅ 어디서 쟀는지가 몇 도인지만큼 중요합니다",
      lead: "부위마다 정상 범위가 다릅니다. 병원에 말할 때는 <strong>“겨드랑이로 38.1도”</strong>처럼 부위를 같이 말해주세요.",
      parts: [
        { h: "👶 3개월 미만이라면",
          t: "이 시기의 열은 그 자체로 진료 대상입니다. 재는 방법을 고민하기보다 <strong>38도가 넘으면 바로 병원</strong>으로 가세요." },
        { h: "👂 귀 체온계",
          t: "빠르고 편하지만, 귓구멍이 좁은 <strong>6개월 이전에는 오차가 큽니다</strong>. 귀지가 많거나 각도가 틀어져도 낮게 나와요. 양쪽을 재서 높은 쪽을 보세요." },
        { h: "🤗 겨드랑이",
          t: "가장 안전하고 무난합니다. 다만 실제 체온보다 <strong>0.3~0.5도쯤 낮게</strong> 나오는 편이라, 겨드랑이로 37.5도면 이미 미열일 수 있습니다. 땀을 닦고 팔을 꼭 붙여 재세요." },
        { h: "😐 이마(비접촉)",
          t: "제일 편하지만 오차가 제일 큽니다. 밖에서 들어왔거나 울고 난 직후, 히터 바람을 맞은 뒤에는 엉뚱하게 나옵니다. <strong>실내에서 5분 쉬고</strong> 재세요." },
        { h: "📏 하나만 정해서 쓰세요",
          t: "체온계를 바꾸면 숫자가 달라집니다. <strong>같은 체온계로 같은 부위</strong>를 재야 어제와 오늘을 비교할 수 있어요. 잰 값은 툴박스 해열제에 바로 적어두시면 병원에서 그대로 읽어드립니다." }
      ],
      hospital: "3개월 미만 38도, 3~6개월 38.5도 이상, 그 이상이라도 <strong>39도가 넘거나 축 처지면</strong> 진료를 받으세요. 열보다 <strong>아이 상태</strong>가 더 중요한 신호입니다."
    },

    { title: "💊 약 먹이기 — 뱉을 때, 토했을 때",
      tint: "box-tint-yellow",
      leadTitle: "⚠️ 분유나 우유에 타지 마세요",
      lead: "다 안 먹으면 약도 덜 들어가고, 한 번 쓴맛이 나면 그날부터 <strong>분유 자체를 거부</strong>합니다. 젖병에 타는 건 특히 안 됩니다.",
      parts: [
        { h: "💉 계량은 눈금으로",
          t: "집에 있는 티스푼은 크기가 제각각입니다. 약국에서 주는 <strong>투약병이나 주사기형 계량기</strong>를 쓰세요. 몸무게로 정해지는 약이라 조금 넘겨도 문제가 됩니다." },
        { h: "😮 볼 안쪽으로 천천히",
          t: "목구멍 정면으로 넣으면 사레가 듭니다. 아기를 살짝 세워 안고 <strong>볼 안쪽 벽을 따라</strong> 조금씩 흘려 넣으세요. 누운 채로는 먹이지 않습니다." },
        { h: "🤮 먹고 바로 토했다면",
          t: "임의로 다시 먹이지 마세요. 같은 양을 한 번 더 먹이면 두 배가 될 수 있습니다. <strong>언제, 얼마나 먹고, 몇 분 뒤에 토했는지</strong>를 약국이나 병원에 물어보세요." },
        { h: "🕐 간격이 제일 중요합니다",
          t: "해열제는 종류마다 최소 간격과 하루 한도가 다릅니다. 배냇함 툴박스의 해열제 도구가 <strong>다음에 줄 수 있는 시각</strong>을 세어드리니 그걸 보고 주세요. 새벽에 머리로 계산하지 마세요." },
        { h: "🥄 섞어도 되는 것",
          t: "약에 따라 소량의 물이나 시럽에 섞어도 되는 것이 있고 안 되는 것이 있습니다. <strong>받아온 약국에 물어보는 게 가장 정확합니다.</strong> 인터넷 말고요." }
      ],
      hospital: "약을 먹고 두드러기·입술 붓기·숨차함이 생기면 <strong>즉시 119</strong>입니다. 어른 약이나 다른 아이의 약을 잘못 먹였다면 남은 약과 포장을 챙겨 바로 병원으로 가세요."
    },

    { title: "👃 코막힘과 콧물, 어떻게 뚫어주나",
      tint: "box-tint-blue",
      leadTitle: "✅ 아기는 코로만 숨 쉽니다",
      lead: "돌 전 아기는 입으로 숨 쉬는 게 서툴러서, 코가 막히면 <strong>젖도 못 먹고 잠도 못 잡니다</strong>. 콧물이 대단해서가 아니라 그래서 뚫어줘야 해요.",
      parts: [
        { h: "💧 생리식염수 먼저, 흡입기는 그다음",
          t: "마른 코딱지를 그냥 빨아들이면 점막이 다칩니다. <strong>생리식염수 한두 방울</strong>을 콧구멍에 넣어 30초쯤 불린 뒤에 빼주세요. 순서만 바꿔도 훨씬 잘 나옵니다." },
        { h: "🛁 목욕 직후가 제일 잘 나와요",
          t: "따뜻한 김을 쐰 뒤에는 콧속이 촉촉해져서 수월합니다. 밤에 힘들어하면 <strong>가습기를 틀고 방을 너무 건조하지 않게</strong> 해주세요." },
        { h: "🚫 면봉은 깊이 넣지 마세요",
          t: "보이는 입구만 살살 닦으세요. 깊이 넣으면 안쪽으로 밀려 들어가고 점막에 상처가 납니다." },
        { h: "🔁 너무 자주는 오히려 붓습니다",
          t: "흡입기는 <strong>수유 전과 잠들기 전</strong>처럼 꼭 필요할 때만 쓰세요. 시간마다 빨아내면 점막이 부어서 더 막힙니다." },
        { h: "🛏️ 잘 때는 머리 쪽을 살짝",
          t: "매트리스 <strong>아래에</strong> 수건을 접어 넣어 상체 쪽을 아주 조금 높여주세요. 베개를 머리에 받치는 건 안 됩니다 — 잠자리 안전과 어긋납니다." }
      ],
      hospital: "숨 쉴 때 <strong>갈비뼈 사이나 쇄골 위가 쑥 들어가면</strong>, 쌕쌕거리거나 숨이 가빠 보이면 바로 진료를 받으세요. 3개월 미만이 코막힘으로 <strong>수유를 못 하면</strong> 그것만으로도 병원에 갈 이유입니다."
    },

    { title: "💩 며칠째 안 쌌어요 (변비일까)",
      tint: "box-tint-green",
      leadTitle: "✅ 변비는 '횟수'가 아니라 '굳기'로 봅니다",
      lead: "모유 먹는 아기는 <strong>4~5일에 한 번</strong>도 정상일 수 있어요. 변이 무르고 아기가 잘 먹고 잘 논다면 며칠 걸러도 변비가 아닙니다.",
      parts: [
        { h: "🔍 이건 변비입니다",
          t: "변이 <strong>토끼 똥처럼 딱딱하게 동글동글</strong>하거나, 눌 때 얼굴이 새빨개지도록 힘들어하거나, 항문이 찢어져 피가 비칠 때입니다. 배가 빵빵하고 잘 안 먹는 것도 신호예요." },
        { h: "🥣 이유식 시작하면 거의 다 겪습니다",
          t: "모유·분유만 먹다가 고형식이 들어오면 변이 단단해지는 게 흔합니다. 잘못하신 게 아니에요. <strong>물을 조금 더</strong> 주고, 배·자두·고구마처럼 섬유질과 수분이 있는 재료를 늘려보세요." },
        { h: "🤸 배 마사지와 다리 운동",
          t: "배꼽 주위를 <strong>시계 방향</strong>으로 부드럽게 문지르고, 누운 아기의 다리로 자전거 타듯 움직여 주세요. 따뜻한 손이 좋습니다." },
        { h: "🚫 관장은 습관이 됩니다",
          t: "면봉이나 관장약을 자주 쓰면 아기가 <strong>스스로 힘주는 법을 안 배웁니다</strong>. 급할 때 병원 지시로 한 번은 몰라도, 집에서 반복하지 마세요." },
        { h: "🍯 꿀은 돌 전에 절대 안 됩니다",
          t: "변비에 꿀물이 좋다는 말이 돌지만, <strong>돌 이전에는 보툴리누스 중독</strong> 위험이 있어 소량도 금지입니다." }
      ],
      hospital: "변에 <strong>피가 섞이거나</strong>, 배가 빵빵하면서 <strong>토하거나</strong>, 태어나서 한 번도 시원하게 못 본 경우는 바로 진료를 받으세요. 딸기잼 같은 점액혈변은 응급입니다."
    },

    { title: "🦷 이앓이 — 첫니 나올 때",
      tint: "box-tint-purple",
      leadTitle: "⚠️ '이 나느라 열난다'는 말이 제일 위험합니다",
      lead: "잇몸이 근질거려 미열이 도는 정도는 있을 수 있지만, <strong>이앓이는 38도가 넘는 열의 원인이 아닙니다</strong>. 열이 나면 이 탓으로 넘기지 말고 다른 원인을 찾아야 해요.",
      parts: [
        { h: "🗓️ 보통 6~10개월, 개인차가 큽니다",
          t: "돌이 지나 첫니가 나는 아기도 정상 범위입니다. 늦다고 칼슘을 더 먹인다고 빨라지지 않아요." },
        { h: "😮 이런 신호가 옵니다",
          t: "침이 갑자기 많아지고, 아무거나 물어뜯고, 잇몸이 하얗게 부풀고, 밤에 유난히 보챕니다. 침 때문에 <strong>턱 주변에 발진</strong>이 생기기도 해요 — 자주 닦고 보습해주세요." },
        { h: "🧊 차가운 것이 제일 낫습니다",
          t: "냉장실(냉동실 말고)에 넣어둔 <strong>치발기</strong>나, 깨끗한 손가락으로 잇몸을 지그시 눌러 마사지해주세요. 꽝꽝 언 것은 잇몸을 다치게 합니다." },
        { h: "🚫 잇몸 마취 젤은 피하세요",
          t: "벤조카인 같은 국소마취 성분은 <strong>영유아에게 권장되지 않습니다</strong>. 목 안쪽으로 넘어가 사레가 들거나 드물게 심각한 부작용이 보고됐어요. 아기용이라고 적혀 있어도 약사에게 먼저 물어보세요." },
        { h: "🪥 첫니가 나오면 바로 닦아주세요",
          t: "거즈나 실리콘 칫솔로 하루 두 번. 자기 전 마지막 수유 뒤에 닦는 게 특히 중요합니다." }
      ],
      hospital: "<strong>38도가 넘는 열</strong>, 설사, 발진이 함께 오면 이앓이가 아니라 다른 병입니다. 이 탓으로 미루지 말고 진료를 받으세요."
    },

    { title: "😖 배앓이(영아산통), 저녁마다 우는 아기",
      tint: "box-tint-yellow",
      leadTitle: "✅ 부모가 뭘 잘못해서 그런 게 아닙니다",
      lead: "생후 2주쯤 시작해 <strong>3~4개월이면 대개 사라집니다</strong>. 해 질 무렵부터 몇 시간씩, 안아도 달래도 안 그치는 울음이에요. 잘 먹고 잘 크고 있다면 병이 아니라 지나가는 시기입니다.",
      parts: [
        { h: "🤱 해볼 만한 것",
          t: "옆으로 감싸 안고 <strong>천천히 흔들기</strong>, 배를 시계 방향으로 마사지, 다리로 하늘 자전거, 수유 중간과 후에 <strong>트림 충분히</strong>, 그리고 백색소음. 다 안 될 때도 있습니다." },
        { h: "🍼 젖병이라면 공기를 줄여보세요",
          t: "젖꼭지 구멍이 아기에게 너무 크거나 작아도 공기를 많이 삼킵니다. 먹는 동안 젖꼭지에 <strong>분유가 가득 차 있는지</strong> 보세요." },
        { h: "🚨 절대 흔들지 마세요",
          t: "이게 이 글에서 제일 중요합니다. 울음이 안 그칠 때 아기를 <strong>세게 흔들면 뇌에 돌이킬 수 없는 손상</strong>이 옵니다(흔들린 아기 증후군). 순간의 일로 벌어집니다." },
        { h: "🚪 내려놓고 나오세요",
          t: "한계가 오면 아기를 <strong>안전한 잠자리에 등을 대고 눕히고</strong> 방을 나와 5분 숨을 고르세요. 그동안 아기가 우는 것은 해가 되지 않습니다. 부모가 무너지는 게 훨씬 위험합니다. 짝꿍과 교대 시간을 미리 정해두세요." },
        { h: "🥛 분유를 바꾸기 전에",
          t: "특수 분유로 바꾸면 낫는 경우는 생각보다 드뭅니다. 바꾸기 전에 소아과와 먼저 상의하세요. 여러 번 바꾸면 아기 배가 더 힘들어집니다." }
      ],
      hospital: "<strong>열, 반복되는 구토, 피 섞인 변, 체중이 늘지 않음</strong> — 이 중 하나라도 있으면 산통이 아닙니다. 울음소리가 평소와 다르게 <strong>날카롭고 높거나</strong>, 축 처져 있으면 바로 진료를 받으세요."
    },

    { title: "💉 예방접종 하고 열이 나요",
      tint: "box-tint-green",
      leadTitle: "✅ 하루 이틀 미열은 흔한 반응입니다",
      lead: "몸이 백신에 반응하고 있다는 뜻이에요. 대개 <strong>접종 당일~다음 날</strong>에 오르고 이틀 안에 가라앉습니다.",
      parts: [
        { h: "🌡️ 열이 나면 그때 해열제",
          t: "열이 날까 봐 <strong>미리 먹여두지는 마세요</strong>. 실제로 오르면 몸무게에 맞는 용량으로 주시고, 간격은 툴박스 해열제 도구가 세어드립니다." },
        { h: "💪 접종 부위가 붓고 빨개요",
          t: "흔한 반응입니다. 깨끗한 <strong>찬 수건</strong>을 잠깐 대주세요. 문지르거나 파스류를 붙이지 않습니다. 며칠 뒤 멍처럼 남는 것도 대개 괜찮아요." },
        { h: "🍼 잘 안 먹고 처져요",
          t: "하루 이틀은 보챌 수 있습니다. 자주 조금씩 먹이고 푹 재우세요. 이날은 목욕을 무리해서 시키지 않아도 됩니다." },
        { h: "📅 48시간이 지나 시작된 열이라면",
          t: "접종 반응은 보통 이틀 안에 끝납니다. <strong>사흘째부터 새로 오르는 열</strong>은 접종 탓이 아니라 다른 감염일 수 있어요. 접종했으니 그러려니 하고 넘기지 마세요." },
        { h: "🗓️ BCG와 MMR은 늦게 옵니다",
          t: "BCG는 접종 자리가 몇 주 뒤에 곪듯이 부풀고, MMR·수두는 <strong>1~2주 뒤에</strong> 열이나 발진이 오기도 합니다. 시기를 알고 있으면 덜 놀랍니다." }
      ],
      hospital: "<strong>3개월 미만이 접종 후 38도</strong>가 넘으면 바로 진료입니다. 숨차함·얼굴이나 입술 붓기·전신 두드러기는 <strong>즉시 119</strong>, 경련이나 세 시간 넘게 그치지 않는 날카로운 울음도 바로 병원으로 가세요."
    }

    ];

    /* ---------- 라이브러리 끝에 붙이기 ---------- */

    function mount() {
        var tab = document.getElementById("tab-info");
        if (!tab) return;

        var items = tab.querySelectorAll("details.lib-item");
        if (!items.length) return;                       // 아직 안 그려졌다

        if (tab.querySelector("[" + MARK + "]")) return; // 이미 붙였다

        var last = items[items.length - 1];
        var host = last.parentNode;
        if (!host) return;

        ARTICLES.forEach(function (a) {
            var el = build(a);
            host.insertBefore(el, last.nextSibling);
            last = el;
        });

        // 추천 카드가 새 글까지 보고 다시 고르게 한다
        if (typeof window.refreshInfoPick === "function") {
            setTimeout(window.refreshInfoPick, 60);
        }
    }

    window.refreshLibraryPlus = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 900);
        setTimeout(mount, 2200);
        setTimeout(mount, 4200);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.libraryDebug = function () {
        var tab = document.getElementById("tab-info");
        var all = tab ? tab.querySelectorAll("details.lib-item") : [];
        var mine = tab ? tab.querySelectorAll("[" + MARK + "]") : [];
        console.log("라이브러리 글 전체:", all.length + "편");
        console.log("이 파일이 붙인 글:", mine.length + "편 / " + ARTICLES.length + "편");
        ARTICLES.forEach(function (a) { console.log("   " + a.title); });
        if (mine.length !== ARTICLES.length) console.log("⚠️ 덜 붙었으면 refreshLibraryPlus() 를 쳐보세요");
    };
})();