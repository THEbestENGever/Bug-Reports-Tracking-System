const userBtn = document.querySelector('.user-btn');
const dropdown = document.querySelector('.dropdown');
// ========== القائمة المنسدلة ==========
userBtn.addEventListener('click', function (event) {
    event.stopPropagation(); // يمنع الضغطة من الوصول للـ document
    dropdown.classList.toggle('show');
});

// إغلاق القائمة لو ضغط المستخدم في أي مكان ثاني
document.addEventListener('click', function () {
    dropdown.classList.remove('show');
});
const periodFilter = document.querySelector('#period-filter');

async function renderDashboard() {
    const res = await fetch('api/dashboard.php?period=' + periodFilter.value);
    if (res.status === 401) {
        window.location.href = 'login.html';
        return;
    }
    const stats = await res.json();

    document.querySelector('#total-bugs').textContent = stats.total;
    document.querySelector('#open-bugs').textContent = stats.open;
    document.querySelector('#critical-bugs').textContent = stats.critical;
    document.querySelector('#resolved-bugs').textContent = stats.resolved;

    const avg = document.querySelector('#avg-resolution');
    if (avg) {
        if (stats.avg_days === null) avg.textContent = '-';
        else if (stats.avg_days < 1) avg.textContent = (stats.avg_days * 24).toFixed(1) + ' hours';
        else avg.textContent = stats.avg_days + ' days';
    }

    renderSeverityChart(stats.severity, stats.total);
}
function renderSeverityChart(severity, total) {
    const chart = document.querySelector('#severity-chart');
    chart.innerHTML = '';

    Object.keys(severity).forEach(function (name) {
        const count = severity[name];
        const percent = total > 0 ? (count / total) * 100 : 0;

        const row = document.createElement('div');
        row.classList.add('bar-row');

        const label = document.createElement('span');
        label.classList.add('bar-label');
        label.textContent = name;

        const track = document.createElement('div');
        track.classList.add('bar-track');

        const fill = document.createElement('div');
        fill.classList.add('bar-fill');
        fill.style.width = percent + '%';

        const value = document.createElement('span');
        value.classList.add('bar-value');
        value.textContent = count;

        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(value);
        chart.appendChild(row);
    });
}
// دالة renderSeverityChart تبقى كما هي (لا تحذفيها)

periodFilter.addEventListener('change', renderDashboard);
renderDashboard();