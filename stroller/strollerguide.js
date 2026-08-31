/* ============================================================
   배냇함 — 유모차 안전 (strollerguide.js)

   49종을 뒤져봤다. 트렁크 계산도, 숨은 비용도, A/S 정보도 다 있다.
   다섯 큐레이터 중에 제일 공들인 데이터다.

   그런데 이 낱말들이 데이터 전체에서 0번 나온다.

       브레이크 · 전복 · 끼임 · 안전벨트 · 손잡이

   유모차는 카시트보다 사고가 잦다. 매일 쓰기 때문이다.
   그리고 사고 원인은 제품이 아니라 거의 늘 같은 여섯 가지다.
   그래서 제품마다 적을 게 아니라 한 곳에 모아 위에 둔다.

   ⚠️ 제일 흔한 것 하나는 접지 않는다.
      손잡이에 가방을 거는 건 거의 모든 부모가 하고,
      유모차가 뒤로 넘어가는 가장 흔한 원인이다.
      접어두면 아무도 안 읽는다.

   index.html 은 한 줄도 안 고친다.
   필터 앞에 한 칸을 끼워 넣는다.

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
        if (document.getElementById("sg-vars")) return;
        var st = document.createElement("style");
        st.id = "sg-vars";
        st.textContent =
            ":root{--sg-blue:#1B64DA;--sg-gold:#8A6D00;--sg-red:#C62828;}" +
            "body.dark-mode{--sg-blue:#7EB6FF;--sg-gold:#E8C766;--sg-red:#FF8A8A;}";
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

    /* ---------- 여섯 가지 ---------- */

    var RULES = [
        { icon: "🎒", t: "손잡이에 가방을 걸지 마세요",
          d: "유모차가 <b>뒤로 넘어가는 가장 흔한 원인</b>입니다. 특히 아기를 안아 올린 순간, 앞쪽 무게가 사라지면서 그대로 넘어갑니다. " +
             "짐은 <b>아래 바구니</b>에 넣으세요. 거기가 무게 중심이 제일 낮습니다.",
          tone: "--sg-red" },
        { icon: "🅿️", t: "손을 뗄 때는 반드시 브레이크",
          d: "지하철 승강장, 경사진 주차장, 카페 앞 턱. <b>몇 초면 굴러갑니다.</b> " +
             "브레이크를 밟았는지 <b>발로 확인</b>하고 손을 떼는 습관을 들이세요.",
          tone: "--sg-red" },
        { icon: "✋", t: "아기를 태운 채로 접거나 펴지 마세요",
          d: "접히는 관절에 <b>손가락이 끼입니다.</b> 아이가 옆에 서 있을 때도 마찬가지예요. " +
             "펼 때는 딸깍 소리가 나고 잠금이 걸렸는지 꼭 확인하세요.",
          tone: "--sg-gold" },
        { icon: "🔒", t: "안전벨트는 매번, 어깨까지",
          d: "허리만 채우면 아기가 <b>서다가 앞으로 미끄러집니다.</b> 5점식이면 어깨끈까지 채우세요. " +
             "잠깐 태우는 거라도요. 사고는 늘 그 잠깐에 납니다.",
          tone: "--sg-gold" },
        { icon: "🚫", t: "에스컬레이터는 타지 마세요",
          d: "유모차를 실은 채 에스컬레이터를 타다 넘어지면 <b>크게 다칩니다.</b> " +
             "돌아가더라도 엘리베이터를 쓰세요. 이건 예외를 두지 마시길 권합니다.",
          tone: "--sg-red" },
        { icon: "🌡️", t: "여름에 담요로 덮지 마세요",
          d: "햇빛 가린다고 유모차 위에 담요나 손수건을 덮으면 <b>안쪽 온도가 빠르게 올라갑니다.</b> 바람도 막히고요. " +
             "차양을 펴고 그늘로 다니시는 편이 훨씬 안전합니다.",
          tone: "--sg-gold" }
    ];

    var open = false;
    window.toggleStrollerSafety = function () { open = !open; paint(); };

    function safetyHTML() {
        var head = RULES[0];
        var rest = RULES.slice(1).map(function (r) {
            return '<div style="display:flex; gap:11px; padding:13px 0; border-bottom:1px solid #F2F4F6;">' +
                '<div style="font-size:18px; flex-shrink:0; width:24px; text-align:center;">' + r.icon + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:13.5px; font-weight:900; color:var(' + r.tone + '); margin-bottom:5px;">' +
                        esc(r.t) + '</div>' +
                    '<div style="font-size:12.5px; font-weight:600; color:#4E5968; ' +
                        'line-height:1.75; word-break:keep-all;">' + r.d + '</div>' +
                '</div>' +
            '</div>';
        }).join("");

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +

            '<div style="display:flex; gap:12px; align-items:flex-start;">' +
                '<div style="font-size:22px; flex-shrink:0;">' + head.icon + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:15px; font-weight:900; color:var(' + head.tone + '); margin-bottom:6px;">' +
                        esc(head.t) + '</div>' +
                    '<div style="font-size:13px; font-weight:600; color:#4E5968; ' +
                        'line-height:1.75; word-break:keep-all;">' + head.d + '</div>' +
                '</div>' +
            '</div>' +

            '<div onclick="window.toggleStrollerSafety()" ' +
                'style="margin-top:14px; padding-top:13px; border-top:1px solid #E5E8EB; ' +
                'text-align:center; font-size:12.5px; font-weight:800; color:' + GRAY + '; cursor:pointer;">' +
                (open ? "접기 ▴" : "유모차 사고를 막는 나머지 다섯 가지 ▾") + '</div>' +

            (open ? '<div style="margin-top:6px;">' + rest +
                    '<div style="font-size:11.5px; font-weight:600; color:' + GRAY + '; ' +
                        'margin-top:12px; line-height:1.7; word-break:keep-all;">' +
                        '여기 적은 건 일반적인 안내예요. 제품마다 다른 부분은 <b>설명서</b>를 따르세요.</div>' +
                    '</div>'
                  : '') +
        '</div>';
    }

    /* ==========================================================
       기내반입 — 데이터의 "기내 ⭕" 를 그대로 믿게 두면 안 된다
       ----------------------------------------------------------
       49종 중 기내 ⭕ 가 6종인데, 그중 5종은 세 변 합이
       115cm(LCC 일반 기준)를 넘는다. 118~124cm 다.

       유모차는 게이트 수하물로 따로 봐주는 항공사가 있어서
       "안 된다" 고 잘라 말할 수도 없다. 항공사마다 다르다.
       그래서 단정하지 않고 확인하게 만든다.

       공항에서 거부당하면 100만원짜리를 화물칸에 부쳐야 하고,
       유모차는 화물칸에서 제일 잘 망가지는 물건이다.
       ---------------------------------------------------------- */

    function cabinNoteHTML() {
        return '<div style="background:#FFF9E6; border:1px solid #FDE68A; border-radius:14px; ' +
            'padding:15px 16px; margin-bottom:20px;">' +
            '<div style="font-size:13.5px; font-weight:900; color:var(--sg-gold); margin-bottom:7px;">' +
                '✈️ 기내반입 표시는 참고용입니다</div>' +
            '<div style="font-size:12.5px; font-weight:600; color:#4E5968; ' +
                'line-height:1.75; word-break:keep-all;">' +
                '항공사마다 규격과 정책이 다릅니다. 일반 기내 수하물은 보통 <b>세 변 합 115cm</b> 안쪽인데, ' +
                '유모차는 게이트까지 끌고 가서 부치는 걸 따로 봐주는 곳도 있어요.<br><br>' +
                '<b>표를 끊기 전에 그 항공사에 한 번 물어보세요.</b> 공항에서 거부당하면 화물칸으로 가는데, ' +
                '유모차는 화물칸에서 제일 잘 망가지는 물건입니다.</div>' +
        '</div>';
    }

    /* ==========================================================
       지금 이 아기에게 맞는 종류
       ----------------------------------------------------------
       배냇함이 개월수를 안다. 그걸로 한 줄만 거든다.
       ---------------------------------------------------------- */

    function ageNoteHTML() {
        var m = monthsOld();
        if (m === null) return "";
        var name = esc(babyName());

        var txt;
        if (m < 4) {
            txt = "<b>" + name + "는 지금 " + m + "개월이에요.</b> 목을 가누기 전에는 " +
                  "<b>등받이가 거의 평평하게 눕는 것</b>이어야 합니다. 각도가 서면 고개가 앞으로 꺾여 숨길이 눌립니다. " +
                  "휴대용은 이 시기에 맞지 않는 게 많아요.";
        } else if (m < 12) {
            txt = "<b>" + name + "는 지금 " + m + "개월이에요.</b> 앉기 시작하면 고를 폭이 넓어집니다. " +
                  "다만 <b>완전히 눕는 각도</b>는 낮잠 잘 때 여전히 쓰이니 아예 없는 건 피하시는 게 좋아요.";
        } else if (m < 24) {
            txt = "<b>" + name + "는 지금 " + m + "개월이에요.</b> 이 시기부터 <b>무게가 제일 중요해집니다.</b> " +
                  "걷다 안기다를 반복해서, 접어서 드는 일이 하루에도 여러 번 생기거든요.";
        } else {
            txt = "<b>" + name + "는 지금 " + m + "개월이에요.</b> 유모차를 오래 타지는 않지만 " +
                  "<b>외출 끝자락에 잠들 때</b> 필요합니다. 가벼운 휴대용 하나가 알맞은 시기예요.";
        }

        return '<div style="background:#E8F3FF; border:1px solid #C9E2FF; border-radius:14px; ' +
            'padding:15px 16px; margin-bottom:20px; font-size:13px; font-weight:600; ' +
            'color:var(--sg-blue); line-height:1.75; word-break:keep-all;">👶 ' + txt + '</div>';
    }

    /* ---------- 자리 잡기 ---------- */

    var HOST = "stroller-guide";

    function paint() {
        var host = document.getElementById(HOST);
        if (!host) return;
        host.innerHTML = ageNoteHTML() + safetyHTML() + cabinNoteHTML();
    }

    function mount() {
        if (document.getElementById(HOST)) return;
        var anchor = document.querySelector(".filter-section") ||
                     document.querySelector(".matrix-panel");
        if (!anchor || !anchor.parentNode) return;

        var box = document.createElement("div");
        box.id = HOST;
        anchor.parentNode.insertBefore(box, anchor);
        paint();
    }

    function boot() {
        setTimeout(mount, 200);
        setTimeout(mount, 900);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.strollerGuideDebug = function () {
        var m = monthsOld();
        console.log("개월수:", m === null ? "생년월일 없음" : m + "개월");
        console.log("안전 카드 펼침:", open);
        console.log("붙었나:", !!document.getElementById(HOST));
        try {
            var big = strollerData.filter(function (s) {
                return s.specs && s.specs.cabin && s.specs.cabin.indexOf("⭕") > -1 &&
                       s.foldedDims && s.foldedDims.reduce(function (a, b) { return a + b; }, 0) > 115;
            });
            console.log("─ 기내 ⭕ 인데 세 변 합 115cm 초과 ─");
            big.forEach(function (s) {
                console.log("   " + s.name + "  " + s.foldedDims.join("+") + " = " +
                            s.foldedDims.reduce(function (a, b) { return a + b; }, 0) + "cm");
            });
        } catch (e) {}
    };
})();