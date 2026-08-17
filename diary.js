/* ============================================================
   육아메이트 — 우리의 문답 (diary.js)

   diary.html 에 부부가 100일 동안 쓴 글이 있다.
   그런데 그게 day_1_data … day_100_data 로 흩어져 있을 뿐,
   배냇함에도 포토북에도 안 올라간다.

   "사춘기 온 아이가 몰래 이 일기장을 읽는다면" 이라고 물어놓고,
   정작 읽을 자리를 안 만들어 뒀다.

   둘 다 답한 문답만 연대기에 올린다. 한쪽만 쓴 건 아직 대화가 아니다.

   index.html 에서 data.js 다음, notes.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var MAX_DAY = 200;      // day_N 을 이만큼까지 훑는다
    var DAY = 86400000;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function keyOf(ts) {
        var d = new Date(ts);
        if (isNaN(d.getTime())) return null;
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    // questionDB 는 const 라 window 에 안 붙는다. MILESTONE_DATA 와 같은 방식.
    function questions() {
        var q = null;
        try { if (typeof questionDB !== "undefined" && questionDB) q = questionDB; } catch (e) {}
        return q || window.questionDB || [];
    }

    function questionOf(day) {
        var list = questions();
        if (!list.length) return null;
        var it = list[(day - 1) % list.length];
        if (!it) return null;
        return {
            text: String(it.question || "").replace(/{babyName}/g, babyName()),
            context: it.context || "",
            category: it.category || ""
        };
    }

    /* ---------- 읽기 ----------
       diary.html 이 이미 date 를 남기고 있어서 그대로 쓴다. -------- */

    var cache = null;

    function scan() {
        if (cache) return cache;
        var out = [];
        for (var day = 1; day <= MAX_DAY; day++) {
            var raw = localStorage.getItem("day_" + day + "_data");
            if (!raw) continue;
            var d;
            try { d = JSON.parse(raw); } catch (e) { continue; }
            if (!d || !d.husbandAns || !d.wifeAns) continue;   // 둘 다 써야 대화다

            var ts = d.date ? Date.parse(d.date) : NaN;
            var key = isNaN(ts) ? null : keyOf(ts);
            if (!key) continue;

            var q = questionOf(day);
            out.push({
                day: day, key: key, ts: ts,
                q: q ? q.text : "",
                context: q ? q.context : "",
                husband: d.husbandAns, wife: d.wifeAns
            });
        }
        out.sort(function (a, b) { return a.ts - b.ts; });
        cache = out;
        return out;
    }

    window.diaryEntries = function () { cache = null; return scan(); };
    window.diaryCount = function () { return scan().length; };

    window.diaryDays = function () {
        var seen = {};
        scan().forEach(function (e) { seen[e.key] = 1; });
        return Object.keys(seen);
    };

    window.diaryOn = function (key) {
        return scan().filter(function (e) { return e.key === key; });
    };

    /* ---------- 배냇함에 그리기 ---------- */

    function side(who, text, tone) {
        return '<div style="margin-top:10px;">' +
            '<div style="font-size:10px; font-weight:800; color:' + tone + '; letter-spacing:1.5px; margin-bottom:5px;">' + esc(who) + '</div>' +
            '<div style="font-size:13px; font-weight:500; color:var(--text-s); line-height:1.7; word-break:keep-all; white-space:pre-wrap;">' + esc(text) + '</div>' +
        '</div>';
    }

    window.renderDiaryRow = function (key) {
        var list = window.diaryOn(key);
        if (!list.length) return "";

        return list.map(function (e) {
            return '<div style="background:var(--bg-sub); border-radius:16px; padding:16px 17px; margin-top:14px;">' +
                '<div style="font-size:10px; font-weight:800; color:#7F77DD; letter-spacing:1.8px; margin-bottom:9px;">' +
                    '우리의 문답 ' + e.day + '일차' + (e.context ? '  ·  ' + esc(e.context) : '') + '</div>' +
                '<div class="serif-display" style="font-size:14.5px; font-weight:700; color:var(--text-title); line-height:1.6; word-break:keep-all;">' +
                    esc(e.q) + '</div>' +
                '<div style="height:1px; background:var(--border); margin:13px 0 3px;"></div>' +
                side("아빠", e.husband, "#7F77DD") +
                side("엄마", e.wife, "#B98A2E") +
            '</div>';
        }).join("");
    };

    /* ---------- 문답함 ---------- */

    window.openDiaryBox = function () {
        var list = scan().slice().reverse();

        var old = document.getElementById("diary-box");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "diary-box";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");

        var body = list.length
            ? list.map(function (e) {
                var d = new Date(e.ts);
                return '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:19px 18px; margin-bottom:11px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:11px;">' +
                        '<span style="font-size:10.5px; font-weight:800; color:#7F77DD; letter-spacing:1.8px;">' + e.day + '일차' + (e.context ? '  ·  ' + esc(e.context) : '') + '</span>' +
                        '<span style="font-size:11px; font-weight:700; color:var(--text-sub);">' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일</span>' +
                    '</div>' +
                    '<div class="serif-display" style="font-size:15px; font-weight:700; color:var(--text-title); line-height:1.6; word-break:keep-all;">' + esc(e.q) + '</div>' +
                    '<div style="height:1px; background:var(--border); margin:14px 0 4px;"></div>' +
                    side("아빠", e.husband, "#7F77DD") +
                    side("엄마", e.wife, "#B98A2E") +
                '</div>';
              }).join("")
            : '<div style="text-align:center; padding:80px 24px; font-family:\'Nanum Pen Script\',cursive; font-size:26px; color:var(--text-sub); line-height:1.6;">' +
                  '아직 둘 다 답한 문답이 없어요<br>한 사람만 쓴 건 아직 대화가 아니니까요' +
              '</div>';

        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 20px 60px;">' +
            '<div style="position:sticky; top:0; background:var(--bg-main); padding:22px 0 16px; z-index:2;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                    '<div>' +
                        '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">우리의 문답</div>' +
                        '<div style="font-size:13px; font-weight:600; color:var(--text-sub); margin-top:6px;">' +
                            (list.length ? esc(list.length + "개의 대화가 오갔어요") : "첫 대화를 기다리는 중") + '</div>' +
                    '</div>' +
                    '<div onclick="window.closeDiaryBox()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; padding:2px 8px; line-height:1;">×</div>' +
                '</div>' +
            '</div>' +
            body +
            (list.length ? '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:32px; line-height:1.7;">' +
                esc(babyName()) + '가 크면 이 대화를 읽게 됩니다<br>그때 우리가 어떤 사이였는지 알게 될 거예요</div>' : "") +
        '</div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";
    };

    window.closeDiaryBox = function () {
        var el = document.getElementById("diary-box");
        if (el) el.remove();
        document.body.style.overflow = "";
    };

    /* ---------- 점검용 ---------- */
    window.diaryDebug = function () {
        var l = window.diaryEntries();
        console.log("둘 다 답한 문답:", l.length + "개");
        console.log("질문 데이터:", questions().length ? questions().length + "문항 로드됨" : "없음 (data.js 를 index.html 에 추가하세요)");
        if (l.length) console.log("가장 최근:", l[l.length - 1].day + "일차 · " + l[l.length - 1].key);
        return l;
    };
})();