// ==========================================
// 🧸 육아메이트 장난감 & 놀이 AI 엔진 V2.0 (버그 픽스 및 통합 필터링 완료)
// ==========================================
let isFavViewMode = false; 

if (!Kakao.isInitialized()) {
    Kakao.init('68bca10ddfe2ec67112b07eb9a08da2b'); // 파트너님 키
}

// ✨ 통합 필터링을 위한 전역 상태 관리
let globalMilestone = 'all'; 
let currentToyTheme = 'all';

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalBabyProfile(); // 아기 개월수 세팅 및 초기 렌더링
    
    // (장난감 탭) 마일스톤 칩 클릭 이벤트
    const msChips = document.querySelectorAll('.ms-chip');
    const themeCards = document.querySelectorAll('.theme-card');

    msChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            msChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            globalMilestone = e.target.getAttribute('data-milestone');
            updateToyView(); // ✨ 통합 필터링 함수 호출
            
            document.getElementById('view-toy-gear').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // (장난감 탭) SOS 테마 카드 클릭 이벤트
    themeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 이미 선택된 테마를 다시 누르면 선택 해제 (전체보기)
            if (e.currentTarget.classList.contains('active')) {
                e.currentTarget.classList.remove('active');
                currentToyTheme = 'all';
            } else {
                themeCards.forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentToyTheme = e.currentTarget.getAttribute('data-theme');
            }
            
            updateToyView(); // ✨ 통합 필터링 함수 호출
            document.getElementById('view-toy-gear').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

function applyGlobalBabyProfile() {
    const birthStr = localStorage.getItem('tosil_startDate');
    let autoMilestone = 'all'; 

    if (birthStr) {
        const birthDate = new Date(birthStr);
        const today = new Date();
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        if (months < 0) months = 0;

        document.querySelectorAll('.dynamic-age-badge').forEach(b => {
            b.innerText = `생후 ${months}개월 맞춤`;
        });

        if (months <= 3) autoMilestone = 'tummy';
        else if (months <= 6) autoMilestone = 'flip';
        else if (months <= 9) autoMilestone = 'crawl';
        else autoMilestone = 'stand';
        
        globalMilestone = autoMilestone;

        const targetChip = document.querySelector(`.ms-chip[data-milestone="${autoMilestone}"]`);
        if (targetChip) {
            document.querySelectorAll('.ms-chip').forEach(c => c.classList.remove('active'));
            targetChip.classList.add('active');
        }
    }

    // 초기 화면 렌더링
    renderPlays(); 
    updateToyView(); 
}

// ✨ 테마 + 발달단계 교집합 통합 필터링 함수
function updateToyView() {
    if (isFavViewMode) return;

    const filteredData = toyData.filter(t => {
        const themeMatch = currentToyTheme === 'all' || t.theme === currentToyTheme;
        const msMatch = globalMilestone === 'all' || t.milestone === globalMilestone || t.milestone === 'all';
        return themeMatch && msMatch;
    });

    renderToys(filteredData);
}

// ==========================================
// 🔀 투 트랙 UI 스위치 로직
// ==========================================
function switchToyMainTab(tabId) {
    const btnPlay = document.getElementById('tab-btn-play');
    const btnGear = document.getElementById('tab-btn-gear');
    const viewPlay = document.getElementById('view-toy-play');
    const viewGear = document.getElementById('view-toy-gear');

    if (tabId === 'play') {
        btnPlay.style.background = '#FFFFFF'; btnPlay.style.color = '#191F28'; btnPlay.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnGear.style.background = 'transparent'; btnGear.style.color = '#8B95A1'; btnGear.style.boxShadow = 'none';
        viewPlay.style.display = 'block';
        viewGear.style.display = 'none';
    } else {
        btnGear.style.background = '#FFFFFF'; btnGear.style.color = '#191F28'; btnGear.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnPlay.style.background = 'transparent'; btnPlay.style.color = '#8B95A1'; btnPlay.style.boxShadow = 'none';
        viewPlay.style.display = 'none';
        viewGear.style.display = 'block';
    }
}

// ==========================================
// 🎈 TRACK 1: 놀이 처방전 (생존 엔진)
// ==========================================
let currentPlayCategory = 'all';

