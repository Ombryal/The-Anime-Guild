const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// --- PARTICLE ENGINE CONFIG ---
class Particle {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20;
        this.size = Math.random() * 2 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.opacity = 1;
        this.color = color;
    }
    update() {
        this.y -= this.speedY;
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

const activeParticles = [];
function initParticles() {
    const canvases = document.querySelectorAll('.particle-canvas');
    canvases.forEach(canvas => {
        const parent = canvas.parentElement;
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        
        // Determine color based on tier
        let pColor = "#ffffff";
        if (parent.classList.contains('tier-gold')) pColor = "#ffcf40";
        if (parent.classList.contains('tier-crimson')) pColor = "#dc143c";

        function animate() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (Math.random() > 0.85) activeParticles.push(new Particle(canvas, pColor));
            
            for (let i = activeParticles.length - 1; i >= 0; i--) {
                activeParticles[i].update();
                activeParticles[i].draw();
                if (activeParticles[i].opacity <= 0) activeParticles.splice(i, 1);
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
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
        });
    });
}

// --- CORE DATA SYNC ---
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
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${live.avatar_url}')`;
                if (nameEl) nameEl.innerText = live.username.toUpperCase();
            } else if (arch) {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${arch.avatar}')`;
                if (nameEl) nameEl.innerText = arch.name.toUpperCase();
            } else {
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerText = "OFFLINE";
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
            orbitField.appendChild(div);
        });

    } catch (err) {
        document.getElementById('signal-status').innerText = "SIGNAL_INTERRUPTED";
    }
}

// --- BOOT SEQUENCE ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTilt();
    syncSystem();
    // Faster check (25 seconds) as requested
    setInterval(syncSystem, 25000); 
});
