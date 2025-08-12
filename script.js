// Dieser Event-Listener stellt sicher, dass der Code erst nach dem Laden der Seite ausgeführt wird.
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialisiert immer das Thema (Dark Mode) und die Scroll-Anzeige
    initializeTheme();

    // Schützt die E-Mail-Adresse vor einfachen Scrapern
    protectEmail();

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
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    const setTheme = (theme) => {
        // Stellt sicher, dass immer nur eine Theme-Klasse aktiv ist
        body.classList.remove('dark-mode', 'light-mode');
        body.classList.add(`${theme}-mode`);
    };

    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('click', () => {
            // Bei einem Klick wird die explizite Auswahl des Nutzers gespeichert
            const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            setTheme(newTheme);
        });
    }

    // Funktion zur initialen Festlegung des Themas
    const setInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            // 1. Priorität: Eine vom Nutzer gespeicherte Auswahl
            setTheme(savedTheme);
        } else {
            // 2. Priorität: Die System-Einstellung des Nutzers
            setTheme(prefersDarkScheme.matches ? 'dark' : 'light');
        }
    };

    // Initiales Thema beim Laden der Seite setzen
    setInitialTheme();

    // Auf Änderungen der System-Einstellung lauschen
    prefersDarkScheme.addEventListener('change', (e) => {
        // Nur anpassen, wenn der Nutzer keine explizite Auswahl getroffen hat
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });


    // Scroll-Anzeige (unverändert)
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


// ============== E-MAIL-SCHUTZ ==============

function protectEmail() {
    const contactLink = document.getElementById('contact-link');
    if (contactLink) {
        const user = 'hallo';
        const domain = 'malte.com';
        contactLink.href = `mailto:${user}@${domain}`;
        contactLink.textContent = `Mail`;
    }
}


// ============== ARTIKEL-LOGIK ==============

async function loadArticleList() {
    const container = document.getElementById('article-list-container');
    try {
        const response = await fetch('posts.json');
        const data = await response.json();
        
        container.innerHTML = ''; 

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
        
        // Stellt sicher, dass die "marked" Bibliothek geladen ist
        if (typeof marked === 'undefined') {
            console.error('marked.js is not loaded');
            return;
        }
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
        container.innerHTML = '';

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
                    ${iconSvg}
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