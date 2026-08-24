/* ============================================================
   배냇함 — 수면 상태 함께 보기 (sleepsync.js)

   "지금 재우는 중" 표시등이 그 폰에만 있었다.

     아내 폰: 재우기 시작 → tosil_sleep_start 저장
     남편 폰: 아기 깼다고 완료 누름 → 남편 폰엔 그 표시등이 없다
     아내 폰: 영영 "자는 중"

   누른 사람과 끝낸 사람이 다르면 안 풀린다.
   부부가 번갈아 보는 앱인데 상태가 한쪽에만 있었던 것이다.

   고치는 방법
     그 두 키를 가로채서, 쓸 때 서버에도 적고
     서버가 바뀌면 내 폰에도 반영한다.

   script.js 의 33군데를 하나도 안 고친다.
   localStorage 를 감싸서 그 두 키만 낚아챈다.

   ⚠️ script.js 보다 먼저 로드해야 한다.
      index.html 에서 <script src="script.js"> 바로 '앞'에 넣으세요.
   ============================================================ */
(function () {
    'use strict';

    var KEYS  = ["tosil_sleep_start", "tosil_sleep_type"];
    var QUIET = false;      // 서버에서 받아 쓰는 중엔 되쏘지 않는다

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    function ref() {
        var code = syncCode();
        if (!code || !window.db || typeof window.doc !== "function") return null;
        return window.doc(window.db, "settings_" + code + suffix(), "sleep_now");
    }

    function myUid() {
        return (window.auth && window.auth.currentUser && window.auth.currentUser.uid) ||
               localStorage.getItem("firebase_uid") || "";
    }

    /* ---------- 지금 상태를 서버에 적는다 ---------- */

    var pushTimer = null;

    function pushSoon() {
        if (QUIET) return;
        if (pushTimer) clearTimeout(pushTimer);
        // 한 동작에 두 키를 연달아 쓰므로 잠깐 모았다가 한 번만 올린다
        pushTimer = setTimeout(pushNow, 400);
    }

    async function pushNow() {
        var r = ref();
        if (!r || typeof window.setDoc !== "function") return;

        var start = localStorage.getItem(KEYS[0]);
        var type  = localStorage.getItem(KEYS[1]);

        try {
            await window.setDoc(r, {
                start: start ? Number(start) : null,
                type: type || null,
                by: myUid(),
                at: Date.now()
            });
        } catch (e) {
            console.warn("[수면] 상태 올리기 실패", e);
        }
    }

    window.pushSleepState = pushNow;

    /* ---------- localStorage 가로채기 ----------
       그 두 키만 낚아챈다. 나머지는 원래대로 흘려보낸다. -------- */

    (function hook() {
        var proto = window.Storage && window.Storage.prototype;
        if (!proto || proto.__sleepHooked) return;

        var origSet = proto.setItem;
        var origDel = proto.removeItem;

        proto.setItem = function (k, v) {
            var out = origSet.apply(this, arguments);
            if (this === window.localStorage && KEYS.indexOf(k) > -1) pushSoon();
            return out;
        };

        proto.removeItem = function (k) {
            var out = origDel.apply(this, arguments);
            if (this === window.localStorage && KEYS.indexOf(k) > -1) pushSoon();
            return out;
        };

        proto.__sleepHooked = true;
    })();

    /* ---------- 서버가 바뀌면 내 폰도 따라간다 ---------- */

    function applyRemote(d) {
        var curStart = localStorage.getItem(KEYS[0]);
        var newStart = d.start ? String(d.start) : null;

        // 이미 같으면 아무것도 안 한다
        if ((curStart || null) === newStart) return;

        QUIET = true;
        try {
            if (newStart) {
                localStorage.setItem(KEYS[0], newStart);
                localStorage.setItem(KEYS[1], d.type || "낮잠");
            } else {
                localStorage.removeItem(KEYS[0]);
                localStorage.removeItem(KEYS[1]);
            }
        } finally {
            setTimeout(function () { QUIET = false; }, 600);
        }

        repaint();

        // 내가 누른 게 아니면 알려준다
        if (d.by && d.by !== myUid() && typeof window.showToast === "function") {
            var who = localStorage.getItem("user_role") === "dad" ? "엄마" : "아빠";
            window.showToast(newStart ? who + "가 재우기 시작했어요"
                                      : who + "가 수면 기록을 마쳤어요");
        }
    }

    function repaint() {
        // 화면을 다시 그리는 함수는 버전마다 이름이 다르다. 있는 것만 부른다.
        // updateTrackerDashboard 가 핵심이다.
        // 이 함수 안에 '완료 기록이 오면 표시등을 끄는' 자가 치유가 들어 있다.
        ["updateTrackerDashboard", "renderTrackerStats", "renderHomeBatonList",
         "renderNightDuty", "updateDadBriefing"].forEach(function (n) {
            if (typeof window[n] === "function") { try { window[n](); } catch (e) {} }
        });
    }

    var unsub = null;

    window.startSleepSync = function () {
        var r = ref();
        if (!r || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} unsub = null; }

        var u = window.onSnapshot(r, function (snap) {
            if (!snap.exists()) return;
            applyRemote(snap.data() || {});
        }, function (e) {
            console.warn("[수면] 실시간 연동 에러", e);
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 켤 때 한 번 맞춘다 ---------- */

    window.pullSleepStateOnce = async function () {
        var r = ref();
        if (!r || typeof window.getDoc !== "function") return;
        try {
            var snap = await window.getDoc(r);
            if (snap.exists()) applyRemote(snap.data() || {});
            else if (localStorage.getItem(KEYS[0])) pushNow();   // 서버가 비었으면 내 것을 올린다
        } catch (e) {}
    };

    /* ---------- 안전장치 ----------
       12시간 넘게 "자는 중"이면 누가 완료를 못 누른 것이다.
       그대로 두면 통계가 통째로 망가진다. -------- */

    function guard() {
        var s = localStorage.getItem(KEYS[0]);
        if (!s) return;
        var hours = (Date.now() - Number(s)) / 3600000;
        if (hours < 12) return;

        localStorage.removeItem(KEYS[0]);
        localStorage.removeItem(KEYS[1]);
        repaint();
        if (typeof window.showToast === "function") {
            window.showToast("12시간 넘게 '자는 중'이라 표시를 정리했어요");
        }
    }

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(function () {
            window.pullSleepStateOnce();
            window.startSleepSync();
            guard();
        }, 3000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(function () {
                window.pullSleepStateOnce();
                guard();
            }, 400);
        });

        setInterval(guard, 10 * 60000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.sleepDebug = async function () {
        var s = localStorage.getItem(KEYS[0]);
        console.log("내 폰 상태:", s
            ? "자는 중 (" + new Date(Number(s)).toLocaleString() + " 부터, " +
              Math.floor((Date.now() - Number(s)) / 60000) + "분 경과)"
            : "깨어 있음");
        console.log("종류:", localStorage.getItem(KEYS[1]) || "-");
        console.log("가족 코드:", syncCode() || "없음");
        console.log("실시간 연동:", unsub ? "켜짐" : "꺼짐");

        var r = ref();
        if (r && typeof window.getDoc === "function") {
            try {
                var snap = await window.getDoc(r);
                console.log("서버 상태:", snap.exists() ? snap.data() : "없음");
            } catch (e) { console.log("서버 확인 실패:", e.code); }
        }
    };

    // 꼬였을 때 손으로 푸는 문
    window.clearSleepState = function () {
        localStorage.removeItem(KEYS[0]);
        localStorage.removeItem(KEYS[1]);
        pushNow();
        repaint();
        if (typeof window.showToast === "function") window.showToast("수면 표시를 정리했어요");
    };
})();