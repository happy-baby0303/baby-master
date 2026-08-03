// ==========================================
// 1. 전역 상태 변수 및 통합 데이터 베이스
// ==========================================
let trendChart = null;
let currentRegion = 'all'; 
let currentSubTab = 'event'; 
let apiFestivals = []; 
let hotplacesData = []; 
let currentSubRegion = 'all'; 

let checklistData = [];
let selectedPillType = ''; 
let feverChartObj = null; 
let feverTimerInterval = null; 
let currentDonutChart = null;

// ==========================================
// 🚀 [초고속 패치] 렉 없는 즉각 반응형 화면 내비게이션 엔진
// ==========================================
function switchTab(id, el) {
    if(navigator.vibrate) navigator.vibrate(10);  

    // 1. 모든 탭 숨기기를 지연 없이 즉시 처리 (0.2초 대기 삭제)
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
    });
    
    // 2. 모든 탭 버튼 비활성화 및 아이콘 초기화
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        const icon = n.querySelector('img'); 
        const emoji = n.querySelector('span'); 
        if (icon) icon.style.transform = 'scale(1) translateY(0)';
        if (emoji) emoji.style.transform = 'scale(1) translateY(0)';
    });
    
    // 3. 선택한 탭 즉시 렌더링 (지연 시간 0초)
    const targetTab = document.getElementById('tab-' + id);
    if(targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
        targetTab.style.opacity = '1';
        targetTab.style.transform = 'translateY(0)';
    }
    
    let targetNav = el;
    if (!targetNav) targetNav = document.getElementById('nav-' + id);
    
    if (targetNav) {
        targetNav.classList.add('active');
        const icon = targetNav.querySelector('img') || targetNav.querySelector('span'); 
        if (icon) {
            icon.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
            icon.style.transform = 'scale(1.15) translateY(-2px)';
            setTimeout(() => { icon.style.transform = 'scale(1) translateY(0)'; }, 150);
        }
    }

    // 설정 탭 내부 렌더링
    if (id === 'settings') {
        if (typeof window.renderSettingsTab === 'function') {
            window.renderSettingsTab();
        }
    }

    // 플로팅 버튼 제어
    const fabBtn = document.getElementById('global-fab-write');
    if (fabBtn) {
        if (id === 'community') {  
            fabBtn.style.display = 'flex'; 
        } else {
            fabBtn.style.display = 'none'; 
        }
    }

    // 탭 바뀔 때 스크롤 맨 위로 즉시 이동
    window.scrollTo({ top: 0, behavior: 'auto' });
}
function directGoOuting(subType) {
    switchTab('hotplace', document.getElementById('nav-hotplace'));
    switchOutingSubTab(subType);
}

function directGoToolbox(toolType) {
    switchTab('toolbox', document.getElementById('nav-toolbox'));
    const targetChip = document.getElementById('btn-tool-' + toolType);
    switchTool(toolType, targetChip);
}

// 🚨 [패치 완료] 행사/핫플 탭 전환 시 지역 필터 연동
function switchOutingSubTab(type) {
    document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    const segBtn = document.getElementById('seg-' + type);
    if(segBtn) segBtn.classList.add('active');
    
    currentSubTab = type; currentSubRegion = 'all';
    
    // 🚨 [핵심] 행사뿐만 아니라 핫플 탭이어도 지역을 선택했다면 무조건 서브 필터(가로 스크롤) 등장!
    const subRow = document.getElementById('sub-filter-row');
    if (currentRegion !== 'all') { 
        generateSubFilters(currentRegion); 
    } else { 
        if(subRow) subRow.style.display = 'none'; 
    }
    filterPlaces();
}

// ✨ 👇 방금 지운 자리에 이것을 통째로 붙여넣으세요! 👇 ✨

// ==========================================
// ✨ 툴박스 화면 부드러운 전환 (Fade-Up) 패치
// ==========================================
if (!document.getElementById('tool-animation-style')) {
    const style = document.createElement('style');
    style.id = 'tool-animation-style';
    style.innerHTML = `@keyframes toolFadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }`;
    document.head.appendChild(style);
}

function switchTool(panelId, el) {
    document.querySelectorAll('.tool-chip').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');
    else { const targetChip = document.getElementById('btn-tool-' + panelId); if(targetChip) targetChip.classList.add('active'); }
    
    const toolboxTab = document.getElementById('tab-toolbox');
    if(toolboxTab) {
        toolboxTab.querySelectorAll('.panel-block').forEach(p => { 
            p.classList.remove('active'); 
            p.style.display = 'none'; 
            p.style.animation = ''; // 기존 애니메이션 리셋
        });
    }
    
    const targetPanel = document.getElementById('panel-' + panelId);
    if(targetPanel) { 
        targetPanel.classList.add('active'); 
        targetPanel.style.display = 'block'; 
        // 👇 대기업 앱 특유의 쫀득한 팝업 효과
        targetPanel.style.animation = 'toolFadeUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
    }

    if (panelId === 'fever') {
        const wInput = document.getElementById('v-weight');
        const savedW = localStorage.getItem('tosil_latest_weight');
        if (wInput && savedW && !wInput.value) {
            wInput.value = savedW;
            const label = wInput.parentElement ? wInput.parentElement.previousElementSibling : null;
            if (label && !label.innerText.includes('자동입력')) {
                label.innerHTML += ' <span style="font-size:11px; color:var(--primary); background:rgba(49,130,246,0.1); padding:2px 6px; border-radius:6px; margin-left:6px;">성장기록 자동입력</span>';
            }
        }
    }
}

function navigateToPanel(targetPanel) {
    if (targetPanel === 'hotplace') { switchTab('hotplace'); } 
    else { switchTab('toolbox'); switchTool(targetPanel === 'ledger' ? 'money' : targetPanel); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initQuickScrollDrag() {
    const slider = document.querySelector('.quick-scroll-wrap');
    if(!slider) return;
    let isDown = false, startX, scrollLeft;
    slider.addEventListener('mousedown', (e) => { isDown = true; slider.style.cursor = 'grabbing'; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'auto'; });
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'auto'; });
    slider.addEventListener('mousemove', (e) => { if(!isDown) return; e.preventDefault(); slider.scrollLeft = scrollLeft - (e.pageX - slider.offsetLeft - startX) * 2; });
}

function getV(id) { const el = document.getElementById(id); return !el ? 0 : Number(el.value.replace(/,/g,'')) || 0; }
function formatNum(el) { let v = el.value.replace(/[^0-9]/g, ''); if(v) el.value = Number(v).toLocaleString(); }

async function loadAllExternalData() {
    filterPlaces();
    try {
        if (window.location.protocol !== 'file:') {
            const resFest = await fetch('festivals.json?v=' + new Date().getTime());
            if (resFest.ok) { apiFestivals = await resFest.json(); filterPlaces(); }
            const resPlaces = await fetch('places.json?v=' + new Date().getTime());
            if (resPlaces.ok) { hotplacesData = await resPlaces.json(); filterPlaces(); }
        }
    } catch (e) { console.warn("데이터 로드 실패 - 앱은 정상 작동 중"); }
}

// 🚨 [패치 완료] 큰 지역 누를 때 세부 지역 필터 재생성
function setRegion(region, btn) {
    currentRegion = region;
    document.querySelectorAll('.filter-wrap .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentSubRegion = 'all'; 
    if (currentRegion !== 'all') { 
        generateSubFilters(region); 
    } else {
        const subRow = document.getElementById('sub-filter-row');
        if(subRow) subRow.style.display = 'none'; 
    }
    
    filterPlaces();
}

function toggleAccordion(index) {
    const body = document.getElementById('acc-body-' + index), arrow = document.getElementById('acc-arrow-' + index);
    if(!body) return;
    if(body.style.display === 'block') { body.style.display = 'none'; if(arrow) arrow.style.transform = 'rotate(0deg)'; } 
    else { body.style.display = 'block'; if(arrow) arrow.style.transform = 'rotate(180deg)'; }
}

function openGoogleForm() { window.open('https://forms.gle/gWYhuNrwiKNvyCEQA', '_blank'); }

// 🚨 [패치 완료] 핫플 탭에서도 세부 지역 필터 나오게 수정
function generateSubFilters(mainRegion) {
    const subRow = document.getElementById('sub-filter-row'), subRegions = new Set();
    if(!subRow) return;

    let source = [];
    if (currentSubTab === 'event') {
        source = [...apiFestivals, ...hotplacesData.filter(p => p.isEvent)];
    } else {
        source = hotplacesData.filter(p => !p.isEvent);
    }

    source.forEach(item => {
        const addr = item.locText || item.addr1 || item.addr || '';
        let isMatched = false;

        // 🌟 1. 데이터에 region 속성이 있으면 무조건 통과! (의왕, 하남 누락 방지)
        if (item.region === mainRegion) {
            isMatched = true;
        } else {
            if (mainRegion === 'seoul' && addr.includes('서울')) isMatched = true;
            if (mainRegion === 'gyeonggi' && (addr.includes('경기') || addr.includes('인천') || addr.includes('용인') || addr.includes('동탄') || addr.includes('수원'))) isMatched = true;
            if (mainRegion === 'chungcheong' && (addr.includes('충청') || addr.includes('충북') || addr.includes('충남') || addr.includes('대전') || addr.includes('세종'))) isMatched = true;
            if (mainRegion === 'gangwon' && addr.includes('강원')) isMatched = true;
            if (mainRegion === 'jeolla' && (addr.includes('전라') || addr.includes('전북') || addr.includes('전남') || addr.includes('광주'))) isMatched = true;
            if (mainRegion === 'gyeongsang' && (addr.includes('경상') || addr.includes('경북') || addr.includes('경남') || addr.includes('부산') || addr.includes('대구') || addr.includes('울산'))) isMatched = true;
            if (mainRegion === 'jeju' && addr.includes('제주')) isMatched = true;
        }
        
        if (isMatched) { 
            // 🌟 2. locText가 있으면 무조건 우선 추가
            if (item.locText && item.locText.length >= 1 && item.locText !== '경기외곽' && item.locText !== '서울') {
                subRegions.add(item.locText);
            } else {
                const parts = addr.split(' '); 
                if (parts[1] && parts[1].length > 1) subRegions.add(parts[1]); 
            }
        }
    });

    if (subRegions.size === 0) { subRow.style.display = 'none'; return; }
    
    subRow.style.display = 'flex';
    subRow.style.overflowX = 'auto'; 
    subRow.style.gap = '8px';
    subRow.style.paddingBottom = '8px';

    let html = `<button class="filter-btn ${currentSubRegion === 'all' ? 'active' : ''}" style="padding:6px 12px; font-size:12px; flex-shrink:0; white-space:nowrap;" onclick="setSubRegion('all', this)">시·군·구 전체</button>`;
    
    Array.from(subRegions).sort().forEach(sub => { 
        html += `<button class="filter-btn ${currentSubRegion === sub ? 'active' : ''}" style="padding:6px 12px; font-size:12px; flex-shrink:0; white-space:nowrap;" onclick="setSubRegion('${sub}', this)">${sub}</button>`; 
    });
    
    subRow.innerHTML = html;
}

// 🚨 [패치 완료] 세부 지역 탭핑 시 적용
function setSubRegion(sub, btn) {
    document.querySelectorAll('#sub-filter-row .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); 
    currentSubRegion = sub; 
    filterPlaces();
}

// 🚨 [패치 완료] 끝난 행사 숨기기 + 먼 행사 숨기기 + 핫플 지역 필터 적용
function filterPlaces() {
    const searchInput = document.getElementById('spot-search');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const container = document.getElementById('hotplace-container');
    if(!container) return; 
    container.innerHTML = ''; 
    
    // 시간 계산용 변수 세팅
    const now = new Date();
    const todayNum = parseInt(now.toISOString().split('T')[0].replace(/-/g,'')); // 예: 20260719
    const currentMonthNum = parseInt(now.toISOString().split('T')[0].replace(/-/g,'').substring(0, 6)); // 예: 202607

    if (currentSubTab === 'event') {
        let eventSource = Array.from(new Map([...apiFestivals, ...hotplacesData.filter(p => p.isEvent)].map(i => [i.title, i])).values());
        const filteredEvents = eventSource.filter(p => {
            let addr = p.addr1 || p.addr || p.locText || '', title = p.title || '';
            if (p.expiryDate && now.toISOString().split('T')[0] > p.expiryDate) return false; 
            
            let rawStartDate = String(p.eventstartdate || p.datetime || '').replace(/[^0-9]/g, '');
            let rawEndDate = String(p.eventenddate || p.endDate || '').replace(/[^0-9]/g, '');
            
            let sMonth = rawStartDate.length >= 8 ? parseInt(rawStartDate.substring(0, 6)) : 0;
            let eDate = rawEndDate.length >= 8 ? parseInt(rawEndDate.substring(0, 8)) : 0;

            // 🚨 1. 종료일이 오늘보다 과거면 끝난 행사! 칼같이 컷
            if (eDate && eDate < todayNum) return false; 
            
            // 🚨 2. 시작일의 달(Month)이 이번 달보다 미래(예: 8월, 9월)면 칼같이 컷!
            if (sMonth && sMonth > currentMonthNum) return false;

            let matchesRegion = false;
            if (currentRegion === 'all') { matchesRegion = true; } 
            else {
                if (currentRegion === 'seoul') matchesRegion = addr.includes('서울');
                if (currentRegion === 'gyeonggi') matchesRegion = addr.includes('경기') || addr.includes('인천');
                if (currentRegion === 'chungcheong') matchesRegion = addr.includes('충청') || addr.includes('충북') || addr.includes('충남') || addr.includes('대전') || addr.includes('세종');
                if (currentRegion === 'gangwon') matchesRegion = addr.includes('강원');
                if (currentRegion === 'jeolla') matchesRegion = addr.includes('전라') || addr.includes('전북') || addr.includes('전남') || addr.includes('광주');
                if (currentRegion === 'gyeongsang') matchesRegion = addr.includes('경상') || addr.includes('경북') || addr.includes('경남') || addr.includes('부산') || addr.includes('대구') || addr.includes('울산');
                if (currentRegion === 'jeju') matchesRegion = addr.includes('제주');
            }
            return matchesRegion && (currentSubRegion === 'all' || addr.includes(currentSubRegion)) && `${title} ${addr}`.toLowerCase().includes(keyword);
        });
        
        if(filteredEvents.length === 0) { container.innerHTML = `<p style="text-align:center; padding:50px 0; color:var(--text-sub); font-size:14px; font-weight:700;">🔍 이번 달에 예정된 행사가 없습니다.</p>`; return; }
        const gridEl = document.createElement('div'); gridEl.className = 'festival-grid';
        filteredEvents.forEach(item => {
            const title = item.title || '', addr = item.addr1 || item.addr || item.locText || '', rawImg = item.firstimage || '';
            let sd = item.eventstartdate || item.datetime || '', ed = item.eventenddate || '';
            if(sd.length >= 8) sd = `${sd.substring(4,6)}.${sd.substring(6,8)}`; if(ed.length >= 8) ed = `${ed.substring(4,6)}.${ed.substring(6,8)}`;
            const dateText = ed ? `${sd} ~ ${ed}` : sd, shortAddr = `${addr.split(' ')[0] || ''} ${addr.split(' ')[1] || ''}`.replace('특별', '').replace('광역', '');
            const card = document.createElement('div'); card.className = 'fest-card';
            let imgHtml = rawImg ? `<img src="${rawImg}" onerror="this.style.display='none';">` : `<div style="width:100%; height:100%; background:linear-gradient(135deg, #EBF4FF, #EAEFF7); display:flex; align-items:center; justify-content:center; font-size:32px;">🎪</div>`;
            card.onclick = () => openFestivalModal(title, dateText, addr, item.tel || '정보없음', item.review || '', title, rawImg || '⚙️GRAPHIC');
            card.innerHTML = `<div class="fest-card-img-wrap"><span class="fest-dday-tag">🎉 이번달 축제</span>${imgHtml}</div><div class="fest-card-info"><div class="fest-card-title">${title}</div><div class="fest-card-meta">${shortAddr}</div></div>`;
            gridEl.appendChild(card);
        }); container.appendChild(gridEl);

    } else {
        // [검증 육아지도 로직]
        const filteredPlaces = hotplacesData.filter(p => {
            if (p.isEvent) return false;
            let matchesRegion = false;
            let addr = p.locText || p.addr || '';
            
            if (currentRegion === 'all') { matchesRegion = true; }
            else if (currentRegion === 'seoul') matchesRegion = p.region === 'seoul' || addr.includes('서울');
            else if (currentRegion === 'gyeonggi') matchesRegion = p.region === 'gyeonggi' || p.region === 'incheon' || addr.includes('경기') || addr.includes('인천') || addr.includes('동탄') || addr.includes('수원');
            
            return matchesRegion && (currentSubRegion === 'all' || addr.includes(currentSubRegion)) && `${p.title} ${p.desc} ${p.locText}`.toLowerCase().includes(keyword);
        });

        let htmlString = ''; 
        filteredPlaces.forEach((p) => {
            let tagsHTML = '';
            if (p.tags && Array.isArray(p.tags)) {
                tagsHTML = p.tags.map(tag => `<span style="background:#F2F5F8; color:#4E5968; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:800; border: 1px solid #E5E8EB; margin-right:4px; display:inline-block; margin-bottom:4px;">#${tag.t || tag}</span>`).join('');
            }
            let mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(p.query || p.title)}`;
            
     // 🌟 [핵심 패치] '경기외곽' 버리고 주소(addr)에서 진짜 동네 이름 뽑기!
            let realLocation = p.locText || '지역';
            if (p.addr) {
                const addrParts = p.addr.split(' ');
                if (addrParts.length > 1) {
                    realLocation = addrParts[1].replace('시', '').replace('구', '').replace('군', '');
                }
            }

            htmlString += `
                <div class="box-main" style="border-radius: 20px; padding: 22px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid var(--border); text-align: left; background: var(--bg-card);">
                    
                    <!-- 상단: 지역 배지 & 타이틀 -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background:#EBF4FF; color:#3182F6; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:900;">${realLocation}</span>
                            <div style="font-size: 17px; font-weight: 900; color: var(--text-m);">${p.title} ${p.emoji || '📍'}</div>
                        </div>
                    </div>

                    <!-- 설명 텍스트 -->
                    <div style="font-size: 13.5px; color: var(--text-s); font-weight: 600; margin-bottom: 12px; line-height: 1.5; word-break: keep-all;">
                        ${p.desc || ''}
                    </div>

                    <!-- 해시태그 -->
                    <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 4px;">
                        ${tagsHTML}
                    </div>

                    <!-- 토실이 검증 박스 -->
                    <div class="place-review" style="font-size:12.5px; color:var(--text-s); background:var(--bg-sub); padding:12px; border-radius:10px; margin-bottom:16px; border: 1px dashed var(--border);">
                        <strong>💬 토실이 검증:</strong> "${p.review || '유모차와 함께하기 좋은 곳이에요!'}"
                    </div>

                    <!-- 하단 액션 버튼 (맵 열기 + 아빠한테 내비 쏘기 2분할) -->
                    <div style="display: flex; gap: 10px;">
                        <a href="${mapUrl}" target="_blank" style="flex: 1; text-align: center; padding: 14px; background: #F2F5F8; color: #4E5968; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; transition: 0.2s;">
                            맵 열기 〉
                        </a>
                        <button onclick="window.sendNaviToDad('${p.title}', '${p.addr || ''}')" style="flex: 1.5; padding: 14px; background: #FEE500; color: #191F28; border: none; border-radius: 12px; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 10px rgba(254, 229, 0, 0.2); transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-5.523 0-10 3.535-10 7.896 0 2.766 1.767 5.19 4.418 6.586l-1.127 4.195c-.092.342.278.618.575.434l4.908-3.232c.404.056.817.086 1.226.086 5.523 0 10-3.535 10-7.896C22 6.535 17.523 3 12 3z"/></svg>
                            아빠한테 내비 쏘기
                        </button>
                    </div>

                </div>
            `;
        });
        container.innerHTML = htmlString;
    }
}

// ==========================================
// 🎪 행사 모달창 프리미엄 UI 패치 (티맵/카카오맵 모바일 앱 강제 연동!)
// ==========================================
function openFestivalModal(title, dateText, addr, tel, review, query, image) {
    const body = document.getElementById('modal-dynamic-body');
    if(!body) return;
    
    const naverUrl = 'https://m.map.naver.com/search2/search.naver?query=' + encodeURIComponent(query);
    
    // 🚨 [핵심 패치 1] 티맵 웹사이트가 아니라, 스마트폰 티맵 앱을 강제로 열어버리는 전용 주소!
    const tmapUrl = 'tmap://search?name=' + encodeURIComponent(query);
    
    // 🚨 [핵심 패치 2] 카카오맵도 웹사이트 말고 모바일 앱이 바로 켜지도록 최적화
    const kakaoUrl = 'https://map.kakao.com/link/search/' + encodeURIComponent(query);
    
    const telBtn = tel && tel !== '정보없음' 
        ? `<button onclick="window.location.href='tel:${tel}'" style="flex:1; padding:16px; background:#F2F5F8; color:#4E5968; border-radius:14px; font-weight:900; font-size:15px; border:none; cursor:pointer;">📞 전화 문의</button>` 
        : `<button disabled style="flex:1; padding:16px; background:#F2F5F8; color:#A0AEC0; border-radius:14px; font-weight:900; font-size:15px; border:none; opacity:0.6;">📞 번호 없음</button>`;
        
    const modalImgHtml = (image && !image.startsWith('⚙️')) 
        ? `<div style="width:100%; height:200px; border-radius:18px; overflow:hidden; margin-bottom:20px; box-shadow:0 4px 16px rgba(0,0,0,0.06); position:relative;">
             <img src="${image}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
             <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.6); color:#FFF; font-size:11px; font-weight:800; padding:4px 8px; border-radius:8px; backdrop-filter:blur(4px);">행사 전경</div>
           </div>` 
        : `<div style="width:100%; height:140px; border-radius:18px; background:linear-gradient(135deg, #EBF4FF, #EAEFF7); margin-bottom:20px; display:flex; align-items:center; justify-content:center; font-size:40px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">🎪</div>`;

    body.innerHTML = `
        <div style="padding: 10px 4px 20px 4px;">
            <!-- 🏷️ 제목 영역 -->
            <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:16px;">
                <span style="font-size:26px; background:#F2F5F8; padding:8px; border-radius:14px; box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">🌲</span>
                <div style="font-size:20px; font-weight:900; color:#191F28; letter-spacing:-0.5px; line-height:1.3; word-break:keep-all; margin-top:2px;">${title}</div>
            </div>

            <!-- 📸 메인 이미지 -->
            ${modalImgHtml}

            <!-- 🗓️ 기본 정보 박스 -->
            <div style="background:#F8F9FA; padding:18px; border-radius:16px; margin-bottom:20px; border:1px solid #E5E8EB;">
                <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
                    <span style="font-size:18px; margin-top:2px;">🗓️</span>
                    <div>
                        <div style="font-size:11.5px; font-weight:800; color:#8B95A1; margin-bottom:4px;">행사 기간</div>
                        <div style="font-size:14.5px; font-weight:800; color:#333D4B;">${dateText}</div>
                    </div>
                </div>
                <div style="display:flex; gap:12px; align-items:flex-start;">
                    <span style="font-size:18px; margin-top:2px;">📍</span>
                    <div>
                        <div style="font-size:11.5px; font-weight:800; color:#8B95A1; margin-bottom:4px;">행사 장소</div>
                        <div style="font-size:14.5px; font-weight:800; color:#333D4B; line-height:1.4; word-break:keep-all;">${addr}</div>
                    </div>
                </div>
            </div>

            <!-- 💡 팩트 체크 박스 -->
            <div style="background:linear-gradient(135deg, #F4F0FF 0%, #F9F7FF 100%); padding:18px; border-radius:16px; margin-bottom:24px; border:1px solid #EBE5FF; display:flex; gap:12px; align-items:flex-start;">
                <span style="font-size:20px; margin-top:2px;">💡</span>
                <div>
                    <div style="font-size:12.5px; font-weight:900; color:#6B4EFF; margin-bottom:6px;">토실이 팩트 체크</div>
                    <div style="font-size:14px; font-weight:800; color:#4E5968; line-height:1.5; word-break:keep-all;">"${review || '맞춤형 주말 안전 인프라입니다.'}"</div>
                </div>
            </div>

            <!-- 🚗 길찾기 영역 -->
            <div style="font-size:13.5px; font-weight:900; color:#191F28; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span>🚗</span> 아기랑 모바일 길찾기
            </div>
            <div style="display:flex; gap:10px; margin-bottom:24px;">
                <a href="${naverUrl}" target="_blank" style="flex:1; padding:12px 0; background:#FFF; border:1px solid #E5E8EB; border-radius:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 2px 6px rgba(0,0,0,0.02); text-decoration:none;">
                    <div style="width:36px; height:36px; background:#03C75A; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#FFF; font-weight:900; font-size:18px;">N</div>
                    <span style="font-size:11.5px; font-weight:800; color:#4E5968;">네이버 지도</span>
                </a>
                <a href="${tmapUrl}" style="flex:1; padding:12px 0; background:#FFF; border:1px solid #E5E8EB; border-radius:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 2px 6px rgba(0,0,0,0.02); text-decoration:none;">
                    <div style="width:36px; height:36px; background:#111111; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#FFF; font-weight:900; font-size:18px;">T</div>
                    <span style="font-size:11.5px; font-weight:800; color:#4E5968;">티맵</span>
                </a>
                <a href="${kakaoUrl}" target="_blank" style="flex:1; padding:12px 0; background:#FFF; border:1px solid #E5E8EB; border-radius:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 2px 6px rgba(0,0,0,0.02); text-decoration:none;">
                    <div style="width:36px; height:36px; background:#FEE500; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#191F28; font-weight:900; font-size:18px;">K</div>
                    <span style="font-size:11.5px; font-weight:800; color:#4E5968;">카카오맵</span>
                </a>
            </div>

            <!-- ✅ 하단 액션 버튼 -->
            <div style="display:flex; gap:10px; margin-bottom: 0;">
                ${telBtn}
                <button onclick="closeFestivalModalForce()" style="flex:2; padding:16px; background:#3182F6; color:#FFF; border-radius:14px; font-weight:900; font-size:15px; border:none; box-shadow:0 4px 12px rgba(49,130,246,0.3); cursor:pointer;">확인 완료</button>
            </div>
            
            <div style="width: 100%; height: 20px; display: block; clear: both; flex-shrink: 0;"></div>
        </div>
    `;
    const modalWrap = document.getElementById('premium-modal');
    if(modalWrap) modalWrap.style.display = 'flex';
}

// 👇 절대 지우면 안 되는 모달 닫기 함수들! (안전하게 같이 둡니다)
function closeFestivalModalForce() { const m = document.getElementById('premium-modal'); if(m) m.style.display = 'none'; }
function closeFestivalModal(e) { if(e.target.className === 'modal-overlay') closeFestivalModalForce(); }

// ==========================================
// 🚨 3. 119 SOS 센터 모달
// ==========================================
window.openSOSModal = function() {
    const modal = document.getElementById('sos-modal'); if(!modal) return;
    const medStep = document.getElementById('sos-step-medical'); if(medStep) medStep.style.setProperty('display', 'none', 'important');
    const cryStep = document.getElementById('sos-step-cry'); if(cryStep) cryStep.style.setProperty('display', 'none', 'important');
    const backBtn = document.getElementById('btn-sos-back'); if(backBtn) backBtn.style.setProperty('display', 'none', 'important');
    const choiceStep = document.getElementById('sos-step-choice'); if(choiceStep) choiceStep.style.setProperty('display', 'block', 'important');
    
    const medBtn = document.querySelector('.sos-btn-medical');
    const cryBtn = document.querySelector('.sos-btn-cry');
    if(medBtn) medBtn.style.setProperty('display', 'flex', 'important');
    if(cryBtn) cryBtn.style.setProperty('display', 'flex', 'important');
    modal.style.display = 'flex';
};
window.showSosMedical = function() { 
    const choiceStep = document.getElementById('sos-step-choice'); if(choiceStep) choiceStep.style.setProperty('display', 'none', 'important');
    const medBtn = document.querySelector('.sos-btn-medical');
    const cryBtn = document.querySelector('.sos-btn-cry');
    if(medBtn) medBtn.style.setProperty('display', 'none', 'important');
    if(cryBtn) cryBtn.style.setProperty('display', 'none', 'important');
    const medStep = document.getElementById('sos-step-medical'); if(medStep) medStep.style.setProperty('display', 'block', 'important');
    const backBtn = document.getElementById('btn-sos-back'); if(backBtn) backBtn.style.setProperty('display', 'flex', 'important');
};
window.showSosChecklist = function() { 
    const choiceStep = document.getElementById('sos-step-choice'); if(choiceStep) choiceStep.style.setProperty('display', 'none', 'important');
    const medBtn = document.querySelector('.sos-btn-medical');
    const cryBtn = document.querySelector('.sos-btn-cry');
    if(medBtn) medBtn.style.setProperty('display', 'none', 'important');
    if(cryBtn) cryBtn.style.setProperty('display', 'none', 'important');
    const cryStep = document.getElementById('sos-step-cry'); if(cryStep) cryStep.style.setProperty('display', 'block', 'important');
    const backBtn = document.getElementById('btn-sos-back'); if(backBtn) backBtn.style.setProperty('display', 'flex', 'important');
};
window.closeSOSForce = function() { const modal = document.getElementById('sos-modal'); if(modal) modal.style.display = 'none'; };
window.closeSOS = function(e) { if(e.target.id === 'sos-modal') closeSOSForce(); };

// ==========================================
// 💰 [가계부 업그레이드] 투트랙 실시간 저금통 엔진 병합
// ==========================================
async function saveLedgerToFirebase(data) {
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { await setDoc(doc(db, "ledger_" + syncCode, "status"), data); } catch (e) { console.error(e); }
    }
    localStorage.setItem('tosil_ledger_data', JSON.stringify(data));
    updateLedgerUI();
}

const formatter = new Intl.NumberFormat('ko-KR'); 


// ==========================================
// 💡 숫자 픽셀 길이에 맞춰 밑줄/크기가 완벽하게 따라붙는 함수 (잘림 방지 패치)
// ==========================================
window.resizeInput = function(el) {
    let span = document.createElement('span');
    span.style.font = window.getComputedStyle(el).font;
    span.style.letterSpacing = window.getComputedStyle(el).letterSpacing; // 글자 간격까지 계산
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.style.position = 'absolute';
    span.innerText = el.value || el.placeholder;
    document.body.appendChild(span);
    
    // getBoundingClientRect를 써서 소수점 픽셀까지 더 정확하게 측정!
    let width = span.getBoundingClientRect().width; 
    document.body.removeChild(span);
    
    // 🚨 핵심 패치: 커서 공간 등 여유 버퍼를 15px 정도 넉넉하게 줘서 절대 안 잘리게 만듭니다!
    el.style.width = Math.max(width + 15, 20) + 'px'; 
};

// ==========================================
// 🍩 토스 스타일 도넛 차트 (차트 바깥쪽 라벨 렌더링)
// ==========================================
function drawDonutChart(d, f, e) {
    const canvas = document.getElementById('donutChart');
    if(!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    
    if(currentDonutChart) { currentDonutChart.destroy(); }
    
    const total = d + f + e;

    const floatingLabelPlugin = {
        id: 'floatingLabels',
        afterDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            
            ctx.save();
            ctx.textBaseline = 'middle';
            
            meta.data.forEach((arc, i) => {
                const val = chart.data.datasets[0].data[i];
                if (val === 0) return; 
                
                const pct = Math.round((val / total) * 100) + '%';
                const labelName = chart.data.labels[i];
                const color = chart.data.datasets[0].backgroundColor[i];
                
                const angle = (arc.startAngle + arc.endAngle) / 2;
                const radius = arc.outerRadius + 20; 
                const x = arc.x + Math.cos(angle) * radius;
                const y = arc.y + Math.sin(angle) * radius;
                
                ctx.textAlign = x < arc.x ? 'right' : 'left';
                
                ctx.font = 'bold 13px sans-serif';
                ctx.fillStyle = color;
                ctx.fillText(`${labelName} ${pct}`, x, y - 8);
                
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#8B95A1';
                ctx.fillText(`${formatter.format(val)}원`, x, y + 10);
            });
            ctx.restore();
        }
    };

    currentDonutChart = new Chart(ctx, { 
        type: 'doughnut', 
        data: { 
            labels: ['위생용품', '분유/식비', '장난감/기타'], 
            datasets: [{ 
                data: [d, f, e], 
                backgroundColor: ['#3182F6', '#10B981', '#FF823A'], 
                borderWidth: 0, 
            }] 
        }, 
        plugins: [floatingLabelPlugin], 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            layout: { padding: 50 }, 
            cutout: '60%', 
            plugins: { 
                legend: { display: false }, 
                tooltip: { enabled: false } 
            }, 
            animation: { animateScale: true, animateRotate: true } 
        } 
    });
}

// ==========================================
// 💰 가계부 분석 (통합형 엔진 & 부드러운 카피라이팅 패치)
// ==========================================
window.analyzeMoney = function() {
    const ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { categories: { diaper: 0, food: 0, etc: 0 } };
    if(!ledger.categories) ledger.categories = { diaper: 0, food: 0, etc: 0 };
    
    const d = ledger.categories.diaper || 0;
    const f = ledger.categories.food || 0;
    const e = ledger.categories.etc || 0;
    const detailsTotal = d + f + e;

    const budgetInput = document.getElementById('v-budget');
    let userBudget = parseInt(localStorage.getItem('tosil_budget')) || 500000; 
    if (budgetInput && budgetInput.value) { 
        userBudget = parseInt(budgetInput.value.replace(/,/g, '')) || 500000; 
        localStorage.setItem('tosil_budget', userBudget);
    }
    
    const budgetDisplayEl = document.getElementById('budget-display');
    if(budgetDisplayEl) budgetDisplayEl.innerText = Math.floor(userBudget / 10000);

    const resBox = document.getElementById('money-result'); 
    const emptyState = document.getElementById('money-empty-state');

    if(detailsTotal === 0) {
        if(resBox) resBox.style.display = 'none';
        if(emptyState) emptyState.style.display = 'block';
        return; 
    }

    const budgetPercent = Math.round((detailsTotal / userBudget) * 100);
    
    // 1. 예산 대비 소진율 그라데이션 바 업데이트! 🌟
    const progressBox = document.getElementById('v-budget-progress');
    const statusText = document.getElementById('budget-status-text');

    if (progressBox && statusText) {
        let visualPercent = Math.min(budgetPercent, 100); // 100%가 넘어도 배경색이 삐져나가지 않게 제한

        if (budgetPercent >= 90) {
            // 90% 이상: 경고 메시지와 빨간색 그라데이션 🚨
            statusText.innerText = budgetPercent >= 100 
                ? `예산을 초과했어요! 지갑 지킴이 출동 🚨 (${budgetPercent}%)` 
                : `예산이 얼마 안 남았어요! ⚠️ (${budgetPercent}%)`;
            
            progressBox.style.background = `linear-gradient(90deg, #FCA5A5 ${visualPercent}%, #FEF2F2 ${visualPercent}%)`;
            statusText.style.color = '#EF4444';
        } else {
            // 90% 미만: 시원한 파란색 게이지 🌊
            statusText.innerText = `이번 달 예산의 ${budgetPercent}%를 썼어요 💸`;
            progressBox.style.background = `linear-gradient(90deg, #BFDBFE ${visualPercent}%, #EBF4FF ${visualPercent}%)`;
            statusText.style.color = '#2563EB';
        }
    }

    // 2. 인사이트 문구 & 여백 시원하게 뚫어주기 (flex와 gap 사용)
    let maxLabel = '기저귀/위생용품';
    if (Math.max(d, f, e) === f) maxLabel = '분유/식비';
    if (Math.max(d, f, e) === e) maxLabel = '장난감/기타';

    let insightText = "알뜰하게 잘 방어하고 계시네요! 아주 좋습니다 🌿";
    if (detailsTotal > 0) {
        if (maxLabel === '기저귀/위생용품') insightText = "기저귀는 핫딜 뜰 때 대량으로 쟁여두는 게 최고입니다!";
        else if (maxLabel === '분유/식비') insightText = "아이의 성장 속도를 고려하면 정상입니다! 잘 먹는 게 최고예요 💪";
        else insightText = "'당근마켓'을 적절히 활용하면 방어율이 엄청나게 올라갑니다 🥕";
    }

    let statusHtml = `👍 <strong>안정:</strong> 이상적인 소비 비율입니다.`;
    if (budgetPercent > 100) statusHtml = `<span style="color:var(--danger)">🚨 <strong>주의:</strong> 지출이 예산을 넘어섰습니다. 항목별 조율이 필요해요!</span>`;
    else if (budgetPercent < 80) statusHtml = `<span style="color:var(--success)">🌿 <strong>우수:</strong> 예산 안에서 알뜰하게 분배되고 있습니다.</span>`;

    const moneyInsightEl = document.getElementById('money-insight-detail');
    if(moneyInsightEl) {
        moneyInsightEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-m); margin-bottom: 4px;">
                        🏆 ${maxLabel} 지출 비중이 가장 높아요
                    </div>
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-s); line-height: 1.4;">
                        ${insightText}
                    </div>
                </div>
                <div style="height: 1px; background: var(--border); width: 100%;"></div>
                <div>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-m); margin-bottom: 4px;">
                        💡 예산 진단 결과
                    </div>
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-s); line-height: 1.4;">
                        ${statusHtml}
                    </div>
                </div>
            </div>
        `;
    }

    if(resBox) resBox.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';

    if (typeof drawDonutChart === 'function') {
        setTimeout(() => drawDonutChart(d, f, e), 100);
    }
}

window.toggleHistory = function() {
    const area = document.getElementById('history-list-area');
    if(!area) return;
    
    if(area.style.display === 'block') { 
        area.style.display = 'none'; 
    } else {
        const history = JSON.parse(localStorage.getItem('TosilBabyApp')) || {};
        const items = document.getElementById('history-items'); 
        if(!items) return; 
        
        items.innerHTML = "";
        const date = new Date();
        const currentMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const sortedKeys = Object.keys(history).filter(k => k !== currentMonthKey).sort().reverse();
        
        if(sortedKeys.length === 0) { 
            items.innerHTML = `
                <div style="text-align:center; padding:30px 10px;">
                    <div style="font-size:32px; margin-bottom:10px;">💨</div>
                    <div style="font-size:14.5px; font-weight:800; color:var(--text-m); margin-bottom:6px;">기록이 텅~ 비어있네요!</div>
                    <div style="font-size:12.5px; color:var(--text-s);">아직 지난달에 기록하신 가계부 내역이 없어요.</div>
                </div>`; 
        } else { 
            let html = '<div style="margin-top: 12px;">';
            sortedKeys.forEach(k => { 
                const [year, month] = k.split('-');
                html += `
                <div class="history-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:#F8F9FA; border-radius:12px; margin-bottom:8px; border:1px solid #E5E8EB;">
                    <span style="font-weight:900; color:#4E5968; font-size:14px;">📅 ${year}년 ${month}월</span>
                    <span style="font-weight:900; color:#3182F6; font-size:16px;">${history[k].toLocaleString()}원</span>
                </div>`; 
            }); 
            html += '</div>';
            items.innerHTML = html;
        }
        area.style.display = 'block';
    }
};

// 🌟 금액 입력 시 버튼 스르륵 나타나는 애니메이션 엔진
window.toggleCategoryButtons = function(el) {
    const val = Number(el.value.replace(/[^0-9]/g, ''));
    const area = document.getElementById('expense-category-area');
    if(val > 0) {
        area.style.opacity = '1';
        area.style.transform = 'translateY(0)';
        area.style.pointerEvents = 'auto';
        el.style.borderBottomColor = '#3182F6';
    } else {
        area.style.opacity = '0.3';
        area.style.transform = 'translateY(10px)';
        area.style.pointerEvents = 'none';
        el.style.borderBottomColor = '#E5E8EB';
    }
};

// 🌟 가계부 원터치 빠른 입력 (통합형 적용 완료!)
window.addDailyExpense = async function(type) {
    const input = document.getElementById('v-input-amount');
    const amount = parseInt(input.value.replace(/,/g, '')) || 0;
    
    if(amount <= 0) {
        if(typeof showToast === 'function') return showToast("⚠️ 금액을 정확히 입력해주세요!");
        else return alert("⚠️ 금액을 정확히 입력해주세요!");
    }

    let ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { total: 0, savedTotal: 0, goal: "", goalAmount: 100000, history: [], categories: { diaper: 0, food: 0, etc: 0 } };
    
    if(!ledger.categories) ledger.categories = { diaper: 0, food: 0, etc: 0 };
    if(!ledger.history) ledger.history = [];

    const now = new Date();
    const timeStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let typeName = "";

    if(type === 'saving') {
        ledger.savedTotal += amount;
        ledger.history.unshift({ time: timeStr, amount: amount, type: 'saving', catName: '저축' });
        if(typeof showToast === 'function') showToast(`🎉 목표 달성을 위해 ${amount.toLocaleString()}원 저금 완료!`);
    } else {
        ledger.total += amount;
        if(type === 'diaper') { ledger.categories.diaper += amount; typeName = "🧻 위생"; }
        else if(type === 'food') { ledger.categories.food += amount; typeName = "🍼 식비"; }
        else if(type === 'etc') { ledger.categories.etc += amount; typeName = "🧸 기타"; }
        
        ledger.history.unshift({ time: timeStr, amount: amount, type: 'expense', catName: typeName });
        if(typeof showToast === 'function') showToast(`✅ ${typeName} ${amount.toLocaleString()}원 기록 완료!`);
    }
    
    if(ledger.history.length > 30) ledger.history.pop(); 
    
    if (typeof saveLedgerToFirebase === 'function') await saveLedgerToFirebase(ledger);
    
    localStorage.setItem('tosil_money_total', ledger.total); 
    const curY = now.getFullYear(), curM = now.getMonth() + 1, monthKey = `${curY}-${curM}`;
    const localHistory = JSON.parse(localStorage.getItem('TosilBabyApp')) || {};
    localHistory[monthKey] = ledger.total;
    localStorage.setItem('TosilBabyApp', JSON.stringify(localHistory));

    // UI 리셋 및 업데이트 (버튼 다시 숨기기)
    input.value = '';
    window.toggleCategoryButtons(input);
    window.resizeInput(input);

    window.updateLedgerUI(); 
    window.analyzeMoney(); // 👈 입력과 동시에 차트를 알아서 다시 그림!
    if(typeof updateHomeDashboard === 'function') updateHomeDashboard();
}

window.saveGoal = function() {
    let ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { total: 0, savedTotal: 0, goal: "", goalAmount: 100000, history: [] };
    const textEl = document.getElementById('v-goal-text');
    const amtEl = document.getElementById('v-goal-amount');
    
    if(textEl) ledger.goal = textEl.value;
    if(amtEl) {
        const amountVal = amtEl.value.replace(/,/g, '');
        ledger.goalAmount = parseInt(amountVal) || 100000;
    }
    if (typeof saveLedgerToFirebase === 'function') saveLedgerToFirebase(ledger);
};

// 🌟 머니로그(히스토리) UI 업데이트 (앱 처음 켤 때도 글자 잘림 방지 적용)
window.updateLedgerUI = function() {
    const ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { total: 0, savedTotal: 0, goal: "", goalAmount: 100000, history: [] };
    
    const moneyTotalEl = document.getElementById('money-total-display');
    if(moneyTotalEl) window.animateNumber('money-total-display', 0, ledger.total, 800);

    const goalInput = document.getElementById('v-goal-text');
    if(goalInput && document.activeElement !== goalInput && ledger.goal) goalInput.value = ledger.goal;

    const amountInput = document.getElementById('v-goal-amount');
    if(amountInput && document.activeElement !== amountInput && ledger.goalAmount) {
        amountInput.value = Number(ledger.goalAmount).toLocaleString();
        window.resizeInput(amountInput); // 👈 앱 로딩 시 목표액 칸도 넉넉하게 자동 조절!
    }

    const budgetInput = document.getElementById('v-budget');
    const savedBudget = localStorage.getItem('tosil_budget');
    if (budgetInput && document.activeElement !== budgetInput && savedBudget) {
        budgetInput.value = Number(savedBudget).toLocaleString();
        window.resizeInput(budgetInput); // 👈 앱 로딩 시 예산 칸도 넉넉하게 자동 조절!
    }

    const targetAmount = parseInt(ledger.goalAmount) || 100000;
    let percent = 0;
    if (targetAmount > 0) percent = Math.min(Math.round((ledger.savedTotal / targetAmount) * 100), 100);
    
    const percentEl = document.getElementById('v-goal-percent');
    if(percentEl) percentEl.innerText = percent + "%";

    const listContainer = document.getElementById('ledger-history-list');
    if(listContainer) {
        let html = '';
        if (!ledger.history || ledger.history.length === 0) {
            html = `<div style="text-align:center; padding:20px; font-size:13px; color:#8B95A1;">아직 입력된 머니로그 기록이 없습니다.</div>`;
        } else {
            ledger.history.forEach(h => {
                const isSave = h.type === 'saving';
                
                let bgColor = "#F2F4F6", textColor = "#4E5968";
                if(isSave) { bgColor = "#F3E8FF"; textColor = "#7C3AED"; }
                else if(h.catName && h.catName.includes('위생')) { bgColor = "#EBF8FF"; textColor = "#0284C7"; }
                else if(h.catName && h.catName.includes('식비')) { bgColor = "#ECFDF5"; textColor = "#059669"; }
                else if(h.catName && h.catName.includes('기타')) { bgColor = "#FFF4ED"; textColor = "#E65100"; }

                const badge = `<span style="background:${bgColor}; color:${textColor}; padding:6px 12px; border-radius:10px; font-size:13px; font-weight:900;">${h.catName || (isSave ? '💰 저축' : '💸 지출')}</span>`;
                const amountColor = isSave ? '#3182F6' : 'var(--text-m)';

                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:#FFF; border-radius:16px; font-size:13.5px; border:1px solid #E5E8EB; margin-bottom:8px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                            <div style="display:flex; align-items:center; gap:10px;">${badge} <span style="color:var(--text-s); font-size:12px; font-weight:700;">${h.time}</span></div>
                            <span style="font-weight:900; color:${amountColor}; font-size:16px;">${Number(h.amount).toLocaleString()}원</span>
                         </div>`;
            });
        }
        listContainer.innerHTML = html;
    }
};

window.resetMoneyAll = async function() {
    if(!confirm("이번 달 기록된 모든 지출 내역 및 카테고리를 초기화하시겠습니까?\n(설정하신 예산과 목표는 유지됩니다)")) return;
    
    let ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || {};
    ledger.total = 0;
    ledger.savedTotal = 0;
    ledger.history = [];
    ledger.categories = { diaper: 0, food: 0, etc: 0 }; // 🌟 카테고리도 싹 비우기
    
    if (typeof saveLedgerToFirebase === 'function') await saveLedgerToFirebase(ledger);
    localStorage.removeItem('tosil_money_total');
    
    const date = new Date();
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    let localHistory = JSON.parse(localStorage.getItem('TosilBabyApp')) || {};
    if (localHistory[monthKey]) {
        delete localHistory[monthKey]; 
        localStorage.setItem('TosilBabyApp', JSON.stringify(localHistory));
    }

    if(confirm("입력된 '과거 월별 통계(지난달 등)' 기록까지 전부 다 삭제할까요?")) {
        localStorage.removeItem('TosilBabyApp');
    }
    
    const resBox = document.getElementById('money-result'); 
    if(resBox) resBox.style.display = 'none'; 
    const emptyState = document.getElementById('money-empty-state');
    if(emptyState) emptyState.style.display = 'block';

    const area = document.getElementById('history-list-area');
    if(area) area.style.display = 'none';
    
    window.updateLedgerUI();
    window.analyzeMoney(); // 👈 0원으로 초기화된 차트 강제 적용
    
    if(typeof showToast === 'function') showToast("데이터가 깔끔하게 리셋되었습니다! 🌿");
    else alert("데이터가 깔끔하게 리셋되었습니다! 다시 든든하게 모아봐요! 🌿");
    
    if(typeof updateHomeDashboard === 'function') updateHomeDashboard();
};

// 처음 툴박스 화면 켰을 때 차트 불러오기
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if(typeof window.analyzeMoney === 'function') window.analyzeMoney();
    }, 500);
});

// ==========================================
// 🛍️ 스마트 핫딜 판독기 (역대 최저가 자유 수정 및 완벽 분리 엔진)
// ==========================================

const ITEM_UNITS = { diaper: '장', wipe: '팩', milk: '통' };

// 카테고리 변경 시 내가 저장한 '최저가' 불러오기
function loadPastPrice(isFromCalc = false) {
    const catSelect = document.getElementById('hd-category');
    if (!catSelect) return;
    const cat = catSelect.value;
    
    let pastPrice = localStorage.getItem('tosil_hd_best_' + cat);
    if (pastPrice && Number(pastPrice) < 50) { 
        localStorage.removeItem('tosil_hd_best_' + cat);
        pastPrice = null;
    }

    const inputEl = document.getElementById('hd-standard-price');
    const badgeEl = document.getElementById('hd-past-badge');
    
    // ✨ 단위(장, 팩, 통) 변경
    const unitLabelEl = document.getElementById('hd-unit-label');
    if (unitLabelEl && ITEM_UNITS[cat]) {
        unitLabelEl.innerText = ITEM_UNITS[cat];
    }

    // 🎯 카테고리별 현실적인 배경 숫자(Placeholder) 자동 변경
    const priceInput = document.getElementById('hd-total-price'); 
    const qtyInput = document.getElementById('hd-count'); 
    const hdRes = document.getElementById('hd-result');

    if (priceInput && qtyInput) {
        if (!isFromCalc) {
            priceInput.value = '';
            qtyInput.value = '';
            if (hdRes) hdRes.style.display = 'none';
        }

        if (cat === 'diaper') {
            priceInput.placeholder = "45,000";
            qtyInput.placeholder = "180";
        } else if (cat === 'wipe') {
            priceInput.placeholder = "15,000";
            qtyInput.placeholder = "10";
        } else if (cat === 'milk') {
            priceInput.placeholder = "50,000";
            qtyInput.placeholder = "1";
        }
    }

    // 💡 [핵심 패치 1] 역대 최저가 입력창이 절대 잠겨있지 않도록 강제 해제!
    if (inputEl) {
        inputEl.removeAttribute('readonly');
        inputEl.removeAttribute('disabled');

        if (pastPrice) {
            inputEl.value = pastPrice;
            if(badgeEl) badgeEl.style.display = 'inline-block';
        } else {
            inputEl.value = ''; 
            if(badgeEl) badgeEl.style.display = 'none';
        }
    }
}
window.loadPastPrice = loadPastPrice;

// 🚀 앱 켤 때 및 탭 바꿀 때 자동 연동 & 💡 [핵심 패치 2] 최저가 칸을 직접 수정하면 즉시 내셔널 저장!
document.addEventListener("DOMContentLoaded", () => {
    const catSelect = document.getElementById('hd-category');
    if (catSelect) {
        catSelect.addEventListener('change', () => {
            loadPastPrice(false);
        });
    }

    const standardInput = document.getElementById('hd-standard-price');
    if (standardInput) {
        // 유저가 최저가 숫자를 직접 타이핑해서 바꾸는 순간 로컬스토리지에 곧바로 갱신 저장됨!
        standardInput.addEventListener('input', () => {
            const currentCat = document.getElementById('hd-category').value;
            const newVal = Number(standardInput.value.replace(/,/g, ''));
            if (newVal > 0) {
                localStorage.setItem('tosil_hd_best_' + currentCat, newVal);
            } else {
                localStorage.removeItem('tosil_hd_best_' + currentCat);
            }
        });
    }

    if(typeof loadPastPrice === 'function') loadPastPrice(false);
});

function calcHotDeal() {
    const cat = document.getElementById('hd-category').value;
    const priceInput = document.getElementById('hd-total-price');
    const countInput = document.getElementById('hd-count');
    const standardInput = document.getElementById('hd-standard-price');
    
    const price = Number(priceInput.value.replace(/,/g,''));
    const count = Number(countInput.value);
    let pastPrice = Number(standardInput.value.replace(/,/g,'')); 
    
    if(!price || !count) return alert("최종 결제액과 총 수량을 정확히 입력해주세요!");
    
    const unitPrice = Math.round(price / count);
    document.getElementById('hd-unit-price').innerText = unitPrice.toLocaleString() + "원";
    
    const verdictEl = document.getElementById('hd-verdict');
    const commentEl = document.getElementById('hd-comment');
    const unitName = ITEM_UNITS[cat];

    // 과거 최저가 기록이 없거나 비정상적일 때
    if (!pastPrice || pastPrice <= 0) {
        verdictEl.innerHTML = `✅ 첫 핫딜 기준가 등록 완료!`;
        verdictEl.style.backgroundColor = "#3182F6"; 
        commentEl.innerHTML = `이 품목의 첫 체감가는 1${unitName}당 <strong>${unitPrice.toLocaleString()}원</strong>입니다. 이 가격을 내 '역대 최저가'로 안전하게 기억해 둘게요! 📝`;
        
        localStorage.setItem('tosil_hd_best_' + cat, unitPrice);
        standardInput.value = unitPrice;
    } else {
        const diffPast = pastPrice - unitPrice;
        
        if (diffPast > 0) {
            verdictEl.innerHTML = `🎉 역대 최저가 갱신! 1${unitName}당 <span style="color:#FFF; font-weight:900;">${diffPast.toLocaleString()}원 더 싸요!</span>`;
            verdictEl.style.backgroundColor = "#00B37A"; 
            commentEl.innerHTML = `기존 내 기록(${pastPrice.toLocaleString()}원) 대비 총 <strong>${(diffPast * count).toLocaleString()}원을 아꼈습니다!</strong> 역대급 핫딜 방어 성공! 👏`;
            // 더 싸게 샀으므로 최저가 자동 갱신
            localStorage.setItem('tosil_hd_best_' + cat, unitPrice);
            standardInput.value = unitPrice;
        } else if (diffPast < 0) {
            verdictEl.innerHTML = `⚠️ 내 최저가보다 1${unitName}당 <span style="color:#FFF; font-weight:900;">${Math.abs(diffPast).toLocaleString()}원 비싸요.</span>`;
            verdictEl.style.backgroundColor = "#F04452"; 
            commentEl.innerHTML = `이전에 설정한 최저가(${pastPrice.toLocaleString()}원)보다 <strong>총 ${(Math.abs(diffPast) * count).toLocaleString()}원 손해</strong>입니다. 수량이 급한 게 아니라면 조금 더 기다려보세요! 🤔`;
        } else {
            verdictEl.innerHTML = `⚖️ 역대 최저가 방어 성공!`;
            verdictEl.style.backgroundColor = "#3182F6"; 
            commentEl.innerHTML = `이전에 설정한 가장 저렴한 가격(${pastPrice.toLocaleString()}원)과 정확히 일치하네요! 이번에도 스마트하게 잘 사셨습니다. 👍`;
        }
    }
    
    verdictEl.style.color = "#FFF";
    const hdRes = document.getElementById('hd-result'); if(hdRes) hdRes.style.display = 'block';
    
    // 🎯 쿠팡 스마트 링크 매칭 시스템
    let coupangLink = ''; 
    let btnText = '';

    if (cat === 'diaper') {
        coupangLink = 'https://link.coupang.com/a/fPSpeiTAD6'; 
        btnText = '로켓배송 기저귀 최저가 비교하기';
    } else if (cat === 'wipe') {
        coupangLink = 'https://link.coupang.com/a/fPSk40HKOi';
        btnText = '로켓배송 물티슈 최저가 비교하기';
    } else if (cat === 'milk') {
        coupangLink = 'https://link.coupang.com/a/fPSqFEMPcq';
        btnText = '로켓배송 우리아기 분유 최저가 보기';
    }

    document.getElementById('hd-action-area').innerHTML = `
        <button class="btn-main" style="margin-top:20px; margin-bottom:8px; background:#F8FAFC !important; color:#191F28 !important; border:1px solid #E2E8F0 !important; box-shadow:0 2px 4px rgba(0,0,0,0.02) !important; padding:16px; font-size:14.5px; font-weight:800; border-radius:14px; width:100%; display:flex; justify-content:center; align-items:center; gap:6px; cursor:pointer;" onclick="window.open('${coupangLink}', '_blank')">
            ${btnText}
        </button>
        <button class="btn-main" style="margin-top:0; background:#191F28 !important; color:#FFF !important; border:none !important; box-shadow:none !important; padding:16px; font-size:14.5px; font-weight:800; border-radius:14px; width:100%; cursor:pointer;" onclick="sendHotdealToLedger(${price}, '${cat}')">
            ${price.toLocaleString()}원 가계부로 연동하기
        </button>
    `;
    
    const badgeEl = document.getElementById('hd-past-badge');
    if(badgeEl) badgeEl.style.display = 'inline-block';
}

async function sendHotdealToLedger(price, cat) {
    let targetId = 'v-etc';
    if(cat === 'diaper' || cat === 'wipe') targetId = 'v-diaper';
    if(cat === 'milk') targetId = 'v-food';

    const inputEl = document.getElementById(targetId);
    if(inputEl) {
        const currentVal = Number(inputEl.value.replace(/,/g, '')) || 0;
        inputEl.value = (currentVal + price).toLocaleString();
    }
    
    let ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { total: 0, savedTotal: 0, goal: "", goalAmount: 100000, history: [] };
    ledger.total += price;
    const now = new Date();
    const timeStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if(!ledger.history) ledger.history = [];
    ledger.history.unshift({ time: timeStr, amount: price, type: 'expense' });
    
    await saveLedgerToFirebase(ledger);
    showToast(`✅ 핫딜 결제액 ${price.toLocaleString()}원 연동 완료!`);
    directGoToolbox('money');
}

// ==========================================
// 5. 스마트 해열제 타이머 엔진 (실시간 연동형 + 하이엔드 디테일)
// ==========================================
function checkPillLock(type) {
    let currentFeverRecords = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];

    if (currentFeverRecords.length === 0) {
        return { locked: false, reason: "" };
    }

    const lastRecord = currentFeverRecords[0]; 
    const lastTime = lastRecord.timestamp; 
    const now = new Date().getTime();
    let diffMinutes = Math.floor((now - lastTime) / (1000 * 60));

    if (diffMinutes < 0) diffMinutes = 0;

    let requiredWaitMins = 0;
    if (lastRecord.type === type) {
        requiredWaitMins = 240; // 🔴 같은 약 4시간
    } else {
        requiredWaitMins = 120; // 🔵 다른 약 2시간
    }

    if (diffMinutes < requiredWaitMins) {
        // ✨ [니치 패치 1] '몇 분 남음'이 아니라 '몇 시 몇 분부터' 먹일 수 있는지 정확히 계산!
        const unlockTime = new Date(lastTime + (requiredWaitMins * 60000));
        const unlockHH = String(unlockTime.getHours()).padStart(2, '0');
        const unlockMM = String(unlockTime.getMinutes()).padStart(2, '0');
        
        return { locked: true, reason: `투약 잠금\n(${unlockHH}:${unlockMM} 부터)` };
    }

    return { locked: false, reason: "" };
}

function selectPill(type) {
    const redBtn = document.getElementById('btn-pill-red');
    const blueBtn = document.getElementById('btn-pill-blue');
    
    // 🔄 먼저 기존 색상 싹 지우기 (버튼 초기화)
    if(redBtn) {
        redBtn.classList.remove('active');
        redBtn.style.setProperty('background', '', 'important');
        redBtn.style.setProperty('color', '', 'important');
        redBtn.style.setProperty('border', '', 'important');
    }
    if(blueBtn) {
        blueBtn.classList.remove('active');
        blueBtn.style.setProperty('background', '', 'important');
        blueBtn.style.setProperty('color', '', 'important');
        blueBtn.style.setProperty('border', '', 'important');
    }
    
    if (!type) { selectedPillType = ''; return; }
    
    const lockStatus = checkPillLock(type);
    if (lockStatus.locked) { 
        showToast('🚨 ' + lockStatus.reason.replace(/\n/g, '<br>')); 
        return; 
    }
    
    selectedPillType = type;
    
    // 🎨 CSS 에러 상관없이 JS로 무조건 활성화 색깔 입히기!
    if (type === 'red' && redBtn) {
        redBtn.classList.add('active');
        redBtn.style.setProperty('background', 'rgba(239, 68, 68, 0.15)', 'important');
        redBtn.style.setProperty('color', '#EF4444', 'important');
        redBtn.style.setProperty('border', '1px solid #EF4444', 'important');
    } else if (type === 'blue' && blueBtn) {
        blueBtn.classList.add('active');
        blueBtn.style.setProperty('background', 'rgba(49, 130, 246, 0.15)', 'important');
        blueBtn.style.setProperty('color', '#3182F6', 'important');
        blueBtn.style.setProperty('border', '1px solid #3182F6', 'important');
    }
}

function toggleCheck(e) { if(e.target.tagName !== 'INPUT') { const cb = document.getElementById('agree-check'); if(cb) cb.checked = !cb.checked; } }

function calcFever() {
    const agreeCb = document.getElementById('agree-check');
    if(agreeCb && !agreeCb.checked) return alert("⚠️ 위험 고지 및 면책조항 동의 확인이 필요합니다.");
    const w = Number(document.getElementById('v-weight').value);
    if(!w) return alert("체중 값을 계측하여 정확히 입력하십시오.");
    
    // ✨ 핵심 패치: 여기서 계측한 체중을 최신 체중으로 강제 저장! (소아과 리포트 연동)
    localStorage.setItem('tosil_latest_weight', w);
    
    document.getElementById('dose-red').innerText = `${(w*0.3).toFixed(1)} ~ ${(w*0.38).toFixed(1)}`;
    document.getElementById('dose-blue').innerText = `${(w*0.4).toFixed(1)} ~ ${(w*0.5).toFixed(1)}`;
    const fRes = document.getElementById('fever-result'); if(fRes) fRes.style.display = 'block';
}

async function addFeverRecord() {
    // 🚨 1. 하단 투약 기록 시에도 무조건 동의 박스 체크 확인!
    const agreeCb = document.getElementById('agree-check');
    if(agreeCb && !agreeCb.checked) {
        return showToast("⚠️ 투약 기록을 저장하려면 상단의 위험 고지 및 면책조항에 동의해주세요!");
    }

    const temp = parseFloat(document.getElementById('v-temp').value);
    if(!temp || !selectedPillType) return showToast('⚠️ 체온과 약 종류를 명확히 지정해주세요!');
    const lockStatus = checkPillLock(selectedPillType);
    if (lockStatus.locked) return showToast('🚨 [저장 실패] ' + lockStatus.reason.replace(/\n/g, ' '));
    
    const symptoms = [
        document.getElementById('sym-cough').checked ? '🤧기침' : '', 
        document.getElementById('sym-vomit').checked ? '🤮구토' : '',
        document.getElementById('sym-diarrhea').checked ? '💩설사' : '', 
        document.getElementById('sym-nofood').checked ? '😰밥거부' : ''
    ].filter(Boolean);
    
    const now = new Date(), timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const record = { time: timeStr, temp: temp, type: selectedPillType, timestamp: now.getTime(), symptoms: symptoms };
    
    let records = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    records.unshift(record); if(records.length > 10) records.pop(); 
    
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        const docRef = doc(db, "fever_" + syncCode, "status");
        try { await setDoc(docRef, { records: records }, { merge: true }); } catch (e) {}
    }
    
    localStorage.setItem('tosil_fever_records', JSON.stringify(records));
    
    // ✨ 입력 후 원래대로 리셋!
    const tempInput = document.getElementById('v-temp');
    if (tempInput) {
        tempInput.value = '';
        tempInput.style.color = '';
        tempInput.style.borderBottom = '';
    }
    
    // 증상 체크박스 완벽 초기화
    ['sym-cough','sym-vomit','sym-diarrhea','sym-nofood'].forEach(id => { 
        const cb = document.getElementById(id); 
        if(cb) {
            cb.checked = false;
            if(cb.nextElementSibling) {
                cb.nextElementSibling.style.background = '';
                cb.nextElementSibling.style.border = '';
                cb.nextElementSibling.style.color = '';
            }
        } 
    });
    
    selectPill(''); 
    renderFeverTimeline(); 
    setTimeout(updateHomeDashboard, 100); 
    
    showToast("💊 투약 기록이 안전하게 저장되었습니다!");
}

function renderFeverTimeline() {
    const container = document.getElementById('fever-timeline'); if(!container) return; 
    let records = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    
    if(records.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px 20px; background:var(--bg-sub, #F8F9FA); border-radius:16px; border:1px dashed #E5E8EB;">아기가 아프지 않아서 기록이 비어있네요💚</div>`;
        ['fever-timer-box','fever-chart-container','fever-alert'].forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });
        if(feverTimerInterval) clearInterval(feverTimerInterval);
        
        // ✨ 여기서 빈 배열을 넘겨줘서 화면의 타이머 잠금 텍스트를 즉시 없앱니다!
        updateFeverTimer([]); 
        return;
    }
    
    let html = '';
    records.forEach(r => {
        const pillLabel = r.type === 'red' ? '🔴 아세트 (빨강)' : '🔵 이부 (파랑)'; 
        const tempStyle = r.temp >= 38.5 ? 'color:#FF4B2B; font-weight:900;' : 'font-weight:800;';
        let symHtml = r.symptoms && r.symptoms.length > 0 ? `<div style="margin-top:8px; font-size:11.5px; color:var(--text-m); background:var(--bg-sub); padding:6px 10px; border-radius:8px; display:inline-block; border:1px solid var(--border);">🚨 동반증상: ${r.symptoms.join(', ')}</div>` : '';
        html += `<div class="timeline-item" style="padding:16px 12px; border-bottom:1px solid var(--border);"><div style="display:flex; justify-content:space-between; align-items:center; font-size:14px;"><span style="font-weight:800; opacity:0.7; width:45px;">${r.time}</span><span style="flex:1; text-align:center; font-weight:800;">${pillLabel}</span><span style="${tempStyle}">${r.temp}℃</span></div>${symHtml}</div>`;
    });
    container.innerHTML = html;
    
    const fChart = document.getElementById('fever-chart-container'); if(fChart) fChart.style.display = 'block';
    const fTimer = document.getElementById('fever-timer-box'); if(fTimer) fTimer.style.display = 'block'; 
    
    if (typeof drawFeverChart === 'function') drawFeverChart(records);
    if(feverTimerInterval) clearInterval(feverTimerInterval); 
    updateFeverTimer(records); 
    feverTimerInterval = setInterval(() => updateFeverTimer(records), 1000);
}

// ==========================================
// ✨ [UX 패치] 스마트 해열제 타이머 (교차 복용 넛지 & 흑백 잠금)
// ==========================================
function updateFeverTimer(records) {
    const redBtn = document.getElementById('btn-pill-red'), blueBtn = document.getElementById('btn-pill-blue');
    const timerRedEl = document.getElementById('timer-red'), timerBlueEl = document.getElementById('timer-blue');
    
    // 1. 기록 없을 때 완벽 초기화
    if (!records || records.length === 0) {
        if (timerRedEl) { timerRedEl.innerHTML = "✅ 즉시 복용 가능"; timerRedEl.style.color = "#2ECC71"; }
        if (timerBlueEl) { timerBlueEl.innerHTML = "✅ 즉시 복용 가능"; timerBlueEl.style.color = "#2ECC71"; }
        if (redBtn) { redBtn.style.cursor = 'pointer'; redBtn.style.opacity = '1'; redBtn.style.filter = 'none'; }
        if (blueBtn) { blueBtn.style.cursor = 'pointer'; blueBtn.style.opacity = '1'; blueBtn.style.filter = 'none'; }
        return;
    }

    const redLock = checkPillLock('red'), blueLock = checkPillLock('blue');

    // 🔴 2. 빨간약(아세트) 상태 매직
    if (redLock.locked) {
        if (timerRedEl) { timerRedEl.innerHTML = `🔒 ${redLock.reason.split('\n')[1]}`; timerRedEl.style.color = "var(--danger)"; }
        // 잠기면 흑백으로 죽여버리기!
        if (redBtn) { redBtn.style.cursor = 'not-allowed'; redBtn.style.opacity = '0.3'; redBtn.style.filter = 'grayscale(100%)'; }
    } else {
        if (timerRedEl) {
            // 파란약은 잠겼는데 빨간약이 풀렸다면 -> 교차 복용 골든 타임! 💡
            if (blueLock.locked) {
                timerRedEl.innerHTML = `<span style="background:#FFF0F1; color:#F04452; padding:4px 8px; border-radius:8px; font-size:11.5px; font-weight:900; box-shadow:0 2px 6px rgba(240,68,82,0.2); display:inline-block; animation:pulseSOS 1.5s infinite;">💡 교차 복용 가능</span>`;
            } else {
                timerRedEl.innerHTML = "✅ 즉시 복용 가능";
                timerRedEl.style.color = "#2ECC71";
            }
        }
        if (redBtn) { redBtn.style.cursor = 'pointer'; redBtn.style.opacity = '1'; redBtn.style.filter = 'none'; }
    }

    // 🔵 3. 파란약(이부) 상태 매직
    if (blueLock.locked) {
        if (timerBlueEl) { timerBlueEl.innerHTML = `🔒 ${blueLock.reason.split('\n')[1]}`; timerBlueEl.style.color = "var(--danger)"; }
        // 잠기면 흑백으로 죽여버리기!
        if (blueBtn) { blueBtn.style.cursor = 'not-allowed'; blueBtn.style.opacity = '0.3'; blueBtn.style.filter = 'grayscale(100%)'; }
    } else {
        if (timerBlueEl) {
            // 빨간약은 잠겼는데 파란약이 풀렸다면 -> 교차 복용 골든 타임! 💡
            if (redLock.locked) {
                timerBlueEl.innerHTML = `<span style="background:#EBF4FF; color:#3182F6; padding:4px 8px; border-radius:8px; font-size:11.5px; font-weight:900; box-shadow:0 2px 6px rgba(49,130,246,0.2); display:inline-block; animation:pulseSOS 1.5s infinite;">💡 교차 복용 가능</span>`;
            } else {
                timerBlueEl.innerHTML = "✅ 즉시 복용 가능";
                timerBlueEl.style.color = "#2ECC71";
            }
        }
        if (blueBtn) { blueBtn.style.cursor = 'pointer'; blueBtn.style.opacity = '1'; blueBtn.style.filter = 'none'; }
    }
}

// ✨ [니치 패치 2] 체온 입력 시 실시간 색상 변화 엔진
window.handleTempInputColor = function(inputEl) {
    const val = parseFloat(inputEl.value);
    if (!val || isNaN(val)) {
        inputEl.style.color = '';
        inputEl.style.borderBottom = '';
        return;
    }

    if (val >= 38.0) {
        inputEl.style.color = '#EF4444'; // 빨강 (고열)
        inputEl.style.borderBottom = '2px solid #EF4444';
    } else if (val >= 37.5) {
        inputEl.style.color = '#F59E0B'; // 주황 (미열)
        inputEl.style.borderBottom = '2px solid #F59E0B';
    } else {
        inputEl.style.color = '#10B981'; // 초록 (정상)
        inputEl.style.borderBottom = '2px solid #10B981';
    }
};

// 화면 켜질 때 이벤트 리스너 붙여주기
document.addEventListener('DOMContentLoaded', () => {
    const tempInput = document.getElementById('v-temp');
    if (tempInput) {
        tempInput.addEventListener('input', function() { window.handleTempInputColor(this); });
    }
});

// 해열제 기록 전체 지우기 - ✨ 퀄리티업 완료 ✨
async function clearFeverRecord() {
    showConfirm("전체 투약 기록을 지우시겠습니까?", async function() {
        
        localStorage.removeItem('tosil_fever_records'); 
        
        if (typeof db !== 'undefined' && typeof setDoc === 'function') {
            const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
            try { await setDoc(doc(db, "fever_" + syncCode, "status"), { records: [] }); } catch (e) {}
        }
        
        // ✨ 핵심: 체온 숫자, 체크박스 버튼, 약 종류 전부 완벽하게 빈칸으로 강제 초기화!
        document.getElementById('v-temp').value = '';
        ['sym-cough','sym-vomit','sym-diarrhea','sym-nofood'].forEach(id => { 
            const cb = document.getElementById(id); 
            if(cb) {
                cb.checked = false; 
                // 동반 증상 버튼 파란색 칠해진 것도 원래 회색으로 원상복구
                if(cb.nextElementSibling) {
                    cb.nextElementSibling.style.background = '';
                    cb.nextElementSibling.style.border = '';
                    cb.nextElementSibling.style.color = '';
                }
            }
        });

        selectPill(''); // 약 버튼 선택 풀기
        renderFeverTimeline(); // 타임라인 다시 그리기
        updateFeverTimer([]); // 쐐기 박기 (타이머 글자 완벽 해제)
        
        setTimeout(updateHomeDashboard, 100); 
        
        showToast("💊 해열제 투약 기록이 초기화되었습니다! 즉시 새 기록이 가능합니다.");
        
    }, "🧹", "초기화", "#F04452");
}

window.addFeverRecord = addFeverRecord;
window.clearFeverRecord = clearFeverRecord;
window.selectPill = selectPill;
window.calcFever = calcFever;

function drawFeverChart(records) {
    const canvas = document.getElementById('feverChart'); if(!canvas || typeof Chart === 'undefined') return; 
    const ctx = canvas.getContext('2d'); if(feverChartObj) feverChartObj.destroy(); 
    const chartData = [...records].reverse(), labels = chartData.map(r => r.time), temps = chartData.map(r => r.temp);
    feverChartObj = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: '체온 변화 (℃)', data: temps, borderColor: '#FF4B2B', backgroundColor: 'rgba(255, 75, 43, 0.1)', borderWidth: 3, pointBackgroundColor: temps.map(t => t >= 38.5 ? '#FF4B2B' : '#3182F6'), pointRadius: 5, fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 36.5, max: 40.5 }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } });
}

function downloadFeverReport() {
    const target = document.getElementById('fever-timeline');
    if(!target || !target.innerHTML.trim() || target.innerText.includes("기록이 없습니다")) return alert("캡처할 기록이 없어요!");
    if(typeof html2canvas === 'undefined') return alert("이미지 변환 라이브러리가 준비되지 않았습니다.");
    html2canvas(target, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        const link = document.createElement('a'); link.download = '해열제_기록.png'; link.href = canvas.toDataURL("image/png"); link.click();
        alert("📸 캡처가 저장되었습니다!");
    });
}
window.downloadFeverReport = downloadFeverReport;

// ==========================================
// 🌡️ [해열제] 파이어베이스 실시간 수신 리스너
// ==========================================
let feverUnsubscribe = null;
function startFeverRealtimeSync() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "fever_" + syncCode, "status") : null;
    
    if(!docRef) return; 

    // 기존 감시 중단
    if (feverUnsubscribe) feverUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    // 서버 변화 실시간 감시
    feverUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tosil_fever_records', JSON.stringify(data.records || []));
        }
        // 서버에서 데이터가 오면 즉시 화면 갱신
        if (typeof renderFeverTimeline === 'function') renderFeverTimeline();
        if (typeof updateHomeDashboard === 'function') updateHomeDashboard();
    });
}
window.startFeverRealtimeSync = startFeverRealtimeSync;

// ==========================================
// 6. 외출 준비물 체크리스트 
// ==========================================
function openChecklistModal() {
    let months = 99, targetDate = localStorage.getItem('tosil_startDate'); 
    if (targetDate) {
        const dday = Math.ceil(Math.abs(new Date() - new Date(targetDate)) / (1000 * 60 * 60 * 24));
        months = Math.floor(dday / 30);
    }
    checklistData = [
        { id: 'c_diaper', label: '기저귀 (넉넉하게 4~5장)', checked: false }, { id: 'c_wipe', label: '물티슈 & 건티슈', checked: false },
        { id: 'c_cloth', label: '여벌옷 1벌 & 가제 손수건 3장', checked: false }, { id: 'c_plastic', label: '기저귀 버릴 냄새차단 비닐팩', checked: false }
    ];
    if (months <= 5) checklistData.push({ id: 'c_milk', label: '🍼 분유/모유 & 깨끗한 젖병', checked: false }, { id: 'c_thermos', label: '🌡️ 보온병 (분유물)', checked: false });
    else checklistData.push({ id: 'c_food', label: '(🥄 이유식 & 전용 숟가락', checked: false }, { id: 'c_cup', label: '🥤 빨대컵 (마실 물)', checked: false });

    let savedChecks = {}; try { savedChecks = JSON.parse(localStorage.getItem('tosil_checklist')) || {}; } catch(e){}
    checklistData.forEach(item => { if (savedChecks[item.id]) item.checked = true; });
    renderChecklist();
    document.getElementById('checklist-modal').style.display = 'flex';
}

function renderChecklist() {
    const container = document.getElementById('checklist-items'); if(!container) return; 
    let htmlString = "", checkedCount = 0; 
    checklistData.forEach((item, index) => {
        if(item.checked) checkedCount++;
        htmlString += `<div class="check-item ${item.checked?'checked':''}" onclick="toggleCheckItem(${index})" style="cursor:pointer; padding:12px; border-bottom:1px solid #EEE; display:flex; gap:10px;"><div class="check-box">${item.checked?'✔':'⬜'}</div><div class="check-text">${item.label}</div></div>`;
    });
    container.innerHTML = htmlString;
}

function toggleCheckItem(index) {
    checklistData[index].checked = !checklistData[index].checked;
    const saveObj = {}; checklistData.forEach(item => { saveObj[item.id] = item.checked; });
    localStorage.setItem('tosil_checklist', JSON.stringify(saveObj)); renderChecklist();
}
function resetChecklist() { localStorage.removeItem('tosil_checklist'); openChecklistModal(); }
function closeChecklistForce() { document.getElementById('checklist-modal').style.display = 'none'; }
function closeChecklist(e) { if (e.target.id === 'checklist-modal') closeChecklistForce(); }
window.openChecklistModal = openChecklistModal;
window.toggleCheckItem = toggleCheckItem;
window.resetChecklist = resetChecklist;
window.closeChecklistForce = closeChecklistForce;
window.closeChecklist = closeChecklist;

// ==========================================
// 🚨 7. 아기 발달 센서 엔진 (초압축 한줄 카피)
// ==========================================
function updateMainAISensors(months) {
    const txtStroller = document.getElementById('main-txt-stroller');
    const txtCarseat = document.getElementById('main-txt-carseat');
    const txtBottle = document.getElementById('main-txt-bottle');
    const txtFood = document.getElementById('main-txt-food');
    const txtToy = document.getElementById('main-txt-toy');
    if(!txtStroller) return;

    if (months <= 6) txtStroller.innerText = "👶 디럭스 (안전한 승차감)";
    else if (months <= 12) txtStroller.innerText = "🏃 절충형 (혼자 앉는 시기)";
    else txtStroller.innerText = "⚡ 휴대용 (가벼운 외출용)";

    if (months <= 12) txtCarseat.innerText = "🛡️ 신생아용 (뒤보기 필수)";
    else txtCarseat.innerText = "🧒 토들러용 (앞보기 전환)";

    if (months <= 3) txtBottle.innerText = "🍼 신생아 (배앓이 방지)";
    else if (months <= 5) txtBottle.innerText = "🍼 4~5개월 (젖꼭지 업)";
    else txtBottle.innerText = "🥛 6개월+ (빨대컵 연습)";

    if (months <= 6) txtFood.innerText = "🌾 초기 (쌀미음 스타트)";
    else if (months <= 9) txtFood.innerText = "🥕 중기 (입자 크기 업)";
    else txtFood.innerText = "🍽️ 완료기 (유아식 진화)";

   // 🧸 장난감 센서 (아기 발달 단계 세분화 완벽 적용!)
    if (months <= 4) txtToy.innerText = "💪 터미타임 (고개 가누기)";
    else if (months <= 6) txtToy.innerText = "🐛 배밀기 (전신 근육 발달)";
    else if (months <= 9) txtToy.innerText = "🐾 기어다니기 (활동 반경 확장)";
    else if (months <= 12) txtToy.innerText = "🏃 걸음마 (잡고 일어서기)";
    else txtToy.innerText = "🧩 소근육 놀이 (블록·조작북)";
}

function setDefaultMainAISensors() {
    if(document.getElementById('main-txt-stroller')) {
        document.getElementById('main-txt-stroller').innerText = "아기 맞춤형 유모차 매칭 센서 가동대기";
        document.getElementById('main-txt-carseat').innerText = "단계별 안전 규격 카시트 큐레이션 보기";
        document.getElementById('main-txt-bottle').innerText = "배앓이 방지 젖병 및 젖꼭지 스펙 확인";
        document.getElementById('main-txt-food').innerText = "월령별 안심 이유식 레시피 및 재료 매칭";
        document.getElementById('main-txt-toy').innerText = "부모의 자유시간 확보용 장난감";
    }
}

function getPercentile(z) {
    if (z < -3) return 1; if (z > 3) return 99;
    return Math.round((1 / (1 + Math.exp(-z * 1.702))) * 100);
}


// ==========================================
// 📈 [UX 패치] 영유아 종합 성장 마스터 (AI 로딩 딜레이 + 전교 등수 게이지 바 애니메이션)
// ==========================================
let growthChartObj = null;

window.calcHealthMaster = function() {
    const b = document.getElementById('v-birth').value;
    const gender = document.getElementById('v-gender').value;
    const hVal = document.getElementById('v-height').value;
    const wVal = document.getElementById('v-weight-growth').value;
    const h = hVal ? parseFloat(hVal) : null;
    const w = wVal ? parseFloat(wVal) : null;

    if (wVal) localStorage.setItem('tosil_latest_weight', wVal);

    if(!b) return alert("종합 분석을 위해 아기 생년월일을 입력해 주세요!");
    if(!h && !w) return alert("정확한 진단을 위해 키 또는 몸무게를 하나라도 입력해 주세요!");
    
    const birthDate = new Date(b);
    const today = new Date();
    const diffDays = Math.ceil((today - birthDate) / (1000*60*60*24));
    if (diffDays < 0) return alert("미래의 날짜는 입력할 수 없습니다.");
    
    const week = Math.floor(diffDays / 7);
    const month = Math.floor(diffDays / 30.436875); 
    
    document.getElementById('res-dday').innerText = diffDays;
    document.getElementById('res-month').innerText = month;
    document.getElementById('res-week').innerText = week;

   // 원더윅스 로직
    let curWW = wwList.find(x => week >= (x.w - 1) && week <= (x.w + 1));
    let nxtWW = wwList.find(x => x.w > week);
    
    let st = document.getElementById('ww-status');
    if(st) {
        if(curWW) { 
            st.className = 'ww-status-box box-tint-red'; 
            st.removeAttribute('style'); 
            st.style.padding = '20px'; st.style.borderRadius = '16px'; st.style.marginBottom = '12px'; 
            st.innerHTML = `<div style="font-size:14.5px; font-weight:900; color:var(--danger); margin-bottom:6px;">🚨 현재 ${curWW.t} 폭풍우 구간!</div><strong style="color:var(--text-m);">특성:</strong> <span style="color:var(--text-s);">${curWW.d}</span>.<br><span style="color:var(--text-s); margin-top:4px; display:inline-block;">이유 없는 보챔과 수면퇴행이 올 수 있는 도약기입니다. 아기를 많이 안아주세요!</span>`; 
        } else { 
            st.className = 'ww-status-box box-tint-green'; 
            st.removeAttribute('style');
            st.style.padding = '20px'; st.style.borderRadius = '16px'; st.style.marginBottom = '12px';
            st.innerHTML = `<div style="font-size:14.5px; font-weight:900; color:var(--success); margin-bottom:6px;">☀️ 맑음! 평온기 유지 중</div><span style="font-size:13px; color:var(--text-s);">${nxtWW ? '👉 다음 도약기: <strong style="color:var(--text-m);">' + nxtWW.t + ' (' + nxtWW.w + '주차)</strong> 대기 중' : '모든 도약기를 이수 완료했습니다.'}</span>`; 
        }
    }

    let table = `<tr><th style="padding:10px; background:#F2F4F6;">주차</th><th style="padding:10px; background:#F2F4F6;">진단 단계</th><th style="padding:10px; background:#F2F4F6;">특성 지표</th></tr>`;
    wwList.forEach(x => { let active = (week >= x.w-1 && week <= x.w+1) ? 'style="background:#FFF0F1; color:#D32F2F; font-weight:800;"' : ''; table += `<tr ${active}><td style="padding:10px; border-bottom:1px solid #E5E8EB;">${x.w-1}~${x.w+1}주</td><td style="padding:10px; border-bottom:1px solid #E5E8EB;">${x.t}</td><td style="padding:10px; border-bottom:1px solid #E5E8EB; text-align:left;">${x.d}</td></tr>`; });
    document.getElementById('ww-table').innerHTML = table;

    // 백신
    let vac = vaccineData.find(v => month <= v.maxMonth);
    document.getElementById('vaccine-info').innerHTML = vac ? vac.desc : "해당 월령 접종 정보 없음";
    let nextVacMonth = vac ? vac.maxMonth : 0;
    document.getElementById('vac-dday').innerText = (month === nextVacMonth) ? "이번 달 접종" : (nextVacMonth === 99 ? "기초 접종 완료" : `약 ${nextVacMonth - month}개월 뒤`);

    // 백분위 계산
    let standardArr = growthStandard[gender] || growthStandard['boy'];
    let std = standardArr.slice().reverse().find(x => month >= x.m);
    if(!std) std = standardArr[0]; 

    const sdHeight = std.h * 0.04; 
    const sdWeight = std.w * 0.12;
    const getDesc = (pct) => {
        if(pct >= 95) return `매우 큼 (상위 5%)`;
        if(pct >= 75) return `큰 편 (상위 25%)`;
        if(pct >= 25) return `평균 범위 (정상)`;
        if(pct >= 5) return `작은 편 (하위 25%)`;
        return `매우 작음 (상담 요망)`;
    };

    let pctHeight = null, pctWeight = null;
    
    // ✨ [게이지 바 매직] 텍스트 대신 화려한 애니메이션 막대 생성!
    if (h) { 
        pctHeight = getPercentile((h - std.h) / sdHeight); 
        const rank = 100 - pctHeight;
        document.getElementById('pct-height').innerHTML = `
            <span style="font-size:18px;">상위 <strong>${rank}%</strong></span>
            <div style="margin-top:10px; width:100%; height:10px; background:#F2F5F8; border-radius:5px; position:relative; overflow:hidden;">
                <div style="position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg, #BFDBFE, #3182F6); border-radius:5px; animation: fillGrowthH${rank} 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;"></div>
            </div>
            <style>@keyframes fillGrowthH${rank} { from { width: 0%; } to { width: ${100 - rank}%; } }</style>
        `;
        document.getElementById('desc-height').innerText = getDesc(pctHeight); 
    } else { 
        document.getElementById('pct-height').innerText = `-`; 
        document.getElementById('desc-height').innerText = `미입력`; 
    }

    if (w) { 
        pctWeight = getPercentile((w - std.w) / sdWeight); 
        const rankW = 100 - pctWeight;
        document.getElementById('pct-weight').innerHTML = `
            <span style="font-size:18px;">상위 <strong>${rankW}%</strong></span>
            <div style="margin-top:10px; width:100%; height:10px; background:#F2F5F8; border-radius:5px; position:relative; overflow:hidden;">
                <div style="position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg, #A7F3D0, #10B981); border-radius:5px; animation: fillGrowthW${rankW} 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;"></div>
            </div>
            <style>@keyframes fillGrowthW${rankW} { from { width: 0%; } to { width: ${100 - rankW}%; } }</style>
        `;
        document.getElementById('desc-weight').innerText = getDesc(pctWeight); 
    } else { 
        document.getElementById('pct-weight').innerText = `-`; 
        document.getElementById('desc-weight').innerText = `미입력`; 
    }

 // ✨ 카우프 지수 (비만도) 연산 및 친절한 멘트 출력 ✨
const kaupBadge = document.getElementById('kaup-badge');
let insightMsg = "";

if (h && w) {
    // 카우프 지수 = 체중 / (키m * 키m)
    const heightM = h / 100;
    const kaup = w / (heightM * heightM);
    kaupBadge.style.display = 'inline-block';
    
    let kaupDesc = "";

    if (kaup < 14) { 
        kaupBadge.innerText = '⚠️ 체중 미달 우려'; kaupBadge.style.background = '#F2F4F6'; kaupBadge.style.color = '#4E5968'; 
        kaupDesc = "키에 비해 몸무게 증가가 다소 정체되어 있어요. 수유량이나 이유식 양을 조금 더 늘려주시고, 영유아 검진 시 의사 선생님과 상담해 보세요!";
    }
    else if (kaup < 16) { 
        kaupBadge.innerText = '🌱 날씬한 모델 체형'; kaupBadge.style.background = '#E8F3FF'; kaupBadge.style.color = '#3182F6'; 
        kaupDesc = "키에 비해 체중이 적게 나가는 날씬한 체형이에요! 활동량이 많거나 기초 대사량이 높은 아기일 수 있습니다. 아주 건강하게 잘 자라고 있어요 🏃‍♂️";
    }
    else if (kaup <= 18) { 
        kaupBadge.innerText = '⚖️ 완벽한 황금 밸런스'; kaupBadge.style.background = '#ECFDF5'; kaupBadge.style.color = '#059669'; 
        kaupDesc = "키와 몸무게의 비율이 교과서처럼 완벽한 황금 밸런스예요! 지금의 식습관과 패턴 그대로 건강하게 키워주시면 됩니다 💯";
    }
    else if (kaup <= 20) { 
        kaupBadge.innerText = '💪 귀여운 통통 우량아'; kaupBadge.style.background = '#FFF9E6'; kaupBadge.style.color = '#B78103'; 
        kaupDesc = "키보다 몸무게가 묵직한 귀여운 통통 우량아예요! 아주 잘 먹고 쑥쑥 크고 있네요. 걷고 뛰기 시작하면 젖살은 자연스럽게 빠진답니다 🧸";
    }
    else { 
        kaupBadge.innerText = '🚨 소아 비만 주의'; kaupBadge.style.background = '#FFF0F1'; kaupBadge.style.color = '#D32F2F'; 
        kaupDesc = "키에 비해 체중이 꽤 많이 나가는 편이에요. 소아 비만으로 이어지지 않도록 간식이나 수유 텀을 한 번 점검해 보시는 걸 권장합니다!";
    }

    // 💡 [입력 후 결과 멘트] 다크모드/라이트모드 완벽 대응 변수 적용
    insightMsg = `
        <!-- ✨ [수정] 예쁜 테두리 박스(var(--bg-card)) 안에 멘트를 담았습니다! -->
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 16px; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size:12px; font-weight:800; color:var(--text-s); margin-bottom:6px;">우리아기 체질량 지수(BMI): <span style="color:var(--text-m); font-size:14px;">${kaup.toFixed(1)}</span></div>
            <div style="font-size:14px; font-weight:800; color:var(--text-m); line-height:1.55; word-break:keep-all;">${kaupDesc}</div>
        </div>
    `;
} else {
    kaupBadge.style.display = 'none';
    
    // 💡 [입력 전 안내 멘트] 다크모드 변수 적용 완료
    insightMsg = `
        <div style="background: var(--bg-sub, #F2F4F6); color: var(--text-m, #333D4B); padding: 16px; border-radius: 12px; font-size: 13.5px; font-weight: 700; line-height: 1.5; word-break: keep-all; text-align: center;">
            키와 몸무게를 모두 입력하시면 정확한 체형 밸런스(비만도) 진단과 맞춤 조언을 해드립니다! 💜
        </div>
    `;
}

    document.getElementById('growth-insight').innerHTML = insightMsg; 
    
    // 글로벌 윈도우 스코프에 결과값 임시 저장 (저장하기 버튼을 위해)
    window.tempGrowthData = {
        date: new Date().toISOString().split('T')[0],
        month: month,
        height: h || 0,
        weight: w || 0,
        pctHeight: pctHeight ? (100 - pctHeight) : 0,
        pctWeight: pctWeight ? (100 - pctWeight) : 0
    };

    // ✨ [대기업 앱 UX] 결과창 띄우기 전 'AI 로딩 중' 딜레이 추가
    const gRes = document.getElementById('growth-result');
    if(gRes) {
        gRes.style.display = 'none'; // 먼저 닫아놓고
        
        // 돋보기 아이콘과 함께 로딩 멘트 노출
        if(typeof showToast === 'function') showToast("🔍 AI가 또래 100명의 성장 데이터와 비교 분석 중입니다...");
        else alert("분석 중입니다...");

        // 0.8초 뒤에 짠! 하고 나타나면서 스크롤 부드럽게 이동
        setTimeout(() => {
            gRes.style.display = 'block';
            gRes.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
}

// ✨ 성장 기록 저장 및 파이어베이스 연동 (폭풍성장 이스터에그 패치!)
async function saveGrowthRecord() {
    console.log("1. 저장 버튼 클릭됨! 데이터 확인:", window.tempGrowthData);

    // 🚨 방어 1: 저장할 데이터가 제대로 안 넘어왔을 때
    if (!window.tempGrowthData || (window.tempGrowthData.height === 0 && window.tempGrowthData.weight === 0)) {
        if (typeof showToast === 'function') {
            return showToast("⚠️ 먼저 '분석하기' 버튼을 눌러주세요.");
        } else {
            alert("⚠️ 먼저 '분석하기' 버튼을 눌러주세요.");
            return;
        }
    }
    
    let records = JSON.parse(localStorage.getItem('tosil_growth_records')) || [];
    
    // 🌟 [니치 패치 1] 직전 기록과 비교해서 성장 폭 계산하기!
    let isSuperGrowth = false;
    let growthMsg = "";
    
    if (records.length > 0) {
        // 가장 최근 기록 가져오기 (날짜순 정렬 후 마지막)
        const sortedRecords = [...records].sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastRecord = sortedRecords[0];
        
        // 같은 날짜 덮어쓰기가 아닐 때만 비교
        if (lastRecord.date !== window.tempGrowthData.date) {
            const diffH = window.tempGrowthData.height - lastRecord.height;
            const diffW = window.tempGrowthData.weight - lastRecord.weight;
            
            let msgParts = [];
            if (diffH > 0) msgParts.push(`키 +${diffH.toFixed(1)}cm`);
            if (diffW > 0) msgParts.push(`몸무게 +${diffW.toFixed(1)}kg`);
            
            if (msgParts.length > 0) {
                // 키 2cm 이상 OR 몸무게 0.5kg 이상 늘었으면 폭풍 성장!
                if (diffH >= 2.0 || diffW >= 0.5) {
                    isSuperGrowth = true;
                    growthMsg = `🌱 대박! 폭풍 성장 중! (지난번보다 ${msgParts.join(', ')})`;
                } else {
                    growthMsg = `쑥쑥 잘 크고 있어요! (지난번보다 ${msgParts.join(', ')})`;
                }
            }
        }
    }

    // 같은 날짜 기록 덮어쓰기
    const existIdx = records.findIndex(r => r.date === window.tempGrowthData.date);
    if (existIdx > -1) {
        records[existIdx] = window.tempGrowthData;
    } else {
        records.push(window.tempGrowthData);
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date)); // 날짜순 정렬
    
    // 🚨 방어 2: 파이어베이스 에러 때문에 로컬 저장까지 멈추는 현상 방지
    if (typeof db !== 'undefined' && typeof setDoc === 'function' && typeof doc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { 
            await setDoc(doc(db, "growth_" + syncCode, "status"), { records: records }); 
        } catch (e) { 
            console.warn("파이어베이스 연동 실패 (하지만 기기에는 저장됩니다):", e); 
        }
    }
    
    // 핵심! 로컬 스토리지에 무조건 저장
    localStorage.setItem('tosil_growth_records', JSON.stringify(records));
    console.log("2. 로컬 스토리지 저장 완료:", records);
    
    // 🌟 [니치 패치 2] 조건에 따라 토스트 팝업 & 폭죽 분기 처리
    if (typeof showToast === 'function') {
        if (isSuperGrowth && typeof window.shootConfetti === 'function') {
            window.shootConfetti(); // 팡!
            showToast(`🎉 ${growthMsg}`);
        } else if (growthMsg) {
            showToast(`✨ ${growthMsg}`);
        } else {
            showToast("🎉 우리 아기 성장 기록이 차트에 안전하게 저장되었습니다!"); 
        }
    } else {
        alert("🎉 우리 아기 성장 기록이 차트에 안전하게 저장되었습니다!");
    }
    
    // 🚨 방어 4: 차트 그리는 함수가 아직 없거나 에러 날 때 방지
    if (typeof renderGrowthHistory === 'function') {
        renderGrowthHistory();
        
        // ✨ [추가] 차트 아코디언을 자동으로 쫙 열고, 거기로 화면을 부드럽게 스크롤 올려주기!
        const chartAcc = document.getElementById('growth-history-accordion');
        if (chartAcc) {
            chartAcc.open = true; // 아코디언 열기
            setTimeout(() => {
                chartAcc.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    } else {
        console.warn("renderGrowthHistory 함수가 없습니다. 차트를 갱신하려면 이 함수가 필요합니다.");
    }
}
window.saveGrowthRecord = saveGrowthRecord;

// ✨ 성장 기록 삭제 (모달 적용)
function deleteGrowthRecord(dateStr) {
    showConfirm("이 날의 성장 기록을 삭제할까요?", function() {
        let records = JSON.parse(localStorage.getItem('tosil_growth_records')) || [];
        records = records.filter(r => r.date !== dateStr);
        localStorage.setItem('tosil_growth_records', JSON.stringify(records));
        renderGrowthHistory();
        showToast("🗑️ 성장 기록이 삭제되었습니다!");
    }, "🗑️", "삭제", "#F04452");
}
window.deleteGrowthRecord = deleteGrowthRecord;

// ✨ 저장된 기록으로 차트 & 리스트 그리기 (마지막 계측일 배지 추가!)
function renderGrowthHistory() {
    let records = JSON.parse(localStorage.getItem('tosil_growth_records')) || [];
    const acc = document.getElementById('growth-history-accordion');
    if (!acc) return;

    if (records.length === 0) {
        acc.style.display = 'none';
        return;
    }
    
    acc.style.display = 'block'; // 기록이 있으면 아코디언 표시!

    // 1. 차트 그리기
    const canvas = document.getElementById('growthChart'); 
    if(canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d'); 
        if(growthChartObj) growthChartObj.destroy(); 
        
        // 데이터 전처리 (0인 값은 차트에서 끊어지게 null 처리)
        const labels = records.map(r => r.date.substring(5)); // MM-DD
        const hData = records.map(r => r.height > 0 ? r.height : null);
        const wData = records.map(r => r.weight > 0 ? r.weight : null);

        growthChartObj = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: labels, 
                datasets: [
                    { label: '키(cm)', data: hData, borderColor: '#3182F6', backgroundColor: '#3182F6', yAxisID: 'yHeight', tension: 0.3, spanGaps: true },
                    { label: '몸무게(kg)', data: wData, borderColor: '#10B981', backgroundColor: '#10B981', yAxisID: 'yWeight', tension: 0.3, spanGaps: true }
                ] 
            }, 
            options: { 
                responsive: true, maintainAspectRatio: false, 
                scales: { 
                    yHeight: { type: 'linear', display: true, position: 'left', title: {display: true, text: '키(cm)'} },
                    yWeight: { type: 'linear', display: true, position: 'right', title: {display: true, text: '몸무게(kg)'}, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { position: 'bottom' } } 
            } 
        });
    }

    // 2. 리스트 그리기
    const listContainer = document.getElementById('growth-history-list');
    if (listContainer) {
        let html = '';
        
       // 🌟 [니치 패치 3] 마지막 계측일 넛지 배지 추가! (+ 증감폭 계산기 연동)
        const sortedRecords = [...records].sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastRecord = sortedRecords[0];
        const today = new Date();
        today.setHours(0,0,0,0);
        const lastDate = new Date(lastRecord.date);
        lastDate.setHours(0,0,0,0);
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        // 🎯 방금 만든 스마트 멘트 생성기로 메세지를 뽑아옵니다!
        const smartMessage = getGrowthDeltaMessage(sortedRecords);
        
        let badgeHtml = '';
        if (diffDays === 0) {
            // 오늘 쟀을 땐 똑똑하게 계산된 증감폭 멘트 출력!
            badgeHtml = `<div style="background:#E6F7F2; color:#059669; border:1px solid #A7F3D0; padding:10px 12px; border-radius:12px; font-size:13px; margin-bottom:16px; text-align:center;">${smartMessage}</div>`;
        } else if (diffDays <= 14) {
            badgeHtml = `<div style="background:#F8F9FA; color:#8B95A1; border:1px solid #E5E8EB; padding:8px 12px; border-radius:12px; font-size:12.5px; font-weight:800; margin-bottom:16px; text-align:center;">마지막 계측: ${diffDays}일 전</div>`;
        } else {
            badgeHtml = `<div style="background:#FFF0F1; color:#F04452; border:1px dashed #F04452; padding:8px 12px; border-radius:12px; font-size:12.5px; font-weight:800; margin-bottom:16px; text-align:center;">🚨 앗! 계측한 지 ${diffDays}일이나 지났어요. 오늘 한 번 재볼까요?</div>`;
        }
        
        html += badgeHtml; // 배지를 리스트 맨 위에 삽입

        // 최신 기록이 위로 오게 뒤집어서 렌더링
        sortedRecords.forEach(r => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#F8F9FA; border-radius:12px; border:1px solid #E5E8EB; margin-bottom:8px;">
                    <div>
                        <div style="font-size:12px; color:var(--text-s); font-weight:800;">${r.date} (생후 ${r.month}개월)</div>
                        <div style="font-size:14px; font-weight:900; color:var(--text-m); margin-top:2px;">
                            ${r.height > 0 ? `<span style="color:#3182F6;">키 ${r.height}cm</span> ` : ''} 
                            ${r.weight > 0 ? `<span style="color:#10B981;">몸무게 ${r.weight}kg</span>` : ''}
                        </div>
                    </div>
                    <button onclick="deleteGrowthRecord('${r.date}')" style="background:none; border:none; font-size:14px; color:#D1D6DB; cursor:pointer;">❌</button>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }
}
window.renderGrowthHistory = renderGrowthHistory;

// 앱 로딩 시(초기화) 성장 기록 불러오기
document.addEventListener("DOMContentLoaded", () => {
    if(typeof window.renderGrowthHistory === 'function') window.renderGrowthHistory();
});

function uploadPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas'), maxSize = 600; 
                let width = img.width, height = img.height;
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                canvas.width = width; canvas.height = height; 
                const ctx = canvas.getContext('2d'); 
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
                
                try { 
                    localStorage.setItem('tosil_baby_photo', dataUrl); 
                    loadBabyPhoto(); 
                } catch(err) { 
                    alert("사진 용량이 너무 큽니다. 화면을 캡처해서 올려주세요!"); 
                }
            }; 
            img.src = e.target.result;
        }; 
        reader.readAsDataURL(input.files[0]);
    }
}
window.uploadPhoto = uploadPhoto;

function loadBabyPhoto() {
    const savedPhoto = localStorage.getItem('tosil_baby_photo'), imgEl = document.querySelector('.home-hero-img');
    if (savedPhoto && imgEl) { imgEl.src = savedPhoto; imgEl.style.display = 'block'; imgEl.parentNode.style.background = 'none'; }
}

function updateHomeDashboard() {
    const feverRecords = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    const feverText = document.getElementById('db-fever-text');
    
    if (feverRecords.length > 0) {
        const latest = feverRecords[0];
        let color = "#191F28";
        let subText = "정상 체온";
        
        if (latest.temp >= 38.0) { color = "#E32636"; subText = "고열 주의"; } 
        else if (latest.temp >= 37.5) { color = "#F59E0B"; subText = "미열"; }

        feverText.innerHTML = `
            <div style="font-size:24px; font-weight:900; color:${color}; letter-spacing:-0.5px;">${latest.temp}<span style="font-size:16px; margin-left:2px;">℃</span></div>
            <div style="font-size:12px; font-weight:800; color:var(--text-s); margin-top:4px;">${subText} <span style="opacity:0.6; font-weight:600;">(${latest.time})</span></div>
        `;
    } else {
        feverText.innerHTML = `<div style="font-size:13px; font-weight:800; color:#8B95A1;">체온을<br>기록해주세요</div>`;
    }

    const ledgerCard = document.getElementById('db-ledger-card');
    if (ledgerCard) {
        const ledger = JSON.parse(localStorage.getItem('tosil_ledger_data')) || { total: 0, savedTotal: 0, goal: "목표 설정하기", goalAmount: 100000 };
        const targetAmount = ledger.goalAmount || 100000;
        const percent = Math.min(Math.round((ledger.savedTotal / targetAmount) * 100), 100);
        const goalName = ledger.goal || '공동 목표';
        
        const textEl = document.getElementById('db-ledger-text');
        const progressWrap = document.getElementById('db-ledger-progress-wrap');
        const progressBar = document.getElementById('db-ledger-progress-bar');
        
        if(textEl) {
            textEl.innerHTML = `
                <div style="font-size:22px; font-weight:900; color:#191F28; letter-spacing:-0.5px; margin-bottom:4px;">${percent}%</div>
                <div style="font-size:12px; font-weight:800; color:var(--text-s); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${goalName}</div>
            `;
        }
        if(progressWrap && progressBar) {
            progressWrap.style.display = 'block';
            progressBar.style.width = percent + "%";
        }
    }

    if (typeof updateSmartBanner === 'function') updateSmartBanner();
}

function initDarkMode() {
    const savedMode = localStorage.getItem('tosil_dark_mode');
    if (savedMode === 'on') { document.body.classList.add('dark-mode'); const toggleBtn = document.getElementById('dark-mode-toggle'); if(toggleBtn) toggleBtn.innerText = '☀️'; }
}
function toggleDarkMode() {
    const body = document.body; body.classList.toggle('dark-mode');
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if(toggleBtn) toggleBtn.innerText = body.classList.contains('dark-mode') ? '☀️' : '🌙';
    localStorage.setItem('tosil_dark_mode', body.classList.contains('dark-mode') ? 'on' : 'off');
}
window.toggleDarkMode = toggleDarkMode;

// ==========================================
// 🧊 [안심 큐브 냉장고 엔진] (실시간 동기화)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('cube-date');
    if (dateInput) dateInput.value = todayStr;

    // 🔥 핵심: 이유식 화면에서 남긴 '차감 비밀 메모'가 있는지 확인!
    let pendingSync = localStorage.getItem('tosil_cube_pending_sync');
    if (pendingSync && typeof db !== 'undefined') {
        let records = JSON.parse(pendingSync);
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try {
            // 메모가 있으면 파이어베이스 클라우드 서버에 1개 줄어든 상태를 냅다 덮어씌웁니다!
            await setDoc(doc(db, "cube_" + syncCode, "status"), { records: records });
            // 업로드 완료 후 메모 찢어버리기
            localStorage.removeItem('tosil_cube_pending_sync'); 
        } catch(e) { console.error("차감 동기화 에러:", e); }
    }
});

function getCubeDDayText(madeDateStr) {
    const madeDate = new Date(madeDateStr); madeDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    
    const diffDays = Math.floor((today - madeDate) / (1000 * 60 * 60 * 24));
    
    let color = "#3182F6"; 
    let bg = "#EBF4FF";
    let text = `보관 ${diffDays}일차`;
    
    if (diffDays === 0) {
        text = "오늘 얼림";
        color = "#00B37A"; 
        bg = "#E6F7F2";
    } else if (diffDays > 14) {
        color = "#FF823A"; 
        bg = "#FFF0E6";
    } else if (diffDays < 0) {
        text = "날짜 오류";
        color = "#8B95A1";
        bg = "#F2F5F8";
    }
    
    return `<span style="background:${bg}; color:${color}; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px solid ${color};">${text}</span>`;
}

// 🧊 큐브 기록 추가 (토스트 적용)
async function addCubeRecord() {
    const cat = document.getElementById('cube-category').value;
    const name = document.getElementById('cube-name').value.trim();
    const date = document.getElementById('cube-date').value;
    const qty = parseInt(document.getElementById('cube-qty').value);

    if (!name || !date || isNaN(qty) || qty <= 0) {
        return showToast("⚠️ 큐브 이름, 날짜, 수량을 정확히 입력해주세요!"); // 👈 교체
    }

    const newCube = { id: "cube_" + new Date().getTime(), cat: cat, name: name, date: date, qty: qty, timestamp: new Date().getTime() };

    let records = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    records.push(newCube);
    
    if (typeof db !== 'undefined') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { await setDoc(doc(db, "cube_" + syncCode, "status"), { records: records }); } catch (e) { console.error(e); }
    }

    localStorage.setItem('tosil_cube_records', JSON.stringify(records));
    document.getElementById('cube-name').value = '';
    document.getElementById('cube-qty').value = '';
    renderCubes();
    showToast("🧊 큐브가 냉장고에 쏙! 저장되었습니다."); // 👈 추가
}

async function useCube(id) {
    let records = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return;

    records[index].qty -= 1;
    
    if (records[index].qty <= 0) {
        records.splice(index, 1); 
    }

    if (typeof db !== 'undefined') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { await setDoc(doc(db, "cube_" + syncCode, "status"), { records: records }); } 
        catch (e) { console.error(e); }
    }

    localStorage.setItem('tosil_cube_records', JSON.stringify(records));
    renderCubes();
}

function renderCubes() {
    const container = document.getElementById('cube-list-container');
    if (!container) return;

    let records = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    
    if (records.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; background:var(--bg-sub); border-radius:16px; border:1px dashed var(--border);">
                <div style="font-size:24px; margin-bottom:10px;">🌬️</div>
                <div style="font-size:13.5px; font-weight:800; color:var(--text-s);">냉동실이 텅 비어있어요!<br>이유식 재료를 얼리고 기록해보세요.</div>
            </div>`;
        return;
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = '';
    records.forEach(r => {
        const icon = r.cat === 'meat' ? '🥩' : '🥦';
        const dDayHtml = getCubeDDayText(r.date);
        
        // 🚨 핵심 수정: white-space: nowrap 과 flex-shrink: 0 적용으로 줄바꿈 원천 차단!
        html += `
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:16px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                <div style="font-size:24px; background:var(--bg-sub); width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${icon}</div>
                <div style="min-width:0;">
                    <div style="font-size:15px; font-weight:900; color:var(--text-m); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name}</div>
                    <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-s); white-space:nowrap; flex-wrap:nowrap;">
    ${dDayHtml} <span style="opacity:0.7;">(${r.date.substring(5).replace('-', '.')} 제조)</span>
</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; flex-shrink:0; margin-left:8px;">
                <div style="font-size:18px; font-weight:900; color:var(--primary); white-space:nowrap;">${r.qty}<span style="font-size:12px; color:var(--text-s);">개</span></div>
               <button onclick="useCube('${r.id}')" style="background:#F2F5F8; color:#4E5968; border:none; border-radius:10px; width:54px; height:44px; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">사용</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

window.addCubeRecord = addCubeRecord;
window.useCube = useCube;

// ==========================================
// 🧊 [냉장고] 파이어베이스 실시간 수신 리스너
// ==========================================
let cubeUnsubscribe = null;
function startCubeRealtimeSync() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "cube_" + syncCode, "status") : null;
    
    if(!docRef) return; 

    if (cubeUnsubscribe) cubeUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    cubeUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tosil_cube_records', JSON.stringify(data.records || []));
        }
        if (typeof renderCubes === 'function') renderCubes();
    });
}
window.startCubeRealtimeSync = startCubeRealtimeSync;

// ==========================================
// 🧊 [안심 큐브 냉장고] 자주 쓰는 재료 커스텀 편집 엔진
// ==========================================
let isCubeQuickEditMode = false;
const DEFAULT_CUBE_QUICKS = [
    {cat: 'meat', name: '소고기'}, {cat: 'meat', name: '닭고기'},
    {cat: 'veg', name: '애호박'}, {cat: 'veg', name: '브로콜리'}, {cat: 'veg', name: '양배추'}
];

function renderCubeQuicks() {
    const container = document.getElementById('cube-quick-container');
    if(!container) return;
    
    let quicks = JSON.parse(localStorage.getItem('tosil_cube_quicks'));
    if(!quicks || quicks.length === 0) {
        quicks = DEFAULT_CUBE_QUICKS;
        localStorage.setItem('tosil_cube_quicks', JSON.stringify(quicks));
    }

    let html = '';
    quicks.forEach((q, index) => {
        const isMeat = q.cat === 'meat';
        const bg = isMeat ? '#FFF0F1' : '#ECFDF5';
        const color = isMeat ? '#D32F2F' : '#059669';
        const border = isMeat ? '#FFE3E3' : '#A7F3D0';
        const icon = isMeat ? '🥩' : '🥦';

        if (isCubeQuickEditMode) {
            html += `<button onclick="deleteCubeQuick(${index})" style="flex-shrink:0; padding:8px 14px; background:#F2F4F6; color:#8B95A1; border:1px dashed #D1D6DB; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer; transition:0.2s;">${q.name} ❌</button>`;
        } else {
            html += `<button onclick="setCubeQuick('${q.cat}', '${q.name}')" style="flex-shrink:0; padding:8px 14px; background:${bg}; color:${color}; border:1px solid ${border}; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer; transition:0.2s;">${icon} ${q.name}</button>`;
        }
    });

    if (isCubeQuickEditMode) {
        html += `<button onclick="addCubeQuick()" style="flex-shrink:0; padding:8px 14px; background:#E8F3FF; color:#3182F6; border:1px dashed #3182F6; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer;">+ 새 재료 추가</button>`;
    }

    container.innerHTML = html;
}

function toggleCubeQuickEdit() {
    isCubeQuickEditMode = !isCubeQuickEditMode;
    renderCubeQuicks();
}

// 🧊 큐브 퀵버튼 삭제 (모달 적용)
function deleteCubeQuick(index) {
    showConfirm("이 재료를 자주 쓰는 목록에서 삭제할까요?", function() {
        let quicks = JSON.parse(localStorage.getItem('tosil_cube_quicks')) || [];
        quicks.splice(index, 1);
        localStorage.setItem('tosil_cube_quicks', JSON.stringify(quicks));
        renderCubeQuicks();
        showToast("✂️ 삭제되었습니다.");
    }, "✂️", "삭제", "#F04452");
}
window.addCubeRecord = addCubeRecord;
window.deleteCubeQuick = deleteCubeQuick;

function addCubeQuick() {
    const name = prompt("추가할 자주 쓰는 재료의 이름을 입력하세요.\n(예: 단호박, 대구살, 오트밀 등)");
    if(!name || !name.trim()) return;
    
    const isMeat = confirm(`[${name}]\n이 재료는 고기/단백질류 인가요?\n\n- 고기면 [확인]\n- 채소면 [취소]를 눌러주세요.`);
    const cat = isMeat ? 'meat' : 'veg';
    
    let quicks = JSON.parse(localStorage.getItem('tosil_cube_quicks')) || [];
    quicks.push({cat: cat, name: name.trim()});
    localStorage.setItem('tosil_cube_quicks', JSON.stringify(quicks));
    renderCubeQuicks();
}

function setCubeQuick(cat, name) {
    document.getElementById('cube-category').value = cat;
    document.getElementById('cube-name').value = name;
    document.getElementById('cube-qty').focus(); 
}

window.renderCubeQuicks = renderCubeQuicks;
window.toggleCubeQuickEdit = toggleCubeQuickEdit;
window.deleteCubeQuick = deleteCubeQuick;
window.addCubeQuick = addCubeQuick;
window.setCubeQuick = setCubeQuick;

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderCubeQuicks, 100);
});

// ==========================================
// 💌 [부부 육아 바통터치 엔진] (버그 완벽 수정본)
// ==========================================
async function saveBatonToFirebase(records) {
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { await setDoc(doc(db, "baton_" + syncCode, "status"), { records }); } catch (e) {}
    }
    localStorage.setItem('tosil_baton_records', JSON.stringify(records));
    renderBatonTasks();
}

async function addQuickBaton(text) {
    const rewardSelect = document.getElementById('baton-reward');
    const customInput = document.getElementById('baton-reward-custom');
    let reward = "없음";
    if (rewardSelect) {
        if (rewardSelect.value === 'custom' && customInput && customInput.value.trim() !== '') {
            reward = "✨ " + customInput.value.trim();
        } else if (rewardSelect.value !== 'custom') {
            reward = rewardSelect.value;
        }
    }
    await createBatonTask(text, reward);
}

async function addCustomBaton() {
    const input = document.getElementById('baton-text');
    const rewardSelect = document.getElementById('baton-reward');
    const customInput = document.getElementById('baton-reward-custom');
    if (!input || !input.value.trim()) return alert("부탁할 내용을 입력해 주세요!");
    
    let reward = "없음";
    if (rewardSelect) {
        if (rewardSelect.value === 'custom' && customInput && customInput.value.trim() !== '') {
            reward = "✨ " + customInput.value.trim();
        } else if (rewardSelect.value !== 'custom') {
            reward = rewardSelect.value;
        }
    }
    await createBatonTask(input.value.trim(), reward);
    
    input.value = '';
    if(rewardSelect) {
        rewardSelect.value = "없음";
        if(customInput) customInput.style.display = 'none';
    }
}

// 💌 바통터치 생성 (토스트 적용)
async function createBatonTask(text, reward) {
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    
    const isDuplicate = records.some(r => r.text === text);
    if (isDuplicate) return showToast("🚨 이미 똑같은 부탁이 대기 중입니다!"); // 👈 교체

    const now = new Date(), timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    records.unshift({ id: "baton_"+now.getTime(), text, reward, time: timeStr, status: "requested" });
    await saveBatonToFirebase(records);
    showToast("💌 바통터치 요청이 성공적으로 전달되었습니다!"); // 👈 추가
}

async function acceptBaton(id) {
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return;
    records[idx].status = "accepted";
    await saveBatonToFirebase(records);
}

// 💌 바통터치 완료 (토스트 적용 + 🎮 경험치 획득 추가!)
async function completeBaton(id) {
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return;
    
    const reward = records[idx].reward; 
    records.splice(idx, 1); 
    await saveBatonToFirebase(records);

    if (reward && reward !== "없음") {
        showToast(`🎉 미션 해결!\n약속된 보상 [${reward}]을(를) 당당하게 요구하세요! 👍`);
    } else {
        showToast("🎉 미션 해결 완료! 든든한 육아메이트 최고입니다 👍");
    }

    // 👇 이 마법의 한 줄이 남편의 경험치를 20만큼 올려줍니다!
    if(typeof gainDadExp === 'function') gainDadExp(20); 
}

// 💌 바통터치 취소 (모달 적용)
async function cancelBaton(id) {
    showConfirm("이 부탁을 취소하시겠습니까?", async function() {
        let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
        records = records.filter(r => r.id !== id);
        await saveBatonToFirebase(records);
        showToast("🕊️ 부탁이 취소되었습니다.");
    }, "🤔", "취소", "#8B95A1");
}
window.createBatonTask = createBatonTask;
window.completeBaton = completeBaton;
window.cancelBaton = cancelBaton;

function renderBatonTasks() {
    const container = document.getElementById('baton-list-container');
    if (!container) return;
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    
if (records.length === 0) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 110px; text-align: center; padding: 20px; background: var(--bg-sub); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="font-size: 14px; font-weight: 800; color: var(--text-s); line-height: 1.5;">현재 대기 중인 SOS 요청이 없습니다.<br>평화로운 공동 육아 중! 🤍</div>
            </div>`;
        return;
    }

    let html = '';
    records.forEach(r => {
        let statusHtml = '';
        let actionBtn = '';
        
        if (r.status === 'requested') {
            statusHtml = `<span style="background:#FFF0F1; color:#F04452; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px solid #F04452; white-space:nowrap; display:inline-block; flex-shrink:0;">⏳ 요청중</span>`;
            actionBtn = `<button onclick="acceptBaton('${r.id}')" style="padding:10px 14px; background:#3182F6; color:#FFF; border:none; border-radius:10px; font-size:12.5px; font-weight:800; cursor:pointer; flex-shrink:0; white-space:nowrap;">🫡 미션접수</button>`;
        } else if (r.status === 'accepted') {
            statusHtml = `<span style="background:#EBF4FF; color:#3182F6; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px solid #3182F6; white-space:nowrap; display:inline-block; flex-shrink:0;">🏃‍♂️ 처리중</span>`;
            actionBtn = `<button onclick="completeBaton('${r.id}')" style="padding:10px 14px; background:#00B37A; color:#FFF; border:none; border-radius:10px; font-size:12.5px; font-weight:800; cursor:pointer; flex-shrink:0; white-space:nowrap;">✅ 해결완료</button>`;
        }

        let cancelBtn = `<button onclick="cancelBaton('${r.id}')" style="padding:10px 12px; background:#F2F5F8; color:#8B95A1; border:none; border-radius:10px; font-size:12.5px; font-weight:800; cursor:pointer; flex-shrink:0; white-space:nowrap; margin-right:6px;">취소</button>`;
        let rewardHtml = (r.reward && r.reward !== "없음") ? `<div style="display:inline-block; margin-top:8px; background:#FFF9E6; color:#B78103; font-size:11.5px; font-weight:800; padding:5px 10px; border-radius:8px; border:1px solid #FFE58F;">🎁 약속된 보상: ${r.reward}</div>` : '';

        html += `
        <div class="timeline-item" style="background:#FFFFFF; border:1px solid var(--border); padding:16px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.01); margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:12px; flex:1;">
                <div style="flex:1;">
                    <div style="font-size:14.5px; font-weight:800; color:var(--text-m); margin-bottom:6px; line-height:1.4;">${r.text}</div>
                    <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-s);">
                        ${statusHtml} <span style="opacity:0.6; white-space:nowrap;">⏱️ ${r.time}</span>
                    </div>
                    ${rewardHtml}
                </div>
            </div>
            <div style="margin-left:12px; display:flex; align-items:center;">
                ${cancelBtn}
                ${actionBtn}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

window.addQuickBaton = addQuickBaton;
window.addCustomBaton = addCustomBaton;
window.acceptBaton = acceptBaton;
window.completeBaton = completeBaton;
window.cancelBaton = cancelBaton;

// ==========================================
// 🍽️ 8. 이유식 알레르기 체크리스트 엔진
// ==========================================
function renderFoodChecklist() {
    const container = document.getElementById('food-list-container');
    if (!container) return;
    
    let savedFoods = {};
    try { savedFoods = JSON.parse(localStorage.getItem('tosil_food_test')) || {}; } catch (e) { savedFoods = {}; }

    let passedCount = 0;
    let totalCount = 0;
    let html = '';
    
    foodCategories.forEach(cat => {
        html += `<div><div style="font-size:14px; font-weight:800; color:var(--text-m); margin-bottom:10px;">${cat.name}</div><div style="display:flex; flex-wrap:wrap; gap:8px;">`;
        cat.items.forEach(item => {
            totalCount++;
            const status = savedFoods[item] || 0; 
            let btnStyle = "background:#F2F5F8; color:var(--text-s); border:1px solid var(--border);";
            let icon = "⬜ ";
            
            if (status === 1) {
                btnStyle = "background:#E6F7F2; color:#00B37A; border:1px solid #00B37A; font-weight:800;";
                icon = "✅ ";
                passedCount++;
            } else if (status === 2) {
                btnStyle = "background:#FFF0F1; color:#F04452; border:1px solid #F04452; font-weight:800;";
                icon = "🚨 ";
            }

            html += `<button onclick="toggleFoodStatus('${item}')" style="padding:10px 14px; border-radius:12px; font-size:13.5px; cursor:pointer; transition:all 0.2s; ${btnStyle}">${icon}${item}</button>`;
        });
        html += `</div></div>`;
    });

    container.innerHTML = html;
    
    const countEl = document.getElementById('food-passed-count');
    if(countEl) {
        countEl.innerText = passedCount;
        if(countEl.nextElementSibling) countEl.nextElementSibling.innerText = `/${totalCount}`;
    }
}

function toggleFoodStatus(itemName) {
    let savedFoods = JSON.parse(localStorage.getItem('tosil_food_test')) || {};
    let currentStatus = savedFoods[itemName] || 0;
    currentStatus = (currentStatus + 1) % 3;
    savedFoods[itemName] = currentStatus;
    localStorage.setItem('tosil_food_test', JSON.stringify(savedFoods));
    renderFoodChecklist(); 
}

// ==========================================
// 💌 [바통터치] 실시간 감시 엔진 
// ==========================================
let batonUnsubscribe = null;
function startBatonRealtimeSync() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "baton_" + syncCode, "status") : null;
    
    if(!docRef) return; 

    if (batonUnsubscribe) batonUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    batonUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tosil_baton_records', JSON.stringify(data.records || []));
            renderBatonTasks(); 
        }
    });
}
window.startBatonRealtimeSync = startBatonRealtimeSync;

// ==========================================
// 🚀 런타임 구동 및 실시간 동기화 마스터 마운트 (완벽 통합본)
// ==========================================
window.addEventListener('load', () => {    
    // 1. 기본 데이터 및 UI 로드
    loadAllExternalData();    
    renderBabyInfo();    
    loadBabyPhoto();    
    renderCubes();
    renderBatonTasks();
    updateLedgerUI();
    updateHomeDashboard();
    initDarkMode();
    renderFoodChecklist();    
    if (typeof renderMilestones === 'function') renderMilestones();
    
    // 2. 툴박스 패널 초기화
    const toolboxTab = document.getElementById('tab-toolbox');
    if(toolboxTab) {
        toolboxTab.querySelectorAll('.panel-block').forEach(p => {    
            if(!p.classList.contains('active')) p.style.display = 'none';    
        });
    }
    
    // 3. 버튼 햅틱 및 심부름 버튼 이벤트 바인딩
    document.querySelectorAll('.sym-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cb = this.previousElementSibling;
            setTimeout(() => {
                if (cb && cb.checked) {
                    this.style.background = 'rgba(49, 130, 246, 0.15)'; this.style.border = '1px solid #3182F6'; this.style.color = '#3182F6';
                } else {
                    this.style.background = ''; this.style.border = ''; this.style.color = '';
                }
            }, 10);
        });
    });
        
    // 4. 실시간 동기화 리스너 통합 가동 (일괄 스위치 + 개별 방어막)
    if (typeof initRealtimeSync === 'function') {
        initRealtimeSync();
    } else {
        renderFeverTimeline();
        updateHomeDashboard();
    }

    // 개별 실시간 동기화 함수 안전 호출 (두 번째 블록 내용 병합 완료)
    if (typeof startFeverRealtimeSync === 'function') { startFeverRealtimeSync(); } 
    else { renderFeverTimeline(); updateHomeDashboard(); }

    if (typeof startCubeRealtimeSync === 'function') { startCubeRealtimeSync(); } 
    else { renderCubes(); }

    if (typeof startBatonRealtimeSync === 'function') { startBatonRealtimeSync(); } 
    else { renderBatonTasks(); }

    if (typeof startLedgerRealtimeSync === 'function') { startLedgerRealtimeSync(); } 
    else { updateLedgerUI(); }

    // 5. 상단 연동 배지 최신화
    if (typeof updateSyncBadge === 'function') {
        updateSyncBadge();    
    }
});

// ==========================================
// 👨‍👩‍👧 가족 실시간 연동 모달 컨트롤
// ==========================================
function openFamilySyncModal() {
    const m = document.getElementById('family-sync-modal'); 
    if(m) m.style.display = 'flex';
}

function closeFamilySyncModalForce() {
    const m = document.getElementById('family-sync-modal'); 
    if(m) m.style.display = 'none';
}

function closeFamilySyncModal(e) {
    if (e.target.id === 'family-sync-modal') {
        closeFamilySyncModalForce();
    }
}

window.openFamilySyncModal = openFamilySyncModal;
window.closeFamilySyncModalForce = closeFamilySyncModalForce;
window.closeFamilySyncModal = closeFamilySyncModal;

// ==========================================
// 🔗 상단 연동 상태 배지 업데이트 (오터치 방지 적용!)
// ==========================================
function updateSyncBadge() {
    const syncCode = localStorage.getItem('family_sync_code'); 
    const badgeBtn = document.getElementById('sync-badge-btn');
    const badgeText = document.getElementById('sync-status-text');
    const badgeIcon = document.getElementById('sync-status-icon');

    if (!badgeBtn || !badgeText) return; 

    if (syncCode) {
        // ✅ [연동 완료 상태]
        badgeBtn.style.background = "#E8F0FE";
        badgeBtn.style.color = "#1A73E8";
        badgeText.innerText = "연동완료";
        if(badgeIcon) badgeIcon.innerText = "🔗";
        
        // 💡 [핵심 해결책] 연동 완료 시에는 클릭(터치)을 무시하도록 설정!
        // 이렇게 하면 톱니바퀴를 누를 때 겹치더라도 톱니바퀴가 정상적으로 눌립니다.
        badgeBtn.style.pointerEvents = "none"; 
        
    } else {
        // ❌ [연동 필요 상태]
        badgeBtn.style.background = "#FFF3CD";
        badgeBtn.style.color = "#856404";
        badgeText.innerText = "연동 필요!";
        if(badgeIcon) badgeIcon.innerText = "🚨";
        
        // 연동 전에는 배지를 눌러서 설정창 등으로 이동해야 하므로 터치 활성화
        badgeBtn.style.pointerEvents = "auto"; 
    }
}
window.updateSyncBadge = updateSyncBadge;

// ==========================================
// 💰 [가계부 리스너] 파이어베이스 연동 연결고리
// ==========================================
let ledgerUnsubscribe = null;
function startLedgerRealtimeSync() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "ledger_" + syncCode, "status") : null;
    if(!docRef) return; 

    if (ledgerUnsubscribe) ledgerUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    ledgerUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tosil_ledger_data', JSON.stringify(data));
        }
        if (typeof updateLedgerUI === 'function') updateLedgerUI();
        if (typeof updateHomeDashboard === 'function') updateHomeDashboard();
    });
}
window.startLedgerRealtimeSync = startLedgerRealtimeSync;

// ==========================================
// 💡 스마트 홈 배너 엔진 (알람 끄기 + 예쁜 ✕ 버튼 장착)
// ==========================================
window.dismissSmartBanner = function(bannerType) {
    // 오늘 날짜를 기억해서 내일 00시가 되면 다시 뜨게 만듭니다!
    localStorage.setItem('tosil_dismiss_banner_' + bannerType, new Date().toDateString());
    window.updateSmartBanner();
    window.showToast("오늘 하루 이 알림을 보지 않습니다 🤫");
};

function updateSmartBanner() {
    const container = document.getElementById('smart-banner-container');
    if(!container) return;

    container.style.setProperty('border', 'none', 'important');
    container.style.setProperty('outline', 'none', 'important');
    container.style.setProperty('background', 'transparent', 'important');
    container.style.setProperty('box-shadow', 'none', 'important');

    let banners = [];
    const todayStr = new Date().toDateString();
    const isDismissed = (type) => localStorage.getItem('tosil_dismiss_banner_' + type) === todayStr;

    // 1. SOS 바통터치
    const batonRecords = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    const urgentBaton = batonRecords.find(r => r.status === 'requested');
    if (urgentBaton && !isDismissed('baton')) {
        banners.push(`
            <div onclick="switchTab('toolbox', document.getElementById('nav-toolbox')); setTimeout(() => switchTool('baton'), 50);" style="position: relative; flex-shrink: 0; width: __WIDTH__; scroll-snap-align: start; background: var(--bg-card); border: 1px solid #6B4EFF; border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.05); box-sizing: border-box;">
                <button onclick="event.stopPropagation(); window.dismissSmartBanner('baton');" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.05); border-radius:50%; border:none; color:#8B95A1; font-size:12px; font-weight:900; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; backdrop-filter: blur(2px);">✕</button>
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                    <div style="font-size: 26px; flex-shrink: 0;">💌</div>
                    <div style="flex: 1; min-width: 0; text-align: left;">
                        <div style="font-size: 12px; font-weight: 800; color: #6B4EFF; margin-bottom: 4px;">긴급 SOS 요청 !</div>
                        <div style="font-size: 15.5px; font-weight: 900; color: var(--text-m); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;">"${urgentBaton.text}"</div>
                    </div>
                </div>
                <span style="flex-shrink: 0; white-space: nowrap; background: #6B4EFF; color: white; font-size: 13px; font-weight: 900; padding: 8px 14px; border-radius: 12px;">교대하기</span>
            </div>
        `);
    }

    try {
        const savedBaby = localStorage.getItem('tosil_baby');
        if (savedBaby) {
            const data = JSON.parse(savedBaby);
            const diffDays = Math.ceil((new Date() - new Date(data.birth)) / (1000 * 60 * 60 * 24));
            const weekAge = Math.floor(diffDays / 7);
            const monthAge = Math.floor(diffDays / 30.436875);

            // 3. 원더윅스
            if (typeof wwList !== 'undefined') {
                const curWW = wwList.find(x => weekAge >= (x.w - 1) && weekAge <= (x.w + 1));
                if (curWW && !isDismissed('wonderweek')) {
                    banners.push(`
                        <div onclick="switchTab('toolbox', document.getElementById('nav-toolbox')); setTimeout(() => switchTool('growth'), 50);" style="position: relative; flex-shrink: 0; width: __WIDTH__; scroll-snap-align: start; background: var(--bg-card); border: 1px solid #F04452; border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; box-sizing: border-box;">
                            <button onclick="event.stopPropagation(); window.dismissSmartBanner('wonderweek');" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.05); border-radius:50%; border:none; color:#8B95A1; font-size:12px; font-weight:900; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; backdrop-filter: blur(2px);">✕</button>
                            <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                                <div style="font-size: 26px; flex-shrink: 0;">⛈️</div>
                                <div style="flex: 1; min-width: 0; text-align: left;">
                                    <div style="font-size: 12px; font-weight: 800; color: #D32F2F; margin-bottom: 4px;">원더윅스 경보</div>
                                    <div style="font-size: 15.5px; font-weight: 900; color: var(--text-m); letter-spacing: -0.3px;">현재 ${curWW.t} 구간!</div>
                                </div>
                            </div>
                            <span style="flex-shrink: 0; white-space: nowrap; background: #F04452; color: white; font-size: 13px; font-weight: 900; padding: 8px 14px; border-radius: 12px;">대처법 보기</span>
                        </div>
                    `);
                }
            }

            // 4. 예방접종
            if (typeof vaccineData !== 'undefined') {
                const curVac = vaccineData.find(v => monthAge === v.maxMonth);
                if (curVac && !isDismissed('vaccine')) {
                    banners.push(`
                        <div onclick="switchTab('toolbox', document.getElementById('nav-toolbox')); setTimeout(() => switchTool('growth'), 50);" style="position: relative; flex-shrink: 0; width: __WIDTH__; scroll-snap-align: start; background: var(--bg-card); border: 1px solid #3182F6; border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; box-sizing: border-box;">
                            <button onclick="event.stopPropagation(); window.dismissSmartBanner('vaccine');" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.05); border-radius:50%; border:none; color:#8B95A1; font-size:12px; font-weight:900; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; backdrop-filter: blur(2px);">✕</button>
                            <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                                <div style="font-size: 26px; flex-shrink: 0;">💉</div>
                                <div style="flex: 1; min-width: 0; text-align: left;">
                                    <div style="font-size: 12px; font-weight: 800; color: #1967D2; margin-bottom: 4px;">이번 달 필수 접종</div>
                                    <div style="font-size: 15.5px; font-weight: 900; color: var(--text-m); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;">${curVac.desc}</div>
                                </div>
                            </div>
                            <span style="flex-shrink: 0; white-space: nowrap; background: #1A73E8; color: white; font-size: 13px; font-weight: 900; padding: 8px 14px; border-radius: 12px;">확인하기</span>
                        </div>
                    `);
                }
            }
        }
    } catch(e) {}

    // 5. 큐브 알림
    const cubeRecords = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    const lowCube = cubeRecords.find(r => r.qty <= 2);
    if (lowCube && !isDismissed('cube')) {
        banners.push(`
            <div onclick="switchTab('toolbox', document.getElementById('nav-toolbox')); setTimeout(() => switchTool('cube'), 50);" style="position: relative; flex-shrink: 0; width: __WIDTH__; scroll-snap-align: start; background: var(--bg-card); border: 1px solid #F59E0B; border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; box-sizing: border-box;">
                <button onclick="event.stopPropagation(); window.dismissSmartBanner('cube');" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.05); border-radius:50%; border:none; color:#8B95A1; font-size:12px; font-weight:900; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; backdrop-filter: blur(2px);">✕</button>
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                    <div style="font-size: 26px; flex-shrink: 0;">🧊</div>
                    <div style="flex: 1; min-width: 0; text-align: left;">
                        <div style="font-size: 12px; font-weight: 800; color: #B78103; margin-bottom: 4px;">큐브 충전 필요</div>
                        <div style="font-size: 15.5px; font-weight: 900; color: var(--text-m); letter-spacing: -0.3px;">${lowCube.name} 큐브가 ${lowCube.qty}개 남았어요!</div>
                    </div>
                </div>
                <span style="flex-shrink: 0; white-space: nowrap; background: #F59E0B; color: white; font-size: 13px; font-weight: 900; padding: 8px 14px; border-radius: 12px;">채우기</span>
            </div>
        `);
    }

    if (banners.length > 0) {
        const dynamicWidth = banners.length === 1 ? '100%' : '88%';
        const finalBanners = banners.map(b => b.replace(/__WIDTH__/g, dynamicWidth));
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px; border: none !important; outline: none !important; background: transparent !important; box-shadow: none !important;">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--text-s);">🔔 맞춤 알림 <span style="color:#3182F6">${banners.length}</span></div>
                ${banners.length > 1 ? `<div style="font-size: 11px; font-weight: 700; color: var(--text-s); background: var(--bg-sub); padding: 2px 8px; border-radius: 10px;">옆으로 넘겨보세요 👉</div>` : ''}
            </div>
            <div style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 12px; padding-bottom: 8px; scrollbar-width: none; border: none !important; outline: none !important; background: transparent !important; box-shadow: none !important;">
                ${finalBanners.join('')}
            </div>
        `;
        container.style.display = 'block';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}
window.updateSmartBanner = updateSmartBanner; // 명시적 등록

// ==========================================
// 👨‍⚕️ 소아과 진료 브리핑 리포트 엔진 (복사 기능 탑재 완료!)
// ==========================================
window.openPediatricianReport = function() {
    let records = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    if(records.length === 0) {
        return alert("아직 기록된 체온/투약 데이터가 없습니다. 건강한 상태네요! 🌿");
    }
    
    let weight = localStorage.getItem('tosil_latest_weight') || '미입력';
    let recordHtml = '<div class="box-sub" style="max-height: 350px; overflow-y: auto; padding:16px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; gap:12px;">';
    
    records.forEach(r => {
        let pillText = '<span style="color:#8B95A1; font-weight:700;">약 미복용</span>';
        if (r.type === 'red') {
            pillText = '<span style="color:#FF4B2B; font-weight:900;">🔴 아세트아미노펜 (빨강)</span>';
        } else if (r.type === 'blue') {
            pillText = '<span style="color:#3182F6; font-weight:900;">🔵 이부/덱시부프로펜 (파랑)</span>';
        }
        
        let symText = (r.symptoms && r.symptoms.length > 0) ? `<div style="margin-top:6px; font-size:11.5px; color:#6B7684; background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:6px; display:inline-block;">🚨 증상: ${r.symptoms.join(', ')}</div>` : '';
        let tempStyle = r.temp >= 38.0 ? 'color:#E32636; font-weight:900; font-size:16px;' : 'color:var(--text-m); font-weight:800; font-size:15px;';
        
        recordHtml += `
            <div style="border-bottom:1px dashed var(--border); padding-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="color:var(--text-s); font-weight:800; font-size:13px;">⏱️ ${r.time}</span>
                    <span style="${tempStyle}">${r.temp}℃</span>
                </div>
                <div style="font-size:13px;">${pillText}</div>
                ${symText}
            </div>
        `;
    });
    recordHtml += '</div>';

    const body = document.getElementById('modal-dynamic-body');
    if(!body) return;

    // 모달 내부 HTML (복사 버튼 추가 및 하단 여백 보정 완료)
    body.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 36px; margin-bottom: 8px;">👨‍⚕️</div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900; color: var(--text-m);">소아과 진료 브리핑</h3>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: var(--text-s); line-height: 1.5;">
                의사 선생님께 스마트폰을 이대로 보여주세요.<br>최근 체중과 투약 기록이 요약되어 있습니다.
            </p>
        </div>
        
        <div class="box-sub" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-radius: 16px; margin-bottom: 16px; border: 1px solid var(--border);">
            <span style="color: var(--text-s); font-weight: 800; font-size: 14px;"> 최근 계측 체중</span>
            <span style="color: var(--text-m); font-weight: 900; font-size: 20px;">${weight}${weight !== '미입력' ? ' <span style="font-size:14px; color:var(--text-s);">kg</span>' : ''}</span>
        </div>

        <div class="box-main" style="border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size: 13px; font-weight: 800; color: var(--text-s); margin-bottom: 12px; border-bottom: 1px dashed var(--border); padding-bottom: 12px;">
                📊 최근 타임라인 요약
            </div>
            <div style="max-height: 250px; overflow-y: auto;">
                ${recordHtml}
            </div>
        </div>

        <!-- 수정된 하단 액션 버튼 영역 -->
        <div style="display: flex; gap: 10px;">
            <button style="flex: 1.5; padding: 16px; border-radius: 16px; background: #E8F3FF; color: #3182F6; font-weight: 900; font-size: 15px; border: none; cursor: pointer; transition: 0.2s; white-space: nowrap;" onclick="window.copySymptomMemo()">
                📋 병원 예약용 증상 복사
            </button>
            <button style="flex: 1; padding: 16px; border-radius: 16px; background: #F2F5F8; color: #4E5968; font-weight: 800; font-size: 15px; border: none; cursor: pointer; transition: 0.2s;" onclick="closeFestivalModalForce()">
                닫기
            </button>
        </div>
        <!-- 📱 모바일 하단 잘림 방지용 투명 여백 -->
        <div style="height: 20px; width: 100%;"></div>
    `;

    const modalWrap = document.getElementById('premium-modal');
    if(modalWrap) modalWrap.style.display = 'flex';
};

// 🏥 병원 예약용 증상 복사 함수 (이것도 같이 넣어주세요!)
window.copySymptomMemo = function() {
    let records = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    let weight = localStorage.getItem('tosil_latest_weight') || '미입력';
    
    if(records.length === 0) return window.showToast('⚠️ 복사할 진료 기록이 없습니다.');
    
    let latest = records[0];
    let pillName = latest.type === 'red' ? '아세트아미노펜(빨강)' : '이부프로펜(파랑)';
    let symp = (latest.symptoms && latest.symptoms.length > 0) ? latest.symptoms.join(', ') : '특이증상 없음';
    
    let text = `[증상요약]\n- 최근 체온: ${latest.temp}도\n- 복용 약: ${pillName}\n- 몸무게: ${weight}kg\n- 동반 증상: ${symp}`;
    
    navigator.clipboard.writeText(text).then(() => {
        window.showToast("📋 진료 접수용 메모가 복사되었어요!<br>예약 앱이나 문자에 바로 붙여넣기 하세요.");
    });
};

window.openPediatricianReport = openPediatricianReport;


// ==========================================
// 📱 원터치 육아 트래커 엔진 (바텀시트 + 대시보드 완벽 통합본)
// ==========================================
window.trackerState = { type: '', subType: '', status: '', dateOffset: 0 }; // 👈 dateOffset 추가됨
window.editingTrackerId = null;

// 🌟 [신규] 어제/오늘 토글 스위치 엔진
window.setTrackerDateOffset = function(offset) {
    window.trackerState.dateOffset = offset;
    
    const btnToday = document.getElementById('btn-date-today');
    const btnYest = document.getElementById('btn-date-yest');
    
    if(!btnToday || !btnYest) return;
    
    // 📱 진동 피드백
    if (navigator.vibrate) navigator.vibrate(10);
    
    //  스위치 UI 변경
    if (offset === 0) {
        btnToday.style.background = '#FFF';
        btnToday.style.color = '#191F28';
        btnToday.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnToday.style.fontWeight = '900';
        
        btnYest.style.background = 'transparent';
        btnYest.style.color = '#8B95A1';
        btnYest.style.boxShadow = 'none';
        btnYest.style.fontWeight = '800';
    } else {
        btnYest.style.background = '#FFF';
        btnYest.style.color = '#191F28';
        btnYest.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnYest.style.fontWeight = '900';
        
        btnToday.style.background = 'transparent';
        btnToday.style.color = '#8B95A1';
        btnToday.style.boxShadow = 'none';
        btnToday.style.fontWeight = '800';
    }
};

// 1. 버튼 클릭 시 상태 저장 (나머지는 회색, 누른 것만 컬러풀하게!)
window.selectTrackerBtn = function(btn, category) {
    const siblings = btn.parentElement.children;
    
    // 🚨 똥 색깔 버튼 로직 완벽 구현 (수정 모달창 전용 흑백 필터 + 황금변 문구 완벽 추가!)
    if (category.includes('status_')) {
        const warningArea = document.getElementById('poop-warning-msg');
        
        // 1단계: 모든 형제 버튼을 흑백으로 죽이기
        for(let i=0; i<siblings.length; i++) {
            siblings[i].style.setProperty('transform', 'scale(1)', 'important');
            siblings[i].style.setProperty('box-shadow', 'none', 'important');
            siblings[i].style.setProperty('opacity', '0.35', 'important'); // 흐리게
            siblings[i].style.setProperty('filter', 'grayscale(100%)', 'important'); // 완전 흑백
            siblings[i].style.setProperty('border', 'none', 'important');
            if(siblings[i].innerText.includes('흰')) {
                siblings[i].style.setProperty('border', '1px solid #E5E8EB', 'important');
            }
        }
        
        // 2단계: 클릭한 버튼만 활성화 (흑백 필터 풀고 원색 복구!)
        btn.style.setProperty('transform', 'scale(1.05)', 'important');
        btn.style.setProperty('box-shadow', '0 4px 12px rgba(0,0,0,0.2)', 'important');
        btn.style.setProperty('opacity', '1', 'important');
        btn.style.setProperty('filter', 'grayscale(0%)', 'important'); // 원색 부활!
        btn.style.setProperty('border', '2px solid #191F28', 'important'); 

        let statusTxt = '';
        let warningTxt = '🚨 단순 참고용: 평소와 다르다면 반드시 전문의의 진료를 받으세요.';
        let warningColor = '#8B95A1';
        let warningBg = 'transparent';

        // 💡 핵심 로직: 현재 아기의 수유 단계 가져오기
        const feedingStage = localStorage.getItem('tosil_feedingStage') || '모유/분유';
        const isSolidFood = feedingStage.includes('이유식');

        // 3단계: 클릭한 버튼에 맞는 고유 컬러 입히기 및 경고문 설정
        if (category === 'status_golden') { 
            btn.style.setProperty('background', '#FBBF24', 'important'); btn.style.setProperty('color', '#000', 'important'); statusTxt = '황금색'; 
            // 🌟 제가 빼먹었던 황금변 문구 추가!!
            warningTxt = '🟢 완벽한 황금 변입니다!<br>아기의 소화 상태가 아주 훌륭하네요.';
            warningColor = '#00B37A'; warningBg = '#E6F7F2';
        }
        else if (category === 'status_green') { 
            btn.style.setProperty('background', '#4ADE80', 'important'); btn.style.setProperty('color', '#FFF', 'important'); statusTxt = '녹색'; 
            warningTxt = '🟢 지극히 정상입니다!<br>담즙, 철분 분유 또는 녹색 채소의 영향일 수 있습니다.';
            warningColor = '#00B37A'; warningBg = '#E6F7F2';
        }
        else if (category === 'status_brown') { 
            btn.style.setProperty('background', '#B45309', 'important'); btn.style.setProperty('color', '#FFF', 'important'); statusTxt = '갈색'; 
            // 🚨 이유식 여부에 따른 분기! (대표님이 우려하신 부분: 완벽 방어되어 있습니다!)
            if (isSolidFood) {
                warningTxt = '🟢 건강한 갈색 변입니다!<br>이유식을 먹으면서 어른처럼 변이 짙어지는 자연스러운 과정입니다.';
                warningColor = '#00B37A'; warningBg = '#E6F7F2';
            } else {
                warningTxt = '⚠️ 수분 부족 / 변비 의심!<br>모유/분유만 먹는데 짙은 갈색에 딱딱하다면 수분 부족일 수 있습니다.';
                warningColor = '#D32F2F'; warningBg = '#FFF0F1';
            }
        }
        else if (category === 'status_white') { 
            btn.style.setProperty('background', '#FFFFFF', 'important'); btn.style.setProperty('color', '#191F28', 'important'); statusTxt = '흰/회색';
            warningTxt = '🚨 소아과 방문 요망! 담도폐쇄증이 의심될 수 있는 색상입니다.';
            warningColor = '#D32F2F'; warningBg = '#FFF0F1';
        }
        else if (category === 'status_red') { 
            btn.style.setProperty('background', '#EF4444', 'important'); btn.style.setProperty('color', '#FFF', 'important'); statusTxt = '붉은색';
            warningTxt = '🚨 혈변 주의! 피가 섞여 나왔을 수 있습니다. 사진을 찍고 소아과 진료를 권장합니다.';
            warningColor = '#D32F2F'; warningBg = '#FFF0F1';
        }
        else if (category === 'status_black') { 
            btn.style.setProperty('background', '#1F2937', 'important'); btn.style.setProperty('color', '#FFF', 'important'); statusTxt = '검은색';
            warningTxt = '🚨 위장 출혈 의심! 위나 장 위쪽 출혈로 검게 변했을 수 있습니다.';
            warningColor = '#D32F2F'; warningBg = '#FFF0F1';
        }
        
        window.trackerState.status = statusTxt;
        
        // 4단계: 경고 메시지 창 업데이트 
        if(warningArea) {
            warningArea.innerHTML = warningTxt;
            warningArea.style.color = warningColor;
            warningArea.style.background = warningBg;
            warningArea.style.padding = '8px 12px'; // 황금, 녹색일 때도 예쁘게 박스 나오도록 고정!
            warningArea.style.borderRadius = '8px';
        }
        return; 
    }

    // 일반 버튼들 (소변, 대변, 분유 등) 리셋 및 활성화 (이건 기존 코드 그대로)
    for(let i=0; i<siblings.length; i++) {
        siblings[i].style.setProperty('background', 'var(--bg-card)', 'important');
        siblings[i].style.setProperty('color', 'var(--text-s)', 'important');
        siblings[i].style.setProperty('border', '1px solid var(--border)', 'important');
    }

    if (category.includes('feed') || category.includes('breast')) {
        btn.style.setProperty('background', '#F0F7FF', 'important');
        btn.style.setProperty('color', '#3182F6', 'important');
        btn.style.setProperty('border', '1px solid #3182F6', 'important');
    } else if (category.includes('diaper_pee')) {
        btn.style.setProperty('background', '#EBF8FF', 'important');
        btn.style.setProperty('color', '#3182F6', 'important');
        btn.style.setProperty('border', '1px solid #3182F6', 'important');
    } else if (category.includes('diaper_poop')) {
        btn.style.setProperty('background', '#FFF0F1', 'important');
        btn.style.setProperty('color', '#F04452', 'important');
        btn.style.setProperty('border', '1px solid #F04452', 'important');
    } else if (category === 'diaper_both' || category === 'sleep_night') {
        btn.style.setProperty('background', '#F3E8FF', 'important');
        btn.style.setProperty('color', '#7C3AED', 'important');
        btn.style.setProperty('border', '1px solid #C4B5FD', 'important');
    } else if (category === 'sleep_day') {
        btn.style.setProperty('background', '#FFF9E6', 'important');
        btn.style.setProperty('color', '#B78103', 'important');
        btn.style.setProperty('border', '1px solid #FFE58F', 'important');
    }

    if (category === 'feed') {
        window.trackerState.subType = btn.innerText.replace(/[^가-힣]/g, '');
        const mlArea = document.getElementById('feed-ml-area');
        const breastArea = document.getElementById('feed-breast-area');
        if (window.trackerState.subType === '모유') {
            if(mlArea) mlArea.style.display = 'none';
            if(breastArea) breastArea.style.display = 'block';
        } else {
            if(mlArea) mlArea.style.display = 'block';
            if(breastArea) breastArea.style.display = 'none';
            window.trackerState.status = '';
        }
    } else if (category === 'breast_left') {
        window.trackerState.status = '왼쪽';
    } else if (category === 'breast_right') {
        window.trackerState.status = '오른쪽';
    }
    else if (category === 'diaper_pee') {
        window.trackerState.subType = '소변';
        const statusArea = document.getElementById('diaper-status-area');
        if(statusArea) statusArea.style.display = 'none';
    } else if (category === 'diaper_poop') {
        window.trackerState.subType = '대변';
        const statusArea = document.getElementById('diaper-status-area');
        if(statusArea) statusArea.style.display = 'block';
    } else if (category === 'diaper_both') {
        window.trackerState.subType = '소변+대변';
        const statusArea = document.getElementById('diaper-status-area');
        if(statusArea) statusArea.style.display = 'block';
    }
    else if (category === 'sleep_day') window.trackerState.subType = '낮잠';
    else if (category === 'sleep_night') window.trackerState.subType = '밤잠';
};

// 🌟 바텀 시트 열기 (드럼 피커 & 날짜 계산 연동)
window.openTrackerSheet = function(type, editId = null, preSelect = null) {
    window.editingTrackerId = (typeof editId === 'string') ? editId : null;
    window.trackerState.type = type; 
    window.trackerState.subType = ''; 
    window.trackerState.status = '';
    window.trackerState.dateOffset = 0; // 기본값 오늘
    
    const overlay = document.getElementById('tracker-sheet-overlay');
    const content = document.getElementById('tracker-sheet-content');
    const title = document.getElementById('tracker-sheet-title');
    const body = document.getElementById('tracker-sheet-body');
    const saveBtn = document.getElementById('btn-tracker-save');
    if (!overlay || !content) return;

    content.style.backgroundColor = 'var(--bg-card)';
    if(title) title.style.color = 'var(--text-m)';
    if(saveBtn) { saveBtn.style.backgroundColor = 'var(--primary)'; saveBtn.style.color = '#FFF'; saveBtn.style.border = 'none'; }

    overlay.style.display = 'block'; 
    setTimeout(() => { content.style.transform = 'translateY(0)'; }, 10);

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let targetTime = currentTimeStr;

    // 💡 수정 모드일 때 기존 데이터 불러와서 날짜 오프셋(어제인지 오늘인지) 계산!
    if (window.editingTrackerId) {
        let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
        let recordToEdit = records.find(r => r.id === window.editingTrackerId);
        if (recordToEdit) {
            targetTime = recordToEdit.time;
            const recDate = new Date(recordToEdit.timestamp);
            const today = new Date();
            today.setHours(0,0,0,0);
            recDate.setHours(0,0,0,0);
            
            // 기록일이 며칠 전인지 계산해서 어제(-1)/오늘(0) 셋팅
            const daysAgo = Math.round((today - recDate) / (1000 * 60 * 60 * 24));
            window.trackerState.dateOffset = -daysAgo; 
        }
    }

    // 🌟 통계(과거 기록) 수정할 때도 버튼 무조건 보이게 수정!
    // 단, 3일 전 등 완전 과거 기록 수정 시에는 어제/오늘 둘 다 불 꺼진 상태로 둠
    const isPastRecord = window.trackerState.dateOffset < -1;
    const dateToggleDisplay = isPastRecord ? 'none' : 'flex';
    
    // 💡 먼 과거 기록을 수정할 땐 "00월 00일 기록 수정 중" 이라는 예쁜 뱃지를 띄워줍니다!
    let pastDateBadgeHtml = '';
    if (isPastRecord && window.editingTrackerId) {
        let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
        let recordToEdit = records.find(r => r.id === window.editingTrackerId);
        if (recordToEdit) {
            const d = new Date(recordToEdit.timestamp);
            pastDateBadgeHtml = `
                <div style="display:flex; justify-content:center; margin-bottom:16px;">
                    <div style="background:#F2F5F8; color:#4E5968; font-size:12px; font-weight:800; padding:6px 16px; border-radius:20px; border:1px solid #E5E8EB;">
                        🗓️ ${d.getMonth() + 1}월 ${d.getDate()}일 기록 수정 중
                    </div>
                </div>
            `;
        }
    }
    
    const todayBg = window.trackerState.dateOffset === 0 ? '#FFF' : 'transparent';
    const todayColor = window.trackerState.dateOffset === 0 ? '#191F28' : '#8B95A1';
    const todayWeight = window.trackerState.dateOffset === 0 ? '900' : '800';
    const todayShadow = window.trackerState.dateOffset === 0 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none';
    
    const yestBg = window.trackerState.dateOffset === -1 ? '#FFF' : 'transparent';
    const yestColor = window.trackerState.dateOffset === -1 ? '#191F28' : '#8B95A1';
    const yestWeight = window.trackerState.dateOffset === -1 ? '900' : '800';
    const yestShadow = window.trackerState.dateOffset === -1 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none';

    let timeLabel = type === 'sleep' ? "언제 잠들었나요?" : "기록 시간 (스와이프하여 시간 수정)";
    
    const timeInputHtml = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display:${dateToggleDisplay}; justify-content:center; margin-bottom:16px;">
                <div style="background:var(--bg-sub); border-radius:12px; padding:4px; display:inline-flex; border:1px solid var(--border);">
                    <button id="btn-date-today" onclick="window.setTrackerDateOffset(0)" style="padding:6px 20px; border-radius:10px; border:none; font-weight:${todayWeight}; font-size:13.5px; cursor:pointer; background:${todayBg}; color:${todayColor}; box-shadow:${todayShadow}; transition:0.2s;">오늘</button>
                    <button id="btn-date-yest" onclick="window.setTrackerDateOffset(-1)" style="padding:6px 20px; border-radius:10px; border:none; font-weight:${yestWeight}; font-size:13.5px; cursor:pointer; background:${yestBg}; color:${yestColor}; box-shadow:${yestShadow}; transition:0.2s;">어제</button>
                </div>
            </div>
            
            ${pastDateBadgeHtml}

            <div style="font-size:12.5px; font-weight:800; color:var(--text-s); margin-bottom:12px;">${timeLabel}</div>
            
            <style>
                .drum-picker::-webkit-scrollbar { display: none; }
                .drum-picker { -ms-overflow-style: none; scrollbar-width: none; }
            </style>

            <div style="display:flex; justify-content:center; align-items:center; height: 150px; position:relative; overflow:hidden; background:var(--bg-sub); border-radius:20px; box-shadow:inset 0 2px 6px rgba(0,0,0,0.02);">
                <div style="position:absolute; top:50%; left:20px; right:20px; height:44px; transform:translateY(-50%); background:rgba(49, 130, 246, 0.08); border-radius:12px; pointer-events:none; border: 1px solid rgba(49, 130, 246, 0.15);"></div>
                <div id="picker-hour" class="drum-picker" style="height:100%; overflow-y:auto; scroll-snap-type:y mandatory; width:80px; text-align:center; display:flex; flex-direction:column; scroll-behavior: smooth;"></div>
                <div style="font-size:22px; font-weight:900; color:var(--text-s); margin:0 10px; z-index:1; padding-bottom:4px;">:</div>
                <div id="picker-minute" class="drum-picker" style="height:100%; overflow-y:auto; scroll-snap-type:y mandatory; width:80px; text-align:center; display:flex; flex-direction:column; scroll-behavior: smooth;"></div>
            </div>
            
            <input type="hidden" id="v-tracker-time" value="${targetTime}" onchange="${type === 'sleep' ? 'window.calcSleepFromTimes()' : ''}">
        </div>
    `;

    // ⬇️ 여기서부터는 원래 있던 if (type === 'feed') ... 코드가 이어지면 됩니다!
    if (type === 'feed') {
        title.innerHTML = '🍼 맘마 기록하기';
        
        // 🌟 [복구 완료] 최근 수유량 분석 로직
        let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
        let feedRecords = records.filter(r => r.type === 'feed' && r.subType !== '모유' && r.subType !== '이유식' && r.amount > 0);
        let uniqueAmounts = [];
        for (let r of feedRecords) {
            if (!uniqueAmounts.includes(r.amount)) uniqueAmounts.push(r.amount);
            if (uniqueAmounts.length >= 2) break;
        }
        let recentFeedAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : 160;
        
// 🌟 [수정 완료] 분유 퀵버튼 생성 (다크모드 대응 class="quick-btn" 추가)
        let quickButtonsHtml = '';
        if (uniqueAmounts.length === 0) {
            quickButtonsHtml = `
                <button type="button" class="quick-btn active" onclick="window.setFeedAmount(160)" style="flex-shrink: 0; padding: 10px 14px; background: #EBF4FF; color: #3182F6; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">🍼 160ml</button>
                <button type="button" class="quick-btn" onclick="window.setFeedAmount(200)" style="flex-shrink: 0; padding: 10px 14px; background: #F2F5F8; color: #4E5968; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">200ml</button>
            `;
        } else if (uniqueAmounts.length === 1) {
            quickButtonsHtml = `<button type="button" class="quick-btn active" onclick="window.setFeedAmount(${uniqueAmounts[0]})" style="flex-shrink: 0; padding: 10px 14px; background: #EBF4FF; color: #3182F6; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">🍼 늘 먹던 ${uniqueAmounts[0]}ml</button>`;
        } else {
            quickButtonsHtml = `
                <button type="button" class="quick-btn active" onclick="window.setFeedAmount(${uniqueAmounts[0]})" style="flex-shrink: 0; padding: 10px 14px; background: #EBF4FF; color: #3182F6; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">🍼 ${uniqueAmounts[0]}ml</button>
                <button type="button" class="quick-btn" onclick="window.setFeedAmount(${uniqueAmounts[1]})" style="flex-shrink: 0; padding: 10px 14px; background: #F2F5F8; color: #4E5968; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">${uniqueAmounts[1]}ml</button>
            `;
        }
        
        let milkHtml = `
            <div id="milk-input-area">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="btn-main" onclick="window.selectTrackerBtn(this, 'feed')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s;">🍼 분유</button>
                    <button class="btn-main" onclick="window.selectTrackerBtn(this, 'feed')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s;">🤱 모유</button>
                    <button class="btn-main" onclick="window.selectTrackerBtn(this, 'feed')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s;">🍼 유축</button>
                </div>
                <div id="feed-ml-area" style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: var(--text-s); margin-bottom: 8px;">먹은 양 (ml)</div>
                    <div style="display: flex; justify-content: center; align-items: baseline; gap: 4px; margin-bottom: 16px;">
                        <input type="number" id="v-feed-amount" placeholder="${recentFeedAmount}" style="font-size: 44px; font-weight: 900; color: var(--text-m); border: none; outline: none; background: transparent; text-align: center; width: 140px; padding: 0; margin: 0; border-bottom: 3px solid var(--border); border-radius: 0; transition: 0.3s;">
                        <span style="font-size: 18px; font-weight: 800; color: var(--text-s);">ml</span>
                    </div>
                    <!-- 🌟 [복구 완료] 분유 +10/-10 및 퀵버튼 영역 -->
                    <div style="display: flex; justify-content: center; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                        ${quickButtonsHtml}
                        <div style="width: 1px; background: var(--border); margin: 0 4px;"></div>
                        <button type="button" onclick="window.adjustFeedAmount(10)" style="flex-shrink: 0; padding: 10px 12px; background: var(--bg-card); color: var(--text-m); border: 1px solid var(--border); border-radius: 12px; font-weight: 800; font-size: 13.5px; cursor: pointer;">+10</button>
                        <button type="button" onclick="window.adjustFeedAmount(-10)" style="flex-shrink: 0; padding: 10px 12px; background: var(--bg-card); color: var(--text-m); border: 1px solid var(--border); border-radius: 12px; font-weight: 800; font-size: 13.5px; cursor: pointer;">-10</button>
                    </div>
                </div>
                <div id="feed-breast-area" style="display: none; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: var(--text-s); margin-bottom: 12px;">어느 쪽을 먹였나요?</div>
                    <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 20px;">
                        <button class="btn-main" onclick="window.selectTrackerBtn(this, 'breast_left')" style="width: 110px; padding: 14px 0; white-space: nowrap; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s; font-size: 14.5px;">왼쪽 (L)</button>
                        <button class="btn-main" onclick="window.selectTrackerBtn(this, 'breast_right')" style="width: 110px; padding: 14px 0; white-space: nowrap; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s; font-size: 14.5px;">오른쪽 (R)</button>
                    </div>
                    <div style="font-size: 13px; font-weight: 800; color: var(--text-s); margin-bottom: 8px;">수유 시간 (분)</div>
                    <div style="display: flex; justify-content: center; align-items: baseline; gap: 4px;">
                        <input type="number" id="v-breast-amount" placeholder="15" style="font-size: 40px; font-weight: 900; color: var(--text-m); border: none; outline: none; background: transparent; text-align: center; width: 140px; padding: 0; margin: 0; border-bottom: 2px solid var(--border); border-radius: 0;">
                        <span style="font-size: 18px; font-weight: 800; color: var(--text-s);">분</span>
                    </div>
                </div>
            </div>
        `;

        let foodHtml = `
            <div id="food-input-area" style="display: none; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 13px; font-weight: 800; color: var(--text-s); margin-bottom: 8px;">먹은 이유식 양 (ml/g)</div>
                <div style="display: flex; justify-content: center; align-items: baseline; gap: 4px; margin-bottom: 16px;">
                    <input type="number" id="v-food-amount" placeholder="60" style="font-size: 44px; font-weight: 900; color: var(--text-m); border: none; outline: none; background: transparent; text-align: center; width: 140px; padding: 0; margin: 0; border-bottom: 3px solid var(--border); border-radius: 0; transition: 0.3s;">
                    <span style="font-size: 18px; font-weight: 800; color: var(--text-s);">ml</span>
                </div>
                <!-- 이유식 미세조절 버튼 -->
                <div style="display: flex; justify-content: center; gap: 8px;">
                    <button type="button" onclick="window.adjustFoodAmount(10)" style="padding: 10px 16px; background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer;">+10</button>
                    <button type="button" onclick="window.adjustFoodAmount(-10)" style="padding: 10px 16px; background: rgba(240, 68, 82, 0.1); color: #F04452; border: 1px solid rgba(240, 68, 82, 0.2); border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer;">-10</button>
                </div>
            </div>
        `;

        body.innerHTML = timeInputHtml + `
            <div class="mamma-toggle-container">
                <input type="radio" id="tab-milk" name="mamma-type" value="milk" checked onchange="window.toggleMammaTab('milk')">
                <label for="tab-milk">🍼 분유/모유</label>
                
                <input type="radio" id="tab-food" name="mamma-type" value="food" onchange="window.toggleMammaTab('food')">
                <label for="tab-food">🥄 이유식</label>
                <div class="toggle-slider"></div>
            </div>
            ${milkHtml}
            ${foodHtml}
        `;
        if(saveBtn) saveBtn.style.display = 'block';
    } 
    // ... (이하 수면, 기저귀 렌더링 로직은 기존 코드 그대로 유지됩니다!) ...
    else if (type === 'sleep') {
        title.innerHTML = window.editingTrackerId ? '💤 수면 기록 수정' : '💤 수면 기록하기';
        body.innerHTML = `
            <!-- 🌟 수면 트래커 전용: 어제/오늘 토글 스위치 추가! -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display:${dateToggleDisplay}; justify-content:center; margin-bottom:16px;">
                    <div style="background:var(--bg-sub); border-radius:12px; padding:4px; display:inline-flex; border:1px solid var(--border);">
                        <button id="btn-date-today" onclick="window.setTrackerDateOffset(0)" style="padding:6px 20px; border-radius:10px; border:none; font-weight:${todayWeight}; font-size:13.5px; cursor:pointer; background:${todayBg}; color:${todayColor}; box-shadow:${todayShadow}; transition:0.2s;">오늘 시작</button>
                        <button id="btn-date-yest" onclick="window.setTrackerDateOffset(-1)" style="padding:6px 20px; border-radius:10px; border:none; font-weight:${yestWeight}; font-size:13.5px; cursor:pointer; background:${yestBg}; color:${yestColor}; box-shadow:${yestShadow}; transition:0.2s;">어제 시작</button>
                    </div>
                </div>
                ${pastDateBadgeHtml}

                <div style="font-size:12px; font-weight:800; color:var(--text-s); margin-bottom:6px;">언제 자고 언제 일어났나요?</div>
                <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
                    <input type="time" id="v-tracker-time" value="${currentTimeStr}" onchange="window.calcSleepFromTimes()" style="flex:1; text-align:center; border:1px solid var(--border); background:var(--bg-sub); padding:8px 10px; border-radius:12px; font-size:18px; font-weight:900; color:var(--text-m); outline:none;">
                    <span style="font-size:18px; font-weight:900; color:var(--text-s);">~</span>
                    <input type="time" id="v-sleep-end-time" value="${currentTimeStr}" onchange="window.calcSleepFromTimes()" style="flex:1; text-align:center; border:1px solid var(--border); background:var(--bg-sub); padding:8px 10px; border-radius:12px; font-size:18px; font-weight:900; color:var(--text-m); outline:none;">
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn-main" onclick="window.selectTrackerBtn(this, 'sleep_day')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s;">☀️ 낮잠</button>
                <button class="btn-main" onclick="window.selectTrackerBtn(this, 'sleep_night')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s;">🌙 밤잠</button>
            </div>
            <div style="background:var(--bg-sub); padding:18px; border-radius:16px; margin-bottom:20px; border:1px solid var(--border); text-align:center;">
                <div style="font-size:12.5px; font-weight:800; color:#3182F6; margin-bottom:8px;">아기가 지금 막 일어났나요?</div>
                <button onclick="window.calcSleepToNow()" style="width:100%; padding:14px; background:var(--bg-card); color:#3182F6; border:1px solid var(--border); border-radius:12px; font-size:15px; font-weight:900; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.05); transition:0.2s;">
                    ⏰ 방금 깼어요! (알아서 계산)
                </button>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--text-s); margin-bottom: 12px;">총 수면 시간</div>
                <div style="display: flex; justify-content: center; align-items: baseline; gap: 6px;">
                    <input type="number" id="v-sleep-hours" value="0" oninput="window.calcEndTimeFromAmount()" style="font-size: 40px; font-weight: 900; color: var(--text-m); border: none; outline: none; background: transparent; text-align: center; width: 70px; padding: 0; margin: 0; border-bottom: 3px solid var(--border); border-radius: 0; transition:0.3s;">
                    <span style="font-size: 18px; font-weight: 800; color: var(--text-s);">시간</span>
                    <input type="number" id="v-sleep-mins" value="0" oninput="window.calcEndTimeFromAmount()" style="font-size: 40px; font-weight: 900; color: var(--text-m); border: none; outline: none; background: transparent; text-align: center; width: 70px; padding: 0; margin: 0; border-bottom: 3px solid var(--border); border-radius: 0; transition:0.3s;">
                    <span style="font-size: 18px; font-weight: 800; color: var(--text-s);">분</span>
                </div>
              <input type="hidden" id="v-sleep-amount" value="0">
                <div style="margin-top: 14px;">
                    <span style="background:var(--bg-sub); color:var(--text-m); font-size:11.5px; font-weight:800; padding:6px 12px; border-radius:20px; border:1px solid var(--border);">💡 자는 중이라면 시간을 똑같이 두고 [저장] 누르세요!</span>
                </div>
            </div>
            `;
        if(saveBtn) saveBtn.style.display = 'block';
        setTimeout(() => {
            const btns = document.querySelectorAll('#tracker-sheet-body .btn-main');
            btns.forEach(btn => { if(btn.innerText.includes('낮잠') && !window.editingTrackerId) window.selectTrackerBtn(btn, 'sleep_day'); });
            
            // =====================================
            // 🚨 [추가] 시트가 열리면 스와이프 휠 세팅!
            // =====================================
            let targetTime = currentTimeStr;
            if (window.editingTrackerId) {
                let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
                let recordToEdit = records.find(r => r.id === window.editingTrackerId);
                if (recordToEdit) targetTime = recordToEdit.time;
            }
            window.initDrumPicker(targetTime); // 엔진 가동!
            // =====================================

        }, 50);
    }
    // 🚨 대변 색깔 로직이 완벽하게 들어간 기저귀 바텀시트
    else if (type === 'diaper') {
        title.innerHTML = '💩 기저귀 기록하기';
        // 💡 모든 색상 버튼의 기본 스타일을 "회색 배경(#F2F5F8), 회색 글씨(#8B95A1)"로 통일했습니다!
        body.innerHTML = timeInputHtml + `
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <button class="btn-main" onclick="window.selectTrackerBtn(this, 'diaper_pee')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s; padding:12px 0;">💧 소변</button>
                <button class="btn-main" onclick="window.selectTrackerBtn(this, 'diaper_poop')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s; padding:12px 0;">💩 대변</button>
                <button class="btn-main" onclick="window.selectTrackerBtn(this, 'diaper_both')" style="flex: 1; background: var(--bg-card); color: var(--text-s); border: 1px solid var(--border); box-shadow: none; margin:0; transition:0.2s; padding:12px 0;">💩 둘 다</button>
            </div>
            
            <div id="diaper-status-area" style="display:none; margin-bottom:10px;">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-s); margin-bottom: 10px; text-align:left;">어떤 색깔인가요?</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: space-between;">
                    <button onclick="window.selectTrackerBtn(this, 'status_golden')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">황금</button>
                    <button onclick="window.selectTrackerBtn(this, 'status_green')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">녹색</button>
                    <button onclick="window.selectTrackerBtn(this, 'status_brown')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">갈색</button>
                    <button onclick="window.selectTrackerBtn(this, 'status_white')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">흰/회색</button>
                    <button onclick="window.selectTrackerBtn(this, 'status_red')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">붉은색</button>
                    <button onclick="window.selectTrackerBtn(this, 'status_black')" style="flex:1; min-width:30%; padding: 12px 0; background: var(--bg-card); color: var(--text-s); border-radius: 8px; font-weight: 900; font-size: 13.5px; border: 1px solid var(--border); cursor:pointer; transition:0.2s;">검은색</button>
                </div>
                <div id="poop-warning-msg" style="font-size:10.5px; color:var(--text-s); margin-top:12px; text-align:left; font-weight:700; transition:0.3s; padding:0;">🚨 단순 참고용: 평소와 다르다면 반드시 전문의의 진료를 받으세요.</div>
            </div>
        `;
        if(saveBtn) saveBtn.style.display = 'block';
    }

    // 🚨 수정 모드일 때 기존 데이터 불러오기 로직 (이유식 수정 기능 완벽 호환!)
    if (window.editingTrackerId) {
        title.innerHTML = title.innerHTML.replace('기록하기', '수정하기');
        if(saveBtn) saveBtn.innerText = '수정 완료';
        let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
        let recordToEdit = records.find(r => r.id === window.editingTrackerId);
        
        if (recordToEdit) {
            setTimeout(() => {
                const timeInput = document.getElementById('v-tracker-time');
                if(timeInput) timeInput.value = recordToEdit.time;

                const buttons = document.querySelectorAll('#tracker-sheet-body .btn-main');
                buttons.forEach(btn => {
                    const btnText = btn.innerText.replace(/[^가-힣+]/g, ''); 
                    if (btnText === recordToEdit.subType) {
                        let cat = '';
                        if (recordToEdit.type === 'feed' && recordToEdit.subType === '모유') cat = 'feed';
                        else if (recordToEdit.type === 'feed') cat = 'feed';
                        else if (recordToEdit.type === 'diaper' && recordToEdit.subType === '소변') cat = 'diaper_pee';
                        else if (recordToEdit.type === 'diaper' && recordToEdit.subType === '대변') cat = 'diaper_poop';
                        else if (recordToEdit.type === 'diaper' && recordToEdit.subType === '소변+대변') cat = 'diaper_both';
                        if(cat) window.selectTrackerBtn(btn, cat);
                    }
                });

                // 💡 [이유식 패치] 수정 모드일 때, 이유식이면 토글을 '이유식'으로 돌려줌
                if (recordToEdit.type === 'feed' || recordToEdit.type === 'babyfood') {
                    if (recordToEdit.subType === '이유식') {
                        document.getElementById('tab-food').checked = true;
                        window.toggleMammaTab('food');
                        document.getElementById('v-food-amount').value = recordToEdit.amount;
                    } else if (recordToEdit.subType === '모유') {
                        document.getElementById('tab-milk').checked = true;
                        window.toggleMammaTab('milk');
                        document.getElementById('v-breast-amount').value = recordToEdit.amount;
                        if (recordToEdit.status === '왼쪽') window.selectTrackerBtn(document.querySelector("button[onclick*='breast_left']"), 'breast_left');
                        if (recordToEdit.status === '오른쪽') window.selectTrackerBtn(document.querySelector("button[onclick*='breast_right']"), 'breast_right');
                    } else {
                        document.getElementById('tab-milk').checked = true;
                        window.toggleMammaTab('milk');
                        const amtInput = document.getElementById('v-feed-amount');
                        if (amtInput) amtInput.value = recordToEdit.amount;
                    }
                }
                
                if (recordToEdit.type === 'sleep') {
                    const sleepAmtInput = document.getElementById('v-sleep-amount');
                    const hoursInput = document.getElementById('v-sleep-hours');
                    const minsInput = document.getElementById('v-sleep-mins');

                    if (sleepAmtInput) sleepAmtInput.value = recordToEdit.amount;
                    if (hoursInput) hoursInput.value = Math.floor(recordToEdit.amount / 60);
                    if (minsInput) minsInput.value = recordToEdit.amount % 60;
                    
                    const endInput = document.getElementById('v-sleep-end-time');
                    if (endInput && recordToEdit.amount > 0) {
                        const d = new Date(recordToEdit.timestamp + (recordToEdit.amount * 60000));
                        endInput.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                    }
                }

                if (recordToEdit.type === 'diaper' && recordToEdit.status) {
                    const colorBtns = document.querySelectorAll('#diaper-status-area button');
                    colorBtns.forEach(cBtn => {
                        if (recordToEdit.status.includes(cBtn.innerText.split('/')[0])) { 
                            let cat = '';
                            if(cBtn.innerText === '황금') cat = 'status_golden';
                            if(cBtn.innerText === '녹색') cat = 'status_green';
                            if(cBtn.innerText === '갈색') cat = 'status_brown';
                            if(cBtn.innerText === '흰/회색') cat = 'status_white';
                            if(cBtn.innerText === '붉은색') cat = 'status_red';
                            if(cBtn.innerText === '검은색') cat = 'status_black';
                            if(cat) window.selectTrackerBtn(cBtn, cat);
                        }
                    });
                }
            }, 50);
        }
    } else {
        if(saveBtn) saveBtn.innerText = '저장하기';
    }

    // ==========================================
    // 🚨 [여기에 추가!] 바텀 시트가 열릴 때 무조건 휠 엔진 가동!
    // ==========================================
    setTimeout(() => {
        let targetTime = currentTimeStr; // 기본값은 현재 시간
        
        // 수정 모드일 경우 기존에 저장된 시간 불러오기
        if (window.editingTrackerId) {
            let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
            let recordToEdit = records.find(r => r.id === window.editingTrackerId);
            if (recordToEdit) targetTime = recordToEdit.time;
        }
        
        // 🔥 [신규 패치] 홈 화면 퀵버튼으로 들어왔을 때 해당 버튼(소변/대변/둘 다) 자동 클릭!
        if (type === 'diaper' && preSelect && !window.editingTrackerId) {
            const diaperBtns = document.querySelectorAll('#tracker-sheet-body .btn-main');
            diaperBtns.forEach(btn => {
                if (btn.innerText.includes(preSelect)) {
                    let cat = '';
                    if (preSelect === '소변') cat = 'diaper_pee';
                    if (preSelect === '대변') cat = 'diaper_poop';
                    if (preSelect === '둘 다') cat = 'diaper_both';
                    if (cat) window.selectTrackerBtn(btn, cat);
                }
            });
        }

        // 화면에 창이 그려지고 난 뒤(0.08초 뒤) 엔진 스위치 ON!
        if (typeof window.initDrumPicker === 'function') {
            window.initDrumPicker(targetTime);
        }
    }, 80);
    // ==========================================
}; // <--- openTrackerSheet 함수가 끝나는 진짜 마지막 중괄호

// 💡 [이유식 패치] 토글 버튼 누를 때 화면 바뀌게 해주는 엔진
window.toggleMammaTab = function(type) {
    const milkArea = document.getElementById('milk-input-area');
    const foodArea = document.getElementById('food-input-area');
    if(type === 'food') {
        milkArea.style.display = 'none';
        foodArea.style.display = 'block';
        window.trackerState.subType = '이유식'; // 상태를 이유식으로 고정!
    } else {
        milkArea.style.display = 'block';
        foodArea.style.display = 'none';
        // 기본 분유로 돌려놓기
        window.trackerState.subType = ''; 
        const feedBtns = document.querySelectorAll('#milk-input-area .btn-main');
        if(feedBtns.length > 0) window.selectTrackerBtn(feedBtns[0], 'feed'); 
    }
};

// 💡 [이유식 패치] 이유식 용량 미세 조절 버튼 (+10, -10)
window.adjustFoodAmount = function(change) {
    const inputEl = document.getElementById('v-food-amount');
    if(inputEl) {
        let currentVal = parseInt(inputEl.value) || 0;
        let newVal = currentVal + change;
        if(newVal < 0) newVal = 0; 
        
        inputEl.value = newVal;
        
        if (navigator.vibrate) navigator.vibrate(15);
        inputEl.style.transform = 'scale(1.1)';
        setTimeout(() => { inputEl.style.transform = 'scale(1)'; }, 150);
    }
};

window.closeTrackerSheet = function() {
    const overlay = document.getElementById('tracker-sheet-overlay');
    const content = document.getElementById('tracker-sheet-content');
    if (!overlay || !content) return;
    content.style.transform = 'translateY(100%)';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
    if(window.sleepInterval) clearInterval(window.sleepInterval);
};

window.startSleepTimer = function(sleepType) {
    localStorage.setItem('tosil_sleep_start', new Date().getTime());
    localStorage.setItem('tosil_sleep_type', sleepType || '낮잠'); 
    
    // ✨ 타이머를 켰으니 시트를 닫고 홈 화면 배너를 띄웁니다!
    window.closeTrackerSheet(); 
    if (typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
    window.showToast("타이머가 시작되었습니다! 푹 자길 🌙");
};

window.stopSleepTimer = function() {
    const start = localStorage.getItem('tosil_sleep_start');
    if(!start) return;
    const end = new Date().getTime();
    const durationMins = Math.floor((end - parseInt(start)) / 60000);
    const sleepType = localStorage.getItem('tosil_sleep_type') || '낮잠'; 
    
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let record = { id: 'trk_'+now.getTime(), time: timeStr, timestamp: now.getTime(), type: 'sleep', subType: sleepType, amount: durationMins };
    
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    records.unshift(record);
    if(records.length > 100) records.pop();
    localStorage.setItem('tosil_tracker_records', JSON.stringify(records));
    
    localStorage.removeItem('tosil_sleep_start');
    localStorage.removeItem('tosil_sleep_type'); 
    window.closeTrackerSheet();
    window.updateTrackerDashboard();
};

window.saveTrackerRecord = function() {
    if(!window.trackerState.type) return;

    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    let timeStr = "";
    let timestamp = new Date().getTime();
    const timeInputEl = document.getElementById('v-tracker-time');
    
    if (window.editingTrackerId) {
        const originalRecord = records.find(r => r.id === window.editingTrackerId);
        if (originalRecord) timestamp = originalRecord.timestamp; 
    }

    if (timeInputEl && timeInputEl.value) {
        timeStr = timeInputEl.value; 
        const [hours, minutes] = timeStr.split(':');
        
        let finalDate = new Date(); // 기본값: 현재(오늘)

        if (window.editingTrackerId) {
            // 수정 모드일 때는 오프셋 무시하고 기존 원본 기록의 날짜를 그대로 유지
            const originalRecord = records.find(r => r.id === window.editingTrackerId);
            if(originalRecord) finalDate = new Date(originalRecord.timestamp);
        } else {
            // 🌟 신규 기록일 땐 사용자가 선택한 어제/오늘(-1 or 0) 오프셋을 적용!
            finalDate.setDate(finalDate.getDate() + (window.trackerState.dateOffset || 0));
        }

        finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        timestamp = finalDate.getTime();

    } else {
        const now = new Date();
        now.setDate(now.getDate() + (window.trackerState.dateOffset || 0)); // 빈칸일 때도 오프셋 방어
        timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        timestamp = now.getTime();
    }

    let recordId = window.editingTrackerId ? window.editingTrackerId : 'trk_'+new Date().getTime();
    let record = { id: recordId, time: timeStr, timestamp: timestamp, type: window.trackerState.type };

    if (window.trackerState.type === 'feed') {
        if(!window.trackerState.subType) return alert('🍼 분유, 모유, 유축 중 하나를 선택해주세요!');
        const amt = document.getElementById('v-feed-amount').value;
        if(!amt) return alert('🍼 먹은 양(ml)을 입력해주세요!');
        record.subType = window.trackerState.subType;
        record.amount = parseInt(amt);
    } 
    else if (window.trackerState.type === 'diaper') {
        if(!window.trackerState.subType) return alert('💩 소변인지 대변인지 선택해주세요!');
        record.subType = window.trackerState.subType;
        record.status = (window.trackerState.subType === '소변') ? '' : (window.trackerState.status || '');
    }
    else if (window.trackerState.type === 'sleep') {
        const amt = document.getElementById('v-sleep-amount');
        if(!amt || !amt.value) return alert('💤 수면 시간(분)을 정확히 입력해주세요!');
        record.amount = parseInt(amt.value);
        if (window.editingTrackerId) {
            const originalRecord = records.find(r => r.id === window.editingTrackerId);
            if (originalRecord) record.subType = originalRecord.subType; 
        } else {
            record.subType = '낮잠'; 
        }
    }

    if (window.editingTrackerId) {
        const idx = records.findIndex(r => r.id === window.editingTrackerId);
        if(idx !== -1) records[idx] = record;
    } else {
        records.push(record);
    }
    
    records.sort((a, b) => b.timestamp - a.timestamp);
    if(records.length > 100) records.pop();
    localStorage.setItem('tosil_tracker_records', JSON.stringify(records));

    // 🌟 바로 이 위치에 추가해 주세요!
    if (typeof window.checkFeedPlateauBreakthrough === 'function') {
        window.checkFeedPlateauBreakthrough();
    }

    window.editingTrackerId = null; 
    window.closeTrackerSheet();
    window.updateTrackerDashboard(); 
};

window.editTrackerRecord = function(id) {
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    let record = records.find(r => r.id === id);
    if (!record) return;
    
    window.openTrackerSheet(record.type, id); 
};
    
window.deleteTrackerRecord = function(id) {
    showConfirm("이 기록을 정말 삭제하시겠습니까?", async function() {
        let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
        records = records.filter(r => r.id !== id);
        
        // 👇 파트너님이 걱정하신 그 부분! 여기 안전하게 잘 들어있습니다! 👇
        if (typeof saveTrackerToFirebase === 'function') {
            await saveTrackerToFirebase(records);
            flushTrackerSync(); 
        } else {
            localStorage.setItem('tosil_tracker_records', JSON.stringify(records));
            window.updateTrackerDashboard();
        }
        
        showToast("🗑️ 기록이 깔끔하게 삭제되었습니다!");
    }, "🗑️", "삭제", "#F04452");
};

// 2. 전체 삭제 (모두 싹 지우기) - ✨ 퀄리티업 완료 ✨
window.resetTrackerRecords = function() {
    showConfirm("모든 트래커 기록을 싹 지우시겠습니까?\n(진행 중인 수면 타이머도 리셋됩니다)", async function() {
        
        localStorage.removeItem('tosil_sleep_start');
        localStorage.removeItem('tosil_sleep_type');
        
        if (typeof saveTrackerToFirebase === 'function') {
            await saveTrackerToFirebase([]);
            flushTrackerSync(); 
        } else {
            localStorage.removeItem('tosil_tracker_records');
            window.updateTrackerDashboard();
        }
        
        showToast("🧹 트래커 기록이 싹 비워졌습니다!");
        
    }, "⚠️", "전체 삭제", "#F04452");
};

window.isHistoryView = false;
window.toggleTrackerHistory = function() {
    window.isHistoryView = !window.isHistoryView;
    window.updateTrackerDashboard();
};

window.openTrackerSettings = function() {
    const feedMins = localStorage.getItem('tosil_feed_interval') || 180;
    const diaperMins = localStorage.getItem('tosil_diaper_interval') || 180;
    document.getElementById('set-feed-interval').value = Math.floor(feedMins / 60);
    document.getElementById('set-diaper-interval').value = Math.floor(diaperMins / 60);
    document.getElementById('tracker-settings-modal').style.display = 'flex';
};
window.closeTrackerSettingsForce = function() { document.getElementById('tracker-settings-modal').style.display = 'none'; };
window.closeTrackerSettings = function(e) { if(e.target.id === 'tracker-settings-modal') window.closeTrackerSettingsForce(); };

window.saveTrackerSettings = function() {
    const fHour = parseFloat(document.getElementById('set-feed-interval').value) || 3;
    const dHour = parseFloat(document.getElementById('set-diaper-interval').value) || 3;
    localStorage.setItem('tosil_feed_interval', fHour * 60);
    localStorage.setItem('tosil_diaper_interval', dHour * 60);
    window.closeTrackerSettingsForce();
    window.updateTrackerDashboard();
    alert("✅ 우리 아기 맞춤형 텀이 저장되었습니다!");
};

// 👑 [엄마 모드 고도화] 초직관적 하이엔드 트래커 대시보드 (투트랙 수면 패치)
window.updateTrackerDashboard = function() {
    const container = document.getElementById('tracker-stats-container');
    if(!container) return;

    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    const now = new Date();
    const nowTime = now.getTime(); 
    
    const getStatusColor = (status) => {
        if(!status) return 'var(--text-m)';
        if(status.includes('황금')) return '#F59E0B';
        if(status.includes('녹색') || status.includes('녹변')) return '#22C55E';
        if(status.includes('갈색')) return '#B45309';
        if(status.includes('흰') || status.includes('회색')) return '#9CA3AF';
        if(status.includes('붉은') || status.includes('혈변')) return '#EF4444';
        if(status.includes('검은')) return '#374151';
        return 'var(--text-m)';
    };

    // --- 히스토리 뷰 (펼쳐보기) 렌더링 시작 ---
     if (window.isHistoryView) {
        if(records.length === 0) {
            // 🌟 텅 빈 화면(Empty State) 감성 패치!
            container.innerHTML = `
                <div style="padding:40px 20px; text-align:center; background:var(--bg-sub); border-radius:16px; border:1px dashed var(--border);">
                    <div style="font-size:32px; margin-bottom:12px;">🐣</div>
                    <div style="font-size:14.5px; font-weight:800; color:var(--text-m); margin-bottom:6px;">아직 기록된 일과가 없어요!</div>
                    <div style="font-size:12.5px; color:var(--text-s); line-height:1.5; word-break:keep-all;">오늘도 육아 출근 완료!<br>우리 아기의 첫 맘마 기록을 남겨볼까요?</div>
                </div>
                <button class="btn-main" onclick="window.toggleTrackerHistory()" style="width:100%; margin-top:12px; padding:14px; font-size:14px; background:#F2F5F8 !important; color:#4E5968 !important; border:1px solid #E5E8EB !important; border-radius:14px; box-shadow:none !important;">닫기 〉</button>
            `;
        } else {
            let grouped = {};
            records.forEach(r => {
                const d = new Date(r.timestamp);
                const dateKey = `${d.getMonth()+1}월 ${d.getDate()}일`;
                if(!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(r);
            });
            let historyHtml = '<div style="max-height:300px; overflow-y:auto; padding-right:4px;">';
            for(let date in grouped) {
            historyHtml += `<div style="position: sticky; top: -1px; z-index: 10; background: var(--bg-card); font-size:12.5px; font-weight:900; color:#8B95A1; margin:16px 0 8px 0; border-bottom:1px solid #F2F5F8; padding:6px 0;">📅 ${date}</div>`;
                grouped[date].forEach(r => {
    let icon = '✨';
    // 👇 이 부분이 핵심입니다! 이유식이면 숟가락, 아니면 젖병!
    if (r.type === 'feed') {
        icon = (r.subType === '이유식') ? '🥄' : '🍼';
    }
    else if (r.type === 'sleep') icon = (r.subType === '밤잠' ? '🌙' : '☀️');
    else if (r.type === 'diaper') {
                        if (r.subType === '소변') icon = '💧';
                        else if (r.subType === '대변') icon = '💩';
                        else icon = '💩';
                    }

                    let txt = '';
                    let displayTime = r.time; 
                    
                    if(r.type === 'feed') {
                        if (r.subType === '모유') txt = `모유 (${r.status}) ${r.amount}분`;
                        else txt = `${r.subType} ${r.amount}ml`;
                    }
                    else if(r.type === 'diaper') {
                        if (r.status) {
                            const sColor = getStatusColor(r.status);
                            txt = `${r.subType} / <span style="color:${sColor}; font-weight:900;">${r.status}</span>`;
                        } else {
                            txt = `${r.subType}`;
                        }
                    }
                    else if(r.type === 'sleep') {
                        if (r.amount === 0) {
                            txt = `<span style="color:#3182F6">${r.subType || '낮잠'} (자는 중 💤)</span>`;
                        } else {
                            let h = Math.floor(r.amount / 60);
                            let m = r.amount % 60;
                            let durText = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
                            txt = `${r.subType || '낮잠'} <span style="color:#A855F7;">${durText}</span>`;
                            let dEnd = new Date(r.timestamp + (r.amount * 60000));
                            let endStr = `${String(dEnd.getHours()).padStart(2,'0')}:${String(dEnd.getMinutes()).padStart(2,'0')}`;
                            displayTime = `${r.time} ~ ${endStr}`; 
                        }
                    }
                    
                    // ==========================================
                    // 💸 (패치) 트래커 히스토리: 은행 입출금 통장 스타일!
                    // ==========================================
                    historyHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 4px; border-bottom:1px solid rgba(0,0,0,0.05); margin-bottom:4px;">
                            
                            <!-- 🕒 왼쪽: 시간 -->
                            <div style="width: 50px; font-size:13px; font-weight:800; color:#8B95A1; text-align:left; flex-shrink:0;">
                                ${displayTime.split(' ~ ')[0]} <!-- 시작 시간만 깔끔하게 노출 -->
                            </div>
                            
                            <!-- 🍼 중앙: 아이콘 + 상세 내용 -->
                            <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:0;">
                                <div style="font-size:18px; flex-shrink:0; background:var(--bg-sub); width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:10px;">${icon}</div>
                                <div style="min-width:0;">
                                    <div style="font-weight:900; color:var(--text-m); font-size:14px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${txt}</div>
                                    ${displayTime.includes('~') ? `<div style="color:#B0B8C1; font-weight:700; font-size:11.5px;">${displayTime}</div>` : ''}
                                </div>
                            </div>
                            
                            <!-- ✏️❌ 오른쪽: 액션 버튼 (반투명 처리로 시선 분산 방지) -->
                            <div style="display:flex; gap:12px; flex-shrink:0;">
                                <button onclick="window.editTrackerRecord('${r.id}')" style="background:none; border:none; font-size:15px; color:#8B95A1; cursor:pointer; padding:0; opacity:0.6; transition:0.2s;">✏️</button>
                                <button onclick="window.deleteTrackerRecord('${r.id}')" style="background:none; border:none; font-size:15px; color:#D32F2F; cursor:pointer; padding:0; opacity:0.6; transition:0.2s;">❌</button>
                            </div>
                        </div>
                    `;
                });
            }
            historyHtml += '</div>';
            historyHtml += `<div style="display:flex; gap:8px; margin-top:16px;">
                <button class="btn-main" onclick="window.resetTrackerRecords()" style="flex:1; background:#FFF0F1 !important; color:#F04452 !important; border:1px solid #FFE3E3 !important; box-shadow:none !important; font-size:13px; padding:12px; border-radius:12px; margin:0;">🗑️ 전체 삭제</button>
                <button class="btn-main" onclick="window.toggleTrackerHistory()" style="flex:1; margin:0; font-size:13px; padding:12px; border-radius:12px; box-shadow:none !important;">접기 닫기 〉</button>
            </div>`;
            container.innerHTML = historyHtml;
        }
        container.style.display = 'block';
        return; 
    }
    // --- 히스토리 뷰 렌더링 끝 ---

    const lastSleepRecord = records.find(r => r.type === 'sleep'); 
    let sleepStartTime = localStorage.getItem('tosil_sleep_start');
    
    // 비정상 타이머 방어 로직
    if (sleepStartTime && lastSleepRecord && lastSleepRecord.amount > 0) {
        const sleepEndTime = lastSleepRecord.timestamp + (lastSleepRecord.amount * 60000);
        if (sleepEndTime > parseInt(sleepStartTime)) {
            localStorage.removeItem('tosil_sleep_start');
            localStorage.removeItem('tosil_sleep_type');
            sleepStartTime = null; 
        }
    }

    const isSleeping = sleepStartTime || (lastSleepRecord && lastSleepRecord.amount === 0); 
    const isAwake = !isSleeping;
    
    let wakeTimeHtml = "";
    
    // 💡 [배너] 현재 상태(깨시/수면중) 렌더링
    if (isAwake) {
        if (lastSleepRecord) {
            const sleepEndTime = Number(lastSleepRecord.timestamp) + (lastSleepRecord.amount * 60000);
            const awakeMins = Math.max(0, Math.floor((nowTime - sleepEndTime) / 60000));
            const hours = Math.floor(awakeMins / 60);
            const mins = awakeMins % 60;
            
            wakeTimeHtml = `<div style="background:var(--bg-card); padding:14px 18px; border-radius:16px; margin-bottom:14px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:20px;">⏰</span>
                    <div>
                        <div style="font-size:11px; font-weight:800; color:#8B95A1; margin-bottom:2px;">기상 후 경과 시간</div>
                        <div style="font-size:15px; font-weight:900; color:#3182F6;">${hours}시간 ${mins}분째 깨어있어요</div>
                    </div>
                </div>
<div style="font-size:11.5px; font-weight:700; color:#8B95A1; background:var(--bg-sub); padding:6px 10px; border-radius:10px;">현재 깨시 !</div>
            </div>`;
        }
} else {
        const currentSleepStart = sleepStartTime ? Number(sleepStartTime) : Number(lastSleepRecord.timestamp);
        const sleepMins = Math.max(0, Math.floor((nowTime - currentSleepStart) / 60000));
        const hours = Math.floor(sleepMins / 60);
        const mins = sleepMins % 60;
        
// 🌟 낮잠/밤잠 여부 파악해서 이모티콘 변경!
        const currentSleepType = localStorage.getItem('tosil_sleep_type') || (lastSleepRecord ? lastSleepRecord.subType : '낮잠');
        const sleepIcon = currentSleepType === '밤잠' ? '🌙' : '☀️';

        wakeTimeHtml = `<div class="sleep-banner-box" style="background:linear-gradient(135deg, #F3F0FF, #EDE9FE); padding:14px 18px; border-radius:16px; margin-bottom:14px; border:1px solid #D8C6FE; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">${sleepIcon}</span>
                <div class="sleep-banner-text2" style="font-size:15px; font-weight:900; color:#6C31F6;">${hours}시간 ${mins}분째 꿀잠 중</div>
            </div>
            <div class="sleep-banner-badge" style="font-size:11.5px; font-weight:700; color:#7C3AED; background:rgba(255,255,255,0.6); padding:6px 10px; border-radius:10px;">쉿! 🤫</div>
        </div>`;
    }


    const todayRecords = records.filter(r => new Date(r.timestamp).getDate() === now.getDate());
    
// 📊 타임라인 패턴
    let timelineHtml = `<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:18px; margin-bottom:14px; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-s); font-weight:800; margin-bottom:10px; padding:0 2px;">
            <span>📊 아기 하루 패턴</span>
            <div style="display:flex; gap:10px;">
                <span style="display:flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; background-color:#D8C6FE !important; border-radius:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>수면</span>
                <span style="display:flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; background-color:#3182F6 !important; border-radius:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>수유</span>
                <span style="display:flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; background-color:#F04452 !important; border-radius:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>기저귀</span>
            </div>
        </div>
        
        <!-- 바(Bar) 클릭 시 아래쪽 통계/기록 박스로 부드럽게 이동 -->
        <div onclick="document.getElementById('tracker-stats-container').scrollIntoView({ behavior: 'smooth', block: 'center' });" style="cursor:pointer; width:100%; height:16px; background-color:var(--bg-sub) !important; border-radius:8px; position:relative; overflow:hidden; margin-bottom:10px; -webkit-print-color-adjust:exact; print-color-adjust:exact;">`;

    const timeOverlapMap = {}; 
    todayRecords.forEach(r => {
        const d = new Date(r.timestamp);
        const startPercent = ((d.getHours() * 60) + d.getMinutes()) / 1440 * 100;
        const timeKey = `${d.getHours()}:${d.getMinutes()}`;
        if (!timeOverlapMap[timeKey]) timeOverlapMap[timeKey] = 0;
        const overlapCount = timeOverlapMap[timeKey];
        timeOverlapMap[timeKey]++; 
        const offsetPx = overlapCount * 4;
        const zIndex = 10 + overlapCount;

        // 🚨 안쪽 데이터 블록들도 span 태그와 !important로 무장 완료!
        if (r.type === 'sleep') {
            const duration = (r.amount === 0) ? Math.floor((nowTime - r.timestamp) / 60000) : r.amount; 
            const widthPercent = Math.min((duration / 1440 * 100), 100 - startPercent); 
            timelineHtml += `<span style="display:inline-block; position:absolute; left:${startPercent}%; width:${widthPercent}%; height:100%; background-color:rgba(168, 85, 247, 0.4) !important; border-radius:4px; z-index:5; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>`;
        } else if (r.type === 'feed') {
            timelineHtml += `<span style="display:inline-block; position:absolute; left:calc(${startPercent}% + ${offsetPx}px); width:3px; height:100%; background-color:#3182F6 !important; border-radius:2px; z-index:${zIndex}; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>`;
        } else if (r.type === 'diaper') {
            timelineHtml += `<span style="display:inline-block; position:absolute; left:calc(${startPercent}% + ${offsetPx}px); width:3px; height:100%; background-color:#F04452 !important; border-radius:2px; z-index:${zIndex}; -webkit-print-color-adjust:exact; print-color-adjust:exact;"></span>`;
        }
    });

    timelineHtml += `</div><div style="display:flex; justify-content:space-between; font-size:10px; color:#8B95A1; font-weight:800; padding:0 2px;"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div></div>`;

    // 📈 오늘 통계 바
    let todayFeedAmt = 0; let todayFeedMins = 0; let todaySleepMins = 0; let todayDiaperCount = 0;
    todayRecords.forEach(r => {
        if(r.type === 'feed') { if (r.subType === '모유') todayFeedMins += r.amount; else todayFeedAmt += r.amount; }
        if(r.type === 'sleep') todaySleepMins += r.amount;
        if(r.type === 'diaper') todayDiaperCount++;
    });

    const feedInterval = parseInt(localStorage.getItem('tosil_feed_interval')) || 180;
    const latestFeed = records.find(r => r.type === 'feed');
    const latestDiaper = records.find(r => r.type === 'diaper');
    let diffFeedMins = latestFeed ? Math.floor((nowTime - latestFeed.timestamp) / 60000) : 0;

    let briefBg = "var(--bg-card)";
    let briefColor = "var(--text-m)";
    let briefBorder = "var(--border)";
    let briefing = "오늘도 평화로운 육아팅! 🤍";

    if (todaySleepMins >= 240) briefing = `오늘 수면 ${Math.floor(todaySleepMins/60)}시간 돌파! 꿀잠 요정 🌙`;
    else if (todayFeedAmt >= 800 || todayFeedMins >= 90) briefing = `오늘 수유 빵빵하게 채우는 중! 💪`;
    else if (todayDiaperCount >= 5) briefing = `기저귀 ${todayDiaperCount}번 클리어! 보송보송 ✨`;
    else if (todayFeedAmt > 0 || todayFeedMins > 0) briefing = `오늘 수유 체크 완벽 진행 중! 🍼`;

    let briefBadge = `<div style="font-size:11px; font-weight:800; color:var(--primary); background:var(--bg-sub); padding:4px 8px; border-radius:8px;">실시간 연동</div>`;

    if (latestFeed && diffFeedMins >= feedInterval) {
        briefBg = "#FFF0F1"; briefColor = "#D32F2F"; briefBorder = "#FFD1D1";
        briefing = `🚨 맘마 먹은 지 ${Math.floor(diffFeedMins/60)}시간 경과!`;
        briefBadge = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div onclick="window.openTrackerSheet('feed')" style="font-size:12px; font-weight:800; color:#fff; background:#EF5350; padding:6px 14px; border-radius:8px; cursor:pointer; box-shadow: 0 2px 4px rgba(239,83,80,0.3);">기록</div>
                <div onclick="this.parentElement.parentElement.style.display='none'" style="font-size:16px; color:#EF5350; cursor:pointer; font-weight:bold;">✕</div>
            </div>
        `;
    }

    let briefingBarHtml = `
        <div style="background:${briefBg}; border:1px solid ${briefBorder}; border-radius:16px; padding:14px 18px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size:13.5px; font-weight:900; color:${briefColor};">${briefing}</div>
            ${briefBadge}
        </div>
    `;

    let feedDisp = todayFeedAmt > 0 ? `${todayFeedAmt}ml` : `${todayFeedMins}분`;
    if (todayFeedAmt > 0 && todayFeedMins > 0) feedDisp = `${todayFeedAmt}ml+모유`;

    let statsHtml = `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;">
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:16px 8px; border-radius:18px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size:11.5px; color:#8B95A1; font-weight:800; margin-bottom:6px;">총 수유량</div>
            <div style="font-size:16px; font-weight:900; color:#3182F6;">${feedDisp}</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:16px 8px; border-radius:18px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size:11.5px; color:#8B95A1; font-weight:800; margin-bottom:6px;">총 수면시간</div>
            <div style="font-size:16px; font-weight:900; color:#A855F7;">${Math.floor(todaySleepMins/60)}h ${todaySleepMins%60}m</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:16px 8px; border-radius:18px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size:11.5px; color:#8B95A1; font-weight:800; margin-bottom:6px;">기저귀 교체</div>
            <div style="font-size:16px; font-weight:900; color:#F04452;">${todayDiaperCount}회</div>
        </div>
    </div>`;

    container.innerHTML = wakeTimeHtml + timelineHtml + briefingBarHtml + statsHtml;
    container.style.display = ''; 

    // 💡 [수면 투트랙] 수면 버튼은 "직전 수면량", 다른 버튼은 "N분 전"
    const getRelativeTime = (latestRecord) => {
        if (!latestRecord) return '기록 없음';
        const m = Math.floor((nowTime - latestRecord.timestamp) / 60000);
        
        if (m < 1) return '방금 전';
        if (m < 60) return `${m}분 전`;
        
        // ✨ 아내분 CS 반영: 시간과 분을 함께 표시!
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        
        if (mins === 0) return `${hours}시간 전`;
        return `${hours}시간 ${mins}분 전`;
    };

  // 💡 [수면 투트랙] 수면 버튼 문구 (한국어 패치 적용)
    let sleepBtnText = '기록 없음';
    if (isSleeping) {
        sleepBtnText = '자는 중 💤';
    } else if (lastSleepRecord && lastSleepRecord.amount > 0) {
        let h = Math.floor(lastSleepRecord.amount / 60);
        let m = lastSleepRecord.amount % 60;
        
        // 시간과 분이 모두 있을 때 (예: 1시간 20분 꿀잠)
        if (h > 0 && m > 0) {
            sleepBtnText = `${h}시간 ${m}분 꿀잠`;
        } 
        // 시간만 딱 떨어질 때 (예: 2시간 꿀잠)
        else if (h > 0) {
            sleepBtnText = `${h}시간 꿀잠`;
        } 
        // 분만 있을 때 (예: 45분 꿀잠 / 테스트용 1분 꿀잠)
        else {
            sleepBtnText = `${m}분 꿀잠`;
        }
    }

    setTimeout(() => {
        const feedBtnSub = document.getElementById('btn-sub-feed');
        const sleepBtnSub = document.getElementById('btn-sub-sleep');
        const diaperBtnSub = document.getElementById('btn-sub-diaper');

        if(feedBtnSub) feedBtnSub.innerText = getRelativeTime(latestFeed);
        if(sleepBtnSub) sleepBtnSub.innerText = sleepBtnText; // 👈 직전 수면량 표시!
        if(diaperBtnSub) diaperBtnSub.innerText = getRelativeTime(latestDiaper);
    }, 50);

    if(typeof window.renderDadQuests === 'function') window.renderDadQuests();
    if(typeof window.updateDadBriefing === 'function') window.updateDadBriefing();
};

// ==========================================
// 💌 부부 소통: 육아문답 작성 상태 감지 엔진 (감성 100% 복구 버전)
// ==========================================
window.updateDiaryCard = function() {
    const card = document.getElementById('home-diary-card');
    if(!card) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastWrittenDate = localStorage.getItem('diary_last_written');
    const isWrittenToday = (lastWrittenDate === todayStr);

    if (isWrittenToday) {
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.location.href='diary.html'">
                <div>
                    <h3 class="diary-card-title" style="margin: 0 0 6px 0;"><span style="font-size: 1.3rem;">💌</span> 육아 문답</h3>
                    <p class="diary-card-desc" style="margin: 0; color: #F04452; font-weight: 800;">오늘 문답 작성 완료! 🤍</p>
                </div>
                <div class="diary-card-btn" style="margin: 0; background: #FFF0F1; color: #F04452; box-shadow: none;">내 답변 보기 ❯</div>
            </div>
            
            <!-- 👇 딱 이 부분만 예쁘게 다듬었습니다! (gap 추가, 텍스트 줄바꿈, 버튼 찌그러짐 방지) -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(240, 68, 82, 0.2); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="font-size: 12.5px; font-weight: 800; color: #D32F2F; opacity: 0.85; line-height: 1.4; word-break: keep-all;">
                    오늘 하루 어땠어?<br>대답 기다릴게 💌"
                </div>
                <button onclick="window.pokePartner(); event.stopPropagation();" style="background: #FEE500; color: #191F28; border: none; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 900; cursor: pointer; box-shadow: 0 2px 8px rgba(254, 229, 0, 0.2); transition: 0.2s; white-space: nowrap; flex-shrink: 0;">
                    👉 찌르기
                </button>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.location.href='diary.html'">
                <div>
                    <h3 class="diary-card-title" style="margin: 0 0 6px 0;"><span style="font-size: 1.3rem;">💌</span> 육아 문답</h3>
                    <p class="diary-card-desc" style="margin: 0;">하루 한 줄, 오늘 우리 아기와의 기억</p>
                </div>
                <div class="diary-card-btn" style="margin: 0;">기록하기 ❯</div>
            </div>
        `;
    }
};

window.pokePartner = function() {
    const text = "[육아메이트] 오늘 하루도 정말 고생 많았어 🤍 육아 문답에 내 마음을 남겨뒀으니 얼른 와서 확인해봐!";
    const url = "https://happy-baby0303.github.io/"; 
    if (navigator.share) {
        navigator.share({ title: '육아메이트의 따뜻한 초대', text: text, url: url }).catch(() => {});
    } else {
        prompt("아래 텍스트를 복사해서 카톡으로 보내주세요!", text + " " + url);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if(typeof window.updateDiaryCard === 'function') window.updateDiaryCard();
});
setInterval(() => {
    if(typeof window.updateDiaryCard === 'function') window.updateDiaryCard();
}, 5000);

// ==========================================
// 🌤️ [감성 엔진] 시간대별 인사말 & 새벽 이스터에그 통합판
// ==========================================
window.applyTimeBasedGreeting = function(babyName) {
    const currentHour = new Date().getHours();
    const greetingEl = document.getElementById('ai-time-greeting');
    const subEl = document.getElementById('ai-time-sub');
    
    // 1. 🌙 새벽 이스터에그
    if (currentHour >= 2 && currentHour <= 5) {
        const easterEgg = document.getElementById('easter-egg-layer');
        if (easterEgg) {
            easterEgg.style.display = 'flex';
            ['res-baby-dday', 'res-baby-name', 'daily-message'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = 'none';
            });
        }
        return; 
    }

    // 2. ☀️ 평상시 시간대별 인사말 (스타일의 큰 헤더)
    if (greetingEl) {
        let title = ""; let sub = "";
        
        if (currentHour >= 6 && currentHour < 11) {
            title = `상쾌한 아침이에요 ☀️`; sub = `간밤에 ${babyName}는 푹 잤나요?`;
        } else if (currentHour >= 11 && currentHour < 17) {
            title = `활기찬 오후네요 🌤️`; sub = `육아 틈틈이 커피 한 잔의 여유를!`;
        } else if (currentHour >= 17 && currentHour < 22) {
            title = `고생 많은 저녁이에요 🌙`; sub = `오늘 하루도 ${babyName} 돌보느라 수고하셨어요 🤍`;
        } else {
            title = `새벽에도 깨어계시군요 🦉`; sub = `늦은 시간까지 아기 곁을 지키는 당신이 최고예요 👍`;
        }
        
        greetingEl.innerText = title;
        if(subEl) subEl.innerText = sub;
    }
};

// ==========================================
// 🚀 앱 자동화 엔진 (새로고침 및 실시간 갱신)
// ==========================================

// 1. 앱 켜지자마자 대시보드 강제 렌더링 (새로고침 시 빈 화면 방지)
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(window.updateTrackerDashboard) window.updateTrackerDashboard();
        
        // 👇 이 줄을 추가해야 앱이 켜질 때 체크리스트가 화면에 그려집니다!
        if(window.renderRoutineChecklist) window.renderRoutineChecklist(); 
        
    }, 100);
});

// 2. 1분(60,000ms)마다 깨시 타이머 자동 갱신
setInterval(() => {
    // 히스토리(통계) 창을 보고 있지 않을 때만 배경에서 알아서 UI 업데이트
    if(!window.isHistoryView && window.updateTrackerDashboard) {
        window.updateTrackerDashboard();
    }
}, 60000);

// ==========================================
// 💊 데일리 케어 (좌측 정렬 디자인 + 커스텀 설정)
// ==========================================

window.renderRoutineChecklist = function() {
    const container = document.getElementById('routine-checklist-container');
    if(!container) return;

    const todayStr = new Date().toLocaleDateString();
    let savedDate = localStorage.getItem('tosil_routine_date');
    let routineData = JSON.parse(localStorage.getItem('tosil_routine_data')) || { probiotics: false, vitaminD: false, nail: false };
    
    // 유저가 설정한 이름 불러오기 (없으면 기본값)
    let routineNames = JSON.parse(localStorage.getItem('tosil_routine_names')) || ['유산균', '비타민D', '손톱'];

    if (savedDate !== todayStr) {
        routineData = { probiotics: false, vitaminD: false, nail: false };
        localStorage.setItem('tosil_routine_data', JSON.stringify(routineData));
        localStorage.setItem('tosil_routine_date', todayStr);
    }

    const createBtn = (id, label) => {
        const isChecked = routineData[id];
        // 💡 CSS 변수를 활용해 다크모드/라이트모드 자동 대응
        const bg = isChecked ? '#3182F6' : 'var(--bg-sub)';
        const color = isChecked ? '#FFF' : 'var(--text-s)';
        const border = isChecked ? '1px solid #3182F6' : '1px solid var(--border)';
        const shadow = isChecked ? '0 4px 10px rgba(49,130,246,0.2)' : 'none';

        return `<button onclick="window.toggleRoutine('${id}')" style="flex:1; padding:16px 0; border-radius:16px; background:${bg}; color:${color}; font-size:13.5px; font-weight:800; border:${border}; box-shadow:${shadow}; cursor:pointer; transition:all 0.2s ease-in-out; outline:none; margin:0; word-break:keep-all;">
                    ${label}
                </button>`;
    };

    // 💡 제목은 밖으로 빼서 왼쪽 정렬 (육아 트래커랑 똑같이!)
    container.innerHTML = `
        <div style="font-size: 15px; font-weight: 900; color: var(--text-m); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
            <div style="display:flex; align-items:center; gap:6px;">
                <span>✅ 데일리 케어 루틴</span>
                <span onclick="window.openRoutineSettings()" style="font-size:14px; cursor:pointer;" title="항목 설정">⚙️</span>
            </div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 18px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="display: flex; gap: 8px; justify-content: center;">
                ${createBtn('probiotics', routineNames[0])}
                ${createBtn('vitaminD', routineNames[1])}
                ${createBtn('nail', routineNames[2])}
            </div>
        </div>
    `;
};

// ⚙️ 데일리 케어 설정창(모달) 열고 닫고 저장하기 로직
window.openRoutineSettings = function() {
    let names = JSON.parse(localStorage.getItem('tosil_routine_names')) || ['유산균', '비타민D', '손톱'];
    document.getElementById('set-routine-1').value = names[0];
    document.getElementById('set-routine-2').value = names[1];
    document.getElementById('set-routine-3').value = names[2];
    document.getElementById('routine-settings-modal').style.display = 'flex';
};

window.closeRoutineSettingsForce = function() {
    document.getElementById('routine-settings-modal').style.display = 'none';
};

window.closeRoutineSettings = function(e) {
    if(e.target.id === 'routine-settings-modal') window.closeRoutineSettingsForce();
};

window.saveRoutineSettings = function() {
    const n1 = document.getElementById('set-routine-1').value || '항목1';
    const n2 = document.getElementById('set-routine-2').value || '항목2';
    const n3 = document.getElementById('set-routine-3').value || '항목3';
    const newNames = [n1, n2, n3];
    
    localStorage.setItem('tosil_routine_names', JSON.stringify(newNames));
    
    // 서버 연동(부부 공유)
    let routineData = JSON.parse(localStorage.getItem('tosil_routine_data')) || {};
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        setDoc(doc(db, "routine_" + syncCode, "status"), { 
            data: routineData, 
            date: new Date().toLocaleDateString(),
            names: newNames // 커스텀 이름도 파이어베이스로 보냄!
        }).catch(e=>{});
    }

    window.closeRoutineSettingsForce();
    window.renderRoutineChecklist();
};

// 👆 체크버튼 누를 때 파이어베이스로 이름도 같이 보내도록 업데이트
window.toggleRoutine = async function(id) {
    let routineData = JSON.parse(localStorage.getItem('tosil_routine_data')) || {};
    routineData[id] = !routineData[id];
    let routineNames = JSON.parse(localStorage.getItem('tosil_routine_names')) || ['유산균', '비타민D', '손톱'];
    
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { 
            await setDoc(doc(db, "routine_" + syncCode, "status"), { 
                data: routineData, 
                date: new Date().toLocaleDateString(),
                names: routineNames // 항목 이름도 같이 동기화
            }); 
        } catch(e) {}
    }

    localStorage.setItem('tosil_routine_data', JSON.stringify(routineData));
    window.renderRoutineChecklist();
};

// ==========================================
// 🚀 트래커 실시간 연동 (앱 끄자마자 즉시 저장!)
// ==========================================
window.saveTrackerToFirebase = async function(records) {
    // 1. 내 폰에 먼저 저장해서 화면은 0.1초 만에 바뀌게 (체감속도 유지)
    localStorage.setItem('tosil_tracker_records', JSON.stringify(records));
    if(typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();

    // 2. 지연 시간 1초도 없이 곧바로 파이어베이스로 슛! (육퇴 후 바로 앱을 꺼도 무조건 저장됨)
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { 
            await setDoc(doc(db, "tracker_" + syncCode, "status"), { records: records }); 
        } catch (e) { 
            console.error("트래커 클라우드 저장 실패", e); 
        }
    }
};

// ==========================================
// 4️⃣    트래커 기존 함수들을 '연동형'으로 업그레이드
// ==========================================
window.stopSleepTimer = async function() {
    const start = localStorage.getItem('tosil_sleep_start');
    if(!start) return;
    const end = new Date().getTime();
    const durationMins = Math.floor((end - parseInt(start)) / 60000);
    const sleepType = localStorage.getItem('tosil_sleep_type') || '낮잠'; 
    
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let record = { id: 'trk_'+now.getTime(), time: timeStr, timestamp: now.getTime(), type: 'sleep', subType: sleepType, amount: durationMins };
    
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    records.unshift(record);
    if(records.length > 100) records.pop();
    
    // ✨ 클라우드(파이어베이스) 연동 및 화면 자동 갱신
    if (typeof saveTrackerToFirebase === 'function') {
        await saveTrackerToFirebase(records);
    } else {
        localStorage.setItem('tosil_tracker_records', JSON.stringify(records));
        if (typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
    }
    
    localStorage.removeItem('tosil_sleep_start');
    localStorage.removeItem('tosil_sleep_type'); 
    window.closeTrackerSheet();
    window.showToast(`✅ ${durationMins}분 동안 자고 일어났어요!`);
};

// 🌟 기록 저장 함수 (어제/오늘 날짜 무조건 우선 적용!)
window.saveTrackerRecord = async function() {
    if(!window.trackerState.type) return;

    const saveBtn = document.getElementById('btn-tracker-save');
    if (saveBtn) {
        if (saveBtn.disabled) return; 
        saveBtn.disabled = true; 
        saveBtn.innerText = '저장 중... 💾'; 
        saveBtn.style.opacity = '0.5';
    }

    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    let timeStr = "";
    let timestamp = new Date().getTime();
    const timeInputEl = document.getElementById('v-tracker-time');
    
    // 🌟 날짜 계산 핵심 로직 (어제/오늘 버튼 누른 값을 무조건 반영)
    let finalDate = new Date();
    finalDate.setDate(finalDate.getDate() + window.trackerState.dateOffset); // 어제면 -1, 오늘이면 0
    
    if (timeInputEl && timeInputEl.value) {
        timeStr = timeInputEl.value; 
        const [hours, minutes] = timeStr.split(':');
        finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        timestamp = finalDate.getTime();
    } else {
        timeStr = `${String(finalDate.getHours()).padStart(2,'0')}:${String(finalDate.getMinutes()).padStart(2,'0')}`;
        timestamp = finalDate.getTime();
    }

    let recordId = window.editingTrackerId ? window.editingTrackerId : 'trk_'+new Date().getTime();
    let record = { id: recordId, time: timeStr, timestamp: timestamp, type: window.trackerState.type };

    // 분기별 데이터 정리 로직
    if (window.trackerState.type === 'feed' || window.trackerState.type === 'babyfood') {
        if (window.trackerState.subType === '이유식') {
            const foodAmt = document.getElementById('v-food-amount').value;
            if(!foodAmt) {
                if(saveBtn) { saveBtn.disabled = false; saveBtn.innerText = '저장하기'; saveBtn.style.opacity = '1'; }
                return window.showToast('⚠️ 먹은 이유식 양을 입력해주세요!');
            }
            record.type = 'feed'; 
            record.subType = '이유식';
            record.amount = parseInt(foodAmt);
            record.status = ''; 
        } 
        else {
            if(!window.trackerState.subType) {
                if(saveBtn) { saveBtn.disabled = false; saveBtn.innerText = '저장하기'; saveBtn.style.opacity = '1'; }
                return window.showToast('⚠️ 분유, 모유, 유축 중 하나를 선택해주세요!');
            }
            if (window.trackerState.subType === '모유') {
                const bAmt = document.getElementById('v-breast-amount').value;
                if(!bAmt) { if(saveBtn){ saveBtn.disabled=false; saveBtn.innerText='저장하기'; saveBtn.style.opacity='1'; } return window.showToast('⚠️ 수유 시간(분)을 입력해주세요!'); }
                if(!window.trackerState.status) { if(saveBtn){ saveBtn.disabled=false; saveBtn.innerText='저장하기'; saveBtn.style.opacity='1'; } return window.showToast('⚠️ 왼쪽/오른쪽을 선택해주세요!'); }
                
                record.type = 'feed';
                record.subType = '모유';
                record.amount = parseInt(bAmt);
                record.status = window.trackerState.status; 
            } else {
                const amt = document.getElementById('v-feed-amount').value;
                if(!amt) { if(saveBtn){ saveBtn.disabled=false; saveBtn.innerText='저장하기'; saveBtn.style.opacity='1'; } return window.showToast('⚠️ 먹은 양(ml)을 입력해주세요!'); }
                record.type = 'feed';
                record.subType = window.trackerState.subType; 
                record.amount = parseInt(amt);
                record.status = '';
            }
        }
    } 
    else if (window.trackerState.type === 'diaper') {
        if(!window.trackerState.subType) { if(saveBtn){ saveBtn.disabled=false; saveBtn.innerText='저장하기'; saveBtn.style.opacity='1'; } return window.showToast('⚠️ 소변인지 대변인지 선택해주세요!'); }
        record.subType = window.trackerState.subType;
        record.status = (window.trackerState.subType === '소변') ? '' : (window.trackerState.status || '');
    }
    else if (window.trackerState.type === 'sleep') {
        const amt = document.getElementById('v-sleep-amount');
        let sleepAmount = 0;
        if (amt && amt.value !== '') sleepAmount = parseInt(amt.value);
        record.amount = sleepAmount;
        
        if (sleepAmount > 0) {
            localStorage.removeItem('tosil_sleep_start');
            localStorage.removeItem('tosil_sleep_type');
        }
        
        if (window.editingTrackerId) {
            const originalRecord = records.find(r => r.id === window.editingTrackerId);
            if (originalRecord) record.subType = originalRecord.subType; 
        } else {
            record.subType = window.trackerState.subType || '낮잠'; 
        }
    }

    if (window.editingTrackerId) {
        const idx = records.findIndex(r => r.id === window.editingTrackerId);
        if(idx !== -1) records[idx] = record;
    } else {
        records.push(record);
    }
    
    records.sort((a, b) => b.timestamp - a.timestamp);
    if(records.length > 100) records.pop();
    
    if (typeof saveTrackerToFirebase === 'function') {
        await saveTrackerToFirebase(records);
    } else {
        localStorage.setItem('tosil_tracker_records', JSON.stringify(records));
        if(typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
    }

    if (window.checkReceiptVisibility) window.checkReceiptVisibility();

    window.editingTrackerId = null; 
    window.closeTrackerSheet();
    window.showToast(record.subType === '이유식' ? "🥄 냠냠! 이유식 기록 완료!" : "💾 기록이 저장되었습니다!");

    if (saveBtn) {
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerText = '저장하기';
            saveBtn.style.opacity = '1';
        }, 500);
    }
};

// ==========================================
// 5️⃣    비타민 체크리스트  !!  '실시간 연동형'
// ==========================================
window.toggleRoutine = async function(id) {
    let routineData = JSON.parse(localStorage.getItem('tosil_routine_data')) || {};
    routineData[id] = !routineData[id];
    
    if (typeof db !== 'undefined' && typeof setDoc === 'function') {
        const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
        try { 
            await setDoc(doc(db, "routine_" + syncCode, "status"), { 
                data: routineData, 
                date: new Date().toLocaleDateString() 
            }); 
        } catch(e) {}
    }

    localStorage.setItem('tosil_routine_data', JSON.stringify(routineData));
    window.renderRoutineChecklist();
};

// ==========================================
// 6️⃣  파이어베이스 실시간 수신 리스너 (트래커 & 비타민)
// ==========================================
let trackerUnsubscribe = null;
let routineUnsubscribe = null;

window.startTrackerRealtimeSync = function() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "tracker_" + syncCode, "status") : null;
    if(!docRef) return; 
    if (trackerUnsubscribe) trackerUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    trackerUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tosil_tracker_records', JSON.stringify(data.records || []));
        }
        
        // 🚨 [수정 1] 앞에 window. 를 붙여야 다른 폰에서 화면(대시보드)이 즉시 갱신됩니다!
        if (typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
        
        // 🎁 [수정 2 - 보너스] 남편분이 3번째 기록을 쓰면, 아내분 폰에도 영수증 버튼이 바로 '짠!' 하고 뜨게 만듭니다.
        if (typeof window.checkReceiptVisibility === 'function') window.checkReceiptVisibility();
    });
};

window.startRoutineRealtimeSync = function() {
    const syncCode = localStorage.getItem("family_sync_code") || "unlinked_local_diary";
    const docRef = typeof doc !== 'undefined' && typeof window.db !== 'undefined' ? doc(window.db, "routine_" + syncCode, "status") : null;
    if(!docRef) return; 
    if (routineUnsubscribe) routineUnsubscribe();
    if(typeof window.onSnapshot !== 'function') return;

    routineUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const dbData = docSnap.data();
            const todayStr = new Date().toLocaleDateString();
            if (dbData.date === todayStr) {
                localStorage.setItem('tosil_routine_data', JSON.stringify(dbData.data || {}));
                localStorage.setItem('tosil_routine_date', todayStr);
            }
            // 💡 추가된 핵심 로직: 서버에 커스텀 이름이 있으면 내 폰에도 적용!
            if (dbData.names) {
                localStorage.setItem('tosil_routine_names', JSON.stringify(dbData.names));
            }
        }
        if (typeof renderRoutineChecklist === 'function') renderRoutineChecklist();
    });
};

// ==========================================
// 🚀 [최종 통합] 모든 실시간 감시 엔진 일괄 가동 스위치
// ==========================================
window.initRealtimeSync = () => {
    if (typeof startFeverRealtimeSync === 'function') startFeverRealtimeSync();
    if (typeof startCubeRealtimeSync === 'function') startCubeRealtimeSync();
    if (typeof startBatonRealtimeSync === 'function') startBatonRealtimeSync();
    if (typeof startLedgerRealtimeSync === 'function') startLedgerRealtimeSync();
    
    if (typeof startTrackerRealtimeSync === 'function') startTrackerRealtimeSync();
    if (typeof startRoutineRealtimeSync === 'function') startRoutineRealtimeSync();
    if (typeof startCommunityRealtimeSync === 'function') startCommunityRealtimeSync();
    if (typeof startCommentRealtimeSync === 'function') startCommentRealtimeSync();
};

// 앱 로딩 시 리스너 수동 실행 방어 코드
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("family_sync_code")) {
        window.initRealtimeSync();
    }
});

// ==========================================
// 🚨 영유아 응급처치(CPR/하임리히) 모달 제어 (실전용 업데이트)
// ==========================================
window.openEmergencyModal = function(type) {
    const header = document.getElementById('em-header');
    const content = document.getElementById('em-content');
    
    if (type === 'heimlich') {
        header.innerHTML = `
            <div style="font-size: 19px; font-weight: 900; color: var(--danger); margin-bottom: 6px; margin-top: 10px;">영아 하임리히법 (1세 미만)</div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-s);">이물질로 인해 숨을 쉬지 못할 때 즉시 실시!</div>
        `;
        content.innerHTML = `
            <!-- 🚨 최우선 행동 지침 -->
            <div style="background:var(--danger); color:#FFF; padding:12px; border-radius:12px; font-weight:900; font-size:14px; text-align:center; margin-bottom:16px; box-shadow: 0 4px 12px rgba(240,68,82,0.3); animation: pulseSOS 1.5s infinite;">
                📞 119에 신고하고 "스피커폰"을 켜세요!
            </div>
            
            <div class="box-sub" style="padding: 16px; border-radius: 16px; border-left: 4px solid var(--danger); margin-bottom: 8px;">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 6px;">1️⃣ 등 압박 5회</div>
                <div style="font-size: 13.5px; color: var(--text-s); line-height: 1.5; word-break: keep-all;">아기 얼굴을 아래로 향하게 엎드려 눕힌 후, 양쪽 날개뼈 사이를 <b>강하고 빠르게 5회</b> 두드립니다.</div>
            </div>
            <div class="box-sub" style="padding: 16px; border-radius: 16px; border-left: 4px solid var(--danger); margin-bottom: 8px;">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 6px;">2️⃣ 가슴 압박 5회</div>
                <div style="font-size: 13.5px; color: var(--text-s); line-height: 1.5; word-break: keep-all;">아기를 앞으로 돌려 눕히고, 양 젖꼭지 정중앙 바로 아래를 <b>두 손가락으로 5회</b> 강하게 누릅니다.</div>
            </div>
            
            <div class="box-tint-red" style="padding: 14px; border-radius: 16px; text-align:center; margin-bottom: 16px;">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--danger);">이물질이 나올 때까지 1, 2번 무한 반복!</div>
            </div>

            <!-- 🎥 평소 학습용 유튜브 링크 -->
            <a href="https://www.youtube.com/results?search_query=영아+하임리히법+소방청" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#FF0000; color:#FFF; padding:14px; border-radius:12px; font-weight:900; font-size:14px; text-decoration:none;">
                <span>▶️</span> 1분 영상으로 정확한 자세 보기
            </a>
        `;
    } else if (type === 'cpr') {
        header.innerHTML = `
            <div style="font-size: 19px; font-weight: 900; color: var(--primary); margin-bottom: 6px; margin-top: 10px;">영아 심폐소생술 (1세 미만)</div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-s);">의식과 호흡이 없을 때 즉시 실시!</div>
        `;
        content.innerHTML = `
            <!-- 🚨 최우선 행동 지침 -->
            <div style="background:var(--primary); color:#FFF; padding:12px; border-radius:12px; font-weight:900; font-size:14px; text-align:center; margin-bottom:16px; box-shadow: 0 4px 12px rgba(49,130,246,0.3); animation: pulseSOS 1.5s infinite;">
                📞 119에 신고하고 "스피커폰"을 켜세요!
            </div>
            
            <div class="box-sub" style="padding: 16px; border-radius: 16px; border-left: 4px solid var(--primary); margin-bottom: 8px;">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 6px;">1️⃣ 의식 확인 (발바닥 때리기)</div>
                <div style="font-size: 13.5px; color: var(--text-s); line-height: 1.5; word-break: keep-all;">아기 <b>발바닥</b>을 때리며 반응 확인. 반응이 없으면 주변에 AED(자동심장충격기)를 요청하세요.</div>
            </div>
            <div class="box-sub" style="padding: 16px; border-radius: 16px; border-left: 4px solid var(--primary); margin-bottom: 8px;">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 6px;">2️⃣ 가슴 압박 30회</div>
                <div style="font-size: 13.5px; color: var(--text-s); line-height: 1.5; word-break: keep-all;">양 젖꼭지 정중앙 <b>바로 아래쪽</b>을 두 손가락으로 <b>4cm 깊이로 빠르고 강하게 30회</b> 누릅니다.</div>
            </div>
            <div class="box-sub" style="padding: 16px; border-radius: 16px; border-left: 4px solid var(--primary); margin-bottom: 16px;">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 6px;">3️⃣ 인공호흡 2회</div>
                <div style="font-size: 13.5px; color: var(--text-s); line-height: 1.5; word-break: keep-all;">아기의 <b>입과 코를 한 번에 덮고</b> 가슴이 부풀어 오를 정도로 1초씩 2회 숨을 불어넣습니다.</div>
            </div>

            <!-- 🎥 평소 학습용 유튜브 링크 -->
            <a href="https://www.youtube.com/results?search_query=영아+심폐소생술+소방청" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#FF0000; color:#FFF; padding:14px; border-radius:12px; font-weight:900; font-size:14px; text-decoration:none;">
                <span>▶️</span> 1분 영상으로 정확한 자세 보기
            </a>
        `;
    }
    
    document.getElementById('emergency-modal').style.display = 'flex';
}

window.closeEmergencyModalForce = function() { document.getElementById('emergency-modal').style.display = 'none'; };
window.closeEmergencyModal = function(e) { if(e.target.id === 'emergency-modal') window.closeEmergencyModalForce(); };

// ==========================================
// 🧾 영수증 띄우기 (데이터 0 방어 + 외부 파일 랜덤 연동 완료!)
// ==========================================
window.openReceiptModal = function() {
    const today = new Date();
    document.getElementById('receipt-date').innerText = `${today.getFullYear()}. ${today.getMonth()+1}. ${today.getDate()}`;
    
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];

    let totalMilk = 0;
    let totalPoop = 0;
    let totalSleepMins = 0;

    records.forEach(record => {
        if (record.timestamp >= startOfToday) {
            if (record.type === 'feed' && record.amount) {
                totalMilk += parseInt(record.amount);
            } 
            else if (record.type === 'diaper' && record.subType && record.subType.includes('대변')) {
                totalPoop += 1;
            } 
            else if (record.type === 'sleep' && record.amount) {
                totalSleepMins += parseInt(record.amount);
            }
        }
    });

    let totalSleepHours = (totalSleepMins / 60).toFixed(1); 
    if (totalSleepHours.endsWith('.0')) totalSleepHours = parseInt(totalSleepHours);

    document.getElementById('receipt-milk').innerText = `${totalMilk} ml`;
    document.getElementById('receipt-poop').innerText = `${totalPoop} 회`;
    document.getElementById('receipt-sleep').innerText = `${totalSleepHours} 시간`;

    // 🌟 [핵심 패치] 엄마/아빠 역할에 따라 단어 치환 로직!
    const role = localStorage.getItem('user_role') || 'mom';
    const myTitle = role === 'dad' ? '아빠' : '엄마';
    const partnerTitle = role === 'dad' ? '엄마' : '아빠';

    const pickRandom = (array) => {
        let text = array[Math.floor(Math.random() * array.length)];
        // {me}는 내 역할로, {partner}는 짝꿍 역할로 바꿔치기
        return text.replace(/{me}/g, myTitle).replace(/{partner}/g, partnerTitle);
    };

    let diaryText = "";
    
    if (totalMilk === 0 && totalPoop === 0 && totalSleepMins === 0) {
        diaryText = `아직 오늘 기록된 데이터가 없어요! 😅\n우리아기가 오늘 얼마나 먹고 잤는지 트래커에 먼저 기록해 주세요 ✍️🤍`;
    } else {
        diaryText += pickRandom(receiptData.intro);
        if (totalSleepHours >= 3) diaryText += pickRandom(receiptData.sleepGood);
        else diaryText += pickRandom(receiptData.sleepBad);

        if (totalMilk >= 700) diaryText += pickRandom(receiptData.feedMuch);
        else if (totalMilk > 0) diaryText += pickRandom(receiptData.feedLittle);
        else diaryText += pickRandom(receiptData.feedZero);

        if (totalPoop > 0) diaryText += pickRandom(receiptData.poopMuch);
        else diaryText += pickRandom(receiptData.poopZero);

        diaryText += pickRandom(receiptData.outro);
    }

    document.getElementById('receipt-diary').innerText = diaryText;
    document.getElementById('receipt-modal').style.display = 'flex';
}

// 닫기 버튼
window.closeReceiptModal = function() {
    document.getElementById('receipt-modal').style.display = 'none';
}

// ==========================================
// 🧾 영수증 이미지 저장 (모바일 철통 방어 패치)
// ==========================================
window.downloadReceipt = function() {
    const target = document.getElementById('receipt-content'); 

    if (!target) {
        return alert("저장할 영수증 내용을 찾을 수 없습니다.");
    }
    
    // 🚨 1번 원인 방어: 라이브러리가 로드되지 않았을 때
    if (typeof html2canvas === 'undefined') {
        return alert("이미지 저장 라이브러리가 필요합니다. HTML 파일에 html2canvas 스크립트가 있는지 확인해주세요!");
    }

    // 캡처하는 동안 저장 버튼 임시 숨김 (버튼까지 사진에 찍히는 것 방지)
    const btn = document.querySelector('#receipt-modal button[onclick*="downloadReceipt"]');
    if (btn) btn.style.display = 'none';

    html2canvas(target, {
        scale: 2, // 화질 2배 뻥튀기 (고화질)
        backgroundColor: '#ffffff',
        useCORS: true // 🚨 카카오 프사 같은 외부 이미지 깨짐 방지
    }).then(canvas => {
        if (btn) btn.style.display = 'block'; // 버튼 원상복구

        // 🚨 2번 원인 방어: 모바일에서 다운로드 강제 실행 꼼수
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "우리아기_하루_영수증.png";
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof window.showToast === 'function') {
            window.showToast("📸 영수증이 앨범에 쏙 저장되었습니다!");
        } else {
            alert("📸 영수증이 앨범에 저장되었습니다!");
        }
    }).catch(err => {
        if (btn) btn.style.display = 'block';
        console.error("영수증 캡처 에러:", err);
        alert("저장 중 오류가 발생했습니다 ㅠㅠ");
    });
};

// ==========================================
// 👁️ 영수증 버튼 숨기기/보여주기 검사관 (최종본)
// ==========================================
window.checkReceiptVisibility = function() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];

    const todayRecordsCount = records.filter(record => record.timestamp >= startOfToday).length;

    const receiptBtn = document.getElementById('receipt-banner-btn');
    if (!receiptBtn) return;

    // 🚨 조건 수정: 기록이 3개 이상 '이면서(AND)' 저녁 8시가 넘었을 때만!
    if (todayRecordsCount >= 3 && today.getHours() >= 20) {
        receiptBtn.style.display = 'flex'; // 보여주기
    } else {
        receiptBtn.style.display = 'none'; // 숨기기
    }
}

// 앱이 켜질 때 & 기록이 저장/삭제될 때마다 검사
window.addEventListener('load', function() {
    window.checkReceiptVisibility();
});


// 🚨 커스텀 확인창 띄우기 함수 (타이핑 안전장치 포함!)
window.showConfirm = function(message, onConfirm, icon = '🚨', confirmText = '확인', confirmColor = 'var(--primary)', requireKeyword = null) {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const iconEl = document.getElementById('confirm-icon');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const inputArea = document.getElementById('confirm-input-area');
    const inputEl = document.getElementById('confirm-keyword-input');
    
    if(!modal) return;
    
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    iconEl.innerHTML = icon;
    btnOk.innerText = confirmText;
    btnOk.style.background = confirmColor;
    
    // 안전 키워드가 필요할 때
    if (requireKeyword) {
        inputArea.style.display = 'block';
        inputEl.value = '';
        btnOk.style.opacity = '0.3';
        btnOk.style.pointerEvents = 'none'; // 입력 전엔 클릭 금지!
        
        inputEl.onkeyup = function() {
            if (this.value === requireKeyword) {
                btnOk.style.opacity = '1';
                btnOk.style.pointerEvents = 'auto'; // 똑같이 쳐야만 활성화
            } else {
                btnOk.style.opacity = '0.3';
                btnOk.style.pointerEvents = 'none';
            }
        };
    } else {
        inputArea.style.display = 'none';
        btnOk.style.opacity = '1';
        btnOk.style.pointerEvents = 'auto';
    }
    
    modal.style.display = 'flex';
    
    btnOk.onclick = function() {
        modal.style.display = 'none';
        if(typeof onConfirm === 'function') onConfirm();
    };
    
    btnCancel.onclick = function() {
        modal.style.display = 'none';
    };
};

// 트래커 전체 삭제에 안전장치 걸기!
window.resetTrackerRecords = function() {
    showConfirm("모든 트래커 기록을 싹 지우시겠습니까?\n(진행 중인 수면 타이머도 리셋됩니다)", async function() {
        localStorage.removeItem('tosil_sleep_start');
        localStorage.removeItem('tosil_sleep_type');
        if (typeof saveTrackerToFirebase === 'function') {
            await saveTrackerToFirebase([]);
            flushTrackerSync(); 
        } else {
            localStorage.removeItem('tosil_tracker_records');
            window.updateTrackerDashboard();
        }
        showToast("🧹 트래커 기록이 싹 비워졌습니다!");
    }, "⚠️", "전체 삭제", "#F04452", "삭제"); // 👈 끝에 "삭제" 추가!
};

// (설정 탭) 데이터 관리 전체 삭제
window.clearAllData = function() {
    showConfirm("정말 모든 데이터를 초기화할까요?<br>이 작업은 되돌릴 수 없습니다!", function() {
        localStorage.removeItem('baby_trackers');
        localStorage.removeItem('tosil_tracker_records');
        window.updateTrackerDashboard(); 
        showToast("🗑️ 데이터가 모두 초기화되었습니다.");
    }, "🚨", "초기화", "#F04452", "삭제"); // 👈 끝에 "삭제" 추가!
};

// ❌ 알람 끄기 함수
window.dismissTrackerAlarm = function(type) {
    localStorage.setItem('tosil_dismiss_alarm_' + type, new Date().getTime());
    window.updateTrackerDashboard();
};

// ==========================================
// 💡 수면시간 자동 계산 엔진 (반드시 다른 함수들 바깥 빈 공간에 넣으세요!)
// ==========================================
window.calcSleepToNow = function() {
    // 이제 별도의 수면 시작시간칸 대신, 시트 맨 위의 기록 시간(v-tracker-time)을 사용합니다!
    const startInput = document.getElementById('v-tracker-time');
    const amountInput = document.getElementById('v-sleep-amount');
    if(!startInput || !amountInput) return;

    const [sHour, sMin] = startInput.value.split(':').map(Number);
    const now = new Date();
    let startObj = new Date();
    startObj.setHours(sHour, sMin, 0, 0);

    // 어젯밤에 잤을 경우 날짜 보정
    if (startObj > now) {
        startObj.setDate(startObj.getDate() - 1);
    }

    const diffMins = Math.floor((now - startObj) / 60000);
    
    if (diffMins < 0) {
        return window.showToast("⚠️ 시작 시간이 잘못 설정되었습니다.");
    }

    amountInput.value = diffMins;
    
    amountInput.style.transform = 'scale(1.2)';
    amountInput.style.color = '#3182F6';
    setTimeout(() => { 
        amountInput.style.transform = 'scale(1)'; 
        amountInput.style.color = 'var(--text-m)';
    }, 300);

    window.showToast(`✅ ${diffMins}분 수면으로 계산되었습니다!`);
};

// ==========================================
// 🚀 [온보딩 & 정보수정 엔진] 최종 완성본 (이것만 남기세요!)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem('tosil_babyName');
    const savedDate = localStorage.getItem('tosil_startDate');
    
    // 🔥 무한 반복 버그 해결 완!
    if (savedName && savedDate) {
        document.getElementById('onboarding-overlay').style.display = 'none';
        updateBabyDashboard(); 
    } else {
        document.getElementById('onboarding-overlay').style.display = 'flex';
    }
});

// 🔄 다음/이전 단계 연결
window.nextOnboardingStep = function(step) {
    if (step === 2) {
        const name = document.getElementById('ob-name').value.trim();
        if (!name) return alert('우리 아기의 예쁜 이름을 입력해주세요! 😊');
        
        document.getElementById('ob-greeting-name').innerHTML = `<span style="color:#3182F6;">${name}</span>의 생일은<br>언제인가요?`;
        document.getElementById('onboarding-step-1').style.display = 'none';
        document.getElementById('onboarding-step-2').style.display = 'flex';
        document.getElementById('onboarding-step-3').style.display = 'none';
    } else if (step === 3) {
        const date = document.getElementById('ob-date').value;
        if (!date) return alert('생일(또는 예정일)을 꼭 선택해주세요! 🎂');
        
        const name = document.getElementById('ob-name').value.trim();
        document.getElementById('ob-stage-name').innerText = name; 
        
        document.getElementById('onboarding-step-2').style.display = 'none';
        document.getElementById('onboarding-step-3').style.display = 'flex';
    } else if (step === 1) {
        document.getElementById('onboarding-step-2').style.display = 'none';
        document.getElementById('onboarding-step-1').style.display = 'flex';
        document.getElementById('onboarding-step-3').style.display = 'none';
    }
};

// 🎉 온보딩 완료 및 로딩 마술 발동! (여기가 핵심!)
window.finishOnboarding = function(feedingStage) {
    const name = document.getElementById('ob-name').value.trim();
    const date = document.getElementById('ob-date').value;
    
    // 1. 기존 화면(3단계)을 숨기고 비밀의 로딩 화면을 켭니다!
    document.getElementById('onboarding-step-3').style.display = 'none';
    document.getElementById('onboarding-step-loading').style.display = 'flex';
    
    const loadingText = document.getElementById('loading-text');

    // ⏱️ 0초: 첫 번째 멘트
    loadingText.innerHTML = `<span style="color:#3182F6">${name}</span>의<br>생일 데이터를 동기화하는 중...`;
    
    // ⏱️ 1.2초 뒤: 두 번째 멘트
    setTimeout(() => {
        loadingText.innerHTML = `현재 월령에 맞는<br>성장 구간 분석 중...`;
    }, 1200);

    // ⏱️ 2.4초 뒤: 세 번째 멘트
    setTimeout(() => {
        loadingText.innerHTML = `[${feedingStage}]에 딱 맞는<br>육아메이트 세팅 완료! 🎉`;
    }, 2400);

    // ⏱️ 3.5초 뒤: 마술이 끝나면 그제야 데이터를 저장하고 새로고침!
    setTimeout(() => {
        localStorage.setItem('tosil_babyName', name);
        localStorage.setItem('tosil_startDate', date);
        localStorage.setItem('tosil_feedingStage', feedingStage);
        localStorage.setItem('tosil_baby', JSON.stringify({name: name, birth: date, stage: feedingStage}));

        document.getElementById('onboarding-overlay').style.display = 'none';
        location.reload(); 
    }, 3500); 
};

// ✏️ 메인화면에서 연필 눌러서 수정할 때
window.promptBabyInfo = function() {
    document.getElementById('ob-name').value = localStorage.getItem('tosil_babyName') || '';
    document.getElementById('ob-date').value = localStorage.getItem('tosil_startDate') || '';
    
    document.getElementById('onboarding-step-1').style.display = 'flex';
    document.getElementById('onboarding-step-2').style.display = 'none';
    document.getElementById('onboarding-step-3').style.display = 'none';
    const loadingObj = document.getElementById('onboarding-step-loading');
    if(loadingObj) loadingObj.style.display = 'none';
    
    document.getElementById('onboarding-overlay').style.display = 'flex';
};


// ==========================================
// 🎣 [바이럴 엔진] 남편 강제 소환 (평생 1번만 등장 + 카카오 찐연동)
// ==========================================

// 1. 카카오톡 통신망 연결
if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b'); 
}

// 🌟 삭제되었던 바텀시트 띄우기 함수 복구!
window.showInviteNudge = function() {
    // 💡 테스트용: 이 창을 계속 띄워보고 싶다면 아래 줄의 // 를 지우세요!
    // localStorage.removeItem('tosil_has_seen_invite');

    if (!localStorage.getItem('tosil_has_seen_invite')) {
        const babyName = localStorage.getItem('tosil_babyName') || '우리아기';
        const nameEl = document.getElementById('invite-baby-name');
        if(nameEl) nameEl.innerText = babyName;

        // 앱 켜지고 1.5초 뒤에 기습적으로 스르륵 등장!
        setTimeout(() => {
            const sheet = document.getElementById('invite-bottom-sheet');
            if(sheet) sheet.style.display = 'flex';
        }, 1500);
    }
};

// 🌟 삭제되었던 '나중에 할게요' 닫기 기능 복구!
window.closeInviteSheet = function() {
    localStorage.setItem('tosil_has_seen_invite', 'true');
    const sheet = document.getElementById('invite-bottom-sheet');
    if(sheet) sheet.style.display = 'none';
};

// 🌟 카톡 초대 버튼 (완벽 연동)
window.sendKakaoInvite = function() {
    // 초대 버튼을 눌렀으니 다시는 안 뜨게 도장 쾅!
    localStorage.setItem('tosil_has_seen_invite', 'true');
    const sheet = document.getElementById('invite-bottom-sheet');
    if(sheet) sheet.style.display = 'none';
    
    // 카카오톡 공유 API (진짜 예쁜 카톡 템플릿 보내기)
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '💌 짝꿍의 육아메이트 초대장!',
                description: "여보! 우리 아기 맞춤형 육아 비서 [육아메이트]로 나랑 같이 육아 기록 공유하자 🤍 지금 바로 접속해 봐!",
                imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // 앱 로고 이미지
                link: {
                    mobileWebUrl: 'https://happy-baby0303.github.io/',
                    webUrl: 'https://happy-baby0303.github.io/',
                },
            },
            buttons: [
                {
                    title: '앱 열고 연동하기 👉',
                    link: {
                        mobileWebUrl: 'https://happy-baby0303.github.io/',
                        webUrl: 'https://happy-baby0303.github.io/',
                    },
                },
            ],
        });
        
        // 카톡 보내고 난 뒤에 연동 모달창 자동으로 띄워주기
        if(typeof openFamilySyncModal === 'function') openFamilySyncModal();
        
    } else {
        // 카카오 실패 시 보험
        const text = "여보! 우리 아기 맞춤형 육아 비서 [육아메이트]로 나랑 같이 육아 기록 공유하자 🤍 지금 바로 접속해 봐!";
        const url = "https://happy-baby0303.github.io/"; 
        
        if (navigator.share) {
            navigator.share({ title: '육아메이트 초대장', text: text, url: url })
            .then(() => { if(typeof openFamilySyncModal === 'function') openFamilySyncModal(); })
            .catch(console.error);
        } else {
            prompt("아래 초대장을 복사해서 카톡으로 보내주세요!", text + " " + url);
            if(typeof openFamilySyncModal === 'function') openFamilySyncModal();
        }
    }
};

// 🌟 홈 화면 방아쇠 (앱 켜질 때 알아서 띄우기)
document.addEventListener("DOMContentLoaded", () => {
    // 온보딩이 끝나서 아기 이름이 있을 때만 띄웁니다!
    if(localStorage.getItem('tosil_babyName')) {
        // 캐시 지우기용 테스트를 원하시면 여기 주석(//)을 해제하고 새로고침하세요!
         //localStorage.removeItem('tosil_has_seen_invite'); 
        
        setTimeout(() => {
            if(typeof window.showInviteNudge === 'function') window.showInviteNudge();
        }, 100);
    }
});

// ==========================================
// 👶 [홈 화면 통합 엔진] 아기 정보 & 맞춤형 큐레이션 & 시간대 인사말
// ==========================================
window.renderBabyInfo = function() {
    const savedName = localStorage.getItem('tosil_babyName');
    const savedDate = localStorage.getItem('tosil_startDate');
    const savedStage = localStorage.getItem('tosil_feedingStage');

    const nameEl = document.getElementById('res-baby-name');
    const ddayEl = document.getElementById('res-baby-dday');
    const msgEl = document.getElementById('daily-message');
    const missionNameEl = document.getElementById('mission-baby-name');

    // 1. 정보가 없을 때 (온보딩 전)
    if (!savedName || !savedDate) {
        if(nameEl) nameEl.innerText = "아기를 등록해주세요"; 
        if(ddayEl) ddayEl.innerText = "등록 전";
        if(typeof setDefaultMainAISensors === 'function') setDefaultMainAISensors();
        return;
    }

    // 2. 날짜 및 D-Day 계산
    const birthDate = new Date(savedDate);
    birthDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const monthAge = Math.floor(diffDays / 30.436875);

 // 3. 이름 & D-Day 뿌리기 (뱃지 크기 밸런스 조정)
if(nameEl) nameEl.innerText = `${savedName}의 공간`; 
if(missionNameEl) missionNameEl.innerText = savedName;
if(document.getElementById('play-dday-badge')) document.getElementById('play-dday-badge').innerText = diffDays > 0 ? diffDays : 0;

let ddayText = diffDays > 0 ? `D+${diffDays}일` : diffDays < 0 ? `D${diffDays}일` : `D-Day`;

// ✨ [수정됨] D-day 영역에는 D-day 숫자만 깔끔하게 넣기! (span 태그 삭제)
if(ddayEl) ddayEl.innerText = ddayText;

// ✨ 뱃지 상태 동적 계산 (도약기 vs 평온기)
let badgeText = "🚀 도약기"; // 기본값
if (typeof wwList !== 'undefined') {
    let currentWeek = Math.floor(diffDays / 7); // 현재 주차 계산
    let isWonderWeek = wwList.some(x => currentWeek >= (x.w - 1) && currentWeek <= (x.w + 1));
    badgeText = isWonderWeek ? "🚀 도약기" : "☀️ 평온기";
}

// ✨ [추가됨] 따로 만들어둔 좌측 상단 뱃지 영역으로 뱃지 텍스트 쏘기!
const wwBadgeEl = document.getElementById('wonderweek-badge');
if(wwBadgeEl) {
    wwBadgeEl.innerText = badgeText;
    wwBadgeEl.style.display = 'inline-block';
}

    // 4. 시간대별 감성 인사말 띄우기
    if(typeof applyTimeBasedGreeting === 'function') applyTimeBasedGreeting(savedName);

      // 6. 하단 위젯 & 센서 가동
        if(typeof updateMainAISensors === 'function') updateMainAISensors(monthAge); 

    // 7. 예방접종 배너 띄우기
   const bannerContainer = document.getElementById('health-smart-banner');
    if (bannerContainer) {
        bannerContainer.style.display = 'none';
    }
}; // <--- renderBabyInfo 함수 끝나는 곳

// 🚨 온보딩 체크 후 renderBabyInfo 호출 (앱 맨 밑쪽에 있는 DOMContentLoaded 덮어쓰기)
document.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem('tosil_babyName');
    const savedDate = localStorage.getItem('tosil_startDate');
    
    if (savedName && savedDate) {
        document.getElementById('onboarding-overlay').style.display = 'none';
        renderBabyInfo(); // 👈 여기서 하나로 통합된 엔진 실행!
    } else {
        document.getElementById('onboarding-overlay').style.display = 'flex';
    }
});

// ✨ 햅틱 진동 모듈 (모바일 기기에서 '톡!' 하는 손맛)
document.addEventListener('DOMContentLoaded', () => {
    // 앱 내의 모든 버튼과 클릭 가능한 카드들을 찾음
    const allButtons = document.querySelectorAll('button, .ai-matrix-card, .sym-btn, select, input[type="checkbox"]');
    
    allButtons.forEach(btn => {
        // 모바일 터치 시작 시 미세 진동 (안드로이드 지원)
        btn.addEventListener('touchstart', () => {
            if (navigator.vibrate) {
                navigator.vibrate(10); // 10ms의 아주 짧고 경쾌한 진동
            }
        }, { passive: true });
    });
});

// ==========================================
// 🍼 [툴박스] 퐁당맘마 (수유량/갈아타기) 모듈
// ==========================================
function calcFormulaAmount() {
    const wVal = document.getElementById('calc-weight').value;
    const cntVal = document.getElementById('calc-count').value;
    
    if (!wVal || !cntVal) return showToast("⚠️ 아기 몸무게와 수유 횟수를 입력해주세요!");

    const weight = parseFloat(wVal);
    const count = parseInt(cntVal);
    
    // ✨ 범위 계산 (몸무게 * 130 ~ 150ml)
    let minMl = Math.round(weight * 130);
    let maxMl = Math.round(weight * 150);
    const warningEl = document.getElementById('formula-warning');
    
    let displayTotal = "";
    let displayOne = "";
    
    // 🚨 1,000ml 안전 잠금장치 및 텍스트 유연화
    if (minMl >= 1000) {
        // 1. 최소량조차 1000을 넘는 우량아 (약 7.7kg 이상) -> 무조건 최대 1000으로 고정
        warningEl.style.display = 'block';
        displayTotal = "최대 1,000";
        displayOne = `최대 ${Math.round(1000 / count).toLocaleString()}`;
    } else if (maxMl > 1000) {
        // 2. 최대량만 1000을 넘는 경우 (약 6.7kg ~ 7.6kg) -> 최소치 ~ 최대 1000
        warningEl.style.display = 'block';
        displayTotal = `${minMl.toLocaleString()} ~ 최대 1,000`;
        displayOne = `${Math.round(minMl / count).toLocaleString()} ~ 최대 ${Math.round(1000 / count).toLocaleString()}`;
    } else {
        // 3. 1000을 넘지 않는 뽀시래기 시절 -> 정상 범위 출력
        warningEl.style.display = 'none';
        displayTotal = `${minMl.toLocaleString()} ~ ${maxMl.toLocaleString()}`;
        displayOne = `${Math.round(minMl / count).toLocaleString()} ~ ${Math.round(maxMl / count).toLocaleString()}`;
    }

    // ✨ 결과 출력
    document.getElementById('res-total-ml').innerText = displayTotal;
    document.getElementById('res-one-ml').innerText = displayOne;
    
    document.getElementById('formula-amount-result').style.display = 'block';
    
    // 몸무게 동기화
    localStorage.setItem('tosil_latest_weight', weight);
}

// 퐁당퐁당 상태 변수
let currentPongMode = 'ratio'; // 'ratio'(비율 섞기) or 'count'(횟수 섞기)

function switchPongTab(mode) {
    currentPongMode = mode;
    const tabRatio = document.getElementById('pong-tab-ratio');
    const tabCount = document.getElementById('pong-tab-count');
    const desc = document.getElementById('pong-desc');
    const label = document.getElementById('pong-input-label');
    const input = document.getElementById('pong-input-val');
    const unit = document.getElementById('pong-input-unit');

    // 🚨 탭 바꿀 때 무조건 입력값 리셋! (200회 버그 해결)
    input.value = '';

    // 탭 디자인 및 안내 문구 변경
    if (mode === 'ratio') {
        tabRatio.style.background = '#FFFFFF'; tabRatio.style.color = '#191F28'; tabRatio.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
        tabCount.style.background = 'transparent'; tabCount.style.color = '#8B95A1'; tabCount.style.boxShadow = 'none';
        
        desc.innerHTML = '💡 <strong>비율 섞기 (조유량이 같을 때)</strong><br>스푼당 물의 양(조유량)이 <b>같은</b> 분유끼리 바꿀 때만 사용하세요!<br>한 젖병에 가루를 비율대로 섞어 먹이는 방식입니다.';
        label.innerText = '1회 총 수유량';
        input.placeholder = '예: 160';
        unit.innerText = 'ml';
    } else {
        tabCount.style.background = '#FFFFFF'; tabCount.style.color = '#191F28'; tabCount.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
        tabRatio.style.background = 'transparent'; tabRatio.style.color = '#8B95A1'; tabRatio.style.boxShadow = 'none';
        
        desc.innerHTML = '🚨 <strong>교차 수유하기 (조유량이 다를 때)</strong><br>조유량이 <b>다른</b> 분유는 가루를 섞으면 농도가 깨져 배앓이를 해요.<br>꼭 젖병 통째로 횟수를 교차해서 먹여주세요!';
        label.innerText = '하루 총 수유 횟수';
        input.placeholder = '예: 5';
        unit.innerText = '회 (병)';
    }

    // 결과창 숨기기 & 칩 리셋
    document.getElementById('pong-result').style.display = 'none';
    document.querySelectorAll('.pong-btn').forEach(b => {
        b.style.background = 'var(--bg-card)';
        b.style.color = 'var(--text-m)';
        b.style.border = '1px solid var(--border)';
    });
}

function calcPong(step, btnEl) {
    // 버튼 UI 업데이트
    document.querySelectorAll('.pong-btn').forEach(b => {
        b.style.background = 'var(--bg-card)';
        b.style.color = 'var(--text-m)';
        b.style.border = '1px solid var(--border)';
    });
    btnEl.style.background = '#F0F7FF';
    btnEl.style.color = '#3182F6';
    btnEl.style.border = '1px solid #3182F6';

    const inputVal = parseInt(document.getElementById('pong-input-val').value);
    
    if (!inputVal) {
        return showToast(currentPongMode === 'ratio' ? "⚠️ 1회 수유량(ml)을 입력해주세요!" : "⚠️ 하루 총 수유 횟수를 입력해주세요!");
    }

    const titleEl = document.getElementById('pong-res-title');
    const oldValEl = document.getElementById('pong-old-val');
    const newValEl = document.getElementById('pong-new-val');
    const oldUnitEl = document.getElementById('pong-old-unit');
    const newUnitEl = document.getElementById('pong-new-unit');

    if (currentPongMode === 'ratio') {
        // [비율 가루 섞기]
        let newRatio = step === 1 ? 0.3 : (step === 2 ? 0.5 : 0.7);
        const newMl = Math.round(inputVal * newRatio);
        const oldMl = inputVal - newMl;

        titleEl.innerText = "한 젖병에 이렇게 가루를 타주세요!";
        oldValEl.innerText = oldMl; newValEl.innerText = newMl;
        oldUnitEl.innerText = 'ml'; newUnitEl.innerText = 'ml';
    } else {
        // [병 횟수 교차하기]
        let newCount = 0;
        if (inputVal === 4) {
            newCount = step === 1 ? 1 : (step === 2 ? 2 : 3);
        } else if (inputVal === 5) {
            newCount = step === 1 ? 1 : (step === 2 ? 2 : 4);
        } else if (inputVal >= 6) {
            newCount = step === 1 ? 2 : (step === 2 ? 3 : inputVal - 1);
        } else {
            newCount = step; // 수유 횟수가 너무 적을 경우 예외처리
        }
        
        const oldCount = Math.max(inputVal - newCount, 0);

        titleEl.innerText = `오늘 하루 총 ${inputVal}회 중, 이렇게 교차로 먹이세요!`;
        oldValEl.innerText = oldCount; newValEl.innerText = newCount;
        oldUnitEl.innerText = '회'; newUnitEl.innerText = '회';
    }

    document.getElementById('pong-result').style.display = 'block';
}

window.calcFormulaAmount = calcFormulaAmount;
window.calcPong = calcPong;
window.switchPongTab = switchPongTab;

// ==========================================
// 🗓️ [툴박스] 언제깠지 (개봉일 추적기) 모듈 + 편의성 마스터 패치
// ==========================================
window.currentOpenFilter = 'all'; // 현재 선택된 필터 탭 기억하기

window.setOpenFilter = function(filter) {
    window.currentOpenFilter = filter;
    renderOpenRecords();
};

// 1. [기존 유지] 아이템 추가 기능 (이름 스마트 압축 포함)
window.addOpenRecord = function() {
    const typeSelect = document.getElementById('open-item-type');
    const dateInput = document.getElementById('open-item-date');
    
    const typeVal = typeSelect.value;
    const optionText = typeSelect.options[typeSelect.selectedIndex].text;
    
    // 이모지와 글자 분리
    const parts = optionText.split(' ');
    const emoji = parts[0]; 
    let typeText = parts.slice(1).join(' '); 
    
    // 길고 안 예쁜 이름을 스마트하게 압축!
    typeText = typeText.split('/')[0];
    typeText = typeText.split('(')[0];
    typeText = typeText.trim();
    
    const dateVal = dateInput.value;
    
    if (!dateVal) return showToast("⚠️ 뜯은 날짜를 선택해주세요!");

    // 권장 유통기한(일수) 맵핑
    const limitMap = {
        'formula': 21,    // 분유: 3주
        'fever': 30,      // 시럽약: 1달
        'tub_oint': 30,   // 소분 연고: 1달
        'tube_oint': 180, // 튜브 연고: 6개월
        'eye_drop': 30,   // 안약: 1달
        'cream': 180,     // 로션/크림: 6개월
        'puree': 2,       // 퓨레: 2일
        'wipe': 30        // 소독티슈: 1달
    };

    const newRecord = {
        id: 'open_' + new Date().getTime(),
        type: typeVal,
        name: typeText,
        emoji: emoji,
        openDate: dateVal,
        limitDays: limitMap[typeVal]
    };

    let records = JSON.parse(localStorage.getItem('tosil_open_records')) || [];
    records.push(newRecord);
    localStorage.setItem('tosil_open_records', JSON.stringify(records));
    
    window.currentOpenFilter = 'all'; 
    renderOpenRecords();
    showToast("✍️ 라벨 스티커가 등록되었습니다!");
};

// 2. [기존 유지] 개별 삭제 기능
window.deleteOpenRecord = function(id) {
    showConfirm("이 기록을 삭제하시겠습니까?", function() {
        let records = JSON.parse(localStorage.getItem('tosil_open_records')) || [];
        records = records.filter(r => r.id !== id);
        localStorage.setItem('tosil_open_records', JSON.stringify(records));
        renderOpenRecords();
        showToast("🗑️ 삭제되었습니다!");
    }, "🗑️", "삭제", "#F04452");
};

// 3. [신규 패치] 새로 뜯음(리필) 기능
window.renewOpenRecord = function(id) {
    showConfirm("이 제품을 오늘 날짜로 새로 뜯으셨나요?", function() {
        let records = JSON.parse(localStorage.getItem('tosil_open_records')) || [];
        const todayStr = new Date().toISOString().split('T')[0];

        records = records.map(record => {
            if (record.id === id) {
                return { ...record, openDate: todayStr };
            }
            return record;
        });

        localStorage.setItem('tosil_open_records', JSON.stringify(records));
        window.renderOpenRecords();
        showToast("🔄 오늘 날짜로 새로 갱신되었습니다!");
    }, "🔄", "새로 뜯음", "#3182F6");
};

// 4. [신규 패치] 기한 만료템 한 번에 지우기 기능
window.clearExpiredRecords = function() {
    showConfirm("기한이 지난 아이템을 모두 비우시겠습니까?", function() {
        let records = JSON.parse(localStorage.getItem('tosil_open_records')) || [];
        
        const validRecords = records.filter(record => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const openDate = new Date(record.openDate);
            openDate.setHours(0,0,0,0);
            
            const passedDays = Math.floor((today - openDate) / (1000 * 60 * 60 * 24));
            const remainDays = record.limitDays - passedDays;
            
            return remainDays >= 0; // 0일 이상 남은 것만 통과
        });

        const deletedCount = records.length - validRecords.length;

        localStorage.setItem('tosil_open_records', JSON.stringify(validRecords));
        window.renderOpenRecords();
        showToast(`🧹 ${deletedCount}개의 만료템을 깔끔하게 치웠습니다!`);
    }, "🧹", "비우기", "#F04452");
};

// 5. [수정 패치] 언제깠지 화면 렌더링 (필터 + 리필버튼 + 대청소버튼 통합)
window.renderOpenRecords = function() {
    const container = document.getElementById('open-list-container');
    if (!container) return;

    let records = JSON.parse(localStorage.getItem('tosil_open_records')) || [];
    
    const dateInput = document.getElementById('open-item-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (records.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; background:var(--bg-sub); border-radius:16px; border:1px dashed var(--border);">
                <div style="font-size:24px; margin-bottom:10px;">✨</div>
                <div style="font-size:13.5px; font-weight:800; color:var(--text-s);">아직 기록된 개봉품이 없습니다.<br>통에 적지 말고 여기에 저장하세요!</div>
            </div>`;
        return;
    }

    const catGroupMap = {
        'formula': 'food', 'puree': 'food',
        'fever': 'med', 'eye_drop': 'med',
        'tub_oint': 'skin', 'tube_oint': 'skin', 'cream': 'skin',
        'wipe': 'hygiene'
    };
    const catGroupNames = {
        'food': '🍼 수유/식품', 'med': '💊 약/영양제', 'skin': '🧴 연고/스킨케어', 'hygiene': '🧻 위생용품'
    };

    let existingGroups = new Set();
    records.forEach(r => existingGroups.add(catGroupMap[r.type] || 'etc'));

    let html = `<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:12px; scrollbar-width:none; border-bottom:1px solid var(--border);">`;
    
    const isAllActive = window.currentOpenFilter === 'all';
    html += `<button onclick="window.setOpenFilter('all')" style="flex-shrink:0; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:900; cursor:pointer; border:1px solid ${isAllActive ? '#3182F6' : 'var(--border)'}; background:${isAllActive ? '#E8F3FF' : 'var(--bg-card)'}; color:${isAllActive ? '#3182F6' : 'var(--text-s)'}; transition:all 0.2s;">전체 보기</button>`;
    
    Array.from(existingGroups).sort().forEach(group => {
        const isActive = window.currentOpenFilter === group;
        html += `<button onclick="window.setOpenFilter('${group}')" style="flex-shrink:0; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer; border:1px solid ${isActive ? '#3182F6' : 'var(--border)'}; background:${isActive ? '#E8F3FF' : 'var(--bg-card)'}; color:${isActive ? '#3182F6' : 'var(--text-s)'}; transition:all 0.2s;">${catGroupNames[group]}</button>`;
    });
    html += `</div>`;

    let filteredRecords = window.currentOpenFilter === 'all' ? records : records.filter(r => catGroupMap[r.type] === window.currentOpenFilter);

    if (filteredRecords.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:var(--text-s); font-size:13px; font-weight:700;">해당 카테고리의 품목이 없습니다.</div>`;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    
    filteredRecords.sort((a, b) => {
        const endA = new Date(a.openDate).getTime() + (a.limitDays * 24 * 60 * 60 * 1000);
        const endB = new Date(b.openDate).getTime() + (b.limitDays * 24 * 60 * 60 * 1000);
        return endA - endB;
    });

    let expiredCount = 0; // 🚨 만료 아이템 카운팅

    filteredRecords.forEach(r => {
        const openD = new Date(r.openDate);
        openD.setHours(0,0,0,0);
        
        const passedDays = Math.floor((today - openD) / (1000 * 60 * 60 * 24));
        const remainDays = r.limitDays - passedDays;

        let statusHtml = '';
        let borderColor = 'var(--border)';

        if (remainDays < 0) {
            statusHtml = `<span style="color:#F04452; font-weight:900; font-size:12.5px; white-space:nowrap;">🚨 기한 만료</span>`;
            borderColor = '#FCA5A5';
            expiredCount++; 
        } else if (remainDays <= 5) {
            statusHtml = `<span style="color:#FF823A; font-weight:800; font-size:12.5px; white-space:nowrap;">⚠️ D-${remainDays}</span>`;
            borderColor = '#FDBA74';
        } else {
            statusHtml = `<span style="color:#00B37A; font-weight:800; font-size:12.5px; white-space:nowrap;">✅ D-${remainDays} (여유)</span>`;
        }

       // ✨ [수정] 날짜 텍스트가 좁으면 아랫줄로 넘어가도록 flex-wrap: wrap 적용!
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:#FFFFFF; border:1px solid ${borderColor}; border-radius:16px; margin-bottom:8px; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                <div style="font-size:24px; background:var(--bg-sub); width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${r.emoji}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14.5px; font-weight:900; color:var(--text-m); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name}</div>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px; margin-top:2px;">
                        ${statusHtml}
                        <span style="font-size:11px; color:var(--text-s); font-weight:600; word-break:keep-all;">(오픈: ${r.openDate})</span>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0; margin-left:8px;">
                <button onclick="window.renewOpenRecord('${r.id}')" style="background:#E8F3FF; border:1px solid #B1D6FF; border-radius:10px; width:40px; height:40px; color:#3182F6; cursor:pointer; font-size:16px; display:flex; justify-content:center; align-items:center; transition:0.2s;" title="오늘 새로 뜯음">🔄</button>
                <button onclick="window.deleteOpenRecord('${r.id}')" style="background:#F2F5F8; border:none; border-radius:10px; width:40px; height:40px; color:#8B95A1; cursor:pointer; font-size:15px; display:flex; justify-content:center; align-items:center; transition:0.2s;" title="삭제">❌</button>
            </div>
        </div>`;
    });

    if (expiredCount > 0) {
        html += `
        <button onclick="window.clearExpiredRecords()" style="width:100%; padding:14px; margin-top:12px; background:#FFF0F1; color:#F04452; border:1px dashed #F04452; border-radius:14px; font-size:13.5px; font-weight:900; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:6px;">
            🧹 기한 지난 ${expiredCount}개 한 번에 비우기
        </button>`;
    }

    container.innerHTML = html;
};

window.addOpenRecord = addOpenRecord;
window.deleteOpenRecord = deleteOpenRecord;
window.renderOpenRecords = renderOpenRecords;

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderOpenRecords, 300);
});

// ==========================================
// 💡 언제깠지 - 동적 말풍선 가이드 엔진
// ==========================================
window.updateOpenItemGuide = function() {
    const val = document.getElementById('open-item-type').value;
    const guideEl = document.getElementById('open-item-guide');
    
    const guides = {
        'formula': '💡 습기에 취약해요! 개봉 후 <strong>3주(21일) 이내</strong> 소진을 권장합니다.',
        'fever': '💡 처방받은 약은 1주, 시판 병 시럽은 <strong>1달(30일) 권장</strong>',
        'tub_oint': '💡 약국에서 덜어준 둥근 통 연고는 <strong>1달(30일) 이내</strong>',
        'tube_oint': '💡 밀봉된 튜브형 연고(비판텐 등)는 <strong>6개월(180일)</strong>',
        'eye_drop': '🚨 세균 감염 위험! 개봉 후 무조건 <strong>1달(30일) 이내</strong>',
        'cream': '💡 아기 피부에 직접 닿는 화장품은 개봉 후 <strong>6개월 권장</strong>',
        'puree': '💡 침이 닿지 않게 덜어서 냉장 보관 시 <strong>2일 이내</strong>',
        'wipe': '💡 수분이 마르고 세균 번식 위험이 있어 <strong>1달 권장</strong>'
    };

    if(guideEl && guides[val]) {
        guideEl.innerHTML = guides[val];
        
        // 🚨 핵심 패치: 단어 단위 줄바꿈 및 위아래 여백 강제 고정!
        guideEl.style.wordBreak = 'keep-all';
        guideEl.style.lineHeight = '1.5';
        guideEl.style.padding = '14px 16px'; 
        
        // 위험한 안약이나 퓨레는 빨간색 경고창으로 띄워주기!
        if(val === 'eye_drop' || val === 'puree') {
            guideEl.style.color = '#D32F2F';
            guideEl.style.background = '#FFF0F1';
        } else {
            guideEl.style.color = '#3182F6';
            guideEl.style.background = '#E8F3FF';
        }
    }
};

// 앱 로딩 시 말풍선 한번 띄워두기
document.addEventListener("DOMContentLoaded", () => {
    if(typeof window.updateOpenItemGuide === 'function') window.updateOpenItemGuide();
});

// ==========================================
// 🎮 짝꿍 육아 레벨링 시스템 (부부 공용 + 레벨업 보상)
// ==========================================

// 1. 레벨별 요구 경험치, 공용 칭호, 그리고 🎁[레벨업 보상] 추가!
const mateLevelData = [
    { level: 1, reqExp: 0, title: "초보 육아메이트 🐣", reward: null },
    { level: 2, reqExp: 100, title: "기저귀 교환 요정 🧚", reward: null },
    { level: 3, reqExp: 300, title: "분유 타기 장인 🍼", reward: "☕ 달콤한 커피 타임 (배우자 결제)" },
    { level: 4, reqExp: 600, title: "트림 유도 마스터 🌬️", reward: null },
    { level: 5, reqExp: 1000, title: "수면 의식 지배자 🌙", reward: "💆 시원한 전신 마사지 30분권" },
    { level: 6, reqExp: 1500, title: "이유식 마스터셰프 👨‍🍳", reward: null },
    { level: 7, reqExp: 2200, title: "인간 놀이기구 🎢", reward: "🎮 나만의 힐링/자유시간 2시간!" },
    { level: 8, reqExp: 3000, title: "가족의 든든한 방패 🛡️", reward: null },
    { level: 9, reqExp: 4200, title: "육아의 신 👼", reward: "🍗 오늘 저녁은 내가 원하는 배달 음식!" },
    { level: 10, reqExp: 6000, title: "전설의 빛과 소금 ✨ (MAX)", reward: "🎫 묻지도 따지지도 않는 절대 소원권 1장!" }
];

function updateMateLevelUI() {
    let currentExp = parseInt(localStorage.getItem('tosil_partner_exp')) || parseInt(localStorage.getItem('tosil_dad_exp')) || 0;

    let currentLevelObj = mateLevelData[0];
    let nextLevelObj = null;

    // 현재 경험치로 내 레벨 찾기
    for (let i = 0; i < mateLevelData.length; i++) {
        if (currentExp >= mateLevelData[i].reqExp) {
            currentLevelObj = mateLevelData[i];
            nextLevelObj = mateLevelData[i + 1] || null;
        } else { break; }
    }

    let levelBadge = document.getElementById('dad-level-badge');
    let levelTitle = document.getElementById('dad-level-title');
    let expText = document.getElementById('dad-exp-text');
    let expBar = document.getElementById('dad-exp-bar');

    if(levelBadge) {
        levelBadge.innerText = `Lv.${currentLevelObj.level}`;
        levelTitle.innerText = currentLevelObj.title;

        if (nextLevelObj) {
            let levelExp = currentExp - currentLevelObj.reqExp;
            let reqLevelExp = nextLevelObj.reqExp - currentLevelObj.reqExp;
            let percentExp = Math.floor((levelExp / reqLevelExp) * 100);

            expText.innerText = `${currentExp} / ${nextLevelObj.reqExp} EXP`;
            expBar.style.width = `${percentExp}%`;
        } else {
            expText.innerText = `${currentExp} (MAX)`;
            expBar.style.width = `100%`;
        }
    }
}

function gainMateExp(amount) {
    let currentExp = parseInt(localStorage.getItem('tosil_partner_exp')) || parseInt(localStorage.getItem('tosil_dad_exp')) || 0;
    
    // 🌟 경험치 오르기 전의 '원래 레벨' 계산
    let oldLevel = 1;
    for (let i = 0; i < mateLevelData.length; i++) {
        if (currentExp >= mateLevelData[i].reqExp) oldLevel = mateLevelData[i].level;
    }

    // 경험치 추가!
    currentExp += amount;
    localStorage.setItem('tosil_partner_exp', currentExp);
    localStorage.setItem('tosil_dad_exp', currentExp); // 혹시 모를 호환성 유지
    updateMateLevelUI();

    // 🌟 경험치 오른 후의 '새로운 레벨' 계산
    let newLevel = 1;
    let newReward = null;
    for (let i = 0; i < mateLevelData.length; i++) {
        if (currentExp >= mateLevelData[i].reqExp) {
            newLevel = mateLevelData[i].level;
            if (mateLevelData[i].reward) newReward = mateLevelData[i].reward;
        }
    }

    // 🚀 만약 레벨이 올랐다면 축하 팝업 띄우기!
    if (newLevel > oldLevel) {
        setTimeout(() => {
            let congratsMsg = `🎊 레벨업! [Lv.${newLevel}] 달성! 🎊`;
            if (newReward && (mateLevelData[newLevel-1].reward !== null)) {
                congratsMsg += `\n\n🎁 특별 보상 언락:\n[${newReward}]\n지금 바로 배우자에게 청구하세요!`;
            } else {
                congratsMsg += `\n\n육아 마스터를 향해 한 걸음 더 나아갔습니다!`;
            }
            alert(congratsMsg);
        }, 300); // 게이지 차는 거 보여주고 0.3초 뒤에 팝업 띄움
    }
}

document.addEventListener("DOMContentLoaded", () => { updateMateLevelUI(); });

// ==========================================
// 💌 바통터치 완료 (차등 경험치 + 이스터에그)
// ==========================================
async function completeBaton(id) {
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return;
    
    const taskText = records[idx].text || "";
    const reward = records[idx].reward; 
    records.splice(idx, 1); 
    await saveBatonToFirebase(records);

    let earnedExp = 20; 
    let expMsg = "(+20 EXP 획득!)";

    if (taskText.includes("새벽 수유")) {
        earnedExp = 50; expMsg = "(난이도 극악! +50 EXP 획득🔥)";
    } else if (taskText.includes("아기 재우기")) {
        earnedExp = 40; expMsg = "(체력 소모! +40 EXP 획득💪)";
    } else if (taskText.includes("장보기")) {
        earnedExp = 30; expMsg = "(가족의 식량 보급! +30 EXP 획득🛒)";
    } else if (taskText.includes("기저귀")) {
        earnedExp = 15; expMsg = "(기본 소양! +15 EXP 획득💩)";
    }

    if (taskText.includes("커피") || taskText.includes("마사지") || taskText.includes("자유시간") || taskText.includes("쉬어")) {
        earnedExp = 100;
        expMsg = "(🎉 히든 퀘스트 달성! 짝꿍 감동 보너스 +100 EXP 잭팟!! 🎊)";
    }

    if (reward && reward !== "없음") {
        showToast(`🎉 미션 해결! ${expMsg}\n약속된 보상 [${reward}]을(를) 당당히 요구하세요! 👍`);
    } else {
        showToast(`🎉 미션 해결 완료! ${expMsg}`);
    }

    // 경험치 지급 쏴라!
    gainMateExp(earnedExp); 
}

// ==========================================
// 💌 주간 육아 리포트 열고 닫는 엔진
// ==========================================
window.openWeeklyReport = function() {
    const modal = document.getElementById('weekly-report-modal');
    if(modal) {
        modal.style.display = 'flex';
        // 💡 선택 사항이었던 폭죽 효과 적용! (앞서 추가한 shootConfetti 함수가 있으면 실행됨)
        if(typeof window.shootConfetti === 'function') {
            window.shootConfetti();
        }
    } else {
        console.error("주간 리포트 모달창을 찾을 수 없습니다.");
    }
};

window.closeWeeklyReport = function() {
    const modal = document.getElementById('weekly-report-modal');
    if(modal) {
        modal.style.display = 'none';
    }
};

// ==========================================
// 💌 주간 육아 리포트 자동 계산 & 스케줄링 엔진 (정식 런칭용)
// ==========================================
window.initWeeklyReport = function() {
    const reportBtn = document.getElementById('weekly-report-btn');
    if (!reportBtn) return;

    // 1. 일요일(0)과 월요일(1)에만 노출되도록 스케줄링
    const dayOfWeek = new Date().getDay();
    
    // 일, 월요일이 아니면 숨기고 함수 종료!
    if (dayOfWeek !== 0 && dayOfWeek !== 1) {
        reportBtn.style.display = 'none'; 
        return; 
    }

    // 2. 엄마/아빠 모드에 따른 카피라이팅 & 색상 변경
    const isDad = document.body.classList.contains('mode-dad') || localStorage.getItem('user_role') === 'dad';
    const titleEl = document.getElementById('weekly-btn-title');
    const descEl = document.getElementById('weekly-btn-desc');
    const iconEl = document.getElementById('weekly-btn-icon');

    if (isDad) {
        // 👨 아빠 버전
        reportBtn.style.background = 'linear-gradient(135deg, #E8F3FF, #D0E6FF)';
        reportBtn.style.borderColor = '#B1D6FF';
        if(titleEl) { titleEl.style.color = '#3182F6'; titleEl.innerText = '토닥토닥, 이번 주도 빛났어요 ✨'; }
        if(descEl) { descEl.style.color = '#1C64F2'; descEl.innerText = '아빠의 다정한 일주일 요약'; }
        if(iconEl) { iconEl.innerText = '👨‍🍼'; }
    } else {
        // 👩 엄마 버전
        reportBtn.style.background = 'linear-gradient(135deg, #FFF0F1, #FFE5E5)';
        reportBtn.style.borderColor = '#FFD1D1';
        if(titleEl) { titleEl.style.color = '#F04452'; titleEl.innerText = '사랑 듬뿍 담긴 일주일 요약💖'; }
        if(descEl) { descEl.style.color = '#D32F2F'; descEl.innerText = '엄마의 따뜻한 일주일 요약'; }
        if(iconEl) { iconEl.innerText = '💌'; }
    }

    // 세팅이 끝났으니 화면에 보여줍니다.
    reportBtn.style.display = 'flex';

    // 3. 기록된 데이터 통계 계산
    let trackers = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    let oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000); 
    
    let feedCount = 0; let diaperCount = 0;
    trackers.forEach(t => {
        if (t.timestamp >= oneWeekAgo) {
            if (t.type === 'feed') feedCount++;
            if (t.type === 'diaper') diaperCount++;
        }
    });

    let batonCount = parseInt(localStorage.getItem('tosil_baton_done_count')) || 0;

    const elFeed = document.getElementById('rep-feed');
    const elDiaper = document.getElementById('rep-diaper');
    const elBaton = document.getElementById('rep-baton');

    if(elFeed) elFeed.innerText = feedCount;
    if(elDiaper) elDiaper.innerText = diaperCount;
    if(elBaton) elBaton.innerText = batonCount;
};

// 🚨 [필수] 앱이 처음 켜질 때 위 함수를 자동으로 실행해 주는 스위치!
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.initWeeklyReport, 100); 
});

// ==========================================
// 🔐 카카오 로그인 & 로그아웃 엔진 (에러 복구 완료)
// ==========================================
window.loginWithKakao = function() {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        alert("카카오 통신망이 아직 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
    }

    Kakao.Auth.login({
        // 🚨 핵심: 브라우저 충돌을 막기 위해 false로 원상복구! 
        throughTalk: false, 
        success: function(authObj) {
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(res) {
                    const nickname = res.properties.nickname;
                    const profileImage = res.properties.profile_image;
                    const kakaoId = res.id;

                    localStorage.setItem('kakao_nickname', nickname);
                    localStorage.setItem('kakao_id', kakaoId); 
                    if (profileImage) {
                        localStorage.setItem('kakao_profile_image', profileImage);
                    }

                    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null); 
                    if (!db) {
                        window.showToast(`🎉 ${nickname}님 환영합니다!`);
                        window.renderSettingsTab();
                        return;
                    }

                    const userRef = db.collection('kakao_users').doc(String(kakaoId));

                    userRef.get().then((doc) => {
                        const currentLocalSyncCode = localStorage.getItem('family_sync_code');

                        if (doc.exists && doc.data().family_sync_code) {
                            const restoredCode = doc.data().family_sync_code;
                            localStorage.setItem('family_sync_code', restoredCode);
                            window.showToast(`🎉 ${nickname}님 환영합니다! 데이터를 100% 복구하는 중입니다...✨`);
                            setTimeout(() => { location.reload(); }, 1500);
                        } else if (currentLocalSyncCode) {
                            userRef.set({
                                family_sync_code: currentLocalSyncCode,
                                nickname: nickname
                            }, { merge: true });
                            window.showToast(`🎉 ${nickname}님 환영합니다! (클라우드 백업 완료☁️)`);
                            window.renderSettingsTab(); 
                        } else {
                            window.showToast(`🎉 ${nickname}님 환영합니다!`);
                            window.renderSettingsTab(); 
                        }
                    }).catch((error) => {
                        console.error("자동 복구 에러:", error);
                        window.showToast(`🎉 ${nickname}님 환영합니다!`);
                        window.renderSettingsTab();
                    });
                },
                fail: function(error) {
                    alert('프로필 정보를 가져오는데 실패했습니다: ' + JSON.stringify(error));
                }
            });
        },
        fail: function(err) {
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    });
};
// ==========================================
// ⚙️ [설정 탭] 전체 UI 렌더링 엔진 (엄마/아빠 역할 스위치 & 디자인 최적화)
// ==========================================
window.renderSettingsTab = function() {
    const container = document.getElementById('tab-settings');
    if (!container) return;

    // 🌟 1. 로그인 상태 확인해서 프로필 화면 그리기
    const savedNickname = localStorage.getItem('kakao_nickname');
    const savedProfileImg = localStorage.getItem('kakao_profile_image');
    let profileHtml = '';

    if (savedNickname) {
        const imgTag = savedProfileImg 
            ? `<img src="${savedProfileImg}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
            : `👤`;
            
        profileHtml = `
            <div style="display: flex; align-items: center; gap: 16px; background: var(--bg-card); padding: 16px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: #F2F5F8; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; border: 1px solid #E5E8EB;">
                    ${imgTag}
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 12px; font-weight: 800; color: #3182F6; margin-bottom: 4px;"> 육아메이트 인증 완료</div>
                    <div style="font-size: 16px; font-weight: 900; color: var(--text-m);">${savedNickname} <span style="font-size: 13.5px; font-weight: 600; color: var(--text-s);">님</span></div>
                </div>
                <button onclick="window.logoutKakao()" style="padding: 6px 12px; border-radius: 8px; background: #F2F5F8; color: #8B95A1; font-size: 12px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s;">
                    로그아웃
                </button>
            </div>
        `;
    } else {
        profileHtml = `
            <div style="background: var(--bg-card); padding: 20px 16px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); text-align: center;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: #F2F5F8; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px auto;">👤</div>
                <div style="font-size: 12px; font-weight: 800; color: #8B95A1; margin-bottom: 4px;">내 정보 안전하게 보관하기</div>
                <div style="font-size: 15.5px; font-weight: 900; color: var(--text-m); margin-bottom: 16px;">로그인이 필요합니다</div>
                <button onclick="window.loginWithKakao()" style="width: 100%; padding: 14px; border-radius: 12px; background: #FEE500; color: #191F28; font-size: 14.5px; font-weight: 900; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 2px 6px rgba(254,229,0,0.2);">
                    💬 카카오로 시작하기
                </button>
            </div>
        `;
    }

    // 🌟 2. 가족 연동 섹션 
    const syncCode = localStorage.getItem('family_sync_code');
    let syncHtml = '';

    if (syncCode) {
        syncHtml = `
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m);">👨‍👩‍👧 가족 연동 완료</div>
                    <span style="background: #EBF4FF; color: #3182F6; font-size: 11px; font-weight: 900; padding: 4px 8px; border-radius: 8px;">상태: ON</span>
                </div>
                <div style="font-size: 12.5px; color: var(--text-s); font-weight: 600; margin-bottom: 12px;">현재 가족간 육아 데이터를 공유 중입니다.</div>
                
                <button onclick="window.safeUnlinkFamilySync()" style="width: 100%; padding: 12px; border-radius: 12px; background: #FFF0F1; color: #F04452; font-size: 13.5px; font-weight: 900; border: 1px solid #FFE5E8; cursor: pointer; box-shadow: 0 2px 4px rgba(240,68,82,0.05);">
                    🚨 연동 해제하기
                </button>
            </div>
        `;
    } else {
        syncHtml = `
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                <div style="font-size: 14.5px; font-weight: 900; color: var(--text-m); margin-bottom: 8px;">👨‍👩‍👧 짝꿍과 함께 육아하기</div>
                <div style="font-size: 12.5px; color: var(--text-s); font-weight: 600; margin-bottom: 16px; line-height: 1.4;">혼자 하는 육아는 너무 힘들어요.<br>지금 짝꿍을 초대해서 데이터를 공유하세요!</div>
                <button onclick="window.sendKakaoInvite()" style="width: 100%; padding: 14px; border-radius: 12px; background: #FEE500; color: #191F28; font-size: 14.5px; font-weight: 900; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(254,229,0,0.2); display: flex; justify-content: center; align-items: center; gap: 8px;">
                    💬 카카오톡으로 초대장 보내기
                </button>
            </div>
        `;
    }

    // 💡 현재 설정된 역할 가져오기 (기본값: 엄마)
    const currentRole = localStorage.getItem('user_role') || 'mom';

    // 🌟 3. 전체 화면 조립하기 
    container.innerHTML = `
        <div style="padding: 20px 20px 40px 20px;">
            <!-- 🔥 수정된 부분: 설정 타이틀 크기를 키우고 margin-bottom을 16px로 줄여 밀착! -->
            <div style="font-size: 26px; font-weight: 900; color: var(--text-m); margin-bottom: 16px; letter-spacing: -0.5px; padding-left: 4px;">설정</div>

            <!-- 계정 및 프로필 -->
            ${profileHtml}

            <!-- 가족 연동 섹션 -->
            ${syncHtml}

            <!-- 앱 설정 -->
            <div style="font-size: 13.5px; font-weight: 900; color: var(--text-s); margin-bottom: 12px; margin-left: 4px;">앱 설정</div>
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                
                <!-- 🔥 내 역할 (엄마/아빠) 토글 스위치 추가! 🔥 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border);">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">🧑‍🧑‍🧒 내 역할 설정</div>
                    <div style="display: flex; background: var(--bg-sub); border-radius: 10px; padding: 4px; border: 1px solid var(--border);">
                        <button onclick="window.changeUserRole('mom')" style="padding: 6px 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 900; cursor: pointer; transition: 0.2s; ${currentRole === 'mom' ? 'background:#FFF; color:#F04452; box-shadow:0 2px 6px rgba(0,0,0,0.05);' : 'background:transparent; color:#8B95A1;'}">엄마</button>
                        <button onclick="window.changeUserRole('dad')" style="padding: 6px 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 900; cursor: pointer; transition: 0.2s; ${currentRole === 'dad' ? 'background:#FFF; color:#3182F6; box-shadow:0 2px 6px rgba(0,0,0,0.05);' : 'background:transparent; color:#8B95A1;'}">아빠</button>
                    </div>
                </div>

                <div onclick="window.promptBabyInfo()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">👶 아기 정보 수정</div>
                    <div style="color: #8B95A1; font-size: 12px;">〉</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">🌙 다크 모드 (어두운 화면)</div>
                    <button onclick="window.toggleDarkMode(); window.renderSettingsTab();" style="padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-sub); color: var(--text-m); font-weight: 800; font-size: 12px; cursor: pointer;">
                        ${document.body.classList.contains('dark-mode') ? '켜짐 ON' : '꺼짐 OFF'}
                    </button>
                </div>
            </div>

            <!-- 데이터 관리 -->
            <div style="font-size: 13.5px; font-weight: 900; color: var(--text-s); margin-bottom: 12px; margin-left: 4px;">데이터 관리</div>
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                <div onclick="window.exportToExcel()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">📥 기록 데이터 엑셀 내보내기</div>
                </div>
                <div onclick="window.clearAllData()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: #F04452;">🗑️ 기록 데이터 초기화</div>
                </div>
            </div>

            <!-- 고객 지원 및 약관 -->
            <div style="font-size: 13.5px; font-weight: 900; color: var(--text-s); margin-bottom: 12px; margin-left: 4px;">고객 지원 및 약관</div>
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                <div onclick="window.open('https://www.instagram.com/ggoom_e2', '_blank')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">💬 인스타그램 DM으로 문의하기</div>
                    <div style="color: #8B95A1; font-size: 12px;">〉</div>
                </div>
                <div onclick="window.open('https://blog.naver.com/radiant_ly', '_blank')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">📝 육아메이트 블로그 구경하기</div>
                    <div style="color: #8B95A1; font-size: 12px;">〉</div>
                </div>
                <div onclick="location.href='privacy.html'" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">🛡️ 개인정보 처리방침 및 이용약관</div>
                    <div style="color: #8B95A1; font-size: 12px;">〉</div>
                </div>
             
            <!-- 🔥 [수정] 버전 정보 영역에 비밀 스위치(handleSecretAdminClick) 장착! 🔥 -->
                <div onclick="window.handleSecretAdminClick()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; -webkit-tap-highlight-color: transparent;">
                    <div style="font-size: 14.5px; font-weight: 800; color: var(--text-m);">현재 버전</div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #3182F6;">v1.0.0 최신</div>
                </div>
            </div>

            <!-- 위험 구역 (회원 탈퇴) -->
            ${savedNickname ? `
                <div style="text-align: center; margin-bottom: 40px;">
                    <button onclick="window.unlinkKakao()" style="background: none; border: none; color: #8B95A1; font-size: 12px; font-weight: 700; text-decoration: underline; cursor: pointer;">
                        회원 탈퇴 (카카오 연결 끊기 및 데이터 삭제)
                    </button>
                </div>
            ` : ''}
            
            <div style="text-align: center; color: var(--text-s); font-size: 11px; font-weight: 700; margin-bottom: 40px;">
                Made with 🤍 for our baby
            </div>
        </div>
    `;
};

// ==========================================
// 🌟 역할 변경 기능 함수 (설정 탭 스위치)
// ==========================================
window.changeUserRole = function(role) {
    localStorage.setItem('user_role', role); 
    if(typeof window.renderSettingsTab === 'function') window.renderSettingsTab(); 
    
    if (role === 'dad') {
        document.body.classList.add('mode-dad');
        window.showToast("👨‍🍼 아빠 모드로 변경되었습니다.");
    } else {
        document.body.classList.remove('mode-dad');
        window.showToast("👩‍🍼 엄마 모드로 변경되었습니다.");
    }

    // 화면 새로고침 (에러 안 나게 방어 코드 추가)
    if(typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
    if(typeof window.renderDadQuests === 'function') window.renderDadQuests();
    if(typeof window.updateDadBriefing === 'function') window.updateDadBriefing();
    if(typeof window.renderHomeBatonList === 'function') window.renderHomeBatonList();
};

// ==========================================
// ⚡ 기저귀 퀵버튼 (시트 바로 열기) 엔진
// ==========================================
window.saveQuickBoth = function() {
    window.openTrackerSheet('diaper', null, '둘 다');
};

window.saveQuickPee = function() {
    window.openTrackerSheet('diaper', null, '소변');
};

window.saveQuickPoop = function() {
    window.openTrackerSheet('diaper', null, '대변');
};

// 지금 누른 게 '대변'인지 '둘 다'인지 기억해두는 메모장
window.currentPoopType = '대변'; 

window.openPoopAI = function(type) {
    window.currentPoopType = type; // 누른 버튼 종류 기억하기
    
    // 파트너님이 원래 만들어두신 AI 판독기 여는 함수 그대로 실행!
    if(typeof showPoopAI === 'function') {
        showPoopAI(); 
    }
};
// ==========================================
// 🔗 부부 연동 해지 기능
// ==========================================
window.unlinkFamilySync = function() {
    showConfirm(
        "정말 가족 연동을 해지하시겠습니까?<br><span style='font-size:12px; color:#8B95A1; font-weight:600;'>해지해도 내 폰의 기록은 지워지지 않지만, 더 이상 가족간 실시간으로 공유되지 않습니다.</span>",
        function() {
            // 1. 로컬 스토리지에서 가족 동기화 코드 삭제 (연결 고리 끊기)
            localStorage.removeItem("family_sync_code");
            
            // 2. 알림 띄우기
            window.showToast("💔 가족 연동이 안전하게 해제되었습니다.");
            
            // 3. 1초 뒤에 앱을 새로고침해서 완전 초기화된 상태로 만듦
            setTimeout(() => {
                location.reload(); 
            }, 1000);
        },
        "🔗", // 아이콘
        "해지하기", // 버튼 이름
        "#F04452" // 버튼 색상 (빨간색)
    );
};

// ==========================================
// 🛡️ [가족 연동 해제 안전장치] 실수 방지용 3중 자물쇠
// ==========================================
window.safeUnlinkFamilySync = function() {
    const answer = prompt("⚠️ 정말 짝꿍과의 가족 연동을 끊으시겠습니까?\n해제하시려면 아래 입력창에 '해제'라고 정확히 적어주세요.");
    
    if (answer === '해제') {
        // 기존 해제 함수가 있으면 안전하게 호출
        if (typeof window.unlinkFamilySync === 'function') {
            window.unlinkFamilySync(); 
        } else {
            // 강제 해제 로직 (Fallback)
            localStorage.removeItem('family_sync_code');
            alert("가족 연동이 안전하게 해제되었습니다.");
            window.renderSettingsTab();
        }
    } else if (answer !== null) {
        alert("입력한 단어가 일치하지 않아 취소되었습니다.");
    }
};

// ==========================================
// 💡 수면시간 양방향 자동 계산 엔진 (시작~종료 <-> 시간/분)
// ==========================================

// 1. [시간 박스]를 건드렸을 때 -> [시간/분]을 알아서 쪼개서 계산
window.calcSleepFromTimes = function() {
    const startInput = document.getElementById('v-tracker-time');
    const endInput = document.getElementById('v-sleep-end-time');
    const amountInput = document.getElementById('v-sleep-amount');
    const hoursInput = document.getElementById('v-sleep-hours');
    const minsInput = document.getElementById('v-sleep-mins');

    if(!startInput || !endInput || !amountInput || !hoursInput || !minsInput) return;

    const [sH, sM] = startInput.value.split(':').map(Number);
    const [eH, eM] = endInput.value.split(':').map(Number);

    let startMins = sH * 60 + sM;
    let endMins = eH * 60 + eM;

    // 밤을 새서 종료 시간이 시작 시간보다 작다면 하루(1440분) 더해줌
    if (endMins < startMins) {
        endMins += 24 * 60; 
    }

    const diffMins = endMins - startMins;
    
    // 숨겨진 원본 분(min) 저장 & 시각적 분할
    amountInput.value = diffMins; 
    hoursInput.value = Math.floor(diffMins / 60);
    minsInput.value = diffMins % 60;
};

// 2. [시간 / 분 박스]를 직접 타이핑했을 때 -> [종료 시간]을 알아서 계산
window.calcEndTimeFromAmount = function() {
    const startInput = document.getElementById('v-tracker-time');
    const endInput = document.getElementById('v-sleep-end-time');
    const amountInput = document.getElementById('v-sleep-amount');
    const hoursInput = document.getElementById('v-sleep-hours');
    const minsInput = document.getElementById('v-sleep-mins');

    if(!startInput || !endInput || !amountInput || !hoursInput || !minsInput) return;

    const h = parseInt(hoursInput.value) || 0;
    const m = parseInt(minsInput.value) || 0;
    const totalMins = (h * 60) + m;
    
    // 숨겨진 원본 분(min) 저장
    amountInput.value = totalMins;

    const [sH, sM] = startInput.value.split(':').map(Number);
    let startMins = sH * 60 + sM;
    let endMins = startMins + totalMins;

    const eH = Math.floor(endMins / 60) % 24; 
    const eM = endMins % 60;

    endInput.value = `${String(eH).padStart(2,'0')}:${String(eM).padStart(2,'0')}`; 
};

// 3. [⏰ 방금 깼어요!] 버튼을 눌렀을 때
window.calcSleepToNow = function() {
    const endInput = document.getElementById('v-sleep-end-time');
    const hoursInput = document.getElementById('v-sleep-hours');
    const minsInput = document.getElementById('v-sleep-mins');
    if(!endInput) return;

    // 1. 종료 시간 박스에 '현재 시간' 세팅
    const now = new Date();
    endInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    // 2. 알아서 계산 돌려버리기!
    window.calcSleepFromTimes();
    
    // 3. 시각적 효과 (글씨 커졌다가 돌아옴)
    if(hoursInput) {
        hoursInput.style.transform = 'scale(1.2)';
        hoursInput.style.color = '#A855F7';
        setTimeout(() => { hoursInput.style.transform = 'scale(1)'; hoursInput.style.color = 'var(--text-m)'; }, 300);
    }
    if(minsInput) {
        minsInput.style.transform = 'scale(1.2)';
        minsInput.style.color = '#A855F7';
        setTimeout(() => { minsInput.style.transform = 'scale(1)'; minsInput.style.color = 'var(--text-m)'; }, 300);
    }

    window.showToast(`✅ 방금 깬 시간으로 자동 셋팅되었습니다!`);
};

// ==========================================
// 🍼 수유 퀵버튼 (타이핑 제로) 자동 입력 엔진
// ==========================================

// 1. 고정 용량 셋팅 (예: 160ml)
window.setFeedAmount = function(amount) {
    const inputEl = document.getElementById('v-feed-amount');
    if(inputEl) {
        inputEl.value = amount;
        
        // 폰에서 미세한 진동 손맛 제공 (안드로이드)
        if (navigator.vibrate) navigator.vibrate(20); 
        
        // 시각적 피드백: 숫자가 띠용~ 하고 커졌다 돌아옴
        inputEl.style.transform = 'scale(1.2)';
        inputEl.style.color = '#3182F6';
        setTimeout(() => { 
            inputEl.style.transform = 'scale(1)'; 
            inputEl.style.color = 'var(--text-m)';
        }, 200);
    }
};

// 2. 미세 조절 (+10, -10)
window.adjustFeedAmount = function(change) {
    const inputEl = document.getElementById('v-feed-amount');
    if(inputEl) {
        let currentVal = parseInt(inputEl.value) || 0;
        let newVal = currentVal + change;
        if(newVal < 0) newVal = 0; // 마이너스로 떨어지지 않게 방어
        
        inputEl.value = newVal;
        
        if (navigator.vibrate) navigator.vibrate(15);
        
        // 살짝 띠용~ 하는 효과
        inputEl.style.transform = 'scale(1.1)';
        setTimeout(() => { inputEl.style.transform = 'scale(1)'; }, 150);
    }
};

// ==========================================
// 🚀 [통합본] 온보딩 + 아빠 모드 + 경험치 + 브리핑 엔진
// ==========================================

// 1. 엄마/아빠 역할 선택 온보딩 팝업
window.showRoleOnboarding = function() {
    if(localStorage.getItem('user_role')) return;

    const overlay = document.createElement('div');
    overlay.id = 'role-onboarding-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(5px);';

    overlay.innerHTML = `
        <div style="background:var(--bg-card, #fff); width:100%; max-width:340px; border-radius:24px; padding:36px 24px; text-align:center; box-shadow:0 15px 35px rgba(0,0,0,0.25); animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <div style="font-size:45px; margin-bottom:16px; animation: bounce 2s infinite;">👋</div>
            <div style="font-size:22px; font-weight:900; color:var(--text-m, #191f28); margin-bottom:10px;">반가워요, 육아메이트님</div>
            <div style="font-size:14px; font-weight:600; color:var(--text-s, #8b95a1); margin-bottom:32px; line-height:1.5;">최적화된 화면을 준비해 드릴게요.<br>어떤 역할을 맡고 계신가요?</div>
            
            <div style="display:flex; gap:12px;">
                <button onclick="window.selectRoleOnboarding('mom')" style="flex:1; padding:24px 10px; background:#FFF0F1; border:2px solid #FFE5E8; border-radius:18px; cursor:pointer; transition:all 0.2s;">
                    <div style="font-size:36px; margin-bottom:10px;">👩‍🍼</div>
                    <div style="font-size:16px; font-weight:900; color:#F04452;">엄마</div>
                </button>
                <button onclick="window.selectRoleOnboarding('dad')" style="flex:1; padding:24px 10px; background:#EBF4FF; border:2px solid #D3E4FF; border-radius:18px; cursor:pointer; transition:all 0.2s;">
                    <div style="font-size:36px; margin-bottom:10px;">👨‍🍼</div>
                    <div style="font-size:16px; font-weight:900; color:#3182F6;">아빠</div>
                </button>
            </div>
        </div>
        <style>
            @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-10px);} 60% {transform: translateY(-5px);} }
        </style>
    `;
    document.body.appendChild(overlay);
};

window.selectRoleOnboarding = function(role) {
    localStorage.setItem('user_role', role);
    const overlay = document.getElementById('role-onboarding-overlay');
    if(overlay) overlay.remove();
    
    if (role === 'dad') {
        document.body.classList.add('mode-dad');
        window.showToast("👨‍🍼 아빠 모드로 시작합니다!");
    } else {
        document.body.classList.remove('mode-dad');
        window.showToast("👩‍🍼 엄마 모드로 시작합니다!");
    }
    
    if(typeof window.renderSettingsTab === 'function') window.renderSettingsTab();
    if(typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
    if(typeof window.renderDadQuests === 'function') window.renderDadQuests();
};
setTimeout(window.showRoleOnboarding, 500);

// 2. 통합 경험치(EXP) 엔진
window.getMateLevelInfo = function() {
    let totalExp = parseInt(localStorage.getItem('tosil_mate_exp') || '0');
    let level = Math.floor(totalExp / 100) + 1;
    let currentLevelExp = totalExp % 100; 
    let percent = currentLevelExp; 

    let title = "👶 신입 육아 요원"; let color = "#94A3B8";
    if (level >= 10) { title = "👑 육아의 신"; color = "#F59E0B"; }
    else if (level >= 7) { title = "💎 베테랑 요원"; color = "#8B5CF6"; }
    else if (level >= 4) { title = "⚔️ 정예 요원"; color = "#3182F6"; }
    else if (level >= 2) { title = "🛡️ 일병 아빠"; color = "#2DD4BF"; }

    return { totalExp, level, currentLevelExp, percent, title, color };
};

window.updateMateExp = function(amount) {
    let currentExp = parseInt(localStorage.getItem('tosil_mate_exp') || '0');
    currentExp += amount;
    if (currentExp < 0) currentExp = 0; 
    localStorage.setItem('tosil_mate_exp', currentExp);
    
    if(typeof window.renderDadQuests === 'function') window.renderDadQuests();
    if(typeof window.updateDadBriefing === 'function') window.updateDadBriefing();
};

// 3. 아빠 모드: 메인 대시보드 렌더링 (아기 상태 + 아내 HP + 히어로 모드)
window.renderDadQuests = function() {
    const role = localStorage.getItem('user_role');
    const container = document.getElementById('dad-quest-container');
    if(!container) return;

    if (role !== 'dad') {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    let isCollapsed = localStorage.getItem('tosil_dad_dashboard_collapsed') === 'true';
    const levelInfo = window.getMateLevelInfo();

    // 트래커 데이터 분석
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    const now = new Date().getTime();
    const startOfToday = new Date().setHours(0,0,0,0);
    let todayEvents = 0; 
    let lastFeed = null; let lastDiaper = null; let lastSleep = null;
    
    records.forEach(r => {
        if(r.timestamp >= startOfToday) todayEvents++;
        if(!lastFeed && r.type === 'feed') lastFeed = r;
        if(!lastDiaper && r.type === 'diaper') lastDiaper = r;
        if(!lastSleep && r.type === 'sleep') lastSleep = r;
    });

    let babyStatusHtml = "";
    let feedDiff = lastFeed ? Math.floor((now - lastFeed.timestamp) / 60000) : 0;
    let diaperDiff = lastDiaper ? Math.floor((now - lastDiaper.timestamp) / 60000) : 0;
    const feedInterval = parseInt(localStorage.getItem('tosil_feed_interval')) || 180;
    
    if (feedDiff >= feedInterval - 30) {
        babyStatusHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;"><div style="font-size:20px;">🚨</div><div style="font-size:13.5px; color:#F87171; font-weight:800;">맘마 먹은지 ${Math.floor(feedDiff/60)}시간 ${feedDiff%60}분째!<br><span style="font-size:11.5px; color:#94A3B8;">집에 가자마자 분유를 타주세요!</span></div></div>`;
    } else {
        babyStatusHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;"><div style="font-size:20px;">🍼</div><div style="font-size:13.5px; color:#E2E8F0; font-weight:800;">마지막 수유: ${feedDiff >= 60 ? Math.floor(feedDiff/60)+'시간 ' : ''}${feedDiff%60}분 전<br><span style="font-size:11.5px; color:#94A3B8;">아직 배고플 시간은 아니에요.</span></div></div>`;
    }

    if (diaperDiff >= 180) {
        babyStatusHtml += `<div style="display:flex; align-items:center; gap:8px;"><div style="font-size:20px;">💩</div><div style="font-size:13.5px; color:#F87171; font-weight:800;">기저귀 안 간지 ${Math.floor(diaperDiff/60)}시간 넘음!<br><span style="font-size:11.5px; color:#94A3B8;">엉덩이 발진 주의! 확인해 보세요.</span></div></div>`;
    } else {
        babyStatusHtml += `<div style="display:flex; align-items:center; gap:8px;"><div style="font-size:20px;">✨</div><div style="font-size:13.5px; color:#E2E8F0; font-weight:800;">엉덩이 뽀송뽀송 (마지막 교체: ${diaperDiff}분 전)</div></div>`;
    }

    let momHpText = ""; let momHpColor = "";
    if (todayEvents >= 15) { momHpText = "극도 피로 🥵 (디저트 포장 강력 추천!)"; momHpColor = "#F87171"; } 
    else if (todayEvents >= 8) { momHpText = "지침 😮‍💨 (따뜻한 말 한마디 필수)"; momHpColor = "#FBBF24"; } 
    else { momHpText = "보통 🙂 (퇴근 후 육아 교대는 필수!)"; momHpColor = "#34D399"; }

    const isHeroToday = localStorage.getItem('tosil_hero_mode_date') === new Date().toDateString();

    let html = `
        <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border-radius: 20px; padding: 20px; color: #fff; box-shadow: 0 10px 25px rgba(15,23,42,0.25); position: relative; margin-bottom: 24px;">
            <div onclick="window.toggleDadDashboard()" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; position: relative; z-index: 2;">
                <div>
                    <div style="font-size: 13px; color: #94A3B8; font-weight: 800; margin-bottom: 4px;">👨‍🍼 아빠 작전 상황판</div>
                    <div style="font-size: 20px; font-weight: 900; color: #fff;">Lv.${levelInfo.level} <span style="color: ${levelInfo.color};">${levelInfo.title}</span></div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size: 13px; font-weight: 900; color: #E2E8F0; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px;">${levelInfo.totalExp} EXP</div>
                    <div style="font-size: 20px; color: #94A3B8; transform: rotate(${isCollapsed ? '180deg' : '0deg'}); transition: transform 0.3s;">▲</div>
                </div>
            </div>
    `;

    if (!isCollapsed) {
        html += `
            <div style="margin-top: 16px; margin-bottom: 24px;">
                <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${levelInfo.percent}%; height: 100%; background: ${levelInfo.color}; border-radius: 5px; transition: width 0.5s;"></div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748B; margin-top: 6px;">다음 승급까지 ${100 - levelInfo.currentLevelExp} EXP</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 12px; font-weight: 800; color: #94A3B8; margin-bottom: 12px;">📊 현재 아기 상태 요약</div>
                ${babyStatusHtml}
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 12px; font-weight: 800; color: #94A3B8; margin-bottom: 6px;">❤️ 오늘의 아내 체력(HP) 예상</div>
                <div style="font-size: 14px; font-weight: 800; color: ${momHpColor};">${momHpText}</div>
            </div>
            ${isHeroToday ? `
                <div style="text-align:center; padding:16px; background:rgba(16, 185, 129, 0.15); border-radius:16px; border:1px solid rgba(16, 185, 129, 0.3);">
                    <div style="font-size:24px; margin-bottom:4px;">👨‍🍼</div>
                    <div style="font-size:14px; font-weight:900; color:#34D399;">오늘의 메인 육아 참전 완료!</div>
                </div>
            ` : `
                <button onclick="window.activateHeroMode()" style="width:100%; padding:18px; border-radius:16px; background:#3182F6; color:#fff; font-size:15px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 15px rgba(49,130,246,0.4); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>👨‍🍼</span> 퇴근 완료! 지금부턴 내가 전담할게
                </button>
            `}
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
};

window.toggleDadDashboard = function() {
    let isCollapsed = localStorage.getItem('tosil_dad_dashboard_collapsed') === 'true';
    localStorage.setItem('tosil_dad_dashboard_collapsed', !isCollapsed);
    window.renderDadQuests();
};

window.activateHeroMode = function() {
    localStorage.setItem('tosil_hero_mode_date', new Date().toDateString());
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    if (typeof window.showToast === 'function') window.showToast("👨‍🍼 멋진 아빠 등장! 아내에게 자유시간을 선물하세요. (+50 EXP)");
    
    window.updateMateExp(50);
    window.renderDadQuests();
    if(typeof window.updateTrackerDashboard === 'function') window.updateTrackerDashboard();
};

// 👨‍👩‍👦 아빠 모드: 상단 브리핑 (니치 카피라이팅 + 미션 완료 상태 유지)
window.updateDadBriefing = function() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    let todayFeedAmt = 0; let todayFeedCount = 0; 
    let todayDiaperCount = 0; let todaySleepCount = 0;
    
    let lastFeed = null; let lastDiaper = null; let lastSleep = null;

    records.forEach(r => {
        if(r.timestamp >= startOfToday) {
            if(r.type === 'feed' || r.type === '수유') {
                let amt = parseInt(String(r.amount || '0').replace(/[^0-9]/g, ''));
                todayFeedAmt += amt || 0; 
                todayFeedCount++;
                if(!lastFeed || r.timestamp > lastFeed.timestamp) lastFeed = r;
            } else if (r.type === 'diaper' || r.type === '기저귀') {
                todayDiaperCount++;
                if(!lastDiaper || r.timestamp > lastDiaper.timestamp) lastDiaper = r;
            } else if (r.type === 'sleep' || r.type === '수면') {
                todaySleepCount++;
                if(!lastSleep || r.timestamp > lastSleep.timestamp) lastSleep = r;
            }
        }
    });

    const feedEl = document.getElementById('dad-brief-feed');
    const diaperEl = document.getElementById('dad-brief-diaper');
    const sleepEl = document.getElementById('dad-brief-sleep');
    if(feedEl) feedEl.innerText = todayFeedAmt > 0 ? `${todayFeedAmt} ml` : '0 ml';
    if(diaperEl) diaperEl.innerText = todayDiaperCount > 0 ? `${todayDiaperCount} 회` : '0 회';
    if(sleepEl) sleepEl.innerText = todaySleepCount > 0 ? `${todaySleepCount} 번` : '0 번';

    const babyName = localStorage.getItem('tosil_babyName') || '우리아기';
    const nameEl = document.getElementById('dad-brief-name');
    if(nameEl) nameEl.innerText = babyName;

    // ==========================================
    // 💡 1. 초압축 카피라이팅: 아내 HP 편
    // ==========================================
    let hpBg = "#10B981"; 
    let hpMsg = "평온한 하루 ☀️ 육아 퇴근까지 눈치껏 집안일 돕기"; // 🔥 이 부분을 수정했습니다!
    const totalLabor = todayFeedCount + todayDiaperCount; 

    if (totalLabor >= 12 || todayDiaperCount >= 7) {
        hpBg = "#EF4444"; 
        hpMsg = "HP 1% 🚨 달달한 디저트 조공 필수!"; 
    } else if (totalLabor >= 8 || todayFeedCount >= 5) {
        hpBg = "#F59E0B"; 
        hpMsg = "체력 방전 🪫 귀가 즉시 바통 터치!"; 
    }

    // ==========================================
    // 💡 2. 초압축 카피라이팅: 1순위 미션 편
    // ==========================================
    let missionBg = "#3182F6"; 
    let missionMsg = "";
    
    // 👇 날아갔던 '수면 체크 로직' 복구 완료! 👇
    let sleepStartTime = localStorage.getItem('tosil_sleep_start');
    
    if (sleepStartTime && lastSleep && lastSleep.amount > 0) {
        const sleepEndTime = lastSleep.timestamp + (lastSleep.amount * 60000);
        if (sleepEndTime > parseInt(sleepStartTime)) {
            localStorage.removeItem('tosil_sleep_start');
            localStorage.removeItem('tosil_sleep_type');
            sleepStartTime = null;
        }
    }
    const isSleeping = sleepStartTime || (lastSleep && lastSleep.amount === 0);
    // 👆 여기까지 👆

    if (isSleeping) {
        missionBg = "#A855F7"; 
        missionMsg = "🚨 수면중! 까치발 입장 필수"; 
    } else {
        const nowTime = now.getTime();
        let feedDiffMins = lastFeed ? Math.floor((nowTime - lastFeed.timestamp) / 60000) : 0;
        let diaperDiffMins = lastDiaper ? Math.floor((nowTime - lastDiaper.timestamp) / 60000) : 0;
        const feedInterval = parseInt(localStorage.getItem('tosil_feed_interval')) || 180;

        if (lastFeed && feedDiffMins >= feedInterval - 30) {
            missionBg = "#3182F6"; 
            missionMsg = "🍼 맘마 타임! 겉옷 벗기 전 젖병 세팅"; 
        } else if (lastDiaper && diaperDiffMins >= 180) {
            missionBg = "#F04452"; 
            missionMsg = "💩 엉덩이 경보! 들어가자마자 기저귀부터"; 
        } else {
            missionBg = "#00B37A"; 
            
            // 🔥 평화 미션도 초압축!
            const fallbackMissions = [
                "✨ 평화롭네요! 밀린 젖병 설거지 부탁해요", 
                "💖 아기 기분 최고! 아내에게 1시간 휴식을", 
                "🗑️ 육아 휴전! 조용히 집안 쓰레기통 비우기" 
            ];
            const dayIndex = new Date().getDate() % fallbackMissions.length;
            missionMsg = fallbackMissions[dayIndex];
        }
    }

    // ==========================================
    // 💡 3. 미션 완료 상태 체크 (새로고침 방어 로직)
    // ==========================================
    let isCleared = false;
    try {
        const clearedData = JSON.parse(localStorage.getItem('tosil_cleared_mission'));
        // 저장된 미션 텍스트와 현재 미션 텍스트가 똑같고, 완료한 지 2시간(7200000ms)이 안 지났다면?
        // -> 이미 완료한 미션으로 렌더링!
        if (clearedData && clearedData.text === missionMsg && (Date.now() - clearedData.timestamp < 7200000)) {
            isCleared = true;
        }
    } catch(e) {}

    const msgEl = document.getElementById('dad-brief-msg'); 
    
    if(msgEl) {
        const parentDiv = msgEl.parentElement;
        parentDiv.style.background = "rgba(0, 0, 0, 0.25)";
        parentDiv.style.border = "1px solid rgba(255, 255, 255, 0.05)";
        parentDiv.style.borderRadius = "12px";
        parentDiv.style.padding = "14px";
        parentDiv.style.flexDirection = "column"; 
        parentDiv.style.alignItems = "stretch"; 
        parentDiv.style.gap = "10px"; 

        // 완료 여부에 따라 버튼의 형태를 다르게 그려줍니다.
        const actionButtonHtml = isCleared 
            ? `<button disabled style="background: #10B981; border: none; color: #FFF; padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 800; cursor: not-allowed; flex-shrink: 0; align-self: flex-start;">완수! 👏</button>`
            : `<button onclick="window.completeTopMission(this, '${missionMsg.replace(/'/g, "\\'")}')" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.1); color: #FFF; padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 800; cursor: pointer; flex-shrink: 0; white-space: nowrap; transition: all 0.2s; align-self: flex-start;">완료하기</button>`;

        parentDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px; width: 100%;">
                <!-- 🚨 아내상태 뱃지 -->
                <span style="background: ${hpBg}; color: #FFF; font-size: 11px; font-weight: 900; padding: 4px 0; width: 64px; text-align: center; display: inline-block; border-radius: 6px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.2); box-sizing: border-box; margin-top: 2px;">아내상태</span>
                <!-- 🌟 [핵심 패치] white-space: nowrap 제거하고 word-break: keep-all 추가! -->
                <span style="font-size: 13.5px; font-weight: 800; color: #FFFFFF; line-height: 1.4; word-break: keep-all;">${hpMsg}</span>
            </div>
            
            <div style="width: 100%; height: 1px; background: rgba(255,255,255,0.08);"></div>
            
            <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: flex-start; gap: 8px; padding-right: 8px;">
                    <!-- 🚨 1순위미션 뱃지 -->
                    <span style="background: ${missionBg}; color: #FFF; font-size: 11px; font-weight: 900; padding: 4px 0; width: 64px; text-align: center; display: inline-block; border-radius: 6px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.2); box-sizing: border-box; margin-top: 2px;">1순위미션</span>
                    <!-- 🌟 [핵심 패치] 텍스트가 길면 아래로 자연스럽게 줄바꿈되도록 수정 -->
                    <span style="font-size: 13.5px; font-weight: 800; color: #FFFFFF; line-height: 1.4; word-break: keep-all;">${missionMsg}</span>
                </div>
                ${actionButtonHtml}
            </div>
        `;
    }
};

// 5. 아빠 모드: 홈 화면용 바통터치 리스트 렌더링
window.renderHomeBatonList = function() {
    const container = document.getElementById('home-dad-baton-list');
    if (!container) return;
    
    let records = JSON.parse(localStorage.getItem('tosil_baton_records')) || [];
    let activeRecords = records.filter(r => r.status === 'requested' || r.status === 'accepted');

if (activeRecords.length === 0) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 110px; text-align: center; padding: 20px; background: var(--bg-sub); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="font-size: 14px; font-weight: 800; color: var(--text-s); line-height: 1.5;">현재 대기 중인 미션이 없습니다.<br>오늘 하루도 평화롭네요! 🤍</div>
            </div>`;
        return;
    }

    let html = '';
    activeRecords.forEach(r => {
        let statusHtml = r.status === 'requested' 
            ? `<span style="background:#FFF0F1; color:#F04452; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px solid #F04452;">⏳ 요청중</span>`
            : `<span style="background:#EBF4FF; color:#3182F6; font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px solid #3182F6;">🏃‍♂️ 처리중</span>`;
            
        let actionBtn = r.status === 'requested'
            ? `<button onclick="acceptBaton('${r.id}'); renderHomeBatonList(); if(typeof renderBatonTasks==='function') renderBatonTasks();" style="padding:10px 14px; background:#3182F6; color:#FFF; border:none; border-radius:10px; font-size:12.5px; font-weight:800; cursor:pointer;">🫡 미션접수</button>`
            : `<button onclick="completeBaton('${r.id}'); renderHomeBatonList(); if(typeof renderBatonTasks==='function') renderBatonTasks(); window.updateDadBriefing();" style="padding:10px 14px; background:#00B37A; color:#FFF; border:none; border-radius:10px; font-size:12.5px; font-weight:800; cursor:pointer;">✅ 해결완료</button>`;

        let rewardHtml = (r.reward && r.reward !== "없음") ? `<div style="margin-top:6px; color:#B78103; font-size:11.5px; font-weight:800;">🎁 보상: ${r.reward}</div>` : '';

        html += `
        <div style="background:#FFFFFF; border:1px solid var(--border); padding:16px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.01); margin-bottom:8px;">
            <div>
                <div style="font-size:14.5px; font-weight:800; color:var(--text-m); margin-bottom:6px;">${r.text}</div>
                <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-s);">
                    ${statusHtml} <span>⏱️ ${r.time}</span>
                </div>
                ${rewardHtml}
            </div>
            <div style="margin-left:12px;">${actionBtn}</div>
        </div>`;
    });
    container.innerHTML = html;
};

// 6. 앱 초기 구동 시 역할/모드 자동 세팅 및 UI 동기화
window.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('user_role') || 'mom';
    
    if (savedRole === 'dad') {
        document.body.classList.add('mode-dad');
    } else {
        document.body.classList.remove('mode-dad');
    }
    
    // 약간의 딜레이를 주어 안전하게 데이터 렌더링
    setTimeout(() => {
        if(typeof window.updateDadBriefing === 'function') window.updateDadBriefing();
        if(typeof window.renderHomeBatonList === 'function') window.renderHomeBatonList();
        if(typeof window.renderDadQuests === 'function') window.renderDadQuests();
    }, 300); 
});


// 🎉 [아이디어 3] 미션 완료 시 화면에 이모지 폭죽을 터뜨리는 특수효과
window.shootConfetti = function() {
    const emojis = ['🎉', '💖', '✨', '👏', '🚀'];
    for(let i=0; i<20; i++) {
        let el = document.createElement('div');
        el.innerText = emojis[Math.floor(Math.random()*emojis.length)];
        el.style.position = 'fixed';
        // 아빠 브리핑 카드 근처(상단 중앙)에서 터지도록 위치 설정
        el.style.left = '50%'; 
        el.style.top = '30%'; 
        el.style.fontSize = (Math.random() * 20 + 15) + 'px';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';
        el.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)'; // 부드럽게 퍼지는 물리효과
        el.style.transform = `translate(-50%, -50%) scale(0) rotate(0deg)`;
        el.style.opacity = '1';
        document.body.appendChild(el);

        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 150 + 50; // 퍼지는 거리
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rot = Math.random() * 360 - 180;
            el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.2) rotate(${rot}deg)`;
            el.style.opacity = '0';
        }, 10);

        setTimeout(() => el.remove(), 1000);
    }
};

// 🎯 [완료 상태 기억 엔진] 1순위 미션 완료 버튼 눌렀을 때 실행되는 함수
window.completeTopMission = function(btnElement, missionText) {
    // 1. 폭죽 발사!
    window.shootConfetti();
    
    // 2. 버튼 상태 변경
    btnElement.style.background = "#10B981"; // 초록색으로 변경
    btnElement.style.border = "none";
    btnElement.style.color = "#FFFFFF";
    btnElement.innerText = "완수! 👏";
    btnElement.style.transform = "scale(1.1)";
    btnElement.disabled = true; // 중복 클릭 방지
    btnElement.style.cursor = "not-allowed";
    
    setTimeout(() => {
        btnElement.style.transform = "scale(1)";
    }, 200);

    if (navigator.vibrate) navigator.vibrate(50);
    window.showToast("💖 멋져요! 아내의 스트레스가 감소했습니다.");

    // ✨ 핵심 패치: 방금 완료한 미션의 내용과 시간을 브라우저에 콱 박아둡니다.
    localStorage.setItem('tosil_cleared_mission', JSON.stringify({
        text: missionText,
        timestamp: Date.now()
    }));
};

// 💡 [아이디어 1] 아내가 기록했을 때 아빠 화면 숫자가 '번쩍' 하며 업데이트되는 효과
window.highlightUpdatedStat = function(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el || el.innerText === newValue) return; // 값이 같으면 무시
    
    el.innerText = newValue;
    // 형광펜 칠하듯 파란색으로 번쩍였다가 원래 색으로 돌아옴
    el.style.transition = "color 0.3s, transform 0.3s";
    el.style.color = "#3182F6"; 
    el.style.transform = "scale(1.2)";
    
    setTimeout(() => {
        el.style.color = "#FFFFFF"; // 다크모드 기본 글씨색으로 복구
        el.style.transform = "scale(1)";
    }, 400);
};

// ==========================================
// 📥 엑셀(CSV) 내보내기 엔진 (한글 깨짐 방지 완벽 패치)
// ==========================================
window.exportToExcel = function() {
    // 1. 내 폰에 저장된 트래커, 해열제, 성장 기록 다 불러오기
    const trackers = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    const fevers = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    const growths = JSON.parse(localStorage.getItem('tosil_growth_records')) || [];

    if (trackers.length === 0 && fevers.length === 0 && growths.length === 0) {
        return window.showToast("⚠️ 아직 내보낼 데이터가 없습니다. 먼저 기록을 남겨주세요!");
    }

    // 2. 엑셀 파일(CSV) 헤더 만들기
    // 💡 \uFEFF 는 엑셀에서 한글이 깨지지 않게 해주는 마법의 코드(BOM)입니다.
    let csvContent = "\uFEFF"; 
    csvContent += "날짜,시간,분류,상세,수치/상태\n";

    // 3. 트래커 데이터 줄 세우기
    trackers.forEach(t => {
        const d = new Date(t.timestamp);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        let category = t.type === 'feed' ? '수유' : (t.type === 'sleep' ? '수면' : '기저귀');
        let detail = t.subType || '';
        let value = t.amount ? t.amount : '';
        if (t.type === 'feed' && t.subType === '이유식') value += ' ml/g';
        else if (t.type === 'feed') value += ' ml/분';
        else if (t.type === 'sleep') value += ' 분';
        else if (t.type === 'diaper' && t.status) value = t.status;

        // 쉼표(,)가 있으면 엑셀 칸이 밀리므로 제거
        detail = String(detail).replace(/,/g, '');
        value = String(value).replace(/,/g, '');

        csvContent += `${dateStr},${t.time},${category},${detail},${value}\n`;
    });

    // 4. 해열제 데이터 줄 세우기
    fevers.forEach(f => {
        const d = new Date(f.timestamp);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let pillName = f.type === 'red' ? '아세트아미노펜(빨강)' : '이부프로펜(파랑)';
        let detail = f.symptoms && f.symptoms.length > 0 ? f.symptoms.join('/') : '증상없음';
        
        csvContent += `${dateStr},${f.time},해열제,${pillName} (${detail}),${f.temp}도\n`;
    });

    // 5. 성장 기록 줄 세우기
    growths.forEach(g => {
        let hText = g.height > 0 ? `키 ${g.height}cm` : '';
        let wText = g.weight > 0 ? `몸무게 ${g.weight}kg` : '';
        let val = [hText, wText].filter(Boolean).join(' / ');
        
        csvContent += `${g.date},기록없음,성장기록,생후 ${g.month}개월,${val}\n`;
    });

    // 6. 브라우저에서 파일로 만들어서 다운로드 실행!
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // 파일 이름에 오늘 날짜 찍어주기
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", `육아메이트_데이터백업_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.showToast("📥 엑셀(CSV) 데이터 다운로드가 완료되었습니다!");
};

// ==========================================
// 💎 [니치 UX] 아이폰 다이얼 패드 강제 호출 엔진
// ==========================================
const keypadObserver = new MutationObserver(() => {
    // 앱 화면에 떠 있는 모든 숫자 입력칸을 찾아서
    document.querySelectorAll('input[type="number"], input[inputmode="numeric"]').forEach(input => {
        
        // 소수점이 필요한 체온/체중 입력칸은 decimal 유지
        if (['v-weight', 'v-temp', 'calc-weight', 'v-height', 'v-weight-growth'].includes(input.id)) {
            if(input.getAttribute('inputmode') !== 'decimal') {
                input.setAttribute('inputmode', 'decimal');
                input.removeAttribute('pattern');
            }
        } else {
            // 나머지(수유량, 수면시간 등)는 무조건 크고 쾌적한 다이얼 패드(pattern="[0-9]*") 강제 호출!
            if(input.getAttribute('pattern') !== '[0-9]*') {
                input.setAttribute('inputmode', 'numeric');
                input.setAttribute('pattern', '[0-9]*');
            }
        }
    });
});

// 앱 전체의 화면 변화(바텀시트가 열리는 등)를 감지해서 자동으로 속성 주입
keypadObserver.observe(document.body, { childList: true, subtree: true });

// 🏥 병원 예약(진료 접수)용 증상 요약 복사 함수
window.copySymptomMemo = function() {
    let records = JSON.parse(localStorage.getItem('tosil_fever_records')) || [];
    let weight = localStorage.getItem('tosil_latest_weight') || '미입력';
    
    if(records.length === 0) return window.showToast('⚠️ 복사할 진료 기록이 없습니다.');
    
    let latest = records[0];
    let pillName = latest.type === 'red' ? '아세트아미노펜(빨강)' : '이부프로펜(파랑)';
    let symp = (latest.symptoms && latest.symptoms.length > 0) ? latest.symptoms.join(', ') : '특이증상 없음';
    
    let text = `[증상요약]\n- 최근 체온: ${latest.temp}도\n- 복용 약: ${pillName}\n- 몸무게: ${weight}kg\n- 동반 증상: ${symp}`;
    
    navigator.clipboard.writeText(text).then(() => {
        window.showToast("📋 진료 접수용 메모가 복사되었어요!<br>예약 앱이나 문자에 바로 붙여넣기 하세요.");
    });
};

// ==========================================
// ⏰ [하이엔드 패치] 무한 스와이프 휠(드럼 피커) 엔진
// ==========================================
window.initDrumPicker = function(timeStr) {
    const hourContainer = document.getElementById('picker-hour');
    const minContainer = document.getElementById('picker-minute');
    if(!hourContainer || !minContainer) return;

    const itemHeight = 44; 
    const paddingHeight = 53; 
    
    // ✨ 무한 휠 트릭: 숫자를 5세트 만들어두고 유저는 항상 3번째 세트(가운데)에서 시작!
    const REPEAT_COUNT = 5; 
    const CENTER_INDEX = 2; 

    // 숫자 리스트 무한으로 찍어내기
    const generateInfiniteItems = (max) => {
        let html = `<div style="height:${paddingHeight}px; flex-shrink:0;"></div>`;
        for(let loop = 0; loop < REPEAT_COUNT; loop++) {
            for(let i=0; i<=max; i++) {
                let val = String(i).padStart(2, '0');
                html += `<div class="picker-item" style="height:${itemHeight}px; line-height:${itemHeight}px; font-size:20px; font-weight:700; color:#B0B8C1; scroll-snap-align:center; flex-shrink:0; transition:all 0.2s;">${val}</div>`;
            }
        }
        html += `<div style="height:${paddingHeight}px; flex-shrink:0;"></div>`;
        return html;
    };

    hourContainer.innerHTML = generateInfiniteItems(23);
    minContainer.innerHTML = generateInfiniteItems(59);

    // 스크롤이 멈췄을 때 실행되는 함수
    const updateHiddenInput = () => {
        let hRawIdx = Math.round(hourContainer.scrollTop / itemHeight);
        let mRawIdx = Math.round(minContainer.scrollTop / itemHeight);
        
        // 🚨 무한 루프 마법: 너무 위나 아래로 스크롤하면, 유저 몰래 다시 한가운데 세트로 원상복구!
        if (hRawIdx < 24 || hRawIdx >= 24 * 4) {
            hourContainer.style.scrollBehavior = 'auto'; // 애니메이션 끄기
            hRawIdx = (hRawIdx % 24) + (24 * CENTER_INDEX);
            hourContainer.scrollTop = hRawIdx * itemHeight;
            setTimeout(() => hourContainer.style.scrollBehavior = 'smooth', 10);
        }
        if (mRawIdx < 60 || mRawIdx >= 60 * 4) {
            minContainer.style.scrollBehavior = 'auto';
            mRawIdx = (mRawIdx % 60) + (60 * CENTER_INDEX);
            minContainer.scrollTop = mRawIdx * itemHeight;
            setTimeout(() => minContainer.style.scrollBehavior = 'smooth', 10);
        }

        // 실제 추출할 값 (0~23, 0~59)
        let hVal = hRawIdx % 24;
        let mVal = mRawIdx % 60;

        // 선택된 숫자만 크고 파란색으로 뽝! 강조
        hourContainer.querySelectorAll('.picker-item').forEach((el, i) => { 
            el.style.color = i === hRawIdx ? '#3182F6' : '#B0B8C1'; 
            el.style.fontWeight = i === hRawIdx ? '900' : '700'; 
            el.style.fontSize = i === hRawIdx ? '26px' : '20px'; 
        });
        minContainer.querySelectorAll('.picker-item').forEach((el, i) => { 
            el.style.color = i === mRawIdx ? '#3182F6' : '#B0B8C1'; 
            el.style.fontWeight = i === mRawIdx ? '900' : '700'; 
            el.style.fontSize = i === mRawIdx ? '26px' : '20px'; 
        });

        let hh = String(hVal).padStart(2, '0');
        let mm = String(mVal).padStart(2, '0');

        // 기존 시스템이 읽어가는 숨겨진 input 업데이트
        const hiddenEl = document.getElementById('v-tracker-time');
        if (hiddenEl && hiddenEl.value !== `${hh}:${mm}`) {
            hiddenEl.value = `${hh}:${mm}`;
            if (hiddenEl.onchange) hiddenEl.onchange(); // 수면 시간 자동 계산 등 트리거
        }
    };

    // 스크롤 감지 (터치 떼고 바퀴가 멈추면 작동)
    let scrollTimeout;
    const onScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateHiddenInput, 80); // 바퀴 멈추고 0.08초 뒤 인식
    };

    hourContainer.addEventListener('scroll', onScroll);
    minContainer.addEventListener('scroll', onScroll);

    // 창이 처음 열렸을 때 현재 시간으로 스크롤 딱! 맞춰놓기 (한가운데 세트로 점프)
    const [initH, initM] = timeStr.split(':').map(Number);
    setTimeout(() => {
        hourContainer.style.scrollBehavior = 'auto'; 
        minContainer.style.scrollBehavior = 'auto';
        
        hourContainer.scrollTop = (initH + (24 * CENTER_INDEX)) * itemHeight;
        minContainer.scrollTop = (initM + (60 * CENTER_INDEX)) * itemHeight;
        
        updateHiddenInput();
        
        // 이동 후에는 부드럽게 굴러가도록 원상복구
        setTimeout(() => { hourContainer.style.scrollBehavior = 'smooth'; minContainer.style.scrollBehavior = 'smooth'; }, 50);
    }, 10);
};

// ==========================================
// 📊 [UX 패치] 직전 기록과 비교해서 증감폭 알려주는 멘트 생성기
// ==========================================
function getGrowthDeltaMessage(records) {
    if (!records || records.length < 2) return "✨ 첫 계측 완료! 앞으로의 폭풍 성장이 기대돼요 🌱";
    const latest = records[0]; 
    const prev = records[1];   
    let messages = [];

    if (latest.height && prev.height) {
        const diffH = (latest.height - prev.height).toFixed(1);
        if (diffH > 0) messages.push(`키 <span style="color:#3182F6;">+${diffH}cm</span> 쑥쑥🦒`);
        else if (diffH < 0) messages.push(`키 <span style="color:#8B95A1;">${diffH}cm</span>`);
    }

    if (latest.weight && prev.weight) {
        const diffW = (latest.weight - prev.weight).toFixed(2);
        if (diffW > 0) messages.push(`몸무게 <span style="color:#00B37A;">+${diffW}kg</span> 튼튼🐻`);
        else if (diffW < 0) messages.push(`몸무게 <span style="color:#8B95A1;">${diffW}kg</span>`);
    }

    if (messages.length === 0) return "✨ 오늘 계측 완료! 폭풍 성장 중 🌿";
    return `✨ 지난번보다 <strong>${messages.join(', ')}</strong>`;
}

window.closeWriteModal = function() {
    document.getElementById('writeOverlay').classList.remove('show');
    document.getElementById('writeModal').classList.remove('show');
    document.body.style.overflow = 'auto'; 

    setTimeout(() => {
        if(document.getElementById('writeTitle')) document.getElementById('writeTitle').value = '';
        if(document.getElementById('writeContent')) document.getElementById('writeContent').value = '';
        if(document.getElementById('writeCategory')) document.getElementById('writeCategory').value = '';
        if(document.getElementById('writeAnonymous')) document.getElementById('writeAnonymous').checked = false;
        
        window.attachedImages = []; 
        if(typeof window.renderPreviewImages === 'function') window.renderPreviewImages();
    }, 300);
};

window.showComingSoon = function(feature) {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]); // 경쾌한 진동
    window.showToast(`🚀 <b>${feature}</b> 기능은 열심히 준비 중이에요!<br>조금만 기다려주세요 🤍`);
};

// ==========================================
// 🍞 무적의 토스트 알람 마스터 (CSS 씹힘 100% 차단)
// ==========================================
window.showToast = function(message) {
    const oldToast = document.getElementById('super-toast-msg');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'super-toast-msg';
    toast.innerHTML = message;
    
    toast.style.cssText = `
        position: fixed;
        bottom: -50px; 
        left: 50%;
        transform: translateX(-50%);
        background: rgba(49, 51, 63, 0.95);
        color: #ffffff;
        padding: 14px 24px;
        border-radius: 30px;
        font-size: 14px;
        font-weight: 800;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 9999999;
        opacity: 0;
        transition: opacity 0.3s ease, bottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        white-space: nowrap;
        pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.bottom = '100px'; 
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '-50px';
        setTimeout(() => { toast.remove(); }, 300);
    }, 2500);
};

// ==========================================
// 📸 맘수다 갤러리 (사진 첨부 및 미리보기) 압축 엔진 
// ==========================================
window.attachedImages = []; 

window.triggerImageUpload = function() {
    let fileInput = document.getElementById('commImageInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'commImageInput';
        fileInput.accept = 'image/*';
        fileInput.multiple = true; 
        fileInput.style.display = 'none';
        fileInput.onchange = window.handleImageSelection;
        document.body.appendChild(fileInput);
    }
    fileInput.click();
};

window.handleImageSelection = function(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    if (window.attachedImages.length + files.length > 5) {
        return window.showToast('⚠️ 사진은 최대 5장까지만 첨부할 수 있어요!');
    }

    // 🚨 사진이 서버로 날아가는 동안 유저가 기다릴 수 있게 알림 띄우기!
    window.showToast('⏳ 사진을 서버에 안전하게 업로드 중입니다...'); 

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = async function() {  // 🚨 async 필수!
                const canvas = document.createElement('canvas');
                const maxSize = 800; 
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                // 🚀 [마스터 패치] 글자 뭉치(Base64) 대신, Storage에 올리고 URL 받아오기!
                if (window.storage && window.uploadString && window.getDownloadURL) {
                    try {
                        // 중복 안 되게 랜덤 파일명 생성
                        const fileName = 'mamsuda/' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 7) + '.jpg';
                        const imgRef = window.storageRef(window.storage, fileName);
                        
                        await window.uploadString(imgRef, dataUrl, 'data_url'); // 창고에 업로드 슛!
                        const downloadUrl = await window.getDownloadURL(imgRef); // 인터넷 주소 따오기
                        
                        window.attachedImages.push(downloadUrl); // 진짜 인터넷 URL을 꽂아넣음!
                        window.renderPreviewImages(); 
                    } catch(err) {
                        console.error("업로드 에러:", err);
                        window.showToast("❌ 이미지 업로드에 실패했습니다. (Storage 규칙을 확인하세요)");
                    }
                } else {
                    // 서버 연결 실패 시 오프라인 백업 (기존 로직)
                    window.attachedImages.push(dataUrl); 
                    window.renderPreviewImages(); 
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    event.target.value = ''; 
};

window.renderPreviewImages = function() {
    let previewArea = document.getElementById('commPreviewArea');
    if (!previewArea) {
        const textarea = document.getElementById('writeContent');
        if(!textarea) return;
        previewArea = document.createElement('div');
        previewArea.id = 'commPreviewArea';
        previewArea.style.display = 'flex';
        previewArea.style.gap = '10px';
        previewArea.style.padding = '0 20px 20px';
        previewArea.style.overflowX = 'auto';
        textarea.parentNode.appendChild(previewArea);
    }

    if (window.attachedImages.length === 0) {
        previewArea.style.display = 'none';
        return;
    }

    previewArea.style.display = 'flex';
    let html = '';
    window.attachedImages.forEach((imgSrc, index) => {
        html += `
            <div style="position:relative; width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink: 0; border: 1px solid #E5E8EB;">
                <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
                <button onclick="window.removeAttachedImage(${index})" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer;">✕</button>
            </div>
        `;
    });
    previewArea.innerHTML = html;
};

window.removeAttachedImage = function(index) {
    window.attachedImages.splice(index, 1);
    window.renderPreviewImages();
};

// ==========================================
// 🚀 맘수다 글쓰기 & 커뮤니티 마스터 엔진 
// ==========================================
window.currentCommCategory = 'all'; 
window.currentCommSort = 'latest'; 

window.switchCommTab = function(btn, categoryId) {
    document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(10);
    window.currentCommCategory = categoryId;
    window.renderCommunityFeed(); 
};

window.setCommSort = function(sortType) {
    window.currentCommSort = sortType;
    if (navigator.vibrate) navigator.vibrate(10);
    window.renderCommunityFeed();
};

window.submitPost = function(btnElement) { 
    // 🚨 1. 누르는 순간 버튼 비활성화 & 로딩 UI 변환 (따닥 방어막 가동!)
    if (btnElement) {
        if (btnElement.disabled) return; // 이미 처리 중이면 막아버림 (중복 등록 방지)
        btnElement.disabled = true;
        btnElement.innerText = '⏳ 저장중...';
        btnElement.style.opacity = '0.6';
        btnElement.style.cursor = 'not-allowed';
    }

    // 💡 에러 나서 튕길 때 버튼을 다시 살려주는 복구 함수
    const resetBtn = () => {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerText = window.editingPostId ? '수정 완료' : '등록'; 
            btnElement.style.opacity = '1';
            btnElement.style.cursor = 'pointer';
        }
    };

    const catEl = document.getElementById('writeCategory');
    const titleEl = document.getElementById('writeTitle');
    const contentEl = document.getElementById('writeContent');
    const anonEl = document.getElementById('writeAnonymous');

    if (!catEl || !titleEl || !contentEl) {
        alert('글쓰기 화면을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
        resetBtn(); // 에러 시 버튼 복구
        return;
    }

    const category = catEl.value;
    const title = titleEl.value;
    const content = contentEl.value;
    const isAnonymous = anonEl ? anonEl.checked : false;

    // 빈칸 검증 시에도 버튼을 꼭 살려줘야 유저가 다시 누를 수 있습니다.
    if (!category) { resetBtn(); return window.showToast('⚠️ 게시판 카테고리를 선택해주세요!'); }
    if (!title.trim()) { resetBtn(); return window.showToast('⚠️ 게시글 제목을 입력해주세요!'); }
    if (!content.trim()) { resetBtn(); return window.showToast('⚠️ 내용을 입력해주세요!'); }

    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    const myName = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트';
    const authorName = isAnonymous ? '익명마미' : myName;
    const authorIcon = window.getCurrentUserProfileIcon(isAnonymous);

    if (window.editingPostId) {
        // 👉 [기존 글 수정]
        const postIdx = posts.findIndex(p => p.id === window.editingPostId);
        if (postIdx > -1) {
            posts[postIdx].category = category;
            posts[postIdx].title = title;
            posts[postIdx].content = content;
            posts[postIdx].images = window.attachedImages ? [...window.attachedImages] : [];
            posts[postIdx].authorName = authorName; 
            posts[postIdx].authorIcon = authorIcon;
        }
        window.showToast('📝 게시글이 성공적으로 수정되었습니다!');
    } else {
        // 👉 [새로운 글 등록]
        const timestamp = new Date().getTime();
        const newPost = {
            id: 'post_' + timestamp,
            category: category,
            title: title,
            content: content,
            images: window.attachedImages ? [...window.attachedImages] : [], 
            authorName: authorName,
            authorIcon: authorIcon,
            timestamp: timestamp,
            likes: 0,
            comments: 0
        };
        posts.unshift(newPost);
        window.showToast('🎉 게시글이 성공적으로 등록되었습니다!');
    }
    
    try {
        localStorage.setItem('tosil_community_posts', JSON.stringify(posts));
    } catch (e) {
        console.error(e);
        resetBtn();
        return window.showToast('⚠️ 용량이 꽉 찼습니다! 기기의 캐시를 비우거나 사진 갯수를 줄여주세요.');
    }

    // 폼 초기화
    catEl.value = ''; titleEl.value = ''; contentEl.value = '';
    if(anonEl) anonEl.checked = false;
    
    window.attachedImages = []; 
    window.renderPreviewImages();
    localStorage.removeItem('tosil_post_draft');
    
    window.editingPostId = null; 

    // 🚨 2. 저장이 무사히 끝나면 0.5초(500ms) 뒤에 창을 닫습니다. (유저에게 '저장 중'이라는 안도감 부여)
    setTimeout(() => {
        resetBtn(); // 버튼 원상복구
        window.closeWriteModal();
        window.renderCommunityFeed(); 

        if (document.getElementById('postDetailPage')?.classList.contains('active')) {
            window.openPostDetail(window.currentActivePostId);
        }
    }, 500);

   /* 
      ========================================================
      💡 [나중에 맘수다 정식 오픈할 때 이 주석을 풀면 서버와 즉시 연동됩니다!]
      ========================================================
      if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function') {
          window.setDoc(window.doc(window.db, "community", "posts"), { records: posts }).catch(e=>{});
      }
    */
};

// ==========================================
// 📄 상세 페이지 및 댓글 기능
// ==========================================
window.currentActivePostId = null; 

window.openPostDetail = function(postId) {
    window.currentActivePostId = postId; 
    const detailPage = document.getElementById('postDetailPage');
    if(!detailPage) return;
    
    const posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return window.showToast('⚠️ 삭제되었거나 찾을 수 없는 게시글입니다.');

    const headerTitle = document.getElementById('detail-header-title');
    if (headerTitle) {
        let catName = '☕ 일상수다';
        if (post.category === 'qna') catName = '💡 육아질문';
        else if (post.category === 'market') catName = '🥕 나눔/중고';
        else if (post.category === 'hotdeal') catName = '🛒 핫딜정보';
        headerTitle.innerText = catName;
    }

    const diffMins = Math.floor((new Date().getTime() - post.timestamp) / 60000);
    let timeStr = '방금 전';
    if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)}일 전`;
    else if (diffMins >= 60) timeStr = `${Math.floor(diffMins/60)}시간 전`;
    else if (diffMins > 0) timeStr = `${diffMins}분 전`;

    let imageHtml = '';
    if (post.images && post.images.length > 0) {
        let swipeItems = post.images.map(img => `<div class="swipe-item" style="width: 100%; flex-shrink: 0; scroll-snap-align: start;"><img src="${img}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);"></div>`).join('');
        imageHtml = `<div class="image-swipe-wrapper" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; margin-bottom: 24px; border-radius: 12px; scrollbar-width: none;">${swipeItems}</div>`;
    }

  const postContentArea = detailPage.querySelector('div[style*="padding: 24px 20px"]');
    if(postContentArea) {
        postContentArea.innerHTML = `
            <!-- 👤 상단 영역 (작성자 정보 & 스크랩) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #FFF4E6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">${post.authorIcon || '🧸'}</div>
                    <div>
                        <div style="font-size: 15px; font-weight: 800; color: var(--text-title);">${post.authorName}</div>
                        <div style="font-size: 13px; color: var(--text-sub);">${post.region ? post.region + ' · ' : ''}${timeStr}</div>
                    </div>
                </div>
                
                <div onclick="window.toggleScrap('${post.id}', this, event)" style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; padding: 6px 10px; border-radius: 8px; transition: 0.2s; color: ${post.isScrapped ? 'var(--brand-primary)' : 'var(--text-sub)'}; background: ${post.isScrapped ? 'var(--brand-light)' : 'var(--bg-main)'}; border: 1px solid ${post.isScrapped ? 'var(--brand-primary)' : 'var(--border)'};">
                    ${post.isScrapped ? '📌 스크랩됨' : '🔖 스크랩'}
                </div>
            </div>
            
            <!-- 📝 본문 제목 및 내용 -->
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-title); margin: 0 0 16px 0; line-height: 1.4;">${post.title}</h2>
            <p style="font-size: 16px; color: var(--text-body); line-height: 1.6; margin: 0 0 24px 0; word-break: keep-all;">
                ${post.content.replace(/\n/g, '<br>')}
            </p>
            ${imageHtml}
            
            <!-- 🚨 좋아요/댓글 (게시글 본문 제일 바닥에 좌측 밀착, 최신순/인기순 중복 텍스트 삭제 완료!) -->
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 40px;">
                <div class="like-btn" onclick="window.toggleRealLike('${post.id}', this, event)" style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-sub);">
                    <span class="heart-icon" style="color: ${post.liked ? '#FF5A5F' : 'var(--text-sub)'}; font-size: 17px; transition: 0.2s;">${post.liked ? '❤️' : '🤍'}</span> 
                    <span style="font-size: 14px; font-weight: 700;">좋아요 <span class="like-count">${post.likes || 0}</span></span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 6px; color: var(--text-sub);">
                    <span style="font-size: 17px;">💬</span>
                    <span style="font-size: 14px; font-weight: 700;">댓글 <span id="detail-comment-count">${post.comments || 0}</span></span>
                </div>
            </div>
        `;
    }

    if(typeof window.renderComments === 'function') {
        window.renderComments(post.id, 'latest'); 
    }
    
    const commentInput = document.getElementById('newCommentInput');
    if(commentInput) commentInput.setAttribute('data-post-id', post.id);

    detailPage.classList.add('active'); 
    if (navigator.vibrate) navigator.vibrate(20);
};

window.sortComments = function(postId, sortType) {
    const latestBtn = document.getElementById('sort-latest');
    const popularBtn = document.getElementById('sort-popular');
    if(sortType === 'latest') {
        latestBtn.style.color = 'var(--text-title)';
        popularBtn.style.color = 'var(--text-sub)';
    } else {
        latestBtn.style.color = 'var(--text-sub)';
        popularBtn.style.color = 'var(--text-title)';
    }
    if(typeof window.renderComments === 'function') {
        window.renderComments(postId, sortType);
    }
};

window.closePostDetail = function() {
    const detailPage = document.getElementById('postDetailPage');
    if(detailPage) detailPage.classList.remove('active'); 
    const commentInput = document.getElementById('newCommentInput');
    if(commentInput) commentInput.value = '';
};

// ==========================================
// ❤️ 공감 팝핑(Popping) & 햅틱 애니메이션 엔진
// ==========================================
window.toggleRealLike = function(postId, btnEl, event) {
    if (!localStorage.getItem('kakao_id')) return window.showToast("🚨 로그인이 필요한 기능입니다.");
    if(event) event.stopPropagation();
    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let post = posts.find(p => p.id === postId);
    if(!post) return;

    post.liked = !post.liked;
    post.likes = post.liked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);
    localStorage.setItem('tosil_community_posts', JSON.stringify(posts));

    const heartIcon = btnEl.querySelector('.heart-icon');
    const countEl = btnEl.querySelector('.like-count');
    if(heartIcon && countEl) {
        heartIcon.innerText = post.liked ? '❤️' : '🤍';
        heartIcon.style.color = post.liked ? '#FF5A5F' : '#CBD5E1';
        countEl.innerText = post.likes;
        countEl.style.color = post.liked ? '#FF5A5F' : '#8B95A1';
        
        // 💥 하트 팝핑 애니메이션 및 햅틱 진동
        if (post.liked) {
            if (navigator.vibrate) navigator.vibrate([15, 60, 15]);
            heartIcon.style.transform = 'scale(1.8)';
            setTimeout(() => { heartIcon.style.transform = 'scale(1)'; }, 250);
        } else {
            if (navigator.vibrate) navigator.vibrate(10);
            heartIcon.style.transform = 'scale(0.8)';
            setTimeout(() => { heartIcon.style.transform = 'scale(1)'; }, 200);
        }
    }
};

window.toggleScrap = function(postId, btnEl, event) {
    if (!localStorage.getItem('kakao_id')) return window.showToast("🚨 로그인이 필요한 기능입니다.");
    if(event) event.stopPropagation();
    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let post = posts.find(p => p.id === postId);
    if(!post) return;

    post.isScrapped = !post.isScrapped;
    localStorage.setItem('tosil_community_posts', JSON.stringify(posts));

    if(btnEl) {
        btnEl.innerHTML = post.isScrapped ? '📌 스크랩 됨' : '🔖 스크랩';
        btnEl.style.color = post.isScrapped ? 'var(--brand-primary)' : 'var(--text-sub)';
        btnEl.style.background = post.isScrapped ? 'var(--brand-light)' : 'var(--bg-main)';
    }
    window.showToast(post.isScrapped ? '📌 내 스크랩에 저장되었어요!' : '🔖 스크랩이 해제되었습니다.');
};

// ==========================================
// 👑 파이어베이스 연동형 슈퍼 관리자 검증 및 옵션 창
// ==========================================
window.showPostOptions = async function() {
    const postId = window.currentActivePostId; 
    if (!postId) return;

    const posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const myName = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트';
    const isMyPost = (post.authorName === myName || post.authorName === '익명마미');

    let isMasterAdmin = false;
    try {
        if (typeof window.db !== 'undefined' && typeof window.getDoc === 'function') {
            const myKakaoId = localStorage.getItem('kakao_id') || 'MasterAdminKey';
            const adminSnap = await window.getDoc(window.doc(window.db, "admins", String(myKakaoId)));
            if (adminSnap.exists() && adminSnap.data().allowed === true) isMasterAdmin = true;
        }
    } catch (e) { console.warn("관리자 권한 확인 에러", e); }
    if (localStorage.getItem('tosil_is_master') === 'true') isMasterAdmin = true;

    let existing = document.getElementById('post-action-sheet');
    if(existing) existing.remove();

    let menuHtml = '';
    
    // 👑 1. 관리자 모드
    if (isMasterAdmin) {
        menuHtml = `
            <div style="padding: 0 0 16px 0; font-size: 13px; font-weight: 900; color: #3182F6; text-align: center;">👑 육아메이트 대표이사</div>
            <div onclick="window.editPost('${postId}')" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">✏️</span> 글 강제 수정하기
            </div>
            <div onclick="window.deletePost('${postId}'); document.getElementById('post-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🗑️</span> 글 강제 삭제하기
            </div>
            <div onclick="window.blockUser('${post.authorName}')" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚫</span> 이 사용자 영구 차단
            </div>
        `;
    } 
    // 🧍‍♂️ 2. 내 글
    else if (isMyPost) {
        menuHtml = `
            <div onclick="window.editPost('${postId}')" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">✏️</span> 글 수정하기
            </div>
            <div onclick="window.deletePost('${postId}'); document.getElementById('post-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🗑️</span> 글 삭제하기
            </div>
        `;
    } 
   // 🧍‍♂️ 3. 남의 글
    else {
        menuHtml = `
            <div onclick="window.reportContent('post', '${postId}', '${post.authorId}'); document.getElementById('post-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚨</span> 이 글 신고하기
            </div>
            <div onclick="window.blockUser('${post.authorId}', '${post.authorName}'); document.getElementById('post-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚫</span> 이 사용자 차단하기
            </div>
        `;
    }

    const sheetHtml = `
        <div id="post-action-sheet" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 99999; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; transition: opacity 0.2s ease;" onclick="this.remove()">
            <div style="background: #ffffff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px 20px; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.1, 1, 0.2, 1);" onclick="event.stopPropagation()">
                <div style="width: 40px; height: 4px; background: #E5E8EB; border-radius: 2px; margin: 0 auto 20px auto;"></div>
                ${menuHtml}
                <div onclick="document.getElementById('post-action-sheet').remove();" style="margin-top: 16px; padding: 16px 0; font-size: 16px; font-weight: 700; color: #8B95A1; text-align: center; background: #F2F4F6; border-radius: 12px; cursor: pointer;">닫기</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', sheetHtml);
    setTimeout(() => {
        const sheet = document.getElementById('post-action-sheet');
        if(sheet) { sheet.style.opacity = '1'; sheet.firstElementChild.style.transform = 'translateY(0)'; }
    }, 10);
};

window.editPost = function(postId) {
    window.showToast('🛠️ 글 수정 기능은 준비 중입니다!');
    document.getElementById('post-action-sheet').remove();
};

window.deletePost = function(postId) {
    if (!confirm('이 게시글을 정말 삭제하시겠습니까?')) return;
    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem('tosil_community_posts', JSON.stringify(posts));

    if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function') {
        window.setDoc(window.doc(window.db, "community", "posts"), { records: posts }).catch(e=>{});
    }

    window.closePostDetail(); 
    window.showToast('🗑️ 게시글이 깔끔하게 삭제되었습니다.');
    window.renderCommunityFeed(); 
};

// 7. 검색 및 모달 관리, My 활동 내역
window.doCommSearch = function() {
    const inputEl = document.getElementById('commSearchInput');
    const emptyState = document.getElementById('commSearchEmptyState');
    const resultArea = document.getElementById('commSearchResults');
    if(!inputEl || !emptyState || !resultArea) return;
    
    const keyword = inputEl.value.trim().toLowerCase();
    if(keyword === '') { emptyState.style.display = 'flex'; resultArea.innerHTML = ''; return; }
    
    let allPosts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let filtered = allPosts.filter(p => (p.title && p.title.toLowerCase().includes(keyword)) || (p.content && p.content.toLowerCase().includes(keyword)));
    emptyState.style.display = 'none';
    
    if(filtered.length === 0) {
        resultArea.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><div style="font-size: 15px; font-weight: 800; color: var(--text-sub);">'${keyword}'에 대한 검색 결과가 없어요.</div></div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(post => {
        const diffMins = Math.floor((new Date().getTime() - post.timestamp) / 60000);
        let timeStr = '방금 전';
        if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)}일 전`;
        else if (diffMins >= 60) timeStr = `${Math.floor(diffMins/60)}시간 전`;
        else if (diffMins > 0) timeStr = `${diffMins}분 전`;

        let catName = '☕ 일상수다'; let catColor = '#8B5CF6'; let catBg = '#F3E8FF';
        if (post.category === 'qna') { catName = '💡 육아질문'; catColor = 'var(--brand-primary)'; catBg = 'var(--brand-light)'; }
        else if (post.category === 'market') { catName = '🥕 나눔/중고'; catColor = '#00B37A'; catBg = '#E6F7F2'; }
        else if (post.category === 'hotdeal') { catName = '🛒 핫딜정보'; catColor = '#FF823A'; catBg = '#FFF4ED'; }

        html += `
            <div class="feed-card" onclick="window.closeSearchAndOpenPost('${post.id}')" style="cursor: pointer; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 11.5px; font-weight: 800; color: ${catColor}; background: ${catBg}; padding: 4px 10px; border-radius: 8px;">${catName}</span>
                    <span style="font-size: 12px; color: var(--text-sub); font-weight: 600;">${timeStr}</span>
                </div>
                <div style="font-size: 16px; font-weight: 800; color: var(--text-title); margin-bottom: 8px; line-height: 1.4; word-break: keep-all;">${post.title}</div>
                <div style="font-size: 14px; color: var(--text-body); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.content}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 24px; height: 24px; background: #F2F4F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">${post.authorIcon || '👑'}</div>
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-body);">${post.authorName}</span>
                    </div>
                    <div style="display: flex; gap: 10px; font-size: 12px; font-weight: 700; color: var(--text-sub);">
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="color: ${post.liked ? '#FF5A5F' : '#CBD5E1'};">❤️</span> ${post.likes || 0}</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="color: var(--brand-primary);">💬</span> ${post.comments || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
    resultArea.innerHTML = html;
};

window.closeSearchAndOpenPost = function(postId) {
    document.getElementById('commSearchOverlay').classList.remove('active');
    setTimeout(() => { if(typeof window.openPostDetail === 'function') window.openPostDetail(postId); }, 150);
};

window.openMyActivity = function(type) {
    const overlay = document.getElementById('commActivityOverlay');
    const titleEl = document.getElementById('activity-title');
    const contentArea = overlay.querySelector('div:nth-child(2)'); 
    if(!overlay || !titleEl || !contentArea) return;

    if (type === 'posts') titleEl.innerText = '내가 쓴 글';
    else if (type === 'comments') titleEl.innerText = '댓글 단 글';
    else if (type === 'scraps') titleEl.innerText = '스크랩한 글';

    let allPosts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let myNickname = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트'; 

    let filtered = [];
    if (type === 'posts') filtered = allPosts.filter(p => p.authorName === myNickname);
    else if (type === 'comments') filtered = allPosts.filter(p => p.hasMyComment === true);
    else if (type === 'scraps') filtered = allPosts.filter(p => p.isScrapped === true);

    if (filtered.length === 0) {
        contentArea.style.padding = '20px'; contentArea.style.background = 'var(--bg-main)';
        contentArea.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text-title); margin-bottom: 8px;">아직 내역이 없어요!</div>
            <div style="font-size: 13.5px; color: var(--text-sub);">다양한 활동을 시작해보세요.</div>
        `;
    } else {
        contentArea.style.padding = '20px'; contentArea.style.background = 'var(--bg-main)'; contentArea.style.overflowY = 'auto'; contentArea.style.justifyContent = 'flex-start'; 
        let html = '<div style="width: 100%;">';
        filtered.forEach(post => {
            let catName = '☕ 일상수다'; let catColor = '#8B5CF6'; let catBg = '#F3E8FF';
            if (post.category === 'qna') { catName = '💡 육아질문'; catColor = 'var(--brand-primary)'; catBg = 'var(--brand-light)'; }
            else if (post.category === 'market') { catName = '🥕 나눔/중고'; catColor = '#00B37A'; catBg = '#E6F7F2'; }
            
            html += `
                <div class="feed-card" onclick="window.closeActivityAndOpenPost('${post.id}')" style="cursor: pointer; margin-bottom: 16px; background: var(--bg-card); padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 11.5px; font-weight: 800; color: ${catColor}; background: ${catBg}; padding: 4px 10px; border-radius: 8px;">${catName}</span>
                    </div>
                    <div style="font-size: 16px; font-weight: 800; color: var(--text-title); margin-bottom: 8px; line-height: 1.4; word-break: keep-all;">${post.title}</div>
                    <div style="display: flex; gap: 10px; font-size: 12px; font-weight: 700; color: var(--text-sub);">
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="color: #FF5A5F;">❤️</span> ${post.likes || 0}</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="color: var(--brand-primary);">💬</span> ${post.comments || 0}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentArea.innerHTML = html;
    }
    overlay.classList.add('active');
};

window.closeActivityAndOpenPost = function(postId) {
    document.getElementById('commActivityOverlay').classList.remove('active');
    setTimeout(() => { if(typeof window.openPostDetail === 'function') window.openPostDetail(postId); }, 150);
};

// ==========================================
// 🔄 커뮤니티 게시글 & 댓글 로컬 전용 모드 (정식 오픈 시 주석 해제)
// ==========================================
let commUnsubscribe = null;
window.startCommunityRealtimeSync = function() {
    if (typeof window.renderCommunityFeed === 'function') {
        window.renderCommunityFeed();
    }

    /* 
      ========================================================
      💡 [나중에 정식 오픈할 때 아래 주석을 풀면 서버와 즉시 연동됩니다!]
      ========================================================
      if (typeof window.doc === 'undefined' || typeof window.db === 'undefined') return;
      const docRef = window.doc(window.db, "community", "posts");
      if (commUnsubscribe) commUnsubscribe();
      commUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              localStorage.setItem('tosil_community_posts', JSON.stringify(data.records || []));
              window.renderCommunityFeed(); 
          }
      });
    */
};

let commentUnsubscribe = null;
window.startCommentRealtimeSync = function() {
    const inputField = document.getElementById('newCommentInput');
    if (inputField && document.getElementById('postDetailPage')?.classList.contains('active')) {
        const currentPostId = inputField.getAttribute('data-post-id');
        if (currentPostId && typeof window.renderComments === 'function') {
            window.renderComments(currentPostId);
        }
    }

    /* 
      ========================================================
      💡 [나중에 정식 오픈할 때 아래 주석을 풀면 서버와 즉시 연동됩니다!]
      ========================================================
      if (typeof window.doc === 'undefined' || typeof window.db === 'undefined') return;
      const docRef = window.doc(window.db, "community", "comments");
      if (commentUnsubscribe) commentUnsubscribe();
      commentUnsubscribe = window.onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              localStorage.setItem('tosil_community_comments', JSON.stringify(data.records || []));
              const inputField = document.getElementById('newCommentInput');
              if (inputField && document.getElementById('postDetailPage')?.classList.contains('active')) {
                  const currentPostId = inputField.getAttribute('data-post-id');
                  if (currentPostId) window.renderComments(currentPostId);
              }
          }
      });
    */
};

// ==========================================
// 👤 맘수다 전용 마이페이지 (관리자 권한 자동 갱신 100% 패치)
// ==========================================

// 🚨 하단 탭 메뉴를 누를 때마다 무조건 권한을 재확인하도록 기본 내비게이션 엔진 가로채기!
const originalSwitchTab = window.switchTab;
window.switchTab = function(id, el) {
    if (typeof originalSwitchTab === 'function') {
        originalSwitchTab(id, el);
    }
    // 마이페이지 탭이 열리면 즉시 프로필과 직급을 갱신!
    if (id === 'mypage') {
        if (typeof window.updateMyPageProfile === 'function') window.updateMyPageProfile();
    }
};

window.openMyPage = function() {
    if (typeof window.switchTab === 'function') window.switchTab('mypage', null);
    
    const input = document.getElementById('comm-nickname-input');
    if(input) input.value = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트';
    window.scrollTo(0, 0);
};

window.closeMyPage = function() {
    if (typeof window.switchTab === 'function') window.switchTab('home', document.getElementById('nav-home'));
};

// 🚨 파이어베이스 v8 호환 & 비동기 딜레이를 완벽히 해결한 권한 갱신 엔진
window.updateMyPageProfile = function() {
    let myNickname = localStorage.getItem('community_nickname') || '익명의 곰돌이';
    const nicknameInput = document.getElementById('comm-nickname-input');
    if (nicknameInput) nicknameInput.value = myNickname;

    const myKakaoId = localStorage.getItem('kakao_id');

    // UI 직급 텍스트 즉시 변경 함수
    const renderAdminUI = () => {
        const isMaster = localStorage.getItem('tosil_is_master') === 'true';
        const isSubAdmin = localStorage.getItem('tosil_is_subadmin') === 'true';
        
        let roleName = "🧸 일반 회원";
        if (isMaster) roleName = "👑 최고 관리자(대표이사)";
        else if (isSubAdmin) roleName = "🌟 관리자";

        // 대표님 화면(스크린샷)에 맞춰 텍스트 교체
        const userInfo = document.getElementById('mypage-user-info');
        if (userInfo) userInfo.innerText = `${roleName} · 육아메이트와 함께하는 중!`;
        
        const profileCircle = document.getElementById('mypage-profile-icon');
        if(profileCircle && typeof window.getCurrentUserProfileIcon === 'function') {
            profileCircle.innerHTML = window.getCurrentUserProfileIcon(false);
            profileCircle.style.background = localStorage.getItem('community_profile_image') ? '#FFF' : '#FFF4E6';
        }
    };

    // 1. 로그인 안 되어 있으면 일반 회원
    if (!myKakaoId) {
        localStorage.removeItem('tosil_is_master');
        localStorage.removeItem('tosil_is_subadmin');
        renderAdminUI();
        return;
    } 
    
    // 2. 대표님 카카오ID면 무조건 프리패스 (서버 기다릴 필요 없음)
    const MASTER_IDS = ["4995493811", "대표님카카오ID숫자"]; 
    if (MASTER_IDS.includes(String(myKakaoId).trim())) {
        localStorage.setItem('tosil_is_master', 'true');
        renderAdminUI();
        return;
    }

    // 3. 서버(Firebase)에서 직급 불러오기 (v8 문법)
    if (window.db) {
        window.db.collection("admins").doc(String(myKakaoId)).get()
        .then(doc => {
            if (doc.exists) {
                const role = doc.data().role;
                if (role === 'master_admin') {
                    localStorage.setItem('tosil_is_master', 'true');
                    localStorage.removeItem('tosil_is_subadmin');
                } else if (role === 'admin') {
                    localStorage.setItem('tosil_is_subadmin', 'true');
                    localStorage.removeItem('tosil_is_master');
                }
            } else {
                localStorage.removeItem('tosil_is_master');
                localStorage.removeItem('tosil_is_subadmin');
            }
            renderAdminUI(); // 서버에서 데이터 가져온 후 UI 한번 더 갱신!
        }).catch(() => { renderAdminUI(); });
    } else {
        renderAdminUI();
    }

    // 게시글, 댓글, 스크랩 숫자 반영
    const posts = JSON.parse(localStorage.getItem('tosil_community_posts') || '[]');
    const comments = JSON.parse(localStorage.getItem('tosil_community_comments') || '[]');
    if(document.getElementById('mypage-post-count')) document.getElementById('mypage-post-count').innerText = posts.filter(p => p.authorName === myNickname).length;
    if(document.getElementById('mypage-comment-count')) document.getElementById('mypage-comment-count').innerText = comments.filter(c => c.authorName === myNickname).length;
    if(document.getElementById('mypage-scrap-count')) document.getElementById('mypage-scrap-count').innerText = posts.filter(p => p.isScrapped === true).length;
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { if (typeof window.updateMyPageProfile === 'function') window.updateMyPageProfile(); }, 500);
});

// ==========================================
// 닉네임 [변경] 버튼을 눌렀을 때 작동하는 함수
// ==========================================
window.changeNickname = function() {
    const input = document.getElementById('comm-nickname-input');
    if(!input) return;
    
    const newName = input.value.trim();

    // 🕵️ [대표님 전용 비밀 명령어] 
    // 닉네임 칸에 #내아이디# 라고 치고 변경을 누르면, 화면에는 안 남고 경고창(Alert)으로만 내 카카오 ID를 띄워줍니다!
    if (newName === '#내아이디#') {
        const myId = localStorage.getItem('kakao_id');
        if (myId) {
            alert(`[관리자 전용] 이 계정의 카카오 고유 ID는 아래와 같습니다.\n\n${myId}\n\n이 숫자를 파이어베이스 admins에 등록하세요.`);
        } else {
            alert("카카오 로그인 정보가 없습니다.");
        }
        input.value = ''; // 입력창 초기화
        return; // 닉네임이 실제로 바뀌지 않게 멈춤
    }

    if(!newName) return window.showToast("🚨 닉네임을 입력해주세요!");
    if(newName.length > 10) return window.showToast("🚨 닉네임은 10자 이내로 예쁘게 지어주세요.");

    // 🚫 [철통 방어: 등급별 금칙어 시스템]
    const isMaster = localStorage.getItem('tosil_is_master') === 'true';
    const isSubAdmin = localStorage.getItem('tosil_is_subadmin') === 'true';

    // 관리자가 아니면 '육아메이트', '대표', '운영진' 등 절대 사용 불가
    if (!isMaster && !isSubAdmin && (newName.includes('육아메이트') || newName.includes('대표') || newName.includes('관리자') || newName.includes('운영자') || newName.includes('운영진') || newName.includes('admin') || newName.includes('master'))) {
        return window.showToast("🚨 해당 단어는 사칭 방지를 위해 사용할 수 없습니다.");
    }
    
    // 검증 통과! 닉네임 일괄 업데이트
    const oldName = localStorage.getItem('community_nickname');
    localStorage.setItem('community_nickname', newName);
    
    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    posts.forEach(p => { if(p.authorName === oldName) p.authorName = newName; });
    localStorage.setItem('tosil_community_posts', JSON.stringify(posts));

    let comments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
    comments.forEach(c => { if(c.authorName === oldName) c.authorName = newName; });
    localStorage.setItem('tosil_community_comments', JSON.stringify(comments));

    window.showToast(`✨ [${newName}]님으로 닉네임이 변경되었습니다!`);
    
    window.updateMyPageProfile(); 
    if(typeof window.renderCommunityFeed === 'function') window.renderCommunityFeed(); 
    
    // 🔥 [명부 동기화] 닉네임을 바꾸면 파이어베이스 users 폴더에도 즉시 내 이름 업데이트!
    if(typeof window.saveUserInfoToFirebase === 'function') window.saveUserInfoToFirebase(); 
};

// ==========================================
// 🛠️ 글 수정, 삭제, 차단, 친구초대 엔진
// ==========================================
window.editingPostId = null;

window.editPost = function(postId) {
    let existingSheet = document.getElementById('post-action-sheet');
    if(existingSheet) existingSheet.remove();

    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let post = posts.find(p => p.id === postId);
    if(!post) return;

    window.editingPostId = postId;
    
    // 데이터 불러오기
    document.getElementById('writeCategory').value = post.category;
    document.getElementById('writeTitle').value = post.title;
    document.getElementById('writeContent').value = post.content;
    const anonEl = document.getElementById('writeAnonymous');
    if(anonEl) anonEl.checked = (post.authorName === '익명마미');
    window.attachedImages = post.images ? [...post.images] : [];

    window.closePostDetail();
    setTimeout(() => {
        window.openWriteModal();
        window.renderPreviewImages();
    }, 300);
};

window.deletePost = function(postId) {
    window.showConfirm("이 게시글을 정말 삭제하시겠습니까?", function() {
        let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('tosil_community_posts', JSON.stringify(posts));

        if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function') {
            window.setDoc(window.doc(window.db, "community", "posts"), { records: posts }).catch(e=>{});
        }
        window.closePostDetail(); 
        window.showToast('🗑️ 게시글이 깔끔하게 삭제되었습니다.');
        window.renderCommunityFeed(); 
    }, "🗑️", "삭제", "#F04452");
};

// 🚫 유저 차단 시스템
window.blockUser = function(authorName) {
    if(authorName === '육아메이트' || authorName === '육아천재대표님') return window.showToast("🚨 최고 관리자는 차단할 수 없습니다.");
    
    window.showConfirm(`'${authorName}'님의 글과 댓글을<br>더 이상 보지 않으시겠습니까?`, function() {
        let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];
        if(!blockedUsers.includes(authorName)) {
            blockedUsers.push(authorName);
            localStorage.setItem('tosil_blocked_users', JSON.stringify(blockedUsers));
        }
        
        document.getElementById('post-action-sheet')?.remove();
        window.closePostDetail();
        window.renderCommunityFeed();
        window.showToast(`🚫 '${authorName}'님이 차단되었습니다.`);
    }, "🚫", "차단하기", "#333D4B");
};

// 🚫 차단 목록 보기
window.openBlockedUsers = function() {
    const listArea = document.getElementById('blockedUsersList');
    if(!listArea) return;
    
    let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];
    
    if(blockedUsers.length === 0) {
        listArea.innerHTML = `
            <div style="text-align: center; padding-top: 100px;">
                <div style="font-size: 40px; margin-bottom: 16px;">🌿</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--text-m); margin-bottom: 8px;">차단한 사용자가 없어요!</div>
                <div style="font-size: 13.5px; color: var(--text-s);">클린한 육아메이트 커뮤니티입니다.</div>
            </div>`;
    } else {
        let html = '';
        blockedUsers.forEach(name => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 8px;">
                    <div style="font-size: 15px; font-weight: 800; color: var(--text-m);">👤 ${name}</div>
                    <button onclick="window.unblockUser('${name}')" style="background: #F2F5F8; color: #4E5968; border: none; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;">차단 해제</button>
                </div>
            `;
        });
        listArea.innerHTML = html;
    }
    document.getElementById('commBlockOverlay').classList.add('active');
};

window.unblockUser = function(name) {
    let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];
    blockedUsers = blockedUsers.filter(u => u !== name);
    localStorage.setItem('tosil_blocked_users', JSON.stringify(blockedUsers));
    
    window.openBlockedUsers(); // 새로고침
    window.renderCommunityFeed(); // 피드 원상복구
    window.showToast(`✅ '${name}'님 차단이 해제되었습니다.`);
};

// 🎁 친구 초대
window.inviteMamsudaFriend = function() {
    const text = "동네 엄빠들과의 육아 꿀팁, 나눔, 핫딜 정보까지! 맘수다에서 우리 같이 수다 떨어요 ☕🤍";
    const url = "https://happy-baby0303.github.io/"; 
    
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '💬 맘수다 커뮤니티 초대장',
                description: text,
                imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                link: { mobileWebUrl: url, webUrl: url },
            },
            buttons: [{ title: '맘수다 놀러가기', link: { mobileWebUrl: url, webUrl: url } }]
        });
    } else if (navigator.share) {
        navigator.share({ title: '육아메이트 맘수다 초대', text: text, url: url }).catch(() => {});
    } else {
        prompt("아래 텍스트를 복사해서 친구에게 보내주세요!", text + " " + url);
    }
};


// ==========================================
// 🖼️ 전체화면 이미지 뷰어 엔진 (당근마켓 스타일)
// ==========================================
window.openImageViewer = function(src) {
    let viewer = document.getElementById('global-image-viewer');
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'global-image-viewer';
        viewer.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:999999; display:none; justify-content:center; align-items:center; flex-direction:column; opacity:0; transition:opacity 0.2s;';
        viewer.innerHTML = `
            <div style="position:absolute; top:20px; left:20px; font-weight:900; color:#FFF; text-shadow:0 2px 4px rgba(0,0,0,0.5);">📷 상세 보기</div>
            <img id="global-image-viewer-img" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:12px; transform:scale(0.8); transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);">
            <button onclick="window.closeImageViewer()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.2); color:#FFF; border:none; width:36px; height:36px; border-radius:50%; font-size:16px; font-weight:900; cursor:pointer; backdrop-filter:blur(4px);">✕</button>
        `;
        viewer.onclick = function(e) { if(e.target.id === 'global-image-viewer') window.closeImageViewer(); };
        document.body.appendChild(viewer);
    }
    const imgEl = document.getElementById('global-image-viewer-img');
    imgEl.src = src;
    viewer.style.display = 'flex';
    setTimeout(() => { viewer.style.opacity = '1'; imgEl.style.transform = 'scale(1)'; }, 10);
};

window.closeImageViewer = function() {
    const viewer = document.getElementById('global-image-viewer');
    const imgEl = document.getElementById('global-image-viewer-img');
    if(viewer) {
        viewer.style.opacity = '0';
        imgEl.style.transform = 'scale(0.8)';
        setTimeout(() => { viewer.style.display = 'none'; }, 200);
    }
};

window.searchByTag = function(tag) {
    const searchInput = document.getElementById('commSearchInput');
    if (searchInput) {
        searchInput.value = tag.replace('#', '');
        document.getElementById('commSearchOverlay').classList.add('active');
        if(typeof window.doCommSearch === 'function') window.doCommSearch();
    }
};

// ==========================================
// 🎨 하이엔드 피드 렌더링 엔진 (먹통 에러 완전 해결본)
// ==========================================
window.renderCommunityFeed = function() {
    const container = document.getElementById('community-feed');
    if(!container) return;

    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];

    // 차단 유저 필터링
    posts = posts.filter(p => !blockedUsers.includes(p.authorName));

    if (window.currentCommCategory !== 'all') {
        posts = posts.filter(p => p.category === window.currentCommCategory);
    }

    if (window.currentCommSort === 'popular') {
        posts.sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.timestamp - a.timestamp);
    } else {
        posts.sort((a, b) => b.timestamp - a.timestamp);
    }

// 🏷️ 실시간 인기 태그 칩
    const popularTags = ['#수유텀', '#수면교육', '#당근나눔', '#핫딜공유', '#이유식거부', '#유모차추천'];
    
    // 🚨 촌스러운 흰색 배경 삭제! 화면 양끝까지 시원하게 스와이프 되도록 네거티브 마진(-20px) 마법 적용
    let tagsHtml = `<div style="display: flex; overflow-x: auto; gap: 8px; margin: 0 -20px 20px -20px; padding: 0 20px 8px 20px; scrollbar-width: none;">`;
    popularTags.forEach(tag => {
        tagsHtml += `<button onclick="window.searchByTag('${tag}')" style="flex-shrink: 0; padding: 8px 14px; background: #FFFFFF; border: 1px solid #E5E8EB; border-radius: 20px; font-size: 13px; font-weight: 800; color: #4E5968; box-shadow: 0 2px 4px rgba(0,0,0,0.02); cursor: pointer; transition: 0.2s;">${tag}</button>`;
    });
    tagsHtml += `</div>`;

    // 🌟 레이아웃 재배치: 태그 -> 정렬 버튼 -> 공지배너 순서로 자연스럽게!
    let html = `
        ${tagsHtml}
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 15px; font-weight: 900; color: var(--text-m);">🔥 실시간 인기글</div>
            <div style="display: flex; gap: 8px;">
                <button onclick="window.setCommSort('latest')" style="padding: 6px 14px; border: none; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; background: ${window.currentCommSort === 'latest' ? '#333D4B' : 'transparent'}; color: ${window.currentCommSort === 'latest' ? '#FFFFFF' : '#8B95A1'};">최신순</button>
                <button onclick="window.setCommSort('popular')" style="padding: 6px 14px; border: none; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; background: ${window.currentCommSort === 'popular' ? '#F04452' : 'transparent'}; color: ${window.currentCommSort === 'popular' ? '#FFFFFF' : '#8B95A1'};">인기순</button>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #F0F7FF 0%, #E0EDFF 100%); border-radius: 16px; padding: 18px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 12px rgba(49, 130, 246, 0.08);">
            <div style="font-size: 24px; animation: bounce 2s infinite;">🚀</div>
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 900; color: #1C64F2; margin-bottom: 4px;">맘수다 커뮤니티 오픈 준비 중!</div>
                <div style="font-size: 12.5px; font-weight: 600; color: #3F83F8; line-height: 1.4; word-break: keep-all;">현재 베타 테스트 중입니다. 작성된 글은 내 스마트폰에서만 보입니다.</div>
            </div>
        </div>
    `;

    // 📢 운영자 공지글
    if (window.currentCommCategory === 'all' || window.currentCommCategory === 'talk') {
        html += `
        <div class="feed-card" style="background: #F8FAFC; border-radius: 20px; padding: 20px; margin-bottom: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 8px; color: #FFFFFF; background: #3182F6;">📢 운영자 공지</span>
                <span style="font-size: 12px; color: #3182F6; font-weight: 800;">📌 고정됨</span>
            </div>
            <div style="font-size: 16.5px; font-weight: 900; color: #191F28; margin-bottom: 8px; letter-spacing: -0.5px; line-height: 1.4; word-break: keep-all;">
                안녕하세요! 맘수다 게시판은 현재 정식 오픈 준비 중입니다 🚀
            </div>
            <div style="font-size: 14px; color: #4E5968; line-height: 1.5; margin-bottom: 16px; word-break: keep-all; font-weight: 500;">
                엄빠님들과 따뜻한 소통을 나눌 수 있는 '맘수다' 커뮤니티가 곧 정식으로 찾아옵니다!<br><br>
                유저분들의 트래픽을 감당할 수 있는 쾌적하고 안전한 서버 환경을 만들기 위해 열심히 구축하고 있어요. 조금만 기다려 주시면 더 유용한 기능들과 함께 짠! 하고 오픈하겠습니다 🤍<br>
                <span style="color:#8B95A1; font-size:12px; margin-top: 8px; display: block;">* 현재 글쓰기 및 댓글 기능은 테스트용으로 내 기기에서만 작동합니다.</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 14px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 24px; height: 24px; background: #EBF4FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">👑</div>
                    <span style="font-size: 12.5px; font-weight: 800; color: #191F28;">육아메이트 하윤맘</span>
                </div>
                <div style="display: flex; gap: 12px; font-size: 13px; font-weight: 700; color: var(--text-sub);">
                    <div style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: #FFF0F1; border-radius: 10px;">
                        <span style="color: #FF5A5F; font-size: 13px;">❤️</span> <span style="color: #F04452;">999+</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    if (posts.length === 0) {
        html += `
            <div style="text-align:center; padding:60px 20px; background:transparent;">
                <div style="font-size:40px; margin-bottom:16px; opacity:0.3;">💬</div>
                <div style="font-size:16px; font-weight:800; color:var(--text-sub); margin-bottom:8px;">아직 등록된 유저 게시글이 없어요!</div>
                <div style="font-size:13.5px; font-weight:600; color:var(--text-s);">가장 먼저 일상을 공유해 보세요 ✍️</div>
            </div>`;
        container.innerHTML = html;
        return;
    }

    // 일반 게시글 렌더링
    posts.forEach(post => {
        let catName = ''; let catColor = ''; let catBg = '';
        if (post.category === 'qna') { catName = '육아질문'; catColor = 'var(--brand-primary)'; catBg = 'var(--brand-light)'; }
        else if (post.category === 'talk') { catName = '일상수다'; catColor = '#8B5CF6'; catBg = '#F3E8FF'; }
        else if (post.category === 'market') { catName = '나눔/중고'; catColor = '#00B37A'; catBg = '#E6F7F2'; }
        else if (post.category === 'hotdeal') { catName = '핫딜정보'; catColor = '#FF8A00'; catBg = '#FFF4E6'; }

        const diffMins = Math.floor((new Date().getTime() - post.timestamp) / 60000);
        let timeStr = '방금 전';
        if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)}일 전`;
        else if (diffMins >= 60) timeStr = `${Math.floor(diffMins/60)}시간 전`;
        else if (diffMins > 0) timeStr = `${diffMins}분 전`;

        let imageHtml = '';
        if (post.images && post.images.length > 0) {
            let swipeItems = post.images.map(img => `<div class="swipe-item" style="width: 100%; flex-shrink: 0; scroll-snap-align: start;"><img src="${img}" onclick="event.stopPropagation(); window.openImageViewer('${img}')" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(0,0,0,0.04);"></div>`).join('');
            imageHtml = `<div class="image-swipe-wrapper" onclick="event.stopPropagation()" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; margin-top: 14px; border-radius: 12px; scrollbar-width: none;">${swipeItems}</div>`;
        }

        html += `
        <div class="feed-card" onclick="window.openPostDetail('${post.id}')" style="background: var(--bg-card); border-radius: 20px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 16px rgba(0,0,0,0.03); cursor: pointer; transition: transform 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 11.5px; font-weight: 800; color: ${catColor}; background: ${catBg}; padding: 4px 10px; border-radius: 8px;">${catName}</span>
                <span style="font-size: 12px; color: var(--text-s); font-weight: 600;">${timeStr}</span>
            </div>
            
            <div style="font-size: 16.5px; font-weight: 900; color: var(--text-title); margin-bottom: 8px; line-height: 1.4; word-break: keep-all; letter-spacing: -0.5px;">
                ${post.title}
            </div>
            
            <div style="font-size: 14px; color: var(--text-body); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: keep-all; font-weight: 500;">
                ${post.content.replace(/\n/g, ' ')}
            </div>
            
            ${imageHtml}
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 24px; height: 24px; background: #F2F4F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">${post.authorIcon}</div>
                    <span style="font-size: 12.5px; font-weight: 700; color: var(--text-body);">${post.authorName}</span>
                </div>
                <div style="display: flex; gap: 12px; font-size: 13px; font-weight: 700; color: var(--text-sub);">
                    <div class="like-btn" onclick="window.toggleRealLike('${post.id}', this, event)" style="display: flex; align-items: center; gap: 4px; cursor: pointer; background: #F8F9FA; padding: 4px 8px; border-radius: 10px;">
                        <span class="heart-icon" style="color: ${post.liked ? '#FF5A5F' : '#CBD5E1'}; font-size: 13px; display:inline-block; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">${post.liked ? '❤️' : '🤍'}</span>
                        <span class="like-count" style="color: ${post.liked ? '#FF5A5F' : '#8B95A1'};">${post.likes || 0}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; background: #F8F9FA; padding: 4px 8px; border-radius: 10px;">
                        <span style="color: var(--brand-primary); font-size: 13px;">💬</span> <span>${post.comments || 0}</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    container.innerHTML = html;
};

// ==========================================
// 👤 맘수다 프로필 프사 & 등급별 아이콘 자동화 엔진
// ==========================================

window.getCurrentUserProfileIcon = function(isAnonymous = false) {
    if (isAnonymous) return '☁️'; 

    const customImg = localStorage.getItem('community_profile_image');
    if (customImg) {
        return `<img src="${customImg}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }

    const isMaster = localStorage.getItem('tosil_is_master') === 'true';
    const isSubAdmin = localStorage.getItem('tosil_is_subadmin') === 'true';

    if (isMaster) return '👑'; // 최고 관리자
    if (isSubAdmin) return '🌟'; // 일반 관리자
    return '🧸'; // 일반 회원
};

window.triggerProfileImageUpload = function() {
    let fileInput = document.getElementById('profileImageInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'profileImageInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = window.handleProfileImageSelection;
        document.body.appendChild(fileInput);
    }
    fileInput.click();
};

window.handleProfileImageSelection = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 150; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
            } else {
                if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            localStorage.setItem('community_profile_image', dataUrl); 

            const profileCircle = document.getElementById('mypage-profile-icon');
            if(profileCircle) {
                profileCircle.innerHTML = window.getCurrentUserProfileIcon(false);
                profileCircle.style.background = '#FFF'; 
            }
            
            if(typeof window.renderCommunityFeed === 'function') window.renderCommunityFeed();
            window.showToast('📸 내 프로필 사진이 멋지게 변경되었습니다!');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = ''; 
};

// ==========================================
// 👤 마이페이지 프로필 & 실시간 활동 데이터 연동 엔진 (타입 완벽 방어 패치)
// ==========================================

window.updateMyPageProfile = async function() {
    let myNickname = localStorage.getItem('community_nickname');
    if (!myNickname) {
        myNickname = "익명의 곰돌이"; 
        localStorage.setItem('community_nickname', myNickname);
    }
    const nicknameInput = document.getElementById('comm-nickname-input');
    if (nicknameInput) nicknameInput.value = myNickname;

    const rawKakaoId = localStorage.getItem('kakao_id');
    const myKakaoId = rawKakaoId ? String(rawKakaoId).trim() : null;

    // 🛡️ [보안 패치] 카카오 로그아웃 상태면 무조건 관리자 권한 즉시 박탈!
    if (!myKakaoId) {
        localStorage.removeItem('tosil_is_master');
        localStorage.removeItem('tosil_is_subadmin');
    } else {
        // 👑 [1순위 직통 방어] 대표님과 사모님 카카오 ID (숫자/문자열 무엇이든 통과하도록 String 변환 후 비교)
        const MASTER_IDS = ["4995493811", "대표님카카오ID숫자"]; 
        
        // 대소문자 및 타입 완벽 일치 검사
        const isHardcodedMaster = MASTER_IDS.some(id => String(id).trim() === myKakaoId);

        if (isHardcodedMaster) {
            localStorage.setItem('tosil_is_master', 'true');
            localStorage.removeItem('tosil_is_subadmin');
        } else {
            // 🔥 [2순위 파이어베이스 검증 로직] 🔥
            if (typeof window.db !== 'undefined' && typeof window.getDoc === 'function') {
                try {
                    const adminSnap = await window.getDoc(window.doc(window.db, "admins", myKakaoId));
                    if (adminSnap.exists()) {
                        const role = adminSnap.data().role;
                        if (role === 'master_admin') {
                            localStorage.setItem('tosil_is_master', 'true');
                            localStorage.removeItem('tosil_is_subadmin');
                        } else if (role === 'admin') {
                            localStorage.setItem('tosil_is_subadmin', 'true');
                            localStorage.removeItem('tosil_is_master');
                        }
                    } else {
                        localStorage.removeItem('tosil_is_master');
                        localStorage.removeItem('tosil_is_subadmin');
                    }
                } catch (e) {
                    console.warn("관리자 검증 중 에러 발생 (오프라인 모드)");
                }
            }
        }
    }

    // 2. 권한별 직급 표시
    const isMaster = localStorage.getItem('tosil_is_master') === 'true';
    const isSubAdmin = localStorage.getItem('tosil_is_subadmin') === 'true';
    
    let roleName = "🧸 일반 회원";
    if (isMaster) roleName = "👑 최고 관리자(대표이사)";
    else if (isSubAdmin) roleName = "🌟 관리자";

    const userInfo = document.getElementById('mypage-user-info');
    if (userInfo) userInfo.innerText = `${roleName} · 환영합니다!`;

    // 3. 내 활동 내역 카운트
    const posts = JSON.parse(localStorage.getItem('tosil_community_posts') || '[]');
    const comments = JSON.parse(localStorage.getItem('tosil_community_comments') || '[]');
    
    let myPostCount = posts.filter(p => p.authorName === myNickname).length;
    let myCommentCount = comments.filter(c => c.authorName === myNickname).length;
    let myScrapCount = posts.filter(p => p.isScrapped === true).length;

    const postEl = document.getElementById('mypage-post-count');
    const commentEl = document.getElementById('mypage-comment-count');
    const scrapEl = document.getElementById('mypage-scrap-count');

    if (postEl) postEl.innerText = myPostCount;
    if (commentEl) commentEl.innerText = myCommentCount;
    if (scrapEl) scrapEl.innerText = myScrapCount;

    // 4. 프사 업데이트
    const profileCircle = document.getElementById('mypage-profile-icon');
    if(profileCircle && typeof window.getCurrentUserProfileIcon === 'function') {
        profileCircle.innerHTML = window.getCurrentUserProfileIcon(false);
        profileCircle.style.background = localStorage.getItem('community_profile_image') ? '#FFF' : '#FFF4E6';
    }
};

// ==========================================
// 📇 전체 유저 명부 파이어베이스 자동 기록 엔진
// ==========================================
window.saveUserInfoToFirebase = async function() {
    const myKakaoId = localStorage.getItem('kakao_id');
    let myNickname = localStorage.getItem('community_nickname') || '익명의 곰돌이';

    // 파이어베이스 DB가 연결되어 있고, 카카오 ID가 있을 때만 실행
    if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function' && myKakaoId) {
        try {
            // 'users' 라는 컬렉션(폴더)에 카카오 ID를 이름으로 하는 문서 생성
            await window.setDoc(window.doc(window.db, "users", String(myKakaoId)), {
                kakao_id: myKakaoId,
                nickname: myNickname,
                last_login: new Date().toISOString()
            }, { merge: true }); // 기존 데이터(작성 글 수 등)가 있다면 덮어쓰지 않고 유지
            
            console.log("✅ 유저 정보 파이어베이스 동기화 완료");
        } catch (e) {
            console.warn("🚨 유저 정보 동기화 실패 (오프라인 모드일 수 있음)", e);
        }
    }
};

// 앱 로딩 직후(1.5초 뒤) 및 닉네임 변경 시 자동으로 명부 업데이트 실행
setTimeout(() => { 
    if (typeof window.saveUserInfoToFirebase === 'function') {
        window.saveUserInfoToFirebase(); 
    }
}, 1500);

// (참고: 기존 changeNickname 함수 맨 마지막 줄인 window.updateMyPageProfile(); 밑에 
// window.saveUserInfoToFirebase(); 를 한 줄 추가해주시면 닉네임 바꿀 때마다 DB도 즉시 업데이트됩니다!)

// ==========================================
// 🔐 카카오 로그아웃 & 회원 탈퇴 엔진 (찐 카카오 서버 통신 추가!)
// ==========================================
window.logoutKakao = function() {
    window.showConfirm("정말 로그아웃 하시겠습니까?", function() {
        // 🚨 1. 카카오 서버에서 진짜로 로그아웃 시키기!
        if (typeof Kakao !== 'undefined' && Kakao.Auth.getAccessToken()) {
            Kakao.Auth.logout(function() {
                console.log('카카오 서버 로그아웃 완료');
            });
        }

        // 2. 내 폰(캐시)에 남은 정보 삭제
        localStorage.removeItem('kakao_nickname');
        localStorage.removeItem('kakao_id');
        localStorage.removeItem('kakao_profile_image');
        localStorage.removeItem('tosil_is_master');
        localStorage.removeItem('tosil_is_subadmin');
        
        window.showToast("👋 안전하게 로그아웃 되었습니다.");
        setTimeout(() => location.reload(), 800);
    }, "👋", "로그아웃", "#8B95A1");
};

window.unlinkKakao = function() {
    window.showConfirm("정말 회원 탈퇴를 진행하시겠습니까?<br><span style='font-size:12px; color:#8B95A1;'>모든 데이터가 삭제되며 복구할 수 없습니다.</span>", function() {
        const answer = prompt("탈퇴하시려면 아래 입력창에 '탈퇴'라고 정확히 적어주세요.");
        if (answer === '탈퇴') {
            // 🚨 1. 카카오 서버에 '앱 연결 끊기' 강제 요청!
            if (typeof Kakao !== 'undefined' && Kakao.Auth.getAccessToken()) {
                Kakao.API.request({
                    url: '/v1/user/unlink',
                    success: function(res) { console.log('카카오 연결 끊기 성공', res); },
                    fail: function(err) { console.error('카카오 연결 끊기 실패', err); }
                });
            }

            // 2. 내 폰에 있는 모든 데이터 싹 날리기
            localStorage.clear(); 
            window.showToast("💔 회원 탈퇴가 완료되었습니다. 그동안 감사했습니다!");
            setTimeout(() => location.reload(), 1500);
        } else if (answer !== null) {
            alert("입력한 단어가 일치하지 않아 취소되었습니다.");
        }
    }, "🚨", "탈퇴하기", "#F04452");
};

// ==========================================
// 💾 글쓰기 임시저장(Draft) 방어막 엔진 (진짜 최종 통합본)
// ==========================================

// 1. 임시저장 실행 & 알림 함수
window.savePostDraft = function(showToast = false) {
    const cat = document.getElementById('writeCategory')?.value || '';
    const title = document.getElementById('writeTitle')?.value || '';
    const content = document.getElementById('writeContent')?.value || '';
    const images = window.attachedImages || [];
    
    // 내용이 단 한 글자라도 있으면 로컬에 저장
    if (title.trim() || content.trim() || images.length > 0) {
        localStorage.setItem('tosil_post_draft', JSON.stringify({ cat, title, content, images }));
        if (showToast && typeof window.showToast === 'function') {
            window.showToast("💾 작성 중인 글이 안전하게 임시저장 되었습니다.");
        }
    } else {
        localStorage.removeItem('tosil_post_draft');
    }
};

// 2. 글씨 입력할 때마다 실시간 자동저장
document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById('writeTitle');
    const contentInput = document.getElementById('writeContent');
    if (titleInput) titleInput.addEventListener('input', () => window.savePostDraft(false));
    if (contentInput) contentInput.addEventListener('input', () => window.savePostDraft(false));
});

// 3. 모달 열기 (불러오기 타이밍 꼬임 해결 & 로그인 검증)
window.openWriteModal = function() {
    if (!localStorage.getItem('kakao_id')) {
        return window.showConfirm("안전하고 클린한 커뮤니티를 위해<br>로그인한 유저만 글을 쓸 수 있어요!<br><span style='font-size:12px; color:#8B95A1; font-weight:600;'>카카오로 3초 만에 시작해볼까요?</span>", function() {
            if (typeof window.switchTab === 'function') window.switchTab('settings');
        }, "💬", "로그인 하러가기", "#3182F6");
    }

    const executeOpenModal = () => {
        document.getElementById('writeOverlay').classList.add('show');
        document.getElementById('writeModal').classList.add('show');
        document.body.style.overflow = 'hidden'; 
    };

    const draftStr = localStorage.getItem('tosil_post_draft');
    if (draftStr && !window.editingPostId) { 
        const draft = JSON.parse(draftStr);
        if (draft.title || draft.content || (draft.images && draft.images.length > 0)) {
            if (confirm("작성 중이던 글이 있습니다.\n이어서 작성하시겠습니까?")) {
                if(document.getElementById('writeCategory')) document.getElementById('writeCategory').value = draft.cat || '';
                if(document.getElementById('writeTitle')) document.getElementById('writeTitle').value = draft.title || '';
                if(document.getElementById('writeContent')) document.getElementById('writeContent').value = draft.content || '';
                window.attachedImages = draft.images || [];
                if(typeof window.renderPreviewImages === 'function') window.renderPreviewImages();
                
                executeOpenModal(); 
                if(typeof window.showToast === 'function') window.showToast("✨ 임시저장된 글을 불러왔습니다!");
            } else {
                localStorage.removeItem('tosil_post_draft');
                executeOpenModal();
            }
            return;
        }
    }
    executeOpenModal();
};

// 4. 모달 닫기 (저장 및 알림)
window.closeWriteModal = function() {
    if (!window.editingPostId) {
        const title = document.getElementById('writeTitle')?.value || '';
        const content = document.getElementById('writeContent')?.value || '';
        const images = window.attachedImages || [];
        
        if (title.trim() || content.trim() || images.length > 0) {
            if (typeof window.savePostDraft === 'function') window.savePostDraft(true); // 알림 ON
        } else {
            if (typeof window.savePostDraft === 'function') window.savePostDraft(false); // 알림 OFF
        }
    }

    document.getElementById('writeOverlay').classList.remove('show');
    document.getElementById('writeModal').classList.remove('show');
    document.body.style.overflow = 'auto'; 

    setTimeout(() => {
        if(document.getElementById('writeTitle')) document.getElementById('writeTitle').value = '';
        if(document.getElementById('writeContent')) document.getElementById('writeContent').value = '';
        if(document.getElementById('writeCategory')) document.getElementById('writeCategory').value = '';
        if(document.getElementById('writeAnonymous')) document.getElementById('writeAnonymous').checked = false;
        
        window.attachedImages = []; 
        if(typeof window.renderPreviewImages === 'function') window.renderPreviewImages();
        window.editingPostId = null; 
    }, 300);
};

// ==========================================
// 👑 [Phase 2] 육아메이트 비밀 조종석 (관제센터) 엔진 (복구 완료!)
// ==========================================
window.adminClickCount = 0;
window.adminClickTimer = null;

// 1. 다다닥! 5번 터치 감지 로직
window.handleSecretAdminClick = function() {
    window.adminClickCount++;
    if (window.adminClickTimer) clearTimeout(window.adminClickTimer);
    
    window.adminClickTimer = setTimeout(() => {
        window.adminClickCount = 0; 
    }, 2000);

    if (window.adminClickCount >= 5) {
        window.adminClickCount = 0; 
        const isMaster = localStorage.getItem('tosil_is_master') === 'true';
        const isSubAdmin = localStorage.getItem('tosil_is_subadmin') === 'true';
        
        if (isMaster || isSubAdmin) {
            if (navigator.vibrate) navigator.vibrate([50, 50, 100]); 
            window.openAdminDashboard();
        } else {
            window.showToast("👀 개발자 모드는 관리자만 접근할 수 있어요.");
        }
    }
};

// 2. 관제센터 UI 렌더링
window.openAdminDashboard = function() {
    let dashboard = document.getElementById('admin-secret-dashboard');
    if (!dashboard) {
        dashboard = document.createElement('div');
        dashboard.id = 'admin-secret-dashboard';
        dashboard.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999999; display:flex; flex-direction:column; justify-content:flex-end; opacity:0; transition:opacity 0.3s; backdrop-filter:blur(10px);';
        document.body.appendChild(dashboard);
    }

    const posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    const comments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
    
    dashboard.innerHTML = `
        <div style="background:#18181B; border-radius:24px 24px 0 0; padding:30px 20px 40px 20px; height:85vh; display:flex; flex-direction:column; transform:translateY(100%); transition:transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); border-top:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <div>
                    <div style="font-size:12px; font-weight:800; color:#38BDF8; margin-bottom:4px;">Tosil Admin System</div>
                    <div style="font-size:24px; font-weight:900; color:#FFFFFF;">👑 육아메이트 관제센터</div>
                </div>
                <button onclick="window.closeAdminDashboard()" style="background:rgba(255,255,255,0.1); border:none; width:36px; height:36px; border-radius:50%; color:#FFF; font-size:16px; cursor:pointer;">✕</button>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:24px;">
                <div style="flex:1; background:rgba(255,255,255,0.1); border-radius:16px; padding:16px; text-align:center;">
                    <div style="font-size:12px; color:#A1A1AA; margin-bottom:6px; font-weight:800;">총 누적 게시글</div>
                    <div style="font-size:20px; font-weight:900; color:#FFF;">${posts.length}건</div>
                </div>
                <div style="flex:1; background:rgba(255,255,255,0.1); border-radius:16px; padding:16px; text-align:center;">
                    <div style="font-size:12px; color:#A1A1AA; margin-bottom:6px; font-weight:800;">총 누적 댓글</div>
                    <div style="font-size:20px; font-weight:900; color:#38BDF8;">${comments.length}건</div>
                </div>
            </div>

            <div style="font-size:14px; font-weight:800; color:#A1A1AA; margin-bottom:12px;">운영 모듈 제어</div>
            
            <div style="display:flex; flex-direction:column; gap:12px; overflow-y:auto; padding-bottom:20px;">
                <!-- 1. 공지사항 컨트롤 -->
                <button onclick="window.openNoticeController()" style="background:#27272A; border:1px solid #3F3F46; padding:18px; border-radius:16px; display:flex; align-items:center; gap:16px; text-align:left; cursor:pointer; transition:0.2s;">
                    <div style="font-size:24px;">📢</div>
                    <div>
                        <div style="font-size:15px; font-weight:900; color:#FFF; margin-bottom:4px;">실시간 공지사항 / 배너 관리</div>
                        <div style="font-size:12px; font-weight:600; color:#A1A1AA;">앱 메인과 맘수다 탭의 공지를 실시간으로 변경합니다.</div>
                    </div>
                </button>

                <!-- 2. 신고/유저 관리 -->
                <button onclick="window.showToast('🛠️ [3순위 진행 예정] 악성 유저 통제소 연동을 준비 중입니다.')" style="background:#27272A; border:1px solid #3F3F46; padding:18px; border-radius:16px; display:flex; align-items:center; gap:16px; text-align:left; cursor:pointer; transition:0.2s;">
                    <div style="font-size:24px;">🚨</div>
                    <div>
                        <div style="font-size:15px; font-weight:900; color:#F87171; margin-bottom:4px;">신고 접수 및 악성 유저 관리</div>
                        <div style="font-size:12px; font-weight:600; color:#A1A1AA;">신고된 글 블라인드 및 카카오ID 영구 차단 기능</div>
                    </div>
                </button>

                <!-- 3. 지도 관리 -->
                <button onclick="window.showToast('🛠️ [4순위 진행 예정] 육아지도 DB 관리망 연동을 준비 중입니다.')" style="background:#27272A; border:1px solid #3F3F46; padding:18px; border-radius:16px; display:flex; align-items:center; gap:16px; text-align:left; cursor:pointer; transition:0.2s;">
                    <div style="font-size:24px;">🗺️</div>
                    <div>
                        <div style="font-size:15px; font-weight:900; color:#FFF; margin-bottom:4px;">육아지도 핫플 & 행사 등록</div>
                        <div style="font-size:12px; font-weight:600; color:#A1A1AA;">코드 수정 없이 새로운 장소를 앱에 추가합니다.</div>
                    </div>
                </button>
            </div>
        </div>
    `;

    dashboard.style.display = 'flex';
    setTimeout(() => { dashboard.style.opacity = '1'; dashboard.firstElementChild.style.transform = 'translateY(0)'; }, 10);
};

window.closeAdminDashboard = function() {
    const dashboard = document.getElementById('admin-secret-dashboard');
    if(dashboard) {
        dashboard.style.opacity = '0';
        dashboard.firstElementChild.style.transform = 'translateY(100%)';
        setTimeout(() => { dashboard.style.display = 'none'; }, 400);
    }
};

// ==========================================
// 📢 [Phase 2] 실시간 공지사항 연동 엔진 (v8 & v9 완벽 호환 유니버설 버전)
// ==========================================
window.appNotices = JSON.parse(localStorage.getItem('tosil_global_notices')) || { 
    main: { text: "", isActive: false }, 
    community: { text: "", isActive: false } 
};

// 1. 파이어베이스 실시간 수신 감지 (버전 자동 감지)
window.listenToNotices = function() {
    if (!window.db) return;
    
    // v8 방식 지원
    if (typeof window.db.collection === 'function') {
        window.db.collection('app_settings').doc('global_notice').onSnapshot((docSnap) => {
            if (docSnap.exists) {
                window.appNotices = docSnap.data();
                localStorage.setItem('tosil_global_notices', JSON.stringify(window.appNotices));
                window.applyNoticeToUI(); 
            }
        });
    } 
    // v9 방식 지원
    else if (typeof window.doc === 'function' && typeof window.onSnapshot === 'function') {
        const docRef = window.doc(window.db, "app_settings", "global_notice");
        window.onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                window.appNotices = docSnap.data();
                localStorage.setItem('tosil_global_notices', JSON.stringify(window.appNotices));
                window.applyNoticeToUI(); 
            }
        });
    }
};

// 2. 화면에 배너 띄우기 / 숨기기 처리
window.applyNoticeToUI = function() {
    const mainWrapper = document.getElementById('home-main-banner-wrapper');
    const mainText = document.getElementById('home-main-banner-text');
    if (mainWrapper && mainText) {
        if (window.appNotices?.main?.isActive && window.appNotices?.main?.text) {
            mainText.innerText = window.appNotices.main.text;
            mainWrapper.style.display = 'flex';
        } else {
            mainWrapper.style.display = 'none'; 
        }
    }
    
    const commWrapper = document.getElementById('community-notice-wrapper');
    const commText = document.getElementById('community-notice-text');
    if (commWrapper && commText) {
        if (window.appNotices?.community?.isActive && window.appNotices?.community?.text) {
            commText.innerText = window.appNotices.community.text;
            commWrapper.style.display = 'flex';
        } else {
            commWrapper.style.display = 'none'; 
        }
    }
};

// 앱 켜지자마자 캐시로 즉시 그리기
document.addEventListener("DOMContentLoaded", () => {
    window.applyNoticeToUI();
});

// DB 연결 대기 후 리스너 부착
let noticeRetryTimer = setInterval(() => {
    if (window.db) {
        clearInterval(noticeRetryTimer);
        window.listenToNotices();
    }
}, 1000);

// ==========================================
// 🛠️ 관리자 전용 공지사항 컨트롤러 (ON/OFF 스위치)
// ==========================================
window.openNoticeController = function() {
    const mData = window.appNotices?.main || { text: "", isActive: false };
    const cData = window.appNotices?.community || { text: "", isActive: false };
    
    const mBtnStyle = mData.isActive ? "background:#38BDF8; color:#0F172A;" : "background:#3F3F46; color:#A1A1AA;";
    const mBtnText = mData.isActive ? "ON (켜짐)" : "OFF (꺼짐)";
    
    const cBtnStyle = cData.isActive ? "background:#38BDF8; color:#0F172A;" : "background:#3F3F46; color:#A1A1AA;";
    const cBtnText = cData.isActive ? "ON (켜짐)" : "OFF (꺼짐)";

    const controllerHtml = `
        <style>.admin-notice-input::placeholder { color: rgba(255,255,255,0.3) !important; font-weight:400; }</style>
        <div id="notice-controller-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; backdrop-filter:blur(5px); opacity:0; transition:opacity 0.3s;">
            <div style="background:#18181B; width:100%; max-width:400px; border-radius:24px; padding:24px; border:1px solid #3F3F46; transform:scale(0.9); transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);">
                <div style="font-size:20px; font-weight:900; color:#FFF; margin-bottom:24px;">📢 배너 & 공지 제어기</div>
                
                <div style="margin-bottom:20px; background:#27272A; padding:16px; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div style="font-size:14px; font-weight:800; color:#38BDF8;">1. 홈 화면 메인 배너</div>
                        <button id="btn-toggle-main" data-active="${mData.isActive}" onclick="window.toggleAdminSwitch('main')" style="${mBtnStyle} border:none; padding:6px 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer; transition:0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                            ${mBtnText}
                        </button>
                    </div>
                    <input class="admin-notice-input" id="admin-input-main-notice" type="text" value="${mData.text}" placeholder="(여기에 띄울 글자를 직접 적어주세요)" style="width:100%; background:#18181B !important; border:1px solid #3F3F46 !important; color:#FFFFFF !important; padding:14px; border-radius:12px; font-size:14px; font-weight:800; box-sizing:border-box; outline:none;">
                </div>

                <div style="margin-bottom:24px; background:#27272A; padding:16px; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div style="font-size:14px; font-weight:800; color:#38BDF8;">2. 맘수다 상단 공지</div>
                        <button id="btn-toggle-comm" data-active="${cData.isActive}" onclick="window.toggleAdminSwitch('comm')" style="${cBtnStyle} border:none; padding:6px 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer; transition:0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                            ${cBtnText}
                        </button>
                    </div>
                    <input class="admin-notice-input" id="admin-input-comm-notice" type="text" value="${cData.text}" placeholder="(여기에 띄울 글자를 직접 적어주세요)" style="width:100%; background:#18181B !important; border:1px solid #3F3F46 !important; color:#FFFFFF !important; padding:14px; border-radius:12px; font-size:14px; font-weight:800; box-sizing:border-box; outline:none;">
                </div>

                <div style="display:flex; gap:12px;">
                    <button onclick="window.closeNoticeController()" style="flex:1; padding:14px; background:#3F3F46; color:#E5E8EB; border:none; border-radius:12px; font-weight:800; font-size:15px; cursor:pointer;">닫기</button>
                    <button onclick="window.saveNoticeToDB()" style="flex:1; padding:14px; background:#38BDF8; color:#0F172A; border:none; border-radius:12px; font-weight:900; font-size:15px; cursor:pointer;">저장 & 라이브 🚀</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', controllerHtml);
    setTimeout(() => {
        const overlay = document.getElementById('notice-controller-overlay');
        overlay.style.opacity = '1';
        overlay.firstElementChild.style.transform = 'scale(1)';
    }, 10);
};

window.toggleAdminSwitch = function(type) {
    const btn = document.getElementById('btn-toggle-' + type);
    if (!btn) return;
    const isActive = btn.getAttribute('data-active') === 'true';
    if (isActive) {
        btn.setAttribute('data-active', 'false');
        btn.innerText = 'OFF (꺼짐)';
        btn.style.background = '#3F3F46';
        btn.style.color = '#A1A1AA';
    } else {
        btn.setAttribute('data-active', 'true');
        btn.innerText = 'ON (켜짐)';
        btn.style.background = '#38BDF8';
        btn.style.color = '#0F172A';
    }
};

window.closeNoticeController = function() {
    const overlay = document.getElementById('notice-controller-overlay');
    if(overlay) {
        overlay.style.opacity = '0';
        overlay.firstElementChild.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 300);
    }
};

window.saveNoticeToDB = function() {
    const mainText = document.getElementById('admin-input-main-notice').value.trim();
    const mainActive = document.getElementById('btn-toggle-main').getAttribute('data-active') === 'true';
    
    const commText = document.getElementById('admin-input-comm-notice').value.trim();
    const commActive = document.getElementById('btn-toggle-comm').getAttribute('data-active') === 'true';
    
    if (mainActive && !mainText) return window.showToast("⚠️ 홈 배너에 띄울 내용이 비어있습니다.");
    if (commActive && !commText) return window.showToast("⚠️ 맘수다 공지에 띄울 내용이 비어있습니다.");
    
    if(!window.db) return window.showToast("❌ DB 연결이 되지 않았습니다.");

    const noticePayload = {
        main: { text: mainText, isActive: mainActive },
        community: { text: commText, isActive: commActive },
        updatedAt: new Date().toISOString()
    };

    if (typeof window.db.collection === 'function') {
        window.db.collection('app_settings').doc('global_notice').set(noticePayload, { merge: true })
        .then(() => {
            window.closeNoticeController();
            window.showToast("✅ 공지사항 라이브 적용 완료!");
        })
        .catch((error) => {
            console.error("공지 업데이트 에러:", error);
            window.showToast("❌ 공지 등록 실패.");
        });
    } else if (typeof window.setDoc === 'function' && typeof window.doc === 'function') {
        const docRef = window.doc(window.db, "app_settings", "global_notice");
        window.setDoc(docRef, noticePayload, { merge: true })
        .then(() => {
            window.closeNoticeController();
            window.showToast("✅ 공지사항 라이브 적용 완료!");
        })
        .catch((error) => {
            console.error("공지 업데이트 에러:", error);
            window.showToast("❌ 공지 등록 실패.");
        });
    } else {
        window.showToast("❌ Firestore 저장 방식을 찾을 수 없습니다.");
    }
};

// ==========================================
// 🚨 신고하기 함수 (v8 호환 방식)
// ==========================================
window.reportContent = async function(type, targetId, reportedUserId) {
    const myUid = localStorage.getItem('kakao_id');
    if (!myUid) return window.showToast("로그인이 필요합니다.");
    if (!window.db) return window.showToast("❌ DB 연결이 되지 않았습니다.");

    try {
        await window.db.collection("reports").add({
            reporterId: myUid,
            reportedUserId: reportedUserId,
            targetId: targetId,
            type: type, 
            reason: "사용자 신고 접수", 
            createdAt: new Date().toISOString(),
            status: "pending"
        });
        window.showToast('🚨 신고가 정상적으로 접수되었습니다.');
    } catch (error) {
        console.error("신고 처리 중 오류:", error);
        window.showToast("오류가 발생했습니다. 다시 시도해주세요.");
    }
};

// ==========================================
// 💬 댓글 점 3개 (Action Sheet) & 삭제 엔진
// ==========================================
window.showCommentOptions = async function(commentId, postId) {
    let comments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
    let comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const myName = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트';
    const isMyComment = (comment.authorName === myName || comment.authorName === '익명마미');

    let isMasterAdmin = localStorage.getItem('tosil_is_master') === 'true';

    let existing = document.getElementById('comment-action-sheet');
    if(existing) existing.remove();

    let menuHtml = '';
    
    if (isMasterAdmin) {
        menuHtml = `
            <div style="padding: 0 0 16px 0; font-size: 13px; font-weight: 900; color: #3182F6; text-align: center;">👑 육아메이트 대표이사</div>
            <div onclick="window.deleteComment('${commentId}', '${postId}'); document.getElementById('comment-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🗑️</span> 댓글 강제 삭제
            </div>
            <div onclick="window.blockUser('${comment.authorName}')" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚫</span> 이 사용자 영구 차단
            </div>
        `;
    } else if (isMyComment) {
        menuHtml = `
            <div onclick="window.deleteComment('${commentId}', '${postId}'); document.getElementById('comment-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🗑️</span> 댓글 삭제하기
            </div>
        `;
    } else {
        menuHtml = `
            <div onclick="window.showToast('🚨 댓글 신고가 접수되었습니다.'); document.getElementById('comment-action-sheet').remove();" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #F04452; border-bottom: 1px solid #F2F4F6; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚨</span> 이 댓글 신고하기
            </div>
            <div onclick="window.blockUser('${comment.authorName}')" style="padding: 16px 0; font-size: 16px; font-weight: 700; color: #333D4B; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🚫</span> 이 사용자 차단하기
            </div>
        `;
    }

    const sheetHtml = `
        <div id="comment-action-sheet" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 99999; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; transition: opacity 0.2s ease;" onclick="this.remove()">
            <div style="background: #ffffff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px 20px; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.1, 1, 0.2, 1);" onclick="event.stopPropagation()">
                <div style="width: 40px; height: 4px; background: #E5E8EB; border-radius: 2px; margin: 0 auto 20px auto;"></div>
                ${menuHtml}
                <div onclick="document.getElementById('comment-action-sheet').remove();" style="margin-top: 16px; padding: 16px 0; font-size: 16px; font-weight: 700; color: #8B95A1; text-align: center; background: #F2F4F6; border-radius: 12px; cursor: pointer;">닫기</div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', sheetHtml);
    setTimeout(() => {
        const sheet = document.getElementById('comment-action-sheet');
        if(sheet) { sheet.style.opacity = '1'; sheet.firstElementChild.style.transform = 'translateY(0)'; }
    }, 10);
};

// 🗑️ 댓글 삭제 기능
window.deleteComment = function(commentId, postId) {
    window.showConfirm("이 댓글을 정말 삭제하시겠습니까?", function() {
        let comments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
        comments = comments.filter(c => c.id !== commentId);
        localStorage.setItem('tosil_community_comments', JSON.stringify(comments));

        let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
        let postIdx = posts.findIndex(p => p.id === postId);
        if(postIdx > -1) {
            posts[postIdx].comments = Math.max(0, (posts[postIdx].comments || 0) - 1);
            localStorage.setItem('tosil_community_posts', JSON.stringify(posts));
            
            const commentCountEl = document.getElementById('detail-comment-count');
            if(commentCountEl) commentCountEl.innerText = posts[postIdx].comments;
        }

        if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function') {
            window.setDoc(window.doc(window.db, "community", "comments"), { records: comments }).catch(e=>{});
            window.setDoc(window.doc(window.db, "community", "posts"), { records: posts }).catch(e=>{}); 
        }

        window.renderComments(postId); 
        window.showToast('🗑️ 댓글이 삭제되었습니다.');
    }, "🗑️", "삭제", "#F04452");
};

// ==========================================
// 🚫 글로벌 차단 시스템 (메뉴판 겹침 버그 완벽 해결 버전)
// ==========================================
window.blockUser = function(targetName) {
    if (!targetName || targetName === '육아메이트' || targetName === '육아천재대표님') {
        return window.showToast("🚨 최고 관리자는 차단할 수 없습니다.");
    }
    
    // 🧹 1단계: 차단 확인창을 띄우기 전에, 화면에 떠 있는 모든 점 3개 메뉴(Action Sheet)를 즉시 제거합니다!
    document.getElementById('post-action-sheet')?.remove();
    document.getElementById('comment-action-sheet')?.remove();
    
    // 2단계: 확인창 띄우기
    window.showConfirm(`정말 <b>${targetName}</b>님을 차단하시겠습니까?<br>앞으로 이 사용자의 글과 댓글이 더 이상 보이지 않습니다.`, function() {
        let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];
        if (!blockedUsers.includes(targetName)) {
            blockedUsers.push(targetName);
            localStorage.setItem('tosil_blocked_users', JSON.stringify(blockedUsers));
        }
        
        // 상세 페이지 닫기 및 피드 새로고침
        if (typeof window.closePostDetail === 'function') window.closePostDetail();
        if (typeof window.renderCommunityFeed === 'function') window.renderCommunityFeed();
        
        window.showToast(`🚫 '${targetName}'님이 차단되었습니다.`);
    }, "🚫", "차단하기", "#F04452");
};

// ==========================================
// 💬 [업그레이드] 인스타 감성 대댓글 숨기기/펼치기 엔진
// ==========================================
window.replyingToCommentId = null; // 대댓글 작성 시 부모 댓글 ID 기억

// 1. 답글 달기 버튼 눌렀을 때
window.prepareReply = function(commentId, authorName) {
    window.replyingToCommentId = commentId;
    const inputField = document.getElementById('newCommentInput');
    if (inputField) {
        inputField.placeholder = `@${authorName} 님에게 답글 남기는 중...`;
        inputField.focus();
    }
};

// 2. 댓글 및 대댓글 등록 엔진 (알림 생성 포함)
window.addComment = function() { 
    if (!localStorage.getItem('kakao_id')) {
        return window.showConfirm("따뜻한 소통을 위해<br>로그인 후 댓글을 남겨주세요!", function() {
            if (typeof window.closePostDetail === 'function') window.closePostDetail();
            if (typeof window.switchTab === 'function') window.switchTab('settings');
        }, "💬", "로그인 하러가기", "#3182F6");
    }

    const inputField = document.getElementById('newCommentInput');
    if(!inputField) return;
    const commentText = inputField.value.trim();
    const postId = inputField.getAttribute('data-post-id'); 

    if (!commentText) {
        window.showToast('⚠️ 댓글 내용을 입력해주세요!');
        inputField.focus();
        return;
    }

    const myName = localStorage.getItem('community_nickname') || localStorage.getItem('kakao_nickname') || '육아메이트';
    const myIcon = window.getCurrentUserProfileIcon(false);
    const timestamp = new Date().getTime();

    // 새 댓글(또는 대댓글) 객체 생성
    const newComment = {
        id: 'cmt_' + timestamp,
        postId: postId,
        parentId: window.replyingToCommentId, // 일반 댓글이면 null, 대댓글이면 부모 ID
        text: commentText,
        authorName: myName,
        authorIcon: myIcon,
        timestamp: timestamp,
        likes: 0, 
        liked: false
    };

    let comments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
    comments.push(newComment);
    localStorage.setItem('tosil_community_comments', JSON.stringify(comments));

    let posts = JSON.parse(localStorage.getItem('tosil_community_posts')) || [];
    let postIdx = posts.findIndex(p => p.id === postId);
    if(postIdx > -1) {
        posts[postIdx].comments = (posts[postIdx].comments || 0) + 1;
        posts[postIdx].hasMyComment = true; 
        localStorage.setItem('tosil_community_posts', JSON.stringify(posts));
        
        // 🔔 [알림 생성] 내 글에 남이 댓글을 달았을 때
        if (posts[postIdx].authorName !== myName) {
            let notis = JSON.parse(localStorage.getItem('tosil_notifications')) || [];
            notis.unshift({
                id: 'noti_' + timestamp,
                type: 'comment',
                postId: postId,
                senderName: myName,
                postTitle: posts[postIdx].title,
                timestamp: timestamp,
                isRead: false
            });
            localStorage.setItem('tosil_notifications', JSON.stringify(notis));
        }

        const commentCountEl = document.getElementById('detail-comment-count');
        if(commentCountEl) commentCountEl.innerText = posts[postIdx].comments;
    }

    // 대댓글 상태 초기화
    window.replyingToCommentId = null;
    inputField.value = '';
    inputField.placeholder = "따뜻한 댓글을 남겨주세요...";
    if (navigator.vibrate) navigator.vibrate(20);

    window.renderComments(postId);
    window.showToast('💖 따뜻한 댓글이 등록되었습니다!');

    // 파이어베이스 동기화
    /* 
      ========================================================
      💡 [나중에 맘수다 정식 오픈할 때 이 주석을 풀면 서버와 즉시 연동됩니다!]
      ========================================================
      if (typeof window.db !== 'undefined' && typeof window.setDoc === 'function') {
          window.setDoc(window.doc(window.db, "community", "comments"), { records: comments }).catch(e=>{});
          window.setDoc(window.doc(window.db, "community", "posts"), { records: posts }).catch(e=>{}); 
      }
    */
};

// 3. 인스타 감성 대댓글 숨기기/펼치기 렌더링 엔진
window.renderComments = function(postId) {
    const listContainer = document.getElementById('commentList');
    if(!listContainer) return;

    let allComments = JSON.parse(localStorage.getItem('tosil_community_comments')) || [];
    let postComments = allComments.filter(c => c.postId === postId); 
    let blockedUsers = JSON.parse(localStorage.getItem('tosil_blocked_users')) || [];
    postComments = postComments.filter(c => !blockedUsers.includes(c.authorName));

    if (postComments.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 40px 0; color: #8B95A1; font-size: 13px; font-weight: 700;">첫 번째 댓글을 남겨주세요! ✨</div>`;
        return;
    }

    // 부모 댓글과 대댓글 분리
    let parentComments = postComments.filter(c => !c.parentId);
    let childComments = postComments.filter(c => c.parentId);

    parentComments.sort((a, b) => a.timestamp - b.timestamp); // 기본 최신순

    let html = '';
    
    // 개별 댓글 그리기 템플릿
    const buildCommentHtml = (c, isReply = false) => {
        const diffMins = Math.floor((new Date().getTime() - c.timestamp) / 60000);
        let timeStr = '방금 전';
        if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)}일 전`;
        else if (diffMins >= 60) timeStr = `${Math.floor(diffMins/60)}시간 전`;
        else if (diffMins > 0) timeStr = `${diffMins}분 전`;

        let likeColor = c.liked ? '#FF5A5F' : '#CBD5E1';
        let likeTextColor = c.liked ? '#FF5A5F' : '#8B95A1';
        let likeIcon = c.liked ? '❤️' : '🤍';
        
        let replyStyle = isReply 
            ? "margin-left: 42px; padding: 12px 0; border-bottom: none; margin-top: 4px;" 
            : "padding: 16px 0; border-bottom: 1px solid #F2F4F6;";

        return `
            <div style="${replyStyle} animation: slideDownFade 0.3s ease forwards; display: flex; align-items: flex-start;">
                <div style="width: ${isReply ? '28px' : '32px'}; height: ${isReply ? '28px' : '32px'}; background: #FFF4E6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isReply ? '13px' : '15px'}; flex-shrink: 0; margin-right: 10px;">${c.authorIcon || '🧸'}</div>
                
                <div style="flex: 1; min-width: 0; padding-top: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                            <span style="font-size: 14px; font-weight: 800; color: #333D4B;">${c.authorName}</span>
                            <span style="font-size: 12px; color: #8B95A1;">${timeStr}</span>
                        </div>
                        <svg onclick="window.showCommentOptions('${c.id}', '${postId}')" style="cursor:pointer; padding: 4px; margin-right: -4px; flex-shrink: 0;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                    </div>

                    <div style="font-size: 15px; color: #4E5968; line-height: 1.5; word-break: keep-all; padding-right: 4px; margin-bottom: 10px;">
                        ${c.text.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div style="display: flex; gap: 16px; align-items: center; margin-top: 2px;">
                        <div onclick="window.toggleCommentLike('${c.id}', '${postId}', event)" style="display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                            <span style="color: ${likeColor}; font-size: 13px; transition: 0.2s;">${likeIcon}</span>
                            <span style="color: ${likeTextColor}; font-size: 12px; font-weight: 600;">${c.likes || 0}</span>
                        </div>
                        ${!isReply ? `<div onclick="window.prepareReply('${c.id}', '${c.authorName}')" style="font-size: 12px; font-weight: 700; color: #8B95A1; cursor: pointer;">답글 달기</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    // 부모 그리기 -> 자식이 있으면 '답글 보기' 버튼 생성 -> 그 안에 자식들 숨겨두기
    parentComments.forEach(parent => {
        html += buildCommentHtml(parent, false);
        
        let replies = childComments.filter(child => child.parentId === parent.id);
        replies.sort((a, b) => a.timestamp - b.timestamp);

        if (replies.length > 0) {
            // 🚨 인스타 스타일 '답글 N개 보기' 토글 버튼 (찌꺼기 선 삭제, 화살표 추가)
            html += `
                <div id="reply-toggle-btn-${parent.id}" onclick="window.toggleReplies('${parent.id}')" style="margin-left: 42px; margin-top: 4px; margin-bottom: 12px; font-size: 13px; font-weight: 800; color: #8B5CF6; cursor: pointer; display: inline-block;">
                    답글 ${replies.length}개 보기 ▾
                </div>
                
                <!-- 대댓글이 담길 숨겨진 박스 -->
                <div id="reply-box-${parent.id}" style="display: none; background: #F9FAFB; border-radius: 12px; padding: 4px 12px 12px 0; margin-left: 42px; margin-bottom: 12px;">
            `;
            
            // 박스 안에 대댓글들 채워 넣기
            replies.forEach(reply => {
                let replyHtml = buildCommentHtml(reply, true).replace('margin-left: 42px;', 'margin-left: 12px;'); 
                html += replyHtml;
            });
            
            html += `</div>`;
        }
    });

    listContainer.innerHTML = html;
};

// 4. 답글 열고 닫는 스위치 함수 (선 삭제, 화살표 추가)
window.toggleReplies = function(parentId) {
    const box = document.getElementById('reply-box-' + parentId);
    const btn = document.getElementById('reply-toggle-btn-' + parentId);
    
    if (box && btn) {
        if (box.style.display === 'none') {
            box.style.display = 'block';
            btn.innerText = '답글 숨기기 ▴';
            btn.style.color = '#8B95A1';
        } else {
            box.style.display = 'none';
            // 안에 들어있는 대댓글 갯수 다시 계산해서 텍스트 복구
            const replyCount = box.querySelectorAll('div[style*="align-items: flex-start"]').length;
            btn.innerText = `답글 ${replyCount}개 보기 ▾`;
            btn.style.color = '#8B5CF6';
        }
    }
};

// 4. 알림 센터 (종 모양) 렌더링 엔진
window.renderNotifications = function() {
    const listArea = document.querySelector('#commNotiOverlay div:nth-child(2)'); // 두번째 div가 리스트 영역
    if (!listArea) return;

    let notis = JSON.parse(localStorage.getItem('tosil_notifications')) || [];
    
    // 알림창 열면 '읽음' 처리
    const unreadCount = notis.filter(n => !n.isRead).length;
    notis = notis.map(n => ({...n, isRead: true}));
    localStorage.setItem('tosil_notifications', JSON.stringify(notis));
    window.updateNotiBadge(); // 빨간점 없애기

    if (notis.length === 0) {
        listArea.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <div style="font-size: 48px; margin-bottom: 16px; filter: grayscale(100%) opacity(0.5);">📭</div>
                <div style="font-size: 15px; font-weight: 800; color: #8B95A1;">아직 새로운 소식이 없어요</div>
            </div>
        `;
        return;
    }

    listArea.style.justifyContent = 'flex-start';
    listArea.style.background = '#FFFFFF';
    
    let html = '<div style="width: 100%;">';
    notis.forEach(n => {
        const diffMins = Math.floor((new Date().getTime() - n.timestamp) / 60000);
        let timeStr = '방금 전';
        if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)}일 전`;
        else if (diffMins >= 60) timeStr = `${Math.floor(diffMins/60)}시간 전`;
        else if (diffMins > 0) timeStr = `${diffMins}분 전`;

        html += `
            <div onclick="window.closeNotiAndOpenPost('${n.postId}')" style="padding: 16px 20px; border-bottom: 1px solid #F2F4F6; cursor: pointer; transition: 0.2s; background: #FFFFFF;" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#FFFFFF'">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">💬</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 14.5px; font-weight: 800; color: #191F28; margin-bottom: 4px; line-height: 1.4;">
                            <span style="color: #3182F6;">${n.senderName}</span>님이 내 게시글에 댓글을 남겼습니다.
                        </div>
                        <div style="font-size: 13px; color: #8B95A1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px;">
                            "${n.postTitle}"
                        </div>
                        <div style="font-size: 11.5px; font-weight: 600; color: #B0B8C1;">${timeStr}</div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    listArea.innerHTML = html;
};

// 종 모양 알림창 열 때 데이터 그리기
document.querySelector('[onclick*="commNotiOverlay"]').addEventListener('click', () => {
    window.renderNotifications();
});

// 알림창에서 클릭하면 해당 글로 이동
window.closeNotiAndOpenPost = function(postId) {
    document.getElementById('commNotiOverlay').classList.remove('active');
    setTimeout(() => { if(typeof window.openPostDetail === 'function') window.openPostDetail(postId); }, 150);
};

// 종 모양 배지(빨간 점) 끄고 켜는 함수
window.updateNotiBadge = function() {
    let notis = JSON.parse(localStorage.getItem('tosil_notifications')) || [];
    const unreadCount = notis.filter(n => !n.isRead).length;
    const badge = document.querySelector('[onclick*="commNotiOverlay"] span');
    if (badge) {
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
};

// 앱 켜질 때 빨간 점 세팅
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.updateNotiBadge, 500);
});

// ==========================================
// 💎 [Phase 2] 숫자 롤링(Rolling) 애니메이션 엔진 (토스 감성)
// ==========================================
window.animateNumber = function(elementId, start, end, duration) {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    
    // 문자열에서 숫자만 추출 (콤마 제거)
    const endVal = parseInt(String(end).replace(/[^0-9]/g, '')) || 0;
    const startVal = parseInt(String(start).replace(/[^0-9]/g, '')) || 0;
    
    if (startVal === endVal) {
        obj.innerText = endVal.toLocaleString();
        return;
    }
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutQuart 에이징 (처음엔 빠르고 끝에서 스르륵 멈춤)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.floor(easeProgress * (endVal - startVal) + startVal);
        
        obj.innerText = currentVal.toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = endVal.toLocaleString(); // 마지막엔 정확한 값 꽂아주기
        }
    };
    window.requestAnimationFrame(step);
};

// ==========================================
// 🚗 [Phase 2] 아빠 카톡으로 카카오내비 직행 쏘기 (에러 완벽 해결본)
// ==========================================
window.sendNaviToDad = function(placeName, address) {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        return window.showToast("🚨 카카오톡 연동이 필요합니다.");
    }

    // 🚨 1. 주소는 빼고 장소 이름만 깔끔하게 인코딩해야 카카오맵이 정확히 찾습니다!
    const searchQuery = encodeURIComponent(placeName);
    const naviUrl = `https://map.kakao.com/link/search/${searchQuery}`;

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            // 🚨 2. 타이틀에 장소 이름을 뽝! 박아서 절대 안 짤리게 만듭니다.
            title: `🚗 목적지: ${placeName}`,
            description: `여보! 아기 짐 챙겨서 바로 출발하자 🤍 길 안내 켜놨어!`,
            // 🚨 3. 무조건 뜨는 가볍고 귀여운 자동차 아이콘으로 고정!
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204933.png', 
            link: { mobileWebUrl: naviUrl, webUrl: naviUrl },
        },
        buttons: [
            {
                title: '📍 카카오내비 시작하기',
                link: { mobileWebUrl: naviUrl, webUrl: naviUrl },
            }
        ],
    });
    
    if(navigator.vibrate) navigator.vibrate([20, 50, 20]);
    window.showToast("🚀 남편 카톡으로 내비게이션을 발사했습니다!");
};

// ==========================================
// 💰 프리미엄 단일 롤링 배너 자동화 엔진 (터치 스와이프 완벽 적용)
// ==========================================
window.initPremiumBanner = function() {
    const track = document.querySelector('.banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    const wrap = document.querySelector('.premium-banner-wrap');
    
    if (!track || dots.length === 0) return;

    let currentIndex = 0;
    let autoTimer;
    
    // 👆 터치 위치를 기억할 변수들
    let startX = 0;
    let endX = 0;

    // 슬라이드 이동 및 하단 점(도트) 스타일 변경 함수
    const moveSlide = (index) => {
        track.style.transform = `translateX(-${index * 33.333}%)`;
        
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.style.width = '14px';
                dot.style.background = '#FFFFFF';
                dot.style.borderRadius = '4px';
            } else {
                dot.style.width = '5px';
                dot.style.background = 'rgba(255,255,255,0.3)';
                dot.style.borderRadius = '50%';
            }
        });
    };

    // 3초마다 알아서 넘기는 타이머
    const startTimer = () => {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % dots.length;
            moveSlide(currentIndex);
        }, 3000); 
    };

    const stopTimer = () => clearInterval(autoTimer);

    // ==========================================
    // 👆 스와이프 (터치 드래그) 로직 추가
    // ==========================================
    const handleTouchStart = (e) => {
        stopTimer(); // 터치하는 순간 자동 롤링 정지
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (!startX) return;
        endX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!startX || !endX) {
            startTimer(); // 드래그 안 하고 그냥 터치만 했으면 다시 타이머 시작
            return;
        }

        const diffX = startX - endX;
        const threshold = 40; // 40px 이상 움직이면 넘어감 (민감도)

        if (diffX > threshold) {
            // 왼쪽으로 스와이프 (다음 슬라이드)
            currentIndex = (currentIndex + 1) % dots.length;
        } else if (diffX < -threshold) {
            // 오른쪽으로 스와이프 (이전 슬라이드)
            currentIndex = (currentIndex - 1 + dots.length) % dots.length;
        }

        moveSlide(currentIndex);
        
        // 변수 초기화 및 타이머 재시작
        startX = 0;
        endX = 0;
        startTimer();
    };

    startTimer();

    // 모바일 터치 이벤트
    wrap.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrap.addEventListener('touchmove', handleTouchMove, { passive: true });
    wrap.addEventListener('touchend', handleTouchEnd);

    // PC 마우스 드래그 이벤트 (테스트용)
    wrap.addEventListener('mousedown', handleTouchStart);
    wrap.addEventListener('mousemove', handleTouchMove);
    wrap.addEventListener('mouseup', handleTouchEnd);
    wrap.addEventListener('mouseleave', () => {
        if (startX) handleTouchEnd();
        startTimer();
    });
};

// 화면이 그려지고 나서 0.5초 뒤에 스무스하게 롤링 시작
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.initPremiumBanner, 500); 
});

// ==========================================
// 🍼 수유량 폭발 성장(뱃골 확장 / 정체기 탈출) 축하 엔진 (현실 버전)
// ==========================================
window.checkFeedPlateauBreakthrough = function() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const lastCelebratedDate = localStorage.getItem('tosil_plateau_celebrated_date');
    if (lastCelebratedDate === todayStr) return;

    let records = JSON.parse(localStorage.getItem('tosil_tracker_records')) || [];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let todayFeedTotal = 0;
    let yesterdayFeedTotal = 0;

    const nowHour = new Date().getHours();
    const nowMin = new Date().getMinutes();
    const currentMinutesToday = nowHour * 60 + nowMin;

    records.forEach(r => {
        if (r.type === 'feed' && r.amount) {
            const rDate = new Date(r.timestamp);
            const rDateStr = rDate.toISOString().split('T')[0];
            const rMinutes = rDate.getHours() * 60 + rDate.getMinutes();

            if (rDateStr === todayStr) {
                todayFeedTotal += parseInt(r.amount);
            } else if (rDateStr === yesterdayStr) {
                if (rMinutes <= currentMinutesToday) {
                    yesterdayFeedTotal += parseInt(r.amount);
                }
            }
        }
    });

    // 🌟 [현실 패치] 어제 이 시간대보다 오늘 딱 '30ml 이상'만 더 먹어도 뱃골 확장으로 인정!
    // (안전장치: 오늘 총 수유량이 300ml 이상은 넘었을 때만 발동)
    if (yesterdayFeedTotal > 0 && todayFeedTotal >= 300 && todayFeedTotal >= yesterdayFeedTotal + 30) {
        
        localStorage.setItem('tosil_plateau_celebrated_date', todayStr);

        if (typeof window.shootConfetti === 'function') {
            window.shootConfetti();
        }

        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

        const diff = todayFeedTotal - yesterdayFeedTotal;
        window.showToast(`🎉 <b>우리 아기 뱃골이 늘어나고 있어요!</b><br>어제 이 시간보다 벌써 <b>+${diff}ml</b> 든든하게 채우는 중! 🤍`);
    }
};

const originalGetItem = Storage.prototype.getItem;
Storage.prototype.getItem = function(key) {
    const value = originalGetItem.call(this, key);
    try {
        // 데이터가 JSON 형태라면 파싱 테스트를 거침 (깨졌으면 알아서 비워버림)
        if (value && (value.startsWith('[') || value.startsWith('{'))) {
            JSON.parse(value);
        }
    } catch (e) {
        console.warn(`[Auto Storage Guard] '${key}' 데이터 손상 감지, 자동 초기화합니다.`);
        localStorage.removeItem(key);
        return null;
    }
    return value;
};

// ==========================================
// 🏅 [마일스톤] 첫 도감 데이터 & 엔진 로직
// ==========================================

// 1. 도감 마스터 데이터 (신생아 ~ 36개월 100가지 감동 순간)
const MILESTONE_DATA = [
    // 🌱 신생아기 (0~1개월)
    { id: 'm1', title: '배냇짓 (천사의 미소)', desc: '처음으로 소리 없이 활짝 웃었어요' },
    { id: 'm2', title: '제대탈락 완료', desc: '탯줄이 떨어지고 예쁜 배꼽이 생겼어요' },
    { id: 'm3', title: '눈 맞춤 심쿵', desc: '드디어 엄마 아빠와 눈을 맞추기 시작해요' },
    { id: 'm4', title: '첫 목욕 성공', desc: '울지 않고 개운하게 첫 목욕을 마쳤어요' },
    { id: 'm5', title: '첫 손톱 깎기', desc: '조막만 한 손톱을 조심조심 깎아줬어요' },
    { id: 'm6', title: '흑백 모빌 홀릭', desc: '모빌을 보며 눈동자가 따라가기 시작해요' },
    { id: 'm7', title: '태지 탈각 완료', desc: '뽀송뽀송한 진짜 피부가 나타났어요' },
    { id: 'm8', title: '첫 외출 (병원)', desc: '꽁꽁 싸매고 첫 예방접종 나들이를 다녀왔어요' },
    { id: 'm9', title: '폭풍 옹알이 시작', desc: '아우~ 우~ 기분 좋은 소리를 내요' },
    { id: 'm10', title: '수유량 100ml 돌파', desc: '위가 늘어나서 제법 꿀떡꿀떡 잘 먹어요' },

    // 🐥 영아기 1 (1~3개월)
    { id: 'm11', title: '컬러 모빌 보기', desc: '드디어 세상의 색깔을 보기 시작했어요' },
    { id: 'm12', title: '터미타임 첫 성공', desc: '엎드려서 고개를 빳빳하게 들었어요' },
    { id: 'm13', title: '소리 내서 웃기', desc: '꺄르르! 처음으로 소리 내어 웃었어요' },
    { id: 'm14', title: '주먹고기 냠냠', desc: '자신의 손을 발견하고 맛있게 빨아요' },
    { id: 'm15', title: '손싸개 졸업', desc: '자유로운 두 손으로 세상을 탐색해요' },
    { id: 'm16', title: '첫 통잠의 기적', desc: '밤에 깨지 않고 길게 푹 잤어요 (엄빠 오열)' },
    { id: 'm17', title: '뒤집기 첫 시도', desc: '몸을 비틀며 뒤집으려고 용을 써요' },
    { id: 'm18', title: '백일의 기적', desc: '건강하게 100일을 맞이했어요! 축하해' },
    { id: 'm19', title: '침샘 폭발', desc: '침을 질질 흘리며 턱받이를 시작했어요' },
    { id: 'm20', title: '낯가림 시작', desc: '엄마 아빠를 확실히 알아보고 낯을 가려요' },

    // 🐤 영아기 2 (4~6개월)
    { id: 'm21', title: '완벽한 뒤집기', desc: '영차! 드디어 세상을 뒤집었어요' },
    { id: 'm22', title: '되집기 성공', desc: '엎드려 있다가 다시 하늘을 보고 누웠어요' },
    { id: 'm23', title: '발가락 잡고 놀기', desc: '유연하게 자기 발가락을 입으로 가져가요' },
    { id: 'm24', title: '첫니가 뿅! 났어요', desc: '귀여운 아랫니가 잇몸을 뚫고 올라왔어요' },
    { id: 'm25', title: '이유식 첫 숟가락', desc: '분유/모유 말고 첫 식사(미음)를 했어요' },
    { id: 'm26', title: '빨대컵 첫 성공', desc: '켁켁대지 않고 빨대로 물을 마셨어요' },
    { id: 'm27', title: '떡뻥 입문', desc: '입안에서 사르르 녹는 첫 간식의 맛!' },
    { id: 'm28', title: '혼자서 앉았어요', desc: '손을 짚지 않고 허리를 꼿꼿이 세워요' },
    { id: 'm29', title: '배밀이 시작', desc: '배를 바닥에 대고 앞으로 전진해요' },
    { id: 'm30', title: '네발기기 성공', desc: '무릎을 떼고 다다다 기어 다니기 시작해요' },

    // 🐾 탐색기 (7~9개월)
    { id: 'm31', title: '잼잼 곤지곤지', desc: '손가락을 쥐었다 폈다 개인기를 보여줘요' },
    { id: 'm32', title: '짝짜꿍 짝짜꿍', desc: '신나게 두 손을 마주치며 박수를 쳐요' },
    { id: 'm33', title: '까꿍 놀이 홀릭', desc: '얼굴을 가렸다 보여주면 자지러지게 웃어요' },
    { id: 'm34', title: '잡고 일어서기', desc: '가구나 울타리를 잡고 드디어 두 발로 섰어요' },
    { id: 'm35', title: '소파 잡고 걷기', desc: '게걸음으로 물건을 잡고 옆으로 이동해요' },
    { id: 'm36', title: '엄마! 불렀어요', desc: '정확하게 엄마를 보며 맘마/엄마 라고 했어요' },
    { id: 'm37', title: '아빠! 불렀어요', desc: '세상에서 가장 감동적인 아빠 소리!' },
    { id: 'm38', title: '첫 감기 (맴찢)', desc: '처음으로 열이 나고 아팠어요. 훌쩍 커가는 과정' },
    { id: 'm39', title: '영유아 검진 1차', desc: '키, 몸무게 상위 몇 퍼센트일까요?' },
    { id: 'm40', title: '카시트 적응', desc: '울지 않고 의젓하게 카시트에 잘 타요' },

    // 🚶 걸음마기 (10~12개월)
    { id: 'm41', title: '혼자 서 있기 3초', desc: '아무것도 안 잡고 균형을 잡으며 서 있었어요' },
    { id: 'm42', title: '첫걸음마 성공!', desc: '비틀비틀, 스스로 첫발을 내디뎠어요' },
    { id: 'm43', title: '도리도리', desc: '싫어요! 고개를 저으며 의사표현을 해요' },
    { id: 'm44', title: '빠이빠이 손 흔들기', desc: '헤어질 때 안녕~ 하고 손을 흔들어줘요' },
    { id: 'm45', title: '돌잔치 완료', desc: '축 1년! 돌잡이에서는 무엇을 잡았을까요?' },
    { id: 'm46', title: '유아식 첫 도전', desc: '진밥과 반찬으로 어른들처럼 밥을 먹어요' },
    { id: 'm47', title: '생우유 입문', desc: '분유를 끊고 멸균우유/생우유로 넘어갔어요' },
    { id: 'm48', title: '어금니가 났어요', desc: '이제 딱딱한 음식도 제법 잘 씹어요' },
    { id: 'm49', title: '스푼 포크 쥐기', desc: '도구를 사용해서 스스로 먹으려고 해요' },
    { id: 'm50', title: '뽀뽀 쪽!', desc: '입술을 쭉 내밀고 사랑스러운 뽀뽀를 해줘요' },

    // 🏃 활동기 (13~18개월)
    { id: 'm51', title: '첫 미용실 이발', desc: '바리캉 소리에도 씩씩하게 머리를 잘랐어요' },
    { id: 'm52', title: '첫 신발 장착', desc: '삑삑이 신발을 신고 밖에서 걸었어요' },
    { id: 'm53', title: '키즈카페 첫 입장', desc: '신세계 발견! 방방 뛰며 하얗게 불태웠어요' },
    { id: 'm54', title: '동물 소리 흉내', desc: '강아지는 멍멍! 호랑이는 어흥! 소리를 내요' },
    { id: 'm55', title: '첫 바다 구경', desc: '철썩이는 파도와 모래사장을 처음 밟았어요' },
    { id: 'm56', title: '두 단어 연결하기', desc: '엄마 맘마, 아빠 와! 등 문장으로 말해요' },
    { id: 'm57', title: '컵으로 물 마시기', desc: '흘리지 않고 컵을 들고 물을 마셔요' },
    { id: 'm58', title: '공 던지기', desc: '작은 공을 앞으로 힘껏 던질 수 있어요' },
    { id: 'm59', title: '첫 블록 쌓기', desc: '블록을 무너뜨리지 않고 2~3개 쌓아 올려요' },
    { id: 'm60', title: '계단 오르기', desc: '손을 잡아주면 한 칸씩 계단을 올라가요' },

    // 🎨 발달 폭발기 (19~24개월)
    { id: 'm61', title: '두 발로 콩콩 뛰기', desc: '점프! 두 발이 동시에 바닥에서 떨어졌어요' },
    { id: 'm62', title: '양치질 거부 극복', desc: '치카치카 시간을 즐거워하기 시작했어요' },
    { id: 'm63', title: '첫 스티커 놀이', desc: '온 집안에 스티커를 야무지게 붙이고 놀아요' },
    { id: 'm64', title: '크레용 첫 낙서', desc: '스케치북에 예술적인 피카소 선을 그렸어요' },
    { id: 'm65', title: '미끄럼틀 혼자 타기', desc: '계단을 올라가 슝~ 혼자서 미끄럼틀을 타요' },
    { id: 'm66', title: '배변훈련 시작', desc: '기저귀와 안녕할 준비! 유아 변기와 친해져요' },
    { id: 'm67', title: '변기에 첫 쉬야', desc: '성공! 기저귀가 아닌 변기에 볼일을 봤어요' },
    { id: 'm68', title: '스스로 양말 신기', desc: '끙끙대며 혼자 양말을 신으려고 노력해요' },
    { id: 'm69', title: '첫 심부름 성공', desc: '이거 아빠 갖다주세요~ 심부름을 완수했어요' },
    { id: 'm70', title: '친구 이름 부르기', desc: '놀이터나 문센에서 만난 친구를 기억하고 불러요' },

    // 🛴 엉아/누나 모드 (25~30개월)
    { id: 'm71', title: '세발자전거 타기', desc: '페달에 발을 올리고 굴리는 방법을 터득했어요' },
    { id: 'm72', title: '가위질 첫 시도', desc: '안전 가위로 종이를 싹둑싹둑 잘라봐요' },
    { id: 'm73', title: '숫자 1~10 세기', desc: '일, 이, 삼... 제법 순서대로 숫자를 세요' },
    { id: 'm74', title: '색깔 구별하기', desc: '빨강, 파랑, 노랑 등 색깔의 이름을 알아요' },
    { id: 'm75', title: '왜요? 지옥 입성', desc: '이건 뭐야? 왜? 호기심이 폭발하는 시기' },
    { id: 'm76', title: '율동하며 노래하기', desc: '곰 세 마리를 율동과 함께 완창했어요' },
    { id: 'm77', title: '혼자 바지 입기', desc: '두 다리를 구멍에 쏙 넣고 스스로 바지를 입어요' },
    { id: 'm78', title: '첫 킥보드 탑승', desc: '한 발을 구르며 씽씽 달리며 바람을 가르네요' },
    { id: 'm79', title: '우산 혼자 쓰기', desc: '비 오는 날 작은 우산을 꽉 쥐고 걸어가요' },
    { id: 'm80', title: '젓가락질 첫 시도', desc: '에디슨(교정) 젓가락으로 반찬을 집어봐요' },

    // 🌟 완성기 (31~36개월)
    { id: 'm81', title: '낮잠 패스한 날', desc: '에너자이저! 낮잠 없이 밤까지 버틴 첫날' },
    { id: 'm82', title: '혼자서 손 씻기', desc: '발판에 올라가 비누칠하고 스스로 손을 씻어요' },
    { id: 'm83', title: '퍼즐 맞추기 성공', desc: '조각을 이리저리 돌려가며 그림을 완성해요' },
    { id: 'm84', title: '역할놀이 심취', desc: '엄마 아빠 흉내를 내며 소꿉놀이에 빠졌어요' },
    { id: 'm85', title: '동생(인형) 돌보기', desc: '토닥토닥 인형을 재워주며 애착을 보여요' },
    { id: 'm86', title: '내 물건 챙기기', desc: '외출할 때 자기가 좋아하는 장난감을 가방에 챙겨요' },
    { id: 'm87', title: '첫 영화관/공연', desc: '캄캄한 곳에서도 울지 않고 얌전히 관람했어요' },
    { id: 'm88', title: '영유아 구강검진', desc: '치과 의자에서 아~ 벌리고 충치 검사를 했어요' },
    { id: 'm89', title: '스스로 신발 찍찍이', desc: '신발 혀를 빼고 찍찍이 벨크로를 딱 붙여요' },
    { id: 'm90', title: '감정 말로 표현하기', desc: '나 화났어! 슬퍼! 기분 좋아! 감정을 설명해요' },

    // 🎒 드디어 사회로! (스페셜 모먼트)
    { id: 'm91', title: '첫 소풍(도시락)', desc: '예쁜 도시락을 싸서 첫 야외 소풍을 다녀왔어요' },
    { id: 'm92', title: '마스크 스스로 쓰기', desc: '귀에 끈을 걸어 스스로 마스크를 챙겨 써요' },
    { id: 'm93', title: '친구와 양보하기', desc: '내 거야! 하다가도 친구에게 장난감을 빌려줘요' },
    { id: 'm94', title: '글자에 관심 갖기', desc: '간판이나 그림책의 글자를 가리키며 물어봐요' },
    { id: 'm95', title: '이름 쓰기 시도', desc: '삐뚤빼뚤하지만 자기 이름과 비슷한 모양을 그려요' },
    { id: 'm96', title: '혼자서 그네 타기', desc: '밀어주지 않아도 발을 굴러 그네를 타요' },
    { id: 'm97', title: '엄마 아빠 안마하기', desc: '고사리손으로 어깨를 조물조물 두드려줘요' },
    { id: 'm98', title: '아플 때 약 잘 먹기', desc: '쓴 약도 주사기/약통으로 꿀꺽 잘 삼켜요' },
    { id: 'm99', title: '첫 상장(칭찬장)', desc: '기관에서 주는 기특한 첫 상장을 받아왔어요' },
    { id: 'm100', title: '어린이집 첫 등원', desc: '품을 떠나 첫 사회생활을 시작해요! 훌쩍 컸네!' }
];

const TOTAL_MILESTONES = 100; // 최종 기획 목표치

// 2. 도감 진행도 업데이트 (애니메이션 쫀득하게 추가!)
window.updateMilestoneCounter = function() {
    let achieved = JSON.parse(localStorage.getItem('tosil_milestones')) || [];
    let countText = `${achieved.length}/${TOTAL_MILESTONES}`;
    
    // 메인 홈 화면 버튼 카운터 업데이트
    const homeCounterEl = document.getElementById('milestone-counter');
    if(homeCounterEl) {
        // 숫자가 바뀌면 살짝 띠용! 하고 노란색으로 빛났다가 돌아오는 효과
        if (homeCounterEl.innerText !== countText) {
            homeCounterEl.innerText = countText;
            homeCounterEl.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            homeCounterEl.style.transform = 'scale(1.3)';
            homeCounterEl.style.color = '#FEE500'; // 카카오톡 노란색 포인트
            setTimeout(() => {
                homeCounterEl.style.transform = 'scale(1)';
                homeCounterEl.style.color = '#FFF';
            }, 300);
        } else {
            homeCounterEl.innerText = countText;
        }
    }
    
    // 바텀 시트 안쪽 카운터 업데이트
    const sheetCounterEl = document.getElementById('sheet-counter');
    if(sheetCounterEl) sheetCounterEl.innerText = `${achieved.length} / ${TOTAL_MILESTONES} 달성`;
};

// 3. 바텀 시트 열기 & 리스트 렌더링 (하단에 '자랑하기' 버튼 추가!)
window.openMilestoneModal = function() {
    if (navigator.vibrate) navigator.vibrate(15);
    
    const container = document.getElementById('milestone-list-container');
    let achieved = JSON.parse(localStorage.getItem('tosil_milestones')) || [];
    
    let html = `
        <!-- 📸 바이럴을 위한 상단 저장 버튼 -->
        <button onclick="downloadMilestone()" style="width: 100%; background: #F2F5F8; color: #4E5968; border: none; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 800; margin-bottom: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📸 내 도감 앨범에 저장해서 자랑하기
        </button>
        <!-- 캡처될 영역 시작 -->
        <div id="milestone-capture-area" style="background:#FFF; padding:10px 0;">
    `;

    MILESTONE_DATA.forEach((item, index) => {
        const isDone = achieved.includes(item.id);
        const formattedNum = String(index + 1).padStart(2, '0'); 
        
        html += `
            <div class="milestone-item ${isDone ? 'achieved' : ''}" id="card-${item.id}">
                <div style="display:flex; align-items:center; gap: 16px;">
                    <div id="num-${item.id}" style="width: 28px; font-size: 18px; font-weight: 900; color: ${isDone ? '#1B64DA' : '#D1D6DB'}; text-align: left; font-family: 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.5px; transition: color 0.3s;">
                        ${formattedNum}
                    </div>
                    <div>
                        <div style="font-size: 15px; font-weight: 800; color: #191F28; margin-bottom: 2px;">${item.title}</div>
                        <div style="font-size: 12px; color: #8B95A1;">${item.desc}</div>
                    </div>
                </div>
                <button class="milestone-check-btn" onclick="toggleMilestone('${item.id}', this)">✓</button>
            </div>
        `;
    });
    
    html += `</div>`; // 캡처 영역 끝
    container.innerHTML = html;
    document.getElementById('milestone-bottom-sheet').classList.add('show');
};

// 4. 바텀 시트 닫기
window.closeMilestoneModal = function() {
    document.getElementById('milestone-bottom-sheet').classList.remove('show');
};

// 5. 도장 찍기 토글 로직 + 골드 펄 이펙트
window.toggleMilestone = function(id, btnElement) {
    if (navigator.vibrate) navigator.vibrate([10, 30, 20]);
    
    let achieved = JSON.parse(localStorage.getItem('tosil_milestones')) || [];
    const idx = achieved.indexOf(id);
    
    const cardEl = document.getElementById(`card-${id}`);
    const numEl = document.getElementById(`num-${id}`);
    
    if (idx === -1) {
        achieved.push(id); 
        cardEl.classList.add('achieved');
        if(numEl) numEl.style.color = '#1B64DA'; // 숫자 파란색으로 변경
        
        // ✨ 달성 시 골드 펄 이펙트 실행
        const pearl = document.createElement('div');
        pearl.className = 'gold-pearl-effect';
        btnElement.appendChild(pearl);
        
        // 애니메이션이 끝나면 잔해물 삭제
        setTimeout(() => pearl.remove(), 600);
        
    } else {
        achieved.splice(idx, 1); 
        cardEl.classList.remove('achieved');
        if(numEl) numEl.style.color = '#D1D6DB'; // 숫자 원래대로 복구
    }
    
    localStorage.setItem('tosil_milestones', JSON.stringify(achieved));
    updateMilestoneCounter(); 
};

// 6. 앱 초기화 시 홈 화면 카운터 세팅
document.addEventListener("DOMContentLoaded", () => {
    updateMilestoneCounter();
});

// ==========================================
// 📸 마일스톤 도감 이미지 캡처 (인스타 자랑용)
// ==========================================
window.downloadMilestone = function() {
    const target = document.getElementById('milestone-capture-area'); 
    if (!target) return alert("저장할 도감을 찾을 수 없습니다.");
    
    if (typeof html2canvas === 'undefined') {
        return alert("이미지 저장 라이브러리가 필요합니다.");
    }

    // 캡처 중엔 스크롤바나 잡티가 안 보이게 임시 처리
    window.showToast("📸 도감을 예쁘게 앨범에 굽고 있어요...");

    html2canvas(target, {
        scale: 2, // 고화질
        backgroundColor: '#ffffff',
    }).then(canvas => {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const babyName = localStorage.getItem('tosil_babyName') || '우리아기';
        link.download = `${babyName}_첫도감.png`;
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.showToast("🎉 앨범 저장 완료! 맘카페나 인스타에 자랑해보세요!");
    }).catch(err => {
        console.error("도감 캡처 에러:", err);
        alert("저장 중 오류가 발생했습니다 ㅠㅠ");
    });
};