 /**
 * VisBET - Main Application Script (Enhanced Edition)
 * Включает Live-события, динамическую блокировку и Realtime-коэффициенты
 */

let selectedOutcomes = []; // Выбранные ставки
let currentFilter = 'Все';

// --- Инициализация при загрузке ---
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
    checkAuth();
    
    // Запуск Realtime-симуляции (изменение коэффициентов и статусов)
    startRealtimeEngine();

    const stakeInput = document.getElementById('stakeAmount');
    if (stakeInput) {
        stakeInput.addEventListener('input', calculateWin);
    }

    // Initialize mobile touch support
    initializeMobileSupport();
});

// --- Mobile Touch Support ---
function initializeMobileSupport() {
    // Detect if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.documentElement.classList.add('is-mobile');
        
        // Prevent default zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Add swipe gesture support for navigation
        addSwipeSupport();
    }

    // Optimize for touch: add visual feedback
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.odd-box, .vb-btn, .nav-link, .mobile-tabbar button, .filter-chip')) {
            e.target.closest('.odd-box, .vb-btn, .nav-link, .mobile-tabbar button, .filter-chip').style.opacity = '0.7';
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (e.target.closest('.odd-box, .vb-btn, .nav-link, .mobile-tabbar button, .filter-chip')) {
            e.target.closest('.odd-box, .vb-btn, .nav-link, .mobile-tabbar button, .filter-chip').style.opacity = '1';
        }
    }, { passive: true });

    // Smooth scroll behavior
    if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
}

// Swipe gesture support
let touchStartX = 0;
let touchEndX = 0;

function addSwipeSupport() {
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        // Swipe left - next section
        if (diff > 0) {
            // Left swipe
        }
        // Swipe right - previous section
        else {
            // Right swipe
        }
    }
}

// --- 1. Realtime & Live Engine ---
function startRealtimeEngine() {
    setInterval(() => {
        sportsData.forEach(match => {
            // 1. Симуляция счета для LIVE матчей
            if (match.isLive && Math.random() > 0.95) {
                match.score.home += (Math.random() > 0.5 ? 1 : 0);
                match.score.away += (Math.random() > 0.7 ? 1 : 0);
            }

            // 2. Симуляция изменения коэффициентов
            match.markets.forEach(market => {
                market.outcomes.forEach(o => {
                    // Рандомное изменение кф на +/- 0.01-0.05
                    if (Math.random() > 0.8) {
                        const change = (Math.random() * 0.1 - 0.05);
                        o.odd = Math.max(1.01, parseFloat((o.odd + change).toFixed(2)));
                    }
                });
            });

            // 3. Симуляция блокировки (Locked)
            // Если в LIVE происходит опасный момент, блокируем ставки
            if (match.isLive) {
                match.isLocked = Math.random() > 0.9; 
            }
        });

        // Частичное обновление интерфейса без полной перерисовки (если не открыты детали)
        const detailsOpen = document.querySelector('.details-view');
        if (!detailsOpen) {
            renderEvents();
        } else {
            // Если открыты детали, можно обновлять только их (по желанию)
            updateLiveIndicators(); 
        }
        
        // Синхронизация купона, если коэффициенты изменились
        syncCouponOdds();
    }, 3000); // Обновление каждые 3 секунды
}

// Обновление кф в купоне, если они изменились в базе данных
function syncCouponOdds() {
    let changed = false;
    selectedOutcomes.forEach(selected => {
        const match = sportsData.find(m => m.id === selected.matchId);
        if (match) {
            match.markets.forEach(m => {
                const actualOutcome = m.outcomes.find(o => o.label === selected.outcomeLabel);
                if (actualOutcome && actualOutcome.odd !== selected.odd) {
                    selected.odd = actualOutcome.odd;
                    changed = true;
                }
            });
        }
    });
    if (changed) updateCouponUI();
}

