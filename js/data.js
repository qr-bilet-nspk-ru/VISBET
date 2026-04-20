/**
 * VisBET Database Script
 * Хранение событий и синхронизация с LocalStorage
 */

// 1. Исходный массив событий (используется только при первом запуске сайта)
const initialEvents = [
    // ФУТБОЛ
    {
        id: 1, 
        sport: 'Футбол', 
        league: 'Лига Чемпионов', 
        teams: { home: 'Реал Мадрид', away: 'Манчестер Сити' }, 
        date: '2026-04-21', 
        time: '22:00',
        status: 'Предстоит',
        markets: [
            { name: 'Основной исход', outcomes: [{ label: 'П1', odd: 2.45 }, { label: 'X', odd: 3.60 }, { label: 'П2', odd: 2.80 }] },
            { name: 'Тотал голов (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 1.85 }, { label: 'ТМ 2.5', odd: 2.05 }] },
            { name: 'Обе забьют', outcomes: [{ label: 'Да', odd: 1.65 }, { label: 'Нет', odd: 2.20 }] },
            { name: 'Желтые карточки', outcomes: [{ label: 'ТБ 3.5', odd: 1.90 }, { label: 'ТМ 3.5', odd: 1.90 }] },
            { name: 'Угловые', outcomes: [{ label: 'ТБ 9.5', odd: 1.85 }, { label: 'ТМ 9.5', odd: 1.85 }] }
        ]
    },
    {
        id: 2, 
        sport: 'Футбол', 
        league: 'АПЛ', 
        teams: { home: 'Арсенал', away: 'Ливерпуль' }, 
        date: '2026-04-23', 
        time: '21:45',
        status: 'Предстоит',
        markets: [
            { name: 'Основной исход', outcomes: [{ label: 'П1', odd: 2.10 }, { label: 'X', odd: 3.40 }, { label: 'П2', odd: 3.20 }] },
            { name: 'Тотал голов (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 1.70 }, { label: 'ТМ 2.5', odd: 2.15 }] },
            { name: 'Обе забьют', outcomes: [{ label: 'Да', odd: 1.50 }, { label: 'Нет', odd: 2.50 }] },
            { name: 'Желтые карточки', outcomes: [{ label: 'ТБ 3.5', odd: 1.75 }, { label: 'ТМ 3.5', odd: 2.00 }] },
            { name: 'Угловые', outcomes: [{ label: 'ТБ 9.5', odd: 1.95 }, { label: 'ТМ 9.5', odd: 1.75 }] }
        ]
    },
    {
        id: 3, 
        sport: 'Футбол', 
        league: 'Серия А', 
        teams: { home: 'Интер', away: 'Ювентус' }, 
        date: '2026-04-27', 
        time: '21:45',
        status: 'Предстоит',
        markets: [
            { name: 'Основной исход', outcomes: [{ label: 'П1', odd: 1.95 }, { label: 'X', odd: 3.30 }, { label: 'П2', odd: 4.10 }] },
            { name: 'Тотал голов (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 2.10 }, { label: 'ТМ 2.5', odd: 1.75 }] },
            { name: 'Обе забьют', outcomes: [{ label: 'Да', odd: 1.90 }, { label: 'Нет', odd: 1.90 }] },
            { name: 'Желтые карточки', outcomes: [{ label: 'ТБ 3.5', odd: 2.10 }, { label: 'ТМ 3.5', odd: 1.65 }] },
            { name: 'Угловые', outcomes: [{ label: 'ТБ 9.5', odd: 1.80 }, { label: 'ТМ 9.5', odd: 1.90 }] }
        ]
    },

    // КИБЕРСПОРТ
    {
        id: 4, 
        sport: 'Киберспорт', 
        league: 'PGL Major', 
        teams: { home: 'Natus Vincere', away: 'FaZe Clan' }, 
        date: '2026-04-22', 
        time: '18:00',
        status: 'Предстоит',
        markets: [
            { name: 'Победитель матча', outcomes: [{ label: 'П1', odd: 1.95 }, { label: 'П2', odd: 1.85 }] },
            { name: 'Тотал карт (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 1.90 }, { label: 'ТМ 2.5', odd: 1.90 }] },
            { name: 'Фора по картам', outcomes: [{ label: 'Ф1 (-1.5)', odd: 3.20 }, { label: 'Ф2 (+1.5)', odd: 1.35 }] },
            { name: 'Первая кровь', outcomes: [{ label: 'Команда 1', odd: 1.85 }, { label: 'Команда 2', odd: 1.85 }] },
            { name: 'Тотал убийств (46.5)', outcomes: [{ label: 'ТБ 46.5', odd: 1.88 }, { label: 'ТМ 46.5', odd: 1.88 }] }
        ]
    },
    {
        id: 5, 
        sport: 'Киберспорт', 
        league: 'DreamLeague', 
        teams: { home: 'Spirit', away: 'Tundra' }, 
        date: '2026-04-25', 
        time: '15:00',
        status: 'Предстоит',
        markets: [
            { name: 'Победитель матча', outcomes: [{ label: 'П1', odd: 1.60 }, { label: 'П2', odd: 2.30 }] },
            { name: 'Тотал карт (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 2.10 }, { label: 'ТМ 2.5', odd: 1.70 }] },
            { name: 'Фора по картам', outcomes: [{ label: 'Ф1 (-1.5)', odd: 2.60 }, { label: 'Ф2 (+1.5)', odd: 1.45 }] },
            { name: 'Первая кровь', outcomes: [{ label: 'Команда 1', odd: 1.80 }, { label: 'Команда 2', odd: 1.95 }] },
            { name: 'Тотал убийств (46.5)', outcomes: [{ label: 'ТБ 46.5', odd: 1.85 }, { label: 'ТМ 46.5', odd: 1.85 }] }
        ]
    },
    {
        id: 6, 
        sport: 'Киберспорт', 
        league: 'Blast Premier', 
        teams: { home: 'G2', away: 'Vitality' }, 
        date: '2026-04-29', 
        time: '20:00',
        status: 'Предстоит',
        markets: [
            { name: 'Победитель матча', outcomes: [{ label: 'П1', odd: 1.90 }, { label: 'П2', odd: 1.90 }] },
            { name: 'Тотал карт (2.5)', outcomes: [{ label: 'ТБ 2.5', odd: 2.05 }, { label: 'ТМ 2.5', odd: 1.75 }] },
            { name: 'Фора по картам', outcomes: [{ label: 'Ф1 (-1.5)', odd: 3.40 }, { label: 'Ф2 (+1.5)', odd: 1.30 }] },
            { name: 'Первая кровь', outcomes: [{ label: 'Команда 1', odd: 1.87 }, { label: 'Команда 2', odd: 1.87 }] },
            { name: 'Тотал убийств (46.5)', outcomes: [{ label: 'ТБ 46.5', odd: 1.90 }, { label: 'ТМ 46.5', odd: 1.90 }] }
        ]
    }
];

// 2. ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩА
// Проверяем, есть ли уже данные в LocalStorage. Если нет — записываем дефолтные.
if (!localStorage.getItem('visbet_events')) {
    localStorage.setItem('visbet_events', JSON.stringify(initialEvents));
}

/**
 * Глобальный объект данных, который используют main.js и admin.js.
 * При каждом обращении он подтягивает актуальное состояние из памяти браузера.
 */
let sportsData = JSON.parse(localStorage.getItem('visbet_events'));

/**
 * Функция для синхронизации изменений (используется в админке)
 */
function syncEvents() {
    localStorage.setItem('visbet_events', JSON.stringify(sportsData));
}
