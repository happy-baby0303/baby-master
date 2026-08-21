/* ============================================================
   배냇함 — 빈 액자 (milestonebook.js)

   배냇함에는 사진도 소리도 붙었는데, 정작 사람들이 제일 오래
   들여다보는 100줄짜리 도감은 아직 체크박스 목록이었다.

   숫자로 "5 / 100 달성"이라고 말하는 것과,
   빈 액자 95개가 눈앞에 있는 것은 다르다.
   숫자는 정보지만 빈칸은 할 일이다.

   script.js 는 한 줄도 고치지 않는다.
   각 줄이 onclick="window.toggleMilestone('id')" 로 자기 ID 를
   갖고 있어서, 다 그려진 뒤에 액자만 끼워 넣으면 된다.

   index.html 에서 waveform.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var SLOT = 54;                 // 액자 한 변
    var MARK = "data-frame";       // 이미 끼운 줄 표시

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    // 54px 칸에 1080px 원본을 내려받을 이유가 없다
    function thumbOf(photo) {
        if (!photo) return "";
        return (typeof window.photoThumb === "function") ? window.photoThumb(photo) : photo.url;
    }

    function achievedIds() {
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        return raw.map(function (a) { return typeof a === "string" ? a : (a && a.id); })
                  .filter(Boolean);
    }

    function achievedDate(id) {
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        for (var i = 0; i < raw.length; i++) {
            if (raw[i] && raw[i].id === id && raw[i].date) return raw[i].date;
        }
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    // onclick 문자열에서 항목 ID 를 꺼낸다
    function idOf(row) {
        var oc = row.getAttribute("onclick") || "";
        var m = oc.match(/toggleMilestone\(\s*['"]([^'"]+)['"]/);
        return m ? m[1] : null;
    }

    /* ---------- 액자 한 칸 ---------- */

    function frame(id, done) {
        var photo = (typeof window.getMilestonePhoto === "function") ? window.getMilestonePhoto(id) : null;
        var voice = (typeof window.getMilestoneVoice === "function") ? window.getMilestoneVoice(id) : null;

        var box = document.createElement("div");
        box.setAttribute(MARK, "1");
        box.style.cssText = "position:relative; width:" + SLOT + "px; height:" + SLOT + "px; " +
            "flex-shrink:0; margin-left:10px; border-radius:12px; overflow:hidden;";

        if (photo) {
            box.style.background = "var(--bg-sub)";
            box.innerHTML = '<img src="' + esc(thumbOf(photo.photo)) + '" loading="lazy" alt="" ' +
                'style="width:100%; height:100%; object-fit:cover; display:block;">';
            // addMilestonePhoto 는 사진이 이미 있으면 뷰어를 연다
            box.onclick = function (e) {
                e.stopPropagation();
                if (typeof window.addMilestonePhoto === "function") {
                    window.addMilestonePhoto(photo.key, id);
                }
            };

        } else if (done) {
            // 도장은 찍혔는데 사진이 없는 칸. 여기가 제일 일을 많이 한다.
            box.style.cssText += "border:1px dashed rgba(190,18,60,0.35); background:rgba(255,255,255,0.5); " +
                "display:flex; align-items:center; justify-content:center; cursor:pointer;";
            box.innerHTML = '<span style="font-size:17px; font-weight:300; color:#BE123C; opacity:0.6; line-height:1;">+</span>';
            box.onclick = function (e) {
                e.stopPropagation();
                if (typeof window.addMilestonePhoto === "function") {
                    window.addMilestonePhoto(achievedDate(id), id);
                }
            };

        } else {
            // 아직 오지 않은 순간. 비어 있는 채로 보여주는 게 목적이다.
            box.style.cssText += "border:1px dashed var(--border); background:transparent; opacity:0.5;";
        }

        // 소리가 붙어 있으면 모서리에 표시
        if (voice) {
            var dot = document.createElement("span");
            dot.style.cssText = "position:absolute; right:3px; bottom:3px; width:17px; height:17px; " +
                "border-radius:50%; background:#B98A2E; color:#FFF; font-size:8px; " +
                "display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.25);";
            dot.textContent = "▶";
            dot.onclick = function (e) {
                e.stopPropagation();
                if (typeof window.playVoice === "function") window.playVoice(voice.key, voice.voice.id);
            };
            box.appendChild(dot);
        }

        return box;
    }

    /* ---------- 다 그려진 목록에 액자를 끼운다 ---------- */

    function decorate() {
        var rows = document.querySelectorAll("#milestone-list-container .milestone-item");
        if (!rows.length) return;

        var done = achievedIds();

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.querySelector("[" + MARK + "]")) continue;      // 이미 끼웠다

            var id = idOf(row);
            if (!id) continue;

            // 체크마크 칸 바로 앞에 넣는다
            var stamp = row.lastElementChild;
            row.insertBefore(frame(id, done.indexOf(id) > -1), stamp);
        }

        countLine(done.length);
    }

    // 맨 위 카운터에 사진 장수를 같이 적는다
    function countLine(doneN) {
        var el = document.getElementById("milestone-counter");
        if (!el) return;
        var n = (typeof window.milestonePhotoCount === "function") ? window.milestonePhotoCount() : 0;
        var total = 0;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) total = MILESTONE_DATA.length; } catch (e) {}
        if (!total) total = (window.MILESTONE_DATA || []).length || 100;

        el.innerHTML = doneN + ' / ' + total + ' 달성' +
            '<span style="margin-left:8px; font-weight:700; opacity:0.7;">· 사진 ' + n + '장</span>';
    }

    /* ---------- 기존 함수에 얹기 ---------- */

    function hook(name) {
        var orig = window[name];
        if (typeof orig !== "function" || orig.__framed) return;
        var wrapped = function () {
            var out = orig.apply(this, arguments);
            setTimeout(decorate, 30);
            setTimeout(decorate, 250);      // 늦게 그려지는 경우까지
            return out;
        };
        wrapped.__framed = true;
        window[name] = wrapped;
    }

    function boot() {
        hook("openMilestoneModal");
        hook("toggleMilestone");

        // 사진·소리를 담고 돌아왔을 때도 액자가 채워지게
        setInterval(function () {
            var sheet = document.getElementById("milestone-bottom-sheet");
            if (sheet && sheet.classList.contains("show")) decorate();
        }, 1500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    window.refreshMilestoneFrames = decorate;

    /* ---------- 점검용 ---------- */
    window.frameDebug = function () {
        var done = achievedIds();
        var withPhoto = (typeof window.milestonePhotoCount === "function") ? window.milestonePhotoCount() : 0;
        console.log("도장 찍은 항목:", done.length + "개");
        console.log("사진 붙은 항목:", withPhoto + "개");
        console.log("도장은 찍혔는데 사진이 빈 칸:", Math.max(0, done.length - withPhoto) + "개");
        console.log("아직 오지 않은 순간:", document.querySelectorAll("#milestone-list-container .milestone-item").length - done.length + "개");
    };
})();