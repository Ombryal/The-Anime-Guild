const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// --- PARTICLE ENGINE CONFIG (EXPANDED AURA) ---
class Particle {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Spawn particles across the newly expanded canvas area (outside the box)
        this.x = Math.random() * canvas.width;
        // Start near the bottom of the expanded canvas
        this.y = canvas.height + (Math.random() * 20) - 20; 
        
        this.size = Math.random() * 2.5 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5; // Slight side-to-side drift
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
        const localParticles = []; // Scoped to prevent cross-canvas flickering
        
        // Expand canvas dimensions to match the CSS expansion (calc(100% + 120px))
        // This gives the particles room to float around the box
        canvas.width = parent.offsetWidth + 120;
        canvas.height = parent.offsetHeight + 120;
        
        // Determine color based on tier
        let pColor = "#ffffff";
        if (parent.classList.contains('tier-gold')) pColor = "#ffcf40";
        if (parent.classList.contains('tier-crimson')) pColor = "#dc143c";

        function animate() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Only spawn particles if the container is currently online
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

// --- LIQUID GLASS TILT EFFECT ---
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

// --- CORE DATA SYNC & ACTIVITY FETCH ---
async function syncSystem() {
    console.log(">> [LIQUID_SYNC] Polling Discord API...");
    
    try {
        const widgetResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const widgetData = await widgetResponse.json();
        const onlineList = widgetData.members || [];
        
        let staffDatabase = [];
        try {
            const dbResponse = await fetch('./staff_data.json');
            if (dbResponse.ok) staffDatabase = await dbResponse.json();
        } catch (e) { console.warn("Staff database not found."); }

        // Update Counter
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
                // STATUS: ONLINE
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${live.avatar_url}')`;
                
                // Check for current Discord activity/game
                const activity = live.game;
                if (nameEl) {
                    if (activity && activity.name) {
                        nameEl.innerHTML = `${live.username.toUpperCase()}<br><span class="activity-text">USING: ${activity.name.toUpperCase()}</span>`;
                    } else {
                        nameEl.innerHTML = live.username.toUpperCase();
                    }
                }
            } else if (arch) {
                // STATUS: OFFLINE (Fallback to database)
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${arch.avatar}')`;
                if (nameEl) nameEl.innerHTML = arch.name.toUpperCase();
            } else {
                // STATUS: UNKNOWN
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerHTML = "OFFLINE";
            }
        });

        // Orbit Update
        const orbitField = document.getElementById('member-orbit-field');
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
            div.title = m.username; // Add a tooltip for hovering over radar blips
            orbitField.appendChild(div);
        });

    } catch (err) {
        document.getElementById('signal-status').innerText = "SIGNAL_INTERRUPTED";
        console.error("Sync Error:", err);
    }
}

// --- BOOT SEQUENCE ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTilt();
    syncSystem();
    // Fetch live data every 25 seconds
    setInterval(syncSystem, 25000); 
});
