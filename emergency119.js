/* ============================================================
   배냇함 — 119에 읽어줄 카드 (emergency119.js)

   119 대원과 응급실 접수는 반드시 이걸 묻는다.

     몇 개월인가요 · 몸무게는 · 언제부터 · 몇 도까지 올랐나요
     해열제는 언제 뭘 먹였나요

   새벽 세 시에 아이가 축 처져 있을 때 부모는 이걸 못 답한다.
   기억이 안 나는 게 아니라, 그 순간에는 머리가 안 돌아간다.

   그런데 배냇함은 다섯 개를 전부 갖고 있다.
   기록을 받아만 두고 제일 필요한 순간에 안 돌려주면
   그건 기록이 아니라 수집이다.

   ⚠️ 새로 계산하지 않는다.
      tosil_fever_records 와 tosil_latest_weight 를 그대로 읽는다.
      응급 상황에서 두 벌의 답이 나오면 안 된다.

   ⚠️ 앱이 모르는 건 말하지 않는다.
      알레르기는 앱에 저장되는 곳이 없다.
      그래서 "없음" 이라고 쓰지 않고 아예 안 띄운다.
      응급 상황에서 틀린 "없음" 은 빈칸보다 위험하다.

   평소에는 육아정보 탭 안에만 있다.
   최근 여섯 시간 안에 38도가 넘었을 때만 홈으로 올라온다.
   열도 안 나는데 매일 119 버튼이 보이면 그건 겁주기다.

   index.html 에서 script.js 다음이면 어디든 됩니다.
   ============================================================ */
