// ==========================================
// 🛒 육아메이트 유모차 AI 엔진 V16.2 (수익 극대화 & 모바일 최적화 패치 완료!)
// ==========================================

let isFavViewMode = false;

// 🚀 유모차 글로벌 데이터 자동 동기화
function applyGlobalBabyProfile() {
    const birthStr = localStorage.getItem('tosil_startDate');
    if (!birthStr) return; 

    // 날짜 쏠림(UTC) 버그 방지용 파싱
    const [y, m, d] = birthStr.split('-').map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    
    // 🚨 이번 달 생일(일)이 아직 안 지났으면 1개월 차감! (정확한 개월 수 계산)
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }
    if (months < 0) months = 0;

    const banner = document.getElementById('auto-sync-banner');
    if (banner) banner.style.display = 'none';

    document.querySelectorAll('.dynamic-age-badge').forEach(b => {
        b.innerText = `생후 ${months}개월 맞춤`;
    });

    let ageFilter = 'all';
    if (months <= 6) ageFilter = 'newborn';
    else if (months > 12) ageFilter = 'giant';

    const matBaby = document.getElementById('mat-baby');
    if (matBaby && ageFilter !== 'all') {
        matBaby.value = ageFilter;
    }
}

// 🚀 찜하기 (하트 토글)
function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favStrollers')) || [];
    let isFav = false;

    if(favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id);
        isFav = false;
    } else {
        favorites.push(id);
        isFav = true;
    }
    localStorage.setItem('favStrollers', JSON.stringify(favorites));

    if (isFavViewMode) {
        renderFavorites();
    } else {
        const btn = document.getElementById(`fav-btn-${id}`);
        if (btn) {
            btn.innerHTML = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
            btn.style.background = isFav ? '#FFF2F2' : '#F2F4F6';
            btn.style.color = isFav ? '#E32636' : '#4E5968';
            btn.style.borderColor = isFav ? '#FCA5A5' : '#E5E8EB';
        }
    }
}

// 🚀 찜 보관함 화면 전환
function toggleFavView() {
    isFavViewMode = !isFavViewMode;
    const btn = document.getElementById('btn-show-fav');
    const matrixPanel = document.querySelector('.matrix-panel');
    const filterSection = document.querySelector('.filter-section');

    if (isFavViewMode) {
        btn.innerHTML = '🔙 5D 매칭 화면으로 돌아가기';
        btn.style.background = '#F2F4F6';
        btn.style.color = '#4E5968';
        btn.style.borderColor = '#D1D5DB';
        if(matrixPanel) matrixPanel.style.display = 'none';
        if(filterSection) filterSection.style.display = 'none';
        renderFavorites();
    } else {
        btn.innerHTML = '❤️ 내가 찜한 유모차 모아보기';
        btn.style.background = '#FFF2F2';
        btn.style.color = '#E32636';
        btn.style.borderColor = '#FCA5A5';
        if(matrixPanel) matrixPanel.style.display = 'block';
        if(filterSection) filterSection.style.display = 'flex';
        renderList(false);
    }
}

function renderFavorites() {
    const topArea = document.getElementById('result-top-area');
    const otherArea = document.getElementById('result-other-area');
    const topTitle = document.getElementById('result-top-title');
    const showMoreBtn = document.getElementById('show-more-btn');

    const favorites = JSON.parse(localStorage.getItem('favStrollers')) || [];

    topTitle.style.display = 'none';
    if(showMoreBtn) showMoreBtn.style.display = 'none';
    if(otherArea) otherArea.style.display = 'none';

    if (favorites.length === 0) {
        topArea.innerHTML = `<div class="premium-empty-state" style="justify-content:center; padding: 40px;"><div class="empty-icon">💔</div><div class="empty-text" style="text-align:center;"><b>아직 찜한 유모차가 없어요!</b><span>마음에 드는 유모차에 하트(❤️)를 눌러보세요.</span></div></div>`;
        return;
    }

    let favItems = strollerData.filter(item => favorites.includes(item.id || item.name));

    let htmlOutput = `<div style="font-size: 18px; font-weight: 900; color: #E32636; margin-bottom: 16px;">❤️ 내 찜 보관함 (${favItems.length}개)</div>`;
    htmlOutput += favItems.map(item => generateCardHtml(item)).join('');
    topArea.innerHTML = htmlOutput;

    setTimeout(() => { document.querySelectorAll('.meter-fill, .v-bar-fill').forEach(el => { const height = el.getAttribute('data-height'); if(height) el.style.height = height; const width = el.getAttribute('data-width'); if(width) el.style.width = width; }); }, 50);
}

function runMatrixEngine(isUserAction = false) { renderList(isUserAction); }