// --- 2. Навигация и Фильтры ---
function switchTab(tabId, element = null) {
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${tabId}-view`);
    if (targetView) targetView.classList.add('active');

    if (tabId === 'profile') renderHistory();
    if (tabId === 'line') {
        currentFilter = 'Все';
        renderEvents();
    }
}

function filterSport(name) {
    currentFilter = name.trim();
    const filterItems = document.querySelectorAll('#sportFilter li');
    filterItems.forEach(li => {
        const liText = li.innerText.replace(/\s+/g, ' ').trim();
        if (liText.includes(currentFilter) || (currentFilter === 'Все' && liText.includes('Все'))) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
    switchTab('line');
    renderEvents();
}

// --- 3. Рендеринг событий ---
function renderEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = currentFilter === 'Все' 
        ? sportsData 
        : sportsData.filter(s => s.sport === currentFilter);

    filtered.forEach(match => {
        const card = document.createElement('div');
        card.className = `match-card glass animation-fade ${match.isLocked ? 'locked' : ''}`;
        
        const previewMarket = match.markets[0];
        const liveBadge = match.isLive ? `<span class="badge-live">LIVE ${match.score.home}:${match.score.away}</span>` : '';
        const lockIcon = match.isLocked ? '<i class="fas fa-lock icon-lock"></i>' : '';

        card.innerHTML = `
            <div class="match-info-click" onclick="openMatchDetails(${match.id})" style="cursor:pointer">
                <div class="match-header">
                    <span>${match.league} | ${match.date} ${match.time}</span>
                    ${liveBadge}
                </div>
                <div class="match-teams">
                    ${match.teams.home} — ${match.teams.away}
                </div>
            </div>
            <div class="match-markets">
                <div class="market-row">
                    <div class="odds-row">
                        ${match.isLocked ? '<div class="locked-overlay">Прием ставок приостановлен</div>' : ''}
                        ${previewMarket.outcomes.map(o => `
                            <button class="odd-box" 
                                ${match.isLocked ? 'disabled' : ''} 
                                onclick="addToCoupon(${match.id}, '${match.teams.home}-${match.teams.away}', '${o.label}', ${o.odd})">
                                <span class="label">${o.label}</span>
                                <span class="val">${o.odd}</span>
                            </button>
                        `).join('')}
                        <button class="odd-box more-btn" onclick="openMatchDetails(${match.id})">+</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 4. Детальная роспись ---
function openMatchDetails(matchId) {
    const match = sportsData.find(m => m.id === matchId);
    const container = document.getElementById('eventsContainer');
    
    container.innerHTML = `
        <div class="details-view animation-fade">
            <button class="btn-secondary" onclick="renderEvents()" style="margin-bottom:20px; cursor:pointer">← Назад к списку</button>
            
            <div class="match-hero glass ${match.isLive ? 'live-hero' : ''}">
                <div class="league-tag">${match.sport} | ${match.league} ${match.isLive ? '• LIVE' : ''}</div>
                <div class="hero-teams">
                    <div class="team-big">${match.teams.home}</div>
                    <div class="score-big">${match.isLive ? `${match.score.home} : ${match.score.away}` : 'VS'}</div>
                    <div class="team-big">${match.teams.away}</div>
                </div>
                <div class="match-time">${match.isLive ? 'Матч в эфире' : 'Начало: ' + match.date + ', ' + match.time}</div>
            </div>

            <div class="detailed-markets ${match.isLocked ? 'locked-section' : ''}">
                ${match.markets.map(market => `
                    <div class="market-block glass">
                        <h4>${market.name} ${match.isLocked ? '🔒' : ''}</h4>
                        <div class="market-grid">
                            ${market.outcomes.map(o => `
                                <button class="odd-box" 
                                    ${match.isLocked ? 'disabled' : ''} 
                                    onclick="addToCoupon(${match.id}, '${match.teams.home}-${match.teams.away}', '${o.label}', ${o.odd})">
                                    <span class="label">${o.label}</span>
                                    <span class="val">${o.odd}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

// --- 3.5 Live Matches with Countdown ---
function renderLive() {
    const container = document.getElementById('liveContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get matches starting soon (within 5 minutes)
    const now = new Date();
    const soonMatches = sportsData.filter(m => {
        if (m.isLive) return true;
        
        // Parse time to check if within 5 minutes
        const [hours, minutes] = m.time.split(':').map(Number);
        const matchTime = new Date();
        matchTime.setHours(hours, minutes, 0);
        
        const diffMinutes = (matchTime - now) / (1000 * 60);
        return diffMinutes >= -5 && diffMinutes <= 5;
    });
    
    if (soonMatches.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Нет активных или скоро начинающихся матчей</p>';
        return;
    }
    
    soonMatches.forEach(match => {
        const isLiveNow = match.isLive;
        const countdownElement = document.createElement('div');
        countdownElement.className = 'live-match-card glass';
        countdownElement.dataset.matchId = match.id;
        countdownElement.innerHTML = `
            <div style="display: flex; gap: 20px; padding: 20px; align-items: center;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="background: ${isLiveNow ? '#ff4d4d' : '#ffaa00'}; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">
                            ${isLiveNow ? 'LIVE' : 'СКОРО'}
                        </span>
                        <span style="color: var(--turquoise); font-weight: 700;">${match.league}</span>
                    </div>
                    <h3 style="margin: 10px 0; font-size: 18px; font-weight: 900;">
                        ${match.teams.home} vs ${match.teams.away}
                    </h3>
                    <div style="display: flex; gap: 20px; margin: 10px 0;">
                        <div>
                            <span style="color: var(--text-muted); font-size: 12px;">Начало:</span>
                            <div style="font-weight: 700;">${match.date} ${match.time}</div>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 12px;">Коэффициент:</span>
                            <div style="font-weight: 700; color: var(--turquoise);">${match.markets[0]?.outcomes[0]?.odd || '—'}</div>
                        </div>
                    </div>
                    <div id="countdown-${match.id}" style="color: var(--turquoise); font-weight: 700; font-size: 14px; margin-top: 8px;">
                        ${isLiveNow ? 'Матч в эфире 🔴' : 'Начинается через...'}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 900; color: var(--turquoise); margin-bottom: 10px;">
                        ${isLiveNow ? `${match.score.home}:${match.score.away}` : '0:0'}
                    </div>
                    <button class="btn-submit-bet" onclick="openMatchDetails(${match.id})" style="padding: 10px 20px;">
                        Ставка
                    </button>
                </div>
            </div>
        `;
        container.appendChild(countdownElement);
        
        if (!isLiveNow) {
            startCountdown(match.id, match.time);
        }
    });
}

function startCountdown(matchId, matchTime) {
    const updateCountdown = () => {
        const countdownEl = document.getElementById(`countdown-${matchId}`);
        if (!countdownEl) return;
        
        const [hours, minutes] = matchTime.split(':').map(Number);
        const now = new Date();
        const matchTimeObj = new Date();
        matchTimeObj.setHours(hours, minutes, 0);
        
        const diff = matchTimeObj - now;
        
        if (diff <= 0) {
            countdownEl.innerHTML = 'Матч начался! 🔴';
            return;
        }
        
        const totalSeconds = Math.floor(diff / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        countdownEl.innerHTML = `Начинается через ${mins}:${String(secs).padStart(2, '0')} ⏱️`;
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// --- 4. Детальная роспись ---
function addToCoupon(matchId, matchName, outcomeLabel, odd) {
    const match = sportsData.find(m => m.id === matchId);
    if (match && match.isLocked) {
        alert("Извините, прием ставок на это событие временно заблокирован.");
        return;
    }

    if (selectedOutcomes.some(item => item.matchId === matchId)) {
        alert("Это событие уже добавлено. Выберите другой матч для экспресса.");
        return;
    }

    selectedOutcomes.push({ matchId, matchName, outcomeLabel, odd });
    updateCouponUI();
}

function removeFromCoupon(matchId) {
    selectedOutcomes = selectedOutcomes.filter(item => item.matchId !== matchId);
    updateCouponUI();
}

function updateCouponUI() {
    const list = document.getElementById('couponList');
    const oddsElem = document.getElementById('finalOdds');
    const typeBadge = document.getElementById('betType');
    
    if (selectedOutcomes.length === 0) {
        list.innerHTML = '<div class="empty-coupon">Ваш купон пуст.</div>';
        oddsElem.innerText = '0.00';
        typeBadge.innerText = 'Ординар';
        calculateWin();
        return;
    }

    list.innerHTML = selectedOutcomes.map(item => `
        <div class="coupon-item animation-fade">
            <div class="ci-top">
                <strong>${item.matchName}</strong>
                <button onclick="removeFromCoupon(${item.matchId})">✕</button>
            </div>
            <div class="ci-bottom">
                <span>${item.outcomeLabel}</span>
                <span class="ci-odd">${item.odd}</span>
            </div>
        </div>
    `).join('');

    let totalOdd = selectedOutcomes.reduce((acc, curr) => acc * curr.odd, 1);
    typeBadge.innerText = selectedOutcomes.length > 1 ? 'Экспресс' : 'Ординар';
    oddsElem.innerText = totalOdd.toFixed(2);
    calculateWin();
}

function calculateWin() {
    const amount = parseFloat(document.getElementById('stakeAmount').value) || 0;
    const totalOdd = parseFloat(document.getElementById('finalOdds').innerText) || 0;
    const winField = document.getElementById('winAmount');
    if (winField) {
        winField.innerText = (amount * totalOdd).toFixed(2) + ' ₽';
    }
}

// --- 6. Заключение Пари ---
function confirmBet() {
    const session = JSON.parse(localStorage.getItem('visbet_session'));
    
    if (!session) {
        alert("Необходимо войти в аккаунт.");
        openModal('loginModal');
        return;
    }

    if (selectedOutcomes.length === 0) return;

    const amount = parseFloat(document.getElementById('stakeAmount').value);
    if (!amount || amount < 10) {
        alert("Минимальная ставка — 10 ₽.");
        return;
    }

    // Проверка на Locked перед самой ставкой
    const hasLocked = selectedOutcomes.some(item => {
        const m = sportsData.find(sd => sd.id === item.matchId);
        return m && m.isLocked;
    });

    if (hasLocked) {
        alert("Одно или несколько событий в купоне заблокированы. Удалите их.");
        return;
    }

    if (amount > session.balance) {
        alert("Недостаточно средств.");
        return;
    }

    const totalOdd = parseFloat(document.getElementById('finalOdds').innerText);
    const betData = {
        id: Date.now(),
        type: selectedOutcomes.length > 1 ? 'Экспресс' : 'Ординар',
        events: [...selectedOutcomes],
        totalOdd: totalOdd,
        stake: amount,
        potentialWin: (amount * totalOdd).toFixed(2),
        status: 'В игре',
        date: new Date().toLocaleString()
    };

    saveBetToHistory(betData, amount);
    alert(`Пари принято!`);
    
    selectedOutcomes = [];
    document.getElementById('stakeAmount').value = '';
    updateCouponUI();
    checkAuth(); 
}

// --- История и Модалки ---
function renderHistory() {
    const session = JSON.parse(localStorage.getItem('visbet_session'));
    const container = document.getElementById('historyContainer');
    if (!container || !session) return;
    
    if (!session.history || session.history.length === 0) {
        container.innerHTML = `<div class="glass" style="padding:20px; text-align:center;">Истории пока нет.</div>`;
        return;
    }

    container.innerHTML = session.history.map(bet => `
        <div class="history-item glass animation-fade">
            <div class="hi-header">
                <span>${bet.type} #${bet.id.toString().slice(-5)}</span>
                <span class="status-badge">${bet.status}</span>
            </div>
            <div class="hi-details">
                ${bet.events.map(e => `<div>• ${e.matchName} — <b>${e.outcomeLabel}</b> (${e.odd})</div>`).join('')}
            </div>
            <div class="hi-footer">
                <span>Ставка: ${bet.stake} ₽</span>
                <span style="color:var(--turquoise)">Кф: ${bet.totalOdd.toFixed(2)}</span>
            </div>
        </div>
    `).join('');
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
// Функции для мобильной навигации
window.showHistory = function() {
    // Если у тебя есть вкладка с историей, переключаем на неё
    const historyTab = document.getElementById('history-section') || document.querySelector('.history-container');
    if (historyTab) {
        document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
        historyTab.classList.add('active');
    } else {
        // Если отдельной вкладки нет, можем просто прокрутить к истории или вывести алерт
        console.log("Открываем историю ставок...");
        // Логика открытия истории из твоего main.js
        if(typeof renderHistory === "function") renderHistory();
    }
};

