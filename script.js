/**
 * CYBER-COMMAND INTERFACE v5.0
 * Features: Offline Fallback, Live Sync, and Radar Targeting
 */

const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

async function syncSystem() {
    console.log(">> [SYSTEM_SYNC] Initiating link with Discord...");
    
    try {
        // 1. Fetch the Live Discord Widget (for real-time status)
        const widgetResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        if (!widgetResponse.ok) throw new Error('WIDGET_UNREACHABLE');
        const widgetData = await widgetResponse.json();
        const onlineList = widgetData.members;
        
        // 2. Fetch the Archived Staff Database (The file GitHub Action builds)
        let staffDatabase = [];
        try {
            const dbResponse = await fetch('./staff_data.json');
            if (dbResponse.ok) staffDatabase = await dbResponse.json();
        } catch (e) {
            console.warn(">> [DB_WAIT] Staff data not generated yet. Running on live-only mode.");
        }

        // 3. Update the Counter & Status
        const activeCount = widgetData.presence_count;
        document.getElementById('active-count').innerText = activeCount < 10 ? `0${activeCount}` : activeCount;
        document.getElementById('signal-status').innerText = "ESTABLISHED";
        document.getElementById('signal-status').className = "value pulse-green";

        // 4. Update the Hierarchy Grid
        const nodes = document.querySelectorAll('.node-container');
        const staffIds = []; // Store IDs to exclude them from the Orbit ring

        nodes.forEach(node => {
            const uid = node.getAttribute('data-id');
            staffIds.push(uid);
            
            const pfpEl = node.querySelector('.node-pfp');
            const nameEl = node.querySelector('.username');

            // Find data in Live Widget (Online) vs Database (Offline)
            const liveMember = onlineList.find(m => m.id === uid);
            const archivedMember = staffDatabase.find(m => m.id === uid);

            if (liveMember) {
                // STATUS: ONLINE
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${liveMember.avatar_url}')`;
                if (nameEl) nameEl.innerText = liveMember.username.toUpperCase();
            } else if (archivedMember) {
                // STATUS: OFFLINE (Using DB info)
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${archivedMember.avatar}')`;
                if (nameEl) nameEl.innerText = `${archivedMember.name.toUpperCase()} [OFFLINE]`;
            } else {
                // STATUS: UNKNOWN (First run or ID mismatch)
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerText = "LINK_SEARCHING...";
            }
        });

        // 5. Update the Radar Orbit Ring
        const orbitField = document.getElementById('member-orbit-field');
        orbitField.innerHTML = ''; // Clear previous blips
        
        // Filter out staff so we only show "Civilian/Member" signals
        const civilianMembers = onlineList.filter(m => !staffIds.includes(m.id));
        
        if (civilianMembers.length === 0) {
            // Visual feedback when radar is empty
            orbitField.innerHTML = '<div style="color:var(--neon-blue); font-size:10px; padding-top:140px; opacity:0.5;">NO_SIGNAL_DETECTED</div>';
        } else {
            const maxBlips = 12; // Limit to 12 for performance/cleanliness
            civilianMembers.slice(0, maxBlips).forEach((member, i) => {
                const angle = (i / Math.min(civilianMembers.length, maxBlips)) * (Math.PI * 2);
                const radius = 110; // Matches your CSS ring size
                
                // Math for circular positioning
                const x = Math.cos(angle) * radius + 150 - 19; // 150 is half-width, 19 is half-pfp
                const y = Math.sin(angle) * radius + 150 - 19;

                const blip = document.createElement('div');
                blip.className = 'orbit-node';
                blip.style.left = `${x}px`;
                blip.style.top = `${y}px`;
                blip.style.backgroundImage = `url('${member.avatar_url}')`;
                
                // Tooltip for the username
                blip.title = `SIGNAL: ${member.username.toUpperCase()}`;
                
                orbitField.appendChild(blip);
            });
        }

    } catch (err) {
        console.error(">> [SYSTEM_CRITICAL] Signal lost:", err);
        document.getElementById('signal-status').innerText = "SIGNAL_LOST";
        document.getElementById('signal-status').className = "value pulse-red";
    }
}

// System Boot-up sequence
document.addEventListener('DOMContentLoaded', () => {
    // Run immediately on load
    syncSystem();
    
    // Refresh every 45 seconds (Discord's widget cache is about this long)
    setInterval(syncSystem, 45000);
});
