/* ============================================================
   배냇함 — 묘비 (graveyard.js)

   지운 것은 지워진 채로 있어야 한다.

   지금까지의 동기화는 합집합이었다.
   내 폰에서 사진을 빼내도, 짝꿍 폰에는 아직 남아 있으니
   다음 동기화 때 그대로 되살아났다.

   그래서 "지웠다"는 사실도 같이 동기화한다.
   지운 id에 묘비를 세우고, 그 묘비를 서버에 함께 올린다.
   병합할 때 묘비가 있는 id는 되살리지 않는다.

   묘비는 90일 뒤에 치운다. 그쯤이면 모든 기기가 이미 알고 있다.

   index.html 에서 script.js 바로 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var TTL = 90 * 86400000;   // 묘비 유효기간 90일

    function suffix() { return window.currentBabySuffix || ""; }

    function key(kind) { return "tosil_grave_" + kind + suffix(); }

    function load(kind) {
        try {
            var v = JSON.parse(localStorage.getItem(key(kind)));
            return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
        } catch (e) { return {}; }
    }

    function save(kind, obj) {
        try { localStorage.setItem(key(kind), JSON.stringify(obj)); } catch (e) {}
    }

    // 오래된 묘비 정리
    function prune(obj) {
        var now = Date.now(), out = {};
        Object.keys(obj).forEach(function (id) {
            if (now - (Number(obj[id]) || 0) < TTL) out[id] = obj[id];
        });
        return out;
    }

    window.Grave = {

        // 지울 때 부른다
        add: function (kind, id) {
            if (!id) return;
            var o = prune(load(kind));
            o[String(id)] = Date.now();
            save(kind, o);
        },

        // 병합할 때 "이거 지워진 건가?" 물어본다
        has: function (kind, id) {
            if (!id) return false;
            return !!load(kind)[String(id)];
        },

        // 서버에 같이 올릴 묘비 목록
        list: function (kind) {
            var o = prune(load(kind));
            save(kind, o);
            return o;
        },

        // 서버에서 받은 묘비를 내 것과 합친다 (짝꿍이 지운 것)
        merge: function (kind, remote) {
            if (!remote || typeof remote !== "object") return;
            var o = load(kind), changed = false;
            Object.keys(remote).forEach(function (id) {
                if (!o[id]) { o[id] = Number(remote[id]) || Date.now(); changed = true; }
            });
            if (changed) save(kind, prune(o));
        },

        // 되돌리기가 필요할 때 (실수로 지웠을 때 대비)
        forgive: function (kind, id) {
            var o = load(kind);
            delete o[String(id)];
            save(kind, o);
        },

        /* ---------- 점검용 ---------- */
        debug: function () {
                       ["photo", "voice", "seal", "note", "word"].forEach(function (k) {
                var o = load(k);
                console.log("[묘비] " + k + ": " + Object.keys(o).length + "개");
            });
        }
    };
})();