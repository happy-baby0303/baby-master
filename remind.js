/* ============================================================
   배냇함 — 육퇴 알림 (remind.js)

   대형 육아앱은 저녁 8시에 전체 사용자에게 똑같이 쏜다.
   그 집 아이가 아직 안 잤으면 그 알림은 방해다.

   우리는 bedtime.js 가 그 집 육퇴 시각을 14일치 중앙값으로 이미 배워뒀다.
   거기에 방금 살린 푸시를 잇는다.

     저녁 8시 40분 — 그 집이 조용해지는 시각
     "오늘 하윤이 사진이 아직 배냇함에 없어요 🧺"

   대형 앱이 흉내 못 낸다. 걔들은 그 집 시계를 모른다.

   하는 일은 단순하다. 하루 한 번, 서버에 우리집 육퇴 시각을 적어둔다.
   보내는 건 서버(bedtimeReminder)가 한다.

   index.html 에서 bedtime.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var OFF_KEY    = "tosil_remind_off";
    var SYNCED_KEY = "tosil_remind_synced";
    var PURPLE     = "#7F77DD";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }
    function pad(n) { return String(n).padStart(2, "0"); }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function syncCode() { return localStorage.getItem("family_sync_code"); }

    function isOff() { return localStorage.getItem(OFF_KEY) === "true"; }

    // 20시 40분 → "20:30" (15분 단위 칸)
    function bucketOf(minutes) {
        var m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
        var h = Math.floor(m / 60);
        var mm = Math.floor((m % 60) / 15) * 15;
        return pad(h) + ":" + pad(mm);
    }

    // 마지막으로 사진을 담은 날
    function lastPhotoDay() {
        if (typeof window.photoDays !== "function") return "";
        var days = window.photoDays();
        if (!days || !days.length) return "";
        return days.slice().sort().pop();
    }

    function bedtimeMinutes() {
        if (typeof window.getBedtimeMinutes === "function") {
            try { return window.getBedtimeMinutes(); } catch (e) {}
        }
        return 20 * 60;   // 배운 게 없으면 저녁 8시
    }

    /* ---------- 서버에 우리집 시계 적어두기 ---------- */

    window.syncBedtimeReminder = async function (force) {
        var code = syncCode();
        if (!code) return;
        if (!window.db || typeof window.setDoc !== "function" || typeof window.doc !== "function") return;

        var today = todayKey();
        if (!force && localStorage.getItem(SYNCED_KEY) === today) return;

        var min = bedtimeMinutes();

        try {
            await window.setDoc(window.doc(window.db, "reminders", code), {
                enabled:        !isOff(),
                sendBucket:     bucketOf(min),
                bedtimeMinutes: min,
                babyName:       babyName(),
                lastPhotoAt:    lastPhotoDay(),
                updatedAt:      Date.now()
            }, { merge: true });

            localStorage.setItem(SYNCED_KEY, today);
        } catch (e) {
            console.warn("[육퇴 알림] 시계 등록 실패", e);
        }
    };

    /* ---------- 사진을 담으면 바로 알려준다 ----------
       그래야 오늘 담은 사람에게는 알림이 안 간다. -------- */

    var origSyncPhotos = window.syncPhotosToFirebase;
    window.syncPhotosToFirebase = async function () {
        var out;
        if (typeof origSyncPhotos === "function") out = await origSyncPhotos.apply(this, arguments);
        try { window.syncBedtimeReminder(true); } catch (e) {}
        return out;
    };

    /* ---------- 켜고 끄기 ---------- */

    window.setBedtimeReminder = async function (on) {
        localStorage.setItem(OFF_KEY, on ? "false" : "true");
        await window.syncBedtimeReminder(true);
        toast(on ? "🔔 육퇴 시간에 살짝 알려드릴게요" : "알림을 껐어요");
        var card = document.getElementById("remind-card");
        if (card) { card.remove(); if (typeof window.renderSettingsTab === "function") window.renderSettingsTab(); }
    };

    function hhmm(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        var ap = h < 12 ? "오전" : "오후";
        var hh = h % 12; if (hh === 0) hh = 12;
        return ap + " " + hh + "시" + (m ? " " + m + "분" : "");
    }

    /* ---------- 설정 탭 카드 ---------- */

    (function mountCard() {
        var _origin = window.renderSettingsTab;
        window.renderSettingsTab = function () {
            if (typeof _origin === "function") _origin.apply(this, arguments);

            var container = document.getElementById("tab-settings");
            if (!container || document.getElementById("remind-card")) return;

            var on = !isOff();
            var when = hhmm(bedtimeMinutes());

            var card = document.createElement("div");
            card.id = "remind-card";
            card.style.cssText = "display:flex; align-items:center; gap:14px; background:var(--bg-card); padding:18px 20px; border-radius:16px; border:1px solid var(--border); margin-bottom:16px; box-sizing:border-box; width:100%;";
            card.innerHTML =
                '<div style="font-size:22px;">🌙</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:15px; font-weight:900; color:var(--text-m);">육퇴 알림</div>' +
                    '<div style="font-size:12px; font-weight:600; color:var(--text-sub); margin-top:2px; word-break:keep-all;">' +
                        (on ? esc(when) + '쯤, 오늘 사진이 비어 있을 때만 살짝'
                            : '지금은 꺼져 있어요') +
                    '</div>' +
                '</div>' +
                '<div id="remind-toggle" style="width:46px; height:27px; border-radius:14px; flex-shrink:0; cursor:pointer; ' +
                    'background:' + (on ? PURPLE : "var(--border)") + '; position:relative; transition:0.2s;">' +
                    '<div style="position:absolute; top:3px; ' + (on ? "left:22px" : "left:3px") + '; width:21px; height:21px; ' +
                        'border-radius:50%; background:#FFF; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>' +
                '</div>';

            container.prepend(card);

            var t = document.getElementById("remind-toggle");
            if (t) t.onclick = function () { window.setBedtimeReminder(isOff()); };
        };
    })();

    /* ---------- 앱이 자리를 잡으면 한 번 ---------- */

    function boot() {
        setTimeout(function () { window.syncBedtimeReminder(false); }, 4000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.remindDebug = function () {
        console.log("알림 켜짐:", !isOff());
        console.log("배운 육퇴 시각:", hhmm(bedtimeMinutes()), "→ 보낼 칸:", bucketOf(bedtimeMinutes()));
        console.log("마지막 사진 날짜:", lastPhotoDay() || "없음");
        console.log("오늘 등록 완료:", localStorage.getItem(SYNCED_KEY) === todayKey());
        console.log("가족 코드:", syncCode() || "없음");
    };
})();