// ========== العناصر ==========
const projectTitle = document.querySelector('#project-title');
const projectEmployees = document.querySelector('#project-employees');
const bugsBody = document.querySelector('#bugs-body');
const addBugBtn = document.querySelector('#add-bug-btn');
const modal = document.querySelector('#outer-div');
const closeBtn = document.querySelector('.close-btn');
const bugForm = document.querySelector('#bug-form');
const settingsWrapper = document.querySelector('.settings-wrapper');
const settingsBtn = document.querySelector('#settings-btn');
const settingsMenu = document.querySelector('#settings-menu');
const membersList = document.querySelector('#members-list');
const newMemberEmail = document.querySelector('#new-member-email');
const addMemberBtn = document.querySelector('#add-member-btn');
const statusSelect = document.querySelector('#project-status-select');
const deleteProjectBtn = document.querySelector('#delete-project-btn');
const historyModal = document.querySelector('#history-modal');
const historyList = document.querySelector('#history-list');
const historyTitle = document.querySelector('#history-title');
const historyClose = document.querySelector('#history-close');
const commentsModal = document.querySelector('#comments-modal');
const commentsList = document.querySelector('#comments-list');
const commentsTitle = document.querySelector('#comments-title');
const commentsClose = document.querySelector('#comments-close');
const commentForm = document.querySelector('#comment-form');
const commentText = document.querySelector('#comment-text');
const filterStatus = document.querySelector('#filter-status');
const filterSeverity = document.querySelector('#filter-severity');
const filterAssignee = document.querySelector('#filter-assignee');
const filterReset = document.querySelector('#filter-reset');

// ========== الحالة ==========
const params = new URLSearchParams(window.location.search);
const projectId = Number(params.get('id'));
const role = localStorage.getItem('currentRole');
const me = (localStorage.getItem('currentUser') || '').toLowerCase();

let project = null;
let bugs = [];
let currentCommentBug = null;

const allowedStatus = ['New', 'Open', 'In Progress', 'Closed'];
const bugFields = [
    'bug_code', 'date_reported', 'reported_by', 'assigned_email', 'severity',
    'priority', 'status', 'module', 'environment', 'description',
    'pre_condition', 'steps', 'expected', 'actual', 'additional',
    'evidence', 'reproducibility'
];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(s) {
    return new Date(s.replace(' ', 'T')).toLocaleString();
}

// ========== تحميل البيانات ==========
async function loadProject() {
    const data = await apiCall('projects', 'get', { query: '&id=' + projectId });
    if (!data) {
        window.location.href = 'Homepage.html';
        return false;
    }
    project = data;
    return true;
}

async function loadBugs() {
    const data = await apiCall('bugs', 'list', { query: '&project_id=' + projectId });
    bugs = data || [];
}

// ========== عرض المشروع والأعضاء ==========
function renderProjectInfo() {
    projectTitle.textContent = project.name;
    statusSelect.value = project.status;

    projectEmployees.innerHTML = '';
    project.members.forEach(function (m) {
        const li = document.createElement('li');
        li.textContent = m.email;
        projectEmployees.appendChild(li);
    });
}

function renderMembers() {
    membersList.innerHTML = '';

    project.members.forEach(function (m) {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.textContent = m.email;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', async function () {
            const r = await apiCall('projects', 'remove_member', {
                body: { id: projectId, email: m.email }
            });
            if (r) await refreshProject();
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        membersList.appendChild(li);
    });
}

function fillAssigneeOptions() {
    const select = document.querySelector('#assigned-to');
    select.innerHTML = '<option value="">Unassigned</option>';

    project.members.forEach(function (m) {
        const option = document.createElement('option');
        option.value = m.email;
        option.textContent = m.email;
        select.appendChild(option);
    });
}

function fillFilterAssignees() {
    const previous = filterAssignee.value;

    filterAssignee.innerHTML =
        '<option value="">All</option>' +
        '<option value="__me__">Me</option>' +
        '<option value="__none__">Unassigned</option>';

    project.members.forEach(function (m) {
        const option = document.createElement('option');
        option.value = m.email;
        option.textContent = m.email;
        filterAssignee.appendChild(option);
    });

    filterAssignee.value = previous;
}

async function refreshProject() {
    if (!(await loadProject())) return;
    renderProjectInfo();
    renderMembers();
    fillAssigneeOptions();
    fillFilterAssignees();
}

