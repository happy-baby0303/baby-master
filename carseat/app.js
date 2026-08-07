// ==========================================
// 🚘 육아메이트 카시트 AI 큐레이터 엔진 V4.0 (carseat/app.js)
// (강력한 감점 AI 탑재 + 조잡한 하드코딩 배너 제거 및 개별 리포트화)
// ==========================================

let isFavViewMode = false; 

// 🚀 1. 글로벌 데이터 자동 동기화 (다이어트 & 뱃지 동기화 완료)
function applyGlobalBabyProfile() {
    const birthStr = localStorage.getItem('tosil_startDate');
    const babyName = localStorage.getItem('tosil_babyName') || '우리 아기';
    if(!birthStr) return; 
    
    const birthDate = new Date(birthStr);
    const today = new Date();
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    if (months < 0) months = 0;

    let ageFilter = 'all';
    if (months <= 11) ageFilter = 'newborn';
    else if (months <= 48) ageFilter = 'toddler';
    else ageFilter = 'junior';

    const ageSelect = document.getElementById('filter-age');
    if(ageSelect) ageSelect.value = ageFilter;

    // ✂️ 1. 촌스러운 파란색 대형 배너는 과감히 숨김 (다이어트!)
    const banner = document.getElementById('auto-sync-banner');
    if(banner) {
        banner.style.display = 'none'; 
    }

    // ✨ 2. 화면에 있는 모든 쿨한 뱃지(class)를 싹 다 찾아서 개월 수 쏴주기!
    const badges = document.querySelectorAll('.dynamic-age-badge');
    badges.forEach(b => {
        b.innerText = `생후 ${months}개월 맞춤`;
    });
}

// 🚀 2. 찜하기 기능
function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favCarseats')) || [];
    let isFav = false; 
    if(favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id); 
        isFav = false;
    } else {
        favorites.push(id); 
        isFav = true;
    }
    localStorage.setItem('favCarseats', JSON.stringify(favorites));
    
    if (isFavViewMode) renderFavorites(); 
    else {
        const btn = document.getElementById(`fav-btn-${id}`);
        if (btn) {
            btn.innerHTML = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
            btn.style.background = isFav ? '#FFF2F2' : '#F2F4F6';
            btn.style.color = isFav ? '#E32636' : '#4E5968';
            btn.style.borderColor = isFav ? '#FCA5A5' : '#E5E8EB';
        }
    }
}

function toggleFavView() {
    isFavViewMode = !isFavViewMode;
    const btn = document.getElementById('btn-show-fav');

    if (isFavViewMode) {
        btn.innerHTML = '🔙 검색 화면으로 돌아가기';
        btn.style.background = '#F2F4F6';
        btn.style.color = '#4E5968';
        btn.style.borderColor = '#D1D5DB';
        renderFavorites();
    } else {
        btn.innerHTML = '❤️ 내가 찜한 카시트 모아보기';
        btn.style.background = '#FFF2F2';
        btn.style.color = '#E32636';
        btn.style.borderColor = '#FCA5A5';
        runCarseatEngine(); 
    }
}

function renderFavorites() {
    const resultArea = document.getElementById('carseat-result-area');
    const favorites = JSON.parse(localStorage.getItem('favCarseats')) || [];

    if (favorites.length === 0) {
        resultArea.innerHTML = `<div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px;"><div class="empty-icon" style="font-size:40px; margin-bottom:12px;">💔</div><div class="empty-text"><b>아직 찜한 카시트가 없어요!</b><br><span style="font-size:13px; color:#8B95A1;">마음에 드는 모델에 하트(❤️)를 눌러보세요.</span></div></div>`;
        return;
    }

    let favItems = carseatData.filter(item => favorites.includes(item.id));
    let htmlOutput = `<div style="font-size: 16px; font-weight: 800; color: #E32636; margin-bottom: 16px;">❤️ 내 찜 보관함 (${favItems.length}개)</div>`;
    htmlOutput += favItems.map(item => generateReportHTML({ ...item, matchRate: null })).join('');
    resultArea.innerHTML = htmlOutput;
}

