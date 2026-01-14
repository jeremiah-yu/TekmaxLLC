// Copy functions
function copyPartnerCode() {
    const code = document.getElementById('partnerCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Partner code copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy. Please copy manually: ' + code);
    });
}

function copyLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

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
    let currentPage = path.split('/').pop().replace('.html', '');
    // Handle partner-code.html
    if (currentPage === 'partner-code') {
        currentPage = 'partner-code';
    }
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

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkAuth()) {
            setActiveNav();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
    }
}
