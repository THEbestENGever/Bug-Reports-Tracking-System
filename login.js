async function validateForm() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
        alert("All fields are required!");
        return false;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    try {
        const res = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Login failed.');
            return false;
        }

        localStorage.setItem('currentUser', data.email);
        localStorage.setItem('currentRole', data.role);
        window.location.href = 'Homepage.html';
    } catch (err) {
        alert('Cannot reach the server. Is MAMP running?');
    }

    return false;
}