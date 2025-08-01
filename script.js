// Dieser Event-Listener stellt sicher, dass der Code erst nach dem Laden der Seite ausgeführt wird.
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialisiert immer das Thema (Dark Mode) und die Scroll-Anzeige
    initializeTheme();

    // Führt Code nur aus, wenn die entsprechenden Container auf der Seite existieren
    if (document.getElementById('article-list-container')) {
        loadArticleList();
    }
    if (document.getElementById('article-content-container')) {
        loadArticleContent();
    }
    if (document.getElementById('link-collection-container')) {
        loadLinkCollection();
    }
});


// ============== THEMA (DARK MODE) & SCROLL-ANZEIGE ==============

function initializeTheme() {
    const darkModeSwitch = document.querySelector('#darkModeToggleContainer');
    const body = document.body;
    const progressBar = document.querySelector('.scroll-progress-bar');

    const setTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    };

    if(darkModeSwitch) {
        darkModeSwitch.addEventListener('click', () => {
            const isDarkMode = body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Gespeichertes Thema beim Laden anwenden
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Scroll-Anzeige initialisieren
    const updateScrollProgress = () => {
        if (!progressBar) return;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollHeight <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrolled = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';
    };
    window.addEventListener('scroll', updateScrollProgress);
}


// ============== ARTIKEL-LOGIK ==============

// Funktion zum Laden der Artikelliste auf der Startseite
async function loadArticleList() {
    const container = document.getElementById('article-list-container');
    try {
        const response = await fetch('posts.json');
        const data = await response.json();
        
        container.innerHTML = ''; // Leert den "Lade..."-Text

        const sortedPosts = data.posts.sort().reverse();
        
        sortedPosts.forEach(filename => {
            const title = formatFilenameToTitle(filename);
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `article.html?post=${filename}`;
            a.textContent = title;
            li.appendChild(a);
            container.appendChild(li);
        });

    } catch (error) {
        container.innerHTML = '<li>Fehler beim Laden der Artikel.</li>';
        console.error('Error fetching posts:', error);
    }
}

// Funktion zum Laden des einzelnen Artikelinhalts
async function loadArticleContent() {
    const container = document.getElementById('article-content-container');
    const params = new URLSearchParams(window.location.search);
    const postFilename = params.get('post');

    if (!postFilename) {
        container.innerHTML = '<p>Kein Artikel ausgewählt. <a href="index.html">Zurück zur Übersicht</a>.</p>';
        return;
    }

    try {
        const response = await fetch(`posts/${postFilename}`);
        const markdown = await response.text();
        
        const contentHtml = marked.parse(markdown);
        container.innerHTML = contentHtml;

        const articleTitle = container.querySelector('h1')?.textContent || 'Artikel';
        document.title = `${articleTitle} - Malte`;

        const backLink = document.createElement('a');
        backLink.href = 'index.html';
        backLink.textContent = '← Zurück zur Übersicht';
        backLink.className = 'back-link';
        container.appendChild(backLink);
        
    } catch (error) {
        container.innerHTML = '<p>Fehler: Artikel konnte nicht geladen werden.</p>';
        console.error('Error fetching article:', error);
    }
}

// Hilfsfunktion, um Dateinamen in schöne Titel umzuwandeln
function formatFilenameToTitle(filename) {
    let title = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    title = title.replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
}


// ============== LINK-SAMMLUNG LOGIK ==============

async function loadLinkCollection() {
    const container = document.getElementById('link-collection-container');
    const iconSvg = `<svg class="link-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"/></svg>`;

    try {
        const response = await fetch('links.md');
        const markdown = await response.text();
        container.innerHTML = ''; // Leert den "Lade..."-Text

        const entries = markdown.trim().split(/\n---\n/);
        
        entries.forEach(entry => {
            const lines = entry.split('\n');
            const linkData = {};
            lines.forEach(line => {
                const [key, ...valueParts] = line.split(': ');
                const value = valueParts.join(': ');
                if (key && value) {
                    linkData[key.trim().toUpperCase()] = value.trim();
                }
            });

            if (linkData.URL && linkData.TITLE) {
                const li = document.createElement('li');
                li.className = 'link-item';
                li.innerHTML = `
                    <div class="link-item-text">
                        <a href="${linkData.URL}" target="_blank" rel="noopener noreferrer">
                            <h3>${linkData.TITLE}</h3>
                        </a>
                        <p>${linkData.DESC || ''}</p>
                    </div>
                `;
                container.appendChild(li);
            }
        });

    } catch (error) {
        container.innerHTML = '<li>Fehler beim Laden der Links.</li>';
        console.error('Error fetching links:', error);
    }
}