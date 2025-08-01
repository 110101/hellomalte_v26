// Dieser Event-Listener stellt sicher, dass der Code erst nach dem Laden der Seite ausgeführt wird.
document.addEventListener('DOMContentLoaded', () => {
    
    // Theming-Funktionen bleiben global verfügbar
    initializeTheme();

    // Seiten-spezifische Logik ausführen
    if (document.getElementById('article-list-container')) {
        loadArticleList();
    }
    if (document.getElementById('article-content-container')) {
        loadArticleContent();
    }
});


// ============== THEMA (DARK MODE) & SCROLL-ANZEIGE ==============

function initializeTheme() {
    const darkModeSwitch = document.querySelector('#darkModeToggleContainer');
    const body = document.body;

    const setTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    };

    darkModeSwitch.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Gespeichertes Thema beim Laden anwenden
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Scroll-Anzeige initialisieren
    const progressBar = document.querySelector('.scroll-progress-bar');
    const updateScrollProgress = () => {
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
        
        // Leert den "Lade..."-Text
        container.innerHTML = ''; 

        // Sortiert die Posts nach Dateinamen (absteigend, neuste zuerst)
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
        
        // Wandelt Markdown in HTML um
        const contentHtml = marked.parse(markdown);

        container.innerHTML = contentHtml;

        // Passt den Seitentitel an
        const articleTitle = container.querySelector('h1')?.textContent || 'Artikel';
        document.title = `${articleTitle} - Malte`;

        // Fügt einen "Zurück"-Link hinzu
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
    // Entfernt "YYYY-MM-DD-" und ".md"
    let title = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    // Ersetzt Bindestriche durch Leerzeichen
    title = title.replace(/-/g, ' ');
    // Macht den ersten Buchstaben groß
    return title.charAt(0).toUpperCase() + title.slice(1);
}