function forceSwitchTab(cId, tabName) {
    const tabs = ['spec', 'fact', 'sim'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-${cId}-${t}`);
        const content = document.getElementById(`content-${cId}-${t}`);
        if(btn && content) {
            if(t === tabName) { btn.classList.add('active'); content.style.display = 'block'; }
            else { btn.classList.remove('active'); content.style.display = 'none'; }
        }
    });
}

function renderVS() {
    const v1 = document.getElementById('vs-1').value, v2 = document.getElementById('vs-2').value, res = document.getElementById('vs-result');
    if (v1==="" || v2==="") { res.style.display='none'; return; }
    if (v1===v2) { res.innerHTML='<div style="color:#E32636; padding:12px; background:#FEECEF; border-radius:8px; text-align:center; font-weight:700;">서로 다른 모델을 선택해주세요.</div>'; res.style.display='block'; return; }

    const i1 = strollerData[v1], i2 = strollerData[v2];
    res.innerHTML = `
        <div style="overflow-x: auto; padding-bottom: 8px;">
            <table class="vs-table" style="width: 100%; min-width: 320px; border-collapse: collapse; text-align: center; font-size: 13.5px;">
                <tr style="background: #F8F9FA; border-bottom: 2px solid #E5E8EB;">
                    <th class="vs-label" style="padding:10px; width: 25%;">항목</th>
                    <th style="color:#3182F6; font-weight:900; padding:10px; width: 37%;">${i1.name}</th>
                    <th style="color:#6B31F6; font-weight:900; padding:10px; width: 37%;">${i2.name}</th>
                </tr>
                <tr style="border-bottom: 1px solid #F2F5F8;"><td class="vs-label" style="padding:12px 4px; font-weight:800; color:#4E5968;">💰 공식가</td><td>${i1.price.toLocaleString()}원</td><td>${i2.price.toLocaleString()}원</td></tr>
                <tr style="border-bottom: 1px solid #F2F5F8;"><td class="vs-label" style="padding:12px 4px; font-weight:800; color:#4E5968;">💸 추가비용</td><td style="color:#E32636; font-size:12px; font-weight:700;">+${(i1.hiddenTax?.cost || 0).toLocaleString()}원</td><td style="color:#E32636; font-size:12px; font-weight:700;">+${(i2.hiddenTax?.cost || 0).toLocaleString()}원</td></tr>
                <tr style="border-bottom: 1px solid #F2F5F8;"><td class="vs-label" style="padding:12px 4px; font-weight:800; color:#4E5968;">🪶 무게</td><td>${i1.specs.weight}kg</td><td>${i2.specs.weight}kg</td></tr>
                <tr><td class="vs-label" style="padding:12px 4px; font-weight:800; color:#4E5968;">👶 2인확장</td><td>${i1.expand.includes('⭕')?'가능':'불가'}</td><td>${i2.expand.includes('⭕')?'가능':'불가'}</td></tr>
            </table>
        </div>
    `;
    res.style.display = 'block';
    res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getVolume(dims) { return (dims[0] * dims[1] * dims[2]) / 1000; }

function renderAdapterCard(brandName, textData) {
    if(!textData) return '';
    let statusClass = "good"; let icon = "✅"; let badgeText = "호환 완벽";
    if (textData.includes("❌")) { statusClass = "bad"; icon = "🚨"; badgeText = "호환 불가"; }
    else if (textData.includes("필요") || textData.includes("주의") || textData.includes("필수!")) { statusClass = "warn"; icon = "⚠️"; badgeText = "조건부 호환"; }
    let mainText = textData, subText = "";
    if(textData.includes("(")) { let parts = textData.split("("); mainText = parts[0].trim(); subText = "(" + parts[1]; }
    return `<div class="adapter-card"><div class="adapter-header"><div class="adapter-brand">${brandName}</div><div class="adapter-badge ${statusClass}">${icon} ${badgeText}</div></div><div class="adapter-main-desc">${mainText.replace(/[❌⭕🚨⚠️]/g, '')}</div>${subText ? `<div class="adapter-sub-desc">${subText.replace(/[❌⭕🚨⚠️]/g, '')}</div>` : ''}</div>`;
}

function toggleOthers() {
    const otherArea = document.getElementById('result-other-area');
    const btn = document.getElementById('show-more-btn');
    if (otherArea.style.display === 'none') {
        otherArea.style.display = 'flex'; btn.innerText = '나머지 결과 접기 ▴';
    } else {
        otherArea.style.display = 'none'; btn.innerText = '나머지 결과 보기 ▾';
    }
}

// 🌟 카드 렌더링 엔진 (대기업 템플릿 + 악세사리 수익화 통합 완료!)
function generateCardHtml(item) {
    const cId = item.originalIndex !== undefined ? item.originalIndex : Math.floor(Math.random() * 10000);
    const itemId = item.id || item.name; 

    const favorites = JSON.parse(localStorage.getItem('favStrollers')) || [];
    const isFav = favorites.includes(itemId);
    const heartIcon = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
    const heartColor = isFav ? '#FFF2F2' : '#F2F4F6';
    const heartText = isFav ? '#E32636' : '#4E5968';
    const heartBorder = isFav ? '#FCA5A5' : '#E5E8EB';

    // 2. 무게 및 크기 시각화
    const weightPercent = Math.min((item.specs.weight / 15) * 100, 100);
    const weightColor = item.specs.weight > 10 ? '#E32636' : (item.specs.weight > 6.5 ? '#F59E0B' : '#3182F6');
    let cabinStyle = item.specs.cabin.includes('⭕') ? 'color:#1B64DA; background:#E8F3FF;' : (item.specs.cabin.includes('⚠️') ? 'color:#C46C00; background:#FFF9E6;' : 'color:#E32636; background:#FEECEF;');

    const maxStrollerDim = Math.max(...item.foldedDims);
    let targetName = "20인치 기내용"; let targetDim = 55;
    if (maxStrollerDim > 70) { targetName = "28인치 캐리어"; targetDim = 75; }
    else if (maxStrollerDim > 55) { targetName = "24인치 캐리어"; targetDim = 65; }
    const maxGraphHeight = Math.max(maxStrollerDim, targetDim) + 10;
    const strollerHeightPct = (maxStrollerDim / maxGraphHeight) * 100;
    const carrierHeightPct = (targetDim / maxGraphHeight) * 100;
    let diffDesc = maxStrollerDim > targetDim ? `<div class="size-visual-desc warn">${targetName}보다 <b>${maxStrollerDim - targetDim}cm 더 큼</b></div>` : `<div class="size-visual-desc">${targetName}보다 <b>${targetDim - maxStrollerDim}cm 더 작음!</b></div>`;
    const visualGraphHtml = `<div class="size-visual-box"><div class="size-visual-title">📐 캐리어 대비 체감 크기</div><div class="visual-chart"><div class="v-bar-group"><div class="v-bar-bg"><div class="v-bar-fill carrier-color" data-height="${carrierHeightPct}%" style="height:0%;"></div></div><div class="v-bar-label">🧳 ${targetName}<br><b>${targetDim}cm</b></div></div><div class="v-bar-group"><div class="v-bar-bg"><div class="v-bar-fill stroller-color" data-height="${strollerHeightPct}%" style="height:0%;"></div></div><div class="v-bar-label">🛒 이 모델<br><b>${maxStrollerDim}cm</b></div></div></div>${diffDesc}</div>`;

    // 3. AI 리포트
    let aiReportHtml = `<div class="premium-empty-state"><div class="empty-icon">💡</div><div class="empty-text"><b>AI 매칭 리포트 대기 중</b><span>가족 상황을 선택하시면 분석서가 출력됩니다.</span></div></div>`;
    if (!isFavViewMode && item.matchRate !== null) {
        let reasonLi = '';
        if (item.matchRate === 100) {
            reasonLi = `<li style="margin-bottom:4px;">✨ ${item.matchReasons[0]}</li>`;
        } else if (item.matchReasons && item.matchReasons.length > 0) {
            reasonLi = item.matchReasons.map(r => `<li style="margin-bottom:4px; color: #4E5968;">🚨 <b>${r}</b></li>`).join('');
        }
        let reportTitle = item.matchRate >= 80 ? '🟢 AI 최적합 판정' : (item.matchRate >= 50 ? '⚠️ AI 조건부 추천' : '❌ AI 비추천 판정');
        let titleColor = item.matchRate >= 80 ? '#3182F6' : (item.matchRate >= 50 ? '#F59E0B' : '#E32636');

        aiReportHtml = `
            <div style="background:#F9FAFB; border:1px solid #E5E8EB; padding:16px; border-radius:14px; margin-bottom:16px;">
                <h4 style="color:${titleColor}; margin:0 0 10px 0; font-size:14px; font-weight: 800;">${reportTitle}</h4>
                <ul style="margin:0; padding-left:20px; font-size:13px; color:#4E5968; line-height:1.5; font-weight: 600;">${reasonLi}</ul>
            </div>`;
    }

    // 4. KTX 및 게이트 
    let ktxAlertHtml = '';
    const car = document.getElementById('mat-car') ? document.getElementById('mat-car').value : 'all';
    if (car === 'flight') {
        const minDim = Math.min(...item.foldedDims);
        if (minDim <= 25) ktxAlertHtml = `<div class="ktx-alert-box pass"><div class="ktx-icon">🚄</div><div><b>KTX/LCC 좌석 발밑 보관 ⭕</b><br>두께 ${minDim}cm로 앞좌석 발밑에 쏙 들어갑니다.</div></div>`;
        else ktxAlertHtml = `<div class="ktx-alert-box fail"><div class="ktx-icon">🚨</div><div><b>KTX/LCC 좌석 보관 불가 ❌</b><br>두께 ${minDim}cm. 짐칸 보관 필수.</div></div>`;
    } else if (car && car !== 'all' && typeof carDB !== 'undefined' && carDB[car]) {
        const carData = carDB[car];
        const dims = [...item.foldedDims].sort((a, b) => a - b);
        const minDim = dims[0], midDim = dims[1];
        const ratio = Math.round((getVolume(item.foldedDims) / carData.vol) * 100);
        if (minDim > carData.limitDepth) ktxAlertHtml = `<div class="ktx-alert-box fail"><div class="ktx-icon">🚨</div><div><b>테트리스 불가</b><br>${carData.name} 허용 깊이 초과. 뒷좌석 폴딩 필수.</div></div>`;
        else if (midDim > carData.limitHeight) ktxAlertHtml = `<div class="ktx-alert-box warn"><div class="ktx-icon">⚠️</div><div><b>입구 걸림 주의</b><br>${carData.name} 입구 높이 초과. 비틀어 넣어야 함.</div></div>`;
        else ktxAlertHtml = `<div class="ktx-alert-box pass"><div class="ktx-icon">🟢</div><div><b>${carData.name} 트렁크 프리패스</b><br>적재율 ${ratio}%. 여유 공간 남음.</div></div>`;
    }

    let gateHtml = '';
    if (item.width >= 65) { gateHtml = `<div class="gate-alert fail" style="margin-bottom:12px;">🚨 너비 ${item.width}cm: 일반 개찰구 불가. 휠체어 게이트 필수</div>`; } 
    else { gateHtml = `<div class="gate-alert pass" style="margin-bottom:12px;">🟢 너비 ${item.width}cm: 일반 개찰구/구형 엘베 프리패스</div>`; }

    const tabsHtml = `<div class="card-tabs"><div id="btn-${cId}-spec" class="tab-btn active" onclick="forceSwitchTab(${cId}, 'spec')">📊 기본스펙</div><div id="btn-${cId}-fact" class="tab-btn" onclick="forceSwitchTab(${cId}, 'fact')">🚨 실전팩트</div><div id="btn-${cId}-sim" class="tab-btn sim-tab-btn" onclick="forceSwitchTab(${cId}, 'sim')">🧬 AI리포트</div></div>`;

    // 5. 가격 영수증
    const realPrice = item.price + (item.hiddenTax?.cost || 0);
    let taxHtml = `<div class="receipt-box"><div class="receipt-row"><span>공식 출고가</span><span>${item.price.toLocaleString()}원</span></div>`;
    if (item.hiddenTax?.cost > 0) {
        taxHtml += `<div class="receipt-row" style="color:#E32636;"><span>+ 필수 추가비용</span><span>+${item.hiddenTax.cost.toLocaleString()}원</span></div><div class="receipt-desc">※ ${item.hiddenTax.items}</div>`;
    } else {
        taxHtml += `<div class="receipt-desc" style="color:#059669;">※ 추가비용 없음 (옵션질 없음 쾌적!)</div>`;
    }
    taxHtml += `<div class="receipt-total"><span>💸 최종 체감 결제액</span><span style="color:#3182F6;">${realPrice.toLocaleString()}원</span></div></div>`;

    const asClass = item.asInfo?.status === 'good' ? 'as-good' : (item.asInfo?.status === 'warn' ? 'as-warn' : 'as-bad');
    const asTitle = item.asInfo?.status === 'good' ? 'A/S 안심 보장' : (item.asInfo?.status === 'warn' ? 'A/S 체크포인트' : 'A/S 리스크 경고');
    const asIcon = item.asInfo?.status === 'good' ? '🛡️' : (item.asInfo?.status === 'warn' ? '👀' : '🚨');

    // 6. 구매버튼 및 방어 멘트
    const partnerCode = "AF9932454";
    const searchKeyword = `${item.name} 유모차`;
    
    const coupangSearchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}&lptag=${partnerCode}`;
    const naverSearchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(searchKeyword)}`;

    let purchaseAreaHtml = `
        <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 8px;">
            <a href="${coupangSearchUrl}" target="_blank" style="display: flex; justify-content: center; align-items: center; width: 100%; background: #191F28; color: #FFF; border: 1px solid #000; box-shadow: 0 4px 14px rgba(0,0,0,0.1); font-size: 15px; padding: 18px 0; border-radius: 14px; font-weight: 900; text-decoration: none; transition: 0.2s;">
                🚀 쿠팡에서 로켓배송 최저가 찾기 〉
            </a>
            <a href="${naverSearchUrl}" target="_blank" style="display: flex; justify-content: center; align-items: center; width: 100%; background: #F2F5F8; color: #4E5968; border: 1px solid #E5E8EB; font-size: 14px; padding: 14px 0; border-radius: 14px; font-weight: 800; text-decoration: none; transition: 0.2s;">
                🔍 네이버 쇼핑에서 공식몰 검색하기 〉
            </a>
        </div>
        <div class="coupang-safety-guard" style="font-size: 11.5px; color: #8B95A1; font-weight: 600; text-align: center; margin-top: 12px; line-height: 1.5; word-break: keep-all;">
            ※ 고가의 유모차는 쿠팡이 직접 매입하여 교환/환불 처리가 빠른<br>
            <b>[로켓배송]</b> 마크가 있는 상품 위주로 탐색하시길 권장합니다.<br>
            (상품의 A/S 및 교환/환불 규정은 해당 판매처의 정책을 따릅니다)
        </div>
    `;

    // ✨ 7. [수익 창출 패치] 유모차 찰떡 필수 악세사리 3대장 (디자인 수정본)
    const accFanUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent('유모차 선풍기')}&lptag=${partnerCode}`;
    const accBagUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent('유모차 정리함 이너백')}&lptag=${partnerCode}`;
    const accHookUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent('유모차 가방걸이 고리')}&lptag=${partnerCode}`;

    const accessoryHtml = `
        <div style="background: #F9FAFB; padding: 18px; border-radius: 16px; margin-top: 24px; border: 1px solid #E5E8EB;">
            <!-- 타이틀도 가운데 정렬 및 이모지 변경(🎁) -->
            <div style="font-size: 13.5px; font-weight: 900; color: #191F28; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>🎁</span> 유모차 뽑은 기념! 국민 육아템 3대장
            </div>
            
            <!-- 박스들 가운데 정렬 (justify-content: center; 추가) -->
            <div style="display: flex; justify-content: center; gap: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 8px;">
                <!-- 1. 선풍기 -->
                <a href="${accFanUrl}" target="_blank" style="flex-shrink: 0; width: 105px; background: #FFF; border: 1px solid #E5E8EB; border-radius: 12px; padding: 12px 8px; text-align: center; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s;">
                    <div style="font-size: 24px; margin-bottom: 6px;">❄️</div>
                    <div style="font-size: 12px; font-weight: 800; color: #333D4B;">유모차 선풍기</div>
                    <div style="font-size: 10.5px; font-weight: 600; color: #3182F6; margin-top: 4px;">로켓배송 〉</div>
                </a>
                <!-- 2. 정리함 -->
                <a href="${accBagUrl}" target="_blank" style="flex-shrink: 0; width: 105px; background: #FFF; border: 1px solid #E5E8EB; border-radius: 12px; padding: 12px 8px; text-align: center; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s;">
                    <div style="font-size: 24px; margin-bottom: 6px;">🧺</div>
                    <div style="font-size: 12px; font-weight: 800; color: #333D4B;">유모차 정리함</div>
                    <div style="font-size: 10.5px; font-weight: 600; color: #3182F6; margin-top: 4px;">로켓배송 〉</div>
                </a>
                <!-- 3. 고리 -->
                <a href="${accHookUrl}" target="_blank" style="flex-shrink: 0; width: 105px; background: #FFF; border: 1px solid #E5E8EB; border-radius: 12px; padding: 12px 8px; text-align: center; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s;">
                    <div style="font-size: 24px; margin-bottom: 6px;">🔗</div>
                    <div style="font-size: 12px; font-weight: 800; color: #333D4B;">가방걸이 고리</div>
                    <div style="font-size: 10.5px; font-weight: 600; color: #3182F6; margin-top: 4px;">로켓배송 〉</div>
                </a>
            </div>
        </div>
    `;

    const crossSellHtml = `<a href="../carseat/index.html" style="display:block; width:100%; background:#FFFBEB; border:1px solid #FDE68A; color:#B45309; padding:16px; border-radius:14px; font-weight:800; font-size:13.5px; text-align:center; text-decoration:none; transition:0.2s; margin-top:16px;">🚘 이 유모차와 어울리는 [안전 카시트] 알아보기 ➔</a>`;

    // 8. 최종 렌더링
    return `
    <div class="stroller-card" id="card-${cId}">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
                <div style="margin-bottom: 16px;">
                    <span style="background:#F2F5F8; color:#4E5968; font-size:12px; font-weight:800; padding:6px 12px; border-radius:8px;">${item.type}</span>
                </div>
                <div style="font-size:22px; font-weight:900; letter-spacing:-0.5px; color:#191F28; word-break:keep-all; line-height:1.3;">
                    ${item.name}
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;">
                <button id="fav-btn-${itemId}" onclick="toggleFavorite('${itemId}')" style="background:${heartColor}; color:${heartText}; border:1px solid ${heartBorder}; padding:8px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; transition:0.2s; white-space:nowrap;">
                    ${heartIcon}
                </button>
            </div>
        </div>

        ${taxHtml}
        ${tabsHtml}
        
        <div style="min-height: 250px;">
            <!-- 📊 기본스펙 탭 -->
            <div id="content-${cId}-spec" class="tab-content" style="display:block;">
                <div class="spec-list">
                    <div class="spec-row"><span class="spec-label">👶 2인 확장성</span><span class="spec-val" style="color:#3182F6;">${item.expand}</span></div>
                    <div class="spec-row"><span class="spec-label">본체 실측 무게</span><div style="text-align:right; width:60%;"><div class="spec-val" style="color:${weightColor};">${item.specs.weight}kg</div><div class="meter-container"><div class="meter-fill" data-width="${weightPercent}%" style="width:0%; background:${weightColor};"></div></div></div></div>
                    <div class="spec-row"><span class="spec-label">폴딩 메커니즘</span><span class="spec-val">${item.specs.folding}</span></div>
                    <div class="spec-row"><span class="spec-label">정규 기내반입</span><span style="${cabinStyle} padding:6px 10px; border-radius:8px; font-size:12px; font-weight:800;">${item.specs.cabin}</span></div>
                    ${gateHtml}
                    ${visualGraphHtml}
                </div>
            </div>
            
            <!-- 🚨 실전팩트 탭 -->
            <div id="content-${cId}-fact" class="tab-content" style="display:none;">
                <div class="fact-list">
                    <div class="fact-item"><div class="fact-icon">🛣️</div><div class="fact-info"><div class="fact-title">보도블럭 주행 지수</div><div class="fact-desc">${item.road}</div></div></div>
                    <div class="fact-item"><div class="fact-icon">🧼</div><div class="fact-info"><div class="fact-title">분리 세척 난이도</div><div class="fact-desc">${item.wash}</div></div></div>
                    <div class="fact-item"><div class="fact-icon">✈️</div><div class="fact-info"><div class="fact-title">인프라 피팅 (항공/카페)</div><div class="fact-desc">${item.flight}</div></div></div>
                    <div class="fact-item"><div class="fact-icon">🦴</div><div class="fact-info"><div class="fact-title">양육자 관절 타격 지수</div><div class="fact-desc">${item.joint}</div></div></div>
                    <div class="fact-item ${asClass}"><div class="fact-icon">${asIcon}</div><div class="fact-info"><div class="fact-title">${asTitle}</div><div class="fact-desc">${item.asInfo?.text || ''}</div></div></div>
                </div>
                
                <div class="insight-box" style="margin-top: 16px;">
                    <div class="title">💡 단점 & 아쉬운 점 팩트체크</div>
                    <div class="text">${item.flaw}</div>
                </div>
            </div>
            
            <!-- 🧬 AI리포트 탭 -->
            <div id="content-${cId}-sim" class="tab-content" style="display:none;">
                ${aiReportHtml}
                ${ktxAlertHtml}
                <div class="adapter-container">
                    <div class="adapter-title">🔩 카시트 트래블 호환 부품</div>
                    <div class="adapter-list">
                        ${renderAdapterCard('싸이벡스/뉴나 규격', item.adapter?.maxi)}
                        ${renderAdapterCard('스토케 비세이프 규격', item.adapter?.stokke)}
                    </div>
                </div>
            </div>
        </div>

        ${purchaseAreaHtml}
        ${accessoryHtml}
        ${crossSellHtml}
    </div>
    `;
}

