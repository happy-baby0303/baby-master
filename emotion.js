/* ============================================================
   육아메이트 — 감성 엔진
   1) 오늘의 편지   : 아기 시점 손편지 (밤 8시부터)
   2) 오늘 당신     : 부모가 움직인 횟수
   3) 지나간 순간   : 마지막인 줄 몰랐던 마지막

   기존 코드는 한 줄도 고치지 않습니다.
   index.html 에서 script.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var LEDGER_KEY = 'tosil_life_ledger';
    var DAY = 86400000;
    var DAWN_END = 5;      // 0시~5시를 '새벽'으로 본다
    var GAP_DAYS = 7;      // 며칠 안 나타나면 '지나간 순간'이 된다
    var GAP_MAX = 120;     // 너무 오래된 건 그만 보여준다
    var MIN_DAYS = 10;     // 기록이 이만큼 쌓여야 판단한다
    var LETTER_HOUR = 20;  // 밤 8시부터 편지가 뜬다

    /* ---------- 작은 도구들 ---------- */

    function dayKey(ts) {
        var d = new Date(ts);
        return d.getFullYear() + '-' +
               String(d.getMonth() + 1).padStart(2, '0') + '-' +
               String(d.getDate()).padStart(2, '0');
    }

    function todayKey() { return dayKey(Date.now()); }

    function fmtWhen(ts) {
        var d = new Date(ts);
        var h = d.getHours();
        var period = h < 5 ? '새벽' : (h < 12 ? '아침' : (h < 18 ? '낮' : '밤'));
        var hh = h % 12; if (hh === 0) hh = 12;
        return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' +
               period + ' ' + hh + '시 ' + d.getMinutes() + '분';
    }

    function daysAgo(ts) { return Math.floor((Date.now() - ts) / DAY); }

    // 날짜를 씨앗으로 쓰는 고정 랜덤. 화면이 새로고침돼도 문구가 안 바뀐다.
    function pickStable(arr, salt) {
        var k = todayKey() + (salt || '');
        var sum = 0;
        for (var i = 0; i < k.length; i++) sum += k.charCodeAt(i);
        return arr[sum % arr.length];
    }

    function babyName() {
        return localStorage.getItem('tosil_babyName') || '우리 아기';
    }

    function myTitle() {
        return (localStorage.getItem('user_role') || 'mom') === 'dad' ? '아빠' : '엄마';
    }

    function fill(text) {
        var me = myTitle();
        var partner = me === '아빠' ? '엄마' : '아빠';
        return String(text).replace(/{me}/g, me)
                           .replace(/{partner}/g, partner)
                           .replace(/{name}/g, babyName());
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ---------- 평생 장부 ----------
       기록(tosil_tracker_records)은 100개까지만 남는다.
       그래서 날짜별 횟수와 '마지막 순간'만 따로 영구 보관한다. */

    // 기록 하나를 구분하는 이름표. id가 없는 옛 기록도 안전하게 처리한다.
    function recId(r) {
        if (r && r.id) return String(r.id);
        return (r && r.type ? r.type : '?') + '_' + (r && r.timestamp ? r.timestamp : '0');
    }

    function sleepRange(r) {
        var start = Number(r.timestamp);
        var end = r.endTs ? Number(r.endTs) : start + ((Number(r.amount) || 0) * 60000);
        return { start: start, end: end };
    }

    // 수면 하나를 날짜 경계로 잘라 각 날의 [시작분, 끝분] 목록에 넣는다.
    // 최근 3일은 매번 다시 만들고(수정·삭제 자가 치유), 그보다 오래된 날은 한 번 쌓고 유지한다.
    function collectSleepSegs(ledger, records) {
        var changed = false;
        var base = new Date(); base.setHours(0, 0, 0, 0);
        var recentStart = base.getTime() - 2 * DAY;
        var rebuilt = {};

        records.forEach(function (r) {
            if (!r || r.type !== "sleep") return;
            var sr = sleepRange(r);
            if (!(sr.end > sr.start)) return;
            var cur = new Date(sr.start); cur.setHours(0, 0, 0, 0);
            var guard = 0;
            while (cur.getTime() < sr.end && guard++ < 4) {
                var dStart = cur.getTime();
                var a = Math.max(sr.start, dStart);
                var b = Math.min(sr.end, dStart + DAY);
                if (b > a) {
                    var key = dayKey(dStart);
                    var seg = [Math.round((a - dStart) / 60000), Math.round((b - dStart) / 60000)];
                    if (dStart >= recentStart) {
                        if (!rebuilt[key]) rebuilt[key] = [];
                        rebuilt[key].push(seg);
                    } else if (ledger.days[key]) {
                        if (!ledger.days[key].segs) ledger.days[key].segs = [];
                        var dup = ledger.days[key].segs.some(function (g) { return g[0] === seg[0] && g[1] === seg[1]; });
                        if (!dup) { ledger.days[key].segs.push(seg); changed = true; }
                    }
                }
                cur = new Date(dStart + DAY);
            }
        });

        Object.keys(rebuilt).forEach(function (k) {
            if (!ledger.days[k]) ledger.days[k] = { care: 0, dawn: 0, feed: 0, diaper: 0, sleep: 0 };
            rebuilt[k].sort(function (x, y) { return x[0] - y[0]; });
            if (JSON.stringify(ledger.days[k].segs || []) !== JSON.stringify(rebuilt[k])) {
                ledger.days[k].segs = rebuilt[k];
                changed = true;
            }
        });

        return changed;
    }

    function loadLedger() {
        try {
            var raw = localStorage.getItem(LEDGER_KEY);
            if (raw) {
                var l = JSON.parse(raw);
                if (l && l.days && l.last) return l;
            }
        } catch (e) {}
        return { v: 2, days: {}, last: {}, seen: {} };
    }

    function saveLedger(l) {
        try { localStorage.setItem(LEDGER_KEY, JSON.stringify(l)); } catch (e) {}
    }

    function syncLedger() {
        var ledger = loadLedger();
        var records = [];
        try { records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || []; } catch (e) {}

        var tk = todayKey();
        var changed = false;

        // 예전 버전(lastSeenTs 방식)에서 넘어올 때 한 번만 정리
        if (!ledger.seen) {
            ledger.seen = {};
            if (ledger.lastSeenTs) {
                records.forEach(function (r) {
                    var ts = Number(r && r.timestamp);
                    if (ts && ts <= ledger.lastSeenTs) ledger.seen[recId(r)] = 1;
                });
            }
            changed = true;
        }

        // 지난 날들: 처음 보는 기록만 더한다.
        // 시각이 아니라 기록 하나하나를 기준으로 보기 때문에,
        // 과거 시각으로 뒤늦게 입력한 기록도 빠짐없이 들어간다.
        records.forEach(function (r) {
            var ts = Number(r && r.timestamp);
            if (!ts) return;
            var key = dayKey(ts);
            if (key === tk) return;

            var rid = recId(r);
            if (ledger.seen[rid]) return;
            ledger.seen[rid] = 1;
            changed = true;

            if (!ledger.days[key]) ledger.days[key] = { care: 0, dawn: 0, feed: 0, diaper: 0, sleep: 0 };
            var d = ledger.days[key];
            d.care++;
            if (new Date(ts).getHours() < DAWN_END) d.dawn++;
            if (r.type === 'feed') d.feed++;
            else if (r.type === 'diaper') d.diaper++;
            else if (r.type === 'sleep') d.sleep++;
        });

        // 오늘치는 매번 통째로 다시 센다.
        // 기록을 고치거나 지워도 숫자가 스스로 맞아진다.
        var fresh = { care: 0, dawn: 0, feed: 0, diaper: 0, sleep: 0 };
        records.forEach(function (r) {
            var ts = Number(r && r.timestamp);
            if (!ts || dayKey(ts) !== tk) return;
            fresh.care++;
            if (new Date(ts).getHours() < DAWN_END) fresh.dawn++;
            if (r.type === 'feed') fresh.feed++;
            else if (r.type === 'diaper') fresh.diaper++;
            else if (r.type === 'sleep') fresh.sleep++;
        });
        var before = ledger.days[tk];
        if (!before || before.care !== fresh.care || before.dawn !== fresh.dawn) changed = true;
        ledger.days[tk] = fresh;

        // 마지막 순간들 — 오래된 것부터 훑어서, 밀려난 값은 prev에 남긴다.
        // prev가 있어야 "몇 일 만에 다시 나타났는지"를 알 수 있다.
        if (!ledger.prev) ledger.prev = {};
        var dawnRecs = records.filter(function (r) {
            var ts = Number(r && r.timestamp);
            return ts && new Date(ts).getHours() < DAWN_END;
        }).sort(function (a, b) { return a.timestamp - b.timestamp; });

        dawnRecs.forEach(function (r) {
            var ts = Number(r.timestamp);
            if (r.type === "feed") {
                if (!ledger.last.nightFeed) {
                    ledger.last.nightFeed = { ts: ts, amount: Number(r.amount) || 0 }; changed = true;
                } else if (ts > ledger.last.nightFeed.ts) {
                    ledger.prev.nightFeed = { ts: ledger.last.nightFeed.ts };
                    ledger.last.nightFeed = { ts: ts, amount: Number(r.amount) || 0 }; changed = true;
                }
            } else if (r.type === "diaper") {
                if (!ledger.last.dawnDiaper) {
                    ledger.last.dawnDiaper = { ts: ts }; changed = true;
                } else if (ts > ledger.last.dawnDiaper.ts) {
                    ledger.prev.dawnDiaper = { ts: ledger.last.dawnDiaper.ts };
                    ledger.last.dawnDiaper = { ts: ts }; changed = true;
                }
            }
        });

        // 잠든 구간을 날짜별로 쌓는다 (나중에 잠 지도가 이걸 읽는다)
        if (collectSleepSegs(ledger, records)) changed = true;

        if (!changed) return ledger;

        // 하루 8번 넘게 먹던 마지막 날
        var manyDate = null;
        Object.keys(ledger.days).forEach(function (k) {
            if (ledger.days[k].feed >= 8 && (!manyDate || k > manyDate)) manyDate = k;
        });
        if (manyDate) ledger.last.manyFeeds = { date: manyDate, count: ledger.days[manyDate].feed };

        // 400일 넘은 날짜, 800개 넘은 기록표는 정리
        var keys = Object.keys(ledger.days).sort();
        if (keys.length > 400) {
            keys.slice(0, keys.length - 400).forEach(function (k) { delete ledger.days[k]; });
        }
        var ids = Object.keys(ledger.seen);
        if (ids.length > 800) {
            ids.slice(0, ids.length - 800).forEach(function (k) { delete ledger.seen[k]; });
        }

        delete ledger.lastSeenTs;
        saveLedger(ledger);
        return ledger;
    }

    /* ---------- 1. 오늘의 편지 ---------- */

    /* ---------- 1. 오늘의 편지 (P.S. 추신 엔진 추가) ---------- */
    /* ---------- 이모지 제거 ----------
       이모지 그림은 OS 제조사 아트워크다. 화면은 괜찮지만
       이미지로 저장하거나 책으로 인쇄하면 그 그림이 제품에 실려 나간다.
       문장 풀은 그대로 두고, 편지를 지을 때만 걸러낸다. -------- */

    var EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}\u{2122}\u{00A9}\u{00AE}]/gu;

    function stripEmoji(t) {
        return String(t || "")
            .replace(EMOJI_RE, "")
            .replace(/[ \t]{2,}/g, " ")
            .replace(/ +([,.!?~])/g, "$1")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    /* ---------- 부모의 답장 ---------- */

    var REPLIES_KEY = "tosil_replies";
    var editingKey = null;

    // 엄마와 아빠가 각자 한 통씩 남긴다.
    // 옛 구조({date:{text,by}})는 읽을 때 자동으로 새 구조로 바꾼다.
    function loadReplies() {
        var raw = {};
        try { raw = JSON.parse(localStorage.getItem(REPLIES_KEY)) || {}; } catch (e) { return {}; }
        var out = {}, changed = false;
        Object.keys(raw).forEach(function (k) {
            var v = raw[k];
            if (v && typeof v.text === "string") {
                var slot = (v.by === "아빠") ? "dad" : "mom";
                out[k] = {};
                out[k][slot] = { text: v.text, at: v.at || Date.now() };
                changed = true;
            } else {
                out[k] = v || {};
            }
        });
        if (changed) { try { localStorage.setItem(REPLIES_KEY, JSON.stringify(out)); } catch (e) {} }
        return out;
    }

    function myRoleSlot() { return myTitle() === "아빠" ? "dad" : "mom"; }
    function slotTitle(slot) { return slot === "dad" ? "아빠" : "엄마"; }
    function saveReplies(o) {
        try { localStorage.setItem(REPLIES_KEY, JSON.stringify(o)); } catch (e) {}
    }

    /* ---------- 편지함: 저장소와 생성기 ---------- */

    var LETTERS_KEY = "tosil_letters";

    function loadLetters() {
        try { return JSON.parse(localStorage.getItem(LETTERS_KEY)) || {}; } catch (e) { return {}; }
    }
    function saveLetters(o) {
        try { localStorage.setItem(LETTERS_KEY, JSON.stringify(o)); } catch (e) {}
    }

    // 날짜를 씨앗으로 쓰는 고정 선택. 같은 날은 몇 번을 열어도 같은 편지가 나온다.
    function seedPick(arr, key) {
        if (!arr || !arr.length) return "";
        var sum = 0;
        for (var i = 0; i < key.length; i++) sum = (sum * 31 + key.charCodeAt(i)) % 1000003;
        return arr[sum % arr.length];
    }

    function dayStats(s0) {
        var records = [];
        try { records = JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; } catch (e) {}
        var e0 = s0 + DAY;
        var st = { milk: 0, breastMins: 0, breastCount: 0, sleepMins: 0, poop: 0, diaper: 0, care: 0, dawn: 0 };
        records.forEach(function (r) {
            var ts = Number(r && r.timestamp);
            if (!ts || ts < s0 || ts >= e0) return;
            st.care++;
            if (new Date(ts).getHours() < DAWN_END) st.dawn++;

            if (r.type === "feed") {
                // 모유는 amount 에 '분'이, 분유·유축은 'ml' 이 들어간다.
                // 이걸 더하면 20분 + 120ml = 140 같은 숫자가 나온다.
                var sub = String(r.subType || "");
                var amt = Number(r.amount) || 0;
                if (sub.indexOf("모유") > -1) { st.breastMins += amt; st.breastCount++; }
                else { st.milk += amt; }
            } else if (r.type === "diaper") {
                st.diaper++;
                if (r.subType && String(r.subType).indexOf("대변") > -1) st.poop++;
            } else if (r.type === "sleep") {
                // 타이머로 잰 잠은 amount 가 비어 있고 endTs 만 있다. 그게 대개 밤잠이다.
                st.sleepMins += r.endTs
                    ? Math.max(0, Math.round((Number(r.endTs) - ts) / 60000))
                    : (Number(r.amount) || 0);
            }
        });
        return st;
    }

    function todayStats() {
        var d0 = new Date(); d0.setHours(0, 0, 0, 0);
        return dayStats(d0.getTime());
    }

    // 영수증 문장 풀(receiptData)로 그날의 편지를 짓는다. 목소리는 하나뿐이다.
    function composeLetter(st, key) {
        // const 선언은 window에 안 붙는다. 전역 이름으로 먼저 찾고, 없으면 window를 본다.
        var rd = null;
        try { if (typeof receiptData !== "undefined" && receiptData) rd = receiptData; } catch (e) {}
        if (!rd) rd = window.receiptData;
        if (!rd || !rd.intro) return "";
        var hours = st.sleepMins / 60;
        var clean = function (x) { return stripEmoji(String(x || "")); };

        // 날짜에서 뽑은 고정 난수. 같은 날은 늘 같은 편지가 나온다.
        var dice = function (salt) {
            var h = 0, t = key + salt;
            for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000;
            return h / 1000;
        };

        // 문단을 매일 똑같이 쌓으면 한 달이면 눈치챈다.
        // 있는 날만 넣고, 가끔은 통째로 뺀다.
        var paras = [];

        paras.push([
            seedPick(rd.intro, key + "a"),
            (hours >= 3) ? seedPick(rd.sleepGood, key + "b") : seedPick(rd.sleepBad, key + "c")
        ]);

        // 새벽에 깬 날 — 부모가 제일 힘든 시간을 아기가 알아봐 주는 자리
        if (st.dawn >= 2 && rd.dawn && rd.dawn.length) {
            paras.push([seedPick(rd.dawn, key + "n")]);
        }

        var body = [];
        var fed = (st.milk >= 700 || st.breastMins >= 120) ? seedPick(rd.feedMuch, key + "d")
                : ((st.milk > 0 || st.breastMins > 0) ? seedPick(rd.feedLittle, key + "e")
                                                      : seedPick(rd.feedZero, key + "f"));
        body.push(fed);
        // 응가 얘기는 다섯 중 넷만. 매일 나오면 편지가 아니라 보고서다.
        if (st.poop > 0 || dice("p") < 0.8) {
            body.push((st.poop > 0) ? seedPick(rd.poopMuch, key + "g") : seedPick(rd.poopZero, key + "h"));
        }
        paras.push(body);

        // 열흘에 한 번쯤 오는 말. 매일 나오면 무뎌진다.
        if (rd.rare && rd.rare.length && dice("r") < 0.12) {
            paras.push([seedPick(rd.rare, key + "z")]);
        }

        paras.push([seedPick(rd.outro, key + "i")]);
        var t = paras.map(function (g) {
            return g.map(clean).filter(function (x) { return x; }).join(" ");
        }).filter(function (x) { return x; }).join("\n\n");
        return stripEmoji(fill(t));
    }

    // 이미 저장된 편지에 남은 이모지를 한 번 걸러낸다
    function cleanStoredLetters() {
        var box = loadLetters();
        var touched = false;
        Object.keys(box).forEach(function (k) {
            var t = stripEmoji(box[k].text);
            if (t !== box[k].text) { box[k].text = t; touched = true; }
        });
        if (touched) saveLetters(box);
    }

    /* ---------- 도감과 연결 ----------
       그날 처음 해낸 것이 있으면 편지 맨 앞에 올라간다. -------- */

    function milestoneTitlesOn(key) {
        var dates = {};
        try { dates = JSON.parse(localStorage.getItem("tosil_milestone_dates")) || {}; } catch (e) {}
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        if (!list) list = window.MILESTONE_DATA;
        if (!list || !list.length) return [];

        var out = [];
        Object.keys(dates).forEach(function (id) {
            var ts = Number(dates[id]);
            if (!ts || dayKey(ts) !== key) return;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === id) { out.push(stripEmoji(list[i].title)); break; }
            }
        });
        return out;
    }

    function milestoneLine(key) {
        var t = milestoneTitlesOn(key);
        if (!t.length) return "";
        if (t.length === 1) {
            return fill(seedPick([
                "오늘 나 ‘" + t[0] + "’ 처음 해냈다! {me}가 엄청 좋아했어.",
                "드디어 ‘" + t[0] + "’ 도장 찍었다. {me}가 사진을 엄청 찍었어.",
                "오늘 ‘" + t[0] + "’ 해냈다. 나 좀 대단하지?"
            ], key + "ms"));
        }
        return fill("오늘 나 ‘" + t[0] + "’ 포함해서 " + t.length + "가지를 처음 해냈다! {me}가 깜짝 놀랐어.");
    }

    function saveTodayLetter() {
        // 편지는 하루가 닫힌 뒤에 쓴다. 아침에 두 번 기록했다고
        // 그날의 편지가 완성될 수는 없다.
        if (typeof window.isWindDownTime === "function" && !window.isWindDownTime()) return;
        var st = todayStats();
        if (st.care < 2) return;
        var key = todayKey();
        var text = composeLetter(st, key);
        if (!text) return;
        var ms = milestoneLine(key);
        var box = loadLetters();
        var cur = box[key];
        if (cur && cur.text === text && cur.ms === ms && cur.milk === st.milk && cur.sleepMins === st.sleepMins && cur.poop === st.poop) return;
        box[key] = { text: text, ms: ms, milk: st.milk, breastMins: st.breastMins, breastCount: st.breastCount, sleepMins: st.sleepMins, poop: st.poop, care: st.care, dawn: st.dawn };
        var keys = Object.keys(box).sort();
        if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(function (k) { delete box[k]; });
        saveLetters(box);
    }

    // 설치 전에 쌓인 기록으로 지난 편지를 뒤늦게 써둔다
    function backfillLetters() {
        var records = [];
        try { records = JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; } catch (e) {}
        if (!records.length) return;
        var box = loadLetters();
        var tk = todayKey();
        var seenDays = {};
        var touched = false;

        records.forEach(function (r) {
            var ts = Number(r && r.timestamp);
            if (!ts) return;
            var d = new Date(ts); d.setHours(0, 0, 0, 0);
            var key = dayKey(d.getTime());
            if (key === tk || seenDays[key] || box[key]) return;
            seenDays[key] = 1;
            var st = dayStats(d.getTime());
            if (st.care < 2) return;
            var text = composeLetter(st, key);
            if (!text) return;
            box[key] = { text: text, ms: milestoneLine(key), milk: st.milk, breastMins: st.breastMins, breastCount: st.breastCount, sleepMins: st.sleepMins, poop: st.poop, care: st.care, dawn: st.dawn };
            touched = true;
        });
        if (touched) saveLetters(box);
    }

    // 영수증이 이 함수를 불러서 같은 편지를 인화한다
    window.getTodayLetter = function () {
        var l = loadLetters()[todayKey()];
        if (!l) return "";
        return l.ms ? (l.ms + "\n\n" + l.text) : l.text;
    };

    function firstSentence(t) {
        t = String(t).replace(/\s+/g, " ").trim();
        var cut = -1;
        ["。", ". ", "! ", "? ", "요 ", "야 "].forEach(function (m) {
            var i = t.indexOf(m);
            if (i > -1 && (cut === -1 || i < cut)) cut = i + m.length;
        });
        if (cut === -1 || cut > 80) return t.length > 80 ? t.slice(0, 78).trim() + "…" : t;
        var head = t.slice(0, cut).trim();
        if (head.length < 18 && t.length > cut) {
            var rest = firstSentence(t.slice(cut));
            head = (head + " " + rest).trim();
        }
        return head.length > 80 ? head.slice(0, 78).trim() + "…" : head;
    }

    function buildLetter(ledger) {
        // 🚨 기존 8시 고정 삭제! -> bedtime.js의 스마트 육퇴 판독기로 교체!
        if (!(window.isWindDownTime && window.isWindDownTime())) return '';

        var today = ledger.days[todayKey()];
        if (!today || today.care < 2) return '';

        var records = [];
        try { records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || []; } catch (e) {}

        var start = new Date(); start.setHours(0, 0, 0, 0);
        var startTs = start.getTime();
        var milk = 0, sleepMins = 0;
        records.forEach(function (r) {
            if (!r || r.timestamp < startTs) return;
            if (r.type === 'feed' && r.amount) milk += Number(r.amount) || 0;
            if (r.type === 'sleep' && r.amount) sleepMins += Number(r.amount) || 0;
        });

        var lines;
        if (today.dawn >= 2) {
            lines = [
                '새벽에 자꾸 깨워서 미안해. 그래도 {me} 냄새 맡으면 바로 안심돼.',
                '아까 새벽에 눈 떴는데 {me}가 있어서 다시 잠들었어.',
                '오늘 밤엔 조금 더 자볼게. 진짜로.'
            ];
        } else if (sleepMins > 0 && sleepMins < 240) {
            lines = [
                '오늘 나 ' + sleepMins + '분밖에 못 잤는데 계속 안아줘서 고마워.',
                '잠이 안 왔어. 근데 {me} 품에서는 좀 괜찮았어.',
                '오늘은 잠이랑 싸웠어. {me}도 같이 싸워줬지.'
            ];
        } else if (milk >= 700) {
            lines = [
                '오늘 ' + milk + 'ml나 먹었어. 나 쑥쑥 크고 있지?',
                '많이 먹었더니 배가 볼록해. {me} 덕분이야.',
                '오늘은 진짜 잘 먹었어. 내일도 부탁해.'
            ];
        } else {
            lines = [
                '오늘도 옆에 있어줘서 고마워. 내일도 잘 부탁해.',
                '{me}가 오늘 몇 번이나 나한테 왔는지 나는 다 알아.',
                '나는 아직 말을 못 하지만, 다 느끼고 있어.'
            ];
        }

        var storedToday = loadLetters()[todayKey()];
        var text = storedToday && storedToday.text
            ? firstSentence(storedToday.ms || storedToday.text)
            : fill(pickStable(lines, 'letter'));
        
        // 🌟 [추가됨] 트래커 데이터 기반 P.S. (추신) 엔진
        var psLines = [];
        if (today.diaper >= 5) psLines.push('P.S. 오늘 내 엉덩이 보송하게 지켜줘서 고마워 🍑 냄새났지 ㅋㅋㅋ');
        if (today.dawn >= 2) psLines.push('P.S. 아까 비몽사몽 안아줄 때, {me} 심장소리 진짜 좋았어 🌙');
        if (milk >= 800) psLines.push('P.S. 나 오늘 엄청 잘 먹었지? 칭찬해 줘 🍼');
        
        var psText = '';
        if (psLines.length > 0) {
            psText = '<div style="margin-top: 14px; font-size: 16px; color: #F04452; font-family: \'Nanum Pen Script\', cursive;">' + fill(pickStable(psLines, 'ps')) + '</div>';
        }

        var dday = '';
        var el = document.getElementById('res-baby-dday');
        if (el && el.innerText && el.innerText.indexOf('D') === 0) dday = el.innerText.trim();

        return '' +
        '<div class="hide-on-senior" style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px; margin-bottom:24px; box-shadow:0 8px 24px rgba(0,0,0,0.04); position:relative; overflow:hidden;">' +
            // 편지지 귀퉁이 테이프 포인트
            '<div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); width:60px; height:20px; background:rgba(0,0,0,0.05); transform: rotate(-2deg);"></div>' +
            '<div style="font-size:11px; font-weight:800; color:#B0B8C1; letter-spacing:2px; margin-bottom:16px;">TODAY\'S LETTER</div>' +
            '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:24px; line-height:1.6; color:var(--text-m); letter-spacing:0.5px; word-break:keep-all;">' + esc(text) + '</div>' +
            psText +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">' +
                '<div onclick="window.openLetterBox()" style="font-size:12.5px; font-weight:700; color:#7F77DD; cursor:pointer;">편지 전체 읽기 ›</div>' +
                '<div style="font-size:12px; font-weight:600; color:var(--text-sub);">— ' + esc(babyName()) + (dday ? ' · ' + esc(dday) : '') + '</div>' +
            '</div>' +
        '</div>';
    }

    /* ---------- 2. 오늘 당신 ---------- */

    function buildParentCount(ledger) {
        var today = ledger.days[todayKey()];
        if (!today || today.care < 2) return '';

        var ym = todayKey().slice(0, 7);
        var month = 0, total = 0;
        Object.keys(ledger.days).forEach(function (k) {
            var n = ledger.days[k].care || 0;
            total += n;
            if (k.indexOf(ym) === 0) month += n;
        });

        // 🌟 [추가됨] 방문 횟수에 따른 훈장 수여식
        var gradeMsg = '';
        if (today.care >= 20) gradeMsg = "✨ 오늘 하루 '1분 대기조' 명예 훈장을 드려요.";
        else if (today.dawn >= 3) gradeMsg = "🦉 '새벽의 수호자' 임명장 쾅쾅!";
        else if (today.care <= 5) gradeMsg = "🕊️ 오늘은 우리 서로 조금 여유로웠네요.";

        var sub = '';
        if (today.dawn > 0) sub = '그중 ' + today.dawn + '번은 모두가 잠든 새벽이었고요.';
        else sub = '오늘은 새벽에 한 번도 안 깼네요. 기적 같은 날이에요.';

        var tail = '';
        if (total > 0 && total % 100 === 0) {
            tail = '<div style="font-size:13px; font-weight:800; color:#3182F6; margin-top:10px; background:#E8F3FF; padding:8px 12px; border-radius:10px; display:inline-block;">🎉 와! 저한테 달려온 게 딱 ' + total.toLocaleString() + '번이 된 기념일이에요!</div>';
        } else if (total >= 50) {
            tail = '<div style="font-size:12.5px; font-weight:600; color:var(--text-sub); margin-top:8px;">앱 기록을 시작한 뒤로 모두 ' + total.toLocaleString() + '번 안아줬어요.</div>';
        }

        return '' +
        '<div class="hide-on-senior" style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:22px; margin-bottom:16px; box-shadow:0 4px 12px rgba(0,0,0,0.02);">' +
            '<div style="font-size:11.5px; font-weight:800; color:var(--text-sub); letter-spacing:1px; margin-bottom:12px;">오늘의 ' + esc(myTitle()) + '</div>' +
            '<div style="display:flex; align-items:baseline; gap:6px; margin-bottom:6px;">' +
                '<span style="font-size:16px; font-weight:700; color:var(--text-m);">' + esc(babyName()) + '에게</span>' +
                '<span style="font-size:32px; font-weight:900; color:#3182F6; letter-spacing:-1px;">' + today.care + '</span>' +
                '<span style="font-size:16px; font-weight:700; color:var(--text-m);">번 달려갔어요</span>' +
            '</div>' +
            '<div style="font-size:13.5px; font-weight:600; color:var(--text-s); line-height:1.5;">' + esc(sub) + '<br><span style="color:var(--text-m); font-weight:800;">' + gradeMsg + '</span></div>' +
            tail +
        '</div>';
    }

    /* ---------- 3. 지나간 순간 ---------- */

    /* ---------- 3. 지나간 순간 ---------- */

    function dismissKey(id) { return 'tosil_moment_hide_' + id; }

    function isDismissed(id) {
        var until = Number(localStorage.getItem(dismissKey(id)) || 0);
        return until > Date.now();
    }

    function buildLastMoment(ledger) {
        if (Object.keys(ledger.days).length < MIN_DAYS) return '';

        var name = babyName();
        var picks = [];

        if (ledger.last.nightFeed) {
            var g1 = daysAgo(ledger.last.nightFeed.ts);
            if (g1 >= GAP_DAYS && g1 <= GAP_MAX) {
                picks.push({
                    id: 'nightFeed',
                    head: name + '가 밤중수유를 끊은 지 ' + g1 + '일째예요',
                    body: '마지막 밤중수유는 ' + fmtWhen(ledger.last.nightFeed.ts) +
                          (ledger.last.nightFeed.amount ? ', ' + ledger.last.nightFeed.amount + 'ml' : '') + '였어요.'
                });
            }
        }

        if (ledger.last.manyFeeds) {
            var t2 = new Date(ledger.last.manyFeeds.date + 'T12:00:00').getTime();
            var g2 = daysAgo(t2);
            if (g2 >= GAP_DAYS * 2 && g2 <= GAP_MAX) {
                picks.push({
                    id: 'manyFeeds',
                    head: '수유 텀이 길어진 지 ' + g2 + '일째예요',
                    body: '하루 ' + ledger.last.manyFeeds.count + '번씩 먹던 마지막 날은 ' +
                          ledger.last.manyFeeds.date.replace(/^\d+-0?/, '').replace('-', '월 ') + '일이었어요.'
                });
            }
        }

        if (ledger.last.dawnDiaper) {
            var g3 = daysAgo(ledger.last.dawnDiaper.ts);
            if (g3 >= GAP_DAYS && g3 <= GAP_MAX) {
                picks.push({
                    id: 'dawnDiaper',
                    head: '새벽에 기저귀를 간 지 ' + g3 + '일 됐어요',
                    body: '마지막은 ' + fmtWhen(ledger.last.dawnDiaper.ts) + '이었어요.'
                });
            }
        }

        var pick = null;
        for (var i = 0; i < picks.length; i++) {
            if (!isDismissed(picks[i].id)) { pick = picks[i]; break; }
        }
        if (!pick) return '';

        var closers = [
            '그때는 이게 마지막인 줄 몰랐죠.',
            '그날 기억나세요?',
            '아기는 그렇게 조금씩 자라요.',
            '고생한 밤들이 지나가고 있어요.'
        ];
        var closer = pickStable(closers, pick.id);

        return '' +
        '<div class="hide-on-senior" style="background:linear-gradient(145deg, #191F28 0%, #202632 100%); border-radius:24px; padding:28px 24px; margin-bottom:24px; box-shadow:0 10px 20px rgba(0,0,0,0.1); position:relative; overflow:hidden;">' +
            // 배경 따옴표 워터마크
            '<div style="position:absolute; top: -10px; right: 10px; font-size: 80px; font-family: serif; color: rgba(255,255,255,0.03); line-height: 1;">"</div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:2;">' +
                '<div style="font-size:11px; font-weight:800; color:#8B95A1; letter-spacing:3px;">MEMORY</div>' +
                '<div onclick="window.hideMoment(\'' + pick.id + '\')" style="font-size:12px; font-weight:700; background:rgba(255,255,255,0.1); color:#B0B8C1; cursor:pointer; padding:4px 10px; border-radius:12px; backdrop-filter:blur(4px);">기억할게요</div>' +
            '</div>' +
            '<div class="serif-display" style="font-size:21px; font-weight:900; line-height:1.5; color:#FFFFFF; margin-bottom:12px; font-family: \'Nanum Myeongjo\', serif; font-style: italic; word-break:keep-all; position:relative; z-index:2;">"' + esc(pick.head) + '"</div>' +
            '<div style="font-size:14px; font-weight:600; color:#B0B8C1; line-height:1.6; position:relative; z-index:2;">' + esc(pick.body) + '</div>' +
            '<div style="font-size:13px; font-weight:700; color:#6B7684; margin-top:20px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px; position:relative; z-index:2;">' + esc(closer) + '</div>' +
        '</div>';
    }

    window.hideMoment = function (id) {
        try { localStorage.setItem(dismissKey(id), String(Date.now() + 7 * DAY)); } catch (e) {}
        render();
    };

    /* ---------- 4. 다시 시작된 순간 ---------- */

    function buildResumed(ledger) {
        if (Object.keys(ledger.days).length < MIN_DAYS) return "";
        var prev = ledger.prev || {};
        var name = babyName();

        var items = [
            { id: "resumeNightFeed", last: ledger.last.nightFeed, prev: prev.nightFeed, act: "새벽에 먹었어요", tail: "그 전 밤중수유는 " },
            { id: "resumeDawnDiaper", last: ledger.last.dawnDiaper, prev: prev.dawnDiaper, act: "새벽에 기저귀를 갈았어요", tail: "그 전 새벽 기저귀는 " }
        ];

        var pick = null;
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (!it.last || !it.prev) continue;
            if (daysAgo(it.last.ts) > 2) continue;                 // 막 다시 나타난 것만
            var gap = Math.floor((it.last.ts - it.prev.ts) / DAY);
            if (gap < GAP_DAYS) continue;                          // 충분히 오래 끊겼던 것만
            if (isDismissed(it.id)) continue;
            pick = { id: it.id, gap: gap, it: it };
            break;
        }
        if (!pick) return "";

        var head = name + "가 " + pick.gap + "일 만에 " + pick.it.act;
        var body = fmtWhen(pick.it.last.ts) + "이었어요. " + pick.it.tail + fmtWhen(pick.it.prev.ts) + "이었고요.";

        var closers = [
            "이앓이나 도약기일 수 있어요. 며칠 지켜봐 주세요.",
            "갑자기 그러는 데는 대개 이유가 있어요.",
            "오늘 밤은 조금 길지도 몰라요. 미리 마음의 준비를요.",
            "며칠 이러다 다시 돌아가는 경우도 많아요."
        ];
        var closer = pickStable(closers, pick.id);

        return "" +
        '<div class="hide-on-senior" style="background:var(--bg-card); border:1px solid var(--border); border-radius:24px; padding:28px 24px; margin-bottom:24px; box-shadow:0 8px 24px rgba(0,0,0,0.04); position:relative; overflow:hidden;">' +
            '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#EF9F27;"></div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">' +
                '<div style="font-size:11px; font-weight:800; color:#8B95A1; letter-spacing:3px;">SIGNAL</div>' +
                '<div onclick="window.hideMoment(\'' + pick.id + '\')" style="font-size:12px; font-weight:700; background:var(--bg-sub); color:var(--text-sub); cursor:pointer; padding:4px 10px; border-radius:12px;">알겠어요</div>' +
            '</div>' +
            '<div class="serif-display" style="font-size:21px; font-weight:900; line-height:1.5; color:var(--text-title); margin-bottom:12px; word-break:keep-all;">' + esc(head) + '</div>' +
            '<div style="font-size:14px; font-weight:600; color:var(--text-s); line-height:1.6; word-break:keep-all;">' + esc(body) + '</div>' +
            '<div style="font-size:13px; font-weight:700; color:var(--text-sub); margin-top:20px; border-top:1px solid var(--border); padding-top:16px;">' + esc(closer) + '</div>' +
        '</div>';
    }

    /* ---------- 편지함 화면 ---------- */

    var WEEK = ["일", "월", "화", "수", "목", "금", "토"];

    function prettyDate(key) {
        var p = key.split("-");
        var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        return { md: Number(p[1]) + "월 " + Number(p[2]) + "일", dow: WEEK[d.getDay()] + "요일", ym: p[0] + "년 " + Number(p[1]) + "월" };
    }

    function statLine(l) {
        var bits = [];
        if (l.milk) bits.push("수유 " + l.milk + "ml");
        if (l.breastMins) bits.push("모유 " + l.breastMins + "분" + (l.breastCount > 1 ? " (" + l.breastCount + "회)" : ""));
        if (l.sleepMins) {
            var h = Math.floor(l.sleepMins / 60), m = l.sleepMins % 60;
            bits.push(("수면 " + (h ? h + "시간 " : "") + (m ? m + "분" : "")).trim());
        }
        if (l.poop) bits.push("응가 " + l.poop + "회");
        if (l.dawn) bits.push("새벽 " + l.dawn + "번");
        return bits.join("   ·   ");
    }

    window.openLetterBox = function () {
        var box = loadLetters();
        var keys = Object.keys(box).sort().reverse();
        var tk = todayKey();
        var name = babyName();
        var me = myTitle();
        var replies = loadReplies();

        var body = "";
        if (!keys.length) {
            body =
            '<div style="text-align:center; padding:80px 24px;">' +
                '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:26px; color:var(--text-sub); line-height:1.6;">' +
                    '아직 받은 편지가 없어요<br>오늘 기록을 남기면<br>침대 맡 편지가 도착해요' +
                '</div>' +
            '</div>';
        } else {
            var lastYm = "";
            keys.forEach(function (k) {
                var l = box[k];
                var d = prettyDate(k);
                if (d.ym !== lastYm) {
                    lastYm = d.ym;
                    body += '<div style="font-size:12px; font-weight:800; color:var(--text-sub); letter-spacing:2px; margin:28px 4px 14px;">' + esc(d.ym) + '</div>';
                }
                var isToday = (k === tk);
                var stats = statLine(l);
                var reply = replies[k];
                var editing = (editingKey === k);

                var mySlot = myRoleSlot();
                var replyHtml = "";

                // 이미 남긴 답장들을 먼저 보여준다 (엄마 → 아빠 순)
                ["mom", "dad"].forEach(function (slot) {
                    var r = reply && reply[slot];
                    if (!r || !r.text) return;
                    if (editing && slot === mySlot) return;   // 지금 고치는 중이면 아래 편집기가 대신 뜬다
                    var mine = (slot === mySlot);
                    replyHtml +=
                    '<div style="margin-top:14px; padding:16px 18px; background:' + (slot === "dad" ? "rgba(49,130,246,0.06)" : "rgba(127,119,221,0.06)") + '; border-left:3px solid ' + (slot === "dad" ? "#3182F6" : "#7F77DD") + '; border-radius:0 14px 14px 0;">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                            '<span style="font-size:11px; font-weight:800; color:' + (slot === "dad" ? "#3182F6" : "#7F77DD") + '; letter-spacing:1.5px;">' + esc(slotTitle(slot)) + '의 답장</span>' +
                            (mine ? '<span onclick="window.editReply(\'' + k + '\')" style="font-size:11.5px; font-weight:700; color:var(--text-sub); cursor:pointer;">고치기</span>' : "") +
                        '</div>' +
                        '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:21px; line-height:1.6; color:var(--text-m); white-space:pre-line; word-break:keep-all;">' + esc(r.text) + '</div>' +
                    '</div>';
                });

                var myReply = reply && reply[mySlot];
                if (editing) {
                    replyHtml +=
                    '<div style="margin-top:16px; padding-top:16px; border-top:1px dashed var(--border);">' +
                        '<div style="font-size:11px; font-weight:800; color:#7F77DD; letter-spacing:1.5px; margin-bottom:10px;">' + esc(me) + '의 답장</div>' +
                        '<textarea id="reply-input" placeholder="' + esc(name) + '에게 한 줄 남겨보세요" style="width:100%; min-height:84px; box-sizing:border-box; background:rgba(127,119,221,0.05); border:1px solid var(--border); border-radius:14px; padding:14px; font-family:\'Nanum Pen Script\', cursive; font-size:21px; line-height:1.5; color:var(--text-m); resize:vertical; outline:none;">' + esc(myReply ? myReply.text : "") + '</textarea>' +
                        '<div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">' +
                            '<div onclick="window.cancelReply()" style="font-size:12.5px; font-weight:700; color:var(--text-sub); cursor:pointer; padding:8px 14px;">취소</div>' +
                            '<div onclick="window.saveReply(\'' + k + '\')" style="font-size:12.5px; font-weight:800; color:#FFF; background:#7F77DD; cursor:pointer; padding:8px 18px; border-radius:12px;">남기기</div>' +
                        '</div>' +
                    '</div>';
                } else if (!myReply || !myReply.text) {
                    replyHtml +=
                    '<div onclick="window.editReply(\'' + k + '\')" style="margin-top:16px; padding-top:14px; border-top:1px dashed var(--border); font-size:12.5px; font-weight:700; color:#7F77DD; cursor:pointer;">' + esc(me) + '도 답장 쓰기 ›</div>';
                }
                body +=
                '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:26px 22px 22px; margin-bottom:14px; box-shadow:0 4px 14px rgba(0,0,0,0.03); position:relative;">' +
                    (isToday ? '<div style="position:absolute; top:-8px; left:50%; transform:translateX(-50%) rotate(-2.5deg); width:52px; height:16px; background:rgba(127,119,221,0.22); border-radius:2px;"></div>' : "") +
                    '<div style="display:flex; align-items:baseline; gap:8px; margin-bottom:16px;">' +
                        '<span class="serif-display" style="font-size:17px; font-weight:700; color:var(--text-title);">' + esc(d.md) + '</span>' +
                        '<span style="font-size:12px; font-weight:600; color:var(--text-sub);">' + esc(d.dow) + '</span>' +
                        (isToday ? '<span style="font-size:10.5px; font-weight:800; color:#7F77DD; background:rgba(127,119,221,0.12); padding:3px 8px; border-radius:8px; margin-left:auto;">오늘</span>' : "") +
                    '</div>' +
                    '<div style="font-family:\'Nanum Pen Script\', cursive; font-size:22px; line-height:1.7; color:var(--text-m); letter-spacing:0.4px; word-break:keep-all;">' +
                        '<div style="margin-bottom:14px;">' + esc(me) + '에게,</div>' +
                        (l.ms ? '<div style="margin-bottom:16px;">' +
                            '<div style="display:inline-block; font-family:Pretendard, sans-serif; font-size:10.5px; font-weight:800; color:#7F77DD; background:rgba(127,119,221,0.12); padding:3px 9px; border-radius:8px; letter-spacing:0.5px; margin-bottom:8px;">오늘의 처음</div>' +
                            '<div style="color:#6C63D8;">' + esc(l.ms) + '</div>' +
                        '</div>' : '') +
                        '<div style="white-space:pre-line;">' + esc(l.text) + '</div>' +
                        '<div style="text-align:right; margin-top:16px;">— ' + esc(name) + '가</div>' +
                    '</div>' +
                    (stats ? '<div style="margin-top:18px; padding-top:14px; border-top:1px dashed var(--border); font-size:11.5px; font-weight:600; color:var(--text-sub);">' + esc(stats) + '</div>' : "") +
                    replyHtml +
                '</div>';
            });
        }

        var wrap = document.getElementById("letterbox-modal");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "letterbox-modal";
            document.body.appendChild(wrap);
        }
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:9999; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");
        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 20px 60px;">' +
            '<div style="position:sticky; top:0; background:var(--bg-main); padding:22px 0 16px; z-index:2;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                    '<div>' +
                        '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">' + esc(name) + '의 편지함</div>' +
                        '<div style="font-size:13px; font-weight:600; color:var(--text-sub); margin-top:6px;">' +
                            (keys.length ? esc(keys.length + "통이 쌓였어요") : "첫 편지를 기다리는 중") + '</div>' +
                    '</div>' +
                    '<div onclick="window.closeLetterBox()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; padding:2px 8px; line-height:1;">×</div>' +
                '</div>' +
            '</div>' +
            body +
            (keys.length ? '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:34px; line-height:1.7;">편지는 이 기기에만 저장돼요<br>하루에 한 통씩, 기록을 남기면 도착합니다</div>' : "") +
        '</div>';
        document.body.style.overflow = "hidden";
    };

    window.editReply = function (key) {
        editingKey = key;
        window.openLetterBox();
        setTimeout(function () {
            var ta = document.getElementById("reply-input");
            try { if (ta && ta.focus) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } } catch (e) {}
        }, 60);
    };

    window.cancelReply = function () {
        editingKey = null;
        window.openLetterBox();
    };

    window.saveReply = function (key) {
        var ta = document.getElementById("reply-input");
        var text = ta ? String(ta.value || "").trim() : "";
        var box = loadReplies();
        var slot = myRoleSlot();
        if (!box[key]) box[key] = {};
        if (text) box[key][slot] = { text: text, at: Date.now() };
        else delete box[key][slot];
        if (!box[key].mom && !box[key].dad) delete box[key];
        saveReplies(box);
        editingKey = null;
        window.openLetterBox();
    };

    window.closeLetterBox = function () {
        editingKey = null;
        var wrap = document.getElementById("letterbox-modal");
        if (wrap) wrap.remove();
        document.body.style.overflow = "";
    };

    /* ---------- 잠 지도 ----------
       하루의 띠를 일주일치 쌓아 겹치면 아기가 진짜로 자는 시간대가 나온다. ---- */

    function recentDays(n) {
        var ledger = loadLedger();
        var out = [];
        var base = new Date(); base.setHours(0, 0, 0, 0);
        for (var i = n - 1; i >= 0; i--) {
            var ts = base.getTime() - i * DAY;
            var d = ledger.days[dayKey(ts)];
            out.push({ ts: ts, segs: d ? (d.segs || []) : null });
        }
        return out;
    }

    function sleepStats(days) {
        var totals = [], bedtimes = [], longest = 0, have = 0;
        days.forEach(function (x, i) {
            if (!x.segs) return;
            have++;
            var sum = 0, bt = null;
            x.segs.forEach(function (g) {
                sum += (g[1] - g[0]);
                if (g[0] >= 17 * 60) bt = (bt === null) ? g[0] : Math.max(bt, g[0]);
                var len = g[1] - g[0];
                // 자정을 넘은 밤잠은 다음날 조각과 이어붙인다
                if (g[1] >= 1440 && days[i + 1] && days[i + 1].segs) {
                    days[i + 1].segs.forEach(function (h) { if (h[0] === 0) len += (h[1] - h[0]); });
                }
                if (len > longest) longest = len;
            });
            totals.push(sum);
            if (bt !== null) bedtimes.push(bt);
        });
        var avg = function (a) {
            if (!a.length) return null;
            var t = 0; a.forEach(function (v) { t += v; });
            return Math.round(t / a.length);
        };
        return { have: have, avgTotal: avg(totals), avgBed: avg(bedtimes), longest: longest, bedCount: bedtimes.length };
    }

    function overlay(days, slots) {
        var per = 1440 / slots;
        var counts = [], i;
        for (i = 0; i < slots; i++) counts.push(0);
        var n = 0;
        days.forEach(function (x) {
            if (!x.segs) return;
            n++;
            var mark = [];
            for (i = 0; i < slots; i++) mark.push(false);
            x.segs.forEach(function (g) {
                var a = Math.floor(g[0] / per), b = Math.ceil(g[1] / per);
                for (var j = a; j < b && j < slots; j++) mark[j] = true;
            });
            for (i = 0; i < slots; i++) if (mark[i]) counts[i]++;
        });
        return { counts: counts, days: n };
    }

    function hhmm(mins) {
        var h = Math.floor(mins / 60) % 24, m = Math.round(mins % 60);
        return h + "시 " + (m ? m + "분" : "정각");
    }
    function dur(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        return (h ? h + "시간 " : "") + (m ? m + "분" : (h ? "" : "0분"));
    }

    function miniRibbon(segs, h) {
        var bars = "";
        if (segs) {
            segs.forEach(function (g) {
                var left = g[0] / 1440 * 100;
                var w = Math.max((g[1] - g[0]) / 1440 * 100, 0.7);
                bars += '<span style="position:absolute; left:' + left + '%; width:' + w + '%; height:100%; background-color:#7F77DD !important; border-radius:3px;"></span>';
            });
        }
        return '<div style="position:relative; height:' + h + 'px; background:var(--bg-sub); border-radius:5px; overflow:hidden;">' +
               '<span style="position:absolute; left:0; width:25%; height:100%; background-color:rgba(127,119,221,0.12) !important;"></span>' +
               '<span style="position:absolute; left:75%; width:25%; height:100%; background-color:rgba(127,119,221,0.12) !important;"></span>' +
               bars + '</div>';
    }

    window.openSleepMap = function () {
        var days = recentDays(7);
        var st = sleepStats(days);
        var name = babyName();
        var WD = ["일", "월", "화", "수", "목", "금", "토"];

        var rows = "";
        days.forEach(function (x) {
            var d = new Date(x.ts);
            rows +=
            '<div style="display:flex; align-items:center; gap:10px; margin-bottom:9px;">' +
                '<div style="width:52px; flex-shrink:0; font-size:11px; font-weight:600; color:' + (x.segs ? "var(--text-s)" : "var(--text-sub)") + ';">' +
                    d.getDate() + '일 ' + WD[d.getDay()] + '</div>' +
                '<div style="flex:1;">' + miniRibbon(x.segs, 15) + '</div>' +
            '</div>';
        });

        var ov = overlay(days, 48);
        var band = "";
        for (var i = 0; i < 48; i++) {
            var a = ov.days ? (ov.counts[i] / ov.days) : 0;
            band += '<span style="flex:1; height:100%; background-color:rgba(127,119,221,' + (a * 0.9).toFixed(2) + ') !important;"></span>';
        }

        var summary = "";
        if (st.have < 3) {
            summary = '<div style="text-align:center; padding:26px 20px; font-size:13px; font-weight:600; color:var(--text-sub); line-height:1.7;">' +
                '아직 ' + st.have + '일치뿐이에요<br>사흘이 모이면 무늬가 보이기 시작해요' +'</div>';
        } else {
            var cells = [];
            if (st.avgBed !== null) cells.push(["잠드는 시간", hhmm(st.avgBed) + " 쯤"]);
            if (st.avgTotal !== null) cells.push(["하루 평균 수면", dur(st.avgTotal)]);
            if (st.longest) cells.push(["가장 길게 잔 잠", dur(st.longest)]);
            summary = '<div style="display:flex; gap:8px; margin-top:22px;">';
            cells.forEach(function (c) {
                summary += '<div style="flex:1; background:var(--bg-sub); border-radius:14px; padding:14px 10px; text-align:center;">' +
                    '<div style="font-size:10.5px; font-weight:600; color:var(--text-sub); margin-bottom:6px;">' + esc(c[0]) + '</div>' +
                    '<div style="font-size:15px; font-weight:700; color:#6C63D8; letter-spacing:-0.3px;">' + esc(c[1]) + '</div>' +
                '</div>';
            });
            summary += '</div>';
        }

        var wrap = document.getElementById("sleepmap-modal");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "sleepmap-modal";
            document.body.appendChild(wrap);
        }
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:9999; background:var(--bg-main); overflow-y:auto; -webkit-overflow-scrolling:touch;");
        wrap.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 20px 60px;">' +
            // 👇 본드 역할을 하는 속성을 지우고 배경색과 여백만 남겼습니다!
            '<div style="background:var(--bg-main); padding:22px 0 16px;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                    '<div>' +
                        '<div class="serif-display" style="font-size:23px; font-weight:700; color:var(--text-title); letter-spacing:-0.5px;">' + esc(name) + '의 잠 무늬</div>' +
                        '<div style="font-size:13px; font-weight:600; color:var(--text-sub); margin-top:6px;">이레 동안 쌓인 잠의 결</div>' +
                    '</div>' +
                    '<div onclick="window.closeSleepMap()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; padding:2px 8px; line-height:1;">×</div>' +
                '</div>' +
            '</div>' +

            '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:22px 20px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">' +
                '<div style="font-size:12.5px; font-weight:700; color:var(--text-s); margin-bottom:16px;">날마다</div>' +
                rows +
                '<div style="display:flex; justify-content:space-between; font-size:10px; font-weight:500; color:var(--text-sub); margin:8px 0 0 62px;">' +
                    '<span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div>' +

                '<div style="margin-top:26px; padding-top:22px; border-top:1px dashed var(--border);">' +
                    '<div style="font-size:12.5px; font-weight:700; color:var(--text-s); margin-bottom:6px;">겹쳐보면</div>' +
                    '<div style="font-size:11.5px; font-weight:500; color:var(--text-sub); margin-bottom:14px;">진해지는 곳이 이 아이의 잠자리예요</div>' +
                    '<div style="display:flex; height:34px; border-radius:10px; overflow:hidden; background:var(--bg-sub);">' + band + '</div>' +
                    '<div style="display:flex; justify-content:space-between; font-size:10px; font-weight:500; color:var(--text-sub); margin-top:7px;">' +
                        '<span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div>' +
                '</div>' +
                summary +
            '</div>' +

            '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:30px; line-height:1.7;">무늬는 재우는 날마다 진해져요<br>아이마다 다른, 지문 같은 거예요</div>' +
        '</div>';
        document.body.style.overflow = "hidden";
    };

    window.closeSleepMap = function () {
        var w = document.getElementById("sleepmap-modal");
        if (w) w.remove();
        document.body.style.overflow = "";
    };

    function sleepMapEntry() {
        var days = recentDays(7);
        var n = 0;
        days.forEach(function (x) { if (x.segs) n++; });
        return '<div onclick="window.openSleepMap()" style="display:flex; justify-content:space-between; align-items:center; padding:14px 4px 20px; cursor:pointer;">' +
            '<span style="font-size:13px; font-weight:700; color:#7F77DD;">이번 주 잠 지도 ›</span>' +
            '<span style="font-size:11.5px; font-weight:600; color:var(--text-sub);">' + n + '일치 모임</span>' +
        '</div>';
    }

    /* ---------- 자리 만들기 ---------- */

    function slot(id, anchorId, where) {
        var el = document.getElementById(id);
        if (el) return el;
        var anchor = document.getElementById(anchorId);
        if (!anchor) return null;
        el = document.createElement('div');
        el.id = id;
        anchor.insertAdjacentElement(where, el);
        return el;
    }

    function render() {
        try {
            var ledger = syncLedger();
            saveTodayLetter();
            backfillLetters();
            cleanStoredLetters();

            var hero = document.getElementById('baby-dashboard');
            var heroWrap = hero ? hero.parentElement : null;
            if (heroWrap && !heroWrap.id) heroWrap.id = 'em-hero-wrap';

            var letterBox = slot('em-letter', 'em-hero-wrap', 'afterend');
            if (letterBox) letterBox.innerHTML = buildLetter(ledger);

            var countBox = slot('em-count', 'tracker-stats-container', 'afterend');
            if (countBox) countBox.innerHTML = buildParentCount(ledger);

            var mapBox = document.getElementById('em-sleepmap');
            if (mapBox) mapBox.remove();   // 진입구를 하루의 띠 카드 안으로 옳김

            var momentBox = document.getElementById('em-moment');
            if (!momentBox && countBox) {
                momentBox = document.createElement('div');
                momentBox.id = 'em-moment';
                countBox.insertAdjacentElement('afterend', momentBox);
            }
            if (momentBox) momentBox.innerHTML = buildLastMoment(ledger);

            var resumeBox = document.getElementById('em-resume');
            if (!resumeBox && momentBox) {
                resumeBox = document.createElement('div');
                resumeBox.id = 'em-resume';
                momentBox.insertAdjacentElement('afterend', resumeBox);
            }
            if (resumeBox) resumeBox.innerHTML = buildResumed(ledger);
        } catch (e) {
            console.warn('[감성 엔진]', e);
        }
    }

    /* ---------- 손글씨 폰트 ---------- */

    (function ensureFont() {
        if (document.getElementById('em-pen-font')) return;
        var link = document.createElement('link');
        link.id = 'em-pen-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap';
        document.head.appendChild(link);
    })();

    /* ---------- 기존 대시보드에 얹기 (원본 수정 없음) ---------- */

    var origUpdate = window.updateTrackerDashboard;
    window.updateTrackerDashboard = function () {
        var out;
        try {
            if (typeof origUpdate === 'function') out = origUpdate.apply(this, arguments);
        } finally {
            render();
        }
        return out;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
    setInterval(render, 60000);

    /* ---------- 점검용 ----------
       콘솔에서 window.emotionDebug() 를 치면 장부 상태가 보입니다. */
    window.emotionDebug = function () {
        var l = loadLedger();
        console.log('기록된 날짜 수:', Object.keys(l.days).length);
        console.log('오늘:', l.days[todayKey()]);
        console.log('마지막 순간들:', l.last);
        return l;
    };
})();