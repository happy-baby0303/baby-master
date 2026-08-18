/* ============================================================
   육아메이트 — 홈의 배냇함 (home.js)

   부모는 하루에 열 번 홈을 본다.
   그 열 번 동안 배냇함 얘기를 한 번도 안 하면
   배냇함은 영영 안 채워진다.

   기록 버튼 바로 밑에 자리를 만든다.
   수유 찍으러 들어온 김에 사진 한 장 담게.

   index.html 에서 anniversaries.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var HIDE_PLAY = true;   // 놀이 처방전을 홈에서 내린다 (툴박스에는 그대로 남음)
    var DAY = 86400000;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() {
        return localStorage.getItem("tosil_babyName") || "우리 아기";
    }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function dday() {
        var s = localStorage.getItem("tosil_startDate");
        if (!s) return 0;
        var b = new Date(s + "T00:00:00").getTime();
        if (isNaN(b)) return 0;
        var t = new Date(); t.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((t.getTime() - b) / DAY));
    }

    function achievedCount() {
        try {
            var a = JSON.parse(localStorage.getItem("tosil_milestones")) || [];
            return a.length;
        } catch (e) { return 0; }
    }

    /* ---------- 최근 사진 몇 장 ---------- */

    function recentPhotos(n) {
        if (typeof window.photoDays !== "function") return [];
        var out = [];
        window.photoDays().sort().reverse().forEach(function (k) {
            if (out.length >= n) return;
            (window.getDayPhotos(k) || []).slice().reverse().forEach(function (p) {
                if (out.length < n) out.push({ key: k, photo: p });
            });
        });
        return out;
    }

    /* ---------- 카드 ---------- */

    function cardHTML() {
        var key = todayKey();
        var todayN = (typeof window.getLoosePhotos === "function") ? window.getLoosePhotos(key).length : 0;
        var shots = recentPhotos(3);
        var msN = achievedCount();
        var msPhoto = (typeof window.milestonePhotoCount === "function") ? window.milestonePhotoCount() : 0;

        // 아래 한 줄: 지금 뭐가 비어 있는지 말해준다
        var hint;
        if (!shots.length)          hint = babyName() + "의 첫 사진을 담아보세요";
        else if (!todayN)           hint = "오늘은 아직 비어 있어요";
        else if (msN > msPhoto)     hint = "처음 해낸 일 " + msN + "가지 중 " + msPhoto + "가지에 사진이 붙었어요";
        else                        hint = "D+" + dday() + "일째, 잘 쌓이고 있어요";

        var tiles = shots.map(function (s) {
            return '<div onclick="window.openLoosePhoto ? window.openLoosePhoto(\'' + s.key + '\',0) : null" ' +
                'style="flex:1; aspect-ratio:1/1; border-radius:14px; overflow:hidden; cursor:pointer; background:var(--bg-sub);">' +
                '<img src="' + esc(window.photoThumb ? window.photoThumb(s.photo) : s.photo.url) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
            '</div>';
        }).join("");

        // 마지막 칸은 언제나 '담기'
        var addTile =
            '<div onclick="window.addDayPhoto && window.addDayPhoto(\'' + key + '\')" ' +
            'style="flex:1; aspect-ratio:1/1; border-radius:14px; cursor:pointer; border:1px dashed var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;">' +
                '<span style="font-size:19px; font-weight:300; color:var(--text-sub); line-height:1;">+</span>' +
                '<span style="font-size:10px; font-weight:800; color:var(--text-sub);">오늘</span>' +
            '</div>';

        return '' +
        '<div id="home-memorybox-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:24px; padding:20px; margin-bottom:24px; box-shadow:0 12px 24px rgba(0,0,0,0.04);">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">' +
                '<span style="font-size:15px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">🧺 ' + esc(babyName()) + '의 배냇함</span>' +
                '<span onclick="window.goToMemoryBox && window.goToMemoryBox()" style="font-size:12px; font-weight:800; color:#7F77DD; background:rgba(127,119,221,0.10); padding:6px 12px; border-radius:12px; cursor:pointer;">전체 보기 〉</span>' +
            '</div>' +
            '<div style="display:flex; gap:8px; margin-bottom:13px;">' + tiles + addTile + '</div>' +
            '<div style="font-size:12.5px; font-weight:700; color:var(--text-sub); letter-spacing:-0.2px;">' + esc(hint) + '</div>' +
        '</div>';
    }

    /* ---------- 자리 잡기 ----------
       기록 버튼(now-status-card) 바로 아래, 통계 위. -------- */

    function mount() {
        var anchor = document.getElementById("now-status-card");
        if (!anchor || !anchor.parentNode) return;

        var old = document.getElementById("home-memorybox-card");
        var box = document.createElement("div");
        box.innerHTML = cardHTML();
        var el = box.firstChild;

        if (old) old.parentNode.replaceChild(el, old);
        else anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }

    window.refreshHomeMemoryBox = mount;

    /* ---------- 배냇함으로 가기 ----------
       탭 전환 함수 이름이 버전마다 달라서 아는 것부터 차례로 시도한다. -------- */

    window.goToMemoryBox = function () {
        var tries = ["openMemoryBox", "showMemoryBox", "renderMemoryBox"];
        for (var i = 0; i < tries.length; i++) {
            if (typeof window[tries[i]] === "function") {
                if (typeof window.switchTab === "function") { try { window.switchTab("memorybox"); } catch (e) {} }
                try { window[tries[i]](); return; } catch (e) {}
            }
        }
        var tab = document.querySelector('[onclick*="memorybox"], [onclick*="MemoryBox"], [data-tab="memorybox"]');
        if (tab) tab.click();
    };

    /* ---------- 놀이 처방전 내리기 ----------
       지우는 게 아니라 홈에서만 감춘다. 툴박스로는 그대로 들어간다. -------- */

    /* ---------- 도감 제목 찾기 ---------- */

    function milestoneList() {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        return list || window.MILESTONE_DATA || [];
    }

    function msTitle(id) {
        var m = milestoneList().filter(function (x) { return x.id === id; })[0];
        return m ? m.title : "";
    }

    function prettyKey(key) {
        var p = String(key).split("-");
        return p.length === 3 ? (Number(p[1]) + "월 " + Number(p[2]) + "일") : key;
    }

    /* ---------- 엽서로 뽑을 수 있는 것들 ---------- */

    function postcardables() {
        if (typeof window.photoDays !== "function") return [];
        var out = [];
        window.photoDays().sort().reverse().forEach(function (k) {
            (window.getDayPhotos(k) || []).slice().reverse().forEach(function (p) {
                out.push({
                    key: k, id: p.id,
                    url: (window.photoThumb ? window.photoThumb(p) : p.url),
                    msId: p.msId || null,
                    label: p.msId ? (msTitle(p.msId) || prettyKey(k)) : prettyKey(k),
                    sub: p.msId ? "처음 해낸 일" : "그날의 사진"
                });
            });
        });
        return out;
    }

    window.openPostcardPicker = function () {
        var items = postcardables();
        var wrap = document.getElementById("postcard-picker");
        if (wrap) wrap.remove();

        wrap = document.createElement("div");
        wrap.id = "postcard-picker";
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100001; background:rgba(25,21,18,0.55); display:flex; align-items:flex-end; justify-content:center;");
        wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };

        var rows = items.length
            ? items.map(function (it) {
                var act = it.msId
                    ? "window.downloadMilestone('" + it.msId + "')"
                    : "window.downloadPhotoCard('" + it.key + "','" + it.id + "')";
                return '<div onclick="document.getElementById(\'postcard-picker\').remove(); ' + act + '" ' +
                    'style="display:flex; align-items:center; gap:13px; padding:11px 4px; cursor:pointer;">' +
                    '<div style="width:52px; height:52px; border-radius:12px; overflow:hidden; flex-shrink:0; background:var(--bg-sub);">' +
                        '<img src="' + esc(it.url) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
                    '</div>' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="font-size:14.5px; font-weight:800; color:var(--text-title); letter-spacing:-0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(it.label) + '</div>' +
                        '<div style="font-size:11.5px; font-weight:700; color:var(--text-sub); margin-top:3px;">' + esc(it.sub) + '  ·  ' + esc(prettyKey(it.key)) + '</div>' +
                    '</div>' +
                    '<span style="font-size:11.5px; font-weight:800; color:#B08423; background:rgba(185,138,46,0.12); padding:6px 11px; border-radius:10px; flex-shrink:0;">엽서</span>' +
                '</div>';
              }).join('<div style="height:1px; background:var(--border); opacity:0.5;"></div>')
            : '<div style="padding:34px 0; text-align:center; font-size:13px; font-weight:700; color:var(--text-sub); line-height:1.7;">' +
                  '아직 담긴 사진이 없어요<br>배냇함에 한 장 담으면 엽서가 됩니다' +
              '</div>';

        wrap.innerHTML =
        '<div style="width:100%; max-width:520px; max-height:78vh; overflow-y:auto; background:var(--bg-card); border-radius:26px 26px 0 0; padding:24px 20px 34px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                '<span style="font-size:16px; font-weight:900; color:var(--text-m); letter-spacing:-0.3px;">💌 추억 엽서</span>' +
                '<span onclick="document.getElementById(\'postcard-picker\').remove()" style="font-size:22px; font-weight:300; color:var(--text-sub); cursor:pointer; line-height:1;">×</span>' +
            '</div>' +
            '<div style="font-size:12px; font-weight:700; color:var(--text-sub); margin-bottom:16px;">한 장 고르면 바로 이미지로 저장돼요</div>' +
            rows +
        '</div>';

        document.body.appendChild(wrap);
    };

    /* ---------- 4구 그리드 손보기 ----------
       놀이 처방전은 홈에서만 내리고, 빈자리에 엽서를 넣는다.
       엽서는 인스타에 올라갈 물건인데 4단계 깊이에 묻혀 있었다. -------- */

    function fixGrid() {
        var badge = document.getElementById("play-dday-badge");
        var grid = null;

        if (badge && badge.closest) {
            var tile = badge.closest("div[onclick]");
            if (tile && tile.parentNode) {
                tile.style.display = HIDE_PLAY ? "none" : "";
                grid = tile.parentNode;
            }
        }
        if (!grid) return;

        // 엽서 타일 (없으면 만들고, 있으면 숫자만 갱신)
        var n = postcardables().length;
        var card = document.getElementById("home-postcard-tile");
        if (!card) {
            card = document.createElement("div");
            card.id = "home-postcard-tile";
            card.setAttribute("onclick", "window.openPostcardPicker()");
            card.style.cssText = "background:linear-gradient(145deg,#FFFDF5 0%,#FBF1DA 100%); border-radius:24px; padding:22px 16px; display:flex; flex-direction:column; align-items:center; text-align:center; cursor:pointer; box-shadow:0 6px 16px rgba(185,138,46,0.08); border:1px solid #FFFCF0;";
            grid.appendChild(card);
        }
        card.innerHTML =
            '<div style="font-size:32px; margin-bottom:12px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">💌</div>' +
            '<div style="font-size:15px; font-weight:900; color:#B08423; margin-bottom:4px; letter-spacing:-0.3px;">추억 엽서</div>' +
            '<div style="font-size:12.5px; font-weight:800; color:#B08423; opacity:0.75;">' +
                (n ? n + "장 뽑을 수 있어요" : "사진부터 담아주세요") + '</div>';

        // 살아 있는 칸이 홀수면 마지막 하나를 한 줄로 편다
        var alive = [];
        for (var i = 0; i < grid.children.length; i++) {
            var c = grid.children[i];
            if (c.nodeType !== 1 || c.style.display === "none") continue;
            c.style.gridColumn = "";
            c.style.flexDirection = "column";
            c.style.gap = "";
            alive.push(c);
        }
        if (alive.length % 2 === 1) {
            var last = alive[alive.length - 1];
            last.style.gridColumn = "span 2";
            last.style.flexDirection = "row";
            last.style.justifyContent = "center";
            last.style.gap = "14px";
        }
    }

    /* ---------- 시작 ---------- */

    function boot() {
        mount();
        fixGrid();
        // 사진을 담거나 도감을 찍으면 홈도 같이 갱신되게
        setInterval(function () { mount(); fixGrid(); }, 30000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();