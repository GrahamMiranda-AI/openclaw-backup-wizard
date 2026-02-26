const { APP_NAME, LOGO_PATH } = require('./config');

function renderPage({ title, body, status = '' }) {
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
    ${status ? `<div class="status" id="statusMessage">${status}</div>` : ''}
    <div id="toast-container"></div>
    <main>
      ${body}
    </main>
    <footer class="footer">
      <span>Project by Graham Miranda </span>
      <a href="https://www.grahammiranda.com/" target="_blank" rel="noopener noreferrer">https://www.grahammiranda.com/</a>
    </footer>
  </div>
  <script src="/static/script.js"></script>
</body>
</html>`;
}

module.exports = { renderPage };
