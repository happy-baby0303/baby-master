/* ============================================================
   배냇함 — 이달의 카드 (monthcard.js)

   엽서는 사진 한 장짜리다. 그건 그 순간을 담는다.
   그런데 부모가 인스타에 올리고 싶은 건 한 달이다.
   "5개월 정리" 라고 손으로 만드는 사람들이 실제로 있다.

   타임라인 월 헤더에 버튼 하나만 붙인다.
     8월 · 생후 5개월                    [카드]  31일 ›

   누르면 그 달의 사진 넉 장, 처음 해낸 일, 담긴 것들이
   정사각형 한 장으로 구워진다. 인스타에 그대로 올라간다.

   memorybox.js 는 한 줄도 안 고친다. 다 그려진 뒤에 버튼만 얹는다.

   index.html 에서 newbadge.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var S = 1080;                 // 정사각형. 인스타 기본.
    var GOLD = "#B98A2E";
    var BTN_MARK = "data-monthcard";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }
    function pad(n) { return String(n).padStart(2, "0"); }

    function birthTime() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var t = new Date(s + "T00:00:00").getTime();
        return isNaN(t) ? null : t;
    }

    function ageLabel(year, month) {
        var b = birthTime();
        if (!b) return "";
        var end = new Date(year, month, 0).getTime();      // 그 달 마지막 날
        var days = Math.floor((end - b) / 86400000);
        if (days < 0) return "";
        if (days < 31) return "태어난 달";
        return "생후 " + Math.floor(days / 30.436875) + "개월";
    }

    /* ---------- 그 달에 뭐가 있었나 ---------- */

    function inMonth(key, year, month) {
        var p = String(key).split("-");
        return Number(p[0]) === year && Number(p[1]) === month;
    }

    function gather(year, month) {
        var photos = [], voices = 0, notes = 0, firsts = [];

        if (typeof window.photoDays === "function") {
            window.photoDays().sort().forEach(function (k) {
                if (!inMonth(k, year, month)) return;
                (window.getDayPhotos(k) || []).forEach(function (p) { photos.push({ key: k, p: p }); });
            });
        }
        if (typeof window.voiceDays === "function") {
            window.voiceDays().forEach(function (k) {
                if (inMonth(k, year, month)) voices += (window.getDayVoices(k) || []).length;
            });
        }
        if (typeof window.noteDays === "function") {
            window.noteDays().forEach(function (k) {
                if (inMonth(k, year, month)) notes += (window.getDayNotes(k) || []).length;
            });
        }

        // 그 달에 도장 찍은 도감
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        list = list || window.MILESTONE_DATA || [];

        raw.forEach(function (a) {
            if (!a || typeof a === "string" || !a.date) return;
            var d = String(a.date).replace(/\.\s*/g, "-").replace(/-$/, "");
            if (!inMonth(d, year, month)) return;
            var m = list.filter(function (x) { return x.id === a.id; })[0];
            if (m) firsts.push(m.title);
        });

        return { photos: photos, voices: voices, notes: notes, firsts: firsts };
    }

    /* ---------- 사진을 캔버스에 안전하게 옮기기 ----------
       postcard.js 와 같은 방식. 이 기기 캐시가 먼저, 없으면 스토리지. -------- */

    function toDataUrl(url) {
        return new Promise(function (resolve) {
            if (!url) return resolve(null);
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                try {
                    var side = Math.min(img.naturalWidth, img.naturalHeight);
                    var c = document.createElement("canvas");
                    c.width = c.height = Math.min(side, 700);
                    c.getContext("2d").drawImage(
                        img,
                        (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
                        0, 0, c.width, c.height
                    );
                    resolve(c.toDataURL("image/jpeg", 0.88));
                } catch (e) { resolve(null); }
            };
            img.onerror = function () { resolve(null); };
            img.src = url;
        });
    }

    async function photoOf(p) {
        if (typeof window.getCachedPhotoData === "function") {
            try {
                var cached = await window.getCachedPhotoData(p.id);
                if (cached) {
                    var d = await toDataUrl(cached);
                    if (d) return d;
                }
            } catch (e) {}
        }
        return await toDataUrl(p.url);
    }

    /* ---------- 카드 판 ---------- */

    function buildCard(o) {
        // 사진 넉 장이 2×2. 없으면 그 자리를 비워둔다.
        var cells = "";
        for (var i = 0; i < 4; i++) {
            var src = o.shots[i];
            cells += src
                ? '<div style="background:#F1ECE8; overflow:hidden;">' +
                      '<img src="' + src + '" style="width:100%; height:100%; object-fit:cover; display:block;">' +
                  '</div>'
                : '<div style="background:#F7F3ED;"></div>';
        }

        var firstLine = o.firsts.length
            ? o.firsts.slice(0, 3).join("  ·  ") + (o.firsts.length > 3 ? "  외 " + (o.firsts.length - 3) + "가지" : "")
            : "";

        var bits = [];
        if (o.photoN) bits.push("사진 " + o.photoN);
        if (o.voices) bits.push("소리 " + o.voices);
        if (o.notes)  bits.push("한 줄 " + o.notes);

        return '' +
        '<div style="width:100%; height:100%; background:linear-gradient(160deg,#FFFFFF 40%,#FDF6E8 100%); ' +
            'padding:64px 58px; box-sizing:border-box; display:flex; flex-direction:column;">' +

            '<div style="text-align:center;">' +
                '<div style="font-family:sans-serif; font-size:13px; font-weight:600; color:#C4B5A9; ' +
                    'letter-spacing:7px; margin-bottom:20px;">MY PRECIOUS BABY</div>' +
                '<div style="font-family:\'Gowun Batang\',serif; font-size:44px; font-weight:700; color:#5A4D44; ' +
                    'letter-spacing:-2px; line-height:1.25;">' + esc(o.title) + '</div>' +
                (o.age ? '<div style="font-size:21px; font-weight:400; color:' + GOLD + '; ' +
                    'font-family:\'Gowun Batang\',serif; margin-top:8px;">' + esc(o.age) + '</div>' : '') +
            '</div>' +

            '<div style="margin:34px 0 auto; display:grid; grid-template-columns:1fr 1fr; ' +
                'gap:8px; border-radius:12px; overflow:hidden; aspect-ratio:1/1;">' + cells + '</div>' +

            (firstLine
                ? '<div style="margin-top:28px; text-align:center;">' +
                      '<div style="font-size:13px; font-weight:600; color:#C4B5A9; letter-spacing:3px; margin-bottom:9px;">' +
                          '이 달에 처음 해낸 일</div>' +
                      '<div style="font-family:\'Gowun Batang\',serif; font-size:26px; font-weight:700; ' +
                          'color:#5A4D44; line-height:1.45; word-break:keep-all;">' + esc(firstLine) + '</div>' +
                  '</div>'
                : '') +

            '<div style="margin-top:auto; padding-top:28px; border-top:1px solid #F0EBE6; ' +
                'display:flex; justify-content:space-between; align-items:flex-end;">' +
                '<div style="font-size:20px; font-weight:600; color:#7A6F68;">' +
                    esc(bits.join("   ·   ")) + '</div>' +
                '<div style="font-family:\'Gowun Batang\',serif; font-size:22px; font-weight:700; ' +
                    'color:#7A6F68; letter-spacing:-1px;">배냇함</div>' +
            '</div>' +

        '</div>';
    }

    /* ---------- 굽기 ----------
       postcard.js 와 같은 방식. 아이폰은 공유 시트, PC 는 내려받기. -------- */

    function bake(html, filename) {
        if (typeof html2canvas === "undefined") return toast("이미지 도구를 불러오지 못했어요");

        var stage = document.createElement("div");
        stage.style.cssText =
            "position:fixed; top:0; left:0; width:" + S + "px; height:" + S + "px; " +
            "background:#F8F6F4; box-sizing:border-box; " +
            "font-family:'Pretendard',sans-serif; z-index:-9999; pointer-events:none;";
        stage.innerHTML = html;
        document.body.appendChild(stage);

        toast("카드를 굽고 있어요…");

        setTimeout(function () {
            html2canvas(stage, { scale: 1, backgroundColor: "#F8F6F4", useCORS: true, logging: false })
            .then(function (canvas) {
                var fallback = function () {
                    var a = document.createElement("a");
                    a.download = filename;
                    a.href = canvas.toDataURL("image/png");
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    toast("이달의 카드를 저장했어요");
                };

                if (!canvas.toBlob) { fallback(); stage.remove(); return; }

                canvas.toBlob(function (blob) {
                    try {
                        if (!blob) { fallback(); return; }
                        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                                    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
                        var file = new File([blob], filename, { type: "image/png" });

                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            if (typeof window.showConfirm === "function") {
                                window.showConfirm(
                                    isIOS
                                    ? "이달의 카드가 완성됐어요!<br><span style='font-size:12px;color:#A3958A;'>창이 뜨면 '이미지 저장'을 눌러주세요.</span>"
                                    : "이달의 카드가 완성됐어요!<br><span style='font-size:12px;color:#A3958A;'>바로 올리거나 보낼 수 있어요.</span>",
                                    function () {
                                        navigator.share({ files: [file], title: babyName() + "의 한 달" }).catch(function () {});
                                    }, "📸", "저장 및 공유하기", GOLD
                                );
                            } else {
                                navigator.share({ files: [file], title: babyName() + "의 한 달" }).catch(function () {});
                            }
                        } else fallback();
                    } finally { stage.remove(); }
                }, "image/png");
            })
            .catch(function (e) {
                console.error("[이달의 카드] 실패", e);
                stage.remove();
                toast("저장 중 문제가 생겼어요");
            });
        }, 420);
    }

    /* ---------- 바깥에서 부르는 문 ---------- */

    window.downloadMonthCard = async function (year, month) {
        year = Number(year); month = Number(month);

        var g = gather(year, month);
        if (!g.photos.length && !g.firsts.length && !g.voices && !g.notes) {
            return toast("이 달엔 아직 담긴 게 없어요");
        }

        toast("사진을 모으는 중이에요…");

        // 그 달에서 고르게 넉 장 뽑는다. 하루에 몰리지 않게.
        var picked = [], seenDay = {};
        for (var i = 0; i < g.photos.length && picked.length < 4; i++) {
            var it = g.photos[i];
            if (seenDay[it.key]) continue;
            seenDay[it.key] = 1;
            picked.push(it);
        }
        for (var j = 0; j < g.photos.length && picked.length < 4; j++) {
            if (picked.indexOf(g.photos[j]) === -1) picked.push(g.photos[j]);
        }

        var shots = [];
        for (var k = 0; k < picked.length; k++) {
            var d = await photoOf(picked[k].p);
            if (d) shots.push(d);
        }

        bake(buildCard({
            title: month + "월의 " + babyName(),
            age: ageLabel(year, month),
            shots: shots,
            photoN: g.photos.length,
            voices: g.voices,
            notes: g.notes,
            firsts: g.firsts
        }), babyName() + "_" + year + "년" + pad(month) + "월_카드.png");
    };

    /* ---------- 월 헤더에 버튼 얹기 ---------- */

    function paint() {
        var rows = document.querySelectorAll('[id^="mb-m-"]');

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.getAttribute(BTN_MARK)) continue;

            var ym = row.id.replace("mb-m-", "").split("-");
            var year = Number(ym[0]), month = Number(ym[1]);
            if (!year || !month) continue;

            var btn = document.createElement("span");
            btn.textContent = "카드";
            btn.style.cssText = "flex-shrink:0; margin-left:auto; margin-right:9px; " +
                "font-size:11px; font-weight:800; color:" + GOLD + "; " +
                "background:rgba(185,138,46,0.12); padding:5px 11px; border-radius:9px; cursor:pointer;";

            btn.onclick = function (e) {
                e.stopPropagation();          // 달 접기/펴기와 겹치지 않게
                var y = Number(this.getAttribute("data-y"));
                var m = Number(this.getAttribute("data-m"));
                window.downloadMonthCard(y, m);
            };
            btn.setAttribute("data-y", year);
            btn.setAttribute("data-m", month);

            // 오른쪽 '31일 ›' 앞에 끼운다
            var last = row.lastElementChild;
            if (last) row.insertBefore(btn, last);
            else row.appendChild(btn);

            row.setAttribute(BTN_MARK, "1");
        }
    }

    window.refreshMonthCardButtons = paint;

    /* ---------- 다시 그려도 따라가기 ---------- */

       function boot() {
        // 배냇함 탭이 열릴 때마다 확인한다.
        // 부팅 때 한두 번 재는 것만으로는, 그 순간 탭이 닫혀 있으면 영영 못 붙는다.
        setInterval(paint, 1200);

        setTimeout(paint, 1500);
        setTimeout(paint, 3500);

        var orig = window.renderMemoryBox;
        if (typeof orig === "function" && !orig.__monthcard) {
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                setTimeout(paint, 150);
                return out;
            };
            wrapped.__monthcard = true;
            window.renderMemoryBox = wrapped;
        }

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(paint, 300);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.monthCardDebug = function (year, month) {
        var d = new Date();
        year = year || d.getFullYear();
        month = month || (d.getMonth() + 1);
        var g = gather(year, month);
        console.log(year + "년 " + month + "월  (" + ageLabel(year, month) + ")");
        console.log("  사진:", g.photos.length + "장");
        console.log("  소리:", g.voices + "개");
        console.log("  한 줄:", g.notes + "줄");
        console.log("  처음 해낸 일:", g.firsts.length ? g.firsts.join(", ") : "없음");
        console.log("  버튼 붙은 달:", document.querySelectorAll("[" + BTN_MARK + "]").length + "개");
    };
})();