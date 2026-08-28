/* ============================================================
   배냇함 — 지금 필요한 글 (infopick.js)  v2

   육아정보 탭에 좋은 글이 열한 개 있다.
   그런데 그 글에 닿으려면 네 번을 눌러야 했고,
   그 앞에는 쇼핑 여덟 칸이 있었다.
   "육아 백과사전" 이라고 써놓고 백과사전이 제일 아래, 뚜껑 안에 있었다.

   ─────────────────────────────────────────
   대형 육아앱은 주차별 콘텐츠로 이걸 한다. 에디터가 매주 쓴다.
   글 개수로는 못 이긴다.

   이길 수 있는 건 하나다.
   걔넨 그 아기가 지난주에 몇 도까지 올랐는지 모른다.
   배냇함은 안다.
   ─────────────────────────────────────────

   v2 에서 하는 일 여섯 가지

     1. 개월수와 기록에 맞는 글 세 개를 맨 위에 꺼낸다
     2. 라이브러리를 SOS 바로 밑으로 올린다 (쇼핑은 그 아래로)
     3. 면책 안내를 뚜껑 밖 맨 아래로 내려 항상 보이게 한다
     4. 열날 때 글 맨 위에 '이 아기 기준' 한 칸을 넣는다   ⭐ 새로
     5. 다음 예방접종까지 며칠 남았는지 띄운다              ⭐ 새로
     6. 이번 달 밤중 수유가 몇 번인지 보여준다              ⭐ 새로

   ⚠️ 4번은 의료 정보다. 새로 지어내지 않았다.
      이미 글 안에 있는 기준(3개월 미만 38도)과 같은 선을 쓰고,
      애매하면 무조건 병원·119 상담으로 보낸다.

   ⚠️ 5번은 표준 일정의 '달' 만 쓴다. 백신 이름을 새로 적지 않는다.
      data.js 의 vaccineData 가 있으면 그쪽 설명을 그대로 가져온다.

   index.html 은 한 줄도 안 고친다.
   글은 제목에 든 낱말로 찾는다. 순서를 바꾸셔도 따라간다.

   index.html 에서 script.js 다음이면 어디든 됩니다.
   emergency119.js 와 같이 쓰면 4번에서 119 카드로 연결됩니다.
   ============================================================ */
