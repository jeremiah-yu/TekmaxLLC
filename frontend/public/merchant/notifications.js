// Notifications System
let notifications = [];

// Load Notifications
async function loadNotifications() {
    try {
        const data = await apiRequest('/notifications');
        notifications = data?.notifications || [];
        
        // Ensure notifications have proper structure
        notifications = notifications.map(notif => ({
            id: notif.id,
            type: notif.type || 'system',
            title: notif.title || 'Notification',
            message: notif.message || '',
            is_read: notif.is_read || false,
            created_at: notif.created_at
        }));

        updateNotificationBadge();
        return notifications;
    } catch (error) {
        console.error('Error loading notifications:', error);
        // Fallback to empty array if API fails
        notifications = [];
        updateNotificationBadge();
        return [];
    }
}

// Update Notification Badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badges = document.querySelectorAll('.merchant-notification-badge');
    
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Clear All Notifications
window.clearAllNotifications = async function() {
    try {
        await apiRequest('/notifications/read-all', {
            method: 'PATCH'
        });
        
        // Update local state
        notifications.forEach(n => n.is_read = true);
        updateNotificationBadge();
        showNotificationDropdown();
    } catch (error) {
        console.error('Error clearing notifications:', error);
        alert('Failed to clear notifications. Please try again.');
    }
};

// Show Notification Dropdown
async function showNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) {
        console.error('Notification dropdown not found');
        return;
    }

    // Reload notifications when opening dropdown to get latest
    await loadNotifications();

    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    let dropdownContent = '';
    if (unreadNotifications.length === 0) {
        dropdownContent = `
            <div class="merchant-notification-empty">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p>No new notifications</p>
            </div>
        `;
    } else {
        dropdownContent = `
            <div class="merchant-notification-header">
                <h3>Notifications (${unreadNotifications.length})</h3>
                <button class="merchant-notification-clear-btn" onclick="clearAllNotifications()">Clear All</button>
            </div>
            <div class="merchant-notification-list">
                ${unreadNotifications.map(notif => {
                    const timeAgo = getTimeAgo(new Date(notif.created_at));
                    return `
                        <div class="merchant-notification-item" data-id="${notif.id}" onclick="markAsRead('${notif.id}')">
                            <div class="merchant-notification-icon merchant-notification-icon-${notif.type}">
                                ${getNotificationIcon(notif.type)}
                            </div>
                            <div class="merchant-notification-content">
                                <h4 class="merchant-notification-title">${notif.title}</h4>
                                <p class="merchant-notification-message">${notif.message}</p>
                                <span class="merchant-notification-time">${timeAgo}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    dropdown.innerHTML = dropdownContent;
    dropdown.classList.toggle('show');
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        order: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
        delivery: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
        system: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    return icons[type] || icons.system;
}

// Get Time Ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Mark Notification as Read
window.markAsRead = async function(notificationId) {
    try {
        await apiRequest(`/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        
        // Update local state
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
            updateNotificationBadge();
            showNotificationDropdown();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        // Still update UI even if API call fails
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
            updateNotificationBadge();
            showNotificationDropdown();
        }
    }
};

// Make clearAllNotifications globally accessible
window.clearAllNotifications = clearAllNotifications;

// Initialize Notifications
function initNotifications() {
    // Find notification button
    const notificationBtn = document.getElementById('notificationBtn') || document.querySelector('.merchant-icon-btn[title="Notifications"]');
    
    if (!notificationBtn) {
        console.warn('Notification button not found');
        return;
    }

    // Ensure dropdown exists
    let dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'notificationDropdown';
        dropdown.className = 'merchant-notification-dropdown';
        // Insert after the button's parent (header-actions)
        const headerActions = notificationBtn.closest('.merchant-header-actions');
        if (headerActions) {
            headerActions.appendChild(dropdown);
        }
    }

    // Add click handler to notification button
    notificationBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await showNotificationDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const btn = document.getElementById('notificationBtn') || document.querySelector('.merchant-icon-btn[title="Notifications"]');
        if (dropdown && !dropdown.contains(e.target) && !btn?.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Load notifications on page load
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    setInterval(() => {
        loadNotifications();
    }, 30000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}
