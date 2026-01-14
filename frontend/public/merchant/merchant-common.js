// Common JavaScript for all Merchant Pages
// Handles dropdown menus and common functionality

// Initialize dropdown menus on page load
(function() {
    'use strict';
    
    function init() {
        // Check if user is on correct portal
        checkUserPortal();
        
        // Use setTimeout to ensure DOM is fully ready and other scripts have loaded
        setTimeout(function() {
            initializeDropdowns();
            initializeLogout();
        }, 50);
    }
    
    // Check if user is on the correct portal (merchant vs partnership)
    function checkUserPortal() {
        const userStr = localStorage.getItem('merchant_user');
        if (!userStr) return;
        
        try {
            const user = JSON.parse(userStr);
            // If partnership account is logged in but on merchant pages, redirect
            if (user.role === 'agency_partner' || user.role === 'agency') {
                console.warn('Partnership account detected on merchant portal, redirecting...');
                localStorage.removeItem('merchant_token');
                localStorage.removeItem('merchant_user');
                window.location.href = '/partnership/login.html';
                return;
            }
            // If merchant account is logged in, ensure they're not on partnership pages
            if (user.role === 'restaurant_owner' && window.location.pathname.includes('/partnership/')) {
                console.warn('Merchant account detected on partnership portal, redirecting...');
                localStorage.removeItem('merchant_token');
                localStorage.removeItem('merchant_user');
                window.location.href = '/login.html';
                return;
            }
        } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem('merchant_token');
            localStorage.removeItem('merchant_user');
        }
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Initialize dropdown menus
    function initializeDropdowns() {
        const userDropdownBtn = document.getElementById('userDropdownBtn');
        const userDropdown = document.getElementById('userDropdown');
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');

        // User dropdown
        if (userDropdownBtn && userDropdown) {
            // Remove any existing listeners by cloning
            const newBtn = userDropdownBtn.cloneNode(true);
            userDropdownBtn.parentNode.replaceChild(newBtn, userDropdownBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown && dropdown.classList.contains('show')) {
                    if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                }
            });
        }

        // Notification dropdown is handled by notifications.js
        // No need to duplicate the logic here
    }

    // Initialize logout functionality
    function initializeLogout() {
        // Make handleLogout available globally
        window.handleLogout = function() {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('merchant_token');
                localStorage.removeItem('merchant_user');
                window.location.href = '/login.html';
            }
        };
    }
})();
