// Load Usage Data
async function loadUsage() {
    try {
        const ordersData = await apiRequest('/orders');
        const restaurantsData = await apiRequest('/restaurants');
        
        const orders = ordersData?.orders || [];
        const restaurants = restaurantsData?.restaurants || [];
        
        const totalOrders = orders.length;
        const thisMonth = new Date().getMonth();
        const thisMonthOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.getMonth() === thisMonth;
        }).length;
        const activeAccounts = restaurants.filter(r => r.is_active).length;
        
        // Update summary
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('thisMonthOrders').textContent = thisMonthOrders;
        document.getElementById('activeAccounts').textContent = activeAccounts;
        
        // Try to fetch API calls from API if available
        try {
            const usageData = await apiRequest('/partnership/usage');
            document.getElementById('apiCalls').textContent = usageData?.api_calls || '0';
        } catch (apiError) {
            document.getElementById('apiCalls').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading usage:', error);
    }
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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
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

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkAuth()) {
            setActiveNav();
            loadUsage();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
        loadUsage();
    }
}
