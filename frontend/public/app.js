// API Configuration
const API_URL = 'http://localhost:3000/api';

// Detect which portal we're on
function getPortalType() {
    const path = window.location.pathname;
    if (path.includes('/partnership/')) {
        return 'partnership';
    } else if (path.includes('/merchant/')) {
        return 'merchant';
    }
    // Default to merchant for login pages
    return 'merchant';
}

// Get token and user from localStorage (portal-specific)
function getToken() {
    const portal = getPortalType();
    const key = portal === 'partnership' ? 'partnership_token' : 'merchant_token';
    return localStorage.getItem(key);
}

function getUser() {
    const portal = getPortalType();
    const key = portal === 'partnership' ? 'partnership_user' : 'merchant_user';
    const userStr = localStorage.getItem(key);
    return userStr ? JSON.parse(userStr) : null;
}

// Helper to get token for specific portal
function getTokenForPortal(portal) {
    const key = portal === 'partnership' ? 'partnership_token' : 'merchant_token';
    return localStorage.getItem(key);
}

// Helper to get user for specific portal
function getUserForPortal(portal) {
    const key = portal === 'partnership' ? 'partnership_user' : 'merchant_user';
    const userStr = localStorage.getItem(key);
    return userStr ? JSON.parse(userStr) : null;
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            // Unauthorized - redirect to login
            const portal = getPortalType();
            if (portal === 'partnership') {
                localStorage.removeItem('partnership_token');
                localStorage.removeItem('partnership_user');
                window.location.href = '/partnership/login.html';
            } else {
                localStorage.removeItem('merchant_token');
                localStorage.removeItem('merchant_user');
                window.location.href = '/login.html';
            }
            return null;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}


// Update User Info in Header
function updateUserInfo() {
    const user = getUser();
    
    if (user) {
        const userName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email?.split('@')[0] || 'User';
        
        let userRole = user.role || 'user';
        // Format role display
        if (userRole === 'restaurant_owner') {
            userRole = 'Merchant';
        } else if (userRole === 'agency_partner' || userRole === 'agency') {
            userRole = 'Agency Partner';
        }
        
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = userName;
        if (userRoleEl) userRoleEl.textContent = userRole.replace('_', ' ');
        if (userAvatarEl) userAvatarEl.textContent = initials;
    }
}

// Handle Logout - Make it globally accessible
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        const portal = getPortalType();
        if (portal === 'partnership') {
            localStorage.removeItem('partnership_token');
            localStorage.removeItem('partnership_user');
            window.location.href = '/partnership/login.html';
        } else {
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
            window.location.href = '/login.html';
        }
    }
};

// Also define as regular function for backward compatibility
function handleLogout() {
    window.handleLogout();
}

// Check Authentication
function checkAuth() {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) {
        const portal = getPortalType();
        if (portal === 'partnership') {
            window.location.href = '/partnership/login.html';
        } else {
            window.location.href = '/login.html';
        }
        return false;
    }
    
    // Redirect to correct dashboard based on role and current page
    const path = window.location.pathname;
    const role = user.role;
    
    // If on wrong dashboard, redirect
    if (path.includes('/merchant/') && role !== 'restaurant_owner') {
        if (role === 'agency_partner' || role === 'agency') {
            window.location.href = '/partnership/accounts.html';
        } else {
            // Default to merchant dashboard
            window.location.href = '/merchant/dashboard.html';
        }
        return false;
    }
    
    if (path.includes('/partnership/') && role !== 'agency_partner' && role !== 'agency') {
        if (role === 'restaurant_owner') {
            window.location.href = '/merchant/dashboard.html';
        } else {
            // Default to merchant dashboard
            window.location.href = '/merchant/dashboard.html';
        }
        return false;
    }
    
    // Redirect admin pages to merchant dashboard
    if (path.includes('/admin/') || path.includes('/index.html')) {
        if (role === 'restaurant_owner') {
            window.location.href = '/merchant/dashboard.html';
        } else if (role === 'agency_partner' || role === 'agency') {
            window.location.href = '/partnership/accounts.html';
        } else {
            // Default to merchant dashboard
            window.location.href = '/merchant/dashboard.html';
        }
        return false;
    }
    
    return true;
}

// User Dropdown Toggle (for merchant pages)
function initUserDropdown() {
    const dropdownBtn = document.getElementById('userDropdownBtn');
    const dropdown = document.getElementById('userDropdown');
    
    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Initialize Dashboard
function initDashboard() {
    if (!checkAuth()) {
        return;
    }
    
    updateUserInfo();
    initUserDropdown();
    
    // Set active nav item based on current page
    const path = window.location.pathname;
    let currentPage = path.split('/').pop().replace('.html', '');
    
    // Handle index.html or root
    if (currentPage === 'index' || currentPage === '' || path === '/') {
        currentPage = 'dashboard';
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
