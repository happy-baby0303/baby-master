/* ============================================================
   육아메이트 — 육퇴 시계 (bedtime.js)

   편지는 정해진 시각에 오는 게 아니라,
   그 집 아이가 잠든 뒤에 도착한다.

   기존 코드는 한 줄도 고치지 않는다.
   index.html 에서 memorybox.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var MIN_RECORDS = 3;            // 오늘 기록이 이만큼은 있어야 편지가 온다
    var EARLIEST    = 17 * 60;      // 이 시각 전은 육퇴로 보지 않는다 (낮잠 오인 방지)
    var LATEST      = 23 * 60 + 30; // 이 시각이 넘으면 그냥 지금이 육퇴다
    var FALLBACK    = 20 * 60;      // 아직 배울 게 없을 때의 기본값
    var LEARN_DAYS  = 14;           // 이만큼 거슬러 올라가 그 집 시계를 배운다
    var MIN_SAMPLES = 3;            // 표본이 이만큼은 있어야 믿는다
    var NIGHT_MIN   = 60;           // 60분 넘게 잔 것만 밤잠 후보

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() {
        return localStorage.getItem("tosil_babyName") || "우리 아기";
    }

    function records() {
        try { return JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; }
        catch (e) { return []; }
    }

    function dayStart(d) {
        var x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x.getTime();
    }

    function dayKey(ts) {
        var d = new Date(ts);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function todayKey() { return dayKey(Date.now()); }

    // 자정 기준 몇 분째인가
    function minOfDay(ts) {
        var d = new Date(ts);
        return d.getHours() * 60 + d.getMinutes();
    }

    function hhmm(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        var ap = h < 12 ? "오전" : "오후";
        var hh = h % 12; if (hh === 0) hh = 12;
        return ap + " " + hh + "시" + (m ? " " + m + "분" : "");
    }

    function isSleep(r) { return r && r.type === "sleep"; }

    function sleepMins(r) {
        if (r.endTs) return Math.round((Number(r.endTs) - Number(r.timestamp)) / 60000);
        return Number(r.amount) || 0;
    }

    // 아직 안 끝난 잠 (타이머 도는 중)
    function isOngoing(r) {
        return isSleep(r) && !r.endTs && !r.amount;
    }

    /* ---------- 1. 오늘 밤잠이 시작됐는가 ---------- */

    function tonightSleepStart() {
        var s0 = dayStart(Date.now());
        var best = null;

        records().forEach(function (r) {
            if (!isSleep(r)) return;
            var ts = Number(r.timestamp);
            if (!ts || ts < s0) return;

            var m = minOfDay(ts);
            if (m < EARLIEST) return;                       // 저녁 이후에 시작한 것만

            // 재우는 중이면 그 자체로 육퇴. 끝난 잠은 충분히 길어야 밤잠으로 본다.
            if (!isOngoing(r) && sleepMins(r) < NIGHT_MIN) return;

            if (!best || ts > best) best = ts;
        });

        return best;
    }

    /* ---------- 2. 그 집 시계를 배운다 ---------- */

    // 지난 며칠, 저녁에 시작한 마지막 잠이 몇 시였는지 모아 중앙값을 낸다.
    // 평균이 아니라 중앙값인 건, 하루 늦게 잔 날에 시계 전체가 밀리면 안 되기 때문.
    function learnedBedtime() {
        var recs = records();
        if (!recs.length) return null;

        var today = dayStart(Date.now());
        var floor = today - LEARN_DAYS * 86400000;
        var perDay = {};

        recs.forEach(function (r) {
            if (!isSleep(r)) return;
            var ts = Number(r.timestamp);
            if (!ts || ts < floor || ts >= today) return;
            if (sleepMins(r) < NIGHT_MIN) return;

            var m = minOfDay(ts);
            if (m < EARLIEST || m > LATEST) return;

            var k = dayKey(ts);
            if (!perDay[k] || m > perDay[k]) perDay[k] = m;  // 그날의 마지막 밤잠
        });

        var vals = Object.keys(perDay).map(function (k) { return perDay[k]; }).sort(function (a, b) { return a - b; });
        if (vals.length < MIN_SAMPLES) return null;

        var mid = Math.floor(vals.length / 2);
        return vals.length % 2 ? vals[mid] : Math.round((vals[mid - 1] + vals[mid]) / 2);
    }

    /* ---------- 3. 지금이 육퇴인가 ---------- */

    // 다른 파일에서도 쓸 수 있게 열어둔다 (emotion.js 의 LETTER_HOUR 대체용)
    window.getBedtimeMinutes = function () {
        var learned = learnedBedtime();
        return learned == null ? FALLBACK : learned;
    };

    window.isWindDownTime = function () {
        var now = minOfDay(Date.now());
        if (now < EARLIEST) return false;          // 새벽·낮에는 절대 안 뜬다
        if (tonightSleepStart()) return true;      // 재웠으면 그 순간부터
        if (now >= LATEST) return true;            // 아직 기록이 없어도 이 시각이면 육퇴
        return now >= window.getBedtimeMinutes();  // 배운 시계 기준
    };

    /* ---------- 4. 읽음 상태 ---------- */

    function readKey() { return "tosil_letter_read_" + todayKey(); }
    function isRead()  { return !!localStorage.getItem(readKey()); }
    function markRead() {
        try { localStorage.setItem(readKey(), String(Date.now())); } catch (e) {}
    }

    function arrivedAt() {
        var ts = tonightSleepStart();
        return hhmm(ts ? minOfDay(ts) : window.getBedtimeMinutes());
    }

    /* ---------- 5. CSS 우선순위 되찾기 ----------
       index.html 의 button[onclick*="openReceiptModal"] 안에
       display:flex !important 가 있어서 JS 가 숨길 수 없었다.
       ID 선택자로 특이도를 이겨서 제어권을 되가져온다. -------- */

    (function ensureCSS() {
        if (document.getElementById("bedtime-css")) return;
        var s = document.createElement("style");
        s.id = "bedtime-css";
        s.textContent =
            '#receipt-banner-btn{display:none !important;}' +
            '#receipt-banner-btn.letter-in{' +
                'display:flex !important;flex-direction:column !important;gap:5px !important;' +
                'animation:letterArrive .8s cubic-bezier(.16,1,.3,1) both;}' +
            '@keyframes letterArrive{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}' +
            '@media (prefers-reduced-motion:reduce){#receipt-banner-btn.letter-in{animation:none;}}';
        document.head.appendChild(s);
    })();

    /* ---------- 6. 배너 ---------- */

    function todayRecordCount() {
        var s0 = dayStart(Date.now());
        return records().filter(function (r) { return Number(r.timestamp) >= s0; }).length;
    }

    function shouldShow() {
        if (document.body && document.body.classList.contains("mode-senior")) return false;
        if (todayRecordCount() < MIN_RECORDS) return false;
        return window.isWindDownTime();
    }

    function applyBanner() {
        var btn = document.getElementById("receipt-banner-btn");
        if (!btn) return;

        if (!shouldShow()) {
            btn.classList.remove("letter-in");
            return;
        }

        var read = isRead();
        btn.innerHTML =
            '<span style="font-size:16px; font-weight:800; letter-spacing:-0.5px;">' +
                (read ? "오늘 영수증 다시 보기"
                      : esc(babyName()) + "가 영수증을 두고 갔어요") +
            '</span>' +
            '<span style="font-size:12px; font-weight:600; opacity:0.62;">' +
                (read ? arrivedAt() + "에 도착했어요"
                      : "이제 좀 앉으셨죠. 천천히 읽어보세요") +
            '</span>';

        var wasHidden = !btn.classList.contains("letter-in");
        btn.classList.add("letter-in");

        // 도착은 하루 한 번만 알린다
        if (wasHidden && !read) notifyOnce();
    }

    function notifyOnce() {
        var k = "tosil_letter_ping_" + todayKey();
        if (localStorage.getItem(k)) return;
        try { localStorage.setItem(k, "1"); } catch (e) {}
        if (typeof window.showToast === "function") {
            window.showToast("🧾 " + babyName() + "의 오늘 하루, 정산 완료 🌙");
        }
    }

    /* ---------- 7. 기존 함수에 얹기 (원본 수정 없음) ---------- */

    window.checkReceiptVisibility = applyBanner;

    var origOpen = window.openReceiptModal;
    window.openReceiptModal = function () {
        var out;
        try {
            if (typeof origOpen === "function") out = origOpen.apply(this, arguments);
        } finally {
            markRead();
            try { applyBanner(); } catch (e) {}
        }
        return out;
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyBanner);
    } else {
        applyBanner();
    }
    setInterval(applyBanner, 60000);   // 육퇴에 올라오고, 자정에 내려간다

    /* ---------- 점검용 ---------- */
    window.bedtimeDebug = function () {
        var learned = learnedBedtime();
        console.log("배운 육퇴 시각:", learned == null ? "표본 부족 → " + hhmm(FALLBACK) : hhmm(learned));
        console.log("오늘 밤잠 시작:", tonightSleepStart() ? new Date(tonightSleepStart()).toLocaleTimeString() : "아직");
        console.log("지금 육퇴인가:", window.isWindDownTime());
        console.log("오늘 기록 수:", todayRecordCount());
        console.log("오늘 편지 읽음:", isRead());
    };
})();