// ========== الفلاتر ==========
function getVisibleBugs() {
    return bugs.filter(function (bug) {
        if (filterStatus.value && bug.status !== filterStatus.value) return false;
        if (filterSeverity.value && bug.severity !== filterSeverity.value) return false;

        const assignee = (bug.assigned_email || '').toLowerCase();

        if (filterAssignee.value === '__me__' && assignee !== me) return false;
        if (filterAssignee.value === '__none__' && assignee !== '') return false;
        if (filterAssignee.value &&
            filterAssignee.value !== '__me__' &&
            filterAssignee.value !== '__none__' &&
            assignee !== filterAssignee.value.toLowerCase()) return false;

        return true;
    });
}

// ========== الجدول ==========
function makeButton(text, cls, handler) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.type = 'button';
    btn.classList.add(cls);
    btn.addEventListener('click', handler);
    return btn;
}

function renderBugs() {
    bugsBody.innerHTML = '';

    getVisibleBugs().forEach(function (bug) {
        const tr = document.createElement('tr');

        bugFields.forEach(function (field) {
            const td = document.createElement('td');

            if (field === 'status') {
                const select = document.createElement('select');
                select.classList.add('status-select');

                allowedStatus.forEach(function (value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    select.appendChild(option);
                });

                select.value = bug.status;

                select.addEventListener('change', async function () {
                    const r = await apiCall('bugs', 'status', {
                        body: { id: bug.id, status: select.value }
                    });
                    if (r) {
                        bug.status = select.value;
                    } else {
                        select.value = bug.status;   // رجّع القيمة لو فشل
                    }
                });

                td.appendChild(select);
            } else {
                td.textContent = bug[field] || '';
            }

            tr.appendChild(td);
        });

        // Actions (الحذف للمانجر فقط)
        const actionTd = document.createElement('td');
        if (role === 'manager') {
            actionTd.appendChild(makeButton('Delete', 'delete-btn', async function () {
                if (!confirm('Delete this bug?')) return;
                const r = await apiCall('bugs', 'delete', { body: { id: bug.id } });
                if (r) {
                    await loadBugs();
                    renderBugs();
                }
            }));
        }
        tr.appendChild(actionTd);

        // History
        const historyTd = document.createElement('td');
        historyTd.appendChild(makeButton('View', 'history-btn', function () {
            openHistory(bug);
        }));
        tr.appendChild(historyTd);

        // Comments
        const commentsTd = document.createElement('td');
        commentsTd.appendChild(makeButton(
            'Comments (' + bug.comments_count + ')', 'comments-btn',
            function () { openComments(bug); }
        ));
        tr.appendChild(commentsTd);

        bugsBody.appendChild(tr);
    });
}

// ========== History ==========
async function openHistory(bug) {
    const records = await apiCall('bugs', 'history', { query: '&id=' + bug.id });
    if (!records) return;

    historyTitle.textContent = 'History: ' + bug.bug_code;
    historyList.innerHTML = '';

    if (records.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No history recorded for this bug.';
        historyList.appendChild(li);
    }

    records.forEach(function (r) {
        const li = document.createElement('li');

        const text = document.createElement('span');
        if (r.action === 'Created') {
            text.textContent = 'Created with status: ' + r.to_status;
        } else {
            text.textContent = r.action + ': ' + r.from_status + ' → ' + r.to_status;
        }

        const meta = document.createElement('small');
        meta.textContent = r.user_email + ' · ' + formatDate(r.created_at);

        li.appendChild(text);
        li.appendChild(meta);
        historyList.appendChild(li);
    });

    historyModal.classList.add('show');
}

function closeHistory() {
    historyModal.classList.remove('show');
}

// ========== التعليقات ==========
async function renderComments() {
    const comments = await apiCall('bugs', 'comments', { query: '&id=' + currentCommentBug.id });
    if (!comments) return;

    commentsList.innerHTML = '';

    if (comments.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No comments yet.';
        commentsList.appendChild(li);
        return;
    }

    comments.forEach(function (c) {
        const li = document.createElement('li');

        const text = document.createElement('span');
        text.textContent = c.text;

        const meta = document.createElement('small');
        meta.textContent = c.user_email + ' · ' + formatDate(c.created_at);

        li.appendChild(text);
        li.appendChild(meta);
        commentsList.appendChild(li);
    });
}

async function openComments(bug) {
    currentCommentBug = bug;
    commentsTitle.textContent = 'Comments: ' + bug.bug_code;
    await renderComments();
    commentsModal.classList.add('show');
}

