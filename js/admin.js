/**
 * VisBET Admin Core
 */

document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderAll();
});

// Переключение вкладок
function switchAdminTab(target, el) {
    document.querySelectorAll('.adm-content section').forEach(s => s.style.display = 'none');
    document.getElementById(`adm-${target}`).style.display = 'block';
    document.querySelectorAll('.adm-sidebar .nav-link').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    renderAll();
}

function renderAll() {
    renderAdminEvents();
    renderAdminUsers();
    renderAdminBets();
    updateStats();
}

// --- УПРАВЛЕНИЕ СОБЫТИЯМИ ---
function renderAdminEvents() {
    const events = JSON.parse(localStorage.getItem('visbet_events')) || [];
    const list = document.getElementById('eventsList');
    list.innerHTML = events.map(e => {
        const odds = e.markets[0].outcomes.map(o => o.odd).join(' / ');
        return `
            <tr>
                <td>${e.sport}</td>
                <td>${e.league}</td>
                <td>${e.teams.home} — ${e.teams.away}</td>
                <td>${e.date} ${e.time}</td>
                <td><b style="color:var(--turquoise)">${odds}</b></td>
                <td>
                    <button class="action-btn btn-edit" onclick="editEvent(${e.id})">Ред.</button>
                    <button class="action-btn btn-del" onclick="deleteEvent(${e.id})">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openEventModal() {
    document.getElementById('eventForm').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('modalTitle').innerText = 'Добавить новое событие';
    document.getElementById('eventModal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

document.getElementById('eventForm').onsubmit = function(e) {
    e.preventDefault();
    let events = JSON.parse(localStorage.getItem('visbet_events')) || [];
    const editId = document.getElementById('edit-id').value;

    const newEvent = {
        id: editId ? parseInt(editId) : Date.now(),
        sport: document.getElementById('ev-sport').value,
        league: document.getElementById('ev-league').value,
        teams: { home: document.getElementById('ev-t1').value, away: document.getElementById('ev-t2').value },
        date: document.getElementById('ev-date').value,
        time: document.getElementById('ev-time').value,
        status: 'Предстоит',
        markets: [{
            name: 'Основной исход',
            outcomes: [
                { label: 'П1', odd: parseFloat(document.getElementById('ev-p1').value) || 1.0 },
                { label: 'X', odd: parseFloat(document.getElementById('ev-px').value) || 1.0 },
                { label: 'П2', odd: parseFloat(document.getElementById('ev-p2').value) || 1.0 }
            ]
        }]
    };

    if(editId) {
        const idx = events.findIndex(ev => ev.id == editId);
        events[idx] = newEvent;
    } else {
        events.push(newEvent);
    }

    localStorage.setItem('visbet_events', JSON.stringify(events));
    closeEventModal();
    renderAll();
};

function editEvent(id) {
    const events = JSON.parse(localStorage.getItem('visbet_events'));
    const ev = events.find(e => e.id === id);
    
    document.getElementById('edit-id').value = ev.id;
    document.getElementById('ev-sport').value = ev.sport;
    document.getElementById('ev-league').value = ev.league;
    document.getElementById('ev-t1').value = ev.teams.home;
    document.getElementById('ev-t2').value = ev.teams.away;
    document.getElementById('ev-date').value = ev.date;
    document.getElementById('ev-time').value = ev.time;
    document.getElementById('ev-p1').value = ev.markets[0].outcomes[0].odd;
    document.getElementById('ev-px').value = ev.markets[0].outcomes[1].odd;
    document.getElementById('ev-p2').value = ev.markets[0].outcomes[2].odd;
    
    document.getElementById('modalTitle').innerText = 'Редактировать событие';
    document.getElementById('eventModal').style.display = 'flex';
}

function deleteEvent(id) {
    if(confirm('Удалить это событие из линии?')) {
        let events = JSON.parse(localStorage.getItem('visbet_events'));
        events = events.filter(e => e.id !== id);
        localStorage.setItem('visbet_events', JSON.stringify(events));
        renderAll();
    }
}

// --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---
function renderAdminUsers() {
    const users = JSON.parse(localStorage.getItem('visbet_users')) || [];
    const list = document.getElementById('usersList');
    list.innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td style="font-size:10px; opacity:0.3">${u.password}</td>
            <td><input type="number" value="${u.balance}" class="input-balance" onchange="updateUserBalance('${u.username}', this.value)"></td>
            <td>${u.history.length}</td>
            <td><button class="action-btn btn-del" onclick="deleteUser('${u.username}')">Бан</button></td>
        </tr>
    `).join('');
}

function updateUserBalance(user, val) {
    let users = JSON.parse(localStorage.getItem('visbet_users'));
    const idx = users.findIndex(u => u.username === user);
    users[idx].balance = parseFloat(val);
    localStorage.setItem('visbet_users', JSON.stringify(users));
    
    // Синхронизация сессии, если админ правит себя
    const s = JSON.parse(localStorage.getItem('visbet_session'));
    if(s.username === user) { s.balance = parseFloat(val); localStorage.setItem('visbet_session', JSON.stringify(s)); }
    updateStats();
}

// --- РАСЧЕТ СТАВОК (ВЫПЛАТЫ) ---
function renderAdminBets() {
    const users = JSON.parse(localStorage.getItem('visbet_users')) || [];
    const list = document.getElementById('betsList');
    list.innerHTML = '';

    users.forEach(u => {
        u.history.forEach(bet => {
            if(bet.status === 'В игре') {
                list.innerHTML += `
                    <tr>
                        <td><b>${u.username}</b></td>
                        <td>${bet.type}</td>
                        <td>${bet.events.map(e => `${e.matchName} (${e.outcomeLabel})`).join('<br>')}</td>
                        <td>${bet.stake} ₽</td>
                        <td>${bet.totalOdd}</td>
                        <td style="color:var(--turquoise)">${bet.potentialWin} ₽</td>
                        <td>
                            <button class="action-btn btn-win" onclick="resolveBet('${u.username}', ${bet.id}, 'Выигрыш')">WIN</button>
                            <button class="action-btn btn-loss" onclick="resolveBet('${u.username}', ${bet.id}, 'Проигрыш')">LOSS</button>
                        </td>
                    </tr>
                `;
            }
        });
    });
}

function resolveBet(username, betId, result) {
    let users = JSON.parse(localStorage.getItem('visbet_users'));
    const uIdx = users.findIndex(u => u.username === username);
    const bIdx = users[uIdx].history.findIndex(b => b.id === betId);
    
    const bet = users[uIdx].history[bIdx];
    bet.status = result;

    if(result === 'Выигрыш') {
        users[uIdx].balance += parseFloat(bet.potentialWin);
    }

    localStorage.setItem('visbet_users', JSON.stringify(users));
    
    // Синхронизация сессии
    const s = JSON.parse(localStorage.getItem('visbet_session'));
    if(s && s.username === username) {
        s.balance = users[uIdx].balance;
        s.history = users[uIdx].history;
        localStorage.setItem('visbet_session', JSON.stringify(s));
    }
    renderAll();
}

// Дополнительный функционал: Статистика
function updateStats() {
    const users = JSON.parse(localStorage.getItem('visbet_users')) || [];
    const events = JSON.parse(localStorage.getItem('visbet_events')) || [];
    
    let totalMoney = 0;
    let activeBets = 0;
    
    users.forEach(u => {
        totalMoney += u.balance;
        u.history.forEach(b => { if(b.status === 'В игре') activeBets++; });
    });

    document.getElementById('stat-users').innerText = users.length;
    document.getElementById('stat-money').innerText = totalMoney.toFixed(2) + ' ₽';
    document.getElementById('stat-bets').innerText = activeBets;
}