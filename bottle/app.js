// ==========================================
// 🍼 육아메이트 젖병 AI 큐레이터 엔진 (bottle/app.js)
// (네이버+쿠팡 위장 전술 및 카톡 앱 유도 탑재 완결판)
// ==========================================

let isFavViewMode = false; 

// 🧼 sterilization 문구를 읽어서 UV 소독 안전도를 자동 판정
function getUvSafety(item) {
    const t = item.sterilization || '';
    if (t.includes('금지') || t.includes('비권장')) return 'no';
    if (t.includes('주의') || t.includes('변색') || t.includes('끈적')) return 'caution';
    if (t.includes('UV')) return 'yes';
    return 'unknown';   // UV 언급 자체가 없는 제품
}

function applyGlobalBabyProfile() {
    const birthStr = localStorage.getItem('tosil_startDate');
    if(!birthStr) return; 
    
    const [y, m, d] = birthStr.split('-').map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months--;   // 아직 생일 안 지났으면 -1
    if (months < 0) months = 0;

    let ageFilter = 'all';
    if (months <= 3) { ageFilter = 'newborn'; }
    else if (months <= 6) { ageFilter = 'infant'; }
    else { ageFilter = 'toddler'; }

    const ageSelect = document.getElementById('filter-age');
    if(ageSelect) ageSelect.value = ageFilter;

    const banner = document.getElementById('auto-sync-banner');
    if(banner) banner.style.display = 'none'; 

    const badge = document.getElementById('dynamic-age-badge');
    if(badge) badge.innerText = `생후 ${months}개월 맞춤`;
}

function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favBottles')) || [];
    let isFav = false; 

    if(favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id); 
        isFav = false;
    } else {
        favorites.push(id); 
        isFav = true;
    }
    localStorage.setItem('favBottles', JSON.stringify(favorites));
    
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
        btn.innerHTML = '❤️ 내가 찜한 젖병 모아보기';
        btn.style.background = '#FFF2F2';
        btn.style.color = '#E32636';
        btn.style.borderColor = '#FCA5A5';
        runBottleEngine(); 
    }
}