(function () {
    'use strict';

    var CARD_ID = "info-pick";
    var VAC_ID  = "info-vaccine";
    var MON_ID  = "info-month";
    var GUIDE   = "info-fever-guide";

    var GOLD    = "#B98A2E";
    var PURPLE  = "#7F77DD";
    var RED     = "#D32F2F";
    var GREEN   = "#2E8B6B";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    /* ---------- 이 아기가 지금 어떤 상태인가 ---------- */

    function birthTime() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var t = new Date(s + "T00:00:00").getTime();
        return isNaN(t) ? null : t;
    }

    function monthsOld() {
        var b = birthTime();
        if (b === null) return null;
        var m = Math.floor((Date.now() - b) / 86400000 / 30.436875);
        return m < 0 ? null : m;
    }

    function context() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_fever_records")) || []; } catch (e) {}
        var now = Date.now(), maxTemp = 0, lastAt = 0, hot = 0, lastTemp = 0, lastTempAt = 0;

        recs.forEach(function (r) {
            if (!r || !Number(r.timestamp)) return;
            var t = Number(r.timestamp), temp = Number(r.temp);
            if (temp && t > lastTempAt) { lastTemp = temp; lastTempAt = t; }
            if (t < now - 7 * 86400000 || temp < 37.8) return;
            hot++;
            if (temp > maxTemp) maxTemp = temp;
            if (t > lastAt) lastAt = t;
        });

        var opens = [];
        try { opens = JSON.parse(localStorage.getItem("tosil_open_records")) || []; } catch (e) {}

        return {
            months:     monthsOld(),
            hot:        hot,
            maxTemp:    maxTemp,
            feverAgo:   lastAt ? Math.floor((now - lastAt) / 86400000) : null,
            lastTemp:   lastTemp,
            lastTempAt: lastTempAt,
            opens:      opens.length,
            stage:      localStorage.getItem("tosil_feedingStage") || "모유/분유"
        };
    }

    function agoDays(d) {
        if (d === null) return "";
        if (d <= 0) return "오늘";
        if (d === 1) return "어제";
        return d + "일 전";
    }

    function agoShort(ms) {
        var m = Math.floor((Date.now() - ms) / 60000);
        if (m < 60) return m + "분 전";
        var h = Math.floor(m / 60);
        if (h < 24) return h + "시간 전";
        return Math.floor(h / 24) + "일 전";
    }

    /* ==========================================================
       1. 어떤 글이 언제 필요한가
       ---------------------------------------------------------- */

    var RULES = [
        { find: "열날 때", ranges: [[0, 99]], whys: [""], base: 4,
          boost: function (c) {
              if (!c.hot) return null;
              return { s: 120, why: agoDays(c.feverAgo) + " " + c.maxTemp.toFixed(1) + "도가 있어서" };
          } },

        { find: "울음",    ranges: [[0, 4]],  whys: ["울음이 제일 잦은 때라"], base: 60 },
        { find: "분수토",  ranges: [[0, 6]],  whys: ["게워냄이 잦은 때라"],   base: 55 },

        { find: "보리차", ranges: [[4, 9]], whys: ["이유식 시작 무렵이라"], base: 50,
          boost: function (c) {
              return c.stage.indexOf("이유식") > -1 ? { s: 25, why: c.stage + " 중이라" } : null;
          } },

        { find: "통잠",    ranges: [[2, 9]],           whys: ["밤잠이 길어지는 때라"], base: 58 },
        { find: "쪽쪽이",  ranges: [[0, 3], [17, 26]], whys: ["쪽쪽이 물릴 때라", "끊을 때가 다가와서"], base: 45 },
        { find: "똥 색깔", ranges: [[0, 5]],           whys: ["변이 자주 바뀌는 때라"], base: 48 },

        { find: "개봉 후", ranges: [[0, 99]], whys: [""], base: 3,
          boost: function (c) {
              if (!c.opens) return null;
              return { s: 40, why: "언제깠지에 " + c.opens + "개가 담겨 있어서" };
          } },

        { find: "떨어졌어요", ranges: [[4, 15]],  whys: ["뒤집고 기어다닐 때라"],   base: 62 },
        { find: "화상",       ranges: [[8, 26]],  whys: ["잡고 서기 시작할 때라"], base: 52 },

        { find: "두드러기", ranges: [[5, 10]], whys: ["새 재료를 늘릴 때라"], base: 50,
          boost: function (c) {
              return c.stage.indexOf("이유식") > -1 ? { s: 35, why: c.stage + " 중이라" } : null;
          } }
    ];

    // 몇 번째 구간에 들었는지까지 알려준다 (쪽쪽이는 구간마다 이유가 다르다)
    function rangeHit(m, ranges) {
        if (m === null) return -1;
        for (var i = 0; i < ranges.length; i++) {
            if (m >= ranges[i][0] && m <= ranges[i][1]) return i;
        }
        return -1;
    }

    function inRange(m, ranges) {
        if (m === null) return false;
        for (var i = 0; i < ranges.length; i++) {
            if (m >= ranges[i][0] && m <= ranges[i][1]) return true;
        }
        return false;
    }

    function articles() {
        var tab = document.getElementById("tab-info");
        if (!tab) return [];
        var out = [], items = tab.querySelectorAll("details.lib-item");

        for (var i = 0; i < items.length; i++) {
            var sum = items[i].querySelector("summary");
            if (!sum) continue;
            var head = sum.firstElementChild;
            var title = ((head ? head.textContent : sum.textContent) || "").trim();
            if (title) out.push({ el: items[i], title: title });
        }
        return out;
    }

    function findArticle(word) {
        var all = articles();
        for (var i = 0; i < all.length; i++) if (all[i].title.indexOf(word) > -1) return all[i].el;
        return null;
    }

    function pick(n) {
        var c = context(), scored = [];

        articles().forEach(function (a, idx) {
            for (var i = 0; i < RULES.length; i++) {
                var r = RULES[i];
                if (a.title.indexOf(r.find) === -1) continue;

                var s = 0, why = "";

                var hit = rangeHit(c.months, r.ranges);
                if (hit > -1) {
                    s += r.base;
                    why = (r.whys && r.whys[hit]) ? r.whys[hit]
                        : ((c.months === 0) ? "갓 태어나서" : "생후 " + c.months + "개월이라");
                }
                if (r.boost) {
                    var b = r.boost(c);
                    if (b) { s += b.s; why = b.why; }
                }

                // 예비 글(열·개봉기한)이 이유 없이 뽑힌 거면 딱지를 안 단다.
                // "생후 20개월이라 열날 때" 는 이유가 아니다.
                if (s < 10) why = "";

                if (s > 0) scored.push({ el: a.el, title: a.title, score: s, why: why, idx: idx });
                break;
            }
        });

        scored.sort(function (x, y) {
            return (y.score !== x.score) ? y.score - x.score : x.idx - y.idx;
        });
        return { list: scored.slice(0, n || 3), ctx: c };
    }

    /* ==========================================================
       2. 글 열기
       ---------------------------------------------------------- */

    var opened = [];

    function showLibrary(on) {
        var tab = document.getElementById("tab-info");
        var shell = tab && tab.firstElementChild;
        var lib = tab && tab.querySelector(".library-container");
        var block = (shell && lib) ? childOf(shell, lib) : null;
        if (block) block.style.display = on ? "" : "none";

        var btn = document.getElementById("info-all-btn");
        if (btn) btn.textContent = on ? "글 접기 〈" : ("글 전체 보기 " + articles().length + "개 〉");
        return block;
    }

    function openEl(el) {
        if (!el) return;
        showLibrary(true);
        var wrap = el.closest ? el.closest("details.main-lib-wrapper") : null;
        if (wrap) wrap.open = true;

        var tab = document.getElementById("tab-info");
        if (tab) {
            var all = tab.querySelectorAll("details.lib-item");
            for (var k = 0; k < all.length; k++) if (all[k] !== el) all[k].open = false;
        }
        el.open = true;
        setTimeout(function () {
            try { el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
        }, 120);
    }

    // 글 내용만 떼어온다 (제목 줄 빼고). 원본은 건드리지 않고 베낀다.
    function bodyHTML(el) {
        if (!el) return "";
        var out = "";
        for (var i = 0; i < el.children.length; i++) {
            if (el.children[i].tagName === "SUMMARY") continue;
            out += el.children[i].outerHTML;
        }
        return out.replace(/\sid=("[^"]*"|'[^']*')/g, "");   // id 가 두 벌이 되지 않게
    }

    window.openInfoArticle = function (i) {
        var a = opened[i];
        if (!a) return;

        var box = document.getElementById("pick-body-" + i);
        var arrow = document.getElementById("pick-arrow-" + i);
        if (!box) return;

        var opening = (box.style.display === "none" || !box.style.display);

        // 한 번에 하나만 열어둔다. 셋 다 펼치면 그게 전체 목록이다.
        for (var k = 0; k < opened.length; k++) {
            var b = document.getElementById("pick-body-" + k);
            var r = document.getElementById("pick-arrow-" + k);
            if (b) b.style.display = "none";
            if (r) r.textContent = "〉";
        }

        if (!opening) return;

        if (!box.getAttribute("data-filled")) {
            box.innerHTML = bodyHTML(a.el);
            box.setAttribute("data-filled", "1");
        }
        box.style.display = "block";
        if (arrow) arrow.textContent = "︿";
    };

    window.openInfoWord = function (word) { openEl(findArticle(word)); };

    window.toggleInfoLibrary = function () {
        var tab = document.getElementById("tab-info");
        var shell = tab && tab.firstElementChild;
        var lib = tab && tab.querySelector(".library-container");
        var block = (shell && lib) ? childOf(shell, lib) : null;
        if (!block) return;

        var opening = (block.style.display === "none");
        showLibrary(opening);

        if (opening) {
            setTimeout(function () {
                try { block.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
            }, 120);
        }
    };
    window.openInfoLibrary = function () { showLibrary(true); };

    /* ==========================================================
       3. 열날 때 글 안에 '이 아기 기준' 넣기   ⭐
       ----------------------------------------------------------
       글에 이미 "3개월 미만 38도" 가 적혀 있다. 그 선을 그대로 쓴다.
       달라지는 건 하나뿐이다 — 부모가 새벽에 개월수를 계산하지 않아도 된다.
       ---------------------------------------------------------- */

    function feverLine(m) {
        if (m === null) return null;
        if (m < 3) {
            return { color: RED,
                     head: "생후 " + m + "개월이에요",
                     body: "3개월 미만은 38.0도만 넘어도 해열제보다 진료가 먼저입니다. 밤이어도 병원에 가세요." };
        }
        if (m < 6) {
            return { color: RED,
                     head: "생후 " + m + "개월이에요",
                     body: "38.5도가 넘으면 소아과에 가고, 39도가 넘거나 축 처지면 응급실입니다." };
        }
        return { color: GOLD,
                 head: "생후 " + m + "개월이에요",
                 body: "39도가 넘거나, 열보다 아이 상태가 나빠 보이면(축 처짐 · 경련 · 소변이 줄어듦) 응급실입니다." };
    }

    function injectFeverGuide() {
        var el = findArticle("열날 때");
        if (!el || el.querySelector("#" + GUIDE)) return;

        var c = context();
        var g = feverLine(c.months);
        if (!g) return;

        var now = "";
        if (c.lastTemp && c.lastTempAt > Date.now() - 24 * 3600000) {
            now = '<div style="font-size:13px; font-weight:900; color:' +
                  (c.lastTemp >= 38 ? RED : "var(--text-m)") + '; margin-bottom:7px;">' +
                  '지금 ' + c.lastTemp.toFixed(1) + '도 · ' + agoShort(c.lastTempAt) + ' 기록</div>';
        }

        var btn119 = (typeof window.open119Card === "function")
            ? '<div onclick="event.stopPropagation(); window.open119Card()" ' +
              'style="flex:1; text-align:center; padding:11px; background:' + RED + '; color:#FFF; ' +
              'border-radius:11px; font-size:12.5px; font-weight:800; cursor:pointer;">🚨 119에 읽어줄 카드</div>'
            : '';

        var card = document.createElement("div");
        card.id = GUIDE;
        card.style.cssText =
            "background:rgba(211,46,46,0.06); border:1px solid rgba(211,46,46,0.20); " +
            "border-radius:14px; padding:14px 15px; margin:0 0 14px;";
        card.innerHTML =
            '<div style="font-size:10.5px; font-weight:900; color:' + g.color + '; ' +
                'letter-spacing:1.4px; margin-bottom:6px;">' + esc(babyName()) + ' 기준</div>' +
            now +
            '<div style="font-size:13.5px; font-weight:900; color:var(--text-m); margin-bottom:5px;">' +
                esc(g.head) + '</div>' +
            '<div style="font-size:12.5px; font-weight:700; color:var(--text-sub); ' +
                'line-height:1.65; word-break:keep-all;">' + esc(g.body) + '</div>' +
            '<div style="display:flex; gap:7px; margin-top:11px;">' +
                btn119 +
                '<a href="tel:119" onclick="event.stopPropagation();" ' +
                    'style="flex:1; text-align:center; text-decoration:none; padding:11px; ' +
                    'background:var(--bg-sub); color:var(--text-m); border-radius:11px; ' +
                    'font-size:12.5px; font-weight:800;">📞 119 의료상담</a>' +
            '</div>' +
            '<div style="font-size:11px; font-weight:600; color:var(--text-sub); ' +
                'line-height:1.6; margin-top:9px; word-break:keep-all;">' +
                '망설여지면 119에 전화해서 의사 상담을 먼저 받을 수 있어요. 무료고 24시간 합니다.</div>';

        var sum = el.querySelector("summary");
        if (sum && sum.nextSibling) el.insertBefore(card, sum.nextSibling);
        else el.appendChild(card);
    }

    /* ==========================================================
       4. 다음 예방접종   ⭐
       ---------------------------------------------------------- */

    var VAC_MONTHS = [0, 1, 2, 4, 6, 12, 15, 18, 24, 36, 48, 60];

    function addMonths(t, m) {
        var d = new Date(t);
        d.setMonth(d.getMonth() + m);
        return d.getTime();
    }

    function vacDesc(month) {
        try {
            var list = null;
            try { if (typeof vaccineData !== "undefined" && vaccineData) list = vaccineData; } catch (e) {}
            list = list || window.vaccineData;
            if (!list || !list.length) return "";
            for (var i = 0; i < list.length; i++) {
                if (Number(list[i].maxMonth) === month) return String(list[i].desc || list[i].title || "");
            }
            return "";
        } catch (e) { return ""; }
    }

    function nextVaccine() {
        var b = birthTime();
        if (b === null) return null;

        var now = Date.now();
        for (var i = 0; i < VAC_MONTHS.length; i++) {
            var m = VAC_MONTHS[i];
            var when = addMonths(b, m);
            var left = Math.ceil((when - now) / 86400000);
            if (left >= -14) return { month: m, when: when, left: left, desc: vacDesc(m) };
        }
        return null;
    }

    function vaccineHTML() {
        var v = nextVaccine();
        if (!v) return "";

        var head, color;
        if (v.left > 14)      { head = "D-" + v.left;  color = "var(--text-sub)"; }
        else if (v.left > 3)  { head = "D-" + v.left;  color = GOLD; }
        else if (v.left > 0)  { head = "D-" + v.left;  color = GREEN; }
        else if (v.left === 0){ head = "오늘";          color = GREEN; }
        else                  { head = Math.abs(v.left) + "일 지남"; color = RED; }

        var sub = (v.left < 0)
            ? "아직이면 병원에 예약하세요"
            : (v.desc || ("생후 " + v.month + "개월 접종 시기예요"));

        return '<div id="' + VAC_ID + '" onclick="window.goVaccineSchedule()" ' +
            'style="display:flex; align-items:center; gap:12px; cursor:pointer; ' +
            'background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:16px; padding:14px 16px; margin-bottom:12px;">' +

            '<div style="font-size:19px; flex-shrink:0;">💉</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:13.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">' +
                    '생후 ' + v.month + '개월 접종' +
                    '<span style="margin-left:8px; font-size:12px; font-weight:900; color:' + color + ';">' +
                        esc(head) + '</span>' +
                '</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:2px; ' +
                    'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(sub) + '</div>' +
            '</div>' +
            '<div style="font-size:12px; color:var(--text-sub); flex-shrink:0;">〉</div>' +
        '</div>';
    }

    window.goVaccineSchedule = function () {
        try {
            if (typeof window.switchTab === "function") {
                window.switchTab("toolbox", document.getElementById("nav-toolbox"));
            }
            setTimeout(function () {
                if (typeof window.switchTool === "function") window.switchTool("growth");
            }, 60);
        } catch (e) {}
    };

    /* ==========================================================
       5. 이번 달 밤중 수유   ⭐
       ----------------------------------------------------------
       기록한 것만 센다. 그렇게 화면에도 적는다.
       안 적은 수유까지 센 척하면 숫자가 거짓말이 된다.
       ---------------------------------------------------------- */

    function nightFeeds() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; } catch (e) {}
        if (!recs.length) return null;

        var now = new Date();
        var thisY = now.getFullYear(), thisM = now.getMonth();
        var prev = new Date(thisY, thisM - 1, 1);

        var a = 0, b = 0;
        recs.forEach(function (r) {
            if (!r || r.type !== "feed" || !Number(r.timestamp)) return;
            var d = new Date(Number(r.timestamp));
            var h = d.getHours();
            if (h >= 6 && h < 22) return;                       // 밤 10시 ~ 새벽 6시만
            if (d.getFullYear() === thisY && d.getMonth() === thisM) a++;
            else if (d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth()) b++;
        });

        if (a < 3) return null;                                 // 표본이 적으면 말하지 않는다
        return { now: a, prev: b, month: thisM + 1 };
    }

    function monthHTML() {
        var n = nightFeeds();
        if (!n) return "";

        var line, color;
        if (!n.prev)              { line = "다음 달과 견줘볼 수 있게 쌓이는 중이에요"; color = "var(--text-sub)"; }
        else if (n.now < n.prev)  { line = "지난달보다 " + (n.prev - n.now) + "번 줄었어요"; color = GREEN; }
        else if (n.now > n.prev)  { line = "지난달보다 " + (n.now - n.prev) + "번 늘었어요"; color = GOLD; }
        else                      { line = "지난달과 같아요"; color = "var(--text-sub)"; }

        return '<div id="' + MON_ID + '" onclick="window.openInfoWord(\'통잠\')" ' +
            'style="cursor:pointer; background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:16px; padding:14px 16px; margin-bottom:16px;">' +

            '<div style="display:flex; align-items:center; gap:12px;">' +
                '<div style="font-size:19px; flex-shrink:0;">🌙</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:13.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">' +
                        n.month + '월 밤중 수유 ' + n.now + '번</div>' +
                    '<div style="font-size:11.5px; font-weight:800; color:' + color + '; margin-top:2px;">' +
                        esc(line) + '</div>' +
                '</div>' +
                '<div style="font-size:12px; color:var(--text-sub); flex-shrink:0;">〉</div>' +
            '</div>' +

            '<div style="font-size:10.5px; font-weight:600; color:var(--text-sub); ' +
                'margin-top:9px; padding-top:9px; border-top:1px solid var(--border); line-height:1.55;">' +
                '밤 10시~새벽 6시에 <b>기록된</b> 수유만 셌어요. 안 적은 건 안 들어갑니다.</div>' +
        '</div>';
    }

    /* ==========================================================
       6. 맞춤 글 카드
       ---------------------------------------------------------- */

    function rowHTML(a, i) {
        var color = a.score >= 100 ? RED : PURPLE;
        var bg    = a.score >= 100 ? "rgba(211,46,46,0.10)" : "rgba(127,119,221,0.10)";

        return '<div>' +
            '<div onclick="window.openInfoArticle(' + i + ')" ' +
                'style="display:flex; align-items:center; gap:10px; padding:12px 2px; cursor:pointer;">' +
                '<span style="flex:1; min-width:0; font-size:13.5px; font-weight:800; color:var(--text-m); ' +
                    'letter-spacing:-0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    esc(a.title) + '</span>' +
                (a.why
                    ? '<span style="flex-shrink:0; font-size:10.5px; font-weight:800; color:' + color + '; ' +
                      'background:' + bg + '; padding:4px 9px; border-radius:8px; white-space:nowrap;">' +
                      esc(a.why) + '</span>'
                    : '') +
                '<span id="pick-arrow-' + i + '" style="font-size:11px; color:var(--text-sub); ' +
                    'flex-shrink:0; width:12px; text-align:center;">〉</span>' +
            '</div>' +
            '<div id="pick-body-' + i + '" style="display:none; padding:2px 2px 14px;"></div>' +
        '</div>';
    }

    function pickHTML(res) {
        var head = (res.ctx.months === null)
            ? "지금 챙기면 좋은 글"
            : res.ctx.months + "개월 " + babyName() + "에게 지금 필요한 것";

        var rows = res.list.map(rowHTML).join(
            '<div style="height:1px; background:var(--border); opacity:0.55;"></div>');

        return '<div id="' + CARD_ID + '" ' +
            'style="background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:18px; padding:15px 16px; margin-bottom:16px;">' +
            '<div style="font-size:11.5px; font-weight:900; color:' + GOLD + '; ' +
                'letter-spacing:0.3px; margin-bottom:5px; word-break:keep-all;">📚 ' + esc(head) + '</div>' +
            rows +
            '<div id="info-all-btn" onclick="window.toggleInfoLibrary()" ' +
                'style="text-align:center; margin-top:11px; padding-top:11px; ' +
                'border-top:1px solid var(--border); font-size:11.5px; font-weight:800; ' +
                'color:var(--text-sub); cursor:pointer;">글 전체 보기 ' + articles().length + '개 〉</div>' +
        '</div>';
    }

    /* ==========================================================
       7. 탭 순서 바꾸기
       ----------------------------------------------------------
       HTML 을 오려붙이지 않는다. 다 그려진 뒤에 자리만 옮긴다.
       오려붙이다 괄호 하나 어긋나면 탭이 통째로 날아간다.
       ---------------------------------------------------------- */

    function childOf(shell, node) {
        while (node && node.parentNode && node.parentNode !== shell) node = node.parentNode;
        return (node && node.parentNode === shell) ? node : null;
    }

    var moved = false;

    function relayout(tab) {
        if (moved) return;

        var shell = tab.firstElementChild;
        if (!shell) return;

        var lib = tab.querySelector(".library-container");
        var sosBtn = tab.querySelector('[onclick*="openSOSModal"]');
        if (!lib || !sosBtn) return;

        var sosBlock = childOf(shell, sosBtn);
        var libBlock = childOf(shell, lib);
        if (!sosBlock || !libBlock) return;

        shell.insertBefore(libBlock, sosBlock.nextSibling);

        // 라이브러리는 '글 전체 보기' 로만 연다.
        // 접힌 아코디언 헤더가 따로 또 있으면 문이 두 개가 된다.
        var wrap = libBlock.querySelector("details.main-lib-wrapper") ||
                   (libBlock.matches && libBlock.matches("details.main-lib-wrapper") ? libBlock : null);
        if (wrap) {
            var sum = wrap.querySelector("summary");
            if (sum) sum.style.display = "none";
            wrap.open = true;
        }
        libBlock.style.display = "none";

        // 면책은 라이브러리 뚜껑 밖으로. 펼쳐야 보이는 면책은 면책이 아니다.
        var divs = tab.querySelectorAll("div"), titleEl = null;
        for (var i = 0; i < divs.length && !titleEl; i++) {
            if (divs[i].children.length === 0 &&
                (divs[i].textContent || "").indexOf("의료 및 안전 면책 안내") > -1) titleEl = divs[i];
        }
        if (titleEl && titleEl.parentNode && titleEl.parentNode !== shell) {
            var box = titleEl.parentNode;
            box.style.marginTop = "22px";
            shell.appendChild(box);
        }

        moved = true;
    }

    /* ---------- 붙이기 ---------- */

    function place(shell, before, id, html) {
        var old = document.getElementById(id);
        if (!html) { if (old) old.remove(); return; }

        var box = document.createElement("div");
        box.innerHTML = html;
        var el = box.firstChild;

        if (old) { old.parentNode.replaceChild(el, old); return; }
        if (before) shell.insertBefore(el, before);
        else shell.appendChild(el);
    }

    function mount() {
        var tab = document.getElementById("tab-info");
        if (!tab || !tab.firstElementChild) return;

        relayout(tab);
        injectFeverGuide();

        var shell = tab.firstElementChild;
        var lib = tab.querySelector(".library-container");
        var libBlock = lib ? childOf(shell, lib) : null;

        // 라이브러리 바로 앞에 위에서부터 접종 → 맞춤 글 → 이번 달
        place(shell, libBlock, VAC_ID, vaccineHTML());

        var res = pick(3);
        opened = res.list;
        place(shell, libBlock, CARD_ID, res.list.length ? pickHTML(res) : "");

        place(shell, libBlock, MON_ID, monthHTML());
    }

    window.refreshInfoPick = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1600);
        setTimeout(mount, 3800);

        var orig = window.switchTab;
        if (typeof orig === "function" && !orig.__infopick) {
            var wrapped = function (id) {
                var out = orig.apply(this, arguments);
                if (id === "info") setTimeout(mount, 60);
                return out;
            };
            wrapped.__infopick = true;
            window.switchTab = wrapped;
        }

        // 체온을 재면 열 안내와 글 순서가 바로 바뀐다
        var f = window.addFeverRecord;
        if (typeof f === "function" && !f.__infopick) {
            var fw = function () {
                var out = f.apply(this, arguments);
                setTimeout(function () {
                    var g = document.getElementById(GUIDE);
                    if (g && g.parentNode) g.parentNode.removeChild(g);   // 다시 그리게 지운다
                    mount();
                }, 300);
                return out;
            };
            fw.__infopick = true;
            window.addFeverRecord = fw;
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.infoDebug = function () {
        var c = context();
        console.log("개월수:", c.months === null ? "생년월일 없음" : c.months + "개월");
        console.log("최근 7일 열:", c.hot ? c.hot + "회 · 최고 " + c.maxTemp.toFixed(1) + "도 · " + agoDays(c.feverAgo) : "없음");
        console.log("언제깠지:", c.opens + "개   ·   이유식:", c.stage);

        var v = nextVaccine();
        console.log("다음 접종:", v
            ? "생후 " + v.month + "개월 · " + (v.left >= 0 ? "D-" + v.left : Math.abs(v.left) + "일 지남") +
              (v.desc ? " · " + v.desc : "  (vaccineData 없음 — 달만 표시)")
            : "생년월일 없음");

        var n = nightFeeds();
        console.log("밤중 수유:", n ? (n.month + "월 " + n.now + "번 / 지난달 " + n.prev + "번") : "기록 3번 미만이라 안 띄움");

        var g = feverLine(c.months);
        console.log("열 기준 안내:", g ? g.body : "생년월일이 없어 안 띄움");

        console.log("찾은 글:", articles().length + "개");
        pick(99).list.forEach(function (a, i) {
            console.log("  " + (i < 3 ? "⭐" : "  ") + " " + a.score + "점  " + a.title + "   (" + (a.why || "-") + ")");
        });
        console.log("자리 옮김:", moved, "· 열 안내 붙음:", !!document.getElementById(GUIDE));
    };
})();