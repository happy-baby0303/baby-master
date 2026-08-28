/* ============================================================
   배냇함 — 소리 모아듣기 (voicereel.js)

   소리함은 목록이었다. 한 개씩 눌러야 들린다.
   그래서 아무도 두 번째를 안 누른다.

   그런데 이 앱에서 제일 센 순간은 하나짜리가 아니다.
   생후 30일의 소리 다음에 생후 200일의 소리가 바로 나오는 것,
   그게 부모를 울린다. 목소리는 사진과 달라서
   나란히 놓기 전에는 변한 걸 못 알아챈다.

   이어듣기는 쌓여야 값이 생긴다.
   하나 담은 사람에게는 아무 의미가 없고,
   1년 담은 사람에게는 다른 앱으로 못 옮기는 이유가 된다.

     무료 — '그때와 지금' 두 개 (첫 소리와 마지막 소리)
     플러스 — 처음부터 끝까지 전부

   맛보기를 첫 개와 마지막 개로 잡은 이유는,
   그 둘만 들어도 이 기능이 뭘 하는 건지 바로 알기 때문이다.
   최근 세 개를 들려주면 감동이 아니라 그냥 재생목록이다.

   voice.js 는 한 줄만 고친다 (재생 중지 함수 하나).
   나머지는 다 여기서 한다.

   index.html 에서 waveform.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var SHEET  = "voice-reel";
    var GOLD   = "#B98A2E";
    var PURPLE = "#7F77DD";
    var BARS_W = 600, BARS_H = 90;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }
    function pad(n) { return String(n).padStart(2, "0"); }

    function mmss(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        return Math.floor(sec / 60) + ":" + pad(sec % 60);
    }

    function longText(sec) {
        sec = Math.max(0, Math.round(sec || 0));
        var m = Math.floor(sec / 60), s = sec % 60;
        if (!m) return s + "초";
        return m + "분" + (s ? " " + s + "초" : "");
    }

    function isPro() {
        return (typeof window.isPremium === "function") ? !!window.isPremium() : false;
    }

    /* ---------- 날짜 ---------- */

    function pretty(key) {
        var p = String(key).split("-");
        return p[0] + ". " + Number(p[1]) + ". " + Number(p[2]);
    }

    function dday(key) {
        var s = localStorage.getItem("tosil_startDate");
        if (!s || !key) return "";
        var b = new Date(s + "T00:00:00").getTime();
        var t = new Date(String(key) + "T00:00:00").getTime();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / 86400000);
        return n >= 0 ? "생후 " + n + "일" : "";
    }

    function msTitle(id) {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        list = list || window.MILESTONE_DATA || [];
        var m = list.filter(function (x) { return x.id === id; })[0];
        return m ? m.title : "";
    }

    function titleOf(it) {
        var v = it.v;
        if (v.msId) return msTitle(v.msId) || "처음 해낸 일";
        if (v.note) return v.note;
        return "그날의 소리";
    }

    /* ---------- 목록 ----------
       오래된 것부터. 이어듣기의 감동은 순서가 만든다. -------- */

    function allVoices() {
        if (typeof window.voiceDays !== "function" || typeof window.getDayVoices !== "function") return [];
        var out = [];
        window.voiceDays().forEach(function (k) {
            (window.getDayVoices(k) || []).forEach(function (v) {
                if (v && v.url) out.push({ key: k, v: v });
            });
        });
        out.sort(function (a, b) {
            if (a.key !== b.key) return a.key < b.key ? -1 : 1;
            return (a.v.ts || 0) - (b.v.ts || 0);
        });
        return out;
    }

    // 무료는 첫 소리와 마지막 소리. 그 사이는 플러스.
    function playableIdx(list) {
        var all = list.map(function (x, i) { return i; });
        if (isPro() || list.length <= 2) return all;
        return [0, list.length - 1];
    }

    window.voiceReelCount = function () { return allVoices().length; };

    /* ---------- 파형 ----------
       waveform.js 는 한 가지 색만 그린다.
       여기서는 지나간 부분과 남은 부분을 나눠야 해서 직접 그린다. -------- */

    function waveSVG(peaks, color) {
        if (!peaks || !peaks.length) return "";
        var n = peaks.length, gap = 2;
        var bw = (BARS_W - gap * (n - 1)) / n;
        var mid = BARS_H / 2, bars = "";

        for (var i = 0; i < n; i++) {
            var bh = Math.max(3, (peaks[i] / 100) * BARS_H);
            var x = i * (bw + gap);
            bars += '<rect x="' + x.toFixed(2) + '" y="' + (mid - bh / 2).toFixed(2) +
                    '" width="' + bw.toFixed(2) + '" height="' + bh.toFixed(2) +
                    '" rx="' + (bw / 2).toFixed(2) + '" fill="' + color + '"/>';
        }
        return '<svg viewBox="0 0 ' + BARS_W + ' ' + BARS_H + '" width="100%" height="' + BARS_H + '" ' +
               'preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">' + bars + '</svg>';
    }

    /* ---------- 상태 ---------- */

    var list = [], plan = [], at = -1;
    var audio = null, tick = null;

    function stopOthers() {
        // 소리함에서 한 개 틀어둔 채로 들어오면 두 소리가 겹친다
        if (typeof window.stopVoicePlayback === "function") {
            try { window.stopVoicePlayback(); } catch (e) {}
        }
    }

    function stopAudio() {
        if (tick) { clearInterval(tick); tick = null; }
        if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
    }

    /* ---------- 재생 ---------- */

    function playAt(i) {
        if (plan.indexOf(i) === -1) { window.openUpsell && window.openUpsell("reel"); return; }

        stopAudio();
        at = i;
        paint();

        var it = list[i];
        if (!it) return;

        audio = new Audio(it.v.url);
        audio.play().catch(function () { toast("소리를 재생하지 못했어요"); });

        audio.onended = function () {
            var pos = plan.indexOf(at);
            if (pos > -1 && pos < plan.length - 1) playAt(plan[pos + 1]);
            else { stopAudio(); paint(); }      // 끝. 처음으로 되감지 않는다
        };

        tick = setInterval(function () {
            if (!audio) return;
            var total = audio.duration || it.v.sec || 1;
            var r = Math.min(1, (audio.currentTime || 0) / total);

            var fill = document.getElementById("reel-fill");
            if (fill) {
                var cut = (100 - r * 100).toFixed(2) + "%";
                fill.style.clipPath = "inset(0 " + cut + " 0 0)";
                fill.style.webkitClipPath = "inset(0 " + cut + " 0 0)";
            }
            var t = document.getElementById("reel-time");
            if (t) t.textContent = mmss(audio.currentTime) + " / " + mmss(total);

            var b = document.getElementById("reel-btn");
            if (b) b.innerHTML = audio.paused ? icon(false) : icon(true);
        }, 200);
    }

    window.reelToggle = function () {
        if (!audio) { playAt(plan.length ? plan[0] : 0); return; }
        if (audio.paused) audio.play().catch(function () {});
        else audio.pause();
        var b = document.getElementById("reel-btn");
        if (b) b.innerHTML = icon(!audio.paused);
    };

    window.reelStep = function (d) {
        var pos = plan.indexOf(at);
        if (pos === -1) return playAt(plan[0]);
        var nx = pos + d;
        if (nx < 0 || nx >= plan.length) return;
        playAt(plan[nx]);
    };

    window.reelJump = function (i) {
        i = Number(i);
        if (plan.indexOf(i) === -1) { window.openUpsell && window.openUpsell("reel"); return; }
        playAt(i);
    };

    /* ---------- 아이콘 (폰트 안 타는 도형) ---------- */

    function icon(playing) {
        if (playing) {
            return '<div style="display:flex; gap:5px;">' +
                '<div style="width:5px; height:19px; background:#FFF; border-radius:1px;"></div>' +
                '<div style="width:5px; height:19px; background:#FFF; border-radius:1px;"></div></div>';
        }
        return '<div style="width:0; height:0; border-top:10px solid transparent; ' +
               'border-bottom:10px solid transparent; border-left:17px solid #FFF; margin-left:5px;"></div>';
    }

    /* ---------- 화면 ---------- */

    function rowHTML(it, i) {
        var open = plan.indexOf(i) > -1;
        var now  = (i === at);
        var lock = (typeof window.lockChip === "function") ? window.lockChip() : "🔒";

        return '<div onclick="window.reelJump(' + i + ')" ' +
            'style="display:flex; align-items:center; gap:11px; padding:12px 4px; cursor:pointer;' +
            (open ? '' : ' opacity:0.45;') + '">' +

            '<span style="width:22px; flex-shrink:0; text-align:center; font-size:11px; font-weight:800; ' +
                'color:' + (now ? GOLD : "var(--text-sub)") + ';">' +
                (now ? "♪" : (i + 1)) + '</span>' +

            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:13px; font-weight:800; letter-spacing:-0.3px; ' +
                    'color:' + (now ? GOLD : "var(--text-m)") + '; ' +
                    'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(titleOf(it)) + '</div>' +
                '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin-top:2px;">' +
                    esc(pretty(it.key)) + (dday(it.key) ? " · " + esc(dday(it.key)) : "") + '</div>' +
            '</div>' +

            (open
                ? '<span style="font-size:11px; font-weight:700; color:var(--text-sub); flex-shrink:0;">' +
                      mmss(it.v.sec) + '</span>'
                : '<span style="flex-shrink:0;">' + lock + '</span>') +
        '</div>';
    }

    function paint() {
        var box = document.getElementById(SHEET);
        if (!box) return;

        var it = list[at] || list[plan[0]] || list[0];
        if (!it) return;

        var head = document.getElementById("reel-head");
        if (head) {
            head.innerHTML =
                '<div style="font-size:11px; font-weight:800; color:' + GOLD + '; letter-spacing:2px; margin-bottom:9px;">' +
                    esc(dday(it.key) || pretty(it.key)) + '</div>' +
                '<div class="serif-display" style="font-size:22px; font-weight:800; color:var(--text-m); ' +
                    'letter-spacing:-0.6px; word-break:keep-all; line-height:1.35;">' + esc(titleOf(it)) + '</div>' +
                '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-top:6px;">' +
                    esc(pretty(it.key)) + '</div>';
        }

        var wave = document.getElementById("reel-wave");
        if (wave) {
            var peaks = Array.isArray(it.v.peaks) && it.v.peaks.length ? it.v.peaks : null;
            if (peaks) {
                wave.innerHTML =
                    waveSVG(peaks, "var(--border)") +
                    '<div id="reel-fill" style="position:absolute; inset:0; clip-path:inset(0 100% 0 0); ' +
                        '-webkit-clip-path:inset(0 100% 0 0);">' + waveSVG(peaks, GOLD) + '</div>';
            } else {
                wave.innerHTML = '<div style="height:' + BARS_H + 'px;"></div>';
                // 아직 계산 안 된 파형은 뒤늦게 채운다
                if (typeof window.voicePeaks === "function") {
                    (function (key, id, want) {
                        window.voicePeaks(key, id).then(function (p) {
                            if (p && at === want) paint();
                        }).catch(function () {});
                    })(it.key, it.v.id, at);
                }
            }
        }

        var b = document.getElementById("reel-btn");
        if (b) b.innerHTML = icon(!!(audio && !audio.paused));

        var t = document.getElementById("reel-time");
        if (t) t.textContent = "0:00 / " + mmss(it.v.sec);

        var body = document.getElementById("reel-list");
        if (body) body.innerHTML = list.map(rowHTML).join(
            '<div style="height:1px; background:var(--border); opacity:0.5;"></div>');
    }

    /* ---------- 열기 · 닫기 ---------- */

    window.openVoiceReel = function () {
        list = allVoices();
        if (!list.length) return toast("아직 담긴 소리가 없어요");

        plan = playableIdx(list);
        at = plan[0];

        stopOthers();

        var old = document.getElementById(SHEET);
        if (old) old.remove();

        var total = list.reduce(function (s, x) { return s + (x.v.sec || 0); }, 0);
        var hidden = list.length - plan.length;

        var wrap = document.createElement("div");
        wrap.id = SHEET;
        wrap.setAttribute("style",
            "position:fixed; inset:0; z-index:100004; background:var(--bg-main); " +
            "overflow-y:auto; -webkit-overflow-scrolling:touch;");

        wrap.innerHTML =
        '<div style="max-width:480px; margin:0 auto; padding:18px 20px calc(40px + env(safe-area-inset-bottom, 0px));">' +

            '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:26px;">' +
                '<div>' +
                    '<div style="font-size:15.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.4px;">' +
                        '🎧 ' + esc(babyName()) + '의 목소리</div>' +
                    '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px;">' +
                        list.length + '개 · 모두 ' + esc(longText(total)) + '</div>' +
                '</div>' +
                '<span onclick="window.closeVoiceReel()" style="font-size:24px; font-weight:300; ' +
                    'color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +

            '<div id="reel-head" style="text-align:center; margin-bottom:22px;"></div>' +

            '<div id="reel-wave" style="position:relative; height:' + BARS_H + 'px; margin-bottom:14px;"></div>' +

            '<div id="reel-time" style="text-align:center; font-size:12px; font-weight:700; ' +
                'color:var(--text-sub); letter-spacing:1px; margin-bottom:20px;">0:00 / 0:00</div>' +

            '<div style="display:flex; align-items:center; justify-content:center; gap:26px; margin-bottom:28px;">' +
                '<span onclick="window.reelStep(-1)" style="font-size:19px; color:var(--text-sub); cursor:pointer;">⏮</span>' +
                '<div id="reel-btn" onclick="window.reelToggle()" ' +
                    'style="width:62px; height:62px; border-radius:50%; background:' + GOLD + '; ' +
                    'display:flex; align-items:center; justify-content:center; cursor:pointer; ' +
                    'box-shadow:0 6px 18px rgba(185,138,46,0.35);"></div>' +
                '<span onclick="window.reelStep(1)" style="font-size:19px; color:var(--text-sub); cursor:pointer;">⏭</span>' +
            '</div>' +

            (hidden > 0
                ? '<div onclick="window.openUpsell(\'reel\')" ' +
                  'style="background:rgba(185,138,46,0.09); border:1px solid rgba(185,138,46,0.22); ' +
                  'border-radius:16px; padding:14px 16px; margin-bottom:16px; cursor:pointer; text-align:center;">' +
                      '<div style="font-size:12.5px; font-weight:800; color:' + GOLD + '; word-break:keep-all;">' +
                          '지금은 첫 소리와 마지막 소리만 이어져요</div>' +
                      '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin-top:4px;">' +
                          '그 사이 ' + hidden + '개까지 전부 이어들으려면 플러스</div>' +
                  '</div>'
                : '') +

            '<div style="font-size:11px; font-weight:900; color:var(--text-sub); ' +
                'letter-spacing:1.4px; margin:6px 0 2px;">담긴 순서대로</div>' +
            '<div id="reel-list"></div>' +

        '</div>';

        document.body.appendChild(wrap);
        paint();
        playAt(at);
    };

    window.closeVoiceReel = function () {
        stopAudio();
        var el = document.getElementById(SHEET);
        if (el) el.remove();
    };

    /* ---------- 소리함 안에 문 하나 ----------
       두 개 미만이면 안 띄운다. 하나짜리 이어듣기는 그냥 재생이다. -------- */

    function mountBar() {
        var box = document.getElementById("voice-box");
        if (!box || document.getElementById("reel-entry")) return;

        var all = allVoices();
        if (all.length < 2) return;

        var total = all.reduce(function (s, x) { return s + (x.v.sec || 0); }, 0);

        var el = document.createElement("div");
        el.id = "reel-entry";
        el.onclick = function () { window.openVoiceReel(); };
        el.style.cssText =
            "display:flex; align-items:center; gap:13px; margin:0 0 18px; padding:15px 16px; cursor:pointer; " +
            "background:linear-gradient(135deg, rgba(185,138,46,0.10), rgba(185,138,46,0.03)); " +
            "border:1px solid rgba(185,138,46,0.22); border-radius:18px;";
        el.innerHTML =
            '<div style="font-size:21px; flex-shrink:0;">🎧</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:14px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">' +
                    '처음부터 이어듣기</div>' +
                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:2px;">' +
                    all.length + '개 · 모두 ' + esc(longText(total)) + '  ·  목소리가 언제 변했는지 보여요</div>' +
            '</div>' +
            '<div style="font-size:12px; color:' + GOLD + '; flex-shrink:0;">〉</div>';

        var shell = box.firstElementChild || box;
        var head = shell.firstElementChild;
        if (head && head.nextSibling) shell.insertBefore(el, head.nextSibling);
        else shell.appendChild(el);
    }

    window.refreshReelEntry = mountBar;

    /* ---------- 시작 ---------- */

    function boot() {
        var orig = window.openVoiceBox;
        if (typeof orig === "function" && !orig.__reel) {
            var wrapped = function () {
                var out = orig.apply(this, arguments);
                setTimeout(mountBar, 40);
                setTimeout(mountBar, 300);
                return out;
            };
            wrapped.__reel = true;
            window.openVoiceBox = wrapped;
        }
        setInterval(mountBar, 1500);      // 소리함을 다시 그려도 따라간다
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.reelDebug = function () {
        var all = allVoices();
        console.log("담긴 소리:", all.length + "개");
        all.forEach(function (x, i) {
            console.log("  " + (i + 1) + ". " + x.key + "  " + titleOf(x) +
                        "  " + mmss(x.v.sec) + (Array.isArray(x.v.peaks) && x.v.peaks.length ? "  파형 있음" : "  파형 없음"));
        });
        console.log("플러스:", isPro());
        console.log("이어지는 개수:", playableIdx(all).length + "개");
        console.log("소리함 문 붙음:", !!document.getElementById("reel-entry"));
    };
})();