(function () {
    const storageKey = 'visbet_theme';
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    function getSavedTheme() {
        const saved = localStorage.getItem(storageKey);
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function updateButtons(theme) {
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            const isDark = theme === 'dark';
            button.setAttribute('aria-pressed', String(isDark));
            button.setAttribute('title', isDark ? 'Включить светлую тему' : 'Включить темную тему');
            const label = button.querySelector('[data-theme-label]');
            const icon = button.querySelector('[data-theme-icon]');
            if (label) label.textContent = isDark ? 'Светлая' : 'Темная';
            if (icon) icon.textContent = isDark ? '☀' : '☾';
        });
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;
        if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#101827' : '#F7F9FC');
        updateButtons(theme);
    }

    window.setVisbetTheme = function (theme) {
        const nextTheme = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem(storageKey, nextTheme);
        applyTheme(nextTheme);
    };

    window.toggleVisbetTheme = function () {
        const current = root.dataset.theme === 'dark' ? 'dark' : 'light';
        window.setVisbetTheme(current === 'dark' ? 'light' : 'dark');
    };

    applyTheme(getSavedTheme());

    document.addEventListener('DOMContentLoaded', () => {
        updateButtons(root.dataset.theme || getSavedTheme());
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            if (button.dataset.themeReady) return;
            button.dataset.themeReady = '1';
            button.addEventListener('click', window.toggleVisbetTheme);
        });
    });
})();
