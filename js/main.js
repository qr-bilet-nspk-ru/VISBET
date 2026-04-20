/**
 * VisBET - Main Application Script
 * Логика фильтрации, управления купоном и личного кабинета
 */

let selectedOutcomes = []; // Выбранные ставки
let currentFilter = 'Все';

// --- Инициализация при загрузке ---
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
    checkAuth();
    
    // Живой расчет суммы выигрыша при вводе суммы ставки
    const stakeInput = document.getElementById('stakeAmount');
    if (stakeInput) {
        stakeInput.addEventListener('input', calculateWin);
    }
});

// --- 1. Навигация и Фильтры ---
function switchTab(tabId, element = null) {
    // Обновляем визуальный статус кнопок навигации (Верхнее меню)
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    // Переключаем видимость контейнеров
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${tabId}-view`);
    if (targetView) targetView.classList.add('active');

    // Специфическая логика для разделов
    if (tabId === 'profile') renderHistory();
    if (tabId === 'line') {
        currentFilter = 'Все';
        renderEvents();
    }
}

function filterSport(name) {
    // 1. Приводим название к единому формату
    currentFilter = name.trim();
    
    // 2. Обновляем визуальный активный статус в меню
    const filterItems = document.querySelectorAll('#sportFilter li');
    filterItems.forEach(li => {
        // Очищаем текст внутри li от лишних пробелов и переносов для сравнения
        const liText = li.innerText.replace(/\s+/g, ' ').trim();
        
        // Если текст совпадает или это кнопка "Все события"
        if (liText.includes(currentFilter) || (currentFilter === 'Все' && liText.includes('Все'))) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    // 3. Важно: сбрасываем вид на главную страницу линии
    switchTab('line');
    
    // 4. Перерисовываем события из актуальной базы данных
    renderEvents();
}

// --- 2. Рендеринг событий (Линия) ---
function renderEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = currentFilter === 'Все' 
        ? sportsData 
        : sportsData.filter(s => s.sport === currentFilter);

    filtered.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card glass animation-fade';
        
        // Берем первый рынок (Основной исход) для отображения в ленте
        const previewMarket = match.markets[0];

        card.innerHTML = `
            <div class="match-info-click" onclick="openMatchDetails(${match.id})" style="cursor:pointer">
                <div class="match-header">
                    <span>${match.league} | ${match.date} ${match.time}</span>
                </div>
                <div class="match-teams">
                    ${match.teams.home} — ${match.teams.away}
                </div>
            </div>
            <div class="match-markets">
                <div class="market-row">
                    <div class="odds-row">
                        ${previewMarket.outcomes.map(o => `
                            <button class="odd-box" onclick="addToCoupon(${match.id}, '${match.teams.home}-${match.teams.away}', '${o.label}', ${o.odd})">
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

// --- 3. Глубокая роспись матча (Deep Markets) ---
function openMatchDetails(matchId) {
    const match = sportsData.find(m => m.id === matchId);
    const container = document.getElementById('eventsContainer');
    
    container.innerHTML = `
        <div class="details-view animation-fade">
            <button class="btn-secondary" onclick="renderEvents()" style="margin-bottom:20px; cursor:pointer">← Назад к списку</button>
            
            <div class="match-hero glass">
                <div class="league-tag">${match.sport} | ${match.league}</div>
                <div class="hero-teams">
                    <div class="team-big">${match.teams.home}</div>
                    <div class="vs">VS</div>
                    <div class="team-big">${match.teams.away}</div>
                </div>
                <div class="match-time">Начало: ${match.date}, ${match.time}</div>
            </div>

            <div class="detailed-markets">
                ${match.markets.map(market => `
                    <div class="market-block glass">
                        <h4>${market.name}</h4>
                        <div class="market-grid">
                            ${market.outcomes.map(o => `
                                <button class="odd-box" onclick="addToCoupon(${match.id}, '${match.teams.home}-${match.teams.away}', '${o.label}', ${o.odd})">
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

// --- 4. Логика Купона ---
function addToCoupon(matchId, matchName, outcomeLabel, odd) {
    // Ограничение: нельзя ставить на разные исходы одного и того же матча в экспрессе
    if (selectedOutcomes.some(item => item.matchId === matchId)) {
        alert("Это событие уже добавлено в купон. Выберите другое для экспресса.");
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
        list.innerHTML = '<div class="empty-coupon">Ваш купон пуст. Выберите коэффициент для начала игры.</div>';
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

    // Коэффициент экспресса — произведение всех кф
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

// --- 5. Заключение Пари (Фикс кнопки) ---
function confirmBet() {
    const session = JSON.parse(localStorage.getItem('visbet_session'));
    
    if (!session) {
        alert("Для заключения пари необходимо войти в аккаунт.");
        openModal('loginModal');
        return;
    }

    if (selectedOutcomes.length === 0) {
        alert("Сначала выберите событие.");
        return;
    }

    const amount = parseFloat(document.getElementById('stakeAmount').value);
    if (!amount || amount < 10) {
        alert("Минимальная сумма ставки — 10 ₽.");
        return;
    }

    if (amount > session.balance) {
        alert("Недостаточно средств на балансе. Пожалуйста, пополните счет.");
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

    // Вызов функции сохранения из auth.js
    saveBetToHistory(betData, amount);
    
    alert(`Пари принято! Желаем удачи!`);
    
    // Очистка купона
    selectedOutcomes = [];
    document.getElementById('stakeAmount').value = '';
    updateCouponUI();
    
    // Обновление интерфейса (баланс и история)
    checkAuth(); 
    if (document.getElementById('profile-view').classList.contains('active')) {
        renderHistory();
    }
}

// --- 6. История ставок (Личный кабинет) ---
function renderHistory() {
    const session = JSON.parse(localStorage.getItem('visbet_session'));
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    if (!session || !session.history || session.history.length === 0) {
        container.innerHTML = `
            <div class="glass" style="padding:40px; text-align:center; color:var(--text-muted)">
                У вас пока нет активных или завершенных пари.
            </div>
        `;
        return;
    }

    container.innerHTML = session.history.map(bet => `
        <div class="history-item glass animation-fade">
            <div class="hi-header">
                <span>${bet.type} #${bet.id.toString().slice(-5)} | ${bet.date}</span>
                <span class="status-badge">${bet.status}</span>
            </div>
            <div class="hi-details">
                ${bet.events.map(e => `
                    <div style="margin-bottom:5px">• ${e.matchName} — <b>${e.outcomeLabel}</b> (кф. ${e.odd})</div>
                `).join('')}
            </div>
            <div class="hi-footer">
                <span>Ставка: <b>${bet.stake} ₽</b></span>
                <span>Общий кф: <b>${bet.totalOdd.toFixed(2)}</b></span>
                <span style="color:var(--turquoise)">Возможный выигрыш: <b>${bet.potentialWin} ₽</b></span>
            </div>
        </div>
    `).join('');
}

// Утилиты для модалок
function openModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
}