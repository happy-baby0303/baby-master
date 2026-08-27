/* ============================================================
   배냇함 — 내 주변 수유실 (nursing.js) 완전 개조판
   ============================================================ */
   (function () {
    'use strict';

    var SHEET_ID = "nursing-sheet";
    var data = null;      
    var loading = false;
    var myPos = null;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function toast(m) { if (typeof window.showToast === "function") window.showToast(m); }

    /* ---------- 두 점 사이 거리 (km) ---------- */
    function dist(a, b, c, d) {
        var R = 6371;
        var dLa = (c - a) * Math.PI / 180;
        var dLo = (d - b) * Math.PI / 180;
        var s = Math.sin(dLa / 2) * Math.sin(dLa / 2) +
                Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) *
                Math.sin(dLo / 2) * Math.sin(dLo / 2);
        return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }

    function distText(km) {
        if (km < 1) return Math.round(km * 1000) + "m";
        return km.toFixed(1) + "km";
    }

    /* ---------- 자료 불러오기 ---------- */
    function load() {
        if (data) return Promise.resolve(data);
        if (loading) return new Promise(function (r) {
            var t = setInterval(function () { if (data) { clearInterval(t); r(data); } }, 200);
        });

                // 지도가 이미 받아뒀으면 그걸 쓴다. 800KB 를 두 번 받을 이유가 없다.
        if (window.__nursingCache) { data = window.__nursingCache; return Promise.resolve(data); }

        loading = true;
        return fetch("nursing.json")
            .then(function (res) { return res.json(); })
            .then(function (j) { data = j; window.__nursingCache = j; loading = false; return j; })
            .catch(function (e) {
                loading = false;
                console.warn("[수유실] 자료 불러오기 실패", e);
                return [];
            });
    }

    /* ---------- 내 위치 ---------- */
    function locate() {
        return new Promise(function (resolve) {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                function (p) { resolve({ la: p.coords.latitude, lo: p.coords.longitude }); },
                function () { resolve(null); },
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
            );
        });
    }

    /* ---------- 목록 렌더링 (초압축 미니멀 디자인) ---------- */
    function rowHTML(p) {
        var distanceHtml = p._d !== undefined 
            ? '<div style="font-size:16px; font-weight:900; color:#3182F6; margin-bottom:4px;">' + distText(p._d) + '</div>'
            : '<div style="font-size:12px; font-weight:700; color:var(--text-s); margin-bottom:4px;">거리미상</div>';

        return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--border);">
            <div style="flex: 1; min-width: 0; padding-right: 12px;">
                <div style="font-size: 15px; font-weight: 900; color: var(--text-m); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${esc(p.title)}
                </div>
                <div style="font-size: 12.5px; font-weight: 600; color: var(--text-s); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${esc(p.locText || p.addr || '상세 주소 없음')}
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;">
                ${distanceHtml}
                <button onclick="window.openNursingMap('${esc(p.title).replace(/'/g, "")}')" style="background: #F2F4F6; color: #4E5968; border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;" onmousedown="this.style.background='#E5E8EB'" onmouseup="this.style.background='#F2F4F6'">
                    길찾기 〉
                </button>
            </div>
        </div>`;
    }

    window.openNursingMap = function (name) {
        window.open("https://map.naver.com/v5/search/" + encodeURIComponent(name), "_blank");
    };

    function render(list, hasPos) {
        var body = document.getElementById("nursing-body");
        if (!body) return;

        if (!list.length) {
            body.innerHTML = '<div style="padding:60px 0; text-align:center; font-size:14px; font-weight:700; color:var(--text-sub); line-height:1.6;">주변에 등록된 공공 수유실이 없어요 🥲<br>위치 권한을 허용했는지 확인해주세요.</div>';
            return;
        }

        body.innerHTML =
            (hasPos ? '' : '<div style="padding:12px; background:#FFF0F1; border-radius:12px; margin-bottom:16px; font-size:12.5px; font-weight:800; color:#F04452; text-align:center;">🚨 위치(GPS) 권한을 허용해야 가장 가까운 곳을 찾을 수 있어요!</div>') +
            list.slice(0, 50).map(rowHTML).join("");
    }

    /* ---------- 바텀시트 열기 ---------- */
    window.openNursingSheet = async function () {
        var old = document.getElementById(SHEET_ID);
        if (old) old.remove();

        // 아기 정보 연동
        var babyName = localStorage.getItem('tosil_babyName') || '우리아기';
        
        var wrap = document.createElement("div");
        wrap.id = SHEET_ID;
        wrap.setAttribute("style", "position:fixed; inset:0; z-index:100002; background:rgba(0,0,0,0.6); display:flex; flex-direction:column; justify-content:flex-end; opacity:0; transition:opacity 0.2s;");

        wrap.innerHTML = `
        <div style="background:#FFFFFF; width:100%; border-radius:24px 24px 0 0; padding:24px 20px 40px; box-sizing:border-box; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.1, 1, 0.2, 1); display:flex; flex-direction:column; max-height:85vh;">
            <div style="width:40px; height:5px; background:#E5E8EB; border-radius:3px; margin:0 auto 20px auto;"></div>
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                    <div style="font-size:13px; font-weight:800; color:#F04452; margin-bottom:4px;">🚨 당장 기저귀/수유가 급할 때</div>
                    <div style="font-size:22px; font-weight:900; color:#191F28; letter-spacing:-0.5px;">${babyName} 주변 수유실</div>
                </div>
                <button onclick="document.getElementById('${SHEET_ID}').style.opacity='0'; document.getElementById('${SHEET_ID}').children[0].style.transform='translateY(100%)'; setTimeout(()=>document.getElementById('${SHEET_ID}').remove(), 300); document.body.style.overflow='';" style="background:none; border:none; font-size:24px; color:#8B95A1; cursor:pointer; padding:0;">✕</button>
            </div>
            
            <div style="font-size:12px; font-weight:600; color:#8B95A1; margin-bottom:16px; background:#F9FAFB; padding:10px 14px; border-radius:10px; word-break:keep-all; line-height:1.4;">
                전국 1,102곳 (공공데이터 기준)<br>오래된 정보가 있을 수 있으니 꼭 전화를 먼저 해보세요!
            </div>
            
            <div id="nursing-body" style="overflow-y:auto; flex:1; padding-bottom:20px; scrollbar-width:none;">
                <div style="padding:60px 0; text-align:center; font-size:14px; font-weight:800; color:#8B95A1;">⏳ 가장 가까운 곳을 탐색 중입니다...</div>
            </div>
        </div>`;

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";
        
        setTimeout(() => {
            wrap.style.opacity = '1';
            wrap.children[0].style.transform = 'translateY(0)';
        }, 10);

        var list = await load();
        if (!list.length) {
            render([], false);
            return toast("수유실 자료를 불러오지 못했어요");
        }
  
        list = list.filter(p => !p.title.includes('001') && !p.title.includes('테스트'));
  
        var pos = myPos || await locate();
        myPos = pos;

        if (pos) {
            list = list.map(function (p) {
                var c = Object.create(p);
                c._d = dist(pos.la, pos.lo, p.lat, p.lng);
                return c;
            }).sort(function (a, b) { return a._d - b._d; });
        }

        render(list, !!pos);
    };

    /* ---------- 나들이 탭에 예쁘게 꽂아넣기 ---------- */
    function mount() {
        var box = document.getElementById("tab-hotplace");
        if (!box || document.getElementById("nursing-entry")) return;

        // 🌟 아기 나이 & 이름 가져오기
        var babyName = localStorage.getItem('tosil_babyName') || '우리아기';
        var startDate = localStorage.getItem('tosil_startDate');
        var ageText = '';
        if (startDate) {
            var diffDays = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
            var months = Math.floor(diffDays / 30);
            if(months >= 0) ageText = `${months}개월 `;
        }

        var el = document.createElement("div");
        el.id = "nursing-entry";
        el.onclick = window.openNursingSheet;
        // 디자인 평탄화 (선, 색상 깔끔하게)
        el.style.cssText = "background: linear-gradient(135deg, #FFF0F1 0%, #FFE4E6 100%); border-radius: 16px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.05); border: 1px solid #FFE4E6; cursor: pointer; margin-bottom: 24px;";
       // 🚨 [수정됨] 글씨가 길어져도 버튼이 가운데로 딸려오지 않고 무조건 우측 끝에 붙도록 Flex 레이아웃 보정!
        el.innerHTML = `
            <div style="flex: 1; min-width: 0; padding-right: 12px;">
                <div style="font-size: 12px; font-weight: 800; color: #E11D48; margin-bottom: 4px;">🚨 앗, 기저귀 갈 때 됐나요?</div>
                <div style="font-size: 16px; font-weight: 900; color: #BE123C; letter-spacing: -0.5px; word-break: keep-all; line-height: 1.3;">${ageText}${babyName} 가까운 수유실 찾기</div>
            </div>
            <div style="flex-shrink: 0; background: #FFFFFF; color: #E11D48; border-radius: 12px; padding: 8px 14px; font-size: 13px; font-weight: 900; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.1); white-space: nowrap;">3초 컷 〉</div>
        `;

        // 🚨 이 눈치 없는 녀석을 맨 위가 아니라 '주말 나들이' 제목 바로 아래에 얌전히 꽂아 넣습니다!
        var titleNode = document.querySelector('#tab-hotplace .app-desc');
        if (titleNode && titleNode.nextSibling) {
            titleNode.parentNode.insertBefore(el, titleNode.nextSibling);
        } else {
            box.insertBefore(el, box.firstChild);
        }
    }

    window.refreshNursingEntry = mount;

    function boot() {
        setTimeout(mount, 500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();

// 🚗 [니치 패치] 내비게이션 켜기 전 기저귀 가방 넛지(Nudge) 엔진
window.safeOpenMap = function(mapType, query) {
    // 1. 커스텀 팝업 생성
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px); animation:fadeIn 0.2s;';
    
    overlay.innerHTML = `
        <div style="background:var(--bg-card); width:85%; max-width:320px; border-radius:24px; padding:28px 24px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.15); animation:popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <div style="font-size:40px; margin-bottom:12px;">🎒</div>
            <div style="font-size:18px; font-weight:900; color:var(--text-m); margin-bottom:8px;">기저귀 가방은 챙기셨죠?</div>
            <div style="font-size:13px; font-weight:600; color:var(--text-s); margin-bottom:24px; line-height:1.5; word-break:keep-all;">
                출발 전, 빠진 물건이 없는지<br>3초만 확인하고 여유롭게 출발하세요!
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button id="btn-go-navi" style="width:100%; padding:16px; background:#3182F6; color:#FFF; border:none; border-radius:14px; font-size:15px; font-weight:900; cursor:pointer; box-shadow:0 4px 12px rgba(49,130,246,0.2);">
                    네, 완벽해요! 내비 켜기 🚗
                </button>
                <button id="btn-go-check" style="width:100%; padding:14px; background:var(--bg-sub); color:#4E5968; border:1px solid var(--border); border-radius:14px; font-size:14px; font-weight:800; cursor:pointer;">
                    앗, 외출 체크리스트 열기
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 내비 켜기 버튼
    document.getElementById('btn-go-navi').onclick = function() {
        overlay.remove();
        if(typeof window.openMap === 'function') window.openMap(mapType, query);
    };

    // 체크리스트 열기 버튼 (기존 함수 재활용)
    document.getElementById('btn-go-check').onclick = function() {
        overlay.remove();
        if(typeof window.openChecklistModal === 'function') window.openChecklistModal();
    };
};