function filterPlays(category, btnEl) {
    document.querySelectorAll('.play-filter-btn').forEach(btn => {
        btn.style.background = '#FFFFFF'; btn.style.color = '#4E5968'; btn.style.border = '1px solid #E5E8EB';
    });
    btnEl.style.background = '#191F28'; btnEl.style.color = '#FFFFFF'; btnEl.style.border = 'none';
    currentPlayCategory = category;
    renderPlays();
    
    document.getElementById('view-toy-play').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPlays() {
    const container = document.getElementById('play-result-area');
    
    const filtered = playData.filter(p => {
        const catMatch = currentPlayCategory === 'all' || p.category === currentPlayCategory;
        const ageMatch = globalMilestone === 'all' || p.targetAge.includes(globalMilestone);
        return catMatch && ageMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px; border:1px dashed #D1D5DB; margin-top: 16px;">
                <div class="empty-icon" style="font-size:40px; margin-bottom:12px;">🥲</div>
                <div class="empty-text">
                    <b style="font-size:16px; color:#191F28; font-weight:800; display:block; margin-bottom:6px;">앗! 조건에 맞는 놀이가 없어요</b>
                    <span style="font-size:13px; color:#8B95A1;">다른 놀이 테마를 선택해 보세요.</span>
                </div>
            </div>`;
        return;
    }

    let html = '';
    filtered.forEach(p => {
        let badgeColor = '#3182F6', badgeBg = '#E8F3FF', badgeText = '🧸 국민템 뽕뽑기';
        
        if (p.category === 'zero') { badgeColor = '#059669'; badgeBg = '#ECFDF5'; badgeText = '🏠 0원 집구석 놀이'; }
        else if (p.category === 'dad') { badgeColor = '#E32636'; badgeBg = '#FFF2F2'; badgeText = '🏋️ 아빠 육체노동'; }
        else if (p.category === 'lieDown') { badgeColor = '#8B5CF6'; badgeBg = '#F5F3FF'; badgeText = '🛌 합법적 눕육아'; }
        else if (p.category === 'poop') { badgeColor = '#D97706'; badgeBg = '#FFFBEB'; badgeText = '💩 장운동 쾌변 기원'; }
        else if (p.category === 'sick') { badgeColor = '#EA580C'; badgeBg = '#FFEDD5'; badgeText = '🤒 껌딱지 진정 놀이'; }

        const stepsHtml = p.steps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('');

        html += `
        <div style="background: #FFFFFF; border-radius: 20px; padding: 24px; border: 1px solid #E5E8EB; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="display: inline-block; padding: 6px 10px; border-radius: 8px; background: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 800; margin-bottom: 12px;">${badgeText}</div>
            
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900; color: #191F28;">${p.title}</h3>
            <p style="margin: 0 0 16px 0; font-size: 13.5px; font-weight: 600; color: #8B95A1; line-height: 1.4;">${p.desc}</p>
            
            <div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #F2F5F8;">
                <div style="font-size: 13px; color: #4E5968; margin-bottom: 6px;"><b>준비물:</b> ${p.targetItem}</div>
                <div style="font-size: 13px; color: #4E5968;"><b>체력소모:</b> ${p.energyDrain}</div>
            </div>

            <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14.5px; font-weight: 700; color: #191F28; line-height: 1.6;">
                ${stepsHtml}
            </ul>

            <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 14px; border-radius: 12px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 900; color: #D97706; margin-bottom: 4px;">👨‍🔧 아빠의 역할</div>
                <div style="font-size: 13px; font-weight: 700; color: #B45309;">${p.dadRole}</div>
            </div>

            <div style="display: flex; gap: 8px;">
                <button id="timer-btn-${p.id}" onclick="startPlayTimer('${p.id}', ${p.playTime})" style="flex: 1.2; padding: 14px; border-radius: 12px; background: #191F28; color: #FFF; font-weight: 800; font-size: 14px; border: none; cursor: pointer; transition: 0.2s;">
                    ⏱️ ${p.playTime}분 버티기 시작
                </button>
                <button onclick="sharePlayMission('${p.id}')" style="flex: 1; padding: 14px; border-radius: 12px; background: #FEE500; color: #191919; font-weight: 800; font-size: 13.5px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    💬 아빠 미션전송
                </button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

let playTimers = {};
function startPlayTimer(playId, minutes) {
    const btn = document.getElementById(`timer-btn-${playId}`);
    const p = playData.find(x => x.id === playId); 
    
    if (playTimers[playId]) {
        clearInterval(playTimers[playId]);
        delete playTimers[playId];
        btn.innerHTML = `⏱️ ${minutes}분 버티기 시작`;
        btn.style.background = '#191F28'; btn.style.color = '#FFF'; btn.style.border = 'none';
        btn.style.boxShadow = 'none';
        btn.style.opacity = '1';
        return;
    }

    let secondsLeft = minutes * 60;
    btn.style.background = '#F0F7FF';
    btn.style.color = '#3182F6';
    btn.style.border = '1px solid #3182F6';

    playTimers[playId] = setInterval(() => {
        secondsLeft--;
        const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
        const s = (secondsLeft % 60).toString().padStart(2, '0');
        
        if(secondsLeft <= 60 && secondsLeft > 0) {
            btn.style.background = '#FFF2F2';
            btn.style.color = '#E32636';
            btn.style.border = '1px solid #FCA5A5';
        }

        btn.innerHTML = `⏳ <b>${m}:${s}</b> 버티는 중... (터치 시 정지)`;

        if (secondsLeft <= 0) {
            clearInterval(playTimers[playId]);
            delete playTimers[playId];
            
            let successText = '🎉 미션 완료! 엄마 아빠 최고! 💖';
            if (p) {
                if (p.category === 'dad') successText = '🎉 미션 완료! 아빠 체력 진짜 최고! 💪';
                else if (p.category === 'lieDown') successText = '🎉 눕육아 성공! 엄마 체력 충전 완료 🔋';
                else if (p.category === 'poop') successText = '🎉 미션 완료! 쾌변 기저귀 확인 요망 💩';
                else if (p.category === 'sick') successText = '🎉 미션 완료! 아기 컨디션 회복 💖';
            }
            
            btn.innerHTML = successText;
            btn.style.background = '#059669'; 
            btn.style.color = '#FFF'; 
            btn.style.border = 'none';
            btn.style.boxShadow = '0 0 15px rgba(5, 150, 105, 0.4)'; 
            
            let blink = false;
            let blinkInterval = setInterval(() => {
                btn.style.opacity = blink ? '1' : '0.8';
                blink = !blink;
            }, 500);
            
            setTimeout(() => {
                clearInterval(blinkInterval);
                btn.style.opacity = '1';
            }, 3000);
        }
    }, 1000);
}

function sharePlayMission(playId) {
    const p = playData.find(x => x.id === playId);
    if (!p) return;

    Kakao.Share.sendDefault({
        objectType: 'text',
        text: `🚨 [긴급 육아 미션 도착]\n\n여보, 오늘 퇴근하고 아기랑 이렇게 놀아줘!\n\n🎈 놀이명: ${p.title}\n⏱️ 목표 시간: ${p.playTime}분\n👨‍🔧 당신의 역할: ${p.dadRole}`,
        link: {
            mobileWebUrl: 'https://happy-baby0303.github.io/baby-master/toy/index.html',
            webUrl: 'https://happy-baby0303.github.io/baby-master/toy/index.html',
        },
        buttons: [{ title: '미션 수락하기 🫡', link: { mobileWebUrl: 'https://happy-baby0303.github.io/baby-master/toy/index.html', webUrl: 'https://happy-baby0303.github.io/baby-master/toy/index.html' } }],
    });
}

// ==========================================
// 🛒 TRACK 2: 육아는 템빨 (장난감 렌더링)
// ==========================================
function toggleFavView() {
    isFavViewMode = !isFavViewMode;
    const btn = document.getElementById('btn-show-fav');
    
    if (isFavViewMode) {
        btn.innerHTML = '🔙 검색 화면으로 돌아가기';
        btn.style.background = '#F2F4F6'; btn.style.color = '#4E5968'; btn.style.borderColor = '#D1D5DB';
        renderFavorites();
    } else {
        btn.innerHTML = '❤️ 내가 찜한 장난감 모아보기';
        btn.style.background = '#FFF2F2'; btn.style.color = '#E32636'; btn.style.borderColor = '#FCA5A5';
        updateToyView(); // ✨ 에러가 나던 renderList(false)를 올바른 함수로 수정!
    }
}

function toggleFavorite(id) {
    let favs = JSON.parse(localStorage.getItem('favToys')) || [];
    // 숫자로 변환하여 비교 (데이터의 id가 숫자이므로)
    const numericId = parseInt(id, 10);
    
    if(favs.includes(numericId)) {
        favs = favs.filter(f => f !== numericId);
    } else {
        favs.push(numericId);
    }
    localStorage.setItem('favToys', JSON.stringify(favs));
    
    if (isFavViewMode) {
        renderFavorites(); 
    } else {
        const btn = document.getElementById(`fav-btn-${numericId}`);
        if (btn) {
            const isFav = favs.includes(numericId);
            btn.innerHTML = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
            btn.style.background = isFav ? '#FFF2F2' : '#F2F4F6';
            btn.style.color = isFav ? '#E32636' : '#4E5968';
            btn.style.borderColor = isFav ? '#FCA5A5' : '#E5E8EB';
        }
    }
}

function renderFavorites() {
    const resultArea = document.getElementById('toy-result-area');
    const favs = JSON.parse(localStorage.getItem('favToys')) || [];
    
    if (favs.length === 0) {
        resultArea.innerHTML = `
            <div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px; border:1px dashed #D1D5DB; margin-top: 16px;">
                <div class="empty-icon" style="font-size:40px; margin-bottom:12px;">💔</div>
                <div class="empty-text">
                    <b style="font-size:16px; color:#191F28; font-weight:800; display:block; margin-bottom:6px;">아직 찜한 장난감이 없어요!</b>
                    <span style="font-size:13px; color:#8B95A1;">마음에 드는 장난감에 하트(❤️)를 눌러보세요.</span>
                </div>
            </div>`;
        return;
    }
    const favItems = toyData.filter(item => favs.includes(item.id));
    resultArea.innerHTML = `<div style="font-weight:900; color:#E32636; margin-bottom:16px; margin-top:16px; font-size:16px;">❤️ 내 찜 보관함 (${favItems.length}개)</div>` 
                           + favItems.map(item => generateToyHTML(item, favs)).join('');
}

function renderToys(filteredData) {
    if(isFavViewMode) return;
    const resultArea = document.getElementById('toy-result-area');
    const favs = JSON.parse(localStorage.getItem('favToys')) || [];
    
    if (filteredData.length === 0) {
        resultArea.innerHTML = `
            <div class="premium-empty-state" style="padding:40px; text-align:center; background:#FFF; border-radius:16px; border:1px dashed #D1D5DB; margin-top: 16px;">
                <div class="empty-icon" style="font-size:40px; margin-bottom:12px;">🥲</div>
                <div class="empty-text">
                    <b style="font-size:16px; color:#191F28; font-weight:800; display:block; margin-bottom:6px;">해당 상황에 맞는 아이템이 없네요.</b>
                    <span style="font-size:13px; color:#8B95A1;">아기 월령이나 테마를 조금 바꿔보세요!</span>
                </div>
            </div>`;
        return;
    }
    resultArea.innerHTML = `<div style="font-weight:800; color:#191F28; margin-bottom:16px;">✨ 시간 확보 추천 라인업 (${filteredData.length}개)</div>` 
                           + filteredData.map(item => generateToyHTML(item, favs)).join('');
}

function generateToyHTML(toy, favs) {
    const isFav = favs ? favs.includes(toy.id) : false;
    const hIcon = isFav ? '❤️ 찜 해제' : '🤍 찜하기';
    const hBg = isFav ? '#FFF2F2' : '#F2F4F6';
    const hCol = isFav ? '#E32636' : '#4E5968';
    const hBor = isFav ? '#FCA5A5' : '#E5E8EB';

    const partnerCode = "flDiNnqr00"; // 파트너님 고유 파트너스 코드

    // ⚡ 1. 건전지 자동 할당 로직
    let batteryHtml = '';
    if (toy.battery && !toy.battery.includes("없음")) {
        let actualBatteryLink = "";
        if (toy.battery.includes("C형")) {
            actualBatteryLink = "https://link.coupang.com/a/fnbuI6bwpU"; 
        } else if (toy.battery.includes("AAA")) {
            actualBatteryLink = "https://link.coupang.com/a/fnb4qGk95o"; 
        } else if (toy.battery.includes("AA")) {
            actualBatteryLink = "https://link.coupang.com/a/fnbqrsnU2C"; 
        } else {
            actualBatteryLink = toy.batteryLink || `https://www.coupang.com/np/search?q=건전지&afag=${partnerCode}`;
        }

        batteryHtml = `
            <div style="background:#FFFBEB; padding:16px; border-radius:14px; font-size:13px; color:#B45309; border: 1px solid #FDE68A; line-height: 1.5; margin-top:16px;">
                <b style="color:#D97706; font-size: 13.5px; display:block; margin-bottom:4px;">⚡ 앗! 건전지 잊지 않으셨죠? (${toy.battery})</b>
                <a href="${actualBatteryLink}" target="_blank" style="display:inline-block; margin-top:4px; color:#D97706; font-weight:800; text-decoration:underline;">👉 로켓배송 건전지 같이 담기</a>
            </div>`;
    }

    // 🛒 2. 메인 장난감 쿠팡 링크 자동 할당
    const autoSearchLink = `https://www.coupang.com/np/search?q=${encodeURIComponent(toy.name)}&afag=${partnerCode}`;
    const isFallback = (!toy.coupangLink || toy.coupangLink.trim() === '');
    const finalLink = isFallback ? autoSearchLink : toy.coupangLink;
    const btnText = isFallback ? `🔍 쿠팡에서 '${toy.name}' 최저가 찾기 〉` : `🚀 로켓배송 최저가 바로가기 〉`;

    return `
        <div class="stroller-card" style="border-top: 4px solid transparent; margin-bottom: 24px; padding: 28px 24px; background:#FFF; border-radius:24px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #F2F5F8;">
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; gap: 12px;">
                <div style="display: flex; gap: 14px; align-items: center; flex: 1; min-width: 0;">
                    <div class="toy-img-placeholder" style="flex-shrink: 0; font-size: 32px;">${toy.imgIcon}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size:20px; font-weight:900; letter-spacing:-0.5px; color:#191F28; word-break:keep-all; line-height:1.4;">${toy.name}</div>
                        <div style="color: #3182F6; font-size: 13px; font-weight: 700; margin-top: 6px; word-break:keep-all;">${toy.tags}</div>
                    </div>
                </div>
                <!-- 따옴표 추가로 안정성 확보 -->
                <button id="fav-btn-${toy.id}" onclick="toggleFavorite('${toy.id}')" style="background:${hBg}; color:${hCol}; border:1px solid ${hBor}; padding:8px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; white-space:nowrap; flex-shrink:0;">
                    ${hIcon}
                </button>
            </div>

            <div style="background: #F9FAFB; padding: 16px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 16px;">
                <div style="font-size: 13px; font-weight: 800; color: #191F28; margin-bottom: 6px;">💡 AI 팩트체크</div>
                <div style="font-size: 13.5px; color: #4E5968; line-height: 1.5; font-weight: 600; word-break: keep-all;">${toy.fomo}</div>
            </div>

            <div style="background: #F9FAFB; padding: 20px 18px; border-radius: 14px; border: 1px solid #E5E8EB; margin-bottom: 24px;">
                <div style="font-weight: 900; color: #191F28; font-size: 14.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                    <span>⏳</span> 시간 확보 리포트
                </div>
                <div style="font-size: 14px; color: #059669; font-weight: 800; background: #ECFDF5; display: inline-block; padding: 8px 14px; border-radius: 10px; border: 1px solid #A7F3D0;">
                    ✅ 자유시간: 약 ${toy.freeTime} 확보
                </div>
            </div>

            <a href="${finalLink}" target="_blank" style="display:flex; justify-content:center; align-items:center; gap:8px; width:100%; background:#191F28; color:#FFFFFF; border:none; padding:18px 16px; border-radius:14px; font-weight:900; font-size:15px; cursor:pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.1); margin-bottom: 12px; text-decoration: none; transition: 0.2s;">
                ${btnText}
            </a>

            <button onclick="shareToHusbandToy('${toy.id}')" style="display:flex; justify-content:center; align-items:center; gap:8px; width:100%; background:#FEE500; color:#191919; border:none; padding:16px; border-radius:14px; font-weight:900; font-size:15px; cursor:pointer; box-shadow: 0 4px 12px rgba(254, 229, 0, 0.2); transition:0.2s;">
                <span style="font-size:18px;">💬</span> 남편에게 내 '자유시간' 사달라고 톡 보내기
            </button>

            <div style="font-size: 11.5px; color: #8B95A1; font-weight: 600; text-align: center; margin-top: 16px; line-height: 1.5; word-break: keep-all;">
                ※ 아이 입에 들어가는 장난감은 <b>[로켓배송]</b> 등 검증된 판매처 구매를 권장합니다.
            </div>

            ${batteryHtml}
        </div>
    `;
}

function shareToHusbandToy(id) {
    const toy = toyData.find(t => t.id == id);
    if(!toy) return;

    const partnerCode = "flDiNnqr00";
    const autoSearchLink = `https://www.coupang.com/np/search?q=${encodeURIComponent(toy.name)}&afag=${partnerCode}`;
    const isFallback = (!toy.coupangLink || toy.coupangLink.trim() === '');
    const finalLink = isFallback ? autoSearchLink : toy.coupangLink;

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `여보 나 오늘 너무 힘들어 😭`,
            description: `[${toy.name}] 이거 하나만 로켓으로 쏴줘. 나 ${toy.freeTime} 쉴 수 있대!`,
            imageUrl: 'https://happy-baby0303.github.io/baby-master/toy/og-image.png',
            link: { mobileWebUrl: finalLink, webUrl: finalLink },
        },
        buttons: [{ title: `💳 여보 찬스로 바로 결제하기`, link: { mobileWebUrl: finalLink, webUrl: finalLink } }]
    });
}