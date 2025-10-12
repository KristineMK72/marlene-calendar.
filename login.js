// login.js
import { loginUser, signInWithGoogle, subscribeToAuthChanges } from './auth.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await loginUser(email, password);
        console.log('Login successful');
        window.location.href = 'calendar.html';
    } catch (error) {
        console.error('Login failed:', error.message);
        alert('Login failed: ' + error.message);
    }
});

document.getElementById('google-login-btn').addEventListener('click', async () => {
    try {
        await signInWithGoogle();
        console.log('Google login successful');
        window.location.href = 'calendar.html';
    } catch (error) {
        console.error('Google login failed:', error.message);
        alert('Google login failed: ' + error.message);
    }
});

subscribeToAuthChanges((user) => {
    if (user) {
        console.log('Auth state changed - User logged in:', user.uid);
        if (window.location.pathname.endsWith('login.html')) {
            window.location.href = 'calendar.html';
        }
    } else {
        console.log('Auth state changed - No user logged in');
    }
});
