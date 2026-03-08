// ============================================
// LIQUID GLASS COMMAND CENTER – FINAL SYSTEM INTERFACE
// ============================================

const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// ---------- GLOBAL STATE ----------
let staffDatabase = { members: [], roles: {} };   // from staff_data.json
let onlineMembers = [];                           // from widget
let logContainer, userDetailModal, streamModal;
let currentAudioEnabled = false;

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    userDetailModal = document.getElementById('user-detail-modal');
    streamModal = document.getElementById('stream-modal');
    logContainer = document.getElementById('log-body');

    initParticles();
    initTilt();
    initClock();
    initBattery();
    initFilters();
    initModals();
    initDraggable();          // now checks viewport width
    initAudioOnFirstInteraction();

    syncSystem();
    setInterval(syncSystem, 25000);

    addLog('System initialized. Awaiting data...');
});

// ========== ORIGINAL FUNCTIONS (unchanged) ==========
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

// ========== NEW FEATURE: CLOCK ==========
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

// ========== NEW FEATURE: BATTERY ==========
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
            fakeLevel = (fakeLevel - 1 + 100) % 100; // cycles 87->86...->0->100...
            document.getElementById('battery-level').textContent = `🔋 ${fakeLevel}%`;
        }, 30000);
    }
}
function updateBattery(level) {
    const percent = Math.round(level * 100);
    document.getElementById('battery-level').textContent = `🔋 ${percent}%`;
}

// ========== NEW FEATURE: FILTER BUTTONS ==========
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
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

// ========== NEW FEATURE: MODAL HANDLING ==========
function initModals() {
    window.addEventListener('click', (e) => {
        if (e.target === streamModal) streamModal.style.display = 'none';
        if (e.target === userDetailModal) userDetailModal.style.display = 'none';
    });
}

// ========== NEW FEATURE: DRAGGABLE WINDOWS (interact.js) – DISABLED ON MOBILE ==========
function initDraggable() {
    // Only enable on desktop (width > 768px)
    if (window.innerWidth <= 768 || typeof interact === 'undefined') return;
    
    interact('.draggable').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move(event) {
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

// ========== NEW FEATURE: AUDIO ON FIRST INTERACTION ==========
function initAudioOnFirstInteraction() {
    const enableAudio = () => {
        if (currentAudioEnabled) return;
        currentAudioEnabled = true;
        document.querySelectorAll('audio').forEach(a => a.load());
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('mouseenter', enableAudio, true);
        addLog('Audio feedback activated');
    };
    document.addEventListener('click', enableAudio);
    document.addEventListener('mouseenter', enableAudio, true);
}

function playHover() {
    if (!currentAudioEnabled) return;
    const sound = document.getElementById('hover-sound');
    if (sound) sound.play().catch(() => {});
}

function playClick() {
    if (!currentAudioEnabled) return;
    const sound = document.getElementById('click-sound');
    if (sound) sound.play().catch(() => {});
}

// ========== NEW FEATURE: SYSTEM LOGS ==========
function addLog(message) {
    if (!logContainer) return;
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// ========== CORE SYNC FUNCTION (REAL DATA) ==========
async function syncSystem() {
    try {
        // 1. Fetch Discord widget (online members)
        const widgetResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const widgetData = await widgetResponse.json();
        onlineMembers = widgetData.members || [];

        // 2. Fetch staff database (from GitHub Action)
        const dbResponse = await fetch('./staff_data.json');
        const dbData = await dbResponse.json();
        staffDatabase = dbData;  // now contains { members, roles, lastUpdated }

        // Update status
        document.getElementById('active-count').innerText = widgetData.presence_count || "0";
        document.getElementById('signal-status').innerText = "LIVE_STREAM_ACTIVE";

        // ---------- STATS GRID (real data) ----------
        const totalStaff = staffDatabase.members.length;
        const staffOnline = onlineMembers.filter(m => staffDatabase.members.some(s => s.id === m.id)).length;
        const lastSync = staffDatabase.lastUpdated ? new Date(staffDatabase.lastUpdated).toLocaleTimeString() : '--:--:--';

        document.getElementById('staff-online').innerText = staffOnline;
        document.getElementById('total-staff').innerText = totalStaff;
        document.getElementById('server-online').innerText = widgetData.presence_count || "0";
        document.getElementById('last-sync').innerText = lastSync;

        // Update progress bar (online staff / total staff)
        const onlinePercent = totalStaff ? (staffOnline / totalStaff) * 100 : 0;
        document.getElementById('staff-progress').style.width = `${onlinePercent}%`;

        // ---------- PROCESS EACH NODE ----------
        const nodes = document.querySelectorAll('.node-container');
        const staffIds = staffDatabase.members.map(m => m.id);

        nodes.forEach(node => {
            const uid = node.getAttribute('data-id');
            const pfpEl = node.querySelector('.node-pfp');
            const nameEl = node.querySelector('.username');

            const live = onlineMembers.find(m => m.id === uid);
            const arch = staffDatabase.members.find(m => m.id === uid);

            if (live) {
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${live.avatar_url}')`;
                if (nameEl) {
                    let displayName = live.username.toUpperCase();
                    if (live.game && live.game.name) {
                        const gameName = live.game.name;
                        displayName += `<br><span class="activity-text">USING: ${gameName.toUpperCase()}</span>`;
                        // Add Spotify bars if applicable
                        if (gameName.toLowerCase().includes('spotify')) {
                            displayName += `<span class="spotify-bars"><span></span><span></span><span></span></span>`;
                        }
                        // Add app icon (simple attempt)
                        const iconUrl = `https://cdn.simpleicons.org/${gameName.toLowerCase().replace(/\s+/g, '')}`;
                        displayName += `<img src="${iconUrl}" class="app-icon" alt="${gameName}" onerror="this.style.display='none'">`;
                    }
                    nameEl.innerHTML = displayName;
                }
            } else if (arch) {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${arch.avatar}')`;
                if (nameEl) nameEl.innerHTML = arch.name.toUpperCase();
            } else {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerHTML = "OFFLINE";
            }

            // Attach modal click (once)
            if (!node.dataset.modalAttached) {
                node.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playClick();
                    showUserModal(node, live, arch);
                });
                node.dataset.modalAttached = 'true';
            }
            node.addEventListener('mouseenter', playHover);
        });

        // ---------- ORBIT UPDATE ----------
        const orbitField = document.getElementById('member-orbit-field');
        if (orbitField) {
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
                div.addEventListener('click', () => {
                    playClick();
                    alert(`${m.username} (non-staff member)`);
                });
                orbitField.appendChild(div);
            });
        }

        // Adaptive theme
        updateAdaptiveTheme();
        addLog(`SYNC: ${onlineMembers.length} online, ${staffOnline} staff active`);

    } catch (err) {
        document.getElementById('signal-status').innerText = "SIGNAL_INTERRUPTED";
        addLog(`ERROR: ${err.message}`);
        console.error(err);
    }
}

