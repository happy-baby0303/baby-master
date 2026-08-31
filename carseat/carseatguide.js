/* ============================================================
   배냇함 — 카시트 안전 (carseatguide.js)

   이 화면은 다른 큐레이터와 성격이 다르다.
   젖병은 잘못 고르면 아기가 안 먹는다. 카시트는 아기가 다친다.

   코드를 열어보니 제품 정보는 잘 모아뒀는데,
   정작 카시트 안전에서 제일 중요한 것 세 가지가 없었다.

     1. 언제까지 뒤를 보고 앉혀야 하는가
        — 회전형을 일곱 개나 파는데 '언제 돌리나' 가 없다.
          부모는 아기가 답답해 보이는 순간 돌린다.

     2. ADAC 점수는 낮을수록 좋다
        — 어디에도 안 적혀 있어서 2.1을 1.7보다 좋게 읽는다.

     3. 사고는 카시트를 잘못 골라서가 아니라 잘못 매서 커진다
        — 겨울 외투, 헐거운 하네스, 잘못된 각도.
          이건 어떤 제품을 사도 똑같이 위험하다.

   제품을 파는 것보다 이 셋이 먼저다.
   그래서 셋을 목록 위로 올린다.

   ⚠️ 여기 적힌 것은 일반적인 안전 지침이다.
      최종 기준은 늘 '내 카시트 설명서' 와 '내 차 설명서' 다.
      화면에도 그렇게 적었다.

   index.html 에서 app.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var BLUE = "#3182F6";
    var GRAY = "#8B95A1";
    var DARK = "#191F28";
    var RED  = "#E32636";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* 다크모드에서 연한 배경만 어두워지고 글씨는 그대로라 안 보였다.
       글씨 색을 변수로 빼서 다크일 때만 밝게 바꾼다. */
    (function darkVars() {
        if (document.getElementById("cg-vars")) return;
        var st = document.createElement("style");
        st.id = "cg-vars";
        st.textContent =
            ":root{--cg-blue:#1B64DA;--cg-gold:#8A6D00;--cg-red:#C62828;--cg-green:#1F6F52;}" +
            "body.dark-mode{--cg-blue:#7EB6FF;--cg-gold:#E8C766;--cg-red:#FF8A8A;--cg-green:#7FD8B0;}";
        (document.head || document.documentElement).appendChild(st);
    })();

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function monthsOld() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var p = String(s).split("-").map(Number);
        if (p.length !== 3) return null;
        var b = new Date(p[0], p[1] - 1, p[2]), t = new Date();
        var m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
        if (t.getDate() < b.getDate()) m--;
        return m < 0 ? 0 : m;
    }

    function setSel(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
    function run() { if (typeof window.runCarseatEngine === "function") window.runCarseatEngine(); }

    /* ==========================================================
       1. 뒤보기 — 이 화면에서 제일 중요한 칸
       ----------------------------------------------------------
       i-Size(UN R129)는 15개월 미만의 앞보기를 금지한다.
       그리고 15개월은 '돌려도 되는 때' 가 아니라 '최소한' 이다.
       뒤보기가 목과 척추를 지키는 폭이 훨씬 크다.
       ---------------------------------------------------------- */

    function facingCard() {
        var m = monthsOld();
        var name = esc(babyName());

        var head, body, tone;
        if (m === null) {
            head = "15개월 전에는 반드시 뒤를 보게";
            body = "생후 15개월 미만은 앞을 보게 앉히면 안 됩니다. 그리고 15개월은 <b>돌려도 되는 때가 아니라 최소한</b>이에요. " +
                   "가능하면 <b>24개월, 카시트가 허용하면 그 이상까지</b> 뒤보기로 두세요.";
            tone = "--cg-blue";
        } else if (m < 15) {
            head = name + "는 지금 " + m + "개월 — 반드시 뒤보기입니다";
            body = "생후 15개월 전에는 앞을 보게 앉히면 안 됩니다. 목뼈가 아직 머리 무게를 못 버텨서, " +
                   "정면 충돌 때 뒤보기가 아니면 목에 힘이 그대로 갑니다. <b>" + (15 - m) + "개월 더</b> 남았어요.";
            tone = "--cg-red";
        } else if (m < 24) {
            head = name + "는 지금 " + m + "개월 — 아직 두시는 게 낫습니다";
            body = "돌려도 되는 나이는 지났지만, <b>더 오래 뒤를 볼수록 안전합니다.</b> " +
                   "다리가 접히는 건 문제가 되지 않아요. 아이는 우리보다 훨씬 유연합니다. " +
                   "카시트가 허용하는 키·몸무게까지는 뒤보기로 두시길 권합니다.";
            tone = "--cg-gold";
        } else {
            head = name + "는 지금 " + m + "개월 — 돌리셔도 됩니다";
            body = "이제 앞보기로 바꾸셔도 괜찮습니다. 다만 카시트에 적힌 <b>키와 몸무게 한계</b>를 넘지 않았는지 확인하세요. " +
                   "나이보다 <b>체격이 기준</b>입니다.";
            tone = "--cg-green";
        }

        return '<div class="matrix-panel" style="margin-bottom:20px; border:2px solid var(' + tone + ');">' +
            '<div class="matrix-header" style="color:var(' + tone + ');">🔄 뒤보기 · 앞보기</div>' +
            '<div style="font-size:15.5px; font-weight:900; color:' + DARK + '; ' +
                'margin:-14px 0 10px; line-height:1.45; word-break:keep-all;">' + head + '</div>' +
            '<div style="font-size:13.5px; font-weight:600; color:#4E5968; ' +
                'line-height:1.75; word-break:keep-all;">' + body + '</div>' +
            '<div style="margin-top:14px; background:#F9FAFB; border:1px solid #E5E8EB; border-radius:12px; ' +
                'padding:14px 15px; font-size:12.5px; font-weight:600; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
                '카시트 안전에서 제일 크게 갈리는 게 이 하나입니다. 어떤 제품을 사느냐보다 ' +
                '<b>얼마나 오래 뒤를 보게 하느냐</b>가 더 많은 걸 좌우해요.</div>' +
        '</div>';
    }

    /* ==========================================================
       2. 태우기 전 3분 점검
       ----------------------------------------------------------
       사고 피해는 제품을 잘못 골라서보다 잘못 매서 커진다.
       특히 겨울 외투는 매년 같은 사고를 만든다.
       ---------------------------------------------------------- */

    var CHECK = [
        { icon: "🧥", t: "두꺼운 외투는 벗기고 태우세요",
          d: "패딩을 입은 채 하네스를 채우면, 충돌 순간 옷이 납작해지면서 <b>하네스가 그만큼 헐거워집니다.</b> " +
             "벗겨서 태우고 <b>담요를 위에 덮어</b> 주세요. 겨울마다 같은 사고가 납니다.",
          tone: "--cg-red" },
        { icon: "🤏", t: "하네스는 손가락으로 집히면 안 됩니다",
          d: "쇄골 부근에서 하네스 끈을 집어보세요. <b>손가락 사이에 접혀 잡히면 느슨한 겁니다.</b> " +
             "팽팽해서 집히지 않을 때까지 당기세요.",
          tone: "--cg-blue" },
        { icon: "📍", t: "가슴 클립은 겨드랑이 높이로",
          d: "배 쪽으로 내려와 있으면 충돌 때 어깨끈이 벗겨질 수 있습니다. <b>겨드랑이 높이</b>가 맞습니다.",
          tone: "--cg-blue" },
        { icon: "↕️", t: "어깨끈 높이는 방향에 따라 다릅니다",
          d: "<b>뒤보기는 어깨보다 아래</b>, <b>앞보기는 어깨 높이나 그 위</b>에서 나와야 합니다. " +
             "아이가 크면 이걸 다시 맞춰야 하는데, 대부분 그냥 씁니다.",
          tone: "--cg-blue" },
        { icon: "📐", t: "신생아는 각도가 생명입니다",
          d: "너무 세우면 고개가 앞으로 꺾이면서 <b>숨길이 눌립니다.</b> " +
             "카시트에 표시된 각도선이나 표시창을 꼭 맞추세요.",
          tone: "--cg-red" },
        { icon: "🪑", t: "흔들리면 다시 다세요",
          d: "카시트 바닥 쪽을 잡고 좌우로 흔들었을 때 <b>2~3cm 넘게 움직이면</b> 헐거운 겁니다. " +
             "ISOFIX는 딸깍 소리가 양쪽 다 나야 하고, 표시창이 초록이어야 합니다.",
          tone: "--cg-blue" }
    ];

    function checkCard() {
        var rows = CHECK.map(function (c) {
            return '<div style="padding:14px 0; border-bottom:1px solid #F2F4F6;">' +
                '<div style="font-size:14px; font-weight:900; color:var(' + c.tone + '); margin-bottom:6px;">' +
                    c.icon + ' ' + c.t + '</div>' +
                '<div style="font-size:13px; font-weight:600; color:#4E5968; line-height:1.75; ' +
                    'word-break:keep-all;">' + c.d + '</div>' +
            '</div>';
        }).join("");

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">📋 태우기 전 3분 점검</div>' +
            '<div style="font-size:13px; font-weight:600; color:' + GRAY + '; ' +
                'margin:-16px 0 6px; line-height:1.6; word-break:keep-all;">' +
                '사고 피해는 <b>어떤 카시트를 샀느냐</b>보다 <b>어떻게 맸느냐</b>로 더 크게 갈립니다</div>' +
            rows +
            '<div style="margin-top:14px; font-size:12px; font-weight:600; color:' + GRAY + '; ' +
                'line-height:1.7; word-break:keep-all;">' +
                '여기 적은 건 일반적인 지침이에요. 최종 기준은 늘 <b>내 카시트 설명서</b>와 <b>내 차 설명서</b>입니다.</div>' +
        '</div>';
    }

    /* ==========================================================
       3. ADAC 점수 읽는 법 — 이게 없어서 거꾸로 읽힌다
       ---------------------------------------------------------- */

    function adacCard() {
        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">📊 ADAC 점수, 낮을수록 좋습니다</div>' +
            '<div style="font-size:13px; font-weight:600; color:#4E5968; ' +
                'margin:-16px 0 16px; line-height:1.7; word-break:keep-all;">' +
                '독일 자동차협회(ADAC)가 실제로 충돌시켜 매기는 점수예요. ' +
                '<b>학점처럼 1점대가 제일 좋고 5점대가 제일 나쁩니다.</b> ' +
                '2.1보다 1.7이 더 좋은 겁니다.</div>' +

            '<div style="display:flex; gap:4px; margin-bottom:10px;">' +
                ['0.5~1.5|매우 좋음|#1F9D6B','1.6~2.5|좋음|#3182F6','2.6~3.5|보통|#E0A72E',
                 '3.6~4.5|미흡|#E07B39','4.6~5.5|위험|#E32636'].map(function (s) {
                    var p = s.split("|");
                    return '<div style="flex:1; text-align:center; padding:9px 2px; border-radius:9px; ' +
                        'background:' + p[2] + '18; border:1px solid ' + p[2] + '44;">' +
                        '<div style="font-size:10.5px; font-weight:900; color:' + p[2] + ';">' + p[0] + '</div>' +
                        '<div style="font-size:10px; font-weight:700; color:#4E5968; margin-top:2px;">' + p[1] + '</div>' +
                    '</div>';
                 }).join("") +
            '</div>' +

            '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:12px; padding:14px 15px; ' +
                'font-size:12.5px; font-weight:600; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
                '<b>미참여</b>라고 적힌 제품은 ADAC 시험을 안 받았다는 뜻일 뿐, 나쁘다는 뜻이 아닙니다. ' +
                '국내 브랜드는 대부분 참여하지 않아요. 대신 <b>KC 인증</b>과 <b>i-Size(UN R129)</b> 표시를 보세요.</div>' +
        '</div>';
    }

    /* ==========================================================
       4. 상황으로 묻기 — 스펙 네 개를 초보는 못 고른다
       ---------------------------------------------------------- */

    var CASES = [
        { id: "birth", icon: "🤰", label: "출산 전이에요",
          set: { "filter-age": "newborn" },
          tip: "퇴원할 때 <b>아기를 안고 타면 안 됩니다.</b> 그래서 카시트는 출산 전에 사서 <b>차에 미리 달아두는</b> 물건이에요. " +
               "가서 사면 늦습니다. 신생아는 각도를 맞춰야 해서 다는 데 시간이 걸리기도 하고요." },

        { id: "turn", icon: "🔄", label: "이제 돌려도 되나요",
          set: {},
          tip: "위의 <b>뒤보기·앞보기</b> 칸을 봐주세요. 나이보다 <b>카시트에 적힌 키·몸무게 한계</b>가 기준입니다. " +
               "다리가 접히는 건 돌릴 이유가 안 됩니다." },

        { id: "carnival", icon: "🚐", label: "카니발·3열에 달아요",
          set: { "filter-car": "carnival", "filter-install": "isofix_tether" },
          tip: "바닥에 수납함이 있는 차는 <b>기둥(레그)형을 쓰면 뚜껑이 부서질 수 있습니다.</b> " +
               "끈으로 묶는 <b>탑테더</b> 방식을 쓰세요. 차 설명서에 탑테더 고리 위치가 나와 있습니다." },

        { id: "old", icon: "💺", label: "구형차라 ISOFIX가 없어요",
          set: { "filter-install": "belt" },
          tip: "안전벨트로 고정하는 제품을 고르세요. 다만 <b>벨트 고정은 잘못 매기 쉽습니다.</b> " +
               "설명서의 벨트 경로를 그대로 따라가고, 다 매고 나서 흔들어 확인하세요." },

        { id: "small", icon: "🚗", label: "차가 작아요",
          set: { "filter-car": "compact" },
          tip: "뒤보기 카시트는 앞좌석을 많이 먹습니다. <b>그렇다고 앞보기로 일찍 돌리지는 마세요.</b> " +
               "앞좌석을 조금 당겨 앉는 편이 낫고, 바닥이 얇은 제품을 고르면 도움이 됩니다." },

        { id: "second", icon: "👵", label: "할머니 차에도 필요해요",
          set: {},
          tip: "가끔 타는 차라도 카시트는 있어야 합니다. 매번 옮겨 달면 <b>오장착 위험이 커져요.</b> " +
               "자주 쓰실 거면 두 번째 카시트를 두는 편이 안전합니다." }
    ];

    var picked = null;

    window.pickCarseatCase = function (id) {
        var c = null;
        for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) c = CASES[i];
        if (!c) return;

        if (picked === id) { picked = null; paint(); return; }

        if (Object.keys(c.set).length) {
            if (typeof window.resetFilters === "function") window.resetFilters();
            if (typeof window.applyGlobalBabyProfile === "function") {
                try { window.applyGlobalBabyProfile(); } catch (e) {}
            }
            Object.keys(c.set).forEach(function (k) { setSel(k, c.set[k]); });
        }

        picked = id;
        paint();
        if (Object.keys(c.set).length) {
            run();
            var r = document.getElementById("carseat-result-area");
            if (r) setTimeout(function () {
                try { r.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
            }, 150);
        }
    };

    function casesHTML() {
        var chips = CASES.map(function (c) {
            var on = (picked === c.id);
            return '<div onclick="window.pickCarseatCase(\'' + c.id + '\')" ' +
                'style="padding:14px 10px; border-radius:14px; cursor:pointer; text-align:center; ' +
                'font-size:12.5px; font-weight:800; line-height:1.4; word-break:keep-all; ' +
                (on ? 'background:' + BLUE + '; color:#FFFFFF; border:1px solid ' + BLUE + ';'
                    : 'background:#F9FAFB; color:#4E5968; border:1px solid #E5E8EB;') + '">' +
                '<div style="font-size:19px; margin-bottom:5px;">' + c.icon + '</div>' + esc(c.label) + '</div>';
        }).join("");

        var tip = "";
        for (var i = 0; i < CASES.length; i++) {
            if (CASES[i].id === picked) {
                tip = '<div style="margin-top:14px; background:#E8F3FF; border:1px solid #C9E2FF; ' +
                      'border-radius:14px; padding:15px 16px; font-size:13.5px; font-weight:600; ' +
                      'color:var(--cg-blue); line-height:1.75; word-break:keep-all;">' +
                      CASES[i].icon + ' ' + CASES[i].tip + '</div>';
            }
        }

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">🙋 어떤 상황이신가요?</div>' +
            '<div style="font-size:13px; font-weight:600; color:' + GRAY + '; ' +
                'margin:-16px 0 18px; line-height:1.6; word-break:keep-all;">' +
                '장착 방식이나 인증 이름은 저희가 볼게요. 지금 상황만 눌러주세요</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:9px;">' + chips + '</div>' +
            tip +
        '</div>';
    }

    /* ==========================================================
       5. 중고 · 유효기간 — 당근에서 사기 전에
       ---------------------------------------------------------- */

    function usedCard() {
        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">🥕 중고로 사기 전에</div>' +
            '<div style="background:#FFF2F2; border:1px solid #FCA5A5; border-radius:14px; ' +
                'padding:15px 16px; margin:-10px 0 12px; font-size:13.5px; font-weight:700; ' +
                'color:var(--cg-red); line-height:1.75; word-break:keep-all;">' +
                '<b>사고 이력이 있는 카시트는 겉이 멀쩡해도 쓰면 안 됩니다.</b> ' +
                '충격을 흡수하면서 안쪽 구조가 이미 한 번 망가졌을 수 있어요. 눈으로는 구분이 안 됩니다.</div>' +

            '<div style="font-size:13px; font-weight:600; color:#4E5968; line-height:1.8; word-break:keep-all;">' +
                '· 플라스틱은 <b>햇빛과 온도차로 삭습니다.</b> 제조사가 정한 사용 기한(보통 <b>제조일로부터 6~10년</b>)이 있어요. ' +
                '카시트 아래나 옆에 제조일이 찍혀 있습니다.<br><br>' +
                '· 설명서와 <b>부품이 다 있는지</b> 보세요. 이너시트나 클립 하나가 없으면 그 자리를 대신할 게 없습니다.<br><br>' +
                '· 판매자가 사고 여부를 모른다고 하면 <b>사지 않는 게 맞습니다.</b> ' +
                '아낀 돈보다 잃는 게 큽니다.' +
            '</div>' +
        '</div>';
    }

    /* ==========================================================
       6. 아직 이른 카시트에 표시 달기
       ----------------------------------------------------------
       필터의 '토들러/회전형' 은 신생아~5세라고 적혀 있는데,
       거기 묶인 제품 중에는 9개월·12개월·15개월부터인 것이 섞여 있다.
       3개월 아기 부모가 그 필터를 고르면 15개월용이 100점으로 나온다.

       bodySpec 에 "15개월~" 처럼 적혀 있으니 그걸 읽어서,
       지금 아기에게 아직 이른 제품에는 카드 위에 줄을 하나 붙인다.
       목록에서 지우지는 않는다 — 미리 사두는 분도 있어서다.
       ---------------------------------------------------------- */

    function minMonthsOf(item) {
        var m = String(item && item.bodySpec || "").match(/(\d+)\s*개월/);
        return m ? Number(m[1]) : null;
    }

    function markTooEarly() {
        var m = monthsOld();
        if (m === null) return;

        var list = [];
        try { if (typeof carseatData !== "undefined" && carseatData) list = carseatData; } catch (e) {}
        list = list || window.carseatData || [];

        list.forEach(function (item) {
            var need = minMonthsOf(item);
            var card = document.getElementById("card-" + item.id);
            if (!card) return;

            var old = card.querySelector(".cg-early");
            if (old) old.parentNode.removeChild(old);
            if (need === null || m >= need) return;

            var d = document.createElement("div");
            d.className = "cg-early";
            d.style.cssText =
                "background:#FFF2F2; border:1px solid #FCA5A5; border-radius:12px; " +
                "padding:13px 15px; margin-bottom:16px; font-size:13px; font-weight:700; " +
                "color:var(--cg-red); line-height:1.7; word-break:keep-all;";
            d.innerHTML = "⚠️ 이 제품은 <b>" + need + "개월부터</b>예요. " +
                          esc(babyName()) + "는 지금 " + m + "개월이라 아직 이릅니다. " +
                          "미리 사두시는 거라면 괜찮지만, <b>지금 태우면 안 됩니다.</b>";
            card.insertBefore(d, card.firstChild);
        });
    }

    /* ---------- 자리 잡기 ----------
       index.html 은 한 줄도 안 고친다.
       필터 패널 앞에 다섯 칸을 끼우고, 기존 필터는 접어둔다. -------- */

    var HOST = "carseat-guide";

    function paint() {
        var host = document.getElementById(HOST);
        if (!host) return;
        host.innerHTML = facingCard() + casesHTML() + checkCard() + adacCard() + usedCard();
    }

    function mount() {
        if (document.getElementById(HOST)) return;

        var panel = document.querySelector(".matrix-panel");
        if (!panel || !panel.parentNode) return;

        var box = document.createElement("div");
        box.id = HOST;
        panel.parentNode.insertBefore(box, panel);

        // 기존 조건 네 개는 '직접 고를 분' 용으로 접어둔다
        var head = panel.querySelector(".matrix-header");
        if (head && !head.getAttribute("data-folded")) {
            head.setAttribute("data-folded", "1");
            head.style.cursor = "pointer";
            head.innerHTML = '🔍 직접 조건 고르기 <span id="cg-fold" style="margin-left:auto; ' +
                             'font-size:13px; font-weight:800; color:' + GRAY + ';">펼치기 ▾</span>';
            var grid = panel.querySelector(".matrix-grid");
            if (grid) {
                grid.style.display = "none";
                head.onclick = function () {
                    var on = (grid.style.display === "none");
                    grid.style.display = on ? "grid" : "none";
                    var mk = document.getElementById("cg-fold");
                    if (mk) mk.textContent = on ? "접기 ▴" : "펼치기 ▾";
                };
            }
        }

        paint();
    }

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 200);
        setTimeout(mount, 900);
        setTimeout(markTooEarly, 1200);

        // 결과가 다시 그려질 때마다 표시도 다시 붙인다
        ["runCarseatEngine", "renderFavorites", "toggleCarseatOthers"].forEach(function (n) {
            var orig = window[n];
            if (typeof orig !== "function" || orig.__cg) return;
            var w = function () {
                var out = orig.apply(this, arguments);
                setTimeout(markTooEarly, 60);
                return out;
            };
            w.__cg = true;
            window[n] = w;
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.carseatGuideDebug = function () {
        var m = monthsOld();
        console.log("개월수:", m === null ? "생년월일 없음" : m + "개월");
        console.log("뒤보기 안내:", m === null ? "일반 안내"
            : m < 15 ? "🔴 반드시 뒤보기 (" + (15 - m) + "개월 남음)"
            : m < 24 ? "🟡 더 두는 게 나음"
            : "🟢 돌려도 됨 (키·몸무게 확인)");
        console.log("고른 상황:", picked || "없음");
        console.log("붙었나:", !!document.getElementById(HOST));
        var list = [];
        try { if (typeof carseatData !== "undefined") list = carseatData; } catch (e) {}
        console.log("─ 최소 개월수가 적힌 제품 ─");
        (list || []).forEach(function (it) {
            var need = minMonthsOf(it);
            if (need === null) return;
            console.log("   " + it.name + " : " + need + "개월부터" +
                (m !== null && m < need ? "  ⚠️ 지금은 이름" : "  ✅"));
        });
    };
})();