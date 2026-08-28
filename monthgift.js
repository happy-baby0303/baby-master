/* ============================================================
   배냇함 — 이달의 배냇함이 도착했습니다 (monthgift.js)

   구독은 매달 심판을 받는다.
   카드값 명세서에 4,900원이 뜰 때마다 "이거 왜 내지" 를 묻는다.
   그때 대답이 나와야 하는데, 지금 플러스에 든 것은 전부
   "가끔 쓰는 것" 아니면 "한 번 쓰는 것" 이다.

   monthcard.js 는 카드를 이미 굽는다. 문제는 그게
   타임라인 월 헤더의 작은 [카드] 버튼 뒤에 숨어 있다는 것이다.
   월말에 배냇함을 스크롤해서 그 버튼을 찾는 부모는 없다.

   도착하는 것과 만들 수 있는 것은 다르다.
   구독은 도착할 때만 값이 느껴진다.

   그래서 달이 바뀌면 홈 맨 위에 지난달이 놓인다.

     🎁 8월의 배냇함이 도착했어요
        사진 12 · 소리 3 · 한 줄 5 · 처음 해낸 일 2

   ⚠️ 첫 한 장은 무료다. 뺏은 걸 돌려주는 게 아니라
      좋은 걸 먼저 보여주고 파는 자리여야 한다.
      그 다음 달부터 플러스.

   monthcard.js 는 한 줄도 안 고친다. 감싸기만 한다.

   index.html 에서 monthcard.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var CARD_ID   = "home-month-gift";
    var DONE_KEY  = "tosil_monthgift_done";        // 이 달 것은 봤다 (예: "2026-08")
    var FREE_KEY  = "tosil_monthcard_free_used";   // 무료로 저장한 달 하나
    var GOLD      = "#B98A2E";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function pad(n) { return String(n).padStart(2, "0"); }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function isPro() {
        return (typeof window.isPremium === "function") ? !!window.isPremium() : false;
    }

    /* ---------- 지난달 ---------- */

    function lastMonth() {
        var d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }

    function tagOf(t) { return t.year + "-" + pad(t.month); }

    function inMonth(key, t) {
        var p = String(key).split("-");
        return Number(p[0]) === t.year && Number(p[1]) === t.month;
    }

    /* ---------- 그 달에 뭐가 담겼나 ----------
       monthcard.js 안의 계산을 다시 쓰지 않는다.
       카드를 굽는 건 그쪽 일이고, 여기는 "띄울까 말까" 만 정한다. -------- */

    function scan(t) {
        var photos = [], voices = 0, notes = 0, firsts = 0;

        if (typeof window.photoDays === "function" && typeof window.getDayPhotos === "function") {
            window.photoDays().sort().forEach(function (k) {
                if (inMonth(k, t)) (window.getDayPhotos(k) || []).forEach(function (p) { photos.push(p); });
            });
        }
        if (typeof window.voiceDays === "function" && typeof window.getDayVoices === "function") {
            window.voiceDays().forEach(function (k) {
                if (inMonth(k, t)) voices += (window.getDayVoices(k) || []).length;
            });
        }
        if (typeof window.noteDays === "function" && typeof window.getDayNotes === "function") {
            window.noteDays().forEach(function (k) {
                if (inMonth(k, t)) notes += (window.getDayNotes(k) || []).length;
            });
        }

        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        raw.forEach(function (a) {
            if (!a || typeof a === "string" || !a.date) return;
            var d = String(a.date).replace(/\.\s*/g, "-").replace(/-$/, "");
            if (inMonth(d, t)) firsts++;
        });

        return { photos: photos, voices: voices, notes: notes, firsts: firsts };
    }

    function isEmpty(s) {
        return !s.photos.length && !s.voices && !s.notes && !s.firsts;
    }

    /* ---------- 무료 한 장 ----------
       monthcard.js 의 downloadMonthCard 를 감싼다.
       무료는 어느 달이든 한 장까지. 같은 달을 다시 뽑는 건 계속 무료다. -------- */

    (function gateCard() {
        var orig = window.downloadMonthCard;
        if (typeof orig !== "function" || orig.__gift) return;

        var wrapped = function (year, month) {
            if (!isPro()) {
                var tag = Number(year) + "-" + pad(Number(month));
                var used = localStorage.getItem(FREE_KEY);
                if (used && used !== tag) {
                    if (typeof window.openUpsell === "function") window.openUpsell("month");
                    else toast("이달의 카드는 플러스에서 매달 받을 수 있어요");
                    return;
                }
                try { localStorage.setItem(FREE_KEY, tag); } catch (e) {}
            }
            return orig.apply(this, arguments);
        };
        wrapped.__gift = true;
        window.downloadMonthCard = wrapped;
    })();

    /* ---------- 카드 ---------- */

    window.openMonthGift = function () {
        var t = lastMonth();
        try { localStorage.setItem(DONE_KEY, tagOf(t)); } catch (e) {}
        var el = document.getElementById(CARD_ID);
        if (el) el.remove();

        if (typeof window.downloadMonthCard === "function") window.downloadMonthCard(t.year, t.month);
        else toast("카드를 만들 수 없어요");
    };

    window.dismissMonthGift = function () {
        try { localStorage.setItem(DONE_KEY, tagOf(lastMonth())); } catch (e) {}
        var el = document.getElementById(CARD_ID);
        if (el) el.remove();
    };

    function cardHTML(t, s) {
        var bits = [];
        if (s.photos.length) bits.push("사진 " + s.photos.length);
        if (s.voices)        bits.push("소리 " + s.voices);
        if (s.notes)         bits.push("한 줄 " + s.notes);
        if (s.firsts)        bits.push("처음 해낸 일 " + s.firsts);

        var p = s.photos[0];
        var thumb = p ? ((typeof window.photoThumb === "function") ? window.photoThumb(p) : p.url) : "";

        var free = !isPro() && !localStorage.getItem(FREE_KEY);

        return '<div id="' + CARD_ID + '" ' +
            'style="display:flex; align-items:center; gap:14px; ' +
            'background:linear-gradient(135deg, rgba(185,138,46,0.13), rgba(185,138,46,0.03)); ' +
            'border:1px solid rgba(185,138,46,0.26); border-radius:22px; padding:14px; margin-bottom:24px;">' +

            (thumb
                ? '<div style="width:66px; height:66px; border-radius:16px; overflow:hidden; flex-shrink:0; background:var(--bg-sub);">' +
                      '<img src="' + esc(thumb) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
                  '</div>'
                : '<div style="width:66px; height:66px; border-radius:16px; flex-shrink:0; background:rgba(185,138,46,0.10); ' +
                      'display:flex; align-items:center; justify-content:center; font-size:26px;">🎁</div>') +

            '<div style="flex:1; min-width:0; cursor:pointer;" onclick="window.openMonthGift()">' +
                '<div style="font-size:10px; font-weight:900; color:' + GOLD + '; letter-spacing:1.6px; margin-bottom:5px;">' +
                    (free ? "첫 카드는 선물이에요" : "이달의 배냇함") + '</div>' +
                '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' +
                    t.month + '월의 배냇함이 도착했어요</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px; ' +
                    'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    esc(bits.join(" · ")) + '</div>' +
            '</div>' +

            '<div onclick="window.dismissMonthGift()" ' +
                'style="font-size:18px; font-weight:300; color:var(--text-sub); ' +
                'flex-shrink:0; cursor:pointer; padding:0 4px; line-height:1;">×</div>' +
        '</div>';
    }

    /* ---------- 자리 잡기 ----------
       홈 맨 위. '그날의 오늘' 이 있으면 그 위에 놓는다.
       한 달에 한 번 오는 것이 매일 오는 것보다 위에 있어야 한다. -------- */

    function mount() {
        var old = document.getElementById(CARD_ID);
        var t = lastMonth();

        if (localStorage.getItem(DONE_KEY) === tagOf(t)) { if (old) old.remove(); return; }

        var s = scan(t);
        if (isEmpty(s)) { if (old) old.remove(); return; }      // 빈 달은 안 보낸다

        var before = document.getElementById("home-memory-card");
        var after  = document.getElementById("home-memorybox-card") ||
                     document.getElementById("now-status-card");
        if (!before && (!after || !after.parentNode)) return;

        var box = document.createElement("div");
        box.innerHTML = cardHTML(t, s);
        var el = box.firstChild;

        if (old) { old.parentNode.replaceChild(el, old); return; }
        if (before && before.parentNode) before.parentNode.insertBefore(el, before);
        else after.parentNode.insertBefore(el, after.nextSibling);
    }

    window.refreshMonthGift = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1400);      // memories.js 가 먼저 그리게 둔다
        setTimeout(mount, 3200);
        setInterval(mount, 10 * 60000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 500);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.giftDebug = function () {
        var t = lastMonth();
        var s = scan(t);
        console.log("지난달:", tagOf(t));
        console.log("  사진:", s.photos.length + "장  소리:", s.voices + "개  한 줄:", s.notes + "줄  처음 해낸 일:", s.firsts + "가지");
        console.log("  보낼 것 있음:", !isEmpty(s));
        console.log("이미 받음:", localStorage.getItem(DONE_KEY) || "아직");
        console.log("무료 한 장 쓴 달:", localStorage.getItem(FREE_KEY) || "아직 안 씀");
        console.log("플러스:", isPro());
        console.log("카드 떠 있음:", !!document.getElementById("home-month-gift"));
        console.log("다시 받으려면: localStorage.removeItem('" + DONE_KEY + "')");
    };
})();