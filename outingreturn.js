/* ============================================================
   배냇함 — 돌아와서 알림 (outingreturn.js)

   "돌아와서" 체크리스트를 만들었는데,
   그걸 보려면 나들이 탭에 다시 들어와야 한다.

   짐 든 채로 우는 아기를 안고 현관에 서 있는 사람이
   앱을 열고 → 나들이 탭 → 체크리스트 → 탭 밀어서 찾기?
   안 한다. 만든 사람만 쓰는 기능이 된다.

   먼저 말을 걸어야 한다.

   어떻게
     · 나갈 때 외출 예상 시간을 고른다 (이미 있는 기능)
     · 그 시간이 지나면 알림이 온다
     · 1박 2일이면 다음 날 아침에 온다
     · 눌러서 바로 "돌아와서" 목록이 열린다

   ⚠️ 서버 예약을 새로 만들지 않는다.
      Functions 를 하나 더 붙이면 배포·비용·디버깅이 또 늘어난다.
      앱을 열 때 시간이 지났으면 그때 알린다.
      어차피 집에 오면 폰을 본다.

   index.html 에서 script.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var KEY   = "tosil_outing_plan";     // { startAt, hours, theme, done }
    var PURPLE = "#7F77DD";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function plan() {
        try { return JSON.parse(localStorage.getItem(KEY)) || null; }
        catch (e) { return null; }
    }

    function save(p) {
        try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
    }

    /* ---------- 나갈 때 ----------
       체크리스트를 열고 하나라도 체크하면 "나갈 준비 중" 으로 본다.
       따로 '출발' 버튼을 만들면 아무도 안 누른다. -------- */

    window.startOuting = function (theme, hours) {
        var t = theme || window.currentChecklistTheme || "basic";
        if (t === "comeback") return;                    // 돌아와서 탭은 출발이 아니다

        var h = Number(hours || window.outingHours || 4);

        // 1박 2일은 다음 날 아침 10시에 알린다.
        // 밤 11시에 "돌아와서 할 일" 을 알리면 그건 방해다.
        var at;
        if (t === "stay") {
            var d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(10, 0, 0, 0);
            at = d.getTime();
        } else {
            at = Date.now() + h * 3600000;
        }

        save({ startAt: Date.now(), remindAt: at, hours: h, theme: t, done: false });
    };

    window.cancelOuting = function () {
        var p = plan();
        if (!p) return;
        p.done = true;
        save(p);
        var el = document.getElementById("outing-return-card");
        if (el) el.remove();
    };

    /* ---------- 돌아올 때가 됐나 ---------- */

    function isDue() {
        var p = plan();
        if (!p || p.done) return false;
        if (Date.now() < p.remindAt) return false;

        // 하루가 더 지났으면 이미 늦었다. 조용히 접는다.
        if (Date.now() > p.remindAt + 20 * 3600000) {
            p.done = true; save(p);
            return false;
        }
        return true;
    }

    /* ---------- 폰 알림 ---------- */

    async function push() {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        var p = plan();
        if (!p || p._pushed) return;

        try {
            var reg = await navigator.serviceWorker.getRegistration();
            var body = (p.theme === "stay")
                ? "짐 정리하기 전에 확인해 보세요"
                : "돌아와서 할 일을 확인해 볼까요";

            if (reg) {
                await reg.showNotification("나들이는 즐거우셨나요?", {
                    body: body,
                    icon: "/icon-192x192.png",
                    badge: "/icon-192x192.png",
                    tag: "outing-return"
                });
            } else {
                new Notification("나들이는 즐거우셨나요?", { body: body, icon: "/icon-192x192.png" });
            }
            p._pushed = true;
            save(p);
        } catch (e) {
            console.warn("[돌아와서] 알림 실패", e);
        }
    }

    /* ---------- 홈 카드 ----------
       알림을 못 봤거나 껐어도 앱을 열면 보이게 한다. -------- */

    function cardHTML() {
        var p = plan();
        var hours = p ? p.hours : 4;

        return '<div id="outing-return-card" ' +
            'style="display:flex; align-items:center; gap:13px; background:#F0EEFB; ' +
            'border:1px solid #DDD9F5; border-radius:20px; padding:15px 16px; margin-bottom:24px;">' +

            '<div style="font-size:20px; flex-shrink:0;">🏠</div>' +

            '<div style="flex:1; min-width:0; cursor:pointer;" onclick="window.openComebackList()">' +
                '<div style="font-size:14px; font-weight:900; color:#6A61CE; letter-spacing:-0.3px; ' +
                    'word-break:keep-all; line-height:1.4;">나들이는 즐거우셨나요?</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px; ' +
                    'word-break:keep-all; line-height:1.5;">돌아와서 할 일을 확인해 보세요</div>' +
            '</div>' +

            '<div onclick="window.cancelOuting()" ' +
                'style="font-size:18px; font-weight:300; color:var(--text-sub); ' +
                'flex-shrink:0; cursor:pointer; padding:0 4px; line-height:1;">×</div>' +
        '</div>';
    }

    window.openComebackList = function () {
        var el = document.getElementById("outing-return-card");
        if (el) el.remove();
        window.cancelOuting();

        if (typeof window.switchTab === "function") window.switchTab("hotplace");
        setTimeout(function () {
            if (typeof window.openChecklistModal === "function") {
                window.openChecklistModal("comeback");
            }
        }, 300);
    };

    function mount() {
        var old = document.getElementById("outing-return-card");

        if (!isDue()) { if (old) old.remove(); return; }
        push();

        var anchor = document.getElementById("baby-dashboard") ||
                     document.getElementById("now-status-card");
        if (!anchor) return;

        var home = document.getElementById("tab-home");
        var block = anchor;
        while (block && block.parentNode && block.parentNode !== home) block = block.parentNode;
        if (!block || block.parentNode !== home) block = anchor;

        var box = document.createElement("div");
        box.innerHTML = cardHTML();
        var el = box.firstChild;

        if (old) old.parentNode.replaceChild(el, old);
        else block.parentNode.insertBefore(el, block.nextSibling);
    }

    window.refreshOutingCard = mount;

    /* ---------- 체크리스트를 쓰면 '나갈 준비 중' 으로 본다 ---------- */

    function hookChecklist() {
        var orig = window.toggleCheckItem;
        if (typeof orig !== "function" || orig.__outing) return;

        var wrapped = function (index) {
            var out = orig.apply(this, arguments);
            var t = window.currentChecklistTheme;
            // 나갈 준비 목록에서 하나라도 체크하면 출발로 본다.
            // 별도 '출발' 버튼을 만들면 아무도 안 누른다.
            if (t && t !== "comeback") {
                var p = plan();
                if (!p || p.done || p.theme !== t) window.startOuting(t);
            }
            setTimeout(mount, 200);
            return out;
        };
        wrapped.__outing = true;
        window.toggleCheckItem = wrapped;
    }

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(hookChecklist, 1500);
        setTimeout(mount, 2000);
        setInterval(mount, 5 * 60000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 400);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.outingDebug = function () {
        var p = plan();
        if (!p) return console.log("예정된 나들이 없음 — 체크리스트에서 항목을 하나 체크해 보세요");
        console.log("테마:", p.theme, "/ 예상", p.hours + "시간");
        console.log("출발:", new Date(p.startAt).toLocaleString());
        console.log("알릴 때:", new Date(p.remindAt).toLocaleString());
        var left = Math.round((p.remindAt - Date.now()) / 60000);
        console.log(left > 0 ? "남은 시간: " + left + "분" : "이미 지남 (" + (-left) + "분 전)");
        console.log("끝냄:", p.done, "/ 알림 보냄:", !!p._pushed);
        console.log("카드 떠 있음:", !!document.getElementById("outing-return-card"));
        console.log("\n지금 바로 띄워보려면:  outingTest()");
    };

    window.outingTest = function () {
        save({ startAt: Date.now() - 3600000, remindAt: Date.now() - 60000,
               hours: 1, theme: "water", done: false });
        mount();
        console.log("테스트 카드를 띄웠습니다");
    };
})();