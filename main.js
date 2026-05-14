document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const heroSection = document.getElementById('hero');
    const trendingRail = document.getElementById('trendingRail');
    const popularRail = document.getElementById('popularRail');
    const searchInput = document.getElementById('searchInput');
    const searchView = document.getElementById('searchView');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const closeSearch = document.getElementById('closeSearch');
    const detailModal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.querySelector('.modal-close');
    const playerView = document.getElementById('playerView');
    const closePlayer = document.getElementById('closePlayer');
    const videoElement = document.getElementById('player');
    const iframeContainer = document.getElementById('iframeContainer');
    const videoIframe = document.getElementById('videoIframe');
    const playerPlaceholder = document.getElementById('playerPlaceholder');
    const episodeList = document.getElementById('episodeList');
    const playerAnimeTitle = document.getElementById('playerAnimeTitle');
    const playerEpisodeNum = document.getElementById('playerEpisodeNum');
    const playerProvider = document.getElementById('playerProvider');
    const serverList = document.getElementById('serverList');

    // State
    let currentAnimeData = [];
    let hls = new Hls();
    let plyrPlayer;

    // Initialize Plyr
    plyrPlayer = new Plyr(videoElement, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
        settings: ['quality', 'speed'],
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true }
    });

    const providers = [
        { id: 'anify', name: 'Direct Stream (Premium)', type: 'direct' },
        { id: 'vidlink', name: 'Server 2 (VidLink)', type: 'embed' },
        { id: 'vidsrc', name: 'Server 3 (VidSrc)', type: 'embed' },
        { id: 'vidsrccc', name: 'Server 4 (Backup)', type: 'embed' }
    ];
    let currentProvider = providers[0];

    const embedServers = {
        'vidlink': (id, ep, mal) => `https://vidlink.pro/embed/anime/${mal || id}/${ep}?primaryColor=8b5cf6`,
        'vidsrc': (id, ep, mal) => `https://vidsrc.to/embed/anime/${mal || id}/${ep}`,
        'vidsrccc': (id, ep, mal) => `https://vidsrc.cc/v2/embed/anime/${mal || id}/${ep}`
    };

    // --- Core Functions ---

    async function init() {
        // Load Featured (Attack on Titan)
        const featuredData = await api.getFeatured();
        if (featuredData && featuredData.Media) {
            renderHero(featuredData.Media);
        }

        // Load Rails
        const [trendingData, popularData] = await Promise.all([
            api.getTrending(),
            api.getPopular()
        ]);

        if (trendingData) renderRail(trendingRail, trendingData.Page.media);
        if (popularData) renderRail(popularRail, popularData.Page.media);
    }

    function renderHero(anime) {
        const title = anime.title.english || anime.title.romaji;
        const banner = anime.bannerImage || anime.coverImage.extraLarge;
        
        heroSection.style.backgroundImage = `url(${banner})`;
        heroSection.innerHTML = `
            <div class="hero-content">
                <span class="hero-tag">Featured Series</span>
                <h1 class="hero-title">${title}</h1>
                <p class="hero-description">${anime.description ? anime.description.replace(/<br>/g, '') : ''}</p>
                <div class="hero-buttons">
                    <button class="btn btn-primary watch-btn" data-id="${anime.id}">
                        <i data-lucide="play"></i> Watch Now
                    </button>
                    <button class="btn btn-secondary detail-btn" data-id="${anime.id}">
                        <i data-lucide="info"></i> More Details
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
        
        // Add listeners for hero buttons
        heroSection.querySelector('.detail-btn').onclick = () => openDetail(anime.id);
        heroSection.querySelector('.watch-btn').onclick = () => openPlayer(anime.id, 1, title, anime.episodes, anime.idMal || null);
    }

    function renderRail(container, animeList) {
        container.innerHTML = '';
        animeList.forEach(anime => {
            const card = createAnimeCard(anime);
            container.appendChild(card);
            currentAnimeData.push(anime);
        });
        lucide.createIcons();
    }

    function createAnimeCard(anime) {
        const title = anime.title.english || anime.title.romaji;
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <div class="card-poster">
                <img src="${anime.coverImage.large}" alt="${title}" loading="lazy">
                <div class="card-rating">
                    <i data-lucide="star" style="width:12px; height:12px; fill:#fbbf24"></i>
                    ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
                </div>
            </div>
            <div class="card-title">${title}</div>
            <div class="card-meta">${anime.seasonYear || ''} • ${anime.episodes || '?'} Eps</div>
        `;
        card.onclick = () => openDetail(anime.id);
        return card;
    }

    async function openDetail(animeId) {
        // Fetch full details if only partial data is available
        const data = await api.getAnimeById(animeId);
        if (!data || !data.Media) return;
        
        const anime = data.Media;
        const title = anime.title.english || anime.title.romaji;
        const banner = anime.bannerImage || anime.coverImage.extraLarge;
        const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A';
        
        detailModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        modalBody.innerHTML = `
            <div class="detail-banner" style="background-image: url(${banner})"></div>
            <div class="detail-info">
                <img src="${anime.coverImage.extraLarge}" class="detail-poster">
                <div class="detail-text">
                    <h2 class="detail-title">${title}</h2>
                    <div class="detail-meta">
                        <span><i data-lucide="star" style="width:14px; fill:#fbbf24"></i> ${score}</span>
                        <span>${anime.seasonYear || ''}</span>
                        <span>${anime.episodes || '?'} Episodes</span>
                        <span>${anime.genres.slice(0, 3).join(', ')}</span>
                    </div>
                    <div class="detail-synopsis">${anime.description || 'No description available.'}</div>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" onclick="window.openPlayer(${anime.id}, 1, '${title.replace(/'/g, "\\'")}', ${anime.episodes}, ${anime.idMal || 'null'})">
                            <i data-lucide="play"></i> Watch Now
                        </button>
                        ${anime.trailer && anime.trailer.site === 'youtube' ? 
                            `<button class="btn btn-secondary" onclick="window.open('https://www.youtube.com/watch?v=${anime.trailer.id}', '_blank')">
                                <i data-lucide="play-circle"></i> Trailer
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
            ${anime.recommendations.nodes.length > 0 ? `
                <div class="recommendations-section" style="padding: 0 3rem 3rem 3rem;">
                    <h3 style="margin-bottom: 1.5rem; font-size: 1.2rem;">You Might Also Like</h3>
                    <div class="anime-rail">
                        ${anime.recommendations.nodes.slice(0, 6).map(rec => {
                            const r = rec.mediaRecommendation;
                            if (!r) return '';
                            return `
                                <div class="anime-card" style="min-width: 150px; width: 150px;" onclick="window.openDetail(${r.id})">
                                    <div class="card-poster" style="height: 220px;">
                                        <img src="${r.coverImage.large}" alt="${r.title.english || r.title.romaji}">
                                    </div>
                                    <div class="card-title" style="font-size: 0.85rem;">${r.title.english || r.title.romaji}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        lucide.createIcons();
    }

    // Expose functions to window for inline onclicks
    window.openDetail = openDetail;
    window.openPlayer = openPlayer;

    async function openPlayer(id, episode = 1, title, totalEpisodes, idMal) {
        playerView.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        playerAnimeTitle.innerText = title;
        playerEpisodeNum.innerText = `Episode ${episode}`;
        playerProvider.innerText = currentProvider.name;

        // Render Server/Provider List
        renderServerList(id, episode, title, totalEpisodes, idMal);

        // Render Episode List
        renderEpisodeList(id, episode, totalEpisodes, title, idMal);

        // Add external fallback buttons
        const searchBtn = document.createElement('button');
        searchBtn.className = 'btn-external search-fallback';
        searchBtn.innerHTML = '<i data-lucide="search"></i> <span>Find elsewhere</span>';
        searchBtn.onclick = () => window.open(`https://www3.gogoanimes.fi/search.html?keyword=${encodeURIComponent(title)}`, '_blank');
        
        const header = playerView.querySelector('.player-header');
        const oldBtns = header.querySelectorAll('.btn-external');
        oldBtns.forEach(b => b.remove());
        header.insertBefore(searchBtn, document.getElementById('closePlayer'));

        // Fetch and Play
        loadSource(id, episode, idMal);
        
        lucide.createIcons();
    }

    async function loadSource(id, episode, idMal, providerIndex = 0) {
        // Reset UI only on the first attempt
        if (providerIndex === 0) {
            videoElement.classList.add('hidden');
            iframeContainer.classList.add('hidden');
            playerPlaceholder.classList.remove('hidden');
            playerPlaceholder.innerHTML = '<div class="spinner"></div><p>Connecting to secure stream...</p>';
            videoIframe.src = '';
        } else {
            playerPlaceholder.innerHTML = `<div class="spinner"></div><p>Trying backup provider ${providerIndex + 1}...</p>`;
        }

        if (currentProvider.type === 'embed') {
            const embedUrl = embedServers[currentProvider.id](id, episode, idMal);
            videoIframe.src = embedUrl;
            iframeContainer.classList.remove('hidden');
            playerPlaceholder.classList.add('hidden');
            return;
        }

        // Direct Stream Logic (Anify)
        try {
            const infoRes = await fetch(`https://api.anify.tv/info/${id}`);
            const info = await infoRes.json();
            
            if (!info || !info.episodes) throw new Error('Anime info not found');

            // Find all providers with episodes
            const availableProviders = info.episodes.data.filter(d => d.episodes.length > 0);
            
            if (providerIndex >= availableProviders.length) {
                throw new Error('All direct providers failed');
            }

            const providerData = availableProviders[providerIndex];
            const epData = providerData.episodes.find(e => e.number === episode);
            
            if (!epData) {
                // Try next provider
                return loadSource(id, episode, idMal, providerIndex + 1);
            }

            const watchId = epData.id;
            const sourceUrl = `https://api.anify.tv/sources?providerId=${providerData.providerId}&watchId=${encodeURIComponent(watchId)}&episodeNumber=${episode}&id=${id}&subType=sub`;
            const sourceRes = await fetch(sourceUrl);
            const sourceData = await sourceRes.json();

            if (!sourceData || !sourceData.sources || sourceData.sources.length === 0) {
                // Try next provider
                return loadSource(id, episode, idMal, providerIndex + 1);
            }

            const hlsSource = sourceData.sources.find(s => s.url.includes('.m3u8')) || sourceData.sources[0];
            
            playerPlaceholder.classList.add('hidden');
            videoElement.classList.remove('hidden');
            playVideo(hlsSource.url);

        } catch (error) {
            console.error('[Player Error]', error);
            playerPlaceholder.innerHTML = `
                <p style="color:#ef4444">Primary stream failed. Trying backup embed...</p>
            `;
            setTimeout(() => {
                currentProvider = providers[1]; // Switch to VidLink
                loadSource(id, episode, idMal);
            }, 1500);
        }
    }

    function playVideo(url) {
        if (Hls.isSupported()) {
            hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play();
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari support
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            });
        }
    }

    function renderServerList(id, episode, title, total, idMal) {
        serverList.innerHTML = '';
        providers.forEach(provider => {
            const btn = document.createElement('button');
            btn.className = `server-btn ${provider.id === currentProvider.id ? 'active' : ''}`;
            btn.innerHTML = `<i data-lucide="server" style="width:14px"></i> ${provider.name}`;
            btn.onclick = () => {
                currentProvider = provider;
                openPlayer(id, episode, title, total, idMal);
            };
            serverList.appendChild(btn);
        });
    }

    function renderEpisodeList(id, currentEpisode, total, title, idMal) {
        episodeList.innerHTML = '';
        const count = total || 1; 
        
        for (let i = 1; i <= count; i++) {
            const btn = document.createElement('button');
            btn.className = `episode-btn ${i === currentEpisode ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => openPlayer(id, i, title, total, idMal);
            episodeList.appendChild(btn);
        }
    }

    // --- Event Listeners ---

    // Search logic with debounce
    let searchTimeout;
    searchInput.oninput = (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            if (query.length === 0) searchView.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            searchView.classList.remove('hidden');
            searchResultsGrid.innerHTML = '<div class="skeleton-loader"></div>';
            
            const results = await api.searchAnime(query);
            if (results && results.Page.media.length > 0) {
                searchResultsGrid.innerHTML = '';
                results.Page.media.forEach(anime => {
                    const card = createAnimeCard(anime);
                    searchResultsGrid.appendChild(card);
                });
                lucide.createIcons();
            } else {
                searchResultsGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No results found.</p>';
            }
        }, 500);
    };

    closeSearch.onclick = () => {
        searchView.classList.add('hidden');
        searchInput.value = '';
    };

    modalClose.onclick = () => {
        detailModal.classList.add('hidden');
        if (playerView.classList.contains('hidden')) {
            document.body.style.overflow = 'auto';
        }
    };

    closePlayer.onclick = () => {
        playerView.classList.add('hidden');
        videoElement.pause();
        videoElement.src = ''; 
        if (detailModal.classList.contains('hidden')) {
            document.body.style.overflow = 'auto';
        }
    };

    window.onclick = (e) => {
        if (e.target === detailModal.querySelector('.modal-overlay')) {
            modalClose.onclick();
        }
    };

    // Initialize
    init();
});
