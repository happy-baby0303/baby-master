/* ============================================================
   육아메이트 — 프리미엄 (premium.js)  [정책 통일본]

   고친 것 넷
     1. 목소리 — 무료 3개. voice.js 와 말이 맞게 했다.
        (예전엔 여기선 "프리미엄 전용", voice.js 에선 "무료 3개" 였다.
         자물쇠를 보고 나간 사람은 공짜인 걸 끝내 몰랐다)
     2. 가족 초대 — 무료로 연다. 짝꿍 연동은 매출이 아니라 유입이다.
        막으면 바통터치 푸시가 통째로 죽는다.
        대신 조부모(3인 이상)를 프리미엄으로 옮겼다.
     3. 포토북 — 덮어쓰지 않고 감싼다.
        photobook.js 가 먼저 로드되므로 예전 코드는 진짜 구현을 지우고 있었다.
     4. 결제 화면 하나로 — startPremium 은 script.js 의 showPaywall 로 간다.
        페이월이 셋이면 사용자는 값을 못 믿는다.

   판별은 script.js 의 window.isPremiumUser() 하나만 쓴다.

   index.html 에서 photobook.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var FREE_PHOTO_PER_DAY = 1;
    var PRO_PHOTO_PER_DAY  = 3;
    var FREE_VOICE         = 3;    // ⚠️ voice.js 의 FREE_MAX 와 반드시 같아야 한다
    var FREE_FAMILY        = 2;    // 부모 둘까지 무료

    var GOLD    = "#B98A2E";
    var GOLD_BG = "rgba(185,138,46,0.12)";

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

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    /* ---------- 판별은 하나만 ----------
       평행 시스템을 만들면 한쪽만 고쳐지고 다른 쪽이 뚫린다. -------- */

    window.isPremium = function () {
        if (typeof window.isPremiumUser === "function") {
            try { return !!window.isPremiumUser(); } catch (e) {}
        }
        return false;
    };

    window.photoCapPerDay = function () {
        return window.isPremium() ? PRO_PHOTO_PER_DAY : FREE_PHOTO_PER_DAY;
    };

    window.voiceCapTotal = function () {
        return window.isPremium() ? Infinity : FREE_VOICE;
    };

    /* ---------- 잠긴 것들 ----------
       문구는 실제 동작과 한 글자도 어긋나면 안 된다. -------- */

    var FEATURES = {
        photo: {
            icon: "📷",
            title: "하루 사진 " + PRO_PHOTO_PER_DAY + "장",
            line: "무료는 하루 한 장이에요. 프리미엄이면 세 장까지 담깁니다."
        },
        voice: {
            icon: "🎙️",
            title: "목소리 무제한",
            line: "무료로 " + FREE_VOICE + "개까지 담을 수 있어요. 옹알이는 두 달이면 사라집니다."
        },
        book: {
            icon: "📖",
            title: "배냇함 포토북",
            line: "지금까지 담긴 걸 한 권으로 내보냅니다. 인쇄해서 책장에 꽂을 수 있어요."
        },
        family: {
            icon: "👵",
            title: "조부모 초대",
            line: "부모 두 분은 무료예요. 할머니 할아버지까지 " + babyName() + "의 배냇함을 볼 수 있어요."
        }
    };

    /* ---------- 미리 보여주는 자물쇠 ----------
       눌러야 막힌 걸 아는 것과, 보고 아는 것은 다르다. -------- */

    window.lockChip = function (label) {
        return '<span style="display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:800; ' +
            'color:' + GOLD + '; background:' + GOLD_BG + '; padding:3px 8px; border-radius:8px; ' +
            'letter-spacing:0.2px; white-space:nowrap; vertical-align:middle;">' +
            '🔒 ' + esc(label || "프리미엄") + '</span>';
    };

    window.requirePremium = function (key) {
        if (window.isPremium()) return true;
        window.openUpsell(key);
        return false;
    };

    /* ---------- 안내 시트 ---------- */

    window.openUpsell = function (key) {
        var f = FEATURES[key] || FEATURES.photo;

        var old = document.getElementById("upsell-sheet");
        if (old) old.remove();

        var wrap = document.createElement("div");
        wrap.id = "upsell-sheet";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:rgba(35,29,24,0.55); display:flex; align-items:flex-end; justify-content:center;");
        wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };

        var rows = Object.keys(FEATURES).map(function (k) {
            var it = FEATURES[k], on = (k === key);
            return '<div style="display:flex; gap:12px; align-items:flex-start; padding:12px 0;' + (on ? '' : ' opacity:0.5;') + '">' +
                '<span style="font-size:19px; line-height:1.2; flex-shrink:0;">' + it.icon + '</span>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:14px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' + esc(it.title) + '</div>' +
                    '<div style="font-size:12px; font-weight:600; color:var(--text-sub); line-height:1.6; margin-top:3px; word-break:keep-all;">' + esc(it.line) + '</div>' +
                '</div>' +
            '</div>';
        }).join('<div style="height:1px; background:var(--border); opacity:0.5;"></div>');

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; max-height:84vh; overflow-y:auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:20px 20px calc(30px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:flex-end;">' +
                '<span onclick="document.getElementById(\'upsell-sheet\').remove()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="text-align:center; margin:2px 0 22px;">' +
                '<div style="font-size:34px; margin-bottom:12px;">' + f.icon + '</div>' +
                '<div style="font-size:20px; font-weight:800; color:var(--text-m); letter-spacing:-0.5px;">' + esc(f.title) + '</div>' +
                '<div style="font-size:12.5px; font-weight:600; color:var(--text-sub); line-height:1.65; margin-top:9px; padding:0 8px; word-break:keep-all;">' + esc(f.line) + '</div>' +
            '</div>' +
            '<div style="background:var(--bg-sub); border-radius:18px; padding:6px 16px; margin-bottom:20px;">' + rows + '</div>' +
            '<div onclick="window.startPremium()" style="text-align:center; padding:16px; background:' + GOLD + '; color:#FFF; border-radius:15px; font-size:15px; font-weight:800; cursor:pointer;">프리미엄 보러가기</div>' +
            '<div style="text-align:center; font-size:11.5px; font-weight:600; color:var(--text-sub); margin-top:12px; line-height:1.6;">도감 100가지와 그 사진, 짝꿍 연동은 무료로 계속 쓸 수 있어요</div>' +
        '</div>';

        document.body.appendChild(wrap);
    };

    /* ---------- 결제 화면은 하나 ----------
       진입점은 여러 개여도 도착지는 하나여야 값을 믿는다. -------- */

    window.startPremium = function () {
        var s = document.getElementById("upsell-sheet");
        if (s) s.remove();

        if (typeof window.showPaywall === "function") { window.showPaywall(); return; }

        var vip = document.getElementById("vip-modal-overlay");
        if (vip) { vip.style.display = "flex"; return; }

        toast("곧 열려요. 준비되면 가장 먼저 알려드릴게요");
    };

    /* ---------- 사진 : 하루 장수 ---------- */

    var origAddDay = window.addDayPhoto;
    window.addDayPhoto = function (key) {
        var k = key || todayKey();
        var have = (typeof window.getLoosePhotos === "function") ? window.getLoosePhotos(k).length : 0;
        if (have >= window.photoCapPerDay()) {
            if (!window.isPremium()) return window.openUpsell("photo");
            toast("이 날은 이미 " + PRO_PHOTO_PER_DAY + "장이 담겨 있어요");
            return;
        }
        if (typeof origAddDay === "function") return origAddDay.apply(this, arguments);
    };

    // 배냇함 날짜 카드 밑줄에 자물쇠를 미리 보여준다
    var origAddRow = window.renderPhotoAdd;
    window.renderPhotoAdd = function (key) {
        var n = (typeof window.getLoosePhotos === "function") ? window.getLoosePhotos(key).length : 0;
        if (n < window.photoCapPerDay()) {
            return (typeof origAddRow === "function") ? origAddRow.apply(this, arguments) : "";
        }
        if (window.isPremium()) return "";
        return '<div onclick="event.stopPropagation(); window.openUpsell(\'photo\')" ' +
            'style="margin-top:14px; padding-top:13px; border-top:1px dashed var(--border); ' +
            'display:flex; align-items:center; gap:8px; cursor:pointer;">' +
            '<span style="font-size:12px; font-weight:700; color:var(--text-sub);">이 날 사진 더 담기</span>' +
            window.lockChip("프리미엄") +
        '</div>';
    };

    // 도감 사진은 잠그지 않는다. 그게 이 앱의 이유니까.

    /* ---------- 포토북 : 덮어쓰지 않고 감싼다 ----------
       photobook.js 가 먼저 로드된다. 예전 코드는 진짜 구현을 지우고 있었다. -------- */

    var origBook = window.exportMemoryBook;
    window.exportMemoryBook = function () {
        if (!window.requirePremium("book")) return;
        if (typeof origBook === "function") return origBook.apply(this, arguments);
        toast("포토북을 준비하고 있어요");
    };

    /* ---------- 가족 : 부모 둘은 무료 ----------
       짝꿍 연동을 막으면 바통터치 푸시가 통째로 죽는다.
       초대는 매출이 아니라 유입이다. -------- */

    window.familyCapTotal = function () {
        return window.isPremium() ? 8 : FREE_FAMILY;
    };

    // 세 번째 사람부터만 프리미엄
    window.requireFamilySlot = function (currentCount) {
        var n = Number(currentCount) || 0;
        if (n < window.familyCapTotal()) return true;
        if (window.isPremium()) { toast("초대 인원이 가득 찼어요"); return false; }
        window.openUpsell("family");
        return false;
    };

    /* ---------- 배냇함에 두 자리 ----------
       "곧 나와요" 보다 "프리미엄이에요" 가 낫다.
       전자는 기다리게 하고, 후자는 결제하게 한다.
       단, 무료로 쓸 수 있는 만큼 남아 있으면 자물쇠를 걸지 않는다. -------- */

    window.renderPremiumRow = function () {
        var pro = window.isPremium();
        var voiceN = (typeof window.voiceCount === "function") ? window.voiceCount() : 0;
        var voiceLocked = !pro && voiceN >= FREE_VOICE;

        var tile = function (act, icon, label, sub, locked) {
            return '<div onclick="' + act + '" ' +
                'style="flex:1; background:var(--bg-card); border:1px solid var(--border); border-radius:18px; ' +
                'padding:15px 12px; text-align:center; cursor:pointer;' + (locked ? ' opacity:0.88;' : '') + '">' +
                '<div style="font-size:21px; margin-bottom:7px;">' + icon + '</div>' +
                '<div style="font-size:12.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px; margin-bottom:5px;">' + esc(label) + '</div>' +
                (locked ? window.lockChip("프리미엄")
                        : '<div style="font-size:10.5px; font-weight:700; color:var(--text-sub);">' + esc(sub) + '</div>') +
            '</div>';
        };

        return '<div style="display:flex; gap:10px; margin-bottom:14px;">' +
            tile("window.openVoiceSheet()", "🎙️", "목소리",
                 pro ? "옹알이 담기" : (FREE_VOICE - voiceN) + "개 더 담을 수 있어요", voiceLocked) +
            tile("window.exportMemoryBook()", "📖", "포토북", "한 권으로 내보내기", !pro) +
        '</div>';
    };

    /* ---------- 점검용 ---------- */
    window.premiumDebug = function () {
        console.log("프리미엄:", window.isPremium());
        console.log("  얼리버드:", localStorage.getItem("tosil_is_founder"));
        console.log("  요금제 캐시:", localStorage.getItem("tosil_plan_cache"));
        console.log("  마스터:", localStorage.getItem("tosil_is_master"));
        console.log("하루 사진:", window.photoCapPerDay() + "장");
        console.log("목소리 한도:", window.voiceCapTotal());
        console.log("가족 인원:", window.familyCapTotal() + "명");
    };
})();