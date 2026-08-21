/* ============================================================
   배냇함 — 설정 카드 정리 (settingscards.js) v3

   자리를 옮겼다.
     v2 — "설정" 제목 바로 아래
     v3 — "앱 설정" 과 "데이터 및 기록 관리" 사이

   맨 위는 프로필과 가족 코드 자리다.
   설정 탭에 들어오는 이유의 절반이 그 둘이고,
   엄지가 제일 편하게 닿는 곳이기도 하다.

   찾는 방법
     "데이터 및 기록 관리" 소제목을 찾아 그 앞에 끼운다.
     못 찾으면 "고객 지원 및 약관" 앞, 그것도 없으면 맨 아래.

   index.html 에서 homelayout.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var CARD_IDS = ["remind-card", "export-card", "push-permission-card"];
    var GROUP_ID = "bnh-care-group";
    var BODY_ID  = "bnh-care-body";

    /* 이 소제목 '앞에' 끼운다. 위에서부터 먼저 찾는 것을 쓴다. */
    var ANCHORS = ["데이터 및 기록 관리", "고객 지원 및 약관"];

    function tab() { return document.getElementById("tab-settings"); }

    /* ---------- 소제목 찾기 ----------
       조건 셋을 다 만족해야 소제목이다.
         · 자식 요소가 없다 (잎 노드)
         · 글자가 정확히 일치
         · 우리가 만든 상자 안이 아니다 -------- */

    function findLeaf(container, text) {
        var all = container.querySelectorAll("div, h1, h2, h3, span, p");
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.children.length) continue;
            if (el.closest && el.closest("#" + GROUP_ID)) continue;
            if ((el.textContent || "").trim() === text) return el;
        }
        return null;
    }

    function findAnchor(container) {
        for (var i = 0; i < ANCHORS.length; i++) {
            var el = findLeaf(container, ANCHORS[i]);
            if (el && el.parentNode) return el;
        }
        return null;
    }

    /* ---------- 상자 ---------- */

    function ensureGroup() {
        var g = document.getElementById(GROUP_ID);
        if (g) return g;

        g = document.createElement("div");
        g.id = GROUP_ID;
        g.style.cssText = "margin:0 0 24px;";
        g.innerHTML =
            '<div style="font-size:12px; font-weight:900; color:var(--text-sub); ' +
                'letter-spacing:0.2px; margin:0 4px 10px;">알림과 보관</div>' +
            '<div id="' + BODY_ID + '"></div>';
        return g;
    }

    /* ---------- 자리 잡기 ---------- */

    function tidy() {
        var container = tab();
        if (!container) return;

        var any = CARD_IDS.some(function (id) { return document.getElementById(id); });
        if (!any) return;

        var g = ensureGroup();
        var body = document.getElementById(BODY_ID) || g.lastElementChild;

        // 카드를 순서대로 상자에 담는다
        CARD_IDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (el.parentNode !== body) body.appendChild(el);
            el.style.marginBottom = "10px";
        });

        // 소제목 바로 '앞'에
        var anchor = findAnchor(container);
        if (anchor) {
            if (anchor.previousSibling !== g) anchor.parentNode.insertBefore(g, anchor);
            return;
        }

        // 소제목을 못 찾으면 통짜 덩어리 맨 아래에 (맨 위로 튀는 것보다 낫다)
        var shell = container.firstElementChild;
        if (shell && shell.id !== GROUP_ID) {
            if (shell.lastElementChild !== g) shell.appendChild(g);
        } else if (container.lastElementChild !== g) {
            container.appendChild(g);
        }
    }

    window.tidySettingsCards = tidy;

    /* ---------- 설정 탭이 다시 그려질 때마다 ----------
       innerHTML 을 통째로 갈아끼우므로 상자도 카드도 매번 사라진다.
       각 모듈이 카드를 다시 만들고 나면 우리가 다시 담는다. -------- */

    (function hook() {
        var _origin = window.renderSettingsTab;
        window.renderSettingsTab = function () {
            var out;
            if (typeof _origin === "function") out = _origin.apply(this, arguments);
            setTimeout(tidy, 20);
            setTimeout(tidy, 120);
            setTimeout(tidy, 400);
            return out;
        };
    })();

    function boot() {
        setTimeout(tidy, 1200);
        setTimeout(tidy, 3000);
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(tidy, 300);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.settingsDebug = function () {
        var c = tab();
        if (!c) return console.log("설정 탭 없음");

        ANCHORS.forEach(function (t) {
            console.log('소제목 "' + t + '":', findLeaf(c, t) ? "찾음" : "없음");
        });

        var g = document.getElementById(GROUP_ID);
        console.log("상자 위치:", g
            ? (g.nextElementSibling
                ? '"' + (g.nextElementSibling.textContent || "").trim().slice(0, 14) + '" 바로 앞'
                : "맨 아래")
            : "아직 없음");

        CARD_IDS.forEach(function (id) {
            var el = document.getElementById(id);
            console.log("  " + id + ":", el ? (el.parentNode.id === BODY_ID ? "상자 안 ✅" : "상자 밖 ❌") : "없음");
        });
    };
})();