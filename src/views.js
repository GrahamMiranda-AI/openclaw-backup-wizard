const { APP_NAME, LOGO_PATH } = require('./config');

function renderLayout({ title, body, status = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="/static/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="wrap">
    <header class="main-header">
      <div class="brand">
        <img src="${LOGO_PATH}" onerror="this.style.display='none'" class="logo" alt="logo" />
        <h1>${APP_NAME}</h1>
      </div>
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
        <span class="icon">🌙</span> Dark
      </button>
    </header>
    ${status ? `<div class="status fade-in">${status}</div>` : ''}
    <main class="content">
      ${body}
    </main>
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
      const icon = btn ? btn.querySelector('.icon') : null;

      const stored = localStorage.getItem(KEY);
      const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (preferredDark ? 'dark' : 'light');

      const updateUI = (t) => {
        root.setAttribute('data-theme', t);
        if (btn) {
           btn.innerHTML = t === 'dark' ? '<span class="icon">☀️</span> Light' : '<span class="icon">🌙</span> Dark';
        }
      };

      updateUI(theme);

      btn && btn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        updateUI(next);
        localStorage.setItem(KEY, next);
      });
    })();
  </script>
</body>
</html>`;
}

function renderLogin({ error } = {}) {
  const body = `
    <div class="card login-card fade-in">
      <h2>Welcome Back</h2>
      <p class="subtitle">Please sign in to continue</p>
      ${error ? `<div class="alert error">${error}</div>` : ''}
      <form method="post" action="/login" class="stack">
        <div class="input-group">
          <label for="username">Username</label>
          <input required id="username" name="username" placeholder="admin" autofocus />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input required id="password" name="password" type="password" placeholder="••••••••" />
        </div>
        <button type="submit" class="btn-primary">Sign in</button>
      </form>
    </div>`;
  return renderLayout({ title: `${APP_NAME} - Login`, body });
}

function renderWizard({ backups, status }) {
  const list = backups.length
    ? `<ul class="backup-list">${backups.map(b => `
      <li>
        <div class="file-info">
          <span class="file-icon">📦</span>
          <a href="/download/${encodeURIComponent(b)}" class="file-name">${b}</a>
        </div>
        <form method="post" action="/delete-backup" onsubmit="return confirm('Delete backup ${b}?');">
          <input type="hidden" name="name" value="${b}" />
          <button type="submit" class="btn-danger-ghost btn-sm">Delete</button>
        </form>
      </li>
    `).join('')}</ul>`
    : '<div class="empty-state">No backups found. Create one to get started.</div>';

  const body = `
    <div class="grid">
      <section class="card fade-in delay-1">
        <div class="card-header">
          <div class="step-badge">1</div>
          <h2>Create Backup</h2>
        </div>
        <p>Backs up OpenClaw state + key workspace memory/config files into a ZIP.</p>
        <form method="post" action="/backup">
          <button type="submit" class="btn-primary full-width">Backup Now</button>
        </form>
      </section>

      <section class="card fade-in delay-2">
        <div class="card-header">
          <div class="step-badge">2</div>
          <h2>Restore Backup</h2>
        </div>
        <p>Uploads a ZIP from this wizard format and restores files. A pre-restore emergency backup is generated automatically.</p>
        <form method="post" action="/restore" enctype="multipart/form-data" class="stack">
          <div class="file-drop-area">
             <input type="file" name="backup" accept=".zip" required id="backup-file" />
             <span class="file-msg">Drag & drop or click to select ZIP</span>
          </div>
          <label class="checkbox">
            <input type="checkbox" required name="confirm" value="yes" />
            <span>I understand this will overwrite current OpenClaw files.</span>
          </label>
          <button type="submit" class="btn-danger full-width">Restore Backup</button>
        </form>
      </section>

      <section class="card span-col fade-in delay-3">
        <h2>Available Backups</h2>
        ${list}
      </section>

      <section class="card fade-in delay-4">
        <h2>Session</h2>
        <form method="post" action="/logout">
          <button type="submit" class="btn-secondary full-width">Logout</button>
        </form>
      </section>
    </div>`;

  return renderLayout({ title: `${APP_NAME} - Wizard`, body, status });
}

function renderError(title, error) {
   const body = `
     <div class="card error-card fade-in">
       <h2>Error: ${title}</h2>
       <pre class="code-block">${String(error.stack || error)}</pre>
       <a href="/wizard" class="btn-secondary">Go Back</a>
     </div>
   `;
   return renderLayout({ title: `${APP_NAME} - Error`, body });
}

module.exports = {
  renderLayout,
  renderLogin,
  renderWizard,
  renderError
};
