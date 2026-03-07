/**
 * Discord Orbit Widget Script
 * Fetches data from Discord API and handles circular positioning
 */

const SERVER_ID = '1433645535583277129'; // Your Server ID

async function initDiscordOrbit() {
    const ring = document.getElementById('member-orbit-ring');
    const loader = document.getElementById('widget-loader');
    const center = document.getElementById('orbit-center');
    const serverIcon = document.getElementById('server-icon');
    const serverName = document.getElementById('server-name');
    const onlineCount = document.getElementById('online-count');

    try {
        // Fetch data from Discord's public widget API
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        
        if (!response.ok) throw new Error('Widget disabled in Discord Settings');
        
        const data = await response.json();

        // 1. Update Center Info
        // Note: API doesn't always provide server icon, so we use a fallback if needed
        serverIcon.src = data.members[0]?.avatar_url || ""; 
        serverName.innerText = data.name;
        onlineCount.innerText = `${data.presence_count} Online`;

        // 2. Process Members (Limit to 10 for a clean look)
        const activeMembers = data.members.slice(0, 10);
        const total = activeMembers.length;
        const radius = 150; // Distance from center

        ring.innerHTML = ''; // Clear ring

        activeMembers.forEach((member, i) => {
            // Create a wrapper for the PFP
            const node = document.createElement('div');
            node.className = 'member-node';

            // Use trigonometry to calculate X and Y position
            const angle = (i / total) * (2 * Math.PI);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Apply position
            node.style.transform = `translate(${x}px, ${y}px)`;

            // Create the image
            const img = document.createElement('img');
            img.src = member.avatar_url;
            img.className = 'member-pfp';
            img.title = member.username; // Show name on hover
            
            node.appendChild(img);
            ring.appendChild(node);
        });

        // 3. Reveal Widget
        loader.classList.add('hidden');
        center.classList.remove('hidden');

    } catch (err) {
        console.error("Orbit Widget Error:", err);
        document.getElementById('server-name').innerText = "Error Loading";
        document.getElementById('online-count').innerText = "Check Widget Settings";
        loader.classList.add('hidden');
        center.classList.remove('hidden');
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', initDiscordOrbit);
