// API Configuration - Auto-detect based on current host
const API_URL = (() => {
  // If running in production (Render), use current host
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Development: use localhost
  return 'http://localhost:3000/api';
})();

const partnerLoginForm = document.getElementById('partnerLoginForm');
const partnerEmail = document.getElementById('partnerEmail');
const partnerPassword = document.getElementById('partnerPassword');
const partnerPasswordToggle = document.getElementById('partnerPasswordToggle');
const partnerLoginBtn = document.getElementById('partnerLoginBtn');
const partnerButtonLoading = document.getElementById('partnerButtonLoading');
const partnerButtonText = document.getElementById('partnerButtonText');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Password toggle
let showPassword = false;
partnerPasswordToggle.addEventListener('click', () => {
    showPassword = !showPassword;
    partnerPassword.type = showPassword ? 'text' : 'password';
    
    const icon = partnerPasswordToggle.querySelector('svg');
    if (showPassword) {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
});

// Login form submission
partnerLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = partnerEmail.value.trim();
    const password = partnerPassword.value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    partnerLoginBtn.disabled = true;
    partnerButtonText.style.display = 'none';
    partnerButtonLoading.style.display = 'flex';
    hideError();
    
    try {
        // Don't clear merchant session - they can coexist in different tabs
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Check account type - partnership login should only accept partnership accounts
        const role = data.user.role;
        if (role === 'restaurant_owner') {
            // Merchant account trying to login to partnership site
            showError('This account is for merchant portal. Please login at /login.html');
            localStorage.removeItem('partnership_token');
            localStorage.removeItem('partnership_user');
            return;
        }
        
        if (role !== 'agency_partner' && role !== 'agency') {
            throw new Error('This portal is for agency partners only. Please use a partnership account.');
        }
        
        // Store token and user with partnership prefix
        localStorage.setItem('partnership_token', data.token);
        localStorage.setItem('partnership_user', JSON.stringify(data.user));
        
        // Redirect to accounts page
        window.location.href = '/partnership/accounts.html';
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        // Reset loading state
        partnerLoginBtn.disabled = false;
        partnerButtonText.style.display = 'block';
        partnerButtonLoading.style.display = 'none';
    }
});

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}
