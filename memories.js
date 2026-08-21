/* ============================================================
   배냇함 — 그날의 오늘 (memories.js)

   구글 포토는 이거 하나로 사람을 붙잡는다.
   배냇함 데이터로 하면 훨씬 세게 온다. 남의 사진이 아니라 내 아기니까.

   다만 "1년 전 오늘"은 1년이 지나야 뜬다. 출시하고 열두 달 동안
   아무한테도 안 뜨는 기능은 없는 기능이다.

   그래서 눈금을 촘촘하게 뒀다.
     2주 전 · 한 달 전 · 100일 전 · 6개월 전 · 1년 전 · 2년 전
   2주차부터 뜬다. 그게 이 기능이 일하기 시작하는 시점이다.

   index.html 에서 home.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var DAY  = 86400000;
    var GOLD = "#B98A2E";

    // 가까운 것부터 찾되, 보여줄 땐 가장 먼 것을 고른다 (오래될수록 뭉클하다)
    var MARKS = [
        { d: 14,   label: "2주 전 오늘" },
        { d: 30,   label: "한 달 전 오늘" },
        { d: 100,  label: "100일 전 오늘" },
        { d: 182,  label: "6개월 전 오늘" },
        { d: 365,  label: "1년 전 오늘" },
        { d: 730,  label: "2년 전 오늘" },
        { d: 1095, label: "3년 전 오늘" }
    ];

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function pad(n) { return String(n).padStart(2, "0"); }

    function keyOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

    function daysAgoKey(n) {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        return keyOf(new Date(d.getTime() - n * DAY));
    }

    function dday(k) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s || !k) return "";
        var b = new Date(s + "T00:00:00").getTime();
        var t = new Date(String(k) + "T00:00:00").getTime();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / DAY);
        return n >= 0 ? "생후 " + n + "일" : "";
    }

    function milestoneTitle(id) {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        list = list || window.MILESTONE_DATA || [];
        var m = list.filter(function (x) { return x.id === id; })[0];
        return m ? m.title : "";
    }

    /* ---------- 오늘 꺼낼 기억 찾기 ----------
       가장 오래된 눈금을 고른다. 3년 전이 2주 전을 이긴다. -------- */

    function findMemory() {
        if (typeof window.getDayPhotos !== "function") return null;

        for (var i = MARKS.length - 1; i >= 0; i--) {
            var mark = MARKS[i];
            var key = daysAgoKey(mark.d);
            var shots = window.getDayPhotos(key) || [];
            if (shots.length) {
                return { mark: mark, key: key, photos: shots };
            }
        }
        return null;
    }

    /* ---------- 카드 ---------- */

    function cardHTML(m) {
        var p = m.photos[0];
        var thumb = window.photoThumb ? window.photoThumb(p) : p.url;
        var extra = m.photos.length > 1 ? " 외 " + (m.photos.length - 1) + "장" : "";

        var caption = p.caption
            || (p.msId ? milestoneTitle(p.msId) : "")
            || (dday(m.key) + "의 " + babyName());

        return '' +
        '<div id="home-memory-card" onclick="window.openMemoryDay()" ' +
            'style="display:flex; align-items:center; gap:14px; background:linear-gradient(135deg, rgba(185,138,46,0.07), rgba(185,138,46,0.02)); ' +
            'border:1px solid rgba(185,138,46,0.20); border-radius:22px; padding:14px; margin-bottom:24px; cursor:pointer;">' +

            '<div style="width:66px; height:66px; border-radius:16px; overflow:hidden; flex-shrink:0; background:var(--bg-sub);">' +
                '<img src="' + esc(thumb) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
            '</div>' +

            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:10px; font-weight:900; color:' + GOLD + '; letter-spacing:1.6px; margin-bottom:5px;">' +
                    esc(m.mark.label.toUpperCase ? m.mark.label : m.mark.label) + '</div>' +
                '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px; ' +
                    'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(caption) + '</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px;">' +
                    esc(dday(m.key)) + esc(extra) + '</div>' +
            '</div>' +

            '<div style="font-size:12px; color:' + GOLD + '; flex-shrink:0;">〉</div>' +
        '</div>';
    }

    var current = null;

    window.openMemoryDay = function () {
        if (!current) return;
        if (typeof window.openLoosePhoto === "function") {
            try { window.openLoosePhoto(current.key, 0); return; } catch (e) {}
        }
        if (typeof window.goToMemoryBox === "function") window.goToMemoryBox();
    };

    /* ---------- 자리 잡기 ----------
       홈의 배냇함 카드 바로 아래. 없으면 기록 버튼 아래. -------- */

    function mount() {
        var m = findMemory();
        var old = document.getElementById("home-memory-card");

        if (!m) { if (old) old.remove(); current = null; return; }
        current = m;

        var anchor = document.getElementById("home-memorybox-card")
                  || document.getElementById("now-status-card");
        if (!anchor || !anchor.parentNode) return;

        var box = document.createElement("div");
        box.innerHTML = cardHTML(m);
        var el = box.firstChild;

        if (old) old.parentNode.replaceChild(el, old);
        else anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }

    window.refreshMemoryCard = mount;

    function boot() {
        setTimeout(mount, 1200);          // home.js 가 배냇함 카드를 먼저 그리게 둔다
        setInterval(mount, 5 * 60000);    // 자정을 넘기면 알아서 바뀐다
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.memoryDebug = function () {
        MARKS.forEach(function (mk) {
            var k = daysAgoKey(mk.d);
            var n = (typeof window.getDayPhotos === "function") ? (window.getDayPhotos(k) || []).length : 0;
            console.log(mk.label + "  (" + k + ")  사진 " + n + "장");
        });
        var m = findMemory();
        console.log("오늘 꺼낼 기억:", m ? (m.mark.label + " · " + m.key) : "없음");
    };
})();