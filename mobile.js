/* ============================================================
   육아메이트 — 모바일 다듬기 (mobile.js)

   이 앱에는 미디어쿼리가 한 줄도 없었다.
   27인치 모니터와 360px 갤럭시가 같은 CSS 를 받고 있었다.

   인라인 스타일은 건드리지 않는다. 화면 폭에 따라
   여백·모서리·그림자만 눌러서 좁은 화면에 맞춘다.

   맨 마지막, fit.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. viewport ----------
       viewport-fit=cover 가 없으면 아이폰 노치·홈 인디케이터
       영역을 계산할 수 없어서 하단 탭이 잘린다. -------- */

    (function fixViewport() {
        var m = document.querySelector('meta[name="viewport"]');
        if (!m) return;
        var c = m.getAttribute("content") || "";
        if (c.indexOf("viewport-fit") === -1) {
            m.setAttribute("content", c + ", viewport-fit=cover");
        }
    })();

    /* ---------- 2. 스타일 ---------- */

    var CSS = `
/* ===== 모든 화면 ===== */

/* 탭 할 때 파란 사각형이 번쩍이는 것 (안드로이드 기본값) */
* { -webkit-tap-highlight-color: transparent; }

/* PWA 에서 위로 당길 때 새로고침되거나 화면이 늘어나는 것 */
body { overscroll-behavior-y: contain; }

/* 사진은 확대해서 볼 수 있어야 한다 */
#mb-photo-viewer img { touch-action: pinch-zoom; }


/* ===== 430px 이하 : 대부분의 폰 ===== */
@media (max-width: 430px) {

    /* 한글이 단어 한가운데서 끊기지 않게 */
    .tab-content, .tab-content * { word-break: keep-all; }

    /* 카드 — 좁은 화면에서 24px 모서리는 뚱뚱해 보인다 */
    .box-main, .box-sub, .box-tint-blue, .box-tint-red,
    #now-status-card, #home-memorybox-card, .dad-hero-card {
        border-radius: 20px !important;
        box-shadow: 0 2px 10px rgba(139,126,116,0.055) !important;
    }

    /* 카드 속 여백 — 여기서 아낀 폭이 글자 두 줄 깨짐을 막는다 */
    #now-status-card, #home-memorybox-card {
        padding: 18px 15px !important;
    }

    /* 섹션 사이 간격 — 모바일은 스크롤이 길어지면 지친다 */
    #tab-home > div[style*="margin-bottom: 36px"],
    #tab-home > div > div[style*="margin-bottom: 36px"] { margin-bottom: 22px !important; }
    #tab-home > div[style*="margin-bottom: 24px"],
    #tab-home > div > div[style*="margin-bottom: 24px"] { margin-bottom: 16px !important; }

    /* 4구 그리드 간격 */
    #tab-home div[style*="grid-template-columns: 1fr 1fr"] { gap: 10px !important; }
    #home-postcard-tile,
    #tab-home div[style*="grid-template-columns: 1fr 1fr"] > div { padding: 18px 12px !important; }

    /* 입력창 — 16px 보다 작으면 아이폰이 화면을 확 당겨버린다 */
    input, textarea, select { font-size: 16px !important; }

    /* 하단 탭 자체는 건드리지 않는다.
       style.css 37행이 이미 safe-area 를 계산하고 있다. */
    .nav-item { min-height: 48px !important; }

    /* 하단 여백은 '더하지' 않고 '정한다'.
       body(120px) + wrapper + tab-content 가 겹쳐 쌓이면 화면 반이 빈다. */
    body { padding-bottom: 0 !important; }
    .wrapper { padding-bottom: 0 !important; }
    .tab-content.active {
        padding-bottom: calc(78px + env(safe-area-inset-bottom, 0px)) !important;
    }

    /* 바텀시트도 마찬가지 */
    #postcard-picker > div,
    #tracker-sheet-content {
        padding-bottom: calc(34px + env(safe-area-inset-bottom, 0px)) !important;
    }

    /* 작은 칩은 줄바꿈보다 축소가 낫다 */
    span[style*="border-radius: 12px"],
    span[style*="border-radius: 10px"] { white-space: nowrap !important; }

    /* 사진 뷰어 — 화면 끝까지 */
    #mb-photo-viewer > div { padding-left: 14px !important; padding-right: 14px !important; }
}


/* ===== 전체 화면 모달의 상단 안전영역 =====
   viewport-fit=cover 를 켜면 화면이 노치 밑까지 확장된다.
   그래서 inset:0 인 모달의 맨 위 X 버튼이 배터리·시계와 겹쳐
   눌리지 않는다. 아이폰에서 편지함을 못 닫던 이유. */

[style*="position:fixed"][style*="inset:0"],
[style*="position: fixed"][style*="inset: 0"] {
    padding-top: env(safe-area-inset-top, 0px) !important;
    box-sizing: border-box !important;
}

/* 홈 화면에 설치한 PWA 는 상태바가 화면 위에 그대로 얹힌다.
   env() 를 못 읽는 기기까지 대비해 최소값을 준다. */
@media all and (display-mode: standalone) {
    [style*="position:fixed"][style*="inset:0"],
    [style*="position: fixed"][style*="inset: 0"] {
        padding-top: max(env(safe-area-inset-top, 0px), 44px) !important;
    }
}


/* ===== 375px 이하 : 작은 폰 (SE, 구형 갤럭시) ===== */
@media (max-width: 375px) {

    .box-main, .box-sub, #now-status-card, #home-memorybox-card {
        border-radius: 18px !important;
    }
    #now-status-card, #home-memorybox-card { padding: 16px 13px !important; }

    #tab-home div[style*="grid-template-columns: 1fr 1fr"] { gap: 8px !important; }
    #home-postcard-tile,
    #tab-home div[style*="grid-template-columns: 1fr 1fr"] > div { padding: 16px 10px !important; }
}
`;

    (function inject() {
        if (document.getElementById("mobile-css")) return;
        var s = document.createElement("style");
        s.id = "mobile-css";
        s.textContent = CSS;
        document.head.appendChild(s);
    })();

    /* ---------- 3. 좌우 여백은 재서 줄인다 ----------
       .tab-content 의 좌우 여백이 style.css 에 얼마로 잡혀 있는지
       모르니 넘겨짚지 않는다. 실제 값을 읽어서 큰 경우에만 줄인다. -------- */

    function trimSidePadding() {
        if (window.innerWidth > 430) return;

        var el = document.querySelector(".wrapper");
        if (!el) return;

        var cs = getComputedStyle(el);
        var left = parseFloat(cs.paddingLeft) || 0;
        if (left <= 13) return;                      // 이미 좁으면 그대로 둔다

        var want = window.innerWidth <= 375 ? 12 : 14;
        var rule = document.getElementById("mobile-side-css");
        if (!rule) {
            rule = document.createElement("style");
            rule.id = "mobile-side-css";
            document.head.appendChild(rule);
        }
        rule.textContent =
            ".wrapper{padding-left:" + want + "px !important;" +
            "padding-right:" + want + "px !important;}";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", trimSidePadding);
    } else {
        trimSidePadding();
    }
    window.addEventListener("resize", trimSidePadding);
    window.addEventListener("orientationchange", function () { setTimeout(trimSidePadding, 250); });
})();