/* ============================================================
   배냇함 — 프리미엄 (premium.js)  [기준 확정본 v3]

   기준이 파일마다 달라서 헷갈렸다. 이제 여기 하나만 본다.
   다른 파일은 숫자를 직접 쓰지 말고 window.PLAN 을 읽는다.

   ─────────────────────────────────────────────
   무료 (영원히)
     · 기록 전부 — 수유 · 수면 · 기저귀 · 체온 · 성장 · 가계부 · 다이어리
     · 도감 100가지와 그 사진 100장        ← 이 앱의 이유. 절대 안 잠근다
     · 하루 사진 1장
     · 목소리 3개
     · 봉인 편지 3통
     · 짝꿍 연동 2인 + 바통터치 알림        ← 막으면 유입이 죽는다
     · 추억 엽서 · 파형 엽서 저장
     · 배냇함 통째로 내려받기               ← 신뢰의 근간. 절대 안 잠근다
     · 기념일 · 육퇴 편지 · 놀이 처방전

   프리미엄
     · 하루 사진 3장
     · 목소리 무제한
     · 봉인 편지 무제한
     · 가족 5명까지 (조부모 초대)
     · 배냇함 포토북 내보내기
     · 다둥이 프로필

   따로 파는 것
     · 실물 포토북 (물리 상품 — 앱 밖 결제 가능)
   ─────────────────────────────────────────────

   판별은 script.js 의 window.isPremiumUser() 하나만 쓴다.
   index.html 에서 photobook.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    /* ==========================================================
       ⭐ 여기가 유일한 기준표. 숫자를 바꾸려면 여기만 고친다.
       ========================================================== */
    var PLAN = {
        free: {
            photoPerDay: 1,
            voiceTotal:  3,
            sealedTotal: 3,
            familySize:  2,
            babies:      1
        },
        pro: {
            photoPerDay: 3,
            voiceTotal:  Infinity,
            sealedTotal: Infinity,
            familySize:  5,      // 보안 규칙도 5로 막혀 있다. 같이 움직여야 한다
            babies:      3
        },
        // 돈으로 잠그지 않는 것들 — 판단이 흔들릴 때 여기를 본다
        alwaysFree: [
            "도감 100가지와 그 사진",
            "수유·수면·기저귀·체온·성장·가계부·다이어리",
            "짝꿍 연동 2인과 바통터치 알림",
            "추억 엽서와 파형 엽서 저장",
            "배냇함 통째로 내려받기"
        ]
    };
    window.PLAN = PLAN;

    var GOLD    = "#B98A2E";
    var GOLD_BG = "rgba(185,138,46,0.12)";
    var PURPLE  = "#7F77DD";

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

    /* ---------- 판별은 하나만 ---------- */

    window.isPremium = function () {
        if (typeof window.isPremiumUser === "function") {
            try { return !!window.isPremiumUser(); } catch (e) {}
        }
        return false;
    };

    function cap(name) {
        return (window.isPremium() ? PLAN.pro : PLAN.free)[name];
    }

    window.photoCapPerDay = function () { return cap("photoPerDay"); };
    window.voiceCapTotal  = function () { return cap("voiceTotal");  };
    window.sealedCapTotal = function () { return cap("sealedTotal"); };
    window.familyCapTotal = function () { return cap("familySize");  };
    window.babyCapTotal   = function () { return cap("babies");      };

    /* ---------- 안내 문구 ----------
       문구는 실제 동작과 한 글자도 어긋나면 안 된다. -------- */

    var FEATURES = {
        photo: {
            icon: "📷",
            title: "하루 사진 " + PLAN.pro.photoPerDay + "장",
            free: "하루 " + PLAN.free.photoPerDay + "장",
            line: "무료는 하루 한 장이에요. 프리미엄이면 세 장까지 담깁니다."
        },
        voice: {
            icon: "🎙️",
            title: "목소리 무제한",
            free: PLAN.free.voiceTotal + "개까지",
            line: "무료로 " + PLAN.free.voiceTotal + "개까지 담을 수 있어요. 옹알이는 두 달이면 사라집니다."
        },
        seal: {
            icon: "🕯️",
            title: "봉인 편지 무제한",
            free: PLAN.free.sealedTotal + "통까지",
            line: "무료로 " + PLAN.free.sealedTotal + "통까지 봉인할 수 있어요. 지금의 마음은 지금밖에 못 씁니다."
        },
        family: {
            icon: "👵",
            title: "가족 " + PLAN.pro.familySize + "명까지",
            free: "부모 " + PLAN.free.familySize + "명",
            line: "부모 두 분은 무료예요. 할머니 할아버지까지 " + babyName() + "의 배냇함을 볼 수 있어요."
        },
        book: {
            icon: "📖",
            title: "배냇함 포토북",
            free: "—",
            line: "지금까지 담긴 걸 한 권으로 내보냅니다. 인쇄해서 책장에 꽂을 수 있어요."
        },
        baby: {
            icon: "👶",
            title: "다둥이 프로필",
            free: "아기 " + PLAN.free.babies + "명",
            line: "둘째, 셋째의 배냇함을 따로 만들 수 있어요."
        }
    };

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

    // 한도형 게이트 — 남은 자리가 있으면 그냥 통과
    function gate(key, have, capName) {
        var limit = cap(capName);
        if (have < limit) return true;
        if (window.isPremium()) { toast("여기는 이미 가득 찼어요"); return false; }
        window.openUpsell(key);
        return false;
    }

    /* ---------- 안내 시트 ----------
       무료로 되는 것과 프리미엄을 나란히 보여준다.
       "뭐가 공짜인지" 를 먼저 알려야 값을 믿는다. -------- */

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
            return '<div style="display:flex; gap:11px; align-items:center; padding:11px 0;' + (on ? '' : ' opacity:0.48;') + '">' +
                '<span style="font-size:17px; flex-shrink:0;">' + it.icon + '</span>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-size:13.5px; font-weight:800; color:var(--text-m); letter-spacing:-0.3px;">' + esc(it.title) + '</div>' +
                '</div>' +
                '<div style="font-size:11px; font-weight:700; color:var(--text-sub); flex-shrink:0;">무료 ' + esc(it.free) + '</div>' +
            '</div>';
        }).join('<div style="height:1px; background:var(--border); opacity:0.5;"></div>');

        var freeList = PLAN.alwaysFree.map(function (t) {
            return '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); line-height:1.75;">· ' + esc(t) + '</div>';
        }).join("");

        wrap.innerHTML =
        '<div style="width:100%; max-width:480px; max-height:86vh; overflow-y:auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:20px 20px calc(30px + env(safe-area-inset-bottom, 0px));">' +
            '<div style="display:flex; justify-content:flex-end;">' +
                '<span onclick="document.getElementById(\'upsell-sheet\').remove()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1; padding:0 4px;">×</span>' +
            '</div>' +
            '<div style="text-align:center; margin:2px 0 20px;">' +
                '<div style="font-size:34px; margin-bottom:12px;">' + f.icon + '</div>' +
                '<div style="font-size:20px; font-weight:800; color:var(--text-m); letter-spacing:-0.5px;">' + esc(f.title) + '</div>' +
                '<div style="font-size:12.5px; font-weight:600; color:var(--text-sub); line-height:1.65; margin-top:9px; padding:0 8px; word-break:keep-all;">' + esc(f.line) + '</div>' +
            '</div>' +
            '<div style="background:var(--bg-sub); border-radius:18px; padding:4px 16px; margin-bottom:16px;">' + rows + '</div>' +
            '<div style="background:rgba(127,119,221,0.08); border-radius:16px; padding:14px 16px; margin-bottom:18px;">' +
                '<div style="font-size:11.5px; font-weight:900; color:' + PURPLE + '; margin-bottom:6px; letter-spacing:0.2px;">이건 앞으로도 무료예요</div>' +
                freeList +
            '</div>' +
            '<div onclick="window.startPremium()" style="text-align:center; padding:16px; background:' + GOLD + '; color:#FFF; border-radius:15px; font-size:15px; font-weight:800; cursor:pointer;">프리미엄 보러가기</div>' +
        '</div>';

        document.body.appendChild(wrap);
    };

    /* ---------- 결제 화면은 하나 ---------- */

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
        if (!gate("photo", have, "photoPerDay")) return;
        if (typeof origAddDay === "function") return origAddDay.apply(this, arguments);
    };

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

    /* ---------- 봉인 편지 : 무료 3통 ---------- */

    var origSeal = window.openSealSheet;
    window.openSealSheet = function () {
        var have = (typeof window.sealedCount === "function") ? window.sealedCount() : 0;
        if (!gate("seal", have, "sealedTotal")) return;
        if (typeof origSeal === "function") return origSeal.apply(this, arguments);
    };

    /* ---------- 포토북 : 덮어쓰지 않고 감싼다 ---------- */

    var origBook = window.exportMemoryBook;
    window.exportMemoryBook = function () {
        if (!window.requirePremium("book")) return;
        if (typeof origBook === "function") return origBook.apply(this, arguments);
        toast("포토북을 준비하고 있어요");
    };

    /* ---------- 다둥이 ---------- */

    var origBaby = window.addNewBabyProfile;
    window.addNewBabyProfile = function () {
        var have = 1;
        try { have = (JSON.parse(localStorage.getItem("tosil_baby_profiles")) || []).length || 1; } catch (e) {}
        if (!gate("baby", have, "babies")) return;
        if (typeof origBaby === "function") return origBaby.apply(this, arguments);
    };

    /* ---------- 가족 : 부모 둘은 무료 ----------
       짝꿍 연동을 막으면 바통터치 푸시가 통째로 죽는다.
       초대는 매출이 아니라 유입이다. -------- */

    window.requireFamilySlot = function (currentCount) {
        return gate("family", Number(currentCount) || 0, "familySize");
    };

    /* ---------- 배냇함 내려받기는 잠그지 않는다 ----------
       20년을 맡기는 앱에서, 꺼내갈 수 있다는 사실이 곧 신뢰다.
       탈출구가 보이면 사람은 나가지 않는다. -------- */

    /* ---------- 배냇함 두 자리 ---------- */

    window.renderPremiumRow = function () {
        var pro = window.isPremium();
        var voiceN = (typeof window.voiceCount === "function") ? window.voiceCount() : 0;
        var voiceLeft = Math.max(0, PLAN.free.voiceTotal - voiceN);
        var voiceLocked = !pro && voiceLeft <= 0;

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
                 pro ? "옹알이 담기" : voiceLeft + "개 더 담을 수 있어요", voiceLocked) +
            tile("window.exportMemoryBook()", "📖", "포토북", "한 권으로 내보내기", !pro) +
        '</div>';
    };

    /* ---------- 점검용 ---------- */
    window.premiumDebug = function () {
        console.log("프리미엄:", window.isPremium());
        console.log("  얼리버드:", localStorage.getItem("tosil_is_founder"));
        console.log("  요금제 캐시:", localStorage.getItem("tosil_plan_cache"));
        console.log("  마스터:", localStorage.getItem("tosil_is_master"));
        console.table({
            "하루 사진": window.photoCapPerDay(),
            "목소리":    window.voiceCapTotal(),
            "봉인 편지": window.sealedCapTotal(),
            "가족":      window.familyCapTotal(),
            "아기":      window.babyCapTotal()
        });
        console.log("무조건 무료:", PLAN.alwaysFree);
    };
})();