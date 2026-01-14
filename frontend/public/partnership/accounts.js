// Load Accounts Data
async function loadAccounts() {
    try {
        // Get current user (agency partner)
        const userStr = localStorage.getItem('partnership_user');
        const user = JSON.parse(userStr);
        
        // Get restaurants linked to this agency partner
        const restaurantsData = await apiRequest('/restaurants');
        let restaurants = restaurantsData?.restaurants || [];
        
        // Filter restaurants by agency_partner_id (only show merchants linked to this agency)
        restaurants = restaurants.filter(r => r.agency_partner_id === user.id);
        
        // Calculate summary stats
        const totalAccounts = restaurants.length;
        const paidAccounts = restaurants.filter(r => r.subscription_tier && r.subscription_tier !== 'free').length;
        const unpaidAccounts = totalAccounts - paidAccounts;
        const earnedThisMonth = restaurants.reduce((sum, r) => {
            // Mock calculation - in real app, this would come from payments/subscriptions
            if (r.subscription_tier && r.subscription_tier !== 'free') {
                return sum + 29.99; // Example monthly fee
            }
            return sum;
        }, 0);
        
        // Update summary cards
        document.getElementById('totalAccounts').textContent = totalAccounts;
        document.getElementById('paidAccounts').textContent = paidAccounts;
        document.getElementById('unpaidAccounts').textContent = unpaidAccounts;
        document.getElementById('earnedThisMonth').textContent = `$${earnedThisMonth.toFixed(2)}`;
        
        // Load restaurant owners for admin info
        const accountsTableBody = document.getElementById('accountsTableBody');
        
        if (restaurants.length === 0) {
            accountsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading-cell">No accounts found</td>
                </tr>
            `;
        } else {
            // Map restaurants to accounts (owner_name is already included from API)
            const accountsWithOwners = restaurants.map((restaurant) => {
                return {
                    ...restaurant,
                    adminName: restaurant.owner_name || 'N/A',
                    adminEmail: restaurant.email || 'N/A',
                    phone: restaurant.phone || 'N/A',
                    plan: restaurant.subscription_tier || 'Free',
                    country: restaurant.country || 'N/A',
                    lastMonthStatus: restaurant.subscription_tier && restaurant.subscription_tier !== 'free' ? 'Paid' : 'Unpaid',
                    memberSince: restaurant.created_at 
                        ? new Date(restaurant.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })
                        : 'N/A'
                };
            });
            
            accountsTableBody.innerHTML = accountsWithOwners.map((account, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${account.name || 'N/A'}</strong></td>
                    <td>${account.adminName || 'N/A'}</td>
                    <td>${account.adminEmail || 'N/A'}</td>
                    <td>${account.phone || 'N/A'}</td>
                    <td>
                        <span class="plan-badge">${account.plan.charAt(0).toUpperCase() + account.plan.slice(1)}</span>
                    </td>
                    <td>${account.country || 'N/A'}</td>
                    <td>
                        <span class="status-badge status-${account.lastMonthStatus.toLowerCase()}">
                            ${account.lastMonthStatus}
                        </span>
                    </td>
                    <td>${account.memberSince}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        document.getElementById('accountsTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="loading-cell">Error loading accounts. Please try again.</td>
            </tr>
        `;
    }
}

function showAddAccountModal() {
    alert('Add account functionality - To be implemented');
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
            loadAccounts();
        }
    });
} else {
    if (checkAuth()) {
        setActiveNav();
        loadAccounts();
    }
}
