// ============================================
// LIQUID GLASS COMMAND CENTER – FULL SYSTEM INTERFACE
// ============================================

const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// ---------- GLOBAL REFERENCES ----------
let staffDatabase = [];          // will hold loaded staff data
let onlineMembers = [];           // last fetched online list
let logContainer = null;
let userDetailModal, streamModal;
let currentAudioEnabled = false;  // to handle autoplay restrictions

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    // Store modal references
    userDetailModal = document.getElementById('user-detail-modal');
    streamModal = document.getElementById('stream-modal');
    logContainer = document.getElementById('log-body');

    // Initialize all components
    initParticles();          // from your original code
    initTilt();               // from your original code
    initClock();
    initBattery();
    initFilters();
    initModals();
    initDraggable();
    initAudioOnFirstInteraction();

    // Start data sync
    syncSystem();
    setInterval(syncSystem, 25000);

    // Add initial log entries
    addLog('System initialized. Awaiting data...');
});

// ---------- ORIGINAL FUNCTIONS (kept intact) ----------
class Particle {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + (Math.random() * 20) - 10; 
        this.size = Math.random() * 2.5 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = 1;
        this.color = color;
    }
    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.opacity -= 0.005;
    }
    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

function initParticles() {
    const canvases = document.querySelectorAll('.particle-canvas');
    canvases.forEach(canvas => {
        const parent = canvas.parentElement;
        const localParticles = [];
        canvas.width = parent.offsetWidth + 120;
        canvas.height = parent.offsetHeight + 120;
        
        let pColor = "#ffffff";
        if (parent.classList.contains('tier-gold')) pColor = "#ffcf40";
        if (parent.classList.contains('tier-crimson')) pColor = "#dc143c";

        function animate() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (parent.classList.contains('online') && Math.random() > 0.85) {
                localParticles.push(new Particle(canvas, pColor));
            }
            for (let i = localParticles.length - 1; i >= 0; i--) {
                localParticles[i].update();
                localParticles[i].draw();
                if (localParticles[i].opacity <= 0) localParticles.splice(i, 1);
            }
            requestAnimationFrame(animate);
        }
        animate();
    });
}

