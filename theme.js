// ── SCMS Theme Manager ──────────────────────────────────────────────
// Runs the IIFE synchronously (in <head>) to avoid flash of wrong theme.
(function () {
    const saved = localStorage.getItem('scms-theme') || 'dark';
    if (saved === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
})();

/** Toggle between dark ↔ light and persist to localStorage. */
function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('scms-theme', isLight ? 'light' : 'dark');
    _updateThemeBtn();
}

/** Sync the button label/icon to current theme. */
function _updateThemeBtn() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isLight = document.documentElement.classList.contains('light-mode');
    btn.innerHTML = isLight ? '🌙 Dark' : '☀️ Light';
    btn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
}

// Update button label once DOM is ready
document.addEventListener('DOMContentLoaded', _updateThemeBtn);
