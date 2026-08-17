/* ============================================================
   육아메이트 — 첫 담기 (firstfill.js)

   기능이 백 개여도 3주 동안 아무것도 안 쌓이면 앱을 지운다.
   반대로 첫날 세 개가 쌓이면 안 지운다. 버릴 게 생겼으니까.

   그래서 가입하고 3분 안에 배냇함에 세 개를 넣는다.
     사진 한 장  — 오늘의 얼굴
     소리 30초   — 두 달 뒤엔 안 나는 소리
     봉인 편지   — 스무 살에 열리는 것

   마지막이 핵심이다. 7,138 이라는 숫자를 본 사람은 그날 앱을 안 지운다.

   기존 온보딩은 손대지 않는다. 저장과 새로고침이 끝난 뒤에 뜬다.
   index.html 에서 sealed.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var FLAG = "tosil_firstfill";
    var GOLD = "#B98A2E";
    var PURPLE = "#7F77DD";
    var DAY = 86400000;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

    // 스무 살까지 며칠 남았나 — 이 숫자가 이 화면의 전부다
    function daysToTwenty() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var p = s.split("-");
        var b = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        if (isNaN(b.getTime())) return null;
        var at = new Date(b.getFullYear() + 20, b.getMonth(), b.getDate());
        var t = new Date(); t.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((at - t) / DAY));
    }

    /* ---------- 지금 몇 개나 담겼나 ---------- */

    function counts() {
        return {
            photo: (typeof window.photoCount === "function") ? window.photoCount() : 0,
            voice: (typeof window.voiceCount === "function") ? window.voiceCount() : 0,
            seal:  (typeof window.sealedCount === "function") ? window.sealedCount() : 0
        };
    }

    function has(kind) { return counts()[kind] > 0; }

    /* ---------- 화면 ---------- */

    var step = 0;          // 0 인사 · 1 사진 · 2 소리 · 3 편지 · 4 완료
    var poll = null;

    function stopPoll() {
        if (poll) { clearInterval(poll); poll = null; }
    }

    // 시트에서 담기가 끝나면 알아서 다음으로 넘어간다
    function waitFor(kind, then) {
        stopPoll();
        var before = counts()[kind];
        var tries = 0;
        poll = setInterval(function () {
            tries++;
            if (counts()[kind] > before) { stopPoll(); then(); return; }
            if (tries > 240) stopPoll();          // 2분이면 그만 기다린다
        }, 500);
    }

    window.closeFirstFill = function () {
        stopPoll();
        try { localStorage.setItem(FLAG, "done"); } catch (e) {}
        var el = document.getElementById("firstfill");
        if (el) el.remove();
        document.body.style.overflow = "";
        if (typeof window.renderMemoryBox === "function") {
            try { window.renderMemoryBox(); } catch (e) {}
        }
    };

    window.firstFillNext = function () {
        stopPoll();
        step++;
        if (step > 4) return window.closeFirstFill();
        draw();
    };

    window.firstFillSkip = function () {
        stopPoll();
        step = (step >= 3) ? 4 : step + 1;
        draw();
    };

    window.firstFillPhoto = function () {
        if (typeof window.addDayPhoto !== "function") return window.firstFillSkip();
        waitFor("photo", function () { step = 2; draw(); });
        window.addDayPhoto(todayKey());
    };

    window.firstFillVoice = function () {
        if (typeof window.openVoiceSheet !== "function") return window.firstFillSkip();
        waitFor("voice", function () { step = 3; draw(); });
        window.openVoiceSheet(todayKey());
    };

    window.firstFillSeal = function () {
        if (typeof window.openSealSheet !== "function") return window.firstFillSkip();
        waitFor("seal", function () { step = 4; draw(); });
        window.openSealSheet();
    };

    /* ---------- 그리기 ---------- */

    function shell(inner) {
        var el = document.getElementById("firstfill");
        if (!el) {
            el = document.createElement("div");
            el.id = "firstfill";
            // 시트(z-index 100002~3)보다 아래. 시트가 이 위에 떠야 한다.
            el.setAttribute("style", "position:fixed; inset:0; z-index:99990; background:var(--bg-main); " +
                "overflow-y:auto; -webkit-overflow-scrolling:touch;");
            document.body.appendChild(el);
            document.body.style.overflow = "hidden";
        }
        el.innerHTML =
            '<div style="max-width:460px; margin:0 auto; min-height:100%; padding:0 26px ' +
                'calc(40px + env(safe-area-inset-bottom, 0px)); box-sizing:border-box; ' +
                'display:flex; flex-direction:column;">' + inner + '</div>';
    }

    function stepMark(n) {
        return '<div style="display:flex; gap:5px; justify-content:center; padding:28px 0 0;">' +
            [1, 2, 3].map(function (i) {
                return '<div style="width:' + (i === n ? 20 : 6) + 'px; height:6px; border-radius:3px; ' +
                    'background:' + (i <= n ? PURPLE : "var(--border)") + '; transition:0.25s;"></div>';
            }).join("") +
        '</div>';
    }

    function ask(n, icon, title, body, cta, act, skipLabel) {
        return stepMark(n) +
            '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center; padding:24px 0;">' +
                '<div style="font-size:46px; margin-bottom:22px;">' + icon + '</div>' +
                '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); ' +
                    'letter-spacing:-0.6px; line-height:1.45; word-break:keep-all;">' + title + '</div>' +
                '<div style="font-size:13.5px; font-weight:600; color:var(--text-sub); line-height:1.85; ' +
                    'margin-top:16px; word-break:keep-all;">' + body + '</div>' +
            '</div>' +
            '<div>' +
                '<div onclick="' + act + '" style="text-align:center; padding:17px; background:' + PURPLE + '; ' +
                    'color:#FFF; border-radius:16px; font-size:15.5px; font-weight:800; cursor:pointer;">' + esc(cta) + '</div>' +
                '<div onclick="window.firstFillSkip()" style="text-align:center; padding:15px; font-size:13px; ' +
                    'font-weight:700; color:var(--text-sub); cursor:pointer;">' + esc(skipLabel || "나중에 담을게요") + '</div>' +
            '</div>';
    }

    function draw() {
        var name = esc(babyName());

        if (step === 0) {
            shell(
                '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">' +
                    '<div style="font-size:52px; margin-bottom:26px;">🧺</div>' +
                    '<div class="serif-display" style="font-size:25px; font-weight:700; color:var(--text-title); ' +
                        'letter-spacing:-0.6px; line-height:1.45;">' + name + '의 배냇함을<br>열었어요</div>' +
                    '<div style="font-size:14px; font-weight:600; color:var(--text-sub); line-height:1.9; margin-top:20px; word-break:keep-all;">' +
                        '여기 담긴 건 나중에<br>' + name + '가 꺼내 볼 것들이에요.<br><br>' +
                        '3분이면 첫 세 가지를 담을 수 있어요.' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<div onclick="window.firstFillNext()" style="text-align:center; padding:17px; background:' + PURPLE + '; ' +
                        'color:#FFF; border-radius:16px; font-size:15.5px; font-weight:800; cursor:pointer;">첫 담기 시작하기</div>' +
                    '<div onclick="window.closeFirstFill()" style="text-align:center; padding:15px; font-size:13px; ' +
                        'font-weight:700; color:var(--text-sub); cursor:pointer;">그냥 둘러볼게요</div>' +
                '</div>'
            );

        } else if (step === 1) {
            shell(ask(1, "📷",
                "오늘의 " + name + "를<br>한 장만",
                "잘 찍을 필요 없어요.<br>지금 자고 있는 얼굴이면 충분합니다.",
                "사진 고르기", "window.firstFillPhoto()"));

        } else if (step === 2) {
            var g = (typeof window.guideWhat === "function") ? window.guideWhat() : "";
            shell(ask(2, "🎙️",
                "지금 나는 소리를<br>30초만",
                (g ? esc(g) + "도 좋고, " : "") + "옹알이도, 숨소리도, 하품도 좋아요.<br>두 달 뒤엔 다른 소리를 냅니다.",
                "녹음하기", "window.firstFillVoice()"));

        } else if (step === 3) {
            var left = daysToTwenty();
            shell(ask(3, "🕯️",
                "스무 살 " + name + "에게<br>편지 한 통",
                "지금의 마음은 지금밖에 못 씁니다.<br>" +
                (left ? '<span style="color:' + GOLD + '; font-weight:800;">' + comma(left) + '일</span> 뒤에 열립니다.'
                      : "먼 훗날 열립니다."),
                "편지 쓰기", "window.firstFillSeal()"));

        } else {
            var c = counts();
            var got = [];
            if (c.photo) got.push({ i: "📷", t: "사진 " + c.photo });
            if (c.voice) got.push({ i: "🎙️", t: "소리 " + c.voice });
            if (c.seal)  got.push({ i: "🕯️", t: "편지 " + c.seal });

            var chips = got.length
                ? '<div style="display:flex; gap:8px; justify-content:center; margin-top:26px;">' +
                    got.map(function (x) {
                        return '<div style="padding:11px 15px; background:var(--bg-card); border:1px solid var(--border); ' +
                            'border-radius:14px; font-size:12.5px; font-weight:800; color:var(--text-s);">' +
                            x.i + ' ' + esc(x.t) + '</div>';
                    }).join("") +
                  '</div>'
                : "";

            var tail;
            if (c.seal) {
                var d = daysToTwenty();
                tail = d ? comma(d) + '일 뒤에<br>' + name + '가 그 편지를 엽니다.'
                         : name + '가 언젠가 그 편지를 엽니다.';
            } else if (got.length) {
                tail = '오늘부터 하나씩 쌓입니다.';
            } else {
                tail = '아무 때나 담기 시작하면 돼요.<br>배냇함은 언제나 열려 있습니다.';
            }

            shell(
                '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">' +
                    '<div style="font-size:52px; margin-bottom:24px;">🧺</div>' +
                    '<div class="serif-display" style="font-size:24px; font-weight:700; color:var(--text-title); ' +
                        'letter-spacing:-0.6px; line-height:1.45;">' +
                        (got.length ? '배냇함에 ' + got.length + '가지가<br>담겼어요' : name + '의 배냇함이<br>준비됐어요') + '</div>' +
                    chips +
                    '<div style="font-size:14px; font-weight:600; color:var(--text-sub); line-height:1.9; margin-top:26px; word-break:keep-all;">' +
                        tail + '</div>' +
                '</div>' +
                '<div onclick="window.closeFirstFill()" style="text-align:center; padding:17px; background:' + PURPLE + '; ' +
                    'color:#FFF; border-radius:16px; font-size:15.5px; font-weight:800; cursor:pointer;">배냇함 열어보기</div>'
            );
        }
    }

    /* ---------- 언제 뜨나 ---------- */

    window.openFirstFill = function (from) {
        step = from || 0;
        draw();
    };

    function shouldShow() {
        if (localStorage.getItem(FLAG)) return false;          // 한 번 보면 다시 안 뜬다
        if (!localStorage.getItem("tosil_babyName")) return false;  // 온보딩 전
        if (!localStorage.getItem("tosil_startDate")) return false;
        var c = counts();
        return (c.photo + c.voice + c.seal) === 0;              // 이미 담은 게 있으면 필요 없다
    }

    function boot() {
        // 앱이 자리를 잡고 나서. 로그인·동기화가 끝나야 업로드가 된다.
        setTimeout(function () {
            if (shouldShow()) window.openFirstFill(0);
        }, 2200);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.firstFillDebug = function (reset) {
        if (reset) { localStorage.removeItem(FLAG); console.log("첫 담기 초기화 — 새로고침하면 다시 뜹니다"); }
        console.log("본 적 있음:", !!localStorage.getItem(FLAG));
        console.log("담긴 것:", counts());
        console.log("스무 살까지:", comma(daysToTwenty() || 0) + "일");
    };
})();