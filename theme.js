/* ============================================================
   배냇함 — 색 정리 (theme.js)

   이 앱에는 디자인 시스템이 두 개 겹쳐 있었다.
   뼈대는 토스 팔레트(파랑 #3182F6 이 185번, 차가운 회색 계열),
   그 위에 배냇함 감성이 페인트로 덧칠돼 있었다.

   아기 추억을 담는 앱에서 제일 많이 쓰인 색이 은행 파랑이면 안 된다.
   색이 전부 style="" 안에 박혀 있어 CSS 로는 못 덮으니,
   뜨는 순간 문자열을 갈아끼운다.

   원칙
     주조색  보라 #7F77DD  — 기록, 편지, 도감, 배냇함
     보조색  금색 #B98A2E  — 기념일, 엽서, 프리미엄
     경고색  빨강 #F04452  — 진짜 위험할 때만 (그대로 둔다)
     나머지는 전부 따뜻한 먹색과 미색

   index.html 에서 mobile.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. 색 지도 ---------- */

    var MAP = {
        // 파랑 계열 → 배냇함 보라
        "#3182F6": "#7F77DD",
        "#1B64DA": "#6A61CE",
        "#38BDF8": "#B98A2E",   // VIP 하늘색 → 프리미엄 금색
        "#0F172A": "#3B322C",
        "#1E293B": "#4A403A",

        // 파랑 배경 → 연보라
        "#E8F3FF": "#F0EEFB",
        "#EBF4FF": "#F2F0FC",

        // 차가운 먹/회색 → 따뜻한 먹/회색
        "#191F28": "#4A413C",
        "#333D4B": "#5A4D44",
        "#4E5968": "#7A6F68",
        "#8B95A1": "#A3958A",
        "#B0B8C1": "#C4B5A9",
        "#94A3B8": "#B3A498",
        "#A1A1AA": "#B5A99E",

        // 차가운 테두리·바탕 → 종이 톤
        "#E5E8EB": "#EDE6DE",
        "#F2F5F8": "#F7F3ED",
        "#F9FAFB": "#FBF8F3",
        "#F2F4F6": "#F6F2EC",
        "#F8F9FA": "#FAF7F2",

        // 흩어진 보라들을 하나로
        "#A855F7": "#7F77DD",
        "#7C3AED": "#6A61CE",
        "#9333EA": "#6A61CE",
        "#F3E8FF": "#F0EEFB",
        "#FDF4FF": "#F7F4FD",
        "#F4EBFF": "#EFEBFB",
        "#FAF5FF": "#F6F3FC",

        // 초록(가계부)·주황 → 금색 계열로 흡수
        "#00B37A": "#B98A2E",
        "#10B981": "#B98A2E",
        "#059669": "#A07722",
        "#E6F7F2": "#FAF4E6",
        "#F59E0B": "#B98A2E",
        "#FBBF24": "#D2A340",
        "#D97706": "#A07722",
        "#FFFBEB": "#FDF9EE",
        "#FEF3C7": "#F7EBD2"

        // #F04452, #FFF0F1, #D32F2F, #EF4444 는 손대지 않는다.
        // 경고는 경고로 남아야 눈에 띈다.
    };

    var KEYS = Object.keys(MAP);
    var RE = new RegExp(KEYS.join("|"), "gi");
    var LOOKUP = {};
    KEYS.forEach(function (k) { LOOKUP[k.toUpperCase()] = MAP[k]; });

    /* ---------- 2. 다크모드는 '재서' 뒤집는다 ----------
       이 앱은 색이 인라인에 천 군데 넘게 박혀 있다.
       목록으로 외우는 건 불가능하니 밝기를 재서 판단한다.

       규칙은 한 방향으로만 간다.
         글자  — 어두우면 밝게. 이미 밝으면 그대로.
         바탕  — 밝으면 어둡게. 이미 어둡거나 색이 있으면 그대로.

       양방향으로 뒤집으면 보라 버튼 위의 흰 글씨가 검게 변한다. -------- */

    function hexToHsl(hex) {
        var r = parseInt(hex.slice(1, 3), 16) / 255,
            g = parseInt(hex.slice(3, 5), 16) / 255,
            b = parseInt(hex.slice(5, 7), 16) / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        var l = (mx + mn) / 2, h = 0, sat = 0;
        if (mx !== mn) {
            var d = mx - mn;
            sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            if (mx === r)      h = ((g - b) / d + (g < b ? 6 : 0));
            else if (mx === g) h = ((b - r) / d + 2);
            else               h = ((r - g) / d + 4);
            h /= 6;
        }
        return { h: h, s: sat, l: l };
    }

    function hslToHex(o) {
        var h = o.h, s = o.s, l = o.l, r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            var hue = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue(p, q, h + 1 / 3); g = hue(p, q, h); b = hue(p, q, h - 1 / 3);
        }
        var to = function (v) {
            var x = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16);
            return x.length === 1 ? "0" + x : x;
        };
        return "#" + to(r) + to(g) + to(b);
    }

    function lightenText(hex) {
        var c = hexToHsl(hex);
        if (c.l > 0.58) return hex;                 // 이미 읽히는 밝기
        c.l = 0.92 - c.l * 0.45;
        if (c.s > 0.55) c.s = 0.55;                 // 형광색 방지
        return hslToHex(c);
    }

    function darkenSurface(hex) {
        var c = hexToHsl(hex);
        if (c.l < 0.80) return hex;                 // 어둡거나 색이 있으면 둔다
        c.l = Math.min(0.30, 0.11 + (1 - c.l) * 1.3);
        if (c.s > 0.30) c.s = 0.30;
        return hslToHex(c);
    }

    var HEX = /#[0-9A-Fa-f]{6}\b/g;
    var TEXT_PROP    = /^color$/i;
    var SURFACE_PROP = /^(background|background-color|border|border-color|border-(top|bottom|left|right)(-color)?|outline|outline-color)$/i;

    function darkify(style) {
        return style.replace(/([a-zA-Z-]+)\s*:\s*([^;]*)/g, function (all, prop, val) {
            if (val.indexOf("#") === -1) return all;
            var fn = TEXT_PROP.test(prop) ? lightenText
                   : SURFACE_PROP.test(prop) ? darkenSurface
                   : null;
            if (!fn) return all;
            return all.replace(HEX, function (h) { return fn(h); });
        });
    }

    function isDark() {
        return document.body && document.body.classList.contains("dark-mode");
    }

    function convert(text) {
        var out = text.replace(RE, function (m) {
            return LOOKUP[m.toUpperCase()] || m;
        });
        return isDark() ? darkify(out) : out;
    }

    /* ---------- 3. CSS 변수 ---------- */

    (function vars() {
        if (document.getElementById("theme-vars")) return;
        var s = document.createElement("style");
        s.id = "theme-vars";
        s.textContent = `
:root {
    --primary: #7F77DD !important;
    --accent:  #B98A2E !important;
    --text-m:  #4A413C !important;
    --text-s:  #7A6F68 !important;
    --text-sub:#A3958A !important;
    --border:  #EDE6DE !important;
    --success: #B98A2E !important;
    --bg-main: #FAF7F2 !important;
    --bg-sub:  #F7F3ED !important;
}
body:not(.dark-mode) { background: #FAF7F2 !important; }
body:not(.dark-mode) .wrapper { background: #FAF7F2 !important; }

.nav-item.active { color: #7F77DD !important; }
.system-status   { color: #7F77DD !important; }

/* 다크모드 — 변수 쪽도 같이 데운다 */
body.dark-mode {
    color-scheme: dark;                 /* select 드롭다운·달력 같은 기본 UI */
    --primary: #9B93E8 !important;
    --accent:  #D2A340 !important;
    --text-m:  #EDE7E1 !important;
    --text-s:  #C4B8AE !important;
    --text-sub:#9A8E84 !important;
    --border:  #3A332D !important;
    --bg-main: #16130F !important;
    --bg-card: #221E1A !important;
    --bg-sub:  #2B2621 !important;
}
body.dark-mode .nav-item.active { color: #9B93E8 !important; }
body.dark-mode select option { background: #221E1A; color: #EDE7E1; }

/* 숫자가 배지에 밀려 잘리지 않게 */
[data-fit], .num-keep { min-width: 0; }
`;
        document.head.appendChild(s);
    })();

    /* ---------- 4. 인라인 스타일 갈아끼우기 ----------
       원본을 data-theme-src 에 남겨둔다. 그래야 다크모드를
       껐다 켜도 원래 색에서 다시 계산할 수 있다. -------- */

    var SKIP = { SCRIPT: 1, STYLE: 1, CANVAS: 1, IMG: 1 };

    function one(el) {
        if (!el || el.nodeType !== 1 || SKIP[el.tagName]) return;
        if (el.closest && el.closest("#mb-photo-viewer")) return;   // 사진 뷰어는 원래 어둡다
        if (el.closest && el.closest("#premium-paywall-modal, #vip-modal-overlay")) return;   // 👈 결제 화면은 원래 색 그대로
        if (el.closest && el.closest("#kiosk-modal")) return;   // 👈 키오스크는 실제 매장과 같아야 연습이 된다

        var src = el.getAttribute("data-theme-src");
        if (src === null) {
            src = el.getAttribute("style") || "";
            if (src.indexOf("#") === -1) return;                    // 색이 없으면 볼 일 없다
            el.setAttribute("data-theme-src", src);
        }

                var next = convert(src);

        // 👇 display 는 화면 로직의 것이다. 색만 바꾸고 이건 그대로 둔다.
        //    안 그러면 display:block 으로 연 화면을 기억해둔 display:none 으로 덮어버린다.
        var live = el.getAttribute("style") || "";
        var dm = live.match(/(^|;)\s*display\s*:\s*([^;]+)/i);
        if (dm) {
            var d = dm[2].trim();
            if (/(^|;)\s*display\s*:/i.test(next)) {
                next = next.replace(/(^|;)(\s*)display\s*:\s*[^;]+/i, "$1$2display:" + d);
            } else {
                next = next.replace(/;\s*$/, "") + "; display:" + d;
            }
        }

               if (next !== el.getAttribute("style")) {
            el.setAttribute("data-theme-applied", "true"); 
            el.setAttribute("style", next);
        }
    }

    function paint(root) {
        root = root || document.body;
        if (!root.querySelectorAll) return;
        one(root);
        var list = root.querySelectorAll('[style*="#"], [data-theme-src]');
        for (var i = 0; i < list.length; i++) one(list[i]);
    }

    /* ---------- 5. 다시 그려도 따라가기 ---------- */

    var pending = null;
    function schedule() {
        if (pending) return;
              // 60ms 는 눈에 보인다. 다음 화면 그리기 직전에 칠하면 안 보인다.
        pending = requestAnimationFrame(function () { pending = null; paint(); });
    }

    function watch() {
        if (!window.MutationObserver) return;

            new MutationObserver(function (muts) {
            // 👇 return 으로 빠져나가면 나머지 변경을 통째로 놓친다.
            //    다른 모듈이 DOM 을 먼저 건드리면 스타일 변경이 묻혀서
            //    캐시가 안 지워지고, 옛 스타일로 덮어쓰는 사고가 난다.
            var need = false;

            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];

                if (m.type === "childList" && m.addedNodes.length) { need = true; continue; }

                if (m.type === "attributes" && m.attributeName === "style") {
                    if (m.target.getAttribute("data-theme-applied") === "true") {
                        // theme.js가 칠한 거면 마커만 지운다 (무한루프 방지)
                        m.target.removeAttribute("data-theme-applied");
                    } else {
                        // 외부 JS가 바꾼 거면 캐시를 버리고 새 값을 기억한다
                        m.target.removeAttribute("data-theme-src");
                        need = true;
                    }
                }
            }

            if (need) schedule();
        }).observe(document.body, {
            childList: true, subtree: true,
            attributes: true, attributeFilter: ["style"]
        });

        // 다크모드를 켜고 끄면 전부 다시 계산
        new MutationObserver(function () {
            paint();
        }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

       function boot() {
        paint();

        // 👇 첫 덧칠이 끝났다. 이제 애니메이션을 풀어준다.
        //    이 줄이 없으면 파란색이 보라색으로 물드는 게 그대로 보인다.
        document.documentElement.classList.remove("theme-booting");

        watch();
        setTimeout(paint, 800);      // script.js 가 늦게 그리는 화면들
        setTimeout(paint, 2500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.themeRepaint = function () { paint(); };
    window.themeMap = MAP;
})();