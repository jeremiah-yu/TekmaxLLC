// API Configuration - Auto-detect based on current host
const API_URL = (() => {
  // If running in production (Render), use current host
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Development: use localhost
  return 'http://localhost:3000/api';
})();

const partnerSignupForm = document.getElementById('partnerSignupForm');
const signupFirstName = document.getElementById('signupFirstName');
const signupLastName = document.getElementById('signupLastName');
const signupEmail = document.getElementById('signupEmail');
const signupPhone = document.getElementById('signupPhone');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordToggle = document.getElementById('signupPasswordToggle');
const partnerSignupBtn = document.getElementById('partnerSignupBtn');
const partnerSignupButtonLoading = document.getElementById('partnerSignupButtonLoading');
const partnerSignupButtonText = document.getElementById('partnerSignupButtonText');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Password toggle
let showPassword = false;
signupPasswordToggle.addEventListener('click', () => {
    showPassword = !showPassword;
    signupPassword.type = showPassword ? 'text' : 'password';
    
    const icon = signupPasswordToggle.querySelector('svg');
    if (showPassword) {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
});

// Sign up form submission
partnerSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = signupFirstName.value.trim();
    const lastName = signupLastName.value.trim();
    const email = signupEmail.value.trim();
    const phone = signupPhone.value.trim();
    const password = signupPassword.value;
    
    if (!firstName || !lastName || !email || !password) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Show loading state
    partnerSignupBtn.disabled = true;
    partnerSignupButtonText.style.display = 'none';
    partnerSignupButtonLoading.style.display = 'flex';
    hideError();
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                phone: phone || null,
                role: 'agency_partner' // Partnership signup is always agency_partner
            }),
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Sign up failed');
        }
        
        // Store token and user with partnership prefix
        localStorage.setItem('partnership_token', data.token);
        localStorage.setItem('partnership_user', JSON.stringify(data.user));
        
        // Redirect to accounts page
        window.location.href = '/partnership/accounts.html';
    } catch (error) {
        console.error('Sign up error:', error);
        showError(error.message || 'Sign up failed. Please try again.');
    } finally {
        // Reset loading state
        partnerSignupBtn.disabled = false;
        partnerSignupButtonText.style.display = 'block';
        partnerSignupButtonLoading.style.display = 'none';
    }
});

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}
