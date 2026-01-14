// Load Profile Data
async function loadProfile() {
    try {
        const userData = await apiRequest('/auth/me');
        const user = userData?.user;
        
        if (user) {
            // Populate form fields
            document.getElementById('firstName').value = user.first_name || user.firstName || '';
            document.getElementById('lastName').value = user.last_name || user.lastName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            
            // Update profile header
            updateProfileHeader(user);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile information. Please refresh the page.');
    }
}

// Update Profile Header
function updateProfileHeader(user) {
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'User';
    const email = user.email || '';
    
    // Update name
    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) {
        profileNameEl.textContent = fullName;
    }
    
    // Update email
    const profileEmailEl = document.getElementById('profileEmailDisplay');
    if (profileEmailEl) {
        profileEmailEl.textContent = email;
    }
    
    // Update avatar initials
    const avatarInitialsEl = document.getElementById('avatarInitials');
    if (avatarInitialsEl) {
        const initials = fullName.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        avatarInitialsEl.textContent = initials || 'U';
    }
}

// Show Success Message
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    const successTextEl = document.getElementById('successText');
    const errorEl = document.getElementById('errorMessage');
    
    if (successEl && successTextEl) {
        successTextEl.textContent = message || 'Profile updated successfully!';
        successEl.style.display = 'flex';
        if (errorEl) errorEl.style.display = 'none';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Show Error Message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    const errorTextEl = document.getElementById('errorText');
    const successEl = document.getElementById('successMessage');
    
    if (errorEl && errorTextEl) {
        errorTextEl.textContent = message || 'Failed to update profile. Please try again.';
        errorEl.style.display = 'flex';
        if (successEl) successEl.style.display = 'none';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Save Profile
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveButton = document.getElementById('saveButton');
    const saveButtonText = document.getElementById('saveButtonText');
    const saveButtonLoading = document.getElementById('saveButtonLoading');
    
    // Show loading state
    if (saveButton) saveButton.disabled = true;
    if (saveButtonText) saveButtonText.style.display = 'none';
    if (saveButtonLoading) saveButtonLoading.style.display = 'inline-flex';
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // Validation
    if (!firstName || !lastName || !email) {
        showError('Please fill in all required fields.');
        if (saveButton) saveButton.disabled = false;
        if (saveButtonText) saveButtonText.style.display = 'inline';
        if (saveButtonLoading) saveButtonLoading.style.display = 'none';
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        if (saveButton) saveButton.disabled = false;
        if (saveButtonText) saveButtonText.style.display = 'inline';
        if (saveButtonLoading) saveButtonLoading.style.display = 'none';
        return;
    }
    
    try {
        // Call API to update profile
        const response = await apiRequest('/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone: phone || null
            })
        });
        
        if (response) {
            // Update profile header with new data
            updateProfileHeader({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone
            });
            
            showSuccess('Profile updated successfully!');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError(error.message || 'Failed to update profile. Please try again.');
    } finally {
        // Reset loading state
        if (saveButton) saveButton.disabled = false;
        if (saveButtonText) saveButtonText.style.display = 'inline';
        if (saveButtonLoading) saveButtonLoading.style.display = 'none';
    }
});

// Sidebar toggle
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
});

// Make handleLogout globally accessible
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('partnership_token');
        localStorage.removeItem('partnership_user');
        window.location.href = '/partnership/login.html';
    }
};

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('partnership_token');
    const userStr = localStorage.getItem('partnership_user');
    
    if (!token || !userStr) {
        window.location.href = '/partnership/login.html';
        return false;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'agency_partner' && user.role !== 'agency') {
        window.location.href = '/partnership/login.html';
        return false;
    }
    
    return true;
}

// Set active nav item
function setActiveNav() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop().replace('.html', '');
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const itemPage = item.dataset.page;
        if (itemPage === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Toggle Password Visibility
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('svg');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
    }
}

// Reset Password Form
function resetPasswordForm() {
    document.getElementById('changePasswordForm').reset();
    // Reset all password fields to password type
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.type = 'password';
        }
    });
}

// Change Password
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const changePasswordButton = document.getElementById('changePasswordButton');
    const changePasswordButtonText = document.getElementById('changePasswordButtonText');
    const changePasswordButtonLoading = document.getElementById('changePasswordButtonLoading');
    
    // Show loading state
    if (changePasswordButton) changePasswordButton.disabled = true;
    if (changePasswordButtonText) changePasswordButtonText.style.display = 'none';
    if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'inline-flex';
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Please fill in all password fields.');
        if (changePasswordButton) changePasswordButton.disabled = false;
        if (changePasswordButtonText) changePasswordButtonText.style.display = 'inline';
        if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'none';
        return;
    }
    
    // Check password length
    if (newPassword.length < 8) {
        showError('New password must be at least 8 characters long.');
        if (changePasswordButton) changePasswordButton.disabled = false;
        if (changePasswordButtonText) changePasswordButtonText.style.display = 'inline';
        if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'none';
        return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        showError('New password and confirm password do not match.');
        if (changePasswordButton) changePasswordButton.disabled = false;
        if (changePasswordButtonText) changePasswordButtonText.style.display = 'inline';
        if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'none';
        return;
    }
    
    // Check if new password is different from current
    if (currentPassword === newPassword) {
        showError('New password must be different from current password.');
        if (changePasswordButton) changePasswordButton.disabled = false;
        if (changePasswordButtonText) changePasswordButtonText.style.display = 'inline';
        if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'none';
        return;
    }
    
    try {
        // Call API to change password
        const response = await apiRequest('/auth/change-password', {
            method: 'PATCH',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (response) {
            showSuccess('Password changed successfully!');
            resetPasswordForm();
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showError(error.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
        // Reset loading state
        if (changePasswordButton) changePasswordButton.disabled = false;
        if (changePasswordButtonText) changePasswordButtonText.style.display = 'inline';
        if (changePasswordButtonLoading) changePasswordButtonLoading.style.display = 'none';
    }
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkAuth()) {
            setActiveNav();
            loadProfile();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
        loadProfile();
    }
}
