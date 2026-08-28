/* ============================================================
   배냇함 — 삼켰어요 · 알레르기 쇼크 (sosplus.js)

   SOS 센터에 두 가지가 없었다.

     1. 삼켰어요 (약 · 세제 · 단추전지 · 자석 · 동전 · 견과)
     2. 알레르기 쇼크 (아나필락시스)

   둘 다 영유아 응급에서 흔하고, 둘 다 첫 몇 분이 결과를 가른다.
   그리고 둘 다 '잘못 대처하면 더 나빠지는' 몇 안 되는 상황이다.
   토하게 하면 안 되는 걸 토하게 하는 것 같은.

   아나필락시스 내용은 이미 이유식 두드러기 글 안에 있었다.
   글은 읽는 것이고 SOS는 누르는 것이다. 자리가 다르다.

   ⚠️ 이 화면은 진단하지 않는다.
      "무엇을 하지 말아야 하는지" 와 "지금 119를 눌러야 하는지" 만 말한다.
      판단은 전부 119와 의사에게 넘긴다.

   ⚠️ 삼킨 시각을 기록해 둔다.
      단추전지처럼 시간이 곧 손상인 것이 있어서,
      병원에서 제일 먼저 묻는 게 "언제 삼켰나" 다.
      시계를 재는 건 이 앱이 제일 잘하는 일이다.

   index.html 은 한 줄도 안 고친다.
   SOS 첫 화면에 버튼 두 개를 얹고, 단계 두 개를 붙인다.

   index.html 에서 script.js 다음이면 어디든 됩니다.
   ============================================================ */