function renderFavorites() {
    const resultArea = document.getElementById('bottle-result-area');
    const favorites = JSON.parse(localStorage.getItem('favBottles')) || [];

    if (favorites.length === 0) {
        resultArea.innerHTML = `<div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px; border:1px dashed #D1D5DB;"><div class="empty-icon" style="font-size:40px; margin-bottom:12px;">💔</div><div class="empty-text"><b>아직 찜한 젖병이 없어요!</b><br><span style="font-size:13px; color:#8B95A1;">마음에 드는 젖병에 하트(❤️)를 눌러보세요.</span></div></div>`;
        return;
    }

    let favItems = bottleData.filter(item => favorites.includes(item.id));
    
    // 🚨 [신규 패치] 찜한 목록 상단에 '비교 요약 표' 제공
    let summaryTable = `
        <div style="background: #F9FAFB; padding: 16px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #E5E8EB; overflow-x: auto;">
            <div style="font-size: 13px; font-weight: 800; color: #4E5968; margin-bottom: 10px;">📊 찜한 젖병 한눈에 비교하기</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center; min-width: 300px;">
                <thead>
                    <tr style="background: #F2F5F8; color: #8B95A1;">
                        <th style="padding: 8px; border-radius: 8px 0 0 8px;">브랜드</th>
                        <th style="padding: 8px;">소재</th>
                        <th style="padding: 8px;">가격대</th>
                        <th style="padding: 8px; border-radius: 0 8px 8px 0;">배앓이</th>
                    </tr>
                </thead>
                <tbody>
                    ${favItems.map(i => `
                        <tr style="border-bottom: 1px solid #E5E8EB;">
                            <td style="padding: 8px; font-weight: 700;">${i.brand}</td>
                            <td style="padding: 8px; color: #3182F6;">${i.material.toUpperCase()}</td>
                            <td style="padding: 8px;">${i.price === 'low' ? '💸가성비' : (i.price === 'mid' ? '보통' : '고급')}</td>
                            <td style="padding: 8px;">${i.antiColic === 'super' ? '🔥특화' : '일반'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    let htmlOutput = `<div style="font-size: 16px; font-weight: 900; color: #E32636; margin-bottom: 16px;">❤️ 내 찜 보관함 (${favItems.length}개)</div>`;
    htmlOutput += summaryTable;
    // 찜한 화면에서는 쿠팡 링크 무조건 보여주기 (rank = 1 부여)
    htmlOutput += favItems.map(item => generateCardHTML({ ...item, matchRate: null }, 1)).join('');
    
    // 💰 [광고 배너 예시 자리] 나중에 협찬받으면 여기에 삽입!
    // htmlOutput += `<div class="sponsor-banner">...</div>`;

    resultArea.innerHTML = htmlOutput;
}

// 🚨 [패치 완료] rank 파라미터를 추가하여 상위 3등 이내만 쿠팡 링크 노출!
function generateCardHTML(item, rank) {
    const favorites = JSON.parse(localStorage.getItem('favBottles')) || [];
    const isFav = favorites.includes(item.id);
    const heartIcon = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
    const heartColor = isFav ? '#FFF2F2' : '#F2F4F6';
    const heartText = isFav ? '#E32636' : '#4E5968';
    const heartBorder = isFav ? '#FCA5A5' : '#E5E8EB';

    let cardBorderColor = '#D1D5DB';
    let aiReportHtml = '';

    if (item.matchRate !== null && !isFavViewMode && item.matchRate !== undefined) {
        let titleColor, bgColor, borderColor, titleText;
        if (item.matchRate === 100) {
            titleColor = '#3182F6'; bgColor = '#F0F7FF'; borderColor = '#3182F6';
            cardBorderColor = '#3182F6'; titleText = '🟢 최적합 (Premium Match)';
        } else if (item.matchRate >= 80) {
            titleColor = '#059669'; bgColor = '#ECFDF5'; borderColor = '#10B981';
            cardBorderColor = '#10B981'; titleText = '🍀 우수 (Good Match)';
        } else if (item.matchRate >= 50) {
            titleColor = '#B78103'; bgColor = '#FFF9E6'; borderColor = '#F59E0B';
            cardBorderColor = '#F59E0B'; titleText = '⚠️ 타협 필요 (Conditional)';
        } else {
            titleColor = '#D32F2F'; bgColor = '#FFF0F1'; borderColor = '#F04452';
            cardBorderColor = '#F04452'; titleText = '❌ 비추천 (Mismatch)';
        }

        let reasonLi = item.matchRate === 100 
            ? `<li style="margin-bottom:4px;"> ${item.matchReasons[0]}</li>`
            : item.matchReasons.map(r => `<li style="margin-bottom:4px; color:#4E5968;">🚨 <b>${r}</b></li>`).join('');

        aiReportHtml = `
            <div style="background:${bgColor}; border:1px solid ${borderColor}; padding:14px; border-radius:8px; margin-bottom:16px;">
                <h4 style="color:${titleColor}; margin:0 0 6px 0; font-size:13px;">${titleText}</h4>
                <ul style="margin:0; padding-left:20px; font-size:12.5px; color:${titleColor}; line-height:1.5;">${reasonLi}</ul>
            </div>`;
    }

    if (isFavViewMode) cardBorderColor = '#E32636';

    const searchKeyword = `${item.brand} ${item.name}`; 
    const partnerCode = "AF9932454";
    let myCoupangLink = `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}&lptag=${partnerCode}`;
   
    let purchaseBtn = '';
    
    // 🚨 [신뢰도 상승 패치] 3등 안에 들거나 찜한 목록에서만 쿠팡 링크 노출!
    if (rank <= 3 || isFavViewMode) {
        purchaseBtn = `
            <div style="margin-top: 24px;">
                <a href="${myCoupangLink}" target="_blank" class="buy-btn" style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 0; background: #191F28; color: #FFF; border: 1px solid #000; box-shadow: 0 4px 14px rgba(0,0,0,0.1); font-size: 15px; padding: 18px 0; border-radius: 14px; font-weight: 900; text-decoration: none; transition: 0.2s;">
                    🚀 쿠팡 최저가 검색하기 〉
                </a>
            </div>
            
            <div class="coupang-safety-guard" style="font-size: 11px; color: #8B95A1; font-weight: 600; text-align: center; margin-top: 12px; line-height: 1.5; word-break: keep-all;">
                ※ 안전하고 빠른 교환/환불을 위해 가급적 <b>[로켓배송]</b> 마크가 있는 상품을 선택하세요.
            </div>
        `;
    } else {
        // 4등 이하는 정보성 버튼만 노출 (네이버 검색)
        let naverSearchLink = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(searchKeyword)}`;
        purchaseBtn = `
            <div style="margin-top: 24px;">
                <a href="${naverSearchLink}" target="_blank" class="buy-btn" style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 0; background: #F2F5F8; color: #4E5968; border: 1px solid #E5E8EB; font-size: 14px; padding: 14px 0; border-radius: 14px; font-weight: 800; text-decoration: none; transition: 0.2s;">
                    🔍 네이버 스펙 검색하기 〉
                </a>
            </div>
        `;
    }

    return `
        <div class="stroller-card" style="border-top: 4px solid ${cardBorderColor}; margin-bottom: 24px; padding: 28px 24px; background:#FFF; border-radius:24px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #F2F5F8;">
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="margin-bottom: 16px;">
                        <span style="background:#F2F5F8; color:#4E5968; font-size:12.5px; font-weight:800; padding:6px 12px; border-radius:8px;">${item.brand}</span>
                    </div>
                    <div style="font-size:22px; font-weight:900; letter-spacing:-0.5px; color:#191F28; word-break:keep-all; line-height:1.4;">
                        ${item.name}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;">
                    <button id="fav-btn-${item.id}" onclick="toggleFavorite('${item.id}')" style="background:${heartColor}; color:${heartText}; border:1px solid ${heartBorder}; padding:8px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; transition:0.2s; white-space:nowrap;">
                        ${heartIcon}
                    </button>
                </div>
            </div>
            
            ${aiReportHtml}

            <!-- 큐레이션 포인트 -->
            <div class="insight-box">
                <div class="title">💡 큐레이션 포인트</div>
                <div class="text">${item.desc}</div>
            </div>
            
            <!-- 세부 스펙 스탯 -->
            <div style="background: #F9FAFB; padding: 16px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 16px;">
                <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #4E5968; line-height: 1.6; font-weight: 600;">
                    <li style="margin-bottom:6px;"><b>거부 극복:</b> ${item.rejection === 'super' ? '🔥 젖꼭지 거부 심한 아이 추천' : '⭐ 무난하게 잘 무는 젖꼭지'}</li>
                    <li style="margin-bottom:6px;"><b>젖꼭지 호환:</b> ${item.compatible === 'yes' ? '🟢 더블하트/모유실감 호환 가능' : '❌ 전용 젖꼭지 권장'}</li>
                    <li><b>소독 세척:</b> ${item.sterilization}</li>
                </ul>
            </div>

            ${purchaseBtn}

            <button onclick="shareToHusband('${item.id}', '${item.brand}', '${item.name}')" style="display:block; width:100%; background:#F9FAFB; border:1px solid #E5E8EB; color:#4E5968; padding:16px; border-radius:14px; font-weight:800; font-size:14px; text-align:center; transition:0.2s; margin-top:16px; cursor:pointer;">
                💬 남편에게 이 [AI 분석 리포트] 공유하기
            </button>
            <a href="../food/index.html" style="display:block; width:100%; background:#F9FAFB; border:1px solid #E5E8EB; color:#4E5968; padding:16px; border-radius:14px; font-weight:800; font-size:14px; text-align:center; text-decoration:none; transition:0.2s; margin-top:12px;">
                🍲 이 젖병 떼면 먹일 [이유식 식단] 미리보기 ➔
            </a>
        </div>
    `;
}

// ----------------------------------------------------
// 🚀 5. 강력한 AI 감점 엔진
// ----------------------------------------------------
function runBottleEngine() {
    if (isFavViewMode) return; 

    const age = document.getElementById('filter-age')?.value || 'all';
    const rejection = document.getElementById('filter-rejection')?.value || 'all';
    const material = document.getElementById('filter-material')?.value || 'all';
    const antiColic = document.getElementById('filter-anticolic')?.value || 'all';
    const compatible = document.getElementById('filter-compatible')?.value || 'all';
    const price = document.getElementById('filter-price')?.value || 'all';
    const sterilization = document.getElementById('filter-sterilization')?.value || 'all';
    
    const resultArea = document.getElementById('bottle-result-area');
    const isFilterActive = (age !== 'all' || rejection !== 'all' || material !== 'all' || antiColic !== 'all' || compatible !== 'all' || price !== 'all' || sterilization !== 'all');

    let processedData = bottleData.map(item => {
        if (!isFilterActive) return { ...item, matchRate: null, matchReasons: [] };

        let score = 100;
        let reasons = [];

        if (age !== 'all' && (!item.age || !item.age.includes(age))) { 
            score -= 30; reasons.push('선택하신 아기 월령에 부적합합니다.'); 
        }
        if (rejection === 'super' && item.rejection !== 'super') { 
            score -= 40; reasons.push('젖꼭지 거부가 심한 아기에게는 추천하지 않습니다.'); 
        }
        if (material !== 'all' && item.material !== material) { 
            score -= 20; reasons.push('선호하시는 젖병 소재와 일치하지 않습니다.'); 
        }
        if (antiColic === 'super' && item.antiColic !== 'super') { 
            score -= 40; reasons.push('영아산통(배앓이) 완벽 차단 기능이 부족합니다.'); 
        } else if (antiColic === 'yes' && item.antiColic === 'normal') {
            score -= 20; reasons.push('일반적인 젖병으로 배앓이 특화 구조가 아닙니다.'); 
        }
        if (compatible === 'yes' && item.compatible !== 'yes') { 
            score -= 30; reasons.push('더블하트/모유실감 젖꼭지와 호환되지 않습니다.'); 
        }
        if (sterilization === 'uv') {
            const uv = getUvSafety(item);
            if (uv === 'no') {
                score -= 30; reasons.push('제조사가 UV 소독을 금지하거나 권장하지 않는 제품입니다.');
            } else if (uv === 'caution') {
                score -= 15; reasons.push('UV 소독기 장기 사용 시 변색이나 끈적임이 생길 수 있습니다.');
            } else if (uv === 'unknown') {
                score -= 5; reasons.push('UV 소독 가능 여부가 제조사 스펙에 명시되어 있지 않습니다.');
            }
        }
        if (sterilization === 'easy' && item.wash !== 'easy') { 
            score -= 15; reasons.push('입구가 좁거나 부품이 많아 설거지가 번거로운 편입니다.'); 
        }
        if (price !== 'all' && item.price !== price) { 
            score -= 20; reasons.push('선택하신 가격대와 일치하지 않습니다.'); 
        }

        if(score < 0) score = 0;
        if(score === 100) reasons.push('✨ 선택하신 모든 조건에 완벽하게 부합합니다!');

        return { ...item, matchRate: score, matchReasons: reasons };
    });

    if (isFilterActive) processedData.sort((a, b) => b.matchRate - a.matchRate);

    if (processedData.length === 0 || (isFilterActive && processedData[0].matchRate < 40)) {
        resultArea.innerHTML = `
            <div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px; border:1px dashed #D1D5DB; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div class="empty-icon" style="font-size:40px; margin-bottom:12px;">🍼</div>
                <div class="empty-text" style="margin-bottom: 20px;">
                    <b style="font-size: 15px; color: #191F28;">아기에게 딱 맞는 걸 찾다 보니 조건이 까다로워졌네요!</b><br>
<span style="font-size:13px; color:#8B95A1; line-height: 1.5; display: inline-block; margin-top: 4px;">완벽한 젖병은 없지만, 가장 가까운 대안을 찾아드릴게요.<br>조건을 1~2개만 풀어서 다시 검색해 볼까요? 🤍</span>
                </div>
                <button onclick="resetBottleFilters()" style="padding: 14px 24px; background: #191F28; color: #FFF; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: 0.2s;">
                    🔄 필터 초기화하기
                </button>
            </div>`;
        return;
    }

    // 🍼 1등 점수가 낮으면 "완벽한 매칭은 없지만 차선책은 있어요"로 안내
    const bestScore = isFilterActive ? processedData[0].matchRate : 100;
    let htmlOutput = '';

    if (isFilterActive && bestScore < 70) {
        htmlOutput = `
            <div style="background:#FFF9E6; border:1px solid #FDE68A; border-radius:14px; padding:16px; margin-bottom:16px;">
                <div style="font-size:14px; font-weight:900; color:#B78103; margin-bottom:4px;">🤍 조건을 모두 만족하는 젖병은 없었어요</div>
                <div style="font-size:13px; font-weight:600; color:#4E5968; line-height:1.5;">
                    대신 <b>가장 가까운 대안</b>을 순서대로 보여드릴게요. 조건을 1~2개만 풀면 더 좋은 결과가 나올 수 있어요!
                </div>
            </div>
            <div style="font-size: 16px; font-weight: 800; color: #191F28; margin-bottom: 16px;">✨ 가장 가까운 대안 TOP 3</div>`;
    } else {
        htmlOutput = `<div style="font-size: 16px; font-weight: 800; color: #191F28; margin-bottom: 16px;">✨ AI 맞춤 젖병 리포트</div>`;
    }
    
    let top3Results = processedData.slice(0, 3); 
    let otherResults = processedData.slice(3); 
    
    // 🚨 1~3등까지 랭크(rank) 정보 넘겨서 쿠팡 링크 달기!
    htmlOutput += top3Results.map((item, index) => generateCardHTML(item, index + 1)).join('');

    if (otherResults.length > 0) {
        htmlOutput += `
            <button id="bottle-show-more-btn" onclick="toggleBottleOthers()" style="display: block; width: 100%; padding: 16px; margin-top: 8px; margin-bottom: 24px; background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 14px; font-size: 14px; font-weight: 800; color: #4E5968; cursor: pointer; transition:0.2s;">
                나머지 ${otherResults.length}개 결과 보기 ▾
            </button>
            <div id="bottle-other-area" style="display:none; flex-direction: column;">
                ${otherResults.map((item, index) => generateCardHTML(item, index + 4)).join('')}
            </div>
        `;
    }
    resultArea.innerHTML = htmlOutput;
}

function toggleBottleOthers() {
    const otherArea = document.getElementById('bottle-other-area');
    const btn = document.getElementById('bottle-show-more-btn');
    if (otherArea.style.display === 'none') {
        otherArea.style.display = 'flex';
        btn.innerText = '나머지 결과 접기 ▴';
    } else {
        otherArea.style.display = 'none';
        btn.innerText = `나머지 결과 보기 ▾`;
        // 접을 때 살짝 위로 스크롤 올려주는 디테일
        document.getElementById('bottle-show-more-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function resetBottleFilters() {
    let isChanged = false;
    document.querySelectorAll('.matrix-panel select').forEach(select => {
        if (select.value !== 'all') { select.value = 'all'; isChanged = true; }
    });
    if (isChanged && !isFavViewMode) runBottleEngine();
}

if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b');
}

function shareToHusband(id, brand, name) {
    const appUrl = window.location.href; 
    
       if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        navigator.clipboard.writeText(appUrl)
            .then(() => alert('링크가 복사되었어요! 남편에게 붙여넣기 해주세요 🤍'))
            .catch(() => prompt("아래 주소를 복사해 주세요", appUrl));
        return;
    }

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `여보! 우리 아기 젖병 [${brand}] 제품이 좋대 🍼`,
            description: `AI가 분석한 배앓이 방지 리포트 확인해보고 이걸로 세트 쟁여놔줘! ❤️`,
            imageUrl: 'https://happy-baby0303.github.io/baby-master/stroller/og-image.png',
            link: { mobileWebUrl: appUrl, webUrl: appUrl },
        },
        buttons: [
            { title: '📊 AI 분석 리포트 확인하기', link: { mobileWebUrl: appUrl, webUrl: appUrl } }
        ],
    });
}

// ==========================================
// 💎 [니치 UX] 필터 조작 시 햅틱 & 시선 유도 스크롤 (완벽 방어)
// ==========================================
document.querySelectorAll('.matrix-panel select').forEach(select => {
    select.addEventListener('change', () => {
        runBottleEngine();
        
        if (navigator.vibrate) navigator.vibrate(10);
        
        // 🚨 필터 누르면 부드럽게 결과창 쪽으로 화면을 끌어올려줌 (시선 유도)
        const resultHeader = document.getElementById('bottle-result-area');
        if(resultArea && window.scrollY < 200) { // 화면 위에 있을 때만
             const yOffset = resultHeader.getBoundingClientRect().top + window.pageYOffset - 100; // 헤더 밑 여백 확보
             window.scrollTo({top: yOffset, behavior: 'smooth'});
        }
    });
});

window.onload = () => { 
    applyGlobalBabyProfile(); 
    runBottleEngine(); 
};