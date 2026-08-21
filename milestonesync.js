/* ============================================================
   배냇함 — 도감 함께 쓰기 (milestonesync.js)

   사진도, 소리도, 편지도, 한 줄도, 첫 단어도 다 동기화된다.
   그런데 정작 도감 100가지만 각자 폰에 갇혀 있었다.

   무슨 일이 생기나
     · 남편이 "첫 뒤집기" 도장을 찍어도 아내 폰엔 안 뜬다
     · 폰을 바꾸거나 앱을 지우면 도감이 통째로 사라진다
     · 20년을 맡기는 앱에서 핵심 기록만 백업이 없다

   이 앱의 이유가 도감인데, 그게 제일 위험한 자리에 있었다.

   합치는 방법
     · 같은 항목이 양쪽에 있으면 '먼저 달성한 날'을 남긴다
       (부부가 각자 찍어도 진짜 첫날이 이긴다)
     · 도장을 취소하면 묘비를 세워 되살아나지 않게 한다
     · 다시 찍으면 묘비를 치운다

   index.html 에서 milestonebook.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var KEY  = "tosil_milestones";
    var KIND = "ms";

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    function ref() {
        var code = syncCode();
        if (!code || !window.db || typeof window.doc !== "function") return null;
        return window.doc(window.db, "milestones_" + code + suffix(), "status");
    }

    /* ---------- 저장소 ----------
       옛 버전은 문자열 배열, 지금은 {id, date} 배열이다. 둘 다 받는다. -------- */

    function load() {
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
        if (!Array.isArray(raw)) return [];
        return raw.map(function (a) {
            if (typeof a === "string") return { id: a, date: "예전 기록 🤍" };
            return (a && a.id) ? a : null;
        }).filter(Boolean);
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    }

    // 진짜 날짜인가 (옛 기록 표시 말고)
    function realDate(d) {
        return typeof d === "string" && /^\d{4}/.test(d.trim());
    }

    // 둘 중 먼저 달성한 것을 남긴다
    function earlier(a, b) {
        if (!realDate(a.date)) return b;
        if (!realDate(b.date)) return a;
        return a.date <= b.date ? a : b;
    }

    /* ---------- 서버에 올리기 ---------- */

    window.syncMilestonesToFirebase = async function () {
        var r = ref();
        if (!r || typeof window.setDoc !== "function") return;
        try {
            await window.setDoc(r, {
                list: load(),
                deleted: (window.Grave ? window.Grave.list(KIND) : {}),
                at: Date.now()
            });
        } catch (e) {
            console.warn("[도감] 동기화 실패", e);
        }
    };

    /* ---------- 화면 다시 그리기 ---------- */

    function repaint() {
        if (typeof window.updateMilestoneCounter === "function") {
            try { window.updateMilestoneCounter(true); } catch (e) {}
        }
        if (typeof window.refreshMilestoneFrames === "function") {
            try { window.refreshMilestoneFrames(); } catch (e) {}
        }
        // 도감 화면을 보고 있으면 그 자리에서 갱신
        var sheet = document.getElementById("milestone-bottom-sheet");
        if (sheet && sheet.classList.contains("show") &&
            typeof window.openMilestoneModal === "function") {
            try { window.openMilestoneModal(); } catch (e) {}
        }
        if (typeof window.refreshHomeMemoryBox === "function") {
            try { window.refreshHomeMemoryBox(); } catch (e) {}
        }
    }

    /* ---------- 짝꿍이 찍으면 내 폰에도 ---------- */

    var unsub = null;

    window.startMilestoneSync = function () {
        var r = ref();
        if (!r || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} unsub = null; }

        var u = window.onSnapshot(r, function (snap) {
            if (!snap.exists()) return;
            var data = snap.data() || {};
            var remote = Array.isArray(data.list) ? data.list : [];
            if (window.Grave) window.Grave.merge(KIND, data.deleted);

            var local = load();
            var byId = {};

            local.concat(remote).forEach(function (a) {
                if (!a || !a.id) return;
                if (window.Grave && window.Grave.has(KIND, a.id)) return;   // 취소한 건 안 되살린다
                byId[a.id] = byId[a.id] ? earlier(byId[a.id], a) : a;
            });

            var merged = Object.keys(byId).map(function (k) { return byId[k]; });

            if (JSON.stringify(merged) === JSON.stringify(local)) return;
            save(merged);
            repaint();
        }, function (e) {
            console.warn("[도감] 실시간 연동 에러", e);
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 도장을 찍거나 취소할 때 ----------
       script.js 의 toggleMilestone 은 한 줄도 안 고친다. 감싸기만 한다. -------- */

    (function hookToggle() {
        var orig = window.toggleMilestone;
        if (typeof orig !== "function" || orig.__synced) return;

        var wrapped = function (id) {
            var out = orig.apply(this, arguments);

            var stillThere = load().some(function (a) { return a.id === id; });
            if (window.Grave) {
                if (stillThere) window.Grave.forgive(KIND, id);   // 다시 찍었다
                else window.Grave.add(KIND, id);                  // 취소했다
            }
            window.syncMilestonesToFirebase();
            return out;
        };
        wrapped.__synced = true;
        window.toggleMilestone = wrapped;
    })();

    /* ---------- 연동 직후 한 번 맞춰준다 ---------- */

    window.pullMilestonesOnce = async function () {
        var r = ref();
        if (!r || typeof window.getDoc !== "function") return;
        try {
            var snap = await window.getDoc(r);
            if (!snap.exists()) {
                // 서버가 비어 있으면 내 것을 올려둔다 (첫 연동)
                if (load().length) window.syncMilestonesToFirebase();
                return;
            }
            var data = snap.data() || {};
            var remote = Array.isArray(data.list) ? data.list : [];
            if (window.Grave) window.Grave.merge(KIND, data.deleted);

            var local = load(), byId = {};
            local.concat(remote).forEach(function (a) {
                if (!a || !a.id) return;
                if (window.Grave && window.Grave.has(KIND, a.id)) return;
                byId[a.id] = byId[a.id] ? earlier(byId[a.id], a) : a;
            });
            var merged = Object.keys(byId).map(function (k) { return byId[k]; });

            if (JSON.stringify(merged) !== JSON.stringify(local)) {
                save(merged);
                repaint();
            }
            if (merged.length !== remote.length) window.syncMilestonesToFirebase();
        } catch (e) {
            console.warn("[도감] 첫 동기화 실패", e);
        }
    };

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(function () {
            window.pullMilestonesOnce();
            window.startMilestoneSync();
        }, 3500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.milestoneSyncDebug = function () {
        console.log("가족 코드:", syncCode() || "없음");
        console.log("내 폰의 도장:", load().length + "개");
        console.log("취소한 묘비:", window.Grave ? Object.keys(window.Grave.list(KIND)).length + "개" : "Grave 없음");
        console.log("실시간 연동:", unsub ? "켜짐" : "꺼짐");
        console.log("toggleMilestone 감쌈:", !!(window.toggleMilestone && window.toggleMilestone.__synced));
    };
})();