function initTilt() {
    const cards = document.querySelectorAll('.node-container');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px) scale(1.03)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`;
        });
    });
}

// ---------- NEW FEATURE: SYSTEM CLOCK ----------
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}
function updateClock() {
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// ---------- NEW FEATURE: BATTERY ----------
function initBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            updateBattery(battery.level);
            battery.addEventListener('levelchange', () => updateBattery(battery.level));
        });
    } else {
        // Fake battery drain for effect
        let fakeLevel = 87;
        setInterval(() => {
            fakeLevel = (fakeLevel - 1 + 100) % 100; // cycles 87->86->...->0->100...
            document.getElementById('battery-level').textContent = `🔋 ${fakeLevel}%`;
        }, 30000);
    }
}
function updateBattery(level) {
    const percent = Math.round(level * 100);
    document.getElementById('battery-level').textContent = `🔋 ${percent}%`;
}

// ---------- NEW FEATURE: FILTER BUTTONS ----------
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const nodes = document.querySelectorAll('.node-container');
            
            nodes.forEach(node => {
                switch (filter) {
                    case 'all':
                        node.style.display = 'flex';
                        break;
                    case 'online':
                        node.style.display = node.classList.contains('online') ? 'flex' : 'none';
                        break;
                    case 'mods':
                        node.style.display = node.classList.contains('tier-green') ? 'flex' : 'none';
                        break;
                    case 'admins':
                        node.style.display = (node.classList.contains('tier-purple') || node.classList.contains('tier-blue')) ? 'flex' : 'none';
                        break;
                    case 'owners':
                        node.style.display = (node.classList.contains('tier-gold') || node.classList.contains('tier-crimson')) ? 'flex' : 'none';
                        break;
                }
            });
            addLog(`Filter applied: ${filter.toUpperCase()}`);
        });
    });
}

// ---------- NEW FEATURE: MODALS ----------
function initModals() {
    // Close modals when clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === streamModal) streamModal.style.display = 'none';
        if (e.target === userDetailModal) userDetailModal.style.display = 'none';
    });
}

// Show user detail modal with enriched data
function showUserModal(node, userData, isOnline, activity) {
    const modal = userDetailModal;
    if (!modal) return;

    // Get user info from staffDatabase or widget
    const uid = node.dataset.id;
    const staffInfo = staffDatabase.find(m => m.id === uid) || {};
    const username = userData?.username || staffInfo.name || 'UNKNOWN';
    const avatar = userData?.avatar_url || staffInfo.avatar || SILHOUETTE;

    // Set avatar and name
    document.getElementById('modal-avatar').style.backgroundImage = `url('${avatar}')`;

    // Determine role based on node class
    let roleText = 'MEMBER';
    let roleClass = '';
    if (node.classList.contains('tier-gold')) { roleText = 'SUPREME OWNER'; roleClass = 'owner'; }
    else if (node.classList.contains('tier-crimson')) { roleText = 'CO-OWNER'; roleClass = 'coowner'; }
    else if (node.classList.contains('tier-purple')) { roleText = 'SUPER ADMIN'; roleClass = 'admin'; }
    else if (node.classList.contains('tier-blue')) { roleText = 'ADMIN'; roleClass = 'admin'; }
    else if (node.classList.contains('tier-green')) { roleText = 'MODERATOR'; roleClass = 'mod'; }

    document.getElementById('modal-username').textContent = username.toUpperCase();
    const roleSpan = document.getElementById('modal-role');
    roleSpan.textContent = roleText;
    roleSpan.className = `user-role ${roleClass}`;

    // Activity section
    const activityDiv = document.getElementById('modal-activity');
    let activityHtml = '';
    if (isOnline && activity) {
        const appName = activity.name || '';
        if (appName.toLowerCase().includes('spotify')) {
            // Mock Spotify data – in real app you'd get track from presence
            activityHtml = `
                <div class="user-activity spotify">
                    <img src="https://cdn.simpleicons.org/spotify/1DB954" alt="Spotify"> 
                    <strong>LISTENING TO SPOTIFY</strong><br>
                    <span style="font-size:13px;">♫ Unknown Track – extract from presence</span>
                </div>
            `;
        } else if (activity.type === 1) { // Twitch streaming (activity type 1)
            activityHtml = `
                <div class="user-activity twitch">
                    <img src="https://cdn.simpleicons.org/twitch/9146FF" alt="Twitch"> 
                    <strong>LIVE ON TWITCH</strong><br>
                    <span style="font-size:13px;">${activity.name || 'Streaming'}</span><br>
                    <button class="filter-btn" onclick="document.getElementById('stream-frame').src='https://twitch.tv/...'; document.getElementById('stream-modal').style.display='flex';">WATCH STREAM</button>
                </div>
            `;
        } else {
            activityHtml = `
                <div>
                    <img src="https://icon.horse/icon/${appName.replace(/\s+/g, '')}.com" class="app-icon" onerror="this.style.display='none'"> 
                    <strong>USING ${appName.toUpperCase()}</strong>
                </div>
            `;
        }
    } else {
        activityHtml = '<div>User is offline</div>';
    }
    activityDiv.innerHTML = activityHtml;

    // Discord roles (mock for now – you can expand later)
    const rolesDiv = document.getElementById('modal-discord-roles');
    // You could fetch actual roles from your bot; for now show static based on tier
    const roles = [];
    if (node.classList.contains('tier-gold')) roles.push('SUPREME OWNER', 'ADMIN', 'MOD', 'EVERYONE');
    else if (node.classList.contains('tier-crimson')) roles.push('CO-OWNER', 'ADMIN', 'MOD', 'EVERYONE');
    else if (node.classList.contains('tier-purple')) roles.push('SUPER ADMIN', 'MOD', 'EVERYONE');
    else if (node.classList.contains('tier-blue')) roles.push('ADMIN', 'MOD', 'EVERYONE');
    else if (node.classList.contains('tier-green')) roles.push('MOD', 'EVERYONE');
    rolesDiv.innerHTML = `<strong>DISCORD ROLES:</strong> ${roles.join(' • ')}`;

    modal.style.display = 'flex';
}

// ---------- NEW FEATURE: DRAGGABLE WINDOWS (interact.js) ----------
function initDraggable() {
    if (typeof interact === 'undefined') return;
    interact('.draggable').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move (event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            }
        }
    });
}

// ---------- NEW FEATURE: SYSTEM LOGS ----------
function addLog(message) {
    if (!logContainer) return;
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    // Keep only last 50 entries to avoid overflow
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// ---------- NEW FEATURE: ADAPTIVE THEME (background tint) ----------
function updateAdaptiveTheme() {
    const nodes = document.querySelectorAll('.node-container');
    const priority = ['tier-gold', 'tier-crimson', 'tier-purple', 'tier-blue', 'tier-green'];
    let dominantColor = null;

    for (let tier of priority) {
        const onlineNode = Array.from(nodes).find(n => n.classList.contains(tier) && n.classList.contains('online'));
        if (onlineNode) {
            const colorVar = getComputedStyle(onlineNode).getPropertyValue(`--${tier.replace('tier-', '')}`);
            dominantColor = colorVar.trim();
            break;
        }
    }

    if (dominantColor) {
        document.documentElement.style.setProperty('--active-tint', dominantColor);
        // Apply to blobs with transition
        document.querySelectorAll('.blob').forEach((blob, index) => {
            blob.style.background = dominantColor;
            // Slight variation for depth
            if (index === 1) blob.style.filter = 'brightness(0.8)';
            if (index === 2) blob.style.filter = 'brightness(1.2)';
        });
    }
}

// ---------- NEW FEATURE: ENHANCE ACTIVITY DISPLAY (Spotify bars, icons) ----------
function enhanceActivityDisplay() {
    document.querySelectorAll('.node-container.online .username').forEach(nameEl => {
        // Check if there's already an activity-text span
        const activitySpan = nameEl.querySelector('.activity-text');
        if (!activitySpan) return;

        const activityText = activitySpan.textContent;
        if (activityText.toLowerCase().includes('spotify')) {
            // Add Spotify bars if not already present
            if (!nameEl.querySelector('.spotify-bars')) {
                const bars = document.createElement('span');
                bars.className = 'spotify-bars';
                bars.innerHTML = '<span></span><span></span><span></span>';
                nameEl.appendChild(bars);
            }
        }

        // Add app icon next to activity text
        const appMatch = activityText.match(/USING: (.+)/);
        if (appMatch) {
            const appName = appMatch[1].trim();
            const iconUrl = `https://cdn.simpleicons.org/${appName.toLowerCase().replace(/\s+/g, '')}`;
            const img = document.createElement('img');
            img.src = iconUrl;
            img.className = 'app-icon';
            img.alt = appName;
            img.onerror = () => img.style.display = 'none';
            activitySpan.appendChild(img);
        }
    });
}

