/* ============================================================
   육아메이트 — 한 줄 맞춤 (fit.js)

   글자 하나 때문에 두 줄이 되는 자리들을 자동으로 눌러 맞춘다.
   폰트 크기를 일일이 손보면 다음에 글자가 길어질 때 또 깨진다.
   재는 쪽이 낫다.

   맨 마지막에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var MIN = 0.70;     // 이보다 작아지면 읽기 힘드니 그냥 두 줄로 둔다
    var TICK = 1200;    // script.js 가 다시 그리므로 주기적으로 확인

    // 기본으로 눌러 맞출 자리들
    var TARGETS = [
        "#now-feed", "#now-diaper", "#now-sleep-state", "#now-sleep-label",
        "#milestone-counter",
        "#home-postcard-tile > div:nth-child(2)",
        "#home-postcard-tile > div:nth-child(3)",
        "[data-fit]"
    ];

    function fit(el) {
        if (!el || !el.parentNode) return;

        // 원래 상태로 되돌린 뒤 다시 잰다 (안 그러면 한 번 줄어든 채로 굳는다)
        el.style.whiteSpace = "nowrap";
        el.style.display = el.style.display || "block";
        el.style.transformOrigin = "center center";
        el.style.transform = "";

        var room = el.clientWidth;
        var need = el.scrollWidth;
        if (!room || !need || need <= room + 0.5) return;

        var k = room / need;
        if (k < MIN) {
            // 너무 작아질 바엔 줄바꿈을 허용한다
            el.style.whiteSpace = "";
            el.style.transform = "";
            return;
        }
        el.style.transform = "scale(" + (Math.floor(k * 100) / 100) + ")";
    }

    function run() {
        TARGETS.forEach(function (sel) {
            var list;
            try { list = document.querySelectorAll(sel); } catch (e) { return; }
            for (var i = 0; i < list.length; i++) fit(list[i]);
        });
    }

    // 다른 파일에서도 부를 수 있게 (사진 담은 뒤 등)
    window.fitOneLine = function (elOrSel) {
        if (typeof elOrSel === "string") {
            var l = document.querySelectorAll(elOrSel);
            for (var i = 0; i < l.length; i++) fit(l[i]);
        } else fit(elOrSel);
    };
    window.refitAll = run;

    function boot() {
        run();
        setInterval(run, TICK);
        window.addEventListener("resize", run);
        window.addEventListener("orientationchange", function () { setTimeout(run, 250); });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();