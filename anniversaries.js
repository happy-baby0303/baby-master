/* ============================================================
   배냇함 — 기념일 (anniversaries.js)

   부모가 아무것도 안 해도 연대기에 놓이는 날들.
   백일, 첫 명절, 첫 계절. 아이가 지나온 자리를 표시해 둔다.

   index.html 에서 photos.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var DAY = 86400000;

    /* ---------- 음력 명절의 양력 날짜 ----------
       한국천문연구원 월력요항 기준. 2032년까지 넣어뒀다.
       그 뒤는 아래 표에 한 줄씩 이어 붙이면 된다. -------- */

    var SEOLLAL = {
        2024: "02-10", 2025: "01-29", 2026: "02-17", 2027: "02-07",
        2028: "01-27", 2029: "02-13", 2030: "02-03", 2031: "01-23",
        2032: "02-11"
    };

    var CHUSEOK = {
        2024: "09-17", 2025: "10-06", 2026: "09-25", 2027: "09-15",
        2028: "10-03", 2029: "09-22", 2030: "09-12", 2031: "10-01",
        2032: "09-19"
    };

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() {
        return localStorage.getItem("tosil_babyName") || "우리 아기";
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    function keyOf(d) {
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function fromKey(key) {
        var p = String(key).split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function birthDate() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var d = fromKey(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function plusDays(d, n) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    }

    // 1월 31일생의 다음 달은 2월 28일. 넘치면 그 달 마지막 날로 당긴다.
    function plusMonths(d, n) {
        var y = d.getFullYear(), m = d.getMonth() + n, day = d.getDate();
        var last = new Date(y, m + 1, 0).getDate();
        return new Date(y, m, Math.min(day, last));
    }

    function todayStart() {
        var d = new Date(); d.setHours(0, 0, 0, 0);
        return d;
    }

    /* ---------- 기념일 만들기 ----------
       tier 1 은 카드로, tier 2 는 작은 칩으로 놓인다. -------- */

    var cache = null, cacheStamp = "";

    function build() {
        var b = birthDate();
        if (!b) return {};

        var stamp = keyOf(b) + "|" + keyOf(todayStart());
        if (cache && cacheStamp === stamp) return cache;

        var out = {};
        var put = function (d, label, sub, tier) {
            if (!d || isNaN(d.getTime())) return;
            if (d.getTime() <= b.getTime()) return;          // 태어난 날 자체는 이미 카드가 있다
            var k = keyOf(d);
            if (!out[k]) out[k] = [];
            for (var i = 0; i < out[k].length; i++) if (out[k][i].label === label) return;
            out[k].push({ label: label, sub: sub || "", tier: tier || 2 });
        };

        // 1) 일수
        put(plusDays(b, 50),   "오십일", "쉰 밤을 함께 지났어요", 2);
        put(plusDays(b, 100),  "백일",   "백 밤을 지나 여기까지 왔어요", 1);
        put(plusDays(b, 200),  "이백일", "", 2);
        put(plusDays(b, 300),  "삼백일", "", 2);
        put(plusDays(b, 500),  "오백일", "오백 밤이 쌓였어요", 1);
        put(plusDays(b, 1000), "천일",   "천 밤을 함께 건넜어요", 1);

        // 2) 개월 (두 돌까지). 생일이랑 겹치는 달은 생일이 이긴다.
        for (var m = 1; m <= 23; m++) {
            if (m % 12 === 0) continue;
            put(plusMonths(b, m), "생후 " + m + "개월", "", 2);
        }

        // 3) 생일
        for (var y = 1; y <= 10; y++) {
            var bd = plusMonths(b, y * 12);
            put(bd, y === 1 ? "첫 번째 생일" : y + "번째 생일",
                   y === 1 ? babyName() + "가 한 살이 되었어요" : "", 1);
        }

        // 4) 첫 명절 — 태어난 뒤 처음 오는 한 번만
        firstOf(b, SEOLLAL,  "첫 설날",  "처음 맞는 설이에요", put);
        firstOf(b, CHUSEOK,  "첫 추석",  "처음 맞는 한가위예요", put);
        firstFixed(b, 12, 25, "첫 크리스마스", "", put);
        firstFixed(b,  5,  5, "첫 어린이날", "", put);

        // 5) 첫 계절 — 태어난 뒤 처음 시작되는 계절
        firstFixed(b, 3, 1,  "첫 봄",   "", put);
        firstFixed(b, 6, 1,  "첫 여름", "", put);
        firstFixed(b, 9, 1,  "첫 가을", "", put);
        firstFixed(b, 12, 1, "첫 겨울", "", put);

        cache = out; cacheStamp = stamp;
        return out;
    }

    // 표에서 태어난 뒤 첫 번째로 오는 날짜를 찾는다
    function firstOf(b, table, label, sub, put) {
        var years = Object.keys(table).map(Number).sort(function (a, c) { return a - c; });
        for (var i = 0; i < years.length; i++) {
            var d = fromKey(years[i] + "-" + table[years[i]]);
            if (d.getTime() > b.getTime()) { put(d, label, sub, 1); return; }
        }
    }

    // 매년 같은 양력 날짜(크리스마스, 어린이날, 계절 시작)
    function firstFixed(b, month, day, label, sub, put) {
        var d = new Date(b.getFullYear(), month - 1, day);
        if (d.getTime() <= b.getTime()) d = new Date(b.getFullYear() + 1, month - 1, day);
        put(d, label, sub, label.indexOf("첫 ") === 0 && (month === 12 && day === 25 || month === 5 && day === 5) ? 1 : 2);
    }

    /* ---------- 바깥에서 쓰는 문 ---------- */

    window.anniversariesOn = function (key) {
        return build()[key] || [];
    };

    // 오늘까지 지나온 것만. 연대기는 과거를 담는 곳이다.
    window.anniversaryDays = function () {
        var all = build();
        var t = todayStart().getTime();
        return Object.keys(all).filter(function (k) { return fromKey(k).getTime() <= t; });
    };

    // 아직 오지 않은 것 중 가장 가까운 하나
    window.nextAnniversary = function () {
        var all = build();
        var t = todayStart().getTime();
        var best = null;
        Object.keys(all).forEach(function (k) {
            var ts = fromKey(k).getTime();
            if (ts <= t) return;
            if (!best || ts < best.ts) {
                var top = all[k].slice().sort(function (a, b) { return a.tier - b.tier; })[0];
                best = { key: k, ts: ts, label: top.label, days: Math.round((ts - t) / DAY) };
            }
        });
        return best;
    };

    /* ---------- 그리기 ---------- */

    var GOLD = "#B98A2E";
    var GOLD_BG = "rgba(185,138,46,0.10)";

    // 날짜 카드 맨 위에 놓인다
    window.renderAnniversary = function (key) {
        var list = window.anniversariesOn(key);
        if (!list.length) return "";

        var big = list.filter(function (a) { return a.tier === 1; });
        var small = list.filter(function (a) { return a.tier !== 1; });
        var html = "";

        big.forEach(function (a) {
            html +=
            '<div style="background:' + GOLD_BG + '; border:1px solid rgba(185,138,46,0.22); border-radius:16px; padding:18px 18px 17px; margin-bottom:16px; text-align:center;">' +
                '<div style="font-size:10px; font-weight:800; color:' + GOLD + '; letter-spacing:2.5px; margin-bottom:9px;">기념일</div>' +
                '<div class="serif-display" style="font-size:21px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">' + esc(a.label) + '</div>' +
                (a.sub ? '<div style="font-size:12.5px; font-weight:600; color:var(--text-sub); margin-top:7px; word-break:keep-all;">' + esc(a.sub) + '</div>' : '') +
            '</div>';
        });

        if (small.length) {
            html += '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:15px;">' +
                small.map(function (a) {
                    return '<span style="font-size:10.5px; font-weight:800; color:' + GOLD + '; background:' + GOLD_BG + '; padding:4px 10px; border-radius:9px; letter-spacing:0.3px;">' + esc(a.label) + '</span>';
                }).join("") +
            '</div>';
        }

        return html;
    };

    // 배냇함 머리에 놓이는 한 줄
    window.renderNextAnniversary = function () {
        var n = window.nextAnniversary();
        if (!n || n.days > 120) return "";
        var when = n.days === 1 ? "내일이에요" : n.days + "일 남았어요";
        return '<div style="display:flex; justify-content:space-between; align-items:center; padding:14px 17px; background:' + GOLD_BG + '; border-radius:15px; margin-bottom:14px;">' +
            '<span style="font-size:12.5px; font-weight:800; color:' + GOLD + ';">다가오는 날  ·  ' + esc(n.label) + '</span>' +
            '<span style="font-size:11.5px; font-weight:700; color:' + GOLD + '; opacity:0.75;">' + esc(when) + '</span>' +
        '</div>';
    };

    /* ---------- 점검용 ---------- */
    window.anniversaryDebug = function () {
        var all = build();
        var t = todayStart().getTime();
        var past = [], future = [];
        Object.keys(all).sort().forEach(function (k) {
            var line = k + "  " + all[k].map(function (a) { return a.label; }).join(", ");
            (fromKey(k).getTime() <= t ? past : future).push(line);
        });
        console.log("지나온 기념일 " + past.length + "일");
        past.forEach(function (l) { console.log("  " + l); });
        console.log("앞으로 올 기념일 (가까운 5개)");
        future.slice(0, 5).forEach(function (l) { console.log("  " + l); });
        return all;
    };
})();