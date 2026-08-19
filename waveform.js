/* ============================================================
   육아메이트 — 소리의 모양 (waveform.js)

   포토북 목소리 장에 이렇게 써뒀었다. "종이에는 담기지 않는 것".
   파형이 그 문장을 깬다.

   첫 웃음소리를 종이로 가져갈 수 있는 유일한 방법이고,
   해외에서 커스텀 사운드웨이브 액자가 실제로 팔리는 이유다.

   파형은 녹음할 때 한 번만 계산해서 숫자 120개로 저장한다.
   400바이트짜리다. 그림은 그걸로 매번 다시 그린다.

   index.html 에서 voice.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var BARS = 120;
    var GOLD = "#B98A2E";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function pretty(k) {
        var p = String(k).split("-");
        return p[0] + ". " + p[1] + ". " + p[2];
    }

    function ddayText(k) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return "";
        var b = new Date(s + "T00:00:00").getTime();
        var p = String(k).split("-");
        var t = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / 86400000);
        return n >= 0 ? "생후 " + n + "일의 소리" : "";
    }

    function msTitle(id) {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        list = list || window.MILESTONE_DATA || [];
        var m = list.filter(function (x) { return x.id === id; })[0];
        return m ? m.title : "";
    }

    /* ---------- 소리에서 모양 뽑기 ----------
       채널 데이터를 120 덩어리로 잘라 각 덩어리의 평균 진폭을 낸다.
       0~100 정수 120개. JSON 으로 400바이트쯤. -------- */

    window.peaksFrom = async function (blobOrUrl) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;

        var ctx = new AC();
        try {
            var buf;
            if (blobOrUrl instanceof Blob) {
                buf = await blobOrUrl.arrayBuffer();
            } else {
                var res = await fetch(blobOrUrl);
                buf = await res.arrayBuffer();
            }

            var audio = await new Promise(function (ok, no) {
                // 사파리는 콜백 방식만 받는 버전이 있다
                var p = ctx.decodeAudioData(buf, ok, no);
                if (p && p.then) p.then(ok, no);
            });

            var data = audio.getChannelData(0);
            var block = Math.max(1, Math.floor(data.length / BARS));
            var raw = [];
            for (var i = 0; i < BARS; i++) {
                var sum = 0, n = 0;
                for (var j = 0; j < block; j++) {
                    var idx = i * block + j;
                    if (idx >= data.length) break;
                    sum += Math.abs(data[idx]); n++;
                }
                raw.push(n ? sum / n : 0);
            }
            var max = Math.max.apply(null, raw) || 1;
            return raw.map(function (v) { return Math.round((v / max) * 100); });
        } catch (e) {
            console.warn("[파형] 계산 실패", e);
            return null;
        } finally {
            try { ctx.close(); } catch (e) {}
        }
    };

    // 저장된 게 있으면 그걸 쓰고, 없으면 한 번 계산해서 넣어둔다
    window.voicePeaks = async function (key, id) {
        var v = (typeof window.getDayVoices === "function")
            ? window.getDayVoices(key).filter(function (x) { return x.id === id; })[0] : null;
        if (!v) return null;
        if (Array.isArray(v.peaks) && v.peaks.length) return v.peaks;

        var p = await window.peaksFrom(v.url);
        if (p && typeof window.attachVoicePeaks === "function") window.attachVoicePeaks(key, id, p);
        return p;
    };

    /* ---------- 그리기 ---------- */

    // opts = { w, h, color, gap, round, min }
    window.renderWave = function (peaks, opts) {
        opts = opts || {};
        var w = opts.w || 300, h = opts.h || 56;
        var color = opts.color || GOLD;
        var gap = opts.gap == null ? 1.5 : opts.gap;
        var min = opts.min == null ? 2 : opts.min;

        if (!peaks || !peaks.length) {
            return '<div style="width:' + w + 'px; height:' + h + 'px;"></div>';
        }

        var n = peaks.length;
        var bw = (w - gap * (n - 1)) / n;
        var mid = h / 2;
        var bars = "";

        for (var i = 0; i < n; i++) {
            var bh = Math.max(min, (peaks[i] / 100) * h);
            var x = i * (bw + gap);
            var y = mid - bh / 2;
            bars += '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) +
                    '" width="' + bw.toFixed(2) + '" height="' + bh.toFixed(2) +
                    '" rx="' + (bw / 2).toFixed(2) + '" fill="' + color + '"/>';
        }

        return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" ' +
            'preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">' +
            bars + '</svg>';
    };

    // 아직 계산 안 된 파형을 뒤늦게 채워 넣는다
    window.paintWaveLater = function (elId, key, id, opts) {
        setTimeout(async function () {
            var el = document.getElementById(elId);
            if (!el) return;
            var p = await window.voicePeaks(key, id);
            var el2 = document.getElementById(elId);
            if (el2 && p) el2.innerHTML = window.renderWave(p, opts);
        }, 60);
    };

    /* ---------- 파형 엽서 (모바일 다운로드/공유 완벽 호환 패치 🚀) ---------- */

    window.downloadWaveCard = async function (key, id) {
        if (typeof html2canvas === "undefined") return toast("이미지 저장 도구를 불러오지 못했어요");

        var v = (typeof window.getDayVoices === "function")
            ? window.getDayVoices(key).filter(function (x) { return x.id === id; })[0] : null;
        if (!v) return toast("소리를 찾지 못했어요");

        toast("파형을 그리는 중이에요… 🎨");
        var peaks = await window.voicePeaks(key, id);
        if (!peaks) return toast("파형을 만들지 못했어요");

        var title = v.msId ? (msTitle(v.msId) || "목소리") : (v.note || "그날의 소리");
        var W = 1080, H = 1440;

        var stage = document.createElement("div");
        stage.style.cssText =
            "position:fixed; top:0; left:0; width:" + W + "px; height:" + H + "px; " +
            "background:#F8F6F4; padding:60px; box-sizing:border-box; " +
            "font-family:'Pretendard',sans-serif; z-index:-9999; pointer-events:none;";

        stage.innerHTML =
        '<div style="width:100%; height:100%; background:linear-gradient(160deg,#FFFFFF 35%,#FDF6E8 100%); ' +
            'border-radius:8px; padding:90px 70px; box-sizing:border-box; display:flex; flex-direction:column; text-align:center;">' +

            '<div style="font-family:sans-serif; font-size:14px; font-weight:600; color:#C4B5A9; letter-spacing:8px; margin-bottom:30px;">' +
                'MY PRECIOUS BABY</div>' +

            '<div style="font-size:28px; font-weight:400; color:#8C827A; font-family:\'Gowun Batang\',serif; letter-spacing:-1px;">' +
                esc(babyName()) + '의 목소리</div>' +

            '<div style="margin:auto 0;">' +
                '<div style="width:100%;">' +
                    window.renderWave(peaks, { w: 900, h: 300, color: "#C69A3C", gap: 2.4, min: 4 }) +
                '</div>' +
                '<div style="font-size:22px; font-weight:600; color:#C4B5A9; letter-spacing:4px; margin-top:34px;">' +
                    Math.floor((v.sec || 0) / 60) + ':' + String((v.sec || 0) % 60).padStart(2, "0") + '</div>' +
            '</div>' +

            '<div style="margin:auto 0;">' +
                '<h1 style="font-family:\'Gowun Batang\',serif; font-size:54px; font-weight:700; color:#5A4D44; ' +
                    'margin:0; letter-spacing:-2px; line-height:1.35; word-break:keep-all;">' + esc(title) + '</h1>' +
                (v.msId && v.note
                    ? '<p style="font-family:\'Nanum Pen Script\',cursive; font-size:38px; color:#7A6F68; margin:26px 0 0; line-height:1.5;">' + esc(v.note) + '</p>'
                    : '') +
            '</div>' +

            '<div style="margin-top:auto; border-top:1px solid #F0EBE6; padding-top:32px; display:flex; justify-content:space-between; align-items:flex-end; text-align:left;">' +
                '<div>' +
                    '<div style="font-size:15px; font-weight:600; color:#C4B5A9; margin-bottom:10px; letter-spacing:2px;">DATE</div>' +
                    '<div style="font-size:25px; font-weight:600; color:#7A6F68;">' + esc(pretty(key)) +
                        ' <span style="font-size:19px; font-weight:400; color:' + GOLD + '; font-family:\'Gowun Batang\',serif;">· ' + esc(ddayText(key)) + '</span></div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<div style="font-size:13px; font-weight:600; color:#C4B5A9; letter-spacing:3px; margin-bottom:10px;">소리의 모양</div>' +
                    '<div style="font-size:27px; font-weight:700; color:#7A6F68; letter-spacing:-1px; font-family:\'Gowun Batang\',serif;">육아메이트</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        document.body.appendChild(stage);

        setTimeout(function () {
            html2canvas(stage, { scale: 1, backgroundColor: "#F8F6F4", useCORS: true, logging: false })
            .then(function (canvas) {
                // 🚨 캔버스를 덩어리(Blob)로 변환해서 모바일 브라우저 공유 기능에 태움
                canvas.toBlob(function(blob) {
                    var fileName = babyName() + "_" + title + "_소리엽서.png";
                    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    var file = new File([blob], fileName, { type: "image/png" });
                    
                    // 🚨 모바일 공유 기능(Web Share API) 지원 여부 확인
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        if (typeof window.showConfirm === "function") {
                            window.showConfirm(
                                isIOS 
                                ? "엽서가 완성되었어요!<br><span style='font-size:12px;color:#8B95A1;'>아이폰은 창이 뜨면 '이미지 저장'을 눌러주세요.</span>"
                                : "엽서가 완성되었습니다!<br><span style='font-size:12px;color:#8B95A1;'>가족들에게 바로 공유하시겠어요?</span>",
                                function() {
                                    navigator.share({ files: [file], title: '우리아기 소리 엽서' }).catch(function(){});
                                }, "💌", "저장 및 공유하기", "#B98A2E" // 골드 색상으로 럭셔리하게
                            );
                        } else {
                            navigator.share({ files: [file], title: '우리아기 소리 엽서' }).catch(function(){});
                        }
                    } else {
                        // PC나 구형 브라우저를 위한 기존 다운로드 방식 유지
                        var a = document.createElement("a");
                        a.download = fileName;
                        a.href = canvas.toDataURL("image/png");
                        document.body.appendChild(a); 
                        a.click(); 
                        document.body.removeChild(a);
                        toast("🎵 갤러리에 저장했어요");
                    }
                    stage.remove(); // 다 썼으면 청소
                });
            })
            .catch(function (e) {
                console.error("[파형 엽서] 실패", e);
                stage.remove();
                toast("저장 중 문제가 생겼어요");
            });
        }, 400);
    };

    /* ---------- 점검용 ---------- */
    window.waveDebug = async function (key, id) {
        var p = await window.voicePeaks(key, id);
        console.log("파형 막대 수:", p ? p.length : 0);
        console.log("최대값:", p ? Math.max.apply(null, p) : "-");
        return p;
    };
})();