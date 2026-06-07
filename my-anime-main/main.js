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

    // Quiz DOM Elements
    const quizModal = document.getElementById('quizModal');
    const quizModalClose = document.querySelector('.quiz-modal-close');
    const quizTitle = document.getElementById('quizTitle');
    const quizCurrentNum = document.getElementById('quizCurrentNum');
    const quizTotalNum = document.getElementById('quizTotalNum');
    const quizProgressBar = document.getElementById('quizProgressBar');
    const quizCorrectCount = document.getElementById('quizCorrectCount');
    const quizIncorrectCount = document.getElementById('quizIncorrectCount');
    const quizQuestionView = document.getElementById('quizQuestionView');
    const quizQuestion = document.getElementById('quizQuestion');
    const quizOptions = document.getElementById('quizOptions');
    const quizExplanationBox = document.getElementById('quizExplanationBox');
    const quizExplanationText = document.getElementById('quizExplanationText');
    const quizExplanationStatusText = document.getElementById('explanationStatusText');
    const quizExplanationIcon = document.getElementById('explanationIcon');
    const quizResultView = document.getElementById('quizResultView');
    const resultScore = document.getElementById('resultScore');
    const resultTitle = document.getElementById('resultTitle');
    const resultMsg = document.getElementById('resultMsg');
    const quizRestartBtn = document.getElementById('quizRestartBtn');
    const quizNextBtn = document.getElementById('quizNextBtn');

    // State
    let currentAnimeData = [];
    let hls = new Hls();
    let plyrPlayer;

    // Quiz State
    let currentQuizData = null;
    let currentQuizQuestions = [];
    let currentQuestionIndex = 0;
    let quizScore = 0;
    let hasAnswered = false;
    let quizOpenedFromPlayer = false;
    let quizOpenedFromDetail = false;

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
                        <button class="btn btn-secondary" onclick="window.openQuiz(${anime.id}, '${title.replace(/'/g, "\\'")}')">
                            <i data-lucide="help-circle"></i> Take Quiz
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
    window.openQuiz = openQuiz;

    async function openQuiz(animeId, animeTitle) {
        if (!playerView.classList.contains('hidden')) {
            quizOpenedFromPlayer = true;
            quizOpenedFromDetail = false;
            playerView.classList.add('hidden');
        } else {
            quizOpenedFromPlayer = false;
            quizOpenedFromDetail = true;
            detailModal.classList.add('hidden');
        }

        quizModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`quizzes/${animeId}.json`);
            if (!response.ok) {
                throw new Error('Quiz not found');
            }
            currentQuizData = await response.json();
        } catch (e) {
            console.log(`Failed to load quiz for ${animeId}, falling back to default.`);
            try {
                const response = await fetch(`quizzes/default.json`);
                if (!response.ok) throw new Error('Default quiz not found');
                currentQuizData = await response.json();
            } catch (err) {
                console.error('Failed to load default quiz:', err);
                alert('Could not load quiz at this time.');
                closeQuiz();
                return;
            }
        }

        // Limit the session to exactly 5 questions
        currentQuizQuestions = currentQuizData.questions.slice(0, 5);

        currentQuestionIndex = 0;
        quizScore = 0;
        quizTitle.innerText = `${currentQuizData.title}`;
        
        // Reset counters UI
        quizCorrectCount.innerText = '0';
        quizIncorrectCount.innerText = '0';

        showQuestion();
    }

    function showQuestion() {
        hasAnswered = false;
        quizNextBtn.disabled = true;

        quizQuestionView.classList.remove('hidden');
        quizResultView.classList.add('hidden');
        quizExplanationBox.classList.add('hidden');
        quizExplanationBox.classList.remove('correct-feedback', 'incorrect-feedback');

        const questionData = currentQuizQuestions[currentQuestionIndex];
        quizQuestion.innerText = questionData.question;

        const totalQuestions = currentQuizQuestions.length;
        quizCurrentNum.innerText = currentQuestionIndex + 1;
        quizTotalNum.innerText = totalQuestions;
        quizProgressBar.style.width = `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`;

        if (currentQuestionIndex === totalQuestions - 1) {
            quizNextBtn.innerHTML = '<span>Finish Quiz</span> <i data-lucide="check"></i>';
        } else {
            quizNextBtn.innerHTML = '<span>Next Question</span> <i data-lucide="arrow-right"></i>';
        }

        quizOptions.innerHTML = '';
        questionData.options.forEach((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.innerHTML = `
                <div class="quiz-option-bubble">${letter}</div>
                <span>${option}</span>
            `;
            button.onclick = () => selectAnswer(index);
            quizOptions.appendChild(button);
        });

        lucide.createIcons();
    }

    function selectAnswer(selectedIndex) {
        if (hasAnswered) return;
        hasAnswered = true;

        const questionData = currentQuizQuestions[currentQuestionIndex];
        const correctIndex = questionData.answer;
        const optionsButtons = quizOptions.querySelectorAll('.quiz-option');

        optionsButtons.forEach((btn, idx) => {
            btn.classList.add('disabled');
            if (idx === correctIndex) {
                btn.classList.remove('disabled');
                btn.classList.add('correct');
            } else if (idx === selectedIndex) {
                btn.classList.remove('disabled');
                btn.classList.add('incorrect');
            }
        });

        const isCorrect = selectedIndex === correctIndex;
        if (isCorrect) {
            quizScore++;
        }

        // Update top right correct/incorrect counts
        const correctSoFar = quizScore;
        const incorrectSoFar = (currentQuestionIndex + 1) - quizScore;
        quizCorrectCount.innerText = correctSoFar;
        quizIncorrectCount.innerText = incorrectSoFar;

        quizExplanationBox.classList.remove('hidden');
        if (isCorrect) {
            quizExplanationBox.classList.add('correct-feedback');
            quizExplanationStatusText.innerText = 'Correct!';
            quizExplanationIcon.setAttribute('data-lucide', 'check-circle-2');
        } else {
            quizExplanationBox.classList.add('incorrect-feedback');
            quizExplanationStatusText.innerText = 'Incorrect';
            quizExplanationIcon.setAttribute('data-lucide', 'alert-circle');
        }
        quizExplanationText.innerText = questionData.explanation || '';

        quizNextBtn.disabled = false;
        lucide.createIcons();
    }

    function showResults() {
        quizQuestionView.classList.add('hidden');
        quizResultView.classList.remove('hidden');
        quizExplanationBox.classList.add('hidden');
        quizNextBtn.disabled = true;

        const totalQuestions = currentQuizQuestions.length;
        resultScore.innerText = `${quizScore}/${totalQuestions}`;

        let titleText = '';
        let msgText = '';
        const percentage = (quizScore / totalQuestions) * 100;

        if (percentage === 100) {
            titleText = 'Perfect Score! 🏆';
            msgText = 'Absolute Otaku! You know your anime inside and out. Truly legendary!';
        } else if (percentage >= 80) {
            titleText = 'Excellent! 🔥';
            msgText = 'Incredible job! You are clearly a seasoned anime fan. Respect!';
        } else if (percentage >= 60) {
            titleText = 'Not Bad! 👍';
            msgText = 'Good effort! You know a fair amount, but there\'s room to grow.';
        } else {
            titleText = 'Need More Training! ⚔️';
            msgText = 'Time to binge-watch some more episodes and try again!';
        }

        resultTitle.innerText = titleText;
        resultMsg.innerText = msgText;
    }

    function closeQuiz() {
        quizModal.classList.add('hidden');
        if (quizOpenedFromPlayer) {
            playerView.classList.remove('hidden');
            quizOpenedFromPlayer = false;
        } else if (quizOpenedFromDetail) {
            detailModal.classList.remove('hidden');
            quizOpenedFromDetail = false;
        } else {
            document.body.style.overflow = 'auto';
        }
    }

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

        // Add external fallback buttons and quiz button
        const searchBtn = document.createElement('button');
        searchBtn.className = 'btn-external search-fallback';
        searchBtn.innerHTML = '<i data-lucide="search"></i> <span>Find elsewhere</span>';
        searchBtn.onclick = () => window.open(`https://www3.gogoanimes.fi/search.html?keyword=${encodeURIComponent(title)}`, '_blank');

        const quizBtn = document.createElement('button');
        quizBtn.className = 'btn-external quiz-btn-watch';
        quizBtn.innerHTML = '<i data-lucide="help-circle"></i> <span>Take Quiz</span>';
        quizBtn.onclick = () => {
            videoElement.pause();
            openQuiz(id, title);
        };
        
        const header = playerView.querySelector('.player-header');
        const oldBtns = header.querySelectorAll('.btn-external');
        oldBtns.forEach(b => b.remove());
        header.insertBefore(searchBtn, document.getElementById('closePlayer'));
        header.insertBefore(quizBtn, document.getElementById('closePlayer'));

        // Fetch and Play
        loadSource(id, episode, idMal);
        
        lucide.createIcons();
    }

    async function loadSource(id, episode, idMal, providerIndex = 0) {
        // Reset UI only on the first attempt
        if (providerIndex === 0) {
            videoElement.pause();
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
        videoIframe.src = ''; 
        if (detailModal.classList.contains('hidden')) {
            document.body.style.overflow = 'auto';
        }
    };

    quizModalClose.onclick = closeQuiz;

    quizRestartBtn.onclick = () => {
        currentQuestionIndex = 0;
        quizScore = 0;
        quizCorrectCount.innerText = '0';
        quizIncorrectCount.innerText = '0';
        showQuestion();
    };

    quizNextBtn.onclick = () => {
        const totalQuestions = currentQuizQuestions.length;
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            showResults();
        }
    };

    window.onclick = (e) => {
        if (e.target === detailModal.querySelector('.modal-overlay')) {
            modalClose.onclick();
        } else if (e.target === quizModal.querySelector('.modal-overlay')) {
            closeQuiz();
        }
    };

    // Initialize
    init();
});
