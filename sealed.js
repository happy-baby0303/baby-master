/* ============================================================
   배냇함 — 봉인된 편지 (sealed.js)

   지금까지 만든 건 전부 부모가 '오늘' 보는 것이었다.
   사진도, 소리도, 편지도, 문답도.

   이건 방향이 반대다. 아이가 '나중에' 여는 것.
   상자는 원래 나중에 열려고 닫아두는 거니까,
   이게 있어야 배냇함이 서랍이 아니라 상자가 된다.

   봉인은 금고가 아니라 약속이다. 마음먹으면 들여다볼 수 있다.
   다만 실수로 눈에 띄지는 않게 해둔다.

   index.html 에서 notes.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var KEY = "tosil_sealed";
    var FREE_MAX = 3;
    var MAX_LEN = 2000;
    var DAY = 86400000;

    var GOLD    = "#B98A2E";
    var GOLD_BG = "rgba(185,138,46,0.10)";

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function myTitle() {
        var a = localStorage.getItem("user_role");
        if (a) return a === "dad" ? "아빠" : "엄마";
        var b = localStorage.getItem("tosil_userRole");
        if (b) return b === "husband" ? "아빠" : "엄마";
        return "엄마";
    }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function uid8() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function today0() {
        var d = new Date(); d.setHours(0, 0, 0, 0);
        return d;
    }

    function keyOf(d) {
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function fromKey(k) {
        var p = String(k).split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function pretty(k) {
        var d = fromKey(k);
        return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    }

    function daysLeft(k) {
        return Math.ceil((fromKey(k).getTime() - today0().getTime()) / DAY);
    }

    function comma(n) {
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function birth() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var d = fromKey(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function repaint() {
        if (typeof window.renderMemoryBox === "function") {
            try { window.renderMemoryBox(); } catch (e) {}
        }
    }

    /* ---------- 봉인 ----------
       암호화가 아니다. 로컬스토리지를 열어봐도 글이 바로 안 읽히게
       뒤집어 둘 뿐이다. 자기 편지를 굳이 뜯어보겠다면 막을 방법도 없고
       막을 이유도 없다. 이건 자기 자신과의 약속이다. -------- */

    function wrapText(t) {
        try { return btoa(unescape(encodeURIComponent(String(t)))).split("").reverse().join(""); }
        catch (e) { return String(t); }
    }

    function unwrapText(t) {
        try { return decodeURIComponent(escape(atob(String(t).split("").reverse().join("")))); }
        catch (e) { return String(t); }
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

    window.sealedLetters = function () {
        return load().slice().sort(function (a, b) {
            return fromKey(a.openAt) - fromKey(b.openAt);
        });
    };

    window.sealedCount = function () { return load().length; };

    window.sealedReady = function () {
        return load().filter(function (l) { return !l.opened && daysLeft(l.openAt) <= 0; }).length;
    };

    /* ---------- 가족 동기화 ----------
       20년을 이 폰 하나에 맡길 수는 없다. -------- */

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    window.syncSealedToFirebase = async function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.setDoc !== "function") return;
        try {
                await window.setDoc(window.doc(window.db, "sealed_" + code + suffix(), "status"), {
                list: load(),
                deleted: (window.Grave ? window.Grave.list("seal") : {})   // 👈 지운 목록도 같이
            });
        } catch (e) { console.warn("[봉인 편지] 동기화 실패", e); }
    };

    var unsub = null;
    window.startSealedRealtimeSync = function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} }

        var u = window.onSnapshot(window.doc(window.db, "sealed_" + code + suffix(), "status"), function (snap) {
            if (!snap.exists()) return;
            var data = snap.data() || {};
            var remote = data.list || [];
            if (window.Grave) window.Grave.merge("seal", data.deleted);   // 👈 짝꿍이 지운 것 받아오기
            var local = load(), seen = {}, out = [];

            local.concat(remote).forEach(function (l) {
                if (!l || !l.id) return;
                if (window.Grave && window.Grave.has("seal", l.id)) return;   // 👈 지운 건 되살리지 않기
                if (seen[l.id]) {
                    // 한쪽에서 열었으면 열린 상태가 이긴다
                    if (l.opened && !seen[l.id].opened) {
                        out[out.indexOf(seen[l.id])] = l;
                        seen[l.id] = l;
                    }
                    return;
                }
                seen[l.id] = l; out.push(l);
            });

            if (JSON.stringify(out) === JSON.stringify(local)) return;
            save(out);
            repaint();
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 언제 열까 ---------- */

    function presets() {
        var b = birth();
        var out = [];
        var y = function (n) {
            if (!b) return null;
            return keyOf(new Date(b.getFullYear() + n, b.getMonth(), b.getDate()));
        };

        if (b) {
            out.push({ label: "첫 생일", to: "첫 생일을 맞은", at: y(1) });
            out.push({ label: "다섯 살", to: "다섯 살이 된", at: y(5) });
            // 만 6세가 된 다음 해 3월. 태어난 해 + 7 년이면 맞는다.
            out.push({ label: "초등학교 입학", to: "학교에 가는", at: keyOf(new Date(b.getFullYear() + 7, 2, 2)) });
            out.push({ label: "열 살", to: "열 살이 된", at: y(10) });
            out.push({ label: "스무 살", to: "스무 살이 된", at: y(20) });
        }
        return out;
    }

    window.sealPresets = presets;

    // 라벨로 하나 집어오기 (첫 담기에서 '스무 살'을 고정으로 쓴다)
    window.sealPresetBy = function (label) {
        return presets().filter(function (p) { return p.label === label; })[0] || null;
    };

    /* ---------- 쓰기 ---------- */

    var draft = { at: null, label: "", to: "", locked: false };

    // fixed 를 주면 '언제 열까요' 단계를 건너뛰고 바로 쓰기로 간다.
    // 온보딩처럼 고민할 여유가 없는 자리에서는 선택지가 곧 이탈이다.
    window.openSealSheet = function (fixed) {
        var pro = (typeof window.isPremium !== "function") || window.isPremium();
        if (!pro && load().length >= FREE_MAX) {
            if (typeof window.openUpsell === "function") return window.openUpsell("book");
            return toast("봉인 편지는 " + FREE_MAX + "통까지 담을 수 있어요");
        }
        if (!birth()) return toast("생년월일을 먼저 등록해 주세요");

        if (fixed && fixed.at) {
            draft = { at: fixed.at, label: fixed.label, to: fixed.to, locked: true };
            drawSeal("write");
            return;
        }

        draft = { at: null, label: "", to: "", locked: false };
        drawSeal("when");
    };

    window.closeSealSheet = function () {
        var el = document.getElementById("seal-sheet");
        if (el) el.remove();
        document.body.style.overflow = "";
    };

    window.pickSealDate = function (at, label, to) {
        draft = { at: at, label: label, to: to, locked: false };
        drawSeal("write");
    };

    window.pickSealCustom = function () {
        var el = document.getElementById("seal-custom");
        if (!el || !el.value) return toast("날짜를 골라주세요");
        if (fromKey(el.value).getTime() <= today0().getTime()) return toast("오늘보다 뒤여야 해요");
        draft = { at: el.value, label: "직접 정한 날", to: "그날의", locked: false };
        drawSeal("write");
    };

    window.doSeal = function () {
        var ta = document.getElementById("seal-text");
        if (!ta) return;
        var text = String(ta.value || "").trim();
        if (text.length < 5) return toast("조금만 더 적어주세요");

        var go = function () {
            var list = load();
            list.push({
                id: uid8(),
                openAt: draft.at,
                label: draft.label,
                to: draft.to,
                body: wrapText(text),
                who: myTitle(),
                ts: Date.now(),
                opened: false
            });
            save(list);
            window.syncSealedToFirebase();
            window.closeSealSheet();
            repaint();
            toast("🕯️ 편지를 봉인했어요");
        };

        var left = comma(daysLeft(draft.at));
        if (typeof window.showConfirm === "function") {
            window.showConfirm(
                "이 편지는 " + pretty(draft.at) + "에\n" + babyName() + "가 열어보게 됩니다.\n\n" +
                "그때까지 " + left + "일,\n조용히 기다릴게요.",
                go, "🕯️", "봉인하기", GOLD);
        } else if (confirm("이 편지는 " + pretty(draft.at) + "에 열립니다. 봉인할까요?")) go();
    };

    function drawSeal(step) {
        var wrap = document.getElementById("seal-sheet");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "seal-sheet";
            wrap.setAttribute("style", "position:fixed; inset:0; z-index:100003; background:rgba(35,29,24,0.6); display:flex; align-items:flex-end; justify-content:center;");
            wrap.onclick = function (e) { if (e.target === wrap) window.closeSealSheet(); };
            document.body.appendChild(wrap);
            document.body.style.overflow = "hidden";
        }

        var body;
        if (step === "when") {
            var rows = presets().map(function (p) {
                var left = daysLeft(p.at);
                return '<div onclick="window.pickSealDate(\'' + p.at + '\',\'' + esc(p.label) + '\',\'' + esc(p.to) + '\')" ' +
                    'style="display:flex; justify-content:space-between; align-items:center; padding:15px 16px; ' +
                    'border:1px solid var(--border); border-radius:15px; margin-bottom:8px; cursor:pointer;">' +
                    '<div>' +
                        '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' + esc(p.label) + '</div>' +
                        '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:3px;">' + esc(pretty(p.at)) + '</div>' +
                    '</div>' +
                    '<span style="font-size:11.5px; font-weight:800; color:' + GOLD + '; white-space:nowrap;">' + comma(left) + '일 뒤</span>' +
                '</div>';
            }).join("");

            body =
                '<div style="font-size:12.5px; font-weight:700; color:var(--text-sub); margin-bottom:16px; line-height:1.6;">' +
                    '언제 열어보게 할까요' +
                '</div>' + rows +
                '<div style="display:flex; gap:8px; align-items:center; margin-top:12px;">' +
                    '<input id="seal-custom" type="date" style="flex:1; box-sizing:border-box; padding:13px; border-radius:14px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-m); font-size:14px;">' +
                    '<div onclick="window.pickSealCustom()" style="padding:13px 18px; background:var(--bg-sub); color:var(--text-s); border-radius:14px; font-size:13.5px; font-weight:800; cursor:pointer; white-space:nowrap;">직접 정하기</div>' +
                '</div>';
        } else {
            body =
                '<div style="background:' + GOLD_BG + '; border-radius:14px; padding:12px 15px; margin-bottom:14px;">' +
                    '<div style="font-size:12.5px; font-weight:800; color:' + GOLD + ';">' + esc(draft.label) + ' · ' + esc(pretty(draft.at)) + '</div>' +
                    '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:4px;">' +
                        comma(daysLeft(draft.at)) + '일을 기다렸다가 열립니다</div>' +
                '</div>' +

                '<textarea id="seal-text" rows="9" maxlength="' + MAX_LEN + '" ' +
                    'placeholder="' + esc(draft.to) + ' ' + esc(babyName()) + '에게,&#10;&#10;오늘 너는…" ' +
                    'style="width:100%; box-sizing:border-box; padding:16px; border-radius:16px; border:1px solid var(--border); ' +
                    'background:var(--bg-sub); color:var(--text-m); font-family:\'Nanum Pen Script\',cursive; ' +
                    'font-size:22px; line-height:1.65; outline:none; resize:none;"></textarea>' +

                '<div style="display:flex; gap:9px; margin-top:14px;">' +
                    (draft.locked
                        ? '<div onclick="window.closeSealSheet()" style="padding:15px 20px; background:var(--bg-sub); color:var(--text-sub); border-radius:14px; font-size:14px; font-weight:700; cursor:pointer;">닫기</div>'
                        : '<div onclick="window.openSealSheet()" style="padding:15px 20px; background:var(--bg-sub); color:var(--text-sub); border-radius:14px; font-size:14px; font-weight:700; cursor:pointer;">뒤로</div>') +
                    '<div onclick="window.doSeal()" style="flex:1; text-align:center; padding:15px; background:' + GOLD + '; color:#FFF; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">🕯️ 봉인하기</div>' +
                '</div>' +
                '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:14px; line-height:1.75; word-break:keep-all;">' +
                    '한 줄이어도 괜찮아요.<br>' +
                    esc(draft.to) + ' ' + esc(babyName()) + '는 그 한 줄도 오래 읽을 거예요.' +
                '</div>';
        }

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; max-height:88vh; overflow-y:auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:22px 20px calc(28px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                '<span style="font-size:16px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">🕯️ 미래의 ' + esc(babyName()) + '에게</span>' +
                '<span onclick="window.closeSealSheet()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-bottom:16px;">' + esc(myTitle()) + '가 쓰는 편지</div>' +
            body +
        '</div>';
    }

    /* ---------- 열기 ---------- */

    window.openSealedLetter = function (id) {
        var l = load().filter(function (x) { return x.id === id; })[0];
        if (!l) return;

        var left = daysLeft(l.openAt);
        if (!l.opened && left > 0) {
            return toast("아직 " + comma(left) + "일 남았어요");
        }

        if (!l.opened) {
            var list = load();
            list.forEach(function (x) { if (x.id === id) { x.opened = true; x.openedAt = Date.now(); } });
            save(list);
            window.syncSealedToFirebase();
            l.opened = true;
            repaint();
        }

        var w = document.createElement("div");
        w.id = "sealed-view";
        w.setAttribute("style", "position:fixed; inset:0; z-index:100003; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");
        w.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 22px 60px;">' +
            '<div style="display:flex; justify-content:flex-end; padding:20px 0 6px;">' +
                '<span onclick="document.getElementById(\'sealed-view\').remove(); document.body.style.overflow=\'\';" ' +
                    'style="font-size:24px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1;">×</span>' +
            '</div>' +
            '<div style="text-align:center; margin-bottom:30px;">' +
                '<div style="font-size:34px; margin-bottom:14px;">🕯️</div>' +
                '<div style="font-size:11px; font-weight:800; color:' + GOLD + '; letter-spacing:3px; margin-bottom:10px;">' + esc(l.label) + '</div>' +
                '<div class="serif-display" style="font-size:21px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">' +
                    esc(l.to) + ' ' + esc(babyName()) + '에게</div>' +
                '<div style="font-size:12px; font-weight:600; color:var(--text-sub); margin-top:8px;">' +
                    esc(l.who) + '가 ' + esc(pretty(keyOf(new Date(l.ts)))) + '에 씀</div>' +
            '</div>' +
            '<div style="font-family:\'Nanum Pen Script\',cursive; font-size:26px; line-height:1.8; color:var(--text-m); white-space:pre-wrap; word-break:keep-all;">' +
                esc(unwrapText(l.body)) + '</div>' +
            '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:44px; line-height:1.7;">' +
                comma(Math.round((Date.now() - l.ts) / DAY)) + '일 동안 봉인되어 있었어요' + '</div>' +
        '</div>';
        document.body.appendChild(w);
        document.body.style.overflow = "hidden";
    };

    window.removeSealed = function (id) {
            var go = function () {
            if (window.Grave) window.Grave.add("seal", id);   // 👈 묘비 세우기
            save(load().filter(function (x) { return x.id !== id; }));
            window.syncSealedToFirebase();
            var el = document.getElementById("sealed-box");
            if (el) { el.remove(); document.body.style.overflow = ""; window.openSealedBox(); }
            repaint();
        };
        if (typeof window.showConfirm === "function") {
            window.showConfirm("이 편지를 지울까요?\n봉인된 채로 사라집니다.", go, "🕯️", "지우기", "#F04452");
        } else if (confirm("이 편지를 지울까요?")) go();
    };

    /* ---------- 봉인함 ---------- */

    function sealCard(l) {
        var left = daysLeft(l.openAt);
        var ready = left <= 0;
        var done = !!l.opened;

        return '<div style="background:var(--bg-card); border:1px solid ' + (ready && !done ? GOLD : "var(--border)") + '; ' +
            'border-radius:20px; padding:20px 18px; margin-bottom:11px;">' +
            '<div onclick="window.openSealedLetter(\'' + esc(l.id) + '\')" style="display:flex; align-items:center; gap:15px; cursor:pointer;">' +
                '<div style="width:52px; height:52px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; ' +
                    'background:' + (done ? "var(--bg-sub)" : "linear-gradient(145deg,#D9AE55,#A87C22)") + '; ' +
                    'font-size:22px;' + (done ? " opacity:0.6;" : "") + '">' + (done ? "📜" : "🕯️") + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:10px; font-weight:800; color:' + GOLD + '; letter-spacing:1.8px; margin-bottom:4px;">' + esc(l.label) + '</div>' +
                    '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' +
                        esc(l.to) + ' ' + esc(babyName()) + '에게</div>' +
                    '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:4px;">' +
                        (done ? "열어봤어요  ·  " + esc(l.who) + " 씀"
                              : ready ? "이제 열어볼 수 있어요"
                                      : "개봉까지 " + comma(left) + "일  ·  " + esc(pretty(l.openAt))) + '</div>' +
                '</div>' +
                (ready && !done ? '<span style="font-size:11px; font-weight:800; color:#FFF; background:' + GOLD + '; padding:6px 11px; border-radius:10px; flex-shrink:0;">개봉</span>' : '') +
            '</div>' +
            '<div onclick="window.removeSealed(\'' + esc(l.id) + '\')" style="text-align:right; font-size:10.5px; font-weight:700; color:var(--text-sub); margin-top:10px; cursor:pointer;">지우기</div>' +
        '</div>';
    }

    window.openSealedBox = function () {
        var list = window.sealedLetters();

        var old = document.getElementById("sealed-box");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "sealed-box";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");

        var body = list.length
            ? list.map(sealCard).join("")
            : '<div style="text-align:center; padding:70px 24px;">' +
                  '<div style="font-family:\'Nanum Pen Script\',cursive; font-size:26px; color:var(--text-sub); line-height:1.7;">' +
                      '아직 봉인한 편지가 없어요<br>지금의 마음은 지금밖에 못 씁니다' +
                  '</div></div>';

        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 20px 60px;">' +
            '<div style="position:sticky; top:0; background:var(--bg-main); padding:22px 0 16px; z-index:2;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                    '<div>' +
                        '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">봉인된 편지</div>' +
                        '<div style="font-size:13px; font-weight:600; color:var(--text-sub); margin-top:6px;">' +
                            (list.length ? esc(list.length + "통이 " + babyName() + "를 기다리고 있어요") : "미래로 보내는 편지함") + '</div>' +
                    '</div>' +
                    '<div onclick="window.closeSealedBox()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; padding:2px 8px; line-height:1;">×</div>' +
                '</div>' +
            '</div>' +

            '<div onclick="window.closeSealedBox(); window.openSealSheet();" style="display:flex; justify-content:space-between; align-items:center; ' +
                'padding:16px 18px; border:1px dashed var(--border); border-radius:18px; margin-bottom:14px; cursor:pointer;">' +
                '<span style="font-size:13.5px; font-weight:800; color:var(--text-m);">🕯️ 새 편지 봉인하기</span>' +
                '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">첫 생일 · 입학 · 스무 살</span>' +
            '</div>' +

            body +

            '<div style="text-align:center; font-size:11px; font-weight:600; color:var(--text-sub); margin-top:34px; line-height:1.8;">' +
                '봉인은 잠금장치가 아니라 약속이에요<br>' +
                (syncCode() ? '가족 연동이 되어 있어 폰을 바꿔도 남습니다' : '가족 연동을 해두면 폰을 바꿔도 남습니다') +
            '</div>' +
        '</div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";
    };

    window.closeSealedBox = function () {
        var el = document.getElementById("sealed-box");
        if (el) el.remove();
        document.body.style.overflow = "";
    };

    /* ---------- 배냇함에 놓이는 한 줄 ---------- */

    window.renderSealedBar = function () {
        var list = window.sealedLetters();
        var ready = window.sealedReady();
        var next = list.filter(function (l) { return !l.opened && daysLeft(l.openAt) > 0; })[0];

        var right;
        if (ready) right = ready + '통을 열어볼 수 있어요';
        else if (next) right = comma(daysLeft(next.openAt)) + '일 뒤 · ' + esc(next.label);
        else if (list.length) right = '모두 열어봤어요';
        else right = '지금의 마음은 지금밖에';

        return '<div onclick="window.' + (list.length ? 'openSealedBox' : 'openSealSheet') + '()" ' +
            'style="display:flex; justify-content:space-between; align-items:center; padding:15px 17px; ' +
            'background:' + GOLD_BG + '; border-radius:16px; margin-bottom:14px; cursor:pointer;' +
            (ready ? ' border:1px solid ' + GOLD + ';' : '') + '">' +
            '<span style="font-size:12.5px; font-weight:800; color:' + GOLD + ';">🕯️ ' +
                (list.length ? '봉인된 편지 ' + list.length + '통' : '미래의 ' + esc(babyName()) + '에게') + '</span>' +
            '<span style="font-size:11.5px; font-weight:700; color:' + GOLD + '; opacity:0.8; white-space:nowrap;">' + right + '</span>' +
        '</div>';
    };

    /* ---------- 시작 ---------- */

    function boot() { window.startSealedRealtimeSync(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.sealedDebug = function () {
        var l = window.sealedLetters();
        console.log("봉인된 편지:", l.length + "통");
        l.forEach(function (x) {
            console.log("  " + x.label + " · " + x.openAt + " · " +
                (x.opened ? "열림" : comma(daysLeft(x.openAt)) + "일 남음"));
        });
        return l;
    };
})();