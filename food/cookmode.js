/* ============================================================
   배냇함 — 요리 모드 다시 (cookmode.js)

   지금 요리 모드는 단계를 다 펼쳐놓는다.
   화면에 다섯 줄이 나란히 있고, 다 한 뒤에 눌러서 지우는 방식이다.

   그런데 요리 중에 폰은 조리대 저 끝에 있다.
   손에는 반죽이나 물이 묻어 있고, 눈은 냄비에 가 있다.
   그 상태에서 다섯 줄 중 '내가 어디였더라' 를 찾는 게 일이다.

   그래서 한 번에 한 단계만 크게 보여준다.
     · 글씨를 키운다
     · 지금 단계에 타이머가 있으면 버튼 하나만 크게
     · 다음으로 넘기는 건 화면 절반짜리 버튼

   기존 타이머와 화면 꺼짐 방지는 그대로 쓴다.
   app.js 는 한 줄도 안 고친다. openCookingMode 를 감싸기만 한다.

   index.html 에서 app.js (또는 foodguide.js) 다음에 로드하세요.
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

    var steps = [], at = 0;

    function clean(t) {
        // "1. " 같은 번호와 대괄호 꼬리표를 떼어낸다
        var s = String(t || "").trim();
        s = s.replace(/^\s*\d+\s*[.)]\s*/, "");
        return s;
    }

    function minsOf(t) {
        var m = String(t || "").match(/(\d+)\s*분/);
        return m ? parseInt(m[1], 10) : null;
    }

    function tag(t) {
        var m = String(t || "").match(/\[([^\]]{1,10})\]|\((안전|필수)\)/);
        return m ? (m[1] || m[2]) : "";
    }

    window.cookGo = function (d) {
        var n = at + d;
        if (n < 0 || n >= steps.length) return;
        at = n;
        paint();
    };

    window.cookJump = function (i) { at = i; paint(); };

    function paint() {
        var box = document.getElementById("cook-steps-container");
        if (!box || !steps.length) return;

        var cur = steps[at];
        // 앞머리 꼬리표를 떼어낸다. "💡[초보핵심]", "(안전)", "[끓이기]" 같은 것들.
        // 그 말은 위쪽 라벨로 이미 보여주고 있어서 본문에 두 번 나올 필요가 없다.
        var body = clean(cur);
        for (var k = 0; k < 3; k++) {
            body = body
                .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]\s*/u, "")
                .replace(/^\[[^\]]*\]\s*/, "")
                .replace(/^\((안전|필수)\)\s*/, "");
        }
        body = body.trim();
        var mins = minsOf(cur);
        var label = tag(cur);
        var last = (at === steps.length - 1);

        var dots = steps.map(function (s, i) {
            var on = (i === at), done = (i < at);
            return '<div onclick="window.cookJump(' + i + ')" ' +
                'style="flex:1; height:6px; border-radius:3px; cursor:pointer; ' +
                'background:' + (on ? BLUE : done ? "#C9E2FF" : "#E5E8EB") + ';"></div>';
        }).join("");

        box.innerHTML =
            '<div style="display:flex; gap:5px; margin-bottom:18px;">' + dots + '</div>' +

            '<div style="text-align:center; font-size:12.5px; font-weight:800; color:' + GRAY + '; ' +
                'letter-spacing:0.5px; margin-bottom:14px;">' +
                (at + 1) + ' / ' + steps.length + (label ? '  ·  ' + esc(label) : '') + '</div>' +

            '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:18px; ' +
                'padding:26px 22px; min-height:150px; display:flex; align-items:center; ' +
                'justify-content:center; margin-bottom:16px;">' +
                '<div style="font-size:18px; font-weight:700; color:' + DARK + '; ' +
                    'line-height:1.75; text-align:center; word-break:keep-all;">' + body + '</div>' +
            '</div>' +

            (mins
                ? '<button onclick="setCookTimer(' + mins + ')" ' +
                  'style="width:100%; padding:18px; margin-bottom:10px; background:#FFF2F2; ' +
                  'color:#E32636; border:1.5px solid #FCA5A5; border-radius:14px; ' +
                  'font-size:16px; font-weight:900; cursor:pointer;">⏱️ ' + mins + '분 타이머 걸기</button>'
                : '') +

            '<div style="display:flex; gap:9px;">' +
                (at > 0
                    ? '<button onclick="window.cookGo(-1)" style="width:88px; padding:18px 0; ' +
                      'background:#F2F4F6; color:#4E5968; border:none; border-radius:14px; ' +
                      'font-size:15px; font-weight:800; cursor:pointer;">이전</button>'
                    : '') +
                (last
                    ? '<button onclick="closeCookingMode()" style="flex:1; padding:18px 0; ' +
                      'background:#1F9D6B; color:#FFFFFF; border:none; border-radius:14px; ' +
                      'font-size:17px; font-weight:900; cursor:pointer;">다 만들었어요 🎉</button>'
                    : '<button onclick="window.cookGo(1)" style="flex:1; padding:18px 0; ' +
                      'background:' + BLUE + '; color:#FFFFFF; border:none; border-radius:14px; ' +
                      'font-size:17px; font-weight:900; cursor:pointer;">다음 →</button>') +
            '</div>' +

            '<div style="text-align:center; font-size:11.5px; font-weight:600; color:' + GRAY + '; ' +
                'margin-top:14px; line-height:1.6;">' +
                '손에 물 묻었으면 위의 막대를 눌러 건너뛰셔도 돼요</div>';
    }

    /* ---------- 기존 요리 모드에 얹기 ---------- */

    function boot() {
        var orig = window.openCookingMode;
        if (typeof orig !== "function" || orig.__cook) return;

        var wrapped = function (recipeName) {
            var out = orig.apply(this, arguments);

            var r = null;
            try {
                if (typeof babyFoodData !== "undefined" && babyFoodData) {
                    r = babyFoodData.filter(function (x) { return x.name === recipeName; })[0];
                }
            } catch (e) {}

            steps = (r && r.recipe) ? r.recipe.slice() : [];
            at = 0;
            if (steps.length) setTimeout(paint, 20);

            return out;
        };
        wrapped.__cook = true;
        window.openCookingMode = wrapped;
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.cookDebug = function () {
        console.log("단계 수:", steps.length, "· 지금:", (at + 1));
        steps.forEach(function (s, i) {
            var m = minsOf(s);
            console.log("  " + (i === at ? "▶" : " ") + " " + (i + 1) + ". " +
                        clean(s).slice(0, 40) + (m ? "   ⏱️ " + m + "분" : ""));
        });
        console.log("감쌈:", !!(window.openCookingMode && window.openCookingMode.__cook));
    };
})();