function closeComments() {
    commentsModal.classList.remove('show');
    currentCommentBug = null;
}

// ========== المودالات ==========
function openModal() { modal.classList.add('show'); }
function closeModal() { modal.classList.remove('show'); }

addBugBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
});

historyClose.addEventListener('click', closeHistory);
historyModal.addEventListener('click', function (e) {
    if (e.target === historyModal) closeHistory();
});

commentsClose.addEventListener('click', closeComments);
commentsModal.addEventListener('click', function (e) {
    if (e.target === commentsModal) closeComments();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal();
        closeHistory();
        closeComments();
    }
});

// ========== إضافة بق ==========
bugForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const fileInput = document.querySelector('#evidence-screenshot');
    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : '';

    const result = await apiCall('bugs', 'create', {
        body: {
            project_id: projectId,
            date: document.querySelector('#date').value,
            reported_by: document.querySelector('#reported-by').value,
            assigned_email: document.querySelector('#assigned-to').value,
            severity: document.querySelector('#severity').value,
            priority: document.querySelector('#priority').value,
            status: document.querySelector('#status').value,
            module: document.querySelector('#module').value,
            environment: document.querySelector('#environment').value,
            description: document.querySelector('#description').value,
            pre_condition: document.querySelector('#pre-condition').value,
            steps: document.querySelector('#steps-to-reproduce').value,
            expected: document.querySelector('#expected-result').value,
            actual: document.querySelector('#actual-result').value,
            additional: document.querySelector('#additional-details').value,
            evidence: fileName,
            reproducibility: document.querySelector('#reproducibility-ratio').value
        }
    });

    if (result) {
        await loadBugs();
        renderBugs();
        bugForm.reset();
        closeModal();
    }
});

// ========== إضافة تعليق ==========
commentForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const text = commentText.value.trim();
    if (!text || !currentCommentBug) return;

    const r = await apiCall('bugs', 'add_comment', {
        body: { id: currentCommentBug.id, text: text }
    });

    if (r) {
        commentText.value = '';
        await renderComments();
        await loadBugs();
        renderBugs();
    }
});

// ========== الأعضاء ==========
addMemberBtn.addEventListener('click', async function () {
    const email = newMemberEmail.value.trim();

    if (!email) {
        alert('Please enter an email.');
        return;
    }
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    const r = await apiCall('projects', 'add_member', {
        body: { id: projectId, email: email }
    });

    if (r) {
        newMemberEmail.value = '';
        newMemberEmail.focus();
        await refreshProject();
    }
});

// ========== حالة المشروع وحذفه ==========
statusSelect.addEventListener('change', async function () {
    const r = await apiCall('projects', 'status', {
        body: { id: projectId, status: statusSelect.value }
    });
    if (!r) statusSelect.value = project.status;
    else project.status = statusSelect.value;
});

deleteProjectBtn.addEventListener('click', async function () {
    const typed = prompt(
        'This will permanently delete "' + project.name + '" and its ' +
        bugs.length + ' bug(s).\n\nType the project name to confirm:'
    );

    if (typed !== project.name) {
        alert('Project name did not match. Nothing was deleted.');
        return;
    }

    const r = await apiCall('projects', 'delete', { body: { id: projectId } });
    if (r) window.location.href = 'Homepage.html';
});

// ========== قائمة الإعدادات ==========
settingsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    settingsMenu.classList.toggle('show');
});
settingsMenu.addEventListener('click', function (e) { e.stopPropagation(); });
document.addEventListener('click', function () {
    settingsMenu.classList.remove('show');
});

// ========== الفلاتر ==========
filterStatus.addEventListener('change', renderBugs);
filterSeverity.addEventListener('change', renderBugs);
filterAssignee.addEventListener('change', renderBugs);
filterReset.addEventListener('click', function () {
    filterStatus.value = '';
    filterSeverity.value = '';
    filterAssignee.value = '';
    renderBugs();
});

// ========== إخفاء الأزرار حسب الدور (للشكل فقط، الحماية في PHP) ==========
if (role !== 'manager') settingsWrapper.style.display = 'none';
if (role === 'developer') addBugBtn.style.display = 'none';

// ========== تشغيل الصفحة ==========
(async function init() {
    if (!(await loadProject())) return;
    renderProjectInfo();
    renderMembers();
    fillAssigneeOptions();
    fillFilterAssignees();
    await loadBugs();
    renderBugs();
})();
