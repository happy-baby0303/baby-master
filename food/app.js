// ==========================================
// 🩺 배냇함 안심 이유식 AI 엔진 V3.0 (food/app.js)
// (메인 글로벌 연동 + 찜 보관함 + 크로스셀링 통합)
// ==========================================

let isFavViewMode = false;

// 🚀 1. 이유식 데이터 자동 동기화 (군더더기 삭제)
function applyGlobalBabyProfile() {
    const birthStr = localStorage.getItem('tosil_startDate');
    const babyName = localStorage.getItem('tosil_babyName') || '우리 아기';
    if(!birthStr) return;

    // 👇 교체된 완벽한 월령 계산 로직
    const [by, bm, bd] = birthStr.split('-').map(Number);
    const birthDate = new Date(by, bm - 1, bd);
    const today = new Date();

    let months = (today.getFullYear() - birthDate.getFullYear()) * 12
               + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) months--;
    if (months < 0) months = 0;

    // 👶 이유식 월령 단계 (로직은 그대로 유지)
    let ageFilter = '', ageText = '';
    if (months < 4) { ageFilter = 'early'; ageText = '이유식 준비기'; }
    else if (months <= 6) { ageFilter = 'early'; ageText = '이유식 초기'; }
    else if (months <= 9) { ageFilter = 'mid'; ageText = '이유식 중기'; }
    else if (months <= 11) { ageFilter = 'late'; ageText = '이유식 후기'; }
    else { ageFilter = 'done'; ageText = '이유식 완료기'; }

    const foodAge = document.getElementById('food-age');
    if(foodAge) foodAge.value = ageFilter;

    // ✂️ 1. 촌스러운 파란 배너 삭제 (다이어트!)
    const banner = document.getElementById('auto-sync-banner');
    if(banner) banner.style.display = 'none';

    // ✨ 2. 쿨한 뱃지에 '월령' + '이유식 단계'를 한 방에 쏴주기
    const badges = document.querySelectorAll('.dynamic-age-badge');
    badges.forEach(b => {
        b.innerText = `생후 ${months}개월 | ${ageText}`;
    });
}

// 🚀 [NEW 2] 찜하기 하트 토글 로직
function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favFoods')) || [];
    let isFav = false; 

    if(favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id); 
        isFav = false;
    } else {
        favorites.push(id); 
        isFav = true;
    }
    localStorage.setItem('favFoods', JSON.stringify(favorites));
    
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

// 🚀 [NEW 3] 찜 보관함 화면 전환
function toggleFavView() {
    isFavViewMode = !isFavViewMode;
    const btn = document.getElementById('btn-show-fav');
    
    // 보관함 모드일 때 매트릭스와 검색창 숨기기
    const matrixPanel = document.querySelector('.matrix-panel');
    const searchBox = document.querySelector('.search-box');

    if (isFavViewMode) {
        btn.innerHTML = '🔙 이유식 매칭 화면으로 돌아가기';
        btn.style.background = '#F2F4F6';
        btn.style.color = '#4E5968';
        btn.style.borderColor = '#D1D5DB';
        if(matrixPanel) matrixPanel.style.display = 'none';
        if(searchBox) searchBox.style.display = 'none';
        renderFavorites();
    } else {
        btn.innerHTML = '❤️ 내가 찜한 식단 모아보기';
        btn.style.background = '#FFF2F2';
        btn.style.color = '#E32636';
        btn.style.borderColor = '#FCA5A5';
        if(matrixPanel) matrixPanel.style.display = 'block';
        if(searchBox) searchBox.style.display = 'block';
        runFoodEngine(); 
    }
}

function renderFavorites() {
    const resultArea = document.getElementById('food-result-area');
    const favorites = JSON.parse(localStorage.getItem('favFoods')) || [];

    if (favorites.length === 0) {
        resultArea.innerHTML = `<div class="premium-empty-state"><div class="empty-icon">💔</div><div class="empty-text"><b>아직 찜한 식단이 없어요!</b><span>마음에 드는 레시피에 하트(❤️)를 눌러보세요.</span></div></div>`;
        return;
    }

    // 이유식은 데이터에 고유 id가 없을 수 있으므로 name을 고유 식별자로 사용합니다.
    let favItems = babyFoodData.filter(item => favorites.includes(item.name));
    
    let htmlOutput = `<div style="font-size: 16px; font-weight: 800; color: #E32636; margin-bottom: 16px;">❤️ 내 찜 보관함 (${favItems.length}개)</div>`;
    htmlOutput += favItems.map(item => generateCardHTML(item)).join('');
    resultArea.innerHTML = htmlOutput;
}


