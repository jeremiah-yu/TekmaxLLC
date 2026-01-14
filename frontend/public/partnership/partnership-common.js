// Common JavaScript for all Partnership Pages
// Handles dropdown menus and common functionality

// Initialize on page load
(function() {
    'use strict';
    
    function init() {
        // Check if user is on correct portal
        checkUserPortal();
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Check if user is on the correct portal (partnership vs merchant)
    function checkUserPortal() {
        const userStr = localStorage.getItem('partnership_user');
        if (!userStr) return;
        
        try {
            const user = JSON.parse(userStr);
            // If merchant account is logged in but on partnership pages, redirect
            if (user.role === 'restaurant_owner') {
                console.warn('Merchant account detected on partnership portal, redirecting...');
                localStorage.removeItem('partnership_token');
                localStorage.removeItem('partnership_user');
                window.location.href = '/login.html';
                return;
            }
            // If partnership account is logged in, ensure they're not on merchant pages
            if ((user.role === 'agency_partner' || user.role === 'agency') && window.location.pathname.includes('/merchant/')) {
                console.warn('Partnership account detected on merchant portal, redirecting...');
                localStorage.removeItem('partnership_token');
                localStorage.removeItem('partnership_user');
                window.location.href = '/partnership/login.html';
                return;
            }
        } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem('partnership_token');
            localStorage.removeItem('partnership_user');
        }
    }
})();
