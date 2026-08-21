/* ============================================================
   배냇함 — 목소리 (voice.js)

   사진은 다들 남긴다. 갤러리에 삼천 장씩 있다.
   그런데 소리는 아무도 안 남긴다.

   옹알이는 두 달이면 사라지고, 그 뒤로는 영영 못 듣는다.
   배냇함에 소리가 들어가야 상자가 열리는 느낌이 난다.

   30초, 60KB. 사진 한 장의 절반이다.

   index.html 에서 premium.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var IDX_KEY   = "tosil_day_voices";
    var MAX_SEC   = 30;      // 30초. 길면 다시 안 듣는다.
    var FREE_MAX  = 3;       // 맛은 보여준다. 그 다음부터 프리미엄.
    var DAY       = 86400000;

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function uid8() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function dayKeyOf(ts) {
        var d = new Date(ts);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function todayKey() { return dayKeyOf(Date.now()); }

    function mmss(sec) {
        sec = Math.max(0, Math.round(sec));
        return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    }

    function milestoneList() {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        return list || window.MILESTONE_DATA || [];
    }

    function msTitle(id) {
        var m = milestoneList().filter(function (x) { return x.id === id; })[0];
        return m ? m.title : "";
    }

    function achievedIds() {
        var raw = [];
        try { raw = JSON.parse(localStorage.getItem("tosil_milestones")) || []; } catch (e) {}
        return raw.map(function (a) { return typeof a === "string" ? a : (a && a.id); })
                  .filter(Boolean);
    }

    /* ---------- 무엇을 담을까 ----------
       녹음기를 열어놓고 "뭘 녹음하지" 하다가 그냥 닫는다.
       지금 이 아기가 낼 수 있는 소리를 하나만 짚어준다. -------- */

    function ddays() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return 0;
        var p = s.split("-");
        var b = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
        if (isNaN(b)) return 0;
        var t = new Date(); t.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((t.getTime() - b) / DAY));
    }

    var GUIDE = [
        { until:  59, what: "숨소리와 하품",       why: "이 시기 소리는 정말 짧게 지나가요" },
        { until: 119, what: "아~ 우~ 하는 쿠잉",   why: "말이 되기 전의 첫 소리예요" },
        { until: 209, what: "까르르 웃는 소리",     why: "옹알이가 가장 길어지는 때예요" },
        { until: 299, what: "바바, 마마 같은 소리", why: "곧 단어로 바뀌어요. 지금이 마지막이에요" },
        { until: 399, what: "이름 부르면 내는 대답", why: "첫 단어 직전의 소리예요" },
        { until: 9999, what: "지금 하는 말버릇",    why: "말투는 몇 달이면 또 바뀝니다" }
    ];

    var TIPS = [
        "TV를 끄면 목소리가 훨씬 선명해요",
        "폰을 30cm 안쪽에 두세요",
        "수유 후나 목욕 후에 제일 잘 놀아요",
        "말을 걸면 대답하듯 소리를 내요",
        "부모 목소리를 같이 담아도 좋아요. 나중엔 그것도 그리워져요"
    ];

    function guide() {
        var d = ddays();
        for (var i = 0; i < GUIDE.length; i++) if (d <= GUIDE[i].until) return GUIDE[i];
        return GUIDE[GUIDE.length - 1];
    }

    // 첫 담기 화면에서도 쓴다
    window.guideWhat = function () { return guide().what; };

    function tipOfDay() {
        return TIPS[ddays() % TIPS.length];
    }

    function repaint() {
        if (typeof window.renderMemoryBox === "function") {
            try { window.renderMemoryBox(); } catch (e) {}
        }
    }

    /* ---------- 저장소 ----------
       voice = { id, url, path, ts, sec, note, msId } -------- */

    function loadIndex() {
        try {
            var v = JSON.parse(localStorage.getItem(IDX_KEY));
            return (v && typeof v === "object") ? v : {};
        } catch (e) { return {}; }
    }

    function saveIndex(idx) {
        try { localStorage.setItem(IDX_KEY, JSON.stringify(idx)); } catch (e) {}
    }

    window.getDayVoices = function (key) {
        var a = loadIndex()[key];
        return Array.isArray(a) ? a : [];
    };

    window.voiceDays = function () {
        var idx = loadIndex();
        return Object.keys(idx).filter(function (k) {
            return Array.isArray(idx[k]) && idx[k].length;
        });
    };

    window.voiceCount = function () {
        var idx = loadIndex(), n = 0;
        Object.keys(idx).forEach(function (k) { if (Array.isArray(idx[k])) n += idx[k].length; });
        return n;
    };

    // 도감 항목의 소리. 날짜를 나중에 고쳐도 따라오도록 전체를 훑는다.
    window.getMilestoneVoice = function (msId) {
        if (!msId) return null;
        var idx = loadIndex(), keys = Object.keys(idx);
        for (var i = 0; i < keys.length; i++) {
            var arr = idx[keys[i]] || [];
            for (var j = 0; j < arr.length; j++) {
                if (arr[j] && arr[j].msId === msId) return { voice: arr[j], key: keys[i] };
            }
        }
        return null;
    };

    function putVoice(key, v) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) idx[key] = [];
        idx[key].push(v);
        saveIndex(idx);
    }

    window.attachVoicePeaks = function (key, id, peaks) {
        var idx = loadIndex();
        (idx[key] || []).forEach(function (v) { if (v.id === id) v.peaks = peaks; });
        saveIndex(idx);
    };

    function dropVoice(key, id) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) return;
        idx[key] = idx[key].filter(function (v) { return v.id !== id; });
        if (!idx[key].length) delete idx[key];
        saveIndex(idx);
    }

    /* ---------- 가족 동기화 (사진과 같은 방식) ---------- */

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    window.syncVoicesToFirebase = async function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.setDoc !== "function") return;
        try {
                await window.setDoc(window.doc(window.db, "voices_" + code + suffix(), "status"), {
                days: loadIndex(),
                deleted: (window.Grave ? window.Grave.list("voice") : {})   // 👈 지운 목록도 같이
            });
        } catch (e) { console.warn("[목소리] 동기화 실패", e); }
    };

    var unsub = null;
    window.startVoiceRealtimeSync = function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} }

        var u = window.onSnapshot(window.doc(window.db, "voices_" + code + suffix(), "status"), function (snap) {
            if (!snap.exists()) return;
            var data = snap.data() || {};
            var remote = data.days || {};
            if (window.Grave) window.Grave.merge("voice", data.deleted);   // 👈 짝꿍이 지운 것 받아오기
            var local = loadIndex(), merged = {};

            Object.keys(local).concat(Object.keys(remote)).forEach(function (k) {
                if (merged[k]) return;
                var seen = {}, out = [];
                (local[k] || []).concat(remote[k] || []).forEach(function (v) {
                    if (!v || !v.id || seen[v.id]) return;
                    if (window.Grave && window.Grave.has("voice", v.id)) return;   // 👈 지운 건 되살리지 않기
                    seen[v.id] = 1; out.push(v);
                });
                out.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
                if (out.length) merged[k] = out;
            });

            if (JSON.stringify(merged) === JSON.stringify(local)) return;
            saveIndex(merged);
            repaint();
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 녹음기 ---------- */

    var rec = null, chunks = [], stream = null, startedAt = 0, timer = null;
    var audioCtx = null, analyser = null, rafId = 0;
    var blob = null, blobSec = 0, blobUrl = null;
    var target = { key: null, msId: null };

    // 브라우저마다 되는 포맷이 다르다. 아이폰 사파리는 webm 을 못 만든다.
    function pickMime() {
        if (!window.MediaRecorder) return null;
        var cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", ""];
        for (var i = 0; i < cands.length; i++) {
            try { if (cands[i] === "" || MediaRecorder.isTypeSupported(cands[i])) return cands[i]; } catch (e) {}
        }
        return null;
    }

    function extOf(mime) {
        return (mime && mime.indexOf("mp4") > -1) || (mime && mime.indexOf("aac") > -1) ? "m4a" : "webm";
    }

    async function startRec() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return toast("이 브라우저에서는 녹음이 안 돼요");
        }
        var mime = pickMime();
        if (mime === null) return toast("이 브라우저에서는 녹음이 안 돼요");

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            console.warn("[목소리] 마이크 거부", e);
            return toast("마이크 권한이 필요해요. 설정에서 허용해 주세요");
        }

        chunks = [];
        try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
        catch (e) { rec = new MediaRecorder(stream); }

        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
            blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
            blobSec = Math.min(MAX_SEC, (Date.now() - startedAt) / 1000);
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            blobUrl = URL.createObjectURL(blob);
            stopMeter();
            releaseMic();
            draw("review");
        };

        startedAt = Date.now();
        rec.start();
        startMeter();
        draw("recording");

        timer = setInterval(function () {
            var sec = (Date.now() - startedAt) / 1000;
            var el = document.getElementById("voice-timer");
            if (el) el.textContent = mmss(sec);
            if (sec >= MAX_SEC) stopRec();
        }, 200);
    }

    function stopRec() {
        if (timer) { clearInterval(timer); timer = null; }
        if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) {} }
    }

    function releaseMic() {
        if (stream) {
            stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
            stream = null;
        }
    }

    // 소리가 들어오는지 눈으로 보여준다. 이게 없으면 녹음되는지 알 수가 없다.
    function startMeter() {
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC || !stream) return;
            audioCtx = new AC();
            var src = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);

            var buf = new Uint8Array(analyser.frequencyBinCount);
            var tick = function () {
                if (!analyser) return;
                analyser.getByteFrequencyData(buf);
                var sum = 0;
                for (var i = 0; i < buf.length; i++) sum += buf[i];
                var level = Math.min(1, (sum / buf.length) / 70);

                var bars = document.querySelectorAll("#voice-meter > span");
                for (var b = 0; b < bars.length; b++) {
                    var wave = 0.35 + 0.65 * Math.abs(Math.sin((Date.now() / 180) + b));
                    var h = 5 + level * wave * 34;
                    bars[b].style.height = h.toFixed(0) + "px";
                }
                rafId = requestAnimationFrame(tick);
            };
            tick();
        } catch (e) { /* 미터는 없어도 녹음은 된다 */ }
    }

    function stopMeter() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0; analyser = null;
        if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
    }

    function resetRec() {
        stopRec(); stopMeter(); releaseMic();
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
        blob = null; blobSec = 0; chunks = [];
    }

    /* ---------- 담기 ---------- */

    async function upload() {
        if (!blob) return;

        var uid = window.auth && window.auth.currentUser && window.auth.currentUser.uid;
        if (!uid) return toast("🔐 로그인 후 담을 수 있어요");
        if (!window.storage || !window.uploadString || !window.getDownloadURL || !window.storageRef) {
            return toast("스토리지를 불러오지 못했어요. 새로고침해 주세요");
        }

        var noteEl = document.getElementById("voice-note");
        var selEl  = document.getElementById("voice-target");
        var note = noteEl ? String(noteEl.value || "").trim() : "";
        var msId = selEl && selEl.value ? selEl.value : null;

        draw("saving");
        toast("배냇함에 담는 중이에요…");

        var dataUrl = await new Promise(function (res) {
            var r = new FileReader();
            r.onload = function () { res(r.result); };
            r.onerror = function () { res(null); };
            r.readAsDataURL(blob);
        });
        if (!dataUrl) { draw("review"); return toast("소리를 옮기지 못했어요"); }

        var key = target.key || todayKey();
        var id = uid8();
        var path = "voices/" + uid + "/" + key + "_" + id + "." + extOf(blob.type);

        try {
            var ref = window.storageRef(window.storage, path);
            await window.uploadString(ref, dataUrl, "data_url");
            var url = await window.getDownloadURL(ref);

            // 파형은 지금 계산해서 숫자 120개로 저장한다.
            // 나중에 URL 로 다시 받아 디코딩하면 느리고 CORS 도 탄다.
            var peaks = null;
            if (typeof window.peaksFrom === "function") {
                try { peaks = await window.peaksFrom(blob); } catch (e) {}
            }

            putVoice(key, {
                id: id, url: url, path: path, ts: Date.now(),
                sec: Math.round(blobSec), note: note, msId: msId, peaks: peaks
            });
            window.syncVoicesToFirebase();

            resetRec();
            window.closeVoiceSheet();
            toast("🎙️ " + babyName() + "의 목소리가 담겼어요");
            repaint();
        } catch (e) {
                       console.error("[목소리] 업로드 실패", e);
            // 실패를 삼키지 않는다. 무엇 때문인지 사용자도 알아야 한다.
            var code = (e && e.code) || "";
            if (code === "storage/unauthorized") {
                draw("review");
                return toast("⚠️ 저장 권한에 막혔어요 (storage/unauthorized)");
            }
            if (code === "storage/quota-exceeded") {
                draw("review");
                return toast("⚠️ 저장 공간이 가득 찼어요");
            }
            if (window.queueUpload) {
                // 사진은 다시 찍으면 되지만 옹알이는 다시 안 난다. 반드시 붙잡는다.
                await window.queueUpload({
                    id: id, kind: "voice", path: path, dataUrl: dataUrl,
                    meta: { key: key, ts: Date.now(), sec: Math.round(blobSec), note: note, msId: msId }
                });
                resetRec();
                window.closeVoiceSheet();
                repaint();
            } else {
                draw("review");
                toast("담지 못했어요. 연결을 확인해 주세요");
            }
        }
    }

    // 대기열이 나중에 성공하면 여기로 돌아온다
    window.acceptQueuedVoice = function (job, url) {
        var m = job.meta || {};
        putVoice(m.key, {
            id: job.id, url: url, path: job.path, ts: m.ts || Date.now(),
            sec: m.sec || 0, note: m.note || "", msId: m.msId || null
        });
        window.syncVoicesToFirebase();
    };

    /* ---------- 시트 ---------- */

    window.openVoiceSheet = function (key, msId) {
        // 무료는 세 개까지. 맛은 보여준다.
        var have = window.voiceCount();
        var pro = (typeof window.isPremium === "function") && window.isPremium();
        if (!pro && have >= FREE_MAX) {
            if (typeof window.openUpsell === "function") return window.openUpsell("voice");
            return toast("목소리는 프리미엄 기능이에요");
        }

        target = { key: key || todayKey(), msId: msId || null };
        resetRec();
        draw("idle");
    };

    window.closeVoiceSheet = function () {
        resetRec();
        var el = document.getElementById("voice-sheet");
        if (el) el.remove();
        document.body.style.overflow = "";
    };

    function draw(state) {
        var wrap = document.getElementById("voice-sheet");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "voice-sheet";
            wrap.setAttribute("style", "position:fixed; inset:0; z-index:100003; background:rgba(35,29,24,0.6); display:flex; align-items:flex-end; justify-content:center;");
            wrap.onclick = function (e) { if (e.target === wrap) window.closeVoiceSheet(); };
            document.body.appendChild(wrap);
            document.body.style.overflow = "hidden";
        }

        var meter = '<div id="voice-meter" style="display:flex; align-items:center; justify-content:center; gap:4px; height:44px; margin:18px 0 6px;">' +
            new Array(13).join("x").split("").map(function () {
                return '<span style="width:4px; height:5px; border-radius:3px; background:#7F77DD; transition:height .08s linear;"></span>';
            }).join("") + '</div>';

        var left = Math.max(0, MAX_SEC - Math.round(blobSec));
        var g = guide();
        var body;

        if (state === "idle") {
            body =
                '<div style="text-align:center; padding:14px 0 6px;">' +
                    '<div onclick="window.voiceStart()" style="width:88px; height:88px; margin:0 auto; border-radius:50%; background:#7F77DD; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 22px rgba(127,119,221,0.32);">' +
                        '<span style="font-size:34px;">🎙️</span>' +
                    '</div>' +
                    '<div style="font-size:13px; font-weight:700; color:var(--text-sub); margin-top:16px;">눌러서 녹음을 시작하세요</div>' +
                    '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); opacity:0.7; margin-top:5px;">최대 ' + MAX_SEC + '초까지 담깁니다</div>' +

                    '<div style="text-align:left; background:var(--bg-sub); border-radius:16px; padding:16px 17px; margin-top:22px;">' +
                        '<div style="font-size:10px; font-weight:800; color:#7F77DD; letter-spacing:2px; margin-bottom:9px;">지금 담으면 좋은 것</div>' +
                        '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' + esc(g.what) + '</div>' +
                        '<div style="font-size:12px; font-weight:600; color:var(--text-sub); margin-top:5px; line-height:1.6; word-break:keep-all;">' + esc(g.why) + '</div>' +
                        '<div style="border-top:1px dashed var(--border); margin-top:13px; padding-top:11px; font-size:11.5px; font-weight:700; color:var(--text-sub); word-break:keep-all;">' +
                            '💡 ' + esc(tipOfDay()) + '</div>' +
                    '</div>' +
                '</div>';
        } else if (state === "recording") {
            body =
                '<div style="text-align:center; padding:14px 0 6px;">' +
                    '<div onclick="window.voiceStop()" style="width:88px; height:88px; margin:0 auto; border-radius:50%; background:#F04452; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 22px rgba(240,68,82,0.30);">' +
                        '<span style="width:26px; height:26px; border-radius:5px; background:#FFF; display:block;"></span>' +
                    '</div>' +
                    meter +
                    '<div id="voice-timer" style="font-size:19px; font-weight:800; color:var(--text-m); letter-spacing:1px;">0:00</div>' +
                    '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:6px;">듣고 있어요. 눌러서 멈춥니다</div>' +
                '</div>';
        } else if (state === "saving") {
            body = '<div style="text-align:center; padding:46px 0; font-size:14px; font-weight:800; color:var(--text-sub);">담는 중이에요…</div>';
        } else {
            // review
            var ids = achievedIds();
            var opts = '<option value="">그날의 소리로 담기</option>' +
                ids.map(function (id) {
                    var t = msTitle(id);
                    if (!t) return "";
                    var taken = window.getMilestoneVoice(id);
                    return '<option value="' + esc(id) + '"' + (taken ? " disabled" : "") + '>' +
                        esc(t) + (taken ? " (이미 담김)" : "") + '</option>';
                }).join("");

            body =
                '<div style="padding:6px 0 2px;">' +
                    '<audio id="voice-preview" src="' + (blobUrl || "") + '" controls style="width:100%; height:40px;"></audio>' +
                    '<div style="text-align:center; font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:9px;">' +
                        Math.round(blobSec) + '초 담겼어요' + (left > 0 ? "" : " (최대 길이)") + '</div>' +

                    '<div style="font-size:10.5px; font-weight:800; color:var(--text-sub); letter-spacing:1.5px; margin:20px 0 8px;">어디에 담을까요</div>' +
                    '<select id="voice-target" style="width:100%; box-sizing:border-box; padding:13px; border-radius:13px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-m); font-size:14px; font-weight:700;">' + opts + '</select>' +

                    '<div style="font-size:10.5px; font-weight:800; color:var(--text-sub); letter-spacing:1.5px; margin:18px 0 8px;">한 줄 남기기</div>' +
                    '<input id="voice-note" type="text" maxlength="40" placeholder="예: 목욕하고 기분 좋을 때" style="width:100%; box-sizing:border-box; padding:13px; border-radius:13px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-m); font-size:14px;">' +

                    '<div style="display:flex; gap:9px; margin-top:18px;">' +
                        '<div onclick="window.voiceRetry()" style="padding:15px 20px; background:var(--bg-sub); color:var(--text-s); border-radius:14px; font-size:14px; font-weight:700; cursor:pointer;">다시</div>' +
                        '<div onclick="window.voiceSave()" style="flex:1; text-align:center; padding:15px; background:#7F77DD; color:#FFF; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">배냇함에 담기</div>' +
                    '</div>' +
                '</div>';
        }

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; background:var(--bg-card); border-radius:26px 26px 0 0; padding:22px 20px calc(30px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                '<span style="font-size:16px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">🎙️ ' + esc(babyName()) + '의 목소리</span>' +
                '<span onclick="window.closeVoiceSheet()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-bottom:8px;">D+' + ddays() + '일 · ' + esc(g.what) + '을 담아보세요</div>' +
            body +
        '</div>';
    }

    window.voiceStart = startRec;
    window.voiceStop  = stopRec;
    window.voiceRetry = function () { resetRec(); draw("idle"); };
    window.voiceSave  = upload;

    /* ---------- 재생 ---------- */

    var playing = null;

    window.playVoice = function (key, id) {
        var v = window.getDayVoices(key).filter(function (x) { return x.id === id; })[0];
        if (!v) return;

        if (playing) { try { playing.pause(); } catch (e) {} playing = null; }
        var a = new Audio(v.url);
        playing = a;
        a.play().catch(function () { toast("소리를 재생하지 못했어요"); });

        var btn = document.getElementById("vplay-" + id);
        if (btn) {
            btn.textContent = "❚❚";
            a.onended = a.onpause = function () { if (btn) btn.textContent = "▶"; };
        }
    };

    window.removeVoice = function (key, id) {
        var go = function () {
            var v = window.getDayVoices(key).filter(function (x) { return x.id === id; })[0];
            if (v && window.deleteObject && window.storage && window.storageRef && v.path) {
                try { window.deleteObject(window.storageRef(window.storage, v.path)); } catch (e) {}
            }
            if (window.Grave) window.Grave.add("voice", id);   // 👈 묘비 세우기
            dropVoice(key, id);
            window.syncVoicesToFirebase();
            repaint();
        };
        if (typeof window.showConfirm === "function") {
            window.showConfirm("이 목소리를 배냇함에서 빼낼까요?\n되돌릴 수 없어요.", go, "🎙️", "빼내기", "#F04452");
        } else if (confirm("이 목소리를 빼낼까요?")) go();
    };

    /* ---------- 배냇함에 그리기 ---------- */

    // 소리의 모양. 저장된 게 없으면 그려두고 나중에 채운다.
    function wave(v, key, h) {
        if (typeof window.renderWave !== "function") return "";
        var opts = { w: 260, h: h || 26, color: v.msId ? "#B98A2E" : "#7F77DD", gap: 1.4, min: 2 };
        var boxId = "wv-" + v.id;
        var inner = (Array.isArray(v.peaks) && v.peaks.length) ? window.renderWave(v.peaks, opts) : "";
        if (!inner && typeof window.paintWaveLater === "function") {
            window.paintWaveLater(boxId, key, v.id, opts);
        }
        return '<div id="' + boxId + '" style="margin:5px 0 3px; opacity:0.85;">' + inner + '</div>';
    }

    function chip(v, key) {
        return '<div style="display:flex; align-items:center; gap:11px; background:var(--bg-sub); border-radius:15px; padding:12px 14px;">' +
            '<div id="vplay-' + esc(v.id) + '" onclick="event.stopPropagation(); window.playVoice(\'' + key + '\',\'' + esc(v.id) + '\')" ' +
                'style="width:34px; height:34px; border-radius:50%; background:#7F77DD; color:#FFF; display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer; flex-shrink:0;">▶</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:13px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    (v.msId ? esc(msTitle(v.msId) || "목소리") : (v.note ? esc(v.note) : "그날의 소리")) + '</div>' +
                wave(v, key, 26) +
                '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin-top:2px;">' +
                    (v.sec || 0) + '초' + (v.msId && v.note ? "  ·  " + esc(v.note) : "") + '</div>' +
            '</div>' +
            '<span onclick="event.stopPropagation(); window.removeVoice(\'' + key + '\',\'' + esc(v.id) + '\')" ' +
                'style="font-size:11px; font-weight:700; color:var(--text-sub); cursor:pointer; flex-shrink:0; padding:4px;">빼기</span>' +
        '</div>';
    }

    // 날짜 카드 안
    window.renderVoiceRow = function (key) {
        var list = window.getDayVoices(key);
        if (!list.length) return "";
        return '<div style="display:flex; flex-direction:column; gap:7px; margin-bottom:16px;">' +
            list.map(function (v) { return chip(v, key); }).join("") +
        '</div>';
    };

    // 날짜 카드 아래 진입점
    window.renderVoiceAdd = function (key) {
        return '<div onclick="event.stopPropagation(); window.openVoiceSheet(\'' + key + '\')" ' +
            'style="margin-top:10px; font-size:12px; font-weight:700; color:var(--text-sub); cursor:pointer;">이 날의 목소리 담기 +</div>';
    };

    // 배냇함 머리
    window.renderVoiceBar = function () {
        var n = window.voiceCount();
        var pro = (typeof window.isPremium === "function") && window.isPremium();
        var lock = (!pro && n >= FREE_MAX && typeof window.lockChip === "function") ? window.lockChip("프리미엄") : "";
        var act = n ? "window.openVoiceBox()" : "window.openVoiceSheet()";
        return '<div onclick="' + act + '" style="display:flex; justify-content:space-between; align-items:center; padding:17px 18px; border:1px dashed var(--border); border-radius:18px; margin-bottom:14px; cursor:pointer;">' +
            '<span style="font-size:13.5px; font-weight:800; color:var(--text-m);">🎙️ ' + (n ? "소리함 열기" : "오늘 목소리 담기") + '</span>' +
            '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">' +
                (lock || (n ? n + "개 담겼어요" : "옹알이는 지금뿐이에요")) + '</span>' +
        '</div>';
    };

    /* ---------- 소리함 ----------
       담을 데만 있고 모아 볼 데가 없으면, 담은 게 어디 갔는지 모른다.
       편지함과 같은 자리에 소리함을 둔다. -------- */

    function prettyKey(k) {
        var p = String(k).split("-");
        return Number(p[1]) + "월 " + Number(p[2]) + "일";
    }

    function ymOf(k) {
        var p = String(k).split("-");
        return p[0] + "년 " + Number(p[1]) + "월";
    }

    function ddayOf(k) {
        var s2 = localStorage.getItem("tosil_startDate");
        if (!s2) return "";
        var b = new Date(s2 + "T00:00:00").getTime();
        var p = String(k).split("-");
        var t = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
        if (isNaN(b) || isNaN(t)) return "";
        var n = Math.floor((t - b) / DAY);
        return n >= 0 ? "D+" + n + "일" : "";
    }

    // ==========================================
