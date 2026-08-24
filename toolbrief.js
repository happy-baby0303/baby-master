/* ============================================================
   배냇함 — 지금 챙길 것 (toolbrief.js)

   툴박스가 서랍이었다.
   여덟 개 아이콘이 나란히 있고, 사용자가 스스로
   "지금 내가 뭘 써야 하지" 를 판단해서 열어야 했다.

   새벽 2시에 열나는 아기 앞에서 툴박스를 뒤지는 부모는 없다.
   각 도구를 아무리 깎아도 이건 안 바뀐다.

   그래서 툴박스가 먼저 말을 걸게 한다.

     지금 챙길 것
       해열제  18:20부터 가능 (2시간 5분 남음)
       냉동실  소고기부터 쓰세요 (12일차)
       언제깠지 퓨레 기한이 지났어요

   ⚠️ 새로 계산하지 않는다.
      각 도구가 이미 계산해둔 걸 불러다 한 자리에 모을 뿐이다.
      계산을 두 벌 만들면 언젠가 서로 다른 답을 낸다.
      특히 해열제는 doseStatus() 하나만 쓴다.

   급한 게 없으면 아무것도 안 뜬다.

   index.html 에서 expiryalert.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var CARD_ID = "tool-brief";
    var RED     = "#D32F2F";
    var GOLD    = "#B98A2E";
    var PURPLE  = "#7F77DD";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* ==========================================================
       1. 해열제 — doseStatus() 를 그대로 쓴다
       ---------------------------------------------------------- */

    function feverItem() {
        if (typeof window.doseStatus !== "function") return null;

        var red  = window.doseStatus("red");
        var blue = window.doseStatus("blue");

        // 둘 다 지금 줄 수 있으면 굳이 말할 필요 없다
        if (!red.locked && !blue.locked) return null;

        // 하나라도 막혀 있다는 건 최근에 먹였다는 뜻이다. 그때만 알린다.
        var pick = red.locked ? red : blue;
        var name = red.locked ? "아세트아미노펜" : "이부프로펜 계열";

        if (pick.kind === "daily") {
            return { tool: "fever", icon: "🌡️", label: "해열제",
                     text: name + " 하루 한도를 채웠어요", color: RED, urgent: true };
        }

        var other = red.locked ? blue : red;
        if (!other.locked) {
            return { tool: "fever", icon: "🌡️", label: "해열제",
                     text: (red.locked ? "이부프로펜 계열" : "아세트아미노펜") + "은 지금 줄 수 있어요",
                     color: PURPLE, urgent: false };
        }

        var h = Math.floor(pick.minsLeft / 60), m = pick.minsLeft % 60;
        return { tool: "fever", icon: "🌡️", label: "해열제",
                 text: (h ? h + "시간 " : "") + m + "분 뒤부터 가능해요",
                 color: GOLD, urgent: false };
    }

    /* ==========================================================
       2. 언제깠지 — 기한 지난 것만
       ---------------------------------------------------------- */

    function openItem() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_open_records")) || []; }
        catch (e) { return null; }

        var today = new Date(); today.setHours(0, 0, 0, 0);
        var gone = [];

        recs.forEach(function (r) {
            if (!r || !r.openDate || !r.limitDays) return;
            var open = new Date(r.openDate); open.setHours(0, 0, 0, 0);
            if (isNaN(open.getTime())) return;
            var left = r.limitDays - Math.floor((today - open) / 86400000);
            if (left < 0) gone.push(r.name);
        });

        if (!gone.length) return null;

        return { tool: "cube", icon: "🥄", label: "언제깠지",
                 text: gone.length === 1
                     ? esc(gone[0]) + " 기한이 지났어요"
                     : esc(gone[0]) + " 외 " + (gone.length - 1) + "개 기한이 지났어요",
                 color: RED, urgent: true };
    }

    /* ==========================================================
       3. 냉동실 — 가장 오래 보관 중인 것
       ---------------------------------------------------------- */

    function cubeItem() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_cube_records")) || []; }
        catch (e) { return null; }

        var live = recs.filter(function (r) { return Number(r.qty) > 0; });
        if (live.length < 2) return null;      // 하나뿐이면 고를 게 없다

        var oldest = null, oldestDays = -1;
        live.forEach(function (r) {
            var made = new Date(r.date + "T00:00:00").getTime();
            if (isNaN(made)) return;
            var d = Math.floor((Date.now() - made) / 86400000);
            if (d > oldestDays) { oldestDays = d; oldest = r; }
        });

        if (!oldest) return null;

        return { tool: "cube", icon: "🧊", label: "냉동실",
                 text: esc(oldest.name) + "부터 쓰세요 (보관 " + oldestDays + "일차)",
                 color: PURPLE, urgent: false };
    }

    /* ==========================================================
       4. 바통터치 — 짝이 부탁한 것
       ---------------------------------------------------------- */

    function batonItem() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_baton_records")) || []; }
        catch (e) { return null; }

        var me = (window.auth && window.auth.currentUser && window.auth.currentUser.uid) ||
                 localStorage.getItem("firebase_uid") || "";

        var waiting = recs.filter(function (r) {
            return r.status === "requested" && (!r.by || r.by !== me);
        });
        if (!waiting.length) return null;

        return { tool: "baton", icon: "🔄", label: "바통터치",
                 text: waiting.length === 1
                     ? esc(String(waiting[0].text).slice(0, 20)) + " 부탁받았어요"
                     : "부탁받은 게 " + waiting.length + "개 있어요",
                 color: PURPLE, urgent: false };
    }

    /* ==========================================================
       모으기
       ---------------------------------------------------------- */

    function gather() {
        var all = [openItem(), feverItem(), cubeItem(), batonItem()]
            .filter(Boolean);

        // 급한 것부터. 그리고 셋까지만.
        // 넷이 넘으면 넷 다 안 읽는다.
        all.sort(function (a, b) { return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0); });
        return all.slice(0, 3);
    }

    /* ---------- 화면 ---------- */

    function rowHTML(it) {
        return '<div onclick="window.switchTool(\'' + it.tool + '\')" ' +
            'style="display:flex; align-items:center; gap:10px; padding:11px 2px; cursor:pointer;">' +
            '<span style="font-size:17px; flex-shrink:0;">' + it.icon + '</span>' +
            '<span style="font-size:11.5px; font-weight:800; color:var(--text-sub); ' +
                'flex-shrink:0; width:52px;">' + esc(it.label) + '</span>' +
            '<span style="flex:1; min-width:0; font-size:13px; font-weight:800; ' +
                'color:' + it.color + '; line-height:1.45; word-break:keep-all;">' + it.text + '</span>' +
            '<span style="font-size:11px; color:var(--text-sub); flex-shrink:0;">〉</span>' +
        '</div>';
    }

    function cardHTML(items) {
        var rows = items.map(rowHTML).join(
            '<div style="height:1px; background:var(--border); opacity:0.55;"></div>');

        return '<div id="' + CARD_ID + '" ' +
            'style="background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:18px; padding:14px 16px; margin-bottom:18px;">' +
            '<div style="font-size:11.5px; font-weight:900; color:var(--text-sub); ' +
                'letter-spacing:0.3px; margin-bottom:4px;">지금 챙길 것</div>' +
            rows +
        '</div>';
    }

    /* ---------- 자리 잡기 ---------- */

    function mount() {
        var box = document.getElementById("tab-toolbox");
        if (!box) return;

        var old = document.getElementById(CARD_ID);
        var items = gather();

        if (!items.length) { if (old) old.remove(); return; }

        var shell = box.firstElementChild || box;

        // 도구 버튼 줄을 찾아 그 앞에 놓는다
        var anchor = document.getElementById("btn-tool-money");
        while (anchor && anchor.parentNode && anchor.parentNode !== shell) anchor = anchor.parentNode;

        var wrap = document.createElement("div");
        wrap.innerHTML = cardHTML(items);
        var el = wrap.firstChild;

        if (old) { old.parentNode.replaceChild(el, old); return; }
        if (anchor && anchor.parentNode === shell) shell.insertBefore(el, anchor);
        else shell.insertBefore(el, shell.firstChild);
    }

    window.refreshToolBrief = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1800);
        setTimeout(mount, 4000);
        setInterval(mount, 60000);      // 남은 시간이 줄어드는 게 보이게

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 400);
        });

        // 도구를 쓰면 바로 갱신
        ["addFeverRecord", "addOpenRecord", "deleteOpenRecord",
         "addCubeRecord", "useCube", "addQuickBaton", "acceptBaton"].forEach(function (n) {
            var orig = window[n];
            if (typeof orig !== "function" || orig.__brief) return;
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                setTimeout(mount, 250);
                return out;
            };
            wrapped.__brief = true;
            window[n] = wrapped;
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.briefDebug = function () {
        var all = { 언제깠지: openItem(), 해열제: feverItem(), 냉동실: cubeItem(), 바통터치: batonItem() };
        Object.keys(all).forEach(function (k) {
            var v = all[k];
            console.log("  " + k + ":", v ? (v.urgent ? "🔴 " : "· ") + v.text : "알릴 것 없음");
        });
        console.log("화면에 뜰 개수:", gather().length + "개 (최대 3)");
        console.log("카드 떠 있음:", !!document.getElementById(CARD_ID));
    };
})();