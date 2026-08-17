/* ============================================================
   육아메이트 — 한 줄 (notes.js)

   지금까지 배냇함에서 부모가 쓸 수 있는 글은
   사진에 붙는 캡션과 편지 답장뿐이었다.

   그런데 정작 남기고 싶은 건 이런 거다.
     "오늘 처음으로 나를 보고 웃었다."

   사진도 없고 도감에도 없는 날의, 한 줄.
   프리미엄으로 잠그지 않는다. 이건 배냇함의 뼈대다.

   index.html 에서 voice.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var IDX_KEY = "tosil_day_notes";
    var MAX_LEN = 200;
    var DAY = 86400000;

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function myTitle() {
        return (localStorage.getItem("user_role") || "mom") === "dad" ? "아빠" : "엄마";
    }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function uid8() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function fromKey(k) {
        var p = String(k).split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function prettyKey(k) {
        var d = fromKey(k);
        return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    }

    function ddayOf(k) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return "";
        var b = new Date(s + "T00:00:00").getTime();
        if (isNaN(b)) return "";
        var n = Math.floor((fromKey(k).getTime() - b) / DAY);
        return n >= 0 ? "D+" + n + "일" : "";
    }

    function repaint() {
        if (typeof window.renderMemoryBox === "function") {
            try { window.renderMemoryBox(); } catch (e) {}
        }
    }

    /* ---------- 저장소 ----------
       note = { id, text, ts, who } -------- */

    function loadIndex() {
        try {
            var v = JSON.parse(localStorage.getItem(IDX_KEY));
            return (v && typeof v === "object") ? v : {};
        } catch (e) { return {}; }
    }

    function saveIndex(o) {
        try { localStorage.setItem(IDX_KEY, JSON.stringify(o)); } catch (e) {}
    }

    window.getDayNotes = function (key) {
        var a = loadIndex()[key];
        return Array.isArray(a) ? a : [];
    };

    window.noteDays = function () {
        var idx = loadIndex();
        return Object.keys(idx).filter(function (k) {
            return Array.isArray(idx[k]) && idx[k].length;
        });
    };

    window.noteCount = function () {
        var idx = loadIndex(), n = 0;
        Object.keys(idx).forEach(function (k) { if (Array.isArray(idx[k])) n += idx[k].length; });
        return n;
    };

    function putNote(key, note) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) idx[key] = [];
        idx[key].push(note);
        saveIndex(idx);
    }

    function editNote(key, id, text) {
        var idx = loadIndex();
        (idx[key] || []).forEach(function (n) {
            if (n.id === id) { n.text = text; n.ts = Date.now(); }
        });
        saveIndex(idx);
    }

    function dropNote(key, id) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) return;
        idx[key] = idx[key].filter(function (n) { return n.id !== id; });
        if (!idx[key].length) delete idx[key];
        saveIndex(idx);
    }

    /* ---------- 가족 동기화 ---------- */

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    window.syncNotesToFirebase = async function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.setDoc !== "function") return;
        try {
            await window.setDoc(window.doc(window.db, "notes_" + code + suffix(), "status"), { days: loadIndex() });
        } catch (e) { console.warn("[한 줄] 동기화 실패", e); }
    };

    var unsub = null;
    window.startNoteRealtimeSync = function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} }

        var u = window.onSnapshot(window.doc(window.db, "notes_" + code + suffix(), "status"), function (snap) {
            if (!snap.exists()) return;
            var remote = (snap.data() || {}).days || {};
            var local = loadIndex(), merged = {};

            Object.keys(local).concat(Object.keys(remote)).forEach(function (k) {
                if (merged[k]) return;
                var seen = {}, out = [];
                (local[k] || []).concat(remote[k] || []).forEach(function (n) {
                    if (!n || !n.id) return;
                    // 같은 글이 양쪽에 있으면 나중에 고친 쪽을 남긴다
                    if (seen[n.id]) {
                        if ((n.ts || 0) > (seen[n.id].ts || 0)) {
                            out[out.indexOf(seen[n.id])] = n;
                            seen[n.id] = n;
                        }
                        return;
                    }
                    seen[n.id] = n; out.push(n);
                });
                out.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
                if (out.length) merged[k] = out;
            });

            if (JSON.stringify(merged) === JSON.stringify(local)) return;
            saveIndex(merged);
            repaint();
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 쓰기 ---------- */

    var editing = { key: null, id: null };

    window.openNoteSheet = function (key, id) {
        editing = { key: key || todayKey(), id: id || null };

        var cur = "";
        if (id) {
            var n = window.getDayNotes(editing.key).filter(function (x) { return x.id === id; })[0];
            cur = n ? n.text : "";
        }

        var old = document.getElementById("note-sheet");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "note-sheet";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:rgba(35,29,24,0.55); display:flex; align-items:flex-end; justify-content:center;");
        wrap.onclick = function (e) { if (e.target === wrap) window.closeNoteSheet(); };

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; background:var(--bg-card); border-radius:26px 26px 0 0; padding:22px 20px calc(28px + env(safe-area-inset-bottom, 0px));">' +

            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                '<span style="font-size:16px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">✍️ ' + esc(myTitle()) + '의 한 줄</span>' +
                '<span onclick="window.closeNoteSheet()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-bottom:16px;">' +
                esc(prettyKey(editing.key)) + (ddayOf(editing.key) ? "  ·  " + esc(ddayOf(editing.key)) : "") + '</div>' +

            '<textarea id="note-input" rows="5" maxlength="' + MAX_LEN + '" ' +
                'placeholder="오늘 처음으로 나를 보고 웃었다" ' +
                'style="width:100%; box-sizing:border-box; padding:16px; border-radius:16px; border:1px solid var(--border); ' +
                'background:var(--bg-sub); color:var(--text-m); font-family:\'Nanum Pen Script\',cursive; ' +
                'font-size:22px; line-height:1.6; outline:none; resize:none;">' + esc(cur) + '</textarea>' +

            '<div id="note-count" style="text-align:right; font-size:11px; font-weight:700; color:var(--text-sub); margin-top:7px;">' +
                cur.length + ' / ' + MAX_LEN + '</div>' +

            '<div style="display:flex; gap:9px; margin-top:14px;">' +
                (id ? '<div onclick="window.deleteNote()" style="padding:15px 20px; background:var(--bg-sub); color:var(--text-sub); border-radius:14px; font-size:14px; font-weight:700; cursor:pointer;">지우기</div>' : '') +
                '<div onclick="window.saveNote()" style="flex:1; text-align:center; padding:15px; background:#7F77DD; color:#FFF; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">' +
                    (id ? "고쳐 두기" : "배냇함에 남기기") + '</div>' +
            '</div>' +

            '<div style="text-align:center; font-size:11px; font-weight:600; color:var(--text-sub); margin-top:13px; line-height:1.6;">' +
                '사진이 없어도 괜찮아요. 한 줄이면 그 날이 남습니다' +
            '</div>' +
        '</div>';

        document.body.appendChild(wrap);

        var ta = document.getElementById("note-input");
        if (ta) {
            ta.addEventListener("input", function () {
                var c = document.getElementById("note-count");
                if (c) c.textContent = ta.value.length + " / " + MAX_LEN;
            });
            setTimeout(function () { ta.focus(); }, 120);
        }
    };

    window.closeNoteSheet = function () {
        var el = document.getElementById("note-sheet");
        if (el) el.remove();
        editing = { key: null, id: null };
    };

    window.saveNote = function () {
        var ta = document.getElementById("note-input");
        if (!ta) return;
        var text = String(ta.value || "").trim();
        if (!text) return toast("한 줄만 적어주세요");

        if (editing.id) editNote(editing.key, editing.id, text);
        else putNote(editing.key, { id: uid8(), text: text, ts: Date.now(), who: myTitle() });

        window.syncNotesToFirebase();
        window.closeNoteSheet();
        repaint();
        toast("✍️ 배냇함에 남겼어요");
    };

    window.deleteNote = function () {
        var k = editing.key, id = editing.id;
        if (!id) return;
        var go = function () {
            dropNote(k, id);
            window.syncNotesToFirebase();
            window.closeNoteSheet();
            repaint();
        };
        if (typeof window.showConfirm === "function") {
            window.showConfirm("이 한 줄을 지울까요?\n되돌릴 수 없어요.", go, "✍️", "지우기", "#F04452");
        } else if (confirm("이 한 줄을 지울까요?")) go();
    };

    /* ---------- 배냇함에 그리기 ---------- */

    window.renderNoteRow = function (key) {
        var list = window.getDayNotes(key);
        if (!list.length) return "";

        return list.map(function (n) {
            return '<div onclick="event.stopPropagation(); window.openNoteSheet(\'' + key + '\',\'' + esc(n.id) + '\')" ' +
                'style="background:var(--bg-sub); border-radius:16px; padding:15px 17px; margin-top:14px; cursor:pointer;">' +
                '<div style="font-size:10px; font-weight:800; color:var(--text-sub); letter-spacing:1.8px; margin-bottom:8px;">' +
                    esc(n.who || myTitle()) + '의 한 줄</div>' +
                '<div style="font-family:\'Nanum Pen Script\',cursive; font-size:22px; line-height:1.55; color:var(--text-m); word-break:keep-all; white-space:pre-wrap;">' +
                    esc(n.text) + '</div>' +
            '</div>';
        }).join("");
    };

    window.renderNoteAdd = function (key) {
        var n = window.getDayNotes(key).length;
        return '<div onclick="event.stopPropagation(); window.openNoteSheet(\'' + key + '\')" ' +
            'style="margin-top:10px; font-size:12px; font-weight:700; color:var(--text-sub); cursor:pointer;">' +
            (n ? "한 줄 더 남기기" : "이 날 한 줄 남기기") + ' +</div>';
    };

    window.renderNoteBar = function () {
        var key = todayKey();
        var n = window.getDayNotes(key).length;
        return '<div onclick="window.openNoteSheet(\'' + key + '\')" style="display:flex; justify-content:space-between; align-items:center; padding:17px 18px; border:1px dashed var(--border); border-radius:18px; margin-bottom:14px; cursor:pointer;">' +
            '<span style="font-size:13.5px; font-weight:800; color:var(--text-m);">✍️ ' + (n ? "오늘 한 줄 더 남기기" : "오늘 한 줄 남기기") + '</span>' +
            '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">' +
                (n ? n + "줄 남겼어요" : "사진이 없어도 괜찮아요") + '</span>' +
        '</div>';
    };

    /* ---------- 시작 ---------- */

    function boot() { window.startNoteRealtimeSync(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.noteDebug = function () {
        console.log("한 줄 남긴 날:", window.noteDays().length + "일");
        console.log("총 줄 수:", window.noteCount());
        return loadIndex();
    };
})();