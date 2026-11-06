(async function guard() {
    try {
        const res = await fetch('api/me.php');
        if (res.status === 401) {
            localStorage.clear();
            window.location.replace('login.html');
            return;
        }
        const data = await res.json();
        // نحدّث القيم من السيرفر (هو المرجع الحقيقي)
        localStorage.setItem('currentUser', data.email);
        localStorage.setItem('currentRole', data.role);
    } catch (e) {
        window.location.replace('login.html');
    }
})();

// تسجيل الخروج
document.addEventListener('click', async function (event) {
    const link = event.target.closest('a[href="login.html"]');
    if (!link || !link.closest('.dropdown')) return;

    event.preventDefault();
    try {
        await fetch('api/logout.php');
    } catch (e) {}
    localStorage.clear();
    window.location.href = 'login.html';
});
window.addEventListener('pageshow', function (e) {
    if (e.persisted) window.location.reload();
});