async function apiCall(endpoint, action, options) {
    options = options || {};
    const url = 'api/' + endpoint + '.php?action=' + action + (options.query || '');

    const res = await fetch(url, {
        method: options.body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 401) {
        window.location.href = 'login.html';
        return null;
    }

    const data = await res.json();
    if (!res.ok) {
        alert(data.error || 'Request failed');
        return null;
    }
    return data;
}

// للتوافق مع Homepage.js
function api(action, options) {
    return apiCall('projects', action, options);
}