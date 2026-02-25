document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const KEY = 'ocbw-theme';
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const icon = btn ? btn.querySelector('.icon') : null;

  const getTheme = () => {
    const stored = localStorage.getItem(KEY);
    const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return stored || (preferredDark ? 'dark' : 'light');
  };

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  };

  // Init theme
  setTheme(getTheme());

  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Loading States
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      // Don't intercept delete forms confirmation (handled by onsubmit attribute, but here we deal with UI)
      if (form.getAttribute('action') === '/delete-backup') return;

      const btn = form.querySelector('button[type="submit"]');
      if (btn && btn.dataset.loading) {
        // Prevent double submit
        if (btn.disabled) {
          e.preventDefault();
          return;
        }

        // const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${btn.dataset.loading}`;
      }
    });
  });
});