// ========== USER MODAL WITH REAL ROLES ==========
function showUserModal(node, live, arch) {
    const modal = userDetailModal;
    if (!modal) return;

    const uid = node.dataset.id;
    const staffMember = staffDatabase.members.find(m => m.id === uid);
    const isOnline = !!live;
    const user = live || arch || {};

    // Avatar
    const avatar = live?.avatar_url || arch?.avatar || SILHOUETTE;
    document.getElementById('modal-avatar').style.backgroundImage = `url('${avatar}')`;

    // Username (use nickname if available)
    const displayName = staffMember?.nickname || user.name || 'UNKNOWN';
    document.getElementById('modal-username').textContent = displayName.toUpperCase();

    // Role badge based on node class
    let roleBadge = 'MEMBER';
    let badgeClass = '';
    if (node.classList.contains('tier-gold')) { roleBadge = 'SUPREME OWNER'; badgeClass = 'owner'; }
    else if (node.classList.contains('tier-crimson')) { roleBadge = 'CO-OWNER'; badgeClass = 'coowner'; }
    else if (node.classList.contains('tier-purple')) { roleBadge = 'SUPER ADMIN'; badgeClass = 'admin'; }
    else if (node.classList.contains('tier-blue')) { roleBadge = 'ADMIN'; badgeClass = 'admin'; }
    else if (node.classList.contains('tier-green')) { roleBadge = 'MODERATOR'; badgeClass = 'mod'; }

    const roleSpan = document.getElementById('modal-role');
    roleSpan.textContent = roleBadge;
    roleSpan.className = `user-role ${badgeClass}`;

    // Activity section
    const activityDiv = document.getElementById('modal-activity');
    if (isOnline && live.game) {
        const game = live.game.name;
        if (game.toLowerCase().includes('spotify')) {
            activityDiv.innerHTML = `
                <div class="user-activity spotify">
                    <img src="https://cdn.simpleicons.org/spotify/1DB954" alt="Spotify"> 
                    <strong>LISTENING TO SPOTIFY</strong><br>
                    <span style="font-size:13px;">♫ ${game}</span>
                </div>
            `;
        } else {
            activityDiv.innerHTML = `
                <div class="user-activity">
                    <strong>ACTIVITY:</strong> ${game}
                </div>
            `;
        }
    } else {
        activityDiv.innerHTML = '<div class="user-activity">User is offline</div>';
    }

    // Discord roles (real from staffDatabase.roles)
    const rolesDiv = document.getElementById('modal-discord-roles');
    if (staffMember && staffMember.roles && staffMember.roles.length > 0) {
        const roleNames = staffMember.roles
            .map(roleId => {
                const role = staffDatabase.roles[roleId];
                return role ? role.name : roleId;
            })
            .join(' • ');
        rolesDiv.innerHTML = `<strong>DISCORD ROLES:</strong> ${roleNames}`;
    } else {
        rolesDiv.innerHTML = '<strong>DISCORD ROLES:</strong> No roles';
    }

    modal.style.display = 'flex';
}

// ========== ADAPTIVE THEME (based on highest online) ==========
function updateAdaptiveTheme() {
    const nodes = document.querySelectorAll('.node-container.online');
    const priority = ['tier-gold', 'tier-crimson', 'tier-purple', 'tier-blue', 'tier-green'];
    let dominantColor = null;

    for (let tier of priority) {
        const onlineNode = Array.from(nodes).find(n => n.classList.contains(tier));
        if (onlineNode) {
            const colorVar = getComputedStyle(onlineNode).getPropertyValue(`--${tier.replace('tier-', '')}`).trim();
            dominantColor = colorVar || '#ffffff';
            break;
        }
    }

    if (dominantColor) {
        document.documentElement.style.setProperty('--active-tint', dominantColor);
        document.querySelectorAll('.blob').forEach((blob, i) => {
            blob.style.background = dominantColor;
            if (i === 1) blob.style.filter = 'brightness(0.8)';
            if (i === 2) blob.style.filter = 'brightness(1.2)';
        });
    }
        }
