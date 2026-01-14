const API_URL = 'http://localhost:3000/api';

// Login elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.getElementById('loginBtn');
const buttonLoading = document.getElementById('buttonLoading');
const buttonText = document.getElementById('buttonText');

// Sign up elements
const signupForm = document.getElementById('signupForm');
const signupFirstName = document.getElementById('signupFirstName');
const signupLastName = document.getElementById('signupLastName');
const signupEmail = document.getElementById('signupEmail');
const signupPhone = document.getElementById('signupPhone');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordToggle = document.getElementById('signupPasswordToggle');
// Account type is automatically set to restaurant_owner for merchant signup
const signupBtn = document.getElementById('signupBtn');
const signupButtonLoading = document.getElementById('signupButtonLoading');
const signupButtonText = document.getElementById('signupButtonText');

// Common elements
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const testAccountCards = document.querySelectorAll('.test-account-card');
const pageTitle = document.getElementById('pageTitle');
const toggleLink = document.getElementById('toggleLink');
const toggleText = document.getElementById('toggleText');

let isLoginMode = true;

// Password toggle
let showPassword = false;
passwordToggle.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    
    // Update icon
    const icon = passwordToggle.querySelector('svg');
    if (showPassword) {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
});

// Test account buttons
testAccountCards.forEach(card => {
    const button = card.querySelector('.test-account-button');
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const email = card.dataset.email;
        const password = card.dataset.password;
        emailInput.value = email;
        passwordInput.value = password;
        hideError();
    });
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'flex';
    hideError();
    
    try {
        // Don't clear partnership session - they can coexist in different tabs
        console.log('Attempting login for:', email);
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        console.log('Response status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                const text = await response.text();
                throw new Error(text || 'Invalid response from server. Please check if backend is running.');
            }
        } else {
            const text = await response.text();
            data = { error: text || 'Server error' };
        }
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error(data.error || 'Too many requests. Please wait a moment and try again.');
            }
            throw new Error(data.error || 'Login failed');
        }
        
        // Store token and user with merchant prefix
        localStorage.setItem('merchant_token', data.token);
        localStorage.setItem('merchant_user', JSON.stringify(data.user));
        
        console.log('Login successful, redirecting...');
        
        // Check account type - merchant login should only accept merchant accounts
        const role = data.user.role;
        if (role === 'agency_partner' || role === 'agency') {
            // Partnership account trying to login to merchant site
            showError('This account is for partnership portal. Please login at /partnership/login.html');
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
            return;
        }
        
        if (role === 'restaurant_owner') {
            window.location.href = '/merchant/dashboard.html';
        } else {
            // Unknown role or not merchant account
            showError('Invalid account type for merchant portal. Please use a merchant account.');
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMsg = 'Login failed. Please check your credentials and try again.';
        
        if (error.message) {
            errorMsg = error.message;
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMsg = 'Cannot connect to server. Please make sure the backend is running on port 3000.';
        }
        
        showError(errorMsg);
    } finally {
        // Reset loading state
        loginBtn.disabled = false;
        buttonText.style.display = 'block';
        buttonLoading.style.display = 'none';
    }
});

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Toggle between login and sign up
function toggleForms() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        // Show login form
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        pageTitle.textContent = 'Login';
        toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleLink">Sign up</a>';
    } else {
        // Show sign up form
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        pageTitle.textContent = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleLink">Sign in</a>';
    }
    
    // Re-attach event listener to new toggle link
    const newToggleLink = document.getElementById('toggleLink');
    if (newToggleLink) {
        newToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms();
        });
    }
    
    hideError();
}

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
});

// Sign up password toggle
let showSignupPassword = false;
signupPasswordToggle.addEventListener('click', () => {
    showSignupPassword = !showSignupPassword;
    signupPassword.type = showSignupPassword ? 'text' : 'password';
    
    const icon = signupPasswordToggle.querySelector('svg');
    if (showSignupPassword) {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
});

// Sign up form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = signupFirstName.value.trim();
    const lastName = signupLastName.value.trim();
    const email = signupEmail.value.trim();
    const phone = signupPhone.value.trim();
    const password = signupPassword.value;
    // Automatically set role to restaurant_owner for merchant signup
    const role = 'restaurant_owner';
    
    if (!firstName || !lastName || !email || !password) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Show loading state
    signupBtn.disabled = true;
    signupButtonText.style.display = 'none';
    signupButtonLoading.style.display = 'flex';
    hideError();
    
    try {
        // Don't clear partnership session - they can coexist
        console.log('Attempting sign up for:', email);
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
                role
            }),
        });
        
        console.log('Response status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                const text = await response.text();
                throw new Error(text || 'Invalid response from server. Please check if backend is running.');
            }
        } else {
            const text = await response.text();
            data = { error: text || 'Server error' };
        }
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error(data.error || 'Too many requests. Please wait a moment and try again.');
            }
            throw new Error(data.error || 'Sign up failed');
        }
        
        // Store token and user with merchant prefix
        localStorage.setItem('merchant_token', data.token);
        localStorage.setItem('merchant_user', JSON.stringify(data.user));
        
        console.log('Sign up successful, redirecting...');
        
        // Check account type - merchant signup should only allow merchant accounts
        const userRole = data.user.role;
        if (userRole === 'agency_partner' || userRole === 'agency') {
            // Partnership account created on merchant site
            showError('Partnership accounts cannot be created here. Please use the partnership portal.');
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
            return;
        }
        
        if (userRole === 'restaurant_owner') {
            window.location.href = '/merchant/dashboard.html';
        } else {
            showError('Invalid account type. Please select a valid account type.');
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMsg = 'Sign up failed. Please try again.';
        
        if (error.message) {
            errorMsg = error.message;
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMsg = 'Cannot connect to server. Please make sure the backend is running on port 3000.';
        }
        
        showError(errorMsg);
    } finally {
        // Reset loading state
        signupBtn.disabled = false;
        signupButtonText.style.display = 'block';
        signupButtonLoading.style.display = 'none';
    }
});
