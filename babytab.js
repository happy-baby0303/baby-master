/* ============================================================
   배냇함 — 탭에 아이 이름 (babytab.js)

   앱 이름이 배냇함인데 하단 탭 이름도 배냇함이면
   "배냇함 앱의 배냇함 탭" 이 된다. 처음 온 사람은 헷갈린다.

   탭을 아이 이름으로 바꾼다.
     🧺 배냇함  →  🧺 하윤이

   덤이 크다. 하루에 열 번 앱을 열 때마다 아이 이름이 눈에 들어온다.
   그리고 둘째로 넘기면 탭 이름도 따라 바뀐다.
   같은 앱인데 다른 아이의 방에 들어온 게 된다.

   index.html 에서 mobile.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var FALLBACK = "배냇함";
    var MAX = 5;              // 이보다 길면 줄인다 (탭 칸이 좁다)

    function babyName() {
        var n = (localStorage.getItem("tosil_babyName") || "").trim();
        if (!n) return FALLBACK;
        return n.length > MAX ? n.slice(0, MAX - 1) + "…" : n;
    }

    function labelEl() {
        var tab = document.getElementById("nav-memorybox");
        if (!tab) return null;
        return tab.querySelector(".label");
    }

    var last = "";

    function apply() {
        var el = labelEl();
        if (!el) return;

        var want = babyName();
        if (el.textContent === want) { last = want; return; }

        el.textContent = want;
        last = want;
    }

    window.refreshBabyTab = apply;

    /* ---------- 아이가 바뀌면 따라간다 ----------
       다둥이 전환은 currentBabySuffix 와 tosil_babyName 을 함께 바꾼다.
       그 둘을 지켜보다가 달라지면 탭도 갈아끼운다. -------- */

    var lastKey = "";

    function watchSwitch() {
        var key = (window.currentBabySuffix || "") + "|" +
                  (localStorage.getItem("tosil_babyName") || "");
        if (key === lastKey) return;
        lastKey = key;
        apply();
    }

    /* ---------- 시작 ---------- */

    function boot() {
        apply();
        setTimeout(apply, 600);
        setTimeout(apply, 2000);

        // 아이 전환 · 이름 수정을 놓치지 않게
        setInterval(watchSwitch, 1500);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(apply, 200);
        });

        // 다른 탭에서 아이를 바꿨을 때
        window.addEventListener("storage", function (e) {
            if (!e || !e.key || e.key.indexOf("tosil_babyName") === -1) return;
            setTimeout(apply, 100);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.babyTabDebug = function () {
        console.log("아이 이름:", localStorage.getItem("tosil_babyName") || "(없음)");
        console.log("아이 번호:", window.currentBabySuffix || "(첫째)");
        console.log("탭에 뜨는 글자:", labelEl() ? labelEl().textContent : "탭 못 찾음");
    };
})();