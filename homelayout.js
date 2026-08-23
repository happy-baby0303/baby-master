/* ============================================================
   배냇함 — 홈 정리 (homelayout.js)

   홈에 앱이 두 개 겹쳐 있었다.
     하나는 오늘 하루짜리 게임 — 레벨, EXP, 아내 상태, 미션
     하나는 20년짜리 아카이브 — D+171, 배냇함, 도감, 편지

   둘 다 좋은데 한 화면에 있으면 서로를 깎아먹는다.
   특히 뒤쪽이 다친다. 스무 살에 열릴 편지 바로 위에
   "Lv.1 신입 육아 요원 50 EXP" 가 있으면 편지의 무게가 안 실린다.

   그래서 순서를 바꾼다. 지우는 게 아니라 옮기는 것.

   하는 일 셋
     1. TODAY'S BRIEFING 을 홈에서 내린다 — 아내 상태가 아빠 퀘스트와 중복이다
     2. 아빠 퀘스트 블록을 맨 아래로 — 퇴근 완료 버튼이 그 안에 있어 지우면 안 된다
     3. 기록 버튼과 배냇함을 위로 — 하루 열 번 쓰는 것이 위에 있어야 한다

   index.html 은 한 줄도 안 고친다.
   맨 마지막, fit.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 설정 ----------
       마음이 바뀌면 여기만 고치면 된다. -------- */

    var HIDE_BRIEFING   = true;   // TODAY'S BRIEFING 을 홈에서 내린다
    var HIDE_DAD_QUEST  = true;   // 아빠 작전 상황판을 홈에서 내린다
    var DAD_TO_BOTTOM   = false;  // (더 이상 안 씀 — 아예 내리므로)
    var COLLAPSE_DAD    = false;

    /* 홈에 놓일 순서.
       id 가 없는 덩어리는 그 안에 있는 id 로 찾는다. */
    var ORDER = [
        { find: "home-main-banner-wrapper", note: "공지 배너" },
        { find: "baby-dashboard",           note: "D+171 아기 카드" },
        { find: "now-status-card",          note: "지금 상태 (기록 버튼)" },
        { find: "home-memorybox-card",      note: "배냇함" },
        { find: "home-memory-card",         note: "그날의 오늘" },
        { find: "home-words-card",          note: "첫 단어 사전" },
        { find: "tracker-stats-container",  note: "통계" },
        { find: "routine-checklist-container", note: "루틴" },
        { find: "receipt-banner-btn",       note: "영수증·바통·도감·엽서·가계부" },
        { find: "dad-quest-container",      note: "아빠 작전 상황판" }
    ];

    /* ---------- 도구 ---------- */

    function home() { return document.getElementById("tab-home"); }

    // 그 요소를 품고 있는 '홈의 직계 덩어리' 를 찾는다
    function blockOf(id) {
        var h = home();
        if (!h) return null;
        var el = document.getElementById(id);
        if (!el) return null;

        var n = el;
        while (n && n.parentNode && n.parentNode !== h) {
            n = n.parentNode;
            if (n === document.body || !n.parentNode) return null;
        }
        return (n && n.parentNode === h) ? n : null;
    }

    /* ---------- 1. 중복된 브리핑 내리기 ----------
       "아내 상태" 가 아빠 퀘스트 안의 "오늘 이것만 해도 충분해요" 와 같은 얘기다.
       같은 말이 두 번 나오면 화면이 지저분해진다. 지우진 않는다. 숨긴다. -------- */

       function hideBriefing() {
        if (HIDE_BRIEFING) {
            var el = document.getElementById("dad-briefing-wrapper");
            if (el && el.style.display !== "none") el.style.display = "none";
        }
        if (HIDE_DAD_QUEST) {
            var q = document.getElementById("dad-quest-container");
            if (q && q.style.display !== "none") q.style.display = "none";
        }
    }

    /* ---------- 2. 아빠 퀘스트는 접어둔다 ----------
       Lv.1 에 50 EXP 는 보여줄 게 없다. 헤더 한 줄이면 충분하다.
       한 번만 정해준다. 사용자가 펼치면 그 뜻을 존중한다. -------- */

    (function collapseOnce() {
        if (!COLLAPSE_DAD) return;
        try {
            if (localStorage.getItem("tosil_dad_dashboard_collapsed") === null) {
                localStorage.setItem("tosil_dad_dashboard_collapsed", "true");
            }
        } catch (e) {}
    })();

    /* ---------- 3. 순서 다시 잡기 ---------- */

    var lastSig = "";

       function relayout() {
        var h = home();
        if (!h) return;

        hideBriefing();
        setTimeout(trimCards, 60);      // 카드가 다 붙은 뒤에 솎아낸다

        var blocks = [];
        var seen = [];

        for (var i = 0; i < ORDER.length; i++) {
            var item = ORDER[i];
            if (!DAD_TO_BOTTOM && item.find === "dad-quest-container") continue;

            var b = blockOf(item.find);
            if (!b) continue;
            if (seen.indexOf(b) > -1) continue;   // 같은 덩어리를 두 번 옮기지 않는다
            seen.push(b);
            blocks.push(b);
        }

        if (!blocks.length) return;

        // 지금 순서가 이미 맞으면 손대지 않는다 (건드릴수록 화면이 튄다)
        var sig = blocks.map(function (b) {
            return Array.prototype.indexOf.call(h.children, b);
        }).join(",");
        if (sig === lastSig) return;

        var ordered = blocks.slice();
        var current = ordered.map(function (b) {
            return Array.prototype.indexOf.call(h.children, b);
        });
        var already = current.every(function (v, i) {
            return i === 0 || v > current[i - 1];
        });
        if (already) { lastSig = sig; return; }

        // 목록에 없는 것들은 건드리지 않고, 목록에 있는 것만 순서대로 다시 꽂는다
        var anchor = blocks[0];
        for (var j = 1; j < blocks.length; j++) {
            var b2 = blocks[j];
            if (anchor.nextSibling !== b2) h.insertBefore(b2, anchor.nextSibling);
            anchor = b2;
        }

        lastSig = blocks.map(function (b) {
            return Array.prototype.indexOf.call(h.children, b);
        }).join(",");
    }

      window.relayoutHome = relayout;

    /* ---------- 카드 두 개까지만 ----------
       조건부 카드가 넷이다. 운 나쁜 날엔 한꺼번에 뜬다.
       넷이 쌓이면 넷 다 안 읽는다.

       급한 순서대로 위에서 둘만 남긴다.
       안 보이는 건 원래 오늘 안 급한 것들이다. -------- */

    var CARD_ORDER = [
        "home-expiry-alert",     // 기한 지남 — 오늘 알아야 한다
        "home-memorybox-card",   // 배냇함 — 이 앱의 이유
        "home-memory-card",      // 그날의 오늘 — 있으면 좋다
        "home-words-card"        // 첫 단어 — 언제 봐도 된다
    ];
    var MAX_CARDS = 2;

    function trimCards() {
        var shown = 0;
        for (var i = 0; i < CARD_ORDER.length; i++) {
            var el = document.getElementById(CARD_ORDER[i]);
            if (!el) continue;

            if (shown < MAX_CARDS) {
                if (el.style.display === "none") el.style.display = "";
                shown++;
            } else {
                if (el.style.display !== "none") el.style.display = "none";
            }
        }
    }

    window.trimHomeCards = trimCards;

    /* ---------- 시작 ----------
       home.js · memories.js · firstwords.js 가 카드를 늦게 꽂으므로
       몇 번 더 확인한다. 그 뒤엔 탭으로 돌아올 때만. -------- */

    function boot() {
        relayout();
        setTimeout(relayout, 900);
        setTimeout(relayout, 2000);
        setTimeout(relayout, 4000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(relayout, 300);
        });

        // 탭을 옮겨다니면 script.js 가 다시 그린다
              // 탭을 옮겨다니면 script.js 가 다시 그린다
        setInterval(relayout, 60000);

        // 카드는 늦게 붙는 것도 있어서 따로 더 자주 확인한다
        setInterval(trimCards, 3000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.layoutDebug = function () {
        var h = home();
        if (!h) return console.log("홈 탭 없음");
        console.log("=== 지금 홈 순서 ===");
        for (var i = 0; i < h.children.length; i++) {
            var c = h.children[i];
            if (c.style && c.style.display === "none") continue;
            var ids = [];
            var found = c.querySelectorAll ? c.querySelectorAll("[id]") : [];
            for (var j = 0; j < Math.min(3, found.length); j++) ids.push(found[j].id);
            console.log(
                (i + 1) + ". " + (c.id || "(id없음)") +
                (ids.length ? "  ← " + ids.join(", ") : "")
            );
        }
        console.log("브리핑 숨김:", HIDE_BRIEFING);
        console.log("아빠 퀘스트 접힘:", localStorage.getItem("tosil_dad_dashboard_collapsed"));
    };
})();