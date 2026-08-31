/* ============================================================
   배냇함 — 젖병 상담 (bottleguide.js)

   필터가 일곱 개 있다. 데이터도 좋다.
   그런데 초보 부모는 그 일곱 개 중 다섯 개를 모른다.

     "젖꼭지 거부 성향"  → 아직 안 먹여봤는데요
     "PPSU / PA / PP"   → 그게 뭔데요
     "젖꼭지 호환"       → 호환이 뭐예요

   아는 사람만 쓸 수 있는 도구인데, 아는 사람은 이미 살 걸 정했다.
   그래서 이 화면은 정작 필요한 사람에게 안 쓰인다.

   ─────────────────────────────────────────
   스펙을 묻지 말고 상황을 물어야 한다.

     "젖병을 안 물어요"  → 거부 심함 + 모유실감 호환으로 자동 설정
     "먹고 나서 자주 울어요" → 배앓이 특화로 자동 설정

   부모는 자기 상황은 안다. 스펙은 우리가 알면 된다.
   ─────────────────────────────────────────

   그리고 초보가 제일 많이 검색하는 두 가지가 여기 없었다.

     1. 젖병 몇 개 사야 해요?
     2. 젖꼭지 언제 다음 단계로 올려요?

   둘 다 제품 정보가 아니라 계산과 판단이라 아무도 안 알려준다.
   배냇함은 수유 기록을 갖고 있어서 답할 수 있다.

   ⚠️ 젖꼭지 단계는 개월수로 정하지 않는다.
      브랜드마다 이름이 다르고(SS·S·M / 1구멍·2구멍),
      같은 개월수라도 아기마다 빠는 힘이 다르다.
      먹는 모습으로 판단하게 만든다. 그게 사실이다.

   index.html 에서 app.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* 다크모드에서 연한 배경은 어두워지는데 글씨는 그대로라 안 보였다.
       style.css 가 인라인 배경만 반전시키고 글씨는 못 따라간다.
       그래서 글씨 색을 변수로 빼고, 다크일 때만 밝은 값으로 바꾼다. */
    (function darkVars() {
        if (document.getElementById("gd-vars")) return;
        var st = document.createElement("style");
        st.id = "gd-vars";
        st.textContent =
            ":root{--gd-blue:#1B64DA;--gd-gold:#8A6D00;--gd-red:#E32636;}" +
            "body.dark-mode{--gd-blue:#7EB6FF;--gd-gold:#E8C766;--gd-red:#FF8A8A;}";
        (document.head || document.documentElement).appendChild(st);
    })();

    var BLUE = "#3182F6";
    var GRAY = "#8B95A1";
    var DARK = "#191F28";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

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

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function setSel(id, v) {
        var el = document.getElementById(id);
        if (el) el.value = v;
    }

    function run() {
        if (typeof window.runBottleEngine === "function") window.runBottleEngine();
    }

    /* ==========================================================
       1. 상황으로 묻기
       ---------------------------------------------------------- */

    var CASES = [
        { id: "ready", icon: "🤰", label: "출산 준비 중이에요",
          set: { "filter-age": "newborn" },
          tip: "지금은 <b>두세 개만</b> 사세요. 어떤 젖꼭지를 물지는 아기가 태어나 봐야 압니다. " +
               "세트로 여섯 개 사두면 안 무는 순간 전부 서랍행이에요." },

        { id: "reject", icon: "😤", label: "젖병을 안 물어요",
          set: { "filter-rejection": "super", "filter-compatible": "yes" },
          tip: "젖병 전체를 바꾸기 전에 <b>젖꼭지만</b> 먼저 바꿔보세요. 훨씬 싸고 성공률도 비슷합니다. " +
               "배가 아주 고플 때보다 <b>살짝 고플 때</b> 물리는 게 잘 먹힙니다." },

        { id: "colic", icon: "😣", label: "먹고 나서 자주 울어요",
          set: { "filter-anticolic": "super" },
          tip: "공기를 덜 삼키게는 할 수 있어요. 다만 <b>젖병으로 배앓이가 사라지지는 않습니다</b> — " +
               "생후 3~4개월이면 대개 잦아듭니다. 열이나 구토, 피 섞인 변이 같이 오면 젖병 문제가 아니라 진료가 먼저예요." },

        { id: "mixed", icon: "🍼", label: "모유랑 같이 쓰려고요",
          set: { "filter-compatible": "yes", "filter-rejection": "super" },
          tip: "젖과 젖병을 오가면 아기가 헷갈릴 수 있어요. <b>모유실감 계열</b>이 무난하고, " +
               "젖병을 늦게 시작할수록 거부가 심해지는 편이라 필요하시면 미루지 마세요." },

        { id: "wash", icon: "🧼", label: "설거지가 너무 힘들어요",
          set: { "filter-sterilization": "easy" },
          tip: "고를 때 볼 건 두 가지예요. <b>입구가 넓은가</b>, <b>부품이 몇 개인가</b>. " +
               "배앓이 방지 젖병일수록 부품이 많아서 손이 더 갑니다. 새벽 수유 때 이게 제일 큽니다." },

        { id: "uv", icon: "🌡️", label: "소독기(UV)를 써요",
          set: { "filter-sterilization": "uv" },
          tip: "PPSU는 UV를 오래 쬐면 <b>누렇게 변하거나 끈적</b>해질 수 있어요. " +
               "UV에 제일 자유로운 건 유리입니다. 무겁다는 게 값이고요." }
    ];

    var picked = null;

    window.pickBottleCase = function (id) {
        var c = null;
        for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) c = CASES[i];
        if (!c) return;

        if (picked === id) {                       // 한 번 더 누르면 해제
            picked = null;
            if (typeof window.resetBottleFilters === "function") window.resetBottleFilters();
            paint();
            return;
        }

        if (typeof window.resetBottleFilters === "function") window.resetBottleFilters();

        // 개월수는 배냇함이 아는 값으로 먼저 맞춘다
        if (typeof window.applyGlobalBabyProfile === "function") {
            try { window.applyGlobalBabyProfile(); } catch (e) {}
        }
        Object.keys(c.set).forEach(function (k) { setSel(k, c.set[k]); });

        picked = id;
        paint();
        run();

        var r = document.getElementById("bottle-result-area");
        if (r) setTimeout(function () {
            try { r.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
        }, 150);
    };

    function casesHTML() {
        var chips = CASES.map(function (c) {
            var on = (picked === c.id);
            return '<div onclick="window.pickBottleCase(\'' + c.id + '\')" ' +
                'style="padding:14px 12px; border-radius:14px; cursor:pointer; text-align:center; ' +
                'font-size:13px; font-weight:800; line-height:1.4; word-break:keep-all; transition:0.15s; ' +
                (on ? 'background:' + BLUE + '; color:#FFFFFF; border:1px solid ' + BLUE + ';'
                    : 'background:#F9FAFB; color:#4E5968; border:1px solid #E5E8EB;') + '">' +
                '<div style="font-size:20px; margin-bottom:5px;">' + c.icon + '</div>' + esc(c.label) + '</div>';
        }).join("");

        var tip = "";
        for (var i = 0; i < CASES.length; i++) {
            if (CASES[i].id === picked) {
                tip = '<div style="margin-top:14px; background:#E8F3FF; border:1px solid #C9E2FF; ' +
                      'border-radius:14px; padding:15px 16px; font-size:13.5px; font-weight:600; ' +
                      'color:var(--gd-blue,#1B64DA); line-height:1.7; word-break:keep-all;">' +
                      CASES[i].icon + ' ' + CASES[i].tip + '</div>';
            }
        }

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">🙋 어떤 상황이신가요?</div>' +
            '<div style="font-size:13px; font-weight:600; color:' + GRAY + '; ' +
                'margin:-16px 0 18px; line-height:1.6; word-break:keep-all;">' +
                '스펙은 저희가 볼게요. 지금 겪고 계신 것만 눌러주세요</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:9px;">' + chips + '</div>' +
            tip +
        '</div>';
    }

    /* ==========================================================
       2. 몇 개 사야 하나
       ----------------------------------------------------------
       초보가 제일 많이 검색하는데 아무도 안 알려준다.
       제품 정보가 아니라 계산이라서 그렇다.
       배냇함은 수유 기록이 있어서 답할 수 있다.
       ---------------------------------------------------------- */

    function feedsPerDay() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; } catch (e) {}
        var now = Date.now(), byDay = {};
        recs.forEach(function (r) {
            if (!r || r.type !== "feed" || !Number(r.timestamp)) return;
            if (Number(r.timestamp) < now - 7 * 86400000) return;
            var d = new Date(Number(r.timestamp));
            var k = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
            byDay[k] = (byDay[k] || 0) + 1;
        });
        var days = Object.keys(byDay);
        if (days.length < 3) return null;                 // 사흘치는 있어야 평균이라 부를 수 있다
        var sum = 0;
        days.forEach(function (k) { sum += byDay[k]; });
        return { avg: Math.round(sum / days.length), days: days.length };
    }

    // 기록이 없을 때 쓰는 일반적인 횟수
    function typicalFeeds(m) {
        if (m === null) return 8;
        if (m <= 1) return 10;
        if (m <= 3) return 8;
        if (m <= 6) return 6;
        return 5;
    }

    var howMode = "mixed";
    window.setBottleHow = function (v) { howMode = v; paint(); };

    function howManyHTML() {
        var m = monthsOld();
        var real = feedsPerDay();
        var feeds = real ? real.avg : typicalFeeds(m);

        var n, line;
        if (howMode === "breast") {
            n = "1~2개";
            line = "가끔 쓰는 용도라 두 개면 넉넉해요. 안 물 수도 있으니 <b>한 번에 많이 사지 마세요</b>.";
        } else if (howMode === "formula") {
            var once = Math.max(4, feeds);                     // 하루 한 번 몰아서 소독
            var twice = Math.max(3, Math.ceil(feeds / 2) + 1);  // 두 번 나눠서 소독
            n = twice + "~" + once + "개";
            line = "소독을 <b>하루 한 번</b> 몰아서 하면 수유 횟수만큼(" + once + "개), " +
                   "<b>두 번 나눠서</b> 하면 " + twice + "개면 돌아갑니다.";
        } else {
            n = "3~4개";
            line = "젖과 젖병을 같이 쓰면 하루 두세 번쯤 젖병을 씁니다. 여유분 하나를 더 두는 정도예요.";
        }

        var basis = real
            ? "최근 " + real.days + "일 기록 기준 하루 <b>" + real.avg + "번</b> 수유"
            : (m === null ? "일반적인 기준" : "생후 " + m + "개월 평균 하루 " + feeds + "번쯤");

        var chip = function (v, t) {
            var on = (howMode === v);
            return '<div onclick="window.setBottleHow(\'' + v + '\')" ' +
                'style="flex:1; text-align:center; padding:11px 6px; border-radius:11px; cursor:pointer; ' +
                'font-size:12.5px; font-weight:800; ' +
                (on ? 'background:' + DARK + '; color:#FFFFFF;'
                    : 'background:#F2F4F6; color:#4E5968;') + '">' + t + '</div>';
        };

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">🍼 몇 개 사면 될까요?</div>' +

            '<div style="display:flex; gap:7px; margin:-10px 0 16px;">' +
                chip("breast",  "모유 위주") + chip("mixed", "모유 + 젖병") + chip("formula", "분유 위주") +
            '</div>' +

            '<div style="text-align:center; padding:18px 0 14px;">' +
                '<div style="font-size:32px; font-weight:900; color:' + BLUE + '; letter-spacing:-1px;">' + n + '</div>' +
                '<div style="font-size:12px; font-weight:700; color:' + GRAY + '; margin-top:6px;">' + basis + '</div>' +
            '</div>' +

            '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:14px; ' +
                'padding:15px 16px; font-size:13.5px; font-weight:600; color:#4E5968; ' +
                'line-height:1.7; word-break:keep-all;">' + line + '</div>' +

            '<div style="font-size:12.5px; font-weight:600; color:' + GRAY + '; ' +
                'margin-top:12px; line-height:1.7; word-break:keep-all;">' +
                '처음부터 세트로 다 사지 마세요. <b>한 종류를 두 개 사서 물려보고</b> 잘 먹으면 그때 늘리는 게 안전합니다. ' +
                '젖병은 한 번 안 물면 되팔지도 못해요.</div>' +
        '</div>';
    }

    /* ==========================================================
       3. 젖꼭지 단계
       ----------------------------------------------------------
       "3개월이면 M" 같은 표는 브랜드마다 이름이 달라 쓸모가 없다.
       (더블하트 SS·S·M·L / 아벤트 1·2·3구멍)
       같은 개월수라도 아기마다 빠는 힘이 다르다.
       그래서 개월수가 아니라 먹는 모습으로 판단하게 만든다.
       ---------------------------------------------------------- */

    var NIPPLE_KEY = "tosil_nipple_changed";

    window.logNippleChange = function () {
        var today = new Date();
        var key = today.getFullYear() + "-" +
                  String(today.getMonth() + 1).padStart(2, "0") + "-" +
                  String(today.getDate()).padStart(2, "0");
        try { localStorage.setItem(NIPPLE_KEY, key); } catch (e) {}

        // 배냇함 '언제깠지' 에도 같이 적어둔다 — 거기가 기한을 세는 곳이다
        try {
            var list = JSON.parse(localStorage.getItem("tosil_open_records")) || [];
            list = list.filter(function (r) { return !r || String(r.name).indexOf("젖꼭지") === -1; });
            list.push({ id: "nip_" + Date.now(), name: "젖꼭지", openDate: key, limitDays: 60 });
            localStorage.setItem("tosil_open_records", JSON.stringify(list));
        } catch (e) {}

        paint();
        alert("젖꼭지 교체일을 적어뒀어요.\n배냇함 툴박스 '언제깠지'에서 다음 교체일을 알려드립니다.");
    };

    function nippleHTML() {
        var last = localStorage.getItem(NIPPLE_KEY);
        var since = "";
        if (last) {
            var p = String(last).split("-").map(Number);
            var d = Math.floor((Date.now() - new Date(p[0], p[1] - 1, p[2]).getTime()) / 86400000);
            since = '<div style="background:' + (d >= 60 ? "#FFF2F2" : "#F9FAFB") + '; ' +
                'border:1px solid ' + (d >= 60 ? "#FCA5A5" : "#E5E8EB") + '; border-radius:12px; ' +
                'padding:13px 15px; margin-bottom:14px; font-size:13px; font-weight:800; ' +
                'color:' + (d >= 60 ? "var(--gd-red,#E32636)" : "#4E5968") + ';">' +
                '마지막 교체 후 <b>' + d + '일</b>' +
                (d >= 60 ? " — 갈 때가 됐어요" : " 지났어요") + '</div>';
        }

        return '<div class="matrix-panel" style="margin-bottom:20px;">' +
            '<div class="matrix-header">🔧 젖꼭지, 지금 단계 맞나요?</div>' +
            '<div style="font-size:13px; font-weight:600; color:' + GRAY + '; ' +
                'margin:-16px 0 18px; line-height:1.6; word-break:keep-all;">' +
                '개월수로 정하는 게 아니에요. 브랜드마다 이름이 다르고(SS·S·M / 1구멍·2구멍) ' +
                '같은 개월수라도 아기마다 빠는 힘이 다릅니다. <b>먹는 모습</b>으로 보세요</div>' +

            since +

            '<div style="background:#FFF9E6; border:1px solid #F5E1A4; border-radius:14px; ' +
                'padding:15px 16px; margin-bottom:10px;">' +
                '<div style="font-size:13.5px; font-weight:900; color:var(--gd-gold,#8A6D00); margin-bottom:7px;">⬆️ 한 단계 올릴 때</div>' +
                '<div style="font-size:13px; font-weight:600; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
                '한 번 먹는 데 <b>20분 넘게</b> 걸려요 · 빨다가 지쳐서 잠들어요 · ' +
                '젖꼭지가 <b>쭈그러들었다</b> 펴져요 · 먹는 중에 화를 내요</div>' +
            '</div>' +

            '<div style="background:#F0F7FF; border:1px solid #C9E2FF; border-radius:14px; ' +
                'padding:15px 16px; margin-bottom:10px;">' +
                '<div style="font-size:13.5px; font-weight:900; color:var(--gd-blue,#1B64DA); margin-bottom:7px;">⬇️ 한 단계 내릴 때</div>' +
                '<div style="font-size:13px; font-weight:600; color:#4E5968; line-height:1.75; word-break:keep-all;">' +
                '<b>사레</b>가 자주 들려요 · 입가로 줄줄 흘러요 · ' +
                '<b>5분도 안 돼</b> 끝나요 · 먹고 나서 자주 게워요</div>' +
            '</div>' +

            '<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:14px; ' +
                'padding:15px 16px; font-size:13px; font-weight:600; color:#4E5968; ' +
                'line-height:1.75; word-break:keep-all;">' +
                '🔁 <b>젖병은 그대로 두고 젖꼭지만</b> 바꾸면 됩니다. 훨씬 싸요.<br>' +
                '실리콘은 <b>두 달쯤</b> 쓰면 갈아주는 게 좋고, 찢어지거나 끈적이면 바로 바꾸세요. ' +
                '떨어져 나간 조각을 아기가 삼킬 수 있습니다.</div>' +

            '<div onclick="window.logNippleChange()" ' +
                'style="margin-top:14px; text-align:center; padding:15px; background:' + DARK + '; ' +
                'color:#FFFFFF; border-radius:14px; font-size:14px; font-weight:900; cursor:pointer;">' +
                '오늘 젖꼭지 갈았어요 · 배냇함에 적어두기</div>' +
        '</div>';
    }

    /* ---------- 자리 잡기 ----------
       index.html 은 한 줄도 안 고친다.
       기존 필터 패널 바로 앞에 세 칸을 끼워 넣는다. -------- */

    var HOST = "bottle-guide";

    function paint() {
        var host = document.getElementById(HOST);
        if (!host) return;
        host.innerHTML = casesHTML() + howManyHTML() + nippleHTML();
    }

    function mount() {
        if (document.getElementById(HOST)) return;

        var panel = document.querySelector(".matrix-panel");
        if (!panel || !panel.parentNode) return;

        var box = document.createElement("div");
        box.id = HOST;
        panel.parentNode.insertBefore(box, panel);

        // 기존 필터 패널은 '직접 고르실 분' 용으로 접어둔다
        var head = panel.querySelector(".matrix-header");
        if (head && !head.getAttribute("data-folded")) {
            head.setAttribute("data-folded", "1");
            head.style.cursor = "pointer";
            head.innerHTML = '🔍 직접 조건 고르기 <span id="fold-mark" style="margin-left:auto; ' +
                             'font-size:13px; font-weight:800; color:' + GRAY + ';">펼치기 ▾</span>';
            var grid = panel.querySelector(".matrix-grid");
            if (grid) {
                grid.style.display = "none";
                head.onclick = function () {
                    var on = (grid.style.display === "none");
                    grid.style.display = on ? "grid" : "none";
                    var mk = document.getElementById("fold-mark");
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
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.bottleGuideDebug = function () {
        var m = monthsOld(), r = feedsPerDay();
        console.log("개월수:", m === null ? "생년월일 없음" : m + "개월");
        console.log("수유 기록:", r ? (r.days + "일치 · 하루 평균 " + r.avg + "번") : "사흘치 미만 (일반 기준 사용)");
        console.log("일반 기준 횟수:", typicalFeeds(m) + "번");
        console.log("고른 상황:", picked || "없음");
        console.log("수유 방식:", howMode);
        console.log("젖꼭지 마지막 교체:", localStorage.getItem(NIPPLE_KEY) || "기록 없음");
        console.log("붙었나:", !!document.getElementById(HOST));
    };
})();