// 🧠 깐깐한 감점(Penalty) AI 리포팅 엔진
function renderList(isUserAction = false) {
    const topArea = document.getElementById('result-top-area');
    const otherArea = document.getElementById('result-other-area');
    const topTitle = document.getElementById('result-top-title');
    const showMoreBtn = document.getElementById('show-more-btn');
    if (!topArea) return;

    const env = document.getElementById('mat-env').value;
    const car = document.getElementById('mat-car').value;
    const baby = document.getElementById('mat-baby').value;
    const parent = document.getElementById('mat-parent').value;
    const budget = document.getElementById('mat-budget').value;
    const isMatrixActive = (env !== 'all' || car !== 'all' || baby !== 'all' || parent !== 'all' || budget !== 'all');

    if (isUserAction) {
        const urlParams = new URLSearchParams(window.location.search);
        if(env !== 'all') urlParams.set('env', env); else urlParams.delete('env');
        if(car !== 'all') urlParams.set('car', car); else urlParams.delete('car');
        if(baby !== 'all') urlParams.set('baby', baby); else urlParams.delete('baby');
        if(parent !== 'all') urlParams.set('parent', parent); else urlParams.delete('parent');
        if(budget !== 'all') urlParams.set('budget', budget); else urlParams.delete('budget');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
    }

    // 💡 강력한 감점 알고리즘 적용
    let processedData = strollerData.map((item, index) => {
        if (!isMatrixActive) return { ...item, originalIndex: index, matchRate: null, matchReasons: [] };

        let score = 100;
        let reasons = [];

       // 1. 💰 절대 조건: 예산 (자비 없는 칼각 컷팅! - 숨겨진 추가비용까지 합산해서 계산)
        const realTotalPrice = item.price + (item.hiddenTax?.cost || 0);
        
        if (budget === 'under40' && realTotalPrice > 400000) {
            score -= 100; reasons.push(`실결제 예산 초과 (총 ${(realTotalPrice/10000).toFixed(0)}만 원)`);
        } else if (budget === 'under100' && realTotalPrice > 1000000) {
            score -= 100; reasons.push(`실결제 예산 초과 (총 ${(realTotalPrice/10000).toFixed(0)}만 원)`);
        }

        // 2. 🏡 환경: 계단 없는 빌라면 무게가 깡패
        if (env === 'stairs' && item.specs.weight > 8.5) {
            score -= 40; reasons.push(`계단 운반에 치명적인 무게 (${item.specs.weight}kg)`);
        } else if (env === 'mall' && item.width >= 60) {
            score -= 15; reasons.push(`실내 주행 시 좁은 길 불편 (너비 ${item.width}cm)`);
        }

        // 3. 🚗 차/비행기 물리적 한계
        if (car === 'flight') {
            if (item.specs.cabin.includes('❌')) { 
                score -= 50; reasons.push('기내 반입 불가 (무조건 화물 위탁)'); 
            } else if (item.specs.cabin.includes('⚠️')) { 
                score -= 15; reasons.push('항공사(LCC) 규정에 따라 기내 반입 거절 위험'); 
            }
        } else if (car !== 'all' && typeof carDB !== 'undefined' && carDB[car]) {
            const cd = carDB[car];
            const dims = [...item.foldedDims].sort((a, b) => a - b);
            
            // 정밀 테트리스 검사
            if (dims[0] > cd.limitDepth) {
                score -= 50; reasons.push(`${cd.name} 트렁크에 안 들어감 (뒷좌석 폴딩 필수)`);
            } else if (dims[1] > cd.limitHeight) {
                score -= 20; reasons.push(`${cd.name} 트렁크 입구에 걸림 (비틀어 넣어야 함)`);
            } else if (getVolume(item.foldedDims) / cd.vol > 0.6) {
                score -= 10; reasons.push(`트렁크의 60% 이상 차지 (짐 실을 공간 부족)`);
            }
        }

        // 4. 👶 아기 성장 / 뼈대
        if (baby === 'newborn' && (item.type === '휴대용' || item.type === '트라이크')) {
            score -= 30; reasons.push('디럭스/절충형에 비해 신생아 머리 흔들림 위험 노출');
        } else if (baby === 'giant' && item.backrest < 50) {
            score -= 15; reasons.push('우량아에게는 등받이나 시트가 좁게 느껴질 수 있음');
        } else if (baby === 'twins' && !item.expand.includes('⭕') && item.type !== '쌍둥이' && item.type !== '웨건') {
            score -= 60; reasons.push('쌍둥이/연년생 동반 탑승 절대 불가');
        }

        // 5. 🦴 부모 관절
        if (parent === 'joint' && item.specs.weight >= 9.0) {
            score -= 30; reasons.push(`약해진 손목에 무리가 가는 무게 (${item.specs.weight}kg)`);
        }

        // 결과 합산
        if (score === 100) reasons.push('선택하신 모든 라이프스타일 조건에 완벽히 부합합니다!');
        if (score < 0) score = 0; // 최소 0점 방어

        return { ...item, originalIndex: index, matchRate: score, matchReasons: reasons };
    });

    const activeFilters = Array.from(document.querySelectorAll('.stroller-filt-btn.active')).map(btn => btn.getAttribute('data-filter'));
    if (activeFilters.length > 0) {
        processedData = processedData.filter(item => {
            const typeFilters = activeFilters.filter(f => f.startsWith('type-'));
            if (typeFilters.length > 0) {
                const matchesType = typeFilters.some(f => {
                    if (f === 'type-디럭스') return item.type === '디럭스';
                    if (f === 'type-절충형') return item.type === '절충형';
                    if (f === 'type-휴대용') return item.type === '휴대용';
                    if (f === 'type-쌍둥이') return item.type === '쌍둥이' || item.type === '웨건';
                    if (f === 'type-트라이크') return item.type === '트라이크';
                    return false;
                });
                if (!matchesType) return false;
            }
            if (activeFilters.includes('spec-autofold') && !item.specs.folding.includes('오토')) return false;
            if (activeFilters.includes('spec-cabin') && !item.specs.cabin.includes('⭕')) return false;
            if (activeFilters.includes('spec-light') && item.specs.weight > 6.5) return false;
            if (activeFilters.includes('spec-heavy') && item.specs.weight < 10) return false;
            if (activeFilters.includes('price-under50') && item.price > 500000) return false;
            if (activeFilters.includes('price-over100') && item.price < 1000000) return false;
            return true;
        });
    }

    if (isMatrixActive) processedData.sort((a, b) => b.matchRate - a.matchRate);

    if(processedData.length === 0) { 
        topArea.innerHTML = `
            <div class="premium-empty-state" style="justify-content:center; padding: 40px;">
                <div class="empty-text" style="text-align:center; margin-bottom: 20px;">
                    <b>조건에 맞는 모델이 없습니다.</b>
                    <span>필터나 선택 사항을 조금 완화해 보세요.</span>
                </div>
                <button onclick="resetAll()" style="padding: 12px 24px; background: #3182F6; color: #FFF; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);">
                    🔄 필터 및 조건 초기화하기
                </button>
            </div>`; 
        otherArea.innerHTML = ''; topTitle.style.display = 'none'; showMoreBtn.style.display = 'none'; return; 
    }

    if (isMatrixActive && processedData.length > 3) {
        topTitle.style.display = 'flex'; showMoreBtn.style.display = 'block'; showMoreBtn.innerText = `나머지 ${processedData.length - 3}개 분석 결과 보기 ▾`; otherArea.style.display = 'none';
        topArea.innerHTML = processedData.slice(0, 3).map(generateCardHtml).join('');
        otherArea.innerHTML = processedData.slice(3).map(generateCardHtml).join('');
    } else {
        topTitle.style.display = 'none'; showMoreBtn.style.display = 'none'; otherArea.innerHTML = '';
        topArea.innerHTML = processedData.map(generateCardHtml).join('');
    }

    setTimeout(() => { document.querySelectorAll('.meter-fill, .v-bar-fill').forEach(el => { const height = el.getAttribute('data-height'); if(height) el.style.height = height; const width = el.getAttribute('data-width'); if(width) el.style.width = width; }); }, 50);
}

