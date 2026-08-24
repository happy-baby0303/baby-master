/* ============================================================
   배냇함 — 나들이 필터 (placefilter.js)

   태그가 100가지인데 장소는 35곳이었다.
   거의 한 곳당 한 가지씩 다른 이름을 쓰고 있었다.

     "🍼 수유실 완비"  "🍼 너싱룸 완비"  "🍼 패밀리 케어룸"
     "🍼 쁘띠라운지 완비"  "🍼 S급 수유센터"  "🍼 3층 전용 수유실"

   전부 "수유실 있음" 이라는 같은 말이다.
   그런데 이름이 다르니 "수유실 있는 곳만 보여줘" 가 안 됐다.

   부모가 나들이 탭을 여는 이유는 구경이 아니다.
   "우리 아기 데리고 가도 되나" 에 답을 얻으러 오는 것이다.

   원본 데이터는 한 글자도 안 고친다.
   기존 filterPlaces() 도 안 고친다. 그 함수를 감싸서
   내 조건을 하나 더 얹을 뿐이다.

   index.html 에서 toolbrief.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var BAR_ID = "place-filter-bar";
    var PURPLE = "#7F77DD";
    var GOLD   = "#B98A2E";

    function esc(x) {
        return String(x == null ? "" : x)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* ---------- 100가지를 10가지로 ----------
       원본 태그 · 설명 · 이름을 다 훑어서 판단한다. -------- */

    var RULES = [
        { key: "nursing", icon: "🍼", label: "수유실",
          kw: ["수유", "너싱", "유아휴게", "패밀리 라운지", "패밀리라운지", "케어룸",
               "쁘띠", "베이비서클", "의무실", "휴게실", "라운지", "S급"] },

        { key: "diaper", icon: "👶", label: "기저귀대",
          kw: ["기저귀"] },

        { key: "stroller", icon: "🦼", label: "유모차 편함",
          kw: ["무단차", "평탄", "배리어프리", "엘베", "무장애", "평지", "데크",
               "광폭", "지하주차장", "다이렉트", "주차"] },

        { key: "rental", icon: "🛒", label: "유모차 대여",
          kw: ["대여", "렌탈", "푸쉬카", "스토케"] },

        { key: "chair", icon: "🪑", label: "아기의자",
          kw: ["아기의자", "하이체어", "아기 체어", "좌식", "평상"] },

        { key: "indoor", icon: "🎠", label: "실내 놀이",
          kw: ["키즈", "실내", "놀이공원", "회전목마", "짚라인", "토들러", "미술관",
               "박물관", "아쿠아", "식물원", "온실", "북카페", "갤러리"] },

        { key: "outdoor", icon: "🌳", label: "야외 뛰놀기",
          kw: ["잔디", "공원", "산책", "분수", "피크닉", "광장", "정원", "꽃밭",
               "원두막", "야외"] },

        { key: "animal", icon: "🐾", label: "동물 체험",
          kw: ["동물", "가축", "잉어", "펫", "교감", "먹이"] },

        { key: "food", icon: "🍽️", label: "먹을 곳",
          kw: ["다이닝", "푸드", "식당", "카페"] },

        { key: "booking", icon: "🎫", label: "예약 필요",
          kw: ["예약"] }
    ];

    /* ---------- 우리 아기가 갈 수 있나 ----------
       이건 다른 앱이 못 하는 자리다.
       응애여지도는 아기 나이를 모른다. 이 앱은 D+일수를 안다. -------- */

    function babyMonths() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var b = new Date(s + "T00:00:00");
        if (isNaN(b.getTime())) return null;
        var now = new Date();
        var m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
        if (now.getDate() < b.getDate()) m--;
        return Math.max(0, m);
    }
    window.babyMonthsForPlaces = babyMonths;

    var ageOn = false;   // "우리 아기가 갈 만한 곳" 켜짐 여부

    window.toggleAgeFilter = function () {
        ageOn = !ageOn;
        rerun();
    };

    function passesAge(p) {
        if (!ageOn) return true;
        var m = babyMonths();
        if (m === null) return true;                 // 생일을 모르면 안 거른다
        var need = Number(p.minMonths);
        if (!isFinite(need)) return true;            // 정보가 없으면 안 거른다
        return m >= need;
    }

    /* ---------- 한 장소가 무엇을 갖췄나 ---------- */

    var cache = {};

    function tagsOf(p) {
        if (!p) return [];
        var id = p.title || "";
        if (cache[id]) return cache[id];

        var text = "";
        (p.tags || []).forEach(function (t) { text += " " + (t.t || t.title || t); });
        text += " " + (p.desc || "") + " " + (p.title || "") + " " + (p.review || "");

        var out = [];
        RULES.forEach(function (r) {
            for (var i = 0; i < r.kw.length; i++) {
                if (text.indexOf(r.kw[i]) > -1) { out.push(r.key); return; }
            }
        });

        cache[id] = out;
        return out;
    }

    window.placeTags = tagsOf;

    /* ---------- 지금 켜진 조건 ---------- */

    var active = [];

    // 기존 filterPlaces 가 만든 목록에서 내 조건에 안 맞는 걸 걸러낸다
    window.passesPlaceFilter = function (p) {
        if (!passesAge(p)) return false;
        if (!active.length) return true;
        var mine = tagsOf(p);
        return active.every(function (k) { return mine.indexOf(k) > -1; });
    };

    window.togglePlaceFilter = function (key) {
        var i = active.indexOf(key);
        if (i > -1) active.splice(i, 1);
        else active.push(key);
        rerun();
    };

    window.clearPlaceFilters = function () {
        active = [];
        rerun();
    };

    function rerun() {
        paintBar();
        if (typeof window.filterPlaces === "function") {
            try { window.filterPlaces(); } catch (e) {}
        }
        setTimeout(countUp, 120);
    }

    function countUp() {
        var note = document.getElementById("place-filter-count");
        if (!note) return;

        if (!active.length && !ageOn) { note.textContent = ""; return; }

        var list = window.hotplacesData || [];
        var n = list.filter(function (p) {
            return !p.isEvent && window.passesPlaceFilter(p);
        }).length;

        note.textContent = n + "곳이 맞아요";
    }

    /* ---------- 칩 줄 ---------- */

    function chip(r) {
        var on = active.indexOf(r.key) > -1;
        return '<span onclick="window.togglePlaceFilter(\'' + r.key + '\')" ' +
            'style="display:inline-flex; align-items:center; gap:4px; flex-shrink:0; ' +
            'padding:8px 13px; border-radius:999px; cursor:pointer; ' +
            'font-size:12px; font-weight:900; white-space:nowrap; ' +
            (on ? 'background:' + PURPLE + '; color:#FFF;'
                : 'background:var(--bg-card); color:var(--text-sub); border:1px solid var(--border);') +
            '">' + r.icon + ' ' + r.label + '</span>';
    }

    function ageChip() {
        var m = babyMonths();
        if (m === null) return "";               // 생일을 모르면 안 보여준다
        var name = localStorage.getItem("tosil_babyName") || "우리 아기";
        return '<span onclick="window.toggleAgeFilter()" ' +
            'style="display:inline-flex; align-items:center; gap:4px; flex-shrink:0; ' +
            'padding:8px 13px; border-radius:999px; cursor:pointer; ' +
            'font-size:12px; font-weight:900; white-space:nowrap; ' +
            (ageOn ? 'background:' + GOLD + '; color:#FFF;'
                   : 'background:rgba(185,138,46,0.12); color:' + GOLD + '; border:1px solid rgba(185,138,46,0.3);') +
            '">👶 ' + esc(name) + '(' + m + '개월)가 갈 만한</span>';
    }

    function paintBar() {
        var bar = document.getElementById(BAR_ID);
        if (!bar) return;

        var body = bar.querySelector(".pf-chips");
        if (body) body.innerHTML = ageChip() + RULES.map(chip).join("");

        var clear = bar.querySelector(".pf-clear");
        if (clear) clear.style.display = active.length ? "block" : "none";
    }

    function mount() {
        var box = document.getElementById("tab-hotplace");
        if (!box) return;
        if (document.getElementById(BAR_ID)) { paintBar(); countUp(); return; }
        if (!(window.hotplacesData || []).length) return;   // 데이터가 아직 안 왔다

        var bar = document.createElement("div");
        bar.id = BAR_ID;
        bar.style.cssText = "margin:0 0 16px;";
        bar.innerHTML =
            '<div style="display:flex; align-items:center; justify-content:space-between; margin:0 2px 8px;">' +
                '<span style="font-size:11.5px; font-weight:900; color:var(--text-sub);">' +
                    '우리 아기 데리고 가려면</span>' +
                '<span id="place-filter-count" style="font-size:11.5px; font-weight:900; color:' + PURPLE + ';"></span>' +
            '</div>' +
            '<div class="pf-chips" style="display:flex; gap:6px; overflow-x:auto; ' +
                'padding-bottom:4px; -webkit-overflow-scrolling:touch;"></div>' +
            '<div onclick="window.clearPlaceFilters()" class="pf-clear" ' +
                'style="display:none; margin-top:8px; font-size:11.5px; font-weight:800; ' +
                'color:var(--text-sub); cursor:pointer;">조건 모두 지우기</div>';

        // 검색창 아래, 목록 위
        var anchor = box.querySelector('#hotplace-list, #place-list, [id*="place-container"]');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor);
        else (box.firstElementChild || box).appendChild(bar);

        paintBar();
    }

    window.refreshPlaceFilter = mount;

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(mount, 2000);
        setTimeout(mount, 4500);
        setInterval(mount, 3000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.placeDebug = function () {
        var list = window.hotplacesData || [];
        console.log("장소 데이터:", list.length + "개 (행사 포함)");
        var places = list.filter(function (p) { return !p.isEvent; });
        console.log("나들이 장소:", places.length + "곳");
        if (!places.length) return console.log("❌ 아직 안 불러왔습니다. 나들이 탭을 한 번 열어보세요.");

        var cnt = {};
        places.forEach(function (p) {
            tagsOf(p).forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
        });
        RULES.forEach(function (r) {
            console.log("  " + r.icon + " " + r.label + ": " + (cnt[r.key] || 0) + "곳");
        });
        var none = places.filter(function (p) { return !tagsOf(p).length; });
        console.log("태그 하나도 없는 곳:", none.length + "곳",
            none.map(function (p) { return p.title; }).slice(0, 5));
        var m = babyMonths();
        console.log("아기 개월 수:", m === null ? "생일 미입력" : m + "개월");
        if (m !== null) {
            var okN = places.filter(function (p) {
                return !isFinite(Number(p.minMonths)) || m >= Number(p.minMonths);
            }).length;
            console.log("지금 갈 만한 곳:", okN + "곳 / " + places.length);
        }
        var noAge = places.filter(function (p) { return !isFinite(Number(p.minMonths)); });
        if (noAge.length) console.log("⚠️ minMonths 없는 곳:", noAge.length + "곳");
        console.log("나이 조건 켜짐:", ageOn);
        console.log("켜진 조건:", active.length ? active.join(", ") : "없음");
        console.log("칩 줄 떠 있음:", !!document.getElementById(BAR_ID));
    };
})();