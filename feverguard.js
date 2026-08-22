/* ============================================================
   배냇함 — 해열제 안전장치 (feverguard.js)

   ⚠️ 이 파일은 아기 목숨과 직결된다. 규칙 하나만 지킨다.
      "확실하지 않으면 막는다."
      어떤 경우에도 기존보다 느슨해지지 않는다.

   기존 checkPillLock 이 하던 일
     · 직전 1회와의 간격만 확인 (같은 약 4시간 / 다른 약 2시간)

   여기서 더하는 것 넷
     1. 24시간 총 횟수 상한        — 없으면 하루 6회도 통과했다
     2. 약별로 자기 간격을 따로 계산 — 이부프로펜은 6시간이 맞다
     3. 6개월 미만 이부프로펜 차단  — 금기다
     4. 다음 투약 가능 시각을 항상 화면에 — 저장 눌러야 알던 걸 미리 보여준다

   근거
     · 아세트아미노펜 10~15mg/kg, 4~6시간, 24시간 5회 이내, 하루 75mg/kg 이내
     · 이부프로펜 5~10mg/kg, 6~8시간, 6개월 미만 금기
     · 교차투여 시에도 각 약의 자기 간격은 그대로 지킨다

   ❗ 용량 계산 자체는 건드리지 않는다.
      지금 값(체중×0.3~0.38 / ×0.4~0.5)은 안전 범위 안이다.
      다만 어떤 농도를 전제로 한 값인지 화면에 밝힌다.

   index.html 에서 script.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ==========================================================
       ⭐ 기준값. 바꾸려면 반드시 약사·소아과 확인 후에.
       ========================================================== */
    var RULE = {
        red: {                       // 아세트아미노펜 (타이레놀·챔프·세토펜)
            name: "아세트아미노펜",
            gapMin: 240,             // 같은 약 최소 4시간
            maxPerDay: 5,            // 24시간 5회 이내
            syrup: "32mg/mL"
        },
        blue: {                      // 이부프로펜 (부루펜)
            name: "이부프로펜",
            gapMin: 360,             // 같은 약 최소 6시간  ← 기존 4시간에서 강화
            maxPerDay: 4,            // 24시간 4회 이내
            syrup: "20mg/mL",
            minMonths: 6             // 6개월 미만 금기
        },
        crossMin: 120                // 다른 약으로 바꿔 줄 때 최소 2시간
    };

    var DAY = 86400000;

    /* ---------- 기록 읽기 ---------- */

    function records() {
        try { return JSON.parse(localStorage.getItem("tosil_fever_records")) || []; }
        catch (e) { return []; }
    }

    // 그 약의 마지막 투약 시각
    function lastOf(type) {
        var best = 0;
        records().forEach(function (r) {
            if (!r || r.type !== type) return;
            var t = Number(r.timestamp) || 0;
            if (t > best) best = t;
        });
        return best;
    }

    // 종류 상관없이 마지막 투약
    function lastAny() {
        var best = 0;
        records().forEach(function (r) {
            var t = Number(r && r.timestamp) || 0;
            if (t > best) best = t;
        });
        return best;
    }

    // 최근 24시간 안에 그 약을 몇 번 줬나
    function countIn24h(type) {
        var floor = Date.now() - DAY;
        return records().filter(function (r) {
            return r && r.type === type && (Number(r.timestamp) || 0) >= floor;
        }).length;
    }

    /* ---------- 아기 월령 ----------
       모르면 "모른다"고 답한다. 넘겨짚지 않는다. -------- */

    function ageMonths() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var b = new Date(s + "T00:00:00").getTime();
        if (isNaN(b)) return null;
        return (Date.now() - b) / DAY / 30.44;
    }

    function hhmm(ts) {
        var d = new Date(ts);
        return String(d.getHours()).padStart(2, "0") + ":" +
               String(d.getMinutes()).padStart(2, "0");
    }

    function leftText(ms) {
        var m = Math.ceil(ms / 60000);
        if (m <= 0) return "";
        var h = Math.floor(m / 60), mm = m % 60;
        return h ? (h + "시간 " + (mm ? mm + "분" : "")) : (mm + "분");
    }

    /* ==========================================================
       판단 — 지금 이 약을 줘도 되는가
       막을 이유가 하나라도 있으면 막는다.
       ========================================================== */

    window.feverCheck = function (type) {
        var rule = RULE[type];
        if (!rule) return { ok: false, why: "약 종류를 확인할 수 없어요" };

        var now = Date.now();

        // 1) 6개월 미만 이부프로펜 금기
        if (rule.minMonths) {
            var m = ageMonths();
            if (m === null) {
                return {
                    ok: false, hard: true,
                    why: "아기 생년월일이 없어 월령을 확인할 수 없어요.\n" +
                         rule.name + "은 6개월 미만에게 쓰지 않습니다.\n" +
                         "설정에서 생년월일을 먼저 등록해주세요."
                };
            }
            if (m < rule.minMonths) {
                return {
                    ok: false, hard: true,
                    why: rule.name + "은 생후 6개월 미만에게 쓸 수 없어요.\n" +
                         "(지금 약 " + Math.floor(m) + "개월)\n" +
                         "소아과에 먼저 문의해주세요."
                };
            }
        }

        // 2) 24시간 총 횟수
        var n = countIn24h(type);
        if (n >= rule.maxPerDay) {
            return {
                ok: false, hard: true,
                why: "최근 24시간 안에 " + rule.name + "을 " + n + "번 줬어요.\n" +
                     "하루 " + rule.maxPerDay + "회가 상한입니다.\n" +
                     "더 필요하면 소아과에 연락해주세요."
            };
        }

        // 3) 같은 약 간격
        var lastSame = lastOf(type);
        if (lastSame) {
            var openAt = lastSame + rule.gapMin * 60000;
            if (now < openAt) {
                return {
                    ok: false,
                    why: rule.name + "은 " + (rule.gapMin / 60) + "시간 간격이 필요해요.\n" +
                         hhmm(openAt) + "부터 (" + leftText(openAt - now) + " 남음)",
                    openAt: openAt
                };
            }
        }

        // 4) 다른 약으로 바꿔 줄 때 최소 간격
        var any = lastAny();
        if (any && any !== lastSame) {
            var crossAt = any + RULE.crossMin * 60000;
            if (now < crossAt) {
                return {
                    ok: false,
                    why: "다른 약을 준 지 얼마 안 됐어요.\n" +
                         hhmm(crossAt) + "부터 (" + leftText(crossAt - now) + " 남음)",
                    openAt: crossAt
                };
            }
        }

        return { ok: true, why: "", left: rule.maxPerDay - n };
    };

    /* ==========================================================
       기존 잠금에 얹기 — 더 엄격해지기만 한다
       원래 막던 건 그대로 막고, 우리가 찾은 이유를 더한다.
       ========================================================== */

    (function hookLock() {
        var orig = window.checkPillLock;
        if (typeof orig !== "function" || orig.__guarded) return;

        var wrapped = function (type) {
            // 원래 판단이 막으면 그대로 막는다
            var base;
            try { base = orig.apply(this, arguments); } catch (e) { base = { locked: false, reason: "" }; }
            if (base && base.locked) return base;

            // 원래는 통과했어도 우리가 막을 이유가 있으면 막는다
            var v = window.feverCheck(type);
            if (!v.ok) return { locked: true, reason: v.why };

            return { locked: false, reason: "" };
        };
        wrapped.__guarded = true;
        window.checkPillLock = wrapped;
    })();

    /* ==========================================================
       화면 — 저장을 눌러야 알던 걸 미리 보여준다
       새벽 두 시에 부모가 묻는 건 "몇 ml" 가 아니라
       "아까 줬는데 지금 또 줘도 되나" 이다.
       ========================================================== */

    var CARD_ID = "fever-guard-card";

    function row(type) {
        var rule = RULE[type];
        var v = window.feverCheck(type);
        var n = countIn24h(type);
        var color = v.ok ? "#00B37A" : "#F04452";
        var head = v.ok ? "지금 줄 수 있어요" : "지금은 안 돼요";

        return '<div style="flex:1; min-width:0; background:var(--bg-card); border:1px solid var(--border); ' +
                'border-left:3px solid ' + (type === "red" ? "#F04452" : "#3182F6") + '; ' +
                'border-radius:12px; padding:12px 13px;">' +
            '<div style="font-size:11.5px; font-weight:900; color:var(--text-m); margin-bottom:6px;">' +
                (type === "red" ? "빨간약" : "파란약") + ' · ' + rule.name + '</div>' +
            '<div style="font-size:13px; font-weight:900; color:' + color + '; line-height:1.4; word-break:keep-all;">' +
                head + '</div>' +
            '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin-top:5px; line-height:1.5; white-space:pre-line; word-break:keep-all;">' +
                (v.ok ? "24시간 안에 " + n + "번 줬어요 (상한 " + rule.maxPerDay + "회)"
                      : v.why.split("\n").slice(1).join("\n") || v.why) +
            '</div>' +
        '</div>';
    }

    function cardHTML() {
        return '<div style="font-size:12px; font-weight:900; color:var(--text-sub); margin:0 2px 8px;">지금 줘도 되나요</div>' +
            '<div style="display:flex; gap:8px;">' + row("red") + row("blue") + '</div>' +
            '<div style="font-size:10.5px; font-weight:600; color:var(--text-sub); line-height:1.6; ' +
                'margin-top:9px; padding:9px 11px; background:var(--bg-sub); border-radius:10px; word-break:keep-all;">' +
                '용량은 아세트아미노펜 ' + RULE.red.syrup + ', 이부프로펜 ' + RULE.blue.syrup + ' 시럽 기준이에요. ' +
                '가지고 계신 약병의 농도가 다르면 그대로 쓰지 마세요.<br>' +
                '<b>맥시부펜 같은 덱시부프로펜은 성분이 달라 이 계산이 맞지 않습니다.</b> 약사에게 확인해주세요.' +
            '</div>';
    }

    function mount() {
        var anchor = document.getElementById("fever-result") ||
                     document.getElementById("v-temp") ||
                     document.getElementById("btn-pill-red");
        if (!anchor || !anchor.parentNode) return;

        var host = anchor.parentNode;
        var old = document.getElementById(CARD_ID);

        var el = old || document.createElement("div");
        el.id = CARD_ID;
        el.style.cssText = "margin:14px 0;";
        el.innerHTML = cardHTML();

        if (!old) host.insertBefore(el, anchor);
    }

    window.refreshFeverGuard = mount;

    /* ---------- 기록이 바뀌면 바로 갱신 ---------- */

    (function hookRecord() {
        ["addFeverRecord", "clearFeverRecord"].forEach(function (name) {
            var orig = window[name];
            if (typeof orig !== "function" || orig.__guarded) return;
            var wrapped = async function () {
                var out = await orig.apply(this, arguments);
                setTimeout(mount, 60);
                return out;
            };
            wrapped.__guarded = true;
            window[name] = wrapped;
        });
    })();

    function boot() {
        setTimeout(mount, 1200);
        setInterval(function () {
            if (document.getElementById(CARD_ID)) mount();   // 남은 시간이 줄어드는 걸 보여준다
        }, 60000);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(mount, 200);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.feverDebug = function () {
        ["red", "blue"].forEach(function (t) {
            var v = window.feverCheck(t);
            console.log("[" + RULE[t].name + "]");
            console.log("  줄 수 있나:", v.ok ? "예" : "아니오");
            if (!v.ok) console.log("  이유:", v.why.replace(/\n/g, " / "));
            console.log("  24시간 횟수:", countIn24h(t) + " / " + RULE[t].maxPerDay);
            var l = lastOf(t);
            console.log("  마지막 투약:", l ? new Date(l).toLocaleString() : "없음");
        });
        var m = ageMonths();
        console.log("아기 월령:", m === null ? "모름 (생년월일 없음)" : Math.floor(m) + "개월");
        console.log("잠금 함수 감쌈:", !!(window.checkPillLock && window.checkPillLock.__guarded));
    };
})();