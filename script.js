const SERVER_ID = '1433645535583277129';

// Map of IDs to be placed in the Hierarchy
const HIERARCHY_MAP = [
    '683212245311946795', // Owner
    '959431187955351623', // Co-owner
    '183900012705480705', // Super Admin
    '1398034278662537337', // Admin
    '1388087779174383719', '287809220210851851', '368838581009252362', 
    '916731589893959710', '226914498089451520', '531178595130015755', 
    '652983918013841429', '556714289453465601' // Mods
];

async function updateWidget() {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json`);
        const data = await response.json();
        
        document.getElementById('member-count').innerText = data.presence_count;

        const onlineMembers = data.members;
        const orbitPool = [];

        // 1. Process Hierarchy
        HIERARCHY_MAP.forEach(id => {
            const member = onlineMembers.find(m => m.id === id);
            const slot = document.getElementById(`slot-${id}`);
            
            if (member && slot) {
                slot.classList.add('is-online');
                const img = slot.querySelector('img') || document.createElement('img');
                img.src = member.avatar_url;
                if (!slot.querySelector('img')) slot.querySelector('.pfp-holder').appendChild(img);
            }
        });

        // 2. Process Orbit Pool (Anyone online NOT in the hierarchy)
        const orbitContainer = document.getElementById('orbit-ring-container');
        orbitContainer.innerHTML = '';
        
        const generalMembers = onlineMembers.filter(m => !HIERARCHY_MAP.includes(m.id));
        const total = Math.min(generalMembers.length, 12); // Limit orbit to 12 for visual clarity

        generalMembers.slice(0, total).forEach((member, i) => {
            const angle = (i / total) * (2 * Math.PI);
            const x = Math.cos(angle) * 75 + 60; // 75 is radius
            const y = Math.sin(angle) * 75 + 60;

            const img = document.createElement('img');
            img.src = member.avatar_url;
            img.className = 'orbit-pfp';
            img.style.left = `${x}px`;
            img.style.top = `${y}px`;
            img.title = member.username;
            
            orbitContainer.appendChild(img);
        });

    } catch (e) {
        console.error("Widget fetch failed. Ensure widget is enabled in Discord settings.", e);
    }
}

// Refresh every 60 seconds
setInterval(updateWidget, 60000);
updateWidget();
