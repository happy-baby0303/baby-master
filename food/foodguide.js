/* ============================================================
   배냇함 — 이유식 (foodguide.js) v2

   v1 은 실패했다. 이유가 둘이다.

     1. 계산기를 하나 더 만들었다.
        기존 계량 계산기가 바로 밑에 그대로 있는데 위에 또 얹었으니
        쉬워진 게 아니라 고를 게 하나 더 늘었다.

     2. 단위만 바꾸고 일을 줄이지 못했다.
        "물 밥숟가락 11술" 은 6g 재는 것만큼 귀찮다.
        11번 뜨느니 저울을 쓴다.

   그래서 다시 짰다. 외울 게 하나여야 한다.

        쌀가루 1술  :  물 종이컵 1컵

   이게 거의 정확히 10배죽이다. 두 배 하려면 둘 다 두 배.
   그게 전부다. 계산기가 필요 없어진다.

   그리고 나머지는 다 접어둔다.
   만들기 전에 읽을 게 네 칸이면 그건 도와주는 게 아니다.

   index.html 에서 app.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var BLUE = "#3182F6";
    var GRAY = "#8B95A1";
    var DARK = "#191F28";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    (function darkVars() {
        if (document.getElementById("fg-vars")) return;
        var st = document.createElement("style");
        st.id = "fg-vars";
        st.textContent =
            ":root{--fg-blue:#1B64DA;--fg-gold:#8A6D00;--fg-red:#C62828;--fg-green:#1F6F52;}" +
            "body.dark-mode{--fg-blue:#7EB6FF;--fg-gold:#E8C766;--fg-red:#FF8A8A;--fg-green:#7FD8B0;}";
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

    function stageNow() {
        var el = document.getElementById("food-age");
        if (el && el.value && el.value !== "all") return el.value;
        var m = monthsOld();
        if (m === null) return "early";
        if (m < 7) return "early";
        if (m < 9) return "mid";
        if (m < 12) return "late";
        return "done";
    }

    function mealSize() {
        var s = stageNow();
        return s === "mid" ? 100 : s === "late" ? 150 : s === "done" ? 200 : 60;
    }

    /* ==========================================================
       1. 외울 것은 하나뿐
       ----------------------------------------------------------
       쌀가루 한 큰술은 대략 8g, 종이컵 한 컵은 180ml.
       10배죽은 쌀가루 무게의 스무 배쯤 되는 물이니 8 × 20 = 160ml.
       종이컵 한 컵과 거의 같다. 그래서 1술 : 1컵 이 성립한다.

       숫자를 맞추라고 하지 않는다. 마지막 판단은 농도다.
       ---------------------------------------------------------- */

    /* 🔑 이 화면의 핵심
       ────────────────────────────────────────────
       숟가락 크기는 집집마다 다르다.
         계량 큰술 15ml → 쌀가루 약 9g
         집 밥숟가락 12ml → 쌀가루 약 7g
       그래서 "1술 : 종이컵 1컵" 같은 공식은 흔들린다.

       흔들리지 않는 건 부피비 하나다.
         쌀가루 1 : 물 12   (같은 도구로 재면)
       쌀가루 밀도가 물의 약 0.6배라, 무게 1:20 이 부피로는 1:12 가 된다.
       숟가락이 크든 작든 같은 숟가락을 쓰면 비율은 그대로다.

       다만 물을 12번 뜨는 건 일이라, 물은 눈금으로 재게 한다.
       그리고 도구는 고르게 한다 — 종이컵을 안 쓰는 집이 더 많다.
       ──────────────────────────────────────────── */

    var VOL_RATIO = 12;            // 같은 도구 기준 쌀가루 1 : 물 12
    var SPOON_ML  = 13;            // 밥숟가락 평균 (계량 15 · 집숟가락 12 사이)
    var FLOUR_D   = 0.6;           // 쌀가루 밀도 (물 대비)

    var TOOLS = [
        { id: "bottle", icon: "🍼", name: "젖병",     unit: "ml",
          tip: "눈금이 있고 이미 소독돼 있어서 제일 편해요" },
        { id: "cup",    icon: "🥛", name: "계량컵",   unit: "ml",
          tip: "눈금대로 부으시면 됩니다" },
        { id: "spoon",  icon: "🥄", name: "같은 숟가락", unit: "술",
          tip: "가루 뜬 그 숟가락으로 물도 재세요" },
        { id: "scale",  icon: "⚖️", name: "저울",     unit: "g",
          tip: "물 1ml = 1g 이라 눈금 그대로예요" }
    ];

    var TOOL_KEY = "tosil_food_tool";
    function toolNow() {
        var v = localStorage.getItem(TOOL_KEY);
        for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === v) return TOOLS[i];
        return TOOLS[0];
    }
    window.setFoodTool = function (id) {
        try { localStorage.setItem(TOOL_KEY, id); } catch (e) {}
        paint();
    };

    function batch(n) {
        var ml = n * SPOON_ML * VOL_RATIO;              // 물의 양
        var g = Math.round(n * SPOON_ML * FLOUR_D);     // 쌀가루 무게
        var y = Math.round((g + ml) * 0.8);             // 끓이면서 줄어드는 몫
        return { g: g, ml: ml, y: y, meals: Math.max(1, Math.round(y / mealSize())) };
    }

    // 도구에 맞춰 물의 양을 말로 바꾼다
    function waterText(n) {
        var t = toolNow(), ml = batch(n).ml;
        if (t.id === "spoon") return (n * VOL_RATIO) + "술";
        if (t.id === "scale") return ml + "g";
        return ml + "ml";
    }

    function formulaCard() {
        var t = toolNow();

        var tools = TOOLS.map(function (x) {
            var on = (x.id === t.id);
            return '<div onclick="window.setFoodTool(\'' + x.id + '\')" ' +
                'style="flex:1; text-align:center; padding:12px 4px; border-radius:12px; cursor:pointer; ' +
                'font-size:12px; font-weight:800; line-height:1.35; ' +
                (on ? 'background:' + DARK + '; color:#FFFFFF;' : 'background:#F2F4F6; color:#4E5968;') + '">' +
                '<div style="font-size:18px; margin-bottom:4px;">' + x.icon + '</div>' + esc(x.name) + '</div>';
        }).join("");

        var rows = [1, 2, 3].map(function (n) {
            var b = batch(n);
            return '<div style="flex:1; text-align:center; padding:13px 6px; border-radius:12px; ' +
                'background:#F9FAFB; border:1px solid #E5E8EB;">' +
                '<div style="font-size:13.5px; font-weight:900; color:' + DARK + ';">' +
                    n + '술 : ' + esc(waterText(n)) + '</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:' + GRAY + '; margin-top:4px;">' +
                    '약 ' + b.y + 'g · ' + b.meals + '끼</div>' +
            '</div>';
        }).join("");

        return '<div class="matrix-panel" style="margin-bottom:16px;">' +

            '<div style="text-align:center; padding:6px 0 16px;">' +
                '<div style="font-size:12px; font-weight:800; color:' + GRAY + '; letter-spacing:0.5px; margin-bottom:10px;">' +
                    '초기 미음, 이것만 외우세요</div>' +
                '<div style="font-size:21px; font-weight:900; color:' + BLUE + '; letter-spacing:-0.8px;">' +
                    '쌀가루 1술 : 물 ' + esc(waterText(1)) + '</div>' +
                '<div style="font-size:12px; font-weight:700; color:' + GRAY + '; margin-top:7px;">' +
                    '가루는 밥숟가락으로, 물은 눈금으로 재는 게 편해요</div>' +
            '</div>' +

            '<div style="font-size:12.5px; font-weight:800; color:#4E5968; margin-bottom:7px;">물은 뭘로 재세요?</div>' +
            '<div style="display:flex; gap:6px; margin-bottom:8px;">' + tools + '</div>' +
            '<div style="font-size:11.5px; font-weight:700; color:var(--fg-blue); margin-bottom:16px;">' +
                t.icon + ' ' + esc(t.tip) + '</div>' +

            '<div style="display:flex; gap:7px; margin-bottom:14px;">' + rows + '</div>' +

            '<div style="background:#E8F3FF; border:1px solid #C9E2FF; border-radius:13px; ' +
                'padding:14px 15px; font-size:13px; font-weight:700; color:var(--fg-blue); ' +
                'line-height:1.75; word-break:keep-all;">' +
                '⚖️ <b>정확히 안 맞아도 됩니다.</b> 다 끓이고 숟가락으로 떠서 ' +
                '<b>주르륵 흐르면</b> 초기 미음이 맞아요. 되직하면 물을 조금 더, ' +
                '너무 묽으면 1~2분 더 끓이면 됩니다.</div>' +

            '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:13px; ' +
                'padding:14px 15px; margin-top:10px; font-size:12.5px; font-weight:700; ' +
                'color:#4E5968; line-height:1.75; word-break:keep-all;">' +
                '💡 <b>숟가락이 크든 작든 상관없어요.</b> 집집마다 숟가락이 다르니까 ' +
                '<b>같은 숟가락으로 가루 1 : 물 12</b> — 이 비율만 지키면 10배죽입니다. ' +
                '물을 열두 번 뜨기 번거로우면 위에서 젖병이나 계량컵을 고르세요.</div>' +

            '<div style="font-size:12px; font-weight:700; color:' + GRAY + '; ' +
                'margin-top:11px; line-height:1.7; word-break:keep-all;">' +
                '중기부터는 물을 조금씩 줄이세요. <b>8배죽은 이 물의 8할, 6배죽은 6할</b>쯤이에요. ' +
                '그때쯤이면 눈대중이 이미 생기셨을 겁니다.</div>' +
        '</div>';
    }

    /* ==========================================================
       2. 지금 상태만 짧게 — 기록이 있을 때만 뜬다
       ---------------------------------------------------------- */

    function tests() {
        var db = {};
        try { db = JSON.parse(localStorage.getItem("tosil_food_calendar")) || {}; } catch (e) {}
        var out = [];
        Object.keys(db).forEach(function (day) {
            (db[day] || []).forEach(function (r) {
                if (r && r.type === "test" && r.ingredient) {
                    out.push({ day: day, name: String(r.ingredient).trim(), status: r.status || "pass" });
                }
            });
        });
        out.sort(function (a, b) { return a.day < b.day ? 1 : -1; });
        return out;
    }

    function daysSince(dayStr) {
        var p = String(dayStr).split("-").map(Number);
        if (p.length !== 3) return null;
        var d = new Date(p[0], p[1] - 1, p[2]); d.setHours(0, 0, 0, 0);
        var t = new Date(); t.setHours(0, 0, 0, 0);
        return Math.floor((t - d) / 86400000);
    }

    function statusLine() {
        var list = tests();
        if (!list.length) return "";
        var last = list[0];
        var d = daysSince(last.day);
        if (d === null) return "";

        var bg, bd, col, txt;
        if (last.status === "fail") {
            bg = "#FFF2F2"; bd = "#FCA5A5"; col = "var(--fg-red)";
            txt = "⚠️ <b>" + esc(last.name) + "</b> 에서 이상이 있었어요 · 다음 진료 때 꼭 말씀하세요";
        } else if (d < 3) {
            bg = "#FFF9E6"; bd = "#FDE68A"; col = "var(--fg-gold)";
            txt = "⏳ <b>" + esc(last.name) + "</b> " + (d + 1) + "일째 · <b>" + (3 - d) + "일 더</b> 지켜본 뒤 새 재료를 주세요";
        } else {
            bg = "#EAF7F1"; bd = "#A7DFC8"; col = "var(--fg-green)";
            txt = "✅ <b>" + esc(last.name) + "</b> 통과 · 새 재료를 시작하셔도 돼요";
        }

        return '<div style="background:' + bg + '; border:1px solid ' + bd + '; border-radius:13px; ' +
            'padding:14px 15px; margin-bottom:16px; font-size:13px; font-weight:700; ' +
            'color:' + col + '; line-height:1.7; word-break:keep-all;">' + txt + '</div>';
    }

    /* ==========================================================
       3. 나머지는 접어둔다
       ----------------------------------------------------------
       만들기 전에 읽을 게 네 칸이면 그건 도와주는 게 아니다.
       필요할 때만 펼쳐지게 한다.
       ---------------------------------------------------------- */

    var BASICS = [
        ["1", "재료 손질", "소고기는 <b>찬물에 20분</b>만. 더 담그면 철분까지 빠집니다. 채소는 질긴 줄기·씨·껍질을 도려내고 이파리나 과육만 쓰세요."],
        ["2", "익혀서 곱게 갈기", "고기는 푹 삶고 <b>삶은 물은 버리지 마세요.</b> 그게 육수입니다. 채소는 1분 데치거나 찝니다."],
        ["3", "⭐ 찬물에 가루를 먼저", "여기가 제일 많이 실패해요. <b>뜨거운 물에 쌀가루를 넣으면 수제비처럼 떡집니다.</b> 다 식은 물에 넣고 덩어리 없이 풀어주세요."],
        ["4", "센 불 → 끓으면 약불 5~7분", "파르르 끓어오르면 <b>곧바로 제일 약한 불</b>로. 주걱으로 바닥을 긁듯이 계속 저어주세요."],
        ["5", "고운 체에 거르기", "초기에는 <b>필수</b>예요. 곱게 갈아도 목에 걸리는 조각이 남습니다."],
        ["6", "식혀서 소분", "<b>완전히 식힌 뒤</b> 담으세요. 뜨거울 때 닫으면 물이 맺혀 상합니다. 냉장 <b>2일</b> · 냉동 <b>2주</b>."]
    ];

    function basicsBody() {
        return BASICS.map(function (s) {
            return '<div style="display:flex; gap:11px; padding:13px 0; border-bottom:1px solid #F2F4F6;">' +
                '<div style="width:24px; height:24px; flex-shrink:0; border-radius:50%; ' +
                    'background:' + (s[0] === "3" ? "var(--fg-gold)" : BLUE) + '; color:#FFFFFF; ' +
                    'display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900;">' +
                    s[0] + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:13.5px; font-weight:900; color:' + DARK + '; margin-bottom:4px;">' + s[1] + '</div>' +
                    '<div style="font-size:12.5px; font-weight:600; color:#4E5968; line-height:1.7; word-break:keep-all;">' + s[2] + '</div>' +
                '</div>' +
            '</div>';
        }).join("");
    }

    function signBody() {
        return '<div style="background:#FFF2F2; border:1px solid #FCA5A5; border-radius:12px; padding:14px; margin-bottom:9px;">' +
            '<div style="font-size:13.5px; font-weight:900; color:var(--fg-red); margin-bottom:6px;">두 가지가 같이 오면 바로 119</div>' +
            '<div style="font-size:12.5px; font-weight:700; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
            '전신 두드러기 · 쌕쌕거림 · 입술이나 눈두덩 붓기 · 반복 구토 · 축 처짐<br>' +
            '먹던 것을 <b>즉시 멈추고</b> 눕히세요. 숨이 차 보이면 앉히고, 토할 것 같으면 옆으로. ' +
            '<b>좋아 보여도 병원에 가야 합니다</b> — 몇 시간 뒤 다시 심해지기도 해요.</div></div>' +

        '<div style="background:#FFF9E6; border:1px solid #FDE68A; border-radius:12px; padding:14px; margin-bottom:9px;">' +
            '<div style="font-size:13.5px; font-weight:900; color:var(--fg-gold); margin-bottom:6px;">그 재료를 빼고 진료</div>' +
            '<div style="font-size:12.5px; font-weight:700; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
            '두드러기 · 평소와 다른 설사 · 피 섞인 변 · 먹고 나서 심하게 보챔</div></div>' +

        '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:12px; padding:14px;">' +
            '<div style="font-size:13.5px; font-weight:900; color:#4E5968; margin-bottom:6px;">이건 알레르기가 아닐 수 있어요</div>' +
            '<div style="font-size:12.5px; font-weight:600; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
            '<b>입 주변만</b> 빨개지는 건 산이 닿아서인 경우가 많아요(토마토·딸기·귤). 먹인 뒤 닦아주면 덜합니다.<br>' +
            '변에 <b>재료가 그대로</b> 보이는 것도 흔해요. 아직 소화가 덜 되는 것뿐입니다.<br>' +
            '애매하면 <b>119에 전화해서 물어보셔도 됩니다.</b> 무료고 24시간 해요.</div></div>' +

        '<div style="font-size:11.5px; font-weight:600; color:' + GRAY + '; margin-top:10px; line-height:1.7;">' +
            '진단은 의사가 합니다. 가족 중에 알레르기가 있으면 <b>시작 전에</b> 소아과와 먼저 상의하세요.</div>';
    }

    var open = { basics: false, sign: false };

    window.toggleFoodFold = function (k) { open[k] = !open[k]; paint(); };

    function fold(k, icon, title, sub, body) {
        return '<div class="matrix-panel" style="margin-bottom:12px; padding:18px 20px;">' +
            '<div onclick="window.toggleFoodFold(\'' + k + '\')" ' +
                'style="display:flex; align-items:center; gap:11px; cursor:pointer;">' +
                '<div style="font-size:19px;">' + icon + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:14.5px; font-weight:900; color:' + DARK + ';">' + esc(title) + '</div>' +
                    '<div style="font-size:11.5px; font-weight:700; color:' + GRAY + '; margin-top:2px;">' + esc(sub) + '</div>' +
                '</div>' +
                '<div style="font-size:13px; font-weight:800; color:' + GRAY + ';">' +
                    (open[k] ? "접기 ▴" : "펼치기 ▾") + '</div>' +
            '</div>' +
            (open[k] ? '<div style="margin-top:14px;">' + body + '</div>' : '') +
        '</div>';
    }

    /* ---------- 자리 잡기 ----------
       ⚠️ v1 의 잘못: 계산기를 하나 더 만들어놓고 기존 것을 그대로 뒀다.
          같은 일을 하는 게 둘이면 쉬워진 게 아니라 고를 게 늘어난 것이다.
          기존 계량 계산기는 접어서 '저울 쓰실 분' 용으로 내린다. -------- */

    var HOST = "food-guide";

    function paint() {
        var host = document.getElementById(HOST);
        if (!host) return;
        host.innerHTML =
            statusLine() +
            formulaCard() +
            fold("basics", "📖", "미음 만들기 기본", "여섯 단계면 초기 레시피가 다 같아져요", basicsBody()) +
            fold("sign",   "🚨", "알레르기 이상 신호", "언제 병원에 가야 하는지", signBody());
    }

    function calcBlock() {
        var el = document.getElementById("food-calc-body");
        if (!el) return null;
        var p = el;
        for (var i = 0; i < 5 && p && p.parentNode; i++) {
            if (p.parentNode.classList && p.parentNode.classList.contains("container")) return p;
            p = p.parentNode;
        }
        return null;
    }

    function foldOldCalc() {
        var body = document.getElementById("food-calc-body");
        if (!body || body.getAttribute("data-fg")) return;
        body.setAttribute("data-fg", "1");

        // 기존 계산기는 원래도 접혀서 시작한다. 접힌 상태만 확인하고 끝.
        //
        // ⚠️ v2 에서 헤더 글씨를 바꾸려다 사고가 났다.
        //    querySelector("div div div") 가 제목이 아니라 40px 짜리 💧 아이콘 칸을
        //    잡아서, 거기에 긴 글이 들어가며 글자가 뒤집힌 것처럼 보였다.
        //    남의 화면 구조를 짐작해서 글씨를 갈아끼우면 이렇게 된다.
        //    헤더는 이미 "몇 g 넣으면 몇 g 나오는지, 저울 하나로 끝" 이라
        //    설명이 충분하다. 손대지 않는다.
        body.style.display = "none";
    }

    function mount() {
        if (document.getElementById(HOST)) return;
        var a = calcBlock();
        if (!a || !a.parentNode) return;

        var box = document.createElement("div");
        box.id = HOST;
        a.parentNode.insertBefore(box, a);

        foldOldCalc();
        paint();
    }

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 200);
        setTimeout(mount, 900);

        ["saveTestRecord", "saveMealRecord", "deleteFoodRecord"].forEach(function (n) {
            var orig = window[n];
            if (typeof orig !== "function" || orig.__fg) return;
            var w = function () { var o = orig.apply(this, arguments); setTimeout(paint, 80); return o; };
            w.__fg = true;
            window[n] = w;
        });

        var sel = document.getElementById("food-age");
        if (sel) sel.addEventListener("change", function () { setTimeout(paint, 40); });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.foodGuideDebug = function () {
        console.log("개월수:", monthsOld() === null ? "생년월일 없음" : monthsOld() + "개월", "· 단계:", stageNow());
        console.log("한 끼 기준:", mealSize() + "g");
        [1,2,3].forEach(function (n) {
            var b = batch(n);
            console.log("   " + n + "술 : " + n + "컵  →  약 " + b.y + "g · " + b.meals + "끼");
        });
        var t = tests();
        console.log("재료 테스트 기록:", t.length + "건");
        if (t[0]) console.log("   최근:", t[0].name, t[0].day, (daysSince(t[0].day) + 1) + "일째",
                              t[0].status === "fail" ? "⚠️ 이상" : "✅ 통과");
        console.log("기존 계산기 접힘:", !!(document.getElementById("food-calc-body") &&
            document.getElementById("food-calc-body").getAttribute("data-fg")));
        console.log("붙었나:", !!document.getElementById(HOST));
    };
})();