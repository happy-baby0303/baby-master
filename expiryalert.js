/* ============================================================
   배냇함 — 기한 알리미 (expiryalert.js)

   툴박스를 열어봤더니 이미 다 계산하고 있었다.
     퓨레 2일 · 분유 3주 · 안약 1달 · 시럽약 1달 …
   기한도, 남은 날도, 만료 개수까지 정확하다.

   그런데 그게 툴박스 → 언제깠지 탭 안에만 있다.
   부모는 그 탭을 안 연다. 기억이 나야 여는데,
   기억이 안 나서 만든 기능이기 때문이다.

   특히 퓨레는 2일이다. 상하면 아기가 탈이 난다.
   앱이 알고 있으면서 가만히 있는 건 만들다 만 것이다.

   계산은 script.js 것을 그대로 쓴다. 자리만 옮긴다.

   index.html 에서 monthcard.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var CARD_ID = "home-expiry-alert";
    var SNOOZE  = "tosil_expiry_snooze";   // 오늘은 그만 보기
    var RED     = "#D32F2F";
    var GOLD    = "#B98A2E";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    /* ---------- 남은 날 세기 ----------
       script.js 의 renderOpenList 와 같은 방식으로 센다. -------- */

    function scan() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_open_records")) || []; }
        catch (e) { return { expired: [], soon: [] }; }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var expired = [], soon = [];

      recs.forEach(function (r) {
            if (!r || !r.openDate || !r.limitDays) return;
            var open = new Date(r.openDate);
            open.setHours(0, 0, 0, 0);
            if (isNaN(open.getTime())) return;

            var passed = Math.floor((today - open) / 86400000);
            var left = r.limitDays - passed;

            if (left < 0) {
                expired.push({ r: r, left: left });
            }
            // 사흘 전 예고는 끈다.
            // 노란 카드가 자주 뜨면 사람이 무시하기 시작하고,
            // 그러면 정작 빨간 카드도 안 보게 된다.
            // 되살리려면 아래 줄의 주석을 푸세요.
            // else if (left <= 3) soon.push({ r: r, left: left });
              }); 
    
        soon.sort(function (a, b) { return a.left - b.left; });
        return { expired: expired, soon: soon };
    }

    /* ---------- 오늘은 그만 보기 ---------- */

    window.snoozeExpiryAlert = function () {
        try { localStorage.setItem(SNOOZE, todayKey()); } catch (e) {}
        var el = document.getElementById(CARD_ID);
        if (el) el.remove();
    };

    function snoozed() {
        return localStorage.getItem(SNOOZE) === todayKey();
    }

    /* ---------- 카드 ---------- */

    function cardHTML(s) {
        var isBad = s.expired.length > 0;
        var color = isBad ? RED : GOLD;
        var bg    = isBad ? "#FFF0F1" : "#FDF9EE";
        var line  = isBad ? "#FFD9DC" : "#F0DFB8";

        var head, body;

        if (isBad) {
            var names = s.expired.map(function (x) { return x.r.name; });
            head = "기한이 지난 게 " + s.expired.length + "개 있어요";
            body = esc(names.slice(0, 3).join(", ")) +
                   (names.length > 3 ? " 외 " + (names.length - 3) + "개" : "") +
                   " — 쓰기 전에 확인해 주세요";
        } else {
            var f = s.soon[0];
            head = esc(f.r.name) + (f.left === 0 ? " 오늘까지예요" : " " + f.left + "일 남았어요");
            body = s.soon.length > 1
                ? "사흘 안에 끝나는 게 " + s.soon.length + "개 있어요"
                : "뜯은 지 " + (f.r.limitDays - f.left) + "일 됐어요";
        }

        return '<div id="' + CARD_ID + '" ' +
            'style="display:flex; align-items:center; gap:13px; background:' + bg + '; ' +
            'border:1px solid ' + line + '; border-radius:20px; padding:15px 16px; margin-bottom:24px;">' +

            '<div style="font-size:20px; flex-shrink:0;">' + (isBad ? "🚨" : "⏳") + '</div>' +

            '<div style="flex:1; min-width:0; cursor:pointer;" onclick="window.goToOpenTool()">' +
                '<div style="font-size:14px; font-weight:900; color:' + color + '; letter-spacing:-0.3px; ' +
                    'word-break:keep-all; line-height:1.4;">' + head + '</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px; ' +
                    'word-break:keep-all; line-height:1.5;">' + body + '</div>' +
            '</div>' +

            '<div onclick="window.snoozeExpiryAlert()" ' +
                'style="font-size:18px; font-weight:300; color:var(--text-sub); ' +
                'flex-shrink:0; cursor:pointer; padding:0 4px; line-height:1;">×</div>' +
        '</div>';
    }

    /* ---------- 툴박스로 보내기 ---------- */

    window.goToOpenTool = function () {
        try {
            if (typeof window.switchTab === "function") window.switchTab("toolbox");
            setTimeout(function () {
                if (typeof window.switchTool === "function") window.switchTool("cube");
            }, 250);
        } catch (e) {}
    };

    /* ---------- 자리 잡기 ----------
       홈 맨 위, D+일수 카드 바로 아래. 기한은 오늘 알아야 한다. -------- */

    function mount() {
        var old = document.getElementById(CARD_ID);

        if (snoozed()) { if (old) old.remove(); return; }

        var s = scan();
        if (!s.expired.length && !s.soon.length) { if (old) old.remove(); return; }

        var anchor = document.getElementById("baby-dashboard") ||
                     document.getElementById("now-status-card");
        if (!anchor) return;

        // 홈의 직계 덩어리까지 올라간다
        var home = document.getElementById("tab-home");
        var block = anchor;
        while (block && block.parentNode && block.parentNode !== home) block = block.parentNode;
        if (!block || block.parentNode !== home) block = anchor;

        var box = document.createElement("div");
        box.innerHTML = cardHTML(s);
        var el = box.firstChild;

        if (old) old.parentNode.replaceChild(el, old);
        else block.parentNode.insertBefore(el, block.nextSibling);
    }

    window.refreshExpiryAlert = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1800);
        setTimeout(mount, 4000);
        setInterval(mount, 5 * 60000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 400);
        });

        // 언제깠지에서 뭘 추가·삭제하면 바로 반영
        ["addOpenRecord", "deleteOpenRecord", "renderOpenList"].forEach(function (n) {
            var orig = window[n];
            if (typeof orig !== "function" || orig.__expiry) return;
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                setTimeout(mount, 200);
                return out;
            };
            wrapped.__expiry = true;
            window[n] = wrapped;
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.expiryDebug = function () {
        var s = scan();
        console.log("기한 지남:", s.expired.length + "개");
        s.expired.forEach(function (x) { console.log("  " + x.r.name + ": " + Math.abs(x.left) + "일 지남"); });
        console.log("사흘 안쪽:", s.soon.length + "개");
        s.soon.forEach(function (x) { console.log("  " + x.r.name + ": " + x.left + "일 남음"); });
        console.log("오늘 그만 보기:", snoozed() ? "켜짐" : "꺼짐");
        console.log("카드 떠 있음:", !!document.getElementById(CARD_ID));
    };
})();