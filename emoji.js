/* ============================================================
   배냇함 — 이모지 정리 (emoji.js)

   화면에 뜨는 이모지가 742개였다. 그중 138개는 장식이다.
   ✨ 🌟 🎉 🚀 는 정보를 하나도 안 주면서 화면만 시끄럽게 한다.

   반대로 🍼 💩 🌙 은 글자보다 빠르게 읽힌다. 그건 남긴다.

   규칙 셋
     1. 장식 목록에 있는 건 지운다
     2. 한 요소에 이모지가 둘 이상이면 맨 앞 하나만 남긴다
     3. 문장 한가운데 있는 건 지운다 (앞머리에 있는 것만 허용)

   ⚠️ 사용자가 쓴 글은 절대 안 건드린다.
      편지 · 한 줄 · 첫 단어 · 사진 한마디 · 맘수다 글에는
      부모가 직접 넣은 이모지가 있다. 그건 그 사람의 기록이다.

   맨 마지막, fit.js 앞에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 지울 것 ----------
       정보를 안 주고 분위기만 잡는 것들. -------- */

    var DECOR = "✨🌟💫🎉🎊🚀💯🙌👏💪💎👑🥺🤗😆🥰💕💛🎯🔮🪄👈👇👆➔🛑❗‼🌈🎈🎀💖💗💓💞";

    /* ---------- 손대면 안 되는 곳 ----------
       사용자가 쓴 글, 그리고 이모지가 화면의 전부인 곳. -------- */

    var SAFE = [
        "#note-sheet", "#word-input-sheet", "#words-sheet", "#diary-box",
        "#seal-sheet", "#sealed-sheet", "#voice-sheet", "#postcard-picker",
        "#kiosk-modal",                      // 연습장은 실제 매장과 같아야 한다
        "#mb-photo-viewer",
        "[contenteditable]", "textarea", "input", "select", "option",
        ".note-text", ".letter-body", ".user-text",
        "#tab-community", "#milestone-capture-area"
    ].join(",");

    var SKIP_TAG = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1 };

    /* ---------- 이모지 찾기 ---------- */

    var EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{2B00}-\u{2BFF}]\u{FE0F}?/gu;

    function isDecor(ch) {
        return DECOR.indexOf(ch.replace(/\uFE0F/g, "")) > -1;
    }

    /* ---------- 한 덩어리 글자 다듬기 ---------- */

    function clean(text) {
        if (!EMO.test(text)) { EMO.lastIndex = 0; return text; }
        EMO.lastIndex = 0;

        var kept = 0;
        var out = text.replace(EMO, function (m, offset) {
            // 1. 장식은 무조건 뺀다
            if (isDecor(m)) return "";

            // 2. 이미 하나 남겼으면 그만
            if (kept >= 1) return "";

            // 3. 앞머리에 있는 것만 남긴다 (앞에 글자가 있으면 문장 중간이다)
            var before = text.slice(0, offset).replace(EMO, "").trim();
            if (before.length > 0) return "";

            kept++;
            return m;
        });

        // 이모지를 빼면서 생긴 겹공백 정리
        return out.replace(/[ \t]{2,}/g, " ").replace(/^\s+/, function (s) {
            return s.indexOf("\n") > -1 ? s : "";
        });
    }

    /* ---------- 훑기 ---------- */

    var count = 0;

    function walk(root) {
        root = root || document.body;
        if (!root || !root.querySelectorAll) return;

        var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var jobs = [];
        var n;

        while ((n = it.nextNode())) {
            var p = n.parentNode;
            if (!p || SKIP_TAG[p.tagName]) continue;
            if (p.closest && p.closest(SAFE)) continue;
            if (!n.nodeValue || n.nodeValue.length > 200) continue;   // 긴 글은 사용자 글일 확률이 높다
            jobs.push(n);
        }

        for (var i = 0; i < jobs.length; i++) {
            var node = jobs[i];
            var next = clean(node.nodeValue);
            if (next !== node.nodeValue) { node.nodeValue = next; count++; }
        }
    }

    window.tidyEmoji = function (root) { walk(root); };

    /* ---------- 다시 그려도 따라가기 ---------- */

    var pending = null;
    function schedule() {
        if (pending) return;
        pending = setTimeout(function () { pending = null; walk(); }, 120);
    }

    function boot() {
        walk();
        setTimeout(walk, 800);
        setTimeout(walk, 2500);

        if (window.MutationObserver) {
            new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
                }
            }).observe(document.body, { childList: true, subtree: true });
        }

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) schedule();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.emojiDebug = function () {
        console.log("다듬은 글자 덩어리:", count + "개");
        console.log("지우는 목록:", DECOR);

        // 지금 화면에 남은 이모지 세보기
        var left = {}, it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n;
        while ((n = it.nextNode())) {
            var p = n.parentNode;
            if (!p || SKIP_TAG[p.tagName]) continue;
            if (p.offsetParent === null && p.tagName !== "BODY") continue;   // 안 보이는 건 뺀다
            (n.nodeValue.match(EMO) || []).forEach(function (e) { left[e] = (left[e] || 0) + 1; });
        }
        var arr = Object.keys(left).map(function (k) { return [k, left[k]]; })
                        .sort(function (a, b) { return b[1] - a[1]; });
        console.log("지금 화면에 보이는 이모지:", arr.length + "종");
        console.log("  " + arr.slice(0, 25).map(function (x) { return x[0] + x[1]; }).join("  "));
    };
})();