const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// --- PARTICLE ENGINE CONFIG ---
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

// --- CORE DATA SYNC ---
async function syncSystem() {
    try {
        const widgetResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const widgetData = await widgetResponse.json();
        const onlineList = widgetData.members || [];
        
        // FIX: Handling the new object structure from staff_data.json
        const dbResponse = await fetch('./staff_data.json');
        const dbData = await dbResponse.json();
        const staffDatabase = dbData.members || []; 

        // Update Sync Timestamp UI
        if(dbData.lastUpdated) {
            const date = new Date(dbData.lastUpdated);
            const timeEl = document.getElementById('sync-time');
            if(timeEl) timeEl.innerText = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        document.getElementById('active-count').innerText = widgetData.presence_count || "00";
        document.getElementById('signal-status').innerText = "LIVE_STREAM_ACTIVE";

        const nodes = document.querySelectorAll('.node-container');
        const staffIds = [];

        nodes.forEach(node => {
            const uid = node.getAttribute('data-id');
            staffIds.push(uid);
            const pfpEl = node.querySelector('.node-pfp');
            const nameEl = node.querySelector('.username');

            const live = onlineList.find(m => m.id === uid);
            const arch = staffDatabase.find(m => m.id === uid);

            if (live) {
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${live.avatar_url}')`;
                const activity = live.game;
                if (nameEl) {
                    nameEl.innerHTML = activity && activity.name 
                        ? `${live.username.toUpperCase()}<br><span class="activity-text">USING: ${activity.name.toUpperCase()}</span>`
                        : live.username.toUpperCase();
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
        });

        // Orbit Update
        const orbitField = document.getElementById('member-orbit-field');
        if(orbitField) {
            orbitField.innerHTML = '';
            const civilians = onlineList.filter(m => !staffIds.includes(m.id));
            civilians.slice(0, 12).forEach((m, i) => {
                const angle = (i / Math.min(civilians.length, 12)) * (Math.PI * 2);
                const x = Math.cos(angle) * 110 + 150 - 19;
                const y = Math.sin(angle) * 110 + 150 - 19;
                const div = document.createElement('div');
                div.className = 'orbit-node';
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.style.backgroundImage = `url('${m.avatar_url}')`;
                orbitField.appendChild(div);
            });
        }

        // HIDE PRELOADER
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 1000);
        }

    } catch (err) {
        const statusEl = document.getElementById('signal-status');
        if(statusEl) statusEl.innerText = "SIGNAL_INTERRUPTED";
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTilt();
    syncSystem();
    setInterval(syncSystem, 25000); 
});
