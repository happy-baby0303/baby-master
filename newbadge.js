/* ============================================================
   배냇함 — 새 소식 뱃지 (newbadge.js)

   보관함 여섯 칸이 있는데, 안에 뭐가 새로 들어와도 알 길이 없다.
   짝꿍이 문답을 남겨도 눌러봐야 안다.
   그래서 안 누르고, 안 누르니까 안 쌓인다.

   빨간 점 하나가 그걸 깬다.

   판단 기준
     · 내가 마지막으로 그 함을 열어본 시각을 기억한다
     · 그 뒤에 들어온 게 있으면 점을 찍는다
     · 내가 넣은 건 세지 않는다. 내 것에 새 소식이라고 하면 이상하다

   memorybox.js 는 한 줄도 안 고친다. 다 그려진 뒤에 점만 얹는다.

   index.html 에서 memorybox.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var SEEN_KEY = "tosil_box_seen";      // { 편지함: 1755..., 소리함: ... }
    var DOT_ID   = "bnh-new-dot";

    function suffix() { return window.currentBabySuffix || ""; }
    function key() { return SEEN_KEY + suffix(); }

    function myUid() {
        return (window.auth && window.auth.currentUser && window.auth.currentUser.uid) ||
               localStorage.getItem("firebase_uid") || "";
    }

    /* ---------- 언제 열어봤나 ---------- */

    function seen() {
        try {
            var v = JSON.parse(localStorage.getItem(key()));
            return (v && typeof v === "object") ? v : {};
        } catch (e) { return {}; }
    }

    function markSeen(label) {
        var s = seen();
        s[label] = Date.now();
        try { localStorage.setItem(key(), JSON.stringify(s)); } catch (e) {}
    }
    window.markBoxSeen = markSeen;

    /* ---------- 함마다 '마지막으로 들어온 시각' 세기 ----------
       내가 넣은 건 빼고 본다. -------- */

    function latestOf(list, tsField, byField) {
        var me = myUid(), newest = 0;
        (list || []).forEach(function (x) {
            if (!x) return;
            if (me && byField && x[byField] && x[byField] === me) return;   // 내가 넣은 건 제외
            var t = Number(x[tsField] || x.ts || x.at || x.createdAt || 0);
            if (t > newest) newest = t;
        });
        return newest;
    }

    function voiceLatest() {
        if (typeof window.voiceDays !== "function") return 0;
        var newest = 0;
        window.voiceDays().forEach(function (k) {
            (window.getDayVoices(k) || []).forEach(function (v) {
                var t = Number(v.ts || 0);
                if (t > newest) newest = t;
            });
        });
        return newest;
    }

    function letterLatest() {
        var list = [];
        if (typeof window.sealedLetters === "function") { try { list = window.sealedLetters() || []; } catch (e) {} }
        var newest = 0;
        list.forEach(function (l) {
            // 이미 열어본 편지는 새 소식이 아니다
            if (l.opened) return;
            var t = Number(l.ts || l.at || l.createdAt || 0);
            if (t > newest) newest = t;
        });
        return newest;
    }

    function diaryLatest() {
        if (typeof window.diaryEntries !== "function") return 0;
        var newest = 0;
        try {
            window.diaryEntries().forEach(function (e) {
                var t = Number(e.ts || 0);
                if (t > newest) newest = t;
            });
        } catch (e) {}
        return newest;
    }

    function wordsLatest() {
        if (typeof window.firstWords !== "function") return 0;
        var newest = 0;
        try {
            window.firstWords().forEach(function (w) {
                var t = Number(w.ts || 0);
                if (t > newest) newest = t;
            });
        } catch (e) {}
        return newest;
    }

    /* ---------- 함별 판정 ---------- */

    var BOXES = {
        "편지함": letterLatest,
        "소리함": voiceLatest,
        "문답함": diaryLatest,
        "첫 도감": null,     // 도감은 도장이 곧 알림이라 점을 안 찍는다
        "포토북": null,
        "잠 무늬": null
    };

    function isNew(label) {
        var fn = BOXES[label];
        if (typeof fn !== "function") return false;

        var latest = fn();
        if (!latest) return false;

        var s = seen()[label];

        // 한 번도 안 열어봤는데 내용이 있으면 새 소식이다
        if (!s) return true;
        return latest > s;
    }

    /* ---------- 점 찍기 ---------- */

    function dot() {
        var d = document.createElement("span");
        d.className = DOT_ID;
        d.style.cssText = "position:absolute; top:9px; right:10px; width:8px; height:8px; " +
            "border-radius:50%; background:#F04452; box-shadow:0 0 0 2px var(--bg-card);";
        return d;
    }

    function paint() {
        // 보관함 칸은 '3열 격자 안의, 글자가 함 이름인 칸'으로 찾는다
        var labels = Object.keys(BOXES);
        var cards = document.querySelectorAll('#tab-memorybox div[onclick]');

               for (var i = 0; i < cards.length; i++) {
            var c = cards[i];

            // 카드 안의 '이름 줄'을 직접 찾는다.
            // textContent 는 이모지·설명까지 다 붙어 나와서 맨 앞 비교가 안 먹는다.
            var hit = null;
            var divs = c.querySelectorAll("div");
            for (var d = 0; d < divs.length && !hit; d++) {
                var t = (divs[d].textContent || "").trim();
                for (var j = 0; j < labels.length; j++) {
                    if (t === labels[j]) { hit = labels[j]; break; }
                }
            }
            if (!hit) continue;

            // 눌렀을 때 '봤다'로 기록되게 한 번만 걸어둔다
            if (!c.getAttribute("data-box-label")) {
                c.setAttribute("data-box-label", hit);
                c.addEventListener("click", function () {
                    var l = this.getAttribute("data-box-label");
                    if (l) { markSeen(l); setTimeout(paint, 400); }
                }, false);
            }

            if (getComputedStyle(c).position === "static") c.style.position = "relative";

            var old = c.querySelector("." + DOT_ID);
            var want = isNew(hit);

            if (want && !old) c.appendChild(dot());
            else if (!want && old) old.remove();
        }
    }

    window.refreshNewBadges = paint;

    /* ---------- 다시 그려도 따라가기 ---------- */

    var pending = null;
    function schedule() {
        if (pending) return;
        pending = setTimeout(function () { pending = null; paint(); }, 200);
    }

      function boot() {
        setInterval(paint, 1200);        // 👈 이 줄 추가

        setTimeout(paint, 1500);
        setTimeout(paint, 3500);

        // 배냇함을 다시 그리면 점도 다시 찍는다
        var orig = window.renderMemoryBox;
        if (typeof orig === "function" && !orig.__badged) {
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                schedule();
                return out;
            };
            wrapped.__badged = true;
            window.renderMemoryBox = wrapped;
        }

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) schedule();
        });

        setInterval(paint, 60000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.badgeDebug = function () {
        var s = seen();
        Object.keys(BOXES).forEach(function (l) {
            var fn = BOXES[l];
            if (typeof fn !== "function") return console.log("  " + l + ": (점 안 찍음)");
            var latest = fn();
            console.log("  " + l + ": " +
                (latest ? new Date(latest).toLocaleString() : "내용 없음") +
                "  /  마지막으로 본 때: " + (s[l] ? new Date(s[l]).toLocaleString() : "없음") +
                "  →  " + (isNew(l) ? "🔴 새 소식" : "없음"));
        });
        console.log("초기화하려면: localStorage.removeItem('" + key() + "')");
    };
})();