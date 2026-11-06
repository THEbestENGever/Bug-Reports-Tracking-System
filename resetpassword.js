function validateForm() {
    const passwords = document.querySelectorAll('input[type="password"]');
    const password = passwords[0].value;
    const confirm = passwords[1].value;

    if (!password || !confirm) {
        alert("All fields are required!");
        return false;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return false;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return false;
    }

    alert("Password updated successfully.");
    window.location.href = 'login.html';
    return false;
}