// 🚀 3. 강력해진 AI 카드 렌더링 엔진 (대기업 템플릿 적용)
function generateReportHTML(item) {
    const favorites = JSON.parse(localStorage.getItem('favCarseats')) || [];
    const isFav = favorites.includes(item.id);
    const heartIcon = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
    const heartColor = isFav ? '#FFF2F2' : '#F2F4F6';
    const heartText = isFav ? '#E32636' : '#4E5968';
    const heartBorder = isFav ? '#FCA5A5' : '#E5E8EB';

    let scoreHtml = "";
    let aiReportHtml = '';

    if (item.matchRate !== null && !isFavViewMode && item.matchRate !== undefined) {
        let titleColor, bgColor, borderColor, titleText;
        
        if (item.matchRate === 100) {
            titleColor = '#3182F6'; bgColor = '#F9FAFB'; borderColor = '#E5E8EB'; titleText = '🟢 AI 최적합 판정';
        } else if (item.matchRate >= 80) {
            titleColor = '#059669'; bgColor = '#F9FAFB'; borderColor = '#E5E8EB'; titleText = '🍀 AI 우수 판정';
        } else if (item.matchRate >= 50) {
            titleColor = '#F59E0B'; bgColor = '#F9FAFB'; borderColor = '#E5E8EB'; titleText = '⚠️ AI 조건부 추천';
        } else {
            titleColor = '#E32636'; bgColor = '#F9FAFB'; borderColor = '#E5E8EB'; titleText = '❌ AI 비추천 판정';
        }

        scoreHtml = `<div style="text-align: right; line-height: 1.1;"><div style="font-size: 22px; font-weight: 900; color: ${titleColor}; letter-spacing: -0.5px;">${item.matchRate}%</div><div style="font-size: 11px; font-weight: 800; color: #8B95A1; margin-top: 4px;">AI 매칭</div></div>`;

        let reasonLi = item.matchRate === 100 
            ? `<li style="margin-bottom:4px;"> ${item.matchReasons[0]}</li>`
            : item.matchReasons.map(r => `<li style="margin-bottom:4px; color:#4E5968;">🚨 <b>${r}</b></li>`).join('');

        aiReportHtml = `
            <div style="background:${bgColor}; border:1px solid ${borderColor}; padding:16px; border-radius:14px; margin-bottom:16px;">
                <h4 style="color:${titleColor}; margin:0 0 10px 0; font-size:14px; font-weight:800;">${titleText}</h4>
                <ul style="margin:0; padding-left:20px; font-size:13px; color:#4E5968; line-height:1.5; font-weight: 600;">${reasonLi}</ul>
            </div>`;
    }

    const safetyChecks = item.safety.map(s => `✅ ${s.toUpperCase()} 최고 등급 인증`).join('<br>');
    const adacText = item.specs.adacScore.includes('미참여') 
        ? `✅ ${item.specs.adacScore}` 
        : `✅ ADAC 테스트: ${item.specs.adacScore}`;

    const isOfficial = (item.reportUrl && item.reportUrl !== "#" && item.reportUrl.trim() !== "");
    const labelText = isOfficial ? "🔗 ADAC 충돌 테스트 원문 보기 ➔" : "🔍 ADAC 테스트 관련 정보 검색 ➔";
    const targetUrl = isOfficial ? item.reportUrl : `https://www.google.com/search?q=ADAC+${encodeURIComponent(item.brand)}+${encodeURIComponent(item.name)}`;
    const reportBtn = `<a href="${targetUrl}" target="_blank" style="display:inline-block; margin-top:8px; font-size:12px; color:#3182F6; text-decoration:underline; font-weight:700;">${labelText}</a>`;
        
    // ✨ 자동 검색 URL + 파트너스 코드
    const partnerCode = "flDiNnqr00";
    const coupangSearchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(item.brand + ' ' + item.name)}&afag=${partnerCode}`;
    const matMirrorUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent('카시트 보호매트 거울 세트')}&afag=${partnerCode}`;

    // ✨ 파트너님이 주신 워딩으로 쿠팡 방어 멘트 교체 완료!
    let purchaseBtn = item.purchasePlatform === 'coupang' 
        ? `<div style="margin-top: 24px;">
               <a href="${coupangSearchUrl}" target="_blank" class="buy-btn coupang" style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 0; background: #191F28; color: #FFF; border: 1px solid #000; box-shadow: 0 4px 14px rgba(0,0,0,0.1); font-size: 15px; padding: 18px 0; border-radius: 14px; font-weight: 900; text-decoration: none; transition: 0.2s;">
                   🚀 쿠팡 최저가 검색하기 〉
               </a>
           </div>
           <div class="coupang-safety-guard" style="font-size: 11.5px; color: #8B95A1; font-weight: 600; text-align: center; margin-top: 10px; line-height: 1.5; word-break: keep-all;">
               ※ 안전하고 빠른 교환/환불을 위해 구매 시 가급적 <b>[로켓배송]</b> 마크가 있는 상품을 선택하시길 권장합니다.<br>
               (A/S 및 교환/환불 규정은 해당 판매처 및 제조사 정책을 따릅니다)
           </div>`
        : `<div style="margin-top: 24px;">
               <a href="${item.linkUrl}" target="_blank" class="buy-btn official" style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 0; background: #F9FAFB; color: #191F28; border: 1px solid #D1D5DB; font-size: 15px; padding: 18px 0; border-radius: 14px; font-weight: 900; text-decoration: none; transition: 0.2s;">
                   👑 브랜드 공식 스토어 가기 〉
               </a>
           </div>`;

    const techSpecHTML = item.specs.sideProtection ? `✅ <b>기술 스펙:</b> ${item.specs.sideProtection}<br>` : ``;

    const specBadges = item.bodySpec.split('/').map(s => 
        `<span style="background: #F2F4F6; color: #4E5968; font-size: 11.5px; font-weight: 700; padding: 6px 10px; border-radius: 8px; white-space: nowrap;">${s.trim()}</span>`
    ).join('');

    return `
        <div class="report-card" id="card-${item.id}" style="border-top: 4px solid ${isFavViewMode ? '#E32636' : 'transparent'};">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                        ${specBadges}
                    </div>
                    <div style="font-size:22px; font-weight:900; letter-spacing:-0.5px; color:#191F28; word-break:keep-all; line-height:1.4;">
                        [${item.brand}] ${item.name}
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;">
                    <button id="fav-btn-${item.id}" onclick="toggleFavorite('${item.id}')" style="background:${heartColor}; color:${heartText}; border:1px solid ${heartBorder}; padding:8px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; transition:0.2s; white-space:nowrap;">
                        ${heartIcon}
                    </button>
                </div>
            </div>
            
            ${aiReportHtml}

            <div style="background: #F9FAFB; padding: 16px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 16px;">
                <div style="font-weight: 800; color: #191F28; margin-bottom: 8px;">🛡️ 인증 리포트 & 장착 방식</div>
                <div style="font-size: 13.5px; line-height: 1.6; color: #4E5968; font-weight: 600;">
                    ${safetyChecks}<br>
                    ${adacText}<br>
                    ✅ <b>안전 장치:</b> ${item.specs.reboundStopper}<br>
                    ${techSpecHTML}${reportBtn}
                </div>
            </div>

            <div class="insight-box" style="background: #F9FAFB; padding: 16px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 16px;">
                <div style="font-size: 13px; font-weight: 800; color: #191F28; margin-bottom: 6px;">💡 전문가 소견</div>
                <div style="font-size: 13.5px; color: #4E5968; line-height: 1.5; font-weight: 600; word-break: keep-all;">${item.desc}</div>
            </div>

            ${purchaseBtn}

            <button onclick="shareToHusband('${item.id}')" style="display:block; width:100%; background:#F9FAFB; border:1px solid #E5E8EB; color:#4E5968; padding:16px; border-radius:14px; font-weight:800; font-size:14px; text-align:center; transition:0.2s; margin-top:16px; cursor:pointer;">
                🟢 남편에게 이 '안전 리포트' 전송하기
            </button>

            <!-- ✨ 필수 꿀팁 (보호매트/거울 주의사항 체크포인트 추가!) -->
            <div style="background: #FFFBEB; padding: 16px; border-radius: 14px; font-size: 13px; color: #B45309; border: 1px solid #FDE68A; line-height: 1.5; margin-top: 16px;">
                <b style="color: #D97706; font-size: 13.5px; display:block; margin-bottom:4px;">💡 AI 카시트 설치 필수 꿀팁:</b>
                새 카시트 장착 시 <b>차량 가죽시트 눌림 및 영구 파손</b>이 100% 발생합니다. 카시트 도착 전, 후방거울과 보호매트를 꼭 미리 세팅해 두세요!<br>
                <div style="font-size: 11.5px; color: #B45309; margin-top: 8px; margin-bottom: 4px; padding: 8px; background: #FEF3C7; border-radius: 8px;">
                    ⚠️ <b>구매 시 체크포인트:</b><br>
                    1. 내 차 헤드레스트에 거울 끈이 묶이는 형태인지 확인!<br>
                    2. 매트에 카시트가 밀리지 않도록 미끄럼 방지(논슬립) 처리가 되어 있는지 확인!
                </div>
                <a href="${matMirrorUrl}" target="_blank" style="display:inline-block; margin-top:8px; color: #D97706; font-weight: 800; text-decoration: underline;">👉 보호매트+거울 세트 검색하기</a>
            </div>
        </div>
    `;
}

