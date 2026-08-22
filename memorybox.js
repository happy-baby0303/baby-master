/* ============================================================
   배냇함 — 디지털 배냇함 (memorybox.js)

   흩어져 있던 기록을 한 곳에 모아 시간순으로 세운다.
   아이가 그리울 때 들어와 꺼내보는 곳.

   기존 코드는 한 줄도 고치지 않는다.
   index.html 에서 emotion.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var DAY = 86400000;
    var WEEK = ["일", "월", "화", "수", "목", "금", "토"];

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() {
        return localStorage.getItem("tosil_babyName") || "우리 아기";
    }

    function birthTime() {
        var d = localStorage.getItem("tosil_startDate");
        if (!d) return null;
        var t = new Date(d + "T00:00:00").getTime();
        return isNaN(t) ? null : t;
    }

    function dayKeyOf(ts) {
        var d = new Date(ts);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function parseKey(key) {
        var p = String(key).split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    // 그날이 D+며칠이었는지
    function ddayOf(key) {
        var b = birthTime();
        if (!b) return "";
        var diff = Math.floor((parseKey(key).getTime() - b) / DAY);
        return diff >= 0 ? "D+" + diff + "일" : "";
    }

    function readJSON(key, fallback) {
        try {
            var v = JSON.parse(localStorage.getItem(key));
            return v || fallback;
        } catch (e) { return fallback; }
    }

    // MILESTONE_DATA 는 const 라서 window 에 안 붙는다. 전역 이름으로 먼저 찾는다.
    function milestoneList() {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        if (!list) list = window.MILESTONE_DATA;
        return list || [];
    }

    function myTitle() {
        return (localStorage.getItem("user_role") || "mom") === "dad" ? "아빠" : "엄마";
    }

    /* ---------- 도감 날짜 ----------
       저장 형식이 섞여 있다. "2026. 08. 15", "2026-08-15", 타임스탬프,
       그리고 날짜를 모르는 옛 기록까지.
       진짜 날짜만 YYYY-MM-DD 로 돌려주고, 아니면 빈 문자열. -------- */

    function normalizeDate(v) {
        if (v == null) return "";
        var t = String(v).trim();
        var m = t.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
        if (m) return m[1] + "-" + String(m[2]).padStart(2, "0") + "-" + String(m[3]).padStart(2, "0");
        var n = Number(t);
        if (n && !isNaN(n) && n > 946684800000) return dayKeyOf(n);
        return "";
    }

    function toStoredFormat(key) { return key.replace(/-/g, ". "); }

    function saveMilestoneDate(id, key) {
        var arr = readJSON("tosil_milestones", []);
        if (!Array.isArray(arr)) return;
        var changed = false;
        arr = arr.map(function (a) {
            if (typeof a === "string") a = { id: a, date: "" };
            if (a && a.id === id) { a.date = toStoredFormat(key); changed = true; }
            return a;
        });
        if (!changed) return;
        try { localStorage.setItem("tosil_milestones", JSON.stringify(arr)); } catch (e) {}
        var alt = readJSON("tosil_milestone_dates", {});
        alt[id] = parseKey(key).getTime();
        try { localStorage.setItem("tosil_milestone_dates", JSON.stringify(alt)); } catch (e) {}
    }

    function dateOptionBtn(label, sub, key, id) {
        return '<div onclick="window.pickMilestoneDate(\'' + id + '\', \'' + key + '\')" style="display:flex; justify-content:space-between; align-items:center; padding:17px 18px; background:var(--bg-sub); border-radius:16px; margin-bottom:9px; cursor:pointer;">' +
            '<span style="font-size:15px; font-weight:800; color:var(--text-m);">' + label + '</span>' +
            '<span style="font-size:12.5px; font-weight:600; color:var(--text-sub);">' + sub + '</span>' +
        '</div>';
    }

    window.editMilestoneDate = function (id) {
        var list = milestoneList();
        var item = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === id) { item = list[i]; break; }
        if (!item) return;

        var b = birthTime();
        var now = new Date(); now.setHours(0, 0, 0, 0);
        var opts = [["오늘", 0], ["어제", 1], ["그저께", 2], ["일주일 전", 7]].map(function (o) {
            var d = new Date(now.getTime() - o[1] * DAY);
            var key = dayKeyOf(d.getTime());
            var dd = b ? "D+" + Math.floor((d.getTime() - b) / DAY) + "일" : "";
            return dateOptionBtn(o[0], (d.getMonth() + 1) + "월 " + d.getDate() + "일  " + dd, key, id);
        }).join("");

        var minDate = b ? dayKeyOf(b) : "";
        var wrap = document.getElementById("ms-date-sheet");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "ms-date-sheet";
            document.body.appendChild(wrap);
        }
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.5); display:flex; align-items:flex-end;");
        wrap.onclick = function (e) { if (e.target === wrap) window.closeMilestoneDate(); };
        wrap.innerHTML =
        '<div onclick="event.stopPropagation()" style="width:100%; max-width:520px; margin:0 auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:26px 22px 34px;">' +
            '<div style="width:40px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 22px;"></div>' +
            '<div style="font-size:11px; font-weight:800; color:var(--text-sub); letter-spacing:2px; margin-bottom:10px;">언제 있었던 일인가요</div>' +
            '<div class="serif-display" style="font-size:20px; font-weight:700; color:var(--text-title); margin-bottom:6px;">' + esc(item.title) + '</div>' +
            '<div style="font-size:13px; font-weight:500; color:var(--text-s); line-height:1.6; margin-bottom:22px; word-break:keep-all;">' + esc(item.desc || "") + '</div>' +
            opts +
            '<div style="margin-top:6px; padding:17px 18px; background:var(--bg-sub); border-radius:16px;">' +
                '<div style="font-size:13px; font-weight:800; color:var(--text-m); margin-bottom:11px;">직접 고르기</div>' +
                '<input type="date" id="ms-date-input" max="' + dayKeyOf(Date.now()) + '"' + (minDate ? ' min="' + minDate + '"' : '') + ' style="width:100%; box-sizing:border-box; padding:13px; border-radius:12px; border:1px solid var(--border); background:var(--bg-card); font-size:15px; font-weight:700; color:var(--text-m); outline:none;">' +
                '<div onclick="window.pickMilestoneDate(\'' + id + '\', document.getElementById(\'ms-date-input\').value)" style="margin-top:11px; text-align:center; padding:13px; background:#7F77DD; color:#FFF; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer;">이 날로 정하기</div>' +
            '</div>' +
            '<div onclick="window.closeMilestoneDate()" style="text-align:center; margin-top:16px; font-size:13.5px; font-weight:700; color:var(--text-sub); padding:10px; cursor:pointer;">닫기</div>' +
        '</div>';
        document.body.style.overflow = "hidden";
    };

    window.pickMilestoneDate = function (id, key) {
        if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var b = birthTime();
        var t = parseKey(key).getTime();
        if (t > Date.now()) return;
        if (b && t < b) return;
        saveMilestoneDate(id, key);
        window.closeMilestoneDate();
        if (typeof window.openMilestoneModal === "function") window.openMilestoneModal();
        try { window.renderMemoryBox(); } catch (e) {}
        if (typeof window.showToast === "function") {
            var d = parseKey(key);
            var dd = b ? " (D+" + Math.floor((t - b) / DAY) + "일)" : "";
            window.showToast("🗓️ " + (d.getMonth() + 1) + "월 " + d.getDate() + "일로 기록했어요" + dd);
        }
    };

    window.closeMilestoneDate = function () {
        var w = document.getElementById("ms-date-sheet");
        if (w) w.remove();
        document.body.style.overflow = "";
    };

   /* ---------- 흩어진 기록을 하루 단위로 모은다 ---------- */

    function buildTimeline() {
        var days = {};

        var touch = function (key) {
            if (!days[key]) days[key] = { key: key, milestones: [], letter: null, replies: [], growth: null, photos: [] };
            return days[key];
        };

        // 1. 첫 순간 (도감 달성일)
        var list = milestoneList();
        var findTitle = function (id) {
            for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
            return null;
        };
        var seenMs = {};
        var putMilestone = function (key, id) {
            if (!key || seenMs[id]) return;
            var item = findTitle(id);
            if (!item) return;
            seenMs[id] = 1;
            touch(key).milestones.push({ id: id, title: item.title, desc: item.desc });
        };

        var achieved = readJSON("tosil_milestones", []);
        if (Array.isArray(achieved)) {
            achieved.forEach(function (a) {
                if (a && typeof a === "object" && a.id) {
                    var key = normalizeDate(a.date);
                    if (key) putMilestone(key, a.id);
                }
            });
        }

        var msDates = readJSON("tosil_milestone_dates", {});
        Object.keys(msDates).forEach(function (id) {
            var ts = Number(msDates[id]);
            if (ts) putMilestone(dayKeyOf(ts), id);
        });

        // 2. 아기가 보낸 편지
        var letters = readJSON("tosil_letters", {});
        Object.keys(letters).forEach(function (k) {
            var l = letters[k];
            if (l && l.text) touch(k).letter = l;
        });

        // 3. 부모가 남긴 답장
        var replies = readJSON("tosil_replies", {});
        Object.keys(replies).forEach(function (k) {
            var r = replies[k];
            if (!r) return;
            ["mom", "dad"].forEach(function (slot) {
                if (r[slot] && r[slot].text) {
                    touch(k).replies.push({ who: slot === "dad" ? "아빠" : "엄마", slot: slot, text: r[slot].text });
                }
            });
        });

        // 4. 키와 몸무게
        var growth = readJSON("tosil_growth_records", []);
        growth.forEach(function (g) {
            if (!g || !g.date) return;
            if (!g.height && !g.weight) return;
            touch(g.date).growth = g;
        });

        // 5. 그날의 사진
        if (typeof window.photoDays === "function") {
            window.photoDays().forEach(function (k) {
                touch(k).photos = window.getDayPhotos(k);
            });
        }

        // 6. 문답, 한 줄, 소리, 기념일
        if (typeof window.diaryDays === "function") {
            window.diaryDays().forEach(function (k) { touch(k); });
        }
        if (typeof window.noteDays === "function") {
            window.noteDays().forEach(function (k) { touch(k); });
        }
        if (typeof window.voiceDays === "function") {
            window.voiceDays().forEach(function (k) { touch(k); });
        }
        if (typeof window.anniversaryDays === "function") {
            window.anniversaryDays().forEach(function (k) { touch(k); });
        }

        // 🚨 [CTO 근본 패치] NaN 유령 데이터 완벽 차단!
        // 저장소에 찌꺼기(NaN, undefined 등)가 들어와도, YYYY-MM-DD 형식이 아니면 아예 화면에 그리지 못하게 폐기 처분합니다!
        return Object.keys(days)
            .filter(function (k) { return k && /^\d{4}-\d{2}-\d{2}$/.test(k); })
            .sort()
            .reverse()
            .map(function (k) { return days[k]; });
    }

    /* ---------- 요약 숫자 ---------- */

    function summary() {
        var letters = readJSON("tosil_letters", {});
        var b = birthTime();
        var together = b ? Math.floor((Date.now() - b) / DAY) : 0;

        var ids = {};
        var achieved = readJSON("tosil_milestones", []);
        if (Array.isArray(achieved)) {
            achieved.forEach(function (a) {
                if (typeof a === "string") ids[a] = 1;
                else if (a && a.id) ids[a.id] = 1;
            });
        }
        Object.keys(readJSON("tosil_milestone_dates", {})).forEach(function (id) { ids[id] = 1; });

        return {
            letters: Object.keys(letters).length,
            firsts: Object.keys(ids).length,
            together: together > 0 ? together : 0
        };
    }

    /* ---------- 화면 조각 ---------- */

    // 부모는 달력이 아니라 개월 수로 기억한다.
    // 월 헤더는 달 단위로만 묶이므로, 그 달의 마지막 날 기준으로 나이를 매긴다.
    function monthAgeLabel(key) {
        var b = birthTime();
        if (!b) return "";
        var d = parseKey(key);
        var monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
        var days = Math.floor((monthEnd - b) / DAY);
        if (days < 0) return "";
        if (days < 31) return "  ·  태어난 달";
        var m = Math.floor(days / 30.436875);
        return "  ·  생후 " + m + "개월";
    }

    function statBox(num, label) {
        return '<div style="flex:1; text-align:center;">' +
            '<div class="serif-display" style="font-size:26px; font-weight:700; color:var(--text-title); letter-spacing:-1px;">' + num + '</div>' +
            '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:5px;">' + label + '</div>' +
        '</div>';
    }

    /* ---------- 오늘 담기 ----------
       사진·소리·한 줄이 각자 점선 바를 하나씩 차지하고 있었다.
       똑같이 생긴 줄이 세 개면 눈이 셋 다 안 읽는다. 한 칸에 모은다. -------- */

    function tile(icon, label, action, locked) {
        return '<div onclick="' + action + '" style="flex:1; padding:13px 6px; border-radius:14px; ' +
            'border:1px dashed var(--border); text-align:center; cursor:pointer;">' +
            '<div style="font-size:17px; margin-bottom:5px; line-height:1;">' + icon + '</div>' +
            '<div style="font-size:11.5px; font-weight:800; color:var(--text-s); letter-spacing:-0.2px;">' +
                esc(label) + (locked ? ' 🔒' : '') + '</div>' +
        '</div>';
    }

    /* ---------- 이 기기에만 있는 상태 ----------
       동기화 코드가 없으면 사진·소리·한 줄·편지가 전부 이 폰에만 있다.
       폰을 바꾸거나 브라우저를 지우면 통째로 사라진다.
       '평생 앱'이라면서 이 사실을 작은 글씨로만 적어둘 수는 없다. -------- */

    function unsyncedWarning() {
        if (localStorage.getItem("family_sync_code")) return "";

        var n = 0;
        if (typeof window.photoCount === "function") n += window.photoCount();
        if (typeof window.voiceCount === "function") n += window.voiceCount();
        if (typeof window.noteCount === "function")  n += window.noteCount();
        if (n < 1) return "";                       // 담긴 게 없으면 겁줄 일도 없다

        return '<div onclick="window.openFamilySync && window.openFamilySync()" ' +
            'style="background:rgba(240,68,82,0.07); border:1px solid rgba(240,68,82,0.20); ' +
            'border-radius:18px; padding:15px 17px; margin-bottom:14px; cursor:pointer;">' +
            '<div style="font-size:12.5px; font-weight:800; color:#D93B48; letter-spacing:-0.3px;">' +
                '지금 담긴 ' + n + '개가 이 폰에만 있어요</div>' +
            '<div style="font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:5px; line-height:1.6; word-break:keep-all;">' +
                '폰을 바꾸거나 브라우저를 정리하면 사라집니다. 가족 연동을 하면 안전하게 보관돼요.</div>' +
        '</div>';
    }

    function todayBar() {
        var key = dayKeyOf(Date.now());
        var dd = ddayOf(key);

        var photos = (typeof window.getLoosePhotos === "function") ? window.getLoosePhotos(key).length : 0;
        var voices = (typeof window.getDayVoices === "function") ? window.getDayVoices(key).length : 0;
        var notes  = (typeof window.getDayNotes === "function")  ? window.getDayNotes(key).length  : 0;

        var pro = (typeof window.isPremium !== "function") || window.isPremium();
        var cap = (typeof window.photoCapPerDay === "function") ? window.photoCapPerDay() : 3;

        var bits = [];
        if (photos) bits.push("사진 " + photos);
        if (voices) bits.push("소리 " + voices);
        if (notes)  bits.push("한 줄 " + notes);
        var right = bits.length ? bits.join("  ·  ") : (dd || "오늘");

        var cells = "";
        if (typeof window.addDayPhoto === "function") {
            cells += tile("📷", "사진", "window.addDayPhoto('" + key + "')", !pro && photos >= cap);
        }
        if (typeof window.openVoiceSheet === "function") {
            cells += tile("🎙️", "소리", "window.openVoiceSheet('" + key + "')", false);
        }
        if (typeof window.openNoteSheet === "function") {
            cells += tile("✍️", "한 줄", "window.openNoteSheet('" + key + "')", false);
        }
        if (!cells) return "";

        return '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:16px; margin-bottom:14px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
                '<span style="font-size:13px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">오늘 담기</span>' +
                '<span style="font-size:11.5px; font-weight:700; color:var(--text-sub);">' + esc(right) + '</span>' +
            '</div>' +
            '<div style="display:flex; gap:8px;">' + cells + '</div>' +
        '</div>';
    }

    // 날짜 카드 바닥. 세 줄이 아니라 한 줄.
    function addRow(key) {
        var chip = function (label, action) {
            return '<span onclick="event.stopPropagation(); ' + action + '" style="flex:1; text-align:center; ' +
                'padding:9px 4px; border-radius:11px; background:var(--bg-sub); font-size:11px; font-weight:800; ' +
                'color:var(--text-sub); cursor:pointer;">＋ ' + esc(label) + '</span>';
        };
        var out = "";
        if (typeof window.addDayPhoto === "function") {
            // 무료 한도를 채웠으면 사라지는 게 아니라 잠긴 채로 남는다
            var n = (typeof window.getLoosePhotos === "function") ? window.getLoosePhotos(key).length : 0;
            var cap = (typeof window.photoCapPerDay === "function") ? window.photoCapPerDay() : 3;
            var pro = (typeof window.isPremium !== "function") || window.isPremium();
            out += (n >= cap && !pro)
                ? '<span onclick="event.stopPropagation(); window.openUpsell(\'photo\')" style="flex:1; text-align:center; ' +
                  'padding:9px 4px; border-radius:11px; background:rgba(185,138,46,0.10); font-size:11px; font-weight:800; ' +
                  'color:#B98A2E; cursor:pointer;">🔒 사진</span>'
                : chip("사진", "window.addDayPhoto('" + key + "')");
        }
        if (typeof window.openVoiceSheet === "function") out += chip("소리", "window.openVoiceSheet('" + key + "')");
        if (typeof window.openNoteSheet === "function")  out += chip("한 줄", "window.openNoteSheet('" + key + "')");
        if (!out) return "";
        return '<div style="display:flex; gap:6px; margin-top:15px; padding-top:13px; border-top:1px dashed var(--border);">' + out + '</div>';
    }

    // 기록이 하나도 없는 날에도 사진은 담을 수 있어야 한다.
    function todayPhotoBar() {
        var key = dayKeyOf(Date.now());
        var n = window.getDayPhotos ? window.getDayPhotos(key).length : 0;
        var dd = ddayOf(key);
        return '<div onclick="window.addDayPhoto(\'' + key + '\')" style="display:flex; justify-content:space-between; align-items:center; padding:17px 18px; border:1px dashed var(--border); border-radius:18px; margin-bottom:14px; cursor:pointer;">' +
            '<span style="font-size:13.5px; font-weight:800; color:var(--text-m);">' +
                (n ? "오늘 사진 한 장 더 담기" : "오늘 사진 담기") + '</span>' +
            '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">' +
                (dd ? esc(dd) : "오늘") + (n ? "  ·  " + n + "장" : "") + '</span>' +
        '</div>';
    }

    /* ---------- 보관함 ----------
       편지함·소리함·문답함·첫도감·포토북·잠무늬.
       3구에 넣으려니 소리함과 문답함이 서로 자리를 뺏었다.
       한 격자로 펴면 다 보이고, 비어 있는 칸도 초대장이 된다. -------- */

    function boxGrid(s) {
        var pro = (typeof window.isPremium !== "function") || window.isPremium();
        var vN  = (typeof window.voiceCount === "function") ? window.voiceCount() : 0;
        var dN  = (typeof window.diaryCount === "function") ? window.diaryCount() : 0;
        var lock = (typeof window.lockChip === "function") ? window.lockChip("프리미엄") : "";

        var items = [
            { icon: "💌", label: "편지함", sub: "쌓인 편지 읽기",
              act: "window.openLetterBox()" },
            { icon: "🎙️", label: "소리함", sub: vN ? vN + "개 담겼어요" : "아직 비어 있어요",
              act: vN ? "window.openVoiceBox()" : "window.openVoiceSheet()" },
            { icon: "💬", label: "문답함", sub: dN ? dN + "개의 대화" : "아직 비어 있어요",
              act: "window.openDiaryBox && window.openDiaryBox()" },
            { icon: "🏅", label: "첫 도감", sub: milestoneSub(s),
              act: "window.openMilestoneModal && window.openMilestoneModal()" },
            { icon: "📖", label: "포토북", sub: pro ? "한 권으로 내보내기" : null,
              act: "window.exportMemoryBook && window.exportMemoryBook()" },
            { icon: "🌙", label: "잠 무늬", sub: "이레 동안의 결",
              act: "window.openSleepMap && window.openSleepMap()" }
        ];

        return '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:8px;">' +
            items.map(function (it) {
                return '<div onclick="' + it.act + '" style="background:var(--bg-card); border:1px solid var(--border); ' +
                    'border-radius:18px; padding:15px 8px; text-align:center; cursor:pointer;">' +
                    '<div style="font-size:20px; margin-bottom:7px; line-height:1;">' + it.icon + '</div>' +
                    '<div style="font-size:12px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px; margin-bottom:4px;">' +
                        esc(it.label) + '</div>' +
                    (it.sub === null ? lock
                        : '<div style="font-size:10px; font-weight:700; color:var(--text-sub); line-height:1.35;">' + esc(it.sub) + '</div>') +
                '</div>';
            }).join("") +
        '</div>';
    }

    // 도감에 사진이 몇 장 붙었는지. 빈자리가 곧 다음에 찍을 사진 목록이다.
    function milestoneSub(s) {
        if (typeof window.milestonePhotoCount !== "function" || !s.firsts) return "해낸 일 모아보기";
        var n = window.milestonePhotoCount();
        return n ? "사진 " + n + " / " + s.firsts + "장" : "사진은 아직 없어요";
    }

    function shortcut(icon, title, sub, action) {
        return '<div onclick="' + action + '" style="flex:1; background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:18px 12px; text-align:center; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,0.03);">' +
            '<div style="font-size:22px; margin-bottom:9px;">' + icon + '</div>' +
            '<div style="font-size:13px; font-weight:800; color:var(--text-m); margin-bottom:3px;">' + title + '</div>' +
            '<div style="font-size:11px; font-weight:600; color:var(--text-sub);">' + sub + '</div>' +
        '</div>';
    }

    function dayCard(d) {
        var date = parseKey(d.key);
        var dday = ddayOf(d.key);
        var inner = "";

        // 기념일이 맨 위. 그날이 무슨 날이었는지가 먼저다.
        if (typeof window.renderAnniversary === "function") {
            inner += window.renderAnniversary(d.key);
        }

        // 사진이 먼저. 배냇함을 열면 글자보다 얼굴이 먼저 나와야 한다.
        if (typeof window.renderPhotoStrip === "function") {
            inner += window.renderPhotoStrip(d.key);
        }

        // 소리는 사진 바로 아래. 얼굴 다음은 목소리다.
        if (typeof window.renderVoiceRow === "function") {
            inner += window.renderVoiceRow(d.key);
        }

        // 첫 순간 — 여러 개여도 라벨은 한 번만. 배지가 반복되면 정작 이름이 묻힌다.
        if (d.milestones.length) {
            var msLabel = d.milestones.length > 1
                ? "처음 해낸 일 " + d.milestones.length + "가지"
                : "처음 해낸 일";
            inner +=
            '<div style="margin-bottom:18px;">' +
                '<div style="display:inline-block; font-size:10.5px; font-weight:800; color:#7F77DD; background:rgba(127,119,221,0.12); padding:3px 9px; border-radius:8px; letter-spacing:0.5px; margin-bottom:14px;">' + esc(msLabel) + '</div>';
            d.milestones.forEach(function (m, i) {
                var thumb = (typeof window.renderMilestonePhoto === "function")
                    ? window.renderMilestonePhoto(d.key, m.id) : "";
                inner +=
                '<div style="display:flex; gap:11px; align-items:flex-start; ' + (i ? 'margin-top:16px;' : '') + '">' +
                    '<div style="width:5px; height:5px; border-radius:50%; background:#7F77DD; margin-top:9px; flex-shrink:0;"></div>' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div class="serif-display" style="font-size:18px; font-weight:700; color:var(--text-title); line-height:1.45; margin-bottom:4px; word-break:keep-all;">' + esc(m.title) + '</div>' +
                        (m.desc ? '<div style="font-size:12.5px; font-weight:500; color:var(--text-sub); line-height:1.6; word-break:keep-all;">' + esc(m.desc) + '</div>' : '') +
                        (typeof window.renderMilestoneVoice === "function" ? window.renderMilestoneVoice(m.id) : '') +
                    '</div>' +
                    thumb +
                '</div>';
            });
            inner += '</div>';
        }
        // 아기가 보낸 편지
        if (d.letter) {
            var line = String(d.letter.ms || d.letter.text || "").split("\n")[0];
            inner +=
            '<div onclick="window.openLetterBox()" style="margin-bottom:14px; cursor:pointer;">' +
                '<div style="font-size:10.5px; font-weight:800; color:var(--text-sub); letter-spacing:1.5px; margin-bottom:9px;">오늘의 편지</div>' +
                '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:20px; line-height:1.6; color:var(--text-m); letter-spacing:0.3px; word-break:keep-all;">' + esc(line) + '</div>' +
            '</div>';
        }

        // 부모가 남긴 답장
        d.replies.forEach(function (r) {
            var color = r.slot === "dad" ? "#3182F6" : "#7F77DD";
            inner +=
            '<div style="margin-bottom:12px; padding:13px 15px; background:' + (r.slot === "dad" ? "rgba(49,130,246,0.06)" : "rgba(127,119,221,0.06)") + '; border-left:3px solid ' + color + '; border-radius:0 12px 12px 0;">' +
                '<div style="font-size:10.5px; font-weight:800; color:' + color + '; letter-spacing:1.5px; margin-bottom:6px;">' + esc(r.who) + '의 답장</div>' +
                '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:19px; line-height:1.6; color:var(--text-m); white-space:pre-line; word-break:keep-all;">' + esc(r.text) + '</div>' +
            '</div>';
        });

        // 키와 몸무게
        if (d.growth) {
            var bits = [];
            if (d.growth.height) bits.push("키 " + d.growth.height + "cm");
            if (d.growth.weight) bits.push("몸무게 " + d.growth.weight + "kg");
            inner +=
            '<div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--border); font-size:12px; font-weight:600; color:var(--text-sub);">' +
                '이날 재본 키와 몸무게 · ' + esc(bits.join("  ·  ")) +
            '</div>';
        }

        // 부부가 나눈 말
        if (typeof window.renderDiaryRow === "function") {
            inner += window.renderDiaryRow(d.key);
        }

        // 부모의 한 줄은 맨 마지막. 하루를 닫는 글이다.
        if (typeof window.renderNoteRow === "function") {
            inner += window.renderNoteRow(d.key);
        }

        if (!inner) return "";

        // 그 자리에서 바로 담을 수 있게
        inner += addRow(d.key);

        return '<div style="position:relative; background:var(--bg-card); border:1px solid var(--border); border-radius:22px; padding:24px 22px; margin-bottom:16px; box-shadow:0 4px 16px rgba(0,0,0,0.03);">' +
            '<div style="position:absolute; left:-27px; top:30px; width:11px; height:11px; border-radius:50%; background:#7F77DD; border:3px solid var(--bg-main); box-shadow:0 0 0 1px rgba(127,119,221,0.25);"></div>' +
            '<div style="display:flex; align-items:baseline; gap:8px; margin-bottom:18px;">' +
                '<span class="serif-display" style="font-size:17px; font-weight:700; color:var(--text-title);">' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일</span>' +
                '<span style="font-size:12px; font-weight:600; color:var(--text-sub);">' + WEEK[date.getDay()] + '요일</span>' +
                (dday ? '<span style="font-size:11px; font-weight:700; color:#7F77DD; margin-left:auto;">' + dday + '</span>' : '') +
            '</div>' +
            inner +
        '</div>';
    }

    // 연대기의 바닥. 배냇함은 여기서 시작한다.
    function birthCard() {
        var b = birthTime();
        if (!b) return "";
        var d = new Date(b);
        return '<div style="position:relative; background:rgba(127,119,221,0.06); border:1px solid rgba(127,119,221,0.18); border-radius:22px; padding:28px 22px; margin-top:6px; text-align:center;">' +
            '<div style="position:absolute; left:-27px; top:34px; width:11px; height:11px; border-radius:50%; background:#7F77DD; border:3px solid var(--bg-main);"></div>' +
            '<div style="font-size:10.5px; font-weight:800; color:#7F77DD; letter-spacing:2px; margin-bottom:12px;">D+0</div>' +
            '<div class="serif-display" style="font-size:20px; font-weight:700; color:var(--text-title); line-height:1.5; margin-bottom:8px;">' +
                esc(babyName()) + '가 세상에 온 날</div>' +
            '<div style="font-size:13px; font-weight:600; color:var(--text-sub);">' +
                d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일</div>' +
        '</div>';
    }

    /* ---------- 연대기 서랍 ----------
       하루씩 쌓이면 1년에 카드가 이백 장이 된다.
       피드로 줄줄이 내려가면 '첫 목욕이 언제였지'를 못 찾는다.

       실제 배냇함에도 칸막이가 있다. 연도 탭, 월 칸,
       그리고 열려 있는 달 안에만 주 구분선. -------- */

    var openYear = null;      // 지금 보고 있는 연도
    var openMonth = null;     // 펼쳐둔 달 (YYYY-M)

    function ymOf(key) {
        var d = parseKey(key);
        return d.getFullYear() + "-" + (d.getMonth() + 1);
    }

    function groupTimeline(timeline) {
        var years = {};
        timeline.forEach(function (d) {
            var dt = parseKey(d.key);
            var y = dt.getFullYear(), m = dt.getMonth() + 1;
            if (!years[y]) years[y] = {};
            if (!years[y][m]) years[y][m] = [];
            years[y][m].push(d);
        });
        return years;
    }

    window.mbGoYear = function (y) {
        openYear = Number(y);
        openMonth = null;                     // 그 해에서 가장 최근 달이 열린다
        window.renderMemoryBox();
        var box = document.getElementById("mb-chronicle");
        if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.mbToggleMonth = function (ym) {
        openMonth = (openMonth === ym) ? null : ym;
        window.renderMemoryBox();
        var el = document.getElementById("mb-m-" + ym);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // 한 달 안에서 주 구분. 카드가 적으면 오히려 방해라 넉넉할 때만 넣는다.
    function weekLabel(key) {
        var d = parseKey(key);
        var w = Math.ceil(d.getDate() / 7);
        return ["첫째 주", "둘째 주", "셋째 주", "넷째 주", "다섯째 주"][Math.min(w, 5) - 1];
    }

    function yearTabs(years, cur) {
        var list = Object.keys(years).map(Number).sort(function (a, b) { return b - a; });
        if (list.length < 2) return "";
        return '<div style="display:flex; gap:7px; margin-bottom:14px; overflow-x:auto; -webkit-overflow-scrolling:touch;">' +
            list.map(function (y) {
                var on = (y === cur);
                return '<div onclick="window.mbGoYear(' + y + ')" style="flex-shrink:0; padding:8px 15px; border-radius:12px; cursor:pointer; ' +
                    'font-size:12.5px; font-weight:800; letter-spacing:-0.2px; ' +
                    (on ? 'background:#7F77DD; color:#FFF;' : 'background:var(--bg-sub); color:var(--text-sub);') + '">' +
                    y + '년</div>';
            }).join("") +
        '</div>';
    }

    function monthStrip(months, year, cur) {
        var cells = "";
        for (var m = 1; m <= 12; m++) {
            var has = !!months[m];
            var ym = year + "-" + m;
            var on = has && (ym === cur);
            cells += '<div' + (has ? ' onclick="window.mbToggleMonth(\'' + ym + '\')"' : '') + ' ' +
                'style="flex:1; text-align:center; padding:9px 0; border-radius:10px; ' +
                'font-size:11.5px; font-weight:800; letter-spacing:-0.3px; ' +
                (on ? 'background:rgba(127,119,221,0.14); color:#7F77DD;'
                    : has ? 'color:var(--text-s); cursor:pointer;'
                          : 'color:var(--text-sub); opacity:0.32;') + '">' +
                m + '월' +
                (has ? '<div style="width:3px; height:3px; border-radius:50%; background:' + (on ? '#7F77DD' : 'var(--border)') + '; margin:3px auto 0;"></div>'
                     : '<div style="height:6px;"></div>') +
            '</div>';
        }
        return '<div style="display:flex; gap:1px; background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:16px; padding:5px 4px; margin-bottom:20px;">' + cells + '</div>';
    }

    function monthRow(year, m, days, isOpen) {
        var ym = year + "-" + m;
        var age = monthAgeLabel(days[0].key);
        return '<div id="mb-m-' + ym + '" onclick="window.mbToggleMonth(\'' + ym + '\')" ' +
            'style="position:relative; display:flex; justify-content:space-between; align-items:center; ' +
            'padding:14px 2px; margin:' + (isOpen ? '26px 0 14px' : '0') + '; cursor:pointer;' +
            (isOpen ? '' : ' border-bottom:1px solid var(--border);') + '">' +
            '<div style="position:absolute; left:-29px; top:50%; margin-top:-4px; width:7px; height:7px; border-radius:50%; ' +
                'background:' + (isOpen ? '#7F77DD' : 'var(--border)') + '; border:3px solid var(--bg-main);"></div>' +
            '<span style="font-size:' + (isOpen ? '13.5' : '13') + 'px; font-weight:800; color:' +
                (isOpen ? 'var(--text-m)' : 'var(--text-sub)') + '; letter-spacing:-0.2px;">' +
                m + '월' + esc(age) + '</span>' +
            '<span style="font-size:11.5px; font-weight:700; color:var(--text-sub);">' +
                days.length + '일' + (isOpen ? '' : '  ›') + '</span>' +
        '</div>';
    }

    /* ---------- 배냇함 그리기 ---------- */

    window.renderMemoryBox = function () {
        var box = document.getElementById("tab-memorybox");
        if (!box) return;

        var name = babyName();
        var s = summary();
        var timeline = buildTimeline();

        var body = "";
        if (!timeline.length) {
            body =
            '<div style="text-align:center; padding:70px 24px;">' +
                '<div style="font-size:40px; margin-bottom:20px;">🧺</div>' +
                '<div class="serif-display" style="font-size:19px; font-weight:700; color:var(--text-m); line-height:1.6; margin-bottom:12px;">아직 배냇함이 비어 있어요</div>' +
                '<div style="font-size:13px; font-weight:500; color:var(--text-sub); line-height:1.8;">' +
                    '사진 한 장이면 충분해요<br>오늘부터 하나씩 담기기 시작합니다' +
                '</div>' +
            '</div>';
        } else {
            var years = groupTimeline(timeline);
            var yearList = Object.keys(years).map(Number).sort(function (a, b) { return b - a; });

            // 처음 열면 가장 최근 해의 가장 최근 달
            if (openYear === null || !years[openYear]) openYear = yearList[0];
            var months = years[openYear];
            var monthList = Object.keys(months).map(Number).sort(function (a, b) { return b - a; });
            if (!openMonth || openMonth.split("-")[0] != openYear || !months[Number(openMonth.split("-")[1])]) {
                openMonth = openYear + "-" + monthList[0];
            }

            body += yearTabs(years, openYear);
            body += monthStrip(months, openYear, openMonth);

            monthList.forEach(function (m) {
                var ym = openYear + "-" + m;
                var days = months[m];
                var isOpen = (ym === openMonth);

                body += monthRow(openYear, m, days, isOpen);
                if (!isOpen) return;

                // 카드가 많을 때만 주 구분선. 적으면 오히려 방해다.
                var showWeeks = days.length >= 8;
                var lastWeek = "";
                days.forEach(function (d) {
                    if (showWeeks) {
                        var w = weekLabel(d.key);
                        if (w !== lastWeek) {
                            lastWeek = w;
                            body += '<div style="position:relative; font-size:10.5px; font-weight:800; color:var(--text-sub); ' +
                                'letter-spacing:1.8px; margin:20px 4px 12px; opacity:0.75;">' +
                                '<div style="position:absolute; left:-27px; top:1px; width:5px; height:5px; border-radius:50%; ' +
                                    'background:var(--border); border:2px solid var(--bg-main);"></div>' +
                                esc(w) + '</div>';
                        }
                    }
                    body += dayCard(d);
                });
            });
        }

        box.innerHTML =
        '<div style="padding:0 20px 110px;">' +
            '<div style="padding:26px 0 22px;">' +
                '<div class="serif-display" style="font-size:25px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px; margin-bottom:8px;">' + esc(name) + '의 배냇함</div>' +
                '<div style="font-size:13px; font-weight:600; color:var(--text-sub);">간직하고 싶은 순간들을 모아뒀어요</div>' +
            '</div>' +

            '<div style="display:flex; background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:22px 12px; margin-bottom:14px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">' +
                statBox(s.together, "함께한 날") +
                '<div style="width:1px; background:var(--border);"></div>' +
                statBox(s.firsts, "처음 해낸 일") +
                '<div style="width:1px; background:var(--border);"></div>' +
                statBox(s.letters, "받은 편지") +
            '</div>' +

            (typeof window.renderNextAnniversary === "function" ? window.renderNextAnniversary() : "") +
            unsyncedWarning() +
            (typeof window.renderSealedBar === "function" ? window.renderSealedBar() : "") +
            todayBar() +

            boxGrid(s) +

            (timeline.length || birthTime() ? '<div id="mb-chronicle" style="display:flex; justify-content:space-between; align-items:baseline; margin:36px 4px 18px;">' +
                '<span style="font-size:12px; font-weight:800; color:var(--text-sub); letter-spacing:2px;">연대기</span>' +
                (timeline.length ? '<span style="font-size:11px; font-weight:700; color:var(--text-sub); opacity:0.7;">' + timeline.length + '일이 담겼어요</span>' : '') +
            '</div>' : '') +
            (timeline.length || birthTime() ?
                '<div style="position:relative; padding-left:28px;">' +
                    '<div style="position:absolute; left:5px; top:6px; bottom:24px; width:1px; background:var(--border);"></div>' +
                    body + birthCard() +
                '</div>' : '') +

            (timeline.length ? '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:36px; line-height:1.8;">' +
                (localStorage.getItem("family_sync_code")
                    ? '가족 연동이 되어 있어 안전하게 보관됩니다'
                    : '여기 담긴 건 이 기기에만 있어요') +
                '<br>' + esc(name) + '가 자라는 만큼 배냇함도 무거워집니다' +
            '</div>' : '') +
        '</div>';
    };

    /* ---------- 탭을 열 때 다시 그린다 (원본 수정 없음) ---------- */

    var origSwitchTab = window.switchTab;
    window.switchTab = function (id, el) {
        var out;
        try {
            if (typeof origSwitchTab === "function") out = origSwitchTab.apply(this, arguments);
        } finally {
            if (id === "memorybox") {
                try { window.renderMemoryBox(); } catch (e) { console.warn("[배냇함]", e); }
            }
        }
        return out;
    };

    /* ---------- 손글씨 폰트 (혹시 없을 때 대비) ---------- */

    (function ensureFont() {
        if (document.getElementById("mb-pen-font")) return;
        var link = document.createElement("link");
        link.id = "mb-pen-font";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap";
        document.head.appendChild(link);
    })();

    /* ---------- 점검용 ---------- */
    window.memoryBoxDebug = function () {
        var t = buildTimeline();
        console.log("배냇함에 담긴 날:", t.length + "일");
        console.log("요약:", summary());
        t.slice(0, 5).forEach(function (d) {
            console.log("  " + d.key + " → 첫순간 " + d.milestones.length + " / 편지 " + (d.letter ? 1 : 0) + " / 답장 " + d.replies.length + " / 성장 " + (d.growth ? 1 : 0));
        });
        return t;
    };
})();