// 🚦 1. 식재료 신호등 판독기 + 쌍방향 영양학 팩트체크
function checkIngredient() {
    const query = document.getElementById('ingredient-search').value.trim().replace(/\s+/g, '');
    const resultArea = document.getElementById('traffic-light-result');

    if (!query) {
        resultArea.style.display = 'none';
        return;
    }

    // 신호등 DB 검색
    const found = ingredientDB.find(item => item.name.includes(query) || item.keywords.some(k => k.includes(query)));

    if (found) {
        resultArea.style.display = 'block';
        let color, icon, title, bg, border;
        
        if (found.status === 'red') { color = '#D32F2F'; bg = '#FFF0F1'; border = '#FECACA'; icon = '🚨'; title = '절대 금지'; }
        else if (found.status === 'yellow') { color = '#B45309'; bg = '#FEF3C7'; border = '#FDE68A'; icon = '⚠️'; title = '주의 필요'; }
        else { color = '#059669'; bg = '#ECFDF5'; border = '#A7F3D0'; icon = '🟢'; title = '안심 재료'; }

        // 기본 신호등 결과 UI
        let html = `
            <div style="background:${bg}; border:1px solid ${border}; padding:16px; border-radius:12px; margin-bottom:0;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <span style="font-size:20px;">${icon}</span>
                    <span style="font-weight:900; font-size:16px; color:${color};">${found.name} (${title})</span>
                </div>
                <div style="font-size:14px; color:#4E5968; line-height:1.5; font-weight:600;">${found.desc}</div>
            </div>
        `;

        // ✨ 핵심: 쌍방향(Reverse) 궁합 탐색 AI 로직 ✨
        let goodPairs = [];
        let badPairs = [];

        // 1. 본인이 메인인 경우 (정방향: 예 - '소고기' 검색 시)
        if (pairingDB[found.name]) {
            if (pairingDB[found.name].good) goodPairs.push(...pairingDB[found.name].good);
            if (pairingDB[found.name].bad) badPairs.push(...pairingDB[found.name].bad);
        }

        // 2. 남의 데이터에 포함된 경우 (역방향: 예 - '청경채' 검색 시 '소고기'를 찾아냄!)
        for (const [mainIng, data] of Object.entries(pairingDB)) {
            if (mainIng === found.name) continue; // 정방향에서 이미 찾은 건 패스

            if (data.good) {
                data.good.forEach(g => {
                    if (g.item.includes(found.name) && !goodPairs.some(p => p.item.includes(mainIng))) {
                        goodPairs.push({ item: mainIng, reason: g.reason });
                    }
                });
            }
            if (data.bad) {
                data.bad.forEach(b => {
                    if (b.item.includes(found.name) && !badPairs.some(p => p.item.includes(mainIng))) {
                        badPairs.push({ item: mainIng, reason: b.reason });
                    }
                });
            }
        }

        // 궁합 데이터가 하나라도 있으면 렌더링!
        if (goodPairs.length > 0 || badPairs.length > 0) {
            html += `<div style="margin-top: 16px; padding-top: 16px; border-top: 1.5px dashed #D1D5DB;">`;
            html += `<div style="font-size: 14.5px; font-weight: 900; color: #191F28; margin-bottom: 12px; display:flex; align-items:center; gap:6px;"><span>👩‍⚕️</span> 영양학 팩트체크</div>`;
            
            // 좋은 궁합 렌더링
            goodPairs.forEach(g => {
                html += `
                <div style="display:flex; align-items:flex-start; gap:8px; background:#F0FDF4; border:1px solid #BBF7D0; padding:12px; border-radius:10px; margin-bottom:8px;">
                    <span style="font-size:16px; margin-top:2px;">👍</span>
                    <div>
                        <div style="font-size:13.5px; font-weight:800; color:#166534; margin-bottom:4px;">찰떡궁합: ${g.item}</div>
                        <div style="font-size:13px; font-weight:600; color:#15803D; line-height:1.4;">${g.reason}</div>
                    </div>
                </div>`;
            });
            
            // 나쁜 궁합 렌더링
            badPairs.forEach(b => {
                html += `
                <div style="display:flex; align-items:flex-start; gap:8px; background:#FEF2F2; border:1px solid #FECACA; padding:12px; border-radius:10px; margin-bottom:8px;">
                    <span style="font-size:16px; margin-top:2px;">🙅‍♀️</span>
                    <div>
                        <div style="font-size:13.5px; font-weight:800; color:#991B1B; margin-bottom:4px;">주의궁합: ${b.item}</div>
                        <div style="font-size:13px; font-weight:600; color:#B91C1C; line-height:1.4;">${b.reason}</div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        resultArea.innerHTML = html;
    } else {
        resultArea.style.display = 'block';
        resultArea.innerHTML = `<div style="padding:16px; font-size:14px; color:#8B95A1; font-weight:600; text-align:center; background:#F8F9FA; border-radius:12px;">검색 결과가 없습니다.<br>다른 단어로 검색해보세요.</div>`;
    }
}

// 🌟 공통 카드 렌더링 함수 (대기업 프리미엄 템플릿 완벽 적용 + 녹색 띠 제거)
function generateCardHTML(item) {
    const itemId = item.name;
    const favorites = JSON.parse(localStorage.getItem('favFoods')) || [];
    const isFav = favorites.includes(itemId);
    const heartIcon = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
    const heartColor = isFav ? '#FFF2F2' : '#F2F4F6';
    const heartText = isFav ? '#E32636' : '#4E5968';
    const heartBorder = isFav ? '#FCA5A5' : '#E5E8EB';

    return `
        <div class="stroller-card" style="border-top: 4px solid ${isFavViewMode ? '#E32636' : 'transparent'}; margin-bottom: 24px; padding: 28px 24px; background:#FFF; border-radius:24px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #F2F5F8;">
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size:22px; font-weight:900; letter-spacing:-0.5px; color:#191F28; word-break:keep-all; line-height:1.4;">
                        🍲 ${item.name}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 10px;">
                    <button id="fav-btn-${itemId}" onclick="toggleFavorite('${itemId}')" style="background:${heartColor}; color:${heartText}; border:1px solid ${heartBorder}; padding:8px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; transition:0.2s; white-space:nowrap;">
                        ${heartIcon}
                    </button>
                </div>
            </div>
            
            <div style="font-size: 13.5px; color: #4E5968; margin-bottom: 20px; font-weight: 600; line-height: 1.5;">💡 ${item.desc}</div>
            
            <div style="background: #F9FAFB; padding: 16px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 16px;">
                <div style="font-size: 13.5px; color: #4E5968; line-height: 1.6; font-weight: 600;">
                    <span style="display:block; margin-bottom:6px;"><b>👨‍🍳 입자:</b> ${item.texture}</span>
                    <span style="color:#3182F6; display:block;"><b>🛒 필요 재료:</b> ${item.ingredients}</span>
                </div>
            </div>

            <!-- ✨ 까만색 묵직한 프리미엄 요리 시작 버튼 -->
            <button onclick="openCookingMode('${item.name}')" style="display:flex; justify-content:center; align-items:center; gap:8px; width:100%; background:#191F28; color:#FFFFFF; border:none; padding:18px 16px; border-radius:14px; font-weight:900; font-size:15px; cursor:pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.1); margin-bottom: 16px; transition: 0.2s;">
                👨‍🍳 스마트 요리 모드 시작 〉
            </button>
            
            <div class="recipe-box" style="background: #FFF; border: 1px solid #E5E8EB; padding: 16px; border-radius: 14px; margin-bottom:16px;">
                <div style="font-weight: 800; font-size: 13.5px; color: #191F28; margin-bottom: 8px;">조리 순서 미리보기</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4E5968; line-height: 1.6;">
                    ${item.recipe.map(step => `<li style="margin-bottom:4px;">${step}</li>`).join('')}
                </ul>
            </div>

            <!-- ✨ 카카오톡 노란색 장보기 공유 버튼 -->
            <button onclick="shareToHusband('${item.name}', '${item.ingredients}')" style="display:block; width:100%; background:#FEE500; border:none; color:#191919; padding:16px; border-radius:14px; font-weight:900; font-size:15px; text-align:center; transition:0.2s; cursor:pointer; box-shadow: 0 4px 12px rgba(254, 229, 0, 0.2);">
                💬 남편에게 장보기 전송 (쿠팡)
            </button>
        </div>
    `;
}

// 🩺 기존 기능 2: 안심 이유식 매칭 엔진 (미니멀리즘 + 깜빡임 완벽 해결 버전)
function runFoodEngine() {
    if (isFavViewMode) return;

    const age = document.getElementById('food-age').value;
    const goal = document.getElementById('food-goal').value;
    const fridgeInput = document.getElementById('fridge-search').value.trim();
    
    // 오직 알레르기 직접 입력창의 글씨만 읽어옵니다!
    const customAllergyInput = document.getElementById('custom-allergy-search');
    const customAllergies = customAllergyInput && customAllergyInput.value.trim() !== '' ? customAllergyInput.value.split(/[\s,]+/).filter(i => i !== '') : [];

    const resultArea = document.getElementById('food-result-area');

    if (!age) {
        resultArea.innerHTML = `<div class="premium-empty-state"><div class="empty-icon">🩺</div><div class="empty-text"><b>아기 월령을 선택해주세요.</b></div></div>`;
        return;
    }

    let filtered = babyFoodData.filter(item => {
        if (item.age !== age) return false;
        if (goal !== 'all' && item.goal !== goal) return false;
        
        // 1. ✨ 알레르기 철벽 차단 (스마트 한영 매핑 로직)
        if (customAllergies.length > 0) {
            // 엄마들이 자주 입력하는 한글 알레르기 키워드를 영어 DB(allergens)와 매핑
            const allergyDictionary = {
                '계란': 'egg', '달걀': 'egg', '흰자': 'egg', '노른자': 'egg',
                '우유': 'dairy', '치즈': 'dairy', '유제품': 'dairy', '요거트': 'dairy',
                '밀가루': 'flour', '밀': 'flour', '면': 'flour', '빵': 'flour',
                '콩': 'soy', '대두': 'soy', '두부': 'soy', '된장': 'soy',
                '새우': 'shellfish', '게': 'shellfish', '갑각류': 'shellfish',
                '생선': 'seafood', '조개': 'seafood', '해산물': 'seafood',
                '땅콩': 'peanut', '호두': 'peanut', '견과': 'peanut', '견과류': 'peanut'
            };

            const hasCustomAllergy = customAllergies.some(customItem => {
                const mappedEng = allergyDictionary[customItem]; // "유제품" -> "dairy" 변환
                
                return item.name.includes(customItem) || 
                       item.ingredients.includes(customItem) ||
                       (item.allergens && item.allergens.includes(mappedEng)); // 영어 DB 완벽 매칭
            });
            if (hasCustomAllergy) return false; // 하나라도 걸리면 즉시 아웃!
        }
        
        // 2. 냉장고 파먹기
        if (fridgeInput) {
            const fridgeItems = fridgeInput.split(/[\s,]+/).filter(i => i !== '');
            const hasAllFridgeItems = fridgeItems.every(fItem => 
                item.name.includes(fItem) || item.ingredients.includes(fItem)
            );
            if (!hasAllFridgeItems) return false;
        }

        return true;
    });


    if (filtered.length === 0) {
        resultArea.innerHTML = `<div class="premium-empty-state"><div class="empty-text"><b>조건에 맞는 레시피가 없습니다.</b><span>냉장고 재료나 필터를 변경해 보세요.</span></div></div>`;
    } else {
        // ✨ 수정한 부분: 타자 칠 때마다 섞이는 랜덤 로직을 완전히 삭제했습니다! ✨
        // 이제 결과가 고정되어 타자를 쳐도 요동치지 않습니다.
        let top3Results = filtered.slice(0, 3); 
        let otherResults = filtered.slice(3); 

        let htmlOutput = `<div style="font-size: 16px; font-weight: 800; color: #191F28; margin-bottom: 16px;">✨ 오늘의 AI 추천 식단 TOP ${top3Results.length}</div>`;
        htmlOutput += top3Results.map(item => generateCardHTML(item)).join('');

        if (otherResults.length > 0) {
            htmlOutput += `
                <button id="food-show-more-btn" onclick="toggleFoodOthers()" style="display: block; width: 100%; padding: 16px; margin-top: 8px; margin-bottom: 24px; background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 14px; font-size: 14px; font-weight: 700; color: #4E5968; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    나머지 ${otherResults.length}개 레시피 더보기 ▾
                </button>
                <div id="food-other-area" style="display:none; flex-direction: column;">
                    <div style="font-size: 14px; font-weight: 800; color: #8B95A1; margin-bottom: 16px;">🔍 추가 매칭 리스트</div>
                    ${otherResults.map(item => generateCardHTML(item)).join('')}
                </div>
            `;
        }

        resultArea.innerHTML = htmlOutput; // 👈 2개 중 여기가 맞습니다! (runFoodEngine 안쪽)

        // 👇 여기에 스크롤 코드를 딱! 추가해 주세요.
        // 결과가 갱신되면 유저 시선이 다시 매트릭스 필터 쪽으로 부드럽게 올라갑니다.
        document.querySelector('.matrix-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
} // <-- runFoodEngine() 함수가 끝나는 닫는 괄호

function toggleFoodOthers() {
    const otherArea = document.getElementById('food-other-area');
    const btn = document.getElementById('food-show-more-btn');
    if (otherArea.style.display === 'none') {
        otherArea.style.display = 'flex';
        btn.innerText = '나머지 레시피 접기 ▴';
    } else {
        otherArea.style.display = 'none';
        const otherCount = otherArea.querySelectorAll('.stroller-card').length;
        btn.innerText = `나머지 ${otherCount}개 레시피 더보기 ▾`;
        
        // 👇 추가: 리스트 접을 때 화면 튕김 방지
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleFoodFilter(btn) {
    btn.classList.toggle('active');
    runFoodEngine();
}

// 🚀 카카오 SDK 초기화 (food/app.js)
try {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b');
    }
} catch (e) {
    console.warn("카카오 SDK 초기화 지연", e);
}

// 🛒 남편 아바타 조종기 (상업적 멘트 싹 빼고 자연스러운 아내 말투로 변경!)
function shareToHusband(recipeName, ingredients) {
    // ✨ 파트너님의 100% 수익 보장 쿠팡 단축 링크 (뒤에서 조용히 일합니다)
    const partnerLink = "https://link.coupang.com/a/e2f58ZVlhQ"; 
    
    const items = ingredients.split(',').map(i => i.trim());
    let shareText = `여보! 오늘 우리 아기 맘마는 [${recipeName}] 해줄 거야 👶❤️\n\n퇴근길에 로켓프레시로 장 좀 봐줘!\n\n📋 [오늘의 장바구니]\n`;

    // 재료 리스트 추출
    items.forEach(item => {
        const cleanName = item.replace(/[0-9]+(g|ml|T|t|개|장|마리|쪽|알|스푼|분|방울).*/g, '').replace(/\(.*\)/g, '').trim();
        if(cleanName) {
            shareText += `🛒 ${item}\n`;
        }
    });

    // ✨ 완벽하게 자연스러운 아내의 멘트로 수정 (수익 얘기 100% 삭제)
    shareText += `\n👇 아래 링크 눌러서 쿠팡 장바구니에 싹 담아주면 돼!\n👉 ${partnerLink}\n\n고마워 내사랑! 조심해서 와 🥰`;

    // 🚨 카카오톡이 안 될 때 클립보드 복사 폴백
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert("✅ 남편에게 보낼 장보기 리스트가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.");
        }).catch(() => prompt("아래 텍스트를 복사해 주세요", shareText));
        return;
    }

    Kakao.Share.sendDefault({
        objectType: 'text',
        text: shareText,
        link: {
            mobileWebUrl: 'https://happy-baby0303.github.io/',
            webUrl: 'https://happy-baby0303.github.io/'
        },
        buttons: [
            {
                title: '장바구니 담으러 가기 👉',
                link: {
                    mobileWebUrl: 'https://happy-baby0303.github.io/',
                    webUrl: 'https://happy-baby0303.github.io/'
                }
            }
        ]
    });
} // 🚨🚨🚨 바로 이 닫는 괄호 '}' 하나가 빠져서 모든 게 멈췄던 겁니다!!! 🚨🚨🚨

// 🚀 페이지 로드 시 글로벌 동기화 후 엔진 실행
window.onload = () => { 
    applyGlobalBabyProfile();
    runFoodEngine(); 
};

// 🚀 [NEW 4] 이유식 탭 전환 로직 (식단 추천 vs 캘린더)
function switchFoodTab(tabName) {
    const btnCuration = document.getElementById('tab-btn-curation');
    const btnCalendar = document.getElementById('tab-btn-calendar');
    const viewCuration = document.getElementById('view-curation');
    const viewCalendar = document.getElementById('view-calendar');

    if (tabName === 'curation') {
        btnCuration.style.background = '#FFFFFF';
        btnCuration.style.color = '#191F28';
        btnCuration.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnCalendar.style.background = 'transparent';
        btnCalendar.style.color = '#8B95A1';
        btnCalendar.style.boxShadow = 'none';

        viewCuration.style.display = 'block';
        viewCalendar.style.display = 'none';
    } else {
        btnCalendar.style.background = '#FFFFFF';
        btnCalendar.style.color = '#191F28';
        btnCalendar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnCuration.style.background = 'transparent';
        btnCuration.style.color = '#8B95A1';
        btnCuration.style.boxShadow = 'none';

        viewCalendar.style.display = 'block';
        viewCuration.style.display = 'none'; // 👈 이 줄이 지워져서 화면이 겹쳤던 겁니다!
    }

    // 탭을 전환할 때마다 화면 맨 위로 부드럽게 끌어올려줌
    window.scrollTo({top: 0, behavior: 'smooth'}); 
}

// ==========================================
// 📅 이유식 캘린더 엔진 (Premium 인테리어 에디션)
// ==========================================

let currentDate = new Date();
let selectedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('cal-month-title').innerText = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('cal-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    let monthPass = 0;
    let monthFail = 0;

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-day empty"></div>`;
    }
    
    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let classNames = 'cal-day';
        if (dateStr === todayStr) classNames += ' today';
        if (dateStr === selectedDateStr) classNames += ' selected';
        
        let dotsHtml = '';
        if (records[dateStr]) {
            dotsHtml = '<div class="cal-dot-container">';
            records[dateStr].forEach(r => {
                // ✨ 수정된 로직: 식단 기록은 파란 점! 카운트 안 함!
                if (r.type === 'meal' || (r.menu && !r.ingredient)) {
                    dotsHtml += `<div class="cal-dot" style="background:#3182F6;"></div>`;
                } 
                // 재료 테스트는 기존처럼 초록/빨강 점! 카운트 함!
                else {
                    dotsHtml += `<div class="cal-dot ${r.status}"></div>`;
                    if(r.status === 'pass') monthPass++;
                    else if(r.status === 'fail') monthFail++;
                }
            });
            dotsHtml += '</div>';
        }

        grid.innerHTML += `<div class="${classNames}" onclick="selectDate('${dateStr}')"><span style="margin-bottom:2px;">${i}</span>${dotsHtml}</div>`;
    }

    // 월간 요약 대시보드 업데이트
    const sumPass = document.getElementById('sum-pass');
    const sumFail = document.getElementById('sum-fail');
    if(sumPass) sumPass.innerText = `🟢 ${monthPass}개`;
    if(sumFail) sumFail.innerText = `🚨 ${monthFail}개`;

    renderSelectedDateRecords();
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDateStr = dateStr;
    renderCalendar();
}

// ✨ [AI 마법] 텍스트를 분석해서 귀여운 이모지 자동 맵핑!
function getFoodEmoji(name) {
    if(/소고기|돼지|닭|고기|안심|우둔/.test(name)) return '🥩';
    if(/쌀|미음|오트밀|죽|밥|현미/.test(name)) return '🥣';
    if(/호박|청경채|브로콜리|시금치|오이|배추|당근|무|감자|고구마|야채|채소|양배추/.test(name)) return '🥦';
    if(/사과|바나나|배|퓨레|과일|수박|딸기|귤|포도/.test(name)) return '🍎';
    if(/계란|노른자|달걀|흰자/.test(name)) return '🥚';
    if(/땅콩|호두|아몬드|견과/.test(name)) return '🥜';
    if(/치즈|우유|요거트|분유|유제품/.test(name)) return '🧀';
    if(/새우|게|대게|랍스터|조개|갑각류/.test(name)) return '🦐';
    if(/생선|연어|대구|광어|고등어|갈치/.test(name)) return '🐟';
    if(/두부|콩|완두/.test(name)) return '🫘';
    return '🍽️';
}

function renderSelectedDateRecords() {
    const [y, m, d] = selectedDateStr.split('-');
    const titleEl = document.getElementById('cal-selected-date-text');
    if(titleEl) titleEl.innerText = `${parseInt(m)}월 ${parseInt(d)}일 식재료 기록`;
    
    const records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    const dailyRecords = records[selectedDateStr] || [];
    const listArea = document.getElementById('cal-record-list');
    if(!listArea) return;
    
    if (dailyRecords.length === 0) {
        listArea.innerHTML = `<div style="text-align: center; color: #8B95A1; font-size: 13.5px; padding: 30px 0; background: #FFF; border-radius: 14px; border: 1px dashed #D1D5DB;">아직 기록된 식재료가 없어요.<br>위의 [+ 재료 테스트]를 눌러 추가해보세요!</div>`;
        return;
    }
    
    listArea.innerHTML = dailyRecords.map((r, index) => {
        const emoji = getFoodEmoji(r.ingredient);
        return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF; padding: 16px; border-radius: 16px; border: 1px solid #E5E8EB; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px; background: #F8F9FA; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; border-radius: 12px; border: 1px solid #F2F4F6;">${emoji}</div>
                <div>
                    <div style="font-size: 15.5px; font-weight: 900; color: #191F28; margin-bottom: 2px;">${r.ingredient}</div>
                    <div style="font-size: 12px; font-weight: 700; color: #8B95A1;">${r.status === 'pass' ? '알레르기 없음' : '발진/거부 반응'}</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                <span style="font-size: 11.5px; font-weight: 900; color: ${r.status === 'pass' ? '#059669' : '#D32F2F'}; background: ${r.status === 'pass' ? '#ECFDF5' : '#FFF0F1'}; padding: 6px 10px; border-radius: 8px;">${r.status === 'pass' ? '🟢 안심 통과' : '🚨 주의 요망'}</span>
                <button onclick="deleteFoodRecord('${selectedDateStr}', ${index})" style="background: none; border: none; color: #D1D5DB; font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: underline;">삭제</button>
            </div>
        </div>
    `}).join('');
}

function openFoodSheet() {
    document.getElementById('food-bottom-sheet').style.display = 'flex';
    document.getElementById('food-menu-input').value = '';
    document.getElementById('food-amount-input').value = '';
    document.getElementById('food-ing-input').value = '';
    setAllergyStatus('pass'); // 기본값으로 리셋
}

function closeFoodSheet() {
    document.getElementById('food-bottom-sheet').style.display = 'none';
}

function saveFoodCalendar(status) {
    const ingredient = document.getElementById('food-ing-input').value.trim();
    if (!ingredient) return alert("급여한 식재료를 입력해주세요! (예: 소고기)");
    
    let records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    if (!records[selectedDateStr]) records[selectedDateStr] = [];
    
    records[selectedDateStr].push({ ingredient, status });
    localStorage.setItem('tosil_food_calendar', JSON.stringify(records));
    
    closeFoodSheet();
    renderCalendar();
}

function deleteFoodRecord(dateStr, index) {
    if (!confirm(`'${JSON.parse(localStorage.getItem('tosil_food_calendar'))[dateStr][index].ingredient}' 기록을 삭제할까요?`)) return;
    let records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    if (records[dateStr]) {
        records[dateStr].splice(index, 1);
        if (records[dateStr].length === 0) delete records[dateStr];
        localStorage.setItem('tosil_food_calendar', JSON.stringify(records));
    }
    renderCalendar();
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderCalendar, 300);
});

// ✨ 도감 추출 로직 (메뉴 이름은 거르고, 순수 '재료명(ingredient)'만 추출)
function renderTotalSummary() {
    const records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    const passedSet = new Set();
    const failedSet = new Set();

    Object.values(records).forEach(dailyList => {
        dailyList.forEach(r => {
            // ingredient 필드가 비어있으면 도감에 넣지 않음!
            const cleanName = (r.ingredient || "").trim(); 
            if (cleanName) {
                if (r.status === 'fail') {
                    failedSet.add(cleanName);
                } else {
                    passedSet.add(cleanName);
                }
            }
        });
    });

    failedSet.forEach(item => passedSet.delete(item));

    const passListEl = document.getElementById('summary-pass-list');
    const failListEl = document.getElementById('summary-fail-list');
    const passCntEl = document.getElementById('summary-pass-cnt');
    const failCntEl = document.getElementById('summary-fail-cnt');

    if(passCntEl) passCntEl.innerText = passedSet.size;
    if(failCntEl) failCntEl.innerText = failedSet.size;

    if(passListEl) {
        if(passedSet.size === 0) {
            passListEl.innerHTML = '<span style="font-size:12.5px; color:#8B95A1;">아직 통과한 재료가 없어요.</span>';
        } else {
            passListEl.innerHTML = Array.from(passedSet).map(ing => 
                `<span style="background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; padding:6px 14px; border-radius:20px; font-size:13.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">${getFoodEmoji(ing)} ${ing}</span>`
            ).join('');
        }
    }

    if(failListEl) {
        if(failedSet.size === 0) {
            failListEl.innerHTML = '<span style="font-size:12.5px; color:#8B95A1;">알레르기 반응이 나타난 재료가 없어요!</span>';
        } else {
            failListEl.innerHTML = Array.from(failedSet).map(ing => 
                `<span style="background:#FFF0F1; color:#D32F2F; border:1px solid #FECACA; padding:6px 14px; border-radius:20px; font-size:13.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">${getFoodEmoji(ing)} ${ing}</span>`
            ).join('');
        }
    }
}

// ==========================================
// 👨‍🍳 스마트 요리 모드 (프리미엄 디테일 탑재) 엔진
// ==========================================

let cookTimeRemaining = 0;
let cookTimeTotal = 0; // 게이지 바를 위한 전체 시간 저장
let cookTimerInterval = null;
let isTimerRunning = false;
let wakeLock = null; // 화면 꺼짐 방지 객체

// ☀️ 화면 꺼짐 방지(Wake Lock) API
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            document.getElementById('wake-lock-badge').style.display = 'inline-block';
            
            wakeLock.addEventListener('release', () => {
                document.getElementById('wake-lock-badge').style.display = 'none';
            });
        }
    } catch (err) {
        console.log('Wake Lock Error:', err);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

function openCookingMode(recipeName) {
    const recipe = babyFoodData.find(r => r.name === recipeName);
    if (!recipe) return;

    document.getElementById('cook-title').innerText = recipe.name;
    
    const stepsContainer = document.getElementById('cook-steps-container');
    stepsContainer.innerHTML = recipe.recipe.map((step, index) => {
        const timeMatch = step.match(/(\d+)분/);
        let timerBtnHtml = '';
        if (timeMatch) {
            const mins = parseInt(timeMatch[1]);
            timerBtnHtml = `
                <button onclick="event.stopPropagation(); setCookTimer(${mins});" style="background:#FFF0F1; color:#D32F2F; border:1px solid #FECACA; padding:6px 12px; border-radius:8px; font-weight:900; font-size:12px; cursor:pointer; margin-left:auto; display:flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(0,0,0,0.02); flex-shrink:0; transition:0.2s;">
                    ⏱️ ${mins}분 세팅
                </button>
            `;
        }
        return `
            <div class="cook-step" onclick="this.classList.toggle('checked')" style="display:flex; align-items:center;">
                <div class="step-box" style="min-width:24px; height:24px; border-radius:6px; border:2px solid #D1D5DB; display:flex; justify-content:center; align-items:center; font-size:12px; font-weight:900; flex-shrink:0;">${index + 1}</div>
                <div style="flex:1; padding-right:8px;">${step.substring(step.indexOf('.') + 1).trim()}</div>
                ${timerBtnHtml}
            </div>
        `;
    }).join('');

    resetCookTimer();
    document.getElementById('cooking-mode-modal').classList.remove('alarm-active');
    document.getElementById('cooking-mode-modal').style.display = 'flex';
    
    // ✨ 요리 모드를 열 때 화면이 절대 안 꺼지게 만듭니다!
    requestWakeLock();
}

function setCookTimer(minutes) {
    resetCookTimer();
    cookTimeTotal = minutes * 60; // 게이지바 계산용
    cookTimeRemaining = cookTimeTotal;
    updateCookTimerDisplay();
    
    const display = document.getElementById('cook-timer-display');
    display.style.transform = 'scale(1.1)';
    display.style.color = '#D32F2F';
    setTimeout(() => {
        display.style.transform = 'scale(1)';
        display.style.color = '#191F28';
    }, 300);
}

function closeCookingMode() {
    document.getElementById('cooking-mode-modal').style.display = 'none';
    resetCookTimer();
    releaseWakeLock(); // 요리 모드 닫을 때 배터리를 위해 꺼짐 방지 해제
}

function addCookTime(seconds) {
    cookTimeRemaining += seconds;
    if(cookTimeTotal < cookTimeRemaining) cookTimeTotal = cookTimeRemaining; 
    updateCookTimerDisplay();
}

function toggleCookTimer() {
    const btn = document.getElementById('cook-timer-btn');
    document.getElementById('cooking-mode-modal').classList.remove('alarm-active'); 
    
    if (isTimerRunning) {
        clearInterval(cookTimerInterval);
        isTimerRunning = false;
        btn.innerHTML = '▶ 계속';
        btn.style.background = '#3182F6';
    } else {
        if (cookTimeRemaining <= 0) return alert('먼저 시간을 세팅해주세요!');
        
        isTimerRunning = true;
        btn.innerHTML = '⏸ 일시정지';
        btn.style.background = '#F59E0B'; 
        
        cookTimerInterval = setInterval(() => {
            cookTimeRemaining--;
            updateCookTimerDisplay();
            
            if (cookTimeRemaining <= 0) {
                clearInterval(cookTimerInterval);
                isTimerRunning = false;
                btn.innerHTML = '▶ 시작';
                btn.style.background = '#3182F6';
                updateCookTimerDisplay();
                
                // ✨ [핵심 디테일] 팝업창 대신 '화면 번쩍임' + '무음 진동' 알람!
                document.getElementById('cooking-mode-modal').classList.add('alarm-active');
                if (navigator.vibrate) {
                    navigator.vibrate([500, 300, 500, 300, 500, 300, 500]); // 징~ 징~ 징~ 징~
                }
            }
        }, 1000);
    }
}

function resetCookTimer() {
    clearInterval(cookTimerInterval);
    isTimerRunning = false;
    cookTimeRemaining = 0;
    cookTimeTotal = 0;
    updateCookTimerDisplay();
    
    const btn = document.getElementById('cook-timer-btn');
    if(btn) {
        btn.innerHTML = '▶ 시작';
        btn.style.background = '#3182F6';
    }
    document.getElementById('cooking-mode-modal').classList.remove('alarm-active');
}

function updateCookTimerDisplay() {
    const m = Math.floor(cookTimeRemaining / 60);
    const s = cookTimeRemaining % 60;
    const display = document.getElementById('cook-timer-display');
    const bar = document.getElementById('cook-progress-bar');
    
    if(display) display.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    // ✨ 프로그레스 게이지 바 애니메이션 계산
    if(bar) {
        if (cookTimeTotal === 0) {
            bar.style.width = '100%';
            bar.style.background = '#E5E8EB';
            display.style.color = '#191F28';
        } else {
            const percent = (cookTimeRemaining / cookTimeTotal) * 100;
            bar.style.width = `${percent}%`;
            
            // 10초 남았을 때 아드레날린 솟구치는 빨간색으로 변경!
            if(cookTimeRemaining <= 10 && cookTimeRemaining > 0) {
                bar.style.background = '#D32F2F';
                display.style.color = '#D32F2F';
            } else {
                bar.style.background = '#3182F6';
                display.style.color = '#191F28';
            }
        }
    }
}

// ==========================================
// 👩‍⚕️ 영양학 팩트체크 궁합 데이터 (의학/영양학 교차 검증 완료)
// ==========================================
const pairingDB = {
    "소고기": {
        good: [{ item: "브로콜리, 청경채, 파프리카", reason: "비타민C가 소고기의 철분 흡수율을 최대 30%까지 끌어올려요!" }],
        bad: [{ item: "치즈, 우유 (유제품)", reason: "유제품의 칼슘이 철분 흡수를 방해해요. 고기 섭취 후 최소 2시간 간격을 두세요." }, { item: "고구마, 부추", reason: "소화에 필요한 위산 농도가 달라 함께 먹으면 아기 배에 가스가 차고 소화불량을 유발할 수 있어요." }]
    },
    "시금치": {
        good: [{ item: "소고기, 당근, 사과", reason: "철분과 비타민의 시너지가 좋고, 사과가 시금치의 풋내를 완벽히 잡아줘요." }],
        bad: [{ item: "두부, 치즈, 멸치", reason: "시금치의 '수산' 성분이 칼슘과 만나면 체내 결석(돌)을 유발할 수 있어 절대 피해야 해요!" }]
    },
    "당근": {
        good: [{ item: "사과, 고구마, 현미유", reason: "지용성 비타민A가 풍부해 기름에 살짝 볶으면 체내 흡수율이 60% 이상 훌쩍 뛰어요!" }],
        bad: [{ item: "오이, 무", reason: "생당근의 '아스코르비나아제' 효소가 오이와 무의 비타민C를 파괴해요. (단, 익혀 먹으면 괜찮아요)" }]
    },
    "오이": {
        good: [{ item: "사과, 배, 소고기", reason: "수분 보충에 최고이며, 고기의 열을 내려주고 시원한 맛이 잘 어울려요." }],
        bad: [{ item: "당근, 무", reason: "생으로 같이 먹으면 비타민C가 파괴되니 따로 먹이거나 푹 익혀주세요." }]
    },
    "미역": {
        good: [{ item: "두부", reason: "두부의 콩 성분이 몸 밖으로 배출하는 요오드를 미역이 완벽하게 다시 채워주는 상호보완 궁합이에요!" }],
        bad: [{ item: "파 (대파, 쪽파)", reason: "파의 유황 성분이 미역의 칼슘 흡수를 방해하고, 미끄러운 식감끼리 만나 소화를 방해해요." }]
    },
    "두부": {
        good: [{ item: "미역, 다시마, 소고기", reason: "두부가 배출하는 요오드를 해조류가 채워주는 완벽한 궁합이에요." }],
        bad: [{ item: "시금치", reason: "수산과 칼슘이 만나 장내 결석을 유발할 수 있어 소아과에서 가장 주의하는 조합이에요." }]
    },
    "치즈": {
        good: [{ item: "감자, 고구마", reason: "구황작물에 부족한 단백질과 칼슘을 치즈가 완벽하게 채워줘요." }],
        bad: [{ item: "소고기, 시금치", reason: "치즈의 빵빵한 칼슘이 필수 영양소인 철분 흡수를 막아버려요. 고기 먹은 직후엔 피하세요." }]
    },
    "닭고기": {
        good: [{ item: "고구마, 단호박, 밤, 대추", reason: "따뜻한 성질의 닭고기와 달콤한 구황작물이 만나 소화를 돕고 기력을 보충해요." }],
        bad: [{ item: "자두", reason: "함께 먹으면 위장 소화 효소가 엉켜 배탈이 날 수 있어요." }]
    },
    "고구마": {
        good: [{ item: "사과, 배", reason: "사과의 '펙틴' 성분이 고구마로 인한 장내 가스 생성과 방귀를 막아줘요." }],
        bad: [{ item: "소고기", reason: "소화에 필요한 위산 농도가 달라 함께 섭취 시 속쓰림을 유발할 수 있어요." }]
    }
};

// ==========================================
// 📅 캘린더 기록 엔진 (식단/테스트 완벽 분리형)
// ==========================================

let currentAllergyStatus = 'pass';

function setAllergyStatus(status) {
    currentAllergyStatus = status;
    const btnPass = document.getElementById('btn-al-pass');
    const btnFail = document.getElementById('btn-al-fail');
    
    if (btnPass && btnFail) {
        btnPass.style.border = status === 'pass' ? '2px solid #10B981' : '2px solid transparent';
        btnFail.style.border = status === 'fail' ? '2px solid #E32636' : '2px solid transparent';
    }
}

function openMealSheet() {
    document.getElementById('meal-bottom-sheet').style.display = 'flex';
    document.getElementById('meal-menu-input').value = '';
    document.getElementById('meal-amount-input').value = '';
    document.getElementById('meal-reaction-input').selectedIndex = 0;
}

function openTestSheet() {
    document.getElementById('test-bottom-sheet').style.display = 'flex';
    document.getElementById('test-ing-input').value = '';
    setAllergyStatus('pass');
}

function closeSheets() {
    const mealSheet = document.getElementById('meal-bottom-sheet');
    const testSheet = document.getElementById('test-bottom-sheet');
    if(mealSheet) mealSheet.style.display = 'none';
    if(testSheet) testSheet.style.display = 'none';
}

function saveMealRecord() {
    const menu = document.getElementById('meal-menu-input').value.trim();
    const amount = document.getElementById('meal-amount-input').value.trim();
    const reaction = document.getElementById('meal-reaction-input').value;
    
    // ✨ 깐깐한 amount 검사 삭제! 메뉴 이름만 적으면 무조건 통과!
    if (!menu) return alert('메뉴 이름은 꼭 입력해주세요! (예: 소고기 미음)');

    // 입력 안 했으면 '양 모름', 입력했으면 '50ml' 식으로 알아서 포맷팅
    const finalAmount = amount ? `${amount}ml` : '양 모름';

    saveToCalendarDB({ type: 'meal', menu, amount: finalAmount, reaction });
    closeSheets();
}

function saveTestRecord() {
    const ingredient = document.getElementById('test-ing-input').value.trim();
    if (!ingredient) return alert('테스트한 식재료를 입력해주세요!');

    saveToCalendarDB({ type: 'test', ingredient, status: currentAllergyStatus });
    closeSheets();
}

// 공통 DB 저장 로직
function saveToCalendarDB(dataObj) {
    const timeStr = new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'});
    dataObj.time = timeStr;

    let records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    if (!records[selectedDateStr]) records[selectedDateStr] = [];
    
    records[selectedDateStr].push(dataObj);
    localStorage.setItem('tosil_food_calendar', JSON.stringify(records));
    
    renderCalendar();
    renderSelectedDateRecords();
    renderTotalSummary();
}

// ✨ 디테일 카드 렌더링 (타입에 따라 디자인 다르게)
function renderSelectedDateRecords() {
    const listArea = document.getElementById('cal-record-list');
    const records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    const dailyRecords = records[selectedDateStr] || [];
    
    const dateObj = new Date(selectedDateStr);
    const titleEl = document.getElementById('cal-selected-date-text');
    if(titleEl) titleEl.innerText = `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 기록`;

    if (dailyRecords.length === 0) {
        listArea.innerHTML = `<div style="text-align: center; padding: 30px 0; color: #8B95A1; font-size: 14px; font-weight: 600; background:#FFF; border-radius:14px; border:1px dashed #D1D5DB;">기록된 내역이 없습니다.</div>`;
        return;
    }

    listArea.innerHTML = dailyRecords.map((r, i) => {
        let contentHtml = '';

       // 1. 식단 기록용 UI (ml 글자를 빼고 r.amount 그대로 출력하게 수정)
        if (r.type === 'meal' || (r.menu && !r.ingredient)) {
            contentHtml = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-size:12px; color:#8B95A1; font-weight:700;">${r.time || ''}</span>
                    <span style="font-weight: 900; font-size: 15px; color: #191F28;">🍲 ${r.menu}</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <span style="background:#F0F7FF; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:800; color:#3182F6;">${r.amount}</span>
                    <span style="background:#F2F4F6; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:800; color:#4E5968;">${r.reaction}</span>
                </div>
            `;
        } 
        // 2. 재료 테스트용 UI
        else {
            const isPass = r.status === 'pass';
            const icon = isPass ? '🟢' : '🚨';
            contentHtml = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-size:12px; color:#8B95A1; font-weight:700;">${r.time || ''}</span>
                    <span style="font-weight: 900; font-size: 15px; color: ${isPass ? '#059669' : '#D32F2F'};">🧪 ${r.ingredient} 테스트</span>
                </div>
                <span style="display:inline-block; font-size:12px; font-weight:800; padding:4px 8px; border-radius:6px; background:${isPass ? '#ECFDF5' : '#FFF0F1'}; color:${isPass ? '#059669' : '#D32F2F'};">
                    ${icon} ${isPass ? '무사 통과' : '알레르기 반응'}
                </span>
            `;
        }

        return `
            <div style="background: #FFF; border: 1px solid #E5E8EB; padding: 16px; border-radius: 14px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="display:flex; flex-direction:column;">
                    ${contentHtml}
                </div>
                <button onclick="deleteFoodRecord('${selectedDateStr}', ${i})" style="background: #F9FAFB; border: 1px solid #E5E8EB; border-radius: 8px; font-size: 12px; font-weight:700; color: #8B95A1; cursor: pointer; padding:6px 10px;">삭제</button>
            </div>
        `;
    }).join('');
}

function deleteFoodRecord(dateStr, index) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    let records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    if (records[dateStr]) {
        records[dateStr].splice(index, 1);
        if (records[dateStr].length === 0) delete records[dateStr];
        localStorage.setItem('tosil_food_calendar', JSON.stringify(records));
    }
    renderCalendar();
    renderTotalSummary();
}

// ✨ 도감 추출 로직 (순수 테스트 기록만 도감에 반영)
function renderTotalSummary() {
    const records = JSON.parse(localStorage.getItem('tosil_food_calendar')) || {};
    const passedSet = new Set();
    const failedSet = new Set();

    Object.values(records).forEach(dailyList => {
        dailyList.forEach(r => {
            if (r.type === 'test' || (r.ingredient && !r.menu)) {
                const cleanName = r.ingredient.trim(); 
                if (cleanName) {
                    if (r.status === 'fail') failedSet.add(cleanName);
                    else passedSet.add(cleanName);
                }
            }
        });
    });

    failedSet.forEach(item => passedSet.delete(item));

    const passListEl = document.getElementById('summary-pass-list');
    const failListEl = document.getElementById('summary-fail-list');
    
    const passCntEl = document.getElementById('summary-pass-cnt');
    const failCntEl = document.getElementById('summary-fail-cnt');
    
    if(passCntEl) passCntEl.innerText = passedSet.size;
    if(failCntEl) failCntEl.innerText = failedSet.size;

    if(passListEl) {
        passListEl.innerHTML = passedSet.size === 0 ? '<span style="font-size:12.5px; color:#8B95A1;">아직 통과한 재료가 없어요.</span>' 
            : Array.from(passedSet).map(ing => `<span style="background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; padding:6px 14px; border-radius:20px; font-size:13.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">${getFoodEmoji(ing)} ${ing}</span>`).join('');
    }

    if(failListEl) {
        failListEl.innerHTML = failedSet.size === 0 ? '<span style="font-size:12.5px; color:#8B95A1;">알레르기 반응이 나타난 재료가 없어요!</span>' 
            : Array.from(failedSet).map(ing => `<span style="background:#FFF0F1; color:#D32F2F; border:1px solid #FECACA; padding:6px 14px; border-radius:20px; font-size:13.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">${getFoodEmoji(ing)} ${ing}</span>`).join('');
    }
}

// ==========================================
// 🤖 AI 큐브 자동 차감 스캐너 엔진 (🚨 이름표 완벽 매칭 버전!!! 🔑)
// ==========================================
let matchedCubesForDeduction = [];

// 💡 큐브 데이터 파싱용 안전 함수
function getCubeName(c) { return c.name || c.itemName || c.title || c.ingredient || c.text || c.foodName || "이름모름"; }
function getCubeQty(c) { 
    let rawQty = c.qty !== undefined ? c.qty : (c.quantity !== undefined ? c.quantity : (c.count !== undefined ? c.count : 0));
    if (typeof rawQty === 'string') return parseInt(rawQty.replace(/[^0-9]/g, '')) || 0;
    return parseInt(rawQty) || 0;
}

window.triggerAutoDeduction = function() {
    const menuName = document.getElementById('meal-menu-input').value.trim();

    if (!menuName) {
        return alert('어떤 메뉴를 먹였는지 입력해주세요!');
    }

    // ✨ 드디어 찾은 진짜 이름표! 'tosil_cube_records' 로 열어봅니다!
    let cubes = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    
    if(cubes.length === 0) {
        saveMealRecord();
        return;
    }

    const safeMenuName = menuName.replace(/\s+/g, ''); 

    matchedCubesForDeduction = cubes.filter(cube => {
        const rawName = getCubeName(cube);
        const rawQty = getCubeQty(cube);
        if(rawName === "이름모름") return false;

        const safeCubeName = String(rawName).replace(/\s+/g, '');
        return safeMenuName.includes(safeCubeName) && rawQty > 0;
    });

    if(matchedCubesForDeduction.length > 0) {
        let listHtml = '';
        matchedCubesForDeduction.forEach(cube => {
            const rawName = getCubeName(cube);
            const rawQty = getCubeQty(cube);
            const icon = (String(rawName).includes('고기') || String(rawName).includes('소') || String(rawName).includes('닭') || cube.cat === 'meat') ? '🥩' : '🥦';
            
            listHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #F8F9FA; border-radius: 12px; border: 1px solid #E5E8EB; margin-bottom: 8px;">
                <div style="font-size: 14.5px; font-weight: 800; color: #191F28;">${icon} ${rawName}</div>
                <div style="font-size: 14px; font-weight: 800; color: #8B95A1;">
                    잔여 <span style="text-decoration: line-through;">${rawQty}개</span> 👉 <span style="color: #3182F6; font-size: 16px;">${parseInt(rawQty) - 1}개</span>
                </div>
            </div>
            `;
        });
        document.getElementById('ai-deduction-list').innerHTML = listHtml;
        document.getElementById('ai-deduction-modal').style.display = 'flex';
    } else {
        saveMealRecord();
    }
};

// [✅ 차감하고 저장] 눌렀을 때
window.confirmDeduction = function() {
    let cubes = JSON.parse(localStorage.getItem('tosil_cube_records')) || [];
    
    matchedCubesForDeduction.forEach(match => {
        const matchName = getCubeName(match);
        const idx = cubes.findIndex(c => getCubeName(c) === matchName);

        if(idx !== -1) {
            let currentQty = getCubeQty(cubes[idx]);
            if (currentQty > 0) {
                if(cubes[idx].qty !== undefined) cubes[idx].qty = currentQty - 1; 
                else if(cubes[idx].quantity !== undefined) cubes[idx].quantity = currentQty - 1;
                else if(cubes[idx].count !== undefined) cubes[idx].count = currentQty - 1;
                else if(cubes[idx].amount !== undefined) cubes[idx].amount = currentQty - 1;
            }
        }
    });
    
    localStorage.setItem('tosil_cube_records', JSON.stringify(cubes));
    
    // 🔥 핵심: 메인 화면이 클라우드에 덮어쓸 수 있도록 '비밀 메모' 남기기!
    localStorage.setItem('tosil_cube_pending_sync', JSON.stringify(cubes));

    document.getElementById('ai-deduction-modal').style.display = 'none';
    
    saveMealRecord();
    setTimeout(() => { alert("🤖 냉장고 큐브 재고가 1개 차감되었습니다!"); }, 300);
};

// [건너뛰기] 눌렀을 때
window.skipDeduction = function() {
    document.getElementById('ai-deduction-modal').style.display = 'none';
    saveMealRecord();
};

// ==========================================
// 📸 [마케팅 원기옥] 맘카페 자랑용 식단표 이미지 캡처 엔진
// ==========================================
window.downloadCalendarImage = function() {
    // 1. 찰칵! 소리와 함께 캡처 중이라는 걸 보여줍니다.
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ 예쁘게 이미지를 굽는 중...';
    btn.style.background = '#8B95A1';
    btn.disabled = true;

    // 2. 캡처할 타겟: 캘린더 전체 화면!
    const targetEl = document.getElementById('view-calendar');

    // 3. 카메라(html2canvas) 작동!
    html2canvas(targetEl, {
        scale: 2, // 화질 2배 뻥튀기 (인스타/카페 업로드용 고화질)
        backgroundColor: "#F2F4F6", // 배경색 예쁘게 깔아주기
        useCORS: true 
    }).then(canvas => {
        // ✨ 마케팅 핵심: 캡처된 사진 우측 하단에 '워터마크' 강제 삽입!
        const ctx = canvas.getContext('2d');
        ctx.font = "900 24px 'Malgun Gothic', sans-serif";
        ctx.fillStyle = "#8B95A1";
        ctx.textAlign = "right";
        ctx.fillText("✨ Designed by 배냇함 AI", canvas.width - 30, canvas.height - 30);

        // 4. 이미지 다운로드 실행
        const link = document.createElement('a');
        link.download = `배냇함_우리아기_식단표_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 5. 버튼 원상복구
        btn.innerHTML = originalText;
        btn.style.background = '#191F28';
        btn.disabled = false;
        
        setTimeout(() => { alert("📸 갤러리에 식단표가 저장되었습니다!"); }, 300);
    }).catch(err => {
        console.error("캡처 실패:", err);
        alert("🚨 앗, 이미지 저장에 실패했어요. 다시 시도해주세요!");
        btn.innerHTML = originalText;
        btn.style.background = '#191F28';
        btn.disabled = false;
    });
};

// ==========================================
// 💧 이유식 배죽 계산기 로직 (UI 개편 및 역산 최적화)
// ==========================================

function toggleFoodCalc() {
    const body = document.getElementById('food-calc-body');
    const chevron = document.getElementById('food-calc-chevron');
    
    if (body.style.display === 'none') {
        body.style.display = 'block';
        if(chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        body.style.display = 'none';
        if(chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

// 🔄 탭 전환 애니메이션 로직
function switchCalcMode(mode) {
    const btnReverse = document.getElementById('tab-calc-reverse');
    const btnForward = document.getElementById('tab-calc-forward');
    const viewReverse = document.getElementById('calc-view-reverse');
    const viewForward = document.getElementById('calc-view-forward');

    if (mode === 'reverse') {
        btnReverse.style.background = '#FFFFFF'; btnReverse.style.color = '#191F28'; btnReverse.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnForward.style.background = 'transparent'; btnForward.style.color = '#8B95A1'; btnForward.style.boxShadow = 'none';
        viewReverse.style.display = 'block'; viewForward.style.display = 'none';
    } else {
        btnForward.style.background = '#FFFFFF'; btnForward.style.color = '#191F28'; btnForward.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnReverse.style.background = 'transparent'; btnReverse.style.color = '#8B95A1'; btnReverse.style.boxShadow = 'none';
        viewForward.style.display = 'block'; viewReverse.style.display = 'none';
    }
}

// 🍳 우리 집 회수율 (실측 보정값 우선, 없으면 조리방법 기본값)
function getYieldRate() {
    const saved = parseFloat(localStorage.getItem('tosil_food_yield'));
    if (saved && saved > 0.5 && saved <= 1) return saved;
    const el = document.getElementById('food-cook-method');
    const evap = el ? parseFloat(el.value) : 0.15;
    return 1 - evap;
}

// ⏩ 정방향: 얼마나 나올까?
function calcBabyFoodWater() {
    const type = document.getElementById('food-base-type').value;
    const ratio = parseFloat(document.getElementById('food-ratio-type').value);
    const weightVal = document.getElementById('food-base-weight').value;

    if (!weightVal || parseFloat(weightVal) <= 0) {
        alert("⚠️ 투입할 베이스 재료의 무게를 숫자로 입력해주세요!");
        return;
    }

    const weight = parseFloat(weightVal);
    let waterG = 0;

    if (type === 'flour')       waterG = Math.round(weight * (ratio * 2));
    else if (type === 'raw')    waterG = Math.round(weight * ratio);
    else if (type === 'cooked') waterG = Math.round(weight * (ratio / 2));

    const rate     = getYieldRate();
    const totalG   = waterG + weight;
    const yieldG   = Math.round(totalG * rate);

    // 🚨 여기서 ID를 res-water-g 로 완벽 매칭!
    document.getElementById('res-water-g').innerText = waterG.toLocaleString();
    document.getElementById('res-yield-g').innerText = yieldG.toLocaleString();

    const cube = Math.floor(yieldG / 60), rest = yieldG % 60;
    document.getElementById('res-cube-info').innerText =
        cube > 0 ? `(60g 큐브 ${cube}칸${rest >= 10 ? ` + ${rest}g` : ''} 분량)` : `(한 끼 분량)`;

    const isCalib = !!localStorage.getItem('tosil_food_yield');
    const statusEl = document.getElementById('food-calib-status');
    if (statusEl) {
        statusEl.innerHTML = isCalib ? `✅ 우리 집 회수율 <b>${Math.round(rate * 100)}%</b> 적용 중` : '';
    }

    document.getElementById('food-calc-result').style.display = 'block';
}

// 🎯 실측 보정: 냄비 회수율 저장
function saveEvapCalibration() {
    const actual   = parseFloat(document.getElementById('food-actual-yield').value);
    // 🚨 여기서도 ID를 res-water-g 로 완벽 매칭!
    const waterG   = parseFloat(document.getElementById('res-water-g').innerText.replace(/,/g, ''));
    const weight   = parseFloat(document.getElementById('food-base-weight').value);
    const statusEl = document.getElementById('food-calib-status');

    if (!actual || actual <= 0 || !waterG || !weight) {
        statusEl.style.color = '#E32636';
        statusEl.innerText = '⚠️ 저울로 잰 완성 무게를 숫자로 입력해주세요.';
        return;
    }

    const totalG = waterG + weight;
    const rate   = actual / totalG;

    if (rate > 1) {
        statusEl.style.color = '#E32636';
        statusEl.innerText = '⚠️ 투입량보다 많이 나왔어요. 용기 무게를 빼셨나요?';
        return;
    }
    if (rate < 0.5) {
        statusEl.style.color = '#E32636';
        statusEl.innerText = '⚠️ 절반 이상이 사라졌어요. 계량을 다시 확인해주세요!';
        return;
    }

    localStorage.setItem('tosil_food_yield', rate.toFixed(3));
    statusEl.style.color = '#3182F6';
    statusEl.innerHTML = `✅ 저장 완료! 우리 집 회수율은 <b>${Math.round(rate * 100)}%</b>네요.`;
    
    // 저장 후 즉시 재계산 돌리기
    calcBabyFoodWater(); 
    calcReverseFood(); 
    
    // 입력창 비우고 아코디언 닫기 효과
    document.getElementById('food-actual-yield').value = '';
}

// 🔄 역방향: 이만큼 만들고 싶어요 (현실 육아 패치 완료)
function calcReverseFood() {
    const target = parseFloat(document.getElementById('food-target-yield').value);
    const type   = document.getElementById('food-base-type').value;
    const ratio  = parseFloat(document.getElementById('food-ratio-type').value);

    if (!target || target <= 0) {
        alert("⚠️ 만들고 싶은 총량(g)을 숫자로 입력해주세요!");
        return;
    }

    let mult = ratio;                      
    if (type === 'flour')  mult = ratio * 2;
    if (type === 'cooked') mult = ratio / 2;

    const rate   = getYieldRate();
    
    // 1. 역산: 로직상 정확한 수치 도출 (사모님한테 등짝 맞는 숫자)
    let exactBaseG  = target / (rate * (1 + mult));
    let exactWaterG = exactBaseG * mult;

    // 2. 🚨 [현실 패치] 엄마들이 실제로 잴 수 있게 반올림!
    // 쌀/고기 등은 일반 저울에 맞게 1g 단위로 반올림
    let realisticBaseG = Math.round(exactBaseG);
    
    // 물은 젖병 눈금에 맞추기 편하게 무조건 10ml 단위로 반올림 (예: 137 -> 140)
    let realisticWaterG = Math.round(exactWaterG / 10) * 10;

    // 3. 반올림된 레시피로 다시 끓였을 때 "진짜로" 나오는 최종 양 계산
    let finalYieldG = Math.round((realisticBaseG + realisticWaterG) * rate);

    // 4. 화면에 값 뿌려주기
    document.getElementById('rev-base-g').innerText  = realisticBaseG.toLocaleString();
    document.getElementById('rev-water-g').innerText = realisticWaterG.toLocaleString();
    
    const resultBox = document.getElementById('food-reverse-result');
    resultBox.style.display = 'block';
    
    // 5. 살짝 띠용 하는 애니메이션으로 계산됐음을 어필
    resultBox.style.transform = 'scale(1.02)';
    setTimeout(() => { resultBox.style.transform = 'scale(1)'; }, 150);

    // 6. 엄마 마음을 편안하게 해주는 안내 문구 삽입
    let noteEl = document.getElementById('rev-realistic-note');
    if (!noteEl) {
        noteEl = document.createElement('div');
        noteEl.id = 'rev-realistic-note';
        noteEl.style.cssText = 'font-size:12.5px; color:#3182F6; font-weight:800; margin-top:16px; background:#E8F3FF; padding:12px; border-radius:12px; border:1px dashed #B1D6FF; text-align:center; word-break:keep-all; line-height:1.4;';
        resultBox.appendChild(noteEl);
    }
    noteEl.innerHTML = `💡 저울과 젖병 눈금에 맞춘 <b>현실 레시피</b>예요!<br>이렇게 끓이면 약 <b>${finalYieldG.toLocaleString()}g</b> 정도 완성돼요.`;
}