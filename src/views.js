import { APP_NAME, LOGO_PATH } from './config.js';

export function renderPage({ title, body, status = '' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <img src="${LOGO_PATH}" onerror="this.style.display='none'" class="logo" alt="logo" />
        <h1>${APP_NAME}</h1>
      </div>
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle theme">🌙 Dark</button>
    </header>
    ${status ? `<div class="status">${status}</div>` : ''}
    ${body}
    <footer class="footer">
      <span>Project by Graham Miranda </span>
      <a href="https://www.grahammiranda.com/" target="_blank" rel="noopener noreferrer">https://www.grahammiranda.com/</a>
    </footer>
  </div>
  <script>
    (function () {
      const KEY = 'ocbw-theme';
      const root = document.documentElement;
      const btn = document.getElementById('themeToggle');
      const stored = localStorage.getItem(KEY);
      const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (preferredDark ? 'dark' : 'light');
      root.setAttribute('data-theme', theme);
      if (btn) btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn && btn.addEventListener('click', function () {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem(KEY, next);
        btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
      });
    })();
  </script>
</body>
</html>`;
}