// ---------- NEW FEATURE: AUDIO ON FIRST INTERACTION ----------
function initAudioOnFirstInteraction() {
    const enableAudio = () => {
        if (currentAudioEnabled) return;
        currentAudioEnabled = true;
        // Preload and allow audio
        document.querySelectorAll('audio').forEach(a => a.load());
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('mouseenter', enableAudio, true);
        addLog('Audio feedback activated');
    };
    document.addEventListener('click', enableAudio);
    document.addEventListener('mouseenter', enableAudio, true);
}

// Play hover sound (if enabled)
function playHover() {
    if (!currentAudioEnabled) return;
    const sound = document.getElementById('hover-sound');
    if (sound) sound.play().catch(() => {});
}

// Play click sound (if enabled)
function playClick() {
    if (!currentAudioEnabled) return;
    const sound = document.getElementById('click-sound');
    if (sound) sound.play().catch(() => {});
}

// ---------- ORIGINAL syncSystem (modified to integrate new features) ----------
async function syncSystem() {
    try {
        // Fetch widget data
        const widgetResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const widgetData = await widgetResponse.json();
        onlineMembers = widgetData.members || [];
        
        // Fetch staff database
        const dbResponse = await fetch('./staff_data.json');
        const dbData = await dbResponse.json();
        staffDatabase = dbData.members || []; 

        // Update sync timestamp in UI (if element exists)
        if (dbData.lastUpdated) {
            const date = new Date(dbData.lastUpdated);
            const timeEl = document.getElementById('sync-time');
            if(timeEl) timeEl.innerText = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        // Update online count
        document.getElementById('active-count').innerText = widgetData.presence_count || "00";
        document.getElementById('signal-status').innerText = "LIVE_STREAM_ACTIVE";

        // Update stats grid with mock data (replace with real API later)
        document.getElementById('boost-count').innerText = '14';
        document.getElementById('boost-progress').style.width = '70%';
        document.getElementById('member-count').innerText = '1,247';
        document.getElementById('member-trend').innerText = '+2.3%';
        document.getElementById('top-poster').innerText = '@midnightcane';
        document.getElementById('top-poster-count').innerText = '(142 msgs)';

        // Process each node
        const nodes = document.querySelectorAll('.node-container');
        const staffIds = [];

        nodes.forEach(node => {
            const uid = node.getAttribute('data-id');
            staffIds.push(uid);
            const pfpEl = node.querySelector('.node-pfp');
            const nameEl = node.querySelector('.username');

            const live = onlineMembers.find(m => m.id === uid);
            const arch = staffDatabase.find(m => m.id === uid);

            // Store data attributes for modal
            node.dataset.username = live?.username || arch?.name || 'OFFLINE';
            node.dataset.avatar = live?.avatar_url || arch?.avatar || SILHOUETTE;

            if (live) {
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${live.avatar_url}')`;
                const activity = live.game;
                if (nameEl) {
                    let activityHtml = live.username.toUpperCase();
                    if (activity && activity.name) {
                        activityHtml += `<br><span class="activity-text">USING: ${activity.name.toUpperCase()}</span>`;
                    }
                    nameEl.innerHTML = activityHtml;
                }
                // Add click listener for modal (if not already added)
                if (!node.dataset.modalAttached) {
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playClick();
                        showUserModal(node, live, true, activity);
                    });
                    node.dataset.modalAttached = 'true';
                }
            } else if (arch) {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${arch.avatar}')`;
                if (nameEl) nameEl.innerHTML = arch.name.toUpperCase();
                // Add click listener for offline modal
                if (!node.dataset.modalAttached) {
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playClick();
                        showUserModal(node, null, false, null);
                    });
                    node.dataset.modalAttached = 'true';
                }
            } else {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerHTML = "OFFLINE";
                if (!node.dataset.modalAttached) {
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playClick();
                        showUserModal(node, null, false, null);
                    });
                    node.dataset.modalAttached = 'true';
                }
            }

            // Add hover sound (only if audio enabled)
            node.addEventListener('mouseenter', playHover);
        });

        // Enhance activity display with Spotify bars and icons
        enhanceActivityDisplay();

        // Update orbit nodes (same as original, but make them clickable)
        const orbitField = document.getElementById('member-orbit-field');
        if(orbitField) {
            orbitField.innerHTML = '';
            const civilians = onlineMembers.filter(m => !staffIds.includes(m.id));
            civilians.slice(0, 12).forEach((m, i) => {
                const angle = (i / Math.min(civilians.length, 12)) * (Math.PI * 2);
                const x = Math.cos(angle) * 110 + 150 - 19;
                const y = Math.sin(angle) * 110 + 150 - 19;
                const div = document.createElement('div');
                div.className = 'orbit-node';
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.style.backgroundImage = `url('${m.avatar_url}')`;
                div.dataset.id = m.id;
                div.addEventListener('click', () => {
                    playClick();
                    // Find corresponding node or just show quick info
                    alert(`${m.username} – click node for details`);
                });
                orbitField.appendChild(div);
            });
        }

        // Update adaptive theme based on highest online rank
        updateAdaptiveTheme();

        // Add system log
        addLog(`SYSTEM_SYNC: ${onlineMembers.length} members detected, ${widgetData.presence_count} online`);

    } catch (err) {
        const statusEl = document.getElementById('signal-status');
        if(statusEl) statusEl.innerText = "SIGNAL_INTERRUPTED";
        addLog(`ERROR: ${err.message}`);
        console.error(err);
    }
}
