const notificationsList = document.querySelector('#notifications-list');
const noNotifications = document.querySelector('#no-notifications');
const userBtn = document.querySelector('.user-btn');
const dropdown = document.querySelector('.dropdown');

userBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    dropdown.classList.toggle('show');
});
document.addEventListener('click', function () {
    dropdown.classList.remove('show');
});

async function renderNotifications() {
    const res = await fetch('api/notifications.php?action=list');
    if (res.status === 401) {
        window.location.href = 'login.html';
        return;
    }
    const list = await res.json();

    notificationsList.innerHTML = '';

    if (list.length === 0) {
        noNotifications.style.display = 'block';
        return;
    }
    noNotifications.style.display = 'none';

    list.forEach(function (n) {
        const li = document.createElement('li');
        li.classList.add('notification-item');
        if (n.is_read == 0) li.classList.add('unread');

        li.addEventListener('click', function () {
            window.location.href = 'project.html?id=' + n.project_id;
        });

        const message = document.createElement('p');
        message.textContent = n.message;

        const time = document.createElement('small');
        time.textContent = new Date(n.created_at.replace(' ', 'T')).toLocaleString();

        li.appendChild(message);
        li.appendChild(time);
        notificationsList.appendChild(li);
    });
}

(async function init() {
    await renderNotifications();                      // يرسم ويميّز غير المقروء
    await fetch('api/notifications.php?action=mark_read');
    updateNotifBadge();                               // تختفي الدائرة
})();