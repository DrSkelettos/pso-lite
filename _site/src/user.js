// Hash Password
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return "sha256$" + [...new Uint8Array(hashBuffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const passwordHash = await hashPassword(password);

    const user = await getUser(username, passwordHash);
    if (user) {
        // Store username and password hash in cookies
        localStorage.setItem('username', username);
        localStorage.setItem('passwordHash', passwordHash);
        location.href = "../../index.html";
    } else {
        document.getElementById('errorAlert').style.display = 'block';
    }
}

// Logout
function logout(dir = './') {
    localStorage.removeItem('username');
    localStorage.removeItem('passwordHash');
    location.href = dir + "sites/login/index.html";
}

// Get user
async function getUser(username, passwordHash) {
    if (!window['employees']) return null;
    for (const [key, value] of Object.entries(window['employees'])) {
        if (value.username === username && value.passwordHash === passwordHash) {
            value.key = key;
            return value;
        }
    }
    return null;
}

// Get active user from cookies
async function getActiveUser() {
    const username = localStorage.getItem('username');
    const passwordHash = localStorage.getItem('passwordHash');

    if (!username || !passwordHash) {
        return null;
    }

    return await getUser(username, passwordHash);
}

// Check the current Login
async function checkLogin(pageName = null, dir = './') {
    const user = await getActiveUser();
    window['user'] = user;
    if (!user && pageName !== 'Login') {
        location.href = dir + "sites/login/index.html";
    }
}