(function () {
    'use strict';

    var SHEET   = "e119-card";
    var HOME_ID = "home-e119";
    var INFO_ID = "info-e119";
    var RED     = "#D32F2F";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }
    function pad(n) { return String(n).padStart(2, "0"); }

    /* ---------- 나이 ---------- */

    function birth() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var t = new Date(s + "T00:00:00").getTime();
        return isNaN(t) ? null : t;
    }

    function ageText() {
        var b = birth();
        if (!b) return { line: "생년월일이 아직 없어요", months: null, days: null };
        var days = Math.floor((Date.now() - b) / 86400000);
        var months = Math.floor(days / 30.436875);
        var line = (days < 62)
            ? "생후 " + days + "일"
            : "생후 " + months + "개월 (" + days + "일)";
        return { line: line, months: months, days: days };
    }
    window.babyAgeForEmergency = ageText;

    function birthDateText() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return "";
        var p = String(s).split("-");
        return p.length === 3 ? p[0] + "년 " + Number(p[1]) + "월 " + Number(p[2]) + "일생" : "";
    }

    /* ---------- 시간 ---------- */

    function agoText(ms) {
        var m = Math.floor((Date.now() - ms) / 60000);
        if (m < 1) return "방금";
        if (m < 60) return m + "분 전";
        var h = Math.floor(m / 60);
        if (h < 24) return h + "시간 " + (m % 60 ? (m % 60) + "분 " : "") + "전";
        return Math.floor(h / 24) + "일 전";
    }

    function clock(ms) {
        var d = new Date(ms);
        return pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    /* ---------- 열과 약 ---------- */

    function feverRecords() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_fever_records")) || []; } catch (e) {}
        return recs.filter(function (r) { return r && Number(r.timestamp); })
                   .sort(function (a, b) { return Number(b.timestamp) - Number(a.timestamp); });
    }

    function pillName(type) {
        if (type === "red")  return "아세트아미노펜 (빨강)";
        if (type === "blue") return "이부프로펜 계열 (파랑)";
        return "";
    }

    function summary() {
        var recs = feverRecords();
        var now = Date.now();

        var last = null, peak = null, firstHot = null, todayN = 0, lastPill = null;
        var dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);

        recs.forEach(function (r) {
            var t = Number(r.timestamp), temp = Number(r.temp);

            if (temp && !last) last = r;                       // 정렬돼 있으니 첫 번째가 최근
            if (temp && t > now - 72 * 3600000) {
                if (!peak || temp > Number(peak.temp)) peak = r;
                if (temp >= 38.0) firstHot = r;                // 뒤로 갈수록 오래된 것 → 마지막에 남는 게 처음
            }
            if (t >= dayStart.getTime()) todayN++;
            if (!lastPill && (r.type === "red" || r.type === "blue")) lastPill = r;
        });

        var hot6 = recs.filter(function (r) {
            return Number(r.temp) >= 38.0 && Number(r.timestamp) > now - 6 * 3600000;
        });

        var symptom = "";
        for (var i = 0; i < recs.length && !symptom; i++) {
            if (recs[i].symptoms && String(recs[i].symptoms).trim()) symptom = String(recs[i].symptoms).trim();
            if (Number(recs[i].timestamp) < now - 48 * 3600000) break;
        }

        return {
            last: last, peak: peak, firstHot: firstHot, todayN: todayN,
            lastPill: lastPill, hot6: hot6.length, symptom: symptom,
            weight: (localStorage.getItem("tosil_latest_weight") || "").trim()
        };
    }

    /* ---------- 글로도 만든다 (문자·카톡으로 보낼 수 있게) ---------- */

    function asText() {
        var a = ageText(), s = summary();
        var L = [];

        L.push(babyName() + " · " + a.line + (birthDateText() ? " · " + birthDateText() : ""));
        if (s.weight) L.push("몸무게 " + s.weight + "kg");

        if (s.last && Number(s.last.temp)) {
            L.push("최근 체온 " + Number(s.last.temp).toFixed(1) + "도 (" + agoText(Number(s.last.timestamp)) + ", " + clock(Number(s.last.timestamp)) + ")");
        }
        if (s.peak && s.last && Number(s.peak.temp) > Number(s.last.temp)) {
            L.push("최고 " + Number(s.peak.temp).toFixed(1) + "도 (" + agoText(Number(s.peak.timestamp)) + ")");
        }
        if (s.firstHot) L.push("열 시작 " + agoText(Number(s.firstHot.timestamp)));
        if (s.todayN)   L.push("오늘 " + s.todayN + "번 쟀어요");

        if (s.lastPill) {
            L.push("마지막 해열제 " + pillName(s.lastPill.type) + " · " + agoText(Number(s.lastPill.timestamp)) + " (" + clock(Number(s.lastPill.timestamp)) + ")");
        } else {
            L.push("해열제 기록 없음");
        }

        if (s.symptom) L.push("증상 " + s.symptom);

        return L.join("\n");
    }
    window.emergency119Text = asText;

    /* ---------- 복사 ---------- */

    window.copy119 = function () {
        var t = asText();
        var done = function () { toast("복사했어요. 문자나 카톡에 붙여 넣으세요"); };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(t).then(done, function () { fallback(t, done); });
        } else fallback(t, done);

        function fallback(txt, ok) {
            try {
                var ta = document.createElement("textarea");
                ta.value = txt;
                ta.style.cssText = "position:fixed; top:-1000px;";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                ok();
            } catch (e) { toast("복사하지 못했어요"); }
        }
    };

    /* ---------- 카드 ---------- */

    function row(label, value, sub, color, dim) {
        return '<div style="display:flex; align-items:flex-start; gap:14px; ' +
                'padding:13px 0; border-bottom:1px solid var(--border);">' +
            '<div style="width:82px; flex-shrink:0; font-size:12px; font-weight:800; ' +
                'color:var(--text-sub); padding-top:3px;">' + esc(label) + '</div>' +
            '<div style="flex:1; min-width:0; text-align:right;">' +
                '<div style="font-size:17.5px; font-weight:900; letter-spacing:-0.4px; ' +
                    'color:' + (dim ? "var(--text-sub)" : (color || "var(--text-m)")) + '; ' +
                    'line-height:1.35; word-break:keep-all;">' + esc(value) + '</div>' +
                (sub ? '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); ' +
                       'margin-top:2px;">' + esc(sub) + '</div>' : '') +
            '</div>' +
        '</div>';
    }

    function softBtn(inner, onclick, href) {
        var css = "flex:1; text-align:center; text-decoration:none; padding:14px 8px; " +
                  "background:var(--bg-sub); color:var(--text-m); border-radius:13px; " +
                  "font-size:13px; font-weight:800; cursor:pointer;";
        return href
            ? '<a href="' + href + '" target="_blank" rel="noopener" style="' + css + '">' + inner + '</a>'
            : '<div onclick="' + onclick + '" style="' + css + '">' + inner + '</div>';
    }

    window.open119Card = function () {
        var a = ageText(), s = summary();

        var old = document.getElementById(SHEET);
        if (old) old.remove();

        var body = "", empty = 0;

        body += row("나이", a.line.replace(/ \(.*/, ""),
                    (a.days !== null ? a.days + "일" : "") +
                    (birthDateText() ? (a.days !== null ? " · " : "") + birthDateText() : ""));

        if (s.weight) body += row("몸무게", s.weight + " kg");
        else { body += row("몸무게", "—", "", null, true); empty++; }

        if (s.last && Number(s.last.temp)) {
            var t = Number(s.last.temp);
            body += row("최근 체온", t.toFixed(1) + "도",
                        agoText(Number(s.last.timestamp)) + " · " + clock(Number(s.last.timestamp)),
                        t >= 38.0 ? RED : null);
            if (s.peak && Number(s.peak.temp) > t) {
                body += row("최고 체온", Number(s.peak.temp).toFixed(1) + "도",
                            agoText(Number(s.peak.timestamp)), RED);
            }
            if (s.firstHot) body += row("열 시작", agoText(Number(s.firstHot.timestamp)) + "부터");
            if (s.todayN)   body += row("오늘 잰 횟수", s.todayN + "번");
        } else {
            body += row("최근 체온", "—", "", null, true); empty++;
        }

        if (s.lastPill) {
            body += row("마지막 해열제", pillName(s.lastPill.type),
                        agoText(Number(s.lastPill.timestamp)) + " · " + clock(Number(s.lastPill.timestamp)));
        } else {
            body += row("마지막 해열제", "—", "", null, true); empty++;
        }

        if (s.symptom) body += row("적어둔 증상", s.symptom);

        var hint = empty
            ? '<div style="background:var(--bg-sub); border-radius:13px; padding:13px 15px; margin-top:14px; ' +
                  'font-size:12px; font-weight:700; color:var(--text-sub); line-height:1.6; word-break:keep-all;">' +
                  '빈 칸은 아직 앱에 기록이 없다는 뜻이에요. 체온을 재고 몸무게를 적어두면 여기가 저절로 채워집니다.</div>'
            : '';

        var wrap = document.createElement("div");
        wrap.id = SHEET;
        wrap.setAttribute("style",
            "position:fixed; inset:0; z-index:100010; background:var(--bg-main); " +
            "overflow-y:auto; -webkit-overflow-scrolling:touch;");

        wrap.innerHTML =
        '<div style="max-width:440px; margin:0 auto; padding:20px 20px calc(36px + env(safe-area-inset-bottom, 0px));">' +

            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">' +
                '<div style="font-size:15.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.4px;">' +
                    '<span style="color:' + RED + ';">🚨</span> 119에 읽어줄 카드</div>' +
                '<span onclick="window.close119Card()" style="font-size:23px; font-weight:300; ' +
                    'color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); ' +
                'line-height:1.6; margin-bottom:16px;">119와 응급실 접수에서 묻는 것들이에요</div>' +

            '<div style="background:var(--bg-card); border:1px solid var(--border); ' +
                'border-radius:18px; padding:4px 16px 2px;">' + body + '</div>' +

            hint +

            '<a href="tel:119" style="display:flex; align-items:center; justify-content:center; gap:7px; ' +
                'text-decoration:none; margin-top:16px; padding:17px; ' +
                'background:rgba(211,46,46,0.09); border:1.5px solid rgba(211,46,46,0.30); ' +
                'color:' + RED + '; border-radius:14px; font-size:16px; font-weight:900; letter-spacing:-0.3px;">' +
                '<span style="font-size:17px;">📞</span> 119 전화걸기</a>' +

            '<div style="display:flex; gap:8px; margin-top:8px;">' +
                softBtn("📋 복사하기", "window.copy119()") +
                softBtn("🌙 문 연 병원", "", "https://www.e-gen.or.kr/moonlight/main.do") +
            '</div>' +

            '<div style="font-size:11px; font-weight:600; color:var(--text-sub); ' +
                'line-height:1.7; margin-top:18px; word-break:keep-all;">' +
                '앱에 적힌 기록만 보여드립니다. 알레르기는 배냇함이 따로 받아두는 곳이 없어서 띄우지 않아요 — ' +
                '있다면 꼭 직접 말씀해 주세요.</div>' +

        '</div>';

        document.body.appendChild(wrap);
    };

    window.close119Card = function () {
        var el = document.getElementById(SHEET);
        if (el) el.remove();
    };

    /* ---------- 육아정보 탭 : 항상 있는 자리 ---------- */

    function mountInfo() {
        var tab = document.getElementById("tab-info");
        if (!tab || !tab.firstElementChild || document.getElementById(INFO_ID)) return;

        var shell = tab.firstElementChild;
        var sosBtn = tab.querySelector('[onclick*="openSOSModal"]');
        if (!sosBtn) return;

        var block = sosBtn;
        while (block && block.parentNode && block.parentNode !== shell) block = block.parentNode;
        if (!block || block.parentNode !== shell) return;

        var el = document.createElement("div");
        el.id = INFO_ID;
        el.onclick = window.open119Card;
        el.style.cssText =
            "display:flex; align-items:center; gap:12px; margin-bottom:14px; padding:15px 16px; cursor:pointer; " +
            "background:rgba(211,46,46,0.07); border:1px solid rgba(211,46,46,0.22); border-radius:16px;";
        el.innerHTML =
            '<div style="font-size:20px; flex-shrink:0;">🚨</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:14px; font-weight:900; color:' + RED + '; letter-spacing:-0.3px;">' +
                    '119에 읽어줄 카드</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:2px; word-break:keep-all;">' +
                    '개월수 · 몸무게 · 체온 · 마지막 해열제를 한 화면에</div>' +
            '</div>' +
            '<div style="font-size:12px; color:' + RED + '; flex-shrink:0;">〉</div>';

        shell.insertBefore(el, block);
    }

    /* ---------- 홈 : 열이 날 때만 ---------- */

    function mountHome() {
        var old = document.getElementById(HOME_ID);
        var s = summary();

        // 여섯 시간 안에 38도가 넘은 적이 없으면 홈에는 안 띄운다
        if (!s.hot6) { if (old) old.remove(); return; }

        var anchor = document.getElementById("baby-dashboard") ||
                     document.getElementById("now-status-card");
        if (!anchor) return;

        var home = document.getElementById("tab-home");
        var block = anchor;
        while (block && block.parentNode && block.parentNode !== home) block = block.parentNode;
        if (!block || block.parentNode !== home) block = anchor;

        var temp = s.last ? Number(s.last.temp).toFixed(1) : "";

        var box = document.createElement("div");
        box.innerHTML =
            '<div id="' + HOME_ID + '" onclick="window.open119Card()" ' +
                'style="display:flex; align-items:center; gap:12px; cursor:pointer; ' +
                'background:rgba(211,46,46,0.07); border:1px solid rgba(211,46,46,0.22); ' +
                'border-radius:18px; padding:14px 16px; margin-bottom:20px;">' +
                '<div style="font-size:20px; flex-shrink:0;">🚨</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:13.5px; font-weight:900; color:' + RED + '; word-break:keep-all;">' +
                        (temp ? temp + '도예요. 병원에 가게 되면' : '병원에 가게 되면') + '</div>' +
                    '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:2px;">' +
                        '119에 읽어줄 카드가 준비돼 있어요</div>' +
                '</div>' +
                '<div style="font-size:12px; color:' + RED + '; flex-shrink:0;">〉</div>' +
            '</div>';

        var el = box.firstChild;
        if (old) old.parentNode.replaceChild(el, old);
        else block.parentNode.insertBefore(el, block.nextSibling);
    }

    function mount() { mountInfo(); mountHome(); }
    window.refresh119 = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1700);
        setTimeout(mount, 3600);
        setInterval(mount, 3 * 60000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 400);
        });

        // 체온을 재는 순간 바로 반영된다
        var orig = window.addFeverRecord;
        if (typeof orig === "function" && !orig.__e119) {
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                setTimeout(mount, 300);
                return out;
            };
            wrapped.__e119 = true;
            window.addFeverRecord = wrapped;
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.e119Debug = function () {
        var s = summary();
        console.log("나이:", ageText().line);
        console.log("몸무게:", s.weight || "기록 없음");
        console.log("최근 체온:", s.last ? Number(s.last.temp).toFixed(1) + "도 · " + agoText(Number(s.last.timestamp)) : "없음");
        console.log("최고 체온(72h):", s.peak ? Number(s.peak.temp).toFixed(1) + "도" : "없음");
        console.log("마지막 해열제:", s.lastPill ? pillName(s.lastPill.type) + " · " + agoText(Number(s.lastPill.timestamp)) : "없음");
        console.log("6시간 안 38도 이상:", s.hot6 + "회  → 홈 노출:", s.hot6 > 0);
        console.log("─── 읽어줄 글 ───");
        console.log(asText());
    };
})();