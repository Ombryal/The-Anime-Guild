document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('discord-wrapper');
    const trigger = document.getElementById('discord-trigger');

    trigger.addEventListener('click', () => {
        if (wrapper.classList.contains('discord-hidden')) {
            wrapper.classList.replace('discord-hidden', 'discord-visible');
        } else {
            wrapper.classList.replace('discord-visible', 'discord-hidden');
        }
    });

    // Optional: Close when clicking outside
    document.addEventListener('click', (event) => {
        if (!wrapper.contains(event.target) && wrapper.classList.contains('discord-visible')) {
            wrapper.classList.replace('discord-visible', 'discord-hidden');
        }
    });
});