(function () {
    'use strict';

    var SWALLOW_KEY = "tosil_swallow_at";
    var RED    = "#D32F2F";
    var ORANGE = "#E07B39";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function elapsed(ms) {
        var m = Math.floor((Date.now() - ms) / 60000);
        if (m < 1) return "방금";
        if (m < 60) return m + "분";
        return Math.floor(m / 60) + "시간 " + (m % 60) + "분";
    }

    /* ---------- 삼킨 시각 ---------- */

    window.markSwallowTime = function () {
        try { localStorage.setItem(SWALLOW_KEY, String(Date.now())); } catch (e) {}
        paintClock();
        toast("삼킨 시각을 적어뒀어요. 병원에서 제일 먼저 묻습니다");
    };

    window.clearSwallowTime = function () {
        try { localStorage.removeItem(SWALLOW_KEY); } catch (e) {}
        paintClock();
    };

    function swallowAt() {
        var v = parseInt(localStorage.getItem(SWALLOW_KEY), 10);
        return isFinite(v) ? v : null;
    }

    function clockHTML() {
        var at = swallowAt();
        if (!at) {
            return '<div onclick="window.markSwallowTime()" ' +
                'style="text-align:center; padding:14px; background:var(--bg-sub); ' +
                'border-radius:13px; font-size:13px; font-weight:800; color:var(--text-m); cursor:pointer;">' +
                '🕐 삼킨 시각 기록해두기</div>';
        }
        var d = new Date(at);
        return '<div style="background:rgba(211,46,46,0.07); border:1px solid rgba(211,46,46,0.20); ' +
            'border-radius:13px; padding:13px 15px; text-align:center;">' +
            '<div style="font-size:11px; font-weight:800; color:var(--text-sub); letter-spacing:1px;">삼킨 지</div>' +
            '<div style="font-size:22px; font-weight:900; color:' + RED + '; margin:3px 0 2px;">' + esc(elapsed(at)) + ' 지났어요</div>' +
            '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub);">' +
                String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + '에 삼켰어요' +
                ' · <span onclick="window.clearSwallowTime()" style="text-decoration:underline; cursor:pointer;">지우기</span></div>' +
        '</div>';
    }

    function paintClock() {
        var el = document.getElementById("swallow-clock");
        if (el) el.innerHTML = clockHTML();
    }

    /* ---------- 화면 조각 ---------- */

    function head(icon, title, sub, color) {
        return '<div style="text-align:center; margin-bottom:18px;">' +
            '<div style="font-size:30px; margin-bottom:6px;">' + icon + '</div>' +
            '<div style="font-size:17px; font-weight:900; color:' + (color || "var(--text-m)") + ';">' + esc(title) + '</div>' +
            '<div style="font-size:12.5px; font-weight:700; color:var(--text-sub); margin-top:4px; ' +
                'line-height:1.55; word-break:keep-all;">' + esc(sub) + '</div>' +
        '</div>';
    }

    function call119(label) {
        return '<a href="tel:119" style="display:block; text-align:center; text-decoration:none; ' +
            'padding:16px; background:rgba(211,46,46,0.09); border:1.5px solid rgba(211,46,46,0.30); ' +
            'color:' + RED + '; border-radius:14px; ' +
            'font-size:15.5px; font-weight:900; margin-top:6px;">📞 ' + esc(label || "119 전화걸기") + '</a>';
    }

    function block(color, bg, title, lines) {
        var items = lines.map(function (t) {
            return '<div style="font-size:12.5px; font-weight:700; color:var(--text-m); ' +
                'line-height:1.65; margin-top:6px; word-break:keep-all;">· ' + t + '</div>';
        }).join("");

        return '<div style="background:' + bg + '; border:1px solid ' + color + '33; ' +
            'border-radius:14px; padding:14px 15px; margin-bottom:10px;">' +
            '<div style="font-size:13.5px; font-weight:900; color:' + color + '; word-break:keep-all;">' + title + '</div>' +
            items +
        '</div>';
    }

    /* ---------- 삼켰어요 ---------- */

    function swallowHTML() {
        return '' +
        head("😨", "무언가를 삼켰어요", "지금 숨을 못 쉬거나 축 처지면 바로 119부터 누르세요", RED) +

        '<div id="swallow-clock" style="margin-bottom:14px;">' + clockHTML() + '</div>' +

        block(RED, "rgba(211,46,46,0.06)", "🚫 절대 하면 안 되는 세 가지", [
            "<b>억지로 토하게 하지 마세요.</b> 세제·표백제·석유류는 올라오면서 식도와 기도를 한 번 더 태웁니다",
            "<b>손가락을 넣어 빼지 마세요.</b> 더 깊이 밀려 들어갑니다",
            "<b>물·우유·음식을 임의로 먹이지 마세요.</b> 119나 의사 지시를 먼저 받으세요"
        ]) +

        block(RED, "rgba(211,46,46,0.06)", "🚨 지금 바로 응급실 — 기다리지 마세요", [
            "<b>단추형 전지(동전 모양)</b> — 식도에 걸리면 몇 시간 안에 화상이 생깁니다. 제일 급합니다",
            "<b>자석 두 개 이상</b> — 장을 사이에 두고 붙어 구멍을 냅니다",
            "<b>바늘·핀·이쑤시개 같은 날카로운 것</b>",
            "숨이 가쁘거나, 침을 계속 흘리거나, 삼키기를 힘들어할 때"
        ]) +

        block(ORANGE, "rgba(224,123,57,0.07)", "📞 먼저 119에 전화할 것", [
            "<b>세제 · 표백제 · 화장품 · 방향제 · 석유류</b>",
            "<b>어른 약</b> — 무엇을 몇 알, 언제 먹었는지 확인하세요",
            "<b>담배 · 니코틴 액상</b>",
            "무엇을 삼켰는지 모를 때"
        ]) +

        block("#5A8F6B", "rgba(90,143,107,0.07)", "🩺 병원에서 확인받을 것", [
            "<b>동전 · 작은 장난감 조각</b> — 잘 먹고 잘 놀아도 걸려 있을 수 있어요",
            "<b>땅콩 · 견과류</b> — 기침이나 쌕쌕거림이 남으면 기도로 들어간 것일 수 있습니다"
        ]) +

        block("#7F77DD", "rgba(127,119,221,0.07)", "🎒 병원에 가져갈 것", [
            "삼킨 것과 <b>똑같은 물건</b> (같은 전지, 같은 약, 같은 세제 용기)",
            "제품 <b>포장과 성분표</b>",
            "<b>삼킨 시각</b>과 대략의 양 — 위에 적어두신 시계를 그대로 읽어주세요"
        ]) +

        call119() +

        (typeof window.openEmergencyModal === "function"
            ? '<div onclick="window.openEmergencyModal(\'heimlich\')" ' +
              'style="text-align:center; padding:15px; margin-top:8px; background:var(--bg-sub); ' +
              'color:var(--text-m); border-radius:14px; font-size:13.5px; font-weight:800; cursor:pointer;">' +
              '🫁 숨을 못 쉬어요 · 하임리히 보기</div>'
            : '') +

        '<div style="font-size:11px; font-weight:600; color:var(--text-sub); ' +
            'line-height:1.7; margin-top:16px; word-break:keep-all;">' +
            '이 화면은 진단하지 않습니다. 무엇을 하지 말아야 하는지와 언제 서둘러야 하는지만 알려드려요. ' +
            '판단이 서지 않으면 119에 전화하면 24시간 의사 상담을 받을 수 있습니다.</div>';
    }

    /* ---------- 알레르기 쇼크 ---------- */

    function anaHTML() {
        return '' +
        head("🚨", "알레르기 쇼크가 의심돼요", "아나필락시스는 몇 분 만에 나빠집니다. 나아 보여도 병원에 가야 해요", RED) +

        block(RED, "rgba(211,46,46,0.06)", "이 중 두 가지가 같이 오면 119입니다", [
            "전신에 <b>두드러기</b>가 번짐",
            "<b>기침 · 쌕쌕거림 · 숨차함</b>",
            "<b>입술 · 혀 · 눈두덩이 붓기</b>",
            "<b>반복되는 구토</b>나 심한 복통",
            "<b>축 처지거나 창백해짐</b>"
        ]) +

        block(ORANGE, "rgba(224,123,57,0.07)", "119를 기다리는 동안", [
            "먹던 것을 <b>즉시 멈추게</b> 하세요",
            "<b>눕히고 다리를 올려</b> 주세요. 숨이 차 보이면 눕히지 말고 앉히세요",
            "토할 것 같으면 <b>옆으로</b> 뉘어 주세요",
            "처방받은 <b>에피네프린 자가주사(에피펜)</b>가 있으면 바깥쪽 허벅지에 사용하세요",
            "혼자 두지 마세요"
        ]) +

        block("#7F77DD", "rgba(127,119,221,0.07)", "좋아 보여도 병원에 가세요", [
            "가라앉았다가 <b>몇 시간 뒤 다시 심해지는</b> 경우가 있습니다",
            "무엇을 <b>언제 얼마나</b> 먹었는지 적어 가세요",
            "먹던 음식의 <b>포장을 챙겨</b> 가세요"
        ]) +

        call119() +

        '<div style="font-size:11px; font-weight:600; color:var(--text-sub); ' +
            'line-height:1.7; margin-top:16px; word-break:keep-all;">' +
            '판단이 애매하면 119에 전화해서 물어보세요. 아나필락시스는 늦게 부르는 것보다 ' +
            '괜히 부른 게 훨씬 낫습니다.</div>';
    }

    /* ---------- SOS 화면에 끼우기 ---------- */

    function stepBox(id, html) {
        var el = document.getElementById(id);
        if (el) { el.innerHTML = html; return el; }

        var choice = document.getElementById("sos-step-choice");
        if (!choice || !choice.parentNode) return null;

        el = document.createElement("div");
        el.id = id;
        el.style.cssText = "display:none; margin-top:22px;";
        el.innerHTML = html;
        choice.parentNode.appendChild(el);
        return el;
    }

    function hideAll() {
        ["sos-step-choice", "sos-step-medical", "sos-step-cry", "sos-step-swallow", "sos-step-ana"]
            .forEach(function (id) {
                var e = document.getElementById(id);
                if (e) e.style.setProperty("display", "none", "important");
            });
        var plus = document.getElementById("sos-row-plus");
        if (plus) plus.style.setProperty("display", "none", "important");
    }

    function showStep(id) {
        hideAll();
        var e = stepBox(id, id === "sos-step-swallow" ? swallowHTML() : anaHTML());
        if (e) e.style.setProperty("display", "block", "important");

        var back = document.getElementById("btn-sos-back");
        if (back) back.style.setProperty("display", "flex", "important");
        var close = document.getElementById("btn-sos-close");
        if (close) close.style.setProperty("display", "none", "important");
    }

    window.showSosSwallow = function () { showStep("sos-step-swallow"); };
    window.showSosAnaphylaxis = function () { showStep("sos-step-ana"); };

    /* ---------- 첫 화면에 버튼 두 개 ---------- */

    function tile(cls, fn, icon, title, sub, color) {
        var b = document.createElement("button");
        b.className = cls;
        b.setAttribute("onclick", fn);
        b.style.cssText =
            "flex:1; min-width:0; height:135px; display:flex; flex-direction:column; " +
            "align-items:center; justify-content:center; border-radius:16px; text-align:center; " +
            "cursor:pointer; padding:10px; box-sizing:border-box; " +
            "border:1px solid " + color + "33; background:" + color + "12;";
        b.innerHTML =
            '<div style="font-size:26px; margin-bottom:8px;">' + icon + '</div>' +
            '<div style="font-size:14px; font-weight:900; color:' + color + '; margin-bottom:4px; ' +
                'line-height:1.2; word-break:keep-all;">' + esc(title) + '</div>' +
            '<div style="font-size:11px; font-weight:800; color:' + color + '; opacity:0.8;">' + esc(sub) + '</div>';
        return b;
    }

    function mount() {
        var choice = document.getElementById("sos-step-choice");
        if (!choice) return;
        if (document.getElementById("sos-row-plus")) return;

        // ⚠️ 기존 버튼 줄은 건드리지 않는다.
        //    그 줄은 display:flex 에 칸이 둘뿐이라, 거기에 더 넣으면
        //    네 개가 서로 밀면서 화면이 통째로 찌그러진다.
        //    우리 줄은 따로 만들어 그 아래에 놓는다.
        var row = document.createElement("div");
        row.id = "sos-row-plus";
        row.style.cssText = "display:flex; gap:12px; width:100%; margin-top:12px;";

        row.appendChild(tile("sos-btn-swallow", "window.showSosSwallow()",
            "😨", "무언가를 삼켰어요", "약 · 세제 · 전지", RED));
        row.appendChild(tile("sos-btn-ana", "window.showSosAnaphylaxis()",
            "🚨", "알레르기 쇼크 같아요", "두드러기 + 숨차함", ORANGE));

        choice.appendChild(row);
    }

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 1200);
        setTimeout(mount, 3000);

        // SOS 를 다시 열면 내 단계는 닫히고 내 버튼은 다시 보여야 한다
        var orig = window.openSOSModal;
        if (typeof orig === "function" && !orig.__sosplus) {
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                mount();
                ["sos-step-swallow", "sos-step-ana"].forEach(function (id) {
                    var e = document.getElementById(id);
                    if (e) e.style.setProperty("display", "none", "important");
                });
                var plus = document.getElementById("sos-row-plus");
                if (plus) plus.style.setProperty("display", "flex", "important");
                return out;
            };
            wrapped.__sosplus = true;
            window.openSOSModal = wrapped;
        }

        setInterval(function () {
            if (document.getElementById("swallow-clock")) paintClock();
        }, 30000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.sosPlusDebug = function () {
        console.log("삼켰어요 버튼:", !!document.querySelector(".sos-btn-swallow"));
        console.log("알레르기 쇼크 버튼:", !!document.querySelector(".sos-btn-ana"));
        var at = swallowAt();
        console.log("삼킨 시각:", at ? new Date(at).toLocaleString() + " (" + elapsed(at) + " 지남)" : "기록 없음");
        console.log("하임리히 연결:", typeof window.openEmergencyModal === "function");
    };
})();