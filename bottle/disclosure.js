/* ============================================================
   배냇함 — 제휴 고지 (disclosure.js)

   쿠팡 파트너스는 대가성 문구를 "소비자가 쉽게 알아볼 수 있는 곳"에
   두라고 한다. 공정거래위원회 추천·보증 심사지침도 같은 말이다.

   지금 다섯 큐레이터는 전부 이렇게 돼 있다.

       · 페이지 제일 아래
       · 12.5px 회색 글씨
       · 면책 조항과 한 덩어리로 묶여 있음

   스크롤을 끝까지 내려야 보이고, 내려도 눈에 안 들어온다.
   카시트만 걸린 게 아니라 다섯 개가 다 같은 구조다.
   먼저 걸렸을 뿐이다.

   그래서 맨 위에 하나 더 둔다. 아래 것은 그대로 두고.
   법적 고지는 두 번 있어도 손해가 없다.

   ⚠️ 문구를 흐리게 하거나 접어두지 않는다.
      그렇게 하면 넣으나 마나다.

   각 큐레이터 폴더(bottle, carseat, stroller, toy, food)에
   이 파일을 넣고 index.html 에서 app.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var ID = "coupang-disclosure";

    function mount() {
        if (document.getElementById(ID)) return;

        // 헤더 바로 다음, 본문 맨 위
        var host = document.querySelector("main.container") ||
                   document.querySelector(".container");
        if (!host) return;

        var box = document.createElement("div");
        box.id = ID;
        box.style.cssText =
            "display:flex; align-items:flex-start; gap:9px; " +
            "background:#FFF7ED; border:1px solid #FDBA74; border-radius:12px; " +
            "padding:13px 15px; margin:16px 0 20px; box-sizing:border-box;";

        box.innerHTML =
            '<span style="font-size:15px; flex-shrink:0; line-height:1.4;">📢</span>' +
            '<span style="font-size:13px; font-weight:700; color:#9A3412; ' +
                'line-height:1.65; word-break:keep-all;">' +
                '이 페이지는 <b>쿠팡 파트너스 활동의 일환</b>으로, 구매가 일어나면 ' +
                '이에 따른 <b>일정액의 수수료를 제공받습니다.</b>' +
            '</span>';

        host.insertBefore(box, host.firstChild);
    }

    /* 다크모드에서도 읽히게 (style.css 가 인라인 배경만 반전시켜서 글씨가 묻힌다) */
    (function darkFix() {
        if (document.getElementById("cd-vars")) return;
        var st = document.createElement("style");
        st.id = "cd-vars";
        st.textContent =
            "body.dark-mode #" + ID + "{background:#3A2410 !important;border-color:#A85C1E !important;}" +
            "body.dark-mode #" + ID + " span{color:#FFD9AE !important;}";
        (document.head || document.documentElement).appendChild(st);
    })();

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
    setTimeout(mount, 600);

    window.disclosureDebug = function () {
        var el = document.getElementById(ID);
        console.log("고지 배너 붙음:", !!el);
        if (el) {
            var r = el.getBoundingClientRect();
            console.log("위치: 문서 상단에서", Math.round(r.top + window.scrollY) + "px");
            console.log("글자 크기: 13px · 배경 있음 · 접히지 않음");
        }
    };
})();