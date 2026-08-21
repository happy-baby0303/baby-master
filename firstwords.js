/* ============================================================
   배냇함 — 첫 단어 사전 (firstwords.js)

   사진은 다들 남긴다. 소리도 이제 남긴다.
   그런데 아이가 "처음 한 말"을 날짜와 함께 적어두는 앱은 없다.

     엄마   D+312
     아빠   D+340
     물     D+401
     시러   D+433

   글자라서 용량이 0이다. 서버비가 한 푼도 안 든다.
   그런데 20년 뒤에 이 목록은 사진보다 세게 온다.
   포토북 한 장이 통째로 여기서 나온다.

   그래서 무료다. 프리미엄으로 잠글 이유가 없다.

   index.html 에서 memories.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var KEY    = "tosil_first_words";
    var PURPLE = "#7F77DD";
    var GOLD   = "#B98A2E";
    var DAY    = 86400000;

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

    function pretty(k) {
        var p = String(k).split("-");
        return p.length === 3 ? (Number(p[1]) + "월 " + Number(p[2]) + "일") : String(k);
    }

    function dday(k) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s || !k) return "";
        var b = new Date(s + "T00:00:00").getTime();
        var t = new Date(String(k) + "T00:00:00").getTime();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / DAY);
        return n >= 0 ? "D+" + n : "";
    }

    /* ---------- 저장소 ---------- */

    function load() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    }

    function sorted() {
        return load().slice().sort(function (a, b) {
            return String(a.date).localeCompare(String(b.date));
        });
    }

    window.firstWords = sorted;
    window.firstWordCount = function () { return load().length; };

    /* ---------- 가족 동기화 (사진·편지와 같은 방식) ---------- */

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    window.syncWordsToFirebase = async function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.setDoc !== "function") return;
        try {
            await window.setDoc(window.doc(window.db, "words_" + code + suffix(), "status"), {
                list: load(),
                deleted: (window.Grave ? window.Grave.list("word") : {})
            });
        } catch (e) { console.warn("[첫 단어] 동기화 실패", e); }
    };

    var unsub = null;
    window.startWordsRealtimeSync = function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} }

        var u = window.onSnapshot(window.doc(window.db, "words_" + code + suffix(), "status"), function (snap) {
            if (!snap.exists()) return;
            var data = snap.data() || {};
            var remote = data.list || [];
            if (window.Grave) window.Grave.merge("word", data.deleted);

            var local = load(), seen = {}, out = [];
            local.concat(remote).forEach(function (w) {
                if (!w || !w.id || seen[w.id]) return;
                if (window.Grave && window.Grave.has("word", w.id)) return;
                seen[w.id] = 1; out.push(w);
            });

            if (JSON.stringify(out) === JSON.stringify(local)) return;
            save(out);
            repaint();
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 담고 빼기 ---------- */

    window.addFirstWord = function (word, date, note) {
        var w = String(word || "").trim();
        if (!w) return toast("한 마디를 적어주세요");

        var list = load();
        list.push({
            id: "w_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            word: w.slice(0, 20),
            date: date || todayKey(),
            note: String(note || "").trim().slice(0, 60),
            ts: Date.now()
        });
        save(list);
        window.syncWordsToFirebase();
        repaint();
        toast("💬 " + w + "  —  담았어요");
    };

    window.removeFirstWord = function (id) {
        var go = function () {
            if (window.Grave) window.Grave.add("word", id);
            save(load().filter(function (x) { return x.id !== id; }));
            window.syncWordsToFirebase();
            var sheet = document.getElementById("words-sheet");
            if (sheet) { sheet.remove(); window.openWordsSheet(); }
            repaint();
        };
        if (typeof window.showConfirm === "function") {
            window.showConfirm("이 말을 지울까요?", go, "💬", "지우기", "#F04452");
        } else if (confirm("이 말을 지울까요?")) go();
    };

    /* ---------- 담기 시트 ---------- */

    window.openWordSheet = function () {
        var old = document.getElementById("word-input-sheet");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "word-input-sheet";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100003; background:rgba(35,29,24,0.55); display:flex; align-items:flex-end; justify-content:center;");
        wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; background:var(--bg-card); border-radius:26px 26px 0 0; padding:22px 20px calc(30px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                '<span style="font-size:16.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.4px;">💬 오늘 처음 한 말</span>' +
                '<span onclick="document.getElementById(\'word-input-sheet\').remove()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:600; color:var(--text-sub); margin-bottom:16px; word-break:keep-all;">' +
                '들린 대로 적어주세요. "엄마" 보다 "어무마" 가 나중에 더 웃겨요.</div>' +

            '<input id="word-input" type="text" maxlength="20" placeholder="어무마" ' +
                'style="width:100%; box-sizing:border-box; padding:16px; border-radius:14px; border:1px solid var(--border); ' +
                'background:var(--bg-sub); color:var(--text-m); font-size:19px; font-weight:800; text-align:center; ' +
                'font-family:\'Gowun Batang\',serif; margin-bottom:10px;">' +

            '<input id="word-note" type="text" maxlength="60" placeholder="어떤 상황이었나요 (안 써도 돼요)" ' +
                'style="width:100%; box-sizing:border-box; padding:13px 14px; border-radius:13px; border:1px solid var(--border); ' +
                'background:var(--bg-sub); color:var(--text-m); font-size:13px; font-weight:600; margin-bottom:10px;">' +

            '<input id="word-date" type="date" value="' + todayKey() + '" ' +
                'style="width:100%; box-sizing:border-box; padding:13px 14px; border-radius:13px; border:1px solid var(--border); ' +
                'background:var(--bg-sub); color:var(--text-m); font-size:13px; font-weight:700; margin-bottom:16px;">' +

            '<div id="word-save" style="text-align:center; padding:16px; background:' + PURPLE + '; color:#FFF; ' +
                'border-radius:15px; font-size:15px; font-weight:800; cursor:pointer;">배냇함에 담기</div>' +
        '</div>';

        document.body.appendChild(wrap);

        setTimeout(function () {
            var i = document.getElementById("word-input");
            if (i) i.focus();
        }, 120);

        var btn = document.getElementById("word-save");
        if (btn) btn.onclick = function () {
            var w = (document.getElementById("word-input") || {}).value;
            var n = (document.getElementById("word-note")  || {}).value;
            var d = (document.getElementById("word-date")  || {}).value;
            if (!String(w || "").trim()) return toast("한 마디를 적어주세요");
            wrap.remove();
            window.addFirstWord(w, d, n);
        };
    };

    /* ---------- 사전 보기 ---------- */

    window.openWordsSheet = function () {
        var list = sorted();

        var old = document.getElementById("words-sheet");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "words-sheet";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");

        var rows = list.length
            ? list.map(function (w, i) {
                return '<div style="display:flex; align-items:center; gap:14px; padding:15px 2px; border-bottom:1px solid var(--border);">' +
                    '<div style="font-size:11px; font-weight:800; color:var(--text-sub); width:26px; flex-shrink:0;">' + (i + 1) + '</div>' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div class="serif-display" style="font-size:20px; font-weight:700; color:var(--text-m); letter-spacing:-0.5px;">' + esc(w.word) + '</div>' +
                        (w.note ? '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:3px; word-break:keep-all;">' + esc(w.note) + '</div>' : '') +
                    '</div>' +
                    '<div style="text-align:right; flex-shrink:0;">' +
                        '<div style="font-size:12px; font-weight:800; color:' + GOLD + ';">' + esc(dday(w.date)) + '</div>' +
                        '<div style="font-size:10.5px; font-weight:600; color:var(--text-sub); margin-top:2px;">' + esc(pretty(w.date)) + '</div>' +
                    '</div>' +
                    '<div onclick="window.removeFirstWord(\'' + esc(w.id) + '\')" style="font-size:15px; color:var(--text-sub); cursor:pointer; padding:0 2px; flex-shrink:0;">×</div>' +
                '</div>';
              }).join("")
            : '<div style="padding:60px 0; text-align:center; font-size:13.5px; font-weight:700; color:var(--text-sub); line-height:1.9;">' +
                  '아직 담긴 말이 없어요<br>' +
                  '옹알이도 괜찮아요. 들린 대로 적으면 됩니다' +
              '</div>';

        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:26px 22px calc(120px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                '<span style="font-size:19px; font-weight:900; color:var(--text-m); letter-spacing:-0.6px;">💬 ' + esc(babyName()) + '의 첫 단어 사전</span>' +
                '<span onclick="document.getElementById(\'words-sheet\').remove(); document.body.style.overflow=\'\';" ' +
                    'style="font-size:24px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1;">×</span>' +
            '</div>' +
            '<div style="font-size:12.5px; font-weight:600; color:var(--text-sub); margin-bottom:20px;">' +
                (list.length ? list.length + '가지 말을 배웠어요' : '처음 한 말을 날짜와 함께 남겨두세요') + '</div>' +
            rows +
            '<div onclick="document.getElementById(\'words-sheet\').remove(); document.body.style.overflow=\'\'; window.openWordSheet();" ' +
                'style="position:fixed; left:22px; right:22px; bottom:calc(26px + env(safe-area-inset-bottom, 0px)); max-width:476px; margin:0 auto; ' +
                'text-align:center; padding:17px; background:' + PURPLE + '; color:#FFF; border-radius:16px; ' +
                'font-size:15.5px; font-weight:800; cursor:pointer; box-shadow:0 8px 20px rgba(127,119,221,0.3);">＋ 한 마디 담기</div>' +
        '</div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";
    };

    /* ---------- 홈 카드 ----------
       배냇함 카드 아래. 하루 열 번 보는 자리에 둔다. -------- */

    function cardHTML() {
        var list = sorted();
        var latest = list.length ? list[list.length - 1] : null;

        return '' +
        '<div id="home-words-card" onclick="window.openWordsSheet()" ' +
            'style="display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:22px; padding:16px 18px; margin-bottom:24px; cursor:pointer;">' +
            '<div style="font-size:22px; flex-shrink:0;">💬</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:14.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">첫 단어 사전</div>' +
                '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    (latest
                        ? '가장 최근 · “' + esc(latest.word) + '”  ' + esc(dday(latest.date))
                        : esc(babyName()) + '가 처음 한 말을 남겨보세요') +
                '</div>' +
            '</div>' +
            '<div onclick="event.stopPropagation(); window.openWordSheet();" ' +
                'style="font-size:12px; font-weight:800; color:' + PURPLE + '; background:rgba(127,119,221,0.10); ' +
                'padding:7px 13px; border-radius:12px; flex-shrink:0;">＋ 담기</div>' +
        '</div>';
    }

    function mount() {
        var anchor = document.getElementById("home-memory-card")
                  || document.getElementById("home-memorybox-card")
                  || document.getElementById("now-status-card");
        if (!anchor || !anchor.parentNode) return;

        var old = document.getElementById("home-words-card");
        var box = document.createElement("div");
        box.innerHTML = cardHTML();
        var el = box.firstChild;

        if (old) old.parentNode.replaceChild(el, old);
        else anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }

    function repaint() {
        try { mount(); } catch (e) {}
    }

    window.refreshWordsCard = mount;

    function boot() {
        setTimeout(mount, 1500);
        setTimeout(function () { window.startWordsRealtimeSync(); }, 3000);
        setInterval(mount, 5 * 60000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.wordsDebug = function () {
        console.log("담긴 말:", window.firstWordCount() + "가지");
        sorted().forEach(function (w) {
            console.log("  " + w.word + "  " + dday(w.date) + "  (" + w.date + ")");
        });
    };
})();