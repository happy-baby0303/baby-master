/* ============================================================
   배냇함 — 나들이 (outingsmart.js) v2

   자료를 열어보고 생각이 바뀌었다.

   places.json 86곳은 손으로 고른 좋은 자료다.
   전부 minMonths 가 있고, 무엇보다 ageNote 가 있다.

     "유모차 그대로 들어가고 수유실이 있어 신생아도 괜찮아요"
     "유모차 산책 위주라 목만 가누면 나갈 만해요"
     "키즈룸이 핵심이라 걷고 놀 수 있어야 값을 합니다"

   부모가 딱 알고 싶은 한 줄이다. 86곳 전부에 있다.
   그런데 화면에는 안 뜬다. 목록에는 제목과 해시태그만 나온다.

   ⚠️ places.json 에는 좌표가 없다.
      그래서 '가까운 순' 은 만들 수 없다.
      대신 위치로 '내 지역' 만 알아내서 지역 필터를 눌러준다.

   v2 가 하는 일

     1. 이번 주말 어디 갈지 한 곳을 골라준다 (날씨 + 개월수 + 이유)
     2. 목록 카드를 다시 그린다 — ageNote 와 개월수 뱃지를 넣어서
     3. 날씨를 지역 기준으로 띄운다 (권한 필요 없음)
     4. 개월수 · 실내 · 주차 · 유모차 칩으로 거른다
     5. 내 위치로 지역 필터를 눌러준다
     6. 그 집 낮잠 시각으로 출발 시각을 말해준다

   script.js 도 index.html 도 한 줄 안 고친다.
   목록은 다 그려진 뒤에 우리 카드로 바꿔 끼운다.

   index.html 에서 nursing.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var ROW_ID  = "outing-smart";
    var WX_ID   = "outing-weather";
    var PICK_ID = "outing-pick";
    var BLUE    = "#3182F6";
    var GOLD    = "#B98A2E";
    var GREEN   = "#2E8B6B";
    var PURPLE  = "#7F77DD";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function q(s) { return String(s == null ? "" : s).replace(/\\/g, "").replace(/'/g, "\\'").replace(/"/g, "&quot;"); }

    function babyName() { return localStorage.getItem("tosil_babyName") || "우리 아기"; }
    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    function monthsOld() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return null;
        var b = new Date(s + "T00:00:00").getTime();
        if (isNaN(b)) return null;
        var m = Math.floor((Date.now() - b) / 86400000 / 30.436875);
        return m < 0 ? null : m;
    }

    function places() {
        try { if (typeof hotplacesData !== "undefined" && hotplacesData && hotplacesData.length) return hotplacesData; } catch (e) {}
        return [];
    }

    function regionNow() {
        try { if (typeof currentRegion !== "undefined") return currentRegion; } catch (e) {}
        return "all";
    }
    function subRegionNow() {
        try { if (typeof currentSubRegion !== "undefined") return currentSubRegion; } catch (e) {}
        return "all";
    }
    function isListTab() {
        try { if (typeof currentSubTab !== "undefined") return currentSubTab === "list"; } catch (e) {}
        return true;
    }

    var F = { age: true, indoor: false, park: false, stroller: false, near: false };

    /* ==========================================================
       0. 지도 열기 — script.js 가 부르는데 아무도 안 만든 함수
       ----------------------------------------------------------
       script.js 737·740·743 줄이 window.openMap 을 부르고,
       nursing.js 의 '내비 켜기' 도 이걸 부른다.
       그런데 이 함수는 어디에도 정의돼 있지 않았다. 그래서
       버튼을 눌러도 조용히 아무 일도 일어나지 않았다.
       ---------------------------------------------------------- */

    function openMapReal(type, query) {
        var t = String(query == null ? "" : query).trim();
        if (!t) return toast("어디로 갈지 몰라서 지도를 못 열었어요");
        var enc = encodeURIComponent(t);

        var web = {
            naver: "https://map.naver.com/p/search/" + enc,
            kakao: "https://map.kakao.com/?q=" + enc,
            tmap:  "https://map.kakao.com/?q=" + enc     // 티맵은 웹 검색이 없어 카카오로 받는다
        };

        // 티맵은 앱으로만 길안내가 된다. 앱이 없으면 웹 지도로 떨어뜨린다.
        if (type === "tmap") {
            var went = false;
            var onHide = function () { went = true; };
            document.addEventListener("visibilitychange", onHide);
            try { window.location.href = "tmap://search?name=" + enc; } catch (e) {}
            setTimeout(function () {
                document.removeEventListener("visibilitychange", onHide);
                if (!went && !document.hidden) window.open(web.tmap, "_blank");
            }, 1400);
            return;
        }

        var w = window.open(web[type] || web.naver, "_blank");
        if (!w) window.location.href = web[type] || web.naver;   // 팝업이 막힌 경우
    }

    if (typeof window.openMap !== "function") window.openMap = openMapReal;
    window.__openMapReady = true;

    /* ---------- 실내인가 ----------
       공원·산책로 같은 말이 있으면 실외로 본다. 그게 먼저다.
       실내 낱말은 그다음에 본다. 둘 다 있으면 실외로 친다 (비 오는 날 안전하게). -------- */

    var OUT_WORDS = ["공원", "산책", "야외", "분수", "수목원", "해변", "바닷", "해수욕", "정원", "숲", "호수", "섬", "캠핑", "동물원", "목장"];
    var IN_WORDS  = ["실내", "몰", "백화점", "카페", "박물관", "미술관", "키즈", "도서", "아쿠아", "수족관", "체험관", "과학관", "플레이", "마트", "휴게"];

    // 🚨 review 까지 한 덩어리로 보면 안 된다.
    //    "야외 정원이 잘 되어 있습니다" 한 줄 때문에 박물관이 실외가 된다.
    //    이름·설명·태그로 먼저 정하고, 안 갈리면 그때 나머지를 본다.
    function scan(text) {
        for (var i = 0; i < OUT_WORDS.length; i++) if (text.indexOf(OUT_WORDS[i]) > -1) return false;
        for (var k = 0; k < IN_WORDS.length; k++) if (text.indexOf(IN_WORDS[k]) > -1) return true;
        return null;
    }

    function indoorOf(p) {
        var head = [p.title, p.desc]
            .concat((p.tags || []).map(function (t) { return (t && t.t) || t; })).join(" ");
        var r = scan(head);
        if (r !== null) return r;
        return scan([p.ageNote, p.review].join(" "));
    }

    function hasTag(p, word) {
        var t = p.tags || [];
        for (var i = 0; i < t.length; i++) {
            var s = (typeof t[i] === "string") ? t[i] : (t[i] && t[i].t) || "";
            if (String(s).indexOf(word) > -1) return true;
        }
        return false;
    }

    /* ---------- 무슨 종류인가 ----------
       자료의 emoji 는 손으로 넣은 거라 제각각이다.
       공원에 🎆, 카페에 🦢, 앨리웨이에 🍞 가 붙어 있었다.
       뜻 없는 그림은 장식이고, 장식은 촌스럽다.
       그림을 지우는 대신 '종류'로 바꾼다. 같은 종류면 같은 그림이 맞다.

       ⚠️ 이름을 먼저 보고, 이름으로 안 갈릴 때만 설명을 본다.
          카페 설명에 "호수공원 조망" 이 있어서 베이커리가 공원이 됐었다.
       -------- */

    var CATS = [
        [/아쿠아|수족관|씨라이프|SEA ?LIFE/i, "🐠", "아쿠아리움"],
        [/동물원|목장|버드파크|생태원|나비|팜랜드|고래/, "🦌", "동물·자연"],
        [/과학관/,                              "🔬", "과학관"],
        [/도서관/,                              "📚", "도서관"],
        [/항공|우주/,                           "✈️", "항공·우주"],
        [/해양/,                                "🌊", "해양"],
        [/박물관|기념관|문화전당|공예|문자/,       "🏛️", "박물관"],
        [/미술관|갤러리|아트센터|아트앤|뮤지엄산|복합문화|문화공간|제조창|공예품/, "🎨", "미술·문화"],
        [/카페|베이커리|커피|제과|디저트|어반리|아스타나|라크드미엘|밀도|어로프|포레스트 아웃팅스/, "☕", "카페"],
        [/백화점|아울렛|스타필드|타임빌라스|앨리웨이|센텀|롯데몰|파미어스|리빙파워|아이파크몰|타임스퀘어|프리미엄|현대|이케아|파라다이스시티/, "🛍️", "쇼핑몰"],
        [/키즈|놀이|테마파크|워터파크|피코|챔피언|상상나라|어린이|엑스포대공원|로봇랜드|버드파크/, "🎠", "키즈·놀이"],
        [/리조트|호텔|인스파이어|신화월드|켄싱턴/, "🏨", "리조트"],
        [/수목원|식물원|화목원|국가정원|공원|숲|호수|해변|안목|섬|한옥마을|산책/, "🌳", "공원·자연"]
    ];

    function matchCat(t) {
        for (var i = 0; i < CATS.length; i++) {
            if (CATS[i][0].test(t)) return { icon: CATS[i][1], name: CATS[i][2] };
        }
        return null;
    }

    function catOf(p) {
        return matchCat(p.title || "") || matchCat(p.desc || "") || { icon: "📍", name: "나들이" };
    }

    function ageBadge(p) {
        var m = Number(p.minMonths);
        if (!isFinite(m)) return "";
        if (m <= 0) return "신생아부터";
        if (m >= 24) return "두 돌부터";
        return m + "개월부터";
    }

    /* ---------- 지역 맞추기 (script.js 규칙 그대로) ---------- */

    function matchRegion(p) {
        var r = regionNow(), addr = p.locText || p.addr || "";
        if (r === "all") return true;
        if (r === "seoul")       return p.region === "seoul" || addr.indexOf("서울") > -1;
        if (r === "gyeonggi")    return p.region === "gyeonggi" || p.region === "incheon" ||
                                        /경기|인천|동탄|수원/.test(addr);
        if (r === "chungcheong") return p.region === "chungcheong" || p.region === "daejeon" ||
                                        /충|대전|세종/.test(addr);
        if (r === "gangwon")     return p.region === "gangwon" || addr.indexOf("강원") > -1;
        if (r === "jeolla")      return p.region === "jeolla" || p.region === "gwangju" || /전|광주/.test(addr);
        if (r === "gyeongsang")  return p.region === "gyeongsang" || p.region === "daegu" ||
                                        p.region === "busan" || p.region === "ulsan" || /경|대구|부산|울산/.test(addr);
        if (r === "jeju")        return p.region === "jeju" || addr.indexOf("제주") > -1;
        return true;
    }

    function keyword() {
        var el = document.getElementById("spot-search");
        return el ? String(el.value || "").toLowerCase().trim() : "";
    }

    function passes(p) {
        if (!p || p.isEvent) return false;

        if (typeof window.passesPlaceFilter === "function" && !window.passesPlaceFilter.__mine) {
            try { if (!window.passesPlaceFilter(p)) return false; } catch (e) {}
        }

        var m = monthsOld();
        if (F.age && m !== null && p.minMonths && m < Number(p.minMonths)) return false;
        if (F.indoor && indoorOf(p) === false) return false;
        if (F.park && !hasTag(p, "주차")) return false;
        if (F.stroller && !hasTag(p, "유모차")) return false;

        if (!matchRegion(p)) return false;

        var sub = subRegionNow();
        var addr = p.locText || p.addr || "";
        if (sub !== "all" && addr.indexOf(sub) === -1) return false;

        var k = keyword();
        if (k && (p.title + " " + p.desc + " " + (p.locText || "")).toLowerCase().indexOf(k) === -1) return false;

        return true;
    }

    /* ---------- 목록 카드 다시 그리기 ----------
       ageNote 가 이 자료에서 제일 좋은데 화면에 없었다. 그걸 주인공으로 올린다. -------- */

    function cardHTML(p) {
        var cat = catOf(p);
        var inside = indoorOf(p);
        var dist = F.near ? distOf(p) : null;
        var tint = inside === false ? "rgba(46,139,107,0.10)"
                 : inside === true  ? "rgba(127,119,221,0.10)"
                 : "var(--bg-sub)";
        var badge = ageBadge(p);

        var tags = (p.tags || []).slice(0, 3).map(function (t) {
            var s = (typeof t === "string") ? t : (t && t.t) || "";
            return '<span style="font-size:10.5px; font-weight:800; color:var(--text-sub); ' +
                   'background:var(--bg-sub); border-radius:7px; padding:4px 8px; white-space:nowrap;">' +
                   esc(s) + '</span>';
        }).join("");

        var args = "'" + q(p.title) + "','" + q(p.datetime || "운영시간 확인 필요") + "','" +
                   q(p.locText || "") + "','정보없음','" + q(p.review || "") + "','" +
                   q(p.query || p.title) + "','',false";

        return '<div onclick="openFestivalModal(' + args + ')" ' +
            'style="display:flex; gap:13px; background:var(--bg-card); border:1px solid var(--border); ' +
            'border-radius:18px; padding:15px 16px; margin-bottom:11px; cursor:pointer;">' +

            '<div style="width:46px; height:46px; border-radius:14px; background:' + tint + '; ' +
                'display:flex; align-items:center; justify-content:center; font-size:21px; flex-shrink:0;">' +
                cat.icon + '</div>' +

            '<div style="flex:1; min-width:0;">' +
                '<div style="display:flex; align-items:center; gap:6px;">' +
                    '<span style="flex:1; min-width:0; font-size:14.5px; font-weight:900; color:var(--text-m); ' +
                        'letter-spacing:-0.4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                        esc(p.title) + '</span>' +
                    (badge
                        ? '<span style="flex-shrink:0; font-size:10px; font-weight:900; color:' + PURPLE + '; ' +
                          'background:rgba(127,119,221,0.10); border-radius:7px; padding:3px 7px; white-space:nowrap;">' +
                          esc(badge) + '</span>'
                        : '') +
                '</div>' +

                '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px; ' +
                    'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    '<b style="color:' + (inside === false ? GREEN : PURPLE) + ';">' + esc(cat.name) + '</b>' +
                    (dist !== null ? ' · <b style="color:' + BLUE + ';">' + distText(dist) + '</b>' : '') +
                    ' · ' + esc(p.locText || "") + (p.datetime ? " · " + esc(p.datetime) : "") + '</div>' +

                (p.ageNote
                    ? '<div style="font-size:12.5px; font-weight:700; color:var(--text-m); margin-top:8px; ' +
                      'line-height:1.55; word-break:keep-all;">' + esc(p.ageNote) + '</div>'
                    : '') +

                (tags ? '<div style="display:flex; gap:5px; margin-top:9px; overflow:hidden;">' + tags + '</div>' : '') +
            '</div>' +
        '</div>';
    }

    function repaintList() {
        if (!isListTab()) return;
        var box = document.getElementById("hotplace-container");
        if (!box) return;

        var all = places().filter(passes);

        // 가까운 순 — 좌표가 없는 곳은 뒤로 보낸다
        if (F.near && myPos) {
            all = all.map(function (p, i) { return { p: p, d: distOf(p), i: i }; })
                     .sort(function (a, b) {
                         if (a.d === null) return 1;
                         if (b.d === null) return -1;
                         return (a.d !== b.d) ? a.d - b.d : a.i - b.i;
                     })
                     .map(function (x) { return x.p; });
        }

        if (!all.length) {
            box.innerHTML =
                '<div style="padding:50px 20px; text-align:center; font-size:13px; font-weight:700; ' +
                    'color:var(--text-sub); line-height:1.7; word-break:keep-all;">' +
                    '조건에 맞는 곳이 없어요.<br>위의 조건을 하나 꺼보시면 더 보입니다</div>';
            return;
        }
        box.innerHTML = all.map(cardHTML).join("") + noteHTML();
    }

    /* ---------- 확인 부탁 ----------
       122곳의 운영시간과 휴관일은 우리가 지켜줄 수 없다.
       수유실 시트에는 이미 이 말이 있는데 목록에는 없었다.
       헛걸음 한 번이면 이 탭을 다시 안 연다. -------- */

    function noteHTML() {
        return '<div style="margin:6px 0 4px; padding:14px 16px; background:var(--bg-sub); ' +
            'border-radius:14px; font-size:11.5px; font-weight:700; color:var(--text-sub); ' +
            'line-height:1.7; word-break:keep-all;">' +
            'ⓘ 운영시간과 휴관일은 바뀔 수 있어요. <b>가시기 전에 한 번 확인해 주세요.</b><br>' +
            '수유실이 공사 중이거나 없어졌을 수도 있습니다. ' +
            '다녀오시고 다르면 아래 <b>제보하기</b>로 알려주시면 고칠게요.</div>';
    }

    /* ---------- 날씨 ----------
       열쇠가 필요 없는 공개 예보. 지역 필터 기준이라 위치 권한도 필요 없다.
       못 받아오면 아무것도 안 띄운다. 틀린 날씨보다 없는 게 낫다. -------- */

    var REGION_POS = {
        all:         { la: 37.5665, lo: 126.9780, name: "서울" },
        seoul:       { la: 37.5665, lo: 126.9780, name: "서울" },
        gyeonggi:    { la: 37.2636, lo: 127.0286, name: "수원" },
        chungcheong: { la: 36.3504, lo: 127.3845, name: "대전" },
        gangwon:     { la: 37.8813, lo: 127.7298, name: "춘천" },
        jeolla:      { la: 35.1595, lo: 126.8526, name: "광주" },
        gyeongsang:  { la: 35.1796, lo: 129.0756, name: "부산" },
        jeju:        { la: 33.4996, lo: 126.5312, name: "제주" }
    };

    function wxText(c) {
        if (c === 0) return { i: "☀️", t: "맑음", rain: false };
        if (c <= 3)  return { i: "⛅", t: "구름", rain: false };
        if (c === 45 || c === 48) return { i: "🌫️", t: "안개", rain: false };
        if (c >= 51 && c <= 57) return { i: "🌦️", t: "이슬비", rain: true };
        if (c >= 61 && c <= 67) return { i: "🌧️", t: "비", rain: true };
        if (c >= 71 && c <= 77) return { i: "🌨️", t: "눈", rain: true };
        if (c >= 80 && c <= 82) return { i: "🌧️", t: "소나기", rain: true };
        if (c >= 85 && c <= 86) return { i: "🌨️", t: "눈", rain: true };
        if (c >= 95) return { i: "⛈️", t: "천둥번개", rain: true };
        return { i: "🌤️", t: "", rain: false };
    }

    var wx = null, wxCache = {};

    function weekendPick(dates) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var dow = today.getDay();
        var add = (dow === 6 || dow === 0) ? 0 : (6 - dow);
        var want = new Date(today.getTime() + add * 86400000);
        var key = want.getFullYear() + "-" +
                  String(want.getMonth() + 1).padStart(2, "0") + "-" +
                  String(want.getDate()).padStart(2, "0");
        for (var i = 0; i < dates.length; i++) if (dates[i] === key) return { i: i, add: add };
        return { i: 0, add: 0 };
    }

    /* ==========================================================
       내 위치와 거리
       ----------------------------------------------------------
       좌표가 생겼다. 이제 진짜 '가까운 순' 이 된다.
       들어오자마자 GPS 를 묻지는 않는다. 칩을 누를 때만 묻는다.
       ---------------------------------------------------------- */

    var myPos = null;

    function km(a, b, c, d) {
        var R = 6371, dLa = (c - a) * Math.PI / 180, dLo = (d - b) * Math.PI / 180;
        var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) +
                Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) *
                Math.sin(dLo / 2) * Math.sin(dLo / 2);
        return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    function distOf(p) {
        if (!myPos || !p || !p.lat || !p.lng) return null;
        return km(myPos.la, myPos.lo, Number(p.lat), Number(p.lng));
    }

    function distText(d) {
        if (d === null) return "";
        if (d < 1) return Math.round(d * 1000) + "m";
        if (d < 10) return d.toFixed(1) + "km";
        return Math.round(d) + "km";
    }

    function askPos(cb) {
        if (myPos) return cb(true);
        if (!navigator.geolocation) { toast("이 기기에서는 위치를 쓸 수 없어요"); return cb(false); }

        toast("내 위치를 찾는 중이에요…");
        navigator.geolocation.getCurrentPosition(function (pos) {
            myPos = { la: pos.coords.latitude, lo: pos.coords.longitude };
            var r = regionOf(myPos.la, myPos.lo);
            if (r) { try { localStorage.setItem(GEO_KEY, r); } catch (e) {} }
            wxCache = {};
            cb(true);
        }, function () {
            toast("위치 권한이 없어서 가까운 순은 못 써요");
            cb(false);
        }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
    }

    var GEO_KEY = "tosil_outing_region";

    function savedRegion() {
        var v = localStorage.getItem(GEO_KEY);
        return REGION_POS[v] ? v : null;
    }

    function loadWeather(then) {
        // 지역 필터가 '전국 전체' 면, 전에 위치로 잡아둔 지역을 쓴다.
        var r = regionNow();
        if (r === "all" && savedRegion()) r = savedRegion();
        var pos = REGION_POS[r] || REGION_POS.all;
        var ck = pos.name;
        if (wxCache[ck]) { wx = wxCache[ck]; return then && then(); }

        var url = "https://api.open-meteo.com/v1/forecast?latitude=" + pos.la + "&longitude=" + pos.lo +
                  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
                  "&timezone=Asia%2FSeoul&forecast_days=8";

        fetch(url).then(function (r) { return r.json(); }).then(function (j) {
            if (!j || !j.daily || !j.daily.time) throw new Error("no data");
            var w = weekendPick(j.daily.time);
            wx = {
                code: j.daily.weather_code[w.i],
                max:  j.daily.temperature_2m_max[w.i],
                min:  j.daily.temperature_2m_min[w.i],
                pop:  j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[w.i] : 0,
                add:  w.add, name: pos.name,
                guessed: (regionNow() === "all" && !savedRegion())
            };
            wxCache[ck] = wx;
            then && then();
        }).catch(function (e) {
            console.warn("[나들이] 날씨를 못 받았어요", e);
            wx = null; then && then();
        });
    }

    function wxHTML() {
        if (!wx) return "";
        var s = wxText(wx.code);
        var wet = s.rain || wx.pop >= 60;
        var when = wx.add === 0 ? "오늘" : "이번 주 토요일";

        return '<div style="display:flex; align-items:center; gap:11px; background:var(--bg-card); ' +
            'border:1px solid var(--border); border-radius:16px; padding:13px 15px; margin-bottom:12px;">' +
            '<div style="font-size:22px; flex-shrink:0;">' + s.i + '</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:13px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">' +
                    esc(when + " " + wx.name + " " + s.t) +
                    '<span style="margin-left:6px; font-weight:800; color:var(--text-sub);">' +
                        Math.round(wx.min) + '~' + Math.round(wx.max) + '도</span></div>' +
                '<div style="font-size:11px; font-weight:700; color:' + (wet ? BLUE : "var(--text-sub)") + '; margin-top:2px;">' +
                    '강수 ' + (wx.pop == null ? 0 : wx.pop) + '% · ' +
                    (wet ? "실내로 고르는 게 편해요"
                         : (wx.max >= 31 ? "한낮은 피해서 나가세요"
                         : (wx.min <= 0 ? "많이 추워요. 짧게 다녀오세요" : "나들이 하기 괜찮아요"))) + '</div>' +
            '</div>' +
            (wx.guessed
                ? '<div onclick="window.useMyRegion()" style="flex-shrink:0; ' +
                  'background:rgba(127,119,221,0.10); color:' + PURPLE + '; border-radius:10px; padding:8px 11px; ' +
                  'font-size:11.5px; font-weight:900; cursor:pointer; white-space:nowrap;">📍 내 위치로</div>'
                : (wet && !F.indoor
                    ? '<div onclick="window.toggleOutingFilter(\'indoor\')" style="flex-shrink:0; ' +
                      'background:rgba(127,119,221,0.10); color:' + PURPLE + '; border-radius:10px; padding:8px 11px; ' +
                      'font-size:11.5px; font-weight:900; cursor:pointer; white-space:nowrap;">실내만</div>'
                    : '')) +
        '</div>' +
        (wx.guessed
            ? '<div style="font-size:10.5px; font-weight:700; color:var(--text-sub); margin:-6px 0 11px 3px;">' +
              '지역을 안 고르셔서 서울 날씨를 보여드리고 있어요</div>'
            : '');
    }

    /* ---------- 이번 주말 여기 어때요 ----------
       필터를 다섯 개 주는 것보다 한 곳을 골라주는 게 세다.
       고른 이유를 같이 말해야 믿는다. -------- */

    var pickIdx = 0;

    function candidates() {
        var m = monthsOld();
        var wet = wx ? (wxText(wx.code).rain || wx.pop >= 60) : false;

        var list = places().filter(function (p) {
            if (!p || p.isEvent) return false;
            if (m !== null && p.minMonths && m < Number(p.minMonths)) return false;
            if (!matchRegion(p)) return false;
            if (wet && indoorOf(p) === false) return false;
            return true;
        });

        // 비 오면 실내부터, 아니면 자료 순서대로
        list.sort(function (a, b) {
            if (wet) {
                var ia = (indoorOf(a) === true ? 0 : 1), ib = (indoorOf(b) === true ? 0 : 1);
                if (ia !== ib) return ia - ib;
            }
            var da = distOf(a), db = distOf(b);
            if (da === null || db === null) return 0;
            return da - db;                       // 위치를 알면 가까운 곳부터 권한다
        });
        return list;
    }

    window.goOutingMap = function (query) {
        if (typeof window.safeOpenMap === "function") return window.safeOpenMap("naver", query);
        openMapReal("naver", query);
    };

    window.nextOutingPick = function () {
        pickIdx++;
        paintPick();
    };

    function reasonLines(p) {
        var out = [], m = monthsOld();
        var wet = wx ? (wxText(wx.code).rain || wx.pop >= 60) : false;

        if (wet && indoorOf(p) === true) out.push("비 오는 날이라 실내로 골랐어요");
        else if (!wet && indoorOf(p) === false) out.push("날이 괜찮아서 바깥으로 골랐어요");

        if (m !== null && p.minMonths != null && m >= Number(p.minMonths)) {
            out.push(m + "개월이면 갈 수 있어요");
        }
        var dd = distOf(p);
        if (dd !== null) out.push("여기서 " + distText(dd));

        if (hasTag(p, "수유")) out.push("수유실이 있어요");
        else if (hasTag(p, "유모차")) out.push("유모차가 편해요");
        return out.slice(0, 3);
    }

    function paintPick() {
        var host = document.getElementById(PICK_ID);
        if (!host) return;

        var list = candidates();
        if (!list.length) { host.innerHTML = ""; return; }

        var p = list[pickIdx % list.length];
        var why = reasonLines(p);
        var nap = napShort();

        var args = "'" + q(p.title) + "','" + q(p.datetime || "") + "','" + q(p.locText || "") +
                   "','정보없음','" + q(p.review || "") + "','" + q(p.query || p.title) + "','',false";

        host.innerHTML =
            '<div style="background:var(--bg-card); border:1px solid var(--border); ' +
                'border-radius:20px; padding:16px 17px; margin-bottom:12px;">' +

                '<div style="font-size:10.5px; font-weight:900; color:' + PURPLE + '; letter-spacing:1.4px; margin-bottom:9px;">' +
                    (wx && wx.add === 0 ? "오늘 여기 어때요" : "이번 주말 여기 어때요") + '</div>' +

                '<div onclick="openFestivalModal(' + args + ')" style="display:flex; gap:12px; cursor:pointer;">' +
                    '<div style="width:44px; height:44px; border-radius:13px; background:var(--bg-sub); ' +
                        'display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">' +
                        catOf(p).icon + '</div>' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="font-size:15.5px; font-weight:900; color:var(--text-m); letter-spacing:-0.4px; ' +
                            'word-break:keep-all; line-height:1.3;">' + esc(p.title) + '</div>' +
                        '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px;">' +
                            '<b style="color:' + PURPLE + ';">' + esc(catOf(p).name) + '</b> · ' +
                            esc(p.locText || "") + (p.datetime ? " · " + esc(p.datetime) : "") + '</div>' +
                    '</div>' +
                '</div>' +

                (p.ageNote
                    ? '<div style="font-size:13px; font-weight:800; color:var(--text-m); margin-top:11px; ' +
                      'line-height:1.6; word-break:keep-all;">' + esc(p.ageNote) + '</div>'
                    : '') +

                (why.length
                    ? '<div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">' +
                      why.map(function (t) {
                          return '<span style="font-size:10.5px; font-weight:800; color:' + PURPLE + '; ' +
                                 'background:rgba(127,119,221,0.10); border-radius:7px; padding:4px 8px;">' +
                                 esc(t) + '</span>';
                      }).join("") + '</div>'
                    : '') +

                (nap ? '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:10px; ' +
                       'line-height:1.55; word-break:keep-all;">🕐 ' + nap + '</div>' : '') +

                '<div style="display:flex; gap:8px; margin-top:14px;">' +
                    // padding 으로 세로를 맞추면 한글 글꼴 높이 때문에 글자가 위로 뜬다.
                    // 높이를 고정하고 flex 로 가운데를 잡아야 정확히 중앙에 온다.
                    '<div onclick="window.goOutingMap(\'' + q(p.query || p.title) + '\')" ' +
                        'style="flex:1; height:48px; display:flex; align-items:center; justify-content:center; ' +
                        'background:' + PURPLE + '; color:#FFFFFF; border-radius:14px; ' +
                        'font-size:14px; font-weight:900; letter-spacing:-0.3px; cursor:pointer; ' +
                        'box-shadow:0 3px 10px rgba(127,119,221,0.25);">길찾기</div>' +
                    '<div onclick="window.nextOutingPick()" ' +
                        'style="flex:1; height:48px; display:flex; align-items:center; justify-content:center; ' +
                        'background:var(--bg-sub); color:var(--text-m); border:1px solid var(--border); ' +
                        'border-radius:14px; font-size:14px; font-weight:800; letter-spacing:-0.3px; ' +
                        'cursor:pointer;">다른 곳 보여줘</div>' +
                '</div>' +
                '<div style="text-align:center; font-size:10.5px; font-weight:700; ' +
                    'color:var(--text-sub); margin-top:9px;">' +
                    '운영시간은 바뀔 수 있어요 · 출발 전에 한 번만 확인해 주세요</div>' +
            '</div>';
    }

    /* ---------- 낮잠 ---------- */

    function napHour() {
        var recs = [];
        try { recs = JSON.parse(localStorage.getItem("tosil_tracker_records")) || []; } catch (e) {}
        var now = Date.now(), hours = [];
        recs.forEach(function (r) {
            if (!r || r.type !== "sleep" || !Number(r.timestamp)) return;
            if (Number(r.timestamp) < now - 21 * 86400000) return;
            var sub = String(r.subType || "");
            var d = new Date(Number(r.timestamp)), h = d.getHours();
            if (sub.indexOf("밤") > -1) return;
            if (h >= 9 && h < 18) hours.push(h + d.getMinutes() / 60);
        });
        if (hours.length < 3) return null;
        hours.sort(function (a, b) { return a - b; });
        return hours[Math.floor(hours.length / 2)];
    }

    function ampm(h) {
        var hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 30) * 30;
        if (mm === 60) { hh += 1; mm = 0; }
        var ap = hh < 12 ? "오전" : "오후", h12 = hh % 12; if (h12 === 0) h12 = 12;
        return ap + " " + h12 + "시" + (mm ? " " + mm + "분" : "");
    }

    function napShort() {
        var h = napHour();
        if (h === null) return "";
        return babyName() + " 낮잠은 보통 " + ampm(h) + "이라, " + ampm(h - 2) + " 전에 나서면 이동 중에 재울 수 있어요";
    }

    /* ---------- 내 지역 눌러주기 ----------
       places.json 에 좌표가 없어서 '가까운 순' 은 만들 수 없다.
       대신 위치로 도(道)만 알아내 지역 버튼을 눌러준다. -------- */

    var BOX = [
        ["jeju",        33.0, 33.7, 126.0, 127.0],
        ["seoul",       37.41, 37.72, 126.75, 127.20],
        ["gyeonggi",    36.85, 38.30, 126.25, 127.90],
        ["gangwon",     37.00, 38.65, 127.65, 129.40],
        ["chungcheong", 35.90, 37.25, 126.05, 128.05],
        ["jeolla",      34.10, 36.25, 125.85, 127.95],
        ["gyeongsang",  34.60, 37.10, 127.75, 129.65]
    ];

    function regionOf(la, lo) {
        for (var i = 0; i < BOX.length; i++) {
            var b = BOX[i];
            if (la >= b[1] && la <= b[2] && lo >= b[3] && lo <= b[4]) return b[0];
        }
        return null;
    }

    window.useMyRegion = function () {
        if (!navigator.geolocation) return toast("이 기기에서는 위치를 쓸 수 없어요");
        toast("내 지역을 찾는 중이에요…");
        navigator.geolocation.getCurrentPosition(function (pos) {
            var r = regionOf(pos.coords.latitude, pos.coords.longitude);
            if (!r) return toast("지역을 알아내지 못했어요");
            try { localStorage.setItem(GEO_KEY, r); } catch (e) {}   // 다음부터는 안 묻는다
            var btns = document.querySelectorAll(".filter-wrap .filter-btn");
            for (var i = 0; i < btns.length; i++) {
                var oc = btns[i].getAttribute("onclick") || "";
                if (oc.indexOf("'" + r + "'") > -1) { btns[i].click(); break; }
            }
            wxCache = {};
            setTimeout(function () { loadWeather(paintAll); }, 60);
        }, function () { toast("위치 권한이 없어요"); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
    };

    /* ---------- 칩 ---------- */

    function chip(key, label, on) {
        return '<div onclick="window.toggleOutingFilter(\'' + key + '\')" ' +
            'style="flex-shrink:0; padding:9px 13px; border-radius:20px; cursor:pointer; ' +
            'font-size:12.5px; font-weight:800; white-space:nowrap; ' +
            (on ? 'background:' + PURPLE + '; color:#FFF; border:1px solid ' + PURPLE + ';'
                : 'background:var(--bg-card); color:var(--text-sub); border:1px solid var(--border);') +
            '">' + label + '</div>';
    }

    var tooEarly = false;

    function guardAge() {
        var m = monthsOld();
        if (m === null) { F.age = false; tooEarly = false; return; }
        var ok = places().filter(function (p) {
            return p && !p.isEvent && (!p.minMonths || m >= Number(p.minMonths));
        }).length;
        tooEarly = (ok < 5);
        if (tooEarly) F.age = false;
    }

    window.toggleOutingFilter = function (key) {
        if (key === "near" && !F.near) {
            return askPos(function (ok) {
                F.near = !!ok;
                if (ok) loadWeather(paintAll); else paintAll();
            });
        }
        F[key] = !F[key];
        paintAll();
    };

    function chipsHTML() {
        var m = monthsOld();
        var hidden = 0;
        if (F.age && m !== null) {
            hidden = places().filter(function (p) {
                return p && !p.isEvent && p.minMonths && m < Number(p.minMonths);
            }).length;
        }

        return '<div style="display:flex; gap:7px; overflow-x:auto; padding:2px 0 9px; ' +
                '-webkit-overflow-scrolling:touch; scrollbar-width:none;">' +
                (m !== null && !tooEarly ? chip("age", "👶 " + m + "개월 갈 수 있는 곳", F.age) : "") +
                chip("indoor",   "🏠 실내",      F.indoor) +
                chip("park",     "🅿️ 주차",     F.park) +
                chip("stroller", "🦼 유모차",    F.stroller) +
                chip("near", "📍 가까운 순", F.near) +
            '</div>' +
            (F.near && myPos
                ? '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin:-3px 0 9px;">' +
                  '내 위치에서 가까운 차례로 놓았어요' +
                  (regionNow() !== "all" ? ' · 더 넓게 보려면 위에서 <b>전국 전체</b>' : '') + '</div>'
                : '') +
            (tooEarly
                ? '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin:-3px 0 9px; ' +
                  'line-height:1.55; word-break:keep-all;">아직 어려서 갈 만한 곳이 많지 않아요. 우선 전체를 보여드릴게요</div>'
                : (hidden
                    ? '<div style="font-size:11px; font-weight:700; color:var(--text-sub); margin:-3px 0 9px;">' +
                      esc(babyName()) + '에게 아직 이른 곳 ' + hidden + '군데를 숨겼어요 · ' +
                      '<span onclick="window.toggleOutingFilter(\'age\')" style="color:' + PURPLE + '; ' +
                      'font-weight:900; cursor:pointer;">전부 보기</span></div>'
                    : ""));
    }

    /* ---------- 그리기 ---------- */

    function paintAll() {
        guardAge();
        var wxEl = document.getElementById(WX_ID);
        var rowEl = document.getElementById(ROW_ID);
        if (wxEl) wxEl.innerHTML = wxHTML();
        if (rowEl) rowEl.innerHTML = chipsHTML();
        paintPick();
        repaintList();
    }

    function mount() {
        var list = document.getElementById("hotplace-container");
        if (!list || !list.parentNode) return;

        [[WX_ID], [PICK_ID], [ROW_ID]].forEach(function (id) {
            if (!document.getElementById(id[0])) {
                var d = document.createElement("div");
                d.id = id[0];
                list.parentNode.insertBefore(d, list);
            }
        });

        show(isListTab());
        if (!wx) loadWeather(paintAll);
        else paintAll();
    }

    function show(on) {
        [ROW_ID, WX_ID, PICK_ID].forEach(function (id) {
            var e = document.getElementById(id);
            if (e) e.style.display = on ? "block" : "none";
        });
    }

    window.refreshOutingSmart = paintAll;

    /* ---------- 상세 창에도 같은 말 ----------
       길찾기를 누르기 직전이 마지막으로 말할 수 있는 자리다. -------- */

    function markModal() {
        var body = document.getElementById("modal-dynamic-body");
        if (!body || body.querySelector("#outing-note")) return;

        var d = document.createElement("div");
        d.id = "outing-note";
        d.style.cssText =
            "margin-top:14px; padding:12px 14px; background:var(--bg-sub); border-radius:12px; " +
            "font-size:11px; font-weight:700; color:var(--text-sub); line-height:1.65; word-break:keep-all;";
        d.innerHTML = "ⓘ 운영시간 · 휴관일 · 수유실은 <b>바뀌었을 수 있어요.</b> " +
                      "특히 멀리 가시는 길이면 전화로 한 번 확인하고 출발하세요.";
        body.appendChild(d);
    }

    /* ---------- 시작 ---------- */

    function boot() {
        if (typeof window.openMap !== "function") window.openMap = openMapReal;
        setTimeout(function () {
            if (typeof window.openMap !== "function") window.openMap = openMapReal;
        }, 2500);

        setTimeout(mount, 900);
        setTimeout(mount, 2600);

        var st = window.switchOutingSubTab;
        if (typeof st === "function" && !st.__smart2) {
            var w1 = function (type) {
                var out = st.apply(this, arguments);
                setTimeout(function () { mount(); show(type === "list"); }, 40);
                return out;
            };
            w1.__smart2 = true;
            window.switchOutingSubTab = w1;
        }

        var sr = window.setRegion;
        if (typeof sr === "function" && !sr.__smart2) {
            var w2 = function () {
                var out = sr.apply(this, arguments);
                pickIdx = 0;
                setTimeout(function () { loadWeather(paintAll); }, 60);
                return out;
            };
            w2.__smart2 = true;
            window.setRegion = w2;
        }

        // script.js 가 목록을 그린 직후, 우리 카드로 바꿔 끼운다
        var fp = window.filterPlaces;
        if (typeof fp === "function" && !fp.__smart2) {
            var w3 = function () {
                var out = fp.apply(this, arguments);
                setTimeout(repaintList, 20);
                return out;
            };
            w3.__smart2 = true;
            window.filterPlaces = w3;
        }

        var om = window.openFestivalModal;
        if (typeof om === "function" && !om.__smart2) {
            var w4 = function () {
                var out = om.apply(this, arguments);
                setTimeout(markModal, 40);
                return out;
            };
            w4.__smart2 = true;
            window.openFestivalModal = w4;
        }

        var si = document.getElementById("spot-search");
        if (si) si.addEventListener("keyup", function () { setTimeout(repaintList, 30); });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.outingDebug = function () {
        var m = monthsOld(), all = places();
        console.log("개월수:", m === null ? "생년월일 없음" : m + "개월");
        console.log("핫플 자료:", all.length + "곳 (places.json)");
        if (m !== null) {
            var ok = all.filter(function (p) { return !p.minMonths || m >= Number(p.minMonths); }).length;
            console.log("  갈 수 있는 곳:", ok + "곳 · 아직 이른 곳:", (all.length - ok) + "곳");
        }
        var i = all.filter(function (p) { return indoorOf(p) === true; }).length;
        var o = all.filter(function (p) { return indoorOf(p) === false; }).length;
        console.log("실내:", i + "곳  실외:", o + "곳  모름:", (all.length - i - o) + "곳");
        console.log("ageNote 있는 곳:", all.filter(function (p) { return !!p.ageNote; }).length + "곳");
        console.log("날씨:", wx ? (wx.name + " " + wxText(wx.code).t + " 강수 " + wx.pop + "%") : "못 받아옴");
        console.log("지금 목록에 뜨는 곳:", all.filter(passes).length + "곳");
        console.log("추천 후보:", candidates().length + "곳");
        console.log("낮잠:", napHour() === null ? "기록 3회 미만" : ampm(napHour()));
        console.log("칩:", JSON.stringify(F));
        console.log("내 위치:", myPos ? (myPos.la.toFixed(4) + ", " + myPos.lo.toFixed(4)) : "아직 안 물어봄");
        console.log("좌표 있는 곳:", all.filter(function (p) { return p.lat && p.lng; }).length + " / " + all.length);
        if (myPos) {
            console.log("─ 제일 가까운 다섯 곳 ─");
            all.filter(function (p) { return p.lat; })
               .map(function (p) { return { t: p.title, d: distOf(p) }; })
               .sort(function (a, b) { return a.d - b.d; }).slice(0, 5)
               .forEach(function (x) { console.log("   " + distText(x.d) + "  " + x.t); });
        }
    };
})();