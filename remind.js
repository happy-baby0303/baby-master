/* ============================================================
   배냇함 — 육퇴 알림 (remind.js) v2

   대형 육아앱은 저녁 8시에 전체 사용자에게 똑같이 쏜다.
   그 집 아이가 아직 안 잤으면 그 알림은 방해다.

   bedtime.js 가 그 집 육퇴 시각을 14일치 중앙값으로 배운다.
   다만 배우려면 밤잠 기록이 3일치는 있어야 한다.
   그 전까지는 저녁 8시로 둔다. 그래서 새 사용자에게는
   "왜 8시야" 가 된다.

   v2 에서 바뀐 것
     · 시각을 직접 고를 수 있다 (설정 카드에서 탭)
     · 직접 고른 값이 있으면 그걸 쓰고, 없으면 배운 값을 쓴다
     · 카드가 지금 어느 쪽인지 말해준다 ("배우는 중" / "직접 정함")

   index.html 에서 bedtime.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var OFF_KEY    = "tosil_remind_off";
    var SYNCED_KEY = "tosil_remind_synced";
    var MANUAL_KEY = "tosil_bedtime_manual";   // 분 단위 (예: 1230 = 20시 30분)
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

    /* ---------- 직접 정한 시각 ---------- */

    window.getManualBedtime = function () {
        var v = parseInt(localStorage.getItem(MANUAL_KEY), 10);
        return (isFinite(v) && v >= 0 && v < 1440) ? v : null;
    };

    window.setManualBedtime = function (minutes) {
        if (minutes === null) localStorage.removeItem(MANUAL_KEY);
        else localStorage.setItem(MANUAL_KEY, String(minutes));
        window.syncBedtimeReminder(true);
        redrawCard();
    };

    // 실제로 쓰는 시각 — 직접 정한 게 있으면 그게 이긴다
    function bedtimeMinutes() {
        var m = window.getManualBedtime();
        if (m !== null) return m;
        if (typeof window.getBedtimeMinutes === "function") {
            try { return window.getBedtimeMinutes(); } catch (e) {}
        }
        return 20 * 60;
    }
    window.effectiveBedtime = bedtimeMinutes;

    // 배운 값이 있나 (표본이 모였나)
    function isLearned() {
        if (window.getManualBedtime() !== null) return false;
        if (typeof window.getBedtimeMinutes !== "function") return false;
        try { return window.getBedtimeMinutes() !== 20 * 60; } catch (e) { return false; }
    }

    // 20시 40분 → "20:30" (15분 칸)
    function bucketOf(minutes) {
        var m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
        return pad(Math.floor(m / 60)) + ":" + pad(Math.floor((m % 60) / 15) * 15);
    }

    function hhmm(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        var ap = h < 12 ? "오전" : "오후";
        var hh = h % 12; if (hh === 0) hh = 12;
        return ap + " " + hh + "시" + (m ? " " + m + "분" : "");
    }

    function lastPhotoDay() {
        if (typeof window.photoDays !== "function") return "";
        var days = window.photoDays();
        if (!days || !days.length) return "";
        return days.slice().sort().pop();
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

    /* ---------- 사진을 담으면 바로 알려준다 ---------- */

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
        toast(on ? "🌙 육퇴 시간에 살짝 알려드릴게요" : "알림을 껐어요");
        redrawCard();
    };

    /* ---------- 시각 고르기 시트 ---------- */

    window.openBedtimeSheet = function () {
        var old = document.getElementById("bedtime-sheet");
        if (old) old.remove();

        var cur = bedtimeMinutes();
        var manual = window.getManualBedtime() !== null;

        // 저녁 6시 ~ 자정 30분, 30분 간격
        var opts = "";
        for (var m = 18 * 60; m <= 23 * 60 + 30; m += 30) {
            var on = Math.abs(m - cur) < 15;
            opts += '<div onclick="window.setManualBedtime(' + m + '); document.getElementById(\'bedtime-sheet\').remove();" ' +
                'style="padding:14px 10px; text-align:center; border-radius:13px; cursor:pointer; font-size:14px; font-weight:800; ' +
                (on ? 'background:' + PURPLE + '; color:#FFF;' : 'background:var(--bg-sub); color:var(--text-m);') + '">' +
                hhmm(m) + '</div>';
        }

        var wrap = document.createElement("div");
        wrap.id = "bedtime-sheet";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100003; background:rgba(35,29,24,0.55); display:flex; align-items:flex-end; justify-content:center;");
        wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; max-height:84vh; overflow-y:auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:22px 20px calc(30px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                '<span style="font-size:16.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.4px;">🌙 육퇴 시간 정하기</span>' +
                '<span onclick="document.getElementById(\'bedtime-sheet\').remove()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:600; color:var(--text-sub); line-height:1.7; margin-bottom:18px; word-break:keep-all;">' +
                               '선택한 시간에 한 번 알려드려요.<br>' +
                '오늘 사진을 이미 담았으면 알람을 보내지 않아요.</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">' + opts + '</div>' +
             (manual
                ? '<div onclick="window.setManualBedtime(null); document.getElementById(\'bedtime-sheet\').remove();" ' +
                  'style="text-align:center; padding:14px; background:var(--bg-sub); color:var(--text-sub); border-radius:14px; font-size:13.5px; font-weight:800; cursor:pointer;">' +
                  '정한 시간 지우기</div>'
                : '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); line-height:1.6;">' +
                  '고르지 않으면 수면 기록에 맞춰 조금씩 바뀌어요</div>') +
        '</div>';

        document.body.appendChild(wrap);
    };

    /* ---------- 설정 탭 카드 ---------- */

    function cardHTML() {
        var on = !isOff();
        var when = hhmm(bedtimeMinutes());
         var mode = isLearned() ? "수면 기록 기준" : "";

        return '<div style="font-size:22px;">🌙</div>' +
            '<div style="flex:1; min-width:0;" onclick="window.openBedtimeSheet()">' +
                '<div style="font-size:15px; font-weight:900; color:var(--text-m);">육퇴 알림</div>' +
                '<div style="font-size:12px; font-weight:600; color:var(--text-sub); margin-top:2px; word-break:keep-all;">' +
                  (on
                        ? esc(when) + '에 알려드려요' + (mode ? ' · ' + esc(mode) : '') +
                          '  <span style="color:' + PURPLE + '; font-weight:800;">바꾸기 〉</span>'
                        : '지금은 꺼져 있어요') +
                '</div>' +
            '</div>' +
            '<div id="remind-toggle" style="width:46px; height:27px; border-radius:14px; flex-shrink:0; cursor:pointer; ' +
                'background:' + (on ? PURPLE : "var(--border)") + '; position:relative; transition:0.2s;">' +
                '<div style="position:absolute; top:3px; ' + (on ? "left:22px" : "left:3px") + '; width:21px; height:21px; ' +
                    'border-radius:50%; background:#FFF; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>' +
            '</div>';
    }

    function bindCard(card) {
        var t = card.querySelector("#remind-toggle");
        if (t) t.onclick = function (e) { e.stopPropagation(); window.setBedtimeReminder(isOff()); };
    }

    function redrawCard() {
        var card = document.getElementById("remind-card");
        if (!card) return;
        card.innerHTML = cardHTML();
        bindCard(card);
    }

    (function mountCard() {
        var _origin = window.renderSettingsTab;
        window.renderSettingsTab = function () {
            if (typeof _origin === "function") _origin.apply(this, arguments);

            var container = document.getElementById("tab-settings");
            if (!container || document.getElementById("remind-card")) return;

            var card = document.createElement("div");
            card.id = "remind-card";
            card.className = "bnh-settings-card";
            card.style.cssText = "display:flex; align-items:center; gap:14px; background:var(--bg-card); padding:18px 20px; border-radius:16px; border:1px solid var(--border); margin-bottom:12px; box-sizing:border-box; width:100%; cursor:pointer;";
            card.innerHTML = cardHTML();
            container.prepend(card);
            bindCard(card);
        };
    })();

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(function () { window.syncBedtimeReminder(false); }, 4000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.remindDebug = function () {
        console.log("알림 켜짐:", !isOff());
        console.log("직접 정한 시각:", window.getManualBedtime() === null ? "없음" : hhmm(window.getManualBedtime()));
        console.log("배운 시각:", typeof window.getBedtimeMinutes === "function" ? hhmm(window.getBedtimeMinutes()) : "-");
        console.log("실제 쓰는 시각:", hhmm(bedtimeMinutes()), "→ 보낼 칸:", bucketOf(bedtimeMinutes()));
        console.log("마지막 사진 날짜:", lastPhotoDay() || "없음");
        console.log("오늘 등록 완료:", localStorage.getItem(SYNCED_KEY) === todayKey());
        console.log("가족 코드:", syncCode() || "없음");
    };
})();