// 🎙️ 소리함 렌더링 (카드 겹침 해결 + 음성 저장 버튼 추가 픽스!)
// ==========================================
    window.openVoiceBox = function () {
        var idx = loadIndex();
        var keys = Object.keys(idx).sort().reverse();
        var total = window.voiceCount();

        var old2 = document.getElementById("voice-box");
        if (old2) old2.remove();

        var wrap = document.createElement("div");
        wrap.id = "voice-box";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");

        var body = "";
        if (!total) {
            body = '<div style="text-align:center; padding:80px 24px;">' +
                '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:26px; color:var(--text-sub); line-height:1.6;">' +
                    '아직 담긴 소리가 없어요<br>지금 내는 소리는<br>두 달 뒤면 안 나요' +
                '</div></div>';
        } else {
            var lastYm = "";
            keys.forEach(function (k) {
                var ym = ymOf(k);
                if (ym !== lastYm) {
                    lastYm = ym;
                    body += '<div style="font-size:11.5px; font-weight:800; color:var(--text-sub); letter-spacing:2px; margin:28px 4px 12px;">' + esc(ym) + '</div>';
                }
                (idx[k] || []).forEach(function (v) {
                    var isMs = !!v.msId;
                    body +=
                    '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:16px 17px; margin-bottom:9px;">' +
                        '<div style="display:flex; align-items:center; gap:13px;">' +
                            '<div id="vplay-' + esc(v.id) + '" onclick="window.playVoice(\'' + k + '\',\'' + esc(v.id) + '\')" ' +
                                'style="width:42px; height:42px; border-radius:50%; background:' + (isMs ? '#B98A2E' : '#7F77DD') + '; color:#FFF; display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer; flex-shrink:0;">▶</div>' +
                            '<div style="flex:1; min-width:0;">' +
                                (isMs ? '<div style="font-size:9.5px; font-weight:800; color:#B98A2E; letter-spacing:1.5px; margin-bottom:3px;">처음 해낸 일</div>' : '') +
                                '<div style="font-size:14.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                                    (isMs ? esc(msTitle(v.msId) || "목소리") : (v.note ? esc(v.note) : "그날의 소리")) + '</div>' +
                                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px;">' +
                                    esc(prettyKey(k)) + '  ·  ' + esc(ddayOf(k)) + '  ·  ' + (v.sec || 0) + '초</div>' +
                            '</div>' +
                        '</div>' +
                        wave(v, k, 40) +
                        
                        // 🚨 니치 깎기: 파형엽서 / 음성저장 / 빼기 버튼을 예쁜 비율로 나란히 배치!
                        '<div style="display:flex; gap:7px; margin-top:10px;">' +
                            (typeof window.downloadWaveCard === "function"
                                ? '<span onclick="window.downloadWaveCard(\'' + k + '\',\'' + esc(v.id) + '\')" ' +
                                  'style="flex:1.5; text-align:center; padding:9px; border-radius:11px; background:rgba(185,138,46,0.12); ' +
                                  'font-size:11px; font-weight:800; color:#B98A2E; cursor:pointer;">🎵 파형 엽서</span>' : '') +
                            
                            // 👇 신규 추가: 실제 오디오 파일 저장 버튼!
                            '<span onclick="window.downloadVoiceAudio(\'' + k + '\',\'' + esc(v.id) + '\')" ' +
                                  'style="flex:1.5; text-align:center; padding:9px; border-radius:11px; background:#E8F3FF; font-size:11px; font-weight:800; color:#3182F6; cursor:pointer;">💾 음성 저장</span>' +

                            '<span onclick="window.removeVoice(\'' + k + '\',\'' + esc(v.id) + '\'); window.openVoiceBox();" ' +
                                'style="flex:1; text-align:center; padding:9px; border-radius:11px; background:var(--bg-sub); font-size:11px; font-weight:700; color:var(--text-sub); cursor:pointer;">빼기</span>' +
                        '</div>' + 
                        (isMs && v.note ? '<div style="font-family:\'Nanum Pen Script\',cursive; font-size:19px; color:var(--text-s); margin-top:10px; padding-left:55px; line-height:1.4;">' + esc(v.note) + '</div>' : '') +
                    '</div>'; // 🚨 해결 1: 누락되었던 닫기 태그(</div>) 복구 완료!
                });
            });
        }

        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 20px 60px;">' +
            '<div style="position:sticky; top:0; background:var(--bg-main); padding:22px 0 16px; z-index:2;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                    '<div>' +
                        '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">' + esc(babyName()) + '의 소리함</div>' +
                        '<div style="font-size:13px; font-weight:600; color:var(--text-sub); margin-top:6px;">' +
                            (total ? esc(total + "개가 담겼어요") : "첫 소리를 기다리는 중") + '</div>' +
                    '</div>' +
                    '<div onclick="window.closeVoiceBox()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; padding:2px 8px; line-height:1;">×</div>' +
                '</div>' +
            '</div>' +

            '<div onclick="window.closeVoiceBox(); window.openVoiceSheet();" style="display:flex; justify-content:space-between; align-items:center; padding:16px 18px; border:1px dashed var(--border); border-radius:18px; margin-bottom:6px; cursor:pointer;">' +
                '<span style="font-size:13.5px; font-weight:800; color:var(--text-m);">🎙️ 새로 담기</span>' +
                '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">' + esc(guide().what) + '</span>' +
            '</div>' +

            body +
            (total ? '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:34px; line-height:1.7;">소리는 종이에 담기지 않아요<br>배냇함에서만 다시 들을 수 있습니다</div>' : "") +
        '</div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";
    };

    window.closeVoiceBox = function () {
        var el = document.getElementById("voice-box");
        if (el) el.remove();
        document.body.style.overflow = "";
    };

    // 도감 항목 밑에 붙는 작은 소리 줄
    window.renderMilestoneVoice = function (msId) {
        var f = window.getMilestoneVoice(msId);
        if (!f) return "";
        var v = f.voice;
        return '<div onclick="event.stopPropagation(); window.playVoice(\'' + f.key + '\',\'' + esc(v.id) + '\')" ' +
            'style="display:inline-flex; align-items:center; gap:7px; margin-top:8px; background:rgba(185,138,46,0.12); ' +
            'border-radius:11px; padding:6px 11px; cursor:pointer;">' +
            '<span id="vplay-' + esc(v.id) + '" style="font-size:10px; color:#B98A2E;">▶</span>' +
            '<span style="font-size:11px; font-weight:800; color:#B98A2E;">그때 소리 듣기 · ' + (v.sec || 0) + '초</span>' +
        '</div>';
    };

    /* ---------- 시작 ---------- */

    function boot() { window.startVoiceRealtimeSync(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.voiceDebug = function () {
        console.log("담긴 목소리:", window.voiceCount() + "개");
        console.log("녹음 가능 포맷:", pickMime());
        console.log("마이크 API:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
        return loadIndex();
    };
})();

// ==========================================
// 💾 [수정완료] 실제 음성 파일 모바일 다운로드 엔진 (아이폰 완벽 호환)
// ==========================================
window.downloadVoiceAudio = async function(key, id) {
    var v = window.getDayVoices(key).filter(function (x) { return x.id === id; })[0];
    if (!v || !v.url) return toast("저장할 소리 파일을 찾지 못했어요.");

    toast("음성 파일을 준비 중이에요...");
    try {
        // 1. 파이어베이스에서 오디오 파일 가져오기
        const response = await fetch(v.url);
        const blob = await response.blob();

        // 2. 파일명 예쁘게 만들기
        const bName = localStorage.getItem("tosil_babyName") || "우리아기";
        const dateStr = key.replace(/-/g, "");
        const ext = v.url.includes('.m4a') || (v.path && v.path.includes('.m4a')) ? 'm4a' : 'webm';
        const fileName = `${bName}_목소리_${dateStr}.${ext}`;

        // 3. 파일 객체로 변환
        const file = new File([blob], fileName, { type: blob.type });

        // 🚀 4. 아이폰/갤럭시 네이티브 공유창 띄우기 (이게 모바일 무적입니다)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: '우리아기 옹알이',
                text: '배냇함에 보관된 우리 아기 목소리예요 🤍'
            });
            toast("✅ 목소리 파일이 안전하게 저장/공유되었습니다!");
        } else {
            // PC나 구형 브라우저를 위한 강제 다운로드 (기존 방식 유지)
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
            toast("💾 아기의 목소리가 다운로드 폴더에 저장되었습니다!");
        }
    } catch (e) {
        console.error("[음성 다운로드 에러]", e);
        // CORS(보안)에 걸려 다운로드가 막히면, 최후의 수단으로 새 창에서 오디오를 틀어줍니다.
        window.open(v.url, '_blank');
        toast("보안 설정으로 인해 새 창에서 오디오를 엽니다.");
    }
};