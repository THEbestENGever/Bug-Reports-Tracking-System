async function updateNotifBadge() {
    const badge = document.querySelector('#notif-count');
    if (!badge) return;

    try {
        const res = await fetch('api/notifications.php?action=count');
        if (!res.ok) return;
        const data = await res.json();

        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {}
}

updateNotifBadge();