// 🛠️ 수정된 필터 버튼 클릭 이벤트 (스크롤 모션 추가)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('stroller-filt-btn')) { 
        const btn = e.target; 
        btn.classList.toggle('active'); 
        renderList(); 
       
    }
});

function scrollToResults() {
    const titleEl = document.getElementById('result-top-title');
    if (titleEl && titleEl.style.display !== 'none') {
        const y = titleEl.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
        const filterEl = document.querySelector('.filter-section');
        if (filterEl) {
            const y = filterEl.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }
}

function resetAll() {
    document.getElementById('mat-env').value = 'all';
    document.getElementById('mat-car').value = 'all';
    document.getElementById('mat-baby').value = 'all';
    document.getElementById('mat-parent').value = 'all';
    document.getElementById('mat-budget').value = 'all';

    document.querySelectorAll('.stroller-filt-btn').forEach(btn => btn.classList.remove('active'));
    window.history.replaceState({}, '', window.location.pathname);

    if(!isFavViewMode) renderList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    const upBtn = document.getElementById('scrollTopBtn');
    if (upBtn) {
        if (window.scrollY > 400) {
            upBtn.style.display = 'flex';
        } else {
            upBtn.style.display = 'none';
        }
    }
});

// 🚀 페이지 로드 시: 동기화(applyGlobalBabyProfile) 실행!
window.onload = () => {
    const sel1 = document.getElementById('vs-1'), sel2 = document.getElementById('vs-2');
    let opt = '<option value="">선택</option>';
    if (typeof strollerData !== 'undefined') { strollerData.forEach((s, i) => { opt += `<option value="${i}">${s.name}</option>`; }); }
    if(sel1) sel1.innerHTML = opt; if(sel2) sel2.innerHTML = opt;

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('env')) document.getElementById('mat-env').value = urlParams.get('env');
    if(urlParams.has('car')) document.getElementById('mat-car').value = urlParams.get('car');
    if(urlParams.has('baby')) document.getElementById('mat-baby').value = urlParams.get('baby');
    if(urlParams.has('parent')) document.getElementById('mat-parent').value = urlParams.get('parent');
    if(urlParams.has('budget')) document.getElementById('mat-budget').value = urlParams.get('budget');

    applyGlobalBabyProfile(); 
    renderList(false);
};

