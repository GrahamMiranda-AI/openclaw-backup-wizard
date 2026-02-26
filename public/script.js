document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const KEY = 'ocbw-theme';
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem(KEY, theme);
        if (btn) btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }

    const stored = localStorage.getItem(KEY);
    const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored || (preferredDark ? 'dark' : 'light');
    setTheme(initialTheme);

    if (btn) {
        btn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setTheme(next);
        });
    }

    // Toast Notifications
    const toastContainer = document.getElementById('toast-container');
    const statusMessage = document.getElementById('statusMessage');

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    if (statusMessage) {
        showToast(statusMessage.textContent, 'success'); // Assuming server sends success messages here
        statusMessage.style.display = 'none';
    }

    // Backup List Filtering & Sorting
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const backupList = document.getElementById('backupList');
    const noBackupsMsg = document.getElementById('noBackupsMsg');

    if (backupList && searchInput && sortSelect) {
        let items = Array.from(backupList.children);

        function filterAndSort() {
            const query = searchInput.value.toLowerCase();
            const sortValue = sortSelect.value;

            // Filter
            items.forEach(item => {
                const name = item.getAttribute('data-name').toLowerCase();
                if (name.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });

            // Sort
            const visibleItems = items.filter(item => item.style.display !== 'none');

            visibleItems.sort((a, b) => {
                const timeA = parseInt(a.getAttribute('data-time'));
                const timeB = parseInt(b.getAttribute('data-time'));
                const nameA = a.getAttribute('data-name');
                const nameB = b.getAttribute('data-name');

                switch (sortValue) {
                    case 'newest': return timeB - timeA;
                    case 'oldest': return timeA - timeB;
                    case 'name-asc': return nameA.localeCompare(nameB);
                    case 'name-desc': return nameB.localeCompare(nameA);
                    default: return 0;
                }
            });

            // Re-append in new order
            // Note: This is a simple re-append, for larger lists a virtual list would be better
            visibleItems.forEach(item => backupList.appendChild(item));

            // Check if any visible
            const anyVisible = visibleItems.length > 0;
            if (!anyVisible) {
                if(!document.getElementById('empty-search')) {
                    const empty = document.createElement('p');
                    empty.id = 'empty-search';
                    empty.textContent = 'No backups found matching your search.';
                    empty.style.textAlign = 'center';
                    empty.style.color = 'var(--muted)';
                    backupList.parentNode.appendChild(empty);
                }
            } else {
                const empty = document.getElementById('empty-search');
                if(empty) empty.remove();
            }
        }

        searchInput.addEventListener('input', filterAndSort);
        sortSelect.addEventListener('change', filterAndSort);
    }
});
