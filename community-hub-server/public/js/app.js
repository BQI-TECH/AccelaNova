// API Base URL
const API_BASE = window.location.origin;

// Get token from localStorage
function getToken() {
    return localStorage.getItem('hub_connection_key');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('hub_connection_key', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('hub_connection_key');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Redirect to profile if already authenticated
function redirectIfAuth() {
    if (isLoggedIn()) {
        window.location.href = '/me';
    }
}

// Show alert message
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container');
    const firstChild = container.firstChild;
    container.insertBefore(alertDiv, firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Login function
async function login(email, password) {
    try {
        const data = await apiCall('/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.connectionKey) {
            setToken(data.connectionKey);
            return true;
        }

        throw new Error('Login failed');
    } catch (error) {
        throw error;
    }
}

// Get user profile
async function getProfile() {
    try {
        const data = await apiCall('/v1/auth/me');
        return data;
    } catch (error) {
        throw error;
    }
}

// Logout function
function logout() {
    removeToken();
    window.location.href = '/';
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback copy function
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showAlert('Copied to clipboard!', 'success');
    } catch (err) {
        showAlert('Failed to copy', 'error');
    }

    document.body.removeChild(textArea);
}


