/** * DISCORD COMMAND CENTER LOGIC v4.0
 * Handles real-time API integration and dynamic UI population
 */

const SERVER_ID = '1433645535583277129';
const SILHOUETTE = 'https://archive.org/download/discord_default_avatars/gray.png';

// Dynamic Staff Mapping
const STAFF_RECORDS = [
    { id: '683212245311946795', role: 'OWNER' },
    { id: '959431187955351623', role: 'CO-OWNER' },
    { id: '183900012705480705', role: 'SUPER ADMIN' },
    { id: '1398034278662537337', role: 'ADMIN' },
    { id: '1388087779174383719', role: 'MOD' },
    { id: '287809220210851851', role: 'MOD' },
    { id: '368838581009252362', role: 'MOD' },
    { id: '916731589893959710', role: 'MOD' },
    { id: '226914498089451520', role: 'MOD' },
    { id: '531178595130015755', role: 'MOD' },
    { id: '652983918013841429', role: 'MOD' },
    { id: '556714289453465601', role: 'MOD' }
];

async function syncSystem() {
    console.log(">> Initiating System Sync...");
    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const data = await response.json();
        
        // Update Counter
        document.getElementById('active-count').innerText = data.presence_count < 10 ? `0${data.presence_count}` : data.presence_count;

        const onlineList = data.members;
        const staffIds = STAFF_RECORDS.map(s => s.id);

        // Populate Hierarchy Nodes
        const nodes = document.querySelectorAll('.node-container');
        nodes.forEach(node => {
            const uid = node.getAttribute('data-id');
            const member = onlineList.find(m => m.id === uid);
            const pfpEl = node.querySelector('.node-pfp');
            const nameEl = node.querySelector('.username');

            if (member) {
                node.classList.add('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${member.avatar_url}')`;
                if (nameEl) nameEl.innerText = member.username.toUpperCase();
            } else {
                node.classList.remove('online');
                if (pfpEl) pfpEl.style.backgroundImage = `url('${SILHOUETTE}')`;
                if (nameEl) nameEl.innerText = "OFFLINE";
            }
        });

        // Populate Orbit Field
        const orbitField = document.getElementById('member-orbit-field');
        orbitField.innerHTML = '';
        
        const civilianMembers = onlineList.filter(m => !staffIds.includes(m.id));
        const maxOrbit = 15; // Max planets in the ring
        
        civilianMembers.slice(0, maxOrbit).forEach((m, i) => {
            const angle = (i / Math.min(civilianMembers.length, maxOrbit)) * (Math.PI * 2);
            const radius = 120;
            const x = Math.cos(angle) * radius + 150 - 17;
            const y = Math.sin(angle) * radius + 150 - 17;

            const div = document.createElement('div');
            div.className = 'orbit-node';
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            div.style.backgroundImage = `url('${m.avatar_url}')`;
            div.style.backgroundSize = 'cover';
            div.title = m.username;

            orbitField.appendChild(div);
        });

        document.getElementById('signal-status').innerText = "ESTABLISHED";
        document.getElementById('signal-status').className = "value pulse-green";

    } catch (err) {
        console.error(">> Critical System Error:", err);
        document.getElementById('signal-status').innerText = "LINK_LOST";
        document.getElementById('signal-status').className = "value pulse-red";
    }
}

// System Boot
document.addEventListener('DOMContentLoaded', () => {
    syncSystem();
    // Re-sync every 45 seconds
    setInterval(syncSystem, 45000);
});
