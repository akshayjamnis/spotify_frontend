
    // ---------- Mock Data ----------
    const MOCK_TRACKS = [
        { id: 1, title: "Neon Skyline", artist: "Bytewave", duration: 208, color: "#5eead4" },
        { id: 2, title: "Midnight Commit", artist: "The Mergers", duration: 192, color: "#fca5a5" },
        { id: 3, title: "Event Loop", artist: "Async Ally", duration: 176, color: "#93c5fd" },
        { id: 4, title: "Type Safe", artist: "Static Rush", duration: 205, color: "#c4b5fd" },
        { id: 5, title: "Pixel Dust", artist: "Lo-Fidelity", duration: 184, color: "#fde68a" },
        { id: 6, title: "Green Threads", artist: "Go Go Go", duration: 230, color: "#86efac" },
        { id: 7, title: "Container Blues", artist: "Dock Hands", duration: 156, color: "#a5b4fc" },
        { id: 8, title: "Semantic Dreams", artist: "ARIA", duration: 210, color: "#f0abfc" },
        { id: 9, title: "Garbage Collector", artist: "Memory Leak", duration: 201, color: "#f9a8d4" },
        { id: 10, title: "Hot Reload", artist: "Dev Server", duration: 165, color: "#fdba74" }
    ];

    const STATE = {
        queue: [...MOCK_TRACKS],
        index: 0,
        isPlaying: false,
        shuffle: false,
        repeat: 'off', // off | one | all
        cur: 0, // seconds
        vol: 0.8,
        timer: null
    };

    // ---------- Helpers ----------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmt = s => {
        s = Math.floor(s);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    function setAriaNow(percent) {
        const bar = $('#progressBar');
        bar.setAttribute('aria-valuenow', String(percent));
    }

    // Render grids
    function renderCards() {
        const grids = [$('#recentGrid'), $('#madeGrid')];
        const items = STATE.queue;
        grids.forEach(grid => {
            grid.innerHTML = '';
            items.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.id = t.id;
                card.innerHTML = `
        <div class="thumb" style="background: radial-gradient(circle at 30% 30%, ${t.color}, #222)">🎵</div>
        <div class="meta">
            <div class="title">${t.title}</div>
            <div class="subtitle">${t.artist} • ${fmt(t.duration)}</div>
        </div>`;
                card.addEventListener('click', () => playTrackById(t.id));
                grid.appendChild(card);
            });
        });
    }

    function filterCards(term) {
        const q = term.trim().toLowerCase();
        $$('.card').forEach(c => {
            const txt = c.textContent.toLowerCase();
            c.style.display = txt.includes(q) ? '' : 'none';
        });
    }

    // Player UI updates
    function updateMini() {
        const t = STATE.queue[STATE.index];
        if (!t) return;
        $('#miniTitle').textContent = t.title;
        $('#miniArtist').textContent = t.artist;
        $('#miniPic').style.background = `linear-gradient(135deg, ${t.color}, #111)`;
        $('#durTime').textContent = fmt(t.duration);
        $('#curTime').textContent = fmt(STATE.cur);
        const pct = Math.max(0, Math.min(100, STATE.cur / t.duration * 100));
        $('#progressFill').style.width = pct + '%';
        $('#progressKnob').style.left = pct + '%';
        setAriaNow(pct);
        $('#playBtn').textContent = STATE.isPlaying ? '⏸️' : '▶️';
    }

    function tick() {
        const t = STATE.queue[STATE.index];
        if (!t) return;
        STATE.cur += 1;
        if (STATE.cur >= t.duration) {
            if (STATE.repeat === 'one') {
                STATE.cur = 0;
            } else {
                next();
                return;
            }
        }
        updateMini();
    }

    function play() {
        if (STATE.isPlaying) return;
        STATE.isPlaying = true;
        STATE.timer = setInterval(tick, 1000);
        updateMini();
    }
    function pause() {
        STATE.isPlaying = false;
        clearInterval(STATE.timer);
        updateMini();
    }

    function playTrackById(id) {
        const idx = STATE.queue.findIndex(x => x.id === id);
        if (idx !== -1) {
            STATE.index = idx;
            STATE.cur = 0;
            if (STATE.isPlaying) { clearInterval(STATE.timer); }
            play();
        }
    }

    function next() {
        if (STATE.shuffle) {
            let n;
            do { n = Math.floor(Math.random() * STATE.queue.length) } while (n === STATE.index && STATE.queue.length > 1);
            STATE.index = n;
        } else {
            STATE.index = (STATE.index + 1) % STATE.queue.length;
            if (STATE.index === 0 && STATE.repeat === 'off') pause();
        }
        STATE.cur = 0; updateMini(); if (STATE.isPlaying) { clearInterval(STATE.timer); STATE.timer = setInterval(tick, 1000); }
    }

    function prev() {
        if (STATE.cur > 3) { STATE.cur = 0; updateMini(); return; }
        STATE.index = (STATE.index - 1 + STATE.queue.length) % STATE.queue.length;
        STATE.cur = 0; updateMini();
    }

    // ---------- Events ----------
    $('#playBtn').addEventListener('click', () => STATE.isPlaying ? pause() : play());
    $('#nextBtn').addEventListener('click', next);
    $('#prevBtn').addEventListener('click', prev);

    $('#shuffleBtn').addEventListener('click', () => {
        STATE.shuffle = !STATE.shuffle;
        $('#shuffleBtn').style.opacity = STATE.shuffle ? '1' : '.6';
    });
    $('#repeatBtn').addEventListener('click', () => {
        STATE.repeat = STATE.repeat === 'off' ? 'all' : STATE.repeat === 'all' ? 'one' : 'off';
        $('#repeatBtn').textContent = STATE.repeat === 'one' ? '🔂' : '🔁';
        $('#repeatBtn').style.opacity = STATE.repeat === 'off' ? '.6' : '1';
    });

    // Seek by clicking the bar
    $('#progressBar').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const t = STATE.queue[STATE.index];
        STATE.cur = Math.max(0, Math.min(t.duration, Math.floor(t.duration * pct)));
        updateMini();
    });

    // Volume (visual only in this mock)
    const vol = $('#volRange');
    vol.addEventListener('input', () => { STATE.vol = vol.value / 100; $('#muteToggle').textContent = STATE.vol === 0 ? '🔇' : '🔊'; });
    $('#muteToggle').addEventListener('click', () => {
        if (STATE.vol > 0) { vol.dataset.prev = vol.value; vol.value = 0; }
        else { vol.value = vol.dataset.prev || 80; }
        vol.dispatchEvent(new Event('input'));
    });

    // Search filter
    $('#searchInput').addEventListener('input', (e) => filterCards(e.target.value));

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.code === 'Space') { e.preventDefault(); STATE.isPlaying ? pause() : play(); }
        if (e.code === 'ArrowRight') { STATE.cur = Math.min(STATE.queue[STATE.index].duration, STATE.cur + 5); updateMini(); }
        if (e.code === 'ArrowLeft') { STATE.cur = Math.max(0, STATE.cur - 5); updateMini(); }
        if (e.key.toLowerCase() === 'm') { $('#muteToggle').click(); }
    });

    // Initialize
    renderCards();
    updateMini();