// ----------------------------------------------------
// 🚀 4. 핵심: 깐깐한 감점(Penalty) AI 엔진 도입!
// ----------------------------------------------------
function runCarseatEngine() {
    if (isFavViewMode) return; 

    const age = document.getElementById('filter-age').value;
    const carSize = document.getElementById('filter-car').value;
    const install = document.getElementById('filter-install').value; 
    const safety = document.getElementById('filter-safety').value;
    
    // =========================================================
    // 👇 여기서부터 (기존 배너 숨김 코드 지우고 이걸로 덮어쓰기!) 👇
    // =========================================================
    const warningBanner = document.getElementById('vehicle-warning-banner');
    
    // 🚨 카니발 선택 시 강력한 경고 배너 노출!
    if (carSize === 'carnival') {
        warningBanner.innerHTML = `
            <div style="background: #FFF0F1; border: 1px solid #F04452; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 20px;">🚨</span>
                <div>
                    <div style="font-size: 14px; font-weight: 900; color: #D32F2F; margin-bottom: 4px;">카니발 3열 장착 주의!</div>
                    <div style="font-size: 12.5px; font-weight: 600; color: #4E5968; line-height: 1.4;">
                        카니발 등 바닥에 수납함이 있는 차량은 기둥(레그)형 카시트 장착 시 뚜껑이 부서질 위험이 큽니다. 가급적 <b>'탑테더(끈으로 묶는 방식)'</b>를 권장합니다.
                    </div>
                </div>
            </div>
        `;
        warningBanner.style.display = 'block';
    } else {
        if(warningBanner) warningBanner.style.display = 'none';
    }

    const resultArea = document.getElementById('carseat-result-area');
    const isFilterActive = (age !== 'all' || carSize !== 'all' || install !== 'all' || safety !== 'all');

    let processedData = carseatData.map(item => {
        if (!isFilterActive) return { ...item, matchRate: null, matchReasons: [] };

        let score = 100;
        let reasons = [];

        // 1. 👶 연령 조건 (안전 직결 - 불일치 시 대폭 감점)
        if (age !== 'all' && !item.age.includes(age)) { 
            score -= 60; reasons.push('선택하신 아기 탑승 연령대와 규격이 맞지 않아 극히 위험합니다.'); 
        }

        // 2. 🛠️ 장착 방식 (차량 호환성 - 불일치 시 가차없이 탈락)
        if (install !== 'all' && !item.install.includes(install)) { 
            score -= 50; reasons.push('요청하신 고정 방식(ISOFIX/벨트)으로 장착할 수 없는 모델입니다.'); 
        }

        // 3. 🛡️ 안전 인증
        if (safety !== 'all' && !item.safety.includes(safety)) { 
            score -= 20; reasons.push('요청하신 최상위 안전 인증/테스트 기준을 충족하지 않습니다.'); 
        }

        // 4. 🚙 차량 크기 & 특수 조건 (AI의 소름 돋는 디테일!)
        if (carSize === 'carnival' && item.install.includes('isofix_leg')) {
            score -= 50; reasons.push('카니발 2열 바닥 수납함이 서포팅 레그 하중으로 인해 파손될 위험이 큽니다! (탑테더 방식 권장)');
        }
        if (carSize === 'compact') {
            if (item.age.includes('toddler')) { // 회전형/토들러 모델의 경우
                score -= 20; reasons.push('소형/준중형 차량 장착 시 조수석 탑승자가 매우 좁아질 수 있습니다.');
            }
        }
        if (carSize !== 'all' && !item.carSize.includes(carSize)) {
            score -= 10; reasons.push('선택하신 차량 크기에 장착 시 공간 효율이 떨어질 수 있습니다.');
        }

        if(score < 0) score = 0;
        if(score === 100) reasons.push('✨ 우리 아기의 생명과 차량 호환성을 완벽하게 충족합니다!');

        return { ...item, matchRate: score, matchReasons: reasons };
    });

    if (isFilterActive) processedData.sort((a, b) => b.matchRate - a.matchRate);

    if (processedData.length === 0 || (isFilterActive && processedData[0].matchRate < 50)) {
        resultArea.innerHTML = `<div class="premium-empty-state"><div class="empty-icon">🚘</div><div class="empty-text"><b>조건에 완벽하게 맞는 카시트가 없습니다.</b><span>차량 고정 방식 등을 한 번 더 확인해 주세요!</span></div></div>`;
        return;
    }

    let htmlOutput = `<div style="font-size: 16px; font-weight: 800; color: #191F28; margin-bottom: 16px;">✨ AI 안전성/호환성 검증 리포트</div>`;
    
    let top3Results = processedData.slice(0, 3); 
    let otherResults = processedData.slice(3); 
    
    htmlOutput += top3Results.map(item => generateReportHTML(item)).join('');

    if (otherResults.length > 0) {
        htmlOutput += `
            <button id="carseat-show-more-btn" onclick="toggleCarseatOthers()" style="display: block; width: 100%; padding: 16px; margin-top: 8px; margin-bottom: 24px; background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 14px; font-size: 14px; font-weight: 700; color: #4E5968; cursor: pointer;">
                나머지 ${otherResults.length}개 결과 보기 ▾
            </button>
            <div id="carseat-other-area" style="display:none; flex-direction: column;">
                ${otherResults.map(item => generateReportHTML(item)).join('')}
            </div>
        `;
    }
   resultArea.innerHTML = htmlOutput; // 👈 여기입니다!

    // 👇 여기에 스크롤 코드를 추가해 주세요!
    if (isFilterActive) {
        document.querySelector('.matrix-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
} // <-- runCarseatEngine() 함수가 끝나는 닫는 괄호

function toggleCarseatOthers() {
    const otherArea = document.getElementById('carseat-other-area');
    const btn = document.getElementById('carseat-show-more-btn');
    if (otherArea.style.display === 'none') {
        otherArea.style.display = 'flex';
        btn.innerText = '나머지 결과 접기 ▴';
    } else {
        otherArea.style.display = 'none';
        btn.innerText = `나머지 결과 보기 ▾`;
        // 👇 이 한 줄을 추가해 주세요! (리스트가 접힐 때 시선을 버튼 위치로 부드럽게 올려줌)
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function resetFilters() {
    let isChanged = false;
    document.querySelectorAll('.matrix-panel select').forEach(select => {
        if (select.value !== 'all') { select.value = 'all'; isChanged = true; }
    });
    if (isChanged && !isFavViewMode) runCarseatEngine();
}

if (!Kakao.isInitialized()) {
    Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b');
}

// 🚀 카카오톡 공유 시에도 '자동 검색 링크' 적용 완료!
function shareToHusband(id) {
    const item = carseatData.find(d => d.id === id);
    if(!item) return;

    // ✨ 카톡 공유 버튼을 눌렀을 때도 남편이 메인홈이 아닌 검색창으로 바로 가도록 수정
    const partnerCode = "flDiNnqr00"; 
    const myLink = item.purchasePlatform === 'coupang' 
        ? `https://www.coupang.com/np/search?q=${encodeURIComponent(item.brand + ' ' + item.name)}&afag=${partnerCode}`
        : item.linkUrl; 
        
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `여보! 우리 아기 카시트는 [${item.brand} ${item.name}] 제품으로 사자 💺❤️`,
            description: `${item.bodySpec}\n우리아이 생명이 달린 거니까 호환성 리포트 확인하고 이 링크로 결제해줘 🥰`, 
            imageUrl: 'https://happy-baby0303.github.io/baby-master/carseat/og-image.png',
            link: { mobileWebUrl: myLink, webUrl: myLink },
        },
        buttons: [
            { title: `💳 여보 전용 결제 및 상세정보 확인`, link: { mobileWebUrl: myLink, webUrl: myLink } }
        ],
    });
}

document.querySelectorAll('.matrix-panel select').forEach(select => {
    select.addEventListener('change', runCarseatEngine);
});

window.onload = () => { 
    applyGlobalBabyProfile(); 
    runCarseatEngine(); 
};

// 🚀 [추가] 장착 방식 가이드 모달 열기/닫기 함수
window.openInstallGuide = function() { document.getElementById('install-guide-modal').style.display = 'flex'; };
window.closeInstallGuide = function() { document.getElementById('install-guide-modal').style.display = 'none'; };