function trackClick(itemName, actionType) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'event': 'btn_click', 'click_type': actionType, 'item_name': itemName });
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('buy-btn')) {
        const card = e.target.closest('.stroller-card');
        if (card) {
            const itemName = card.querySelector('div[style*="font-size:22px"]').innerText;
            trackClick(itemName, 'PURCHASE_CLICK');
        }
    }
});

function showComingSoon(category) {
    alert(`💡 ${category} AI 분석 엔진은 현재 딥러닝 학습 중입니다!\n(다음 업데이트를 기대해 주세요)`);
}

// 🚀 카카오 SDK 초기화 (안전 보호막 장착)
try {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b');
    }
} catch (error) {
    console.warn("카카오 SDK 초기화 지연", error);
}

function shareResult() {
    const shareUrl = window.location.href; 
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '육아메이트 AI 5D 유모차 매칭 🛒',
                description: '우리 가족 라이프스타일과 트렁크 크기에 딱 맞는 유모차를 AI로 찾아보세요!',
                imageUrl: 'https://happy-baby0303.github.io/baby-master/stroller/og-image.png',
                link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
            buttons: [
                { title: '🔍 AI 매칭 결과 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }
            ],
        });
    } else {
        // 카카오톡이 안 될 때는 그냥 주소를 복사해 줌!
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('결과 페이지 주소가 복사되었습니다! 남편에게 붙여넣기 해주세요 🤍');
        }).catch(err => {
            prompt("아래 주소를 복사해서 남편에게 보내주세요!", shareUrl);
        });
    }
}