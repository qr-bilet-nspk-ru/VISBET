/**
 * VisBET - Firebase Cloud Auth
 */

// Авто-создание админа в облаке, если его еще нет
async function ensureAdminExists() {
    const { doc, getDoc, setDoc } = window.fb;
    const adminRef = doc(window.db, "users", "Admin");
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
        await setDoc(adminRef, {
            username: "Admin",
            password: "admintop",
            balance: 100000,
            history: [],
            role: "admin"
        });
        console.log("Аккаунт администратора создан в облаке.");
    }
}

// Функция Регистрации
async function register(username, password) {
    const { doc, getDoc, setDoc } = window.fb;
    const userRef = doc(window.db, "users", username);
    
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            alert("Этот логин уже занят!");
            return false;
        }

        const newUser = {
            username: username,
            password: password,
            balance: 1000, // Бонус при регистрации
            history: [],
            role: "user"
        };

        await setDoc(userRef, newUser);
        localStorage.setItem('visbet_session', JSON.stringify(newUser));
        alert("Регистрация успешна!");
        window.location.href = 'index.html';
        return true;
    } catch (e) {
        console.error("Ошибка регистрации:", e);
        alert("Ошибка сервера. Попробуйте позже.");
    }
}

// Функция Входа
async function handleLogin() {
    const userVal = document.getElementById('loginUser').value;
    const passVal = document.getElementById('loginPass').value;
    const { doc, getDoc } = window.fb;

    if(!userVal || !passVal) return alert("Заполните все поля!");

    try {
        const userRef = doc(window.db, "users", userVal);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().password === passVal) {
            const userData = userSnap.data();
            localStorage.setItem('visbet_session', JSON.stringify(userData));
            
            if(userData.username === 'Admin') {
                alert("Добро пожаловать, создатель!");
                window.location.href = 'admin.html';
            } else {
                alert(`Привет, ${userData.username}!`);
                location.reload();
            }
        } else {
            alert("Неверный логин или пароль!");
        }
    } catch (e) {
        console.error("Ошибка входа:", e);
        alert("Ошибка подключения к облаку.");
    }
}

// Обновление интерфейса (баланс и кнопки)
function checkAuth() {
    const session = JSON.parse(localStorage.getItem('visbet_session'));
    const authZone = document.getElementById('auth-zone');
    if (!authZone) return;

    if (session) {
        authZone.innerHTML = `
            <div class="user-info">
                <span class="balance" id="display-balance">${session.balance.toFixed(2)} ₽</span>
                <span class="username">${session.username}</span>
                ${session.username === 'Admin' ? 
                    '<button onclick="location.href=\'admin.html\'" style="background:var(--turquoise); color:#000; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:10px; font-weight:bold;">АДМИНКА</button>' : ''}
                <button class="btn-logout" onclick="logout()">Выйти</button>
            </div>
        `;
        // Запускаем фоновое обновление баланса из облака
        syncBalance(session.username);
    }
}

// Синхронизация баланса в реальном времени
async function syncBalance(username) {
    const { doc, getDoc } = window.fb;
    const userRef = doc(window.db, "users", username);
    const snap = await getDoc(userRef);
    if(snap.exists()) {
        const cloudData = snap.data();
        const display = document.getElementById('display-balance');
        if(display) display.innerText = cloudData.balance.toFixed(2) + " ₽";
        
        // Обновляем локальную сессию
        localStorage.setItem('visbet_session', JSON.stringify(cloudData));
    }
}

function logout() {
    localStorage.removeItem('visbet_session');
    window.location.href = 'index.html';
}

// Инициализируем Firebase сразу при загрузке, не дожидаясь задержек
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if(window.db) {
            ensureAdminExists().catch(console.error);
            checkAuth();
        }
    });
} else {
    if(window.db) {
        ensureAdminExists().catch(console.error);
        checkAuth();
    }
}