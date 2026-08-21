/* ============================================================
   배냇함 — 추억 엽서 (postcard.js)

   기존 엽서는 가운데가 텅 비어 있었다.
   비어 있던 게 아니라, 거기가 사진 자리였다.

   바뀌는 것 세 가지
     1. 사진이 엽서에 박힌다
     2. 마지막에 찍은 항목이 아니라, 고른 항목이 나온다
     3. 배냇함 사진도 엽서로 저장된다

   index.html 에서 home.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var W = 1080, H = 1440;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리아기"; }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function milestoneList() {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        return list || window.MILESTONE_DATA || [];
    }

    function achieved() {
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        var ids = [], dates = {};
        raw.forEach(function (a) {
            if (typeof a === "string") ids.push(a);
            else if (a && a.id) { ids.push(a.id); if (a.date) dates[a.id] = a.date; }
        });
        return { ids: ids, dates: dates };
    }

    function prettyDate(str) {
        if (!str) return "";
        var p = String(str).split("-");
        if (p.length !== 3) return String(str);
        return p[0] + ". " + p[1] + ". " + p[2];
    }

    function ddayText(dateStr) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return "";
        var b = new Date(s + "T00:00:00").getTime();
        var t = dateStr ? new Date(dateStr + "T00:00:00").getTime() : Date.now();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / 86400000);
        return n >= 0 ? "생후 " + n + "일의 기록" : "";
    }

    /* ---------- 사진을 캔버스에 안전하게 옮기기 ----------
       스토리지 URL 을 그대로 html2canvas 에 넘기면 CORS 설정에 따라
       캔버스가 오염돼 저장이 통째로 실패한다. 미리 한 번 그려보고
       안 되면 사진 없이라도 엽서는 나오게 한다. -------- */

    function toDataUrl(url) {
        return new Promise(function (resolve) {
            if (!url) return resolve(null);
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                try {
                    var side = Math.min(img.naturalWidth, img.naturalHeight);   // 정사각으로 가운데 크롭
                    var c = document.createElement("canvas");
                    c.width = c.height = Math.min(side, 900);
                    c.getContext("2d").drawImage(
                        img,
                        (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
                        0, 0, c.width, c.height
                    );
                    resolve(c.toDataURL("image/jpeg", 0.9));
                } catch (e) {
                    console.warn("[엽서] 사진을 옮기지 못했어요 (CORS)", e);
                    resolve(null);
                }
            };
            img.onerror = function () { resolve(null); };
            img.src = url;
        });
    }

    /* ---------- 사진 구해오기 ----------
       1) 이 기기에 캐시된 원본  → CORS 무관, 항상 된다
       2) 없으면 스토리지 URL   → 버킷에 CORS 가 열려 있어야 한다 -------- */

    async function photoOf(p) {
        if (!p) return null;
        if (typeof window.getCachedPhotoData === "function") {
            try {
                var cached = await window.getCachedPhotoData(p.id);
                if (cached) {
                    var fromCache = await toDataUrl(cached);
                    if (fromCache) return fromCache;
                }
            } catch (e) {}
        }
        return await toDataUrl(p.url);
    }

    /* ---------- 엽서 판 ---------- */

    function buildCard(o) {
        // o = { badge, title, desc, dateText, ddayText, photo, caption }
        var photoBlock = o.photo
            ? '<div style="margin:0 auto; width:760px; height:760px; border-radius:10px; overflow:hidden; background:#F1ECE8;">' +
                  '<img src="' + o.photo + '" style="width:100%; height:100%; object-fit:cover; display:block;">' +
              '</div>'
            : '<div style="width:1px; height:80px; background:#E8E3DD; margin:0 auto;"></div>';

        // 사진이 있으면 제목을 줄여 균형을 맞춘다
        var titleSize = o.photo ? 52 : 72;
        var gapTop    = o.photo ? 44 : 40;

        return '' +
        '<div style="width:100%; height:100%; background:linear-gradient(145deg,#FFFFFF 40%,#FFF0F2 100%); border-radius:8px; padding:70px 60px; box-sizing:border-box; display:flex; flex-direction:column;">' +

            '<div style="text-align:center;">' +
                '<div style="font-family:sans-serif; font-size:14px; font-weight:600; color:#C4B5A9; letter-spacing:8px; margin-bottom:26px;">MY PRECIOUS BABY</div>' +
                '<div style="font-size:30px; font-weight:400; color:#8C827A; font-family:\'Gowun Batang\',serif; letter-spacing:-1px;">' + esc(babyName()) + '의 배냇함에 보관된</div>' +
                (o.badge ? '<div style="font-size:34px; font-weight:700; color:#E5989B; font-family:\'Gowun Batang\',serif; letter-spacing:-1px; margin-top:12px;">' + esc(o.badge) + '</div>' : '') +
            '</div>' +

            '<div style="margin:' + gapTop + 'px 0 auto;">' + photoBlock + '</div>' +

            '<div style="text-align:center; margin:' + gapTop + 'px 0 auto;">' +
                '<h1 style="font-family:\'Gowun Batang\',serif; font-size:' + titleSize + 'px; font-weight:700; color:#5A4D44; margin:0 0 22px; line-height:1.3; letter-spacing:-2px; word-break:keep-all;">' + esc(o.title) + '</h1>' +
                (o.desc ? '<p style="font-size:24px; font-weight:400; color:#9A8F86; line-height:1.7; margin:0; padding:0 40px; word-break:keep-all;">' + esc(o.desc) + '</p>' : '') +
                (o.caption ? '<p style="font-family:\'Nanum Pen Script\',cursive; font-size:38px; color:#7A6F68; line-height:1.5; margin:26px 0 0; padding:0 40px; word-break:keep-all;">' + esc(o.caption) + '</p>' : '') +
            '</div>' +

            '<div style="margin-top:auto; border-top:1px solid #F0EBE6; padding-top:32px; display:flex; justify-content:space-between; align-items:flex-end;">' +
                '<div>' +
                    '<div style="font-size:15px; font-weight:600; color:#C4B5A9; margin-bottom:10px; letter-spacing:2px;">DATE</div>' +
                    '<div style="font-size:25px; font-weight:600; color:#7A6F68;">' + esc(o.dateText) +
                        (o.ddayText ? ' <span style="font-size:19px; font-weight:400; color:#E5989B; font-family:\'Gowun Batang\',serif;">· ' + esc(o.ddayText) + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<div style="font-size:13px; font-weight:600; color:#C4B5A9; letter-spacing:3px; margin-bottom:10px;">기록의 완성</div>' +
                    '<div style="font-size:27px; font-weight:700; color:#7A6F68; letter-spacing:-1px; font-family:\'Gowun Batang\',serif;">배냇함</div>' +
                '</div>' +
            '</div>' +

        '</div>';
    }

    /* ---------- 굽기 ----------
       예전에는 <a download> 하나로 끝냈다. PC 에서는 되지만
       아이폰 사파리와 홈 화면 PWA 에서는 download 속성이 무시된다.
       그래서 파형 엽서와 같은 방식으로 바꿨다 — 캔버스를 파일로 만들어
       기기의 공유 시트에 태운다. 안 되는 기기에서만 예전 방식으로 내린다. -------- */

    function bake(o, filename) {
        if (typeof html2canvas === "undefined") {
            return toast("이미지 저장 라이브러리를 불러오지 못했어요");
        }

        var stage = document.createElement("div");
        stage.style.cssText =
            "position:fixed; top:0; left:0; width:" + W + "px; height:" + H + "px; " +
            "background:#F8F6F4; padding:60px; box-sizing:border-box; " +
            "font-family:'Pretendard',sans-serif; z-index:-9999; pointer-events:none;";
        stage.innerHTML = buildCard(o);
        document.body.appendChild(stage);

        toast("엽서를 굽고 있어요…");

        setTimeout(function () {
            html2canvas(stage, { scale: 1, backgroundColor: "#F8F6F4", useCORS: true, logging: false })
            .then(function (canvas) {

                // 예전 방식 (PC · 구형 브라우저)
                var fallback = function () {
                    var link = document.createElement("a");
                    link.download = filename;
                    link.href = canvas.toDataURL("image/png");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast("💌 저장했어요");
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
                                    ? "엽서가 완성되었어요!<br><span style='font-size:12px;color:#A3958A;'>아이폰은 창이 뜨면 \'이미지 저장\'을 눌러주세요.</span>"
                                    : "엽서가 완성되었어요!<br><span style='font-size:12px;color:#A3958A;'>가족에게 바로 보낼 수 있어요.</span>",
                                    function () {
                                        navigator.share({ files: [file], title: babyName() + "의 추억 엽서" }).catch(function () {});
                                    }, "💌", "저장 및 공유하기", "#B98A2E"
                                );
                            } else {
                                navigator.share({ files: [file], title: babyName() + "의 추억 엽서" }).catch(function () {});
                            }
                        } else {
                            fallback();
                        }
                    } finally {
                        stage.remove();
                    }
                }, "image/png");
            })
            .catch(function (err) {
                console.error("[엽서] 굽기 실패", err);
                stage.remove();
                toast("저장 중 문제가 생겼어요");
            });
        }, 400);
    }

    /* ---------- 1. 도감 엽서 ----------
       msId 를 주면 그 항목, 안 주면 마지막에 찍은 항목. -------- */

    window.downloadMilestone = async function (msId) {
        var a = achieved();
        if (!a.ids.length) return toast("아직 배냇함에 담긴 첫 순간이 없어요");

        var id = msId || a.ids[a.ids.length - 1];
        var item = milestoneList().find(function (m) { return m.id === id; });
        if (!item) return toast("도감 정보를 불러오지 못했어요");

        var rank = a.ids.indexOf(id) + 1;
        var date = a.dates[id] || new Date().toISOString().split("T")[0];

        var found = (typeof window.getMilestonePhoto === "function") ? window.getMilestonePhoto(id) : null;
        var photo = found ? await photoOf(found.photo) : null;
        if (found && !photo) toast("사진을 못 불러와서 엽서만 만들었어요");

        bake({
            badge: rank > 0 ? rank + "번째 기적" : "",
            title: item.title,
            desc: item.desc,
            caption: found ? (found.photo.caption || "") : "",
            dateText: prettyDate(date),
            ddayText: ddayText(date),
            photo: photo
        }, babyName() + "_" + item.title + "_추억엽서.png");
    };

    /* ---------- 2. 배냇함 사진 엽서 ---------- */

    window.downloadPhotoCard = async function (key, photoId) {
        if (typeof window.getDayPhotos !== "function") return;
        var p = window.getDayPhotos(key).filter(function (x) { return x.id === photoId; })[0];
        if (!p) return toast("사진을 찾지 못했어요");

        var title = "", desc = "";
        if (p.msId) {
            var item = milestoneList().find(function (m) { return m.id === p.msId; });
            if (item) { title = item.title; desc = item.desc; }
        }
        if (!title) title = prettyDate(key);

        var photo = await photoOf(p);
        if (!photo) return toast("사진을 옮기지 못했어요. 이 기기에서 담은 사진인지 확인해 주세요");

        bake({
            badge: "",
            title: title,
            desc: p.msId ? desc : "",
            caption: p.caption || "",
            dateText: prettyDate(key),
            ddayText: ddayText(key),
            photo: photo
        }, babyName() + "_" + title + "_추억엽서.png");
    };
})();